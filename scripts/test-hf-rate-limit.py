#!/usr/bin/env python3
"""
Test Hugging Face IndexTTS-2 Rate Limits
Discovers API limits by making sequential requests and tracking timing/errors.
"""

import os
import sys
import time
from pathlib import Path
from datetime import datetime

try:
    from gradio_client import Client, handle_file
except ImportError:
    print("Installing gradio_client...")
    os.system("pip install gradio_client")
    from gradio_client import Client, handle_file


def test_single_request(client, voice_path: str, text: str, request_num: int):
    """Make a single TTS request and return timing info."""
    start_time = time.time()
    
    try:
        result = client.predict(
            emo_control_method="Same as the voice reference",
            prompt=handle_file(voice_path),
            text=text,
            emo_ref_path=handle_file(voice_path),
            emo_weight=0.8,
            vec1=0, vec2=0, vec3=0, vec4=0,
            vec5=0, vec6=0, vec7=0, vec8=0,
            emo_text="",
            emo_random=False,
            max_text_tokens_per_segment=120,
            param_16=True,
            param_17=0.8,
            param_18=30,
            param_19=0.8,
            param_20=0,
            param_21=3,
            param_22=10,
            param_23=1500,
            api_name="/gen_single"
        )
        
        elapsed = time.time() - start_time
        
        # Handle dict response
        if isinstance(result, dict):
            audio_path = result.get("value", result)
        else:
            audio_path = result
            
        return {
            "success": True,
            "request_num": request_num,
            "elapsed_seconds": round(elapsed, 2),
            "audio_path": audio_path,
            "error": None
        }
        
    except Exception as e:
        elapsed = time.time() - start_time
        error_msg = str(e)
        
        # Check for common rate limit indicators
        is_rate_limit = any(x in error_msg.lower() for x in [
            "rate limit", "quota", "exceeded", "too many", 
            "429", "503", "busy", "queue"
        ])
        
        return {
            "success": False,
            "request_num": request_num,
            "elapsed_seconds": round(elapsed, 2),
            "audio_path": None,
            "error": error_msg,
            "is_rate_limit": is_rate_limit
        }


def main():
    project_root = Path(__file__).parent.parent
    voice_path = project_root / "public/assets/voices/isaiah.wav"
    
    if not voice_path.exists():
        print(f"❌ Voice file not found: {voice_path}")
        sys.exit(1)
    
    # Short test texts (varying lengths)
    test_texts = [
        "Test one.",
        "Test two, slightly longer.",
        "Test three with more words to process.",
        "Test four.",
        "Test five, checking the limit.",
        "Test six.",
        "Test seven, are we rate limited yet?",
        "Test eight.",
        "Test nine, almost at ten requests.",
        "Test ten, the final countdown.",
    ]
    
    print("=" * 70)
    print("🔬 HUGGING FACE INDEXTTS-2 RATE LIMIT TEST")
    print("=" * 70)
    print(f"⏰ Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎤 Voice: {voice_path}")
    print(f"📝 Planned requests: {len(test_texts)}")
    print("=" * 70)
    print()
    
    # Connect to API
    print("🔌 Connecting to IndexTTS-2 API...")
    try:
        client = Client("IndexTeam/IndexTTS-2-Demo")
        print("✅ Connected!\n")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)
    
    # Track results
    results = []
    total_gpu_time = 0
    
    for i, text in enumerate(test_texts, 1):
        print(f"[{i}/{len(test_texts)}] Requesting: \"{text[:30]}...\"")
        
        result = test_single_request(client, str(voice_path), text, i)
        results.append(result)
        
        if result["success"]:
            total_gpu_time += result["elapsed_seconds"]
            print(f"    ✅ Success in {result['elapsed_seconds']}s (Total GPU: {total_gpu_time:.1f}s)")
        else:
            print(f"    ❌ Failed: {result['error'][:80]}...")
            if result.get("is_rate_limit"):
                print(f"\n🚫 RATE LIMIT DETECTED at request #{i}")
                print(f"   Total successful: {i-1}")
                print(f"   Total GPU time used: {total_gpu_time:.1f}s")
                break
        
        # Small delay between requests
        time.sleep(0.5)
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 RESULTS SUMMARY")
    print("=" * 70)
    
    successful = [r for r in results if r["success"]]
    failed = [r for r in results if not r["success"]]
    
    print(f"✅ Successful requests: {len(successful)}")
    print(f"❌ Failed requests: {len(failed)}")
    print(f"⏱️  Total GPU time: {total_gpu_time:.1f} seconds")
    print(f"📈 Avg time per request: {total_gpu_time/len(successful):.2f}s" if successful else "N/A")
    
    if failed:
        print("\n⚠️  Errors encountered:")
        for r in failed:
            print(f"   Request #{r['request_num']}: {r['error'][:60]}...")
    
    # Rate limit analysis
    print("\n" + "=" * 70)
    print("🔍 RATE LIMIT ANALYSIS")
    print("=" * 70)
    
    if len(successful) == len(test_texts):
        print("✅ No rate limit hit during this test!")
        print(f"   You can likely make {len(test_texts)}+ requests")
        print(f"   Total GPU time used: {total_gpu_time:.1f}s")
        print("   Free tier limit is typically ~60s GPU/day")
        remaining = max(0, 60 - total_gpu_time)
        print(f"   Estimated remaining: ~{remaining:.0f}s")
    else:
        limit_at = len(successful)
        print(f"🚫 Rate limit detected at request #{limit_at + 1}")
        print(f"   Safe request count: {limit_at}")
        print(f"   GPU time before limit: {total_gpu_time:.1f}s")
    
    print("\n" + "=" * 70)


if __name__ == "__main__":
    main()
