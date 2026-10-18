# Project Handoff Document

## AI Video Generation Platform with Voice Cloning

This document provides everything needed to set up and use the video generation platform with voice cloning capabilities.

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/IsaiahDupree/ai-video-platform.git
cd ai-video-platform

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development
npm run dev
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI Video Platform                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
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

---

## Required API Keys

| Service | Purpose | Get Key |
|---------|---------|---------|
| **OpenAI** | TTS, DALL-E, GPT-4 | https://platform.openai.com/api-keys |
| **ElevenLabs** | High-quality TTS, SFX | https://elevenlabs.io (free tier) |
| **Google** | Gemini image generation | https://aistudio.google.com/apikey |
| **Modal** | Voice cloning (IndexTTS) | https://modal.com (free tier) |
| **Hugging Face** | Model access | https://huggingface.co/settings/tokens |

### .env.local Template

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# ElevenLabs
ELEVENLABS_API_KEY=sk_...

# Google Gemini
GOOGLE_API_KEY=AIza...

# Hugging Face
HF_TOKEN=hf_...

# Modal (auto-configured via CLI)
# Run: modal token new
```

---

## Voice Cloning Setup

### 1. Install Modal CLI

```bash
pip install modal
modal token new
```

### 2. Deploy Voice Clone Service

```bash
modal deploy scripts/modal_voice_clone.py
```

### 3. Generate Voice with ElevenLabs + IndexTTS

```bash
# Full pipeline: ElevenLabs generates reference → IndexTTS clones it
npx tsx scripts/generate-voice-with-elevenlabs.ts --full-pipeline \
  --voice daniel \
  --ref-text "Hi, I'm Daniel speaking naturally for voice training." \
  --clone-text "This is my cloned voice!" \
  --output-dir public/assets/audio/my_voice
```

### 4. Use Cloned Voice in Video

Update your brief JSON:
```json
{
  "audio": {
    "voiceover": "assets/audio/my_voice/cloned_output.mp3"
  }
}
```

### Voice Cloning API

```bash
# Endpoint
POST https://YOUR_USERNAME--voice-clone-indextts2-api-clone-voice.modal.run

# Request
{
  "voice_ref": "<base64-encoded audio>",
  "text": "Text to synthesize"
}

# Response
{
  "audio": "<base64-encoded WAV>"
}
```

---

## Video Generation

### Content Briefs

Videos are defined by JSON brief files in `data/briefs/`:

```json
{
  "id": "my_video",
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
        "body_text": "Introduction text here",
        "image_path": "assets/images/intro.png"
      }
    }
  ],
  "audio": {
    "voiceover": "assets/audio/voiceover.mp3"
  }
}
```

### Render Video

```bash
# Preview in browser
npm run dev

# Render to file
npx remotion render BriefComposition output/my_video.mp4 \
  --props="$(cat data/briefs/my_brief.json | jq -c '{brief: .}')"
```

---

## Key Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/modal_voice_clone.py` | Voice cloning service | `modal deploy scripts/modal_voice_clone.py` |
| `scripts/generate-voice-with-elevenlabs.ts` | ElevenLabs + IndexTTS pipeline | `npx tsx scripts/generate-voice-with-elevenlabs.ts --help` |
| `scripts/generate-appkit-voiceover.ts` | Batch voiceover generation | `npx tsx scripts/generate-appkit-voiceover.ts` |
| `scripts/remix-character.ts` | Character consistency with DALL-E | `npm run remix` |
| `scripts/remix-character-gemini.ts` | Character consistency with Gemini | `npm run remix:gemini` |
| `scripts/generate-stickers.py` | Background removal for stickers | `python scripts/generate-stickers.py` |

---

## Directory Structure

```
├── data/
│   └── briefs/              # Video brief JSON files
├── docs/                    # Documentation
├── public/
│   └── assets/
│       ├── audio/           # Generated audio files
│       ├── images/          # Static images
│       ├── scenes/          # Generated scene images
│       └── voices/          # Voice reference files
├── scripts/                 # Automation scripts
├── src/
│   ├── components/          # Reusable React components
│   ├── compositions/        # Remotion compositions
│   ├── scenes/              # Scene components (TopicScene, etc.)
│   ├── styles/              # Theme and styling
│   └── types/               # TypeScript interfaces
└── output/                  # Rendered videos (gitignored)
```

---

## Modal Cost Management

The voice cloning service auto-scales to zero after 5 minutes idle.

```bash
# Check status
modal app list

# Stop to save costs
modal app stop voice-clone-indextts2

# View logs
modal app logs voice-clone-indextts2
```

---

## Troubleshooting

### Voice Clone Cold Start

First request after idle takes 30-60 seconds. Increase client timeout.

### Video Has No Audio

Ensure `BriefComposition.tsx` includes the Audio component:
```tsx
{brief.audio?.voiceover && (
  <Audio
    src={staticFile(brief.audio.voiceover)}
    volume={brief.audio.volume_voice ?? 1.0}
  />
)}
```

### Images Not Loading

- Check paths are relative to `public/` folder
- Paths in brief should be `assets/...` not `public/assets/...`

### Modal Deployment Fails

```bash
# Re-authenticate
modal token new

# Check Python version (3.9+ required)
python --version
```

---

## Related Documentation

- [Modal Voice Cloning API](./MODAL_VOICE_CLONING.md) - Full API reference
- [Voice Cloning Guide](./VOICE_CLONING_GUIDE.md) - Voice cloning details
- [PRD](./PRD-Video-Generation-Platform.md) - Product requirements
- [Integration Guide](./INTEGRATION-Guide.md) - Service integrations

---

## GitHub Repository

https://github.com/IsaiahDupree/ai-video-platform

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review related documentation
3. Check Modal dashboard for service logs
4. Review Remotion docs at https://remotion.dev
