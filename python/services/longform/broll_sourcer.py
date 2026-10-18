"""
B-Roll Sourcer — Stock API integration with two-pass scoring.

Pass A: Embedding-based semantic similarity (cheap, filters to top N)
Pass B: Multimodal visual scoring with Claude Vision (expensive, picks winner)
"""

from __future__ import annotations

import os
import time
import uuid
import tempfile
import subprocess
from typing import List, Dict, Optional, Tuple

import httpx
from loguru import logger

from .types import (
    BrollSearchIntent,
    BrollCandidate,
    TimelineWindow,
)


class PexelsClient:
    """Pexels Video API client with rate limiting."""

    BASE_URL = "https://api.pexels.com"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("PEXELS_API_KEY", "")
        if not self.api_key:
            raise ValueError("PEXELS_API_KEY is required")
        self._last_request_time = 0.0
        self._min_interval = 0.5  # Max ~120 req/min (well under 200/hr limit)

    def _rate_limit(self):
        elapsed = time.time() - self._last_request_time
        if elapsed < self._min_interval:
            time.sleep(self._min_interval - elapsed)
        self._last_request_time = time.time()

    def search_videos(
        self,
        query: str,
        orientation: str = "landscape",
        size: str = "medium",
        per_page: int = 10,
    ) -> List[Dict]:
        """Search Pexels for videos matching query."""
        self._rate_limit()

        with httpx.Client(timeout=30) as client:
            resp = client.get(
                f"{self.BASE_URL}/videos/search",
                headers={"Authorization": self.api_key},
                params={
                    "query": query,
                    "orientation": orientation,
                    "size": size,
                    "per_page": per_page,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        videos = data.get("videos", [])
        logger.debug(f"Pexels search '{query}': {len(videos)} results")
        return videos


class BrollSourcer:
    """Source, score, and select B-roll for timeline windows."""

    def __init__(
        self,
        pexels_api_key: Optional[str] = None,
        openai_api_key: Optional[str] = None,
        anthropic_api_key: Optional[str] = None,
        download_dir: Optional[str] = None,
    ):
        self.pexels = PexelsClient(pexels_api_key)
        self.openai_api_key = openai_api_key or os.environ.get("OPENAI_API_KEY", "")
        self.anthropic_api_key = anthropic_api_key or os.environ.get("ANTHROPIC_API_KEY", "")
        self.download_dir = download_dir or tempfile.mkdtemp(prefix="broll_")
        os.makedirs(self.download_dir, exist_ok=True)

    # ─── Search ───────────────────────────────────────────────────────────

    def search_candidates(
        self,
        intent: BrollSearchIntent,
        min_duration: float = 3.0,
        max_duration: float = 30.0,
        min_width: int = 1920,
        orientation: str = "landscape",
    ) -> List[BrollCandidate]:
        """Search Pexels for B-roll candidates using all three query types."""
        candidates: List[BrollCandidate] = []
        seen_ids = set()

        for query_type, query_text in [
            ("literal", intent.literal),
            ("metaphor", intent.metaphor),
            ("contextual", intent.contextual),
        ]:
            if not query_text.strip():
                continue

            try:
                videos = self.pexels.search_videos(
                    query=query_text,
                    orientation=orientation,
                    per_page=8,
                )
            except Exception as e:
                logger.warning(f"Pexels search failed for '{query_text}': {e}")
                continue

            for video in videos:
                vid_id = str(video.get("id", ""))
                if vid_id in seen_ids:
                    continue
                seen_ids.add(vid_id)

                duration = video.get("duration", 0)
                if duration < min_duration or duration > max_duration:
                    continue

                # Find best quality video file
                best_file = self._pick_best_file(video.get("video_files", []), min_width)
                if not best_file:
                    continue

                candidates.append(BrollCandidate(
                    candidate_id=f"pexels_{vid_id}_{query_type}",
                    source="pexels",
                    source_asset_id=vid_id,
                    query_type=query_type,
                    query_text=query_text,
                    preview_url=video.get("video_pictures", [{}])[0].get("picture", ""),
                    download_url=best_file.get("link", ""),
                    duration_seconds=duration,
                    width=best_file.get("width", 0),
                    height=best_file.get("height", 0),
                    fps=best_file.get("fps", 30),
                    license_ok=True,  # Pexels is free to use
                ))

        logger.info(f"Found {len(candidates)} B-roll candidates after filtering")
        return candidates

    @staticmethod
    def _pick_best_file(video_files: List[Dict], min_width: int) -> Optional[Dict]:
        """Pick the best quality video file that meets minimum width requirement."""
        suitable = [
            f for f in video_files
            if f.get("width", 0) >= min_width and f.get("file_type") == "video/mp4"
        ]
        if not suitable:
            # Fallback: take largest available
            suitable = sorted(video_files, key=lambda f: f.get("width", 0), reverse=True)
        return suitable[0] if suitable else None

    # ─── Pass A: Embedding Scoring ────────────────────────────────────────

    def score_pass_a(
        self,
        candidates: List[BrollCandidate],
        intent: BrollSearchIntent,
        top_n: int = 5,
    ) -> List[BrollCandidate]:
        """Score candidates using embedding similarity. Returns top N."""
        if not candidates:
            return []
        if not self.openai_api_key:
            logger.warning("No OpenAI API key, skipping embedding scoring")
            return candidates[:top_n]

        import openai

        client = openai.OpenAI(api_key=self.openai_api_key)

        # Build intent text for embedding
        intent_text = f"{intent.literal}. {intent.metaphor}. {intent.contextual}"

        # Get embeddings for intent + all candidate descriptions
        texts = [intent_text] + [
            f"{c.query_text} {c.source_asset_id}" for c in candidates
        ]

        logger.info(f"Computing embeddings for {len(texts)} texts")
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=texts,
        )

        embeddings = [item.embedding for item in response.data]
        intent_emb = embeddings[0]
        candidate_embs = embeddings[1:]

        # Cosine similarity
        for candidate, emb in zip(candidates, candidate_embs):
            similarity = self._cosine_similarity(intent_emb, emb)
            candidate.embedding_similarity = similarity

        # Sort by similarity, return top N
        candidates.sort(key=lambda c: c.embedding_similarity, reverse=True)
        top = candidates[:top_n]
        logger.info(
            f"Pass A: top {len(top)} candidates, "
            f"similarity range [{top[-1].embedding_similarity:.3f}, {top[0].embedding_similarity:.3f}]"
        )
        return top

    @staticmethod
    def _cosine_similarity(a: List[float], b: List[float]) -> float:
        dot = sum(x * y for x, y in zip(a, b))
        norm_a = sum(x * x for x in a) ** 0.5
        norm_b = sum(x * x for x in b) ** 0.5
        return dot / (norm_a * norm_b) if norm_a and norm_b else 0.0

    # ─── Pass B: Multimodal Scoring ───────────────────────────────────────

    def score_pass_b(
        self,
        candidates: List[BrollCandidate],
        window_text: str,
        retention_role: str = "explanation",
    ) -> List[BrollCandidate]:
        """Score candidates using multimodal analysis (OpenAI Vision or Claude Vision)."""
        if not candidates:
            return []

        has_anthropic = bool(self.anthropic_api_key)
        has_openai = bool(self.openai_api_key)

        if not has_anthropic and not has_openai:
            logger.warning("No vision API key available, skipping multimodal scoring")
            for c in candidates:
                c.overall_score = c.embedding_similarity
            return candidates

        import base64

        scoring_prompt = (
            f"Score this B-roll image for use in a video segment.\n\n"
            f"Narration: \"{window_text}\"\n"
            f"Segment type: {retention_role}\n\n"
            f"Rate each 0.0-1.0:\n"
            f"- semantic_fit: Does the visual match the narration meaning?\n"
            f"- tone_fit: Does the mood/energy match?\n"
            f"- motion_fit: Is the visual complexity appropriate?\n"
            f"- novelty_fit: Is this visually interesting, not generic?\n\n"
            f"Respond ONLY as JSON: "
            f'{{"semantic_fit": 0.0, "tone_fit": 0.0, "motion_fit": 0.0, "novelty_fit": 0.0}}'
        )

        for candidate in candidates:
            try:
                if not candidate.preview_url:
                    candidate.overall_score = candidate.embedding_similarity
                    continue

                # Download preview image
                with httpx.Client(timeout=15) as http:
                    img_resp = http.get(candidate.preview_url)
                    img_resp.raise_for_status()
                    img_data = base64.standard_b64encode(img_resp.content).decode("utf-8")

                # Score with available vision provider
                if has_openai:
                    response_text = self._score_with_openai_vision(img_data, scoring_prompt)
                else:
                    response_text = self._score_with_claude_vision(img_data, scoring_prompt)

                import json
                # Extract JSON from response
                if "{" in response_text:
                    json_str = response_text[response_text.index("{"):response_text.rindex("}") + 1]
                    scores = json.loads(json_str)
                    candidate.semantic_fit = scores.get("semantic_fit", 0.5)
                    candidate.tone_fit = scores.get("tone_fit", 0.5)
                    candidate.motion_fit = scores.get("motion_fit", 0.5)
                    candidate.novelty_fit = scores.get("novelty_fit", 0.5)
                    candidate.overall_score = (
                        candidate.semantic_fit * 0.4 +
                        candidate.tone_fit * 0.25 +
                        candidate.motion_fit * 0.2 +
                        candidate.novelty_fit * 0.15
                    )
                else:
                    candidate.overall_score = candidate.embedding_similarity

            except Exception as e:
                logger.warning(f"Multimodal scoring failed for {candidate.candidate_id}: {e}")
                candidate.overall_score = candidate.embedding_similarity

        candidates.sort(key=lambda c: c.overall_score, reverse=True)
        if candidates:
            logger.info(f"Pass B: best score {candidates[0].overall_score:.3f}")
        return candidates

    def _score_with_openai_vision(self, img_data_b64: str, prompt: str) -> str:
        """Score using OpenAI GPT-4o Vision."""
        import openai
        client = openai.OpenAI(api_key=self.openai_api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=200,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{img_data_b64}"},
                    },
                    {"type": "text", "text": prompt},
                ],
            }],
        )
        return response.choices[0].message.content or ""

    def _score_with_claude_vision(self, img_data_b64: str, prompt: str) -> str:
        """Score using Claude Vision."""
        import anthropic
        client = anthropic.Anthropic(api_key=self.anthropic_api_key)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=200,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {"type": "base64", "media_type": "image/jpeg", "data": img_data_b64},
                    },
                    {"type": "text", "text": prompt},
                ],
            }],
        )
        return response.content[0].text

    # ─── Download ─────────────────────────────────────────────────────────

    def download_clip(self, candidate: BrollCandidate) -> str:
        """Download the selected B-roll clip to local storage."""
        if not candidate.download_url:
            raise ValueError(f"No download URL for {candidate.candidate_id}")

        filename = f"{candidate.candidate_id}.mp4"
        local_path = os.path.join(self.download_dir, filename)

        if os.path.exists(local_path):
            logger.debug(f"Already downloaded: {local_path}")
            candidate.local_path = local_path
            return local_path

        logger.info(f"Downloading B-roll: {candidate.candidate_id}")
        with httpx.Client(timeout=60, follow_redirects=True) as client:
            with client.stream("GET", candidate.download_url) as resp:
                resp.raise_for_status()
                with open(local_path, "wb") as f:
                    for chunk in resp.iter_bytes(chunk_size=8192):
                        f.write(chunk)

        candidate.local_path = local_path
        logger.info(f"Downloaded: {local_path}")
        return local_path

    # ─── Full Pipeline for One Window ─────────────────────────────────────

    def source_for_window(
        self,
        window: TimelineWindow,
        top_n_pass_a: int = 5,
    ) -> Optional[BrollCandidate]:
        """
        Full B-roll sourcing pipeline for a single timeline window.
        Returns the best candidate or None if nothing suitable found.
        """
        if not window.broll_search_intent:
            return None

        # Search
        candidates = self.search_candidates(window.broll_search_intent)
        if not candidates:
            logger.warning(f"No B-roll candidates for window {window.window_id}")
            return None

        # Pass A: embedding scoring
        candidates = self.score_pass_a(
            candidates, window.broll_search_intent, top_n=top_n_pass_a
        )

        # Pass B: multimodal scoring
        candidates = self.score_pass_b(
            candidates, window.transcript_text, window.retention_role.value
        )

        if not candidates:
            return None

        # Select best and download
        best = candidates[0]
        best.selected = True
        self.download_clip(best)

        logger.info(
            f"Selected B-roll for {window.window_id}: "
            f"{best.candidate_id} (score={best.overall_score:.3f})"
        )
        return best


# ─── CLI Test ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import json

    sourcer = BrollSourcer()
    intent = BrollSearchIntent(
        literal="technology office workspace",
        metaphor="connected digital network",
        contextual="modern business software interface",
    )
    candidates = sourcer.search_candidates(intent)
    candidates = sourcer.score_pass_a(candidates, intent, top_n=3)
    print(json.dumps([c.to_dict() for c in candidates], indent=2))
