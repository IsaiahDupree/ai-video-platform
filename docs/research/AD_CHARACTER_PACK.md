# EverReach — Ad Character Pack
## Character Profiles, Prompt Blocks & AI Video Generation Spec

> **Last Updated:** Feb 21, 2026
> **Purpose:** Production reference for creating consistent UGC-style ad characters across Meta, TikTok, YouTube Shorts, and Apple Ads. Includes character profiles, wardrobe specs, prop lists, background lists, expression sets, reusable prompt blocks, and a JSON schema for fal.ai / Make / n8n automation.

---

## Table of Contents

1. [Why Consistent Characters Matter](#1-why-consistent-characters-matter)
2. [Cast Strategy](#2-cast-strategy)
3. [Character Roster](#3-character-roster)
4. [Wardrobe Spec by Bucket](#4-wardrobe-spec)
5. [Prop List by Use Case](#5-prop-list)
6. [Background Library](#6-background-library)
7. [Expression List](#7-expression-list)
8. [Global Prompt Blocks](#8-global-prompt-blocks)
9. [Character Identity Prompt Blocks](#9-character-identity-prompt-blocks)
10. [Angle Prompt Blocks (A1–A9)](#10-angle-prompt-blocks)
11. [Un-Ghosting Series Prompt Blocks](#11-un-ghosting-series-prompt-blocks)
12. [Character × Angle Matrix](#12-character--angle-matrix)
13. [3×10s Scene Plan (Sample 30s Ad)](#13-3x10s-scene-plan)
14. [Production Rules](#14-production-rules)
15. [fal.ai Workflow Notes](#15-falai-workflow-notes)
16. [JSON Config (see AD_CHARACTER_PACK.json)](#16-json-config)

---

## 1. Why Consistent Characters Matter

For EverReach, the best creative setup is **one core recurring character** with **context-specific "skins"** so the audience learns the character while the ad angle changes.

- Character recognition builds brand memory across repeated impressions
- Same person + different context = series feel, not random UGC clips
- Easier to test: swap angle/setting, keep identity locked → isolate what's working
- fal.ai / Kling models perform better with consistent reference images

**The rule:** Keep face, hair, age vibe, and personality locked. Vary outfit, setting, prop, and hook.

---

## 2. Cast Strategy

**Recommended cast mix: 6 female / 2 male recurring characters**

> EverReach sells care, consistency, and follow-through. The cast should feel like people you'd actually trust to text someone back — not influencers, not sales reps.

| Role | Count | Purpose |
|------|-------|---------|
| Primary Female Hero | 1 | Appears in 40–50% of ads; builds recognition |
| Female Specialists | 3 | Personal / Networking / Business emphasis |
| Female Alternates | 2 | Younger TOF hooks + older trust/mentor energy |
| Male Supports | 2 | Broaden audience fit; professional + personal |

**Avoid making the cast feel like:** ultra-luxury influencers · hardcore sales bros · hyper-productivity robots · fake testimonial actors · overly scripted commercial spokespeople

---

## 3. Character Roster

### Female Characters

#### 1) Maya Brooks — Primary Hero
**Archetype:** Warm Reconnector + Organized Creative | **Age:** 27–33
**Ethnicity:** Black / African American (or mixed Black)
**Personality:** thoughtful, calm, emotionally intelligent, practical, slightly busy but intentional
**Why she works:** Bridges personal and professional angles. Can say "I care, life got loud" *and* "I built a system for this."
**Primary angles:** A1 · A2 · A7 · A9 | **Un-ghosting:** Friend · Family · Old Friend
**Use:** 40–50% of all generated ads

---

#### 2) Talia Reed — Networking Specialist
**Archetype:** Social Operator | **Age:** 26–35
**Ethnicity:** White German/Nordic/Mediterranean-coded or Latina (light-medium skin tone)
**Personality:** sharp, social, competent, upbeat, organized, practical
**Why she works:** Perfect for "met someone, forgot to follow up" and "network quietly dying" angles.
**Primary angles:** A5 · A6 · A8 | **Un-ghosting:** Coworker / Colleague

---

#### 3) Nia Carter — Business / Client Specialist
**Archetype:** Trusted Closer (non-salesy) | **Age:** 29–39
**Ethnicity:** Black / Afro-Caribbean
**Personality:** grounded, reliable, clear communicator, warm authority, professional
**Why she works:** Credible for "I don't drop the ball on people who matter to my business."
**Primary angles:** A3 · A4 · A8 | **Un-ghosting:** Client · Mentor

---

#### 4) Elena Park — Product Coach
**Archetype:** Calm Product Guide | **Age:** 25–34
**Ethnicity:** East Asian (Korean/Chinese/Japanese-coded)
**Personality:** reassuring, clear, efficient, demo-first, calm
**Why she works:** Minimal styling keeps UI as the star. Ideal for retargeting demos.
**Primary angles:** A2 · A9 | **Un-ghosting:** none

---

#### 5) Jules Bennett — TOF Emotional Hook Performer
**Archetype:** Honest Overthinker → Relief | **Age:** 22–29
**Ethnicity:** White German/Nordic/Swiss-coded or mixed-race ambiguous Gen Z look
**Personality:** expressive, self-aware, funny, casual, lightly chaotic, sincere
**Why she works:** Strong for Stage 1–2 hooks and "I typed it and deleted it" moments.
**Primary angles:** A1 · A7 | **Un-ghosting:** Crush · Old Friend · Friend

---

#### 6) Priya Shah — Trust Builder / Mentor Energy
**Archetype:** Intentional Connector | **Age:** 33–45
**Ethnicity:** South Asian (Indian / Indo-Caribbean-coded)
**Personality:** composed, wise, generous, intentional, clear, no-fluff
**Why she works:** Expands resonance beyond younger demographics. High trust for mentor/networking/business.
**Primary angles:** A3 · A4 · A6 | **Un-ghosting:** Mentor · Client · Coworker

---

### Male Characters

#### 7) Marcus Lane — Founder/Operator Male Counterpart
**Archetype:** Busy Builder Who Wants to Show Up Better | **Age:** 28–38
**Ethnicity:** Black / mixed Black
**Personality:** practical, calm, systems-oriented, sincere, warm
**Primary angles:** A3 · A4 · A8 | **Un-ghosting:** Client · Mentor

---

#### 8) Andre Collins — Personal + Networking Male Support
**Archetype:** Good Friend / Strong Follow-Through | **Age:** 25–35
**Ethnicity:** Latino / Afro-Latino / mixed
**Personality:** warm, grounded, thoughtful, low-ego, friendly
**Primary angles:** A1 · A7 | **Un-ghosting:** Friend · Family · Coworker

---

## 4. Wardrobe Spec

### Personal / Friendship
**Female:** solid crewneck tee (cream/gray/olive) · oversized cardigan · hoodie (sage/charcoal) · minimal jewelry · natural makeup
**Male:** solid tee (heather gray/navy) · zip hoodie · casual overshirt · minimal watch
**Avoid:** loud patterns, high-fashion, full corporate attire

### Career Networking
**Female:** fitted tee + blazer · knit top + overshirt · structured blouse · badge/lanyard · AirPods/tote
**Male:** polo + jacket · lightweight blazer · watch/laptop bag
**Colors:** charcoal, navy, white, black, olive, muted blue

### Business / Client / Sales
**Female:** button-up (white/pale blue/taupe) · knit polo · minimal blazer · elevated basics in black/slate/cream
**Male:** button-up · clean sweater · neutral overshirt
**Colors:** black, white, slate, deep blue, camel, muted olive

### Product Demo
**All:** plain solid top only · no text/logos/patterns · mid-tone solid · minimal reflective jewelry · hair off face

---

## 5. Prop List

| Context | Props |
|---------|-------|
| Personal | coffee mug · phone with messaging thread · notes app screenshot · calendar reminder · couch blanket |
| Networking | business card/stack · conference badge/lanyard · laptop · notebook + pen · coffee cup · tote bag |
| Business | planner/calendar · whiteboard with list · client notes/sticky notes · headphones · desk lamp + monitor |
| Product Demo | phone only (hero prop) · optional notebook for "3-step system" framing |

---

## 6. Background Library

| Context | Backgrounds |
|---------|-------------|
| Personal | couch near window · kitchen counter (morning light) · parked car · bedroom mirror corner · neighborhood walk |
| Networking | coffee shop table · coworking desk · conference hallway/lobby · outside event venue · elevator/lobby |
| Business | home office desk · studio corner with monitor + phone stand · clean bookshelf wall · whiteboard corner · standing desk |
| Product Demo | neutral wall · minimal desk backdrop · soft gradient light wall · clean office nook |

---

## 7. Expression List

### Core EverReach Expressions (all characters)
- Neutral listening face
- Soft concern (thinking about someone)
- "Oops, I forgot" realization
- Overthinking / hesitation
- Relief (solution found)
- Warm confidence (explaining system)
- Friendly micro-smile to camera
- Practical authority ("here's how I do it")
- Inviting no-pressure CTA face

### Social Native UGC Expressions (Jules, Andre)
- Expressive eyebrow raise · quick smile after send · typing focus face · playful nervous smile · look down at phone → back to camera · subtle nod mid-sentence

---

## 8. Global Prompt Blocks

### Consistency Block
```
same recurring character, same face identity, same hairstyle, same hair color, same age appearance, same skin tone, same natural makeup/grooming, realistic smartphone UGC look, natural lighting, relatable real-world environment, talking directly to camera, emotionally warm and trustworthy, not overly polished, not stock footage, not luxury commercial style, authentic social media ad creator energy, consistent facial features across shots
```

### Negative Block
```
avoid face changes, avoid different person, avoid dramatic beauty glam, avoid heavy filters, avoid hyper-cinematic lighting, avoid surreal details, avoid extra fingers, avoid warped phone, avoid text artifacts, avoid logo-heavy clothing, avoid stock-photo smile, avoid plastic skin, avoid excessive skin smoothing
```

### Prompt Assembly Order
```
[GLOBAL_CONSISTENCY] + [CHARACTER_IDENTITY] + [ANGLE_OR_CONTEXT_BLOCK] + [SETTING_BLOCK] + [WARDROBE_BLOCK] + [SHOT_STYLE_BLOCK] + [NEGATIVE_BLOCK]
```

For chained video clips (3×10s):
```
[GLOBAL_CONSISTENCY] + [CHARACTER_IDENTITY] + [ANGLE_BLOCK] + [CLIP_SCENE_DESCRIPTION] + [CONTINUITY: same outfit/hairstyle/location family] + [NEGATIVE_BLOCK]
```

---

## 9. Character Identity Prompt Blocks

**Maya Brooks**
```
female, Black/African American, late 20s to early 30s, warm expressive eyes, friendly natural smile, soft defined brows, healthy natural skin texture, calm thoughtful energy, organized creative vibe, shoulder-length hair (soft curls or sleek bob), polished natural makeup, emotionally intelligent and sincere
```

**Talia Reed**
```
female, white German or Nordic or Mediterranean, late 20s to mid 30s, confident social professional, bright alert eyes, polished approachable beauty, smart-casual style, clean blowout or sleek ponytail, competent upbeat energy, organized and practical, coworking/event-friendly presence
```

**Nia Carter**
```
female, Black or Afro-Caribbean, early 30s to late 30s, founder/consultant presence, warm authority, composed face, strong eye contact, elegant natural beauty, refined makeup, polished professional hair styling (bun, straight, twists, or braided updo), grounded and reliable
```

**Elena Park**
```
female, East Asian, mid 20s to early 30s, clear and reassuring explainer energy, clean minimal styling, calm confidence, highly readable direct-camera face, natural skin texture, neat straight or softly layered hair, neutral product demo aesthetic
```

**Jules Bennett**
```
female, white German or Nordic or Swiss, early to late 20s, relatable and expressive, playful sincere energy, casual everyday beauty, selfie-camera friendly features, lightly styled hair, natural makeup, overthinking-to-relief emotional arc, social-native UGC vibe
```

**Priya Shah**
```
female, South Asian, mid 30s to mid 40s, composed and thoughtful, intentional connector energy, graceful smile, elegant understated beauty, polished hair (low bun or soft waves), warm professional setting, trustworthy mentor-like presence
```

**Marcus Lane**
```
male, Black or mixed Black, late 20s to late 30s, practical founder energy, calm sincere eyes, clean grooming (short beard or clean-shaven), approachable smile, systems-oriented but warm, clean neutral wardrobe, home office/studio desk presence
```

**Andre Collins**
```
male, Latino or Afro-Latino, mid 20s to mid 30s, warm approachable friend energy, grounded and thoughtful, casual-smart wardrobe, authentic UGC talking style, friendly eyes, natural grooming, coffee shop or living room setting
```

---

## 10. Angle Prompt Blocks

**A1 — Forgotten Follow-Up**
```
holding phone, glancing at old message thread, slight regret expression turning into relief, soft natural light, couch or kitchen setting, relatable "I meant to text them" moment, selfie-style framing
```

**A2 — Warmth Score**
```
showing phone screen with relationship health or warmth score style interface, direct-to-camera explanation, clean background, clear product demo framing, reassuring expression, quick UI proof moments
```

**A3 — 3-Minute Routine**
```
founder desk setup, planner and phone visible, calm authority explaining a weekly relationship check-in routine, practical workflow energy, whiteboard or calendar in background, stable framing
```

**A4 — AI That Sounds Like You**
```
typing outreach on phone, comparing blank-screen overthinking to AI-assisted message suggestion, relieved confident expression, office desk setting, human and non-salesy tone, subtle screen demonstration
```

**A5 — Card Scan**
```
conference or coffee-shop setting, holding a business card and phone, quick action demo vibe, "met someone and added them instantly" energy, smart-casual wardrobe, upbeat competent delivery
```

**A6 — Network = Net Worth**
```
direct-to-camera networking truth statement, coworking or city coffee setting, reflective then practical tone, visually organized professional look, strong hook delivery, social-operator energy
```

**A7 — Before / After**
```
before state overwhelmed by many contacts and missed follow-ups, after state calm and organized using a relationship system, split-scene or sequential visual storytelling, emotional relief payoff
```

**A8 — Switcher**
```
frustrated by complicated tools, spreadsheets, or cluttered workflows, then simplified phone-based relationship system, practical founder or professional energy, clear visual contrast between old and new
```

**A9 — Voice Notes**
```
recording a voice note into phone, app transcribes and organizes it, quick demo proof, direct and friendly explanation, minimal clean setup, confidence and ease
```

---

## 11. Un-Ghosting Series Prompt Blocks

Same character, swap context layer only.

**Friend:** `casual home setting, warm hoodie or tee, reflective expression, message thread to a friend, "it has been too long" energy, gentle honest tone`

**Family:** `kitchen or living room setting, softer tone, thoughtful expression, phone call or message reminder vibe, caring adult-life relationship context`

**Crush:** `mirror or selfie framing, slightly playful nervous energy, polished casual outfit, overthinking then relief arc, phone in hand, authentic and charming`

**Old Friend:** `nostalgic but grounded tone, couch or walk-and-talk scene, soft natural light, "we drifted but I still care" expression, warm reconnection energy`

**Coworker:** `desk or coworking setting, smart-casual wardrobe, practical tone, follow-up message after meeting or project context, efficient and friendly energy`

**Client:** `home office or founder desk, professional warm tone, client follow-up context, confidence without pushiness, trustworthy operator energy`

**Mentor:** `desk with notebook, respectful gratitude tone, thoughtful expression, professional setting, message drafting for someone important, intentional and appreciative`

---

## 12. Character × Angle Matrix

**Legend:** P = Primary · S = Secondary · T = Test · N = Not recommended

| Character | A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8 | A9 |
|-----------|----|----|----|----|----|----|----|----|-----|
| Maya | P | P | S | S | T | S | P | S | P |
| Talia | S | S | S | S | P | P | T | P | S |
| Nia | S | S | P | P | S | S | T | P | S |
| Elena | T | P | S | S | T | T | T | S | P |
| Jules | P | S | T | T | T | T | P | T | S |
| Priya | S | S | P | P | T | P | T | S | S |
| Marcus | S | S | P | P | S | S | T | P | S |
| Andre | P | S | S | T | S | S | P | T | S |

---

## 13. 3×10s Scene Plan

**Character:** Maya Brooks | **Theme:** Forgotten Follow-Up → Mechanism → Warmth Score (MOF)
**Format:** 9:16 UGC · 3 clips × 10s · same outfit/setting family throughout

### Clip 1 (0–10s) — Personal Hook
Setting: couch, soft window light | Wardrobe: cream tee + cardigan | Shot: handheld selfie
```
0–2s:  most friendships don't end… they drift
2–6s:  and half the time it's not because you stopped caring
6–10s: you just got busy and forgot to follow up
```
Prompt: `[GLOBAL] + [MAYA] + female speaking to camera in cozy apartment couch, cream shirt and beige cardigan, soft window light, UGC selfie framing, reflective expression turning to warmth + [NEGATIVE]`

### Clip 2 (10–20s) — Mechanism Reveal
Setting: same apartment desk | Shot: stable medium + phone inserts
```
10–14s: what fixed this for me was a tiny relationship rhythm
14–17s: a list, a reminder, and a message starter
17–20s: so I don't rely on memory anymore
```
Prompt: `[GLOBAL] + [MAYA] + same apartment desk, notebook and phone, calm practical explanation of relationship rhythm, natural light continuity + [NEGATIVE]`

### Clip 3 (20–30s) — Product Proof + CTA
Setting: clean desk / neutral wall | Shot: face intro → screen inserts → face CTA
```
20–24s: I use EverReach to track who I've talked to and who's going cold
24–27s: it even gives me starters when my brain is blank
27–30s: if you want to stay close without overthinking it, try it free
```
Prompt: `[GLOBAL] + [MAYA] + [A2] + direct-to-camera product explainer, quick phone demo, warmth score screen and message starters, same outfit/hairstyle, clear CTA energy + [NEGATIVE]`

**Chaining clips:**
```bash
# Extract last frame of each clip
ffmpeg -sseof -0.05 -i clip1.mp4 -frames:v 1 last1.png
ffmpeg -sseof -0.05 -i clip2.mp4 -frames:v 1 last2.png

# Stitch final 30s
printf "file 'clip1.mp4'\nfile 'clip2.mp4'\nfile 'clip3.mp4'\n" > list.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy out_30s.mp4
```

---

## 14. Production Rules

### Identity Lock (never change between ads in a set)
hair color/style family · facial shape + brows · makeup/grooming level · age vibe · wardrobe style family · lighting family · speaking tone/personality

### Safe to Vary
outfit color within palette · setting · prop · hook line · angle/use case · camera distance

### Beauty Guardrails
**Do:** natural skin texture · minimal retouching · real-life lighting · consistent hair silhouette · "trustworthy + warm" over "perfect"
**Don't:** over-glam · smooth skin too much · change face shape between ads · luxury-commercial beauty styling for all scenes

---

## 15. fal.ai Workflow Notes

### Recommended models
- **Ideogram Character** — single-image character pack generation (poses, angles, expressions)
- **FLUX LoRA training** — train on 20–100+ images for locked identity across many scenes
- **Kling O1 Reference-to-Video** — image-to-video with stable character identity
- **Kling O3 Image-to-Video** — start frame + end frame animation (great for chaining)

### Character pack build order
1. Start with 1 clean reference photo (front / ¾ view)
2. Generate: front · ¾ · side · neutral · smile · talking mouth open · seated with phone · standing selfie
3. Use this pack as `@Element1` references in every Kling O1 call
4. Chain clips using last frame of previous clip as start frame

### Recommended rollout order
1. **Maya Brooks** — main hero (40–50% of ads)
2. **Talia Reed** — networking specialist
3. **Nia Carter** — business/client specialist
4. **Jules Bennett** — high-scroll TOF emotional hooks
5. Add Elena, Priya, Marcus, Andre as volume scales

---

## 16. JSON Config

The full machine-readable character pack lives in `AD_CHARACTER_PACK.json` in this same directory.

Use it to drive automated prompt assembly in fal / Make / n8n:

```
character.identity_prompt_block
+ globals.consistency_block
+ libraries.angles[id].prompt_block
+ libraries.wardrobe_buckets[ref].items
+ libraries.background_buckets[ref].items
+ globals.negative_block
```

*See also: AD_CREATIVE_FRAMEWORK.md · AD_UNGHOSTING_SCRIPTS.md · META_ADS_PLAYBOOK.md · MEDIA_ASSETS.md*
