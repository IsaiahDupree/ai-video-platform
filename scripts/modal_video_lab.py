#!/usr/bin/env python3
"""
Unified Video Lab - Modal deployment for multiple AI video generation models.

Supports:
- InfiniteTalk: Audio-driven talking head (image/video + audio → video)
- LongCat-Video-Avatar: Audio-driven character animation (image + audio → video)

Usage:
    # Download all weights (run once)
    modal run scripts/modal_video_lab.py::download_weights

    # Deploy the API
    modal deploy scripts/modal_video_lab.py

    # Test InfiniteTalk locally
    modal run scripts/modal_video_lab.py --model infinitetalk --image test.png --audio test.wav

    # Test LongCat Avatar locally
    modal run scripts/modal_video_lab.py --model longcat --image test.png --audio test.wav
"""

import os
import json
import base64
import tempfile
import shutil
import glob
import subprocess
import uuid
import time
from pathlib import Path
from typing import Optional, Literal, Dict, Any, List

import modal

# =============================================================================
# App Configuration
# =============================================================================

APP_NAME = "video-lab"
VOLUME_WEIGHTS = "video-lab-weights"
VOLUME_DATA = "video-lab-data"

app = modal.App(APP_NAME)

# Persistent volumes
weights_vol = modal.Volume.from_name(VOLUME_WEIGHTS, create_if_missing=True)
data_vol = modal.Volume.from_name(VOLUME_DATA, create_if_missing=True)

# HuggingFace secret (optional but recommended)
try:
    HF_SECRET = modal.Secret.from_name("huggingface")
except:
    HF_SECRET = None

# =============================================================================
# Shared Utilities
# =============================================================================

def b64_to_file(b64_str: str, out_path: str) -> str:
    """Decode base64 string to file."""
    data = base64.b64decode(b64_str)
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "wb") as f:
        f.write(data)
    return out_path


def file_to_b64(path: str) -> str:
    """Encode file to base64 string."""
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def newest_mp4(search_dir: str) -> str:
    """Find the most recently modified mp4 in a directory tree."""
    candidates = glob.glob(os.path.join(search_dir, "**", "*.mp4"), recursive=True)
    if not candidates:
        raise FileNotFoundError(f"No mp4 found under {search_dir}")
    candidates.sort(key=lambda p: os.path.getmtime(p), reverse=True)
    return candidates[0]


def safe_run(cmd: List[str], cwd: Optional[str] = None, env: Optional[Dict[str, str]] = None, timeout: int = 3600) -> str:
    """Run command with error handling and output capture."""
    print(f"Running: {' '.join(cmd)}")
    merged_env = {**os.environ, **(env or {})}
    p = subprocess.run(
        cmd,
        cwd=cwd,
        env=merged_env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        timeout=timeout,
    )
    if p.returncode != 0:
        raise RuntimeError(f"Command failed ({p.returncode}): {' '.join(cmd)}\n\n{p.stdout}")
    return p.stdout


# =============================================================================
# Docker Images
# =============================================================================

BASE_APT = ["git", "ffmpeg", "libgl1", "libglib2.0-0", "build-essential", "curl", "libsndfile1"]

# Prebuilt flash-attn wheels from Dao-AILab (no source compilation needed)
# Both images use PyTorch 2.6 + CUDA 12.4 for xfuser compatibility
FLASH_ATTN_WHL = (
    "https://github.com/Dao-AILab/flash-attention/releases/download/v2.7.4.post1/"
    "flash_attn-2.7.4.post1+cu12torch2.6cxx11abiFALSE-cp310-cp310-linux_x86_64.whl"
)

# Build validation command - checks critical dependencies at build time
VALIDATE_CMD = (
    "python -c \""
    "import sys; "
    "import torch; "
    "print('PyTorch:', torch.__version__); "
    "print('CUDA:', torch.version.cuda); "
    "from torch.distributed.tensor.experimental._attention import _templated_ring_attention; "
    "print('torch.distributed.tensor.experimental OK'); "
    "import xformers; "
    "print('xformers:', xformers.__version__); "
    "print('VALIDATION PASSED')\""
)

# InfiniteTalk: CUDA 12.4 + PyTorch 2.6 + flash-attn
# NOTE: xfuser requires torch.distributed.tensor.experimental (PyTorch 2.6+)
# BUILD_VERSION: 2 (increment to force rebuild)
image_infinitetalk = (
    modal.Image.from_registry("nvidia/cuda:12.4.1-cudnn-devel-ubuntu22.04", add_python="3.10")
    .apt_install(*BASE_APT)
    .run_commands("pip install --upgrade pip setuptools wheel")
    # PyTorch 2.6 (required for xfuser's torch.distributed.tensor.experimental)
    .run_commands(
        "pip install torch==2.6.0+cu124 torchvision==0.21.0+cu124 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cu124"
    )
    # xformers must be installed with --no-deps to prevent PyTorch upgrade
    .run_commands("pip install xformers==0.0.29.post3 --no-deps")
    # Flash-attn dependencies + prebuilt wheel (no source build)
    .run_commands(
        "pip install --no-cache-dir ninja psutil packaging && "
        f"pip install --no-cache-dir --no-deps '{FLASH_ATTN_WHL}'"
    )
    # Clone InfiniteTalk repo
    .run_commands("cd /opt && git clone --depth=1 https://github.com/MeiGen-AI/InfiniteTalk.git")
    # Patch wav2vec2 to force eager attention before setting output_attentions (SDPA doesn't support it)
    .run_commands(
        r"sed -i 's/self\.config\.output_attentions = True/self.config._attn_implementation = \"eager\"; self.config.output_attentions = True/g' "
        "/opt/InfiniteTalk/src/audio_analysis/wav2vec2.py"
    )
    # Install requirements (filter out packages we already pinned to prevent version conflicts)
    .run_commands(
        "grep -v -E '^(flash[-_]attn|torch|torchvision|torchaudio|xformers)' /opt/InfiniteTalk/requirements.txt > /tmp/req.txt && "
        "pip install -r /tmp/req.txt"
    )
    .pip_install("librosa", "soundfile", "edge-tts", "misaki[en]")
    # HuggingFace tools
    .pip_install("huggingface_hub[cli]", "hf-transfer")
    # Validate environment at build time
    .run_commands(VALIDATE_CMD)
    .env({
        "HF_HUB_ENABLE_HF_TRANSFER": "1",
        "PYTHONPATH": "/opt/InfiniteTalk",
        # Force eager attention to avoid SDPA/output_attentions incompatibility with wav2vec2
        "TRANSFORMERS_ATTENTION_IMPLEMENTATION": "eager",
    })
)

# LongCat-Video-Avatar: CUDA 12.4 + PyTorch 2.6.0 + flash-attn
image_longcat = (
    modal.Image.from_registry("nvidia/cuda:12.4.1-cudnn-devel-ubuntu22.04", add_python="3.10")
    .apt_install(*BASE_APT)
    .run_commands("pip install --upgrade pip setuptools wheel")
    # PyTorch stack per LongCat README
    .run_commands(
        "pip install torch==2.6.0+cu124 torchvision==0.21.0+cu124 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cu124"
    )
    # Flash-attn dependencies + prebuilt wheel (no source build)
    .run_commands(
        "pip install --no-cache-dir ninja psutil packaging && "
        f"pip install --no-cache-dir --no-deps '{FLASH_ATTN_WHL}'"
    )
    # Clone LongCat repo
    .run_commands("cd /opt && git clone --depth=1 https://github.com/meituan-longcat/LongCat-Video.git")
    # Install requirements (filter out flash-attn since we already installed prebuilt)
    .run_commands(
        "grep -v -E '^flash[-_]attn' /opt/LongCat-Video/requirements.txt > /tmp/req.txt && "
        "pip install -r /tmp/req.txt"
    )
    .run_commands(
        "grep -v -E '^(flash[-_]attn|libsndfile|tritonserverclient)' /opt/LongCat-Video/requirements_avatar.txt > /tmp/req_avatar.txt && "
        "pip install -r /tmp/req_avatar.txt"
    )
    .pip_install("librosa", "soundfile", "edge-tts")
    # HuggingFace tools
    .pip_install("huggingface_hub[cli]", "hf-transfer")
    .env({
        "HF_HUB_ENABLE_HF_TRANSFER": "1",
        "PYTHONPATH": "/opt/LongCat-Video",
    })
)

# Lightweight image for weight downloads
image_downloader = (
    modal.Image.debian_slim(python_version="3.10")
    .pip_install("huggingface_hub[cli]", "hf-transfer")
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1"})
)

# =============================================================================
# Weight Downloader
# =============================================================================

@app.function(
    image=image_downloader,
    secrets=[HF_SECRET] if HF_SECRET else [],
    volumes={"/weights": weights_vol},
    timeout=60 * 60 * 2,  # 2 hours for large downloads
)
def download_weights(
    infinitetalk: bool = True,
    longcat: bool = True,
) -> str:
    """
    Download model weights to persistent volume.
    
    Args:
        infinitetalk: Download InfiniteTalk + Wan2.1 + wav2vec weights
        longcat: Download LongCat-Video-Avatar weights
    """
    from huggingface_hub import snapshot_download, hf_hub_download
    
    os.makedirs("/weights", exist_ok=True)
    
    if infinitetalk:
        print("=" * 60)
        print("Downloading InfiniteTalk weights...")
        print("=" * 60)
        
        # Wan2.1 base model (~26GB)
        wan_dir = "/weights/Wan2.1-I2V-14B-480P"
        if not os.path.exists(os.path.join(wan_dir, "model_index.json")):
            print("Downloading Wan2.1-I2V-14B-480P...")
            snapshot_download(
                "Wan-AI/Wan2.1-I2V-14B-480P",
                local_dir=wan_dir,
                local_dir_use_symlinks=False,
            )
        else:
            print("Wan2.1 already downloaded")
        
        # Chinese wav2vec2 audio encoder
        wav2vec_dir = "/weights/chinese-wav2vec2-base"
        if not os.path.exists(os.path.join(wav2vec_dir, "config.json")):
            print("Downloading chinese-wav2vec2-base...")
            snapshot_download(
                "TencentGameMate/chinese-wav2vec2-base",
                local_dir=wav2vec_dir,
                local_dir_use_symlinks=False,
            )
            # Also get the safetensors from PR
            hf_hub_download(
                "TencentGameMate/chinese-wav2vec2-base",
                filename="model.safetensors",
                local_dir=wav2vec_dir,
                revision="refs/pr/1",
            )
        else:
            print("wav2vec2 already downloaded")
        
        # InfiniteTalk weights
        inf_dir = "/weights/InfiniteTalk"
        if not os.path.exists(os.path.join(inf_dir, "single", "infinitetalk.safetensors")):
            print("Downloading InfiniteTalk weights...")
            snapshot_download(
                "MeiGen-AI/InfiniteTalk",
                local_dir=inf_dir,
                local_dir_use_symlinks=False,
            )
        else:
            print("InfiniteTalk already downloaded")
    
    if longcat:
        print("=" * 60)
        print("Downloading LongCat-Video-Avatar weights...")
        print("=" * 60)
        
        # LongCat-Video-Avatar (~26GB)
        lc_avatar_dir = "/weights/LongCat-Video-Avatar"
        if not os.path.exists(os.path.join(lc_avatar_dir, "dit")):
            print("Downloading LongCat-Video-Avatar...")
            snapshot_download(
                "meituan-longcat/LongCat-Video-Avatar",
                local_dir=lc_avatar_dir,
                local_dir_use_symlinks=False,
            )
        else:
            print("LongCat-Video-Avatar already downloaded")
    
    weights_vol.commit()
    
    print("=" * 60)
    print("Weight download complete!")
    print("=" * 60)
    
    # List what we have
    for root, dirs, files in os.walk("/weights"):
        level = root.replace("/weights", "").count(os.sep)
        if level < 2:
            indent = " " * 2 * level
            print(f"{indent}{os.path.basename(root)}/")
    
    return "ok"


# =============================================================================
# InfiniteTalk Service
# =============================================================================

INFINITETALK_PROFILES = {
    "fast": {
        "size": "infinitetalk-480",
        "sample_steps": 8,
        "sample_shift": 2,
        "num_persistent_param_in_dit": 0,
        "use_teacache": True,
        "mode": "clip",  # Single chunk, faster than streaming
    },
    "low_vram": {
        "size": "infinitetalk-480",
        "sample_steps": 8,
        "sample_shift": 2,
        "num_persistent_param_in_dit": 0,
        "use_teacache": True,
        "mode": "clip",
    },
    "balanced": {
        "size": "infinitetalk-480",
        "sample_steps": 20,
        "sample_shift": 5,
        "num_persistent_param_in_dit": 0,
        "use_teacache": True,
        "mode": "streaming",
    },
    "quality": {
        "size": "infinitetalk-720",
        "sample_steps": 40,
        "sample_shift": 7,
        "num_persistent_param_in_dit": 0,
        "use_teacache": False,
        "mode": "streaming",
    },
}


@app.cls(
    image=image_infinitetalk,
    gpu="A100-80GB:1",
    secrets=[HF_SECRET] if HF_SECRET else [],
    volumes={"/weights": weights_vol, "/data": data_vol},
    timeout=60 * 45,  # 45 min per generation (14B model is slow)
    scaledown_window=300,
)
class InfiniteTalkService:
    """InfiniteTalk: Audio-driven talking head generation."""
    
    @modal.enter()
    def setup(self):
        """Validate weights on container start."""
        self.wan_dir = "/weights/Wan2.1-I2V-14B-480P"
        self.wav2vec_dir = "/weights/chinese-wav2vec2-base"
        self.infinitetalk_dir = "/weights/InfiniteTalk/single/infinitetalk.safetensors"
        self.repo_dir = "/opt/InfiniteTalk"
        
        # Validate weights exist
        assert os.path.exists(self.wan_dir), f"Missing: {self.wan_dir}"
        assert os.path.exists(self.wav2vec_dir), f"Missing: {self.wav2vec_dir}"
        assert os.path.exists(self.infinitetalk_dir), f"Missing: {self.infinitetalk_dir}"
        
        print("✅ InfiniteTalk weights validated")
    
    @modal.method()
    def generate(
        self,
        image_b64: str,
        audio_b64: str,
        prompt: str = "a person talking, natural head movement",
        profile: str = "low_vram",
        max_duration_sec: float = 5.0,  # Clip mode needs ~5s minimum for 81 frames
    ) -> Dict[str, Any]:
        """
        Generate talking head video from image + audio.
        
        Args:
            image_b64: Base64-encoded face image (PNG/JPG)
            audio_b64: Base64-encoded audio (WAV/MP3)
            prompt: Text prompt for generation
            profile: Quality profile (low_vram, balanced, quality)
            max_duration_sec: Maximum audio duration (longer = more VRAM)
        
        Returns:
            Dict with output_mp4_b64 and metadata
        """
        import librosa
        import soundfile as sf
        
        job_id = str(uuid.uuid4())[:8]
        work_dir = Path(f"/data/jobs/{job_id}")
        work_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            # Save inputs
            img_path = work_dir / "input.png"
            audio_path = work_dir / "input.wav"
            b64_to_file(image_b64, str(work_dir / "input_raw.png"))
            b64_to_file(audio_b64, str(work_dir / "input_raw.wav"))
            
            # Resize image to 832x480 (InfiniteTalk 480p mode, divisible by 8 for VAE)
            from PIL import Image
            img = Image.open(str(work_dir / "input_raw.png"))
            img = img.convert("RGB")
            # Use 832x480 for 480p (close to 16:9, divisible by 8)
            img = img.resize((832, 480), Image.Resampling.LANCZOS)
            img.save(str(img_path))
            print(f"Resized image to 832x480")
            
            # Preprocess audio: resample to 16kHz mono
            audio_data, sr = librosa.load(str(work_dir / "input_raw.wav"), sr=16000, mono=True)
            audio_duration = len(audio_data) / 16000
            
            # Trim if too long
            if audio_duration > max_duration_sec:
                print(f"⚠️ Trimming audio from {audio_duration:.1f}s to {max_duration_sec}s")
                audio_data = audio_data[:int(max_duration_sec * 16000)]
                audio_duration = max_duration_sec
            
            sf.write(str(audio_path), audio_data, 16000)
            
            # Calculate frame_num (must be multiple of 4 for VAE)
            raw_frames = int(audio_duration * 16)
            frame_num = max(20, (raw_frames // 4) * 4)
            
            # Pad audio to match frame_num duration
            target_samples = int((frame_num / 16.0) * 16000) + 1600
            if len(audio_data) < target_samples:
                import numpy as np
                audio_data = np.pad(audio_data, (0, target_samples - len(audio_data)), mode="constant")
                sf.write(str(audio_path), audio_data, 16000)
            
            print(f"Audio: {audio_duration:.2f}s, frame_num: {frame_num}")
            
            # Build input JSON - InfiniteTalk expects:
            # - cond_video: path to image/video
            # - cond_audio: dict with "person1" key pointing to audio file
            # - prompt: text prompt
            input_json = {
                "cond_video": str(img_path),
                "cond_audio": {"person1": str(audio_path)},
                "prompt": prompt,
            }
            input_json_path = work_dir / "input.json"
            with open(input_json_path, "w") as f:
                json.dump(input_json, f, indent=2)
            
            print(f"Input JSON: {json.dumps(input_json, indent=2)}")
            
            # Get profile settings
            settings = INFINITETALK_PROFILES.get(profile, INFINITETALK_PROFILES["low_vram"])
            
            # Build command - let InfiniteTalk auto-calculate frame_num from audio duration
            out_path = work_dir / "output"
            mode = settings.get("mode", "clip")
            cmd = [
                "python", f"{self.repo_dir}/generate_infinitetalk.py",
                f"--ckpt_dir={self.wan_dir}",
                f"--wav2vec_dir={self.wav2vec_dir}",
                f"--infinitetalk_dir={self.infinitetalk_dir}",
                f"--input_json={input_json_path}",
                f"--size={settings['size']}",
                f"--sample_steps={settings['sample_steps']}",
                f"--sample_shift={settings['sample_shift']}",
                f"--num_persistent_param_in_dit={settings['num_persistent_param_in_dit']}",
                f"--mode={mode}",
                "--motion_frame=9",
                f"--save_file={out_path}",
            ]
            # Add TeaCache if enabled (significant speedup)
            if settings.get("use_teacache", False):
                cmd.append("--use_teacache")
            
            # Run with CUDA memory optimization and force eager attention for wav2vec2
            env = {
                "PYTORCH_CUDA_ALLOC_CONF": "expandable_segments:True",
                "PYTHONPATH": self.repo_dir,
                "ATTN_IMPLEMENTATION": "eager",  # Force eager attention for wav2vec2 compatibility
            }
            
            output = safe_run(cmd, cwd=self.repo_dir, env=env)
            print(output)
            
            # Find output video
            out_mp4 = newest_mp4(str(work_dir))
            
            data_vol.commit()
            
            return {
                "job_id": job_id,
                "output_mp4_b64": file_to_b64(out_mp4),
                "frame_num": frame_num,
                "audio_duration": audio_duration,
                "profile": profile,
            }
            
        except Exception as e:
            print(f"❌ InfiniteTalk failed: {e}")
            data_vol.commit()
            raise


# =============================================================================
# LongCat-Video-Avatar Service
# =============================================================================

LONGCAT_PROFILES = {
    "low_vram": {
        "resolution": "480p",
        "num_segments": 1,
    },
    "balanced": {
        "resolution": "480p",
        "num_segments": 3,
    },
    "quality": {
        "resolution": "720p",
        "num_segments": 5,
    },
}


@app.cls(
    image=image_longcat,
    gpu="A100-80GB:1",
    secrets=[HF_SECRET] if HF_SECRET else [],
    volumes={"/weights": weights_vol, "/data": data_vol},
    timeout=60 * 30,
    scaledown_window=300,
)
class LongCatAvatarService:
    """LongCat-Video-Avatar: Audio-driven character animation."""
    
    @modal.enter()
    def setup(self):
        """Validate weights on container start."""
        self.checkpoint_dir = "/weights/LongCat-Video-Avatar"
        self.repo_dir = "/opt/LongCat-Video"
        
        assert os.path.exists(self.checkpoint_dir), f"Missing: {self.checkpoint_dir}"
        print("✅ LongCat-Video-Avatar weights validated")
    
    @modal.method()
    def generate(
        self,
        image_b64: str,
        audio_b64: str,
        prompt: str = "a person talking naturally, speaking, conversation",
        profile: str = "low_vram",
        stage: str = "ai2v",  # at2v (audio-text) or ai2v (audio-image)
    ) -> Dict[str, Any]:
        """
        Generate talking avatar video from image + audio.
        
        Args:
            image_b64: Base64-encoded face image
            audio_b64: Base64-encoded audio
            prompt: Text prompt
            profile: Quality profile
            stage: Generation mode (at2v or ai2v)
        
        Returns:
            Dict with output_mp4_b64 and metadata
        """
        import librosa
        import soundfile as sf
        
        job_id = str(uuid.uuid4())[:8]
        work_dir = Path(f"/data/jobs/longcat_{job_id}")
        work_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            # Save inputs
            img_path = work_dir / "input.png"
            audio_path = work_dir / "input.wav"
            b64_to_file(image_b64, str(img_path))
            b64_to_file(audio_b64, str(work_dir / "input_raw.wav"))
            
            # Preprocess audio
            audio_data, sr = librosa.load(str(work_dir / "input_raw.wav"), sr=16000, mono=True)
            sf.write(str(audio_path), audio_data, 16000)
            audio_duration = len(audio_data) / 16000
            
            # Build input JSON (LongCat format)
            input_json = {
                "cond_image": str(img_path),
                "cond_audio": {"person1": str(audio_path)},
                "prompt": prompt,
            }
            input_json_path = work_dir / "input.json"
            with open(input_json_path, "w") as f:
                json.dump(input_json, f, indent=2)
            
            # Get profile settings
            settings = LONGCAT_PROFILES.get(profile, LONGCAT_PROFILES["low_vram"])
            
            # Build command
            out_dir = work_dir / "output"
            out_dir.mkdir(exist_ok=True)
            
            cmd = [
                "torchrun",
                "--nproc_per_node=1",
                f"{self.repo_dir}/run_demo_avatar_single_audio_to_video.py",
                f"--checkpoint_dir={self.checkpoint_dir}",
                f"--stage_1={stage}",
                f"--input_json={input_json_path}",
                f"--resolution={settings['resolution']}",
                f"--num_segments={settings['num_segments']}",
                "--ref_img_index=10",
                "--mask_frame_range=3",
            ]
            
            output = safe_run(cmd, cwd=str(work_dir))
            print(output)
            
            # Find output video
            out_mp4 = newest_mp4(str(work_dir))
            
            data_vol.commit()
            
            return {
                "job_id": job_id,
                "output_mp4_b64": file_to_b64(out_mp4),
                "audio_duration": audio_duration,
                "profile": profile,
                "stage": stage,
            }
            
        except Exception as e:
            print(f"❌ LongCat-Avatar failed: {e}")
            data_vol.commit()
            raise


# =============================================================================
# FastAPI Router (for deployed endpoint)
# =============================================================================

# Create a separate image for the web endpoint with FastAPI
image_web = modal.Image.debian_slim(python_version="3.10").pip_install(
    "fastapi", "pydantic", "uvicorn"
)


@app.function(image=image_web)
@modal.asgi_app()
def fastapi_app():
    from fastapi import FastAPI, HTTPException
    from pydantic import BaseModel, Field
    
    api = FastAPI(title="Video Lab API", version="1.0.0")
    
    class GenerateRequest(BaseModel):
        model: Literal["infinitetalk", "longcat"] = "infinitetalk"
        profile: Literal["low_vram", "balanced", "quality"] = "low_vram"
        prompt: str = "a person talking naturally"
        image_b64: str = Field(..., description="Base64-encoded face image")
        audio_b64: str = Field(..., description="Base64-encoded audio")
        max_duration_sec: float = Field(10.0, description="Max audio duration (InfiniteTalk only)")

    class GenerateResponse(BaseModel):
        request_id: str
        model: str
        profile: str
        output_mp4_b64: str
        metadata: Dict[str, Any] = {}

    @api.post("/generate", response_model=GenerateResponse)
    async def generate(req: GenerateRequest):
        """Generate talking head video using selected model."""
        request_id = str(uuid.uuid4())
        
        try:
            if req.model == "infinitetalk":
                result = InfiniteTalkService().generate.remote(
                    image_b64=req.image_b64,
                    audio_b64=req.audio_b64,
                    prompt=req.prompt,
                    profile=req.profile,
                    max_duration_sec=req.max_duration_sec,
                )
            elif req.model == "longcat":
                result = LongCatAvatarService().generate.remote(
                    image_b64=req.image_b64,
                    audio_b64=req.audio_b64,
                    prompt=req.prompt,
                    profile=req.profile,
                )
            else:
                raise HTTPException(400, f"Unknown model: {req.model}")
            
            return GenerateResponse(
                request_id=request_id,
                model=req.model,
                profile=req.profile,
                output_mp4_b64=result["output_mp4_b64"],
                metadata={k: v for k, v in result.items() if k != "output_mp4_b64"},
            )
        except Exception as e:
            raise HTTPException(500, str(e))

    @api.get("/health")
    async def health():
        return {"status": "ok", "models": ["infinitetalk", "longcat"]}
    
    return api


# =============================================================================
# Local Entrypoint (CLI testing)
# =============================================================================

@app.local_entrypoint()
def main(
    model: str = "infinitetalk",
    image: str = "public/assets/images/test_face_hq.jpg",
    audio: str = "public/assets/audio/test_audio_16k.wav",
    profile: str = "low_vram",
    output: str = "video_lab_output.mp4",
    download_only: bool = False,
):
    """
    Test video generation locally.
    
    Examples:
        modal run scripts/modal_video_lab.py --model infinitetalk --image face.png --audio speech.wav
        modal run scripts/modal_video_lab.py --model longcat --image face.png --audio speech.wav
        modal run scripts/modal_video_lab.py --download-only
    """
    if download_only:
        print("Downloading weights...")
        download_weights.remote(infinitetalk=True, longcat=True)
        print("Done!")
        return
    
    # Read inputs
    if not os.path.exists(image):
        print(f"❌ Image not found: {image}")
        return
    if not os.path.exists(audio):
        print(f"❌ Audio not found: {audio}")
        return
    
    with open(image, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode("utf-8")
    with open(audio, "rb") as f:
        audio_b64 = base64.b64encode(f.read()).decode("utf-8")
    
    print(f"Model: {model}")
    print(f"Profile: {profile}")
    print(f"Image: {image}")
    print(f"Audio: {audio}")
    
    # Generate
    if model == "infinitetalk":
        result = InfiniteTalkService().generate.remote(
            image_b64=image_b64,
            audio_b64=audio_b64,
            profile=profile,
        )
    elif model == "longcat":
        result = LongCatAvatarService().generate.remote(
            image_b64=image_b64,
            audio_b64=audio_b64,
            profile=profile,
        )
    else:
        print(f"❌ Unknown model: {model}")
        return
    
    # Save output
    output_data = base64.b64decode(result["output_mp4_b64"])
    with open(output, "wb") as f:
        f.write(output_data)
    
    print(f"✅ Output saved to: {output}")
    print(f"Metadata: {json.dumps({k: v for k, v in result.items() if k != 'output_mp4_b64'}, indent=2)}")
