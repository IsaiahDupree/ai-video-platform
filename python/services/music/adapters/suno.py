"""
Suno Adapter
============
Adapter for local Suno downloaded files.
"""

import logging
import os
import shutil
from pathlib import Path
from typing import Dict, Any, List, Optional

from .base import MusicAdapter
from services.music.models import MusicSearchCriteria, MusicResponse

logger = logging.getLogger(__name__)


class SunoAdapter(MusicAdapter):
    """
    Adapter for local Suno downloaded files.
    
    Assumes Suno files are stored in a local directory.
    """
    
    def __init__(self, suno_dir: Optional[str] = None):
        """
        Initialize Suno adapter.
        
        Args:
            suno_dir: Directory containing Suno downloads (default: data/suno)
        """
        if suno_dir is None:
            suno_dir = "data/suno"
        self.suno_dir = Path(suno_dir)
        self.suno_dir.mkdir(parents=True, exist_ok=True)
    
    def get_source_name(self) -> str:
        return "suno"
    
    def supports_search(self) -> bool:
        return True  # Can search local files
    
    async def search_music(
        self,
        criteria: MusicSearchCriteria,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search local Suno files by metadata.
        
        For now, returns all files. In production, would parse metadata files.
        """
        results = []
        
        # Scan Suno directory for audio files
        audio_extensions = [".mp3", ".wav", ".m4a", ".flac"]
        for ext in audio_extensions:
            for file_path in self.suno_dir.rglob(f"*{ext}"):
                # Get file metadata
                file_size = file_path.stat().st_size
                
                # Try to extract metadata from filename or metadata file
                metadata = self._extract_metadata(file_path)
                
                # Check if matches criteria
                if self._matches_criteria(metadata, criteria):
                    results.append({
                        "track_id": str(file_path.relative_to(self.suno_dir)),
                        "title": metadata.get("title", file_path.stem),
                        "path": str(file_path),
                        "duration": metadata.get("duration"),
                        "bpm": metadata.get("bpm"),
                        "genre": metadata.get("genre"),
                        "mood": metadata.get("mood"),
                        "source": "suno"
                    })
                    
                    if len(results) >= limit:
                        break
        
        return results
    
    async def get_music(
        self,
        track_id: str,
        output_path: Optional[Path] = None
    ) -> MusicResponse:
        """
        Get Suno music file.
        
        Args:
            track_id: Relative path within Suno directory
            output_path: Optional output path (if None, returns original path)
        """
        source_path = self.suno_dir / track_id
        
        if not source_path.exists():
            return MusicResponse(
                job_id="",
                success=False,
                error=f"Suno file not found: {track_id}"
            )
        
        # If output_path specified, copy file
        if output_path:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source_path, output_path)
            music_path = str(output_path)
        else:
            music_path = str(source_path)
        
        # Extract metadata
        metadata = self._extract_metadata(source_path)
        
        # Get duration (simplified - would use audio library in production)
        duration = metadata.get("duration", 0.0)
        
        return MusicResponse(
            job_id=track_id,
            success=True,
            music_path=music_path,
            duration_seconds=duration,
            bpm=metadata.get("bpm"),
            genre=metadata.get("genre"),
            mood=metadata.get("mood"),
            source="suno",
            metadata=metadata
        )
    
    def _extract_metadata(self, file_path: Path) -> Dict[str, Any]:
        """Extract metadata from file (filename or metadata file)."""
        metadata = {}
        
        # Check for metadata file (e.g., .json alongside audio)
        metadata_file = file_path.with_suffix(".json")
        if metadata_file.exists():
            try:
                import json
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
            except Exception as e:
                logger.warning(f"Failed to read metadata file: {e}")
        
        # Parse filename for hints
        filename = file_path.stem.lower()
        
        # Extract genre/mood from filename if present
        if "hip" in filename or "hop" in filename:
            metadata.setdefault("genre", "hip-hop")
        if "electronic" in filename or "edm" in filename:
            metadata.setdefault("genre", "electronic")
        if "calm" in filename or "chill" in filename:
            metadata.setdefault("mood", "calm")
        if "energetic" in filename or "upbeat" in filename:
            metadata.setdefault("mood", "energetic")
        
        return metadata
    
    def _matches_criteria(self, metadata: Dict[str, Any], criteria: MusicSearchCriteria) -> bool:
        """Check if metadata matches search criteria."""
        if criteria.genre and metadata.get("genre") != criteria.genre:
            return False
        if criteria.mood and metadata.get("mood") != criteria.mood:
            return False
        if criteria.bpm_min and metadata.get("bpm", 0) < criteria.bpm_min:
            return False
        if criteria.bpm_max and metadata.get("bpm", 999) > criteria.bpm_max:
            return False
        return True

