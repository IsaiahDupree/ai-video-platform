#!/usr/bin/env python3
"""
Test multiple Hugging Face voice cloning models to find the best one
"""

import os
import sys
import time

# Voice reference
VOICE_REF = "public/assets/voices/tiktok_voice_short.wav"
TEST_TEXT = "Ever wonder how a 500-ton airplane stays in the air?"
OUTPUT_DIR = "public/assets/audio/test_outputs"

# Models to test
MODELS = [
    {
        "name": "VibeVoiceCloning",
        "space": "TotoZip/VibeVoiceCloning",
        "api": None,  # Will discover
        "params": lambda ref: {
            "text": TEST_TEXT,
            "audio": ref,
        }
    },
    {
        "name": "Clone-Voice",
        "space": "rahul7star/Clone-Voice",
        "api": None,
        "params": lambda ref: {
            "text": TEST_TEXT,
            "audio": ref,
        }
    },
    {
        "name": "fosters-xttsv2",
        "space": "fosters/xttsv2",
        "api": None,
        "params": lambda ref: {
            "text": TEST_TEXT,
            "audio": ref,
        }
    },
    {
        "name": "Mira-TTS",
        "space": "Gapeleon/Mira-TTS",
        "api": None,
        "params": lambda ref: {
            "text": TEST_TEXT,
            "audio": ref,
        }
    },
    {
        "name": "MARS5-TTS",
        "space": "Aimoxyz/mars5-tts-voice-cloning",
        "api": "/generate_speech",
        "params": lambda ref: {
            "text": TEST_TEXT,
            "reference_audio": ref,
            "transcript": "",
            "cloning_type": "Shallow Clone",
        }
    },
]

def load_env():
    """Load environment variables from .env.local"""
    env_path = ".env.local"
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value

def test_model(model_info):
    """Test a single voice cloning model"""
    import shutil
    from gradio_client import Client
    
    print(f"\n{'='*60}")
    print(f"Testing: {model_info['name']}")
    print(f"Space: {model_info['space']}")
    print(f"{'='*60}")
    
    voice_ref_abs = os.path.abspath(VOICE_REF)
    output_path = os.path.join(OUTPUT_DIR, f"{model_info['name'].replace(' ', '_').replace('/', '_')}_test.wav")
    
    try:
        print("🔗 Connecting...")
        client = Client(model_info['space'])
        print("✓ Connected")
        
        # Auto-discover API if not specified
        if model_info['api'] is None:
            print("🔍 Discovering API endpoints...")
            api_info = str(client.view_api())
            # Try to find first predict endpoint
            if "/predict" in api_info:
                api_name = "/predict"
            else:
                # Get first available endpoint
                import re
                endpoints = re.findall(r'api_name="(/[^"]+)"', api_info)
                api_name = endpoints[0] if endpoints else None
            print(f"   Found: {api_name}")
        else:
            api_name = model_info['api']
        
        if not api_name:
            print(f"❌ FAILED - No API endpoint found")
            return False, None
        
        print(f"🎤 Generating speech: '{TEST_TEXT[:50]}...'")
        params = model_info['params'](voice_ref_abs)
        
        result = client.predict(
            **params,
            api_name=api_name
        )
        
        # Handle different result formats
        if isinstance(result, tuple):
            audio_path = result[0]
        else:
            audio_path = result
        
        if audio_path and os.path.exists(audio_path):
            shutil.copy(audio_path, output_path)
            file_size = os.path.getsize(output_path) / 1024  # KB
            print(f"✅ SUCCESS - Saved: {output_path} ({file_size:.1f} KB)")
            return True, output_path
        else:
            print(f"❌ FAILED - No audio generated")
            return False, None
            
    except Exception as e:
        print(f"❌ FAILED - Error: {str(e)[:150]}")
        return False, None

def main():
    load_env()
    
    print("🎙 Voice Cloning Model Tester")
    print("="*60)
    print(f"Voice reference: {VOICE_REF}")
    print(f"Test text: {TEST_TEXT}")
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Models to test: {len(MODELS)}")
    
    # Check voice reference exists
    if not os.path.exists(VOICE_REF):
        print(f"\n❌ Voice reference not found: {VOICE_REF}")
        sys.exit(1)
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Test each model
    results = []
    for i, model in enumerate(MODELS):
        success, output_path = test_model(model)
        results.append({
            "name": model["name"],
            "space": model["space"],
            "success": success,
            "output": output_path
        })
        
        # Wait between tests
        if i < len(MODELS) - 1:
            print("\n⏳ Waiting 3 seconds before next test...")
            time.sleep(3)
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST RESULTS SUMMARY")
    print("="*60)
    
    successful = [r for r in results if r["success"]]
    failed = [r for r in results if not r["success"]]
    
    if successful:
        print(f"\n✅ Successful ({len(successful)}/{len(MODELS)}):")
        for r in successful:
            print(f"   • {r['name']}")
            print(f"     Space: {r['space']}")
            print(f"     Output: {r['output']}")
    
    if failed:
        print(f"\n❌ Failed ({len(failed)}/{len(MODELS)}):")
        for r in failed:
            print(f"   • {r['name']} ({r['space']})")
    
    print("\n" + "="*60)
    if successful:
        print(f"🎉 Best option: {successful[0]['name']}")
        print(f"   Listen to samples in: {OUTPUT_DIR}")
    else:
        print("😞 No models succeeded. Check errors above.")

if __name__ == '__main__':
    main()
