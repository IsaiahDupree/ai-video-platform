"""
Video Orchestrator Models
=========================
Core data models for video orchestration workflow.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4


# =============================================================================
# ENUMS
# =============================================================================

class ProviderName(str, Enum):
    """Supported video generation providers."""
    SORA = "sora"
    RUNWAY = "runway"
    KLING = "kling"
    PIKA = "pika"
    LUMA = "luma"
    MOCK = "mock"


class ClipRunStatus(str, Enum):
    """Status of a clip generation run."""
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELED = "canceled"


class AssessmentVerdict(str, Enum):
    """Result of clip assessment."""
    PASS = "pass"
    FAIL = "fail"
    NEEDS_REVIEW = "needs_review"


class OrchestratorRole(str, Enum):
    """Roles in the orchestration workflow."""
    CONTENT_BRIEF = "content_brief"
    DIRECTOR = "director"
    SCENE_CRAFTER = "scene_crafter"
    ASSESSOR = "assessor"


class ClipState(str, Enum):
    """State of a clip in the plan."""
    PENDING = "pending"
    GENERATING = "generating"
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"


class PlanStatus(str, Enum):
    """Status of a clip plan."""
    DRAFT = "draft"
    READY = "ready"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    ARCHIVED = "archived"


class RenderStatus(str, Enum):
    """Status of final render."""
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class BibleKind(str, Enum):
    """Types of reference bibles."""
    STYLE = "style"
    CHARACTER = "character"
    CONTINUITY = "continuity"


class NarrationMode(str, Enum):
    """How narration is handled."""
    GENERATED_IN_VIDEO = "generated_in_video"
    EXTERNAL_VOICEOVER = "external_voiceover"
    NONE = "none"


class RepairStrategy(str, Enum):
    """Strategies for repairing failed clips."""
    PROMPT_PATCH = "prompt_patch"
    REMIX = "remix"
    FALLBACK_PROVIDER = "fallback_provider"


class CheckType(str, Enum):
    """Types of assessment checks."""
    TRANSCRIPT_MATCH = "transcript_match"
    VISUAL_REQUIREMENTS = "visual_requirements"
    CONTINUITY = "continuity"
    NO_ARTIFACTS = "no_artifacts"
    DURATION_OK = "duration_ok"


# =============================================================================
# CONFIG MODELS (for JSONB fields)
# =============================================================================

@dataclass
class NarrationConfig:
    """Narration configuration for a clip."""
    mode: NarrationMode = NarrationMode.EXTERNAL_VOICEOVER
    text: str = ""
    speaker: str = "narrator"
    language: str = "en"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "mode": self.mode.value if isinstance(self.mode, NarrationMode) else self.mode,
            "text": self.text,
            "speaker": self.speaker,
            "language": self.language
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "NarrationConfig":
        mode = data.get("mode", "external_voiceover")
        if isinstance(mode, str):
            mode = NarrationMode(mode)
        return cls(
            mode=mode,
            text=data.get("text", ""),
            speaker=data.get("speaker", "narrator"),
            language=data.get("language", "en")
        )


@dataclass
class VisualIntent:
    """Visual requirements for a clip."""
    prompt: str = ""
    must_include: List[str] = field(default_factory=list)
    must_avoid: List[str] = field(default_factory=list)
    camera: str = ""
    setting: str = ""
    style_overrides: List[str] = field(default_factory=list)
    character_refs: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "prompt": self.prompt,
            "must_include": self.must_include,
            "must_avoid": self.must_avoid,
            "camera": self.camera,
            "setting": self.setting,
            "style_overrides": self.style_overrides,
            "character_refs": self.character_refs
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "VisualIntent":
        return cls(
            prompt=data.get("prompt", ""),
            must_include=data.get("must_include", []),
            must_avoid=data.get("must_avoid", []),
            camera=data.get("camera", ""),
            setting=data.get("setting", ""),
            style_overrides=data.get("style_overrides", []),
            character_refs=data.get("character_refs", [])
        )


@dataclass
class ProviderReference:
    """Reference asset for provider."""
    type: str  # image, video, style, character
    asset_id: str
    weight: float = 1.0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "asset_id": self.asset_id,
            "weight": self.weight
        }


@dataclass
class ProviderHints:
    """Provider-specific configuration."""
    primary_provider: ProviderName = ProviderName.SORA
    model: str = "sora-2"
    size: str = "1280x720"
    seed: Optional[int] = None
    references: List[ProviderReference] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "primary_provider": self.primary_provider.value if isinstance(self.primary_provider, ProviderName) else self.primary_provider,
            "model": self.model,
            "size": self.size,
            "seed": self.seed,
            "references": [r.to_dict() if hasattr(r, 'to_dict') else r for r in self.references]
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ProviderHints":
        provider = data.get("primary_provider", "sora")
        if isinstance(provider, str):
            provider = ProviderName(provider)
        
        refs = []
        for r in data.get("references", []):
            if isinstance(r, dict):
                refs.append(ProviderReference(**r))
            else:
                refs.append(r)
        
        return cls(
            primary_provider=provider,
            model=data.get("model", "sora-2"),
            size=data.get("size", "1280x720"),
            seed=data.get("seed"),
            references=refs
        )


@dataclass
class AcceptanceCheck:
    """Single acceptance check definition."""
    type: CheckType
    weight: float = 0.25
    params: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type.value if isinstance(self.type, CheckType) else self.type,
            "weight": self.weight,
            "params": self.params
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "AcceptanceCheck":
        check_type = data.get("type", "visual_requirements")
        if isinstance(check_type, str):
            check_type = CheckType(check_type)
        return cls(
            type=check_type,
            weight=data.get("weight", 0.25),
            params=data.get("params", {})
        )


@dataclass
class AcceptanceCriteria:
    """Acceptance criteria for a clip."""
    score_threshold: float = 0.8
    checks: List[AcceptanceCheck] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "score_threshold": self.score_threshold,
            "checks": [c.to_dict() for c in self.checks]
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "AcceptanceCriteria":
        checks = []
        for c in data.get("checks", []):
            if isinstance(c, dict):
                checks.append(AcceptanceCheck.from_dict(c))
            else:
                checks.append(c)
        return cls(
            score_threshold=data.get("score_threshold", 0.8),
            checks=checks
        )
    
    @classmethod
    def default(cls) -> "AcceptanceCriteria":
        """Default acceptance criteria."""
        return cls(
            score_threshold=0.8,
            checks=[
                AcceptanceCheck(type=CheckType.VISUAL_REQUIREMENTS, weight=0.30),
                AcceptanceCheck(type=CheckType.CONTINUITY, weight=0.25),
                AcceptanceCheck(type=CheckType.NO_ARTIFACTS, weight=0.25),
                AcceptanceCheck(type=CheckType.DURATION_OK, weight=0.20),
            ]
        )


@dataclass
class PacingConstraints:
    """Pacing rules for narration."""
    words_per_minute: int = 150
    max_words_per_clip: int = 30
    min_pause_ms: int = 250
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "words_per_minute": self.words_per_minute,
            "max_words_per_clip": self.max_words_per_clip,
            "min_pause_ms": self.min_pause_ms
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "PacingConstraints":
        return cls(
            words_per_minute=data.get("words_per_minute", 150),
            max_words_per_clip=data.get("max_words_per_clip", 30),
            min_pause_ms=data.get("min_pause_ms", 250)
        )


@dataclass
class RetryPolicy:
    """Retry policy for failed clips."""
    max_attempts_per_clip: int = 3
    allow_remix: bool = True
    fallback_providers: List[ProviderName] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "max_attempts_per_clip": self.max_attempts_per_clip,
            "allow_remix": self.allow_remix,
            "fallback_providers": [
                p.value if isinstance(p, ProviderName) else p 
                for p in self.fallback_providers
            ]
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "RetryPolicy":
        providers = []
        for p in data.get("fallback_providers", []):
            if isinstance(p, str):
                providers.append(ProviderName(p))
            else:
                providers.append(p)
        return cls(
            max_attempts_per_clip=data.get("max_attempts_per_clip", 3),
            allow_remix=data.get("allow_remix", True),
            fallback_providers=providers
        )


@dataclass
class PlanConstraints:
    """Overall constraints for a clip plan."""
    max_total_seconds: int = 300  # 5 minutes
    default_clip_seconds: int = 8
    aspect_ratio: str = "16:9"
    resolution: str = "1080p"
    pacing: PacingConstraints = field(default_factory=PacingConstraints)
    retry_policy: RetryPolicy = field(default_factory=RetryPolicy)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "max_total_seconds": self.max_total_seconds,
            "default_clip_seconds": self.default_clip_seconds,
            "aspect_ratio": self.aspect_ratio,
            "resolution": self.resolution,
            "pacing": self.pacing.to_dict(),
            "retry_policy": self.retry_policy.to_dict()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "PlanConstraints":
        return cls(
            max_total_seconds=data.get("max_total_seconds", 300),
            default_clip_seconds=data.get("default_clip_seconds", 8),
            aspect_ratio=data.get("aspect_ratio", "16:9"),
            resolution=data.get("resolution", "1080p"),
            pacing=PacingConstraints.from_dict(data.get("pacing", {})),
            retry_policy=RetryPolicy.from_dict(data.get("retry_policy", {}))
        )


@dataclass
class RepairInstruction:
    """Instructions for repairing a failed clip."""
    strategy: RepairStrategy
    prompt_delta: str = ""
    fallback_provider: Optional[ProviderName] = None
    notes: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "strategy": self.strategy.value if isinstance(self.strategy, RepairStrategy) else self.strategy,
            "prompt_delta": self.prompt_delta,
            "fallback_provider": self.fallback_provider.value if self.fallback_provider else None,
            "notes": self.notes
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "RepairInstruction":
        if not data:
            return cls(strategy=RepairStrategy.PROMPT_PATCH)
        
        strategy = data.get("strategy", "prompt_patch")
        if isinstance(strategy, str):
            strategy = RepairStrategy(strategy)
        
        fallback = data.get("fallback_provider")
        if fallback and isinstance(fallback, str):
            fallback = ProviderName(fallback)
        
        return cls(
            strategy=strategy,
            prompt_delta=data.get("prompt_delta", ""),
            fallback_provider=fallback,
            notes=data.get("notes", "")
        )


@dataclass
class CheckBreakdown:
    """Breakdown of a single check result."""
    type: str
    weight: float
    score: float
    notes: str = ""
    evidence: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "weight": self.weight,
            "score": self.score,
            "notes": self.notes,
            "evidence": self.evidence
        }


# =============================================================================
# CORE ENTITY MODELS
# =============================================================================

@dataclass
class VideoProject:
    """Top-level video project container."""
    id: UUID = field(default_factory=uuid4)
    owner_id: Optional[UUID] = None
    title: str = ""
    description: str = ""
    tags: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class VideoBible:
    """Style, character, or continuity reference."""
    id: UUID = field(default_factory=uuid4)
    project_id: UUID = field(default_factory=uuid4)
    kind: BibleKind = BibleKind.STYLE
    name: str = ""
    body: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ContentBrief:
    """Content brief defining video objectives."""
    id: UUID = field(default_factory=uuid4)
    project_id: UUID = field(default_factory=uuid4)
    objective: str = ""
    audience: str = ""
    tone: str = ""
    cta: str = ""
    key_points: List[str] = field(default_factory=list)
    safety: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class VideoScript:
    """Full script for video."""
    id: UUID = field(default_factory=uuid4)
    project_id: UUID = field(default_factory=uuid4)
    brief_id: Optional[UUID] = None
    title: str = ""
    body: str = ""
    language: str = "en"
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ClipPlan:
    """Orchestration plan for video generation."""
    id: UUID = field(default_factory=uuid4)
    project_id: UUID = field(default_factory=uuid4)
    brief_id: Optional[UUID] = None
    script_id: Optional[UUID] = None
    style_bible_id: Optional[UUID] = None
    character_bible_id: Optional[UUID] = None
    continuity_bible_id: Optional[UUID] = None
    version: str = "1.0.0"
    constraints: PlanConstraints = field(default_factory=PlanConstraints)
    plan_json: Dict[str, Any] = field(default_factory=dict)
    status: PlanStatus = PlanStatus.DRAFT
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Scene:
    """Scene container within clip plan."""
    id: UUID = field(default_factory=uuid4)
    clip_plan_id: UUID = field(default_factory=uuid4)
    name: str = ""
    goal: str = ""
    beats: List[str] = field(default_factory=list)
    scene_order: int = 0
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ClipPlanClip:
    """Individual clip definition."""
    id: UUID = field(default_factory=uuid4)
    scene_id: UUID = field(default_factory=uuid4)
    clip_order: int = 0
    target_seconds: int = 8
    narration: NarrationConfig = field(default_factory=NarrationConfig)
    visual_intent: VisualIntent = field(default_factory=VisualIntent)
    provider_hints: ProviderHints = field(default_factory=ProviderHints)
    acceptance: AcceptanceCriteria = field(default_factory=AcceptanceCriteria.default)
    state: ClipState = ClipState.PENDING
    provider_override: Optional[ProviderName] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ClipRun:
    """Provider generation attempt."""
    id: UUID = field(default_factory=uuid4)
    clip_plan_clip_id: UUID = field(default_factory=uuid4)
    provider: ProviderName = ProviderName.SORA
    provider_generation_id: str = ""
    attempt: int = 1
    status: ClipRunStatus = ClipRunStatus.QUEUED
    request_payload: Dict[str, Any] = field(default_factory=dict)
    response_payload: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None
    duration_actual: Optional[float] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class VideoAsset:
    """Stored video/image file."""
    id: UUID = field(default_factory=uuid4)
    project_id: UUID = field(default_factory=uuid4)
    kind: str = "video_mp4"
    url: str = ""
    content_type: str = ""
    bytes: int = 0
    sha256: str = ""
    meta: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Assessment:
    """QA assessment result."""
    id: UUID = field(default_factory=uuid4)
    clip_run_id: UUID = field(default_factory=uuid4)
    assessor_role: OrchestratorRole = OrchestratorRole.ASSESSOR
    verdict: AssessmentVerdict = AssessmentVerdict.FAIL
    score: float = 0.0
    reasons: List[str] = field(default_factory=list)
    breakdown: List[CheckBreakdown] = field(default_factory=list)
    repair_instruction: Optional[RepairInstruction] = None
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class RepairAttempt:
    """Record of repair attempt."""
    id: UUID = field(default_factory=uuid4)
    clip_plan_clip_id: UUID = field(default_factory=uuid4)
    from_clip_run_id: Optional[UUID] = None
    strategy: RepairStrategy = RepairStrategy.PROMPT_PATCH
    prompt_delta: str = ""
    fallback_provider: Optional[ProviderName] = None
    notes: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class FinalRender:
    """Assembled timeline output."""
    id: UUID = field(default_factory=uuid4)
    clip_plan_id: UUID = field(default_factory=uuid4)
    status: RenderStatus = RenderStatus.QUEUED
    output_asset_id: Optional[UUID] = None
    timeline_json: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None
    duration_seconds: Optional[float] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
