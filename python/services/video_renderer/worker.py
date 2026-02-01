"""
Video Renderer Worker
=====================
Event-driven worker for video rendering using adapter pattern.

Supports:
- Motion Canvas (default)
- Remotion (fallback)

Uses adapter pattern to switch between rendering engines.
"""

import asyncio
import logging
from typing import Dict, Any, Optional
from pathlib import Path
from datetime import datetime, timezone

from services.event_bus import EventBus, Event, Topics
from services.workers.base import BaseWorker

from .factory import VideoRendererFactory
from .base import RenderRequest, RenderResponse, RenderJobStatus, RenderEngine, Layer, AudioTrack
from uuid import uuid4
from .motion_canvas_adapter import MotionCanvasAdapter
from .remotion_adapter import RemotionAdapter

logger = logging.getLogger(__name__)


class VideoRendererWorker(BaseWorker):
    """
    Worker for processing video rendering requests.
    
    Uses adapter pattern to support multiple rendering engines:
    - Motion Canvas (default, open-source)
    - Remotion (fallback, React-based)
    
    Subscribes to:
        - remotion.requested (legacy, will be renamed to video.render.requested)
        - tts.completed (for TTS audio integration)
        - matting.completed (for matting output integration)
    
    Emits:
        - remotion.started / video.render.started
        - remotion.composing / video.render.composing
        - remotion.rendering / video.render.rendering
        - remotion.progress / video.render.progress
        - remotion.completed / video.render.completed
        - remotion.failed / video.render.failed
    """
    
    def __init__(self, event_bus: Optional[EventBus] = None, worker_id: Optional[str] = None):
        super().__init__(event_bus, worker_id)
        self._jobs: Dict[str, RenderJobStatus] = {}
        
        # Create renderer adapter (default: Motion Canvas)
        self.renderer = VideoRendererFactory.create_default()
        logger.info(f"[{self.worker_id}] Using renderer: {self.renderer.get_engine_name()}")
    
    def get_subscriptions(self) -> list:
        """Subscribe to rendering and related events."""
        return [
            Topics.REMOTION_REQUESTED,  # Legacy support
            Topics.TTS_COMPLETED,  # For TTS audio integration
            Topics.MATTING_COMPLETED,  # For matting output integration
        ]
    
    async def handle_event(self, event: Event) -> None:
        """Process rendering and related events."""
        if event.topic == Topics.REMOTION_REQUESTED:
            await self._handle_render_request(event)
        elif event.topic == Topics.TTS_COMPLETED:
            await self._handle_tts_completed(event)
        elif event.topic == Topics.MATTING_COMPLETED:
            await self._handle_matting_completed(event)
    
    async def _handle_render_request(self, event: Event) -> None:
        """Handle video render request."""
        try:
            # Parse request from event payload
            request = self._parse_request(event.payload)
            
            if not request:
                logger.error(f"[{self.worker_id}] Invalid render request in event")
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
            job_status = RenderJobStatus(
                job_id=request.job_id,
                status="pending",
                started_at=datetime.now(timezone.utc)
            )
            self._jobs[request.job_id] = job_status
            
            # Emit started event
            await self.emit(
                Topics.REMOTION_STARTED,
                {
                    "job_id": request.job_id,
                    "engine": self.renderer.get_engine_name().value,
                    "correlation_id": event.correlation_id
                },
                event.correlation_id
            )
            
            # Process render request
            await self._process_request(request, job_status, event.correlation_id)
            
        except Exception as e:
            logger.error(f"[{self.worker_id}] Error processing render event: {e}", exc_info=True)
            await self.emit(
                Topics.REMOTION_FAILED,
                {
                    "error": str(e),
                    "correlation_id": event.correlation_id
                },
                event.correlation_id
            )
    
    def _parse_request(self, payload: Dict[str, Any]) -> Optional[RenderRequest]:
        """Parse render request from event payload."""
        try:
            # Convert RemotionRequest format to RenderRequest format
            # (for backward compatibility)
            
            job_id = payload.get("job_id") or payload.get("id") or str(uuid4())
            composition = payload.get("composition") or payload.get("composition_id") or "MainComposition"
            
            # Convert layers
            layers = []
            for layer_data in payload.get("layers", []):
                layers.append(Layer(
                    id=layer_data.get("id", f"layer_{len(layers)}"),
                    type=layer_data.get("type", "video"),
                    source=layer_data.get("source"),
                    position=layer_data.get("position"),
                    start=layer_data.get("start", 0.0),
                    end=layer_data.get("end"),
                    opacity=layer_data.get("opacity", 1.0),
                    style=layer_data.get("style"),
                    animation=layer_data.get("animation"),
                    content=layer_data.get("content"),
                ))
            
            # Convert audio tracks
            audio_tracks = []
            for audio_data in payload.get("audio_tracks", []):
                audio_tracks.append(AudioTrack(
                    id=audio_data.get("id", f"audio_{len(audio_tracks)}"),
                    source=audio_data.get("source"),
                    start=audio_data.get("start", 0.0),
                    volume=audio_data.get("volume", 1.0),
                    ducking=audio_data.get("ducking"),
                ))
            
            duration = payload.get("duration") or payload.get("duration_seconds") or 30.0
            fps = payload.get("fps") or 30
            resolution = payload.get("resolution") or payload.get("output", {}).get("resolution")
            
            return RenderRequest(
                job_id=job_id,
                composition=composition,
                layers=layers,
                audio_tracks=audio_tracks,
                duration=duration,
                fps=fps,
                resolution=resolution,
                output_path=payload.get("output_path"),
                metadata=payload.get("metadata"),
            )
        except Exception as e:
            logger.error(f"Failed to parse render request: {e}")
            return None
    
    async def _process_request(
        self,
        request: RenderRequest,
        job_status: RenderJobStatus,
        correlation_id: str
    ) -> None:
        """Process a video rendering request."""
        try:
            job_status.status = "composing"
            job_status.current_stage = "composing"
            
            await self.emit(
                Topics.REMOTION_COMPOSING,
                {
                    "job_id": request.job_id,
                    "correlation_id": correlation_id
                },
                correlation_id
            )
            
            # Progress callback
            async def on_progress(progress: float):
                job_status.progress = progress
                await self.emit(
                    Topics.REMOTION_PROGRESS,
                    {
                        "job_id": request.job_id,
                        "progress": progress,
                        "stage": job_status.current_stage,
                        "correlation_id": correlation_id
                    },
                    correlation_id
                )
            
            # Render using adapter
            job_status.status = "rendering"
            job_status.current_stage = "rendering"
            
            response = await self.renderer.render(
                request=request,
                on_progress=lambda p: asyncio.create_task(on_progress(p))
            )
            
            job_status.status = "completed"
            job_status.completed_at = datetime.now(timezone.utc)
            job_status.output_path = response.video_path
            job_status.progress = 1.0
            
            # Emit completion
            await self.emit(
                Topics.REMOTION_COMPLETED,
                {
                    "job_id": request.job_id,
                    "video_path": response.video_path,
                    "duration_seconds": response.duration_seconds,
                    "file_size_bytes": response.file_size_bytes,
                    "render_time_seconds": response.render_time_seconds,
                    "engine_used": response.engine_used.value,
                    "correlation_id": correlation_id
                },
                correlation_id
            )
            
            logger.info(f"[{self.worker_id}] Render complete: {response.video_path}")
            
        except Exception as e:
            logger.error(f"[{self.worker_id}] Render processing error: {e}", exc_info=True)
            job_status.status = "failed"
            job_status.error = str(e)
            job_status.completed_at = datetime.now(timezone.utc)
            
            await self.emit(
                Topics.REMOTION_FAILED,
                {
                    "job_id": request.job_id,
                    "error": str(e),
                    "correlation_id": correlation_id
                },
                correlation_id
            )
    
    async def _handle_tts_completed(self, event: Event) -> None:
        """Handle TTS completion (for audio integration)."""
        # TODO: Integrate TTS audio into pending render jobs
        pass
    
    async def _handle_matting_completed(self, event: Event) -> None:
        """Handle matting completion (for video integration)."""
        # TODO: Integrate matting output into pending render jobs
        pass

