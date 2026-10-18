"""
Music Adapters
==============
Adapters for different music sources.
"""

from .base import MusicAdapter
from .suno import SunoAdapter
from .soundcloud import SoundCloudAdapter
from .social_platform import SocialPlatformAdapter

__all__ = [
    "MusicAdapter",
    "SunoAdapter",
    "SoundCloudAdapter",
    "SocialPlatformAdapter",
]

