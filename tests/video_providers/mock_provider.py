"""
Mock Video Provider
===================
Mock implementation for testing without API costs.

Features:
- Deterministic outputs for reproducible tests
- Configurable delay/failure simulation
- No external API calls
"""

import asyncio
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

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


class MockVideoProvider(VideoProviderAdapter):
    """
    Mock video provider for testing.
    
    Simulates video generation without making actual API calls.
    Useful for unit tests and development.
    """
    
    def __init__(
        self,
        config: Optional[ProviderConfig] = None,
        simulate_delay: float = 0.1,
        failure_rate: float = 0.0,
        processing_steps: int = 3
    ):
        super().__init__(config)
        self.simulate_delay = simulate_delay
        self.failure_rate = failure_rate
        self.processing_steps = processing_steps
        
        # Track generations for get_generation
        self._generations: Dict[str, ProviderGeneration] = {}
        self._generation_progress: Dict[str, int] = {}
    
    @property
    def name(self) -> ProviderName:
        return ProviderName.MOCK
    
    async def create_clip(self, input: CreateClipInput) -> ProviderGeneration:
        """
        Simulate creating a video clip.
        
        Args:
            input: CreateClipInput with prompt and settings
        
        Returns:
            ProviderGeneration with mock job ID
        """
        await asyncio.sleep(self.simulate_delay)
        
        # Check for simulated failure
        if self.failure_rate > 0:
            import random
            if random.random() < self.failure_rate:
                return ProviderGeneration(
                    provider=ProviderName.MOCK,
                    provider_generation_id="",
                    status=ClipStatus.FAILED,
                    error=ProviderError(
                        code="simulated_failure",
                        message="Simulated random failure for testing"
                    ),
                    prompt=input.prompt,
                    model=input.model,
                    size=input.size,
                    seconds=input.seconds
                )
        
        # Generate mock ID
        gen_id = f"mock_gen_{uuid.uuid4().hex[:12]}"
        
        generation = ProviderGeneration(
            provider=ProviderName.MOCK,
            provider_generation_id=gen_id,
            status=ClipStatus.QUEUED,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            prompt=input.prompt,
            model=input.model,
            size=input.size,
            seconds=input.seconds
        )
        
        # Store for later retrieval
        self._generations[gen_id] = generation
        self._generation_progress[gen_id] = 0
        
        logger.info(f"Mock: Created generation {gen_id}")
        return generation
    
    async def remix_clip(self, input: RemixClipInput) -> ProviderGeneration:
        """
        Simulate remixing a video clip.
        
        Args:
            input: RemixClipInput with source ID and modifications
        
        Returns:
            ProviderGeneration with new mock job ID
        """
        await asyncio.sleep(self.simulate_delay)
        
        # Generate mock ID
        gen_id = f"mock_remix_{uuid.uuid4().hex[:12]}"
        
        # Get source generation info if available
        source = self._generations.get(input.source_generation_id)
        
        generation = ProviderGeneration(
            provider=ProviderName.MOCK,
            provider_generation_id=gen_id,
            status=ClipStatus.QUEUED,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            prompt=input.prompt_delta,
            model=source.model if source else "sora-2",
            size=source.size if source else "1280x720",
            seconds=input.seconds or (source.seconds if source else 8)
        )
        
        self._generations[gen_id] = generation
        self._generation_progress[gen_id] = 0
        
        logger.info(f"Mock: Created remix {gen_id} from {input.source_generation_id}")
        return generation
    
    async def get_generation(self, generation_id: str) -> ProviderGeneration:
        """
        Get mock generation status.
        
        Simulates progress through processing steps.
        
        Args:
            generation_id: Mock generation ID
        
        Returns:
            ProviderGeneration with current status
        """
        await asyncio.sleep(self.simulate_delay)
        
        if generation_id not in self._generations:
            return ProviderGeneration(
                provider=ProviderName.MOCK,
                provider_generation_id=generation_id,
                status=ClipStatus.FAILED,
                error=ProviderError(
                    code="not_found",
                    message=f"Generation {generation_id} not found"
                )
            )
        
        generation = self._generations[generation_id]
        progress = self._generation_progress.get(generation_id, 0)
        
        # Simulate progress
        progress += 1
        self._generation_progress[generation_id] = progress
        
        if progress < self.processing_steps:
            generation.status = ClipStatus.RUNNING
            generation.updated_at = datetime.utcnow()
        else:
            # Check for simulated failure
            if self.failure_rate > 0:
                import random
                if random.random() < self.failure_rate:
                    generation.status = ClipStatus.FAILED
                    generation.error = ProviderError(
                        code="processing_failed",
                        message="Simulated processing failure"
                    )
                    generation.updated_at = datetime.utcnow()
                    return generation
            
            # Success!
            generation.status = ClipStatus.SUCCEEDED
            generation.completed_at = datetime.utcnow()
            generation.updated_at = datetime.utcnow()
            
            # Add mock outputs
            mock_video_url = f"https://mock-storage.example.com/videos/{generation_id}.mp4"
            mock_thumbnail_url = f"https://mock-storage.example.com/thumbnails/{generation_id}.jpg"
            
            generation.outputs = [
                AssetOutput(
                    kind=AssetKind.VIDEO_MP4,
                    url=mock_video_url,
                    content_type="video/mp4",
                    bytes=1024 * 1024 * generation.seconds  # ~1MB per second
                )
            ]
            generation.download_url = mock_video_url
            generation.thumbnail_url = mock_thumbnail_url
        
        return generation
    
    async def download_content(self, generation: ProviderGeneration) -> bytes:
        """
        Return mock video content.
        
        Args:
            generation: Completed generation
        
        Returns:
            Mock video bytes (small placeholder)
        """
        await asyncio.sleep(self.simulate_delay)
        
        # Return a small mock MP4 header
        # This is just placeholder bytes, not a valid video
        mock_content = b"mock_video_content_" + generation.provider_generation_id.encode()
        mock_content += b"\x00" * (1024 - len(mock_content))  # Pad to 1KB
        
        return mock_content
    
    async def wait_for_completion(
        self,
        generation_id: str,
        poll_interval: float = 0.1,
        timeout: Optional[float] = None
    ) -> ProviderGeneration:
        """
        Wait for mock generation to complete.
        
        Args:
            generation_id: Mock generation ID
            poll_interval: Seconds between polls (faster for mock)
            timeout: Maximum seconds to wait
        
        Returns:
            Completed ProviderGeneration
        """
        # Use faster polling for mock
        return await super().wait_for_completion(
            generation_id,
            poll_interval=poll_interval or 0.1,
            timeout=timeout or 10.0
        )
    
    async def health_check(self) -> Dict[str, Any]:
        """Check mock provider status."""
        return {
            "provider": "mock",
            "status": "available",
            "latency_ms": 0,
            "model": "mock-model",
            "note": "Mock provider for testing"
        }
    
    def reset(self):
        """Reset mock state for testing."""
        self._generations.clear()
        self._generation_progress.clear()
    
    def set_generation_status(self, generation_id: str, status: ClipStatus):
        """Manually set generation status for testing."""
        if generation_id in self._generations:
            self._generations[generation_id].status = status
    
    def get_all_generations(self) -> Dict[str, ProviderGeneration]:
        """Get all tracked generations for testing."""
        return self._generations.copy()
