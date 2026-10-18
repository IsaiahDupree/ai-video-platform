# UGC Ad Script Generation — Consolidated Frameworks

> All frameworks used as the basis for AI-generated video ad scripts in the pipeline.
> Sources: AD_CREATIVE_FRAMEWORK.md, deep-research-reports (1–3), useclip.com, chromaticlabs.co, TikTok Creative Codes, Google Veo3 prompt guide.

---

## 1. Master Organizing Principle: Eugene Schwartz Awareness Ladder

Every script is written for a specific awareness stage. The stage determines **what to say, what NOT to say, and what CTA to use**.

| Stage | What viewer knows | Script goal | Product mention | CTA style |
|-------|------------------|-------------|-----------------|-----------|
| **Unaware** | Nothing — doesn't know they have a problem | Make pain visible, create "that's me" moment | Never | Soft curiosity ("try this") |
| **Problem-Aware** | Knows the pain, not the solution | Validate + agitate pain, reframe as solvable | Never by name | Educational ("here's why") |
| **Solution-Aware** | Knows solutions exist, evaluating | Show mechanism, differentiate | Category only | Comparison ("see how it works") |
| **Product-Aware** | Knows your product, hasn't bought | Features → outcomes, handle objections | By name, show UI | Direct ("start free trial") |
| **Most-Aware** | Knows product, needs final push | Objection killers, urgency, social proof | By name + offer | Hard ("use code X by Friday") |

---

## 2. Structural Frameworks (per awareness stage)

### Stage 1–2 (Unaware / Problem-Aware): PAS — Problem → Agitate → Solution

Name the pain precisely. Make it feel viscerally real. Then introduce relief.

```
HOOK:     Name the problem in one line (qualify the viewer)
AGITATE:  Make it feel personal — "you know that feeling when..."
SOLUTION: Introduce relief naturally — "but then I found..."
PROOF:    One specific, believable result
CTA:      Soft — "link in bio" / "try this"
```

### Stage 3 (Solution-Aware): AIDA — Attention → Interest → Desire → Action

Move the viewer from concept → mechanism → action cleanly.

```
HOOK:     Attention grab — curiosity or bold claim
INTEREST: How it works (mechanism, not features)
DESIRE:   What life looks like after (transformation)
ACTION:   Clear next step
```

### Stage 4 (Product-Aware): 3 Features → 1 Outcome

```
HOOK:     "Three reasons I use [product]"
FEATURE:  Feature 1 + Feature 2 + Feature 3 (rapid fire)
OUTCOME:  One clear transformation that combines all three
CTA:      Direct — "start free trial" / "shop now"
```

### Stage 5 (Most-Aware): 4Cs Filter — Clear, Concise, Compelling, Credible

Every sentence must pass all four. These are objection killers.

```
HOOK:     Address the #1 objection head-on
PROOF:    Specific credibility signal (number, timeframe, guarantee)
URGENCY:  Truthful scarcity or deadline
CTA:      Hardest possible — "use code X" / "offer ends Friday"
```

---

## 3. Universal Ad Skeleton (6-Beat)

Derived from Meta Reels best practices + direct response principles. Applied to every 15–30s script regardless of platform.

```
1. HOOK        (0–2s)  — Pattern interrupt. Qualify the viewer in one line.
2. MIRROR      (2–5s)  — Make viewer feel seen. "You know that feeling when..."
3. NAME ENEMY  (5–8s)  — Name the real cause (not the symptom). "The problem isn't X, it's Y."
4. MECHANISM   (8–12s) — How the solution works. One sentence, not a feature list.
5. PROOF       (12–16s)— One specific, believable result with a timeframe.
6. CTA         (16–18s)— One action step. One urgency cue (if truthful).
```

**For 5-line scripts (our pipeline)**, compress Mirror + Enemy into one line:

```
Line 1 — HOOK:      Pattern interrupt, qualify viewer
Line 2 — MIRROR+ENEMY: Make viewer feel seen + name the real cause
Line 3 — MECHANISM: How it works, naturally introduced (not salesy)
Line 4 — PROOF:     Specific result + timeframe
Line 5 — CTA:       Clear next step
```

---

## 4. Quality Gates

### FATE — Familiarity → Authority → Trust → Emotion

Applied to every script **before publishing** (not a structure, but a checklist):

- **F — Familiarity**: Does the viewer recognize themselves in the first 2 seconds?
- **A — Authority**: Is there a reason to believe this person/brand knows what they're talking about?
- **T — Trust**: Is there proof? (Specific result, timeframe, social proof, guarantee)
- **E — Emotion**: Does the script make the viewer *feel* something? (Relief, curiosity, FOMO, hope)

A script that scores 0 on any of these will underperform.

### 4Cs — Clear, Concise, Compelling, Credible

Final filter for Most-Aware scripts (objection killers):

- **Clear**: Can a stranger understand it in one pass?
- **Concise**: Can any word be cut without losing meaning?
- **Compelling**: Would YOU stop scrolling for this?
- **Credible**: Would a skeptic believe it?

---

## 5. Hook Formula System

### 5 Proven Hook Patterns (implemented in `prompt-builder.ts`)

| Formula | Pattern | Best for | Source |
|---------|---------|----------|--------|
| `problem_solution` | "if you struggle with X, try this." | Cold audiences, unaware | PAS + useclip.com |
| `testimonial` | "i didn't expect this to work, but i'm actually shocked." | Trust building, skeptics | Buyer Objection (chromaticlabs) |
| `social_proof` | "fifty thousand people tried this and the results are insane." | FOMO, credibility | Social Proof (chromaticlabs) |
| `founder_story` | "i built this because i was tired of X." | Authenticity, mission-driven | Founder-Style UGC (useclip) |
| `curiosity_gap` | "here's what no one tells you about X." | Authority, intrigue | Curiosity (chromaticlabs) |

### Additional Hook Patterns (from research, available as variations)

| Pattern | Example | Best for |
|---------|---------|----------|
| Before/After | "here's my workflow before... and after." | Visual transformation |
| Objection Handler | "i thought this was too expensive... but actually..." | Retargeting |
| Listicle | "three things I noticed after using this." | Education, retention |
| Confession | "i was doing this wrong the whole time." | Authenticity |
| Enemy | "stop using X, use this instead." | Competitive positioning |

---

## 6. Organic Winner Patterns

Derived from actual post performance data. These shaped the tone and caption system:

1. **Relief first** — Lead with the feeling of relief, not the problem
2. **Hidden rule** — Reveal something most people don't know
3. **3 tiny steps** — Break the solution into 3 absurdly simple steps
4. **One copy-paste line** — Give the viewer one thing they can use immediately
5. **Philosophy thesis** — End with a larger truth that makes them save/share

---

## 7. Veo3 / Kling Prompt Formula

For the video generation prompts (not the script), use this 5-part structure:

```
[Cinematography] + [Subject] + [Action] + [Context] + [Style & Ambiance]
```

Example:
```
Handheld selfie video (CINEMATOGRAPHY), a tired office worker (SUBJECT)
holds up phone showing unread messages and says "if your inbox looks
like this, do this" (ACTION), in a small home office with natural window
light (CONTEXT), authentic UGC vibe, slight camera shake, crisp audio,
no subtitles (STYLE).
```

### Timestamp Prompting (for multi-beat clips)
```
[00:00-00:02] Hook — close-up, facial expression, one line
[00:02-00:06] Demo — over-shoulder phone view, product in action
[00:06-00:08] CTA — back to selfie, confident, direct instruction
```

---

## 8. Platform-Specific Rules

### All Platforms
- Hook in first 3 seconds (TikTok Creative Codes)
- Proposition stated by 6 seconds
- Sound ON (required for TikTok, recommended for Shorts)
- Captions/overlays for clarity
- Strong CTA at end

### TikTok
- 9:16 vertical, DIY aesthetic, feature people
- Spark Ads: engagement accrues to organic post
- Avoid: misleading claims, medical promises, fake UI

### YouTube Shorts
- <60s recommended, sound-on for conversion lift
- Remarketing lists for retargeting
- Views counted differently than TikTok

### Instagram Reels
- 9:16, safe zones (14% top, 35% bottom, 6% sides)
- Short attention windows, story-led

---

## 9. Implementation Map

| Awareness Stage | Script Structure | Hook Formula | FATE Focus | CTA Style |
|----------------|-----------------|--------------|------------|-----------|
| Unaware | PAS | problem_solution, curiosity_gap | F + E | Soft |
| Problem-Aware | PAS | problem_solution, testimonial | F + E | Educational |
| Solution-Aware | AIDA | founder_story, social_proof | A + T | Comparison |
| Product-Aware | 3 Features → 1 Outcome | testimonial, social_proof | T + A | Direct |
| Most-Aware | 4Cs Objection Killer | social_proof, testimonial | T + E | Hard |

---

## 10. Script Quality Rules (enforced in system prompt)

1. Write like a real person talking to a friend, not an ad
2. Each line must be a complete thought that makes grammatical sense alone
3. Use "you" and "I" — never "people" or "they"
4. Lowercase throughout, commas for breathing pauses
5. Max 12 words per line
6. No buzzwords: revolutionary, cutting-edge, game-changing, innovative, seamless
7. Numbers as words (fifty thousand, not 50,000)
8. Lines must flow as a conversation — each follows logically from the last
9. Tell a mini-story: problem → discovery → result → action
10. One pain. One shift. One result. (Don't cram everything into one script)

---

## Files

- `scripts/pipeline/prompt-builder.ts` — Hook formulas, pain extraction, script validation
- `scripts/pipeline/ai-inputs.ts` — System prompt, GPT-4o generation
- `scripts/pipeline/test-hooks.ts` — Quick script quality test (no video gen)
- `offers/everreach-business.json` — Business offer with awareness stages + audience categories
- `offers/everreach.json` — Consumer offer
