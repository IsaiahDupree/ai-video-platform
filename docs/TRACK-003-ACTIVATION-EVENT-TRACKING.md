# TRACK-003: Activation Event Tracking

## Overview

Implements tracking for user activation events including first video creation and first successful render. These events are critical indicators that a user has experienced the core value proposition of the platform.

## Features

### Tracked Events

1. **first_video_created**
   - Triggered when a user creates or loads their first video/ad template
   - Fires once per user session in the editor
   - Indicates user has started content creation

2. **first_render_completed**
   - Triggered when a user's first render completes successfully
   - Fires for any successful render (template, composition, or job queue)
   - Indicates user has successfully generated output

## Implementation

### Ad Editor - first_video_created

The ad editor page (`src/app/ads/editor/page.tsx`) tracks when users create or interact with templates:

```tsx
'use client';

import { useRef } from 'react';
import { useTracking } from '@/components/TrackingProvider';

export default function AdEditorPage() {
  const tracking = useTracking();
  const hasTrackedFirstCreation = useRef(false);

  // Track when user creates new template
  const createNewTemplate = () => {
    const newTemplate = createTemplate();
    setTemplate(newTemplate);

    if (!hasTrackedFirstCreation.current) {
      tracking.track('first_video_created', {
        templateId: newTemplate.id,
        templateType: 'custom',
        layout: newTemplate.layout,
        timestamp: new Date().toISOString(),
      });
      hasTrackedFirstCreation.current = true;
    }
  };

  // Track when user loads existing template
  const loadTemplate = async (templateId: string) => {
    const data = await fetchTemplate(templateId);
    setTemplate(data);

    if (!hasTrackedFirstCreation.current) {
      tracking.track('first_video_created', {
        templateId: data.id,
        templateType: 'starter',
        layout: data.layout,
        timestamp: new Date().toISOString(),
      });
      hasTrackedFirstCreation.current = true;
    }
  };
}
```

### Render API - first_render_completed

The render API (`src/app/api/render/route.ts`) tracks successful renders:

```typescript
import { serverTracking } from '@/services/trackingServer';

export async function POST(request: Request) {
  const { template, options, userId } = await request.json();

  const result = await renderAdTemplate(template, options);

  if (result.success) {
    serverTracking.track('first_render_completed', {
      templateId: template.id,
      format: result.format,
      width: result.width,
      height: result.height,
      sizeInBytes: result.sizeInBytes,
      timestamp: new Date().toISOString(),
      userId,
    });
  }

  return Response.json({ success: result.success, result });
}
```

### Render Service - first_render_completed

The `renderStill` service (`src/services/renderStill.ts`) tracks direct render calls:

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

  // Track completion
  serverTracking.track('first_render_completed', {
    compositionId,
    format,
    width: result.width,
    height: result.height,
    sizeInBytes: result.sizeInBytes,
    timestamp: new Date().toISOString(),
  });

  return result;
}
```

### Render Queue - first_render_completed

The render queue (`src/services/renderQueue.ts`) tracks job completions:

```typescript
import { serverTracking } from './trackingServer';

startWorker(concurrency: number = 1) {
  this.worker = new Worker('render-queue', async (job) => {
    return this.processJob(job);
  });

  this.worker.on('completed', (job) => {
    if (job.returnvalue && job.returnvalue.success) {
      serverTracking.track('first_render_completed', {
        jobId: job.id,
        jobType: job.data.type,
        totalRendered: job.returnvalue.totalRendered,
        duration: job.returnvalue.duration,
        timestamp: new Date().toISOString(),
      });
    }
  });
}
```

## Event Properties

### first_video_created

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `templateId` | string | Template identifier | `"custom-ad-1706400000000"` |
| `templateType` | string | Type of template | `"custom"`, `"starter"` |
| `layout` | string | Template layout | `"hero-text"`, `"hero-image"` |
| `timestamp` | string | ISO timestamp | `"2024-01-28T12:00:00Z"` |

### first_render_completed

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `templateId` | string | (Optional) Template ID | `"custom-ad-123"` |
| `compositionId` | string | (Optional) Composition ID | `"example-hero-ad"` |
| `jobId` | string | (Optional) Job queue ID | `"job-12345"` |
| `jobType` | string | (Optional) Job type | `"template"`, `"batch"` |
| `format` | string | Output format | `"png"`, `"jpeg"`, `"webp"` |
| `width` | number | Output width in pixels | `1080` |
| `height` | number | Output height in pixels | `1080` |
| `sizeInBytes` | number | (Optional) File size | `245678` |
| `totalRendered` | number | (Optional) Items rendered | `1`, `10` |
| `duration` | number | (Optional) Render time in ms | `3500` |
| `timestamp` | string | ISO timestamp | `"2024-01-28T12:00:00Z"` |
| `userId` | string | (Optional) User identifier | `"user-789"` |

## Testing

### Automated Tests

Run the test script to verify tracking:

```bash
npx tsx scripts/test-activation-tracking.ts
```

The test script validates:
- first_video_created events with custom templates
- first_video_created events with starter templates
- first_render_completed events for templates
- first_render_completed events for job queue
- first_render_completed events for compositions
- Tracking service status

### Manual Testing

1. **Test first_video_created**
   ```bash
   # Visit the ad editor
   open http://localhost:3000/ads/editor

   # Option 1: Load a starter template
   # - Select a template from dropdown
   # - Check browser console or PostHog
   # - Should see: first_video_created event with templateType="starter"

   # Option 2: Create new template
   # - Click "New Template" button
   # - Check browser console or PostHog
   # - Should see: first_video_created event with templateType="custom"
   ```

2. **Test first_render_completed**
   ```bash
   # Option 1: Use render script
   npx tsx scripts/test-render-still.ts

   # Option 2: Use API endpoint
   curl -X POST http://localhost:3000/api/render \
     -H "Content-Type: application/json" \
     -d '{
       "template": {
         "id": "test-template",
         "name": "Test Ad",
         "layout": "hero-text",
         "dimensions": {"width": 1080, "height": 1080},
         "content": {"headline": "Test"},
         "style": {},
         "metadata": {}
       }
     }'

   # Check server console or PostHog
   # Should see: first_render_completed event
   ```

3. **Verify in PostHog**
   - Open PostHog dashboard
   - Go to Events → Live Events
   - Filter by event names: first_video_created, first_render_completed
   - Verify properties are correct

## Analytics Insights

### Key Metrics to Track

1. **Activation Rate**
   - % of signups who create first video
   - % of signups who complete first render
   - Time from signup to first video
   - Time from signup to first render

2. **Activation Funnel**
   - Signup → First Video Created conversion
   - First Video Created → First Render Completed conversion
   - Overall activation rate (signup to render)

3. **User Segmentation**
   - Users by template type preference (custom vs starter)
   - Users by first render format
   - Users by time to activation

### Example PostHog Queries

```sql
-- Activation rate: signup to first render
SELECT
  COUNT(DISTINCT CASE WHEN event = 'signup_completed' THEN distinct_id END) as signups,
  COUNT(DISTINCT CASE WHEN event = 'first_render_completed' THEN distinct_id END) as activated,
  (activated * 100.0 / signups) as activation_rate
FROM events
WHERE timestamp > NOW() - INTERVAL '30 days';

-- Time to activation
SELECT
  AVG(
    EXTRACT(EPOCH FROM (render_time - signup_time)) / 3600
  ) as avg_hours_to_activation
FROM (
  SELECT
    distinct_id,
    MIN(CASE WHEN event = 'signup_completed' THEN timestamp END) as signup_time,
    MIN(CASE WHEN event = 'first_render_completed' THEN timestamp END) as render_time
  FROM events
  WHERE timestamp > NOW() - INTERVAL '30 days'
  GROUP BY distinct_id
  HAVING signup_time IS NOT NULL AND render_time IS NOT NULL
) t;

-- Template type preference
SELECT
  properties->>'templateType' as template_type,
  COUNT(*) as count
FROM events
WHERE event = 'first_video_created'
  AND timestamp > NOW() - INTERVAL '30 days'
GROUP BY template_type
ORDER BY count DESC;
```

## Architecture

```
User Activation Journey:
┌──────────────────┐
│   Signup Flow    │──► signup_completed (TRACK-002)
└─────────┬────────┘
          │
          ▼
┌──────────────────┐
│   Visit Editor   │──► landing_view (TRACK-002)
└─────────┬────────┘
          │
          ▼
┌──────────────────┐
│  Load Template   │──► first_video_created (TRACK-003)
│   or Create New  │
└─────────┬────────┘
          │
          ▼
┌──────────────────┐
│  Edit Template   │
└─────────┬────────┘
          │
          ▼
┌──────────────────┐
│  Render Output   │──► first_render_completed (TRACK-003)
└──────────────────┘
```

## Integration Points

### Dependencies

This feature builds upon:
- **TRACK-001**: Tracking SDK Integration (provides base infrastructure)
- **TRACK-002**: Acquisition Event Tracking (provides signup events)

### Files Modified

```
src/
├── app/
│   ├── ads/
│   │   └── editor/
│   │       └── page.tsx           # Added first_video_created tracking
│   └── api/
│       └── render/
│           └── route.ts           # New: Render API with tracking
├── services/
│   ├── renderStill.ts            # Added first_render_completed tracking
│   └── renderQueue.ts            # Added first_render_completed tracking
docs/
└── TRACK-003-ACTIVATION-EVENT-TRACKING.md  # This file
scripts/
└── test-activation-tracking.ts             # Test script
```

## Best Practices

1. **Track Once Per Session**: Use `useRef` to prevent duplicate events in the same session
2. **Track Early**: Fire first_video_created as soon as user interacts with editor
3. **Always Track Success**: Only fire first_render_completed for successful renders
4. **Include Context**: Capture relevant properties (template ID, format, dimensions)
5. **Server-Side Tracking**: Use server tracking for render events to ensure accuracy

## Common Issues

### Event Not Firing

1. Check TrackingProvider is in layout
2. Verify NEXT_PUBLIC_POSTHOG_KEY is set for client events
3. Verify POSTHOG_API_KEY is set for server events
4. Check browser/server console for errors
5. Ensure tracking.isEnabled() returns true

### Duplicate Events

1. Use `useRef` with `hasTrackedFirstCreation` flag
2. Check that flag is properly initialized
3. Verify flag is not reset on re-renders

### Missing Properties

1. Always include required properties (templateId or compositionId)
2. Include timestamp for all events
3. Add optional properties when available (sizeInBytes, duration)

## Next Steps

This feature enables the following tracking features:
- **TRACK-004**: Core Value Event Tracking (video_rendered, batch_completed, export_downloaded)
- **TRACK-005**: Monetization Event Tracking (checkout_started, purchase_completed)
- **Activation analysis** - Identify drop-offs in activation funnel
- **Onboarding optimization** - Improve time to first render

## Resources

- [PostHog Funnels](https://posthog.com/docs/product-analytics/funnels)
- [User Activation Metrics](https://posthog.com/blog/aarrr-pirate-funnel)
- [Time to Value](https://posthog.com/docs/product-analytics/time-to-value)
- [Product-Market Fit](https://posthog.com/docs/product-analytics/product-market-fit)
