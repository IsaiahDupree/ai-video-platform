# Reference Image Ingestion Guide

Complete guide for uploading and extracting templates from reference ad images.

---

## Overview

The Reference Image Ingestion system allows you to:
1. **Upload** PNG/JPG static ad images
2. **Validate** image format, size, and dimensions
3. **Extract** pixel-accurate templates using AI vision models
4. **Store** metadata and manage uploaded images

---

## Quick Start

### CLI Usage

```bash
# Upload a reference ad
npm run upload:reference-ad -- ./my-ad.png

# Upload with metadata
npm run upload:reference-ad -- ./my-ad.jpg \
  --name "Product Launch Ad" \
  --tags "product,launch,v1"

# Upload and extract template immediately
npm run upload:reference-ad -- ./my-ad.png --extract

# Use Claude Opus for extraction
npm run upload:reference-ad -- ./my-ad.png --extract --model claude-3-opus

# List all uploaded images
npm run upload:reference-ad -- --list
```

### API Usage

```typescript
import { uploadReferenceImage } from './src/ad-templates/ingestion/image-uploader';
import { promises as fs } from 'fs';

// Upload from file
const buffer = await fs.readFile('./my-ad.png');
const result = await uploadReferenceImage({
  fileBuffer: buffer,
  filename: 'my-ad.png',
  metadata: {
    name: 'Product Launch Ad',
    description: 'Q1 2026 product launch campaign',
    tags: ['product', 'launch', 'instagram'],
  },
});

console.log('Image ID:', result.imageId);
console.log('File path:', result.filePath);

// Upload from base64
const base64Data = buffer.toString('base64');
const result2 = await uploadReferenceImage({
  imageBase64: base64Data,
  filename: 'my-ad.png',
});
```

---

## REST API Endpoints

### Upload Image

**POST** `/api/v1/template/upload`

```json
{
  "imageBase64": "iVBORw0KGgoAAAANS...",
  "filename": "my-ad.png",
  "metadata": {
    "name": "Product Ad",
    "description": "Product launch campaign",
    "tags": ["product", "launch"]
  }
}
```

**Response:**
```json
{
  "imageId": "a1b2c3d4e5f6g7h8",
  "filePath": "public/assets/uploads/reference-ads/a1b2c3d4e5f6g7h8.png",
  "dimensions": { "width": 1080, "height": 1080 },
  "fileSize": 245678,
  "mimeType": "image/png",
  "warnings": []
}
```

### Extract Template

**POST** `/api/v1/template/extract`

```json
{
  "imageId": "a1b2c3d4e5f6g7h8",
  "model": "gpt-4-vision",
  "webhookUrl": "https://example.com/webhook"
}
```

**Response:**
```json
{
  "jobId": "job_12345",
  "status": "queued",
  "pollUrl": "/api/v1/jobs/job_12345"
}
```

### List Images

**GET** `/api/v1/template/images`

**Response:**
```json
{
  "images": [
    {
      "imageId": "a1b2c3d4e5f6g7h8",
      "filename": "my-ad.png",
      "dimensions": { "width": 1080, "height": 1080 },
      "fileSize": 245678,
      "uploadedAt": "2026-02-02T10:30:00Z",
      "metadata": {
        "name": "Product Ad",
        "tags": ["product", "launch"]
      }
    }
  ]
}
```

### Get Image

**GET** `/api/v1/template/images/:imageId`

### Delete Image

**DELETE** `/api/v1/template/images/:imageId`

---

## Validation Rules

### Supported Formats
- **PNG** (`.png`)
- **JPEG** (`.jpg`, `.jpeg`)

### File Size Limits
- **Maximum:** 10 MB
- Configure via `UPLOAD_DIR` environment variable

### Standard Ad Sizes

The system recognizes these standard social media ad dimensions:

| Platform | Dimension | Usage |
|----------|-----------|-------|
| Instagram Feed | 1080x1080 | Square posts |
| Instagram Story | 1080x1920 | Vertical stories |
| Instagram Portrait | 1080x1350 | Portrait posts |
| Facebook Feed | 1200x628 | Horizontal posts |
| Facebook Marketplace | 1200x1200 | Square marketplace |

**Note:** Non-standard sizes will trigger a warning but are still accepted.

---

## Duplicate Detection

The system uses SHA-256 hashing to detect duplicate images:

```typescript
// Upload the same image twice
const result1 = await uploadReferenceImage({
  fileBuffer: buffer,
  filename: 'ad-v1.png',
});

const result2 = await uploadReferenceImage({
  fileBuffer: buffer,
  filename: 'ad-v2.png', // Different name, same content
});

// result2.imageId === result1.imageId
// result2.warnings includes "Image already exists (duplicate SHA-256)"
```

---

## Template Extraction

After uploading, extract a template using AI vision models:

### Supported Models

| Model | Provider | Best For |
|-------|----------|----------|
| `gpt-4-vision` | OpenAI | Fast, accurate, good for text |
| `claude-3-opus` | Anthropic | Highest quality, slower |
| `claude-3-sonnet` | Anthropic | Balanced speed/quality |

### Extraction Process

1. **Upload image** → Get `imageId`
2. **Submit extraction job** → Get `jobId`
3. **Poll job status** → Wait for completion
4. **Retrieve template** → Get `TemplateDSL` JSON

### Example Workflow

```bash
# 1. Upload
npm run upload:reference-ad -- ./my-ad.png
# Output: Image ID: a1b2c3d4e5f6g7h8

# 2. Extract (automatic if --extract flag used)
# Template saved to: data/templates/a1b2c3d4e5f6g7h8.template.json
```

### Extracted Template Structure

```json
{
  "templateId": "extracted_1738500000000",
  "name": "AI Extracted Template",
  "version": "1.0.0",
  "canvas": {
    "width": 1080,
    "height": 1080,
    "bgColor": "#0b0f1a"
  },
  "layers": [
    {
      "id": "headline_0",
      "type": "text",
      "z": 20,
      "rect": { "x": 80, "y": 160, "w": 420, "h": 220 },
      "text": {
        "fontFamily": "Inter",
        "fontWeight": 800,
        "fontSize": 64,
        "color": "#ffffff",
        "align": "left"
      },
      "bind": { "textKey": "headline" }
    }
  ],
  "bindings": {
    "text": { "headline": "default headline" },
    "assets": {}
  },
  "meta": {
    "source": { "type": "reference_image" },
    "extraction": {
      "confidence": 0.86,
      "extractedAt": "2026-02-02T10:30:00Z",
      "model": "gpt-4-vision"
    }
  }
}
```

---

## File Storage

### Directory Structure

```
public/assets/uploads/reference-ads/
├── a1b2c3d4e5f6g7h8.png           # Image file
├── a1b2c3d4e5f6g7h8.json          # Metadata
├── x9y8z7w6v5u4t3s2.jpg           # Another image
└── x9y8z7w6v5u4t3s2.json          # Its metadata
```

### Metadata Format

```json
{
  "imageId": "a1b2c3d4e5f6g7h8",
  "filename": "my-ad.png",
  "filePath": "public/assets/uploads/reference-ads/a1b2c3d4e5f6g7h8.png",
  "dimensions": { "width": 1080, "height": 1080 },
  "fileSize": 245678,
  "mimeType": "image/png",
  "sha256": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "uploadedAt": "2026-02-02T10:30:00Z",
  "metadata": {
    "name": "Product Ad",
    "description": "Q1 2026 product launch",
    "tags": ["product", "launch"]
  }
}
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid file extension` | File is not PNG/JPEG | Use `.png`, `.jpg`, or `.jpeg` |
| `File size exceeds limit` | File > 10MB | Compress image or increase limit |
| `Invalid MIME type` | File signature doesn't match extension | Ensure file is actually PNG/JPEG |
| `Image not found` | Invalid `imageId` | Verify `imageId` from upload response |

### Validation Warnings

Non-blocking warnings that don't prevent upload:
- Non-standard ad size
- Duplicate image detected
- Could not detect image dimensions

---

## Environment Variables

```bash
# Upload directory (default: public/assets/uploads/reference-ads)
UPLOAD_DIR=./custom/upload/path

# Template storage (default: data/templates)
TEMPLATE_DIR=./custom/template/path

# AI model API keys (for extraction)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Testing

Run the test suite to verify image upload functionality:

```bash
npx tsx tests/ad-templates/image-upload.test.ts
```

**Tests include:**
- ✅ Upload PNG image
- ✅ Upload JPEG image
- ✅ Upload with base64 encoding
- ✅ Invalid file extension rejection
- ✅ File size limit enforcement
- ✅ Retrieve uploaded image
- ✅ List uploaded images
- ✅ Duplicate detection

---

## Best Practices

### 1. Organize with Metadata

```bash
npm run upload:reference-ad -- ./ads/product-v1.png \
  --name "Product Launch - Variant 1" \
  --description "Primary headline with blue CTA" \
  --tags "product,launch,v1,blue-cta"
```

### 2. Use Descriptive Filenames

- ✅ `instagram-feed-product-launch-v1.png`
- ✅ `fb-story-holiday-sale-2026.jpg`
- ❌ `IMG_1234.png`
- ❌ `ad.jpg`

### 3. Choose the Right Model

- **Fast iteration:** `gpt-4-vision`
- **Production quality:** `claude-3-opus`
- **Balanced:** `claude-3-sonnet`

### 4. Validate Extracted Templates

```bash
npm run ad:test
```

This runs:
- Golden render comparison
- Layer geometry validation
- Text overflow detection
- Deterministic rendering checks

---

## Troubleshooting

### Upload fails with "Invalid MIME type"

**Cause:** File extension doesn't match actual file format.

**Solution:** Verify file is actually PNG/JPEG:
```bash
file my-ad.png
# Should output: PNG image data, 1080 x 1080, ...
```

### Extraction confidence is low

**Cause:** Complex layout, unusual fonts, or poor image quality.

**Solutions:**
1. Try a different AI model (Claude Opus for best quality)
2. Manually review and adjust extracted template
3. Use higher resolution reference image

### Template doesn't match reference

**Cause:** AI extraction inaccuracies.

**Solutions:**
1. Run golden render comparison test
2. Manually adjust layer positions in template JSON
3. Use Canva API ingestion (when available) for perfect accuracy

---

## Next Steps

After uploading and extracting:

1. **Validate template:** `npm run ad:test`
2. **Generate variants:** `npm run ad:variants`
3. **Render stills:** `npm run ad:render`
4. **Deploy templates:** Use in production rendering pipeline

---

## Related Documentation

- [PRD: Ad Creative Templating System](./PRD-ad-creative-templating.md)
- [Template DSL Schema](./AD_TEMPLATE_SYSTEM.md)
- [AI Layout Extraction](../src/ad-templates/extraction/README.md)
- [Variant Generation](../src/ad-templates/variants/README.md)

---

**Version:** 1.0.0
**Last Updated:** February 2, 2026
