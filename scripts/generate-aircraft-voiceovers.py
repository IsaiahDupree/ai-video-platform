#!/usr/bin/env python3
"""
Generate all voiceovers for Aircraft Wings video using IndexTTS2 voice cloning
Uses the extracted TikTok voice as reference
"""

import os
import sys
import time

# Voice reference - use isaiah.wav which works with IndexTTS2
VOICE_REF = "public/assets/voices/isaiah.wav"
OUTPUT_DIR = "public/assets/audio/voiceover/aircraft"

# All sections with their text
SECTIONS = [
    {
        "id": "hook",
        "text": "Ever wonder how a 500-ton airplane stays in the air? It all comes down to how air flows differently over the wing."
    },
    {
        "id": "beginner_intro",
        "text": "Let's start simple. Air moves faster over the top of a wing and slower underneath."
    },
    {
        "id": "beginner_lift",
        "text": "Faster air means lower pressure. The higher pressure below pushes the wing up. That's lift!"
    },
    {
        "id": "beginner_shape",
        "text": "Wings are curved on top and flatter below. This shape forces air to travel different distances."
    },
    {
        "id": "expert_intro",
        "text": "Now let's go deeper. We need to understand Bernoulli's principle and the continuity equation."
    },
    {
        "id": "expert_bernoulli",
        "text": "P plus one-half rho v squared plus rho g h equals constant. Pressure and velocity are inversely related in a streamline."
    },
    {
        "id": "expert_circulation",
        "text": "Lift also comes from circulation - the net rotation of airflow around the wing. This is described by the Kutta-Joukowski theorem."
    },
    {
        "id": "expert_angle",
        "text": "Increasing angle of attack increases lift, but too much causes flow separation and stall. There's a critical angle."
    },
    {
        "id": "postgrad_intro",
        "text": "Time for the full picture. We're solving the Navier-Stokes equations for viscous, compressible flow."
    },
    {
        "id": "postgrad_navier",
        "text": "Rho times the material derivative of velocity equals negative pressure gradient plus viscous stress tensor divergence plus body forces."
    },
    {
        "id": "postgrad_boundary",
        "text": "Near the wing surface, viscosity dominates. The boundary layer transitions from laminar to turbulent, affecting drag and separation."
    },
    {
        "id": "postgrad_cfd",
        "text": "Modern analysis uses computational fluid dynamics with Reynolds-averaged Navier-Stokes and turbulence closure models like k-epsilon or k-omega SST."
    },
    {
        "id": "outro",
        "text": "That's differential flow over wings - from basic pressure differences to solving partial differential equations. Follow for more aerospace science!"
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

def main():
    load_env()
    
    print("🎙 Aircraft Wings Voiceover Generator")
    print("=" * 50)
    print(f"Voice reference: {VOICE_REF}")
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Sections to generate: {len(SECTIONS)}")
    print()

    # Check voice reference exists
    if not os.path.exists(VOICE_REF):
        print(f"❌ Voice reference not found: {VOICE_REF}")
        sys.exit(1)

    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Try IndexTTS2 first, fall back to OpenAI
    hf_token = os.environ.get('HF_TOKEN', '')
    
    # Try IndexTTS-2 first
    if hf_token:
        try:
            from gradio_client import Client
            print("🔗 Connecting to IndexTTS-2 on Hugging Face...")
            client = Client("IndexTeam/IndexTTS-2-Demo")
            print("✓ Connected to IndexTTS-2")
            generate_with_indextts2(client)
            return
        except Exception as e:
            print(f"⚠ IndexTTS-2 failed: {e}")
            print("Falling back to OpenAI TTS...")
    
    # Use OpenAI TTS as fallback
    generate_with_openai()


def generate_with_indextts2(client):
    """Generate voiceovers using IndexTTS-2 voice cloning"""
    import shutil
    from gradio_client import handle_file
    
    # Get absolute path to voice reference
    voice_ref_abs = os.path.abspath(VOICE_REF)
    
    print("🎤 Using IndexTTS-2 with emotion control")
    print(f"🎧 Voice reference: {voice_ref_abs}")
    print()
    
    for i, section in enumerate(SECTIONS):
        output_path = os.path.join(OUTPUT_DIR, f"{section['id']}_vo.wav")
        
        print(f"[{i+1}/{len(SECTIONS)}] Generating: {section['id']}")
        print(f"    Text: {section['text'][:50]}...")
        
        try:
            # IndexTTS-2 API with handle_file for audio uploads
            result = client.predict(
                emo_control_method="Same as the voice reference",
                prompt=handle_file(voice_ref_abs),
                text=section['text'],
                emo_ref_path=handle_file(voice_ref_abs),
                emo_weight=0.8,
                vec1=0,
                vec2=0,
                vec3=0,
                vec4=0,
                vec5=0,
                vec6=0,
                vec7=0,
                vec8=0,
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
            
            # Handle dict response format from Gradio
            if isinstance(result, dict):
                audio_path = result.get("value", result)
            else:
                audio_path = result
            
            if audio_path and os.path.exists(audio_path):
                shutil.copy(audio_path, output_path)
                print(f"    ✓ Saved: {output_path}")
            else:
                print(f"    ❌ Generation returned no result: {result}")
                
        except Exception as e:
            print(f"    ❌ Error: {str(e)[:100]}")
        
        time.sleep(2)  # Rate limit for API

    print()
    print("=" * 50)
    print("✅ Voiceover generation complete!")


def generate_with_openai():
    """Fallback to OpenAI TTS if IndexTTS2 fails"""
    import urllib.request
    import json
    
    openai_key = os.environ.get('OPENAI_API_KEY', '')
    if not openai_key:
        print("❌ OPENAI_API_KEY not set. Cannot generate voiceovers.")
        print("\nTo generate voiceovers, either:")
        print("  1. Set HF_TOKEN for Hugging Face IndexTTS2")
        print("  2. Set OPENAI_API_KEY for OpenAI TTS")
        sys.exit(1)
    
    print("🎙 Using OpenAI TTS (voice: onyx)")
    print()
    
    for i, section in enumerate(SECTIONS):
        output_path = os.path.join(OUTPUT_DIR, f"{section['id']}_vo.wav")
        print(f"[{i+1}/{len(SECTIONS)}] Generating: {section['id']}")
        print(f"    Text: {section['text'][:50]}...")
        
        try:
            data = json.dumps({
                "model": "tts-1",
                "input": section['text'],
                "voice": "onyx",
                "response_format": "wav"
            }).encode('utf-8')
            
            req = urllib.request.Request(
                "https://api.openai.com/v1/audio/speech",
                data=data,
                headers={
                    "Authorization": f"Bearer {openai_key}",
                    "Content-Type": "application/json"
                }
            )
            
            with urllib.request.urlopen(req) as response:
                with open(output_path, 'wb') as f:
                    f.write(response.read())
            
            print(f"    ✓ Saved: {output_path}")
            
        except Exception as e:
            print(f"    ❌ Error: {e}")
        
        time.sleep(0.5)
    
    print()
    print("=" * 50)
    print("✅ Voiceover generation complete!")


if __name__ == '__main__':
    main()
