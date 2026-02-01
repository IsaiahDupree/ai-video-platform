"""
Perspective Enforcer

Enforces 3rd person perspective in narration text.
Supports STRICT mode (warn only) or SOFT_REWRITE mode (auto-convert).
"""

import re
from typing import Literal, Optional
from pydantic import BaseModel, Field


NarrationPerspective = Literal["third_person", "first_person", "second_person"]
EnforceMode = Literal["STRICT", "SOFT_REWRITE"]


class VoiceVars(BaseModel):
    """Runtime voice configuration variables."""
    use_third_person_tts: bool = Field(default=True, alias="useThirdPersonTTS")
    perspective: NarrationPerspective = "third_person"
    enforce_perspective: EnforceMode = Field(default="SOFT_REWRITE", alias="enforcePerspective")
    
    # TTS config
    tts_provider: str = Field(default="huggingface", alias="ttsProvider")
    tts_model_id: str = Field(default="facebook/mms-tts-eng", alias="ttsModelId")
    voice_preset: Optional[str] = Field(None, alias="voicePreset")
    style_tags: list[str] = Field(default_factory=lambda: ["confident", "clear"], alias="styleTags")
    
    # Subject for 3rd person (default: "He", can be "She", "They", "The narrator", etc.)
    third_person_subject: str = Field(default="He", alias="thirdPersonSubject")
    
    class Config:
        populate_by_name = True


DEFAULT_VOICE_VARS = VoiceVars()


class PerspectiveResult(BaseModel):
    """Result of perspective enforcement."""
    text: str
    changed: bool
    warnings: list[str]


# Patterns for detecting first/second person
FIRST_PERSON_PATTERNS = [
    r"\bI\b",
    r"\bI'm\b",
    r"\bI've\b",
    r"\bI'll\b",
    r"\bI'd\b",
    r"\bme\b",
    r"\bmy\b",
    r"\bmine\b",
    r"\bmyself\b",
    r"\bwe\b",
    r"\bwe're\b",
    r"\bwe've\b",
    r"\bwe'll\b",
    r"\bus\b",
    r"\bour\b",
    r"\bours\b",
    r"\bourselves\b",
]

SECOND_PERSON_PATTERNS = [
    r"\byou\b",
    r"\byou're\b",
    r"\byou've\b",
    r"\byou'll\b",
    r"\byou'd\b",
    r"\byour\b",
    r"\byours\b",
    r"\byourself\b",
]


def has_first_person(text: str) -> bool:
    """Check if text contains first person pronouns."""
    return any(re.search(p, text, re.IGNORECASE) for p in FIRST_PERSON_PATTERNS)


def has_second_person(text: str) -> bool:
    """Check if text contains second person pronouns."""
    return any(re.search(p, text, re.IGNORECASE) for p in SECOND_PERSON_PATTERNS)


def rewrite_to_third_person(text: str, subject: str = "He") -> str:
    """
    Rewrite text to third person perspective.
    
    Args:
        text: Text to rewrite
        subject: Third person subject (He, She, They, The narrator)
        
    Returns:
        Rewritten text
    """
    t = text
    
    # Determine pronouns based on subject
    if subject.lower() in ("he", "him"):
        obj = "him"
        poss = "his"
        refl = "himself"
    elif subject.lower() in ("she", "her"):
        obj = "her"
        poss = "her"
        refl = "herself"
    elif subject.lower() in ("they", "them"):
        obj = "them"
        poss = "their"
        refl = "themselves"
    else:  # "The narrator", custom name
        obj = subject
        poss = f"{subject}'s"
        refl = subject
    
    # First person → third person
    # Order matters - do phrases before individual words
    replacements = [
        (r"\bI am\b", f"{subject} is", re.IGNORECASE),
        (r"\bI'm\b", f"{subject} is", re.IGNORECASE),
        (r"\bI have\b", f"{subject} has", re.IGNORECASE),
        (r"\bI've\b", f"{subject} has", re.IGNORECASE),
        (r"\bI will\b", f"{subject} will", re.IGNORECASE),
        (r"\bI'll\b", f"{subject} will", re.IGNORECASE),
        (r"\bI would\b", f"{subject} would", re.IGNORECASE),
        (r"\bI'd\b", f"{subject} would", re.IGNORECASE),
        (r"\bI was\b", f"{subject} was", re.IGNORECASE),
        (r"\bI tried\b", f"{subject} tried", re.IGNORECASE),
        (r"\bI built\b", f"{subject} built", re.IGNORECASE),
        (r"\bI found\b", f"{subject} found", re.IGNORECASE),
        (r"\bI wanted\b", f"{subject} wanted", re.IGNORECASE),
        (r"\bI need\b", f"{subject} needs", re.IGNORECASE),
        (r"\bI think\b", f"{subject} thinks", re.IGNORECASE),
        (r"\bI know\b", f"{subject} knows", re.IGNORECASE),
        (r"\bI\b", subject, re.IGNORECASE),
        (r"\bme\b", obj, re.IGNORECASE),
        (r"\bmy\b", poss, re.IGNORECASE),
        (r"\bmine\b", poss, re.IGNORECASE),
        (r"\bmyself\b", refl, re.IGNORECASE),
        (r"\bwe are\b", "they are", re.IGNORECASE),
        (r"\bwe're\b", "they're", re.IGNORECASE),
        (r"\bwe have\b", "they have", re.IGNORECASE),
        (r"\bwe've\b", "they've", re.IGNORECASE),
        (r"\bwe\b", "they", re.IGNORECASE),
        (r"\bus\b", "them", re.IGNORECASE),
        (r"\bour\b", "their", re.IGNORECASE),
        (r"\bours\b", "theirs", re.IGNORECASE),
        (r"\bourselves\b", "themselves", re.IGNORECASE),
    ]
    
    for pattern, replacement, flags in replacements:
        t = re.sub(pattern, replacement, t, flags=flags)
    
    # Second person → third person (viewer → "the viewer")
    second_person_replacements = [
        (r"\byou are\b", "viewers are", re.IGNORECASE),
        (r"\byou're\b", "viewers are", re.IGNORECASE),
        (r"\byou have\b", "viewers have", re.IGNORECASE),
        (r"\byou've\b", "viewers have", re.IGNORECASE),
        (r"\byou will\b", "viewers will", re.IGNORECASE),
        (r"\byou'll\b", "viewers will", re.IGNORECASE),
        (r"\byou can\b", "viewers can", re.IGNORECASE),
        (r"\byou\b", "viewers", re.IGNORECASE),
        (r"\byour\b", "their", re.IGNORECASE),
        (r"\byours\b", "theirs", re.IGNORECASE),
        (r"\byourself\b", "themselves", re.IGNORECASE),
    ]
    
    for pattern, replacement, flags in second_person_replacements:
        t = re.sub(pattern, replacement, t, flags=flags)
    
    return t


def enforce_perspective(
    text: str,
    perspective: NarrationPerspective = "third_person",
    mode: EnforceMode = "SOFT_REWRITE",
    subject: str = "He",
) -> PerspectiveResult:
    """
    Enforce narration perspective.
    
    Args:
        text: Text to enforce
        perspective: Target perspective
        mode: STRICT (warn only) or SOFT_REWRITE (auto-convert)
        subject: Third person subject for rewrites
        
    Returns:
        PerspectiveResult
    """
    warnings = []
    
    if perspective != "third_person":
        return PerspectiveResult(text=text, changed=False, warnings=[])
    
    has_first = has_first_person(text)
    has_second = has_second_person(text)
    
    if not has_first and not has_second:
        return PerspectiveResult(text=text, changed=False, warnings=[])
    
    if mode == "STRICT":
        if has_first:
            warnings.append("Text contains first-person pronouns but third-person was required.")
        if has_second:
            warnings.append("Text contains second-person pronouns but third-person was required.")
        return PerspectiveResult(text=text, changed=False, warnings=warnings)
    
    # SOFT_REWRITE mode
    rewritten = rewrite_to_third_person(text, subject)
    warnings.append("Rewrote text to third-person perspective.")
    
    return PerspectiveResult(text=rewritten, changed=True, warnings=warnings)


def enforce_perspective_for_beats(
    beats: list[dict],
    voice_vars: Optional[VoiceVars] = None,
) -> tuple[list[dict], list[str]]:
    """
    Enforce perspective for all beats.
    
    Args:
        beats: List of beat dicts
        voice_vars: Voice configuration
        
    Returns:
        Tuple of (updated beats, all warnings)
    """
    vv = voice_vars or DEFAULT_VOICE_VARS
    all_warnings = []
    updated_beats = []
    
    for beat in beats:
        narration = beat.get("narration", "")
        
        if not narration or not vv.use_third_person_tts:
            updated_beats.append(beat)
            continue
        
        result = enforce_perspective(
            text=narration,
            perspective=vv.perspective,
            mode=vv.enforce_perspective,
            subject=vv.third_person_subject,
        )
        
        if result.warnings:
            beat_id = beat.get("id", "unknown")
            all_warnings.extend([f"{beat_id}: {w}" for w in result.warnings])
        
        updated = dict(beat)
        updated["narration"] = result.text
        updated_beats.append(updated)
    
    return updated_beats, all_warnings


def enforce_perspective_for_story_ir(
    ir: dict,
    voice_vars: Optional[VoiceVars] = None,
) -> dict:
    """
    Enforce perspective for Story IR.
    
    Args:
        ir: Story IR dict
        voice_vars: Voice configuration
        
    Returns:
        Updated Story IR
    """
    vv = voice_vars or DEFAULT_VOICE_VARS
    
    updated_beats, warnings = enforce_perspective_for_beats(ir.get("beats", []), vv)
    
    return {
        **ir,
        "beats": updated_beats,
        "perspectiveEnforcement": {
            "mode": vv.enforce_perspective,
            "perspective": vv.perspective,
            "warningCount": len(warnings),
            "warnings": warnings[:10],  # Limit stored warnings
        },
    }


def resolve_voice_vars(
    format_defaults: Optional[dict] = None,
    request_overrides: Optional[dict] = None,
) -> VoiceVars:
    """
    Merge format defaults with request overrides.
    
    Args:
        format_defaults: Default voice vars from format pack
        request_overrides: Overrides from request
        
    Returns:
        Resolved VoiceVars
    """
    merged = {}
    
    if format_defaults:
        merged.update(format_defaults)
    
    if request_overrides:
        merged.update(request_overrides)
    
    vv = VoiceVars.model_validate(merged) if merged else DEFAULT_VOICE_VARS
    
    # Normalize: if useThirdPersonTTS, ensure perspective is third_person
    if vv.use_third_person_tts:
        vv.perspective = "third_person"
    
    return vv
