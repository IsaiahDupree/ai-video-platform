# TRACK-006: Retention Event Tracking

## Overview

Implements tracking for user retention and feature discovery events. These events help understand user engagement over time and which features users are discovering and using.

## Features

### Tracked Events

1. **return_visit**
   - Triggered when a user returns to the platform after a period of time (>30 minutes)
   - Automatically tracked on app load via TrackingProvider
   - Uses localStorage to persist visit history
   - Tracks visit count, days since first visit, and hours since last visit

2. **feature_discovery**
   - Triggered when a user uses a feature for the first time
   - Tracks once per feature (no duplicates)
   - Helps identify feature adoption patterns
   - Integrated into key feature pages

## Implementation

### Retention Tracking Service

The `retentionTracking` service (`src/services/retentionTracking.ts`) provides utilities for tracking user retention:

```typescript
import {
  trackReturnVisit,
  trackFeatureDiscovery,
  hasDiscoveredFeature,
  getRetentionStats,
  resetRetentionTracking,
} from '../services/retentionTracking';

// Track return visit (automatically called by TrackingProvider)
trackReturnVisit();

// Track feature discovery
trackFeatureDiscovery('ad_editor');

// Check if feature has been discovered
if (!hasDiscoveredFeature('ad_editor')) {
  // Show feature tutorial
}

// Get retention statistics
const stats = getRetentionStats();
console.log(`Visit #${stats.visitCount}, ${stats.discoveredFeatures.length} features discovered`);
```

### Automatic Return Visit Tracking

Return visits are automatically tracked via the `TrackingProvider` component in `src/components/TrackingProvider.tsx`:

```tsx
import { trackReturnVisit } from '../services/retentionTracking';

export function TrackingProvider({ children, apiKey, host, enabled = true }: TrackingProviderProps) {
  useEffect(() => {
    // Initialize tracking
    if (key) {
      tracking.initialize({ apiKey: key, host: hostUrl, enabled });
    }

    // Track return visit after initialization
    const timer = setTimeout(() => {
      trackReturnVisit();
    }, 500);

    return () => clearTimeout(timer);
  }, [apiKey, host, enabled]);

  // ...
}
```

**How it works:**
- On first visit, initializes tracking data (visitCount: 1)
- On subsequent visits within 30 minutes, updates lastVisit but doesn't track event
- On subsequent visits after 30+ minutes, tracks `return_visit` event and increments visitCount

### Feature Discovery Tracking

Feature discovery is integrated into key pages using `useEffect`:

#### Ad Editor (`src/app/ads/editor/page.tsx`)

```tsx
import { trackFeatureDiscovery } from '../../../services/retentionTracking';

export default function AdEditorPage() {
  // Track feature discovery on mount
  useEffect(() => {
    trackFeatureDiscovery('ad_editor');
  }, []);

  // ... rest of component
}
```

#### Campaign Generator (`src/app/ads/campaign/page.tsx`)

```tsx
import { trackFeatureDiscovery } from '../../../services/retentionTracking';

export default function CampaignPackGeneratorPage() {
  useEffect(() => {
    trackFeatureDiscovery('campaign_generator');
  }, []);

  // ... rest of component
}
```

#### CSV/Batch Import (`src/app/ads/batch/page.tsx`)

```tsx
import { trackFeatureDiscovery } from '../../../services/retentionTracking';

export default function BatchImportPage() {
  useEffect(() => {
    trackFeatureDiscovery('csv_import');
  }, []);

  // ... rest of component
}
```

### Discoverable Features

The following features can be tracked:

- `ad_editor` - Static Ad Editor
- `template_library` - Template selection/browsing
- `brand_kit` - Brand Kit management
- `batch_render` - Batch rendering
- `campaign_generator` - Campaign Pack Generator
- `csv_import` - CSV/Feed batch import
- `screenshot_editor` - Screenshot Editor
- `device_frames` - Device frame templates
- `caption_overlay` - Caption overlay system
- `screenshot_resize` - Screenshot resizing
- `locale_export` - Locale-organized export
- `asset_library` - Asset library management
- `custom_product_page` - Custom Product Page creator
- `ppo_test` - Product Page Optimization
- `app_preview_generator` - App preview video generator
- `analytics_dashboard` - Analytics dashboard
- `voice_clone` - Voice cloning
- `text_to_video` - Text-to-video generation
- `image_generation` - Image generation
- `approval_workflow` - Approval workflow
- `ai_variants` - AI variant generator
- `localization` - Multi-language localization
- `creative_qa` - Creative QA checks

## Event Properties

### return_visit

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `visitCount` | number | Total number of visits | `5` |
| `daysSinceFirstVisit` | number | Days since user's first visit | `7` |
| `hoursSinceLastVisit` | number | Hours since last visit | `24` |
| `firstVisit` | string | ISO timestamp of first visit | `"2024-01-20T12:00:00Z"` |
| `lastVisit` | string | ISO timestamp of previous visit | `"2024-01-27T12:00:00Z"` |
| `timestamp` | string | ISO timestamp of current visit | `"2024-01-28T12:00:00Z"` |

### feature_discovery

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `feature` | string | Feature identifier | `"ad_editor"` |
| `totalDiscoveredCount` | number | Total features discovered by user | `3` |
| `visitCount` | number | Current visit count | `2` |
| `daysSinceFirstVisit` | number | Days since first visit | `1` |
| `timestamp` | string | ISO timestamp | `"2024-01-28T12:00:00Z"` |

## Data Storage

### localStorage Keys

- `retention_tracking_last_visit` - ISO timestamp of last visit
- `retention_tracking_visit_count` - Total number of visits
- `retention_tracking_first_visit` - ISO timestamp of first visit
- `retention_tracking_discovered_features` - JSON array of discovered features

### Data Persistence

All retention data is stored in the browser's localStorage:
- Persists across browser sessions
- Survives page refreshes
- Can be reset using `resetRetentionTracking()`

## Return Visit Threshold

The service uses a 30-minute threshold to determine if a visit counts as a "return visit":

- **Within 30 minutes**: Same session, updates lastVisit but doesn't track event
- **After 30 minutes**: New visit, tracks `return_visit` event and increments visitCount

This prevents tracking excessive events during a single usage session.

## Testing

### Automated Tests

Run the test script to verify tracking:

```bash
npx tsx scripts/test-retention-tracking.ts
```

The test script validates:
- First visit initialization
- Visit count increment logic
- Feature discovery tracking
- No duplicate feature tracking
- Multiple feature tracking
- Retention statistics calculation
- Data persistence and reset

### Manual Testing

#### Test Return Visit Tracking

1. Open the app in a browser
2. Open DevTools > Application > Local Storage
3. Check for `retention_tracking_*` keys
4. Verify `visitCount` is 1 on first visit
5. Manually modify `retention_tracking_last_visit` to an hour ago
6. Refresh the page
7. Verify `visitCount` increments to 2
8. Check PostHog events for `return_visit` event

#### Test Feature Discovery

1. Navigate to `/ads/editor`
2. Open DevTools > Console
3. Check for "Event tracked: feature_discovery" message
4. Verify `retention_tracking_discovered_features` includes `"ad_editor"`
5. Navigate away and back to `/ads/editor`
6. Verify no duplicate event is tracked

## Usage Examples

### Check if User Has Discovered a Feature

```typescript
import { hasDiscoveredFeature } from '../services/retentionTracking';

if (!hasDiscoveredFeature('ad_editor')) {
  // Show onboarding tutorial
  showOnboardingModal();
}
```

### Get Retention Metrics

```typescript
import { getRetentionStats } from '../services/retentionTracking';

const stats = getRetentionStats();

console.log(`
  Visit: ${stats.visitCount}
  Days since first visit: ${stats.daysSinceFirstVisit}
  Hours since last visit: ${stats.hoursSinceLastVisit || 'N/A'}
  Features discovered: ${stats.discoveredFeatures.length}
`);
```

### Conditional Feature Tracking

Track feature discovery only after user completes a specific action:

```typescript
import { trackFeatureDiscovery } from '../services/retentionTracking';

const handleFirstRenderComplete = () => {
  // Track that user discovered the render feature
  trackFeatureDiscovery('batch_render');

  // Continue with success handling
  showSuccessMessage();
};
```

## Benefits

### Product Insights

1. **Retention Metrics**: Understand how often users return and over what time periods
2. **Feature Adoption**: Identify which features are discovered and used
3. **User Journey**: Map out feature discovery patterns
4. **Engagement**: Track active days and session frequency

### User Experience

1. **Personalization**: Show tutorials only for undiscovered features
2. **Progressive Disclosure**: Introduce features gradually based on discovery state
3. **Onboarding**: Track onboarding completion through feature discovery
4. **Re-engagement**: Target users who haven't returned in X days

## Future Enhancements

Potential improvements for retention tracking:

1. **Session Duration**: Track how long users spend in the app
2. **Feature Usage Frequency**: Track not just discovery, but repeated use
3. **Cohort Analysis**: Group users by signup date for retention analysis
4. **Churn Prediction**: Identify users at risk of churning based on visit patterns
5. **Feature Sequencing**: Understand which features lead to other feature discoveries
6. **Server-Side Tracking**: Store retention data server-side for cross-device tracking

## Dependencies

- PostHog (tracking SDK)
- Browser localStorage (data persistence)
- TrackingProvider (initialization)
- tracking service (event emission)

## Implementation Checklist

- [x] Create `retentionTracking.ts` service
- [x] Add return visit tracking to TrackingProvider
- [x] Add feature discovery to ad editor
- [x] Add feature discovery to campaign generator
- [x] Add feature discovery to batch import
- [x] Create test script
- [x] Write documentation
- [x] Define discoverable features type
- [x] Implement localStorage persistence
- [x] Add utility functions (hasDiscoveredFeature, getRetentionStats)
- [x] Set 30-minute return visit threshold
