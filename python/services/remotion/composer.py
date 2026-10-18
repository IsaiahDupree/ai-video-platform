"""
Remotion Composer
=================
Builds Remotion compositions from timeline.json and generates React components.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List

from .models import RemotionRequest, Layer, AudioTrack, CaptionConfig
from .source_loader import SourceLoader, SourceType

logger = logging.getLogger(__name__)


class RemotionComposer:
    """
    Composes Remotion videos from timeline specifications.
    
    Generates:
        - React composition components
        - Timeline JSON
        - Remotion config
    """
    
    def __init__(self, remotion_dir: Optional[str] = None):
        """
        Initialize composer.
        
        Args:
            remotion_dir: Path to Remotion project directory
        """
        # Default to Remotion directory in Documents
        if remotion_dir is None:
            remotion_dir = "/Users/isaiahdupree/Documents/Software/Remotion"
        
        self.remotion_dir = Path(remotion_dir)
        self.source_loader = SourceLoader()
    
    async def build_composition(
        self,
        request: RemotionRequest,
        output_dir: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Build Remotion composition from request.
        
        Args:
            request: Remotion rendering request
            output_dir: Output directory for generated files
        
        Returns:
            Dict with composition files and metadata
        """
        if output_dir is None:
            output_dir = Path("data/remotion_compositions") / request.job_id
        else:
            output_dir = Path(output_dir)
        
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Load all sources
        sources_loaded = await self._load_sources(request)
        
        # Generate timeline.json
        timeline = await self._generate_timeline(request, sources_loaded)
        timeline_path = output_dir / "timeline.json"
        with open(timeline_path, 'w') as f:
            json.dump(timeline, f, indent=2)
        
        # Generate composition component (if needed)
        composition_path = await self._generate_composition(request, output_dir)
        
        # Generate props.json
        props = request.props or {}
        props_path = output_dir / "props.json"
        with open(props_path, 'w') as f:
            json.dump(props, f, indent=2)
        
        return {
            "timeline_path": str(timeline_path),
            "composition_path": str(composition_path) if composition_path else None,
            "props_path": str(props_path),
            "output_dir": str(output_dir),
            "sources_loaded": sources_loaded
        }
    
    async def _load_sources(self, request: RemotionRequest) -> Dict[str, str]:
        """Load all sources and return mapping of source IDs to local paths."""
        sources_loaded = {}
        
        # Load layer sources
        if request.layers:
            for layer in request.layers:
                if layer.source and layer.source_type:
                    local_path = await self.source_loader.load_source(
                        layer.source,
                        layer.source_type,
                        job_id=request.job_id
                    )
                    if local_path:
                        sources_loaded[layer.id] = local_path
                    else:
                        logger.warning(f"Failed to load source for layer {layer.id}")
        
        # Load audio sources
        if request.audio:
            for audio in request.audio:
                if audio.source and audio.source_type:
                    local_path = await self.source_loader.load_source(
                        audio.source,
                        audio.source_type,
                        job_id=request.job_id
                    )
                    if local_path:
                        sources_loaded[audio.id] = local_path
                    else:
                        logger.warning(f"Failed to load source for audio {audio.id}")
        
        return sources_loaded
    
    async def _generate_timeline(
        self,
        request: RemotionRequest,
        sources_loaded: Dict[str, str]
    ) -> Dict[str, Any]:
        """Generate timeline.json from request."""
        # If timeline is already provided, use it
        if request.timeline:
            return request.timeline
        
        # Otherwise, build from layers and audio
        timeline = {
            "fps": request.output.get("fps", 30),
            "resolution": request.output.get("resolution", "1080x1920"),
            "duration": 0.0,
            "layers": [],
            "audio": []
        }
        
        # Calculate duration from layers
        max_end = 0.0
        if request.layers:
            for layer in request.layers:
                layer_data = {
                    "id": layer.id,
                    "type": layer.type,
                    "source": sources_loaded.get(layer.id, layer.source),
                    "position": layer.position or {"x": 0, "y": 0, "width": 1080, "height": 1920},
                    "start": layer.start,
                    "opacity": layer.opacity
                }
                
                if layer.end:
                    layer_data["end"] = layer.end
                    max_end = max(max_end, layer.end)
                else:
                    # Estimate from source duration if available
                    # For now, use a default
                    layer_data["end"] = layer.start + 10.0  # Default 10 seconds
                    max_end = max(max_end, layer_data["end"])
                
                if layer.style:
                    layer_data["style"] = layer.style
                if layer.animation:
                    layer_data["animation"] = layer.animation
                if layer.content:
                    layer_data["content"] = layer.content
                
                timeline["layers"].append(layer_data)
        
        # Add audio tracks
        if request.audio:
            for audio in request.audio:
                audio_data = {
                    "id": audio.id,
                    "source": sources_loaded.get(audio.id, audio.source),
                    "start": audio.start,
                    "volume": audio.volume
                }
                
                if audio.ducking:
                    audio_data["ducking"] = audio.ducking
                
                timeline["audio"].append(audio_data)
        
        # Set duration
        timeline["duration"] = max_end
        
        # Add caption config
        if request.captions and request.captions.enabled:
            timeline["captions"] = {
                "enabled": True,
                "style": request.captions.style,
                "source": request.captions.source,
                "emphasis_words": request.captions.emphasis_words,
                "position": request.captions.position
            }
        
        return timeline
    
    async def _generate_composition(
        self,
        request: RemotionRequest,
        output_dir: Path
    ) -> Optional[Path]:
        """
        Generate Remotion composition component.
        
        For now, we'll use the existing MainComposition from the Remotion project.
        In the future, we could generate dynamic compositions.
        """
        # Check if composition exists in Remotion project
        composition_file = self.remotion_dir / "src" / f"{request.composition}.tsx"
        
        if composition_file.exists():
            logger.info(f"Using existing composition: {composition_file}")
            return composition_file
        
        # Otherwise, use default MainComposition
        default_composition = self.remotion_dir / "src" / "MainComposition.tsx"
        if default_composition.exists():
            logger.info(f"Using default composition: {default_composition}")
            return default_composition
        
        # Check Root.tsx for composition ID
        root_file = self.remotion_dir / "src" / "Root.tsx"
        if root_file.exists():
            logger.info(f"Using Root.tsx composition: {request.composition}")
            # The composition ID should match what's in Root.tsx
            return root_file
        
        logger.warning(f"Composition {request.composition} not found, will use Remotion CLI default")
        return None

