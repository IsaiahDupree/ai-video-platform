"""
Music Matching Service (MUSIC-002, MUSIC-003)
=============================================
Match background music to video content based on analysis.

Features:
- Analyze video content (mood, pacing, energy)
- Match music from library based on compatibility
- Suggest alternative tracks
- Score tracks based on multiple factors

Usage:
    from services.music_matcher import MusicMatcher

    matcher = MusicMatcher()

    # Match music to video
    matches = await matcher.match_music_to_video(
        video_id=video_id,
        video_duration=45.0,
        video_mood="energetic",
        video_pacing="fast"
    )

    # Get suggestions for a specific track
    alternatives = await matcher.suggest_alternatives(
        current_track_id=track_id,
        limit=5
    )
"""

import asyncio
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID

from loguru import logger
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from database.connection import async_session_maker
from database.models import MusicTrack


class MusicMatcher:
    """
    Music Matching Service

    Intelligently matches background music to video content
    based on mood, energy, tempo, and other factors.
    """

    def __init__(self):
        """Initialize music matcher"""
        self.settings = get_settings()
        self.session_maker = async_session_maker

    async def match_music_to_video(
        self,
        workspace_id: UUID,
        video_duration: float,
        video_mood: Optional[str] = None,
        video_energy: Optional[float] = None,
        video_pacing: Optional[str] = None,
        content_type: Optional[str] = None,
        genre_preference: Optional[str] = None,
        exclude_tracks: Optional[List[UUID]] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Match music tracks to video content (MUSIC-002)

        Analyzes video characteristics and returns ranked music matches
        from the library.

        Args:
            workspace_id: Workspace ID
            video_duration: Video duration in seconds
            video_mood: Video mood (energetic, calm, dramatic, etc.)
            video_energy: Video energy level (0.0-1.0)
            video_pacing: Video pacing (slow, medium, fast)
            content_type: Content type (shorts, reels, explainer, etc.)
            genre_preference: Preferred music genre
            exclude_tracks: Track IDs to exclude
            limit: Max tracks to return

        Returns:
            List of matched tracks with compatibility scores
        """
        logger.info(f"🎵 Matching music for video: mood={video_mood}, energy={video_energy}, pacing={video_pacing}")

        # Build query filters
        filters = [MusicTrack.workspace_id == workspace_id]

        # Filter by mood if specified
        if video_mood:
            mood_filters = or_(
                MusicTrack.mood == video_mood,
                MusicTrack.moods.contains([video_mood])
            )
            filters.append(mood_filters)

        # Filter by content type if specified
        if content_type:
            filters.append(
                or_(
                    MusicTrack.suitable_for_content_types.contains([content_type]),
                    MusicTrack.suitable_for_content_types == None
                )
            )

        # Filter by genre if specified
        if genre_preference:
            filters.append(MusicTrack.genre == genre_preference)

        # Filter by video pacing
        if video_pacing:
            pacing_filter = self._build_pacing_filter(video_pacing)
            if pacing_filter is not None:
                filters.append(pacing_filter)

        # Exclude specific tracks
        if exclude_tracks:
            filters.append(~MusicTrack.id.in_(exclude_tracks))

        # Query tracks
        async with self.session_maker() as session:
            query = select(MusicTrack).where(and_(*filters))
            result = await session.execute(query)
            tracks = result.scalars().all()

        # Score and rank tracks
        scored_tracks = []
        for track in tracks:
            score = self._calculate_compatibility_score(
                track=track,
                video_duration=video_duration,
                video_mood=video_mood,
                video_energy=video_energy,
                video_pacing=video_pacing,
                content_type=content_type
            )

            scored_tracks.append({
                "track_id": str(track.id),
                "title": track.title,
                "artist": track.artist,
                "duration_seconds": track.duration_seconds,
                "mood": track.mood,
                "genre": track.genre,
                "energy_level": track.energy_level,
                "tempo_bpm": track.tempo_bpm,
                "file_path": track.file_path,
                "compatibility_score": score,
                "score_breakdown": self._get_score_breakdown(
                    track, video_duration, video_mood, video_energy, video_pacing
                )
            })

        # Sort by score descending
        scored_tracks.sort(key=lambda x: x["compatibility_score"], reverse=True)

        logger.success(f"✓ Found {len(scored_tracks)} matching tracks")

        return scored_tracks[:limit]

    async def suggest_alternatives(
        self,
        workspace_id: UUID,
        current_track_id: UUID,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Suggest alternative tracks similar to current track (MUSIC-003)

        Finds tracks with similar characteristics to the current track.

        Args:
            workspace_id: Workspace ID
            current_track_id: Current track ID
            limit: Max alternatives to return

        Returns:
            List of alternative tracks with similarity scores

        Raises:
            ValueError: If current track not found
        """
        logger.info(f"🎵 Finding alternatives for track: {current_track_id}")

        # Get current track
        async with self.session_maker() as session:
            current_track = await session.get(MusicTrack, current_track_id)
            if not current_track:
                raise ValueError(f"Track not found: {current_track_id}")

        # Match similar tracks
        matches = await self.match_music_to_video(
            workspace_id=workspace_id,
            video_duration=current_track.duration_seconds,
            video_mood=current_track.mood,
            video_energy=current_track.energy_level,
            video_pacing=self._infer_pacing_from_tempo(current_track.tempo_bpm),
            genre_preference=current_track.genre,
            exclude_tracks=[current_track_id],
            limit=limit
        )

        logger.success(f"✓ Found {len(matches)} alternative tracks")

        return matches

    async def analyze_video_for_music(
        self,
        video_path: str,
        use_ai: bool = True
    ) -> Dict[str, Any]:
        """
        Analyze video to determine music requirements

        Uses AI (if enabled) to analyze video content and determine
        appropriate music characteristics.

        Args:
            video_path: Path to video file
            use_ai: Use AI analysis (requires OpenAI API)

        Returns:
            Dict with video analysis (mood, energy, pacing, etc.)
        """
        logger.info(f"🎬 Analyzing video for music matching: {video_path}")

        # Basic analysis from video properties
        analysis = {
            "duration": 0.0,
            "mood": "neutral",
            "energy": 0.5,
            "pacing": "medium",
            "content_type": "general"
        }

        # TODO: Implement actual video analysis
        # - Extract video duration from file
        # - Analyze visual content (motion, colors, cuts)
        # - Use OpenAI Vision API if use_ai=True
        # - Detect pacing from cut frequency

        logger.warning("Video analysis not yet implemented - using defaults")

        return analysis

    def _calculate_compatibility_score(
        self,
        track: MusicTrack,
        video_duration: float,
        video_mood: Optional[str],
        video_energy: Optional[float],
        video_pacing: Optional[str],
        content_type: Optional[str]
    ) -> float:
        """
        Calculate compatibility score between track and video

        Scoring factors:
        - Mood match: 30%
        - Energy match: 25%
        - Duration match: 20%
        - Pacing/tempo match: 15%
        - Content type match: 10%

        Returns:
            Score from 0.0 to 1.0
        """
        score = 0.0
        weights = {
            "mood": 0.30,
            "energy": 0.25,
            "duration": 0.20,
            "pacing": 0.15,
            "content_type": 0.10
        }

        # Mood match
        if video_mood:
            mood_score = self._score_mood_match(track, video_mood)
            score += mood_score * weights["mood"]
        else:
            score += 0.5 * weights["mood"]  # Neutral if no mood specified

        # Energy match
        if video_energy is not None and track.energy_level is not None:
            energy_diff = abs(video_energy - track.energy_level)
            energy_score = max(0, 1.0 - energy_diff)
            score += energy_score * weights["energy"]
        else:
            score += 0.5 * weights["energy"]

        # Duration match (prefer tracks close to video duration)
        if track.duration_seconds:
            duration_ratio = track.duration_seconds / video_duration
            if 0.8 <= duration_ratio <= 1.5:
                duration_score = 1.0
            elif 0.5 <= duration_ratio <= 2.0:
                duration_score = 0.7
            else:
                duration_score = 0.3
            score += duration_score * weights["duration"]
        else:
            score += 0.5 * weights["duration"]

        # Pacing/tempo match
        if video_pacing and track.tempo_bpm:
            pacing_score = self._score_pacing_match(track.tempo_bpm, video_pacing)
            score += pacing_score * weights["pacing"]
        else:
            score += 0.5 * weights["pacing"]

        # Content type match
        if content_type and track.suitable_for_content_types:
            if content_type in track.suitable_for_content_types:
                content_score = 1.0
            else:
                content_score = 0.5
            score += content_score * weights["content_type"]
        else:
            score += 0.5 * weights["content_type"]

        return round(score, 3)

    def _score_mood_match(self, track: MusicTrack, video_mood: str) -> float:
        """Score how well track mood matches video mood"""
        # Exact match
        if track.mood == video_mood:
            return 1.0

        # Check moods list
        if track.moods and video_mood in track.moods:
            return 0.9

        # Compatible moods
        mood_compatibility = {
            "energetic": ["upbeat", "exciting", "happy", "intense"],
            "calm": ["relaxing", "peaceful", "ambient", "serene"],
            "dramatic": ["intense", "epic", "suspenseful", "dark"],
            "happy": ["upbeat", "energetic", "cheerful", "positive"],
            "sad": ["melancholic", "emotional", "somber", "nostalgic"],
            "mysterious": ["dark", "suspenseful", "ambient", "eerie"]
        }

        compatible_moods = mood_compatibility.get(video_mood, [])
        if track.mood in compatible_moods:
            return 0.7

        return 0.3

    def _score_pacing_match(self, tempo_bpm: float, video_pacing: str) -> float:
        """Score tempo match with video pacing"""
        pacing_tempos = {
            "slow": (60, 90),
            "medium": (90, 130),
            "fast": (130, 180),
            "very_fast": (180, 999)
        }

        target_range = pacing_tempos.get(video_pacing, (90, 130))
        min_tempo, max_tempo = target_range

        if min_tempo <= tempo_bpm <= max_tempo:
            return 1.0
        elif min_tempo - 20 <= tempo_bpm <= max_tempo + 20:
            return 0.7
        else:
            return 0.4

    def _build_pacing_filter(self, video_pacing: str):
        """Build SQLAlchemy filter for pacing"""
        pacing_tempos = {
            "slow": (60, 90),
            "medium": (90, 130),
            "fast": (130, 180),
            "very_fast": (180, 999)
        }

        tempo_range = pacing_tempos.get(video_pacing)
        if not tempo_range:
            return None

        min_tempo, max_tempo = tempo_range
        return and_(
            MusicTrack.tempo_bpm >= min_tempo - 20,
            MusicTrack.tempo_bpm <= max_tempo + 20
        )

    def _infer_pacing_from_tempo(self, tempo_bpm: Optional[float]) -> Optional[str]:
        """Infer video pacing from tempo"""
        if not tempo_bpm:
            return None

        if tempo_bpm < 90:
            return "slow"
        elif tempo_bpm < 130:
            return "medium"
        elif tempo_bpm < 180:
            return "fast"
        else:
            return "very_fast"

    def _get_score_breakdown(
        self,
        track: MusicTrack,
        video_duration: float,
        video_mood: Optional[str],
        video_energy: Optional[float],
        video_pacing: Optional[str]
    ) -> Dict[str, float]:
        """Get detailed score breakdown for transparency"""
        breakdown = {}

        if video_mood:
            breakdown["mood_score"] = self._score_mood_match(track, video_mood)

        if video_energy is not None and track.energy_level is not None:
            energy_diff = abs(video_energy - track.energy_level)
            breakdown["energy_score"] = max(0, 1.0 - energy_diff)

        if track.duration_seconds:
            duration_ratio = track.duration_seconds / video_duration
            if 0.8 <= duration_ratio <= 1.5:
                breakdown["duration_score"] = 1.0
            elif 0.5 <= duration_ratio <= 2.0:
                breakdown["duration_score"] = 0.7
            else:
                breakdown["duration_score"] = 0.3

        if video_pacing and track.tempo_bpm:
            breakdown["pacing_score"] = self._score_pacing_match(track.tempo_bpm, video_pacing)

        return breakdown


# Singleton instance
_music_matcher: Optional[MusicMatcher] = None


def get_music_matcher() -> MusicMatcher:
    """Get singleton music matcher instance"""
    global _music_matcher
    if _music_matcher is None:
        _music_matcher = MusicMatcher()
    return _music_matcher
