# Video Toolkit Quick Reference

## Extract to New Project

```bash
# Remotion only
./scripts/extract-video-toolkit.sh /path/to/new-project

# With Motion Canvas
./scripts/extract-video-toolkit.sh /path/to/new-project yes
```

---

## Core Files Map

### Minimal (Captions Only)
```
src/components/AnimatedCaptions.tsx  → Basic captions
src/components/TikTokCaptions.tsx    → Viral styles
```

### Standard (Captions + Characters)
```
src/components/AnimatedCaptions.tsx
src/components/TikTokCaptions.tsx
src/components/AICharacter.tsx
scripts/generate-character.ts
```

### Full (Complete Pipeline)
```
src/
├── components/        # All UI components
├── audio/            # Audio pipeline
├── sfx/              # SFX automation
├── format/           # Script → Video DSL
├── types/            # TypeScript types
└── compositions/     # Video templates

scripts/
├── generate-audio.ts
├── generate-character.ts
├── build-audio-mix.ts
└── timeline-gate.ts

public/assets/
├── sfx/              # Sound effects library
└── characters/       # AI-generated images
```

---

## Dependencies

### NPM
```bash
npm install remotion @remotion/cli @remotion/renderer @remotion/bundler
npm install react react-dom zod
npm install -D typescript @types/node tsx
```

### System
```bash
brew install ffmpeg
pip install rembg  # Optional: better background removal
```

### Environment
```bash
# .env.local
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...  # Optional
```

---

## Usage Cheatsheet

### TikTok Captions
```tsx
import { TikTokCaptions } from './components/TikTokCaptions';
import { generateTranscriptFromText } from './components/AnimatedCaptions';

<TikTokCaptions
  transcript={generateTranscriptFromText('Your text here', 0, 140)}
  style="bouncy"  // bouncy|shake|glow|zoom|wave|color-cycle
  accentColor="#00ff88"
/>
```

### AI Character
```tsx
import { AICharacter } from './components/AICharacter';

<AICharacter
  src="assets/characters/robot.png"
  animation={{ type: 'talk' }}  // float|bounce|wave|talk|idle
  x={-200} y={100}
/>
```

### Generate Character
```bash
npm run generate:character -- \
  --prompt "cute robot mascot" \
  --output public/assets/characters/robot.png
```

### SFX Events
```tsx
<Sequence from={30}>
  <Audio src={staticFile('assets/sfx/pop.wav')} volume={0.6} />
</Sequence>
```

---

## Render Commands

```bash
# Development preview
npm run dev

# Render specific composition
npx remotion render CompositionId --output out.mp4

# Render from JSON brief
npm run render:brief -- data/brief.json

# Batch render
npm run batch-render
```

---

## Caption Styles

| Style | Effect | Use Case |
|-------|--------|----------|
| `bouncy` | Spring bounce in | Viral/energetic |
| `shake` | Rapid shake | Comedy |
| `glow` | Neon pulse | Tech/night |
| `zoom` | Dramatic zoom | Reveals |
| `wave` | Wave + rainbow | Playful |
| `color-cycle` | Color shift | Creative |

---

## Character Animations

| Type | Effect |
|------|--------|
| `float` | Gentle up/down |
| `bounce` | Bouncy motion |
| `wave` | Side-to-side |
| `talk` | Subtle talking |
| `idle` | Breathing |
| `entrance` | Spring in |
| `exit` | Fade out |

---

## File Locations

| What | Where |
|------|-------|
| SFX Library | `public/assets/sfx/` |
| Characters | `public/assets/characters/` |
| Output Videos | `output/` |
| Briefs | `data/` |
| Docs | `docs/` |
