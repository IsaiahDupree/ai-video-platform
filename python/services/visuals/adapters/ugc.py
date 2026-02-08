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
        """Search for UGC via RapidAPI (Pexels API for stock UGC-style content)."""
        if not self.rapidapi_key:
            logger.debug("No RapidAPI key configured; skipping UGC API search")
            return []

        try:
            import aiohttp

            headers = {
                "X-RapidAPI-Key": self.rapidapi_key,
                "X-RapidAPI-Host": "pexels.p.rapidapi.com",
                "Authorization": self.rapidapi_key,
            }

            # Build query from criteria keywords with UGC-style modifiers
            base_query = " ".join(criteria.keywords) if criteria.keywords else "lifestyle"
            query = f"{base_query} authentic"
            if criteria.platform == "tiktok":
                query += " selfie vertical"
            elif criteria.platform == "instagram":
                query += " lifestyle portrait"

            # Search both photos and videos
            results = []

            async with aiohttp.ClientSession() as session:
                # Search videos first (more useful for UGC)
                async with session.get(
                    "https://pexels.p.rapidapi.com/videos/search",
                    headers=headers,
                    params={"query": query, "per_page": str(limit), "orientation": "portrait"},
                    timeout=aiohttp.ClientTimeout(total=15),
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        for video in data.get("videos", [])[:limit]:
                            files = video.get("video_files", [])
                            best_file = max(files, key=lambda f: f.get("width", 0)) if files else {}
                            results.append({
                                "asset_id": f"video:{video.get('id', '')}",
                                "title": video.get("url", "").split("/")[-2] if video.get("url") else "untitled",
                                "url": best_file.get("link", ""),
                                "preview_url": video.get("image", ""),
                                "duration": video.get("duration", 0),
                                "type": "video",
                                "source": "rapidapi_pexels_ugc",
                                "user": video.get("user", {}).get("name", ""),
                            })

                # Fill remaining with photos
                remaining = limit - len(results)
                if remaining > 0:
                    async with session.get(
                        "https://pexels.p.rapidapi.com/v1/search",
                        headers=headers,
                        params={"query": query, "per_page": str(remaining), "orientation": "portrait"},
                        timeout=aiohttp.ClientTimeout(total=15),
                    ) as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            for photo in data.get("photos", [])[:remaining]:
                                src = photo.get("src", {})
                                results.append({
                                    "asset_id": f"photo:{photo.get('id', '')}",
                                    "title": photo.get("alt", "untitled"),
                                    "url": src.get("original", ""),
                                    "preview_url": src.get("medium", ""),
                                    "type": "image",
                                    "source": "rapidapi_pexels_ugc",
                                    "user": photo.get("photographer", ""),
                                })

            return results[:limit]

        except ImportError:
            logger.warning("aiohttp not installed; RapidAPI UGC search unavailable")
            return []
        except Exception as e:
            logger.error(f"RapidAPI UGC search failed: {e}")
            return []

    async def _get_from_rapidapi(
        self,
        asset_id: str,
        output_path: Optional[Path]
    ) -> VisualsResponse:
        """Download UGC content from Pexels via RapidAPI."""
        if not self.rapidapi_key:
            return VisualsResponse(
                job_id=asset_id,
                success=False,
                error="No RapidAPI key configured"
            )

        try:
            import aiohttp

            headers = {
                "X-RapidAPI-Key": self.rapidapi_key,
                "X-RapidAPI-Host": "pexels.p.rapidapi.com",
                "Authorization": self.rapidapi_key,
            }

            # Parse asset type from ID (video:123 or photo:123)
            asset_type, pexels_id = "photo", asset_id
            if ":" in asset_id:
                asset_type, pexels_id = asset_id.split(":", 1)

            async with aiohttp.ClientSession() as session:
                if asset_type == "video":
                    async with session.get(
                        f"https://pexels.p.rapidapi.com/videos/videos/{pexels_id}",
                        headers=headers,
                        timeout=aiohttp.ClientTimeout(total=15),
                    ) as resp:
                        if resp.status != 200:
                            return VisualsResponse(
                                job_id=asset_id, success=False,
                                error=f"Lookup failed: {resp.status}"
                            )
                        data = await resp.json()
                        files = data.get("video_files", [])
                        if not files:
                            return VisualsResponse(
                                job_id=asset_id, success=False,
                                error="No video files"
                            )
                        best = max(files, key=lambda f: f.get("width", 0))
                        download_url = best.get("link", "")
                        ext = ".mp4"
                        duration = data.get("duration", 0)
                else:
                    async with session.get(
                        f"https://pexels.p.rapidapi.com/v1/photos/{pexels_id}",
                        headers=headers,
                        timeout=aiohttp.ClientTimeout(total=15),
                    ) as resp:
                        if resp.status != 200:
                            return VisualsResponse(
                                job_id=asset_id, success=False,
                                error=f"Lookup failed: {resp.status}"
                            )
                        data = await resp.json()
                        download_url = data.get("src", {}).get("original", "")
                        ext = ".jpg"
                        duration = None

                if not download_url:
                    return VisualsResponse(
                        job_id=asset_id, success=False,
                        error="No download URL"
                    )

                # Download content
                async with session.get(
                    download_url,
                    timeout=aiohttp.ClientTimeout(total=120),
                ) as dl_resp:
                    if dl_resp.status != 200:
                        return VisualsResponse(
                            job_id=asset_id, success=False,
                            error=f"Download failed: {dl_resp.status}"
                        )

                    content = await dl_resp.read()
                    if output_path:
                        output_path.parent.mkdir(parents=True, exist_ok=True)
                        output_path.write_bytes(content)
                        visuals_path = str(output_path)
                    else:
                        import tempfile
                        tmp = Path(tempfile.mktemp(suffix=ext))
                        tmp.write_bytes(content)
                        visuals_path = str(tmp)

                    return VisualsResponse(
                        job_id=asset_id,
                        success=True,
                        visuals_path=visuals_path,
                        visuals_type="video" if asset_type == "video" else "image",
                        duration_seconds=float(duration) if duration else None,
                        source="rapidapi_pexels_ugc"
                    )

        except ImportError:
            return VisualsResponse(
                job_id=asset_id, success=False,
                error="aiohttp not installed"
            )
        except Exception as e:
            logger.error(f"RapidAPI UGC download failed: {e}")
            return VisualsResponse(
                job_id=asset_id, success=False,
                error=str(e)
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

