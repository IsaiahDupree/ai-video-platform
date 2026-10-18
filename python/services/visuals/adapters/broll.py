"""
B-roll Adapter
==============
Adapter for B-roll footage from various sources.
"""

import logging
import os
import shutil
from pathlib import Path
from typing import Dict, Any, List, Optional

from .base import VisualsAdapter
from services.visuals.models import VisualsSearchCriteria, VisualsResponse, VisualsType

logger = logging.getLogger(__name__)


class BrollAdapter(VisualsAdapter):
    """
    Adapter for B-roll footage.
    
    Supports:
        - Local B-roll library
        - RapidAPI for trending B-roll from social platforms
        - MediaPoster media library
    """
    
    def __init__(
        self,
        broll_dir: Optional[str] = None,
        rapidapi_key: Optional[str] = None
    ):
        """
        Initialize B-roll adapter.
        
        Args:
            broll_dir: Directory containing B-roll footage (default: data/broll)
            rapidapi_key: RapidAPI key for social platform B-roll
        """
        if broll_dir is None:
            broll_dir = "data/broll"
        self.broll_dir = Path(broll_dir)
        self.broll_dir.mkdir(parents=True, exist_ok=True)
        
        self.rapidapi_key = rapidapi_key or os.getenv("RAPIDAPI_KEY")
    
    def get_source_name(self) -> str:
        return "broll"
    
    def supports_search(self) -> bool:
        return True
    
    async def search_visuals(
        self,
        visuals_type: VisualsType,
        criteria: VisualsSearchCriteria,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for B-roll footage.
        
        First searches local library, then RapidAPI if enabled.
        """
        results = []
        
        # Search local B-roll library
        if self.broll_dir.exists():
            video_extensions = [".mp4", ".mov", ".avi", ".mkv", ".webm"]
            for ext in video_extensions:
                for file_path in self.broll_dir.rglob(f"*{ext}"):
                    # Check if matches criteria
                    if self._matches_criteria(file_path, criteria):
                        # Get duration (simplified - would use video library in production)
                        duration = self._get_video_duration(file_path)
                        
                        results.append({
                            "asset_id": str(file_path.relative_to(self.broll_dir)),
                            "title": file_path.stem,
                            "path": str(file_path),
                            "duration": duration,
                            "source": "local",
                            "type": "broll"
                        })
                        
                        if len(results) >= limit:
                            break
        
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
        Get B-roll footage.
        
        Args:
            asset_id: Relative path within B-roll directory or RapidAPI asset ID
            output_path: Optional output path
        """
        # Check if it's a local file
        source_path = self.broll_dir / asset_id
        
        if source_path.exists():
            # Local file
            if output_path:
                output_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source_path, output_path)
                visuals_path = str(output_path)
            else:
                visuals_path = str(source_path)
            
            duration = self._get_video_duration(source_path)
            
            return VisualsResponse(
                job_id=asset_id,
                success=True,
                visuals_path=visuals_path,
                visuals_type="broll",
                duration_seconds=duration,
                source="local"
            )
        else:
            # Try RapidAPI
            return await self._get_from_rapidapi(asset_id, output_path)
    
    async def _search_rapidapi(
        self,
        criteria: VisualsSearchCriteria,
        limit: int
    ) -> List[Dict[str, Any]]:
        """Search for B-roll via RapidAPI (Pexels Video API)."""
        if not self.rapidapi_key:
            logger.debug("No RapidAPI key configured; skipping B-roll API search")
            return []

        try:
            import aiohttp

            headers = {
                "X-RapidAPI-Key": self.rapidapi_key,
                "X-RapidAPI-Host": "pexels.p.rapidapi.com",
                "Authorization": self.rapidapi_key,
            }

            query = " ".join(criteria.keywords) if criteria.keywords else "cinematic"
            params = {
                "query": query,
                "per_page": str(limit),
                "orientation": "portrait" if criteria.aspect_ratio == "9:16" else "landscape",
            }

            async with aiohttp.ClientSession() as session:
                async with session.get(
                    "https://pexels.p.rapidapi.com/videos/search",
                    headers=headers,
                    params=params,
                    timeout=aiohttp.ClientTimeout(total=15),
                ) as resp:
                    if resp.status != 200:
                        logger.warning(f"RapidAPI B-roll search returned {resp.status}")
                        return []

                    data = await resp.json()
                    videos = data.get("videos", [])

                    results = []
                    for video in videos[:limit]:
                        # Get the best quality video file
                        files = video.get("video_files", [])
                        best_file = max(files, key=lambda f: f.get("width", 0)) if files else {}

                        results.append({
                            "asset_id": str(video.get("id", "")),
                            "title": video.get("url", "").split("/")[-2] if video.get("url") else "untitled",
                            "url": best_file.get("link", ""),
                            "preview_url": video.get("image", ""),
                            "duration": video.get("duration", 0),
                            "width": best_file.get("width", 0),
                            "height": best_file.get("height", 0),
                            "source": "rapidapi_pexels",
                            "type": "broll",
                            "user": video.get("user", {}).get("name", ""),
                        })

                    return results

        except ImportError:
            logger.warning("aiohttp not installed; RapidAPI B-roll search unavailable")
            return []
        except Exception as e:
            logger.error(f"RapidAPI B-roll search failed: {e}")
            return []

    async def _get_from_rapidapi(
        self,
        asset_id: str,
        output_path: Optional[Path]
    ) -> VisualsResponse:
        """Download B-roll video from Pexels via RapidAPI."""
        if not self.rapidapi_key:
            return VisualsResponse(
                job_id=asset_id,
                success=False,
                error="No RapidAPI key configured"
            )

        try:
            import aiohttp

            # First, look up the video to get the download URL
            headers = {
                "X-RapidAPI-Key": self.rapidapi_key,
                "X-RapidAPI-Host": "pexels.p.rapidapi.com",
                "Authorization": self.rapidapi_key,
            }

            async with aiohttp.ClientSession() as session:
                # Get video details
                async with session.get(
                    f"https://pexels.p.rapidapi.com/videos/videos/{asset_id}",
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=15),
                ) as resp:
                    if resp.status != 200:
                        return VisualsResponse(
                            job_id=asset_id,
                            success=False,
                            error=f"Video lookup failed with status {resp.status}"
                        )

                    data = await resp.json()
                    files = data.get("video_files", [])
                    if not files:
                        return VisualsResponse(
                            job_id=asset_id,
                            success=False,
                            error="No video files found"
                        )

                    best_file = max(files, key=lambda f: f.get("width", 0))
                    download_url = best_file.get("link", "")

                if not download_url:
                    return VisualsResponse(
                        job_id=asset_id,
                        success=False,
                        error="No download URL"
                    )

                # Download the video
                async with session.get(
                    download_url,
                    timeout=aiohttp.ClientTimeout(total=120),
                ) as dl_resp:
                    if dl_resp.status != 200:
                        return VisualsResponse(
                            job_id=asset_id,
                            success=False,
                            error=f"Download failed with status {dl_resp.status}"
                        )

                    content = await dl_resp.read()

                    if output_path:
                        output_path.parent.mkdir(parents=True, exist_ok=True)
                        output_path.write_bytes(content)
                        visuals_path = str(output_path)
                    else:
                        import tempfile
                        tmp = Path(tempfile.mktemp(suffix=".mp4"))
                        tmp.write_bytes(content)
                        visuals_path = str(tmp)

                    duration = data.get("duration", 0)

                    return VisualsResponse(
                        job_id=asset_id,
                        success=True,
                        visuals_path=visuals_path,
                        visuals_type="broll",
                        duration_seconds=float(duration),
                        source="rapidapi_pexels"
                    )

        except ImportError:
            return VisualsResponse(
                job_id=asset_id,
                success=False,
                error="aiohttp not installed"
            )
        except Exception as e:
            logger.error(f"RapidAPI B-roll download failed: {e}")
            return VisualsResponse(
                job_id=asset_id,
                success=False,
                error=str(e)
            )
    
    def _matches_criteria(self, file_path: Path, criteria: VisualsSearchCriteria) -> bool:
        """Check if B-roll file matches criteria."""
        filename = file_path.stem.lower()
        
        # Check keywords
        if criteria.keywords:
            if not any(keyword.lower() in filename for keyword in criteria.keywords):
                return False
        
        # Check aspect ratio in filename or metadata
        if criteria.aspect_ratio:
            # Would check video metadata in production
            pass
        
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

