"""
Content Ideation - Generate video concepts using GPT-4
"""
import os
import httpx
from typing import Dict, List, Optional
from dataclasses import dataclass
import json
import logging

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

STYLE_TEMPLATES = {
    "pensacola_bigfoot": {
        "persona": "A sarcastic, humorous local guide roasting Florida locations",
        "tone": "Playful mockery with love, insider knowledge, self-deprecating",
        "structure": "Hook → 4-5 location observations → Callback punchline",
        "themes": [
            "tourist traps vs local spots",
            "weird town quirks",
            "college town stereotypes", 
            "beach town culture",
            "florida man energy",
            "suburban oddities",
            "local food drama",
            "weather complaints",
            "traffic/driving roasts",
            "historical landmarks nobody cares about"
        ]
    }
}


@dataclass
class VideoIdea:
    title: str
    location: str
    theme: str
    hook: str
    scenes: List[Dict]
    ending: str
    estimated_duration: int
    hashtags: List[str]


class ContentIdeator:
    def __init__(self, style: str = "pensacola_bigfoot"):
        self.style = style
        self.template = STYLE_TEMPLATES.get(style, STYLE_TEMPLATES["pensacola_bigfoot"])
    
    async def generate_idea(
        self,
        location: str,
        theme: Optional[str] = None,
        duration: int = 30
    ) -> VideoIdea:
        """Generate a video concept for the given location"""
        
        theme = theme or "general roast"
        num_scenes = max(3, duration // 6)
        
        prompt = f"""You are a viral TikTok content strategist. Generate a video concept in the style of @pensacola_bigfoot.

STYLE: {self.template['persona']}
TONE: {self.template['tone']}
STRUCTURE: {self.template['structure']}

LOCATION: {location}
THEME: {theme}
TARGET DURATION: {duration} seconds ({num_scenes} scenes)

Generate a complete video concept as JSON:
{{
    "title": "catchy title for the video",
    "hook": "first 3 seconds - must immediately grab attention with humor",
    "scenes": [
        {{
            "scene_num": 1,
            "location_detail": "specific spot in {location}",
            "observation": "sarcastic/funny observation about this spot",
            "visual": "what we see on screen",
            "duration": 5
        }}
    ],
    "ending": "callback punchline that ties back to hook",
    "hashtags": ["relevant", "hashtags", "for", "discovery"]
}}

Make it genuinely funny, locally specific, and highly shareable. The humor should be relatable to anyone who's been to {location}."""

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {OPENAI_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-4o",
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 1500,
                        "response_format": {"type": "json_object"}
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    content = json.loads(result["choices"][0]["message"]["content"])
                    
                    return VideoIdea(
                        title=content.get("title", f"Welcome to {location}"),
                        location=location,
                        theme=theme,
                        hook=content.get("hook", ""),
                        scenes=content.get("scenes", []),
                        ending=content.get("ending", ""),
                        estimated_duration=sum(s.get("duration", 5) for s in content.get("scenes", [])),
                        hashtags=content.get("hashtags", [])
                    )
                else:
                    logger.error(f"OpenAI error: {response.status_code}")
                    raise Exception(f"API error: {response.status_code}")
                    
        except Exception as e:
            logger.error(f"Ideation error: {e}")
            raise
    
    async def batch_generate(
        self,
        locations: List[str],
        theme: Optional[str] = None
    ) -> List[VideoIdea]:
        """Generate ideas for multiple locations"""
        ideas = []
        for location in locations:
            idea = await self.generate_idea(location, theme)
            ideas.append(idea)
        return ideas
    
    def get_theme_suggestions(self) -> List[str]:
        """Get available theme suggestions for this style"""
        return self.template.get("themes", [])
