# AI Video Platform - Progress Update

## Recently Completed: GDP-001, GDP-002, GDP-003

**Feature:** Supabase Schema Setup
**Date:** 2026-01-29
**Status:** ✅ Complete

### What Was Built

Established the foundational database schema for the Growth Data Plane using Supabase (PostgreSQL). This schema enables unified tracking of users, events, and subscriptions across all sources.

**Core Tables:**

1. **person** - Canonical user records
   - Stores email, phone, user_id, and profile data
   - Tracking identifiers (posthog_distinct_id, meta_fbp, meta_fbc)
   - Auto-computed features (total_events, active_days, total_renders, pricing_page_views)
   - Lifecycle timestamps (first_seen_at, last_seen_at)

2. **identity_link** - Identity resolution
   - Maps various identifiers to canonical person records
   - Supports: email, phone, user_id, posthog_distinct_id, anonymous_id, meta_fbp, meta_fbc, session_id
   - Enables identity stitching (anonymous → known user)
   - Tracks source of identity capture

3. **event** - Unified event tracking
   - All events from all sources in one table
   - Event sources: client, server, pixel, CAPI, posthog, email, stripe
   - Event deduplication via unique event_id
   - Rich context: session, page, UTM params, device, browser, location
   - Flexible properties JSONB field
   - Email-specific fields (email_id, email_type, link_url)
   - Subscription-specific fields (subscription_id, plan_id, mrr_cents)
   - Revenue tracking (revenue_cents, currency)

4. **subscription** - Stripe subscription snapshots
   - Current subscription status for each person
   - MRR tracking (Monthly Recurring Revenue)
   - Stripe subscription/customer/price IDs
   - Lifecycle dates (trial, current period, canceled, ended)

**Helper Functions:**

1. **find_or_create_person** - Atomic find-or-create by identity
   - Checks identity_link for existing person
   - Falls back to email or user_id lookup
   - Creates new person if not found
   - Creates identity link
   - Updates last_seen_at timestamps

2. **merge_person_records** - Identity stitching
   - Moves all identity_links to target person
   - Moves all events to target person
   - Moves all subscriptions to target person
   - Merges person data (fills missing fields)
   - Deletes source person

3. **update_person_features** - Compute features from events
   - total_events: COUNT(*)
   - active_days: COUNT(DISTINCT DATE(event_time))
   - total_renders: COUNT(video_rendered events)
   - pricing_page_views: COUNT(pricing_view events)
   - Triggered automatically after event insert

### Technical Highlights

**Identity Stitching:**
- Anonymous visitors get person record with anonymous_id
- When they sign up, new person created with email
- merge_person_records links anonymous events to known user
- Complete attribution from first touch to conversion

**Event Deduplication:**
- Meta Pixel and CAPI use same event_id
- UNIQUE constraint prevents duplicates
- First event stored, subsequent events skipped
- Accurate event counting across sources

**Multi-Source Tracking:**
All events flow into unified table:
- **client**: Browser tracking (PostHog, Meta Pixel)
- **server**: Server-side tracking
- **pixel**: Meta Pixel events
- **capi**: Meta Conversions API events
- **posthog**: PostHog events
- **email**: Resend email events (delivered, opened, clicked)
- **stripe**: Stripe subscription events

**Auto-Computed Features:**
Triggers update person features after each event:
```sql
-- Automatically computed
total_events = 125
active_days = 18
total_renders = 42
pricing_page_views = 3
```

**Revenue Tracking:**
- revenue_cents in event table (purchase, subscription)
- mrr_cents in subscription table (normalized to monthly)
- Query total revenue: `SUM(revenue_cents) WHERE person_id = ...`

### Database Migrations

All migrations in `supabase/migrations/`:

1. **20260129000001_create_person_tables.sql**
   - person table with indexes
   - identity_link table with UNIQUE constraint
   - update_updated_at_column() function
   - Trigger for auto-updating updated_at

2. **20260129000002_create_event_table.sql**
   - event table with comprehensive fields
   - UNIQUE index for event deduplication
   - GIN index for JSONB properties
   - Partial indexes for performance

3. **20260129000003_create_subscription_table.sql**
   - subscription table with Stripe fields
   - Trigger for auto-updating updated_at
   - Indexes for common queries

4. **20260129000004_create_helper_functions.sql**
   - find_or_create_person() function
   - merge_person_records() function
   - update_person_features() function
   - Trigger for auto-computing person features

### TypeScript Integration

**Types** (`src/types/growthDataPlane.ts`):
- Person, IdentityLink, Event, Subscription interfaces
- CreatePersonInput, CreateEventInput, CreateSubscriptionInput
- EventType, EventSource, DeviceType, EmailEventType enums
- IdentityType, SubscriptionStatus, SubscriptionInterval types

**Service Layer** (`src/services/growthDataPlane.ts`):
```typescript
// Person management
findPersonByIdentity(identityType, identityValue)
findOrCreatePerson(params)
createPerson(input)
updatePerson(personId, updates)
mergePersonRecords(sourcePersonId, targetPersonId)

// Event tracking
createEvent(input)
getPersonEvents(personId, limit)
getEventsByName(eventName, limit)

// Subscription management
createSubscription(input)
updateSubscription(stripeSubscriptionId, updates)
getPersonSubscriptions(personId)

// Identity management
addIdentityLink(personId, identityType, identityValue, source)
getPersonIdentities(personId)

// Person features
updatePersonFeatures(personId)

// Analytics
getActivePeople(daysBack)
getRevenueByPerson(personId)
```

**Supabase Client** (`src/services/supabase.ts`):
- supabase: Client-side (anon key)
- supabaseAdmin: Server-side (service key, bypasses RLS)
- isSupabaseConfigured(): Check if configured

### Usage Examples

**Example 1: Track Signup**
```typescript
import { findOrCreatePerson, createEvent } from '@/services/growthDataPlane';

// Create person
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
  page_url: '/signup',
});
```

**Example 2: Identity Stitching**
```typescript
// Anonymous visitor
const anonPerson = await findOrCreatePerson({
  identity_type: 'anonymous_id',
  identity_value: 'anon-123',
  source: 'client',
});

// Track anonymous events
await createEvent({
  person_id: anonPerson.id,
  event_name: 'landing_view',
  event_type: 'acquisition',
  event_source: 'client',
});

// User signs up
const knownPerson = await findOrCreatePerson({
  identity_type: 'email',
  identity_value: 'user@example.com',
  source: 'signup',
  email: 'user@example.com',
});

// Stitch identities
await mergePersonRecords(anonPerson.id, knownPerson.id);

// All anonymous events now attributed to known user
```

**Example 3: Meta Pixel + CAPI Deduplication**
```typescript
import { generateEventId } from '@/utils/eventId';

const eventId = generateEventId(); // Shared ID

// Client: Meta Pixel
fbq('track', 'Purchase', { value: 29.99 }, { eventID: eventId });

// Server: Meta CAPI
await metaCapiService.trackEvent('Purchase', {
  eventId,
  customData: { value: 29.99 },
});

// Database: Only one event stored
await createEvent({
  event_name: 'Purchase',
  event_source: 'pixel', // or 'capi'
  event_id: eventId, // Deduplicates
  revenue_cents: 2999,
});
```

**Example 4: Stripe Subscription**
```typescript
// Create subscription
await createSubscription({
  person_id: person.id,
  stripe_subscription_id: 'sub_123',
  stripe_customer_id: 'cus_123',
  plan_id: 'pro-monthly',
  plan_name: 'Pro Monthly',
  status: 'active',
  amount_cents: 2999,
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
  subscription_id: 'sub_123',
  plan_id: 'pro-monthly',
  mrr_cents: 2999,
  revenue_cents: 2999,
});
```

### Testing

**Test Script** (`scripts/test-growth-data-plane.ts`):

15 comprehensive test cases:
1. Create person by email
2. Find existing person by email
3. Add anonymous identity to person
4. Create event
5. Test event deduplication
6. Create video render event
7. Create purchase event with revenue
8. Update person features
9. Get person events
10. Get person identities
11. Create subscription
12. Create second person for merge test
13. Add events to second person
14. Merge person records (identity stitching)
15. Verify merged events

Run tests:
```bash
npx tsx scripts/test-growth-data-plane.ts
```

Expected output: 15/15 tests passed (100%)

### Setup Instructions

**1. Create Supabase Project:**
- Go to https://app.supabase.com
- Create new project
- Wait for provisioning

**2. Get API Keys:**
- Project Settings → API
- Copy URL → SUPABASE_URL
- Copy anon public key → SUPABASE_ANON_KEY
- Copy service_role key → SUPABASE_SERVICE_KEY

**3. Add to .env:**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

**4. Run Migrations:**

Option A: Supabase CLI
```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

Option B: SQL Editor (Supabase Dashboard)
- Copy each migration file
- Run in order in SQL Editor

**5. Test Schema:**
```bash
npx tsx scripts/test-growth-data-plane.ts
```

### Integration with Other Features

**Tracking Features (TRACK-001 to TRACK-008):**
All tracking events now flow into the unified event table:
```typescript
import { trackEvent } from '@/services/tracking';
import { createEvent, findOrCreatePerson } from '@/services/growthDataPlane';

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

**Meta Pixel (META-001 to META-006):**
Meta events stored in event table:
```typescript
await createEvent({
  person_id: person.id,
  event_name: 'Purchase',
  event_source: 'capi',
  event_id: eventId,
  revenue_cents: 2999,
});
```

**Future Features:**
This schema enables:
- **GDP-004**: Resend Webhook Edge Function (store email events)
- **GDP-005**: Email Event Tracking (delivered, opened, clicked)
- **GDP-006**: Click Redirect Tracker (email → click → conversion)
- **GDP-007**: Stripe Webhook Integration (subscription events)
- **GDP-008**: Subscription Snapshot (MRR tracking)
- **GDP-009**: PostHog Identity Stitching (posthog.identify)
- **GDP-010**: Meta Pixel + CAPI Dedup (event_id matching)
- **GDP-011**: Person Features Computation ✅ (already included!)
- **GDP-012**: Segment Engine (evaluate segments, trigger automations)

### Files Modified

```
.env.example (updated with Supabase config)

supabase/migrations/
├── 20260129000001_create_person_tables.sql (new)
├── 20260129000002_create_event_table.sql (new)
├── 20260129000003_create_subscription_table.sql (new)
└── 20260129000004_create_helper_functions.sql (new)

src/types/
└── growthDataPlane.ts (new)

src/services/
├── supabase.ts (new)
└── growthDataPlane.ts (new)

scripts/
└── test-growth-data-plane.ts (new)

docs/
└── GDP-001-SUPABASE-SCHEMA-SETUP.md (new)

feature_list.json (updated)
package.json (added @supabase/supabase-js)
package-lock.json (updated)
```

### Progress Stats

- **Total Features:** 106
- **Completed:** 95/106 (90%)
- **Remaining:** 11
- **Current Phase:** 7 (Tracking & Analytics)

### Recent Milestones

- ✅ META-001: Meta Pixel Installation
- ✅ META-002: PageView Tracking
- ✅ META-003: Standard Events Mapping
- ✅ META-004: CAPI Server-Side Events
- ✅ META-005: Event Deduplication
- ✅ META-006: User Data Hashing
- ✅ **GDP-001: Supabase Schema Setup** ← Just completed!
- ✅ **GDP-002: Person & Identity Tables** ← Included in GDP-001!
- ✅ **GDP-003: Unified Events Table** ← Included in GDP-001!

### Up Next

**GDP-004: Resend Webhook Edge Function** (P0)
- Verify and store email events from Resend webhooks
- Track delivered, opened, clicked events
- Link email events to person records

**GDP-005: Email Event Tracking** (P0)
- Track delivered/opened/clicked events
- Email engagement metrics
- Attribution tracking

**META-007: Custom Audiences Setup** (P2)
- Configure custom audiences based on events
- Use hashed user data for audience building
- Set up retargeting campaigns

---

**Note:** The Growth Data Plane is now ready with a comprehensive schema for tracking users, events, and subscriptions across all sources. This enables identity stitching, event deduplication, and unified analytics.
