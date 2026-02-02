# Human-in-the-Loop (HITL) Template Editor

## Overview

The HITL Editor is a lightweight template editing system for correcting AI extraction mistakes. It provides both a programmatic API and an interactive CLI tool for editing ad templates.

## Features

- ✅ **Layer CRUD Operations** - Create, read, update, delete layers
- ✅ **Property Editing** - Edit position, dimensions, styles
- ✅ **Layer Reordering** - Change z-index and stacking order
- ✅ **Undo/Redo** - Full edit history with undo/redo support
- ✅ **Validation** - Real-time validation and constraint checking
- ✅ **Confidence Scoring** - Automatic quality assessment
- ✅ **Diff Tracking** - Track changes from original template
- ✅ **Interactive CLI** - Terminal-based editing interface

## Use Cases

### 1. Correct AI Extraction Errors

When AI extraction produces incorrect results:

```typescript
import { createEditSession } from './src/ad-templates/editing/hitl-editor';
import { TemplateStorage } from './src/ad-templates/ingestion/template-storage';

// Load template
const storage = new TemplateStorage();
const stored = await storage.loadTemplate('tpl_001');

// Create edit session
const editor = createEditSession(stored.template);

// Fix misplaced text layer
editor.updateLayer({
  layerId: 'headline',
  updates: {
    rect: { x: 100, y: 150 },  // Correct position
  },
});

// Fix incorrect font size
editor.updateLayer({
  layerId: 'headline',
  updates: {
    text: { fontSize: 48 },  // Correct size
  },
});

// Validate and save
const validation = editor.validateTemplate();
if (validation.valid) {
  const updated = editor.export();
  await storage.saveTemplate('tpl_001', updated, stored.metadata);
}
```

### 2. Refine Low-Confidence Layers

Check confidence scores and fix problematic layers:

```typescript
const report = editor.getConfidenceReport();

// Find low-confidence layers
const lowConfidence = report.layers.filter(l => l.overall < 0.6);

for (const layer of lowConfidence) {
  console.log(`Layer ${layer.layerId} needs review:`, layer.flags);

  // Review and fix each issue
  for (const flag of layer.flags) {
    if (flag.code === 'OCR_LOW_CONFIDENCE') {
      // Manually correct text
    } else if (flag.code === 'POSITION_UNCERTAIN') {
      // Adjust position
    }
  }
}
```

### 3. Add Missing Elements

Add layers that AI failed to detect:

```typescript
// Create missing CTA button
editor.createLayer({
  id: 'cta_button',
  type: 'shape',
  z: 30,
  rect: { x: 80, y: 720, w: 420, h: 110 },
  shape: {
    kind: 'rect',
    fill: '#5B78C7',
    radius: 28,
  },
});

// Add CTA text
editor.createLayer({
  id: 'cta_text',
  type: 'text',
  z: 31,
  rect: { x: 80, y: 720, w: 420, h: 110 },
  text: {
    fontFamily: 'Inter',
    fontWeight: 700,
    fontSize: 38,
    lineHeight: 1.0,
    color: '#ffffff',
    align: 'center',
    valign: 'middle',
  },
  bind: { textKey: 'cta' },
});
```

## Interactive CLI Tool

### Starting the CLI

```bash
# Using npm script
npm run edit:template <templateId>

# Using tsx directly
tsx scripts/edit-template-hitl.ts tpl_001
```

### CLI Commands

#### Navigation & Viewing

```bash
# List all layers
hitl> list

# Show layer details
hitl> show headline

# Show confidence report
hitl> confidence
```

#### Editing Operations

```bash
# Update layer property (interactive)
hitl> update
Layer ID: headline
Property: fontSize
New value: 48

# Delete layer
hitl> delete unwanted_layer

# Reorder layer
hitl> reorder headline 50
```

#### History & Undo

```bash
# Show edit history
hitl> history

# Undo last change
hitl> undo

# Redo change
hitl> redo

# Show diff from original
hitl> diff
```

#### Validation & Export

```bash
# Validate template
hitl> validate

# Save changes
hitl> save

# Exit editor
hitl> exit
```

## Programmatic API

### Core Operations

#### Update Layer

```typescript
const result = editor.updateLayer({
  layerId: 'headline',
  updates: {
    rect: { x: 100, y: 150, w: 400, h: 200 },
    text: {
      fontSize: 48,
      color: '#ffffff',
      align: 'center',
    },
  },
});

if (!result.valid) {
  console.error('Update failed:', result.errors);
}
```

#### Create Layer

```typescript
const result = editor.createLayer({
  id: 'new_layer',
  type: 'text',
  z: 20,
  rect: { x: 0, y: 0, w: 100, h: 50 },
  text: {
    fontFamily: 'Inter',
    fontWeight: 400,
    fontSize: 24,
    color: '#000000',
    align: 'left',
    valign: 'top',
  },
});
```

#### Delete Layer

```typescript
const result = editor.deleteLayer('unwanted_layer');
```

#### Reorder Layer

```typescript
const result = editor.reorderLayer('headline', 50);
```

### Undo/Redo

```typescript
// Check if undo/redo available
if (editor.canUndo()) {
  editor.undo();
}

if (editor.canRedo()) {
  editor.redo();
}

// Get operation history
const history = editor.getOperationHistory();
console.log(`${history.length} operations performed`);
```

### Validation

```typescript
// Validate entire template
const validation = editor.validateTemplate();

if (!validation.valid) {
  console.log('Errors:', validation.errors);
}

if (validation.warnings.length > 0) {
  console.log('Warnings:', validation.warnings);
}
```

### Confidence Scoring

```typescript
const report = editor.getConfidenceReport();

console.log('Overall confidence:', report.overallConfidence);
console.log('Needs review:', report.summary.needsReview);

// Get recommendations
report.recommendations.forEach(rec => {
  console.log('Recommendation:', rec);
});
```

### Diff Tracking

```typescript
const diff = editor.getDiff();

console.log('Added layers:', diff.added.length);
console.log('Modified layers:', diff.modified.length);
console.log('Deleted layers:', diff.deleted.length);

// Show modified layer details
for (const mod of diff.modified) {
  console.log(`Layer ${mod.layerId} changed`);
  console.log('Before:', mod.before);
  console.log('After:', mod.after);
}
```

### Export

```typescript
// Export edited template
const updatedTemplate = editor.export();

// Save to storage
const storage = new TemplateStorage();
await storage.saveTemplate(templateId, updatedTemplate, metadata);
```

## Validation Rules

### Layer Validation

| Rule | Type | Description |
|------|------|-------------|
| `NEGATIVE_POSITION` | Warning | Layer has negative x or y |
| `OUT_OF_BOUNDS` | Warning | Layer extends beyond canvas |
| `INVALID_DIMENSIONS` | Error | Width or height < 1px |
| `DUPLICATE_LAYER_ID` | Error | Multiple layers with same ID |

### Text Layer Validation

| Rule | Type | Description |
|------|------|-------------|
| `MISSING_FONT` | Error | No font family specified |
| `INVALID_FONT_SIZE` | Error | Font size < 1 |
| `VERY_SMALL` | Warning | Dimensions < 20x10px |

### Image Layer Validation

| Rule | Type | Description |
|------|------|-------------|
| `MISSING_IMAGE_CONFIG` | Error | No image configuration |
| `INVALID_FIT_MODE` | Warning | Unknown fit mode |

### Shape Layer Validation

| Rule | Type | Description |
|------|------|-------------|
| `MISSING_SHAPE_CONFIG` | Error | No shape configuration |
| `INVALID_SHAPE_KIND` | Warning | Unknown shape kind |

## Edit Session Persistence

### Save Session

```typescript
import fs from 'fs/promises';

const session = editor.getSession();
await fs.writeFile(
  'sessions/session_001.json',
  JSON.stringify(session, null, 2)
);
```

### Load Session

```typescript
import { loadEditSession } from './src/ad-templates/editing/hitl-editor';

const sessionData = JSON.parse(
  await fs.readFile('sessions/session_001.json', 'utf-8')
);

const editor = loadEditSession(sessionData);

// Continue editing
editor.updateLayer({ ... });
```

## Best Practices

### 1. Always Validate Before Saving

```typescript
const validation = editor.validateTemplate();
if (!validation.valid) {
  console.error('Cannot save: validation errors present');
  return;
}

const template = editor.export();
await storage.saveTemplate(templateId, template, metadata);
```

### 2. Check Confidence Scores

```typescript
const report = editor.getConfidenceReport();
if (report.summary.needsReview) {
  console.log('Manual review recommended');

  // Show low-confidence layers
  const lowConfidence = report.layers.filter(l => l.overall < 0.6);
  console.log('Review these layers:', lowConfidence.map(l => l.layerId));
}
```

### 3. Use Undo for Safety

```typescript
// Try risky operation
const result = editor.updateLayer({ ... });

if (!result.valid) {
  // Undo if it failed
  editor.undo();
  console.log('Reverted failed update');
}
```

### 4. Track Changes

```typescript
// Before saving, review changes
const diff = editor.getDiff();

console.log('Summary:');
console.log(`  Added: ${diff.added.length}`);
console.log(`  Modified: ${diff.modified.length}`);
console.log(`  Deleted: ${diff.deleted.length}`);

// Confirm before saving
if (await confirmChanges()) {
  await saveTemplate();
}
```

## Integration with Extraction Pipeline

### Post-Extraction Workflow

```typescript
import { extractTemplateFromImage } from './src/ad-templates/extraction/ai-extractor';
import { createEditSession } from './src/ad-templates/editing/hitl-editor';
import { scoreTemplate } from './src/ad-templates/extraction/confidence-scorer';

// 1. Extract template with AI
const extracted = await extractTemplateFromImage(imagePath);

// 2. Score confidence
const report = scoreTemplate(extracted);

// 3. If confidence is low, enable HITL editing
if (report.overallConfidence < 0.85) {
  console.log('Low confidence extraction - manual review required');

  const editor = createEditSession(extracted);

  // 4. Fix issues identified in confidence report
  for (const layer of report.layers) {
    if (layer.overall < 0.6) {
      console.log(`Review layer ${layer.layerId}:`, layer.flags);
      // Prompt user for corrections
    }
  }

  // 5. Validate and save
  const validation = editor.validateTemplate();
  if (validation.valid) {
    const corrected = editor.export();
    await storage.saveTemplate(templateId, corrected, metadata);
  }
} else {
  // Auto-approve high confidence extractions
  await storage.saveTemplate(templateId, extracted, metadata);
}
```

## Troubleshooting

### Issue: Cannot find layer

```typescript
// Always check if layer exists
const layer = editor.getLayer(layerId);
if (!layer) {
  console.error(`Layer '${layerId}' not found`);
  // List available layers
  console.log('Available:', editor.getAllLayers().map(l => l.id));
}
```

### Issue: Validation fails

```typescript
const validation = editor.validateTemplate();
if (!validation.valid) {
  // Show detailed errors
  for (const error of validation.errors) {
    console.log(`[${error.code}] ${error.message}`);
    if (error.fix) {
      console.log(`Fix: ${error.fix}`);
    }
  }
}
```

### Issue: Undo not working

```typescript
// Check if undo is available
if (!editor.canUndo()) {
  console.log('No operations to undo');
  console.log('History:', editor.getOperationHistory());
}
```

## Future Enhancements

- [ ] Visual web-based editor UI
- [ ] Collaborative editing (multi-user)
- [ ] Real-time preview rendering
- [ ] Batch editing operations
- [ ] Template comparison tool
- [ ] Auto-fix suggestions
- [ ] Keyboard shortcuts
- [ ] Layer grouping

## Related Documentation

- [Template DSL Schema](./AD_TEMPLATE_SYSTEM.md)
- [AI Extraction Guide](./TWO_PASS_EXTRACTION_GUIDE.md)
- [Confidence Scoring](./TWO_PASS_EXTRACTION_GUIDE.md#confidence-scoring)
- [Template Storage](./AD_TEMPLATE_SYSTEM.md#template-storage)

## Support

For issues or questions:
1. Check validation messages for guidance
2. Review confidence report for suggestions
3. Use `diff` command to see what changed
4. Consult related documentation
