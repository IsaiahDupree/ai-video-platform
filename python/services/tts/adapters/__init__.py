"""
TTS Adapters
============
Adapter implementations for different TTS models.
"""

from .base import TTSAdapter
from .indextts2 import IndexTTS2Adapter
from .huggingface import HuggingFaceTTSAdapter, create_huggingface_adapter

__all__ = [
    "TTSAdapter",
    "IndexTTS2Adapter",
    "HuggingFaceTTSAdapter",
    "create_huggingface_adapter",
]

