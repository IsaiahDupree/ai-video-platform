"""
Sora Runner

Executes Sora video generation jobs with caching, polling, and concurrency control.
"""

import os
import json
import asyncio
import hashlib
from pathlib import Path
from typing import Optional
import aiohttp
from loguru import logger

from .types import ShotPlanV1, AssetManifestV1, Clip, Shot


OPENAI_BASE = "https://api.openai.com/v1"


class SoraRunner:
    """
    Runner for Sora video generation jobs.
    
    Handles:
    - Creating video generation jobs
    - Polling for completion
    - Downloading content
    - Caching by prompt hash
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        cache_dir: Optional[str] = None,
        concurrency: int = 3,
        poll_interval: float = 2.0,
    ):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        self.cache_dir = Path(cache_dir) if cache_dir else Path("sora_cache")
        self.concurrency = concurrency
        self.poll_interval = poll_interval
        
        if not self.api_key:
            logger.warning("No OpenAI API key provided for Sora runner")
    
    async def _request(
        self,
        session: aiohttp.ClientSession,
        method: str,
        endpoint: str,
        **kwargs,
    ) -> dict:
        """Make an authenticated request to OpenAI."""
        url = f"{OPENAI_BASE}{endpoint}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        async with session.request(method, url, headers=headers, **kwargs) as resp:
            if not resp.ok:
                text = await resp.text()
                raise Exception(f"OpenAI API error {resp.status}: {text[:200]}")
            
            if resp.content_type == "application/json":
                return await resp.json()
            else:
                return {"content": await resp.read()}
    
    async def create_video_job(
        self,
        session: aiohttp.ClientSession,
        shot: Shot,
        reference_file_ids: Optional[list[str]] = None,
    ) -> str:
        """
        Create a Sora video generation job.
        
        Returns:
            Job ID
        """
        body = {
            "model": shot.model,
            "prompt": shot.prompt,
            "seconds": shot.seconds,
            "size": shot.size,
        }
        
        if reference_file_ids:
            body["reference_file_ids"] = reference_file_ids
        
        result = await self._request(
            session,
            "POST",
            "/videos",
            json=body,
        )
        
        return result["id"]
    
    async def poll_video_job(
        self,
        session: aiohttp.ClientSession,
        job_id: str,
    ) -> dict:
        """
        Poll a video job until completion.
        
        Returns:
            Completed job data
        """
        while True:
            result = await self._request(
                session,
                "GET",
                f"/videos/{job_id}",
            )
            
            status = result.get("status")
            
            if status == "completed":
                return result
            elif status == "failed":
                raise Exception(f"Sora job {job_id} failed: {result.get('error', 'Unknown')}")
            
            await asyncio.sleep(self.poll_interval)
    
    async def download_video_content(
        self,
        session: aiohttp.ClientSession,
        job_id: str,
    ) -> bytes:
        """
        Download the video content for a completed job.
        
        Returns:
            Video bytes
        """
        result = await self._request(
            session,
            "GET",
            f"/videos/{job_id}/content",
        )
        
        return result.get("content", b"")
    
    def get_cache_path(self, cache_key: str) -> Path:
        """Get the cache file path for a cache key."""
        return self.cache_dir / f"{cache_key}.mp4"
    
    def is_cached(self, cache_key: str) -> bool:
        """Check if a shot is cached."""
        return self.get_cache_path(cache_key).exists()
    
    async def generate_shot(
        self,
        session: aiohttp.ClientSession,
        shot: Shot,
        reference_file_ids: Optional[list[str]] = None,
    ) -> Clip:
        """
        Generate a single shot (with caching).
        
        Returns:
            Clip with source path
        """
        cache_path = self.get_cache_path(shot.cache_key)
        
        # Check cache
        if cache_path.exists():
            logger.info(f"Cache hit for shot {shot.id}")
            return Clip(
                shot_id=shot.id,
                beat_id=shot.from_beat_id,
                src=str(cache_path),
                seconds=shot.seconds,
                has_audio=True,
            )
        
        # Generate
        logger.info(f"Generating shot {shot.id} with Sora...")
        
        job_id = await self.create_video_job(session, shot, reference_file_ids)
        logger.info(f"Created job {job_id} for shot {shot.id}")
        
        await self.poll_video_job(session, job_id)
        logger.info(f"Job {job_id} completed")
        
        content = await self.download_video_content(session, job_id)
        
        # Save to cache
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        cache_path.write_bytes(content)
        logger.info(f"Saved shot {shot.id} to {cache_path}")
        
        return Clip(
            shot_id=shot.id,
            beat_id=shot.from_beat_id,
            src=str(cache_path),
            seconds=shot.seconds,
            has_audio=True,
        )
    
    async def run_shot_plan(
        self,
        shot_plan: ShotPlanV1,
        public_base_url: Optional[str] = None,
    ) -> AssetManifestV1:
        """
        Run a complete shot plan with concurrency control.
        
        Args:
            shot_plan: The shot plan to execute
            public_base_url: Optional URL prefix for clips (for cloud storage)
            
        Returns:
            AssetManifestV1 with generated clips
        """
        reference_file_ids = (
            shot_plan.references.file_ids
            if shot_plan.references
            else None
        )
        
        semaphore = asyncio.Semaphore(self.concurrency)
        
        async def generate_with_limit(shot: Shot) -> Clip:
            async with semaphore:
                async with aiohttp.ClientSession() as session:
                    clip = await self.generate_shot(session, shot, reference_file_ids)
                    
                    # Optionally replace local path with public URL
                    if public_base_url:
                        filename = Path(clip.src).name
                        clip = Clip(
                            shot_id=clip.shot_id,
                            beat_id=clip.beat_id,
                            src=f"{public_base_url}/{filename}",
                            seconds=clip.seconds,
                            has_audio=clip.has_audio,
                        )
                    
                    return clip
        
        # Generate all shots concurrently
        tasks = [generate_with_limit(shot) for shot in shot_plan.shots]
        clips = await asyncio.gather(*tasks)
        
        return AssetManifestV1(clips=list(clips))


async def run_sora_shot_plan(
    shot_plan: ShotPlanV1,
    api_key: Optional[str] = None,
    out_dir: str = "sora_cache",
    concurrency: int = 3,
    public_base_url: Optional[str] = None,
) -> AssetManifestV1:
    """
    Convenience function to run a shot plan.
    
    Args:
        shot_plan: The shot plan
        api_key: OpenAI API key
        out_dir: Output/cache directory
        concurrency: Max concurrent jobs
        public_base_url: Optional URL prefix
        
    Returns:
        AssetManifestV1
    """
    runner = SoraRunner(
        api_key=api_key,
        cache_dir=out_dir,
        concurrency=concurrency,
    )
    
    return await runner.run_shot_plan(shot_plan, public_base_url)


def run_sora_shot_plan_sync(
    shot_plan: ShotPlanV1,
    api_key: Optional[str] = None,
    out_dir: str = "sora_cache",
    concurrency: int = 3,
    public_base_url: Optional[str] = None,
) -> AssetManifestV1:
    """Synchronous version of run_sora_shot_plan."""
    return asyncio.run(run_sora_shot_plan(
        shot_plan=shot_plan,
        api_key=api_key,
        out_dir=out_dir,
        concurrency=concurrency,
        public_base_url=public_base_url,
    ))


def get_cached_shots(
    shot_plan: ShotPlanV1,
    cache_dir: str = "sora_cache",
) -> tuple[list[Shot], list[Shot]]:
    """
    Split shots into cached and uncached.
    
    Args:
        shot_plan: The shot plan
        cache_dir: Cache directory
        
    Returns:
        Tuple of (cached_shots, uncached_shots)
    """
    cache_path = Path(cache_dir)
    cached = []
    uncached = []
    
    for shot in shot_plan.shots:
        if (cache_path / f"{shot.cache_key}.mp4").exists():
            cached.append(shot)
        else:
            uncached.append(shot)
    
    return cached, uncached


def estimate_generation_cost(
    shot_plan: ShotPlanV1,
    cache_dir: str = "sora_cache",
    cost_per_second: float = 0.05,
) -> dict:
    """
    Estimate the cost to generate a shot plan.
    
    Args:
        shot_plan: The shot plan
        cache_dir: Cache directory (for cache check)
        cost_per_second: Cost per second of video
        
    Returns:
        Dict with cost breakdown
    """
    cached, uncached = get_cached_shots(shot_plan, cache_dir)
    
    cached_seconds = sum(s.seconds for s in cached)
    uncached_seconds = sum(s.seconds for s in uncached)
    total_seconds = cached_seconds + uncached_seconds
    
    return {
        "total_shots": len(shot_plan.shots),
        "cached_shots": len(cached),
        "uncached_shots": len(uncached),
        "total_seconds": total_seconds,
        "cached_seconds": cached_seconds,
        "uncached_seconds": uncached_seconds,
        "estimated_cost_usd": uncached_seconds * cost_per_second,
        "savings_from_cache_usd": cached_seconds * cost_per_second,
    }
