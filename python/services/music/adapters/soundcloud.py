"""
SoundCloud Adapter
==================
Adapter for SoundCloud via RapidAPI.
"""

import logging
import os
import requests
from pathlib import Path
from typing import Dict, Any, List, Optional

from .base import MusicAdapter
from services.music.models import MusicSearchCriteria, MusicResponse

logger = logging.getLogger(__name__)


class SoundCloudAdapter(MusicAdapter):
    """
    Adapter for SoundCloud via RapidAPI.
    
    Uses RapidAPI to search and download SoundCloud tracks.
    """
    
    def __init__(self, rapidapi_key: Optional[str] = None):
        """
        Initialize SoundCloud adapter.
        
        Args:
            rapidapi_key: RapidAPI key (default: RAPIDAPI_KEY env var)
        """
        self.rapidapi_key = rapidapi_key or os.getenv("RAPIDAPI_KEY")
        # Use the actual SoundCloud RapidAPI host from docs
        self.rapidapi_host = "soundcloud-api3.p.rapidapi.com"
        self.base_url = f"https://{self.rapidapi_host}"
        
        if not self.rapidapi_key:
            logger.warning("RAPIDAPI_KEY not set - SoundCloud adapter will not work")
    
    def get_source_name(self) -> str:
        return "soundcloud"
    
    def supports_search(self) -> bool:
        return True
    
    async def search_music(
        self,
        criteria: MusicSearchCriteria,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search SoundCloud via RapidAPI.
        
        Args:
            criteria: Search criteria
            limit: Maximum results
        """
        if not self.rapidapi_key:
            logger.error("RAPIDAPI_KEY not configured")
            return []
        
        # Build search query
        query_parts = []
        if criteria.search_query:
            query_parts.append(criteria.search_query)
        if criteria.genre:
            query_parts.append(criteria.genre)
        if criteria.mood:
            query_parts.append(criteria.mood)
        
        query = " ".join(query_parts) if query_parts else "trending"
        
        # Add trending filter if requested
        if criteria.trending:
            query += " trending"
        
        try:
            headers = {
                "X-RapidAPI-Key": self.rapidapi_key,
                "X-RapidAPI-Host": self.rapidapi_host
            }
            
            # Search endpoint (example - adjust based on actual RapidAPI endpoint)
            url = f"{self.base_url}/search"
            params = {
                "q": query,
                "limit": limit
            }
            
            response = requests.get(url, headers=headers, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            # Parse results (adjust based on actual API response format)
            results = []
            tracks = data.get("tracks", []) or data.get("results", [])
            
            for track in tracks[:limit]:
                # Filter by criteria
                if self._matches_criteria(track, criteria):
                    results.append({
                        "track_id": str(track.get("id", track.get("track_id"))),
                        "title": track.get("title", "Unknown"),
                        "artist": track.get("artist", track.get("user", {}).get("username", "Unknown")),
                        "duration": track.get("duration", 0) / 1000.0,  # Convert ms to seconds
                        "genre": track.get("genre", criteria.genre),
                        "mood": criteria.mood,
                        "source": "soundcloud",
                        "url": track.get("permalink_url", track.get("url")),
                        "playback_count": track.get("playback_count", 0)
                    })
            
            return results
            
        except Exception as e:
            logger.error(f"SoundCloud search failed: {e}", exc_info=True)
            return []
    
    async def get_music(
        self,
        track_id: str,
        output_path: Optional[Path] = None
    ) -> MusicResponse:
        """
        Download SoundCloud track via RapidAPI.
        
        Args:
            track_id: SoundCloud track ID or URL
            output_path: Where to save the file
        """
        if not self.rapidapi_key:
            return MusicResponse(
                job_id=track_id,
                success=False,
                error="RAPIDAPI_KEY not configured"
            )
        
        if output_path is None:
            output_dir = Path("data/music/soundcloud")
            output_dir.mkdir(parents=True, exist_ok=True)
            output_path = output_dir / f"{track_id}.mp3"
        else:
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            headers = {
                "X-RapidAPI-Key": self.rapidapi_key,
                "X-RapidAPI-Host": self.rapidapi_host
            }
            
            # Download endpoint (example - adjust based on actual RapidAPI endpoint)
            url = f"{self.base_url}/download"
            params = {
                "track_id": track_id
            }
            
            response = requests.get(url, headers=headers, params=params, stream=True, timeout=60)
            response.raise_for_status()
            
            # Save file
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            # Get metadata
            metadata = await self._get_track_metadata(track_id)
            
            return MusicResponse(
                job_id=track_id,
                success=True,
                music_path=str(output_path),
                duration_seconds=metadata.get("duration", 0.0),
                genre=metadata.get("genre"),
                mood=metadata.get("mood"),
                source="soundcloud",
                metadata=metadata
            )
            
        except Exception as e:
            logger.error(f"SoundCloud download failed: {e}", exc_info=True)
            return MusicResponse(
                job_id=track_id,
                success=False,
                error=str(e)
            )
    
    async def _get_track_metadata(self, track_id: str) -> Dict[str, Any]:
        """Get track metadata from RapidAPI."""
        try:
            headers = {
                "X-RapidAPI-Key": self.rapidapi_key,
                "X-RapidAPI-Host": self.rapidapi_host
            }
            
            url = f"{self.base_url}/track/{track_id}"
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            return response.json()
        except Exception as e:
            logger.warning(f"Failed to get track metadata: {e}")
            return {}
    
    def _matches_criteria(self, track: Dict[str, Any], criteria: MusicSearchCriteria) -> bool:
        """Check if track matches criteria."""
        if criteria.genre and track.get("genre") != criteria.genre:
            return False
        if criteria.bpm_min and track.get("bpm", 0) < criteria.bpm_min:
            return False
        if criteria.bpm_max and track.get("bpm", 999) > criteria.bpm_max:
            return False
        if criteria.duration_min and track.get("duration", 0) < criteria.duration_min:
            return False
        if criteria.duration_max and track.get("duration", 999999) > criteria.duration_max:
            return False
        return True

