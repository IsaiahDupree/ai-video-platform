"""
LongCat-Video-Avatar + IndexTTS-2 Modal Deployment
HeyGen-like AI2V (Audio+Image to Video) pipeline

Deploy: modal deploy scripts/modal_longcat_avatar.py
Test: modal run scripts/modal_longcat_avatar.py --text "Hello world" --image path/to/face.png
"""

import base64
import json
import os
import shutil
import subprocess
import uuid
from pathlib import Path
from typing import Optional, Literal

import modal

# Pydantic may not be installed locally, but will be in Modal container
try:
    from pydantic import BaseModel
except ImportError:
    # Fallback for local testing - simple class that mimics Pydantic
    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def model_dump(self):
            return {k: v for k, v in self.__dict__.items() if not k.startswith('_')}

APP_NAME = "ai2v-longcat-avatar"

app = modal.App(APP_NAME)

# Shared volumes for weights and outputs
MODEL_VOL = modal.Volume.from_name(f"{APP_NAME}-models", create_if_missing=True)
DATA_VOL = modal.Volume.from_name(f"{APP_NAME}-data", create_if_missing=True)

MODELS_DIR = Path("/models")
DATA_DIR = Path("/data")


LONGCAT_REPO = Path("/opt/LongCat-Video")
WEIGHTS_DIR = LONGCAT_REPO / "weights"

# Base image with all dependencies
image = (
    modal.Image.debian_slim(python_version="3.10")  # Match LongCat's recommended Python
    .apt_install(
        "ffmpeg", "git", "git-lfs", "libglib2.0-0", "libgl1",
        "libsm6", "libxext6", "libxrender1", "wget", "curl",
        "libsndfile1",  # For soundfile/librosa
    )
    .run_commands(
        "git lfs install",
        # Clone the LongCat-Video repo (contains inference scripts)
        "git clone --single-branch --branch main https://github.com/meituan-longcat/LongCat-Video /opt/LongCat-Video",
    )
    .pip_install(
        # PyTorch with CUDA 12.4
        "torch==2.6.0",
        "torchvision==0.21.0",
        "torchaudio==2.6.0",
        # LongCat dependencies
        "transformers>=4.45.0",
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
        # Additional LongCat deps
        "ninja",
        "psutil",
        "packaging",
        "av",
        "moviepy",
        "edge-tts",  # Fallback TTS
        "loguru",  # Required by LongCat
        "pyloudnorm",  # Required by LongCat
        "pydub",  # Audio processing
        "soxr",  # Audio resampling
        "ftfy",  # Text cleaning
        "regex",  # Required by ftfy
        "sentencepiece",  # Tokenization
        "onnxruntime-gpu",  # ONNX runtime for audio separator
        "audio-separator",  # Audio separation for LongCat
        "openai-whisper",  # Audio processing
        "tqdm",
        "typer",
        "click",
    )
    .run_commands(
        # Install flash-attn (required by LongCat)
        "pip install flash-attn --no-build-isolation || echo 'flash-attn install failed, will use fallback attention'",
        # Install LongCat requirements
        "cd /opt/LongCat-Video && pip install -r requirements.txt || true",
        "cd /opt/LongCat-Video && pip install -r requirements_avatar.txt || true",
    )
    .env({
        "HF_HOME": str(MODELS_DIR / "hf"),
        "TORCH_HOME": str(MODELS_DIR / "torch"),
        "PYTHONPATH": "/opt/LongCat-Video",
    })
)


def _job_dir(job_id: str) -> Path:
    return DATA_DIR / "jobs" / job_id


# ========= Model Download =========
def download_weights():
    """Download all model weights into the Volume, symlink to expected paths."""
    from huggingface_hub import snapshot_download
    
    os.makedirs(MODELS_DIR / "hf", exist_ok=True)
    os.environ["HF_HOME"] = str(MODELS_DIR / "hf")
    
    # Download LongCat-Video-Avatar weights to volume
    print("Downloading LongCat-Video-Avatar weights...")
    avatar_weights = MODELS_DIR / "LongCat-Video-Avatar"
    avatar_weights.mkdir(parents=True, exist_ok=True)
    
    snapshot_download(
        repo_id="meituan-longcat/LongCat-Video-Avatar",
        local_dir=str(avatar_weights),
        local_dir_use_symlinks=False,
    )
    print("✓ LongCat-Video-Avatar downloaded")
    
    # Create symlink in LongCat repo's expected location
    repo_weights = LONGCAT_REPO / "weights"
    repo_weights.mkdir(parents=True, exist_ok=True)
    symlink_path = repo_weights / "LongCat-Video-Avatar"
    if not symlink_path.exists():
        symlink_path.symlink_to(avatar_weights)
        print(f"✓ Symlinked weights to {symlink_path}")
    
    # Download IndexTTS-2 weights
    print("Downloading IndexTTS-2 weights...")
    indextts_dir = MODELS_DIR / "indextts" / "checkpoints"
    indextts_dir.mkdir(parents=True, exist_ok=True)
    
    snapshot_download(
        repo_id="IndexTeam/IndexTTS-2",
        local_dir=str(indextts_dir),
        local_dir_use_symlinks=False,
    )
    print("✓ IndexTTS-2 downloaded")
    
    MODEL_VOL.commit()
    return {"status": "ok"}


@app.function(
    image=image,
    volumes={MODELS_DIR: MODEL_VOL},
    timeout=3600,
)
def download_models():
    """One-time model download function."""
    return download_weights()


@app.function(
    image=image,
    gpu="A100:2",
    volumes={MODELS_DIR: MODEL_VOL},
    timeout=600,
)
def diagnose_longcat():
    """Diagnose LongCat setup issues."""
    import sys
    results = []
    
    # Check weights path
    weights_path = MODELS_DIR / "LongCat-Video-Avatar"
    results.append(f"Weights exist: {weights_path.exists()}")
    if weights_path.exists():
        files = list(weights_path.glob("**/*"))[:20]
        results.append(f"Sample files: {[str(f.relative_to(weights_path)) for f in files]}")
    
    # Check repo
    results.append(f"Repo exists: {LONGCAT_REPO.exists()}")
    if LONGCAT_REPO.exists():
        scripts = list(LONGCAT_REPO.glob("*.py"))
        results.append(f"Scripts: {[s.name for s in scripts]}")
    
    # Check flash-attn
    try:
        import flash_attn
        results.append(f"flash_attn version: {flash_attn.__version__}")
    except ImportError as e:
        results.append(f"flash_attn import error: {e}")
    
    # Try importing LongCat modules
    sys.path.insert(0, str(LONGCAT_REPO))
    try:
        from longcat_video.pipeline_longcat_video_avatar import LongCatVideoAvatarPipeline
        results.append("LongCat import: OK")
    except Exception as e:
        import traceback
        results.append(f"LongCat import error: {e}")
        results.append(f"Traceback: {traceback.format_exc()[-1500:]}")
    
    # Check CUDA
    import torch
    results.append(f"CUDA available: {torch.cuda.is_available()}")
    results.append(f"GPU count: {torch.cuda.device_count()}")
    if torch.cuda.is_available():
        results.append(f"GPU names: {[torch.cuda.get_device_name(i) for i in range(torch.cuda.device_count())]}")
    
    return "\n".join(results)


# ========= Request/Response Models =========
class AI2VRequest(BaseModel):
    job_id: Optional[str] = None
    script_text: str
    ref_image_b64: str  # Base64 PNG/JPG of the face
    voice_prompt_wav_b64: Optional[str] = None  # Optional voice clone reference
    seed: int = 42
    

class JobStatus(BaseModel):
    job_id: str
    status: Literal["queued", "running", "done", "error"]
    result_path: Optional[str] = None
    error: Optional[str] = None


def _write_status(job_id: str, status: str, extra: dict = None):
    d = _job_dir(job_id)
    d.mkdir(parents=True, exist_ok=True)
    payload = {"job_id": job_id, "status": status, **(extra or {})}
    (d / "status.json").write_text(json.dumps(payload, indent=2))
    DATA_VOL.commit()


# ========= IndexTTS-2 Synthesis =========
def run_tts(text: str, out_wav: Path, voice_ref: Optional[Path] = None):
    """
    Run IndexTTS-2 for text-to-speech.
    Falls back to a simpler TTS if IndexTTS fails to load.
    """
    try:
        # Try IndexTTS-2 first
        import sys
        sys.path.insert(0, "/opt/index-tts")
        from indextts.infer_v2 import IndexTTS2
        
        ckpt_dir = MODELS_DIR / "indextts" / "checkpoints"
        cfg_path = ckpt_dir / "config.yaml"
        
        tts = IndexTTS2(
            cfg_path=str(cfg_path),
            model_dir=str(ckpt_dir),
            use_fp16=True,
            use_cuda_kernel=False,
            use_deepspeed=False
        )
        
        kwargs = {"text": text, "output_path": str(out_wav), "verbose": True}
        if voice_ref and voice_ref.exists():
            kwargs["spk_audio_prompt"] = str(voice_ref)
        
        tts.infer(**kwargs)
        print(f"✓ TTS complete: {out_wav}")
        
    except Exception as e:
        print(f"IndexTTS-2 failed: {e}, falling back to edge-tts")
        # Fallback to edge-tts (simpler, always works)
        subprocess.run([
            "pip", "install", "edge-tts"
        ], check=True, capture_output=True)
        
        subprocess.run([
            "edge-tts",
            "--text", text,
            "--write-media", str(out_wav),
        ], check=True)
        print(f"✓ Fallback TTS complete: {out_wav}")


# ========= LongCat AI2V Generation =========
def patch_config_for_sdpa(config_path: Path):
    """Patch LongCat config to use SDPA instead of flash-attn."""
    if not config_path.exists():
        return
    
    config_text = config_path.read_text()
    
    # Replace flash_attention_2 with sdpa
    if "flash_attention_2" in config_text:
        config_text = config_text.replace('"flash_attention_2"', '"sdpa"')
        config_text = config_text.replace("'flash_attention_2'", "'sdpa'")
        config_path.write_text(config_text)
        print(f"✓ Patched {config_path} to use SDPA attention")


def setup_longcat_weights():
    """Ensure weights are symlinked to the repo's expected location and configs are patched."""
    avatar_weights = MODELS_DIR / "LongCat-Video-Avatar"
    repo_weights = LONGCAT_REPO / "weights"
    symlink_path = repo_weights / "LongCat-Video-Avatar"
    
    repo_weights.mkdir(parents=True, exist_ok=True)
    
    if avatar_weights.exists() and not symlink_path.exists():
        symlink_path.symlink_to(avatar_weights)
        print(f"✓ Symlinked weights: {symlink_path} -> {avatar_weights}")
    
    weights_path = symlink_path if symlink_path.exists() else avatar_weights
    
    # Patch all config.json files to use SDPA instead of flash_attention_2
    for config_file in weights_path.glob("**/config.json"):
        patch_config_for_sdpa(config_file)
    
    return weights_path


def run_longcat_ai2v(ref_img: Path, audio_wav: Path, out_dir: Path, seed: int = 42, prompt: str = "A person talking"):
    """
    Run LongCat-Video-Avatar AI2V pipeline.
    Audio + Image → Talking Head Video
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    
    # Ensure weights are in the right place
    weights_path = setup_longcat_weights()
    
    # Check for the inference script in the cloned repo
    run_script = LONGCAT_REPO / "run_demo_avatar_single_audio_to_video.py"
    
    if not run_script.exists():
        print(f"⚠ LongCat inference script not found at {run_script}")
        raise FileNotFoundError(f"Script not found: {run_script}")
    
    # Create input JSON matching LongCat's expected format
    # Based on assets/avatar/single_example_1.json structure
    input_data = {
        "prompt": prompt,
        "cond_image": str(ref_img),
        "cond_audio": {
            "person1": str(audio_wav)
        },
    }
    
    input_json = out_dir / "input.json"
    input_json.write_text(json.dumps(input_data, indent=2))  # Single object, not array
    
    # Set environment
    env = os.environ.copy()
    env["CUDA_VISIBLE_DEVICES"] = "0,1"
    env["PYTHONPATH"] = str(LONGCAT_REPO)
    
    # Unique master port to avoid conflicts
    import random
    master_port = 29500 + random.randint(0, 500)
    
    # Run LongCat inference with torchrun
    cmd = [
        "torchrun",
        f"--master_port={master_port}",
        "--nproc_per_node=2",
        str(run_script),
        "--context_parallel_size=2",
        f"--checkpoint_dir={weights_path}",
        "--stage_1=ai2v",
        f"--input_json={input_json}",
        f"--output_dir={out_dir}",
        "--resolution=480p",
    ]
    
    print(f"Running LongCat: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(
            cmd,
            check=True,
            env=env,
            cwd=str(LONGCAT_REPO),
            capture_output=True,
            text=True,
            timeout=600,  # 10 min timeout
        )
        print(f"LongCat stdout: {result.stdout[-2000:]}")
    except subprocess.TimeoutExpired:
        print("LongCat inference timed out")
        raise
    except subprocess.CalledProcessError as e:
        # Print full error for debugging
        print(f"LongCat STDOUT:\n{e.stdout}")
        print(f"LongCat STDERR:\n{e.stderr}")
        raise
    
    # Find the output video
    mp4s = sorted(out_dir.glob("**/*.mp4"), key=lambda p: p.stat().st_mtime, reverse=True)
    if mp4s:
        return mp4s[0]
    
    raise RuntimeError("No video output produced by LongCat")


def fallback_video(ref_img: Path, audio_wav: Path, out_dir: Path) -> Path:
    """Create a simple video from static image + audio as fallback."""
    print("Creating fallback video (static image + audio)...")
    
    # Get audio duration
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


# ========= Main GPU Job =========
@app.cls(
    image=image,
    gpu="A100:2",  # 2x A100 for LongCat's torchrun
    timeout=1800,
    volumes={MODELS_DIR: MODEL_VOL, DATA_DIR: DATA_VOL},
    scaledown_window=300,
)
class AI2VGenerator:
    @modal.enter()
    def setup(self):
        """Initialize on container start."""
        # Ensure weights are downloaded
        if not (MODELS_DIR / "LongCat-Video-Avatar").exists():
            print("Downloading weights on first run...")
            download_weights()
        
        # Setup symlinks
        setup_longcat_weights()
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
            
            # 2. Save voice reference if provided
            voice_ref = None
            if req.voice_prompt_wav_b64:
                voice_ref = jobdir / "voice_ref.wav"
                voice_ref.write_bytes(base64.b64decode(req.voice_prompt_wav_b64))
                print(f"✓ Saved voice reference: {voice_ref}")
            
            # 3. Generate speech with TTS
            gen_wav = jobdir / "speech.wav"
            run_tts(req.script_text, gen_wav, voice_ref)
            
            # 4. Generate video with LongCat AI2V (with fallback)
            video_dir = jobdir / "video_out"
            try:
                raw_mp4 = run_longcat_ai2v(ref_img, gen_wav, video_dir, req.seed)
            except Exception as longcat_err:
                print(f"LongCat failed: {longcat_err}, using fallback")
                raw_mp4 = fallback_video(ref_img, gen_wav, video_dir)
            
            # 5. Ensure audio is properly muxed
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
            
            # 6. Read video for response
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


# ========= Web Endpoints =========
@app.function(image=image, scaledown_window=60)
@modal.fastapi_endpoint(method="GET")
def health():
    return {"status": "healthy", "model": "LongCat-Video-Avatar + IndexTTS-2", "gpu": "A100:2"}


@app.function(
    image=image,
    gpu="A100:2",
    timeout=1800,
    volumes={MODELS_DIR: MODEL_VOL, DATA_DIR: DATA_VOL},
    scaledown_window=300,
)
@modal.fastapi_endpoint(method="POST")
def api_generate(request: dict):
    """
    Generate talking head video from text and image.
    
    Request:
    {
        "script_text": "Hello, this is a test.",
        "ref_image_b64": "<base64 PNG/JPG>",
        "voice_prompt_wav_b64": "<optional base64 WAV for voice cloning>"
    }
    """
    text = request.get("script_text") or request.get("text")
    image_b64 = request.get("ref_image_b64") or request.get("image")
    
    if not text:
        return {"error": "script_text is required"}
    if not image_b64:
        return {"error": "ref_image_b64 is required"}
    
    req = AI2VRequest(
        script_text=text,
        ref_image_b64=image_b64,
        voice_prompt_wav_b64=request.get("voice_prompt_wav_b64"),
        seed=request.get("seed", 42),
    )
    
    generator = AI2VGenerator()
    return generator.generate.remote(req.model_dump())


@app.function(image=image, volumes={DATA_DIR: DATA_VOL})
@modal.fastapi_endpoint(method="GET")
def status(job_id: str):
    """Check job status."""
    p = _job_dir(job_id) / "status.json"
    if not p.exists():
        return {"job_id": job_id, "status": "not_found"}
    return json.loads(p.read_text())


# ========= CLI Entrypoint =========
@app.local_entrypoint()
def main(
    text: str = None,
    image: str = None,
    voice: str = None,
    output: str = "output_avatar.mp4",
    download_only: bool = False,
):
    """
    CLI for testing the AI2V pipeline.
    
    Examples:
        modal run scripts/modal_longcat_avatar.py --download-only
        modal run scripts/modal_longcat_avatar.py --text "Hello world" --image face.png
    """
    import sys
    
    if download_only:
        print("Downloading models...")
        result = download_models.remote()
        print(f"Download complete: {result}")
        return
    
    # Add diagnose option
    if text == "diagnose":
        print("Running LongCat diagnostics...")
        result = diagnose_longcat.remote()
        print(result)
        return
    
    if not text or not image:
        print("Usage: modal run scripts/modal_longcat_avatar.py --text 'Your text' --image face.png")
        print("       modal run scripts/modal_longcat_avatar.py --download-only")
        sys.exit(1)
    
    # Read and encode image
    with open(image, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode()
    
    # Read and encode voice reference if provided
    voice_b64 = None
    if voice:
        with open(voice, "rb") as f:
            voice_b64 = base64.b64encode(f.read()).decode()
    
    print(f"\n🎭 Generating talking head video...")
    print(f"   Text: {text[:50]}...")
    print(f"   Image: {image}")
    if voice:
        print(f"   Voice ref: {voice}")
    
    req = AI2VRequest(
        script_text=text,
        ref_image_b64=image_b64,
        voice_prompt_wav_b64=voice_b64,
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
