"""
Voice Strategy System

Manages voice mode selection between:
- EXTERNAL_NARRATOR: HF TTS with 3rd person narration
- SORA_DIALOGUE: Sora generates speaking visuals
- HYBRID: Mix of both
"""

from typing import Optional, Literal
from pydantic import BaseModel, Field


VoiceMode = Literal["EXTERNAL_NARRATOR", "SORA_DIALOGUE", "HYBRID"]


class NarratorConfig(BaseModel):
    """Configuration for external narrator."""
    provider: Literal["huggingface", "openai", "elevenlabs"] = "huggingface"
    model_id: str = Field(alias="modelId")
    perspective: Literal["third_person", "first_person"] = "third_person"
    style_tags: list[str] = Field(default_factory=lambda: ["confident", "clear"], alias="styleTags")
    voice_preset: Optional[str] = Field(None, alias="voicePreset")
    
    class Config:
        populate_by_name = True


class SoraDialogueConfig(BaseModel):
    """Configuration for Sora dialogue beats."""
    allow_beat_types: list[str] = Field(default_factory=lambda: ["HOOK", "PROOF"], alias="allowBeatTypes")
    max_seconds_per_beat: int = Field(default=5, alias="maxSecondsPerBeat")
    keep_sora_audio: bool = Field(default=True, alias="keepSoraAudio")
    
    class Config:
        populate_by_name = True


class VoiceConstraints(BaseModel):
    """Constraints for voice-aware rendering."""
    forbid_on_screen_talking_when_narrated: bool = Field(default=True, alias="forbidOnScreenTalkingWhenNarrated")
    ambience_only_when_narrated: bool = Field(default=True, alias="ambienceOnlyWhenNarrated")
    duck_sora_ambience_when_narrated: bool = Field(default=True, alias="duckSoraAmbienceWhenNarrated")
    
    class Config:
        populate_by_name = True


class VoiceStrategy(BaseModel):
    """Complete voice strategy for a format."""
    mode: VoiceMode
    narrator: Optional[NarratorConfig] = None
    sora_dialogue: Optional[SoraDialogueConfig] = Field(None, alias="soraDialogue")
    constraints: VoiceConstraints = Field(default_factory=VoiceConstraints)
    
    class Config:
        populate_by_name = True


# Default strategies for common formats

DEFAULT_NARRATOR_STRATEGY = VoiceStrategy(
    mode="EXTERNAL_NARRATOR",
    narrator=NarratorConfig(
        provider="huggingface",
        model_id="facebook/mms-tts-eng",
        perspective="third_person",
        style_tags=["confident", "clear"],
    ),
    constraints=VoiceConstraints(
        forbid_on_screen_talking_when_narrated=True,
        ambience_only_when_narrated=True,
        duck_sora_ambience_when_narrated=True,
    ),
)

DEFAULT_SORA_DIALOGUE_STRATEGY = VoiceStrategy(
    mode="SORA_DIALOGUE",
    sora_dialogue=SoraDialogueConfig(
        allow_beat_types=["HOOK", "PROOF", "CTA"],
        max_seconds_per_beat=5,
        keep_sora_audio=True,
    ),
    constraints=VoiceConstraints(
        forbid_on_screen_talking_when_narrated=False,
        ambience_only_when_narrated=False,
        duck_sora_ambience_when_narrated=False,
    ),
)

DEFAULT_HYBRID_STRATEGY = VoiceStrategy(
    mode="HYBRID",
    narrator=NarratorConfig(
        provider="huggingface",
        model_id="facebook/mms-tts-eng",
        perspective="third_person",
        style_tags=["confident", "clear"],
    ),
    sora_dialogue=SoraDialogueConfig(
        allow_beat_types=["HOOK"],
        max_seconds_per_beat=3,
        keep_sora_audio=True,
    ),
    constraints=VoiceConstraints(
        forbid_on_screen_talking_when_narrated=True,
        ambience_only_when_narrated=True,
        duck_sora_ambience_when_narrated=True,
    ),
)


class DiscernmentInputs(BaseModel):
    """Inputs for voice strategy selection."""
    format_family: Literal["explainer", "devlog", "skit", "cinematic"] = Field(alias="formatFamily")
    brief_tone: Literal["educational", "story", "comedy", "sales"] = Field(alias="briefTone")
    needs_consistency: bool = Field(default=True, alias="needsConsistency")
    tolerates_lip_sync_risk: bool = Field(default=False, alias="toleratesLipSyncRisk")
    
    class Config:
        populate_by_name = True


def choose_voice_strategy(inputs: DiscernmentInputs) -> VoiceStrategy:
    """
    Choose voice strategy based on format and requirements.
    
    Args:
        inputs: Discernment inputs
        
    Returns:
        VoiceStrategy
    """
    # Most scalable: external narrator
    if inputs.needs_consistency and not inputs.tolerates_lip_sync_risk:
        return DEFAULT_NARRATOR_STRATEGY
    
    # Skits/cinematic with dialogue
    if inputs.format_family in ("skit", "cinematic") and inputs.tolerates_lip_sync_risk:
        return DEFAULT_SORA_DIALOGUE_STRATEGY
    
    # Hybrid fallback
    return DEFAULT_HYBRID_STRATEGY


def get_voice_strategy_for_format(format_family: str) -> VoiceStrategy:
    """
    Get default voice strategy for a format family.
    
    Args:
        format_family: Format family name
        
    Returns:
        VoiceStrategy
    """
    format_defaults = {
        "explainer": DEFAULT_NARRATOR_STRATEGY,
        "devlog": DEFAULT_NARRATOR_STRATEGY,
        "listicle": DEFAULT_NARRATOR_STRATEGY,
        "skit": DEFAULT_SORA_DIALOGUE_STRATEGY,
        "cinematic": DEFAULT_HYBRID_STRATEGY,
        "tutorial": DEFAULT_NARRATOR_STRATEGY,
    }
    
    return format_defaults.get(format_family, DEFAULT_NARRATOR_STRATEGY)


class BeatVoiceFlags(BaseModel):
    """Voice flags for a specific beat."""
    mute_original_audio: bool = Field(alias="muteOriginalAudio")
    forbid_talking: bool = Field(alias="forbidTalking")
    use_narrator: bool = Field(alias="useNarrator")
    use_sora_dialogue: bool = Field(alias="useSoraDialogue")
    
    class Config:
        populate_by_name = True


def get_beat_voice_flags(
    strategy: VoiceStrategy,
    beat_type: str,
) -> BeatVoiceFlags:
    """
    Get voice flags for a specific beat.
    
    Args:
        strategy: Voice strategy
        beat_type: Beat type (HOOK, STEP, CTA, etc.)
        
    Returns:
        BeatVoiceFlags
    """
    if strategy.mode == "EXTERNAL_NARRATOR":
        return BeatVoiceFlags(
            mute_original_audio=True,
            forbid_talking=strategy.constraints.forbid_on_screen_talking_when_narrated,
            use_narrator=True,
            use_sora_dialogue=False,
        )
    
    if strategy.mode == "SORA_DIALOGUE":
        return BeatVoiceFlags(
            mute_original_audio=False,
            forbid_talking=False,
            use_narrator=False,
            use_sora_dialogue=True,
        )
    
    # HYBRID mode
    allow_dialogue = (
        strategy.sora_dialogue and
        beat_type in strategy.sora_dialogue.allow_beat_types
    )
    
    return BeatVoiceFlags(
        mute_original_audio=not allow_dialogue or not strategy.sora_dialogue.keep_sora_audio,
        forbid_talking=not allow_dialogue,
        use_narrator=not allow_dialogue,
        use_sora_dialogue=allow_dialogue,
    )


def get_sora_prompt_modifiers(flags: BeatVoiceFlags) -> list[str]:
    """
    Get Sora prompt modifiers based on voice flags.
    
    Args:
        flags: Beat voice flags
        
    Returns:
        List of prompt modifier strings
    """
    modifiers = []
    
    if flags.forbid_talking:
        modifiers.extend([
            "no visible speaking",
            "no lip movement",
            "mouth closed or subtle neutral expression",
            "no dialogue text on screen",
            "character gestures only (nods, points, reacts)",
        ])
    
    if flags.mute_original_audio:
        modifiers.extend([
            "no speech audio",
            "ambient room tone only",
        ])
    
    return modifiers


def get_sora_negative_tokens(flags: BeatVoiceFlags) -> list[str]:
    """
    Get Sora negative tokens based on voice flags.
    
    Args:
        flags: Beat voice flags
        
    Returns:
        List of negative prompt tokens
    """
    negatives = []
    
    if flags.forbid_talking:
        negatives.extend([
            "talking",
            "speaking",
            "mouth open",
            "lip sync",
            "dialogue",
        ])
    
    return negatives


def apply_voice_strategy_to_shot_plan(
    shot_plan: dict,
    strategy: VoiceStrategy,
) -> dict:
    """
    Apply voice strategy to a shot plan.
    
    Args:
        shot_plan: Shot plan dict
        strategy: Voice strategy
        
    Returns:
        Updated shot plan
    """
    shots = shot_plan.get("shots", [])
    updated_shots = []
    
    for shot in shots:
        beat_type = shot.get("beatType") or shot.get("beat_type", "STEP")
        flags = get_beat_voice_flags(strategy, beat_type)
        
        updated_shot = dict(shot)
        updated_shot["voiceFlags"] = flags.model_dump(by_alias=True)
        
        # Add prompt modifiers
        extra_tokens = get_sora_prompt_modifiers(flags)
        if extra_tokens:
            existing = updated_shot.get("extraPromptTokens", [])
            updated_shot["extraPromptTokens"] = existing + extra_tokens
        
        # Add negative tokens
        negative_tokens = get_sora_negative_tokens(flags)
        if negative_tokens:
            existing = updated_shot.get("negativeTokens", [])
            updated_shot["negativeTokens"] = existing + negative_tokens
        
        # Set audio muting
        updated_shot["muteOriginalAudio"] = flags.mute_original_audio
        
        updated_shots.append(updated_shot)
    
    return {
        **shot_plan,
        "shots": updated_shots,
        "voiceStrategy": strategy.model_dump(by_alias=True),
    }
