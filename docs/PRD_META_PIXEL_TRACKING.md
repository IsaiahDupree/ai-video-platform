# PRD: Meta Pixel & CAPI Integration for AI Video Platform

**Status:** Active  
**Created:** January 26, 2026  
**Priority:** P1

## Overview

Integrate Meta Pixel and Conversions API for retargeting and conversion optimization.

## Standard Events Mapping

| App Event | Meta Event | Parameters |
|-----------|------------|------------|
| `signup_completed` | `Lead` | `content_name: "signup"` |
| `first_render_completed` | `CompleteRegistration` | `content_name: "first_render"` |
| `pricing_viewed` | `ViewContent` | `content_type: "pricing"` |
| `checkout_started` | `InitiateCheckout` | `value, currency` |
| `purchase_completed` | `Purchase` | `value, currency, content_ids` |

## Implementation

### Browser Pixel
```javascript
fbq('track', 'Lead', { content_name: 'signup' }, { eventID: eventId });
```

### Server CAPI
```javascript
await fetch('/api/meta/capi', {
  method: 'POST',
  body: JSON.stringify({
    event_name: 'Lead',
    event_id: eventId,  // Must match Pixel eventID
    user_data: { em: hashedEmail }
  })
});
```

## Features

| ID | Name | Priority |
|----|------|----------|
| META-001 | Meta Pixel Installation | P1 |
| META-002 | PageView Tracking | P1 |
| META-003 | Standard Events Mapping | P1 |
| META-004 | CAPI Server-Side Events | P1 |
| META-005 | Event Deduplication | P1 |
| META-006 | User Data Hashing | P1 |
| META-007 | Custom Audiences Setup | P2 |
| META-008 | Conversion Optimization | P2 |
