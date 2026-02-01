"""
Social Platform Adapter
=======================
Adapter for finding trending music from social platforms via RapidAPI.

Supports:
- TikTok trending sounds
- Instagram trending audio
- YouTube trending music
"""

import logging
import os
import requests
from pathlib import Path
from typing import Dict, Any, List, Optional

from .base import MusicAdapter
from services.music.models import MusicSearchCriteria, MusicResponse

logger = logging.getLogger(__name__)


class SocialPlatformAdapter(MusicAdapter):
    """
    Adapter for social platform music discovery via RapidAPI.
    
    Finds trending/compatible music from TikTok, Instagram, YouTube, etc.
    """
    
    def __init__(self, rapidapi_key: Optional[str] = None):
        """
        Initialize social platform adapter.
        
        Args:
            rapidapi_key: RapidAPI key (default: RAPIDAPI_KEY env var)
        """
        self.rapidapi_key = rapidapi_key or os.getenv("RAPIDAPI_KEY")
        
        # Platform-specific RapidAPI hosts (examples - adjust based on actual APIs)
        self.platform_hosts = {
            "tiktok": "tiktok-scraper.p.rapidapi.com",
            "instagram": "instagram-scraper.p.rapidapi.com",
            "youtube": "youtube-scraper.p.rapidapi.com",
        }
        
        if not self.rapidapi_key:
            logger.warning("RAPIDAPI_KEY not set - Social platform adapter will not work")
    
    def get_source_name(self) -> str:
        return "social_platform"
    
    def supports_search(self) -> bool:
        return True
    
    async def search_music(
        self,
        criteria: MusicSearchCriteria,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for trending music on social platforms.
        
        Args:
            criteria: Search criteria (platform, trending, etc.)
            limit: Maximum results
        """
        if not self.rapidapi_key:
            logger.error("RAPIDAPI_KEY not configured")
            return []
        
        platform = criteria.platform or "tiktok"
        host = self.platform_hosts.get(platform)
        
        if not host:
            logger.error(f"Unsupported platform: {platform}")
            return []
        
        try:
            headers = {
                "X-RapidAPI-Key": self.rapidapi_key,
                "X-RapidAPI-Host": host
            }
            
            # Build search query
            query = criteria.search_query or ""
            if criteria.trending:
                query = "trending" if not query else f"{query} trending"
            
            # Platform-specific endpoint (example - adjust based on actual API)
            url = f"https://{host}/trending/audio" if criteria.trending else f"https://{host}/search/audio"
            params = {
                "q": query,
                "limit": limit
            }
            
            response = requests.get(url, headers=headers, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            # Parse results (adjust based on actual API response format)
            results = []
            tracks = data.get("audio", []) or data.get("sounds", []) or data.get("results", [])
            
            for track in tracks[:limit]:
                # Filter by criteria
                if self._matches_criteria(track, criteria):
                    results.append({
                        "track_id": str(track.get("id", track.get("audio_id"))),
                        "title": track.get("title", track.get("name", "Unknown")),
                        "artist": track.get("artist", track.get("author", {}).get("name", "Unknown")),
                        "duration": track.get("duration", 0),
                        "genre": track.get("genre", criteria.genre),
                        "mood": criteria.mood,
                        "source": f"{platform}_trending",
                        "url": track.get("url", track.get("play_url")),
                        "play_count": track.get("play_count", track.get("usage_count", 0)),
                        "platform": platform
                    })
            
            return results
            
        except Exception as e:
            logger.error(f"Social platform search failed ({platform}): {e}", exc_info=True)
            return []
    
    async def get_music(
        self,
        track_id: str,
        output_path: Optional[Path] = None
    ) -> MusicResponse:
        """
        Download music from social platform via RapidAPI.
        
        Args:
            track_id: Track ID (may include platform prefix, e.g., "tiktok:123")
            output_path: Where to save the file
        """
        if not self.rapidapi_key:
            return MusicResponse(
                job_id=track_id,
                success=False,
                error="RAPIDAPI_KEY not configured"
            )
        
        # Parse platform from track_id if present
        platform = "tiktok"  # Default
        if ":" in track_id:
            platform, track_id = track_id.split(":", 1)
        
        host = self.platform_hosts.get(platform)
        if not host:
            return MusicResponse(
                job_id=track_id,
                success=False,
                error=f"Unsupported platform: {platform}"
            )
        
        if output_path is None:
            output_dir = Path(f"data/music/{platform}")
            output_dir.mkdir(parents=True, exist_ok=True)
            output_path = output_dir / f"{track_id}.mp3"
        else:
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            headers = {
                "X-RapidAPI-Key": self.rapidapi_key,
                "X-RapidAPI-Host": host
            }
            
            # Download endpoint (example - adjust based on actual API)
            url = f"https://{host}/audio/download"
            params = {
                "audio_id": track_id
            }
            
            response = requests.get(url, headers=headers, params=params, stream=True, timeout=60)
            response.raise_for_status()
            
            # Save file
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            return MusicResponse(
                job_id=track_id,
                success=True,
                music_path=str(output_path),
                source=f"{platform}_trending",
                metadata={"platform": platform}
            )
            
        except Exception as e:
            logger.error(f"Social platform download failed ({platform}): {e}", exc_info=True)
            return MusicResponse(
                job_id=track_id,
                success=False,
                error=str(e)
            )
    
    def _matches_criteria(self, track: Dict[str, Any], criteria: MusicSearchCriteria) -> bool:
        """Check if track matches criteria."""
        if criteria.platform and track.get("platform") != criteria.platform:
            return False
        if criteria.duration_min and track.get("duration", 0) < criteria.duration_min:
            return False
        if criteria.duration_max and track.get("duration", 999999) > criteria.duration_max:
            return False
        return True

