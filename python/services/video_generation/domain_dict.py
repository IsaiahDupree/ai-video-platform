"""
Domain Dictionary

Niche-specific keyword dictionary for smarter script classification.
Improves EXPLAIN vs REVEAL vs CODE bucket detection.
"""

import re
import json
from typing import Optional
from pathlib import Path
from pydantic import BaseModel, Field


class Domain(BaseModel):
    """A domain with keywords."""
    name: str
    keywords: list[str]


class DomainSignals(BaseModel):
    """Signal phrases for classification."""
    reveal_phrases: list[str] = Field(default_factory=list, alias="revealPhrases")
    transition_phrases: list[str] = Field(default_factory=list, alias="transitionPhrases")
    error_phrases: list[str] = Field(default_factory=list, alias="errorPhrases")
    success_phrases: list[str] = Field(default_factory=list, alias="successPhrases")
    cta_phrases: list[str] = Field(default_factory=list, alias="ctaPhrases")
    code_markers: list[str] = Field(default_factory=list, alias="codeMarkers")
    
    class Config:
        populate_by_name = True


class DomainDict(BaseModel):
    """Complete domain dictionary."""
    version: str = "1.0.0"
    domains: list[Domain] = Field(default_factory=list)
    signals: DomainSignals = Field(default_factory=DomainSignals)


# Default domain dictionary for video/dev content
DEFAULT_DOMAIN_DICT = DomainDict(
    version="1.0.0",
    domains=[
        Domain(
            name="video_tooling",
            keywords=[
                "motion canvas", "remotion", "ffmpeg", "timeline", "render",
                "exporter", "audio bus", "sfx", "cue sheet", "whoosh", "riser",
                "keyframe", "composition", "sequence", "layer", "overlay",
            ]
        ),
        Domain(
            name="automation",
            keywords=[
                "n8n", "make.com", "zapier", "webhook", "workflow", "trigger",
                "agent", "pipeline", "automation", "cron", "scheduler",
            ]
        ),
        Domain(
            name="backend",
            keywords=[
                "supabase", "rls", "postgres", "stripe", "revenuecat", "oauth",
                "jwt", "vercel", "api", "endpoint", "database", "auth",
                "fastapi", "express", "django", "flask",
            ]
        ),
        Domain(
            name="analytics",
            keywords=[
                "posthog", "events", "funnel", "retention", "session replay",
                "cohort", "utm", "analytics", "metrics", "tracking",
            ]
        ),
        Domain(
            name="ai_ml",
            keywords=[
                "openai", "gpt", "claude", "llm", "sora", "stable diffusion",
                "hugging face", "tts", "embedding", "vector", "rag",
            ]
        ),
    ],
    signals=DomainSignals(
        reveal_phrases=[
            "here's the fix", "the fix is", "the trick is", "the solution is",
            "what changed", "this is the key", "the secret", "the answer",
            "what worked", "how i fixed", "i changed the approach", "turns out",
        ],
        transition_phrases=[
            "next", "now", "then", "after that", "moving on", "so anyway",
            "let's", "step", "first", "second", "third", "finally",
        ],
        error_phrases=[
            "failed", "error", "broke", "crashed", "drift", "offset", "bug",
            "issue", "didn't work", "exception", "timeout", "404", "500",
        ],
        success_phrases=[
            "fixed", "works", "working", "passed", "deployed", "ship",
            "shipped", "solved", "done", "success", "finally", "nailed it",
        ],
        cta_phrases=[
            "comment", "dm", "download", "template", "follow", "subscribe",
            "join", "waitlist", "link in bio", "save this", "share",
        ],
        code_markers=[
            "pnpm", "npm", "yarn", "bun", "git", "ffmpeg", "ts-node",
            "python", "pip", "docker", "kubectl", "$", ">", "`",
        ],
    ),
)


def load_domain_dict(path: Optional[str] = None) -> DomainDict:
    """
    Load domain dictionary from file or use default.
    
    Args:
        path: Optional path to domain_dict.json
        
    Returns:
        DomainDict
    """
    if path and Path(path).exists():
        with open(path, "r") as f:
            data = json.load(f)
        return DomainDict.model_validate(data)
    
    return DEFAULT_DOMAIN_DICT


def save_domain_dict(dict_: DomainDict, path: str) -> str:
    """Save domain dictionary to file."""
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(dict_.model_dump(by_alias=True), f, indent=2)
    return path


def count_keyword_hits(text: str, keywords: list[str]) -> int:
    """
    Count how many keywords appear in text.
    
    Args:
        text: Text to search
        keywords: Keywords to look for
        
    Returns:
        Number of keyword hits
    """
    lower = text.lower()
    hits = 0
    
    for k in keywords:
        if k and k.lower() in lower:
            hits += 1
    
    return hits


def has_any_phrase(text: str, phrases: list[str]) -> bool:
    """
    Check if text contains any of the phrases.
    
    Args:
        text: Text to search
        phrases: Phrases to look for
        
    Returns:
        True if any phrase found
    """
    lower = text.lower()
    return any(p and p.lower() in lower for p in phrases)


def get_domain_score(text: str, domain_dict: Optional[DomainDict] = None) -> int:
    """
    Get total keyword hits across all domains.
    
    Args:
        text: Text to score
        domain_dict: Domain dictionary
        
    Returns:
        Total keyword hits
    """
    dd = domain_dict or DEFAULT_DOMAIN_DICT
    
    total = 0
    for domain in dd.domains:
        total += count_keyword_hits(text, domain.keywords)
    
    return total


def looks_like_code_line(text: str, domain_dict: Optional[DomainDict] = None) -> bool:
    """
    Check if text looks like a code/command line.
    
    Args:
        text: Text to check
        domain_dict: Domain dictionary
        
    Returns:
        True if looks like code
    """
    t = text.strip()
    
    # Shell prompt prefix
    if re.match(r'^\s*[$>]', t):
        return True
    
    # Backtick code
    if '`' in t:
        return True
    
    dd = domain_dict or DEFAULT_DOMAIN_DICT
    markers = dd.signals.code_markers
    
    return any(m and m.lower() in t.lower() for m in markers)


def classify_sentence_smart(
    text: str,
    domain_dict: Optional[DomainDict] = None,
) -> str:
    """
    Smart classification using domain dictionary.
    
    Args:
        text: Sentence to classify
        domain_dict: Domain dictionary
        
    Returns:
        Bucket name (HOOK, PROBLEM, ERROR, REVEAL, EXPLAIN, CODE, SUCCESS, CTA, TRANSITION, OTHER)
    """
    t = text.strip()
    if not t:
        return "OTHER"
    
    dd = domain_dict or DEFAULT_DOMAIN_DICT
    lower = t.lower()
    
    # Strong signals (priority order)
    if looks_like_code_line(t, dd):
        return "CODE"
    
    if has_any_phrase(lower, dd.signals.cta_phrases):
        return "CTA"
    
    if has_any_phrase(lower, dd.signals.reveal_phrases):
        return "REVEAL"
    
    if has_any_phrase(lower, dd.signals.error_phrases):
        return "ERROR"
    
    if has_any_phrase(lower, dd.signals.success_phrases):
        return "SUCCESS"
    
    if has_any_phrase(lower, dd.signals.transition_phrases):
        return "TRANSITION"
    
    # Score domain keyword density
    domain_hits = get_domain_score(lower, dd)
    
    # Hook heuristics
    hook_patterns = [
        r'\b(i tried|today i|i built|i was trying|i attempted|watch this)\b',
        r'^(so\s+)?i\s+',
    ]
    is_hookish = any(re.search(p, t, re.IGNORECASE) for p in hook_patterns)
    is_hookish = is_hookish or (len(t) < 90 and domain_hits > 0)
    
    if is_hookish:
        return "HOOK"
    
    # Problem heuristics
    problem_patterns = [
        r'\b(problem|issue|hard part|nightmare|messy|pain|annoying|confusing|frustrating)\b',
    ]
    if any(re.search(p, t, re.IGNORECASE) for p in problem_patterns):
        return "PROBLEM"
    
    # Dense domain keywords = explanation
    if domain_hits >= 2:
        return "EXPLAIN"
    
    return "EXPLAIN"


def extract_domain_keywords(
    text: str,
    domain_dict: Optional[DomainDict] = None,
    max_keywords: int = 6,
) -> list[str]:
    """
    Extract domain keywords from text for visual reveals.
    
    Args:
        text: Text to extract from
        domain_dict: Domain dictionary
        max_keywords: Max keywords to return
        
    Returns:
        List of keywords found
    """
    dd = domain_dict or DEFAULT_DOMAIN_DICT
    lower = text.lower()
    
    hits: list[tuple[str, int]] = []
    
    for domain in dd.domains:
        for keyword in domain.keywords:
            if keyword.lower() in lower:
                # Score by length (longer = more specific)
                hits.append((keyword, len(keyword)))
    
    # Dedupe and sort by score
    unique = {}
    for k, score in hits:
        unique[k] = max(unique.get(k, 0), score)
    
    sorted_hits = sorted(unique.items(), key=lambda x: -x[1])
    
    return [k for k, _ in sorted_hits[:max_keywords]]
