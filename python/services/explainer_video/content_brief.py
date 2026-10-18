"""
Content Brief Schema
====================
Defines the canonical content brief structure for all video formats.
This is the single input that drives the entire video generation pipeline.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any
from uuid import UUID, uuid4
import json


class ContentItemType(str, Enum):
    """Types of content items that can appear in a video."""
    TOPIC = "topic"           # Single concept/topic (explainers)
    COMPARISON = "comparison"  # A vs B comparison
    STEP = "step"             # Tutorial step
    BEAT = "beat"             # Narrative beat
    DEV_EVENT = "dev_event"   # Dev vlog event
    SCENE = "scene"           # Generic scene
    HOOK = "hook"             # Opening hook
    CTA = "cta"               # Call to action
    TRANSITION = "transition" # Transition between sections


class ToneType(str, Enum):
    """Tone/voice of the content."""
    NEUTRAL = "neutral"
    AUTHORITATIVE = "authoritative"
    CASUAL = "casual"
    ENERGETIC = "energetic"
    EDUCATIONAL = "educational"
    HUMOROUS = "humorous"


class AspectRatio(str, Enum):
    """Video aspect ratios."""
    LANDSCAPE = "16:9"
    PORTRAIT = "9:16"
    SQUARE = "1:1"


@dataclass
class MediaAsset:
    """A media asset (image, video, audio) reference."""
    type: str  # "image", "video", "audio", "icon"
    source: str  # URL, file path, or asset ID
    alt_text: Optional[str] = None
    duration_seconds: Optional[float] = None
    attribution: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return {
            "type": self.type,
            "source": self.source,
            "alt_text": self.alt_text,
            "duration_seconds": self.duration_seconds,
            "attribution": self.attribution,
        }


@dataclass
class NarrationConfig:
    """Configuration for narration/voiceover."""
    script: str
    tts_voice: str = "neutral_male"
    speed: float = 1.0
    language: str = "en"
    
    def to_dict(self) -> Dict:
        return {
            "script": self.script,
            "tts_voice": self.tts_voice,
            "speed": self.speed,
            "language": self.language,
        }


@dataclass
class VisualStyle:
    """Visual styling for a content item."""
    background_color: str = "#0f0f0f"
    text_color: str = "#ffffff"
    accent_color: str = "#FFD54F"
    highlight_color: Optional[str] = None
    zoom_level: float = 1.0
    animation: str = "fade_in"  # fade_in, slide_up, bounce, scale
    
    def to_dict(self) -> Dict:
        return {
            "background_color": self.background_color,
            "text_color": self.text_color,
            "accent_color": self.accent_color,
            "highlight_color": self.highlight_color,
            "zoom_level": self.zoom_level,
            "animation": self.animation,
        }


@dataclass
class ContentItem:
    """
    A single content item in the video.
    This is the atomic unit - one topic, one step, one beat.
    """
    id: str
    type: ContentItemType
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    
    # Media assets
    icon: Optional[MediaAsset] = None
    images: List[MediaAsset] = field(default_factory=list)
    videos: List[MediaAsset] = field(default_factory=list)  # B-roll
    
    # Audio
    narration: Optional[NarrationConfig] = None
    sound_effects: List[MediaAsset] = field(default_factory=list)
    
    # Visual styling
    visual: Optional[VisualStyle] = None
    
    # Timing (optional - can be auto-calculated)
    duration_seconds: Optional[float] = None
    
    # For comparisons
    compare_to: Optional[str] = None  # ID of item to compare with
    
    # Metadata
    tags: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "type": self.type.value if isinstance(self.type, Enum) else self.type,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "icon": self.icon.to_dict() if self.icon else None,
            "images": [img.to_dict() for img in self.images],
            "videos": [vid.to_dict() for vid in self.videos],
            "narration": self.narration.to_dict() if self.narration else None,
            "sound_effects": [sfx.to_dict() for sfx in self.sound_effects],
            "visual": self.visual.to_dict() if self.visual else None,
            "duration_seconds": self.duration_seconds,
            "compare_to": self.compare_to,
            "tags": self.tags,
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "ContentItem":
        """Create ContentItem from dictionary."""
        return cls(
            id=data.get("id", str(uuid4())[:8]),
            type=ContentItemType(data.get("type", "topic")),
            title=data.get("title", ""),
            description=data.get("description"),
            category=data.get("category"),
            icon=MediaAsset(**data["icon"]) if data.get("icon") else None,
            images=[MediaAsset(**img) for img in data.get("images", [])],
            videos=[MediaAsset(**vid) for vid in data.get("videos", [])],
            narration=NarrationConfig(**data["narration"]) if data.get("narration") else None,
            sound_effects=[MediaAsset(**sfx) for sfx in data.get("sound_effects", [])],
            visual=VisualStyle(**data["visual"]) if data.get("visual") else None,
            duration_seconds=data.get("duration_seconds"),
            compare_to=data.get("compare_to"),
            tags=data.get("tags", []),
        )


@dataclass
class VideoMeta:
    """Video-level metadata."""
    title: str
    description: str = ""
    target_duration_seconds: int = 600  # 10 minutes default
    tone: ToneType = ToneType.NEUTRAL
    audience_level: str = "general"  # general, beginner, intermediate, expert
    objective: str = "coverage"  # coverage, depth, entertainment, tutorial
    
    def to_dict(self) -> Dict:
        return {
            "title": self.title,
            "description": self.description,
            "target_duration_seconds": self.target_duration_seconds,
            "tone": self.tone.value if isinstance(self.tone, Enum) else self.tone,
            "audience_level": self.audience_level,
            "objective": self.objective,
        }


@dataclass
class StyleConfig:
    """Global style configuration."""
    format: str = "explainer"  # explainer, listicle, comparison, narrative, shorts
    visual_density: str = "low"  # low, medium, high
    animation_style: str = "minimal"  # minimal, moderate, dynamic
    aspect_ratio: AspectRatio = AspectRatio.LANDSCAPE
    resolution: str = "1920x1080"
    fps: int = 30
    
    def to_dict(self) -> Dict:
        return {
            "format": self.format,
            "visual_density": self.visual_density,
            "animation_style": self.animation_style,
            "aspect_ratio": self.aspect_ratio.value if isinstance(self.aspect_ratio, Enum) else self.aspect_ratio,
            "resolution": self.resolution,
            "fps": self.fps,
        }


@dataclass
class PacingConfig:
    """Pacing configuration."""
    default_item_duration_seconds: float = 60.0
    min_item_duration_seconds: float = 30.0
    max_item_duration_seconds: float = 90.0
    transition_duration_frames: int = 12
    intro_duration_seconds: float = 5.0
    outro_duration_seconds: float = 10.0
    
    def to_dict(self) -> Dict:
        return {
            "default_item_duration_seconds": self.default_item_duration_seconds,
            "min_item_duration_seconds": self.min_item_duration_seconds,
            "max_item_duration_seconds": self.max_item_duration_seconds,
            "transition_duration_frames": self.transition_duration_frames,
            "intro_duration_seconds": self.intro_duration_seconds,
            "outro_duration_seconds": self.outro_duration_seconds,
        }


@dataclass
class AudioConfig:
    """Audio configuration."""
    background_music: bool = True
    music_volume: float = 0.3
    music_genre: str = "ambient"  # ambient, upbeat, cinematic, lo-fi
    voiceover: bool = True
    voiceover_volume: float = 1.0
    sound_effects: bool = True
    sound_effects_volume: float = 0.5
    
    def to_dict(self) -> Dict:
        return {
            "background_music": self.background_music,
            "music_volume": self.music_volume,
            "music_genre": self.music_genre,
            "voiceover": self.voiceover,
            "voiceover_volume": self.voiceover_volume,
            "sound_effects": self.sound_effects,
            "sound_effects_volume": self.sound_effects_volume,
        }


@dataclass
class OrderingConfig:
    """Content ordering strategy."""
    strategy: str = "sequential"  # sequential, familiar_to_obscure, importance, random
    
    def to_dict(self) -> Dict:
        return {"strategy": self.strategy}


@dataclass
class EndingConfig:
    """Outro/ending configuration."""
    type: str = "soft_wrap"  # soft_wrap, cta, subscribe, none
    message: str = ""
    cta_text: Optional[str] = None
    cta_url: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return {
            "type": self.type,
            "message": self.message,
            "cta_text": self.cta_text,
            "cta_url": self.cta_url,
        }


@dataclass
class ContentBrief:
    """
    The canonical content brief schema.
    This is the single input that drives all video generation.
    
    A content brief is format-agnostic - the same brief can produce
    different video formats (explainer, shorts, comparison, etc.)
    """
    id: str = field(default_factory=lambda: str(uuid4()))
    created_at: datetime = field(default_factory=datetime.now)
    
    # Core content
    video: VideoMeta = field(default_factory=lambda: VideoMeta(title="Untitled"))
    items: List[ContentItem] = field(default_factory=list)
    
    # Configuration
    style: StyleConfig = field(default_factory=StyleConfig)
    pacing: PacingConfig = field(default_factory=PacingConfig)
    audio: AudioConfig = field(default_factory=AudioConfig)
    ordering: OrderingConfig = field(default_factory=OrderingConfig)
    ending: EndingConfig = field(default_factory=EndingConfig)
    
    # Asset references (populated during asset resolution)
    resolved_assets: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat(),
            "video": self.video.to_dict(),
            "items": [item.to_dict() for item in self.items],
            "style": self.style.to_dict(),
            "pacing": self.pacing.to_dict(),
            "audio": self.audio.to_dict(),
            "ordering": self.ordering.to_dict(),
            "ending": self.ending.to_dict(),
            "resolved_assets": self.resolved_assets,
        }
    
    def to_json(self, indent: int = 2) -> str:
        """Convert to JSON string."""
        return json.dumps(self.to_dict(), indent=indent)
    
    @classmethod
    def from_dict(cls, data: Dict) -> "ContentBrief":
        """Create ContentBrief from dictionary."""
        return cls(
            id=data.get("id", str(uuid4())),
            created_at=datetime.fromisoformat(data["created_at"]) if data.get("created_at") else datetime.now(),
            video=VideoMeta(**data["video"]) if data.get("video") else VideoMeta(title="Untitled"),
            items=[ContentItem.from_dict(item) for item in data.get("items", [])],
            style=StyleConfig(**data["style"]) if data.get("style") else StyleConfig(),
            pacing=PacingConfig(**data["pacing"]) if data.get("pacing") else PacingConfig(),
            audio=AudioConfig(**data["audio"]) if data.get("audio") else AudioConfig(),
            ordering=OrderingConfig(**data["ordering"]) if data.get("ordering") else OrderingConfig(),
            ending=EndingConfig(**data["ending"]) if data.get("ending") else EndingConfig(),
            resolved_assets=data.get("resolved_assets", {}),
        )
    
    @classmethod
    def from_json(cls, json_str: str) -> "ContentBrief":
        """Create ContentBrief from JSON string."""
        return cls.from_dict(json.loads(json_str))
    
    def calculate_total_duration(self) -> float:
        """Calculate total video duration based on items and pacing."""
        intro = self.pacing.intro_duration_seconds
        outro = self.pacing.outro_duration_seconds
        
        item_duration = sum(
            item.duration_seconds or self.pacing.default_item_duration_seconds
            for item in self.items
        )
        
        transitions = len(self.items) * (self.pacing.transition_duration_frames / self.style.fps)
        
        return intro + item_duration + transitions + outro
    
    def add_item(self, item: ContentItem) -> None:
        """Add a content item."""
        self.items.append(item)
    
    def get_items_by_type(self, item_type: ContentItemType) -> List[ContentItem]:
        """Get all items of a specific type."""
        return [item for item in self.items if item.type == item_type]
    
    def get_items_by_category(self, category: str) -> List[ContentItem]:
        """Get all items in a category."""
        return [item for item in self.items if item.category == category]
