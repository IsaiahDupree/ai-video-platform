"""
Visuals Service
===============
Service for visual asset generation and selection.

Supports multiple sources:
- Meme templates (multiple adapters)
- B-roll (multiple adapters)
- UGC content (UGC b-roll, UGC videos, etc.)
"""

from .worker import VisualsWorker
from .models import VisualsRequest, VisualsResponse, VisualsType
from .adapters.base import VisualsAdapter
from .adapters.meme import MemeAdapter
from .adapters.broll import BrollAdapter
from .adapters.ugc import UGCAdapter

__all__ = [
    "VisualsWorker",
    "VisualsRequest",
    "VisualsResponse",
    "VisualsType",
    "VisualsAdapter",
    "MemeAdapter",
    "BrollAdapter",
    "UGCAdapter",
]

