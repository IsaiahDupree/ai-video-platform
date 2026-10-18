"""
Meme Adapter
============
Adapter for meme templates from various sources.
"""

import logging
import os
import shutil
from pathlib import Path
from typing import Dict, Any, List, Optional

from .base import VisualsAdapter
from services.visuals.models import VisualsSearchCriteria, VisualsResponse, VisualsType

logger = logging.getLogger(__name__)


class MemeAdapter(VisualsAdapter):
    """
    Adapter for meme templates.
    
    Supports:
        - Local meme template library
        - RapidAPI for trending memes from social platforms
    """
    
    def __init__(self, meme_dir: Optional[str] = None, rapidapi_key: Optional[str] = None):
        """
        Initialize meme adapter.
        
        Args:
            meme_dir: Directory containing meme templates (default: data/memes)
            rapidapi_key: RapidAPI key for social platform memes
        """
        if meme_dir is None:
            meme_dir = "data/memes"
        self.meme_dir = Path(meme_dir)
        self.meme_dir.mkdir(parents=True, exist_ok=True)
        
        self.rapidapi_key = rapidapi_key or os.getenv("RAPIDAPI_KEY")
    
    def get_source_name(self) -> str:
        return "meme"
    
    def supports_search(self) -> bool:
        return True
    
    async def search_visuals(
        self,
        visuals_type: VisualsType,
        criteria: VisualsSearchCriteria,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for meme templates.
        
        First searches local library, then RapidAPI if enabled.
        """
        results = []
        
        # Search local meme library
        if self.meme_dir.exists():
            image_extensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"]
            for ext in image_extensions:
                for file_path in self.meme_dir.rglob(f"*{ext}"):
                    # Check if matches criteria
                    if self._matches_criteria(file_path, criteria):
                        results.append({
                            "asset_id": str(file_path.relative_to(self.meme_dir)),
                            "title": file_path.stem,
                            "path": str(file_path),
                            "source": "local",
                            "type": "meme"
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
        Get meme template.
        
        Args:
            asset_id: Relative path within meme directory or RapidAPI asset ID
            output_path: Optional output path
        """
        # Check if it's a local file
        source_path = self.meme_dir / asset_id
        
        if source_path.exists():
            # Local file
            if output_path:
                output_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source_path, output_path)
                visuals_path = str(output_path)
            else:
                visuals_path = str(source_path)
            
            return VisualsResponse(
                job_id=asset_id,
                success=True,
                visuals_path=visuals_path,
                visuals_type="meme",
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
        """Search for trending memes via RapidAPI (Meme API)."""
        if not self.rapidapi_key:
            logger.debug("No RapidAPI key configured; skipping meme API search")
            return []

        try:
            import aiohttp

            headers = {
                "X-RapidAPI-Key": self.rapidapi_key,
                "X-RapidAPI-Host": "meme-api.p.rapidapi.com",
            }

            url = f"https://meme-api.p.rapidapi.com/gimme/{limit}"

            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url, headers=headers,
                    timeout=aiohttp.ClientTimeout(total=15)
                ) as resp:
                    if resp.status != 200:
                        logger.warning(f"RapidAPI meme search returned {resp.status}")
                        return []

                    data = await resp.json()
                    memes = data.get("memes", [])

                    results = []
                    for meme in memes[:limit]:
                        preview = meme.get("preview", [])
                        preview_url = preview[0] if isinstance(preview, list) and preview else meme.get("url", "")
                        results.append({
                            "asset_id": meme.get("postLink", meme.get("title", "")),
                            "title": meme.get("title", "Untitled"),
                            "url": meme.get("url", ""),
                            "preview_url": preview_url,
                            "subreddit": meme.get("subreddit", ""),
                            "source": "rapidapi_meme",
                            "type": "meme",
                            "nsfw": meme.get("nsfw", False),
                        })

                    return results

        except ImportError:
            logger.warning("aiohttp not installed; RapidAPI meme search unavailable")
            return []
        except Exception as e:
            logger.error(f"RapidAPI meme search failed: {e}")
            return []

    async def _get_from_rapidapi(
        self,
        asset_id: str,
        output_path: Optional[Path]
    ) -> VisualsResponse:
        """Download meme image from a URL (RapidAPI asset_id is the image URL)."""
        if not self.rapidapi_key:
            return VisualsResponse(
                job_id=asset_id,
                success=False,
                error="No RapidAPI key configured"
            )

        try:
            import aiohttp

            url = asset_id if asset_id.startswith("http") else f"https://i.redd.it/{asset_id}"

            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                    if resp.status != 200:
                        return VisualsResponse(
                            job_id=asset_id,
                            success=False,
                            error=f"Download failed with status {resp.status}"
                        )

                    content = await resp.read()

                    if output_path:
                        output_path.parent.mkdir(parents=True, exist_ok=True)
                        output_path.write_bytes(content)
                        visuals_path = str(output_path)
                    else:
                        import tempfile
                        ext = Path(url).suffix or ".jpg"
                        tmp = Path(tempfile.mktemp(suffix=ext))
                        tmp.write_bytes(content)
                        visuals_path = str(tmp)

                    return VisualsResponse(
                        job_id=asset_id,
                        success=True,
                        visuals_path=visuals_path,
                        visuals_type="meme",
                        source="rapidapi_meme"
                    )

        except ImportError:
            return VisualsResponse(
                job_id=asset_id,
                success=False,
                error="aiohttp not installed"
            )
        except Exception as e:
            logger.error(f"RapidAPI meme download failed: {e}")
            return VisualsResponse(
                job_id=asset_id,
                success=False,
                error=str(e)
            )
    
    def _matches_criteria(self, file_path: Path, criteria: VisualsSearchCriteria) -> bool:
        """Check if meme file matches criteria."""
        filename = file_path.stem.lower()
        
        # Check keywords
        if criteria.keywords:
            if not any(keyword.lower() in filename for keyword in criteria.keywords):
                return False
        
        # Check mood/style in filename
        if criteria.mood and criteria.mood.lower() not in filename:
            return False
        if criteria.style and criteria.style.lower() not in filename:
            return False
        
        return True

