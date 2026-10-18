# PRD: 90% Win Rate UGC Ad Pipeline Rearchitecture

**Version:** 1.0  
**Date:** 2026-02-21  
**Status:** Implementation Ready

---

## 1. PROBLEM STATEMENT

The current pipeline generates UGC ads with ~82% gate pass rate but has three critical failure modes:

1. **Character inconsistency** — different characters appear across clips in the same ad (root cause: no visual anchor, generic character descriptions)
2. **Speaking pauses / truncated speech** — Veo3 cuts off dialogue mid-sentence (root cause: lines too long, no Whisper verification loop)
3. **AI artifacts** — plastic skin, product shape drift, background changes (root cause: no per-clip quality gate, vague prompts)

**Goal:** 90%+ win rate (ads that pass quality gate AND convert) with 0 AI anomalies and 0 speaking pauses.

---

## 2. SUCCESS METRICS

| Metric | Current | Target |
|--------|---------|--------|
| Gate pass rate | 82% | 95% |
| Character consistency across clips | ~60% | 98% |
| Script completion rate | ~75% | 95% |
| AI anomaly rate | ~20% | <2% |
| Speaking pause rate | ~15% | 0% |
| Time to generate 5 ads | ~45 min | <30 min |
| Cost per passing ad | ~$16 | <$12 |

---

## 3. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                    SMART GENERATE ORCHESTRATOR                   │
│  smart-generate.ts — generate → gate → retry → learn            │
└──────────┬──────────────────────────────────────────────────────┘
           │
    ┌──────▼──────┐     ┌──────────────┐     ┌──────────────────┐
    │  STAGE 0    │     │   STAGE 1    │     │    STAGE 2b      │
    │ Script +    │────▶│  Imagen 4    │────▶│  Veo 3.1 Lip-   │
    │ Prompt      │     │  before.png  │     │  Sync (fal.ai)   │
    │ Builder     │     │  (char ref)  │     │  N clips → stitch│
    └─────────────┘     └──────────────┘     └────────┬─────────┘
                                                       │
                        ┌──────────────────────────────▼──────────┐
                        │           QUALITY GATE                   │
                        │  assess-lipsync.ts (GPT-4o vision)       │
                        │  Whisper script completion check         │
                        │  Artifact detector                       │
                        └──────────────────────────────────────────┘
```

---

## 4. PHASE 1: PROMPT BUILDER (Week 1)

### 4.1 Hook Formula Selector

**File:** `scripts/pipeline/prompt-builder.ts`

Build a `HookFormula` enum and `buildHookLine()` function:

```typescript
export type HookFormula = 'pain_literally' | 'never_tried' | 'pov' | 'stop_scrolling' | 'social_proof';

export function buildHookLine(formula: HookFormula, offer: Offer): string
```

Each formula takes the offer's `problemSolved`, `productName`, `socialProof` fields and generates a hook line following the exact formula. No generic fallback — every hook must match one of the 5 proven formulas.

### 4.2 Script Validator

**File:** `scripts/pipeline/prompt-builder.ts`

```typescript
export interface ScriptValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateScript(lines: string[]): ScriptValidation
```

Checks:
- No line over 15 words
- No marketing buzzwords (revolutionary, cutting-edge, game-changing, innovative, seamless)
- No digits in dialogue ($200 → "two hundred dollars")
- Contractions present (not "I have" when "I've" is natural)
- Hook line under 15 words
- CTA present in last line

### 4.3 Character Description Builder

**File:** `scripts/pipeline/prompt-builder.ts`

```typescript
export interface LockedCharacter {
  description: string;  // single locked string, copy-pasted into every clip
  voiceProfile: string; // single locked string, copy-pasted into every clip
  setting: string;      // single locked string, copy-pasted into every clip
  pronoun: 'He' | 'She' | 'They';
}

export function buildLockedCharacter(
  traits: CharacterTraits,
  voice: VoiceProfile,
  setting: string
): LockedCharacter
```

The `description` string is built once and injected identically into every clip prompt.
No variation, no paraphrasing.

### 4.4 Per-Clip Prompt Builder

**File:** `scripts/pipeline/prompt-builder.ts`

```typescript
export function buildClipPrompt(
  line: string,
  character: LockedCharacter,
  clipIndex: number,
  totalClips: number,
  options?: { shotDescription?: string; productAction?: string }
): string
```

Enforces:
- `Says: "dialogue"` colon syntax always
- Identical character + setting description in every clip
- Voice profile in every clip
- `(no subtitles)` in every clip
- `no background music` in every clip
- Natural window light (not studio) in every clip

---

## 5. PHASE 2: CHARACTER CONSISTENCY ENGINE (Week 1 — DONE)

### 5.1 Vision-Based Character Lock ✅

**File:** `scripts/pipeline/stage-lipsync.ts`

`describeCharacterFromImage(imagePath, openAIKey)` — GPT-4o vision reads `before.png` and returns a precise locked description. Cached to `before_char_desc.txt`.

### 5.2 fal.ai Storage Upload ✅

**File:** `scripts/pipeline/stage-lipsync.ts`

`uploadToFalStorage(imagePath, falKey)` — uploads `before.png` to fal.ai storage, returns public URL. Cached to `before_fal_url.txt`.

### 5.3 First-Frame Anchoring ✅

**File:** `scripts/pipeline/stage-lipsync.ts`

Clip 1 uses `fal-ai/veo3.1/first-last-frame-to-video` with `first_frame_url` = uploaded `before.png`.
Clips 2-N use `fal-ai/veo3.1` text-to-video with identical locked character description.

### 5.4 Prompt Rebuild on Every Run ✅

**File:** `scripts/pipeline/stage-lipsync.ts`

Pre-generated `lipsyncPrompts` from `ai-inputs.ts` are always discarded and rebuilt with the locked character description derived from `before.png`.

---

## 6. PHASE 3: QUALITY GATE IMPROVEMENTS (Week 2)

### 6.1 Enhanced Artifact Detector

**File:** `scripts/pipeline/assess-lipsync.ts`

Current gate checks: anomaly score, authenticity, viral score.

Add explicit checks:
- **Character coherence score** (0-10): Are all clips the same person?
- **Product consistency score** (0-10): Is the product the same in every clip?
- **Lip sync score** (0-10): Is the mouth moving when speech is present?
- **Background consistency score** (0-10): Is the setting consistent?

Gate thresholds:
```typescript
const GATE = {
  anomaly: { max: 3 },           // was 4
  authenticity: { min: 7 },
  characterCoherence: { min: 8 }, // NEW
  productConsistency: { min: 8 }, // NEW
  lipSync: { min: 7 },            // NEW
  scriptCompletion: { min: 0.80 }, // was 0.75
};
```

### 6.2 Per-Clip Artifact Check

Before stitching, run a quick per-clip check:
- Extract first frame of each clip
- GPT-4o vision: "Does this person match this description? Score 0-10."
- If any clip scores < 7 → regenerate that clip only (not the whole ad)

**File:** `scripts/pipeline/stage-lipsync.ts`

```typescript
async function checkClipCharacterMatch(
  clipPath: string,
  expectedDescription: string,
  openAIKey: string
): Promise<number> // 0-10 match score
```

### 6.3 Whisper Verification Improvements

Current: 75% word overlap threshold, 2 retries.

Improvements:
- Increase threshold to 80%
- On retry: split at natural pause (comma/period), not arbitrary midpoint
- Log all truncations to `output/pipeline/learnings.json` for pattern analysis
- If same line fails 3x → flag for human review, continue with next clip

---

## 7. PHASE 4: SMART GENERATE IMPROVEMENTS (Week 2)

### 7.1 Hook Formula Tracking

**File:** `scripts/pipeline/smart-generate.ts`

Track which hook formula was used for each angle in `generation.json`:
```json
{
  "hookFormula": "pain_literally",
  "hookLine": "My skin was breaking out every week. This literally saved me.",
  "gatePassed": true,
  "viralScore": 72
}
```

Cross-session: aggregate hook formula → gate pass rate in `learnings.json`.

### 7.2 Retry with Different Hook

When an angle fails the gate:
1. First retry: same hook, different character/setting
2. Second retry: different hook formula (next in priority order)
3. Third retry: different script length (15s → 30s or vice versa)

```typescript
const HOOK_RETRY_ORDER: HookFormula[] = [
  'pain_literally',    // highest win rate
  'social_proof',      // 11x ROAS hook
  'never_tried',
  'stop_scrolling',
  'pov',
];
```

### 7.3 Learnings Integration

**File:** `output/pipeline/learnings.json`

```json
{
  "hookFormulas": {
    "pain_literally": { "attempts": 12, "passed": 11, "passRate": 0.92 },
    "social_proof": { "attempts": 8, "passed": 7, "passRate": 0.875 }
  },
  "characterTypes": {
    "female_25_30": { "attempts": 10, "passed": 9, "passRate": 0.90 }
  },
  "scriptLengths": {
    "15s": { "attempts": 15, "passed": 13, "passRate": 0.87 }
  }
}
```

Smart generate reads this and picks the highest-pass-rate formula for each new angle.

---

## 8. PHASE 5: OFFER SCHEMA IMPROVEMENTS (Week 2)

### 8.1 Hook Formula Field

**File:** `scripts/pipeline/offer.schema.ts`

Add to `CreativeFramework`:
```typescript
hookFormulas?: HookFormula[];  // which formulas to test, in priority order
scriptLengths?: ('15s' | '30s' | '60s')[];
characterTypes?: Partial<CharacterTraits>[];  // multiple character options to test
```

### 8.2 Product Description for Consistency

Add to `Offer`:
```typescript
productVisualDescription?: string;  // "small white cylindrical bottle with gold cap"
// Injected into every clip prompt to anchor product appearance
```

### 8.3 Awareness Stage Routing

Add to `AngleInputs`:
```typescript
ctaVariant: 'soft' | 'challenge' | 'direct' | 'urgency';
// Derived from awarenessStage, used to select CTA formula
```

---

## 9. PHASE 6: PIPELINE DOCS & MONITORING (Week 3)

### 9.1 Session Dashboard

After each session, generate a `session_report.md`:
```
Session: 2026-02-21T12-00-00
Angles: 5 generated, 5 passed gate (100%)
Hook formulas used: pain_literally x3, social_proof x2
Character: female_27_29_olive_skin
Avg viral score: 74/100
Total cost: $48.00 ($9.60/ad)
Clips generated: 18 total, 0 truncated, 0 artifact-rejected
```

### 9.2 PIPELINE.md Update

Update `PIPELINE.md` to document:
- New `prompt-builder.ts` module
- Hook formula system
- Character lock protocol
- Quality gate thresholds
- Learnings.json schema

---

## 10. IMPLEMENTATION CHECKLIST

### Week 1 (Character Consistency — DONE)
- [x] `describeCharacterFromImage()` — GPT-4o vision on before.png
- [x] `uploadToFalStorage()` — fal.ai storage upload with cache
- [x] `submitFalClip()` — first-frame-to-video for clip 1
- [x] `extractSettingFromPrompt()` — derive setting from beforeScenePrompt
- [x] Always rebuild prompts with locked character desc
- [x] Same fixes in `generate-funnel.ts`

### Week 1 (Prompt Builder — TODO)
- [ ] `prompt-builder.ts` — HookFormula enum + buildHookLine()
- [ ] `validateScript()` — buzzword check, word count, digit check
- [ ] `buildLockedCharacter()` — single locked description string
- [ ] `buildClipPrompt()` — enforces all Veo3 best practices
- [ ] Integrate prompt-builder into `ai-inputs.ts`

### Week 2 (Quality Gate — TODO)
- [ ] Character coherence score in assess-lipsync.ts
- [ ] Product consistency score in assess-lipsync.ts
- [ ] Lip sync score in assess-lipsync.ts
- [ ] Per-clip character match check before stitching
- [ ] Whisper threshold → 80%, smarter retry split

### Week 2 (Smart Generate — TODO)
- [ ] Hook formula tracking in generation.json
- [ ] Retry with different hook formula
- [ ] Learnings.json hook formula aggregation
- [ ] Smart formula selection from learnings

### Week 2 (Offer Schema — TODO)
- [ ] hookFormulas[] field in CreativeFramework
- [ ] productVisualDescription in Offer
- [ ] ctaVariant in AngleInputs

### Week 3 (Docs & Monitoring — TODO)
- [ ] session_report.md auto-generation
- [ ] PIPELINE.md update

---

## 11. FILE STRUCTURE (after rearchitecture)

```
scripts/pipeline/
  prompt-builder.ts       ← NEW: hook formulas, script validation, locked prompts
  ai-inputs.ts            ← UPDATED: uses prompt-builder
  stage-images.ts         ← unchanged
  stage-lipsync.ts        ← UPDATED: char lock, image anchor, setting extract
  assess-lipsync.ts       ← UPDATED: char coherence, product consistency, lip sync
  smart-generate.ts       ← UPDATED: hook tracking, retry with diff formula
  generate-funnel.ts      ← UPDATED: char lock, image anchor
  offer.schema.ts         ← UPDATED: hookFormulas, productVisualDescription
  tracing.ts              ← UPDATED: hookFormula field
  run.ts                  ← unchanged
  rerun-video.ts          ← unchanged
```

---

## 12. COST MODEL

| Item | Cost | Per 5-ad batch |
|------|------|----------------|
| GPT-4o (script + prompts) | ~$0.05/angle | $0.25 |
| GPT-4o vision (char lock) | ~$0.02/angle | $0.10 |
| Imagen 4 (before.png) | ~$0.04/image | $0.20 |
| Veo 3.1 clips (4 clips × $3.20) | ~$12.80/angle | $64.00 |
| GPT-4o gate assessment | ~$0.03/angle | $0.15 |
| Whisper verification | ~$0.01/clip | $0.20 |
| **Total per 5 ads** | | **~$65** |
| **Cost per passing ad (95% pass)** | | **~$13.70** |

---

*Master Learnings: [MASTER_LEARNINGS.md](MASTER_LEARNINGS.md)*
*Strategy: [STRATEGY.md](STRATEGY.md)*
