"""
Modal Mochi Service - T2V-002
Deploy Genmo Mochi 10B model to Modal for high-quality text-to-video generation

Mochi is a state-of-the-art open-source video generation model with 10B parameters,
featuring an asymmetric diffusion transformer architecture that produces high-quality
480p videos at 30fps.

Model Specifications:
- Architecture: AsymmDiT (10B parameters, 48 layers, 24 attention heads)
- Output: 480p video (480x848 or custom aspect ratios)
- Duration: 31-84 frames at 30fps
- VRAM: ~42GB for standard, ~22GB for bf16 optimized
- VAE: 362M parameter AsymmVAE with 8x8 spatial and 6x temporal compression

Usage:
    modal deploy modal_mochi.py
    modal run modal_mochi.py --prompt "A cinematic shot of a sunset"

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
app = modal.App("mochi-video")

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
    )
    .apt_install(
        "ffmpeg",
        "libgl1-mesa-glx",
        "libglib2.0-0",
    )
)


@app.cls(
    image=image,
    gpu="H100",  # H100 recommended for 42GB VRAM, A100-80GB also works
    volumes={"/root/models": model_volume},
    timeout=1800,  # 30 minute timeout for video generation
    scaledown_window=600,  # Keep warm for 10 minutes
)
class MochiVideoGenerator:
    """
    Text-to-video generation service using Genmo Mochi 10B model.

    Mochi is a state-of-the-art open-source video generation model that produces
    high-quality 480p videos with excellent motion coherence and photorealistic output.

    Key Features:
    - 10B parameter AsymmDiT architecture
    - 480p output at 30fps
    - 31-84 frame generation (1-2.8 seconds)
    - Asymmetric attention mechanism for visual/text processing
    """

    @modal.enter()
    def setup(self):
        """Load model on container startup."""
        import torch
        from diffusers import MochiPipeline
        from diffusers.utils import export_to_video

        print("Loading Genmo Mochi 10B model...")
        print("This may take several minutes for first load...")

        # Model cache directory
        model_dir = Path("/root/models/mochi")
        model_dir.mkdir(parents=True, exist_ok=True)

        # Set cache directory
        os.environ["HF_HOME"] = str(model_dir)
        os.environ["TRANSFORMERS_CACHE"] = str(model_dir)

        try:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            print(f"Using device: {self.device}")

            # Load Mochi pipeline with bfloat16 for memory efficiency (22GB VRAM)
            print("Loading Mochi pipeline with bf16 optimization...")
            self.pipe = MochiPipeline.from_pretrained(
                "genmo/mochi-1-preview",
                variant="bf16",
                torch_dtype=torch.bfloat16,
                cache_dir=str(model_dir),
            )

            # Enable memory optimizations
            print("Enabling memory optimizations...")
            self.pipe.enable_model_cpu_offload()
            self.pipe.enable_vae_tiling()

            # Store utility functions
            self.export_to_video = export_to_video

            print("Mochi model loaded successfully")
            print(f"Model device: {self.device}")
            print(f"Pipeline components: {list(self.pipe.components.keys())}")

        except Exception as e:
            print(f"Error loading Mochi model: {e}")
            raise

    @modal.method()
    def generate_video(
        self,
        prompt: str,
        negative_prompt: str = "",
        num_frames: int = 31,
        height: int = 480,
        width: int = 848,
        num_inference_steps: int = 64,
        guidance_scale: float = 4.5,
        fps: int = 30,
        seed: Optional[int] = None,
    ) -> bytes:
        """
        Generate a video from a text prompt using Mochi.

        Args:
            prompt: Text description of the video to generate
            negative_prompt: What to avoid in the generation
            num_frames: Number of frames to generate (31-84, default 31 = ~1 second at 30fps)
            height: Video height in pixels (default 480 for 480p)
            width: Video width in pixels (default 848 for 16:9 aspect)
            num_inference_steps: Number of denoising steps (64 recommended, higher = better quality)
            guidance_scale: How closely to follow the prompt (4.5 recommended)
            fps: Frames per second for output video (default 30)
            seed: Random seed for reproducibility

        Returns:
            Generated video as bytes (MP4 format)
        """
        import torch
        import tempfile

        print(f"Generating video for prompt: {prompt}")
        print(f"Settings: {num_frames} frames, {width}x{height}, {num_inference_steps} steps")
        print(f"Guidance scale: {guidance_scale}, FPS: {fps}")

        # Validate frame count
        if num_frames < 31 or num_frames > 84:
            print(f"Warning: num_frames {num_frames} outside recommended range [31, 84]")

        # Set seed for reproducibility
        generator = None
        if seed is not None:
            generator = torch.Generator(device="cuda").manual_seed(seed)
            print(f"Using seed: {seed}")

        try:
            print("Starting video generation...")

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

            # Export to video
            print(f"Exporting video at {fps} fps...")
            self.export_to_video(frames, output_path, fps=fps)

            # Read video bytes
            with open(output_path, "rb") as f:
                video_bytes = f.read()

            # Clean up
            os.unlink(output_path)

            print(f"Video generation complete: {len(video_bytes)} bytes")
            return video_bytes

        except Exception as e:
            print(f"Error generating video: {e}")
            raise

    @modal.method()
    def batch_generate(
        self,
        prompts: list[str],
        negative_prompt: str = "",
        num_frames: int = 31,
        height: int = 480,
        width: int = 848,
        num_inference_steps: int = 64,
        guidance_scale: float = 4.5,
        fps: int = 30,
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
    timeout=1800,
)
@modal.fastapi_endpoint(method="POST")
def generate_video_endpoint(
    prompt: str,
    negative_prompt: str = "",
    num_frames: int = 31,
    height: int = 480,
    width: int = 848,
    num_inference_steps: int = 64,
    guidance_scale: float = 4.5,
    fps: int = 30,
    seed: Optional[int] = None,
):
    """
    Web endpoint for Mochi text-to-video generation.

    POST body:
    {
        "prompt": "A cinematic shot of waves crashing on a beach at sunset",
        "negative_prompt": "blurry, low quality, distorted, watermark",
        "num_frames": 31,
        "height": 480,
        "width": 848,
        "num_inference_steps": 64,
        "guidance_scale": 4.5,
        "fps": 30,
        "seed": 42
    }

    Returns base64-encoded MP4 video with metadata
    """
    import base64

    print(f"Web endpoint received request for prompt: {prompt}")

    # Generate video
    generator = MochiVideoGenerator()
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
        "model": "genmo/mochi-1-preview",
        "num_frames": num_frames,
        "fps": fps,
        "height": height,
        "width": width,
        "duration_seconds": round(num_frames / fps, 2),
    }


@app.local_entrypoint()
def main(
    prompt: str = "A cinematic shot of ocean waves crashing against rocky cliffs at golden hour, spray illuminated by warm sunset light, slow motion",
    negative_prompt: str = "blurry, low quality, distorted, watermark, text, poor lighting",
    num_frames: int = 31,
    height: int = 480,
    width: int = 848,
    num_inference_steps: int = 64,
    guidance_scale: float = 4.5,
    fps: int = 30,
    seed: int = 42,
    output: str = "mochi_output.mp4",
):
    """
    Test the Mochi service locally.

    Usage:
        modal run modal_mochi.py --prompt "A dog running through a field"
        modal run modal_mochi.py --prompt "Timelapse of clouds" --num-frames 63 --fps 30
        modal run modal_mochi.py --prompt "City street at night" --width 480 --height 848
    """
    print("=" * 80)
    print("Mochi Video Generation")
    print("=" * 80)
    print(f"Prompt: {prompt}")
    print(f"Negative: {negative_prompt}")
    print(f"Settings: {num_frames} frames @ {fps}fps, {width}x{height}")
    print(f"Steps: {num_inference_steps}, Guidance: {guidance_scale}")
    print(f"Seed: {seed}")
    print("=" * 80)

    # Generate video
    generator = MochiVideoGenerator()
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
