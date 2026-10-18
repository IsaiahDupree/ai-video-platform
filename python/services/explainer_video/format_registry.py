"""
Format Registry
===============
Defines video formats as configuration, not code.
Formats are pure configuration + scene orchestration.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Any
import json


class LayoutType(str, Enum):
    """Layout types for video formats."""
    SINGLE_FOCUS = "single_focus"    # One item at a time
    GRID = "grid"                     # Grid of items
    SPLIT = "split"                   # Split screen
    TIMELINE = "timeline"             # Timeline view
    LAYERED = "layered"               # Layer composition
    PICTURE_IN_PICTURE = "pip"        # PiP layout


class SceneType(str, Enum):
    """Available scene types."""
    INTRO = "IntroScene"
    OUTRO = "OutroScene"
    TOPIC = "TopicScene"
    COMPARISON = "ComparisonScene"
    GRID_OVERVIEW = "GridOverviewScene"
    DEV_EVENT = "DevEventScene"
    MATTE = "MatteScene"
    CAPTION = "CaptionScene"
    HOOK = "HookScene"
    CTA = "CTAScene"
    FAST_TOPIC = "FastTopicScene"
    STEP = "StepScene"
    AUDIOGRAM = "AudiogramScene"


@dataclass
class TimingConfig:
    """Timing configuration for a format."""
    per_item_seconds: float = 60.0
    transition_seconds: float = 0.4
    intro_seconds: float = 5.0
    outro_seconds: float = 10.0
    hook_seconds: float = 3.0
    
    def to_dict(self) -> Dict:
        return {
            "per_item_seconds": self.per_item_seconds,
            "transition_seconds": self.transition_seconds,
            "intro_seconds": self.intro_seconds,
            "outro_seconds": self.outro_seconds,
            "hook_seconds": self.hook_seconds,
        }


@dataclass
class VisualsConfig:
    """Visual configuration for a format."""
    background: str = "#0f0f0f"
    accent_color: str = "#FFD54F"
    text_color: str = "#ffffff"
    zoom: bool = True
    zoom_level: float = 1.1
    captions: str = "auto"  # auto, always_on, off
    caption_style: str = "modern"  # modern, terminal, minimal
    picture_in_picture: bool = False
    pip_position: str = "bottom_right"  # bottom_right, bottom_left, top_right, top_left
    
    def to_dict(self) -> Dict:
        return {
            "background": self.background,
            "accent_color": self.accent_color,
            "text_color": self.text_color,
            "zoom": self.zoom,
            "zoom_level": self.zoom_level,
            "captions": self.captions,
            "caption_style": self.caption_style,
            "picture_in_picture": self.picture_in_picture,
            "pip_position": self.pip_position,
        }


@dataclass
class FormatAudioConfig:
    """Audio configuration for a format."""
    voiceover: bool = True
    music: bool = True
    music_genre: str = "ambient"
    sound_effects: bool = True
    ducking: bool = True  # Lower music during speech
    
    def to_dict(self) -> Dict:
        return {
            "voiceover": self.voiceover,
            "music": self.music,
            "music_genre": self.music_genre,
            "sound_effects": self.sound_effects,
            "ducking": self.ducking,
        }


@dataclass
class ItemMapping:
    """Maps content item types to scenes."""
    source: str = "items"  # Field in content brief containing items
    scene: str = "TopicScene"  # Scene to use for each item
    type_filter: Optional[str] = None  # Filter by item type
    
    def to_dict(self) -> Dict:
        return {
            "source": self.source,
            "scene": self.scene,
            "type_filter": self.type_filter,
        }


@dataclass
class VideoFormat:
    """
    A video format definition.
    
    Formats are pure configuration - they define:
    - Layout structure
    - Scene sequence
    - Item-to-scene mapping
    - Timing
    - Visual style
    - Audio preferences
    
    The same content brief can be rendered in different formats.
    """
    format_id: str
    name: str
    description: str = ""
    
    # Structure
    layout: LayoutType = LayoutType.SINGLE_FOCUS
    scene_order: List[str] = field(default_factory=lambda: ["intro", "item_loop", "outro"])
    item_mapping: ItemMapping = field(default_factory=ItemMapping)
    
    # Timing
    timing: TimingConfig = field(default_factory=TimingConfig)
    
    # Visuals
    visuals: VisualsConfig = field(default_factory=VisualsConfig)
    
    # Audio
    audio: FormatAudioConfig = field(default_factory=FormatAudioConfig)
    
    # Aspect ratio (for shorts vs long-form)
    aspect_ratio: str = "16:9"
    resolution: str = "1920x1080"
    fps: int = 30
    
    # Tags for categorization
    tags: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            "format_id": self.format_id,
            "name": self.name,
            "description": self.description,
            "layout": self.layout.value if isinstance(self.layout, Enum) else self.layout,
            "scene_order": self.scene_order,
            "item_mapping": self.item_mapping.to_dict(),
            "timing": self.timing.to_dict(),
            "visuals": self.visuals.to_dict(),
            "audio": self.audio.to_dict(),
            "aspect_ratio": self.aspect_ratio,
            "resolution": self.resolution,
            "fps": self.fps,
            "tags": self.tags,
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "VideoFormat":
        return cls(
            format_id=data["format_id"],
            name=data["name"],
            description=data.get("description", ""),
            layout=LayoutType(data.get("layout", "single_focus")),
            scene_order=data.get("scene_order", ["intro", "item_loop", "outro"]),
            item_mapping=ItemMapping(**data["item_mapping"]) if data.get("item_mapping") else ItemMapping(),
            timing=TimingConfig(**data["timing"]) if data.get("timing") else TimingConfig(),
            visuals=VisualsConfig(**data["visuals"]) if data.get("visuals") else VisualsConfig(),
            audio=FormatAudioConfig(**data["audio"]) if data.get("audio") else FormatAudioConfig(),
            aspect_ratio=data.get("aspect_ratio", "16:9"),
            resolution=data.get("resolution", "1920x1080"),
            fps=data.get("fps", 30),
            tags=data.get("tags", []),
        )


class FormatRegistry:
    """
    Registry of available video formats.
    
    Usage:
        registry = FormatRegistry()
        explainer = registry.get("explainer_v1")
        shorts = registry.get("shorts_v1")
    """
    
    def __init__(self):
        self._formats: Dict[str, VideoFormat] = {}
        self._register_defaults()
    
    def _register_defaults(self):
        """Register default video formats."""
        
        # Explainer format - "Every X Explained"
        self.register(VideoFormat(
            format_id="explainer_v1",
            name="Explainer Video",
            description="Classic encyclopedic explainer format. One topic at a time with icons and narration.",
            layout=LayoutType.SINGLE_FOCUS,
            scene_order=["intro", "item_loop", "outro"],
            item_mapping=ItemMapping(source="items", scene="TopicScene"),
            timing=TimingConfig(
                per_item_seconds=60.0,
                transition_seconds=0.4,
                intro_seconds=5.0,
                outro_seconds=10.0,
            ),
            visuals=VisualsConfig(
                background="#0f0f0f",
                zoom=True,
                zoom_level=1.1,
                captions="auto",
            ),
            audio=FormatAudioConfig(
                voiceover=True,
                music=True,
                music_genre="ambient",
                ducking=True,
            ),
            tags=["youtube", "educational", "long-form"],
        ))
        
        # Listicle format - "Top 10 X"
        self.register(VideoFormat(
            format_id="listicle_v1",
            name="Listicle Video",
            description="Fast-paced list format with grid intro and quick topic cuts.",
            layout=LayoutType.GRID,
            scene_order=["intro", "grid_overview", "item_loop", "outro"],
            item_mapping=ItemMapping(source="items", scene="FastTopicScene"),
            timing=TimingConfig(
                per_item_seconds=20.0,  # Faster pacing
                transition_seconds=0.3,
                intro_seconds=3.0,
                outro_seconds=5.0,
            ),
            visuals=VisualsConfig(
                background="#1a1a2e",
                accent_color="#e94560",
                zoom=True,
                zoom_level=1.15,
                captions="always_on",
            ),
            audio=FormatAudioConfig(
                voiceover=True,
                music=True,
                music_genre="upbeat",
                sound_effects=True,
            ),
            tags=["youtube", "entertainment", "long-form"],
        ))
        
        # Comparison format - "X vs Y"
        self.register(VideoFormat(
            format_id="comparison_v1",
            name="Comparison Video",
            description="Split-screen comparison format for A vs B content.",
            layout=LayoutType.SPLIT,
            scene_order=["intro", "item_loop", "verdict", "outro"],
            item_mapping=ItemMapping(source="items", scene="ComparisonScene", type_filter="comparison"),
            timing=TimingConfig(
                per_item_seconds=45.0,
                transition_seconds=0.5,
                intro_seconds=5.0,
                outro_seconds=8.0,
            ),
            visuals=VisualsConfig(
                background="#0a0a0a",
                accent_color="#00d9ff",
                zoom=False,
                captions="auto",
            ),
            audio=FormatAudioConfig(
                voiceover=True,
                music=True,
                music_genre="cinematic",
            ),
            tags=["youtube", "review", "long-form"],
        ))
        
        # Dev Vlog format
        self.register(VideoFormat(
            format_id="dev_vlog_v1",
            name="Dev Vlog",
            description="Build-in-public dev vlog with screen recordings and timeline events.",
            layout=LayoutType.TIMELINE,
            scene_order=["hook", "event_loop", "reflection", "outro"],
            item_mapping=ItemMapping(source="items", scene="DevEventScene", type_filter="dev_event"),
            timing=TimingConfig(
                per_item_seconds=30.0,
                transition_seconds=0.3,
                intro_seconds=3.0,
                outro_seconds=5.0,
                hook_seconds=5.0,
            ),
            visuals=VisualsConfig(
                background="#1e1e1e",
                accent_color="#0ea5e9",
                picture_in_picture=True,
                pip_position="bottom_right",
                caption_style="terminal",
                captions="always_on",
            ),
            audio=FormatAudioConfig(
                voiceover=True,
                music=True,
                music_genre="lo-fi",
            ),
            tags=["youtube", "dev", "long-form"],
        ))
        
        # Short-form format (TikTok/Reels/Shorts)
        self.register(VideoFormat(
            format_id="shorts_v1",
            name="Short-Form Video",
            description="Vertical short-form content for TikTok, Reels, and YouTube Shorts.",
            layout=LayoutType.SINGLE_FOCUS,
            scene_order=["hook", "item_loop"],
            item_mapping=ItemMapping(source="items", scene="FastTopicScene"),
            timing=TimingConfig(
                per_item_seconds=8.0,  # Very fast
                transition_seconds=0.2,
                intro_seconds=0.0,  # No intro
                outro_seconds=0.0,  # No outro
                hook_seconds=2.0,
            ),
            visuals=VisualsConfig(
                background="#000000",
                accent_color="#ff0050",
                zoom=True,
                zoom_level=1.2,
                captions="always_on",
                caption_style="modern",
            ),
            audio=FormatAudioConfig(
                voiceover=True,
                music=True,
                music_genre="trending",
                sound_effects=True,
            ),
            aspect_ratio="9:16",
            resolution="1080x1920",
            tags=["tiktok", "reels", "shorts", "short-form"],
        ))
        
        # Narrative format - storytelling
        self.register(VideoFormat(
            format_id="narrative_v1",
            name="Narrative Video",
            description="Story-driven narrative format with beats and emotional arcs.",
            layout=LayoutType.SINGLE_FOCUS,
            scene_order=["hook", "setup", "item_loop", "climax", "resolution", "outro"],
            item_mapping=ItemMapping(source="items", scene="TopicScene", type_filter="beat"),
            timing=TimingConfig(
                per_item_seconds=45.0,
                transition_seconds=0.6,
                intro_seconds=0.0,
                outro_seconds=15.0,
                hook_seconds=8.0,
            ),
            visuals=VisualsConfig(
                background="#0a0a0a",
                accent_color="#fbbf24",
                zoom=True,
                captions="auto",
            ),
            audio=FormatAudioConfig(
                voiceover=True,
                music=True,
                music_genre="cinematic",
                sound_effects=True,
                ducking=True,
            ),
            tags=["youtube", "storytelling", "long-form"],
        ))
        
        # Video matting format - UGC with overlays
        self.register(VideoFormat(
            format_id="matte_v1",
            name="Video Matting",
            description="Layer composition with green screen and overlays.",
            layout=LayoutType.LAYERED,
            scene_order=["matte_composition"],
            item_mapping=ItemMapping(source="items", scene="MatteScene"),
            timing=TimingConfig(
                per_item_seconds=0.0,  # Determined by source video
                transition_seconds=0.0,
            ),
            visuals=VisualsConfig(
                captions="always_on",
            ),
            audio=FormatAudioConfig(
                voiceover=False,
                music=True,
            ),
            tags=["ugc", "composite", "production"],
        ))
    
    def register(self, format: VideoFormat) -> None:
        """Register a video format."""
        self._formats[format.format_id] = format
    
    def get(self, format_id: str) -> Optional[VideoFormat]:
        """Get a format by ID."""
        return self._formats.get(format_id)
    
    def list_all(self) -> List[VideoFormat]:
        """List all registered formats."""
        return list(self._formats.values())
    
    def list_by_tag(self, tag: str) -> List[VideoFormat]:
        """List formats matching a tag."""
        return [f for f in self._formats.values() if tag in f.tags]
    
    def get_ids(self) -> List[str]:
        """Get all format IDs."""
        return list(self._formats.keys())
    
    def to_json(self) -> str:
        """Export all formats as JSON."""
        return json.dumps({
            fid: f.to_dict() for fid, f in self._formats.items()
        }, indent=2)


# Global registry instance
_registry = None

def get_format_registry() -> FormatRegistry:
    """Get the global format registry."""
    global _registry
    if _registry is None:
        _registry = FormatRegistry()
    return _registry
