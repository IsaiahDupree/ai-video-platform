# META-008: Conversion Optimization

**Feature ID:** META-008
**Category:** Meta Pixel
**Priority:** P2
**Status:** ✅ Complete
**Date:** 2026-01-30

## Overview

Conversion Optimization tracks conversion events (purchases, signups, video renders) and optimizes them for Meta's ad platform. This enables:

- **Conversion Tracking** - Track all conversion types for ROI measurement
- **Funnel Analysis** - Understand user journey from entry to conversion
- **Meta Optimization** - Prepare conversions for Meta's optimization algorithms
- **Attribution** - Track which campaigns drive conversions
- **Analytics** - Measure conversion rates, values, and metrics

## Core Features

### Conversion Events
- Track multiple conversion types: purchase, signup, video_render, subscription
- Record conversion value in cents
- Attribution metadata (campaign, ad_set, ad, UTM parameters)
- Device and location tracking

### Conversion Funnels
- Define multi-step conversion paths
- Track funnel completion rates
- Measure time to conversion
- Identify drop-off points

### Optimization
- Automatic conversion optimization for Meta
- Placeholder for Meta Graph API integration
- Batch optimization operations
- Compliance-ready tracking

## Database Schema

### conversion_event Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| person_id | UUID | Person reference |
| event_id | UUID | Event reference |
| conversion_type | TEXT | purchase, signup, video_render, subscription |
| conversion_source | TEXT | pixel, capi, webhook |
| value_cents | INT | Conversion value |
| currency | TEXT | Currency code |
| campaign_id | TEXT | Ad campaign ID |
| ad_set_id | TEXT | Ad set ID |
| ad_id | TEXT | Ad ID |
| utm_source | TEXT | UTM source parameter |
| utm_campaign | TEXT | UTM campaign parameter |
| utm_medium | TEXT | UTM medium parameter |
| utm_content | TEXT | UTM content parameter |
| device_type | TEXT | Device type (desktop, mobile, tablet) |
| browser | TEXT | Browser name |
| os | TEXT | Operating system |
| country | TEXT | Country code |
| city | TEXT | City name |
| properties | JSONB | Flexible properties |
| meta_pixel_id | TEXT | Meta Pixel ID |
| meta_conversion_id | TEXT | Meta conversion ID |
| is_optimized | BOOLEAN | Optimization status |
| conversion_time | TIMESTAMPTZ | When conversion occurred |
| created_at | TIMESTAMPTZ | Record created |

### conversion_funnel Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| person_id | UUID | Person reference |
| funnel_name | TEXT | Funnel identifier |
| total_steps | INT | Total funnel steps |
| completed_steps | INT | Completed steps count |
| completion_percentage | NUMERIC | Completion percentage |
| is_converted | BOOLEAN | Conversion status |
| converted_at | TIMESTAMPTZ | Conversion timestamp |
| total_time_seconds | INT | Time to convert |
| started_at | TIMESTAMPTZ | Funnel start time |
| created_at | TIMESTAMPTZ | Record created |
| updated_at | TIMESTAMPTZ | Record updated |

### conversion_metrics Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| person_id | UUID | Person reference |
| campaign_id | TEXT | Campaign reference |
| total_conversions | INT | Conversion count |
| total_value_cents | INT | Total value |
| average_value_cents | INT | Average value |
| conversion_rate | NUMERIC | Percentage |
| repeat_customer_rate | NUMERIC | Percentage |
| total_funnel_starts | INT | Funnel starts |
| total_funnel_completions | INT | Funnel completions |
| funnel_completion_rate | NUMERIC | Percentage |
| average_funnel_time_seconds | INT | Seconds |
| last_click_to_conversion_hours | INT | Hours |
| attribution_model | TEXT | Attribution model |
| is_optimized | BOOLEAN | Optimization status |
| optimization_status | TEXT | Status |
| period_date | DATE | Period date |
| period_type | TEXT | daily, weekly, monthly |
| created_at | TIMESTAMPTZ | Record created |
| updated_at | TIMESTAMPTZ | Record updated |

## TypeScript Service API

```typescript
import {
  trackConversionEvent,
  getConversionEvent,
  listConversions,
  createConversionFunnel,
  getFunnelsByPerson,
  createFunnelStep,
  getFunnelSteps,
  completeFunnelStep,
  updateFunnelProgress,
  createOptimizationRule,
  listOptimizationRules,
  getConversionMetrics,
  getConversionSummary,
  getFunnelStats,
  optimizeConversionForMeta,
  optimizeBatchConversions,
} from '@/services/conversionOptimization';

// Track a purchase conversion
const conversion = await trackConversionEvent({
  person_id: personId,
  conversion_type: 'purchase',
  conversion_source: 'capi',
  value_cents: 2999,
  currency: 'USD',
  campaign_id: 'campaign_123',
  utm_campaign: 'summer_sale',
});

// Create conversion funnel
const funnel = await createConversionFunnel({
  person_id: personId,
  funnel_name: 'signup_to_purchase',
  total_steps: 4,
});

// Add funnel steps
await createFunnelStep({
  funnel_id: funnel.id,
  step_number: 1,
  step_name: 'landing_page_view',
});

// Get conversion summary
const summary = await getConversionSummary(personId);
console.log(`Total conversions: ${summary.total_conversions}`);
console.log(`Revenue: ${summary.total_revenue_cents / 100}`);

// Optimize conversion for Meta
const result = await optimizeConversionForMeta(conversion.id);
```

## REST API

```bash
# Track conversion
POST /api/conversions
{
  "person_id": "uuid...",
  "conversion_type": "purchase",
  "conversion_source": "capi",
  "value_cents": 2999,
  "campaign_id": "campaign_123"
}

# List conversions
GET /api/conversions?person_id=uuid&conversion_type=purchase

# Get conversion summary
GET /api/conversions?summary=true&person_id=uuid
```

## Integration Points

### GDP-001: Growth Data Plane
Conversions reference the person and event tables for unified tracking.

### GDP-012: Segment Engine
Conversions feed into segments for audience targeting (META-007).

### META-001 to META-006: Meta Pixel
Conversions are tracked via Meta Pixel and optimized for Meta's platform.

## Files

```
supabase/migrations/
└── 20260130000004_create_conversion_optimization_tables.sql

src/types/
└── conversionOptimization.ts

src/services/
└── conversionOptimization.ts

src/app/api/conversions/
└── route.ts

scripts/
└── test-conversion-optimization.ts

docs/
└── META-008-CONVERSION-OPTIMIZATION.md
```

## Summary

META-008 provides complete conversion optimization:

✅ **Conversion Tracking** - Multiple conversion types with full attribution
✅ **Funnel Analysis** - Multi-step conversion paths with completion rates
✅ **Metrics & Analytics** - Comprehensive conversion metrics
✅ **Meta Optimization** - Integration ready for Meta Graph API
✅ **REST API** - Full conversion tracking endpoints
✅ **Type Safety** - Complete TypeScript types
✅ **Database Schema** - Efficient PostgreSQL implementation
✅ **SQL Functions** - Automatic metric computation
✅ **Test Coverage** - Comprehensive test suite

This completes the Meta Pixel integration and Growth Data Plane implementation.
