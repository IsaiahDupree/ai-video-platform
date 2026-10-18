"""
Remotion SFX Integration

Intent-based SFX selection for Remotion renders.
Converts macro cues to Remotion audio layer format.
"""

import json
from typing import Optional, Literal
from pathlib import Path
from pydantic import BaseModel, Field


# SFX Macro Types for Remotion

class RemotionSfxMacro(BaseModel):
    """An SFX macro mapping intent to candidates."""
    macro_id: str = Field(alias="macroId")
    description: str = ""
    default_gain_db: float = Field(default=-12, alias="defaultGainDb")
    gain_db_range: tuple[float, float] = Field(default=(-18, -6), alias="gainDbRange")
    candidates: list[dict] = Field(default_factory=list)
    
    class Config:
        populate_by_name = True


class RemotionSfxMacros(BaseModel):
    """Collection of SFX macros for Remotion."""
    version: str = "1.0.0"
    macros: list[RemotionSfxMacro]
    
    def get_by_id(self, macro_id: str) -> Optional[RemotionSfxMacro]:
        for m in self.macros:
            if m.macro_id == macro_id:
                return m
        return None


class RemotionSfxCue(BaseModel):
    """A macro-based SFX cue for Remotion."""
    frame: int = Field(ge=0)
    macro_id: str = Field(alias="macroId")
    intensity: float = Field(default=0.5, ge=0, le=1)
    reason: Optional[str] = None
    
    class Config:
        populate_by_name = True


class RemotionSfxLayer(BaseModel):
    """An expanded SFX layer for Remotion render plan."""
    id: str
    kind: Literal["AUDIO"] = "AUDIO"
    from_frame: int = Field(alias="from")
    duration_in_frames: int = Field(alias="durationInFrames")
    src: str
    volume: float = Field(default=1.0, ge=0, le=2)
    z_index: int = Field(default=100, alias="zIndex")
    
    class Config:
        populate_by_name = True


# Default Remotion SFX Macros

DEFAULT_REMOTION_MACROS = RemotionSfxMacros(
    version="1.0.0",
    macros=[
        RemotionSfxMacro(
            macro_id="text_ping",
            description="Keyword/bullet/highlight appears on screen",
            default_gain_db=-16,
            gain_db_range=(-24, -10),
            candidates=[
                {"sfxId": "ui_pop_01", "weight": 0.40},
                {"sfxId": "ui_click_01", "weight": 0.35},
                {"sfxId": "tick_soft_01", "weight": 0.25},
            ],
        ),
        RemotionSfxMacro(
            macro_id="transition_fast",
            description="Topic switch, zoom, swipe, section change",
            default_gain_db=-12,
            gain_db_range=(-18, -6),
            candidates=[
                {"sfxId": "whoosh_short_01", "weight": 0.55},
                {"sfxId": "whoosh_fast_01", "weight": 0.30},
                {"sfxId": "swipe_whoosh_01", "weight": 0.15},
            ],
        ),
        RemotionSfxMacro(
            macro_id="reveal_riser",
            description="Build up to reveal, 'here's the trick' moment",
            default_gain_db=-12,
            gain_db_range=(-18, -6),
            candidates=[
                {"sfxId": "riser_short_01", "weight": 0.60},
                {"sfxId": "riser_sweep_01", "weight": 0.40},
            ],
        ),
        RemotionSfxMacro(
            macro_id="impact_soft",
            description="Land a key fact, punch, statement emphasis",
            default_gain_db=-12,
            gain_db_range=(-18, -6),
            candidates=[
                {"sfxId": "impact_soft_01", "weight": 0.70},
                {"sfxId": "thump_soft_01", "weight": 0.30},
            ],
        ),
        RemotionSfxMacro(
            macro_id="micro_joke_hit",
            description="Subtle comedic hit after joke/sarcasm",
            default_gain_db=-16,
            gain_db_range=(-24, -10),
            candidates=[
                {"sfxId": "rimshot_tiny_01", "weight": 0.40},
                {"sfxId": "boing_soft_01", "weight": 0.35},
                {"sfxId": "pop_ui_01", "weight": 0.25},
            ],
        ),
        RemotionSfxMacro(
            macro_id="glitch_cut",
            description="Dev vlog bug moment, error reveal, glitch energy",
            default_gain_db=-10,
            gain_db_range=(-16, -4),
            candidates=[
                {"sfxId": "glitch_short_01", "weight": 0.60},
                {"sfxId": "digital_zap_01", "weight": 0.40},
            ],
        ),
        RemotionSfxMacro(
            macro_id="success_ding",
            description="Build passed, deploy succeeded, milestone achieved",
            default_gain_db=-14,
            gain_db_range=(-22, -8),
            candidates=[
                {"sfxId": "success_ding_01", "weight": 0.65},
                {"sfxId": "chime_soft_01", "weight": 0.35},
            ],
        ),
        RemotionSfxMacro(
            macro_id="warning_buzz_soft",
            description="Light warning, error, 'don't do this' moment",
            default_gain_db=-14,
            gain_db_range=(-22, -8),
            candidates=[
                {"sfxId": "error_buzz_soft_01", "weight": 0.70},
                {"sfxId": "notification_low_01", "weight": 0.30},
            ],
        ),
        RemotionSfxMacro(
            macro_id="cta_sparkle",
            description="CTA appears (comment keyword, link in bio)",
            default_gain_db=-16,
            gain_db_range=(-24, -10),
            candidates=[
                {"sfxId": "sparkle_short_01", "weight": 0.60},
                {"sfxId": "chime_up_01", "weight": 0.40},
            ],
        ),
        RemotionSfxMacro(
            macro_id="dramatic_pause",
            description="Before big statement, 'and then...' moment",
            default_gain_db=-16,
            gain_db_range=(-24, -8),
            candidates=[
                {"sfxId": "subtle_riser_01", "weight": 0.65},
                {"sfxId": "air_swell_01", "weight": 0.35},
            ],
        ),
    ],
)


def db_to_linear(db: float) -> float:
    """Convert dB to linear volume (0-1)."""
    import math
    return math.pow(10, db / 20)


def weighted_pick_deterministic(candidates: list[dict], seed: float) -> dict:
    """Deterministic weighted pick using seed."""
    import math
    total = sum(c.get("weight", 1) for c in candidates) or 1
    r = (abs(math.sin(seed)) % 1) * total
    
    acc = 0
    for c in candidates:
        acc += c.get("weight", 1)
        if r <= acc:
            return c
    return candidates[-1] if candidates else {}


def expand_remotion_sfx_cue(
    cue: RemotionSfxCue,
    macros: RemotionSfxMacros,
    sfx_root: str = "public/sfx",
    default_duration_frames: int = 30,
) -> Optional[RemotionSfxLayer]:
    """
    Expand a macro cue to a Remotion SFX layer.
    
    Args:
        cue: Macro cue
        macros: Macros library
        sfx_root: Root path for SFX files
        default_duration_frames: Duration for SFX playback
        
    Returns:
        RemotionSfxLayer or None if macro not found
    """
    macro = macros.get_by_id(cue.macro_id)
    if not macro or not macro.candidates:
        return None
    
    # Deterministic pick
    seed = cue.frame * 997 + len(cue.macro_id) * 13
    candidate = weighted_pick_deterministic(macro.candidates, seed)
    
    sfx_id = candidate.get("sfxId", "")
    if not sfx_id:
        return None
    
    # Calculate volume from intensity
    min_db, max_db = macro.gain_db_range
    gain_db = min_db + (max_db - min_db) * cue.intensity
    volume = db_to_linear(gain_db)
    
    return RemotionSfxLayer(
        id=f"sfx_{cue.frame}_{sfx_id}",
        kind="AUDIO",
        from_frame=cue.frame,
        duration_in_frames=default_duration_frames,
        src=f"{sfx_root}/{sfx_id}.wav",
        volume=round(volume, 3),
        z_index=100,
    )


def expand_remotion_sfx_cues(
    cues: list[RemotionSfxCue],
    macros: Optional[RemotionSfxMacros] = None,
    sfx_root: str = "public/sfx",
    default_duration_frames: int = 30,
) -> list[RemotionSfxLayer]:
    """
    Expand all macro cues to Remotion SFX layers.
    
    Args:
        cues: List of macro cues
        macros: Macros library (uses default if None)
        sfx_root: Root path for SFX files
        default_duration_frames: Duration for each SFX
        
    Returns:
        List of RemotionSfxLayer
    """
    macros = macros or DEFAULT_REMOTION_MACROS
    layers = []
    
    for cue in cues:
        layer = expand_remotion_sfx_cue(cue, macros, sfx_root, default_duration_frames)
        if layer:
            layers.append(layer)
    
    return layers


def beats_to_remotion_sfx_cues(
    beats: list[dict],
    fps: int = 30,
) -> list[RemotionSfxCue]:
    """
    Convert beats to Remotion SFX cues based on beat type/action.
    
    Args:
        beats: List of beat dicts
        fps: Frames per second
        
    Returns:
        List of RemotionSfxCue
    """
    cues = []
    
    for beat in beats:
        frame = beat.get("frame", 0)
        beat_type = beat.get("type", "")
        action = beat.get("action", "")
        
        # Map beat types to macros
        macro_id = None
        intensity = 0.5
        
        if beat_type == "HOOK" or action == "hook":
            macro_id = "impact_soft"
            intensity = 0.75
        elif beat_type == "CTA" or action == "cta":
            macro_id = "cta_sparkle"
            intensity = 0.70
        elif beat_type == "PROOF" or action == "reveal":
            macro_id = "reveal_riser"
            intensity = 0.65
        elif action == "transition":
            macro_id = "transition_fast"
            intensity = 0.60
        elif action == "punchline":
            macro_id = "micro_joke_hit"
            intensity = 0.55
        elif action == "error":
            macro_id = "warning_buzz_soft"
            intensity = 0.65
        elif action == "success":
            macro_id = "success_ding"
            intensity = 0.65
        
        if macro_id:
            cues.append(RemotionSfxCue(
                frame=frame,
                macro_id=macro_id,
                intensity=intensity,
                reason=f"beat:{beat_type or action}",
            ))
    
    return cues


def story_ir_to_remotion_sfx_cues(
    ir: dict,
    fps: Optional[int] = None,
) -> list[RemotionSfxCue]:
    """
    Convert Story IR to Remotion SFX cues.
    
    Args:
        ir: Story IR dict
        fps: Frames per second
        
    Returns:
        List of RemotionSfxCue
    """
    fps = fps or ir.get("meta", {}).get("fps", 30)
    beats = ir.get("beats", [])
    
    cues = []
    cursor_frames = 0
    
    for beat in beats:
        duration_s = beat.get("duration_s") or beat.get("durationS", 3)
        beat_frames = round(duration_s * fps)
        
        beat_type = beat.get("type", "")
        on_screen = beat.get("on_screen") or beat.get("onScreen") or {}
        
        # Hook gets impact
        if beat_type == "HOOK":
            cues.append(RemotionSfxCue(
                frame=cursor_frames,
                macro_id="impact_soft",
                intensity=0.75,
                reason="ir:HOOK",
            ))
        
        # CTA gets sparkle
        elif beat_type == "CTA":
            cues.append(RemotionSfxCue(
                frame=cursor_frames,
                macro_id="cta_sparkle",
                intensity=0.70,
                reason="ir:CTA",
            ))
        
        # Proof gets reveal
        elif beat_type == "PROOF":
            cues.append(RemotionSfxCue(
                frame=cursor_frames,
                macro_id="reveal_riser",
                intensity=0.65,
                reason="ir:PROOF",
            ))
        
        # Steps with headlines get text ping
        if beat_type == "STEP" and on_screen.get("headline"):
            cues.append(RemotionSfxCue(
                frame=cursor_frames + 6,  # Slight delay for text animation
                macro_id="text_ping",
                intensity=0.45,
                reason="ir:headline",
            ))
        
        cursor_frames += beat_frames
    
    return cues


def add_sfx_layers_to_render_plan(
    render_plan: dict,
    sfx_cues: list[RemotionSfxCue],
    macros: Optional[RemotionSfxMacros] = None,
    sfx_root: str = "public/sfx",
) -> dict:
    """
    Add SFX layers to a Remotion render plan.
    
    Args:
        render_plan: Existing render plan with layers
        sfx_cues: SFX cues to add
        macros: Macros library
        sfx_root: SFX files root path
        
    Returns:
        Updated render plan with SFX layers
    """
    sfx_layers = expand_remotion_sfx_cues(
        sfx_cues,
        macros or DEFAULT_REMOTION_MACROS,
        sfx_root,
    )
    
    # Convert to dict format
    sfx_layer_dicts = [layer.model_dump(by_alias=True) for layer in sfx_layers]
    
    # Add to existing layers
    existing_layers = render_plan.get("layers", [])
    
    return {
        **render_plan,
        "layers": existing_layers + sfx_layer_dicts,
        "sfxMeta": {
            "cueCount": len(sfx_cues),
            "layerCount": len(sfx_layers),
            "macrosVersion": (macros or DEFAULT_REMOTION_MACROS).version,
        },
    }


def get_remotion_macro_context(macros: Optional[RemotionSfxMacros] = None) -> str:
    """
    Get AI context string for Remotion SFX macros.
    
    Args:
        macros: Macros library
        
    Returns:
        Context string for LLM prompts
    """
    macros = macros or DEFAULT_REMOTION_MACROS
    
    lines = ["Available SFX Macros for Remotion:"]
    
    for m in macros.macros:
        lines.append(f"\n- {m.macro_id}: {m.description}")
        lines.append(f"  Intensity: 0 (subtle) to 1 (dramatic)")
    
    lines.append("\nOutput format for each cue:")
    lines.append('{"frame": <int>, "macroId": "<macro>", "intensity": 0.0-1.0}')
    
    return "\n".join(lines)
