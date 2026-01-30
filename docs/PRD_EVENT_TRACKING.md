# Event Tracking System PRD

**Version:** 1.0
**Last Updated:** January 30, 2026
**Status:** In Development

---

## Overview

The Event Tracking System is a comprehensive analytics foundation for Remotion VideoStudio that captures user actions across the entire funnel: acquisition, activation, core value delivery, retention, and monetization.

The system:
- Enables behavioral analytics and funnel analysis
- Feeds data into Growth Data Plane (for segmentation and automation)
- Integrates with Meta Pixel and Conversions API
- Supports batching and offline queuing
- Validates events against schema before transmission

---

## Goals

1. **Complete Funnel Visibility** - Track user journey from landing to purchase
2. **Analytics Foundation** - Enable conversion funnel, cohort, and LTV analysis
3. **Platform Integration** - Feed events to Meta Pixel, Segment, custom analytics
4. **Developer Experience** - Simple API for instrumenting code
5. **Reliability** - Batch and retry failed transmissions

---

## Event Categories

### Acquisition (Top of Funnel)

Events that indicate awareness and initial interest:

| Event | Trigger | Properties |
|-------|---------|-----------|
| `landing_view` | User lands on site | utm_source, utm_campaign, referrer |
| `signup_started` | Signup form opened | form_type |
| `signup_completed` | Email verified | email, signup_duration_ms |
| `login_completed` | User logs in | |

### Activation (Aha Moment)

Events that indicate the user has experienced core value:

| Event | Trigger | Properties |
|-------|---------|-----------|
| `first_video_created` | User creates first brief | brief_id, template |
| `first_render_completed` | First successful render | duration_ms, format |
| `first_export_downloaded` | User downloads video | format, size_bytes |
| `feature_discovered` | User uses new feature | feature_name |

### Core Value (Retention)

Events that indicate ongoing usage:

| Event | Trigger | Properties |
|-------|---------|-----------|
| `video_created` | New brief created | brief_id, template, duration_sec |
| `video_rendered` | Render completes | render_id, duration_ms, format |
| `video_exported` | Video exported/downloaded | export_id, format, destination |
| `batch_render_started` | Batch render starts | job_id, video_count |
| `batch_render_completed` | Batch render finishes | job_id, video_count, duration_ms |
| `asset_generated` | AI asset generated (DALL-E) | asset_type, prompt |
| `voice_cloned` | Voice cloning completed | voice_id, reference_duration_sec |

### Monetization (Revenue)

Events that indicate buying intent and purchases:

| Event | Trigger | Properties |
|-------|---------|-----------|
| `upgrade_viewed` | Pricing page viewed | plan_shown |
| `checkout_started` | Checkout initiated | plan_id, amount, currency |
| `checkout_abandoned` | User leaves checkout | step_on_exit, amount |
| `purchase_completed` | Payment processed | order_id, amount, currency, plan |
| `subscription_renewal` | Subscription renews | subscription_id, amount |

### Retention/Churn

Events that indicate health and churn risk:

| Event | Trigger | Properties |
|-------|---------|-----------|
| `subscription_cancelled` | User cancels subscription | reason |
| `inactive_30_days` | No activity for 30 days | last_action_date |
| `feature_used_after_churn_risk` | User re-engages | days_since_inactive |

---

## Event Schema

All events conform to this base schema (Zod-validated):

```typescript
interface Event {
  // Identification
  eventId: string;                    // UUID, unique per event
  eventType: string;                  // 'landing_view', 'video_rendered', etc.
  category: string;                   // 'acquisition', 'activation', etc.

  // Timing
  timestamp: Date;                    // When event occurred (client time)

  // User
  personId?: string;                  // Unique user ID (from auth)
  anonymousId?: string;               // Fallback for logged-out users
  sessionId?: string;                 // Session identifier

  // Session Context
  deviceId?: string;                  // Device fingerprint
  ipAddress?: string;                 // For geo-location
  userAgent?: string;                 // Browser/device info

  // UTM Parameters
  utmSource?: string;                 // Acquisition channel
  utmMedium?: string;                 // marketing channel
  utmCampaign?: string;               // Campaign name
  utmContent?: string;                // Ad variant/creative
  utmTerm?: string;                   // Paid search term

  // Properties (Event-specific)
  properties: Record<string, any>;    // Custom fields per event type

  // Revenue
  revenue?: number;                   // USD amount (if monetization event)
  currency?: string;                  // Currency code (default: USD)

  // Metadata
  source: string;                     // 'app', 'pixel', 'api'
  sourceId?: string;                  // Original ID in source system
  metadata?: Record<string, any>;     // Additional context
}
```

---

## SDK API

### Basic Usage

```typescript
import { tracker } from '@/analytics/tracking-sdk';

// Track an event
tracker.track('video_rendered', {
  render_id: 'r-123',
  duration_ms: 45000,
  format: 'mp4'
});

// Track with user identification
tracker.identify('user@example.com', {
  name: 'John Doe',
  company: 'Acme Inc'
});

// Set user properties
tracker.setUserProperty('subscription_plan', 'pro');

// Manual flush to server
await tracker.flush();
```

### Initialization

```typescript
// On app startup (App.tsx or _app.tsx)
import { initializeTracker } from '@/analytics/tracking-sdk';

initializeTracker({
  appId: process.env.NEXT_PUBLIC_APP_ID,
  apiUrl: process.env.NEXT_PUBLIC_TRACKING_API_URL,
  batchSize: 10,                    // Events per batch
  flushInterval: 5000,              // ms between flushes
  debug: process.env.NODE_ENV === 'development',
  platformIntegrations: {
    metaPixel: {
      pixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID,
      enabled: true
    }
  }
});
```

### Event-Specific Helpers

```typescript
// Acquisition events
tracker.recordSignup(email, { referrer, source });
tracker.recordLogin(email);

// Activation events
tracker.recordFirstVideo(briefId, template);
tracker.recordFirstRender(duration_ms, format);

// Core value events
tracker.recordVideoRendered(briefId, render_id, properties);
tracker.recordBatchRender(jobId, videoCount, duration_ms);

// Monetization events
tracker.recordCheckoutStarted(planId, amount);
tracker.recordPurchase(orderId, amount, plan);
tracker.recordSubscriptionRenewal(subscriptionId, amount);
```

---

## Implementation Details

### Event Queue

- **In-memory queue** with localStorage fallback
- **Automatic batching** every N events or T milliseconds
- **Retry logic** on network failure (exponential backoff)
- **Dead letter queue** for failed events after 3 retries

### Event Validation

- Zod schemas per event type
- Required fields: eventId, eventType, timestamp, personId|anonymousId
- Type-safe properties per event category

### Session Tracking

- Auto-generated sessionId on page load
- 30-minute inactivity timeout
- Persisted in sessionStorage
- Reset on logout

### Data Privacy

- No PII in properties (encrypted separately if needed)
- Respect Do Not Track header
- Consent-aware event transmission
- GDPR-compliant data retention

---

## Integration Points

### 1. Growth Data Plane

Events flow → UnifiedEvent → person/subscription tables → segmentation

### 2. Meta Pixel

Automatic mapping:
- `signup_completed` → Meta Lead event
- `purchase_completed` → Meta Purchase event
- `video_rendered` → Custom event

### 3. Batch Jobs

Track render jobs:
- `batch_render_started` (job_id)
- `batch_render_completed` (job_id)
- `batch_render_failed` (job_id, error)

---

## Analytics Queries

### Funnel: Landing → Signup → First Video

```typescript
const acquisitionFunnel = await analytics.getFunnel([
  'landing_view',
  'signup_completed',
  'first_video_created'
], {
  timeWindow: '30d'
});

// Result: { steps: [1000, 350, 85], conversionRate: 0.085 }
```

### Cohort: First Video by Week

```typescript
const cohorts = await analytics.getCohortAnalysis({
  groupBy: 'first_video_created',
  interval: 'week',
  metrics: ['retention_d7', 'retention_d30', 'ltv']
});
```

### Segment: Power Users

```typescript
const powerUsers = await analytics.getSegment({
  conditions: [
    { event: 'video_rendered', count: { gte: 10 }, window: '30d' },
    { event: 'batch_render_completed', count: { gte: 1 }, window: '30d' }
  ]
});
```

---

## Deployment

### Environment Variables

```
NEXT_PUBLIC_TRACKING_API_URL=https://tracking.example.com
NEXT_PUBLIC_APP_ID=app_123
NEXT_PUBLIC_META_PIXEL_ID=123456789
TRACKING_API_SECRET=sk_live_xxx
```

### Backend Endpoint

```
POST /api/v1/events
Authorization: Bearer <API_SECRET>

{
  "events": [
    { eventId, eventType, timestamp, properties, ... },
    ...
  ]
}
```

Response:
```json
{
  "success": true,
  "processedCount": 10,
  "failedCount": 0,
  "batchId": "batch_123"
}
```

---

## Testing

```typescript
// Mock tracker for unit tests
import { createMockTracker } from '@/analytics/tracking-sdk';

const tracker = createMockTracker();
tracker.track('video_rendered', { ... });
expect(tracker.getTrackedEvents()).toHaveLength(1);
```

---

## Metrics & Monitoring

- **Events/min** - Throughput
- **Batch success rate** - Transmission reliability
- **Event validation rate** - Data quality
- **Latency p95** - Time from event to API

---

## Rollout Plan

1. **Phase 1** - Core SDK + acquisition tracking (week 1)
2. **Phase 2** - Activation + core value events (week 2)
3. **Phase 3** - Meta Pixel + monetization (week 3)
4. **Phase 4** - Retention/churn events + analytics queries (week 4)
