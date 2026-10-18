"""
Explainer Video Engine
======================
A format-agnostic video rendering engine for YouTube explainers and more.

Supports:
- Explainer videos ("Every X Explained")
- Dev vlogs
- Listicles
- Comparisons
- Short-form content

Integrates with:
- Background music APIs
- B-roll video APIs
- Meme APIs
- Sound effects APIs
- AI image generation
- TTS/Voice synthesis
"""

from .content_brief import (
    ContentBrief,
    ContentItem,
    ContentItemType,
    VideoMeta,
    StyleConfig,
    PacingConfig,
    AudioConfig,
    NarrationConfig,
    MediaAsset,
    VisualStyle,
)
from .format_registry import FormatRegistry, VideoFormat, get_format_registry
from .asset_manager import AssetManager
from .explainer_service import ExplainerVideoService

__all__ = [
    "ContentBrief",
    "ContentItem",
    "ContentItemType",
    "VideoMeta",
    "StyleConfig",
    "PacingConfig",
    "AudioConfig",
    "NarrationConfig",
    "MediaAsset",
    "VisualStyle",
    "FormatRegistry", 
    "VideoFormat",
    "get_format_registry",
    "AssetManager",
    "ExplainerVideoService",
]
