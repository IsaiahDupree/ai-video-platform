"""
UGC Adapter
===========
Adapter for User-Generated Content (UGC) from various sources.
"""

import logging
import os
import shutil
from pathlib import Path
from typing import Dict, Any, List, Optional

from .base import VisualsAdapter
from services.visuals.models import VisualsSearchCriteria, VisualsResponse, VisualsType

logger = logging.getLogger(__name__)


class UGCAdapter(VisualsAdapter):
    """
    Adapter for UGC content (b-roll, videos, images).
    
    Supports:
        - Local UGC library
        - MediaPoster media library (UGC content)
        - RapidAPI for UGC from social platforms
    """
    
    def __init__(
        self,
        ugc_dir: Optional[str] = None,
        rapidapi_key: Optional[str] = None
    ):
        """
        Initialize UGC adapter.
        
        Args:
            ugc_dir: Directory containing UGC content (default: data/ugc)
            rapidapi_key: RapidAPI key for social platform UGC
        """
        if ugc_dir is None:
            ugc_dir = "data/ugc"
        self.ugc_dir = Path(ugc_dir)
        self.ugc_dir.mkdir(parents=True, exist_ok=True)
        
        self.rapidapi_key = rapidapi_key or os.getenv("RAPIDAPI_KEY")
    
    def get_source_name(self) -> str:
        return "ugc"
    
    def supports_search(self) -> bool:
        return True
    
    async def search_visuals(
        self,
        visuals_type: VisualsType,
        criteria: VisualsSearchCriteria,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for UGC content.
        
        Searches local UGC library, MediaPoster library, and RapidAPI.
        """
        results = []
        
        # Search local UGC library
        if self.ugc_dir.exists():
            # Video files
            video_extensions = [".mp4", ".mov", ".avi", ".mkv", ".webm"]
            # Image files
            image_extensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"]
            
            all_extensions = video_extensions + image_extensions
            
            for ext in all_extensions:
                for file_path in self.ugc_dir.rglob(f"*{ext}"):
                    # Check if matches criteria
                    if self._matches_criteria(file_path, criteria):
                        is_video = ext in video_extensions
                        duration = None
                        if is_video:
                            duration = self._get_video_duration(file_path)
                        
                        results.append({
                            "asset_id": str(file_path.relative_to(self.ugc_dir)),
                            "title": file_path.stem,
                            "path": str(file_path),
                            "duration": duration,
                            "type": "video" if is_video else "image",
                            "source": "local_ugc"
                        })
                        
                        if len(results) >= limit:
                            break
        
        # TODO: Search MediaPoster media library
        # This would query the database for UGC content
        
        # If not enough results and RapidAPI available, search social platforms
        if len(results) < limit and self.rapidapi_key and criteria.trending:
            api_results = await self._search_rapidapi(criteria, limit - len(results))
            results.extend(api_results)
        
        return results[:limit]
    
    async def get_visuals(
        self,
        asset_id: str,
        output_path: Optional[Path] = None
    ) -> VisualsResponse:
        """
        Get UGC content.
        
        Args:
            asset_id: Relative path within UGC directory, MediaPoster media_id, or RapidAPI asset ID
            output_path: Optional output path
        """
        # Check if it's a local file
        source_path = self.ugc_dir / asset_id
        
        if source_path.exists():
            # Local file
            if output_path:
                output_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source_path, output_path)
                visuals_path = str(output_path)
            else:
                visuals_path = str(source_path)
            
            # Determine type
            is_video = source_path.suffix.lower() in [".mp4", ".mov", ".avi", ".mkv", ".webm"]
            duration = None
            if is_video:
                duration = self._get_video_duration(source_path)
            
            return VisualsResponse(
                job_id=asset_id,
                success=True,
                visuals_path=visuals_path,
                visuals_type="video" if is_video else "image",
                duration_seconds=duration,
                source="local_ugc"
            )
        else:
            # Try MediaPoster or RapidAPI
            # TODO: Implement MediaPoster lookup
            return await self._get_from_rapidapi(asset_id, output_path)
    
    async def _search_rapidapi(
        self,
        criteria: VisualsSearchCriteria,
        limit: int
    ) -> List[Dict[str, Any]]:
        """Search for UGC via RapidAPI."""
        # TODO: Implement RapidAPI UGC search
        # This would use Instagram/TikTok scrapers to find UGC content
        logger.info("RapidAPI UGC search not yet implemented")
        return []
    
    async def _get_from_rapidapi(
        self,
        asset_id: str,
        output_path: Optional[Path]
    ) -> VisualsResponse:
        """Get UGC from RapidAPI."""
        # TODO: Implement RapidAPI UGC download
        logger.info("RapidAPI UGC download not yet implemented")
        return VisualsResponse(
            job_id=asset_id,
            success=False,
            error="RapidAPI UGC download not yet implemented"
        )
    
    def _matches_criteria(self, file_path: Path, criteria: VisualsSearchCriteria) -> bool:
        """Check if UGC file matches criteria."""
        filename = file_path.stem.lower()
        
        # Check keywords
        if criteria.keywords:
            if not any(keyword.lower() in filename for keyword in criteria.keywords):
                return False
        
        return True
    
    def _get_video_duration(self, file_path: Path) -> float:
        """Get video duration (simplified - would use ffprobe in production)."""
        try:
            import subprocess
            result = subprocess.run(
                [
                    "ffprobe", "-v", "error",
                    "-show_entries", "format=duration",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    str(file_path)
                ],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                return float(result.stdout.strip())
        except Exception:
            pass
        return 0.0

