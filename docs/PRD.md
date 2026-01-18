# VideoStudio PRD (Product Requirements Document)

**Version:** 2.0  
**Last Updated:** December 28, 2025  
**Status:** In Development

---

## Overview

VideoStudio is a programmatic video generation system built on Remotion that enables automated creation of engaging video content from structured JSON briefs. The system is designed for YouTube automation, supporting both Shorts (9:16) and longform (16:9) content in the **tech and aerospace** niche.

---

## Goals

1. **Automated Video Generation** - Generate videos from JSON content briefs without manual editing
2. **Style Recreation** - Analyze YouTube videos and recreate their visual style with new content
3. **AI Asset Generation** - Generate custom icons, props, and graphics using DALL-E
4. **Free Media Integration** - Pull stock footage, images, GIFs, and SFX from free APIs
5. **Kinetic Text Explainers** - Support beat-driven explainer format with animated typography

---

## Target Use Cases

| Format | Aspect | Duration | Style |
|--------|--------|----------|-------|
| YouTube Shorts | 9:16 | 15-60s | Fast cuts, big text, high energy |
| Longform Explainer | 16:9 | 3-15min | Structured beats, b-roll, diagrams |
| Tech/Aerospace Content | Both | Variable | Mission footage, data viz, kinetic text |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Content Brief (JSON)                     │
│  - metadata, settings, style, sections[], assets            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Asset Resolver                           │
│  - Fetches media from APIs (NASA, Pexels, Pixabay, etc.)    │
│  - Downloads to local cache                                  │
│  - Stores attribution/license metadata                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Render Engine (Remotion)                 │
│  - Scene templates (Intro, Topic, Outro)                    │
│  - Animation presets (bounce, slide, neon, etc.)            │
│  - Visual effects (particles, glow, overlays)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Output                                   │
│  - MP4 video file                                           │
│  - Attribution manifest                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Free Media API Stack

### Stock Video & Images (B-roll)

| Provider | API | Rate Limit | License | Best For |
|----------|-----|------------|---------|----------|
| **Pexels** | api.pexels.com | 200/hr, 20k/mo | Free, attribution | Clean tech b-roll |
| **Pixabay** | pixabay.com/api | 5000/hr | Free, attribution | Wide coverage |
| **NASA** | images-api.nasa.gov | Unlimited | Public domain* | Space/aerospace footage |
| **Openverse** | api.openverse.org | 100/min | CC (varies) | Fallback/niche |

*NASA imagery is generally public domain, but logos/insignias are protected.

### GIFs & Memes

| Provider | API | Rate Limit | Best For |
|----------|-----|------------|----------|
| **Tenor** | tenor.googleapis.com | 1/sec | Reaction GIFs |
| **GIPHY** | api.giphy.com | 100/hr (beta) | Trending GIFs |
| **Imgflip** | api.imgflip.com | Unlimited | Meme generation |

### Sound Effects

| Provider | API | License | Best For |
|----------|-----|---------|----------|
| **Freesound** | freesound.org/apiv2 | CC (varies) | SFX library |
| **YouTube Audio Library** | Manual | YouTube-safe | Background music |

### AI-Generated Assets

| Provider | API | Best For |
|----------|-----|----------|
| **OpenAI DALL-E** | api.openai.com | Custom icons, props, backgrounds |

---

## Content Brief Schema

```typescript
interface ContentBrief {
  id: string;
  format: 'explainer_v1' | 'shorts_v1' | 'listicle_v1';
  version: string;
  created_at: string;
  
  metadata: {
    title: string;
    description?: string;
    tags?: string[];
  };
  
  settings: {
    resolution: { width: number; height: number };
    fps: number;
    duration_sec: number;
    aspect_ratio: '9:16' | '16:9' | '1:1';
  };
  
  style: {
    theme: 'dark' | 'light';
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    font_heading: string;
    font_body: string;
    background_type: 'solid' | 'gradient' | 'image' | 'video';
    background_value: string;
  };
  
  animations?: {
    intro_style: 'cinematic' | 'energetic' | 'minimal' | 'neon' | 'glitch';
    topic_style: 'slide' | 'pop' | 'bounce' | 'zoom' | 'fade';
    show_particles: boolean;
    show_progress: boolean;
  };
  
  assets?: {
    icons?: Record<string, string>;
    emojis?: Record<string, string>;
    props?: Record<string, string>;
    backgrounds?: Record<string, string>;
  };
  
  sections: Section[];
}

interface Section {
  id: string;
  type: 'intro' | 'topic' | 'list_item' | 'outro';
  duration_sec: number;
  start_time_sec: number;
  content: SectionContent;
  assets?: {
    icon?: string;
    emoji?: string;
    prop?: string;
    broll?: BrollSlot;
  };
  animation?: string;
}

interface BrollSlot {
  queries: string[];
  provider_order: ('nasa' | 'pexels' | 'pixabay')[];
  constraints: {
    orientation?: 'portrait' | 'landscape' | 'any';
    duration_min?: number;
    duration_max?: number;
  };
}
```

---

## Beat Schema (Kinetic Text Explainer)

```json
{
  "meta": { 
    "title": "Why Rockets Need Staging", 
    "fps": 30, 
    "aspect": "9:16" 
  },
  "beats": [
    {
      "id": "b1",
      "dur": 3.2,
      "voice": "Staging isn't extra. It's survival.",
      "text": {
        "headline": "STAGING = SURVIVAL",
        "subhead": "Not optional.",
        "emphasis": ["SURVIVAL"]
      },
      "bg": {
        "type": "video",
        "queries": ["rocket separation", "stage separation"],
        "provider_order": ["nasa", "pexels", "pixabay"],
        "constraints": { "minDur": 2, "maxDur": 8 }
      },
      "sfx": { 
        "query": "whoosh short", 
        "license_allowlist": ["CC0", "CC-BY"] 
      }
    }
  ]
}
```

---

## Animation Presets

### Entrance Animations
- `fadeIn` - Simple opacity fade
- `slideUp` / `slideDown` / `slideLeft` / `slideRight` - Directional slides
- `popIn` - Spring scale from 0
- `bounceIn` - Spring with overshoot
- `zoomIn` - Scale from large
- `glitchIn` - Digital glitch effect
- `typewriter` - Character-by-character reveal

### Exit Animations
- `fadeOut`, `slideOutUp`, `slideOutDown`, `popOut`, `zoomOut`

### Loop Animations
- `float` - Gentle vertical bob
- `pulse` - Scale breathing
- `rotate` - Continuous spin
- `shimmer` - Highlight sweep
- `glow` - Opacity pulse

### Style Presets
| Preset | Entrance | Exit | Vibe |
|--------|----------|------|------|
| `professional` | fadeIn | fadeOut | Corporate, clean |
| `energetic` | bounceIn | popOut | Social media, fun |
| `cinematic` | zoomIn | zoomOut | Dramatic, epic |
| `playful` | popIn | slideOutDown | Casual, friendly |
| `minimal` | slideUp | fadeOut | Modern, subtle |
| `glitch` | glitchIn | fadeOut | Tech, cyberpunk |

---

## Visual Effects Components

```tsx
// Particles
<FloatingParticles count={30} color="#8b5cf6" direction="up" />

// Glow
<GlowOrb color="#3b82f6" intensity={0.8} pulse />
<NeonGlow color="#00ff88">{children}</NeonGlow>

// Overlays
<VignetteOverlay opacity={0.5} />
<GradientOverlay colors={['#000', 'transparent']} />
<NoiseOverlay opacity={0.05} />
<ScanlineOverlay lineHeight={4} />

// Text Effects
<GradientText colors={['#3b82f6', '#8b5cf6']} />
<AnimatedHighlight color="#fbbf24" />

// Decorations
<DecorativeCircle color="#8b5cf6" position={{x: 80, y: 20}} />
<GridPattern spacing={50} opacity={0.05} />

// UI Elements
<ProgressBar progress={0.5} color="#8b5cf6" />
<LowerThird title="Name" subtitle="Title" />
<AnimatedEmoji emoji="🚀" animate="bounce" />
```

---

## File Structure

```
Remotion/
├── data/
│   ├── briefs/              # Content brief JSON files
│   └── asset-batch.json     # AI asset generation config
├── docs/
│   └── PRD.md               # This document
├── output/                   # Rendered videos
├── public/
│   └── assets/              # Generated/downloaded assets
│       ├── icon/
│       ├── emoji/
│       ├── prop/
│       ├── background/
│       └── broll/
├── scripts/
│   ├── analyze-youtube.py   # YouTube style analyzer
│   ├── generate-assets.py   # AI asset generator (DALL-E)
│   ├── fetch-media.ts       # Free API media fetcher
│   └── batch-render.ts      # Batch rendering script
└── src/
    ├── animations/
    │   └── presets.ts       # Animation library
    ├── components/
    │   └── effects/         # Visual effects components
    ├── compositions/
    │   ├── BriefComposition.tsx
    │   └── AssetComposition.tsx
    ├── scenes/
    │   ├── IntroScene.tsx
    │   ├── TopicScene.tsx
    │   ├── EnhancedIntro.tsx
    │   └── EnhancedTopic.tsx
    └── types/
        └── ContentBrief.ts
```

---

## Asset Attribution Requirements

### Per-Asset Metadata (store this!)

```json
{
  "asset_id": "pexels_12345",
  "provider": "pexels",
  "source_url": "https://pexels.com/video/12345",
  "download_url": "https://...",
  "creator": "John Doe",
  "license": "Pexels License",
  "attribution_text": "Video by John Doe from Pexels",
  "downloaded_at": "2025-12-28T15:00:00Z",
  "local_path": "public/assets/broll/pexels_12345.mp4"
}
```

### License Rules for Monetization

| License | Can Monetize? | Attribution Required? |
|---------|---------------|----------------------|
| CC0 | ✅ Yes | ❌ No |
| CC-BY | ✅ Yes | ✅ Yes |
| CC-BY-SA | ✅ Yes | ✅ Yes (share-alike) |
| CC-BY-NC | ❌ No | ✅ Yes |
| Pexels/Pixabay | ✅ Yes | Recommended |
| NASA (general) | ✅ Yes | Recommended |

---

## Rendering Commands

```bash
# Single video from brief
npx remotion render BriefComposition output/video.mp4 \
  --props="$(cat data/briefs/my_brief.json | jq -c '{brief: .}')"

# With AI assets
npx remotion render AssetComposition output/video.mp4 \
  --props="$(cat data/briefs/video_with_assets.json | jq -c '{brief: .}')"

# Batch render
npx tsx scripts/batch-render.ts

# Generate AI assets
source venv/bin/activate
OPENAI_API_KEY="sk-..." python3 scripts/generate-assets.py batch data/asset-batch.json
```

---

## Roadmap

### ✅ Completed
- [x] Base VideoStudio architecture
- [x] Content brief schema & validation
- [x] Scene templates (Intro, Topic, Outro)
- [x] YouTube style analyzer (AI vision)
- [x] Animation presets library
- [x] Visual effects components
- [x] AI asset generator (DALL-E)
- [x] Asset-enhanced compositions

### 🔄 In Progress
- [ ] Free media API integrations (Pexels, Pixabay, NASA, Freesound)
- [ ] Asset fetcher/resolver script
- [ ] Attribution tracking system

### 📋 Planned
- [ ] Voice-over integration (ElevenLabs/OpenAI TTS)
- [ ] Auto-captioning (Whisper)
- [ ] Thumbnail generator
- [ ] YouTube upload automation
- [ ] A/B testing framework

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Video Engine | Remotion |
| Language | TypeScript, Python |
| AI Vision | OpenAI GPT-4o-mini |
| AI Images | OpenAI DALL-E 3 |
| Stock Media | Pexels, Pixabay, NASA APIs |
| SFX | Freesound API |
| Package Manager | npm, pip |

---

## API Keys Required

| Service | Environment Variable | Required For |
|---------|---------------------|--------------|
| OpenAI | `OPENAI_API_KEY` | AI assets, style analysis |
| Pexels | `PEXELS_API_KEY` | Stock video/images |
| Pixabay | `PIXABAY_API_KEY` | Stock video/images |
| Freesound | `FREESOUND_API_KEY` | Sound effects |

---

*Document maintained by VideoStudio development team.*
