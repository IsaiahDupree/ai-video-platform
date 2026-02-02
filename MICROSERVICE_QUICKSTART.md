# 🚀 Remotion Media Service - Quick Start

Transform your Remotion VideoStudio into a REST API microservice in 3 steps!

---

## ⚡ Quick Start

### 1. Configure

```bash
# Copy environment template
cp .env.service.example .env.service

# Edit .env.service and set your API key
# REMOTION_SERVICE_API_KEY=your-secret-api-key-here
```

### 2. Start

```bash
# Start the service
npm run service:start

# Or with auto-reload for development
npm run service:dev
```

Service runs on: **http://localhost:3100**

### 3. Test

```bash
# Health check
curl http://localhost:3100/health

# List capabilities
curl -H "X-API-Key: dev-api-key" \
  http://localhost:3100/api/v1/capabilities

# Or run the interactive example
npx tsx examples/quickstart-service.ts
```

---

## 📚 What You Can Do

| Feature | Endpoint | Description |
|---------|----------|-------------|
| **Video Rendering** | `POST /api/v1/render/brief` | Render videos from JSON briefs |
| **Batch Rendering** | `POST /api/v1/render/batch` | Process multiple videos in parallel |
| **Text-to-Speech** | `POST /api/v1/tts/generate` | Generate speech with OpenAI/ElevenLabs |
| **Voice Cloning** | `POST /api/v1/tts/voice-clone` | Clone voices from reference audio |
| **AI Video** | `POST /api/v1/video/generate` | Generate videos with Sora/LTX/Mochi |
| **Image-to-Video** | `POST /api/v1/video/image-to-video` | Animate static images |
| **AI Characters** | `POST /api/v1/image/character` | Generate AI characters with DALL-E |
| **Talking Avatars** | `POST /api/v1/avatar/infinitetalk` | Create talking head videos |
| **Static Ads** | `POST /api/v1/render/static-ad` | Render static ad images |

---

## 💻 Example: Render a Video

```bash
curl -X POST http://localhost:3100/api/v1/render/brief \
  -H "X-API-Key: dev-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "brief": {
      "id": "my-video",
      "format": "explainer_v1",
      "title": "How AI Works",
      "sections": [],
      "style": {"theme": "dark"},
      "settings": {"duration_sec": 60, "fps": 30}
    },
    "quality": "preview"
  }'
```

**Response:**
```json
{
  "jobId": "abc123",
  "status": "queued",
  "pollUrl": "/api/v1/jobs/abc123"
}
```

**Check status:**
```bash
curl -H "X-API-Key: dev-api-key" \
  http://localhost:3100/api/v1/jobs/abc123
```

---

## 🔧 TypeScript SDK

```typescript
import { RemotionClient } from './src/service/client';

const client = new RemotionClient({
  baseUrl: 'http://localhost:3100',
  apiKey: 'dev-api-key',
});

// Render video (sync)
const result = await client.renderBriefSync({
  brief: myBrief,
  quality: 'production',
});

console.log('Video ready:', result.result?.videoPath);
```

---

## 📖 Full Documentation

- **Complete Guide:** `docs/MICROSERVICE_GUIDE.md`
- **PRD:** `docs/PRD-REMOTION-MICROSERVICE-DETAILED.md`
- **Implementation Summary:** `MICROSERVICE_COMPLETION_SUMMARY.md`
- **Examples:** `examples/quickstart-service.ts`

---

## ⚙️ Configuration

Edit `.env.service`:

```bash
# Service
REMOTION_SERVICE_PORT=3100
REMOTION_SERVICE_API_KEY=your-api-key

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=60
RATE_LIMIT_REQUESTS_PER_HOUR=1000

# Job Queue
JOB_QUEUE_MAX_CONCURRENT=10

# External APIs
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=sk_...
```

---

## 🎯 Features

✅ **REST API** - All capabilities via HTTP
✅ **Job Queue** - Async processing with webhooks
✅ **Authentication** - API key auth with rate limiting
✅ **TypeScript SDK** - Type-safe client library
✅ **Batch Processing** - Render multiple videos in parallel
✅ **CORS Support** - Cross-origin requests
✅ **Webhooks** - Job completion notifications
✅ **Health Checks** - Monitoring and orchestration

---

## 🚀 Next Steps

1. **Start the service:** `npm run service:start`
2. **Run the example:** `npx tsx examples/quickstart-service.ts`
3. **Read the guide:** `docs/MICROSERVICE_GUIDE.md`
4. **Build something awesome!** 🎬

---

**Need help?** Check `docs/MICROSERVICE_GUIDE.md` for troubleshooting and advanced usage.
