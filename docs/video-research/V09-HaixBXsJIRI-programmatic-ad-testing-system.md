# Video Analysis: Programmatic Ad Testing System (Make.com + Facebook Ads)

**URL:** https://www.youtube.com/watch?v=HaixBXsJIRI  
**Topic:** Systematic ad creation and testing using automation + Eugene Schwartz awareness framework  
**Tools:** Make.com + Google Sheets + Claude/ChatGPT + Icon (B-roll tool) + Facebook Ads  
**Product Type:** Beauty/Skincare (Miracle Bomb makeup product)

---

## Core Philosophy: Ads Are Not Creative Guesswork

> "I'm not a creative person. I like systems. If you start thinking of ads as something that is not chaos, it's logical. After you've tested so many of them, you find the ones that are actually resonating with your customers — and they already exist. You just have to find them."

### The Fundamental Insight
The right message already exists in your market. Your job is to **systematically find it**, not invent it.

---

## The Programmatic Ad System

### Architecture
```
Google Sheets (Brand/Product/Gold Nuggets) 
  → Make.com automation 
  → Claude/ChatGPT (hook generation) 
  → Image generation 
  → Facebook Ads Manager (auto-create ads)
  → Facebook algorithm picks winners
  → Iterate from winners
```

### The 4 Parameters to Test
1. **Unique Selling Proposition (USP)** — what specific benefit to highlight
2. **Marketing Angle** — the lens through which you present the USP
3. **Messaging Framework** — PAS, AIDA, testimonial, etc.
4. **Awareness Level** — where the customer is in their buying journey

**Key insight:** Test ONE variable at a time. Change the angle, keep everything else constant.

---

## The Gold Nuggets System

### What Are Gold Nuggets?
Real customer language extracted from:
- Product reviews (Amazon, Trustpilot, app stores)
- Reddit/forum discussions about the pain point
- Social media comments
- Voice mining (AI agents scraping the internet)

### Why Gold Nuggets Matter
> "You have the context about a specific pain point and then you have all the different quotes that people have said on the internet about this specific pain point — not related to your product, but related to your pain point."

**The magic:** When you use customers' exact words in ads, they feel like the ad was written for them.

### Gold Nuggets Prompt
```
You are a market researcher. Extract the most emotionally resonant quotes 
from these [reviews/comments] about [pain point]. 
Keep only quotes that:
1. Describe the pain in vivid, specific language
2. Express frustration, relief, or transformation
3. Use language a real person would say out loud
Format: bullet list, exact quotes only, no paraphrasing.
```

---

## Hook Generation System

### The Hook Formula
```
[Awareness Level] + [USP] + [Marketing Angle] + [Messaging Framework] = Hook
```

### Example Hooks Generated
- "No mirror, no problem. Miracle Bomb makes mistakes impossible and glow inevitable."
- "Shaky hand, steady glow." (short hook)

### Hook Testing Strategy
1. Generate 10–20 hooks per USP/angle combination
2. Pick 3–5 best hooks
3. Apply each hook to 2 different image templates
4. Result: 6–10 ad variations per batch
5. Let Facebook algorithm pick winners (don't pre-select)

---

## The Eugene Schwartz Awareness Framework (Applied)

> "We need to define where the customer is in their journey of becoming a buyer."

| Level | Description | Ad Approach |
|-------|-------------|-------------|
| Unaware | Doesn't know they have the problem | Life insight → habit → soft reveal |
| Problem Aware | Knows the pain, not the solution | Pain → cost → fix |
| Solution Aware | Knows solutions exist, evaluating | Compare alternatives → mechanism |
| Product Aware | Knows your product, hasn't bought | Demo + objections + CTA |
| Most Aware | Ready to buy, needs final push | Proof + risk reversal + urgency |

**Critical:** Give AI the awareness level. The same USP needs completely different language for each level.

---

## The VSSL/Long-Form Ad Generator

For winning hooks, generate a full script using:
- **USP**: the winning angle
- **Original hook**: the performing hook
- **Inspiration ad**: a known high-performing ad as reference
- **Psychological trigger**: challenge beliefs, create FOMO, social proof, etc.
- **Emotion**: what feeling to create
- **Copywriter style**: David Ogilvy, Gary Halbert, etc.
- **Awareness level**: from Schwartz framework
- **Sophistication level**: 1–5 (how saturated the market is)

### Generated Script Structure
```
HOOK:    [The performing hook]
LEAD:    [Bridge from hook to problem]
BODY:    [Problem agitation + mechanism + proof]
CTA:     [Single action + urgency]
```

---

## Facebook Campaign Structure

### The "Give Algorithm Maximum Freedom" Approach
- Create campaign with broad targeting
- Create 1 ad set
- Push ALL variations into that 1 ad set
- Let Facebook decide which ads resonate
- **Don't pre-select winners** — let data decide

### Iteration Loop
1. Run 100 ads → Facebook finds 1–2 winners
2. Take winning angle → generate new iterations
3. New images + same hooks
4. Different messaging frameworks + same angle
5. Repeat indefinitely

---

## Key Learnings

1. **Ads are a search problem**, not a creativity problem — find the right message
2. **Gold nuggets** = customer language = highest converting copy
3. **Test one variable at a time** — angle, not everything at once
4. **Awareness level** changes everything — same product, completely different language
5. **Let the algorithm pick** — don't pre-select, generate many and let Facebook decide
6. **Iterate from winners** — don't start fresh, build on what works
7. **20 good ads per day** is achievable with a small team using this system

---

## Pipeline Implications

| Learning | Implementation |
|----------|---------------|
| Gold nuggets extraction | Add voice mining step to offer creation workflow |
| Awareness-level-specific language | Already implemented in ai-inputs.ts — validate it's working |
| Hook generation at scale | Generate 10+ hooks per angle, not just 1 |
| Facebook auto-creation | Add Meta Marketing API integration |
| Winner iteration | Add `iterateFromWinner` flag to smart-generate.ts |
| Sophistication level | Add `marketSophistication: 1-5` to offer JSON |
