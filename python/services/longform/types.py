"""
Longform Pipeline — Canonical Types v1.0

Python dataclasses mirroring src/types/LongformSchema.ts.
These define the contract between pipeline services.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import List, Optional, Dict, Any


# ─── Enums ───────────────────────────────────────────────────────────────────

class EditMode(str, Enum):
    SPEAKER_ONLY = "speaker_only"
    SPEAKER_PLUS_TEXT = "speaker_plus_text"
    BROLL_COVER = "broll_cover"
    SPEAKER_OVER_BROLL = "speaker_over_broll"


class RetentionRole(str, Enum):
    HOOK = "hook"
    EXPLANATION = "explanation"
    STORY = "story"
    PROOF = "proof"
    RESET = "reset"
    PAYOFF = "payoff"


class TransitionType(str, Enum):
    CUT = "cut"
    DISSOLVE_FAST = "dissolve_fast"
    DISSOLVE_SLOW = "dissolve_slow"
    CROSSFADE = "crossfade"


class ZoomType(str, Enum):
    SLOW_PUSH_IN = "slow_push_in"
    SLOW_PULL_OUT = "slow_pull_out"
    SNAP_ZOOM = "snap_zoom"
    NONE = "none"


class CaptionStyle(str, Enum):
    HIGHLIGHT_KEY_WORDS = "highlight_key_words"
    FULL_SENTENCE = "full_sentence"
    KARAOKE = "karaoke"
    MINIMAL = "minimal"


class EnergyLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


# ─── Transcript Types ────────────────────────────────────────────────────────

@dataclass
class TranscriptWord:
    word: str
    start: float       # seconds
    end: float         # seconds
    confidence: float = 1.0
    speaker_id: str = "speaker_0"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class TranscriptSegment:
    speaker: str
    start: float       # seconds
    end: float         # seconds
    text: str
    words: List[TranscriptWord] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "speaker": self.speaker,
            "start": self.start,
            "end": self.end,
            "text": self.text,
            "words": [w.to_dict() for w in self.words],
        }


@dataclass
class TranscriptionResult:
    segments: List[TranscriptSegment]
    speakers: List[str]
    language: str
    confidence: float
    duration_seconds: float

    @property
    def all_words(self) -> List[TranscriptWord]:
        return [w for seg in self.segments for w in seg.words]

    @property
    def full_text(self) -> str:
        return " ".join(seg.text for seg in self.segments)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "segments": [s.to_dict() for s in self.segments],
            "speakers": self.speakers,
            "language": self.language,
            "confidence": self.confidence,
            "duration_seconds": self.duration_seconds,
        }


# ─── Scene Detection Types ───────────────────────────────────────────────────

@dataclass
class SceneBoundary:
    scene_id: int
    start_time: float   # seconds
    end_time: float     # seconds
    transition_type: str  # "cut" | "dissolve" | "fade"
    confidence: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class SceneDetectionResult:
    scenes: List[SceneBoundary]
    safe_cut_points: List[float]  # seconds

    def to_dict(self) -> Dict[str, Any]:
        return {
            "scenes": [s.to_dict() for s in self.scenes],
            "safe_cut_points": self.safe_cut_points,
        }


# ─── B-Roll Types ────────────────────────────────────────────────────────────

@dataclass
class BrollSearchIntent:
    literal: str
    metaphor: str
    contextual: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    def queries(self) -> List[str]:
        return [self.literal, self.metaphor, self.contextual]


@dataclass
class BrollCandidate:
    candidate_id: str
    source: str             # "pexels" | "shutterstock" | "adobe_stock" | "storyblocks"
    source_asset_id: str
    query_type: str         # "literal" | "metaphor" | "contextual"
    query_text: str
    preview_url: str = ""
    download_url: str = ""
    local_path: str = ""
    duration_seconds: float = 0.0
    width: int = 0
    height: int = 0
    fps: int = 30
    # Scoring
    embedding_similarity: float = 0.0
    semantic_fit: float = 0.0
    tone_fit: float = 0.0
    motion_fit: float = 0.0
    novelty_fit: float = 0.0
    overall_score: float = 0.0
    selected: bool = False
    license_ok: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# ─── Speaker Segmentation Types ──────────────────────────────────────────────

@dataclass
class SpeakerMask:
    mask_id: str
    speaker_id: str
    start_time: float     # seconds
    end_time: float       # seconds
    output_path: str      # path to alpha matte video/sequence
    format: str = "prores_4444_alpha"  # or "png_sequence"
    quality_score: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# ─── Timeline Planning Types ─────────────────────────────────────────────────

@dataclass
class TimelineWindow:
    window_id: str
    start: float          # seconds
    end: float            # seconds
    transcript_text: str
    speaker: str
    words: List[TranscriptWord] = field(default_factory=list)
    # AI-assigned fields
    retention_role: RetentionRole = RetentionRole.EXPLANATION
    edit_mode: EditMode = EditMode.SPEAKER_ONLY
    broll_needed: bool = False
    broll_search_intent: Optional[BrollSearchIntent] = None
    caption_style: CaptionStyle = CaptionStyle.HIGHLIGHT_KEY_WORDS
    zoom_instruction: ZoomType = ZoomType.NONE
    energy_level: EnergyLevel = EnergyLevel.MEDIUM
    nearest_safe_cut: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["retention_role"] = self.retention_role.value
        d["edit_mode"] = self.edit_mode.value
        d["caption_style"] = self.caption_style.value
        d["zoom_instruction"] = self.zoom_instruction.value
        d["energy_level"] = self.energy_level.value
        return d


@dataclass
class TimelinePlan:
    windows: List[TimelineWindow]
    total_duration: float  # seconds

    def broll_windows(self) -> List[TimelineWindow]:
        return [w for w in self.windows if w.broll_needed]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "windows": [w.to_dict() for w in self.windows],
            "total_duration": self.total_duration,
        }


# ─── EDL / Edit Plan (Remotion Input) ────────────────────────────────────────

@dataclass
class ZoomConfig:
    type: ZoomType
    start_scale: float = 1.0
    end_scale: float = 1.08

    def to_remotion(self) -> Dict[str, Any]:
        return {
            "type": self.type.value,
            "startScale": self.start_scale,
            "endScale": self.end_scale,
        }


@dataclass
class CaptionWord:
    word: str
    start: float    # seconds
    end: float      # seconds
    highlight: bool = False

    def to_remotion(self) -> Dict[str, Any]:
        return {
            "word": self.word,
            "start": self.start,
            "end": self.end,
            "highlight": self.highlight,
        }


@dataclass
class CaptionConfig:
    style: CaptionStyle
    highlight_words: List[str]
    position: str = "bottom_center"
    font_size: int = 48
    words: List[CaptionWord] = field(default_factory=list)

    def to_remotion(self) -> Dict[str, Any]:
        return {
            "style": self.style.value,
            "highlightWords": self.highlight_words,
            "position": self.position,
            "fontSize": self.font_size,
            "words": [w.to_remotion() for w in self.words],
        }


@dataclass
class BrollAssetRef:
    asset_id: str
    source: str
    local_path: str
    start_trim: float = 0.0
    end_trim: float = 0.0
    opacity: float = 1.0
    fit: str = "cover"

    def to_remotion(self) -> Dict[str, Any]:
        return {
            "assetId": self.asset_id,
            "source": self.source,
            "localPath": self.local_path,
            "startTrim": self.start_trim,
            "endTrim": self.end_trim,
            "opacity": self.opacity,
            "fit": self.fit,
        }


@dataclass
class SpeakerMaskRef:
    mask_id: str
    path: str
    position: str = "bottom_right"
    scale: float = 0.35
    border_color: str = "#ffffff"
    border_width: int = 3
    border_radius: int = 12

    def to_remotion(self) -> Dict[str, Any]:
        return {
            "maskId": self.mask_id,
            "path": self.path,
            "position": self.position,
            "scale": self.scale,
            "border": {
                "color": self.border_color,
                "width": self.border_width,
                "radius": self.border_radius,
            },
        }


@dataclass
class EdlEntry:
    window_id: str
    start_frame: int
    end_frame: int
    start_time: float
    end_time: float
    edit_mode: EditMode
    retention_role: RetentionRole
    source_start_trim: float
    source_end_trim: float
    broll: Optional[BrollAssetRef] = None
    speaker_mask: Optional[SpeakerMaskRef] = None
    zoom: Optional[ZoomConfig] = None
    captions: Optional[CaptionConfig] = None
    transition_in: TransitionType = TransitionType.CUT
    transition_out: TransitionType = TransitionType.CUT

    def to_remotion(self) -> Dict[str, Any]:
        return {
            "windowId": self.window_id,
            "startFrame": self.start_frame,
            "endFrame": self.end_frame,
            "startTime": self.start_time,
            "endTime": self.end_time,
            "editMode": self.edit_mode.value,
            "retentionRole": self.retention_role.value,
            "sourceClip": {
                "type": "original",
                "startTrim": self.source_start_trim,
                "endTrim": self.source_end_trim,
            },
            "broll": self.broll.to_remotion() if self.broll else None,
            "speakerMask": self.speaker_mask.to_remotion() if self.speaker_mask else None,
            "zoom": self.zoom.to_remotion() if self.zoom else None,
            "captions": self.captions.to_remotion() if self.captions else {"style": "minimal", "highlightWords": [], "position": "bottom_center", "fontSize": 48, "words": []},
            "transitionIn": self.transition_in.value,
            "transitionOut": self.transition_out.value,
        }


@dataclass
class MusicBedConfig:
    track_url: str
    volume: float = 0.08
    duck_during_speech: bool = True
    duck_volume: float = 0.03

    def to_remotion(self) -> Dict[str, Any]:
        return {
            "trackUrl": self.track_url,
            "volume": self.volume,
            "duckDuringSpeech": self.duck_during_speech,
            "duckVolume": self.duck_volume,
        }


@dataclass
class LongformEditPlan:
    """Top-level structure matching LongformVideoProps in TypeScript."""
    video_id: str
    source_video: str
    fps: int
    total_duration_frames: int
    resolution_width: int
    resolution_height: int
    edl: List[EdlEntry]
    music_bed: Optional[MusicBedConfig] = None
    color_grade: str = "neutral_warm"
    letterbox: bool = False
    watermark: Optional[str] = None

    def to_remotion(self) -> Dict[str, Any]:
        """Serialize to JSON matching LongformVideoProps exactly."""
        return {
            "videoId": self.video_id,
            "sourceVideo": self.source_video,
            "fps": self.fps,
            "totalDurationFrames": self.total_duration_frames,
            "resolution": {
                "width": self.resolution_width,
                "height": self.resolution_height,
            },
            "edl": [e.to_remotion() for e in self.edl],
            "musicBed": self.music_bed.to_remotion() if self.music_bed else None,
            "globalStyle": {
                "colorGrade": self.color_grade,
                "letterbox": self.letterbox,
                "watermark": self.watermark,
            },
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_remotion(), indent=indent)

    def save(self, path: str) -> None:
        with open(path, "w") as f:
            f.write(self.to_json())
