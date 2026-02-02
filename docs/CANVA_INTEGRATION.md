# Canva Integration Guide

Complete guide for ingesting Canva designs and converting them to Remotion templates.

## Overview

The Canva integration allows you to:

1. **Read design structure** via Canva Apps SDK Design Editing API
2. **Convert to TemplateDSL** with semantic role detection (headline, CTA, etc.)
3. **Export reference PNG** via Canva Connect Export API for golden testing
4. **Store templates** with metadata, reference images, and source tracking

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Canva Design (source)                     │
│  - Pages, elements, text, images, shapes                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Canva Apps SDK / Connect API                    │
│  - Read design structure (openDesign)                        │
│  - Export to PNG/JPG (createExportJob)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            Canva-to-TemplateDSL Converter                    │
│  - Pass 1: Literal reconstruction (what/where)               │
│  - Pass 2: Semantic templating (roles/constraints)           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Template Storage                            │
│  - template.dsl.json (TemplateDSL)                          │
│  - reference.png (golden reference)                          │
│  - metadata.json (source, confidence, etc.)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Remotion Template Renderer                      │
│  - Renders templates to PNG via renderStill()                │
│  - Supports variant generation (copy/image tests)            │
└─────────────────────────────────────────────────────────────┘
```

## Setup

### 1. Environment Variables

Create a `.env` file with your Canva credentials:

```bash
# Canva API credentials
CANVA_ACCESS_TOKEN=your_access_token_here
CANVA_CLIENT_ID=your_client_id_here
CANVA_CLIENT_SECRET=your_client_secret_here
```

### 2. Get Canva API Access

**Option A: Canva Apps SDK (for Canva App integration)**
- Build a Canva App using the [Apps SDK](https://www.canva.dev/docs/apps/)
- Use `openDesign()` to read design structure from within your app
- This gives you direct access to element properties

**Option B: Canva Connect API (for server-side integration)**
- Sign up for [Canva Connect API](https://www.canva.dev/docs/connect/)
- Get OAuth access token with `design:content:read` and `export:create` scopes
- Use REST API to fetch design metadata and export jobs

## Usage

### CLI Tool: Ingest Canva Design

```bash
# Basic usage
npm run ingest:canva -- --design-id DAFxxxxxx --title "Product Ad Template"

# With options
npm run ingest:canva -- \
  --design-id DAFxxxxxx \
  --title "My Template" \
  --page 1 \
  --quality high \
  --confidence 0.8
```

**Options:**
- `--design-id <id>` - Canva design ID (required)
- `--title <title>` - Template title (optional)
- `--page <index>` - Page index to ingest (default: 0)
- `--quality <quality>` - Export quality: `low`, `medium`, `high` (default: `high`)
- `--confidence <num>` - Confidence threshold (0-1, default: 0.8)

### Programmatic Usage

```typescript
import { createCanvaClient } from './src/ad-templates/ingestion/canva-client';
import { createTemplateStorage } from './src/ad-templates/ingestion/template-storage';
import { createCanvaIngestionPipeline } from './src/ad-templates/ingestion/canva-ingestion';

// Initialize clients
const canvaClient = createCanvaClient({
  accessToken: process.env.CANVA_ACCESS_TOKEN,
});

const storage = createTemplateStorage({
  storageDir: './data/templates',
});
await storage.initialize();

// Create pipeline
const pipeline = createCanvaIngestionPipeline(canvaClient, storage);

// Ingest a design
const result = await pipeline.ingestDesign({
  designId: 'DAFxxxxxx',
  title: 'Product Ad Template',
  pageIndex: 0,
  exportQuality: 'high',
  semanticConfig: {
    confidenceThreshold: 0.8,
    inferRoles: true,
    inferConstraints: true,
  },
});

console.log('Template ID:', result.templateId);
console.log('Layers:', result.template.layers.length);
console.log('Reference:', result.referencePath);
```

## Features

### CANVA-001: Canva Apps SDK Integration ✅

**Status:** Implemented

**Description:** Client for interacting with Canva's Design Editing API and Export API.

**Files:**
- `src/ad-templates/ingestion/canva-types.ts` - Type definitions
- `src/ad-templates/ingestion/canva-client.ts` - API client

**Key Methods:**
- `openDesign(designId)` - Open design session (Apps SDK)
- `getDesign(designId)` - Get design metadata (Connect API)
- `createExportJob(request)` - Create export job
- `exportDesign(designId, format)` - Export and wait for completion

### CANVA-002: Canva Export Jobs ✅

**Status:** Implemented

**Description:** Export designs to PNG/JPG/PDF via Canva Connect for golden references.

**Features:**
- Create export jobs with format and quality options
- Poll export job status until completion
- Download exported files to local storage
- Support for multiple pages

**Usage:**
```typescript
// Export design as PNG
const urls = await canvaClient.exportDesign('DAFxxxxxx', 'PNG', {
  quality: 'high',
  pages: [0, 1], // Export pages 1 and 2
});

// Download to local path
await canvaClient.downloadExport(urls[0], './output/reference.png');
```

### INGEST-002: Canva Design Ingestion ✅

**Status:** Implemented

**Description:** Import design via Canva Design Editing API with true layer coordinates.

**Files:**
- `src/ad-templates/ingestion/canva-to-template.ts` - Converter
- `src/ad-templates/ingestion/canva-ingestion.ts` - Pipeline

**Process:**
1. **Pass 1: Literal reconstruction** - Extract what/where from Canva elements
2. **Pass 2: Semantic templating** - Infer roles (headline, CTA, hero, etc.) and constraints

**Semantic Role Detection:**
- Large text at top → `headline`
- Medium text below headline → `subheadline`
- Text with action words → `cta`
- Large image → `hero`
- Small top-left image → `logo`
- Medium image → `product`

**Constraint Inference:**
- Headline → `fitTextOnNLines` (2-3 lines max)
- CTA → `fitText` (single line)
- Images → `lockAspect: true`

### CANVA-003: Template Storage ✅

**Status:** Implemented

**Description:** Store template.dsl.json, reference.png, source.canva.designId, extraction metadata.

**Files:**
- `src/ad-templates/ingestion/template-storage.ts` - Storage manager

**Storage Structure:**
```
data/templates/
├── canva_page_1_1234567890/
│   ├── metadata.json          # Template metadata
│   ├── template.dsl.json      # TemplateDSL
│   └── reference.png          # Golden reference PNG
└── canva_page_2_1234567891/
    ├── metadata.json
    ├── template.dsl.json
    └── reference.png
```

**Metadata Schema:**
```json
{
  "templateId": "canva_page_1_1234567890",
  "title": "Product Ad Template",
  "source": {
    "type": "canva_design",
    "canvaDesignId": "DAFxxxxxx",
    "canvaPageId": "page_1",
    "extractedAt": "2026-02-02T12:00:00Z"
  },
  "extraction": {
    "confidence": 0.95,
    "method": "canva_design_api",
    "version": "1.0"
  },
  "canvas": {
    "width": 1080,
    "height": 1080
  },
  "createdAt": "2026-02-02T12:00:00Z",
  "updatedAt": "2026-02-02T12:00:00Z"
}
```

**Key Methods:**
```typescript
const storage = createTemplateStorage();

// Save template
await storage.saveTemplate(template, metadata);

// Load template
const stored = await storage.loadTemplate('template_id');

// List all templates
const templates = await storage.listTemplates();

// Search templates
const canvaTemplates = await storage.searchTemplates({
  sourceType: 'canva_design',
  minConfidence: 0.8,
});

// Delete template
await storage.deleteTemplate('template_id');
```

## Two-Pass Extraction

The Canva-to-TemplateDSL converter uses a two-pass approach:

### Pass 1: Literal Reconstruction

**Goal:** "What is on the image and where is it?"

**Process:**
1. Read Canva element geometry (x, y, width, height)
2. Convert element types (TEXT → TextLayer, IMAGE → ImageLayer, SHAPE → ShapeLayer)
3. Extract style properties (font, color, radius, etc.)
4. Preserve z-index order

**Output:** TemplateDSL with pixel-perfect layer positions

### Pass 2: Semantic Templating

**Goal:** "Which elements are variable vs fixed?"

**Process:**
1. **Infer semantic roles** based on:
   - Text content (action words → CTA)
   - Position (top → headline, bottom → footer)
   - Size (large → hero, small → logo)
2. **Infer constraints:**
   - Headlines → `fitTextOnNLines` with max lines
   - CTAs → `fitText` with min font size
   - Images → `lockAspect` to preserve ratios
3. **Name binding slots:** `headline`, `subheadline`, `cta`, `hero`, `logo`, etc.

**Output:** Semantic TemplateDSL ready for variant generation

## Testing

### Golden Render Recreation Test

The ingestion pipeline automatically creates a reference PNG for pixel-diff testing:

```typescript
import { testGoldenRender } from './src/ad-templates/testing/golden-test';

// Test template recreation accuracy
const result = await testGoldenRender({
  templateId: 'canva_page_1_1234567890',
  referencePath: './data/templates/canva_page_1_1234567890/reference.png',
  threshold: 0.005, // 0.5% pixel difference allowed
});

if (result.passed) {
  console.log('✅ Golden test passed!');
} else {
  console.log('❌ Golden test failed:', result.diffPercentage);
}
```

## Limitations

### Current Implementation

1. **Mock Design Editing API:**
   - The `openDesign()` method is currently a mock implementation
   - For production, integrate with actual Canva Apps SDK or Connect API

2. **Grouped Elements:**
   - Grouped elements are not yet supported
   - They are skipped during extraction

3. **Font Matching:**
   - Font family detection may not be 100% accurate
   - Canva fonts may need to be mapped to web-safe fonts

### Canva API Limitations

1. **Design Editing API (Apps SDK):**
   - Only available within Canva Apps
   - Cannot be used server-side

2. **Connect API:**
   - Requires OAuth authentication
   - Rate limits apply
   - Only provides high-level design metadata (not element details)

## Best Practices

### 1. Use High Confidence Thresholds

Set minimum confidence for auto-approval:

```typescript
const result = await pipeline.ingestDesign({
  designId: 'DAFxxxxxx',
  semanticConfig: {
    confidenceThreshold: 0.9, // Only auto-approve if 90%+ confident
  },
});
```

### 2. Review Low-Confidence Extractions

Check templates with low confidence scores:

```typescript
const lowConfidenceTemplates = await storage.searchTemplates({
  minConfidence: 0.0, // Get all
}).then(templates =>
  templates.filter(t => t.extraction.confidence < 0.8)
);

// Review and manually correct if needed
```

### 3. Update Reference Images Regularly

Refresh golden references when Canva designs change:

```typescript
await pipeline.updateReferenceImage('template_id', {
  exportQuality: 'high',
});
```

### 4. Test Template Recreation

Always run golden tests after ingestion:

```bash
npm run ad:test
```

## Roadmap

### Upcoming Features

- [ ] **INGEST-006: Human-in-the-Loop Editor** (P2)
  - Lightweight template editor for correcting AI extraction mistakes
  - Visual layer inspector
  - Constraint adjuster
  - Confidence scorer override

- [ ] **Figma Integration** (Future)
  - Similar workflow for Figma designs
  - Figma Plugin API integration

- [ ] **Real Canva Apps SDK Integration** (Future)
  - Replace mock `openDesign()` with actual SDK calls
  - Build Canva App for in-app template extraction

## References

- [Canva Apps SDK - Design Editing API](https://www.canva.dev/docs/apps/design-editing-api/)
- [Canva Connect - Export API](https://www.canva.dev/docs/connect/api-reference/exports/)
- [Remotion - Still Compositions](https://www.remotion.dev/docs/still)
- [PRD: Ad Creative Templating](../prd6.txt)
