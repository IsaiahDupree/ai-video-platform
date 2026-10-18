"""
Format Selector

Auto-selects the best format pack based on trend data and content brief.
"""

import json
from pathlib import Path
from typing import Optional

from .types import (
    TrendItemV1,
    ContentBriefV1,
    FormatPackV1,
    FormatTraits,
    FormatRules,
    RenderStrategy,
    BeatType,
)


# Built-in format packs
BUILTIN_FORMAT_PACKS: dict[str, FormatPackV1] = {}


def _init_builtin_packs():
    """Initialize built-in format packs."""
    global BUILTIN_FORMAT_PACKS
    
    # Listicle Stick Figure - Sora heavy
    BUILTIN_FORMAT_PACKS["listicle_stickfigure_v1"] = FormatPackV1(
        id="listicle_stickfigure_v1",
        label="Stick Figure Listicle",
        family="explainer",
        rules=FormatRules(
            ordering=["HOOK", "PROMISE", "STEP*", "CTA"],
            defaults={
                "HOOK": {"duration_s": 2.5},
                "PROMISE": {"duration_s": 3.0},
                "STEP": {"duration_s": 4.5},
                "CTA": {"duration_s": 2.0},
            },
            constraints={
                "max_total_s": 58,
                "max_steps": 8,
            },
        ),
        render_strategy=RenderStrategy(
            sora_beat_types=[BeatType.HOOK, BeatType.STEP, BeatType.PROOF],
            native_beat_types=[BeatType.PROMISE, BeatType.CTA, BeatType.OUTRO],
        ),
        component_map={
            "PROMISE": "ScenePromiseCard",
            "CTA": "SceneCTA",
            "OUTRO": "SceneCTA",
        },
        traits=FormatTraits(
            pace="fast",
            meme_density="mid",
            sora_reliance="high",
            native_reliance="mid",
            best_for_platforms=["youtube", "tiktok", "instagram"],
            best_for_goals=["educate", "entertain", "sell"],
        ),
    )
    
    # Dev Vlog - Native heavy
    BUILTIN_FORMAT_PACKS["devlog_screen_v1"] = FormatPackV1(
        id="devlog_screen_v1",
        label="Dev Vlog Screen Record",
        family="devlog",
        rules=FormatRules(
            ordering=["HOOK", "PROMISE", "STEP*", "PROOF", "CTA"],
            defaults={
                "HOOK": {"duration_s": 2.5},
                "STEP": {"duration_s": 6.0},
                "PROOF": {"duration_s": 4.0},
                "CTA": {"duration_s": 2.0},
            },
            constraints={
                "max_total_s": 58,
                "max_steps": 6,
            },
        ),
        render_strategy=RenderStrategy(
            sora_beat_types=[BeatType.PROOF],
            native_beat_types=[BeatType.HOOK, BeatType.PROMISE, BeatType.STEP, BeatType.CTA, BeatType.OUTRO],
        ),
        component_map={
            "HOOK": "SceneTitlePunch",
            "PROMISE": "ScenePromiseCard",
            "STEP": "SceneStepBullet",
            "CTA": "SceneCTA",
        },
        traits=FormatTraits(
            pace="mid",
            meme_density="low",
            sora_reliance="low",
            native_reliance="high",
            best_for_platforms=["youtube"],
            best_for_goals=["educate", "nurture", "sell"],
        ),
    )
    
    # Documentary B-Roll
    BUILTIN_FORMAT_PACKS["doc_broll_v1"] = FormatPackV1(
        id="doc_broll_v1",
        label="Documentary B-Roll Style",
        family="documentary",
        rules=FormatRules(
            ordering=["HOOK", "PROMISE", "PROOF", "STEP*", "CTA"],
            defaults={
                "PROOF": {"duration_s": 6.0},
                "STEP": {"duration_s": 5.5},
            },
            constraints={
                "max_total_s": 58,
                "max_steps": 6,
            },
        ),
        render_strategy=RenderStrategy(
            sora_beat_types=[BeatType.PROOF, BeatType.HOOK],
            native_beat_types=[BeatType.PROMISE, BeatType.STEP, BeatType.CTA, BeatType.OUTRO],
        ),
        component_map={
            "PROMISE": "ScenePromiseCard",
            "STEP": "SceneStepBullet",
            "CTA": "SceneCTA",
        },
        traits=FormatTraits(
            pace="slow",
            meme_density="low",
            sora_reliance="mid",
            native_reliance="mid",
            best_for_platforms=["youtube"],
            best_for_goals=["educate", "nurture"],
        ),
    )


# Initialize on module load
_init_builtin_packs()


def get_available_formats() -> list[FormatPackV1]:
    """
    Get all available format packs.
    
    Returns:
        List of format packs
    """
    return list(BUILTIN_FORMAT_PACKS.values())


def get_format_by_id(format_id: str) -> Optional[FormatPackV1]:
    """
    Get a specific format pack by ID.
    
    Args:
        format_id: The format pack ID
        
    Returns:
        FormatPackV1 or None
    """
    return BUILTIN_FORMAT_PACKS.get(format_id)


def load_format_from_file(path: str | Path) -> FormatPackV1:
    """
    Load a format pack from a JSON file.
    
    Args:
        path: Path to JSON file
        
    Returns:
        FormatPackV1
    """
    with open(path, "r") as f:
        data = json.load(f)
    return FormatPackV1.model_validate(data)


def score_format(
    pack: FormatPackV1,
    trend: TrendItemV1,
    brief: ContentBriefV1,
    prefer_sora: bool = True,
    have_screen_record: bool = False,
) -> int:
    """
    Score a format pack for the given inputs.
    
    Args:
        pack: Format pack to score
        trend: Trend data
        brief: Content brief
        prefer_sora: Whether to prefer Sora-heavy formats
        have_screen_record: Whether screen recordings are available
        
    Returns:
        Score (higher is better)
    """
    if not pack.traits:
        return 0
    
    score = 0
    traits = pack.traits
    
    # Platform fit (+3)
    if trend.platform in traits.best_for_platforms:
        score += 3
    
    # Goal fit (+3)
    if brief.goal in traits.best_for_goals:
        score += 3
    
    # Sora preference
    if prefer_sora:
        if traits.sora_reliance == "high":
            score += 3
        elif traits.sora_reliance == "mid":
            score += 1
        else:
            score -= 2
    
    # Screen record availability
    if not have_screen_record and pack.id == "devlog_screen_v1":
        score -= 4
    
    # Content density
    key_points = len(brief.key_points)
    if key_points >= 6:
        if traits.pace == "fast":
            score += 2
        elif traits.pace == "mid":
            score += 1
        else:
            score -= 1
    elif key_points <= 3:
        if traits.pace == "slow":
            score += 2
    
    # Evidence presence favors doc/devlog
    evidence_count = len(trend.evidence)
    if evidence_count >= 3:
        if pack.family == "documentary":
            score += 2
        elif pack.family == "devlog":
            score += 1
    
    # Max steps constraint
    max_steps = pack.rules.constraints.get("max_steps", 8)
    if key_points > max_steps:
        score -= 2
    
    return score


def select_format(
    trend: TrendItemV1,
    brief: ContentBriefV1,
    prefer_sora: bool = True,
    have_screen_record: bool = False,
    available_packs: Optional[list[FormatPackV1]] = None,
) -> dict:
    """
    Select the best format pack for the given inputs.
    
    Args:
        trend: Trend data
        brief: Content brief
        prefer_sora: Whether to prefer Sora-heavy formats
        have_screen_record: Whether screen recordings available
        available_packs: Custom pack list (uses built-ins if None)
        
    Returns:
        Dict with selectedFormatId, format, and ranked list
    """
    packs = available_packs or get_available_formats()
    
    scored = []
    for pack in packs:
        pack_score = score_format(
            pack=pack,
            trend=trend,
            brief=brief,
            prefer_sora=prefer_sora,
            have_screen_record=have_screen_record,
        )
        scored.append((pack, pack_score))
    
    # Sort by score descending
    scored.sort(key=lambda x: x[1], reverse=True)
    
    winner = scored[0][0]
    
    return {
        "selectedFormatId": winner.id,
        "format": winner,
        "ranked": [
            {"id": pack.id, "label": pack.label, "score": score}
            for pack, score in scored
        ],
    }


def register_format_pack(pack: FormatPackV1) -> None:
    """
    Register a custom format pack.
    
    Args:
        pack: Format pack to register
    """
    BUILTIN_FORMAT_PACKS[pack.id] = pack


def unregister_format_pack(format_id: str) -> bool:
    """
    Unregister a format pack.
    
    Args:
        format_id: ID of pack to remove
        
    Returns:
        True if removed, False if not found
    """
    if format_id in BUILTIN_FORMAT_PACKS:
        del BUILTIN_FORMAT_PACKS[format_id]
        return True
    return False
