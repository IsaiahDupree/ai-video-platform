"""
Mochi Photorealistic Text-to-Video Generation on Modal

Mochi (Genmo): T2V photorealistic video generation with:
- 1024x576 @ 25FPS output (higher quality than LTX)
- Photorealistic style
- Apache-2.0 license
- Better for cinematic/photorealistic content

Deploy: modal deploy scripts/modal_mochi.py
Test:   modal run scripts/modal_mochi.py::generate_video --prompt "A serene mountain landscape with snow"

API Endpoint: https://YOUR_USERNAME--mochi-video-api-generate.modal.run
"""

import modal
import io
import base64
import time
import json
import tempfile
from pathlib import Path
from typing import Optional, Dict, Any, Literal
from pydantic import BaseModel

# Modal app configuration
app = modal.App("mochi-video")

# Model configuration
MOCHI_MODEL_ID = "genmo/mochi-1-preview"

# Create volume for caching model weights
volume = modal.Volume.from_name("mochi-models", create_if_missing=True)
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


class MochiSettings(BaseModel):
    """Mochi generation settings."""
    width: int = 1024
    height: int = 576
    duration_seconds: int = 6
    fps: int = 25
    num_inference_steps: int = 60
    guidance_scale: float = 7.5


class MochiGenerateRequest(BaseModel):
    """Mochi generation request."""
    prompt: str
    negative_prompt: Optional[str] = "blurry, low quality, distorted, ugly"
    settings: Optional[MochiSettings] = None


class MochiGenerateResponse(BaseModel):
    """Mochi generation response."""
    status: str
    video_base64: str
    duration: float
    resolution: str
    fps: int
    generation_time: float
    metadata: Dict[str, Any] = {}


@app.cls(
    image=image,
    gpu="A100",  # A100 for best photorealistic quality
    volumes={CACHE_DIR: volume},
    timeout=1800,  # 30 min max per request
    scaledown_window=300,  # Keep warm for 5 minutes
)
class MochiVideoGenerator:
    """Mochi photorealistic video generator."""

    @modal.enter()
    def setup(self):
        """Load the model on container start."""
        import torch

        print("Initializing Mochi video generation system...")
        self.torch = torch
        self.device = "cuda"
        self.mochi_pipe = None
        self.initialized = False

    def load_model(self):
        """Load Mochi model."""
        if self.initialized:
            return

        print("Loading Mochi model...")
        try:
            from diffusers import MochiPipeline

            start = time.time()
            self.mochi_pipe = MochiPipeline.from_pretrained(
                MOCHI_MODEL_ID,
                torch_dtype=self.torch.float16,
                cache_dir=f"{CACHE_DIR}/hub",
            )
            self.mochi_pipe.to(self.device)
            self.mochi_pipe.enable_attention_slicing()

            print(f"Mochi loaded in {time.time() - start:.1f}s")
            self.initialized = True
        except Exception as e:
            print(f"Error loading Mochi: {e}")
            self.mochi_pipe = None

    @modal.method()
    def generate(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        width: int = 1024,
        height: int = 576,
        duration_seconds: int = 6,
        fps: int = 25,
        num_inference_steps: int = 60,
        guidance_scale: float = 7.5,
        seed: Optional[int] = None,
    ) -> MochiGenerateResponse:
        """Generate video using Mochi."""
        print(f"Generating video: '{prompt[:50]}...'")
        start_time = time.time()

        # Load model if not already loaded
        self.load_model()
        if not self.mochi_pipe:
            raise RuntimeError("Could not load Mochi model")

        try:
            # Generate video
            with self.torch.no_grad():
                output = self.mochi_pipe(
                    prompt=prompt,
                    negative_prompt=negative_prompt or "blurry, low quality, distorted, ugly",
                    height=height,
                    width=width,
                    num_frames=int(duration_seconds * fps),
                    num_inference_steps=num_inference_steps,
                    guidance_scale=guidance_scale,
                    generator=self.torch.Generator(device=self.device).manual_seed(seed) if seed else None,
                )

            frames = output.frames[0] if hasattr(output, 'frames') else output

            # Export to video
            from diffusers.utils import export_to_video

            video_path = "/tmp/mochi_output.mp4"
            export_to_video(frames, video_path, fps=fps)

            # Read and encode video
            with open(video_path, "rb") as f:
                video_bytes = f.read()

            generation_time = time.time() - start_time

            return MochiGenerateResponse(
                status="success",
                video_base64=base64.b64encode(video_bytes).decode("utf-8"),
                duration=duration_seconds,
                resolution=f"{width}x{height}",
                fps=fps,
                generation_time=generation_time,
                metadata={
                    "model": "mochi-1-preview",
                    "prompt": prompt,
                    "negative_prompt": negative_prompt,
                    "guidance_scale": guidance_scale,
                    "num_inference_steps": num_inference_steps,
                    "seed": seed,
                },
            )
        except Exception as e:
            print(f"Error during generation: {e}")
            raise RuntimeError(f"Mochi generation failed: {str(e)}")


@app.function(
    image=image,
    scaledown_window=60,
)
@modal.fastapi_endpoint(method="GET")
def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "mochi-video-generation",
        "model": "mochi-1-preview",
        "gpu": "A100",
    }


@app.function(
    image=image,
    gpu="A100",
    volumes={CACHE_DIR: volume},
    timeout=1800,
    scaledown_window=300,
)
@modal.fastapi_endpoint(method="POST")
def api_generate(request: MochiGenerateRequest):
    """
    HTTP API endpoint for Mochi video generation.

    Request body:
    {
        "prompt": "A serene mountain landscape with snow at sunset",
        "negative_prompt": "blurry, low quality...",
        "settings": {
            "width": 1024,
            "height": 576,
            "duration_seconds": 6,
            "fps": 25,
            "num_inference_steps": 60,
            "guidance_scale": 7.5
        }
    }

    Response:
    {
        "status": "success",
        "video_base64": "<base64-encoded MP4>",
        "duration": 6.0,
        "resolution": "1024x576",
        "fps": 25,
        "generation_time": 180.5,
        "metadata": {...}
    }
    """
    settings = request.settings or MochiSettings()

    print(f"API: Generating video with Mochi")
    print(f"  Prompt: {request.prompt[:100]}")
    print(f"  Resolution: {settings.width}x{settings.height}")
    print(f"  Duration: {settings.duration_seconds}s @ {settings.fps}fps")

    generator = MochiVideoGenerator()
    try:
        result = generator.generate(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            width=settings.width,
            height=settings.height,
            duration_seconds=settings.duration_seconds,
            fps=settings.fps,
            num_inference_steps=settings.num_inference_steps,
            guidance_scale=settings.guidance_scale,
        )
        return result.model_dump()
    except Exception as e:
        print(f"Error during generation: {e}")
        return {
            "status": "error",
            "error": str(e),
            "video_base64": "",
            "duration": 0,
            "resolution": "",
            "fps": 0,
            "generation_time": 0,
        }


@app.local_entrypoint()
def main(
    prompt: str = "A serene mountain landscape with snow at sunset",
    output: str = "mochi_output.mp4",
    num_inference_steps: int = 60,
):
    """Local entrypoint for testing."""
    print(f"Generating video with Mochi")
    print(f"  Prompt: {prompt}")
    print(f"  Output: {output}")
    print(f"  Steps: {num_inference_steps}")

    generator = MochiVideoGenerator()
    result = generator.generate(
        prompt=prompt,
        num_inference_steps=num_inference_steps,
    )

    # Save output
    output_bytes = base64.b64decode(result.video_base64)
    with open(output, "wb") as f:
        f.write(output_bytes)

    print(f"\nGeneration complete!")
    print(f"Output: {output}")
    print(f"Duration: {result.duration}s")
    print(f"Resolution: {result.resolution}")
    print(f"Generation time: {result.generation_time:.1f}s")
