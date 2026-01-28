# TRACK-004: Core Value Event Tracking

## Overview

Implements tracking for core value events that demonstrate users receiving ongoing value from the platform. These events track repeated usage patterns beyond initial activation, measuring engagement with key features.

## Features

### Tracked Events

1. **video_rendered**
   - Triggered when ANY render completes successfully (not just first)
   - Fires for all successful renders after first_render_completed
   - Indicates repeated use of the core rendering feature
   - Tracks both individual and batch renders

2. **batch_completed**
   - Triggered when a batch render job completes
   - Fires only for multi-item batch renders
   - Indicates advanced usage and scale
   - Captures batch size and success metrics

3. **export_downloaded**
   - Triggered when a user downloads an export (ZIP, individual file)
   - Fires for both single and multi-file exports
   - Indicates completion of the creative workflow
   - Tracks export format and size

## Implementation

### Render Service - video_rendered

The `renderStill` service (`src/services/renderStill.ts`) tracks all successful renders:

```typescript
import { serverTracking } from './trackingServer';

export async function renderStill(
  compositionId: string,
  options?: RenderStillOptions
): Promise<RenderStillResult> {
  // ... render logic ...

  const result = {
    success: true,
    outputPath: finalOutputPath,
    // ... other properties ...
  };

  // Track ALL renders (not just first)
  serverTracking.track('video_rendered', {
    compositionId,
    format,
    width: result.width,
    height: result.height,
    sizeInBytes: result.sizeInBytes,
    duration: result.duration,
    timestamp: new Date().toISOString(),
  });

  return result;
}
```

### Render Queue - batch_completed

The render queue (`src/services/renderQueue.ts`) tracks batch job completions:

```typescript
import { serverTracking } from './trackingServer';

startWorker(concurrency: number = 1) {
  this.worker = new Worker('render-queue', async (job) => {
    return this.processJob(job);
  });

  this.worker.on('completed', (job) => {
    if (job.returnvalue && job.returnvalue.success) {
      const { totalRendered, successCount, failCount } = job.returnvalue;

      // Only track batch_completed for multi-item batches
      if (totalRendered > 1) {
        serverTracking.track('batch_completed', {
          jobId: job.id,
          jobType: job.data.type,
          totalItems: totalRendered,
          successCount,
          failCount,
          duration: job.returnvalue.duration,
          timestamp: new Date().toISOString(),
        });
      }
    }
  });
}
```

### Export Service - export_downloaded

The export service (`src/services/exportZip.ts`) tracks ZIP exports:

```typescript
import { serverTracking } from './trackingServer';

export async function exportToZip(
  options: ExportOptions
): Promise<ExportResult> {
  // ... export logic ...

  const result = {
    success: true,
    zipPath: outputPath,
    fileCount: filesExported,
    sizeInBytes: zipSize,
  };

  // Track export
  serverTracking.track('export_downloaded', {
    exportType: 'zip',
    fileCount: result.fileCount,
    sizeInBytes: result.sizeInBytes,
    organizationStrategy: options.organization,
    timestamp: new Date().toISOString(),
  });

  return result;
}
```

### Render API - export_downloaded

The render API (`src/app/api/render/route.ts`) tracks single file downloads:

```typescript
import { serverTracking } from '@/services/trackingServer';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');

  // ... fetch file logic ...

  const file = await readFile(filePath);

  // Track download
  serverTracking.track('export_downloaded', {
    exportType: 'single_file',
    fileCount: 1,
    sizeInBytes: file.byteLength,
    format: getFormat(filePath),
    timestamp: new Date().toISOString(),
  });

  return new Response(file, {
    headers: {
      'Content-Type': getMimeType(filePath),
      'Content-Disposition': `attachment; filename="${basename(filePath)}"`,
    },
  });
}
```

### Campaign Generator - batch_completed

The campaign generator (`src/services/campaignGenerator.ts`) tracks campaign completions:

```typescript
import { serverTracking } from './trackingServer';

export async function generateCampaign(
  options: CampaignOptions
): Promise<CampaignResult> {
  // ... generate campaign ...

  const result = {
    success: true,
    totalRendered: variants.length * sizes.length,
    outputs: renderedFiles,
  };

  serverTracking.track('batch_completed', {
    campaignId: options.campaignId,
    jobType: 'campaign',
    totalItems: result.totalRendered,
    successCount: result.outputs.length,
    failCount: result.totalRendered - result.outputs.length,
    variantCount: variants.length,
    sizeCount: sizes.length,
    timestamp: new Date().toISOString(),
  });

  return result;
}
```

## Event Properties

### video_rendered

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `compositionId` | string | Composition identifier | `"example-hero-ad"` |
| `templateId` | string | (Optional) Template ID | `"custom-ad-123"` |
| `format` | string | Output format | `"png"`, `"jpeg"`, `"webp"` |
| `width` | number | Output width in pixels | `1080` |
| `height` | number | Output height in pixels | `1080` |
| `sizeInBytes` | number | (Optional) File size | `245678` |
| `duration` | number | (Optional) Render time in ms | `3500` |
| `timestamp` | string | ISO timestamp | `"2024-01-28T12:00:00Z"` |
| `userId` | string | (Optional) User identifier | `"user-789"` |

### batch_completed

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `jobId` | string | Job queue identifier | `"job-12345"` |
| `jobType` | string | Type of batch job | `"campaign"`, `"csv_import"` |
| `campaignId` | string | (Optional) Campaign ID | `"summer-sale-2024"` |
| `totalItems` | number | Total items in batch | `50` |
| `successCount` | number | Successfully rendered | `48` |
| `failCount` | number | Failed renders | `2` |
| `variantCount` | number | (Optional) Number of variants | `5` |
| `sizeCount` | number | (Optional) Number of sizes | `10` |
| `duration` | number | (Optional) Total time in ms | `125000` |
| `timestamp` | string | ISO timestamp | `"2024-01-28T12:00:00Z"` |

### export_downloaded

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `exportType` | string | Type of export | `"zip"`, `"single_file"` |
| `fileCount` | number | Number of files | `50` |
| `sizeInBytes` | number | Total size in bytes | `12456789` |
| `format` | string | (Optional) File format | `"png"`, `"jpeg"` |
| `organizationStrategy` | string | (Optional) Folder organization | `"locale-first"`, `"device-first"` |
| `includesManifest` | boolean | (Optional) Includes manifest | `true` |
| `timestamp` | string | ISO timestamp | `"2024-01-28T12:00:00Z"` |

## Testing

### Automated Tests

Run the test script to verify tracking:

```bash
npx tsx scripts/test-core-value-tracking.ts
```

The test script validates:
- video_rendered events for all renders
- batch_completed events for multi-item jobs
- export_downloaded events for ZIP exports
- export_downloaded events for single file downloads
- Correct property values
- Tracking service status

### Manual Testing

1. **Test video_rendered**
   ```bash
   # Render a single ad
   npx tsx scripts/test-render-still.ts

   # Check server console
   # Should see: video_rendered event

   # Render multiple times
   npx tsx scripts/test-render-still.ts
   npx tsx scripts/test-render-still.ts

   # Should see multiple video_rendered events
   ```

2. **Test batch_completed**
   ```bash
   # Generate a campaign with multiple variants
   npx tsx scripts/test-campaign-generator.ts

   # Check server console
   # Should see: batch_completed event with totalItems > 1

   # Import CSV with 10+ products
   npx tsx scripts/test-csv-import.ts --file products.csv

   # Should see: batch_completed event
   ```

3. **Test export_downloaded**
   ```bash
   # Export to ZIP
   curl http://localhost:3000/api/export/zip?campaignId=test

   # Check server console
   # Should see: export_downloaded event with exportType="zip"

   # Download single file
   curl http://localhost:3000/api/render/download?fileId=test-123

   # Should see: export_downloaded event with exportType="single_file"
   ```

4. **Verify in PostHog**
   - Open PostHog dashboard
   - Go to Events → Live Events
   - Filter by: video_rendered, batch_completed, export_downloaded
   - Verify properties are correct

## Analytics Insights

### Key Metrics to Track

1. **Engagement Metrics**
   - Videos rendered per user
   - Batch jobs per user
   - Exports per user
   - Frequency of usage (daily, weekly, monthly)

2. **Usage Patterns**
   - Single vs batch rendering preference
   - Export format preferences
   - Average batch size
   - Render success rate

3. **Power Users**
   - Users with >10 renders per week
   - Users with >5 batch jobs per month
   - Users with >20 exports per month

### Example PostHog Queries

```sql
-- Average renders per active user
SELECT
  COUNT(*) / COUNT(DISTINCT distinct_id) as avg_renders_per_user
FROM events
WHERE event = 'video_rendered'
  AND timestamp > NOW() - INTERVAL '30 days';

-- Batch rendering adoption
SELECT
  COUNT(DISTINCT CASE WHEN event = 'batch_completed' THEN distinct_id END) as batch_users,
  COUNT(DISTINCT CASE WHEN event = 'video_rendered' THEN distinct_id END) as all_users,
  (batch_users * 100.0 / all_users) as batch_adoption_rate
FROM events
WHERE timestamp > NOW() - INTERVAL '30 days';

-- Export completion rate
SELECT
  COUNT(DISTINCT CASE WHEN event = 'video_rendered' THEN distinct_id END) as rendered_users,
  COUNT(DISTINCT CASE WHEN event = 'export_downloaded' THEN distinct_id END) as export_users,
  (export_users * 100.0 / rendered_users) as export_completion_rate
FROM events
WHERE timestamp > NOW() - INTERVAL '30 days';

-- Power user identification (10+ renders per week)
SELECT
  distinct_id,
  COUNT(*) as render_count,
  COUNT(*) / 4 as renders_per_week
FROM events
WHERE event = 'video_rendered'
  AND timestamp > NOW() - INTERVAL '28 days'
GROUP BY distinct_id
HAVING COUNT(*) >= 10
ORDER BY render_count DESC;
```

## Architecture

```
User Engagement Journey:
┌──────────────────┐
│  first_render    │ (TRACK-003)
│   completed      │
└─────────┬────────┘
          │
          ▼
┌──────────────────┐
│  video_rendered  │◄──┐ (TRACK-004)
│  (repeated use)  │   │ Ongoing
└─────────┬────────┘   │ Engagement
          │            │
          ▼            │
┌──────────────────┐   │
│  batch_completed │───┤ (TRACK-004)
│   (scale usage)  │   │
└─────────┬────────┘   │
          │            │
          ▼            │
┌──────────────────┐   │
│export_downloaded │───┘ (TRACK-004)
│ (value realized) │
└──────────────────┘
```

## Integration Points

### Dependencies

This feature builds upon:
- **TRACK-001**: Tracking SDK Integration (provides base infrastructure)
- **TRACK-003**: Activation Event Tracking (provides first_render_completed)

### Files Modified

```
src/
├── services/
│   ├── renderStill.ts           # Added video_rendered tracking
│   ├── renderQueue.ts           # Added batch_completed tracking
│   ├── exportZip.ts             # Added export_downloaded tracking
│   └── campaignGenerator.ts    # Added batch_completed tracking
├── app/
│   └── api/
│       ├── render/
│       │   └── download/
│       │       └── route.ts     # New: Download API with tracking
│       └── export/
│           └── zip/
│               └── route.ts     # New: ZIP export API with tracking
docs/
└── TRACK-004-CORE-VALUE-EVENT-TRACKING.md  # This file
scripts/
└── test-core-value-tracking.ts              # Test script
```

## Best Practices

1. **Track All Renders**: Fire video_rendered for every successful render (not just first)
2. **Batch Threshold**: Only fire batch_completed for jobs with >1 item
3. **Export Immediately**: Track export_downloaded at the moment of download
4. **Include Metrics**: Capture size, count, duration for analysis
5. **Server-Side Only**: Use server tracking for all these events (accurate, secure)

## Common Issues

### Event Not Firing

1. Verify server tracking is initialized
2. Check POSTHOG_API_KEY environment variable
3. Verify tracking.isEnabled() returns true
4. Check server console for errors

### Missing batch_completed

1. Ensure totalRendered > 1 (single items shouldn't trigger this)
2. Verify worker completion handler is registered
3. Check job.returnvalue structure

### Missing export_downloaded

1. Verify download/export routes are instrumented
2. Check that response is sent AFTER tracking call
3. Ensure file operations complete before tracking

## Next Steps

This feature enables the following tracking features:
- **TRACK-005**: Monetization Event Tracking (checkout_started, purchase_completed)
- **TRACK-006**: Retention Event Tracking (return_visit, feature_discovery)
- **Engagement analysis** - Identify power users and usage patterns
- **Feature optimization** - Improve most-used workflows

## Resources

- [PostHog Engagement Metrics](https://posthog.com/docs/product-analytics/engagement)
- [Cohort Analysis](https://posthog.com/docs/product-analytics/cohorts)
- [User Retention](https://posthog.com/docs/product-analytics/retention)
- [Power User Analysis](https://posthog.com/blog/power-users)
