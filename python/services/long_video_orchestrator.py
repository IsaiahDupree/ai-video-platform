"""
Long Video Orchestrator
Generates long-form videos by stitching multiple AI-generated clips
"""
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from enum import Enum
import asyncio
import subprocess
import tempfile
import os
import uuid
from loguru import logger

from modules.ai.video_model_factory import VideoModelFactory, create_video_model
from modules.ai.video_model_interface import VideoGenerationRequest, VideoGenerationJob, VideoStatus


class LongVideoStatus(Enum):
    """Long video generation status"""
    PLANNING = "planning"
    GENERATING_CLIPS = "generating_clips"
    STITCHING = "stitching"
    ADDING_AUDIO = "adding_audio"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class SceneSpec:
    """Specification for a single scene/clip"""
    scene_number: int
    prompt: str
    duration_seconds: int = 10
    provider: str = "kling"
    input_image: Optional[str] = None
    transition: str = "crossfade"  # crossfade, fade, cut, dissolve


@dataclass
class LongVideoSpec:
    """Specification for a complete long video"""
    title: str
    scenes: List[SceneSpec]
    target_duration: int = 60  # Total target seconds
    output_resolution: tuple = (1920, 1080)
    audio_track: Optional[str] = None
    background_music: Optional[str] = None
    voiceover_script: Optional[str] = None


@dataclass
class LongVideoJob:
    """Represents a long video generation job"""
    job_id: str
    spec: LongVideoSpec
    status: LongVideoStatus = LongVideoStatus.PLANNING
    progress: int = 0
    clip_jobs: List[VideoGenerationJob] = field(default_factory=list)
    clip_paths: List[str] = field(default_factory=list)
    output_path: Optional[str] = None
    error_message: Optional[str] = None


class LongVideoOrchestrator:
    """
    Orchestrates generation of long-form videos by:
    1. Breaking script into scenes
    2. Generating clips in parallel (or using Kling for long videos)
    3. Stitching clips with transitions
    4. Adding audio overlay
    """
    
    def __init__(
        self,
        output_dir: str = "/tmp/long_videos",
        max_parallel_jobs: int = 3,
        preferred_provider: str = "kling"
    ):
        self.output_dir = output_dir
        self.max_parallel_jobs = max_parallel_jobs
        self.preferred_provider = preferred_provider
        self.jobs: Dict[str, LongVideoJob] = {}
        
        os.makedirs(output_dir, exist_ok=True)
    
    def create_from_script(
        self,
        script: str,
        title: str = "Generated Video",
        style: str = "cinematic",
        target_duration: int = 60
    ) -> LongVideoJob:
        """
        Create a long video from a text script
        
        Args:
            script: Full text script or story
            title: Video title
            style: Visual style (cinematic, anime, realistic, etc.)
            target_duration: Target duration in seconds
        """
        scenes = self._parse_script_to_scenes(script, style, target_duration)
        
        spec = LongVideoSpec(
            title=title,
            scenes=scenes,
            target_duration=target_duration
        )
        
        job = LongVideoJob(
            job_id=str(uuid.uuid4()),
            spec=spec
        )
        self.jobs[job.job_id] = job
        
        logger.info(f"Created long video job {job.job_id} with {len(scenes)} scenes")
        return job
    
    def create_from_scenes(self, scenes: List[SceneSpec], title: str = "Generated Video") -> LongVideoJob:
        """Create long video from pre-defined scenes"""
        spec = LongVideoSpec(
            title=title,
            scenes=scenes,
            target_duration=sum(s.duration_seconds for s in scenes)
        )
        
        job = LongVideoJob(
            job_id=str(uuid.uuid4()),
            spec=spec
        )
        self.jobs[job.job_id] = job
        
        return job
    
    async def generate(self, job_id: str) -> LongVideoJob:
        """
        Generate the complete long video
        """
        job = self.jobs.get(job_id)
        if not job:
            raise ValueError(f"Job {job_id} not found")
        
        try:
            # Step 1: Generate all clips
            job.status = LongVideoStatus.GENERATING_CLIPS
            await self._generate_all_clips(job)
            
            # Step 2: Stitch clips together
            job.status = LongVideoStatus.STITCHING
            output_path = await self._stitch_clips(job)
            
            # Step 3: Add audio if provided
            if job.spec.audio_track or job.spec.background_music:
                job.status = LongVideoStatus.ADDING_AUDIO
                output_path = await self._add_audio(job, output_path)
            
            job.output_path = output_path
            job.status = LongVideoStatus.COMPLETED
            job.progress = 100
            
            logger.success(f"Long video completed: {output_path}")
            return job
            
        except Exception as e:
            job.status = LongVideoStatus.FAILED
            job.error_message = str(e)
            logger.error(f"Long video generation failed: {e}")
            raise
    
    def get_status(self, job_id: str) -> LongVideoJob:
        """Get job status"""
        job = self.jobs.get(job_id)
        if not job:
            raise ValueError(f"Job {job_id} not found")
        return job
    
    async def _generate_all_clips(self, job: LongVideoJob):
        """Generate all video clips, potentially in parallel"""
        total_scenes = len(job.spec.scenes)
        
        # Use semaphore to limit parallel generations
        semaphore = asyncio.Semaphore(self.max_parallel_jobs)
        
        async def generate_scene(scene: SceneSpec):
            async with semaphore:
                return await self._generate_single_clip(scene)
        
        # Generate all clips
        tasks = [generate_scene(scene) for scene in job.spec.scenes]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Scene {i} failed: {result}")
                raise result
            
            job.clip_paths.append(result)
            job.progress = int((i + 1) / total_scenes * 50)  # 0-50% for clip generation
    
    async def _generate_single_clip(self, scene: SceneSpec) -> str:
        """Generate a single video clip"""
        model = create_video_model(scene.provider)
        
        request = VideoGenerationRequest(
            prompt=scene.prompt,
            model=scene.provider,
            duration_seconds=scene.duration_seconds,
            width=1920,
            height=1080,
            input_image=scene.input_image
        )
        
        # Start generation
        clip_job = model.create_video(request)
        
        # Poll for completion
        while clip_job.status not in [VideoStatus.COMPLETED, VideoStatus.FAILED]:
            await asyncio.sleep(5)
            clip_job = model.get_status(clip_job.job_id)
        
        if clip_job.status == VideoStatus.FAILED:
            raise Exception(f"Clip generation failed: {clip_job.error_message}")
        
        # Download clip
        output_path = os.path.join(self.output_dir, f"clip_{scene.scene_number}_{uuid.uuid4().hex[:8]}.mp4")
        model.download_video(clip_job.job_id, output_path)
        
        return output_path
    
    async def _stitch_clips(self, job: LongVideoJob) -> str:
        """Stitch all clips together using FFmpeg"""
        output_path = os.path.join(self.output_dir, f"{job.job_id}_final.mp4")
        
        # Create concat file
        concat_file = os.path.join(self.output_dir, f"{job.job_id}_concat.txt")
        with open(concat_file, 'w') as f:
            for clip_path in job.clip_paths:
                f.write(f"file '{clip_path}'\n")
        
        # FFmpeg command for concatenation with crossfade
        cmd = [
            'ffmpeg', '-y',
            '-f', 'concat',
            '-safe', '0',
            '-i', concat_file,
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '23',
            '-c:a', 'aac',
            output_path
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            raise Exception(f"FFmpeg stitching failed: {stderr.decode()}")
        
        job.progress = 80  # 80% after stitching
        
        # Cleanup concat file
        os.remove(concat_file)
        
        return output_path
    
    async def _add_audio(self, job: LongVideoJob, video_path: str) -> str:
        """Add audio track to video"""
        output_path = os.path.join(self.output_dir, f"{job.job_id}_with_audio.mp4")
        
        audio_input = job.spec.audio_track or job.spec.background_music
        
        cmd = [
            'ffmpeg', '-y',
            '-i', video_path,
            '-i', audio_input,
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-map', '0:v:0',
            '-map', '1:a:0',
            '-shortest',
            output_path
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            logger.warning(f"Audio overlay failed, using video without audio: {stderr.decode()}")
            return video_path
        
        job.progress = 95
        return output_path
    
    def _parse_script_to_scenes(
        self,
        script: str,
        style: str,
        target_duration: int
    ) -> List[SceneSpec]:
        """Parse a script into individual scenes"""
        # Split script into paragraphs/sections
        paragraphs = [p.strip() for p in script.split('\n\n') if p.strip()]
        
        if not paragraphs:
            paragraphs = [script]
        
        # Calculate duration per scene
        num_scenes = len(paragraphs)
        duration_per_scene = max(5, target_duration // num_scenes)
        
        scenes = []
        for i, paragraph in enumerate(paragraphs):
            # Enhance prompt with style
            enhanced_prompt = f"{style} style, cinematic lighting, high quality: {paragraph}"
            
            scene = SceneSpec(
                scene_number=i + 1,
                prompt=enhanced_prompt,
                duration_seconds=min(duration_per_scene, 120),  # Max 120s (Kling limit)
                provider=self.preferred_provider
            )
            scenes.append(scene)
        
        return scenes
    
    def cleanup(self, job_id: str):
        """Clean up temporary files for a job"""
        job = self.jobs.get(job_id)
        if not job:
            return
        
        for clip_path in job.clip_paths:
            if os.path.exists(clip_path):
                os.remove(clip_path)
        
        del self.jobs[job_id]
