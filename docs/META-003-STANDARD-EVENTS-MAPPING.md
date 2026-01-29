# META-003: Standard Events Mapping

**Status:** ✅ Complete
**Category:** Meta Pixel
**Priority:** P1
**Effort:** 5pts
**Dependencies:** META-001 (Meta Pixel Installation), META-002 (PageView Tracking)

## Overview

Maps application events to Meta (Facebook) standard events for conversion tracking and ad optimization. This enables Facebook to understand user behavior, optimize ad delivery, and provide accurate attribution.

By mapping internal events to Meta's standard events, we ensure:
- Facebook can optimize for the right conversions
- Custom audiences are built correctly
- Attribution windows work properly
- Lookalike audiences are accurate
- Conversion reports are meaningful

## Implementation

### Files Created

#### 1. Meta Events Service (`src/services/metaEvents.ts`)

Core service that maps internal `TrackingEvent` types to Meta standard events.

**Key Features:**
- Automatic event mapping
- Parameter enrichment
- Value calculation
- Standard vs custom event classification
- Debug logging in development

**Event Mapping Configuration:**

```typescript
const EVENT_MAPPING: Record<TrackingEvent, {
  metaEvent: string;
  isStandard: boolean;
  getValue?: (properties?: EventProperties) => number;
}> = {
  // Acquisition Events
  'landing_view': { metaEvent: 'ViewContent', isStandard: true },
  'signup_started': { metaEvent: 'Lead', isStandard: true },
  'signup_completed': { metaEvent: 'CompleteRegistration', isStandard: true },

  // Activation Events
  'first_video_created': { metaEvent: 'ViewContent', isStandard: true },
  'first_render_completed': { metaEvent: 'CompleteRegistration', isStandard: true },

  // Core Value Events
  'video_rendered': { metaEvent: 'Purchase', isStandard: true },
  'batch_completed': { metaEvent: 'Purchase', isStandard: true },
  'export_downloaded': { metaEvent: 'Purchase', isStandard: true },

  // Monetization Events
  'checkout_started': { metaEvent: 'InitiateCheckout', isStandard: true },
  'purchase_completed': { metaEvent: 'Purchase', isStandard: true },

  // Custom Events (non-standard)
  'return_visit': { metaEvent: 'ReturnVisit', isStandard: false },
  'feature_discovery': { metaEvent: 'FeatureDiscovery', isStandard: false },
  'template_used': { metaEvent: 'TemplateUsed', isStandard: false },
  'voice_cloned': { metaEvent: 'VoiceCloned', isStandard: false },
  'ad_generated': { metaEvent: 'AdGenerated', isStandard: false },
  'render_failed': { metaEvent: 'RenderFailed', isStandard: false },
  'api_error': { metaEvent: 'ApiError', isStandard: false },
  'slow_render': { metaEvent: 'SlowRender', isStandard: false },
};
```

#### 2. Tracking Service Integration (`src/services/tracking.ts`)

Updated to automatically call Meta event tracking:

```typescript
track(event: TrackingEvent, properties?: EventProperties): void {
  // Track with PostHog
  posthog.capture(event, properties);

  // Also track with Meta Pixel (if available)
  if (typeof window !== 'undefined') {
    trackMetaAppEvent(event, properties);
  }
}
```

### Event Mappings

#### Standard Events (10 events)

Standard events are predefined by Meta and optimized for conversion tracking:

| Internal Event | Meta Standard Event | Value | Description |
|---------------|---------------------|-------|-------------|
| `landing_view` | ViewContent | $0 | User views landing page |
| `signup_started` | Lead | $5 | User begins signup |
| `signup_completed` | CompleteRegistration | $10 | User completes signup |
| `first_video_created` | ViewContent | $15 | User creates first video |
| `first_render_completed` | CompleteRegistration | $20 | User completes first render |
| `video_rendered` | Purchase | $2/render | User renders video |
| `batch_completed` | Purchase | $2/render | User completes batch |
| `export_downloaded` | Purchase | $5 | User downloads export |
| `checkout_started` | InitiateCheckout | Plan price | User starts checkout |
| `purchase_completed` | Purchase | Plan price | User completes purchase |

#### Custom Events (8 events)

Custom events are tracked with `fbq('trackCustom')`:

| Internal Event | Meta Custom Event | Value | Description |
|---------------|-------------------|-------|-------------|
| `return_visit` | ReturnVisit | $5 | User returns to app |
| `feature_discovery` | FeatureDiscovery | $3 | User discovers feature |
| `template_used` | TemplateUsed | $2 | User uses template |
| `voice_cloned` | VoiceCloned | $10 | User clones voice |
| `ad_generated` | AdGenerated | $5 | User generates ad |
| `render_failed` | RenderFailed | - | Render fails |
| `api_error` | ApiError | - | API error occurs |
| `slow_render` | SlowRender | - | Render is slow |

## Usage

### Automatic Tracking

No code changes required! Events are automatically mapped when using the tracking service:

```typescript
import { tracking } from '@/services/tracking';

// This automatically triggers Meta Pixel event
tracking.track('signup_completed', {
  method: 'email',
});

// Internally becomes:
// fbq('track', 'CompleteRegistration', {
//   value: 10,
//   currency: 'USD',
//   content_category: 'signup',
//   content_name: 'user_registration',
//   original_event: 'signup_completed',
//   method: 'email',
// });
```

### Manual Tracking

You can also track Meta events directly:

```typescript
import { trackMetaAppEvent } from '@/services/metaEvents';

// Track a signup
trackMetaAppEvent('signup_completed', {
  method: 'email',
});

// Track a purchase
trackMetaAppEvent('purchase_completed', {
  planId: 'pro',
  planName: 'Pro Plan',
  price: 29,
  interval: 'month',
  currency: 'USD',
  transactionId: 'txn_123',
});

// Track a video render
trackMetaAppEvent('video_rendered', {
  videoId: 'vid_123',
  renderCount: 5,
});
```

### Event Parameters

Each event automatically includes:

**Base Parameters:**
- `original_event` - Internal event name for debugging
- `timestamp` - ISO timestamp
- `value` - Calculated event value (if applicable)
- `currency` - Always "USD"

**Event-Specific Parameters:**

**Signup Events:**
```typescript
{
  content_category: 'signup',
  content_name: 'user_registration',
  method: 'email' | 'google' | 'github',
}
```

**Checkout Events:**
```typescript
{
  content_ids: ['pro'],
  content_name: 'Pro Plan',
  content_type: 'product',
  value: 29,
  currency: 'USD',
}
```

**Purchase Events:**
```typescript
{
  content_ids: ['business'],
  content_name: 'Business Plan',
  content_type: 'product',
  value: 99,
  currency: 'USD',
  transaction_id: 'txn_123',
}
```

**Video Render Events:**
```typescript
{
  content_type: 'video',
  content_ids: ['vid_123'],
  num_items: 5,
  value: 10, // $2 per render
  currency: 'USD',
}
```

## Value Calculation

Event values are automatically calculated to represent business value:

### Fixed Values

- `signup_started`: $5 (lead value)
- `signup_completed`: $10 (registration value)
- `first_render_completed`: $20 (activation value)
- `export_downloaded`: $5 (export value)

### Dynamic Values

- `video_rendered`: $2 × render count
- `batch_completed`: $2 × batch size
- `checkout_started`: Plan price
- `purchase_completed`: Plan price

### Custom Event Values

- `return_visit`: $5
- `feature_discovery`: $3
- `template_used`: $2
- `voice_cloned`: $10
- `ad_generated`: $5

## Testing

### Automated Tests

Run the comprehensive test suite:

```bash
npx tsx scripts/test-meta-standard-events.ts
```

The test suite verifies:
- ✓ All events are mapped correctly
- ✓ Standard event names are valid
- ✓ Event parameters are properly formatted
- ✓ Values are calculated correctly
- ✓ Custom events use trackCustom
- ✓ Critical events (signup, checkout, purchase) are standard events

**Test Results:**
```
Total events mapped: 18
Standard events: 10
Custom events: 8

Total: 6/6 tests passed ✓
```

### Manual Testing

**Browser Console:**
```javascript
// Check Meta Pixel is loaded
window.fbq

// Track test event
tracking.track('signup_completed', { method: 'email' });

// Check event was sent
// Look for network request to facebook.com/tr
```

**Meta Pixel Helper:**
1. Install [Meta Pixel Helper Chrome Extension](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
2. Visit your site
3. Trigger events (signup, render, purchase)
4. Click extension icon to see events
5. Verify event names and parameters

**Facebook Events Manager:**
1. Go to [Events Manager](https://business.facebook.com/events_manager)
2. Click "Test Events" tab
3. Enter your website URL
4. Trigger events in your app
5. See events appear in real-time
6. Verify event names, values, and parameters

## Meta Standard Events Reference

### E-commerce Events

**ViewContent**
- User views a product or content
- Maps to: `landing_view`, `first_video_created`
- Parameters: `content_type`, `content_name`, `content_ids`

**InitiateCheckout**
- User begins checkout process
- Maps to: `checkout_started`
- Parameters: `content_ids`, `value`, `currency`

**Purchase**
- User completes purchase (or micro-conversion)
- Maps to: `video_rendered`, `batch_completed`, `export_downloaded`, `purchase_completed`
- Parameters: `content_ids`, `value`, `currency`, `transaction_id`

### Lead Generation Events

**Lead**
- User submits lead form or starts signup
- Maps to: `signup_started`
- Parameters: `content_category`, `value`, `currency`

**CompleteRegistration**
- User completes registration or activation milestone
- Maps to: `signup_completed`, `first_render_completed`
- Parameters: `content_category`, `content_name`, `value`

## Meta Ads Optimization

### Campaign Optimization

With standard events mapped, you can optimize campaigns for:

**Awareness:**
- `ViewContent` events (landing views)
- Build audience reach

**Consideration:**
- `Lead` events (signup starts)
- Optimize for lead generation

**Conversion:**
- `CompleteRegistration` events (signups)
- `InitiateCheckout` events (checkout starts)
- `Purchase` events (purchases and renders)

### Custom Audiences

Create audiences based on events:

**High Intent Users:**
```
Users who triggered checkout_started in last 7 days
  AND did NOT trigger purchase_completed
→ Retarget with discount offer
```

**Activated Users:**
```
Users who triggered first_render_completed
→ Upsell to paid plan
```

**Power Users:**
```
Users who triggered video_rendered 10+ times in last 30 days
→ Invite to refer-a-friend program
```

### Lookalike Audiences

Build lookalikes from converters:

**Signup Lookalike:**
```
Source: Users who triggered signup_completed
→ Target similar users for acquisition
```

**Purchase Lookalike:**
```
Source: Users who triggered purchase_completed with value > $50
→ Target high-value prospects
```

## Conversion Tracking Setup

### 1. Create Conversion Events

In Facebook Events Manager:
1. Go to Events Manager → Custom Conversions
2. Click "Create Custom Conversion"
3. Select your Pixel
4. Define conversion:
   - Event: `Purchase`
   - URL rule: Contains "checkout/success"
   - Value: Use event value
   - Name: "Plan Purchase"

### 2. Set Up Campaigns

When creating ads:
1. Choose campaign objective: "Conversions"
2. Select conversion event: "Plan Purchase"
3. Facebook will optimize for this event
4. Track performance in Ads Manager

### 3. Attribution Settings

Configure attribution windows:
1. Go to Events Manager → Settings → Attribution
2. Set attribution window:
   - Click-through: 7 days (default)
   - View-through: 1 day (default)
3. Conversions within these windows count toward ad performance

## Event Deduplication

To prevent double-counting when using both Pixel and CAPI (META-004):

```typescript
// Generate unique event ID
const eventId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Track with Pixel (includes eventID)
trackMetaEvent('Purchase', {
  value: 99,
  currency: 'USD',
  transaction_id: 'txn_123',
}, {
  eventID: eventId,
});

// Track with CAPI (same eventID)
// Covered in META-004
```

## Privacy & Compliance

### Data Handling

**PII Hashing:**
- Don't send raw email, phone, or address
- Hash with SHA256 before sending
- Use Meta's Advanced Matching for better attribution

**User Consent:**
- Respect user's tracking preferences
- Integrate with consent management platform
- Use `fbq('consent', 'grant|revoke')`

### GDPR Compliance

```typescript
// Check user consent before tracking
if (userHasConsented) {
  trackMetaAppEvent('purchase_completed', { ... });
}

// Revoke consent
fbq('consent', 'revoke');
```

## Debugging

### Development Logging

In development mode, events are logged to console:

```
[Meta Standard Event] CompleteRegistration: {
  original_event: 'signup_completed',
  value: 10,
  currency: 'USD',
  content_category: 'signup',
  content_name: 'user_registration',
  method: 'email',
  timestamp: '2026-01-29T...',
}
```

### Common Issues

**Event not appearing in Events Manager:**
- Check Meta Pixel is loaded (`window.fbq`)
- Verify Pixel ID is correct
- Check browser console for errors
- Disable ad blockers
- Check Meta Pixel Helper extension

**Wrong event name:**
- Verify event mapping in `metaEvents.ts`
- Check `isStandard` flag
- Review test results

**Missing parameters:**
- Check event properties are passed correctly
- Review parameter mapping logic
- Check console logs in development

**Incorrect value:**
- Verify `getValue` function
- Check properties include required fields
- Test with automated tests

### Helper Functions

Get event mapping for debugging:

```typescript
import { getMetaEventMapping, getAllEventMappings } from '@/services/metaEvents';

// Get single mapping
const mapping = getMetaEventMapping('signup_completed');
console.log(mapping);
// { metaEvent: 'CompleteRegistration', isStandard: true }

// Get all mappings
const allMappings = getAllEventMappings();
console.log(allMappings);
// { signup_completed: { metaEvent: 'CompleteRegistration', isStandard: true }, ... }
```

## Performance Impact

### Bundle Size

- `metaEvents.ts`: ~10KB (uncompressed)
- No additional network requests
- Events piggyback on existing Meta Pixel requests

### Runtime Performance

- Event mapping: <1ms per event
- No blocking operations
- Runs asynchronously
- Minimal memory footprint

## Next Steps

After implementing META-003:

1. **META-004: CAPI Server-Side Events**
   - Implement Conversions API
   - Server-side event tracking
   - Better iOS 14+ tracking
   - Event deduplication

2. **META-005: Event Deduplication**
   - Use matching event_id for Pixel + CAPI
   - Prevent double counting
   - Improve attribution accuracy

3. **META-006: User Data Hashing**
   - SHA256 hash PII
   - Advanced Matching integration
   - Improve conversion attribution

## Resources

- [Meta Pixel Standard Events](https://developers.facebook.com/docs/meta-pixel/reference)
- [Facebook Events Manager](https://business.facebook.com/events_manager)
- [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
- [Custom Conversions Guide](https://www.facebook.com/business/help/408583049423005)
- [Attribution Settings](https://www.facebook.com/business/help/370704083280490)

## Files Changed

- ✅ `src/services/metaEvents.ts` - Event mapping service (350 lines)
- ✅ `src/services/tracking.ts` - Integration with tracking service (3 lines modified)
- ✅ `scripts/test-meta-standard-events.ts` - Comprehensive test suite (350 lines)
- ✅ `docs/META-003-STANDARD-EVENTS-MAPPING.md` - This documentation

**Total:** ~700 lines of code + documentation

## Success Criteria

- ✅ All 18 internal events mapped to Meta events
- ✅ 10 standard events use correct Meta event names
- ✅ 8 custom events use trackCustom
- ✅ Event parameters properly formatted
- ✅ Event values calculated correctly
- ✅ Critical events (signup, checkout, purchase) are standard
- ✅ Automatic tracking when using tracking service
- ✅ Test suite passes 6/6 tests
- ✅ Events appear in Meta Events Manager
- ✅ Meta Pixel Helper shows correct events
