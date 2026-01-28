# ADS-011: Campaign Pack Generator

Generate all sizes for a campaign with copy variants

## Overview

The Campaign Pack Generator allows you to create multiple ad creative variations by combining:
- **Copy Variants**: Different versions of ad copy (headlines, subheadlines, body text, CTAs)
- **Ad Sizes**: Multiple standard sizes for different platforms
- **Batch Rendering**: Automatically generates all combinations
- **Organized Export**: ZIP file with organized folder structure and manifest

## Features

### 1. Copy Variant Management
- Create unlimited copy variants
- Each variant can have different:
  - Headline
  - Subheadline
  - Body text
  - Call-to-action (CTA)
- Easy-to-use form interface
- Add/remove variants on the fly

### 2. Size Selection
- Choose from 40+ standard ad sizes
- Organized by platform (Instagram, Facebook, Twitter, LinkedIn, etc.)
- Visual size picker with dimensions and aspect ratios
- Select/deselect sizes with checkboxes
- Recommended sizes highlighted

### 3. Output Configuration
- **Image Format**: PNG, JPEG, or WebP
- **Quality**: Adjustable quality for lossy formats (JPEG/WebP)
- **Organization Mode**:
  - By Variant: `variant/size/file.png`
  - By Size: `size/variant/file.png`
  - Flat: All files in root directory
- **File Naming Templates**:
  - `{variantName}_{sizeName}`
  - `{sizeName}_{variantName}`
  - `{campaignName}_{variantName}_{width}x{height}`
  - `{variantName}_{platform}_{width}x{height}`
- **Manifest**: Optional `manifest.json` with metadata

### 4. Batch Generation
- Generates all variant × size combinations
- Progress tracking
- Error handling for failed renders
- ZIP export with organized structure

## Usage

### Web Interface

Navigate to `/ads/campaign` to access the Campaign Pack Generator UI.

#### Step 1: Campaign Settings
```
- Campaign Name: "Summer Sale 2026"
- Description: "Summer promotional campaign"
- Base Template: Choose from starter templates
- Client/Brand: Optional metadata
```

#### Step 2: Copy Variants
Create multiple variants with different messaging:

```
Variant 1: "Limited Time Offer"
- Headline: "Save 50% This Summer"
- Subheadline: "Limited time only"
- Body: "Get amazing deals on all products"
- CTA: "Shop Now"

Variant 2: "New Arrivals"
- Headline: "New Summer Collection"
- Subheadline: "Fresh styles for the season"
- Body: "Discover our latest arrivals"
- CTA: "Explore Now"
```

#### Step 3: Select Sizes
Choose ad sizes for your target platforms:
- Instagram Square (1080×1080)
- Instagram Story (1080×1920)
- Facebook Feed (1200×628)
- Twitter Post (1200×675)
- LinkedIn Square (1200×1200)

#### Step 4: Output Settings
```
Format: PNG
Quality: 90 (for JPEG/WebP)
Organization: By Variant
File Naming: {variantName}_{sizeName}
Include Manifest: Yes
```

#### Step 5: Generate
Click "Generate Campaign" to create all assets. The system will:
1. Create all variant × size combinations
2. Render each asset
3. Organize files according to your settings
4. Generate manifest.json
5. Create ZIP file for download

### Programmatic Usage

```typescript
import { generateCampaign } from '../services/campaignGenerator';
import { Campaign, createDefaultCampaign } from '../types/campaign';
import { AdTemplate } from '../types/adTemplate';

// Load base template
const baseTemplate: AdTemplate = {
  // ... your template configuration
};

// Create campaign
const campaign = createDefaultCampaign(baseTemplate);

// Configure campaign
campaign.name = 'Summer Sale 2026';
campaign.description = 'Summer promotional campaign';

// Add copy variants
campaign.copyVariants = [
  {
    id: 'variant-1',
    name: 'Limited Time Offer',
    headline: 'Save 50% This Summer',
    subheadline: 'Limited time only',
    body: 'Get amazing deals on all products',
    cta: 'Shop Now',
  },
  {
    id: 'variant-2',
    name: 'New Arrivals',
    headline: 'New Summer Collection',
    subheadline: 'Fresh styles for the season',
    body: 'Discover our latest arrivals',
    cta: 'Explore Now',
  },
];

// Select sizes
campaign.sizes = [
  { sizeId: 'instagram-square', enabled: true },
  { sizeId: 'instagram-story', enabled: true },
  { sizeId: 'facebook-feed', enabled: true },
  { sizeId: 'twitter-post', enabled: true },
];

// Configure output
campaign.output = {
  format: 'png',
  quality: 90,
  fileNamingTemplate: '{variantName}_{sizeName}',
  organizationMode: 'by-variant',
  includeManifest: true,
};

// Generate campaign
const job = await generateCampaign(campaign);

console.log(`Campaign generated!`);
console.log(`Total assets: ${job.totalCount}`);
console.log(`Completed: ${job.completedCount}`);
console.log(`Failed: ${job.failedCount}`);
console.log(`ZIP file: ${job.zipFilePath}`);
```

## File Structure

### Organization Mode: By Variant
```
campaign-123456/
├── manifest.json
├── Limited_Time_Offer/
│   ├── Limited_Time_Offer_Instagram_Square.png
│   ├── Limited_Time_Offer_Instagram_Story.png
│   ├── Limited_Time_Offer_Facebook_Feed.png
│   └── Limited_Time_Offer_Twitter_Post.png
└── New_Arrivals/
    ├── New_Arrivals_Instagram_Square.png
    ├── New_Arrivals_Instagram_Story.png
    ├── New_Arrivals_Facebook_Feed.png
    └── New_Arrivals_Twitter_Post.png
```

### Organization Mode: By Size
```
campaign-123456/
├── manifest.json
├── Instagram_Square/
│   ├── Limited_Time_Offer_Instagram_Square.png
│   └── New_Arrivals_Instagram_Square.png
├── Instagram_Story/
│   ├── Limited_Time_Offer_Instagram_Story.png
│   └── New_Arrivals_Instagram_Story.png
└── ...
```

### Organization Mode: Flat
```
campaign-123456/
├── manifest.json
├── Limited_Time_Offer_Instagram_Square.png
├── Limited_Time_Offer_Instagram_Story.png
├── New_Arrivals_Instagram_Square.png
└── New_Arrivals_Instagram_Story.png
```

## Manifest File

The generated `manifest.json` contains metadata about the campaign:

```json
{
  "campaign": {
    "id": "campaign-123456",
    "name": "Summer Sale 2026",
    "description": "Summer promotional campaign",
    "generatedAt": "2026-01-28T08:30:00.000Z"
  },
  "variants": [
    {
      "id": "variant-1",
      "name": "Limited Time Offer",
      "headline": "Save 50% This Summer",
      "subheadline": "Limited time only",
      "body": "Get amazing deals on all products",
      "cta": "Shop Now"
    }
  ],
  "sizes": [
    {
      "id": "instagram-square",
      "name": "Instagram Square",
      "width": 1080,
      "height": 1080,
      "platform": "Instagram"
    }
  ],
  "assets": [
    {
      "variantId": "variant-1",
      "variantName": "Limited Time Offer",
      "sizeId": "instagram-square",
      "sizeName": "Instagram Square",
      "width": 1080,
      "height": 1080,
      "filePath": "Limited_Time_Offer/Limited_Time_Offer_Instagram_Square.png",
      "fileSizeBytes": 245632
    }
  ],
  "stats": {
    "totalAssets": 8,
    "totalVariants": 2,
    "totalSizes": 4,
    "totalSizeBytes": 1853924,
    "generationTimeMs": 16420
  }
}
```

## File Naming Variables

Available variables for file naming templates:
- `{campaignName}` - Campaign name
- `{variantName}` - Variant name
- `{variantId}` - Variant ID
- `{sizeName}` - Size name
- `{sizeId}` - Size ID
- `{width}` - Width in pixels
- `{height}` - Height in pixels
- `{platform}` - Platform name
- `{index}` - Index number (001, 002, etc.)
- `{timestamp}` - Unix timestamp

## API Reference

### Types

#### Campaign
```typescript
interface Campaign {
  id: string;
  name: string;
  description?: string;
  baseTemplate: AdTemplate;
  copyVariants: CopyVariant[];
  sizes: CampaignSize[];
  output: CampaignOutputSettings;
  metadata?: CampaignMetadata;
}
```

#### CopyVariant
```typescript
interface CopyVariant {
  id: string;
  name: string;
  headline?: string;
  subheadline?: string;
  body?: string;
  cta?: string;
  description?: string;
}
```

#### CampaignSize
```typescript
interface CampaignSize {
  sizeId: string;
  enabled: boolean;
  customName?: string;
}
```

#### CampaignOutputSettings
```typescript
interface CampaignOutputSettings {
  format: 'png' | 'jpeg' | 'webp';
  quality?: number;
  fileNamingTemplate: string;
  organizationMode: 'by-variant' | 'by-size' | 'flat';
  includeManifest: boolean;
}
```

### Functions

#### createDefaultCampaign
```typescript
function createDefaultCampaign(baseTemplate: AdTemplate): Campaign
```

#### validateCampaign
```typescript
function validateCampaign(campaign: Campaign): {
  valid: boolean;
  errors: string[];
}
```

#### getTotalAssetCount
```typescript
function getTotalAssetCount(campaign: Campaign): number
```

#### applyNamingTemplate
```typescript
function applyNamingTemplate(
  template: string,
  variables: FileNamingVariables,
  format: 'png' | 'jpeg' | 'webp'
): string
```

#### sanitizeFilename
```typescript
function sanitizeFilename(name: string): string
```

#### generateCampaign
```typescript
async function generateCampaign(
  campaign: Campaign,
  outputDir?: string
): Promise<CampaignGenerationJob>
```

#### estimateCampaignTime
```typescript
function estimateCampaignTime(campaign: Campaign): {
  totalAssets: number;
  estimatedTimeSeconds: number;
  estimatedSizeBytes: number;
}
```

## Best Practices

### 1. Copy Variant Strategy
- **A/B Testing**: Create 2-3 variants to test different messaging
- **Audience Segments**: Create variants for different target audiences
- **Seasonal Variations**: Adapt messaging for different seasons or events
- **Call-to-Action Testing**: Test different CTAs (Buy Now, Learn More, Shop Now)

### 2. Size Selection
- **Platform-Specific**: Select sizes for your target platforms
- **Recommended First**: Start with recommended sizes, add custom as needed
- **Test Multiple Formats**: Include both square and vertical formats
- **Consider Placement**: Choose sizes appropriate for feed, story, and banner placements

### 3. File Organization
- **By Variant**: Best for reviewing different messaging approaches
- **By Size**: Best for platform-specific uploads
- **Flat**: Best for small campaigns with few assets

### 4. Performance
- **Batch Size**: For large campaigns (100+ assets), consider splitting into multiple batches
- **Format Choice**: PNG for quality, JPEG for smaller file sizes
- **Quality Settings**: Use 85-90 quality for JPEG to balance size and quality

## Troubleshooting

### "Campaign validation failed"
- Ensure campaign has a name
- At least one copy variant required
- At least one size must be selected

### "Generation failed: Template not found"
- Verify base template exists
- Check template ID is correct

### Large ZIP Files
- Use JPEG format instead of PNG
- Reduce quality setting (try 80-85)
- Consider splitting into smaller campaigns

### Slow Generation
- Rendering ~2 seconds per asset is normal
- For 50+ assets, generation may take several minutes
- Use preview mode to test before full generation

## Testing

Run the test suite:
```bash
npx tsx scripts/test-campaign-generator.ts
```

Tests cover:
- Campaign creation
- Variant management
- Size selection
- Asset count calculation
- File naming
- Filename sanitization
- Validation
- Metadata handling

## Integration

### With Brand Kit (ADS-003)
```typescript
// Apply brand kit colors to campaign
campaign.baseTemplate.style.primaryColor = brandKit.colors.primary;
campaign.baseTemplate.style.textColor = brandKit.colors.text;
```

### With Render Queue (ADS-009)
```typescript
// Queue campaign for background processing
const job = await queueCampaignGeneration(campaign);
```

### With Export Service (ADS-010)
```typescript
// Export uses the same ZIP export service
const zipResult = await createZipFromDirectory(campaignDir, zipPath);
```

## Future Enhancements

Potential improvements for future iterations:
- [ ] Preview mode (render 1 asset per variant)
- [ ] Resume failed generations
- [ ] Parallel rendering for faster generation
- [ ] Custom image per variant
- [ ] Variant duplication
- [ ] CSV import for bulk variant creation
- [ ] Template variables in copy
- [ ] Dynamic text sizing per size
- [ ] Progress websocket updates
- [ ] Email notification on completion

## Files

### Types
- `src/types/campaign.ts` - Campaign types and utilities

### Services
- `src/services/campaignGenerator.ts` - Campaign generation service
- `src/services/exportZip.ts` - ZIP export (updated with createZipFromDirectory)

### UI
- `src/app/ads/campaign/page.tsx` - Campaign generator page
- `src/app/ads/campaign/campaign.module.css` - Styles

### Scripts
- `scripts/test-campaign-generator.ts` - Test suite

### Documentation
- `docs/ADS-011-CAMPAIGN-PACK-GENERATOR.md` - This file

## Dependencies

- **ADS-007**: renderStill Service (required for rendering)
- **ADS-008**: Size Presets (required for size selection)
- **ADS-010**: ZIP Export (createZipFromDirectory function)

## Related Features

- **ADS-001**: Static Ad Template System
- **ADS-003**: Brand Kit System
- **ADS-004**: Ad Editor UI
- **ADS-012**: CSV/Feed Batch Import (planned)
