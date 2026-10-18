"""
Instagram Music Crawler
========================
Crawls trending/popular music from Instagram Reels via RapidAPI.
Implements rate limiting to avoid API limits.
"""
import asyncio
import json
import logging
import os
import time
import aiohttp
import aiofiles
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field, asdict

from sqlalchemy import create_engine, text

logger = logging.getLogger(__name__)


@dataclass
class RateLimiter:
    """Rate limiter for API calls"""
    calls_per_minute: int = 30
    calls_per_day: int = 1000
    
    _minute_calls: List[float] = field(default_factory=list)
    _day_calls: List[float] = field(default_factory=list)
    
    async def wait_if_needed(self):
        """Wait if rate limits would be exceeded"""
        now = time.time()
        
        # Clean up old calls
        minute_ago = now - 60
        day_ago = now - 86400
        
        self._minute_calls = [t for t in self._minute_calls if t > minute_ago]
        self._day_calls = [t for t in self._day_calls if t > day_ago]
        
        # Check daily limit
        if len(self._day_calls) >= self.calls_per_day:
            wait_time = self._day_calls[0] - day_ago
            logger.warning(f"Daily rate limit reached, waiting {wait_time:.0f}s")
            await asyncio.sleep(wait_time + 1)
            return await self.wait_if_needed()
        
        # Check minute limit
        if len(self._minute_calls) >= self.calls_per_minute:
            wait_time = self._minute_calls[0] - minute_ago
            logger.info(f"Minute rate limit reached, waiting {wait_time:.1f}s")
            await asyncio.sleep(wait_time + 0.5)
            return await self.wait_if_needed()
    
    def record_call(self):
        """Record an API call"""
        now = time.time()
        self._minute_calls.append(now)
        self._day_calls.append(now)


@dataclass
class InstagramTrack:
    """Represents an Instagram audio track"""
    track_id: str
    title: str
    artist: str
    duration_sec: Optional[float] = None
    usage_count: int = 0
    audio_url: Optional[str] = None
    cover_url: Optional[str] = None
    is_trending: bool = False
    discovered_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    source_post_id: Optional[str] = None
    genre: Optional[str] = None
    mood: Optional[str] = None
    local_path: Optional[str] = None


class InstagramMusicCrawler:
    """
    Crawls Instagram for trending/popular music.
    Uses RapidAPI instagram-looter2 for fetching reels and audio.
    """
    
    # RapidAPI endpoint (instagram-looter2)
    RAPIDAPI_HOST = "instagram-looter2.p.rapidapi.com"
    BASE_URL = f"https://{RAPIDAPI_HOST}"
    
    def __init__(
        self,
        rapidapi_key: Optional[str] = None,
        db_url: Optional[str] = None,
        output_dir: Optional[str] = None,
        calls_per_minute: int = 25,
        calls_per_day: int = 500
    ):
        self.rapidapi_key = rapidapi_key or os.getenv("RAPIDAPI_KEY")
        self.db_url = db_url or os.getenv("DATABASE_URL", "postgresql://postgres:postgres@127.0.0.1:54322/postgres")
        self.output_dir = Path(output_dir or "data/music/instagram")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.rate_limiter = RateLimiter(
            calls_per_minute=calls_per_minute,
            calls_per_day=calls_per_day
        )
        
        # Track discovered audio
        self.discovered_tracks: Dict[str, InstagramTrack] = {}
        
        if self.db_url:
            self.engine = create_engine(self.db_url)
        else:
            self.engine = None
        
        if not self.rapidapi_key:
            logger.warning("RAPIDAPI_KEY not set - Instagram crawler will not work")
    
    async def _api_call(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Make rate-limited API call"""
        if not self.rapidapi_key:
            logger.error("RAPIDAPI_KEY not configured")
            return None
        
        await self.rate_limiter.wait_if_needed()
        
        headers = {
            "X-RapidAPI-Key": self.rapidapi_key,
            "X-RapidAPI-Host": self.RAPIDAPI_HOST
        }
        
        url = f"{self.BASE_URL}{endpoint}"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, params=params, timeout=30) as response:
                    self.rate_limiter.record_call()
                    
                    if response.status == 429:
                        logger.warning("Rate limited by API, waiting 60s")
                        await asyncio.sleep(60)
                        return await self._api_call(endpoint, params)
                    
                    response.raise_for_status()
                    return await response.json()
                    
        except Exception as e:
            logger.error(f"API call failed: {e}")
            return None
    
    async def fetch_trending_reels(
        self,
        hashtags: List[str] = None,
        explore: bool = True,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Fetch trending reels to discover popular music.
        
        Args:
            hashtags: Optional hashtags to search
            explore: Whether to use explore feed
            limit: Maximum reels to fetch
        """
        reels = []
        
        # Search by hashtags for music-related content
        if hashtags:
            for hashtag in hashtags:
                logger.info(f"Searching hashtag: #{hashtag}")
                data = await self._api_call("/v1/hashtag", {"name": hashtag})
                
                if data and "posts" in data:
                    for post in data["posts"][:limit // len(hashtags)]:
                        if post.get("is_video") or post.get("media_type") == 2:
                            reels.append(post)
                
                # Rate limit between hashtags
                await asyncio.sleep(2)
        
        # Also get from popular accounts known for music
        music_accounts = [
            "spotify", "applemusic", "tiktok", "billboard",
            "rollingstone", "mtv", "vevo"
        ]
        
        for account in music_accounts[:3]:  # Limit to avoid too many calls
            logger.info(f"Checking account: @{account}")
            data = await self._api_call("/v1/posts", {"username": account})
            
            if data and isinstance(data, list):
                for post in data[:5]:  # Take recent 5
                    if post.get("is_video") or post.get("media_type") == 2:
                        reels.append(post)
            
            await asyncio.sleep(2)
        
        return reels[:limit]
    
    def extract_audio_from_reel(self, reel: Dict[str, Any]) -> Optional[InstagramTrack]:
        """Extract audio information from a reel"""
        try:
            # Different response structures based on API
            audio_info = (
                reel.get("music_info") or
                reel.get("audio") or
                reel.get("clips_music_attribution_info") or
                {}
            )
            
            if not audio_info:
                return None
            
            track_id = str(
                audio_info.get("audio_id") or
                audio_info.get("audio_cluster_id") or
                audio_info.get("id") or
                reel.get("pk")
            )
            
            title = (
                audio_info.get("title") or
                audio_info.get("song_name") or
                audio_info.get("audio_title") or
                "Unknown Track"
            )
            
            artist = (
                audio_info.get("artist_name") or
                audio_info.get("ig_artist", {}).get("username") or
                audio_info.get("original_sound_info", {}).get("ig_artist", {}).get("username") or
                "Unknown Artist"
            )
            
            return InstagramTrack(
                track_id=track_id,
                title=title,
                artist=artist,
                duration_sec=audio_info.get("duration_in_ms", 0) / 1000 if audio_info.get("duration_in_ms") else None,
                usage_count=audio_info.get("audio_asset_start_time", 0),
                audio_url=audio_info.get("audio_url") or audio_info.get("progressive_download_url"),
                cover_url=audio_info.get("cover_artwork_uri"),
                is_trending=audio_info.get("is_trending", False),
                source_post_id=str(reel.get("pk") or reel.get("id"))
            )
            
        except Exception as e:
            logger.warning(f"Failed to extract audio from reel: {e}")
            return None
    
    async def download_audio(
        self,
        track: InstagramTrack,
        force: bool = False
    ) -> Optional[str]:
        """
        Download audio file with rate limiting.
        
        Args:
            track: Track to download
            force: Force re-download even if exists
        
        Returns:
            Local file path or None
        """
        if not track.audio_url:
            logger.warning(f"No audio URL for track {track.track_id}")
            return None
        
        output_path = self.output_dir / f"{track.track_id}.mp3"
        
        if output_path.exists() and not force:
            logger.info(f"Audio already downloaded: {output_path}")
            return str(output_path)
        
        await self.rate_limiter.wait_if_needed()
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(track.audio_url, timeout=60) as response:
                    self.rate_limiter.record_call()
                    
                    if response.status != 200:
                        logger.error(f"Failed to download audio: {response.status}")
                        return None
                    
                    async with aiofiles.open(output_path, 'wb') as f:
                        async for chunk in response.content.iter_chunked(8192):
                            await f.write(chunk)
                    
                    logger.info(f"Downloaded: {output_path}")
                    return str(output_path)
                    
        except Exception as e:
            logger.error(f"Download failed: {e}")
            return None
    
    async def crawl_trending_music(
        self,
        hashtags: List[str] = None,
        download: bool = False,
        limit: int = 50
    ) -> List[InstagramTrack]:
        """
        Crawl Instagram for trending music.
        
        Args:
            hashtags: Hashtags to search (default: music-related)
            download: Whether to download audio files
            limit: Maximum tracks to return
        
        Returns:
            List of discovered tracks
        """
        if hashtags is None:
            hashtags = [
                "trendingmusic", "viralsong", "newmusic",
                "musicreels", "trending", "fyp"
            ]
        
        logger.info(f"Starting music crawl with hashtags: {hashtags}")
        
        # Fetch reels
        reels = await self.fetch_trending_reels(hashtags=hashtags, limit=limit * 2)
        logger.info(f"Fetched {len(reels)} reels")
        
        # Extract audio
        tracks = []
        for reel in reels:
            track = self.extract_audio_from_reel(reel)
            if track and track.track_id not in self.discovered_tracks:
                self.discovered_tracks[track.track_id] = track
                tracks.append(track)
        
        logger.info(f"Discovered {len(tracks)} unique tracks")
        
        # Download if requested
        if download:
            for track in tracks[:limit]:
                local_path = await self.download_audio(track)
                if local_path:
                    track.local_path = local_path
                
                # Small delay between downloads
                await asyncio.sleep(1)
        
        # Save to database
        if self.engine:
            await self._save_tracks_to_db(tracks[:limit])
        
        return tracks[:limit]
    
    async def _save_tracks_to_db(self, tracks: List[InstagramTrack]):
        """Save discovered tracks to database"""
        try:
            with self.engine.connect() as conn:
                for track in tracks:
                    conn.execute(text("""
                        INSERT INTO instagram_trending_music (
                            track_id, title, artist, duration_sec, usage_count,
                            audio_url, cover_url, is_trending, discovered_at,
                            source_post_id, local_path
                        ) VALUES (
                            :track_id, :title, :artist, :duration_sec, :usage_count,
                            :audio_url, :cover_url, :is_trending, :discovered_at,
                            :source_post_id, :local_path
                        )
                        ON CONFLICT (track_id) DO UPDATE SET
                            usage_count = GREATEST(instagram_trending_music.usage_count, :usage_count),
                            is_trending = :is_trending,
                            local_path = COALESCE(:local_path, instagram_trending_music.local_path)
                    """), {
                        "track_id": track.track_id,
                        "title": track.title,
                        "artist": track.artist,
                        "duration_sec": track.duration_sec,
                        "usage_count": track.usage_count,
                        "audio_url": track.audio_url,
                        "cover_url": track.cover_url,
                        "is_trending": track.is_trending,
                        "discovered_at": track.discovered_at,
                        "source_post_id": track.source_post_id,
                        "local_path": track.local_path
                    })
                conn.commit()
                logger.info(f"Saved {len(tracks)} tracks to database")
        except Exception as e:
            logger.error(f"Failed to save tracks to database: {e}")
    
    def get_rate_limit_status(self) -> Dict[str, Any]:
        """Get current rate limit status"""
        now = time.time()
        minute_ago = now - 60
        day_ago = now - 86400
        
        minute_calls = len([t for t in self.rate_limiter._minute_calls if t > minute_ago])
        day_calls = len([t for t in self.rate_limiter._day_calls if t > day_ago])
        
        return {
            "calls_this_minute": minute_calls,
            "calls_today": day_calls,
            "minute_limit": self.rate_limiter.calls_per_minute,
            "daily_limit": self.rate_limiter.calls_per_day,
            "minute_remaining": self.rate_limiter.calls_per_minute - minute_calls,
            "daily_remaining": self.rate_limiter.calls_per_day - day_calls
        }
    
    async def export_catalog(self, output_file: Optional[str] = None) -> str:
        """Export discovered tracks to JSON"""
        output_file = output_file or str(self.output_dir / "catalog.json")
        
        catalog = {
            "exported_at": datetime.utcnow().isoformat(),
            "track_count": len(self.discovered_tracks),
            "tracks": [asdict(t) for t in self.discovered_tracks.values()]
        }
        
        async with aiofiles.open(output_file, 'w') as f:
            await f.write(json.dumps(catalog, indent=2))
        
        logger.info(f"Exported {len(self.discovered_tracks)} tracks to {output_file}")
        return output_file


# Database migration for instagram_trending_music table
MIGRATION_SQL = """
CREATE TABLE IF NOT EXISTS instagram_trending_music (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    artist TEXT,
    duration_sec FLOAT,
    usage_count INTEGER DEFAULT 0,
    audio_url TEXT,
    cover_url TEXT,
    is_trending BOOLEAN DEFAULT FALSE,
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    source_post_id TEXT,
    genre TEXT,
    mood TEXT,
    local_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ig_music_trending ON instagram_trending_music(is_trending);
CREATE INDEX IF NOT EXISTS idx_ig_music_usage ON instagram_trending_music(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_ig_music_discovered ON instagram_trending_music(discovered_at DESC);
"""
