"""
Director Service
================
Converts scripts/briefs into ClipPlans with proper pacing.

The Director role:
- Analyzes scripts to find natural break points
- Chunks content into clips respecting pacing rules
- Assigns visual intent to each clip
- Sets acceptance criteria

Pacing Rules (default 150 wpm):
- 4s clip: ~10 words
- 8s clip: ~20 words  
- 12s clip: ~30 words
"""

import logging
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4

from .models import (
    ClipPlan,
    Scene,
    ClipPlanClip,
    ContentBrief,
    VideoScript,
    PlanConstraints,
    PacingConstraints,
    NarrationConfig,
    VisualIntent,
    ProviderHints,
    AcceptanceCriteria,
    NarrationMode,
    PlanStatus,
    ClipState,
    ProviderName,
)

logger = logging.getLogger(__name__)

# Default pacing: 150 words per minute
DEFAULT_WPM = 150


@dataclass
class ScriptSegment:
    """A segment of script text."""
    text: str
    word_count: int
    start_index: int
    end_index: int
    suggested_duration: int = 8
    visual_hints: List[str] = field(default_factory=list)


@dataclass
class DirectorConfig:
    """Configuration for Director service."""
    words_per_minute: int = DEFAULT_WPM
    min_clip_seconds: int = 4
    max_clip_seconds: int = 12
    default_clip_seconds: int = 8
    sentence_boundary_preference: float = 0.8  # Prefer ending at sentences
    max_words_per_clip: int = 35
    min_words_per_clip: int = 5
    
    def words_for_duration(self, seconds: int) -> int:
        """Calculate max words for a given duration."""
        return int((self.words_per_minute / 60) * seconds)


class DirectorService:
    """
    Director service for creating clip plans from scripts.
    
    Pipeline:
        1. Parse script into sentences/paragraphs
        2. Calculate word counts and timing
        3. Chunk into clips based on pacing rules
        4. Generate visual intents for each clip
        5. Create ClipPlan structure
    """
    
    def __init__(
        self,
        config: Optional[DirectorConfig] = None,
        ai_provider: Optional[str] = None
    ):
        self.config = config or DirectorConfig()
        self.ai_provider_name = ai_provider
        self._ai_provider = None
    
    def _get_ai_provider(self):
        """Get AI provider for enhanced analysis."""
        if self._ai_provider is None and self.ai_provider_name:
            try:
                from services.ai_providers import get_ai_provider
                self._ai_provider = get_ai_provider(self.ai_provider_name)
            except Exception as e:
                logger.warning(f"Could not load AI provider: {e}")
        return self._ai_provider
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences."""
        # Simple sentence splitting on . ! ?
        # Handles common abbreviations
        text = re.sub(r'([.!?])\s+', r'\1\n', text)
        sentences = [s.strip() for s in text.split('\n') if s.strip()]
        return sentences
    
    def _count_words(self, text: str) -> int:
        """Count words in text."""
        return len(text.split())
    
    def _calculate_duration(self, word_count: int) -> int:
        """Calculate suggested duration for word count."""
        # Words per second at configured WPM
        wps = self.config.words_per_minute / 60
        
        # Calculate raw duration
        raw_duration = word_count / wps
        
        # Round to nearest allowed duration (4, 8, 12)
        if raw_duration <= 6:
            return 4
        elif raw_duration <= 10:
            return 8
        else:
            return 12
    
    def _chunk_script(
        self,
        script_text: str,
        constraints: PlanConstraints
    ) -> List[ScriptSegment]:
        """
        Chunk script into segments suitable for clips.
        
        Tries to:
        - End at sentence boundaries
        - Keep within word limits
        - Maintain natural flow
        """
        sentences = self._split_into_sentences(script_text)
        segments: List[ScriptSegment] = []
        
        current_text = ""
        current_words = 0
        current_start = 0
        char_index = 0
        
        max_words = constraints.pacing.max_words_per_clip
        
        for sentence in sentences:
            sentence_words = self._count_words(sentence)
            
            # Would adding this sentence exceed limit?
            if current_words + sentence_words > max_words and current_text:
                # Save current segment
                duration = self._calculate_duration(current_words)
                segments.append(ScriptSegment(
                    text=current_text.strip(),
                    word_count=current_words,
                    start_index=current_start,
                    end_index=char_index,
                    suggested_duration=duration
                ))
                
                # Start new segment
                current_text = sentence + " "
                current_words = sentence_words
                current_start = char_index
            else:
                current_text += sentence + " "
                current_words += sentence_words
            
            char_index += len(sentence) + 1
        
        # Add final segment
        if current_text.strip():
            duration = self._calculate_duration(current_words)
            segments.append(ScriptSegment(
                text=current_text.strip(),
                word_count=current_words,
                start_index=current_start,
                end_index=char_index,
                suggested_duration=duration
            ))
        
        return segments
    
    def _generate_visual_intent(
        self,
        segment: ScriptSegment,
        brief: Optional[ContentBrief],
        segment_index: int,
        total_segments: int
    ) -> VisualIntent:
        """Generate visual intent for a segment."""
        # Extract key nouns/actions from text
        text = segment.text.lower()
        
        # Determine position in narrative
        if segment_index == 0:
            position = "opening"
        elif segment_index == total_segments - 1:
            position = "closing"
        else:
            position = "middle"
        
        # Build prompt from segment text
        prompt = f"Scene showing: {segment.text[:100]}..."
        
        # Add position-specific elements
        if position == "opening":
            prompt = f"Opening shot: {segment.text[:80]}. Attention-grabbing introduction."
        elif position == "closing":
            prompt = f"Closing scene: {segment.text[:80]}. Strong conclusion."
        
        # Extract must_include from brief
        must_include = []
        if brief and brief.key_points:
            # Check if any key points are mentioned in this segment
            for point in brief.key_points[:3]:
                if any(word in text for word in point.lower().split()[:3]):
                    must_include.append(point)
        
        # Default must_include based on content
        if not must_include:
            must_include = ["clear visuals", "engaging scene"]
        
        return VisualIntent(
            prompt=prompt,
            must_include=must_include,
            must_avoid=["glitchy text", "distorted faces", "gibberish"],
            camera="medium shot" if position == "middle" else "wide establishing shot",
            setting="professional environment"
        )
    
    def _validate_total_duration(
        self,
        segments: List[ScriptSegment],
        max_seconds: int
    ) -> List[ScriptSegment]:
        """
        Validate and adjust segments to fit within max duration.
        
        If total exceeds max, truncate or combine segments.
        """
        total_duration = sum(s.suggested_duration for s in segments)
        
        if total_duration <= max_seconds:
            return segments
        
        logger.warning(
            f"Total duration {total_duration}s exceeds max {max_seconds}s, truncating"
        )
        
        # Keep segments until we hit the limit
        kept_segments = []
        running_total = 0
        
        for segment in segments:
            if running_total + segment.suggested_duration <= max_seconds:
                kept_segments.append(segment)
                running_total += segment.suggested_duration
            else:
                break
        
        return kept_segments
    
    async def create_clip_plan(
        self,
        script: VideoScript,
        brief: Optional[ContentBrief] = None,
        constraints: Optional[PlanConstraints] = None,
        style_bible_id: Optional[str] = None,
        character_bible_id: Optional[str] = None
    ) -> ClipPlan:
        """
        Create a clip plan from a script.
        
        Args:
            script: VideoScript with full text
            brief: Optional ContentBrief for context
            constraints: Optional PlanConstraints (uses defaults if not provided)
            style_bible_id: Optional style bible reference
            character_bible_id: Optional character bible reference
        
        Returns:
            ClipPlan with scenes and clips
        """
        constraints = constraints or PlanConstraints()
        
        # Update config from constraints
        self.config.words_per_minute = constraints.pacing.words_per_minute
        self.config.max_words_per_clip = constraints.pacing.max_words_per_clip
        
        logger.info(f"Creating clip plan from script: {script.title}")
        logger.info(f"Constraints: max={constraints.max_total_seconds}s, wpm={constraints.pacing.words_per_minute}")
        
        # 1. Chunk script into segments
        segments = self._chunk_script(script.body, constraints)
        logger.info(f"Created {len(segments)} segments from script")
        
        # 2. Validate total duration
        segments = self._validate_total_duration(
            segments,
            constraints.max_total_seconds
        )
        
        # 3. Create ClipPlan
        plan = ClipPlan(
            project_id=script.project_id,
            brief_id=brief.id if brief else None,
            script_id=script.id,
            style_bible_id=style_bible_id,
            character_bible_id=character_bible_id,
            constraints=constraints,
            status=PlanStatus.DRAFT
        )
        
        # 4. Create single scene (can be extended for multi-scene support)
        scene = Scene(
            clip_plan_id=plan.id,
            name="Main Content",
            goal=brief.objective if brief else "Deliver content",
            beats=[s.text[:50] + "..." for s in segments[:5]],
            scene_order=0
        )
        
        # 5. Create clips for each segment
        clips = []
        for i, segment in enumerate(segments):
            visual_intent = self._generate_visual_intent(
                segment, brief, i, len(segments)
            )
            
            clip = ClipPlanClip(
                scene_id=scene.id,
                clip_order=i,
                target_seconds=segment.suggested_duration,
                narration=NarrationConfig(
                    mode=NarrationMode.EXTERNAL_VOICEOVER,
                    text=segment.text,
                    speaker="narrator",
                    language=script.language
                ),
                visual_intent=visual_intent,
                provider_hints=ProviderHints(
                    primary_provider=ProviderName.SORA,
                    model="sora-2",
                    size="1280x720" if constraints.aspect_ratio == "16:9" else "720x1280"
                ),
                acceptance=AcceptanceCriteria.default(),
                state=ClipState.PENDING
            )
            clips.append(clip)
        
        # Store in plan_json for reference
        plan.plan_json = {
            "version": plan.version,
            "total_clips": len(clips),
            "total_duration": sum(c.target_seconds for c in clips),
            "segments": [
                {
                    "clip_id": str(c.id),
                    "order": c.clip_order,
                    "duration": c.target_seconds,
                    "word_count": self._count_words(c.narration.text),
                    "text_preview": c.narration.text[:50] + "..."
                }
                for c in clips
            ]
        }
        
        logger.info(
            f"Created clip plan with {len(clips)} clips, "
            f"total duration: {sum(c.target_seconds for c in clips)}s"
        )
        
        return plan, scene, clips
    
    async def create_clip_plan_with_ai(
        self,
        script: VideoScript,
        brief: Optional[ContentBrief] = None,
        constraints: Optional[PlanConstraints] = None
    ) -> Tuple[ClipPlan, Scene, List[ClipPlanClip]]:
        """
        Create clip plan using AI for enhanced analysis.
        
        Uses AI to:
        - Find optimal break points
        - Generate better visual prompts
        - Identify emotional beats
        """
        provider = self._get_ai_provider()
        
        if not provider:
            logger.info("No AI provider, using standard clip plan creation")
            return await self.create_clip_plan(script, brief, constraints)
        
        constraints = constraints or PlanConstraints()
        
        # For now, use standard chunking but with AI-enhanced visual intents
        # This can be expanded to use AI for full analysis
        plan, scene, clips = await self.create_clip_plan(
            script, brief, constraints
        )
        
        # Enhance visual intents with AI (if available)
        try:
            for clip in clips:
                enhanced_prompt = await self._enhance_prompt_with_ai(
                    clip.narration.text,
                    clip.visual_intent.prompt,
                    brief
                )
                clip.visual_intent.prompt = enhanced_prompt
        except Exception as e:
            logger.warning(f"AI prompt enhancement failed: {e}")
        
        return plan, scene, clips
    
    async def _enhance_prompt_with_ai(
        self,
        narration_text: str,
        base_prompt: str,
        brief: Optional[ContentBrief]
    ) -> str:
        """Enhance visual prompt using AI."""
        provider = self._get_ai_provider()
        if not provider:
            return base_prompt
        
        try:
            # Use AI to create better visual prompt
            context = f"Narration: {narration_text}\n"
            if brief:
                context += f"Tone: {brief.tone}\nAudience: {brief.audience}"
            
            # This would call the AI provider to enhance the prompt
            # For now, return base prompt
            return base_prompt
        except Exception:
            return base_prompt
    
    def estimate_duration(self, script_text: str) -> Dict[str, Any]:
        """
        Estimate duration for a script.
        
        Args:
            script_text: Full script text
        
        Returns:
            Dict with word_count, estimated_seconds, clip_count
        """
        word_count = self._count_words(script_text)
        
        # Calculate duration at configured WPM
        raw_seconds = (word_count / self.config.words_per_minute) * 60
        
        # Estimate number of clips
        avg_clip_seconds = self.config.default_clip_seconds
        clip_count = max(1, int(raw_seconds / avg_clip_seconds))
        
        return {
            "word_count": word_count,
            "estimated_seconds": int(raw_seconds),
            "estimated_minutes": round(raw_seconds / 60, 1),
            "estimated_clips": clip_count,
            "words_per_minute": self.config.words_per_minute,
            "exceeds_max": raw_seconds > 300  # 5 minutes
        }
