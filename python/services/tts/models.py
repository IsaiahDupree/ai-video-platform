"""
TTS Service Models
==================
Data models for TTS requests, responses, and job status.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Dict, Optional, Any
from uuid import UUID, uuid4


class TTSModel(str, Enum):
    """Supported TTS models."""
    INDEXTTS2 = "indextts2"
    COQUI_XTTS = "coqui_xtts"
    HF_METAVOICE = "hf_metavoice"
    HF_MMS = "hf_mms"


class EmotionMethod(str, Enum):
    """Emotion control methods."""
    NATURAL = "natural"  # Use voice reference emotion
    REFERENCE = "reference"  # Use emotion reference audio
    VECTORS = "vectors"  # Use emotion vectors
    TEXT = "text"  # Use text description


@dataclass
class EmotionConfig:
    """Emotion configuration for TTS generation."""
    method: EmotionMethod = EmotionMethod.NATURAL
    vectors: Optional[Dict[str, float]] = None  # e.g., {"happy": 0.8, "calm": 0.2}
    weight: float = 0.8  # Emotion control weight (0.0-1.0)
    reference_audio: Optional[str] = None  # Path to emotion reference audio
    text: str = ""  # Text description of emotion


@dataclass
class TTSRequest:
    """TTS generation request."""
    text: str
    voice_reference: Optional[str] = None  # Path to voice reference audio (optional if voice_profile_id provided)
    model: TTSModel = TTSModel.INDEXTTS2
    emotion: Optional[EmotionConfig] = None
    output_format: str = "wav"  # "wav", "mp3"
    sample_rate: int = 22050
    output_path: Optional[str] = None  # Auto-generated if not provided
    correlation_id: Optional[str] = None
    job_id: Optional[str] = None
    # VC-005: Voice cloning integration
    voice_profile_id: Optional[str] = None  # Voice profile ID for voice cloning
    use_voice_cloning: bool = False  # Enable voice cloning instead of standard TTS

    def __post_init__(self):
        """Generate job_id and correlation_id if not provided."""
        if self.job_id is None:
            self.job_id = str(uuid4())
        if self.correlation_id is None:
            self.correlation_id = str(uuid4())
        if self.emotion is None:
            self.emotion = EmotionConfig()
        # Auto-enable voice cloning if voice_profile_id is provided
        if self.voice_profile_id:
            self.use_voice_cloning = True


@dataclass
class TTSResponse:
    """TTS generation response."""
    job_id: str
    success: bool
    audio_path: Optional[str] = None
    audio_url: Optional[str] = None
    duration_seconds: Optional[float] = None
    model_used: str = ""
    generation_time: Optional[float] = None
    error: Optional[str] = None
    correlation_id: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class TTSJobStatus:
    """TTS job status tracking."""
    job_id: str
    status: str  # "pending", "processing", "completed", "failed"
    progress: float = 0.0  # 0.0-1.0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    response: Optional[TTSResponse] = None
    correlation_id: Optional[str] = None

