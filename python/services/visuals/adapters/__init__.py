"""
Visuals Adapters
================
Adapters for different visual sources.
"""

from .base import VisualsAdapter
from .meme import MemeAdapter
from .broll import BrollAdapter
from .ugc import UGCAdapter

__all__ = [
    "VisualsAdapter",
    "MemeAdapter",
    "BrollAdapter",
    "UGCAdapter",
]

