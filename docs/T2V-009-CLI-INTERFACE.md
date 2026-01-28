# T2V-009: T2V CLI Interface

Command-line interface for text-to-video generation using the unified T2V API Router.

## Overview

The T2V CLI provides a user-friendly command-line interface for generating videos using any of the supported text-to-video models. It leverages the T2V API Router (T2V-006) to provide a consistent interface across all models with automatic model selection capabilities.

## Features

- **Unified Interface**: Single command for all T2V models
- **Auto Model Selection**: Automatically choose best model based on quality/speed requirements
- **Model-Specific Options**: Direct control over specific models when needed
- **Progress Feedback**: Clear status updates and error messages
- **Comprehensive Help**: Built-in documentation and examples
- **Flexible Output**: Custom output paths and file naming

## Installation

The CLI is part of the project and doesn't require separate installation. Ensure dependencies are installed:

```bash
npm install
```

## Basic Usage

### Generate with Default Settings

```bash
npx tsx scripts/generate-t2v.ts --prompt "A cat playing piano in a cozy room"
```

This will:
- Auto-select the best available model
- Use model-specific defaults
- Save to `output/video_<timestamp>.mp4`

### Use Specific Model

```bash
npx tsx scripts/generate-t2v.ts --prompt "Sunset over mountains" --model ltx-video
```

Available models: `ltx-video`, `mochi`, `hunyuan`, `wan`, `avatar`

### Auto-Select by Quality

```bash
npx tsx scripts/generate-t2v.ts --prompt "City at night" --quality excellent
```

Quality levels: `standard`, `high`, `excellent`

### Auto-Select by Speed

```bash
npx tsx scripts/generate-t2v.ts --prompt "Dog running on beach" --speed fast
```

Speed levels: `fast`, `medium`, `slow`

## Command-Line Options

### Required Options

| Option | Description |
|--------|-------------|
| `--prompt <text>` | Text description of the video to generate |

### Model Selection (Mutually Exclusive)

| Option | Description |
|--------|-------------|
| `--model <name>` | Use specific model (ltx-video, mochi, hunyuan, wan) |
| `--quality <level>` | Auto-select by quality (standard, high, excellent) |
| `--speed <level>` | Auto-select by speed (fast, medium, slow) |

### Video Settings

| Option | Default | Description |
|--------|---------|-------------|
| `--frames <number>` | Model-specific | Number of frames to generate |
| `--width <pixels>` | Model-specific | Video width in pixels |
| `--height <pixels>` | Model-specific | Video height in pixels |
| `--fps <number>` | Model-specific | Frames per second |
| `--seed <number>` | Random | Random seed for reproducibility |

### Generation Settings

| Option | Default | Description |
|--------|---------|-------------|
| `--steps <number>` | 50 | Number of inference steps |
| `--guidance <float>` | Model-specific | Guidance scale (prompt adherence) |
| `--negative <text>` | "" | Negative prompt (what to avoid) |

### Output Settings

| Option | Default | Description |
|--------|---------|-------------|
| `--output <path>` | `output/video_<timestamp>.mp4` | Output file path |

### Utility Options

| Option | Description |
|--------|-------------|
| `--list-models` | List available models and their capabilities |
| `--help` | Show help message and examples |

## Examples

### Basic Examples

```bash
# Simple generation
npx tsx scripts/generate-t2v.ts --prompt "A sunrise over the ocean"

# With negative prompt
npx tsx scripts/generate-t2v.ts \
  --prompt "A cat playing piano" \
  --negative "blurry, low quality, distorted"

# Custom output path
npx tsx scripts/generate-t2v.ts \
  --prompt "City at night" \
  --output ./my-videos/city.mp4
```

### Model-Specific Examples

```bash
# Use fast LTX-Video for quick preview
npx tsx scripts/generate-t2v.ts \
  --prompt "Mountain landscape" \
  --model ltx-video

# Use high-quality Mochi
npx tsx scripts/generate-t2v.ts \
  --prompt "Ocean waves" \
  --model mochi

# Use HunyuanVideo for best quality
npx tsx scripts/generate-t2v.ts \
  --prompt "Futuristic city" \
  --model hunyuan
```

### Custom Settings Examples

```bash
# Longer video with more frames
npx tsx scripts/generate-t2v.ts \
  --prompt "Dog running on beach" \
  --frames 48 \
  --fps 12

# Custom resolution
npx tsx scripts/generate-t2v.ts \
  --prompt "Portrait video" \
  --width 768 \
  --height 1024 \
  --model ltx-video

# Reproducible generation
npx tsx scripts/generate-t2v.ts \
  --prompt "Abstract art" \
  --seed 42 \
  --steps 100
```

### Auto-Selection Examples

```bash
# Prioritize quality
npx tsx scripts/generate-t2v.ts \
  --prompt "Professional product video" \
  --quality excellent

# Prioritize speed
npx tsx scripts/generate-t2v.ts \
  --prompt "Quick animation test" \
  --speed fast

# Balance quality and custom settings
npx tsx scripts/generate-t2v.ts \
  --prompt "Marketing video" \
  --quality high \
  --frames 60 \
  --fps 30
```

## Model Selection Logic

### Manual Selection

When using `--model`, the specified model is used directly:

```bash
npx tsx scripts/generate-t2v.ts --prompt "..." --model ltx-video
```

### Automatic Selection

When using `--quality` or `--speed`, the CLI selects the best available model:

1. **Quality Priority**: Selects model matching quality level
   - `excellent` → hunyuan or wan
   - `high` → mochi
   - `standard` → ltx-video

2. **Speed Priority**: Selects fastest model
   - `fast` → ltx-video
   - `medium` → mochi or avatar
   - `slow` → hunyuan or wan

3. **Fallback**: Uses first available model if no match

## List Available Models

View all models and their configuration status:

```bash
npx tsx scripts/generate-t2v.ts --list-models
```

Output example:
```
📹 Available T2V Models

================================================================================

✅ Available: LTX-Video (ltx-video)
  Fast, lightweight text-to-video model
  Default: 512x512, 24 frames @ 8fps
  Quality: standard | Speed: fast
  Features: fast-generation, low-vram

❌ Not configured: Genmo Mochi (mochi)
  10B parameter model for high-quality 480p video
  Default: 848x480, 31 frames @ 30fps
  Quality: high | Speed: medium
  Features: photorealistic, motion-coherence
  To enable: Set MODAL_MOCHI_URL environment variable

...
```

## Environment Variables

Configure model endpoints before use:

```bash
export MODAL_LTX_VIDEO_URL="https://your-workspace--ltx-video-generate-video-endpoint.modal.run"
export MODAL_MOCHI_URL="https://your-workspace--mochi-generate-video-endpoint.modal.run"
export MODAL_HUNYUAN_URL="https://your-workspace--hunyuan-generate-video-endpoint.modal.run"
export MODAL_WAN_URL="https://your-workspace--wan-generate-video-endpoint.modal.run"
export MODAL_AVATAR_URL="https://your-workspace--avatar-generate-video-endpoint.modal.run"
```

## Output

### Success Output

```
🎬 T2V Video Generation

================================================================================

Prompt: "A cat playing piano in a cozy room"
Model: LTX-Video (ltx-video)

⏳ Generating video...

✅ Video generated successfully!

Video Details:
  Resolution: 512x512
  Frames: 24
  FPS: 8
  Duration: 3.00s
  Seed: 42
  Size: 1.25 MB

📁 Saved to: output/video_1704123456789.mp4
```

### Error Output

```
❌ Video generation failed:

  Model "ltx-video" is not configured. Set MODAL_LTX_VIDEO_URL environment variable.

💡 Tip: Set the required environment variable or use --list-models to see available models
```

## Integration with Scripts

### Use in Shell Scripts

```bash
#!/bin/bash

# Generate multiple videos
for prompt in "sunrise" "sunset" "moonrise"; do
  npx tsx scripts/generate-t2v.ts \
    --prompt "A $prompt over the ocean" \
    --model ltx-video \
    --output "./videos/$prompt.mp4"
done
```

### Use in Node.js Scripts

While the CLI is for command-line use, you can also import the underlying API:

```typescript
import { generateVideo } from './src/services/textToVideo';

const response = await generateVideo(
  'ltx-video',
  { prompt: 'A cat playing piano' },
  'output.mp4'
);
```

## Troubleshooting

### "Model not configured" Error

**Problem**: The selected model doesn't have an endpoint URL configured.

**Solution**: Set the appropriate environment variable:
```bash
export MODAL_LTX_VIDEO_URL="<your-endpoint-url>"
```

### "No T2V models are configured" Error

**Problem**: No models are available (auto-selection mode).

**Solution**: Configure at least one model endpoint or use `--model` to specify a configured model.

### "Video generation timed out" Error

**Problem**: Generation took longer than the 5-minute timeout.

**Solution**:
- Use a faster model (`--speed fast` or `--model ltx-video`)
- Reduce frames (`--frames 24`)
- Reduce inference steps (`--steps 30`)

### "Invalid model" Error

**Problem**: Specified model name doesn't exist.

**Solution**: Use `--list-models` to see valid model names.

## Performance Tips

### Fast Generation
```bash
npx tsx scripts/generate-t2v.ts \
  --prompt "..." \
  --model ltx-video \
  --frames 24 \
  --steps 30
```

### High Quality
```bash
npx tsx scripts/generate-t2v.ts \
  --prompt "..." \
  --model hunyuan \
  --steps 100 \
  --guidance 8.0
```

### Cost-Effective
```bash
npx tsx scripts/generate-t2v.ts \
  --prompt "..." \
  --model ltx-video \
  --frames 24 \
  --width 512 \
  --height 512
```

## Related Features

- [T2V-001: LTX-Video Modal Deployment](./T2V-001-LTX-VIDEO.md)
- [T2V-006: T2V API Router](./T2V-006-API-ROUTER.md)
- [T2V-008: T2V Web Endpoint](./T2V-008-WEB-ENDPOINT.md)

## Future Enhancements

- Progress bar for long-running generations
- Batch processing from CSV/JSON file
- Video preview in terminal (using ASCII art)
- Config file support for default settings
- Interactive mode with prompts
- Template library for common video types
