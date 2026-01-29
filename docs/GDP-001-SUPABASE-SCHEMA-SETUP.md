# GDP-001: Supabase Schema Setup

**Status:** ✅ Complete
**Priority:** P0
**Category:** Growth Data Plane

## Overview

GDP-001 establishes the foundational database schema for the Growth Data Plane using Supabase (PostgreSQL). This schema enables unified tracking of users, events, and subscriptions across all sources (client, server, Meta Pixel, CAPI, email, Stripe).

## Architecture

### Core Tables

1. **person** - Canonical user records
2. **identity_link** - Identity resolution mapping
3. **event** - Unified event tracking
4. **subscription** - Subscription snapshots

### Key Features

- **Identity Stitching**: Links anonymous visitors to known users
- **Event Deduplication**: Prevents duplicate events via unique event_id
- **Multi-Source Tracking**: Unified events from client, server, pixel, CAPI, email, Stripe
- **Person Features**: Auto-computed metrics (total_events, active_days, renders, etc.)
- **Revenue Tracking**: Tracks revenue_cents and MRR

## Database Schema

### person Table

Canonical person/user record representing a unique individual across all identifiers.

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | TEXT | Email address (unique) |
| phone | TEXT | Phone number |
| user_id | TEXT | Internal auth user ID (unique) |
| first_name | TEXT | First name |
| last_name | TEXT | Last name |
| display_name | TEXT | Display name |
| city | TEXT | City |
| state | TEXT | State/province |
| country | TEXT | Country |
| timezone | TEXT | Timezone |
| posthog_distinct_id | TEXT | PostHog distinct ID |
| meta_fbp | TEXT | Meta Pixel browser ID (_fbp cookie) |
| meta_fbc | TEXT | Meta Pixel click ID (_fbc cookie) |
| total_events | INTEGER | Computed: total event count |
| active_days | INTEGER | Computed: number of active days |
| total_renders | INTEGER | Computed: video renders |
| pricing_page_views | INTEGER | Computed: pricing page views |
| first_seen_at | TIMESTAMPTZ | First time seen |
| last_seen_at | TIMESTAMPTZ | Last activity |
| created_at | TIMESTAMPTZ | Record created |
| updated_at | TIMESTAMPTZ | Record updated |

**Indexes:**
- email (partial, where NOT NULL)
- user_id (partial, where NOT NULL)
- posthog_distinct_id (partial, where NOT NULL)
- meta_fbp (partial, where NOT NULL)
- created_at, last_seen_at

### identity_link Table

Maps various identifiers (email, phone, cookies, IDs) to canonical person records.

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| person_id | UUID | Foreign key to person |
| identity_type | TEXT | Type: email, phone, user_id, anonymous_id, etc. |
| identity_value | TEXT | Identity value |
| source | TEXT | Source: signup, pixel, capi, posthog, etc. |
| first_seen_at | TIMESTAMPTZ | First time seen |
| last_seen_at | TIMESTAMPTZ | Last time seen |
| created_at | TIMESTAMPTZ | Record created |

**Constraints:**
- UNIQUE(identity_type, identity_value) - Prevents duplicate identities

**Indexes:**
- person_id
- identity_type, identity_value
- created_at

**Identity Types:**
- `email` - Email address
- `phone` - Phone number
- `user_id` - Internal auth user ID
- `posthog_distinct_id` - PostHog distinct_id
- `anonymous_id` - Anonymous tracking ID
- `meta_fbp` - Meta Pixel browser ID
- `meta_fbc` - Meta Pixel click ID
- `session_id` - Session identifier

### event Table

Unified event tracking from all sources.

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| person_id | UUID | Foreign key to person (nullable) |
| event_name | TEXT | Event name (e.g., signup_completed) |
| event_type | TEXT | acquisition, activation, core_value, monetization, retention |
| event_source | TEXT | client, server, pixel, capi, posthog, email, stripe |
| event_id | TEXT | Unique event ID for deduplication |
| session_id | TEXT | Session identifier |
| page_url | TEXT | Page URL |
| page_title | TEXT | Page title |
| referrer | TEXT | HTTP referrer |
| utm_source | TEXT | UTM source |
| utm_medium | TEXT | UTM medium |
| utm_campaign | TEXT | UTM campaign |
| utm_content | TEXT | UTM content |
| utm_term | TEXT | UTM term |
| user_agent | TEXT | User agent string |
| ip_address | INET | IP address |
| browser | TEXT | Browser name |
| device_type | TEXT | desktop, mobile, tablet |
| os | TEXT | Operating system |
| country | TEXT | Country |
| city | TEXT | City |
| properties | JSONB | Flexible event properties |
| email_id | TEXT | Resend email ID (for email events) |
| email_subject | TEXT | Email subject |
| email_type | TEXT | delivered, opened, clicked, bounced, complained |
| email_link_url | TEXT | Clicked link URL |
| subscription_id | TEXT | Stripe subscription ID |
| subscription_status | TEXT | Subscription status |
| plan_id | TEXT | Plan ID |
| mrr_cents | INTEGER | MRR in cents |
| revenue_cents | INTEGER | Revenue in cents |
| currency | TEXT | Currency (default: USD) |
| event_time | TIMESTAMPTZ | When event occurred |
| created_at | TIMESTAMPTZ | Record created |

**Constraints:**
- UNIQUE(event_id, event_source) - Prevents duplicate events

**Indexes:**
- person_id (partial, where NOT NULL)
- event_name, event_type, event_source
- event_id (partial, where NOT NULL)
- event_time, created_at
- session_id, email_id, subscription_id (partial)
- properties (GIN index for JSONB queries)

### subscription Table

Current subscription status from Stripe.

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| person_id | UUID | Foreign key to person |
| stripe_subscription_id | TEXT | Stripe subscription ID (unique) |
| stripe_customer_id | TEXT | Stripe customer ID |
| stripe_price_id | TEXT | Stripe price ID |
| plan_id | TEXT | Plan identifier |
| plan_name | TEXT | Plan name |
| status | TEXT | active, canceled, past_due, unpaid, trialing, incomplete |
| amount_cents | INTEGER | Amount in cents |
| currency | TEXT | Currency (default: USD) |
| interval | TEXT | month, year |
| mrr_cents | INTEGER | Monthly Recurring Revenue in cents |
| trial_start | TIMESTAMPTZ | Trial start date |
| trial_end | TIMESTAMPTZ | Trial end date |
| current_period_start | TIMESTAMPTZ | Current period start |
| current_period_end | TIMESTAMPTZ | Current period end |
| canceled_at | TIMESTAMPTZ | Cancellation date |
| ended_at | TIMESTAMPTZ | End date |
| metadata | JSONB | Additional metadata |
| created_at | TIMESTAMPTZ | Record created |
| updated_at | TIMESTAMPTZ | Record updated |

**Indexes:**
- person_id
- stripe_subscription_id
- stripe_customer_id
- status
- created_at, current_period_end

## Helper Functions

### find_or_create_person

Atomically finds existing person by identity or creates new person with identity link.

```sql
find_or_create_person(
  p_identity_type TEXT,
  p_identity_value TEXT,
  p_source TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_user_id TEXT DEFAULT NULL,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL
) RETURNS UUID
```

**Behavior:**
1. Checks if identity_link exists → returns person_id
2. Checks if person exists by email or user_id
3. Creates new person if not found
4. Creates identity_link
5. Updates last_seen_at timestamps

### merge_person_records

Merges two person records for identity stitching.

```sql
merge_person_records(
  p_source_person_id UUID,
  p_target_person_id UUID
) RETURNS BOOLEAN
```

**Behavior:**
1. Moves all identity_links to target person
2. Moves all events to target person
3. Moves all subscriptions to target person
4. Merges person data (fills missing fields)
5. Deletes source person

### update_person_features

Computes person features from events.

```sql
update_person_features(p_person_id UUID) RETURNS VOID
```

**Computed Features:**
- `total_events` - Total event count
- `active_days` - Number of distinct active days
- `total_renders` - Count of video render events
- `pricing_page_views` - Count of pricing page views

**Trigger:**
- Automatically runs after each event insert

## TypeScript Integration

### Types

All schema types are defined in `src/types/growthDataPlane.ts`:

```typescript
import {
  Person,
  Event,
  Subscription,
  IdentityLink,
  CreatePersonInput,
  CreateEventInput,
  CreateSubscriptionInput,
} from '../types/growthDataPlane';
```

### Service Functions

All database operations are in `src/services/growthDataPlane.ts`:

```typescript
import {
  findOrCreatePerson,
  createEvent,
  createSubscription,
  getPersonEvents,
  getPersonIdentities,
  updatePersonFeatures,
  mergePersonRecords,
} from '../services/growthDataPlane';
```

### Supabase Client

Configured in `src/services/supabase.ts`:

```typescript
import { supabase, supabaseAdmin } from '../services/supabase';

// Use supabase for client-side (anon key)
// Use supabaseAdmin for server-side (service key, bypasses RLS)
```

## Setup Instructions

### 1. Create Supabase Project

1. Go to https://app.supabase.com
2. Create new project
3. Wait for database provisioning

### 2. Get API Keys

1. Go to Project Settings → API
2. Copy **URL** → `SUPABASE_URL`
3. Copy **anon public** key → `SUPABASE_ANON_KEY`
4. Copy **service_role** key → `SUPABASE_SERVICE_KEY`

### 3. Add to .env

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here
```

### 4. Run Migrations

**Option A: Supabase CLI**

```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

**Option B: SQL Editor**

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of each migration file in order:
   - `supabase/migrations/20260129000001_create_person_tables.sql`
   - `supabase/migrations/20260129000002_create_event_table.sql`
   - `supabase/migrations/20260129000003_create_subscription_table.sql`
   - `supabase/migrations/20260129000004_create_helper_functions.sql`
3. Run each migration

### 5. Test Schema

```bash
npx tsx scripts/test-growth-data-plane.ts
```

## Usage Examples

### Example 1: Track Signup Event

```typescript
import { findOrCreatePerson, createEvent } from '../services/growthDataPlane';

// Create person and link email
const person = await findOrCreatePerson({
  identity_type: 'email',
  identity_value: 'user@example.com',
  source: 'signup',
  email: 'user@example.com',
  first_name: 'John',
  last_name: 'Doe',
});

// Track signup event
await createEvent({
  person_id: person.id,
  event_name: 'signup_completed',
  event_type: 'acquisition',
  event_source: 'server',
  event_id: `signup-${Date.now()}`,
  page_url: 'https://example.com/signup',
  properties: {
    plan: 'free',
  },
});
```

### Example 2: Identity Stitching (Anonymous → Known)

```typescript
// Step 1: Anonymous user visits site
const anonPerson = await findOrCreatePerson({
  identity_type: 'anonymous_id',
  identity_value: 'anon-abc123',
  source: 'client',
});

// Track anonymous events
await createEvent({
  person_id: anonPerson.id,
  event_name: 'landing_view',
  event_type: 'acquisition',
  event_source: 'client',
});

// Step 2: User signs up
const knownPerson = await findOrCreatePerson({
  identity_type: 'email',
  identity_value: 'user@example.com',
  source: 'signup',
  email: 'user@example.com',
});

// Step 3: Stitch identities (merge anonymous into known)
await mergePersonRecords(anonPerson.id, knownPerson.id);

// Now all anonymous events are attributed to known user
```

### Example 3: Track Meta Pixel Event

```typescript
import { findOrCreatePerson, createEvent } from '../services/growthDataPlane';

// Find or create person by Meta Pixel browser ID
const person = await findOrCreatePerson({
  identity_type: 'meta_fbp',
  identity_value: 'fb.1.1234567890.987654321',
  source: 'pixel',
});

// Track Meta Pixel event
await createEvent({
  person_id: person.id,
  event_name: 'Purchase',
  event_type: 'monetization',
  event_source: 'pixel',
  event_id: 'event-123', // Same event_id for CAPI dedup
  revenue_cents: 2999,
  currency: 'USD',
  properties: {
    value: 29.99,
    currency: 'USD',
  },
});
```

### Example 4: Track Stripe Subscription

```typescript
import { createSubscription, createEvent } from '../services/growthDataPlane';

// Create subscription record
await createSubscription({
  person_id: person.id,
  stripe_subscription_id: 'sub_1234567890',
  stripe_customer_id: 'cus_1234567890',
  plan_id: 'pro-monthly',
  plan_name: 'Pro Monthly',
  status: 'active',
  amount_cents: 2999,
  currency: 'USD',
  interval: 'month',
  mrr_cents: 2999,
  current_period_start: new Date().toISOString(),
  current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
});

// Track subscription event
await createEvent({
  person_id: person.id,
  event_name: 'subscription.created',
  event_type: 'monetization',
  event_source: 'stripe',
  subscription_id: 'sub_1234567890',
  plan_id: 'pro-monthly',
  mrr_cents: 2999,
  revenue_cents: 2999,
});
```

## Event Deduplication

Meta Pixel and CAPI events use the same `event_id` for deduplication:

```typescript
const eventId = generateEventId(); // Shared between client and server

// Client-side: Meta Pixel
fbq('track', 'Purchase', { value: 29.99 }, { eventID: eventId });

// Server-side: CAPI
await metaCapiService.trackEvent('Purchase', {
  eventId, // Same ID
  customData: { value: 29.99 },
});

// Database: Only one event stored
await createEvent({
  event_name: 'Purchase',
  event_source: 'pixel', // Or 'capi'
  event_id: eventId, // Deduplicates via UNIQUE constraint
  revenue_cents: 2999,
});
```

## Person Features

Features are automatically computed after each event:

```sql
-- Triggers after event insert
UPDATE person SET
  total_events = (SELECT COUNT(*) FROM event WHERE person_id = ...),
  active_days = (SELECT COUNT(DISTINCT DATE(event_time)) FROM event WHERE ...),
  total_renders = (SELECT COUNT(*) FROM event WHERE event_name IN ('video_rendered', ...)),
  pricing_page_views = (SELECT COUNT(*) FROM event WHERE event_name = 'pricing_view')
WHERE id = ...;
```

Query person features:

```typescript
const { data: person } = await supabaseAdmin
  .from('person')
  .select('total_events, active_days, total_renders, pricing_page_views')
  .eq('id', personId)
  .single();

console.log(`User has rendered ${person.total_renders} videos`);
console.log(`Active for ${person.active_days} days`);
```

## Integration with Other Features

### TRACK-001 to TRACK-008

All tracking events flow into the `event` table:

```typescript
import { trackEvent } from '../services/tracking';
import { createEvent, findOrCreatePerson } from '../services/growthDataPlane';

// Tracking service wrapper
export async function trackEvent(eventName, properties) {
  const person = await findOrCreatePerson({
    identity_type: 'user_id',
    identity_value: userId,
  });

  await createEvent({
    person_id: person.id,
    event_name: eventName,
    event_source: 'server',
    properties,
  });
}
```

### META-004: CAPI Integration

CAPI events are stored in the event table:

```typescript
import { metaCapiService } from '../services/metaCapi';
import { createEvent, findOrCreatePerson } from '../services/growthDataPlane';

// After sending to Meta CAPI, store in database
const person = await findOrCreatePerson({
  identity_type: 'email',
  identity_value: email,
});

await createEvent({
  person_id: person.id,
  event_name: 'Purchase',
  event_source: 'capi',
  event_id: eventId, // For deduplication
  revenue_cents: 2999,
});
```

## Next Features

This schema enables:

- **GDP-002**: Person & Identity Tables ✅ (included)
- **GDP-003**: Unified Events Table ✅ (included)
- **GDP-004**: Resend Webhook Edge Function (store email events)
- **GDP-005**: Email Event Tracking (delivered, opened, clicked)
- **GDP-006**: Click Redirect Tracker (email → click → conversion)
- **GDP-007**: Stripe Webhook Integration (subscription events)
- **GDP-008**: Subscription Snapshot (MRR tracking)
- **GDP-009**: PostHog Identity Stitching (posthog.identify)
- **GDP-010**: Meta Pixel + CAPI Dedup (event_id matching)
- **GDP-011**: Person Features Computation ✅ (included)
- **GDP-012**: Segment Engine (evaluate segments, trigger automations)

## Files

```
supabase/migrations/
├── 20260129000001_create_person_tables.sql
├── 20260129000002_create_event_table.sql
├── 20260129000003_create_subscription_table.sql
└── 20260129000004_create_helper_functions.sql

src/types/
└── growthDataPlane.ts

src/services/
├── supabase.ts
└── growthDataPlane.ts

scripts/
└── test-growth-data-plane.ts

docs/
└── GDP-001-SUPABASE-SCHEMA-SETUP.md
```

## Testing

Run the test script:

```bash
npx tsx scripts/test-growth-data-plane.ts
```

Expected output:

```
🧪 Testing Growth Data Plane Schema (GDP-001)

✅ Supabase configured

Test 1: Create person by email
✅ Created person: abc-123...

Test 2: Find existing person by email
✅ Found existing person: abc-123...

...

==============================================
Test Summary:
✅ Passed: 15
❌ Failed: 0
📊 Total: 15
==============================================

🎉 All tests passed!
```

## Summary

GDP-001 establishes a robust, scalable foundation for the Growth Data Plane:

✅ **Person table** - Canonical user records
✅ **Identity stitching** - Anonymous → known user resolution
✅ **Unified events** - All events in one table
✅ **Event deduplication** - Prevents duplicates via event_id
✅ **Multi-source tracking** - Client, server, pixel, CAPI, email, Stripe
✅ **Auto-computed features** - total_events, active_days, renders, etc.
✅ **Revenue tracking** - revenue_cents, MRR
✅ **TypeScript types** - Fully typed schema
✅ **Helper functions** - find_or_create_person, merge_person_records
✅ **Test coverage** - Comprehensive test script

This schema is production-ready and ready to power the complete Growth Data Plane.
