"""
Character Overlay Variety Manager

Manages character overlay placements to avoid visual boredom.
Rotates preset positions and detects repetitive patterns.
"""

from typing import Optional, Literal
from pydantic import BaseModel, Field


OverlayPreset = Literal[
    "char_bottom_right",
    "char_bottom_left",
    "char_top_right",
    "char_top_left",
    "char_center",
]


DEFAULT_PRESET_CYCLE: list[OverlayPreset] = [
    "char_bottom_right",
    "char_bottom_left",
    "char_top_right",
    "char_center",
]


class CharPlacement(BaseModel):
    """Character placement for a beat."""
    beat_id: str = Field(alias="beatId")
    preset: OverlayPreset
    
    class Config:
        populate_by_name = True


class CharVarietyConfig(BaseModel):
    """Configuration for character variety."""
    max_same_preset_consecutive: int = Field(default=2, alias="maxSamePresetConsecutive")
    preset_cycle: list[OverlayPreset] = Field(
        default_factory=lambda: list(DEFAULT_PRESET_CYCLE),
        alias="presetCycle"
    )
    
    class Config:
        populate_by_name = True


def assign_char_presets_round_robin(
    beat_ids: list[str],
    presets: Optional[list[OverlayPreset]] = None,
    rotate_every: int = 1,
) -> list[CharPlacement]:
    """
    Assign character presets in round-robin fashion.
    
    Args:
        beat_ids: List of beat IDs that need character overlays
        presets: List of presets to cycle through
        rotate_every: Rotate preset every N beats
        
    Returns:
        List of CharPlacement
    """
    presets = presets or DEFAULT_PRESET_CYCLE
    
    placements = []
    for i, beat_id in enumerate(beat_ids):
        slot = (i // rotate_every) % len(presets)
        placements.append(CharPlacement(
            beat_id=beat_id,
            preset=presets[slot],
        ))
    
    return placements


def detect_char_boredom(
    placements: list[CharPlacement],
    max_consecutive: int = 2,
) -> list[int]:
    """
    Detect indices where character placement is boring (too repetitive).
    
    Args:
        placements: List of placements
        max_consecutive: Max allowed consecutive same presets
        
    Returns:
        List of indices that are "boring"
    """
    boring_indices = []
    streak = 1
    
    for i in range(1, len(placements)):
        if placements[i].preset == placements[i - 1].preset:
            streak += 1
            if streak > max_consecutive:
                boring_indices.append(i)
        else:
            streak = 1
    
    return boring_indices


def fix_char_placement_boredom(
    placements: list[CharPlacement],
    config: Optional[CharVarietyConfig] = None,
) -> list[CharPlacement]:
    """
    Fix boring character placements by rotating presets.
    
    Args:
        placements: Original placements
        config: Variety configuration
        
    Returns:
        Fixed placements
    """
    config = config or CharVarietyConfig()
    max_same = config.max_same_preset_consecutive
    presets = config.preset_cycle
    
    if not placements or not presets:
        return placements
    
    result: list[CharPlacement] = []
    streak = 0
    last: Optional[OverlayPreset] = None
    cycle_idx = 0
    
    for p in placements:
        if p.preset == last:
            streak += 1
        else:
            streak = 1
        
        preset = p.preset
        
        if streak > max_same:
            # Find a different preset
            tries = 0
            while tries < len(presets) and presets[cycle_idx] == last:
                cycle_idx = (cycle_idx + 1) % len(presets)
                tries += 1
            
            preset = presets[cycle_idx]
            cycle_idx = (cycle_idx + 1) % len(presets)
            streak = 1
        
        result.append(CharPlacement(beat_id=p.beat_id, preset=preset))
        last = preset
    
    return result


def apply_motion_variety(
    placements: list[CharPlacement],
    motion_probability: float = 0.3,
) -> list[dict]:
    """
    Add motion variety hints to placements.
    
    Args:
        placements: Character placements
        motion_probability: Probability of adding motion
        
    Returns:
        Placements with motion hints
    """
    import random
    
    motion_types = ["slide_in", "bounce", "fade_scale", "none"]
    
    result = []
    for p in placements:
        motion = "none"
        if random.random() < motion_probability:
            motion = random.choice(motion_types[:-1])
        
        result.append({
            **p.model_dump(by_alias=True),
            "motion": motion,
        })
    
    return result


def get_opposite_preset(preset: OverlayPreset) -> OverlayPreset:
    """Get the opposite corner preset."""
    opposites = {
        "char_bottom_right": "char_top_left",
        "char_bottom_left": "char_top_right",
        "char_top_right": "char_bottom_left",
        "char_top_left": "char_bottom_right",
        "char_center": "char_bottom_right",
    }
    return opposites.get(preset, "char_bottom_right")


def create_dramatic_switch_placements(
    beat_ids: list[str],
    switch_every: int = 3,
) -> list[CharPlacement]:
    """
    Create placements that dramatically switch corners.
    
    Good for high-energy content where the character "bounces" around.
    
    Args:
        beat_ids: Beat IDs needing character overlays
        switch_every: Switch corner every N beats
        
    Returns:
        List of CharPlacement with dramatic switches
    """
    corners: list[OverlayPreset] = [
        "char_bottom_right",
        "char_top_left",
        "char_bottom_left", 
        "char_top_right",
    ]
    
    placements = []
    current_corner = 0
    
    for i, beat_id in enumerate(beat_ids):
        if i > 0 and i % switch_every == 0:
            current_corner = (current_corner + 1) % len(corners)
        
        placements.append(CharPlacement(
            beat_id=beat_id,
            preset=corners[current_corner],
        ))
    
    return placements


def merge_char_placements_with_budget(
    budget_char_beats: list[str],
    placements: list[CharPlacement],
) -> dict[str, OverlayPreset]:
    """
    Merge placements with budgeted character beats.
    
    Args:
        budget_char_beats: Beat IDs that have character overlays in budget
        placements: Assigned placements
        
    Returns:
        Dict mapping beat_id to preset
    """
    placement_map = {p.beat_id: p.preset for p in placements}
    
    result = {}
    for beat_id in budget_char_beats:
        if beat_id in placement_map:
            result[beat_id] = placement_map[beat_id]
        else:
            # Default to bottom right
            result[beat_id] = "char_bottom_right"
    
    return result


def get_placement_stats(placements: list[CharPlacement]) -> dict:
    """Get statistics about placements."""
    if not placements:
        return {
            "total": 0,
            "unique_presets": 0,
            "preset_counts": {},
            "max_consecutive": 0,
        }
    
    preset_counts: dict[str, int] = {}
    for p in placements:
        preset_counts[p.preset] = preset_counts.get(p.preset, 0) + 1
    
    # Calculate max consecutive
    max_consecutive = 1
    current_streak = 1
    for i in range(1, len(placements)):
        if placements[i].preset == placements[i - 1].preset:
            current_streak += 1
            max_consecutive = max(max_consecutive, current_streak)
        else:
            current_streak = 1
    
    return {
        "total": len(placements),
        "unique_presets": len(preset_counts),
        "preset_counts": preset_counts,
        "max_consecutive": max_consecutive,
    }
