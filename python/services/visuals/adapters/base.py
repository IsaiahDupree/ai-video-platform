"""
Base Visuals Adapter
====================
Abstract base class for visuals source adapters.
"""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, Any, List, Optional

from services.visuals.models import VisualsSearchCriteria, VisualsResponse, VisualsType


class VisualsAdapter(ABC):
    """
    Abstract base class for visuals source adapters.
    Each adapter provides a common interface for different visual sources.
    """
    
    @abstractmethod
    async def search_visuals(
        self,
        visuals_type: VisualsType,
        criteria: VisualsSearchCriteria,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for visuals matching criteria.
        
        Args:
            visuals_type: Type of visual (meme, broll, ugc, etc.)
            criteria: Search criteria
            limit: Maximum number of results
        
        Returns:
            List of visual assets with metadata
        """
        pass
    
    @abstractmethod
    async def get_visuals(
        self,
        asset_id: str,
        output_path: Optional[Path] = None
    ) -> VisualsResponse:
        """
        Get/download visual asset.
        
        Args:
            asset_id: Asset identifier
            output_path: Optional output path for downloaded file
        
        Returns:
            VisualsResponse with visual file path
        """
        pass
    
    @abstractmethod
    def get_source_name(self) -> str:
        """Return the name of the visual source this adapter supports."""
        pass
    
    @abstractmethod
    def supports_search(self) -> bool:
        """Return whether this adapter supports search functionality."""
        pass

