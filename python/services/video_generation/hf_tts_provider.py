"""
Hugging Face TTS Provider

Adapter for Hugging Face Inference API for text-to-speech.
Supports various HF TTS models.
"""

import os
import asyncio
import aiohttp
from typing import Optional, Protocol
from pathlib import Path
from pydantic import BaseModel, Field
from loguru import logger


class TTSRequest(BaseModel):
    """TTS synthesis request."""
    text: str
    out_path: str = Field(alias="outPath")
    voice_id: Optional[str] = Field(None, alias="voiceId")
    
    class Config:
        populate_by_name = True


class TTSProvider(Protocol):
    """Protocol for TTS providers."""
    name: str
    
    async def synthesize(self, request: TTSRequest) -> None:
        """Synthesize text to audio file."""
        ...


class HFTTSConfig(BaseModel):
    """Hugging Face TTS configuration."""
    hf_token: str = Field(alias="hfToken")
    model_id: str = Field(alias="modelId")
    timeout_seconds: int = Field(default=60, alias="timeoutSeconds")
    
    class Config:
        populate_by_name = True


class HFTTSProvider:
    """Hugging Face TTS provider."""
    
    name = "huggingface"
    
    def __init__(self, config: HFTTSConfig):
        self.config = config
    
    async def synthesize(self, request: TTSRequest) -> None:
        """
        Synthesize text to audio using HF Inference API.
        
        Args:
            request: TTS request
        """
        url = f"https://api-inference.huggingface.co/models/{self.config.model_id}"
        
        headers = {
            "Authorization": f"Bearer {self.config.hf_token}",
            "Content-Type": "application/json",
        }
        
        payload = {"inputs": request.text}
        
        timeout = aiohttp.ClientTimeout(total=self.config.timeout_seconds)
        
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(url, headers=headers, json=payload) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise RuntimeError(f"HF TTS failed ({response.status}): {error_text[:200]}")
                
                audio_bytes = await response.read()
                
                # Write to file
                Path(request.out_path).parent.mkdir(parents=True, exist_ok=True)
                with open(request.out_path, "wb") as f:
                    f.write(audio_bytes)
    
    def synthesize_sync(self, request: TTSRequest) -> None:
        """Synchronous version of synthesize."""
        asyncio.run(self.synthesize(request))


def create_hf_tts_provider(
    model_id: str = "facebook/mms-tts-eng",
    hf_token: Optional[str] = None,
) -> HFTTSProvider:
    """
    Create a Hugging Face TTS provider.
    
    Args:
        model_id: HF model ID
        hf_token: HF API token (uses env var if not provided)
        
    Returns:
        HFTTSProvider
    """
    token = hf_token or os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN")
    
    if not token:
        raise ValueError("HF token required. Set HF_TOKEN or HUGGINGFACE_TOKEN env var.")
    
    config = HFTTSConfig(
        hf_token=token,
        model_id=model_id,
    )
    
    return HFTTSProvider(config)


# Popular HF TTS models
HF_TTS_MODELS = {
    "mms-eng": "facebook/mms-tts-eng",
    "bark": "suno/bark-small",
    "speecht5": "microsoft/speecht5_tts",
    "fastspeech2": "facebook/fastspeech2-en-ljspeech",
    "vits": "facebook/mms-tts-eng",
}


def get_hf_model_id(model_name: str) -> str:
    """Get HF model ID from friendly name."""
    return HF_TTS_MODELS.get(model_name, model_name)


class OpenAITTSProvider:
    """OpenAI TTS provider (alternative)."""
    
    name = "openai"
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key required")
    
    async def synthesize(self, request: TTSRequest) -> None:
        """Synthesize using OpenAI TTS."""
        import openai
        
        client = openai.AsyncOpenAI(api_key=self.api_key)
        
        voice = request.voice_id or "alloy"
        
        response = await client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=request.text,
        )
        
        Path(request.out_path).parent.mkdir(parents=True, exist_ok=True)
        
        with open(request.out_path, "wb") as f:
            for chunk in response.iter_bytes():
                f.write(chunk)


class ElevenLabsTTSProvider:
    """ElevenLabs TTS provider (alternative)."""
    
    name = "elevenlabs"
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("ELEVENLABS_API_KEY")
        if not self.api_key:
            raise ValueError("ElevenLabs API key required")
    
    async def synthesize(self, request: TTSRequest) -> None:
        """Synthesize using ElevenLabs."""
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{request.voice_id or 'pNInz6obpgDQGcFmaJgB'}"
        
        headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json",
        }
        
        payload = {
            "text": request.text,
            "model_id": "eleven_monolingual_v1",
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=payload) as response:
                if response.status != 200:
                    error = await response.text()
                    raise RuntimeError(f"ElevenLabs failed: {error[:200]}")
                
                audio_bytes = await response.read()
                
                Path(request.out_path).parent.mkdir(parents=True, exist_ok=True)
                with open(request.out_path, "wb") as f:
                    f.write(audio_bytes)


def create_tts_provider(
    provider_name: str,
    model_id: Optional[str] = None,
    voice_id: Optional[str] = None,
) -> TTSProvider:
    """
    Create a TTS provider by name.
    
    Args:
        provider_name: Provider name (huggingface, openai, elevenlabs)
        model_id: Model ID (for HF)
        voice_id: Voice ID
        
    Returns:
        TTSProvider instance
    """
    if provider_name == "huggingface":
        return create_hf_tts_provider(model_id or "facebook/mms-tts-eng")
    elif provider_name == "openai":
        return OpenAITTSProvider()
    elif provider_name == "elevenlabs":
        return ElevenLabsTTSProvider()
    else:
        raise ValueError(f"Unknown TTS provider: {provider_name}")


async def synthesize_with_provider(
    provider: TTSProvider,
    text: str,
    out_path: str,
    voice_id: Optional[str] = None,
) -> str:
    """
    Synthesize text with a provider.
    
    Args:
        provider: TTS provider
        text: Text to synthesize
        out_path: Output path
        voice_id: Optional voice ID
        
    Returns:
        Output path
    """
    request = TTSRequest(
        text=text,
        out_path=out_path,
        voice_id=voice_id,
    )
    
    await provider.synthesize(request)
    return out_path
