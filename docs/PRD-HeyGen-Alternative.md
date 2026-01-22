# PRD: Open-Source HeyGen Alternative on Modal

## Product Requirements Document
**Version:** 1.0  
**Date:** January 2026  
**Status:** Draft

---

## Executive Summary

Build an open-source alternative to HeyGen using state-of-the-art AI models deployed on Modal's serverless GPU infrastructure. This platform will provide:

- **Text-to-Video Generation** - Create videos from text prompts
- **Talking Avatar Synthesis** - Generate lip-synced avatar videos from audio
- **Voice Cloning** - Clone voices for personalized narration
- **Video-to-Video** - Style transfer and enhancement

### Why Build This?

| HeyGen Pricing | Our Solution |
|----------------|--------------|
| $29/mo Starter (3 min/mo) | Pay-per-use (~$0.05/min) |
| $89/mo Creator (15 min/mo) | No monthly commitment |
| $179/mo Business (30 min/mo) | Self-hosted, full control |
| Enterprise (custom) | Open-source, unlimited |

**Target Cost:** 80-90% cheaper than HeyGen for equivalent output quality.

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Target Users](#2-target-users)
3. [Feature Requirements](#3-feature-requirements)
4. [Technical Architecture](#4-technical-architecture)
5. [Model Selection](#5-model-selection)
6. [API Design](#6-api-design)
7. [Implementation Roadmap](#7-implementation-roadmap)
8. [Infrastructure & Deployment](#8-infrastructure--deployment)
9. [Cost Analysis](#9-cost-analysis)
10. [Quality Metrics](#10-quality-metrics)
11. [Security & Compliance](#11-security--compliance)
12. [Risks & Mitigations](#12-risks--mitigations)
13. [Appendix](#13-appendix)

---

## 1. Product Vision

### 1.1 Problem Statement

Content creators, marketers, and businesses need video content at scale, but:
- Professional video production is expensive ($500-5000+ per minute)
- HeyGen and similar services have high subscription costs
- Limited customization with closed-source solutions
- Data privacy concerns with third-party services

### 1.2 Solution

A modular, open-source video generation platform that:
- Runs on serverless GPU infrastructure (Modal)
- Uses best-in-class open-source AI models
- Provides REST APIs for easy integration
- Scales to zero when not in use (cost-effective)
- Allows full customization and self-hosting

### 1.3 Success Criteria

| Metric | Target |
|--------|--------|
| Video generation time | <60s for 30s video |
| Lip-sync accuracy | >90% MOS score |
| Cost per minute | <$0.10 |
| API availability | 99.5% uptime |
| Cold start time | <90 seconds |

---

## 2. Target Users

### 2.1 Primary Users

**Content Creators**
- YouTubers, TikTokers, course creators
- Need: Quick video generation, avatar videos
- Volume: 10-100 videos/month

**Marketing Teams**
- Social media managers, ad agencies
- Need: Localized content, A/B testing
- Volume: 50-500 videos/month

**Developers**
- Building video features into apps
- Need: API access, customization
- Volume: Variable, API-driven

### 2.2 User Personas

#### Persona 1: Solo Creator (Sarah)
- Creates educational content on YouTube
- Wants avatar videos without being on camera
- Budget: <$50/month
- Technical skill: Low

#### Persona 2: Agency Developer (Marcus)
- Builds video automation for clients
- Needs API integration, batch processing
- Budget: Usage-based
- Technical skill: High

#### Persona 3: Enterprise Product Manager (Jessica)
- Needs self-hosted solution for compliance
- Requires audit logs, data residency
- Budget: $10K+/year
- Technical skill: Medium

---

## 3. Feature Requirements

### 3.1 Core Features (P0 - Must Have)

#### F1: Text-to-Video Generation
Generate video from text prompts using diffusion models.

```
Input:  "A professional presenter in a modern office explaining AI"
Output: 5-30 second video clip (MP4)
```

**Requirements:**
- Resolution: 720p minimum, 1080p preferred
- Frame rate: 24-30 FPS
- Duration: 2-60 seconds
- Aspect ratios: 16:9, 9:16, 1:1

#### F2: Talking Avatar (Audio-Driven)
Generate lip-synced avatar video from audio input.

```
Input:  Audio file (WAV/MP3) + Reference image (optional)
Output: Lip-synced video of avatar speaking
```

**Requirements:**
- Audio formats: WAV, MP3, M4A
- Lip-sync accuracy: >90%
- Natural head/body motion
- Eye contact maintenance
- Expression matching

#### F3: Voice Cloning
Clone a voice from reference audio for TTS.

```
Input:  Reference audio (10-30 seconds) + Text to speak
Output: Generated speech in cloned voice
```

**Requirements:**
- Reference duration: 10-60 seconds
- Languages: English (primary), expandable
- Emotion control: Neutral, happy, serious
- Output format: WAV, MP3

#### F4: REST API
Programmatic access to all features.

**Requirements:**
- OpenAPI 3.0 specification
- Authentication (API keys)
- Rate limiting
- Webhook callbacks for async jobs
- SDK libraries (Python, TypeScript)

### 3.2 Enhanced Features (P1 - Should Have)

#### F5: Image-to-Video
Animate a static image into video.

```
Input:  Image + Motion prompt
Output: Animated video
```

#### F6: Video-to-Video
Apply style transfer or enhancement to existing video.

```
Input:  Source video + Style prompt
Output: Transformed video
```

#### F7: Multi-Language Support
- Text-to-speech in multiple languages
- Lip-sync for different languages
- Subtitle generation

#### F8: Template System
Pre-built templates for common use cases:
- Product demos
- Tutorial videos
- Social media ads
- News-style presentations

### 3.3 Advanced Features (P2 - Nice to Have)

#### F9: Real-Time Streaming
Generate video in real-time for live applications.

#### F10: Custom Avatar Training
Train custom avatars from user-provided video.

#### F11: Background Replacement
Automatically replace video backgrounds.

#### F12: Batch Processing
Process multiple videos in parallel.

---

## 4. Technical Architecture

### 4.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        HeyGen Alternative Platform                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                │
│  │   Client    │     │   API       │     │   Queue     │                │
│  │   Apps      │────▶│   Gateway   │────▶│   (Redis)   │                │
│  │             │     │   (FastAPI) │     │             │                │
│  └─────────────┘     └─────────────┘     └──────┬──────┘                │
│                                                  │                       │
│                    ┌─────────────────────────────┼─────────────────┐    │
│                    │              Modal GPU Workers                │    │
│                    ├───────────────────────────────────────────────┤    │
│                    │                                               │    │
│  ┌─────────────────┴─────────────────┐  ┌─────────────────────────┴─┐  │
│  │         Video Generation          │  │      Audio Generation     │  │
│  ├───────────────────────────────────┤  ├───────────────────────────┤  │
│  │                                   │  │                           │  │
│  │  ┌───────────┐  ┌───────────┐    │  │  ┌───────────┐            │  │
│  │  │ LTX-Video │  │ LongCat   │    │  │  │ IndexTTS  │            │  │
│  │  │ (T2V)     │  │ Avatar    │    │  │  │ (Clone)   │            │  │
│  │  └───────────┘  └───────────┘    │  │  └───────────┘            │  │
│  │                                   │  │                           │  │
│  │  ┌───────────┐  ┌───────────┐    │  │  ┌───────────┐            │  │
│  │  │ Wan2.2    │  │ Mochi     │    │  │  │ ElevenLabs│            │  │
│  │  │ (HQ)      │  │ (Photo)   │    │  │  │ (Backup)  │            │  │
│  │  └───────────┘  └───────────┘    │  │  └───────────┘            │  │
│  │                                   │  │                           │  │
│  └───────────────────────────────────┘  └───────────────────────────┘  │
│                    │                                               │    │
│                    └───────────────────┬───────────────────────────┘    │
│                                        │                                │
│                              ┌─────────┴─────────┐                      │
│                              │    Storage        │                      │
│                              │  (Modal Volume)   │                      │
│                              │  - Model Weights  │                      │
│                              │  - Generated      │                      │
│                              │    Videos         │                      │
│                              └───────────────────┘                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Component Details

#### API Gateway
- **Technology:** FastAPI on Modal
- **Authentication:** API key + JWT
- **Rate Limiting:** Token bucket algorithm
- **Caching:** Redis for session data

#### Video Generation Workers
- **Deployment:** Modal serverless GPU
- **Scaling:** 0 to N based on demand
- **GPU Types:** A10G (cost), A100 (speed), H100 (quality)

#### Storage Layer
- **Model Weights:** Modal Volume (persistent)
- **Generated Content:** Modal Volume + S3 (optional)
- **Retention:** 24 hours default, configurable

### 4.3 Data Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Client  │───▶│   API    │───▶│  Queue   │───▶│  Worker  │───▶│ Storage  │
│  Request │    │  Gateway │    │  (Job)   │    │  (GPU)   │    │ (Output) │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
     │                                                                │
     │                                                                │
     └────────────────── Webhook/Polling ─────────────────────────────┘
```

1. Client sends generation request to API
2. API validates, creates job, returns job ID
3. Job queued for GPU worker
4. Worker processes, saves output to storage
5. Client notified via webhook or polls for status
6. Client downloads generated video

---

## 5. Model Selection

### 5.1 Model Comparison Matrix

| Model | Type | Params | License | Quality | Speed | VRAM | Best For |
|-------|------|--------|---------|---------|-------|------|----------|
| **LTX-Video** | T2V | 2-13B | Custom | ★★★★☆ | ★★★★★ | 16GB | Fast generation |
| **LongCat-Avatar** | A2V | - | MIT | ★★★★★ | ★★★☆☆ | 40GB | Talking avatars |
| **Wan2.2 TI2V-5B** | TI2V | 5B | Apache-2.0 | ★★★★★ | ★★★☆☆ | 24GB | High quality |
| **Mochi** | T2V | 10B | Apache-2.0 | ★★★★★ | ★★☆☆☆ | 40GB | Photorealism |
| **HunyuanVideo** | T2V | 13B | Tencent | ★★★★★ | ★★☆☆☆ | 80GB | Maximum quality |
| **IndexTTS-2** | Voice | - | Apache-2.0 | ★★★★☆ | ★★★★☆ | 8GB | Voice cloning |

### 5.2 Model Selection by Use Case

#### Fast Video Generation (Demos, Prototypes)
**Primary:** LTX-Video 2B  
**Fallback:** Wan2.2 5B

- Generation time: 2-20 seconds
- Quality: Good (4/5)
- Cost: ~$0.01-0.03 per video

#### Talking Avatar (HeyGen Core Feature)
**Primary:** LongCat-Video-Avatar  
**Alternative:** OmniAvatar (Alibaba)

- Lip-sync accuracy: >90%
- Natural motion: Yes
- Reference image support: Yes

#### High-Quality Production
**Primary:** Wan2.2 14B MoE  
**Alternative:** Mochi 10B

- Resolution: 720p-1080p
- Quality: Excellent (5/5)
- Cost: ~$0.10-0.30 per video

#### Voice Cloning
**Primary:** IndexTTS-2 (on Modal)  
**Backup:** ElevenLabs API

- Clone from 10-30s reference
- Natural prosody
- Emotion control

### 5.3 Model Details

#### LTX-Video (Lightricks)
```yaml
Repository: Lightricks/LTX-Video
Type: DiT-based diffusion
Variants:
  - ltx-video-2b: Fast, efficient
  - ltx-video-2b-v0.9.1: Improved quality
  - ltx-video-13b: Maximum quality
Features:
  - Real-time generation capability
  - Image-to-video support
  - FP8 quantization available
Limitations:
  - Custom license (check terms)
  - Limited fine-tuning support
```

#### LongCat-Video-Avatar (Meituan)
```yaml
Repository: Meituan/LongCat-Video-Avatar
Type: Audio-driven avatar generation
Tasks:
  - AT2V: Audio + Text → Video
  - ATI2V: Audio + Text + Image → Video
  - Video continuation
Features:
  - Natural lip-sync
  - Expression matching
  - Long video support (cross-chunk stitching)
  - MIT License
Limitations:
  - Requires H100 for best results
  - Complex pipeline setup
```

#### Wan2.2 (Alibaba)
```yaml
Repository: Alibaba/Wan2.2
Type: Mixture-of-Experts diffusion
Variants:
  - wan2.2-t2v-14b: Full text-to-video
  - wan2.2-ti2v-5b: Text+Image to video (recommended)
  - wan2.2-i2v-5b: Image-to-video
Features:
  - 720p @ 24FPS
  - Visual text rendering
  - Apache-2.0 license
  - ComfyUI integration
Limitations:
  - Large model size
  - Slower than LTX
```

#### Mochi (Genmo)
```yaml
Repository: genmo/mochi-1-preview
Type: Diffusion transformer
Size: 10B parameters
Features:
  - Photorealistic output
  - Apache-2.0 license
  - Training code available
  - LoRA fine-tuning support
Limitations:
  - High VRAM requirement
  - Slower generation
  - Requires bleeding-edge diffusers
```

#### HunyuanVideo (Tencent)
```yaml
Repository: tencent/HunyuanVideo
Type: Large-scale diffusion
Size: 13B parameters
Features:
  - Highest quality output
  - Prompt rewriting utilities
  - FP8 quantization
  - Diffusers integration
Limitations:
  - Datacenter-class GPU required
  - Custom Tencent license
  - Very high VRAM (80GB+)
```

---

## 6. API Design

### 6.1 API Overview

Base URL: `https://api.heygen-alt.modal.run/v1`

#### Authentication
```http
Authorization: Bearer <API_KEY>
```

#### Rate Limits
| Tier | Requests/min | Concurrent Jobs |
|------|-------------|-----------------|
| Free | 10 | 1 |
| Pro | 100 | 5 |
| Enterprise | 1000 | 50 |

### 6.2 Endpoints

#### Generate Video from Text

```http
POST /v1/video/generate
Content-Type: application/json

{
  "prompt": "A professional presenter explaining quantum computing",
  "negative_prompt": "blurry, low quality, distorted",
  "model": "ltx-video-2b",
  "settings": {
    "width": 1280,
    "height": 720,
    "duration_seconds": 10,
    "fps": 24,
    "num_inference_steps": 50,
    "guidance_scale": 7.5,
    "seed": 42
  },
  "output": {
    "format": "mp4",
    "quality": "high"
  },
  "webhook_url": "https://your-app.com/webhook"
}
```

**Response (202 Accepted):**
```json
{
  "job_id": "job_abc123xyz",
  "status": "queued",
  "estimated_time_seconds": 45,
  "created_at": "2026-01-21T00:00:00Z"
}
```

#### Generate Talking Avatar

```http
POST /v1/avatar/generate
Content-Type: multipart/form-data

{
  "audio": <binary audio file>,
  "reference_image": <binary image file>,  // optional
  "prompt": "Professional presenter in a modern studio",
  "model": "longcat-avatar",
  "settings": {
    "width": 1280,
    "height": 720,
    "emotion": "neutral",
    "motion_scale": 1.0
  }
}
```

#### Clone Voice

```http
POST /v1/voice/clone
Content-Type: multipart/form-data

{
  "reference_audio": <binary audio file>,
  "text": "Text to speak with the cloned voice",
  "model": "indextts2",
  "settings": {
    "emotion": "same_as_reference",
    "speed": 1.0
  }
}
```

**Response:**
```json
{
  "job_id": "job_voice_xyz",
  "status": "completed",
  "audio_url": "https://storage.modal.run/audio/xyz.wav",
  "duration_seconds": 5.2
}
```

#### Get Job Status

```http
GET /v1/jobs/{job_id}
```

**Response:**
```json
{
  "job_id": "job_abc123xyz",
  "status": "completed",
  "progress": 100,
  "result": {
    "video_url": "https://storage.modal.run/video/abc123.mp4",
    "thumbnail_url": "https://storage.modal.run/thumb/abc123.jpg",
    "duration_seconds": 10,
    "width": 1280,
    "height": 720,
    "file_size_bytes": 5242880
  },
  "created_at": "2026-01-21T00:00:00Z",
  "completed_at": "2026-01-21T00:00:45Z",
  "cost_credits": 10
}
```

#### List Models

```http
GET /v1/models
```

**Response:**
```json
{
  "models": [
    {
      "id": "ltx-video-2b",
      "name": "LTX-Video 2B",
      "type": "text-to-video",
      "description": "Fast video generation",
      "max_duration_seconds": 60,
      "resolutions": ["512x512", "768x512", "1280x720"],
      "cost_per_second": 0.001,
      "avg_generation_time_seconds": 15
    },
    {
      "id": "longcat-avatar",
      "name": "LongCat Video Avatar",
      "type": "audio-to-video",
      "description": "Talking avatar generation",
      "max_duration_seconds": 300,
      "resolutions": ["720x720", "1280x720"],
      "cost_per_second": 0.005,
      "avg_generation_time_seconds": 60
    }
  ]
}
```

### 6.3 Webhook Events

```json
{
  "event": "job.completed",
  "job_id": "job_abc123xyz",
  "timestamp": "2026-01-21T00:00:45Z",
  "data": {
    "status": "completed",
    "result": {
      "video_url": "https://storage.modal.run/video/abc123.mp4"
    }
  }
}
```

Event types:
- `job.queued`
- `job.processing`
- `job.completed`
- `job.failed`

### 6.4 Error Responses

```json
{
  "error": {
    "code": "INVALID_PROMPT",
    "message": "Prompt contains prohibited content",
    "details": {
      "flagged_terms": ["violence"]
    }
  }
}
```

Error codes:
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Malformed request |
| `UNAUTHORIZED` | 401 | Invalid API key |
| `RATE_LIMITED` | 429 | Too many requests |
| `MODEL_UNAVAILABLE` | 503 | Model temporarily unavailable |
| `GENERATION_FAILED` | 500 | Generation error |

---

## 7. Implementation Roadmap

### 7.1 Phase Overview

```
Phase 1 (Weeks 1-2)     Phase 2 (Weeks 3-4)     Phase 3 (Weeks 5-6)     Phase 4 (Weeks 7-8)
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Foundation     │    │  Talking Avatar  │    │   Production     │    │   Advanced       │
│                  │    │                  │    │                  │    │                  │
│ ✓ LTX-Video      │    │ □ LongCat-Avatar │    │ □ API Gateway    │    │ □ Batch Process  │
│ ✓ Voice Clone    │    │ □ Audio Pipeline │    │ □ Auth System    │    │ □ Templates      │
│ ✓ Basic API      │    │ □ Lip-sync       │    │ □ Webhooks       │    │ □ Custom Avatars │
│ □ Testing        │    │ □ Quality Eval   │    │ □ Monitoring     │    │ □ Streaming      │
└──────────────────┘    └──────────────────┘    └──────────────────┘    └──────────────────┘
```

### 7.2 Phase 1: Foundation (Weeks 1-2)

#### Week 1: Core Infrastructure
- [x] Deploy LTX-Video on Modal
- [x] Implement text-to-video API endpoint
- [x] Set up model caching with Modal volumes
- [x] Create TypeScript client SDK
- [ ] Write unit tests for API
- [ ] Set up CI/CD pipeline

#### Week 2: Voice Cloning
- [x] Deploy IndexTTS-2 on Modal
- [x] Implement voice cloning endpoint
- [x] ElevenLabs integration for reference generation
- [ ] Voice quality evaluation
- [ ] Documentation

**Deliverables:**
- Working text-to-video API
- Voice cloning API
- Basic documentation

### 7.3 Phase 2: Talking Avatar (Weeks 3-4)

#### Week 3: Avatar Model
- [ ] Deploy LongCat-Video-Avatar on Modal
- [ ] Implement audio preprocessing pipeline
- [ ] Add reference image support
- [ ] Test lip-sync accuracy

#### Week 4: Integration
- [ ] Connect voice cloning → avatar pipeline
- [ ] Add emotion/expression controls
- [ ] Implement long video support (chunking)
- [ ] Quality assurance testing

**Deliverables:**
- Full talking avatar generation
- End-to-end voice → avatar pipeline
- Quality metrics report

### 7.4 Phase 3: Production Ready (Weeks 5-6)

#### Week 5: API Gateway
- [ ] Implement authentication system
- [ ] Add rate limiting
- [ ] Set up job queue (Redis)
- [ ] Implement webhooks

#### Week 6: Operations
- [ ] Add monitoring (Datadog/Grafana)
- [ ] Set up alerting
- [ ] Create admin dashboard
- [ ] Write operations runbook

**Deliverables:**
- Production-ready API
- Monitoring dashboard
- Operations documentation

### 7.5 Phase 4: Advanced Features (Weeks 7-8)

#### Week 7: Enhanced Capabilities
- [ ] Batch processing support
- [ ] Template system
- [ ] Image-to-video (Wan2.2)
- [ ] Video-to-video enhancement

#### Week 8: Polish
- [ ] Custom avatar training
- [ ] Real-time streaming (experimental)
- [ ] Multi-language support
- [ ] Performance optimization

**Deliverables:**
- Full feature set
- Performance benchmarks
- Launch-ready platform

---

## 8. Infrastructure & Deployment

### 8.1 Modal Configuration

#### GPU Allocation Strategy

```python
# Development/Testing
@app.function(gpu="A10G")  # $0.000544/sec, 24GB VRAM

# Production (Speed)
@app.function(gpu="A100")  # $0.001036/sec, 40GB VRAM

# Production (Quality)
@app.function(gpu="H100")  # $0.002789/sec, 80GB VRAM
```

#### Scaling Configuration

```python
@app.function(
    gpu="A10G",
    scaledown_window=300,      # Keep warm for 5 min
    timeout=600,               # 10 min max per request
    concurrency_limit=10,      # Max concurrent executions
    allow_concurrent_inputs=5, # Batch requests per container
)
```

### 8.2 Volume Strategy

```python
# Model weights (read-mostly, shared)
model_volume = modal.Volume.from_name("video-models", create_if_missing=True)

# Generated content (write-heavy, ephemeral)
output_volume = modal.Volume.from_name("video-outputs", create_if_missing=True)

# Cache (temporary, fast access)
cache_volume = modal.Volume.from_name("video-cache", create_if_missing=True)
```

### 8.3 Container Images

```python
# Base image with common dependencies
base_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "libgl1-mesa-glx", "libglib2.0-0")
    .pip_install(
        "torch>=2.1.0",
        "diffusers>=0.32.0",
        "transformers>=4.40.0",
        "accelerate>=0.25.0",
        "imageio[ffmpeg]",
        "fastapi",
    )
)

# Model-specific images extend base
ltx_image = base_image.pip_install("specific-ltx-deps")
avatar_image = base_image.pip_install("specific-avatar-deps")
```

### 8.4 Environment Configuration

```python
# .env.example
MODAL_TOKEN_ID=<your-token-id>
MODAL_TOKEN_SECRET=<your-token-secret>
HF_TOKEN=<huggingface-token>          # For gated models
ELEVENLABS_API_KEY=<elevenlabs-key>   # Backup TTS
REDIS_URL=<redis-connection-string>   # Job queue
S3_BUCKET=<s3-bucket-name>            # Long-term storage
```

### 8.5 Deployment Commands

```bash
# Deploy all services
modal deploy scripts/modal_text_to_video.py
modal deploy scripts/modal_voice_clone.py
modal deploy scripts/modal_avatar_generation.py

# View deployed apps
modal app list

# Check logs
modal app logs text-to-video-ltx

# Stop to save costs
modal app stop text-to-video-ltx
```

---

## 9. Cost Analysis

### 9.1 Modal GPU Pricing (January 2026)

| GPU | Price/Hour | Price/Second | VRAM |
|-----|-----------|--------------|------|
| T4 | $0.59 | $0.000164 | 16GB |
| A10G | $1.96 | $0.000544 | 24GB |
| A100 (40GB) | $3.73 | $0.001036 | 40GB |
| A100 (80GB) | $4.53 | $0.001258 | 80GB |
| H100 | $10.04 | $0.002789 | 80GB |

### 9.2 Cost Per Operation

#### Text-to-Video (LTX-Video 2B on A10G)

| Duration | Gen Time | GPU Cost | Total Cost |
|----------|----------|----------|------------|
| 5 sec | ~15 sec | $0.008 | **$0.01** |
| 10 sec | ~25 sec | $0.014 | **$0.02** |
| 30 sec | ~60 sec | $0.033 | **$0.04** |
| 60 sec | ~120 sec | $0.065 | **$0.07** |

#### Talking Avatar (LongCat on H100)

| Duration | Gen Time | GPU Cost | Total Cost |
|----------|----------|----------|------------|
| 10 sec | ~30 sec | $0.084 | **$0.10** |
| 30 sec | ~90 sec | $0.251 | **$0.30** |
| 60 sec | ~180 sec | $0.502 | **$0.55** |

#### Voice Cloning (IndexTTS-2 on A10G)

| Output Duration | Gen Time | GPU Cost |
|-----------------|----------|----------|
| 10 sec | ~5 sec | **$0.003** |
| 30 sec | ~10 sec | **$0.005** |
| 60 sec | ~20 sec | **$0.011** |

### 9.3 Cost Comparison vs HeyGen

| Use Case | HeyGen | Our Solution | Savings |
|----------|--------|--------------|---------|
| 1 min avatar/month | $29 (Starter) | $0.55 | **98%** |
| 15 min avatar/month | $89 (Creator) | $8.25 | **91%** |
| 30 min avatar/month | $179 (Business) | $16.50 | **91%** |
| 100 min avatar/month | ~$500 | $55 | **89%** |

### 9.4 Monthly Infrastructure Costs

| Component | Cost/Month |
|-----------|------------|
| Modal base (compute) | Pay-per-use |
| Modal volumes (storage) | ~$5-20 |
| Redis (job queue) | ~$10-30 |
| S3 (long-term storage) | ~$5-20 |
| Monitoring | ~$20-50 |
| **Total overhead** | **~$40-120** |

---

## 10. Quality Metrics

### 10.1 Video Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Resolution | 720p+ | Pixel dimensions |
| Frame Rate | 24+ FPS | ffprobe analysis |
| Bitrate | 5+ Mbps | ffprobe analysis |
| FID Score | <50 | Fréchet Inception Distance |
| CLIP Score | >0.25 | Text-video alignment |

### 10.2 Avatar Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Lip-sync accuracy | >90% | SyncNet score |
| Expression naturalness | >4/5 | Human evaluation |
| Motion smoothness | <2% jitter | Frame-to-frame analysis |
| Identity preservation | >85% | Face similarity score |

### 10.3 Voice Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| MOS Score | >4.0 | Mean Opinion Score |
| Speaker similarity | >85% | Embedding distance |
| Naturalness | >4/5 | Human evaluation |
| Word Error Rate | <5% | ASR comparison |

### 10.4 Performance Metrics

| Metric | Target | SLA |
|--------|--------|-----|
| API availability | 99.5% | Monthly |
| Cold start time | <90s | P95 |
| Generation time | <60s for 30s video | P95 |
| Error rate | <2% | Hourly |

---

## 11. Security & Compliance

### 11.1 Authentication

```python
# API Key authentication
@app.function()
@modal.fastapi_endpoint(method="POST")
async def generate(request: Request):
    api_key = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not validate_api_key(api_key):
        raise HTTPException(401, "Invalid API key")
```

### 11.2 Content Moderation

- **Input validation:** Check prompts for prohibited content
- **Output scanning:** Scan generated videos for policy violations
- **Rate limiting:** Prevent abuse
- **Audit logging:** Track all generation requests

### 11.3 Data Handling

| Data Type | Retention | Encryption |
|-----------|-----------|------------|
| API keys | Permanent | Hashed (bcrypt) |
| Prompts | 30 days | At rest (AES-256) |
| Generated videos | 24 hours | In transit (TLS) |
| Voice samples | 7 days | At rest + transit |

### 11.4 Compliance Considerations

- **GDPR:** Data deletion on request
- **CCPA:** Privacy policy, opt-out
- **SOC 2:** Audit trails, access controls
- **Model licensing:** Verify commercial use rights

---

## 12. Risks & Mitigations

### 12.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Cold start latency | High | Medium | Keep warm containers, queue optimization |
| Model quality varies | Medium | High | Multi-model fallback, quality gates |
| GPU availability | Low | High | Multi-region deployment, queue buffer |
| Memory overflow | Medium | Medium | Model CPU offload, VAE tiling |

### 12.2 Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Model license changes | Low | High | Track licenses, maintain alternatives |
| Cost overruns | Medium | Medium | Budget alerts, usage quotas |
| Competition | High | Medium | Feature differentiation, cost leadership |
| API abuse | Medium | Medium | Rate limiting, content moderation |

### 12.3 Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Modal outage | Low | High | Queue persistence, status page |
| Model updates break API | Medium | Medium | Version pinning, staging environment |
| Security breach | Low | Critical | Encryption, audit logging, pen testing |

---

## 13. Appendix

### 13.1 Glossary

| Term | Definition |
|------|------------|
| T2V | Text-to-Video |
| I2V | Image-to-Video |
| A2V | Audio-to-Video |
| TI2V | Text+Image-to-Video |
| DiT | Diffusion Transformer |
| MoE | Mixture of Experts |
| LoRA | Low-Rank Adaptation |
| FP8 | 8-bit floating point |

### 13.2 Model Repositories

| Model | Hugging Face Repo |
|-------|-------------------|
| LTX-Video | `Lightricks/LTX-Video` |
| LongCat-Avatar | `Meituan/LongCat-Video-Avatar` |
| Wan2.2 | `Alibaba/Wan2.2` |
| Mochi | `genmo/mochi-1-preview` |
| HunyuanVideo | `tencent/HunyuanVideo` |
| IndexTTS-2 | `IndexTeam/IndexTTS-2` |

### 13.3 Reference Implementation

```bash
# Directory structure
heygen-alternative/
├── scripts/
│   ├── modal_text_to_video.py      # LTX-Video deployment
│   ├── modal_voice_clone.py        # IndexTTS-2 deployment
│   ├── modal_avatar_generation.py  # LongCat deployment
│   └── modal_api_gateway.py        # Unified API
├── clients/
│   ├── typescript/                 # TS SDK
│   └── python/                     # Python SDK
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── TROUBLESHOOTING.md
└── tests/
    ├── unit/
    └── integration/
```

### 13.4 API Endpoint Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/video/generate` | POST | Generate video from text |
| `/v1/avatar/generate` | POST | Generate talking avatar |
| `/v1/voice/clone` | POST | Clone voice + generate speech |
| `/v1/video/transform` | POST | Video-to-video (style transfer) |
| `/v1/jobs/{id}` | GET | Get job status |
| `/v1/jobs/{id}/cancel` | POST | Cancel job |
| `/v1/models` | GET | List available models |
| `/v1/usage` | GET | Get usage statistics |
| `/health` | GET | Health check |

### 13.5 Sample Integration Code

#### Python
```python
from heygen_alt import HeyGenAlt

client = HeyGenAlt(api_key="your-api-key")

# Generate video
job = client.video.generate(
    prompt="A friendly presenter explaining climate change",
    duration=30,
    model="ltx-video-2b"
)

# Wait for completion
result = job.wait()
print(f"Video URL: {result.video_url}")
```

#### TypeScript
```typescript
import { HeyGenAlt } from 'heygen-alt';

const client = new HeyGenAlt({ apiKey: 'your-api-key' });

// Generate talking avatar
const job = await client.avatar.generate({
  audio: audioBuffer,
  referenceImage: imageBuffer,
  prompt: 'Professional presenter in studio'
});

const result = await job.waitForCompletion();
console.log(`Video URL: ${result.videoUrl}`);
```

#### cURL
```bash
curl -X POST https://api.heygen-alt.modal.run/v1/video/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A serene mountain landscape",
    "duration_seconds": 10,
    "model": "ltx-video-2b"
  }'
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-21 | AI Assistant | Initial draft |

---

## Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Tech Lead | | | |
| Engineering | | | |
