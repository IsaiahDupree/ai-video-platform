/**
 * Growth Data Plane Types
 * TypeScript types for Supabase schema (GDP-001)
 */

// Person table - Canonical user record
export interface Person {
  id: string;

  // Identification
  email?: string;
  phone?: string;
  user_id?: string;

  // Profile data
  first_name?: string;
  last_name?: string;
  display_name?: string;

  // Location
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;

  // Tracking identifiers
  posthog_distinct_id?: string;
  meta_fbp?: string; // Facebook Browser ID (_fbp cookie)
  meta_fbc?: string; // Facebook Click ID (_fbc cookie)

  // Computed features
  total_events: number;
  active_days: number;
  total_renders: number;
  pricing_page_views: number;

  // Lifecycle
  first_seen_at: string; // ISO 8601 timestamp
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

// Identity link table - Maps various identifiers to person
export interface IdentityLink {
  id: string;
  person_id: string;

  // Identity type and value
  identity_type: IdentityType;
  identity_value: string;

  // Metadata
  source?: string; // 'signup', 'pixel', 'capi', 'posthog', etc.
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
}

export type IdentityType =
  | 'email'
  | 'phone'
  | 'user_id'
  | 'posthog_distinct_id'
  | 'anonymous_id'
  | 'meta_fbp'
  | 'meta_fbc'
  | 'session_id';

// Event table - Unified event tracking
export interface Event {
  id: string;
  person_id?: string;

  // Event identification
  event_name: string;
  event_type?: EventType;
  event_source: EventSource;

  // Event deduplication
  event_id?: string;

  // Session and page context
  session_id?: string;
  page_url?: string;
  page_title?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;

  // Device and browser
  user_agent?: string;
  ip_address?: string;
  browser?: string;
  device_type?: DeviceType;
  os?: string;
  country?: string;
  city?: string;

  // Event properties (flexible for event-specific data)
  properties?: Record<string, any>;

  // Email-specific fields
  email_id?: string;
  email_subject?: string;
  email_type?: EmailEventType;
  email_link_url?: string;

  // Subscription-specific fields
  subscription_id?: string;
  subscription_status?: string;
  plan_id?: string;
  mrr_cents?: number;

  // Revenue tracking
  revenue_cents?: number;
  currency?: string;

  // Timestamps
  event_time: string;
  created_at: string;
}

export type EventType =
  | 'acquisition' // Landing, signup started
  | 'activation' // First video created, first render
  | 'core_value' // Video rendered, batch completed
  | 'monetization' // Checkout started, purchase completed
  | 'retention'; // Return visit, feature discovery

export type EventSource =
  | 'client' // Browser tracking
  | 'server' // Server-side tracking
  | 'pixel' // Meta Pixel
  | 'capi' // Meta Conversions API
  | 'posthog' // PostHog
  | 'email' // Resend email events
  | 'stripe'; // Stripe webhooks

export type DeviceType = 'desktop' | 'mobile' | 'tablet';

export type EmailEventType =
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained';

// Subscription table - Current subscription status
export interface Subscription {
  id: string;
  person_id: string;

  // Stripe subscription data
  stripe_subscription_id: string;
  stripe_customer_id: string;
  stripe_price_id?: string;

  // Subscription details
  plan_id: string;
  plan_name?: string;
  status: SubscriptionStatus;

  // Pricing
  amount_cents: number;
  currency: string;
  interval: SubscriptionInterval;
  mrr_cents?: number;

  // Lifecycle dates
  trial_start?: string;
  trial_end?: string;
  current_period_start: string;
  current_period_end: string;
  canceled_at?: string;
  ended_at?: string;

  // Metadata
  metadata?: Record<string, any>;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'unpaid'
  | 'trialing'
  | 'incomplete';

export type SubscriptionInterval = 'month' | 'year';

// Subscription Snapshot - Point-in-time view of subscription state (GDP-008)
export interface SubscriptionSnapshot {
  id: string;
  subscription_id: string;
  person_id: string;

  // Snapshot state
  status: SubscriptionStatus;
  mrr_cents: number;
  amount_cents: number;
  currency: string;

  // Lifecycle dates
  current_period_start: string;
  current_period_end: string;
  canceled_at?: string;
  ended_at?: string;

  // Revenue changes from previous snapshot
  mrr_change_cents?: number; // Positive = expansion, negative = contraction
  churn_status?: 'active' | 'churned' | 'reactivated';
  churn_reason?: string;

  // Snapshot timing
  snapshot_date: string; // ISO 8601 date
  snapshot_period: 'daily' | 'monthly'; // Frequency of snapshot
  is_current: boolean; // Latest snapshot for this subscription

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface SubscriptionSnapshotInput {
  subscription_id: string;
  person_id: string;
  status: SubscriptionStatus;
  mrr_cents: number;
  amount_cents: number;
  currency: string;
  current_period_start: string;
  current_period_end: string;
  canceled_at?: string;
  ended_at?: string;
  mrr_change_cents?: number;
  churn_status?: 'active' | 'churned' | 'reactivated';
  churn_reason?: string;
}

// Helper function parameters
export interface FindOrCreatePersonParams {
  identity_type: IdentityType;
  identity_value: string;
  source?: string;
  email?: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
}

// Input types for creating records
export interface CreatePersonInput {
  email?: string;
  phone?: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
  posthog_distinct_id?: string;
  meta_fbp?: string;
  meta_fbc?: string;
}

export interface CreateEventInput {
  person_id?: string;
  event_name: string;
  event_type?: EventType;
  event_source: EventSource;
  event_id?: string;
  session_id?: string;
  page_url?: string;
  page_title?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  user_agent?: string;
  ip_address?: string;
  browser?: string;
  device_type?: DeviceType;
  os?: string;
  country?: string;
  city?: string;
  properties?: Record<string, any>;
  email_id?: string;
  email_subject?: string;
  email_type?: EmailEventType;
  email_link_url?: string;
  subscription_id?: string;
  subscription_status?: string;
  plan_id?: string;
  mrr_cents?: number;
  revenue_cents?: number;
  currency?: string;
  event_time?: string; // Defaults to NOW() if not provided
}

export interface CreateSubscriptionInput {
  person_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  stripe_price_id?: string;
  plan_id: string;
  plan_name?: string;
  status: SubscriptionStatus;
  amount_cents: number;
  currency?: string;
  interval: SubscriptionInterval;
  mrr_cents?: number;
  trial_start?: string;
  trial_end?: string;
  current_period_start: string;
  current_period_end: string;
  canceled_at?: string;
  ended_at?: string;
  metadata?: Record<string, any>;
}
