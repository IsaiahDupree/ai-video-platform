"""
Video Renderer Factory
======================
Factory for creating video renderer adapters.

Defaults to Motion Canvas, falls back to Remotion if needed.
"""

import logging
import os
from typing import Optional

from .base import VideoRenderer, RenderEngine
from .motion_canvas_adapter import MotionCanvasAdapter
from .remotion_adapter import RemotionAdapter

logger = logging.getLogger(__name__)


class VideoRendererFactory:
    """
    Factory for creating video renderer instances.
    
    Default: Motion Canvas (open-source, faster, better for automation)
    Fallback: Remotion (if Motion Canvas unavailable)
    """
    
    @staticmethod
    def create(
        engine: Optional[RenderEngine] = None,
        project_dir: Optional[str] = None
    ) -> VideoRenderer:
        """
        Create a video renderer instance.
        
        Args:
            engine: Render engine to use (default: Motion Canvas)
            project_dir: Project directory path
        
        Returns:
            VideoRenderer instance
        """
        # Default to Motion Canvas
        if engine is None:
            engine = RenderEngine.MOTION_CANVAS
        
        # Check environment variable override
        env_engine = os.getenv("VIDEO_RENDERER_ENGINE", "").lower()
        if env_engine == "remotion":
            engine = RenderEngine.REMOTION
            logger.info("[Factory] Using Remotion (env override)")
        elif env_engine == "motion_canvas":
            engine = RenderEngine.MOTION_CANVAS
            logger.info("[Factory] Using Motion Canvas (env override)")
        
        if engine == RenderEngine.MOTION_CANVAS:
            logger.info("[Factory] Creating Motion Canvas adapter (default)")
            return MotionCanvasAdapter(project_dir=project_dir)
        elif engine == RenderEngine.REMOTION:
            logger.info("[Factory] Creating Remotion adapter (fallback)")
            return RemotionAdapter(project_dir=project_dir)
        else:
            raise ValueError(f"Unknown render engine: {engine}")
    
    @staticmethod
    def create_default(project_dir: Optional[str] = None) -> VideoRenderer:
        """
        Create default renderer (Motion Canvas).
        
        Args:
            project_dir: Project directory path
        
        Returns:
            Motion Canvas adapter instance
        """
        return VideoRendererFactory.create(
            engine=RenderEngine.MOTION_CANVAS,
            project_dir=project_dir
        )

