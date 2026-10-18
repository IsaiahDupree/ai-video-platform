"""
Remotion Shot Budgeter

Integrates shot budgeting with Remotion render plans.
Creates reusable BG plates and manages asset binding for Remotion.
"""

from typing import Optional, Literal
from pydantic import BaseModel, Field

from .types import StoryIRV1, BeatType
from .shot_budgeter import (
    ShotBudget,
    BudgetPlan,
    apply_shot_budget,
    make_budgeted_shot_plan,
    estimate_budget_savings,
)
from .plate_manager import (
    PlateVariantPlan,
    build_beat_bg_bindings,
    inject_variety,
    detect_plate_anti_patterns,
    fix_anti_patterns,
    PlateUsage,
)


class RemotionBgLayer(BaseModel):
    """A background video layer for Remotion."""
    id: str
    kind: Literal["VIDEO"] = "VIDEO"
    from_frame: int = Field(alias="from")
    duration_in_frames: int = Field(alias="durationInFrames")
    src: str
    z_index: int = Field(default=0, alias="zIndex")
    volume: float = Field(default=0)
    muted: bool = True
    loop: bool = False
    playback_rate: Optional[float] = Field(None, alias="playbackRate")
    start_from: Optional[int] = Field(None, alias="startFrom")
    
    class Config:
        populate_by_name = True


class RemotionCharLayer(BaseModel):
    """A character overlay layer for Remotion."""
    id: str
    kind: Literal["VIDEO"] = "VIDEO"
    from_frame: int = Field(alias="from")
    duration_in_frames: int = Field(alias="durationInFrames")
    src: str
    z_index: int = Field(default=20, alias="zIndex")
    transparent: bool = True
    muted: bool = True
    anchor: str = "center"
    transform: Optional[dict] = None
    
    class Config:
        populate_by_name = True


class RemotionBudgetedPlan(BaseModel):
    """A budgeted plan ready for Remotion rendering."""
    meta: dict
    budget_plan: BudgetPlan = Field(alias="budgetPlan")
    shot_plan: dict = Field(alias="shotPlan")
    bg_bindings: dict = Field(alias="bgBindings")
    savings: dict
    
    class Config:
        populate_by_name = True


def create_remotion_budgeted_plan(
    ir: StoryIRV1,
    budget: Optional[ShotBudget] = None,
    model: str = "sora-2",
    reference_file_ids: Optional[list[str]] = None,
) -> RemotionBudgetedPlan:
    """
    Create a budgeted plan for Remotion rendering.
    
    Args:
        ir: Story IR
        budget: Shot budget constraints
        model: Sora model to use
        reference_file_ids: Reference files for Sora
        
    Returns:
        RemotionBudgetedPlan
    """
    # Apply budget
    budget_plan = apply_shot_budget(ir, budget)
    
    # Inject variety at intent shifts
    budget_plan_dict = budget_plan.model_dump(by_alias=True)
    budget_plan_dict = inject_variety(ir, budget_plan_dict)
    
    # Create shot plan
    shot_plan = make_budgeted_shot_plan(
        ir=ir,
        budget_plan=BudgetPlan.model_validate(budget_plan_dict),
        model=model,
        reference_file_ids=reference_file_ids,
    )
    
    # Build BG bindings
    bg_bindings = build_beat_bg_bindings(
        ir=ir,
        step_beat_to_plate_key=budget_plan_dict.get("stepBeatToPlateKey", {}),
        plate_seconds=4.0,
        prefer_stretch=True,
    )
    
    # Calculate savings
    savings = estimate_budget_savings(ir, budget_plan)
    
    return RemotionBudgetedPlan(
        meta={
            "fps": ir.meta.fps,
            "aspect": ir.meta.aspect,
            "totalBeats": len(ir.beats),
        },
        budget_plan=budget_plan,
        shot_plan=shot_plan,
        bg_bindings=bg_bindings,
        savings=savings,
    )


def bind_assets_to_remotion_layers(
    ir: StoryIRV1,
    budget_plan: BudgetPlan,
    assets: dict,
    bg_bindings: dict,
) -> list[dict]:
    """
    Bind generated assets to Remotion layers.
    
    Args:
        ir: Story IR
        budget_plan: Budget plan
        assets: Generated asset manifest
        bg_bindings: BG plate bindings
        
    Returns:
        List of Remotion layers
    """
    fps = ir.meta.fps
    layers = []
    
    # Index assets by shot ID
    clips_by_shot = {}
    for clip in assets.get("clips", []):
        shot_id = clip.get("shotId")
        if shot_id:
            clips_by_shot[shot_id] = clip
    
    # Index assets by beat ID
    clips_by_beat = {}
    for clip in assets.get("clips", []):
        beat_id = clip.get("beatId")
        if beat_id:
            if beat_id not in clips_by_beat:
                clips_by_beat[beat_id] = []
            clips_by_beat[beat_id].append(clip)
    
    cursor_frames = 0
    
    for beat in ir.beats:
        beat_type = beat.type.value if hasattr(beat.type, 'value') else beat.type
        duration_frames = max(1, round(beat.duration_s * fps))
        
        # Get BG layer
        bg_binding = bg_bindings.get(beat.id)
        
        if bg_binding:
            # Use reusable plate
            plate_key = bg_binding.get("plateKey")
            variant = bg_binding.get("variant", {})
            
            # Find the plate clip
            shot_id = f"shot_{plate_key}"
            plate_clip = clips_by_shot.get(shot_id)
            
            if plate_clip and plate_clip.get("src"):
                layer = RemotionBgLayer(
                    id=f"bg_{beat.id}",
                    from_frame=cursor_frames,
                    duration_in_frames=duration_frames,
                    src=plate_clip["src"],
                    z_index=0,
                    loop=variant.get("fillMode") == "LOOP",
                    playback_rate=variant.get("playbackRate"),
                    start_from=variant.get("trimOffsetFrames"),
                )
                layers.append(layer.model_dump(by_alias=True))
        else:
            # Direct BG clip for non-STEP beats
            beat_clips = clips_by_beat.get(beat.id, [])
            bg_clip = next(
                (c for c in beat_clips if c.get("role") == "bg" and c.get("src")),
                None
            )
            
            if bg_clip:
                layer = RemotionBgLayer(
                    id=f"bg_{beat.id}",
                    from_frame=cursor_frames,
                    duration_in_frames=duration_frames,
                    src=bg_clip["src"],
                    z_index=0,
                )
                layers.append(layer.model_dump(by_alias=True))
        
        # Get character overlay layer
        char_beat_ids = budget_plan.char_alpha_beats
        if beat.id in char_beat_ids:
            beat_clips = clips_by_beat.get(beat.id, [])
            char_clip = next(
                (c for c in beat_clips if c.get("role") == "char" and c.get("alphaSrc")),
                None
            )
            
            if char_clip:
                # Get overlay preset
                preset = char_clip.get("overlayPreset", "char_bottom_right")
                transform = get_preset_transform(preset)
                
                layer = RemotionCharLayer(
                    id=f"char_{beat.id}",
                    from_frame=cursor_frames,
                    duration_in_frames=duration_frames,
                    src=char_clip["alphaSrc"],
                    z_index=20,
                    anchor=transform.get("anchor", "center"),
                    transform=transform.get("transform"),
                )
                layers.append(layer.model_dump(by_alias=True))
        
        cursor_frames += duration_frames
    
    return layers


def get_preset_transform(preset: str) -> dict:
    """Get transform for a character overlay preset."""
    presets = {
        "char_bottom_right": {
            "anchor": "bottomRight",
            "transform": {"x": -20, "y": -20, "scale": 0.35},
        },
        "char_bottom_left": {
            "anchor": "bottomLeft",
            "transform": {"x": 20, "y": -20, "scale": 0.35},
        },
        "char_top_right": {
            "anchor": "topRight",
            "transform": {"x": -20, "y": 20, "scale": 0.30},
        },
        "char_top_left": {
            "anchor": "topLeft",
            "transform": {"x": 20, "y": 20, "scale": 0.30},
        },
        "char_center": {
            "anchor": "center",
            "transform": {"x": 0, "y": 0, "scale": 0.40},
        },
    }
    return presets.get(preset, presets["char_bottom_right"])


def validate_remotion_assets(
    ir: StoryIRV1,
    budget_plan: BudgetPlan,
    assets: dict,
) -> dict:
    """
    Validate that assets satisfy the budget plan.
    
    Args:
        ir: Story IR
        budget_plan: Budget plan
        assets: Generated assets
        
    Returns:
        Validation report
    """
    errors = []
    warnings = []
    
    clips = assets.get("clips", [])
    clips_by_shot = {c.get("shotId"): c for c in clips}
    
    # Check BG shots
    for bg_shot in budget_plan.bg_shots_to_generate:
        shot_id = f"shot_{bg_shot.key}"
        clip = clips_by_shot.get(shot_id)
        
        if not clip:
            errors.append(f"Missing BG clip for {bg_shot.key}")
        elif not clip.get("src"):
            errors.append(f"BG clip {bg_shot.key} has no src")
    
    # Check char shots
    for beat_id in budget_plan.char_alpha_beats:
        char_clips = [c for c in clips if c.get("beatId") == beat_id and c.get("role") == "char"]
        
        if not char_clips:
            warnings.append(f"Missing char clip for beat {beat_id}")
        else:
            for c in char_clips:
                if not c.get("alphaSrc"):
                    errors.append(f"Char clip for {beat_id} missing alphaSrc")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "stats": {
            "totalClips": len(clips),
            "bgClips": len([c for c in clips if c.get("role") == "bg"]),
            "charClips": len([c for c in clips if c.get("role") == "char"]),
        },
    }


def apply_anti_patterns_fix_to_bindings(
    ir: StoryIRV1,
    bg_bindings: dict,
    budget_plan: BudgetPlan,
) -> dict:
    """
    Apply anti-pattern detection and fixing to BG bindings.
    
    Args:
        ir: Story IR
        bg_bindings: Current BG bindings
        budget_plan: Budget plan
        
    Returns:
        Fixed BG bindings
    """
    fps = ir.meta.fps
    plate_frames = round(4 * fps)
    
    # Build usage list
    usages = []
    for beat in ir.beats:
        beat_type = beat.type.value if hasattr(beat.type, 'value') else beat.type
        if beat_type != "STEP":
            continue
        
        binding = bg_bindings.get(beat.id)
        if not binding:
            continue
        
        beat_frames = max(1, round(beat.duration_s * fps))
        variant = binding.get("variant", {})
        
        usages.append(PlateUsage(
            beat_id=beat.id,
            plate_key=binding.get("plateKey", ""),
            beat_frames=beat_frames,
            plate_frames=variant.get("plateFrames", plate_frames),
            variant=PlateVariantPlan(
                fill_mode=variant.get("fillMode", "HOLD_LAST"),
                trim_offset_frames=variant.get("trimOffsetFrames", 0),
                playback_rate=variant.get("playbackRate"),
            ),
        ))
    
    if not usages:
        return bg_bindings
    
    # Detect anti-patterns
    reports = detect_plate_anti_patterns(usages)
    
    # Get available plates
    available_plates = list(set(u.plate_key for u in usages))
    
    # Fix anti-patterns
    fixed_usages = fix_anti_patterns(usages, reports, available_plates, plate_frames)
    
    # Update bindings
    fixed_bindings = dict(bg_bindings)
    for usage in fixed_usages:
        if usage.beat_id in fixed_bindings:
            fixed_bindings[usage.beat_id] = {
                "plateKey": usage.plate_key,
                "beatFrames": usage.beat_frames,
                "plateFrames": usage.plate_frames,
                "variant": usage.variant.model_dump(by_alias=True),
            }
    
    return fixed_bindings
