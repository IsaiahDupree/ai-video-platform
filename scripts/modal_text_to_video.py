"""
LTX-Video Text-to-Video Generation on Modal

Deploy: modal deploy scripts/modal_text_to_video.py
Test:   modal run scripts/modal_text_to_video.py --prompt "A serene mountain landscape"

API Endpoint: https://YOUR_USERNAME--text-to-video-ltx-api-generate.modal.run
"""

import modal
import io
import base64
import time
from pathlib import Path

# Modal app configuration
app = modal.App("text-to-video-ltx")

# Model configuration
MODEL_ID = "Lightricks/LTX-Video"
MODEL_REVISION = "main"

# Create volume for caching model weights
volume = modal.Volume.from_name("ltx-video-models", create_if_missing=True)
CACHE_DIR = "/cache"

# Build the container image with all dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "libgl1-mesa-glx", "libglib2.0-0")
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
        "fastapi",
    )
    .env({
        "HF_HOME": CACHE_DIR,
        "HF_HUB_CACHE": f"{CACHE_DIR}/hub",
        "TRANSFORMERS_CACHE": f"{CACHE_DIR}/transformers",
    })
)


def download_model():
    """Download model weights to cache volume."""
    from huggingface_hub import snapshot_download
    
    print(f"Downloading {MODEL_ID}...")
    snapshot_download(
        MODEL_ID,
        revision=MODEL_REVISION,
        cache_dir=f"{CACHE_DIR}/hub",
        ignore_patterns=["*.md", "*.txt"],
    )
    print("Download complete!")


# Pre-download model during image build
image = image.run_function(
    download_model,
    volumes={CACHE_DIR: volume},
    timeout=1800,  # 30 min for large model
)


@app.cls(
    image=image,
    gpu="A10G",  # Cost-effective GPU, upgrade to A100/H100 for faster generation
    volumes={CACHE_DIR: volume},
    timeout=600,  # 10 min max per request
    scaledown_window=300,  # Keep warm for 5 minutes
    # secrets=[modal.Secret.from_name("huggingface-secret")],  # Uncomment if HF token needed
)
class LTXVideoGenerator:
    """LTX-Video text-to-video generator."""
    
    @modal.enter()
    def setup(self):
        """Load the model pipeline on container start."""
        import torch
        from diffusers import LTXPipeline
        
        print("Loading LTX-Video pipeline...")
        start = time.time()
        
        self.pipe = LTXPipeline.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.bfloat16,
            cache_dir=f"{CACHE_DIR}/hub",
        )
        self.pipe.to("cuda")
        
        # Enable memory optimizations
        self.pipe.enable_model_cpu_offload()
        
        print(f"Pipeline loaded in {time.time() - start:.1f}s")
    
    @modal.method()
    def generate(
        self,
        prompt: str,
        negative_prompt: str = "blurry, low quality, distorted, watermark",
        num_frames: int = 49,  # ~2 seconds at 24fps
        width: int = 768,
        height: int = 512,
        num_inference_steps: int = 50,
        guidance_scale: float = 7.5,
        fps: int = 24,
    ) -> dict:
        """Generate video from text prompt."""
        import torch
        from diffusers.utils import export_to_video
        
        print(f"Generating video: '{prompt[:50]}...'")
        start = time.time()
        
        # Generate frames
        with torch.inference_mode():
            output = self.pipe(
                prompt=prompt,
                negative_prompt=negative_prompt,
                num_frames=num_frames,
                width=width,
                height=height,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                generator=torch.Generator("cuda").manual_seed(42),
            )
        
        frames = output.frames[0]
        generation_time = time.time() - start
        print(f"Generated {len(frames)} frames in {generation_time:.1f}s")
        
        # Export to video
        video_path = "/tmp/output.mp4"
        export_to_video(frames, video_path, fps=fps)
        
        # Read and encode video
        with open(video_path, "rb") as f:
            video_bytes = f.read()
        
        video_base64 = base64.b64encode(video_bytes).decode("utf-8")
        
        return {
            "video": video_base64,
            "num_frames": len(frames),
            "duration_seconds": len(frames) / fps,
            "generation_time_seconds": generation_time,
            "width": width,
            "height": height,
            "fps": fps,
        }
    
    @modal.method()
    def generate_with_image(
        self,
        prompt: str,
        image_base64: str,
        negative_prompt: str = "blurry, low quality, distorted",
        num_frames: int = 49,
        num_inference_steps: int = 50,
        guidance_scale: float = 7.5,
        fps: int = 24,
    ) -> dict:
        """Generate video from text prompt + reference image."""
        import torch
        from PIL import Image
        from diffusers.utils import export_to_video
        
        # Decode reference image
        image_bytes = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        width, height = image.size
        
        # Ensure dimensions are divisible by 32
        width = (width // 32) * 32
        height = (height // 32) * 32
        image = image.resize((width, height))
        
        print(f"Generating video from image: '{prompt[:50]}...'")
        start = time.time()
        
        # Generate frames
        with torch.inference_mode():
            output = self.pipe(
                prompt=prompt,
                negative_prompt=negative_prompt,
                image=image,
                num_frames=num_frames,
                width=width,
                height=height,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                generator=torch.Generator("cuda").manual_seed(42),
            )
        
        frames = output.frames[0]
        generation_time = time.time() - start
        
        # Export to video
        video_path = "/tmp/output.mp4"
        export_to_video(frames, video_path, fps=fps)
        
        with open(video_path, "rb") as f:
            video_bytes = f.read()
        
        return {
            "video": base64.b64encode(video_bytes).decode("utf-8"),
            "num_frames": len(frames),
            "duration_seconds": len(frames) / fps,
            "generation_time_seconds": generation_time,
            "width": width,
            "height": height,
            "fps": fps,
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
        "model": MODEL_ID,
        "gpu": "A10G",
    }


@app.function(
    image=image,
    gpu="A10G",
    volumes={CACHE_DIR: volume},
    timeout=600,
    scaledown_window=300,
    # secrets=[modal.Secret.from_name("huggingface-secret")],  # Uncomment if HF token needed
)
@modal.fastapi_endpoint(method="POST")
def api_generate(request: dict):
    """
    HTTP API endpoint for video generation.
    
    Request body:
    {
        "prompt": "A serene mountain landscape",
        "negative_prompt": "blurry, low quality",  // optional
        "num_frames": 49,  // optional, default 49 (~2s at 24fps)
        "width": 768,      // optional
        "height": 512,     // optional
        "num_inference_steps": 50,  // optional
        "guidance_scale": 7.5,      // optional
        "fps": 24          // optional
    }
    
    Response:
    {
        "video": "<base64-encoded MP4>",
        "duration_seconds": 2.04,
        "generation_time_seconds": 45.2
    }
    """
    import torch
    from diffusers import LTXPipeline
    from diffusers.utils import export_to_video
    
    prompt = request.get("prompt", "")
    if not prompt:
        return {"error": "prompt is required"}
    
    negative_prompt = request.get("negative_prompt", "blurry, low quality, distorted, watermark")
    num_frames = request.get("num_frames", 49)
    width = request.get("width", 768)
    height = request.get("height", 512)
    num_inference_steps = request.get("num_inference_steps", 50)
    guidance_scale = request.get("guidance_scale", 7.5)
    fps = request.get("fps", 24)
    
    print(f"API: Generating video for prompt: '{prompt[:50]}...'")
    start = time.time()
    
    # Load pipeline
    pipe = LTXPipeline.from_pretrained(
        MODEL_ID,
        torch_dtype=torch.bfloat16,
        cache_dir=f"{CACHE_DIR}/hub",
    )
    pipe.to("cuda")
    pipe.enable_model_cpu_offload()
    
    load_time = time.time() - start
    print(f"Pipeline loaded in {load_time:.1f}s")
    
    # Generate
    gen_start = time.time()
    with torch.inference_mode():
        output = pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            num_frames=num_frames,
            width=width,
            height=height,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            generator=torch.Generator("cuda").manual_seed(42),
        )
    
    frames = output.frames[0]
    generation_time = time.time() - gen_start
    
    # Export
    video_path = "/tmp/output.mp4"
    export_to_video(frames, video_path, fps=fps)
    
    with open(video_path, "rb") as f:
        video_bytes = f.read()
    
    total_time = time.time() - start
    print(f"Total time: {total_time:.1f}s (load: {load_time:.1f}s, gen: {generation_time:.1f}s)")
    
    return {
        "video": base64.b64encode(video_bytes).decode("utf-8"),
        "num_frames": len(frames),
        "duration_seconds": len(frames) / fps,
        "generation_time_seconds": generation_time,
        "total_time_seconds": total_time,
        "width": width,
        "height": height,
        "fps": fps,
    }


@app.local_entrypoint()
def main(
    prompt: str = "A serene mountain landscape with flowing water and morning mist",
    output: str = "output_video.mp4",
    num_frames: int = 49,
    width: int = 768,
    height: int = 512,
    steps: int = 50,
):
    """CLI entrypoint for testing."""
    print(f"\n🎬 Generating video...")
    print(f"   Prompt: {prompt}")
    print(f"   Frames: {num_frames} ({num_frames/24:.1f}s at 24fps)")
    print(f"   Resolution: {width}x{height}")
    print(f"   Steps: {steps}\n")
    
    generator = LTXVideoGenerator()
    result = generator.generate.remote(
        prompt=prompt,
        num_frames=num_frames,
        width=width,
        height=height,
        num_inference_steps=steps,
    )
    
    # Save video
    video_bytes = base64.b64decode(result["video"])
    with open(output, "wb") as f:
        f.write(video_bytes)
    
    print(f"\n✅ Video saved: {output}")
    print(f"   Duration: {result['duration_seconds']:.1f}s")
    print(f"   Generation time: {result['generation_time_seconds']:.1f}s")
