# PRD: Remotion Templates & Video Generation

**Version:** 1.0  
**Date:** February 1, 2026  
**Status:** Ready for Implementation  
**Repo:** `/Documents/Software/Remotion/`  
**Effort:** 4-6 weeks  
**Priority:** 🔴 Critical (Enables multiple PRDs)

---

## Executive Summary

Expand the Remotion video generation system with templates to support all MediaPoster features: ad creatives, content repurposing, clip assembly, and brief-driven video generation.

---

## Features Requiring Remotion Support

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    REMOTION TEMPLATE REQUIREMENTS BY PRD                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  PRD                           │  TEMPLATES NEEDED                          │   │
│  ├─────────────────────────────────────────────────────────────────────────────┤   │
│  │                                │                                            │   │
│  │  PRD_META_ADS_AUTOPILOT        │  • AdCreative (video ads)                 │   │
│  │                                │  • AdStill (static image ads)             │   │
│  │                                │  • AdCarousel (multi-image)               │   │
│  │                                │  • HookVariant (A/B test hooks)           │   │
│  │                                │                                            │   │
│  │  PRD_CONTENT_REPURPOSING       │  • ClipExtractor (auto-clip)              │   │
│  │                                │  • VerticalReformat (9:16 from 16:9)      │   │
│  │                                │  • SubtitleOverlay (burned captions)      │   │
│  │                                │  • PlatformFormat (TikTok/Reels/Shorts)   │   │
│  │                                │                                            │   │
│  │  PRD_SORA_VIDEO_ORCHESTRATOR   │  • TimelineAssembler (multi-clip)         │   │
│  │                                │  • TransitionLayer (crossfades)           │   │
│  │                                │  • ColorGrader (style consistency)        │   │
│  │                                │                                            │   │
│  │  PRD_WAITLISTLAB_INTEGRATION   │  • PromoVideo (product promos)            │   │
│  │                                │  • TestimonialVideo (social proof)        │   │
│  │                                │                                            │   │
│  │  EXISTING (Brief-Driven)       │  • FullVideoDemo (explainer)              │   │
│  │                                │  • CharacterVideo (avatar-based)          │   │
│  │                                │                                            │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                       REMOTION VIDEO GENERATION SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         API LAYER (Port 6008)                                │   │
│  │                                                                              │   │
│  │   POST /render          → Render video from brief                           │   │
│  │   POST /render/batch    → Batch render multiple videos                      │   │
│  │   POST /render/ad       → Render ad creative                                │   │
│  │   POST /render/clip     → Extract clip from source                          │   │
│  │   POST /render/reformat → Reformat video (aspect ratio)                     │   │
│  │   POST /render/assemble → Assemble timeline from clips                      │   │
│  │   GET  /status/:id      → Check render status                               │   │
│  │   GET  /templates       → List available templates                          │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                              │
│                                       ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                       TEMPLATE REGISTRY                                      │   │
│  │                                                                              │   │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │   │
│  │  │   AD TEMPLATES  │ │ REPURPOSING     │ │  ASSEMBLY       │              │   │
│  │  │                 │ │                 │ │                 │              │   │
│  │  │ • AdCreative    │ │ • ClipExtractor │ │ • Timeline      │              │   │
│  │  │ • AdStill       │ │ • VerticalCrop  │ │ • Transitions   │              │   │
│  │  │ • AdCarousel    │ │ • SubtitleBurn  │ │ • ColorGrade    │              │   │
│  │  │ • HookVariant   │ │ • PlatformFit   │ │ • AudioMix      │              │   │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘              │   │
│  │                                                                              │   │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │   │
│  │  │  PROMO          │ │  CHARACTER      │ │  EXPLAINER      │              │   │
│  │  │                 │ │                 │ │                 │              │   │
│  │  │ • PromoVideo    │ │ • AvatarTalk    │ │ • FullVideo     │              │   │
│  │  │ • Testimonial   │ │ • CharacterGen  │ │ • SceneByScene  │              │   │
│  │  │ • ProductDemo   │ │                 │ │                 │              │   │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘              │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                              │
│                                       ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                       RENDER ENGINE                                          │   │
│  │                                                                              │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │   │
│  │  │  1. Parse Brief/Props                                                │   │   │
│  │  │  2. Load Template Composition                                        │   │   │
│  │  │  3. Fetch Media Assets (if needed)                                   │   │   │
│  │  │  4. Render via @remotion/renderer                                    │   │   │
│  │  │  5. Post-process (optional FFmpeg)                                   │   │   │
│  │  │  6. Upload to Storage                                                │   │   │
│  │  │  7. Return URL                                                       │   │   │
│  │  └─────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                              │   │
│  │  Output Formats:                                                            │   │
│  │  • 1080x1920 (9:16) - TikTok, Reels, Shorts                               │   │
│  │  • 1920x1080 (16:9) - YouTube, LinkedIn                                    │   │
│  │  • 1080x1080 (1:1)  - Instagram Feed, Facebook                            │   │
│  │  • 1200x628 (1.91:1)- Meta Ads landscape                                   │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Template Specifications

### 1. Ad Creative Templates

```
┌─────────────────────────────────────────────────────────────────┐
│  TEMPLATE: AdCreative                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Purpose: Generate video ads for Meta, TikTok, YouTube          │
│                                                                  │
│  Props:                                                          │
│  {                                                               │
│    hook: string,          // Opening text (first 3 sec)         │
│    body: string,          // Main message                       │
│    cta: string,           // Call to action                     │
│    ctaUrl: string,        // Landing page                       │
│    logoUrl: string,       // Brand logo                         │
│    backgroundVideo?: string,  // Optional B-roll                │
│    backgroundColor?: string,  // Solid color fallback           │
│    accentColor: string,   // Brand color                        │
│    fontFamily: string,    // Typography                         │
│    duration: number,      // 15, 30, or 60 seconds             │
│    aspectRatio: "9:16" | "16:9" | "1:1"                        │
│  }                                                               │
│                                                                  │
│  Structure:                                                      │
│  ┌────────────────────────────────────────────────────────────┐│
│  │  [0-3s]  Hook text with attention-grab animation           ││
│  │  [3-20s] Body message with supporting visuals              ││
│  │  [20-25s] CTA with button animation                        ││
│  │  [25-30s] Logo reveal + end card                           ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  TEMPLATE: HookVariant                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Purpose: Generate multiple hook variations for A/B testing     │
│                                                                  │
│  Props:                                                          │
│  {                                                               │
│    baseVideo: string,     // Source video URL                   │
│    hooks: string[],       // Array of hook texts to test        │
│    hookDuration: number,  // How long hook displays (default 3s)│
│    hookStyle: "text-overlay" | "text-reveal" | "kinetic"       │
│    outputFormat: "9:16" | "16:9"                               │
│  }                                                               │
│                                                                  │
│  Output: Multiple videos, one per hook                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Content Repurposing Templates

```
┌─────────────────────────────────────────────────────────────────┐
│  TEMPLATE: ClipExtractor                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Purpose: Extract engaging clips from longer videos             │
│                                                                  │
│  Props:                                                          │
│  {                                                               │
│    sourceVideo: string,   // Original video path/URL            │
│    clips: [                                                     │
│      {                                                          │
│        startTime: number, // Seconds                            │
│        endTime: number,                                         │
│        label?: string     // Clip name                          │
│      }                                                          │
│    ],                                                           │
│    outputFormat: "9:16" | "16:9" | "1:1",                      │
│    addCaptions: boolean,                                        │
│    captionStyle: CaptionStyle                                   │
│  }                                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  TEMPLATE: VerticalReformat                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Purpose: Convert 16:9 video to 9:16 for TikTok/Reels          │
│                                                                  │
│  Props:                                                          │
│  {                                                               │
│    sourceVideo: string,                                         │
│    cropMode: "center" | "speaker-track" | "dynamic",           │
│    addPadding: boolean,   // Blur bars if needed               │
│    paddingStyle: "blur" | "solid" | "gradient",                │
│    transcript?: Transcript, // For speaker tracking            │
│  }                                                               │
│                                                                  │
│  Modes:                                                          │
│  • center: Simple center crop                                   │
│  • speaker-track: Follow speaker face (requires face detect)    │
│  • dynamic: AI-selected focus points                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  TEMPLATE: SubtitleOverlay                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Purpose: Burn captions into video (TikTok/Reels style)        │
│                                                                  │
│  Props:                                                          │
│  {                                                               │
│    sourceVideo: string,                                         │
│    transcript: [                                                │
│      {word, start, end, confidence}                            │
│    ],                                                           │
│    style: {                                                     │
│      font: string,                                              │
│      fontSize: number,                                          │
│      color: string,                                             │
│      highlightColor: string, // Word-by-word highlight         │
│      position: "bottom" | "center" | "top",                    │
│      animation: "none" | "pop" | "typewriter" | "karaoke"      │
│    }                                                            │
│  }                                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  TEMPLATE: PlatformFormat                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Purpose: Format video for specific platform requirements       │
│                                                                  │
│  Props:                                                          │
│  {                                                               │
│    sourceVideo: string,                                         │
│    platform: "tiktok" | "reels" | "shorts" | "linkedin",       │
│    addWatermark: boolean,                                       │
│    addEndCard: boolean,                                         │
│    endCardCTA: string,                                          │
│    maxDuration: number,   // Platform limit (60s, 90s, etc)    │
│  }                                                               │
│                                                                  │
│  Platform-specific handling:                                     │
│  • TikTok: 9:16, max 3min, trending audio support              │
│  • Reels: 9:16, max 90s, music overlay                         │
│  • Shorts: 9:16, max 60s, subscribe end card                   │
│  • LinkedIn: 16:9 or 1:1, professional styling                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Timeline Assembly Templates

```
┌─────────────────────────────────────────────────────────────────┐
│  TEMPLATE: TimelineAssembler                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Purpose: Combine multiple clips into final video               │
│           (For Sora orchestrator output)                        │
│                                                                  │
│  Props:                                                          │
│  {                                                               │
│    clips: [                                                     │
│      {                                                          │
│        videoUrl: string,                                        │
│        duration: number,                                        │
│        transitionIn?: "fade" | "slide" | "zoom" | "none",      │
│        transitionOut?: "fade" | "slide" | "zoom" | "none",     │
│        transitionDuration?: number                              │
│      }                                                          │
│    ],                                                           │
│    audio?: {                                                    │
│      voiceover?: string,    // VO track                        │
│      music?: string,        // Background music                 │
│      musicVolume?: number,  // 0-1                             │
│      ducking?: boolean      // Lower music during VO           │
│    },                                                           │
│    colorGrade?: {                                               │
│      lut?: string,          // LUT file                        │
│      brightness?: number,                                       │
│      contrast?: number,                                         │
│      saturation?: number                                        │
│    },                                                           │
│    outputFormat: "9:16" | "16:9" | "1:1"                       │
│  }                                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Promo Templates

```
┌─────────────────────────────────────────────────────────────────┐
│  TEMPLATE: PromoVideo                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Purpose: Product/service promotional video                     │
│           (For WaitlistLab offers)                              │
│                                                                  │
│  Props:                                                          │
│  {                                                               │
│    product: {                                                   │
│      name: string,                                              │
│      tagline: string,                                           │
│      features: string[],                                        │
│      price?: string,                                            │
│      logoUrl: string                                            │
│    },                                                           │
│    style: {                                                     │
│      theme: "modern" | "minimal" | "bold" | "playful",         │
│      primaryColor: string,                                      │
│      secondaryColor: string                                     │
│    },                                                           │
│    media: {                                                     │
│      heroImage?: string,                                        │
│      screenshots?: string[],                                    │
│      demoVideo?: string                                         │
│    },                                                           │
│    cta: {                                                       │
│      text: string,                                              │
│      url: string                                                │
│    },                                                           │
│    duration: 15 | 30 | 60                                      │
│  }                                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  TEMPLATE: TestimonialVideo                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Purpose: Social proof video with customer quotes               │
│                                                                  │
│  Props:                                                          │
│  {                                                               │
│    testimonials: [                                              │
│      {                                                          │
│        quote: string,                                           │
│        author: string,                                          │
│        title?: string,                                          │
│        avatar?: string,                                         │
│        videoClip?: string  // Optional talking head            │
│      }                                                          │
│    ],                                                           │
│    product: {                                                   │
│      name: string,                                              │
│      logoUrl: string                                            │
│    },                                                           │
│    style: "cards" | "fullscreen" | "split",                    │
│    cta?: string                                                 │
│  }                                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Specification

### Render Endpoints

```yaml
# POST /render
# Render video from brief (existing)
Request:
  template: string
  props: object
  outputFormat: string
Response:
  jobId: string
  status: "queued"

# POST /render/ad
# Render ad creative
Request:
  template: "AdCreative" | "AdStill" | "HookVariant"
  props:
    hook: string
    body: string
    cta: string
    ...
  variants: number (optional, for batch)
Response:
  jobId: string
  variantCount: number

# POST /render/clip
# Extract clips from source video
Request:
  sourceVideo: string
  clips: [{startTime, endTime, label}]
  outputFormat: string
  addCaptions: boolean
Response:
  jobId: string
  clipCount: number

# POST /render/reformat
# Reformat video aspect ratio
Request:
  sourceVideo: string
  targetFormat: "9:16" | "16:9" | "1:1"
  cropMode: "center" | "speaker-track" | "dynamic"
Response:
  jobId: string

# POST /render/assemble
# Assemble timeline from clips
Request:
  clips: [{videoUrl, duration, transitionIn, transitionOut}]
  audio: {voiceover, music, musicVolume}
  colorGrade: object
Response:
  jobId: string

# GET /status/:jobId
# Check render status
Response:
  status: "queued" | "rendering" | "complete" | "failed"
  progress: number (0-100)
  outputUrl: string (if complete)
  error: string (if failed)

# GET /templates
# List available templates
Response:
  templates: [
    {
      id: string
      name: string
      category: string
      propSchema: object
      previewUrl: string
    }
  ]
```

---

## File Structure

```
Remotion/
├── src/
│   ├── index.ts
│   ├── Root.tsx                    # Register all compositions
│   │
│   ├── templates/                  # NEW: Template compositions
│   │   ├── index.ts
│   │   │
│   │   ├── ads/
│   │   │   ├── AdCreative.tsx      # Video ad template
│   │   │   ├── AdStill.tsx         # Static ad template
│   │   │   ├── AdCarousel.tsx      # Multi-image ad
│   │   │   ├── HookVariant.tsx     # Hook A/B testing
│   │   │   └── styles/
│   │   │       ├── modern.ts
│   │   │       ├── bold.ts
│   │   │       └── minimal.ts
│   │   │
│   │   ├── repurposing/
│   │   │   ├── ClipExtractor.tsx   # Clip extraction
│   │   │   ├── VerticalReformat.tsx # 16:9 → 9:16
│   │   │   ├── SubtitleOverlay.tsx # Burned captions
│   │   │   └── PlatformFormat.tsx  # Platform-specific
│   │   │
│   │   ├── assembly/
│   │   │   ├── TimelineAssembler.tsx
│   │   │   ├── Transitions.tsx
│   │   │   └── ColorGrader.tsx
│   │   │
│   │   └── promo/
│   │       ├── PromoVideo.tsx
│   │       └── TestimonialVideo.tsx
│   │
│   ├── components/                 # Shared components
│   │   ├── TextReveal.tsx
│   │   ├── LogoAnimation.tsx
│   │   ├── CTAButton.tsx
│   │   ├── Caption.tsx
│   │   ├── Transition.tsx
│   │   └── EndCard.tsx
│   │
│   ├── hooks/                      # Custom hooks
│   │   ├── useVideoMetadata.ts
│   │   ├── useTranscript.ts
│   │   └── useAudioSync.ts
│   │
│   └── utils/
│       ├── aspect-ratio.ts
│       ├── color-grade.ts
│       └── duration.ts
│
├── scripts/
│   ├── api-render.ts              # HTTP API server
│   ├── render-ad.ts               # Ad render CLI
│   ├── render-clip.ts             # Clip extract CLI
│   ├── render-assemble.ts         # Timeline assembly CLI
│   └── batch-render.ts            # Batch operations
│
└── data/
    ├── luts/                      # Color grading LUTs
    ├── fonts/                     # Typography
    └── presets/                   # Template presets
```

---

## Implementation Phases

### Phase 1: Ad Templates (Week 1-2)
| Task | Effort |
|------|--------|
| AdCreative template | 12h |
| AdStill template | 6h |
| HookVariant (A/B hooks) | 8h |
| Ad render API endpoint | 4h |
| Style presets (modern, bold, minimal) | 6h |

### Phase 2: Repurposing Templates (Week 2-3)
| Task | Effort |
|------|--------|
| ClipExtractor template | 8h |
| VerticalReformat (crop modes) | 10h |
| SubtitleOverlay (karaoke style) | 12h |
| PlatformFormat | 6h |
| Reformat API endpoint | 4h |

### Phase 3: Assembly Templates (Week 4)
| Task | Effort |
|------|--------|
| TimelineAssembler | 10h |
| Transitions library | 6h |
| ColorGrader (LUT support) | 6h |
| Audio mixing | 6h |
| Assemble API endpoint | 4h |

### Phase 4: Promo Templates (Week 5)
| Task | Effort |
|------|--------|
| PromoVideo template | 10h |
| TestimonialVideo template | 8h |
| Component library polish | 6h |

### Phase 5: Integration & Testing (Week 6)
| Task | Effort |
|------|--------|
| MediaPoster integration | 8h |
| media-pipeline endpoints | 6h |
| Batch rendering | 4h |
| Testing all templates | 8h |

---

## Integration with MediaPoster

```python
# Backend/services/microservices_client.py

class MicroservicesClient:
    REMOTION_URL = "http://localhost:6008"  # New dedicated port
    
    # Ad rendering
    async def render_ad_creative(self, props: dict) -> dict:
        return await self._post(
            f"{self.REMOTION_URL}/render/ad",
            {"template": "AdCreative", "props": props}
        )
    
    # Content repurposing
    async def extract_clips(
        self, 
        source_video: str, 
        clips: list,
        add_captions: bool = True
    ) -> dict:
        return await self._post(
            f"{self.REMOTION_URL}/render/clip",
            {
                "sourceVideo": source_video,
                "clips": clips,
                "addCaptions": add_captions
            }
        )
    
    # Vertical reformat
    async def reformat_vertical(
        self,
        source_video: str,
        crop_mode: str = "center"
    ) -> dict:
        return await self._post(
            f"{self.REMOTION_URL}/render/reformat",
            {
                "sourceVideo": source_video,
                "targetFormat": "9:16",
                "cropMode": crop_mode
            }
        )
    
    # Timeline assembly (for Sora orchestrator)
    async def assemble_timeline(
        self,
        clips: list,
        audio: dict = None
    ) -> dict:
        return await self._post(
            f"{self.REMOTION_URL}/render/assemble",
            {"clips": clips, "audio": audio}
        )
```

---

## Environment Variables

```bash
# Remotion
REMOTION_PORT=6008
REMOTION_OUTPUT_DIR=/tmp/remotion-output
REMOTION_CONCURRENCY=2

# Storage
STORAGE_BUCKET=mediaposter-videos
STORAGE_REGION=us-east-1

# FFmpeg (post-processing)
FFMPEG_PATH=/usr/local/bin/ffmpeg
```

---

## Success Criteria

- [ ] Ad templates render in <30 seconds
- [ ] Clip extraction with accurate timestamps
- [ ] Vertical reformat maintains quality
- [ ] Subtitle overlay syncs with transcript
- [ ] Timeline assembly with smooth transitions
- [ ] Batch rendering 10+ videos in parallel
- [ ] All templates accessible via API

---

*Document created: February 1, 2026*
