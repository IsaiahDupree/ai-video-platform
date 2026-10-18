"""
Full Video Generation Pipeline

End-to-end orchestration: trend → brief → IR → shots → Sora → render plan → audio mix → final video
"""

import os
import json
import asyncio
from pathlib import Path
from typing import Optional
from datetime import datetime
from loguru import logger

from .types import TrendItemV1, ContentBriefV1, StoryIRV1, FormatPackV1
from .story_ir import make_story_ir
from .format_selector import select_format, get_format_by_id
from .auto_shot_planner import make_auto_shot_plan, estimate_auto_plan_cost
from .sora_runner import run_sora_shot_plan, estimate_generation_cost
from .render_plan_v2 import make_render_plan_v2
from .voice_engine import plan_speech_budget, build_voice_policy, VoiceStrategy
from .validator import validate_pre_sora, validate_pipeline
from .postprocess import postprocess_sora_clip


class PipelineConfig:
    """Configuration for the full pipeline."""
    
    def __init__(
        self,
        work_dir: str = "pipeline_work",
        sora_cache_dir: str = "sora_cache",
        sfx_manifest_path: Optional[str] = None,
        sfx_root_dir: Optional[str] = None,
        openai_api_key: Optional[str] = None,
        sora_model: str = "sora-2",
        sora_concurrency: int = 3,
        dry_run: bool = False,
        skip_sora: bool = False,
        skip_tts: bool = False,
        skip_render: bool = False,
    ):
        self.work_dir = work_dir
        self.sora_cache_dir = sora_cache_dir
        self.sfx_manifest_path = sfx_manifest_path
        self.sfx_root_dir = sfx_root_dir
        self.openai_api_key = openai_api_key or os.environ.get("OPENAI_API_KEY")
        self.sora_model = sora_model
        self.sora_concurrency = sora_concurrency
        self.dry_run = dry_run
        self.skip_sora = skip_sora
        self.skip_tts = skip_tts
        self.skip_render = skip_render


class PipelineResult:
    """Result from full pipeline execution."""
    
    def __init__(self):
        self.status: str = "pending"
        self.error: Optional[str] = None
        self.story_ir: Optional[dict] = None
        self.format_pack: Optional[dict] = None
        self.shot_plan: Optional[dict] = None
        self.assets: Optional[dict] = None
        self.render_plan: Optional[dict] = None
        self.audio_bus_path: Optional[str] = None
        self.output_video_path: Optional[str] = None
        self.cost_estimate: Optional[dict] = None
        self.timings: dict = {}
        self.artifacts_dir: Optional[str] = None
    
    def to_dict(self) -> dict:
        return {
            "status": self.status,
            "error": self.error,
            "storyIR": self.story_ir,
            "formatPack": self.format_pack,
            "shotPlan": self.shot_plan,
            "assets": self.assets,
            "renderPlan": self.render_plan,
            "audioBusPath": self.audio_bus_path,
            "outputVideoPath": self.output_video_path,
            "costEstimate": self.cost_estimate,
            "timings": self.timings,
            "artifactsDir": self.artifacts_dir,
        }
    
    def save_to_dir(self, out_dir: str) -> None:
        """Save all artifacts to directory."""
        path = Path(out_dir)
        path.mkdir(parents=True, exist_ok=True)
        
        if self.story_ir:
            (path / "story_ir.json").write_text(json.dumps(self.story_ir, indent=2))
        if self.shot_plan:
            (path / "shot_plan.json").write_text(json.dumps(self.shot_plan, indent=2))
        if self.assets:
            (path / "assets.json").write_text(json.dumps(self.assets, indent=2))
        if self.render_plan:
            (path / "render_plan.json").write_text(json.dumps(self.render_plan, indent=2))
        
        (path / "result.json").write_text(json.dumps(self.to_dict(), indent=2))
        
        self.artifacts_dir = str(path)


async def run_full_pipeline(
    trend: TrendItemV1,
    brief: ContentBriefV1,
    config: PipelineConfig,
    format_pack_id: Optional[str] = None,
    voice_strategy: Optional[VoiceStrategy] = None,
    reference_file_ids: Optional[list[str]] = None,
) -> PipelineResult:
    """
    Run the complete video generation pipeline.
    
    Steps:
    1. Select format pack
    2. Generate Story IR
    3. Validate pre-Sora
    4. Plan speech budget
    5. Generate auto shot plan
    6. Run Sora (or mock)
    7. Postprocess clips (chroma key, etc.)
    8. Generate render plan
    9. Mix audio bus
    10. Render video
    
    Args:
        trend: Trend data
        brief: Content brief
        config: Pipeline configuration
        format_pack_id: Specific format to use
        voice_strategy: Voice strategy
        reference_file_ids: Sora reference files
        
    Returns:
        PipelineResult
    """
    result = PipelineResult()
    timings = {}
    
    work_dir = Path(config.work_dir)
    work_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        # Step 1: Select format
        t0 = datetime.now()
        
        if format_pack_id:
            format_pack = get_format_by_id(format_pack_id)
            if not format_pack:
                raise ValueError(f"Unknown format: {format_pack_id}")
        else:
            selection = select_format(trend, brief)
            format_pack = selection["format"]
        
        result.format_pack = format_pack.model_dump(by_alias=True)
        timings["format_selection"] = (datetime.now() - t0).total_seconds()
        logger.info(f"Selected format: {format_pack.id}")
        
        # Step 2: Generate Story IR
        t0 = datetime.now()
        story_ir = make_story_ir(trend, brief)
        result.story_ir = story_ir.model_dump(by_alias=True)
        timings["story_ir"] = (datetime.now() - t0).total_seconds()
        logger.info(f"Generated Story IR with {len(story_ir.beats)} beats")
        
        # Step 3: Validate pre-Sora
        t0 = datetime.now()
        validation = validate_pre_sora(story_ir, format_pack)
        if not validation.valid:
            error_msgs = [e.message for e in validation.errors]
            raise ValueError(f"Pre-Sora validation failed: {error_msgs}")
        timings["validation"] = (datetime.now() - t0).total_seconds()
        
        # Step 4: Plan speech budget
        t0 = datetime.now()
        beats_for_budget = [b.model_dump(by_alias=True) for b in story_ir.beats]
        speech_budget = plan_speech_budget(
            beats=beats_for_budget,
            voice_mode=voice_strategy.mode if voice_strategy else "EXTERNAL_NARRATOR",
        )
        
        if speech_budget.warnings:
            logger.warning(f"Speech budget warnings: {speech_budget.warnings}")
        timings["speech_budget"] = (datetime.now() - t0).total_seconds()
        
        # Step 5: Generate auto shot plan
        t0 = datetime.now()
        shot_plan = make_auto_shot_plan(
            ir=story_ir,
            format_pack=format_pack,
            model=config.sora_model,
            reference_file_ids=reference_file_ids,
        )
        result.shot_plan = shot_plan
        result.cost_estimate = estimate_auto_plan_cost(shot_plan)
        timings["shot_plan"] = (datetime.now() - t0).total_seconds()
        logger.info(f"Generated shot plan: {len(shot_plan['shots'])} shots, "
                    f"est. ${result.cost_estimate['estimated_cost_usd']:.2f}")
        
        # Step 6: Run Sora
        if config.skip_sora or config.dry_run:
            logger.info("Skipping Sora generation (dry run)")
            # Create mock assets
            assets = {
                "clips": [
                    {
                        "shotId": shot["id"],
                        "beatId": shot["fromBeatId"],
                        "role": shot.get("role", "bg"),
                        "shotType": shot["shotType"],
                        "src": f"mock://{shot['cacheKey']}.mp4",
                        "seconds": shot["seconds"],
                        "hasAudio": True,
                    }
                    for shot in shot_plan["shots"]
                ]
            }
        else:
            t0 = datetime.now()
            from .types import ShotPlanV1, Shot
            
            # Convert to ShotPlanV1 for runner
            shots = [
                Shot(
                    id=s["id"],
                    from_beat_id=s["fromBeatId"],
                    seconds=s["seconds"],
                    prompt=s["prompt"],
                    model=s["model"],
                    size=s["size"],
                    tags=s["tags"],
                    cache_key=s["cacheKey"],
                )
                for s in shot_plan["shots"]
            ]
            
            shot_plan_v1 = ShotPlanV1(
                meta={"fps": shot_plan["meta"]["fps"], "aspect": shot_plan["meta"]["aspect"]},
                style_bible=shot_plan["style_bible"],
                shots=shots,
            )
            
            asset_manifest = await run_sora_shot_plan(
                shot_plan=shot_plan_v1,
                api_key=config.openai_api_key,
                out_dir=config.sora_cache_dir,
                concurrency=config.sora_concurrency,
            )
            
            assets = {"clips": [c.model_dump(by_alias=True) for c in asset_manifest.clips]}
            timings["sora_generation"] = (datetime.now() - t0).total_seconds()
        
        # Step 7: Postprocess clips
        t0 = datetime.now()
        processed_clips = []
        
        for i, clip in enumerate(assets["clips"]):
            shot = shot_plan["shots"][i] if i < len(shot_plan["shots"]) else {}
            
            if shot.get("shotType") == "CHAR_ALPHA" and clip.get("src") and not clip["src"].startswith("mock://"):
                processed = await postprocess_sora_clip(
                    input_path=clip["src"],
                    output_dir=str(work_dir / "processed"),
                    shot_id=clip["shotId"],
                    shot_type=shot["shotType"],
                    postprocess_hints=shot.get("postprocess"),
                )
                clip["alphaSrc"] = processed.get("alpha_src")
                clip["matteColor"] = processed.get("matte_color")
            
            processed_clips.append(clip)
        
        assets["clips"] = processed_clips
        result.assets = assets
        timings["postprocess"] = (datetime.now() - t0).total_seconds()
        
        # Step 8: Generate render plan
        t0 = datetime.now()
        render_plan = make_render_plan_v2(
            ir=story_ir,
            format_pack=format_pack,
            assets=assets,
        )
        result.render_plan = render_plan.model_dump(by_alias=True)
        timings["render_plan"] = (datetime.now() - t0).total_seconds()
        logger.info(f"Generated render plan with {len(render_plan.layers)} layers")
        
        # Step 9: Mix audio (if SFX manifest provided)
        if config.sfx_manifest_path and not config.skip_tts:
            t0 = datetime.now()
            # TODO: Implement audio bus mixing
            # This would integrate with cue_sheet and audio_mixer
            timings["audio_mix"] = (datetime.now() - t0).total_seconds()
        
        # Step 10: Render video (if not skipped)
        if not config.skip_render and not config.dry_run:
            t0 = datetime.now()
            # TODO: Implement render trigger
            # This would use motion_canvas_runner or remotion
            timings["render"] = (datetime.now() - t0).total_seconds()
        
        # Save artifacts
        result.save_to_dir(str(work_dir / "artifacts"))
        result.timings = timings
        result.status = "success"
        
        logger.info(f"Pipeline complete. Artifacts saved to: {result.artifacts_dir}")
        
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        result.status = "error"
        result.error = str(e)
        result.timings = timings
    
    return result


def run_full_pipeline_sync(
    trend: TrendItemV1,
    brief: ContentBriefV1,
    config: PipelineConfig,
    **kwargs,
) -> PipelineResult:
    """Synchronous version of run_full_pipeline."""
    return asyncio.run(run_full_pipeline(trend, brief, config, **kwargs))


async def preview_pipeline(
    trend: TrendItemV1,
    brief: ContentBriefV1,
    format_pack_id: Optional[str] = None,
) -> dict:
    """
    Preview pipeline without execution.
    
    Returns estimates and plan without running Sora.
    
    Args:
        trend: Trend data
        brief: Content brief
        format_pack_id: Optional specific format
        
    Returns:
        Preview dict
    """
    # Select format
    if format_pack_id:
        format_pack = get_format_by_id(format_pack_id)
        if not format_pack:
            raise ValueError(f"Unknown format: {format_pack_id}")
    else:
        selection = select_format(trend, brief)
        format_pack = selection["format"]
    
    # Generate IR
    story_ir = make_story_ir(trend, brief)
    
    # Generate shot plan
    shot_plan = make_auto_shot_plan(story_ir, format_pack)
    
    # Estimate costs
    cost = estimate_auto_plan_cost(shot_plan)
    
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
            "totalShots": len(shot_plan["shots"]),
            "bgShots": cost["bg_shots"],
            "charShots": cost["char_shots"],
            "totalSeconds": cost["total_seconds"],
        },
        "estimates": {
            "soraCostUsd": cost["estimated_cost_usd"],
            "renderDurationS": story_ir.total_duration_s(),
        },
    }
