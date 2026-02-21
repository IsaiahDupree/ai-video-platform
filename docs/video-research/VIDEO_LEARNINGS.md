# Video Research — Master Learnings Doc

> Consolidated findings from 11 YouTube videos on AI UGC ad creation with Veo 3, Kling 2.6, Sora 2, and related tools.  
> Analyzed: Feb 2026  
> Purpose: Inform pipeline architecture for 90% win-rate UGC ad generation

---

## Source Videos

| # | Video | Key Topic |
|---|-------|-----------|
| V01 | [Z5ull80A-y0](V01-Z5ull80A-y0-viral-ugc-veo3-tutorial.md) | Full UGC workflow — Nano Banana + Veo 3 + ElevenLabs |
| V02 | [ROULTijOrLY](V02-ROULTijOrLY-clone-viral-videos-sora2-veo31.md) | Clone viral videos — Sora 2 + TopView |
| V03 | [EjTrPcPOUwA](V03-EjTrPcPOUwA-realistic-ai-video-ads-kling26.md) | Motion mimicking — Kling 2.6 |
| V04 | [8ApvS7nE5kQ](V04-8ApvS7nE5kQ-infinite-ugc-n8n-veo3.md) | Automated pipeline — n8n + Kling |
| V05 | [WOxMc2gCtVU](V05-WOxMc2gCtVU-5-viral-ad-styles-veo3-json.md) | 5 ad styles + JSON prompts |
| V06 | [T0jn6vABYXI](V06-T0jn6vABYXI-veo3-clothing-brand-videos.md) | Fashion/clothing brand videos |
| V07 | [faDr6Gc8XlQ](V07-faDr6Gc8XlQ-motion-control-ai-ads.md) | Motion control cloning |
| V08 | [AYsg5gAMWyo](V08-AYsg5gAMWyo-nanobanana-veo31-sora2-comparison.md) | Nano Banana vs Sora 2 vs raw Veo 3.1 |
| V09 | [HaixBXsJIRI](V09-HaixBXsJIRI-programmatic-ad-testing-system.md) | Programmatic ad testing system |
| V10 | [KTMxEbsInI0](V10-KTMxEbsInI0-ai-ugc-ads-ecommerce.md) | Awareness stages + static ad system |
| V11 | [HIiLt3Kb1kQ](V11-HIiLt3Kb1kQ-nanobanana-veo31-full-system.md) | Nano Banana + Veo 3.1 full system |

---

## Section 1: The Non-Negotiable Rules (Mentioned in 3+ Videos)

These were cited across multiple videos as critical — violating any of them kills ad quality.

### Rule 1: Always Use Nano Banana Before Veo 3.1
**Cited in:** V01, V04, V08, V11  
**Why:** Raw Veo 3.1 produces:
- "Super HDR orange glow" that looks obviously AI
- Wrong product shapes/containers (jar → bag)
- First frame = static product photo (not a human)

**The Fix:** Nano Banana generates a photorealistic human holding the product → feed THAT into Veo 3.1.  
**Result:** Natural first frame, accurate product, no orange glow.

### Rule 2: Include Voiceover Script IN the Veo Prompt
**Cited in:** V01, V03, V11  
**Why:** When you include the exact words the character should say in the Veo prompt, the character says them naturally. Without this, Veo generates random speech or speaking pauses.

**Format:**
```
[Character description]. [Setting]. [Action].
Sound: The character says: "[exact voiceover line]"
Authentic UGC style, 9:16, no text overlays, no subtitles.
```

### Rule 3: Always Add "No Subtitles, No Text Overlays, No Captions"
**Cited in:** V04, V05, V08  
**Why:** Veo 3 sometimes auto-generates subtitles burned into the video. This is a known bug Google is working on.  
**Fix:** Add to EVERY Veo prompt: `"no subtitles, no text overlays, no captions, no on-screen text"`

### Rule 4: Voice Consistency Across All Clips
**Cited in:** V01, V03  
**Why:** Veo 3 generates a different voice for each clip. When you stitch clips together, the voice changes are obvious and destroy the "real person" illusion.

**Fix:**
1. Generate all clips
2. Export audio from all clips
3. Run through ElevenLabs Voice Changer → pick one consistent voice
4. Re-apply that voice to ALL clips
5. Fix mispronunciations with ElevenLabs TTS patches

### Rule 5: Speed Up All Clips 1.3–1.5x
**Cited in:** V01, V03  
**Why:** AI-generated video has subtle "thinking pauses" and unnatural holds that are obvious at normal speed. Speeding up 1.3–1.5x removes these artifacts.

**Speed Guide:**
| Clip Type | Speed |
|-----------|-------|
| Standard talking | 1.5x |
| Long product reveal | 2x |
| Very long scene | 2.5x |
| Mirror/reflection | 1.2x |

### Rule 6: Add Ambient Background Noise
**Cited in:** V01  
**Why:** AI voices sound slightly synthetic in silence. Background noise (city sounds, cafe ambience, room tone) masks the AI artifacts and makes the audio feel real.

### Rule 7: Always Specify 9:16 Explicitly
**Cited in:** V01, V04, V05  
**Why:** Veo 3 defaults to 16:9 (landscape). Landscape = B-roll, not UGC. Always specify 9:16 in both the prompt AND the generation parameters.

---

## Section 2: Proven Script Structures

### Structure 1: The Discovery Script (Universal)
Best for: Any product, unaware/problem-aware audiences  
Source: V01, V03

```
HOOK:    "I want to be honest — a few weeks back I was really struggling with [pain]."
BRIDGE:  "Then a friend of mine suggested [product category]."
PROOF:   "After just a few weeks of using it, I started noticing a real difference."
RESULT:  "My [specific outcome]. [Specific sensory/emotional detail]."
CTA:     "If you're dealing with the same [problem], this is definitely something worth trying."
```

### Structure 2: The Genuine Surprise Script
Best for: Gift products, unexpected benefits, testimonial format  
Source: V03

```
HOOK:    "I genuinely didn't expect this at all."
REFRAME: "I thought it was just [category] at first, but then I realized it's actually [real value]."
FEATURE: "And it's so much more [benefit]. What I love is that it [specific differentiator]."
BENEFIT: "[Emotional/lifestyle payoff]."
CTA:     "Honestly, if you're looking for [outcome], this is such a good idea."
```

### Structure 3: The "I Love" Feature Script
Best for: Product-aware audiences, feature-focused ads  
Source: V11

```
HOOK:    "I love how [specific feature]."
WHY:     "It actually [functional benefit] while [secondary benefit]."
PROOF:   "[Specific result with timeframe or context]."
CTA:     "[Soft action]."
```

**Examples:**
- "I love how light this is. It actually blows enough air to keep me cool for hours while I'm working."
- "I love that the adjustable resistance actually makes my grip get stronger week to week, and it's small enough to use right at my desk."

### Structure 4: The Viral Clone Structure
Best for: Any product with a proven viral reference  
Source: V02

```
[Extract the narrative structure from a viral video]
[Substitute your product's key phrases]
[Preserve: pacing, tone, camera style, emotional arc]
[Change: product name, specific features, CTA]
```

### Structure 5: The Sensory Description Script
Best for: Food, beverage, beauty, physical products  
Source: V04

```
HOOK:    "[Sensory observation about the product]."
COMPARE: "It's way more than your usual [category]."
DETAIL:  "[Specific sensory detail — taste/texture/feel]."
PAYOFF:  "[Emotional/lifestyle moment]."
```

**Examples:**
- "You can actually taste the fruity stuff in this. It's way more than your usual beer. Honestly, I really like it."
- "I swear this has to be the fruitiest beer I've tried. Like, you actually get the punch of citrus. It's kind of addictive."

---

## Section 3: The Veo 3.1 Prompt Formula

### The 5-Part Prompt Structure
```
[CHARACTER] + [SETTING] + [ACTION] + [SOUND] + [STYLE RESTRICTIONS]
```

### Full Template
```
[Age]-year-old [gender], [ethnicity], [emotional state].
[Setting: location, time of day, lighting type].
[Action: what character does with product, including product description].
Sound: The character says: "[exact voiceover line — max 15 words]"
Authentic UGC style, handheld selfie camera, slight natural camera movement, 9:16 vertical.
No text overlays, no subtitles, no captions, no on-screen text.
```

### Example (Software/App — EverReach)
```
28-year-old professional woman, mixed ethnicity, slightly stressed but curious expression.
Home office, warm afternoon light from window, laptop visible in background.
Holding phone, scrolling through contacts list, then looking up at camera with realization.
Sound: The character says: "if you struggle with keeping up with your network, try this."
Authentic UGC style, handheld selfie camera, slight natural camera movement, 9:16 vertical.
No text overlays, no subtitles, no captions, no on-screen text.
```

### Nano Banana Prompt Template
```
[Age]-year-old [gender], [ethnicity], [specific expression — not "smiling"].
[Setting with specific lighting].
[Holding/using product — describe product accurately].
Photorealistic, authentic UGC style, natural skin texture, real person (not a model).
Shot from [angle: selfie/over-shoulder/medium close-up].
No text, no logos, no watermarks, no AI artifacts.
```

---

## Section 4: Model Selection Guide

### Decision Matrix
| Scenario | Recommended Model | Cost/clip |
|----------|------------------|-----------|
| Product-holding UGC (standard) | Nano Banana + Veo 3.1 Fast | $0.32 |
| Hero ad (best quality) | Nano Banana + Veo 3.1 Quality | $0.42 |
| High-volume testing (100+ clips) | Sora 2 | $0.15 |
| Motion mimicking (copy movements) | Kling 2.6 Motion | varies |
| Fashion/wearables | Kling 2.6 Motion | varies |
| Complex products (many details) | Nano Banana + Veo 3.1 | $0.32 |

### Never Use
- **Raw Veo 3.1 without Nano Banana** — orange glow, product inaccuracy, static first frame
- **Sora 2 for human-holding-product shots** — blocks realistic human images

---

## Section 5: The 0 AI Anomalies Checklist

Every generated clip must pass ALL of these before being used:

### Visual Quality
- [ ] First frame is a human (not a static product photo)
- [ ] No orange HDR glow effect
- [ ] Product shape/container matches source image
- [ ] No unnatural hand/product holds
- [ ] No text, subtitles, or captions burned in
- [ ] Aspect ratio is 9:16 (not 16:9)
- [ ] Character looks consistent with other clips in the batch

### Audio Quality
- [ ] Character speaks the intended voiceover line
- [ ] No speaking pauses or unnatural gaps
- [ ] Voice is consistent with other clips (same voice, same tone)
- [ ] No AI voice artifacts (robotic tone, mispronunciations)
- [ ] Background ambient noise present

### Content Quality
- [ ] Script follows the correct awareness-stage structure
- [ ] No marketing buzzwords
- [ ] Sounds like a real person talking, not an ad
- [ ] CTA is present and clear
- [ ] Product is mentioned at the right awareness stage (never in unaware scripts)

---

## Section 6: The Testing Strategy

### Phase 1: Hook Testing (Static Ads)
> "The best way to test a lot of ads at scale is to use static ads." — V09, V10

1. Generate 10–20 hooks per angle
2. Apply each hook to 2 image templates
3. Push all into one Facebook ad set
4. Let algorithm run 7–14 days
5. Identify 1–2 winning hooks

### Phase 2: Video Production (Winning Hooks Only)
1. Take winning hooks → generate video scripts
2. Generate 3 video variations per winning hook
3. Quality gate: pass all 0-anomaly checks
4. Push to ad account

### Phase 3: Iteration
1. Take winning video angle → generate new hooks
2. New images + same hooks
3. Different messaging frameworks + same angle
4. Scale winners, kill losers

### The "One Variable" Rule
> "Test one specific way to communicate positioning rather than trying to communicate everything at once." — V09

Change ONE thing per test:
- Hook line (same body + CTA)
- Proof type (screen demo vs. result demo vs. testimonial)
- Creator persona (expert vs. everyday person)
- CTA wording (free trial vs. "see how it works")

---

## Section 7: Cost Structure

### Per-Video Costs
| Component | Cost |
|-----------|------|
| Nano Banana image | $0.02 |
| Veo 3.1 Fast (8s) | $0.30 |
| Veo 3.1 Quality (8s) | $0.40 |
| ElevenLabs voice (per clip) | ~$0.01 |
| **Total per clip (standard)** | **$0.33** |
| **Total per clip (quality)** | **$0.43** |

### Testing Economics
- 100 video variations: $33–$43
- Find 1 winner: potentially $10k–$100k+ revenue
- **ROI on testing: 100–1000x**

---

## Section 8: What's Missing in Our Current Pipeline

Based on all 11 videos, here are the gaps vs. what top practitioners are doing:

| Gap | Priority | Fix |
|-----|----------|-----|
| No voice consistency pass (ElevenLabs Voice Changer) | 🔴 Critical | Add ElevenLabs normalization after generation |
| No speed-up post-processing (1.3–1.5x) | 🔴 Critical | Add FFmpeg speed pass |
| No ambient noise injection | 🔴 Critical | Add room tone/ambient audio layer |
| Voiceover not included in Veo prompt | 🔴 Critical | Add `voiceScript` to motionPrompt |
| "No subtitles" not in all prompts | 🔴 Critical | Add to all Veo prompt templates |
| No 0-anomaly quality gate | 🔴 Critical | Build automated quality checker |
| No static ad testing before video | 🟡 High | Add static ad generation stage |
| No 3-variation generation per angle | 🟡 High | Add `variantCount: 3` to config |
| No gold nuggets extraction | 🟡 High | Add voice mining to offer creation |
| No winner iteration workflow | 🟡 High | Add `iterateFromWinner` to smart-generate |
| No cost tracking per clip | 🟢 Medium | Log cost in output metadata |
| No JSON prompt structure | 🟢 Medium | Convert text prompts to JSON format |
