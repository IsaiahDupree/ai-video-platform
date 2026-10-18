"""
Sora Video Provider
===================
OpenAI Sora API adapter for video generation.

Supports:
- Text-to-video generation
- Image-to-video (with reference)
- Remix/iteration on existing clips
- Models: sora-2, sora-2-pro
- Durations: 4s, 8s, 12s
"""

import asyncio
import base64
import logging
import os
from datetime import datetime
from typing import Any, Dict, Optional

import httpx

from .base import (
    VideoProviderAdapter,
    ProviderConfig,
    ProviderName,
    ClipStatus,
    AssetKind,
    AssetOutput,
    CreateClipInput,
    RemixClipInput,
    ProviderGeneration,
    ProviderError,
)

logger = logging.getLogger(__name__)

# Sora API constants
SORA_API_BASE = "https://api.openai.com/v1"
ALLOWED_MODELS = {"sora-2", "sora-2-pro"}
ALLOWED_SIZES = {"720x1280", "1280x720", "1024x1792", "1792x1024"}
ALLOWED_SECONDS = {4, 8, 12}


class SoraProvider(VideoProviderAdapter):
    """
    OpenAI Sora video generation provider.
    
    Uses the OpenAI Video API to generate and remix video clips.
    """
    
    def __init__(self, config: Optional[ProviderConfig] = None):
        super().__init__(config)
        self._client: Optional[httpx.AsyncClient] = None
        
        # Override config for Sora-specific settings
        if self.config.provider != ProviderName.SORA:
            self.config.provider = ProviderName.SORA
        
        # Get API key from env if not in config
        if not self.config.api_key:
            self.config.api_key = os.getenv("OPENAI_API_KEY") or os.getenv("SORA_API_KEY")
    
    @property
    def name(self) -> ProviderName:
        return ProviderName.SORA
    
    def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=SORA_API_BASE,
                headers={
                    "Authorization": f"Bearer {self.config.api_key}",
                    "Content-Type": "application/json",
                },
                timeout=httpx.Timeout(60.0, connect=10.0)
            )
        return self._client
    
    async def close(self):
        """Close HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None
    
    def _validate_model(self, model: str) -> str:
        """Validate and normalize model name."""
        if model not in ALLOWED_MODELS:
            logger.warning(f"Invalid model '{model}', falling back to sora-2")
            return "sora-2"
        return model
    
    def _validate_size(self, size: str) -> str:
        """Validate and normalize size."""
        if size not in ALLOWED_SIZES:
            logger.warning(f"Invalid size '{size}', falling back to 1280x720")
            return "1280x720"
        return size
    
    def _validate_seconds(self, seconds: int) -> int:
        """Validate and normalize duration."""
        if seconds not in ALLOWED_SECONDS:
            # Round to nearest allowed value
            if seconds < 6:
                return 4
            elif seconds < 10:
                return 8
            else:
                return 12
        return seconds
    
    def _parse_status(self, status_str: str) -> ClipStatus:
        """Parse API status string to ClipStatus."""
        status_map = {
            "queued": ClipStatus.QUEUED,
            "in_progress": ClipStatus.RUNNING,
            "processing": ClipStatus.RUNNING,
            "running": ClipStatus.RUNNING,
            "completed": ClipStatus.SUCCEEDED,
            "succeeded": ClipStatus.SUCCEEDED,
            "failed": ClipStatus.FAILED,
            "canceled": ClipStatus.CANCELED,
            "cancelled": ClipStatus.CANCELED,
        }
        return status_map.get(status_str.lower(), ClipStatus.QUEUED)
    
    def _parse_generation_response(
        self,
        data: Dict[str, Any],
        fallback_prompt: str = "",
        fallback_model: str = "sora-2",
        fallback_size: str = "1280x720",
        fallback_seconds: int = 8
    ) -> ProviderGeneration:
        """Parse API response into ProviderGeneration."""
        # Extract ID
        gen_id = data.get("id") or data.get("video_id") or ""
        
        # Extract status
        status_str = data.get("status") or data.get("state") or "queued"
        status = self._parse_status(status_str)
        
        # Extract timestamps
        created_at = datetime.utcnow()
        if "created_at" in data:
            try:
                ts = data["created_at"]
                if isinstance(ts, (int, float)):
                    created_at = datetime.utcfromtimestamp(ts)
            except Exception:
                pass
        
        completed_at = None
        if status == ClipStatus.SUCCEEDED:
            completed_at = datetime.utcnow()
            if "completed_at" in data:
                try:
                    ts = data["completed_at"]
                    if isinstance(ts, (int, float)):
                        completed_at = datetime.utcfromtimestamp(ts)
                except Exception:
                    pass
        
        # Extract error
        error = None
        if "error" in data and data["error"]:
            err_data = data["error"]
            if isinstance(err_data, dict):
                error = ProviderError(
                    code=err_data.get("code", "unknown"),
                    message=err_data.get("message", str(err_data)),
                    raw=err_data
                )
            else:
                error = ProviderError(message=str(err_data))
        
        # Extract outputs
        outputs = []
        download_url = None
        thumbnail_url = None
        
        # Check various URL locations in response
        if "download_url" in data:
            download_url = data["download_url"]
        elif "content_url" in data:
            download_url = data["content_url"]
        
        if "thumbnail_url" in data:
            thumbnail_url = data["thumbnail_url"]
        
        # Check assets structure
        if "assets" in data:
            assets = data["assets"]
            if isinstance(assets, dict):
                if "video" in assets and isinstance(assets["video"], dict):
                    download_url = download_url or assets["video"].get("download_url")
                if "thumbnail" in assets and isinstance(assets["thumbnail"], dict):
                    thumbnail_url = thumbnail_url or assets["thumbnail"].get("url")
            elif isinstance(assets, list):
                for asset in assets:
                    if isinstance(asset, dict):
                        if asset.get("type") == "video":
                            download_url = download_url or asset.get("url")
                        elif asset.get("type") == "thumbnail":
                            thumbnail_url = thumbnail_url or asset.get("url")
        
        if download_url:
            outputs.append(AssetOutput(
                kind=AssetKind.VIDEO_MP4,
                url=download_url,
                content_type="video/mp4"
            ))
        
        return ProviderGeneration(
            provider=ProviderName.SORA,
            provider_generation_id=gen_id,
            status=status,
            created_at=created_at,
            updated_at=datetime.utcnow(),
            completed_at=completed_at,
            error=error,
            outputs=outputs,
            raw=data,
            prompt=data.get("prompt", fallback_prompt),
            model=data.get("model", fallback_model),
            size=data.get("size", fallback_size),
            seconds=data.get("seconds", fallback_seconds),
            download_url=download_url,
            thumbnail_url=thumbnail_url
        )
    
    async def create_clip(self, input: CreateClipInput) -> ProviderGeneration:
        """
        Create a new video clip with Sora.
        
        Args:
            input: CreateClipInput with prompt and settings
        
        Returns:
            ProviderGeneration with job ID
        """
        client = self._get_client()
        
        # Validate inputs
        model = self._validate_model(input.model)
        size = self._validate_size(input.size)
        seconds = self._validate_seconds(input.seconds)
        
        # Build request payload (per OpenAI Sora API docs)
        payload: Dict[str, Any] = {
            "model": model,
            "prompt": input.prompt,
            "size": size,
            "seconds": str(seconds),  # API expects string
        }
        
        # Add image reference if provided
        if input.references:
            for ref in input.references:
                if ref.type == "image" and ref.url:
                    # If URL is base64 data, use it directly
                    if ref.url.startswith("data:"):
                        payload["input_image"] = ref.url
                    else:
                        payload["input_image_url"] = ref.url
                    break
        
        logger.info(f"Creating Sora clip: model={model}, size={size}, duration={seconds}s")
        
        try:
            response = await client.post("/videos", json=payload)
            response.raise_for_status()
            data = response.json()
            
            return self._parse_generation_response(
                data,
                fallback_prompt=input.prompt,
                fallback_model=model,
                fallback_size=size,
                fallback_seconds=seconds
            )
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Sora API error: {e.response.status_code} - {e.response.text}")
            return ProviderGeneration(
                provider=ProviderName.SORA,
                provider_generation_id="",
                status=ClipStatus.FAILED,
                error=ProviderError(
                    code=str(e.response.status_code),
                    message=e.response.text,
                    raw={"status_code": e.response.status_code}
                ),
                prompt=input.prompt,
                model=model,
                size=size,
                seconds=seconds
            )
        except Exception as e:
            logger.error(f"Sora create_clip error: {e}")
            return ProviderGeneration(
                provider=ProviderName.SORA,
                provider_generation_id="",
                status=ClipStatus.FAILED,
                error=ProviderError(
                    code="client_error",
                    message=str(e)
                ),
                prompt=input.prompt,
                model=model,
                size=size,
                seconds=seconds
            )
    
    async def remix_clip(self, input: RemixClipInput) -> ProviderGeneration:
        """
        Remix an existing Sora video.
        
        Args:
            input: RemixClipInput with source ID and modifications
        
        Returns:
            ProviderGeneration with new job ID
        """
        client = self._get_client()
        
        # Build request payload (per OpenAI Sora API docs)
        payload: Dict[str, Any] = {
            "prompt": input.prompt_delta,
        }
        
        logger.info(f"Remixing Sora clip: source={input.source_generation_id}")
        
        try:
            # Remix endpoint is POST /videos/{video_id}/remix
            response = await client.post(f"/videos/{input.source_generation_id}/remix", json=payload)
            response.raise_for_status()
            data = response.json()
            
            return self._parse_generation_response(data)
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Sora remix API error: {e.response.status_code}")
            return ProviderGeneration(
                provider=ProviderName.SORA,
                provider_generation_id="",
                status=ClipStatus.FAILED,
                error=ProviderError(
                    code=str(e.response.status_code),
                    message=e.response.text
                )
            )
        except Exception as e:
            logger.error(f"Sora remix_clip error: {e}")
            return ProviderGeneration(
                provider=ProviderName.SORA,
                provider_generation_id="",
                status=ClipStatus.FAILED,
                error=ProviderError(
                    code="client_error",
                    message=str(e)
                )
            )
    
    async def get_generation(self, generation_id: str) -> ProviderGeneration:
        """
        Get status of a Sora generation.
        
        Args:
            generation_id: Sora video ID
        
        Returns:
            ProviderGeneration with current status
        """
        client = self._get_client()
        
        try:
            response = await client.get(f"/videos/{generation_id}")
            response.raise_for_status()
            data = response.json()
            
            return self._parse_generation_response(data)
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Sora get_generation error: {e.response.status_code}")
            return ProviderGeneration(
                provider=ProviderName.SORA,
                provider_generation_id=generation_id,
                status=ClipStatus.FAILED,
                error=ProviderError(
                    code=str(e.response.status_code),
                    message=e.response.text
                )
            )
        except Exception as e:
            logger.error(f"Sora get_generation error: {e}")
            return ProviderGeneration(
                provider=ProviderName.SORA,
                provider_generation_id=generation_id,
                status=ClipStatus.FAILED,
                error=ProviderError(
                    code="client_error",
                    message=str(e)
                )
            )
    
    async def download_content(self, generation: ProviderGeneration) -> bytes:
        """
        Download video content from Sora.
        
        Args:
            generation: Completed generation
        
        Returns:
            Video file bytes
        """
        video_url = generation.get_video_url()
        
        if not video_url:
            # Try to get content URL from API
            client = self._get_client()
            try:
                response = await client.get(
                    f"/videos/{generation.provider_generation_id}/content"
                )
                response.raise_for_status()
                return response.content
            except Exception as e:
                logger.error(f"Failed to download from API: {e}")
                raise ValueError("No video URL available for download")
        
        # Download from URL
        async with httpx.AsyncClient() as download_client:
            response = await download_client.get(video_url)
            response.raise_for_status()
            return response.content
    
    async def optimize_prompt(
        self,
        prompt: str,
        model: str = "sora-2",
        size: str = "1280x720",
        seconds: int = 8
    ) -> str:
        """
        Optimize a prompt for better Sora results.
        
        Uses GPT to enhance the prompt for video generation.
        
        Args:
            prompt: Original prompt
            model: Target Sora model
            size: Target size
            seconds: Target duration
        
        Returns:
            Optimized prompt string
        """
        client = self._get_client()
        
        system_prompt = f"""You are an expert at crafting prompts for AI video generation.
Optimize the user's prompt for the Sora video model with these constraints:
- Model: {model}
- Size: {size} 
- Duration: {seconds} seconds

Guidelines:
- Be specific about visual details, lighting, camera angles
- Describe motion and action clearly
- Avoid abstract concepts that are hard to visualize
- Keep the prompt focused on what can be shown in {seconds} seconds
- Maintain the original intent while making it more visually concrete

Return ONLY the optimized prompt, nothing else."""

        try:
            response = await client.post("/chat/completions", json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 500,
                "temperature": 0.7
            })
            response.raise_for_status()
            data = response.json()
            
            return data["choices"][0]["message"]["content"].strip()
            
        except Exception as e:
            logger.warning(f"Prompt optimization failed: {e}")
            return prompt
    
    async def health_check(self) -> Dict[str, Any]:
        """Check Sora API availability."""
        import time
        
        start = time.time()
        
        if not self.config.api_key:
            return {
                "provider": "sora",
                "status": "no_api_key",
                "error": "OPENAI_API_KEY not configured"
            }
        
        try:
            client = self._get_client()
            # Use models endpoint as lightweight health check
            response = await client.get("/models")
            latency = (time.time() - start) * 1000
            
            if response.status_code == 200:
                return {
                    "provider": "sora",
                    "status": "available",
                    "latency_ms": round(latency, 2),
                    "model": self.config.model
                }
            else:
                return {
                    "provider": "sora",
                    "status": "error",
                    "status_code": response.status_code,
                    "latency_ms": round(latency, 2)
                }
                
        except Exception as e:
            return {
                "provider": "sora",
                "status": "error",
                "error": str(e)
            }
