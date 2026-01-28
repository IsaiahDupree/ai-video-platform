"""
Modal HunyuanVideo Service - T2V-003
Deploy Tencent HunyuanVideo 13B model to Modal for high-quality text-to-video generation

HunyuanVideo is Tencent's state-of-the-art open-source video generation model with 13B parameters,
featuring a diffusion transformer architecture optimized for high-quality video synthesis with
excellent motion coherence and visual fidelity.

Model Specifications:
- Architecture: Diffusion Transformer (13B parameters)
- Output: 720p video (1280x720 or custom aspect ratios)
- Duration: 129 frames at 24fps (~5.4 seconds)
- VRAM: ~50GB for full precision, ~28GB for bf16 optimized
- Text Encoder: Multi-modal CLIP + T5 for better text understanding
- VAE: High-compression 3D VAE with 4x4x4 compression

Key Features:
- Industry-leading text-video alignment
- Excellent temporal coherence and motion quality
- Support for complex scenes and camera movements
- Multilingual support (English, Chinese)
- Fine-grained control over motion and style

Usage:
    modal deploy modal_hunyuan.py
    modal run modal_hunyuan.py --prompt "A cinematic shot of a futuristic city"

Environment variables:
    MODAL_TOKEN_ID: Modal authentication token ID
    MODAL_TOKEN_SECRET: Modal authentication secret
"""

import io
import os
from pathlib import Path
from typing import Optional

import modal

# Create Modal app
app = modal.App("hunyuan-video")

# Create volume for model weights caching
model_volume = modal.Volume.from_name("t2v-models", create_if_missing=True)

# Define image with required dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch==2.5.1",
        "torchvision==0.20.1",
        "transformers==4.46.0",
        "diffusers==0.31.0",
        "accelerate==1.1.0",
        "numpy==1.26.4",
        "pillow==10.4.0",
        "opencv-python==4.10.0.84",
        "huggingface-hub==0.26.0",
        "safetensors==0.4.5",
        "einops==0.8.0",
        "imageio==2.36.0",
        "imageio-ffmpeg==0.5.1",
        "fastapi>=0.115.0",
        "sentencepiece==0.2.0",  # For T5 tokenizer
        "protobuf==5.28.0",
        "xformers==0.0.28.post2",  # Memory-efficient attention
    )
    .apt_install(
        "ffmpeg",
        "libgl1-mesa-glx",
        "libglib2.0-0",
    )
)


@app.cls(
    image=image,
    gpu="H100",  # H100 or A100-80GB required for 50GB+ VRAM
    volumes={"/root/models": model_volume},
    timeout=2400,  # 40 minute timeout for long video generation
    scaledown_window=600,  # Keep warm for 10 minutes
)
class HunyuanVideoGenerator:
    """
    Text-to-video generation service using Tencent HunyuanVideo 13B model.

    HunyuanVideo is one of the most advanced open-source video generation models,
    producing high-quality 720p videos with exceptional text-video alignment and
    temporal coherence.

    Key Features:
    - 13B parameter Diffusion Transformer architecture
    - 720p output (1280x720) at 24fps
    - 129 frame generation (~5.4 seconds)
    - Multi-modal text encoding (CLIP + T5)
    - Excellent motion quality and scene understanding
    """

    @modal.enter()
    def setup(self):
        """Load model on container startup."""
        import torch
        from diffusers import HunyuanVideoPipeline
        from diffusers.utils import export_to_video

        print("Loading Tencent HunyuanVideo 13B model...")
        print("This may take several minutes for first load...")

        # Model cache directory
        model_dir = Path("/root/models/hunyuan")
        model_dir.mkdir(parents=True, exist_ok=True)

        # Set cache directory
        os.environ["HF_HOME"] = str(model_dir)
        os.environ["TRANSFORMERS_CACHE"] = str(model_dir)

        try:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            print(f"Using device: {self.device}")

            # Load HunyuanVideo pipeline with bf16 for memory efficiency (~28GB VRAM)
            print("Loading HunyuanVideo pipeline with bf16 optimization...")
            self.pipe = HunyuanVideoPipeline.from_pretrained(
                "tencent/HunyuanVideo",
                torch_dtype=torch.bfloat16,
                cache_dir=str(model_dir),
            )

            # Enable memory optimizations
            print("Enabling memory optimizations...")
            self.pipe.enable_model_cpu_offload()
            self.pipe.enable_vae_tiling()
            self.pipe.enable_vae_slicing()

            # Use xformers for efficient attention if available
            try:
                self.pipe.enable_xformers_memory_efficient_attention()
                print("✓ Enabled xformers memory-efficient attention")
            except Exception as e:
                print(f"xformers not available: {e}")

            # Store utility functions
            self.export_to_video = export_to_video

            print("HunyuanVideo model loaded successfully")
            print(f"Model device: {self.device}")
            print(f"Pipeline components: {list(self.pipe.components.keys())}")

        except Exception as e:
            print(f"Error loading HunyuanVideo model: {e}")
            raise

    @modal.method()
    def generate_video(
        self,
        prompt: str,
        negative_prompt: str = "blurry, low quality, distorted, watermark, static",
        num_frames: int = 129,
        height: int = 720,
        width: int = 1280,
        num_inference_steps: int = 50,
        guidance_scale: float = 6.0,
        fps: int = 24,
        seed: Optional[int] = None,
    ) -> bytes:
        """
        Generate a video from a text prompt using HunyuanVideo.

        Args:
            prompt: Text description of the video to generate (supports English and Chinese)
            negative_prompt: What to avoid in the generation
            num_frames: Number of frames to generate (default 129 = ~5.4s at 24fps)
            height: Video height in pixels (default 720 for 720p)
            width: Video width in pixels (default 1280 for 16:9 aspect)
            num_inference_steps: Number of denoising steps (50 recommended, higher = better quality)
            guidance_scale: How closely to follow the prompt (6.0 recommended, range 5-8)
            fps: Frames per second for output video (default 24)
            seed: Random seed for reproducibility

        Returns:
            Generated video as bytes (MP4 format)

        Example prompts:
            - "A cinematic aerial shot flying over a futuristic cyberpunk city at night, neon lights reflecting on wet streets"
            - "Slow motion closeup of a hummingbird drinking from a colorful flower in a garden, soft natural lighting"
            - "Time-lapse of clouds moving over mountain peaks at sunrise, golden hour lighting"
        """
        import torch
        import tempfile

        print(f"Generating video for prompt: {prompt}")
        print(f"Settings: {num_frames} frames, {width}x{height}, {num_inference_steps} steps")
        print(f"Guidance scale: {guidance_scale}, FPS: {fps}")

        # Set seed for reproducibility
        generator = None
        if seed is not None:
            generator = torch.Generator(device="cuda").manual_seed(seed)
            print(f"Using seed: {seed}")

        try:
            print("Starting video generation...")
            print("This may take 5-15 minutes depending on settings...")

            # Generate video with autocast for memory efficiency
            with torch.autocast("cuda", torch.bfloat16, cache_enabled=False):
                output = self.pipe(
                    prompt=prompt,
                    negative_prompt=negative_prompt,
                    num_frames=num_frames,
                    height=height,
                    width=width,
                    num_inference_steps=num_inference_steps,
                    guidance_scale=guidance_scale,
                    generator=generator,
                )

                frames = output.frames[0]

            print(f"Generated {len(frames)} frames")

            # Save frames as video using a temporary file
            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp_file:
                output_path = tmp_file.name

            # Export to video with high quality settings
            print(f"Exporting video at {fps} fps...")
            self.export_to_video(frames, output_path, fps=fps)

            # Read video bytes
            with open(output_path, "rb") as f:
                video_bytes = f.read()

            # Clean up
            os.unlink(output_path)

            duration = round(num_frames / fps, 2)
            print(f"Video generation complete: {len(video_bytes)} bytes")
            print(f"Duration: {duration}s ({num_frames} frames at {fps}fps)")
            return video_bytes

        except Exception as e:
            print(f"Error generating video: {e}")
            raise

    @modal.method()
    def batch_generate(
        self,
        prompts: list[str],
        negative_prompt: str = "blurry, low quality, distorted, watermark, static",
        num_frames: int = 129,
        height: int = 720,
        width: int = 1280,
        num_inference_steps: int = 50,
        guidance_scale: float = 6.0,
        fps: int = 24,
    ) -> list[bytes]:
        """
        Batch generate videos from multiple prompts.

        Args:
            prompts: List of text prompts
            negative_prompt: Shared negative prompt for all videos
            num_frames: Number of frames per video
            height: Video height
            width: Video width
            num_inference_steps: Denoising steps
            guidance_scale: Prompt adherence
            fps: Frames per second

        Returns:
            List of generated videos as bytes
        """
        print(f"Batch generating {len(prompts)} videos")
        results = []

        for i, prompt in enumerate(prompts):
            print(f"Processing prompt {i+1}/{len(prompts)}: {prompt}")
            video_bytes = self.generate_video(
                prompt=prompt,
                negative_prompt=negative_prompt,
                num_frames=num_frames,
                height=height,
                width=width,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                fps=fps,
            )
            results.append(video_bytes)

        return results


@app.function(
    image=image,
    timeout=2400,
)
@modal.fastapi_endpoint(method="POST")
def generate_video_endpoint(
    prompt: str,
    negative_prompt: str = "blurry, low quality, distorted, watermark, static",
    num_frames: int = 129,
    height: int = 720,
    width: int = 1280,
    num_inference_steps: int = 50,
    guidance_scale: float = 6.0,
    fps: int = 24,
    seed: Optional[int] = None,
):
    """
    Web endpoint for HunyuanVideo text-to-video generation.

    POST body:
    {
        "prompt": "A cinematic aerial shot of a futuristic city at night with neon lights",
        "negative_prompt": "blurry, low quality, distorted, watermark, static",
        "num_frames": 129,
        "height": 720,
        "width": 1280,
        "num_inference_steps": 50,
        "guidance_scale": 6.0,
        "fps": 24,
        "seed": 42
    }

    Returns base64-encoded MP4 video with metadata
    """
    import base64

    print(f"Web endpoint received request for prompt: {prompt}")

    # Generate video
    generator = HunyuanVideoGenerator()
    video_bytes = generator.generate_video.remote(
        prompt=prompt,
        negative_prompt=negative_prompt,
        num_frames=num_frames,
        height=height,
        width=width,
        num_inference_steps=num_inference_steps,
        guidance_scale=guidance_scale,
        fps=fps,
        seed=seed,
    )

    # Return video with metadata
    return {
        "video": base64.b64encode(video_bytes).decode(),
        "format": "mp4",
        "model": "tencent/HunyuanVideo",
        "num_frames": num_frames,
        "fps": fps,
        "height": height,
        "width": width,
        "duration_seconds": round(num_frames / fps, 2),
    }


@app.local_entrypoint()
def main(
    prompt: str = "A cinematic drone shot flying through a dense bamboo forest, sunlight filtering through leaves, camera moving forward smoothly",
    negative_prompt: str = "blurry, low quality, distorted, watermark, static, jumpy motion",
    num_frames: int = 129,
    height: int = 720,
    width: int = 1280,
    num_inference_steps: int = 50,
    guidance_scale: float = 6.0,
    fps: int = 24,
    seed: int = 42,
    output: str = "hunyuan_output.mp4",
):
    """
    Test the HunyuanVideo service locally.

    Usage:
        modal run modal_hunyuan.py --prompt "A serene lake at sunset"
        modal run modal_hunyuan.py --prompt "City traffic timelapse" --num-frames 97 --fps 24
        modal run modal_hunyuan.py --prompt "Underwater coral reef" --width 1920 --height 1080
    """
    print("=" * 80)
    print("HunyuanVideo 13B - High-Quality Text-to-Video Generation")
    print("=" * 80)
    print(f"Prompt: {prompt}")
    print(f"Negative: {negative_prompt}")
    print(f"Settings: {num_frames} frames @ {fps}fps, {width}x{height}")
    print(f"Steps: {num_inference_steps}, Guidance: {guidance_scale}")
    print(f"Seed: {seed}")
    print("=" * 80)

    # Generate video
    generator = HunyuanVideoGenerator()
    video_bytes = generator.generate_video.remote(
        prompt=prompt,
        negative_prompt=negative_prompt,
        num_frames=num_frames,
        height=height,
        width=width,
        num_inference_steps=num_inference_steps,
        guidance_scale=guidance_scale,
        fps=fps,
        seed=seed,
    )

    # Save output
    with open(output, "wb") as f:
        f.write(video_bytes)

    duration = round(num_frames / fps, 2)
    print("=" * 80)
    print(f"✓ Video saved to: {output}")
    print(f"✓ Size: {len(video_bytes):,} bytes ({len(video_bytes) / 1024 / 1024:.2f} MB)")
    print(f"✓ Duration: {duration}s ({num_frames} frames)")
    print(f"✓ Resolution: {width}x{height} @ {fps}fps")
    print("=" * 80)
