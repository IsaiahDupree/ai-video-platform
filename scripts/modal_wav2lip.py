"""
Wav2Lip: Audio-Driven Lip Sync on Modal

Simpler, more reliable lip-sync model.
Takes audio + video/image and syncs lips.

Deploy: modal deploy scripts/modal_wav2lip.py
API: https://YOUR_USERNAME--wav2lip-api-generate.modal.run
"""

import modal
import os
import base64
import time
import tempfile
import subprocess
from pathlib import Path

app = modal.App("wav2lip")

volume = modal.Volume.from_name("wav2lip-models", create_if_missing=True)
CACHE_DIR = "/cache"

image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install(
        "git",
        "ffmpeg",
        "libgl1-mesa-glx",
        "libglib2.0-0",
        "libsm6",
        "libxext6",
        "wget",
    )
    .pip_install(
        "torch==2.1.0",
        "torchvision==0.16.0",
        "torchaudio==2.1.0",
        "numpy>=1.23,<1.25",  # Pin to 1.24.x for compatibility
        "scipy",
        "librosa",
        "opencv-python-headless",
        "imageio",
        "imageio-ffmpeg",
        "pillow",
        "tqdm",
        "numba",
        "fastapi",
        "batch-face",
        "huggingface_hub",
    )
    .run_commands(
        "git clone https://github.com/Rudrabha/Wav2Lip.git /root/Wav2Lip",
        "pip install -r /root/Wav2Lip/requirements.txt || true",
    )
    .env({"HF_HOME": CACHE_DIR})
)


def download_models():
    """Download Wav2Lip model weights from HuggingFace."""
    from huggingface_hub import hf_hub_download
    
    model_dir = f"{CACHE_DIR}/models"
    os.makedirs(model_dir, exist_ok=True)
    
    # Wav2Lip GAN model (best quality) from HuggingFace
    print("Downloading Wav2Lip GAN model from HuggingFace...")
    hf_hub_download(
        repo_id="Nekochu/Wav2Lip",
        filename="wav2lip_gan.pth",
        local_dir=model_dir,
    )
    print(f"Downloaded wav2lip_gan.pth")
    
    # Face detection model (s3fd) from facexlib repo
    print("Downloading face detection model...")
    import shutil
    s3fd_path = hf_hub_download(
        repo_id="camenduru/facexlib",
        filename="s3fd-619a316812.pth",
    )
    # Copy to expected location with expected name
    shutil.copy(s3fd_path, f"{model_dir}/s3fd.pth")
    print(f"Downloaded s3fd.pth")
    
    print("Model download complete!")


image = image.run_function(
    download_models,
    volumes={CACHE_DIR: volume},
    timeout=600,
)


@app.cls(
    image=image,
    gpu="A10G",
    volumes={CACHE_DIR: volume},
    timeout=600,
    scaledown_window=300,
)
class Wav2LipGenerator:
    
    @modal.enter()
    def setup(self):
        import sys
        sys.path.insert(0, "/root/Wav2Lip")
        self.model_dir = f"{CACHE_DIR}/models"
        print("Wav2Lip ready!")
    
    @modal.method()
    def generate(
        self,
        audio_base64: str,
        face_base64: str,
        is_video: bool = False,
    ) -> dict:
        """
        Generate lip-synced video.
        
        Args:
            audio_base64: Base64-encoded audio
            face_base64: Base64-encoded face image or video
            is_video: True if face_base64 is a video
        """
        print("Generating lip-synced video...")
        start = time.time()
        
        with tempfile.TemporaryDirectory() as tmpdir:
            # Save inputs
            audio_path = f"{tmpdir}/audio.wav"
            face_ext = ".mp4" if is_video else ".png"
            face_path = f"{tmpdir}/face{face_ext}"
            output_path = f"{tmpdir}/output.mp4"
            
            with open(audio_path, "wb") as f:
                f.write(base64.b64decode(audio_base64))
            
            with open(face_path, "wb") as f:
                f.write(base64.b64decode(face_base64))
            
            # Copy model to expected location
            os.makedirs("/root/Wav2Lip/checkpoints", exist_ok=True)
            subprocess.run([
                "cp", f"{self.model_dir}/wav2lip_gan.pth",
                "/root/Wav2Lip/checkpoints/wav2lip_gan.pth"
            ], check=True)
            
            os.makedirs("/root/Wav2Lip/face_detection/detection/sfd", exist_ok=True)
            subprocess.run([
                "cp", f"{self.model_dir}/s3fd.pth",
                "/root/Wav2Lip/face_detection/detection/sfd/s3fd.pth"
            ], check=True)
            
            # Run inference
            cmd = [
                "python", "inference.py",
                "--checkpoint_path", "checkpoints/wav2lip_gan.pth",
                "--face", face_path,
                "--audio", audio_path,
                "--outfile", output_path,
                "--pads", "0", "10", "0", "0",
                "--resize_factor", "1",
            ]
            
            print(f"Running: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                cwd="/root/Wav2Lip",
                capture_output=True,
                text=True,
                timeout=300,
            )
            
            if result.returncode != 0:
                return {
                    "error": f"Inference failed: {result.stderr[:500]}",
                    "stdout": result.stdout[:500],
                }
            
            if not os.path.exists(output_path):
                return {"error": "No output video generated"}
            
            with open(output_path, "rb") as f:
                video_bytes = f.read()
            
            video_base64 = base64.b64encode(video_bytes).decode()
            generation_time = time.time() - start
            
            # Get duration
            probe = subprocess.run([
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                output_path
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
    return {"status": "healthy", "model": "Wav2Lip", "gpu": "A10G"}


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
    Generate lip-synced video.
    
    Request:
    {
        "audio": "<base64 audio>",
        "face": "<base64 face image/video>",
        "is_video": false
    }
    """
    audio = request.get("audio")
    face = request.get("face")
    
    if not audio:
        return {"error": "audio is required"}
    if not face:
        return {"error": "face is required"}
    
    generator = Wav2LipGenerator()
    return generator.generate.remote(
        audio_base64=audio,
        face_base64=face,
        is_video=request.get("is_video", False),
    )


@app.local_entrypoint()
def main(audio: str = None, face: str = None, output: str = "output_lipsync.mp4"):
    import sys
    
    if not audio or not face:
        print("Usage: modal run scripts/modal_wav2lip.py --audio voice.wav --face face.png")
        sys.exit(1)
    
    with open(audio, "rb") as f:
        audio_b64 = base64.b64encode(f.read()).decode()
    
    with open(face, "rb") as f:
        face_b64 = base64.b64encode(f.read()).decode()
    
    is_video = face.endswith(('.mp4', '.mov', '.avi'))
    
    print(f"\n🎭 Generating lip-synced video...")
    
    generator = Wav2LipGenerator()
    result = generator.generate.remote(audio_b64, face_b64, is_video)
    
    if "error" in result:
        print(f"❌ Error: {result['error']}")
        sys.exit(1)
    
    video_bytes = base64.b64decode(result["video"])
    with open(output, "wb") as f:
        f.write(video_bytes)
    
    print(f"✅ Video saved: {output}")
