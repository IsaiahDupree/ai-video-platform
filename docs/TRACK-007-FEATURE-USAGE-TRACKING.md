# TRACK-007: Feature Usage Tracking

**Status:** ✅ Implemented
**Category:** Tracking
**Priority:** P2
**Effort:** 8pts

## Overview

Feature Usage Tracking provides insights into which features users engage with most frequently. This helps product teams understand feature adoption, identify popular features, and discover underutilized features that may need promotion or improvement.

## Features Tracked

### 1. Template Usage
Track when users select and apply templates to their projects.

**Event:** `template_used`

**Data Captured:**
- Template ID and type (hero_heading, product_focus, etc.)
- Template name
- Customization level (0-1 scale)
- Timestamp

**Use Cases:**
- Identify most popular template types
- Measure template adoption rates
- A/B test new templates
- Optimize template library

### 2. Voice Cloning
Track voice cloning operations including success/failure rates.

**Event:** `voice_cloned`

**Data Captured:**
- Voice ID and model used (ElevenLabs, IndexTTS, etc.)
- Reference audio duration
- Success/failure status
- Timestamp

**Use Cases:**
- Monitor voice cloning quality
- Track model performance
- Identify optimal audio durations
- Measure feature adoption

### 3. Ad Generation
Track when users generate ad creatives through various methods.

**Event:** `ad_generated`

**Data Captured:**
- Ad ID and template ID
- Generation method (manual, template, AI variant, CSV import)
- Number of variants and sizes
- Timestamp

**Use Cases:**
- Measure ad creation volume
- Compare generation methods
- Track creative output
- Monitor user productivity

### 4. Campaign Creation
Track campaign generation with multiple variants and sizes.

**Event:** `campaign_created`

**Data Captured:**
- Campaign ID and name
- Number of variants
- Number of sizes
- Total ads generated
- Timestamp

**Use Cases:**
- Measure campaign scale
- Track batch generation usage
- Identify power users
- Monitor system load

### 5. Batch Import
Track CSV imports for bulk ad generation.

**Event:** `batch_import`

**Data Captured:**
- Import ID
- Row and column counts
- Mapped fields
- Preview generation status
- Timestamp

**Use Cases:**
- Monitor bulk import usage
- Identify common mappings
- Track import success rates
- Measure scalability needs

### 6. Brand Kit Usage
Track when users apply brand kits to their creatives.

**Event:** `brand_kit_used`

**Data Captured:**
- Brand kit ID and name
- Elements applied (logo, colors, fonts, spacing)
- Associated ad ID
- Timestamp

**Use Cases:**
- Measure brand consistency
- Track brand kit adoption
- Identify popular elements
- Monitor enterprise features

## Implementation

### Client-Side Tracking

```typescript
import {
  trackTemplateUsed,
  trackBrandKitUsed,
  incrementFeatureUsage
} from '@/services/featureUsageTracking';

// Track template selection
trackTemplateUsed(
  'template-001',
  'hero_heading',
  'Modern Hero Template',
  0.5 // 50% customization
);
incrementFeatureUsage('templates_used');

// Track brand kit application
trackBrandKitUsed(
  'brand-kit-001',
  'Tech Startup Brand',
  ['colors', 'fonts', 'logo'],
  'ad-001'
);
incrementFeatureUsage('brand_kits_used');
```

### Server-Side Tracking

```typescript
import { serverTracking } from '@/services/trackingServer';

// Track campaign creation
serverTracking.track('campaign_created', {
  campaignId: 'campaign-001',
  campaignName: 'Summer Sale',
  variantCount: 5,
  sizeCount: 8,
  totalAds: 40,
  timestamp: new Date().toISOString(),
});

// Track batch import
serverTracking.track('batch_import', {
  importId: 'import-001',
  rowCount: 100,
  columnCount: 8,
  mappedFields: ['headline', 'body', 'cta'],
  fieldCount: 3,
  previewGenerated: true,
  timestamp: new Date().toISOString(),
});
```

## Feature Usage Statistics

The system maintains local statistics for quick access to usage counts:

```typescript
import {
  getFeatureUsageStats,
  resetFeatureUsageStats
} from '@/services/featureUsageTracking';

// Get current stats
const stats = getFeatureUsageStats();
console.log({
  templatesUsed: stats.templatesUsed,
  voicesCloned: stats.voicesCloned,
  adsGenerated: stats.adsGenerated,
  campaignsCreated: stats.campaignsCreated,
  batchImports: stats.batchImports,
  brandKitsUsed: stats.brandKitsUsed,
  totalFeatureUsage: stats.totalFeatureUsage,
});

// Reset stats (for testing or data export)
resetFeatureUsageStats();
```

## Integration Points

### Ad Editor
- **Location:** `src/app/ads/editor/page.tsx`
- **Tracks:** Template selection, brand kit application
- **Method:** Client-side tracking on user actions

### Campaign Generator
- **Location:** `src/services/campaignGenerator.ts`
- **Tracks:** Campaign creation
- **Method:** Server-side tracking during generation

### Render Service
- **Location:** `src/services/renderStill.ts`
- **Tracks:** Ad generation
- **Method:** Server-side tracking on render completion

### CSV Import
- **Location:** `src/services/csvImport.ts`
- **Tracks:** Batch imports
- **Method:** Server-side tracking at import start

## Analytics Queries

### Most Popular Templates
```sql
SELECT
  templateType,
  COUNT(*) as usage_count,
  AVG(customizationLevel) as avg_customization
FROM events
WHERE event_name = 'template_used'
GROUP BY templateType
ORDER BY usage_count DESC
```

### Voice Cloning Success Rate
```sql
SELECT
  voiceModel,
  COUNT(*) as total_attempts,
  SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful,
  AVG(referenceAudioDuration) as avg_duration
FROM events
WHERE event_name = 'voice_cloned'
GROUP BY voiceModel
```

### Ad Generation Methods
```sql
SELECT
  method,
  COUNT(*) as ad_count,
  AVG(variantCount) as avg_variants,
  AVG(sizeCount) as avg_sizes
FROM events
WHERE event_name = 'ad_generated'
GROUP BY method
```

### Brand Kit Adoption
```sql
SELECT
  brandKitId,
  brandKitName,
  COUNT(*) as usage_count,
  COUNT(DISTINCT adId) as unique_ads
FROM events
WHERE event_name = 'brand_kit_used'
GROUP BY brandKitId, brandKitName
ORDER BY usage_count DESC
```

## Testing

### Run Test Suite
```bash
npm run test:feature-usage
```

### Manual Testing
```bash
npx ts-node scripts/test-feature-usage-tracking.ts
```

### Test Coverage
- ✅ Template usage tracking
- ✅ Voice cloning tracking
- ✅ Ad generation tracking
- ✅ Campaign creation tracking
- ✅ Batch import tracking
- ✅ Brand kit usage tracking
- ✅ Statistics aggregation
- ✅ Timestamp validation

## Data Privacy

### User Consent
- Feature usage data is collected only for logged-in users
- Users can opt out of tracking in account settings
- Anonymous usage patterns are aggregated for product insights

### Data Retention
- Raw event data: 90 days
- Aggregated statistics: 2 years
- User-specific data deleted on account deletion

### PII Handling
- Template IDs and names are product data (not PII)
- User IDs are hashed before storage
- No personally identifiable information in event payloads

## Performance Considerations

### Client-Side
- Events are queued and batched (max 10 events)
- Fire-and-forget pattern (no blocking)
- LocalStorage for statistics (instant reads)

### Server-Side
- Async tracking (doesn't block render pipeline)
- Events written to queue for processing
- Minimal overhead (<5ms per event)

### Storage
- Average event size: ~200 bytes
- Estimated daily volume: ~50,000 events
- Monthly storage: ~300MB (compressed)

## Future Enhancements

### Short-term
- [ ] Feature usage heatmaps
- [ ] User journey tracking
- [ ] Feature adoption funnels
- [ ] Real-time usage dashboard

### Long-term
- [ ] AI-powered feature recommendations
- [ ] Predictive churn analysis based on usage
- [ ] Automated feature deprecation alerts
- [ ] Cross-platform usage comparison

## Related Features

- **TRACK-001:** Base tracking SDK
- **TRACK-003:** Activation events
- **TRACK-004:** Core value events
- **TRACK-006:** Retention events

## Files

- `src/services/featureUsageTracking.ts` - Core tracking service
- `src/app/ads/editor/page.tsx` - Template & brand kit tracking
- `src/services/campaignGenerator.ts` - Campaign tracking
- `src/services/renderStill.ts` - Ad generation tracking
- `src/services/csvImport.ts` - Batch import tracking
- `scripts/test-feature-usage-tracking.ts` - Test suite
- `docs/TRACK-007-FEATURE-USAGE-TRACKING.md` - This document

## Support

For questions or issues with feature usage tracking:
- Check the test suite for usage examples
- Review integration points in key services
- Verify tracking events in browser console
- Check analytics dashboard for data validation
