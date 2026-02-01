"""
Video Provider Adapters
=======================
Unified interface for video generation providers (Sora, Runway, Kling, etc.)

Usage:
    from services.video_providers import get_video_provider, ProviderName
    
    provider = get_video_provider(ProviderName.SORA)
    generation = await provider.create_clip(input)
"""

import os
from typing import Optional

from .base import (
    VideoProviderAdapter,
    ProviderName,
    ClipStatus,
    AssetKind,
    CreateClipInput,
    RemixClipInput,
    ProviderGeneration,
    ProviderError,
)


def get_video_provider(
    provider_name: Optional[ProviderName] = None
) -> VideoProviderAdapter:
    """
    Get configured video provider adapter.
    
    Args:
        provider_name: Override provider (sora, runway, mock)
    
    Returns:
        Configured VideoProviderAdapter instance
    """
    from .sora_provider import SoraProvider
    from .mock_provider import MockVideoProvider
    
    # Default from env or parameter
    if provider_name is None:
        env_provider = os.getenv("VIDEO_PROVIDER", "sora")
        provider_name = ProviderName(env_provider)
    
    if provider_name == ProviderName.SORA:
        return SoraProvider()
    elif provider_name == ProviderName.MOCK:
        return MockVideoProvider()
    elif provider_name == ProviderName.RUNWAY:
        # Placeholder for future implementation
        raise NotImplementedError("Runway provider not yet implemented")
    elif provider_name == ProviderName.KLING:
        raise NotImplementedError("Kling provider not yet implemented")
    else:
        # Default to mock for development
        return MockVideoProvider()


__all__ = [
    # Factory
    "get_video_provider",
    
    # Base classes
    "VideoProviderAdapter",
    "ProviderName",
    "ClipStatus",
    "AssetKind",
    "CreateClipInput",
    "RemixClipInput",
    "ProviderGeneration",
    "ProviderError",
]
