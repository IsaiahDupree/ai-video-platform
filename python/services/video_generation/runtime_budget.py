"""
Runtime Budget

Manages total video runtime constraints and applies compression
when narration exceeds the time budget.
"""

from typing import Optional
from pydantic import BaseModel, Field


class RuntimeBudget(BaseModel):
    """Runtime budget configuration."""
    max_total_seconds: int = Field(default=60, alias="maxTotalSeconds", ge=15, le=180)
    max_vo_speedup: float = Field(default=1.10, alias="maxVOSpeedup", ge=1.0, le=1.25)
    min_buffer_scale: float = Field(default=0.6, alias="minBufferScale", ge=0.4, le=1.0)
    
    class Config:
        populate_by_name = True


DEFAULT_RUNTIME_BUDGET = RuntimeBudget()


class CompressionPlan(BaseModel):
    """Plan for compressing runtime to fit budget."""
    vo_speedup: Optional[float] = Field(None, alias="voSpeedup")
    buffer_scale: Optional[float] = Field(None, alias="bufferScale")
    note: str
    fits_budget: bool = Field(alias="fitsBudget")
    original_seconds: float = Field(alias="originalSeconds")
    target_seconds: float = Field(alias="targetSeconds")
    estimated_final_seconds: float = Field(alias="estimatedFinalSeconds")
    
    class Config:
        populate_by_name = True


def compute_compression_plan(
    total_seconds: float,
    budget: Optional[RuntimeBudget] = None,
) -> Optional[CompressionPlan]:
    """
    Compute compression plan to fit runtime budget.
    
    Args:
        total_seconds: Current total runtime
        budget: Runtime budget constraints
        
    Returns:
        CompressionPlan or None if no compression needed
    """
    budget = budget or DEFAULT_RUNTIME_BUDGET
    
    if total_seconds <= budget.max_total_seconds:
        return None  # No compression needed
    
    over = total_seconds - budget.max_total_seconds
    ratio_needed = budget.max_total_seconds / total_seconds
    
    # Strategy 1: Reduce buffers (assume ~10% is buffer)
    buffer_scale = max(budget.min_buffer_scale, min(1.0, ratio_needed / 0.95))
    after_buffer = total_seconds * (0.95 * buffer_scale + 0.05)
    
    if after_buffer <= budget.max_total_seconds:
        return CompressionPlan(
            buffer_scale=buffer_scale,
            note=f"Reduced buffers to fit budget (over by {over:.2f}s)",
            fits_budget=True,
            original_seconds=total_seconds,
            target_seconds=budget.max_total_seconds,
            estimated_final_seconds=after_buffer,
        )
    
    # Strategy 2: Add VO speedup
    vo_speedup = min(budget.max_vo_speedup, total_seconds / budget.max_total_seconds)
    estimated_final = total_seconds / vo_speedup * buffer_scale
    
    fits = estimated_final <= budget.max_total_seconds * 1.05  # 5% tolerance
    
    return CompressionPlan(
        buffer_scale=buffer_scale,
        vo_speedup=vo_speedup,
        note=f"Reduced buffers + sped VO up to {(vo_speedup * 100 - 100):.1f}%",
        fits_budget=fits,
        original_seconds=total_seconds,
        target_seconds=budget.max_total_seconds,
        estimated_final_seconds=estimated_final,
    )


def apply_compression_to_beats(
    beats: list[dict],
    plan: CompressionPlan,
) -> list[dict]:
    """
    Apply compression plan to beat durations.
    
    Args:
        beats: List of beat dicts
        plan: Compression plan
        
    Returns:
        Updated beats with compressed durations
    """
    if not plan.vo_speedup and not plan.buffer_scale:
        return beats
    
    scale = 1.0
    
    if plan.vo_speedup:
        scale /= plan.vo_speedup
    
    if plan.buffer_scale:
        # Apply buffer scale to non-speech portion
        # Assume 90% is speech, 10% is buffer
        scale = 0.9 * scale + 0.1 * plan.buffer_scale
    
    updated = []
    for beat in beats:
        old_dur = beat.get("duration_s") or beat.get("durationS", 3)
        new_dur = max(0.5, old_dur * scale)
        
        updated_beat = dict(beat)
        updated_beat["duration_s"] = round(new_dur, 2)
        if "durationS" in updated_beat:
            updated_beat["durationS"] = round(new_dur, 2)
        updated.append(updated_beat)
    
    return updated


def apply_compression_to_ir(
    ir: dict,
    plan: CompressionPlan,
) -> dict:
    """
    Apply compression plan to Story IR.
    
    Args:
        ir: Story IR dict
        plan: Compression plan
        
    Returns:
        Updated Story IR
    """
    updated_beats = apply_compression_to_beats(ir.get("beats", []), plan)
    
    return {
        **ir,
        "beats": updated_beats,
        "compression": plan.model_dump(by_alias=True),
    }


def check_runtime_budget(
    ir: dict,
    budget: Optional[RuntimeBudget] = None,
) -> dict:
    """
    Check if Story IR fits runtime budget.
    
    Args:
        ir: Story IR dict
        budget: Runtime budget
        
    Returns:
        Report with status and optional compression plan
    """
    budget = budget or DEFAULT_RUNTIME_BUDGET
    
    total = sum(
        b.get("duration_s") or b.get("durationS", 0)
        for b in ir.get("beats", [])
    )
    
    plan = compute_compression_plan(total, budget)
    
    return {
        "totalSeconds": round(total, 2),
        "budgetSeconds": budget.max_total_seconds,
        "overBudget": total > budget.max_total_seconds,
        "overBy": round(max(0, total - budget.max_total_seconds), 2),
        "compressionPlan": plan.model_dump(by_alias=True) if plan else None,
    }


def auto_fit_to_budget(
    ir: dict,
    budget: Optional[RuntimeBudget] = None,
) -> dict:
    """
    Automatically fit Story IR to runtime budget.
    
    Args:
        ir: Story IR dict
        budget: Runtime budget
        
    Returns:
        Updated Story IR (compressed if needed)
    """
    budget = budget or DEFAULT_RUNTIME_BUDGET
    
    total = sum(
        b.get("duration_s") or b.get("durationS", 0)
        for b in ir.get("beats", [])
    )
    
    plan = compute_compression_plan(total, budget)
    
    if not plan:
        return ir  # Already fits
    
    return apply_compression_to_ir(ir, plan)


def split_long_beat(beat: dict, max_words: int = 30) -> list[dict]:
    """
    Split a long beat into multiple shorter beats.
    
    Args:
        beat: Beat dict
        max_words: Max words per beat
        
    Returns:
        List of split beats (or original if short enough)
    """
    narration = beat.get("narration", "")
    words = narration.split()
    
    if len(words) <= max_words:
        return [beat]
    
    # Split into chunks
    chunks = []
    for i in range(0, len(words), max_words):
        chunk_words = words[i:i + max_words]
        chunks.append(" ".join(chunk_words))
    
    # Create new beats
    beats = []
    for i, chunk in enumerate(chunks):
        new_beat = dict(beat)
        new_beat["id"] = f"{beat.get('id', 'beat')}_{i}"
        new_beat["narration"] = chunk
        # Estimate duration for chunk
        new_beat["duration_s"] = max(1.5, len(chunk.split()) / 155 * 60 + 0.3)
        beats.append(new_beat)
    
    return beats


def split_long_beats_in_ir(ir: dict, max_words: int = 30) -> dict:
    """
    Split long beats in Story IR.
    
    Args:
        ir: Story IR dict
        max_words: Max words per beat
        
    Returns:
        Updated Story IR with split beats
    """
    new_beats = []
    splits_made = 0
    
    for beat in ir.get("beats", []):
        split_beats = split_long_beat(beat, max_words)
        new_beats.extend(split_beats)
        if len(split_beats) > 1:
            splits_made += 1
    
    return {
        **ir,
        "beats": new_beats,
        "beatSplits": splits_made,
    }
