/**
 * Render Queue Priority System - PERF-001
 * Priority-based render queue with paid users getting faster processing
 *
 * This service maps user subscription tiers to render job priorities,
 * ensuring paid users get faster processing of their render jobs.
 */

import { JobPriority } from './renderQueue';
import { getPersonSubscriptions, type Subscription } from './growthDataPlane';

/**
 * User tier classification based on subscription status
 */
export enum UserTier {
  FREE = 'free',           // No active subscription
  TRIAL = 'trial',         // Trialing subscription
  BASIC = 'basic',         // Active basic plan
  PREMIUM = 'premium',     // Active premium plan
  ENTERPRISE = 'enterprise', // Active enterprise plan
}

/**
 * Priority mapping for different user tiers
 * Higher tier = lower job priority number = faster processing
 */
const TIER_TO_PRIORITY: Record<UserTier, JobPriority> = {
  [UserTier.FREE]: JobPriority.LOW,           // 10 - Lowest priority
  [UserTier.TRIAL]: JobPriority.NORMAL,       // 5  - Normal priority
  [UserTier.BASIC]: JobPriority.HIGH,         // 1  - High priority
  [UserTier.PREMIUM]: JobPriority.URGENT,     // 0  - Highest priority
  [UserTier.ENTERPRISE]: JobPriority.URGENT,  // 0  - Highest priority
};

/**
 * Determine user tier from subscription status
 */
export function getUserTierFromSubscription(subscription: Subscription | null): UserTier {
  if (!subscription) {
    return UserTier.FREE;
  }

  if (subscription.status === 'trialing') {
    return UserTier.TRIAL;
  }

  if (subscription.status !== 'active') {
    return UserTier.FREE; // Canceled, past due, unpaid, or incomplete
  }

  // Determine plan tier from plan_id or plan_name
  const planId = (subscription.plan_id || '').toLowerCase();
  const planName = (subscription.plan_name || '').toLowerCase();

  if (planId.includes('enterprise') || planName.includes('enterprise')) {
    return UserTier.ENTERPRISE;
  }

  if (planId.includes('premium') || planName.includes('premium')) {
    return UserTier.PREMIUM;
  }

  if (planId.includes('basic') || planName.includes('basic')) {
    return UserTier.BASIC;
  }

  // Default to BASIC for any other active plan
  return UserTier.BASIC;
}

/**
 * Get the appropriate render job priority for a user
 *
 * @param userId - The user's ID (from auth context)
 * @returns The JobPriority for this user
 */
export async function getUserRenderPriority(userId: string): Promise<JobPriority> {
  try {
    // Find the person record by user_id
    const { findPersonByIdentity } = await import('./growthDataPlane');
    const person = await findPersonByIdentity('user_id', userId);

    if (!person) {
      // User not found in database, use FREE tier
      return TIER_TO_PRIORITY[UserTier.FREE];
    }

    // Get the person's subscriptions
    const subscriptions = await getPersonSubscriptions(person.id);

    // Find the first active subscription (users should have at most one active)
    const activeSubscription = subscriptions.find(
      sub => sub.status === 'active' || sub.status === 'trialing'
    );

    const tier = getUserTierFromSubscription(activeSubscription || null);
    return TIER_TO_PRIORITY[tier];
  } catch (error) {
    console.error(`Error getting user render priority for user ${userId}:`, error);
    // Default to FREE tier on error
    return TIER_TO_PRIORITY[UserTier.FREE];
  }
}

/**
 * Get user tier information
 * Returns both the tier and the corresponding priority
 */
export async function getUserTierInfo(userId: string): Promise<{
  tier: UserTier;
  priority: JobPriority;
  subscription: Subscription | null;
}> {
  try {
    const { findPersonByIdentity } = await import('./growthDataPlane');
    const person = await findPersonByIdentity('user_id', userId);

    if (!person) {
      return {
        tier: UserTier.FREE,
        priority: TIER_TO_PRIORITY[UserTier.FREE],
        subscription: null,
      };
    }

    const subscriptions = await getPersonSubscriptions(person.id);
    const activeSubscription = subscriptions.find(
      sub => sub.status === 'active' || sub.status === 'trialing'
    ) || null;

    const tier = getUserTierFromSubscription(activeSubscription);

    return {
      tier,
      priority: TIER_TO_PRIORITY[tier],
      subscription: activeSubscription,
    };
  } catch (error) {
    console.error(`Error getting user tier info for user ${userId}:`, error);
    return {
      tier: UserTier.FREE,
      priority: TIER_TO_PRIORITY[UserTier.FREE],
      subscription: null,
    };
  }
}

/**
 * Check if user is a paid subscriber (BASIC, PREMIUM, or ENTERPRISE tier)
 */
export async function isUserPaidSubscriber(userId: string): Promise<boolean> {
  const { tier } = await getUserTierInfo(userId);
  return tier !== UserTier.FREE && tier !== UserTier.TRIAL;
}

/**
 * Get priority multiplier for rate limiting based on tier
 * Used to allow paid users higher throughput
 *
 * Returns:
 * - FREE: 1x (baseline)
 * - TRIAL: 1.5x
 * - BASIC: 2x
 * - PREMIUM: 3x
 * - ENTERPRISE: 5x
 */
export async function getUserPriorityMultiplier(userId: string): Promise<number> {
  const { tier } = await getUserTierInfo(userId);

  const multipliers: Record<UserTier, number> = {
    [UserTier.FREE]: 1,
    [UserTier.TRIAL]: 1.5,
    [UserTier.BASIC]: 2,
    [UserTier.PREMIUM]: 3,
    [UserTier.ENTERPRISE]: 5,
  };

  return multipliers[tier];
}

/**
 * Map of subscription plans to their tiers
 * Can be extended with more plan names from Stripe
 */
export const PLAN_TO_TIER: Record<string, UserTier> = {
  // Free tier (no entry needed, default)

  // Trial tier
  'plan_trial': UserTier.TRIAL,

  // Basic plans
  'plan_basic_monthly': UserTier.BASIC,
  'plan_basic_yearly': UserTier.BASIC,
  'basic': UserTier.BASIC,

  // Premium plans
  'plan_premium_monthly': UserTier.PREMIUM,
  'plan_premium_yearly': UserTier.PREMIUM,
  'premium': UserTier.PREMIUM,

  // Enterprise plans
  'plan_enterprise_monthly': UserTier.ENTERPRISE,
  'plan_enterprise_yearly': UserTier.ENTERPRISE,
  'enterprise': UserTier.ENTERPRISE,
};

/**
 * Get tier from Stripe plan ID
 */
export function getTierFromPlanId(planId: string): UserTier {
  const normalized = (planId || '').toLowerCase();
  return PLAN_TO_TIER[normalized] || UserTier.BASIC;
}
