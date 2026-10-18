#!/usr/bin/env python3
"""
YouTube Video Style Analyzer

Downloads YouTube videos, extracts frames at intervals,
analyzes each frame with AI vision to extract style patterns
for recreation in VideoStudio.

Usage:
    python scripts/analyze-youtube.py --urls urls.txt
    python scripts/analyze-youtube.py --url "https://youtube.com/watch?v=..."
    python scripts/analyze-youtube.py --aggregate ./output/analysis/

Dependencies:
    pip install yt-dlp openai pillow
    brew install ffmpeg  # or apt-get install ffmpeg
"""

import os
import sys
import json
import argparse
import subprocess
import base64
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    from openai import OpenAI
except ImportError:
    print("Error: openai package not installed. Run: pip install openai")
    sys.exit(1)

try:
    from PIL import Image
except ImportError:
    print("Error: pillow package not installed. Run: pip install pillow")
    sys.exit(1)


# =============================================================================
# Configuration
# =============================================================================

DEFAULT_FRAME_INTERVAL = 10  # seconds
OUTPUT_DIR = Path("./output/youtube_analysis")
MAX_IMAGE_SIZE = (1024, 1024)  # Resize for API efficiency

YOUTUBE_URLS = [
    "https://www.youtube.com/watch?v=Om0d0u1ASJY",
    "https://www.youtube.com/watch?v=DScr9hwfcas",
    "https://www.youtube.com/watch?v=HSmHYWBy0ss",
    "https://www.youtube.com/watch?v=oBYM1bEpGB0",
    "https://www.youtube.com/watch?v=XOtMZchugyQ",
    "https://www.youtube.com/watch?v=Dgzb6ojbjWg",
    "https://www.youtube.com/watch?v=v4LDsaWNjaM",
]

FRAME_ANALYSIS_PROMPT = """
Analyze this video frame for style recreation purposes. Extract visual style details that would help recreate similar content.

Return a JSON object with the following structure:

{
    "visual_style": {
        "dominant_colors": ["#hex1", "#hex2", "#hex3"],
        "color_grading": "description of color treatment",
        "contrast": "low/medium/high",
        "saturation": "muted/normal/vibrant",
        "lighting": "bright/neutral/dark",
        "background_type": "solid/gradient/image/blur/pattern"
    },
    "typography": {
        "has_text": true/false,
        "text_content": "visible text if any",
        "font_style": "sans-serif/serif/display/handwritten",
        "font_weight": "thin/regular/bold/black",
        "text_size": "small/medium/large/xlarge",
        "text_position": "center/top/bottom/lower-third/corner",
        "text_effects": ["shadow", "outline", "glow", "none"],
        "text_animation_hint": "static/animated"
    },
    "composition": {
        "layout": "centered/split/grid/asymmetric",
        "primary_focus": "text/icon/image/person/graphic",
        "visual_hierarchy": "what draws attention first",
        "spacing": "tight/balanced/loose",
        "aspect_ratio_hint": "vertical/horizontal/square"
    },
    "elements": {
        "has_icons": true/false,
        "has_illustrations": true/false,
        "has_photos": true/false,
        "has_video_footage": true/false,
        "has_screen_recording": true/false,
        "has_face": true/false,
        "has_logo": true/false,
        "decorative_elements": ["shapes", "lines", "particles", "none"]
    },
    "scene_type": "intro/hook/topic/explanation/list-item/transition/outro/b-roll",
    "content_category": "educational/entertainment/promotional/tutorial/news",
    "energy_level": "calm/moderate/energetic/intense",
    "estimated_duration_hint": "quick-cut/medium/slow"
}

Only return valid JSON, no other text.
"""

AGGREGATION_PROMPT = """
Based on the following frame analyses from a video, create a comprehensive style profile.

Frame analyses:
{frame_data}

Create a unified style profile that captures the consistent patterns across all frames.
Return a JSON object:

{
    "style_summary": {
        "primary_colors": ["#hex1", "#hex2", "#hex3"],
        "accent_color": "#hex",
        "background_style": "description",
        "overall_mood": "description",
        "color_grading_style": "description"
    },
    "typography_style": {
        "primary_font_style": "sans-serif bold/serif elegant/etc",
        "heading_treatment": "how headings appear",
        "body_text_treatment": "how body text appears",
        "common_text_effects": ["list of effects"],
        "text_animation_style": "description"
    },
    "motion_patterns": {
        "transition_style": "cuts/fades/slides/zooms",
        "pacing": "fast/medium/slow",
        "animation_style": "snappy/smooth/bouncy",
        "energy": "calm/moderate/high"
    },
    "content_structure": {
        "intro_style": "how videos start",
        "main_content_style": "how main content is presented",
        "outro_style": "how videos end",
        "scene_types_used": ["list of scene types"],
        "average_scene_duration": "X seconds"
    },
    "brand_elements": {
        "consistent_elements": ["list of recurring elements"],
        "visual_signature": "what makes this style recognizable"
    },
    "recreation_recommendations": {
        "suggested_format": "explainer_v1/listicle_v1/etc",
        "recommended_fps": 30,
        "recommended_duration_sec": 60,
        "key_style_elements_to_replicate": ["list"]
    }
}

Only return valid JSON, no other text.
"""


# =============================================================================
# Video Download
# =============================================================================

def get_video_id(url: str) -> str:
    """Extract video ID from YouTube URL."""
    if "youtu.be/" in url:
        return url.split("youtu.be/")[1].split("?")[0]
    if "v=" in url:
        return url.split("v=")[1].split("&")[0]
    return hashlib.md5(url.encode()).hexdigest()[:11]


def download_video(url: str, output_dir: Path) -> dict:
    """Download YouTube video using yt-dlp."""
    video_id = get_video_id(url)
    video_dir = output_dir / "downloads" / video_id
    video_dir.mkdir(parents=True, exist_ok=True)
    
    video_file = video_dir / f"{video_id}.mp4"
    info_file = video_dir / "info.json"
    
    # Check if already downloaded
    if video_file.exists() and info_file.exists():
        print(f"  ✓ Already downloaded: {video_id}")
        with open(info_file) as f:
            return json.load(f)
    
    print(f"  ⬇ Downloading: {video_id}...")
    
    # Download with yt-dlp
    cmd = [
        "yt-dlp",
        "-f", "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best",
        "--merge-output-format", "mp4",
        "-o", str(video_file),
        "--write-info-json",
        "--write-thumbnail",
        "--no-playlist",
        "--quiet",
        "--progress",
        url
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        print(f"  ✗ Download failed: {e.stderr}")
        return None
    except FileNotFoundError:
        print("  ✗ yt-dlp not found. Install with: pip install yt-dlp")
        return None
    
    # Read info file
    info_json_file = video_dir / f"{video_id}.info.json"
    if info_json_file.exists():
        with open(info_json_file) as f:
            yt_info = json.load(f)
        
        info = {
            "video_id": video_id,
            "title": yt_info.get("title", "Unknown"),
            "duration_sec": yt_info.get("duration", 0),
            "channel": yt_info.get("channel", "Unknown"),
            "url": url,
            "file_path": str(video_file),
            "downloaded_at": datetime.now().isoformat()
        }
        
        with open(info_file, "w") as f:
            json.dump(info, f, indent=2)
        
        print(f"  ✓ Downloaded: {info['title'][:50]}... ({info['duration_sec']}s)")
        return info
    
    return {"video_id": video_id, "file_path": str(video_file), "url": url}


# =============================================================================
# Frame Extraction
# =============================================================================

def extract_frames(video_path: str, output_dir: Path, interval_sec: int = 10) -> list[dict]:
    """Extract frames from video at regular intervals using ffmpeg."""
    video_path = Path(video_path)
    video_id = video_path.stem
    frames_dir = output_dir / "frames" / video_id
    frames_dir.mkdir(parents=True, exist_ok=True)
    
    # Check if frames already extracted
    existing_frames = list(frames_dir.glob("frame_*.jpg"))
    if existing_frames:
        print(f"  ✓ Frames already extracted: {len(existing_frames)} frames")
        return [
            {
                "frame_path": str(f),
                "timestamp_sec": int(f.stem.split("_")[1]) * interval_sec,
                "frame_number": int(f.stem.split("_")[1])
            }
            for f in sorted(existing_frames)
        ]
    
    print(f"  🎬 Extracting frames every {interval_sec}s...")
    
    # FFmpeg command to extract frames
    cmd = [
        "ffmpeg",
        "-i", str(video_path),
        "-vf", f"fps=1/{interval_sec}",
        "-q:v", "2",
        "-y",
        str(frames_dir / "frame_%04d.jpg")
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        print(f"  ✗ Frame extraction failed: {e.stderr[:200]}")
        return []
    except FileNotFoundError:
        print("  ✗ ffmpeg not found. Install with: brew install ffmpeg")
        return []
    
    # List extracted frames
    frames = []
    for i, frame_path in enumerate(sorted(frames_dir.glob("frame_*.jpg"))):
        frames.append({
            "frame_path": str(frame_path),
            "timestamp_sec": i * interval_sec,
            "frame_number": i
        })
    
    print(f"  ✓ Extracted {len(frames)} frames")
    return frames


# =============================================================================
# AI Frame Analysis
# =============================================================================

def encode_image_base64(image_path: str) -> str:
    """Load image, resize if needed, and encode as base64."""
    with Image.open(image_path) as img:
        # Convert to RGB if necessary
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        # Resize if too large
        if img.size[0] > MAX_IMAGE_SIZE[0] or img.size[1] > MAX_IMAGE_SIZE[1]:
            img.thumbnail(MAX_IMAGE_SIZE, Image.Resampling.LANCZOS)
        
        # Save to bytes
        import io
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=85)
        return base64.b64encode(buffer.getvalue()).decode("utf-8")


def analyze_frame(client: OpenAI, frame_path: str, timestamp_sec: int) -> dict:
    """Analyze a single frame using OpenAI Vision API."""
    try:
        image_base64 = encode_image_base64(frame_path)
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": FRAME_ANALYSIS_PROMPT},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}",
                                "detail": "low"
                            }
                        }
                    ]
                }
            ],
            max_tokens=1000,
            temperature=0.3
        )
        
        content = response.choices[0].message.content
        
        # Parse JSON from response
        try:
            # Try to extract JSON from the response
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            analysis = json.loads(content.strip())
            analysis["timestamp_sec"] = timestamp_sec
            analysis["frame_path"] = frame_path
            return analysis
            
        except json.JSONDecodeError:
            return {
                "timestamp_sec": timestamp_sec,
                "frame_path": frame_path,
                "error": "Failed to parse JSON",
                "raw_response": content[:500]
            }
            
    except Exception as e:
        return {
            "timestamp_sec": timestamp_sec,
            "frame_path": frame_path,
            "error": str(e)
        }


def analyze_video_frames(client: OpenAI, frames: list[dict], output_dir: Path, video_id: str) -> list[dict]:
    """Analyze all frames for a video."""
    analysis_dir = output_dir / "analysis"
    analysis_dir.mkdir(parents=True, exist_ok=True)
    
    cache_file = analysis_dir / f"{video_id}_frames.json"
    
    # Check cache
    if cache_file.exists():
        print(f"  ✓ Using cached frame analysis")
        with open(cache_file) as f:
            return json.load(f)
    
    print(f"  🔍 Analyzing {len(frames)} frames with AI...")
    analyses = []
    
    for i, frame in enumerate(frames):
        print(f"    Frame {i+1}/{len(frames)} @ {frame['timestamp_sec']}s", end="\r")
        analysis = analyze_frame(client, frame["frame_path"], frame["timestamp_sec"])
        analyses.append(analysis)
    
    print(f"  ✓ Analyzed {len(analyses)} frames                    ")
    
    # Cache results
    with open(cache_file, "w") as f:
        json.dump(analyses, f, indent=2)
    
    return analyses


# =============================================================================
# Style Aggregation
# =============================================================================

def aggregate_video_style(client: OpenAI, frame_analyses: list[dict], video_info: dict, output_dir: Path) -> dict:
    """Aggregate frame analyses into a unified style profile."""
    video_id = video_info.get("video_id", "unknown")
    analysis_dir = output_dir / "analysis"
    profile_file = analysis_dir / f"{video_id}_profile.json"
    
    # Check cache
    if profile_file.exists():
        print(f"  ✓ Using cached style profile")
        with open(profile_file) as f:
            return json.load(f)
    
    print(f"  🎨 Generating style profile...")
    
    # Filter out error frames and prepare data
    valid_analyses = [a for a in frame_analyses if "error" not in a]
    
    if not valid_analyses:
        return {"error": "No valid frame analyses"}
    
    # Summarize frame data for the prompt
    frame_summary = json.dumps(valid_analyses[:10], indent=2)  # Limit to avoid token overflow
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": AGGREGATION_PROMPT.format(frame_data=frame_summary)
                }
            ],
            max_tokens=2000,
            temperature=0.3
        )
        
        content = response.choices[0].message.content
        
        # Parse JSON
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        
        style_profile = json.loads(content.strip())
        
    except Exception as e:
        style_profile = {"error": str(e)}
    
    # Add metadata
    result = {
        "video_id": video_id,
        "title": video_info.get("title", "Unknown"),
        "duration_sec": video_info.get("duration_sec", 0),
        "url": video_info.get("url", ""),
        "frames_analyzed": len(valid_analyses),
        "analyzed_at": datetime.now().isoformat(),
        "style_profile": style_profile
    }
    
    # Cache
    with open(profile_file, "w") as f:
        json.dump(result, f, indent=2)
    
    print(f"  ✓ Style profile generated")
    return result


# =============================================================================
# Combined Schema Generation
# =============================================================================

def generate_combined_schema(profiles: list[dict], output_dir: Path) -> dict:
    """Generate a combined recreation schema from multiple video profiles."""
    schema_dir = output_dir / "schemas"
    schema_dir.mkdir(parents=True, exist_ok=True)
    
    print("\n📊 Generating combined style schema...")
    
    # Extract common patterns
    all_colors = []
    all_fonts = []
    all_scenes = []
    all_transitions = []
    
    for profile in profiles:
        sp = profile.get("style_profile", {})
        if isinstance(sp, dict) and "error" not in sp:
            summary = sp.get("style_summary", {})
            all_colors.extend(summary.get("primary_colors", []))
            
            typography = sp.get("typography_style", {})
            if typography.get("primary_font_style"):
                all_fonts.append(typography["primary_font_style"])
            
            content = sp.get("content_structure", {})
            all_scenes.extend(content.get("scene_types_used", []))
            
            motion = sp.get("motion_patterns", {})
            if motion.get("transition_style"):
                all_transitions.append(motion["transition_style"])
    
    # Count frequencies
    from collections import Counter
    color_freq = Counter(all_colors)
    font_freq = Counter(all_fonts)
    scene_freq = Counter(all_scenes)
    transition_freq = Counter(all_transitions)
    
    schema = {
        "schema_name": "YouTube Style Analysis",
        "generated_at": datetime.now().isoformat(),
        "source_videos": len(profiles),
        "videos_analyzed": [
            {"id": p["video_id"], "title": p.get("title", ""), "url": p.get("url", "")}
            for p in profiles
        ],
        "common_patterns": {
            "top_colors": [c for c, _ in color_freq.most_common(6)],
            "top_font_styles": [f for f, _ in font_freq.most_common(3)],
            "common_scene_types": [s for s, _ in scene_freq.most_common(10)],
            "common_transitions": [t for t, _ in transition_freq.most_common(3)]
        },
        "style_guide": {
            "colors": {
                "background": color_freq.most_common(1)[0][0] if color_freq else "#0a0a0a",
                "primary_text": "#ffffff",
                "accent": color_freq.most_common(3)[2][0] if len(color_freq) > 2 else "#3b82f6"
            },
            "typography": {
                "heading_style": font_freq.most_common(1)[0][0] if font_freq else "Bold sans-serif",
                "body_style": "Regular sans-serif"
            }
        },
        "videostudio_template": {
            "format": "explainer_v1",
            "settings": {
                "resolution": {"width": 1080, "height": 1920},
                "fps": 30,
                "duration_sec": 60,
                "aspect_ratio": "9:16"
            },
            "style": {
                "theme": "dark",
                "primary_color": "#ffffff",
                "secondary_color": "#a1a1aa",
                "accent_color": color_freq.most_common(3)[2][0] if len(color_freq) > 2 else "#3b82f6",
                "font_heading": "Inter",
                "font_body": "Inter",
                "background_type": "gradient",
                "background_value": "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)"
            },
            "sections": [
                {"type": "intro", "duration_sec": 5},
                {"type": "hook", "duration_sec": 3},
                {"type": "topic", "duration_sec": 15},
                {"type": "topic", "duration_sec": 15},
                {"type": "topic", "duration_sec": 15},
                {"type": "outro", "duration_sec": 7}
            ]
        },
        "individual_profiles": [p.get("style_profile", {}) for p in profiles]
    }
    
    # Save schema
    schema_file = schema_dir / "combined_style_guide.json"
    with open(schema_file, "w") as f:
        json.dump(schema, f, indent=2)
    
    # Also save as VideoStudio-compatible brief template
    brief_template = {
        "id": "youtube_style_template",
        "format": "explainer_v1",
        "version": "1.0",
        "created_at": datetime.now().isoformat(),
        "settings": schema["videostudio_template"]["settings"],
        "style": schema["videostudio_template"]["style"],
        "sections": [
            {
                "id": f"section_{i}",
                "type": s["type"],
                "duration_sec": s["duration_sec"],
                "start_time_sec": sum(schema["videostudio_template"]["sections"][j]["duration_sec"] for j in range(i)),
                "content": {
                    "type": s["type"],
                    "title": f"[Your {s['type']} content]",
                    "body_text": "[Your content here]"
                }
            }
            for i, s in enumerate(schema["videostudio_template"]["sections"])
        ]
    }
    
    brief_file = schema_dir / "recreation_template.json"
    with open(brief_file, "w") as f:
        json.dump(brief_template, f, indent=2)
    
    print(f"✓ Combined schema saved to: {schema_file}")
    print(f"✓ Brief template saved to: {brief_file}")
    
    return schema


# =============================================================================
# Main Pipeline
# =============================================================================

def process_video(url: str, output_dir: Path, client: OpenAI, interval: int) -> Optional[dict]:
    """Process a single video through the full pipeline."""
    video_id = get_video_id(url)
    print(f"\n{'='*60}")
    print(f"Processing: {video_id}")
    print(f"{'='*60}")
    
    # Step 1: Download
    video_info = download_video(url, output_dir)
    if not video_info or not Path(video_info.get("file_path", "")).exists():
        print(f"  ✗ Skipping: Download failed")
        return None
    
    # Step 2: Extract frames
    frames = extract_frames(video_info["file_path"], output_dir, interval)
    if not frames:
        print(f"  ✗ Skipping: Frame extraction failed")
        return None
    
    # Step 3: Analyze frames
    frame_analyses = analyze_video_frames(client, frames, output_dir, video_id)
    
    # Step 4: Aggregate style
    style_profile = aggregate_video_style(client, frame_analyses, video_info, output_dir)
    
    return style_profile


def main():
    parser = argparse.ArgumentParser(description="YouTube Video Style Analyzer")
    parser.add_argument("--url", help="Single YouTube URL to analyze")
    parser.add_argument("--urls", help="File containing YouTube URLs (one per line)")
    parser.add_argument("--aggregate", help="Directory with existing analyses to aggregate")
    parser.add_argument("--output", default=str(OUTPUT_DIR), help="Output directory")
    parser.add_argument("--interval", type=int, default=DEFAULT_FRAME_INTERVAL, 
                        help="Frame extraction interval in seconds")
    parser.add_argument("--frames-only", action="store_true", help="Only extract frames, no AI analysis")
    args = parser.parse_args()
    
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Determine URLs to process
    urls = []
    if args.url:
        urls = [args.url]
    elif args.urls:
        with open(args.urls) as f:
            urls = [line.strip() for line in f if line.strip() and not line.startswith("#")]
    elif args.aggregate:
        # Just aggregate existing analyses
        pass
    else:
        # Use default URLs
        urls = YOUTUBE_URLS
    
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║           YouTube Video Style Analyzer                        ║
╚══════════════════════════════════════════════════════════════╝

Output directory: {output_dir}
Frame interval: {args.interval} seconds
Videos to process: {len(urls)}
""")
    
    # Initialize OpenAI client
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key and not args.frames_only and not args.aggregate:
        print("⚠ OPENAI_API_KEY not set. Set it with:")
        print("  export OPENAI_API_KEY='your-key-here'")
        print("\nRunning in frames-only mode...")
        args.frames_only = True
    
    client = OpenAI(api_key=api_key) if api_key else None
    
    profiles = []
    
    if args.aggregate:
        # Load existing analyses
        analysis_dir = Path(args.aggregate)
        for profile_file in analysis_dir.glob("*_profile.json"):
            with open(profile_file) as f:
                profiles.append(json.load(f))
        print(f"Loaded {len(profiles)} existing profiles")
    else:
        # Process videos
        for url in urls:
            if args.frames_only:
                # Just download and extract frames
                video_info = download_video(url, output_dir)
                if video_info:
                    extract_frames(video_info["file_path"], output_dir, args.interval)
            else:
                profile = process_video(url, output_dir, client, args.interval)
                if profile:
                    profiles.append(profile)
    
    # Generate combined schema if we have profiles
    if profiles:
        schema = generate_combined_schema(profiles, output_dir)
        
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║                    Analysis Complete!                         ║
╚══════════════════════════════════════════════════════════════╝

Videos analyzed: {len(profiles)}
Output location: {output_dir}

Files created:
  • {output_dir}/downloads/       - Downloaded videos
  • {output_dir}/frames/          - Extracted frames
  • {output_dir}/analysis/        - Frame analyses & profiles
  • {output_dir}/schemas/         - Combined style guide

Next steps:
  1. Review the style guide: {output_dir}/schemas/combined_style_guide.json
  2. Use the template: {output_dir}/schemas/recreation_template.json
  3. Create your own content brief with the extracted style
  4. Render with: npm run render:brief -- --brief <your_brief.json>
""")
    else:
        print("\n✓ Frames extracted. Run again with OPENAI_API_KEY for AI analysis.")


if __name__ == "__main__":
    main()
