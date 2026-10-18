"""
HuggingFace TTS Adapter (MF-003)
=================================
Text-to-speech via HuggingFace Inference API with voice cloning support.

Supports multiple HuggingFace TTS models:
- facebook/mms-tts-eng (Multilingual speech model)
- facebook/fastspeech2-en-ljspeech (FastSpeech2)
- microsoft/speecht5_tts (SpeechT5)
- coqui/XTTS-v2 (Voice cloning capable)

Features:
- Multi-model support
- Voice cloning (when supported by model)
- Async generation
- Error handling and retries
- Model info and capabilities
"""

import os
import asyncio
import aiohttp
import time
from pathlib import Path
from typing import Dict, Any, Optional
from loguru import logger

from ..models import TTSRequest, TTSResponse, TTSModel
from .base import TTSAdapter


class HuggingFaceTTSAdapter(TTSAdapter):
    """
    HuggingFace TTS adapter.

    Implements MF-003: TTS Service (HuggingFace) feature.
    Provides text-to-speech via HuggingFace Inference API.
    """

    # Default model configurations
    DEFAULT_MODELS = {
        TTSModel.HF_MMS: {
            "model_id": "facebook/mms-tts-eng",
            "name": "MMS TTS (English)",
            "supports_voice_cloning": False,
            "max_length": 512,
            "sample_rate": 16000
        },
        TTSModel.HF_METAVOICE: {
            "model_id": "metavoiceio/metavoice-1B-v0.1",
            "name": "MetaVoice 1B",
            "supports_voice_cloning": True,
            "max_length": 2048,
            "sample_rate": 24000
        },
        "fastspeech2": {
            "model_id": "facebook/fastspeech2-en-ljspeech",
            "name": "FastSpeech2",
            "supports_voice_cloning": False,
            "max_length": 512,
            "sample_rate": 22050
        },
        "speecht5": {
            "model_id": "microsoft/speecht5_tts",
            "name": "SpeechT5",
            "supports_voice_cloning": False,
            "max_length": 600,
            "sample_rate": 16000
        }
    }

    def __init__(
        self,
        model_type: TTSModel = TTSModel.HF_MMS,
        api_token: Optional[str] = None,
        timeout_seconds: int = 60,
        max_retries: int = 3
    ):
        """
        Initialize HuggingFace TTS adapter.

        Args:
            model_type: TTS model to use
            api_token: HuggingFace API token (uses HF_API_TOKEN env var if None)
            timeout_seconds: API request timeout
            max_retries: Maximum retry attempts for failed requests
        """
        super().__init__(model_name="huggingface")

        self.model_type = model_type
        self.model_config = self.DEFAULT_MODELS.get(model_type, self.DEFAULT_MODELS[TTSModel.HF_MMS])
        self.api_token = api_token or os.getenv("HF_API_TOKEN") or os.getenv("HUGGINGFACE_API_TOKEN")
        self.timeout_seconds = timeout_seconds
        self.max_retries = max_retries

        self.base_url = "https://api-inference.huggingface.co/models"

        if not self.api_token:
            logger.warning("No HuggingFace API token found. Set HF_API_TOKEN environment variable.")

    async def generate(
        self,
        request: TTSRequest,
        output_path: Optional[str] = None
    ) -> TTSResponse:
        """
        Generate speech from text using HuggingFace API.

        Args:
            request: TTS generation request
            output_path: Optional output path (auto-generated if None)

        Returns:
            TTSResponse with audio path and metadata
        """
        start_time = time.time()

        # Determine output path
        out_path = self._ensure_output_path(request, output_path)

        try:
            # Validate request
            if not request.text or len(request.text.strip()) == 0:
                raise ValueError("Text cannot be empty")

            # Check text length
            max_length = self.model_config.get("max_length", 512)
            if len(request.text) > max_length:
                logger.warning(
                    f"Text length ({len(request.text)}) exceeds model max ({max_length}). "
                    "Truncating..."
                )
                request.text = request.text[:max_length]

            # Generate audio
            audio_bytes = await self._generate_audio(request)

            # Write to file
            out_path.parent.mkdir(parents=True, exist_ok=True)
            with open(out_path, "wb") as f:
                f.write(audio_bytes)

            generation_time = time.time() - start_time

            logger.info(
                f"Generated TTS audio: {len(audio_bytes)} bytes in {generation_time:.2f}s "
                f"(model: {self.model_config['name']})"
            )

            return TTSResponse(
                job_id=request.job_id,
                success=True,
                audio_path=str(out_path),
                model_used=self.model_config["model_id"],
                generation_time=generation_time,
                correlation_id=request.correlation_id
            )

        except Exception as e:
            logger.error(f"TTS generation failed: {e}")
            return TTSResponse(
                job_id=request.job_id,
                success=False,
                error=str(e),
                model_used=self.model_config["model_id"],
                correlation_id=request.correlation_id
            )

    async def _generate_audio(self, request: TTSRequest) -> bytes:
        """
        Call HuggingFace API to generate audio.

        Args:
            request: TTS request

        Returns:
            Audio bytes

        Raises:
            RuntimeError: If API call fails after retries
        """
        model_id = self.model_config["model_id"]
        url = f"{self.base_url}/{model_id}"

        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }

        payload = {"inputs": request.text}

        # Add voice reference if model supports voice cloning
        if self.model_config.get("supports_voice_cloning") and request.voice_reference:
            logger.info(f"Using voice reference: {request.voice_reference}")
            # Note: Voice cloning implementation varies by model
            # MetaVoice and some models accept audio embeddings or reference URLs
            payload["parameters"] = {
                "voice_reference": request.voice_reference
            }

        # Retry logic
        last_error = None
        for attempt in range(self.max_retries):
            try:
                timeout = aiohttp.ClientTimeout(total=self.timeout_seconds)

                async with aiohttp.ClientSession(timeout=timeout) as session:
                    async with session.post(url, headers=headers, json=payload) as response:
                        if response.status == 200:
                            audio_bytes = await response.read()
                            return audio_bytes
                        elif response.status == 503:
                            # Model loading
                            error_text = await response.text()
                            if "loading" in error_text.lower():
                                wait_time = 10 * (attempt + 1)
                                logger.info(f"Model loading, waiting {wait_time}s...")
                                await asyncio.sleep(wait_time)
                                continue
                        else:
                            error_text = await response.text()
                            last_error = f"API error ({response.status}): {error_text[:500]}"
                            logger.error(last_error)

                            # Retry on 5xx errors
                            if response.status >= 500 and attempt < self.max_retries - 1:
                                wait_time = 2 ** attempt  # Exponential backoff
                                logger.info(f"Retrying in {wait_time}s... (attempt {attempt + 1}/{self.max_retries})")
                                await asyncio.sleep(wait_time)
                                continue
                            else:
                                raise RuntimeError(last_error)

            except asyncio.TimeoutError:
                last_error = f"Request timeout after {self.timeout_seconds}s"
                logger.error(last_error)
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
            except Exception as e:
                last_error = str(e)
                logger.error(f"Request failed: {e}")
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue

        raise RuntimeError(f"TTS generation failed after {self.max_retries} attempts: {last_error}")

    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the HuggingFace model.

        Returns:
            Dict with model metadata
        """
        return {
            "adapter": "huggingface",
            "model_type": str(self.model_type),
            "model_id": self.model_config["model_id"],
            "model_name": self.model_config["name"],
            "supports_voice_cloning": self.model_config.get("supports_voice_cloning", False),
            "max_length": self.model_config.get("max_length", 512),
            "sample_rate": self.model_config.get("sample_rate", 16000),
            "loaded": self._loaded,
            "has_api_token": bool(self.api_token)
        }

    async def load_model(self) -> bool:
        """
        Load the model (no-op for API-based adapter).

        Returns:
            True (always succeeds for API adapter)
        """
        logger.info(f"HuggingFace adapter initialized: {self.model_config['name']}")
        self._loaded = True
        return True

    async def unload_model(self) -> bool:
        """
        Unload the model (no-op for API-based adapter).

        Returns:
            True (always succeeds for API adapter)
        """
        logger.info("HuggingFace adapter unloaded")
        self._loaded = False
        return True


def create_huggingface_adapter(
    model_type: TTSModel = TTSModel.HF_MMS,
    api_token: Optional[str] = None
) -> HuggingFaceTTSAdapter:
    """
    Factory function to create HuggingFace TTS adapter.

    Args:
        model_type: TTS model to use
        api_token: HuggingFace API token

    Returns:
        HuggingFaceTTSAdapter instance
    """
    return HuggingFaceTTSAdapter(
        model_type=model_type,
        api_token=api_token
    )


__all__ = ['HuggingFaceTTSAdapter', 'create_huggingface_adapter']
