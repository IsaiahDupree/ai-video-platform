# T2V-008: T2V Web Endpoint

FastAPI/Web endpoint for text-to-video generation using LTX-Video model deployed on Modal.

## Overview

This feature adds a web-accessible HTTP endpoint to the LTX-Video Modal deployment, allowing external applications and services to generate videos via simple HTTP POST requests. The endpoint returns base64-encoded MP4 videos along with metadata.

## Implementation

### Endpoint Details

**URL Structure:**
```
https://{workspace}--ltx-video-generate-video-endpoint.modal.run
```

**Method:** `POST`

**Content-Type:** `application/json`

### Request Format

```json
{
  "prompt": "A cat playing piano in a cozy room, cinematic lighting",
  "negative_prompt": "blurry, low quality, distorted",
  "num_frames": 24,
  "fps": 8,
  "width": 512,
  "height": 512,
  "num_inference_steps": 50,
  "guidance_scale": 7.5,
  "seed": 42
}
```

### Request Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | **required** | Text description of the video to generate |
| `negative_prompt` | string | `""` | What to avoid in the generation |
| `num_frames` | integer | `24` | Number of frames to generate (24 = 3 seconds at 8fps) |
| `fps` | integer | `8` | Frames per second for output video |
| `width` | integer | `512` | Video width in pixels |
| `height` | integer | `512` | Video height in pixels |
| `num_inference_steps` | integer | `50` | Number of denoising steps (higher = better quality, slower) |
| `guidance_scale` | float | `7.5` | How closely to follow the prompt (7-12 recommended) |
| `seed` | integer | `null` | Random seed for reproducibility |

### Response Format

```json
{
  "video": "BASE64_ENCODED_VIDEO_DATA...",
  "format": "mp4",
  "num_frames": 24,
  "fps": 8,
  "width": 512,
  "height": 512,
  "prompt": "A cat playing piano in a cozy room, cinematic lighting"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `video` | string | Base64-encoded MP4 video data |
| `format` | string | Video format (always "mp4") |
| `num_frames` | integer | Number of frames generated |
| `fps` | integer | Frames per second |
| `width` | integer | Video width in pixels |
| `height` | integer | Video height in pixels |
| `prompt` | string | The prompt that was used |

### Error Responses

**500 Internal Server Error:**
```json
{
  "detail": "Video generation failed: [error message]"
}
```

## Deployment

### 1. Deploy to Modal

```bash
modal deploy scripts/modal_ltx_video.py
```

This will output your endpoint URL:
```
✓ Created web function generate_video_endpoint => https://yourworkspace--ltx-video-generate-video-endpoint.modal.run
```

### 2. Test the Endpoint

Save your endpoint URL:
```bash
export LTX_VIDEO_WEB_ENDPOINT="https://yourworkspace--ltx-video-generate-video-endpoint.modal.run"
```

Run the test script:
```bash
npx tsx scripts/test-t2v-web-endpoint.ts
```

## Usage Examples

### TypeScript/JavaScript

```typescript
interface VideoRequest {
  prompt: string;
  num_frames?: number;
  fps?: number;
  width?: number;
  height?: number;
}

async function generateVideo(request: VideoRequest): Promise<Buffer> {
  const response = await fetch(ENDPOINT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result = await response.json();
  return Buffer.from(result.video, 'base64');
}

// Usage
const videoBuffer = await generateVideo({
  prompt: 'A sunset over the ocean',
  num_frames: 48,
  fps: 12,
});

fs.writeFileSync('output.mp4', videoBuffer);
```

### Python

```python
import base64
import requests

def generate_video(prompt: str, **kwargs) -> bytes:
    response = requests.post(
        ENDPOINT_URL,
        json={'prompt': prompt, **kwargs}
    )
    response.raise_for_status()

    result = response.json()
    return base64.b64decode(result['video'])

# Usage
video_bytes = generate_video(
    prompt='A cat playing piano',
    num_frames=24,
    fps=8
)

with open('output.mp4', 'wb') as f:
    f.write(video_bytes)
```

### cURL

```bash
curl -X POST "https://yourworkspace--ltx-video-generate-video-endpoint.modal.run" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A dog running on the beach",
    "num_frames": 24,
    "fps": 8,
    "seed": 42
  }' | jq -r '.video' | base64 -d > output.mp4
```

## Implementation Details

### Code Location
- **Endpoint:** `scripts/modal_ltx_video.py` (lines 261-326)
- **Test Script:** `scripts/test-t2v-web-endpoint.ts`

### Key Features

1. **Async Execution**: Uses async/await for non-blocking requests
2. **Error Handling**: Comprehensive error handling with HTTPException
3. **Base64 Encoding**: Returns video as base64 for easy JSON transport
4. **Metadata**: Includes generation parameters in response
5. **GPU Scaling**: Automatically scales GPU instances based on demand

### Modal Configuration

The endpoint runs on:
- **GPU**: A100-40GB
- **Timeout**: 20 minutes (1200s)
- **Scaledown Window**: 10 minutes (600s)
- **Image**: Debian slim with Python 3.11, PyTorch, Diffusers

## Performance Considerations

### Response Times
- **Cold Start**: 30-60 seconds (first request after idle)
- **Warm Instance**: 10-30 seconds per video
- **Batch Generation**: Use batch_generate method for multiple videos

### Cost Optimization
- Modal auto-scales to zero after 10 minutes of inactivity
- A100-40GB costs ~$3/hour when active
- Keep-alive window balances cost vs. latency

### Recommendations
- Use `seed` parameter for reproducible results
- Lower `num_inference_steps` (30-40) for faster generation
- Keep `width` and `height` at 512 for best speed/quality ratio
- Use higher `num_frames` (48-60) sparingly due to cost

## Integration with T2V Router

This endpoint integrates with the T2V API Router (T2V-006) through the `textToVideo.ts` service:

```typescript
import { generateVideo } from './services/textToVideo';

const video = await generateVideo({
  model: 'ltx-video',
  prompt: 'A cat playing piano',
  num_frames: 24,
});
```

See [T2V-006-API-ROUTER.md](./T2V-006-API-ROUTER.md) for more details.

## Testing

### Unit Test
```bash
npx tsx scripts/test-t2v-web-endpoint.ts
```

### Manual Testing with Postman
1. Create a new POST request
2. Set URL to your Modal endpoint
3. Set header: `Content-Type: application/json`
4. Set body (raw JSON):
   ```json
   {
     "prompt": "A cat playing piano",
     "num_frames": 24
   }
   ```
5. Send request
6. Copy `video` field and decode from base64

## Troubleshooting

### "Connection refused" error
- Ensure Modal deployment is active: `modal app list`
- Check endpoint URL is correct
- Verify Modal authentication: `modal token set`

### "Video generation failed" error
- Check Modal logs: `modal app logs ltx-video`
- Verify GPU availability in your Modal workspace
- Check for model loading issues in logs

### Slow responses
- First request after idle will be slow (cold start)
- Keep endpoint warm by sending periodic health checks
- Consider using Modal's volume caching for faster model loading

## Related Features
- [T2V-001: LTX-Video Modal Deployment](./T2V-001-LTX-VIDEO.md)
- [T2V-006: T2V API Router](./T2V-006-API-ROUTER.md)
- [T2V-007: Model Weight Caching](./T2V-007-MODEL-CACHING.md)
- [T2V-009: T2V CLI Interface](./T2V-009-CLI-INTERFACE.md)

## Future Enhancements
- WebSocket streaming for real-time frame generation
- Webhook callbacks for long-running generations
- Direct S3/R2 upload instead of base64 encoding
- Health check endpoint
- Rate limiting and authentication
