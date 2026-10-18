"""
Audio Service
Fetches, stores, and serves Instagram audio/music files via RapidAPI.
"""
import os
import hashlib
import httpx
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime
from loguru import logger
from pydantic import BaseModel


# Audio storage directory
AUDIO_STORAGE_DIR = Path("/tmp/mediaposter/audio")
AUDIO_STORAGE_DIR.mkdir(parents=True, exist_ok=True)


class AudioMetadata(BaseModel):
    """Audio file metadata"""
    audio_id: str
    title: str
    artist: str
    duration_ms: Optional[int] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    audio_url: Optional[str] = None
    cover_url: Optional[str] = None
    source: str = "instagram"
    downloaded_at: Optional[str] = None


class AudioService:
    """
    Service for fetching and storing Instagram audio files.
    Uses Instagram Scraper Stable API (primary) with fallback to looter2.
    """
    
    def __init__(self):
        # Strip any newlines from API key (fixes duplicate .env entries issue)
        raw_key = os.getenv("RAPIDAPI_KEY", "")
        self.api_key = raw_key.strip().split('\n')[0] if raw_key else None
        self.timeout = 30.0
        self.storage_dir = AUDIO_STORAGE_DIR
        
        # Primary API: Instagram Scraper Stable (RockSolid APIs)
        # Host from: https://rapidapi.com/thetechguy32744/api/instagram-scraper-stable-api
        self.primary_host = "instagram-scraper-stable-api.p.rapidapi.com"
        self.primary_base_url = f"https://{self.primary_host}"
        
        # Fallback API: instagram-looter2
        self.fallback_host = "instagram-looter2.p.rapidapi.com"
        self.fallback_base_url = f"https://{self.fallback_host}"
        
        # Cache for audio metadata
        self._audio_cache: Dict[str, AudioMetadata] = {}
        
        if not self.api_key:
            logger.warning("RAPIDAPI_KEY not set - audio fetching will fail")
    
    def _get_headers(self, host: str) -> Dict[str, str]:
        """Get RapidAPI headers for specified host"""
        return {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": host,
            "Content-Type": "application/json"
        }
    
    async def fetch_reels_with_audio(self, username: str) -> List[AudioMetadata]:
        """
        Fetch user reels using Instagram Scraper Stable API.
        Returns list of reels with audio URLs.
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                # Try primary API (Instagram Scraper Stable)
                response = await client.post(
                    f"{self.primary_base_url}/v1/reels",
                    headers=self._get_headers(self.primary_host),
                    json={"username_or_id_or_url": username, "count": 12}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    items = data.get("data", {}).get("items", [])
                    
                    reels = []
                    for item in items:
                        audio = self._extract_audio_from_reel(item, username)
                        if audio and audio.audio_url:
                            reels.append(audio)
                    
                    logger.info(f"Fetched {len(reels)} reels with audio for @{username}")
                    return reels
                    
                logger.warning(f"Primary API returned {response.status_code}")
                
            except Exception as e:
                logger.error(f"Error fetching reels from primary API: {e}")
        
        return []
    
    def _extract_audio_from_reel(self, item: Dict[str, Any], username: str) -> Optional[AudioMetadata]:
        """Extract audio metadata from reel API response"""
        try:
            # Get video URL (can be used as audio source)
            video_url = None
            video_versions = item.get("video_versions", [])
            if video_versions:
                video_url = video_versions[0].get("url")
            
            # Get audio from clips_metadata
            audio_url = None
            audio_title = "Instagram Audio"
            audio_artist = username
            
            clips_metadata = item.get("clips_metadata", {})
            music_info = clips_metadata.get("music_info", {})
            
            if music_info:
                music_asset = music_info.get("music_asset_info", {})
                audio_url = music_asset.get("progressive_download_url")
                audio_title = music_asset.get("title", audio_title)
                audio_artist = music_asset.get("display_artist", audio_artist)
            
            # Fallback to original sound
            if not audio_url:
                original_sound = clips_metadata.get("original_sound_info", {})
                if original_sound:
                    audio_asset = original_sound.get("audio_asset_info", {})
                    audio_url = audio_asset.get("progressive_download_url")
                    audio_title = original_sound.get("original_audio_title", "Original Sound")
                    ig_artist = original_sound.get("ig_artist", {})
                    audio_artist = ig_artist.get("username", username)
            
            # Use video URL if no direct audio URL
            if not audio_url:
                audio_url = video_url
            
            if not audio_url:
                return None
            
            # Get cover art
            cover_url = None
            image_versions = item.get("image_versions2", {})
            candidates = image_versions.get("candidates", [])
            if candidates:
                cover_url = candidates[0].get("url")
            
            # Get caption for title
            caption = item.get("caption", {})
            if isinstance(caption, dict):
                caption_text = caption.get("text", "")[:50]
                if caption_text and audio_title == "Instagram Audio":
                    audio_title = caption_text
            
            return AudioMetadata(
                audio_id=str(item.get("id", item.get("pk", ""))),
                title=audio_title,
                artist=audio_artist,
                duration_ms=int(item.get("video_duration", 0) * 1000) if item.get("video_duration") else None,
                audio_url=audio_url,
                cover_url=cover_url,
                source="instagram-stable"
            )
            
        except Exception as e:
            logger.error(f"Error extracting audio from reel: {e}")
            return None
    
    def _get_audio_filename(self, audio_id: str, title: str) -> str:
        """Generate safe filename for audio file"""
        safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_'))[:50]
        return f"{audio_id}_{safe_title}.mp3"
    
    def _get_audio_path(self, audio_id: str, title: str = "audio") -> Path:
        """Get local storage path for audio file"""
        filename = self._get_audio_filename(audio_id, title)
        return self.storage_dir / filename
    
    def get_stored_audio_path(self, audio_id: str) -> Optional[Path]:
        """Check if audio is already stored locally"""
        # Search for any file starting with this audio_id
        for file in self.storage_dir.glob(f"{audio_id}_*"):
            if file.is_file():
                return file
        return None
    
    async def fetch_audio_from_reel(self, reel_url: str) -> Optional[AudioMetadata]:
        """
        Fetch audio information and URL from an Instagram reel.
        
        Args:
            reel_url: Instagram reel URL, shortcode, or username
            
        Returns:
            AudioMetadata with audio_url if available
        """
        if not self.api_key:
            logger.error("Cannot fetch audio: RAPIDAPI_KEY not configured")
            return None
        
        # Extract username from URL if provided
        username = self._extract_username_from_url(reel_url)
        if not username:
            username = reel_url  # Assume it's a username
        
        # Try primary API first (Instagram Scraper Stable)
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                logger.info(f"Fetching reels for @{username} via Instagram Scraper Stable API")
                # Endpoint: POST /get_ig_user_reels.php (form-urlencoded)
                headers = self._get_headers(self.primary_host)
                headers["Content-Type"] = "application/x-www-form-urlencoded"
                
                response = await client.post(
                    f"{self.primary_base_url}/get_ig_user_reels.php",
                    headers=headers,
                    data={"username_or_url": username, "amount": "10"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    # API returns {"reels": [{"node": {"media": {...}}}]}
                    items = data.get("reels", [])
                    
                    for item in items:
                        # Extract media from nested structure
                        media = item.get("node", {}).get("media", item.get("media", item))
                        audio = self._extract_audio_from_reel(media, username)
                        if audio and audio.audio_url:
                            logger.info(f"Found audio: {audio.title} by {audio.artist}")
                            return audio
                    
                    logger.warning(f"No reels with audio found for @{username}")
                else:
                    logger.warning(f"Primary API returned {response.status_code}: {response.text[:200]}")
                    
            except Exception as e:
                logger.error(f"Primary API error: {e}")
        
        # Fallback to looter2 API
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                logger.info(f"Trying fallback API for @{username}")
                response = await client.get(
                    f"{self.fallback_base_url}/profile",
                    params={"username": username},
                    headers=self._get_headers(self.fallback_host)
                )
                
                if response.status_code == 200:
                    data = response.json()
                    timeline = data.get("edge_owner_to_timeline_media", {})
                    edges = timeline.get("edges", [])
                    
                    for edge in edges:
                        node = edge.get("node", {})
                        if node.get("is_video"):
                            video_url = node.get("video_url")
                            if video_url:
                                return AudioMetadata(
                                    audio_id=str(node.get("id", "")),
                                    title=self._extract_title(node),
                                    artist=username,
                                    audio_url=video_url,
                                    cover_url=node.get("thumbnail_src") or node.get("display_url"),
                                    source="instagram-looter2"
                                )
                                
            except Exception as e:
                logger.error(f"Fallback API error: {e}")
        
        logger.warning(f"No audio found for: {reel_url}")
        return None
    
    def _extract_username_from_url(self, url: str) -> Optional[str]:
        """Extract username from Instagram URL or return as-is if it's a username"""
        import re
        # Match instagram.com/username or instagram.com/reel/xxx
        match = re.search(r'instagram\.com/([^/]+)', url)
        if match:
            username = match.group(1)
            if username not in ('reel', 'p', 'stories'):
                return username
        # If it's just a username without URL
        if not url.startswith('http'):
            return url
        return None
    
    def _extract_title(self, node: Dict[str, Any]) -> str:
        """Extract title from post node"""
        caption = node.get("edge_media_to_caption", {}).get("edges", [])
        if caption:
            text = caption[0].get("node", {}).get("text", "")
            # Take first 50 chars as title
            return text[:50] if text else "Instagram Audio"
        return "Instagram Audio"
    
    def _extract_audio_from_post(self, post_data: Dict[str, Any]) -> Optional[AudioMetadata]:
        """Extract audio metadata from post/reel data"""
        # Try different paths for audio data in Instagram API response
        clips_metadata = post_data.get("clips_metadata", {})
        music_info = clips_metadata.get("music_info", {})
        audio_asset = clips_metadata.get("audio_asset_id")
        original_sound = clips_metadata.get("original_sound_info", {})
        
        # Check for music track
        if music_info:
            music_asset = music_info.get("music_asset_info", {})
            return AudioMetadata(
                audio_id=str(music_asset.get("audio_id", music_asset.get("id", ""))),
                title=music_asset.get("title", "Unknown Track"),
                artist=music_asset.get("display_artist", music_asset.get("artist", "Unknown")),
                duration_ms=music_asset.get("duration_in_ms"),
                audio_url=music_asset.get("progressive_download_url") or music_asset.get("dash_manifest"),
                cover_url=music_asset.get("cover_artwork_uri") or music_asset.get("cover_artwork_thumbnail_uri")
            )
        
        # Check for original sound
        if original_sound:
            audio_asset_info = original_sound.get("audio_asset_info", {})
            return AudioMetadata(
                audio_id=str(original_sound.get("audio_id", audio_asset_info.get("audio_id", ""))),
                title=original_sound.get("original_audio_title", "Original Sound"),
                artist=original_sound.get("ig_artist", {}).get("username", "Unknown"),
                duration_ms=audio_asset_info.get("duration_in_ms"),
                audio_url=audio_asset_info.get("progressive_download_url")
            )
        
        # Check video URL as fallback for audio
        video_versions = post_data.get("video_versions", [])
        if video_versions:
            return AudioMetadata(
                audio_id=str(post_data.get("id", post_data.get("pk", ""))),
                title=post_data.get("caption", {}).get("text", "Video Audio")[:50] if post_data.get("caption") else "Video Audio",
                artist="Instagram",
                audio_url=video_versions[0].get("url")
            )
        
        return None
    
    async def download_audio(self, audio_metadata: AudioMetadata) -> Optional[Path]:
        """
        Download audio file and store locally.
        
        Args:
            audio_metadata: Audio metadata with audio_url
            
        Returns:
            Path to downloaded file or None if failed
        """
        if not audio_metadata.audio_url:
            logger.error("No audio URL provided")
            return None
        
        # Check if already downloaded
        existing = self.get_stored_audio_path(audio_metadata.audio_id)
        if existing:
            logger.info(f"Audio already downloaded: {existing}")
            return existing
        
        file_path = self._get_audio_path(audio_metadata.audio_id, audio_metadata.title)
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                logger.info(f"Downloading audio: {audio_metadata.title}")
                response = await client.get(audio_metadata.audio_url)
                response.raise_for_status()
                
                # Write to file
                with open(file_path, "wb") as f:
                    f.write(response.content)
                
                # Update metadata
                audio_metadata.file_path = str(file_path)
                audio_metadata.file_size = len(response.content)
                audio_metadata.downloaded_at = datetime.now().isoformat()
                
                # Cache the metadata
                self._audio_cache[audio_metadata.audio_id] = audio_metadata
                
                logger.info(f"Audio downloaded: {file_path} ({audio_metadata.file_size} bytes)")
                return file_path
                
            except Exception as e:
                logger.error(f"Error downloading audio: {e}")
                return None
    
    async def fetch_and_store_audio(self, reel_url: str) -> Optional[AudioMetadata]:
        """
        Complete flow: fetch audio info from reel and download it.
        
        Args:
            reel_url: Instagram reel URL
            
        Returns:
            AudioMetadata with local file_path if successful
        """
        audio_info = await self.fetch_audio_from_reel(reel_url)
        if not audio_info:
            return None
        
        # Check if already downloaded
        existing = self.get_stored_audio_path(audio_info.audio_id)
        if existing:
            audio_info.file_path = str(existing)
            audio_info.file_size = existing.stat().st_size
            return audio_info
        
        # Download the audio
        file_path = await self.download_audio(audio_info)
        if file_path:
            audio_info.file_path = str(file_path)
            return audio_info
        
        return None
    
    def get_audio_metadata(self, audio_id: str) -> Optional[AudioMetadata]:
        """Get cached audio metadata"""
        return self._audio_cache.get(audio_id)
    
    def list_stored_audio(self) -> List[Dict[str, Any]]:
        """List all locally stored audio files"""
        audio_files = []
        for file in self.storage_dir.glob("*.mp3"):
            audio_files.append({
                "filename": file.name,
                "path": str(file),
                "size": file.stat().st_size,
                "modified": datetime.fromtimestamp(file.stat().st_mtime).isoformat()
            })
        return audio_files


# Singleton instance
_audio_service: Optional[AudioService] = None


def get_audio_service() -> AudioService:
    """Get singleton audio service instance"""
    global _audio_service
    if _audio_service is None:
        _audio_service = AudioService()
    return _audio_service
