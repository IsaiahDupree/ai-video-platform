"""
SadTalker: Audio-Driven Talking Head Generation on Modal

A simpler, more reliable talking head model compared to LongCat.
Generates lip-synced video from audio + face image.

Deploy: modal deploy scripts/modal_sadtalker.py
Test:   modal run scripts/modal_sadtalker.py --audio voice.wav --image face.png

API: https://YOUR_USERNAME--sadtalker-api-generate.modal.run
"""

import modal
import os
import io
import base64
import time
import tempfile
import subprocess
from pathlib import Path

app = modal.App("sadtalker")

# Volume for model weights (~2GB)
volume = modal.Volume.from_name("sadtalker-models", create_if_missing=True)
CACHE_DIR = "/cache"

# Build image with SadTalker dependencies
image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install(
        "git",
        "ffmpeg",
        "libgl1-mesa-glx",
        "libglib2.0-0",
        "libsm6",
        "libxext6",
        "libxrender-dev",
    )
    .pip_install(
        "torch==2.1.0",
        "torchvision==0.16.0",
        "torchaudio==2.1.0",
        "numpy<2",
        "scipy",
        "librosa",
        "opencv-python-headless",
        "imageio",
        "imageio-ffmpeg",
        "pillow",
        "pyyaml",
        "tqdm",
        "gfpgan",
        "basicsr",
        "facexlib",
        "realesrgan",
        "kornia",
        "face_alignment",
        "yacs",
        "pydub",
        "safetensors",
        "fastapi",
        "huggingface_hub",
    )
    .run_commands(
        # Clone SadTalker
        "git clone https://github.com/OpenTalker/SadTalker.git /root/SadTalker",
    )
    .env({
        "HF_HOME": CACHE_DIR,
    })
)


def download_checkpoints():
    """Download SadTalker model checkpoints."""
    import subprocess
    
    ckpt_dir = f"{CACHE_DIR}/checkpoints"
    os.makedirs(ckpt_dir, exist_ok=True)
    
    # Download checkpoints using SadTalker's script
    subprocess.run([
        "bash", "/root/SadTalker/scripts/download_models.sh"
    ], cwd="/root/SadTalker", check=False)
    
    # Also download from HuggingFace as backup
    from huggingface_hub import hf_hub_download
    
    files_to_download = [
        ("vinthony/SadTalker", "checkpoints/mapping_00109-model.pth.tar"),
        ("vinthony/SadTalker", "checkpoints/mapping_00229-model.pth.tar"),
        ("vinthony/SadTalker", "checkpoints/SadTalker_V0.0.2_256.safetensors"),
        ("vinthony/SadTalker", "checkpoints/SadTalker_V0.0.2_512.safetensors"),
    ]
    
    for repo, filename in files_to_download:
        try:
            hf_hub_download(
                repo_id=repo,
                filename=filename,
                local_dir=CACHE_DIR,
            )
            print(f"Downloaded {filename}")
        except Exception as e:
            print(f"Warning: Could not download {filename}: {e}")
    
    print("Checkpoint download complete!")


# Build image with checkpoint download
image = image.run_function(
    download_checkpoints,
    volumes={CACHE_DIR: volume},
    timeout=1800,
    gpu="A10G",
)


@app.cls(
    image=image,
    gpu="A10G",
    volumes={CACHE_DIR: volume},
    timeout=600,
    scaledown_window=300,
)
class SadTalkerGenerator:
    """SadTalker talking head generator."""
    
    @modal.enter()
    def setup(self):
        """Initialize SadTalker."""
        import sys
        sys.path.insert(0, "/root/SadTalker")
        
        print("Setting up SadTalker...")
        self.sadtalker_dir = "/root/SadTalker"
        self.checkpoint_dir = f"{CACHE_DIR}/checkpoints"
        print("SadTalker ready!")
    
    @modal.method()
    def generate(
        self,
        audio_base64: str,
        image_base64: str,
        enhancer: str = "gfpgan",
        preprocess: str = "crop",
        still_mode: bool = False,
        expression_scale: float = 1.0,
    ) -> dict:
        """
        Generate talking head video.
        
        Args:
            audio_base64: Base64-encoded audio (WAV/MP3)
            image_base64: Base64-encoded face image (PNG/JPG)
            enhancer: Face enhancer ("gfpgan" or None)
            preprocess: "crop", "resize", or "full"
            still_mode: If True, only animate face (no head motion)
            expression_scale: Expression intensity (default 1.0)
        
        Returns:
            dict with video (base64), duration, generation_time
        """
        import subprocess
        
        print(f"Generating talking head video...")
        start = time.time()
        
        with tempfile.TemporaryDirectory() as tmpdir:
            # Save inputs
            audio_path = f"{tmpdir}/audio.wav"
            image_path = f"{tmpdir}/face.png"
            output_dir = f"{tmpdir}/output"
            os.makedirs(output_dir, exist_ok=True)
            
            with open(audio_path, "wb") as f:
                f.write(base64.b64decode(audio_base64))
            
            with open(image_path, "wb") as f:
                f.write(base64.b64decode(image_base64))
            
            # Build command
            cmd = [
                "python", "inference.py",
                "--driven_audio", audio_path,
                "--source_image", image_path,
                "--result_dir", output_dir,
                "--checkpoint_dir", self.checkpoint_dir,
                "--preprocess", preprocess,
                "--expression_scale", str(expression_scale),
            ]
            
            if enhancer:
                cmd.extend(["--enhancer", enhancer])
            
            if still_mode:
                cmd.append("--still")
            
            print(f"Running: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                cwd=self.sadtalker_dir,
                capture_output=True,
                text=True,
                timeout=300,
            )
            
            if result.returncode != 0:
                return {
                    "error": f"Generation failed: {result.stderr[:500]}",
                    "stdout": result.stdout[:500],
                }
            
            # Find output video
            video_files = list(Path(output_dir).rglob("*.mp4"))
            if not video_files:
                return {"error": "No output video generated"}
            
            video_path = video_files[0]
            
            with open(video_path, "rb") as f:
                video_bytes = f.read()
            
            video_base64 = base64.b64encode(video_bytes).decode("utf-8")
            generation_time = time.time() - start
            
            # Get duration
            probe = subprocess.run([
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(video_path)
            ], capture_output=True, text=True)
            duration = float(probe.stdout.strip()) if probe.stdout.strip() else 0
            
            print(f"✅ Generated {duration:.1f}s video in {generation_time:.1f}s")
            
            return {
                "video": video_base64,
                "duration_seconds": duration,
                "generation_time_seconds": generation_time,
            }


@app.function(image=image, scaledown_window=60)
@modal.fastapi_endpoint(method="GET")
def health():
    """Health check."""
    return {"status": "healthy", "model": "SadTalker", "gpu": "A10G"}


@app.function(
    image=image,
    gpu="A10G",
    volumes={CACHE_DIR: volume},
    timeout=600,
    scaledown_window=300,
)
@modal.fastapi_endpoint(method="POST")
def api_generate(request: dict):
    """
    Generate talking head video.
    
    Request:
    {
        "audio": "<base64 audio>",
        "image": "<base64 face image>",
        "enhancer": "gfpgan",  // optional
        "preprocess": "crop",  // optional: crop, resize, full
        "still_mode": false,   // optional
        "expression_scale": 1.0  // optional
    }
    """
    audio = request.get("audio")
    image = request.get("image")
    
    if not audio:
        return {"error": "audio is required (base64)"}
    if not image:
        return {"error": "image is required (base64)"}
    
    generator = SadTalkerGenerator()
    return generator.generate.remote(
        audio_base64=audio,
        image_base64=image,
        enhancer=request.get("enhancer", "gfpgan"),
        preprocess=request.get("preprocess", "crop"),
        still_mode=request.get("still_mode", False),
        expression_scale=request.get("expression_scale", 1.0),
    )


@app.local_entrypoint()
def main(
    audio: str = None,
    image: str = None,
    output: str = "output_talking_head.mp4",
):
    """CLI for testing."""
    import sys
    
    if not audio or not image:
        print("Usage: modal run scripts/modal_sadtalker.py --audio voice.wav --image face.png")
        print("\nRequired:")
        print("  --audio  Path to audio file")
        print("  --image  Path to face image")
        print("  --output Output video path (default: output_talking_head.mp4)")
        sys.exit(1)
    
    with open(audio, "rb") as f:
        audio_b64 = base64.b64encode(f.read()).decode()
    
    with open(image, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode()
    
    print(f"\n🎭 Generating talking head...")
    print(f"   Audio: {audio}")
    print(f"   Image: {image}")
    
    generator = SadTalkerGenerator()
    result = generator.generate.remote(
        audio_base64=audio_b64,
        image_base64=image_b64,
    )
    
    if "error" in result:
        print(f"❌ Error: {result['error']}")
        sys.exit(1)
    
    video_bytes = base64.b64decode(result["video"])
    with open(output, "wb") as f:
        f.write(video_bytes)
    
    print(f"\n✅ Video saved: {output}")
    print(f"   Duration: {result['duration_seconds']:.1f}s")
    print(f"   Generation time: {result['generation_time_seconds']:.1f}s")
