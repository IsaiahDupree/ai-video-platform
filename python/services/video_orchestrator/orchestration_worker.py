"""
Orchestration Worker
====================
Background worker for running video generation jobs.

Features:
- Async clip plan execution
- Concurrent clip generation (configurable)
- Automatic assessment and retry
- Progress tracking and events

Usage:
    worker = OrchestrationWorker()
    await worker.run_clip_plan(plan_id)
"""

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set
from uuid import UUID, uuid4

from .models import (
    ClipPlan,
    ClipPlanClip,
    ClipRun,
    Scene,
    ClipState,
    ClipRunStatus,
    PlanStatus,
    ProviderName,
    Assessment,
    AssessmentVerdict,
)
from .scene_crafter import SceneCrafterService
from .assessor import AssessorService, AssessmentInput, RepairExecutor

logger = logging.getLogger(__name__)


class WorkerEvent(str, Enum):
    """Worker event types."""
    PLAN_STARTED = "plan_started"
    PLAN_COMPLETED = "plan_completed"
    PLAN_FAILED = "plan_failed"
    CLIP_STARTED = "clip_started"
    CLIP_COMPLETED = "clip_completed"
    CLIP_FAILED = "clip_failed"
    CLIP_RETRYING = "clip_retrying"
    PROGRESS_UPDATE = "progress_update"


@dataclass
class WorkerProgress:
    """Progress tracking for worker."""
    plan_id: str
    status: str
    total_clips: int
    completed_clips: int = 0
    failed_clips: int = 0
    current_clip_id: Optional[str] = None
    current_clip_status: Optional[str] = None
    started_at: Optional[datetime] = None
    estimated_remaining_seconds: Optional[int] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "plan_id": self.plan_id,
            "status": self.status,
            "total_clips": self.total_clips,
            "completed_clips": self.completed_clips,
            "failed_clips": self.failed_clips,
            "pending_clips": self.total_clips - self.completed_clips - self.failed_clips,
            "current_clip_id": self.current_clip_id,
            "current_clip_status": self.current_clip_status,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "estimated_remaining_seconds": self.estimated_remaining_seconds
        }


@dataclass
class WorkerConfig:
    """Configuration for orchestration worker."""
    max_concurrent_clips: int = 3
    poll_interval_seconds: float = 2.0
    max_retries_per_clip: int = 3
    generation_timeout_seconds: int = 300
    assessment_enabled: bool = True
    auto_retry_enabled: bool = True


EventCallback = Callable[[WorkerEvent, Dict[str, Any]], None]


class OrchestrationWorker:
    """
    Background worker for orchestrating video generation.
    
    Executes clip plans by:
    1. Loading plan and clips
    2. Generating clips concurrently (up to max_concurrent)
    3. Assessing each clip
    4. Retrying failures based on repair instructions
    5. Tracking progress and emitting events
    """
    
    def __init__(
        self,
        config: Optional[WorkerConfig] = None,
        provider_name: ProviderName = ProviderName.MOCK
    ):
        self.config = config or WorkerConfig()
        self.provider_name = provider_name
        
        self._scene_crafter = SceneCrafterService()
        self._assessor = AssessorService()
        self._repair_executor = RepairExecutor(self._scene_crafter)
        
        self._provider = None
        self._event_callbacks: List[EventCallback] = []
        self._running_plans: Set[str] = set()
        self._progress: Dict[str, WorkerProgress] = {}
    
    def _get_provider(self):
        """Get video provider instance."""
        if self._provider is None:
            from services.video_providers import get_video_provider
            self._provider = get_video_provider(self.provider_name)
        return self._provider
    
    def on_event(self, callback: EventCallback):
        """Register event callback."""
        self._event_callbacks.append(callback)
    
    def _emit_event(self, event: WorkerEvent, data: Dict[str, Any]):
        """Emit event to all callbacks."""
        for callback in self._event_callbacks:
            try:
                callback(event, data)
            except Exception as e:
                logger.error(f"Event callback error: {e}")
    
    def get_progress(self, plan_id: str) -> Optional[WorkerProgress]:
        """Get current progress for a plan."""
        return self._progress.get(plan_id)
    
    async def run_clip_plan(
        self,
        plan: ClipPlan,
        scenes: List[Scene],
        clips: List[ClipPlanClip],
        bibles: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Execute a clip plan.
        
        Args:
            plan: The ClipPlan to execute
            scenes: List of scenes in the plan
            clips: List of clips to generate
            bibles: Optional bible references (style, character)
        
        Returns:
            True if all clips passed, False otherwise
        """
        plan_id = str(plan.id)
        
        if plan_id in self._running_plans:
            logger.warning(f"Plan {plan_id} is already running")
            return False
        
        self._running_plans.add(plan_id)
        
        # Initialize progress
        progress = WorkerProgress(
            plan_id=plan_id,
            status="running",
            total_clips=len(clips),
            started_at=datetime.utcnow()
        )
        self._progress[plan_id] = progress
        
        logger.info(f"Starting plan execution: {plan_id} with {len(clips)} clips")
        self._emit_event(WorkerEvent.PLAN_STARTED, {"plan_id": plan_id, "total_clips": len(clips)})
        
        try:
            # Sort clips by order
            sorted_clips = sorted(clips, key=lambda c: (c.scene_id, c.clip_order))
            
            # Create semaphore for concurrency control
            semaphore = asyncio.Semaphore(self.config.max_concurrent_clips)
            
            # Run clips with concurrency limit
            tasks = []
            for clip in sorted_clips:
                task = asyncio.create_task(
                    self._run_clip_with_semaphore(
                        semaphore, clip, plan_id, bibles
                    )
                )
                tasks.append((clip, task))
            
            # Wait for all clips
            results = []
            for clip, task in tasks:
                try:
                    success = await task
                    results.append((clip, success))
                    
                    # Update progress
                    if success:
                        progress.completed_clips += 1
                    else:
                        progress.failed_clips += 1
                    
                    self._emit_event(WorkerEvent.PROGRESS_UPDATE, progress.to_dict())
                    
                except Exception as e:
                    logger.error(f"Clip task failed: {e}")
                    progress.failed_clips += 1
                    results.append((clip, False))
            
            # Determine final status
            all_passed = all(success for _, success in results)
            
            if all_passed:
                progress.status = "completed"
                plan.status = PlanStatus.COMPLETED
                self._emit_event(WorkerEvent.PLAN_COMPLETED, {
                    "plan_id": plan_id,
                    "clips_passed": progress.completed_clips
                })
            else:
                progress.status = "failed"
                plan.status = PlanStatus.FAILED
                self._emit_event(WorkerEvent.PLAN_FAILED, {
                    "plan_id": plan_id,
                    "clips_passed": progress.completed_clips,
                    "clips_failed": progress.failed_clips
                })
            
            logger.info(f"Plan {plan_id} completed: {progress.completed_clips}/{len(clips)} passed")
            return all_passed
            
        finally:
            self._running_plans.discard(plan_id)
    
    async def _run_clip_with_semaphore(
        self,
        semaphore: asyncio.Semaphore,
        clip: ClipPlanClip,
        plan_id: str,
        bibles: Optional[Dict[str, Any]]
    ) -> bool:
        """Run a single clip with semaphore for concurrency control."""
        async with semaphore:
            return await self._run_clip(clip, plan_id, bibles)
    
    async def _run_clip(
        self,
        clip: ClipPlanClip,
        plan_id: str,
        bibles: Optional[Dict[str, Any]]
    ) -> bool:
        """
        Generate and assess a single clip.
        
        Handles:
        1. Building provider payload
        2. Calling provider
        3. Polling for completion
        4. Assessing result
        5. Retrying on failure
        """
        clip_id = str(clip.id)
        attempt = 0
        max_attempts = self.config.max_retries_per_clip
        
        progress = self._progress.get(plan_id)
        if progress:
            progress.current_clip_id = clip_id
            progress.current_clip_status = "generating"
        
        self._emit_event(WorkerEvent.CLIP_STARTED, {
            "plan_id": plan_id,
            "clip_id": clip_id,
            "target_seconds": clip.target_seconds
        })
        
        clip.state = ClipState.GENERATING
        provider = self._get_provider()
        
        while attempt < max_attempts:
            attempt += 1
            logger.info(f"Generating clip {clip_id}, attempt {attempt}/{max_attempts}")
            
            try:
                # Build payload
                payload = self._scene_crafter.build_provider_payload(
                    clip,
                    style_bible=bibles.get("style") if bibles else None,
                    character_bible=bibles.get("character") if bibles else None
                )
                
                # Create clip run record
                clip_run = ClipRun(
                    clip_plan_clip_id=clip.id,
                    provider=self.provider_name,
                    provider_generation_id="",
                    attempt=attempt,
                    status=ClipRunStatus.QUEUED,
                    request_payload=payload.to_dict()
                )
                
                # Generate
                generation = await provider.create_clip(payload)
                clip_run.provider_generation_id = generation.provider_generation_id
                clip_run.status = ClipRunStatus.RUNNING
                
                # Poll for completion
                completed = await provider.wait_for_completion(
                    generation.provider_generation_id,
                    poll_interval=self.config.poll_interval_seconds,
                    timeout=self.config.generation_timeout_seconds
                )
                
                # Update run record
                clip_run.status = ClipRunStatus.SUCCEEDED if completed.is_success else ClipRunStatus.FAILED
                clip_run.response_payload = completed.to_dict()
                clip_run.duration_actual = completed.seconds
                
                if completed.error:
                    clip_run.error = completed.error.message
                
                # Assess if enabled
                if self.config.assessment_enabled and completed.is_success:
                    assessment_input = AssessmentInput(
                        clip=clip,
                        clip_run=clip_run,
                        video_url=completed.download_url,
                        actual_duration=completed.seconds
                    )
                    
                    assessment = await self._assessor.assess(assessment_input)
                    
                    if assessment.verdict == AssessmentVerdict.PASS:
                        clip.state = ClipState.PASSED
                        self._emit_event(WorkerEvent.CLIP_COMPLETED, {
                            "plan_id": plan_id,
                            "clip_id": clip_id,
                            "status": "passed",
                            "score": assessment.score
                        })
                        return True
                    
                    elif assessment.verdict == AssessmentVerdict.FAIL and self.config.auto_retry_enabled:
                        # Get repair instruction
                        if assessment.repair_instruction and attempt < max_attempts:
                            logger.info(f"Clip {clip_id} failed assessment, retrying with strategy: {assessment.repair_instruction.strategy}")
                            
                            self._emit_event(WorkerEvent.CLIP_RETRYING, {
                                "plan_id": plan_id,
                                "clip_id": clip_id,
                                "attempt": attempt,
                                "reason": assessment.reasons
                            })
                            
                            # Apply repair
                            repair_payload = await self._repair_executor.execute_repair(
                                clip, assessment.repair_instruction, clip_run, bibles
                            )
                            
                            if repair_payload:
                                # Update clip with repaired payload for next attempt
                                continue
                        
                        clip.state = ClipState.FAILED
                        return False
                
                elif completed.is_success:
                    # No assessment, just mark as passed
                    clip.state = ClipState.PASSED
                    self._emit_event(WorkerEvent.CLIP_COMPLETED, {
                        "plan_id": plan_id,
                        "clip_id": clip_id,
                        "status": "passed"
                    })
                    return True
                
                else:
                    # Generation failed
                    logger.warning(f"Clip {clip_id} generation failed: {completed.error}")
                    
                    if attempt < max_attempts:
                        self._emit_event(WorkerEvent.CLIP_RETRYING, {
                            "plan_id": plan_id,
                            "clip_id": clip_id,
                            "attempt": attempt,
                            "reason": ["Generation failed"]
                        })
                        continue
                    
                    clip.state = ClipState.FAILED
                    return False
                    
            except Exception as e:
                logger.error(f"Clip {clip_id} attempt {attempt} error: {e}")
                
                if attempt < max_attempts:
                    await asyncio.sleep(2)  # Brief delay before retry
                    continue
                
                clip.state = ClipState.FAILED
                return False
        
        # Max attempts reached
        clip.state = ClipState.FAILED
        self._emit_event(WorkerEvent.CLIP_FAILED, {
            "plan_id": plan_id,
            "clip_id": clip_id,
            "reason": "Max attempts reached"
        })
        return False
    
    async def cancel_plan(self, plan_id: str):
        """Cancel a running plan."""
        if plan_id in self._running_plans:
            # Mark for cancellation (tasks check this)
            self._running_plans.discard(plan_id)
            
            if plan_id in self._progress:
                self._progress[plan_id].status = "canceled"
            
            logger.info(f"Plan {plan_id} canceled")
    
    def is_running(self, plan_id: str) -> bool:
        """Check if a plan is currently running."""
        return plan_id in self._running_plans


class OrchestrationQueue:
    """
    Queue for managing multiple orchestration jobs.
    
    Features:
    - Job queuing
    - Priority handling
    - Worker pool management
    """
    
    def __init__(
        self,
        worker: Optional[OrchestrationWorker] = None,
        max_workers: int = 2
    ):
        self.worker = worker or OrchestrationWorker()
        self.max_workers = max_workers
        
        self._queue: asyncio.Queue = asyncio.Queue()
        self._active_jobs: Dict[str, asyncio.Task] = {}
        self._job_results: Dict[str, bool] = {}
        self._running = False
    
    async def start(self):
        """Start the queue processor."""
        if self._running:
            return
        
        self._running = True
        logger.info("Orchestration queue started")
        
        asyncio.create_task(self._process_queue())
    
    async def stop(self):
        """Stop the queue processor."""
        self._running = False
        
        # Cancel active jobs
        for job_id, task in self._active_jobs.items():
            task.cancel()
        
        logger.info("Orchestration queue stopped")
    
    async def enqueue(
        self,
        plan: ClipPlan,
        scenes: List[Scene],
        clips: List[ClipPlanClip],
        bibles: Optional[Dict[str, Any]] = None,
        priority: int = 0
    ) -> str:
        """
        Add a job to the queue.
        
        Args:
            plan: ClipPlan to execute
            scenes: Scenes in the plan
            clips: Clips to generate
            bibles: Optional bible references
            priority: Job priority (higher = more urgent)
        
        Returns:
            Job ID
        """
        job_id = str(plan.id)
        
        await self._queue.put({
            "job_id": job_id,
            "plan": plan,
            "scenes": scenes,
            "clips": clips,
            "bibles": bibles,
            "priority": priority
        })
        
        logger.info(f"Job {job_id} enqueued")
        return job_id
    
    async def _process_queue(self):
        """Process jobs from the queue."""
        while self._running:
            try:
                # Wait for a job
                job = await asyncio.wait_for(self._queue.get(), timeout=1.0)
                
                # Check if we can start a new job
                while len(self._active_jobs) >= self.max_workers:
                    await asyncio.sleep(0.5)
                    
                    # Clean up completed jobs
                    completed = [
                        jid for jid, task in self._active_jobs.items()
                        if task.done()
                    ]
                    for jid in completed:
                        del self._active_jobs[jid]
                
                # Start the job
                task = asyncio.create_task(self._run_job(job))
                self._active_jobs[job["job_id"]] = task
                
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Queue processing error: {e}")
    
    async def _run_job(self, job: Dict[str, Any]):
        """Run a single job."""
        job_id = job["job_id"]
        
        try:
            success = await self.worker.run_clip_plan(
                job["plan"],
                job["scenes"],
                job["clips"],
                job["bibles"]
            )
            self._job_results[job_id] = success
            
        except Exception as e:
            logger.error(f"Job {job_id} failed: {e}")
            self._job_results[job_id] = False
    
    def get_job_result(self, job_id: str) -> Optional[bool]:
        """Get result for a completed job."""
        return self._job_results.get(job_id)
    
    def get_queue_status(self) -> Dict[str, Any]:
        """Get queue status."""
        return {
            "running": self._running,
            "queued": self._queue.qsize(),
            "active": len(self._active_jobs),
            "completed": len(self._job_results)
        }
