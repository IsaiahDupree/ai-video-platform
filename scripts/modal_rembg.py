"""
Modal deployment for background removal using rembg.
Deploy with: modal deploy scripts/modal_rembg.py
Run locally: modal run scripts/modal_rembg.py
"""

import modal

# Define the Modal app
app = modal.App("rembg-background-removal")

# Define the container image with rembg installed
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "rembg[cpu]",
        "pillow",
        "fastapi",
    )
)

@app.function(
    image=image,
    cpu=4,
    memory=8192,
    timeout=600,
)
def remove_background(image_bytes: bytes) -> bytes:
    """Remove background from an image and return transparent PNG."""
    from rembg import remove
    from PIL import Image
    import io
    
    # Load image from bytes
    input_image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    
    # Remove background
    output_image = remove(input_image)
    
    # Convert back to bytes
    output_buffer = io.BytesIO()
    output_image.save(output_buffer, format="PNG")
    return output_buffer.getvalue()


@app.function(
    image=image,
    cpu=4,
    memory=8192,
    timeout=600,
)
def remove_background_with_outline(
    image_bytes: bytes, 
    outline_width: int = 6,
    outline_color: tuple = (255, 255, 255, 255)
) -> bytes:
    """Remove background and add sticker outline effect."""
    from rembg import remove
    from PIL import Image
    import io
    
    # Load and remove background
    input_image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    output_image = remove(input_image)
    
    # Add outline effect
    new_size = (output_image.width + outline_width * 2, output_image.height + outline_width * 2)
    result = Image.new('RGBA', new_size, (0, 0, 0, 0))
    
    alpha = output_image.split()[3]
    
    for dx in range(-outline_width, outline_width + 1):
        for dy in range(-outline_width, outline_width + 1):
            if dx * dx + dy * dy <= outline_width * outline_width:
                outline_layer = Image.new('RGBA', new_size, outline_color)
                mask = Image.new('L', new_size, 0)
                mask.paste(alpha, (outline_width + dx, outline_width + dy))
                result = Image.composite(outline_layer, result, mask)
    
    result.paste(output_image, (outline_width, outline_width), output_image)
    
    # Convert to bytes
    output_buffer = io.BytesIO()
    result.save(output_buffer, format="PNG")
    return output_buffer.getvalue()


@app.local_entrypoint()
def main(image_path: str = ""):
    """Test the background removal locally.
    
    Usage: modal run scripts/modal_rembg.py --image-path photo.jpg
    """
    if not image_path:
        print("Usage: modal run scripts/modal_rembg.py --image-path <path>")
        print("\nExample:")
        print("  modal run scripts/modal_rembg.py --image-path photo.jpg")
        return
    
    print(f"Processing: {image_path}")
    
    with open(image_path, "rb") as f:
        image_bytes = f.read()
    
    # Call the Modal function
    result_bytes = remove_background_with_outline.remote(image_bytes)
    
    # Save result
    output_path = image_path.rsplit(".", 1)[0] + "_sticker.png"
    with open(output_path, "wb") as f:
        f.write(result_bytes)
    
    print(f"✅ Saved: {output_path}")


# Web endpoint for API access
@app.function(
    image=image,
    cpu=4,
    memory=8192,
    timeout=600,
)
@modal.fastapi_endpoint(method="POST")
async def api_remove_background(request: dict) -> dict:
    """Web API endpoint for background removal.
    
    POST body: {"image": "<base64_encoded_image>", "outline": true}
    Returns: {"image": "<base64_encoded_png>"}
    """
    import base64
    from rembg import remove
    from PIL import Image
    import io
    
    image_b64 = request.get("image", "")
    add_outline = request.get("outline", False)
    
    # Decode input
    image_bytes = base64.b64decode(image_b64)
    input_image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    
    # Remove background
    output_image = remove(input_image)
    
    # Optional outline
    if add_outline:
        outline_width = 6
        new_size = (output_image.width + outline_width * 2, output_image.height + outline_width * 2)
        result = Image.new('RGBA', new_size, (0, 0, 0, 0))
        alpha = output_image.split()[3]
        
        for dx in range(-outline_width, outline_width + 1):
            for dy in range(-outline_width, outline_width + 1):
                if dx * dx + dy * dy <= outline_width * outline_width:
                    outline_layer = Image.new('RGBA', new_size, (255, 255, 255, 255))
                    mask = Image.new('L', new_size, 0)
                    mask.paste(alpha, (outline_width + dx, outline_width + dy))
                    result = Image.composite(outline_layer, result, mask)
        
        result.paste(output_image, (outline_width, outline_width), output_image)
        output_image = result
    
    # Encode output
    output_buffer = io.BytesIO()
    output_image.save(output_buffer, format="PNG")
    output_b64 = base64.b64encode(output_buffer.getvalue()).decode()
    
    return {"image": output_b64}
