"""
SadTalker: Audio-Driven Talking Head Generation on Modal

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

SADTALKER_ROOT = "/root/SadTalker"
CHECKPOINT_DIR = f"{SADTALKER_ROOT}/checkpoints"


def download_models():
    """
    Download all SadTalker models.
    The official script has most downloads commented out, so we do it manually.
    """
    import subprocess
    import os
    import urllib.request
    import zipfile
    
    os.chdir(SADTALKER_ROOT)
    ckpt_dir = f"{SADTALKER_ROOT}/checkpoints"
    gfpgan_dir = f"{SADTALKER_ROOT}/gfpgan/weights"
    os.makedirs(ckpt_dir, exist_ok=True)
    os.makedirs(gfpgan_dir, exist_ok=True)
    
    # All required model files from GitHub releases
    checkpoint_files = [
        # Core SadTalker models (from v0.0.2 release)
        ("https://github.com/Winfredy/SadTalker/releases/download/v0.0.2/auido2exp_00300-model.pth", "checkpoints/auido2exp_00300-model.pth"),
        ("https://github.com/Winfredy/SadTalker/releases/download/v0.0.2/auido2pose_00140-model.pth", "checkpoints/auido2pose_00140-model.pth"),
        ("https://github.com/Winfredy/SadTalker/releases/download/v0.0.2/epoch_20.pth", "checkpoints/epoch_20.pth"),
        ("https://github.com/Winfredy/SadTalker/releases/download/v0.0.2/facevid2vid_00189-model.pth.tar", "checkpoints/facevid2vid_00189-model.pth.tar"),
        ("https://github.com/Winfredy/SadTalker/releases/download/v0.0.2/shape_predictor_68_face_landmarks.dat", "checkpoints/shape_predictor_68_face_landmarks.dat"),
        ("https://github.com/Winfredy/SadTalker/releases/download/v0.0.2/wav2lip.pth", "checkpoints/wav2lip.pth"),
        # Updated mapping models (from v0.0.2-rc)
        ("https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/mapping_00109-model.pth.tar", "checkpoints/mapping_00109-model.pth.tar"),
        ("https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/mapping_00229-model.pth.tar", "checkpoints/mapping_00229-model.pth.tar"),
        ("https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/SadTalker_V0.0.2_256.safetensors", "checkpoints/SadTalker_V0.0.2_256.safetensors"),
        ("https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/SadTalker_V0.0.2_512.safetensors", "checkpoints/SadTalker_V0.0.2_512.safetensors"),
        # GFPGAN/facexlib weights
        ("https://github.com/xinntao/facexlib/releases/download/v0.1.0/alignment_WFLW_4HG.pth", "gfpgan/weights/alignment_WFLW_4HG.pth"),
        ("https://github.com/xinntao/facexlib/releases/download/v0.1.0/detection_Resnet50_Final.pth", "gfpgan/weights/detection_Resnet50_Final.pth"),
        ("https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.4.pth", "gfpgan/weights/GFPGANv1.4.pth"),
        ("https://github.com/xinntao/facexlib/releases/download/v0.2.2/parsing_parsenet.pth", "gfpgan/weights/parsing_parsenet.pth"),
    ]
    
    # Download each file
    for url, dest in checkpoint_files:
        dest_path = f"{SADTALKER_ROOT}/{dest}"
        if os.path.exists(dest_path):
            print(f"  ✓ {dest} (exists)")
            continue
        print(f"  Downloading {dest}...")
        try:
            urllib.request.urlretrieve(url, dest_path)
            print(f"  ✓ {dest}")
        except Exception as e:
            print(f"  ✗ {dest}: {e}")
    
    # Download and extract hub.zip (face-alignment models)
    hub_zip = f"{ckpt_dir}/hub.zip"
    if not os.path.exists(f"{ckpt_dir}/hub"):
        print("  Downloading hub.zip (face-alignment)...")
        try:
            urllib.request.urlretrieve(
                "https://github.com/Winfredy/SadTalker/releases/download/v0.0.2/hub.zip",
                hub_zip
            )
            with zipfile.ZipFile(hub_zip, 'r') as z:
                z.extractall(ckpt_dir)
            os.remove(hub_zip)
            print("  ✓ hub/ extracted")
        except Exception as e:
            print(f"  ✗ hub.zip: {e}")
    
    # Download and extract BFM_Fitting.zip (3DMM face model)
    bfm_zip = f"{ckpt_dir}/BFM_Fitting.zip"
    if not os.path.exists(f"{ckpt_dir}/BFM_Fitting"):
        print("  Downloading BFM_Fitting.zip (3DMM)...")
        try:
            urllib.request.urlretrieve(
                "https://github.com/Winfredy/SadTalker/releases/download/v0.0.2/BFM_Fitting.zip",
                bfm_zip
            )
            with zipfile.ZipFile(bfm_zip, 'r') as z:
                z.extractall(ckpt_dir)
            os.remove(bfm_zip)
            print("  ✓ BFM_Fitting/ extracted")
        except Exception as e:
            print(f"  ✗ BFM_Fitting.zip: {e}")
    
    # Sanity check
    need = [
        "checkpoints/auido2pose_00140-model.pth",
        "checkpoints/auido2exp_00300-model.pth",
        "checkpoints/epoch_20.pth",
        "checkpoints/wav2lip.pth",
        "checkpoints/shape_predictor_68_face_landmarks.dat",
        "checkpoints/BFM_Fitting",
        "checkpoints/hub",
        "gfpgan/weights/GFPGANv1.4.pth",
    ]
    print("\nVerifying checkpoint files:")
    all_ok = True
    for p in need:
        full_path = os.path.join(SADTALKER_ROOT, p)
        exists = os.path.exists(full_path)
        print(f"  {p}: {'✓' if exists else '✗'}")
        if not exists:
            all_ok = False
    
    if all_ok:
        print("\n✅ All checkpoints downloaded successfully!")


# Build image with SadTalker dependencies + baked models
image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install(
        "git",
        "ffmpeg",
        "wget",  # needed by download_models.sh
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
        "numpy>=1.23,<1.25",  # Pin to 1.24.x for SadTalker compatibility
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
    )
    .run_commands(
        # Clone SadTalker repo (force rebuild v2)
        f"git clone --depth 1 https://github.com/OpenTalker/SadTalker.git {SADTALKER_ROOT} && echo 'Cloned SadTalker'",
    )
    # Bake models into image using official download script
    .run_function(download_models, timeout=1800, gpu="A10G")
    # Set working directory to SadTalker root (critical for relative paths)
    .workdir(SADTALKER_ROOT)
    # Set TORCH_HOME so face-alignment uses baked checkpoints, not ~/.cache
    .env({
        "TORCH_HOME": f"{SADTALKER_ROOT}/checkpoints",
        "XDG_CACHE_HOME": f"{SADTALKER_ROOT}/.cache",
    })
)


@app.cls(
    image=image,
    gpu="A10G",
    timeout=600,
    scaledown_window=300,
)
class SadTalkerGenerator:
    """SadTalker talking head generator."""
    
    @modal.enter()
    def setup(self):
        """Initialize SadTalker."""
        import sys
        sys.path.insert(0, SADTALKER_ROOT)
        
        print("Setting up SadTalker...")
        self.sadtalker_dir = SADTALKER_ROOT
        self.checkpoint_dir = f"{SADTALKER_ROOT}/checkpoints"
        
        # Verify checkpoints are in place (baked during image build)
        import subprocess
        result = subprocess.run(
            ["ls", "-la", self.checkpoint_dir],
            capture_output=True, text=True
        )
        print(f"Checkpoints dir:\n{result.stdout}")
        
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
                    "error": f"Generation failed: {result.stderr[-2000:]}",
                    "stdout": result.stdout[-2000:],
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
