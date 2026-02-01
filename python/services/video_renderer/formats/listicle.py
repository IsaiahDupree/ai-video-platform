"""
Listicle Format (v1)
====================
Fast-paced list format with grid intro and quick topic cuts.
Best for: Top 10 lists, feature highlights, quick tips.
"""

LISTICLE_V1 = {
    "format_id": "listicle_v1",
    "name": "Listicle Video",
    "description": "Fast-paced list format with grid intro and quick topic cuts",
    "layout": "grid",
    "scene_order": ["intro", "grid_intro", "item_loop", "outro"],
    "item_mapping": {
        "source": "items",
        "scene": "TopicScene",
        "filter": {
            "type": "topic"
        }
    },
    "timing": {
        "per_item_seconds": 15,
        "transition_seconds": 0.3,
        "intro_seconds": 3,
        "outro_seconds": 3
    },
    "visuals": {
        "background": "#1a1a1a",
        "zoom": False,
        "accent_color": "#4CAF50",
        "text_color": "#ffffff",
        "font_family": "Arial",
        "font_size": 56
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

