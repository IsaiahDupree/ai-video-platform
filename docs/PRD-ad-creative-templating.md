# PRD: AI-Powered Ad Creative Templating System with Remotion

**Version**: 2.0.0  
**Last Updated**: January 2026  
**Status**: Active Development

---

## Executive Summary

A comprehensive system for analyzing existing static ads (from images or Canva), extracting pixel-accurate layout information with AI, creating reusable templates, and generating variants using Remotion. The system enables users to:

1. **Ingest** a reference static ad (PNG/JPG) or Canva design
2. **Extract** a high-fidelity layout template with AI analysis to the "minutest detail" - text fields, image slots, shapes, colors, fonts, alignment, layer order, and pixel-depth placement
3. **Recreate** the same ad layout with complete fidelity
4. **Generate variants** by swapping copy and/or images on the same template
5. **Test** to verify recreation accuracy via golden image comparison

---

## 1. What We're Building

### Goal

A system where a user can:

1. **Upload a reference static ad** (PNG/JPG) or select a Canva design they own
2. **System extracts a high-fidelity layout template**: text boxes, image slots, shapes, colors, fonts, alignment, and layer order
3. **System generates**:
   - A **Template JSON** (the "single source of truth")
   - A **Remotion Still renderer** that consumes that JSON as props
4. **User can generate variants** by swapping:
   - Copy only (same images)
   - Images only (same copy)
   - Both
5. **Tests guarantee**:
   - Template recreation accuracy vs reference
   - Constraints (no overflow, safe margins, alignment rules)
   - Deterministic rendering

### Key Differentiators

- **Pixel-depth placement**: Extract text field positions to exact pixel coordinates
- **Full fidelity selectors**: Every element has a stable selector path (e.g., `headline.rect.x`, `hero_image.bind.assetKey`)
- **AI-powered analysis**: When only an image is available, AI extracts layout with confidence scoring
- **Template reusability**: One template, infinite variants with different copy/images

> **IP Note**: Recreating someone else's copyrighted ad 1:1 to reuse commercially can be IP-infringing. This system is framed for revamping into your own brand (your assets, your fonts, your copy, your logos), while achieving "same layout, different creative" when you have rights to the source.

---

## Why Remotion

- Remotion can define still images (not just video) using `<Still />`
- Render single stills via `renderStill()` from `@remotion/renderer`
- Full programmatic control over layout, styling, and composition

---

## System Architecture

### Components

| Component | Description |
|-----------|-------------|
| **A) Ingestion** | Input types: `reference_image` (PNG/JPG) or `canva_design_id` |
| **B) Layout Extraction** | AI + heuristics → outputs `TemplateDSL` (JSON) |
| **C) Template Engine** | Converts `TemplateDSL` → Remotion component props |
| **D) Remotion Renderer** | `<Still />` compositions for each ad size |
| **E) Variant Generator** | `TemplateDSL` + `VariantSpec` → final props JSON |
| **F) QA & Tests** | Golden-image diff, geometry, overflow, determinism tests |

---

## Template DSL Specification (v1)

The format is:
- **Pixel-native**: everything in px for a given canvas size
- **Layered**: z-index order
- **Bindable**: copy/image variables
- **Constraint-aware**: fit text, alignment, lock aspect ratio

### Example Template

```json
{
  "templateId": "tpl_1080_square_v1",
  "canvas": { "width": 1080, "height": 1080, "bgColor": "#0b0f1a" },
  "layers": [
    {
      "id": "bg_shape",
      "type": "shape",
      "z": 0,
      "rect": { "x": 0, "y": 0, "w": 1080, "h": 1080 },
      "shape": { "kind": "rect", "fill": "#0b0f1a", "radius": 0 }
    },
    {
      "id": "hero_image",
      "type": "image",
      "z": 10,
      "rect": { "x": 540, "y": 120, "w": 420, "h": 420 },
      "image": { "fit": "cover", "anchor": "center" },
      "bind": { "assetKey": "hero" },
      "constraints": { "lockAspect": true }
    },
    {
      "id": "headline",
      "type": "text",
      "z": 20,
      "rect": { "x": 80, "y": 160, "w": 420, "h": 220 },
      "text": {
        "fontFamily": "Inter",
        "fontWeight": 800,
        "fontSize": 64,
        "lineHeight": 1.05,
        "letterSpacing": -1,
        "color": "#ffffff",
        "align": "left",
        "valign": "top"
      },
      "bind": { "textKey": "headline" },
      "constraints": {
        "mode": "fitTextOnNLines",
        "maxLines": 3,
        "minFontSize": 36
      }
    },
    {
      "id": "cta_button",
      "type": "shape",
      "z": 30,
      "rect": { "x": 80, "y": 720, "w": 420, "h": 110 },
      "shape": { "kind": "rect", "fill": "#5B78C7", "radius": 28 }
    },
    {
      "id": "cta_text",
      "type": "text",
      "z": 31,
      "rect": { "x": 80, "y": 720, "w": 420, "h": 110 },
      "text": {
        "fontFamily": "Inter",
        "fontWeight": 700,
        "fontSize": 38,
        "lineHeight": 1.0,
        "color": "#ffffff",
        "align": "center",
        "valign": "middle"
      },
      "bind": { "textKey": "cta" },
      "constraints": { "mode": "fitText", "minFontSize": 24 }
    }
  ],
  "bindings": {
    "text": {
      "headline": "default headline",
      "cta": "learn more"
    },
    "assets": {
      "hero": "https://cdn.example.com/hero.png"
    }
  },
  "meta": {
    "source": { "type": "reference_image", "sha256": "..." },
    "extraction": { "confidence": 0.86 }
  }
}
```

### Layer Selectors

Instead of DOM selectors, use stable layer selectors:
- `headline.rect.x`
- `headline.text.fontSize`
- `hero_image.bind.assetKey`

---

## Ingestion Paths

### Path A (Best): Canva Design → True Layer Coordinates

Using Canva's Design Editing API:
- Open design session with `openDesign`
- Get page snapshot containing elements
- Elements include geometry (`top`, `left`, `width`) and text formatting
- Export to PNG/JPG for golden reference tests

### Path B: Reference PNG/JPG → AI Layout Extraction

When only a flattened image is available:
1. Detect canvas size
2. OCR all text (with bounding boxes)
3. Infer text grouping (headline vs body vs CTA)
4. Detect image regions
5. Detect shapes (buttons, banners, cards)
6. Infer z-order

Design for:
- Human-in-the-loop corrections
- Confidence scoring + "needs review" flags per layer

---

## AI Extraction Specification

### Output Requirements

- Canvas width/height
- Ordered layers with:
  - `type`: text | image | shape
  - Bounding `rect`: x/y/w/h (px)
  - Style properties
  - Binding key (headline, cta, hero, logo)
  - Constraints

### Two-Pass Extraction

| Pass | Purpose |
|------|---------|
| **Pass 1: Literal** | "What is on the image and where is it?" |
| **Pass 2: Semantic** | "Which elements are variable vs fixed?" Name slots, infer constraints |

### Confidence Model

Store per-layer confidence:
- OCR confidence
- Style inference confidence
- Shape classification confidence

---

## Remotion Implementation Guide

### 6.1 Define Still Compositions

Use `<Still />` for static ad creatives. Define one Still per size:
- 1080×1080 (square)
- 1080×1920 (story)
- 1200×628 (landscape)

### 6.2 Render Stills Server-Side

Use `renderStill()` from `@remotion/renderer` to output PNG.

### 6.3 Asset Components

Use `<Img />` to ensure assets are fully loaded during rendering.

### 6.4 Text Fitting & Measurement

Use `@remotion/layout-utils`:
- `measureText()`
- `fillTextBox()`
- `fitText()`
- `fitTextOnNLines()`

**Gotchas**:
- Layout utils run in the browser (not Node/Bun) for some APIs
- Measure only after fonts are loaded

### 6.5 Font Loading Strategy

- Pin exact weights needed per template
- Pre-bundle fonts (preferred) or cache them
- Fail gracefully to fallback fonts

### 6.6 Delay Rendering

Use `delayRender()` / `continueRender()` to prevent rendering before fonts/data/assets are ready.

### 6.7 Prop Schemas

Define a Zod schema for template props for visual editing in Remotion Studio.

### 6.8 Passing Props

Use `--props` CLI flag with inline JSON or JSON file path for variant rendering.

---

## Template Engine Design

### Rendering Model

Render layers with:
- `position: absolute`
- `left/top/width/height` in px
- Deterministic font sizing rules

### Component Structure

```
src/templates/
├── TemplateRenderer.tsx      # Generic renderer, loops through layers[]
├── layers/
│   ├── TextLayer.tsx
│   ├── ImageLayer.tsx
│   └── ShapeLayer.tsx
└── comps/
    └── AdStill1080.tsx       # Selects template + binds props
```

### Constraint Enforcement

**Text layers**:
- `fitTextOnNLines()` for headlines
- `fillTextBox()` for overflow detection

**Image layers**:
- Enforce aspect locks (cover vs contain)
- Anchor points

---

## Variant Generation

### VariantSpec

```typescript
interface VariantSpec {
  templateId: string;
  overrides: {
    text?: Record<string, string>;
    assets?: Record<string, string>;
  };
}
```

### Experiment Modes

| Mode | Description |
|------|-------------|
| **Copy Test** | Change headline, subhead, cta (constant imagery) |
| **Image Test** | Swap hero, product, background (constant copy) |

---

## Testing & QA Harness

### 9.1 Golden Render Recreation Test

1. Ingest reference → TemplateDSL
2. Render still via `renderStill()`
3. Compare output PNG vs reference PNG using pixel diff

**Acceptance thresholds**:
- Mean pixel delta < 2.0
- Max pixel delta < 20 (antialiasing tolerance)
- % pixels changed < 0.5%

### 9.2 Layer Geometry Tests

- Assert each extracted layer rect is within ±1px of source geometry
- Assert internal invariants (alignment, margins)

### 9.3 Text Overflow Tests

- Run overflow detection via `fillTextBox()`
- Fail test if overflow occurs in strict templates

### 9.4 Deterministic Rendering Tests

- Render same props twice
- Ensure identical output hash

### 9.5 Font-Loading Regression Tests

- Render known template with fonts
- Verify measured text dimensions don't change unexpectedly

---

## Implementation Milestones

### Milestone 1 — Remotion Still Renderer with TemplateDSL ✅
- [x] Implement `TemplateRenderer` for text/image/shape
- [x] Render 1080×1080 from hand-made DSL
- [x] Add `--props` pipeline for variants
- [x] Zod schema with full type safety
- [x] Variant generator with copy/image test modes

### Milestone 2 — Text Fitting + Font Strategy 🚧
- [ ] Integrate `@remotion/layout-utils`
- [ ] Add font loading discipline + `delayRender()`
- [ ] Add overflow warnings
- [ ] Implement `fitText`, `fitTextOnNLines`, `fillTextBox` modes

### Milestone 3 — Golden Tests
- [ ] Baseline reference image
- [ ] Render output and pixel-diff (pixelmatch/resemble)
- [ ] CI pass/fail gates
- [ ] Determinism tests (render twice, compare hashes)

### Milestone 4 — AI Layout Extraction
- [ ] Vision model integration (GPT-4V / Claude Vision)
- [ ] Two-pass extraction (literal → semantic)
- [ ] OCR with bounding boxes
- [ ] Confidence scoring per layer
- [ ] Human-in-the-loop correction UI

### Milestone 5 — Canva Ingestion (Highest Fidelity)
- [ ] Read design via Design Editing API
- [ ] Export PNG for golden references
- [ ] Produce TemplateDSL from Canva elements

---

## AI Extraction Deep Dive

### Two-Pass Extraction Model

**Pass 1: Literal Reconstruction**
- "What is on the image and where is it?"
- Detect all visual elements with bounding boxes
- OCR all text content
- Identify colors, shapes, images

**Pass 2: Semantic Templating**
- "Which elements are variable vs fixed?"
- Name slots: `headline`, `subhead`, `cta`, `logo`, `hero`
- Infer constraints: max lines, min font size, text-fit mode
- Determine z-order from visual overlaps

### Confidence Model

Store per-layer confidence:
- **OCR confidence**: How certain is the text content?
- **Style inference confidence**: Font family detection is often lowest
- **Shape classification confidence**: Is it a button, banner, or card?

Use confidence to decide:
- `>0.85` → Auto-approve template
- `0.60-0.85` → Suggest with "needs review" flags
- `<0.60` → Require manual review

### AI Extraction Prompt Structure

```
Analyze this static ad image and extract a pixel-accurate template.

For each element, provide:
1. Element type (text/image/shape)
2. Bounding box (x, y, width, height in pixels)
3. Semantic role (headline, subhead, cta, hero, logo, background)
4. Style properties:
   - Text: font family, weight, size, color, alignment
   - Image: fit mode, aspect ratio
   - Shape: fill color, border radius, stroke
5. Z-order (layer depth)
6. Confidence score (0-1)

Output as JSON matching the TemplateDSL schema.
```

---

## File Structure (Proposed)

```
src/
├── ad-templates/
│   ├── schema/
│   │   └── template-dsl.ts       # Zod schemas & TypeScript types
│   ├── renderer/
│   │   ├── TemplateRenderer.tsx  # Main renderer component
│   │   ├── layers/
│   │   │   ├── TextLayer.tsx
│   │   │   ├── ImageLayer.tsx
│   │   │   └── ShapeLayer.tsx
│   │   └── utils/
│   │       ├── text-fitting.ts
│   │       └── font-loader.ts
│   ├── extraction/
│   │   ├── ai-extractor.ts       # AI-based layout extraction
│   │   ├── canva-extractor.ts    # Canva API integration
│   │   └── confidence-scorer.ts
│   ├── variants/
│   │   └── variant-generator.ts
│   └── compositions/
│       ├── AdStill1080Square.tsx
│       ├── AdStill1080Story.tsx
│       └── AdStill1200Landscape.tsx
├── templates/                     # Template JSON files
│   └── examples/
│       └── sample-template.json
└── tests/
    ├── golden/
    │   ├── references/            # Reference images
    │   └── golden-diff.test.ts
    ├── overflow.test.ts
    └── determinism.test.ts
```
