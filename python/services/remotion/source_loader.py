"""
Source Loader
=============
Loads sources from multiple types (local, URL, TTS, MediaPoster, matting).
Handles caching and downloading.
"""

import logging
import os
import shutil
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any
from urllib.parse import urlparse
import requests

from .models import SourceType

logger = logging.getLogger(__name__)


class SourceLoader:
    """
    Loads sources from multiple types for Remotion composition.
    
    Supports:
        - Local files
        - URLs (downloads and caches)
        - TTS outputs (from event bus)
        - MediaPoster media library
        - Matting outputs (from event bus)
    """
    
    def __init__(self, cache_dir: Optional[str] = None):
        """
        Initialize source loader.
        
        Args:
            cache_dir: Directory for caching downloaded sources
        """
        self.cache_dir = Path(cache_dir) if cache_dir else Path("data/remotion_cache")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Subdirectories for different source types
        self.url_cache = self.cache_dir / "urls"
        self.tts_cache = self.cache_dir / "tts"
        self.matting_cache = self.cache_dir / "matting"
        self.mediaposter_cache = self.cache_dir / "mediaposter"
        
        for cache in [self.url_cache, self.tts_cache, self.matting_cache, self.mediaposter_cache]:
            cache.mkdir(parents=True, exist_ok=True)
    
    async def load_source(
        self,
        source: str,
        source_type: SourceType,
        job_id: Optional[str] = None,
        **kwargs
    ) -> Optional[str]:
        """
        Load a source and return local path.
        
        Args:
            source: Source identifier (path, URL, job_id, etc.)
            source_type: Type of source
            job_id: Optional job ID for tracking
            **kwargs: Additional parameters
        
        Returns:
            Local path to source file, or None if failed
        """
        try:
            if source_type == SourceType.LOCAL:
                return await self._load_local(source)
            elif source_type == SourceType.URL:
                return await self._load_url(source, job_id)
            elif source_type == SourceType.TTS:
                return await self._load_tts(source, job_id)
            elif source_type == SourceType.MEDIAPOSTER:
                return await self._load_mediaposter(source, job_id)
            elif source_type == SourceType.MATTING:
                return await self._load_matting(source, job_id)
            else:
                logger.error(f"Unknown source type: {source_type}")
                return None
        except Exception as e:
            logger.error(f"Failed to load source {source} (type: {source_type}): {e}", exc_info=True)
            return None
    
    async def _load_local(self, path: str) -> Optional[str]:
        """Load local file."""
        file_path = Path(path)
        if file_path.exists():
            return str(file_path.absolute())
        else:
            logger.error(f"Local file not found: {path}")
            return None
    
    async def _load_url(self, url: str, job_id: Optional[str] = None) -> Optional[str]:
        """Download and cache URL source."""
        # Generate cache filename from URL
        parsed = urlparse(url)
        url_hash = hash(url) % (10 ** 8)  # Simple hash
        ext = Path(parsed.path).suffix or ".mp4"
        cache_filename = f"{url_hash}{ext}"
        cache_path = self.url_cache / cache_filename
        
        # Return cached if exists
        if cache_path.exists():
            logger.info(f"Using cached URL: {url}")
            return str(cache_path)
        
        # Download
        logger.info(f"Downloading URL: {url}")
        try:
            response = requests.get(url, stream=True, timeout=30)
            response.raise_for_status()
            
            with open(cache_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            logger.info(f"Cached URL to: {cache_path}")
            return str(cache_path)
        except Exception as e:
            logger.error(f"Failed to download URL {url}: {e}")
            return None
    
    async def _load_tts(self, tts_job_id: str, job_id: Optional[str] = None) -> Optional[str]:
        """
        Load TTS output from job ID.
        
        Note: This would typically subscribe to tts.completed events.
        For now, we'll check a known location or wait for event.
        """
        # Check if TTS output exists in expected location
        tts_output_dir = Path("data/tts_outputs")
        possible_paths = [
            tts_output_dir / f"{tts_job_id}.wav",
            tts_output_dir / f"{tts_job_id}.mp3",
        ]
        
        for path in possible_paths:
            if path.exists():
                logger.info(f"Found TTS output: {path}")
                return str(path)
        
        # If not found, cache a placeholder and wait for event
        # In production, this would subscribe to tts.completed events
        logger.warning(f"TTS output not found for job {tts_job_id}. Will wait for tts.completed event.")
        return None
    
    async def _load_mediaposter(self, media_id: str, job_id: Optional[str] = None) -> Optional[str]:
        """
        Load media from MediaPoster library.
        
        This would query the MediaPoster database/API to get the file path.
        """
        # TODO: Implement MediaPoster media loading
        # This would query the database or use MediaProviderService
        logger.warning(f"MediaPoster media loading not yet implemented for {media_id}")
        return None
    
    async def _load_matting(self, matting_job_id: str, job_id: Optional[str] = None) -> Optional[str]:
        """
        Load matting output from job ID.
        
        Note: This would typically subscribe to matting.completed events.
        """
        # Check if matting output exists in expected location
        matting_output_dir = Path("data/matting_outputs")
        possible_paths = [
            matting_output_dir / f"{matting_job_id}.mov",
            matting_output_dir / f"{matting_job_id}.mp4",
        ]
        
        for path in possible_paths:
            if path.exists():
                logger.info(f"Found matting output: {path}")
                return str(path)
        
        # If not found, wait for event
        logger.warning(f"Matting output not found for job {matting_job_id}. Will wait for matting.completed event.")
        return None
    
    def clear_cache(self, source_type: Optional[SourceType] = None) -> int:
        """
        Clear cache for a source type or all.
        
        Returns:
            Number of files deleted
        """
        count = 0
        if source_type == SourceType.URL or source_type is None:
            for file in self.url_cache.glob("*"):
                file.unlink()
                count += 1
        if source_type == SourceType.TTS or source_type is None:
            for file in self.tts_cache.glob("*"):
                file.unlink()
                count += 1
        if source_type == SourceType.MATTING or source_type is None:
            for file in self.matting_cache.glob("*"):
                file.unlink()
                count += 1
        
        return count

