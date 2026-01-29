# META-005: Event Deduplication

## Overview

Event deduplication ensures that when the same conversion event is sent from both the browser (Meta Pixel) and the server (Conversions API), Meta counts it only once. This prevents inflated conversion metrics and improves attribution accuracy.

## Problem Statement

Without deduplication:
- Browser sends event → Meta counts 1 conversion
- Server sends same event → Meta counts another conversion
- **Result:** 2 conversions counted for 1 actual conversion ❌

With deduplication:
- Browser sends event with `eventID: "abc123"` → Meta receives event
- Server sends same event with `event_id: "abc123"` → Meta recognizes duplicate
- **Result:** 1 conversion counted ✅

## Implementation

### 1. Event ID Generation

Both client and server use the same event ID format:

```typescript
// Format: timestamp-random
// Example: 1234567890123-xyz789

function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
```

**Location:**
- Client: `src/components/MetaPixel.tsx` → `generateMetaEventId()`
- Server: `src/services/metaCapi.ts` → `generateEventId()`

### 2. Client-Side (Meta Pixel)

The Meta Pixel now accepts an optional `eventId` parameter:

```typescript
import { trackMetaEvent, generateMetaEventId } from '@/components/MetaPixel';

// Generate event ID
const eventId = generateMetaEventId();

// Track with Meta Pixel
trackMetaEvent('Purchase', {
  value: 99.99,
  currency: 'USD'
}, eventId); // Pass event ID as third parameter
```

**How it works:**
```javascript
// Meta Pixel API call
window.fbq('track', 'Purchase', parameters, { eventID: eventId });
```

### 3. Server-Side (Conversions API)

The CAPI service accepts and uses the same event ID:

```typescript
import { metaCapiService } from '@/services/metaCapi';

// Use the same event ID from client
await metaCapiService.trackEvent('Purchase', {
  eventId: eventId, // Same ID as Pixel
  userData: {
    em: 'user@example.com',
    // ... other user data
  },
  customData: {
    value: 99.99,
    currency: 'USD'
  }
});
```

### 4. Automatic Integration

The `metaEvents.ts` service automatically handles deduplication:

```typescript
import { trackMetaAppEvent } from '@/services/metaEvents';

// Automatically generates event ID and sends to both Pixel and CAPI
trackMetaAppEvent('purchase_completed', {
  price: 99.99,
  planId: 'pro-monthly',
  planName: 'Pro Plan'
});
```

**What happens:**
1. `trackMetaAppEvent()` generates unique `eventId`
2. Sends to Meta Pixel with `eventID` parameter
3. Server-side tracking receives same `eventId`
4. CAPI sends event with same `event_id`
5. Meta deduplicates using matching IDs

## Event Flow

```
User Action (e.g., completes purchase)
        |
        v
trackMetaAppEvent('purchase_completed', {...})
        |
        +-- Client Side --------> Meta Pixel
        |                        fbq('track', 'Purchase', {...}, {eventID: "123"})
        |                               |
        |                               v
        |                        Meta Events Manager
        |                               ^
        |                               |
        +-- Server Side --------> Conversions API
                                 POST /events
                                 {event_id: "123", ...}

                                Meta Deduplication
                                event_id "123" matches
                                → Count as 1 conversion
```

## Testing

### Manual Test

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Open browser console and run:**
   ```javascript
   // Import functions (in a real component)
   import { trackMetaEvent, generateMetaEventId } from '@/components/MetaPixel';

   // Generate event ID
   const eventId = generateMetaEventId();
   console.log('Event ID:', eventId);

   // Send from browser
   trackMetaEvent('Lead', { content_name: 'Test' }, eventId);
   ```

3. **Check Meta Events Manager:**
   - Go to Meta Ads Manager → Events Manager
   - Select your Pixel
   - Click "Test Events"
   - Look for event with matching `event_id`

### Automated Test

Run the test script:

```bash
npx tsx scripts/test-meta-event-dedup.ts
```

This tests:
- ✅ Event ID generation
- ✅ Format consistency (timestamp-random)
- ✅ Event mapping
- ✅ CAPI integration
- ✅ Deduplication simulation

### Verify in Meta Events Manager

1. **Navigate to Events Manager:**
   - https://business.facebook.com/events_manager

2. **Select your Pixel**

3. **Check "Event Match Quality":**
   - Should show high match quality for deduplication
   - Event ID match rate should be near 100%

4. **Check "Deduplication":**
   - Events tab → Filter by event name
   - Compare Pixel events vs CAPI events
   - Deduplicated count should be lower than total

## Environment Variables

Required environment variables:

```bash
# .env.local
NEXT_PUBLIC_META_PIXEL_ID=your_pixel_id_here
META_CAPI_ACCESS_TOKEN=your_capi_access_token_here
META_CAPI_TEST_EVENT_CODE=TEST12345  # Optional, for testing
```

## Benefits

### 1. Accurate Conversion Tracking
- No double-counting of conversions
- Reliable ROAS (Return on Ad Spend) metrics

### 2. Improved Attribution
- Meta can better attribute conversions to ad campaigns
- Server-side events fill gaps when browser tracking fails (ad blockers, iOS privacy)

### 3. Better Ad Optimization
- Meta's algorithms receive accurate conversion signals
- Campaign optimization improves over time

### 4. iOS 14.5+ Compliance
- Pixel may be blocked by ATT (App Tracking Transparency)
- CAPI provides backup conversion data
- Deduplication prevents double-counting when both work

## Event ID Best Practices

### ✅ DO:
- Generate event ID once per user action
- Use same ID for both Pixel and CAPI
- Format: `timestamp-random` for uniqueness
- Pass event ID through entire conversion flow

### ❌ DON'T:
- Generate different IDs for Pixel and CAPI
- Reuse event IDs across different user actions
- Use sequential IDs (not unique enough)
- Forget to include event ID in server-side calls

## Monitoring

### What to Monitor:

1. **Event Match Quality (Events Manager):**
   - Should be 80%+ for event_id matching
   - Lower = events not being deduplicated properly

2. **Deduplicated Event Count:**
   - Compare "Events Received" vs "Deduplicated Events"
   - Difference = successfully deduplicated events

3. **Server Event Quality Score:**
   - Should be 8+ out of 10
   - Affected by: event_id matching, user data quality, event_source_url

### Common Issues:

**Issue:** Events not deduplicating
- **Cause:** event_id not matching between Pixel and CAPI
- **Fix:** Ensure same event ID passed to both

**Issue:** Low match quality
- **Cause:** Missing user data (email, phone, etc)
- **Fix:** Send more user data with CAPI events

**Issue:** Pixel events missing event_id
- **Cause:** Not passing third parameter to `trackMetaEvent()`
- **Fix:** Use `trackMetaAppEvent()` which handles it automatically

## Meta Documentation

- [Conversions API Deduplication](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events)
- [Event ID Parameter](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/server-event#event-id)
- [Event Match Quality](https://www.facebook.com/business/help/765081237991954)

## Files Modified

- ✅ `src/components/MetaPixel.tsx` - Added event ID parameter support
- ✅ `src/services/metaEvents.ts` - Automatic event ID generation
- ✅ `src/services/metaCapi.ts` - Event ID handling (already supported)
- ✅ `scripts/test-meta-event-dedup.ts` - Testing script
- ✅ `docs/META-005-EVENT-DEDUPLICATION.md` - This documentation

## Status

✅ **COMPLETE** - Event deduplication implemented and tested

## Next Steps

See **META-006: User Data Hashing** for improving event match quality with PII normalization.
