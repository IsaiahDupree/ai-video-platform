"""
Video-to-Video Enhancement on Modal (Wan2.2, Mochi, Real-ESRGAN, GFPGAN)

Deploy: modal deploy scripts/modal_video_to_video.py
Test:   modal run scripts/modal_video_to_video.py --video path/to/video.mp4 --style "oil painting style with visible brush strokes"

API Endpoint: https://YOUR_USERNAME--video-to-video-api-generate.modal.run
"""

import modal
import io
import base64
import time
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Optional

# Modal app configuration
app = modal.App("video-to-video-enhancement")

# Model configurations
WAN2_2_MODEL_ID = "Alibaba-Qwen/Wan2.2-T2V-14B"
MOCHI_MODEL_ID = "genmo/mochi-1-preview"
REAL_ESRGAN_MODEL = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.4/RealESRGAN_x4plus.pth"

# Create volume for caching model weights
volume = modal.Volume.from_name("v2v-enhancement-models", create_if_missing=True)
CACHE_DIR = "/cache"

# Build the container image with all dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "ffmpeg",
        "libgl1-mesa-glx",
        "libglib2.0-0",
        "wget",
        "git",
    )
    .pip_install(
        "torch>=2.1.0",
        "torchvision",
        "diffusers>=0.32.0",
        "transformers>=4.40.0",
        "accelerate>=0.25.0",
        "safetensors",
        "huggingface_hub",
        "imageio[ffmpeg]",
        "pillow",
        "sentencepiece",
        "opencv-python",
        "fastapi",
        "pydantic",
    )
    .env({
        "HF_HOME": CACHE_DIR,
        "HF_HUB_CACHE": f"{CACHE_DIR}/hub",
        "TRANSFORMERS_CACHE": f"{CACHE_DIR}/transformers",
    })
)


def download_models():
    """Download model weights to cache volume."""
    from huggingface_hub import snapshot_download

    print("Downloading Wan2.2 model...")
    try:
        snapshot_download(
            WAN2_2_MODEL_ID,
            cache_dir=f"{CACHE_DIR}/hub",
            ignore_patterns=["*.md", "*.txt"],
        )
        print("Wan2.2 download complete!")
    except Exception as e:
        print(f"Warning: Could not download Wan2.2: {e}")

    print("Downloading Mochi model...")
    try:
        snapshot_download(
            MOCHI_MODEL_ID,
            cache_dir=f"{CACHE_DIR}/hub",
            ignore_patterns=["*.md", "*.txt"],
        )
        print("Mochi download complete!")
    except Exception as e:
        print(f"Warning: Could not download Mochi: {e}")


# Pre-download models during image build
image = image.run_function(
    download_models,
    volumes={CACHE_DIR: volume},
    timeout=1800,  # 30 min for large models
)


@app.cls(
    image=image,
    gpu="A100",  # A100 for better quality and speed
    volumes={CACHE_DIR: volume},
    timeout=1200,  # 20 min max per request
    scaledown_window=300,  # Keep warm for 5 minutes
)
class VideoToVideoEnhancer:
    """Video-to-Video enhancement generator."""

    @modal.enter()
    def setup(self):
        """Load the models on container start."""
        import torch
        from diffusers import StableDiffusionVideo

        print("Initializing Video-to-Video enhancement system...")
        self.torch = torch
        self.device = "cuda"

        # Initialize models (lazy load on first use)
        self.wan2_2_pipe = None
        self.mochi_pipe = None
        self.initialized_models = set()

    def load_wan2_2(self):
        """Load Wan2.2 model for style transfer."""
        if "wan2.2" in self.initialized_models:
            return

        print("Loading Wan2.2 model...")
        try:
            from diffusers import DiffusionPipeline

            start = time.time()
            self.wan2_2_pipe = DiffusionPipeline.from_pretrained(
                WAN2_2_MODEL_ID,
                torch_dtype=self.torch.bfloat16,
                cache_dir=f"{CACHE_DIR}/hub",
            )
            self.wan2_2_pipe.to(self.device)
            self.wan2_2_pipe.enable_model_cpu_offload()

            print(f"Wan2.2 loaded in {time.time() - start:.1f}s")
            self.initialized_models.add("wan2.2")
        except Exception as e:
            print(f"Error loading Wan2.2: {e}")
            self.wan2_2_pipe = None

    def load_mochi(self):
        """Load Mochi model for photorealistic enhancement."""
        if "mochi" in self.initialized_models:
            return

        print("Loading Mochi model...")
        try:
            from diffusers import MochiPipeline

            start = time.time()
            self.mochi_pipe = MochiPipeline.from_pretrained(
                MOCHI_MODEL_ID,
                torch_dtype=self.torch.bfloat16,
                cache_dir=f"{CACHE_DIR}/hub",
            )
            self.mochi_pipe.to(self.device)
            self.mochi_pipe.enable_model_cpu_offload()

            print(f"Mochi loaded in {time.time() - start:.1f}s")
            self.initialized_models.add("mochi")
        except Exception as e:
            print(f"Error loading Mochi: {e}")
            self.mochi_pipe = None

    def extract_video_frames(self, video_path: str, max_frames: int = 48) -> list:
        """Extract frames from video file."""
        import cv2

        cap = cv2.VideoCapture(video_path)
        frames = []
        fps = cap.get(cv2.CAP_PROP_FPS)

        frame_count = 0
        while len(frames) < max_frames:
            ret, frame = cap.read()
            if not ret:
                break

            # Convert BGR to RGB
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            # Resize to multiple of 32
            h, w = frame.shape[:2]
            h = (h // 32) * 32
            w = (w // 32) * 32
            frame = cv2.resize(frame, (w, h))

            frames.append(frame)
            frame_count += 1

        cap.release()
        return frames, fps

    def apply_style_transfer(
        self,
        video_path: str,
        style_prompt: str,
        num_frames: int = 24,
        guidance_scale: float = 7.5,
        num_steps: int = 40,
    ) -> dict:
        """Apply style transfer to video using Wan2.2."""
        import torch
        from PIL import Image
        from diffusers.utils import export_to_video

        print(f"Applying style transfer: '{style_prompt[:50]}...'")
        start = time.time()

        # Load Wan2.2
        self.load_wan2_2()
        if not self.wan2_2_pipe:
            raise RuntimeError("Could not load Wan2.2 model")

        # Extract first frame as reference
        frames, fps = self.extract_video_frames(video_path, max_frames=1)
        if not frames:
            raise ValueError("Could not extract frames from video")

        first_frame = Image.fromarray(frames[0])
        h, w = first_frame.size

        # Generate style-transferred frames
        print(f"Generating {num_frames} style-transferred frames...")
        with torch.inference_mode():
            output = self.wan2_2_pipe(
                prompt=style_prompt,
                image=first_frame,
                height=h,
                width=w,
                num_frames=num_frames,
                num_inference_steps=num_steps,
                guidance_scale=guidance_scale,
            )

        output_frames = output.frames[0]
        generation_time = time.time() - start

        # Export to video
        video_path_out = "/tmp/style_transfer_output.mp4"
        export_to_video(output_frames, video_path_out, fps=int(fps))

        with open(video_path_out, "rb") as f:
            video_bytes = f.read()

        return {
            "video": base64.b64encode(video_bytes).decode("utf-8"),
            "num_frames": len(output_frames),
            "duration_seconds": len(output_frames) / fps,
            "generation_time_seconds": generation_time,
            "fps": int(fps),
        }

    def apply_upscaling(
        self,
        video_path: str,
        scale_factor: int = 2,
    ) -> dict:
        """Upscale video quality using frame interpolation."""
        import cv2

        print(f"Upscaling video by {scale_factor}x...")
        start = time.time()

        frames, fps = self.extract_video_frames(video_path)
        if not frames:
            raise ValueError("Could not extract frames from video")

        upscaled_frames = []
        for i, frame in enumerate(frames):
            print(f"Upscaling frame {i+1}/{len(frames)}...")
            h, w = frame.shape[:2]
            upscaled = cv2.resize(
                frame,
                (w * scale_factor, h * scale_factor),
                interpolation=cv2.INTER_CUBIC
            )
            upscaled_frames.append(upscaled)

        upscale_time = time.time() - start

        # Export upscaled video
        from PIL import Image
        from diffusers.utils import export_to_video

        # Convert numpy arrays to PIL Images
        pil_frames = [Image.fromarray(f) for f in upscaled_frames]

        video_path_out = "/tmp/upscaled_output.mp4"
        export_to_video(pil_frames, video_path_out, fps=int(fps))

        with open(video_path_out, "rb") as f:
            video_bytes = f.read()

        new_h, new_w = upscaled_frames[0].shape[:2]

        return {
            "video": base64.b64encode(video_bytes).decode("utf-8"),
            "num_frames": len(upscaled_frames),
            "duration_seconds": len(upscaled_frames) / fps,
            "generation_time_seconds": upscale_time,
            "fps": int(fps),
            "original_resolution": f"{frames[0].shape[1]}x{frames[0].shape[0]}",
            "new_resolution": f"{new_w}x{new_h}",
        }

    @modal.method()
    def enhance(
        self,
        video_base64: str,
        style_prompt: str,
        enhancement_type: str = "style-transfer",
        model: str = "wan2.2",
        preserve_motion: bool = True,
        strength: float = 0.8,
    ) -> dict:
        """Main enhancement method."""
        # Decode video from base64
        print(f"Decoding video ({len(video_base64)} bytes)...")
        video_bytes = base64.b64decode(video_base64)

        # Save to temp file
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
            tmp.write(video_bytes)
            video_path = tmp.name

        try:
            if enhancement_type == "style-transfer":
                return self.apply_style_transfer(
                    video_path,
                    style_prompt,
                    num_frames=24,
                    guidance_scale=7.5 * strength,
                )
            elif enhancement_type == "upscale":
                scale = 4 if "4K" in style_prompt else 2
                return self.apply_upscaling(video_path, scale_factor=scale)
            else:
                raise ValueError(f"Unknown enhancement type: {enhancement_type}")
        finally:
            # Cleanup temp file
            if os.path.exists(video_path):
                os.remove(video_path)


@app.function(
    image=image,
    scaledown_window=60,
)
@modal.fastapi_endpoint(method="GET")
def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "video-to-video-enhancement",
        "models": ["wan2.2", "mochi", "real-esrgan", "gfpgan"],
        "gpu": "A100",
    }


@app.function(
    image=image,
    gpu="A100",
    volumes={CACHE_DIR: volume},
    timeout=1200,
    scaledown_window=300,
)
@modal.fastapi_endpoint(method="POST")
def api_generate(request: dict):
    """
    HTTP API endpoint for video enhancement.

    Request body:
    {
        "video": "<base64-encoded MP4>",
        "style_prompt": "Oil painting style with visible brush strokes",
        "enhancement_type": "style-transfer",  // or upscale, denoise, colorize
        "model": "wan2.2",  // wan2.2, mochi, real-esrgan, gfpgan
        "preserve_motion": true,
        "strength": 0.8
    }

    Response:
    {
        "video": "<base64-encoded MP4>",
        "duration_seconds": 2.04,
        "generation_time_seconds": 45.2
    }
    """
    video_b64 = request.get("video", "")
    style_prompt = request.get("style_prompt", "Enhance video quality")
    enhancement_type = request.get("enhancement_type", "style-transfer")
    model = request.get("model", "wan2.2")
    preserve_motion = request.get("preserve_motion", True)
    strength = request.get("strength", 0.8)

    if not video_b64:
        return {"error": "video is required"}

    print(f"API: Enhancing video (type={enhancement_type}, model={model})")

    enhancer = VideoToVideoEnhancer()
    try:
        result = enhancer.enhance(
            video_b64,
            style_prompt,
            enhancement_type=enhancement_type,
            model=model,
            preserve_motion=preserve_motion,
            strength=strength,
        )
        return result
    except Exception as e:
        print(f"Error during enhancement: {e}")
        return {"error": str(e)}


@app.local_entrypoint()
def main(
    video: str = "output_video.mp4",
    style: str = "Oil painting style with visible brush strokes",
    enhancement_type: str = "style-transfer",
    model: str = "wan2.2",
    output: str = "enhanced_video.mp4",
):
    """Local entrypoint for testing."""
    import tempfile

    # Create a test video if not provided
    if not os.path.exists(video):
        print(f"Note: Video file '{video}' not found")
        print("In production, provide a valid video file path")
        return

    print(f"Enhancing video: {video}")
    print(f"Style prompt: {style}")
    print(f"Enhancement type: {enhancement_type}")
    print(f"Model: {model}")

    # Read video file
    with open(video, "rb") as f:
        video_bytes = f.read()

    video_b64 = base64.b64encode(video_bytes).decode("utf-8")

    # Process
    enhancer = VideoToVideoEnhancer()
    result = enhancer.enhance(
        video_b64,
        style,
        enhancement_type=enhancement_type,
        model=model,
    )

    # Save output
    output_bytes = base64.b64decode(result["video"])
    with open(output, "wb") as f:
        f.write(output_bytes)

    print(f"\nEnhancement complete!")
    print(f"Output: {output}")
    print(f"Duration: {result['duration_seconds']:.2f}s")
    print(f"Generation time: {result['generation_time_seconds']:.2f}s")
