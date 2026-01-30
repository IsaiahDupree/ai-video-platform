#!/usr/bin/env python3
"""
Benchmark script for InfiniteTalk text-to-video generation.

Usage:
    python scripts/benchmark_infinitetalk.py --image path/to/face.jpg
    python scripts/benchmark_infinitetalk.py --image face.jpg --profiles fast,balanced
    python scripts/benchmark_infinitetalk.py --all-profiles
"""

import argparse
import base64
import json
import os
import time
from datetime import datetime
from pathlib import Path

import modal

# Import the Modal app
from modal_video_lab import InfiniteTalkService

# Test texts of varying lengths
TEST_TEXTS = {
    "short": "Hello, how are you today?",
    "medium": "Welcome to our platform. I'm excited to show you what we can do with AI-powered video generation.",
    "long": "Hello and welcome! Today I want to talk to you about the future of video content creation. With advances in artificial intelligence, we can now generate realistic talking head videos from just a single image and text. This technology has incredible applications for education, marketing, and entertainment.",
}

# Available profiles
PROFILES = ["fast", "low_vram", "balanced", "quality"]

# Available voices
VOICES = ["af_heart", "af_bella", "am_adam", "am_michael", "bf_emma", "bm_george"]


def load_image(path: str) -> str:
    """Load image and return base64."""
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def run_benchmark(
    image_path: str,
    text_key: str = "medium",
    profiles: list = None,
    voices: list = None,
    output_dir: str = "benchmark_results",
):
    """Run benchmark tests."""
    profiles = profiles or ["fast"]
    voices = voices or ["af_heart"]
    text = TEST_TEXTS[text_key]
    
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    # Load image
    print(f"Loading image: {image_path}")
    image_b64 = load_image(image_path)
    image_name = Path(image_path).stem
    
    results = []
    
    for profile in profiles:
        for voice in voices:
            print(f"\n{'='*60}")
            print(f"Profile: {profile} | Voice: {voice} | Text: {text_key}")
            print(f"{'='*60}")
            
            # Run generation
            start_time = time.time()
            
            try:
                result = InfiniteTalkService().generate_from_text.remote(
                    image_b64=image_b64,
                    text=text,
                    voice=voice,
                    profile=profile,
                )
                
                elapsed = time.time() - start_time
                
                # Save video
                video_name = f"{image_name}_{profile}_{voice}_{text_key}.mp4"
                video_path = output_path / video_name
                video_data = base64.b64decode(result["output_mp4_b64"])
                with open(video_path, "wb") as f:
                    f.write(video_data)
                
                # Record results
                benchmark_result = {
                    "timestamp": datetime.now().isoformat(),
                    "image": image_path,
                    "profile": profile,
                    "voice": voice,
                    "text_key": text_key,
                    "text_length": len(text),
                    "audio_duration": result.get("audio_duration", 0),
                    "frame_count": result.get("frame_num", 0),
                    "generation_time_sec": round(elapsed, 2),
                    "output_file": str(video_path),
                    "success": True,
                }
                
                print(f"✅ Generated in {elapsed:.1f}s")
                print(f"   Audio: {result.get('audio_duration', 0):.1f}s")
                print(f"   Frames: {result.get('frame_num', 0)}")
                print(f"   Saved: {video_path}")
                
            except Exception as e:
                elapsed = time.time() - start_time
                benchmark_result = {
                    "timestamp": datetime.now().isoformat(),
                    "image": image_path,
                    "profile": profile,
                    "voice": voice,
                    "text_key": text_key,
                    "generation_time_sec": round(elapsed, 2),
                    "success": False,
                    "error": str(e),
                }
                print(f"❌ Failed: {e}")
            
            results.append(benchmark_result)
    
    # Save results
    results_file = output_path / f"benchmark_{image_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(results_file, "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📊 Results saved to: {results_file}")
    
    # Summary
    print("\n" + "="*60)
    print("BENCHMARK SUMMARY")
    print("="*60)
    
    successful = [r for r in results if r["success"]]
    if successful:
        avg_time = sum(r["generation_time_sec"] for r in successful) / len(successful)
        print(f"Total runs: {len(results)}")
        print(f"Successful: {len(successful)}")
        print(f"Average generation time: {avg_time:.1f}s")
        
        print("\nBy profile:")
        for profile in profiles:
            profile_results = [r for r in successful if r["profile"] == profile]
            if profile_results:
                avg = sum(r["generation_time_sec"] for r in profile_results) / len(profile_results)
                print(f"  {profile}: {avg:.1f}s avg")
    
    return results


def main():
    parser = argparse.ArgumentParser(description="Benchmark InfiniteTalk")
    parser.add_argument("--image", required=True, help="Path to face image")
    parser.add_argument("--text", choices=["short", "medium", "long"], default="medium")
    parser.add_argument("--profiles", default="fast", help="Comma-separated profiles")
    parser.add_argument("--voices", default="af_heart", help="Comma-separated voices")
    parser.add_argument("--all-profiles", action="store_true", help="Test all profiles")
    parser.add_argument("--all-voices", action="store_true", help="Test all voices")
    parser.add_argument("--output", default="benchmark_results", help="Output directory")
    
    args = parser.parse_args()
    
    profiles = PROFILES if args.all_profiles else args.profiles.split(",")
    voices = VOICES if args.all_voices else args.voices.split(",")
    
    run_benchmark(
        image_path=args.image,
        text_key=args.text,
        profiles=profiles,
        voices=voices,
        output_dir=args.output,
    )


if __name__ == "__main__":
    main()
