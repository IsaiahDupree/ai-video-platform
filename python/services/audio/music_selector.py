"""
Music Selector Service
======================
Selects optimal background music for video clips based on content analysis.

Integrated from custom-video-tools music-system.

Features:
- Analyzes video mood and energy level
- Matches music from library based on compatibility
- Enforces max clip duration (default 5 minutes)
- Supports AI-powered mood detection
- Caches music analysis for performance

Usage:
    from services.music_selector import MusicSelector
    
    selector = MusicSelector()
    match = await selector.select_music_for_clip(clip_path, duration=30)
"""

import json
import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4

logger = logging.getLogger(__name__)

# Maximum clip duration for music selection (5 minutes)
MAX_CLIP_DURATION_SECONDS = 300


@dataclass
class MusicTrack:
    """Represents a music track with analysis data."""
    id: str
    file_path: str
    file_name: str
    duration: float = 0.0
    tempo: float = 120.0
    energy_level: float = 0.5
    mood: str = "neutral"
    genre: str = "general"
    moods: List[str] = field(default_factory=list)
    attributes: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "file_path": self.file_path,
            "file_name": self.file_name,
            "duration": self.duration,
            "tempo": self.tempo,
            "energy_level": self.energy_level,
            "mood": self.mood,
            "genre": self.genre,
            "moods": self.moods,
            "attributes": self.attributes
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MusicTrack":
        return cls(
            id=data.get("id", str(uuid4())),
            file_path=data.get("file_path", ""),
            file_name=data.get("file_name", Path(data.get("file_path", "")).name),
            duration=float(data.get("duration", 0)),
            tempo=float(data.get("tempo", data.get("tempo_bpm", 120))),
            energy_level=float(data.get("energy_level", 0.5)),
            mood=data.get("mood", data.get("detected_mood", "neutral")),
            genre=data.get("genre", data.get("predicted_genre", "general")),
            moods=data.get("moods", []),
            attributes=data.get("attributes", [])
        )


@dataclass
class MusicMatch:
    """Result of music matching for a clip."""
    track: MusicTrack
    compatibility_score: float
    reasoning: str
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "track": self.track.to_dict(),
            "compatibility_score": self.compatibility_score,
            "reasoning": self.reasoning
        }


@dataclass
class ClipAnalysis:
    """Analysis of a video clip for music matching."""
    clip_id: str
    duration: float
    mood: str = "neutral"
    energy_level: float = 0.5
    content_type: str = "general"
    topics: List[str] = field(default_factory=list)
    transcript_summary: str = ""


class MusicSelector:
    """
    Selects optimal background music for video clips.
    
    Pipeline:
        1. Analyze clip content (mood, energy, topics)
        2. Load music library index
        3. Calculate compatibility scores
        4. Return ranked matches
    """
    
    def __init__(
        self,
        music_library_path: Optional[Path] = None,
        music_index_path: Optional[Path] = None,
        max_clip_duration: int = MAX_CLIP_DURATION_SECONDS,
        ai_provider: Optional[str] = None
    ):
        self.music_library_path = music_library_path or Path(
            os.getenv("MUSIC_LIBRARY_PATH", "./music")
        )
        self.music_index_path = music_index_path or Path(
            os.getenv("MUSIC_INDEX_PATH", "./music_index.json")
        )
        self.max_clip_duration = max_clip_duration
        self.ai_provider_name = ai_provider or os.getenv("AI_PROVIDER", "mock")
        self._music_library: List[MusicTrack] = []
        self._ai_provider = None
    
    def _get_ai_provider(self):
        """Get configured AI provider for mood analysis."""
        if self._ai_provider is None:
            try:
                from services.ai_providers import get_ai_provider
                self._ai_provider = get_ai_provider(self.ai_provider_name)
            except Exception as e:
                logger.warning(f"Could not load AI provider: {e}")
        return self._ai_provider
    
    def load_music_library(self, index_data: Optional[Dict] = None) -> List[MusicTrack]:
        """
        Load music library from index file or provided data.
        
        Args:
            index_data: Optional pre-loaded index data
        
        Returns:
            List of MusicTrack objects
        """
        if self._music_library:
            return self._music_library
        
        if index_data:
            tracks_data = index_data.get("tracks", [])
        elif self.music_index_path.exists():
            try:
                with open(self.music_index_path, 'r') as f:
                    data = json.load(f)
                    tracks_data = data.get("tracks", [])
            except Exception as e:
                logger.error(f"Failed to load music index: {e}")
                tracks_data = []
        else:
            # Use default demo tracks
            tracks_data = self._get_demo_tracks()
        
        self._music_library = [MusicTrack.from_dict(t) for t in tracks_data]
        logger.info(f"Loaded {len(self._music_library)} music tracks")
        
        return self._music_library
    
    def _get_demo_tracks(self) -> List[Dict]:
        """Get demo music tracks for testing."""
        return [
            {
                "id": "corporate-tech",
                "file_path": "/music/corporate-tech.mp3",
                "genre": "corporate",
                "moods": ["professional", "upbeat", "confident"],
                "energy_level": 0.7,
                "tempo": 120,
                "duration": 180,
                "attributes": ["no vocals", "business", "modern"]
            },
            {
                "id": "lofi-chill",
                "file_path": "/music/lofi-chill.mp3",
                "genre": "lofi",
                "moods": ["relaxed", "thoughtful", "chill"],
                "energy_level": 0.3,
                "tempo": 85,
                "duration": 240,
                "attributes": ["beats", "relaxing", "focus"]
            },
            {
                "id": "energetic-pop",
                "file_path": "/music/energetic-pop.mp3",
                "genre": "pop",
                "moods": ["happy", "energetic", "exciting"],
                "energy_level": 0.85,
                "tempo": 128,
                "duration": 200,
                "attributes": ["upbeat", "catchy", "modern"]
            },
            {
                "id": "ambient-calm",
                "file_path": "/music/ambient-calm.mp3",
                "genre": "ambient",
                "moods": ["peaceful", "serene", "meditative"],
                "energy_level": 0.2,
                "tempo": 70,
                "duration": 300,
                "attributes": ["atmospheric", "calm", "background"]
            },
            {
                "id": "hip-hop-flow",
                "file_path": "/music/hip-hop-flow.mp3",
                "genre": "hiphop",
                "moods": ["confident", "urban", "powerful"],
                "energy_level": 0.7,
                "tempo": 95,
                "duration": 180,
                "attributes": ["beats", "rhythmic", "urban"]
            },
            {
                "id": "electronic-dance",
                "file_path": "/music/electronic-dance.mp3",
                "genre": "electronic",
                "moods": ["energetic", "exciting", "dynamic"],
                "energy_level": 0.9,
                "tempo": 140,
                "duration": 210,
                "attributes": ["electronic", "festival", "high-energy"]
            },
            {
                "id": "inspirational-cinematic",
                "file_path": "/music/inspirational.mp3",
                "genre": "cinematic",
                "moods": ["inspiring", "emotional", "uplifting"],
                "energy_level": 0.6,
                "tempo": 100,
                "duration": 250,
                "attributes": ["orchestral", "dramatic", "emotional"]
            }
        ]
    
    async def analyze_clip(
        self,
        clip_path: Optional[str] = None,
        duration: float = 0,
        transcript: str = "",
        topics: Optional[List[str]] = None
    ) -> ClipAnalysis:
        """
        Analyze a video clip to determine mood and energy.
        
        Args:
            clip_path: Path to video clip (optional)
            duration: Clip duration in seconds
            transcript: Clip transcript text
            topics: Pre-identified topics
        
        Returns:
            ClipAnalysis with mood and energy data
        """
        clip_id = str(uuid4())
        
        # Enforce max duration
        if duration > self.max_clip_duration:
            raise ValueError(
                f"Clip duration {duration}s exceeds maximum {self.max_clip_duration}s (5 minutes)"
            )
        
        # Analyze transcript for mood if available
        mood = "neutral"
        energy_level = 0.5
        content_type = "general"
        
        if transcript:
            # Use AI provider if available
            provider = self._get_ai_provider()
            if provider:
                try:
                    mood, energy_level = await self._analyze_mood_with_ai(transcript)
                except Exception as e:
                    logger.warning(f"AI mood analysis failed: {e}")
                    mood, energy_level = self._analyze_mood_heuristic(transcript)
            else:
                mood, energy_level = self._analyze_mood_heuristic(transcript)
        
        # Determine content type from topics
        if topics:
            content_type = self._determine_content_type(topics)
        
        return ClipAnalysis(
            clip_id=clip_id,
            duration=duration,
            mood=mood,
            energy_level=energy_level,
            content_type=content_type,
            topics=topics or [],
            transcript_summary=transcript[:200] if transcript else ""
        )
    
    async def _analyze_mood_with_ai(self, transcript: str) -> Tuple[str, float]:
        """Analyze mood using AI provider."""
        provider = self._get_ai_provider()
        
        # Use the provider's analysis capability
        try:
            analysis = await provider.analyze_transcript(
                transcript=f"[00:00 - 00:30] {transcript}",
                min_duration=5,
                max_duration=60,
                max_segments=1
            )
            
            # Extract mood from analysis
            if analysis.segments:
                # Map relevance score to energy
                energy = analysis.segments[0].relevance_score
                
                # Determine mood from topics/summary
                summary = analysis.summary.lower()
                if any(w in summary for w in ["exciting", "energetic", "amazing"]):
                    mood = "energetic"
                elif any(w in summary for w in ["calm", "peaceful", "relaxing"]):
                    mood = "calm"
                elif any(w in summary for w in ["funny", "humor", "laugh"]):
                    mood = "happy"
                elif any(w in summary for w in ["serious", "important", "learn"]):
                    mood = "neutral"
                else:
                    mood = "neutral"
                
                return mood, energy
        except Exception as e:
            logger.warning(f"AI mood analysis error: {e}")
        
        return "neutral", 0.5
    
    def _analyze_mood_heuristic(self, transcript: str) -> Tuple[str, float]:
        """Analyze mood using heuristic word matching."""
        text = transcript.lower()
        
        # Mood keywords
        energetic_words = ["amazing", "incredible", "exciting", "awesome", "wow", "crazy", "insane"]
        calm_words = ["peaceful", "relaxing", "calm", "gentle", "quiet", "soft", "slow"]
        happy_words = ["happy", "joy", "fun", "laugh", "smile", "great", "love"]
        sad_words = ["sad", "unfortunately", "tragic", "sorry", "miss", "lost"]
        
        # Count matches
        energetic_count = sum(1 for w in energetic_words if w in text)
        calm_count = sum(1 for w in calm_words if w in text)
        happy_count = sum(1 for w in happy_words if w in text)
        sad_count = sum(1 for w in sad_words if w in text)
        
        # Determine mood
        counts = {
            "energetic": energetic_count,
            "calm": calm_count,
            "happy": happy_count,
            "sad": sad_count
        }
        
        max_mood = max(counts, key=counts.get)
        if counts[max_mood] == 0:
            mood = "neutral"
        else:
            mood = max_mood
        
        # Calculate energy level
        energy_boost = (energetic_count + happy_count) * 0.1
        energy_reduce = (calm_count + sad_count) * 0.1
        energy = max(0.1, min(0.9, 0.5 + energy_boost - energy_reduce))
        
        return mood, energy
    
    def _determine_content_type(self, topics: List[str]) -> str:
        """Determine content type from topics."""
        topic_str = " ".join(topics).lower()
        
        if any(t in topic_str for t in ["business", "corporate", "professional"]):
            return "corporate"
        elif any(t in topic_str for t in ["tutorial", "how to", "learn", "education"]):
            return "educational"
        elif any(t in topic_str for t in ["vlog", "lifestyle", "day in"]):
            return "lifestyle"
        elif any(t in topic_str for t in ["funny", "comedy", "humor"]):
            return "entertainment"
        elif any(t in topic_str for t in ["workout", "fitness", "gym"]):
            return "fitness"
        elif any(t in topic_str for t in ["cooking", "recipe", "food"]):
            return "cooking"
        else:
            return "general"
    
    async def select_music_for_clip(
        self,
        clip_path: Optional[str] = None,
        duration: float = 0,
        transcript: str = "",
        topics: Optional[List[str]] = None,
        top_n: int = 3
    ) -> List[MusicMatch]:
        """
        Select best matching music tracks for a video clip.
        
        Args:
            clip_path: Path to video clip
            duration: Clip duration in seconds
            transcript: Clip transcript
            topics: Content topics
            top_n: Number of matches to return
        
        Returns:
            List of MusicMatch objects sorted by compatibility
        """
        # Enforce max duration
        if duration > self.max_clip_duration:
            raise ValueError(
                f"Clip duration {duration}s exceeds maximum {self.max_clip_duration}s. "
                f"Clips must be under 5 minutes for music selection."
            )
        
        # Analyze clip
        analysis = await self.analyze_clip(
            clip_path=clip_path,
            duration=duration,
            transcript=transcript,
            topics=topics
        )
        
        # Load music library
        music_library = self.load_music_library()
        
        # Calculate compatibility for each track
        matches = []
        for track in music_library:
            score, reasoning = self._calculate_compatibility(analysis, track)
            
            if score > 0.3:  # Minimum threshold
                matches.append(MusicMatch(
                    track=track,
                    compatibility_score=score,
                    reasoning=reasoning
                ))
        
        # Sort by score and return top N
        matches.sort(key=lambda x: x.compatibility_score, reverse=True)
        return matches[:top_n]
    
    def _calculate_compatibility(
        self,
        analysis: ClipAnalysis,
        track: MusicTrack
    ) -> Tuple[float, str]:
        """
        Calculate compatibility score between clip and track.
        
        Returns:
            Tuple of (score, reasoning)
        """
        score = 0.0
        reasons = []
        
        # Mood matching (40% weight)
        if analysis.mood == track.mood:
            score += 0.4
            reasons.append(f"Mood match: {analysis.mood}")
        elif analysis.mood in track.moods:
            score += 0.3
            reasons.append(f"Mood compatible: {analysis.mood} in {track.moods}")
        elif self._moods_compatible(analysis.mood, track.mood):
            score += 0.2
            reasons.append(f"Moods compatible: {analysis.mood} ~ {track.mood}")
        
        # Energy level matching (30% weight)
        energy_diff = abs(analysis.energy_level - track.energy_level)
        energy_score = max(0, 1 - energy_diff) * 0.3
        score += energy_score
        if energy_score > 0.2:
            reasons.append(f"Energy match: clip={analysis.energy_level:.1f}, track={track.energy_level:.1f}")
        
        # Content type to genre matching (20% weight)
        genre_map = {
            "corporate": ["corporate", "ambient", "general"],
            "educational": ["ambient", "lofi", "general"],
            "lifestyle": ["pop", "lofi", "general"],
            "entertainment": ["pop", "electronic", "hiphop"],
            "fitness": ["electronic", "hiphop", "pop"],
            "cooking": ["lofi", "pop", "ambient"],
            "general": ["general", "pop", "ambient"]
        }
        
        preferred_genres = genre_map.get(analysis.content_type, ["general"])
        if track.genre in preferred_genres:
            score += 0.2
            reasons.append(f"Genre fits content: {track.genre} for {analysis.content_type}")
        
        # Duration check (10% bonus if track is long enough)
        if track.duration >= analysis.duration:
            score += 0.1
            reasons.append("Duration sufficient")
        
        reasoning = "; ".join(reasons) if reasons else "Baseline match"
        return min(score, 1.0), reasoning
    
    def _moods_compatible(self, mood1: str, mood2: str) -> bool:
        """Check if two moods are compatible."""
        compatible_pairs = [
            ("happy", "energetic"),
            ("calm", "peaceful"),
            ("neutral", "calm"),
            ("neutral", "happy"),
            ("energetic", "exciting"),
            ("confident", "powerful"),
            ("relaxed", "calm"),
            ("upbeat", "happy")
        ]
        
        return (
            (mood1, mood2) in compatible_pairs or 
            (mood2, mood1) in compatible_pairs
        )
    
    def get_library_stats(self) -> Dict[str, Any]:
        """Get statistics about the music library."""
        library = self.load_music_library()
        
        if not library:
            return {"tracks": 0, "genres": [], "moods": []}
        
        genres = set()
        moods = set()
        total_duration = 0
        
        for track in library:
            genres.add(track.genre)
            moods.add(track.mood)
            moods.update(track.moods)
            total_duration += track.duration
        
        return {
            "tracks": len(library),
            "genres": list(genres),
            "moods": list(moods),
            "total_duration_minutes": round(total_duration / 60, 1),
            "avg_tempo": sum(t.tempo for t in library) / len(library),
            "avg_energy": sum(t.energy_level for t in library) / len(library)
        }
