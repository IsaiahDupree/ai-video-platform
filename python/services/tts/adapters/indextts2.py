"""
IndexTTS2 Adapter
=================
Adapter for IndexTTS2 model using the existing call_indextts2_api.py.
"""

import logging
import sys
from pathlib import Path
from typing import Dict, Any, Optional

# Add TTS directory to path to import existing code
tts_dir = Path(__file__).parent.parent.parent.parent.parent / "Software" / "TTS"
if str(tts_dir) not in sys.path:
    sys.path.insert(0, str(tts_dir))

try:
    from call_indextts2_api import call_indextts2_api
except ImportError:
    # Fallback if TTS code is not in expected location
    call_indextts2_api = None

from .base import TTSAdapter
from ..models import TTSRequest, TTSResponse, EmotionMethod

logger = logging.getLogger(__name__)


class IndexTTS2Adapter(TTSAdapter):
    """
    Adapter for IndexTTS2 model.
    
    Uses the existing call_indextts2_api.py from the TTS directory.
    """
    
    def __init__(self):
        super().__init__("indextts2")
        self._api_available = call_indextts2_api is not None
        
        if not self._api_available:
            logger.warning(
                "IndexTTS2 API not available. "
                "Ensure TTS code is accessible at /Users/isaiahdupree/Documents/Software/TTS"
            )
    
    async def generate(
        self,
        request: TTSRequest,
        output_path: Optional[str] = None
    ) -> TTSResponse:
        """Generate speech using IndexTTS2."""
        if not self._api_available:
            return TTSResponse(
                job_id=request.job_id,
                success=False,
                error="IndexTTS2 API not available",
                correlation_id=request.correlation_id
            )
        
        output_file = self._ensure_output_path(request, output_path)
        
        # Map emotion method
        if request.emotion:
            if request.emotion.method == EmotionMethod.NATURAL:
                emo_method = "Same as the voice reference"
            elif request.emotion.method == EmotionMethod.REFERENCE:
                emo_method = "Use emotion reference audio"
            elif request.emotion.method == EmotionMethod.VECTORS:
                emo_method = "Use emotion vectors"
            else:
                emo_method = "Same as the voice reference"
        else:
            emo_method = "Same as the voice reference"
        
        # Prepare emotion vectors
        emotion_vectors = None
        if request.emotion and request.emotion.vectors:
            emotion_vectors = request.emotion.vectors
        
        # Call the API
        import time
        start_time = time.time()
        
        try:
            success = call_indextts2_api(
                voice_reference=request.voice_reference,
                text=request.text,
                output_file=str(output_file),
                emo_control_method=emo_method,
                emotion_reference=request.emotion.reference_audio if request.emotion else None,
                emotion_weight=request.emotion.weight if request.emotion else 0.8,
                emotion_vectors=emotion_vectors,
                emotion_text=request.emotion.text if request.emotion else "",
                max_text_tokens=120
            )
            
            generation_time = time.time() - start_time
            
            if success and output_file.exists():
                # Get audio duration (simplified - would use librosa or similar in production)
                duration = self._estimate_duration(output_file)
                
                return TTSResponse(
                    job_id=request.job_id,
                    success=True,
                    audio_path=str(output_file),
                    duration_seconds=duration,
                    model_used=self.model_name,
                    generation_time=generation_time,
                    correlation_id=request.correlation_id
                )
            else:
                return TTSResponse(
                    job_id=request.job_id,
                    success=False,
                    error="IndexTTS2 generation failed",
                    correlation_id=request.correlation_id
                )
                
        except Exception as e:
            logger.error(f"IndexTTS2 generation error: {e}", exc_info=True)
            return TTSResponse(
                job_id=request.job_id,
                success=False,
                error=str(e),
                correlation_id=request.correlation_id
            )
    
    def _estimate_duration(self, audio_path: Path) -> float:
        """
        Estimate audio duration.
        
        In production, would use librosa or similar to get exact duration.
        """
        try:
            import librosa
            duration = librosa.get_duration(path=str(audio_path))
            return duration
        except ImportError:
            # Fallback: estimate from file size (rough approximation)
            size_mb = audio_path.stat().st_size / (1024 * 1024)
            # Rough estimate: ~1MB per minute for WAV at 22kHz
            return size_mb * 60.0
        except Exception:
            return 0.0
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get IndexTTS2 model information."""
        return {
            "name": "IndexTTS2",
            "version": "2.0",
            "provider": "IndexTeam",
            "capabilities": {
                "voice_cloning": True,
                "emotion_control": True,
                "emotion_methods": ["natural", "reference", "vectors"],
                "languages": ["en"],
            },
            "api_type": "huggingface_space",
            "space_url": "IndexTeam/IndexTTS-2-Demo",
        }
    
    async def load_model(self) -> bool:
        """
        Load IndexTTS2 model.
        
        Note: IndexTTS2 uses a remote API, so "loading" just means
        checking API availability.
        """
        if not self._api_available:
            return False
        
        # Test API connection
        try:
            # Could add a test call here
            self._loaded = True
            return True
        except Exception as e:
            logger.error(f"Failed to load IndexTTS2: {e}")
            return False
    
    async def unload_model(self) -> bool:
        """Unload IndexTTS2 model (no-op for API-based models)."""
        self._loaded = False
        return True

