#!/usr/bin/env python3
"""
InfiniteTalk FusioniX LoRA Support Module

Provides LoRA weight loading and inference optimization for InfiniteTalk
on Modal GPU infrastructure.

Usage:
  from infinitetalk_lora import load_lora_weights, get_lora_config

  config = get_lora_config(sample_steps=8, use_lora=True)
  model = load_model(...)
  lora_weights = load_lora_weights(model, config)
"""

import os
import json
from pathlib import Path
from typing import Optional, Dict, Any
from dataclasses import dataclass

# =============================================================================
# LoRA Configuration Classes
# =============================================================================

@dataclass
class LoRAConfig:
    """LoRA configuration for InfiniteTalk"""
    enabled: bool = False
    scale: float = 0.85
    path: Optional[str] = None
    huggingface_id: str = 'MeiGen-AI/InfiniteTalk-FusioniX-LoRA'
    alpha: int = 16
    rank: int = 32

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dict for JSON serialization"""
        return {
            'enabled': self.enabled,
            'scale': self.scale,
            'path': self.path,
            'huggingface_id': self.huggingface_id,
            'alpha': self.alpha,
            'rank': self.rank,
        }


@dataclass
class QualityProfile:
    """Quality profile with LoRA support"""
    name: str
    sample_steps: int
    sample_shift: int
    use_lora: bool
    lora_scale: float
    max_duration_sec: int
    estimated_vram_gb: int


# =============================================================================
# Quality Profiles
# =============================================================================

QUALITY_PROFILES = {
    'fast_lora': QualityProfile(
        name='Fast with LoRA',
        sample_steps=8,
        sample_shift=2,
        use_lora=True,
        lora_scale=0.85,
        max_duration_sec=10,
        estimated_vram_gb=45,
    ),
    'balanced': QualityProfile(
        name='Balanced',
        sample_steps=20,
        sample_shift=3,
        use_lora=False,
        lora_scale=0.0,
        max_duration_sec=15,
        estimated_vram_gb=55,
    ),
    'quality': QualityProfile(
        name='High Quality',
        sample_steps=40,
        sample_shift=7,
        use_lora=False,
        lora_scale=0.0,
        max_duration_sec=20,
        estimated_vram_gb=70,
    ),
    'draft': QualityProfile(
        name='Draft',
        sample_steps=4,
        sample_shift=1,
        use_lora=False,
        lora_scale=0.0,
        max_duration_sec=5,
        estimated_vram_gb=35,
    ),
}


# =============================================================================
# LoRA Loading Functions
# =============================================================================

def get_lora_config(
    use_lora: bool = True,
    lora_scale: float = 0.85,
    lora_path: Optional[str] = None
) -> LoRAConfig:
    """Get LoRA configuration"""
    return LoRAConfig(
        enabled=use_lora,
        scale=lora_scale,
        path=lora_path,
    )


def download_lora_weights(
    model_dir: Path,
    lora_config: LoRAConfig
) -> Path:
    """
    Download FusioniX LoRA weights from HuggingFace

    Args:
        model_dir: Directory to store downloaded weights
        lora_config: LoRA configuration

    Returns:
        Path to downloaded LoRA weights
    """
    if not lora_config.enabled:
        return None

    # Check if already cached
    lora_dir = model_dir / 'lora'
    lora_weights = lora_dir / 'pytorch_lora_weights.safetensors'

    if lora_weights.exists():
        print(f"✓ LoRA weights already cached: {lora_weights}")
        return lora_weights

    # Download from HuggingFace
    print(f"📥 Downloading LoRA from {lora_config.huggingface_id}...")

    try:
        from huggingface_hub import hf_hub_download

        lora_dir.mkdir(parents=True, exist_ok=True)

        lora_path = hf_hub_download(
            repo_id=lora_config.huggingface_id,
            filename='pytorch_lora_weights.safetensors',
            local_dir=str(lora_dir)
        )

        print(f"✓ LoRA weights downloaded: {lora_path}")
        return Path(lora_path)

    except Exception as e:
        print(f"❌ Failed to download LoRA weights: {e}")
        print(f"  Will fall back to standard inference without LoRA")
        return None


def load_lora_into_unet(
    unet,
    lora_weights_path: Path,
    lora_scale: float = 0.85,
    lora_alpha: int = 16,
    lora_rank: int = 32
) -> bool:
    """
    Load LoRA weights into UNet model

    Args:
        unet: UNet model instance
        lora_weights_path: Path to LoRA weights
        lora_scale: LoRA scaling factor
        lora_alpha: LoRA alpha parameter
        lora_rank: LoRA rank

    Returns:
        True if loaded successfully, False otherwise
    """
    if not lora_weights_path or not lora_weights_path.exists():
        print(f"⚠️  LoRA weights not found: {lora_weights_path}")
        return False

    try:
        from peft import inject_adapter_in_model, LoraConfig
        from safetensors.torch import load_file

        # Create LoRA config
        lora_config = LoraConfig(
            r=lora_rank,
            lora_alpha=lora_alpha,
            target_modules=['to_k', 'to_v', 'to_q', 'to_out.0'],
            lora_dropout=0.05,
            bias='none',
        )

        # Inject LoRA into UNet
        unet = inject_adapter_in_model(lora_config, unet)

        # Load weights
        lora_state_dict = load_file(lora_weights_path)
        unet.load_state_dict(lora_state_dict, strict=False)

        # Set LoRA scale
        if hasattr(unet, 'set_lora_scale'):
            unet.set_lora_scale(lora_scale)

        print(f"✓ LoRA weights loaded successfully (scale: {lora_scale})")
        return True

    except Exception as e:
        print(f"❌ Failed to load LoRA weights: {e}")
        return False


def get_quality_profile(profile_name: str) -> QualityProfile:
    """Get quality profile by name"""
    profile = QUALITY_PROFILES.get(profile_name)
    if not profile:
        print(f"⚠️  Unknown profile: {profile_name}, using balanced")
        return QUALITY_PROFILES['balanced']
    return profile


def build_inference_command_args(
    profile: QualityProfile,
    extra_args: list = None
) -> list:
    """
    Build inference command arguments for InfiniteTalk with LoRA support

    Args:
        profile: Quality profile
        extra_args: Additional arguments to append

    Returns:
        List of command arguments
    """
    args = [
        f'--sample_steps={profile.sample_steps}',
        f'--sample_shift={profile.sample_shift}',
        '--num_persistent_param_in_dit=0',
    ]

    if profile.use_lora:
        args.append('--use_lora=true')
        args.append(f'--lora_scale={profile.lora_scale}')
        args.append(f'--lora_path=MeiGen-AI/InfiniteTalk-FusioniX-LoRA')

    if extra_args:
        args.extend(extra_args)

    return args


# =============================================================================
# Utility Functions
# =============================================================================

def estimate_generation_time(
    video_duration_sec: int,
    profile: QualityProfile
) -> int:
    """
    Estimate generation time based on profile

    Args:
        video_duration_sec: Video duration in seconds
        profile: Quality profile

    Returns:
        Estimated generation time in seconds
    """
    # Base: 30 seconds per 5 seconds of video at 20 steps on A100
    base_time_per_sec = 6  # seconds per video second
    steps_ratio = profile.sample_steps / 20  # Normalize to 20 steps

    # LoRA provides ~20% speedup
    speedup = 0.8 if profile.use_lora else 1.0

    estimated = base_time_per_sec * video_duration_sec * steps_ratio * speedup
    return int(estimated)


def validate_profile_for_vram(
    profile: QualityProfile,
    available_vram_gb: int
) -> bool:
    """
    Validate that profile fits in available VRAM

    Args:
        profile: Quality profile
        available_vram_gb: Available VRAM in GB

    Returns:
        True if profile can fit, False otherwise
    """
    if available_vram_gb < profile.estimated_vram_gb:
        print(f"⚠️  Profile {profile.name} requires {profile.estimated_vram_gb}GB VRAM")
        print(f"   Available: {available_vram_gb}GB")
        return False
    return True
