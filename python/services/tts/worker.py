"""
TTS Worker
==========
Event-driven worker for text-to-speech generation.

Subscribes to:
    - tts.requested

Emits:
    - tts.started
    - tts.progress
    - tts.completed
    - tts.failed
"""

import asyncio
import logging
from typing import Dict, Any, Optional
from pathlib import Path
from datetime import datetime, timezone

from services.event_bus import EventBus, Event, Topics
from services.workers.base import BaseWorker

from .models import TTSRequest, TTSResponse, TTSModel, TTSJobStatus
from .adapters import IndexTTS2Adapter

logger = logging.getLogger(__name__)


class TTSWorker(BaseWorker):
    """
    Worker for processing TTS generation requests.
    
    Supports multiple TTS models via adapters:
        - IndexTTS2 (default)
        - Coqui XTTS (future)
        - Hugging Face models (future)
    
    Usage:
        worker = TTSWorker()
        await worker.start()
        
        # Worker will automatically process events from:
        # - tts.requested
    """
    
    def __init__(self, event_bus: Optional[EventBus] = None, worker_id: Optional[str] = None):
        super().__init__(event_bus, worker_id)
        self._adapters: Dict[str, Any] = {}
        self._jobs: Dict[str, TTSJobStatus] = {}
    
    def get_subscriptions(self) -> list:
        """Subscribe to TTS-related events."""
        return [
            Topics.TTS_REQUESTED,
        ]
    
    async def handle_event(self, event: Event) -> None:
        """Process TTS events."""
        try:
            # Parse request from event payload
            request = self._parse_request(event.payload)
            
            if not request:
                logger.error(f"[{self.worker_id}] Invalid TTS request in event")
                await self.emit(
                    Topics.TTS_FAILED,
                    {
                        "error": "Invalid request payload",
                        "correlation_id": event.correlation_id
                    },
                    event.correlation_id
                )
                return
            
            # Create job status
            job_status = TTSJobStatus(
                job_id=request.job_id,
                status="pending",
                correlation_id=request.correlation_id
            )
            self._jobs[request.job_id] = job_status
            
            # Emit started event
            await self.emit(
                Topics.TTS_STARTED,
                {
                    "job_id": request.job_id,
                    "model": request.model.value,
                    "text_length": len(request.text),
                    "correlation_id": request.correlation_id
                },
                request.correlation_id
            )
            
            # Process the request
            await self._process_request(request, job_status)
            
        except Exception as e:
            logger.error(f"[{self.worker_id}] Error processing TTS event: {e}", exc_info=True)
            await self.emit(
                Topics.TTS_FAILED,
                {
                    "error": str(e),
                    "correlation_id": event.correlation_id
                },
                event.correlation_id
            )
    
    def _parse_request(self, payload: Dict[str, Any]) -> Optional[TTSRequest]:
        """Parse TTS request from event payload."""
        try:
            from .models import EmotionConfig, EmotionMethod
            
            # Parse emotion config if present
            emotion = None
            if "emotion" in payload:
                emotion_data = payload["emotion"]
                emotion = EmotionConfig(
                    method=EmotionMethod(emotion_data.get("method", "natural")),
                    vectors=emotion_data.get("vectors"),
                    weight=emotion_data.get("weight", 0.8),
                    reference_audio=emotion_data.get("reference_audio"),
                    text=emotion_data.get("text", "")
                )
            
            return TTSRequest(
                text=payload["text"],
                model=TTSModel(payload.get("model", "indextts2")),
                voice_reference=payload["voice_reference"],
                emotion=emotion,
                output_format=payload.get("output_format", "wav"),
                sample_rate=payload.get("sample_rate", 22050),
                output_path=payload.get("output_path"),
                correlation_id=payload.get("correlation_id"),
                job_id=payload.get("job_id")
            )
        except Exception as e:
            logger.error(f"Failed to parse TTS request: {e}")
            return None
    
    async def _process_request(self, request: TTSRequest, job_status: TTSJobStatus) -> None:
        """Process a TTS generation request."""
        job_status.status = "processing"
        job_status.started_at = datetime.now(timezone.utc)

        try:
            # VC-005: Voice Cloning Integration
            # Try voice cloning first if requested
            if request.use_voice_cloning or request.voice_profile_id:
                try:
                    logger.info(f"[{self.worker_id}] Attempting voice cloning for job {request.job_id}")
                    response = await self._generate_with_voice_cloning(request, job_status)
                    if response and response.success:
                        # Voice cloning succeeded
                        job_status.status = "completed"
                        job_status.completed_at = datetime.now(timezone.utc)
                        job_status.progress = 1.0
                        job_status.response = response

                        await self.emit(
                            Topics.TTS_COMPLETED,
                            {
                                "job_id": response.job_id,
                                "audio_path": response.audio_path,
                                "audio_url": response.audio_url,
                                "duration_seconds": response.duration_seconds,
                                "model_used": "voice_cloning",
                                "generation_time": response.generation_time,
                                "correlation_id": response.correlation_id
                            },
                            response.correlation_id
                        )
                        return
                except Exception as e:
                    logger.warning(f"[{self.worker_id}] Voice cloning failed: {e}. Falling back to standard TTS.")
                    # Continue to standard TTS fallback below

            # Standard TTS pipeline
            # Get or create adapter for the model
            adapter = await self._get_adapter(request.model)
            
            if not adapter:
                error = f"Adapter not available for model: {request.model.value}"
                job_status.status = "failed"
                job_status.error = error
                await self.emit(
                    Topics.TTS_FAILED,
                    {
                        "job_id": request.job_id,
                        "error": error,
                        "correlation_id": request.correlation_id
                    },
                    request.correlation_id
                )
                return
            
            # Emit progress
            await self.emit(
                Topics.TTS_PROGRESS,
                {
                    "job_id": request.job_id,
                    "progress": 0.1,
                    "message": "Generating speech...",
                    "correlation_id": request.correlation_id
                },
                request.correlation_id
            )
            job_status.progress = 0.1
            
            # Generate speech
            response = await adapter.generate(request)
            
            if response.success:
                job_status.status = "completed"
                job_status.completed_at = datetime.now(timezone.utc)
                job_status.progress = 1.0
                job_status.response = response
                
                # Emit completion event
                await self.emit(
                    Topics.TTS_COMPLETED,
                    {
                        "job_id": response.job_id,
                        "audio_path": response.audio_path,
                        "audio_url": response.audio_url,
                        "duration_seconds": response.duration_seconds,
                        "model_used": response.model_used,
                        "generation_time": response.generation_time,
                        "correlation_id": response.correlation_id
                    },
                    response.correlation_id
                )
            else:
                job_status.status = "failed"
                job_status.error = response.error
                job_status.completed_at = datetime.now(timezone.utc)
                
                await self.emit(
                    Topics.TTS_FAILED,
                    {
                        "job_id": request.job_id,
                        "error": response.error,
                        "correlation_id": request.correlation_id
                    },
                    request.correlation_id
                )
                
        except Exception as e:
            logger.error(f"[{self.worker_id}] TTS generation error: {e}", exc_info=True)
            job_status.status = "failed"
            job_status.error = str(e)
            job_status.completed_at = datetime.now(timezone.utc)
            
            await self.emit(
                Topics.TTS_FAILED,
                {
                    "job_id": request.job_id,
                    "error": str(e),
                    "correlation_id": request.correlation_id
                },
                request.correlation_id
            )
    
    async def _generate_with_voice_cloning(
        self,
        request: TTSRequest,
        job_status: TTSJobStatus
    ) -> Optional[TTSResponse]:
        """
        Generate audio using voice cloning service (VC-005)

        Args:
            request: TTS request with voice_profile_id
            job_status: Job status tracker

        Returns:
            TTSResponse if successful, None otherwise
        """
        from services.voice.generation_service import VoiceGenerationService
        from services.voice.voice_profile_service import VoiceProfileService
        import os
        from pathlib import Path

        try:
            generation_service = VoiceGenerationService()
            profile_service = VoiceProfileService()

            # Get user_id from request metadata (would be set by API)
            user_id = request.correlation_id  # Placeholder - should come from auth

            # Progress update
            await self.emit(
                Topics.TTS_PROGRESS,
                {
                    "job_id": request.job_id,
                    "progress": 0.2,
                    "message": "Loading voice profile...",
                    "correlation_id": request.correlation_id
                },
                request.correlation_id
            )
            job_status.progress = 0.2

            # Prepare voice cloning options
            options = {}
            if request.emotion:
                # Map emotion config to voice cloning params
                if request.emotion.method == "natural":
                    options["emotion"] = "neutral"
                else:
                    options["emotion"] = request.emotion.text or "neutral"
                options["emotion_weight"] = request.emotion.weight

            # Progress update
            await self.emit(
                Topics.TTS_PROGRESS,
                {
                    "job_id": request.job_id,
                    "progress": 0.4,
                    "message": "Generating voice with cloning...",
                    "correlation_id": request.correlation_id
                },
                request.correlation_id
            )
            job_status.progress = 0.4

            # Generate audio using voice cloning
            start_time = datetime.now(timezone.utc)

            result = await generation_service.generate_audio(
                user_id=user_id,
                text=request.text,
                voice_profile_id=request.voice_profile_id,
                options=options
            )

            generation_time = (datetime.now(timezone.utc) - start_time).total_seconds()

            if not result or result.get("status") != "completed":
                logger.error(f"Voice cloning failed: {result.get('error', 'Unknown error')}")
                return None

            # Progress update
            await self.emit(
                Topics.TTS_PROGRESS,
                {
                    "job_id": request.job_id,
                    "progress": 0.8,
                    "message": "Processing audio output...",
                    "correlation_id": request.correlation_id
                },
                request.correlation_id
            )
            job_status.progress = 0.8

            # Download audio from result URL and save to output path
            output_path = request.output_path
            if not output_path:
                output_dir = Path("/tmp/mediaposter/tts")
                output_dir.mkdir(parents=True, exist_ok=True)
                output_path = str(output_dir / f"{request.job_id}.{request.output_format}")

            # Get audio URL from result
            audio_url = result.get("output_url")

            # If we need to download and save locally
            if audio_url and audio_url.startswith("http"):
                import httpx
                async with httpx.AsyncClient() as client:
                    response = await client.get(audio_url)
                    response.raise_for_status()

                    with open(output_path, "wb") as f:
                        f.write(response.content)

                logger.info(f"Saved voice cloned audio to {output_path}")

            # Create response
            return TTSResponse(
                job_id=request.job_id,
                success=True,
                audio_path=output_path,
                audio_url=audio_url,
                duration_seconds=result.get("duration_seconds"),
                model_used="voice_cloning",
                generation_time=generation_time,
                correlation_id=request.correlation_id
            )

        except Exception as e:
            logger.error(f"Voice cloning generation error: {e}", exc_info=True)
            return None

    async def _get_adapter(self, model: TTSModel):
        """Get or create adapter for the specified model."""
        model_key = model.value

        if model_key not in self._adapters:
            # Create adapter based on model type
            if model == TTSModel.INDEXTTS2:
                adapter = IndexTTS2Adapter()
                # Load the model
                loaded = await adapter.load_model()
                if loaded:
                    self._adapters[model_key] = adapter
                    logger.info(f"[{self.worker_id}] Loaded {model_key} adapter")
                else:
                    logger.error(f"[{self.worker_id}] Failed to load {model_key} adapter")
                    return None
            else:
                logger.warning(f"[{self.worker_id}] Model {model_key} not yet implemented")
                return None

        return self._adapters.get(model_key)
    
    def get_job_status(self, job_id: str) -> Optional[TTSJobStatus]:
        """Get status of a TTS job."""
        return self._jobs.get(job_id)
    
    async def shutdown(self) -> None:
        """Shutdown worker and unload models."""
        # Unload all adapters
        for model_key, adapter in self._adapters.items():
            try:
                await adapter.unload_model()
                logger.info(f"[{self.worker_id}] Unloaded {model_key} adapter")
            except Exception as e:
                logger.error(f"[{self.worker_id}] Error unloading {model_key}: {e}")
        
        await super().shutdown()

