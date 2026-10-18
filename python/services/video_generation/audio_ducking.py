"""
Audio Ducking Policy

Automatically reduces background audio volume during narration
to ensure voice clarity while maintaining ambient vibe.

Defaults are loaded from the shared ducking-defaults.json so that
TypeScript (Remotion / Motion Canvas) and Python stay in sync.
"""

import json
import os
from typing import Optional
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Load canonical defaults from the shared JSON
# ---------------------------------------------------------------------------

_DEFAULTS_PATH = os.path.join(
    os.path.dirname(__file__),
    "..", "..", "..",  # python/services/video_generation -> repo root
    "src", "audio", "ducking-defaults.json",
)

try:
    with open(_DEFAULTS_PATH) as _f:
        _SHARED = json.load(_f)
except FileNotFoundError:
    # Fallback if JSON is unreachable (e.g. standalone Python deploy)
    _SHARED = {
        "duckLevel": 0.08,
        "fullLevel": 0.45,
        "attackFrames": 8,
        "releaseFrames": 15,
        "enabled": True,
    }


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class DuckingPolicy(BaseModel):
    """Configuration for audio ducking.

    Fields match the shared ducking-defaults.json contract so TS and Python
    produce identical results with the same config.
    """
    enabled: bool = _SHARED["enabled"]
    full_level: float = Field(
        default=_SHARED["fullLevel"],
        alias="fullLevel",
        ge=0, le=1,
        description="Music volume when no speech is active.",
    )
    duck_level: float = Field(
        default=_SHARED["duckLevel"],
        alias="duckLevel",
        ge=0, le=1,
        description="Music volume during speech.",
    )
    attack_frames: int = Field(
        default=_SHARED["attackFrames"],
        alias="attackFrames",
        ge=0,
        description="Frames to fade music down before speech.",
    )
    release_frames: int = Field(
        default=_SHARED["releaseFrames"],
        alias="releaseFrames",
        ge=0,
        description="Frames to fade music back up after speech.",
    )

    # Legacy compat — old callers may pass bgBaseVolume / duckedVolume / fadeFrames.
    # These are read-only properties that map to the canonical fields.
    @property
    def bg_base_volume(self) -> float:
        return self.full_level

    @property
    def ducked_volume(self) -> float:
        return self.duck_level

    @property
    def fade_frames(self) -> int:
        return self.attack_frames

    class Config:
        populate_by_name = True


class NarrationCue(BaseModel):
    """A narration segment."""
    from_frame: int = Field(alias="from", ge=0)
    duration_in_frames: int = Field(alias="durationInFrames", ge=1)

    @property
    def end_frame(self) -> int:
        return self.from_frame + self.duration_in_frames

    class Config:
        populate_by_name = True


DEFAULT_DUCKING = DuckingPolicy()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def is_in_narration(frame: int, cues: list[NarrationCue]) -> bool:
    """Check if a frame is within any narration cue."""
    return any(
        cue.from_frame <= frame < cue.end_frame
        for cue in cues
    )


def bg_volume_at_frame(
    frame: int,
    cues: list[NarrationCue],
    policy: Optional[DuckingPolicy] = None,
) -> float:
    """Get background volume multiplier at a specific frame."""
    policy = policy or DEFAULT_DUCKING

    if not policy.enabled:
        return policy.full_level

    in_cue = is_in_narration(frame, cues)
    return policy.duck_level if in_cue else policy.full_level


def generate_volume_keyframes(
    total_frames: int,
    cues: list[NarrationCue],
    policy: Optional[DuckingPolicy] = None,
    sample_rate: int = 1,
) -> list[dict]:
    """Generate volume keyframes for Remotion interpolation."""
    policy = policy or DEFAULT_DUCKING
    keyframes = []

    # Always include first frame
    keyframes.append({
        "frame": 0,
        "volume": policy.full_level,
    })

    # Add keyframes at cue boundaries with separate attack / release
    for cue in sorted(cues, key=lambda c: c.from_frame):
        attack = policy.attack_frames
        release = policy.release_frames

        # Duck start (fade down)
        duck_start = max(0, cue.from_frame - attack)
        keyframes.append({"frame": duck_start, "volume": policy.full_level})
        keyframes.append({"frame": cue.from_frame, "volume": policy.duck_level})

        # Duck end (fade up)
        duck_end = cue.end_frame
        keyframes.append({"frame": duck_end, "volume": policy.duck_level})
        keyframes.append({"frame": min(total_frames, duck_end + release), "volume": policy.full_level})

    # Dedupe and sort
    seen = set()
    unique = []
    for kf in sorted(keyframes, key=lambda k: k["frame"]):
        if kf["frame"] not in seen:
            seen.add(kf["frame"])
            unique.append(kf)

    return unique


def beats_to_narration_cues(
    beats: list[dict],
    fps: int,
) -> list[NarrationCue]:
    """Convert beats to narration cues based on narration text presence."""
    cues = []
    cursor_frames = 0

    for beat in beats:
        duration_s = beat.get("duration_s") or beat.get("durationS", 3)
        duration_frames = max(1, round(duration_s * fps))

        narration = beat.get("narration", "")
        if narration and narration.strip():
            cues.append(NarrationCue(
                from_frame=cursor_frames,
                duration_in_frames=duration_frames,
            ))

        cursor_frames += duration_frames

    return cues


def story_ir_to_narration_cues(
    ir: dict,
    fps: Optional[int] = None,
) -> list[NarrationCue]:
    """Extract narration cues from Story IR."""
    fps = fps or ir.get("meta", {}).get("fps", 30)
    beats = ir.get("beats", [])
    return beats_to_narration_cues(beats, fps)


def calculate_ducking_for_render_plan(
    render_plan: dict,
    narration_cues: list[NarrationCue],
    policy: Optional[DuckingPolicy] = None,
) -> dict:
    """Add ducking information to a render plan."""
    policy = policy or DEFAULT_DUCKING

    layers = render_plan.get("layers", [])
    total_frames = max(
        (layer.get("from", 0) + layer.get("durationInFrames", 0))
        for layer in layers
    ) if layers else 0

    keyframes = generate_volume_keyframes(total_frames, narration_cues, policy)

    return {
        **render_plan,
        "ducking": {
            "enabled": policy.enabled,
            "policy": policy.model_dump(by_alias=True),
            "keyframes": keyframes,
            "narrationCues": [c.model_dump(by_alias=True) for c in narration_cues],
        },
    }


def should_duck_layer(layer: dict) -> bool:
    """Determine if a layer should have ducking applied."""
    if layer.get("kind") != "VIDEO":
        return False
    if layer.get("muted", False):
        return False
    shot_type = layer.get("shotType") or layer.get("shot_type")
    if shot_type == "FULL_SCENE":
        return True
    volume = layer.get("volume", 1)
    return volume > 0


def apply_ducking_to_layers(
    layers: list[dict],
    narration_cues: list[NarrationCue],
    policy: Optional[DuckingPolicy] = None,
) -> list[dict]:
    """Apply ducking metadata to render plan layers."""
    policy = policy or DEFAULT_DUCKING

    result = []
    for layer in layers:
        if should_duck_layer(layer):
            layer_copy = dict(layer)
            layer_copy["ducking"] = {
                "enabled": True,
                "baseVolume": layer.get("volume", 1) * policy.full_level,
                "duckedVolume": layer.get("volume", 1) * policy.duck_level,
                "attackFrames": policy.attack_frames,
                "releaseFrames": policy.release_frames,
            }
            result.append(layer_copy)
        else:
            result.append(layer)

    return result
