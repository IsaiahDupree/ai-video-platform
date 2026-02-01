"""
Duration Normalizer

Normalizes outline/script duration to hit target (e.g., 58s for short-form).
Trims/merges EXPLAIN lines while preserving HOOK/REVEAL/CTA.
"""

import re
from typing import Optional
from pydantic import BaseModel, Field


class NormalizeConfig(BaseModel):
    """Configuration for duration normalization."""
    target_seconds: float = Field(default=58.0, alias="targetSeconds")
    tolerance_seconds: float = Field(default=1.5, alias="toleranceSeconds")
    max_explain_lines: int = Field(default=3, alias="maxExplainLines")
    keep_keys: list[str] = Field(
        default_factory=lambda: ["HOOK", "REVEAL", "CTA", "ERROR", "SUCCESS", "CODE", "PROBLEM"],
        alias="keepKeys"
    )
    
    class Config:
        populate_by_name = True


DEFAULT_NORMALIZE_CONFIG = NormalizeConfig()


class OutlineLine(BaseModel):
    """A line in the outline."""
    key: str
    text: str
    action: str


def estimate_seconds_for_action(text: str, action: str) -> float:
    """
    Estimate duration for a line based on action type.
    
    Args:
        text: Line text
        action: Beat action
        
    Returns:
        Estimated seconds
    """
    words = len(text.split())
    
    # Words per second by action
    wps_map = {
        "hook": 3.2,
        "reveal": 2.8,
        "code": 2.2,
        "error": 2.6,
        "success": 2.8,
        "cta": 2.6,
        "transition": 3.0,
        "explain": 3.0,
        "problem": 3.0,
    }
    wps = wps_map.get(action, 3.0)
    
    base = max(0.75, words / wps)
    
    # Pause by action
    pause_map = {
        "reveal": 0.35,
        "hook": 0.20,
        "transition": 0.15,
        "cta": 0.25,
    }
    pause = pause_map.get(action, 0.10)
    
    return min(base + pause, 4.25)


def key_to_action(key: str) -> str:
    """Map outline key to action."""
    mapping = {
        "HOOK": "hook",
        "PROBLEM": "problem",
        "TRANSITION": "transition",
        "REVEAL": "reveal",
        "EXPLAIN": "explain",
        "CODE": "code",
        "ERROR": "error",
        "SUCCESS": "success",
        "PUNCHLINE": "punchline",
        "CTA": "cta",
        "OUTRO": "outro",
    }
    return mapping.get(key.upper(), "explain")


def parse_outline(outline_text: str) -> list[OutlineLine]:
    """
    Parse outline text into lines.
    
    Args:
        outline_text: Raw outline text
        
    Returns:
        List of OutlineLine
    """
    lines = outline_text.strip().split("\n")
    parsed = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        match = re.match(r'^([A-Z_]+)\s*:\s*(.+)$', line)
        if not match:
            continue
        
        key = match.group(1).upper()
        text = match.group(2).strip()
        action = key_to_action(key)
        
        parsed.append(OutlineLine(key=key, text=text, action=action))
    
    return parsed


def outline_to_text(lines: list[OutlineLine]) -> str:
    """Convert outline lines back to text."""
    return "\n".join(f"{l.key}: {l.text}" for l in lines)


def estimate_outline_seconds(lines: list[OutlineLine]) -> float:
    """Get total estimated duration for outline."""
    return sum(estimate_seconds_for_action(l.text, l.action) for l in lines)


def explain_score(text: str) -> float:
    """
    Score an EXPLAIN line by value (higher = more valuable).
    
    Args:
        text: Explain text
        
    Returns:
        Score value
    """
    tokens = re.findall(r'\b\w+\b', text.lower())
    
    # Tech keywords worth more
    tech = [
        "motion", "canvas", "remotion", "ffmpeg", "audio", "bus",
        "macro", "cue", "policy", "render", "timeline", "api",
        "database", "supabase", "sora", "openai", "tts",
    ]
    verbs = [
        "build", "mix", "generate", "render", "lock", "prevent",
        "add", "compile", "export", "create", "deploy",
    ]
    
    score = 0
    for t in tokens:
        if t in tech:
            score += 3
        if t in verbs:
            score += 2
        if len(t) >= 8:
            score += 1
    
    # Prefer shorter lines (snappier)
    score += max(0, 40 - len(text)) * 0.05
    
    return score


def shorten_explain(text: str, max_length: int = 140) -> str:
    """
    Shorten an EXPLAIN line by keeping first clause.
    
    Args:
        text: Explain text
        max_length: Max character length
        
    Returns:
        Shortened text
    """
    t = text.strip()
    
    # Split into clauses
    parts = re.split(r'[.;:—-]\s+', t)
    parts = [p.strip() for p in parts if p.strip()]
    
    if len(parts) <= 1:
        return t[:max_length - 2] + "…" if len(t) > max_length else t
    
    # Keep first clause + optionally second if it's a continuation
    first = parts[0]
    second = parts[1] if len(parts) > 1 else ""
    
    keep_second = bool(re.match(r'^(so|then|because|which|that)', second, re.IGNORECASE))
    
    result = f"{first}. {second}" if keep_second else first
    
    return result[:max_length - 2] + "…" if len(result) > max_length else result


def merge_explains(lines: list[str], max_lines: int) -> list[str]:
    """
    Merge explain lines into fewer lines.
    
    Args:
        lines: Explain line texts
        max_lines: Max number of lines
        
    Returns:
        Merged lines
    """
    if len(lines) <= max_lines:
        return lines
    
    merged = []
    per = (len(lines) + max_lines - 1) // max_lines
    
    for i in range(0, len(lines), per):
        chunk = lines[i:i + per]
        shortened = [shorten_explain(l, 100) for l in chunk]
        merged.append(" ".join(shortened))
    
    return merged


def trim_trailing_clauses(text: str, target_reduction: float = 0.3) -> str:
    """
    Trim trailing clauses from text.
    
    Args:
        text: Text to trim
        target_reduction: Target reduction ratio
        
    Returns:
        Trimmed text
    """
    parts = re.split(r'[.;:—-]\s+', text)
    parts = [p.strip() for p in parts if p.strip()]
    
    if len(parts) <= 1:
        # Just truncate
        target_len = int(len(text) * (1 - target_reduction))
        return text[:target_len].rstrip() + "…" if target_len < len(text) else text
    
    # Remove last clause
    result = ". ".join(parts[:-1])
    return result


def normalize_outline_to_duration(
    outline_text: str,
    config: Optional[NormalizeConfig] = None,
) -> dict:
    """
    Normalize outline to target duration.
    
    Args:
        outline_text: Raw outline text
        config: Normalization config
        
    Returns:
        Dict with 'outline' and 'seconds'
    """
    cfg = config or DEFAULT_NORMALIZE_CONFIG
    
    lines = parse_outline(outline_text)
    
    # Separate explains from others
    explains = [l for l in lines if l.key == "EXPLAIN"]
    others = [l for l in lines if l.key != "EXPLAIN"]
    
    # Shorten all explains initially
    explains = [OutlineLine(key=e.key, text=shorten_explain(e.text), action=e.action) for e in explains]
    
    def rebuild(new_explains: list[OutlineLine]) -> list[OutlineLine]:
        """Rebuild outline with new explains in original positions."""
        result = []
        ei = 0
        
        for l in lines:
            if l.key == "EXPLAIN":
                if ei < len(new_explains):
                    result.append(new_explains[ei])
                    ei += 1
            else:
                result.append(l)
        
        # Append any extras
        while ei < len(new_explains):
            result.append(new_explains[ei])
            ei += 1
        
        return result
    
    # Start with shortened explains
    current = rebuild(explains)
    total = estimate_outline_seconds(current)
    
    # Check if already within target
    if abs(total - cfg.target_seconds) <= cfg.tolerance_seconds:
        return {"outline": outline_to_text(current), "seconds": total}
    
    # If too long: drop low-value explains first
    if total > cfg.target_seconds + cfg.tolerance_seconds:
        # Score and sort
        scored = [(e, explain_score(e.text)) for e in explains]
        scored.sort(key=lambda x: x[1])
        
        # Drop lowest until within budget
        while len(scored) > 1:
            scored.pop(0)
            kept = [e for e, _ in scored]
            current = rebuild(kept)
            total = estimate_outline_seconds(current)
            
            if total <= cfg.target_seconds + cfg.tolerance_seconds:
                break
        
        # If still too long, merge remaining
        if total > cfg.target_seconds + cfg.tolerance_seconds:
            texts = [e.text for e, _ in scored]
            merged_texts = merge_explains(texts, cfg.max_explain_lines)
            
            merged = [
                OutlineLine(key="EXPLAIN", text=t, action="explain")
                for t in merged_texts
            ]
            
            current = rebuild(merged)
            total = estimate_outline_seconds(current)
        
        # Hard clamp: trim longest explain if still over
        while total > cfg.target_seconds + cfg.tolerance_seconds:
            explain_indices = [i for i, l in enumerate(current) if l.key == "EXPLAIN"]
            if not explain_indices:
                break
            
            # Find longest explain
            longest_idx = max(
                explain_indices,
                key=lambda i: estimate_seconds_for_action(current[i].text, "explain")
            )
            
            # Trim it
            old_text = current[longest_idx].text
            new_text = trim_trailing_clauses(old_text)
            
            if new_text == old_text:
                # Can't trim more
                break
            
            current[longest_idx] = OutlineLine(key="EXPLAIN", text=new_text, action="explain")
            total = estimate_outline_seconds(current)
    
    return {"outline": outline_to_text(current), "seconds": total}


def normalize_story_ir_duration(
    ir: dict,
    target_seconds: float = 58.0,
    tolerance_seconds: float = 1.5,
) -> dict:
    """
    Normalize Story IR beats to target duration.
    
    Args:
        ir: Story IR dict
        target_seconds: Target duration
        tolerance_seconds: Tolerance
        
    Returns:
        Updated Story IR
    """
    beats = ir.get("beats", [])
    
    total = sum(b.get("duration_s") or b.get("durationS", 0) for b in beats)
    
    if abs(total - target_seconds) <= tolerance_seconds:
        return ir  # Already within target
    
    if total <= target_seconds:
        return ir  # Too short, don't expand
    
    # Need to compress
    ratio = target_seconds / total
    
    # Apply ratio to STEP beats only (preserve HOOK, CTA durations)
    updated_beats = []
    for beat in beats:
        beat_type = beat.get("type", "STEP")
        duration = beat.get("duration_s") or beat.get("durationS", 3)
        
        if beat_type == "STEP":
            new_duration = max(1.5, duration * ratio)
        else:
            new_duration = duration
        
        updated = dict(beat)
        updated["duration_s"] = round(new_duration, 2)
        if "durationS" in updated:
            updated["durationS"] = round(new_duration, 2)
        
        updated_beats.append(updated)
    
    return {
        **ir,
        "beats": updated_beats,
        "normalization": {
            "originalSeconds": total,
            "targetSeconds": target_seconds,
            "ratio": ratio,
        },
    }
