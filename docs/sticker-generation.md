# Sticker Generation (IMG-003)

## Overview

The sticker generation feature uses AI-powered background removal to create transparent PNG stickers from images. These stickers can be overlaid on video scenes, compositions, and other visual content.

## Installation

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

This will install:
- `rembg` - Background removal library using U²-Net models
- `pillow` - Image processing library

## Usage

### Single Image

Remove background from a single image:

```bash
npm run generate-stickers input.jpg output.png
```

Or directly with Python:

```bash
python scripts/generate-stickers.py input.jpg output.png
```

### Batch Processing

Process all images in a directory:

```bash
python scripts/generate-stickers.py --batch input_dir/ output_dir/
```

### Advanced Options

#### Choose a Different Model

```bash
python scripts/generate-stickers.py input.jpg output.png --model u2net_human_seg
```

Available models:
- `u2net` - General purpose, best for most cases (default)
- `u2netp` - Lightweight version, faster but less accurate
- `u2net_human_seg` - Optimized for human subjects
- `u2net_cloth_seg` - Optimized for clothing
- `silueta` - Fast model for simple cases

#### Enable Alpha Matting

For better edge quality, especially with hair and fine details:

```bash
python scripts/generate-stickers.py input.jpg output.png --alpha-matting
```

Fine-tune alpha matting parameters:

```bash
python scripts/generate-stickers.py input.jpg output.png \
  --alpha-matting \
  --foreground-threshold 240 \
  --background-threshold 10 \
  --erode-size 10
```

## Examples

### Create Character Stickers

```bash
# Process a character image
python scripts/generate-stickers.py \
  public/assets/characters/hero.jpg \
  public/assets/stickers/hero.png \
  --model u2net_human_seg \
  --alpha-matting
```

### Batch Process Product Images

```bash
# Remove backgrounds from all product photos
python scripts/generate-stickers.py \
  --batch raw_images/ public/assets/stickers/ \
  --model u2net
```

### Create Logo Stickers

```bash
# Process logo with fine edges
python scripts/generate-stickers.py \
  logo.png \
  public/assets/stickers/logo-transparent.png \
  --alpha-matting \
  --foreground-threshold 250
```

## Output

All output files are saved as PNG with transparency (alpha channel). The output directory structure is:

```
public/assets/stickers/
├── character1.png
├── character2.png
├── logo.png
└── product.png
```

## Integration with Remotion

Use generated stickers in Remotion compositions:

```tsx
import { Img } from 'remotion';

export const MyComposition = () => {
  return (
    <div>
      {/* Background */}
      <Img src="/assets/scenes/background.jpg" />

      {/* Overlay sticker */}
      <Img
        src="/assets/stickers/character.png"
        style={{
          position: 'absolute',
          width: 200,
          height: 200,
          top: 100,
          left: 100,
        }}
      />
    </div>
  );
};
```

## Model Selection Guide

| Use Case | Recommended Model | Notes |
|----------|------------------|-------|
| General images | `u2net` | Best balance of quality and speed |
| People/portraits | `u2net_human_seg` | Optimized for human segmentation |
| Clothing/fashion | `u2net_cloth_seg` | Better at detecting fabric boundaries |
| Simple objects | `u2netp` or `silueta` | Faster processing |
| Fine details (hair, fur) | `u2net` + `--alpha-matting` | Best edge quality |

## Troubleshooting

### Import Error

If you get `ImportError: No module named 'rembg'`:

```bash
pip install -r requirements.txt
```

### Out of Memory

For large images or batch processing:

1. Process images one at a time
2. Use `u2netp` model (smaller, faster)
3. Resize input images before processing

### Poor Edge Quality

Enable alpha matting:

```bash
python scripts/generate-stickers.py input.jpg output.png --alpha-matting
```

Adjust thresholds for better results:
- Increase `--foreground-threshold` for cleaner foregrounds
- Decrease `--background-threshold` for more aggressive removal

## Performance

Model download (first run only):
- `u2net`: ~176MB
- `u2netp`: ~4.7MB
- `u2net_human_seg`: ~176MB

Processing time (approximate, 1024x1024 image):
- `u2net`: 2-4 seconds
- `u2netp`: 1-2 seconds
- With alpha matting: +1-2 seconds

Models are cached after first download.

## API Reference

### remove_background()

```python
def remove_background(
    input_path: str,
    output_path: str,
    model_name: str = "u2net",
    alpha_matting: bool = False,
    alpha_matting_foreground_threshold: int = 240,
    alpha_matting_background_threshold: int = 10,
    alpha_matting_erode_size: int = 10,
) -> bool
```

### batch_remove_background()

```python
def batch_remove_background(
    input_dir: str,
    output_dir: str,
    model_name: str = "u2net",
    alpha_matting: bool = False,
    extensions: tuple = (".png", ".jpg", ".jpeg", ".webp"),
) -> dict
```

Returns:
```python
{
    "success": int,  # Number of successful conversions
    "failed": int,   # Number of failed conversions
    "files": list    # List of output file paths
}
```

## Related Features

- **IMG-001**: DALL-E Image Generation - Generate images for sticker source
- **IMG-002**: Character Consistency - Create consistent character images
- **IMG-004**: Scene Image Library - Organize generated stickers

## Future Enhancements

- [ ] Web UI for sticker generation
- [ ] Integration with DALL-E for source images
- [ ] Automatic sticker library organization
- [ ] Preview before/after in CLI
- [ ] GPU acceleration for faster processing
- [ ] Support for video frame extraction
