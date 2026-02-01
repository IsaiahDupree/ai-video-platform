"""
Explainer Format (v1)
=====================
Single-topic focused explainer videos with narration.
Best for: Educational content, tutorials, concept explanations.
"""

EXPLAINER_V1 = {
    "format_id": "explainer_v1",
    "name": "Explainer Video",
    "description": "Single-topic focused explainer with narration-first approach",
    "layout": "single_focus",
    "scene_order": ["intro", "item_loop", "outro"],
    "item_mapping": {
        "source": "items",
        "scene": "TopicScene",
        "filter": {
            "type": "topic"
        }
    },
    "timing": {
        "per_item_seconds": 60,
        "transition_seconds": 0.5,
        "intro_seconds": 5,
        "outro_seconds": 5
    },
    "visuals": {
        "background": "#0f0f0f",
        "zoom": True,
        "accent_color": "#FFD54F",
        "text_color": "#ffffff",
        "font_family": "Arial",
        "font_size": 64
    },
    "audio": {
        "voiceover": True,
        "music": False,
        "sound_effects": False
    },
    "dimensions": {
        "width": 1920,
        "height": 1080,
        "aspect_ratio": "16:9"
    }
}

