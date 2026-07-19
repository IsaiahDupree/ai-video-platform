"""
Modal Voice Clone Service - VC-001
Deploy F5-TTS voice cloning to Modal with FastAPI endpoint

F5-TTS: Zero-shot TTS with voice cloning using just 3-15 seconds of reference audio.
No training needed — provide reference audio and text, get cloned speech back.

Usage:
    modal deploy scripts/modal_voice_clone.py

Environment variables:
    MODAL_TOKEN_ID: Modal authentication token ID
    MODAL_TOKEN_SECRET: Modal authentication secret
"""

import io
import os
import base64
from pathlib import Path

import modal

# Create Modal app
app = modal.App("voice-clone")

# Volume for model weights caching (persists across cold starts)
model_volume = modal.Volume.from_name("voice-clone-models", create_if_missing=True)

# Image with F5-TTS
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch==2.1.0",
        "torchaudio==2.1.0",
        "numpy==1.24.3",
        "scipy==1.11.4",
        "soundfile==0.12.1",
        "fastapi[standard]",
        "requests",
        "huggingface-hub>=0.20.0",
        "cached_path",
        "transformers>=4.35.0",
        "einops",
        "x_transformers>=1.31.14",
        "vocos",
        "pydub",
        "tqdm",
    )
    .run_commands(
        "apt-get update -q",
        "apt-get install -y -q git ffmpeg libsndfile1",
        "pip install f5-tts --quiet",
    )
)


@app.cls(
    image=image,
    gpu="A10G",
    volumes={"/root/models": model_volume},
    timeout=600,
    scaledown_window=300,
)
class VoiceCloner:
    """Voice cloning service using F5-TTS."""

    @modal.enter()
    def setup(self):
        """Load F5-TTS on container startup (cached on volume)."""
        from f5_tts.api import F5TTS
        os.environ["HF_HOME"] = "/root/models"
        print("Loading F5-TTS model...")
        self.tts = F5TTS()
        print("F5-TTS ready")

    @modal.method()
    def clone_voice(
        self,
        text: str,
        reference_audio: bytes,
        ref_text: str = "",
        speaker_name: str = "cloned_voice",
        speed: float = 1.0,
    ) -> bytes:
        """
        Clone a voice and generate speech.

        Args:
            text: Text to synthesize
            reference_audio: Reference audio as bytes (WAV/MP3, 3-15 seconds)
            ref_text: Optional transcript of the reference audio (improves quality)
            speaker_name: For logging only
            speed: 0.5-2.0, default 1.0

        Returns:
            Generated audio as WAV bytes
        """
        import tempfile
        import soundfile as sf

        print(f"Cloning: {text[:80]}... | ref_audio={len(reference_audio)}B")

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as ref_file:
            ref_file.write(reference_audio)
            ref_path = ref_file.name

        try:
            wav, sr, _ = self.tts.infer(
                ref_file=ref_path,
                ref_text=ref_text,
                gen_text=text,
                speed=speed,
            )
            buf = io.BytesIO()
            sf.write(buf, wav, sr, format="WAV")
            buf.seek(0)
            print(f"Done: {len(wav)} samples @ {sr}Hz")
            return buf.read()
        finally:
            os.unlink(ref_path)

    @modal.method()
    def batch_clone(
        self,
        texts: list,
        reference_audio: bytes,
        ref_text: str = "",
        speed: float = 1.0,
    ) -> list:
        """Batch voice cloning for multiple texts."""
        return [self.clone_voice(t, reference_audio, ref_text, speed=speed) for t in texts]


@app.function(image=image)
@modal.fastapi_endpoint(method="POST")
def clone_voice_endpoint(item: dict):
    """
    POST /clone_voice_endpoint

    Body:
      text                    string  required
      reference_audio_base64  string  base64 WAV/MP3 (OR reference_audio_url)
      reference_audio_url     string  URL to fetch reference audio
      ref_text                string  transcript of reference audio (optional)
      speaker_name            string  label for caching
      speed                   float   0.5-2.0 (default 1.0)

    Returns:
      { "audio": "<base64 wav>", "format": "wav", "sample_rate": 24000 }
    """
    import requests as req_lib

    text = item.get("text", "")
    ref_url = item.get("reference_audio_url")
    ref_b64 = item.get("reference_audio_base64")
    ref_text = item.get("ref_text", "")
    speaker_name = item.get("speaker_name", "cloned_voice")
    speed = float(item.get("speed", 1.0))

    if not text:
        return {"error": "text is required"}

    if ref_url:
        r = req_lib.get(ref_url, timeout=30)
        r.raise_for_status()
        reference_audio = r.content
    elif ref_b64:
        reference_audio = base64.b64decode(ref_b64)
    else:
        return {"error": "Must provide reference_audio_url or reference_audio_base64"}

    cloner = VoiceCloner()
    audio_bytes = cloner.clone_voice.remote(
        text=text,
        reference_audio=reference_audio,
        ref_text=ref_text,
        speaker_name=speaker_name,
        speed=speed,
    )

    return {
        "audio": base64.b64encode(audio_bytes).decode(),
        "format": "wav",
        "sample_rate": 24000,
    }


@app.local_entrypoint()
def main(
    text: str = "Hello, this is a test of F5-TTS voice cloning.",
    reference_audio: str = None,
    ref_text: str = "",
):
    if not reference_audio:
        print("Usage: modal run scripts/modal_voice_clone.py --text '...' --reference-audio path.wav")
        return

    with open(reference_audio, "rb") as f:
        ref_bytes = f.read()

    cloner = VoiceCloner()
    audio = cloner.clone_voice.remote(text=text, reference_audio=ref_bytes, ref_text=ref_text)

    out = "output_cloned.wav"
    with open(out, "wb") as f:
        f.write(audio)
    print(f"Saved to {out}")
