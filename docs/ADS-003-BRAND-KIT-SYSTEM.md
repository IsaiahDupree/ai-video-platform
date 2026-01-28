# ADS-003: Brand Kit System

**Status**: Complete
**Feature ID**: ADS-003
**Category**: static-ads
**Priority**: P0
**Effort**: 8pts

## Overview

The Brand Kit System provides a comprehensive solution for managing brand assets and applying consistent branding across all ad templates. Each workspace can have multiple brand kits containing logos, colors, typography, spacing, and effects that can be applied to templates with a single operation.

## Features

### 1. Brand Asset Management
- **Logos**: Upload and manage multiple logo variants
  - Primary, secondary, icon, wordmark variants
  - White/black versions for different backgrounds
  - Automatic dimension tracking
- **Colors**: Define complete color palettes
  - Primary, secondary, accent colors
  - Text and background colors
  - Success, warning, error states
  - Custom color definitions
- **Typography**: Configure font families and styles
  - Headline and body fonts
  - Font weight scales (light to black)
  - Font size scales (xs to 5xl)
  - Line height and letter spacing

### 2. Layout & Effects
- **Spacing**: Define consistent spacing scales
  - Base spacing unit
  - Padding scales (xs to xl)
  - Gap scales (xs to xl)
  - Border radius options
- **Effects**: Visual styling options
  - Shadow definitions (sm to xl)
  - Blur amounts
  - Opacity levels

### 3. Template Application
- Apply brand kits to templates with configurable options
- Selective application (colors only, typography only, etc.)
- Logo variant selection
- Override specific values while maintaining brand consistency
- Automatic scaling based on template dimensions

### 4. Workspace Management
- Multiple brand kits per workspace
- Default brand kit selection
- Search and filter brand kits
- Import/export functionality
- Version tracking

## Architecture

### Type System

#### BrandKit Interface
```typescript
interface BrandKit {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  logos: BrandLogo[];
  primaryLogo?: string;
  colors: BrandColors;
  typography: BrandTypography;
  spacing?: BrandSpacing;
  effects?: BrandEffects;
  createdAt: string;
  updatedAt: string;
  version: string;
  isDefault?: boolean;
}
```

#### BrandLogo Interface
```typescript
interface BrandLogo {
  id: string;
  name: string;
  path: string;
  width: number;
  height: number;
  format: 'png' | 'svg' | 'jpg' | 'webp';
  variant?: 'primary' | 'secondary' | 'icon' | 'wordmark' | 'white' | 'black';
  backgroundColor?: string;
}
```

#### BrandColors Interface
```typescript
interface BrandColors {
  primary: string;
  secondary?: string;
  accent?: string;
  background?: string;
  text: string;
  textSecondary?: string;
  success?: string;
  warning?: string;
  error?: string;
  custom?: Record<string, string>;
}
```

### Service Layer

#### BrandKitManager Class
The main service class for managing brand kits:

```typescript
class BrandKitManager {
  // CRUD operations
  async createBrandKit(brandKit: Omit<BrandKit, 'createdAt' | 'updatedAt' | 'version'>): Promise<BrandKit>
  async getBrandKit(id: string): Promise<BrandKit | null>
  async updateBrandKit(id: string, updates: Partial<BrandKit>): Promise<BrandKit>
  async deleteBrandKit(id: string): Promise<boolean>
  async listBrandKits(criteria?: BrandKitSearchCriteria): Promise<BrandKit[]>

  // Workspace operations
  async getDefaultBrandKit(workspaceId: string): Promise<BrandKit | null>
  async setDefaultBrandKit(id: string): Promise<BrandKit>

  // Logo management
  async addLogo(brandKitId: string, logo: BrandLogo): Promise<BrandKit>
  async removeLogo(brandKitId: string, logoId: string): Promise<BrandKit>
  async setPrimaryLogo(brandKitId: string, logoId: string): Promise<BrandKit>

  // Template application
  applyBrandKitToTemplate(
    template: AdTemplate,
    brandKit: BrandKit,
    options?: BrandKitApplicationOptions
  ): AdTemplate

  // Import/Export
  async exportBrandKit(id: string, outputPath: string): Promise<void>
  async importBrandKit(inputPath: string, workspaceId?: string): Promise<BrandKit>
}
```

## File Structure

```
ai-video-platform/
├── src/
│   ├── types/
│   │   └── brandKit.ts           # Type definitions
│   └── services/
│       └── brandKit.ts            # Brand kit manager service
├── data/
│   └── brand-kits/                # Brand kit JSON files
│       ├── tech-startup-001.json
│       └── eco-brand-002.json
├── public/
│   └── assets/
│       └── brands/                # Logo assets organized by brand
│           ├── tech-startup/
│           │   ├── logo.svg
│           │   ├── icon.svg
│           │   └── logo-white.svg
│           └── eco-brand/
│               └── logo.svg
├── scripts/
│   └── manage-brand-kits.ts      # CLI tool
└── docs/
    └── ADS-003-BRAND-KIT-SYSTEM.md
```

## CLI Usage

### List Brand Kits
```bash
# List all brand kits
npm run manage-brand-kits list

# List brand kits for specific workspace
npm run manage-brand-kits list workspace-001
```

### View Brand Kit Details
```bash
npm run manage-brand-kits info tech-startup-001
```

Output:
```
============================================================
Brand Kit: Tech Startup
============================================================
ID: tech-startup-001
Workspace: workspace-001
Default: Yes
Description: Modern tech startup brand with vibrant blue and purple colors

Colors:
  Primary: #3b82f6
  Secondary: #8b5cf6
  Text: #1f2937
  Background: #ffffff

Typography:
  Headline Font: Inter, system-ui, -apple-system, sans-serif
  Body Font: Inter, system-ui, -apple-system, sans-serif

Logos: 3
  1. Tech Startup Logo (Primary)
     ID: logo-primary-001
     Path: /assets/brands/tech-startup/logo.svg
     Size: 200x60
     Format: svg
     Variant: primary
  ...
```

### Create New Brand Kit
```bash
npm run manage-brand-kits create workspace-001 "My Brand" "Company brand guidelines"
```

### Manage Default Brand Kit
```bash
# Set a brand kit as default for its workspace
npm run manage-brand-kits set-default tech-startup-001
```

### Logo Management
```bash
# Add logo to brand kit
npm run manage-brand-kits add-logo tech-startup-001 \
  /path/to/logo.svg "Company Logo" primary

# Remove logo from brand kit
npm run manage-brand-kits remove-logo tech-startup-001 logo-primary-001
```

### Apply Brand Kit to Template
```bash
# Apply brand kit to a template
npm run manage-brand-kits apply \
  src/templates/ads/app-launch.json \
  tech-startup-001 \
  output/branded-template.json
```

### Test Brand Kit Application
```bash
# Test applying a brand kit to a sample template
npm run manage-brand-kits test-apply tech-startup-001
```

Output:
```
Testing brand kit application: tech-startup-001

Original template: App Launch - Bold Gradient
  Primary Color: #667eea
  Headline Font: Inter, system-ui, sans-serif
  Logo: None

After applying brand kit:
  Primary Color: #3b82f6
  Headline Font: Inter, system-ui, -apple-system, sans-serif
  Logo: /assets/brands/tech-startup/logo.svg

Brand kit application successful!
```

### Import/Export
```bash
# Export brand kit to JSON
npm run manage-brand-kits export tech-startup-001 my-brand.json

# Import brand kit from JSON
npm run manage-brand-kits import my-brand.json workspace-002
```

## API Usage

### Basic Usage

```typescript
import { brandKitManager } from './src/services/brandKit';
import { createBrandKit } from './src/types/brandKit';

// Create a new brand kit
const brandKit = createBrandKit({
  id: 'my-brand-001',
  workspaceId: 'workspace-001',
  name: 'My Brand',
  description: 'Company brand guidelines',
});

await brandKitManager.createBrandKit(brandKit);

// Get brand kit
const retrieved = await brandKitManager.getBrandKit('my-brand-001');

// List all brand kits for workspace
const brandKits = await brandKitManager.listBrandKits({
  workspaceId: 'workspace-001'
});

// Get default brand kit for workspace
const defaultBrandKit = await brandKitManager.getDefaultBrandKit('workspace-001');
```

### Update Brand Kit

```typescript
// Update colors
await brandKitManager.updateBrandKit('my-brand-001', {
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    text: '#1f2937',
    background: '#ffffff',
  }
});

// Update typography
await brandKitManager.updateBrandKit('my-brand-001', {
  typography: {
    headlineFont: 'Helvetica Neue, sans-serif',
    bodyFont: 'Arial, sans-serif',
  }
});
```

### Logo Management

```typescript
import { BrandLogo } from './src/types/brandKit';

// Add logo
const logo: BrandLogo = {
  id: 'logo-001',
  name: 'Primary Logo',
  path: '/assets/brands/my-brand/logo.svg',
  width: 200,
  height: 60,
  format: 'svg',
  variant: 'primary',
};

await brandKitManager.addLogo('my-brand-001', logo);

// Set primary logo
await brandKitManager.setPrimaryLogo('my-brand-001', 'logo-001');

// Remove logo
await brandKitManager.removeLogo('my-brand-001', 'logo-001');
```

### Apply to Template

```typescript
import { AdTemplate } from './src/types/adTemplate';

// Load template
const template: AdTemplate = /* load from file or database */;

// Load brand kit
const brandKit = await brandKitManager.getBrandKit('my-brand-001');

// Apply brand kit to template
const brandedTemplate = brandKitManager.applyBrandKitToTemplate(
  template,
  brandKit,
  {
    applyColors: true,
    applyTypography: true,
    applyLogo: true,
    logoPosition: 'top-left',
    logoSize: 80,
  }
);

// Apply with overrides
const customBrandedTemplate = brandKitManager.applyBrandKitToTemplate(
  template,
  brandKit,
  {
    applyColors: true,
    overrides: {
      colors: {
        primary: '#custom-color', // Override just the primary color
      }
    }
  }
);
```

## Brand Kit Application Options

### BrandKitApplicationOptions

```typescript
interface BrandKitApplicationOptions {
  // What to apply
  applyColors?: boolean;          // Apply color palette
  applyTypography?: boolean;      // Apply font settings
  applySpacing?: boolean;         // Apply spacing scales
  applyEffects?: boolean;         // Apply shadow/blur effects
  applyLogo?: boolean;            // Add brand logo

  // Logo configuration
  logoVariant?: 'primary' | 'secondary' | 'icon' | 'wordmark' | 'white' | 'black';
  logoPosition?: 'top-left' | 'top-center' | 'top-right' |
                 'bottom-left' | 'bottom-center' | 'bottom-right';
  logoSize?: number;              // Logo size in pixels

  // Overrides
  overrides?: {
    colors?: Partial<BrandColors>;
    typography?: Partial<BrandTypography>;
    spacing?: Partial<BrandSpacing>;
  };
}
```

### Application Examples

#### Apply Everything
```typescript
const result = brandKitManager.applyBrandKitToTemplate(template, brandKit);
```

#### Apply Only Colors
```typescript
const result = brandKitManager.applyBrandKitToTemplate(template, brandKit, {
  applyColors: true,
  applyTypography: false,
  applySpacing: false,
  applyEffects: false,
  applyLogo: false,
});
```

#### Apply with Logo Variant
```typescript
const result = brandKitManager.applyBrandKitToTemplate(template, brandKit, {
  applyLogo: true,
  logoVariant: 'white',
  logoPosition: 'top-center',
  logoSize: 100,
});
```

#### Apply with Color Override
```typescript
const result = brandKitManager.applyBrandKitToTemplate(template, brandKit, {
  applyColors: true,
  overrides: {
    colors: {
      primary: '#custom-blue',  // Override primary color only
    }
  }
});
```

## Example Brand Kits

The system includes two example brand kits:

### 1. Tech Startup (tech-startup-001)
- **Colors**: Blue (#3b82f6) and purple (#8b5cf6)
- **Font**: Inter
- **Style**: Modern, vibrant, tech-focused
- **Logos**: 3 variants (primary, icon, white)

### 2. Eco Brand (eco-brand-002)
- **Colors**: Green (#10b981) and emerald (#059669)
- **Font**: Montserrat (headlines), Lato (body)
- **Style**: Natural, eco-friendly, earthy
- **Logos**: 1 primary logo

## Default Values

The system provides sensible defaults for all brand kit properties:

### Default Colors
```typescript
{
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  accent: '#06b6d4',
  background: '#ffffff',
  text: '#1f2937',
  textSecondary: '#6b7280',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
}
```

### Default Typography
```typescript
{
  headlineFont: 'Inter, system-ui, -apple-system, sans-serif',
  bodyFont: 'Inter, system-ui, -apple-system, sans-serif',
  fontWeights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },
  fontSizes: {
    xs: 12, sm: 14, base: 16, lg: 18, xl: 20,
    '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48,
  },
}
```

### Default Spacing
```typescript
{
  unit: 4,
  padding: { xs: 8, sm: 16, md: 24, lg: 32, xl: 48 },
  gap: { xs: 8, sm: 12, md: 16, lg: 24, xl: 32 },
  borderRadius: { none: 0, sm: 4, md: 8, lg: 16, full: 9999 },
}
```

## Type Guards

The system includes type guards for runtime validation:

```typescript
import { isBrandKit, isBrandLogo } from './src/types/brandKit';

// Validate brand kit
if (isBrandKit(data)) {
  // TypeScript knows this is a valid BrandKit
  console.log(data.colors.primary);
}

// Validate logo
if (isBrandLogo(logoData)) {
  // TypeScript knows this is a valid BrandLogo
  console.log(logoData.path);
}
```

## Integration

### With Ad Template System (ADS-001)
Brand kits seamlessly integrate with the ad template system:
- Apply brand kits to any template
- Override template colors, fonts, and logos
- Maintain template layout while updating branding

### With Starter Templates (ADS-002)
Use brand kits to quickly rebrand starter templates:
```typescript
// Load starter template
const template = getTemplateById('app-launch-001');

// Apply your brand
const branded = brandKitManager.applyBrandKitToTemplate(
  template,
  myBrandKit
);
```

### With Ad Editor UI (ADS-004)
Brand kits will be selectable in the ad editor UI:
- Dropdown to select brand kit
- Quick brand switching
- Live preview of brand application

## Best Practices

### 1. Logo Management
- Upload logos in SVG format for best quality
- Provide white and dark variants for different backgrounds
- Create icon-only versions for small sizes
- Use appropriate dimensions (200x60 for horizontal logos)

### 2. Color Palettes
- Use accessible color combinations (WCAG AA)
- Define both light and dark variants
- Include semantic colors (success, warning, error)
- Test colors on different backgrounds

### 3. Typography
- Use web-safe font stacks with fallbacks
- Define consistent size scales
- Set appropriate line heights for readability
- Consider mobile vs desktop sizing

### 4. Spacing
- Use consistent spacing units (multiples of 4px)
- Define scales for different use cases
- Test spacing on various template sizes
- Maintain visual hierarchy

### 5. Brand Kit Organization
- Use descriptive names for brand kits
- Set one brand kit as default per workspace
- Version brand kits as they evolve
- Document brand kit usage guidelines

## Testing

### TypeScript Compilation
```bash
npm run build
```

### CLI Testing
```bash
# List brand kits
npm run manage-brand-kits list

# View details
npm run manage-brand-kits info tech-startup-001

# Test application
npm run manage-brand-kits test-apply tech-startup-001
```

### Integration Testing
```typescript
import { brandKitManager } from './src/services/brandKit';

// Test CRUD operations
const brandKit = await brandKitManager.createBrandKit(/* ... */);
const retrieved = await brandKitManager.getBrandKit(brandKit.id);
await brandKitManager.updateBrandKit(brandKit.id, { /* ... */ });
await brandKitManager.deleteBrandKit(brandKit.id);

// Test application
const template = /* load template */;
const branded = brandKitManager.applyBrandKitToTemplate(template, brandKit);
```

## Performance Considerations

### Storage
- Brand kits stored as JSON files in `data/brand-kits/`
- Logos stored separately in `public/assets/brands/`
- Minimal storage footprint (~5-10KB per brand kit)
- Fast read/write operations

### Application
- Brand kit application is synchronous and fast
- No external API calls required
- Template cloning uses JSON serialization
- Suitable for real-time preview updates

### Scaling
- Supports unlimited brand kits per workspace
- No database required for MVP
- Can migrate to database if needed
- Logo CDN integration possible

## Future Enhancements

### Phase 2 (Post-MVP)
- [ ] Brand kit versioning and history
- [ ] Brand kit sharing between workspaces
- [ ] Team collaboration on brand kits
- [ ] Brand kit templates and presets
- [ ] Advanced logo management (multiple sizes)
- [ ] Color palette generation from images
- [ ] Font upload and hosting
- [ ] Brand guidelines export (PDF)

### Phase 3 (Enterprise)
- [ ] Brand compliance checking
- [ ] Approval workflows for brand updates
- [ ] Usage analytics per brand kit
- [ ] A/B testing with different brand variants
- [ ] API for external integrations
- [ ] Figma plugin for brand sync

## Related Features

- **ADS-001**: Static Ad Template System
- **ADS-002**: Starter Template Library
- **ADS-004**: Ad Editor UI
- **ADS-007**: renderStill Service
- **ADS-014**: Workspace Auth

## Conclusion

The Brand Kit System provides a robust, flexible foundation for managing brand assets and applying consistent branding across all ad creatives. The system is designed for ease of use, with a comprehensive CLI, programmatic API, and sensible defaults that make it quick to get started while providing the flexibility needed for complex brand requirements.

## Version History

- **1.0** (2026-01-28): Initial implementation
  - Complete type system
  - Brand kit manager service
  - CLI tool with full CRUD operations
  - Template application functionality
  - Example brand kits
  - Comprehensive documentation
