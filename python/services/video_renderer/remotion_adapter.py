"""
Remotion Adapter
================
Adapter for Remotion video rendering engine (fallback).

Remotion is React-based, DOM-rendered, and requires a paid license for companies.
Kept as fallback/compatibility option.
"""

import asyncio
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


class RemotionAdapter(VideoRenderer):
    """
    Remotion rendering adapter (fallback).
    
    Remotion uses React components and DOM rendering.
    Requires paid license for company use ($100-500/month).
    """
    
    def __init__(self, project_dir: Optional[str] = None):
        """
        Initialize Remotion adapter.
        
        Args:
            project_dir: Path to Remotion project directory
        """
        if project_dir is None:
            # Default to Remotion directory in Documents
            project_dir = "/Users/isaiahdupree/Documents/Software/Remotion"
        
        self.project_dir = Path(project_dir)
        logger.info(f"[Remotion] Initialized with project dir: {self.project_dir}")
    
    def get_engine_name(self) -> RenderEngine:
        return RenderEngine.REMOTION
    
    async def validate_request(self, request: RenderRequest) -> bool:
        """Validate Remotion render request."""
        if not request.layers:
            logger.error("[Remotion] No layers in request")
            return False
        
        if request.duration <= 0:
            logger.error("[Remotion] Invalid duration")
            return False
        
        # Check if Remotion project exists
        if not self.project_dir.exists():
            logger.warning(f"[Remotion] Project directory not found: {self.project_dir}")
            return False
        
        return True
    
    def get_supported_formats(self) -> List[str]:
        """Return supported composition formats."""
        return [
            "MainComposition",
            "DevVlogMeme",
            "Explainer",
            "TrendBreakdown",
            "ProductPromo",
            "UGCCorner",
            "BrollText",
            "PureBrollText",
        ]
    
    def get_default_resolution(self) -> Dict[str, int]:
        """Return default resolution."""
        return {"width": 1920, "height": 1080}
    
    async def render(
        self,
        request: RenderRequest,
        on_progress: Optional[Callable[[float], None]] = None
    ) -> RenderResponse:
        """
        Render video using Remotion.
        
        Remotion uses React components and Remotion CLI.
        """
        start_time = time.time()
        
        logger.info(f"[Remotion] Starting render: {request.job_id}")
        logger.info(f"  Composition: {request.composition}")
        logger.info(f"  Duration: {request.duration}s")
        
        # Validate request
        if not await self.validate_request(request):
            raise ValueError("Invalid render request")
        
        if on_progress:
            on_progress(0.1)
        
        # Generate Remotion composition (would use existing RemotionComposer logic)
        # For now, use Remotion CLI directly
        
        output_dir = Path("data/remotion_outputs")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        output_path = output_dir / f"{request.job_id}.mp4"
        
        # Remotion CLI command
        cmd = [
            "npx", "remotion", "render",
            request.composition,
            str(output_path),
            "--fps", str(request.fps),
            "--duration", str(request.duration),
        ]
        
        logger.info(f"[Remotion] Running: {' '.join(cmd)}")
        
        if on_progress:
            on_progress(0.3)
        
        # Run Remotion CLI
        process = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=str(self.project_dir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            error_msg = stderr.decode() if stderr else "Unknown error"
            logger.error(f"[Remotion] Render failed: {error_msg}")
            raise RuntimeError(f"Remotion render failed: {error_msg}")
        
        if on_progress:
            on_progress(1.0)
        
        render_time = time.time() - start_time
        file_size = output_path.stat().st_size if output_path.exists() else 0
        
        logger.info(f"[Remotion] Render complete: {output_path} ({render_time:.2f}s)")
        
        return RenderResponse(
            job_id=request.job_id,
            video_path=str(output_path),
            duration_seconds=request.duration,
            file_size_bytes=file_size,
            render_time_seconds=render_time,
            engine_used=RenderEngine.REMOTION,
            metadata={
                "composition": request.composition,
                "layers_count": len(request.layers),
            }
        )

