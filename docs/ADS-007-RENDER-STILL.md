# ADS-007: renderStill Service

## Overview

The `renderStill` service provides a Node.js interface for rendering Remotion Still compositions to static image files (PNG, JPEG, WebP). This service is built on top of `@remotion/renderer` and `@remotion/bundler` to enable programmatic rendering of static ad templates.

## Features

- **Multiple Image Formats**: Support for PNG, JPEG, and WebP output
- **Quality Control**: Configurable quality settings for lossy formats (JPEG/WebP)
- **Batch Rendering**: Render multiple compositions in a single operation
- **Custom Output Paths**: Flexible output directory and filename configuration
- **Composition Discovery**: Query available compositions and their metadata
- **Error Handling**: Comprehensive error handling with detailed error messages

## Installation

The service is already integrated into the project. No additional installation is required.

## Usage

### Basic Example

```typescript
import { renderStill } from '../src/services/renderStill';

// Render a composition to PNG
const result = await renderStill('HeroAd', {
  format: 'png',
});

console.log(result.outputPath); // Path to rendered image
```

### Render with Custom Options

```typescript
import { renderStill } from '../src/services/renderStill';

// Render as JPEG with custom quality
const result = await renderStill('QuoteAd', {
  format: 'jpeg',
  quality: 85,
  outputPath: '/path/to/output/quote-ad.jpeg',
});
```

### Batch Rendering

```typescript
import { batchRenderStills } from '../src/services/renderStill';

// Render multiple compositions
const results = await batchRenderStills(
  ['HeroAd', 'QuoteAd', 'MinimalAd'],
  {
    outputDir: './output/batch',
    format: 'png',
    nameTemplate: '{id}-campaign',
  }
);

results.forEach((result) => {
  if (result.success) {
    console.log(`Rendered: ${result.outputPath}`);
  }
});
```

### Get Available Compositions

```typescript
import { getAvailableCompositions } from '../src/services/renderStill';

// List all available compositions
const compositions = await getAvailableCompositions();
console.log(compositions); // ['HeroAd', 'QuoteAd', 'MinimalAd', ...]
```

### Get Composition Info

```typescript
import { getCompositionInfo } from '../src/services/renderStill';

// Get composition metadata
const info = await getCompositionInfo('HeroAd');
console.log(info);
// {
//   id: 'HeroAd',
//   width: 1080,
//   height: 1080,
//   fps: 1,
//   durationInFrames: 1
// }
```

## API Reference

### `renderStill(compositionId, options)`

Render a single still image from a composition ID.

**Parameters:**
- `compositionId` (string): The ID of the Still composition to render
- `options` (RenderStillOptions): Rendering options

**Returns:** `Promise<RenderStillResult>`

**Options:**
```typescript
interface RenderStillOptions {
  outputPath?: string;      // Output file path
  format?: ImageFormat;     // 'png' | 'jpeg' | 'webp'
  quality?: number;         // Quality for JPEG/WebP (0-100)
  scale?: number;           // Scale factor (default: 1)
  width?: number;           // Override width
  height?: number;          // Override height
  overwrite?: boolean;      // Overwrite existing file (default: true)
}
```

### `renderAdTemplate(template, options)`

Render a still image from an ad template object.

**Parameters:**
- `template` (AdTemplate): The ad template to render
- `options` (RenderStillOptions): Rendering options

**Returns:** `Promise<RenderStillResult>`

### `batchRenderStills(compositionIds, options)`

Batch render multiple compositions.

**Parameters:**
- `compositionIds` (string[]): Array of composition IDs to render
- `options` (BatchRenderOptions): Batch rendering options

**Returns:** `Promise<RenderStillResult[]>`

**Options:**
```typescript
interface BatchRenderOptions {
  outputDir: string;        // Output directory for batch
  format?: ImageFormat;     // Image format (default: 'png')
  quality?: number;         // Quality for JPEG/WebP (0-100)
  nameTemplate?: string;    // Filename template with {id} placeholder
}
```

### `getAvailableCompositions()`

Get all available composition IDs.

**Returns:** `Promise<string[]>`

### `getCompositionInfo(compositionId)`

Get composition metadata.

**Parameters:**
- `compositionId` (string): The composition ID

**Returns:** `Promise<CompositionInfo | null>`

## Result Format

All render functions return a `RenderStillResult` object:

```typescript
interface RenderStillResult {
  success: boolean;
  outputPath: string;
  width: number;
  height: number;
  format: ImageFormat;
  sizeInBytes?: number;
  error?: string;
}
```

## Testing

Run the test suite:

```bash
npx tsx scripts/test-render-still.ts
```

The test suite includes:
1. Get available compositions
2. Get composition info
3. Render single still as PNG
4. Render single still as JPEG
5. Render with custom output path
6. Batch render multiple compositions
7. Error handling

## Output Directory

By default, rendered images are saved to:

```
output/ads/
```

Batch renders are saved to a subdirectory within the output directory.

## Supported Image Formats

- **PNG**: Lossless compression, best for graphics with text
- **JPEG**: Lossy compression, best for photographs (quality: 0-100)
- **WebP**: Modern format with better compression (quality: 0-100)

## Performance Considerations

- **Bundling**: The first render operation will bundle the Remotion project, which takes a few seconds
- **Subsequent Renders**: After bundling, renders are much faster
- **Batch Operations**: Use `batchRenderStills()` for better performance when rendering multiple compositions

## Error Handling

All functions handle errors gracefully and return error information in the result object:

```typescript
const result = await renderStill('InvalidComposition');
if (!result.success) {
  console.error('Render failed:', result.error);
}
```

## Integration with Ad Editor

This service can be integrated with the Ad Editor UI (ADS-004) to enable:
- Live preview rendering
- Export functionality
- Batch campaign generation

## Next Steps

- **ADS-008**: Size Presets - Standard ad sizes configuration
- **ADS-009**: Render Job Queue - BullMQ/Redis queue for managing render jobs
- **ADS-010**: ZIP Export with Manifest - Download organized ZIP files

## Related Features

- **ADS-001**: Static Ad Template System
- **ADS-004**: Ad Editor UI
- **ADS-005**: Auto-fit Text
- **ADS-006**: Image Positioning Controls
