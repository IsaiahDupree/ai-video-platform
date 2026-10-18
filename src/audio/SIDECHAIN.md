# Sidechain Ducking — Architecture & Usage

The sidechain module automatically lowers background music volume whenever a voiceover is speaking, making speech intelligible without manually editing audio levels.

## Volume Shape

```
fullLevel  ──────╮                              ╭──────
                 │ attack                release │
                 ╰──────────────────────────────╯
duckLevel                ← held during speech →
         ↑               ↑               ↑       ↑
   attackStart     segmentStart    segmentEnd  releaseEnd
```

With `lookaheadFrames > 0` the attack completes *before* speech starts:

```
fullLevel  ────╮                              ╭──────
               │ attack  ← lookahead →        │ release
               ╰─────────╮                   ╭╯
duckLevel                 ──────────────────
         ↑     ↑          ↑             ↑    ↑
   attackStart  attackEnd  segStart  segEnd  releaseEnd
```

## DuckingConfig Fields

| Field | Type | Default | Description |
|---|---|---|---|
| `duckLevel` | `number` 0–1 | `0.08` | Music volume **during** speech |
| `fullLevel` | `number` 0–1 | `0.45` | Music volume **outside** speech |
| `attackFrames` | `number` ≥0 | `8` | Frames to ramp **down** from fullLevel to duckLevel |
| `releaseFrames` | `number` ≥0 | `15` | Frames to ramp **up** from duckLevel to fullLevel |
| `enabled` | `boolean` | `true` | Master on/off switch |
| `lookaheadFrames` | `number` ≥0 | `0` | Extra frames before segment where music is already at duckLevel |
| `vocalBoostLevel` | `number` 1.0–1.5 | `1.0` | Multiply voiceover volume during speech (1.0 = no boost) |

**Recommended ranges:**
- `duckLevel`: 0.05–0.15 (aggressive ducking) or 0.15–0.30 (gentle)
- `attackFrames`: 5–12 (at 30fps ≈ 167ms–400ms)
- `releaseFrames`: 10–20 (at 30fps ≈ 333ms–667ms)
- `lookaheadFrames`: 3–6 (100ms–200ms pre-duck for transparent transitions)

## Files

| File | Purpose |
|---|---|
| `sidechain-core.ts` | Pure math — framework-agnostic. `sidechainCore()` + `vocalBoostCore()`. No React/Remotion deps. |
| `sidechain-remotion.ts` | Remotion adapter. `sidechain()` uses `interpolate()` for eased curves (ease-in attack, ease-out release). |
| `ducking-types.ts` | `SpeechSegment` and `DuckingConfig` interfaces. |
| `ducking-defaults.json` | Canonical default values. Single source of truth for TS and Python. |
| `wordTimingsToSegments.ts` | Convert ElevenLabs/Whisper word timestamps → `SpeechSegment[]`. |

## Adding Ducking to a New Composition

```tsx
import { useCurrentFrame, useVideoConfig, Audio, staticFile } from 'remotion';
import { sidechain } from './audio/sidechain-remotion';
import { wordTimingsToSegments } from './audio/wordTimingsToSegments';

export const MyComposition: React.FC<{ brief: MyBrief }> = ({ brief }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. Convert word timestamps to frame ranges
  const segments = wordTimingsToSegments(
    brief.audio?.word_timings ?? [],
    fps,
  );

  // 2. Compute music volume at every frame
  const baseMusicVol = brief.audio?.volume_music ?? 0.3;
  const musicVol = sidechain(frame, segments, {
    fullLevel: baseMusicVol,
    duckLevel: baseMusicVol * 0.2,  // duck to 20% of normal volume
    attackFrames: 8,
    releaseFrames: 15,
  });

  return (
    <>
      {/* Music auto-ducks when voiceover plays */}
      <Audio src={staticFile(brief.audio!.background_music!)} volume={musicVol} />

      {/* Voiceover at full volume */}
      <Audio src={staticFile(brief.audio!.voiceover!)} />
    </>
  );
};
```

## Word Timings from ElevenLabs / Whisper

Both ElevenLabs (with `with_timestamps: true`) and OpenAI Whisper (via `scripts/whisper-transcribe.ts`) return word-level timestamps in the same `{ word, start, end }` format accepted by `wordTimingsToSegments`.

```ts
import { wordTimingsToSegments } from './audio/wordTimingsToSegments';

const segments = wordTimingsToSegments(
  [
    { word: 'Hello', start: 0.5, end: 0.8 },
    { word: 'world', start: 0.9, end: 1.2 },
    // gap here — becomes a separate segment
    { word: 'this', start: 3.0, end: 3.3 },
  ],
  30, // fps
);
// → [{ startFrame: 15, endFrame: 36 }, { startFrame: 90, endFrame: 99 }]
//   words 1+2 merged (gap < 0.3s threshold), word 3 is separate
```

## Vocal Boost (optional)

Use `vocalBoostCore()` to *increase* voiceover volume during speech in parallel with ducking music down:

```ts
import { sidechainCore, vocalBoostCore } from './audio/sidechain-core';

const musicVol   = sidechainCore(frame, segments, { duckLevel: 0.1, fullLevel: 0.4 });
const voiceBoost = vocalBoostCore(frame, segments, { vocalBoostLevel: 1.3 });

// Apply in Remotion:
<Audio src={musicSrc}  volume={musicVol} />
<Audio src={voiceSrc}  volume={voiceBoost} />
```

## Testing

```bash
# Run all unit tests (25 cases)
cd ai-video-platform
npm run test:sidechain

# Covers:
#   sidechainCore  — boundary conditions, lookahead, enabled=false
#   vocalBoostCore — ramp in/out, no-op at 1.0
#   wordTimingsToSegments — empty, single, merged, separate, unsorted
```
