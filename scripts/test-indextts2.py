#!/usr/bin/env python3
"""
Test script for IndexTTS2 Voice Cloning API
https://huggingface.co/spaces/IndexTeam/IndexTTS-2-Demo
"""

import os
import sys
from pathlib import Path

# Install gradio_client if not available
try:
    from gradio_client import Client, handle_file
except ImportError:
    print("Installing gradio_client...")
    os.system("pip install gradio_client")
    from gradio_client import Client, handle_file


def test_voice_clone(
    voice_reference_path: str,
    text: str,
    output_path: str = None,
    emotion_method: str = "Same as the voice reference",
    emotion_vectors: dict = None,
):
    """
    Test IndexTTS2 voice cloning API.
    
    Args:
        voice_reference_path: Path to the voice reference audio file (wav)
        text: Text to synthesize
        output_path: Optional path to save the output audio
        emotion_method: One of "Same as the voice reference", "Use emotion reference audio", "Use emotion vectors"
        emotion_vectors: Dict with keys: happy, angry, sad, afraid, disgusted, melancholic, surprised, calm (0-1 values)
    """
    print(f"🎤 Connecting to IndexTTS2 API...")
    client = Client("IndexTeam/IndexTTS-2-Demo")
    
    # Default emotion vectors
    ev = emotion_vectors or {}
    
    print(f"📝 Text: {text}")
    print(f"🎧 Voice reference: {voice_reference_path}")
    print(f"😊 Emotion method: {emotion_method}")
    
    # Call the main synthesis endpoint
    result = client.predict(
        emo_control_method=emotion_method,
        prompt=handle_file(voice_reference_path),
        text=text,
        emo_ref_path=handle_file(voice_reference_path),  # Use same file if no separate emotion ref
        emo_weight=0.8,
        vec1=ev.get("happy", 0),
        vec2=ev.get("angry", 0),
        vec3=ev.get("sad", 0),
        vec4=ev.get("afraid", 0),
        vec5=ev.get("disgusted", 0),
        vec6=ev.get("melancholic", 0),
        vec7=ev.get("surprised", 0),
        vec8=ev.get("calm", 0),
        emo_text="",
        emo_random=False,
        max_text_tokens_per_segment=120,
        param_16=True,   # do_sample
        param_17=0.8,    # top_p
        param_18=30,     # top_k
        param_19=0.8,    # temperature
        param_20=0,      # length_penalty
        param_21=3,      # num_beams
        param_22=10,     # repetition_penalty
        param_23=1500,   # max_mel_tokens
        api_name="/gen_single"
    )
    
    print(f"✅ Synthesis complete!")
    print(f"📁 Raw result: {result}")
    
    # Handle dict response format from Gradio
    if isinstance(result, dict):
        audio_path = result.get("value", result)
    else:
        audio_path = result
    
    print(f"🎵 Audio path: {audio_path}")
    
    # Copy to output path if specified
    if output_path and audio_path:
        import shutil
        shutil.copy(audio_path, output_path)
        print(f"💾 Saved to: {output_path}")
        return output_path
    
    return audio_path


def main():
    # Project root
    project_root = Path(__file__).parent.parent
    
    # Voice reference options
    voice_refs = {
        "isaiah": project_root / "public/assets/voices/isaiah.wav",
        "tiktok": project_root / "public/assets/voices/tiktok_voice_ref.wav",
        "hook": project_root / "public/assets/audio/voiceover/hook_vo.wav",
    }
    
    # Default test
    voice_ref = voice_refs.get("isaiah", list(voice_refs.values())[0])
    
    # Check if voice ref exists
    if not voice_ref.exists():
        print(f"❌ Voice reference not found: {voice_ref}")
        print("Available voice references:")
        for name, path in voice_refs.items():
            exists = "✅" if path.exists() else "❌"
            print(f"  {exists} {name}: {path}")
        sys.exit(1)
    
    # Test text
    test_text = "Hello! This is a test of the IndexTTS2 voice cloning system. Pretty cool, right?"
    
    # Output path
    output_dir = project_root / "output" / "voice_clone"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "test_clone.wav"
    
    print("=" * 60)
    print("IndexTTS2 Voice Cloning Test")
    print("=" * 60)
    
    try:
        result = test_voice_clone(
            voice_reference_path=str(voice_ref),
            text=test_text,
            output_path=str(output_path),
        )
        print("\n" + "=" * 60)
        print("✅ Test completed successfully!")
        print(f"🎵 Output: {result}")
        print("=" * 60)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
