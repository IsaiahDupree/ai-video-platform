# APP-022: Screenshot Template Library

**Status**: ✅ Completed
**Priority**: P2
**Effort**: 8pts
**Category**: apple-pages
**Dependencies**: APP-001 (Screenshot Device Frames)

## Overview

The Screenshot Template Library provides a collection of 10 pre-built templates for common screenshot styles. These templates combine device frames with caption overlays, making it easy to create professional App Store screenshots quickly without starting from scratch.

## Features

### Core Features

1. **10 Pre-built Templates**
   - Feature showcase templates (3)
   - Minimal design template (1)
   - Testimonial template (1)
   - Tutorial/onboarding templates (2)
   - Comparison template (1)
   - Marketing template (1)
   - Technical specs template (1)

2. **Template System**
   - Strong TypeScript types
   - JSON-based template definitions
   - Metadata for discoverability
   - Theme support (light/dark)
   - Device type compatibility

3. **Powerful Filtering & Search**
   - Filter by category (9 categories)
   - Filter by layout type (8 layouts)
   - Filter by theme (light/dark)
   - Filter by device type
   - Filter by tags
   - Filter by industry
   - Full-text search
   - Featured templates
   - Popular templates

4. **Helper Functions**
   - Get template by ID
   - Filter by multiple criteria
   - Search functionality
   - Get unique values (categories, themes, etc.)
   - Template statistics

5. **Template Gallery UI**
   - Browse all templates
   - Visual preview placeholders
   - Advanced filtering
   - Search functionality
   - Responsive design
   - Featured badges
   - Metadata display

## Architecture

### Type System

**Location**: `src/types/screenshotTemplate.ts`

Key types:
- `ScreenshotTemplate`: Main template definition
- `ScreenshotLayoutType`: Layout classification (hero, multi-caption, etc.)
- `ScreenshotCategory`: Category classification (feature-showcase, tutorial, etc.)
- `ScreenshotTheme`: Theme support (light, dark, auto)
- `TemplateDeviceConfig`: Device and frame configuration
- `TemplateFilterOptions`: Filtering options
- `TemplateStatistics`: Template statistics

### Template Library

**Location**: `src/templates/screenshots/`

Structure:
```
src/templates/screenshots/
├── index.ts                          # Helper functions
├── README.md                         # Library documentation
├── feature-highlight-hero.json       # Template
├── feature-list-multi.json           # Template
├── minimal-bottom.json               # Template
├── testimonial-center.json           # Template
├── tutorial-step.json                # Template
├── comparison-sidebyside.json        # Template
├── badge-feature.json                # Template
├── marketing-gradient.json           # Template
├── onboarding-welcome.json           # Template
└── technical-specs.json              # Template
```

### UI Components

**Location**: `src/app/screenshots/templates/`

- `page.tsx`: Main template gallery page
- `templates.module.css`: Styling

## Template Categories

### 1. Feature Showcase
- **Feature Highlight - Hero**: Bold hero caption at top
- **Feature List - Multi Caption**: Multiple features in one screenshot
- **Feature Badge - Highlight**: Small badge for specific features

### 2. Minimal
- **Minimal - Bottom Caption**: Clean design with subtle text

### 3. Testimonial
- **Testimonial - Centered Quote**: Customer quotes and reviews

### 4. Tutorial
- **Tutorial - Step Number**: Numbered steps for onboarding
- **Onboarding - Welcome Screen**: Friendly welcome message

### 5. Comparison
- **Comparison - Side by Side**: Before/after or feature comparisons

### 6. Marketing
- **Marketing - Gradient Overlay**: Bold promotional screenshots

### 7. Technical
- **Technical - Specifications**: Clean specs and metrics display

## Usage

### Basic Usage

```typescript
import {
  SCREENSHOT_TEMPLATES,
  getTemplateById,
  filterTemplates,
} from '@/templates/screenshots';

// Get all templates
const allTemplates = SCREENSHOT_TEMPLATES;

// Get specific template
const heroTemplate = getTemplateById('feature-highlight-hero');

// Use template data
if (heroTemplate) {
  console.log('Device:', heroTemplate.deviceConfig.device);
  console.log('Captions:', heroTemplate.captionLayers.length);
}
```

### Filtering Templates

```typescript
import { filterTemplates } from '@/templates/screenshots';

// Filter by single category
const featureTemplates = filterTemplates({
  category: 'feature-showcase',
});

// Filter by theme
const darkThemes = filterTemplates({
  themes: 'dark',
});

// Filter by multiple criteria
const darkiPhoneFeatures = filterTemplates({
  category: 'feature-showcase',
  themes: 'dark',
  deviceTypes: 'iphone',
});

// Search by text
const heroResults = filterTemplates({
  searchQuery: 'hero',
});

// Get featured templates only
const featured = filterTemplates({
  featured: true,
});
```

### Helper Functions

```typescript
import {
  getTemplatesByCategory,
  getTemplatesByTheme,
  getTemplatesByTag,
  getFeaturedTemplates,
  searchTemplates,
  getAllCategories,
  getTemplateStatistics,
} from '@/templates/screenshots';

// Get by specific criteria
const tutorials = getTemplatesByCategory('tutorial');
const darkThemes = getTemplatesByTheme('dark');
const heroTags = getTemplatesByTag('hero');
const featured = getFeaturedTemplates();

// Search
const searchResults = searchTemplates('tutorial');

// Get metadata
const categories = getAllCategories();
const stats = getTemplateStatistics();
console.log(`Total templates: ${stats.totalTemplates}`);
```

### Using Templates in Components

```typescript
import { getTemplateById } from '@/templates/screenshots';
import { DeviceFrame } from '@/components/DeviceFrame';
import { CaptionOverlay } from '@/components/CaptionOverlay';

function MyScreenshot() {
  const template = getTemplateById('feature-highlight-hero');

  if (!template) return null;

  return (
    <DeviceFrame
      device={template.deviceConfig.device}
      orientation={template.deviceConfig.orientation}
      style={template.deviceConfig.style}
    >
      {template.captionLayers.map((caption) => (
        <CaptionOverlay key={caption.id} {...caption} />
      ))}
    </DeviceFrame>
  );
}
```

## Template Structure

Each template JSON file contains:

```typescript
{
  "id": "template-id",
  "name": "Template Name",
  "description": "What this template is for",

  // Device configuration
  "deviceConfig": {
    "device": "iphone-16-pro-max",
    "orientation": "portrait",
    "style": {
      "frameColor": "#1d1d1f",
      "shadow": true,
      // ... more frame styling
    }
  },

  // Caption layers (0 or more)
  "captionLayers": [
    {
      "id": "caption-1",
      "text": "Caption text here",
      "positioning": {
        "preset": "top-center",
        "margin": { /* ... */ }
      },
      "style": {
        "font": { /* ... */ },
        "color": "#ffffff",
        // ... more styling
      }
    }
  ],

  // Layout classification
  "layoutType": "hero",

  // Optional background color
  "backgroundColor": "#007AFF",

  // Metadata for discovery and filtering
  "metadata": {
    "category": "feature-showcase",
    "tags": ["hero", "bold", "feature"],
    "supportedDeviceTypes": ["iphone", "ipad"],
    "themes": ["dark"],
    "useCase": "Description of when to use this",
    "industry": ["technology", "productivity"],
    "version": "1.0",
    "featured": true,
    "popularity": 0
  }
}
```

## Testing

### Run Tests

```bash
npm run test:screenshot-templates
```

### Test Coverage

The test script (`scripts/test-screenshot-templates.ts`) validates:

1. **Template Loading** (2 tests)
   - All templates load correctly
   - Template structure is valid

2. **Get By ID** (2 tests)
   - Get template by valid ID
   - Return undefined for invalid ID

3. **Filter by Category** (2 tests)
   - Feature-showcase category
   - Tutorial category

4. **Filter by Layout** (2 tests)
   - Hero layout
   - Multi-caption layout

5. **Filter by Theme** (2 tests)
   - Dark theme
   - Light theme

6. **Filter by Device Type** (2 tests)
   - iPhone device type
   - iPad device type

7. **Filter by Tags** (2 tests)
   - "hero" tag
   - "minimal" tag

8. **Filter by Industry** (1 test)
   - Technology industry

9. **Featured Templates** (1 test)
   - Get featured templates

10. **Popular Templates** (1 test)
    - Get and sort by popularity

11. **Search** (2 tests)
    - Search by name
    - Search by description

12. **Complex Filtering** (3 tests)
    - Multiple criteria
    - Tags + layout
    - Featured filter

13. **Get Unique Values** (6 tests)
    - Categories, layouts, themes, device types, industries, tags

14. **Statistics** (2 tests)
    - Get statistics
    - Pre-computed stats

15. **Content Validation** (2 tests)
    - Device configs
    - Caption layers

**Total**: 32 tests, all passing ✅

## UI Pages

### Template Gallery

**URL**: `/screenshots/templates`

Features:
- Browse all 10 templates
- Visual preview placeholders
- Filter by category, theme, layout, device type
- Search by text
- Toggle featured templates only
- Results count
- Empty state for no matches
- Responsive design

## Integration Points

The Screenshot Template Library integrates with:

1. **APP-001: Screenshot Device Frames**
   - Uses DeviceFrame component
   - Leverages device configurations

2. **APP-002: Caption Overlay System**
   - Uses CaptionOverlay component
   - Leverages caption presets

3. **APP-003: Screenshot Size Generator**
   - Can apply templates during batch generation

4. **APP-025: Screenshot Editor UI**
   - Can load templates in editor
   - Provides starting point for customization

## Adding New Templates

To add a new template:

1. **Create JSON file** in `src/templates/screenshots/`
   ```json
   {
     "id": "my-template-id",
     "name": "My Template Name",
     // ... rest of template
   }
   ```

2. **Import in index.ts**
   ```typescript
   import myTemplate from './my-template-id.json';
   ```

3. **Add to array**
   ```typescript
   export const SCREENSHOT_TEMPLATES: ScreenshotTemplate[] = [
     // ... existing templates
     myTemplate,
   ] as ScreenshotTemplate[];
   ```

4. **Run tests** to validate
   ```bash
   npm run test:screenshot-templates
   ```

## Statistics

- **Total Templates**: 10
- **Categories**: 9 (feature-showcase, tutorial, testimonial, onboarding, marketing, technical, minimal, comparison, social-proof)
- **Layout Types**: 8 (single-caption, multi-caption, hero, minimal, testimonial, comparison, tutorial, custom)
- **Themes**: 2 (light, dark)
- **Device Types**: 2 (iphone, ipad)
- **Featured Templates**: 4

## Future Enhancements

Potential improvements:
1. More templates (20-30 total)
2. Preview image generation
3. Template customization UI
4. Template export/import
5. Community template sharing
6. AI-generated templates
7. Template versioning
8. Usage analytics
9. Template recommendations
10. iPad-specific templates

## Files

### Created Files

**Types:**
- `src/types/screenshotTemplate.ts` (273 lines)

**Templates:**
- `src/templates/screenshots/index.ts` (394 lines)
- `src/templates/screenshots/README.md` (172 lines)
- `src/templates/screenshots/feature-highlight-hero.json`
- `src/templates/screenshots/feature-list-multi.json`
- `src/templates/screenshots/minimal-bottom.json`
- `src/templates/screenshots/testimonial-center.json`
- `src/templates/screenshots/tutorial-step.json`
- `src/templates/screenshots/comparison-sidebyside.json`
- `src/templates/screenshots/badge-feature.json`
- `src/templates/screenshots/marketing-gradient.json`
- `src/templates/screenshots/onboarding-welcome.json`
- `src/templates/screenshots/technical-specs.json`

**UI:**
- `src/app/screenshots/templates/page.tsx` (248 lines)
- `src/app/screenshots/templates/templates.module.css` (336 lines)

**Tests:**
- `scripts/test-screenshot-templates.ts` (445 lines)

**Modified:**
- `package.json` (added test script)
- `feature_list.json` (marked APP-022 as passing)

**Total**: 16 files created/modified

## References

- Related Feature: APP-001 (Screenshot Device Frames)
- Related Feature: APP-002 (Caption Overlay System)
- Related Feature: APP-003 (Screenshot Size Generator)
- Related Feature: APP-025 (Screenshot Editor UI)
- GitHub Issue: #22

## Version

Current version: 1.0
Completion date: January 28, 2026
