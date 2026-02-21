# Veo3 UGC Ad Master Learnings — Research-Backed Guide

> Synthesized from deep transcript + visual analysis of 11 expert YouTube videos.
> Last updated: 2026-02-21

## Source Videos Analyzed

| # | Title | Channel | Views |
|---|-------|---------|-------|
| 1 | [Turn Any Product into VIRAL UGC AD With Veo 3](https://youtube.com/watch?v=Z5ull80A-y0) | Klever Nuts AI | 420 |
| 2 | [How to Clone Viral Videos Into AI UGC Ads](https://youtube.com/watch?v=ROULTijOrLY) | Jon Mac | 21,482 |
| 3 | [This AI System makes Infinite UGC ads for ANY product](https://youtube.com/watch?v=8ApvS7nE5kQ) | RoboNuggets | 69,313 |
| 4 | [Turn Any Image into 5 Viral AI Ads with Google VEO 3](https://youtube.com/watch?v=WOxMc2gCtVU) | Robert's Tech Toolbox | 83,908 |
| 5 | [How To Use Google Veo 3 to Make Viral Clothing Brand Videos](https://youtube.com/watch?v=T0jn6vABYXI) | BitBranding | 4,736 |
| 6 | [How To Make Freakishly Realistic AI Video ads](https://youtube.com/watch?v=EjTrPcPOUwA) | THE ECOM KING | 12,017 |
| 7 | [how i make ads with AI motion control](https://youtube.com/watch?v=faDr6Gc8XlQ) | taysthetic. | 17,195 |
| 8 | [I Built the Ultimate UGC Content System with AI Agents](https://youtube.com/watch?v=AYsg5gAMWyo) | Nate Herk | 58,879 |
| 9 | [I Tested 500 Meta Ads Using AI, Here Are The Best Hooks](https://youtube.com/watch?v=HaixBXsJIRI) | Alfie Carter | 11,500 |
| 10 | [Turn ANY Product into UGC Ads with Veo3](https://youtube.com/watch?v=KTMxEbsInI0) | Vinny Reo | 17,500 |
| 11 | [How to (logically) test Facebook Ads at an incredible speed](https://youtube.com/watch?v=HIiLt3Kb1kQ) | Steph France | 2,053 |

---

## SECTION 1: THE 5 PROVEN HOOK FORMULAS

> Source: Alfie Carter (HaixBXsJIRI) — tested 500 Meta ads. Only 5 hook formulas kept winning
> across niches, products, and every creative style. Top campaign: 11x ROAS using Hook #5.

### Hook #1 — Pain + Literally Saved Me

**Formula:** `"My [problem] was [bad situation]. [Product] literally saved me."`

The word **"literally"** makes it feel real and emotional. Leads with pain — stops scroll immediately.
Works for any product that solves a clear problem.

**Examples:**
```
"My skin was flaking nonstop. Caravee literally saved me."
"My back pain was killing me. This corrector literally saved me."
"I couldn't hit my protein goals. These bars literally saved me."
```

**Pro tip:** Test 3-4 pain descriptions with the same structure:
- "my skin was flaking" → "peeling" → "cracking" → "breaking out"

**Best for:** Skincare, supplements, fitness, productivity — anything fixing a clear pain.

---

### Hook #2 — Never Tried Before / Believe It Or Not

**Formula:** `"I've never tried [product] before. Believe it or not."`

Completely removes sales pressure. "I've never tried this before" feels real and unbiased.
"Believe it or not" creates a curiosity gap — viewers keep watching to find out what happens.

**Examples:**
```
"I've never tried Prime. Believe it or not, I'm impressed."
"Never used a scalp massager. Believe it or not, this works."
"I've never tried red light therapy. Believe it or not, my skin looks different."
```

**Critical:** Avatar must look **curious first, then genuinely surprised** — not excited from the start.
If avatar looks too excited at the start, people won't believe the "I never tried this" part.

**Best for:** Trendy products, impulse purchases, viral gadgets/skincare.

---

### Hook #3 — POV Discovery

**Formula:** `"POV: You just discovered [solution to their pain]"`

Native to TikTok/Reels. Puts viewer inside the experience. Creates immediate identification.

**Examples:**
```
"POV: You just found out you can get results without going to the gym"
"POV: You just discovered the skincare routine that cleared your skin in 2 weeks"
"POV: You just found the tool that cut your reporting time from 3 hours to 5 minutes"
```

**Best for:** Lifestyle products, transformation products, Gen Z audiences, SaaS.

---

### Hook #4 — Stop Scrolling If

**Formula:** `"Stop scrolling if you [have this exact problem]"`

Pattern interrupt. Immediately qualifies the viewer — if they have the problem, they feel personally addressed.

**Examples:**
```
"Stop scrolling if you're tired of wasting money on ads that don't convert"
"Stop scrolling if your back hurts every morning when you wake up"
"Stop scrolling if you've tried every skincare product and nothing works"
```

**Best for:** Problem-aware audiences, B2B/software, health products.

---

### Hook #5 — Social Proof + FOMO (11x ROAS Hook)

**Formula:** `"[Specific number] people [did thing] and [specific result]"`

Combines FOMO with social proof. Specific numbers feel credible. Creates urgency without being pushy.
This is the hook behind Alfie Carter's **11x ROAS campaign**.

**Examples:**
```
"15,000 people switched to this and their skin cleared in 30 days"
"This one tool replaced my entire $500/month software stack"
"Over 8,000 store owners are using this to cut their ad spend in half"
```

**Best for:** SaaS, subscriptions, community-driven products, proven ecommerce.

---

## SECTION 2: VEO3 PROMPT ARCHITECTURE

### The Universal Prompt Structure

Every high-performing Veo3 UGC prompt follows this exact structure:

```
[CHARACTER]: [gender], [exact age range e.g. "24-26"], [hair color+style],
[skin tone — specific], [clothing — specific color + item],
[one distinguishing feature], [energy/emotion]

[SETTING]: [specific location], [specific background detail 1],
[specific background detail 2], [lighting type — natural not studio]

[CAMERA]: [shot type], [movement], [aspect ratio]

[ACTION]: [what they're doing with/to the product]

[DIALOGUE]: Says: "[exact script line]"

[AUDIO]: [no background music / natural ambience type]

[STYLE]: (no subtitles), authentic UGC, iPhone-quality, no filters
```

### The `Says:` Colon Syntax — Single Most Important Rule

Confirmed across all 11 videos as the critical Veo3 speech trigger:

```
Says: "your dialogue here"
```

- The **colon** after `says` is what triggers native speech synthesis
- Without it, Veo3 may generate ambient audio instead of speech
- Quotes around dialogue are fine and help pronunciation
- Never write dialogue without this syntax

### JSON Prompt Format (from WOxMc2gCtVU — Robert's Tech Toolbox)

Robert's approach uses structured JSON for Veo3 — works with Google AI Studio:

```json
{
  "scene": "UGC testimonial",
  "character": "Woman, late 20s, casual athletic wear, natural makeup",
  "setting": "Modern kitchen, morning light, coffee on counter",
  "camera": "Medium close-up, slight handheld movement, 9:16 vertical",
  "action": "Holds product up, looks at camera with genuine expression",
  "dialogue": "I've been using this for two weeks and honestly I didn't expect it to work this fast",
  "audio": "No background music, natural kitchen ambience",
  "style": "Authentic UGC, no filters, no subtitles, iPhone-quality"
}
```

---

## SECTION 3: CHARACTER FORMULAS FOR MAXIMUM AUTHENTICITY

### The Three Consistency Problems (from EjTrPcPOUwA — THE ECOM KING)

The three biggest AI tells in UGC ads — and their fixes:

| Problem | Cause | Fix |
|---------|-------|-----|
| Product changes shape/color | No product anchor | Describe product with color+shape+unique feature in EVERY clip |
| Character face drifts | Inconsistent description | Copy-paste IDENTICAL character description to every clip |
| Plastic/perfect skin | Generic character prompt | Add "natural imperfections", "slight tired eyes", "real skin texture" |

### Character Description Formula

```
[Gender], [exact age range e.g. "24-26"], [hair color + style],
[skin tone — specific], [eye color], [clothing — specific item + color],
[one distinguishing feature], [energy — e.g. "genuine tired morning look"]
```

**Example (good):**
```
Young woman, 24-26, dark brown shoulder-length hair, medium olive skin tone,
brown eyes, wearing a light grey oversized hoodie, small gold hoop earrings,
natural no-makeup look, genuine relaxed energy.
```

**Never use:** "attractive", "beautiful", "model-like" → triggers fake-perfect AI look
**Always use:** Specific age ranges, specific clothing colors, relatable imperfections

### Character Types by Product Category

| Product | Character | Setting | Energy |
|---------|-----------|---------|--------|
| Skincare/Beauty | Woman 22-30, natural look | Bathroom mirror, morning | Genuine surprise |
| Fitness/Supplements | Man/woman 25-35, athletic | Gym parking lot, car | Energetic but real |
| Tech/Gadgets | Man 25-40, casual | Home office, couch | Curious, impressed |
| Food/Beverage | Any 20-35 | Kitchen, outdoor cafe | Pleasure, satisfaction |
| Clothing/Fashion | Matches target demo | Bedroom, street | Confident, casual |
| SaaS/Software | Professional 28-45 | Home office, desk | Relieved, productive |
| Home Products | Parent/homeowner 28-45 | Living room, kitchen | Practical satisfaction |

---

## SECTION 4: SETTING & ENVIRONMENT FORMULAS

### The "Relatable Mess" Principle (from faDr6Gc8XlQ — taysthetic)

Add controlled imperfection to backgrounds:
- Unmade bed in background → real bedroom
- Coffee cup on desk → real home office
- Slightly cluttered counter → someone actually lives there
- Natural window light (not studio) → removes "AI glow"

### Setting Specificity Rule

**Bad:** `"standing in a bedroom"`

**Good:** `"standing in front of a white subway tile kitchen backsplash, stainless steel fridge visible on left, morning light from window on right"`

Always include **2 specific background details** + **lighting type**.

### What Kills Authenticity

- Pure white/grey studio backgrounds → screams AI
- Perfect symmetrical rooms → no one's home looks like that
- Outdoor scenes with too-perfect lighting → AI glow obvious
- Generic "modern apartment" → every AI ad looks the same

---

## SECTION 5: DIALOGUE & SPEECH PATTERNS

### Script Writing Rules for Veo3

**DO:**
- Use contractions: "I've been using this" not "I have been using this"
- Use filler words sparingly: "honestly", "actually", "like"
- Keep sentences under **15 words each**
- Add natural pauses with commas: "I've been using this for two weeks, and honestly..."
- Write numbers as words: "two hundred dollars" not "$200"
- Use first-person testimonial: "I tried it, I noticed, I felt"

**DON'T:**
- Use buzzwords: "revolutionary", "cutting-edge", "game-changing"
- Use complex multi-clause sentences
- Write numbers as digits ($200, 3x, etc.)
- Use ALL CAPS for emphasis (confuses speech synthesis)
- Include stage directions in dialogue

### The 3-Part UGC Script Formula

```
HOOK   (0-3s):   [Pain point or curiosity gap — 1 sentence, max 15 words]
BRIDGE (3-12s):  [Personal story + product — 2-3 sentences]
CTA    (12-15s): [Result + soft action — 1 sentence]
```

**15-second example:**
```
"I was spending two hundred dollars a month on skincare that wasn't doing anything.
Then I tried this. Two weeks in, my skin is actually clear for the first time in years.
Link in bio if you want to try it — they have a free trial right now."
```

---

## SECTION 6: ZERO ARTIFACT CHECKLIST

### Root Causes & Fixes

| Artifact | Cause | Fix |
|----------|-------|-----|
| Product changes shape | No product anchor | Describe product with color+shape+unique feature in EVERY clip |
| Character face drifts | Inconsistent description | Copy-paste IDENTICAL character description to every clip |
| Plastic/perfect skin | Generic character prompt | Add "natural imperfections", "slight tired eyes" |
| AI glow lighting | Default studio lighting | Add "natural window light, slight shadows, not studio-lit" |
| Robotic eye contact | No movement descriptors | Add "occasionally glances at product, natural head movement, blinks naturally" |
| Background changes | Vague setting | Add 2+ specific background details, lock them across clips |
| Mouth not moving | No `Says:` syntax | Always use `Says: "dialogue"` format |
| Unnatural speech | Long sentences / digits | Max 15 words/sentence, write numbers as words |
| Speaking pauses | Line too long | Split at natural comma/period, max 20 words per clip |
| Wrong accent/voice | No voice profile | Inject voice profile string into every clip prompt |

### Pre-Generation Checklist (run before every submission)

- [ ] Character description identical across all clips (copy-paste)
- [ ] Product described with color + shape + one unique feature
- [ ] Setting has 2+ specific background details
- [ ] Dialogue uses `Says:` colon syntax
- [ ] All sentences under 15 words
- [ ] No marketing buzzwords in dialogue
- [ ] Numbers written as words
- [ ] Camera setup specified (medium close-up, 9:16, handheld)
- [ ] Audio notes included (no background music)
- [ ] `(no subtitles)` in style notes
- [ ] "natural window light" or specific lighting type specified
- [ ] Voice profile string injected

---

## SECTION 7: AD STRUCTURE FRAMEWORKS

### 15-Second Hook Ad (TikTok/Reels cold traffic)

```
Clip 1 (0-3s):   HOOK — Pain point. No product yet.
Clip 2 (3-10s):  STORY — Personal experience + product + one result.
Clip 3 (10-15s): CTA — "Link in bio" or "Free trial."
```

### 30-Second Problem-Solution Ad (Facebook cold traffic)

```
Clip 1 (0-3s):   HOOK — Bold claim or pain point
Clip 2 (3-8s):   AGITATE — Make problem feel worse / relatable
Clip 3 (8-18s):  SOLUTION — Product + key benefit
Clip 4 (18-25s): PROOF — "I've been using it 2 weeks" / specific result
Clip 5 (25-30s): CTA — Direct action
```

### 45-60s Full-Funnel Awareness Ad (retargeting / warm traffic)

```
Segment 1 (0-12s):  HOOK & MIRROR — Reflect their exact situation
Segment 2 (12-18s): NAME THE ENEMY — What causes their problem (not the product)
Segment 3 (18-30s): MECHANISM — How the solution works (introduce product)
Segment 4 (30-42s): PROOF — Specific results, before/after feel
Segment 5 (42-60s): CTA — Variant based on awareness level
```

### CTA Variants by Awareness Level

| Audience | CTA Style | Example |
|----------|-----------|---------|
| Unaware | Soft / curiosity | "Follow for more, link in bio" |
| Problem-aware | Challenge | "Try it for 30 days — link in bio" |
| Solution-aware | Direct | "Get yours now — free shipping today" |
| Product-aware | Urgency | "Sale ends tonight — link in bio" |

---

## SECTION 8: MOTION CLONING WINNING ADS

> Source: taysthetic (faDr6Gc8XlQ) — $130K from one AI ad in Q4, 86¢ CPC, 2.17x ROAS

### The Motion Cloning Method

1. Find a winning competitor ad (Minea, AdSpy, TikTok Creative Center)
2. Filter: high engagement, your niche, UGC style
3. Extract the **motion pattern** (not content): selfie walk, product reveal, reaction shot
4. Recreate same motion with your product + character
5. Change: character, product, background, dialogue
6. Keep: camera movement, pacing, shot composition

### Best Motion Patterns for UGC

1. **Selfie Walk** — walks toward camera while talking. Creates energy and forward momentum.
2. **Product Reveal** — product enters frame mid-sentence. Creates curiosity.
3. **Reaction Shot** — reacts to using product for first time. Creates authenticity.
4. **Before/After Cut** — two clips: problem then result. Simple, proven.
5. **Unboxing** — opens package, reacts. Creates excitement.

---

## SECTION 9: ECOMMERCE vs SOFTWARE AD DIFFERENCES

### Ecommerce Physical Products

- Show product being held/used in first 3 seconds
- Emotional benefit over functional feature ("I feel confident" vs "UV protection")
- Lifestyle setting matching buyer aspiration
- Specific result with timeframe: "In two weeks..." / "After 30 days..."

**Prompt addition:**
```
character holds [product] naturally, product clearly visible,
[product color/shape] in character's hand
```

### Software / SaaS Products

- Lead with time/money saved: "I used to spend 3 hours on this. Now 5 minutes."
- Show relief/frustration-removal, not features
- Professional but relatable (home office, not corporate)
- 30-60 second sweet spot (needs more explanation)

**Prompt addition:**
```
character at home office desk, laptop visible in background,
relaxed professional energy, not corporate, natural lighting
```

### Script Tone Differences

| Ecommerce | SaaS/Software |
|-----------|---------------|
| Emotional, sensory | Logical, efficiency |
| "I feel amazing" | "I saved 3 hours this week" |
| "It actually works" | "It actually does what it says" |
| Lifestyle aspiration | Problem elimination |
| 15-30s sweet spot | 30-60s sweet spot |

---

## SECTION 10: MODEL COMPARISON

> Source: Nate Herk (AYsg5gAMWyo) — ran Veo3.1, Nano Banana+Veo3.1, Sora 2 on same prompts

| Model | Speech | Character Consistency | Product Handling | Best For |
|-------|--------|----------------------|-----------------|---------|
| **Veo 3.1** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | Native speech UGC |
| **Nano Banana + Veo 3.1** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Product-holding UGC |
| **Sora 2** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | Cinematic B-roll |
| **Kling 2.6** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Motion consistency |

**Key finding:** Nano Banana (Imagen 4) for character image + Veo 3.1 for video = best product consistency.
The character image acts as a visual anchor for video generation.

**Our pipeline implementation:** `before.png` from Imagen 4 → GPT-4o vision extracts locked character desc
→ uploaded to fal.ai storage → used as `first_frame_url` for clip 1 → locked desc injected into all clips.

---

## SECTION 11: PROGRAMMATIC CREATIVE TESTING

> Source: Steph France (HIiLt3Kb1kQ) — system used to scale client ad accounts

### Variable Matrix

Every ad breaks into independent testable variables:

```
├── Hook formula (5 types above)
├── USP angle (pain relief / aspiration / social proof / curiosity)
├── Character type (age, gender, energy)
├── Setting (bedroom / kitchen / outdoor / office)
├── Script length (15s / 30s / 60s)
└── CTA variant (soft / direct / urgency)
```

**Rule: Test one variable at a time.**

### Test Batch Sizes

- **Minimum:** 5 ads (statistical signal)
- **Recommended:** 10 ads — 2 per hook formula
- **Scale batch:** 20 ads — all variables

### Test Priority Order

1. Hook formula (biggest CTR impact)
2. Script length (watch time + conversion)
3. Character type (audience identification)
4. Setting (authenticity perception)
5. CTA (only matters after hook/story work)

### Early Signal Metrics (48-72 hours)

| Metric | Kill | Scale |
|--------|------|-------|
| Hook rate (3s view %) | < 25% | > 40% |
| CTR (link) | < 0.8% | > 2% |
| CPM | > $25 | < $15 |
| Watch time | < 30% | > 50% |

---

## SECTION 12: COPY-PASTE PROMPT TEMPLATES

### Template A: Skincare/Beauty (15s, 3 clips)

```
CLIP 1 — HOOK:
Young woman, 23-27, light brown hair in loose bun, fair skin with natural freckles,
wearing a white oversized t-shirt, no makeup, genuine tired morning look.
Bathroom, morning light from window, white subway tile background, small plant on shelf.
Medium close-up, slight handheld movement, 9:16 vertical.
Looks at camera, tired but genuine expression.
Says: "My skin was breaking out every single week. I tried everything."
Natural bathroom ambience, no music. (no subtitles), authentic UGC, iPhone-quality.

CLIP 2 — SOLUTION: [SAME CHARACTER + SETTING DESCRIPTION — copy-paste exactly]
Holds product up at chest height, looks at it then back at camera.
Says: "Then I tried this for two weeks and honestly I don't even know what changed but it just stopped."
Natural bathroom ambience, no music. (no subtitles), authentic UGC.

CLIP 3 — CTA: [SAME CHARACTER + SETTING DESCRIPTION — copy-paste exactly]
Slight smile, relaxed energy.
Says: "Link in bio if you want to try it. They have a free trial right now."
Natural bathroom ambience, no music. (no subtitles), authentic UGC.
```

### Template B: Fitness/Supplement (15s, 3 clips)

```
CLIP 1 — HOOK:
Young man, 25-30, short dark hair, medium athletic build, medium skin tone,
wearing a plain navy t-shirt, slightly sweaty from workout.
Gym parking lot, sitting in car driver seat, gym bag on passenger seat, afternoon light.
Selfie angle, medium close-up, slight handheld shake, 9:16 vertical.
Says: "I was skeptical about creatine gummies. I thought they were just a gimmick."
Faint parking lot ambience, no music. (no subtitles), authentic UGC.

CLIP 2 — SOLUTION: [SAME CHARACTER + SETTING — copy-paste exactly]
Holds product in one hand, looks at camera.
Says: "But these actually taste good and I actually remember to take them every day."
Faint parking lot ambience, no music. (no subtitles), authentic UGC.

CLIP 3 — RESULT + CTA: [SAME CHARACTER + SETTING — copy-paste exactly]
Relaxed confident energy.
Says: "My workouts have been way better this month. Link in bio."
Faint parking lot ambience, no music. (no subtitles), authentic UGC.
```

### Template C: SaaS/Software (30s, 4 clips)

```
CLIP 1 — HOOK:
Professional woman, 30-38, dark shoulder-length hair, medium skin tone,
business casual top, home office desk, laptop open behind her, morning light.
Medium close-up, slight handheld, 9:16 vertical.
Says: "I was spending three hours every week just on reporting. Three hours. Every week."
Quiet home office ambience, no music. (no subtitles), authentic UGC.

CLIP 2 — AGITATE: [SAME CHARACTER + SETTING — copy-paste exactly]
Slightly frustrated expression.
Says: "I tried spreadsheets, I tried other tools. Nothing actually saved me time."
Quiet home office ambience, no music. (no subtitles), authentic UGC.

CLIP 3 — SOLUTION: [SAME CHARACTER + SETTING — copy-paste exactly]
Relieved, genuine expression.
Says: "Someone in my Slack sent me this tool and I set it up in ten minutes. Now it just runs automatically."
Quiet home office ambience, no music. (no subtitles), authentic UGC.

CLIP 4 — CTA: [SAME CHARACTER + SETTING — copy-paste exactly]
Calm, direct.
Says: "Free trial link in bio. No credit card needed. I don't know why I waited so long."
Quiet home office ambience, no music. (no subtitles), authentic UGC.
```

### Template D: Ecommerce Gift Product (15s, 3 clips)

```
CLIP 1 — HOOK:
Young woman, 22-26, long dark hair, warm olive skin, wearing a cream knit sweater,
natural makeup, genuine happy expression.
Bedroom, sitting on bed, soft warm lamp light, neutral bedding slightly rumpled.
Medium close-up, slight handheld, 9:16 vertical.
Says: "I thought it was just flowers at first."
Quiet bedroom ambience, no music. (no subtitles), authentic UGC.

CLIP 2 — REVEAL: [SAME CHARACTER + SETTING — copy-paste exactly]
Holds product up toward camera, genuine delight — not over-the-top.
Says: "But then I realized it's actually a rose teddy and it's so much more thoughtful."
Quiet bedroom ambience, no music. (no subtitles), authentic UGC.

CLIP 3 — BENEFIT + CTA: [SAME CHARACTER + SETTING — copy-paste exactly]
Smiles warmly at product.
Says: "It doesn't die after a few days like normal flowers do. Link in bio."
Quiet bedroom ambience, no music. (no subtitles), authentic UGC.
```

---

## SECTION 13: THE 90% WIN RATE PROCESS

### Why Most AI UGC Ads Fail (ranked by frequency)

1. **Weak hook** (40%) — generic pain point, no specificity
2. **AI artifacts** (25%) — product inconsistency, plastic skin, robotic movement
3. **Unnatural dialogue** (20%) — sounds scripted, marketing language
4. **Wrong character** (10%) — viewer can't identify with them
5. **Weak CTA** (5%) — vague or missing

### Step-by-Step Process

```
STEP 1: RESEARCH (30 min)
  → Find 3 winning competitor ads in your niche
  → Identify which of the 5 hook formulas they use
  → Note: character type, setting, script length, CTA style

STEP 2: SCRIPT (20 min)
  → Write 5 hook variations (one per formula)
  → Keep hook line under 15 words
  → Write full script for each (15s or 30s)
  → Review: no buzzwords, all sentences <15 words, numbers as words

STEP 3: PROMPT BUILD (20 min)
  → Write character description — LOCK IT (use identical for all clips)
  → Write setting description — LOCK IT (use identical for all clips)
  → Build per-clip prompts using architecture above
  → Run pre-generation checklist

STEP 4: GENERATE
  → Generate all clips
  → Immediate reject: plastic skin, product wrong, mouth not moving
  → Regenerate with adjusted prompts

STEP 5: QUALITY GATE
  → AI gate: anomaly <4/10, authenticity >7/10, coherence >7/10
  → Human review: does it feel like a real person?
  → Whisper check: >75% word match to script

STEP 6: TEST (48-72 hours)
  → Launch minimum 5 ads
  → Kill at 48h: hook rate <25% or CTR <0.8%
  → Scale at 72h: hook rate >40% and CTR >2%
```

---

*Per-video analysis: [per-video/](per-video/)*
*Strategy: [STRATEGY.md](STRATEGY.md)*
*PRD: [PRD.md](PRD.md)*
