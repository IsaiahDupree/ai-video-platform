"""
Shot Types

Defines shot types (FULL_SCENE, BG_ONLY, CHAR_ALPHA) and
prompt building strategies for each type.
"""

from typing import Optional, Literal
from pydantic import BaseModel, Field


ShotType = Literal["FULL_SCENE", "BG_ONLY", "CHAR_ALPHA"]


class PostprocessHints(BaseModel):
    """Postprocessing hints for a shot."""
    chroma_key: Optional[dict] = Field(None, alias="chromaKey")
    mute_original_audio: bool = Field(default=False, alias="muteOriginalAudio")
    
    class Config:
        populate_by_name = True


class ShotV2(BaseModel):
    """Extended shot with shot type and postprocess hints."""
    id: str
    from_beat_id: str = Field(alias="fromBeatId")
    seconds: int
    prompt: str
    model: Literal["sora-2", "sora-2-pro"] = "sora-2"
    size: Literal["720x1280", "1280x720"] = "720x1280"
    tags: list[str] = Field(default_factory=list)
    cache_key: str = Field(alias="cacheKey")
    shot_type: ShotType = Field(default="FULL_SCENE", alias="shotType")
    postprocess: Optional[PostprocessHints] = None
    
    class Config:
        populate_by_name = True


class AssetClipV2(BaseModel):
    """Extended asset clip with shot type info."""
    shot_id: str = Field(alias="shotId")
    beat_id: str = Field(alias="beatId")
    shot_type: ShotType = Field(alias="shotType")
    src: Optional[str] = None
    alpha_src: Optional[str] = Field(None, alias="alphaSrc")
    matte_color: Optional[Literal["green", "magenta"]] = Field(None, alias="matteColor")
    seconds: float
    has_audio: bool = Field(default=True, alias="hasAudio")
    
    class Config:
        populate_by_name = True


def build_sora_prompt(
    shot_type: ShotType,
    beat_narration: str,
    on_screen: Optional[dict] = None,
    global_tokens: Optional[list[str]] = None,
    negative_tokens: Optional[list[str]] = None,
) -> str:
    """
    Build a Sora prompt based on shot type.
    
    Args:
        shot_type: Type of shot (FULL_SCENE, BG_ONLY, CHAR_ALPHA)
        beat_narration: Narration text for context
        on_screen: On-screen text hints
        global_tokens: Style tokens
        negative_tokens: Tokens to avoid
        
    Returns:
        Formatted prompt string
    """
    global_tokens = global_tokens or [
        "clean flat 2D explainer",
        "high contrast",
        "simple composition",
    ]
    negative_tokens = negative_tokens or [
        "tiny text",
        "photorealistic",
        "busy background",
    ]
    
    base = f"{', '.join(global_tokens)}. Context: {beat_narration}."
    
    # Build text hints
    text_hints = []
    if on_screen:
        if on_screen.get("headline"):
            text_hints.append(f"Headline: {on_screen['headline']}")
        if on_screen.get("bullet"):
            text_hints.append(f"Bullet: {on_screen['bullet']}")
        if on_screen.get("label"):
            text_hints.append(f"Label: {on_screen['label']}")
    text_hint_str = " ".join(text_hints)
    
    avoid_str = ", ".join(negative_tokens)
    
    if shot_type == "FULL_SCENE":
        return (
            f"{base} Compose the full scene with character + minimal readable "
            f"on-screen text. {text_hint_str} Avoid: {avoid_str}."
        )
    
    elif shot_type == "BG_ONLY":
        return (
            f"{base} Generate ONLY a clean background plate with no text. "
            f"Leave empty space for captions and overlays. No characters. "
            f"Avoid: {avoid_str}."
        )
    
    elif shot_type == "CHAR_ALPHA":
        return (
            f"{base} Generate ONLY the character animation on a SOLID GREEN "
            f"background, no shadows, no gradients, no text. Keep edges clean "
            f"for chroma key. Avoid: {avoid_str}."
        )
    
    return f"{base} {text_hint_str} Avoid: {avoid_str}."


def determine_shot_type(
    beat_type: str,
    format_render_strategy: dict,
    has_text_overlay: bool = False,
) -> ShotType:
    """
    Determine the shot type for a beat.
    
    Args:
        beat_type: Type of beat (HOOK, STEP, etc.)
        format_render_strategy: Render strategy from format pack
        has_text_overlay: Whether beat has significant text
        
    Returns:
        Appropriate ShotType
    """
    sora_types = format_render_strategy.get("soraBeatTypes", [])
    
    if beat_type not in sora_types:
        # Not a Sora beat, no shot type needed
        return "FULL_SCENE"
    
    # If beat has heavy text, use BG_ONLY so we can overlay
    if has_text_overlay:
        return "BG_ONLY"
    
    # Default to FULL_SCENE
    return "FULL_SCENE"


def get_postprocess_hints(shot_type: ShotType) -> Optional[PostprocessHints]:
    """
    Get postprocessing hints for a shot type.
    
    Args:
        shot_type: Type of shot
        
    Returns:
        PostprocessHints or None
    """
    if shot_type == "CHAR_ALPHA":
        return PostprocessHints(
            chroma_key={
                "color": "green",
                "similarity": 0.18,
                "blend": 0.02,
            },
            mute_original_audio=True,
        )
    
    return None


def should_mute_sora_audio(
    shot_type: ShotType,
    voice_mode: str,
) -> bool:
    """
    Determine if Sora audio should be muted for this shot.
    
    Args:
        shot_type: Type of shot
        voice_mode: Voice mode (EXTERNAL_NARRATOR, SORA_DIALOGUE, HYBRID)
        
    Returns:
        True if Sora audio should be muted
    """
    # CHAR_ALPHA always mutes (we'll add our own audio)
    if shot_type == "CHAR_ALPHA":
        return True
    
    # BG_ONLY typically mutes (background ambience only)
    if shot_type == "BG_ONLY":
        return True
    
    # For FULL_SCENE, depends on voice mode
    if voice_mode == "EXTERNAL_NARRATOR":
        return True
    
    return False
