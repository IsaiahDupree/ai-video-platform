"""
Shorts Format (v1)
==================
Vertical short-form content optimized for mobile.
Best for: TikTok, Instagram Reels, YouTube Shorts.
"""

SHORTS_V1 = {
    "format_id": "shorts_v1",
    "name": "Short-Form Video",
    "description": "Vertical short-form content optimized for mobile",
    "layout": "single_focus",
    "scene_order": ["hook", "item_loop", "cta"],
    "item_mapping": {
        "source": "items",
        "scene": "ShortScene",
        "filter": {
            "type": "beat"
        }
    },
    "timing": {
        "per_item_seconds": 5,
        "transition_seconds": 0.2,
        "intro_seconds": 2,
        "outro_seconds": 2
    },
    "visuals": {
        "background": "#000000",
        "zoom": True,
        "accent_color": "#FF1744",
        "text_color": "#ffffff",
        "font_family": "Arial",
        "font_size": 72
    },
    "audio": {
        "voiceover": True,
        "music": True,
        "sound_effects": True
    },
    "dimensions": {
        "width": 1080,
        "height": 1920,
        "aspect_ratio": "9:16"
    }
}

