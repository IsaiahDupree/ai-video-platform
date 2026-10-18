"""
Story IR Generator

Transforms trend data and content briefs into a semantic intermediate representation.
"""

from typing import Optional

from .types import (
    TrendItemV1,
    ContentBriefV1,
    StoryIRV1,
    StoryIRMeta,
    StoryIRVariables,
    Beat,
    BeatType,
    OnScreenText,
    BrollIntent,
    AudioIntent,
)


def make_story_ir(
    trend: TrendItemV1,
    brief: ContentBriefV1,
    fps: int = 30,
    aspect: str = "9:16",
) -> StoryIRV1:
    """
    Generate a Story IR from trend data and content brief.
    
    This is a deterministic mapper. For AI-powered narration generation,
    use make_story_ir_with_ai() instead.
    
    Args:
        trend: Trend data with topic and angles
        brief: Content brief with goals and key points
        fps: Frames per second
        aspect: Aspect ratio
        
    Returns:
        StoryIRV1 semantic timeline
    """
    max_seconds = brief.constraints.max_seconds if brief.constraints else 58
    angle = trend.angle_candidates[0] if trend.angle_candidates else "most practical angle"
    
    beats: list[Beat] = []
    
    # HOOK beat
    beats.append(Beat(
        id="beat_hook",
        type=BeatType.HOOK,
        duration_s=2.5,
        narration=f"If you're trying to {brief.promise.lower()}, do this first.",
        on_screen=OnScreenText(
            headline=brief.promise,
            sub=trend.topic,
        ),
        broll=[BrollIntent(
            intent="abstract",
            query=f"{trend.topic} simple icon animation",
        )],
        audio=AudioIntent(
            music_energy="high",
            sfx=["whoosh"],
        ),
    ))
    
    # PROMISE beat
    step_count = min(len(brief.key_points), 8)
    beats.append(Beat(
        id="beat_promise",
        type=BeatType.PROMISE,
        duration_s=3.0,
        narration=f"In the next {max_seconds - 10} seconds, you'll learn the exact steps that actually work.",
        on_screen=OnScreenText(
            headline=f"The {step_count}-step plan",
        ),
        broll=[BrollIntent(
            intent="diagram",
            query=f"{step_count} step process diagram minimalist",
        )],
        audio=AudioIntent(
            music_energy="mid",
        ),
    ))
    
    # STEP beats
    for i, key_point in enumerate(brief.key_points[:8]):
        beats.append(Beat(
            id=f"beat_step_{i + 1}",
            type=BeatType.STEP,
            duration_s=5.0,
            narration=f"Step {i + 1}: {key_point}.",
            on_screen=OnScreenText(
                label=f"Step {i + 1}",
                bullet=key_point,
            ),
            broll=[BrollIntent(
                intent="ui-demo",
                query=f"{trend.topic} {key_point} UI example",
            )],
            audio=AudioIntent(
                music_energy="mid",
                sfx=["click"],
            ),
        ))
    
    # CTA beat
    if brief.cta:
        beats.append(Beat(
            id="beat_cta",
            type=BeatType.CTA,
            duration_s=2.5,
            narration=brief.cta.text,
            on_screen=OnScreenText(
                headline=brief.cta.text,
            ),
            audio=AudioIntent(
                music_energy="high",
                sfx=["pop"],
            ),
        ))
    
    # Clamp total duration
    total = sum(b.duration_s for b in beats)
    while total > max_seconds and len(beats) > 3:
        # Remove STEP beats first
        step_indices = [i for i, b in enumerate(beats) if b.type == BeatType.STEP]
        if step_indices:
            beats.pop(step_indices[-1])  # Remove last step
            total = sum(b.duration_s for b in beats)
        else:
            break
    
    return StoryIRV1(
        meta=StoryIRMeta(
            fps=fps,
            aspect=aspect,
            language="en",
            tone="witty-direct",
            max_seconds=max_seconds,
        ),
        variables=StoryIRVariables(
            topic=trend.topic,
            angle=angle,
            audience=brief.audience,
            promise=brief.promise,
        ),
        beats=beats,
    )


def adjust_beat_durations(
    ir: StoryIRV1,
    duration_overrides: dict[str, float],
) -> StoryIRV1:
    """
    Adjust beat durations based on actual TTS/clip lengths.
    
    Args:
        ir: The Story IR
        duration_overrides: Dict of beat_id -> new duration_s
        
    Returns:
        Updated StoryIRV1
    """
    new_beats = []
    for beat in ir.beats:
        if beat.id in duration_overrides:
            new_beat = beat.model_copy(update={"duration_s": duration_overrides[beat.id]})
            new_beats.append(new_beat)
        else:
            new_beats.append(beat)
    
    return StoryIRV1(
        meta=ir.meta,
        variables=ir.variables,
        beats=new_beats,
    )


def get_beats_by_type(ir: StoryIRV1, beat_type: BeatType) -> list[Beat]:
    """
    Get all beats of a specific type.
    
    Args:
        ir: The Story IR
        beat_type: Type to filter by
        
    Returns:
        List of matching beats
    """
    return [b for b in ir.beats if b.type == beat_type]


def get_beat_frames(ir: StoryIRV1) -> dict[str, tuple[int, int]]:
    """
    Get frame ranges for each beat.
    
    Args:
        ir: The Story IR
        
    Returns:
        Dict of beat_id -> (start_frame, end_frame)
    """
    fps = ir.meta.fps
    cursor = 0
    result = {}
    
    for beat in ir.beats:
        duration_frames = int(beat.duration_s * fps)
        result[beat.id] = (cursor, cursor + duration_frames)
        cursor += duration_frames
    
    return result


def validate_story_ir(ir: StoryIRV1) -> list[str]:
    """
    Validate a Story IR for common issues.
    
    Args:
        ir: The Story IR
        
    Returns:
        List of validation error messages
    """
    errors = []
    
    # Check total duration
    total = ir.total_duration_s()
    if total > ir.meta.max_seconds:
        errors.append(f"Total duration ({total}s) exceeds max ({ir.meta.max_seconds}s)")
    
    # Check for required beats
    beat_types = {b.type for b in ir.beats}
    if BeatType.HOOK not in beat_types:
        errors.append("Missing HOOK beat")
    
    # Check for duplicate IDs
    ids = [b.id for b in ir.beats]
    if len(ids) != len(set(ids)):
        errors.append("Duplicate beat IDs found")
    
    # Check narration exists
    for beat in ir.beats:
        if not beat.narration or not beat.narration.strip():
            errors.append(f"Beat {beat.id} has empty narration")
    
    return errors


def ir_to_narration_script(ir: StoryIRV1) -> str:
    """
    Extract full narration script from IR.
    
    Args:
        ir: The Story IR
        
    Returns:
        Full narration text
    """
    lines = []
    for beat in ir.beats:
        lines.append(f"[{beat.type.value}] {beat.narration}")
    return "\n\n".join(lines)


def estimate_word_count(ir: StoryIRV1) -> int:
    """
    Estimate total word count of narration.
    
    Args:
        ir: The Story IR
        
    Returns:
        Estimated word count
    """
    total = 0
    for beat in ir.beats:
        words = beat.narration.split()
        total += len(words)
    return total


def estimate_speaking_duration(ir: StoryIRV1, wpm: int = 155) -> float:
    """
    Estimate speaking duration based on word count.
    
    Args:
        ir: The Story IR
        wpm: Words per minute rate
        
    Returns:
        Estimated duration in seconds
    """
    word_count = estimate_word_count(ir)
    return (word_count / wpm) * 60
