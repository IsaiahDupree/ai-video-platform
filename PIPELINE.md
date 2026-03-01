# Video Ad Pipeline

Offer-agnostic AI video ad generation system with smart generation, AI authenticity gating, script completion verification, voice consistency, and full-funnel support.

---

## Quick Start

```bash
# Generate 5 short-form videos with AI gating + auto-retry
npx tsx scripts/pipeline/smart-generate.ts --count 5

# Generate a 45-60s full-funnel video (unaware → product-aware)
npx tsx scripts/pipeline/generate-funnel.ts --script offers/everreach-funnel.json

# Standard pipeline (no gating)
npx tsx scripts/pipeline/run.ts --offer offers/everreach.json --count 5 --lipsync
```

---

## Architecture

```
offers/
  everreach.json            ← EverReach offer + creative framework
  everreach-funnel.json     ← Full-funnel 45-60s script template
  template.json             ← Copy this to create a new offer

scripts/pipeline/
  offer.schema.ts           ← TypeScript types (Offer, Framework, AngleInputs, etc.)
  ai-inputs.ts              ← GPT-4o: offer + framework → all stage inputs
  stage-images.ts           ← Stage 1: Imagen 4 before/after images
  stage-video.ts            ← Stage 2: Veo 3.1 animated video
  stage-voice.ts            ← Stage 3: ElevenLabs TTS voiceover
  stage-compose.ts          ← Stage 4: ffmpeg compose (loop + mix + captions)
  stage-lipsync.ts          ← Stage 2b: Veo 3 native speech lip-sync
  smart-generate.ts         ← Smart orchestrator: generate → gate → retry → learn
  generate-funnel.ts        ← Full-funnel long-form video generator (45-60s)
  assess-lipsync.ts         ← AI authenticity gate (GPT-4o vision)
  tracing.ts                ← generation.json + session.json writer
  run.ts                    ← Standard CLI entry point

output/pipeline/
  learnings.json            ← Cross-session learnings (winning patterns, failures)
  smart_generation_results.json
  <product-name>/<session-id>/
    <ANGLE_ID>/
      lipsync_9x16.mp4     ← Lip-sync output (ready to post)
      lipsync_clips/        ← Individual clips per script line
      before.png, after.png ← Character images
      scene_config.json     ← AI-generated inputs
  funnel/<session-id>/
    funnel_9x16.mp4         ← Full-funnel stitched video
    funnel_spec.json        ← Funnel script used
    clips/                  ← Individual clips per segment
```

---

## Generation Modes

### 1. Smart Generation (recommended)

End-to-end pipeline with AI quality gating and auto-retry:

```bash
npx tsx scripts/pipeline/smart-generate.ts --count 5
npx tsx scripts/pipeline/smart-generate.ts --count 3 --max-retries 2
npx tsx scripts/pipeline/smart-generate.ts --assess-only output/pipeline/everreach/<session>
```

**Flow:** Generate AI inputs → Imagen 4 images → Veo 3 lip-sync → Authenticity gate → Viral analysis → Auto-retry failures → Save learnings

Features:
- **AI Authenticity Gate** — GPT-4o vision checks 5 frames for AI anomalies, UGC authenticity, script coherence
- **Auto-retry** — Failed gate → fresh AI inputs + new lip-sync (up to N attempts), reuses images
- **429 quota handling** — Detects on first clip, aborts immediately, skips remaining angles
- **Viral analysis** — MediaPoster FATE scoring, hook detection, transcription
- **Learnings system** — Tracks winning patterns → feeds into future generations

### 2. Full-Funnel Video (45-60s)

Single long-form video that transitions through the entire awareness funnel:

```bash
npx tsx scripts/pipeline/generate-funnel.ts --script offers/everreach-funnel.json
npx tsx scripts/pipeline/generate-funnel.ts --script offers/everreach-funnel.json --cta problem-aware-challenge
npx tsx scripts/pipeline/generate-funnel.ts --script offers/everreach-funnel.json --force
```

**Flow:** Read funnel script → Split segments into ≤20-word clips → Generate all clips with consistent character + voice → Stitch + burn captions

Features:
- **Consistent character** — Same visual description in every clip prompt
- **Consistent voice** — Voice profile (accent, tone, pace, quality) locked across all clips
- **Framework timeline** — Hook & Mirror → Name Enemy → Mechanism → Proof → CTA
- **CTA variants** — `--cta unaware-soft`, `--cta problem-aware-challenge`, `--cta product-aware-direct`
- **Shot descriptions** — Per-segment shot type (selfie, hard cut, gesturing, etc.)

### 3. Standard Pipeline

Direct pipeline without gating:

```bash
npx tsx scripts/pipeline/run.ts --offer offers/everreach.json --count 5 --lipsync
npx tsx scripts/pipeline/run.ts --offer offers/everreach.json --count 5  # standard mode
```

---

## Pipeline Stages

### Stage 1 — Imagen 4 (Before/After Images)
- **Model:** `imagen-4.0-generate-preview-05-20` via Google AI
- **Output:** `character_sheet.png`, `before.png`, `after.png`
- **Character consistency:** Same character description across all images

### Stage 2b — Veo 3.1 Lip-Sync (Native Speech)
- **Model:** `veo-3.1` via **fal.ai** (preferred) or `veo-3.1-fast-generate-preview` via Google AI (fallback)
- **Provider selection:** Set `FAL_KEY` → fal.ai used automatically. No `FAL_KEY` → falls back to Google Gemini
- **Output:** `lipsync_9x16.mp4` — stitched clips with burned captions
- **Voice consistency:** Voice profile (accent/tone/pace) injected into every clip prompt
- **Script completion:** Whisper transcription → word overlap check → auto-split + retry
- **Pre-split:** Lines >20 words auto-split at punctuation before generation

### Stage 2 — Veo 3.1 (Video, no speech)
- **Model:** `veo-3.1-generate-preview` via Google AI
- **Output:** `video_9x16.mp4` — 8s animated clip with ambient audio

### Stage 3 — ElevenLabs TTS
- **Model:** `eleven_turbo_v2_5`, voice: `charlie`
- **Output:** `voiceover.mp3`, `script.txt`

### Stage 4 — ffmpeg Compose
- **Output:** `final_9x16.mp4` + `captions.ass`

---

## Voice Consistency System

**Problem:** Veo 3 generates a different voice (accent, tone, pace) for each clip.

**Solution:** A `VoiceProfile` is built and injected into every clip prompt:

```typescript
{
  accent: "American, warm neutral Midwestern",
  tone: "confident but empathetic, not salesy, real",
  pace: "conversational medium pace with natural pauses",
  quality: "clear, warm, slightly intimate",
  gender: "male",
  age: "late 20s"
}
```

This produces a prompt suffix like:
```
Voice: male, late 20s, American, warm neutral Midwestern accent,
confident but empathetic tone, conversational medium pace, clear warm voice,
consistent voice throughout.
```

Configure per-offer in the funnel script JSON or passed as `voiceOverride` to `runStageLipsync()`.

---

## AI Authenticity Gate

GPT-4o vision evaluates 5 extracted frames:

| Dimension | Scale | Threshold |
|---|---|---|
| `anomaly_score` | 1 (clean) → 10 (severe AI artifacts) | ≥ 6 = BLOCKED |
| `authenticity_score` | 1 (obvious AI) → 10 (convincing human) | ≤ 4 = BLOCKED |
| `coherence_score` | 1 (nonsensical) → 10 (perfect script) | ≤ 4 = BLOCKED |

**Hard stop** on any threshold breach. Videos that pass proceed to viral analysis.

---

## Script Completion Verification

**Problem:** Veo 3 clips are max 8s. Long script lines may get truncated.

**Solution (stage-lipsync.ts):**
1. **Pre-split** — Lines >20 words split at punctuation before generation
2. **Whisper check** — After each clip, audio → OpenAI Whisper → transcription
3. **Word overlap** — Compare to expected script, need ≥75% match
4. **Auto-retry** — Truncated clips → split shorter → regenerate (up to 2 retries)

---

## Learnings System

Persists across sessions in `output/pipeline/learnings.json`:

- **Pass rate** — Lifetime gate pass percentage
- **Viral scores** — Average, best, worst
- **Winning patterns** — Headlines, hooks, tones, script styles that passed
- **Failure patterns** — Common anomalies, low-coherence scripts to avoid
- **Auto-feedback** — Learnings are injected into AI prompts for future generations

---

## Full-Funnel Script Format

Create a JSON file in `offers/` with this structure:

```json
{
  "title": "Product Full-Funnel Ad",
  "targetDuration": 55,
  "character": { "age": "28", "gender": "male", "hair": "...", "clothing": "..." },
  "voice": { "accent": "American", "tone": "confident", "pace": "medium", "gender": "male" },
  "setting": "cozy apartment, warm lighting",
  "frameworks": [
    { "id": "hook", "label": "Hook & Mirror", "startSec": 0, "endSec": 12 },
    { "id": "enemy", "label": "Name Enemy", "startSec": 12, "endSec": 18 },
    { "id": "mechanism", "label": "Mechanism", "startSec": 18, "endSec": 30 },
    { "id": "proof", "label": "Proof", "startSec": 30, "endSec": 42 },
    { "id": "cta", "label": "CTA", "startSec": 42, "endSec": 60 }
  ],
  "segments": [
    {
      "id": "hook-1",
      "framework": "hook",
      "voiceover": "your script line here no punctuation",
      "shotDescription": "selfie camera close-up, walking",
      "onScreenText": "relationships don't break — they drift",
      "awareness": "unaware"
    }
  ],
  "ctaVariants": {
    "unaware-soft": "follow for more link in bio",
    "problem-aware-challenge": "try it now it takes thirty seconds",
    "product-aware-direct": "download now free trial link in bio"
  }
}
```

---

## Environment Variables

Set in `.env.local`:

```bash
OPENAI_API_KEY=sk-...         # GPT-4o (gate, inputs, Whisper)
FAL_KEY=...                   # fal.ai — Veo 3.1 lip-sync (preferred, no RPD quota)
GOOGLE_API_KEY=...            # Imagen 4 + Veo 3 fallback (used if FAL_KEY not set)
ELEVENLABS_API_KEY=...        # TTS voiceover (standard mode only)
```

### Provider Priority (Veo 3.1 Lip-Sync)

| Provider | Key | Cost/8s clip | Rate Limit | Notes |
|---|---|---|---|---|
| **fal.ai** (preferred) | `FAL_KEY` | ~$3.20 (720p+audio) | None (queue-based) | No daily RPD quota |
| **Google Gemini** (fallback) | `GOOGLE_API_KEY` | ~$6.00 | ~10 RPD (preview) | Subject to quota exhaustion |

Get a fal.ai key at [fal.ai/dashboard](https://fal.ai/dashboard) — pay-as-you-go, no subscription required.

---

## Creating a New Offer

1. Copy `offers/template.json` → `offers/your-product.json`
2. Fill in the `offer` section (product name, problem, features, CTA)
3. Fill in the `framework` section (awareness stages, audience categories, script rules)
4. Run: `npx tsx scripts/pipeline/smart-generate.ts --count 5`

For full-funnel: copy `offers/everreach-funnel.json` → customize segments, character, voice.

---

## Caption System

ASS (Advanced SubStation Alpha) via libass:

- **Font:** Arial Bold 62pt
- **Color:** White text, black 3px outline, semi-transparent background
- **Position:** Bottom-center, 8% margin from bottom
- **Timing:** Timed to actual clip durations (not estimated)
