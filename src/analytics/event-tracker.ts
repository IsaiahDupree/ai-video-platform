/**
 * Event Tracker - Higher-level event tracking helpers
 *
 * Specialized tracking functions for Remotion VideoStudio use cases:
 * - Acquisition events (TRACK-002)
 * - Activation events (TRACK-002, TRACK-003)
 * - Core value events (TRACK-004)
 * - Monetization events (TRACK-005)
 * - Retention/churn events
 */

import { getTracker } from './tracking-sdk';

// =============================================================================
// TRACK-002: Acquisition Event Tracking
// =============================================================================

/**
 * Track when user lands on the website/marketing page
 */
export function trackLandingView(properties?: {
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  referrer?: string;
  pageUrl?: string;
}): void {
  getTracker().track('landing_view', properties || {}, {
    category: 'acquisition'
  });
}

/**
 * Track when user starts the signup process
 */
export function trackSignupStarted(properties?: {
  form_type?: string;
  source?: string;
}): void {
  getTracker().track('signup_started', properties || {}, {
    category: 'acquisition'
  });
}

/**
 * Track when signup is completed
 */
export function trackSignupCompleted(email: string, properties?: {
  signup_duration_ms?: number;
  verification_method?: string;
  referrer?: string;
}): void {
  getTracker().recordSignup(email, properties);
}

/**
 * Track when user logs in
 */
export function trackLoginCompleted(email: string): void {
  getTracker().recordLogin(email);
}

// =============================================================================
// TRACK-003: Activation Event Tracking
// =============================================================================

/**
 * Track when user creates their first video/brief
 */
export function trackFirstVideoCreated(briefId: string, properties?: {
  template?: string;
  duration_sec?: number;
  source?: string;
}): void {
  getTracker().recordFirstVideo(briefId, properties?.template || 'default');

  // Also record as general event
  getTracker().track('first_video_created', {
    brief_id: briefId,
    ...properties
  }, {
    category: 'activation'
  });
}

/**
 * Track when user completes their first render
 */
export function trackFirstRenderCompleted(properties?: {
  duration_ms?: number;
  format?: string;
  brief_id?: string;
  file_size_bytes?: number;
}): void {
  getTracker().recordFirstRender(properties?.duration_ms || 0, properties?.format || 'mp4');

  getTracker().track('first_render_completed', properties || {}, {
    category: 'activation'
  });
}

/**
 * Track when user downloads their first rendered video
 */
export function trackFirstExportDownloaded(properties?: {
  brief_id?: string;
  format?: string;
  destination?: 'download' | 'social';
  size_bytes?: number;
}): void {
  getTracker().track('first_export_downloaded', properties || {}, {
    category: 'activation'
  });
}

/**
 * Track when user discovers a new feature
 */
export function trackFeatureDiscovered(featureName: string, properties?: {
  feature_category?: string;
  source?: 'tutorial' | 'ui_exploration' | 'help' | 'onboarding';
}): void {
  getTracker().track('feature_discovered', {
    feature_name: featureName,
    ...properties
  }, {
    category: 'activation'
  });
}

// =============================================================================
// TRACK-004: Core Value Event Tracking
// =============================================================================

/**
 * Track when user creates a new video/brief
 */
export function trackVideoCreated(properties?: {
  brief_id?: string;
  template?: string;
  duration_sec?: number;
  content_type?: string;
}): void {
  getTracker().track('video_created', properties || {}, {
    category: 'core_value'
  });
}

/**
 * Track when video render completes successfully
 */
export function trackVideoRendered(properties?: {
  brief_id?: string;
  render_id?: string;
  duration_ms?: number;
  format?: string;
  resolution?: string;
  file_size_bytes?: number;
  quality_score?: number;
}): void {
  const renderId = properties?.render_id || `render_${Date.now()}`;
  const briefId = properties?.brief_id || 'unknown';

  getTracker().recordVideoRendered(briefId, renderId, properties);
}

/**
 * Track when user exports/downloads a video
 */
export function trackVideoExported(properties?: {
  brief_id?: string;
  export_id?: string;
  format?: string;
  destination?: 'download' | 'youtube' | 'tiktok' | 'instagram' | 'facebook';
  file_size_bytes?: number;
}): void {
  getTracker().track('video_exported', properties || {}, {
    category: 'core_value'
  });
}

/**
 * Track when batch render job starts
 */
export function trackBatchRenderStarted(properties?: {
  job_id?: string;
  video_count?: number;
  template?: string;
  estimated_duration_sec?: number;
}): void {
  getTracker().recordBatchRenderStarted(
    properties?.job_id || `job_${Date.now()}`,
    properties?.video_count || 1
  );
}

/**
 * Track when batch render completes
 */
export function trackBatchRenderCompleted(properties?: {
  job_id?: string;
  video_count?: number;
  duration_ms?: number;
  success_count?: number;
  failed_count?: number;
}): void {
  getTracker().recordBatchRenderCompleted(
    properties?.job_id || `job_${Date.now()}`,
    properties?.video_count || 1,
    properties?.duration_ms || 0
  );
}

/**
 * Track when AI asset (DALL-E) is generated
 */
export function trackAssetGenerated(properties?: {
  asset_type?: string;
  prompt?: string;
  brief_id?: string;
  generation_time_ms?: number;
}): void {
  getTracker().track('asset_generated', properties || {}, {
    category: 'core_value'
  });
}

/**
 * Track when voice cloning is completed
 */
export function trackVoiceCloned(properties?: {
  voice_id?: string;
  reference_duration_sec?: number;
  quality_score?: number;
}): void {
  getTracker().track('voice_cloned', properties || {}, {
    category: 'core_value'
  });
}

/**
 * Track when user uses a template
 */
export function trackTemplateUsed(properties?: {
  template_id?: string;
  template_name?: string;
  category?: string;
}): void {
  getTracker().track('template_used', properties || {}, {
    category: 'core_value'
  });
}

// =============================================================================
// TRACK-005: Monetization Event Tracking
// =============================================================================

/**
 * Track when pricing page is viewed
 */
export function trackUpgradeViewed(properties?: {
  plan_shown?: string;
  source?: string;
  utm_source?: string;
}): void {
  getTracker().track('upgrade_viewed', properties || {}, {
    category: 'monetization'
  });
}

/**
 * Track when checkout is initiated
 */
export function trackCheckoutStarted(properties?: {
  plan_id?: string;
  amount?: number;
  currency?: string;
  coupon?: string;
}): void {
  const amount = properties?.amount || 0;
  const planId = properties?.plan_id || 'unknown';

  getTracker().recordCheckoutStarted(planId, amount);

  getTracker().track('checkout_started', properties || {}, {
    category: 'monetization',
    revenue: amount
  });
}

/**
 * Track when user abandons checkout
 */
export function trackCheckoutAbandoned(properties?: {
  step_on_exit?: string;
  amount?: number;
  currency?: string;
  plan_id?: string;
  time_on_page_sec?: number;
}): void {
  getTracker().track('checkout_abandoned', properties || {}, {
    category: 'monetization'
  });
}

/**
 * Track successful purchase
 */
export function trackPurchaseCompleted(properties?: {
  order_id?: string;
  amount?: number;
  currency?: string;
  plan?: string;
  billing_cycle?: 'monthly' | 'annual';
  coupon?: string;
}): void {
  const orderId = properties?.order_id || `order_${Date.now()}`;
  const amount = properties?.amount || 0;
  const plan = properties?.plan || 'unknown';

  getTracker().recordPurchase(orderId, amount, plan);

  getTracker().track('purchase_completed', properties || {}, {
    category: 'monetization',
    revenue: amount
  });
}

/**
 * Track subscription renewal
 */
export function trackSubscriptionRenewal(properties?: {
  subscription_id?: string;
  amount?: number;
  currency?: string;
  plan?: string;
  previous_amount?: number;
}): void {
  const subscriptionId = properties?.subscription_id || `sub_${Date.now()}`;
  const amount = properties?.amount || 0;

  getTracker().recordSubscriptionRenewal(subscriptionId, amount);

  getTracker().track('subscription_renewal', properties || {}, {
    category: 'monetization',
    revenue: amount
  });
}

// =============================================================================
// Retention / Churn Tracking
// =============================================================================

/**
 * Track when subscription is cancelled
 */
export function trackSubscriptionCancelled(properties?: {
  subscription_id?: string;
  reason?: string;
  plan?: string;
  ltv?: number;
  months_active?: number;
}): void {
  getTracker().track('subscription_cancelled', properties || {}, {
    category: 'retention'
  });
}

/**
 * Track when user becomes inactive
 */
export function trackInactivityThreshold(properties?: {
  days_since_last_action?: number;
  last_action_date?: string;
  action_type?: string;
}): void {
  getTracker().track('inactive_threshold_reached', properties || {}, {
    category: 'retention'
  });
}

/**
 * Track when previously inactive user re-engages
 */
export function trackReEngagement(properties?: {
  days_since_inactive?: number;
  previous_last_action?: string;
  reengagement_action?: string;
}): void {
  getTracker().track('user_reengaged', properties || {}, {
    category: 'retention'
  });
}

/**
 * Track user lifecycle transitions
 */
export function trackLifecycleTransition(properties?: {
  from_status?: string;
  to_status?: string;
  trigger_event?: string;
  timestamp?: string;
}): void {
  getTracker().track('lifecycle_transition', properties || {}, {
    category: 'retention'
  });
}

// =============================================================================
// Advanced Tracking
// =============================================================================

/**
 * Track error events for quality monitoring
 */
export function trackError(properties?: {
  error_type?: string;
  error_message?: string;
  stack_trace?: string;
  context?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}): void {
  getTracker().track('error_occurred', properties || {}, {
    category: 'core_value'
  });
}

/**
 * Track when user opens help/documentation
 */
export function trackHelpAccessed(properties?: {
  help_topic?: string;
  help_type?: string;
  from_page?: string;
}): void {
  getTracker().track('help_accessed', properties || {}, {
    category: 'retention'
  });
}

/**
 * Track API usage for quota/billing
 */
export function trackApiUsage(properties?: {
  api_endpoint?: string;
  method?: string;
  response_time_ms?: number;
  quota_used?: number;
  quota_limit?: number;
}): void {
  getTracker().track('api_usage', properties || {}, {
    category: 'core_value'
  });
}

/**
 * Track session metrics
 */
export function trackSessionMetrics(properties?: {
  session_duration_sec?: number;
  pages_viewed?: number;
  events_tracked?: number;
  interactions?: number;
  bounce?: boolean;
}): void {
  getTracker().track('session_ended', properties || {}, {
    category: 'core_value'
  });
}

// =============================================================================
// Batch Event Submission
// =============================================================================

/**
 * Manually flush pending events
 */
export async function flushEvents(): Promise<void> {
  await getTracker().flush();
}

/**
 * Get current tracking session info
 */
export function getTrackingSessionInfo(): any {
  return getTracker().getSessionInfo();
}

// =============================================================================
// Testing Utilities
// =============================================================================

/**
 * Simulate a complete user journey (for testing)
 */
export async function simulateUserJourney(options?: {
  email?: string;
  template?: string;
  purchaseAmount?: number;
}): Promise<void> {
  const email = options?.email || `test_${Date.now()}@example.com`;
  const template = options?.template || 'tech_explainer';
  const purchaseAmount = options?.purchaseAmount || 99.99;

  // Acquisition
  trackLandingView({ utm_source: 'organic', utm_campaign: 'launch' });
  trackSignupStarted({ form_type: 'email' });
  trackSignupCompleted(email);

  // Activation
  const briefId = `brief_${Date.now()}`;
  trackFirstVideoCreated(briefId, { template });
  trackFirstRenderCompleted({ format: 'mp4', duration_ms: 45000 });
  trackFirstExportDownloaded({ format: 'mp4', destination: 'download' });

  // Core value
  trackVideoCreated({ brief_id: briefId, template });
  trackVideoRendered({ brief_id: briefId, format: 'mp4' });
  trackVideoExported({ brief_id: briefId, destination: 'youtube' });

  // Monetization
  trackUpgradeViewed({ plan_shown: 'pro' });
  trackCheckoutStarted({ plan_id: 'pro', amount: purchaseAmount });
  trackPurchaseCompleted({
    order_id: `order_${Date.now()}`,
    amount: purchaseAmount,
    plan: 'pro'
  });

  // Flush all events
  await flushEvents();
}

/**
 * Get mock event tracker for unit tests
 */
export function getTestEventTracker() {
  const events: any[] = [];

  return {
    track: (event: string, props?: any) => {
      events.push({ event, props, timestamp: new Date() });
    },
    getEvents: () => events,
    getEventsByType: (type: string) => events.filter(e => e.event === type),
    clear: () => {
      events.length = 0;
    },
    recordSnapshot: () => JSON.stringify(events)
  };
}
