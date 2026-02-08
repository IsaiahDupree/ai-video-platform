# PERF-001: Render Queue Priority System

**Status:** ✅ Complete
**Priority:** P1 (High)
**Category:** Performance
**Last Updated:** 2026-02-08

## Overview

The Render Queue Priority System ensures that paid subscribers get faster processing of their video render jobs. Jobs are prioritized based on the user's subscription tier (Free, Trial, Basic, Premium, Enterprise), allowing the platform to provide differentiated service levels.

## Features

### 1. User Tier Classification

Users are automatically classified into tiers based on their subscription status:

```typescript
enum UserTier {
  FREE = 'free',           // No active subscription
  TRIAL = 'trial',         // Trialing subscription
  BASIC = 'basic',         // Active basic plan
  PREMIUM = 'premium',     // Active premium plan
  ENTERPRISE = 'enterprise' // Active enterprise plan
}
```

### 2. Priority Levels

Each tier maps to a job priority level in the render queue (lower number = higher priority):

| Tier | Priority | Value | Speed |
|------|----------|-------|-------|
| FREE | LOW | 10 | Slowest |
| TRIAL | NORMAL | 5 | Normal |
| BASIC | HIGH | 1 | Fast |
| PREMIUM | URGENT | 0 | Fastest |
| ENTERPRISE | URGENT | 0 | Fastest |

### 3. Rate Limiting Multipliers

Paid users get higher throughput limits for API and rendering operations:

| Tier | Multiplier | Throughput |
|------|-----------|-----------|
| FREE | 1x | Baseline |
| TRIAL | 1.5x | 50% higher |
| BASIC | 2x | 2x baseline |
| PREMIUM | 3x | 3x baseline |
| ENTERPRISE | 5x | 5x baseline |

## Architecture

### Service: `src/services/renderQueuePriority.ts`

Main service that handles all priority logic:

```typescript
// Get priority for a specific user
const priority = await getUserRenderPriority(userId);

// Get complete tier information
const { tier, priority, subscription } = await getUserTierInfo(userId);

// Check if user is a paid subscriber
const isPaid = await isUserPaidSubscriber(userId);

// Get rate limit multiplier
const multiplier = await getUserPriorityMultiplier(userId);
```

### Integration Points

#### 1. Render Queue Integration

When submitting a render job:

```typescript
import { getRenderQueue } from '../services/renderQueue';
import { getUserRenderPriority } from '../services/renderQueuePriority';

const queue = getRenderQueue();
const priority = await getUserRenderPriority(userId);

// Submit job with user's tier-based priority
await queue.addSingleRenderJob(compositionId, {
  priority: priority,
  metadata: { userId }
});
```

#### 2. API Rate Limiting

Use priority multiplier for rate limiting:

```typescript
import { getUserPriorityMultiplier } from '../services/renderQueuePriority';

const multiplier = await getUserPriorityMultiplier(userId);
const rateLimit = BASE_RATE_LIMIT * multiplier;
```

#### 3. Subscription Data

Subscription tier is determined from Supabase:

```
Person → Subscription → plan_id/status → Tier → Priority
```

## Implementation Details

### 1. Tier Detection Logic

The `getUserTierFromSubscription()` function:

1. Returns `FREE` if no subscription exists
2. Returns `TRIAL` if subscription status is `trialing`
3. Returns `FREE` if subscription is canceled/past_due/unpaid/incomplete
4. Returns `ENTERPRISE`/`PREMIUM`/`BASIC` based on plan name/ID
5. Defaults to `BASIC` for unknown active plans

### 2. User Lookup

Users are identified by `user_id` and looked up in the `person` table:

```typescript
const person = await findPersonByIdentity('user_id', userId);
```

### 3. Subscription Lookup

Active subscriptions are found for each person:

```typescript
const subscriptions = await getPersonSubscriptions(person.id);
const activeSubscription = subscriptions.find(
  sub => sub.status === 'active' || sub.status === 'trialing'
);
```

### 4. Error Handling

If lookup fails at any point, the system defaults to `FREE` tier priority to ensure service availability.

## Configuration

### Plan Mapping

Plans are mapped to tiers in `PLAN_TO_TIER`:

```typescript
export const PLAN_TO_TIER: Record<string, UserTier> = {
  'plan_basic_monthly': UserTier.BASIC,
  'plan_basic_yearly': UserTier.BASIC,
  'plan_premium_monthly': UserTier.PREMIUM,
  'plan_premium_yearly': UserTier.PREMIUM,
  'plan_enterprise_monthly': UserTier.ENTERPRISE,
  'plan_enterprise_yearly': UserTier.ENTERPRISE,
};
```

### Adding New Plans

To add a new plan:

1. Update `PLAN_TO_TIER` in `renderQueuePriority.ts`
2. The plan name matching is case-insensitive
3. The system falls back to matching plan names like "basic", "premium", "enterprise"

## Usage Examples

### Example 1: Submit Render Job with User Priority

```typescript
import { getRenderQueue } from '../services/renderQueue';
import { getUserRenderPriority } from '../services/renderQueuePriority';

async function submitRenderJob(userId: string, compositionId: string) {
  const queue = getRenderQueue();
  const priority = await getUserRenderPriority(userId);

  const job = await queue.addSingleRenderJob(compositionId, {
    priority: priority,
    metadata: { userId }
  });

  return job;
}
```

### Example 2: Check User Subscription Tier

```typescript
import { getUserTierInfo } from '../services/renderQueuePriority';

async function getUserInfo(userId: string) {
  const { tier, subscription } = await getUserTierInfo(userId);

  return {
    tier,
    isPaid: tier !== 'free' && tier !== 'trial',
    subscription: subscription ? {
      plan: subscription.plan_name,
      mrr: subscription.mrr_cents,
      status: subscription.status
    } : null
  };
}
```

### Example 3: Apply Rate Limiting Based on Tier

```typescript
import { getUserPriorityMultiplier } from '../services/renderQueuePriority';

const BASE_RATE_LIMIT = 10; // renders per minute

async function getRateLimit(userId: string) {
  const multiplier = await getUserPriorityMultiplier(userId);
  return BASE_RATE_LIMIT * multiplier;
}
```

## Testing

Run the test suite:

```bash
npm run test -- scripts/test-render-queue-priority.ts
```

Test coverage includes:

- ✅ Tier-to-priority mapping verification
- ✅ Subscription status to tier conversion
- ✅ Paid subscriber detection
- ✅ Priority multiplier calculations
- ✅ Error handling and fallback behavior

## Database Schema

### Dependencies

This feature relies on these tables:

1. **person** - User profiles with `user_id` field
2. **subscription** - Subscription records with `status`, `plan_id`, `plan_name`
3. **identity_link** - For identity resolution (user_id → person)

### Key Queries

```sql
-- Find person by user_id
SELECT * FROM person WHERE user_id = $1;

-- Get active subscriptions for a person
SELECT * FROM subscription
WHERE person_id = $1
  AND status IN ('active', 'trialing')
ORDER BY created_at DESC;
```

## Performance Considerations

### Caching

The lookup process can be optimized with caching:

1. Person lookups can be cached in memory for 1 hour
2. Subscription status can be cached for 5 minutes
3. Cache invalidation on subscription updates via webhooks

### Lookup Overhead

Each priority lookup involves:
- 1 database query to find person by user_id
- 1 database query to fetch subscriptions
- ~5-10ms total latency

For high-volume rendering, consider:
- Pre-fetching priority when user logs in
- Caching priority in Redis
- Using Supabase RLS for direct access

## Security Considerations

1. **User Isolation** - Users can only see their own priority level
2. **Subscription Validation** - Priority is based on verified Stripe subscriptions
3. **Fallback to Free** - If lookup fails, system defaults to FREE tier (no privilege escalation)
4. **Audit Trail** - All priority decisions are logged with userId and tier

## Monitoring

Key metrics to track:

```typescript
// Queue monitoring
const stats = await queue.getStats();

// Priority distribution
const jobsByPriority = {
  urgent: stats.urgent_jobs,
  high: stats.high_jobs,
  normal: stats.normal_jobs,
  low: stats.low_jobs
};

// Paid vs Free job volume
const paidJobsPercentage = (stats.urgent_jobs + stats.high_jobs) / stats.total_jobs * 100;
```

## Future Enhancements

1. **Dynamic Priority Adjustment** - Adjust priority based on queue depth
2. **Time-Based Queues** - Fast track for urgent jobs (paid users)
3. **Queue Fairness** - Ensure FREE tier gets minimum processing
4. **SLA Tracking** - Monitor job completion times by tier
5. **Tier Upsell** - Recommend upgrades based on queue wait times

## Troubleshooting

### User Getting FREE Priority When Paid

**Symptom:** Paid user getting LOW priority (10)
**Cause:** User not found in person table or subscription lookup failed
**Solution:**
1. Verify user_id matches in auth system and person table
2. Check subscription record exists and status is 'active'
3. Review error logs for lookup failures

### Plan Not Recognized

**Symptom:** User has premium plan but getting BASIC priority
**Cause:** Plan ID not in PLAN_TO_TIER mapping
**Solution:**
1. Check plan_id and plan_name in Stripe
2. Add to PLAN_TO_TIER mapping
3. Ensure spelling matches (case-insensitive)

### High Latency on Priority Lookup

**Symptom:** Slow job submission (>100ms)
**Cause:** Database queries taking time
**Solution:**
1. Add indexes on person.user_id and subscription.person_id
2. Implement caching layer (Redis)
3. Use connection pooling

## Summary

PERF-001 provides a complete, production-ready priority system that:

✅ Automatically classifies users by subscription tier
✅ Assigns appropriate priority levels to render jobs
✅ Provides rate limiting multipliers for APIs
✅ Integrates seamlessly with the existing render queue
✅ Handles errors gracefully with sensible defaults
✅ Includes comprehensive tests and documentation

The system is ready for immediate production deployment.
