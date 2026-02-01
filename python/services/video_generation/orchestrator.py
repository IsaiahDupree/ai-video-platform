"""
Video Generation Orchestrator

End-to-end pipeline: trend + brief → Story IR → Shot Plan → Sora → Render Plan
"""

import json
import os
from pathlib import Path
from typing import Optional
from loguru import logger

from .types import (
    TrendItemV1,
    ContentBriefV1,
    StoryIRV1,
    FormatPackV1,
    ShotPlanV1,
    AssetManifestV1,
    RenderPlanRemotionV1,
)
from .story_ir import make_story_ir, validate_story_ir
from .shot_plan import make_shot_plan, estimate_sora_cost
from .render_plan import make_render_plan, validate_render_plan
from .format_selector import select_format, get_format_by_id
from .sora_runner import run_sora_shot_plan, estimate_generation_cost


class OrchestrationResult:
    """Result from video generation orchestration."""
    
    def __init__(
        self,
        story_ir: StoryIRV1,
        shot_plan: ShotPlanV1,
        assets: AssetManifestV1,
        render_plan: RenderPlanRemotionV1,
        format_pack: FormatPackV1,
        format_selection: dict,
    ):
        self.story_ir = story_ir
        self.shot_plan = shot_plan
        self.assets = assets
        self.render_plan = render_plan
        self.format_pack = format_pack
        self.format_selection = format_selection
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "storyIR": self.story_ir.model_dump(by_alias=True),
            "shotPlan": self.shot_plan.model_dump(by_alias=True),
            "assets": self.assets.model_dump(by_alias=True),
            "renderPlan": self.render_plan.model_dump(by_alias=True),
            "formatPack": self.format_pack.model_dump(by_alias=True),
            "formatSelection": self.format_selection,
        }
    
    def save_to_dir(self, out_dir: str) -> None:
        """Save all artifacts to a directory."""
        path = Path(out_dir)
        path.mkdir(parents=True, exist_ok=True)
        
        (path / "story_ir.json").write_text(
            json.dumps(self.story_ir.model_dump(by_alias=True), indent=2)
        )
        (path / "shot_plan.json").write_text(
            json.dumps(self.shot_plan.model_dump(by_alias=True), indent=2)
        )
        (path / "asset_manifest.json").write_text(
            json.dumps(self.assets.model_dump(by_alias=True), indent=2)
        )
        (path / "render_plan.json").write_text(
            json.dumps(self.render_plan.model_dump(by_alias=True), indent=2)
        )
        (path / "format_selection.json").write_text(
            json.dumps(self.format_selection, indent=2)
        )


async def orchestrate_video_generation(
    trend: TrendItemV1,
    brief: ContentBriefV1,
    format_pack_id: Optional[str] = None,
    api_key: Optional[str] = None,
    sora_cache_dir: str = "sora_cache",
    prefer_sora: bool = True,
    have_screen_record: bool = False,
    reference_file_ids: Optional[list[str]] = None,
    sora_model: str = "sora-2",
    concurrency: int = 3,
    dry_run: bool = False,
) -> OrchestrationResult:
    """
    Run the complete video generation pipeline.
    
    Args:
        trend: Trend data
        brief: Content brief
        format_pack_id: Specific format pack ID (auto-select if None)
        api_key: OpenAI API key
        sora_cache_dir: Directory for Sora clip cache
        prefer_sora: Prefer Sora-heavy formats
        have_screen_record: Whether screen recordings available
        reference_file_ids: Reference file IDs for Sora
        sora_model: Sora model to use
        concurrency: Max concurrent Sora jobs
        dry_run: If True, skip actual Sora generation
        
    Returns:
        OrchestrationResult with all artifacts
    """
    logger.info("Starting video generation orchestration")
    
    # Step 1: Select format pack
    if format_pack_id:
        format_pack = get_format_by_id(format_pack_id)
        if not format_pack:
            raise ValueError(f"Format pack not found: {format_pack_id}")
        format_selection = {
            "selectedFormatId": format_pack_id,
            "format": format_pack,
            "ranked": [],
        }
    else:
        format_selection = select_format(
            trend=trend,
            brief=brief,
            prefer_sora=prefer_sora,
            have_screen_record=have_screen_record,
        )
        format_pack = format_selection["format"]
    
    logger.info(f"Selected format: {format_pack.id}")
    
    # Step 2: Generate Story IR
    story_ir = make_story_ir(trend, brief)
    
    # Validate IR
    ir_errors = validate_story_ir(story_ir)
    if ir_errors:
        logger.warning(f"Story IR validation issues: {ir_errors}")
    
    logger.info(f"Generated Story IR with {len(story_ir.beats)} beats")
    
    # Step 3: Generate Shot Plan
    shot_plan = make_shot_plan(
        ir=story_ir,
        format_pack=format_pack,
        model=sora_model,
        reference_file_ids=reference_file_ids,
    )
    
    logger.info(f"Generated shot plan with {len(shot_plan.shots)} shots")
    
    # Log cost estimate
    cost_estimate = estimate_generation_cost(shot_plan, sora_cache_dir)
    logger.info(f"Cost estimate: ${cost_estimate['estimated_cost_usd']:.2f} "
                f"({cost_estimate['uncached_shots']} uncached shots)")
    
    # Step 4: Run Sora (or mock in dry run)
    if dry_run:
        logger.info("Dry run - skipping Sora generation")
        # Create mock assets
        assets = AssetManifestV1(
            clips=[
                {
                    "shotId": shot.id,
                    "beatId": shot.from_beat_id,
                    "src": f"mock://{shot.cache_key}.mp4",
                    "seconds": shot.seconds,
                    "hasAudio": True,
                }
                for shot in shot_plan.shots
            ]
        )
    else:
        assets = await run_sora_shot_plan(
            shot_plan=shot_plan,
            api_key=api_key,
            out_dir=sora_cache_dir,
            concurrency=concurrency,
        )
    
    logger.info(f"Generated {len(assets.clips)} clips")
    
    # Step 5: Generate Render Plan
    render_plan = make_render_plan(
        ir=story_ir,
        format_pack=format_pack,
        assets=assets,
    )
    
    # Validate render plan
    render_errors = validate_render_plan(render_plan, assets)
    if render_errors:
        logger.warning(f"Render plan validation issues: {render_errors}")
    
    logger.info(f"Generated render plan with {len(render_plan.timeline)} items")
    
    return OrchestrationResult(
        story_ir=story_ir,
        shot_plan=shot_plan,
        assets=assets,
        render_plan=render_plan,
        format_pack=format_pack,
        format_selection=format_selection,
    )


def orchestrate_video_generation_sync(
    trend: TrendItemV1,
    brief: ContentBriefV1,
    **kwargs,
) -> OrchestrationResult:
    """Synchronous version of orchestrate_video_generation."""
    import asyncio
    return asyncio.run(orchestrate_video_generation(trend, brief, **kwargs))


async def orchestrate_from_dicts(
    trend_dict: dict,
    brief_dict: dict,
    **kwargs,
) -> OrchestrationResult:
    """
    Run orchestration from raw dictionaries.
    
    Args:
        trend_dict: Trend data as dict
        brief_dict: Brief data as dict
        **kwargs: Additional arguments for orchestrate_video_generation
        
    Returns:
        OrchestrationResult
    """
    trend = TrendItemV1.model_validate(trend_dict)
    brief = ContentBriefV1.model_validate(brief_dict)
    
    return await orchestrate_video_generation(trend, brief, **kwargs)


def preview_orchestration(
    trend: TrendItemV1,
    brief: ContentBriefV1,
    format_pack_id: Optional[str] = None,
    prefer_sora: bool = True,
) -> dict:
    """
    Preview orchestration without running Sora.
    
    Returns what would be generated.
    
    Args:
        trend: Trend data
        brief: Content brief
        format_pack_id: Optional specific format
        prefer_sora: Prefer Sora-heavy formats
        
    Returns:
        Preview dict with IR, shot plan, and estimates
    """
    # Select format
    if format_pack_id:
        format_pack = get_format_by_id(format_pack_id)
        if not format_pack:
            raise ValueError(f"Format pack not found: {format_pack_id}")
    else:
        selection = select_format(trend, brief, prefer_sora=prefer_sora)
        format_pack = selection["format"]
    
    # Generate IR
    story_ir = make_story_ir(trend, brief)
    
    # Generate shot plan
    shot_plan = make_shot_plan(story_ir, format_pack)
    
    # Estimate cost
    cost = estimate_sora_cost(shot_plan)
    
    return {
        "format": {
            "id": format_pack.id,
            "label": format_pack.label,
        },
        "storyIR": {
            "totalBeats": len(story_ir.beats),
            "totalDurationS": story_ir.total_duration_s(),
            "beatTypes": [b.type.value for b in story_ir.beats],
        },
        "shotPlan": {
            "totalShots": len(shot_plan.shots),
            "totalSeconds": sum(s.seconds for s in shot_plan.shots),
            "shots": [
                {
                    "id": s.id,
                    "beatId": s.from_beat_id,
                    "seconds": s.seconds,
                }
                for s in shot_plan.shots
            ],
        },
        "estimates": {
            "soraCostUsd": cost,
            "renderDurationS": story_ir.total_duration_s(),
        },
    }
