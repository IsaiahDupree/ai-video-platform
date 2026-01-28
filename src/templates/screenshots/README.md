# Screenshot Templates Library

Pre-built templates for common screenshot styles. These templates combine device frames with caption overlays to create professional App Store screenshots quickly.

## Available Templates

### Feature Showcase

1. **Feature Highlight - Hero** (`feature-highlight-hero`)
   - Bold hero caption at the top
   - Perfect for main value proposition
   - Dark theme with shadow effects
   - Featured template

2. **Feature List - Multi Caption** (`feature-list-multi`)
   - Multiple captions for different features
   - Clean, organized layout
   - Light theme with frosted glass effect
   - Featured template

3. **Feature Badge - Highlight** (`badge-feature`)
   - Small badge to highlight new features
   - Minimal, accent style
   - Light theme
   - Great for detail highlights

### Minimal Design

4. **Minimal - Bottom Caption** (`minimal-bottom`)
   - Clean design with subtle text
   - Caption at bottom
   - Dark theme
   - Lets UI shine through

### Testimonials & Social Proof

5. **Testimonial - Centered Quote** (`testimonial-center`)
   - Centered quote with attribution
   - Serif font for elegance
   - Light theme with card design
   - Featured template

### Tutorials & Onboarding

6. **Tutorial - Step Number** (`tutorial-step`)
   - Numbered badge with instruction
   - Perfect for onboarding flows
   - Dark theme with frosted glass
   - Sequential step design

7. **Onboarding - Welcome Screen** (`onboarding-welcome`)
   - Friendly welcome message
   - Title and subtitle layout
   - Light theme
   - Clean, inviting design

### Comparisons

8. **Comparison - Side by Side** (`comparison-sidebyside`)
   - Before/after labels
   - Contrasting color badges
   - Light theme
   - Great for showing improvements

### Marketing

9. **Marketing - Gradient Overlay** (`marketing-gradient`)
   - Bold promotional caption
   - Gradient background
   - Dark theme with dramatic shadows
   - Featured template

### Technical

10. **Technical - Specifications** (`technical-specs`)
    - Clean specs display
    - Monospace font for labels
    - Dark theme with frosted glass
    - Professional, data-focused

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

// Filter by category
const featureTemplates = filterTemplates({
  category: 'feature-showcase',
});

// Filter by multiple criteria
const darkiPhoneTemplates = filterTemplates({
  themes: 'dark',
  deviceTypes: 'iphone',
});
```

### Search & Filter

```typescript
import {
  searchTemplates,
  getTemplatesByCategory,
  getTemplatesByTheme,
  getFeaturedTemplates,
} from '@/templates/screenshots';

// Search by text
const searchResults = searchTemplates('hero');

// Get by category
const tutorials = getTemplatesByCategory('tutorial');

// Get by theme
const darkThemes = getTemplatesByTheme('dark');

// Get featured templates
const featured = getFeaturedTemplates();
```

### Statistics

```typescript
import { TEMPLATE_STATS, getTemplateStatistics } from '@/templates/screenshots';

console.log(`Total templates: ${TEMPLATE_STATS.totalTemplates}`);
console.log(`Categories: ${TEMPLATE_STATS.categories}`);
console.log(`Most popular:`, TEMPLATE_STATS.mostPopular);

// Get fresh statistics
const stats = getTemplateStatistics();
```

## Template Structure

Each template includes:

- **Device Configuration**: Device model, orientation, frame styling
- **Caption Layers**: One or more caption overlays with positioning and styling
- **Layout Type**: Classification of the template layout
- **Metadata**: Category, tags, themes, use cases, industries

## Categories

- `feature-showcase`: Highlight product features
- `tutorial`: Step-by-step guides
- `testimonial`: Customer quotes and reviews
- `onboarding`: Welcome and setup screens
- `marketing`: Promotional and campaign screenshots
- `technical`: Technical details and specs
- `minimal`: Clean, simple designs
- `comparison`: Before/after, feature comparisons
- `social-proof`: Reviews, ratings, badges

## Themes

- `light`: Light background with dark text
- `dark`: Dark background with light text
- `auto`: Adapts to system theme

## Supported Device Types

All templates support:
- iPhone (all models)
- iPad (all models)

Some templates may be optimized for specific device types.

## Customization

Templates are designed to be customizable:

1. **Change text**: Override caption text
2. **Change device**: Use different device model or orientation
3. **Change colors**: Modify background and text colors
4. **Change images**: Provide your own screenshot images
5. **Add/remove layers**: Modify caption layers

## Adding New Templates

To add a new template:

1. Create a JSON file in this directory following the `ScreenshotTemplate` type
2. Import it in `index.ts`
3. Add it to the `SCREENSHOT_TEMPLATES` array
4. Update this README

## Integration

These templates integrate with:

- **APP-001**: Screenshot Device Frames
- **APP-002**: Caption Overlay System
- **APP-003**: Screenshot Size Generator
- **APP-025**: Screenshot Editor UI

## Version

Current version: 1.0

All templates are at version 1.0.
