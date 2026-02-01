"""
Visuals Service Models
======================
Data models for visuals service requests and responses.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, Optional, Any, List
from uuid import UUID, uuid4


class VisualsType(str, Enum):
    """Visual asset types."""
    MEME = "meme"  # Meme templates
    BROLL = "broll"  # B-roll footage
    UGC = "ugc"  # User-generated content
    STOCK = "stock"  # Stock footage/images
    GENERATED = "generated"  # AI-generated visuals


class VisualsSource(str, Enum):
    """Visual source types."""
    LOCAL = "local"  # Local files
    RAPIDAPI = "rapidapi"  # RapidAPI (social platforms)
    MEDIAPOSTER = "mediaposter"  # MediaPoster media library
    UGC_LIBRARY = "ugc_library"  # UGC content library


@dataclass
class VisualsSearchCriteria:
    """Criteria for searching/selecting visuals."""
    visuals_type: VisualsType
    keywords: Optional[List[str]] = None
    mood: Optional[str] = None  # "energetic", "calm", "funny", etc.
    style: Optional[str] = None  # "minimalist", "vibrant", "dark", etc.
    duration_min: Optional[float] = None  # For video
    duration_max: Optional[float] = None  # For video
    aspect_ratio: Optional[str] = None  # "9:16", "16:9", "1:1", etc.
    trending: bool = False  # Prefer trending visuals
    platform: Optional[str] = None  # "tiktok", "instagram", etc.


@dataclass
class VisualsRequest:
    """Visuals generation/selection request."""
    visuals_type: VisualsType
    source: VisualsSource
    search_criteria: Optional[VisualsSearchCriteria] = None
    
    # For local files
    file_path: Optional[str] = None  # Direct path to file
    
    # For RapidAPI/MediaPoster
    asset_id: Optional[str] = None  # Specific asset ID
    
    # For UGC
    ugc_source: Optional[str] = None  # UGC source identifier
    
    # Output
    output_path: Optional[str] = None  # Where to save/return visual
    
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
class VisualsResponse:
    """Visuals service response."""
    job_id: str
    success: bool
    visuals_path: Optional[str] = None  # Path to visual file
    visuals_url: Optional[str] = None  # URL to visual (if served)
    visuals_type: Optional[str] = None
    duration_seconds: Optional[float] = None  # For video
    metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    correlation_id: Optional[str] = None
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

