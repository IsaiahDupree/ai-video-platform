"""
Format-Agnostic Video Renderer Worker
=====================================
Event-driven worker for format-agnostic video rendering.

Subscribes to:
    - video.render.requested (format-based rendering requests)
    - tts.completed (for voice audio integration)
    - visuals.completed (for visual asset integration)

Emits:
    - video.render.started
    - video.render.scene_graph.built
    - video.render.scene.started/completed
    - video.render.progress
    - video.render.composing
    - video.render.completed/failed
"""

import asyncio
import logging
from typing import Dict, Any, Optional, List
from pathlib import Path
from datetime import datetime, timezone
from uuid import uuid4

from services.event_bus import EventBus, Event, Topics
from services.workers.base import BaseWorker

from .renderer import VideoRenderService
from .formats import FORMAT_REGISTRY
from .factory import VideoRendererFactory
from .base import RenderRequest, RenderResponse, Layer, AudioTrack

logger = logging.getLogger(__name__)


class FormatVideoRenderWorker(BaseWorker):
    """
    Worker for processing format-agnostic video rendering requests.
    
    Architecture:
    Content → Format → Scene Graph → Render
    
    Supports all formats:
    - explainer_v1
    - listicle_v1
    - comparison_v1
    - narrative_v1
    - shorts_v1
    """
    
    def __init__(self, event_bus: Optional[EventBus] = None, worker_id: Optional[str] = None):
        super().__init__(event_bus, worker_id)
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self.render_service = VideoRenderService()
        
        # Create renderer adapter (default: Motion Canvas)
        self.renderer = VideoRendererFactory.create_default()
        logger.info(f"[{self.worker_id}] Format Video Render Worker initialized")
        logger.info(f"[{self.worker_id}] Available formats: {list(FORMAT_REGISTRY.keys())}")
        logger.info(f"[{self.worker_id}] Using renderer: {self.renderer.get_engine_name()}")
        
        # Track pending TTS/Visuals for job integration
        self._pending_tts: Dict[str, Dict[str, Any]] = {}  # correlation_id -> TTS data
        self._pending_visuals: Dict[str, Dict[str, Any]] = {}  # correlation_id -> Visuals data
    
    def get_subscriptions(self) -> List[str]:
        """Subscribe to rendering and related events."""
        return [
            Topics.VIDEO_RENDER_REQUESTED,
            Topics.TTS_COMPLETED,  # For voice audio integration
            Topics.VISUALS_COMPLETED,  # For visual asset integration
        ]
    
    async def handle_event(self, event: Event) -> None:
        """Process rendering and related events."""
        if event.topic == Topics.VIDEO_RENDER_REQUESTED:
            await self._handle_render_request(event)
        elif event.topic == Topics.TTS_COMPLETED:
            await self._handle_tts_completed(event)
        elif event.topic == Topics.VISUALS_COMPLETED:
            await self._handle_visuals_completed(event)
    
    async def _handle_render_request(self, event: Event) -> None:
        """Handle format-based video render request."""
        try:
            payload = event.payload
            job_id = payload.get("job_id") or str(uuid4())
            content = payload.get("content")
            format_id = payload.get("format_id")
            adapter = payload.get("adapter", "motion_canvas")
            
            if not content:
                raise ValueError("Missing 'content' in request payload")
            if not format_id:
                raise ValueError("Missing 'format_id' in request payload")
            
            if format_id not in FORMAT_REGISTRY:
                raise ValueError(f"Invalid format_id: {format_id}. Available: {list(FORMAT_REGISTRY.keys())}")
            
            # Create job tracking
            job = {
                "job_id": job_id,
                "format_id": format_id,
                "adapter": adapter,
                "status": "pending",
                "started_at": datetime.now(timezone.utc),
                "scenes": [],
                "progress": 0.0,
                "correlation_id": event.correlation_id,
            }
            self._jobs[job_id] = job
            
            # Emit started event
            await self.emit(
                Topics.VIDEO_RENDER_STARTED,
                {
                    "job_id": job_id,
                    "format_id": format_id,
                    "format_name": FORMAT_REGISTRY[format_id].get("name"),
                    "adapter": adapter,
                    "correlation_id": event.correlation_id,
                },
                event.correlation_id
            )
            
            # Process render request
            await self._process_format_render(job, content, format_id, adapter, event.correlation_id)
            
        except Exception as e:
            logger.error(f"[{self.worker_id}] Error processing render event: {e}", exc_info=True)
            job_id = event.payload.get("job_id", "unknown")
            await self.emit(
                Topics.VIDEO_RENDER_FAILED,
                {
                    "job_id": job_id,
                    "error": str(e),
                    "correlation_id": event.correlation_id,
                },
                event.correlation_id
            )
    
    async def _process_format_render(
        self,
        job: Dict[str, Any],
        content: Dict[str, Any],
        format_id: str,
        adapter: str,
        correlation_id: str
    ) -> None:
        """Process format-based video rendering."""
        try:
            job["status"] = "building_scene_graph"
            
            # Build scene graph
            logger.info(f"[{self.worker_id}] Building scene graph for format: {format_id}")
            scene_graph = self.render_service.build_scene_graph(content, format_id)
            
            job["scene_count"] = len(scene_graph)
            job["scenes"] = scene_graph
            
            # Emit scene graph built event
            await self.emit(
                Topics.VIDEO_RENDER_SCENE_GRAPH_BUILT,
                {
                    "job_id": job["job_id"],
                    "format_id": format_id,
                    "scene_count": len(scene_graph),
                    "total_duration": sum(s.get("duration", 0) for s in scene_graph),
                    "correlation_id": correlation_id,
                },
                correlation_id
            )
            
            # Render scenes using adapter
            job["status"] = "rendering"
            
            total_scenes = len(scene_graph)
            rendered_scenes = []
            
            # Check for pending TTS/Visuals
            tts_audio = self._pending_tts.get(correlation_id)
            visuals_assets = self._pending_visuals.get(correlation_id)
            
            for i, scene in enumerate(scene_graph):
                scene_type = scene.get("scene_type", "Unknown")
                scene_duration = scene.get("duration", 0)
                scene_data = scene.get("data", {})
                scene_format = scene.get("format", {})
                
                # Emit scene started
                await self.emit(
                    Topics.VIDEO_RENDER_SCENE_STARTED,
                    {
                        "job_id": job["job_id"],
                        "scene_index": i,
                        "scene_type": scene_type,
                        "duration": scene_duration,
                        "correlation_id": correlation_id,
                    },
                    correlation_id
                )
                
                # Convert scene to RenderRequest
                render_request = self._scene_to_render_request(
                    scene=scene,
                    job_id=f"{job['job_id']}_scene_{i}",
                    tts_audio=tts_audio,
                    visuals_assets=visuals_assets,
                )
                
                # Render scene using adapter
                try:
                    async def on_progress(progress: float):
                        # Scene-level progress (0.0 to 1.0)
                        scene_progress = (i + progress) / total_scenes
                        job["progress"] = scene_progress
                        await self.emit(
                            Topics.VIDEO_RENDER_PROGRESS,
                            {
                                "job_id": job["job_id"],
                                "progress": scene_progress,
                                "scenes_completed": i,
                                "total_scenes": total_scenes,
                                "current_scene_progress": progress,
                                "correlation_id": correlation_id,
                            },
                            correlation_id
                        )
                    
                    response = await self.renderer.render(
                        request=render_request,
                        on_progress=on_progress
                    )
                    
                    rendered_scenes.append({
                        "scene_index": i,
                        "video_path": response.video_path,
                        "duration": response.duration_seconds,
                    })
                    
                except Exception as e:
                    logger.error(f"[{self.worker_id}] Scene {i} render failed: {e}")
                    # Continue with other scenes
                    rendered_scenes.append({
                        "scene_index": i,
                        "video_path": None,
                        "error": str(e),
                    })
                
                # Emit scene completed
                await self.emit(
                    Topics.VIDEO_RENDER_SCENE_COMPLETED,
                    {
                        "job_id": job["job_id"],
                        "scene_index": i,
                        "scene_type": scene_type,
                        "video_path": rendered_scenes[-1].get("video_path"),
                        "correlation_id": correlation_id,
                    },
                    correlation_id
                )
                
                # Update progress
                progress = (i + 1) / total_scenes
                job["progress"] = progress
                
                await self.emit(
                    Topics.VIDEO_RENDER_PROGRESS,
                    {
                        "job_id": job["job_id"],
                        "progress": progress,
                        "scenes_completed": i + 1,
                        "total_scenes": total_scenes,
                        "correlation_id": correlation_id,
                    },
                    correlation_id
                )
            
            job["rendered_scenes"] = rendered_scenes
            
            # Compose final video from rendered scenes
            job["status"] = "composing"
            await self.emit(
                Topics.VIDEO_RENDER_COMPOSING,
                {
                    "job_id": job["job_id"],
                    "correlation_id": correlation_id,
                },
                correlation_id
            )
            
            # Compose final video using FFmpeg
            final_video_path = await self._compose_final_video(
                job_id=job["job_id"],
                rendered_scenes=rendered_scenes,
                format_config=FORMAT_REGISTRY[format_id],
                correlation_id=correlation_id
            )
            
            job["status"] = "completed"
            job["completed_at"] = datetime.now(timezone.utc)
            job["final_video_path"] = final_video_path
            
            # Emit completion
            await self.emit(
                Topics.VIDEO_RENDER_COMPLETED,
                {
                    "job_id": job["job_id"],
                    "format_id": format_id,
                    "scene_count": total_scenes,
                    "total_duration": sum(s.get("duration", 0) for s in scene_graph),
                    "adapter": adapter,
                    "final_video_path": final_video_path,
                    "correlation_id": correlation_id,
                },
                correlation_id
            )
            
            # Clean up pending TTS/Visuals
            self._pending_tts.pop(correlation_id, None)
            self._pending_visuals.pop(correlation_id, None)
            
            logger.info(f"[{self.worker_id}] Format render complete: {job['job_id']}")
            
        except Exception as e:
            logger.error(f"[{self.worker_id}] Format render error: {e}", exc_info=True)
            job["status"] = "failed"
            job["error"] = str(e)
            job["completed_at"] = datetime.now(timezone.utc)
            
            await self.emit(
                Topics.VIDEO_RENDER_FAILED,
                {
                    "job_id": job["job_id"],
                    "error": str(e),
                    "correlation_id": correlation_id,
                },
                correlation_id
            )
    
    async def _handle_tts_completed(self, event: Event) -> None:
        """Handle TTS completion (for voice audio integration)."""
        try:
            payload = event.payload
            correlation_id = event.correlation_id
            audio_path = payload.get("audio_path") or payload.get("output_path")
            
            if not audio_path:
                logger.warning(f"[{self.worker_id}] TTS completed but no audio_path in payload")
                return
            
            # Store TTS audio for job integration
            self._pending_tts[correlation_id] = {
                "audio_path": audio_path,
                "duration": payload.get("duration_seconds"),
                "text": payload.get("text"),
                "model": payload.get("model"),
                "timestamp": datetime.now(timezone.utc),
            }
            
            logger.info(f"[{self.worker_id}] TTS audio ready for correlation_id: {correlation_id}")
            
            # Check if there's a pending render job waiting for this TTS
            for job_id, job in self._jobs.items():
                if job.get("correlation_id") == correlation_id and job.get("status") == "building_scene_graph":
                    logger.info(f"[{self.worker_id}] TTS audio available for job: {job_id}")
                    # Job will pick up TTS audio when rendering starts
                    
        except Exception as e:
            logger.error(f"[{self.worker_id}] Error handling TTS completion: {e}", exc_info=True)
    
    async def _handle_visuals_completed(self, event: Event) -> None:
        """Handle visuals completion (for visual asset integration)."""
        try:
            payload = event.payload
            correlation_id = event.correlation_id
            visuals_path = payload.get("visuals_path") or payload.get("output_path")
            visuals_type = payload.get("visuals_type")
            
            if not visuals_path:
                logger.warning(f"[{self.worker_id}] Visuals completed but no visuals_path in payload")
                return
            
            # Store visuals for job integration
            if correlation_id not in self._pending_visuals:
                self._pending_visuals[correlation_id] = []
            
            self._pending_visuals[correlation_id].append({
                "visuals_path": visuals_path,
                "visuals_type": visuals_type,
                "timestamp": datetime.now(timezone.utc),
            })
            
            logger.info(f"[{self.worker_id}] Visuals ready for correlation_id: {correlation_id}")
            
            # Check if there's a pending render job waiting for these visuals
            for job_id, job in self._jobs.items():
                if job.get("correlation_id") == correlation_id and job.get("status") == "building_scene_graph":
                    logger.info(f"[{self.worker_id}] Visuals available for job: {job_id}")
                    # Job will pick up visuals when rendering starts
                    
        except Exception as e:
            logger.error(f"[{self.worker_id}] Error handling visuals completion: {e}", exc_info=True)
    
    def _scene_to_render_request(
        self,
        scene: Dict[str, Any],
        job_id: str,
        tts_audio: Optional[Dict[str, Any]] = None,
        visuals_assets: Optional[List[Dict[str, Any]]] = None,
    ) -> RenderRequest:
        """Convert scene graph scene to RenderRequest for adapter."""
        scene_data = scene.get("data", {})
        scene_format = scene.get("format", {})
        scene_type = scene.get("scene_type", "TopicScene")
        duration = scene.get("duration", 60.0)
        
        # Build layers from scene data
        layers = []
        
        # Text layer from title/description
        if scene_data.get("title"):
            layers.append(Layer(
                id="title",
                type="text",
                content=scene_data.get("title"),
                position={"x": 0, "y": -200},
                start=0.0,
                end=duration,
                opacity=1.0,
                style={
                    "fontSize": scene_format.get("visuals", {}).get("font_size", 64),
                    "color": scene_format.get("visuals", {}).get("text_color", "#ffffff"),
                }
            ))
        
        if scene_data.get("description"):
            layers.append(Layer(
                id="description",
                type="text",
                content=scene_data.get("description"),
                position={"x": 0, "y": 0},
                start=0.0,
                end=duration,
                opacity=0.8,
                style={
                    "fontSize": scene_format.get("visuals", {}).get("font_size", 48) * 0.7,
                    "color": scene_format.get("visuals", {}).get("text_color", "#ffffff"),
                }
            ))
        
        # Visual assets layer
        if visuals_assets:
            for i, visual in enumerate(visuals_assets[:3]):  # Limit to 3 visuals
                layers.append(Layer(
                    id=f"visual_{i}",
                    type="image",
                    source=visual.get("visuals_path"),
                    position={"x": (i - 1) * 300, "y": 200},
                    start=0.0,
                    end=duration,
                    opacity=1.0,
                ))
        
        # Audio tracks
        audio_tracks = []
        if tts_audio and tts_audio.get("audio_path"):
            audio_tracks.append(AudioTrack(
                id="narration",
                source=tts_audio["audio_path"],
                start=0.0,
                volume=1.0,
            ))
        
        # Get dimensions from format
        dimensions = scene_format.get("dimensions", {})
        resolution = {
            "width": dimensions.get("width", 1920),
            "height": dimensions.get("height", 1080),
        }
        
        return RenderRequest(
            job_id=job_id,
            composition=scene_type,
            layers=layers,
            audio_tracks=audio_tracks,
            duration=duration,
            fps=30,
            resolution=resolution,
        )
    
    async def _compose_final_video(
        self,
        job_id: str,
        rendered_scenes: List[Dict[str, Any]],
        format_config: Dict[str, Any],
        correlation_id: str
    ) -> str:
        """Compose final video from rendered scenes using FFmpeg."""
        import subprocess
        from pathlib import Path
        
        output_dir = Path("Backend/data/generated_videos")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        final_video_path = output_dir / f"{job_id}_final.mp4"
        
        # Filter out failed scenes
        valid_scenes = [s for s in rendered_scenes if s.get("video_path")]
        
        if not valid_scenes:
            raise ValueError("No valid scenes to compose")
        
        # Create concat file for FFmpeg
        concat_file = output_dir / f"{job_id}_concat.txt"
        with open(concat_file, "w") as f:
            for scene in valid_scenes:
                video_path = scene["video_path"]
                f.write(f"file '{Path(video_path).absolute()}'\n")
        
        # Compose using FFmpeg
        cmd = [
            "ffmpeg",
            "-f", "concat",
            "-safe", "0",
            "-i", str(concat_file),
            "-c", "copy",
            "-y",
            str(final_video_path),
        ]
        
        logger.info(f"[{self.worker_id}] Composing final video: {final_video_path}")
        logger.debug(f"[{self.worker_id}] FFmpeg command: {' '.join(cmd)}")
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            error_msg = stderr.decode() if stderr else "Unknown error"
            logger.error(f"[{self.worker_id}] FFmpeg compose failed: {error_msg}")
            raise RuntimeError(f"Video composition failed: {error_msg}")
        
        # Clean up concat file
        concat_file.unlink(missing_ok=True)
        
        logger.info(f"[{self.worker_id}] Final video composed: {final_video_path}")
        return str(final_video_path)

