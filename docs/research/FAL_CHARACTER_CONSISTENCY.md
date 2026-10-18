# fal.ai Character Consistency — Research & Implementation Guide

> **Last Updated:** Feb 21, 2026
> **Purpose:** Technical reference for maintaining consistent character identity across AI-generated UGC ad clips using fal.ai's API-first stack.
> **Related:** `AD_CHARACTER_PACK.md` · `AD_CHARACTER_PACK.json` · `PRD-90-PERCENT-WIN-RATE-PIPELINE.md`

---

## What fal.ai Offers for Character Consistency

### 1) Single-Image Character Consistency (Quickest)

**Ideogram Character** on fal can generate "the same person" across prompts **from a single reference image**. ([Introducing Ideogram Character](https://blog.fal.ai/introducing-ideogram-character/))

- Good for: generating a consistent character image set (poses, angles, outfits) fast
- Input: 1 clean reference photo (front/¾ view)
- Output: multiple consistent images of the same character in different poses/settings

### 2) Strong Consistency via Training (Most Reliable Across Many Scenes)

fal has **FLUX LoRA training** endpoints explicitly meant for **character training** — train a LoRA so the model reproduces a specific person/character consistently. ([Train FLUX LoRA Fast](https://fal.ai/models/fal-ai/flux-lora-fast-training))

Also, **Flux 2** supports **up to four reference images per generation**, which is very helpful for locking identity + style. ([Flux 2 Developer Guide](https://fal.ai/learn/devs/flux-2-developer-guide))

### 3) Reference Image-to-Video (Best "Image-Only" Path)

**Kling O1 Reference-to-Video** is designed to keep **stable character identity** using **reference images/elements** (including a frontal image + additional angles) and even lets you set an optional **start frame** for continuity. ([Kling O1 Reference-to-Video](https://fal.ai/models/fal-ai/kling-video/o1/reference-to-video))

### 4) Start-Frame → End-Frame Animation (Great for Chaining Scenes)

**Kling O3 Image-to-Video** takes a **start frame and an end frame** and animates between them. This is perfect for stitching multiple segments while keeping the same character. ([Kling O3 Image to Video](https://fal.ai/models/fal-ai/kling-video/o3/standard/image-to-video))

---

## Practical Workflow: ~30s Video with Same Character (Image-Based)

Because most models output **5–10s clips** (Kling O1 does 5s or 10s), the standard approach is: **generate 3×10s** (or **6×5s**) and stitch.

### Step 1: Build a "Character Pack" from One Image

1. Start with 1 clean reference photo (front/¾ view)
2. Use **Ideogram Character** to generate:
   - Front, ¾, side profile
   - Neutral expression + smile
   - Same outfit (for ad continuity)
3. This gives you the extra angles Kling O1 needs

### Step 2: Generate 3 Clips with Kling O1 Reference-to-Video (10s Each)

For each clip, reuse the same inputs every time:

- `@Element1` = your character (frontal + a couple angle refs)
- `@Image2` = a style reference (optional, but helps keep the "look" consistent)
- Optional `@Image1` start frame (see chaining below)

Kling O1 is explicitly built for **element-level consistency** and supports multiple references to preserve identity.

### Step 3: Chain Clips So the Character Doesn't "Jump"

After Clip 1 is generated:

1. Extract the **last frame** of clip 1
2. Feed that as the **start frame** for clip 2
3. Repeat for clip 3

```bash
# Extract last frame of each clip
ffmpeg -sseof -0.05 -i clip1.mp4 -frames:v 1 last1.png
ffmpeg -sseof -0.05 -i clip2.mp4 -frames:v 1 last2.png
```

### Step 4: Stitch into One 30s File

```bash
printf "file 'clip1.mp4'\nfile 'clip2.mp4'\nfile 'clip3.mp4'\n" > list.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy out_30s.mp4
```

---

## Smoother Continuity: Kling O3 Transitions

Use **Kling O3** between clips: take the last frame of clip 1 as the **start image**, and a generated "target frame" (same character, next scene) as the **end image** — then O3 animates the transition.

---

## Locked Identity Across Lots of Ads: FLUX LoRA Training

Train a **FLUX LoRA** on your character (20–100+ images is common), then:

1. Generate consistent keyframes with the LoRA
2. Animate those keyframes with Kling (O1/O3)

fal's LoRA training is explicitly positioned for consistent character generation.

---

## fal.ai API Endpoints Reference

| Model | Endpoint | Purpose |
|-------|----------|---------|
| **Ideogram Character** | `fal-ai/ideogram/character` | Single-image → consistent character pack |
| **FLUX LoRA Training** | `fal-ai/flux-lora-fast-training` | Train LoRA for locked identity |
| **Flux 2** | `fal-ai/flux-2` | 4 ref images per generation |
| **Kling O1 Ref-to-Video** | `fal-ai/kling-video/o1/reference-to-video` | Stable character in video |
| **Kling O3 Image-to-Video** | `fal-ai/kling-video/o3/standard/image-to-video` | Start→end frame animation |
| **Veo 3.1** | `fal-ai/veo3.1` | Text-to-video with speech |
| **Veo 3.1 First/Last Frame** | `fal-ai/veo3.1/first-last-frame-to-video` | Image-anchored video with speech |

---

## Implementation Priority for Pipeline

### Current (Phase 1 — Implemented)
- Veo 3.1 text-to-video with voiceover-in-prompt
- 3-image anchoring (first frame, last frame, reference)
- Character description locked per sequence via GPT-4o vision

### Next (Phase 2 — Nano Banana + Character Pack)
1. Generate character pack from offer's character profile using Ideogram Character
2. Use pack as reference images for Kling O1 or Veo 3.1 first-frame-to-video
3. Chain clips using last-frame extraction

### Future (Phase 3+ — FLUX LoRA)
1. Train FLUX LoRA on primary hero character (Maya Brooks)
2. Generate keyframes per scene with LoRA
3. Animate keyframes with Kling O1/O3
4. Full 30s ads with zero character drift

---

## Sources

1. [Introducing Ideogram Character — fal.ai Blog](https://blog.fal.ai/introducing-ideogram-character/)
2. [Train FLUX LoRA Fast — fal.ai](https://fal.ai/models/fal-ai/flux-lora-fast-training)
3. [Flux 2 Developer Guide — fal.ai](https://fal.ai/learn/devs/flux-2-developer-guide)
4. [Kling O1: Reference Image-to-Video — fal.ai](https://fal.ai/models/fal-ai/kling-video/o1/reference-to-video)
5. [Kling O3 Image to Video — fal.ai](https://fal.ai/models/fal-ai/kling-video/o3/standard/image-to-video)
