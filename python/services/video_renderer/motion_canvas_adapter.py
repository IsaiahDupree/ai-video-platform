"""
Motion Canvas Adapter
=====================
Adapter for Motion Canvas video rendering engine (default).

Motion Canvas is open-source, canvas-based, and optimized for vector animations.
Perfect for automated video generation.
"""

import asyncio
import json
import logging
import subprocess
import time
from pathlib import Path
from typing import Dict, Optional, Any, List, Callable

from .base import (
    VideoRenderer,
    RenderRequest,
    RenderResponse,
    RenderJobStatus,
    RenderEngine,
    Layer,
    AudioTrack
)

logger = logging.getLogger(__name__)


class MotionCanvasAdapter(VideoRenderer):
    """
    Motion Canvas rendering adapter.
    
    Motion Canvas uses an imperative, procedural API for creating vector animations.
    Perfect for automated video generation from JSON specs.
    """
    
    def __init__(self, project_dir: Optional[str] = None):
        """
        Initialize Motion Canvas adapter.
        
        Args:
            project_dir: Path to Motion Canvas project directory
        """
        if project_dir is None:
            # Default to Motion Canvas project in Documents
            project_dir = "/Users/isaiahdupree/Documents/Software/MotionCanvas"
        
        self.project_dir = Path(project_dir)
        self.project_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"[MotionCanvas] Initialized with project dir: {self.project_dir}")
    
    def get_engine_name(self) -> RenderEngine:
        return RenderEngine.MOTION_CANVAS
    
    async def validate_request(self, request: RenderRequest) -> bool:
        """Validate Motion Canvas render request."""
        if not request.layers:
            logger.error("[MotionCanvas] No layers in request")
            return False
        
        if request.duration <= 0:
            logger.error("[MotionCanvas] Invalid duration")
            return False
        
        # Check if composition exists
        composition_file = self.project_dir / "src" / "scenes" / f"{request.composition}.ts"
        if not composition_file.exists():
            logger.warning(f"[MotionCanvas] Composition {request.composition} not found, will generate")
        
        return True
    
    def get_supported_formats(self) -> List[str]:
        """Return supported composition formats."""
        return [
            "ExplainerVideo",
            "DevVlogMeme",
            "TrendBreakdown",
            "ProductPromo",
            "UGCCorner",
            "BrollText",
            "PureBrollText",
        ]
    
    def get_default_resolution(self) -> Dict[str, int]:
        """Return default resolution (1920x1080 for standard, 1080x1920 for Shorts)."""
        return {"width": 1920, "height": 1080}
    
    async def render(
        self,
        request: RenderRequest,
        on_progress: Optional[Callable[[float], None]] = None
    ) -> RenderResponse:
        """
        Render video using Motion Canvas.
        
        Motion Canvas uses an imperative API:
        1. Create scene from composition
        2. Add layers programmatically
        3. Render to video
        
        Args:
            request: Rendering request
            on_progress: Progress callback (0.0 to 1.0)
        
        Returns:
            RenderResponse with video path
        """
        start_time = time.time()
        
        logger.info(f"[MotionCanvas] Starting render: {request.job_id}")
        logger.info(f"  Composition: {request.composition}")
        logger.info(f"  Duration: {request.duration}s")
        logger.info(f"  Layers: {len(request.layers)}")
        logger.info(f"  Audio tracks: {len(request.audio_tracks)}")
        
        # Validate request
        if not await self.validate_request(request):
            raise ValueError("Invalid render request")
        
        # Generate Motion Canvas scene from request
        scene_path = await self._generate_scene(request)
        
        if on_progress:
            await asyncio.sleep(0.1)  # Allow callback
            on_progress(0.2)
        
        # Render using Motion Canvas CLI
        output_path = await self._render_with_cli(
            request=request,
            scene_path=scene_path,
            on_progress=on_progress
        )
        
        render_time = time.time() - start_time
        
        # Get file size
        file_size = Path(output_path).stat().st_size if Path(output_path).exists() else 0
        
        logger.info(f"[MotionCanvas] Render complete: {output_path} ({render_time:.2f}s)")
        
        return RenderResponse(
            job_id=request.job_id,
            video_path=str(output_path),
            duration_seconds=request.duration,
            file_size_bytes=file_size,
            render_time_seconds=render_time,
            engine_used=RenderEngine.MOTION_CANVAS,
            metadata={
                "composition": request.composition,
                "layers_count": len(request.layers),
                "audio_tracks_count": len(request.audio_tracks),
            }
        )
    
    async def _generate_scene(self, request: RenderRequest) -> Path:
        """
        Generate Motion Canvas scene file from request.
        
        Motion Canvas uses TypeScript scenes with imperative API.
        """
        scenes_dir = self.project_dir / "src" / "scenes"
        scenes_dir.mkdir(parents=True, exist_ok=True)
        
        scene_file = scenes_dir / f"{request.composition}_{request.job_id}.ts"
        
        # Generate Motion Canvas scene code
        scene_code = self._build_scene_code(request)
        
        scene_file.write_text(scene_code)
        logger.info(f"[MotionCanvas] Generated scene: {scene_file}")
        
        return scene_file
    
    def _build_scene_code(self, request: RenderRequest) -> str:
        """
        Build Motion Canvas TypeScript scene code from request.
        
        Motion Canvas imperative API example:
        ```typescript
        import {makeScene2D} from '@motion-canvas/2d';
        import {Txt, Rect} from '@motion-canvas/2d/lib/components';
        
        export default makeScene2D(function* (view) {
          const text = new Txt({
            text: 'Hello World',
            fontSize: 100,
          });
          view.add(text);
          yield* text.opacity(1, 1);
        });
        ```
        """
        # Build layers code
        layers_code = []
        for layer in request.layers:
            if layer.type == "text":
                layers_code.append(f"""
          const {layer.id} = new Txt({{
            text: {json.dumps(layer.content)},
            fontSize: {layer.style.get('fontSize', 48) if layer.style else 48},
            fill: {json.dumps(layer.style.get('color', '#ffffff') if layer.style else '#ffffff')},
            position: [{layer.position.get('x', 0) if layer.position else 0}, {layer.position.get('y', 0) if layer.position else 0}],
          }});
          view.add({layer.id});
          yield* {layer.id}.opacity({layer.opacity}, {layer.end - layer.start if layer.end else 1});
        """)
            elif layer.type == "image":
                layers_code.append(f"""
          const {layer.id} = new Img({{
            src: {json.dumps(layer.source)},
            position: [{layer.position.get('x', 0) if layer.position else 0}, {layer.position.get('y', 0) if layer.position else 0}],
            width: {layer.position.get('width', 1920) if layer.position else 1920},
            height: {layer.position.get('height', 1080) if layer.position else 1080},
          }});
          view.add({layer.id});
          yield* {layer.id}.opacity({layer.opacity}, {layer.end - layer.start if layer.end else 1});
        """)
        
        # Build audio tracks code
        audio_code = []
        for audio in request.audio_tracks:
            audio_code.append(f"""
          audio({json.dumps(audio.source)}, {audio.start});
        """)
        
        # Combine into full scene
        scene_template = f"""import {{makeScene2D}} from '@motion-canvas/2d';
import {{Txt, Img}} from '@motion-canvas/2d/lib/components';
import {{audio}} from '@motion-canvas/core';

export default makeScene2D(function* (view) {{
{''.join(audio_code)}
{''.join(layers_code)}
}});
"""
        return scene_template
    
    async def _render_with_cli(
        self,
        request: RenderRequest,
        scene_path: Path,
        on_progress: Optional[Callable[[float], None]] = None
    ) -> Path:
        """
        Render video using Motion Canvas CLI.
        
        Motion Canvas CLI: `motion-canvas render <scene>`
        """
        output_dir = Path("data/motion_canvas_outputs")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        output_path = output_dir / f"{request.job_id}.mp4"
        
        # Motion Canvas CLI command
        cmd = [
            "npx", "motion-canvas", "render",
            str(scene_path),
            "--output", str(output_path),
            "--fps", str(request.fps),
            "--duration", str(request.duration),
        ]
        
        logger.info(f"[MotionCanvas] Running: {' '.join(cmd)}")
        
        if on_progress:
            on_progress(0.3)
        
        # Run Motion Canvas CLI
        process = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=str(self.project_dir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        
        # Monitor progress (simplified - Motion Canvas doesn't have built-in progress API)
        # In production, would parse stdout for progress
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            error_msg = stderr.decode() if stderr else "Unknown error"
            logger.error(f"[MotionCanvas] Render failed: {error_msg}")
            raise RuntimeError(f"Motion Canvas render failed: {error_msg}")
        
        if on_progress:
            on_progress(1.0)
        
        if not output_path.exists():
            raise RuntimeError(f"Motion Canvas output not found: {output_path}")
        
        return output_path

