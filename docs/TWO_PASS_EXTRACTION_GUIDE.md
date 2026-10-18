# Two-Pass Template Extraction Guide

## Overview

The Two-Pass Extraction System is an advanced AI-powered layout extraction pipeline that recreates pixel-accurate ad templates from reference images. It separates the extraction process into two distinct phases for higher accuracy and better semantic understanding.

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Reference Ad Image                       │
│                     (PNG/JPG/URL)                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│             PASS 1: LITERAL RECONSTRUCTION                  │
│                                                             │
│  Goal: "What is on the image and where is it?"            │
│                                                             │
│  - Precise OCR with bounding boxes                         │
│  - Image region detection                                  │
│  - Shape/color detection                                   │
│  - Layer ordering (z-index)                                │
│  - Literal properties (font size, color, etc.)            │
│                                                             │
│  Output: LiteralElement[]                                  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│             PASS 2: SEMANTIC TEMPLATING                     │
│                                                             │
│  Goal: "Which elements are variable vs fixed?"            │
│        "What are the semantic roles?"                      │
│                                                             │
│  - Semantic role assignment (headline, cta, hero, etc.)   │
│  - Variability classification (variable vs fixed)         │
│  - Constraint inference (max lines, min font size)        │
│  - Element grouping (button + text)                       │
│  - Binding key generation                                  │
│                                                             │
│  Output: SemanticMapping + TemplateDSL                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   CONFIDENCE SCORING                        │
│                                                             │
│  - Per-layer confidence scores                             │
│  - Auto-approve / Manual-review flags                      │
│  - Validation warnings                                     │
│  - Recommendations                                         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    TEMPLATE OUTPUT                          │
│                                                             │
│  - template.dsl.json (TemplateDSL)                        │
│  - Confidence report                                       │
│  - Extraction metadata                                     │
└─────────────────────────────────────────────────────────────┘
```

## Why Two-Pass?

### Single-Pass Problems

In a traditional single-pass extraction, the AI model tries to do everything at once:
- Detect elements
- Measure positions
- Assign semantic roles
- Infer constraints

This leads to:
- **Lower precision**: Trying to interpret while measuring
- **Role confusion**: Mixing literal and semantic analysis
- **Inconsistent constraints**: Guessing based on incomplete context

### Two-Pass Benefits

**Pass 1: Literal Reconstruction**
- Focus exclusively on **what is visible**
- No interpretation, no assumptions
- Maximum precision on measurements
- Pure OCR and layout detection

**Pass 2: Semantic Templating**
- Focus exclusively on **intent and structure**
- With complete literal data available
- Consistent semantic reasoning
- Better constraint inference

Result: **Higher accuracy, better templates, more reliable constraints**

## Usage

### CLI Tool

```bash
# Basic extraction from URL
npm run ad:extract-two-pass -- --url https://example.com/ad.png

# Extract from local file
npm run ad:extract-two-pass -- --image public/assets/reference-ad.png

# With semantic hints
npm run ad:extract-two-pass -- --image ad.png --roles "headline,subhead,cta,hero,logo"

# Pass 1 only (skip semantic analysis)
npm run ad:extract-two-pass -- --image ad.png --pass1-only

# Specify canvas size
npm run ad:extract-two-pass -- --image ad.png --width 1080 --height 1080

# Verbose output
npm run ad:extract-two-pass -- --image ad.png --verbose
```

### Programmatic API

```typescript
import { extractWithTwoPass } from './src/ad-templates/extraction/two-pass-extractor';

const result = await extractWithTwoPass({
  imageUrl: 'https://example.com/ad.png',
  model: 'gpt-4-vision',
  twoPass: {
    enablePass2: true,
    semanticGuidance: ['headline', 'cta', 'hero', 'logo'],
    identifyGroups: true,
    inferConstraints: true,
    classifyVariability: true,
  },
});

if (result.success) {
  console.log('Template:', result.template);
  console.log('Confidence:', result.confidence);
  console.log('Pass 1 elements:', result.pass1.literalElements.length);
  console.log('Pass 2 roles:', Object.keys(result.pass2.semanticMapping.roles).length);
}
```

## Pass 1: Literal Reconstruction

### What It Does

- **OCR with bounding boxes**: Extracts all visible text with pixel coordinates
- **Image detection**: Identifies photo regions, logos, illustrations
- **Shape detection**: Finds rectangles, circles, buttons, backgrounds
- **Layer ordering**: Establishes z-index from visual overlap
- **Style extraction**: Measures font sizes, colors, weights, alignment

### What It Doesn't Do

- **No semantic roles**: Won't label "headline" or "CTA"
- **No intent**: Won't guess what's variable vs fixed
- **No constraints**: Won't infer text fitting rules

### Example Pass 1 Output

```json
{
  "canvas": { "width": 1080, "height": 1080, "bgColor": "#0b0f1a" },
  "literalElements": [
    {
      "type": "text",
      "boundingBox": { "x": 80, "y": 160, "w": 420, "h": 220 },
      "zIndex": 20,
      "confidence": 0.92,
      "textContent": "Launch Your Product Today",
      "fontFamily": "Inter",
      "fontWeight": 800,
      "fontSize": 64,
      "textColor": "#ffffff",
      "textAlign": "left",
      "valign": "top"
    },
    {
      "type": "image",
      "boundingBox": { "x": 540, "y": 120, "w": 420, "h": 420 },
      "zIndex": 10,
      "confidence": 0.88,
      "imageType": "photo",
      "imageFit": "cover",
      "borderRadius": 12
    },
    {
      "type": "shape",
      "boundingBox": { "x": 80, "y": 720, "w": 420, "h": 110 },
      "zIndex": 30,
      "confidence": 0.95,
      "shapeKind": "rect",
      "fill": "#5B78C7",
      "borderRadius": 28
    }
  ],
  "overallConfidence": 0.91
}
```

## Pass 2: Semantic Templating

### What It Does

Given the literal elements from Pass 1, it:

1. **Assigns semantic roles**: headline, subhead, cta, hero, logo, background, etc.
2. **Classifies variability**: Which elements should change in variants?
3. **Infers constraints**: Text fitting modes, min font sizes, max lines
4. **Identifies groups**: Button shape + CTA text = one logical unit
5. **Generates bindings**: Maps roles to actual content

### Semantic Roles

Standard roles used across the system:

- **Text**: headline, subhead, body, caption, cta, label
- **Images**: hero, logo, product, icon, avatar, background
- **Shapes**: background, accent, border, separator, button

### Variable vs Fixed Classification

**Variable layers** (change in variants):
- Headlines
- Subheads
- CTAs
- Hero images
- Product photos

**Fixed layers** (stay consistent):
- Backgrounds
- Decorative shapes
- Brand logos (usually)
- Accent elements

### Constraint Inference

Based on layout and role:

| Role | Typical Constraints |
|------|---------------------|
| Headline | 1-3 lines max, min font 36px, fitTextOnNLines |
| Subhead | 2-4 lines max, min font 18px, fitTextOnNLines |
| Body | 5-10 lines max, min font 12px, fillTextBox |
| CTA | 1 line, must fit, centered, fitText |
| Hero image | Lock aspect ratio |
| Logo | Lock aspect ratio, no stretching |

### Example Pass 2 Output

```json
{
  "semanticMapping": {
    "roles": {
      "text_0": "headline",
      "text_1": "cta",
      "image_0": "hero",
      "shape_0": "background",
      "shape_1": "button"
    },
    "variableLayers": ["text_0", "text_1", "image_0"],
    "fixedLayers": ["shape_0", "shape_1"],
    "constraints": {
      "text_0": {
        "maxLines": 3,
        "minFontSize": 36,
        "fitMode": "fitTextOnNLines",
        "overflow": "hidden"
      },
      "text_1": {
        "maxLines": 1,
        "minFontSize": 24,
        "fitMode": "fitText",
        "overflow": "hidden"
      },
      "image_0": {
        "lockAspect": true
      }
    },
    "groups": {
      "cta_group": ["shape_1", "text_1"]
    }
  },
  "confidence": 0.87
}
```

## Confidence Scoring

After extraction, each layer gets a confidence score based on:

### Text Layers
- Position validity (in bounds, reasonable placement)
- Dimension checks (not too small/large)
- Style consistency (font sizes, generic fonts detected)
- Semantic role assignment

### Image Layers
- Position validity
- Dimension reasonableness
- Aspect ratio sanity checks
- Semantic role assignment

### Shape Layers
- Position validity
- Visibility (has fill or stroke)
- Dimension checks (not artifact-thin)

### Thresholds

```typescript
{
  HIGH: 0.85,           // High confidence layer
  MEDIUM: 0.65,         // Medium confidence
  LOW: 0.40,            // Low confidence
  AUTO_APPROVE: 0.90,   // Auto-approve threshold
  REQUIRE_REVIEW: 0.60, // Requires manual review
}
```

### Confidence Report Example

```
📊 Confidence Report:
   High confidence: 8 layers
   Medium confidence: 2 layers
   Low confidence: 1 layer
   ✅ Auto-approve: YES

💡 Recommendations:
   - 1 layer(s) lack semantic roles - assign for better variant generation
   - Font family is generic for text_0 - consider specifying exact font
```

## Models Supported

### GPT-4 Vision (OpenAI)
- **Model**: `gpt-4-vision-preview`
- **Best for**: High-quality extraction, precise measurements
- **API Key**: `OPENAI_API_KEY`

### Claude 3 Opus (Anthropic)
- **Model**: `claude-3-opus-20240229`
- **Best for**: Semantic understanding, role assignment
- **API Key**: `ANTHROPIC_API_KEY`

### Claude 3 Sonnet (Anthropic)
- **Model**: `claude-3-sonnet-20240229`
- **Best for**: Balanced speed and accuracy
- **API Key**: `ANTHROPIC_API_KEY`

## Output Files

### template.dsl.json

The final TemplateDSL file containing:
- Canvas dimensions and background
- All layers with positions and styles
- Semantic bindings (text and asset keys)
- Constraints for each layer
- Extraction metadata

### template.report.json (verbose mode)

Detailed extraction report containing:
- Pass 1 results (literal elements)
- Pass 2 results (semantic mapping)
- Confidence scores per layer
- Validation warnings
- Recommendations
- Raw AI responses

## Best Practices

### 1. Provide Semantic Hints

If you know the expected structure, provide hints:

```bash
npm run ad:extract-two-pass -- \
  --image ad.png \
  --roles "headline,subhead,cta,hero,logo,background"
```

This guides Pass 2 semantic analysis.

### 2. Use High-Quality Reference Images

- **Resolution**: At least 1080x1080 for best results
- **Format**: PNG preferred (lossless)
- **Clarity**: Clear text, no compression artifacts
- **Typical sizes**: Match target ad sizes (1080x1080, 1080x1920, 1200x628)

### 3. Review Low Confidence Extractions

If confidence < 0.7, manually review:
- Check layer positions
- Verify font sizes
- Confirm semantic roles
- Adjust constraints if needed

### 4. Test with Golden Render

After extraction, test the template:

```bash
npm run ad:test -- --template data/templates/extracted_123.json --reference public/assets/reference-ad.png
```

This runs a pixel-diff test to verify recreation accuracy.

### 5. Iterate on Semantic Guidance

If Pass 2 misassigns roles:
1. Use `--verbose` to see what it detected
2. Adjust `--roles` hints
3. Re-run extraction

## Common Issues

### Issue: Text overlaps detected

**Cause**: Multiple text layers at same z-index
**Fix**: Review z-order in Pass 1, may need manual adjustment

### Issue: Generic font family detected

**Cause**: AI couldn't identify exact font
**Fix**: Specify exact font family in template after extraction

### Issue: Low confidence on small elements

**Cause**: Very small text or tiny shapes detected
**Fix**: May be detection artifacts - review and remove if not real elements

### Issue: CTA not grouped with button

**Cause**: Pass 2 didn't detect relationship
**Fix**: Manually add to `groups` in template, or provide semantic hint

## Integration with Variant Generation

Once you have a template, generate variants:

```typescript
import { generateVariants } from './src/ad-templates/variants/variant-generator';

const variants = generateVariants(template, {
  copyTest: {
    headlines: [
      'Launch Your Product Today',
      'Start Growing Your Business',
      'Transform Your Workflow'
    ],
    ctas: ['Get Started', 'Learn More', 'Try Free']
  },
  imageTest: {
    hero: [
      'public/assets/hero-1.png',
      'public/assets/hero-2.png',
      'public/assets/hero-3.png'
    ]
  }
});

// Render all variants
variants.forEach(variant => {
  // Render with Remotion
});
```

## Advanced: Custom Pass 1 Only

For cases where you want literal data without semantic analysis:

```typescript
import { executeLiteralReconstruction } from './src/ad-templates/extraction/two-pass-extractor';

const pass1 = await executeLiteralReconstruction({
  imageUrl: 'https://example.com/ad.png',
  model: 'gpt-4-vision',
});

// Work with literal elements directly
console.log(pass1.literalElements);
```

## Advanced: Custom Pass 2 with Modified Pass 1

```typescript
import { executeLiteralReconstruction, executeSemanticTemplating } from './src/ad-templates/extraction/two-pass-extractor';

// Run Pass 1
const pass1 = await executeLiteralReconstruction({ ... });

// Manually modify literal elements
pass1.literalElements = pass1.literalElements.filter(el => el.confidence > 0.8);

// Run Pass 2 with modified data
const pass2 = await executeSemanticTemplating(pass1, {
  twoPass: {
    semanticGuidance: ['headline', 'cta'],
  },
});
```

## File Locations

```
src/ad-templates/extraction/
├── two-pass-extractor.ts        # Main two-pass extraction logic
├── ai-extractor.ts              # Single-pass extractor (fallback)
├── confidence-scorer.ts         # Confidence scoring system
└── index.ts                     # Public API exports

scripts/
└── extract-template-two-pass.ts # CLI tool

docs/
└── TWO_PASS_EXTRACTION_GUIDE.md # This guide
```

## Next Steps

After extracting a template:

1. **Validate**: Run `npm run ad:test` with golden reference
2. **Refine**: Adjust constraints, roles, or positions if needed
3. **Generate variants**: Create copy/image test variants
4. **Render**: Batch render all variants
5. **Deploy**: Upload to ad platforms

## Support

For issues or questions about two-pass extraction:
- Check confidence reports for warnings
- Use `--verbose` mode for detailed output
- Review extraction metadata in template JSON
- Test with different models if results vary
- Provide semantic hints to guide Pass 2

---

**Version**: 1.0.0
**Last Updated**: 2026-02-02
**Status**: Production Ready
