#!/usr/bin/env python3
"""Quick test script for the unified video-lab API."""

import base64
import json
import sys
from pathlib import Path

import requests

API_URL = "https://isaiahdupree33--video-lab-fastapi-app.modal.run"

def test_health():
    """Test the health endpoint."""
    resp = requests.get(f"{API_URL}/health")
    print(f"Health: {resp.json()}")
    return resp.status_code == 200

def test_infinitetalk(image_path: str, audio_path: str, output_path: str = "/tmp/test_infinitetalk.mp4"):
    """Test InfiniteTalk generation."""
    print(f"Testing InfiniteTalk with:")
    print(f"  Image: {image_path}")
    print(f"  Audio: {audio_path}")
    
    image_b64 = base64.b64encode(Path(image_path).read_bytes()).decode()
    audio_b64 = base64.b64encode(Path(audio_path).read_bytes()).decode()
    
    payload = {
        "model": "infinitetalk",
        "profile": "low_vram",
        "prompt": "a person talking naturally",
        "image_b64": image_b64,
        "audio_b64": audio_b64,
        "max_duration_sec": 5.0,  # Keep it short for testing
    }
    
    print("Sending request to API...")
    resp = requests.post(f"{API_URL}/generate", json=payload, timeout=600)
    
    if resp.status_code == 200:
        result = resp.json()
        print(f"Success! Request ID: {result.get('request_id')}")
        
        # Decode and save video
        if "output_mp4_b64" in result:
            video_bytes = base64.b64decode(result["output_mp4_b64"])
            Path(output_path).write_bytes(video_bytes)
            print(f"Video saved to: {output_path}")
            return True
    else:
        print(f"Error {resp.status_code}:")
        print(resp.text)
        return False

def main():
    # Default test files
    image_path = "public/assets/images/test_face.jpg"
    audio_path = "public/assets/audio/test_audio_16k.wav"
    
    if len(sys.argv) > 2:
        image_path = sys.argv[1]
        audio_path = sys.argv[2]
    
    print("=" * 60)
    print("Testing Video Lab API")
    print("=" * 60)
    
    if not test_health():
        print("Health check failed!")
        return 1
    
    print()
    if not test_infinitetalk(image_path, audio_path):
        print("InfiniteTalk test failed!")
        return 1
    
    print()
    print("All tests passed!")
    return 0

if __name__ == "__main__":
    sys.exit(main())
