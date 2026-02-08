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
    NotConfiguredError,
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
        provider_name: Override provider (sora, runway, kling)

    Returns:
        Configured VideoProviderAdapter instance

    Raises:
        NotConfiguredError: If the requested provider is not configured
    """
    from .sora_provider import SoraProvider

    # Default from env or parameter
    if provider_name is None:
        env_provider = os.getenv("VIDEO_PROVIDER", "sora")
        try:
            provider_name = ProviderName(env_provider)
        except ValueError:
            raise NotConfiguredError(
                f"Unknown video provider '{env_provider}'. "
                f"Supported: {', '.join(p.value for p in ProviderName if p != ProviderName.MOCK)}"
            )

    if provider_name == ProviderName.SORA:
        return SoraProvider()
    elif provider_name == ProviderName.RUNWAY:
        raise NotConfiguredError("Runway provider not yet implemented")
    elif provider_name == ProviderName.KLING:
        raise NotConfiguredError("Kling provider not yet implemented")
    elif provider_name == ProviderName.PIKA:
        raise NotConfiguredError("Pika provider not yet implemented")
    elif provider_name == ProviderName.LUMA:
        raise NotConfiguredError("Luma provider not yet implemented")
    elif provider_name == ProviderName.MOCK:
        raise NotConfiguredError(
            "MockVideoProvider is not available in production. "
            "Set VIDEO_PROVIDER to a real provider (e.g., 'sora')."
        )
    else:
        raise NotConfiguredError(
            f"Video provider '{provider_name}' is not configured. "
            f"Set VIDEO_PROVIDER environment variable to a supported provider."
        )


__all__ = [
    # Factory
    "get_video_provider",

    # Base classes
    "VideoProviderAdapter",
    "NotConfiguredError",
    "ProviderName",
    "ClipStatus",
    "AssetKind",
    "CreateClipInput",
    "RemixClipInput",
    "ProviderGeneration",
    "ProviderError",
]
