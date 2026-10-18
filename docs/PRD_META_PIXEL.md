# Meta Pixel & Conversions API Integration PRD

**Version:** 1.0
**Last Updated:** January 30, 2026
**Status:** In Development

---

## Overview

Meta Pixel integration enables real-time conversion tracking and optimization for Remotion VideoStudio ads. The system:

- Installs Meta Pixel base code on all pages
- Maps app events to Meta standard events (Lead, Purchase, etc.)
- Sends server-side events via Conversions API
- Deduplicates events between Pixel and CAPI
- Supports dynamic parameters for conversion optimization

---

## Goals

1. **Facebook/Instagram Campaign Optimization** - Enable Meta to optimize ad spend
2. **Conversion Tracking** - Measure signup, purchase, and other key conversions
3. **Audience Building** - Create retargeting audiences (RLSA)
4. **Deduplication** - Prevent double-counting between client and server events
5. **Compliance** - GDPR, CCPA cookie consent handling

---

## Setup

### Prerequisites

1. Meta Business Account with Pixel access
2. Pixel ID from Meta Business Manager
3. Access Token with events:manage permission
4. Server-side event verification enabled (optional but recommended)

### Pixel Installation (META-001)

Base Pixel code injected into `<head>` on all pages:

```html
<!-- From lib/meta-pixel.ts -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '{{ PIXEL_ID }}');
  fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id={{ PIXEL_ID }}&ev=PageView&noscript=1" /></noscript>
```

### Access Token Setup

```typescript
// environment variables
NEXT_PUBLIC_META_PIXEL_ID=123456789
META_CONVERSIONS_API_TOKEN=EAABsBCS...
META_PIXEL_API_VERSION=v18.0
```

---

## Standard Events Mapping (META-002)

### Event Categories & Meta Events

#### Acquisition → Lead
```
App Event: signup_completed
Meta Event: Lead
Properties:
  - value: 0 (no direct revenue)
  - currency: 'USD'
  - content_type: 'product'
```

#### Activation → ViewContent
```
App Event: first_video_created, first_render_completed
Meta Event: ViewContent
Properties:
  - content_name: template name
  - content_category: 'video_editor'
  - content_type: 'template'
```

#### Core Value → AddToCart (Video Render)
```
App Event: video_rendered
Meta Event: AddToCart
Properties:
  - value: 0
  - content_name: brief_id
  - content_type: 'product'
```

#### Monetization → Purchase
```
App Event: purchase_completed, subscription_renewal
Meta Event: Purchase
Properties:
  - value: amount (USD)
  - currency: 'USD'
  - content_type: 'product'
  - content_ids: [subscription_id]
  - contents: [{ id, quantity: 1, title }]
```

### Custom Events

For events without direct Meta equivalents:

| App Event | Meta Event Name | Use Case |
|-----------|-----------------|----------|
| `batch_render_completed` | `batch_process_complete` | Workflow completion |
| `voice_cloned` | `ai_feature_used` | Feature adoption |
| `asset_generated` | `customize_product` | Customization engagement |

---

## Conversions API (META-003)

Server-side event transmission via Conversions API:

### Endpoint

```
POST https://graph.facebook.com/{{ API_VERSION }}/{{ PIXEL_ID }}/events
Authorization: Bearer {{ ACCESS_TOKEN }}
```

### Request Format

```json
{
  "data": [
    {
      "event_name": "Purchase",
      "event_time": 1234567890,
      "user_data": {
        "em": "joe@eg.com",  // hashed email
        "ph": "12025551234", // hashed phone
        "fn": "joe",         // hashed first name
        "ln": "smith"        // hashed last name
      },
      "custom_data": {
        "value": 100,
        "currency": "USD",
        "content_name": "Subscription Pro",
        "content_type": "product",
        "content_ids": ["sub_123"]
      },
      "event_id": "{{ EVENT_ID }}", // For deduplication
      "event_source_url": "https://example.com/checkout"
    }
  ],
  "test_event_code": "TEST12345" // Optional for testing
}
```

### Response

```json
{
  "events_received": 1,
  "fb_trace_id": "..."
}
```

---

## Event Deduplication (META-004)

Prevent counting same conversion twice (once from Pixel, once from CAPI):

### Strategy

1. **Generate event_id on client** when event occurs
2. **Send via Pixel** (client-side) with event_id
3. **Send via CAPI** (server-side) with matching event_id
4. **Meta deduplicates** automatically within 15 minutes

### Implementation

```typescript
const eventId = `evt_${Date.now()}_${Math.random()}`;

// Client-side (Pixel)
fbq('track', 'Purchase', {
  value: 100,
  currency: 'USD'
}, { eventID: eventId });

// Server-side (CAPI)
await fetch('https://graph.facebook.com/v18.0/123456789/events', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    data: [{
      event_name: 'Purchase',
      event_id: eventId,  // Same ID
      event_time: Math.floor(Date.now() / 1000),
      user_data: { ... },
      custom_data: { value: 100, currency: 'USD' }
    }],
    partner_agent: 'remotion-videostudio/1.0'
  })
});
```

### Event ID Format

```
evt_<timestamp_ms>_<random_hex>_<personId>
// e.g.: evt_1706538000123_a1b2c3d4_person_456
```

---

## Tracking Spec

### User Data Hashing

Conversions API requires user data to be hashed (SHA-256):

```typescript
import crypto from 'crypto';

function hashEmail(email: string): string {
  return crypto
    .createHash('sha256')
    .update(email.toLowerCase().trim())
    .digest('hex');
}

function hashPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return crypto
    .createHash('sha256')
    .update(digits)
    .digest('hex');
}
```

### Timestamp Format

All timestamps must be Unix time (seconds since epoch):

```typescript
const eventTime = Math.floor(Date.now() / 1000);
```

### Content IDs

For product events, include content identifiers:

```typescript
{
  content_ids: ['sub_123', 'plan_pro'],  // Stripe IDs
  contents: [
    {
      id: 'sub_123',
      quantity: 1,
      title: 'VideoStudio Pro'
    }
  ]
}
```

---

## Implementation

### File Structure

```
src/integrations/
  ├── meta-pixel.ts           // Pixel SDK wrapper
  ├── conversions-api.ts      // CAPI client
  ├── event-mapper.ts         // App event → Meta event mapping
  └── deduplication.ts        // Event ID tracking

lib/
  ├── meta-pixel-setup.ts     // Initialization
  └── pixel-events.ts         // Pixel event tracking helpers
```

### Usage

```typescript
// In app initialization
import { initializeMetaPixel } from '@/integrations/meta-pixel';

initializeMetaPixel({
  pixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID,
  apiToken: process.env.META_CONVERSIONS_API_TOKEN,
  deduplicateWithinMs: 15000,
  testMode: process.env.NODE_ENV === 'development'
});

// Track events
import { trackMetaEvent } from '@/integrations/meta-pixel';

trackMetaEvent('purchase_completed', {
  amount: 99.99,
  plan: 'pro',
  subscription_id: 'sub_123'
});
```

---

## Testing

### Test Event Code

Use Meta's test_event_code for sandbox testing:

```bash
# Get from Meta Business Manager → Events Manager → Test Events
TEST_EVENT_CODE=TEST12345

# Send test events without impacting live data
```

### Validation

```typescript
// Check Pixel is loaded
console.log(typeof fbq); // function

// Verify CAPI responses
const response = await capiClient.sendEvent(...);
console.log(response.events_received); // should be 1
```

---

## Monitoring & Debugging

### Pixel Debug Mode

```javascript
// Enable debug in browser console
fbq('set', 'autoConfig', true);
fbq('set', 'initData', { ... });
```

### CAPI Validation

```typescript
// Log all CAPI requests
if (process.env.DEBUG_META_PIXEL) {
  console.log('CAPI Payload:', JSON.stringify(payload, null, 2));
}
```

### Analytics Dashboard

Monitor in Meta Events Manager:
- Event counts & timing
- Conversion value
- User data match rate
- Event validation issues

---

## Compliance

### GDPR

- Pixel respects local privacy settings
- Server-side events use hashed PII only
- Consent-based event transmission

### CCPA

- Respect CA Privacy Rights requests
- Honor user opt-out signals
- Data retention policies

### Cookie Policy

- Meta Pixel sets _fbp cookie (180-day expiry)
- Document in Privacy Policy
- Respect Do Not Track header

---

## Troubleshooting

### Events Not Showing

1. **Verify Pixel ID** is correct (Events Manager)
2. **Check fbq exists** in console: `typeof fbq`
3. **Verify event names** match Meta spec (case-sensitive)
4. **Review user data** hashing (must be SHA-256)

### Deduplication Issues

1. **Verify event_id** is consistent between Pixel and CAPI
2. **Check timestamps** are within 15 minutes
3. **Review event_name** matches between client/server

### CAPI Authorization

1. **Verify access token** has events:manage permission
2. **Check token expiry** in Business Manager
3. **Verify Pixel ID** is correct
4. **Review test_event_code** for sandbox testing

---

## Performance

- **Client-side**: Pixel SDK ~40KB gzipped, non-blocking
- **Server-side**: CAPI requests ~2-5ms latency
- **Batching**: Queue events, send every 5s or 10 events

---

## Future Enhancements

- Dynamic Product Ads (DPA) support
- Audience sync via APIs
- Custom conversion windows
- Vertical-specific tracking (e-commerce, SaaS)
