"""
LongCat-Video-Avatar: Talking Avatar Generation on Modal

Deploy: modal deploy scripts/modal_avatar_generation.py
Test:   modal run scripts/modal_avatar_generation.py --audio path/to/audio.wav

API Endpoint: https://YOUR_USERNAME--avatar-generation-api-generate.modal.run

Features:
- Audio-Text-to-Video (AT2V): Generate avatar from audio + text prompt
- Audio-Image-to-Video (AI2V): Generate avatar from audio + reference image + prompt
- Lip-synced talking head generation
- Natural expressions and body motion
"""

import modal
import os
import io
import json
import base64
import time
import tempfile
import subprocess
from pathlib import Path

# Modal app configuration
app = modal.App("avatar-generation")

# Model configuration
LONGCAT_VIDEO_REPO = "meituan-longcat/LongCat-Video"
LONGCAT_AVATAR_REPO = "meituan-longcat/LongCat-Video-Avatar"

# Create volume for caching model weights (very large ~50GB+)
volume = modal.Volume.from_name("longcat-avatar-models", create_if_missing=True)
CACHE_DIR = "/cache"
WEIGHTS_DIR = f"{CACHE_DIR}/weights"

# Build the container image with all dependencies
image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install(
        "git",
        "ffmpeg",
        "libsndfile1",
        "libgl1-mesa-glx",
        "libglib2.0-0",
        "ninja-build",
    )
    .pip_install(
        # PyTorch with CUDA
        "torch==2.4.0",
        "torchvision==0.19.0",
        "torchaudio==2.4.0",
        # Core dependencies
        "transformers>=4.40.0",
        "accelerate>=0.25.0",
        "diffusers>=0.30.0",
        "safetensors",
        "huggingface_hub",
        # Video/Audio processing
        "imageio[ffmpeg]",
        "opencv-python-headless",
        "librosa",
        "soundfile",
        "scipy",
        # Utilities
        "ninja",
        "psutil",
        "packaging",
        # API
        "fastapi",
        "pillow",
        "einops",
        "omegaconf",
        "decord",
        # Use xformers instead of flash-attn (easier to install)
        "xformers",
        # Additional LongCat dependencies
        "loguru",
        "av",
        "pydub",
        "rotary_embedding_torch",
        "sentencepiece",
        "protobuf",
    )
    .run_commands(
        # Clone LongCat repo and install its requirements at build time
        "git clone --single-branch --branch main https://github.com/meituan-longcat/LongCat-Video.git /root/LongCat-Video",
        "pip install -r /root/LongCat-Video/requirements.txt || true",
        "pip install -r /root/LongCat-Video/requirements_avatar.txt || true",
    )
    .env({
        "HF_HOME": CACHE_DIR,
        "HF_HUB_CACHE": f"{CACHE_DIR}/hub",
    })
)


def download_models():
    """Download LongCat model weights to cache volume."""
    from huggingface_hub import snapshot_download
    
    os.makedirs(WEIGHTS_DIR, exist_ok=True)
    
    # Download LongCat-Video (base model)
    print(f"Downloading {LONGCAT_VIDEO_REPO}...")
    snapshot_download(
        LONGCAT_VIDEO_REPO,
        local_dir=f"{WEIGHTS_DIR}/LongCat-Video",
        ignore_patterns=["*.md", "*.txt", "*.png", "*.jpg"],
    )
    
    # Download LongCat-Video-Avatar
    print(f"Downloading {LONGCAT_AVATAR_REPO}...")
    snapshot_download(
        LONGCAT_AVATAR_REPO,
        local_dir=f"{WEIGHTS_DIR}/LongCat-Video-Avatar",
        ignore_patterns=["*.md", "*.txt", "*.png", "*.jpg"],
    )
    
    print("Download complete!")


# Clone the LongCat repo for inference scripts
def setup_repo():
    """Clone LongCat-Video repo for inference scripts."""
    import subprocess
    
    repo_dir = "/root/LongCat-Video"
    if not os.path.exists(repo_dir):
        subprocess.run([
            "git", "clone", "--single-branch", "--branch", "main",
            "https://github.com/meituan-longcat/LongCat-Video.git",
            repo_dir
        ], check=True)
    
    # Install repo requirements
    subprocess.run([
        "pip", "install", "-r", f"{repo_dir}/requirements.txt"
    ], check=True, capture_output=True)
    
    subprocess.run([
        "pip", "install", "-r", f"{repo_dir}/requirements_avatar.txt"
    ], check=True, capture_output=True)
    
    return repo_dir


# Build image with model download (takes ~30+ min first time)
image = image.run_function(
    download_models,
    volumes={CACHE_DIR: volume},
    timeout=7200,  # 2 hours for large model download
    gpu="A10G",  # Need GPU for flash-attn compilation
)


@app.cls(
    image=image,
    gpu="H100",  # LongCat requires high VRAM for avatar generation
    volumes={CACHE_DIR: volume},
    timeout=1800,  # 30 min max per request
    scaledown_window=600,  # Keep warm for 10 minutes
)
class AvatarGenerator:
    """LongCat talking avatar generator."""
    
    @modal.enter()
    def setup(self):
        """Set up the inference environment."""
        import sys
        
        print("Setting up LongCat-Video-Avatar...")
        start = time.time()
        
        # Repo is pre-cloned during image build
        self.repo_dir = "/root/LongCat-Video"
        
        # Add repo to path
        sys.path.insert(0, self.repo_dir)
        
        # Set checkpoint directory
        self.checkpoint_dir = f"{WEIGHTS_DIR}/LongCat-Video-Avatar"
        
        print(f"Setup complete in {time.time() - start:.1f}s")
    
    @modal.method()
    def generate_avatar(
        self,
        audio_base64: str,
        prompt: str,
        reference_image_base64: str = None,
        resolution: str = "480P",
        audio_cfg: float = 4.0,
        num_inference_steps: int = 50,
    ) -> dict:
        """
        Generate talking avatar video from audio.
        
        Args:
            audio_base64: Base64-encoded audio file (WAV/MP3)
            prompt: Text prompt describing the avatar/scene
            reference_image_base64: Optional reference image for avatar appearance
            resolution: "480P" or "720P"
            audio_cfg: Audio guidance scale (3-5 optimal for lip sync)
            num_inference_steps: Number of diffusion steps
        
        Returns:
            dict with video (base64), duration, generation_time
        """
        import subprocess
        import tempfile
        
        print(f"Generating avatar video...")
        print(f"  Prompt: '{prompt[:50]}...'")
        print(f"  Resolution: {resolution}")
        print(f"  Audio CFG: {audio_cfg}")
        
        start = time.time()
        
        with tempfile.TemporaryDirectory() as tmpdir:
            # Save audio file
            audio_path = f"{tmpdir}/input_audio.wav"
            audio_bytes = base64.b64decode(audio_base64)
            with open(audio_path, "wb") as f:
                f.write(audio_bytes)
            
            # Determine generation mode
            if reference_image_base64:
                # Audio-Image-to-Video (AI2V)
                stage_1 = "ai2v"
                image_path = f"{tmpdir}/reference.png"
                image_bytes = base64.b64decode(reference_image_base64)
                with open(image_path, "wb") as f:
                    f.write(image_bytes)
            else:
                # Audio-Text-to-Video (AT2V)
                stage_1 = "at2v"
                image_path = None
            
            # Create input JSON for LongCat
            input_config = {
                "prompt": prompt + ", talking, speaking naturally",
                "audio_path": audio_path,
                "negative_prompt": "blurry, low quality, distorted face, bad lip sync",
            }
            if image_path:
                input_config["image_path"] = image_path
            
            input_json_path = f"{tmpdir}/input.json"
            with open(input_json_path, "w") as f:
                json.dump(input_config, f)
            
            output_dir = f"{tmpdir}/output"
            os.makedirs(output_dir, exist_ok=True)
            
            # Run LongCat inference
            cmd = [
                "torchrun",
                "--nproc_per_node=1",
                f"{self.repo_dir}/run_demo_avatar_single_audio_to_video.py",
                f"--checkpoint_dir={self.checkpoint_dir}",
                f"--stage_1={stage_1}",
                f"--input_json={input_json_path}",
                f"--output_dir={output_dir}",
                f"--resolution={resolution}",
                f"--audio_cfg={audio_cfg}",
                f"--num_inference_steps={num_inference_steps}",
            ]
            
            print(f"Running: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                cwd=self.repo_dir,
                capture_output=True,
                text=True,
                timeout=1200,  # 20 min timeout
            )
            
            if result.returncode != 0:
                print(f"Error: {result.stderr}")
                return {
                    "error": f"Generation failed: {result.stderr[:500]}",
                    "stdout": result.stdout[:500],
                }
            
            # Find output video
            video_files = list(Path(output_dir).glob("*.mp4"))
            if not video_files:
                return {"error": "No output video generated"}
            
            video_path = video_files[0]
            
            # Read and encode video
            with open(video_path, "rb") as f:
                video_bytes = f.read()
            
            video_base64 = base64.b64encode(video_bytes).decode("utf-8")
            generation_time = time.time() - start
            
            # Get video duration
            probe_cmd = [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(video_path)
            ]
            duration_result = subprocess.run(probe_cmd, capture_output=True, text=True)
            duration = float(duration_result.stdout.strip()) if duration_result.stdout.strip() else 0
            
            print(f"✅ Generated {duration:.1f}s video in {generation_time:.1f}s")
            
            return {
                "video": video_base64,
                "duration_seconds": duration,
                "generation_time_seconds": generation_time,
                "resolution": resolution,
                "stage": stage_1,
            }


@app.function(
    image=image,
    scaledown_window=60,
)
@modal.fastapi_endpoint(method="GET")
def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model": "LongCat-Video-Avatar",
        "gpu": "H100",
        "capabilities": ["at2v", "ai2v"],
    }


@app.function(
    image=image,
    gpu="H100",
    volumes={CACHE_DIR: volume},
    timeout=1800,
    scaledown_window=600,
)
@modal.fastapi_endpoint(method="POST")
def api_generate(request: dict):
    """
    HTTP API endpoint for avatar generation.
    
    Request body:
    {
        "audio": "<base64-encoded audio>",
        "prompt": "Professional presenter in a modern studio",
        "reference_image": "<base64-encoded image>",  // optional
        "resolution": "480P",  // or "720P"
        "audio_cfg": 4.0,      // 3-5 for best lip sync
        "num_inference_steps": 50
    }
    
    Response:
    {
        "video": "<base64-encoded MP4>",
        "duration_seconds": 10.5,
        "generation_time_seconds": 120.3
    }
    """
    audio = request.get("audio")
    if not audio:
        return {"error": "audio is required (base64-encoded)"}
    
    prompt = request.get("prompt", "A person speaking naturally")
    reference_image = request.get("reference_image")
    resolution = request.get("resolution", "480P")
    audio_cfg = request.get("audio_cfg", 4.0)
    num_inference_steps = request.get("num_inference_steps", 50)
    
    generator = AvatarGenerator()
    return generator.generate_avatar.remote(
        audio_base64=audio,
        prompt=prompt,
        reference_image_base64=reference_image,
        resolution=resolution,
        audio_cfg=audio_cfg,
        num_inference_steps=num_inference_steps,
    )


@app.local_entrypoint()
def main(
    audio: str = None,
    prompt: str = "A professional presenter speaking naturally in a modern studio",
    image: str = None,
    output: str = "output_avatar.mp4",
    resolution: str = "480P",
):
    """CLI entrypoint for testing."""
    import sys
    
    if not audio:
        print("Usage: modal run scripts/modal_avatar_generation.py --audio path/to/audio.wav")
        print("\nOptions:")
        print("  --audio      Path to audio file (required)")
        print("  --prompt     Text prompt for avatar")
        print("  --image      Path to reference image (optional)")
        print("  --output     Output video path")
        print("  --resolution 480P or 720P")
        sys.exit(1)
    
    # Read audio file
    with open(audio, "rb") as f:
        audio_base64 = base64.b64encode(f.read()).decode("utf-8")
    
    # Read image file if provided
    image_base64 = None
    if image:
        with open(image, "rb") as f:
            image_base64 = base64.b64encode(f.read()).decode("utf-8")
    
    print(f"\n🎭 Generating talking avatar...")
    print(f"   Audio: {audio}")
    print(f"   Prompt: {prompt}")
    print(f"   Reference image: {image or 'None (will generate)'}")
    print(f"   Resolution: {resolution}")
    print(f"\n⏳ This may take 2-5 minutes...\n")
    
    generator = AvatarGenerator()
    result = generator.generate_avatar.remote(
        audio_base64=audio_base64,
        prompt=prompt,
        reference_image_base64=image_base64,
        resolution=resolution,
    )
    
    if "error" in result:
        print(f"❌ Error: {result['error']}")
        sys.exit(1)
    
    # Save video
    video_bytes = base64.b64decode(result["video"])
    with open(output, "wb") as f:
        f.write(video_bytes)
    
    print(f"\n✅ Avatar video saved: {output}")
    print(f"   Duration: {result['duration_seconds']:.1f}s")
    print(f"   Generation time: {result['generation_time_seconds']:.1f}s")
