# UGC Ad Platform — Product Requirements Document

**Version:** 1.0  
**Date:** February 8, 2026  
**Status:** Active Development  
**Owner:** Isaiah Dupree

---

## 1. Vision

An end-to-end AI-powered platform that generates, tests, and optimizes UGC-style ad creatives at scale. Input a product → get production-ready image and video ads across every Meta placement → ingest performance data → automatically generate the next optimized batch. The full creative testing loop — from ideation to winning creative — compressed from weeks to hours.

---

## 2. Problem Statement

| Pain Point | Current Reality | Our Solution |
|---|---|---|
| **Creative production is slow** | 2-5 days per ad set, $500-2K per round of creatives | Generate 12-24 variants in <5 minutes |
| **Testing is manual & biased** | Marketers guess which hooks/templates work | Parametric matrix ensures systematic coverage |
| **Optimization is reactive** | Weekly CSV exports, manual spreadsheet analysis | Auto-ingest Meta data, Thompson Sampling picks next batch |
| **Creative fatigue goes undetected** | CTR drops 40% before anyone notices | Multi-period trend detection flags fatigue early |
| **No institutional memory** | Learnings lost between campaigns | Parameter scoring persists across batches |

---

## 3. Target Users

| Persona | Description | Key Need |
|---|---|---|
| **Solo DTC Founder** | Runs their own Meta ads, $1K-10K/mo spend | Fast creative generation without hiring designers |
| **Performance Marketer** | Manages 5-20 ad accounts, needs volume | Scale creative testing across multiple products |
| **Creative Agency** | Produces ads for clients, needs efficiency | White-label output, multi-brand support |
| **Growth Team** | In-house team at Series A-C startup | Data-driven creative optimization loop |

---

## 4. What's Built (Current State)

### 4.1 Pipeline Engine (16 modules)

```
Product Input → Nano Banana (Gemini) → Veo 3.1 → Variant Generator → Remotion Compose
                 ↓                       ↓              ↓                    ↓
          Before/After Images    8s Animated Video   Parametric Matrix   PNG Stills + MP4 Video Ads
```

| Stage | Technology | Status |
|---|---|---|
| **Image Generation** | Gemini `gemini-2.5-flash-image` | ✅ Production |
| **Video Animation** | Veo `3.1-generate-preview` | ✅ Production |
| **Variant Generation** | Parametric engine (full_cross, latin_square, random_sample) | ✅ Production |
| **Ad Composition** | Remotion 4.x (stills at frame 70 + 8s MP4 video ads) | ✅ Production |
| **Meta CSV Export** | Bulk upload CSV + UTM tracking CSV | ✅ Production |
| **Performance Ingestion** | Meta Ads Manager CSV parser | ✅ Production |
| **Parameter Scoring** | Welch's t-test, composite scoring, confidence intervals | ✅ Production |
| **Optimization Engine** | Thompson Sampling, significance-aware exploit/explore | ✅ Production |
| **Fatigue Detection** | Multi-period trend analysis, heuristic scoring | ✅ Production |
| **Batch Comparison** | A vs B comparison + sample size calculator | ✅ Production |
| **Checkpoint/Resume** | Full pipeline state serialization | ✅ Production |
| **Preview Gallery** | HTML gallery with thumbnails | ✅ Production |

### 4.2 Ad Templates (7 + Video Wrapper)

| Template | Description | Use Case |
|---|---|---|
| `before_after` | Side-by-side comparison | Transformation products |
| `testimonial` | Quote + avatar + star rating | Social proof |
| `product_demo` | 3-step workflow showcase | SaaS / tool demos |
| `problem_solution` | Two-panel pain → relief | Problem-aware audiences |
| `stat_counter` | Big numbers (50K+, 4.9★) | Trust / social proof |
| `feature_list` | Checklist with ✓/✕ and NEW badges | Competitive comparison |
| `urgency` | Countdown timer + price + spots left | FOMO / limited offers |
| `video_ad_wrapper` | Intro (1.5s) → Template (4s) → Outro/CTA (2.5s) + SFX | All templates as 8s video |

Each template renders across all Meta placements:

| Placement | Dimensions | Platform |
|---|---|---|
| Feed Square | 1080×1080 | Instagram / Facebook |
| Feed Portrait | 1080×1350 | Instagram 4:5 |
| Story / Reels | 1080×1920 | Instagram / TikTok |
| FB Feed | 1200×628 | Facebook |

### 4.3 API Server (15 UGC endpoints)

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/ugc/generate` | POST | Trigger a new ad generation pipeline |
| `/api/v1/ugc/optimize` | POST | Score parameters from Meta performance data |
| `/api/v1/ugc/next-batch` | POST | Generate optimized next batch via Thompson Sampling |
| `/api/v1/ugc/batches` | GET | List all batches |
| `/api/v1/ugc/batches/:id` | GET | Get batch details |
| `/api/v1/ugc/batches/:id/export-csv` | GET | Export Meta Ads Manager upload CSV |
| `/api/v1/ugc/batches/:id/gallery` | GET | Generate HTML gallery |
| `/api/v1/ugc/batches/:id/fatigue` | GET | Run fatigue detection |
| `/api/v1/ugc/batches/:id/significance` | GET | Statistical significance tests |
| `/api/v1/ugc/batches/:id/budget` | GET | Budget allocation recommendations |
| `/api/v1/ugc/compare` | POST | Compare two batches A vs B |
| `/api/v1/ugc/sample-size` | POST | Calculate required sample size |
| `/api/v1/capabilities` | GET | List platform capabilities |
| `/api/v1/health` | GET | Health check |
| `/api/v1/ready` | GET | Readiness check |

### 4.4 Parametric System

Every ad variant is tagged with a unique combination of:

| Parameter | Values | Purpose |
|---|---|---|
| **Template** | 7 types | Visual format |
| **Hook Type** | question, statement, shock, curiosity, social_proof, urgency | Opening angle |
| **Awareness Level** | unaware, problem_aware, solution_aware, product_aware, most_aware | Funnel stage |
| **CTA Type** | action, benefit, urgency, curiosity | Call-to-action style |
| **Color Scheme** | dark, light | Visual tone |
| **Character Style** | realistic, cartoon, lifestyle, minimal | Image style |

This produces a testable matrix where every parameter's impact on performance (CTR, ROAS, conversions) can be isolated and measured.

### 4.5 Test Coverage

- **114 E2E tests** across 12 test sections
- Real API integration verified (Gemini + Veo + Remotion)
- Multiple successful production pipeline runs

---

## 5. Roadmap

### Phase 1: Dynamic Copy Generation ⬜ (Next)

**Goal:** Replace hardcoded copy with AI-generated, product-aware text.

| Feature | Description | Priority |
|---|---|---|
| **AI Headline Generator** | Gemini generates 5-10 headlines per hook type, tailored to product | P0 |
| **AI Subheadline Generator** | Product-aware subheadlines matched to awareness level | P0 |
| **AI CTA Generator** | Context-aware CTAs (e.g., "Remove Watermarks Free" not "Try It Free") | P0 |
| **Testimonial Quote Generator** | Generate realistic testimonial quotes per persona | P1 |
| **Feature List Generator** | Auto-extract features from product description | P1 |
| **Stat Generator** | Generate plausible social proof stats from product context | P1 |
| **Copy A/B Variants** | Multiple copy options per template for testing | P1 |
| **Tone Control** | casual, professional, bold, playful | P2 |

**Technical approach:**
- New `copy-generation-stage.ts` in pipeline, runs before variant generation
- Uses Gemini with structured output (JSON mode) to produce a `GeneratedCopyBank`
- Replaces the static `DEFAULT_COPY_BANK` with product-tailored copy
- Each hook type × awareness level gets its own set of headlines/subs/CTAs
- Template-specific content (feature lists, stats, testimonial quotes) also generated

**API addition:**
- `POST /api/v1/ugc/generate-copy` — generate copy bank for a product without running full pipeline

---

### Phase 2: Frontend Dashboard ⬜

**Goal:** React web UI for managing the full creative testing lifecycle.

| Feature | Description | Priority |
|---|---|---|
| **Batch Browser** | List all batches, search/filter by product, status, date | P0 |
| **Pipeline Launcher** | Form to configure and trigger new pipeline runs | P0 |
| **Ad Gallery** | Grid view of composed ads with zoom, video playback, size filtering | P0 |
| **Performance Dashboard** | Charts for CTR, ROAS, spend by parameter; winner highlights | P0 |
| **Optimization View** | Visualize Thompson Sampling decisions, exploit/explore split | P1 |
| **Fatigue Monitor** | Timeline view of CTR decay, auto-flagged creatives | P1 |
| **Batch Comparison** | Side-by-side Batch A vs B with statistical significance | P1 |
| **CSV Upload** | Drag-and-drop Meta CSV import | P1 |
| **Export Center** | Download composed ads, Meta upload CSVs, UTM sheets | P1 |
| **Real-time Pipeline Status** | WebSocket/SSE updates for running pipelines | P2 |
| **Settings** | API keys, brand config, default templates | P2 |

**Technical approach:**
- Next.js 14 (App Router) frontend in `/dashboard`
- TailwindCSS + shadcn/ui components
- Connects to existing API server on port 3100
- Recharts or Tremor for data visualization
- File-based storage initially (reads `output/ugc-ads/` directly), Supabase for persistence later

**Key pages:**
```
/                     → Dashboard overview (recent batches, quick stats)
/batches              → Batch list with filters
/batches/[id]         → Batch detail (gallery, parameters, performance)
/batches/[id]/gallery → Full-screen gallery with video playback
/create               → New pipeline launcher form
/optimize             → Optimization view (scores, recommendations)
/compare              → Batch A vs B comparison
/settings             → Brand config, API keys, preferences
```

---

### Phase 3: Multi-Product Campaigns ⬜

**Goal:** Manage ad pipelines across multiple products with campaign-level tracking.

| Feature | Description | Priority |
|---|---|---|
| **Product Registry** | CRUD for products (name, description, brand, images, prompts) | P0 |
| **Campaign Management** | Group batches into campaigns, track across iterations | P0 |
| **Cross-Product Insights** | "Question hooks outperform across ALL your products" | P1 |
| **Scheduled Batches** | Cron-like scheduling: "Generate fresh batch every Monday" | P1 |
| **Template Recommendations** | "stat_counter performs 2.3x better for SaaS products" | P2 |
| **Budget Optimizer** | Cross-campaign budget allocation based on ROAS | P2 |
| **Campaign Templates** | Save & reuse campaign configurations | P2 |

**Data model additions:**
```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  brand: BrandConfig;
  scenes: SceneConfig;
  defaultMatrix: Partial<VariantMatrix>;
  tags: string[];
  createdAt: string;
}

interface Campaign {
  id: string;
  name: string;
  productId: string;
  batches: string[];           // batch IDs
  goal: 'ctr' | 'roas' | 'conversions';
  budget: { daily: number; total: number };
  schedule?: CronSchedule;
  status: 'draft' | 'active' | 'paused' | 'completed';
  insights: CampaignInsights;
}
```

---

### Phase 4: Enhanced Gallery & Preview ⬜

**Goal:** Interactive, shareable creative review experience.

| Feature | Description | Priority |
|---|---|---|
| **Video Playback** | Inline MP4 playback with play/pause in gallery | P0 |
| **Side-by-Side Compare** | Pick any 2 variants and compare at same size | P0 |
| **Filter & Sort** | Filter by template, hook type, size; sort by performance | P0 |
| **Shareable Links** | Public gallery URL for client/team review | P1 |
| **Annotation & Comments** | Pin comments on specific ads for team feedback | P1 |
| **Approval Workflow** | Mark ads as approved/rejected before uploading to Meta | P1 |
| **Mockup Preview** | See ads in Instagram/Facebook feed mockup context | P2 |
| **Thumbnail Sheet** | Auto-generated contact sheet PDF of all variants | P2 |

---

### Phase 5: Advanced AI Features ⬜

**Goal:** Deeper AI integration for creative intelligence.

| Feature | Description | Priority |
|---|---|---|
| **Creative Scoring** | AI rates ad quality before running (predicted CTR) | P1 |
| **Competitor Analysis** | Analyze competitor ads for hook/template patterns | P1 |
| **Auto-Iteration** | System autonomously generates next batch when fatigue detected | P1 |
| **Multi-Language** | Generate ads in multiple languages from single input | P2 |
| **Voice-Over Ads** | ElevenLabs/OpenAI TTS for video ad narration | P2 |
| **Auto-Captioning** | Whisper-based captions on video ads | P2 |
| **Creative Brief AI** | Describe your product in 1 sentence → full pipeline config generated | P2 |

---

### Phase 6: Integrations & Distribution ⬜

**Goal:** Direct platform connections for zero-friction workflow.

| Integration | Description | Priority |
|---|---|---|
| **Meta Ads API** | Direct upload to Meta Ads Manager (no CSV) | P0 |
| **TikTok Ads** | Adapt sizes + upload to TikTok Ads Manager | P1 |
| **Google Ads** | YouTube/Display ad formats | P2 |
| **Slack/Discord** | Notify on batch completion, fatigue alerts | P1 |
| **Zapier/Webhooks** | Trigger external workflows on pipeline events | P2 |
| **S3/GCS Storage** | Cloud storage for assets (replace local filesystem) | P1 |
| **Supabase Backend** | Persistent storage for products, campaigns, batches | P1 |

---

## 6. Technical Architecture

### Current Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLI / API Server                          │
│  scripts/generate-ugc-ads.ts    src/service/server.ts (:3100)   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    Pipeline Orchestrator                          │
│  src/pipeline/ugc-ad-pipeline.ts                                │
│  Checkpoint/Resume · Stage Management · Batch Building           │
└──┬───────────┬───────────┬───────────┬──────────────────────────┘
   │           │           │           │
   ▼           ▼           ▼           ▼
┌──────┐  ┌──────┐  ┌──────────┐  ┌────────────────┐
│Gemini│  │Veo 3 │  │ Variant  │  │    Remotion     │
│Image │  │Video │  │Generator │  │  Compose Stage  │
│ Gen  │  │Anim  │  │(Matrix)  │  │ (Stills + MP4)  │
└──────┘  └──────┘  └──────────┘  └────────────────┘
                                         │
                                         ▼
                               ┌────────────────────┐
                               │  7 UGC Templates    │
                               │  + Video Ad Wrapper │
                               │  (Remotion TSX)     │
                               └────────────────────┘
                                         │
                           ┌─────────────┼─────────────┐
                           ▼             ▼             ▼
                     ┌──────────┐  ┌──────────┐  ┌──────────┐
                     │Meta CSV  │  │Parameter │  │Fatigue   │
                     │Export +  │  │Scorer +  │  │Detector +│
                     │Ingester  │  │Optimizer │  │Comparator│
                     └──────────┘  └──────────┘  └──────────┘
```

### Target Architecture (with Dashboard)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Dashboard (:3000)                    │
│  Batch Browser · Gallery · Performance Charts · Pipeline Launcher│
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API
┌──────────────────────────▼──────────────────────────────────────┐
│                    API Server (:3100)                             │
│  15 UGC Endpoints · Job Queue · WebSocket Status Updates         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    Pipeline Engine                                │
│  Copy Generation · Image Gen · Video Anim · Compose · Optimize   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    Storage Layer                                  │
│  Local FS (dev) → Supabase + S3 (prod)                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    External Services                              │
│  Gemini · Veo 3.1 · Meta Ads API · Slack · TikTok               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Key Metrics

| Metric | Target | Current |
|---|---|---|
| **Variants per batch** | 12-24 | 12 (configurable) |
| **Pipeline time (stills)** | <3 min for 12 variants | ~2 min |
| **Pipeline time (stills + video)** | <10 min for 12 variants | ~8 min |
| **Template count** | 10+ | 7 |
| **Supported placements** | 6 | 6 (all Meta sizes) |
| **Test coverage** | >100 tests | 114 |
| **Video ad duration** | 6-15s configurable | 8s |
| **Video file size** | <1MB per ad | ~750KB |
| **Optimization lift** | >20% CTR improvement batch-over-batch | Measured per campaign |

---

## 8. Tech Stack

| Component | Technology | Notes |
|---|---|---|
| **Video Engine** | Remotion 4.x | Compositions rendered via CLI |
| **Language** | TypeScript | Full stack |
| **AI Image Gen** | Google Gemini (`gemini-2.5-flash-image`) | Character-consistent before/after |
| **AI Video Gen** | Google Veo 3.1 | 8s animated transitions |
| **Frontend** | Next.js 14 + TailwindCSS + shadcn/ui | Planned |
| **API Server** | Node.js HTTP server | Port 3100 |
| **Storage** | Local filesystem → Supabase | Migration planned |
| **Optimization** | Thompson Sampling + Welch's t-test | Custom implementation |
| **Schema Validation** | Zod | All pipeline types validated |

---

## 9. Environment & Configuration

### Required API Keys

| Key | Service | Required For |
|---|---|---|
| `GOOGLE_API_KEY` | Google AI | Gemini image gen + Veo video gen |
| `REMOTION_SERVICE_API_KEY` | API Server | Server authentication (default: `dev-api-key`) |

### Pipeline Config

```typescript
interface UGCPipelineConfig {
  product: { name, description, imagePath?, websiteUrl? };
  brand: { name, logoUrl?, primaryColor, accentColor, fontFamily };
  scenes: { beforePrompt, afterPrompt, characterStyle };
  matrix: {
    templates: TemplateType[];       // Which templates to use
    hookTypes: HookType[];           // Which hooks to test
    awarenessLevels: AwarenessLevel[];
    ctaTypes: CtaType[];
    sizes: AdSize[];                 // Which placements
    strategy: 'full_cross' | 'latin_square' | 'random_sample';
    maxVariants: number;             // Cap total variants
  };
  copyBank: CopyBank;               // Headlines, subs, CTAs per type
  outputDir: string;
  dryRun?: boolean;
}
```

### CLI Usage

```bash
# Generate ads (stills only)
npx tsx scripts/generate-ugc-ads.ts \
  --product "MyApp" \
  --brand "MyBrand" \
  --before-prompt "Person frustrated with old tool" \
  --after-prompt "Person happy with MyApp" \
  --templates stat_counter,urgency,feature_list \
  --max-variants 6

# Generate ads with video output
npx tsx scripts/generate-ugc-ads.ts \
  --product "MyApp" \
  --templates before_after,testimonial \
  --max-variants 4 \
  --video

# Resume interrupted batch
npx tsx scripts/generate-ugc-ads.ts --resume output/ugc-ads/b191788

# Dry run (variants only, no rendering)
npx tsx scripts/generate-ugc-ads.ts --dry-run --max-variants 24
```

---

## 10. Competitive Landscape

| Competitor | Strengths | Weakness vs Us |
|---|---|---|
| **AdCreative.ai** | Large template library, AI copy | No parametric testing, no optimization loop |
| **Pencil (by Brandtech)** | AI video generation | Expensive, no self-hosted option |
| **Motion (formerly Marpipe)** | Multivariate testing | Manual creative production |
| **Canva Bulk Create** | Easy UI, brand kits | No AI generation, no performance feedback |
| **Predis.ai** | Social media focus | No video ads, no optimization |

**Our differentiators:**
1. **Full loop** — Generate → Test → Measure → Optimize → Repeat (automated)
2. **Parametric testing** — Every parameter isolated and scored
3. **Self-hosted** — No vendor lock-in, runs on your infrastructure
4. **AI-native** — Gemini images + Veo video, not just templates
5. **Statistical rigor** — Welch's t-test, Thompson Sampling, significance-aware decisions

---

## 11. Success Criteria

### MVP (Current + Phase 1)
- [ ] Generate product-aware copy automatically (no more hardcoded text)
- [x] 7+ ad templates across all Meta placements
- [x] Video ad output (8s MP4 with intro/outro)
- [x] Full optimization loop (generate → score → next batch)
- [x] 100+ automated tests

### V1.0 (Through Phase 3)
- [ ] Web dashboard for non-technical users
- [ ] Multi-product campaign management
- [ ] Direct Meta Ads API integration
- [ ] <5 min from product input to 12 ready-to-upload ad variants
- [ ] Measurable CTR lift of >15% batch-over-batch

### V2.0 (Through Phase 6)
- [ ] Multi-platform (Meta + TikTok + Google)
- [ ] Voice-over video ads
- [ ] Autonomous optimization (auto-generate when fatigue detected)
- [ ] Team collaboration (comments, approvals, sharing)

---

*This document reflects the current state of the platform and planned roadmap. Priorities may shift based on user feedback and market signals.*
