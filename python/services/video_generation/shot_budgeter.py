"""
Shot Budgeter

Reduces Sora API calls by creating reusable BG plates that can be shared
across multiple beats. Maintains visual variety through CHAR_ALPHA overlays
while staying within cost/time budgets.
"""

import hashlib
import json
from typing import Optional, Literal
from pydantic import BaseModel, Field

from .types import StoryIRV1, BeatType


class ShotBudget(BaseModel):
    """Budget constraints for Sora generation."""
    max_sora_jobs: int = Field(default=10, alias="maxSoraJobs")
    max_total_seconds: Optional[int] = Field(default=80, alias="maxTotalSeconds")
    prefer_keep_hook_full_scene: bool = Field(default=True, alias="preferKeepHookFullScene")
    prefer_keep_proof_full_scene: bool = Field(default=True, alias="preferKeepProofFullScene")
    step_bg_plate_count: int = Field(default=3, alias="stepBgPlateCount")
    step_bg_reuse_mode: Literal["round_robin", "by_intent"] = Field(default="round_robin", alias="stepBgReuseMode")
    allow_char_alpha_over_steps: bool = Field(default=True, alias="allowCharAlphaOverSteps")
    degrade_order: list[str] = Field(
        default=["DROP_CHAR_ALPHA", "DROP_STEP_BG_PLATES", "DOWNGRADE_HOOK_TO_BG_ONLY"],
        alias="degradeOrder"
    )
    
    class Config:
        populate_by_name = True


class BgPlate(BaseModel):
    """A reusable background plate."""
    id: str
    prompt_hint: str = Field(alias="promptHint")
    seconds: int
    intent_key: Optional[str] = Field(None, alias="intentKey")
    
    class Config:
        populate_by_name = True


class BgShotSpec(BaseModel):
    """Specification for a BG shot to generate."""
    key: str
    beat_id: Optional[str] = Field(None, alias="beatId")
    role: str = "bg"
    type: Literal["HOOK", "PROOF", "PROMISE", "STEP_PLATE"]
    seconds: int
    prompt_hint: str = Field(alias="promptHint")
    
    class Config:
        populate_by_name = True


class BudgetPlan(BaseModel):
    """Result of budget planning."""
    bg_shots_to_generate: list[BgShotSpec] = Field(alias="bgShotsToGenerate")
    char_alpha_beats: list[str] = Field(alias="charAlphaBeats")
    step_beat_to_plate_key: dict[str, str] = Field(alias="stepBeatToPlateKey")
    estimated_jobs: int = Field(alias="estimatedJobs")
    estimated_seconds: int = Field(alias="estimatedSeconds")
    
    class Config:
        populate_by_name = True


DEFAULT_BUDGET = ShotBudget()


def estimate_job_seconds(seconds: float) -> int:
    """Clamp duration to valid Sora range."""
    return max(1, min(20, round(seconds)))


def beat_priority(beat_type: str) -> int:
    """Get priority for a beat type (higher = protect from cuts)."""
    priorities = {
        "HOOK": 100,
        "PROOF": 80,
        "PROMISE": 60,
        "STEP": 50,
        "CTA": 40,
        "OUTRO": 30,
    }
    return priorities.get(beat_type, 10)


def build_step_bg_plate_pool(
    ir: StoryIRV1,
    plate_count: int,
    mode: str = "round_robin",
) -> list[BgPlate]:
    """
    Build a pool of reusable BG plates for STEP beats.
    
    Args:
        ir: Story IR
        plate_count: Number of plates to create
        mode: "round_robin" or "by_intent"
        
    Returns:
        List of BgPlate specs
    """
    steps = [b for b in ir.beats if b.type == BeatType.STEP]
    if not steps:
        return []
    
    if mode == "by_intent":
        # Cluster by first broll intent
        intents: dict[str, int] = {}
        for s in steps:
            broll = s.broll or []
            key = broll[0].intent if broll else "abstract"
            intents[key] = intents.get(key, 0) + 1
        
        ranked = sorted(intents.items(), key=lambda x: -x[1])
        chosen = ranked[:plate_count]
        
        if chosen:
            return [
                BgPlate(
                    id=f"plate_step_{i}",
                    intent_key=key,
                    prompt_hint=f"Generate a clean {key} style background plate, no text, with empty space for captions.",
                    seconds=4,
                )
                for i, (key, _) in enumerate(chosen)
            ]
    
    # Fallback pool
    hints = [
        "clean abstract tech background plate, no text",
        "minimal diagram grid background plate, no text",
        "simple UI mock background plate, no text",
        "soft gradient flat background plate, no text",
    ]
    
    return [
        BgPlate(
            id=f"plate_step_{i}",
            prompt_hint=hints[i % len(hints)],
            seconds=4,
        )
        for i in range(plate_count)
    ]


def apply_shot_budget(
    ir: StoryIRV1,
    budget: Optional[ShotBudget] = None,
) -> BudgetPlan:
    """
    Apply budget constraints to determine what to generate.
    
    Args:
        ir: Story IR
        budget: Budget constraints
        
    Returns:
        BudgetPlan with generation specs
    """
    B = budget or DEFAULT_BUDGET
    
    step_plates = build_step_bg_plate_pool(
        ir,
        B.step_bg_plate_count,
        B.step_bg_reuse_mode,
    )
    
    bg_shots: list[BgShotSpec] = []
    char_alpha_beats: list[str] = []
    step_beat_to_plate: dict[str, str] = {}
    
    # 1) Protected hero shots (HOOK/PROOF)
    for beat in ir.beats:
        beat_type = beat.type.value if hasattr(beat.type, 'value') else beat.type
        
        if beat_type == "HOOK" and B.prefer_keep_hook_full_scene:
            bg_shots.append(BgShotSpec(
                key=f"bg_hook_{beat.id}",
                beat_id=beat.id,
                role="bg",
                type="HOOK",
                seconds=estimate_job_seconds(beat.duration_s),
                prompt_hint="FULL_SCENE hook hero shot (character + scene), readable composition.",
            ))
        
        if beat_type == "PROOF" and B.prefer_keep_proof_full_scene:
            bg_shots.append(BgShotSpec(
                key=f"bg_proof_{beat.id}",
                beat_id=beat.id,
                role="bg",
                type="PROOF",
                seconds=estimate_job_seconds(beat.duration_s),
                prompt_hint="FULL_SCENE proof/b-roll hero shot, visually explanatory.",
            ))
    
    # 2) Reusable STEP BG plates
    for plate in step_plates:
        bg_shots.append(BgShotSpec(
            key=f"bg_plate_{plate.id}",
            role="bg",
            type="STEP_PLATE",
            seconds=estimate_job_seconds(plate.seconds),
            prompt_hint=f"BG_ONLY: {plate.prompt_hint}",
        ))
    
    # 3) Assign STEP beats to plates
    step_beats = [b for b in ir.beats if b.type == BeatType.STEP]
    for i, beat in enumerate(step_beats):
        if step_plates:
            plate = step_plates[i % len(step_plates)]
            step_beat_to_plate[beat.id] = f"bg_plate_{plate.id}"
    
    # 4) Char alpha overlays
    if B.allow_char_alpha_over_steps:
        for beat in ir.beats:
            beat_type = beat.type.value if hasattr(beat.type, 'value') else beat.type
            if beat_type in ["STEP", "PROMISE"]:
                char_alpha_beats.append(beat.id)
    
    # 5) Enforce budgets by degrading
    _enforce_budgets(ir, B, bg_shots, char_alpha_beats)
    
    # Calculate estimates
    estimated_jobs = len(bg_shots) + len(char_alpha_beats)
    estimated_seconds = sum(s.seconds for s in bg_shots) + len(char_alpha_beats) * 4
    
    return BudgetPlan(
        bg_shots_to_generate=bg_shots,
        char_alpha_beats=char_alpha_beats,
        step_beat_to_plate_key=step_beat_to_plate,
        estimated_jobs=estimated_jobs,
        estimated_seconds=estimated_seconds,
    )


def _enforce_budgets(
    ir: StoryIRV1,
    budget: ShotBudget,
    bg_shots: list[BgShotSpec],
    char_alpha_beats: list[str],
) -> None:
    """
    Enforce budget by degrading until within limits.
    
    Modifies bg_shots and char_alpha_beats in place.
    """
    degrade_order = list(budget.degrade_order)
    
    def count_jobs():
        return len(bg_shots) + len(char_alpha_beats)
    
    def total_seconds():
        return sum(s.seconds for s in bg_shots) + len(char_alpha_beats) * 4
    
    max_iterations = 100
    iteration = 0
    
    while iteration < max_iterations:
        iteration += 1
        
        # Check if within budget
        jobs_ok = count_jobs() <= budget.max_sora_jobs
        seconds_ok = (
            budget.max_total_seconds is None or 
            total_seconds() <= budget.max_total_seconds
        )
        
        if jobs_ok and seconds_ok:
            break
        
        if not degrade_order:
            break
        
        action = degrade_order[0]
        
        if action == "DROP_CHAR_ALPHA" and char_alpha_beats:
            # Drop lowest priority char alpha
            beats_with_priority = [
                (bid, beat_priority(
                    next((b.type.value for b in ir.beats if b.id == bid), "STEP")
                ))
                for bid in char_alpha_beats
            ]
            beats_with_priority.sort(key=lambda x: x[1])
            
            if beats_with_priority:
                char_alpha_beats.remove(beats_with_priority[0][0])
                continue
        
        if action == "DROP_STEP_BG_PLATES":
            step_plates = [s for s in bg_shots if s.type == "STEP_PLATE"]
            if len(step_plates) > 1:
                bg_shots.remove(step_plates[-1])
                continue
        
        if action == "DOWNGRADE_HOOK_TO_BG_ONLY":
            hook_shots = [s for s in bg_shots if s.type == "HOOK"]
            if hook_shots:
                hook_shots[0].seconds = max(2, hook_shots[0].seconds // 2)
                continue
        
        # Rotate degrade order
        degrade_order.append(degrade_order.pop(0))


def make_budgeted_shot_plan(
    ir: StoryIRV1,
    budget_plan: BudgetPlan,
    model: str = "sora-2",
    size: Optional[str] = None,
    reference_file_ids: Optional[list[str]] = None,
) -> dict:
    """
    Create a shot plan from a budget plan.
    
    Args:
        ir: Story IR
        budget_plan: Budget plan with specs
        model: Sora model
        size: Video size
        reference_file_ids: Reference files
        
    Returns:
        Shot plan dict with reuse map
    """
    size = size or ("720x1280" if ir.meta.aspect == "9:16" else "1280x720")
    refs = reference_file_ids or []
    
    global_tokens = ["clean flat 2D explainer", "high contrast", "safe margins"]
    negative_tokens = ["tiny text", "watermarks", "busy background"]
    
    reuse_map: dict[str, str] = {}
    shots: list[dict] = []
    
    # 1) BG shots
    for bg in budget_plan.bg_shots_to_generate:
        shot_type = "BG_ONLY" if bg.type == "STEP_PLATE" else "FULL_SCENE"
        
        prompt_parts = [
            ", ".join(global_tokens),
            bg.prompt_hint,
            f"Avoid: {', '.join(negative_tokens)}.",
        ]
        prompt = ". ".join(prompt_parts)
        
        cache_key = hashlib.sha256(
            json.dumps({"model": model, "size": size, "prompt": prompt, "refs": refs}, sort_keys=True).encode()
        ).hexdigest()
        
        shot_id = f"shot_{bg.key}"
        reuse_map[bg.key] = shot_id
        
        shots.append({
            "id": shot_id,
            "fromBeatId": bg.beat_id or "__REUSABLE__",
            "seconds": bg.seconds,
            "prompt": prompt,
            "model": model,
            "size": size,
            "tags": ["bg", bg.type],
            "cacheKey": cache_key,
            "shotType": shot_type,
            "role": "bg",
        })
    
    # 2) CHAR_ALPHA shots
    for beat_id in budget_plan.char_alpha_beats:
        beat = next((b for b in ir.beats if b.id == beat_id), None)
        if not beat:
            continue
        
        prompt_parts = [
            ", ".join(global_tokens),
            f"Context: {beat.narration}",
            "Generate ONLY character animation on SOLID GREEN background, no shadows, no text, clean edges for chroma key.",
            f"Avoid: {', '.join(negative_tokens)}.",
        ]
        prompt = " ".join(prompt_parts)
        
        cache_key = hashlib.sha256(
            json.dumps({"model": model, "size": size, "prompt": prompt, "refs": refs}, sort_keys=True).encode()
        ).hexdigest()
        
        shots.append({
            "id": f"shot_{beat.id}_char",
            "fromBeatId": beat.id,
            "seconds": max(2, min(8, round(beat.duration_s))),
            "prompt": prompt,
            "model": model,
            "size": size,
            "tags": ["char", "CHAR_ALPHA"],
            "cacheKey": cache_key,
            "shotType": "CHAR_ALPHA",
            "role": "char",
            "postprocess": {
                "chromaKey": {"color": "green", "similarity": 0.18, "blend": 0.02},
                "muteOriginalAudio": True,
            },
        })
    
    return {
        "meta": {
            "fps": ir.meta.fps,
            "aspect": ir.meta.aspect,
            "size": size,
        },
        "style_bible": {
            "global_tokens": global_tokens,
            "negative_tokens": negative_tokens,
        },
        "references": {"file_ids": refs} if refs else None,
        "shots": shots,
        "reuseMap": reuse_map,
        "stepBeatToPlateKey": budget_plan.step_beat_to_plate_key,
    }


def estimate_budget_savings(
    ir: StoryIRV1,
    budget_plan: BudgetPlan,
    cost_per_second: float = 0.05,
) -> dict:
    """
    Estimate savings from budgeted plan vs full generation.
    
    Args:
        ir: Story IR
        budget_plan: Budget plan
        cost_per_second: Cost per second of Sora video
        
    Returns:
        Dict with savings breakdown
    """
    # Full generation: one shot per beat
    full_shots = len(ir.beats)
    full_seconds = sum(b.duration_s for b in ir.beats)
    full_cost = full_seconds * cost_per_second
    
    # Budgeted
    budgeted_jobs = budget_plan.estimated_jobs
    budgeted_seconds = budget_plan.estimated_seconds
    budgeted_cost = budgeted_seconds * cost_per_second
    
    return {
        "full_shots": full_shots,
        "full_seconds": round(full_seconds, 1),
        "full_cost_usd": round(full_cost, 2),
        "budgeted_shots": budgeted_jobs,
        "budgeted_seconds": budgeted_seconds,
        "budgeted_cost_usd": round(budgeted_cost, 2),
        "shots_saved": full_shots - budgeted_jobs,
        "seconds_saved": round(full_seconds - budgeted_seconds, 1),
        "cost_saved_usd": round(full_cost - budgeted_cost, 2),
        "savings_percent": round((1 - budgeted_cost / max(full_cost, 0.01)) * 100, 1),
    }
