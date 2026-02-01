"""
Plate Manager

Handles plate looping, duration matching, variety injection,
and anti-pattern detection for reusable BG plates.
"""

import random
from typing import Optional, Literal
from pydantic import BaseModel, Field

from .types import StoryIRV1, BeatType


BgFillMode = Literal["LOOP", "STRETCH", "HOLD_LAST"]


class PlateVariantPlan(BaseModel):
    """How a plate covers a beat."""
    fill_mode: BgFillMode = Field(alias="fillMode")
    trim_offset_frames: int = Field(default=0, alias="trimOffsetFrames")
    playback_rate: Optional[float] = Field(None, alias="playbackRate")
    
    class Config:
        populate_by_name = True


class PlateUsage(BaseModel):
    """Usage of a plate for a specific beat."""
    beat_id: str = Field(alias="beatId")
    plate_key: str = Field(alias="plateKey")
    beat_frames: int = Field(alias="beatFrames")
    plate_frames: int = Field(alias="plateFrames")
    variant: PlateVariantPlan
    
    class Config:
        populate_by_name = True


class RiskFlags(BaseModel):
    """Risk flags for anti-pattern detection."""
    seam_repeat: bool = Field(default=False, alias="seamRepeat")
    same_plate_run: bool = Field(default=False, alias="samePlateRun")
    same_trim_run: bool = Field(default=False, alias="sameTrimRun")
    extreme_stretch: bool = Field(default=False, alias="extremeStretch")
    
    class Config:
        populate_by_name = True


class RiskReport(BaseModel):
    """Risk report for a plate usage."""
    usage: PlateUsage
    score: int = Field(default=0, ge=0, le=100)
    flags: RiskFlags
    
    class Config:
        populate_by_name = True


class RiskConfig(BaseModel):
    """Configuration for anti-pattern detection."""
    max_same_plate_consecutive: int = Field(default=2, alias="maxSamePlateConsecutive")
    max_same_trim_consecutive: int = Field(default=2, alias="maxSameTrimConsecutive")
    min_playback_rate: float = Field(default=0.70, alias="minPlaybackRate")
    max_playback_rate: float = Field(default=1.25, alias="maxPlaybackRate")
    seam_repeat_penalty: int = Field(default=25, alias="seamRepeatPenalty")
    same_plate_penalty: int = Field(default=30, alias="samePlatePenalty")
    same_trim_penalty: int = Field(default=20, alias="sameTrimPenalty")
    extreme_stretch_penalty: int = Field(default=25, alias="extremeStretchPenalty")
    
    class Config:
        populate_by_name = True


DEFAULT_RISK_CONFIG = RiskConfig()


def match_plate_to_beat(
    beat_frames: int,
    plate_frames: int,
    max_trim_offset_frames: Optional[int] = None,
    prefer_stretch_over_loop: bool = True,
    deterministic_seed: Optional[int] = None,
) -> PlateVariantPlan:
    """
    Determine how a plate should cover a beat.
    
    Args:
        beat_frames: Duration of beat in frames
        plate_frames: Duration of plate in frames
        max_trim_offset_frames: Max random trim offset
        prefer_stretch_over_loop: Prefer stretching over looping
        deterministic_seed: Seed for deterministic randomness
        
    Returns:
        PlateVariantPlan
    """
    if max_trim_offset_frames is None:
        max_trim_offset_frames = max(0, int(plate_frames * 0.5))
    
    # Deterministic randomness for trim offset
    if deterministic_seed is not None:
        rng = random.Random(deterministic_seed)
        trim_offset = rng.randint(0, max_trim_offset_frames) if max_trim_offset_frames > 0 else 0
    else:
        trim_offset = random.randint(0, max_trim_offset_frames) if max_trim_offset_frames > 0 else 0
    
    # Beat shorter than plate: just trim and hold
    if beat_frames <= plate_frames:
        return PlateVariantPlan(
            fill_mode="HOLD_LAST",
            trim_offset_frames=trim_offset,
        )
    
    # Beat longer than plate: stretch or loop
    if prefer_stretch_over_loop:
        playback_rate = plate_frames / beat_frames
        return PlateVariantPlan(
            fill_mode="STRETCH",
            trim_offset_frames=trim_offset,
            playback_rate=round(playback_rate, 3),
        )
    
    return PlateVariantPlan(
        fill_mode="LOOP",
        trim_offset_frames=trim_offset,
    )


def build_beat_bg_bindings(
    ir: StoryIRV1,
    step_beat_to_plate_key: dict[str, str],
    plate_seconds: float = 4.0,
    prefer_stretch: bool = True,
) -> dict[str, dict]:
    """
    Build bindings for each STEP beat to its plate with variant info.
    
    Args:
        ir: Story IR
        step_beat_to_plate_key: Mapping of beat ID to plate key
        plate_seconds: Duration of plates in seconds
        prefer_stretch: Prefer stretch over loop
        
    Returns:
        Dict mapping beat_id to binding info
    """
    fps = ir.meta.fps
    plate_frames = max(1, round(plate_seconds * fps))
    
    bindings = {}
    
    for beat in ir.beats:
        beat_type = beat.type.value if hasattr(beat.type, 'value') else beat.type
        if beat_type != "STEP":
            continue
        
        plate_key = step_beat_to_plate_key.get(beat.id)
        if not plate_key:
            continue
        
        beat_frames = max(1, round(beat.duration_s * fps))
        
        # Use beat index as seed for deterministic randomness
        seed = hash(beat.id) % 10000
        
        variant = match_plate_to_beat(
            beat_frames=beat_frames,
            plate_frames=plate_frames,
            max_trim_offset_frames=int(plate_frames * 0.4),
            prefer_stretch_over_loop=prefer_stretch,
            deterministic_seed=seed,
        )
        
        bindings[beat.id] = {
            "plateKey": plate_key,
            "beatFrames": beat_frames,
            "plateFrames": plate_frames,
            "variant": variant.model_dump(by_alias=True),
        }
    
    return bindings


def get_intent_key(beat: dict) -> str:
    """Extract intent key from a beat."""
    broll = beat.get("broll") or []
    if broll and isinstance(broll, list) and len(broll) > 0:
        return broll[0].get("intent", "abstract")
    return beat.get("type", "unknown")


def inject_variety(
    ir: StoryIRV1,
    budget_plan: dict,
    max_extra_plates: int = 3,
) -> dict:
    """
    Inject variety by adding extra plates at intent shift points.
    
    Args:
        ir: Story IR
        budget_plan: Current budget plan dict
        max_extra_plates: Maximum extra plates to add
        
    Returns:
        Updated budget plan
    """
    bg_shots = budget_plan.get("bgShotsToGenerate", [])
    step_to_plate = dict(budget_plan.get("stepBeatToPlateKey", {}))
    
    # Count current jobs
    current_jobs = len(bg_shots) + len(budget_plan.get("charAlphaBeats", []))
    max_jobs = budget_plan.get("maxSoraJobs", 10)
    remaining = max(0, max_jobs - current_jobs)
    
    if remaining <= 0:
        return budget_plan
    
    # Find STEP beats
    steps = [b for b in ir.beats if (b.type.value if hasattr(b.type, 'value') else b.type) == "STEP"]
    
    # Find intent shift points
    shifts = []
    for i in range(1, len(steps)):
        prev_intent = get_intent_key(steps[i-1].model_dump())
        curr_intent = get_intent_key(steps[i].model_dump())
        if prev_intent != curr_intent:
            shifts.append({
                "beatId": steps[i].id,
                "intent": curr_intent,
            })
    
    # Add extra plates at shift points
    extra_added = 0
    for i, shift in enumerate(shifts):
        if extra_added >= min(remaining, max_extra_plates):
            break
        
        plate_id = f"plate_step_extra_{i}"
        plate_key = f"bg_plate_{plate_id}"
        
        bg_shots.append({
            "key": plate_key,
            "role": "bg",
            "type": "STEP_PLATE",
            "seconds": 4,
            "promptHint": f"BG_ONLY: Generate a clean {shift['intent']} themed background plate, no text, safe margins.",
        })
        
        step_to_plate[shift["beatId"]] = plate_key
        extra_added += 1
    
    return {
        **budget_plan,
        "bgShotsToGenerate": bg_shots,
        "stepBeatToPlateKey": step_to_plate,
    }


def is_exact_multiple(a: int, b: int) -> bool:
    """Check if a is an exact multiple of b."""
    return b > 0 and a % b == 0


def detect_plate_anti_patterns(
    usages: list[PlateUsage],
    config: Optional[RiskConfig] = None,
) -> list[RiskReport]:
    """
    Detect anti-patterns in plate usage.
    
    Args:
        usages: List of plate usages
        config: Risk configuration
        
    Returns:
        List of RiskReport
    """
    cfg = config or DEFAULT_RISK_CONFIG
    reports = []
    
    same_plate_streak = 1
    same_trim_streak = 1
    
    for i, u in enumerate(usages):
        prev = usages[i - 1] if i > 0 else None
        
        # Track streaks
        if prev and prev.plate_key == u.plate_key:
            same_plate_streak += 1
        else:
            same_plate_streak = 1
        
        prev_trim = prev.variant.trim_offset_frames if prev else -1
        curr_trim = u.variant.trim_offset_frames
        if prev and prev_trim == curr_trim:
            same_trim_streak += 1
        else:
            same_trim_streak = 1
        
        # Check flags
        seam_repeat = (
            u.variant.fill_mode == "LOOP" and 
            is_exact_multiple(u.beat_frames, u.plate_frames)
        )
        
        same_plate_run = same_plate_streak > cfg.max_same_plate_consecutive
        same_trim_run = same_trim_streak > cfg.max_same_trim_consecutive
        
        playback_rate = u.variant.playback_rate or 1.0
        extreme_stretch = (
            u.variant.fill_mode == "STRETCH" and
            (playback_rate < cfg.min_playback_rate or playback_rate > cfg.max_playback_rate)
        )
        
        # Calculate score
        score = 0
        if seam_repeat:
            score += cfg.seam_repeat_penalty
        if same_plate_run:
            score += cfg.same_plate_penalty
        if same_trim_run:
            score += cfg.same_trim_penalty
        if extreme_stretch:
            score += cfg.extreme_stretch_penalty
        
        reports.append(RiskReport(
            usage=u,
            score=min(100, score),
            flags=RiskFlags(
                seam_repeat=seam_repeat,
                same_plate_run=same_plate_run,
                same_trim_run=same_trim_run,
                extreme_stretch=extreme_stretch,
            ),
        ))
    
    return reports


def fix_anti_patterns(
    usages: list[PlateUsage],
    reports: list[RiskReport],
    available_plates: list[str],
    plate_frames: int,
    risk_threshold: int = 50,
) -> list[PlateUsage]:
    """
    Fix detected anti-patterns by adjusting plate assignments.
    
    Args:
        usages: Current plate usages
        reports: Risk reports from detection
        available_plates: List of available plate keys
        plate_frames: Default plate duration in frames
        risk_threshold: Score threshold for fixing
        
    Returns:
        Fixed list of PlateUsage
    """
    fixed = []
    
    for i, (usage, report) in enumerate(zip(usages, reports)):
        if report.score < risk_threshold:
            fixed.append(usage)
            continue
        
        new_usage = usage.model_copy()
        
        # Fix seam repeat by switching to STRETCH
        if report.flags.seam_repeat:
            playback_rate = plate_frames / usage.beat_frames
            new_usage.variant = PlateVariantPlan(
                fill_mode="STRETCH",
                trim_offset_frames=usage.variant.trim_offset_frames,
                playback_rate=round(playback_rate, 3),
            )
        
        # Fix same plate run by switching to different plate
        if report.flags.same_plate_run and len(available_plates) > 1:
            current_key = usage.plate_key
            other_plates = [p for p in available_plates if p != current_key]
            if other_plates:
                new_usage.plate_key = other_plates[i % len(other_plates)]
        
        # Fix same trim run by randomizing trim
        if report.flags.same_trim_run:
            max_trim = int(plate_frames * 0.5)
            new_trim = (usage.variant.trim_offset_frames + int(plate_frames * 0.3)) % max_trim
            new_usage.variant = new_usage.variant.model_copy(
                update={"trim_offset_frames": new_trim}
            )
        
        # Fix extreme stretch by switching to LOOP
        if report.flags.extreme_stretch:
            new_usage.variant = PlateVariantPlan(
                fill_mode="LOOP",
                trim_offset_frames=usage.variant.trim_offset_frames,
            )
        
        fixed.append(new_usage)
    
    return fixed


def get_plate_usage_stats(usages: list[PlateUsage]) -> dict:
    """Get statistics about plate usage."""
    if not usages:
        return {
            "total_usages": 0,
            "unique_plates": 0,
            "fill_modes": {},
            "avg_playback_rate": None,
        }
    
    fill_modes: dict[str, int] = {}
    playback_rates = []
    
    for u in usages:
        mode = u.variant.fill_mode
        fill_modes[mode] = fill_modes.get(mode, 0) + 1
        if u.variant.playback_rate:
            playback_rates.append(u.variant.playback_rate)
    
    return {
        "total_usages": len(usages),
        "unique_plates": len(set(u.plate_key for u in usages)),
        "fill_modes": fill_modes,
        "avg_playback_rate": sum(playback_rates) / len(playback_rates) if playback_rates else None,
    }
