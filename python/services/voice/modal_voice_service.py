"""
Modal Voice Service
===================
Client for Modal-hosted voice cloning API.

Feature: VC-003
"""

import httpx
import os
from typing import Optional, Dict, Any
from pathlib import Path
from loguru import logger


class ModalVoiceService:
    """
    Client for Modal-hosted voice cloning API.

    This service interfaces with an external Modal deployment that hosts
    the voice cloning model (e.g., IndexTTS2 or similar).

    Configuration:
        MODAL_VOICE_ENDPOINT: API endpoint URL
        MODAL_VOICE_API_KEY: Authentication key
    """

    def __init__(
        self,
        endpoint_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: float = 120.0
    ):
        """
        Initialize Modal voice service client.

        Args:
            endpoint_url: Modal API endpoint (defaults to env var)
            api_key: API authentication key (defaults to env var)
            timeout: Request timeout in seconds
        """
        self.endpoint_url = endpoint_url or os.getenv("MODAL_VOICE_ENDPOINT")
        self.api_key = api_key or os.getenv("MODAL_VOICE_API_KEY")
        self.timeout = timeout

        if not self.endpoint_url:
            logger.warning(
                "Modal voice endpoint not configured. "
                "Set MODAL_VOICE_ENDPOINT environment variable."
            )

        if not self.api_key:
            logger.warning(
                "Modal API key not configured. "
                "Set MODAL_VOICE_API_KEY environment variable."
            )

    def is_configured(self) -> bool:
        """Check if service is properly configured."""
        return bool(self.endpoint_url and self.api_key)

    async def clone_voice(
        self,
        text: str,
        voice_reference_url: str,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate cloned voice audio from text.

        Args:
            text: Text to synthesize
            voice_reference_url: URL to reference audio file
            options: Generation options:
                - speed: float (0.5 - 2.0) - playback speed
                - pitch: float (-50.0 to 50.0) - pitch adjustment %
                - emotion: str - emotion preset (neutral, happy, serious, excited)
                - stability: float (0.0 - 1.0) - voice consistency
                - emotion_weight: float (0.0 - 1.0) - emotion strength

        Returns:
            {
                "audio_url": str,
                "duration_seconds": float,
                "processing_time_ms": int,
                "job_id": str
            }

        Raises:
            ValueError: If service not configured
            httpx.HTTPError: If API request fails
        """
        if not self.is_configured():
            raise ValueError(
                "Modal voice service not configured. "
                "Set MODAL_VOICE_ENDPOINT and MODAL_VOICE_API_KEY."
            )

        # Prepare request payload
        payload = {
            "text": text,
            "voice_reference": voice_reference_url,
            "options": options or {}
        }

        logger.info(
            f"Requesting voice generation: {len(text)} chars, "
            f"reference: {Path(voice_reference_url).name}"
        )

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.endpoint_url}/clone-voice",
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    timeout=self.timeout
                )
                response.raise_for_status()

                result = response.json()
                logger.success(
                    f"Voice generation complete: "
                    f"{result.get('duration_seconds', 0):.1f}s in "
                    f"{result.get('processing_time_ms', 0)}ms"
                )

                return result

            except httpx.TimeoutException as e:
                logger.error(f"Voice generation timeout after {self.timeout}s")
                raise

            except httpx.HTTPStatusError as e:
                logger.error(f"Voice generation failed: {e.response.status_code} - {e.response.text}")
                raise

            except Exception as e:
                logger.error(f"Voice generation error: {e}")
                raise

    async def analyze_reference(
        self,
        audio_url: str
    ) -> Dict[str, Any]:
        """
        Analyze reference audio quality.

        Args:
            audio_url: URL to audio file

        Returns:
            {
                "quality_score": float (0.0 - 1.0),
                "issues": List[str],
                "recommendations": List[str],
                "metrics": {
                    "snr_db": float,
                    "duration_seconds": float,
                    "sample_rate_hz": int
                }
            }
        """
        if not self.is_configured():
            raise ValueError("Modal voice service not configured")

        payload = {"audio_url": audio_url}

        logger.info(f"Analyzing voice reference: {Path(audio_url).name}")

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.endpoint_url}/analyze-reference",
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    timeout=60.0
                )
                response.raise_for_status()

                result = response.json()
                logger.success(
                    f"Reference analysis complete: "
                    f"quality {result.get('quality_score', 0):.2f}"
                )

                return result

            except Exception as e:
                logger.error(f"Reference analysis failed: {e}")
                raise

    async def create_voice_embedding(
        self,
        voice_reference_urls: list[str],
        name: str
    ) -> Dict[str, Any]:
        """
        Create voice embedding from reference audio(s).

        This creates a persistent voice model on the Modal side that can be
        reused for multiple generations without re-uploading reference audio.

        Args:
            voice_reference_urls: List of reference audio URLs
            name: Name for this voice embedding

        Returns:
            {
                "embedding_id": str,
                "quality_score": float,
                "created_at": str (ISO datetime)
            }
        """
        if not self.is_configured():
            raise ValueError("Modal voice service not configured")

        payload = {
            "voice_references": voice_reference_urls,
            "name": name
        }

        logger.info(
            f"Creating voice embedding: {name} "
            f"({len(voice_reference_urls)} references)"
        )

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.endpoint_url}/create-embedding",
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    timeout=120.0
                )
                response.raise_for_status()

                result = response.json()
                logger.success(
                    f"Voice embedding created: {result.get('embedding_id')}"
                )

                return result

            except Exception as e:
                logger.error(f"Embedding creation failed: {e}")
                raise

    async def generate_with_embedding(
        self,
        text: str,
        embedding_id: str,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate speech using a pre-created voice embedding.

        This is faster than clone_voice() since it doesn't need to
        process reference audio each time.

        Args:
            text: Text to synthesize
            embedding_id: Voice embedding ID from create_voice_embedding()
            options: Generation options (same as clone_voice)

        Returns:
            Same as clone_voice()
        """
        if not self.is_configured():
            raise ValueError("Modal voice service not configured")

        payload = {
            "text": text,
            "embedding_id": embedding_id,
            "options": options or {}
        }

        logger.info(
            f"Generating with embedding {embedding_id}: {len(text)} chars"
        )

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.endpoint_url}/generate",
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    timeout=self.timeout
                )
                response.raise_for_status()

                result = response.json()
                logger.success(
                    f"Voice generation complete: "
                    f"{result.get('duration_seconds', 0):.1f}s"
                )

                return result

            except Exception as e:
                logger.error(f"Voice generation failed: {e}")
                raise

    async def batch_clone_voices(
        self,
        requests: list[Dict[str, Any]],
        max_concurrent: int = 5
    ) -> list[Dict[str, Any]]:
        """
        Generate multiple voiceovers in parallel (VC-008).

        Args:
            requests: List of voice generation requests, each with:
                - text: str - text to synthesize
                - voice_reference_url: str - reference audio URL
                - options: Optional[Dict] - generation options
            max_concurrent: Maximum concurrent API calls

        Returns:
            List of results in same order as requests

        Example:
            results = await service.batch_clone_voices([
                {"text": "Hello", "voice_reference_url": "ref1.mp3"},
                {"text": "World", "voice_reference_url": "ref2.mp3"}
            ])
        """
        import asyncio
        from typing import List

        if not requests:
            return []

        logger.info(f"Batch generating {len(requests)} voiceovers")

        # Process in batches to respect concurrency limits
        results = []
        for i in range(0, len(requests), max_concurrent):
            batch = requests[i:i + max_concurrent]

            # Create tasks for this batch
            tasks = [
                self.clone_voice(
                    text=req["text"],
                    voice_reference_url=req["voice_reference_url"],
                    options=req.get("options")
                )
                for req in batch
            ]

            # Execute batch concurrently
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            results.extend(batch_results)

        logger.info(f"Batch generation complete: {len(results)} results")
        return results

    def set_emotion(
        self,
        options: Dict[str, Any],
        emotion: str,
        intensity: float = 1.0
    ) -> Dict[str, Any]:
        """
        Helper to set emotion in voice options (VC-009).

        Emotions:
            - neutral: Neutral, conversational tone
            - happy: Cheerful, upbeat tone
            - sad: Melancholic, subdued tone
            - angry: Frustrated, intense tone
            - excited: Enthusiastic, high-energy tone

        Args:
            options: Options dict to modify
            emotion: Emotion name
            intensity: Emotion strength (0.0 to 1.0)

        Returns:
            Modified options dict
        """
        valid_emotions = ["neutral", "happy", "sad", "angry", "excited"]
        if emotion not in valid_emotions:
            logger.warning(f"Invalid emotion '{emotion}', using 'neutral'")
            emotion = "neutral"

        intensity = max(0.0, min(1.0, intensity))

        options = options.copy() if options else {}
        options["emotion"] = emotion
        options["emotion_weight"] = intensity

        return options


# Singleton instance
_modal_voice_service: Optional[ModalVoiceService] = None


def get_modal_voice_service() -> ModalVoiceService:
    """Get or create Modal voice service singleton."""
    global _modal_voice_service
    if _modal_voice_service is None:
        _modal_voice_service = ModalVoiceService()
    return _modal_voice_service
