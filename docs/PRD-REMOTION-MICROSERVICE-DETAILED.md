# PRD: Remotion Media Service (Detailed)

## Product Requirements Document
**Version:** 2.0  
**Date:** February 2026  
**Status:** Draft  
**Author:** Engineering Team

---

# Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Non-Goals](#3-goals--non-goals)
4. [User Stories](#4-user-stories)
5. [System Architecture](#5-system-architecture)
6. [Capabilities Inventory (Detailed)](#6-capabilities-inventory-detailed)
7. [API Specification](#7-api-specification)
8. [Data Models & Schemas](#8-data-models--schemas)
9. [Error Handling](#9-error-handling)
10. [Configuration](#10-configuration)
11. [Security](#11-security)
12. [Deployment](#12-deployment)
13. [Monitoring & Observability](#13-monitoring--observability)
14. [Implementation Roadmap](#14-implementation-roadmap)
15. [SDK Documentation](#15-sdk-documentation)
16. [Appendices](#16-appendices)

---

# 1. Executive Summary

## 1.1 Vision

Transform the Remotion video platform into a **local microservice** that exposes all media generation capabilities via REST APIs. This enables other applications on the same machine (or network) to leverage:

- **Video Rendering** - Remotion compositions, static ads, templates
- **Text-to-Speech** - ElevenLabs, OpenAI, Modal voice cloning, IndexTTS2
- **AI Video Generation** - Sora, Mochi, Wan2.2, image-to-video
- **Image Generation** - DALL-E characters, Gemini, stickers
- **Audio Processing** - Music search, mixing, ducking, SFX
- **Avatar Generation** - InfiniteTalk, SadTalker, Wav2Lip, custom training
- **Content Analysis** - Virality scoring, transcription, publishing

## 1.2 Service Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                 REMOTION MEDIA SERVICE                          │
│                   http://localhost:3100                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│   │   REST API  │  │  WebSocket  │  │   Webhooks  │            │
│   │   Gateway   │  │   Events    │  │   Callbacks │            │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│          │                │                │                    │
│          └────────────────┼────────────────┘                    │
│                           │                                     │
│                    ┌──────▼──────┐                              │
│                    │  Job Queue  │                              │
│                    │  (Redis)    │                              │
│                    └──────┬──────┘                              │
│                           │                                     │
│     ┌─────────┬───────────┼───────────┬─────────┐              │
│     │         │           │           │         │              │
│     ▼         ▼           ▼           ▼         ▼              │
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐             │
│ │Render │ │  TTS  │ │ Video │ │ Image │ │ Audio │             │
│ │Engine │ │Engine │ │  Gen  │ │  Gen  │ │Engine │             │
│ └───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘             │
│     │         │         │         │         │                  │
└─────┼─────────┼─────────┼─────────┼─────────┼──────────────────┘
      │         │         │         │         │
      ▼         ▼         ▼         ▼         ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Remotion │ │ElevenLabs│ │  OpenAI  │ │  Modal   │
│ Renderer │ │   API    │ │ Sora API │ │  Cloud   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

## 1.3 Key Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time (sync) | < 100ms p95 | Health checks, metadata |
| Job Queue Throughput | 100 concurrent | Video renders, TTS jobs |
| Service Availability | 99.9% | Uptime monitoring |
| Error Rate | < 0.1% | Failed requests / total |

---

# 2. Problem Statement

## 2.1 Current State

The Remotion codebase contains powerful media generation capabilities, but they are:

1. **Fragmented** - Spread across 74+ scripts, 149+ Python service files
2. **CLI-Only** - Most features require command-line execution
3. **No API Layer** - Other applications cannot call these features
4. **Tightly Coupled** - Direct imports required for any integration
5. **No Job Management** - Long-running tasks block execution

**Current Usage Example:**
```bash
# Must SSH in or have direct access
npx tsx scripts/render.ts data/briefs/my_video.json output.mp4
python scripts/modal_infinitetalk.py --audio audio.mp3 --image face.png
```

## 2.2 Desired State

A unified HTTP service that any local application can consume:

**Desired Usage Example:**
```bash
# Any app can call the API
curl -X POST http://localhost:3100/api/v1/render/brief \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"brief": {...}, "webhook_url": "http://myapp:8080/callback"}'

# Response: {"job_id": "job_abc123", "status": "queued"}
```

## 2.3 Impact

| Stakeholder | Impact |
|-------------|--------|
| **Internal Apps** | Can request video/audio generation via HTTP |
| **Automation** | CI/CD pipelines can trigger renders |
| **Other Services** | Microservices can compose media workflows |
| **Development** | Faster iteration with API-first approach |

---

# 3. Goals & Non-Goals

## 3.1 Goals

- **G1**: Expose ALL existing capabilities via REST API
- **G2**: Support async jobs with webhooks and polling
- **G3**: Provide health/readiness endpoints for orchestration
- **G4**: Generate OpenAPI spec for auto-documentation
- **G5**: Create Python and TypeScript SDK clients
- **G6**: Support local file paths AND URLs for media inputs
- **G7**: Implement rate limiting and authentication

## 3.2 Non-Goals (v1)

- **NG1**: Multi-tenant cloud deployment (local only for v1)
- **NG2**: User management / accounts (API key auth only)
- **NG3**: Billing integration
- **NG4**: gRPC support (REST only for v1)
- **NG5**: Distributed job processing (single-node only)

---

# 4. User Stories

## 4.1 As a Local Application Developer

```
US-1: As a developer, I want to render videos via HTTP
      So that my app can generate content without CLI access
      
US-2: As a developer, I want webhook callbacks on job completion
      So that I don't need to poll for status

US-3: As a developer, I want to clone voices from reference audio
      So that I can create personalized voiceovers

US-4: As a developer, I want to generate AI video from prompts
      So that I can create dynamic content programmatically
```

## 4.2 As an Operations Engineer

```
US-5: As an ops engineer, I want health check endpoints
      So that I can monitor service availability

US-6: As an ops engineer, I want Prometheus metrics
      So that I can track performance and errors

US-7: As an ops engineer, I want structured logging
      So that I can debug issues efficiently
```

---

# 5. System Architecture

## 5.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │    Auth      │  │ Rate Limit   │  │   CORS       │  │  Logging    │ │
│  │  Middleware  │  │  Middleware  │  │  Middleware  │  │ Middleware  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           ROUTER                                         │
│                                                                         │
│   /api/v1/render/*    → RenderController                               │
│   /api/v1/tts/*       → TTSController                                  │
│   /api/v1/video/*     → VideoGenController                             │
│   /api/v1/image/*     → ImageGenController                             │
│   /api/v1/audio/*     → AudioController                                │
│   /api/v1/avatar/*    → AvatarController                               │
│   /api/v1/analyze/*   → AnalysisController                             │
│   /api/v1/jobs/*      → JobController                                  │
│   /health             → HealthController                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                                    │
│                                                                         │
│   RenderService        TTSService          VideoGenService              │
│   - renderBrief()      - generate()        - generateSora()            │
│   - renderBatch()      - cloneVoice()      - imageToVideo()            │
│   - renderStaticAd()   - multiLanguage()   - videoToVideo()            │
│                                                                         │
│   ImageGenService      AudioService        AvatarService                │
│   - generateChar()     - searchMusic()     - trainAvatar()             │
│   - generateVariant()  - mixAudio()        - generateTalkingHead()     │
│   - generateSticker()  - applySFX()        - infiniteTalk()            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          JOB QUEUE                                       │
│                                                                         │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                │
│   │   Pending   │ -> │  Processing │ -> │  Completed  │                │
│   │   Queue     │    │   Workers   │    │   Results   │                │
│   └─────────────┘    └─────────────┘    └─────────────┘                │
│                                                                         │
│   Features:                                                             │
│   - Priority queuing (urgent, high, normal, low)                       │
│   - Retry with exponential backoff                                     │
│   - Job timeout handling                                               │
│   - Webhook notification on completion                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL INTEGRATIONS                                │
│                                                                         │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐          │
│   │  Remotion │  │  OpenAI   │  │ ElevenLabs│  │   Modal   │          │
│   │  Renderer │  │  (Sora,   │  │    TTS    │  │  (Voice,  │          │
│   │           │  │  DALL-E)  │  │           │  │  Avatar)  │          │
│   └───────────┘  └───────────┘  └───────────┘  └───────────┘          │
│                                                                         │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐          │
│   │  Hugging  │  │  Pexels   │  │   Suno    │  │ Replicate │          │
│   │   Face    │  │  (Stock)  │  │  (Music)  │  │ (Models)  │          │
│   └───────────┘  └───────────┘  └───────────┘  └───────────┘          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 5.2 Data Flow

### Synchronous Request Flow
```
Client → API Gateway → Auth → Controller → Service → Response
         (< 100ms typical)
```

### Asynchronous Job Flow
```
1. Client → POST /api/v1/render/brief
2. API → Validate → Create Job → Return job_id (immediate)
3. Job Queue → Pick up job → Process
4. Worker → Call Remotion/OpenAI/etc
5. Worker → Store result → Update job status
6. Webhook → POST to client callback URL
   OR
   Client → GET /api/v1/jobs/{id} (polling)
```

## 5.3 File Handling

```
Input Options:
├── Local file path:  "/Users/me/video.mp4"
├── HTTP URL:         "https://example.com/video.mp4"
├── Base64 data:      "data:video/mp4;base64,..."
└── Uploaded file:    multipart/form-data

Output Options:
├── Local file path:  Write to specified path
├── Presigned URL:    Return temporary download URL
└── Base64 data:      Return in response body (small files)
```

---

# 6. Capabilities Inventory (Detailed)

## 6.1 Video Rendering

### 6.1.1 Render from Brief

**Source Files:**
- `scripts/render.ts`
- `src/api/batch-api.ts`
- `src/compositions/BriefComposition.tsx`

**Capability:**
Render a complete video from a ContentBrief JSON structure. Supports multiple formats (explainer, listicle, comparison, shorts, devvlog).

**Input:**
```typescript
interface RenderBriefRequest {
  brief: ContentBrief;           // Full brief structure
  quality: 'preview' | 'production';
  output_format: 'mp4' | 'webm' | 'gif';
  output_path?: string;          // Optional local path
}

interface ContentBrief {
  id: string;
  format: 'explainer_v1' | 'listicle_v1' | 'comparison_v1' | 'shorts_v1' | 'devvlog_v1';
  title: string;
  sections: Section[];
  style: StyleConfig;
  settings: {
    duration_sec: number;
    fps: number;
  };
  audio?: {
    voiceover?: string;
    music?: string;
    volume_voice?: number;
    volume_music?: number;
  };
}
```

**Output:**
```typescript
interface RenderBriefResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  video_path?: string;
  video_url?: string;
  duration_seconds?: number;
  file_size_bytes?: number;
  render_time_seconds?: number;
}
```

### 6.1.2 Render Static Ad

**Source Files:**
- `scripts/render-static-ads.ts`
- `src/ad-templates/renderer/TemplateRenderer.tsx`
- `src/ad-templates/schema/template-dsl.ts`

**Capability:**
Render static ad images from pixel-accurate templates with text/image binding.

**Input:**
```typescript
interface RenderStaticAdRequest {
  template: TemplateDSL | string;  // Template object or template_id
  bindings: {
    text: Record<string, string>;
    assets: Record<string, string>;
  };
  size?: { width: number; height: number };
  format: 'png' | 'jpg' | 'webp';
  quality?: number;  // 1-100 for jpg/webp
}

interface TemplateDSL {
  canvas: {
    width: number;
    height: number;
    bgColor?: string;
  };
  layers: Layer[];
  bindings: {
    text: Record<string, string>;
    assets: Record<string, string>;
  };
}
```

### 6.1.3 Batch Render

**Source Files:**
- `scripts/batch-api-server.ts`
- `src/api/batch-api.ts`

**Capability:**
Submit multiple videos for parallel rendering with batch tracking.

**Input:**
```typescript
interface BatchRenderRequest {
  videos: GeneratorInput[];
  output_dir?: string;
  quality: 'preview' | 'production';
  webhook_url?: string;
  max_concurrent?: number;  // Default: 3
}

interface GeneratorInput {
  format: string;
  title: string;
  subtitle?: string;
  topics?: string[];
  theme?: string;
  duration_per_topic?: number;
}
```

---

## 6.2 Text-to-Speech (TTS)

### 6.2.1 ElevenLabs TTS

**Source Files:**
- `python/services/video_generation/remotion_video_pipeline.py` (lines 137-177)

**Capability:**
Generate high-quality speech using ElevenLabs API with voice selection and tuning.

**Input:**
```typescript
interface ElevenLabsTTSRequest {
  text: string;
  voice_id: string;
  model_id?: string;  // Default: eleven_monolingual_v1
  voice_settings?: {
    stability: number;        // 0.0-1.0, default 0.3
    similarity_boost: number; // 0.0-1.0, default 0.85
    style: number;            // 0.0-1.0, default 0.6
    use_speaker_boost: boolean;
  };
  output_format?: 'mp3' | 'wav' | 'ogg';
}
```

**Output:**
```typescript
interface TTSResponse {
  job_id: string;
  audio_path?: string;
  audio_url?: string;
  duration_seconds: number;
  character_count: number;
  model_used: string;
}
```

### 6.2.2 Voice Cloning (Modal/IndexTTS2)

**Source Files:**
- `python/services/voice/modal_voice_service.py`
- `python/services/tts/worker.py`
- `python/services/tts/adapters/indextts2.py`

**Capability:**
Clone a voice from reference audio and generate speech in that voice.

**Input:**
```typescript
interface VoiceCloneRequest {
  text: string;
  voice_reference_url: string;  // URL to reference audio (3-30 sec)
  model?: 'indextts2' | 'xtts' | 'modal';
  options?: {
    speed: number;           // 0.5-2.0
    pitch: number;           // -50 to +50 (%)
    emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'excited';
    emotion_weight: number;  // 0.0-1.0
    stability: number;       // 0.0-1.0
  };
}
```

**Voice Profile Management:**
```typescript
// Create persistent voice profile
POST /api/v1/tts/voices
{
  "name": "My Custom Voice",
  "reference_urls": ["url1.mp3", "url2.mp3"],
  "description": "Professional male narrator"
}

// Use profile for generation
POST /api/v1/tts/generate
{
  "text": "Hello world",
  "voice_profile_id": "vp_abc123"
}
```

### 6.2.3 Multi-Language TTS

**Source Files:**
- `src/api/multi-language.ts`

**Capability:**
Generate speech in multiple languages with appropriate voices.

**Supported Languages:**
| Code | Language | ElevenLabs Voice | OpenAI Voice |
|------|----------|-----------------|--------------|
| en | English | 21m00Tcm4TlvDq8ikWAM | alloy |
| es | Spanish | AZnzlk1XvdvUeBnXmlld | nova |
| fr | French | ThT5KcBeYPX3keUQqHPh | shimmer |
| de | German | ErXwobaYiN019PkySvjV | onyx |
| ja | Japanese | Xb7hH8MSUJpSbSDYk0k2 | echo |
| ko | Korean | jBpfuIE2acCO8z3wKNLl | fable |
| pt | Portuguese | GBv7mTt0atIp3Br8iCZE | alloy |
| zh | Chinese | g5CIjZEefAph4nQFvHAz | nova |

---

## 6.3 AI Video Generation

### 6.3.1 Sora Video Generation

**Source Files:**
- `python/services/sora_video_pipeline.py`
- `python/services/video_generation/sora_runner.py`
- `python/services/video_providers/sora_provider.py`

**Capability:**
Generate video clips using OpenAI Sora with text prompts.

**Input:**
```typescript
interface SoraGenerateRequest {
  prompt: string;
  duration_seconds: 4 | 8 | 12;
  size: '1280x720' | '720x1280' | '1080x1080' | '1920x1080';
  model?: 'sora-2';
  style_preset?: string;  // Optional style guidance
  reference_image_url?: string;  // Image-to-video
}
```

**Output:**
```typescript
interface SoraGenerateResponse {
  job_id: string;
  sora_generation_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  duration_seconds?: number;
  estimated_cost_usd?: number;
}
```

### 6.3.2 Image-to-Video

**Source Files:**
- `src/api/image-to-video.ts`

**Capability:**
Animate static images with motion prompts.

**Input:**
```typescript
interface ImageToVideoRequest {
  image_url?: string;
  image_base64?: string;
  image_path?: string;
  motion_prompt: string;
  duration_seconds?: number;  // Default: 5
  fps?: number;               // Default: 24
  resolution?: '512x512' | '768x512' | '512x768';
  quality?: 'draft' | 'balanced' | 'quality';
}
```

**Motion Prompt Templates:**
```typescript
const MOTION_TEMPLATES = {
  panLeft: "Camera pans smoothly from right to left",
  panRight: "Camera pans smoothly from left to right",
  zoomIn: "Camera smoothly zooms in toward center",
  zoomOut: "Camera smoothly zooms out from center",
  parallax: "Subtle parallax scrolling with depth",
  floating: "Gentle floating up and down motion",
  shimmer: "Subtle shimmer and pulse effect",
  productShowcase: "Product slowly rotates, highlighting details",
};
```

### 6.3.3 Video-to-Video Transform

**Source Files:**
- `src/api/video-to-video.ts`

**Capability:**
Apply style transfer, upscaling, or enhancement to existing video.

**Input:**
```typescript
interface VideoTransformRequest {
  video_url?: string;
  video_path?: string;
  style_prompt: string;
  enhancement_type: 'style-transfer' | 'upscale' | 'denoise' | 'colorize' | 'super-resolution';
  model?: 'wan2.2' | 'mochi' | 'real-esrgan' | 'gfpgan';
  output_resolution?: '720p' | '1080p' | '4K';
  strength?: number;  // 0.0-1.0
  preserve_motion?: boolean;
}
```

---

## 6.4 Image & Character Generation

### 6.4.1 AI Character Generation

**Source Files:**
- `python/services/character_generator.py`

**Capability:**
Generate consistent AI characters using DALL-E 3 with style presets.

**Input:**
```typescript
interface CharacterGenerateRequest {
  name: string;
  description: string;
  style: 'cartoon' | 'realistic' | 'mascot' | 'anime' | '3d_render' | 'pixel_art' | 'minimalist' | 'hand_drawn';
  expressions?: ('neutral' | 'happy' | 'excited' | 'surprised' | 'thinking' | 'sad' | 'angry')[];
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  workspace_id?: string;
}
```

**Output:**
```typescript
interface CharacterGenerateResponse {
  character_id: string;
  name: string;
  images: {
    expression: string;
    url: string;
    path: string;
  }[];
  style_prompt: string;  // For consistency in future generations
}
```

### 6.4.2 Character Variants

**Capability:**
Generate additional expressions/poses for existing character.

**Input:**
```typescript
interface CharacterVariantRequest {
  character_id: string;
  expressions: string[];
  poses?: string[];
  outfits?: string[];
}
```

---

## 6.5 Audio & Music

### 6.5.1 Music Search

**Source Files:**
- `python/services/music/worker.py`
- `python/services/music/adapters/suno.py`
- `python/services/music/adapters/soundcloud.py`

**Capability:**
Search for royalty-free music by mood, genre, or keywords.

**Input:**
```typescript
interface MusicSearchRequest {
  source: 'suno' | 'soundcloud' | 'social_platform';
  search_criteria: {
    query?: string;
    mood?: 'upbeat' | 'calm' | 'dramatic' | 'happy' | 'sad';
    genre?: string;
    duration_min?: number;
    duration_max?: number;
    bpm_min?: number;
    bpm_max?: number;
  };
  limit?: number;
}
```

### 6.5.2 Audio Mixing

**Source Files:**
- `python/services/video_generation/audio_bus_mixer.py`
- `python/services/video_generation/audio_ducking.py`

**Capability:**
Mix multiple audio tracks with volume control and ducking.

**Input:**
```typescript
interface AudioMixRequest {
  tracks: {
    url: string;
    type: 'voiceover' | 'music' | 'sfx';
    volume: number;  // 0.0-1.0
    start_time?: number;
    fade_in?: number;
    fade_out?: number;
  }[];
  ducking?: {
    enabled: boolean;
    duck_to: number;  // Volume to duck to (0.0-1.0)
    attack_ms: number;
    release_ms: number;
  };
  output_format: 'mp3' | 'wav' | 'aac';
}
```

---

## 6.6 Avatar & Talking Head

### 6.6.1 InfiniteTalk Avatar

**Source Files:**
- `scripts/modal_infinitetalk.py`
- `src/api/infinitetalk-multi-gpu-client.ts`

**Capability:**
Generate talking head video from audio and face image using InfiniteTalk model.

**Input:**
```typescript
interface InfiniteTalkRequest {
  audio_url: string;
  face_image_url: string;
  output_resolution?: '512x512' | '256x256';
  fps?: number;
  use_fp8?: boolean;  // Faster inference
  multi_gpu?: boolean;
}
```

### 6.6.2 Custom Avatar Training

**Source Files:**
- `src/api/custom-avatar-training.ts`
- `scripts/custom_avatar_training.py`

**Capability:**
Train a custom avatar from video footage.

**Input:**
```typescript
interface AvatarTrainingRequest {
  video_url: string;
  avatar_name: string;
  backend?: 'infinitetalk' | 'sadtalker';
  training_config?: {
    epochs: number;
    batch_size: number;
    learning_rate: number;
    frame_rate: number;
  };
}
```

**Output:**
```typescript
interface AvatarTrainingResponse {
  job_id: string;
  avatar_id: string;
  status: 'uploading' | 'training' | 'completed' | 'failed';
  progress?: number;
  estimated_time_remaining?: number;
  model_path?: string;
}
```

---

## 6.7 Content Analysis

### 6.7.1 Video Analysis

**Source Files:**
- `python/services/video_ready_pipeline.py`
- `python/services/video_analyzer.py`

**Capability:**
Analyze video content using AI for transcription, topics, virality prediction.

**Input:**
```typescript
interface VideoAnalysisRequest {
  video_url: string;
  analysis_types: ('transcript' | 'topics' | 'virality' | 'captions' | 'hook')[];
}
```

**Output:**
```typescript
interface VideoAnalysisResponse {
  transcript: string;
  summary: string;
  detected_topics: string[];
  virality_score: number;  // 0-100
  suggested_caption: string;
  hashtags: string[];
  hook_analysis: {
    hook_text: string;
    hook_type: 'question' | 'statement' | 'shock' | 'curiosity';
    hook_strength: number;  // 1-10
  };
  platform_captions: {
    youtube_title: string;
    youtube_description: string;
    tiktok_caption: string;
    instagram_caption: string;
  };
}
```

---

# 7. API Specification

## 7.1 Base Configuration

```
Base URL: http://localhost:3100/api/v1
Content-Type: application/json
Authentication: Bearer token or X-API-Key header
```

## 7.2 Authentication

All endpoints (except /health) require authentication:

```http
Authorization: Bearer <API_KEY>
# OR
X-API-Key: <API_KEY>
```

## 7.3 Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-02-01T19:48:00Z",
    "duration_ms": 45
  }
}
```

### Async Job Response
```json
{
  "success": true,
  "data": {
    "job_id": "job_abc123",
    "status": "queued",
    "estimated_duration_sec": 30,
    "poll_url": "/api/v1/jobs/job_abc123",
    "webhook_registered": true
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input: 'text' is required",
    "details": {
      "field": "text",
      "constraint": "required"
    }
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-02-01T19:48:00Z"
  }
}
```

## 7.4 Complete Endpoint Reference

### Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/ready` | Readiness probe (dependencies OK) |
| GET | `/health/live` | Liveness probe |
| GET | `/metrics` | Prometheus metrics |
| GET | `/api/v1/capabilities` | List all available endpoints |

### Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/jobs` | List jobs (with filters) |
| GET | `/api/v1/jobs/:id` | Get job status |
| DELETE | `/api/v1/jobs/:id` | Cancel job |
| GET | `/api/v1/jobs/:id/result` | Get job result |
| GET | `/api/v1/jobs/:id/logs` | Get job logs |

### Rendering

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/render/brief` | Render video from brief |
| POST | `/api/v1/render/batch` | Batch render multiple videos |
| POST | `/api/v1/render/static-ad` | Render static ad image |
| POST | `/api/v1/render/ad-template` | Render from ad template |
| POST | `/api/v1/render/explainer` | Generate explainer video |
| GET | `/api/v1/render/formats` | List available formats |
| GET | `/api/v1/render/templates` | List ad templates |

### Text-to-Speech

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/tts/generate` | Generate speech |
| POST | `/api/v1/tts/voice-clone` | Clone voice and generate |
| POST | `/api/v1/tts/multi-language` | Multi-language generation |
| GET | `/api/v1/tts/voices` | List available voices |
| POST | `/api/v1/tts/voices` | Create voice profile |
| GET | `/api/v1/tts/voices/:id` | Get voice profile |
| DELETE | `/api/v1/tts/voices/:id` | Delete voice profile |
| GET | `/api/v1/tts/providers` | List TTS providers |

### Video Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/video/sora` | Generate with Sora |
| POST | `/api/v1/video/image-to-video` | Animate image |
| POST | `/api/v1/video/transform` | Video-to-video |
| POST | `/api/v1/video/mochi` | Generate with Mochi |
| POST | `/api/v1/video/wan2` | Generate with Wan2.2 |
| POST | `/api/v1/video/pipeline` | Full pipeline |
| GET | `/api/v1/video/models` | List available models |

### Image Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/image/character` | Generate character |
| POST | `/api/v1/image/character/:id/variant` | Generate variant |
| POST | `/api/v1/image/gemini` | Generate with Gemini |
| POST | `/api/v1/image/stickers` | Generate stickers |
| GET | `/api/v1/image/characters` | List characters |
| GET | `/api/v1/image/styles` | List style presets |

### Audio

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/audio/music/search` | Search music |
| POST | `/api/v1/audio/music/download` | Download track |
| POST | `/api/v1/audio/mix` | Mix audio tracks |
| POST | `/api/v1/audio/duck` | Apply ducking |
| POST | `/api/v1/audio/sfx` | Apply SFX |
| GET | `/api/v1/audio/sources` | List music sources |

### Visuals

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/visuals/meme` | Get meme template |
| POST | `/api/v1/visuals/broll` | Get B-roll footage |
| POST | `/api/v1/visuals/ugc` | Get UGC content |
| POST | `/api/v1/visuals/stock` | Search stock media |

### Avatar

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/avatar/train` | Start avatar training |
| GET | `/api/v1/avatar/training/:id` | Training status |
| POST | `/api/v1/avatar/infinitetalk` | Generate with InfiniteTalk |
| POST | `/api/v1/avatar/talking-head` | Generic talking head |
| POST | `/api/v1/avatar/sadtalker` | Generate with SadTalker |
| POST | `/api/v1/avatar/wav2lip` | Generate with Wav2Lip |
| GET | `/api/v1/avatar/models` | List trained avatars |

### Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/analyze/video` | Analyze video |
| POST | `/api/v1/analyze/virality` | Predict virality |
| POST | `/api/v1/analyze/youtube` | Analyze YouTube video |
| POST | `/api/v1/analyze/transcript` | Transcribe audio |

### Publishing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/publish` | Publish to platforms |
| GET | `/api/v1/publish/platforms` | List platforms |

---

# 8. Data Models & Schemas

## 8.1 Core Models

### Job

```typescript
interface Job {
  id: string;                    // job_abc123
  type: string;                  // render.brief, tts.generate, etc.
  status: JobStatus;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  created_at: string;            // ISO 8601
  started_at?: string;
  completed_at?: string;
  input: Record<string, any>;    // Original request
  result?: Record<string, any>;  // Output on completion
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  progress?: number;             // 0.0 - 1.0
  webhook_url?: string;
  retries: number;
  max_retries: number;
}

type JobStatus = 
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';
```

### ContentBrief

```typescript
interface ContentBrief {
  id: string;
  format: VideoFormat;
  title: string;
  description?: string;
  sections: Section[];
  style: StyleConfig;
  settings: VideoSettings;
  audio?: AudioConfig;
  metadata?: Record<string, any>;
}

interface Section {
  id: string;
  type: SectionType;
  start_time_sec: number;
  duration_sec: number;
  content: Record<string, any>;
}

type SectionType = 
  | 'intro'
  | 'topic'
  | 'list_item'
  | 'comparison'
  | 'outro'
  | 'transition';

interface StyleConfig {
  theme: 'dark' | 'light' | 'neon' | 'minimal';
  primary_color: string;
  accent_color: string;
  background_type: 'solid' | 'gradient' | 'image';
  background_value: string;
  font_family?: string;
}

interface VideoSettings {
  duration_sec: number;
  fps: number;
  resolution?: {
    width: number;
    height: number;
  };
}
```

### VoiceProfile

```typescript
interface VoiceProfile {
  id: string;
  name: string;
  description?: string;
  reference_urls: string[];
  embedding_id?: string;       // From Modal service
  quality_score?: number;
  created_at: string;
  last_used_at?: string;
  usage_count: number;
  metadata?: {
    language?: string;
    gender?: string;
    age_range?: string;
  };
}
```

### Character

```typescript
interface Character {
  id: string;
  name: string;
  description: string;
  style: CharacterStyle;
  style_prompt: string;        // Full prompt for consistency
  variants: CharacterVariant[];
  workspace_id?: string;
  created_at: string;
}

interface CharacterVariant {
  id: string;
  expression: string;
  image_url: string;
  image_path: string;
  created_at: string;
}

type CharacterStyle = 
  | 'cartoon'
  | 'realistic'
  | 'mascot'
  | 'anime'
  | '3d_render'
  | 'pixel_art'
  | 'minimalist'
  | 'hand_drawn';
```

---

# 9. Error Handling

## 9.1 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `AUTHENTICATION_ERROR` | 401 | Missing or invalid API key |
| `AUTHORIZATION_ERROR` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `PROVIDER_ERROR` | 502 | External API failure |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily down |
| `JOB_TIMEOUT` | 504 | Job exceeded time limit |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## 9.2 Error Response Examples

### Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "errors": [
        {"field": "text", "message": "text is required"},
        {"field": "voice_id", "message": "invalid voice_id format"}
      ]
    }
  }
}
```

### Provider Error
```json
{
  "success": false,
  "error": {
    "code": "PROVIDER_ERROR",
    "message": "ElevenLabs API returned error",
    "details": {
      "provider": "elevenlabs",
      "status_code": 429,
      "provider_message": "Rate limit exceeded"
    }
  }
}
```

## 9.3 Retry Logic

| Error Type | Retry | Backoff |
|------------|-------|---------|
| Network timeout | Yes | Exponential |
| Rate limit (429) | Yes | Use Retry-After header |
| Server error (5xx) | Yes | Exponential |
| Validation (4xx) | No | - |
| Auth error (401/403) | No | - |

---

# 10. Configuration

## 10.1 Environment Variables

```bash
# =============================================================================
# Service Configuration
# =============================================================================
REMOTION_SERVICE_PORT=3100
REMOTION_SERVICE_HOST=localhost
REMOTION_SERVICE_API_KEY=your-secret-api-key
REMOTION_SERVICE_LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=60
RATE_LIMIT_REQUESTS_PER_HOUR=1000
RATE_LIMIT_BURST_SIZE=10

# Job Queue
JOB_QUEUE_MAX_CONCURRENT=10
JOB_QUEUE_DEFAULT_TIMEOUT_MS=1800000  # 30 minutes
JOB_QUEUE_MAX_RETRIES=3

# CORS
CORS_ENABLED=true
CORS_ORIGINS=http://localhost:*,http://127.0.0.1:*

# =============================================================================
# External API Keys (existing from .env.local)
# =============================================================================
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=sk_...
HF_TOKEN=hf_...
PEXELS_API_KEY=...
GOOGLE_API_KEY=...

# =============================================================================
# Modal Configuration
# =============================================================================
MODAL_VOICE_ENDPOINT=https://...
MODAL_VOICE_API_KEY=...
MODAL_API_URL=https://...
MODAL_API_KEY=...

# =============================================================================
# Storage
# =============================================================================
OUTPUT_DIR=./output
TEMP_DIR=./tmp
MAX_FILE_SIZE_MB=500
```

## 10.2 Configuration File

`config/service.yaml`:
```yaml
service:
  name: remotion-media-service
  version: 1.0.0
  port: 3100
  host: localhost

api:
  prefix: /api/v1
  rate_limit:
    enabled: true
    requests_per_minute: 60
    requests_per_hour: 1000

jobs:
  max_concurrent: 10
  default_timeout_ms: 1800000
  retry:
    max_attempts: 3
    backoff_ms: 1000
    backoff_multiplier: 2

providers:
  openai:
    enabled: true
    timeout_ms: 120000
  elevenlabs:
    enabled: true
    timeout_ms: 60000
  modal:
    enabled: true
    timeout_ms: 300000

logging:
  level: info
  format: json
  include_request_body: false
```

---

# 11. Security

## 11.1 Authentication

- **API Key Authentication** - Required for all API endpoints
- **Key Rotation** - Support multiple valid keys during rotation
- **Key Scoping** - Future: per-endpoint permissions

## 11.2 Authorization

| Scope | Endpoints |
|-------|-----------|
| `read` | GET endpoints, job status |
| `write` | POST endpoints, job creation |
| `admin` | DELETE endpoints, configuration |

## 11.3 Input Validation

- **JSON Schema Validation** - All request bodies validated
- **File Type Validation** - Only allowed media types
- **Size Limits** - Max file sizes enforced
- **Path Sanitization** - Prevent directory traversal

## 11.4 Network Security

- **Localhost Binding** - Default to 127.0.0.1 only
- **CORS** - Configurable origins
- **TLS** - Optional HTTPS support
- **Request Logging** - Audit trail (excluding sensitive data)

---

# 12. Deployment

## 12.1 Local Development

```bash
# Install dependencies
npm install
pip install -r requirements.txt

# Start service
npm run service:start

# Or with PM2
pm2 start ecosystem.config.js
```

## 12.2 PM2 Configuration

`ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'remotion-service',
    script: 'dist/service/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    env: {
      NODE_ENV: 'production',
      REMOTION_SERVICE_PORT: 3100
    }
  }]
};
```

## 12.3 Docker (Future)

```dockerfile
FROM node:18-slim

WORKDIR /app
COPY package*.json ./
RUN npm ci --production

COPY dist ./dist
COPY python ./python

EXPOSE 3100

CMD ["node", "dist/service/server.js"]
```

---

# 13. Monitoring & Observability

## 13.1 Health Endpoints

```bash
# Basic health
GET /health
{"status": "healthy", "uptime": 3600}

# Readiness (all dependencies OK)
GET /health/ready
{"status": "ready", "dependencies": {"redis": "ok", "ffmpeg": "ok"}}

# Liveness
GET /health/live
{"status": "alive"}
```

## 13.2 Prometheus Metrics

```
# HELP remotion_requests_total Total API requests
# TYPE remotion_requests_total counter
remotion_requests_total{method="POST",endpoint="/api/v1/tts/generate",status="200"} 1234

# HELP remotion_job_duration_seconds Job processing duration
# TYPE remotion_job_duration_seconds histogram
remotion_job_duration_seconds_bucket{type="render.brief",le="10"} 50
remotion_job_duration_seconds_bucket{type="render.brief",le="30"} 150

# HELP remotion_jobs_active Currently processing jobs
# TYPE remotion_jobs_active gauge
remotion_jobs_active{type="render.brief"} 3
```

## 13.3 Logging

Structured JSON logs:
```json
{
  "timestamp": "2026-02-01T19:48:00.123Z",
  "level": "info",
  "request_id": "req_abc123",
  "message": "Job completed",
  "job_id": "job_xyz789",
  "duration_ms": 5432,
  "type": "render.brief"
}
```

---

# 14. Implementation Roadmap

## Phase 1: Foundation (Week 1-2)

- [ ] Create `src/service/server.ts` - Main HTTP server
- [ ] Implement API Gateway with middleware stack
- [ ] Implement Job Queue with persistence
- [ ] Create health check endpoints
- [ ] Set up logging and metrics

**Deliverable:** Running service with `/health` and `/api/v1/jobs`

## Phase 2: Rendering APIs (Week 2-3)

- [ ] `POST /api/v1/render/brief` - Wire to `scripts/render.ts`
- [ ] `POST /api/v1/render/batch` - Wire to batch handler
- [ ] `POST /api/v1/render/static-ad` - Wire to template renderer
- [ ] Add format/template listing endpoints

**Deliverable:** Render videos via API

## Phase 3: TTS APIs (Week 3-4)

- [ ] `POST /api/v1/tts/generate` - Multi-provider routing
- [ ] `POST /api/v1/tts/voice-clone` - Modal/IndexTTS2
- [ ] Voice profile CRUD endpoints
- [ ] Multi-language support

**Deliverable:** Voice generation via API

## Phase 4: Video Generation (Week 4-5)

- [ ] `POST /api/v1/video/sora` - Wire to Sora pipeline
- [ ] `POST /api/v1/video/image-to-video`
- [ ] `POST /api/v1/video/transform`
- [ ] Full pipeline endpoint

**Deliverable:** AI video generation via API

## Phase 5: Image & Audio (Week 5-6)

- [ ] Character generation endpoints
- [ ] Music search/download endpoints
- [ ] Audio mixing endpoints
- [ ] Visual asset endpoints

**Deliverable:** Image and audio via API

## Phase 6: Avatar & Analysis (Week 6-7)

- [ ] Avatar training endpoints
- [ ] Talking head generation
- [ ] Video analysis endpoints
- [ ] Publishing endpoints

**Deliverable:** Full feature parity

## Phase 7: Polish (Week 7-8)

- [ ] OpenAPI spec generation
- [ ] Python SDK client
- [ ] TypeScript SDK client
- [ ] Integration tests
- [ ] Documentation site

**Deliverable:** Production-ready service with SDKs

---

# 15. SDK Documentation

## 15.1 Python SDK

### Installation
```bash
pip install remotion-service-client
```

### Usage
```python
from remotion_service import RemotionClient, RenderQuality

# Initialize client
client = RemotionClient(
    base_url="http://localhost:3100",
    api_key="your-api-key"
)

# Render a video
job = client.render.brief(
    brief={
        "id": "my-video",
        "format": "explainer_v1",
        "title": "How AI Works",
        "sections": [...],
        "style": {"theme": "dark"},
        "settings": {"duration_sec": 60, "fps": 30}
    },
    quality=RenderQuality.PRODUCTION
)

# Wait for completion
result = client.jobs.wait(job.job_id, timeout=300)
print(f"Video ready: {result.video_url}")

# Generate TTS
audio = client.tts.generate(
    text="Hello world",
    provider="elevenlabs",
    voice_id="21m00Tcm4TlvDq8ikWAM"
)

# Clone voice
cloned = client.tts.voice_clone(
    text="Speak in my voice",
    voice_reference_url="https://example.com/my-voice.mp3",
    emotion="excited"
)

# Generate Sora video
video = client.video.sora(
    prompt="A robot walking through a neon city",
    duration_seconds=8,
    size="1280x720"
)

# Async with webhook
job = client.render.brief(
    brief=my_brief,
    webhook_url="http://myapp:8080/webhook"
)
# Your app receives POST to webhook_url when done
```

## 15.2 TypeScript SDK

### Installation
```bash
npm install @remotion-service/client
```

### Usage
```typescript
import { RemotionClient, RenderQuality } from '@remotion-service/client';

// Initialize client
const client = new RemotionClient({
  baseUrl: 'http://localhost:3100',
  apiKey: 'your-api-key',
});

// Render a video
const job = await client.render.brief({
  brief: {
    id: 'my-video',
    format: 'explainer_v1',
    title: 'How AI Works',
    sections: [...],
    style: { theme: 'dark' },
    settings: { duration_sec: 60, fps: 30 },
  },
  quality: RenderQuality.Production,
});

// Wait for completion
const result = await client.jobs.wait(job.jobId, { timeout: 300000 });
console.log(`Video ready: ${result.videoUrl}`);

// Generate TTS
const audio = await client.tts.generate({
  text: 'Hello world',
  provider: 'elevenlabs',
  voiceId: '21m00Tcm4TlvDq8ikWAM',
});

// Stream job progress
for await (const update of client.jobs.stream(job.jobId)) {
  console.log(`Progress: ${update.progress * 100}%`);
}
```

---

# 16. Appendices

## Appendix A: Full Endpoint List

See Section 7.4 for complete endpoint reference.

## Appendix B: Code Mapping

| API Endpoint | Source File(s) |
|--------------|----------------|
| `/render/brief` | `scripts/render.ts`, `src/api/batch-api.ts` |
| `/render/batch` | `scripts/batch-api-server.ts` |
| `/render/static-ad` | `scripts/render-static-ads.ts`, `src/ad-templates/` |
| `/tts/generate` | `python/services/video_generation/remotion_video_pipeline.py` |
| `/tts/voice-clone` | `python/services/voice/modal_voice_service.py`, `python/services/tts/worker.py` |
| `/video/sora` | `python/services/sora_video_pipeline.py`, `python/services/video_providers/sora_provider.py` |
| `/video/image-to-video` | `src/api/image-to-video.ts` |
| `/video/transform` | `src/api/video-to-video.ts` |
| `/image/character` | `python/services/character_generator.py` |
| `/audio/music/*` | `python/services/music/worker.py` |
| `/audio/mix` | `python/services/video_generation/audio_bus_mixer.py` |
| `/visuals/*` | `python/services/visuals/worker.py` |
| `/avatar/train` | `src/api/custom-avatar-training.ts` |
| `/avatar/infinitetalk` | `scripts/modal_infinitetalk.py` |
| `/analyze/video` | `python/services/video_ready_pipeline.py` |

## Appendix C: OpenAPI Spec Location

After implementation, OpenAPI spec will be available at:
- **JSON**: `GET /api/v1/openapi.json`
- **YAML**: `GET /api/v1/openapi.yaml`
- **Swagger UI**: `GET /api/v1/docs`

## Appendix D: Glossary

| Term | Definition |
|------|------------|
| **Brief** | JSON structure defining video content, style, and settings |
| **Job** | Async task tracked by the service |
| **Voice Profile** | Saved voice embedding for cloning |
| **Character** | AI-generated visual character with variants |
| **Format** | Video template (explainer, listicle, etc.) |
| **Provider** | External API (OpenAI, ElevenLabs, Modal) |

---

*End of Document*
