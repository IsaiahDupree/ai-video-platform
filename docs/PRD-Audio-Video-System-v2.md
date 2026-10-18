# Audio & Video Production System PRD v2

## Overview

A comprehensive programmatic audio/video production system that provides:
- AI-addressable SFX library with manifest-based referencing
- Engine-agnostic audio events timeline (Remotion + Motion Canvas)
- Automatic audio mixing via FFmpeg
- Beat extraction and script-to-video pipeline
- Visual reveals system for SFX sync
- Policy-based SFX placement with anti-spam guards
- Hybrid format DSL for content types
- QA gates for pacing validation
- ElevenLabs integration for TTS and SFX generation

---

## Phase 1: Core Infrastructure ✅

### 1.1 SFX Library Structure
```
public/assets/sfx/
├── manifest.json          # AI-addressable index
├── CREDITS.md             # Attribution tracking
├── ui/                    # UI sounds (pops, dings)
├── transitions/           # Whooshes, swooshes
├── impacts/               # Bass hits, dramatic
└── ambient/               # Background atmosphere
```

### 1.2 Audio Types Schema
```typescript
interface AudioEvents {
  fps: number;
  events: Array<
    | { type: "sfx"; sfxId: string; frame: number; volume?: number }
    | { type: "music"; src: string; frame: number; volume?: number }
    | { type: "voiceover"; src: string; frame: number; volume?: number }
  >;
}
```

### 1.3 Zod Validation
- `SfxManifestZ` - Manifest schema validation
- `AudioEventsZ` - Audio events validation
- `parseAndValidateAudioEvents()` - LLM output parser

---

## Phase 2: Beat Extraction & Context ✅

### 2.1 Beat Extractor
Converts script text → beats with frames and actions:
```typescript
interface Beat {
  beatId: string;
  frame: number;
  text: string;
  action?: "hook" | "reveal" | "transition" | "punchline" | "cta" | "explain" | "error" | "success";
}
```

### 2.2 SFX Context Pack
Compact payload for LLM prompts with rules and sfxIndex.

### 2.3 Best Match Finder
Auto-fix hallucinated SFX IDs using tag/description similarity.

---

## Phase 3: Audio Pipeline ✅

### 3.1 FFmpeg Audio Mixer
```bash
npm run audio:mix
# Combines: voiceover + music + SFX → dist/audio_mix.wav
```

### 3.2 Remotion SfxLayer
```tsx
<SfxLayer events={events} manifest={manifest} />
```

### 3.3 Anti-Spam Thinning
- Min 0.35s between SFX
- Max 2 SFX per second
- De-dupe same ID within 0.2s

---

## Phase 4: ElevenLabs Integration ✅

### 4.1 Sound Effects Generation
```bash
ELEVENLABS_API_KEY=sk_... npx tsx scripts/generate-audio.ts \
  --sfx "epic whoosh transition" --output sfx.mp3
```

### 4.2 Text-to-Speech
```bash
ELEVENLABS_API_KEY=sk_... npx tsx scripts/generate-audio.ts \
  --tts "Your script text" --output vo.mp3
```

### 4.3 API Permissions Required
- ✅ `sound_generation`
- ✅ `text_to_speech`
- ✅ `voices_read`

---

## Phase 5: Hybrid Format DSL 🔄

### 5.1 Format Block Types
```typescript
type FormatBlock =
  | { type: "keyword"; text: string; event?: string }
  | { type: "bullet"; text: string; event?: string }
  | { type: "code"; text: string; event?: string }
  | { type: "error"; text: string; event?: string }
  | { type: "success"; text: string; event?: string }
  | { type: "cta"; text: string; event?: string };

type HybridFormat = {
  version: string;
  fps: number;
  style: { theme: string; fontScale: number };
  blocks: FormatBlock[];
};
```

### 5.2 Beat Actions
| Action | SFX Policy | Visual |
|--------|------------|--------|
| hook | reveal_riser + impact | Big keyword |
| reveal | impact_soft | Keyword fade-in |
| explain | text_ping | Bullet point |
| code | keyboard_tick | Monospace block |
| error | error_buzz | Red banner |
| success | success_ding | Green banner |
| transition | whoosh_fast | Scene change |
| punchline | impact_deep | Emphasis |
| cta | sparkle_rise | Call-to-action |

---

## Phase 6: Visual Reveals System 🔄

### 6.1 Reveal Recorder
Captures visual element appearances during render for SFX sync.

### 6.2 Reveal Types
```typescript
type VisualReveal = {
  t: number;           // Timestamp in seconds
  kind: "keyword" | "bullet" | "code" | "chart" | "cta" | "error" | "success";
  key?: string;        // Label for analytics
};
```

### 6.3 Pacing-Accurate Seeder
Uses WPM timing model to generate seed reveals before first render.

---

## Phase 7: Macro Cues & Policy 🔄

### 7.1 Macro Cue Types
| Macro | Maps To | When |
|-------|---------|------|
| `reveal_riser` | tension_build.wav | Before keyword |
| `impact_soft` | soft_hit.wav | On reveal |
| `text_ping` | ui_pop.wav | Bullet appear |
| `whoosh_fast` | whoosh_02.wav | Transitions |
| `error_buzz` | error_alert.wav | Error state |
| `success_ding` | success_chime.wav | Success state |

### 7.2 Policy Rules
- Cooldown: 0.35s between same-category SFX
- Priority: reveals > transitions > ui
- Density: max 3 SFX in 2s window

---

## Phase 8: Motion Canvas Integration 🔄

### 8.1 Playwright Renderer
Headless browser automation for Motion Canvas rendering.

### 8.2 Two-Pass Pipeline
```
Pass 1: Render with seed reveals → Capture real reveals
Pass 2: Rebuild audio with real timing → Final render
```

### 8.3 Pipeline Commands
```bash
pnpm mc:hybrid:final
# format:prep → render → sfx:policy → audio:bus → render
```

---

## Phase 9: Timeline QA ✅

### 9.1 QA Gate Rules
| Rule | Threshold | Action |
|------|-----------|--------|
| Ultra-tight gaps | < 0.20s | Fail |
| Dense zones | ≥ 8 events/3s | Fail |
| Gap warnings | > 12 gaps < 0.35s | Fail |

### 9.2 QA Report
```json
{
  "minGapSec": 0.35,
  "avgGapSec": 1.2,
  "denseZones": [],
  "gapWarnings": []
}
```

---

## Implementation Status

| Phase | Component | Status |
|-------|-----------|--------|
| 1 | SFX manifest, types, validation | ✅ |
| 2 | Beat extractor, context pack | ✅ |
| 3 | FFmpeg mixer, SfxLayer, thinning | ✅ |
| 4 | ElevenLabs TTS + SFX | ✅ |
| 5 | Hybrid format DSL | 🔄 Pending |
| 6 | Visual reveals system | 🔄 Pending |
| 7 | Macro cues & policy | 🔄 Pending |
| 8 | Motion Canvas integration | 🔄 Pending |
| 9 | Timeline QA gate | ✅ |

---

## File Structure

```
src/
├── audio/
│   ├── audio-types.ts          ✅
│   ├── audio-validate.ts       ✅
│   ├── beat-extractor.ts       ✅
│   ├── sfx-context-pack.ts     ✅
│   ├── sfx-thin.ts             ✅
│   ├── merge-events.ts         ✅
│   ├── timeline-qa.ts          ✅
│   └── SfxLayer.tsx            ✅
├── format/
│   ├── hybrid-types.ts         🔄
│   ├── format-dsl.ts           🔄
│   ├── reveal-recorder.ts      🔄
│   └── reveal-ui.tsx           🔄
└── sfx/
    ├── macro-cues.ts           🔄
    └── policy-engine.ts        🔄

scripts/
├── generate-audio.ts           ✅
├── build-audio-mix.ts          ✅
├── timeline-gate.ts            ✅
├── mc-render.ts                🔄
└── format-generator.ts         🔄

public/assets/sfx/
├── manifest.json               ✅
├── CREDITS.md                  ✅
└── [audio files]               ✅
```

---

## Quick Start

```bash
# 1. Extract beats from script
npm run sfx:beats data/script.txt 30

# 2. Generate SFX with ElevenLabs
ELEVENLABS_API_KEY=sk_... npm run generate:audio -- --sfx "whoosh" --output sfx.mp3

# 3. Generate TTS voiceover
ELEVENLABS_API_KEY=sk_... npm run generate:audio -- --tts "Hello world" --output vo.mp3

# 4. Mix audio (vo + music + sfx)
npm run audio:mix

# 5. Run QA gate
npm run qa:timeline
```
