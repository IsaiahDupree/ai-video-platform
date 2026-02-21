# Video Analysis: Turn Any Product into VIRAL UGC AD With Veo 3

**URL:** https://www.youtube.com/watch?v=Z5ull80A-y0  
**Topic:** Full UGC AI Ad Tutorial — $14,836 from a single AI UGC ad  
**Tools:** Nano Banana Pro + Veo 3 + ElevenLabs + CapCut  
**Product Type:** E-commerce (facial cleansing brush / skincare)

---

## Core Workflow

### Step 1: Product Selection + Market Research
- Choose a product with clear visual proof potential
- Use ChatGPT to analyze the product (paste Amazon link or description)
- Prompt: *"You are a professional marketer. Create a UGC script for [product]. Identify pain points, target audience, and key benefits."*
- Extract: audience, pain points, transformation story

### Step 2: Character Image Generation (Nano Banana)
- Generate a photorealistic UGC character (not a celebrity)
- Specify: age, ethnicity, setting, emotional state, lighting
- Key: generate the **same character** across all clips for consistency
- Use "ingredients to video" feature: character + product 1 + product 2

### Step 3: Script Structure Used
```
HOOK:     "A few weeks back I was really struggling with [pain point]."
PROBLEM:  "Then a friend of mine suggested [product category]."
PROOF:    "After just a few weeks of using it, I started noticing a real difference."
RESULT:   "My skin feels amazing now. Super fresh, really clean."
CTA:      "If you're dealing with the same problem, this is definitely worth trying."
```

### Step 4: Veo 3 Video Generation
- Generate A-roll: character speaking to camera (selfie style)
- Generate B-roll: character using product in bathroom/home setting
- Prompt formula: `[Setting]. [Character description]. [Action]. [Emotional state]. [Product visible].`
- Example B-roll prompt: *"Woman in bathroom, soft morning light, applying facial cleansing brush to cheeks, relaxed expression, product clearly visible in hand, authentic UGC style, no text overlays."*

### Step 5: Voice Consistency Fix (Critical)
**Problem:** Veo 3 generates a different voice for each clip — sounds fake.  
**Fix:**
1. Export all clips as audio only
2. Use ElevenLabs Voice Changer → pick one consistent voice
3. Re-apply that voice to ALL clips
4. Fix mispronunciations: use ElevenLabs TTS for specific words/phrases
5. Add ambient background noise (city sounds, cafe noise) to mask AI voice artifacts

### Step 6: Video Editing (CapCut)
- Speed up clips by 1.3–1.5x to remove awkward pauses
- Crop out bad frames (unnatural hand positions, creepy holds)
- Add captions (Poppins font, white, bold, centered)
- Add subtle background music (romantic/emotional for beauty products)
- Combine A-roll (speaking) with B-roll (product in use)

---

## Key Learnings

### What Makes It Look Real
1. **Voice consistency** — single voice across all clips is non-negotiable
2. **Speed up clips** — 1.3–1.5x removes AI "thinking pauses" and unnatural holds
3. **Background ambient noise** — masks AI voice artifacts, makes it feel real
4. **Crop bad frames** — especially unnatural hand/product interactions
5. **Character consistency** — same face, same setting across all clips

### Prompt Patterns That Work
- Specify aspect ratio explicitly (9:16 not 16:9)
- Include emotional state in every prompt
- Describe the setting in detail (bathroom, morning light, etc.)
- Show product being used, not just held

### Cost Structure
- Nano Banana image: ~$0.02
- Veo 3 fast (8s): ~$0.30
- Total per clip: ~$0.32
- Full ad (5 clips): ~$1.60

### Common Failures to Avoid
- Voice changes between clips (fix with ElevenLabs Voice Changer)
- Wrong aspect ratio (always specify 9:16)
- Mispronounced product names (fix with TTS patch)
- Unnatural product holds (crop or regenerate)
- No ambient noise (always add city/room tone)

---

## Proven Script Template (Skincare/Beauty)

```
HOOK:    "I want to be honest — a few weeks back I was really struggling with [pain]."
BRIDGE:  "Then a friend of mine suggested [product]. She mentioned it works great with [companion product]."
PROOF:   "After just a few weeks of using it, I started noticing a real difference."
RESULT:  "My skin feels amazing now. Super fresh, really clean, and my pores look so much better."
CTA:     "If you're dealing with the same [problem], this is definitely something worth trying."
```

---

## Pipeline Implications for Our System

| Current Gap | Fix |
|-------------|-----|
| Voice changes per clip | Add ElevenLabs voice normalization pass after Veo generation |
| No ambient noise layer | Add ambient noise injection in post-processing |
| No speed adjustment | Add 1.3x speed pass in CapCut/FFmpeg post-processing |
| Aspect ratio inconsistency | Always enforce 9:16 in prompt AND generation params |
