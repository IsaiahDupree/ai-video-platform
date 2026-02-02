# PRD: Remotion Media Service

## Product Requirements Document
**Version:** 1.0  
**Date:** February 2026  
**Status:** Draft

---

## 1. Executive Summary

Transform the Remotion video platform into a **local microservice** that exposes all media generation capabilities via REST APIs. This enables other applications on the same machine (or network) to leverage video rendering, TTS, image generation, and AI content creation without direct code integration.

### Vision
A unified media generation API that any local application can call to:
- Render videos from templates or briefs
- Generate voiceovers with voice cloning
- Create AI-generated images and characters
- Produce static ads and social media content
- Process video-to-video transformations

---

## 2. Problem Statement

**Current State:**
- Capabilities are scattered across scripts, Python services, and TypeScript modules
- No unified API interface for external applications
- Other local servers cannot easily consume these features
- Requires direct code integration to use any capability

**Desired State:**
- Single HTTP server exposing all capabilities
- Standardized REST API with OpenAPI documentation
- Service discovery for local applications
- Webhook callbacks for async job completion
- Health monitoring and status endpoints

---

## 3. Capabilities Inventory

Based on codebase analysis, the following capabilities will be exposed:

### 3.1 Video Rendering

| Capability | Source | API Endpoint |
|------------|--------|--------------|
| Render from Brief | `scripts/render.ts`, `src/api/batch-api.ts` | `POST /api/render/brief` |
| Batch Render | `scripts/batch-render.ts` | `POST /api/render/batch` |
| Explainer Videos | `scripts/generate-explainer.ts` | `POST /api/render/explainer` |
| Static Ad Render | `scripts/render-static-ads.ts` | `POST /api/render/static-ad` |
| Ad Template Render | `src/ad-templates/` | `POST /api/render/ad-template` |

**Video Formats Supported:**
- `explainer_v1` - Educational explainer videos
- `listicle_v1` - List-based content
- `comparison_v1` - Side-by-side comparisons
- `shorts_v1` - Short-form vertical video
- `devvlog_v1` - Developer vlog style

### 3.2 Text-to-Speech (TTS)

| Capability | Source | API Endpoint |
|------------|--------|--------------|
| ElevenLabs TTS | `python/services/video_generation/remotion_video_pipeline.py` | `POST /api/tts/elevenlabs` |
| OpenAI TTS | `python/services/video_generation/remotion_video_pipeline.py` | `POST /api/tts/openai` |
| Hugging Face TTS | `python/services/video_generation/hf_tts_provider.py` | `POST /api/tts/huggingface` |
| IndexTTS2 Voice Cloning | `python/services/tts/worker.py` | `POST /api/tts/voice-clone` |
| Modal Voice Service | `python/services/voice/modal_voice_service.py` | `POST /api/tts/modal` |
| Multi-Language TTS | `src/api/multi-language.ts` | `POST /api/tts/multi-language` |

**Voice Features:**
- Voice cloning with reference audio
- Emotion control (happy, sad, excited, neutral, etc.)
- Multiple language support (EN, ES, FR, DE, JA, KO, PT, ZH)
- Voice profile management

### 3.3 AI Video Generation

| Capability | Source | API Endpoint |
|------------|--------|--------------|
| Sora Video Generation | `python/services/sora_video_pipeline.py` | `POST /api/video/sora` |
| Image-to-Video | `src/api/image-to-video.ts` | `POST /api/video/image-to-video` |
| Video-to-Video | `src/api/video-to-video.ts` | `POST /api/video/transform` |
| Mochi Generation | `src/api/mochi-client.ts` | `POST /api/video/mochi` |
| Wan2.2 Generation | `src/api/wan2-2-client.ts` | `POST /api/video/wan2` |
| Full Pipeline | `python/services/video_generation/full_pipeline.py` | `POST /api/video/pipeline` |

### 3.4 Image & Character Generation

| Capability | Source | API Endpoint |
|------------|--------|--------------|
| DALL-E Character Gen | `python/services/character_generator.py` | `POST /api/image/character` |
| Character Variants | `python/services/character_generator.py` | `POST /api/image/character-variant` |
| Gemini Image Gen | `scripts/remix-character-gemini.ts` | `POST /api/image/gemini` |
| Sticker Generation | `scripts/generate-stickers.py` | `POST /api/image/stickers` |

**Character Styles:**
- cartoon, realistic, mascot, anime
- 3d_render, pixel_art, minimalist, hand_drawn

### 3.5 Audio & Music

| Capability | Source | API Endpoint |
|------------|--------|--------------|
| Music Search (Suno) | `python/services/music/worker.py` | `POST /api/audio/music/search` |
| SoundCloud Integration | `python/services/music/adapters/soundcloud.py` | `POST /api/audio/music/soundcloud` |
| Audio Mixing | `python/services/video_generation/audio_bus_mixer.py` | `POST /api/audio/mix` |
| Audio Ducking | `python/services/video_generation/audio_ducking.py` | `POST /api/audio/duck` |
| SFX Application | `scripts/apply-sfx-policy.ts` | `POST /api/audio/sfx` |

### 3.6 Visual Assets

| Capability | Source | API Endpoint |
|------------|--------|--------------|
| Meme Templates | `python/services/visuals/adapters/meme.py` | `POST /api/visuals/meme` |
| B-Roll Footage | `python/services/visuals/adapters/broll.py` | `POST /api/visuals/broll` |
| UGC Content | `python/services/visuals/adapters/ugc.py` | `POST /api/visuals/ugc` |
| Stock Media (Pexels) | `scripts/fetch-media.ts` | `POST /api/visuals/stock` |

### 3.7 Avatar & Talking Head

| Capability | Source | API Endpoint |
|------------|--------|--------------|
| Custom Avatar Training | `src/api/custom-avatar-training.ts` | `POST /api/avatar/train` |
| InfiniteTalk Avatar | `scripts/modal_infinitetalk.py` | `POST /api/avatar/infinitetalk` |
| Talking Head (Replicate) | `scripts/generate-talking-head-replicate.ts` | `POST /api/avatar/talking-head` |
| SadTalker | `scripts/modal_sadtalker.py` | `POST /api/avatar/sadtalker` |
| Wav2Lip | `scripts/modal_wav2lip.py` | `POST /api/avatar/wav2lip` |

### 3.8 Publishing & Analysis

| Capability | Source | API Endpoint |
|------------|--------|--------------|
| Video Analysis | `python/services/video_ready_pipeline.py` | `POST /api/analyze/video` |
| Virality Scoring | `python/services/video_viral_analyzer.py` | `POST /api/analyze/virality` |
| YouTube Analysis | `scripts/analyze-youtube.py` | `POST /api/analyze/youtube` |
| Social Publishing | `python/services/video_ready_pipeline.py` | `POST /api/publish` |

---

## 4. API Design

### 4.1 Base URL & Discovery

```
http://localhost:3100/api/v1
```

**Service Discovery Endpoint:**
```
GET /api/v1/capabilities
```

Returns list of all available endpoints and their status.

### 4.2 Authentication

```http
Authorization: Bearer <API_KEY>
X-API-Key: <API_KEY>
```

API keys configured via environment variable `REMOTION_SERVICE_API_KEY`.

### 4.3 Standard Request/Response Format

**Request:**
```json
{
  "job_id": "optional-client-provided-id",
  "webhook_url": "http://localhost:8080/callback",
  "priority": "normal",
  "params": {
    // endpoint-specific parameters
  }
}
```

**Response (Async Job):**
```json
{
  "job_id": "job_abc123",
  "status": "queued",
  "estimated_duration_sec": 30,
  "poll_url": "/api/v1/jobs/job_abc123",
  "webhook_registered": true
}
```

**Response (Sync):**
```json
{
  "success": true,
  "result": {
    // endpoint-specific result
  },
  "duration_ms": 1234
}
```

### 4.4 Job Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/jobs` | GET | List all jobs |
| `/api/v1/jobs/:id` | GET | Get job status |
| `/api/v1/jobs/:id` | DELETE | Cancel job |
| `/api/v1/jobs/:id/result` | GET | Get job result |

### 4.5 Health & Metrics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/health/ready` | GET | Readiness probe |
| `/health/live` | GET | Liveness probe |
| `/metrics` | GET | Prometheus metrics |

---

## 5. Core API Endpoints

### 5.1 Video Rendering

#### POST /api/v1/render/brief
Render video from a content brief.

```json
{
  "params": {
    "brief": {
      "id": "my-video",
      "format": "explainer_v1",
      "title": "How AI Works",
      "sections": [...],
      "style": {
        "theme": "dark",
        "primary_color": "#6366f1"
      },
      "settings": {
        "duration_sec": 60,
        "fps": 30
      }
    },
    "quality": "production",
    "output_format": "mp4"
  }
}
```

#### POST /api/v1/render/static-ad
Render static ad image from template.

```json
{
  "params": {
    "template_id": "product-showcase-v1",
    "bindings": {
      "text": {
        "headline": "50% Off Today",
        "subheadline": "Limited time offer"
      },
      "assets": {
        "product_image": "https://..."
      }
    },
    "size": { "width": 1080, "height": 1080 },
    "format": "png"
  }
}
```

### 5.2 Text-to-Speech

#### POST /api/v1/tts/generate
Generate speech from text.

```json
{
  "params": {
    "text": "Hello, this is a test of the voice synthesis system.",
    "provider": "elevenlabs",
    "voice_id": "21m00Tcm4TlvDq8ikWAM",
    "options": {
      "stability": 0.5,
      "similarity_boost": 0.8,
      "style": 0.6
    },
    "output_format": "mp3"
  }
}
```

#### POST /api/v1/tts/voice-clone
Clone voice from reference audio.

```json
{
  "params": {
    "text": "Text to speak in the cloned voice",
    "voice_reference_url": "https://.../reference.mp3",
    "model": "indextts2",
    "emotion": "excited",
    "emotion_weight": 0.8
  }
}
```

### 5.3 AI Video Generation

#### POST /api/v1/video/sora
Generate video clip using Sora.

```json
{
  "params": {
    "prompt": "A robot walking through a neon-lit city at night",
    "duration_seconds": 8,
    "size": "1280x720",
    "model": "sora-2"
  }
}
```

#### POST /api/v1/video/image-to-video
Animate a static image.

```json
{
  "params": {
    "image_url": "https://.../image.png",
    "motion_prompt": "Camera slowly zooms in while the subject blinks",
    "duration_seconds": 5,
    "quality": "balanced"
  }
}
```

### 5.4 Character Generation

#### POST /api/v1/image/character
Generate AI character.

```json
{
  "params": {
    "name": "Alex the Robot",
    "description": "Friendly robot assistant with blue LED eyes",
    "style": "3d_render",
    "expressions": ["neutral", "happy", "thinking"],
    "size": "1024x1024"
  }
}
```

---

## 6. Architecture

### 6.1 Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Remotion Media Service                    │
│                      (localhost:3100)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   API        │  │   Job        │  │   Webhook    │      │
│  │   Gateway    │──│   Queue      │──│   Manager    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                │                  │                │
│         ▼                ▼                  ▼                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Service Router                      │   │
│  └─────────────────────────────────────────────────────┘   │
│         │         │         │         │         │          │
│         ▼         ▼         ▼         ▼         ▼          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  │ Render │ │  TTS   │ │ Video  │ │ Image  │ │ Audio  │   │
│  │ Engine │ │ Engine │ │ Gen    │ │ Gen    │ │ Engine │   │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
    ┌────────────┐      ┌────────────┐      ┌────────────┐
    │   Modal    │      │  OpenAI    │      │ ElevenLabs │
    │   Cloud    │      │    API     │      │    API     │
    └────────────┘      └────────────┘      └────────────┘
```

### 6.2 Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| **API Gateway** | Authentication, rate limiting, request routing |
| **Job Queue** | Async job management, priority queuing, retries |
| **Webhook Manager** | Callback notifications, retry logic |
| **Service Router** | Route requests to appropriate engines |
| **Render Engine** | Remotion video rendering |
| **TTS Engine** | Voice synthesis orchestration |
| **Video Gen** | AI video generation (Sora, Mochi, etc.) |
| **Image Gen** | Character and image generation |
| **Audio Engine** | Music, SFX, mixing |

### 6.3 Configuration

Environment variables in `.env.local`:

```bash
# Service Configuration
REMOTION_SERVICE_PORT=3100
REMOTION_SERVICE_API_KEY=your-secret-key
REMOTION_SERVICE_CORS_ORIGINS=http://localhost:*

# External APIs (existing)
OPENAI_API_KEY=...
ELEVENLABS_API_KEY=...
HF_TOKEN=...
MODAL_VOICE_ENDPOINT=...
MODAL_API_KEY=...

# Service URLs (for other local services to discover)
VIDEO_SERVICE_URL=http://localhost:3100
TTS_SERVICE_URL=http://localhost:3100
IMAGE_SERVICE_URL=http://localhost:3100
```

---

## 7. Implementation Plan

### Phase 1: Core Service (Week 1-2)
- [ ] Create unified HTTP server (`src/service/server.ts`)
- [ ] Implement API Gateway with auth/rate limiting
- [ ] Implement Job Queue with persistence
- [ ] Create `/health` and `/capabilities` endpoints
- [ ] Add OpenAPI spec generation

### Phase 2: Rendering APIs (Week 2-3)
- [ ] `POST /api/v1/render/brief`
- [ ] `POST /api/v1/render/batch`
- [ ] `POST /api/v1/render/static-ad`
- [ ] `POST /api/v1/render/ad-template`

### Phase 3: TTS APIs (Week 3-4)
- [ ] `POST /api/v1/tts/generate`
- [ ] `POST /api/v1/tts/voice-clone`
- [ ] `POST /api/v1/tts/multi-language`
- [ ] Voice profile CRUD endpoints

### Phase 4: Video Generation APIs (Week 4-5)
- [ ] `POST /api/v1/video/sora`
- [ ] `POST /api/v1/video/image-to-video`
- [ ] `POST /api/v1/video/transform`
- [ ] Full pipeline endpoint

### Phase 5: Image & Audio APIs (Week 5-6)
- [ ] Character generation endpoints
- [ ] Music/SFX endpoints
- [ ] Visual asset endpoints

### Phase 6: Avatar APIs (Week 6-7)
- [ ] Avatar training endpoint
- [ ] Talking head generation
- [ ] InfiniteTalk integration

### Phase 7: Documentation & SDK (Week 7-8)
- [ ] OpenAPI documentation
- [ ] Python SDK client
- [ ] TypeScript SDK client
- [ ] Example integrations

---

## 8. Client SDK Examples

### Python Client

```python
from remotion_service import RemotionClient

client = RemotionClient(
    base_url="http://localhost:3100",
    api_key="your-api-key"
)

# Render a video
job = client.render.brief(
    brief=my_brief,
    quality="production",
    webhook_url="http://localhost:8080/callback"
)

# Check status
status = client.jobs.get(job.job_id)

# Generate TTS
audio = client.tts.generate(
    text="Hello world",
    provider="elevenlabs",
    voice_id="..."
)
```

### TypeScript Client

```typescript
import { RemotionClient } from '@remotion-service/client';

const client = new RemotionClient({
  baseUrl: 'http://localhost:3100',
  apiKey: 'your-api-key',
});

// Render a video
const job = await client.render.brief({
  brief: myBrief,
  quality: 'production',
});

// Wait for completion
const result = await client.jobs.waitFor(job.jobId);
```

---

## 9. Security Considerations

1. **API Key Authentication** - Required for all endpoints
2. **Rate Limiting** - Per-client limits to prevent abuse
3. **Input Validation** - Strict schema validation on all inputs
4. **File Access** - Sandboxed file system access
5. **Network Isolation** - Bind to localhost by default
6. **Audit Logging** - Log all API calls with timestamps

---

## 10. Success Metrics

| Metric | Target |
|--------|--------|
| API Response Time (p95) | < 100ms for sync endpoints |
| Job Queue Throughput | 100+ concurrent jobs |
| Service Uptime | 99.9% |
| Error Rate | < 0.1% |
| SDK Adoption | 3+ internal services using SDK |

---

## 11. Dependencies

### Required
- Node.js 18+
- Python 3.11+
- FFmpeg
- Chromium (for Remotion)

### External Services
- OpenAI API
- ElevenLabs API
- Hugging Face API
- Modal (for GPU workloads)
- Pexels API (stock media)

---

## 12. Open Questions

1. Should we support gRPC in addition to REST?
2. What's the job retention policy (how long to keep completed jobs)?
3. Should we implement service mesh (Consul, etc.) for discovery?
4. What's the authentication model for internal vs external clients?

---

## Appendix A: Full Endpoint List

```
# Core
GET  /health
GET  /health/ready
GET  /health/live
GET  /metrics
GET  /api/v1/capabilities

# Jobs
GET  /api/v1/jobs
GET  /api/v1/jobs/:id
DELETE /api/v1/jobs/:id
GET  /api/v1/jobs/:id/result

# Rendering
POST /api/v1/render/brief
POST /api/v1/render/batch
POST /api/v1/render/explainer
POST /api/v1/render/static-ad
POST /api/v1/render/ad-template

# TTS
POST /api/v1/tts/generate
POST /api/v1/tts/voice-clone
POST /api/v1/tts/multi-language
GET  /api/v1/tts/voices
POST /api/v1/tts/voices
GET  /api/v1/tts/voices/:id
DELETE /api/v1/tts/voices/:id

# Video Generation
POST /api/v1/video/sora
POST /api/v1/video/image-to-video
POST /api/v1/video/transform
POST /api/v1/video/mochi
POST /api/v1/video/wan2
POST /api/v1/video/pipeline

# Image Generation
POST /api/v1/image/character
POST /api/v1/image/character-variant
POST /api/v1/image/gemini
POST /api/v1/image/stickers

# Audio
POST /api/v1/audio/music/search
POST /api/v1/audio/music/generate
POST /api/v1/audio/mix
POST /api/v1/audio/duck
POST /api/v1/audio/sfx

# Visuals
POST /api/v1/visuals/meme
POST /api/v1/visuals/broll
POST /api/v1/visuals/ugc
POST /api/v1/visuals/stock

# Avatar
POST /api/v1/avatar/train
GET  /api/v1/avatar/training/:id
POST /api/v1/avatar/infinitetalk
POST /api/v1/avatar/talking-head
POST /api/v1/avatar/sadtalker
POST /api/v1/avatar/wav2lip

# Analysis
POST /api/v1/analyze/video
POST /api/v1/analyze/virality
POST /api/v1/analyze/youtube

# Publishing
POST /api/v1/publish
```

---

## Appendix B: Existing Code Mapping

| API Endpoint | Existing Code Location |
|--------------|----------------------|
| `/render/brief` | `scripts/render.ts`, `src/api/batch-api.ts` |
| `/render/batch` | `scripts/batch-api-server.ts` |
| `/render/static-ad` | `scripts/render-static-ads.ts` |
| `/tts/generate` | `python/services/video_generation/remotion_video_pipeline.py` |
| `/tts/voice-clone` | `python/services/voice/modal_voice_service.py` |
| `/video/sora` | `python/services/sora_video_pipeline.py` |
| `/video/image-to-video` | `src/api/image-to-video.ts` |
| `/video/transform` | `src/api/video-to-video.ts` |
| `/image/character` | `python/services/character_generator.py` |
| `/audio/music/*` | `python/services/music/worker.py` |
| `/visuals/*` | `python/services/visuals/worker.py` |
| `/avatar/train` | `src/api/custom-avatar-training.ts` |
| `/avatar/infinitetalk` | `scripts/modal_infinitetalk.py` |
| `/analyze/video` | `python/services/video_ready_pipeline.py` |
