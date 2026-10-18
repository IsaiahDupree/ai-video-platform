"""
Narrative Bridge for Video Orchestrator
========================================
Connects the Narrative Scheduler with the Video Orchestrator
to enable end-to-end content generation from goals to videos.

Flow:
1. Narrative Goal → Content Brief
2. Content Brief → Video Script (via AI)
3. Video Script → ClipPlan (via Director)
4. ClipPlan → Provider Payloads (via SceneCrafter)
5. Generated Videos → Scheduled Posts
"""

import os
import logging
from typing import List, Dict, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from uuid import uuid4

from .director import DirectorService, DirectorConfig
from .scene_crafter import SceneCrafterService
from .models import (
    VideoScript,
    ContentBrief,
    ClipPlan,
    Scene,
    ClipPlanClip,
    PlanConstraints,
    PacingConstraints,
    VideoBible,
    BibleKind,
    ProviderName,
)

logger = logging.getLogger(__name__)


@dataclass
class NarrativeVideoBrief:
    """A video brief generated from narrative goals."""
    id: str = field(default_factory=lambda: str(uuid4()))
    narrative_goal_id: str = ""
    pillar: str = ""
    
    # Brief content
    topic: str = ""
    objective: str = ""
    hook: str = ""
    key_points: List[str] = field(default_factory=list)
    call_to_action: str = ""
    
    # Target specs
    target_duration_seconds: int = 30
    target_platforms: List[str] = field(default_factory=list)
    aspect_ratio: str = "9:16"  # vertical for short-form
    
    # Style
    tone: str = "engaging"
    audience: str = "general"
    visual_style: str = "dynamic"
    
    def to_content_brief(self) -> ContentBrief:
        """Convert to video orchestrator ContentBrief."""
        from uuid import UUID
        return ContentBrief(
            objective=self.objective or self.topic,
            key_points=self.key_points,
            tone=self.tone,
            audience=self.audience,
            cta=self.call_to_action
        )
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "narrative_goal_id": self.narrative_goal_id,
            "pillar": self.pillar,
            "topic": self.topic,
            "objective": self.objective,
            "hook": self.hook,
            "key_points": self.key_points,
            "call_to_action": self.call_to_action,
            "target_duration_seconds": self.target_duration_seconds,
            "target_platforms": self.target_platforms,
            "aspect_ratio": self.aspect_ratio,
            "tone": self.tone,
            "audience": self.audience
        }


@dataclass
class GeneratedVideoContent:
    """Result of video content generation."""
    id: str = field(default_factory=lambda: str(uuid4()))
    brief_id: str = ""
    
    # Generated content
    script: str = ""
    clip_plan_id: Optional[str] = None
    clips: List[Dict[str, Any]] = field(default_factory=list)
    
    # Provider payloads (ready to send)
    provider_payloads: List[Dict[str, Any]] = field(default_factory=list)
    
    # Status
    status: str = "draft"  # draft, ready, generating, completed
    total_duration_seconds: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "brief_id": self.brief_id,
            "script": self.script,
            "clip_plan_id": self.clip_plan_id,
            "clips_count": len(self.clips),
            "provider_payloads_count": len(self.provider_payloads),
            "status": self.status,
            "total_duration_seconds": self.total_duration_seconds
        }


class NarrativeVideoBridge:
    """
    Bridges the Narrative Scheduler with Video Orchestrator.
    
    Enables:
    - Converting narrative goals to video briefs
    - Generating scripts from briefs
    - Creating clip plans with proper pacing
    - Building provider-ready payloads
    """
    
    def __init__(
        self,
        openai_api_key: Optional[str] = None,
        default_provider: ProviderName = ProviderName.SORA
    ):
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        self.director = DirectorService()
        self.scene_crafter = SceneCrafterService(default_provider=default_provider)
    
    async def generate_brief_from_narrative(
        self,
        goal_statement: str,
        pillar: str,
        primary_cta: str,
        target_audience: str,
        target_duration: int = 30
    ) -> NarrativeVideoBrief:
        """
        Generate a video brief from narrative goal and pillar.
        """
        # Build hook and topic based on pillar
        hook, topic, key_points = self._get_pillar_content(pillar, goal_statement)
        
        # Build CTA
        cta = self._get_cta_text(primary_cta)
        
        brief = NarrativeVideoBrief(
            narrative_goal_id=str(uuid4()),
            pillar=pillar,
            topic=topic,
            objective=goal_statement,
            hook=hook,
            key_points=key_points,
            call_to_action=cta,
            target_duration_seconds=target_duration,
            target_platforms=["tiktok", "instagram"],
            aspect_ratio="9:16",
            tone="engaging",
            audience=target_audience
        )
        
        return brief
    
    async def generate_script_from_brief(
        self,
        brief: NarrativeVideoBrief
    ) -> str:
        """Generate a video script from brief using AI."""
        
        if not self.openai_api_key:
            return self._generate_basic_script(brief)
        
        try:
            import openai
            client = openai.OpenAI(api_key=self.openai_api_key)
            
            # Calculate word count for duration
            words_per_minute = 150
            target_words = int((brief.target_duration_seconds / 60) * words_per_minute)
            
            prompt = f"""Write a short-form video script for social media.

TOPIC: {brief.topic}
HOOK: {brief.hook}
KEY POINTS: {', '.join(brief.key_points)}
CALL TO ACTION: {brief.call_to_action}
TONE: {brief.tone}
AUDIENCE: {brief.audience}
PILLAR: {brief.pillar}

TARGET: {target_words} words ({brief.target_duration_seconds} seconds)

Requirements:
1. Start with an attention-grabbing hook (first 3 seconds)
2. Deliver value quickly and concisely
3. Include natural transitions between points
4. End with clear call-to-action
5. Write in conversational, engaging style

Format: Write only the script narration, no labels or timestamps."""

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You write engaging short-form video scripts optimized for TikTok and Instagram."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=400
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"AI script generation failed: {e}")
            return self._generate_basic_script(brief)
    
    async def create_clip_plan_from_brief(
        self,
        brief: NarrativeVideoBrief,
        script: str,
        style_bible: Optional[VideoBible] = None
    ) -> Tuple[ClipPlan, Scene, List[ClipPlanClip]]:
        """
        Create a clip plan from brief and script.
        
        Uses Director service for proper pacing and segmentation.
        """
        # Create VideoScript object
        video_script = VideoScript(
            project_id=brief.narrative_goal_id,
            title=brief.topic,
            body=script,
            language="en"
        )
        
        # Set constraints based on brief
        aspect_ratio = brief.aspect_ratio
        max_seconds = brief.target_duration_seconds + 10  # Allow slight overage
        
        constraints = PlanConstraints(
            max_total_seconds=max_seconds,
            aspect_ratio=aspect_ratio,
            pacing=PacingConstraints(
                words_per_minute=150,
                max_words_per_clip=25  # ~6-10 seconds per clip
            )
        )
        
        # Create content brief for context
        content_brief = brief.to_content_brief()
        
        # Use Director to create plan
        plan, scene, clips = await self.director.create_clip_plan(
            script=video_script,
            brief=content_brief,
            constraints=constraints,
            style_bible_id=str(style_bible.id) if style_bible else None
        )
        
        logger.info(f"Created clip plan with {len(clips)} clips")
        
        return plan, scene, clips
    
    async def build_provider_payloads(
        self,
        clips: List[ClipPlanClip],
        style_bible: Optional[VideoBible] = None,
        character_bible: Optional[VideoBible] = None
    ) -> List[Dict[str, Any]]:
        """
        Build provider-ready payloads for all clips.
        
        Uses SceneCrafter to bake prompts with bible rules.
        """
        payloads = []
        
        for clip in clips:
            # Build baked prompt
            baked_prompt = self.scene_crafter.build_baked_prompt(
                clip=clip,
                style_bible=style_bible,
                character_bible=character_bible
            )
            
            # Build provider payload
            payload = {
                "clip_id": str(clip.id),
                "prompt": baked_prompt,
                "duration_seconds": clip.target_seconds,
                "narration_text": clip.narration.text if clip.narration else "",
                "provider": clip.provider_hints.primary_provider.value if clip.provider_hints else "sora",
                "model": clip.provider_hints.model if clip.provider_hints else "sora-2",
                "size": clip.provider_hints.size if clip.provider_hints else "720x1280"
            }
            
            payloads.append(payload)
        
        return payloads
    
    async def full_generation_pipeline(
        self,
        goal_statement: str,
        pillar: str,
        primary_cta: str = "follow",
        target_audience: str = "general",
        target_duration: int = 30
    ) -> GeneratedVideoContent:
        """
        Full pipeline: narrative goal → ready-to-generate video content.
        
        Steps:
        1. Generate brief from narrative
        2. Generate script from brief
        3. Create clip plan
        4. Build provider payloads
        """
        result = GeneratedVideoContent()
        
        # Step 1: Generate brief
        brief = await self.generate_brief_from_narrative(
            goal_statement=goal_statement,
            pillar=pillar,
            primary_cta=primary_cta,
            target_audience=target_audience,
            target_duration=target_duration
        )
        result.brief_id = brief.id
        
        # Step 2: Generate script
        script = await self.generate_script_from_brief(brief)
        result.script = script
        
        # Step 3: Create clip plan
        plan, scene, clips = await self.create_clip_plan_from_brief(brief, script)
        result.clip_plan_id = str(plan.id)
        result.clips = [
            {
                "id": str(c.id),
                "order": c.clip_order,
                "duration": c.target_seconds,
                "narration": c.narration.text[:50] + "..." if c.narration else ""
            }
            for c in clips
        ]
        result.total_duration_seconds = sum(c.target_seconds for c in clips)
        
        # Step 4: Build payloads
        payloads = await self.build_provider_payloads(clips)
        result.provider_payloads = payloads
        
        result.status = "ready"
        
        logger.info(f"Generated video content: {len(clips)} clips, {result.total_duration_seconds}s total")
        
        return result
    
    def _get_pillar_content(
        self,
        pillar: str,
        goal_statement: str
    ) -> Tuple[str, str, List[str]]:
        """Get content template for pillar."""
        templates = {
            "Process/How-To": {
                "hooks": ["Here's how to do this in 30 seconds...", "The easiest way to get this done..."],
                "topics": ["Quick tutorial on essential technique", "Step-by-step breakdown"],
                "key_points": ["Show the problem", "Reveal the solution", "Demonstrate results"]
            },
            "Pain Points": {
                "hooks": ["Are you still struggling with this?", "This is why you're stuck..."],
                "topics": ["Common problem and solution", "Why most people fail at this"],
                "key_points": ["Identify the pain", "Show empathy", "Hint at solution"]
            },
            "Social Proof": {
                "hooks": ["Here's what happened when...", "The results speak for themselves..."],
                "topics": ["Success story showcase", "Before and after transformation"],
                "key_points": ["Show the before", "Reveal the after", "Share the method"]
            },
            "Personality": {
                "hooks": ["POV: A day in my life...", "Something people don't know about me..."],
                "topics": ["Authentic moment share", "Behind the scenes look"],
                "key_points": ["Be authentic", "Share vulnerability", "Connect emotionally"]
            },
        }
        
        template = templates.get(pillar, {
            "hooks": ["Check this out..."],
            "topics": ["Valuable content"],
            "key_points": ["Deliver value", "Engage audience"]
        })
        
        return template["hooks"][0], template["topics"][0], template["key_points"]
    
    def _get_cta_text(self, primary_cta: str) -> str:
        """Get CTA text."""
        ctas = {
            "follow": "Follow for more tips like this!",
            "subscribe": "Subscribe to stay updated!",
            "waitlist": "Join the waitlist - link in bio!",
            "purchase": "Get yours now - link in bio!",
            "dm_keyword": "DM me 'INFO' to learn more!",
        }
        return ctas.get(primary_cta, "Follow for more!")
    
    def _generate_basic_script(self, brief: NarrativeVideoBrief) -> str:
        """Generate basic script without AI."""
        lines = [
            brief.hook,
            "",
            f"Today I want to share something about {brief.topic.lower()}.",
            ""
        ]
        
        for point in brief.key_points[:3]:
            lines.append(f"{point}.")
        
        lines.extend(["", brief.call_to_action])
        
        return "\n".join(lines)
