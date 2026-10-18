"""
Video Generation Types

Pydantic models for the format-agnostic video generation pipeline.
"""

from typing import Optional, Literal, Any
from pydantic import BaseModel, Field
from enum import Enum


class BeatType(str, Enum):
    """Types of narrative beats."""
    HOOK = "HOOK"
    PROMISE = "PROMISE"
    STEP = "STEP"
    PROOF = "PROOF"
    CTA = "CTA"
    OUTRO = "OUTRO"


Aspect = Literal["9:16", "16:9", "1:1"]
Platform = Literal["youtube", "tiktok", "instagram"]
Goal = Literal["educate", "entertain", "sell", "nurture"]
VoiceMode = Literal["EXTERNAL_NARRATOR", "SORA_DIALOGUE", "HYBRID"]


class Evidence(BaseModel):
    """Evidence item from trend data."""
    type: Literal["title", "comment", "stat"]
    text: str
    url: Optional[str] = None


class TrendItemV1(BaseModel):
    """Trend data input."""
    id: str
    platform: Platform
    topic: str
    angle_candidates: list[str] = Field(default_factory=list, alias="angleCandidates")
    evidence: list[Evidence] = Field(default_factory=list)
    
    class Config:
        populate_by_name = True


class ContentConstraints(BaseModel):
    """Constraints for content generation."""
    max_seconds: int = Field(default=58, alias="maxSeconds")
    avoid_claims: list[str] = Field(default_factory=list, alias="avoidClaims")
    
    class Config:
        populate_by_name = True


class CTA(BaseModel):
    """Call to action."""
    text: str
    url: Optional[str] = None


class ContentBriefV1(BaseModel):
    """Content brief input."""
    goal: Goal
    audience: str
    promise: str
    constraints: Optional[ContentConstraints] = None
    cta: Optional[CTA] = Field(None, alias="CTA")
    key_points: list[str] = Field(default_factory=list, alias="keyPoints")
    
    class Config:
        populate_by_name = True


class OnScreenText(BaseModel):
    """On-screen text for a beat."""
    headline: Optional[str] = None
    sub: Optional[str] = None
    bullet: Optional[str] = None
    label: Optional[str] = None


class BrollIntent(BaseModel):
    """B-roll intent for a beat."""
    intent: Literal["abstract", "ui-demo", "diagram", "meme", "screenshot", "chart"]
    query: str


class AudioIntent(BaseModel):
    """Audio intent for a beat."""
    music_energy: Optional[Literal["low", "mid", "high"]] = Field(None, alias="music_energy")
    sfx: list[str] = Field(default_factory=list)
    
    class Config:
        populate_by_name = True


class Beat(BaseModel):
    """A narrative beat in the story IR."""
    id: str
    type: BeatType
    duration_s: float = Field(alias="duration_s")
    narration: str
    on_screen: Optional[OnScreenText] = Field(None, alias="on_screen")
    broll: list[BrollIntent] = Field(default_factory=list)
    audio: Optional[AudioIntent] = None
    
    class Config:
        populate_by_name = True


class StoryIRMeta(BaseModel):
    """Metadata for Story IR."""
    fps: int = 30
    aspect: Aspect = "9:16"
    language: str = "en"
    tone: str = "witty-direct"
    max_seconds: int = Field(default=58, alias="maxSeconds")
    
    class Config:
        populate_by_name = True


class StoryIRVariables(BaseModel):
    """Variables extracted from trend + brief."""
    topic: str
    angle: str
    audience: str
    promise: str


class StoryIRV1(BaseModel):
    """The semantic intermediate representation."""
    meta: StoryIRMeta
    variables: StoryIRVariables
    beats: list[Beat]
    
    def total_duration_s(self) -> float:
        """Get total duration in seconds."""
        return sum(b.duration_s for b in self.beats)
    
    def total_frames(self) -> int:
        """Get total duration in frames."""
        return int(self.total_duration_s() * self.meta.fps)


class RenderStrategy(BaseModel):
    """Strategy for which beats use Sora vs native rendering."""
    sora_beat_types: list[BeatType] = Field(alias="soraBeatTypes")
    native_beat_types: list[BeatType] = Field(alias="nativeBeatTypes")
    
    class Config:
        populate_by_name = True


class BeatDefaults(BaseModel):
    """Default settings for a beat type."""
    duration_s: float


class FormatRules(BaseModel):
    """Rules for a format pack."""
    ordering: list[str]  # e.g., ["HOOK", "PROMISE", "STEP*", "CTA"]
    defaults: dict[str, BeatDefaults] = Field(default_factory=dict)
    constraints: dict[str, Any] = Field(default_factory=dict)


class NarratorConfig(BaseModel):
    """Configuration for external narrator."""
    provider: Literal["huggingface", "elevenlabs", "openai"]
    model_id: str = Field(alias="modelId")
    perspective: Literal["third_person", "first_person"] = "third_person"
    style_tags: list[str] = Field(default_factory=list, alias="styleTags")
    
    class Config:
        populate_by_name = True


class SoraDialogueConfig(BaseModel):
    """Configuration for Sora dialogue mode."""
    allow_beat_types: list[BeatType] = Field(alias="allowBeatTypes")
    max_seconds_per_beat: int = Field(default=5, alias="maxSecondsPerBeat")
    keep_sora_audio: bool = Field(default=True, alias="keepSoraAudio")
    
    class Config:
        populate_by_name = True


class VoiceConstraints(BaseModel):
    """Constraints for voice handling."""
    forbid_on_screen_talking_when_narrated: bool = Field(
        default=True, alias="forbidOnScreenTalkingWhenNarrated"
    )
    ambience_only_when_narrated: bool = Field(
        default=True, alias="ambienceOnlyWhenNarrated"
    )
    duck_sora_ambience_when_narrated: bool = Field(
        default=True, alias="duckSoraAmbienceWhenNarrated"
    )
    
    class Config:
        populate_by_name = True


class VoiceStrategy(BaseModel):
    """Voice strategy for a format."""
    mode: VoiceMode
    narrator: Optional[NarratorConfig] = None
    sora_dialogue: Optional[SoraDialogueConfig] = Field(None, alias="soraDialogue")
    constraints: VoiceConstraints = Field(default_factory=VoiceConstraints)
    
    class Config:
        populate_by_name = True


class FormatTraits(BaseModel):
    """Traits for format selection scoring."""
    pace: Literal["fast", "mid", "slow"]
    meme_density: Literal["low", "mid", "high"] = Field(alias="memeDensity")
    sora_reliance: Literal["low", "mid", "high"] = Field(alias="soraReliance")
    native_reliance: Literal["low", "mid", "high"] = Field(alias="nativeReliance")
    best_for_platforms: list[Platform] = Field(alias="bestForPlatforms")
    best_for_goals: list[Goal] = Field(alias="bestForGoals")
    
    class Config:
        populate_by_name = True


class FormatPackV1(BaseModel):
    """A format pack defining visual structure."""
    id: str
    label: str
    family: Literal["explainer", "devlog", "skit", "cinematic", "documentary"]
    rules: FormatRules
    render_strategy: RenderStrategy = Field(alias="renderStrategy")
    component_map: dict[str, str] = Field(default_factory=dict, alias="componentMap")
    voice_strategy: Optional[VoiceStrategy] = Field(None, alias="voice_strategy")
    traits: Optional[FormatTraits] = None
    
    class Config:
        populate_by_name = True


class StyleBible(BaseModel):
    """Style bible for Sora prompts."""
    global_tokens: list[str] = Field(alias="global_tokens")
    negative_tokens: list[str] = Field(default_factory=list, alias="negative_tokens")
    
    class Config:
        populate_by_name = True


class Shot(BaseModel):
    """A shot in the shot plan (Sora request)."""
    id: str
    from_beat_id: str = Field(alias="fromBeatId")
    seconds: int
    prompt: str
    model: Literal["sora-2", "sora-2-pro"] = "sora-2"
    size: Literal["720x1280", "1280x720"] = "720x1280"
    tags: list[BeatType] = Field(default_factory=list)
    cache_key: str = Field(alias="cacheKey")
    
    class Config:
        populate_by_name = True


class ShotPlanMeta(BaseModel):
    """Metadata for shot plan."""
    fps: int = 30
    aspect: Aspect = "9:16"
    size: Literal["720x1280", "1280x720"] = "720x1280"


class ShotReferences(BaseModel):
    """Reference files for Sora."""
    file_ids: list[str] = Field(default_factory=list, alias="file_ids")
    
    class Config:
        populate_by_name = True


class ShotPlanV1(BaseModel):
    """The shot plan for Sora generation."""
    meta: ShotPlanMeta
    style_bible: StyleBible = Field(alias="style_bible")
    references: Optional[ShotReferences] = None
    shots: list[Shot]
    
    class Config:
        populate_by_name = True


class Clip(BaseModel):
    """A generated clip in the asset manifest."""
    shot_id: str = Field(alias="shotId")
    beat_id: str = Field(alias="beatId")
    src: str
    seconds: float
    has_audio: bool = Field(default=True, alias="hasAudio")
    
    class Config:
        populate_by_name = True


class AssetManifestV1(BaseModel):
    """Manifest of generated assets."""
    clips: list[Clip] = Field(default_factory=list)
    music: list[dict] = Field(default_factory=list)
    sfx: list[dict] = Field(default_factory=list)
    captions: Optional[dict] = None


class RenderPlanMeta(BaseModel):
    """Metadata for render plan."""
    fps: int
    size: dict[str, int]  # {"w": 720, "h": 1280}


class TimelineItem(BaseModel):
    """An item on the render timeline."""
    id: str
    from_frame: int = Field(alias="from")
    duration_in_frames: int = Field(alias="durationInFrames")
    kind: Literal["video", "native"]
    src: Optional[str] = None  # For video
    component_name: Optional[str] = Field(None, alias="componentName")  # For native
    props: Optional[dict] = None
    
    class Config:
        populate_by_name = True


class RenderPlanRemotionV1(BaseModel):
    """Render plan for Remotion."""
    meta: RenderPlanMeta
    timeline: list[TimelineItem]
    
    def total_frames(self) -> int:
        """Get total frames in the timeline."""
        if not self.timeline:
            return 0
        last = self.timeline[-1]
        return last.from_frame + last.duration_in_frames
