# GDP-005: Email Event Tracking

**Status:** ✅ Complete
**Category:** Growth Data Plane
**Priority:** P0

## Overview

Email engagement analytics and metrics for tracking email performance. Provides comprehensive analytics on email opens, clicks, bounces, and attribution to downstream conversions.

Built on top of GDP-004 (Resend Webhook), this feature provides actionable insights into email campaign performance and individual user engagement.

## Features

### Person-Level Email Metrics

Track email engagement for individual users:
- Total delivered, opened, clicked emails
- Unique emails opened/clicked
- Open rate, click rate, click-to-open rate
- Most clicked links
- Last engagement timestamps

### Campaign Performance Metrics

Analyze campaign effectiveness:
- Recipients, openers, clickers
- Open rate, click rate, click-to-open rate
- Bounce rate, complaint rate
- Top clicked links per campaign
- Campaign comparison

### Email Engagement Time Series

Track email metrics over time:
- Daily delivered, opened, clicked counts
- Trend analysis
- Performance comparisons

### Link Click Analytics

Understand which links drive engagement:
- Total clicks per link
- Unique clickers
- Link performance over time
- Campaign distribution

### Email Attribution

Connect email engagement to conversions:
- Click-to-conversion tracking
- Revenue attribution
- Time to convert
- Multi-touch attribution

### Email Health Metrics

Monitor email deliverability:
- Delivery rate
- Bounce rate
- Complaint rate
- Problematic domains

## Implementation

### Files Created

```
src/types/emailTracking.ts                    - TypeScript types for email metrics
src/services/emailTracking.ts                 - Email analytics service
scripts/test-email-tracking.ts                - Comprehensive test suite
scripts/verify-email-tracking.ts              - Quick verification script
docs/GDP-005-EMAIL-EVENT-TRACKING.md          - This documentation
```

## Usage

### Get Person Email Metrics

```typescript
import { getPersonEmailMetrics } from '@/services/emailTracking';

const metrics = await getPersonEmailMetrics(personId);

console.log(`Open Rate: ${metrics.open_rate}%`);
console.log(`Click Rate: ${metrics.click_rate}%`);
console.log(`Total Clicked: ${metrics.total_clicked}`);
console.log(`Most Clicked Links:`, metrics.most_clicked_links);
```

### Get Campaign Metrics

```typescript
import { getCampaignEmailMetrics } from '@/services/emailTracking';

const campaignMetrics = await getCampaignEmailMetrics('onboarding', 30);

console.log(`Campaign: ${campaignMetrics.campaign}`);
console.log(`Recipients: ${campaignMetrics.unique_recipients}`);
console.log(`Open Rate: ${campaignMetrics.open_rate}%`);
console.log(`Click Rate: ${campaignMetrics.click_rate}%`);
console.log(`Top Links:`, campaignMetrics.most_clicked_links);
```

### Get Email Engagement Time Series

```typescript
import { getEmailEngagementTimeSeries } from '@/services/emailTracking';

const timeSeries = await getEmailEngagementTimeSeries(30);

timeSeries.forEach((day) => {
  console.log(`${day.date}: ${day.opened} opens, ${day.clicked} clicks`);
});
```

### Get Email Link Clicks

```typescript
import { getEmailLinkClicks } from '@/services/emailTracking';

const linkClicks = await getEmailLinkClicks(30, 20);

linkClicks.forEach((link) => {
  console.log(`${link.link_url}: ${link.total_clicks} clicks (${link.unique_clickers} unique)`);
});
```

### Get Email Attribution

```typescript
import { getEmailAttribution } from '@/services/emailTracking';

const attributions = await getEmailAttribution('purchase_completed', 7);

attributions.forEach((attr) => {
  console.log(`${attr.email} clicked ${attr.clicked_link}`);
  console.log(`→ Converted to ${attr.conversion_event} after ${attr.time_to_convert_seconds}s`);
  console.log(`Revenue: $${(attr.revenue_cents || 0) / 100}`);
});
```

### Get Email Health Metrics

```typescript
import { getEmailHealthMetrics } from '@/services/emailTracking';

const health = await getEmailHealthMetrics(30);

console.log(`Delivery Rate: ${health.delivery_rate}%`);
console.log(`Bounce Rate: ${health.bounce_rate}%`);
console.log(`Complaint Rate: ${health.complaint_rate}%`);

if (health.domains_with_issues.length > 0) {
  console.log('Domains with issues:', health.domains_with_issues);
}
```

### Get All Campaigns

```typescript
import { getAllCampaigns } from '@/services/emailTracking';

const campaigns = await getAllCampaigns(90);

console.log('Active campaigns:', campaigns);
```

## API Reference

### `getPersonEmailMetrics(personId: string): Promise<PersonEmailMetrics>`

Returns email engagement metrics for a person.

**Returns:**
```typescript
{
  person_id: string;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_complained: number;
  unique_emails_opened: number;
  unique_emails_clicked: number;
  open_rate: number; // percentage
  click_rate: number; // percentage
  click_to_open_rate: number; // percentage
  last_email_opened_at: string | null;
  last_email_clicked_at: string | null;
  most_clicked_links: string[];
}
```

### `getCampaignEmailMetrics(campaign: string, daysBack?: number): Promise<CampaignEmailMetrics>`

Returns metrics for a specific email campaign.

**Parameters:**
- `campaign` - Campaign name (from email tags)
- `daysBack` - Number of days to look back (default: 30)

**Returns:**
```typescript
{
  campaign: string;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_complained: number;
  unique_recipients: number;
  unique_openers: number;
  unique_clickers: number;
  open_rate: number;
  click_rate: number;
  click_to_open_rate: number;
  bounce_rate: number;
  complaint_rate: number;
  most_clicked_links: Array<{ url: string; clicks: number }>;
}
```

### `getEmailEngagementTimeSeries(daysBack?: number): Promise<EmailEngagementTimeSeries[]>`

Returns daily email engagement metrics.

**Parameters:**
- `daysBack` - Number of days to look back (default: 30)

**Returns:**
```typescript
Array<{
  date: string; // YYYY-MM-DD
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
}>
```

### `getEmailLinkClicks(daysBack?: number, limit?: number): Promise<EmailLinkClick[]>`

Returns most clicked email links.

**Parameters:**
- `daysBack` - Number of days to look back (default: 30)
- `limit` - Max number of links to return (default: 20)

**Returns:**
```typescript
Array<{
  link_url: string;
  total_clicks: number;
  unique_clickers: number;
  first_clicked_at: string;
  last_clicked_at: string;
  campaigns: string[];
}>
```

### `getEmailAttribution(conversionEventName: string, attributionWindowDays?: number): Promise<EmailAttribution[]>`

Returns conversions attributed to email clicks.

**Parameters:**
- `conversionEventName` - Event name to track (e.g., 'purchase_completed')
- `attributionWindowDays` - Attribution window in days (default: 7)

**Returns:**
```typescript
Array<{
  person_id: string;
  email: string;
  email_id: string;
  email_subject: string;
  clicked_link: string;
  click_time: string;
  conversion_event: string;
  conversion_time: string;
  revenue_cents: number | null;
  time_to_convert_seconds: number;
}>
```

### `getEmailHealthMetrics(daysBack?: number): Promise<EmailHealthMetrics>`

Returns email deliverability and health metrics.

**Parameters:**
- `daysBack` - Number of days to look back (default: 30)

**Returns:**
```typescript
{
  total_sent: number;
  total_delivered: number;
  total_bounced: number;
  total_complained: number;
  delivery_rate: number;
  bounce_rate: number;
  complaint_rate: number;
  domains_with_issues: Array<{ domain: string; bounces: number; complaints: number }>;
}
```

### `getAllCampaigns(daysBack?: number): Promise<string[]>`

Returns list of all campaign names.

**Parameters:**
- `daysBack` - Number of days to look back (default: 90)

**Returns:**
- Array of campaign names

## Testing

### Run Test Suite

```bash
npx tsx scripts/test-email-tracking.ts
```

### Test Coverage

1. ✅ Person email metrics
2. ✅ Campaign metrics
3. ✅ Email engagement time series
4. ✅ Email link clicks
5. ✅ Email health metrics
6. ✅ Get all campaigns
7. ✅ Email attribution

### Verification

```bash
npx tsx scripts/verify-email-tracking.ts
```

## Analytics Use Cases

### Campaign Performance Dashboard

```typescript
const campaigns = await getAllCampaigns(30);

for (const campaign of campaigns) {
  const metrics = await getCampaignEmailMetrics(campaign, 30);
  console.log(`${campaign}:`);
  console.log(`  Recipients: ${metrics.unique_recipients}`);
  console.log(`  Open Rate: ${metrics.open_rate}%`);
  console.log(`  Click Rate: ${metrics.click_rate}%`);
  console.log(`  CTR: ${metrics.click_to_open_rate}%`);
}
```

### User Engagement Score

```typescript
const metrics = await getPersonEmailMetrics(personId);

// Simple engagement score
const engagementScore =
  (metrics.open_rate * 0.4) +
  (metrics.click_rate * 0.6);

if (engagementScore > 50) {
  console.log('Highly engaged user');
} else if (engagementScore > 20) {
  console.log('Moderately engaged user');
} else {
  console.log('Low engagement - consider re-engagement campaign');
}
```

### Email ROI Analysis

```typescript
const attributions = await getEmailAttribution('purchase_completed', 7);

const totalRevenue = attributions.reduce(
  (sum, attr) => sum + (attr.revenue_cents || 0),
  0
);

console.log(`Email-attributed revenue: $${totalRevenue / 100}`);
console.log(`Conversions: ${attributions.length}`);
console.log(`Avg. revenue per conversion: $${totalRevenue / attributions.length / 100}`);
```

### Link Performance Analysis

```typescript
const linkClicks = await getEmailLinkClicks(30, 20);

linkClicks.forEach((link) => {
  const ctr = (link.total_clicks / link.unique_clickers) * 100;
  console.log(`${link.link_url}:`);
  console.log(`  Total Clicks: ${link.total_clicks}`);
  console.log(`  Unique Clickers: ${link.unique_clickers}`);
  console.log(`  Clicks per User: ${ctr.toFixed(2)}%`);
  console.log(`  Campaigns: ${link.campaigns.join(', ')}`);
});
```

## Integration with Other Systems

### PostHog Integration

Track email engagement in PostHog for cohort analysis:

```typescript
import { posthog } from '@/services/tracking';

const metrics = await getPersonEmailMetrics(personId);

posthog.capture({
  distinctId: personId,
  event: 'email_engagement_computed',
  properties: {
    open_rate: metrics.open_rate,
    click_rate: metrics.click_rate,
    total_clicked: metrics.total_clicked,
  },
});
```

### Meta CAPI Integration

Send email engagement to Meta for better targeting:

```typescript
import { sendMetaEvent } from '@/services/metaCapi';

const attributions = await getEmailAttribution('purchase_completed', 7);

attributions.forEach((attr) => {
  sendMetaEvent({
    event_name: 'Purchase',
    event_source_url: attr.clicked_link,
    value: (attr.revenue_cents || 0) / 100,
    currency: 'USD',
    user_data: {
      email: attr.email,
    },
  });
});
```

## Performance Considerations

### Caching

For high-traffic dashboards, consider caching metrics:

```typescript
import { cache } from '@/utils/cache';

const getCachedCampaignMetrics = cache(
  getCampaignEmailMetrics,
  60 * 5 // 5 minute cache
);
```

### Batch Processing

For large-scale analytics, process in batches:

```typescript
const campaigns = await getAllCampaigns(90);
const batchSize = 10;

for (let i = 0; i < campaigns.length; i += batchSize) {
  const batch = campaigns.slice(i, i + batchSize);
  await Promise.all(
    batch.map((campaign) => getCampaignEmailMetrics(campaign, 30))
  );
}
```

## Next Steps

- **GDP-006:** Click Redirect Tracker - Attribution from email → click → conversion
- **GDP-007:** Stripe Webhook Integration - Track subscription events
- **Email Campaigns:** Build automated email campaigns based on engagement
- **Segmentation:** Create segments based on email engagement metrics

## References

- [GDP-001: Supabase Schema Setup](./GDP-001-SUPABASE-SCHEMA-SETUP.md)
- [GDP-004: Resend Webhook](./GDP-004-RESEND-WEBHOOK.md)
- [Email Deliverability Best Practices](https://resend.com/docs/knowledge-base/deliverability-best-practices)
