# Segment Engine Guide (GDP-004)

## Overview

The Segment Engine is a real-time user segmentation system that integrates with the Growth Data Plane to enable dynamic user segmentation, membership tracking, and automated actions based on segment entry/exit.

## Features

- **Rules-based Segmentation**: Define segments using event-based, property-based, or cohort-based rules
- **Real-time Evaluation**: Evaluate segment membership in real-time or batch
- **Membership Lifecycle**: Track user segment participation with entry/exit timestamps
- **Event-Driven Architecture**: Subscribe to segment entry/exit events
- **Automations**: Trigger actions (webhooks, emails, tags, syncs) when users enter/exit segments
- **Pre-built Templates**: Power Users, Churn Risk, Trial to Paid, and more

## Quick Start

### Creating Segments

```typescript
import { getGrowthDataPlane } from '@/data/segment-integration';

const gdp = getGrowthDataPlane();

// Create a custom segment
const powerUsers = gdp.createSegment(
  'Power Users',
  [
    {
      condition: 'event',
      eventType: 'video_rendered',
      eventCount: { gte: 10 },
      eventWindow: '30d',
    },
    {
      condition: 'property',
      property: 'status',
      operator: 'equals',
      value: 'paid',
    },
  ],
  'Users with 10+ videos in last 30 days and active subscription'
);
```

### Using Templates

```typescript
// Power Users
const powerUsers = gdp.createSegmentFromTemplate(
  'Power Users',
  SegmentTemplates.powerUsers(10, '30d')
);

// Churn Risk
const churnRisk = gdp.createSegmentFromTemplate(
  'Churn Risk',
  SegmentTemplates.churnRisk(30),
  'Users inactive for 30+ days'
);

// Trial to Paid
const converters = gdp.createSegmentFromTemplate(
  'Trial to Paid',
  SegmentTemplates.trialToPaidConverters('7d')
);

// Free Trial Users
const trialUsers = gdp.createSegmentFromTemplate(
  'Trial Users',
  SegmentTemplates.freeTrialUsers()
);

// High LTV Users
const highLTV = gdp.createSegmentFromTemplate(
  'High LTV',
  SegmentTemplates.highLtvUsers(500)
);
```

## Rules

### Event-Based Rules

Count events in a time window:

```typescript
{
  condition: 'event',
  eventType: 'video_rendered',
  eventCount: { gte: 10, lte: 50 },
  eventWindow: '30d',  // '24h', '7d', '30d', '90d', '180d', '1y'
}
```

### Property-Based Rules

Match person properties:

```typescript
{
  condition: 'property',
  property: 'status',           // or 'email', 'lastActionDate', etc.
  operator: 'equals',            // 'equals', 'contains', 'gte', 'lte', 'gt', 'lt', 'in', 'between'
  value: 'paid',
}
```

### Cohort-Based Rules

Reference other segments:

```typescript
{
  condition: 'cohort',
  cohortId: 'some_segment_id',
}
```

## Membership Management

```typescript
const segment = gdp.getSegment('segment_id');

// Check membership
const isMember = await gdp.isInSegment('person_id', segment.segmentId);

// Get person's segments
const segments = gdp.getPersonSegments('person_id');

// Get segment members
const members = gdp.getSegmentMembers(segment.segmentId);

// Evaluate all segments for a person
await gdp.evaluatePersonSegments('person_id');

// Batch evaluate all people
await gdp.evaluateAllPersonSegments(100); // batch size
```

## Automations

Trigger actions when users enter/exit segments:

```typescript
// Send welcome email
gdp.createAutomation({
  segmentId: segment.segmentId,
  trigger: 'enter',
  action: 'email',
  actionConfig: {
    email: {
      templateId: 'welcome',
      delayMinutes: 5,
    },
  },
  isActive: true,
});

// Send churn prevention webhook
gdp.createAutomation({
  segmentId: churnRiskSegment.segmentId,
  trigger: 'enter',
  action: 'webhook',
  actionConfig: {
    webhook: {
      url: 'https://example.com/churn-risk',
      method: 'POST',
      payload: {
        action: 'send_retention_offer',
      },
    },
  },
  isActive: true,
});

// Tag high LTV users
gdp.createAutomation({
  segmentId: highLtvSegment.segmentId,
  trigger: 'enter',
  action: 'tag',
  actionConfig: {
    tag: {
      tagName: 'vip_customer',
      tagValue: 'true',
    },
  },
  isActive: true,
});
```

## Event Subscriptions

Listen for segment entry/exit:

```typescript
// Subscribe to segment entry
gdp.onSegmentEnter(powerUsersSegment.segmentId, (personId) => {
  console.log(`${personId} entered Power Users segment`);
  // Send offer, upgrade prompt, etc.
});

// Subscribe to segment exit
gdp.onSegmentExit(trialSegment.segmentId, (personId) => {
  console.log(`${personId} exited Trial segment (converted to paid)`);
  // Send congratulations message
});
```

## Analytics

```typescript
// Get segment statistics
const stats = gdp.getSegmentStats(segment.segmentId);
// { segmentId, name, totalMembers, activeMembers, inactiveMembers }

// Get all segment statistics
const allStats = gdp.getAllSegmentStats();

// Get member count
const count = gdp.getSegmentMemberCount(segment.segmentId);

// Get segment overlap (users in multiple segments)
const overlap = gdp.getSegmentOverlap(['segment1', 'segment2']);
// { count, percentage, personIds }
```

## Integration with Growth Data Plane

The Segment Engine automatically integrates with:

- **People Events**: Evaluates events in person's history
- **Subscriptions**: Checks subscription status and history
- **Person Properties**: Evaluates status, spend, cohorts, etc.

Example workflow:

```typescript
// 1. Create person
const person = await gdp.getGDP().createPerson({
  email: 'user@example.com',
  status: 'active',
});

// 2. Record events
const event = new EventBuilder(person.personId, 'video_rendered')
  .withCategory('core_value')
  .build();
await gdp.getGDP().createEvent(event);

// 3. Evaluate segments
await gdp.evaluatePersonSegments(person.personId);

// 4. Check membership
const isActive = await gdp.isInSegment(person.personId, activeUsersSegment.segmentId);
```

## Common Use Cases

### Onboarding Flow

```typescript
// Create trial segment
const trials = gdp.createSegmentFromTemplate(
  'Trial Users',
  SegmentTemplates.freeTrialUsers()
);

// Send welcome email on trial signup
gdp.createAutomation({
  segmentId: trials.segmentId,
  trigger: 'enter',
  action: 'email',
  actionConfig: {
    email: { templateId: 'welcome_trial' },
  },
  isActive: true,
});

// Monitor conversion
gdp.onSegmentExit(trials.segmentId, async (personId) => {
  console.log('User converted to paid:', personId);
});
```

### Churn Prevention

```typescript
const churnRisk = gdp.createSegmentFromTemplate(
  'Churn Risk',
  SegmentTemplates.churnRisk(30)
);

// Send re-engagement offer
gdp.createAutomation({
  segmentId: churnRisk.segmentId,
  trigger: 'enter',
  action: 'email',
  actionConfig: {
    email: {
      templateId: 'come_back_offer',
      delayMinutes: 60,
    },
  },
  isActive: true,
});

// Track response
gdp.onSegmentExit(churnRisk.segmentId, (personId) => {
  // User re-engaged! Log this in analytics
});
```

### VIP Tier Management

```typescript
const vip = gdp.createSegmentFromTemplate(
  'VIP Customers',
  SegmentTemplates.highLtvUsers(5000)
);

// Add VIP tag in CRM
gdp.createAutomation({
  segmentId: vip.segmentId,
  trigger: 'enter',
  action: 'sync',
  actionConfig: {
    sync: {
      destinationId: 'crm_customer_base',
      destinationType: 'crm',
    },
  },
  isActive: true,
});

// Grant premium support
gdp.createAutomation({
  segmentId: vip.segmentId,
  trigger: 'enter',
  action: 'webhook',
  actionConfig: {
    webhook: {
      url: 'https://support.example.com/grant-vip',
      payload: { tier: 'platinum' },
    },
  },
  isActive: true,
});
```

## Performance Considerations

### Batch Evaluation

For large user bases, batch evaluate segments periodically:

```typescript
// Evaluate all segments every 6 hours
setInterval(async () => {
  console.log('Evaluating all user segments...');
  const count = await gdp.evaluateAllPersonSegments(500); // batch of 500
  console.log(`Evaluated ${count} users`);
}, 6 * 60 * 60 * 1000);
```

### Caching

- Membership queries are cached (check in-memory first)
- Segment definitions are immutable once created
- Consider caching evaluation results for high-volume operations

### Indexing (Production)

When migrating to database:

```sql
-- Create indexes for fast segment queries
CREATE INDEX idx_memberships_person ON segment_memberships(person_id);
CREATE INDEX idx_memberships_segment ON segment_memberships(segment_id);
CREATE INDEX idx_memberships_active ON segment_memberships(is_active);
CREATE INDEX idx_events_person_timestamp ON unified_events(person_id, timestamp);
CREATE INDEX idx_events_type_timestamp ON unified_events(event_type, timestamp);
```

## API Reference

### GrowthDataPlaneWithSegments

```typescript
// Segment Management
createSegment(name, rules, description?, metadata?): SegmentDefinition
getSegment(segmentId): SegmentDefinition | null
listSegments(): SegmentDefinition[]
deleteSegment(segmentId): void

// Membership
isInSegment(personId, segmentId): Promise<boolean>
getPersonSegments(personId): Array<{segmentId, name, status}>
getSegmentMembers(segmentId): Array<{personId, enteredAt}>
evaluatePersonSegments(personId): Promise<void>
evaluateAllPersonSegments(batchSize?): Promise<number>

// Automations
createAutomation(automation): SegmentAutomation
onSegmentEnter(segmentId, callback): void
onSegmentExit(segmentId, callback): void

// Analytics
getSegmentStats(segmentId): SegmentStats | null
getAllSegmentStats(): SegmentStats[]
getSegmentMemberCount(segmentId): number
getSegmentOverlap(segmentIds): {count, percentage, personIds}
```

## Testing

The implementation includes comprehensive test coverage in `__tests__/segment-engine.test.ts`:

```bash
npm test -- segment-engine.test.ts
```

Tests cover:
- Segment CRUD operations
- Rule evaluation (event, property, cohort)
- Membership management
- Automation creation and triggering
- Integration with Growth Data Plane
- Statistics and analytics
