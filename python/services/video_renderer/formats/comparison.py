"""
Comparison Format (v1)
======================
Split-screen comparison format for side-by-side content.
Best for: Product comparisons, before/after, pros/cons.
"""

COMPARISON_V1 = {
    "format_id": "comparison_v1",
    "name": "Comparison Video",
    "description": "Split-screen comparison format for side-by-side content",
    "layout": "split",
    "scene_order": ["intro", "item_loop", "outro"],
    "item_mapping": {
        "source": "items",
        "scene": "ComparisonScene",
        "filter": {
            "type": "comparison"
        }
    },
    "timing": {
        "per_item_seconds": 45,
        "transition_seconds": 0.6,
        "intro_seconds": 5,
        "outro_seconds": 5
    },
    "visuals": {
        "background": "#0a0a0a",
        "zoom": False,
        "accent_color": "#2196F3",
        "text_color": "#ffffff",
        "font_family": "Arial",
        "font_size": 60
    },
    "audio": {
        "voiceover": True,
        "music": False,
        "sound_effects": True
    },
    "dimensions": {
        "width": 1920,
        "height": 1080,
        "aspect_ratio": "16:9"
    }
}

