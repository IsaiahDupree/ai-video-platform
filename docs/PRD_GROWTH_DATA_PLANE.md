# Growth Data Plane PRD

**Version:** 1.0
**Last Updated:** January 30, 2026
**Status:** In Development

---

## Overview

The Growth Data Plane is the centralized analytics foundation for Remotion VideoStudio, providing:

1. **Unified event schema** - Normalized events from all sources
2. **Person records** - Core user/account information
3. **Subscriptions & billing** - Revenue and lifecycle tracking
4. **Identity resolution** - Link cross-platform identities (email, Stripe, Google, etc.)
5. **Segment engine** - Real-time user segmentation and automation
6. **Funnel analytics** - Conversion measurement and optimization

---

## Goals

1. **Single source of truth** for user data and analytics
2. **Enable data-driven decisions** - Segmentation, personalization, automation
3. **Revenue optimization** - Subscription tracking and LTV analysis
4. **Integration hub** - Centralize data from Stripe, Meta Pixel, tracking events
5. **Privacy-first** - GDPR/CCPA compliance by design

---

## Data Model

### Person

Core user/account record with lifecycle metrics:

```typescript
interface Person {
  personId: string;              // UUID
  createdAt: Date;
  updatedAt: Date;

  // Profile
  email?: string;
  name?: string;
  company?: string;
  industry?: string;

  // Lifecycle
  status: 'active' | 'inactive' | 'churned' | 'trial' | 'paid';
  signupDate?: Date;
  firstActionDate?: Date;
  lastActionDate?: Date;

  // Segmentation
  segment?: string;
  cohort?: string;
  source?: string;               // utm_source
  campaign?: string;             // utm_campaign
  medium?: string;               // utm_medium

  // Metrics
  totalEvents: number;
  totalSpent: number;
  lastEventAt?: Date;

  // Metadata
  metadata?: Record<string, any>;
}
```

### IdentityLink

Maps external identifiers to person records for cross-platform tracking:

```typescript
interface IdentityLink {
  linkId: string;
  personId: string;
  idType: 'email' | 'stripe_id' | 'google_id' | 'github_id' | 'custom';
  idValue: string;
  createdAt: Date;
  isPrimary: boolean;
}
```

### UnifiedEvent

Normalized event from any source (app, Stripe, Meta Pixel, etc.):

```typescript
interface UnifiedEvent {
  eventId: string;               // UUID for deduplication
  personId: string;
  timestamp: Date;

  // Classification
  eventType: string;             // 'video_rendered', 'purchase_completed'
  category: 'acquisition' | 'activation' | 'core_value' | 'monetization' | 'retention' | 'referral';

  // Details
  properties: Record<string, any>;

  // Source tracking
  source: 'app' | 'stripe' | 'meta_pixel' | 'segment' | 'custom';
  sourceId?: string;             // Original ID in source system

  // Session
  sessionId?: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;

  // Attribution
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;

  // Metadata
  metadata?: Record<string, any>;
}
```

### Subscription

Billing and account lifecycle (Stripe integration):

```typescript
interface Subscription {
  subscriptionId: string;        // UUID
  personId: string;
  stripeSubscriptionId?: string;

  // Plan info
  planId: string;
  planName: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'annual';

  // Dates
  startDate: Date;
  renewalDate?: Date;
  cancelledAt?: Date;
  refundedAt?: Date;

  // Status
  status: 'active' | 'past_due' | 'cancelled' | 'refunded' | 'paused';

  // Metrics
  totalRevenue: number;
  mrr: number;                   // Monthly Recurring Revenue
  arr: number;                   // Annual Recurring Revenue

  // Metadata
  metadata?: Record<string, any>;
}
```

---

## Implementation Status

### ✅ Completed (GDP-001, GDP-002)

**GDP-001: Growth Data Plane Schema**
- Person, IdentityLink, UnifiedEvent, Subscription models
- Zod validation schemas
- Location: `src/data/growth-data-plane.ts`
- EventBuilder fluent API for type-safe event creation

**GDP-002: Unified Events Table**
- UnifiedEvent normalized event format
- Support for all event sources (app, Stripe, Meta Pixel)
- Analytics query methods (getFunnel, getCohortAnalysis, getSegment)
- In-memory storage for development
- EventBuilder pattern for clean API

### ❌ Not Yet Implemented (GDP-003, GDP-004)

**GDP-003: Stripe Webhook Integration**
- Handle Stripe subscription events (created, updated, deleted, payment)
- Sync subscription status to database
- Update Person metrics when subscriptions change
- Webhook signature verification (HMAC)
- Retry failed webhook processing

**GDP-004: Segment Engine**
- Define segment conditions (rules-based or SQL-like)
- Evaluate segment membership in real-time
- Trigger automations on segment entry/exit
- Support dynamic attribute-based segmentation
- Query builder for non-technical users

---

## Stripe Webhook Integration (GDP-003)

### Events to Handle

```
customer.subscription.created → Create Subscription record
customer.subscription.updated → Update Subscription (price change, pause, etc.)
customer.subscription.deleted → Mark Subscription as cancelled
invoice.payment_succeeded → Update totalRevenue, mrr, arr
invoice.payment_failed → Mark Subscription as past_due
```

### Webhook Endpoint

```
POST /api/webhooks/stripe
X-Stripe-Signature: <signature>
```

### Implementation

```typescript
// src/api/stripe-webhooks.ts
import Stripe from 'stripe';

export async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'customer.subscription.created':
      return handleSubscriptionCreated(event.data.object);

    case 'customer.subscription.updated':
      return handleSubscriptionUpdated(event.data.object);

    case 'customer.subscription.deleted':
      return handleSubscriptionDeleted(event.data.object);

    case 'invoice.payment_succeeded':
      return handlePaymentSucceeded(event.data.object);

    case 'invoice.payment_failed':
      return handlePaymentFailed(event.data.object);
  }
}

async function handleSubscriptionCreated(sub: Stripe.Subscription) {
  // 1. Find or create Person by Stripe customer ID
  // 2. Create Subscription record
  // 3. Record UnifiedEvent (event source: 'stripe')
  // 4. Update Person.status to 'trial' or 'paid'
  // 5. Record 'purchase_completed' event
}
```

### Data Flow

```
Stripe Event
  ↓
Webhook Endpoint (verify signature)
  ↓
Handler (transform to Subscription record)
  ↓
Database Update
  ↓
UnifiedEvent creation
  ↓
Person metrics update
  ↓
Segment evaluation (if applicable)
```

---

## Segment Engine (GDP-004)

### Segment Definition

Define user segments with rules-based conditions:

```typescript
interface SegmentDefinition {
  segmentId: string;
  name: string;
  description?: string;
  rules: SegmentRule[];
  createdAt: Date;
  updatedAt: Date;
}

interface SegmentRule {
  condition: 'event' | 'property' | 'cohort';

  // Event-based
  eventType?: string;
  eventCount?: { gte?: number; lte?: number };
  eventWindow?: '24h' | '7d' | '30d' | '90d';

  // Property-based
  property?: string;
  operator?: 'equals' | 'contains' | 'gte' | 'lte' | 'in';
  value?: any;

  // Cohort-based
  cohortId?: string;
}
```

### Example Segments

**Power Users**
```typescript
{
  name: 'Power Users',
  rules: [
    { condition: 'event', eventType: 'video_rendered', eventCount: { gte: 10 }, eventWindow: '30d' },
    { condition: 'event', eventType: 'batch_render_completed', eventCount: { gte: 1 }, eventWindow: '30d' }
  ]
}
```

**Churn Risk**
```typescript
{
  name: 'Churn Risk (30 days inactive)',
  rules: [
    { condition: 'property', property: 'lastActionDate', operator: 'lte', value: 'now - 30d' },
    { condition: 'property', property: 'status', operator: 'equals', value: 'active' }
  ]
}
```

**Trial to Paid**
```typescript
{
  name: 'Trial to Paid Converters',
  rules: [
    { condition: 'property', property: 'status', operator: 'equals', value: 'paid' },
    { condition: 'event', eventType: 'purchase_completed', eventWindow: '7d' }
  ]
}
```

### Segment Evaluation

Real-time segment membership tracking:

```typescript
interface SegmentMembership {
  membershipId: string;
  personId: string;
  segmentId: string;
  enteredAt: Date;
  exitedAt?: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}
```

### Automation Triggers

Trigger actions when user enters/exits segment:

```typescript
interface SegmentAutomation {
  automationId: string;
  segmentId: string;
  trigger: 'enter' | 'exit';
  action: 'email' | 'webhook' | 'tag' | 'sync';
  actionConfig: {
    email?: { templateId: string };
    webhook?: { url: string; payload: Record<string, any> };
    tag?: { tagName: string };
    sync?: { destinationId: string };
  };
}
```

### API Usage

```typescript
// Create segment
const segment = await createSegment({
  name: 'Power Users',
  rules: [
    { eventType: 'video_rendered', eventCount: { gte: 10 }, eventWindow: '30d' }
  ]
});

// Evaluate membership
const isMember = await isInSegment(personId, 'power_users');

// Get all members
const members = await getSegmentMembers('power_users');

// Subscribe to changes
on('segment:enter:power_users', (personId) => {
  // Send special offer, upgrade prompt, etc.
});
```

---

## Analytics Queries

### Funnel Analysis

Track conversion through stages:

```typescript
const funnel = await analyzeF unnel({
  stages: ['signup_completed', 'first_video_created', 'purchase_completed'],
  timeWindow: '90d',
  breakdownBy: 'utmSource'
});

// Result:
// {
//   stages: [
//     { name: 'signup_completed', count: 1000 },
//     { name: 'first_video_created', count: 350 },
//     { name: 'purchase_completed', count: 85 }
//   ],
//   conversionRate: 0.085,
//   dropoffStage: 1,
//   bySource: { organic: {...}, paid: {...} }
// }
```

### Cohort Analysis

Measure retention and LTV by cohort:

```typescript
const cohorts = await getCohortAnalysis({
  groupBy: 'signupDate',
  interval: 'week',
  metrics: ['retention_d7', 'retention_d30', 'ltv', 'arr']
});

// Result:
// [
//   { cohort: '2026-01-01', size: 150, retention_d7: 0.82, retention_d30: 0.65, ltv: 450 },
//   { cohort: '2026-01-08', size: 180, retention_d7: 0.79, retention_d30: 0.61, ltv: 420 },
//   ...
// ]
```

### Churn Analysis

Identify churn patterns and early warning signals:

```typescript
const churned = await getChurnedUsers({
  window: '30d',
  minActivityBefore: '60d'
});

const churnFactors = await analyzeChurnFactors(churned);
// Result: { primaryReason: 'low_usage', secondaryFactor: 'high_cost' }
```

### Segment Overlap

Find users in multiple segments:

```typescript
const overlap = await getSegmentOverlap(['power_users', 'paying_customers']);
// Result: { count: 250, percentage: 0.15 }
```

---

## Data Storage

### Development

In-memory store (for quick iteration):
- `src/data/growth-data-plane.ts`
- All data stored in process memory
- Reset on server restart

### Production

Migrate to database (PostgreSQL, MongoDB, etc.):
- Persistent storage
- Query optimization (indexes on personId, eventType)
- Partitioning by timestamp for analytics queries

---

## Integration Points

### 1. Event Tracking System

Events flow from tracker → UnifiedEvent → analytics queries

```
tracker.track('video_rendered', {...})
  → UnifiedEvent created
  → Person metrics updated
  → Segment evaluation triggered
```

### 2. Stripe

Subscription events → Subscription records → Person metrics

```
Stripe webhook
  → Subscription created/updated
  → Person status changed
  → Revenue metrics updated
  → Segment evaluation triggered
```

### 3. Meta Pixel

CAPI events synchronized to UnifiedEvent for analytics

### 4. Automations

Segment membership changes → Trigger workflows

```
User enters 'churn_risk' segment
  → Send re-engagement email
  → Record 'retention_email_sent' event
  → Monitor if user re-activates
```

---

## Monitoring & Debugging

### Data Quality Checks

- Event validation (required fields, type matching)
- Person record completeness
- Subscription-to-Person mapping
- Duplicate detection

### Analytics Validation

```typescript
// Validate funnel adds up
const totalSignups = funnel.stages[0].count;
const totalPurchases = funnel.stages[funnel.stages.length - 1].count;
console.assert(totalPurchases <= totalSignups, 'Funnel error');
```

### Debug Mode

```typescript
// Log all segment evaluations
process.env.DEBUG_SEGMENTS = 'true';

// Log all events
process.env.DEBUG_EVENTS = 'true';
```

---

## Performance

### Query Optimization

- **Index on**: personId, eventType, timestamp
- **Partition by**: timestamp (monthly)
- **Aggregate tables**: Daily aggregates for faster funnel queries

### Caching

- Cache segment membership (5-min TTL)
- Cache cohort analysis results (hourly)
- Real-time event updates (no cache)

---

## Privacy & Compliance

- **GDPR**: Delete Person and all related events on request
- **CCPA**: Right to know, right to delete
- **Data retention**: Configurable per segment (default: 24 months)
- **PII handling**: Hash sensitive fields if stored

---

## Future Enhancements

- Machine learning for churn prediction
- Predictive LTV scoring
- Multi-touch attribution
- Behavioral clustering
- Experimentation framework (A/B testing)
