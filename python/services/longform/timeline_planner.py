"""
Timeline Planner — LLM-powered edit planning.

Takes transcript + scene boundaries and produces a structured timeline
with retention roles, edit modes, B-roll search intents, and caption styles
assigned per speech window.
"""

from __future__ import annotations

import os
import json
import re
from typing import List, Optional

from loguru import logger

from .types import (
    TranscriptionResult,
    TranscriptWord,
    SceneDetectionResult,
    TimelineWindow,
    TimelinePlan,
    BrollSearchIntent,
    EditMode,
    RetentionRole,
    CaptionStyle,
    ZoomType,
    EnergyLevel,
)


class TimelinePlanner:
    """Plan edit decisions for each speech window using LLM structured output."""

    def __init__(
        self,
        anthropic_api_key: Optional[str] = None,
        openai_api_key: Optional[str] = None,
        model: str = "claude-sonnet-4-20250514",
        openai_model: str = "gpt-4o-mini",
        min_window_sec: float = 2.5,
        max_window_sec: float = 8.0,
        provider: str = "auto",  # "anthropic", "openai", or "auto"
    ):
        self.anthropic_api_key = anthropic_api_key or os.environ.get("ANTHROPIC_API_KEY", "")
        self.openai_api_key = openai_api_key or os.environ.get("OPENAI_API_KEY", "")
        self.model = model
        self.openai_model = openai_model
        self.min_window_sec = min_window_sec
        self.max_window_sec = max_window_sec
        # Auto-detect provider
        if provider == "auto":
            self.provider = "anthropic" if self.anthropic_api_key else ("openai" if self.openai_api_key else "none")
        else:
            self.provider = provider

    # ─── Windowing (ported from SEOdocumentary/build_scene_timings.py) ────

    def create_windows(
        self,
        transcript: TranscriptionResult,
        scene_boundaries: Optional[SceneDetectionResult] = None,
    ) -> List[TimelineWindow]:
        """
        Split transcript into 2.5-8 second speech windows aligned to
        sentence boundaries, clause boundaries, or natural pauses.
        """
        words = transcript.all_words
        if not words:
            return []

        safe_cuts = set()
        if scene_boundaries:
            safe_cuts = set(scene_boundaries.safe_cut_points)

        windows: List[TimelineWindow] = []
        window_start_idx = 0
        window_id_counter = 0

        while window_start_idx < len(words):
            # Find the end of this window
            window_start_time = words[window_start_idx].start
            target_end_time = window_start_time + self.max_window_sec
            min_end_time = window_start_time + self.min_window_sec

            best_cut_idx = None
            best_cut_score = -1

            for i in range(window_start_idx + 1, len(words)):
                word_end = words[i].end

                # Don't exceed max window
                if word_end > target_end_time:
                    break

                # Don't cut too early
                if word_end < min_end_time:
                    continue

                # Score this cut point
                score = self._score_cut_point(words, i, safe_cuts)
                if score > best_cut_score:
                    best_cut_score = score
                    best_cut_idx = i

            # If no good cut found, take everything up to max or end
            if best_cut_idx is None:
                best_cut_idx = min(
                    window_start_idx + self._words_for_duration(words, window_start_idx, self.max_window_sec),
                    len(words) - 1,
                )

            # Build window
            window_words = words[window_start_idx:best_cut_idx + 1]
            if not window_words:
                window_start_idx = best_cut_idx + 1
                continue

            window_id_counter += 1
            # Determine primary speaker for this window
            speaker_counts: dict = {}
            for w in window_words:
                speaker_counts[w.speaker_id] = speaker_counts.get(w.speaker_id, 0) + 1
            primary_speaker = max(speaker_counts, key=speaker_counts.get)

            # Find nearest safe cut point
            nearest_cut = 0.0
            if safe_cuts:
                nearest_cut = min(safe_cuts, key=lambda c: abs(c - window_words[0].start))

            windows.append(TimelineWindow(
                window_id=f"w_{window_id_counter:04d}",
                start=window_words[0].start,
                end=window_words[-1].end,
                transcript_text=" ".join(w.word for w in window_words),
                speaker=primary_speaker,
                words=window_words,
                nearest_safe_cut=nearest_cut,
            ))

            window_start_idx = best_cut_idx + 1

        logger.info(f"Created {len(windows)} speech windows from {len(words)} words")
        return windows

    def _score_cut_point(
        self,
        words: List[TranscriptWord],
        idx: int,
        safe_cuts: set,
    ) -> float:
        """Score a potential cut point. Higher = better place to cut."""
        word = words[idx]
        text = word.word.strip()
        score = 0.0

        # Sentence ending (period, question mark, exclamation)
        if text.endswith((".", "?", "!")):
            score += 10.0

        # Clause ending (comma, semicolon, colon, dash)
        elif text.endswith((",", ";", ":", "—", "-")):
            score += 5.0

        # Natural pause (gap to next word > 0.3s)
        if idx + 1 < len(words):
            gap = words[idx + 1].start - word.end
            if gap > 0.3:
                score += 7.0
            elif gap > 0.15:
                score += 3.0

        # Near a scene boundary (within 0.5s)
        for cut in safe_cuts:
            if abs(cut - word.end) < 0.5:
                score += 4.0
                break

        return score

    @staticmethod
    def _words_for_duration(
        words: List[TranscriptWord],
        start_idx: int,
        duration: float,
    ) -> int:
        """Count how many words fit within duration from start_idx."""
        if start_idx >= len(words):
            return 0
        start_time = words[start_idx].start
        count = 0
        for i in range(start_idx, len(words)):
            if words[i].end - start_time > duration:
                break
            count += 1
        return max(count, 1)

    # ─── LLM Edit Planning ────────────────────────────────────────────────

    def plan_edits(
        self,
        windows: List[TimelineWindow],
        video_topic: str = "",
        brand_notes: str = "",
        batch_size: int = 8,
    ) -> List[TimelineWindow]:
        """
        Use LLM to assign retention roles, edit modes, and B-roll intents
        to each speech window. Supports Anthropic and OpenAI. Batches for efficiency.
        """
        if self.provider == "none":
            logger.warning("No LLM API key available, using rule-based fallback")
            return self._rule_based_planning(windows)

        logger.info(f"Planning edits with {self.provider} ({self.openai_model if self.provider == 'openai' else self.model})")

        for batch_start in range(0, len(windows), batch_size):
            batch = windows[batch_start:batch_start + batch_size]
            batch_context = self._build_batch_context(batch, video_topic, brand_notes)

            try:
                text = self._call_llm(batch_context)
                parsed = self._parse_llm_response(text, batch)

                for window, plan in zip(batch, parsed):
                    window.retention_role = RetentionRole(plan.get("retention_role", "explanation"))
                    window.edit_mode = EditMode(plan.get("edit_mode", "speaker_only"))
                    window.broll_needed = plan.get("broll_needed", False)
                    window.caption_style = CaptionStyle(plan.get("caption_style", "highlight_key_words"))
                    window.zoom_instruction = ZoomType(plan.get("zoom_instruction", "none"))
                    window.energy_level = EnergyLevel(plan.get("energy_level", "medium"))

                    if window.broll_needed and "broll_search_intent" in plan:
                        intent = plan["broll_search_intent"]
                        window.broll_search_intent = BrollSearchIntent(
                            literal=intent.get("literal", ""),
                            metaphor=intent.get("metaphor", ""),
                            contextual=intent.get("contextual", ""),
                        )

                logger.info(f"Planned batch {batch_start}-{batch_start + len(batch)}")

            except Exception as e:
                logger.error(f"LLM planning failed for batch {batch_start}: {e}")
                # Fallback for this batch
                for window in batch:
                    self._apply_rule_based(window, windows.index(window), len(windows))

        return windows

    def _call_llm(self, prompt: str) -> str:
        """Call the configured LLM provider and return response text.

        Uses JSON mode for OpenAI to guarantee valid JSON output.
        """
        if self.provider == "openai":
            import openai
            client = openai.OpenAI(api_key=self.openai_api_key)
            response = client.chat.completions.create(
                model=self.openai_model,
                max_tokens=4096,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert video editor. You respond ONLY with valid JSON arrays. "
                            "Each element must be a JSON object with the exact fields requested. "
                            "No markdown, no explanation, no code fences — just the JSON array."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                response_format={"type": "json_object"},
            )
            return response.choices[0].message.content or ""
        else:
            import anthropic
            client = anthropic.Anthropic(api_key=self.anthropic_api_key)
            response = client.messages.create(
                model=self.model,
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.content[0].text

    def _build_batch_context(
        self,
        batch: List[TimelineWindow],
        video_topic: str,
        brand_notes: str,
    ) -> str:
        windows_text = ""
        for w in batch:
            windows_text += (
                f"\n---\n"
                f"Window ID: {w.window_id}\n"
                f"Time: {w.start:.1f}s - {w.end:.1f}s\n"
                f"Speaker: {w.speaker}\n"
                f"Text: \"{w.transcript_text}\"\n"
            )

        return f"""You are an expert video editor optimizing a long-form video for YouTube retention.

Topic: {video_topic or 'General'}
{f'Brand notes: {brand_notes}' if brand_notes else ''}

For each speech window below, decide:
1. retention_role: "hook" | "explanation" | "story" | "proof" | "reset" | "payoff"
   - hook: opening grab, bold claim, pattern interrupt
   - explanation: teaching, breaking down a concept
   - story: narrative, example, anecdote
   - proof: evidence, demo, screenshot, statistic
   - reset: visual/tonal break to re-engage (every 15-40s)
   - payoff: conclusion, key takeaway, CTA

2. edit_mode: "speaker_only" | "speaker_plus_text" | "broll_cover" | "speaker_over_broll"
   - speaker_only: just the talking head (good for emotional/personal moments)
   - speaker_plus_text: speaker with text overlay (good for key points)
   - broll_cover: fully replace speaker with B-roll (good for descriptions, examples)
   - speaker_over_broll: speaker cutout over B-roll background (good for proof, story)

3. broll_needed: true/false

4. broll_search_intent (if broll_needed=true):
   - literal: direct visual match
   - metaphor: conceptual/metaphorical visual
   - contextual: industry/domain-specific visual

5. caption_style: "highlight_key_words" | "full_sentence" | "karaoke" | "minimal"

6. zoom_instruction: "slow_push_in" | "slow_pull_out" | "snap_zoom" | "none"

7. energy_level: "high" | "medium" | "low"

WINDOWS:
{windows_text}

Respond as a JSON object with a "windows" key containing an array with one object per window:
{{
  "windows": [
    {{
      "window_id": "w_0001",
      "retention_role": "hook",
      "edit_mode": "speaker_plus_text",
      "broll_needed": false,
      "broll_search_intent": null,
      "caption_style": "highlight_key_words",
      "zoom_instruction": "slow_push_in",
      "energy_level": "high"
    }}
  ]
}}"""

    def _parse_llm_response(self, text: str, batch: List[TimelineWindow]) -> List[dict]:
        """Parse LLM JSON response, with fallback for malformed output.

        Handles:
        - Direct JSON array: [{"retention_role": ...}, ...]
        - Wrapped JSON object: {"windows": [...]} (from json_object mode)
        - Mixed types: validates each item is a dict
        """
        default_item = {"retention_role": "explanation", "edit_mode": "speaker_plus_text", "broll_needed": False}

        try:
            # First try: parse entire response as JSON
            data = json.loads(text.strip())

            # If it's a dict, look for an array inside it
            if isinstance(data, dict):
                # Try common wrapper keys
                for key in ("windows", "results", "plans", "data", "items"):
                    if key in data and isinstance(data[key], list):
                        data = data[key]
                        break
                else:
                    # Single object — wrap in array
                    data = [data]

            if isinstance(data, list):
                validated = []
                for item in data:
                    if isinstance(item, dict):
                        validated.append(item)
                    else:
                        validated.append(dict(default_item))

                # Pad or trim to match batch size
                while len(validated) < len(batch):
                    validated.append(dict(default_item))
                return validated[:len(batch)]

        except json.JSONDecodeError:
            pass

        # Second try: extract JSON array via regex
        try:
            match = re.search(r'\[.*\]', text, re.DOTALL)
            if match:
                parsed = json.loads(match.group())
                validated = []
                for item in parsed:
                    validated.append(item if isinstance(item, dict) else dict(default_item))
                while len(validated) < len(batch):
                    validated.append(dict(default_item))
                return validated[:len(batch)]
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parse failed: {e}")

        # Fallback: return defaults
        logger.warning(f"Could not parse LLM response ({len(text)} chars), using defaults")
        return [dict(default_item)] * len(batch)

    # ─── Rule-Based Fallback ──────────────────────────────────────────────

    def _rule_based_planning(self, windows: List[TimelineWindow]) -> List[TimelineWindow]:
        """Simple rule-based planning when no LLM is available."""
        for i, window in enumerate(windows):
            self._apply_rule_based(window, i, len(windows))
        return windows

    def _apply_rule_based(self, window: TimelineWindow, idx: int, total: int):
        """Apply heuristic-based edit decisions to a single window.

        Targets ~50% B-roll coverage for visual variety.
        Alternates: speaker → broll → speaker → speaker+broll → ...
        """
        position_pct = idx / max(total - 1, 1)

        # Extract key nouns/concepts for better search queries
        key_words = self._extract_search_keywords(window.transcript_text)

        # First 5% = hook (speaker with strong captions)
        if position_pct < 0.05:
            window.retention_role = RetentionRole.HOOK
            window.edit_mode = EditMode.SPEAKER_PLUS_TEXT
            window.zoom_instruction = ZoomType.SLOW_PUSH_IN
            window.energy_level = EnergyLevel.HIGH
            window.caption_style = CaptionStyle.HIGHLIGHT_KEY_WORDS
        # Last 5% = payoff
        elif position_pct > 0.95:
            window.retention_role = RetentionRole.PAYOFF
            window.edit_mode = EditMode.SPEAKER_PLUS_TEXT
            window.zoom_instruction = ZoomType.SLOW_PUSH_IN
            window.energy_level = EnergyLevel.MEDIUM
        # Every other window gets B-roll (aiming for ~50% coverage)
        elif idx % 2 == 1:
            # Alternate between full broll_cover and speaker_over_broll
            if idx % 4 == 1:
                window.retention_role = RetentionRole.STORY
                window.edit_mode = EditMode.BROLL_COVER
            else:
                window.retention_role = RetentionRole.EXPLANATION
                window.edit_mode = EditMode.SPEAKER_OVER_BROLL
            window.broll_needed = True
            window.broll_search_intent = BrollSearchIntent(
                literal=key_words.get("literal", "technology business"),
                metaphor=key_words.get("metaphor", "digital workflow abstract"),
                contextual=key_words.get("contextual", "modern business software"),
            )
            window.caption_style = CaptionStyle.HIGHLIGHT_KEY_WORDS
        # Speaker-only windows with zoom variety
        else:
            window.retention_role = RetentionRole.EXPLANATION
            window.edit_mode = EditMode.SPEAKER_PLUS_TEXT
            window.caption_style = CaptionStyle.HIGHLIGHT_KEY_WORDS
            # Add zoom to every 3rd speaker window
            if idx % 6 == 0:
                window.zoom_instruction = ZoomType.SLOW_PUSH_IN

    @staticmethod
    def _extract_search_keywords(text: str) -> dict:
        """Extract meaningful search keywords from transcript text."""
        words = text.lower().split()
        # Filter out common stop words
        stop_words = {"the", "a", "an", "is", "are", "was", "were", "be", "been",
                      "being", "have", "has", "had", "do", "does", "did", "will",
                      "would", "could", "should", "may", "might", "shall", "can",
                      "that", "this", "these", "those", "it", "its", "they", "them",
                      "we", "us", "our", "you", "your", "he", "she", "his", "her",
                      "i", "my", "me", "and", "or", "but", "not", "no", "so", "if",
                      "then", "than", "too", "very", "just", "about", "up", "out",
                      "on", "off", "in", "at", "to", "for", "of", "with", "from",
                      "by", "as", "into", "through", "during", "before", "after",
                      "above", "below", "between", "under", "again", "further",
                      "all", "each", "every", "both", "few", "more", "most",
                      "other", "some", "such", "only", "own", "same", "here",
                      "there", "when", "where", "why", "how", "what", "which",
                      "who", "whom", "while", "because", "like", "right", "going",
                      "know", "think", "get", "got", "thing", "things", "stuff",
                      "really", "actually", "basically", "literally", "gonna"}

        meaningful = [w.strip(".,!?;:'\"") for w in words if w.strip(".,!?;:'\"") not in stop_words and len(w) > 2]
        top = meaningful[:5] if meaningful else ["technology", "business"]

        return {
            "literal": " ".join(top[:3]),
            "metaphor": " ".join(top[:2]) + " abstract concept visual",
            "contextual": " ".join(top[:3]) + " professional",
        }

    # ─── Main Entry Point ─────────────────────────────────────────────────

    def plan(
        self,
        transcript: TranscriptionResult,
        scene_boundaries: Optional[SceneDetectionResult] = None,
        video_topic: str = "",
        brand_notes: str = "",
    ) -> TimelinePlan:
        """
        Full planning pipeline: create windows → assign edit decisions.

        Args:
            transcript: Word-level transcript with speaker labels
            scene_boundaries: Optional scene detection results for cut alignment
            video_topic: Topic of the video for LLM context
            brand_notes: Brand/style guidelines for LLM context

        Returns:
            TimelinePlan with all windows annotated with edit decisions
        """
        windows = self.create_windows(transcript, scene_boundaries)
        windows = self.plan_edits(windows, video_topic, brand_notes)

        total_duration = transcript.duration_seconds
        plan = TimelinePlan(windows=windows, total_duration=total_duration)

        # Stats
        broll_count = len(plan.broll_windows())
        logger.info(
            f"Timeline plan: {len(windows)} windows, "
            f"{broll_count} need B-roll ({broll_count/max(len(windows),1)*100:.0f}%)"
        )
        return plan


# ─── CLI Test ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    # Quick test with mock data
    from .types import TranscriptWord, TranscriptSegment, TranscriptionResult

    words = []
    t = 0.0
    for w in "The biggest mistake people make with outreach is they never follow up and their pipeline decays over time".split():
        words.append(TranscriptWord(word=w, start=t, end=t + 0.3, speaker_id="speaker_0"))
        t += 0.35

    transcript = TranscriptionResult(
        segments=[TranscriptSegment(speaker="speaker_0", start=0, end=t, text=" ".join(w.word for w in words), words=words)],
        speakers=["speaker_0"],
        language="en",
        confidence=0.95,
        duration_seconds=t,
    )

    planner = TimelinePlanner()
    plan = planner.plan(transcript, video_topic="Sales outreach systems")
    print(json.dumps(plan.to_dict(), indent=2))
