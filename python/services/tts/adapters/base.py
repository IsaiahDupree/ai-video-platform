"""
Base TTS Adapter
================
Abstract base class for TTS model adapters.
"""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, Any, Optional

from ..models import TTSRequest, TTSResponse


class TTSAdapter(ABC):
    """
    Abstract base class for TTS model adapters.
    
    Each adapter implements the interface to a specific TTS model,
    allowing the TTS service to support multiple models seamlessly.
    """
    
    def __init__(self, model_name: str):
        """
        Initialize adapter.
        
        Args:
            model_name: Name of the model (e.g., "indextts2")
        """
        self.model_name = model_name
        self._loaded = False
    
    @abstractmethod
    async def generate(
        self,
        request: TTSRequest,
        output_path: Optional[str] = None
    ) -> TTSResponse:
        """
        Generate speech from text.
        
        Args:
            request: TTS generation request
            output_path: Optional output path (auto-generated if None)
        
        Returns:
            TTSResponse with audio path and metadata
        """
        pass
    
    @abstractmethod
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the model.
        
        Returns:
            Dict with model metadata (name, version, capabilities, etc.)
        """
        pass
    
    @abstractmethod
    async def load_model(self) -> bool:
        """
        Load the model into memory.
        
        Returns:
            True if loaded successfully
        """
        pass
    
    @abstractmethod
    async def unload_model(self) -> bool:
        """
        Unload the model from memory.
        
        Returns:
            True if unloaded successfully
        """
        pass
    
    def is_loaded(self) -> bool:
        """Check if model is loaded."""
        return self._loaded
    
    def _ensure_output_path(self, request: TTSRequest, output_path: Optional[str] = None) -> Path:
        """
        Generate output path if not provided.
        
        Args:
            request: TTS request
            output_path: Optional explicit path
        
        Returns:
            Path object for output file
        """
        if output_path:
            return Path(output_path)
        
        # Generate default path
        output_dir = Path("data/tts_outputs")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        filename = f"{request.job_id}.{request.output_format}"
        return output_dir / filename

