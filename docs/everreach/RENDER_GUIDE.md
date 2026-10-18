# EverReach Ad Render Guide

Quick reference for generating EverReach static ads for Meta platforms.

---

## Quick Start

```bash
# Single ad with default props
npx remotion still EverReach-Instagram-Post output/ad.png

# Ad with custom headline
npx remotion still EverReach-Instagram-Post output/ad.png \
  --props='{"headline":"Your network is decaying","ctaText":"Fix it now"}'

# Batch render all angles
npx tsx scripts/render-everreach-ads.ts --all
```

---

## Available Compositions

### Base Templates (All Meta Sizes)

| ID | Size | Use |
|----|------|-----|
| `EverReach-Instagram-Post` | 1080×1080 | IG Feed |
| `EverReach-Instagram-Story` | 1080×1920 | IG/FB Story |
| `EverReach-Facebook-Post` | 1200×630 | FB Feed |
| `EverReach-Facebook-Story` | 1080×1920 | FB Story |

### Specialized Templates (Instagram Post Size)

| ID | Purpose |
|----|---------|
| `EverReach-PainPoint-Instagram` | Problem + urgency |
| `EverReach-Listicle-Instagram` | Numbered benefits |
| `EverReach-Comparison-Instagram` | Before/After |
| `EverReach-Stat-Instagram` | Big number + context |
| `EverReach-Question-Instagram` | Hook question |
| `EverReach-Objections-Instagram` | Handle objections |

### Story Variants

| ID | Purpose |
|----|---------|
| `EverReach-PainPoint-Story` | Pain point in story format |
| `EverReach-Listicle-Story` | Listicle in story format |

---

## Customizable Props

```typescript
{
  // Content
  headline: "Your network is quietly getting weaker",
  subheadline: "The fix is 60 seconds a day",
  ctaText: "Start with 1 person",
  
  // Awareness tracking
  awareness: "problem_aware",  // unaware, problem_aware, solution_aware, product_aware, most_aware
  belief: "too_busy",          // too_busy, hate_crm, feels_cringe, revenue_loss, privacy_first, already_organized
  
  // Visual
  theme: "gradient",           // gradient, dark, light, warm, custom
  primaryColor: "#6366f1",
  secondaryColor: "#8b5cf6",
  accentColor: "#f59e0b",
  
  // Background Image
  backgroundImageSrc: "public/assets/everreach/backgrounds/hero.jpg",
  backgroundOverlay: true,
  backgroundOverlayOpacity: 0.6,
  
  // Logo
  logoSrc: "public/assets/everreach/logos/logo.svg",
  logoPosition: "top-left",    // top-left, top-center, top-right, bottom-center, none
  
  // CTA Style
  ctaStyle: "pill",            // pill, rectangle, text, none
  
  // Layout
  layout: "centered",          // centered, top, bottom, split
  
  // Typography
  headlineSize: 56,
  subheadlineSize: 24,
}
```

---

## Rendering by Angle

### Phase A Testing Angles (20 total)

**Unaware (4)**
```bash
# UA_TIMING_01 - Timing Not Effort
npx remotion still EverReach-Instagram-Post output/UA_TIMING_01.png \
  --props='{"headline":"Most opportunities are lost to timing, not effort","subheadline":"The fix isn'\''t a sprint. It'\''s 60 seconds a day.","ctaText":"Start with 1 person"}'

# UA_FADE_02 - People Fade Out  
npx remotion still EverReach-Instagram-Post output/UA_FADE_02.png \
  --props='{"headline":"People don'\''t fall out. They fade out.","subheadline":"Not from conflict. From time.","ctaText":"Stay close on purpose"}'
```

**Problem Aware (4)**
```bash
# PA_SYSTEM_05 - Network vs System
npx remotion still EverReach-Instagram-Post output/PA_SYSTEM_05.png \
  --props='{"headline":"Your network isn'\''t small. Your system is.","subheadline":"If you have 200+ contacts, you'\''re already forgetting people.","ctaText":"Get a system"}'
```

**Solution Aware (4)**
```bash
# SA_WORDS_09 - Reminders Fail
npx remotion still EverReach-Instagram-Post output/SA_WORDS_09.png \
  --props='{"headline":"Reminders aren'\''t enough","subheadline":"They don'\''t tell you what to say.","ctaText":"Get the words too"}'
```

**Product Aware (5)**
```bash
# PD_OBJECTIONS_17 - Objection Killer
npx remotion still EverReach-Objections-Instagram output/PD_OBJECTIONS_17.png
```

**Most Aware (3)**
```bash
# MA_START_18 - Start Today
npx remotion still EverReach-Instagram-Post output/MA_START_18.png \
  --props='{"headline":"Start with 1 person today","subheadline":"No credit card. Cancel anytime.","ctaText":"Try it free"}'
```

---

## Batch Rendering

### Using the Render Script

```bash
# All angles, all formats
npx tsx scripts/render-everreach-ads.ts --all

# Filter by awareness level
npx tsx scripts/render-everreach-ads.ts --awareness unaware
npx tsx scripts/render-everreach-ads.ts --awareness product_aware

# Filter by template type
npx tsx scripts/render-everreach-ads.ts --template listicle
npx tsx scripts/render-everreach-ads.ts --template objection

# Specific angle
npx tsx scripts/render-everreach-ads.ts --angle UA_TIMING_01

# Specific format only
npx tsx scripts/render-everreach-ads.ts --format instagram_story
```

### Output Structure

```
output/everreach-ads/
├── instagram_post/
│   ├── UA_TIMING_01_ig-post.png
│   ├── UA_FADE_02_ig-post.png
│   └── ...
├── instagram_story/
│   ├── UA_TIMING_01_ig-story.png
│   └── ...
├── facebook_post/
│   ├── UA_TIMING_01_fb-post.png
│   └── ...
└── manifest.json
```

---

## With Background Images

```bash
# Add background image with overlay
npx remotion still EverReach-Instagram-Post output/bg-ad.png \
  --props='{"headline":"Never let a relationship go cold","backgroundImageSrc":"public/assets/everreach/backgrounds/office.jpg","backgroundOverlay":true,"backgroundOverlayOpacity":0.7}'
```

Place background images in:
- `public/assets/everreach/backgrounds/`

---

## Output Formats

```bash
# PNG (default, best quality)
npx remotion still EverReach-Instagram-Post output/ad.png

# JPEG (smaller file)
npx remotion still EverReach-Instagram-Post output/ad.jpg --image-format=jpeg

# WebP (modern format)
npx remotion still EverReach-Instagram-Post output/ad.webp --image-format=webp
```

---

## UTM Tracking Convention

For Meta Ads Manager, use this naming:

```
Campaign: ER_PhaseA_Broad
Ad Set:   ER_{awareness}_test
Ad Name:  ER_{angle_id}_{format}

utm_campaign=everreach_phasea
utm_content={angle_id}_{format}
utm_term={belief_cluster}
```

Example: `ER_UA_TIMING_01_ig-post`

---

## File Locations

| Path | Purpose |
|------|---------|
| `src/compositions/everreach/` | Ad components |
| `src/compositions/everreach/config.ts` | Colors, sizes, copy bank |
| `src/compositions/everreach/angles.ts` | Angle matrix |
| `scripts/render-everreach-ads.ts` | Batch render script |
| `docs/everreach/PRD_EVERREACH_ADS.md` | Full PRD |
| `output/everreach-ads/` | Rendered output |

---

*Last updated: January 2, 2026*
