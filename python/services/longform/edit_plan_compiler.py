"""
Edit Plan Compiler — Pure data transformation.

Takes all upstream pipeline outputs and compiles them into a single
Remotion-compatible JSON matching LongformVideoProps exactly.

Key features:
- Filler word removal (um, uh, like, you know, etc.)
- Gapless timeline (no black frames between segments)
- Jump-cut assembly with natural transitions
"""

from __future__ import annotations

import math
import re
import subprocess
from typing import List, Dict, Optional, Set

from loguru import logger

from .types import (
    TimelinePlan,
    TimelineWindow,
    TranscriptWord,
    BrollCandidate,
    SpeakerMask,
    TranscriptionResult,
    LongformEditPlan,
    EdlEntry,
    BrollAssetRef,
    SpeakerMaskRef,
    ZoomConfig,
    CaptionConfig,
    CaptionWord,
    MusicBedConfig,
    EditMode,
    RetentionRole,
    TransitionType,
    ZoomType,
    CaptionStyle,
)


# Filler words to remove from the timeline
FILLER_WORDS: Set[str] = {
    "um", "uh", "umm", "uhh", "erm", "hmm", "hm",
    "like",  # when used as filler (heuristic: standalone or repeated)
    "basically", "literally", "actually", "honestly",
    "you know", "i mean", "sort of", "kind of",
    "right", "so",  # when at start of sentence as filler
}

# Minimum gap (seconds) to consider as dead air worth cutting
MIN_GAP_TO_CUT = 0.4

# Transition rules by retention role
TRANSITION_MAP: Dict[str, TransitionType] = {
    "hook": TransitionType.CUT,
    "explanation": TransitionType.CUT,
    "story": TransitionType.DISSOLVE_FAST,
    "proof": TransitionType.CUT,
    "reset": TransitionType.CROSSFADE,
    "payoff": TransitionType.DISSOLVE_SLOW,
}


class EditPlanCompiler:
    """Compile all upstream outputs into Remotion input props."""

    def __init__(self, fps: int = 30, remove_fillers: bool = True, remove_dead_air: bool = True):
        self.fps = fps
        self.remove_fillers = remove_fillers
        self.remove_dead_air = remove_dead_air

    # ─── Filler Word Removal ──────────────────────────────────────────────

    def filter_filler_words(self, windows: List[TimelineWindow]) -> List[TimelineWindow]:
        """Remove filler words from transcript windows and tighten timing."""
        if not self.remove_fillers:
            return windows

        total_removed = 0
        for window in windows:
            original_count = len(window.words)
            window.words = [
                w for w in window.words
                if not self._is_filler(w, window.words)
            ]
            removed = original_count - len(window.words)
            total_removed += removed

            # Update transcript text
            if window.words:
                window.transcript_text = " ".join(w.word for w in window.words)
                window.start = window.words[0].start
                window.end = window.words[-1].end

        # Remove empty windows (all filler)
        windows = [w for w in windows if w.words]
        logger.info(f"Filler removal: removed {total_removed} filler words, {len(windows)} windows remain")
        return windows

    @staticmethod
    def _find_word_index(word: TranscriptWord, context: List[TranscriptWord]) -> int:
        """Find word index by value (timestamp + text), not object identity."""
        for i, w in enumerate(context):
            if w.word == word.word and abs(w.start - word.start) < 0.01:
                return i
        return -1

    @staticmethod
    def _is_filler(word: TranscriptWord, context: List[TranscriptWord]) -> bool:
        """Determine if a word is filler based on the word and context."""
        clean = word.word.lower().strip(".,!?;:'\"")

        # Direct filler words
        if clean in {"um", "uh", "umm", "uhh", "erm", "hmm", "hm", "ah", "oh"}:
            return True

        # Find index using value comparison, not identity
        idx = EditPlanCompiler._find_word_index(word, context)

        # "like" as filler: if surrounded by non-punctuation words (not "looks like X")
        if clean == "like":
            if idx > 0 and idx < len(context) - 1:
                prev = context[idx - 1].word.lower().strip(".,!?")
                # Keep "like" after comparison words
                if prev not in {"looks", "sounds", "feels", "seems", "acts", "is", "was"}:
                    return True

        # "right" as filler: when standalone between pauses
        if clean == "right":
            if idx > 0 and idx < len(context) - 1:
                gap_before = word.start - context[idx - 1].end
                gap_after = context[idx + 1].start - word.end
                if gap_before > 0.15 and gap_after > 0.15:
                    return True

        # "so" as sentence starter filler (first word with pause before)
        if clean == "so":
            if idx == 0:
                return True
            if idx > 0:
                gap_before = word.start - context[idx - 1].end
                if gap_before > 0.3:
                    return True

        return False

    # ─── Gapless Timeline ─────────────────────────────────────────────────

    def build_gapless_edl(self, edl_entries: List[EdlEntry]) -> List[EdlEntry]:
        """
        Remove gaps between EDL entries to create a continuous jump-cut timeline.
        Each entry's output frame is placed immediately after the previous one.
        Source trims stay the same (we're cutting the original, not stretching).
        """
        if not self.remove_dead_air or not edl_entries:
            return edl_entries

        gapless: List[EdlEntry] = []
        current_frame = 0
        total_gap_removed = 0.0

        for entry in edl_entries:
            duration_frames = entry.end_frame - entry.start_frame
            if duration_frames <= 0:
                continue

            # Check for gap from previous entry
            if gapless:
                original_gap = entry.start_time - gapless[-1].end_time
                if original_gap > MIN_GAP_TO_CUT:
                    total_gap_removed += original_gap

            # Place this entry right after the previous one
            new_entry = EdlEntry(
                window_id=entry.window_id,
                start_frame=current_frame,
                end_frame=current_frame + duration_frames,
                start_time=current_frame / self.fps,
                end_time=(current_frame + duration_frames) / self.fps,
                edit_mode=entry.edit_mode,
                retention_role=entry.retention_role,
                source_start_trim=entry.source_start_trim,  # Keep original source timing
                source_end_trim=entry.source_end_trim,
                broll=entry.broll,
                speaker_mask=entry.speaker_mask,
                zoom=entry.zoom,
                captions=entry.captions,
                transition_in=entry.transition_in,
                transition_out=entry.transition_out,
            )
            gapless.append(new_entry)
            current_frame += duration_frames

        logger.info(f"Gapless timeline: removed {total_gap_removed:.1f}s of dead air, {current_frame} total frames")
        return gapless

    def compile(
        self,
        timeline_plan: TimelinePlan,
        selected_broll: Dict[str, BrollCandidate],
        speaker_masks: List[SpeakerMask],
        transcript: TranscriptionResult,
        source_video: str,
        video_id: str = "video_001",
        music_config: Optional[Dict] = None,
        enhanced_audio: Optional[str] = None,
    ) -> LongformEditPlan:
        """
        Compile all pipeline outputs into a LongformEditPlan.

        Args:
            timeline_plan: Planned timeline with retention roles and edit modes
            selected_broll: Dict of window_id -> selected BrollCandidate
            speaker_masks: List of SpeakerMask objects
            transcript: Full transcription result
            source_video: Path/URL to the source video
            video_id: Unique video identifier
            music_config: Optional music bed configuration dict

        Returns:
            LongformEditPlan ready for JSON serialization and Remotion rendering
        """
        resolution = self._get_video_resolution(source_video)

        # Step 1: Remove filler words from windows
        cleaned_windows = self.filter_filler_words(list(timeline_plan.windows))

        # Step 2: Compile each window into an EDL entry
        edl_entries: List[EdlEntry] = []
        for window in cleaned_windows:
            entry = self._compile_entry(
                window=window,
                broll=selected_broll.get(window.window_id),
                masks=speaker_masks,
                transcript=transcript,
            )
            edl_entries.append(entry)

        # Step 3: Make timeline gapless (remove dead air)
        edl_entries = self.build_gapless_edl(edl_entries)

        if not edl_entries:
            raise ValueError("No valid EDL entries after compilation. Check transcript quality.")

        # Calculate total duration from EDL
        total_frames = max(e.end_frame for e in edl_entries)

        # Build music bed config
        music_bed = None
        if music_config:
            music_bed = MusicBedConfig(
                track_url=music_config.get("track_url", ""),
                volume=music_config.get("volume", 0.08),
                duck_during_speech=music_config.get("duck_during_speech", True),
                duck_volume=music_config.get("duck_volume", 0.03),
            )

        plan = LongformEditPlan(
            video_id=video_id,
            source_video=source_video,
            fps=self.fps,
            total_duration_frames=total_frames,
            resolution_width=resolution[0],
            resolution_height=resolution[1],
            edl=edl_entries,
            music_bed=music_bed,
        )

        logger.info(
            f"Compiled edit plan: {len(edl_entries)} entries, "
            f"{total_frames} frames ({total_frames/self.fps:.1f}s), "
            f"{resolution[0]}x{resolution[1]}"
        )
        return plan

    def _compile_entry(
        self,
        window: TimelineWindow,
        broll: Optional[BrollCandidate],
        masks: List[SpeakerMask],
        transcript: TranscriptionResult,
    ) -> EdlEntry:
        """Compile a single timeline window into an EDL entry."""
        start_frame = self._sec_to_frame(window.start)
        end_frame = self._sec_to_frame(window.end)

        # Build broll reference
        broll_ref = None
        if broll and window.edit_mode in (EditMode.BROLL_COVER, EditMode.SPEAKER_OVER_BROLL):
            clip_duration = window.end - window.start
            broll_duration = broll.duration_seconds
            if clip_duration > broll_duration:
                logger.warning(
                    f"B-roll {broll.candidate_id} ({broll_duration:.1f}s) shorter than "
                    f"window {window.window_id} ({clip_duration:.1f}s) — will loop in Remotion"
                )
            broll_ref = BrollAssetRef(
                asset_id=broll.candidate_id,
                source=broll.source,
                local_path=broll.local_path,
                start_trim=0.0,
                end_trim=min(clip_duration, broll_duration),
                opacity=1.0,
                fit="cover",
            )

        # Build speaker mask reference
        mask_ref = None
        if window.edit_mode == EditMode.SPEAKER_OVER_BROLL:
            mask = self._find_mask_for_time(masks, window.start, window.end)
            if mask:
                mask_ref = SpeakerMaskRef(
                    mask_id=mask.mask_id,
                    path=mask.output_path,
                )

        # If speaker_over_broll but missing assets, downgrade edit mode
        effective_mode = window.edit_mode
        if effective_mode == EditMode.SPEAKER_OVER_BROLL and (not broll_ref or not mask_ref):
            effective_mode = EditMode.SPEAKER_PLUS_TEXT if not broll_ref else EditMode.BROLL_COVER
        if effective_mode == EditMode.BROLL_COVER and not broll_ref:
            effective_mode = EditMode.SPEAKER_PLUS_TEXT

        # Build zoom config
        zoom = None
        if window.zoom_instruction != ZoomType.NONE:
            zoom = ZoomConfig(
                type=window.zoom_instruction,
                start_scale=1.0,
                end_scale=1.08 if window.zoom_instruction == ZoomType.SLOW_PUSH_IN else 0.92,
            )
            if window.zoom_instruction == ZoomType.SNAP_ZOOM:
                zoom.end_scale = 1.15

        # Build captions
        caption_words = self._build_caption_words(window)
        captions = CaptionConfig(
            style=window.caption_style,
            highlight_words=self._pick_highlight_words(window),
            position="bottom_center",
            font_size=48,
            words=caption_words,
        )

        # Transitions
        transition = TRANSITION_MAP.get(window.retention_role.value, TransitionType.CUT)

        return EdlEntry(
            window_id=window.window_id,
            start_frame=start_frame,
            end_frame=end_frame,
            start_time=window.start,
            end_time=window.end,
            edit_mode=effective_mode,
            retention_role=window.retention_role,
            source_start_trim=window.start,
            source_end_trim=window.end,
            broll=broll_ref,
            speaker_mask=mask_ref,
            zoom=zoom,
            captions=captions,
            transition_in=transition,
            transition_out=TransitionType.CUT,
        )

    def _build_caption_words(self, window: TimelineWindow) -> List[CaptionWord]:
        """Convert window words to caption words with highlight flags.

        Word times are made relative to the window start so that the
        Remotion <Sequence> (which starts at frame 0) can use them directly.
        """
        highlight_set = set(w.lower() for w in self._pick_highlight_words(window))
        window_start = window.start
        return [
            CaptionWord(
                word=w.word,
                start=w.start - window_start,
                end=w.end - window_start,
                highlight=w.word.lower().strip(".,!?;:") in highlight_set,
            )
            for w in window.words
        ]

    @staticmethod
    def _pick_highlight_words(window: TimelineWindow) -> List[str]:
        """Pick important words to highlight based on retention role."""
        words = window.transcript_text.split()
        # Simple heuristic: highlight longer words (likely more meaningful)
        # and words that appear important based on position
        highlights = []
        for w in words:
            clean = w.strip(".,!?;:")
            if len(clean) >= 6:  # highlight words with 6+ characters
                highlights.append(clean.lower())
        # Also highlight first and last significant words
        if words:
            highlights.append(words[0].strip(".,!?;:").lower())
        return list(set(highlights))[:5]  # max 5 highlight words

    @staticmethod
    def _find_mask_for_time(
        masks: List[SpeakerMask],
        start: float,
        end: float,
    ) -> Optional[SpeakerMask]:
        """Find a speaker mask that covers the given time range."""
        for mask in masks:
            if mask.start_time <= start and mask.end_time >= end:
                return mask
        # Partial overlap is acceptable
        for mask in masks:
            if mask.start_time <= end and mask.end_time >= start:
                return mask
        return None

    def _sec_to_frame(self, seconds: float) -> int:
        return round(seconds * self.fps)

    @staticmethod
    def _get_video_resolution(video_path: str) -> tuple:
        """Get video resolution via FFprobe."""
        try:
            result = subprocess.run(
                [
                    "ffprobe", "-v", "error",
                    "-select_streams", "v:0",
                    "-show_entries", "stream=width,height",
                    "-of", "csv=p=0",
                    video_path,
                ],
                capture_output=True, text=True, timeout=10,
            )
            parts = result.stdout.strip().split(",")
            if len(parts) == 2:
                return (int(parts[0]), int(parts[1]))
        except Exception as e:
            logger.warning(f"Could not determine resolution: {e}")
        return (1920, 1080)  # default


# ─── CLI Test ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    import json

    # Quick test with mock data
    from .types import (
        TranscriptWord, TranscriptSegment, TranscriptionResult,
        TimelineWindow, TimelinePlan, BrollSearchIntent,
    )

    words = []
    t = 0.0
    for w in "This is a test of the edit plan compiler with some words".split():
        words.append(TranscriptWord(word=w, start=t, end=t + 0.3))
        t += 0.35

    transcript = TranscriptionResult(
        segments=[TranscriptSegment(speaker="speaker_0", start=0, end=t,
                                     text=" ".join(w.word for w in words), words=words)],
        speakers=["speaker_0"], language="en", confidence=0.95, duration_seconds=t,
    )

    plan = TimelinePlan(
        windows=[TimelineWindow(
            window_id="w_0001", start=0, end=t,
            transcript_text=" ".join(w.word for w in words),
            speaker="speaker_0", words=words,
        )],
        total_duration=t,
    )

    compiler = EditPlanCompiler(fps=30)
    edit_plan = compiler.compile(
        timeline_plan=plan,
        selected_broll={},
        speaker_masks=[],
        transcript=transcript,
        source_video="test.mp4",
    )
    print(edit_plan.to_json())
