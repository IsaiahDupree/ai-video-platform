# Video Generation Platform PRD

**Product Requirements Document**

**Version:** 3.0  
**Last Updated:** January 17, 2026  
**Status:** Production Ready  
**Repository:** `/Users/isaiahdupree/Documents/Software/Remotion`

---

## Executive Summary

A comprehensive, AI-powered video generation platform built on Remotion that enables automated creation of professional video content from structured briefs. The platform supports multiple content formats (explainers, dev vlogs, shorts, ads) with integrated AI voice cloning, character consistency, auto-captioning, and brandable templates.

### Key Value Propositions

1. **Brief-to-Video Automation** - JSON brief → rendered MP4 with zero manual editing
2. **AI Voice Cloning** - Your voice on every video via Hugging Face IndexTTS-2
3. **Character Consistency** - AI-generated graphics with consistent characters across scenes
4. **Auto-Captioning** - Word-level timestamps via OpenAI Whisper for TikTok-style captions
5. **Multi-Format Output** - One brief, multiple platforms (YouTube, TikTok, Instagram, Meta Ads)
6. **Brandable Package** - Reproducible templates with consistent visual identity

---

## Content Formats

### Video Formats

| Format | ID | Aspect | Duration | Use Case |
|--------|-----|--------|----------|----------|
| **Explainer** | `explainer_v1` | 9:16 | 30-90s | Educational content, how-to videos |
| **GitHub Dev Vlog** | `devvlog_v1` | 9:16 / 16:9 | 60-180s | Code walkthroughs, project updates |
| **Shorts** | `shorts_v1` | 9:16 | 15-60s | TikTok/Reels, viral hooks |
| **Listicle** | `listicle_v1` | 9:16 | 45-90s | Top N lists, countdowns |
| **Comparison** | `comparison_v1` | 16:9 | 60-120s | X vs Y, pros/cons |
| **UGC Recreation** | `ugc_v1` | 9:16 | 30-60s | Trending format recreation |

### Static Ad Formats

| Format | Sizes | Use Case |
|--------|-------|----------|
| **Instagram Post** | 1080×1080 | Feed ads |
| **Instagram Story** | 1080×1920 | Story ads |
| **Facebook Post** | 1200×630 | Feed ads |
| **Twitter/X** | 1200×675 | Timeline ads |
| **LinkedIn** | 1200×627 | B2B campaigns |
| **Display Ads** | 300×250, 728×90 | Programmatic |

---

## Platform Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           INPUT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  Topic/Script/Brief → Script Generator (GPT-4) → Structured Brief       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        ASSET GENERATION LAYER                            │
├──────────────────┬──────────────────┬──────────────────┬───────────────┤
│   AI Graphics    │   Voice Clone    │   Sound Effects  │   B-Roll      │
│   (DALL-E 3)     │   (IndexTTS-2)   │   (ElevenLabs)   │   (Pexels)    │
│                  │   ↓ fallback     │   (Freesound)    │   (Pixabay)   │
│   Character      │   (OpenAI TTS)   │                  │   (NASA)      │
│   Consistency    │                  │                  │               │
│   Engine         │                  │                  │               │
└──────────────────┴──────────────────┴──────────────────┴───────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        POST-PROCESSING LAYER                             │
├──────────────────┬──────────────────┬──────────────────────────────────┤
│   Word Timestamps│   Caption Gen    │   Title Summarization             │
│   (Whisper API)  │   (TikTok-style) │   (GPT-4)                         │
└──────────────────┴──────────────────┴──────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         RENDER ENGINE (REMOTION)                         │
├─────────────────────────────────────────────────────────────────────────┤
│  Scene Templates → Animation Presets → Visual Effects → Timeline        │
│  (Intro, Topic,    (Fade, Slide,      (Particles,      Synchronization  │
│   Outro, List)     Bounce, Glitch)    Glow, Captions)                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            OUTPUT LAYER                                  │
├──────────────────┬──────────────────┬──────────────────────────────────┤
│   MP4 Video      │   Asset Manifest │   Attribution Log                 │
│   (H.264/H.265)  │   (JSON)         │   (License tracking)              │
└──────────────────┴──────────────────┴──────────────────────────────────┘
```

---

## AI Integration Stack

### 1. OpenAI Suite

| Service | API | Use Case | Rate Limit |
|---------|-----|----------|------------|
| **GPT-4o** | `/v1/chat/completions` | Script generation, title summarization | 10k TPM |
| **DALL-E 3** | `/v1/images/generations` | Character graphics, scene illustrations | 50 img/min |
| **Whisper** | `/v1/audio/transcriptions` | Word-level timestamps for captions | 50 req/min |
| **TTS** | `/v1/audio/speech` | Voiceover fallback (alloy, onyx, nova) | 50 req/min |

### 2. Hugging Face (Voice Cloning)

| Model | Space | Use Case | Quota |
|-------|-------|----------|-------|
| **IndexTTS-2** | `IndexTeam/IndexTTS-2-Demo` | Voice cloning with emotion control | ~60s/day free GPU |

**Emotion Control Options:**
- `happy`, `sad`, `angry`, `calm`, `surprised`, `fearful`, `disgusted`
- `explaining` (custom preset: calm 0.5 + happy 0.3)

**Fallback Strategy:**
```
IndexTTS-2 (voice clone) → OpenAI TTS (onyx voice) → Skip with warning
```

### 3. ElevenLabs

| Service | API | Use Case |
|---------|-----|----------|
| **Sound Effects** | `/v1/sound-generation` | AI-generated SFX from text prompts |
| **Text-to-Speech** | `/v1/text-to-speech` | Premium voices (optional) |

### 4. Stock Media APIs

| Provider | Use Case | License | Rate Limit |
|----------|----------|---------|------------|
| **Pexels** | B-roll video, images | Free w/ attribution | 200/hr |
| **Pixabay** | Stock footage | Free w/ attribution | 5000/hr |
| **NASA** | Space/aerospace footage | Public domain | Unlimited |
| **Freesound** | Sound effects library | CC (varies) | 60/min |
| **Tenor** | Reaction GIFs | Free | 1/sec |

---

## Caption System

### Word-Level Timestamp Pipeline

```
Audio File (WAV/MP3)
        │
        ▼
┌──────────────────────┐
│   OpenAI Whisper     │
│   timestamp_         │
│   granularities:     │
│   ["word"]           │
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│   timestamps.json    │
│   {                  │
│     "words": [       │
│       { "word": "Hi",│
│         "start": 0.0,│
│         "end": 0.3 } │
│     ]                │
│   }                  │
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│   Remotion Component │
│   <AnimatedCaption   │
│     words={words}    │
│     style="tiktok"   │
│   />                 │
└──────────────────────┘
```

### Caption Styles

| Style | Description | Best For |
|-------|-------------|----------|
| `tiktok` | Bold, centered, word-by-word highlight | Shorts, Reels |
| `youtube` | Bottom bar, sentence-level | Longform |
| `karaoke` | Color wipe on current word | Music, lyric videos |
| `minimal` | Subtle, lower-third | Professional |
| `neon` | Glowing text with effects | Tech, gaming |

---

## Character Consistency System

### How It Works

1. **Character Registration** - Define character traits once per project
2. **Reference Generation** - Create initial character reference sheet
3. **Scene Generation** - Use consistent prompts with same traits

### Character Definition Schema

```json
{
  "characters": [
    {
      "name": "host",
      "description": "friendly tech expert, short dark hair, glasses, blue polo",
      "style": "flat illustration, clean lines, consistent facial features",
      "seed": 42,
      "reference_image": "public/assets/characters/host_ref.png"
    }
  ]
}
```

### Consistency Techniques

| Technique | Description |
|-----------|-------------|
| **Trait Anchoring** | Include specific physical traits in every prompt |
| **Style Locking** | Use identical art style descriptor across scenes |
| **Emotion Mapping** | Predefined emotion→visual descriptors |
| **Reference Images** | Provide existing character reference to guide AI |

---

## Content Brief Schema (v3)

```typescript
interface ContentBrief {
  id: string;
  format: 'explainer_v1' | 'devvlog_v1' | 'shorts_v1' | 'listicle_v1';
  version: string;
  
  // Metadata
  metadata: {
    title: string;
    description?: string;
    tags?: string[];
    hook_title?: string;  // Eye-catching summarized title
  };
  
  // Video settings
  settings: {
    resolution: { width: number; height: number };
    fps: number;
    duration_sec: number;
    aspect_ratio: '9:16' | '16:9' | '1:1';
  };
  
  // Visual style
  style: {
    theme: 'dark' | 'light' | 'neon' | 'minimal';
    primary_color: string;
    accent_color: string;
    art_style: string;
    font_heading: string;
    font_body: string;
    background_type: 'solid' | 'gradient' | 'image' | 'video';
    background_value: string;
  };
  
  // Character definitions
  characters: Array<{
    name: string;
    description: string;
    style: string;
    reference_image?: string;
  }>;
  
  // Voice configuration
  voice: {
    reference_path: string;        // Path to voice reference WAV
    default_emotion: string;       // Default emotion for scenes
    provider_priority: ('indextts2' | 'openai' | 'elevenlabs')[];
  };
  
  // Content sections
  sections: Array<{
    id: string;
    type: 'intro' | 'topic' | 'list_item' | 'code' | 'outro' | 'transition';
    duration_sec: number;
    start_time_sec: number;
    
    content: {
      title?: string;
      body_text?: string;
      hook_text?: string;
      bullets?: string[];
      code?: { language: string; snippet: string };
    };
    
    voiceover: {
      text: string;
      emotion?: string;
    };
    
    visuals: {
      character?: string;
      action?: string;
      background?: string;
      broll_queries?: string[];
    };
    
    audio: {
      sfx_prompts?: string[];
      music_mood?: string;
    };
    
    captions: {
      enabled: boolean;
      style?: 'tiktok' | 'youtube' | 'karaoke' | 'minimal';
    };
  }>;
}
```

---

## GitHub Dev Vlog Format

### Structure

```
[Hook]        3-5s   "I just built X in Y hours"
[Context]     10-15s  Why this matters, problem statement
[Code Walk]   30-60s  Screen recording + voiceover
[Key Insight] 10-15s  The "aha" moment
[Result]      10-15s  Demo of working feature
[CTA]         5s      Subscribe, follow, link in bio
```

### Special Components

| Component | Description |
|-----------|-------------|
| `<CodeBlock>` | Syntax-highlighted code with typing animation |
| `<TerminalOutput>` | Animated terminal with command execution |
| `<BrowserMockup>` | Chrome-style browser with content |
| `<GitCommit>` | Animated commit message |
| `<PRMerge>` | Pull request merge animation |

---

## Explainer Video Format

### Structure

```
[Hook]        5s    Attention-grabbing question/statement
[Context]     10s   Set up the problem
[Point 1]     15s   First key concept
[Point 2]     15s   Second key concept  
[Point 3]     15s   Third key concept
[Summary]     10s   Recap key points
[CTA]         5s    Call to action
```

### Visual Elements

- Consistent host character throughout
- Topic-relevant illustrations per section
- Animated diagrams for complex concepts
- Progress indicator
- Caption overlay

---

## CLI Commands Reference

### Video Generation

```bash
# Generate from topic (fully automated)
npm run generate:explainer -- --topic "How Solar Panels Work"

# Generate from script file
npm run generate:explainer -- --script script.txt --title "My Topic"

# Generate from brief
npm run generate:explainer -- --brief data/briefs/my_brief.json

# Skip specific steps
npm run generate:explainer -- --topic "X" --skip-images --skip-render
```

### Audio Generation

```bash
# Generate voiceover with voice clone
npm run generate:audio -- --tts "Hello world" --voice voices/isaiah.wav

# Generate sound effect
npm run generate:audio -- --sfx "epic whoosh" --output sfx.mp3

# Process all audio in brief
npm run generate:audio -- --resolve briefs/my_brief.json
```

### Caption Generation

```bash
# Generate word timestamps
python3 scripts/generate-word-timestamps.py

# Output: public/assets/audio/voiceover/{section}/timestamps.json
```

### Rendering

```bash
# Render from brief
npm run render:brief data/briefs/my_brief.json output.mp4

# Batch render
npm run batch-render

# Preview in Studio
npm run dev
```

### Static Ads

```bash
# Render still image
npx remotion still StaticAd-Instagram-Post output/ad.png

# Batch render all sizes
npm run render:static-ads
```

---

## Environment Configuration

### Required API Keys

```bash
# .env.local

# OpenAI - Script, Images, Whisper, TTS fallback
OPENAI_API_KEY=sk-proj-...

# Hugging Face - Voice cloning
HF_TOKEN=hf_...

# ElevenLabs - Sound effects
ELEVENLABS_API_KEY=sk_...

# Stock Media
PEXELS_API_KEY=...
PIXABAY_API_KEY=...
FREESOUND_API_KEY=...
```

### Voice Reference Setup

Place voice reference files in:
```
public/assets/voices/
├── isaiah.wav          # Primary voice reference
├── default.wav         # Fallback reference
└── tiktok_voice_ref.wav
```

**Requirements:**
- 5-15 seconds of clear speech
- WAV format, 16kHz+ sample rate
- Minimal background noise
- Neutral or target emotion

---

## Branding & Reproducibility

### Template Package Structure

```
brand-template/
├── config/
│   ├── brand.json         # Colors, fonts, logos
│   ├── characters.json    # Character definitions
│   └── voice.json         # Voice configuration
├── assets/
│   ├── logos/
│   ├── characters/
│   ├── voices/
│   └── music/
├── templates/
│   ├── explainer.json
│   ├── devvlog.json
│   └── shorts.json
└── README.md
```

### Brand Configuration

```json
{
  "brand": {
    "name": "YourBrand",
    "colors": {
      "primary": "#3b82f6",
      "secondary": "#1e293b",
      "accent": "#f59e0b"
    },
    "fonts": {
      "heading": "Inter",
      "body": "Inter"
    },
    "logo": "assets/logos/logo.png",
    "watermark": "assets/logos/watermark.png"
  },
  "defaults": {
    "theme": "dark",
    "voice_reference": "assets/voices/brand_voice.wav",
    "caption_style": "tiktok",
    "outro_cta": "Follow for more!"
  }
}
```

---

## Developer Handoff

### Repository Structure

```
Remotion/
├── 📁 data/
│   ├── briefs/              # Content brief JSON files
│   │   ├── explainer_template.json
│   │   └── schema.json
│   └── *.json               # Audio events, timeline data
│
├── 📁 docs/
│   ├── PRD-Video-Generation-Platform.md  # THIS DOCUMENT
│   ├── EXPLAINER_VIDEO_GUIDE.md
│   ├── VOICE_CLONING_GUIDE.md
│   └── *.md                  # Additional documentation
│
├── 📁 formats/
│   ├── explainer_v1.ts      # Format definitions
│   ├── listicle_v1.ts
│   ├── shorts_v1.ts
│   └── index.ts
│
├── 📁 public/assets/
│   ├── audio/voiceover/     # Generated voiceovers
│   ├── characters/          # AI character images
│   ├── scenes/              # Scene illustrations
│   ├── sfx/                 # Sound effects
│   └── voices/              # Voice references
│
├── 📁 scripts/
│   ├── generate-explainer.ts    # Main explainer pipeline ⭐
│   ├── generate-audio.ts        # Voice & SFX generation
│   ├── generate-character.ts    # AI image generation
│   ├── generate-word-timestamps.py  # Whisper captions
│   ├── test-indextts2.py        # Voice cloning test
│   ├── render.ts                # Video rendering
│   └── fetch-media.ts           # Stock media fetcher
│
├── 📁 src/
│   ├── animations/          # Animation presets
│   ├── audio/               # Audio processing
│   ├── components/          # React visual components
│   ├── compositions/        # Remotion compositions
│   │   ├── BriefComposition.tsx
│   │   ├── EverReachCompilation.tsx
│   │   ├── ThermodynamicsVideo.tsx
│   │   └── StaticAds.tsx
│   ├── scenes/              # Scene templates
│   │   ├── IntroScene.tsx
│   │   ├── TopicScene.tsx
│   │   └── OutroScene.tsx
│   ├── styles/              # Themes and styling
│   └── types/               # TypeScript definitions
│
├── 📁 output/               # Rendered videos
│   └── explainer/           # Explainer outputs
│
├── package.json             # npm scripts
├── remotion.config.ts       # Remotion config
├── tsconfig.json
└── .env.local               # API keys (gitignored)
```

### Key Entry Points

| File | Purpose |
|------|---------|
| `scripts/generate-explainer.ts` | **Main Pipeline** - Topic → Video |
| `scripts/generate-audio.ts` | Voice & SFX generation |
| `scripts/render.ts` | Remotion rendering wrapper |
| `src/Root.tsx` | All Remotion compositions |
| `src/compositions/BriefComposition.tsx` | Main brief renderer |

### Getting Started (Developer)

```bash
# 1. Clone and install
git clone <repo-url>
cd Remotion
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Add API keys

# 3. Test voice cloning
python3 scripts/test-indextts2.py

# 4. Preview in Studio
npm run dev

# 5. Generate first video
npm run generate:explainer -- --topic "How Batteries Work"
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Video Engine | Remotion 4.x |
| Language | TypeScript, Python 3 |
| AI Models | OpenAI GPT-4o, DALL-E 3, Whisper |
| Voice Clone | Hugging Face IndexTTS-2 |
| Stock Media | Pexels, Pixabay, NASA APIs |
| Sound Effects | ElevenLabs, Freesound |
| Package Manager | npm, pip |

---

## Roadmap

### ✅ Completed (v3.0)

- [x] Brief-driven video generation
- [x] Explainer video format with character consistency
- [x] Voice cloning (IndexTTS-2 + OpenAI fallback)
- [x] AI graphics generation (DALL-E 3)
- [x] Word-level timestamps (Whisper)
- [x] TikTok-style captions
- [x] Sound effects generation
- [x] Static ad compositions
- [x] Multi-format support (9:16, 16:9, 1:1)

### 🔄 In Progress

- [ ] GitHub Dev Vlog format (`devvlog_v1`)
- [ ] Code block syntax highlighting components
- [ ] Terminal animation components
- [ ] Batch video generation API

### 📋 Planned

- [ ] YouTube upload automation
- [ ] Thumbnail generator
- [ ] A/B testing framework
- [ ] Analytics dashboard
- [ ] Brand template marketplace
- [ ] Real-time collaboration

---

## Quality Assurance

### Timeline QA

```bash
# Validate timeline synchronization
npm run qa:timeline

# Run with warnings only (non-blocking)
npm run qa:timeline:warn
```

### Brief Validation

```bash
# Validate brief structure
npm run validate data/briefs/my_brief.json
```

### Audio Sync Check

- Voiceover duration matches section duration
- SFX timing aligns with visual cues
- Music doesn't overlap speech

---

## Support & Contact

**Repository:** `/Users/isaiahdupree/Documents/Software/Remotion`

**Documentation:**
- `docs/EXPLAINER_VIDEO_GUIDE.md` - Explainer pipeline
- `docs/VOICE_CLONING_GUIDE.md` - Voice cloning setup
- `docs/PRD.md` - Original PRD (v2.0)

---

*Document maintained by the Video Generation Platform team.*
*Last updated: January 17, 2026*
