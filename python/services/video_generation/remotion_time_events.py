"""
Remotion Time Events Generator

Generates time-based events for Remotion compositions.
Handles visual reveals, beat markers, and SFX timing.
"""

from typing import Optional, Literal
from pydantic import BaseModel, Field


class RemotionTimeEvent(BaseModel):
    """A time-based event for Remotion."""
    id: str
    frame: int = Field(ge=0)
    event_type: str = Field(alias="eventType")
    label: Optional[str] = None
    data: Optional[dict] = None
    
    class Config:
        populate_by_name = True


class RemotionVisualReveal(BaseModel):
    """A visual reveal event for Remotion."""
    id: str
    frame: int = Field(ge=0)
    kind: Literal["keyword", "bullet", "code", "chart", "cta", "error", "success", "image"]
    key: Optional[str] = None
    animation: str = "fadeIn"
    duration_frames: int = Field(default=15, alias="durationFrames")
    
    class Config:
        populate_by_name = True


class RemotionBeatMarker(BaseModel):
    """A beat marker for Remotion timeline."""
    id: str
    frame: int = Field(ge=0)
    beat_type: str = Field(alias="beatType")
    beat_id: str = Field(alias="beatId")
    duration_frames: int = Field(alias="durationFrames")
    narration: Optional[str] = None
    
    class Config:
        populate_by_name = True


class RemotionTimeEventsFile(BaseModel):
    """Collection of time events for a Remotion composition."""
    version: str = "1.0.0"
    fps: int
    total_frames: int = Field(alias="totalFrames")
    events: list[RemotionTimeEvent] = Field(default_factory=list)
    reveals: list[RemotionVisualReveal] = Field(default_factory=list)
    beat_markers: list[RemotionBeatMarker] = Field(default_factory=list, alias="beatMarkers")
    
    class Config:
        populate_by_name = True


def story_ir_to_time_events(
    ir: dict,
    fps: Optional[int] = None,
) -> RemotionTimeEventsFile:
    """
    Convert Story IR to Remotion time events.
    
    Args:
        ir: Story IR dict
        fps: Frames per second
        
    Returns:
        RemotionTimeEventsFile
    """
    fps = fps or ir.get("meta", {}).get("fps", 30)
    beats = ir.get("beats", [])
    
    events = []
    reveals = []
    beat_markers = []
    
    cursor_frames = 0
    event_counter = 0
    
    for i, beat in enumerate(beats):
        duration_s = beat.get("duration_s") or beat.get("durationS", 3)
        duration_frames = max(1, round(duration_s * fps))
        
        beat_type = beat.get("type", "STEP")
        beat_id = beat.get("id", f"beat_{i}")
        narration = beat.get("narration", "")
        on_screen = beat.get("on_screen") or beat.get("onScreen") or {}
        
        # Add beat marker
        beat_markers.append(RemotionBeatMarker(
            id=f"marker_{beat_id}",
            frame=cursor_frames,
            beat_type=beat_type,
            beat_id=beat_id,
            duration_frames=duration_frames,
            narration=narration[:100] if narration else None,
        ))
        
        # Add beat start event
        events.append(RemotionTimeEvent(
            id=f"event_{event_counter}",
            frame=cursor_frames,
            event_type="beat_start",
            label=f"{beat_type}:{beat_id}",
            data={"beatType": beat_type, "beatId": beat_id},
        ))
        event_counter += 1
        
        # Add visual reveals based on on_screen content
        reveal_frame = cursor_frames + 6  # Slight delay for animation
        
        if on_screen.get("headline"):
            reveals.append(RemotionVisualReveal(
                id=f"reveal_{event_counter}",
                frame=reveal_frame,
                kind="keyword",
                key=on_screen["headline"][:50],
                animation="fadeIn",
            ))
            event_counter += 1
        
        if on_screen.get("bullet"):
            reveals.append(RemotionVisualReveal(
                id=f"reveal_{event_counter}",
                frame=reveal_frame,
                kind="bullet",
                key=on_screen["bullet"][:50],
                animation="slideIn",
            ))
            event_counter += 1
        
        # Beat type specific events
        if beat_type == "HOOK":
            events.append(RemotionTimeEvent(
                id=f"event_{event_counter}",
                frame=cursor_frames,
                event_type="hook_start",
                label="Hook",
            ))
            event_counter += 1
        
        elif beat_type == "CTA":
            reveals.append(RemotionVisualReveal(
                id=f"reveal_{event_counter}",
                frame=cursor_frames + 10,
                kind="cta",
                key=on_screen.get("headline") or "CTA",
                animation="bounce",
                duration_frames=duration_frames - 10,
            ))
            event_counter += 1
        
        elif beat_type == "PROOF":
            events.append(RemotionTimeEvent(
                id=f"event_{event_counter}",
                frame=cursor_frames,
                event_type="proof_reveal",
                label="Proof",
            ))
            event_counter += 1
        
        # Add beat end event
        events.append(RemotionTimeEvent(
            id=f"event_{event_counter}",
            frame=cursor_frames + duration_frames - 1,
            event_type="beat_end",
            label=f"end:{beat_id}",
            data={"beatId": beat_id},
        ))
        event_counter += 1
        
        cursor_frames += duration_frames
    
    return RemotionTimeEventsFile(
        fps=fps,
        total_frames=cursor_frames,
        events=events,
        reveals=reveals,
        beat_markers=beat_markers,
    )


def beats_to_time_events(
    beats: list[dict],
    fps: int = 30,
) -> RemotionTimeEventsFile:
    """
    Convert beat list to Remotion time events.
    
    Args:
        beats: List of beat dicts with 'frame' key
        fps: Frames per second
        
    Returns:
        RemotionTimeEventsFile
    """
    events = []
    reveals = []
    beat_markers = []
    
    total_frames = 0
    
    for i, beat in enumerate(beats):
        frame = beat.get("frame", 0)
        beat_type = beat.get("type", "STEP")
        beat_id = beat.get("beatId") or beat.get("id", f"beat_{i}")
        text = beat.get("text") or beat.get("narration", "")
        action = beat.get("action", "")
        duration_frames = beat.get("durationFrames", 90)
        
        total_frames = max(total_frames, frame + duration_frames)
        
        # Beat marker
        beat_markers.append(RemotionBeatMarker(
            id=f"marker_{beat_id}",
            frame=frame,
            beat_type=beat_type,
            beat_id=beat_id,
            duration_frames=duration_frames,
            narration=text[:100] if text else None,
        ))
        
        # Events based on action
        if action == "hook":
            events.append(RemotionTimeEvent(
                id=f"event_hook_{i}",
                frame=frame,
                event_type="hook",
                label="Hook",
            ))
        elif action == "reveal":
            events.append(RemotionTimeEvent(
                id=f"event_reveal_{i}",
                frame=frame,
                event_type="reveal",
                label="Reveal",
            ))
        elif action == "transition":
            events.append(RemotionTimeEvent(
                id=f"event_transition_{i}",
                frame=frame,
                event_type="transition",
                label="Transition",
            ))
        elif action == "cta":
            reveals.append(RemotionVisualReveal(
                id=f"reveal_cta_{i}",
                frame=frame + 6,
                kind="cta",
                key="CTA",
                animation="bounce",
            ))
        elif action == "error":
            reveals.append(RemotionVisualReveal(
                id=f"reveal_error_{i}",
                frame=frame,
                kind="error",
                key=text[:30] if text else "Error",
            ))
        elif action == "success":
            reveals.append(RemotionVisualReveal(
                id=f"reveal_success_{i}",
                frame=frame,
                kind="success",
                key=text[:30] if text else "Success",
            ))
    
    return RemotionTimeEventsFile(
        fps=fps,
        total_frames=total_frames,
        events=events,
        reveals=reveals,
        beat_markers=beat_markers,
    )


def reveals_to_sfx_cues(
    reveals: list[RemotionVisualReveal],
) -> list[dict]:
    """
    Convert visual reveals to SFX macro cues.
    
    Args:
        reveals: List of visual reveals
        
    Returns:
        List of SFX cue dicts
    """
    from .remotion_sfx import RemotionSfxCue
    
    macro_mapping = {
        "keyword": "text_ping",
        "bullet": "text_ping",
        "code": "glitch_cut",
        "chart": "reveal_riser",
        "cta": "cta_sparkle",
        "error": "warning_buzz_soft",
        "success": "success_ding",
        "image": "impact_soft",
    }
    
    intensity_mapping = {
        "keyword": 0.45,
        "bullet": 0.40,
        "code": 0.55,
        "chart": 0.60,
        "cta": 0.70,
        "error": 0.65,
        "success": 0.65,
        "image": 0.50,
    }
    
    cues = []
    for reveal in reveals:
        macro_id = macro_mapping.get(reveal.kind)
        if macro_id:
            cues.append(RemotionSfxCue(
                frame=reveal.frame,
                macro_id=macro_id,
                intensity=intensity_mapping.get(reveal.kind, 0.5),
                reason=f"reveal:{reveal.kind}",
            ).model_dump(by_alias=True))
    
    return cues


def merge_time_events(
    *event_files: RemotionTimeEventsFile,
) -> RemotionTimeEventsFile:
    """
    Merge multiple time event files.
    
    Args:
        event_files: Time event files to merge
        
    Returns:
        Merged RemotionTimeEventsFile
    """
    if not event_files:
        return RemotionTimeEventsFile(fps=30, total_frames=0)
    
    fps = event_files[0].fps
    total_frames = max(ef.total_frames for ef in event_files)
    
    all_events = []
    all_reveals = []
    all_markers = []
    
    for ef in event_files:
        all_events.extend(ef.events)
        all_reveals.extend(ef.reveals)
        all_markers.extend(ef.beat_markers)
    
    # Sort by frame
    all_events.sort(key=lambda e: e.frame)
    all_reveals.sort(key=lambda r: r.frame)
    all_markers.sort(key=lambda m: m.frame)
    
    return RemotionTimeEventsFile(
        fps=fps,
        total_frames=total_frames,
        events=all_events,
        reveals=all_reveals,
        beat_markers=all_markers,
    )


def generate_remotion_composition_props(
    time_events: RemotionTimeEventsFile,
    include_sfx_cues: bool = True,
) -> dict:
    """
    Generate props for a Remotion composition from time events.
    
    Args:
        time_events: Time events
        include_sfx_cues: Whether to include SFX cues
        
    Returns:
        Props dict for Remotion
    """
    props = {
        "fps": time_events.fps,
        "durationInFrames": time_events.total_frames,
        "events": [e.model_dump(by_alias=True) for e in time_events.events],
        "reveals": [r.model_dump(by_alias=True) for r in time_events.reveals],
        "beatMarkers": [m.model_dump(by_alias=True) for m in time_events.beat_markers],
    }
    
    if include_sfx_cues:
        props["sfxCues"] = reveals_to_sfx_cues(time_events.reveals)
    
    return props


def save_time_events(
    time_events: RemotionTimeEventsFile,
    path: str,
) -> str:
    """Save time events to JSON file."""
    import json
    from pathlib import Path
    
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(time_events.model_dump(by_alias=True), f, indent=2)
    return path


def load_time_events(path: str) -> RemotionTimeEventsFile:
    """Load time events from JSON file."""
    import json
    
    with open(path, "r") as f:
        data = json.load(f)
    return RemotionTimeEventsFile.model_validate(data)
