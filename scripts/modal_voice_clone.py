"""
Modal deployment for IndexTTS-2 voice cloning.
Scales to zero when not in use - only charges when actively processing.

Deploy: modal deploy scripts/modal_voice_clone.py
Test:   modal run scripts/modal_voice_clone.py --text "Hello world" --voice-ref path/to/voice.wav

Features:
- GPU-accelerated voice cloning
- Scales to zero after 5 minutes idle (no cost when not in use)
- Persistent model cache (fast cold starts after first run)
- REST API for easy integration
"""

import modal

app = modal.App("voice-clone-indextts2")

# GPU image with IndexTTS-2 dependencies
image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("git", "ffmpeg", "libsndfile1")
    .pip_install(
        "torch>=2.0.0",
        "torchaudio",
        "transformers",
        "accelerate",
        "scipy",
        "numpy",
        "librosa",
        "soundfile",
        "gradio_client",
        "fastapi",
    )
)

# Persistent volume for model weights
model_cache = modal.Volume.from_name("indextts2-cache", create_if_missing=True)


@app.function(
    image=image,
    volumes={"/cache": model_cache},
    gpu="T4",
    memory=16384,
    timeout=600,
    container_idle_timeout=300,  # Scale to zero after 5 min idle
)
def clone_voice(
    voice_ref_bytes: bytes,
    text: str,
    emotion_method: str = "Same as the voice reference",
    emotion_weight: float = 0.8,
) -> bytes:
    """
    Clone a voice using IndexTTS-2 via Hugging Face.
    
    Args:
        voice_ref_bytes: Voice reference audio as bytes (WAV format)
        text: Text to synthesize
        emotion_method: "Same as the voice reference", "Use emotion vectors", etc.
        emotion_weight: Emotion influence (0-1)
    
    Returns:
        Generated audio as bytes (WAV format)
    """
    import os
    import tempfile
    import shutil
    from gradio_client import Client, handle_file
    
    os.environ["HF_HOME"] = "/cache"
    
    # Save voice reference to temp file
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(voice_ref_bytes)
        voice_ref_path = f.name
    
    try:
        print(f"Connecting to IndexTTS-2...")
        client = Client("IndexTeam/IndexTTS-2-Demo")
        
        print(f"Generating speech: '{text[:50]}...'")
        result = client.predict(
            emo_control_method=emotion_method,
            prompt=handle_file(voice_ref_path),
            text=text,
            emo_ref_path=handle_file(voice_ref_path),
            emo_weight=emotion_weight,
            vec1=0,  # Happy
            vec2=0,  # Angry
            vec3=0,  # Sad
            vec4=0,  # Afraid
            vec5=0,  # Disgusted
            vec6=0,  # Melancholic
            vec7=0,  # Surprised
            vec8=0,  # Calm
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
        
        # Handle response format
        if isinstance(result, dict):
            audio_path = result.get("value")
        else:
            audio_path = result
        
        if audio_path and os.path.exists(audio_path):
            with open(audio_path, "rb") as f:
                audio_bytes = f.read()
            print(f"Generated {len(audio_bytes)} bytes of audio")
            return audio_bytes
        else:
            raise ValueError("No audio generated")
            
    finally:
        os.unlink(voice_ref_path)


@app.function(
    image=image,
    volumes={"/cache": model_cache},
    gpu="T4",
    memory=16384,
    timeout=600,
    container_idle_timeout=300,
)
def clone_voice_with_emotions(
    voice_ref_bytes: bytes,
    text: str,
    happy: float = 0,
    angry: float = 0,
    sad: float = 0,
    afraid: float = 0,
    disgusted: float = 0,
    melancholic: float = 0,
    surprised: float = 0,
    calm: float = 0,
) -> bytes:
    """Clone voice with explicit emotion control."""
    import os
    import tempfile
    from gradio_client import Client, handle_file
    
    os.environ["HF_HOME"] = "/cache"
    
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(voice_ref_bytes)
        voice_ref_path = f.name
    
    try:
        client = Client("IndexTeam/IndexTTS-2-Demo")
        
        result = client.predict(
            emo_control_method="Use emotion vectors",
            prompt=handle_file(voice_ref_path),
            text=text,
            emo_ref_path=handle_file(voice_ref_path),
            emo_weight=0.8,
            vec1=happy,
            vec2=angry,
            vec3=sad,
            vec4=afraid,
            vec5=disgusted,
            vec6=melancholic,
            vec7=surprised,
            vec8=calm,
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
        
        if isinstance(result, dict):
            audio_path = result.get("value")
        else:
            audio_path = result
        
        if audio_path and os.path.exists(audio_path):
            with open(audio_path, "rb") as f:
                return f.read()
        raise ValueError("No audio generated")
            
    finally:
        os.unlink(voice_ref_path)


@app.local_entrypoint()
def main(
    text: str = "Hello, this is a test of the voice cloning system.",
    voice_ref: str = "",
):
    """Test the voice cloning locally."""
    import os
    
    if not voice_ref:
        print("Usage: modal run scripts/modal_voice_clone.py --text 'Your text' --voice-ref path/to/voice.wav")
        return
    
    if not os.path.exists(voice_ref):
        print(f"Voice reference not found: {voice_ref}")
        return
    
    with open(voice_ref, "rb") as f:
        voice_bytes = f.read()
    
    print(f"Text: {text}")
    print(f"Voice ref: {voice_ref} ({len(voice_bytes)} bytes)")
    
    result = clone_voice.remote(voice_bytes, text)
    
    output_path = "output_cloned.wav"
    with open(output_path, "wb") as f:
        f.write(result)
    
    print(f"✅ Saved: {output_path} ({len(result)} bytes)")


# REST API endpoints
@app.function(image=image, cpu=1, memory=512, timeout=60)
@modal.fastapi_endpoint(method="GET")
async def health() -> dict:
    """Health check - always available, no GPU cost."""
    return {
        "status": "ok",
        "app": "voice-clone-indextts2",
        "model": "IndexTTS-2",
        "scaling": "zero-to-one",
    }


@app.function(
    image=image,
    volumes={"/cache": model_cache},
    gpu="T4",
    memory=16384,
    timeout=600,
    container_idle_timeout=300,
)
@modal.fastapi_endpoint(method="POST")
async def api_clone_voice(request: dict) -> dict:
    """
    REST API for voice cloning.
    
    Request body:
    {
        "voice_ref": "<base64 encoded WAV>",
        "text": "Text to synthesize",
        "emotion_method": "Same as the voice reference" (optional),
        "emotion_weight": 0.8 (optional)
    }
    
    Response:
    {
        "audio": "<base64 encoded WAV>",
        "size_bytes": 12345
    }
    """
    import base64
    
    voice_ref_b64 = request.get("voice_ref", "")
    text = request.get("text", "")
    emotion_method = request.get("emotion_method", "Same as the voice reference")
    emotion_weight = request.get("emotion_weight", 0.8)
    
    if not voice_ref_b64 or not text:
        return {"error": "Missing voice_ref or text"}
    
    voice_bytes = base64.b64decode(voice_ref_b64)
    
    result_bytes = clone_voice.local(voice_bytes, text, emotion_method, emotion_weight)
    
    return {
        "audio": base64.b64encode(result_bytes).decode(),
        "size_bytes": len(result_bytes),
    }
