"""
Video Renderer Service
======================
Format-agnostic video rendering service with adapter pattern.

Architecture:
- Formats: Format definitions (explainer, listicle, comparison, etc.)
- Renderer: Format-agnostic scene graph builder
- Adapters: Rendering engines (Motion Canvas, Remotion)
"""

from .base import VideoRenderer, RenderRequest, RenderResponse, RenderJobStatus
from .motion_canvas_adapter import MotionCanvasAdapter
from .remotion_adapter import RemotionAdapter
from .renderer import VideoRenderService, render_video
from .formats import FORMAT_REGISTRY

__all__ = [
    "VideoRenderer",
    "RenderRequest",
    "RenderResponse",
    "RenderJobStatus",
    "MotionCanvasAdapter",
    "RemotionAdapter",
    "VideoRenderService",
    "render_video",
    "FORMAT_REGISTRY",
]

