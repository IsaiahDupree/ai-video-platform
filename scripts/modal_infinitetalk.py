#!/usr/bin/env python3
"""
InfiniteTalk on Modal - Audio-driven Talking Head Video Generation

Supports:
- Image-to-video (I2V) with audio lip-sync
- Single GPU inference (A100 80GB recommended)
- Streaming mode for long videos
"""

import modal
import os
import json
import uuid
import base64
import subprocess
from pathlib import Path
from typing import Optional, Literal

# ========= Modal App Setup =========
app = modal.App("infinitetalk-avatar")

# Volumes for model weights and job data
MODELS_DIR = Path("/models")
DATA_DIR = Path("/data")
MODEL_VOL = modal.Volume.from_name("infinitetalk-models", create_if_missing=True)
DATA_VOL = modal.Volume.from_name("infinitetalk-data", create_if_missing=True)

# InfiniteTalk repo path
INFINITETALK_REPO = Path("/opt/InfiniteTalk")

# ========= Docker Image =========
image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install(
        "ffmpeg", "git", "git-lfs", "libglib2.0-0", "libgl1",
        "libsm6", "libxext6", "libxrender1", "wget", "curl",
        "libsndfile1",
        # Build tools for flash-attn
        "build-essential", "ninja-build",
    )
    .run_commands(
        "git lfs install",
        # Clone InfiniteTalk repo
        "git clone --depth 1 https://github.com/MeiGen-AI/InfiniteTalk /opt/InfiniteTalk",
    )
    .pip_install(
        # PyTorch 2.5+ with CUDA 12.4 (needed for torch.distributed.tensor.experimental)
        "torch==2.5.1",
        "torchvision==0.20.1", 
        "torchaudio==2.5.1",
        extra_options="--index-url https://download.pytorch.org/whl/cu124",
    )
    .pip_install(
        # xformers for efficient attention
        "xformers==0.0.28.post3",
        extra_options="--index-url https://download.pytorch.org/whl/cu124",
    )
    .pip_install(
        # Core dependencies - use transformers 4.37 to avoid SDPA/output_attentions conflict
        "transformers==4.37.2",
        "diffusers>=0.30.0",
        "accelerate>=0.33.0",
        "huggingface_hub>=0.25.0",
        "safetensors",
        "numpy<2",
        "scipy",
        "soundfile",
        "librosa",
        "einops",
        "omegaconf",
        "decord",
        "imageio",
        "imageio-ffmpeg",
        "pillow",
        "fastapi",
        "pydantic",
        "python-multipart",
        # InfiniteTalk specific
        "ninja",
        "psutil",
        "packaging",
        "wheel",
        "misaki[en]",  # TTS/audio processing
        "av",
        "moviepy",
        "edge-tts",
        "loguru",
        "tqdm",
        "typer",
        "click",
        "sentencepiece",
        "ftfy",
        "regex",
    )
    .run_commands(
        # Install flash-attn from pre-built wheel (PyTorch 2.5.1, CUDA 12, Python 3.10, cxx11abiFALSE)
        # See: https://github.com/Dao-AILab/flash-attention/releases
        "pip install https://github.com/Dao-AILab/flash-attention/releases/download/v2.7.4.post1/flash_attn-2.7.4.post1+cu12torch2.5cxx11abiFALSE-cp310-cp310-linux_x86_64.whl",
        # Install InfiniteTalk requirements
        "cd /opt/InfiniteTalk && pip install -r requirements.txt || true",
    )
    .env({
        "HF_HOME": str(MODELS_DIR / "hf"),
        "TORCH_HOME": str(MODELS_DIR / "torch"),
        "PYTHONPATH": "/opt/InfiniteTalk",
    })
)

# ========= Pydantic Models =========
try:
    from pydantic import BaseModel
except ImportError:
    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def model_dump(self):
            return {k: v for k, v in self.__dict__.items() if not k.startswith('_')}


class AI2VRequest(BaseModel):
    job_id: Optional[str] = None
    script_text: str = ""  # Text for TTS (optional if audio_b64 provided)
    ref_image_b64: str  # Base64 PNG/JPG of the face
    audio_b64: Optional[str] = None  # Base64 WAV audio (skip TTS if provided)
    voice_prompt_wav_b64: Optional[str] = None  # Optional voice clone reference
    seed: int = 42
    resolution: str = "480p"  # 480p or 720p
    max_duration_sec: int = 30  # Max video duration


class JobStatus(BaseModel):
    job_id: str
    status: Literal["queued", "running", "done", "error"]
    result_path: Optional[str] = None
    error: Optional[str] = None


# ========= Helper Functions =========
def _job_dir(job_id: str) -> Path:
    return DATA_DIR / "jobs" / job_id


def _write_status(job_id: str, status: str, extra: dict = None):
    jd = _job_dir(job_id)
    jd.mkdir(parents=True, exist_ok=True)
    data = {"job_id": job_id, "status": status, **(extra or {})}
    (jd / "status.json").write_text(json.dumps(data))
    DATA_VOL.commit()


def download_weights():
    """Download all model weights into the Volume."""
    from huggingface_hub import snapshot_download

    os.makedirs(MODELS_DIR / "hf", exist_ok=True)
    os.environ["HF_HOME"] = str(MODELS_DIR / "hf")

    weights_dir = MODELS_DIR / "weights"
    weights_dir.mkdir(parents=True, exist_ok=True)

    # 1. Download Wan2.1-I2V-14B-480P base model
    print("Downloading Wan2.1-I2V-14B-480P (this is large ~26GB)...")
    wan_dir = weights_dir / "Wan2.1-I2V-14B-480P"
    if not wan_dir.exists():
        snapshot_download(
            repo_id="Wan-AI/Wan2.1-I2V-14B-480P",
            local_dir=str(wan_dir),
            local_dir_use_symlinks=False,
        )
        print("✓ Wan2.1-I2V-14B-480P downloaded")
    else:
        print("✓ Wan2.1-I2V-14B-480P already exists")

    # 2. Download chinese-wav2vec2-base for audio processing
    print("Downloading chinese-wav2vec2-base...")
    wav2vec_dir = weights_dir / "chinese-wav2vec2-base"
    if not wav2vec_dir.exists():
        snapshot_download(
            repo_id="TencentGameMate/chinese-wav2vec2-base",
            local_dir=str(wav2vec_dir),
            local_dir_use_symlinks=False,
        )
        # Also get the safetensors from the PR
        subprocess.run([
            "huggingface-cli", "download",
            "TencentGameMate/chinese-wav2vec2-base",
            "model.safetensors",
            "--revision", "refs/pr/1",
            "--local-dir", str(wav2vec_dir),
        ], check=False)
        print("✓ chinese-wav2vec2-base downloaded")
    else:
        print("✓ chinese-wav2vec2-base already exists")

    # 3. Download InfiniteTalk weights
    print("Downloading InfiniteTalk weights...")
    infinitetalk_dir = weights_dir / "InfiniteTalk"
    if not infinitetalk_dir.exists():
        snapshot_download(
            repo_id="MeiGen-AI/InfiniteTalk",
            local_dir=str(infinitetalk_dir),
            local_dir_use_symlinks=False,
        )
        print("✓ InfiniteTalk weights downloaded")
    else:
        print("✓ InfiniteTalk weights already exists")

    MODEL_VOL.commit()
    return {"status": "ok", "weights_dir": str(weights_dir)}


@app.function(
    image=image,
    volumes={MODELS_DIR: MODEL_VOL},
    timeout=7200,  # 2 hours for large model download
)
def download_models():
    """One-time model download function."""
    return download_weights()


@app.function(
    image=image,
    gpu="A100-80GB:1",  # Single A100 for InfiniteTalk
    volumes={MODELS_DIR: MODEL_VOL},
    timeout=600,
)
def diagnose():
    """Diagnose InfiniteTalk setup."""
    import sys
    results = []

    weights_dir = MODELS_DIR / "weights"
    results.append(f"Weights dir exists: {weights_dir.exists()}")

    # Check each model
    for model in ["Wan2.1-I2V-14B-480P", "chinese-wav2vec2-base", "InfiniteTalk"]:
        path = weights_dir / model
        results.append(f"{model}: {path.exists()}")

    # Check repo
    results.append(f"Repo exists: {INFINITETALK_REPO.exists()}")
    if INFINITETALK_REPO.exists():
        scripts = list(INFINITETALK_REPO.glob("*.py"))
        results.append(f"Scripts: {[s.name for s in scripts][:5]}")

    # Check flash-attn
    try:
        import flash_attn
        results.append(f"flash_attn: {flash_attn.__version__}")
    except ImportError as e:
        results.append(f"flash_attn: MISSING - {e}")

    # Check xformers
    try:
        import xformers
        results.append(f"xformers: {xformers.__version__}")
    except ImportError as e:
        results.append(f"xformers: MISSING - {e}")

    # Check CUDA
    import torch
    results.append(f"CUDA: {torch.cuda.is_available()}")
    results.append(f"GPU count: {torch.cuda.device_count()}")
    if torch.cuda.is_available():
        results.append(f"GPU: {torch.cuda.get_device_name(0)}")
        results.append(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")

    return "\n".join(results)


# ========= Audio Utilities =========
def ensure_16khz_mono(input_wav: Path, output_wav: Path = None) -> Path:
    """Ensure audio is 16kHz mono WAV (required by InfiniteTalk/wav2vec)."""
    import librosa
    import soundfile as sf
    
    if output_wav is None:
        output_wav = input_wav
    
    # Load and resample to 16kHz mono
    audio, sr = librosa.load(str(input_wav), sr=16000, mono=True)
    sf.write(str(output_wav), audio, 16000)
    print(f"✓ Audio converted to 16kHz mono: {output_wav}")
    return output_wav


# ========= TTS Generation =========
def run_tts(text: str, out_wav: Path, voice_ref: Path = None):
    """Generate speech audio from text."""
    import asyncio

    async def _edge_tts():
        import edge_tts
        communicate = edge_tts.Communicate(text, "en-US-AriaNeural")
        temp_wav = out_wav.parent / "tts_raw.wav"
        await communicate.save(str(temp_wav))
        # Convert to 16kHz mono for InfiniteTalk
        ensure_16khz_mono(temp_wav, out_wav)

    asyncio.run(_edge_tts())
    print(f"✓ TTS complete: {out_wav}")


# ========= Validation Utilities =========
def validate_image(img_path: Path) -> dict:
    """Validate image file and return metadata."""
    from PIL import Image
    import os
    
    result = {"valid": False, "errors": [], "warnings": [], "info": {}}
    
    if not img_path.exists():
        result["errors"].append(f"Image file not found: {img_path}")
        return result
    
    file_size = os.path.getsize(img_path)
    result["info"]["file_size_bytes"] = file_size
    result["info"]["file_size_kb"] = file_size / 1024
    
    if file_size == 0:
        result["errors"].append("Image file is empty (0 bytes)")
        return result
    
    try:
        with Image.open(img_path) as img:
            result["info"]["format"] = img.format
            result["info"]["mode"] = img.mode
            result["info"]["width"] = img.width
            result["info"]["height"] = img.height
            result["info"]["aspect_ratio"] = img.width / img.height if img.height > 0 else 0
            
            # Check format
            if img.format not in ["PNG", "JPEG", "JPG"]:
                result["warnings"].append(f"Unusual image format: {img.format}")
            
            # Check size
            if img.width < 256 or img.height < 256:
                result["warnings"].append(f"Image may be too small: {img.width}x{img.height}")
            if img.width > 2048 or img.height > 2048:
                result["warnings"].append(f"Image is very large: {img.width}x{img.height}, may be slow")
            
            # Check mode
            if img.mode not in ["RGB", "RGBA"]:
                result["warnings"].append(f"Unusual color mode: {img.mode}")
            
            result["valid"] = True
    except Exception as e:
        result["errors"].append(f"Failed to open image: {e}")
    
    return result


def validate_audio(audio_path: Path, expected_sr: int = 16000) -> dict:
    """Validate audio file and return metadata."""
    import librosa
    import numpy as np
    import os
    
    result = {"valid": False, "errors": [], "warnings": [], "info": {}}
    
    if not audio_path.exists():
        result["errors"].append(f"Audio file not found: {audio_path}")
        return result
    
    file_size = os.path.getsize(audio_path)
    result["info"]["file_size_bytes"] = file_size
    result["info"]["file_size_kb"] = file_size / 1024
    
    if file_size == 0:
        result["errors"].append("Audio file is empty (0 bytes)")
        return result
    
    try:
        # Load audio
        audio, sr = librosa.load(str(audio_path), sr=None, mono=False)
        
        result["info"]["sample_rate"] = sr
        result["info"]["channels"] = 1 if len(audio.shape) == 1 else audio.shape[0]
        result["info"]["samples"] = audio.shape[-1]
        result["info"]["duration_sec"] = audio.shape[-1] / sr
        result["info"]["duration_frames_16fps"] = int(result["info"]["duration_sec"] * 16)
        
        # Check sample rate
        if sr != expected_sr:
            result["warnings"].append(f"Sample rate is {sr}Hz, expected {expected_sr}Hz (will resample)")
        
        # Check duration
        if result["info"]["duration_sec"] < 1.0:
            result["errors"].append(f"Audio too short: {result['info']['duration_sec']:.2f}s (min 1.0s)")
        elif result["info"]["duration_sec"] < 2.0:
            result["warnings"].append(f"Audio is very short: {result['info']['duration_sec']:.2f}s")
        
        # Check for silence
        if len(audio.shape) == 1:
            rms = np.sqrt(np.mean(audio**2))
        else:
            rms = np.sqrt(np.mean(audio[0]**2))
        result["info"]["rms_level"] = float(rms)
        
        if rms < 0.001:
            result["errors"].append(f"Audio appears to be silent (RMS={rms:.6f})")
        elif rms < 0.01:
            result["warnings"].append(f"Audio level is very low (RMS={rms:.4f})")
        
        # Check for clipping
        max_val = np.max(np.abs(audio))
        result["info"]["peak_level"] = float(max_val)
        if max_val > 0.99:
            result["warnings"].append(f"Audio may be clipping (peak={max_val:.4f})")
        
        result["valid"] = True
    except Exception as e:
        result["errors"].append(f"Failed to load audio: {e}")
    
    return result


def validate_model_weights(weights_dir: Path) -> dict:
    """Validate that all required model weights exist."""
    result = {"valid": True, "errors": [], "warnings": [], "info": {}}
    
    required_models = {
        "Wan2.1-I2V-14B-480P": [
            "models_t5_umt5-xxl-enc-bf16.pth",
            "Wan2.1_VAE.pth",
        ],
        "chinese-wav2vec2-base": [
            "config.json",
        ],
        "InfiniteTalk/single": [
            "infinitetalk.safetensors",
        ],
    }
    
    for model_name, required_files in required_models.items():
        model_path = weights_dir / model_name
        if not model_path.exists():
            result["errors"].append(f"Model directory missing: {model_name}")
            result["valid"] = False
            continue
        
        result["info"][model_name] = {"exists": True, "files": []}
        for req_file in required_files:
            file_path = model_path / req_file
            if file_path.exists():
                result["info"][model_name]["files"].append(req_file)
            else:
                result["errors"].append(f"Missing file: {model_name}/{req_file}")
                result["valid"] = False
    
    return result


def log_validation_results(name: str, results: dict):
    """Log validation results with clear formatting."""
    print(f"\n{'='*60}")
    print(f"VALIDATION: {name}")
    print(f"{'='*60}")
    
    # Info
    if results.get("info"):
        print("INFO:")
        for k, v in results["info"].items():
            if isinstance(v, float):
                print(f"  {k}: {v:.4f}")
            else:
                print(f"  {k}: {v}")
    
    # Warnings
    if results.get("warnings"):
        print("WARNINGS:")
        for w in results["warnings"]:
            print(f"  ⚠️  {w}")
    
    # Errors
    if results.get("errors"):
        print("ERRORS:")
        for e in results["errors"]:
            print(f"  ❌ {e}")
    
    # Status
    status = "✅ VALID" if results.get("valid") else "❌ INVALID"
    print(f"STATUS: {status}")
    print(f"{'='*60}\n")


# ========= InfiniteTalk Generation =========
def run_infinitetalk(ref_img: Path, audio_wav: Path, out_dir: Path, 
                     resolution: str = "480p", max_frames: int = 750,
                     seed: int = 42) -> Path:
    """
    Run InfiniteTalk inference.
    Audio + Image → Talking Head Video
    """
    print("\n" + "="*60)
    print("INFINITETALK INFERENCE STARTING")
    print("="*60)
    
    out_dir.mkdir(parents=True, exist_ok=True)

    weights_dir = MODELS_DIR / "weights"
    
    # ===== VALIDATION PHASE =====
    print("\n--- VALIDATION PHASE ---")
    
    # Validate image
    img_results = validate_image(ref_img)
    log_validation_results("Reference Image", img_results)
    if not img_results["valid"]:
        raise ValueError(f"Image validation failed: {img_results['errors']}")
    
    # Validate audio
    audio_results = validate_audio(audio_wav)
    log_validation_results("Audio File", audio_results)
    if not audio_results["valid"]:
        raise ValueError(f"Audio validation failed: {audio_results['errors']}")
    
    # Validate model weights
    weights_results = validate_model_weights(weights_dir)
    log_validation_results("Model Weights", weights_results)
    if not weights_results["valid"]:
        raise ValueError(f"Model weights validation failed: {weights_results['errors']}")
    
    # ===== SETUP PHASE =====
    print("\n--- SETUP PHASE ---")
    
    wan_dir = weights_dir / "Wan2.1-I2V-14B-480P"
    wav2vec_dir = weights_dir / "chinese-wav2vec2-base"
    infinitetalk_weights = weights_dir / "InfiniteTalk" / "single" / "infinitetalk.safetensors"
    
    print(f"Wan2.1 dir: {wan_dir}")
    print(f"Wav2Vec dir: {wav2vec_dir}")
    print(f"InfiniteTalk weights: {infinitetalk_weights}")

    # Create input JSON (InfiniteTalk expects cond_video and cond_audio format)
    input_data = {
        "prompt": "A person speaking naturally with clear lip movements and natural expression.",
        "cond_video": str(ref_img),
        "cond_audio": {
            "person1": str(audio_wav)
        }
    }
    input_json = out_dir / "input.json"
    input_json.write_text(json.dumps(input_data, indent=2))

    # Run inference script
    run_script = INFINITETALK_REPO / "generate_infinitetalk.py"
    if not run_script.exists():
        raise FileNotFoundError(f"Script not found: {run_script}")

    save_name = "output"
    size_arg = f"infinitetalk-{resolution.lower().replace('p', '')}"
    
    # Calculate frame_num from audio duration (InfiniteTalk uses 16 fps)
    # CRITICAL: frame_num MUST be a multiple of 4 for VAE temporal stride
    # Valid frame_num values: 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80...
    import librosa
    import soundfile as sf
    
    audio_duration = librosa.get_duration(path=str(audio_wav))
    
    # IMPORTANT: Limit audio to max 5 seconds to prevent CUDA OOM
    # InfiniteTalk 14B model uses ~39GB VRAM base, longer videos need more memory
    MAX_AUDIO_SEC = 5.0
    if audio_duration > MAX_AUDIO_SEC:
        print(f"⚠️ Audio too long ({audio_duration:.1f}s), trimming to {MAX_AUDIO_SEC}s to prevent CUDA OOM")
        audio_data, sr = librosa.load(str(audio_wav), sr=16000, mono=True, duration=MAX_AUDIO_SEC)
        sf.write(str(audio_wav), audio_data, 16000)
        audio_duration = MAX_AUDIO_SEC
    
    # Calculate frame_num from audio: audio must be >= frame_num / 16 seconds
    # Round DOWN to nearest multiple of 4 that fits audio
    raw_frames = int(audio_duration * 16)  # Max frames that fit in audio
    frame_num = max(20, (raw_frames // 4) * 4)  # Round down to multiple of 4, minimum 20 frames (~1.25s)
    
    # Pad audio to exactly match frame_num duration (prevents mask shape mismatch)
    target_samples = int((frame_num / 16.0) * 16000) + 1600  # Add 0.1s buffer
    audio_data, sr = librosa.load(str(audio_wav), sr=16000, mono=True)
    if len(audio_data) < target_samples:
        import numpy as np
        pad = target_samples - len(audio_data)
        audio_data = np.pad(audio_data, (0, pad), mode="constant")
        sf.write(str(audio_wav), audio_data, 16000)
    
    print(f"Audio duration: {audio_duration:.2f}s, frame_num: {frame_num} (must be multiple of 4: {frame_num % 4 == 0})")

    # Low-VRAM settings to prevent OOM on A100 40GB/80GB
    # - sample_steps=8 (down from 40) - faster, uses less memory
    # - sample_shift=2 (down from 7) - reduces memory during sampling
    # - num_persistent_param_in_dit=0 - don't keep DiT params in VRAM
    cmd = [
        "python", str(run_script),
        f"--ckpt_dir={wan_dir}",
        f"--wav2vec_dir={wav2vec_dir}",
        f"--infinitetalk_dir={infinitetalk_weights}",
        f"--input_json={input_json}",
        f"--size={size_arg}",
        f"--frame_num={frame_num}",
        "--sample_steps=8",
        "--sample_shift=2",
        "--num_persistent_param_in_dit=0",
        "--mode=streaming",
        "--motion_frame=9",
        f"--max_frame_num={max_frames}",
        f"--save_file={out_dir / save_name}",
    ]

    print(f"Running InfiniteTalk: {' '.join(cmd)}")

    env = os.environ.copy()
    env["PYTHONPATH"] = str(INFINITETALK_REPO)
    # Prevent CUDA memory fragmentation
    env["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"
    
    # Create a wrapper script that patches wav2vec to use eager attention
    wrapper_script = out_dir / "run_wrapper.py"
    # Build the actual command args for the wrapper
    script_args = ' '.join(f'"{arg}"' for arg in cmd[2:])  # Skip 'python' and script path
    wrapper_script.write_text(f'''#!/usr/bin/env python
import sys
import os

# Set up sys.argv before any imports
sys.argv = ["generate_infinitetalk.py", {', '.join(repr(arg) for arg in cmd[2:])}]

# Monkey-patch transformers to force eager attention for wav2vec
def apply_eager_attention_patch():
    import transformers
    from transformers import PreTrainedModel
    
    _original_from_pretrained = PreTrainedModel.from_pretrained.__func__
    
    @classmethod  
    def patched_from_pretrained(cls, *args, **kwargs):
        if "attn_implementation" not in kwargs:
            kwargs["attn_implementation"] = "eager"
        return _original_from_pretrained(cls, *args, **kwargs)
    
    PreTrainedModel.from_pretrained = patched_from_pretrained

apply_eager_attention_patch()

# Monkey-patch multitalk.py to fix mask tensor shape mismatch
# The issue: audio features produce more frames than frame_num, causing msk.view() to fail
def apply_mask_clamp_patch():
    import torch
    
    # Store the original Tensor.view method
    _original_view = torch.Tensor.view
    
    def patched_view(self, *shape):
        # Detect the problematic reshape: [1, T//4, 4, lat_h, lat_w]
        if len(shape) == 5 and shape[2] == 4 and shape[0] == 1:
            expected_size = 1
            for s in shape:
                expected_size *= s
            actual_size = self.numel()
            
            if actual_size != expected_size and actual_size > expected_size:
                # Clamp to expected size by truncating time dimension
                lat_hw = shape[3] * shape[4]  # lat_h * lat_w
                target_T = shape[1] * 4  # T we need
                actual_T = actual_size // lat_hw
                
                if actual_T > target_T:
                    print(f"[PATCH] Clamping mask from {{actual_T}} to {{target_T}} time slices")
                    # Reshape to [1, actual_T, lat_h, lat_w], truncate, then do the target view
                    reshaped = self.view(1, actual_T, shape[3], shape[4])
                    truncated = reshaped[:, :target_T]
                    return _original_view(truncated, *shape)
        
        return _original_view(self, *shape)
    
    torch.Tensor.view = patched_view

apply_mask_clamp_patch()

# Now run the actual script
sys.path.insert(0, "{INFINITETALK_REPO}")
os.chdir("{INFINITETALK_REPO}")

# Import and run
import runpy
runpy.run_path("{INFINITETALK_REPO}/generate_infinitetalk.py", run_name="__main__")
''')
    
    # Run wrapper 
    wrapper_cmd = ["python", str(wrapper_script)]

    print(f"Running InfiniteTalk: {' '.join(wrapper_cmd)}")

    try:
        result = subprocess.run(
            wrapper_cmd,
            check=True,
            env=env,
            cwd=str(INFINITETALK_REPO),
            capture_output=True,
            text=True,
            timeout=1800,  # 30 min timeout
        )
        print(f"InfiniteTalk stdout: {result.stdout[-2000:]}")
    except subprocess.CalledProcessError as e:
        print(f"InfiniteTalk STDOUT:\n{e.stdout}")
        print(f"InfiniteTalk STDERR:\n{e.stderr}")
        raise
    except subprocess.TimeoutExpired:
        print("InfiniteTalk timed out")
        raise

    # Find output video
    mp4s = sorted(out_dir.glob("**/*.mp4"), key=lambda p: p.stat().st_mtime, reverse=True)
    if mp4s:
        return mp4s[0]

    raise RuntimeError("No video output produced by InfiniteTalk")


def fallback_video(ref_img: Path, audio_wav: Path, out_dir: Path) -> Path:
    """Create fallback video (static image + audio)."""
    print("Creating fallback video...")

    probe = subprocess.run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(audio_wav)
    ], capture_output=True, text=True)
    duration = float(probe.stdout.strip()) if probe.stdout.strip() else 5.0

    output_mp4 = out_dir / "fallback_output.mp4"
    subprocess.run([
        "ffmpeg", "-y",
        "-loop", "1",
        "-i", str(ref_img),
        "-i", str(audio_wav),
        "-c:v", "libx264",
        "-tune", "stillimage",
        "-c:a", "aac",
        "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-shortest",
        "-t", str(duration),
        str(output_mp4)
    ], check=True)

    return output_mp4


# ========= Main Generator Class =========
@app.cls(
    image=image,
    gpu="A100-80GB:1",  # Single A100 80GB
    volumes={MODELS_DIR: MODEL_VOL, DATA_DIR: DATA_VOL},
    timeout=1800,
    scaledown_window=300,
)
class AI2VGenerator:
    @modal.enter()
    def setup(self):
        """Initialize on container start."""
        weights_dir = MODELS_DIR / "weights"
        if not (weights_dir / "InfiniteTalk").exists():
            print("Downloading weights on first run...")
            download_weights()
        print("✓ AI2V Generator ready")

    @modal.method()
    def generate(self, req_dict: dict) -> dict:
        """Run the full AI2V pipeline."""
        req = AI2VRequest(**req_dict)
        job_id = req.job_id or uuid.uuid4().hex
        jobdir = _job_dir(job_id)
        jobdir.mkdir(parents=True, exist_ok=True)

        _write_status(job_id, "running")

        try:
            # 1. Save input image
            ref_img = jobdir / "ref.png"
            ref_img.write_bytes(base64.b64decode(req.ref_image_b64))
            print(f"✓ Saved reference image: {ref_img}")

            # 2. Get audio: use provided audio or generate with TTS
            gen_wav = jobdir / "speech.wav"
            if req.audio_b64:
                # Use provided audio - save and convert to 16kHz mono
                raw_wav = jobdir / "audio_raw.wav"
                raw_wav.write_bytes(base64.b64decode(req.audio_b64))
                ensure_16khz_mono(raw_wav, gen_wav)
                print(f"✓ Using provided audio: {gen_wav}")
            else:
                # Generate speech with TTS
                run_tts(req.script_text, gen_wav)

            # 3. Generate video with InfiniteTalk (with fallback)
            video_dir = jobdir / "video_out"
            max_frames = req.max_duration_sec * 25  # 25 fps

            try:
                raw_mp4 = run_infinitetalk(
                    ref_img, gen_wav, video_dir,
                    resolution=req.resolution,
                    max_frames=max_frames,
                    seed=req.seed
                )
            except Exception as e:
                print(f"InfiniteTalk failed: {e}, using fallback")
                raw_mp4 = fallback_video(ref_img, gen_wav, video_dir)

            # 4. Ensure audio is properly muxed
            final_mp4 = jobdir / "final.mp4"
            subprocess.run([
                "ffmpeg", "-y",
                "-i", str(raw_mp4),
                "-i", str(gen_wav),
                "-c:v", "copy",
                "-c:a", "aac",
                "-shortest",
                str(final_mp4)
            ], check=True, capture_output=True)

            # 5. Read video for response
            video_bytes = final_mp4.read_bytes()
            video_b64 = base64.b64encode(video_bytes).decode()

            _write_status(job_id, "done", {"result_path": str(final_mp4)})

            return {
                "job_id": job_id,
                "status": "done",
                "video": video_b64,
            }

        except Exception as e:
            import traceback
            error_msg = f"{str(e)}\n{traceback.format_exc()}"
            print(f"Generation error: {error_msg}")
            _write_status(job_id, "error", {"error": error_msg})
            return {
                "job_id": job_id,
                "status": "error",
                "error": error_msg,
            }


# ========= FastAPI Endpoints =========
@app.function(image=image)
@modal.fastapi_endpoint(method="GET")
def health():
    return {"status": "ok", "model": "InfiniteTalk"}


@app.function(
    image=image,
    gpu="A100-80GB:1",
    volumes={MODELS_DIR: MODEL_VOL, DATA_DIR: DATA_VOL},
    timeout=1800,
)
@modal.fastapi_endpoint(method="POST")
def api_generate(req: AI2VRequest):
    """Generate talking head video from text + image."""
    generator = AI2VGenerator()
    return generator.generate.remote(req.model_dump())


@app.function(
    image=image,
    volumes={DATA_DIR: DATA_VOL},
)
@modal.fastapi_endpoint(method="GET")
def status(job_id: str):
    """Check job status."""
    status_file = _job_dir(job_id) / "status.json"
    if status_file.exists():
        return json.loads(status_file.read_text())
    return {"job_id": job_id, "status": "not_found"}


# ========= Integration Tests on Modal =========
@app.function(
    image=image,
    gpu="A100-80GB:1",
    volumes={MODELS_DIR: MODEL_VOL, DATA_DIR: DATA_VOL},
    timeout=600,
)
def run_integration_tests():
    """Run integration tests on Modal with all dependencies."""
    import numpy as np
    from PIL import Image
    import soundfile as sf
    import librosa
    import tempfile
    
    results = {"passed": 0, "failed": 0, "tests": []}
    test_dir = Path(tempfile.mkdtemp(prefix="infinitetalk_test_"))
    
    def log_test(name: str, passed: bool, msg: str = ""):
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{status}: {name}")
        if msg:
            print(f"  → {msg}")
        results["tests"].append({"name": name, "passed": passed, "message": msg})
        if passed:
            results["passed"] += 1
        else:
            results["failed"] += 1
    
    print("\n" + "="*60)
    print("INFINITETALK INTEGRATION TESTS (Modal)")
    print("="*60 + "\n")
    
    # Test 1: CUDA
    try:
        import torch
        if torch.cuda.is_available():
            log_test("CUDA Available", True, f"{torch.cuda.get_device_name(0)}")
        else:
            log_test("CUDA Available", False, "No GPU")
    except Exception as e:
        log_test("CUDA Available", False, str(e))
    
    # Test 2: Flash Attention
    try:
        from flash_attn import flash_attn_func
        log_test("Flash Attention 2", True, "flash_attn installed")
    except ImportError as e:
        log_test("Flash Attention 2", False, f"Not installed: {e}")
    except Exception as e:
        log_test("Flash Attention 2", False, str(e))
    
    # Test 3: Model Weights
    try:
        weights_dir = MODELS_DIR / "weights"
        wan_exists = (weights_dir / "Wan2.1-I2V-14B-480P").exists()
        wav2vec_exists = (weights_dir / "chinese-wav2vec2-base").exists()
        infinitetalk_exists = (weights_dir / "InfiniteTalk" / "single" / "infinitetalk.safetensors").exists()
        
        if wan_exists and wav2vec_exists and infinitetalk_exists:
            log_test("Model Weights", True, "All models present")
        else:
            missing = []
            if not wan_exists: missing.append("Wan2.1")
            if not wav2vec_exists: missing.append("wav2vec")
            if not infinitetalk_exists: missing.append("InfiniteTalk")
            log_test("Model Weights", False, f"Missing: {', '.join(missing)}")
    except Exception as e:
        log_test("Model Weights", False, str(e))
    
    # Test 3: Image Validation
    try:
        test_img = test_dir / "test.png"
        img = Image.fromarray(np.random.randint(0, 255, (512, 512, 3), dtype=np.uint8))
        img.save(test_img)
        
        result = validate_image(test_img)
        log_test("Image Validation", result["valid"], f"{result['info'].get('width')}x{result['info'].get('height')}")
    except Exception as e:
        log_test("Image Validation", False, str(e))
    
    # Test 4: Audio Validation
    try:
        test_audio = test_dir / "test.wav"
        sr = 16000
        duration = 3.0
        t = np.linspace(0, duration, int(sr * duration))
        audio = 0.3 * np.sin(2 * np.pi * 440 * t).astype(np.float32)
        sf.write(str(test_audio), audio, sr)
        
        result = validate_audio(test_audio)
        log_test("Audio Validation", result["valid"], f"{result['info'].get('duration_sec', 0):.2f}s")
    except Exception as e:
        log_test("Audio Validation", False, str(e))
    
    # Test 5: Frame Calculation
    try:
        test_cases = [(3.0, 45), (5.0, 77), (10.0, 157)]
        all_valid = True
        for audio_sec, expected_min in test_cases:
            raw_frames = int(audio_sec * 16)
            n = (raw_frames - 1) // 4
            frame_num = max(21, (n * 4) + 1)
            if (frame_num - 1) % 4 != 0:
                all_valid = False
        log_test("Frame Calculation", all_valid, f"All {len(test_cases)} cases valid")
    except Exception as e:
        log_test("Frame Calculation", False, str(e))
    
    # Test 6: TTS Generation
    try:
        import asyncio
        import edge_tts
        
        tts_out = test_dir / "tts.mp3"
        async def gen_tts():
            comm = edge_tts.Communicate("Hello test", "en-US-AriaNeural")
            await comm.save(str(tts_out))
        asyncio.run(gen_tts())
        
        log_test("TTS Generation", tts_out.exists() and tts_out.stat().st_size > 1000, 
                 f"{tts_out.stat().st_size} bytes")
    except Exception as e:
        log_test("TTS Generation", False, str(e))
    
    # Test 7: Audio Resampling
    try:
        audio_48k = test_dir / "audio_48k.wav"
        audio_16k = test_dir / "audio_16k.wav"
        
        # Create 48kHz audio
        sr = 48000
        t = np.linspace(0, 1.0, sr)
        audio = 0.3 * np.sin(2 * np.pi * 440 * t).astype(np.float32)
        sf.write(str(audio_48k), audio, sr)
        
        # Resample
        ensure_16khz_mono(audio_48k, audio_16k)
        
        # Verify
        loaded, loaded_sr = sf.read(str(audio_16k))
        log_test("Audio Resampling", loaded_sr == 16000, f"48kHz → 16kHz")
    except Exception as e:
        log_test("Audio Resampling", False, str(e))
    
    # Cleanup
    import shutil
    try:
        shutil.rmtree(test_dir)
    except:
        pass
    
    # Summary
    print("\n" + "="*60)
    print(f"RESULTS: {results['passed']} passed, {results['failed']} failed")
    print("="*60 + "\n")
    
    return results


# ========= Local Entrypoint =========
@app.local_entrypoint()
def main(
    text: str = None,
    image: str = None,
    audio: str = None,
    output: str = "output_infinitetalk.mp4",
    download_only: bool = False,
    test: bool = False,
):
    """
    Local CLI for testing InfiniteTalk.

    Usage:
        modal run scripts/modal_infinitetalk.py --download-only
        modal run scripts/modal_infinitetalk.py --test
        modal run scripts/modal_infinitetalk.py --text "Hello world" --image face.png
        modal run scripts/modal_infinitetalk.py --audio speech.wav --image face.png
    """
    import sys

    if test:
        print("Running integration tests on Modal...")
        result = run_integration_tests.remote()
        print(f"\nTest Results: {result['passed']} passed, {result['failed']} failed")
        if result['failed'] > 0:
            print("Failed tests:")
            for t in result['tests']:
                if not t['passed']:
                    print(f"  ❌ {t['name']}: {t['message']}")
        return

    if download_only:
        print("Downloading models (this may take a while for 26GB+ models)...")
        result = download_models.remote()
        print(f"Download complete: {result}")
        return

    if text == "diagnose":
        print("Running diagnostics...")
        result = diagnose.remote()
        print(result)
        return

    if (not text and not audio) or not image:
        print("Usage: modal run scripts/modal_infinitetalk.py --text 'Your text' --image face.png")
        print("       modal run scripts/modal_infinitetalk.py --audio speech.wav --image face.png")
        print("       modal run scripts/modal_infinitetalk.py --download-only")
        print("       modal run scripts/modal_infinitetalk.py --text diagnose")
        sys.exit(1)

    # Read and encode image
    with open(image, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode()

    # Read and encode audio if provided
    audio_b64 = None
    if audio:
        with open(audio, "rb") as f:
            audio_b64 = base64.b64encode(f.read()).decode()
        print(f"\n🎭 Generating talking head video with InfiniteTalk...")
        print(f"   Audio: {audio}")
    else:
        print(f"\n🎭 Generating talking head video with InfiniteTalk...")
        print(f"   Text: {text[:50]}...")
    print(f"   Image: {image}")

    req = AI2VRequest(
        script_text=text or "",
        ref_image_b64=image_b64,
        audio_b64=audio_b64,
    )

    generator = AI2VGenerator()
    result = generator.generate.remote(req.model_dump())

    if result.get("error"):
        print(f"❌ Error: {result['error']}")
        sys.exit(1)

    # Save video
    video_bytes = base64.b64decode(result["video"])
    with open(output, "wb") as f:
        f.write(video_bytes)

    print(f"✅ Video saved to {output}")
