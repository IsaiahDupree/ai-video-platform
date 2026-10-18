"""
Hybrid Format DSL

A DSL for generating hybrid format content (explainer + dev vlog).
Supports block-based content definition with automatic beat/reveal generation.
"""

from typing import Optional, Literal
from pydantic import BaseModel, Field


BlockType = Literal["keyword", "bullet", "code", "error", "success", "cta", "transition"]
BeatAction = Literal[
    "hook", "problem", "transition", "reveal", "explain",
    "code", "error", "success", "punchline", "cta", "outro"
]


class FormatStyle(BaseModel):
    """Style configuration for hybrid format."""
    theme: str = "clean_dark"
    font_scale: float = Field(default=1.0, alias="fontScale")
    accent_color: Optional[str] = Field(None, alias="accentColor")
    
    class Config:
        populate_by_name = True


class FormatBlock(BaseModel):
    """A content block in the hybrid format."""
    id: str
    type: BlockType
    text: str
    event: Optional[str] = None
    duration_hint_s: Optional[float] = Field(None, alias="durationHintS")
    
    class Config:
        populate_by_name = True


class HybridFormat(BaseModel):
    """Complete hybrid format specification."""
    version: str = "1.0.0"
    fps: int = 30
    style: FormatStyle = Field(default_factory=FormatStyle)
    blocks: list[FormatBlock] = Field(default_factory=list)
    
    class Config:
        populate_by_name = True


# Block type to beat action mapping
BLOCK_TO_ACTION: dict[BlockType, BeatAction] = {
    "keyword": "reveal",
    "bullet": "explain",
    "code": "code",
    "error": "error",
    "success": "success",
    "cta": "cta",
    "transition": "transition",
}


# Action to SFX macro mapping
ACTION_TO_MACRO: dict[BeatAction, list[str]] = {
    "hook": ["dramatic_pause", "impact_soft"],
    "problem": ["text_ping"],
    "transition": ["transition_fast"],
    "reveal": ["reveal_riser", "impact_soft"],
    "explain": ["text_ping"],
    "code": ["text_ping"],
    "error": ["warning_buzz_soft", "glitch_cut"],
    "success": ["success_ding"],
    "punchline": ["micro_joke_hit"],
    "cta": ["cta_sparkle"],
    "outro": ["impact_soft"],
}


def block_to_action(block: FormatBlock, is_first: bool = False) -> BeatAction:
    """
    Determine beat action from block type.
    
    Args:
        block: Format block
        is_first: Whether this is the first block
        
    Returns:
        BeatAction
    """
    if is_first and block.type == "keyword":
        return "hook"
    return BLOCK_TO_ACTION.get(block.type, "explain")


def hybrid_format_to_beats(
    fmt: HybridFormat,
    default_duration_s: float = 3.0,
) -> list[dict]:
    """
    Convert HybridFormat to beat list.
    
    Args:
        fmt: Hybrid format
        default_duration_s: Default beat duration
        
    Returns:
        List of beat dicts
    """
    beats = []
    
    for i, block in enumerate(fmt.blocks):
        action = block_to_action(block, is_first=(i == 0))
        
        # Map action to beat type
        beat_type = "STEP"
        if action == "hook":
            beat_type = "HOOK"
        elif action == "cta":
            beat_type = "CTA"
        elif action in ("reveal", "success"):
            beat_type = "PROOF"
        
        duration = block.duration_hint_s or default_duration_s
        
        beats.append({
            "id": block.id,
            "type": beat_type,
            "narration": block.text,
            "duration_s": duration,
            "action": action,
            "on_screen": {
                "headline": block.text if block.type == "keyword" else None,
                "bullet": block.text if block.type == "bullet" else None,
            },
            "event": block.event,
        })
    
    return beats


def hybrid_format_to_story_ir(
    fmt: HybridFormat,
    title: str = "Untitled",
    default_duration_s: float = 3.0,
) -> dict:
    """
    Convert HybridFormat to Story IR.
    
    Args:
        fmt: Hybrid format
        title: Video title
        default_duration_s: Default beat duration
        
    Returns:
        Story IR dict
    """
    beats = hybrid_format_to_beats(fmt, default_duration_s)
    
    total_duration = sum(b["duration_s"] for b in beats)
    
    return {
        "version": "1.0.0",
        "meta": {
            "title": title,
            "fps": fmt.fps,
            "aspect": "9:16",
            "totalDuration_s": total_duration,
        },
        "beats": beats,
        "style": fmt.style.model_dump(by_alias=True),
    }


def hybrid_format_to_reveals(
    fmt: HybridFormat,
    fps: Optional[int] = None,
) -> list[dict]:
    """
    Extract visual reveals from HybridFormat.
    
    Args:
        fmt: Hybrid format
        fps: Frames per second
        
    Returns:
        List of reveal dicts
    """
    fps = fps or fmt.fps
    reveals = []
    cursor_frames = 0
    
    for block in fmt.blocks:
        duration_s = block.duration_hint_s or 3.0
        duration_frames = round(duration_s * fps)
        
        # Map block type to reveal kind
        kind = block.type
        if kind == "keyword":
            kind = "keyword"
        elif kind == "bullet":
            kind = "bullet"
        elif kind == "code":
            kind = "code"
        elif kind == "cta":
            kind = "cta"
        elif kind == "error":
            kind = "error"
        elif kind == "success":
            kind = "success"
        else:
            cursor_frames += duration_frames
            continue
        
        reveals.append({
            "id": f"reveal_{block.id}",
            "frame": cursor_frames + 6,  # Slight delay for animation
            "kind": kind,
            "key": block.text[:50],
        })
        
        cursor_frames += duration_frames
    
    return reveals


def hybrid_format_to_sfx_cues(
    fmt: HybridFormat,
    fps: Optional[int] = None,
) -> list[dict]:
    """
    Generate SFX cues from HybridFormat.
    
    Args:
        fmt: Hybrid format
        fps: Frames per second
        
    Returns:
        List of SFX cue dicts
    """
    fps = fps or fmt.fps
    cues = []
    cursor_frames = 0
    
    for i, block in enumerate(fmt.blocks):
        action = block_to_action(block, is_first=(i == 0))
        duration_s = block.duration_hint_s or 3.0
        duration_frames = round(duration_s * fps)
        
        macros = ACTION_TO_MACRO.get(action, [])
        
        for j, macro_id in enumerate(macros):
            cues.append({
                "frame": cursor_frames + (j * 3),  # Slight offset for multiple macros
                "macroId": macro_id,
                "intensity": 0.65 if action in ("hook", "cta", "error", "success") else 0.50,
                "reason": f"block:{block.type}:{action}",
            })
        
        cursor_frames += duration_frames
    
    return cues


def create_devlog_format(
    hook_text: str,
    problem_text: str,
    error_text: str,
    solution_text: str,
    steps: list[str],
    code_text: Optional[str] = None,
    success_text: str = "Deploy OK ✅",
    cta_text: str = "Comment TECH for the template",
) -> HybridFormat:
    """
    Create a devlog-first hybrid format.
    
    Args:
        hook_text: Opening hook
        problem_text: Problem statement
        error_text: Error/failure moment
        solution_text: Solution reveal
        steps: Explanation steps
        code_text: Optional code line
        success_text: Success moment
        cta_text: Call to action
        
    Returns:
        HybridFormat
    """
    blocks = [
        FormatBlock(id="hook", type="keyword", text=hook_text, event="hook"),
        FormatBlock(id="problem", type="bullet", text=problem_text, event="problem"),
        FormatBlock(id="error", type="error", text=error_text, event="error_hit"),
        FormatBlock(id="solution", type="keyword", text=solution_text, event="reveal"),
    ]
    
    for i, step in enumerate(steps):
        blocks.append(FormatBlock(
            id=f"step_{i}",
            type="bullet",
            text=step,
            event=f"step_{i}",
        ))
    
    if code_text:
        blocks.append(FormatBlock(id="code", type="code", text=code_text, event="code_in"))
    
    blocks.append(FormatBlock(id="success", type="success", text=success_text, event="success_hit"))
    blocks.append(FormatBlock(id="cta", type="cta", text=cta_text, event="cta"))
    
    return HybridFormat(blocks=blocks)


def create_listicle_format(
    hook_text: str,
    items: list[str],
    cta_text: str = "Save this for later",
) -> HybridFormat:
    """
    Create a listicle hybrid format.
    
    Args:
        hook_text: Opening hook
        items: List items
        cta_text: Call to action
        
    Returns:
        HybridFormat
    """
    blocks = [
        FormatBlock(id="hook", type="keyword", text=hook_text, event="hook"),
    ]
    
    for i, item in enumerate(items):
        blocks.append(FormatBlock(
            id=f"item_{i}",
            type="bullet",
            text=f"{i + 1}. {item}",
            event=f"item_{i}",
        ))
    
    blocks.append(FormatBlock(id="cta", type="cta", text=cta_text, event="cta"))
    
    return HybridFormat(blocks=blocks)


def validate_hybrid_format(fmt: HybridFormat) -> dict:
    """
    Validate a hybrid format.
    
    Args:
        fmt: Hybrid format
        
    Returns:
        Validation report
    """
    errors = []
    warnings = []
    
    if not fmt.blocks:
        errors.append("No blocks defined")
    
    # Check for hook
    has_hook = any(b.type == "keyword" for b in fmt.blocks[:2])
    if not has_hook:
        warnings.append("No hook keyword in first 2 blocks")
    
    # Check for CTA
    has_cta = any(b.type == "cta" for b in fmt.blocks)
    if not has_cta:
        warnings.append("No CTA block defined")
    
    # Check for duplicate IDs
    ids = [b.id for b in fmt.blocks]
    if len(ids) != len(set(ids)):
        errors.append("Duplicate block IDs")
    
    # Check text lengths
    for block in fmt.blocks:
        if len(block.text) > 200:
            warnings.append(f"Block {block.id} text is very long ({len(block.text)} chars)")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "stats": {
            "blockCount": len(fmt.blocks),
            "hasHook": has_hook,
            "hasCta": has_cta,
        },
    }


def get_hybrid_format_ai_prompt(topic: str, key_points: list[str], cta: str) -> str:
    """
    Generate AI prompt for creating HybridFormat.
    
    Args:
        topic: Video topic
        key_points: Key points to cover
        cta: Call to action
        
    Returns:
        Prompt string
    """
    return f"""Create a HybridFormat JSON for a 45-60 second video.

Topic: {topic}
Key Points:
{chr(10).join(f'- {p}' for p in key_points)}
CTA: {cta}

Use this structure:
1. hook (keyword) - attention grabber
2. problem (bullet) - the pain point
3. error (error) - the failure moment
4. reveal (keyword) - the solution
5. steps (bullets) - 2-3 explanation points
6. code (optional) - command or code snippet
7. success (success) - the win
8. cta (cta) - call to action

Output JSON:
{{
  "version": "1.0.0",
  "fps": 30,
  "style": {{ "theme": "clean_dark", "fontScale": 1.0 }},
  "blocks": [
    {{ "id": "...", "type": "keyword|bullet|code|error|success|cta", "text": "...", "event": "..." }}
  ]
}}

Keep text punchy (under 15 words per block). Include at least: hook → error → reveal → success → cta."""
