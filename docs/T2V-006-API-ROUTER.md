# T2V-006: Text-to-Video API Router

**Status**: ✅ Complete
**Priority**: P1
**Category**: text-to-video
**Effort**: 8pts

## Overview

Unified API to route requests to different text-to-video models deployed on Modal. Provides a single TypeScript interface for generating videos from text across multiple AI models.

## Features

- **Unified Interface**: Single API for all T2V models
- **Automatic Routing**: Route requests to appropriate model endpoints
- **Model Selection**: Auto-select best model based on requirements
- **Type Safety**: Full TypeScript support with comprehensive types
- **Model Discovery**: List and query model capabilities
- **Flexible Configuration**: Override defaults per model
- **Error Handling**: Robust error handling with timeouts
- **Convenience Functions**: High-level helpers for common tasks

## Supported Models

### LTX-Video
- **Speed**: Fast (lowest latency)
- **Quality**: Standard
- **Resolution**: 512x512
- **Duration**: 16-48 frames (~2-6s at 8fps)
- **Best For**: Quick previews, prototypes, fast iteration
- **VRAM**: ~8GB

### Genmo Mochi
- **Speed**: Medium
- **Quality**: High
- **Resolution**: 480x848 (480p, 16:9)
- **Duration**: 31-84 frames (~1-2.8s at 30fps)
- **Best For**: High-quality short clips, photorealistic content
- **Features**: Excellent motion coherence, photorealistic output
- **VRAM**: ~22GB

### HunyuanVideo
- **Speed**: Slow (highest quality)
- **Quality**: Excellent
- **Resolution**: 1280x720 (720p)
- **Duration**: 129 frames (~5.4s at 24fps)
- **Best For**: Professional content, complex scenes, long-form
- **Features**: Industry-leading text alignment, camera movements, multilingual
- **VRAM**: ~28GB

### Alibaba Wan2.2
- **Speed**: Slow
- **Quality**: Excellent
- **Resolution**: 1920x1080 (1080p)
- **Duration**: 61-121 frames (~4-7.5s at 16fps)
- **Best For**: Multilingual content, 1080p output, production quality
- **Features**: 50+ language support, MoE architecture
- **VRAM**: ~35GB

### LongCat Avatar
- **Speed**: Medium
- **Quality**: High
- **Resolution**: 512x512
- **Duration**: Audio-driven (1-60s)
- **Best For**: Talking heads, virtual presenters, spokesperson videos
- **Features**: Audio-driven lip sync, facial animation
- **VRAM**: ~16GB

## Installation

```bash
# Install dependencies (already in package.json)
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and add your Modal endpoint URLs
```

## Environment Variables

```bash
# Add to .env file
MODAL_LTX_VIDEO_URL=https://your-workspace--ltx-video-generate-video-api.modal.run
MODAL_MOCHI_URL=https://your-workspace--mochi-video-generate-video-api.modal.run
MODAL_HUNYUAN_URL=https://your-workspace--hunyuan-video-generate-video-api.modal.run
MODAL_WAN_URL=https://your-workspace--wan-video-generate-video-api.modal.run
MODAL_AVATAR_URL=https://your-workspace--longcat-avatar-generate-avatar-api.modal.run
```

Note: You only need to configure the models you want to use. The router will work with any combination of available models.

## Usage

### Basic Usage

```typescript
import { generateVideo, generateVideoAuto } from './src/services/textToVideo';

// Generate with specific model
const response = await generateVideo(
  'mochi',
  {
    prompt: 'A serene lake at sunset with gentle waves',
    negativePrompt: 'blurry, low quality',
    fps: 30
  },
  'output.mp4'
);

// Auto-select best model
const response2 = await generateVideoAuto(
  'Cinematic aerial shot of a futuristic city',
  {
    quality: 'excellent',
    speed: 'medium',
    outputPath: 'city.mp4'
  }
);
```

### Using the Client API

```typescript
import { TextToVideoClient } from './src/services/textToVideo';

const client = new TextToVideoClient();

// List available models
const models = client.getAvailableModels();
console.log('Available:', models);

// Get model capabilities
const caps = client.getModelCapabilities('mochi');
console.log(caps);

// Get recommendation
const recommended = client.recommendModel({
  quality: 'high',
  speed: 'fast'
});

// Generate video
const response = await client.generateVideo({
  model: 'hunyuan',
  config: {
    prompt: 'Time-lapse of clouds over mountains',
    numFrames: 97,
    width: 1920,
    height: 1080,
    fps: 24,
    guidanceScale: 6.5,
    seed: 42
  }
});

// Save to file
await client.saveVideo(response, 'mountains.mp4');
```

### Generate Avatar Video

```typescript
import { generateVideo } from './src/services/textToVideo';

const response = await generateVideo(
  'avatar',
  {
    referenceImage: 'portrait.jpg',
    audio: 'narration.wav',
    fps: 25,
    guidanceScale: 3.0
  },
  'talking_avatar.mp4'
);
```

### Advanced: Custom Configuration

```typescript
import { TextToVideoClient, BaseVideoConfig } from './src/services/textToVideo';

const client = new TextToVideoClient(600000); // 10-minute timeout

const config: BaseVideoConfig = {
  prompt: 'Slow motion water splash, macro photography',
  negativePrompt: 'blurry, low quality, distorted',
  numFrames: 84,
  width: 848,
  height: 480,
  numInferenceSteps: 80,
  guidanceScale: 5.0,
  fps: 30,
  seed: 12345
};

const response = await client.generateVideo({
  model: 'mochi',
  config
});

console.log('Duration:', response.metadata.duration, 'seconds');
console.log('Size:', response.video.length / 1024 / 1024, 'MB');
```

## CLI Usage

Test the router using the provided test script:

```bash
# List all models and their status
ts-node scripts/test-t2v-router.ts list

# Show model capabilities
ts-node scripts/test-t2v-router.ts info mochi

# Get model recommendation
ts-node scripts/test-t2v-router.ts recommend --quality excellent --speed medium

# Generate with specific model
ts-node scripts/test-t2v-router.ts generate ltx-video "Ocean waves at sunset" --output waves.mp4

# Generate with custom parameters
ts-node scripts/test-t2v-router.ts generate hunyuan "City traffic timelapse" \
  --frames 97 --width 1920 --height 1080 --fps 24 --guidance 6.5 --output traffic.mp4

# Auto-select best model
ts-node scripts/test-t2v-router.ts auto "Cinematic drone shot of mountains" \
  --quality high --speed fast --output mountains.mp4

# Generate avatar video
ts-node scripts/test-t2v-router.ts avatar portrait.jpg narration.wav \
  --fps 30 --guidance 3.5 --output talking.mp4
```

## API Reference

### Types

#### `T2VModel`
```typescript
type T2VModel = 'ltx-video' | 'mochi' | 'hunyuan' | 'wan' | 'avatar';
```

#### `BaseVideoConfig`
```typescript
interface BaseVideoConfig {
  prompt: string;
  negativePrompt?: string;
  numFrames?: number;
  width?: number;
  height?: number;
  numInferenceSteps?: number;
  guidanceScale?: number;
  fps?: number;
  seed?: number;
}
```

#### `AvatarVideoConfig`
```typescript
interface AvatarVideoConfig {
  referenceImage: string | Buffer;
  audio: string | Buffer;
  numInferenceSteps?: number;
  guidanceScale?: number;
  fps?: number;
  seed?: number;
}
```

#### `T2VResponse`
```typescript
interface T2VResponse {
  video: Buffer;
  model: T2VModel;
  metadata: {
    prompt?: string;
    width: number;
    height: number;
    frames: number;
    fps: number;
    duration: number;
    seed?: number;
  };
}
```

### TextToVideoClient

#### Constructor
```typescript
new TextToVideoClient(timeout?: number)
```
- `timeout`: Request timeout in milliseconds (default: 300000 = 5 minutes)

#### Methods

**`getModelCapabilities(model: T2VModel): ModelCapabilities`**
Get detailed capabilities of a specific model.

**`listModels(): T2VModel[]`**
List all supported model types.

**`isModelAvailable(model: T2VModel): boolean`**
Check if a model is configured (has endpoint URL).

**`getAvailableModels(): T2VModel[]`**
Get list of configured models only.

**`recommendModel(requirements): T2VModel | null`**
Recommend best model based on requirements:
```typescript
{
  quality?: 'standard' | 'high' | 'excellent';
  speed?: 'fast' | 'medium' | 'slow';
  resolution?: { width: number; height: number };
  duration?: number;
  features?: string[];
}
```

**`generateVideo(request: T2VRequest): Promise<T2VResponse>`**
Generate video using specified model and configuration.

**`saveVideo(response: T2VResponse, outputPath: string): Promise<void>`**
Save generated video to file.

### Convenience Functions

**`createTextToVideoClient(timeout?: number): TextToVideoClient`**
Factory function to create a client instance.

**`generateVideo(model, config, outputPath?): Promise<T2VResponse>`**
Quick generation with a specific model.

**`generateVideoAuto(prompt, options?): Promise<T2VResponse>`**
Auto-select best model and generate.

## Model Selection Guide

### When to Use Each Model

**LTX-Video**
- ✅ Fast iteration and previews
- ✅ Prototyping and testing
- ✅ Low-resolution content
- ✅ Budget-conscious projects
- ❌ High-quality production
- ❌ Large resolutions

**Mochi**
- ✅ High-quality short clips
- ✅ Photorealistic content
- ✅ Social media content
- ✅ Marketing materials
- ❌ Long-form video
- ❌ Budget projects

**HunyuanVideo**
- ✅ Professional production
- ✅ Complex scenes
- ✅ Camera movements
- ✅ Text-heavy prompts
- ✅ Multilingual content
- ❌ Quick turnaround
- ❌ Budget projects

**Wan2.2**
- ✅ 1080p production quality
- ✅ Multilingual content (50+ languages)
- ✅ International markets
- ✅ High-end marketing
- ❌ Fast iteration
- ❌ Budget constraints

**LongCat Avatar**
- ✅ Talking head videos
- ✅ Virtual presenters
- ✅ Educational content
- ✅ Spokesperson videos
- ❌ Non-character content
- ❌ Abstract visuals

### Quality vs Speed Trade-offs

| Model | Speed | Quality | Cost | Use Case |
|-------|-------|---------|------|----------|
| LTX-Video | ⚡⚡⚡ | ⭐⭐ | $ | Fast iteration |
| Mochi | ⚡⚡ | ⭐⭐⭐ | $$ | Social media |
| HunyuanVideo | ⚡ | ⭐⭐⭐⭐ | $$$ | Production |
| Wan2.2 | ⚡ | ⭐⭐⭐⭐ | $$$$ | Premium 1080p |
| Avatar | ⚡⚡ | ⭐⭐⭐ | $$ | Talking heads |

## Error Handling

```typescript
try {
  const response = await generateVideo('mochi', config, 'output.mp4');
  console.log('Success!', response.metadata);
} catch (error) {
  if (error.message.includes('not configured')) {
    console.error('Model endpoint not set. Check environment variables.');
  } else if (error.message.includes('timed out')) {
    console.error('Generation took too long. Try a shorter video or faster model.');
  } else {
    console.error('Generation failed:', error.message);
  }
}
```

## Performance Tips

1. **Start with LTX-Video** for testing prompts and parameters
2. **Use seeds** for reproducible results when iterating
3. **Adjust guidance scale** to balance prompt adherence vs creativity
4. **Reduce frames** for faster generation (shorter videos)
5. **Use appropriate model** for your quality requirements
6. **Set timeouts** appropriately for longer videos

## Integration Examples

### With Voice Cloning Pipeline

```typescript
import { generateVideo } from './src/services/textToVideo';
import { cloneVoice } from './src/services/voiceClone';

// Generate narration
const audio = await cloneVoice({
  text: 'Welcome to our product demo',
  referenceAudio: 'voice-reference.wav',
  speed: 1.0
});

// Create avatar video
const video = await generateVideo(
  'avatar',
  {
    referenceImage: 'spokesperson.jpg',
    audio: audio,
    fps: 25
  },
  'demo-video.mp4'
);
```

### Batch Generation

```typescript
const client = new TextToVideoClient();

const prompts = [
  'Ocean sunset with gentle waves',
  'Mountain landscape at golden hour',
  'City skyline at night with lights'
];

for (const prompt of prompts) {
  const filename = prompt.replace(/\s+/g, '-').toLowerCase() + '.mp4';
  await client.generateVideo({
    model: 'mochi',
    config: { prompt, fps: 30 }
  });
  await client.saveVideo(response, `outputs/${filename}`);
  console.log(`Generated: ${filename}`);
}
```

## Troubleshooting

**"Model not configured"**
- Set the appropriate `MODAL_*_URL` environment variable
- Check that the Modal service is deployed: `modal app list`

**"Generation timed out"**
- Increase timeout in client constructor
- Use a faster model (LTX-Video or Mochi)
- Reduce number of frames or resolution

**"Connection refused"**
- Verify Modal endpoint URL is correct
- Check that Modal service is running
- Ensure network connectivity

**Low quality output**
- Increase `numInferenceSteps` (default: 50)
- Adjust `guidanceScale` (higher = more prompt adherence)
- Try a higher-quality model (Mochi → HunyuanVideo)
- Use more detailed, specific prompts

**Inconsistent results**
- Set a `seed` value for reproducibility
- Lock down all parameters (frames, resolution, steps, guidance)
- Use the same model for consistency

## Future Enhancements

- [ ] Image-to-video support (I2V)
- [ ] Video-to-video (V2V) transformations
- [ ] Multi-model ensemble generation
- [ ] Automatic prompt optimization
- [ ] Cost estimation and tracking
- [ ] Generation queue management
- [ ] Result caching

## Related Features

- **T2V-001**: LTX-Video Modal Deployment ✅
- **T2V-002**: Mochi Model Integration ✅
- **T2V-003**: HunyuanVideo Integration ✅
- **T2V-004**: Wan2.2 Model Integration ✅
- **T2V-005**: LongCat Avatar Integration ✅
- **T2V-007**: Model Weight Caching (pending)
- **T2V-008**: T2V Web Endpoint (pending)
- **T2V-009**: T2V CLI Interface (pending)
- **T2V-010**: Video Output Pipeline (pending)

## License

This feature is part of the AI Video Platform project.
