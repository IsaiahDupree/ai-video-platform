# PRD: Character Consistency Implementation
## From Research to Production — fal.ai + EverReach Ad Character Pack

> **Last Updated:** Feb 21, 2026
> **Status:** Phase 1 Complete · Phase 2 Ready for Implementation
> **Goal:** Zero character drift across multi-clip UGC ads using fal.ai's character consistency stack

---

## 1. Problem Statement

Our current pipeline generates each clip independently. This causes:

| Issue | Impact | Frequency |
|-------|--------|-----------|
| **Character drift** | Different face/hair/clothing between clips | ~60% of multi-clip ads |
| **Voice inconsistency** | Different voice per clip | ~80% without ElevenLabs |
| **Static first frame** | Product photo instead of human | 100% with raw Veo 3.1 |
| **Orange HDR glow** | Unnatural skin/lighting | ~70% with raw Veo 3.1 |
| **Product inaccuracy** | Wrong product shape/color | ~50% with raw Veo 3.1 |

**Root cause:** No reference image anchoring → each clip generates a new random character.

---

## 2. Research Summary

### Sources
- **11 YouTube video analyses** → `docs/video-research/V01-V11`
- **fal.ai character consistency research** → `docs/research/FAL_CHARACTER_CONSISTENCY.md`
- **EverReach Ad Character Pack** → `docs/research/AD_CHARACTER_PACK.md` + `.json`
- **90% Win Rate PRD** → `docs/video-research/PRD-90-PERCENT-WIN-RATE-PIPELINE.md`
- **Master Video Learnings** → `docs/video-research/VIDEO_LEARNINGS.md`

### Key Research Findings

1. **Nano Banana + Veo 3.1 = best pipeline** (V08, V11)
   - Nano Banana generates character-consistent first frame with accurate product
   - Veo 3.1 animates with native speech
   - Cost: ~$0.32/clip vs $0.40 raw Veo

2. **fal.ai has 4 character consistency methods** (research doc)
   - Ideogram Character (single-image → pack)
   - FLUX LoRA training (locked identity at scale)
   - Kling O1 Reference-to-Video (element-level consistency)
   - Kling O3 Image-to-Video (start→end frame chaining)

3. **AD_CHARACTER_PACK defines 8 characters** with locked identity prompts
   - Maya Brooks = primary hero (40-50% of ads)
   - Each character has `identity_prompt_block`, `hair_lock`, `grooming_makeup_lock`
   - 9 angle prompt blocks (A1-A9) + 7 un-ghosting context blocks
   - Machine-readable JSON for automation

4. **Clip chaining via last-frame extraction** eliminates jump cuts
   - `ffmpeg -sseof -0.05 -i clip1.mp4 -frames:v 1 last1.png`
   - Feed last frame as start frame for next clip

---

## 3. Architecture: Character Consistency Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Character Pack                        │
│  AD_CHARACTER_PACK.json → identity_prompt_block          │
│  + globals.consistency_block + globals.negative_block    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Stage: Character Image Gen                   │
│  Ideogram Character / Nano Banana / FLUX LoRA            │
│  → Generate character pack (front, ¾, side, expressions) │
│  → Upload to fal.ai storage                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Stage: Lip-Sync Video Gen                    │
│  Veo 3.1 first-last-frame-to-video                       │
│  → Reference images as anchors                           │
│  → Voiceover-in-prompt (exact line, no pauses)           │
│  → No subtitles (4x negation)                            │
│  → Last-frame chaining between clips                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Stage: Post-Processing                       │
│  FFmpeg 1.4x speed + ambient noise (-28dB)               │
│  + subtitle crop detection + voice normalization         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Stage: Quality Gate                          │
│  GPT-4o Vision: anomaly + authenticity + coherence       │
│  + character coherence + product consistency + lip sync  │
│  Hard stop thresholds enforced                           │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Implementation Phases

### Phase 1: Prompt-Level Fixes ✅ COMPLETE

**Files modified:**
- `scripts/pipeline/stage-lipsync.ts` — voiceover-in-prompt, 4x subtitle negation
- `scripts/pipeline/post-process-clip.ts` — FFmpeg 1.4x speed + ambient noise
- `scripts/pipeline/ai-inputs.ts` — "no subtitles" in motionPrompt guidance

**What this fixes:**
- Speaking pauses → voiceover-in-prompt forces complete delivery
- Burned-in subtitles → 4 negations + auto-crop fallback
- AI voice artifacts → 1.4x speed + ambient noise masking

### Phase 2: Character Image Generation (Next)

**New file:** `scripts/pipeline/stage-character-pack.ts`

**Workflow:**
1. Read character config from `AD_CHARACTER_PACK.json`
2. Generate character pack via Ideogram Character API:
   - Front view, ¾ view, side profile
   - Neutral expression, smile, talking (mouth open)
   - Seated with phone, standing selfie pose
3. Upload all images to fal.ai storage
4. Cache URLs for reuse across all clips in a campaign

**API calls:**
```
POST https://queue.fal.run/fal-ai/ideogram/character
{
  "prompt": "[CONSISTENCY_BLOCK] + [CHARACTER_IDENTITY_BLOCK] + [POSE_DESCRIPTION]",
  "reference_image_url": "<initial_reference_image>",
  "aspect_ratio": "9:16"
}
```

**Integration with stage-lipsync.ts:**
- Pass character pack URLs as `firstUrl` / `lastUrl` to `submitFalClip()`
- Use `fal-ai/veo3.1/first-last-frame-to-video` endpoint instead of text-to-video
- Extract last frame of each clip → feed as start frame for next clip

### Phase 3: Voice Normalization

**New file:** `scripts/pipeline/normalize-voice.ts`

**Workflow:**
1. After all clips generated, extract audio from each
2. Send to ElevenLabs Voice Changer API with locked voice ID
3. Replace audio track in each clip with normalized voice
4. Re-stitch with consistent voice across all clips

### Phase 4: FLUX LoRA Training (Scale)

**When:** After 50+ ads generated for a character

**Workflow:**
1. Collect best character images from previous generations
2. Train FLUX LoRA via `fal-ai/flux-lora-fast-training`
3. Use trained LoRA for all future keyframe generation
4. Animate keyframes with Kling O1/O3

---

## 5. Character Pack Integration Spec

### How AD_CHARACTER_PACK.json Feeds the Pipeline

```typescript
// Load character config
const pack = JSON.parse(fs.readFileSync('docs/research/AD_CHARACTER_PACK.json', 'utf-8'));
const character = pack.characters.find(c => c.id === 'CHR_MAYA_BROOKS');
const globals = pack.globals;

// Build prompt for character image generation
const charPrompt = [
  globals.consistency_block,
  character.identity_prompt_block,
  angleBlock,  // from pack.libraries.angles[angleId].prompt_block
  settingBlock, // from pack.libraries.background_buckets
  'No subtitles. No on-screen text. No captions. No burned-in text.',
  globals.negative_block,
].join(', ');

// Build prompt for video generation (existing buildLipsyncPrompt enhanced)
const videoPrompt = buildLipsyncPrompt(scriptLine, character.identity_prompt_block, setting, i, total, {
  voiceProfile: buildVoiceProfile(character.voice_profile),
  pronoun: character.gender === 'female' ? 'She' : 'He',
});
```

### Character × Angle Selection Logic

```typescript
// From AD_CHARACTER_PACK.json character.primary_angles / secondary_angles
function selectCharacterForAngle(angleId: string, pack: CharacterPack): Character {
  // Priority: characters where this angle is primary
  const primary = pack.characters.filter(c => c.primary_angles.includes(angleId));
  if (primary.length > 0) return primary[Math.floor(Math.random() * primary.length)];
  
  // Fallback: secondary
  const secondary = pack.characters.filter(c => c.secondary_angles.includes(angleId));
  return secondary[Math.floor(Math.random() * secondary.length)];
}
```

---

## 6. Clip Chaining Spec

### Last-Frame Extraction + Start-Frame Injection

```typescript
async function chainClips(clips: string[]): Promise<void> {
  for (let i = 1; i < clips.length; i++) {
    const prevClip = clips[i - 1];
    const lastFrame = `/tmp/last_frame_${i - 1}.png`;
    
    // Extract last frame from previous clip
    execSync(`ffmpeg -sseof -0.05 -i "${prevClip}" -frames:v 1 "${lastFrame}"`);
    
    // Upload to fal.ai storage
    const frameUrl = await uploadToFalStorage(lastFrame, falKey);
    
    // Use as start frame for next clip generation
    // This is passed to submitFalClip as firstUrl parameter
  }
}
```

### Kling O3 Transition (Smoother Option)

For premium ads, use Kling O3 to animate between clips:

```typescript
// Last frame of clip N → start image
// Generated "target frame" for clip N+1 → end image
// Kling O3 creates smooth 2-3s transition
const transitionClip = await submitKlingO3({
  start_image_url: lastFrameUrl,
  end_image_url: targetFrameUrl,
  duration: 3,
  aspect_ratio: '9:16',
});
```

---

## 7. Quality Gate Updates (Implemented)

### Thresholds (from assess-lipsync.ts)

| Check | Threshold | Hard Stop If |
|-------|-----------|-------------|
| Anomaly score | < 4 | ≥ 4 (severe AI artifacts) |
| Authenticity score | > 6 | ≤ 6 (obviously fake) |
| Coherence score | > 6 | ≤ 6 (nonsensical script) |
| **Character coherence** | ≥ 7 | < 7 (character drift between clips) |
| **Product consistency** | ≥ 7 | < 7 (product changes shape/color) |
| **Lip sync** | ≥ 6 | < 6 (mouth not moving) |

### New Checks for Phase 2

- **First frame human check:** Is the first frame a human face (not product photo)?
- **Subtitle burn-in check:** Are there burned-in subtitles? (auto-detect + crop)
- **Voice consistency check:** Is the voice the same across all clips? (Whisper + embedding similarity)

---

## 8. Cost Analysis

| Component | Cost Per Clip | Cost Per 30s Ad (3 clips) |
|-----------|--------------|--------------------------|
| Character pack (Ideogram) | $0.08 (amortized) | $0.08 |
| Video gen (Veo 3.1 via fal) | $3.20 | $9.60 |
| Post-processing (FFmpeg) | $0.00 | $0.00 |
| Voice normalization (ElevenLabs) | $0.05 | $0.15 |
| Quality gate (GPT-4o) | $0.02 | $0.02 |
| **Total** | | **~$9.85/ad** |

With Nano Banana first-frame (recommended):

| Component | Cost Per Clip | Cost Per 30s Ad |
|-----------|--------------|----------------|
| Nano Banana character image | $0.12 | $0.36 |
| Video gen (Veo 3.1 Fast) | $0.32 | $0.96 |
| **Total** | | **~$1.47/ad** |

---

## 9. File Index

### Research Docs (this repo)
| File | Description |
|------|-------------|
| `docs/research/FAL_CHARACTER_CONSISTENCY.md` | fal.ai character consistency research |
| `docs/research/AD_CHARACTER_PACK.md` | 8 character profiles + prompt blocks + production rules |
| `docs/research/AD_CHARACTER_PACK.json` | Machine-readable config for automation |
| `docs/research/PRD_CHARACTER_CONSISTENCY_IMPLEMENTATION.md` | This document |
| `docs/video-research/VIDEO_LEARNINGS.md` | Master learnings from 11 YouTube videos |
| `docs/video-research/PRD-90-PERCENT-WIN-RATE-PIPELINE.md` | Full pipeline PRD |
| `docs/video-research/V01-V11*.md` | Per-video analysis docs |

### Pipeline Code
| File | Status | Description |
|------|--------|-------------|
| `scripts/pipeline/stage-lipsync.ts` | ✅ Updated | Voiceover-in-prompt + no-subtitles + post-processing |
| `scripts/pipeline/post-process-clip.ts` | ✅ New | FFmpeg 1.4x speed + ambient noise + subtitle crop |
| `scripts/pipeline/ai-inputs.ts` | ✅ Updated | No-subtitles in motionPrompt guidance |
| `scripts/pipeline/assess-lipsync.ts` | ✅ Updated | 6-dimension quality gate |
| `scripts/pipeline/stage-character-pack.ts` | ⬜ Phase 2 | Character image generation |
| `scripts/pipeline/normalize-voice.ts` | ⬜ Phase 3 | ElevenLabs voice consistency |

### Source (EverReachOrganized repo)
| File | Description |
|------|-------------|
| `marketing/AD_CHARACTER_PACK.md` | Original source |
| `marketing/AD_CHARACTER_PACK.json` | Original source |

---

## 10. Next Steps

1. **Implement `stage-character-pack.ts`** — Ideogram Character API integration
2. **Wire character pack into `stage-lipsync.ts`** — use pack images as first/last frame anchors
3. **Add last-frame chaining** — extract last frame → feed as start frame for next clip
4. **Test with Maya Brooks** — primary hero character, 3×10s ad (A1 angle)
5. **Implement `normalize-voice.ts`** — ElevenLabs Voice Changer integration
6. **Train FLUX LoRA** for Maya Brooks once 50+ images collected
