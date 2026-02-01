"""
Voice Engine

Handles narration generation with TTS, speech budgeting,
and voice mode management (external narrator vs Sora dialogue).
"""

import os
import re
from typing import Optional, Literal
from pydantic import BaseModel, Field
from loguru import logger


VoiceMode = Literal["EXTERNAL_NARRATOR", "SORA_DIALOGUE", "HYBRID"]
Perspective = Literal["first_person", "second_person", "third_person"]


class NarratorConfig(BaseModel):
    """Configuration for external TTS narrator."""
    provider: Literal["openai", "elevenlabs", "huggingface"] = "openai"
    model_id: str = Field(default="tts-1", alias="modelId")
    voice: str = "alloy"
    perspective: Perspective = "third_person"
    speed: float = 1.0
    
    class Config:
        populate_by_name = True


class VoiceStrategy(BaseModel):
    """Voice strategy for a format."""
    mode: VoiceMode = "EXTERNAL_NARRATOR"
    narrator: Optional[NarratorConfig] = None
    max_utilization: float = Field(default=0.78, alias="maxUtilization")
    max_dialogue_clip_seconds: float = Field(default=6.0, alias="maxDialogueClipSeconds")
    
    class Config:
        populate_by_name = True


class BeatSpeechBudget(BaseModel):
    """Speech budget for a single beat."""
    beat_id: str = Field(alias="beatId")
    narration: str
    word_count: int = Field(alias="wordCount")
    speech_seconds: float = Field(alias="speechSeconds")
    clip_seconds: float = Field(alias="clipSeconds")
    utilization: float
    suggestion: Optional[str] = None
    
    class Config:
        populate_by_name = True


class SpeechBudgetResult(BaseModel):
    """Result of speech budget planning."""
    beats: list[BeatSpeechBudget]
    total_speech_seconds: float = Field(alias="totalSpeechSeconds")
    total_clip_seconds: float = Field(alias="totalClipSeconds")
    overall_utilization: float = Field(alias="overallUtilization")
    warnings: list[str] = Field(default_factory=list)
    
    class Config:
        populate_by_name = True


class VoiceBuildResult(BaseModel):
    """Result from voice engine build."""
    audio_plan: Optional[dict] = Field(None, alias="audioPlan")
    mute_sora_beat_ids: list[str] = Field(default_factory=list, alias="muteSoraBeatIds")
    forbid_talking_beat_ids: list[str] = Field(default_factory=list, alias="forbidTalkingBeatIds")
    adjusted_durations: dict[str, float] = Field(default_factory=dict, alias="adjustedDurations")
    
    class Config:
        populate_by_name = True


# Words per minute estimates by provider/style
WPM_ESTIMATES = {
    "openai": 155,
    "elevenlabs": 145,
    "huggingface": 150,
    "default": 150,
}


def count_words(text: str) -> int:
    """Count words in text."""
    return len(text.split())


def estimate_speech_duration(
    text: str,
    wpm: int = 150,
) -> float:
    """
    Estimate speech duration for text.
    
    Args:
        text: Text to speak
        wpm: Words per minute
        
    Returns:
        Duration in seconds
    """
    word_count = count_words(text)
    return (word_count / wpm) * 60


def has_first_person(text: str) -> bool:
    """Check if text contains first-person pronouns."""
    patterns = [
        r"\bI\b", r"\bI'm\b", r"\bI've\b", r"\bI'll\b",
        r"\bme\b", r"\bmy\b", r"\bmine\b", r"\bmyself\b",
        r"\bwe\b", r"\bwe're\b", r"\bwe've\b", r"\bwe'll\b",
        r"\bus\b", r"\bour\b", r"\bours\b", r"\bourselves\b",
    ]
    for p in patterns:
        if re.search(p, text, re.IGNORECASE):
            return True
    return False


def has_second_person(text: str) -> bool:
    """Check if text contains second-person pronouns."""
    patterns = [
        r"\byou\b", r"\byou're\b", r"\byou've\b", r"\byou'll\b",
        r"\byour\b", r"\byours\b", r"\byourself\b", r"\byourselves\b",
    ]
    for p in patterns:
        if re.search(p, text, re.IGNORECASE):
            return True
    return False


def rewrite_to_third_person(text: str) -> str:
    """
    Rewrite text from first/second person to third person.
    
    This is a simple rule-based conversion.
    
    Args:
        text: Original text
        
    Returns:
        Third-person version
    """
    replacements = [
        (r"\bI\b", "they"),
        (r"\bI'm\b", "they're"),
        (r"\bI've\b", "they've"),
        (r"\bI'll\b", "they'll"),
        (r"\bme\b", "them"),
        (r"\bmy\b", "their"),
        (r"\bmine\b", "theirs"),
        (r"\bmyself\b", "themselves"),
        (r"\bwe\b", "they"),
        (r"\bwe're\b", "they're"),
        (r"\bwe've\b", "they've"),
        (r"\bwe'll\b", "they'll"),
        (r"\bus\b", "them"),
        (r"\bour\b", "their"),
        (r"\bours\b", "theirs"),
        (r"\bourselves\b", "themselves"),
        (r"\byou\b", "one"),
        (r"\byou're\b", "one is"),
        (r"\byou've\b", "one has"),
        (r"\byou'll\b", "one will"),
        (r"\byour\b", "one's"),
        (r"\byours\b", "one's"),
        (r"\byourself\b", "oneself"),
    ]
    
    result = text
    for pattern, replacement in replacements:
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
    
    return result


def enforce_perspective(
    text: str,
    target: Perspective,
    mode: Literal["SOFT_REWRITE", "STRICT"] = "SOFT_REWRITE",
) -> str:
    """
    Enforce a perspective on text.
    
    Args:
        text: Original text
        target: Target perspective
        mode: SOFT_REWRITE to convert, STRICT to raise error
        
    Returns:
        Converted text
        
    Raises:
        ValueError: In STRICT mode if perspective violation found
    """
    if target == "third_person":
        if has_first_person(text) or has_second_person(text):
            if mode == "STRICT":
                raise ValueError(f"Perspective violation: text contains first/second person")
            return rewrite_to_third_person(text)
    
    return text


def plan_speech_budget(
    beats: list[dict],
    voice_mode: VoiceMode,
    wpm: int = 150,
    narrator_max_util: float = 0.78,
    dialogue_max_util: float = 0.62,
) -> SpeechBudgetResult:
    """
    Plan speech budget for all beats.
    
    Ensures narration fits within clip durations.
    
    Args:
        beats: List of beat dicts with 'id', 'narration', 'duration_s'
        voice_mode: Voice mode
        wpm: Words per minute
        narrator_max_util: Max utilization for narrator mode
        dialogue_max_util: Max utilization for dialogue mode
        
    Returns:
        SpeechBudgetResult with per-beat analysis
    """
    results: list[BeatSpeechBudget] = []
    warnings: list[str] = []
    total_speech = 0.0
    total_clip = 0.0
    
    for beat in beats:
        beat_id = beat.get("id", "unknown")
        narration = beat.get("narration", "")
        clip_seconds = beat.get("duration_s", 5.0)
        
        word_count = count_words(narration)
        speech_seconds = estimate_speech_duration(narration, wpm)
        
        # Determine max utilization based on mode
        if voice_mode == "EXTERNAL_NARRATOR":
            max_util = narrator_max_util
        elif voice_mode == "SORA_DIALOGUE":
            max_util = dialogue_max_util
        else:  # HYBRID
            # For hybrid, use narrator util for most, dialogue for short beats
            max_util = narrator_max_util if clip_seconds > 4 else dialogue_max_util
        
        utilization = speech_seconds / clip_seconds if clip_seconds > 0 else 0
        
        # Generate suggestion if over budget
        suggestion = None
        if utilization > max_util:
            required_clip = speech_seconds / max_util
            if required_clip - clip_seconds < 2:
                suggestion = f"EXTEND_BEAT by {required_clip - clip_seconds:.1f}s"
            elif word_count > 30:
                suggestion = "SPLIT_BEAT into two"
            else:
                suggestion = "SHORTEN_NARRATION"
            
            warnings.append(
                f"Beat {beat_id}: utilization {utilization:.0%} exceeds max {max_util:.0%}"
            )
        
        results.append(BeatSpeechBudget(
            beat_id=beat_id,
            narration=narration,
            word_count=word_count,
            speech_seconds=speech_seconds,
            clip_seconds=clip_seconds,
            utilization=utilization,
            suggestion=suggestion,
        ))
        
        total_speech += speech_seconds
        total_clip += clip_seconds
    
    return SpeechBudgetResult(
        beats=results,
        total_speech_seconds=total_speech,
        total_clip_seconds=total_clip,
        overall_utilization=total_speech / total_clip if total_clip > 0 else 0,
        warnings=warnings,
    )


def build_voice_policy(
    beats: list[dict],
    strategy: VoiceStrategy,
) -> VoiceBuildResult:
    """
    Build voice policy determining which beats get muted Sora audio
    and which forbid on-screen talking.
    
    Args:
        beats: List of beat dicts
        strategy: Voice strategy
        
    Returns:
        VoiceBuildResult with policies
    """
    mute_sora: list[str] = []
    forbid_talking: list[str] = []
    adjusted_durations: dict[str, float] = {}
    
    if strategy.mode == "EXTERNAL_NARRATOR":
        # All Sora beats should be muted and have no talking
        for beat in beats:
            mute_sora.append(beat["id"])
            forbid_talking.append(beat["id"])
    
    elif strategy.mode == "SORA_DIALOGUE":
        # Keep Sora audio, allow talking
        pass
    
    elif strategy.mode == "HYBRID":
        # Complex: check beat type or duration
        for beat in beats:
            beat_type = beat.get("type", "")
            duration = beat.get("duration_s", 5.0)
            
            # Short beats or specific types get dialogue
            if duration <= strategy.max_dialogue_clip_seconds and beat_type in ["HOOK", "PROOF"]:
                pass  # Allow dialogue
            else:
                mute_sora.append(beat["id"])
                forbid_talking.append(beat["id"])
    
    return VoiceBuildResult(
        mute_sora_beat_ids=mute_sora,
        forbid_talking_beat_ids=forbid_talking,
        adjusted_durations=adjusted_durations,
    )


async def generate_tts_audio(
    text: str,
    config: NarratorConfig,
    output_path: str,
) -> str:
    """
    Generate TTS audio using configured provider.
    
    Args:
        text: Text to speak
        config: Narrator configuration
        output_path: Path to save audio file
        
    Returns:
        Path to generated audio file
    """
    import openai
    
    if config.provider == "openai":
        client = openai.AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        
        response = await client.audio.speech.create(
            model=config.model_id,
            voice=config.voice,
            input=text,
            speed=config.speed,
        )
        
        response.stream_to_file(output_path)
        logger.info(f"Generated TTS audio: {output_path}")
        return output_path
    
    elif config.provider == "elevenlabs":
        # Placeholder for ElevenLabs integration
        raise NotImplementedError("ElevenLabs TTS not yet implemented")
    
    elif config.provider == "huggingface":
        # Placeholder for HuggingFace integration
        raise NotImplementedError("HuggingFace TTS not yet implemented")
    
    else:
        raise ValueError(f"Unknown TTS provider: {config.provider}")


async def build_narration_audio(
    beats: list[dict],
    config: NarratorConfig,
    output_dir: str,
    enforce_third_person: bool = True,
) -> dict:
    """
    Build narration audio files for all beats.
    
    Args:
        beats: List of beat dicts
        config: Narrator configuration
        output_dir: Directory to save audio files
        enforce_third_person: Whether to enforce third-person perspective
        
    Returns:
        Dict mapping beat_id to audio path
    """
    import os
    from pathlib import Path
    
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    audio_paths = {}
    
    for beat in beats:
        beat_id = beat.get("id", "unknown")
        narration = beat.get("narration", "")
        
        if not narration.strip():
            continue
        
        # Enforce perspective if needed
        if enforce_third_person and config.perspective == "third_person":
            narration = enforce_perspective(narration, "third_person", "SOFT_REWRITE")
        
        # Generate audio
        output_path = os.path.join(output_dir, f"{beat_id}.mp3")
        await generate_tts_audio(narration, config, output_path)
        
        audio_paths[beat_id] = output_path
    
    return audio_paths
