# Audit Report: Character Consistency Integration
## Pipeline Code Audit — AD_CHARACTER_PACK × fal.ai Research → Implementation

> **Date:** Feb 21, 2026
> **Status:** All 6 gaps fixed and implemented

---

## Audit Scope

Reviewed all pipeline files to identify where `AD_CHARACTER_PACK.json` should be used for consistent character generation but wasn't:

- `scripts/pipeline/stage-lipsync.ts` — Veo 3.1 clip generation
- `scripts/pipeline/stage-images.ts` — Imagen 4 / Gemini image generation
- `scripts/pipeline/run.ts` — CLI pipeline runner
- `scripts/pipeline/smart-generate.ts` — Smart orchestrator
- `scripts/pipeline/generate-funnel.ts` — Full-funnel generator
- `scripts/pipeline/prompt-builder.ts` — Prompt construction utilities

---

## 6 Gaps Found & Fixed

### Gap 1: No Character Pack Loading ✅ FIXED

**Problem:** AD_CHARACTER_PACK.json was never read by any pipeline file.

**Fix:** Created `scripts/pipeline/character-pack.ts` — a dedicated module that:
- Loads and caches AD_CHARACTER_PACK.json
- Selects the best character based on audience category + awareness stage + gender preference
- Maps pipeline audience categories (friend, client, mentor...) to character pack angle IDs (A1-A9)
- Provides prompt block assembly utilities
- Exports: `loadCharacterPack()`, `selectCharacter()`, `buildPackCharacterDescription()`, `getConsistencyBlocks()`, `getAnglePromptBlock()`, `getUnghostingContext()`

### Gap 2: Generic Image Prompts ✅ FIXED

**Problem:** `stage-images.ts` used `"a woman in her early 30s, casual everyday clothing"` for character sheet generation — zero consistency with the 8 defined character profiles.

**Fix:** `stage-images.ts` now loads the character pack, selects the appropriate character, and uses `identity_prompt_block` (e.g., "female, Black/African American, late 20s to early 30s, warm expressive eyes, friendly natural smile...") instead of the generic description.

### Gap 3: No Consistency/Negative Blocks in Prompts ✅ FIXED

**Problem:** `buildLipsyncPrompt()` had no way to inject the global consistency block ("same recurring character, same face identity, same hairstyle...") or negative block ("avoid face changes, avoid different person...") from the character pack.

**Fix:** Added `consistencyBlock`, `negativeBlock`, and `angleContext` optional parameters to `buildLipsyncPrompt()`. These are now injected at the end of every video generation prompt, reinforcing identity lock and preventing common drift patterns.

### Gap 4: No Clip Chaining ✅ FIXED

**Problem:** Each clip was generated independently. Clips 2+ used a static `character_sheet.png` anchor instead of the actual last frame of the previous clip, causing visual "jumps" between clips.

**Fix:** After each clip is generated:
1. Extract last frame: `ffmpeg -sseof -0.05 -i clip_N.mp4 -frames:v 1 clip_N_lastframe.png`
2. Upload to fal.ai storage
3. Use as `firstUrl` (start frame) for clip N+1

The anchor strategy is now:
```
Clip 1:       first=before.png,        last=sheet.png
Clip 2..N-1:  first=chainedLastFrame,  last=sheet.png    ← CHAINED
Clip N:       first=chainedLastFrame,  last=after.png     ← CHAINED
```

Falls back to sheet anchor if chaining fails (non-fatal).

### Gap 5: No Character × Angle Matching ✅ FIXED

**Problem:** Character selection was random/generic with no consideration of which character best fits which audience category or angle.

**Fix:** `selectCharacter()` in `character-pack.ts` scores characters based on:
- `primary_angles` match → 3 points per angle
- `secondary_angles` match → 1 point per angle
- `unghosting_roles` match → 2 bonus points

Category → Angle ID mapping:
| Category | Angle IDs |
|----------|-----------|
| friend, old friend, family, crush | A1, A7 |
| coworker | A5, A6, A8 |
| client | A3, A4, A8 |
| mentor | A3, A4, A6 |

### Gap 6: Context Not Passed Through Pipeline ✅ FIXED

**Problem:** `audienceCategory` and `awarenessStage` from the run.ts angle combos were not passed through to downstream stages, so character pack selection had no context.

**Fix:**
- `run.ts` now injects `audienceCategory` and `awarenessStage` into the inputs object before passing to stages
- `smart-generate.ts` now passes `audienceCategory` and `awarenessStage` through `lipsyncInputs`
- `stage-lipsync.ts` reads these from `(inputs as any).audienceCategory` and selects the right character

---

## Files Modified

| File | Changes |
|------|---------|
| `scripts/pipeline/character-pack.ts` | **NEW** — Character pack loader, selector, prompt assembly |
| `scripts/pipeline/stage-lipsync.ts` | Character pack integration, consistency/negative blocks, clip chaining |
| `scripts/pipeline/stage-images.ts` | Character pack integration for image generation |
| `scripts/pipeline/run.ts` | Inject audienceCategory + awarenessStage into inputs |
| `scripts/pipeline/smart-generate.ts` | Pass audienceCategory + awarenessStage through lipsyncInputs |

## Files Created (Docs)

| File | Description |
|------|-------------|
| `docs/research/FAL_CHARACTER_CONSISTENCY_DEEP_DIVE.md` | Comprehensive fal.ai character consistency research |
| `docs/research/AUDIT_CHARACTER_CONSISTENCY_INTEGRATION.md` | This audit report |

---

## How It Works End-to-End Now

```
1. run.ts picks angle combo (stage: "unaware", category: "friend")
   ↓ injects audienceCategory + awarenessStage into inputs

2. stage-images.ts generates character_sheet.png + before.png + after.png
   ↓ loads character pack → selects Maya Brooks (primary for A1/friend)
   ↓ uses identity_prompt_block instead of "a woman in her early 30s"

3. stage-lipsync.ts generates video clips
   ↓ loads character pack → selects same character (Maya Brooks)
   ↓ injects consistency_block + negative_block + angle_context into every prompt
   ↓ clip chaining: extract last frame → upload → use as start frame for next clip
   ↓ anchor strategy: before.png → [chained frames] → after.png

4. Quality gate (assess-lipsync.ts) checks character_coherence_score
   ↓ hard stop if < 7 (character drift between clips)
```

---

## Pre-Existing Issue (Not Introduced By This Change)

`run.ts` line 198 has a pre-existing type error: `args.lipsync` (boolean) is passed to `generateAngleInputs()` where it expects `HookFormula | undefined`. This existed before this audit and is unrelated to character pack integration.
