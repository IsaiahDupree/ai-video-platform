"""
Base Music Adapter
==================
Abstract base class for music source adapters.
"""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, Any, Optional, List

from services.music.models import MusicSearchCriteria, MusicResponse


class MusicAdapter(ABC):
    """
    Abstract base class for music source adapters.
    Each adapter provides a common interface for different music sources.
    """
    
    @abstractmethod
    async def search_music(
        self,
        criteria: MusicSearchCriteria,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for music matching criteria.
        
        Args:
            criteria: Search criteria
            limit: Maximum number of results
        
        Returns:
            List of music tracks with metadata
        """
        pass
    
    @abstractmethod
    async def get_music(
        self,
        track_id: str,
        output_path: Optional[Path] = None
    ) -> MusicResponse:
        """
        Get/download music track.
        
        Args:
            track_id: Track identifier
            output_path: Optional output path for downloaded file
        
        Returns:
            MusicResponse with music file path
        """
        pass
    
    @abstractmethod
    def get_source_name(self) -> str:
        """Return the name of the music source this adapter supports."""
        pass
    
    @abstractmethod
    def supports_search(self) -> bool:
        """Return whether this adapter supports search functionality."""
        pass

