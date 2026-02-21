# Veo3 UGC Ad Creation & Testing Strategy

> Comprehensive strategy for creating winning UGC ads at scale with 90%+ success rate.
> Based on analysis of 11 expert videos + 500+ ad test data from Alfie Carter.

---

## PHASE 1: RESEARCH & BRIEF (30 min per product)

### Step 1: Competitor Ad Research

1. **TikTok Creative Center** → search your product category → filter by top performing (30+ days)
2. **Meta Ad Library** → search competitor brand names → filter by active ads, sort by run time
3. **Minea or AdSpy** → filter by: your niche, UGC style, high engagement, last 30 days
4. Save 5-10 winning ads. For each, note:
   - Which of the 5 hook formulas is used?
   - Character type (age, gender, energy)
   - Setting (location, lighting)
   - Script length (15s / 30s / 60s)
   - CTA style (soft / direct / urgency)
   - Motion pattern (selfie walk / product reveal / reaction shot)

### Step 2: Audience Research

Answer these 4 questions before writing any script:
1. **What is the #1 pain they have right now?** (not the product benefit — the raw pain)
2. **What have they already tried that didn't work?** (acknowledge this in the script)
3. **What does success look like to them?** (specific, sensory, emotional)
4. **What would make them skeptical?** (address this directly)

### Step 3: Brief Template

```
Product: [name]
Category: [ecommerce / SaaS / service]
Target: [age range, gender, key interest/pain]
Primary pain: [one sentence — their words, not marketing language]
Primary benefit: [one sentence — outcome, not feature]
Proof point: [specific result, timeframe, or number]
CTA: [what action, what offer]
Awareness level: [unaware / problem-aware / solution-aware / product-aware]
Winning hook formula to test first: [Hook #1-5]
```

---

## PHASE 2: SCRIPT WRITING

### The 5-Hook Batch Method

For every product, write **5 hooks** — one per formula:

```
Hook 1 (Pain + Literally): "My [problem] was [bad]. [Product] literally saved me."
Hook 2 (Never Tried):      "I've never tried [product] before. Believe it or not."
Hook 3 (POV):              "POV: You just discovered [solution to their pain]"
Hook 4 (Stop Scrolling):   "Stop scrolling if you [have this exact problem]"
Hook 5 (Social Proof):     "[Number] people [did thing] and [specific result]"
```

Pick the 2-3 strongest for your specific product/audience. Test all 5 in your first batch.

### Script Length Guidelines

| Platform | Length | Word count | Clips |
|----------|--------|------------|-------|
| TikTok/Reels cold | 15s | 30-45 words | 2-3 |
| Facebook cold | 30s | 60-90 words | 4-5 |
| Retargeting | 45-60s | 100-150 words | 6-8 |

### Script Review Checklist

Before finalizing any script:
- [ ] Hook is under 15 words
- [ ] No sentence over 15 words
- [ ] No buzzwords: revolutionary, cutting-edge, game-changing, innovative
- [ ] Numbers written as words (two hundred, not $200)
- [ ] Contractions used throughout (I've, it's, you're)
- [ ] First-person throughout (I tried, I noticed, I felt)
- [ ] CTA is specific (not just "check it out")
- [ ] Read aloud — does it sound like a real person talking?

---

## PHASE 3: PROMPT BUILDING

### Character Lock Protocol

1. Write ONE character description
2. Copy-paste it **identically** into every clip prompt
3. Never paraphrase or vary it — exact same words = same face

```
[Gender], [exact age range], [hair color + style], [skin tone],
[eye color], [clothing — specific color + item], [one distinguishing feature],
[energy — specific, not generic]
```

### Setting Lock Protocol

1. Write ONE setting description with 2+ specific background details
2. Copy-paste it **identically** into every clip prompt

```
[Location], [specific background detail 1], [specific background detail 2],
[lighting type — natural, not studio]
```

### Prompt Build Order

1. Write character description → lock it
2. Write setting description → lock it
3. Write voice profile → lock it
4. For each clip: paste locked char + setting + voice, then add clip-specific action + dialogue
5. Run pre-generation checklist on all clips before submitting

---

## PHASE 4: GENERATION & QUALITY GATE

### Generation Settings (fal.ai Veo 3.1)

```
endpoint: fal-ai/veo3.1 (text-to-video)
          fal-ai/veo3.1/first-last-frame-to-video (clip 1 with reference image)
duration: 8s
resolution: 720p
generate_audio: true
aspect_ratio: 9:16
```

### Immediate Reject Criteria (regenerate immediately)

- Mouth not moving / no speech audio
- Product wrong color, shape, or missing
- Character face clearly different from clip 1
- Plastic/perfect skin (AI glow)
- Background completely different from other clips
- Subtitles baked into video

### Quality Gate Scores (GPT-4o vision assessment)

| Dimension | Kill (<) | Pass (>) |
|-----------|----------|----------|
| AI anomaly score | 4/10 | — |
| Authenticity | — | 7/10 |
| Character coherence | — | 7/10 |
| Script completion | — | 75% word match |

### Whisper Verification

Every clip is transcribed via Whisper API and compared to expected script.
- < 75% word overlap → auto-retry with shorter line split
- > 75% → pass

---

## PHASE 5: TESTING FRAMEWORK

### Batch Structure

**Batch 1 — Hook Test (10 ads)**
- 2 ads per hook formula (same product, same character, same setting)
- Variable: hook formula only
- Budget: $5-10/day per ad for 48-72 hours
- Decision: which 2 hooks win → carry forward

**Batch 2 — Script Length Test (6 ads)**
- 2 ads per length (15s / 30s / 60s) using winning hook
- Variable: script length only
- Decision: which length wins → carry forward

**Batch 3 — Character Test (4 ads)**
- 2 character types using winning hook + length
- Variable: character (age, gender, energy)
- Decision: which character wins → carry forward

**Batch 4 — Scale Test (20 ads)**
- All variables combined with winners from Batches 1-3
- Budget: $20-50/day per ad
- Decision: kill < 1% CTR, scale > 2% CTR

### Early Signal Metrics (48-72 hours)

| Metric | Kill | Watch | Scale |
|--------|------|-------|-------|
| Hook rate (3s view %) | < 25% | 25-40% | > 40% |
| CTR (link) | < 0.8% | 0.8-2% | > 2% |
| CPM | > $25 | $15-25 | < $15 |
| Watch time | < 30% | 30-50% | > 50% |
| CPC | > $2.50 | $1-2.50 | < $1 |

### Scaling Rules

- **Kill:** Any ad below kill threshold at 48 hours
- **Watch:** Any ad in watch range — extend to 72 hours before deciding
- **Scale:** Any ad above scale threshold — double budget every 48 hours until CPM rises
- **Clone:** Take winning ad → change one variable → test clone batch

---

## PHASE 6: ITERATION & LEARNING

### What to Do When an Ad Wins

1. Identify which element drove the win (hook? character? setting?)
2. Create 3-5 variations changing only that element
3. Test variations against the winner
4. Build a "winning formula" doc for that product/niche

### What to Do When Nothing Wins

1. Check hook rate first — if < 25%, the hook is the problem
2. If hook rate > 25% but CTR < 0.8%, the story/bridge is the problem
3. If CTR > 0.8% but no conversions, the landing page is the problem
4. Never change more than one variable at a time

### Cross-Niche Learnings

After 10+ winning ads, look for patterns:
- Which hook formula wins most often in your niche?
- Which character type gets highest hook rate?
- Which script length gets highest watch time?
- Which setting gets highest authenticity scores?

Document these in `output/pipeline/learnings.json` for the smart-generate system.

---

## APPENDIX: PLATFORM-SPECIFIC NOTES

### TikTok / Reels

- Hook must land in first 1.5 seconds (not 3)
- Vertical 9:16 only
- Captions required (80% watch without sound)
- Trending audio can boost organic reach (not for paid)
- 15s performs better than 30s for cold traffic

### Facebook / Instagram Feed

- 30s sweet spot for cold traffic
- Square 1:1 also works for feed
- First frame matters most (thumbnail)
- Longer ads (60s) work for retargeting warm audiences
- Captions required

### YouTube Shorts

- 60s max
- Hook in first 2 seconds
- Vertical 9:16 only
- End screen CTA important

---

*Master Learnings: [MASTER_LEARNINGS.md](MASTER_LEARNINGS.md)*
*PRD: [PRD.md](PRD.md)*
