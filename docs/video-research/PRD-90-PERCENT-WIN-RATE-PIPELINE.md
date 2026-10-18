# PRD: 90% Win-Rate UGC Ad Pipeline
## 0 AI Anomalies · 0 Speaking Pauses · Consistent Voice · Proven Scripts

> **Version:** 1.0  
> **Date:** Feb 2026  
> **Based on:** Analysis of 11 YouTube videos on AI UGC ad creation  
> **Current baseline:** 82% lifetime pass rate, 4/5 clips pass gate per session  
> **Target:** 90%+ win rate, 0 AI anomalies, 0 speaking pauses

---

## 1. Problem Statement

The current pipeline produces clips that sometimes fail due to:

1. **Speaking pauses** — Veo 3.1 generates unnatural gaps mid-sentence
2. **Voice inconsistency** — different voice per clip when stitched together
3. **AI artifacts** — orange HDR glow, wrong product shapes, burned-in subtitles
4. **Static first frame** — product photo as first frame instead of a human
5. **No ambient audio** — AI voice sounds synthetic without room tone
6. **No speed normalization** — AI "thinking pauses" visible at 1x speed
7. **No quality gate automation** — manual review required for every clip

---

## 2. Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Clips passing quality gate | 82% | 90%+ |
| Speaking pause incidents | ~20% of clips | 0% |
| Voice consistency across clips | Manual fix required | Automatic |
| AI artifact rate | ~15% | <2% |
| First frame = human | ~60% | 100% |
| Subtitles burned in | ~10% | 0% |
| Time to produce 1 complete ad | ~45 min | <15 min |

---

## 3. Architecture Overview

### Current Pipeline
```
Offer JSON → GPT-4o (script) → Veo 3.1 (video) → ElevenLabs (voice) → Quality Gate → Output
```

### Target Pipeline
```
Offer JSON 
  → GPT-4o (script + JSON prompt)
  → Nano Banana (character image)
  → Veo 3.1 (video with voiceover in prompt)
  → Post-Processing (speed + ambient noise + subtitle removal)
  → ElevenLabs Voice Normalizer (voice consistency)
  → Automated Quality Gate (0-anomaly checklist)
  → Output
```

---

## 4. Feature Requirements

### F1: Voiceover-in-Prompt (Critical — fixes speaking pauses)

**Problem:** Veo 3.1 generates random speech or pauses when no voiceover is specified.  
**Fix:** Include the exact voiceover line in the Veo 3.1 prompt.

**Implementation:**
```typescript
// In stage-lipsync.ts — motionPrompt construction
const voiceScriptLine = scriptLines[clipIndex];
const motionPromptWithVoice = `${motionPrompt}
Sound: The character says: "${voiceScriptLine}"
Speak naturally and conversationally, no pauses, complete the sentence.`;
```

**Acceptance Criteria:**
- Character speaks the intended line in 95%+ of generations
- No speaking pauses longer than 0.3s within a sentence
- Voice matches the character's demographic (age, gender)

---

### F2: Nano Banana First-Frame Fix (Critical — fixes static first frame + orange glow)

**Problem:** Raw Veo 3.1 uses the product image as first frame and produces orange HDR glow.  
**Fix:** Generate a photorealistic human image via Nano Banana first, then feed into Veo 3.1.

**Implementation:**
```typescript
// New stage: stage-nanobanana.ts
export async function generateCharacterImage(
  offer: Offer,
  framework: CreativeFramework,
  scriptLine: string,
  clipIndex: number,
): Promise<string> {  // returns image URL
  const prompt = buildNanaBananaPrompt(offer, framework, scriptLine, clipIndex);
  return await nanaBananaGenerate(prompt);
}
```

**Nano Banana Prompt Template:**
```
[age]-year-old [gender], [ethnicity], [specific expression].
[Setting: location, lighting].
[Holding/using product — accurate description].
Photorealistic, authentic UGC style, natural skin texture, real person (not a model).
Shot from [angle]. 9:16 vertical framing.
No text, no logos, no watermarks.
```

**Acceptance Criteria:**
- First frame is always a human (not a product photo)
- No orange HDR glow effect
- Product shape/container matches offer description
- Character matches `characterGender` and `voiceAge` from offer

---

### F3: Post-Processing Pipeline (Critical — fixes speed + subtitles + ambient noise)

**Problem:** AI clips have thinking pauses, sometimes burned-in subtitles, and synthetic-sounding audio.  
**Fix:** Automated FFmpeg post-processing pass after every clip generation.

**Implementation:**
```typescript
// New: scripts/pipeline/post-process-clip.ts
export async function postProcessClip(
  inputPath: string,
  outputPath: string,
  options: {
    speedFactor?: number;        // default: 1.4
    addAmbientNoise?: boolean;   // default: true
    ambientNoiseType?: 'office' | 'cafe' | 'home' | 'outdoor';
    ambientNoiseVolume?: number; // default: -25dB
  }
): Promise<void>
```

**FFmpeg Commands:**
```bash
# Speed up + add ambient noise
ffmpeg -i input.mp4 -i ambient_office.mp3 \
  -filter_complex "[0:v]setpts=PTS/1.4[v];[0:a]atempo=1.4[a];[a][1:a]amix=inputs=2:weights=1 0.15[aout]" \
  -map "[v]" -map "[aout]" output.mp4

# Crop bottom 8% to remove subtitle area (fallback)
ffmpeg -i input.mp4 -vf "crop=iw:ih*0.92:0:0" output_cropped.mp4
```

**Acceptance Criteria:**
- All clips output at 1.4x speed
- Ambient noise present at -25dB (inaudible but present)
- No burned-in subtitles visible
- File size within 10% of original

---

### F4: ElevenLabs Voice Normalizer (Critical — fixes voice inconsistency)

**Problem:** Veo 3.1 generates a different voice for each clip. Multi-clip ads sound like different people.  
**Fix:** After generating all clips, run all audio through ElevenLabs Voice Changer with a consistent voice.

**Implementation:**
```typescript
// New: scripts/pipeline/normalize-voice.ts
export async function normalizeVoiceAcrossClips(
  clipPaths: string[],
  voiceId: string,  // from offer.framework.elevenLabsVoiceId
  outputDir: string,
): Promise<string[]>  // returns normalized clip paths
```

**Process:**
1. Extract audio from each clip (FFmpeg)
2. Send each audio to ElevenLabs Voice Changer API
3. Apply consistent voice profile
4. Re-merge normalized audio with original video
5. Fix any mispronunciations with targeted TTS patches

**Acceptance Criteria:**
- Voice is indistinguishable across all clips in a batch
- No voice changes at clip transitions
- Mispronounced words detected and patched

---

### F5: Automated Quality Gate (Critical — replaces manual review)

**Problem:** Manual review is slow and inconsistent. Need automated checks.  
**Fix:** Automated quality gate using GPT-4o Vision + audio analysis.

**Implementation:**
```typescript
// Update: scripts/pipeline/assess-lipsync.ts
export interface QualityGateResult {
  passed: boolean;
  score: number;  // 0-100
  checks: {
    firstFrameIsHuman: boolean;
    noOrangeGlow: boolean;
    noSubtitles: boolean;
    productAccurate: boolean;
    speakingPausesDetected: boolean;
    voiceConsistent: boolean;
    aspectRatioCorrect: boolean;
  };
  failReasons: string[];
  autoRetry: boolean;
}
```

**Check Implementation:**
- `firstFrameIsHuman`: Extract first frame → GPT-4o Vision: "Is this a human or a product photo?"
- `noOrangeGlow`: Color histogram analysis — detect orange oversaturation
- `noSubtitles`: GPT-4o Vision: "Are there any text overlays or subtitles visible?"
- `productAccurate`: Compare product description to visual — GPT-4o Vision
- `speakingPausesDetected`: Whisper transcription → check for gaps >0.5s
- `voiceConsistent`: Audio fingerprint comparison across clips
- `aspectRatioCorrect`: FFprobe metadata check

**Acceptance Criteria:**
- Gate runs in <30 seconds per clip
- False positive rate <5% (good clips incorrectly rejected)
- False negative rate <2% (bad clips incorrectly passed)

---

### F6: JSON Prompt Structure (High — improves consistency)

**Problem:** Text prompts produce inconsistent results. JSON structure forces complete specification.  
**Fix:** Convert all Veo 3.1 prompts to JSON format, use ChatGPT to fill in fields.

**Implementation:**
```typescript
// Update: scripts/pipeline/prompt-builder.ts
export interface Veo3JsonPrompt {
  character: {
    age: number;
    gender: string;
    ethnicity: string;
    expression: string;
    clothing: string;
  };
  setting: {
    location: string;
    timeOfDay: string;
    lighting: string;
    background: string;
  };
  action: string;
  sound: {
    voiceover: string;  // exact words character says
    tone: string;
    pace: string;
  };
  style: {
    cameraType: string;  // "handheld selfie"
    cameraMovement: string;
    aspectRatio: string;  // always "9:16"
    restrictions: string[];  // always includes "no subtitles", "no text overlays"
  };
}
```

**Acceptance Criteria:**
- All required fields populated before generation
- `restrictions` always includes: "no subtitles", "no text overlays", "no captions"
- `aspectRatio` always "9:16"
- `sound.voiceover` always populated with script line

---

### F7: 3-Variation Generation (High — improves win rate)

**Problem:** Currently generates 1 clip per angle. Need 3 variations to find the best.  
**Fix:** Generate 3 variations per clip, auto-select best via quality gate score.

**Implementation:**
```typescript
// Update: smart-generate.ts
const VARIANTS_PER_CLIP = 3;

// Generate 3 in parallel, pick highest quality gate score
const variants = await Promise.all(
  Array.from({ length: VARIANTS_PER_CLIP }, (_, i) =>
    generateClip({ ...clipConfig, seed: baseSeed + i })
  )
);
const best = variants.sort((a, b) => b.gateScore - a.gateScore)[0];
```

**Acceptance Criteria:**
- 3 variations generated per clip
- Best variation auto-selected by quality gate score
- Total generation time <2x single generation (parallel)

---

### F8: Gold Nuggets Extraction (High — improves script quality)

**Problem:** Scripts use generic language. Customer's own words convert better.  
**Fix:** Extract gold nuggets from reviews/forums before generating scripts.

**Implementation:**
```typescript
// New: scripts/pipeline/extract-gold-nuggets.ts
export async function extractGoldNuggets(
  offer: Offer,
  sources: string[],  // review text, forum posts, etc.
): Promise<{
  painPhrases: string[];    // exact customer words about pain
  reliefPhrases: string[];  // exact customer words about solution
  objections: string[];     // exact customer objections
  transformations: string[]; // exact customer transformation stories
}>
```

**Acceptance Criteria:**
- Extracts real customer language, not paraphrases
- Pain phrases are specific and vivid (not generic)
- Used in script generation to replace generic language

---

### F9: Static Ad Testing Stage (Medium — improves testing efficiency)

**Problem:** Video ads are expensive to test. Static ads test hooks at 1/10th the cost.  
**Fix:** Add static ad generation as Phase 1 before video production.

**Implementation:**
```typescript
// New: scripts/pipeline/stage-static-ads.ts
export async function generateStaticAds(
  offer: Offer,
  hooks: string[],
  templates: StaticAdTemplate[],
): Promise<StaticAd[]>
```

**Acceptance Criteria:**
- Generates static ads for all hooks × templates
- Output: PNG files ready for Meta Ads Manager
- Cost: <$0.01 per static ad

---

## 5. Implementation Phases

### Phase 1: 0 AI Anomalies (Week 1) — Critical Fixes
Priority: Fix the root causes of all AI artifacts and speaking pauses.

| Task | File | Effort |
|------|------|--------|
| Add voiceover to Veo prompt | `stage-lipsync.ts` | 2h |
| Add "no subtitles" to all prompts | `stage-lipsync.ts`, `prompt-builder.ts` | 1h |
| Add FFmpeg speed pass (1.4x) | `post-process-clip.ts` (new) | 3h |
| Add ambient noise injection | `post-process-clip.ts` | 2h |
| Add subtitle crop fallback | `post-process-clip.ts` | 1h |
| Update quality gate checks | `assess-lipsync.ts` | 3h |

### Phase 2: Character Consistency (Week 1–2)
Priority: Nano Banana integration for natural first frames.

| Task | File | Effort |
|------|------|--------|
| Build Nano Banana stage | `stage-nanobanana.ts` (new) | 4h |
| Build Nano Banana prompt builder | `prompt-builder.ts` | 2h |
| Wire into main pipeline | `smart-generate.ts` | 2h |
| Update quality gate for first frame | `assess-lipsync.ts` | 1h |

### Phase 3: Voice Consistency (Week 2)
Priority: ElevenLabs voice normalization across clips.

| Task | File | Effort |
|------|------|--------|
| Build voice normalizer | `normalize-voice.ts` (new) | 4h |
| Wire into post-processing | `post-process-clip.ts` | 1h |
| Add mispronunciation detection | `normalize-voice.ts` | 2h |

### Phase 4: Scale & Testing (Week 2–3)
Priority: 3-variation generation, JSON prompts, static ads.

| Task | File | Effort |
|------|------|--------|
| Add 3-variation generation | `smart-generate.ts` | 3h |
| Convert prompts to JSON structure | `prompt-builder.ts` | 3h |
| Add static ad stage | `stage-static-ads.ts` (new) | 4h |
| Add gold nuggets extraction | `extract-gold-nuggets.ts` (new) | 3h |

---

## 6. New Files to Create

```
scripts/pipeline/
├── post-process-clip.ts      # FFmpeg speed + ambient noise + subtitle removal
├── stage-nanobanana.ts       # Nano Banana character image generation
├── normalize-voice.ts        # ElevenLabs voice consistency across clips
├── stage-static-ads.ts       # Static ad generation for hook testing
└── extract-gold-nuggets.ts   # Customer language extraction from reviews

assets/ambient/
├── office-room-tone.mp3      # Quiet office background
├── cafe-ambience.mp3         # Coffee shop background
├── home-ambience.mp3         # Home interior background
└── outdoor-ambience.mp3      # Outdoor background
```

---

## 7. Updated Offer JSON Schema

```typescript
interface Offer {
  // ... existing fields ...
  goldNuggets?: {
    painPhrases: string[];
    reliefPhrases: string[];
    objections: string[];
  };
  marketSophistication?: 1 | 2 | 3 | 4 | 5;  // Schwartz sophistication level
}

interface CreativeFramework {
  // ... existing fields ...
  nanaBananaStyle?: string;  // character style guidance for Nano Banana
  ambientNoiseType?: 'office' | 'cafe' | 'home' | 'outdoor';
  speedFactor?: number;      // default 1.4
  variantCount?: number;     // default 3
}
```

---

## 8. Quality Gate Scoring

### Score Calculation
```
Base score: 100
Deductions:
  - First frame is product (not human): -30
  - Orange HDR glow detected: -20
  - Subtitles burned in: -25
  - Product inaccurate: -20
  - Speaking pause >0.5s: -15 per pause
  - Voice inconsistency: -10
  - Wrong aspect ratio: -20
  - No voiceover detected: -30

Minimum passing score: 70
Auto-retry if score: 50-69
Hard fail if score: <50
```

---

## 9. Success Definition

A "winning ad" is defined as:
- Quality gate score ≥ 70
- No speaking pauses >0.3s
- Voice consistent across all clips
- First frame is a human
- No burned-in subtitles
- Product visually accurate
- Script follows awareness-stage framework
- CTA present and clear

**Target: 90% of generated clips meet this definition on first generation.**
