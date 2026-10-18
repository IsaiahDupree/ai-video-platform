"""
Script Generator - Convert video ideas into production-ready scripts
"""
import os
import httpx
import json
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
import logging

from .ideation import VideoIdea

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


@dataclass
class SceneScript:
    scene_num: int
    duration: float
    location: str
    narration: str
    text_overlay: str
    highlight_words: List[str]
    camera_direction: str
    sora_prompt: str
    veo3_prompt: str


@dataclass 
class VideoScript:
    title: str
    total_duration: float
    scenes: List[SceneScript]
    intro_music: str
    hashtags: List[str]
    caption: str


class ScriptGenerator:
    def __init__(self, character_description: str = None):
        self.character_description = character_description or (
            "a charismatic man in his 20s-30s with expressive facial features, "
            "wearing casual streetwear (hoodie or t-shirt), "
            "confident and humorous demeanor"
        )
    
    async def generate_script(self, idea: VideoIdea) -> VideoScript:
        """Convert a video idea into a full production script"""
        
        prompt = f"""Convert this video concept into a detailed production script with AI video generation prompts.

VIDEO CONCEPT:
Title: {idea.title}
Location: {idea.location}
Hook: {idea.hook}
Scenes: {json.dumps(idea.scenes, indent=2)}
Ending: {idea.ending}

CHARACTER DESCRIPTION: {self.character_description}

For each scene, generate:
1. Exact narration text (spoken words)
2. Text overlay (what appears on screen - SHORT, punchy, 3-6 words max)
3. Which words to highlight in pink/red
4. Camera direction (selfie walk, static, pan, etc.)
5. Sora prompt (detailed visual description for AI video generation)
6. Veo3 prompt (optimized for Google's model)

Output as JSON:
{{
    "title": "{idea.title}",
    "total_duration": <sum of scene durations>,
    "caption": "engaging TikTok caption with emojis",
    "intro_music": "upbeat lo-fi or trending sound suggestion",
    "hashtags": {json.dumps(idea.hashtags)},
    "scenes": [
        {{
            "scene_num": 1,
            "duration": 4.0,
            "location": "specific location",
            "narration": "exact words to speak",
            "text_overlay": "SHORT TEXT",
            "highlight_words": ["WORD"],
            "camera_direction": "selfie walk forward",
            "sora_prompt": "Detailed Sora prompt including character, setting, camera, lighting, mood...",
            "veo3_prompt": "Detailed Veo3 prompt optimized for Google's model..."
        }}
    ]
}}

IMPORTANT for AI prompts:
- Include character description in each prompt
- Specify 9:16 vertical format
- Include lighting (natural daylight)
- Include camera movement
- Include mood/energy
- Duration should match scene duration"""

        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {OPENAI_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-4o",
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 3000,
                        "response_format": {"type": "json_object"}
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    content = json.loads(result["choices"][0]["message"]["content"])
                    
                    scenes = [
                        SceneScript(
                            scene_num=s.get("scene_num", i+1),
                            duration=float(s.get("duration", 4.0)),
                            location=s.get("location", ""),
                            narration=s.get("narration", ""),
                            text_overlay=s.get("text_overlay", ""),
                            highlight_words=s.get("highlight_words", []),
                            camera_direction=s.get("camera_direction", "static"),
                            sora_prompt=s.get("sora_prompt", ""),
                            veo3_prompt=s.get("veo3_prompt", "")
                        )
                        for i, s in enumerate(content.get("scenes", []))
                    ]
                    
                    return VideoScript(
                        title=content.get("title", idea.title),
                        total_duration=sum(s.duration for s in scenes),
                        scenes=scenes,
                        intro_music=content.get("intro_music", "upbeat lo-fi"),
                        hashtags=content.get("hashtags", idea.hashtags),
                        caption=content.get("caption", "")
                    )
                else:
                    logger.error(f"OpenAI error: {response.status_code}")
                    raise Exception(f"API error: {response.status_code}")
                    
        except Exception as e:
            logger.error(f"Script generation error: {e}")
            raise
    
    def to_narration_text(self, script: VideoScript) -> str:
        """Extract full narration text for TTS"""
        return " ".join(scene.narration for scene in script.scenes)
    
    def to_sora_prompts(self, script: VideoScript) -> List[Dict]:
        """Extract Sora prompts with timing"""
        return [
            {
                "scene": s.scene_num,
                "duration": s.duration,
                "prompt": s.sora_prompt
            }
            for s in script.scenes
        ]
    
    def to_veo3_prompts(self, script: VideoScript) -> List[Dict]:
        """Extract Veo3 prompts with timing"""
        return [
            {
                "scene": s.scene_num,
                "duration": s.duration,
                "prompt": s.veo3_prompt
            }
            for s in script.scenes
        ]
    
    def export_script(self, script: VideoScript, filepath: str):
        """Export script to JSON file"""
        data = {
            "title": script.title,
            "total_duration": script.total_duration,
            "intro_music": script.intro_music,
            "hashtags": script.hashtags,
            "caption": script.caption,
            "scenes": [asdict(s) for s in script.scenes],
            "narration_full": self.to_narration_text(script)
        }
        
        with open(filepath, "w") as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Script exported to {filepath}")
