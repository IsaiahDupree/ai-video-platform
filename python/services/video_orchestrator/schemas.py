"""
Video Orchestrator Schemas
==========================
Pydantic schemas for API request/response validation.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# =============================================================================
# REQUEST SCHEMAS
# =============================================================================

class CreateProjectRequest(BaseModel):
    """Request to create a video project."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class CreateBibleRequest(BaseModel):
    """Request to create a style/character/continuity bible."""
    project_id: UUID
    kind: str = Field(..., pattern="^(style|character|continuity)$")
    name: str = Field(..., min_length=1, max_length=100)
    body: Dict[str, Any] = Field(default_factory=dict)


class SafetyConfig(BaseModel):
    """Safety configuration for content brief."""
    avoid: List[str] = Field(default_factory=list)
    required_disclaimers: List[str] = Field(default_factory=list)


class CreateBriefRequest(BaseModel):
    """Request to create a content brief."""
    project_id: UUID
    objective: str = Field(..., min_length=1)
    audience: str = Field(..., min_length=1)
    tone: Optional[str] = None
    cta: Optional[str] = None
    key_points: List[str] = Field(default_factory=list)
    safety: Optional[SafetyConfig] = None


class CreateScriptRequest(BaseModel):
    """Request to create a script."""
    project_id: UUID
    brief_id: Optional[UUID] = None
    title: str = Field(..., min_length=1, max_length=200)
    body: str = Field(..., min_length=1)
    language: str = Field(default="en", max_length=10)


class PacingConfig(BaseModel):
    """Pacing configuration."""
    words_per_minute: int = Field(default=150, ge=90, le=200)
    max_words_per_clip: int = Field(default=30, ge=5, le=80)
    min_pause_ms: int = Field(default=250, ge=0, le=3000)


class RetryPolicyConfig(BaseModel):
    """Retry policy configuration."""
    max_attempts_per_clip: int = Field(default=3, ge=1, le=10)
    allow_remix: bool = True
    fallback_providers: List[str] = Field(default_factory=list)


class ConstraintsConfig(BaseModel):
    """Plan constraints configuration."""
    max_total_seconds: int = Field(default=300, ge=1, le=300)  # Max 5 minutes
    default_clip_seconds: int = Field(default=8, ge=4, le=12)
    aspect_ratio: str = Field(default="16:9", pattern="^(9:16|16:9|1:1)$")
    resolution: str = Field(default="1080p", pattern="^(480p|720p|1080p)$")
    pacing: Optional[PacingConfig] = None
    retry_policy: Optional[RetryPolicyConfig] = None


class CreateClipPlanRequest(BaseModel):
    """Request to create a clip plan."""
    project_id: UUID
    brief_id: Optional[UUID] = None
    script_id: Optional[UUID] = None
    style_bible_id: Optional[UUID] = None
    character_bible_id: Optional[UUID] = None
    continuity_bible_id: Optional[UUID] = None
    constraints: Optional[ConstraintsConfig] = None
    
    # Optional: provide script inline
    script_text: Optional[str] = None


class NarrationConfigSchema(BaseModel):
    """Narration configuration schema."""
    mode: str = Field(default="external_voiceover", pattern="^(generated_in_video|external_voiceover|none)$")
    text: str = ""
    speaker: str = "narrator"
    language: str = "en"


class VisualIntentSchema(BaseModel):
    """Visual intent schema."""
    prompt: str = Field(..., min_length=1)
    must_include: List[str] = Field(default_factory=list)
    must_avoid: List[str] = Field(default_factory=list)
    camera: Optional[str] = None
    setting: Optional[str] = None
    style_overrides: List[str] = Field(default_factory=list)
    character_refs: List[str] = Field(default_factory=list)


class ProviderReferenceSchema(BaseModel):
    """Provider reference schema."""
    type: str = Field(..., pattern="^(image|video|style|character)$")
    asset_id: UUID
    weight: float = Field(default=1.0, ge=0, le=1)


class ProviderHintsSchema(BaseModel):
    """Provider hints schema."""
    primary_provider: str = Field(default="sora", pattern="^(sora|runway|kling|pika|luma|mock)$")
    model: str = "sora-2"
    size: str = "1280x720"
    seed: Optional[int] = None
    references: List[ProviderReferenceSchema] = Field(default_factory=list)


class AcceptanceCheckSchema(BaseModel):
    """Acceptance check schema."""
    type: str = Field(..., pattern="^(transcript_match|visual_requirements|continuity|no_artifacts|duration_ok)$")
    weight: float = Field(default=0.25, ge=0, le=1)
    params: Dict[str, Any] = Field(default_factory=dict)


class AcceptanceCriteriaSchema(BaseModel):
    """Acceptance criteria schema."""
    score_threshold: float = Field(default=0.8, ge=0, le=1)
    checks: List[AcceptanceCheckSchema] = Field(default_factory=list)


class CreateClipRequest(BaseModel):
    """Request to create a single clip in a scene."""
    scene_id: UUID
    clip_order: int = Field(ge=0)
    target_seconds: int = Field(default=8, ge=4, le=12)
    narration: Optional[NarrationConfigSchema] = None
    visual_intent: VisualIntentSchema
    provider_hints: Optional[ProviderHintsSchema] = None
    acceptance: Optional[AcceptanceCriteriaSchema] = None


class StartGenerationRequest(BaseModel):
    """Request to start clip plan generation."""
    clip_plan_id: UUID
    max_concurrent: int = Field(default=3, ge=1, le=10)


class RetryClipRequest(BaseModel):
    """Request to retry a failed clip."""
    clip_id: UUID
    strategy: str = Field(default="prompt_patch", pattern="^(prompt_patch|remix|fallback_provider)$")
    prompt_delta: Optional[str] = None
    fallback_provider: Optional[str] = None


class StartRenderRequest(BaseModel):
    """Request to start final render."""
    clip_plan_id: UUID
    transitions: Optional[List[Dict[str, Any]]] = None
    audio_tracks: Optional[List[Dict[str, Any]]] = None


# =============================================================================
# SINGLE GENERATION REQUESTS (Sora Panel)
# =============================================================================

class SoraGenerateRequest(BaseModel):
    """Request to generate a single Sora clip."""
    prompt: str = Field(..., min_length=1, max_length=2000)
    model: str = Field(default="sora-2", pattern="^(sora-2|sora-2-pro)$")
    size: str = Field(default="1280x720", pattern="^(720x1280|1280x720|1024x1792|1792x1024)$")
    seconds: int = Field(default=8, ge=4, le=12)
    image_base64: Optional[str] = None
    image_mime_type: Optional[str] = None


class SoraRemixRequest(BaseModel):
    """Request to remix an existing Sora clip."""
    video_id: str = Field(..., min_length=1)
    prompt: str = Field(..., min_length=1, max_length=2000)
    model: str = Field(default="sora-2", pattern="^(sora-2|sora-2-pro)$")
    size: str = Field(default="1280x720", pattern="^(720x1280|1280x720|1024x1792|1792x1024)$")
    seconds: int = Field(default=8, ge=4, le=12)


class OptimizePromptRequest(BaseModel):
    """Request to optimize a prompt."""
    prompt: str = Field(..., min_length=1, max_length=2000)
    model: str = Field(default="sora-2")
    size: str = Field(default="1280x720")
    seconds: int = Field(default=8)


# =============================================================================
# RESPONSE SCHEMAS
# =============================================================================

class ProjectResponse(BaseModel):
    """Project response."""
    id: UUID
    title: str
    description: Optional[str]
    tags: List[str]
    created_at: datetime
    updated_at: datetime


class BibleResponse(BaseModel):
    """Bible response."""
    id: UUID
    project_id: UUID
    kind: str
    name: str
    body: Dict[str, Any]
    created_at: datetime
    updated_at: datetime


class BriefResponse(BaseModel):
    """Brief response."""
    id: UUID
    project_id: UUID
    objective: str
    audience: str
    tone: Optional[str]
    cta: Optional[str]
    key_points: List[str]
    safety: Dict[str, Any]
    created_at: datetime
    updated_at: datetime


class ScriptResponse(BaseModel):
    """Script response."""
    id: UUID
    project_id: UUID
    brief_id: Optional[UUID]
    title: str
    body: str
    language: str
    created_at: datetime
    updated_at: datetime


class ClipResponse(BaseModel):
    """Clip response."""
    id: UUID
    scene_id: UUID
    clip_order: int
    target_seconds: int
    narration: Dict[str, Any]
    visual_intent: Dict[str, Any]
    provider_hints: Dict[str, Any]
    acceptance: Dict[str, Any]
    state: str
    created_at: datetime
    updated_at: datetime


class SceneResponse(BaseModel):
    """Scene response."""
    id: UUID
    clip_plan_id: UUID
    name: str
    goal: Optional[str]
    beats: List[str]
    scene_order: int
    clips: List[ClipResponse] = Field(default_factory=list)
    created_at: datetime


class ClipPlanResponse(BaseModel):
    """Clip plan response."""
    id: UUID
    project_id: UUID
    brief_id: Optional[UUID]
    script_id: Optional[UUID]
    style_bible_id: Optional[UUID]
    character_bible_id: Optional[UUID]
    continuity_bible_id: Optional[UUID]
    version: str
    constraints: Dict[str, Any]
    status: str
    scenes: List[SceneResponse] = Field(default_factory=list)
    total_clips: int = 0
    clips_passed: int = 0
    clips_failed: int = 0
    clips_pending: int = 0
    created_at: datetime
    updated_at: datetime


class ClipRunResponse(BaseModel):
    """Clip run response."""
    id: UUID
    clip_plan_clip_id: UUID
    provider: str
    provider_generation_id: str
    attempt: int
    status: str
    error: Optional[str]
    duration_actual: Optional[float]
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CheckBreakdownResponse(BaseModel):
    """Check breakdown response."""
    type: str
    weight: float
    score: float
    notes: Optional[str]
    evidence: Dict[str, Any] = Field(default_factory=dict)


class AssessmentResponse(BaseModel):
    """Assessment response."""
    id: UUID
    clip_run_id: UUID
    assessor_role: str
    verdict: str
    score: float
    reasons: List[str]
    breakdown: List[CheckBreakdownResponse]
    repair_instruction: Optional[Dict[str, Any]]
    created_at: datetime


class AssetResponse(BaseModel):
    """Asset response."""
    id: UUID
    project_id: UUID
    kind: str
    url: str
    content_type: Optional[str]
    bytes: int
    sha256: Optional[str]
    meta: Dict[str, Any]
    created_at: datetime


class RenderResponse(BaseModel):
    """Render response."""
    id: UUID
    clip_plan_id: UUID
    status: str
    output_asset_id: Optional[UUID]
    output_url: Optional[str] = None
    timeline_json: Dict[str, Any]
    error: Optional[str]
    duration_seconds: Optional[float]
    created_at: datetime
    updated_at: datetime


# =============================================================================
# SORA SINGLE GENERATION RESPONSES
# =============================================================================

class SoraVideoResponse(BaseModel):
    """Sora video generation response."""
    id: str
    status: str
    prompt: str
    model: str
    size: str
    seconds: int
    created_at: int
    completed_at: Optional[int]
    download_url: Optional[str]
    thumbnail_url: Optional[str]
    error: Optional[Dict[str, Any]]


class OptimizePromptResponse(BaseModel):
    """Optimized prompt response."""
    original_prompt: str
    optimized_prompt: str


# =============================================================================
# STATUS/PROGRESS RESPONSES
# =============================================================================

class GenerationProgressResponse(BaseModel):
    """Generation progress response."""
    clip_plan_id: UUID
    status: str
    total_clips: int
    completed_clips: int
    failed_clips: int
    pending_clips: int
    current_clip_id: Optional[UUID]
    current_clip_status: Optional[str]
    estimated_remaining_seconds: Optional[int]


class HealthCheckResponse(BaseModel):
    """Health check response."""
    status: str
    providers: Dict[str, Dict[str, Any]]
    timestamp: datetime
