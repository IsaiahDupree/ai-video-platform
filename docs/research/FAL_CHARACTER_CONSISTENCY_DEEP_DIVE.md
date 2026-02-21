# fal.ai Character Consistency — Deep Dive & Production Recipe

> **Last Updated:** Feb 21, 2026
> **Purpose:** Comprehensive technical reference for building consistent-character UGC ads using fal.ai's full model stack. Covers identity consistency, styling consistency, temporal consistency, production recipes, failure points, and EverReach-specific implementation.
> **Related:** `FAL_CHARACTER_CONSISTENCY.md` · `AD_CHARACTER_PACK.md` · `PRD_CHARACTER_CONSISTENCY_IMPLEMENTATION.md`

---

## Core Thesis

fal.ai has viable paths for consistent character generation from an image. You can build a **~30s same-character ad** by combining:

1. **Create a character pack (anchor stills)**
2. **Use reference-based video generation in 3×10s clips**
3. **Chain clips with last-frame → next start-frame**
4. **Keep prompt/wardrobe/background constraints locked**

### fal.ai Models That Support This

| Model | Endpoint | Role |
|-------|----------|------|
| **Ideogram Character** | `fal-ai/ideogram/character` | Consistent character image generation from reference image(s) |
| **Kling O1 Reference I2V** | `fal-ai/kling-video/o1/reference-to-video` | Start-frame + elements/reference images with stable identity, 3–10s |
| **Kling O3 Reference I2V** | `fal-ai/kling-video/o3/standard/reference-to-video` | `start_image_url` / `end_image_url`, 3–15s durations |
| **FLUX LoRA Training** | `fal-ai/flux-lora-fast-training` | Persistent identity lock across campaigns |
| **Flux 2** | `fal-ai/flux-2` | Multi-reference image synthesis (up to 4 refs) |

---

## The 3 Layers of Consistency

### Layer 1: Identity Consistency (Face/Features) — Hardest

Improve with:
- Strong reference image(s)
- Repeated use of the **same `@Element1` pack**
- Same age range / facial geometry / hair / makeup descriptors
- Less extreme camera motion

Kling O1's Reference I2V is designed for "stable character identity" and supports **elements** (character packs with frontal + reference images) plus additional style images.

### Layer 2: Styling Consistency (Wardrobe/Look/Lighting) — Easier

Lock by keeping:
- Same outfit
- Same color palette
- Same lighting language
- Same lens/camera style wording

### Layer 3: Temporal Consistency (Clip-to-Clip Continuity) — Where Most People Fail

Fix by:
- Extracting last frame of clip N
- Using it as `start_image_url` (or start frame) for clip N+1
- Optionally setting an `end_image_url` target for transition shape (Kling O3)

---

## Best Setup for EverReach Ads (~30s, Same Character)

### Option A — Fastest (Great for Testing)

**Ideogram Character → Kling O1 Reference I2V → stitch 3 clips**

Use when you want speed and volume for ad testing.

### Option B — Stronger Identity Lock (Best for Scaling)

**FLUX LoRA (character-trained) or Flux 2 multi-ref anchors → Kling O1/O3 video**

Use when you want the same spokesperson across dozens of ads.

---

## Production Recipe: 30s Ad

### Phase 1 — Build Character Identity Pack (Before Video)

Create 6–12 stills of the same person first using **Ideogram Character**:

- Front portrait (neutral)
- Front portrait (smile)
- ¾ left
- ¾ right
- Side profile
- Upper-body selfie framing
- Seated desk frame
- Standing indoor frame

Ideogram Character supports `reference_image_urls` in schema and seeds for reproducibility on stills.

### Phase 2 — Build "Video-Safe" Character Element Pack

For Kling O1 Reference I2V, create an `elements` object with:
- `frontal_image_url` = best clean front-facing image
- `reference_image_urls` = 2–4 angle variations

### Phase 3 — Generate 3×10s Clips (9:16 Vertical)

Kling O1 Reference I2V supports:
- Prompt with `@Element1`, `@Image1`, etc.
- `elements` array
- Additional `image_urls`
- `duration` up to 10s
- `aspect_ratio` including `9:16`

Structure:
- **Clip 1 (Hook)** — selfie cam, empathetic expression, home office/kitchen
- **Clip 2 (Mechanism)** — same character seated, desk, over-shoulder phone interaction
- **Clip 3 (Proof + CTA)** — same character + phone closeup, app screen, return for CTA

### Phase 4 — Chain Continuity

```bash
# Extract last frame from each clip
ffmpeg -sseof -0.05 -i clip1.mp4 -frames:v 1 last1.png
ffmpeg -sseof -0.05 -i clip2.mp4 -frames:v 1 last2.png
```

Use `last1.png` as start frame for clip 2, `last2.png` as start frame for clip 3.

For smoother transitions, use Kling O3 with `start_image_url` + `end_image_url`.

---

## Why Character Packs Beat Single-Image Prompts

A single image prompt drifts because the model must infer:
- Side profile
- Teeth/smile shape
- Hairline under motion
- Body proportions in different poses
- Clothing folds / accessories

The **character pack** removes ambiguity before video generation.

---

## Consistency Ladder

### Tier 1 — Quick Ad Tests
- 1 main ref image
- Ideogram Character for 6 anchor stills
- Kling O1 Reference I2V 3×10s
- Moderate camera motion only

### Tier 2 — Repeatable Campaign Creatives
- 1 main ref + 3 angle refs
- Fixed wardrobe + lighting + background family
- Consistent `@Element1` pack
- Clip chaining with last-frame start

### Tier 3 — Brand Spokesperson Level
- FLUX LoRA trained on the character
- Generate anchor keyframes with LoRA
- Animate with Kling O1/O3
- Lock voice, wardrobe, expression map, scene set

---

## Prompting Pattern for Consistency

### Identity Anchor Clause
```
Same woman as @Element1. Keep facial features, hairstyle, and outfit consistent.
Same person, same wardrobe, same makeup, same age appearance.
```

### Motion Clause
```
Subtle natural head movement. Handheld selfie framing. Realistic micro-expressions.
No exaggerated movement.
```

### Scene Clause
```
Cozy indoor home office. Soft daylight from window. Shallow depth smartphone UGC look.
```

### Negative Drift Clause
```
No outfit changes, no extra accessories, no face distortion, no duplicate people.
```

---

## Constraints to Keep Fixed Across All 3 Clips

### Lock These (Never Change)
- **Character identity descriptors** (same exact wording)
- **Wardrobe** (same top, jewelry, hairstyle)
- **Beauty descriptors** (same makeup intensity, skin finish)
- **Lighting** (e.g., soft window light, warm indoor)
- **Lens style** (e.g., handheld phone selfie, 26mm equivalent)
- **Aspect ratio** (`9:16`)
- **Camera energy** (don't go from static selfie to fast drone orbit)

### Avoid These (They Cause Drift)
- "different outfit"
- "dramatic transformation"
- Extreme closeups then wide full-body dance shot
- Occluded face (hands/hair/cup over mouth)
- Rapid spin / profile-only shots early
- Changing age descriptors (even subtly)

---

## Character Profile Spec (What to Lock Per Character)

| Field | Example |
|-------|---------|
| Name | Maya Brooks |
| Use-case bucket | personal / networking / business |
| Age range | 27–33 |
| Ethnicity / background | Black / African American |
| Skin tone | warm medium |
| Face shape | soft oval |
| Eye shape | expressive, warm |
| Hair color / texture / style | dark brown, shoulder-length soft curls |
| Makeup style | natural polished |
| Wardrobe baseline | neutral knit top, gold hoops |
| Energy / vibe | warm, confident, empathetic |
| Expression set | neutral, soft smile, concerned, reassuring |
| Voice archetype | warm conversational, late 20s female |
| Forbidden variations | no glasses, no bangs, no bright lipstick |

This profile becomes the **source of truth** for prompts across all models.

---

## Example API Payloads

### 1) Ideogram Character (Anchor Stills)

```javascript
const result = await fal.subscribe("fal-ai/ideogram/character", {
  input: {
    prompt: "same woman in a cozy modern home office, upper-body selfie framing, natural smile, soft daylight, realistic UGC style",
    reference_image_urls: [characterRefUrl],
    image_size: "portrait_16_9"
  }
});
```

### 2) Kling O1 Reference I2V (10s Clip)

```javascript
const clip1 = await fal.subscribe("fal-ai/kling-video/o1/reference-to-video", {
  input: {
    prompt: "Take @Image1 as the start frame. Same woman as @Element1 speaking to camera in a warm, natural UGC style. Keep facial features, hairstyle, outfit, and makeup consistent. Subtle handheld selfie movement. No outfit changes.",
    image_urls: [styleRefUrl],
    elements: [{
      frontal_image_url: frontalRefUrl,
      reference_image_urls: [angleLeftUrl, angleRightUrl, smilingRefUrl]
    }],
    duration: "10",
    aspect_ratio: "9:16"
  }
});
```

### 3) Chain to Next Clip

```bash
ffmpeg -sseof -0.05 -i clip1.mp4 -frames:v 1 last1.png
```

Then use `last1.png` as start image for clip 2 via `start_image_url`.

---

## Common Failure Points & Fixes

| Problem | Fix |
|---------|-----|
| **Face changes in clip 2** | Stronger `@Element1` pack (more angles); reduce camera motion; keep face visible >50% of shot; avoid profile-only shots early |
| **Outfit changes / random accessories** | Explicitly lock wardrobe; add "no jewelry changes / no glasses added"; reuse same anchor still as start frame |
| **Looks "cinematic" instead of UGC** | Prompt for smartphone selfie framing; handheld micro-jitter; natural indoor lighting; eye-level camera; realistic speech gestures |
| **Character drifts when moving rooms** | Keep one room for all 3 clips during testing; change only one variable at a time (camera angle OR background, not both) |

---

## Sources

1. [Ideogram Character API — fal.ai](https://fal.ai/models/fal-ai/ideogram/character/api)
2. [Kling O1 Reference Image-to-Video — fal.ai](https://fal.ai/models/fal-ai/kling-video/o1/reference-to-video/api)
3. [Kling O3 Reference-to-Video — fal.ai](https://fal.ai/models/fal-ai/kling-video/o3/standard/reference-to-video/api)
4. [FLUX LoRA Fast Training — fal.ai](https://fal.ai/models/fal-ai/flux-lora-fast-training)
5. [Flux 2 Developer Guide — fal.ai](https://fal.ai/learn/devs/flux-2-developer-guide)
