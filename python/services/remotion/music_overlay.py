"""
Music Overlay Service (MUSIC-004)
==================================
Handles music overlay for Remotion compositions with automatic volume ducking.

Features:
- Background music selection from library
- Automatic volume ducking when voiceover is active
- Mood-based music matching
- Fade in/out effects
- Loop handling for short tracks
"""

import logging
from typing import Dict, Any, Optional, List
from pathlib import Path
from dataclasses import dataclass
import json

from .models import AudioTrack, SourceType

logger = logging.getLogger(__name__)


@dataclass
class MusicOverlayConfig:
    """Configuration for music overlay."""
    music_track_id: Optional[str] = None  # ID from music library
    music_file_path: Optional[str] = None  # Direct path to music file
    volume: float = 0.3  # Background music volume (0.0-1.0)
    duck_volume: float = 0.1  # Ducked volume when voiceover is active
    fade_in_seconds: float = 1.0
    fade_out_seconds: float = 1.0
    start_offset: float = 0.0  # Start music at this point in the track
    loop: bool = True  # Loop if music is shorter than video
    mood: Optional[str] = None  # "upbeat", "chill", "dramatic", etc.


class MusicOverlayService:
    """
    Service for overlaying background music on Remotion compositions.

    Implements MUSIC-004: Music Overlay (Remotion)

    Usage:
        music_service = MusicOverlayService()

        # Add music to composition
        audio_tracks = music_service.add_music_overlay(
            video_duration=45.0,
            voiceover_track_id="audio_001",
            config=MusicOverlayConfig(
                music_track_id="upbeat_001",
                volume=0.3,
                duck_volume=0.1
            )
        )
    """

    def __init__(self, music_library_path: Optional[str] = None):
        """
        Initialize music overlay service.

        Args:
            music_library_path: Path to music library JSON file
        """
        self.music_library_path = music_library_path or "/Users/isaiahdupree/Documents/Software/MediaPoster/data/music_library.json"
        self.music_library = self._load_music_library()

    def _load_music_library(self) -> Dict[str, Any]:
        """Load music library from JSON file."""
        try:
            library_path = Path(self.music_library_path)
            if library_path.exists():
                with open(library_path, 'r') as f:
                    return json.load(f)
            else:
                logger.warning(f"Music library not found at {library_path}")
                return {"tracks": []}
        except Exception as e:
            logger.error(f"Error loading music library: {e}")
            return {"tracks": []}

    def add_music_overlay(
        self,
        video_duration: float,
        voiceover_track_id: Optional[str] = None,
        config: Optional[MusicOverlayConfig] = None
    ) -> List[AudioTrack]:
        """
        Add background music overlay to composition.

        Args:
            video_duration: Total video duration in seconds
            voiceover_track_id: ID of voiceover audio track (for ducking)
            config: Music overlay configuration

        Returns:
            List of AudioTrack objects to add to composition

        Raises:
            ValueError: If music track not found or invalid config
        """
        if config is None:
            config = MusicOverlayConfig()

        # Validate configuration
        if not config.music_track_id and not config.music_file_path:
            raise ValueError("Either music_track_id or music_file_path must be provided")

        # Get music file path
        music_path = self._resolve_music_path(config)

        # Get music duration (if available from library)
        music_duration = self._get_music_duration(config)

        # Create audio track with ducking if voiceover is present
        audio_tracks = []

        # Main background music track
        ducking_config = None
        if voiceover_track_id:
            ducking_config = {
                "duck_under": voiceover_track_id,
                "duck_db": self._volume_to_db(config.duck_volume),
                "fade_duration": 0.2  # Quick fade for natural ducking
            }

        music_track = AudioTrack(
            id=f"music_{config.music_track_id or 'custom'}",
            source=music_path,
            source_type=SourceType.LOCAL,
            start=config.start_offset,
            volume=config.volume,
            ducking=ducking_config
        )

        audio_tracks.append(music_track)

        logger.info(
            f"Music overlay added | Track: {config.music_track_id or 'custom'} | "
            f"Volume: {config.volume} | Duck: {config.duck_volume} | "
            f"Duration: {video_duration}s"
        )

        return audio_tracks

    def _resolve_music_path(self, config: MusicOverlayConfig) -> str:
        """
        Resolve music file path from config.

        Args:
            config: Music overlay configuration

        Returns:
            Full path to music file

        Raises:
            ValueError: If music track not found
        """
        # Use direct path if provided
        if config.music_file_path:
            music_path = Path(config.music_file_path)
            if not music_path.exists():
                raise ValueError(f"Music file not found: {config.music_file_path}")
            return str(music_path)

        # Look up in music library
        if config.music_track_id:
            for track in self.music_library.get("tracks", []):
                if track.get("id") == config.music_track_id:
                    track_path = Path(track.get("file_path", ""))
                    if not track_path.exists():
                        raise ValueError(f"Music track file not found: {track_path}")
                    return str(track_path)

            raise ValueError(f"Music track not found in library: {config.music_track_id}")

        raise ValueError("No music path or track ID provided")

    def _get_music_duration(self, config: MusicOverlayConfig) -> Optional[float]:
        """Get music track duration from library metadata."""
        if config.music_track_id:
            for track in self.music_library.get("tracks", []):
                if track.get("id") == config.music_track_id:
                    return track.get("duration_seconds")
        return None

    def _volume_to_db(self, volume: float) -> float:
        """
        Convert linear volume (0.0-1.0) to decibels.

        Args:
            volume: Linear volume (0.0-1.0)

        Returns:
            Volume in decibels
        """
        import math

        if volume <= 0:
            return -60.0  # Effectively silent

        # Convert to dB: 20 * log10(volume)
        db = 20 * math.log10(volume)
        return max(-60.0, db)  # Clamp to -60dB minimum

    def suggest_music_by_mood(self, mood: str, duration: float) -> List[Dict[str, Any]]:
        """
        Suggest music tracks by mood.

        Args:
            mood: Desired mood ("upbeat", "chill", "dramatic", "inspiring", etc.)
            duration: Desired duration in seconds

        Returns:
            List of suggested music tracks with metadata
        """
        suggestions = []

        for track in self.music_library.get("tracks", []):
            track_mood = track.get("mood", "").lower()
            track_tags = [tag.lower() for tag in track.get("tags", [])]

            # Match mood
            if mood.lower() in track_mood or mood.lower() in track_tags:
                # Calculate fit score based on duration
                track_duration = track.get("duration_seconds", 0)
                duration_fit = 1.0
                if track_duration > 0:
                    duration_fit = min(1.0, track_duration / duration)

                suggestions.append({
                    "track_id": track.get("id"),
                    "name": track.get("name"),
                    "mood": track.get("mood"),
                    "duration": track_duration,
                    "fit_score": duration_fit,
                    "file_path": track.get("file_path")
                })

        # Sort by fit score
        suggestions.sort(key=lambda x: x["fit_score"], reverse=True)

        return suggestions

    def create_music_layers(
        self,
        video_duration: float,
        voiceover_segments: Optional[List[Dict[str, float]]] = None,
        config: Optional[MusicOverlayConfig] = None
    ) -> List[Dict[str, Any]]:
        """
        Create music layers with smart ducking based on voiceover segments.

        This is an advanced mode that creates multiple music layers with
        precise ducking based on when the voiceover is active.

        Args:
            video_duration: Total video duration in seconds
            voiceover_segments: List of {"start": float, "end": float} for voiceover
            config: Music overlay configuration

        Returns:
            List of layer dictionaries ready for Remotion timeline
        """
        if config is None:
            config = MusicOverlayConfig()

        music_path = self._resolve_music_path(config)

        # If no voiceover segments, create single full-length music layer
        if not voiceover_segments:
            return [{
                "id": "music_full",
                "type": "audio",
                "source": music_path,
                "source_type": "local",
                "start": 0.0,
                "end": video_duration,
                "volume": config.volume,
                "fade_in": config.fade_in_seconds,
                "fade_out": config.fade_out_seconds
            }]

        # Create music layers with ducking around voiceover segments
        layers = []
        current_time = 0.0

        for i, segment in enumerate(voiceover_segments):
            segment_start = segment.get("start", 0.0)
            segment_end = segment.get("end", 0.0)

            # Music layer before voiceover (full volume)
            if current_time < segment_start:
                layers.append({
                    "id": f"music_{i}_before",
                    "type": "audio",
                    "source": music_path,
                    "source_type": "local",
                    "start": current_time,
                    "end": segment_start,
                    "volume": config.volume
                })

            # Music layer during voiceover (ducked volume)
            layers.append({
                "id": f"music_{i}_ducked",
                "type": "audio",
                "source": music_path,
                "source_type": "local",
                "start": segment_start,
                "end": segment_end,
                "volume": config.duck_volume
            })

            current_time = segment_end

        # Final music layer after last voiceover (full volume)
        if current_time < video_duration:
            layers.append({
                "id": "music_final",
                "type": "audio",
                "source": music_path,
                "source_type": "local",
                "start": current_time,
                "end": video_duration,
                "volume": config.volume
            })

        logger.info(f"Created {len(layers)} music layers with smart ducking")

        return layers
