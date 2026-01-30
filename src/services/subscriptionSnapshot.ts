/**
 * GDP-008: Subscription Snapshot Service
 *
 * Tracks point-in-time snapshots of subscription state for churn and expansion tracking.
 * - Creates snapshots daily/monthly
 * - Calculates MRR changes and churn status
 * - Tracks expansion vs contraction vs churn
 */

import { createClient } from '@supabase/supabase-js';
import type {
  SubscriptionSnapshot,
  SubscriptionSnapshotInput,
  Subscription,
} from '@/types/growthDataPlane';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Create a subscription snapshot
 */
export async function createSubscriptionSnapshot(
  input: SubscriptionSnapshotInput
): Promise<SubscriptionSnapshot> {
  // Mark existing snapshots as non-current
  await supabase
    .from('subscription_snapshots')
    .update({ is_current: false })
    .eq('subscription_id', input.subscription_id)
    .eq('is_current', true);

  // Insert new snapshot
  const { data, error } = await supabase
    .from('subscription_snapshots')
    .insert({
      subscription_id: input.subscription_id,
      person_id: input.person_id,
      status: input.status,
      mrr_cents: input.mrr_cents,
      amount_cents: input.amount_cents,
      currency: input.currency,
      current_period_start: input.current_period_start,
      current_period_end: input.current_period_end,
      canceled_at: input.canceled_at,
      ended_at: input.ended_at,
      mrr_change_cents: input.mrr_change_cents,
      churn_status: input.churn_status || 'active',
      churn_reason: input.churn_reason,
      snapshot_date: new Date().toISOString().split('T')[0],
      snapshot_period: 'daily',
      is_current: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create subscription snapshot: ${error.message}`);
  }

  return data as SubscriptionSnapshot;
}

/**
 * Get latest snapshot for a subscription
 */
export async function getLatestSubscriptionSnapshot(
  subscriptionId: string
): Promise<SubscriptionSnapshot | null> {
  const { data, error } = await supabase
    .from('subscription_snapshots')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .eq('is_current', true)
    .single();

  if (error && error.code === 'PGRST116') {
    // No rows found
    return null;
  }

  if (error) {
    throw new Error(
      `Failed to get latest subscription snapshot: ${error.message}`
    );
  }

  return data as SubscriptionSnapshot;
}

/**
 * Get all snapshots for a subscription
 */
export async function getSubscriptionSnapshots(
  subscriptionId: string,
  limit: number = 30
): Promise<SubscriptionSnapshot[]> {
  const { data, error } = await supabase
    .from('subscription_snapshots')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .order('snapshot_date', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(
      `Failed to get subscription snapshots: ${error.message}`
    );
  }

  return (data || []) as SubscriptionSnapshot[];
}

/**
 * Get all snapshots for a person
 */
export async function getPersonSubscriptionSnapshots(
  personId: string,
  limit: number = 30
): Promise<SubscriptionSnapshot[]> {
  const { data, error } = await supabase
    .from('subscription_snapshots')
    .select('*')
    .eq('person_id', personId)
    .order('snapshot_date', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(
      `Failed to get person subscription snapshots: ${error.message}`
    );
  }

  return (data || []) as SubscriptionSnapshot[];
}

/**
 * Calculate MRR change from subscription update
 */
export function calculateMrrChange(
  oldSubscription: Subscription | null,
  newSubscription: Subscription
): number {
  if (!oldSubscription) {
    return newSubscription.mrr_cents || 0;
  }

  const oldMrr = oldSubscription.mrr_cents || 0;
  const newMrr = newSubscription.mrr_cents || 0;

  return newMrr - oldMrr;
}

/**
 * Calculate churn status from subscription changes
 */
export function calculateChurnStatus(
  oldSubscription: Subscription | null,
  newSubscription: Subscription
): 'active' | 'churned' | 'reactivated' {
  if (!oldSubscription) {
    return 'active';
  }

  // Churned: transitioned to canceled/past_due/unpaid
  if (
    oldSubscription.status === 'active' &&
    ['canceled', 'past_due', 'unpaid'].includes(newSubscription.status)
  ) {
    return 'churned';
  }

  // Reactivated: moved back to active from inactive status
  if (
    ['canceled', 'past_due', 'unpaid'].includes(oldSubscription.status) &&
    newSubscription.status === 'active'
  ) {
    return 'reactivated';
  }

  return 'active';
}

/**
 * Create snapshot when subscription is updated
 */
export async function createSnapshotFromSubscription(
  subscription: Subscription,
  previousSnapshot?: SubscriptionSnapshot
): Promise<SubscriptionSnapshot> {
  // Calculate MRR change
  const mrrChange = previousSnapshot
    ? subscription.mrr_cents! - previousSnapshot.mrr_cents
    : subscription.mrr_cents || 0;

  // Determine churn status
  const previousStatus = previousSnapshot?.status;
  let churnStatus: 'active' | 'churned' | 'reactivated' = 'active';
  let churnReason: string | undefined;

  if (previousStatus && previousStatus !== subscription.status) {
    if (
      previousStatus === 'active' &&
      ['canceled', 'past_due', 'unpaid'].includes(subscription.status)
    ) {
      churnStatus = 'churned';
      churnReason =
        subscription.status === 'canceled'
          ? 'Subscription canceled'
          : `Subscription status: ${subscription.status}`;
    } else if (
      ['canceled', 'past_due', 'unpaid'].includes(previousStatus) &&
      subscription.status === 'active'
    ) {
      churnStatus = 'reactivated';
      churnReason = 'Subscription reactivated';
    }
  }

  return createSubscriptionSnapshot({
    subscription_id: subscription.id,
    person_id: subscription.person_id,
    status: subscription.status,
    mrr_cents: subscription.mrr_cents || 0,
    amount_cents: subscription.amount_cents,
    currency: subscription.currency,
    current_period_start: subscription.current_period_start,
    current_period_end: subscription.current_period_end,
    canceled_at: subscription.canceled_at,
    ended_at: subscription.ended_at,
    mrr_change_cents: mrrChange,
    churn_status: churnStatus,
    churn_reason: churnReason,
  });
}

/**
 * Get cohort metrics for subscription snapshots
 * Returns aggregated metrics for subscriptions at a point in time
 */
export async function getSubscriptionCohortMetrics(
  personIds: string[],
  snapshotDate: string
): Promise<{
  total_subscriptions: number;
  active_subscriptions: number;
  total_mrr_cents: number;
  churned_count: number;
  reactivated_count: number;
}> {
  const { data, error } = await supabase
    .from('subscription_snapshots')
    .select(
      'status, mrr_cents, churn_status',
      { count: 'exact' }
    )
    .in('person_id', personIds)
    .eq('snapshot_date', snapshotDate);

  if (error) {
    throw new Error(`Failed to get cohort metrics: ${error.message}`);
  }

  const snapshots = (data || []) as any[];

  return {
    total_subscriptions: snapshots.length,
    active_subscriptions: snapshots.filter(
      (s) => s.status === 'active'
    ).length,
    total_mrr_cents: snapshots.reduce((sum, s) => sum + (s.mrr_cents || 0), 0),
    churned_count: snapshots.filter((s) => s.churn_status === 'churned').length,
    reactivated_count: snapshots.filter(
      (s) => s.churn_status === 'reactivated'
    ).length,
  };
}

/**
 * Get MRR trend over time
 */
export async function getMrrTrend(
  subscriptionId: string,
  days: number = 90
): Promise<Array<{ date: string; mrr_cents: number }>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('subscription_snapshots')
    .select('snapshot_date, mrr_cents')
    .eq('subscription_id', subscriptionId)
    .gte('snapshot_date', startDate.toISOString().split('T')[0])
    .order('snapshot_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to get MRR trend: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    date: row.snapshot_date,
    mrr_cents: row.mrr_cents,
  }));
}

/**
 * Get churn summary for a person
 */
export async function getPersonChurnSummary(
  personId: string
): Promise<{
  total_churned: number;
  total_reactivated: number;
  current_subscriptions: number;
  active_subscriptions: number;
  total_mrr_cents: number;
}> {
  const { data, error } = await supabase
    .from('subscription_snapshots')
    .select('status, churn_status, mrr_cents, is_current');

  if (error) {
    throw new Error(`Failed to get churn summary: ${error.message}`);
  }

  const snapshots = (data || []).filter((s: any) => s.person_id === personId);

  const currentSnapshots = snapshots.filter((s: any) => s.is_current);

  return {
    total_churned: snapshots.filter((s: any) => s.churn_status === 'churned')
      .length,
    total_reactivated: snapshots.filter((s: any) => s.churn_status === 'reactivated')
      .length,
    current_subscriptions: currentSnapshots.length,
    active_subscriptions: currentSnapshots.filter((s: any) => s.status === 'active')
      .length,
    total_mrr_cents: currentSnapshots.reduce(
      (sum: number, s: any) => sum + (s.mrr_cents || 0),
      0
    ),
  };
}
