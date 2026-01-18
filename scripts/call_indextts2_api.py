#!/usr/bin/env python3
"""
IndexTTS2 Hugging Face API Client
Voice cloning with emotion control
"""

import argparse
import os
import sys

def main():
    parser = argparse.ArgumentParser(description='IndexTTS2 Voice Cloning')
    parser.add_argument('--voice', required=True, help='Path to voice reference audio')
    parser.add_argument('--text', required=True, help='Text to synthesize')
    parser.add_argument('--output', required=True, help='Output audio path')
    parser.add_argument('--emotion-method', default='Same as the voice reference',
                       help='Emotion control method')
    parser.add_argument('--happy', type=float, default=0.0)
    parser.add_argument('--sad', type=float, default=0.0)
    parser.add_argument('--angry', type=float, default=0.0)
    parser.add_argument('--calm', type=float, default=0.0)
    parser.add_argument('--surprised', type=float, default=0.0)
    parser.add_argument('--fearful', type=float, default=0.0)
    parser.add_argument('--disgusted', type=float, default=0.0)
    
    args = parser.parse_args()
    
    try:
        from gradio_client import Client, handle_file
    except ImportError:
        print("Installing gradio_client...")
        os.system(f"{sys.executable} -m pip install gradio_client -q")
        from gradio_client import Client, handle_file
    
    hf_token = os.environ.get('HF_TOKEN', '')
    
    print(f"Connecting to IndexTTS2 API...")
    # Connect to the Hugging Face space
    if hf_token:
        client = Client("Tonic/IndexTTS2", hf_token=hf_token)
    else:
        client = Client("Tonic/IndexTTS2")
    
    # Build emotion vector if using emotion control
    emotion_values = [
        args.happy, args.sad, args.angry, args.surprised,
        args.fearful, args.disgusted, args.calm
    ]
    
    print(f"Generating speech...")
    result = client.predict(
        prompt=args.voice,
        text=args.text,
        emotion_control_method=args.emotion_method,
        happy=args.happy,
        sad=args.sad,
        angry=args.angry,
        surprised=args.surprised,
        fearful=args.fearful,
        disgusted=args.disgusted,
        calm=args.calm,
        api_name="/generate_speech"
    )
    
    # Result is path to generated audio
    if result and os.path.exists(result):
        import shutil
        os.makedirs(os.path.dirname(args.output), exist_ok=True)
        shutil.copy(result, args.output)
        print(f"✓ Saved to {args.output}")
    else:
        print(f"✗ Generation failed")
        sys.exit(1)

if __name__ == '__main__':
    main()
