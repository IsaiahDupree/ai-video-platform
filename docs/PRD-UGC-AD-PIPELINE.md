# PRD: UGC Ad Generation Pipeline with Parametric Optimization

## Product Requirements Document
**Version:** 1.0  
**Date:** February 2026  
**Status:** Draft

---

# Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Non-Goals](#3-goals--non-goals)
4. [System Architecture](#4-system-architecture)
5. [Pipeline Components](#5-pipeline-components)
6. [Parametric Ad Model](#6-parametric-ad-model)
7. [Meta Feedback Loop](#7-meta-feedback-loop)
8. [API Specification](#8-api-specification)
9. [Data Models](#9-data-models)
10. [Existing Code Inventory](#10-existing-code-inventory)
11. [Implementation Roadmap](#11-implementation-roadmap)
12. [Testing Strategy](#12-testing-strategy)

---

# 1. Executive Summary

## 1.1 What We're Building

An **end-to-end UGC ad generation pipeline** that chains three AI systems together:

1. **Nano Banana (Gemini)** — Generate character-consistent before/after product images
2. **Veo 3** — Animate those images into 8s/16s UGC-style video clips
3. **Remotion** — Compose final ads with text overlays, CTA, branding, and render to all Meta ad sizes

On top of this, a **parametric optimization layer** that:
- Tags every ad variant with granular parameters (copy, visual style, CTA, hook type, etc.)
- Ingests Meta Ads performance data (CTR, CPC, ROAS, CPM, conversions)
- Identifies winning parameter combinations
- Auto-generates the next batch of variants biased toward winners

```
┌─────────────────────────────────────────────────────────────────────┐
│                     UGC AD GENERATION PIPELINE                       │
│                                                                     │
│  Product Images ──→ Nano Banana ──→ Veo 3 ──→ Remotion ──→ Meta    │
│       (before/after)   (consistent     (animate)  (compose    (publish) │
│                         characters)               + render)            │
│                                                                     │
│  Meta Ad Data ──→ Parametric Analyzer ──→ Next Batch Generator      │
│   (CTR, ROAS)       (find winners)         (bias toward winners)    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 1.2 Why This Matters

- **Speed**: Generate 50+ ad variants in minutes instead of days
- **Data-driven**: Every creative decision is parameterized and measurable
- **Iterative**: Performance data feeds back into generation for continuous improvement
- **Cost**: Eliminate manual creative production costs

---

# 2. Problem Statement

## 2.1 Current State

The codebase has all three core pieces (Nano Banana, Veo 3, Remotion before/after templates) but they are:

- **Not connected** — No pipeline wiring Gemini → Veo 3 → Remotion
- **No optimization loop** — Ad variants are generated without tracking which parameters win
- **Manual iteration** — No system to ingest Meta data and auto-generate improved variants

## 2.2 Desired State

- **One command** generates a full batch of UGC ad variants
- **Every variant is tagged** with parametric metadata (hook, copy angle, visual style, CTA, etc.)
- **Meta data flows back** into the system to score parameters and bias future generation
- **Continuous improvement** — each batch gets smarter based on real performance

---

# 3. Goals & Non-Goals

## 3.1 Goals

| ID | Goal |
|----|------|
| G1 | Wire Nano Banana → Veo 3 → Remotion into a single pipeline |
| G2 | Support before/after image generation with character consistency |
| G3 | Parametric tagging of every creative element in every variant |
| G4 | Ingest Meta Ads API performance data per variant |
| G5 | Score parameter combinations by performance metrics |
| G6 | Auto-generate next batch biased toward winning parameters |
| G7 | Support all Meta ad placements (Feed, Story, Reels, 1:1, 4:5, 9:16, 16:9) |
| G8 | Export UTM-tagged variants ready for Meta upload |

## 3.2 Non-Goals (v1)

- Real-time bidding integration
- Auto-upload to Meta (manual upload for v1; Blotato integration later)
- Multi-platform optimization (Meta only for v1; TikTok/YouTube later)
- Budget allocation optimization

---

# 4. System Architecture

## 4.1 Pipeline Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   INPUT      │     │  GENERATE   │     │  ANIMATE    │     │   COMPOSE    │
│              │     │             │     │             │     │              │
│ • Product    │────→│ Nano Banana │────→│   Veo 3     │────→│  Remotion    │
│   images     │     │ (Gemini)    │     │             │     │              │
│ • Brand kit  │     │             │     │ • 8s/16s    │     │ • Overlays   │
│ • Copy brief │     │ • Before    │     │ • 9:16      │     │ • CTA        │
│ • Parameters │     │ • After     │     │ • 16:9      │     │ • Branding   │
│              │     │ • Character │     │ • 1:1       │     │ • All sizes  │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬───────┘
                                                                    │
                                                                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  OPTIMIZE   │     │  ANALYZE    │     │  TRACK      │     │   OUTPUT     │
│             │     │             │     │             │     │              │
│ Next Batch  │←────│ Parameter   │←────│ Meta Ads    │←────│ • MP4s       │
│ Generator   │     │ Scorer      │     │ API Data    │     │ • PNGs       │
│             │     │             │     │             │     │ • UTM tags   │
│ • Bias      │     │ • CTR by    │     │ • CTR       │     │ • Metadata   │
│   winners   │     │   param     │     │ • CPC       │     │ • Param tags │
│ • Explore   │     │ • ROAS by   │     │ • ROAS      │     │              │
│   new       │     │   combo     │     │ • CPM       │     │              │
└─────────────┘     └─────────────┘     └─────────────┘     └──────────────┘
```

## 4.2 Component Diagram

```
src/
├── pipeline/
│   ├── ugc-ad-pipeline.ts          # Main orchestrator
│   ├── nano-banana-stage.ts        # Gemini image generation stage
│   ├── veo-animate-stage.ts        # Veo 3 animation stage
│   ├── remotion-compose-stage.ts   # Remotion composition stage
│   └── export-stage.ts             # Final export + UTM tagging
│
├── parametric/
│   ├── parameter-schema.ts         # Parameter definitions
│   ├── variant-generator.ts        # Parametric variant generation
│   ├── parameter-scorer.ts         # Score params by performance
│   ├── meta-data-ingester.ts       # Ingest Meta Ads API data
│   ├── optimization-engine.ts      # Bayesian optimization for next batch
│   └── report-generator.ts         # Performance reports
│
├── api/
│   ├── veo-client.ts               # (existing) Veo 3 client
│   └── ...
│
├── compositions/
│   ├── blanklogo/
│   │   ├── BeforeAfterVideo.tsx     # (existing) Before/After video template
│   │   └── ...
│   └── ugc/
│       ├── UGCBeforeAfter.tsx       # UGC-style before/after
│       ├── UGCTestimonial.tsx       # UGC testimonial style
│       └── UGCProductDemo.tsx       # UGC product demo style
│
└── scripts/
    ├── remix-character-gemini.ts    # (existing) Nano Banana
    └── generate-ugc-ads.ts          # New: end-to-end UGC ad generator
```

---

# 5. Pipeline Components

## 5.1 Stage 1: Nano Banana (Gemini Image Generation)

**Purpose:** Generate character-consistent before/after product images.

**Existing Code:** `scripts/remix-character-gemini.ts`, `python/services/video_generation/gemini_video_pipeline.py`

**Input:**
```typescript
interface NanoBananaInput {
  // Product
  productImageUrl: string;             // Base product image
  productName: string;
  productDescription: string;

  // Before/After
  beforeScenePrompt: string;           // "Person frustrated with watermarked photo"
  afterScenePrompt: string;            // "Person smiling at clean photo on screen"

  // Character consistency
  characterStyle: 'realistic' | 'cartoon' | 'lifestyle' | 'minimal';
  characterGender?: 'male' | 'female' | 'neutral';
  characterAge?: 'young_adult' | 'adult' | 'middle_aged';

  // Output
  imageCount: number;                  // How many before/after pairs
  imageSize: '1024x1024' | '1792x1024' | '1024x1792';
}
```

**Output:**
```typescript
interface NanoBananaOutput {
  pairs: {
    id: string;
    beforeImagePath: string;
    afterImagePath: string;
    characterProfileId: string;        // For consistency across pairs
    metadata: {
      style: string;
      sceneDescription: string;
      confidence: number;
    };
  }[];
}
```

**How It Works:**
1. Analyze product image with Gemini to understand the product
2. Generate character profile for consistency
3. Generate "before" scene with reference character + problem state
4. Generate "after" scene with same character + solution state
5. Output both images with shared character profile ID

## 5.2 Stage 2: Veo 3 (Video Animation)

**Purpose:** Animate static before/after images into UGC-style video clips.

**Existing Code:** `src/api/veo-client.ts`, `tests/google-ai/test-veo3.ts`

**Input:**
```typescript
interface VeoAnimateInput {
  beforeImagePath: string;
  afterImagePath: string;
  motionPrompt: string;                // "Smooth transition from frustration to satisfaction"
  duration: 8 | 16;                    // seconds
  aspectRatio: '9:16' | '16:9' | '1:1';
  transitionStyle: 'cut' | 'morph' | 'swipe' | 'zoom';
}
```

**Output:**
```typescript
interface VeoAnimateOutput {
  videoPath: string;
  videoUrl: string;
  duration: number;
  aspectRatio: string;
  jobId: string;
}
```

**How It Works:**
1. Load before image as `startImage`
2. Load after image as `endImage`
3. Submit to Veo 3 with motion prompt
4. Poll for completion
5. Download and store resulting video

## 5.3 Stage 3: Remotion Composition

**Purpose:** Compose final ad with text overlays, CTA, branding, and render to all sizes.

**Existing Code:** `src/compositions/blanklogo/BeforeAfterVideo.tsx`, `src/Root.tsx` (20+ before/after compositions)

**Input:**
```typescript
interface RemotionComposeInput {
  videoPath: string;                   // From Veo 3
  template: 'before_after' | 'testimonial' | 'product_demo' | 'problem_solution';

  // Copy (parametric)
  headline: string;
  subheadline: string;
  ctaText: string;
  beforeLabel: string;
  afterLabel: string;
  trustLine?: string;
  badge?: string;

  // Branding
  brand: {
    name: string;
    logoUrl?: string;
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
  };

  // Output sizes
  sizes: AdSize[];
}

type AdSize = {
  name: string;
  width: number;
  height: number;
  platform: string;
};
```

**Standard Meta Ad Sizes:**
```typescript
const META_AD_SIZES: AdSize[] = [
  { name: 'feed_square',    width: 1080, height: 1080, platform: 'instagram' },
  { name: 'feed_portrait',  width: 1080, height: 1350, platform: 'instagram' },
  { name: 'story',          width: 1080, height: 1920, platform: 'instagram' },
  { name: 'reels',          width: 1080, height: 1920, platform: 'instagram' },
  { name: 'fb_feed',        width: 1200, height: 628,  platform: 'facebook'  },
  { name: 'fb_square',      width: 1080, height: 1080, platform: 'facebook'  },
];
```

---

# 6. Parametric Ad Model

This is the core innovation: every creative decision is a **measurable parameter**.

## 6.1 Parameter Schema

```typescript
interface AdParameters {
  // === VISUAL PARAMETERS ===
  visual: {
    template: 'before_after' | 'testimonial' | 'product_demo' | 'problem_solution';
    characterStyle: 'realistic' | 'cartoon' | 'lifestyle' | 'minimal';
    transitionStyle: 'cut' | 'morph' | 'swipe' | 'zoom';
    colorScheme: 'dark' | 'light' | 'brand' | 'neon';
    videoDuration: 8 | 16;
    aspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
  };

  // === COPY PARAMETERS ===
  copy: {
    hookType: 'question' | 'statement' | 'shock' | 'curiosity' | 'social_proof' | 'urgency';
    headline: string;
    headlineLength: 'short' | 'medium' | 'long';   // <5, 5-10, >10 words
    subheadline: string;
    ctaType: 'action' | 'benefit' | 'urgency' | 'curiosity';
    ctaText: string;
    toneOfVoice: 'casual' | 'professional' | 'excited' | 'empathetic' | 'authoritative';
    beforeLabel: string;
    afterLabel: string;
  };

  // === TARGETING PARAMETERS ===
  targeting: {
    awarenessLevel: 'unaware' | 'problem_aware' | 'solution_aware' | 'product_aware' | 'most_aware';
    beliefCluster: string;              // e.g., "too_expensive", "too_complicated", "not_for_me"
    painPoint: string;                  // e.g., "wasting_time", "embarrassing_quality"
    desiredOutcome: string;             // e.g., "professional_look", "save_time"
  };

  // === STRUCTURAL PARAMETERS ===
  structure: {
    hasBeforeAfter: boolean;
    hasTrustLine: boolean;
    hasBadge: boolean;
    hasFooter: boolean;
    ctaPosition: 'bottom' | 'middle' | 'overlay';
    labelStyle: 'pill' | 'bar' | 'corner' | 'inline';
  };
}
```

## 6.2 Parameter ID (Unique Variant Key)

Every variant gets a unique, parseable ID encoding its parameters:

```
Format: {template}_{hook}_{awareness}_{cta}_{size}_{batchId}_{variantIdx}

Example: ba_question_pa_action_1080x1920_b001_v03

Where:
  ba         = before_after template
  question   = question hook type
  pa         = problem_aware targeting
  action     = action CTA type
  1080x1920  = ad size
  b001       = batch 001
  v03        = variant 3 in batch
```

This ID is embedded in:
- **UTM tags** (`utm_content=ba_question_pa_action_1080x1920_b001_v03`)
- **File names** (`output/ugc-ads/ba_question_pa_action_1080x1920_b001_v03.mp4`)
- **Meta ad name** (for easy lookup in Ads Manager)

## 6.3 Variant Generation Matrix

Given N options per parameter, generate the cross-product (or smart subset):

```typescript
interface VariantMatrix {
  templates: string[];       // ['before_after', 'testimonial']
  hookTypes: string[];       // ['question', 'shock', 'social_proof']
  awarenessLevels: string[]; // ['problem_aware', 'solution_aware']
  ctaTypes: string[];        // ['action', 'benefit', 'urgency']
  sizes: string[];           // ['1080x1080', '1080x1920']

  // Generation strategy
  strategy: 'full_cross' | 'latin_square' | 'random_sample' | 'bayesian';
  maxVariants: number;       // Cap total variants per batch
}
```

**Example:** 2 templates × 3 hooks × 2 awareness × 3 CTAs × 2 sizes = **72 variants**

With `strategy: 'latin_square'` and `maxVariants: 24`, we get a balanced subset that covers all parameter combinations at least once.

---

# 7. Meta Feedback Loop

## 7.1 Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Meta Ads    │     │  Parametric  │     │    Next      │
│  Manager     │────→│  Analyzer    │────→│    Batch     │
│              │     │              │     │  Generator   │
│ Per-ad data: │     │ Scores each  │     │              │
│ • CTR        │     │ parameter:   │     │ Bias toward: │
│ • CPC        │     │              │     │ • High CTR   │
│ • CPM        │     │ hookType:    │     │   hooks      │
│ • ROAS       │     │  question→3.2│     │ • High ROAS  │
│ • Conversions│     │  shock→1.8   │     │   templates  │
│ • Spend      │     │  social→4.1  │     │ • Explore    │
│ • Impressions│     │              │     │   new combos │
│              │     │ template:    │     │              │
│              │     │  ba→2.8      │     │              │
│              │     │  demo→3.5    │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

## 7.2 Meta Ads API Integration

```typescript
interface MetaAdPerformance {
  adId: string;                       // Meta ad ID
  adName: string;                     // Contains our variant ID
  utmContent: string;                 // Our parametric ID

  // Performance metrics
  impressions: number;
  clicks: number;
  ctr: number;                        // Click-through rate (%)
  cpc: number;                        // Cost per click ($)
  cpm: number;                        // Cost per mille ($)
  spend: number;                      // Total spend ($)
  conversions: number;
  conversionRate: number;             // (%)
  roas: number;                       // Return on ad spend
  costPerConversion: number;

  // Engagement
  videoViews: number;
  videoViewRate: number;
  avgWatchTime: number;
  thruplayRate: number;               // % who watched to end

  // Metadata
  dateRange: { start: string; end: string };
  placement: string;                  // feed, story, reels
  platform: string;                   // instagram, facebook
}
```

## 7.3 Parameter Scoring

For each parameter value, compute a **performance score** across all variants that used it:

```typescript
interface ParameterScore {
  parameter: string;                  // e.g., "copy.hookType"
  value: string;                      // e.g., "question"
  metrics: {
    avgCtr: number;
    avgRoas: number;
    avgCpc: number;
    avgConversionRate: number;
    avgVideoViewRate: number;
    sampleSize: number;               // How many variants used this value
    confidence: number;               // Statistical confidence (0-1)
  };
  rank: number;                       // Rank within parameter (1 = best)
}
```

**Scoring Algorithm:**

```
composite_score = (
  w_ctr * normalized_ctr +
  w_roas * normalized_roas +
  w_cvr * normalized_conversion_rate +
  w_vvr * normalized_video_view_rate
) * confidence_factor

Where:
  w_ctr = 0.25 (weight for click-through rate)
  w_roas = 0.35 (weight for return on ad spend)
  w_cvr = 0.25 (weight for conversion rate)
  w_vvr = 0.15 (weight for video view rate)
  confidence_factor = min(1.0, sample_size / 5)  // Need 5+ variants for full confidence
```

## 7.4 Next-Batch Generation Strategy

The optimization engine uses a **multi-armed bandit** approach (Thompson Sampling):

```typescript
interface BatchStrategy {
  // Exploitation (70%): Use known winners
  exploitation: {
    percentage: 0.70;
    method: 'top_performers';
    // Pick top-scoring parameter combos and generate more variants
  };

  // Exploration (20%): Try new combinations
  exploration: {
    percentage: 0.20;
    method: 'random_untested';
    // Generate variants with parameter combos not yet tested
  };

  // Mutation (10%): Slightly modify winners
  mutation: {
    percentage: 0.10;
    method: 'mutate_winners';
    // Take winning combos and change 1 parameter
  };
}
```

**Example Batch 2 (after analyzing Batch 1):**

```
Batch 1 Results:
  Best hookType:    social_proof (CTR: 4.1%)
  Best template:    product_demo (ROAS: 3.5x)
  Best ctaType:     benefit (CVR: 2.8%)
  Best awareness:   problem_aware (CTR: 3.9%)

Batch 2 Generation:
  70% exploitation: 17 variants using social_proof + product_demo + benefit + problem_aware
    → vary: headline text, visual style, video duration, ad size
  20% exploration:  5 variants with untested combos
    → try: urgency hook + testimonial + solution_aware
  10% mutation:     2 variants mutating winners
    → social_proof + product_demo + urgency (change CTA only)
```

## 7.5 Performance Reports

```typescript
interface OptimizationReport {
  batchId: string;
  dateRange: { start: string; end: string };
  totalSpend: number;
  totalConversions: number;
  overallRoas: number;

  // Parameter rankings
  parameterRankings: {
    [parameter: string]: ParameterScore[];
  };

  // Best combinations
  topCombinations: {
    parameters: AdParameters;
    metrics: MetaAdPerformance;
    variantCount: number;
  }[];

  // Recommendations
  recommendations: {
    action: 'increase_budget' | 'pause' | 'iterate' | 'new_angle';
    target: string;         // Which parameter or variant
    reason: string;
    expectedImpact: string;
  }[];

  // Next batch suggestion
  suggestedNextBatch: {
    strategy: BatchStrategy;
    estimatedVariants: number;
    focusAreas: string[];
  };
}
```

---

# 8. API Specification

## 8.1 Pipeline Endpoints

### POST /api/v1/ugc/generate
Generate a batch of UGC ad variants.

```json
{
  "product": {
    "name": "BlankLogo",
    "description": "AI watermark removal tool",
    "imageUrl": "https://...",
    "websiteUrl": "https://blanklogo.app"
  },
  "brand": {
    "name": "BlankLogo",
    "primaryColor": "#6366f1",
    "accentColor": "#22c55e",
    "fontFamily": "Inter"
  },
  "scenes": {
    "beforePrompt": "Person looking frustrated at phone with watermarked photo",
    "afterPrompt": "Same person smiling at clean professional photo on phone"
  },
  "matrix": {
    "templates": ["before_after", "product_demo"],
    "hookTypes": ["question", "social_proof", "urgency"],
    "awarenessLevels": ["problem_aware", "solution_aware"],
    "ctaTypes": ["action", "benefit"],
    "sizes": ["1080x1080", "1080x1920"],
    "strategy": "latin_square",
    "maxVariants": 24
  },
  "copy": {
    "headlines": {
      "question": ["Still posting with watermarks?", "Tired of blurry removals?"],
      "social_proof": ["50K creators trust BlankLogo", "Join 50K+ happy creators"],
      "urgency": ["10 free credits — today only", "Limited: Free watermark removal"]
    },
    "ctas": {
      "action": ["Remove Watermark Now", "Try Free"],
      "benefit": ["Get Clean Photos", "Get 10 Free Credits"]
    }
  },
  "webhook_url": "http://localhost:8080/ugc-callback"
}
```

### POST /api/v1/ugc/optimize
Ingest Meta data and generate optimization report.

```json
{
  "batchId": "b001",
  "metaData": {
    "source": "csv_upload",
    "filePath": "/path/to/meta-export.csv"
  },
  "optimizationGoal": "roas",
  "weights": {
    "ctr": 0.25,
    "roas": 0.35,
    "conversionRate": 0.25,
    "videoViewRate": 0.15
  }
}
```

**Response:**
```json
{
  "report": {
    "batchId": "b001",
    "overallRoas": 3.2,
    "topParameters": {
      "hookType": { "winner": "social_proof", "score": 4.1, "confidence": 0.92 },
      "template": { "winner": "product_demo", "score": 3.5, "confidence": 0.87 },
      "ctaType": { "winner": "benefit", "score": 2.8, "confidence": 0.85 }
    },
    "suggestedNextBatch": {
      "exploitation": 17,
      "exploration": 5,
      "mutation": 2,
      "focusAreas": ["social_proof hooks", "benefit CTAs", "product_demo template"]
    }
  }
}
```

### POST /api/v1/ugc/next-batch
Auto-generate next batch based on optimization report.

```json
{
  "previousBatchId": "b001",
  "strategy": "auto",
  "maxVariants": 24,
  "newCopyOptions": {
    "headlines": ["New headline 1", "New headline 2"],
    "ctas": ["New CTA 1"]
  }
}
```

---

# 9. Data Models

## 9.1 AdVariant (Master Record)

```typescript
interface AdVariant {
  // Identity
  id: string;                          // ba_question_pa_action_1080x1920_b001_v03
  batchId: string;                     // b001
  variantIndex: number;                // 3

  // Parameters (full)
  parameters: AdParameters;

  // Assets
  assets: {
    beforeImagePath: string;
    afterImagePath: string;
    videoPath: string;
    composedVideoPath: string;         // Final Remotion output
    thumbnailPath: string;
  };

  // UTM
  utmParams: {
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    utm_content: string;               // = this variant's ID
  };

  // Meta
  metaAdId?: string;                   // Set after upload to Meta
  metaAdSetId?: string;

  // Performance (populated from Meta data)
  performance?: MetaAdPerformance;

  // Status
  status: 'generating' | 'rendered' | 'uploaded' | 'active' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;
}
```

## 9.2 Batch

```typescript
interface AdBatch {
  id: string;                          // b001
  productId: string;
  campaignId: string;

  // Configuration
  matrix: VariantMatrix;
  strategy: BatchStrategy;

  // Variants
  variants: AdVariant[];
  totalVariants: number;

  // Performance (aggregated)
  performance?: {
    totalSpend: number;
    totalConversions: number;
    overallRoas: number;
    overallCtr: number;
    dateRange: { start: string; end: string };
  };

  // Optimization
  parameterScores?: Record<string, ParameterScore[]>;
  report?: OptimizationReport;

  // Lineage
  parentBatchId?: string;              // If generated from optimization
  childBatchId?: string;               // Next batch

  status: 'generating' | 'rendered' | 'active' | 'analyzed' | 'completed';
  createdAt: string;
}
```

---

# 10. Existing Code Inventory

## 10.1 What We Already Have

| Component | File | Status |
|-----------|------|--------|
| **Nano Banana** | `scripts/remix-character-gemini.ts` | ✅ Working — character analysis + scene generation |
| **Gemini Video Service** | `python/services/video_generation/gemini_video_pipeline.py` | ✅ Working — "Nano Banana style" consistency |
| **Veo 3.1 Client** | `src/api/veo-client.ts` | ✅ Working — image-to-video, job polling, download |
| **Veo 3 Before/After** | `tests/google-ai/test-veo3.ts` | ✅ Working — `startImage`/`endImage` support |
| **BeforeAfterSplit** | `src/compositions/blanklogo/BeforeAfterSplit.tsx` | ✅ Working — 20+ compositions in Root.tsx |
| **BeforeAfterVideo** | `src/compositions/blanklogo/BeforeAfterVideo.tsx` | ✅ Working — full video before/after with phases |
| **UTM Builder** | `src/compositions/everreach/utm-builder.ts` | ✅ Working — UTM encoding, parsing, reporting |
| **Ad Tracking** | `src/compositions/everreach/EverReachAdWithTracking.tsx` | ✅ Working — tracking wrapper component |
| **UGC Adapter** | `python/services/visuals/adapters/ugc.py` | ⚠️ Partial — local search works, RapidAPI stubbed |
| **Character Generator** | `python/services/character_generator.py` | ✅ Working — DALL-E character + variants |
| **Meta Ad Sizes** | `src/compositions/blanklogo/config.ts` | ✅ Working — all standard sizes defined |

## 10.2 What Needs Building

| Component | Description | Priority |
|-----------|-------------|----------|
| **Pipeline Orchestrator** | Wire Nano Banana → Veo 3 → Remotion | P0 |
| **Parametric Schema** | Define and validate parameter types | P0 |
| **Variant Generator** | Generate variant matrix from parameters | P0 |
| **UGC Compositions** | New Remotion templates for UGC style | P1 |
| **Meta Data Ingester** | Parse Meta Ads CSV/API export | P1 |
| **Parameter Scorer** | Score parameters by performance | P1 |
| **Optimization Engine** | Thompson Sampling for next batch | P2 |
| **Report Generator** | Performance + recommendation reports | P2 |
| **CLI Script** | `generate-ugc-ads.ts` end-to-end | P0 |

---

# 11. Implementation Roadmap

## Phase 1: Pipeline Wiring (Week 1)

- [ ] Create `src/pipeline/ugc-ad-pipeline.ts` orchestrator
- [ ] Wire Nano Banana stage (image generation)
- [ ] Wire Veo 3 stage (video animation with before/after frames)
- [ ] Wire Remotion composition stage
- [ ] Create `scripts/generate-ugc-ads.ts` CLI
- [ ] Test end-to-end: image → video → composed ad

**Deliverable:** Generate one UGC before/after ad from a product image

## Phase 2: Parametric System (Week 2)

- [ ] Define `AdParameters` schema with Zod
- [ ] Build `VariantGenerator` with matrix strategies
- [ ] Implement parameter ID encoding/decoding
- [ ] Integrate UTM builder for variant tagging
- [ ] Generate batch of 24 tagged variants

**Deliverable:** Generate 24 parametrically-tagged ad variants in one batch

## Phase 3: Meta Data Integration (Week 3)

- [ ] Build Meta Ads CSV parser
- [ ] Map Meta ad names → variant IDs → parameters
- [ ] Build `ParameterScorer` to rank parameter values
- [ ] Generate first optimization report

**Deliverable:** Ingest Meta data and see which parameters win

## Phase 4: Optimization Loop (Week 4)

- [ ] Implement Thompson Sampling optimization engine
- [ ] Build next-batch generator (70/20/10 exploit/explore/mutate)
- [ ] Create optimization report with recommendations
- [ ] Test full loop: Batch 1 → Meta data → Report → Batch 2

**Deliverable:** Automated optimization cycle

## Phase 5: UGC Templates & Polish (Week 5)

- [ ] Create new UGC-style Remotion compositions (testimonial, demo)
- [ ] Add more visual parameter options
- [ ] Meta Ads API integration (vs CSV)
- [ ] Dashboard for viewing parameter performance

**Deliverable:** Production-ready UGC ad factory

---

# 12. Testing Strategy

## 12.1 Unit Tests

- Parameter ID encoding/decoding roundtrip
- Variant matrix generation counts
- Parameter scoring math
- UTM builder integration

## 12.2 Integration Tests

- Nano Banana → generates valid before/after images
- Veo 3 → accepts before/after frames and returns video
- Remotion → renders composed ad from video + parameters
- Full pipeline → product image in, ad variants out

## 12.3 Optimization Tests

- Given mock Meta data, verify correct parameter scoring
- Given scores, verify next-batch generation follows 70/20/10 strategy
- Verify exploration covers untested parameter combinations

## 12.4 Golden Tests

- Render known parameter set → pixel-diff against reference
- Verify all Meta ad sizes render correctly
- Verify UTM tags are embedded in output metadata

---

# Appendix A: Copy Framework

## Hook Types with Examples

| Hook Type | Example Headlines |
|-----------|-------------------|
| **question** | "Still posting with watermarks?" / "Tired of blurry AI removals?" |
| **statement** | "Watermarks kill your engagement" / "Your content deserves better" |
| **shock** | "87% of creators lose followers over this" / "This ruins every post" |
| **curiosity** | "The tool 50K creators won't share" / "What if removal was instant?" |
| **social_proof** | "Join 50,000+ creators" / "Rated 4.9/5 by professionals" |
| **urgency** | "10 free credits — today only" / "Last chance: free tier closing" |

## CTA Types with Examples

| CTA Type | Example CTAs |
|----------|-------------|
| **action** | "Remove Watermark Now" / "Try It Free" / "Start Removing" |
| **benefit** | "Get Clean Photos" / "Get 10 Free Credits" / "Unlock HD Quality" |
| **urgency** | "Claim Free Credits Now" / "Start Before Offer Ends" |
| **curiosity** | "See the Difference" / "Watch It Work" |

---

# Appendix B: Meta Ads CSV Column Mapping

```typescript
const META_CSV_COLUMNS = {
  'Campaign name':        'campaignName',
  'Ad set name':          'adSetName',
  'Ad name':              'adName',        // Contains our variant ID
  'Impressions':          'impressions',
  'Link clicks':          'clicks',
  'CTR (link click-through rate)': 'ctr',
  'CPC (cost per link click)':     'cpc',
  'CPM (cost per 1,000 impressions)': 'cpm',
  'Amount spent':         'spend',
  'Results':              'conversions',
  'Cost per result':      'costPerConversion',
  'Video plays':          'videoViews',
  'ThruPlays':            'thruPlays',
  'Reach':                'reach',
  'Frequency':            'frequency',
};
```

---

*End of Document*
