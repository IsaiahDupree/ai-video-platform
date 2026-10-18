#!/usr/bin/env python3
"""
Sticker Generation Script
Extracts people from photos and creates transparent PNG stickers using rembg.
"""

import os
import sys
import json
from pathlib import Path
from PIL import Image, ImageFilter, ImageDraw
from rembg import remove

def add_sticker_outline(image, outline_width=8, outline_color=(255, 255, 255, 255)):
    """Add white outline around the transparent image for sticker effect."""
    # Create a slightly larger canvas
    new_size = (image.width + outline_width * 2, image.height + outline_width * 2)
    result = Image.new('RGBA', new_size, (0, 0, 0, 0))
    
    # Get alpha channel and dilate it for outline
    alpha = image.split()[3]
    
    # Create outline by pasting white where alpha exists, multiple times offset
    for dx in range(-outline_width, outline_width + 1):
        for dy in range(-outline_width, outline_width + 1):
            if dx * dx + dy * dy <= outline_width * outline_width:
                # Paste the alpha as a mask for white
                outline_layer = Image.new('RGBA', new_size, outline_color)
                mask = Image.new('L', new_size, 0)
                mask.paste(alpha, (outline_width + dx, outline_width + dy))
                result = Image.composite(outline_layer, result, mask)
    
    # Paste original image on top
    result.paste(image, (outline_width, outline_width), image)
    return result

def add_drop_shadow(image, offset=(5, 5), shadow_color=(0, 0, 0, 128), blur_radius=10):
    """Add drop shadow to transparent image."""
    # Create shadow layer
    shadow_size = (image.width + abs(offset[0]) + blur_radius * 2, 
                   image.height + abs(offset[1]) + blur_radius * 2)
    shadow = Image.new('RGBA', shadow_size, (0, 0, 0, 0))
    
    # Create shadow from alpha channel
    alpha = image.split()[3]
    shadow_alpha = Image.new('L', shadow_size, 0)
    shadow_alpha.paste(alpha, (blur_radius + max(0, offset[0]), blur_radius + max(0, offset[1])))
    shadow_alpha = shadow_alpha.filter(ImageFilter.GaussianBlur(blur_radius))
    
    # Apply shadow color
    shadow_layer = Image.new('RGBA', shadow_size, shadow_color[:3] + (0,))
    shadow.paste(shadow_layer, mask=shadow_alpha)
    
    # Paste original on top
    shadow.paste(image, (blur_radius + max(0, -offset[0]), blur_radius + max(0, -offset[1])), image)
    return shadow

def process_image(input_path, output_dir, add_outline=True, add_shadow=False):
    """Process a single image and create sticker."""
    print(f"  Processing: {input_path}")
    
    # Load and remove background
    input_image = Image.open(input_path).convert('RGBA')
    
    # Remove background using rembg
    output_image = remove(input_image)
    
    # Optional: Add sticker effects
    if add_outline:
        output_image = add_sticker_outline(output_image, outline_width=6)
    
    if add_shadow:
        output_image = add_drop_shadow(output_image)
    
    # Save sticker
    filename = Path(input_path).stem + '_sticker.png'
    output_path = os.path.join(output_dir, filename)
    output_image.save(output_path, 'PNG')
    
    print(f"  ✅ Saved: {output_path}")
    return output_path

def main():
    # Default paths
    input_images = [
        "/Volumes/My Passport/MediaPoster/workspace1/iphone_import/IMG_0521.JPG",
        "/Volumes/My Passport/MediaPoster/workspace1/iphone_import/IMG_8046.JPG",
        "/Volumes/My Passport/MediaPoster/workspace1/iphone_import/IMG_8352.JPG",
    ]
    
    output_dir = "public/assets/stickers/isaiah"
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "--help":
            print("Usage: python generate-stickers.py [--input <path>] [--output <dir>]")
            return
        
        for i, arg in enumerate(sys.argv):
            if arg == "--input" and i + 1 < len(sys.argv):
                input_images = [sys.argv[i + 1]]
            elif arg == "--output" and i + 1 < len(sys.argv):
                output_dir = sys.argv[i + 1]
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"🎨 Generating stickers...")
    print(f"   Output: {output_dir}")
    
    stickers = []
    for img_path in input_images:
        if os.path.exists(img_path):
            try:
                sticker_path = process_image(img_path, output_dir, add_outline=True, add_shadow=False)
                stickers.append({
                    "source": img_path,
                    "sticker": sticker_path,
                    "filename": os.path.basename(sticker_path)
                })
            except Exception as e:
                print(f"  ❌ Error processing {img_path}: {e}")
        else:
            print(f"  ⚠️ File not found: {img_path}")
    
    # Create manifest
    manifest = {
        "stickers": stickers,
        "count": len(stickers),
        "output_dir": output_dir
    }
    
    manifest_path = os.path.join(output_dir, "manifest.json")
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)
    
    print(f"\n✅ Generated {len(stickers)} stickers")
    print(f"📄 Manifest: {manifest_path}")

if __name__ == "__main__":
    main()
