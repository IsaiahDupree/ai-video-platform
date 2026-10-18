"""
Pipeline Orchestrator

End-to-end video generation pipeline:
1. Trend + Brief → Story IR
2. Format selection → Auto shot planning with budgeting
3. Sora generation → Reusable BG plates + CHAR_ALPHA overlays
4. Plate management → Looping, stretching, variety injection
5. SFX automation → Macro-based cues from visual reveals
6. Audio mixing → FFmpeg audio bus
7. Render automation → Playwright/Remotion triggering
"""

import asyncio
import os
from typing import Optional, Literal
from pathlib import Path
from pydantic import BaseModel, Field
from loguru import logger

from .types import StoryIRV1, FormatPackV1
from .voice_strategy import (
    VoiceStrategy,
    choose_voice_strategy,
    DiscernmentInputs,
    get_beat_voice_flags,
    apply_voice_strategy_to_shot_plan,
)
from .speech_timing import reconcile_story_ir_durations, get_speech_stats
from .runtime_budget import auto_fit_to_budget, RuntimeBudget, check_runtime_budget
from .shot_budgeter import apply_shot_budget, make_budgeted_shot_plan, ShotBudget
from .plate_manager import (
    build_beat_bg_bindings,
    inject_variety,
    detect_plate_anti_patterns,
    fix_anti_patterns,
)
from .remotion_sfx import (
    story_ir_to_remotion_sfx_cues,
    expand_remotion_sfx_cues,
    add_sfx_layers_to_render_plan,
)
from .remotion_time_events import (
    story_ir_to_time_events,
    reveals_to_sfx_cues,
)
from .audio_ducking import (
    story_ir_to_narration_cues,
    calculate_ducking_for_render_plan,
)
from .vo_stitcher import (
    beats_to_narration_inputs,
    stitch_narration,
    StitchedNarration,
)


class PipelineConfig(BaseModel):
    """Configuration for the full pipeline."""
    # Output settings
    output_dir: str = Field(alias="outputDir")
    project_name: str = Field(default="video_project", alias="projectName")
    
    # Format settings
    format_family: str = Field(default="explainer", alias="formatFamily")
    aspect: str = "9:16"
    fps: int = 30
    
    # Voice settings
    voice_mode: Optional[str] = Field(None, alias="voiceMode")  # auto if None
    tts_provider: str = Field(default="huggingface", alias="ttsProvider")
    tts_model_id: str = Field(default="facebook/mms-tts-eng", alias="ttsModelId")
    
    # Budget settings
    max_sora_jobs: int = Field(default=10, alias="maxSoraJobs")
    max_total_seconds: int = Field(default=60, alias="maxTotalSeconds")
    
    # Sora settings
    sora_model: str = Field(default="sora-2", alias="soraModel")
    reference_file_ids: list[str] = Field(default_factory=list, alias="referenceFileIds")
    
    # Render settings
    renderer: Literal["remotion", "motion_canvas"] = "remotion"
    headless: bool = True
    
    class Config:
        populate_by_name = True


class PipelineStep(BaseModel):
    """A single step in the pipeline."""
    name: str
    status: Literal["pending", "running", "completed", "failed"] = "pending"
    duration_ms: Optional[int] = Field(None, alias="durationMs")
    error: Optional[str] = None
    output: Optional[dict] = None
    
    class Config:
        populate_by_name = True


class PipelineResult(BaseModel):
    """Result of the full pipeline."""
    success: bool
    steps: list[PipelineStep]
    story_ir: Optional[dict] = Field(None, alias="storyIr")
    shot_plan: Optional[dict] = Field(None, alias="shotPlan")
    budget_plan: Optional[dict] = Field(None, alias="budgetPlan")
    render_plan: Optional[dict] = Field(None, alias="renderPlan")
    output_video: Optional[str] = Field(None, alias="outputVideo")
    total_duration_ms: int = Field(default=0, alias="totalDurationMs")
    
    class Config:
        populate_by_name = True


class PipelineOrchestrator:
    """Orchestrates the full video generation pipeline."""
    
    def __init__(self, config: PipelineConfig):
        self.config = config
        self.steps: list[PipelineStep] = []
        self._current_step = 0
    
    def _add_step(self, name: str) -> PipelineStep:
        step = PipelineStep(name=name)
        self.steps.append(step)
        return step
    
    def _start_step(self, name: str) -> PipelineStep:
        step = self._add_step(name)
        step.status = "running"
        logger.info(f"🚀 Starting: {name}")
        return step
    
    def _complete_step(self, step: PipelineStep, output: Optional[dict] = None):
        step.status = "completed"
        step.output = output
        logger.info(f"✅ Completed: {step.name}")
    
    def _fail_step(self, step: PipelineStep, error: str):
        step.status = "failed"
        step.error = error
        logger.error(f"❌ Failed: {step.name} - {error}")
    
    async def run(
        self,
        trend: Optional[dict] = None,
        brief: Optional[dict] = None,
        script: Optional[str] = None,
        story_ir: Optional[dict] = None,
    ) -> PipelineResult:
        """
        Run the full pipeline.
        
        Args:
            trend: Optional trend data
            brief: Optional content brief
            script: Optional raw script text
            story_ir: Optional pre-built Story IR
            
        Returns:
            PipelineResult
        """
        import time
        start_time = time.time()
        
        try:
            # Step 1: Create Story IR
            if story_ir:
                ir = story_ir
            elif script:
                ir = await self._step_script_to_ir(script)
            elif trend and brief:
                ir = await self._step_trend_brief_to_ir(trend, brief)
            else:
                raise ValueError("Must provide story_ir, script, or trend+brief")
            
            # Step 2: Choose voice strategy
            voice_strategy = await self._step_choose_voice_strategy()
            
            # Step 3: Reconcile speech timing
            ir = await self._step_reconcile_timing(ir)
            
            # Step 4: Fit to runtime budget
            ir = await self._step_fit_budget(ir)
            
            # Step 5: Create budget plan (reusable plates)
            budget_plan = await self._step_create_budget_plan(ir)
            
            # Step 6: Create shot plan
            shot_plan = await self._step_create_shot_plan(ir, budget_plan)
            
            # Step 7: Apply voice strategy to shots
            shot_plan = await self._step_apply_voice_strategy(shot_plan, voice_strategy)
            
            # Step 8: Generate Sora shots (mock for now)
            assets = await self._step_generate_sora(shot_plan)
            
            # Step 9: Build plate bindings with anti-pattern detection
            bg_bindings = await self._step_build_plate_bindings(ir, budget_plan, assets)
            
            # Step 10: Generate time events and SFX cues
            time_events, sfx_cues = await self._step_generate_sfx(ir)
            
            # Step 11: Generate narration (if external narrator)
            narration = None
            if voice_strategy.mode in ("EXTERNAL_NARRATOR", "HYBRID"):
                narration = await self._step_generate_narration(ir, voice_strategy)
            
            # Step 12: Build render plan
            render_plan = await self._step_build_render_plan(
                ir, assets, bg_bindings, sfx_cues, narration
            )
            
            # Step 13: Trigger render
            output_video = await self._step_render(render_plan)
            
            total_ms = int((time.time() - start_time) * 1000)
            
            return PipelineResult(
                success=True,
                steps=self.steps,
                story_ir=ir if isinstance(ir, dict) else ir.model_dump(),
                shot_plan=shot_plan,
                budget_plan=budget_plan.model_dump(by_alias=True) if hasattr(budget_plan, 'model_dump') else budget_plan,
                render_plan=render_plan,
                output_video=output_video,
                total_duration_ms=total_ms,
            )
        
        except Exception as e:
            logger.exception(f"Pipeline failed: {e}")
            return PipelineResult(
                success=False,
                steps=self.steps,
                total_duration_ms=int((time.time() - start_time) * 1000),
            )
    
    async def _step_script_to_ir(self, script: str) -> dict:
        """Convert raw script to Story IR."""
        from .script_classifier import script_to_story_ir
        
        step = self._start_step("Script → Story IR")
        
        try:
            ir = script_to_story_ir(
                script,
                title=self.config.project_name,
                fps=self.config.fps,
            )
            
            # Add aspect ratio
            ir["meta"]["aspect"] = self.config.aspect
            
            self._complete_step(step, {"beatCount": len(ir.get("beats", []))})
            return ir
        except Exception as e:
            self._fail_step(step, str(e))
            raise
    
    async def _step_trend_brief_to_ir(self, trend: dict, brief: dict) -> dict:
        """Convert trend + brief to Story IR."""
        step = self._start_step("Trend + Brief → Story IR")
        
        try:
            # Use the story_ir module
            from .story_ir import make_story_ir
            
            ir = make_story_ir(trend, brief, self.config.fps, self.config.aspect)
            
            self._complete_step(step, {"beatCount": len(ir.get("beats", []))})
            return ir
        except Exception as e:
            self._fail_step(step, str(e))
            raise
    
    async def _step_choose_voice_strategy(self) -> VoiceStrategy:
        """Choose voice strategy."""
        step = self._start_step("Choose Voice Strategy")
        
        try:
            if self.config.voice_mode:
                from .voice_strategy import (
                    DEFAULT_NARRATOR_STRATEGY,
                    DEFAULT_SORA_DIALOGUE_STRATEGY,
                    DEFAULT_HYBRID_STRATEGY,
                )
                strategies = {
                    "EXTERNAL_NARRATOR": DEFAULT_NARRATOR_STRATEGY,
                    "SORA_DIALOGUE": DEFAULT_SORA_DIALOGUE_STRATEGY,
                    "HYBRID": DEFAULT_HYBRID_STRATEGY,
                }
                strategy = strategies.get(self.config.voice_mode, DEFAULT_NARRATOR_STRATEGY)
            else:
                strategy = choose_voice_strategy(DiscernmentInputs(
                    format_family=self.config.format_family,
                    brief_tone="educational",
                    needs_consistency=True,
                    tolerates_lip_sync_risk=False,
                ))
            
            self._complete_step(step, {"mode": strategy.mode})
            return strategy
        except Exception as e:
            self._fail_step(step, str(e))
            raise
    
    async def _step_reconcile_timing(self, ir: dict) -> dict:
        """Reconcile beat durations for speech timing."""
        step = self._start_step("Reconcile Speech Timing")
        
        try:
            updated_ir = reconcile_story_ir_durations(ir)
            stats = get_speech_stats(updated_ir.get("beats", []))
            
            self._complete_step(step, stats)
            return updated_ir
        except Exception as e:
            self._fail_step(step, str(e))
            raise
    
    async def _step_fit_budget(self, ir: dict) -> dict:
        """Fit IR to runtime budget."""
        step = self._start_step("Fit Runtime Budget")
        
        try:
            budget = RuntimeBudget(max_total_seconds=self.config.max_total_seconds)
            report = check_runtime_budget(ir, budget)
            
            if report["overBudget"]:
                ir = auto_fit_to_budget(ir, budget)
                self._complete_step(step, {
                    "compressed": True,
                    "overBy": report["overBy"],
                })
            else:
                self._complete_step(step, {"compressed": False})
            
            return ir
        except Exception as e:
            self._fail_step(step, str(e))
            raise
    
    async def _step_create_budget_plan(self, ir: dict) -> dict:
        """Create shot budget plan with reusable plates."""
        step = self._start_step("Create Budget Plan")
        
        try:
            # Convert dict to StoryIRV1 if needed
            if isinstance(ir, dict):
                ir_model = StoryIRV1.model_validate(ir)
            else:
                ir_model = ir
            
            budget = ShotBudget(
                max_sora_jobs=self.config.max_sora_jobs,
                max_total_seconds=self.config.max_total_seconds,
            )
            
            budget_plan = apply_shot_budget(ir_model, budget)
            
            # Inject variety at intent shifts
            plan_dict = budget_plan.model_dump(by_alias=True)
            plan_dict = inject_variety(ir_model, plan_dict)
            
            self._complete_step(step, {
                "bgShots": len(plan_dict.get("bgShotsToGenerate", [])),
                "charAlphaBeats": len(plan_dict.get("charAlphaBeats", [])),
            })
            
            return plan_dict
        except Exception as e:
            self._fail_step(step, str(e))
            raise
    
    async def _step_create_shot_plan(self, ir: dict, budget_plan: dict) -> dict:
        """Create shot plan from budget."""
        step = self._start_step("Create Shot Plan")
        
        try:
            if isinstance(ir, dict):
                ir_model = StoryIRV1.model_validate(ir)
            else:
                ir_model = ir
            
            from .shot_budgeter import BudgetPlan
            bp = BudgetPlan.model_validate(budget_plan)
            
            shot_plan = make_budgeted_shot_plan(
                ir=ir_model,
                budget_plan=bp,
                model=self.config.sora_model,
                reference_file_ids=self.config.reference_file_ids or None,
            )
            
            self._complete_step(step, {
                "shotCount": len(shot_plan.get("shots", [])),
            })
            
            return shot_plan
        except Exception as e:
            self._fail_step(step, str(e))
            raise
    
    async def _step_apply_voice_strategy(
        self,
        shot_plan: dict,
        voice_strategy: VoiceStrategy,
    ) -> dict:
        """Apply voice strategy to shot plan."""
        step = self._start_step("Apply Voice Strategy")
        
        try:
            updated = apply_voice_strategy_to_shot_plan(shot_plan, voice_strategy)
            
            muted_count = sum(
                1 for s in updated.get("shots", [])
                if s.get("muteOriginalAudio", False)
            )
            
            self._complete_step(step, {"mutedShots": muted_count})
            return updated
        except Exception as e:
            self._fail_step(step, str(e))
            raise
    
    async def _step_generate_sora(self, shot_plan: dict) -> dict:
        """Generate Sora shots (or mock for testing)."""
        step = self._start_step("Generate Sora Shots")
        
        try:
            # For now, create mock assets
            # In production, this calls the Sora runner
            clips = []
            
            for shot in shot_plan.get("shots", []):
                clip = {
                    "shotId": shot.get("id"),
                    "beatId": shot.get("fromBeatId"),
                    "role": shot.get("role", "bg"),
                    "shotType": shot.get("shotType", "FULL_SCENE"),
                    "src": f"mock://sora/{shot.get('id')}.mp4",
                    "hasAudio": not shot.get("muteOriginalAudio", False),
                }
                
                if shot.get("shotType") == "CHAR_ALPHA":
                    clip["alphaSrc"] = f"mock://sora/{shot.get('id')}_alpha.webm"
                    clip["overlayPreset"] = shot.get("overlayPreset", "char_bottom_right")
                
                clips.append(clip)
            
            assets = {
                "fps": self.config.fps,
                "clips": clips,
            }
            
            self._complete_step(step, {"clipCount": len(clips)})
            return assets
        except Exception as e:
            self._fail_step(step, str(e))
            raise
    
    async def _step_build_plate_bindings(
        self,
        ir: dict,
        budget_plan: dict,
        assets: dict,
    ) -> dict:
        """Build plate bindings with anti-pattern detection."""
        step = self._start_step("Build Plate Bindings")
        
        try:
            if isinstance(ir, dict):
                ir_model = StoryIRV1.model_validate(ir)
            else:
                ir_model = ir
            
            step_to_plate = budget_plan.get("stepBeatToPlateKey", {})
            
            bindings = build_beat_bg_bindings(
                ir=ir_model,
                step_beat_to_plate_key=step_to_plate,
                plate_seconds=4.0,
                prefer_stretch=True,
            )
            
            self._complete_step(step, {"bindingCount": len(bindings)})
            return bindings
        except Exception as e:
            self._fail_step(step, str(e))
            raise
    
    async def _step_generate_sfx(self, ir: dict) -> tuple[dict, list]:
        """Generate time events and SFX cues."""
        step = self._start_step("Generate SFX Cues")
        
        try:
            # Generate time events
            time_events = story_ir_to_time_events(ir, self.config.fps)
            
            # Generate SFX cues from IR
            sfx_cues = story_ir_to_remotion_sfx_cues(ir, self.config.fps)
            
            # Add cues from visual reveals
            reveal_cues = reveals_to_sfx_cues(time_events.reveals)
            
            # Merge cues (dedupe by frame)
            all_cues = list(sfx_cues)
            existing_frames = {c.frame for c in sfx_cues}
            for rc in reveal_cues:
                if rc.get("frame") not in existing_frames:
                    all_cues.append(rc)
            
            self._complete_step(step, {
                "eventCount": len(time_events.events),
                "revealCount": len(time_events.reveals),
                "sfxCueCount": len(all_cues),
            })
            
            return time_events.model_dump(by_alias=True), all_cues
        except Exception as e:
            self._fail_step(step, str(e))
            raise
    
    async def _step_generate_narration(
        self,
        ir: dict,
        voice_strategy: VoiceStrategy,
    ) -> Optional[StitchedNarration]:
        """Generate narration audio."""
        step = self._start_step("Generate Narration")
        
        try:
            # Create TTS provider
            from .hf_tts_provider import create_tts_provider
            
            provider = create_tts_provider(
                self.config.tts_provider,
                model_id=self.config.tts_model_id,
            )
            
            # Get narration inputs
            inputs = beats_to_narration_inputs(ir.get("beats", []))
            
            if not inputs:
                self._complete_step(step, {"skipped": "no_narration"})
                return None
            
            # Create output directory
            audio_dir = os.path.join(self.config.output_dir, "audio")
            Path(audio_dir).mkdir(parents=True, exist_ok=True)
            
            # Synthesize per-beat (mock for now)
            # In production, uses the actual TTS provider
            from .vo_stitcher import NarrationAsset
            
            assets = []
            for inp in inputs:
                # Mock asset
                assets.append(NarrationAsset(
                    beat_id=inp.beat_id,
                    wav_path=f"{audio_dir}/vo_{inp.beat_id}.wav",
                    duration_seconds=len(inp.text.split()) / 2.5,  # ~2.5 words/sec
                ))
            
            # Stitch narration
            narration = await stitch_narration(
                assets=assets,
                out_dir=audio_dir,
                fps=self.config.fps,
                also_mp3=True,
            )
            
            self._complete_step(step, {
                "totalSeconds": narration.total_seconds,
                "beatCount": len(assets),
            })
            
            return narration
        except Exception as e:
            self._fail_step(step, str(e))
            raise
    
    async def _step_build_render_plan(
        self,
        ir: dict,
        assets: dict,
        bg_bindings: dict,
        sfx_cues: list,
        narration: Optional[StitchedNarration],
    ) -> dict:
        """Build the final render plan."""
        step = self._start_step("Build Render Plan")
        
        try:
            from .remotion_budgeter import bind_assets_to_remotion_layers
            from .shot_budgeter import BudgetPlan
            
            if isinstance(ir, dict):
                ir_model = StoryIRV1.model_validate(ir)
            else:
                ir_model = ir
            
            # Build video layers from assets
            # For now, create simple layers
            layers = []
            cursor = 0
            
            for beat in ir.get("beats", []):
                duration_s = beat.get("duration_s") or beat.get("durationS", 3)
                duration_frames = round(duration_s * self.config.fps)
                
                # Add BG layer
                bg_binding = bg_bindings.get(beat.get("id"))
                if bg_binding:
                    layers.append({
                        "id": f"bg_{beat.get('id')}",
                        "kind": "VIDEO",
                        "from": cursor,
                        "durationInFrames": duration_frames,
                        "src": bg_binding.get("plateKey", "placeholder"),
                        "zIndex": 0,
                        "muted": True,
                    })
                
                cursor += duration_frames
            
            render_plan = {
                "version": "2.0.0",
                "fps": self.config.fps,
                "width": 1080 if self.config.aspect == "9:16" else 1920,
                "height": 1920 if self.config.aspect == "9:16" else 1080,
                "durationInFrames": cursor,
                "layers": layers,
            }
            
            # Add SFX layers
            from .remotion_sfx import RemotionSfxCue
            sfx_cue_models = []
            for cue in sfx_cues:
                if isinstance(cue, dict):
                    sfx_cue_models.append(RemotionSfxCue.model_validate(cue))
                else:
                    sfx_cue_models.append(cue)
            
            render_plan = add_sfx_layers_to_render_plan(render_plan, sfx_cue_models)
            
            # Add ducking if narration
            if narration:
                narration_cues = story_ir_to_narration_cues(ir, self.config.fps)
                render_plan = calculate_ducking_for_render_plan(render_plan, narration_cues)
            
            self._complete_step(step, {
                "layerCount": len(render_plan.get("layers", [])),
                "durationFrames": cursor,
            })
            
            return render_plan
        except Exception as e:
            self._fail_step(step, str(e))
            raise
    
    async def _step_render(self, render_plan: dict) -> Optional[str]:
        """Trigger the render."""
        step = self._start_step("Render Video")
        
        try:
            output_path = os.path.join(
                self.config.output_dir,
                f"{self.config.project_name}.mp4"
            )
            
            # For now, just save the render plan
            # In production, this triggers Remotion or Motion Canvas
            plan_path = os.path.join(self.config.output_dir, "render_plan.json")
            Path(self.config.output_dir).mkdir(parents=True, exist_ok=True)
            
            import json
            with open(plan_path, "w") as f:
                json.dump(render_plan, f, indent=2)
            
            self._complete_step(step, {
                "planPath": plan_path,
                "outputPath": output_path,
                "renderer": self.config.renderer,
            })
            
            return output_path
        except Exception as e:
            self._fail_step(step, str(e))
            raise


async def run_pipeline(
    config: PipelineConfig,
    trend: Optional[dict] = None,
    brief: Optional[dict] = None,
    script: Optional[str] = None,
    story_ir: Optional[dict] = None,
) -> PipelineResult:
    """
    Run the full video generation pipeline.
    
    Args:
        config: Pipeline configuration
        trend: Optional trend data
        brief: Optional content brief
        script: Optional raw script text
        story_ir: Optional pre-built Story IR
        
    Returns:
        PipelineResult
    """
    orchestrator = PipelineOrchestrator(config)
    return await orchestrator.run(trend, brief, script, story_ir)


def run_pipeline_sync(
    config: PipelineConfig,
    trend: Optional[dict] = None,
    brief: Optional[dict] = None,
    script: Optional[str] = None,
    story_ir: Optional[dict] = None,
) -> PipelineResult:
    """Synchronous version of run_pipeline."""
    return asyncio.run(run_pipeline(config, trend, brief, script, story_ir))
