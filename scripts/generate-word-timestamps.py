#!/usr/bin/env python3
"""
Generate word-level timestamps for all voiceovers using OpenAI Whisper API
"""

import os
import json
import urllib.request
from pathlib import Path

# Load environment variables
def load_env():
    env_path = ".env.local"
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value

VOICEOVER_DIR = "public/assets/audio/voiceover/aircraft"
OUTPUT_FILE = "public/assets/audio/voiceover/aircraft/timestamps.json"

SECTIONS = [
    "hook", "beginner_intro", "beginner_lift", "beginner_shape",
    "expert_intro", "expert_bernoulli", "expert_circulation", "expert_angle",
    "postgrad_intro", "postgrad_navier", "postgrad_boundary", "postgrad_cfd", "outro"
]

def get_word_timestamps(audio_path: str, api_key: str) -> dict:
    """Get word-level timestamps using OpenAI Whisper API"""
    import http.client
    import mimetypes
    import uuid
    
    # Read audio file
    with open(audio_path, 'rb') as f:
        audio_data = f.read()
    
    # Create multipart form data
    boundary = uuid.uuid4().hex
    
    body = b''
    body += f'--{boundary}\r\n'.encode()
    body += b'Content-Disposition: form-data; name="file"; filename="audio.wav"\r\n'
    body += b'Content-Type: audio/wav\r\n\r\n'
    body += audio_data
    body += b'\r\n'
    body += f'--{boundary}\r\n'.encode()
    body += b'Content-Disposition: form-data; name="model"\r\n\r\n'
    body += b'whisper-1'
    body += b'\r\n'
    body += f'--{boundary}\r\n'.encode()
    body += b'Content-Disposition: form-data; name="response_format"\r\n\r\n'
    body += b'verbose_json'
    body += b'\r\n'
    body += f'--{boundary}\r\n'.encode()
    body += b'Content-Disposition: form-data; name="timestamp_granularities[]"\r\n\r\n'
    body += b'word'
    body += b'\r\n'
    body += f'--{boundary}--\r\n'.encode()
    
    # Make request
    conn = http.client.HTTPSConnection("api.openai.com")
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': f'multipart/form-data; boundary={boundary}'
    }
    
    conn.request("POST", "/v1/audio/transcriptions", body, headers)
    response = conn.getresponse()
    result = json.loads(response.read().decode())
    conn.close()
    
    return result

def main():
    load_env()
    api_key = os.environ.get('OPENAI_API_KEY', '')
    
    if not api_key:
        print("❌ OPENAI_API_KEY not set")
        return
    
    print("🎙 Generating Word-Level Timestamps")
    print("=" * 50)
    
    all_timestamps = {}
    
    for section_id in SECTIONS:
        audio_path = os.path.join(VOICEOVER_DIR, f"{section_id}_vo.wav")
        
        if not os.path.exists(audio_path):
            print(f"  ⚠ Skipping {section_id} - file not found")
            continue
        
        print(f"  Processing: {section_id}...")
        
        try:
            result = get_word_timestamps(audio_path, api_key)
            
            # Extract word timings
            words = result.get('words', [])
            duration = result.get('duration', 0)
            text = result.get('text', '')
            
            all_timestamps[section_id] = {
                'text': text,
                'duration': duration,
                'words': words
            }
            
            print(f"    ✓ {len(words)} words, {duration:.2f}s")
            
        except Exception as e:
            print(f"    ❌ Error: {e}")
    
    # Save timestamps
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(all_timestamps, f, indent=2)
    
    print()
    print("=" * 50)
    print(f"✅ Timestamps saved to: {OUTPUT_FILE}")
    
    # Calculate total duration
    total_duration = sum(t.get('duration', 0) for t in all_timestamps.values())
    total_frames = int(total_duration * 30)  # 30 fps
    print(f"📊 Total audio duration: {total_duration:.2f}s ({total_frames} frames at 30fps)")

if __name__ == '__main__':
    main()
