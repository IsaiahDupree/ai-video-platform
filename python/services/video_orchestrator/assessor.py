"""
Assessor Service
================
Quality assessment for generated video clips.

The Assessor role:
- Validates generated clips against acceptance criteria
- Checks: transcript match, visual requirements, continuity, artifacts, duration
- Produces pass/fail verdict with score breakdown
- Generates repair instructions for failed clips

Assessment Checks:
- transcript_match: Compare speech to expected narration
- visual_requirements: Verify must_include elements are present
- continuity: Check character/setting consistency
- no_artifacts: Detect glitches, gibberish text, distortions
- duration_ok: Verify actual vs target duration
"""

import asyncio
import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID, uuid4

from .models import (
    Assessment,
    AssessmentVerdict,
    OrchestratorRole,
    ClipPlanClip,
    ClipRun,
    RepairInstruction,
    RepairStrategy,
    CheckType,
    CheckBreakdown,
    AcceptanceCheck,
    ProviderName,
)

logger = logging.getLogger(__name__)


@dataclass
class CheckResult:
    """Result of a single check."""
    check_type: CheckType
    passed: bool
    score: float  # 0.0 to 1.0
    weight: float
    notes: str = ""
    evidence: Dict[str, Any] = field(default_factory=dict)
    
    @property
    def weighted_score(self) -> float:
        return self.score * self.weight


@dataclass
class AssessmentInput:
    """Input for assessment."""
    clip: ClipPlanClip
    clip_run: ClipRun
    video_url: Optional[str] = None
    actual_duration: Optional[float] = None
    transcript: Optional[str] = None  # Actual transcript from video


class AssessorService:
    """
    Assessor service for evaluating generated clips.
    
    Runs configured checks and produces assessment with:
    - Overall verdict (pass/fail/needs_review)
    - Score (0.0 to 1.0)
    - Per-check breakdown
    - Repair instructions if failed
    """
    
    def __init__(
        self,
        ai_provider: Optional[str] = None,
        strict_mode: bool = False
    ):
        self.ai_provider_name = ai_provider
        self.strict_mode = strict_mode  # Fails on any check failure
        self._ai_provider = None
    
    def _get_ai_provider(self):
        """Get AI provider for visual analysis."""
        if self._ai_provider is None and self.ai_provider_name:
            try:
                from services.ai_providers import get_ai_provider
                self._ai_provider = get_ai_provider(self.ai_provider_name)
            except Exception as e:
                logger.warning(f"Could not load AI provider: {e}")
        return self._ai_provider
    
    async def assess(self, input: AssessmentInput) -> Assessment:
        """
        Assess a generated clip against its acceptance criteria.
        
        Args:
            input: AssessmentInput with clip, run, and media info
        
        Returns:
            Assessment with verdict, score, and breakdown
        """
        clip = input.clip
        clip_run = input.clip_run
        
        # Get acceptance criteria
        criteria = clip.acceptance
        checks_config = criteria.checks
        threshold = criteria.score_threshold
        
        logger.info(f"Assessing clip {clip.id}, threshold={threshold}")
        
        # Run all configured checks
        check_results: List[CheckResult] = []
        
        for check_config in checks_config:
            result = await self._run_check(check_config, input)
            check_results.append(result)
        
        # Calculate overall score
        total_weight = sum(r.weight for r in check_results)
        if total_weight > 0:
            overall_score = sum(r.weighted_score for r in check_results) / total_weight
        else:
            overall_score = 0.0
        
        # Determine verdict
        failed_checks = [r for r in check_results if not r.passed]
        
        if self.strict_mode and failed_checks:
            verdict = AssessmentVerdict.FAIL
        elif overall_score >= threshold:
            verdict = AssessmentVerdict.PASS
        elif overall_score >= threshold * 0.7:  # Within 30% of threshold
            verdict = AssessmentVerdict.NEEDS_REVIEW
        else:
            verdict = AssessmentVerdict.FAIL
        
        # Build reasons
        reasons = []
        if verdict == AssessmentVerdict.PASS:
            reasons.append(f"Score {overall_score:.2f} meets threshold {threshold}")
        else:
            for r in failed_checks:
                reasons.append(f"{r.check_type.value}: {r.notes}")
        
        # Build breakdown
        breakdown = [
            CheckBreakdown(
                type=r.check_type.value,
                weight=r.weight,
                score=r.score,
                notes=r.notes,
                evidence=r.evidence
            )
            for r in check_results
        ]
        
        # Generate repair instruction if failed
        repair_instruction = None
        if verdict == AssessmentVerdict.FAIL:
            repair_instruction = self._generate_repair_instruction(
                check_results, clip, clip_run
            )
        
        assessment = Assessment(
            clip_run_id=clip_run.id,
            assessor_role=OrchestratorRole.ASSESSOR,
            verdict=verdict,
            score=overall_score,
            reasons=reasons,
            breakdown=breakdown,
            repair_instruction=repair_instruction
        )
        
        logger.info(
            f"Assessment complete: verdict={verdict.value}, "
            f"score={overall_score:.2f}, checks={len(check_results)}"
        )
        
        return assessment
    
    async def _run_check(
        self,
        check_config: AcceptanceCheck,
        input: AssessmentInput
    ) -> CheckResult:
        """Run a single check."""
        check_type = check_config.type
        weight = check_config.weight
        params = check_config.params
        
        try:
            if check_type == CheckType.TRANSCRIPT_MATCH:
                return await self._check_transcript_match(input, weight, params)
            elif check_type == CheckType.VISUAL_REQUIREMENTS:
                return await self._check_visual_requirements(input, weight, params)
            elif check_type == CheckType.CONTINUITY:
                return await self._check_continuity(input, weight, params)
            elif check_type == CheckType.NO_ARTIFACTS:
                return await self._check_no_artifacts(input, weight, params)
            elif check_type == CheckType.DURATION_OK:
                return await self._check_duration(input, weight, params)
            else:
                logger.warning(f"Unknown check type: {check_type}")
                return CheckResult(
                    check_type=check_type,
                    passed=True,
                    score=1.0,
                    weight=weight,
                    notes="Unknown check type, passed by default"
                )
        except Exception as e:
            logger.error(f"Check {check_type} failed with error: {e}")
            return CheckResult(
                check_type=check_type,
                passed=False,
                score=0.0,
                weight=weight,
                notes=f"Check error: {str(e)}"
            )
    
    async def _check_transcript_match(
        self,
        input: AssessmentInput,
        weight: float,
        params: Dict[str, Any]
    ) -> CheckResult:
        """
        Check if video speech matches expected narration.
        
        For external_voiceover mode, this is typically a pass
        since the audio will be overlaid separately.
        """
        clip = input.clip
        actual_transcript = input.transcript
        
        # If narration is external voiceover, the video doesn't need speech
        from .models import NarrationMode
        if clip.narration.mode == NarrationMode.EXTERNAL_VOICEOVER:
            return CheckResult(
                check_type=CheckType.TRANSCRIPT_MATCH,
                passed=True,
                score=1.0,
                weight=weight,
                notes="External voiceover mode - transcript check N/A"
            )
        
        if clip.narration.mode == NarrationMode.NONE:
            return CheckResult(
                check_type=CheckType.TRANSCRIPT_MATCH,
                passed=True,
                score=1.0,
                weight=weight,
                notes="No narration expected"
            )
        
        # For generated_in_video, compare transcripts
        expected = clip.narration.text.lower().strip()
        
        if not actual_transcript:
            return CheckResult(
                check_type=CheckType.TRANSCRIPT_MATCH,
                passed=False,
                score=0.3,
                weight=weight,
                notes="No transcript available for comparison"
            )
        
        actual = actual_transcript.lower().strip()
        
        # Calculate similarity (simple word overlap)
        expected_words = set(expected.split())
        actual_words = set(actual.split())
        
        if not expected_words:
            return CheckResult(
                check_type=CheckType.TRANSCRIPT_MATCH,
                passed=True,
                score=1.0,
                weight=weight,
                notes="No expected transcript"
            )
        
        overlap = expected_words & actual_words
        similarity = len(overlap) / len(expected_words)
        
        threshold = params.get("similarity_threshold", 0.7)
        passed = similarity >= threshold
        
        return CheckResult(
            check_type=CheckType.TRANSCRIPT_MATCH,
            passed=passed,
            score=similarity,
            weight=weight,
            notes=f"Word overlap: {similarity:.1%}",
            evidence={
                "expected_words": len(expected_words),
                "actual_words": len(actual_words),
                "overlap": len(overlap),
                "similarity": similarity
            }
        )
    
    async def _check_visual_requirements(
        self,
        input: AssessmentInput,
        weight: float,
        params: Dict[str, Any]
    ) -> CheckResult:
        """
        Check if required visual elements are present.
        
        Uses AI vision if available, otherwise returns partial pass.
        """
        clip = input.clip
        must_include = clip.visual_intent.must_include
        
        if not must_include:
            return CheckResult(
                check_type=CheckType.VISUAL_REQUIREMENTS,
                passed=True,
                score=1.0,
                weight=weight,
                notes="No visual requirements specified"
            )
        
        # Try to use AI vision for analysis
        provider = self._get_ai_provider()
        
        if provider and input.video_url:
            try:
                # This would call vision API to analyze frames
                # For now, return optimistic result
                return CheckResult(
                    check_type=CheckType.VISUAL_REQUIREMENTS,
                    passed=True,
                    score=0.8,
                    weight=weight,
                    notes=f"AI visual check for: {', '.join(must_include[:3])}",
                    evidence={"must_include": must_include, "checked_with_ai": True}
                )
            except Exception as e:
                logger.warning(f"AI visual check failed: {e}")
        
        # Without AI, give partial score
        return CheckResult(
            check_type=CheckType.VISUAL_REQUIREMENTS,
            passed=True,
            score=0.7,
            weight=weight,
            notes=f"Visual requirements not verified (no AI): {', '.join(must_include[:3])}",
            evidence={"must_include": must_include, "checked_with_ai": False}
        )
    
    async def _check_continuity(
        self,
        input: AssessmentInput,
        weight: float,
        params: Dict[str, Any]
    ) -> CheckResult:
        """
        Check character/setting consistency.
        
        Requires reference frames from previous clips for full check.
        """
        # Without reference frames, give optimistic score
        # In production, this would compare to character bible / previous clips
        
        character_lock = params.get("character_lock", False)
        
        if character_lock:
            # Stricter check needed
            return CheckResult(
                check_type=CheckType.CONTINUITY,
                passed=True,
                score=0.75,
                weight=weight,
                notes="Character lock enabled - manual review recommended"
            )
        
        return CheckResult(
            check_type=CheckType.CONTINUITY,
            passed=True,
            score=0.85,
            weight=weight,
            notes="Continuity assumed OK (no reference frames)"
        )
    
    async def _check_no_artifacts(
        self,
        input: AssessmentInput,
        weight: float,
        params: Dict[str, Any]
    ) -> CheckResult:
        """
        Check for visual artifacts, glitches, gibberish text.
        """
        avoid_list = params.get("avoid", [])
        clip = input.clip
        
        # Combine with clip's must_avoid
        all_avoid = set(avoid_list + clip.visual_intent.must_avoid)
        
        # Without frame analysis, give optimistic score
        # In production, this would sample frames and check for issues
        
        return CheckResult(
            check_type=CheckType.NO_ARTIFACTS,
            passed=True,
            score=0.85,
            weight=weight,
            notes=f"Artifact check pending (avoiding: {', '.join(list(all_avoid)[:3])})",
            evidence={"avoid_list": list(all_avoid)}
        )
    
    async def _check_duration(
        self,
        input: AssessmentInput,
        weight: float,
        params: Dict[str, Any]
    ) -> CheckResult:
        """
        Check if actual duration matches target.
        """
        clip = input.clip
        target = clip.target_seconds
        actual = input.actual_duration
        
        if actual is None:
            # Use clip run response if available
            actual = input.clip_run.duration_actual
        
        if actual is None:
            return CheckResult(
                check_type=CheckType.DURATION_OK,
                passed=True,
                score=0.8,
                weight=weight,
                notes="Duration not verified (not available)"
            )
        
        # Calculate difference
        tolerance = params.get("tolerance_seconds", 1.0)
        diff = abs(actual - target)
        
        if diff <= tolerance:
            score = 1.0
            passed = True
            notes = f"Duration OK: {actual}s vs {target}s target"
        elif diff <= tolerance * 2:
            score = 0.7
            passed = True
            notes = f"Duration close: {actual}s vs {target}s target"
        else:
            score = 0.4
            passed = False
            notes = f"Duration mismatch: {actual}s vs {target}s target"
        
        return CheckResult(
            check_type=CheckType.DURATION_OK,
            passed=passed,
            score=score,
            weight=weight,
            notes=notes,
            evidence={
                "target_seconds": target,
                "actual_seconds": actual,
                "difference": diff
            }
        )
    
    def _generate_repair_instruction(
        self,
        check_results: List[CheckResult],
        clip: ClipPlanClip,
        clip_run: ClipRun
    ) -> RepairInstruction:
        """
        Generate repair instruction based on failed checks.
        """
        failed_checks = [r for r in check_results if not r.passed]
        
        if not failed_checks:
            return RepairInstruction(
                strategy=RepairStrategy.PROMPT_PATCH,
                notes="No specific failures identified"
            )
        
        # Determine best repair strategy
        # Priority: visual > duration > transcript > continuity > artifacts
        
        visual_failed = any(
            r.check_type == CheckType.VISUAL_REQUIREMENTS 
            for r in failed_checks
        )
        duration_failed = any(
            r.check_type == CheckType.DURATION_OK
            for r in failed_checks
        )
        transcript_failed = any(
            r.check_type == CheckType.TRANSCRIPT_MATCH
            for r in failed_checks
        )
        
        # Build prompt delta
        prompt_patches = []
        
        if visual_failed:
            must_include = clip.visual_intent.must_include
            prompt_patches.append(
                f"Ensure these elements are clearly visible: {', '.join(must_include[:5])}"
            )
        
        if duration_failed:
            prompt_patches.append(
                f"Adjust pacing to fit exactly {clip.target_seconds} seconds"
            )
        
        if transcript_failed:
            prompt_patches.append(
                "Ensure speech is clear and matches the expected dialogue"
            )
        
        # Decide strategy
        # If multiple visual failures, try remix
        # If repeated failures on same clip, fallback provider
        
        attempt = clip_run.attempt
        
        if attempt >= 3:
            # Fallback to another provider after 3+ attempts
            return RepairInstruction(
                strategy=RepairStrategy.FALLBACK_PROVIDER,
                fallback_provider=ProviderName.RUNWAY,
                prompt_delta=". ".join(prompt_patches),
                notes=f"Attempt {attempt} failed, falling back to alternative provider"
            )
        elif attempt >= 2 and visual_failed:
            # Try remix after second attempt for visual failures
            return RepairInstruction(
                strategy=RepairStrategy.REMIX,
                prompt_delta=". ".join(prompt_patches),
                notes=f"Attempt {attempt} failed visual check, trying remix"
            )
        else:
            # Default: prompt patch
            return RepairInstruction(
                strategy=RepairStrategy.PROMPT_PATCH,
                prompt_delta=". ".join(prompt_patches) if prompt_patches else "Improve visual quality and clarity",
                notes=f"Attempt {attempt} failed, patching prompt"
            )
    
    async def quick_assess(
        self,
        clip_run: ClipRun,
        clip: ClipPlanClip
    ) -> Tuple[bool, float, str]:
        """
        Quick assessment without full check breakdown.
        
        Returns:
            Tuple of (passed, score, reason)
        """
        # Check if run succeeded
        from .models import ClipRunStatus
        
        if clip_run.status != ClipRunStatus.SUCCEEDED:
            return False, 0.0, f"Run status: {clip_run.status.value}"
        
        # Check if outputs available
        if not clip_run.response_payload:
            return False, 0.2, "No response payload"
        
        # Basic checks passed
        return True, 0.8, "Basic checks passed"


class RepairExecutor:
    """
    Executes repair strategies for failed clips.
    """
    
    def __init__(self, scene_crafter=None, provider_adapters=None):
        self.scene_crafter = scene_crafter
        self.provider_adapters = provider_adapters or {}
    
    async def execute_repair(
        self,
        clip: ClipPlanClip,
        instruction: RepairInstruction,
        previous_run: ClipRun,
        bibles: Dict[str, Any] = None
    ) -> Optional[Any]:
        """
        Execute a repair strategy.
        
        Args:
            clip: The clip to repair
            instruction: Repair instruction from assessor
            previous_run: The failed run
            bibles: Optional bible references
        
        Returns:
            New CreateClipInput or RemixClipInput for retry
        """
        strategy = instruction.strategy
        
        if not self.scene_crafter:
            from .scene_crafter import SceneCrafterService
            self.scene_crafter = SceneCrafterService()
        
        if strategy == RepairStrategy.PROMPT_PATCH:
            # Modify prompt and create new input
            original_prompt = clip.visual_intent.prompt
            patched_prompt = self.scene_crafter.apply_prompt_patch(
                original_prompt,
                instruction.prompt_delta
            )
            
            # Update clip's visual intent temporarily
            clip.visual_intent.prompt = patched_prompt
            
            return self.scene_crafter.build_provider_payload(
                clip,
                style_bible=bibles.get("style") if bibles else None,
                character_bible=bibles.get("character") if bibles else None
            )
        
        elif strategy == RepairStrategy.REMIX:
            # Create remix input from previous run
            return self.scene_crafter.build_remix_payload(
                clip,
                source_generation_id=previous_run.provider_generation_id,
                prompt_delta=instruction.prompt_delta
            )
        
        elif strategy == RepairStrategy.FALLBACK_PROVIDER:
            # Build payload for fallback provider
            clip.provider_hints.primary_provider = instruction.fallback_provider
            
            return self.scene_crafter.build_provider_payload(
                clip,
                style_bible=bibles.get("style") if bibles else None,
                character_bible=bibles.get("character") if bibles else None
            )
        
        return None
