"""
Auto Shot Planner

Automatically determines shot types (FULL_SCENE, BG_ONLY, CHAR_ALPHA)
per beat based on format policies, with overlay preset rotation for variety.
"""

from typing import Optional, Literal
from pydantic import BaseModel, Field
import hashlib
import json

from .types import StoryIRV1, FormatPackV1, BeatType


ShotType = Literal["FULL_SCENE", "BG_ONLY", "CHAR_ALPHA"]
OverlayPreset = Literal["char_bottom_right", "char_bottom_left", "char_top_right", "char_center"]


class BeatShotPolicy(BaseModel):
    """Policy for how a beat type should be shot."""
    bg: Literal["FULL_SCENE", "BG_ONLY", "NONE"] = "FULL_SCENE"
    char_alpha: Optional[dict] = Field(None, alias="charAlpha")
    audio: Optional[dict] = None
    
    class Config:
        populate_by_name = True


class PlannedShot(BaseModel):
    """A planned shot for Sora generation."""
    role: Literal["bg", "char"]
    shot_type: ShotType = Field(alias="shotType")
    overlay_preset: Optional[OverlayPreset] = Field(None, alias="overlayPreset")
    seconds: int
    mute_original_audio: bool = Field(default=False, alias="muteOriginalAudio")
    
    class Config:
        populate_by_name = True


class ShotPlanEntry(BaseModel):
    """A shot in the extended shot plan."""
    id: str
    from_beat_id: str = Field(alias="fromBeatId")
    role: Literal["bg", "char"]
    seconds: int
    prompt: str
    model: str = "sora-2"
    size: str = "720x1280"
    tags: list[str] = Field(default_factory=list)
    cache_key: str = Field(alias="cacheKey")
    shot_type: ShotType = Field(alias="shotType")
    overlay_preset: Optional[OverlayPreset] = Field(None, alias="overlayPreset")
    postprocess: Optional[dict] = None
    
    class Config:
        populate_by_name = True


# Default shot policies per beat type
DEFAULT_SHOT_POLICIES: dict[str, BeatShotPolicy] = {
    "HOOK": BeatShotPolicy(
        bg="FULL_SCENE",
        char_alpha={"enabled": False},
        audio={"keep": True},
    ),
    "PROMISE": BeatShotPolicy(
        bg="BG_ONLY",
        char_alpha={"enabled": True, "rotateEvery": 1},
        audio={"keep": False},
    ),
    "STEP": BeatShotPolicy(
        bg="BG_ONLY",
        char_alpha={"enabled": True, "rotateEvery": 1},
        audio={"keep": False},
    ),
    "PROOF": BeatShotPolicy(
        bg="FULL_SCENE",
        char_alpha={"enabled": False},
        audio={"keep": True},
    ),
    "CTA": BeatShotPolicy(
        bg="NONE",
        char_alpha={"enabled": False},
        audio={"keep": False},
    ),
    "OUTRO": BeatShotPolicy(
        bg="NONE",
        char_alpha={"enabled": False},
        audio={"keep": False},
    ),
}

# Default overlay presets for rotation
DEFAULT_OVERLAY_PRESETS: list[OverlayPreset] = [
    "char_bottom_right",
    "char_bottom_left",
    "char_top_right",
    "char_center",
]


def clamp_seconds(s: float) -> int:
    """Clamp duration to valid Sora range (1-20 seconds)."""
    return max(1, min(20, round(s)))


def plan_shots_for_beat(
    beat: dict,
    beat_index: int,
    policies: Optional[dict[str, BeatShotPolicy]] = None,
    overlay_presets: Optional[list[OverlayPreset]] = None,
) -> list[PlannedShot]:
    """
    Plan shots for a single beat.
    
    A beat can produce up to 2 shots:
    - Background shot (FULL_SCENE or BG_ONLY)
    - Character shot (CHAR_ALPHA) if enabled
    
    Args:
        beat: Beat dict with type, duration_s, etc.
        beat_index: Index of beat in IR
        policies: Shot policies per beat type
        overlay_presets: Presets for character overlay rotation
        
    Returns:
        List of PlannedShot
    """
    policies = policies or DEFAULT_SHOT_POLICIES
    presets = overlay_presets or DEFAULT_OVERLAY_PRESETS
    
    beat_type = beat.get("type", "STEP")
    if hasattr(beat_type, "value"):
        beat_type = beat_type.value
    
    policy = policies.get(beat_type, DEFAULT_SHOT_POLICIES.get("STEP"))
    if not policy:
        policy = BeatShotPolicy(bg="BG_ONLY")
    
    shots: list[PlannedShot] = []
    duration = beat.get("duration_s", 5.0)
    
    # Background shot
    if policy.bg == "FULL_SCENE":
        shots.append(PlannedShot(
            role="bg",
            shot_type="FULL_SCENE",
            seconds=clamp_seconds(duration),
            mute_original_audio=not (policy.audio or {}).get("keep", True),
        ))
    elif policy.bg == "BG_ONLY":
        shots.append(PlannedShot(
            role="bg",
            shot_type="BG_ONLY",
            seconds=clamp_seconds(duration),
            mute_original_audio=True,
        ))
    
    # Character alpha overlay
    char_config = policy.char_alpha or {}
    if char_config.get("enabled"):
        rotate_every = char_config.get("rotateEvery", 1)
        custom_presets = char_config.get("presets", presets)
        
        # Rotate preset based on beat index
        slot = (beat_index // rotate_every) % len(custom_presets)
        overlay_preset = custom_presets[slot]
        
        shots.append(PlannedShot(
            role="char",
            shot_type="CHAR_ALPHA",
            overlay_preset=overlay_preset,
            seconds=clamp_seconds(duration),
            mute_original_audio=True,
        ))
    
    return shots


def build_shot_prompt(
    shot_type: ShotType,
    beat: dict,
    global_tokens: list[str],
    negative_tokens: list[str],
) -> str:
    """
    Build a Sora prompt based on shot type and beat.
    
    Args:
        shot_type: Type of shot
        beat: Beat dict
        global_tokens: Style tokens
        negative_tokens: Avoid tokens
        
    Returns:
        Formatted prompt
    """
    narration = beat.get("narration", "")
    on_screen = beat.get("on_screen", {})
    
    base = f"{', '.join(global_tokens)}. Context: {narration}."
    
    text_hints = []
    if on_screen.get("headline"):
        text_hints.append(f"Headline: {on_screen['headline']}")
    if on_screen.get("bullet"):
        text_hints.append(f"Bullet: {on_screen['bullet']}")
    if on_screen.get("label"):
        text_hints.append(f"Label: {on_screen['label']}")
    hint_str = " ".join(text_hints)
    
    avoid_str = ", ".join(negative_tokens)
    
    if shot_type == "FULL_SCENE":
        return (
            f"{base} Compose the full scene with character + minimal readable "
            f"on-screen text. {hint_str} Avoid: {avoid_str}."
        )
    elif shot_type == "BG_ONLY":
        return (
            f"{base} Generate ONLY a clean background plate with no text. "
            f"Leave empty space for captions. No characters. Avoid: {avoid_str}."
        )
    elif shot_type == "CHAR_ALPHA":
        return (
            f"{base} Generate ONLY the character animation on a SOLID GREEN "
            f"background, no shadows, no gradients, no text. Clean edges for "
            f"chroma key. Avoid: {avoid_str}."
        )
    
    return f"{base} {hint_str} Avoid: {avoid_str}."


def compute_cache_key(
    model: str,
    size: str,
    prompt: str,
    shot_type: ShotType,
    overlay_preset: Optional[str],
    reference_ids: list[str],
) -> str:
    """Compute deterministic cache key for a shot."""
    data = json.dumps({
        "model": model,
        "size": size,
        "prompt": prompt,
        "shotType": shot_type,
        "overlayPreset": overlay_preset,
        "refs": sorted(reference_ids),
    }, sort_keys=True)
    return hashlib.sha256(data.encode()).hexdigest()


def make_auto_shot_plan(
    ir: StoryIRV1,
    format_pack: FormatPackV1,
    policies: Optional[dict[str, BeatShotPolicy]] = None,
    model: str = "sora-2",
    size: Optional[str] = None,
    reference_file_ids: Optional[list[str]] = None,
    global_tokens: Optional[list[str]] = None,
    negative_tokens: Optional[list[str]] = None,
) -> dict:
    """
    Create an auto shot plan with per-beat shot type selection.
    
    Args:
        ir: Story IR
        format_pack: Format pack
        policies: Custom shot policies
        model: Sora model
        size: Video size
        reference_file_ids: Reference files for consistency
        global_tokens: Style tokens
        negative_tokens: Avoid tokens
        
    Returns:
        Shot plan dict with shots array
    """
    size = size or ("720x1280" if ir.meta.aspect == "9:16" else "1280x720")
    ref_ids = reference_file_ids or []
    
    g_tokens = global_tokens or [
        "clean flat 2D explainer",
        "high contrast",
        "simple stick figure character",
        "big safe margins for captions",
    ]
    n_tokens = negative_tokens or [
        "tiny text",
        "photorealistic",
        "busy background",
        "watermarks",
    ]
    
    # Get Sora-routed beat types
    sora_types = {
        bt.value if hasattr(bt, "value") else bt
        for bt in format_pack.render_strategy.sora_beat_types
    }
    
    shots: list[ShotPlanEntry] = []
    
    for beat_idx, beat in enumerate(ir.beats):
        beat_dict = beat.model_dump(by_alias=True) if hasattr(beat, "model_dump") else beat
        beat_type = beat_dict.get("type", "STEP")
        if hasattr(beat_type, "value"):
            beat_type = beat_type.value
        
        # Skip non-Sora beats
        if beat_type not in sora_types:
            continue
        
        # Plan shots for this beat
        planned = plan_shots_for_beat(beat_dict, beat_idx, policies)
        
        for k, ps in enumerate(planned):
            prompt = build_shot_prompt(ps.shot_type, beat_dict, g_tokens, n_tokens)
            cache_key = compute_cache_key(
                model, size, prompt, ps.shot_type, ps.overlay_preset, ref_ids
            )
            
            # Build postprocess hints
            postprocess = None
            if ps.shot_type == "CHAR_ALPHA":
                postprocess = {
                    "chromaKey": {"color": "green", "similarity": 0.18, "blend": 0.02},
                    "muteOriginalAudio": True,
                }
            elif ps.mute_original_audio:
                postprocess = {"muteOriginalAudio": True}
            
            shots.append(ShotPlanEntry(
                id=f"shot_{beat_dict.get('id', beat_idx)}_{ps.role}_{k}",
                from_beat_id=beat_dict.get("id", str(beat_idx)),
                role=ps.role,
                seconds=ps.seconds,
                prompt=prompt,
                model=model,
                size=size,
                tags=[beat_type, ps.role],
                cache_key=cache_key,
                shot_type=ps.shot_type,
                overlay_preset=ps.overlay_preset,
                postprocess=postprocess,
            ))
    
    return {
        "meta": {
            "fps": ir.meta.fps,
            "aspect": ir.meta.aspect,
            "size": size,
        },
        "style_bible": {
            "global_tokens": g_tokens,
            "negative_tokens": n_tokens,
        },
        "references": {"file_ids": ref_ids} if ref_ids else None,
        "shots": [s.model_dump(by_alias=True) for s in shots],
    }


def get_shots_by_beat(shot_plan: dict) -> dict[str, list[dict]]:
    """
    Group shots by beat ID.
    
    Args:
        shot_plan: Shot plan dict
        
    Returns:
        Dict mapping beat_id to list of shots
    """
    by_beat: dict[str, list[dict]] = {}
    for shot in shot_plan.get("shots", []):
        beat_id = shot.get("fromBeatId")
        if beat_id not in by_beat:
            by_beat[beat_id] = []
        by_beat[beat_id].append(shot)
    return by_beat


def estimate_auto_plan_cost(
    shot_plan: dict,
    cost_per_second: float = 0.05,
) -> dict:
    """
    Estimate cost for an auto shot plan.
    
    Args:
        shot_plan: Shot plan dict
        cost_per_second: Cost per second of video
        
    Returns:
        Cost breakdown dict
    """
    shots = shot_plan.get("shots", [])
    
    bg_shots = [s for s in shots if s.get("role") == "bg"]
    char_shots = [s for s in shots if s.get("role") == "char"]
    
    bg_seconds = sum(s.get("seconds", 0) for s in bg_shots)
    char_seconds = sum(s.get("seconds", 0) for s in char_shots)
    total_seconds = bg_seconds + char_seconds
    
    return {
        "total_shots": len(shots),
        "bg_shots": len(bg_shots),
        "char_shots": len(char_shots),
        "total_seconds": total_seconds,
        "bg_seconds": bg_seconds,
        "char_seconds": char_seconds,
        "estimated_cost_usd": total_seconds * cost_per_second,
    }
