"""
Modal deployment for Hugging Face models.
Loads models on-demand and scales to zero when not in use.

Deploy: modal deploy scripts/modal_hf_model.py
Run:    modal run scripts/modal_hf_model.py --model-id "facebook/sam-vit-base" --task "image-segmentation"

Supported tasks:
- text-generation
- image-to-text
- image-segmentation
- text-to-image
- automatic-speech-recognition
- text-to-speech
"""

import modal

app = modal.App("hf-model-server")

# Base image with transformers and common dependencies
base_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "transformers>=4.36.0",
        "torch>=2.1.0",
        "accelerate",
        "pillow",
        "numpy",
        "scipy",
        "sentencepiece",
        "protobuf",
        "safetensors",
        "fastapi",
    )
)

# GPU image for heavy models
gpu_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "transformers>=4.36.0",
        "torch>=2.1.0",
        "accelerate",
        "pillow",
        "numpy",
        "scipy",
        "sentencepiece",
        "protobuf",
        "safetensors",
        "diffusers",
        "xformers",
        "fastapi",
    )
)

# Volume for caching models (persists between runs)
model_cache = modal.Volume.from_name("hf-model-cache", create_if_missing=True)


@app.function(
    image=base_image,
    volumes={"/cache": model_cache},
    cpu=4,
    memory=16384,
    timeout=600,
    container_idle_timeout=300,  # Scale to zero after 5 min idle
)
def run_pipeline(
    model_id: str,
    task: str,
    inputs: dict,
) -> dict:
    """Run a Hugging Face pipeline with the specified model."""
    import os
    os.environ["HF_HOME"] = "/cache"
    os.environ["TRANSFORMERS_CACHE"] = "/cache"
    
    from transformers import pipeline
    import base64
    from io import BytesIO
    from PIL import Image
    
    print(f"Loading model: {model_id} for task: {task}")
    
    # Handle image inputs
    if "image" in inputs and isinstance(inputs["image"], str):
        if inputs["image"].startswith("data:"):
            # Base64 data URI
            header, data = inputs["image"].split(",", 1)
            img_bytes = base64.b64decode(data)
            inputs["image"] = Image.open(BytesIO(img_bytes))
        elif inputs["image"].startswith("base64:"):
            img_bytes = base64.b64decode(inputs["image"][7:])
            inputs["image"] = Image.open(BytesIO(img_bytes))
    
    # Load and run pipeline
    pipe = pipeline(task, model=model_id, device=-1)  # CPU
    result = pipe(**inputs)
    
    # Serialize output
    if isinstance(result, list):
        return {"results": [_serialize(r) for r in result]}
    return {"result": _serialize(result)}


def _serialize(obj):
    """Convert pipeline output to JSON-serializable format."""
    import base64
    from io import BytesIO
    from PIL import Image
    import numpy as np
    
    if isinstance(obj, dict):
        return {k: _serialize(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_serialize(item) for item in obj]
    elif isinstance(obj, Image.Image):
        buf = BytesIO()
        obj.save(buf, format="PNG")
        return {"type": "image", "data": base64.b64encode(buf.getvalue()).decode()}
    elif isinstance(obj, np.ndarray):
        return {"type": "array", "shape": obj.shape, "data": obj.tolist()}
    elif hasattr(obj, "tolist"):
        return obj.tolist()
    else:
        return obj


@app.function(
    image=gpu_image,
    volumes={"/cache": model_cache},
    gpu="T4",
    memory=16384,
    timeout=600,
    container_idle_timeout=300,
)
def run_pipeline_gpu(
    model_id: str,
    task: str,
    inputs: dict,
) -> dict:
    """Run a Hugging Face pipeline on GPU."""
    import os
    os.environ["HF_HOME"] = "/cache"
    os.environ["TRANSFORMERS_CACHE"] = "/cache"
    
    from transformers import pipeline
    import torch
    import base64
    from io import BytesIO
    from PIL import Image
    
    print(f"Loading model (GPU): {model_id} for task: {task}")
    
    # Handle image inputs
    if "image" in inputs and isinstance(inputs["image"], str):
        if inputs["image"].startswith("data:"):
            header, data = inputs["image"].split(",", 1)
            img_bytes = base64.b64decode(data)
            inputs["image"] = Image.open(BytesIO(img_bytes))
        elif inputs["image"].startswith("base64:"):
            img_bytes = base64.b64decode(inputs["image"][7:])
            inputs["image"] = Image.open(BytesIO(img_bytes))
    
    # Load and run pipeline on GPU
    device = 0 if torch.cuda.is_available() else -1
    pipe = pipeline(task, model=model_id, device=device)
    result = pipe(**inputs)
    
    if isinstance(result, list):
        return {"results": [_serialize(r) for r in result]}
    return {"result": _serialize(result)}


@app.function(
    image=gpu_image,
    volumes={"/cache": model_cache},
    gpu="T4",
    memory=16384,
    timeout=600,
    container_idle_timeout=300,
)
def generate_image(
    prompt: str,
    model_id: str = "stabilityai/stable-diffusion-xl-base-1.0",
    width: int = 1024,
    height: int = 1024,
    num_inference_steps: int = 30,
) -> bytes:
    """Generate an image using Stable Diffusion."""
    import os
    os.environ["HF_HOME"] = "/cache"
    
    from diffusers import DiffusionPipeline
    import torch
    from io import BytesIO
    
    print(f"Loading Stable Diffusion: {model_id}")
    
    pipe = DiffusionPipeline.from_pretrained(
        model_id,
        torch_dtype=torch.float16,
        cache_dir="/cache",
    )
    pipe = pipe.to("cuda")
    
    image = pipe(
        prompt,
        width=width,
        height=height,
        num_inference_steps=num_inference_steps,
    ).images[0]
    
    buf = BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()


@app.function(
    image=base_image,
    volumes={"/cache": model_cache},
    cpu=2,
    memory=8192,
    timeout=300,
)
def transcribe_audio(
    audio_bytes: bytes,
    model_id: str = "openai/whisper-base",
) -> dict:
    """Transcribe audio using Whisper."""
    import os
    os.environ["HF_HOME"] = "/cache"
    
    from transformers import pipeline
    import tempfile
    
    # Save audio to temp file
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(audio_bytes)
        audio_path = f.name
    
    pipe = pipeline("automatic-speech-recognition", model=model_id)
    result = pipe(audio_path, return_timestamps=True)
    
    os.unlink(audio_path)
    return result


@app.function(
    image=gpu_image,
    volumes={"/cache": model_cache},
    gpu="T4",
    memory=16384,
    timeout=600,
    container_idle_timeout=300,
)
def segment_image(
    image_bytes: bytes,
    model_id: str = "facebook/sam-vit-base",
    points: list = None,
) -> bytes:
    """Segment an image using SAM."""
    import os
    os.environ["HF_HOME"] = "/cache"
    
    from transformers import SamModel, SamProcessor
    from PIL import Image
    from io import BytesIO
    import torch
    import numpy as np
    
    print(f"Loading SAM: {model_id}")
    
    # Load image
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    
    # Load model
    processor = SamProcessor.from_pretrained(model_id, cache_dir="/cache")
    model = SamModel.from_pretrained(model_id, cache_dir="/cache").to("cuda")
    
    # Default to center point if none provided
    if points is None:
        points = [[[image.width // 2, image.height // 2]]]
    
    # Process
    inputs = processor(image, input_points=points, return_tensors="pt").to("cuda")
    
    with torch.no_grad():
        outputs = model(**inputs)
    
    # Get mask
    masks = processor.image_processor.post_process_masks(
        outputs.pred_masks.cpu(),
        inputs["original_sizes"].cpu(),
        inputs["reshaped_input_sizes"].cpu(),
    )
    
    # Apply mask to create transparent PNG
    mask = masks[0][0][0].numpy()  # Get first mask
    mask = (mask > 0.5).astype(np.uint8) * 255
    
    # Create RGBA image
    rgba = Image.new("RGBA", image.size)
    rgba.paste(image, mask=Image.fromarray(mask))
    
    buf = BytesIO()
    rgba.save(buf, format="PNG")
    return buf.getvalue()


@app.local_entrypoint()
def main(
    model_id: str = "facebook/sam-vit-base",
    task: str = "image-segmentation",
    use_gpu: bool = False,
):
    """Test the HF model deployment."""
    print(f"Testing model: {model_id}")
    print(f"Task: {task}")
    print(f"GPU: {use_gpu}")
    
    if task == "text-generation":
        inputs = {"text_inputs": "Hello, I am a"}
        if use_gpu:
            result = run_pipeline_gpu.remote(model_id, task, inputs)
        else:
            result = run_pipeline.remote(model_id, task, inputs)
        print(f"Result: {result}")
    else:
        print("Use specific functions for image/audio tasks")
        print("  - segment_image.remote(image_bytes)")
        print("  - transcribe_audio.remote(audio_bytes)")
        print("  - generate_image.remote(prompt)")


# Web API endpoints
@app.function(image=base_image, cpu=1, memory=1024, timeout=60)
@modal.fastapi_endpoint(method="GET")
async def health() -> dict:
    """Health check endpoint."""
    return {"status": "ok", "app": "hf-model-server"}


@app.function(
    image=gpu_image,
    volumes={"/cache": model_cache},
    gpu="T4",
    memory=16384,
    timeout=600,
    container_idle_timeout=300,
)
@modal.fastapi_endpoint(method="POST")
async def api_segment(request: dict) -> dict:
    """API endpoint for image segmentation."""
    import base64
    
    image_b64 = request.get("image", "")
    model_id = request.get("model_id", "facebook/sam-vit-base")
    points = request.get("points", None)
    
    image_bytes = base64.b64decode(image_b64)
    result_bytes = segment_image.local(image_bytes, model_id, points)
    
    return {"image": base64.b64encode(result_bytes).decode()}
