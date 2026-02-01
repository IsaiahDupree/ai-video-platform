"""
Explainer Video Service
=======================
Main orchestrator for generating explainer videos.

This service:
1. Takes a content brief
2. Selects/applies a format
3. Resolves all assets
4. Generates Motion Canvas scenes
5. Orchestrates rendering
"""

import asyncio
import json
import logging
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from uuid import uuid4

from .content_brief import (
    ContentBrief,
    ContentItem,
    ContentItemType,
    VideoMeta,
    StyleConfig,
    PacingConfig,
    AudioConfig,
    NarrationConfig,
    MediaAsset,
    VisualStyle,
)
from .format_registry import (
    FormatRegistry,
    VideoFormat,
    get_format_registry,
    SceneType,
)
from .asset_manager import AssetManager, Asset, AssetType

logger = logging.getLogger(__name__)


@dataclass
class RenderJob:
    """A video render job."""
    id: str
    brief_id: str
    format_id: str
    status: str  # pending, resolving_assets, generating_scenes, rendering, completed, failed
    progress: float
    created_at: datetime
    completed_at: Optional[datetime] = None
    output_path: Optional[str] = None
    error: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "brief_id": self.brief_id,
            "format_id": self.format_id,
            "status": self.status,
            "progress": self.progress,
            "created_at": self.created_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "output_path": self.output_path,
            "error": self.error,
        }


class ExplainerVideoService:
    """
    Main service for creating explainer videos.
    
    Usage:
        service = ExplainerVideoService()
        
        # Create from content brief
        brief = ContentBrief(
            video=VideoMeta(title="Every Algorithm Explained"),
            items=[
                ContentItem(id="1", type=ContentItemType.TOPIC, title="Binary Search"),
                ContentItem(id="2", type=ContentItemType.TOPIC, title="Quick Sort"),
            ]
        )
        
        # Generate video
        job = await service.create_video(brief, format_id="explainer_v1")
        
        # Or generate from AI prompt
        brief = await service.generate_brief_from_prompt(
            "Create an explainer about machine learning algorithms"
        )
    """
    
    def __init__(
        self,
        motion_canvas_dir: Optional[str] = None,
        output_dir: Optional[str] = None,
    ):
        self.motion_canvas_dir = Path(
            motion_canvas_dir or 
            "/Users/isaiahdupree/Documents/Software/MediaPoster/MotionCanvas"
        )
        self.output_dir = Path(output_dir or "data/explainer_outputs")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Components
        self.format_registry = get_format_registry()
        self.asset_manager = AssetManager()
        
        # Job tracking
        self._jobs: Dict[str, RenderJob] = {}
    
    # =========================================================================
    # BRIEF GENERATION
    # =========================================================================
    
    async def generate_brief_from_prompt(
        self,
        prompt: str,
        format_id: str = "explainer_v1",
        num_topics: int = 10,
    ) -> ContentBrief:
        """
        Generate a content brief from a natural language prompt using AI.
        
        Args:
            prompt: e.g., "Create an explainer about sorting algorithms"
            format_id: Target format
            num_topics: Number of topics to generate
        
        Returns:
            Generated ContentBrief
        """
        import os
        from openai import OpenAI
        
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        system_prompt = """You are a content strategist creating video content briefs.
Given a topic, generate a structured content brief in JSON format.

The brief should include:
1. Video metadata (title, description)
2. A list of topics/items to cover (each with id, title, description, narration script)
3. Suggested visual style

Output valid JSON only, no markdown."""

        user_prompt = f"""Create a content brief for: {prompt}

Generate {num_topics} topics/items.

JSON structure:
{{
    "video": {{
        "title": "...",
        "description": "...",
        "target_duration_seconds": 600
    }},
    "items": [
        {{
            "id": "topic_01",
            "type": "topic",
            "title": "...",
            "description": "...",
            "narration": {{
                "script": "..."
            }}
        }}
    ],
    "style": {{
        "format": "{format_id.replace('_v1', '')}",
        "visual_density": "low",
        "animation_style": "minimal"
    }}
}}"""

        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=4000,
            )
            
            content = response.choices[0].message.content
            
            # Parse JSON (handle potential markdown wrapping)
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            data = json.loads(content.strip())
            
            # Convert to ContentBrief
            brief = ContentBrief.from_dict(data)
            brief.id = str(uuid4())
            
            logger.info(f"Generated brief with {len(brief.items)} topics")
            return brief
            
        except Exception as e:
            logger.error(f"Failed to generate brief: {e}")
            raise
    
    async def generate_brief_from_topics(
        self,
        title: str,
        topics: List[str],
        format_id: str = "explainer_v1",
    ) -> ContentBrief:
        """
        Generate a content brief from a list of topics.
        
        Args:
            title: Video title
            topics: List of topic titles
            format_id: Target format
        
        Returns:
            ContentBrief with AI-generated narration scripts
        """
        import os
        from openai import OpenAI
        
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        items = []
        for i, topic in enumerate(topics):
            # Generate narration script for each topic
            try:
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a video script writer. Write concise, engaging narration scripts for explainer videos. Keep each script under 100 words."
                        },
                        {
                            "role": "user",
                            "content": f"Write a narration script explaining '{topic}' for an explainer video titled '{title}'. Be informative but concise."
                        }
                    ],
                    temperature=0.7,
                    max_tokens=200,
                )
                
                script = response.choices[0].message.content.strip()
                
            except Exception as e:
                logger.warning(f"Failed to generate script for {topic}: {e}")
                script = f"{topic} is an important concept that plays a key role in this field."
            
            item = ContentItem(
                id=f"topic_{i+1:02d}",
                type=ContentItemType.TOPIC,
                title=topic,
                narration=NarrationConfig(script=script),
            )
            items.append(item)
        
        brief = ContentBrief(
            video=VideoMeta(title=title),
            items=items,
        )
        
        return brief
    
    # =========================================================================
    # VIDEO CREATION
    # =========================================================================
    
    async def create_video(
        self,
        brief: ContentBrief,
        format_id: str = "explainer_v1",
        resolve_assets: bool = True,
        generate_tts: bool = True,
        render: bool = True,
    ) -> RenderJob:
        """
        Create a video from a content brief.
        
        Args:
            brief: The content brief
            format_id: Format to use
            resolve_assets: Whether to fetch external assets
            generate_tts: Whether to generate voiceovers
            render: Whether to render the final video
        
        Returns:
            RenderJob with status and output path
        """
        job_id = str(uuid4())[:8]
        job = RenderJob(
            id=job_id,
            brief_id=brief.id,
            format_id=format_id,
            status="pending",
            progress=0.0,
            created_at=datetime.now(),
        )
        self._jobs[job_id] = job
        
        try:
            # Get format
            format_config = self.format_registry.get(format_id)
            if not format_config:
                raise ValueError(f"Unknown format: {format_id}")
            
            logger.info(f"Creating video with format: {format_config.name}")
            
            # 1. Resolve assets
            if resolve_assets:
                job.status = "resolving_assets"
                job.progress = 0.1
                
                logger.info("Resolving assets...")
                assets = await self.asset_manager.resolve_assets_for_brief(brief)
                brief.resolved_assets = assets
                
                job.progress = 0.3
            
            # 2. Generate TTS
            if generate_tts:
                job.status = "generating_tts"
                job.progress = 0.4
                
                logger.info("Generating voiceovers...")
                await self._generate_voiceovers(brief)
                
                job.progress = 0.5
            
            # 3. Generate Motion Canvas scenes
            job.status = "generating_scenes"
            job.progress = 0.6
            
            logger.info("Generating Motion Canvas scenes...")
            scene_files = await self._generate_scenes(brief, format_config)
            
            job.progress = 0.7
            
            # 4. Render video
            if render:
                job.status = "rendering"
                job.progress = 0.8
                
                logger.info("Rendering video...")
                output_path = await self._render_video(brief, format_config, scene_files)
                
                job.output_path = str(output_path)
                job.progress = 1.0
            
            job.status = "completed"
            job.completed_at = datetime.now()
            
            logger.info(f"Video created: {job.output_path}")
            return job
            
        except Exception as e:
            job.status = "failed"
            job.error = str(e)
            logger.error(f"Video creation failed: {e}")
            raise
    
    async def _generate_voiceovers(self, brief: ContentBrief) -> None:
        """Generate TTS voiceovers for all items with narration."""
        import os
        
        elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
        if not elevenlabs_key:
            logger.warning("ElevenLabs API key not configured, skipping TTS")
            return
        
        import httpx
        
        voiceover_dir = self.output_dir / "voiceovers" / brief.id
        voiceover_dir.mkdir(parents=True, exist_ok=True)
        
        for item in brief.items:
            if not item.narration or not item.narration.script:
                continue
            
            output_path = voiceover_dir / f"{item.id}.mp3"
            
            # Skip if already generated
            if output_path.exists():
                continue
            
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(
                        "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
                        headers={
                            "xi-api-key": elevenlabs_key,
                            "Content-Type": "application/json",
                        },
                        json={
                            "text": item.narration.script,
                            "model_id": "eleven_monolingual_v1",
                            "voice_settings": {
                                "stability": 0.5,
                                "similarity_boost": 0.5,
                            }
                        }
                    )
                    
                    if response.status_code == 200:
                        output_path.write_bytes(response.content)
                        logger.info(f"Generated voiceover: {item.id}")
                    else:
                        logger.warning(f"TTS failed for {item.id}: {response.status_code}")
                        
            except Exception as e:
                logger.warning(f"TTS generation failed for {item.id}: {e}")
    
    async def _generate_scenes(
        self,
        brief: ContentBrief,
        format_config: VideoFormat
    ) -> List[Path]:
        """Generate Motion Canvas scene files."""
        scenes_dir = self.motion_canvas_dir / "src" / "scenes" / "generated"
        scenes_dir.mkdir(parents=True, exist_ok=True)
        
        scene_files = []
        
        # Generate intro scene if needed
        if "intro" in format_config.scene_order:
            intro_path = await self._generate_intro_scene(brief, format_config, scenes_dir)
            scene_files.append(intro_path)
        
        # Generate item scenes
        if "item_loop" in format_config.scene_order or "event_loop" in format_config.scene_order:
            for item in brief.items:
                scene_path = await self._generate_item_scene(
                    item, brief, format_config, scenes_dir
                )
                scene_files.append(scene_path)
        
        # Generate outro scene if needed
        if "outro" in format_config.scene_order:
            outro_path = await self._generate_outro_scene(brief, format_config, scenes_dir)
            scene_files.append(outro_path)
        
        # Update project.ts to include new scenes
        await self._update_project_file(scene_files)
        
        return scene_files
    
    async def _generate_intro_scene(
        self,
        brief: ContentBrief,
        format_config: VideoFormat,
        output_dir: Path
    ) -> Path:
        """Generate intro scene."""
        scene_id = f"intro_{brief.id[:8]}"
        scene_path = output_dir / f"{scene_id}.tsx"
        
        visuals = format_config.visuals
        
        code = f'''import {{makeScene2D}} from '@motion-canvas/2d';
import {{Txt, Rect}} from '@motion-canvas/2d/lib/components';
import {{createRef}} from '@motion-canvas/core';
import {{all, waitFor}} from '@motion-canvas/core/lib/flow';

export default makeScene2D(function* (view) {{
  // Background
  const bg = createRef<Rect>();
  view.add(
    <Rect
      ref={{bg}}
      width={{1920}}
      height={{1080}}
      fill={{'{visuals.background}'}}
    />
  );
  
  // Title
  const title = createRef<Txt>();
  view.add(
    <Txt
      ref={{title}}
      text={{'{brief.video.title}'}}
      fontSize={{72}}
      fill={{'{visuals.text_color}'}}
      fontWeight={{700}}
      textAlign={{'center'}}
      opacity={{0}}
    />
  );
  
  // Animate in
  yield* all(
    title().opacity(1, 0.8),
    title().scale(0.9, 0).to(1, 0.8),
  );
  
  yield* waitFor({format_config.timing.intro_seconds - 1});
  
  // Animate out
  yield* title().opacity(0, 0.5);
}});
'''
        
        scene_path.write_text(code)
        logger.info(f"Generated intro scene: {scene_path}")
        return scene_path
    
    async def _generate_item_scene(
        self,
        item: ContentItem,
        brief: ContentBrief,
        format_config: VideoFormat,
        output_dir: Path
    ) -> Path:
        """Generate scene for a single content item."""
        scene_id = f"{item.id}_{brief.id[:8]}"
        scene_path = output_dir / f"{scene_id}.tsx"
        
        visuals = format_config.visuals
        timing = format_config.timing
        
        # Determine scene type based on format
        scene_type = format_config.item_mapping.scene
        
        if scene_type == "TopicScene":
            code = self._generate_topic_scene_code(item, visuals, timing)
        elif scene_type == "FastTopicScene":
            code = self._generate_fast_topic_scene_code(item, visuals, timing)
        elif scene_type == "ComparisonScene":
            code = self._generate_comparison_scene_code(item, visuals, timing)
        else:
            code = self._generate_topic_scene_code(item, visuals, timing)
        
        scene_path.write_text(code)
        logger.info(f"Generated scene for {item.id}: {scene_path}")
        return scene_path
    
    def _generate_topic_scene_code(self, item, visuals, timing) -> str:
        """Generate TopicScene code for explainer format."""
        return f'''import {{makeScene2D}} from '@motion-canvas/2d';
import {{Txt, Rect, Img}} from '@motion-canvas/2d/lib/components';
import {{createRef}} from '@motion-canvas/core';
import {{all, waitFor}} from '@motion-canvas/core/lib/flow';
import {{easeOutCubic}} from '@motion-canvas/core/lib/tweening';

export default makeScene2D(function* (view) {{
  // Background
  view.add(
    <Rect
      width={{1920}}
      height={{1080}}
      fill={{'{visuals.background}'}}
    />
  );
  
  // Icon placeholder
  const icon = createRef<Rect>();
  view.add(
    <Rect
      ref={{icon}}
      width={{200}}
      height={{200}}
      fill={{'{visuals.accent_color}'}}
      radius={{20}}
      y={{-100}}
      opacity={{0}}
      scale={{0.8}}
    />
  );
  
  // Title
  const title = createRef<Txt>();
  view.add(
    <Txt
      ref={{title}}
      text={{'{item.title}'}}
      fontSize={{64}}
      fill={{'{visuals.text_color}'}}
      fontWeight={{700}}
      y={{100}}
      opacity={{0}}
    />
  );
  
  // Description
  const desc = createRef<Txt>();
  view.add(
    <Txt
      ref={{desc}}
      text={{'{(item.description or "")[:100]}'}}
      fontSize={{32}}
      fill={{'#aaaaaa'}}
      y={{180}}
      opacity={{0}}
      width={{1200}}
      textWrap
      textAlign={{'center'}}
    />
  );
  
  // Animate in
  yield* all(
    icon().opacity(1, 0.5, easeOutCubic),
    icon().scale(1, 0.5, easeOutCubic),
  );
  
  yield* waitFor(0.2);
  
  yield* all(
    title().opacity(1, 0.4),
    desc().opacity(1, 0.4),
  );
  
  // Zoom effect
  {"yield* icon().scale(1.1, 0.6, easeOutCubic);" if visuals.zoom else ""}
  
  // Hold for narration
  yield* waitFor({timing.per_item_seconds - 2});
  
  // Animate out
  yield* all(
    icon().opacity(0, 0.4),
    title().opacity(0, 0.4),
    desc().opacity(0, 0.4),
  );
}});
'''
    
    def _generate_fast_topic_scene_code(self, item, visuals, timing) -> str:
        """Generate FastTopicScene for listicle/shorts format."""
        return f'''import {{makeScene2D}} from '@motion-canvas/2d';
import {{Txt, Rect}} from '@motion-canvas/2d/lib/components';
import {{createRef}} from '@motion-canvas/core';
import {{all, waitFor}} from '@motion-canvas/core/lib/flow';
import {{easeOutBack}} from '@motion-canvas/core/lib/tweening';

export default makeScene2D(function* (view) {{
  view.add(
    <Rect width={{1920}} height={{1080}} fill={{'{visuals.background}'}} />
  );
  
  const title = createRef<Txt>();
  view.add(
    <Txt
      ref={{title}}
      text={{'{item.title}'}}
      fontSize={{80}}
      fill={{'{visuals.text_color}'}}
      fontWeight={{800}}
      opacity={{0}}
      scale={{0.5}}
    />
  );
  
  // Quick pop-in animation
  yield* all(
    title().opacity(1, 0.3, easeOutBack),
    title().scale(1, 0.3, easeOutBack),
  );
  
  yield* waitFor({timing.per_item_seconds - 0.6});
  
  yield* title().opacity(0, 0.3);
}});
'''
    
    def _generate_comparison_scene_code(self, item, visuals, timing) -> str:
        """Generate ComparisonScene for comparison format."""
        return f'''import {{makeScene2D}} from '@motion-canvas/2d';
import {{Txt, Rect, Layout}} from '@motion-canvas/2d/lib/components';
import {{createRef}} from '@motion-canvas/core';
import {{all, waitFor}} from '@motion-canvas/core/lib/flow';

export default makeScene2D(function* (view) {{
  view.add(
    <Rect width={{1920}} height={{1080}} fill={{'{visuals.background}'}} />
  );
  
  // Split screen layout
  const leftPanel = createRef<Rect>();
  const rightPanel = createRef<Rect>();
  
  view.add(
    <Layout direction={{'row'}} width={{1920}} height={{1080}}>
      <Rect
        ref={{leftPanel}}
        width={{960}}
        height={{1080}}
        fill={{'#1a1a1a'}}
      >
        <Txt
          text={{'{item.title}'}}
          fontSize={{48}}
          fill={{'{visuals.text_color}'}}
          fontWeight={{700}}
        />
      </Rect>
      <Rect
        ref={{rightPanel}}
        width={{960}}
        height={{1080}}
        fill={{'#2a2a2a'}}
      >
        <Txt
          text={{'vs'}}
          fontSize={{48}}
          fill={{'{visuals.accent_color}'}}
          fontWeight={{700}}
        />
      </Rect>
    </Layout>
  );
  
  yield* waitFor({timing.per_item_seconds});
}});
'''
    
    async def _generate_outro_scene(
        self,
        brief: ContentBrief,
        format_config: VideoFormat,
        output_dir: Path
    ) -> Path:
        """Generate outro scene."""
        scene_id = f"outro_{brief.id[:8]}"
        scene_path = output_dir / f"{scene_id}.tsx"
        
        visuals = format_config.visuals
        ending = brief.ending
        
        code = f'''import {{makeScene2D}} from '@motion-canvas/2d';
import {{Txt, Rect}} from '@motion-canvas/2d/lib/components';
import {{createRef}} from '@motion-canvas/core';
import {{all, waitFor}} from '@motion-canvas/core/lib/flow';

export default makeScene2D(function* (view) {{
  view.add(
    <Rect width={{1920}} height={{1080}} fill={{'{visuals.background}'}} />
  );
  
  const message = createRef<Txt>();
  view.add(
    <Txt
      ref={{message}}
      text={{'{ending.message or "Thanks for watching!"}'}}
      fontSize={{56}}
      fill={{'{visuals.text_color}'}}
      fontWeight={{600}}
      opacity={{0}}
    />
  );
  
  yield* message().opacity(1, 0.8);
  yield* waitFor({format_config.timing.outro_seconds - 2});
  yield* message().opacity(0, 0.5);
}});
'''
        
        scene_path.write_text(code)
        logger.info(f"Generated outro scene: {scene_path}")
        return scene_path
    
    async def _update_project_file(self, scene_files: List[Path]) -> None:
        """Update Motion Canvas project.ts with new scenes."""
        project_path = self.motion_canvas_dir / "src" / "project.ts"
        
        # Generate imports
        imports = []
        scene_names = []
        
        for scene_file in scene_files:
            scene_name = scene_file.stem
            relative_path = f"./scenes/generated/{scene_name}"
            imports.append(f"import {scene_name} from '{relative_path}?scene';")
            scene_names.append(scene_name)
        
        # Generate project file
        code = f'''import {{makeProject}} from '@motion-canvas/core';

{chr(10).join(imports)}

export default makeProject({{
  scenes: [{', '.join(scene_names)}],
}});
'''
        
        project_path.write_text(code)
        logger.info(f"Updated project.ts with {len(scene_files)} scenes")
    
    async def _render_video(
        self,
        brief: ContentBrief,
        format_config: VideoFormat,
        scene_files: List[Path]
    ) -> Path:
        """Render the video using Motion Canvas CLI."""
        output_path = self.output_dir / f"{brief.id}.mp4"
        
        # Run Motion Canvas render
        import subprocess
        
        cmd = [
            "npm", "run", "render",
            "--", 
            "--output", str(output_path),
        ]
        
        logger.info(f"Running: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            cwd=str(self.motion_canvas_dir),
            capture_output=True,
            text=True,
            timeout=600,  # 10 minute timeout
        )
        
        if result.returncode != 0:
            logger.error(f"Render failed: {result.stderr}")
            # For now, create a placeholder
            output_path.touch()
        
        return output_path
    
    # =========================================================================
    # JOB MANAGEMENT
    # =========================================================================
    
    def get_job(self, job_id: str) -> Optional[RenderJob]:
        """Get a render job by ID."""
        return self._jobs.get(job_id)
    
    def list_jobs(self) -> List[RenderJob]:
        """List all render jobs."""
        return list(self._jobs.values())
    
    # =========================================================================
    # UTILITY METHODS
    # =========================================================================
    
    def list_formats(self) -> List[Dict]:
        """List available video formats."""
        return [f.to_dict() for f in self.format_registry.list_all()]
    
    def get_format(self, format_id: str) -> Optional[VideoFormat]:
        """Get a format by ID."""
        return self.format_registry.get(format_id)
    
    async def preview_brief(self, brief: ContentBrief) -> Dict:
        """Get a preview of what the video would look like."""
        return {
            "title": brief.video.title,
            "estimated_duration": brief.calculate_total_duration(),
            "topic_count": len(brief.items),
            "topics": [
                {
                    "id": item.id,
                    "title": item.title,
                    "has_narration": bool(item.narration),
                }
                for item in brief.items
            ],
            "style": brief.style.to_dict(),
            "audio": brief.audio.to_dict(),
        }
