# Video Production Toolkit - Integration Guide

## Overview

This guide explains how to extract and integrate the Remotion and Motion Canvas video production tools into another workspace/project.

---

## Quick Start

```bash
# From your new project root:
./scripts/extract-video-toolkit.sh /path/to/new/project

# Or manually copy the required files (see below)
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VIDEO PRODUCTION TOOLKIT                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Remotion   │    │   Motion    │    │    Shared   │     │
│  │  (Primary)  │    │   Canvas    │    │   Assets    │     │
│  │             │    │ (Secondary) │    │             │     │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘     │
│         │                  │                  │             │
│  ┌──────┴──────────────────┴──────────────────┴──────┐     │
│  │              CORE COMPONENTS                       │     │
│  │  • AnimatedCaptions  • TikTokCaptions             │     │
│  │  • AICharacter       • SfxLayer                   │     │
│  │  • Audio Pipeline    • Format DSL                 │     │
│  └───────────────────────────────────────────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Files to Copy

### Option A: Remotion Only (Recommended)

```
your-project/
├── package.json                    # Merge dependencies
├── remotion.config.ts              # Copy as-is
├── src/
│   ├── index.ts                    # Entry point
│   ├── Root.tsx                    # Composition registry
│   ├── components/
│   │   ├── AnimatedCaptions.tsx    # Caption system
│   │   ├── TikTokCaptions.tsx      # Viral caption styles
│   │   └── AICharacter.tsx         # AI character animations
│   ├── compositions/
│   │   ├── BriefComposition.tsx    # Data-driven videos
│   │   └── FullVideoDemo.tsx       # Full capabilities
│   ├── audio/
│   │   ├── audio-types.ts          # Type definitions
│   │   ├── audio-validate.ts       # Validation
│   │   ├── beat-extractor.ts       # Beat detection
│   │   ├── merge-events.ts         # Event merging
│   │   ├── sfx-thin.ts             # Anti-spam
│   │   └── timeline-qa.ts          # QA checks
│   ├── sfx/
│   │   ├── macro-cues.ts           # SFX macro system
│   │   └── policy-engine.ts        # Policy rules
│   ├── format/
│   │   ├── hybrid-types.ts         # Format DSL
│   │   ├── format-generator.ts     # Script → Format
│   │   └── visual-reveals.ts       # Reveal tracking
│   └── types/
│       └── ContentBrief.ts         # Brief schema
├── scripts/
│   ├── generate-audio.ts           # TTS generation
│   ├── generate-character.ts       # AI character gen
│   ├── build-audio-mix.ts          # FFmpeg mixing
│   └── timeline-gate.ts            # QA gate
└── public/
    └── assets/
        └── sfx/
            ├── manifest.json       # SFX library
            └── [audio files]       # Sound effects
```

### Option B: Motion Canvas Only

```
your-project/
├── motion-canvas/
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── project.ts              # Scene registry
│   │   ├── scenes/                 # Animation scenes
│   │   ├── sfx/
│   │   │   └── reveal-recorder.ts  # Reveal capture
│   │   └── format/
│   │       └── reveal-ui.tsx       # Reveal components
│   └── scripts/
│       ├── mc-cli-render.ts        # CLI renderer
│       ├── mc-server.ts            # Dev server
│       └── mc-output-watch.ts      # Output watcher
```

### Option C: Both Engines

Copy all files from both Option A and Option B.

---

## Dependencies

### Remotion Dependencies (package.json)

```json
{
  "dependencies": {
    "@remotion/bundler": "^4.0.0",
    "@remotion/cli": "^4.0.0",
    "@remotion/renderer": "^4.0.0",
    "remotion": "^4.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Motion Canvas Dependencies

```json
{
  "dependencies": {
    "@motion-canvas/core": "^3.17.2",
    "@motion-canvas/2d": "^3.17.2",
    "@motion-canvas/ffmpeg": "^1.1.0"
  },
  "devDependencies": {
    "@motion-canvas/ui": "^3.17.2",
    "@motion-canvas/vite-plugin": "^3.17.2",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

### External Tools Required

```bash
# FFmpeg (for audio/video processing)
brew install ffmpeg

# Optional: rembg for better background removal
pip install rembg
```

---

## Environment Variables

Create `.env.local` in your project root:

```bash
# AI Generation
OPENAI_API_KEY=sk-...

# TTS Providers (optional)
ELEVENLABS_API_KEY=...

# Optional
REPLICATE_API_TOKEN=...
```

---

## Integration Steps

### Step 1: Install Dependencies

```bash
npm install remotion @remotion/cli @remotion/renderer @remotion/bundler
npm install react react-dom zod
npm install -D typescript @types/node
```

### Step 2: Copy Core Files

```bash
# Copy from this workspace
cp -r src/components/ your-project/src/components/
cp -r src/audio/ your-project/src/audio/
cp -r src/sfx/ your-project/src/sfx/
cp -r src/format/ your-project/src/format/
cp -r scripts/ your-project/scripts/
cp -r public/assets/sfx/ your-project/public/assets/sfx/
```

### Step 3: Create Entry Points

```typescript
// src/index.ts
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';
registerRoot(RemotionRoot);
```

### Step 4: Add Scripts to package.json

```json
{
  "scripts": {
    "dev": "remotion studio",
    "render": "remotion render",
    "render:brief": "npx tsx scripts/render-from-input.ts",
    "generate:character": "npx tsx scripts/generate-character.ts",
    "generate:audio": "npx tsx scripts/generate-audio.ts",
    "audio:mix": "npx tsx scripts/build-audio-mix.ts"
  }
}
```

---

## Usage Examples

### 1. Render a Video from Brief

```typescript
import { renderMedia } from '@remotion/renderer';
import { bundle } from '@remotion/bundler';

const bundled = await bundle('./src/index.ts');

await renderMedia({
  composition: 'BriefComposition',
  serveUrl: bundled,
  outputLocation: 'output/video.mp4',
  inputProps: {
    brief: {
      title: 'My Video',
      script: 'Hello world!',
      // ... ContentBrief schema
    }
  }
});
```

### 2. Use TikTok Captions

```tsx
import { TikTokCaptions } from './components/TikTokCaptions';
import { generateTranscriptFromText } from './components/AnimatedCaptions';

const MyComposition = () => {
  const transcript = generateTranscriptFromText('This is my video!', 0, 140);
  
  return (
    <TikTokCaptions
      transcript={transcript}
      style="bouncy"
      accentColor="#00ff88"
    />
  );
};
```

### 3. Add AI Character

```tsx
import { AICharacter } from './components/AICharacter';

const MyScene = () => (
  <AICharacter
    src="assets/characters/robot.png"
    animation={{ type: 'talk', intensity: 0.7 }}
    x={-200}
    y={100}
  />
);
```

### 4. Generate Character from Script

```bash
npm run generate:character -- \
  --prompt "friendly robot mascot, cartoon style" \
  --output public/assets/characters/robot.png
```

---

## Module Exports

### Recommended: Create an index barrel file

```typescript
// src/video-toolkit/index.ts
export * from '../components/AnimatedCaptions';
export * from '../components/TikTokCaptions';
export * from '../components/AICharacter';
export * from '../audio/audio-types';
export * from '../sfx/macro-cues';
export * from '../format/hybrid-types';
```

Then import in other projects:

```typescript
import { 
  TikTokCaptions, 
  AICharacter, 
  generateTranscriptFromText 
} from './video-toolkit';
```

---

## File Reference

| File | Purpose | Required |
|------|---------|----------|
| `AnimatedCaptions.tsx` | Word-by-word captions | ✅ |
| `TikTokCaptions.tsx` | Viral caption styles | ✅ |
| `AICharacter.tsx` | Animated characters | Optional |
| `audio-types.ts` | Type definitions | ✅ |
| `macro-cues.ts` | SFX automation | Optional |
| `generate-character.ts` | AI image generation | Optional |
| `sfx/manifest.json` | Sound library | Optional |

---

## Troubleshooting

### "Module not found" errors

Ensure all dependencies are installed and paths are correct.

### FFmpeg errors

Install FFmpeg: `brew install ffmpeg`

### TypeScript errors

Make sure `tsconfig.json` includes the copied files:
```json
{
  "include": ["src/**/*", "scripts/**/*"]
}
```

### Remotion studio won't start

Check that `src/index.ts` exports `registerRoot` correctly.

---

## Version Compatibility

| Tool | Version | Notes |
|------|---------|-------|
| Remotion | ^4.0.0 | Required |
| Motion Canvas | ^3.17.0 | Optional |
| React | ^18.2.0 | Required |
| Node.js | ^18.0.0 | Required |
| FFmpeg | Any recent | Required for audio |

---

## Support

For issues with:
- **Remotion**: https://remotion.dev/docs
- **Motion Canvas**: https://motioncanvas.io/docs
- **This toolkit**: Check the `docs/` folder in this workspace
