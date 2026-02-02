# Remotion Media Service - User Guide

**Version:** 1.0
**Status:** Production Ready

---

## Overview

The Remotion Media Service is a REST API microservice that exposes all Remotion VideoStudio capabilities via HTTP endpoints. This enables any application to generate videos, audio, images, and avatars programmatically.

### Features

- **Video Rendering** - Render videos from JSON briefs, batch processing, static ads
- **Text-to-Speech** - ElevenLabs, OpenAI TTS, voice cloning with IndexTTS2
- **AI Video Generation** - Sora, LTX-Video, Mochi, Wan2.2
- **Image Generation** - AI characters, DALL-E images, stickers
- **Audio Processing** - Music search, mixing, SFX
- **Avatar Generation** - InfiniteTalk talking heads, custom avatar training
- **Job Queue** - Async processing with webhooks and status polling
- **Authentication** - API key authentication with rate limiting
- **CORS Support** - Configurable cross-origin resource sharing

---

## Quick Start

### 1. Installation

```bash
# Clone the repository
cd /path/to/Remotion

# Install dependencies
npm install

# Copy environment template
cp .env.service.example .env.service

# Edit .env.service and set your API keys
```

### 2. Configuration

Edit `.env.service`:

```bash
# Service Configuration
REMOTION_SERVICE_PORT=3100
REMOTION_SERVICE_API_KEY=your-secret-api-key-here

# External API Keys
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=sk_...

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=60
RATE_LIMIT_REQUESTS_PER_HOUR=1000

# Job Queue
JOB_QUEUE_MAX_CONCURRENT=10
```

### 3. Start the Service

```bash
# Start the service
npm run service:start

# Or with auto-reload for development
npm run service:dev
```

The service will start on `http://localhost:3100`

### 4. Test the Service

```bash
# Health check
curl http://localhost:3100/health

# List capabilities
curl http://localhost:3100/api/v1/capabilities

# View interactive API documentation (Swagger UI)
open http://localhost:3100/docs
```

---

## API Documentation

### Interactive Swagger UI

Visit **http://localhost:3100/docs** for interactive API documentation with Swagger UI.

Features:
- Browse all endpoints with detailed descriptions
- View request/response schemas
- Try out API calls directly from the browser
- See examples for each endpoint
- Download OpenAPI spec

### OpenAPI Specification

The full OpenAPI 3.0 spec is available at:
```
GET http://localhost:3100/api/v1/openapi.json
```

You can use this spec with:
- **Postman** - Import OpenAPI spec
- **Insomnia** - Import OpenAPI spec
- **Code generators** - Generate client SDKs with openapi-generator
- **API testing tools** - Automate API testing

---

## API Reference

### Base URL

```
http://localhost:3100/api/v1
```

### Authentication

All endpoints (except `/health`) require API key authentication:

```bash
# Using Authorization header
curl -H "Authorization: Bearer your-api-key" http://localhost:3100/api/v1/jobs

# Or using X-API-Key header
curl -H "X-API-Key: your-api-key" http://localhost:3100/api/v1/jobs
```

### Response Format

All responses follow this structure:

**Success Response:**
```json
{
  "jobId": "abc123",
  "status": "queued",
  "pollUrl": "/api/v1/jobs/abc123"
}
```

**Error Response:**
```json
{
  "error": "Missing required field: text"
}
```

---

## Endpoints

### Health & Status

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Basic health check (no auth required) |
| `/health/ready` | GET | Readiness check with queue stats |
| `/api/v1/capabilities` | GET | List all available endpoints |

### Job Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/jobs` | GET | List all jobs with stats |
| `/api/v1/jobs/:id` | GET | Get job status and result |
| `/api/v1/jobs/:id` | DELETE | Cancel a job |

### Video Rendering

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/render/brief` | POST | Render video from brief |
| `/api/v1/render/batch` | POST | Batch render multiple videos |
| `/api/v1/render/batch/:id` | GET | Get batch status |
| `/api/v1/render/static-ad` | POST | Render static ad image |

### Text-to-Speech

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/tts/generate` | POST | Generate speech from text |
| `/api/v1/tts/voice-clone` | POST | Clone voice and generate |
| `/api/v1/tts/multi-language` | POST | Generate in multiple languages |

### Video Generation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/video/generate` | POST | Generate AI video (Sora/LTX/Mochi) |
| `/api/v1/video/image-to-video` | POST | Animate static image |

### Image Generation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/image/character` | POST | Generate AI character |

### Avatar Generation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/avatar/infinitetalk` | POST | Generate talking head video |

---

## Usage Examples

### 1. Render a Video from Brief

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
    "quality": "production"
  }'
```

Response:
```json
{
  "jobId": "abc123",
  "status": "queued",
  "pollUrl": "/api/v1/jobs/abc123"
}
```

### 2. Check Job Status

```bash
curl -H "X-API-Key: dev-api-key" \
  http://localhost:3100/api/v1/jobs/abc123
```

Response:
```json
{
  "id": "abc123",
  "type": "render-brief",
  "status": "completed",
  "result": {
    "videoPath": "./output/my-video.mp4",
    "duration": 60,
    "fileSize": 15728640
  },
  "createdAt": "2026-02-02T12:00:00Z",
  "completedAt": "2026-02-02T12:05:30Z"
}
```

### 3. Generate Text-to-Speech

```bash
curl -X POST http://localhost:3100/api/v1/tts/generate \
  -H "X-API-Key: dev-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world! This is a test.",
    "provider": "openai",
    "voice": "alloy"
  }'
```

### 4. Clone Voice and Generate

```bash
curl -X POST http://localhost:3100/api/v1/tts/voice-clone \
  -H "X-API-Key: dev-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Speak in my voice",
    "voiceReferenceUrl": "https://example.com/my-voice.wav",
    "emotion": "excited"
  }'
```

### 5. Generate AI Video

```bash
curl -X POST http://localhost:3100/api/v1/video/generate \
  -H "X-API-Key: dev-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A robot walking through a neon city at night",
    "model": "ltx",
    "duration": 5,
    "size": "1280x720"
  }'
```

### 6. Batch Render Videos

```bash
curl -X POST http://localhost:3100/api/v1/render/batch \
  -H "X-API-Key: dev-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "videos": [
      {
        "format": "shorts_v1",
        "title": "Video 1",
        "topics": ["AI", "Technology"]
      },
      {
        "format": "explainer_v1",
        "title": "Video 2",
        "topics": ["Space", "Rockets"]
      }
    ],
    "quality": "production",
    "webhook": "http://myapp:8080/webhook"
  }'
```

### 7. Generate Talking Avatar

```bash
curl -X POST http://localhost:3100/api/v1/avatar/infinitetalk \
  -H "X-API-Key: dev-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "audioUrl": "https://example.com/speech.mp3",
    "faceImageUrl": "https://example.com/face.jpg",
    "fps": 25
  }'
```

---

## TypeScript SDK

For easier integration, use the provided TypeScript client:

```typescript
import { RemotionClient } from './src/service/client';

const client = new RemotionClient({
  baseUrl: 'http://localhost:3100',
  apiKey: 'dev-api-key',
});

// Check health
const health = await client.health();
console.log('Service status:', health);

// Render video (async)
const { jobId } = await client.renderBrief({
  brief: {
    id: 'my-video',
    format: 'explainer_v1',
    title: 'How AI Works',
    sections: [],
    style: { theme: 'dark' },
    settings: { duration_sec: 60, fps: 30 },
  },
  quality: 'production',
});

// Wait for completion
const result = await client.waitForJob(jobId);
console.log('Video ready:', result.result?.videoPath);

// Or use sync method
const syncResult = await client.renderBriefSync({
  brief: myBrief,
  quality: 'production',
});
console.log('Video:', syncResult.result?.videoPath);
```

---

## Webhooks

Instead of polling, you can provide a `webhookUrl` to receive notifications:

```bash
curl -X POST http://localhost:3100/api/v1/render/brief \
  -H "X-API-Key: dev-api-key" \
  -d '{
    "brief": {...},
    "webhookUrl": "http://myapp:8080/webhook"
  }'
```

Your webhook will receive:

```json
{
  "event": "job.completed",
  "timestamp": "2026-02-02T12:05:30Z",
  "payload": {
    "jobId": "abc123",
    "type": "render-brief",
    "status": "completed",
    "result": {
      "videoPath": "./output/my-video.mp4",
      "duration": 60,
      "fileSize": 15728640
    },
    "duration": 330000
  }
}
```

---

## Rate Limiting

The service enforces rate limits to prevent abuse:

- **60 requests per minute** (default)
- **1000 requests per hour** (default)

Rate limit headers in responses:

```
X-RateLimit-Remaining-Minute: 58
X-RateLimit-Remaining-Hour: 997
```

When rate limited:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 60

{
  "error": "Rate limit exceeded",
  "remaining": {
    "minute": 0,
    "hour": 45
  }
}
```

---

## Job Queue

The service uses an in-memory job queue with these features:

- **Concurrent Processing** - Process up to 10 jobs simultaneously (configurable)
- **Priority Queuing** - Higher priority jobs processed first
- **Automatic Retries** - Failed jobs retry up to 3 times
- **Timeout Handling** - Jobs timeout after 30 minutes (configurable)
- **Webhook Notifications** - Automatic callbacks on completion

Queue stats available at `/api/v1/jobs`:

```json
{
  "stats": {
    "total": 150,
    "pending": 10,
    "processing": 5,
    "completed": 130,
    "failed": 5,
    "cancelled": 0
  }
}
```

---

## Deployment

### Local Development

```bash
npm run service:dev
```

### Production with PM2

```bash
# Install PM2
npm install -g pm2

# Start service
pm2 start npm --name "remotion-service" -- run service:start

# Monitor
pm2 logs remotion-service
pm2 status

# Auto-restart on reboot
pm2 startup
pm2 save
```

### Docker (Future)

```dockerfile
FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3100
CMD ["npm", "run", "service:start"]
```

---

## Troubleshooting

### Service won't start

1. Check port availability: `lsof -i :3100`
2. Verify environment variables in `.env.service`
3. Check logs for errors

### Jobs failing

1. Check job details: `GET /api/v1/jobs/:id`
2. Verify external API keys (OpenAI, ElevenLabs)
3. Check output directory permissions
4. Review job error messages

### Rate limiting issues

1. Increase limits in `.env.service`:
   ```
   RATE_LIMIT_REQUESTS_PER_MINUTE=120
   RATE_LIMIT_REQUESTS_PER_HOUR=2000
   ```
2. Use different `X-Client-ID` header for separate apps
3. Implement backoff in client code

---

## Security

### Best Practices

1. **Change the default API key** in production
2. **Use HTTPS** in production (reverse proxy with nginx/Caddy)
3. **Restrict CORS origins** to trusted domains
4. **Monitor API usage** and set alerts
5. **Keep dependencies updated** regularly

### API Key Management

```bash
# Generate secure API key
openssl rand -hex 32

# Set in .env.service
REMOTION_SERVICE_API_KEY=your-secure-key-here
```

### Network Security

For production, use a reverse proxy:

```nginx
# nginx example
server {
    listen 443 ssl;
    server_name api.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3100;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Performance

### Optimization Tips

1. **Increase concurrent jobs** for high-throughput:
   ```
   JOB_QUEUE_MAX_CONCURRENT=20
   ```

2. **Use preview quality** for faster renders:
   ```json
   {"quality": "preview"}
   ```

3. **Batch similar jobs** to reduce overhead

4. **Pre-download assets** to avoid API rate limits

5. **Use webhooks** instead of polling to reduce load

---

## Support

- **Documentation**: `/docs` directory
- **Examples**: `src/service/client.ts`
- **Issues**: GitHub Issues
- **API Reference**: `GET /api/v1/capabilities`

---

*Last Updated: 2026-02-02*
