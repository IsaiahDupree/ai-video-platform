"""
Speech Timing

Estimates speaking duration and reconciles beat durations
to ensure narration has enough time without rushing or getting cut off.
"""

import re
from typing import Optional
from pydantic import BaseModel, Field


class SpeechTimingConfig(BaseModel):
    """Configuration for speech timing estimation."""
    target_wpm: int = Field(default=155, alias="targetWpm", ge=100, le=250)
    min_beat_seconds: float = Field(default=1.2, alias="minBeatSeconds", ge=0.5)
    lead_in_seconds: float = Field(default=0.10, alias="leadInSeconds", ge=0)
    tail_seconds: float = Field(default=0.18, alias="tailSeconds", ge=0)
    punctuation_pause_boost: float = Field(default=0.015, alias="punctuationPauseBoost", ge=0)
    
    class Config:
        populate_by_name = True


DEFAULT_SPEECH_TIMING = SpeechTimingConfig()


def count_words(text: str) -> int:
    """Count words in text."""
    words = re.findall(r'\S+', text.strip())
    return len(words)


def count_punctuation(text: str) -> int:
    """Count punctuation marks that add pauses."""
    punct = re.findall(r'[,\.\!\?\:\;—\-]', text)
    return len(punct)


def estimate_speech_seconds(
    text: str,
    config: Optional[SpeechTimingConfig] = None,
) -> float:
    """
    Estimate how long it takes to speak text.
    
    Args:
        text: Narration text
        config: Speech timing config
        
    Returns:
        Estimated duration in seconds
    """
    cfg = config or DEFAULT_SPEECH_TIMING
    
    words = count_words(text)
    if words == 0:
        return cfg.min_beat_seconds
    
    # Base duration from word count
    base = (words / cfg.target_wpm) * 60
    
    # Punctuation pauses
    punct = count_punctuation(text)
    pause = punct * cfg.punctuation_pause_boost
    
    # Total with buffers
    total = base + pause + cfg.lead_in_seconds + cfg.tail_seconds
    
    return max(cfg.min_beat_seconds, round(total, 2))


def estimate_beat_duration(
    narration: str,
    on_screen_text: Optional[str] = None,
    config: Optional[SpeechTimingConfig] = None,
) -> float:
    """
    Estimate beat duration considering narration and on-screen text.
    
    Args:
        narration: Spoken narration
        on_screen_text: Optional on-screen text that needs read time
        config: Speech timing config
        
    Returns:
        Estimated duration in seconds
    """
    cfg = config or DEFAULT_SPEECH_TIMING
    
    # Speech duration
    speech_dur = estimate_speech_seconds(narration, cfg) if narration else 0
    
    # Reading time for on-screen text (faster than speech)
    read_dur = 0
    if on_screen_text:
        words = count_words(on_screen_text)
        read_dur = (words / 250) * 60  # ~250 WPM for reading
    
    # Take the longer of speaking or reading
    return max(cfg.min_beat_seconds, speech_dur, read_dur)


class ReconcileChange(BaseModel):
    """A change made during beat reconciliation."""
    beat_id: str = Field(alias="beatId")
    old_s: float = Field(alias="oldS")
    new_s: float = Field(alias="newS")
    reason: str
    
    class Config:
        populate_by_name = True


class ReconcileResult(BaseModel):
    """Result of beat duration reconciliation."""
    beats: list[dict]
    changes: list[ReconcileChange]
    total_old_s: float = Field(alias="totalOldS")
    total_new_s: float = Field(alias="totalNewS")
    
    class Config:
        populate_by_name = True


def reconcile_beat_durations(
    beats: list[dict],
    narration_cues: Optional[dict] = None,
    config: Optional[SpeechTimingConfig] = None,
) -> ReconcileResult:
    """
    Reconcile beat durations to ensure narration fits.
    
    Args:
        beats: List of beat dicts
        narration_cues: Optional real TTS durations per beat ID
        config: Speech timing config
        
    Returns:
        ReconcileResult with updated beats and changes
    """
    cfg = config or DEFAULT_SPEECH_TIMING
    
    changes = []
    total_old = 0
    updated_beats = []
    
    for beat in beats:
        beat_id = beat.get("id", "")
        old_dur = beat.get("duration_s") or beat.get("durationS", 3)
        narration = beat.get("narration", "")
        
        total_old += old_dur
        
        # Preferred: real TTS duration
        cue_dur = None
        if narration_cues and beat_id in narration_cues:
            cue_dur = narration_cues[beat_id].get("durationSeconds")
        
        # Fallback: estimate from text
        est_dur = estimate_speech_seconds(narration, cfg) if narration else cfg.min_beat_seconds
        
        needed = cue_dur if cue_dur else est_dur
        
        # Don't force beats shorter than needed
        new_dur = max(old_dur, needed)
        
        if abs(new_dur - old_dur) > 0.01:
            changes.append(ReconcileChange(
                beat_id=beat_id,
                old_s=old_dur,
                new_s=new_dur,
                reason="TTS duration + buffers" if cue_dur else "WPM estimate + buffers",
            ))
        
        updated_beat = dict(beat)
        updated_beat["duration_s"] = new_dur
        if "durationS" in updated_beat:
            updated_beat["durationS"] = new_dur
        updated_beats.append(updated_beat)
    
    total_new = sum(b.get("duration_s", 0) for b in updated_beats)
    
    return ReconcileResult(
        beats=updated_beats,
        changes=changes,
        total_old_s=round(total_old, 2),
        total_new_s=round(total_new, 2),
    )


def reconcile_story_ir_durations(
    ir: dict,
    narration_cues: Optional[dict] = None,
    config: Optional[SpeechTimingConfig] = None,
) -> dict:
    """
    Reconcile Story IR beat durations.
    
    Args:
        ir: Story IR dict
        narration_cues: Optional real TTS durations
        config: Speech timing config
        
    Returns:
        Updated Story IR
    """
    result = reconcile_beat_durations(
        ir.get("beats", []),
        narration_cues,
        config,
    )
    
    return {
        **ir,
        "beats": result.beats,
        "reconciliation": {
            "totalOldS": result.total_old_s,
            "totalNewS": result.total_new_s,
            "changesCount": len(result.changes),
        },
    }


def get_speech_stats(beats: list[dict]) -> dict:
    """Get speech statistics for beats."""
    total_words = 0
    total_seconds = 0
    beat_count = 0
    
    for beat in beats:
        narration = beat.get("narration", "")
        if narration:
            total_words += count_words(narration)
            total_seconds += beat.get("duration_s") or beat.get("durationS", 0)
            beat_count += 1
    
    avg_wpm = (total_words / total_seconds * 60) if total_seconds > 0 else 0
    
    return {
        "totalWords": total_words,
        "totalSeconds": round(total_seconds, 2),
        "averageWpm": round(avg_wpm, 1),
        "beatsWithNarration": beat_count,
    }
