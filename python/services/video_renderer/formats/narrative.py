"""
Narrative Format (v1)
=====================
Story-driven narrative format with smooth transitions.
Best for: Storytelling, case studies, journey narratives.
"""

NARRATIVE_V1 = {
    "format_id": "narrative_v1",
    "name": "Narrative Video",
    "description": "Story-driven narrative format with smooth transitions",
    "layout": "single_focus",
    "scene_order": ["intro", "item_loop", "outro"],
    "item_mapping": {
        "source": "items",
        "scene": "NarrativeScene",
        "filter": {
            "type": "scene"
        }
    },
    "timing": {
        "per_item_seconds": 90,
        "transition_seconds": 1.0,
        "intro_seconds": 8,
        "outro_seconds": 8
    },
    "visuals": {
        "background": "#1a1a2e",
        "zoom": True,
        "accent_color": "#E91E63",
        "text_color": "#ffffff",
        "font_family": "Georgia",
        "font_size": 68
    },
    "audio": {
        "voiceover": True,
        "music": True,
        "sound_effects": True
    },
    "dimensions": {
        "width": 1920,
        "height": 1080,
        "aspect_ratio": "16:9"
    }
}

