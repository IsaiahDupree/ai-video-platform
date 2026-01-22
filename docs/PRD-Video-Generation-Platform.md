# PRD: AI Video Generation Platform

## 1. Overview

A comprehensive video generation platform with voice cloning capabilities, leveraging Remotion for rendering and multiple AI services for content generation.

## 2. Problem Statement

Creating professional video content requires:
- Expensive software and expertise
- Hours of manual editing
- Consistent voice/character representation
- Multiple tool integrations

## 3. Solution

An integrated platform that:
- Generates videos from JSON content briefs
- Clones voices using IndexTTS via Modal
- Produces consistent character imagery via DALL-E/Gemini
- Renders high-quality video via Remotion

## 4. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI Video Platform                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Remotion   │    │   Content    │    │   Audio      │       │
│  │   Renderer   │◄───│   Briefs     │◄───│   Pipeline   │       │
│  │   (Video)    │    │   (JSON)     │    │   (TTS/SFX)  │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    External Services                      │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐  │   │
│  │  │ OpenAI  │  │ Gemini  │  │ Eleven  │  │   Modal     │  │   │
│  │  │ (DALL-E │  │ (Image  │  │ Labs    │  │  (IndexTTS  │  │   │
│  │  │  + TTS) │  │  Gen)   │  │ (SFX)   │  │   Clone)    │  │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 5. Core Features

### Phase 1: Foundation
- **Content Brief System**: JSON-based video definitions
- **Remotion Integration**: Video composition and rendering
- **Basic TTS**: OpenAI text-to-speech integration
- **Image Generation**: DALL-E scene/character generation

### Phase 2: Voice Cloning
- **Modal Deployment**: IndexTTS voice cloning service
- **ElevenLabs Integration**: Reference audio generation
- **Voice Pipeline**: Full clone workflow (reference → clone → render)
- **Voice Management**: Store and manage voice references

### Phase 3: Advanced Generation
- **Gemini Image Gen**: Alternative image generation
- **Character Consistency**: Remix scripts for consistent characters
- **Sticker Generation**: Background removal for overlays
- **Batch Processing**: Multiple video generation

### Phase 4: Text-to-Video Models
- **Model Integration**: HunyuanVideo, Mochi, Wan2.2, LTX-Video
- **Modal T2V Deployment**: Serverless text-to-video
- **Avatar Generation**: LongCat-Video-Avatar integration
- **Pipeline Orchestration**: Multi-model routing

## 6. Technical Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js + TypeScript |
| Video Rendering | Remotion |
| TTS | OpenAI, ElevenLabs |
| Voice Cloning | IndexTTS (Modal) |
| Image Generation | DALL-E, Gemini |
| Text-to-Video | HunyuanVideo, Mochi, LTX-Video |
| Deployment | Modal (GPU), Vercel (web) |

## 7. API Keys Required

| Service | Purpose |
|---------|---------|
| OpenAI | TTS, DALL-E, GPT-4 |
| ElevenLabs | High-quality TTS, SFX |
| Google | Gemini image generation |
| Modal | Voice cloning, T2V models |
| Hugging Face | Model access |

## 8. Content Brief Schema

```json
{
  "id": "video_id",
  "settings": {
    "resolution": { "width": 1920, "height": 1080 },
    "fps": 30,
    "duration_sec": 60
  },
  "style": {
    "theme": "dark",
    "primary_color": "#6366f1"
  },
  "sections": [
    {
      "id": "intro",
      "type": "topic",
      "duration_sec": 10,
      "content": {
        "heading": "Welcome",
        "body_text": "Introduction text",
        "image_path": "assets/images/intro.png"
      }
    }
  ],
  "audio": {
    "voiceover": "assets/audio/voiceover.mp3",
    "volume_voice": 1.0
  }
}
```

## 9. Directory Structure

```
├── data/briefs/              # Video brief JSON files
├── docs/                     # Documentation
├── public/assets/
│   ├── audio/                # Generated audio
│   ├── images/               # Static images
│   ├── scenes/               # Generated scenes
│   └── voices/               # Voice references
├── scripts/                  # Automation scripts
├── src/
│   ├── components/           # React components
│   ├── compositions/         # Remotion compositions
│   ├── scenes/               # Scene components
│   ├── styles/               # Theme/styling
│   └── types/                # TypeScript interfaces
└── output/                   # Rendered videos
```

## 10. Success Metrics

- Video render time < 2 minutes for 60s video
- Voice clone latency < 30s (warm), < 60s (cold)
- 95% render success rate
- Support 10+ concurrent renders

## 11. Roadmap

| Phase | Timeline | Deliverables |
|-------|----------|--------------|
| 1 | Week 1-2 | Brief system, Remotion, basic TTS |
| 2 | Week 3-4 | Voice cloning, Modal deployment |
| 3 | Week 5-6 | Gemini, character consistency |
| 4 | Week 7-8 | T2V models, avatar generation |
