"""
Format-Agnostic Video Renderer
===============================
Core rendering service that transforms content + format into scenes.
"""

from typing import Dict, Any, List, Optional
from pathlib import Path
from loguru import logger

from .formats import FORMAT_REGISTRY


class VideoRenderService:
    """
    Format-agnostic video rendering service.
    
    Architecture:
    Content → Format → Scene Graph → Render
    """
    
    def __init__(self, output_dir: Path = None):
        self.output_dir = output_dir or Path("Backend/data/generated_videos")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info("=" * 80)
        logger.info("🎬 Video Render Service Initialized")
        logger.info("=" * 80)
        logger.info(f"📁 Output directory: {self.output_dir}")
        logger.info(f"📋 Available formats: {len(FORMAT_REGISTRY)}")
        for format_id in FORMAT_REGISTRY.keys():
            logger.info(f"   - {format_id}")
        logger.info("")
    
    def list_formats(self) -> Dict[str, Dict[str, Any]]:
        """List all available formats."""
        return {
            format_id: {
                "name": format_config.get("name"),
                "description": format_config.get("description"),
                "layout": format_config.get("layout"),
            }
            for format_id, format_config in FORMAT_REGISTRY.items()
        }
    
    def get_format(self, format_id: str) -> Optional[Dict[str, Any]]:
        """Get format configuration by ID."""
        return FORMAT_REGISTRY.get(format_id)
    
    def build_scene_graph(
        self,
        content: Dict[str, Any],
        format_id: str
    ) -> List[Dict[str, Any]]:
        """
        Build scene graph from content and format.
        
        Args:
            content: Universal content schema
            format_id: Format identifier (e.g., 'explainer_v1')
        
        Returns:
            List of scene configurations
        """
        format_config = FORMAT_REGISTRY.get(format_id)
        if not format_config:
            raise ValueError(f"Format '{format_id}' not found. Available: {list(FORMAT_REGISTRY.keys())}")
        
        logger.info(f"🎬 Building scene graph for format: {format_id}")
        logger.info(f"📋 Format: {format_config.get('name')}")
        
        scenes = []
        scene_order = format_config.get("scene_order", [])
        items = content.get("items", [])
        item_mapping = format_config.get("item_mapping", {})
        
        # Build scenes based on format's scene_order
        for scene_type in scene_order:
            if scene_type == "intro":
                scenes.append(self._build_intro_scene(content, format_config))
            
            elif scene_type == "item_loop":
                # Filter items based on format's item_mapping
                filtered_items = self._filter_items(items, item_mapping.get("filter", {}))
                
                # Create scene for each item
                for item in filtered_items:
                    scenes.append(self._build_item_scene(item, format_config, item_mapping))
            
            elif scene_type == "grid_intro":
                scenes.append(self._build_grid_intro_scene(items, format_config))
            
            elif scene_type == "hook":
                # Find hook item
                hook_items = [item for item in items if item.get("type") == "hook"]
                if hook_items:
                    scenes.append(self._build_item_scene(hook_items[0], format_config, item_mapping))
            
            elif scene_type == "cta":
                # Find CTA item
                cta_items = [item for item in items if item.get("type") == "outro"]
                if cta_items:
                    scenes.append(self._build_item_scene(cta_items[0], format_config, item_mapping))
            
            elif scene_type == "outro":
                scenes.append(self._build_outro_scene(content, format_config))
        
        logger.info(f"✅ Scene graph built: {len(scenes)} scenes")
        return scenes
    
    def _filter_items(self, items: List[Dict], filter_config: Dict) -> List[Dict]:
        """Filter items based on format filter configuration."""
        if not filter_config:
            return items
        
        filtered = []
        for item in items:
            # Check if item matches filter
            if "type" in filter_config:
                if item.get("type") != filter_config["type"]:
                    continue
            filtered.append(item)
        
        return filtered
    
    def _build_intro_scene(
        self,
        content: Dict[str, Any],
        format_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build intro scene configuration."""
        meta = content.get("meta", {})
        
        return {
            "scene_type": "IntroScene",
            "data": {
                "title": meta.get("project_id", "Introduction"),
                "subtitle": meta.get("target_audience", ""),
            },
            "format": format_config,
            "duration": format_config.get("timing", {}).get("intro_seconds", 5),
        }
    
    def _build_outro_scene(
        self,
        content: Dict[str, Any],
        format_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build outro scene configuration."""
        return {
            "scene_type": "OutroScene",
            "data": {
                "title": "Thanks for watching!",
                "cta": "Subscribe for more",
            },
            "format": format_config,
            "duration": format_config.get("timing", {}).get("outro_seconds", 5),
        }
    
    def _build_grid_intro_scene(
        self,
        items: List[Dict[str, Any]],
        format_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build grid intro scene showing all items."""
        return {
            "scene_type": "GridScene",
            "data": {
                "items": items[:10],  # Limit to 10 for grid
                "title": "Coming up...",
            },
            "format": format_config,
            "duration": 5,
        }
    
    def _build_item_scene(
        self,
        item: Dict[str, Any],
        format_config: Dict[str, Any],
        item_mapping: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build scene for a single item."""
        scene_component = item_mapping.get("scene", "TopicScene")
        timing = format_config.get("timing", {})
        
        # Use item's audio duration if available, otherwise use format default
        duration = item.get("audio", {}).get("duration") or timing.get("per_item_seconds", 60)
        
        return {
            "scene_type": scene_component,
            "data": item,
            "format": format_config,
            "duration": duration,
        }


# Convenience function
def render_video(
    content: Dict[str, Any],
    format_id: str,
    output_dir: Path = None,
    adapter: str = "motion_canvas"
) -> Path:
    """
    High-level function to render a video.
    
    Args:
        content: Universal content schema
        format_id: Format identifier
        output_dir: Output directory
        adapter: Rendering adapter ('motion_canvas' or 'remotion')
    
    Returns:
        Path to rendered video
    """
    service = VideoRenderService(output_dir)
    scene_graph = service.build_scene_graph(content, format_id)
    
    # TODO: Pass scene_graph to adapter for actual rendering
    # This will be implemented in the adapter layer
    
    logger.info(f"✅ Scene graph ready for rendering with {adapter} adapter")
    return output_dir or Path("Backend/data/generated_videos")

