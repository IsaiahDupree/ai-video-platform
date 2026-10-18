"""
Music Service Models
====================
Data models for music service requests and responses.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, Optional, Any, List
from uuid import UUID, uuid4


class MusicSource(str, Enum):
    """Music source types."""
    SUNO = "suno"  # Local Suno downloads
    SOUNDCLOUD = "soundcloud"  # SoundCloud via RapidAPI
    SOCIAL_PLATFORM = "social_platform"  # Social platforms via RapidAPI (TikTok, Instagram, etc.)
    LOCAL = "local"  # Generic local file


@dataclass
class MusicSearchCriteria:
    """Criteria for searching/selecting music."""
    mood: Optional[str] = None  # "energetic", "calm", "upbeat", "melancholic", etc.
    genre: Optional[str] = None  # "hip-hop", "electronic", "pop", etc.
    bpm_min: Optional[int] = None
    bpm_max: Optional[int] = None
    duration_min: Optional[float] = None  # seconds
    duration_max: Optional[float] = None  # seconds
    tags: Optional[List[str]] = None  # Additional tags
    trending: bool = False  # Prefer trending music
    platform: Optional[str] = None  # "tiktok", "instagram", "youtube", etc.


@dataclass
class MusicRequest:
    """Music generation/selection request."""
    source: MusicSource
    search_criteria: Optional[MusicSearchCriteria] = None
    
    # For Suno (local files)
    suno_file_path: Optional[str] = None  # Direct path to Suno file
    
    # For SoundCloud/Social Platform (RapidAPI)
    track_id: Optional[str] = None  # Specific track ID
    search_query: Optional[str] = None  # Search query
    
    # Output
    output_path: Optional[str] = None  # Where to save/return music
    duration: Optional[float] = None  # Target duration (for trimming)
    
    # Metadata
    job_id: Optional[str] = None
    correlation_id: Optional[str] = None
    
    def __post_init__(self):
        """Generate IDs if not provided."""
        if self.job_id is None:
            self.job_id = str(uuid4())
        if self.correlation_id is None:
            self.correlation_id = str(uuid4())


@dataclass
class MusicResponse:
    """Music service response."""
    job_id: str
    success: bool
    music_path: Optional[str] = None
    music_url: Optional[str] = None
    duration_seconds: Optional[float] = None
    bpm: Optional[int] = None
    genre: Optional[str] = None
    mood: Optional[str] = None
    source: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    correlation_id: Optional[str] = None
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

