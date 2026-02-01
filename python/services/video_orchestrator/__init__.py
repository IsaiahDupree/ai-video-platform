"""
Video Orchestrator Package
==========================
Orchestrates video generation across multiple AI providers.
    
    orchestrator = VideoOrchestrator()
    plan = await orchestrator.create_clip_plan(script, brief)
    await orchestrator.execute_plan(plan.id)
"""

from .models import (
    # Enums
    ProviderName,
    ClipRunStatus,
    AssessmentVerdict,
    OrchestratorRole,
    ClipState,
    PlanStatus,
    RenderStatus,
    BibleKind,
    
    # Core Models
    VideoProject,
    VideoBible,
    ContentBrief,
    VideoScript,
    ClipPlan,
    Scene,
    ClipPlanClip,
    ClipRun,
    VideoAsset,
    Assessment,
    RepairAttempt,
    FinalRender,
    
    # Schemas
    NarrationConfig,
    VisualIntent,
    ProviderHints,
    AcceptanceCheck,
    AcceptanceCriteria,
    PacingConstraints,
    RetryPolicy,
    PlanConstraints,
    RepairInstruction,
)

from .schemas import (
    # Request/Response schemas
    CreateProjectRequest,
    CreateBriefRequest,
    CreateClipPlanRequest,
    ClipPlanResponse,
    ClipRunResponse,
    AssessmentResponse,
    RenderResponse,
)

from .narrative_bridge import (
    NarrativeVideoBridge,
    NarrativeVideoBrief,
    GeneratedVideoContent,
)

__all__ = [
    # Enums
    "ProviderName",
    "ClipRunStatus",
    "AssessmentVerdict",
    "OrchestratorRole",
    "ClipState",
    "PlanStatus",
    "RenderStatus",
    "BibleKind",
    
    # Core Models
    "VideoProject",
    "VideoBible",
    "ContentBrief",
    "VideoScript",
    "ClipPlan",
    "Scene",
    "ClipPlanClip",
    "ClipRun",
    "VideoAsset",
    "Assessment",
    "RepairAttempt",
    "FinalRender",
    
    # Config Models
    "NarrationConfig",
    "VisualIntent",
    "ProviderHints",
    "AcceptanceCheck",
    "AcceptanceCriteria",
    "PacingConstraints",
    "RetryPolicy",
    "PlanConstraints",
    "RepairInstruction",
    
    # Schemas
    "CreateProjectRequest",
    "CreateBriefRequest",
    "CreateClipPlanRequest",
    "ClipPlanResponse",
    "ClipRunResponse",
    "AssessmentResponse",
    "RenderResponse",
    
    # Narrative Bridge
    "NarrativeVideoBridge",
    "NarrativeVideoBrief",
    "GeneratedVideoContent",
]
