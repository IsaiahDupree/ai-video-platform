#!/usr/bin/env python3
"""
AI Asset Generator for VideoStudio

Generates reusable image assets (icons, graphics, props, backgrounds)
using AI image generation for use in video productions.

Usage:
    python scripts/generate-assets.py --type icon --prompt "rocket ship"
    python scripts/generate-assets.py --type background --style "neon gradient"
    python scripts/generate-assets.py --batch assets.json
"""

import os
import sys
import json
import argparse
import base64
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Optional, Literal

try:
    from openai import OpenAI
except ImportError:
    print("Error: openai package not installed. Run: pip install openai")
    sys.exit(1)

# =============================================================================
# Configuration
# =============================================================================

ASSETS_DIR = Path("./public/assets")
CACHE_FILE = ASSETS_DIR / "asset_cache.json"

# Asset type configurations
ASSET_CONFIGS = {
    "icon": {
        "size": "1024x1024",
        "style_prefix": "Minimalist flat icon, single object, transparent background style, ",
        "quality": "standard",
        "model": "dall-e-3",
    },
    "illustration": {
        "size": "1024x1024",
        "style_prefix": "Modern digital illustration, clean lines, vibrant colors, ",
        "quality": "standard",
        "model": "dall-e-3",
    },
    "background": {
        "size": "1792x1024",
        "style_prefix": "Abstract background pattern, seamless, ",
        "quality": "standard",
        "model": "dall-e-3",
    },
    "prop": {
        "size": "1024x1024",
        "style_prefix": "3D rendered object, studio lighting, clean background, ",
        "quality": "hd",
        "model": "dall-e-3",
    },
    "character": {
        "size": "1024x1024",
        "style_prefix": "Cartoon character design, full body, expressive, ",
        "quality": "hd",
        "model": "dall-e-3",
    },
    "emoji": {
        "size": "1024x1024",
        "style_prefix": "3D emoji style, glossy, expressive, single centered object, ",
        "quality": "standard",
        "model": "dall-e-3",
    },
    "scene": {
        "size": "1792x1024",
        "style_prefix": "Cinematic scene, detailed environment, atmospheric lighting, ",
        "quality": "hd",
        "model": "dall-e-3",
    },
}

# Style modifiers that can be applied to any asset type
STYLE_MODIFIERS = {
    "neon": "neon glow effect, cyberpunk colors, dark background, ",
    "minimal": "minimalist, simple shapes, limited color palette, ",
    "retro": "retro 80s style, synthwave colors, vintage feel, ",
    "corporate": "professional, clean, modern corporate style, ",
    "playful": "fun, colorful, cartoon style, friendly, ",
    "dark": "dark theme, moody lighting, deep shadows, ",
    "gradient": "smooth gradient colors, modern aesthetic, ",
    "outline": "line art style, clean outlines, no fill, ",
    "isometric": "isometric 3D view, geometric, clean angles, ",
    "watercolor": "watercolor painting style, soft edges, artistic, ",
    "pixel": "pixel art style, 8-bit aesthetic, retro gaming, ",
    "glass": "glassmorphism style, frosted glass effect, translucent, ",
}

# Common asset prompts for quick generation
PRESET_ASSETS = {
    # Icons
    "icon_rocket": {"type": "icon", "prompt": "rocket ship launching"},
    "icon_brain": {"type": "icon", "prompt": "human brain with neural connections"},
    "icon_lightning": {"type": "icon", "prompt": "lightning bolt energy"},
    "icon_target": {"type": "icon", "prompt": "target bullseye with arrow"},
    "icon_trophy": {"type": "icon", "prompt": "golden trophy cup"},
    "icon_clock": {"type": "icon", "prompt": "analog clock showing time"},
    "icon_money": {"type": "icon", "prompt": "stack of dollar bills"},
    "icon_chart": {"type": "icon", "prompt": "upward trending chart graph"},
    "icon_lightbulb": {"type": "icon", "prompt": "glowing light bulb idea"},
    "icon_heart": {"type": "icon", "prompt": "red heart shape"},
    "icon_star": {"type": "icon", "prompt": "golden five-pointed star"},
    "icon_fire": {"type": "icon", "prompt": "orange flames fire"},
    "icon_checkmark": {"type": "icon", "prompt": "green checkmark tick"},
    "icon_warning": {"type": "icon", "prompt": "yellow warning triangle"},
    "icon_lock": {"type": "icon", "prompt": "padlock security"},
    "icon_globe": {"type": "icon", "prompt": "earth globe world"},
    "icon_code": {"type": "icon", "prompt": "code brackets programming"},
    "icon_ai": {"type": "icon", "prompt": "artificial intelligence chip brain"},
    
    # Emojis/Reactions
    "emoji_mindblown": {"type": "emoji", "prompt": "mind blown explosion head"},
    "emoji_fire": {"type": "emoji", "prompt": "fire flames hot"},
    "emoji_100": {"type": "emoji", "prompt": "100 percent score perfect"},
    "emoji_thumbsup": {"type": "emoji", "prompt": "thumbs up approval"},
    "emoji_thinking": {"type": "emoji", "prompt": "thinking face contemplating"},
    
    # Backgrounds
    "bg_gradient_blue": {"type": "background", "prompt": "blue to purple gradient smooth"},
    "bg_gradient_sunset": {"type": "background", "prompt": "orange to pink sunset gradient"},
    "bg_particles": {"type": "background", "prompt": "floating particles bokeh lights"},
    "bg_geometric": {"type": "background", "prompt": "geometric shapes pattern abstract"},
    "bg_space": {"type": "background", "prompt": "outer space stars nebula"},
    "bg_tech": {"type": "background", "prompt": "technology circuit board pattern"},
    
    # Props
    "prop_laptop": {"type": "prop", "prompt": "modern laptop computer open"},
    "prop_phone": {"type": "prop", "prompt": "smartphone mobile device"},
    "prop_book": {"type": "prop", "prompt": "open book pages"},
    "prop_coffee": {"type": "prop", "prompt": "coffee cup steaming"},
    "prop_plant": {"type": "prop", "prompt": "potted plant green leaves"},
}


# =============================================================================
# Cache Management
# =============================================================================

def load_cache() -> dict:
    """Load the asset cache."""
    if CACHE_FILE.exists():
        with open(CACHE_FILE) as f:
            return json.load(f)
    return {"assets": {}}


def save_cache(cache: dict):
    """Save the asset cache."""
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f, indent=2)


def get_cache_key(asset_type: str, prompt: str, style: str = "") -> str:
    """Generate a unique cache key for an asset."""
    combined = f"{asset_type}:{style}:{prompt}"
    return hashlib.md5(combined.encode()).hexdigest()[:12]


# =============================================================================
# Asset Generation
# =============================================================================

def generate_asset(
    client: OpenAI,
    asset_type: str,
    prompt: str,
    style: str = "",
    output_name: Optional[str] = None,
) -> dict:
    """Generate a single asset using DALL-E."""
    
    config = ASSET_CONFIGS.get(asset_type)
    if not config:
        raise ValueError(f"Unknown asset type: {asset_type}. Available: {list(ASSET_CONFIGS.keys())}")
    
    # Build the full prompt
    style_modifier = STYLE_MODIFIERS.get(style, "")
    full_prompt = f"{config['style_prefix']}{style_modifier}{prompt}"
    
    # Check cache
    cache = load_cache()
    cache_key = get_cache_key(asset_type, prompt, style)
    
    if cache_key in cache["assets"]:
        cached = cache["assets"][cache_key]
        if Path(cached["path"]).exists():
            print(f"  ✓ Using cached asset: {cached['path']}")
            return cached
    
    print(f"  🎨 Generating {asset_type}: {prompt[:50]}...")
    
    try:
        response = client.images.generate(
            model=config["model"],
            prompt=full_prompt,
            size=config["size"],
            quality=config["quality"],
            n=1,
            response_format="b64_json",
        )
        
        # Save the image
        image_data = base64.b64decode(response.data[0].b64_json)
        
        # Determine output path
        type_dir = ASSETS_DIR / asset_type
        type_dir.mkdir(parents=True, exist_ok=True)
        
        if output_name:
            filename = f"{output_name}.png"
        else:
            safe_prompt = "".join(c if c.isalnum() else "_" for c in prompt[:30])
            filename = f"{cache_key}_{safe_prompt}.png"
        
        output_path = type_dir / filename
        
        with open(output_path, "wb") as f:
            f.write(image_data)
        
        # Update cache
        asset_info = {
            "type": asset_type,
            "prompt": prompt,
            "style": style,
            "full_prompt": full_prompt,
            "path": str(output_path),
            "size": config["size"],
            "generated_at": datetime.now().isoformat(),
        }
        
        cache["assets"][cache_key] = asset_info
        save_cache(cache)
        
        print(f"  ✓ Saved: {output_path}")
        return asset_info
        
    except Exception as e:
        print(f"  ✗ Generation failed: {e}")
        return {"error": str(e)}


def generate_preset(client: OpenAI, preset_name: str, style: str = "") -> dict:
    """Generate a preset asset."""
    if preset_name not in PRESET_ASSETS:
        raise ValueError(f"Unknown preset: {preset_name}. Available: {list(PRESET_ASSETS.keys())}")
    
    preset = PRESET_ASSETS[preset_name]
    return generate_asset(
        client,
        asset_type=preset["type"],
        prompt=preset["prompt"],
        style=style,
        output_name=preset_name,
    )


def generate_batch(client: OpenAI, batch_config: list[dict]) -> list[dict]:
    """Generate multiple assets from a batch configuration."""
    results = []
    
    for i, item in enumerate(batch_config):
        print(f"\n[{i+1}/{len(batch_config)}] Generating...")
        
        if "preset" in item:
            result = generate_preset(client, item["preset"], item.get("style", ""))
        else:
            result = generate_asset(
                client,
                asset_type=item.get("type", "icon"),
                prompt=item["prompt"],
                style=item.get("style", ""),
                output_name=item.get("name"),
            )
        
        results.append(result)
    
    return results


# =============================================================================
# Asset Library Management
# =============================================================================

def list_assets(asset_type: Optional[str] = None) -> list[dict]:
    """List all generated assets."""
    cache = load_cache()
    assets = cache.get("assets", {}).values()
    
    if asset_type:
        assets = [a for a in assets if a.get("type") == asset_type]
    
    return list(assets)


def search_assets(query: str) -> list[dict]:
    """Search assets by prompt or name."""
    cache = load_cache()
    query_lower = query.lower()
    
    results = []
    for asset in cache.get("assets", {}).values():
        if query_lower in asset.get("prompt", "").lower():
            results.append(asset)
        elif query_lower in asset.get("path", "").lower():
            results.append(asset)
    
    return results


def generate_asset_manifest() -> dict:
    """Generate a manifest file for all assets."""
    cache = load_cache()
    
    manifest = {
        "generated_at": datetime.now().isoformat(),
        "total_assets": len(cache.get("assets", {})),
        "by_type": {},
        "assets": [],
    }
    
    for asset in cache.get("assets", {}).values():
        asset_type = asset.get("type", "unknown")
        if asset_type not in manifest["by_type"]:
            manifest["by_type"][asset_type] = []
        
        manifest["by_type"][asset_type].append({
            "name": Path(asset["path"]).stem,
            "path": asset["path"],
            "prompt": asset.get("prompt", ""),
        })
        
        manifest["assets"].append(asset)
    
    # Save manifest
    manifest_path = ASSETS_DIR / "manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    
    return manifest


# =============================================================================
# CLI
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="AI Asset Generator for VideoStudio")
    
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # Generate command
    gen_parser = subparsers.add_parser("generate", help="Generate a new asset")
    gen_parser.add_argument("--type", "-t", choices=list(ASSET_CONFIGS.keys()), default="icon",
                          help="Asset type")
    gen_parser.add_argument("--prompt", "-p", required=True, help="Description of the asset")
    gen_parser.add_argument("--style", "-s", choices=list(STYLE_MODIFIERS.keys()), default="",
                          help="Style modifier")
    gen_parser.add_argument("--name", "-n", help="Output filename (without extension)")
    
    # Preset command
    preset_parser = subparsers.add_parser("preset", help="Generate a preset asset")
    preset_parser.add_argument("name", choices=list(PRESET_ASSETS.keys()), help="Preset name")
    preset_parser.add_argument("--style", "-s", choices=list(STYLE_MODIFIERS.keys()), default="",
                             help="Style modifier")
    
    # Batch command
    batch_parser = subparsers.add_parser("batch", help="Generate assets from a JSON file")
    batch_parser.add_argument("file", help="JSON file with batch configuration")
    
    # List command
    list_parser = subparsers.add_parser("list", help="List generated assets")
    list_parser.add_argument("--type", "-t", choices=list(ASSET_CONFIGS.keys()),
                           help="Filter by asset type")
    
    # Search command
    search_parser = subparsers.add_parser("search", help="Search assets")
    search_parser.add_argument("query", help="Search query")
    
    # Presets list command
    subparsers.add_parser("presets", help="List available presets")
    
    # Manifest command
    subparsers.add_parser("manifest", help="Generate asset manifest")
    
    args = parser.parse_args()
    
    # Initialize OpenAI client
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key and args.command in ["generate", "preset", "batch"]:
        print("Error: OPENAI_API_KEY not set")
        sys.exit(1)
    
    client = OpenAI(api_key=api_key) if api_key else None
    
    # Execute command
    if args.command == "generate":
        result = generate_asset(
            client,
            asset_type=args.type,
            prompt=args.prompt,
            style=args.style or "",
            output_name=args.name,
        )
        print(json.dumps(result, indent=2))
        
    elif args.command == "preset":
        result = generate_preset(client, args.name, args.style or "")
        print(json.dumps(result, indent=2))
        
    elif args.command == "batch":
        with open(args.file) as f:
            batch_config = json.load(f)
        results = generate_batch(client, batch_config)
        print(f"\n✓ Generated {len(results)} assets")
        
    elif args.command == "list":
        assets = list_assets(args.type)
        print(f"Found {len(assets)} assets:")
        for asset in assets:
            print(f"  - [{asset.get('type')}] {Path(asset.get('path', '')).name}")
            
    elif args.command == "search":
        results = search_assets(args.query)
        print(f"Found {len(results)} matching assets:")
        for asset in results:
            print(f"  - {asset.get('path')}")
            
    elif args.command == "presets":
        print("Available presets:")
        for name, config in PRESET_ASSETS.items():
            print(f"  - {name}: [{config['type']}] {config['prompt']}")
            
    elif args.command == "manifest":
        manifest = generate_asset_manifest()
        print(f"Generated manifest with {manifest['total_assets']} assets")
        
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
