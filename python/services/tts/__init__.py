"""
TTS Service
===========
Text-to-speech service with support for multiple models via adapters.
"""

from .worker import TTSWorker
from .adapters.base import TTSAdapter
from .models import TTSRequest, TTSResponse, TTSJobStatus

__all__ = [
    "TTSWorker",
    "TTSAdapter",
    "TTSRequest",
    "TTSResponse",
    "TTSJobStatus",
]

