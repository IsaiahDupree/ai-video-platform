"""
Remotion Worker
===============
Event-driven worker for Remotion video rendering.

Subscribes to:
    - remotion.requested
    - tts.completed (for TTS audio integration)
    - matting.completed (for matting output integration)

Emits:
    - remotion.started
    - remotion.composing
    - remotion.rendering
    - remotion.progress
    - remotion.completed
    - remotion.failed
"""

import asyncio
import logging
import subprocess
import json
from typing import Dict, Any, Optional
from pathlib import Path
from datetime import datetime, timezone

from services.event_bus import EventBus, Event, Topics
from services.workers.base import BaseWorker

from .models import RemotionRequest, RemotionResponse, RemotionJobStatus, Layer, AudioTrack, SourceType
from .composer import RemotionComposer
from .source_loader import SourceLoader

logger = logging.getLogger(__name__)


class RemotionWorker(BaseWorker):
    """
    Worker for processing Remotion rendering requests.
    
    Supports:
        - Multi-source loading (local, URL, TTS, MediaPoster, matting)
        - Dynamic composition generation
        - Remotion CLI rendering
        - Progress tracking
    
    Usage:
        worker = RemotionWorker()
        await worker.start()
        
        # Worker will automatically process events from:
        # - remotion.requested
        # - tts.completed (for audio integration)
        # - matting.completed (for matting integration)
    """
    
    def __init__(self, event_bus: Optional[EventBus] = None, worker_id: Optional[str] = None):
        super().__init__(event_bus, worker_id)
        self._jobs: Dict[str, RemotionJobStatus] = {}
        self._pending_sources: Dict[str, Dict[str, Any]] = {}  # Track pending source loads
        self.composer = RemotionComposer()
        self.source_loader = SourceLoader()
    
    def get_subscriptions(self) -> list:
        """Subscribe to Remotion and related events."""
        return [
            Topics.REMOTION_REQUESTED,
            Topics.TTS_COMPLETED,  # For TTS audio integration
            Topics.MATTING_COMPLETED,  # For matting output integration
        ]
    
    async def handle_event(self, event: Event) -> None:
        """Process Remotion and related events."""
        if event.topic == Topics.REMOTION_REQUESTED:
            await self._handle_render_request(event)
        elif event.topic == Topics.TTS_COMPLETED:
            await self._handle_tts_completed(event)
        elif event.topic == Topics.MATTING_COMPLETED:
            await self._handle_matting_completed(event)
    
    async def _handle_render_request(self, event: Event) -> None:
        """Handle Remotion render request."""
        try:
            # Parse request from event payload
            request = self._parse_request(event.payload)
            
            if not request:
                logger.error(f"[{self.worker_id}] Invalid Remotion request in event")
                await self.emit(
                    Topics.REMOTION_FAILED,
                    {
                        "error": "Invalid request payload",
                        "correlation_id": event.correlation_id
                    },
                    event.correlation_id
                )
                return
            
            # Create job status
            job_status = RemotionJobStatus(
                job_id=request.job_id,
                status="pending",
                correlation_id=request.correlation_id
            )
            self._jobs[request.job_id] = job_status
            
            # Emit started event
            await self.emit(
                Topics.REMOTION_STARTED,
                {
                    "job_id": request.job_id,
                    "composition": request.composition,
                    "correlation_id": request.correlation_id
                },
                request.correlation_id
            )
            
            # Process the request
            await self._process_request(request, job_status)
            
        except Exception as e:
            logger.error(f"[{self.worker_id}] Error processing Remotion event: {e}", exc_info=True)
            await self.emit(
                Topics.REMOTION_FAILED,
                {
                    "error": str(e),
                    "correlation_id": event.correlation_id
                },
                event.correlation_id
            )
    
    async def _handle_tts_completed(self, event: Event) -> None:
        """Handle TTS completion - check if any pending jobs need this audio."""
        audio_path = event.payload.get("audio_path")
        tts_job_id = event.payload.get("job_id")
        
        if not audio_path or not tts_job_id:
            return
        
        # Check if any pending jobs are waiting for this TTS output
        for job_id, pending_sources in self._pending_sources.items():
            if f"tts:{tts_job_id}" in pending_sources:
                logger.info(f"[{self.worker_id}] TTS output ready for job {job_id}")
                # Update source and continue processing
                pending_sources[f"tts:{tts_job_id}"] = audio_path
                # TODO: Trigger job continuation
    
    async def _handle_matting_completed(self, event: Event) -> None:
        """Handle matting completion - check if any pending jobs need this output."""
        output_path = event.payload.get("output_path")
        matting_job_id = event.payload.get("job_id")
        
        if not output_path or not matting_job_id:
            return
        
        # Check if any pending jobs are waiting for this matting output
        for job_id, pending_sources in self._pending_sources.items():
            if f"matting:{matting_job_id}" in pending_sources:
                logger.info(f"[{self.worker_id}] Matting output ready for job {job_id}")
                # Update source and continue processing
                pending_sources[f"matting:{matting_job_id}"] = output_path
                # TODO: Trigger job continuation
    
    def _parse_request(self, payload: Dict[str, Any]) -> Optional[RemotionRequest]:
        """Parse Remotion request from event payload."""
        try:
            from .models import CaptionConfig
            
            # Parse layers if present
            layers = None
            if "layers" in payload:
                layers = [
                    Layer(**layer_data) for layer_data in payload["layers"]
                ]
            
            # Parse audio if present
            audio = None
            if "audio" in payload:
                audio = [
                    AudioTrack(**audio_data) for audio_data in payload["audio"]
                ]
            
            # Parse captions if present
            captions = None
            if "captions" in payload:
                captions_data = payload["captions"]
                captions = CaptionConfig(
                    enabled=captions_data.get("enabled", True),
                    style=captions_data.get("style", "burned_in"),
                    source=captions_data.get("source"),
                    emphasis_words=captions_data.get("emphasis_words", True),
                    position=captions_data.get("position", "bottom")
                )
            
            return RemotionRequest(
                composition=payload.get("composition", "MainComposition"),
                timeline=payload.get("timeline"),
                layers=layers,
                audio=audio,
                captions=captions,
                output=payload.get("output", {"format": "mp4", "resolution": "1080x1920", "fps": 30}),
                props=payload.get("props"),
                output_path=payload.get("output_path"),
                correlation_id=payload.get("correlation_id"),
                job_id=payload.get("job_id")
            )
        except Exception as e:
            logger.error(f"Failed to parse Remotion request: {e}")
            return None
    
    async def _process_request(self, request: RemotionRequest, job_status: RemotionJobStatus) -> None:
        """Process a Remotion rendering request."""
        job_status.status = "processing"
        job_status.started_at = datetime.now(timezone.utc)
        
        try:
            # Emit composing event
            await self.emit(
                Topics.REMOTION_COMPOSING,
                {
                    "job_id": request.job_id,
                    "progress": 0.1,
                    "message": "Building composition...",
                    "correlation_id": request.correlation_id
                },
                request.correlation_id
            )
            job_status.status = "composing"
            job_status.progress = 0.1
            
            # Build composition
            composition_data = await self.composer.build_composition(request)
            
            # Emit rendering event
            await self.emit(
                Topics.REMOTION_RENDERING,
                {
                    "job_id": request.job_id,
                    "progress": 0.3,
                    "message": "Rendering video...",
                    "correlation_id": request.correlation_id
                },
                request.correlation_id
            )
            job_status.status = "rendering"
            job_status.progress = 0.3
            
            # Render using Remotion CLI
            output_path = await self._render_with_remotion(
                request,
                composition_data,
                job_status
            )
            
            if output_path and Path(output_path).exists():
                # Get file stats
                file_size_mb = Path(output_path).stat().st_size / (1024 * 1024)
                
                # Estimate duration (simplified)
                duration = self._estimate_duration(output_path)
                
                job_status.status = "completed"
                job_status.completed_at = datetime.now(timezone.utc)
                job_status.progress = 1.0
                
                response = RemotionResponse(
                    job_id=request.job_id,
                    success=True,
                    video_path=output_path,
                    duration_seconds=duration,
                    file_size_mb=file_size_mb,
                    render_time=(datetime.now(timezone.utc) - job_status.started_at).total_seconds(),
                    correlation_id=request.correlation_id
                )
                job_status.response = response
                
                # Emit completion event
                await self.emit(
                    Topics.REMOTION_COMPLETED,
                    {
                        "job_id": response.job_id,
                        "video_path": response.video_path,
                        "video_url": response.video_url,
                        "duration_seconds": response.duration_seconds,
                        "file_size_mb": response.file_size_mb,
                        "render_time": response.render_time,
                        "correlation_id": response.correlation_id
                    },
                    response.correlation_id
                )
            else:
                job_status.status = "failed"
                job_status.error = "Remotion rendering failed - output file not found"
                job_status.completed_at = datetime.now(timezone.utc)
                
                await self.emit(
                    Topics.REMOTION_FAILED,
                    {
                        "job_id": request.job_id,
                        "error": job_status.error,
                        "correlation_id": request.correlation_id
                    },
                    request.correlation_id
                )
                
        except Exception as e:
            logger.error(f"[{self.worker_id}] Remotion processing error: {e}", exc_info=True)
            job_status.status = "failed"
            job_status.error = str(e)
            job_status.completed_at = datetime.now(timezone.utc)
            
            await self.emit(
                Topics.REMOTION_FAILED,
                {
                    "job_id": request.job_id,
                    "error": str(e),
                    "correlation_id": request.correlation_id
                },
                request.correlation_id
            )
    
    async def _render_with_remotion(
        self,
        request: RemotionRequest,
        composition_data: Dict[str, Any],
        job_status: RemotionJobStatus
    ) -> Optional[str]:
        """Render video using Remotion CLI."""
        remotion_dir = self.composer.remotion_dir
        
        if not remotion_dir.exists():
            raise Exception(f"Remotion directory not found: {remotion_dir}")
        
        # Determine output path
        if request.output_path:
            output_path = Path(request.output_path)
        else:
            output_dir = Path("data/remotion_outputs")
            output_dir.mkdir(parents=True, exist_ok=True)
            output_path = output_dir / f"{request.job_id}.mp4"
        
        # Get composition name and props
        composition_id = request.composition
        props_path = composition_data.get("props_path")
        
        # Build Remotion CLI command
        # Remotion CLI format: npx remotion render <composition-id> <output> [options]
        cmd = [
            "npx", "remotion", "render",
            composition_id,
            str(output_path),
        ]
        
        # Add props if available
        if props_path and Path(props_path).exists():
            cmd.extend(["--props", str(props_path)])
        
        # Add codec options
        cmd.extend([
            "--codec", "h264",
            "--pixel-format", "yuv420p",
        ])
        
        # Add resolution if specified
        if request.output and "resolution" in request.output:
            width, height = request.output["resolution"].split("x")
            cmd.extend(["--width", width, "--height", height])
        
        # Add FPS if specified
        if request.output and "fps" in request.output:
            cmd.extend(["--fps", str(request.output["fps"])])
        
        logger.info(f"[{self.worker_id}] Rendering with Remotion CLI: {' '.join(cmd)}")
        
        # Run Remotion CLI
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=str(remotion_dir),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                logger.info(f"[{self.worker_id}] Remotion render completed: {output_path}")
                return str(output_path)
            else:
                error_msg = stderr.decode() if stderr else "Unknown error"
                logger.error(f"[{self.worker_id}] Remotion render failed: {error_msg}")
                raise Exception(f"Remotion render failed: {error_msg}")
                
        except FileNotFoundError:
            raise Exception("Remotion CLI not found. Install with: npm install -g @remotion/cli")
        except Exception as e:
            logger.error(f"[{self.worker_id}] Remotion CLI error: {e}")
            raise
    
    def _estimate_duration(self, video_path: Path) -> float:
        """Estimate video duration using ffprobe."""
        try:
            result = subprocess.run(
                [
                    "ffprobe", "-v", "error",
                    "-show_entries", "format=duration",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    str(video_path)
                ],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                return float(result.stdout.strip())
        except Exception:
            pass
        return 0.0
    
    def get_job_status(self, job_id: str) -> Optional[RemotionJobStatus]:
        """Get status of a Remotion job."""
        return self._jobs.get(job_id)

