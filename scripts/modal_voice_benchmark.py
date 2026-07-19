"""
Voice Model Benchmark — Modal deployment
Tests 3 models side-by-side with the same reference audio:

  1. XTTS v2    — Coqui zero-shot voice clone (reference audio)
  2. Kokoro     — Ultra-fast TTS, American English (no clone, quality baseline)
  3. Parler TTS — Instruction-based TTS (describe voice style in a prompt)

Usage:
    modal deploy scripts/modal_voice_benchmark.py
    # Then call each endpoint with the same text + reference audio

Endpoints:
  /xtts_endpoint    POST { text, reference_audio_base64, language="en" }
  /kokoro_endpoint  POST { text, voice="af_heart" }
  /parler_endpoint  POST { text, description="A male voice speaks clearly..." }

All return:
  { "audio": "<base64 wav>", "format": "wav", "sample_rate": <int>, "model": "<name>" }
"""

import io
import os
import base64

import modal

app = modal.App("voice-benchmark")

model_volume = modal.Volume.from_name("voice-benchmark-models", create_if_missing=True)

# ── XTTS v2 ──────────────────────────────────────────────────────────────────

xtts_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "TTS==0.22.0",
        "torch==2.1.0",
        "torchaudio==2.1.0",
        "numpy==1.24.3",
        "soundfile==0.12.1",
        "fastapi[standard]",
        "requests",
    )
    .run_commands(
        "apt-get update -q",
        "apt-get install -y -q ffmpeg libsndfile1",
    )
)


@app.cls(
    image=xtts_image,
    gpu="A10G",
    volumes={"/root/models": model_volume},
    timeout=600,
    scaledown_window=120,
)
class XTTSCloner:
    @modal.enter()
    def setup(self):
        from TTS.api import TTS
        os.environ["HF_HOME"] = "/root/models"
        os.environ["COQUI_TOS_AGREED"] = "1"
        print("Loading XTTS v2...")
        self.tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=True)
        print("XTTS v2 ready")

    @modal.web_endpoint(method="POST")
    def endpoint(self, item: dict):
        """XTTS v2 zero-shot voice clone. Body: {text, reference_audio_base64, language}"""
        import tempfile
        text = item.get("text", "")
        ref_b64 = item.get("reference_audio_base64") or item.get("reference_audio")
        language = item.get("language", "en")
        if not text:
            return {"error": "text required"}
        if not ref_b64:
            return {"error": "reference_audio_base64 required"}
        reference_audio = base64.b64decode(ref_b64)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as ref:
            ref.write(reference_audio)
            ref_path = ref.name
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as out:
            out_path = out.name
        try:
            self.tts.tts_to_file(text=text, speaker_wav=ref_path, language=language, file_path=out_path)
            with open(out_path, "rb") as f:
                audio_bytes = f.read()
            return {"audio": base64.b64encode(audio_bytes).decode(), "format": "wav", "model": "xtts_v2"}
        finally:
            os.unlink(ref_path)
            try: os.unlink(out_path)
            except: pass


# ── Kokoro ───────────────────────────────────────────────────────────────────

kokoro_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "kokoro>=0.9.2",
        "soundfile==0.12.1",
        "fastapi[standard]",
        "requests",
        "numpy==1.24.3",
    )
    .run_commands(
        "apt-get update -q",
        "apt-get install -y -q libsndfile1 espeak-ng",
    )
)

# Kokoro voices: af_heart, af_bella, af_nicole, am_adam, am_michael,
#                bf_emma, bf_isabella, bm_george, bm_lewis
KOKORO_VOICES = ["af_heart", "af_bella", "am_adam", "am_michael", "bm_george"]


@app.cls(
    image=kokoro_image,
    gpu="T4",
    volumes={"/root/models": model_volume},
    timeout=120,
    scaledown_window=60,
)
class KokoroTTS:
    @modal.enter()
    def setup(self):
        from kokoro import KPipeline
        print("Loading Kokoro...")

        # Only one pipeline needed — voice is set per-call
        self.pipeline = KPipeline(lang_code="a")

        print("Kokoro ready")

    @modal.method()
    def generate(self, text: str, voice: str = "am_adam") -> bytes:
        import soundfile as sf, numpy as np
        if voice not in ["af_heart","af_bella","am_adam","am_michael","bm_george"]:
            voice = "am_adam"
        pipeline = self.pipeline
        chunks = []
        for _, _, audio_chunk in pipeline(text, voice=voice, speed=1.0):
            chunks.append(audio_chunk)
        audio = np.concatenate(chunks) if len(chunks) > 1 else chunks[0]
        buf = io.BytesIO()
        sf.write(buf, audio, 24000, format="WAV")
        buf.seek(0)
        return buf.read()


@app.function(image=kokoro_image)
@modal.fastapi_endpoint(method="POST")
def kokoro_endpoint(item: dict):
    """Kokoro TTS. Body: {text, voice} — voice options: af_heart, af_bella, am_adam, am_michael, bm_george"""
    text = item.get("text", "")
    voice = item.get("voice", "am_adam")
    if not text:
        return {"error": "text required"}
    tts = KokoroTTS()
    audio = tts.generate.remote(text=text, voice=voice)
    return {"audio": base64.b64encode(audio).decode(), "format": "wav", "model": f"kokoro_{voice}", "sample_rate": 24000}


# ── Parler TTS ───────────────────────────────────────────────────────────────

parler_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "parler-tts",
        "transformers>=4.43.0",
        "torch==2.1.0",
        "soundfile==0.12.1",
        "fastapi[standard]",
        "requests",
        "numpy==1.24.3",
        "accelerate",
    )
    .run_commands(
        "apt-get update -q",
        "apt-get install -y -q libsndfile1",
    )
)

PARLER_DESCRIPTION = (
    "A male voice with a clear, confident tone, speaking at a moderate pace "
    "with slight enthusiasm. The recording is clean with no background noise."
)


@app.cls(
    image=parler_image,
    gpu="A10G",
    volumes={"/root/models": model_volume},
    timeout=300,
    scaledown_window=120,
)
class ParlerTTS:
    @modal.enter()
    def setup(self):
        import torch
        from parler_tts import ParlerTTSForConditionalGeneration
        from transformers import AutoTokenizer
        os.environ["HF_HOME"] = "/root/models"
        print("Loading Parler TTS mini...")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = ParlerTTSForConditionalGeneration.from_pretrained(
            "parler-tts/parler-tts-mini-v1"
        ).to(self.device)
        self.tokenizer = AutoTokenizer.from_pretrained("parler-tts/parler-tts-mini-v1")
        print("Parler TTS ready")

    @modal.method()
    def generate(self, text: str, description: str = PARLER_DESCRIPTION) -> bytes:
        import torch, soundfile as sf
        input_ids = self.tokenizer(description, return_tensors="pt").input_ids.to(self.device)
        prompt_ids = self.tokenizer(text, return_tensors="pt").input_ids.to(self.device)
        with torch.no_grad():
            generation = self.model.generate(
                input_ids=input_ids,
                prompt_input_ids=prompt_ids,
            )
        audio = generation.cpu().numpy().squeeze()
        sr = self.model.config.sampling_rate
        buf = io.BytesIO()
        sf.write(buf, audio, sr, format="WAV")
        buf.seek(0)
        return buf.read()


@app.function(image=parler_image)
@modal.fastapi_endpoint(method="POST")
def parler_endpoint(item: dict):
    """Parler TTS mini. Body: {text, description}"""
    text = item.get("text", "")
    description = item.get("description", PARLER_DESCRIPTION)
    if not text:
        return {"error": "text required"}
    tts = ParlerTTS()
    audio = tts.generate.remote(text=text, description=description)
    return {"audio": base64.b64encode(audio).decode(), "format": "wav", "model": "parler_tts_mini"}


@app.local_entrypoint()
def main(text: str = "AI automation is changing how founders scale. This is a voice benchmark test."):
    print(f"Running voice benchmark with text: {text}")

    # Test Kokoro (fastest)
    tts = KokoroTTS()
    audio = tts.generate.remote(text=text, voice="am_adam")
    with open("benchmark_kokoro.wav", "wb") as f:
        f.write(audio)
    print("✓ Kokoro saved: benchmark_kokoro.wav")

    # Test Parler
    ptts = ParlerTTS()
    audio = ptts.generate.remote(text=text)
    with open("benchmark_parler.wav", "wb") as f:
        f.write(audio)
    print("✓ Parler saved: benchmark_parler.wav")
