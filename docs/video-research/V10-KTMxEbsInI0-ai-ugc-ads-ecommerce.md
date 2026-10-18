# Video Analysis: AI UGC Ads for E-commerce (Awareness Stages + Static Ad System)

**URL:** https://www.youtube.com/watch?v=KTMxEbsInI0  
**Topic:** Systematic ad creation using awareness stages, hooks, and static ads for e-commerce  
**Tools:** Google Sheets + Make.com + Claude/ChatGPT + Facebook Ads  
**Product Type:** Beauty/Skincare (general e-commerce)

---

## Core Framework: Structured Ad Creation

### The Key Insight
> "One of the biggest problems is that a lot of marketing agencies don't have a structured way to think of ads. It's more creative. But I like systems. If you start thinking of ads as something that is not chaos, it's logical."

### The 4 Testing Parameters
Testing is about finding the right **combination** of:
1. **USP** (Unique Selling Proposition) — which specific benefit to highlight
2. **Marketing Angle** — the lens/context for that benefit  
3. **Messaging Framework** — PAS, AIDA, testimonial, listicle, etc.
4. **Awareness Level** — where the customer is in their journey

---

## Awareness Level Framework (Eugene Schwartz Applied)

### Why Awareness Level Changes Everything
The same product needs completely different language depending on awareness:

| Level | Customer State | Language Style | What NOT to Do |
|-------|---------------|----------------|----------------|
| Unaware | Doesn't know problem exists | Life observation, relatable story | Don't mention product |
| Problem Aware | Knows pain, no solution | Validate pain, reframe cause | Don't pitch solution yet |
| Solution Aware | Knows solutions exist | Show mechanism, differentiate | Don't assume they know your product |
| Product Aware | Knows your product | Features → outcomes, objections | Don't be vague |
| Most Aware | Ready to buy | Proof, urgency, risk reversal | Don't over-explain |

---

## The Hook Generation System

### Hook Formula
```
[Awareness Level] + [USP] + [Marketing Angle] + [Framework] = Hook
```

### Example Hooks (Beauty Product)
- **Short (6 words):** "Shaky hand, steady glow."
- **Long (full hook):** "No mirror, no problem. Miracle Bomb makes mistakes impossible and glow inevitable."

### Hook Testing Volume
- Generate 10–20 hooks per USP/angle combination
- Apply each hook to 2 image templates
- Result: 20–40 ad variations per batch
- Let Facebook algorithm select winners

---

## Static Ads as Primary Testing Vehicle

### Why Static Ads First
> "The best way to test a lot of ads at scale is to use static ads. Video ads are more complicated to produce and static ads work really well."

### Static Ad Structure
```
HOOK TEXT:    [Bold, large — the hook line]
VISUAL:       [Product image or lifestyle image]
SUBTEXT:      [Supporting benefit or social proof]
CTA BUTTON:   [Single action]
```

### Template System
- Create 2–3 image templates (different layouts/styles)
- Apply hooks to templates programmatically
- Each hook × each template = one ad variation
- 10 hooks × 2 templates = 20 ads in minutes

---

## The Iteration Loop

### Phase 1: Broad Testing
1. Generate 100 ads (hooks × templates × awareness levels)
2. Push all into one Facebook ad set
3. Let algorithm run for 7–14 days
4. Identify 1–2 winners

### Phase 2: Winner Iteration
1. Take winning angle → generate new hooks with same angle
2. New images + same hooks
3. Different messaging frameworks + same angle
4. Scale winners, kill losers

### Phase 3: Long-Form Expansion
For winning hooks, create full VSSL/long-form script:
- Use winning hook as opening
- Expand with full PAS or AIDA structure
- Add B-roll via Icon tool
- Create voice-over with AI
- Push as video ad

---

## The VSSL Script Generator Parameters

When generating long-form scripts from winning hooks:

```
USP:                    [The winning unique selling proposition]
Marketing Angle:        [The winning angle]
Original Hook:          [The exact hook that performed]
Inspiration Ad:         [Reference ad known to perform]
Psychological Trigger:  [Challenge beliefs / FOMO / social proof / authority]
Emotion:               [Relief / excitement / curiosity / urgency]
Copywriter Style:       [David Ogilvy / Gary Halbert / Eugene Schwartz]
Awareness Level:        [1-5 from Schwartz]
Sophistication Level:   [1-5, how saturated the market is]
Ad Length:             [30s / 60s / 2min / 4min]
```

### Generated Script Structure
```
HOOK:   [The performing hook — exact words]
LEAD:   [Bridge: "Imagine never again worrying about X..."]
BODY:   [Problem agitation → mechanism → proof → objection handling]
CTA:    [Single action + urgency cue]
```

---

## Key Learnings

1. **Static ads first** — cheaper, faster to test, works just as well as video for discovery
2. **Hooks are the variable** — test hooks, not entire ads
3. **Awareness level is critical** — same product, completely different language per level
4. **Let algorithm decide** — don't pre-select winners, generate many and let data decide
5. **Gold nuggets** = customer language from reviews = highest converting copy
6. **Iteration beats invention** — build on winners, don't start fresh

---

## Pipeline Implications

| Learning | Implementation |
|----------|---------------|
| Static ads as primary test vehicle | Add static ad generation to pipeline before video |
| Hook volume | Generate 10+ hooks per angle, not just 1 |
| Awareness-specific language | Validated — already in ai-inputs.ts |
| VSSL from winning hooks | Add long-form script generator for winning angles |
| Sophistication level | Add `marketSophistication: 1-5` to offer JSON |
