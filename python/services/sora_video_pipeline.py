"""
Sora Video Pipeline Service
============================
Creates multi-clip videos using Sora AI generation and Remotion composition.

Pipeline:
1. Design scene structure with AI-generated scripts
2. Generate video clips using Sora API
3. Add text overlays and transitions
4. Compose final video using Remotion/FFmpeg
"""
import os
import json
import uuid
import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass, field, asdict
from enum import Enum
from pathlib import Path

from loguru import logger
from openai import OpenAI

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:54322/postgres")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

from sqlalchemy import create_engine, text


class ClipRole(str, Enum):
    HOOK = "hook"           # Attention-grabbing opener
    STORY = "story"         # Main narrative
    CTA = "cta"             # Call to action
    TRANSITION = "transition"


class VideoStyle(str, Enum):
    CINEMATIC = "cinematic"
    DOCUMENTARY = "documentary"
    VLOG = "vlog"
    MOTIVATIONAL = "motivational"
    TECH = "tech"


@dataclass
class ClipSpec:
    """Specification for a single clip"""
    clip_id: str
    sequence_number: int
    role: ClipRole
    duration_seconds: int  # 4, 8, or 12 for Sora
    
    # Content
    prompt: str
    script_text: str  # Text to display/narrate
    
    # Character/scene info
    character_name: str
    scene_description: str
    
    # Sora settings
    model: str = "sora-2"
    size: str = "720x1280"  # Portrait for social
    
    # Status
    status: str = "pending"
    sora_generation_id: Optional[str] = None
    video_url: Optional[str] = None
    error: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class VideoProject:
    """A multi-clip video project"""
    project_id: str
    title: str
    description: str
    
    # Character
    main_character: str
    character_description: str
    
    # Structure
    total_duration_seconds: int
    clips: List[ClipSpec] = field(default_factory=list)
    
    # Style
    style: VideoStyle = VideoStyle.MOTIVATIONAL
    music_mood: str = "upbeat"
    
    # Output
    output_path: Optional[str] = None
    final_video_url: Optional[str] = None
    
    # Status
    status: str = "planning"  # planning, generating, composing, completed, failed
    created_at: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict:
        return {
            "project_id": self.project_id,
            "title": self.title,
            "description": self.description,
            "main_character": self.main_character,
            "character_description": self.character_description,
            "total_duration_seconds": self.total_duration_seconds,
            "clips": [c.to_dict() for c in self.clips],
            "style": self.style.value if isinstance(self.style, VideoStyle) else self.style,
            "music_mood": self.music_mood,
            "output_path": self.output_path,
            "final_video_url": self.final_video_url,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }


class SoraVideoPipeline:
    """
    Creates multi-clip videos with Sora and Remotion.
    
    Usage:
        pipeline = SoraVideoPipeline()
        project = await pipeline.create_video_project(
            character="@isaiahdupree",
            total_duration=30,
            style="motivational"
        )
        result = await pipeline.generate_and_compose(project)
    """
    
    def __init__(self):
        self.openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
        self.output_dir = Path("data/sora_videos")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self._projects: Dict[str, VideoProject] = {}
    
    async def create_video_project(
        self,
        character: str = "@isaiahdupree",
        total_duration: int = 30,
        num_clips: int = 3,
        style: str = "motivational",
        topic: Optional[str] = None,
        custom_scripts: Optional[List[str]] = None,
    ) -> VideoProject:
        """
        Create a video project with AI-designed scene structure.
        
        Args:
            character: Main character name/handle
            total_duration: Target video length in seconds
            num_clips: Number of clips to generate
            style: Video style (cinematic, motivational, etc.)
            topic: Optional topic focus
            custom_scripts: Optional pre-written scripts for each clip
        """
        project_id = str(uuid.uuid4())
        
        # Calculate clip durations (Sora supports 4, 8, 12)
        clip_durations = self._calculate_clip_durations(total_duration, num_clips)
        
        # Generate character description
        character_desc = await self._generate_character_description(character)
        
        # Generate clip scripts and prompts
        if custom_scripts and len(custom_scripts) >= num_clips:
            scripts = custom_scripts[:num_clips]
            prompts = await self._generate_prompts_from_scripts(
                scripts, character, character_desc, style
            )
        else:
            scripts, prompts = await self._generate_clip_content(
                character, character_desc, num_clips, style, topic
            )
        
        # Create clip specifications
        clips = []
        roles = self._assign_clip_roles(num_clips)
        
        for i, (duration, script, prompt, role) in enumerate(
            zip(clip_durations, scripts, prompts, roles)
        ):
            clip = ClipSpec(
                clip_id=str(uuid.uuid4()),
                sequence_number=i + 1,
                role=role,
                duration_seconds=duration,
                prompt=prompt,
                script_text=script,
                character_name=character,
                scene_description=f"Scene {i+1}: {role.value}",
                size="720x1280",  # Portrait for social
            )
            clips.append(clip)
        
        project = VideoProject(
            project_id=project_id,
            title=f"{character} Video - {style}",
            description=topic or f"A {style} video featuring {character}",
            main_character=character,
            character_description=character_desc,
            total_duration_seconds=sum(clip_durations),
            clips=clips,
            style=VideoStyle(style) if style in [s.value for s in VideoStyle] else VideoStyle.MOTIVATIONAL,
        )
        
        self._projects[project_id] = project
        logger.info(f"📋 Created video project {project_id} with {num_clips} clips")
        
        return project
    
    def _calculate_clip_durations(self, total_duration: int, num_clips: int) -> List[int]:
        """Calculate clip durations that sum to approximately total_duration."""
        # Sora supports 4, 8, 12 second clips
        allowed = [4, 8, 12]
        
        # Target duration per clip
        target_per_clip = total_duration // num_clips
        
        # Map to nearest allowed value
        durations = []
        for _ in range(num_clips):
            if target_per_clip <= 6:
                durations.append(8)  # Minimum practical length
            elif target_per_clip <= 10:
                durations.append(8)
            else:
                durations.append(12)
        
        return durations
    
    def _assign_clip_roles(self, num_clips: int) -> List[ClipRole]:
        """Assign roles to clips based on count."""
        if num_clips == 1:
            return [ClipRole.STORY]
        elif num_clips == 2:
            return [ClipRole.HOOK, ClipRole.CTA]
        elif num_clips == 3:
            return [ClipRole.HOOK, ClipRole.STORY, ClipRole.CTA]
        else:
            roles = [ClipRole.HOOK]
            roles.extend([ClipRole.STORY] * (num_clips - 2))
            roles.append(ClipRole.CTA)
            return roles
    
    async def _generate_character_description(self, character: str) -> str:
        """Generate a character description for Sora prompts."""
        if not self.openai_client:
            return f"A young creative professional named {character}, confident and authentic"
        
        prompt = f"""Create a brief visual character description for a video featuring "{character}".

The character should be:
- A confident, authentic content creator
- Engaging and relatable
- Modern and stylish appearance

Output ONLY a 1-2 sentence visual description suitable for AI video generation.
Focus on appearance, energy, and vibe. No names, just visual description."""

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You write concise visual descriptions for AI video generation."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=100,
                temperature=0.7
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Character description generation failed: {e}")
            return f"A confident young content creator with modern style and authentic energy"
    
    async def _generate_clip_content(
        self,
        character: str,
        character_desc: str,
        num_clips: int,
        style: str,
        topic: Optional[str]
    ) -> Tuple[List[str], List[str]]:
        """Generate scripts and Sora prompts for each clip."""
        
        if not self.openai_client:
            # Fallback scripts and prompts
            scripts = [
                "Ever wonder what success really looks like?",
                "It's not about the destination...",
                "Follow for more real talk 🔥"
            ][:num_clips]
            
            prompts = [
                f"{character_desc} looking confidently at camera, dramatic lighting, cinematic",
                f"{character_desc} in creative workspace, natural lighting, documentary style",
                f"{character_desc} smiling genuinely, warm lighting, motivational"
            ][:num_clips]
            
            return scripts, prompts
        
        topic_context = f" about {topic}" if topic else ""
        
        prompt = f"""Create content for a {num_clips}-clip {style} video{topic_context}.

Character: {character}
Visual description: {character_desc}

For each clip, provide:
1. Script text (what appears on screen or is spoken) - 5-10 words max
2. Sora prompt (visual scene description) - detailed, cinematic

Structure:
- Clip 1 (HOOK): Attention-grabbing opener
- Clip 2 (STORY): Main message/value
- Clip 3 (CTA): Call to action

Output as JSON:
{{
  "clips": [
    {{"script": "...", "prompt": "..."}},
    ...
  ]
}}

Make scripts punchy and viral-worthy. Make Sora prompts detailed with:
- Camera angle/movement
- Lighting
- Character action
- Mood/atmosphere

Output ONLY valid JSON."""

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a viral video director. Output only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=600,
                temperature=0.8
            )
            
            content = response.choices[0].message.content.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            
            data = json.loads(content)
            clips_data = data.get("clips", [])
            
            scripts = [c.get("script", "") for c in clips_data]
            prompts = [c.get("prompt", "") for c in clips_data]
            
            # Ensure we have enough
            while len(scripts) < num_clips:
                scripts.append("Follow for more 🔥")
            while len(prompts) < num_clips:
                prompts.append(f"{character_desc} in cinematic scene, professional lighting")
            
            return scripts[:num_clips], prompts[:num_clips]
            
        except Exception as e:
            logger.error(f"Content generation failed: {e}")
            return await self._generate_clip_content(character, character_desc, num_clips, style, topic)
    
    async def _generate_prompts_from_scripts(
        self,
        scripts: List[str],
        character: str,
        character_desc: str,
        style: str
    ) -> List[str]:
        """Generate Sora prompts from pre-written scripts."""
        prompts = []
        
        for script in scripts:
            prompt = f"{character_desc}, {style} style, delivering message: '{script}', cinematic lighting, professional quality, 4K"
            prompts.append(prompt)
        
        return prompts
    
    async def generate_clips(self, project: VideoProject) -> VideoProject:
        """
        Generate all clips using Sora API.
        
        Note: This makes real API calls to OpenAI Sora.
        """
        project.status = "generating"
        logger.info(f"🎬 Generating {len(project.clips)} clips for project {project.project_id}")
        
        for clip in project.clips:
            try:
                result = await self._generate_single_clip(clip)
                clip.status = "completed" if result else "failed"
            except Exception as e:
                logger.error(f"Clip {clip.clip_id} generation failed: {e}")
                clip.status = "failed"
                clip.error = str(e)
        
        # Check if all clips generated
        failed = [c for c in project.clips if c.status == "failed"]
        if failed:
            logger.warning(f"⚠️ {len(failed)} clips failed to generate")
            project.status = "partial"
        else:
            project.status = "generated"
            logger.success(f"✅ All clips generated for project {project.project_id}")
        
        return project
    
    async def _generate_single_clip(self, clip: ClipSpec) -> bool:
        """Generate a single clip using Sora API (real OpenAI endpoint)."""
        import httpx
        
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.error("OPENAI_API_KEY not set")
            clip.error = "API key not configured"
            return False
        
        # Build Sora request (per OpenAI API docs)
        # POST https://api.openai.com/v1/videos
        # Ensure prompt is a plain string
        prompt_text = str(clip.prompt) if clip.prompt else "A cinematic scene"
        
        payload = {
            "model": clip.model,
            "prompt": prompt_text,
            "size": clip.size,
            "seconds": str(clip.duration_seconds),  # API expects string
        }
        
        logger.debug(f"Sora payload: {payload}")
        
        logger.info(f"🎥 Generating clip {clip.sequence_number}: {clip.prompt[0:50] if len(clip.prompt) > 50 else clip.prompt}...")
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                # Step 1: Create generation job
                response = await client.post(
                    "https://api.openai.com/v1/videos",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload
                )
                
                if response.status_code not in [200, 201]:
                    error_text = response.text
                    logger.error(f"Sora API error: {response.status_code} - {error_text}")
                    clip.error = f"API error: {response.status_code} - {error_text}"
                    return False
                
                data = response.json()
                video_id = data.get("id")
                clip.sora_generation_id = video_id
                logger.info(f"📋 Created Sora job: {video_id}, status: {data.get('status')}")
                
                # Step 2: Poll for completion
                status = data.get("status", "queued")
                max_polls = 120  # 10 minutes max
                poll_count = 0
                
                while status in ["queued", "in_progress", "processing"] and poll_count < max_polls:
                    await asyncio.sleep(5)  # Poll every 5 seconds
                    poll_count += 1
                    
                    poll_response = await client.get(
                        f"https://api.openai.com/v1/videos/{video_id}",
                        headers={"Authorization": f"Bearer {api_key}"}
                    )
                    
                    if poll_response.status_code == 200:
                        poll_data = poll_response.json()
                        status = poll_data.get("status", "unknown")
                        progress = poll_data.get("progress", 0)
                        logger.info(f"⏳ Clip {clip.sequence_number} progress: {progress}%, status: {status}")
                    else:
                        logger.warning(f"Poll failed: {poll_response.status_code}")
                
                if status != "completed":
                    clip.error = f"Generation did not complete: {status}"
                    logger.error(f"❌ Clip {clip.sequence_number} failed: {status}")
                    return False
                
                # Step 3: Download video content
                content_response = await client.get(
                    f"https://api.openai.com/v1/videos/{video_id}/content",
                    headers={"Authorization": f"Bearer {api_key}"},
                    timeout=120.0
                )
                
                if content_response.status_code == 200:
                    # Save to local file
                    local_path = self.output_dir / f"sora_clip_{clip.clip_id}.mp4"
                    with open(local_path, 'wb') as f:
                        f.write(content_response.content)
                    
                    clip.video_url = str(local_path)
                    clip.status = "completed"
                    logger.success(f"✅ Clip {clip.sequence_number} saved: {local_path}")
                    return True
                else:
                    clip.error = f"Failed to download content: {content_response.status_code}"
                    logger.error(f"❌ Download failed: {content_response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Sora generation exception: {e}")
            clip.error = str(e)
            return False
    
    async def compose_video(self, project: VideoProject) -> VideoProject:
        """
        Compose all clips into final video using FFmpeg.
        
        Adds text overlays and transitions.
        """
        project.status = "composing"
        
        # Get clip video paths
        clip_paths = []
        for clip in project.clips:
            if clip.video_url:
                # Download if URL
                local_path = await self._download_clip(clip)
                if local_path:
                    clip_paths.append((local_path, clip))
            else:
                logger.warning(f"Clip {clip.clip_id} has no video URL")
        
        if not clip_paths:
            project.status = "failed"
            logger.error("No clips available for composition")
            return project
        
        # Compose with FFmpeg
        output_path = self.output_dir / f"{project.project_id}.mp4"
        
        success = await self._ffmpeg_compose(clip_paths, output_path, project)
        
        if success:
            project.output_path = str(output_path)
            project.final_video_url = f"/api/sora-pipeline/output/{project.project_id}"
            project.status = "completed"
            logger.success(f"✅ Video composed: {output_path}")
            
            # Auto-save to media library
            await self._save_to_media_library(project)
        else:
            project.status = "failed"
        
        return project
    
    async def _download_clip(self, clip: ClipSpec) -> Optional[Path]:
        """Download clip from URL to local storage."""
        import httpx
        
        if not clip.video_url:
            return None
        
        local_path = self.output_dir / f"clip_{clip.clip_id}.mp4"
        
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.get(clip.video_url)
                response.raise_for_status()
                
                with open(local_path, 'wb') as f:
                    f.write(response.content)
                
                logger.info(f"Downloaded clip to {local_path}")
                return local_path
                
        except Exception as e:
            logger.error(f"Failed to download clip: {e}")
            return None
    
    async def _ffmpeg_compose(
        self,
        clip_paths: List[Tuple[Path, ClipSpec]],
        output_path: Path,
        project: VideoProject
    ) -> bool:
        """Compose clips with FFmpeg, adding text overlays."""
        import subprocess
        
        # Create concat file
        concat_file = self.output_dir / f"{project.project_id}_concat.txt"
        with open(concat_file, 'w') as f:
            for path, _ in clip_paths:
                f.write(f"file '{path}'\n")
        
        # Build filter for text overlays
        filter_parts = []
        current_time = 0.0
        
        for i, (path, clip) in enumerate(clip_paths):
            text = clip.script_text.replace("'", "'\\''").replace(":", "\\:")
            start = current_time
            end = current_time + clip.duration_seconds
            
            filter_parts.append(
                f"drawtext=text='{text}':"
                f"fontfile=/System/Library/Fonts/Helvetica.ttc:"
                f"fontsize=48:"
                f"fontcolor=white:"
                f"borderw=3:"
                f"bordercolor=black:"
                f"x=(w-text_w)/2:"
                f"y=h*0.80:"
                f"enable='between(t,{start},{end})'"
            )
            
            current_time = end
        
        filter_complex = ",".join(filter_parts)
        
        # FFmpeg command
        cmd = [
            "ffmpeg", "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(concat_file),
            "-vf", filter_complex,
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            "-c:a", "aac",
            "-b:a", "128k",
            "-movflags", "+faststart",
            str(output_path)
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode != 0:
                logger.error(f"FFmpeg error: {result.stderr}")
                return False
            
            # Cleanup
            concat_file.unlink(missing_ok=True)
            
            return output_path.exists()
            
        except Exception as e:
            logger.error(f"FFmpeg composition failed: {e}")
            return False
    
    async def create_demo_video(
        self,
        character: str = "@isaiahdupree",
        topic: str = "productivity"
    ) -> VideoProject:
        """
        Create a demo video using existing B-roll footage instead of Sora.
        
        This is useful for testing the pipeline without Sora API costs.
        """
        from services.broll_video_producer import get_producer
        
        project_id = str(uuid.uuid4())
        
        # Create project structure
        project = VideoProject(
            project_id=project_id,
            title=f"{character} - {topic}",
            description=f"Demo video about {topic}",
            main_character=character,
            character_description="Confident content creator",
            total_duration_seconds=30,
            style=VideoStyle.MOTIVATIONAL,
        )
        
        # Generate scripts
        scripts = await self._generate_clip_content(
            character, project.character_description, 3, "motivational", topic
        )
        
        # Use B-roll producer for each clip
        broll_producer = get_producer()
        clip_results = []
        
        for i, (script, prompt) in enumerate(zip(scripts[0], scripts[1])):
            from services.broll_video_producer import BrollVideoRequest, TextPosition, TextStyle
            
            request = BrollVideoRequest(
                use_trending_text=False,
                custom_text=script,
                text_position=TextPosition.CENTER,
                text_style=TextStyle.BOLD_CENTER,
                niche=topic,
                min_duration=8,
                max_duration=15,
            )
            
            result = await broll_producer.produce(request)
            
            if result.success:
                clip_results.append(result)
                
                clip = ClipSpec(
                    clip_id=result.job_id,
                    sequence_number=i + 1,
                    role=self._assign_clip_roles(3)[i],
                    duration_seconds=int(result.duration_seconds),
                    prompt=prompt,
                    script_text=script,
                    character_name=character,
                    scene_description=f"B-roll scene {i+1}",
                    status="completed",
                    video_url=result.video_path,
                )
                project.clips.append(clip)
        
        if len(project.clips) >= 2:
            # Compose the clips together
            await self._compose_demo_clips(project, clip_results)
            project.status = "completed"
        else:
            project.status = "partial"
        
        self._projects[project_id] = project
        return project
    
    async def _compose_demo_clips(
        self,
        project: VideoProject,
        clip_results: List
    ) -> None:
        """Compose demo clips into final video."""
        import subprocess
        
        output_path = self.output_dir / f"{project.project_id}.mp4"
        
        # Create concat file
        concat_file = self.output_dir / f"{project.project_id}_concat.txt"
        with open(concat_file, 'w') as f:
            for result in clip_results:
                if result.video_path:
                    f.write(f"file '{result.video_path}'\n")
        
        cmd = [
            "ffmpeg", "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(concat_file),
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            "-c:a", "aac",
            "-movflags", "+faststart",
            str(output_path)
        ]
        
        try:
            subprocess.run(cmd, capture_output=True, timeout=300)
            project.output_path = str(output_path)
            project.final_video_url = f"/api/sora-pipeline/output/{project.project_id}"
            concat_file.unlink(missing_ok=True)
        except Exception as e:
            logger.error(f"Demo composition failed: {e}")
    
    def get_project(self, project_id: str) -> Optional[VideoProject]:
        """Get a project by ID."""
        return self._projects.get(project_id)
    
    def list_projects(self) -> List[Dict]:
        """List all projects."""
        return [p.to_dict() for p in self._projects.values()]
    
    async def _save_to_media_library(self, project: VideoProject) -> Optional[str]:
        """Save a completed project to the media library."""
        if not project.output_path:
            return None
        
        return await self.save_to_media_library(
            video_path=project.output_path,
            source_type="sora_multiclip",
            title=project.title,
            metadata={
                "project_id": project.project_id,
                "style": project.style,
                "clips": len(project.clips),
                "character": project.main_character
            }
        )
    
    async def save_to_media_library(
        self,
        video_path: str,
        source_type: str = "sora",
        title: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Optional[str]:
        """
        Save a generated video to the media library with proper source_type tagging.
        
        Args:
            video_path: Path to the video file
            source_type: Type of generation (sora, generated, broll_producer)
            title: Optional title for the video
            metadata: Optional additional metadata
        
        Returns:
            Video ID if successful
        """
        import subprocess
        
        path = Path(video_path)
        if not path.exists():
            logger.error(f"Video file not found: {video_path}")
            return None
        
        # Get video duration using ffprobe
        try:
            result = subprocess.run([
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(path)
            ], capture_output=True, text=True)
            duration = int(float(result.stdout.strip())) if result.stdout.strip() else 0
        except Exception:
            duration = 0
        
        # Get file size
        file_size = path.stat().st_size
        
        # Insert into database
        engine = create_engine(DATABASE_URL)
        
        try:
            with engine.connect() as conn:
                result = conn.execute(text("""
                    INSERT INTO videos (
                        id, user_id, source_type, source_uri, file_name, 
                        title, file_size, duration_sec, created_at
                    ) VALUES (
                        gen_random_uuid(), 
                        '00000000-0000-0000-0000-000000000000'::uuid,
                        :source_type,
                        :source_uri,
                        :file_name,
                        :title,
                        :file_size,
                        :duration_sec,
                        NOW()
                    )
                    RETURNING id
                """), {
                    "source_type": source_type,
                    "source_uri": str(path.absolute()),
                    "file_name": path.name,
                    "title": title or path.stem,
                    "file_size": file_size,
                    "duration_sec": duration,
                })
                conn.commit()
                
                row = result.fetchone()
                video_id = str(row[0]) if row else None
                
                logger.info(f"📚 Saved {source_type} video to library: {video_id}")
                return video_id
                
        except Exception as e:
            logger.error(f"Failed to save to media library: {e}")
            return None


# Singleton instance
_pipeline_instance = None

def get_pipeline() -> SoraVideoPipeline:
    global _pipeline_instance
    if _pipeline_instance is None:
        _pipeline_instance = SoraVideoPipeline()
    return _pipeline_instance
