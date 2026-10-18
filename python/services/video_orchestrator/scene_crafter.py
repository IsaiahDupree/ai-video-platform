"""
Scene Crafter Service
=====================
Converts ClipPlanClips into provider-ready payloads.

The Scene Crafter role:
- Injects style/character bible rules into prompts
- Formats prompts for target provider
- Handles continuity constraints
- Builds final provider payloads

Prompt Construction:
1. Base visual intent prompt
2. + Style bible rules (lighting, color, mood)
3. + Character bible (appearance, personality)
4. + Continuity constraints (setting, props)
5. = Final baked prompt for provider
"""

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from uuid import UUID

from .models import (
    ClipPlanClip,
    VideoBible,
    BibleKind,
    ProviderName,
    NarrationMode,
)

from services.video_providers.base import (
    CreateClipInput,
    RemixClipInput,
    ProviderReference,
)

logger = logging.getLogger(__name__)


@dataclass
class StyleRules:
    """Extracted style rules from bible."""
    lighting: str = ""
    color_palette: List[str] = field(default_factory=list)
    mood: str = ""
    visual_style: str = ""
    camera_preferences: List[str] = field(default_factory=list)
    avoid: List[str] = field(default_factory=list)
    
    def to_prompt_fragment(self) -> str:
        """Convert to prompt text."""
        parts = []
        
        if self.lighting:
            parts.append(f"Lighting: {self.lighting}")
        if self.mood:
            parts.append(f"Mood: {self.mood}")
        if self.visual_style:
            parts.append(f"Style: {self.visual_style}")
        if self.color_palette:
            parts.append(f"Colors: {', '.join(self.color_palette[:3])}")
        if self.camera_preferences:
            parts.append(f"Camera: {self.camera_preferences[0]}")
        
        return ". ".join(parts)


@dataclass
class CharacterRules:
    """Extracted character rules from bible."""
    name: str = ""
    appearance: str = ""
    clothing: str = ""
    personality_traits: List[str] = field(default_factory=list)
    voice_description: str = ""
    reference_image_id: Optional[str] = None
    
    def to_prompt_fragment(self) -> str:
        """Convert to prompt text for character consistency."""
        parts = []
        
        if self.name and self.appearance:
            parts.append(f"Character {self.name}: {self.appearance}")
        elif self.appearance:
            parts.append(f"Character appearance: {self.appearance}")
        
        if self.clothing:
            parts.append(f"Wearing: {self.clothing}")
        
        if self.personality_traits:
            parts.append(f"Demeanor: {', '.join(self.personality_traits[:2])}")
        
        return ". ".join(parts)


@dataclass
class ContinuityRules:
    """Extracted continuity rules from bible."""
    setting: str = ""
    time_of_day: str = ""
    weather: str = ""
    key_props: List[str] = field(default_factory=list)
    transitions: str = ""
    
    def to_prompt_fragment(self) -> str:
        """Convert to prompt text for continuity."""
        parts = []
        
        if self.setting:
            parts.append(f"Setting: {self.setting}")
        if self.time_of_day:
            parts.append(f"Time: {self.time_of_day}")
        if self.weather:
            parts.append(f"Weather: {self.weather}")
        if self.key_props:
            parts.append(f"Include: {', '.join(self.key_props[:3])}")
        
        return ". ".join(parts)


class SceneCrafterService:
    """
    Scene Crafter service for building provider payloads.
    
    Takes ClipPlanClips and bibles, produces ready-to-send
    provider payloads with fully baked prompts.
    """
    
    def __init__(self, default_provider: ProviderName = ProviderName.SORA):
        self.default_provider = default_provider
    
    def _parse_style_bible(self, bible: Optional[VideoBible]) -> StyleRules:
        """Parse style bible into rules."""
        if not bible or bible.kind != BibleKind.STYLE:
            return StyleRules()
        
        body = bible.body or {}
        
        return StyleRules(
            lighting=body.get("lighting", ""),
            color_palette=body.get("color_palette", body.get("colors", [])),
            mood=body.get("mood", ""),
            visual_style=body.get("visual_style", body.get("style", "")),
            camera_preferences=body.get("camera_preferences", body.get("camera", [])),
            avoid=body.get("avoid", [])
        )
    
    def _parse_character_bible(self, bible: Optional[VideoBible]) -> CharacterRules:
        """Parse character bible into rules."""
        if not bible or bible.kind != BibleKind.CHARACTER:
            return CharacterRules()
        
        body = bible.body or {}
        
        return CharacterRules(
            name=body.get("name", ""),
            appearance=body.get("appearance", body.get("description", "")),
            clothing=body.get("clothing", body.get("outfit", "")),
            personality_traits=body.get("personality_traits", body.get("traits", [])),
            voice_description=body.get("voice_description", ""),
            reference_image_id=body.get("reference_image_id")
        )
    
    def _parse_continuity_bible(self, bible: Optional[VideoBible]) -> ContinuityRules:
        """Parse continuity bible into rules."""
        if not bible or bible.kind != BibleKind.CONTINUITY:
            return ContinuityRules()
        
        body = bible.body or {}
        
        return ContinuityRules(
            setting=body.get("setting", body.get("location", "")),
            time_of_day=body.get("time_of_day", body.get("time", "")),
            weather=body.get("weather", ""),
            key_props=body.get("key_props", body.get("props", [])),
            transitions=body.get("transitions", "")
        )
    
    def build_baked_prompt(
        self,
        clip: ClipPlanClip,
        style_bible: Optional[VideoBible] = None,
        character_bible: Optional[VideoBible] = None,
        continuity_bible: Optional[VideoBible] = None
    ) -> str:
        """
        Build a fully baked prompt by combining clip intent with bible rules.
        
        Structure:
        1. Visual intent prompt (what to show)
        2. Style rules (how it looks)
        3. Character rules (who's in it)
        4. Continuity rules (where/when)
        5. Must include/avoid constraints
        """
        parts = []
        
        # 1. Base visual intent
        base_prompt = clip.visual_intent.prompt
        if base_prompt:
            parts.append(base_prompt)
        
        # 2. Style rules
        style_rules = self._parse_style_bible(style_bible)
        style_fragment = style_rules.to_prompt_fragment()
        if style_fragment:
            parts.append(style_fragment)
        
        # 3. Character rules
        character_rules = self._parse_character_bible(character_bible)
        char_fragment = character_rules.to_prompt_fragment()
        if char_fragment:
            parts.append(char_fragment)
        
        # 4. Continuity rules
        continuity_rules = self._parse_continuity_bible(continuity_bible)
        cont_fragment = continuity_rules.to_prompt_fragment()
        if cont_fragment:
            parts.append(cont_fragment)
        
        # 5. Camera/setting from visual intent
        if clip.visual_intent.camera:
            parts.append(f"Shot type: {clip.visual_intent.camera}")
        if clip.visual_intent.setting:
            parts.append(f"Environment: {clip.visual_intent.setting}")
        
        # Combine into final prompt
        baked_prompt = ". ".join(parts)
        
        # Add must_include as explicit requirements
        if clip.visual_intent.must_include:
            requirements = ", ".join(clip.visual_intent.must_include[:5])
            baked_prompt += f". Must clearly show: {requirements}"
        
        # Add must_avoid
        avoid_list = clip.visual_intent.must_avoid + style_rules.avoid
        if avoid_list:
            avoid_str = ", ".join(avoid_list[:5])
            baked_prompt += f". Avoid: {avoid_str}"
        
        return baked_prompt.strip()
    
    def build_provider_payload(
        self,
        clip: ClipPlanClip,
        style_bible: Optional[VideoBible] = None,
        character_bible: Optional[VideoBible] = None,
        continuity_bible: Optional[VideoBible] = None,
        asset_urls: Optional[Dict[str, str]] = None
    ) -> CreateClipInput:
        """
        Build a complete provider payload for a clip.
        
        Args:
            clip: The ClipPlanClip to generate
            style_bible: Optional style rules
            character_bible: Optional character rules
            continuity_bible: Optional continuity rules
            asset_urls: Optional dict mapping asset IDs to URLs
        
        Returns:
            CreateClipInput ready for provider
        """
        # Build the baked prompt
        baked_prompt = self.build_baked_prompt(
            clip, style_bible, character_bible, continuity_bible
        )
        
        # Determine provider and settings
        provider = clip.provider_hints.primary_provider
        model = clip.provider_hints.model
        size = clip.provider_hints.size
        
        # Build references list
        references = []
        asset_urls = asset_urls or {}
        
        # Add character reference image if available
        character_rules = self._parse_character_bible(character_bible)
        if character_rules.reference_image_id:
            ref_url = asset_urls.get(character_rules.reference_image_id)
            if ref_url:
                references.append(ProviderReference(
                    type="image",
                    url=ref_url,
                    weight=0.8
                ))
        
        # Add explicit references from provider hints
        for ref in clip.provider_hints.references:
            ref_url = asset_urls.get(ref.asset_id) if hasattr(ref, 'asset_id') else None
            if ref_url:
                references.append(ProviderReference(
                    type=ref.type,
                    url=ref_url,
                    weight=ref.weight
                ))
        
        return CreateClipInput(
            clip_id=str(clip.id),
            prompt=baked_prompt,
            seconds=clip.target_seconds,
            model=model,
            size=size,
            seed=clip.provider_hints.seed,
            references=references,
            metadata={
                "scene_id": str(clip.scene_id),
                "clip_order": clip.clip_order,
                "narration_mode": clip.narration.mode.value if isinstance(clip.narration.mode, NarrationMode) else clip.narration.mode,
                "has_narration": bool(clip.narration.text)
            }
        )
    
    def build_remix_payload(
        self,
        clip: ClipPlanClip,
        source_generation_id: str,
        prompt_delta: str,
        new_seed: Optional[int] = None
    ) -> RemixClipInput:
        """
        Build a remix payload for retrying a clip with modifications.
        
        Args:
            clip: The original ClipPlanClip
            source_generation_id: ID of the generation to remix
            prompt_delta: Additional prompt instructions
            new_seed: Optional new seed value
        
        Returns:
            RemixClipInput for provider
        """
        return RemixClipInput(
            source_generation_id=source_generation_id,
            prompt_delta=prompt_delta,
            seconds=clip.target_seconds,
            seed=new_seed or clip.provider_hints.seed,
            metadata={
                "clip_id": str(clip.id),
                "original_prompt": clip.visual_intent.prompt[:100]
            }
        )
    
    def apply_prompt_patch(
        self,
        original_prompt: str,
        patch: str
    ) -> str:
        """
        Apply a prompt patch to modify the original prompt.
        
        Used for repair strategy: prompt_patch
        
        Args:
            original_prompt: The original baked prompt
            patch: Additional instructions to add
        
        Returns:
            Modified prompt
        """
        if not patch:
            return original_prompt
        
        # Check if patch is additive or replacement
        if patch.startswith("REPLACE:"):
            # Full replacement
            return patch[8:].strip()
        elif patch.startswith("PREPEND:"):
            # Add to beginning
            return f"{patch[8:].strip()}. {original_prompt}"
        else:
            # Default: append
            return f"{original_prompt}. Additional requirements: {patch}"
    
    def get_provider_size_for_aspect(
        self,
        aspect_ratio: str,
        provider: ProviderName = ProviderName.SORA
    ) -> str:
        """
        Get provider-specific size string for aspect ratio.
        
        Args:
            aspect_ratio: "16:9", "9:16", or "1:1"
            provider: Target provider
        
        Returns:
            Provider-specific size string
        """
        if provider == ProviderName.SORA:
            size_map = {
                "16:9": "1280x720",
                "9:16": "720x1280",
                "1:1": "1024x1024"  # Sora may not support this, fallback
            }
            return size_map.get(aspect_ratio, "1280x720")
        
        # Default sizes
        return "1280x720"
    
    def estimate_prompt_tokens(self, prompt: str) -> int:
        """
        Estimate token count for a prompt.
        
        Rough estimate: ~4 characters per token
        """
        return len(prompt) // 4
