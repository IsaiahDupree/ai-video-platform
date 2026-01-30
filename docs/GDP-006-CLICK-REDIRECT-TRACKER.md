# GDP-006: Click Redirect Tracker

**Feature:** Attribution spine for email → click → conversion
**Category:** Growth Data Plane
**Priority:** P1
**Status:** ✅ Complete

## Overview

The Click Redirect Tracker creates an attribution spine that connects email campaign clicks to subsequent conversions. Every email link click generates a unique click token that follows the user through conversion, enabling sophisticated multi-touch attribution.

## Architecture

### Core Components

```
Email Campaign
     ↓
Email Delivered (event_table)
     ↓
User Clicks Link → Click Token Generated (click_tokens)
     ↓
Redirect to Destination
     ↓
User Converts → Attribution Recorded (conversion_attributions)
```

### Tables

**click_tokens:**
- Stores every email link click
- Tracks click source, UTM parameters, device info
- Records time-to-conversion
- Expires after attribution window (default 72 hours)

**conversion_attributions:**
- Links conversions back to email clicks
- Stores attribution model and credit
- Enables multi-touch attribution analysis

## API Routes

### GET `/api/redirect/click`

Processes email link clicks and redirects to destination.

**Query Parameters:**
- `ct` (required): Click token ID
- `url` (required): Destination URL
- `personalizedUrl` (optional): Custom redirect destination

**Example:**
```
GET /api/redirect/click?ct=ct_1234567890_abc123&url=https://example.com/page&personalizedUrl=https://example.com/page?user=123
```

**Response:** HTTP 302 redirect to destination

### POST `/api/redirect/click`

Programmatically create and process click redirects.

**Request Body:**
```json
{
  "clickTokenId": "ct_1234567890_abc123",
  "destinationUrl": "https://example.com/page",
  "personalizedUrl": "https://example.com/page?user=123"
}
```

**Response:**
```json
{
  "success": true,
  "redirectUrl": "https://example.com/page?user=123",
  "clickTokenId": "ct_1234567890_abc123"
}
```

## Service Methods

### `createClickToken(personId, campaignId, emailEventId, originalUrl, options)`

Generates a unique click token for an email link.

```typescript
const clickToken = await createClickToken(
  'person-123',
  'campaign-summer-sale',
  'email-event-456',
  'https://example.com/landing',
  {
    utmParameters: {
      utm_source: 'email',
      utm_medium: 'newsletter',
      utm_campaign: 'summer-sale',
    },
    deviceType: 'mobile',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    sessionId: 'session-789',
  }
);
```

**Returns:**
- `ClickToken` object with unique `clickTokenId`
- Expires after attribution window

### `recordClickAndRedirect(clickTokenId, destinationUrl, personalizedUrl)`

Records a click event and returns the redirect URL.

```typescript
const redirectUrl = await recordClickAndRedirect(
  'ct_1234567890_abc123',
  'https://example.com/page',
  'https://example.com/page?user=123'
);

// Returns: 'https://example.com/page?user=123'
```

### `attributeConversion(conversionEventId, conversionEventName, personId, clickTokenId, options)`

Links a conversion event to a previous email click.

```typescript
const attribution = await attributeConversion(
  'conv-123',
  'purchase_completed',
  'person-123',
  'ct_1234567890_abc123',
  {
    conversionValue: 99.99,
    currency: 'USD',
    attributionModel: 'last-click',
  }
);
```

**Attribution Models:**
- `first-click`: Full credit to first touchpoint
- `last-click`: Full credit to last touchpoint (default)
- `linear`: Equal credit to all touchpoints
- `time-decay`: Recent touchpoints get more credit

### `getCampaignClickStats(campaignId, daysBack)`

Get click and conversion statistics for a campaign.

```typescript
const stats = await getCampaignClickStats('campaign-001', 30);

// Returns:
{
  campaignId: 'campaign-001',
  totalClicks: 1524,
  uniqueClickers: 892,
  clickedLinks: [
    {
      linkUrl: 'https://example.com/page',
      clicks: 750,
      uniqueClickers: 425,
      conversionRate: 0.18,
      attributedRevenue: 12500.00,
    },
    // ... more links
  ],
  conversionsByLink: { /* ... */ },
  revenueByLink: { /* ... */ },
}
```

### `getMultiTouchAttribution(conversionEventId, personId)`

Get detailed multi-touch attribution for a conversion.

```typescript
const mtAttribution = await getMultiTouchAttribution(
  'conv-123',
  'person-123'
);

// Returns touchpoints with calculated credit
{
  conversionEventId: 'conv-123',
  conversionEventName: 'purchase_completed',
  conversionValue: 99.99,
  personId: 'person-123',
  touchpoints: [
    {
      type: 'email_delivered',
      timestamp: '2026-01-20T10:00:00Z',
      eventId: 'evt-1',
      credit: 0.2,
    },
    {
      type: 'email_opened',
      timestamp: '2026-01-20T11:00:00Z',
      eventId: 'evt-2',
      credit: 0.3,
    },
    {
      type: 'email_clicked',
      timestamp: '2026-01-20T11:30:00Z',
      eventId: 'evt-3',
      credit: 0.5,
    },
  ],
  totalCredit: 1.0,
  topChannel: 'email_clicked',
  topCampaign: 'summer-sale',
}
```

## Usage Examples

### Example 1: Generate Email Click Links

When sending emails, generate click tokens and include in links:

```typescript
// In your email sending code
const campaign = await getCampaignData(campaignId);

for (const recipient of campaign.recipients) {
  const clickToken = await createClickToken(
    recipient.personId,
    campaign.id,
    emailEvent.id,
    campaign.destinationUrl,
    {
      utmParameters: campaign.utm,
      deviceType: 'unknown',
    }
  );

  const trackingLink = `https://app.example.com/api/redirect/click?ct=${clickToken.clickTokenId}&url=${encodeURIComponent(campaign.destinationUrl)}`;

  // Include trackingLink in email HTML
  emailContent = emailContent.replace('[CLICK_LINK]', trackingLink);
}
```

### Example 2: Track Conversion Attribution

When a conversion occurs, attribute it to the user's recent email clicks:

```typescript
// In your conversion tracking handler
const conversionEvent = {
  eventId: 'conv-' + Date.now(),
  eventName: 'purchase_completed',
  personId: user.id,
  value: purchaseAmount,
};

// Attribution will automatically find the user's recent click token
const attribution = await attributeConversion(
  conversionEvent.eventId,
  conversionEvent.eventName,
  conversionEvent.personId,
  undefined, // Will auto-find recent click token
  {
    conversionValue: conversionEvent.value,
    currency: 'USD',
  }
);

if (attribution) {
  console.log(`Purchase attributed to email campaign: ${attribution.emailCampaignId}`);
}
```

### Example 3: Campaign Performance Analysis

Analyze how email campaigns drive conversions:

```typescript
const campaigns = await getAllEmailCampaigns();

for (const campaign of campaigns) {
  const stats = await getCampaignClickStats(campaign.id, 30);

  console.log(`Campaign: ${campaign.name}`);
  console.log(`  Clicks: ${stats.totalClicks}`);
  console.log(`  Conversions: ${Object.values(stats.conversionsByLink).reduce((a, b) => a + b, 0)}`);
  console.log(`  Revenue: $${Object.values(stats.revenueByLink).reduce((a, b) => a + b, 0)}`);

  for (const link of stats.clickedLinks) {
    console.log(`  ${link.linkUrl}: ${link.conversions} conversions, $${link.attributedRevenue}`);
  }
}
```

## Features

✅ **Unique Click Tokens** - Each click gets a unique identifier for accurate tracking
✅ **UTM Parameter Capture** - Automatically captures and stores UTM parameters
✅ **Device Tracking** - Records device type, IP address, user agent
✅ **Attribution Windows** - Configurable time window for attributing conversions (default 72 hours)
✅ **Multi-Touch Attribution** - Time-decay model for multi-touch analysis
✅ **Campaign Analytics** - Get detailed click and conversion stats by campaign
✅ **Revenue Attribution** - Track revenue generated from email clicks
✅ **Automatic Cleanup** - Expired click tokens are automatically cleaned up

## Configuration

### Attribution Window

Default: 72 hours (3 days)

```typescript
const DEFAULT_ATTRIBUTION_WINDOW = {
  clickAttribution: 72, // Hours
  viewAttribution: 24,  // Hours
};
```

To customize, modify constants in `clickRedirect.ts`

## Testing

Run the test script:

```bash
npx tsx scripts/test-click-redirect.ts
```

Tests:
- ✅ Creating click tokens
- ✅ Recording clicks and redirects
- ✅ Attributing conversions
- ✅ Retrieving campaign statistics

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_KEY=xxxxx
```

## Related Features

- **GDP-005**: Email Event Tracking - Tracks email delivery, opens, clicks
- **GDP-007**: Stripe Webhook Integration - Captures conversion events
- **GDP-008**: Subscription Snapshot - Stores revenue data
- **META-004**: CAPI Server-Side Events - Server-side conversion tracking

## Next Steps

1. **GDP-007**: Stripe Webhook Integration
   - Handle subscription purchase events
   - Store revenue attribution

2. **GDP-008**: Subscription Snapshot
   - Track MRR and subscription status
   - Calculate LTV from email-attributed customers

3. **Analytics Dashboard**
   - Real-time email campaign ROI
   - Attribution modeling comparisons
   - Revenue by campaign
