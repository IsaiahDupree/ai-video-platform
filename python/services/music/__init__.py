"""
Music Service
============
Service for music bed generation and selection.

Supports multiple sources:
- Suno (local downloaded files)
- SoundCloud (RapidAPI)
- Social platforms (RapidAPI for trending music discovery)
"""

from .worker import MusicWorker
from .models import MusicRequest, MusicResponse, MusicSource
from .adapters.base import MusicAdapter
from .adapters.suno import SunoAdapter
from .adapters.soundcloud import SoundCloudAdapter
from .adapters.social_platform import SocialPlatformAdapter

__all__ = [
    "MusicWorker",
    "MusicRequest",
    "MusicResponse",
    "MusicSource",
    "MusicAdapter",
    "SunoAdapter",
    "SoundCloudAdapter",
    "SocialPlatformAdapter",
]

