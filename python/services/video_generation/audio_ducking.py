"""
Audio Ducking Policy

Automatically reduces background audio volume during narration
to ensure voice clarity while maintaining ambient vibe.
"""

from typing import Optional
from pydantic import BaseModel, Field


class DuckingPolicy(BaseModel):
    """Configuration for audio ducking."""
    enabled: bool = True
    bg_base_volume: float = Field(default=0.9, alias="bgBaseVolume", ge=0, le=1)
    ducked_volume: float = Field(default=0.18, alias="duckedVolume", ge=0, le=1)
    fade_frames: int = Field(default=6, alias="fadeFrames", ge=0)
    
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


def is_in_narration(frame: int, cues: list[NarrationCue]) -> bool:
    """
    Check if a frame is within any narration cue.
    
    Args:
        frame: Current frame
        cues: List of narration cues
        
    Returns:
        True if frame is during narration
    """
    return any(
        cue.from_frame <= frame < cue.end_frame
        for cue in cues
    )


def bg_volume_at_frame(
    frame: int,
    cues: list[NarrationCue],
    policy: Optional[DuckingPolicy] = None,
) -> float:
    """
    Get background volume multiplier at a specific frame.
    
    Args:
        frame: Current frame
        cues: List of narration cues
        policy: Ducking policy
        
    Returns:
        Volume multiplier (0-1)
    """
    policy = policy or DEFAULT_DUCKING
    
    if not policy.enabled:
        return policy.bg_base_volume
    
    in_cue = is_in_narration(frame, cues)
    return policy.ducked_volume if in_cue else policy.bg_base_volume


def generate_volume_keyframes(
    total_frames: int,
    cues: list[NarrationCue],
    policy: Optional[DuckingPolicy] = None,
    sample_rate: int = 1,
) -> list[dict]:
    """
    Generate volume keyframes for Remotion interpolation.
    
    Args:
        total_frames: Total frames in video
        cues: List of narration cues
        policy: Ducking policy
        sample_rate: Sample every N frames
        
    Returns:
        List of keyframe dicts with 'frame' and 'volume'
    """
    policy = policy or DEFAULT_DUCKING
    keyframes = []
    
    # Always include first frame
    keyframes.append({
        "frame": 0,
        "volume": policy.bg_base_volume,
    })
    
    # Add keyframes at cue boundaries with fade
    for cue in sorted(cues, key=lambda c: c.from_frame):
        fade = policy.fade_frames
        
        # Duck start (fade down)
        duck_start = max(0, cue.from_frame - fade)
        keyframes.append({"frame": duck_start, "volume": policy.bg_base_volume})
        keyframes.append({"frame": cue.from_frame, "volume": policy.ducked_volume})
        
        # Duck end (fade up)
        duck_end = cue.end_frame
        keyframes.append({"frame": duck_end, "volume": policy.ducked_volume})
        keyframes.append({"frame": min(total_frames, duck_end + fade), "volume": policy.bg_base_volume})
    
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
    """
    Convert beats to narration cues based on narration text presence.
    
    Args:
        beats: List of beat dicts
        fps: Frames per second
        
    Returns:
        List of NarrationCue
    """
    cues = []
    cursor_frames = 0
    
    for beat in beats:
        duration_s = beat.get("duration_s") or beat.get("durationS", 3)
        duration_frames = max(1, round(duration_s * fps))
        
        # Check if beat has narration
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
    """
    Extract narration cues from Story IR.
    
    Args:
        ir: Story IR dict
        fps: Frames per second (uses ir.meta.fps if not provided)
        
    Returns:
        List of NarrationCue
    """
    fps = fps or ir.get("meta", {}).get("fps", 30)
    beats = ir.get("beats", [])
    
    return beats_to_narration_cues(beats, fps)


def calculate_ducking_for_render_plan(
    render_plan: dict,
    narration_cues: list[NarrationCue],
    policy: Optional[DuckingPolicy] = None,
) -> dict:
    """
    Add ducking information to a render plan.
    
    Args:
        render_plan: Render plan dict with layers
        narration_cues: Narration cues
        policy: Ducking policy
        
    Returns:
        Render plan with ducking metadata
    """
    policy = policy or DEFAULT_DUCKING
    
    # Calculate total frames
    layers = render_plan.get("layers", [])
    total_frames = max(
        (layer.get("from", 0) + layer.get("durationInFrames", 0))
        for layer in layers
    ) if layers else 0
    
    # Generate keyframes
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
    """
    Determine if a layer should have ducking applied.
    
    Only VIDEO layers with audio (not muted) should be ducked.
    
    Args:
        layer: Layer dict
        
    Returns:
        True if layer should be ducked
    """
    if layer.get("kind") != "VIDEO":
        return False
    
    if layer.get("muted", False):
        return False
    
    # FULL_SCENE shots may have ambient audio worth ducking
    shot_type = layer.get("shotType") or layer.get("shot_type")
    if shot_type == "FULL_SCENE":
        return True
    
    # Any video with non-zero volume
    volume = layer.get("volume", 1)
    return volume > 0


def apply_ducking_to_layers(
    layers: list[dict],
    narration_cues: list[NarrationCue],
    policy: Optional[DuckingPolicy] = None,
) -> list[dict]:
    """
    Apply ducking metadata to render plan layers.
    
    Args:
        layers: List of layer dicts
        narration_cues: Narration cues
        policy: Ducking policy
        
    Returns:
        Layers with ducking info attached
    """
    policy = policy or DEFAULT_DUCKING
    
    result = []
    for layer in layers:
        if should_duck_layer(layer):
            # Add ducking info
            layer_copy = dict(layer)
            layer_copy["ducking"] = {
                "enabled": True,
                "baseVolume": layer.get("volume", 1) * policy.bg_base_volume,
                "duckedVolume": layer.get("volume", 1) * policy.ducked_volume,
                "fadeFrames": policy.fade_frames,
            }
            result.append(layer_copy)
        else:
            result.append(layer)
    
    return result
