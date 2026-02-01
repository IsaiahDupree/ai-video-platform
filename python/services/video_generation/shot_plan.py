"""
Shot Plan Generator

Transforms Story IR + Format Pack into Sora-facing shot requests.
"""

import hashlib
import json
from typing import Optional

from .types import (
    StoryIRV1,
    FormatPackV1,
    ShotPlanV1,
    ShotPlanMeta,
    StyleBible,
    ShotReferences,
    Shot,
    BeatType,
)


# Default style tokens for stick-figure explainer style
DEFAULT_GLOBAL_TOKENS = [
    "clean flat 2D explainer",
    "high contrast",
    "big readable typography space",
    "simple stick figure character",
    "minimal shading",
    "centered composition",
]

DEFAULT_NEGATIVE_TOKENS = [
    "tiny text",
    "photorealistic",
    "busy background",
    "complex textures",
    "realistic humans",
]


def compute_cache_key(
    model: str,
    size: str,
    prompt: str,
    reference_file_ids: list[str],
) -> str:
    """
    Compute a deterministic cache key for a shot.
    
    Args:
        model: Sora model name
        size: Video size
        prompt: Shot prompt
        reference_file_ids: Reference file IDs
        
    Returns:
        SHA256 hash string
    """
    data = json.dumps({
        "model": model,
        "size": size,
        "prompt": prompt,
        "refs": sorted(reference_file_ids),
    }, sort_keys=True)
    
    return hashlib.sha256(data.encode()).hexdigest()


def make_shot_plan(
    ir: StoryIRV1,
    format_pack: FormatPackV1,
    model: str = "sora-2",
    size: Optional[str] = None,
    reference_file_ids: Optional[list[str]] = None,
    global_tokens: Optional[list[str]] = None,
    negative_tokens: Optional[list[str]] = None,
) -> ShotPlanV1:
    """
    Generate a shot plan from Story IR and format pack.
    
    The format pack determines which beats become Sora shots vs native scenes.
    
    Args:
        ir: Story IR
        format_pack: Format pack with render strategy
        model: Sora model to use
        size: Video size (auto-determined from aspect if not provided)
        reference_file_ids: Reference file IDs for consistency
        global_tokens: Style tokens to include in prompts
        negative_tokens: Tokens to avoid
        
    Returns:
        ShotPlanV1 with Sora requests
    """
    # Determine size from aspect
    if size is None:
        size = "720x1280" if ir.meta.aspect == "9:16" else "1280x720"
    
    # Use provided tokens or defaults
    g_tokens = global_tokens or DEFAULT_GLOBAL_TOKENS
    n_tokens = negative_tokens or DEFAULT_NEGATIVE_TOKENS
    
    ref_ids = reference_file_ids or []
    
    # Filter beats to those that should be Sora-generated
    sora_beat_types = set(format_pack.render_strategy.sora_beat_types)
    sora_beats = [b for b in ir.beats if b.type in sora_beat_types]
    
    shots: list[Shot] = []
    
    for beat in sora_beats:
        # Build the shot prompt
        prompt = build_shot_prompt(
            beat=beat,
            ir=ir,
            global_tokens=g_tokens,
            negative_tokens=n_tokens,
        )
        
        # Compute cache key
        cache_key = compute_cache_key(
            model=model,
            size=size,
            prompt=prompt,
            reference_file_ids=ref_ids,
        )
        
        # Determine seconds (clamp to reasonable range)
        seconds = max(1, min(20, round(beat.duration_s)))
        
        shots.append(Shot(
            id=f"shot_{beat.id}",
            from_beat_id=beat.id,
            seconds=seconds,
            prompt=prompt,
            model=model,
            size=size,
            tags=[beat.type],
            cache_key=cache_key,
        ))
    
    return ShotPlanV1(
        meta=ShotPlanMeta(
            fps=ir.meta.fps,
            aspect=ir.meta.aspect,
            size=size,
        ),
        style_bible=StyleBible(
            global_tokens=g_tokens,
            negative_tokens=n_tokens,
        ),
        references=ShotReferences(file_ids=ref_ids) if ref_ids else None,
        shots=shots,
    )


def build_shot_prompt(
    beat: "Beat",
    ir: StoryIRV1,
    global_tokens: list[str],
    negative_tokens: list[str],
) -> str:
    """
    Build a Sora prompt for a beat.
    
    Args:
        beat: The beat to generate
        ir: Story IR for context
        global_tokens: Style tokens
        negative_tokens: Avoid tokens
        
    Returns:
        Formatted prompt string
    """
    parts = []
    
    # Beat type context
    parts.append(f"Beat type: {beat.type.value}.")
    
    # Narration context (for visual cues)
    parts.append(f"Narration context: {beat.narration}")
    
    # On-screen text guidance
    if beat.on_screen:
        if beat.on_screen.headline:
            parts.append(f"On-screen headline: '{beat.on_screen.headline}'")
        if beat.on_screen.bullet:
            parts.append(f"On-screen bullet: '{beat.on_screen.bullet}'")
        if beat.on_screen.label:
            parts.append(f"Label text: '{beat.on_screen.label}'")
    
    # B-roll intent
    if beat.broll:
        broll_desc = ", ".join(f"{b.intent}: {b.query}" for b in beat.broll)
        parts.append(f"Visual intent: {broll_desc}")
    
    # Composition guidance
    parts.append("Composition: keep safe margins for captions at bottom.")
    
    # Combine all parts
    beat_prompt = " ".join(parts)
    
    # Build full prompt with style tokens
    style_prefix = ", ".join(global_tokens)
    avoid_suffix = ", ".join(negative_tokens)
    
    return f"{style_prefix}. {beat_prompt}. Avoid: {avoid_suffix}."


def get_shots_for_beat_type(
    shot_plan: ShotPlanV1,
    beat_type: BeatType,
) -> list[Shot]:
    """
    Get all shots for a specific beat type.
    
    Args:
        shot_plan: The shot plan
        beat_type: Type to filter by
        
    Returns:
        List of matching shots
    """
    return [s for s in shot_plan.shots if beat_type in s.tags]


def estimate_sora_cost(
    shot_plan: ShotPlanV1,
    cost_per_second: float = 0.05,
) -> float:
    """
    Estimate Sora generation cost.
    
    Args:
        shot_plan: The shot plan
        cost_per_second: Cost per second of video
        
    Returns:
        Estimated cost in dollars
    """
    total_seconds = sum(s.seconds for s in shot_plan.shots)
    return total_seconds * cost_per_second


def get_cached_shots(
    shot_plan: ShotPlanV1,
    existing_cache_keys: set[str],
) -> tuple[list[Shot], list[Shot]]:
    """
    Split shots into cached and uncached.
    
    Args:
        shot_plan: The shot plan
        existing_cache_keys: Set of already-generated cache keys
        
    Returns:
        Tuple of (cached_shots, uncached_shots)
    """
    cached = []
    uncached = []
    
    for shot in shot_plan.shots:
        if shot.cache_key in existing_cache_keys:
            cached.append(shot)
        else:
            uncached.append(shot)
    
    return cached, uncached


def apply_voice_policy_to_shots(
    shot_plan: ShotPlanV1,
    mute_audio_beat_ids: set[str],
    forbid_talking_beat_ids: set[str],
) -> ShotPlanV1:
    """
    Apply voice policy constraints to shot prompts.
    
    Args:
        shot_plan: The shot plan
        mute_audio_beat_ids: Beat IDs where Sora audio should be muted
        forbid_talking_beat_ids: Beat IDs where no talking visuals allowed
        
    Returns:
        Updated shot plan with modified prompts
    """
    no_talking_tokens = [
        "no visible speaking",
        "no lip movement",
        "no dialogue text on screen",
        "mouth closed or neutral expression",
    ]
    
    ambience_tokens = [
        "no speech audio",
        "ambient sound only",
        "no voiceover",
    ]
    
    new_shots = []
    for shot in shot_plan.shots:
        prompt = shot.prompt
        
        # Add no-talking tokens
        if shot.from_beat_id in forbid_talking_beat_ids:
            prompt = prompt.rstrip(".") + ". " + ", ".join(no_talking_tokens) + "."
        
        # Add ambience-only tokens
        if shot.from_beat_id in mute_audio_beat_ids:
            prompt = prompt.rstrip(".") + ". " + ", ".join(ambience_tokens) + "."
        
        # Recompute cache key with new prompt
        new_cache_key = compute_cache_key(
            model=shot.model,
            size=shot.size,
            prompt=prompt,
            reference_file_ids=shot_plan.references.file_ids if shot_plan.references else [],
        )
        
        new_shots.append(Shot(
            id=shot.id,
            from_beat_id=shot.from_beat_id,
            seconds=shot.seconds,
            prompt=prompt,
            model=shot.model,
            size=shot.size,
            tags=shot.tags,
            cache_key=new_cache_key,
        ))
    
    return ShotPlanV1(
        meta=shot_plan.meta,
        style_bible=shot_plan.style_bible,
        references=shot_plan.references,
        shots=new_shots,
    )
