# META-004: CAPI Server-Side Events

Server-side conversion tracking via Meta Conversions API (CAPI).

## Overview

The Meta Conversions API enables server-to-server conversion tracking, complementing the browser-based Meta Pixel. This improves attribution accuracy, bypasses browser tracking limitations (ad blockers, privacy features), and provides better measurement reliability.

**Key Benefits:**
- **Improved Attribution**: Server events are more reliable than browser-only tracking
- **Better Event Quality**: Less affected by ad blockers, privacy features, and tracking prevention
- **Event Deduplication**: Matches server events with Pixel events using event_id for accurate counting
- **Enhanced Data**: Send enriched conversion data including hashed PII for better targeting

## Architecture

```
┌─────────────────┐
│  User Browser   │
│                 │
│  Meta Pixel     │──────┐
└─────────────────┘      │
                         │  Both send
┌─────────────────┐      │  events with
│  Server/API     │      │  same event_id
│                 │      │  for dedup
│  Meta CAPI      │──────┘
└─────────────────┘      │
                         ▼
                  ┌─────────────┐
                  │  Meta Ads   │
                  │  Platform   │
                  └─────────────┘
```

## Implementation

### 1. Types (`src/types/metaCapi.ts`)

Defines TypeScript interfaces for CAPI:
- `MetaCapiConfig`: Configuration for CAPI service
- `CapiUserData`: User data (PII) to be hashed
- `CapiCustomData`: Event-specific data
- `CapiServerEvent`: Server event structure
- `CapiRequest/Response`: API request/response types

### 2. Service (`src/services/metaCapi.ts`)

Core CAPI service with:
- **Automatic PII hashing**: SHA256 hashing of email, phone, name, etc.
- **Event tracking**: Single events and batch events
- **Deduplication support**: Event IDs for matching with Pixel
- **Error handling**: Graceful failures with logging
- **Test mode**: Support for test event codes

**Key Methods:**
```typescript
// Initialize
metaCapiService.initialize({
  pixelId: 'YOUR_PIXEL_ID',
  accessToken: 'YOUR_ACCESS_TOKEN',
  testEventCode: 'TEST12345', // optional
});

// Track single event
await metaCapiService.trackEvent('Purchase', {
  userData: {
    em: 'customer@example.com', // will be hashed
    fn: 'John',                 // will be hashed
    ln: 'Doe',                  // will be hashed
    external_id: 'user_123',
  },
  customData: {
    content_ids: ['plan_pro'],
    value: 29.99,
    currency: 'USD',
  },
  eventId: 'unique-event-id-123', // for dedup
});

// Track batch events
await metaCapiService.trackBatchEvents([
  { eventName: 'ViewContent', options: {...} },
  { eventName: 'Lead', options: {...} },
]);

// Track app event (auto-mapped)
await metaCapiService.trackAppEvent(
  'purchase_completed',
  { price: 29.99, planId: 'pro' },
  { em: 'customer@example.com' }
);
```

### 3. Server Tracking Integration (`src/services/trackingServer.ts`)

Enhanced server tracking service that:
- Tracks with PostHog (product analytics)
- Tracks with Meta CAPI (conversion tracking)
- Auto-extracts user data from event properties
- Handles both tracking systems in parallel

**Usage:**
```typescript
import { serverTracking } from '@/services/trackingServer';

// Track from API route or server component
serverTracking.track('purchase_completed', {
  userId: 'user_123',
  email: 'customer@example.com', // auto-sent to CAPI
  planId: 'pro',
  price: 29.99,
});
```

## Configuration

### Environment Variables

Add to `.env`:

```bash
# Meta Pixel ID (same as browser pixel)
NEXT_PUBLIC_META_PIXEL_ID=your_pixel_id_here

# Meta Conversions API Access Token
# Get from: https://business.facebook.com/events_manager
# Navigate to: Events Manager > Settings > Conversions API
META_CAPI_ACCESS_TOKEN=your_access_token_here

# Optional: Test Event Code for debugging
META_CAPI_TEST_EVENT_CODE=TEST12345
```

### Getting Access Token

1. Go to [Meta Events Manager](https://business.facebook.com/events_manager)
2. Select your Pixel
3. Click **Settings** tab
4. Navigate to **Conversions API** section
5. Click **Generate Access Token**
6. Copy the token and add to `.env`

### Test Events

To test CAPI integration without affecting production data:

1. Go to Events Manager > Test Events tab
2. Copy the Test Event Code
3. Add to `.env` as `META_CAPI_TEST_EVENT_CODE`
4. Run test script: `tsx scripts/test-meta-capi.ts`
5. View test events in real-time in Events Manager

## Event Mapping

Internal events are automatically mapped to Meta standard events:

| Internal Event | Meta Event | Notes |
|---|---|---|
| `signup_started` | Lead | User starts signup |
| `signup_completed` | CompleteRegistration | User completes signup |
| `video_rendered` | Purchase | Treat renders as micro-conversions |
| `batch_completed` | Purchase | Batch renders |
| `purchase_completed` | Purchase | Actual purchase |
| `checkout_started` | InitiateCheckout | User starts checkout |

## Data Hashing

All PII (Personally Identifiable Information) is automatically hashed with SHA256 before sending:

**Hashed Fields:**
- Email (`em`)
- Phone (`ph`)
- First Name (`fn`)
- Last Name (`ln`)
- City (`ct`)
- State (`st`)
- Zip Code (`zp`)
- Country (`country`)
- Gender (`ge`)
- Date of Birth (`db`)

**Example:**
```typescript
// Input
userData: {
  em: 'john@example.com',
  fn: 'John',
  ln: 'Doe',
}

// Sent to Meta (auto-hashed)
userData: {
  em: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
  fn: '96d9632f363564cc3032521409cf22a852f2032eec099ed5967c0d000cec607a',
  ln: '70b442f0e14f04a0f0b6eb92c22e8a9a1f12d3c9e4e7a5f85e2b58f4e4d42c8b',
}
```

## Testing

### Run Test Script

```bash
# Configure environment variables first
cp .env.example .env
# Add your NEXT_PUBLIC_META_PIXEL_ID and META_CAPI_ACCESS_TOKEN

# Run tests
tsx scripts/test-meta-capi.ts
```

**Tests:**
1. Connection test (PageView event)
2. Standard event tracking (Lead)
3. Purchase event tracking
4. Server tracking integration
5. Batch event tracking

### Verify in Meta Events Manager

1. Go to [Events Manager](https://business.facebook.com/events_manager)
2. Check **Test Events** tab (if using test event code)
3. Or check **Overview** tab for production events
4. Verify:
   - Events are received
   - Event parameters are correct
   - Event quality score is good (8.0+)
   - Deduplication is working (if using Pixel + CAPI)

## Event Deduplication

To prevent double-counting when using both Pixel (browser) and CAPI (server):

1. **Generate Event ID**: Create unique ID for each event
2. **Send Same ID**: Use same `event_id` in both Pixel and CAPI
3. **Meta Deduplicates**: Meta automatically deduplicates matching events

**Example:**

```typescript
// Browser (Meta Pixel)
const eventId = `${Date.now()}-${Math.random()}`;
window.fbq('track', 'Purchase', {
  value: 29.99,
  currency: 'USD',
}, {
  eventID: eventId, // important!
});

// Server (Meta CAPI)
await metaCapiService.trackEvent('Purchase', {
  eventId: eventId, // same ID!
  customData: {
    value: 29.99,
    currency: 'USD',
  },
});
```

Meta will recognize these as the same event and only count once.

## Best Practices

1. **Always Hash PII**: The service does this automatically
2. **Use Event IDs**: For deduplication with Pixel
3. **Include User Data**: Email, phone, etc. for better attribution
4. **Send Value**: Include monetary value for optimization
5. **Use Standard Events**: Prefer standard events over custom events
6. **Test First**: Use test event codes before production
7. **Monitor Quality**: Check Event Match Quality score in Events Manager
8. **Batch When Possible**: Send multiple events in one request to reduce API calls

## Troubleshooting

### Events Not Showing in Events Manager

- Check access token is valid
- Verify pixel ID matches
- Look for error logs in console
- Check if test event code is set (events only show in Test Events tab)

### Low Event Quality Score

- Include more user data (email, phone, etc.)
- Ensure data is properly normalized before hashing
- Send client IP and user agent when available
- Use event deduplication with Pixel

### Authentication Errors

- Regenerate access token in Events Manager
- Ensure token has proper permissions
- Check token isn't expired

## API Reference

See type definitions in `src/types/metaCapi.ts` for complete API documentation.

## Resources

- [Meta Conversions API Docs](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [Event Deduplication Guide](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events)
- [Standard Events Reference](https://developers.facebook.com/docs/meta-pixel/reference)
- [Events Manager](https://business.facebook.com/events_manager)

## Related Features

- **META-001**: Meta Pixel Installation
- **META-002**: PageView Tracking
- **META-003**: Standard Events Mapping
- **META-005**: Event Deduplication (depends on META-004)
- **META-006**: User Data Hashing (implemented in META-004)
