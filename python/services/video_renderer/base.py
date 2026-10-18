"""
Video Renderer Base Classes
===========================
Abstract base classes for video rendering adapters.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Dict, Optional, Any, List
from uuid import UUID


class RenderEngine(str, Enum):
    """Supported rendering engines."""
    MOTION_CANVAS = "motion_canvas"
    REMOTION = "remotion"


@dataclass
class Layer:
    """A layer in the video composition."""
    id: str
    type: str  # "video", "image", "text", "audio", "shape"
    source: Optional[str] = None
    position: Optional[Dict[str, Any]] = None
    start: float = 0.0
    end: Optional[float] = None
    opacity: float = 1.0
    style: Optional[Dict[str, Any]] = None
    animation: Optional[str] = None
    content: Optional[str] = None  # For text layers


@dataclass
class AudioTrack:
    """An audio track in the composition."""
    id: str
    source: str
    start: float = 0.0
    volume: float = 1.0
    ducking: Optional[Dict[str, Any]] = None


@dataclass
class RenderRequest:
    """Request for video rendering."""
    job_id: str
    composition: str  # Composition name/template
    layers: List[Layer]
    audio_tracks: List[AudioTrack]
    duration: float  # Total duration in seconds
    fps: int = 30
    resolution: Optional[Dict[str, int]] = None  # {"width": 1920, "height": 1080}
    output_path: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class RenderResponse:
    """Response from video rendering."""
    job_id: str
    video_path: str
    duration_seconds: float
    file_size_bytes: int
    render_time_seconds: float
    engine_used: RenderEngine
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class RenderJobStatus:
    """Status of a rendering job."""
    job_id: str
    status: str  # "pending", "composing", "rendering", "completed", "failed"
    progress: float = 0.0  # 0.0 to 1.0
    current_stage: Optional[str] = None
    error: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    output_path: Optional[str] = None


class VideoRenderer(ABC):
    """
    Abstract base class for video rendering adapters.
    
    Each adapter (Motion Canvas, Remotion) implements this interface.
    """
    
    @abstractmethod
    def get_engine_name(self) -> RenderEngine:
        """Return the rendering engine name."""
        pass
    
    @abstractmethod
    async def render(
        self,
        request: RenderRequest,
        on_progress: Optional[callable] = None
    ) -> RenderResponse:
        """
        Render a video from the request.
        
        Args:
            request: Rendering request with layers, audio, etc.
            on_progress: Optional callback for progress updates (progress: float)
        
        Returns:
            RenderResponse with video path and metadata
        
        Raises:
            RuntimeError: If rendering fails
        """
        pass
    
    @abstractmethod
    async def validate_request(self, request: RenderRequest) -> bool:
        """
        Validate that the request can be rendered.
        
        Args:
            request: Rendering request to validate
        
        Returns:
            True if valid, False otherwise
        """
        pass
    
    @abstractmethod
    def get_supported_formats(self) -> List[str]:
        """Return list of supported composition formats."""
        pass
    
    @abstractmethod
    def get_default_resolution(self) -> Dict[str, int]:
        """Return default resolution (width, height)."""
        pass

