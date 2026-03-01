# EverReach Ad Platform — Gap Analysis & Implementation Plan

> **Date:** Feb 20, 2026
> **Goal:** Programmatically turn the EverReach Ad Creative Framework into static + video (reel) ads, packaged and ready to ship to Meta.

---

## 0. Implementation Status

| Phase | Description | Status |
|-------|-------------|--------|
| **A** | Fix foundations (brand colors, creative-scorer, IG Portrait, assets) | ✅ Complete |
| **B** | Screenshot-integrated static ads + batch render script | ✅ Complete |
| **C** | Beat-timed Reel composition (15-30s, Hook→Mirror→Enemy→Mechanism→Proof→CTA) | ✅ Complete |
| **D** | One-command Meta ad package pipeline | ✅ Complete |
| **E** | Validate + test renders | 🔄 In Progress |

### New Files Created
- `src/compositions/everreach/EverReachScreenshotAd.tsx` — Phone mockup + screenshot + text overlay
- `src/compositions/everreach/EverReachReel.tsx` — Beat-timed 15-30s video with 6 Sequence blocks
- `scripts/render-everreach-statics.ts` — Batch render all 20 angles × 4 sizes
- `scripts/render-everreach-package.ts` — One command → statics + reels + CSV + tracking

### New Remotion Compositions Registered
- `EverReach-Screenshot-Post` (1080×1080), `EverReach-Screenshot-Portrait` (1080×1350), `EverReach-Screenshot-Story` (1080×1920), `EverReach-Screenshot-Facebook` (1200×630)
- `EverReach-Reel-Story` (20s), `EverReach-Reel-Story-15s` (15s), `EverReach-Reel-Story-30s` (30s), `EverReach-Reel-Post` (20s), `EverReach-Reel-Portrait` (20s)
- 7 new Portrait (4:5) stills for all existing EverReach templates

### How to Run
```bash
# Render full Meta ad package (statics + reels + CSV)
npx tsx scripts/render-everreach-package.ts --campaign "everreach_q1_2026"

# Render statics only (faster)
npx tsx scripts/render-everreach-package.ts --campaign "everreach_q1_2026" --statics-only

# Render specific angles
npx tsx scripts/render-everreach-package.ts --angles UA_TIMING_01,PA_SYSTEM_05

# Render statics with the dedicated script
npx tsx scripts/render-everreach-statics.ts --type screenshot
```

---

## 1. What We Have Today

### ✅ Verified Assets on Disk

| Asset | Path | Status |
|-------|------|--------|
| App icon 1024px | `EverReachOrganized/ios-app/assets/branding/icons/appstore-icon-1024.png` | ✅ 236KB |
| App icon flat | `EverReachOrganized/ios-app/assets/branding/icons/appstore-icon-1024-flat.png` | ✅ 236KB |
| Logo final | `EverReachOrganized/ios-app/assets/branding/logo-final-1024.png` | ✅ 236KB |
| Logo no-bg | `EverReachOrganized/ios-app/assets/branding/logo-no-bg.png` | ✅ 172KB |
| 8 canonical screenshots | `EverReachOrganized/marketing/app-store-screenshots/01-08` | ✅ All present |
| Hi-res iPhone 17 Pro Max set | `EverReachOrganized/marketing/screenshots/appstore-2025-11-22-1709/iPhone-17-Pro-Max/01-08` | ✅ All present |
| Subscription screenshot | `EverReachOrganized/marketing/subscription-screenshot-iphone-17-pro-max.png` | ✅ 378KB |

### ✅ Existing EverReach Remotion Compositions

**7 Static ad templates** in `src/compositions/everreach/EverReachAds.tsx`:

| Component | Template | Best For |
|-----------|----------|----------|
| `EverReachAd` | Headline + subheadline + CTA | All stages |
| `PainPointAd` | Pain statement + cost + CTA | Stage 2 (Problem Aware) |
| `ListicleAd` | Numbered list + CTA | Stage 2-3 |
| `ComparisonAd` | Without vs With columns | Stage 3 (Solution Aware) |
| `StatAd` | Big number + context | Stage 1-2 (Unaware) |
| `QuestionAd` | Hook question + answer hint | Stage 1 (Unaware) |
| `ObjectionKillerAd` | Objection → counter rows | Stage 5 (Most Aware) |

**Registered in Root.tsx as Stills** across sizes:
- `EverReach-Instagram-Post` (1080×1080)
- `EverReach-Instagram-Story` (1080×1920)
- `EverReach-Facebook-Post` (1200×630)
- `EverReach-Facebook-Story` (1080×1920)
- Plus template-specific variants (PainPoint, Listicle, Comparison, Stat, Question, Objections) for IG Post + Story

### ✅ Existing Config & Copy System

In `src/compositions/everreach/config.ts`:
- Full copy bank (headlines × 5 awareness levels, subheadlines, CTAs, objection counters)
- Awareness level definitions matching the framework
- Belief cluster definitions (too_busy, hate_crm, feels_cringe, revenue_loss, privacy_first, already_organized)
- Meta ad size definitions (IG post, story, landscape; FB post, story, square; Threads)

In `src/compositions/everreach/angles.ts`:
- **20 Phase A angles** — complete awareness × belief × template matrix
- Format variation configs per platform
- Helper functions: `getAnglesByAwareness()`, `generateAngleMatrix()`

### ✅ Existing Pipeline Infrastructure

| Component | File | Status |
|-----------|------|--------|
| UGC Pipeline Orchestrator | `src/pipeline/ugc-ad-pipeline.ts` | ✅ Working |
| Variant Generator | `src/pipeline/variant-generator.ts` | ✅ Working |
| Copy Generation (Gemini) | `src/pipeline/copy-generation-stage.ts` | ✅ Working |
| Image Generation (Nano Banana) | `src/pipeline/nano-banana-stage.ts` | ✅ Working |
| Video Animation (Veo 3.1) | `src/pipeline/veo-animate-stage.ts` | ✅ Working |
| Remotion Compose (render stills + video) | `src/pipeline/remotion-compose-stage.ts` | ✅ Working |
| Meta CSV Exporter | `src/pipeline/meta-csv-exporter.ts` | ✅ Working |
| UTM Tracking Builder | `src/compositions/everreach/utm-builder.ts` | ✅ Working |
| UTM Tracking Ad Wrapper | `src/compositions/everreach/EverReachAdWithTracking.tsx` | ✅ Working |
| Product/Campaign CRUD | `src/pipeline/product-store.ts` | ✅ Working |
| Dashboard (10 pages) | `dashboard/` | ✅ Working |

---

## 2. Gap Analysis

### 🔴 Critical Gaps (Must Fix)

#### Gap 1: Brand Colors Mismatch
**Current** (`config.ts`): Indigo/Purple theme (`#6366f1`, `#8b5cf6`)
**Actual Brand** (BRAND_GUIDELINES.md): Black/White with warmth color accents

| Color | Should Be | Currently |
|-------|-----------|-----------|
| Primary | `#000000` (Black) | `#6366f1` (Indigo) |
| Background | `#F8F9FA` (Light) | `#0a0a1a` (Dark) |
| Accent/Hot | `#FF6B6B` (Red) | `#f59e0b` (Amber) |
| Success | `#10B981` (Green) | `#10b981` ✅ |

**Impact:** All rendered stills use wrong brand colors.
**Fix:** Update `EVERREACH_COLORS` in `config.ts` to match actual brand.

#### Gap 2: No App Screenshot Integration in Templates
**Current:** All 7 templates are text-only (headline + subheadline + CTA on gradient background).
**Needed:** Templates should embed actual app screenshots in phone mockups, especially for:
- Stage 3-4 ads (mechanism/proof beats)
- Warmth score screenshots (`05-warmth-score.png`)
- AI compose screenshots (`06-goal-compose.png`)
- Contact list screenshots (`01-contacts-list.png`)

**Impact:** Static ads lack the "proof" visual that the framework demands.
**Fix:** Create new `EverReachScreenshotAd` component that composites screenshot into phone frame + text overlay.

#### Gap 3: No EverReach Video/Reel Composition
**Current:** `UGCVideoAdWrapper` is a generic 8-second wrapper (1.5s intro + 4s main + 2.5s outro).
**Needed:** EverReach reels need beat-timed 15-30s structure per the framework:
```
0-2s   HOOK    — Pattern break, bold text, win first seconds
2-5s   MIRROR  — "You've felt this" familiarity
5-8s   ENEMY   — Name the drift/problem
8-15s  MECHANISM — System reveal (list + reminder + starters)
15-22s PROOF   — App screen recording / screenshot sequence
22-30s CTA     — Single action, end card
```

**Impact:** Can't produce video/reel ads that match the creative framework.
**Fix:** Build `EverReachReelComposition` with beat-timed `<Sequence>` blocks, timed captions, and screenshot integration.

#### Gap 4: No Batch Render Script for EverReach
**Current:** Pipeline renders generic UGC templates (before_after, testimonial, etc.), not EverReach angles.
**Needed:** A script/pipeline that takes the 20 Phase A angles × target sizes and renders:
- Static PNGs for each angle × each Meta size (20 × 4 = 80 stills minimum)
- Video MP4s for key angles × reel size (10-20 reels)

**Impact:** Can't generate a full ad package in one command.
**Fix:** Build `scripts/render-everreach-ads.ts` that drives Remotion CLI for batch rendering.

#### Gap 5: No Meta Ad Package Export
**Current:** `meta-csv-exporter.ts` exists but is wired to the generic UGC pipeline, not EverReach angles/awareness/belief.
**Needed:** One-command export that produces:
```
everreach-ad-package/
├── statics/
│   ├── UA_TIMING_01_instagram_post.png
│   ├── UA_TIMING_01_instagram_story.png
│   ├── UA_TIMING_01_facebook_post.png
│   └── ... (all angles × sizes)
├── reels/
│   ├── PA_SYSTEM_05_reel.mp4
│   └── ... (video ads)
├── meta-bulk-upload.csv          ← Ready for Ads Manager import
├── utm-tracking.csv              ← Full UTM mapping
├── campaign-structure.json       ← TOF/MOF/BOF ad set mapping
└── README.md                     ← Upload instructions
```

**Impact:** Manual effort to package and upload ads to Meta.
**Fix:** Build `scripts/package-everreach-meta.ts`.

### 🟡 Moderate Gaps

#### Gap 6: `creative-scorer.ts` Uses Wrong Import
**Current:** `import { GoogleGenAI } from '@google/genai'` — package not installed.
**Actual Pattern:** Project uses raw `https` module (see `copy-generation-stage.ts`, `nano-banana-stage.ts`).
**Fix:** Rewrite to use raw `https` matching project pattern.

#### Gap 7: No Caption/Subtitle System for Reels
**Framework requires:** Captions that carry the hook for sound-off viewing. Every sentence gets matching shot.
**Current:** No timed text overlay / caption system in video compositions.
**Fix:** Build a `TimedCaption` component for the reel composition with per-beat text rendering.

#### Gap 8: Instagram Portrait (4:5) Missing from EverReach Stills
**Current EverReach stills:** IG Post (1:1), IG Story (9:16), FB Post (1.91:1), FB Story (9:16)
**Missing:** 1080×1350 (4:5 portrait) — the **highest-performing Meta feed format** for real estate.
**Fix:** Register `EverReach-Instagram-Portrait` Still in Root.tsx.

### 🟢 Nice-to-Have (Future)

#### Gap 9: No Meta Marketing API Integration
**Current:** Manual upload via CSV + assets.
**Future:** Programmatic ad creation via Meta Marketing API (`POST /act_{ad_account_id}/ads`).
**Note:** Requires Meta App Review + Marketing API access. CSV bulk upload is the pragmatic first step.

#### Gap 10: No A/B Test Structure in Export
**Framework requires:** Test hooks, not entire scripts. One variable at a time.
**Current:** Angles are defined but no systematic hook-variant testing structure.
**Future:** Generate hook variants per angle for split testing.

---

## 3. Implementation Plan

### Phase A: Fix Foundations (< 1 day)

1. **Update brand colors** in `config.ts` to match actual EverReach brand
2. **Fix `creative-scorer.ts`** — replace `@google/genai` with raw `https`
3. **Add Instagram Portrait (4:5)** to EverReach stills in Root.tsx
4. **Copy EverReach assets** into Remotion `public/` for Remotion browser access

### Phase B: Screenshot-Integrated Static Ads (1-2 days)

1. **Build `EverReachScreenshotAd` component** — phone mockup frame + screenshot + text overlay
2. **Build `EverReachPhoneMockup` sub-component** — renders screenshot inside iPhone bezel
3. **Map screenshots to angles** per the Asset-to-Ad Angle Mapping table
4. **Register new Stills** in Root.tsx for all sizes
5. **Build `scripts/render-everreach-statics.ts`** — renders all 20 angles × all sizes

### Phase C: Beat-Timed Reel Composition (2-3 days)

1. **Build `EverReachReelComposition`** in `src/compositions/everreach/`:
   - 6 `<Sequence>` blocks matching beat structure (Hook → Mirror → Enemy → Mechanism → Proof → CTA)
   - `TimedCaption` component for sound-off text overlays
   - Screenshot sequence integration for Proof beat
   - Brand intro + outro with logo
   - Per-awareness-stage script variants (15s unaware, 20s problem-aware, 25s solution-aware, 30s product-aware)
2. **Register Compositions** in Root.tsx at 1080×1920 (9:16) and 1080×1080 (1:1 for feed)
3. **Build awareness-to-script mapper** — takes framework scripts and maps to beat timings
4. **Test renders** for each awareness stage

### Phase D: Meta Ad Package Pipeline (1 day)

1. **Build `scripts/render-everreach-package.ts`** — one command renders everything:
   - All static PNGs (angles × sizes)
   - All video MP4s (key angles × reel format)
   - Meta bulk upload CSV
   - UTM tracking spreadsheet
   - Campaign structure JSON (TOF/MOF/BOF mapping)
2. **Wire into API server** — `POST /api/v1/everreach/render-package`
3. **Add dashboard page** — `/everreach` with package status + download

### Phase E: Validate & Ship (1 day)

1. Test full pipeline: framework → render → package → verify Meta CSV compatibility
2. Verify all sizes match Meta specs exactly
3. Verify UTM tracking end-to-end
4. Update PRD with EverReach integration status

---

## 4. Deliverable: What "Ready to Ship to Meta" Means

After implementation, one command produces:

```bash
npx tsx scripts/render-everreach-package.ts --campaign "everreach_q1_2026"
```

**Output:**
- **80+ static PNGs** (20 angles × 4 sizes) — Instagram Post, Portrait, Story, Facebook Post
- **10-20 video MP4s** (key angles as 15-30s reels) — 1080×1920
- **meta-bulk-upload.csv** — drag-and-drop into Meta Ads Manager
- **campaign-structure.json** — exact TOF/MOF/BOF ad set names, audiences, budgets
- **utm-tracking.csv** — every variant tracked

**Upload path:**
1. Go to Meta Ads Manager → Bulk Upload
2. Upload CSV + assets folder
3. Ads are created with correct copy, creative, UTM tracking, and ad set structure
4. Or: use a service like Smartly.io / Revealbot / Madgicx that accepts the same format

---

## 5. Priority Order

| # | Task | Impact | Effort | Priority |
|---|------|--------|--------|----------|
| 1 | Fix brand colors | All renders wrong without this | 30 min | 🔴 Now |
| 2 | Fix creative-scorer import | Blocks Phase 5 features | 15 min | 🔴 Now |
| 3 | Screenshot-integrated static ads | Static ads lack proof | 1-2 days | 🔴 High |
| 4 | Beat-timed Reel composition | No video ads without this | 2-3 days | 🔴 High |
| 5 | Batch render script | Manual renders impractical | 4 hours | 🟡 High |
| 6 | Meta package export | Manual packaging slow | 4 hours | 🟡 High |
| 7 | Add IG Portrait size | Missing best-performing format | 30 min | 🟡 Medium |
| 8 | Dashboard integration | Nice UX, not blocking | 1 day | 🟢 Medium |
| 9 | Meta Marketing API | Fully automated, complex | 3-5 days | 🟢 Future |
