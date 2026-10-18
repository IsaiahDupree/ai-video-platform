"""
Remotion Service Models
=======================
Data models for Remotion rendering requests, responses, and job status.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Dict, Optional, Any, List
from uuid import UUID, uuid4


class SourceType(str, Enum):
    """Source types for Remotion composition."""
    LOCAL = "local"  # Local file path
    URL = "url"  # HTTP/HTTPS URL
    TTS = "tts"  # TTS job output (subscribe to tts.completed)
    MEDIAPOSTER = "mediaposter"  # MediaPoster media library
    MATTING = "matting"  # Matting job output (subscribe to matting.completed)


@dataclass
class Layer:
    """A layer in the Remotion composition."""
    id: str
    type: str  # "video", "image", "text", "audio"
    source: Optional[str] = None  # Source path/URL
    source_type: Optional[SourceType] = None
    position: Optional[Dict[str, Any]] = None  # {"x": 0, "y": 0, "width": 1080, "height": 1920}
    start: float = 0.0  # Start time in seconds
    end: Optional[float] = None  # End time in seconds
    opacity: float = 1.0
    style: Optional[Dict[str, Any]] = None  # Style properties
    animation: Optional[str] = None  # Animation type
    content: Optional[str] = None  # For text layers


@dataclass
class AudioTrack:
    """An audio track in the composition."""
    id: str
    source: str
    source_type: SourceType
    start: float = 0.0
    volume: float = 1.0
    ducking: Optional[Dict[str, Any]] = None  # {"duck_under": "audio_001", "duck_db": -6}


@dataclass
class CaptionConfig:
    """Caption configuration."""
    enabled: bool = True
    style: str = "burned_in"  # "burned_in", "overlay", "none"
    source: Optional[str] = None  # Path to word_timestamps.json from TTS
    emphasis_words: bool = True  # Highlight emphasis words
    position: str = "bottom"  # "top", "bottom", "center"


@dataclass
class RemotionRequest:
    """Remotion rendering request."""
    composition: str = "MainComposition"  # Composition name
    timeline: Optional[Dict[str, Any]] = None  # Full timeline.json structure
    layers: Optional[List[Layer]] = None  # Layers (alternative to timeline)
    audio: Optional[List[AudioTrack]] = None  # Audio tracks
    captions: Optional[CaptionConfig] = None  # Caption configuration
    output: Optional[Dict[str, Any]] = None  # Output config
    props: Optional[Dict[str, Any]] = None  # Composition props
    output_path: Optional[str] = None  # Auto-generated if not provided
    correlation_id: Optional[str] = None
    job_id: Optional[str] = None
    
    def __post_init__(self):
        """Generate job_id and correlation_id if not provided."""
        if self.job_id is None:
            self.job_id = str(uuid4())
        if self.correlation_id is None:
            self.correlation_id = str(uuid4())
        if self.output is None:
            self.output = {
                "format": "mp4",
                "resolution": "1080x1920",
                "fps": 30
            }
        if self.captions is None:
            self.captions = CaptionConfig()


@dataclass
class RemotionResponse:
    """Remotion rendering response."""
    job_id: str
    success: bool
    video_path: Optional[str] = None
    video_url: Optional[str] = None
    duration_seconds: Optional[float] = None
    file_size_mb: Optional[float] = None
    render_time: Optional[float] = None
    variants: Optional[List[Dict[str, str]]] = None  # Multi-variant outputs
    thumbnails: Optional[List[Dict[str, str]]] = None  # Generated thumbnails
    error: Optional[str] = None
    correlation_id: Optional[str] = None
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class RemotionJobStatus:
    """Remotion job status tracking."""
    job_id: str
    status: str  # "pending", "processing", "composing", "rendering", "completed", "failed"
    progress: float = 0.0  # 0.0-1.0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    response: Optional[RemotionResponse] = None
    correlation_id: Optional[str] = None

