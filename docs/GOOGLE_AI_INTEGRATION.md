# Google AI Integration (Imagen 4 & Veo 3)

Integration of Google's Imagen 4 (image generation) and Veo 3 (video generation) APIs into the AI Video Platform.

## Overview

This integration adds:
- **Imagen 4**: High-quality image generation for notebook covers, scenes, and assets
- **Veo 3**: Video generation for product showcases and animations
- **Video Popup Component**: UI for displaying video generation status and playback
- **API Routes**: Backend endpoints for generation and operation polling

## Quick Start

### 1. Add Google AI API Key

```bash
# Add to .env.local
GOOGLE_AI_API_KEY=your-google-ai-api-key
```

Get your key from: https://makersuite.google.com/app/apikey

### 2. Test Image Generation

```bash
cd tests/google-ai
npm install
npm run test:imagen4
```

### 3. Test Video Generation

```bash
npm run test:veo3
```

### 4. View Video Popup Demo

```bash
npm run dev
# Visit http://localhost:3000/test-video-popup
```

## Components

### Video Popup (`components/video-popup.tsx`)

Full-screen modal for displaying video generation status and playback.

**Features:**
- Status indicators (pending, processing, completed, failed)
- Video player with controls
- Download functionality
- Operation ID display
- Dark mode support

**Usage:**
```tsx
import { VideoPopup } from '@/components/video-popup';

<VideoPopup
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  operation={{
    id: 'operation-id',
    name: 'Video Name',
    prompt: 'Generation prompt',
    status: 'completed',
    videoUrl: 'path/to/video.mp4',
    createdAt: new Date(),
  }}
/>
```

## API Routes

### Generate Image

**Endpoint:** `POST /api/image/generate`

**Request:**
```json
{
  "prompt": "A minimalist notebook cover design",
  "numberOfImages": 1,
  "aspectRatio": "3:4"
}
```

**Response:**
```json
{
  "success": true,
  "images": [
    {
      "id": "img-123",
      "url": "data:image/png;base64,...",
      "prompt": "..."
    }
  ]
}
```

### Generate Video

**Endpoint:** `POST /api/video/generate`

**Request:**
```json
{
  "prompt": "A smooth camera pan across a notebook",
  "aspectRatio": "16:9"
}
```

**Response:**
```json
{
  "success": true,
  "operationId": "models/veo-3.0-fast-generate-001/operations/abc123",
  "message": "Video generation started"
}
```

### Poll Video Operation

**Endpoint:** `GET /api/video/operation?operationId=<id>`

**Response (Processing):**
```json
{
  "status": "processing",
  "operation": { ... }
}
```

**Response (Completed):**
```json
{
  "status": "completed",
  "videoUrl": "data:video/mp4;base64,...",
  "operation": { ... }
}
```

## Test Scripts

### Imagen 4 Test (`tests/google-ai/test-imagen4.ts`)

Generates 3 notebook cover designs:
- Minimalist geometric (navy/gold)
- Faith-based watercolor mountains
- Teacher planner (colorful)

**Run:**
```bash
cd tests/google-ai
npm run test:imagen4
```

**Output:** `output/images/test*/*.png`

### Veo 3 Test (`tests/google-ai/test-veo3.ts`)

Generates video operations for:
- Product showcase (camera pan)
- Notebook opening (cinematic)
- Product rotation (360°)

**Run:**
```bash
npm run test:veo3
```

**Output:** `output/videos/test*/veo3-operation-*.json`

**Note:** Veo 3 uses long-running operations. Videos are generated asynchronously.

## Models Available

### Imagen 4
- **Model:** `imagen-4.0-generate-001`
- **Method:** `predict`
- **Aspect Ratios:** 1:1, 16:9, 9:16, 4:3, 3:4
- **Output:** PNG images (base64)

### Veo 3
- **Model:** `veo-3.0-fast-generate-001`
- **Method:** `predictLongRunning`
- **Aspect Ratios:** 16:9, 9:16, 1:1
- **Output:** MP4 videos (async via operations)

## Integration with Video Platform

### 1. Generate Scene Images

```typescript
const response = await fetch('/api/image/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Scene description for video',
    aspectRatio: '16:9',
  }),
});

const { images } = await response.json();
// Use images[0].url in your video brief
```

### 2. Generate Product Videos

```typescript
const response = await fetch('/api/video/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Product showcase description',
    aspectRatio: '16:9',
  }),
});

const { operationId } = await response.json();

// Poll for completion
const pollOperation = async () => {
  const res = await fetch(`/api/video/operation?operationId=${operationId}`);
  const data = await res.json();
  
  if (data.status === 'completed') {
    return data.videoUrl;
  } else if (data.status === 'processing') {
    setTimeout(pollOperation, 5000); // Poll every 5 seconds
  }
};
```

## Pricing

### Imagen 4
- ~$0.04 per standard image
- ~$0.08 per HD image

### Veo 3
- ~$0.10 per second of video
- 5-second video ≈ $0.50

**Cost Optimization:**
- Cache generated assets
- Generate in batches
- Use for final designs only
- Implement approval workflow

## Rate Limits

Free tier limits:
- **Imagen 4:** 50 images/day
- **Veo 3:** 10 videos/day

Hit rate limit? Wait 24 hours or upgrade to paid tier.

## Troubleshooting

### "GOOGLE_AI_API_KEY environment variable is required"
Add the key to your `.env.local` file.

### "Rate limit exceeded"
You've hit the daily quota. Wait 24 hours or upgrade.

### Video operation never completes
Check the operation status manually:
```bash
curl "https://generativelanguage.googleapis.com/v1beta/OPERATION_ID?key=YOUR_KEY"
```

### Images not displaying
Ensure base64 data URLs are properly formatted:
```
data:image/png;base64,iVBORw0KG...
```

## Files Structure

```
tests/google-ai/
├── test-imagen4.ts           # Image generation tests
├── test-veo3.ts              # Video generation tests
├── test-gemini-vision.ts     # Vision analysis (future)
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── .env.example              # Environment template
└── output/                   # Generated files
    ├── images/
    └── videos/

components/
└── video-popup.tsx           # Video popup component

app/
├── api/
│   ├── image/
│   │   └── generate/
│   │       └── route.ts      # Image generation API
│   └── video/
│       ├── generate/
│       │   └── route.ts      # Video generation API
│       └── operation/
│           └── route.ts      # Operation polling API
└── test-video-popup/
    └── page.tsx              # Demo page
```

## Resources

- [Google AI Studio](https://makersuite.google.com/)
- [Imagen Documentation](https://ai.google.dev/docs/imagen)
- [Veo Documentation](https://ai.google.dev/docs/veo)
- [API Pricing](https://ai.google.dev/pricing)
- [Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits)
