"""
Main Video Pipeline Orchestrator
Coordinates ideation → scripting → generation → stitching → posting
"""
import os
import asyncio
import json
from pathlib import Path
from typing import Optional, List, Dict
from dataclasses import dataclass, asdict
from datetime import datetime
import logging

from .ideation import ContentIdeator, VideoIdea
from .script_generator import ScriptGenerator, VideoScript
from .stitcher import VideoStitcher, StitchConfig, TextOverlay

logger = logging.getLogger(__name__)


@dataclass
class PipelineConfig:
    style: str = "pensacola_bigfoot"
    character_description: str = None
    output_dir: str = None
    video_generator: str = "sora"  # sora or veo3
    voice_id: str = None  # ElevenLabs voice ID
    auto_post: bool = False
    platforms: List[str] = None


@dataclass
class GeneratedVideo:
    title: str
    location: str
    local_path: str
    duration: float
    script: VideoScript
    caption: str
    hashtags: List[str]
    created_at: str
    posted: bool = False
    post_urls: Dict[str, str] = None


class VideoPipeline:
    def __init__(self, config: PipelineConfig = None):
        self.config = config or PipelineConfig()
        self.output_dir = Path(self.config.output_dir or "/tmp/ai_video_pipeline")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.ideator = ContentIdeator(style=self.config.style)
        self.script_gen = ScriptGenerator(
            character_description=self.config.character_description
        )
        self.stitcher = VideoStitcher(str(self.output_dir / "temp"))
    
    async def create_video(
        self,
        location: str,
        theme: Optional[str] = None,
        duration: int = 30
    ) -> GeneratedVideo:
        """Full pipeline: idea → script → generate → stitch"""
        
        logger.info(f"🎬 Creating video for {location}")
        
        # Step 1: Generate idea
        logger.info("Step 1: Generating idea...")
        idea = await self.ideator.generate_idea(location, theme, duration)
        logger.info(f"✅ Idea: {idea.title}")
        logger.info(f"   Hook: {idea.hook}")
        
        # Step 2: Generate script
        logger.info("Step 2: Generating script...")
        script = await self.script_gen.generate_script(idea)
        logger.info(f"✅ Script: {len(script.scenes)} scenes, {script.total_duration}s")
        
        # Save script
        script_path = self.output_dir / f"{self._safe_filename(location)}_script.json"
        self.script_gen.export_script(script, str(script_path))
        
        # Step 3: Generate video clips (placeholder - requires Sora/Veo3 API)
        logger.info("Step 3: Video generation prompts ready")
        prompts = self.script_gen.to_sora_prompts(script) if self.config.video_generator == "sora" else self.script_gen.to_veo3_prompts(script)
        
        prompts_path = self.output_dir / f"{self._safe_filename(location)}_prompts.json"
        with open(prompts_path, "w") as f:
            json.dump(prompts, f, indent=2)
        logger.info(f"✅ Prompts saved to {prompts_path}")
        
        # Step 4: Generate narration (placeholder - requires ElevenLabs)
        narration_text = self.script_gen.to_narration_text(script)
        narration_path = self.output_dir / f"{self._safe_filename(location)}_narration.txt"
        narration_path.write_text(narration_text)
        logger.info(f"✅ Narration text saved to {narration_path}")
        
        # Create result
        video = GeneratedVideo(
            title=script.title,
            location=location,
            local_path=str(prompts_path),  # Will be video path when generation is implemented
            duration=script.total_duration,
            script=script,
            caption=script.caption,
            hashtags=script.hashtags,
            created_at=datetime.now().isoformat(),
            posted=False
        )
        
        # Save manifest
        manifest_path = self.output_dir / f"{self._safe_filename(location)}_manifest.json"
        manifest = {
            "title": video.title,
            "location": video.location,
            "duration": video.duration,
            "caption": video.caption,
            "hashtags": video.hashtags,
            "created_at": video.created_at,
            "script_path": str(script_path),
            "prompts_path": str(prompts_path),
            "narration_path": str(narration_path),
            "video_generator": self.config.video_generator,
            "scenes": [
                {
                    "num": s.scene_num,
                    "duration": s.duration,
                    "text_overlay": s.text_overlay,
                    "prompt": s.sora_prompt if self.config.video_generator == "sora" else s.veo3_prompt
                }
                for s in script.scenes
            ]
        }
        with open(manifest_path, "w") as f:
            json.dump(manifest, f, indent=2)
        
        logger.info(f"✅ Manifest saved to {manifest_path}")
        
        return video
    
    async def batch_create(
        self,
        locations: List[str],
        theme: Optional[str] = None
    ) -> List[GeneratedVideo]:
        """Create videos for multiple locations"""
        videos = []
        for location in locations:
            try:
                video = await self.create_video(location, theme)
                videos.append(video)
            except Exception as e:
                logger.error(f"Error creating video for {location}: {e}")
        return videos
    
    def _safe_filename(self, text: str) -> str:
        """Convert text to safe filename"""
        return "".join(c if c.isalnum() or c in "._- " else "_" for c in text).strip().replace(" ", "_").lower()
    
    def get_pending_generation(self) -> List[Dict]:
        """Get list of scripts pending AI video generation"""
        pending = []
        for manifest_file in self.output_dir.glob("*_manifest.json"):
            with open(manifest_file) as f:
                manifest = json.load(f)
            if "video_path" not in manifest:
                pending.append(manifest)
        return pending
    
    def print_generation_instructions(self, manifest: Dict):
        """Print instructions for manual video generation"""
        print(f"\n{'='*60}")
        print(f"VIDEO: {manifest['title']}")
        print(f"LOCATION: {manifest['location']}")
        print(f"GENERATOR: {manifest['video_generator'].upper()}")
        print(f"{'='*60}\n")
        
        print("NARRATION TO RECORD/GENERATE:")
        narration_path = manifest.get("narration_path")
        if narration_path and Path(narration_path).exists():
            print(Path(narration_path).read_text())
        print()
        
        print("SCENES TO GENERATE:")
        for scene in manifest["scenes"]:
            print(f"\n--- Scene {scene['num']} ({scene['duration']}s) ---")
            print(f"Text overlay: {scene['text_overlay']}")
            print(f"\nPROMPT:\n{scene['prompt']}")
        
        print(f"\n{'='*60}")
        print("CAPTION:")
        print(manifest["caption"])
        print(f"\nHASHTAGS: {' '.join('#' + h for h in manifest['hashtags'])}")
        print(f"{'='*60}\n")


async def main():
    """Demo the pipeline"""
    
    config = PipelineConfig(
        style="pensacola_bigfoot",
        character_description="Isaiah, a charismatic Black man in his late 20s with a warm smile, wearing a casual hoodie and gold chain, expressive and humorous",
        video_generator="sora"
    )
    
    pipeline = VideoPipeline(config)
    
    # Generate for a location
    video = await pipeline.create_video(
        location="Pensacola, FL",
        theme="beach town quirks",
        duration=30
    )
    
    print(f"\n✅ Video concept generated!")
    print(f"   Title: {video.title}")
    print(f"   Duration: {video.duration}s")
    print(f"   Scenes: {len(video.script.scenes)}")
    
    # Print generation instructions
    pending = pipeline.get_pending_generation()
    if pending:
        pipeline.print_generation_instructions(pending[0])


if __name__ == "__main__":
    asyncio.run(main())
