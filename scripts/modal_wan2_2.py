"""
Wan2.2 High-Quality Text-to-Video Generation on Modal

Wan2.2 (Alibaba): T2V, TI2V, I2V - High quality video generation with:
- 720p @ 24FPS output
- Visual text rendering
- Apache-2.0 license
- Better quality than LTX-Video at the cost of speed

Deploy: modal deploy scripts/modal_wan2_2.py
Test:   modal run scripts/modal_wan2_2.py::generate_video --prompt "A serene mountain landscape with snow"

API Endpoint: https://YOUR_USERNAME--wan2-2-video-api-generate.modal.run
"""

import modal
import io
import base64
import time
import json
import tempfile
from pathlib import Path
from typing import Optional, Dict, Any
from pydantic import BaseModel

# Modal app configuration
app = modal.App("wan2-2-video")

# Model configuration
WAN2_2_MODEL_ID = "Alibaba-Qwen/Wan2.2-T2V-14B"
WAN2_2_TI2V_MODEL = "Alibaba-Qwen/Wan2.2-TI2V-5B"

# Create volume for caching model weights
volume = modal.Volume.from_name("wan2-2-models", create_if_missing=True)
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
        "numpy",
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

    print("Downloading Wan2.2 T2V-14B model (high quality, slower)...")
    try:
        snapshot_download(
            WAN2_2_MODEL_ID,
            cache_dir=f"{CACHE_DIR}/hub",
            ignore_patterns=["*.md", "*.txt"],
        )
        print("Wan2.2 T2V-14B download complete!")
    except Exception as e:
        print(f"Warning: Could not download Wan2.2 T2V: {e}")

    print("Downloading Wan2.2 TI2V-5B model (text + image to video)...")
    try:
        snapshot_download(
            WAN2_2_TI2V_MODEL,
            cache_dir=f"{CACHE_DIR}/hub",
            ignore_patterns=["*.md", "*.txt"],
        )
        print("Wan2.2 TI2V-5B download complete!")
    except Exception as e:
        print(f"Warning: Could not download Wan2.2 TI2V: {e}")


# Pre-download models during image build
image = image.run_function(
    download_models,
    volumes={CACHE_DIR: volume},
    timeout=1800,  # 30 min for large models
)


# ============================================================================
# Request/Response Models
# ============================================================================

class Wan22Settings(BaseModel):
    width: int = 1280
    height: int = 720
    duration_seconds: int = 10
    fps: int = 24
    num_inference_steps: int = 50
    guidance_scale: float = 7.5
    seed: Optional[int] = None


class Wan22GenerateRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = "blurry, low quality, distorted, ugly"
    model: str = "wan2.2-t2v-14b"  # or "wan2.2-ti2v-5b"
    settings: Wan22Settings = Wan22Settings()
    image_base64: Optional[str] = None  # For TI2V mode


class Wan22GenerateResponse(BaseModel):
    video_base64: str
    video_path: str
    duration: float
    resolution: str
    fps: int
    generation_time: float
    metadata: Dict[str, Any]


# ============================================================================
# Wan2.2 Generator Class
# ============================================================================

@app.cls(
    image=image,
    gpu="H100",  # H100 required for high-quality generation
    volumes={CACHE_DIR: volume},
    timeout=1200,  # 20 min max per request
    scaledown_window=300,  # Keep warm for 5 minutes
)
class Wan22VideoGenerator:
    """Wan2.2 high-quality text-to-video generator."""

    @modal.enter()
    def setup(self):
        """Load the model pipeline on container start."""
        import torch

        print("Initializing Wan2.2 generator...")
        self.torch = torch
        self.device = "cuda"

        # Lazy load pipelines
        self.t2v_pipe = None
        self.ti2v_pipe = None
        self.initialized_models = set()

    def load_t2v_model(self):
        """Load Wan2.2 T2V-14B for text-to-video."""
        if "t2v" in self.initialized_models:
            return

        print("Loading Wan2.2 T2V-14B model...")
        try:
            from diffusers import DiffusionPipeline

            start = time.time()
            self.t2v_pipe = DiffusionPipeline.from_pretrained(
                WAN2_2_MODEL_ID,
                torch_dtype=self.torch.bfloat16,
                cache_dir=f"{CACHE_DIR}/hub",
            )
            self.t2v_pipe.to(self.device)
            self.t2v_pipe.enable_model_cpu_offload()

            print(f"Wan2.2 T2V loaded in {time.time() - start:.1f}s")
            self.initialized_models.add("t2v")
        except Exception as e:
            print(f"Error loading Wan2.2 T2V: {e}")
            self.t2v_pipe = None

    def load_ti2v_model(self):
        """Load Wan2.2 TI2V-5B for text+image to video."""
        if "ti2v" in self.initialized_models:
            return

        print("Loading Wan2.2 TI2V-5B model...")
        try:
            from diffusers import DiffusionPipeline

            start = time.time()
            self.ti2v_pipe = DiffusionPipeline.from_pretrained(
                WAN2_2_TI2V_MODEL,
                torch_dtype=self.torch.bfloat16,
                cache_dir=f"{CACHE_DIR}/hub",
            )
            self.ti2v_pipe.to(self.device)
            self.ti2v_pipe.enable_model_cpu_offload()

            print(f"Wan2.2 TI2V loaded in {time.time() - start:.1f}s")
            self.initialized_models.add("ti2v")
        except Exception as e:
            print(f"Error loading Wan2.2 TI2V: {e}")
            self.ti2v_pipe = None

    @modal.method()
    def generate(self, request: Wan22GenerateRequest) -> Wan22GenerateResponse:
        """Generate video from text prompt."""
        import torch
        from PIL import Image
        import imageio

        print(f"Generating video: {request.prompt[:100]}...")
        gen_start = time.time()

        # Determine which model to use
        if request.image_base64 and request.model == "wan2.2-ti2v-5b":
            self.load_ti2v_model()
            pipe = self.ti2v_pipe
        else:
            self.load_t2v_model()
            pipe = self.t2v_pipe

        if pipe is None:
            raise RuntimeError("Failed to load model pipeline")

        # Prepare generation settings
        settings = request.settings

        # Set seed for reproducibility
        if settings.seed is not None:
            torch.manual_seed(settings.seed)

        # Prepare input
        if request.image_base64 and request.model == "wan2.2-ti2v-5b":
            # Text + Image to Video mode
            print("Using TI2V mode (text + image to video)...")
            image_data = base64.b64decode(request.image_base64)
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
                f.write(image_data)
                image_path = f.name

            image = Image.open(image_path)
            image = image.resize((settings.width, settings.height))

            # Generate with image conditioning
            frames = pipe(
                prompt=request.prompt,
                negative_prompt=request.negative_prompt,
                image=image,
                num_inference_steps=settings.num_inference_steps,
                guidance_scale=settings.guidance_scale,
                height=settings.height,
                width=settings.width,
                num_frames=int(settings.duration_seconds * settings.fps),
            ).frames[0]
        else:
            # Pure Text to Video mode
            print("Using T2V mode (text to video)...")

            # Generate frames
            frames = pipe(
                prompt=request.prompt,
                negative_prompt=request.negative_prompt,
                num_inference_steps=settings.num_inference_steps,
                guidance_scale=settings.guidance_scale,
                height=settings.height,
                width=settings.width,
                num_frames=int(settings.duration_seconds * settings.fps),
            ).frames[0]

        # Convert frames to video
        gen_time = time.time() - gen_start
        print(f"Video generation completed in {gen_time:.1f}s")

        # Save video
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
            video_path = f.name

        # Convert PIL images to numpy arrays if needed
        frame_arrays = []
        for frame in frames:
            if isinstance(frame, Image.Image):
                import numpy as np
                frame_arrays.append(np.array(frame))
            else:
                frame_arrays.append(frame)

        # Write video using imageio
        writer = imageio.get_writer(video_path, fps=settings.fps)
        for frame in frame_arrays:
            writer.append_data(frame)
        writer.close()

        # Read and encode video to base64
        with open(video_path, 'rb') as f:
            video_data = f.read()
        video_base64 = base64.b64encode(video_data).decode('utf-8')

        return Wan22GenerateResponse(
            video_base64=video_base64,
            video_path=video_path,
            duration=settings.duration_seconds,
            resolution=f"{settings.width}x{settings.height}",
            fps=settings.fps,
            generation_time=gen_time,
            metadata={
                "model": request.model,
                "prompt": request.prompt,
                "negative_prompt": request.negative_prompt,
                "guidance_scale": settings.guidance_scale,
                "num_inference_steps": settings.num_inference_steps,
                "seed": settings.seed,
            }
        )


# ============================================================================
# FastAPI Endpoints
# ============================================================================

@app.function(image=image)
@modal.asgi_app()
def fastapi_app():
    """FastAPI app for handling requests."""
    from fastapi import FastAPI, HTTPException

    fastapi = FastAPI()
    generator = Wan22VideoGenerator()

    @fastapi.post("/generate")
    async def generate_video(request: Wan22GenerateRequest) -> Dict[str, Any]:
        """Generate video from text prompt."""
        try:
            result = generator.generate.remote(request)
            return {
                "status": "success",
                "video_base64": result.video_base64,
                "duration": result.duration,
                "resolution": result.resolution,
                "fps": result.fps,
                "generation_time": result.generation_time,
                "metadata": result.metadata,
            }
        except Exception as e:
            print(f"Error: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @fastapi.get("/health")
    async def health():
        """Health check endpoint."""
        return {
            "status": "healthy",
            "model": "wan2.2",
            "gpu": "H100",
        }

    @fastapi.get("/models")
    async def list_models():
        """List available models."""
        return {
            "models": [
                {
                    "id": "wan2.2-t2v-14b",
                    "name": "Wan2.2 T2V-14B",
                    "type": "text-to-video",
                    "description": "High-quality text-to-video generation",
                    "max_duration_seconds": 60,
                    "resolutions": ["720x720", "1280x720"],
                    "quality": "highest",
                    "generation_time_estimate": "120-180 seconds",
                },
                {
                    "id": "wan2.2-ti2v-5b",
                    "name": "Wan2.2 TI2V-5B",
                    "type": "text-image-to-video",
                    "description": "Text + image to video generation",
                    "max_duration_seconds": 30,
                    "resolutions": ["720x720", "1280x720"],
                    "quality": "high",
                    "generation_time_estimate": "60-90 seconds",
                },
            ]
        }

    return fastapi


# ============================================================================
# CLI Entry Point
# ============================================================================

@app.local_entrypoint()
def main(
    prompt: str = "A serene mountain landscape with snow-covered peaks and clear blue sky",
    negative_prompt: str = "blurry, low quality, distorted",
    model: str = "wan2.2-t2v-14b",
    width: int = 1280,
    height: int = 720,
    duration_seconds: int = 10,
    fps: int = 24,
    guidance_scale: float = 7.5,
    num_inference_steps: int = 50,
    seed: Optional[int] = None,
):
    """CLI entry point for local testing."""
    print(f"Generating video with Wan2.2...")
    print(f"  Prompt: {prompt}")
    print(f"  Model: {model}")
    print(f"  Resolution: {width}x{height}")
    print(f"  Duration: {duration_seconds}s @ {fps}fps")

    request = Wan22GenerateRequest(
        prompt=prompt,
        negative_prompt=negative_prompt,
        model=model,
        settings=Wan22Settings(
            width=width,
            height=height,
            duration_seconds=duration_seconds,
            fps=fps,
            guidance_scale=guidance_scale,
            num_inference_steps=num_inference_steps,
            seed=seed,
        ),
    )

    generator = Wan22VideoGenerator()
    result = generator.generate.remote(request)

    # Save video to output directory
    output_path = f"output/wan2_2_video_{int(time.time())}.mp4"
    Path("output").mkdir(exist_ok=True)

    with open(output_path, 'wb') as f:
        f.write(base64.b64decode(result.video_base64))

    print(f"\n✅ Video generated successfully!")
    print(f"  Output: {output_path}")
    print(f"  Generation time: {result.generation_time:.1f}s")
    print(f"  Resolution: {result.resolution}")
    print(f"  Duration: {result.duration}s")
