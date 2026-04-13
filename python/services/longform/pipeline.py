"""
Longform Pipeline — End-to-end orchestrator.

Coordinates all services in dependency order with parallel execution
where possible. Emits PostHog events at each stage boundary.
"""

from __future__ import annotations

import asyncio
import os
import time
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Any

from loguru import logger

from .types import (
    TranscriptionResult,
    SceneDetectionResult,
    TimelinePlan,
    BrollCandidate,
    SpeakerMask,
    LongformEditPlan,
)
from .transcriber import LongformTranscriber
from .scene_detector import SceneDetector
from .timeline_planner import TimelinePlanner
from .broll_sourcer import BrollSourcer
from .audio_enhancer import AudioEnhancer
from .speaker_segmenter import SpeakerSegmenter
from .edit_plan_compiler import EditPlanCompiler


class PipelineConfig:
    """Configuration for the longform pipeline."""

    def __init__(
        self,
        output_dir: str = "output",
        fps: int = 30,
        skip_broll: bool = False,
        skip_segmentation: bool = False,
        skip_multimodal_scoring: bool = False,
        diarization_enabled: bool = True,
        video_topic: str = "",
        brand_notes: str = "",
        music_config: Optional[Dict] = None,
        posthog_api_key: Optional[str] = None,
        posthog_host: str = "https://app.posthog.com",
    ):
        self.output_dir = output_dir
        self.fps = fps
        self.skip_broll = skip_broll
        self.skip_segmentation = skip_segmentation
        self.skip_multimodal_scoring = skip_multimodal_scoring
        self.diarization_enabled = diarization_enabled
        self.video_topic = video_topic
        self.brand_notes = brand_notes
        self.music_config = music_config
        self.posthog_api_key = posthog_api_key or os.environ.get("POSTHOG_API_KEY", "")
        self.posthog_host = posthog_host


class LongformPipeline:
    """End-to-end AI longform video editing pipeline."""

    def __init__(self, config: Optional[PipelineConfig] = None):
        self.config = config or PipelineConfig()
        self.video_id = f"video_{uuid.uuid4().hex[:8]}"
        self._posthog = None
        self._init_posthog()

    def _init_posthog(self):
        """Initialize PostHog analytics client."""
        if not self.config.posthog_api_key:
            return
        try:
            import posthog
            posthog.project_api_key = self.config.posthog_api_key
            posthog.host = self.config.posthog_host
            self._posthog = posthog
            logger.info("PostHog analytics initialized")
        except ImportError:
            logger.debug("posthog not installed, analytics disabled")

    def _track(self, event: str, properties: Optional[Dict[str, Any]] = None):
        """Emit a PostHog event."""
        props = {"video_id": self.video_id, **(properties or {})}
        logger.info(f"Event: {event} | {props}")
        if self._posthog:
            try:
                self._posthog.capture(
                    distinct_id=self.video_id,
                    event=event,
                    properties=props,
                )
            except Exception as e:
                logger.debug(f"PostHog capture failed: {e}")

    # ─── Individual Steps ─────────────────────────────────────────────────

    def step_transcribe(self, video_path: str) -> TranscriptionResult:
        """Step 1: Transcribe video with word timestamps + diarization."""
        start = time.time()
        transcriber = LongformTranscriber(
            diarization_enabled=self.config.diarization_enabled,
        )
        result = transcriber.transcribe_video(video_path)
        self._track("transcript generated", {
            "word_count": len(result.all_words),
            "speaker_count": len(result.speakers),
            "language": result.language,
            "confidence": result.confidence,
            "duration_seconds": result.duration_seconds,
            "processing_time": time.time() - start,
        })
        return result

    def step_detect_scenes(self, video_path: str) -> SceneDetectionResult:
        """Step 2: Detect scene boundaries."""
        start = time.time()
        detector = SceneDetector()
        result = detector.detect_scenes(video_path)
        self._track("scene boundaries detected", {
            "scene_count": len(result.scenes),
            "cut_point_count": len(result.safe_cut_points),
            "processing_time": time.time() - start,
        })
        return result

    def step_plan_timeline(
        self,
        transcript: TranscriptionResult,
        scenes: Optional[SceneDetectionResult],
    ) -> TimelinePlan:
        """Step 3: Plan edit decisions per speech window."""
        start = time.time()
        planner = TimelinePlanner()
        plan = planner.plan(
            transcript=transcript,
            scene_boundaries=scenes,
            video_topic=self.config.video_topic,
            brand_notes=self.config.brand_notes,
        )
        self._track("edit plan generated", {
            "window_count": len(plan.windows),
            "broll_windows_pct": len(plan.broll_windows()) / max(len(plan.windows), 1),
            "processing_time": time.time() - start,
        })
        return plan

    def step_source_broll(self, plan: TimelinePlan) -> Dict[str, BrollCandidate]:
        """Step 4: Source and score B-roll for windows that need it."""
        if self.config.skip_broll:
            logger.info("B-roll sourcing skipped (--skip-broll)")
            return {}

        start = time.time()
        sourcer = BrollSourcer(download_dir=os.path.join(self.config.output_dir, "broll"))
        selected: Dict[str, BrollCandidate] = {}

        for window in plan.broll_windows():
            try:
                candidate = sourcer.source_for_window(window)
                if candidate:
                    selected[window.window_id] = candidate
                    self._track("broll candidate accepted", {
                        "window_id": window.window_id,
                        "candidate_id": candidate.candidate_id,
                        "source": candidate.source,
                        "overall_score": candidate.overall_score,
                        "semantic_fit": candidate.semantic_fit,
                    })
            except Exception as e:
                logger.warning(f"B-roll sourcing failed for {window.window_id}: {e}")

        self._track("broll sourcing completed", {
            "windows_needing_broll": len(plan.broll_windows()),
            "windows_with_broll": len(selected),
            "processing_time": time.time() - start,
        })
        return selected

    def step_segment_speaker(
        self,
        video_path: str,
        transcript: TranscriptionResult,
    ) -> List[SpeakerMask]:
        """Step 5: Segment speaker from background."""
        if self.config.skip_segmentation:
            logger.info("Speaker segmentation skipped (--skip-segmentation)")
            return []

        start = time.time()
        segmenter = SpeakerSegmenter(
            output_dir=os.path.join(self.config.output_dir, "masks"),
        )
        mask = segmenter.segment_speaker(
            video_path=video_path,
            transcript=transcript,
        )
        self._track("speaker segmented", {
            "mask_id": mask.mask_id,
            "speaker_id": mask.speaker_id,
            "quality_score": mask.quality_score,
            "processing_time": time.time() - start,
        })
        return [mask]

    def step_compile(
        self,
        plan: TimelinePlan,
        broll: Dict[str, BrollCandidate],
        masks: List[SpeakerMask],
        transcript: TranscriptionResult,
        source_video: str,
    ) -> LongformEditPlan:
        """Step 6: Compile everything into Remotion input props."""
        start = time.time()
        compiler = EditPlanCompiler(fps=self.config.fps)
        edit_plan = compiler.compile(
            timeline_plan=plan,
            selected_broll=broll,
            speaker_masks=masks,
            transcript=transcript,
            source_video=source_video,
            video_id=self.video_id,
            music_config=self.config.music_config,
        )
        self._track("edit plan compiled", {
            "edl_entry_count": len(edit_plan.edl),
            "total_duration_frames": edit_plan.total_duration_frames,
            "processing_time": time.time() - start,
        })
        return edit_plan

    # ─── Sync Runner ──────────────────────────────────────────────────────

    def step_enhance_audio(self, video_path: str) -> str:
        """Step: Enhance speaker voice quality and source background music."""
        start = time.time()
        enhancer = AudioEnhancer(output_dir=os.path.join(self.config.output_dir, "audio"))

        # Enhance voice
        enhanced_path = enhancer.enhance_voice(video_path)
        self._track("audio enhanced", {
            "processing_time": time.time() - start,
        })

        # Source background music if not provided
        if not self.config.music_config or not self.config.music_config.get("track_url"):
            music_path = enhancer.source_background_music(
                query="ambient background music subtle",
                video_topic=self.config.video_topic,
            )
            if self.config.music_config is None:
                self.config.music_config = {}
            self.config.music_config["track_url"] = music_path
            self.config.music_config.setdefault("volume", 0.15)
            self.config.music_config.setdefault("duck_during_speech", True)
            self.config.music_config.setdefault("duck_volume", 0.04)
            logger.info(f"Background music sourced: {music_path}")

        return enhanced_path

    def run_sync(self, video_path: str) -> LongformEditPlan:
        """
        Run the full pipeline synchronously (sequential execution).
        Good for development and debugging.
        """
        logger.info(f"Starting longform pipeline (sync) for {video_path}")

        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Source video not found: {video_path}")

        self._track("video ingested", {"source": video_path})

        os.makedirs(self.config.output_dir, exist_ok=True)

        # Step 0: Enhance audio + source music
        enhanced_video = self.step_enhance_audio(video_path)

        # Step 1 + 2: Transcribe and detect scenes
        transcript = self.step_transcribe(video_path)  # Transcribe original (timestamps match)
        scenes = self.step_detect_scenes(video_path)

        # Step 3: Plan timeline
        plan = self.step_plan_timeline(transcript, scenes)

        # Step 4 + 5: Source B-roll and segment speaker
        broll = self.step_source_broll(plan)
        masks = self.step_segment_speaker(video_path, transcript)

        # Step 6: Compile (uses enhanced video as source, filler removal + gapless)
        edit_plan = self.step_compile(plan, broll, masks, transcript, enhanced_video)

        # Save output
        output_path = os.path.join(self.config.output_dir, f"{self.video_id}_props.json")
        edit_plan.save(output_path)
        logger.info(f"Edit plan saved to {output_path}")

        # Save transcript for reference
        transcript_path = os.path.join(self.config.output_dir, f"{self.video_id}_transcript.json")
        import json
        with open(transcript_path, "w") as f:
            json.dump(transcript.to_dict(), f, indent=2)

        self._track("pipeline completed", {
            "output_path": output_path,
            "edl_entries": len(edit_plan.edl),
        })

        return edit_plan

    # ─── Async Runner ─────────────────────────────────────────────────────

    async def run_async(self, video_path: str) -> LongformEditPlan:
        """
        Run the full pipeline with parallel execution where possible.
        Better for production throughput.
        """
        logger.info(f"Starting longform pipeline (async) for {video_path}")
        self._track("video ingested", {"source": video_path})

        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Source video not found: {video_path}")

        os.makedirs(self.config.output_dir, exist_ok=True)
        loop = asyncio.get_event_loop()

        # Phase 0: Enhance audio (must complete before transcription uses enhanced video)
        enhanced_video = await loop.run_in_executor(
            None, self.step_enhance_audio, video_path
        )

        # Phase A: Transcribe original + detect scenes (parallel)
        # Transcribe original video so timestamps match source trims
        transcript_future = loop.run_in_executor(None, self.step_transcribe, video_path)
        scenes_future = loop.run_in_executor(None, self.step_detect_scenes, video_path)
        transcript, scenes = await asyncio.gather(transcript_future, scenes_future)

        # Phase B: Plan timeline (needs both above)
        plan = await loop.run_in_executor(
            None, self.step_plan_timeline, transcript, scenes
        )

        # Phase C: Source B-roll + segment speaker (parallel)
        broll_future = loop.run_in_executor(None, self.step_source_broll, plan)
        masks_future = loop.run_in_executor(
            None, self.step_segment_speaker, video_path, transcript
        )
        broll, masks = await asyncio.gather(broll_future, masks_future)

        # Phase D: Compile (uses enhanced video as source)
        edit_plan = await loop.run_in_executor(
            None, self.step_compile, plan, broll, masks, transcript, enhanced_video
        )

        # Save
        output_path = os.path.join(self.config.output_dir, f"{self.video_id}_props.json")
        edit_plan.save(output_path)
        logger.info(f"Edit plan saved to {output_path}")

        # Save transcript
        transcript_path = os.path.join(self.config.output_dir, f"{self.video_id}_transcript.json")
        import json
        with open(transcript_path, "w") as f:
            json.dump(transcript.to_dict(), f, indent=2)

        self._track("pipeline completed", {"output_path": output_path})
        return edit_plan
