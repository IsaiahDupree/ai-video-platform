"""
Voice Provider Selector — single source of truth for the video pipeline's TTS/voice engine.

Policy (2026-08, from a live capacity audit): ElevenLabs is at its monthly
character cap (89.7% used, cannot extend) and is the #1 bottleneck. It must NEVER
be the silent default.

Routing:
  - NARRATION (audio track over Remotion visuals) → FREE HuggingFace TTS
    (facebook/mms-tts-eng) by default, with Modal-hosted TTS (XTTS / Kokoro /
    voice-clone) as an alternative free/cheap path.
  - AVATAR-led beats (talking head, voice baked into video) → HeyGen
    (POST /v2/video/generate) — credits available.
  - ElevenLabs → STRICTLY OPT-IN. Only used when VOICE_PROVIDER=elevenlabs.
  - OpenAI TTS → also NOT a default (its key is a blocked placeholder). Opt-in only.

A single env var, VOICE_PROVIDER, selects the engine. Default: 'orion' (free VoxCPM2
Isaiah voice on the Orion GPU via the hub's POST /api/voice/generate).
"""

from __future__ import annotations

import os
from typing import Optional

# The one and only default. Free, no ElevenLabs characters consumed.
# Orion Voice Service = VoxCPM2 on the Orion GPU (48kHz Isaiah voice), the ecosystem
# standard default for ALL voiceover (docs/ORION_VOICE_SERVICE.md).
DEFAULT_VOICE_PROVIDER = "orion"

# Providers that produce a standalone audio track (pure narration).
NARRATION_PROVIDERS = {"orion", "huggingface", "modal", "openai", "elevenlabs"}
# Providers that produce a talking-avatar video (voice baked in).
AVATAR_PROVIDERS = {"heygen"}

# Default free HuggingFace narration model (English, ~small, hosted on HF Inference).
DEFAULT_HF_TTS_MODEL = "facebook/mms-tts-eng"


def get_voice_provider(default: str = DEFAULT_VOICE_PROVIDER) -> str:
    """Return the configured provider from VOICE_PROVIDER, defaulting to huggingface."""
    return (os.getenv("VOICE_PROVIDER") or default).strip().lower()


def elevenlabs_opted_in() -> bool:
    """
    ElevenLabs is used ONLY when it is explicitly selected via VOICE_PROVIDER=elevenlabs.
    This is the single guard that keeps ElevenLabs off the default path.
    """
    return get_voice_provider() == "elevenlabs"


def resolve_narration_provider(requested: Optional[str] = None) -> str:
    """
    Resolve the narration TTS provider, guaranteeing ElevenLabs is never a silent default.

    Rules:
      - If nothing is requested, use VOICE_PROVIDER (default 'huggingface').
      - If 'elevenlabs' is requested but NOT explicitly opted in, downgrade to the
        free default (huggingface). ElevenLabs never runs by accident.
      - Unknown providers fall back to the free default.
    """
    prov = (requested or get_voice_provider()).strip().lower()

    if prov == "elevenlabs" and not elevenlabs_opted_in():
        return DEFAULT_VOICE_PROVIDER

    if prov not in NARRATION_PROVIDERS and prov not in AVATAR_PROVIDERS:
        return DEFAULT_VOICE_PROVIDER

    return prov


def is_avatar_provider(provider: Optional[str] = None) -> bool:
    """True when the (resolved) provider produces avatar video rather than an audio track."""
    prov = (provider or get_voice_provider()).strip().lower()
    return prov in AVATAR_PROVIDERS


def modal_tts_url() -> Optional[str]:
    """
    Return a Modal-hosted TTS endpoint if configured. Prefers XTTS, then Kokoro,
    then the voice-clone endpoint. All are free/cheap alternatives to ElevenLabs.
    """
    return (
        os.getenv("MODAL_XTTS_URL")
        or os.getenv("MODAL_KOKORO_URL")
        or os.getenv("MODAL_VOICE_CLONE_URL")
    )


def hf_model_for(model_id: Optional[str]) -> str:
    """
    Map a NarratorConfig.model_id to a HuggingFace TTS model id. Non-HF ids
    (e.g. OpenAI's 'tts-1') are replaced by the default free HF model.
    """
    if model_id and "/" in model_id:
        return model_id
    return DEFAULT_HF_TTS_MODEL


def assert_not_elevenlabs(provider: str) -> None:
    """
    Defense-in-depth guard for code paths that must never reach ElevenLabs unless
    the operator has explicitly opted in. Raises with an actionable message.
    """
    if provider == "elevenlabs" and not elevenlabs_opted_in():
        raise RuntimeError(
            "ElevenLabs is disabled by default (monthly character cap reached). "
            "Set VOICE_PROVIDER=elevenlabs to explicitly enable it, or use the free "
            "'huggingface'/'modal' narration path or 'heygen' avatar path."
        )


__all__ = [
    "DEFAULT_VOICE_PROVIDER",
    "DEFAULT_HF_TTS_MODEL",
    "NARRATION_PROVIDERS",
    "AVATAR_PROVIDERS",
    "get_voice_provider",
    "elevenlabs_opted_in",
    "resolve_narration_provider",
    "is_avatar_provider",
    "modal_tts_url",
    "hf_model_for",
    "assert_not_elevenlabs",
]
