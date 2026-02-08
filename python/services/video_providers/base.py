"""
Video Provider Base Interface
=============================
Abstract base class for video generation providers.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
import os


class NotConfiguredError(Exception):
    """Raised when a video provider is not configured (missing API key or unsupported)."""
    pass


class ProviderName(str, Enum):
    """Supported video generation providers."""
    SORA = "sora"
    RUNWAY = "runway"
    KLING = "kling"
    PIKA = "pika"
    LUMA = "luma"
    MOCK = "mock"


class ClipStatus(str, Enum):
    """Status of a clip generation."""
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELED = "canceled"


class AssetKind(str, Enum):
    """Types of output assets."""
    VIDEO_MP4 = "video_mp4"
    IMAGE_PNG = "image_png"
    JSON = "json"
    TEXT = "text"
    AUDIO_WAV = "audio_wav"


@dataclass
class ProviderConfig:
    """Configuration for video provider."""
    provider: ProviderName = ProviderName.SORA
    api_key: Optional[str] = None
    model: str = "sora-2"
    default_size: str = "1280x720"
    default_seconds: int = 8
    timeout: int = 300
    
    @classmethod
    def from_env(cls, provider: ProviderName = ProviderName.SORA) -> "ProviderConfig":
        """Load configuration from environment variables."""
        return cls(
            provider=provider,
            api_key=os.getenv("OPENAI_API_KEY") or os.getenv("SORA_API_KEY"),
            model=os.getenv("SORA_MODEL", "sora-2"),
            default_size=os.getenv("SORA_DEFAULT_SIZE", "1280x720"),
            default_seconds=int(os.getenv("SORA_DEFAULT_SECONDS", "8")),
            timeout=int(os.getenv("SORA_TIMEOUT", "300")),
        )


@dataclass
class AssetOutput:
    """Output asset from generation."""
    kind: AssetKind
    url: str
    content_type: str = ""
    bytes: int = 0
    sha256: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "kind": self.kind.value,
            "url": self.url,
            "content_type": self.content_type,
            "bytes": self.bytes,
            "sha256": self.sha256
        }


@dataclass
class ProviderReference:
    """Reference asset for generation (image/video input)."""
    type: str  # image, video, style, character
    url: str
    weight: float = 1.0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "url": self.url,
            "weight": self.weight
        }


@dataclass
class CreateClipInput:
    """Input for creating a new clip."""
    clip_id: str
    prompt: str
    seconds: int = 8
    aspect_ratio: str = "16:9"
    resolution: str = "1080p"
    model: str = "sora-2"
    size: str = "1280x720"
    seed: Optional[int] = None
    references: List[ProviderReference] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "clip_id": self.clip_id,
            "prompt": self.prompt,
            "seconds": self.seconds,
            "aspect_ratio": self.aspect_ratio,
            "resolution": self.resolution,
            "model": self.model,
            "size": self.size,
            "seed": self.seed,
            "references": [r.to_dict() for r in self.references],
            "metadata": self.metadata
        }


@dataclass
class RemixClipInput:
    """Input for remixing an existing clip."""
    source_generation_id: str
    prompt_delta: str
    seconds: Optional[int] = None
    seed: Optional[int] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_generation_id": self.source_generation_id,
            "prompt_delta": self.prompt_delta,
            "seconds": self.seconds,
            "seed": self.seed,
            "metadata": self.metadata
        }


@dataclass
class ProviderError:
    """Error information from provider."""
    code: str = ""
    message: str = ""
    raw: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "code": self.code,
            "message": self.message,
            "raw": self.raw
        }


@dataclass
class ProviderGeneration:
    """Result of a video generation."""
    provider: ProviderName
    provider_generation_id: str
    status: ClipStatus
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    error: Optional[ProviderError] = None
    outputs: List[AssetOutput] = field(default_factory=list)
    raw: Optional[Dict[str, Any]] = None
    
    # Convenience properties
    prompt: str = ""
    model: str = ""
    size: str = ""
    seconds: int = 0
    download_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "provider": self.provider.value,
            "provider_generation_id": self.provider_generation_id,
            "status": self.status.value,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "error": self.error.to_dict() if self.error else None,
            "outputs": [o.to_dict() for o in self.outputs],
            "prompt": self.prompt,
            "model": self.model,
            "size": self.size,
            "seconds": self.seconds,
            "download_url": self.download_url,
            "thumbnail_url": self.thumbnail_url
        }
    
    @property
    def is_complete(self) -> bool:
        """Check if generation is complete (succeeded or failed)."""
        return self.status in (ClipStatus.SUCCEEDED, ClipStatus.FAILED, ClipStatus.CANCELED)
    
    @property
    def is_success(self) -> bool:
        """Check if generation succeeded."""
        return self.status == ClipStatus.SUCCEEDED
    
    def get_video_url(self) -> Optional[str]:
        """Get URL for video output."""
        if self.download_url:
            return self.download_url
        for output in self.outputs:
            if output.kind == AssetKind.VIDEO_MP4:
                return output.url
        return None


class VideoProviderAdapter(ABC):
    """
    Abstract base class for video generation provider adapters.
    
    Implement this to add support for new video generation services.
    """
    
    def __init__(self, config: Optional[ProviderConfig] = None):
        self.config = config or ProviderConfig.from_env()
    
    @property
    @abstractmethod
    def name(self) -> ProviderName:
        """Provider name identifier."""
        pass
    
    @abstractmethod
    async def create_clip(self, input: CreateClipInput) -> ProviderGeneration:
        """
        Create a new video clip generation.
        
        Args:
            input: CreateClipInput with prompt and settings
        
        Returns:
            ProviderGeneration with job ID and initial status
        """
        pass
    
    @abstractmethod
    async def remix_clip(self, input: RemixClipInput) -> ProviderGeneration:
        """
        Remix an existing video clip.
        
        Args:
            input: RemixClipInput with source ID and modifications
        
        Returns:
            ProviderGeneration with new job ID
        """
        pass
    
    @abstractmethod
    async def get_generation(self, generation_id: str) -> ProviderGeneration:
        """
        Get status and outputs of a generation.
        
        Args:
            generation_id: Provider's generation ID
        
        Returns:
            ProviderGeneration with current status
        """
        pass
    
    @abstractmethod
    async def download_content(self, generation: ProviderGeneration) -> bytes:
        """
        Download the video content.
        
        Args:
            generation: Completed generation to download
        
        Returns:
            Video file bytes
        """
        pass
    
    async def wait_for_completion(
        self,
        generation_id: str,
        poll_interval: float = 2.0,
        timeout: Optional[float] = None
    ) -> ProviderGeneration:
        """
        Poll until generation completes.
        
        Args:
            generation_id: Provider's generation ID
            poll_interval: Seconds between polls
            timeout: Maximum seconds to wait
        
        Returns:
            Completed ProviderGeneration
        """
        import asyncio
        
        timeout = timeout or self.config.timeout
        start_time = asyncio.get_event_loop().time()
        
        while True:
            generation = await self.get_generation(generation_id)
            
            if generation.is_complete:
                return generation
            
            elapsed = asyncio.get_event_loop().time() - start_time
            if elapsed > timeout:
                generation.status = ClipStatus.FAILED
                generation.error = ProviderError(
                    code="timeout",
                    message=f"Generation timed out after {timeout} seconds"
                )
                return generation
            
            await asyncio.sleep(poll_interval)
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Check if provider is available.
        
        Returns:
            Dict with status, latency, and availability info
        """
        import time
        
        start = time.time()
        try:
            # Simple check - try to verify API key exists
            has_key = bool(self.config.api_key)
            latency = (time.time() - start) * 1000
            
            return {
                "provider": self.name.value,
                "status": "available" if has_key else "no_api_key",
                "latency_ms": round(latency, 2),
                "model": self.config.model
            }
        except Exception as e:
            return {
                "provider": self.name.value,
                "status": "error",
                "error": str(e)
            }
