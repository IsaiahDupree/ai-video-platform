# SFX & Audio System PRD

## Overview

A programmatic sound effects and audio system that works with both Remotion and Motion Canvas, providing:
- AI-addressable SFX library with manifest-based referencing
- Neutral audio events timeline schema (engine-agnostic)
- Automatic audio mixing via FFmpeg
- Beat extraction from scripts
- Policy-based SFX placement with anti-spam guards
- QA gates for pacing validation

## Goals

1. **AI-Addressable Library**: SFX referenced by stable IDs with tags/descriptions for LLM context
2. **Engine-Agnostic**: Same `audio_events.json` works for Remotion (layered) and Motion Canvas (mixed)
3. **Programmatic Placement**: AI outputs `sfxIds` + frame offsets, validated against manifest
4. **Quality Gates**: Prevent spam, ensure pacing, fail-fast on hallucinated IDs

---

## Architecture

### 1. SFX Library Structure

```
public/assets/sfx/
├── manifest.json          # AI-addressable index
├── CREDITS.md             # Attribution tracking
├── ui/                    # UI sounds (pops, dings, notifications)
├── transitions/           # Whooshes, swooshes, slides
├── impacts/               # Bass hits, drops, dramatic
└── ambient/               # Background, atmosphere
```

### 2. Manifest Schema

```typescript
interface SfxManifest {
  version: string;
  items: Array<{
    id: string;              // Stable key AI uses
    file: string;            // Relative path (ui/pop_01.wav)
    tags: string[];          // For AI matching
    description: string;     // Human + AI readable
    intensity?: number;      // 1-10 scale
    category?: string;       // ui | transition | impact | ambient
    license?: {
      source?: string;
      requiresAttribution?: boolean;
      attributionText?: string;
      url?: string;
    };
  }>;
}
```

### 3. Audio Events Schema (Engine-Agnostic)

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

---

## Components

### 1. SFX Context Pack (AI Integration)

Compact payload for LLM prompts:

```typescript
interface SfxContextPack {
  version: string;
  rules: string[];
  sfxIndex: Array<{
    id: string;
    tags: string[];
    desc: string;
    intensity?: number;
    category?: string;
  }>;
}
```

**Usage**: AI retrieves candidates by tags/description, outputs only valid `sfxIds`.

### 2. Remotion: SfxLayer Component

```tsx
<SfxLayer events={events} manifest={manifest} basePath="sfx/" />
```

- Maps `audio_events.json` → `<Sequence from={frame}>` + `<Audio />`
- Validates IDs against manifest, fails loud on unknown

### 3. Motion Canvas: Audio Mixer

Since Motion Canvas uses single audio track:

```bash
pnpm build:audio  # FFmpeg mixes vo + music + sfx → dist/audio_mix.wav
```

**project.ts**:
```typescript
export default makeProject({
  scenes: [...],
  audio: "dist/audio_mix.wav"
});
```

### 4. Beat Extractor

Converts script text → beats with frames:

```typescript
interface Beat {
  beatId: string;
  frame: number;
  text: string;
  action?: "hook" | "reveal" | "transition" | "punchline" | "cta" | "explain";
}
```

**Timing**: Uses WPM estimate (default 165) to assign frame offsets.

### 5. Timeline Events

```typescript
interface TimelineEvent {
  name: string;      // Event ID for waitUntil()
  t: number;         // Seconds
  action: string;    // Beat action type
  blockId: string;   // Format block reference
  text: string;      // Content
}
```

### 6. QA Gate

Fails build if pacing issues detected:

| Rule | Threshold | Action |
|------|-----------|--------|
| Ultra-tight gaps | < 0.20s | Fail |
| Dense zones | ≥ 8 events in 3s | Fail |
| Too many warnings | > 12 gaps < 0.35s | Fail |

---

## Scripts

| Script | Purpose |
|--------|---------|
| `pnpm sfx:events` | Generate SFX events from script via AI |
| `pnpm audio:merge` | Merge base (vo/music) + sfx events |
| `pnpm audio:mix` | FFmpeg mix → single audio file |
| `pnpm qa:timeline` | Run QA gate on timeline |
| `pnpm audio:all` | Full pipeline: events → merge → mix |

---

## Pipeline Flow

```
script.txt
    ↓
[Beat Extractor] → beats.sec.json
    ↓
[AI + Context Pack] → audio_events.sfx.json
    ↓
[Validate + Fix] → cleaned events (reject hallucinated IDs)
    ↓
[Anti-Spam] → thinned events (max density limits)
    ↓
[Merge] + base events → audio_events.json
    ↓
[QA Gate] → pass/fail
    ↓
┌─────────────────┬─────────────────┐
│    Remotion     │  Motion Canvas  │
│  <SfxLayer />   │  audio_mix.wav  │
└─────────────────┴─────────────────┘
```

---

## Implementation Checklist

- [x] SFX manifest.json structure
- [x] SFX context pack generator
- [x] Remotion SfxLayer component
- [ ] Zod validation schemas
- [ ] FFmpeg audio mixer script
- [ ] Beat extractor from script
- [ ] AI prompt template for SFX selection
- [ ] Auto-fix for hallucinated IDs
- [ ] Anti-spam/thinning pass
- [ ] Merge utility (base + sfx)
- [ ] Duration clamp (don't exceed comp length)
- [ ] Snap-to-beat utility
- [ ] Timeline events generator
- [ ] QA gate script
- [ ] Visual reveals seeder

---

## File Locations

```
src/
├── audio/
│   ├── sfx-context-pack.ts    # AI context builder
│   ├── SfxLayer.tsx           # Remotion component
│   ├── audio-types.ts         # Shared type definitions
│   ├── audio-validate.ts      # Zod schemas
│   ├── merge-events.ts        # Merge base + sfx
│   ├── clamp-duration.ts      # Duration safety
│   ├── snap-to-beats.ts       # Beat alignment
│   └── sfx-thin.ts            # Anti-spam
├── format/
│   ├── beat-extractor.ts      # Script → beats
│   ├── timing.ts              # WPM estimation
│   └── generate-pack.ts       # One-pass generator

scripts/
├── build-audio-mix.ts         # FFmpeg mixer
├── merge-audio.ts             # Merge CLI
└── timeline-gate.ts           # QA gate

data/
├── audio_events.json          # Final merged events
├── audio_events.sfx.json      # SFX-only events
├── beats.sec.json             # Extracted beats
├── timeline.events.json       # Named events
└── qa.timeline_report.json    # QA results
```

---

## Sources

- YouTube SFX packs (no copyright)
- ElevenLabs AI generation
- OpenAI TTS for voiceover
- Freesound / Mixkit / Pixabay (with attribution)
