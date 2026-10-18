"""
Asset Manager
=============
Manages external assets for video production:
- Background music (from APIs)
- B-roll videos (from APIs)
- Memes (from APIs)
- Sound effects (from APIs)
- Generated images (AI)
- Icons and graphics

Integrates with various APIs to fetch and cache assets.
"""

import asyncio
import hashlib
import httpx
import json
import logging
import os
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from uuid import uuid4

logger = logging.getLogger(__name__)


class AssetType(str, Enum):
    """Types of assets."""
    MUSIC = "music"
    BROLL = "broll"
    MEME = "meme"
    SOUND_EFFECT = "sfx"
    IMAGE = "image"
    ICON = "icon"
    VOICEOVER = "voiceover"


class AssetSource(str, Enum):
    """Sources for assets."""
    PIXABAY = "pixabay"           # Free stock music, video, images
    PEXELS = "pexels"             # Free stock video, images
    FREESOUND = "freesound"       # Sound effects
    IMGFLIP = "imgflip"           # Memes
    GIPHY = "giphy"               # GIFs
    OPENAI_DALLE = "dalle"        # AI image generation
    ELEVENLABS = "elevenlabs"     # TTS/voice
    LOCAL = "local"               # Local files
    YOUTUBE = "youtube"           # YouTube clips (fair use)


@dataclass
class Asset:
    """An asset with metadata."""
    id: str
    type: AssetType
    source: AssetSource
    url: str
    local_path: Optional[str] = None
    title: Optional[str] = None
    duration_seconds: Optional[float] = None
    attribution: Optional[str] = None
    license: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    cached_at: Optional[datetime] = None
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "type": self.type.value,
            "source": self.source.value,
            "url": self.url,
            "local_path": self.local_path,
            "title": self.title,
            "duration_seconds": self.duration_seconds,
            "attribution": self.attribution,
            "license": self.license,
            "tags": self.tags,
            "metadata": self.metadata,
            "cached_at": self.cached_at.isoformat() if self.cached_at else None,
        }


class AssetManager:
    """
    Manages asset discovery, fetching, and caching.
    
    Usage:
        manager = AssetManager()
        
        # Find background music
        tracks = await manager.search_music("ambient", duration_range=(60, 300))
        
        # Find B-roll
        clips = await manager.search_broll("technology", count=5)
        
        # Generate image
        image = await manager.generate_image("futuristic city skyline")
        
        # Get meme template
        meme = await manager.get_meme("drake")
    """
    
    def __init__(self, cache_dir: Optional[str] = None):
        self.cache_dir = Path(cache_dir or "data/asset_cache")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # API keys from environment
        self.pixabay_key = os.getenv("PIXABAY_API_KEY")
        self.pexels_key = os.getenv("PEXELS_API_KEY")
        self.freesound_key = os.getenv("FREESOUND_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
        self.giphy_key = os.getenv("GIPHY_API_KEY")
        
        # Cache index
        self._cache_index: Dict[str, Asset] = {}
        self._load_cache_index()
    
    def _load_cache_index(self):
        """Load cache index from disk."""
        index_path = self.cache_dir / "index.json"
        if index_path.exists():
            try:
                with open(index_path) as f:
                    data = json.load(f)
                    for asset_id, asset_data in data.items():
                        asset_data["type"] = AssetType(asset_data["type"])
                        asset_data["source"] = AssetSource(asset_data["source"])
                        if asset_data.get("cached_at"):
                            asset_data["cached_at"] = datetime.fromisoformat(asset_data["cached_at"])
                        self._cache_index[asset_id] = Asset(**asset_data)
            except Exception as e:
                logger.warning(f"Failed to load cache index: {e}")
    
    def _save_cache_index(self):
        """Save cache index to disk."""
        index_path = self.cache_dir / "index.json"
        with open(index_path, "w") as f:
            json.dump({
                asset_id: asset.to_dict()
                for asset_id, asset in self._cache_index.items()
            }, f, indent=2)
    
    def _cache_key(self, query: str, asset_type: AssetType) -> str:
        """Generate cache key for a query."""
        return hashlib.md5(f"{asset_type.value}:{query}".encode()).hexdigest()[:12]
    
    # =========================================================================
    # MUSIC APIs
    # =========================================================================
    
    async def search_music(
        self,
        query: str,
        genre: Optional[str] = None,
        duration_range: Optional[Tuple[int, int]] = None,
        count: int = 5
    ) -> List[Asset]:
        """
        Search for background music.
        
        Args:
            query: Search term (e.g., "ambient", "upbeat", "cinematic")
            genre: Genre filter
            duration_range: (min_seconds, max_seconds)
            count: Number of results
        
        Returns:
            List of music assets
        """
        results = []
        
        # Try Pixabay Music API
        if self.pixabay_key:
            try:
                pixabay_results = await self._search_pixabay_music(query, duration_range, count)
                results.extend(pixabay_results)
            except Exception as e:
                logger.warning(f"Pixabay music search failed: {e}")
        
        # Fallback to local music library
        if not results:
            results = await self._search_local_music(query, genre, count)
        
        return results[:count]
    
    async def _search_pixabay_music(
        self,
        query: str,
        duration_range: Optional[Tuple[int, int]],
        count: int
    ) -> List[Asset]:
        """Search Pixabay for music."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            params = {
                "key": self.pixabay_key,
                "q": query,
                "per_page": count,
            }
            
            response = await client.get(
                "https://pixabay.com/api/",
                params=params
            )
            
            if response.status_code != 200:
                logger.warning(f"Pixabay API error: {response.status_code}")
                return []
            
            data = response.json()
            assets = []
            
            for hit in data.get("hits", []):
                # Note: Pixabay's main API is for images/videos
                # For music, you'd use their audio API which has different endpoints
                asset = Asset(
                    id=f"pixabay_music_{hit.get('id', uuid4())}",
                    type=AssetType.MUSIC,
                    source=AssetSource.PIXABAY,
                    url=hit.get("previewURL", ""),
                    title=hit.get("tags", "Untitled"),
                    duration_seconds=hit.get("duration"),
                    attribution=f"Pixabay - {hit.get('user', 'Unknown')}",
                    license="Pixabay License",
                    tags=hit.get("tags", "").split(", "),
                )
                assets.append(asset)
            
            return assets
    
    async def _search_local_music(
        self,
        query: str,
        genre: Optional[str],
        count: int
    ) -> List[Asset]:
        """Search local music library."""
        # Check local music directory
        music_dir = Path("data/assets/music")
        if not music_dir.exists():
            music_dir.mkdir(parents=True, exist_ok=True)
            return []
        
        assets = []
        for music_file in music_dir.glob("*.mp3"):
            if query.lower() in music_file.stem.lower():
                asset = Asset(
                    id=f"local_music_{music_file.stem}",
                    type=AssetType.MUSIC,
                    source=AssetSource.LOCAL,
                    url=str(music_file),
                    local_path=str(music_file),
                    title=music_file.stem,
                    license="local",
                )
                assets.append(asset)
        
        return assets[:count]
    
    # =========================================================================
    # B-ROLL APIs
    # =========================================================================
    
    async def search_broll(
        self,
        query: str,
        orientation: str = "landscape",
        duration_range: Optional[Tuple[int, int]] = None,
        count: int = 5
    ) -> List[Asset]:
        """
        Search for B-roll video clips.
        
        Args:
            query: Search term
            orientation: "landscape", "portrait", "square"
            duration_range: (min_seconds, max_seconds)
            count: Number of results
        
        Returns:
            List of video assets
        """
        results = []
        
        # Try Pexels Video API
        if self.pexels_key:
            try:
                pexels_results = await self._search_pexels_video(query, orientation, count)
                results.extend(pexels_results)
            except Exception as e:
                logger.warning(f"Pexels video search failed: {e}")
        
        # Try Pixabay Video API
        if not results and self.pixabay_key:
            try:
                pixabay_results = await self._search_pixabay_video(query, count)
                results.extend(pixabay_results)
            except Exception as e:
                logger.warning(f"Pixabay video search failed: {e}")
        
        return results[:count]
    
    async def _search_pexels_video(
        self,
        query: str,
        orientation: str,
        count: int
    ) -> List[Asset]:
        """Search Pexels for videos."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {"Authorization": self.pexels_key}
            params = {
                "query": query,
                "orientation": orientation,
                "per_page": count,
            }
            
            response = await client.get(
                "https://api.pexels.com/videos/search",
                headers=headers,
                params=params
            )
            
            if response.status_code != 200:
                logger.warning(f"Pexels API error: {response.status_code}")
                return []
            
            data = response.json()
            assets = []
            
            for video in data.get("videos", []):
                # Get best quality video file
                video_files = video.get("video_files", [])
                best_file = max(video_files, key=lambda x: x.get("width", 0), default={})
                
                asset = Asset(
                    id=f"pexels_video_{video.get('id')}",
                    type=AssetType.BROLL,
                    source=AssetSource.PEXELS,
                    url=best_file.get("link", ""),
                    title=video.get("url", "").split("/")[-1],
                    duration_seconds=video.get("duration"),
                    attribution=f"Pexels - {video.get('user', {}).get('name', 'Unknown')}",
                    license="Pexels License",
                    metadata={
                        "width": best_file.get("width"),
                        "height": best_file.get("height"),
                        "fps": best_file.get("fps"),
                    }
                )
                assets.append(asset)
            
            return assets
    
    async def _search_pixabay_video(
        self,
        query: str,
        count: int
    ) -> List[Asset]:
        """Search Pixabay for videos."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            params = {
                "key": self.pixabay_key,
                "q": query,
                "video_type": "film",
                "per_page": count,
            }
            
            response = await client.get(
                "https://pixabay.com/api/videos/",
                params=params
            )
            
            if response.status_code != 200:
                return []
            
            data = response.json()
            assets = []
            
            for hit in data.get("hits", []):
                videos = hit.get("videos", {})
                large = videos.get("large", {})
                
                asset = Asset(
                    id=f"pixabay_video_{hit.get('id')}",
                    type=AssetType.BROLL,
                    source=AssetSource.PIXABAY,
                    url=large.get("url", ""),
                    title=hit.get("tags", "Untitled"),
                    duration_seconds=hit.get("duration"),
                    attribution=f"Pixabay - {hit.get('user', 'Unknown')}",
                    license="Pixabay License",
                    tags=hit.get("tags", "").split(", "),
                    metadata={
                        "width": large.get("width"),
                        "height": large.get("height"),
                    }
                )
                assets.append(asset)
            
            return assets
    
    # =========================================================================
    # SOUND EFFECTS APIs
    # =========================================================================
    
    async def search_sound_effects(
        self,
        query: str,
        duration_max: Optional[float] = None,
        count: int = 5
    ) -> List[Asset]:
        """
        Search for sound effects.
        
        Args:
            query: Search term (e.g., "whoosh", "click", "transition")
            duration_max: Maximum duration in seconds
            count: Number of results
        
        Returns:
            List of sound effect assets
        """
        results = []
        
        # Try Freesound API
        if self.freesound_key:
            try:
                freesound_results = await self._search_freesound(query, duration_max, count)
                results.extend(freesound_results)
            except Exception as e:
                logger.warning(f"Freesound search failed: {e}")
        
        # Fallback to local SFX library
        if not results:
            results = await self._search_local_sfx(query, count)
        
        return results[:count]
    
    async def _search_freesound(
        self,
        query: str,
        duration_max: Optional[float],
        count: int
    ) -> List[Asset]:
        """Search Freesound for sound effects."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            params = {
                "query": query,
                "token": self.freesound_key,
                "page_size": count,
                "fields": "id,name,duration,previews,username,license",
            }
            
            if duration_max:
                params["filter"] = f"duration:[0 TO {duration_max}]"
            
            response = await client.get(
                "https://freesound.org/apiv2/search/text/",
                params=params
            )
            
            if response.status_code != 200:
                return []
            
            data = response.json()
            assets = []
            
            for result in data.get("results", []):
                previews = result.get("previews", {})
                preview_url = previews.get("preview-hq-mp3", previews.get("preview-lq-mp3", ""))
                
                asset = Asset(
                    id=f"freesound_sfx_{result.get('id')}",
                    type=AssetType.SOUND_EFFECT,
                    source=AssetSource.FREESOUND,
                    url=preview_url,
                    title=result.get("name", "Untitled"),
                    duration_seconds=result.get("duration"),
                    attribution=f"Freesound - {result.get('username', 'Unknown')}",
                    license=result.get("license", "Unknown"),
                )
                assets.append(asset)
            
            return assets
    
    async def _search_local_sfx(self, query: str, count: int) -> List[Asset]:
        """Search local SFX library."""
        sfx_dir = Path("data/assets/sfx")
        if not sfx_dir.exists():
            sfx_dir.mkdir(parents=True, exist_ok=True)
            return []
        
        assets = []
        for sfx_file in sfx_dir.glob("*.mp3"):
            if query.lower() in sfx_file.stem.lower():
                asset = Asset(
                    id=f"local_sfx_{sfx_file.stem}",
                    type=AssetType.SOUND_EFFECT,
                    source=AssetSource.LOCAL,
                    url=str(sfx_file),
                    local_path=str(sfx_file),
                    title=sfx_file.stem,
                )
                assets.append(asset)
        
        return assets[:count]
    
    # =========================================================================
    # MEME APIs
    # =========================================================================
    
    async def search_memes(
        self,
        query: str,
        count: int = 5
    ) -> List[Asset]:
        """
        Search for meme templates.
        
        Args:
            query: Meme name or keyword
            count: Number of results
        
        Returns:
            List of meme template assets
        """
        # Try Imgflip API (free meme templates)
        try:
            return await self._search_imgflip(query, count)
        except Exception as e:
            logger.warning(f"Imgflip search failed: {e}")
            return []
    
    async def _search_imgflip(self, query: str, count: int) -> List[Asset]:
        """Get meme templates from Imgflip."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get("https://api.imgflip.com/get_memes")
            
            if response.status_code != 200:
                return []
            
            data = response.json()
            if not data.get("success"):
                return []
            
            memes = data.get("data", {}).get("memes", [])
            assets = []
            
            for meme in memes:
                # Filter by query
                if query.lower() in meme.get("name", "").lower():
                    asset = Asset(
                        id=f"imgflip_meme_{meme.get('id')}",
                        type=AssetType.MEME,
                        source=AssetSource.IMGFLIP,
                        url=meme.get("url", ""),
                        title=meme.get("name", "Untitled"),
                        metadata={
                            "width": meme.get("width"),
                            "height": meme.get("height"),
                            "box_count": meme.get("box_count"),
                        }
                    )
                    assets.append(asset)
                    
                    if len(assets) >= count:
                        break
            
            return assets
    
    # =========================================================================
    # GIF APIs
    # =========================================================================
    
    async def search_gifs(
        self,
        query: str,
        count: int = 5
    ) -> List[Asset]:
        """
        Search for GIFs.
        
        Args:
            query: Search term
            count: Number of results
        
        Returns:
            List of GIF assets
        """
        if self.giphy_key:
            try:
                return await self._search_giphy(query, count)
            except Exception as e:
                logger.warning(f"Giphy search failed: {e}")
        
        return []
    
    async def _search_giphy(self, query: str, count: int) -> List[Asset]:
        """Search Giphy for GIFs."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            params = {
                "api_key": self.giphy_key,
                "q": query,
                "limit": count,
            }
            
            response = await client.get(
                "https://api.giphy.com/v1/gifs/search",
                params=params
            )
            
            if response.status_code != 200:
                return []
            
            data = response.json()
            assets = []
            
            for gif in data.get("data", []):
                images = gif.get("images", {})
                original = images.get("original", {})
                
                asset = Asset(
                    id=f"giphy_{gif.get('id')}",
                    type=AssetType.IMAGE,
                    source=AssetSource.GIPHY,
                    url=original.get("url", ""),
                    title=gif.get("title", "Untitled"),
                    metadata={
                        "width": original.get("width"),
                        "height": original.get("height"),
                        "mp4_url": original.get("mp4"),
                    },
                    tags=["gif"],
                )
                assets.append(asset)
            
            return assets
    
    # =========================================================================
    # AI IMAGE GENERATION
    # =========================================================================
    
    async def generate_image(
        self,
        prompt: str,
        size: str = "1024x1024",
        style: str = "vivid",
        quality: str = "standard"
    ) -> Optional[Asset]:
        """
        Generate an image using DALL-E.
        
        Args:
            prompt: Image description
            size: "1024x1024", "1792x1024", "1024x1792"
            style: "vivid" or "natural"
            quality: "standard" or "hd"
        
        Returns:
            Generated image asset
        """
        if not self.openai_key:
            logger.warning("OpenAI API key not configured")
            return None
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/images/generations",
                    headers={
                        "Authorization": f"Bearer {self.openai_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "dall-e-3",
                        "prompt": prompt,
                        "n": 1,
                        "size": size,
                        "style": style,
                        "quality": quality,
                    }
                )
                
                if response.status_code != 200:
                    logger.error(f"DALL-E API error: {response.status_code} - {response.text}")
                    return None
                
                data = response.json()
                image_data = data.get("data", [{}])[0]
                
                asset = Asset(
                    id=f"dalle_{uuid4().hex[:8]}",
                    type=AssetType.IMAGE,
                    source=AssetSource.OPENAI_DALLE,
                    url=image_data.get("url", ""),
                    title=prompt[:50],
                    metadata={
                        "revised_prompt": image_data.get("revised_prompt"),
                        "size": size,
                        "style": style,
                        "quality": quality,
                    }
                )
                
                return asset
                
        except Exception as e:
            logger.error(f"DALL-E generation failed: {e}")
            return None
    
    # =========================================================================
    # ICONS
    # =========================================================================
    
    async def search_icons(
        self,
        query: str,
        style: str = "outlined",
        count: int = 5
    ) -> List[Asset]:
        """
        Search for icons.
        
        Uses local icon library or generates simple icons.
        """
        icons_dir = Path("data/assets/icons")
        if not icons_dir.exists():
            icons_dir.mkdir(parents=True, exist_ok=True)
        
        assets = []
        for icon_file in icons_dir.glob("*.svg"):
            if query.lower() in icon_file.stem.lower():
                asset = Asset(
                    id=f"local_icon_{icon_file.stem}",
                    type=AssetType.ICON,
                    source=AssetSource.LOCAL,
                    url=str(icon_file),
                    local_path=str(icon_file),
                    title=icon_file.stem,
                )
                assets.append(asset)
        
        return assets[:count]
    
    # =========================================================================
    # ASSET DOWNLOAD & CACHING
    # =========================================================================
    
    async def download_asset(self, asset: Asset) -> Optional[str]:
        """
        Download an asset and cache it locally.
        
        Returns:
            Local file path
        """
        if asset.local_path and Path(asset.local_path).exists():
            return asset.local_path
        
        try:
            # Determine file extension
            url = asset.url
            ext = ".mp4" if asset.type == AssetType.BROLL else ".mp3"
            if ".mp3" in url:
                ext = ".mp3"
            elif ".wav" in url:
                ext = ".wav"
            elif ".png" in url:
                ext = ".png"
            elif ".jpg" in url or ".jpeg" in url:
                ext = ".jpg"
            elif ".gif" in url:
                ext = ".gif"
            elif ".svg" in url:
                ext = ".svg"
            
            # Download
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.get(url)
                
                if response.status_code != 200:
                    logger.error(f"Failed to download {url}: {response.status_code}")
                    return None
                
                # Save to cache
                cache_subdir = self.cache_dir / asset.type.value
                cache_subdir.mkdir(parents=True, exist_ok=True)
                
                local_path = cache_subdir / f"{asset.id}{ext}"
                local_path.write_bytes(response.content)
                
                asset.local_path = str(local_path)
                asset.cached_at = datetime.now()
                
                # Update cache index
                self._cache_index[asset.id] = asset
                self._save_cache_index()
                
                logger.info(f"Cached asset: {asset.id} -> {local_path}")
                return str(local_path)
                
        except Exception as e:
            logger.error(f"Failed to download asset {asset.id}: {e}")
            return None
    
    async def resolve_assets_for_brief(
        self,
        brief: "ContentBrief",
        auto_download: bool = True
    ) -> Dict[str, Any]:
        """
        Resolve all assets needed for a content brief.
        
        This:
        1. Searches for background music based on audio config
        2. Finds B-roll for each topic
        3. Generates icons if needed
        4. Optionally downloads everything
        
        Returns:
            Dictionary of resolved assets
        """
        from .content_brief import ContentBrief
        
        resolved = {
            "music": [],
            "broll": {},
            "icons": {},
            "sfx": [],
        }
        
        # 1. Background music
        if brief.audio.background_music:
            music_tracks = await self.search_music(
                brief.audio.music_genre,
                count=3
            )
            resolved["music"] = [t.to_dict() for t in music_tracks]
            
            if auto_download and music_tracks:
                await self.download_asset(music_tracks[0])
        
        # 2. B-roll for each topic
        for item in brief.items:
            # Search for relevant B-roll
            broll_clips = await self.search_broll(
                f"{item.title} {item.category or ''}".strip(),
                count=2
            )
            resolved["broll"][item.id] = [c.to_dict() for c in broll_clips]
            
            if auto_download and broll_clips:
                await self.download_asset(broll_clips[0])
        
        # 3. Sound effects
        if brief.audio.sound_effects:
            # Common transitions
            sfx = await self.search_sound_effects("whoosh transition", count=3)
            resolved["sfx"] = [s.to_dict() for s in sfx]
        
        return resolved
