# GDP-012: Segment Engine

**Feature:** Audience segmentation and automation triggers
**Category:** Growth Data Plane
**Priority:** P1
**Status:** ✅ Complete

## Overview

The Segment Engine enables creating rule-based audience segments and triggering automations when users enter or exit segments. This provides sophisticated audience targeting and activation capabilities.

## Architecture

### Core Components

**Segment Definition**
- Rules-based audience targeting using a JSON DSL
- Support for AND/OR logic and multiple conditions
- Attributes: events, renders, active days, pricing views, email, country, etc.

**Segment Membership**
- Tracks which users are in which segments
- Records entry and exit timestamps
- Supports segment exit tracking for lifecycle marketing

**Automations**
- Triggered when users enter/exit segments
- Action types: email, event, webhook, update person
- Execution logging for compliance and debugging

## Rule DSL (Domain Specific Language)

### Condition Rule

Evaluate a single condition:

```typescript
const rule: ConditionRule = {
  type: 'condition',
  attribute: 'total_renders',
  operator: '>=',
  value: 5,
};
```

**Supported Attributes:**
- `total_events` - Total events count
- `active_days` - Number of distinct active days
- `total_renders` - Video render count
- `pricing_page_views` - Pricing page views
- `email` - Email address
- `country` - Country code
- `event` - Event-based condition
- `subscription_status` - Subscription status
- `custom_property` - Custom person property

**Operators:**
- `>`, `>=`, `<`, `<=`, `=`, `!=` - Numeric comparison
- `contains`, `starts_with` - String matching
- `in` - Array matching

### AND Rule

All conditions must match:

```typescript
const rule: AndRule = {
  type: 'and',
  conditions: [
    {
      type: 'condition',
      attribute: 'total_events',
      operator: '>=',
      value: 10,
    },
    {
      type: 'condition',
      attribute: 'country',
      operator: '=',
      value: 'US',
    },
  ],
};
```

### OR Rule

At least one condition must match:

```typescript
const rule: OrRule = {
  type: 'or',
  conditions: [
    {
      type: 'condition',
      attribute: 'total_renders',
      operator: '>=',
      value: 5,
    },
    {
      type: 'condition',
      attribute: 'pricing_page_views',
      operator: '>=',
      value: 1,
    },
  ],
};
```

### Event Rule

Check if user has specific event:

```typescript
const rule: EventConditionRule = {
  type: 'condition',
  attribute: 'event',
  operator: '>',
  event_name: 'pricing_view',
  event_type: 'monetization',
  days: 30, // Look back 30 days
  value: 0,
};
```

## Database Schema

### segment Table

Stores segment definitions:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Segment name (unique) |
| description | TEXT | Segment description |
| rule | JSONB | Segment rule DSL |
| is_active | BOOLEAN | Active status |
| created_by | TEXT | Creator identifier |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Update timestamp |

**Indexes:**
- `idx_segment_is_active` - For active segment queries
- `idx_segment_name` - For name lookups

### segment_membership Table

Tracks membership status:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| person_id | UUID | Person reference |
| segment_id | UUID | Segment reference |
| is_member | BOOLEAN | Current membership status |
| entered_at | TIMESTAMPTZ | When user entered |
| exited_at | TIMESTAMPTZ | When user exited (if applicable) |
| last_evaluated_at | TIMESTAMPTZ | Last evaluation time |
| created_at | TIMESTAMPTZ | Record created |
| updated_at | TIMESTAMPTZ | Record updated |

**Constraints:**
- `UNIQUE(person_id, segment_id)` - One membership per user per segment

### segment_automation Table

Defines actions to trigger:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| segment_id | UUID | Segment reference |
| name | TEXT | Automation name |
| description | TEXT | Automation description |
| trigger_type | TEXT | enter, exit, periodic |
| action | JSONB | Action configuration |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Update timestamp |

### automation_execution Table

Logs automation executions:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| automation_id | UUID | Automation reference |
| person_id | UUID | Person reference |
| status | TEXT | pending, sent, failed, skipped |
| error_message | TEXT | Error details if failed |
| trigger_event_id | UUID | Triggering event (optional) |
| executed_at | TIMESTAMPTZ | Execution time |
| created_at | TIMESTAMPTZ | Record created |
| updated_at | TIMESTAMPTZ | Record updated |

### segment_evaluation_cache Table

Caches evaluation results (1 hour TTL):

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| person_id | UUID | Person reference |
| segment_id | UUID | Segment reference |
| matches | BOOLEAN | Whether user matches segment |
| evaluated_at | TIMESTAMPTZ | Evaluation time |
| expires_at | TIMESTAMPTZ | Cache expiration |
| created_at | TIMESTAMPTZ | Record created |

## SQL Helper Functions

### evaluate_segment_rule

Evaluates a person against a segment rule:

```sql
SELECT evaluate_segment_rule(
  p_person_id := 'uuid...',
  p_rule := '{"type":"condition",...}'::jsonb
) AS matches;
```

Returns: `BOOLEAN`

### evaluate_person_segments

Evaluates person against all active segments and updates membership:

```sql
SELECT * FROM evaluate_person_segments('uuid...');
```

Returns: Table of (segment_id, matches)

## TypeScript Service API

### Segment Management

```typescript
import {
  createSegment,
  getSegment,
  listSegments,
  updateSegment,
  deleteSegment,
} from '@/services/segmentEngine';

// Create segment
const segment = await createSegment({
  name: 'High Engagers',
  description: 'Users with 5+ renders',
  rule: {
    type: 'condition',
    attribute: 'total_renders',
    operator: '>=',
    value: 5,
  },
});

// Get segment
const segment = await getSegment(segmentId);

// List segments
const segments = await listSegments(true); // true = active only

// Update segment
const updated = await updateSegment(segmentId, {
  description: 'New description',
});

// Delete segment
await deleteSegment(segmentId);
```

### Segment Evaluation

```typescript
import {
  evaluatePersonSegments,
  evaluateSegmentForPerson,
} from '@/services/segmentEngine';

// Evaluate person against all segments
const result = await evaluatePersonSegments(personId);
// Returns: { person_id, evaluations: [{ segment_id, matches, cached }] }

// Evaluate specific segment
const result = await evaluateSegmentForPerson(personId, segmentId);
// Returns: { segment_id, matches, cached }
```

### Segment Membership

```typescript
import {
  getSegmentMembers,
  getPersonSegments,
  getSegmentMembership,
} from '@/services/segmentEngine';

// Get all members of a segment
const members = await getSegmentMembers(segmentId);

// Get all segments a person is in
const segments = await getPersonSegments(personId);

// Get specific membership
const membership = await getSegmentMembership(personId, segmentId);
```

### Automations

```typescript
import {
  createAutomation,
  listAutomations,
  updateAutomation,
  deleteAutomation,
  triggerSegmentAutomations,
} from '@/services/segmentEngine';

// Create automation
const automation = await createAutomation({
  segment_id: segmentId,
  name: 'Welcome Email',
  trigger_type: 'enter',
  action: {
    type: 'email',
    template_id: 'welcome-001',
    subject: 'Welcome to our platform!',
  },
});

// List automations
const automations = await listAutomations(segmentId);

// Trigger automations (called automatically on segment membership change)
const executions = await triggerSegmentAutomations(
  personId,
  'enter',
  segmentId
);
```

## REST API

### Segments

```bash
# List segments
GET /api/segments?is_active=true

# Create segment
POST /api/segments
{
  "name": "High Engagers",
  "description": "Users with 5+ renders",
  "rule": { "type": "condition", ... }
}

# Get segment
GET /api/segments/:id?include=members,automations

# Update segment
PUT /api/segments/:id
{
  "description": "Updated description",
  "is_active": false
}

# Delete segment
DELETE /api/segments/:id
```

### Evaluations

```bash
# Evaluate person against all segments
POST /api/segments/evaluate
{
  "person_id": "uuid..."
}

# Evaluate specific segment
POST /api/segments/evaluate
{
  "person_id": "uuid...",
  "segment_id": "uuid..."
}
```

### Automations

```bash
# List automations
GET /api/segments/automations?segment_id=uuid&is_active=true

# Create automation
POST /api/segments/automations
{
  "segment_id": "uuid...",
  "name": "Welcome Email",
  "trigger_type": "enter",
  "action": { "type": "email", ... }
}
```

## Examples

### Example 1: Create High Engagers Segment

```typescript
import { createSegment, createAutomation } from '@/services/segmentEngine';

// Create segment for users with 5+ renders
const segment = await createSegment({
  name: 'High Engagers',
  description: 'Users who have rendered 5+ videos',
  rule: {
    type: 'condition',
    attribute: 'total_renders',
    operator: '>=',
    value: 5,
  },
});

// Create automation to send email when user enters segment
const automation = await createAutomation({
  segment_id: segment.id,
  name: 'High Engager Welcome',
  description: 'Send premium features offer',
  trigger_type: 'enter',
  action: {
    type: 'email',
    template_id: 'premium-offer',
    variables: {
      discount: '20%',
      trial_days: 7,
    },
  },
});
```

### Example 2: Active Users in US

```typescript
// Create AND segment
const segment = await createSegment({
  name: 'Active US Users',
  description: 'Active users in the US',
  rule: {
    type: 'and',
    conditions: [
      {
        type: 'condition',
        attribute: 'total_events',
        operator: '>=',
        value: 10,
      },
      {
        type: 'condition',
        attribute: 'country',
        operator: '=',
        value: 'US',
      },
    ],
  },
});
```

### Example 3: Pricing Page Viewers OR High Engagers

```typescript
// Create OR segment
const segment = await createSegment({
  name: 'Purchase Interested',
  description: 'Users interested in purchase (pricing view OR high engagement)',
  rule: {
    type: 'or',
    conditions: [
      {
        type: 'condition',
        attribute: 'pricing_page_views',
        operator: '>=',
        value: 1,
      },
      {
        type: 'condition',
        attribute: 'total_renders',
        operator: '>=',
        value: 10,
      },
    ],
  },
});
```

### Example 4: Event-Based Segmentation

```typescript
// Users who viewed pricing in last 7 days
const segment = await createSegment({
  name: 'Recent Pricing Viewers',
  description: 'Viewed pricing page in last 7 days',
  rule: {
    type: 'condition',
    attribute: 'event',
    operator: '>',
    event_name: 'pricing_view',
    days: 7,
    value: 0,
  },
});
```

## Integration with Other Features

### GDP-001: Supabase Schema

Segment engine uses the `person` and `event` tables for evaluation:

```typescript
// Segments evaluate against person features computed in GDP-001
const rule = {
  type: 'condition',
  attribute: 'total_renders', // From person.total_renders
  operator: '>=',
  value: 5,
};
```

### GDP-011: Person Features Computation

Segments automatically re-evaluate when person features update:

```typescript
// When events are created, trigger segment re-evaluation
CREATE TRIGGER segment_reevaluation_on_event
AFTER INSERT ON event
FOR EACH ROW
EXECUTE FUNCTION trigger_segment_reevaluation();
```

## Setup Instructions

### 1. Apply Migration

```bash
# Using Supabase CLI
supabase db push

# Or manually in SQL Editor:
# Copy contents of: supabase/migrations/20260130000002_create_segment_engine_tables.sql
```

### 2. Verify Installation

```bash
# Run test script
npx tsx scripts/test-segment-engine.ts
```

Expected output:
```
🧪 Testing Segment Engine (GDP-012)

✅ Create high engagers segment
✅ Fetch segment by ID
✅ Create active users segment
✅ List all segments
✅ Update segment
✅ Create segment automation
✅ List automations for segment
✅ Create automation execution
✅ Fetch automation executions
✅ Clear segment evaluation cache
✅ Delete segment
✅ Delete second segment

=========================================
Test Summary:
✅ Passed: 12
❌ Failed: 0
📊 Total: 12
=========================================

🎉 All tests passed!
```

## Performance Considerations

### Caching Strategy

Segment evaluations are cached for 1 hour:

```typescript
// Subsequent calls within 1 hour return cached result
const result1 = await evaluateSegmentForPerson(personId, segmentId); // DB query
const result2 = await evaluateSegmentForPerson(personId, segmentId); // Cached
```

Clear cache when needed:

```typescript
import { clearSegmentCache } from '@/services/segmentEngine';

// Clear cache for specific person
await clearSegmentCache(personId);

// Clear cache for specific segment
await clearSegmentCache(undefined, segmentId);

// Clear all cache
await clearSegmentCache();
```

### Batch Evaluation

For large-scale segment evaluation:

```typescript
import { evaluateAllPeopleForSegment } from '@/services/segmentEngine';

const result = await evaluateAllPeopleForSegment(segmentId, batchSize);
// { evaluated: 1000, error: 2 }
```

## Files

```
supabase/migrations/
└── 20260130000002_create_segment_engine_tables.sql

src/types/
└── segmentEngine.ts

src/services/
└── segmentEngine.ts

src/app/api/segments/
├── route.ts (GET /api/segments, POST /api/segments)
├── [id]/
│   └── route.ts (GET, PUT, DELETE /api/segments/:id)
├── automations/
│   └── route.ts (GET, POST /api/segments/automations)
└── evaluate/
    └── route.ts (POST /api/segments/evaluate)

scripts/
└── test-segment-engine.ts
```

## Summary

GDP-012 provides a complete segment engine for:

✅ **Rule-based segmentation** - AND/OR logic with multiple condition types
✅ **Membership tracking** - Entry/exit timestamps and status
✅ **Automations** - Actions triggered on segment changes
✅ **Performance** - Caching and batch operations
✅ **Integration** - Works with Growth Data Plane events and person features
✅ **REST API** - Full CRUD and evaluation endpoints
✅ **Type safety** - Complete TypeScript types and interfaces
✅ **Database functions** - SQL-level segment evaluation
✅ **Execution logging** - Track all automation triggers

This enables sophisticated audience targeting, personalized messaging, and lifecycle marketing campaigns.
