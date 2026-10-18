# Wan2.2 High-Quality Video Generation Guide

Wan2.2 is Alibaba's advanced text-to-video model, providing **higher quality than LTX-Video** at the cost of speed. Perfect for professional video content and advertisements.

## Quick Start

### 1. Deploy to Modal

```bash
# Deploy Wan2.2 model (requires H100 GPU access)
modal deploy scripts/modal_wan2_2.py

# View deployment
modal app list

# Check logs
modal app logs wan2-2-video
```

### 2. Generate Video via CLI

```bash
# Export your Modal API endpoint
export WAN2_2_API_URL="https://your-username--wan2-2-video-api-generate.modal.run"

# Generate a video
npx tsx scripts/generate-video-wan2-2.ts \
  --prompt "A serene mountain landscape with snow-covered peaks" \
  --duration 10 \
  --output output/mountain.mp4 \
  --steps 50
```

### 3. Use in TypeScript Code

```typescript
import { Wan22Client } from './src/api/wan2-2-client';

const client = new Wan22Client(
  'https://your-username--wan2-2-video-api-generate.modal.run'
);

// Generate text-to-video
const result = await client.generateVideo({
  prompt: 'A professional presenter explaining AI',
  settings: {
    durationSeconds: 15,
    width: 1280,
    height: 720,
    numInferenceSteps: 50,
    guidanceScale: 7.5,
  }
});

// Save to file
const fs = require('fs');
fs.writeFileSync('video.mp4', Buffer.from(result.videoBase64, 'base64'));
```

## Model Variants

### Wan2.2 T2V-14B (Text-to-Video)
- **Best for:** Maximum quality video generation
- **Model size:** 14B parameters
- **Duration:** Up to 60 seconds
- **Resolution:** 720p (1280x720)
- **Quality:** ⭐⭐⭐⭐⭐ (Highest)
- **Speed:** ⭐⭐ (Slowest, 120-180s for 10s video)
- **Cost:** Higher GPU overhead

### Wan2.2 TI2V-5B (Text + Image-to-Video)
- **Best for:** Animating images with text guidance
- **Model size:** 5B parameters (more efficient)
- **Duration:** Up to 30 seconds
- **Resolution:** 720p (1280x720)
- **Quality:** ⭐⭐⭐⭐ (Excellent)
- **Speed:** ⭐⭐⭐ (Faster, 60-90s for 10s video)
- **Cost:** Lower GPU overhead

## Settings Guide

### Generation Parameters

```typescript
interface Wan22Settings {
  width?: number;              // Default: 1280
  height?: number;             // Default: 720
  durationSeconds?: number;    // Default: 10 (max 60 for T2V, 30 for TI2V)
  fps?: number;                // Default: 24
  numInferenceSteps?: number;  // Default: 50 (higher = better quality)
  guidanceScale?: number;      // Default: 7.5 (how much to follow prompt)
  seed?: number;               // Optional: for reproducibility
}
```

### Quality vs Speed Tradeoffs

#### 🚀 Fast Generation (Demos)
```typescript
{
  durationSeconds: 5,
  numInferenceSteps: 30,
  guidanceScale: 6.5,
}
// Expected: 60-90 seconds generation time
```

#### ⚖️ Balanced (Social Media Content)
```typescript
{
  durationSeconds: 10,
  numInferenceSteps: 50,
  guidanceScale: 7.5,
}
// Expected: 120-180 seconds generation time
```

#### 🎬 Professional Quality
```typescript
{
  durationSeconds: 15,
  numInferenceSteps: 75,
  guidanceScale: 8.0,
}
// Expected: 200-300 seconds generation time
```

## Prompt Engineering

### Good Prompts
- **Specific:** "A professional presenter in a modern office explaining quantum computing"
- **Visual:** "Cinematic view of a sunset over ocean waves with golden light"
- **Detailed:** "A busy city street at night with neon signs, traffic lights, and pedestrians in motion"
- **Styled:** "High-quality documentary style footage of wildlife in natural habitat"

### What to Avoid
- **Vague:** "A video of something cool"
- **Text in video:** Wan2.2 can render visual text but may have quality issues
- **Extremely long:** Keep descriptions under 150 words
- **Conflicting elements:** "A serene quiet place with loud music and explosions"

### Negative Prompts

Always include negative prompts to avoid unwanted artifacts:

```typescript
negativeprompt: "blurry, low quality, distorted, ugly, bad anatomy, watermark"
```

Common negative prompt terms:
- `blurry, low quality, distorted` - Avoid visual defects
- `worst quality, low quality` - Emphasize quality
- `watermark, logo, text, date` - Remove overlays
- `bad anatomy, deformed` - For human subjects
- `static, still, frozen` - Ensure motion

## Text-to-Image Integration

For **TI2V-5B mode** (text + image to video):

```typescript
import * as fs from 'fs';

// Load image as base64
const imageBuffer = fs.readFileSync('reference.jpg');
const imageBase64 = imageBuffer.toString('base64');

// Generate video from text + image
const result = await client.generateVideo({
  prompt: 'The person in the image is explaining a concept',
  model: 'wan2.2-ti2v-5b',
  imageBase64,  // Use reference image
  settings: {
    durationSeconds: 10,
    numInferenceSteps: 50,
  }
});
```

### Using the Helper Method

```typescript
const result = await client.generateVideoFromImage(
  'The person speaks and gestures naturally',
  'my-image.jpg',
  {
    durationSeconds: 10,
    numInferenceSteps: 50,
  }
);
```

## CLI Reference

### Generate Video

```bash
npx tsx scripts/generate-video-wan2-2.ts \
  --prompt "Your prompt here" \
  --api-url "https://your-username--wan2-2-video-api-generate.modal.run" \
  --output output/video.mp4 \
  --duration 10 \
  --steps 50 \
  --guidance-scale 7.5
```

### With Image Input (TI2V)

```bash
npx tsx scripts/generate-video-wan2-2.ts \
  --prompt "The person explains the concept" \
  --api-url "https://your-username--wan2-2-video-api-generate.modal.run" \
  --model wan2.2-ti2v-5b \
  --image reference.jpg \
  --output output/video.mp4 \
  --duration 8
```

### Custom Settings

```bash
npx tsx scripts/generate-video-wan2-2.ts \
  --prompt "Your prompt" \
  --api-url "https://..." \
  --width 1280 \
  --height 720 \
  --duration 15 \
  --fps 30 \
  --steps 75 \
  --guidance-scale 8.0 \
  --seed 42 \
  --output video.mp4
```

## Testing

Run the Wan2.2 test suite:

```bash
# Test health check and models
npx tsx scripts/test-wan2-2.ts health-check

# Test all tests
npx tsx scripts/test-wan2-2.ts

# Test specific test
npx tsx scripts/test-wan2-2.ts list-models
```

## API Endpoints

### FastAPI Deployment

The Modal deployment provides REST endpoints:

```bash
# Health check
curl https://your-username--wan2-2-video-api-generate.modal.run/health

# List models
curl https://your-username--wan2-2-video-api-generate.modal.run/models

# Generate video
curl -X POST https://your-username--wan2-2-video-api-generate.modal.run/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A mountain landscape",
    "model": "wan2.2-t2v-14b",
    "settings": {
      "width": 1280,
      "height": 720,
      "duration_seconds": 10,
      "fps": 24,
      "num_inference_steps": 50,
      "guidance_scale": 7.5
    }
  }'
```

## Cost Analysis

### Modal GPU Costs (H100)

- **H100 (80GB VRAM):** $10.04/hour = $0.002789/second
- **Generation time:** 120-180 seconds per 10-second video
- **Cost per video:** ~$0.33-0.50

### Comparison to HeyGen

| Provider | Video Length | Quality | Cost |
|----------|-------------|---------|------|
| HeyGen | 10s | ⭐⭐⭐ | $5-15 |
| Wan2.2 | 10s | ⭐⭐⭐⭐⭐ | $0.33-0.50 |
| **Savings** | — | **Higher** | **93-97%** |

## Troubleshooting

### API Connection Errors

```
Error: Wan2.2 API call failed: HTTP 404
```

**Solution:** Ensure Modal deployment is active:
```bash
modal app list                    # Check if running
modal deploy scripts/modal_wan2_2.py  # Redeploy if needed
```

### Out of Memory Errors

```
CUDA out of memory
```

**Solutions:**
- Reduce `numInferenceSteps` (50 instead of 75)
- Reduce `durationSeconds` (8 instead of 15)
- Use TI2V-5B instead of T2V-14B (more efficient)
- Upgrade GPU from A100 to H100

### Poor Quality Output

**Try:**
1. Increase `numInferenceSteps` (50 → 75 or higher)
2. Adjust `guidanceScale` (try 7.5-8.5)
3. Improve prompt specificity
4. Add better negative prompt
5. Use T2V-14B model (highest quality)

### Slow Generation

**Try:**
1. Reduce `numInferenceSteps` (does reduce quality)
2. Reduce `durationSeconds`
3. Use TI2V-5B model (faster)
4. Use larger GPU (already H100)

## Best Practices

1. **Batch similar videos:** Generate multiple videos with same settings to warm up GPU
2. **Use seeds for consistency:** Set `seed` for reproducible results
3. **Test prompts first:** Start with short duration to validate prompt
4. **Monitor costs:** Track generation times to estimate costs
5. **Version control models:** Pin model versions in deployment
6. **Cache outputs:** Store generated videos to avoid re-generation

## Advanced Usage

### Batch Video Generation

```typescript
const prompts = [
  'Mountain landscape',
  'Ocean waves',
  'Aurora borealis',
];

const results = await Promise.all(
  prompts.map(prompt =>
    client.generateVideo({
      prompt,
      settings: { durationSeconds: 10 }
    })
  )
);
```

### Integration with Brief System

```typescript
import { Wan22Client } from './src/api/wan2-2-client';
import { ContentBrief } from './src/types/ContentBrief';

async function generateBriefVideo(brief: ContentBrief) {
  const client = new Wan22Client(process.env.WAN2_2_API_URL);

  for (const section of brief.sections) {
    if (section.content.type === 'topic') {
      const result = await client.generateVideo({
        prompt: section.content.narration,
        settings: {
          durationSeconds: section.duration_sec,
        }
      });

      // Use in composition...
    }
  }
}
```

## References

- **Model Repo:** [Alibaba/Wan2.2](https://huggingface.co/Alibaba-Qwen)
- **License:** Apache 2.0
- **Paper:** Wan2.2 Technical Report (Alibaba DAMO Academy)
- **Modal Docs:** [modal.com/docs](https://modal.com/docs)

## Support

- **Issues:** Create issue on GitHub
- **Discussions:** Check existing docs and FAQs
- **Modal Support:** [modal.com/support](https://modal.com/support)
