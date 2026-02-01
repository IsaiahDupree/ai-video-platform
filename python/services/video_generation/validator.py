"""
Pipeline Validator

Pre-flight validation for the video generation pipeline.
Catches errors before spending Sora generation credits.
"""

from typing import Optional
from pydantic import BaseModel, Field

from .types import (
    StoryIRV1,
    FormatPackV1,
    ShotPlanV1,
    AssetManifestV1,
    RenderPlanRemotionV1,
    BeatType,
)


class ValidationError(BaseModel):
    """A validation error."""
    code: str
    message: str
    severity: str = "error"  # error, warning


class ValidationResult(BaseModel):
    """Result of pipeline validation."""
    valid: bool
    errors: list[ValidationError] = Field(default_factory=list)
    warnings: list[ValidationError] = Field(default_factory=list)
    
    def add_error(self, code: str, message: str):
        """Add an error."""
        self.errors.append(ValidationError(code=code, message=message, severity="error"))
        self.valid = False
    
    def add_warning(self, code: str, message: str):
        """Add a warning."""
        self.warnings.append(ValidationError(code=code, message=message, severity="warning"))


def validate_story_ir(ir: StoryIRV1) -> ValidationResult:
    """
    Validate a Story IR.
    
    Checks:
    - Total duration within limits
    - Required beats present
    - No duplicate beat IDs
    - All beats have narration
    
    Args:
        ir: Story IR to validate
        
    Returns:
        ValidationResult
    """
    result = ValidationResult(valid=True)
    
    # Check total duration
    total_duration = ir.total_duration_s()
    max_duration = ir.meta.max_seconds
    
    if total_duration > max_duration:
        result.add_error(
            "DURATION_EXCEEDED",
            f"Total duration ({total_duration:.1f}s) exceeds max ({max_duration}s)"
        )
    
    # Check for required beats
    beat_types = {b.type for b in ir.beats}
    if BeatType.HOOK not in beat_types:
        result.add_warning("MISSING_HOOK", "No HOOK beat found")
    
    # Check for duplicate IDs
    ids = [b.id for b in ir.beats]
    if len(ids) != len(set(ids)):
        result.add_error("DUPLICATE_BEAT_IDS", "Duplicate beat IDs found")
    
    # Check narration
    for beat in ir.beats:
        if not beat.narration or not beat.narration.strip():
            result.add_error(
                "EMPTY_NARRATION",
                f"Beat {beat.id} has empty narration"
            )
    
    return result


def validate_shot_plan(
    shot_plan: ShotPlanV1,
    ir: StoryIRV1,
    format_pack: FormatPackV1,
) -> ValidationResult:
    """
    Validate a shot plan against IR and format pack.
    
    Checks:
    - FPS alignment
    - All shots reference valid beats
    - Sora-routed beats have shots
    - Cache keys are unique
    
    Args:
        shot_plan: Shot plan to validate
        ir: Story IR
        format_pack: Format pack
        
    Returns:
        ValidationResult
    """
    result = ValidationResult(valid=True)
    
    # FPS alignment
    if shot_plan.meta.fps != ir.meta.fps:
        result.add_error(
            "FPS_MISMATCH",
            f"Shot plan FPS ({shot_plan.meta.fps}) != IR FPS ({ir.meta.fps})"
        )
    
    # Check beat references
    beat_ids = {b.id for b in ir.beats}
    for shot in shot_plan.shots:
        if shot.from_beat_id not in beat_ids:
            result.add_error(
                "INVALID_BEAT_REF",
                f"Shot {shot.id} references unknown beat: {shot.from_beat_id}"
            )
    
    # Check Sora beats have shots
    shot_beat_ids = {s.from_beat_id for s in shot_plan.shots}
    sora_beat_types = {
        bt.value if hasattr(bt, 'value') else bt 
        for bt in format_pack.render_strategy.sora_beat_types
    }
    
    for beat in ir.beats:
        beat_type_str = beat.type.value if hasattr(beat.type, 'value') else beat.type
        if beat_type_str in sora_beat_types:
            if beat.id not in shot_beat_ids:
                result.add_error(
                    "MISSING_SHOT",
                    f"Sora-routed beat {beat.id} ({beat_type_str}) has no shot"
                )
    
    # Check cache key uniqueness
    cache_keys = [s.cache_key for s in shot_plan.shots]
    if len(cache_keys) != len(set(cache_keys)):
        result.add_warning(
            "DUPLICATE_CACHE_KEYS",
            "Duplicate cache keys found (may cause overwrites)"
        )
    
    return result


def validate_assets(
    assets: AssetManifestV1,
    shot_plan: ShotPlanV1,
) -> ValidationResult:
    """
    Validate assets against shot plan.
    
    Checks:
    - All shots have assets
    - Assets have valid sources
    
    Args:
        assets: Asset manifest
        shot_plan: Shot plan
        
    Returns:
        ValidationResult
    """
    result = ValidationResult(valid=True)
    
    # Build asset lookup
    asset_by_shot = {c.shot_id: c for c in assets.clips}
    
    for shot in shot_plan.shots:
        asset = asset_by_shot.get(shot.id)
        
        if not asset:
            result.add_error(
                "MISSING_ASSET",
                f"No asset for shot: {shot.id}"
            )
            continue
        
        if not asset.src:
            result.add_error(
                "MISSING_SRC",
                f"Asset for shot {shot.id} has no src"
            )
    
    return result


def validate_render_plan(
    render_plan: RenderPlanRemotionV1,
    ir: StoryIRV1,
    assets: AssetManifestV1,
) -> ValidationResult:
    """
    Validate a render plan.
    
    Checks:
    - FPS alignment
    - Timeline is sorted
    - No negative durations
    - Video items have sources
    - Native items have components
    
    Args:
        render_plan: Render plan
        ir: Story IR
        assets: Asset manifest
        
    Returns:
        ValidationResult
    """
    result = ValidationResult(valid=True)
    
    # FPS alignment
    if render_plan.meta.fps != ir.meta.fps:
        result.add_error(
            "FPS_MISMATCH",
            f"Render plan FPS ({render_plan.meta.fps}) != IR FPS ({ir.meta.fps})"
        )
    
    # Build asset src set
    asset_srcs = {c.src for c in assets.clips if c.src}
    
    # Check timeline items
    last_from = -1
    for item in render_plan.timeline:
        # Timing checks
        if item.from_frame < 0:
            result.add_error(
                "NEGATIVE_FROM",
                f"Timeline item {item.id} has negative from: {item.from_frame}"
            )
        
        if item.duration_in_frames <= 0:
            result.add_error(
                "NON_POSITIVE_DURATION",
                f"Timeline item {item.id} has non-positive duration"
            )
        
        if item.from_frame < last_from:
            result.add_error(
                "UNSORTED_TIMELINE",
                f"Timeline item {item.id} is out of order"
            )
        last_from = item.from_frame
        
        # Source checks
        if item.kind == "video":
            if not item.src:
                result.add_error(
                    "MISSING_VIDEO_SRC",
                    f"Video item {item.id} has no src"
                )
            elif item.src not in asset_srcs and not item.src.startswith("mock://"):
                result.add_warning(
                    "SRC_NOT_IN_ASSETS",
                    f"Video item {item.id} src not in asset manifest"
                )
        
        if item.kind == "native":
            if not item.component_name:
                result.add_error(
                    "MISSING_COMPONENT",
                    f"Native item {item.id} has no componentName"
                )
    
    return result


def validate_pipeline(
    ir: StoryIRV1,
    format_pack: FormatPackV1,
    shot_plan: ShotPlanV1,
    assets: AssetManifestV1,
    render_plan: RenderPlanRemotionV1,
) -> ValidationResult:
    """
    Validate the entire pipeline.
    
    Runs all validators and aggregates results.
    
    Args:
        ir: Story IR
        format_pack: Format pack
        shot_plan: Shot plan
        assets: Asset manifest
        render_plan: Render plan
        
    Returns:
        Aggregated ValidationResult
    """
    result = ValidationResult(valid=True)
    
    # Run all validators
    validators = [
        ("Story IR", validate_story_ir(ir)),
        ("Shot Plan", validate_shot_plan(shot_plan, ir, format_pack)),
        ("Assets", validate_assets(assets, shot_plan)),
        ("Render Plan", validate_render_plan(render_plan, ir, assets)),
    ]
    
    for name, validation in validators:
        for err in validation.errors:
            result.add_error(f"{name}:{err.code}", err.message)
        for warn in validation.warnings:
            result.add_warning(f"{name}:{warn.code}", warn.message)
    
    return result


def validate_pre_sora(
    ir: StoryIRV1,
    format_pack: FormatPackV1,
) -> ValidationResult:
    """
    Pre-Sora validation (before spending credits).
    
    Validates IR and format pack alignment.
    
    Args:
        ir: Story IR
        format_pack: Format pack
        
    Returns:
        ValidationResult
    """
    result = ValidationResult(valid=True)
    
    # Validate IR
    ir_result = validate_story_ir(ir)
    for err in ir_result.errors:
        result.add_error(f"IR:{err.code}", err.message)
    for warn in ir_result.warnings:
        result.add_warning(f"IR:{warn.code}", warn.message)
    
    # Check format constraints
    constraints = format_pack.rules.constraints
    
    if "max_total_s" in constraints:
        if ir.total_duration_s() > constraints["max_total_s"]:
            result.add_error(
                "FORMAT_DURATION_EXCEEDED",
                f"IR duration exceeds format max ({constraints['max_total_s']}s)"
            )
    
    if "max_steps" in constraints:
        step_count = len([b for b in ir.beats if b.type == BeatType.STEP])
        if step_count > constraints["max_steps"]:
            result.add_error(
                "FORMAT_STEPS_EXCEEDED",
                f"Step count ({step_count}) exceeds format max ({constraints['max_steps']})"
            )
    
    return result
