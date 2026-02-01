"""
Script Classifier

Rule-based script-to-outline conversion without LLM.
Classifies sentences into beat buckets (HOOK, PROBLEM, ERROR, REVEAL, etc.)
"""

import re
from typing import Optional, Literal
from pydantic import BaseModel, Field


BeatBucket = Literal[
    "HOOK", "PROBLEM", "ERROR", "REVEAL", "EXPLAIN",
    "CODE", "SUCCESS", "CTA", "TRANSITION", "PUNCHLINE", "OTHER"
]


class ClassificationRule(BaseModel):
    """A rule for classifying sentences."""
    bucket: BeatBucket
    patterns: list[str]
    priority: int = Field(default=0, ge=0)


# Default classification patterns
DEFAULT_PATTERNS: dict[BeatBucket, list[str]] = {
    "CODE": [
        r"(^\s*[$>]\s*)",
        r"\b(pnpm|npm|yarn|bun|git|node|ts-node|ffmpeg|python|pip)\b",
        r"\b(run|install|build|deploy|execute)\s+(the\s+)?command\b",
        r"`[^`]+`",
    ],
    "CTA": [
        r"\b(comment|dm|download|template|follow|subscribe|waitlist|link in bio|join|sign up)\b",
        r"\b(drop a|leave a|hit the)\s+(comment|like|follow)\b",
    ],
    "REVEAL": [
        r"\b(here'?s the fix|the fix is|the trick is|the solution is|what changed|this is the key)\b",
        r"\b(the secret|the answer|what worked|how i fixed)\b",
        r"\b(i changed the approach|the real fix|turns out)\b",
    ],
    "ERROR": [
        r"\b(error|failed|fail|broken|bug|crash|drift|offset|issue)\b",
        r"\b(didn'?t work|broke|crashed|threw|exception)\b",
        r"😭|💀|😤|🤦",
    ],
    "SUCCESS": [
        r"\b(success|fixed|works|working|passed|deploy|deployed|ship|shipped|done|solved)\b",
        r"\b(finally|it worked|nailed it|perfect)\b",
        r"✅|🎉|💪|🚀",
    ],
    "PROBLEM": [
        r"\b(the problem|issue is|hard part|nightmare|messy|pain|annoying|frustrating)\b",
        r"\b(challenge|difficult|tricky|complicated)\b",
    ],
    "HOOK": [
        r"\b(i tried|today i|i built|i was trying|i attempted|i wanted to)\b",
        r"\b(ever wondered|did you know|what if|imagine)\b",
        r"^(so\s+)?i\s+",
    ],
    "TRANSITION": [
        r"\b(next|now|then|after that|moving on|so anyway|let'?s)\b",
        r"\b(step \d|first|second|third|finally)\b",
    ],
    "PUNCHLINE": [
        r"\b(plot twist|surprise|but wait|guess what)\b",
        r"\b(the funny thing|ironically|spoiler)\b",
    ],
}


def compile_patterns(patterns: dict[BeatBucket, list[str]]) -> dict[BeatBucket, re.Pattern]:
    """Compile patterns into regex objects."""
    compiled = {}
    for bucket, pattern_list in patterns.items():
        combined = "|".join(f"({p})" for p in pattern_list)
        compiled[bucket] = re.compile(combined, re.IGNORECASE)
    return compiled


COMPILED_PATTERNS = compile_patterns(DEFAULT_PATTERNS)


# Priority order for classification
BUCKET_PRIORITY: list[BeatBucket] = [
    "CODE", "CTA", "REVEAL", "ERROR", "SUCCESS", "PROBLEM", "HOOK", "TRANSITION", "PUNCHLINE"
]


def classify_sentence(text: str, patterns: Optional[dict] = None) -> BeatBucket:
    """
    Classify a sentence into a beat bucket.
    
    Args:
        text: Sentence to classify
        patterns: Optional custom compiled patterns
        
    Returns:
        BeatBucket classification
    """
    t = text.strip()
    if not t:
        return "OTHER"
    
    compiled = patterns or COMPILED_PATTERNS
    
    for bucket in BUCKET_PRIORITY:
        if bucket in compiled and compiled[bucket].search(t):
            return bucket
    
    return "EXPLAIN"  # Default for unmatched content


def split_sentences(raw: str) -> list[str]:
    """
    Split raw text into sentences.
    
    Args:
        raw: Raw script text
        
    Returns:
        List of sentences
    """
    # Normalize quotes and whitespace
    cleaned = raw.replace("\r", "")
    cleaned = re.sub(r'["""]', '"', cleaned)
    cleaned = re.sub(r"['']", "'", cleaned)
    cleaned = cleaned.strip()
    
    # Split on sentence boundaries and newlines
    parts = re.split(r'(?<=[.!?])\s+|\n+', cleaned)
    parts = [s.strip() for s in parts if s.strip()]
    
    # Merge very short fragments
    merged = []
    for p in parts:
        if len(p) < 18 and merged:
            merged[-1] += " " + p
        else:
            merged.append(p)
    
    return merged


def classify_script(raw: str) -> dict[BeatBucket, list[str]]:
    """
    Classify a raw script into buckets.
    
    Args:
        raw: Raw script text
        
    Returns:
        Dict mapping bucket to list of sentences
    """
    sentences = split_sentences(raw)
    
    buckets: dict[BeatBucket, list[str]] = {
        bucket: [] for bucket in ["HOOK", "PROBLEM", "ERROR", "REVEAL", "EXPLAIN",
                                   "CODE", "SUCCESS", "CTA", "TRANSITION", "PUNCHLINE", "OTHER"]
    }
    
    for sentence in sentences:
        bucket = classify_sentence(sentence)
        buckets[bucket].append(sentence)
    
    return buckets


def pick_first(items: list[str], fallback: str) -> str:
    """Pick first item or use fallback."""
    return items[0].strip() if items else fallback


def join_top(items: list[str], n: int) -> str:
    """Join top N items."""
    return " ".join(items[:n]).strip()


def script_to_outline(raw: str) -> str:
    """
    Convert raw script to structured outline.
    
    Args:
        raw: Raw script text
        
    Returns:
        Structured outline text
    """
    sentences = split_sentences(raw)
    buckets = classify_script(raw)
    
    # Build narrative structure
    hook = pick_first(buckets["HOOK"], pick_first(sentences, "Today I built something."))
    problem = pick_first(buckets["PROBLEM"], "The problem is it gets messy to keep everything in sync.")
    error = pick_first(buckets["ERROR"], "It failed in a way that was hard to debug.")
    reveal = pick_first(buckets["REVEAL"], "Here's the fix.")
    explain = join_top(buckets["EXPLAIN"], 3) or "So here's how it works."
    code = pick_first(buckets["CODE"], "pnpm mc:hybrid:final")
    success = pick_first(buckets["SUCCESS"], "Now it works and stays locked.")
    cta = pick_first(buckets["CTA"], "Comment TECH if you want the template.")
    
    # Build outline
    lines = [
        f"HOOK: {hook}",
        f"PROBLEM: {problem}",
        f"ERROR: {error}",
        f"REVEAL: {reveal}",
    ]
    
    # Split explain into multiple lines
    explain_parts = re.split(r'(?<=[.!?])\s+', explain)
    for part in explain_parts[:3]:
        if part.strip():
            lines.append(f"EXPLAIN: {part.strip()}")
    
    lines.extend([
        f"CODE: {code}",
        f"SUCCESS: {success}",
        f"CTA: {cta}",
    ])
    
    return "\n".join(lines)


def outline_to_beats(outline: str, fps: int = 30) -> list[dict]:
    """
    Convert outline text to beat list.
    
    Args:
        outline: Structured outline text
        fps: Frames per second
        
    Returns:
        List of beat dicts
    """
    # Use local estimate_beat_duration defined below
    
    beats = []
    t = 0
    
    lines = [l.strip() for l in outline.split("\n") if l.strip() and not l.startswith("#")]
    
    for i, line in enumerate(lines):
        match = re.match(r'^([A-Z_]+)\s*:\s*(.+)$', line)
        if not match:
            continue
        
        bucket = match.group(1).upper()
        text = match.group(2).strip()
        
        # Map bucket to action
        action_map = {
            "HOOK": "hook",
            "PROBLEM": "problem",
            "ERROR": "error",
            "REVEAL": "reveal",
            "EXPLAIN": "explain",
            "CODE": "code",
            "SUCCESS": "success",
            "CTA": "cta",
            "TRANSITION": "transition",
            "PUNCHLINE": "punchline",
        }
        action = action_map.get(bucket, "explain")
        
        # Estimate duration
        duration = estimate_beat_duration(text, action)
        
        beat_id = f"b{str(i + 1).zfill(2)}_{action}"
        event = f"{action}_{slugify(text)[:20]}"
        
        beats.append({
            "beatId": beat_id,
            "t": round(t, 3),
            "text": text,
            "action": action,
            "event": event,
            "durationS": duration,
        })
        
        t += duration
    
    return beats


def estimate_beat_duration(text: str, action: str) -> float:
    """Estimate beat duration based on text and action."""
    words = len(text.split())
    
    # Words per second by action type
    wps_map = {
        "hook": 3.2,
        "reveal": 2.8,
        "code": 2.2,
        "error": 2.6,
        "success": 2.8,
        "cta": 2.6,
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


def slugify(text: str) -> str:
    """Convert text to slug."""
    slug = text.lower()
    slug = re.sub(r'[^a-z0-9]+', '_', slug)
    slug = re.sub(r'^_+|_+$', '', slug)
    return slug[:48]


def script_to_story_ir(
    raw: str,
    title: str = "Untitled",
    fps: int = 30,
) -> dict:
    """
    Convert raw script directly to Story IR.
    
    Args:
        raw: Raw script text
        title: Video title
        fps: Frames per second
        
    Returns:
        Story IR dict
    """
    outline = script_to_outline(raw)
    beats = outline_to_beats(outline, fps)
    
    # Convert beats format
    ir_beats = []
    for beat in beats:
        beat_type = "STEP"
        if beat["action"] == "hook":
            beat_type = "HOOK"
        elif beat["action"] == "cta":
            beat_type = "CTA"
        elif beat["action"] in ("reveal", "success"):
            beat_type = "PROOF"
        
        ir_beats.append({
            "id": beat["beatId"],
            "type": beat_type,
            "narration": beat["text"],
            "duration_s": beat["durationS"],
            "action": beat["action"],
            "on_screen": {
                "headline": beat["text"] if beat["action"] in ("hook", "reveal") else None,
            },
        })
    
    total_duration = sum(b["duration_s"] for b in ir_beats)
    
    return {
        "version": "1.0.0",
        "meta": {
            "title": title,
            "fps": fps,
            "aspect": "9:16",
            "totalDuration_s": total_duration,
        },
        "beats": ir_beats,
    }
