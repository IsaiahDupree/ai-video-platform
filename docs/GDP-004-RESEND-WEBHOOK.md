# GDP-004: Resend Webhook Edge Function

**Status:** ✅ Complete
**Category:** Growth Data Plane
**Priority:** P0

## Overview

Secure webhook endpoint for receiving and processing email events from Resend. Events are verified, parsed, and stored in the Growth Data Plane for analytics and attribution.

## Features

### Supported Email Events

- ✅ **email.delivered** - Email successfully delivered to recipient
- ✅ **email.opened** - Recipient opened the email
- ✅ **email.clicked** - Recipient clicked a link in the email
- ✅ **email.bounced** - Email bounced (hard or soft bounce)
- ✅ **email.complained** - Recipient marked email as spam

### Security

- **Webhook Signature Verification** - Validates Svix signatures from Resend
- **Replay Attack Prevention** - Rejects webhooks older than 5 minutes
- **Timing-Safe Comparison** - Prevents timing attacks on signature verification

### Data Storage

All email events are stored in the unified `event` table with:
- Person linkage (via email address)
- Event deduplication (same email_id + event_type)
- Rich metadata (IP, user agent, link URL)
- Bounce/complaint details

## Implementation

### Files Created

```
src/types/resendWebhook.ts                    - TypeScript types for Resend webhooks
src/utils/resendWebhookVerify.ts              - Signature verification utilities
src/services/resendWebhookProcessor.ts        - Webhook parsing and processing
src/app/api/webhooks/resend/route.ts          - Next.js API route handler
scripts/test-resend-webhook.ts                - Comprehensive test suite
docs/GDP-004-RESEND-WEBHOOK.md                - This documentation
```

### Environment Variables

```bash
# Resend API Key (for sending emails)
RESEND_API_KEY=re_your_api_key

# Webhook Signing Secret (for verifying webhooks)
RESEND_WEBHOOK_SECRET=whsec_your_secret
```

## Setup Instructions

### 1. Get Resend API Key

1. Go to https://resend.com/api-keys
2. Create a new API key
3. Add to `.env`:
   ```bash
   RESEND_API_KEY=re_your_api_key
   ```

### 2. Configure Webhook

1. Go to https://resend.com/webhooks
2. Click "Add Webhook"
3. Configure webhook:
   - **Endpoint URL:** `https://your-domain.com/api/webhooks/resend`
   - **Events:** Select all email events
   - **Status:** Active

4. Copy the webhook signing secret
5. Add to `.env`:
   ```bash
   RESEND_WEBHOOK_SECRET=whsec_your_secret
   ```

### 3. Verify Webhook

Test the webhook endpoint:

```bash
curl https://your-domain.com/api/webhooks/resend
```

Expected response:
```json
{
  "status": "ok",
  "message": "Resend webhook endpoint is active",
  "configured": true
}
```

### 4. Test Locally

Use Resend's webhook testing tool or send a test email:

```bash
# Run test script
npx tsx scripts/test-resend-webhook.ts
```

## Usage

### Send Email with Tracking

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'onboarding@yourdomain.com',
  to: 'user@example.com',
  subject: 'Welcome to AI Video Platform',
  html: '<p>Click <a href="https://yourdomain.com/start">here</a> to get started</p>',
  tags: {
    campaign: 'onboarding',
    segment: 'new_users',
  },
});
```

### Track Email Events

When the user:
1. **Receives** the email → `email.delivered` event stored
2. **Opens** the email → `email.opened` event stored
3. **Clicks** a link → `email.clicked` event stored (with link URL)

All events are automatically linked to the person via their email address.

### Query Email Engagement

```typescript
import { getPersonEvents } from '@/services/growthDataPlane';

// Get all email events for a person
const events = await getPersonEvents(personId, 100);
const emailEvents = events.filter(e => e.event_source === 'email');

// Count opens
const opens = emailEvents.filter(e => e.email_type === 'opened').length;

// Count clicks
const clicks = emailEvents.filter(e => e.email_type === 'clicked').length;

// Get clicked links
const clickedLinks = emailEvents
  .filter(e => e.email_type === 'clicked')
  .map(e => e.email_link_url);
```

## Webhook Flow

```
1. User receives email
   ↓
2. Resend tracks engagement (open, click)
   ↓
3. Resend sends webhook to /api/webhooks/resend
   ↓
4. Webhook handler verifies signature
   ↓
5. Event is parsed and processed
   ↓
6. Person found/created by email
   ↓
7. Event stored in Growth Data Plane
   ↓
8. Person features updated (if applicable)
```

## Event Schema

### Email Delivered Event

```json
{
  "type": "email.delivered",
  "created_at": "2024-01-29T10:00:00Z",
  "data": {
    "email_id": "5f8d5e8d-1234-5678-90ab-cdef12345678",
    "from": "noreply@yourdomain.com",
    "to": ["user@example.com"],
    "subject": "Welcome!",
    "created_at": "2024-01-29T10:00:00Z"
  }
}
```

### Email Clicked Event

```json
{
  "type": "email.clicked",
  "created_at": "2024-01-29T10:05:00Z",
  "data": {
    "email_id": "5f8d5e8d-1234-5678-90ab-cdef12345678",
    "from": "noreply@yourdomain.com",
    "to": ["user@example.com"],
    "subject": "Welcome!",
    "created_at": "2024-01-29T10:00:00Z",
    "click": {
      "ipAddress": "203.0.113.1",
      "link": "https://yourdomain.com/start?utm_source=email",
      "timestamp": "2024-01-29T10:05:00Z",
      "userAgent": "Mozilla/5.0..."
    }
  }
}
```

## Stored Event Format

```typescript
{
  id: "uuid",
  person_id: "uuid",
  event_name: "email.clicked",
  event_type: "retention",
  event_source: "email",
  event_id: "5f8d5e8d-1234-5678-90ab-cdef12345678_clicked",

  // Email fields
  email_id: "5f8d5e8d-1234-5678-90ab-cdef12345678",
  email_subject: "Welcome!",
  email_type: "clicked",
  email_link_url: "https://yourdomain.com/start?utm_source=email",

  // Context
  user_agent: "Mozilla/5.0...",
  ip_address: "203.0.113.1",

  // Properties
  properties: {
    from: "noreply@yourdomain.com",
    tags: { campaign: "onboarding" }
  },

  event_time: "2024-01-29T10:05:00Z",
  created_at: "2024-01-29T10:05:01Z"
}
```

## Deduplication

Events are deduplicated using a composite key:
- `event_id` = `{email_id}_{event_type}`
- `event_source` = `email`

This prevents duplicate events if Resend retries the webhook.

## Error Handling

### Invalid Signature
- **Status:** 401 Unauthorized
- **Action:** Webhook rejected
- **Log:** "Invalid webhook signature"

### Missing Headers
- **Status:** 400 Bad Request
- **Action:** Webhook rejected
- **Log:** "Missing Svix headers"

### Old Timestamp
- **Status:** 400 Bad Request
- **Action:** Webhook rejected (replay attack prevention)
- **Log:** "Webhook timestamp is too old"

### Processing Error
- **Status:** 500 Internal Server Error
- **Action:** Resend will retry webhook
- **Log:** Full error details

## Testing

### Run Test Suite

```bash
npx tsx scripts/test-resend-webhook.ts
```

### Test Coverage

1. ✅ Webhook signature verification
2. ✅ Timestamp validation (replay attack prevention)
3. ✅ Email delivered event
4. ✅ Email opened event
5. ✅ Email clicked event
6. ✅ Email bounced event
7. ✅ Event deduplication
8. ✅ Database verification

### Manual Testing

Use Resend's webhook testing tool:
1. Go to https://resend.com/webhooks
2. Select your webhook
3. Click "Send Test Event"
4. Verify event appears in Growth Data Plane

## Analytics Use Cases

### Email Engagement Metrics

```sql
-- Email open rate by campaign
SELECT
  properties->>'campaign' as campaign,
  COUNT(DISTINCT CASE WHEN email_type = 'delivered' THEN person_id END) as delivered,
  COUNT(DISTINCT CASE WHEN email_type = 'opened' THEN person_id END) as opened,
  COUNT(DISTINCT CASE WHEN email_type = 'clicked' THEN person_id END) as clicked
FROM event
WHERE event_source = 'email'
  AND event_time > NOW() - INTERVAL '30 days'
GROUP BY properties->>'campaign';
```

### Most Clicked Links

```sql
-- Top 10 clicked links in emails
SELECT
  email_link_url,
  COUNT(*) as clicks,
  COUNT(DISTINCT person_id) as unique_clickers
FROM event
WHERE email_type = 'clicked'
  AND event_time > NOW() - INTERVAL '7 days'
GROUP BY email_link_url
ORDER BY clicks DESC
LIMIT 10;
```

### Email Attribution

```sql
-- Users who clicked email and then purchased
SELECT
  p.email,
  e1.email_link_url as clicked_link,
  e1.event_time as click_time,
  e2.event_time as purchase_time,
  e2.revenue_cents / 100.0 as revenue_usd
FROM event e1
JOIN event e2 ON e1.person_id = e2.person_id
JOIN person p ON e1.person_id = p.id
WHERE e1.email_type = 'clicked'
  AND e2.event_name = 'purchase_completed'
  AND e2.event_time > e1.event_time
  AND e2.event_time < e1.event_time + INTERVAL '7 days';
```

## Next Steps

- **GDP-005:** Email Event Tracking - Track email engagement metrics
- **GDP-006:** Click Redirect Tracker - Attribution from email → click → conversion
- **Email Campaigns:** Build automated email campaigns based on user behavior

## References

- [Resend Webhook Documentation](https://resend.com/docs/api-reference/webhooks)
- [Svix Webhook Signatures](https://docs.svix.com/receiving/verifying-payloads/how)
- [Growth Data Plane Schema](./GDP-001-SUPABASE-SCHEMA-SETUP.md)
