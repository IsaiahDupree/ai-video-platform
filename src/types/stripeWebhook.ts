/**
 * Stripe Webhook Types
 * TypeScript types for Stripe webhook events
 * Used by GDP-007: Stripe Webhook Integration
 */

/**
 * Stripe webhook event types we handle
 */
export enum StripeWebhookEventType {
  // Customer events
  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_UPDATED = 'customer.updated',
  CUSTOMER_DELETED = 'customer.deleted',

  // Subscription events
  CUSTOMER_SUBSCRIPTION_CREATED = 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED = 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED = 'customer.subscription.deleted',
  CUSTOMER_SUBSCRIPTION_TRIAL_WILL_END = 'customer.subscription.trial_will_end',

  // Invoice events
  INVOICE_CREATED = 'invoice.created',
  INVOICE_FINALIZED = 'invoice.finalized',
  INVOICE_PAYMENT_SUCCEEDED = 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED = 'invoice.payment_failed',
  INVOICE_PAYMENT_ACTION_REQUIRED = 'invoice.payment_action_required',
  INVOICE_UPCOMING = 'invoice.upcoming',

  // Charge events
  CHARGE_SUCCEEDED = 'charge.succeeded',
  CHARGE_FAILED = 'charge.failed',
  CHARGE_REFUNDED = 'charge.refunded',
  CHARGE_DISPUTE_CREATED = 'charge.dispute.created',

  // Payment intent events
  PAYMENT_INTENT_SUCCEEDED = 'payment_intent.succeeded',
  PAYMENT_INTENT_PAYMENT_FAILED = 'payment_intent.payment_failed',
}

/**
 * Stripe subscription status
 */
export type StripeSubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired';

/**
 * Stripe webhook event structure
 */
export interface StripeWebhookEvent {
  id: string;
  object: 'event';
  api_version: string;
  created: number;
  data: {
    object: Record<string, any>;
    previous_attributes?: Record<string, any>;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string | null;
    idempotency_key: string | null;
  };
  type: string;
}

/**
 * Stripe customer object
 */
export interface StripeCustomer {
  id: string;
  object: 'customer';
  address: string | null;
  balance: number;
  created: number;
  currency: string | null;
  default_source: string | null;
  delinquent: boolean;
  description: string | null;
  discount: string | null;
  email: string | null;
  invoice_prefix: string;
  invoice_settings?: {
    custom_fields: Array<{ name: string; value: string }> | null;
    default_payment_method: string | null;
    footer: string | null;
  };
  livemode: boolean;
  metadata: Record<string, any>;
  name: string | null;
  phone: string | null;
  preferred_locales: string[];
  shipping: string | null;
  tax_exempt: 'none' | 'exempt' | 'reverse';
  test_clock: string | null;
}

/**
 * Stripe subscription object
 */
export interface StripeSubscription {
  id: string;
  object: 'subscription';
  application: string | null;
  application_fee_percent: number | null;
  automatic_tax: {
    enabled: boolean;
  };
  billing_cycle_anchor: number;
  billing_thresholds: {
    amount_gte: number | null;
    reset_billing_cycle_anchor: boolean;
  } | null;
  cancel_at: number | null;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  collection_method: 'charge_automatically' | 'send_invoice';
  created: number;
  currency: string;
  current_period_end: number;
  current_period_start: number;
  customer: string;
  days_until_due: number | null;
  default_payment_method: string | null;
  default_source: string | null;
  default_tax_rates: string[];
  description: string | null;
  discount: string | null;
  ended_at: number | null;
  items: {
    object: 'list';
    data: Array<{
      id: string;
      billing_thresholds: Record<string, any> | null;
      created: number;
      currency: string;
      custom_price_data?: Record<string, any>;
      metadata: Record<string, any>;
      price: {
        id: string;
        object: 'price';
        active: boolean;
        billing_scheme: 'per_unit' | 'tiered';
        created: number;
        currency: string;
        custom_unit_amount: Record<string, any> | null;
        livemode: boolean;
        lookup_key: string | null;
        metadata: Record<string, any>;
        nickname: string | null;
        product: string;
        recurring: {
          aggregate_usage: string | null;
          interval: 'day' | 'month' | 'week' | 'year';
          interval_count: number;
          meter?: string;
          trial_period_days: number | null;
          usage_type: 'licensed' | 'metered';
        } | null;
        tax_behavior: 'exclusive' | 'inclusive' | 'unspecified';
        tiers_mode: 'graduated' | 'volume' | null;
        transform_quantity: Record<string, any> | null;
        type: 'one_time' | 'recurring';
        unit_amount: number | null;
        unit_amount_decimal: string | null;
      };
      proration_behavior: string;
      proration_date: number;
      quantity: number | null;
      subscription: string;
      subscription_item: string;
      tax_rates: string[];
    }>;
    has_more: boolean;
    url: string;
  };
  latest_invoice: string | null;
  livemode: boolean;
  metadata: Record<string, any>;
  next_pending_invoice_item_invoice: number | null;
  on_behalf_of: string | null;
  pause_at: number | null;
  paused_at: number | null;
  payment_settings: {
    payment_method_options: Record<string, any> | null;
    payment_method_types: string[] | null;
    save_default_payment_method: 'off' | 'on_subscription' | null;
  } | null;
  pending_invoice_item_interval: {
    interval: 'day' | 'month' | 'week' | 'year';
    interval_count: number;
  } | null;
  pending_setup_intent: string | null;
  pending_update: {
    billing_cycle_anchor?: number;
    expires_at: number;
    subscription_items?: Array<Record<string, any>>;
    trial_end?: number;
  } | null;
  schedule: string | null;
  start_date: number;
  status: StripeSubscriptionStatus;
  test_clock: string | null;
  transfer_data: {
    amount_percent: number | null;
    destination: string;
  } | null;
  trial_end: number | null;
  trial_settings: {
    end_behavior: {
      missing_payment_method: 'cancel' | 'create_invoice' | 'off';
    };
  } | null;
  trial_start: number | null;
}

/**
 * Stripe invoice object (partial)
 */
export interface StripeInvoice {
  id: string;
  object: 'invoice';
  account_country: string;
  account_name: string;
  account_tax_ids: string[] | null;
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  application: string | null;
  application_fee_amount: number | null;
  attempt_count: number;
  attempted: boolean;
  auto_advance: boolean;
  automatic_tax: {
    enabled: boolean;
    status: 'complete' | 'failed' | 'requires_location_inputs' | null;
  };
  billing_reason: string;
  charge: string | null;
  collection_method: 'charge_automatically' | 'send_invoice';
  created: number;
  currency: string;
  custom_fields: Array<{ name: string; value: string }> | null;
  customer: string | null;
  customer_address: Record<string, any> | null;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_shipping: Record<string, any> | null;
  customer_tax_exempt: 'exempt' | 'none' | 'reverse';
  customer_tax_ids: string[];
  default_payment_method: string | null;
  default_source: string | null;
  default_tax_rates: string[];
  description: string | null;
  discount: string | null;
  discounts: string[];
  due_date: number | null;
  effective_at: number | null;
  email: string | null;
  ending_balance: number | null;
  footer: string | null;
  from_invoice: string | null;
  hosted_invoice_url: string | null;
  id: string;
  invoice_pdf: string | null;
  last_finalization_error: Record<string, any> | null;
  latest_revision: string | null;
  lines: {
    object: 'list';
    data: Array<Record<string, any>>;
    has_more: boolean;
    url: string;
  };
  livemode: boolean;
  metadata: Record<string, any>;
  next_payment_attempt: number | null;
  number: string | null;
  on_behalf_of: string | null;
  paid: boolean;
  paid_out_of_band: boolean;
  payment_intent: string | null;
  payment_settings: {
    custom_fields: Array<{ name: string; value: string }> | null;
    default_mandate: string | null;
    footer: string | null;
    payment_method_options: Record<string, any> | null;
    payment_method_types: string[] | null;
  } | null;
  period_end: number;
  period_start: number;
  post_payment_actions: {
    invoices_to_void: string[];
    scheduled_cancellations: Array<Record<string, any>>;
  } | null;
  previous_payment_intent: string | null;
  quote: string | null;
  receipt_number: string | null;
  rendering: {
    amount_due_in_words: string;
    pdf: Record<string, any> | null;
  } | null;
  rendering_options: Record<string, any> | null;
  revision_number: number | null;
  scheduled_header_settings: Record<string, any> | null;
  starting_balance: number;
  statement_descriptor: string | null;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  status_transitions: {
    finalized_at: number | null;
    marked_uncollectible_at: number | null;
    paid_at: number | null;
    voided_at: number | null;
  };
  subscription: string | null;
  subtotal: number;
  subtotal_excluding_tax: number | null;
  tax: number | null;
  test_clock: string | null;
  threshold_reason: {
    amount_gte: number | null;
    item_reasons: Array<Record<string, any>>;
  } | null;
  total: number;
  total_discount_amounts: Array<{
    amount: number;
    discount: string;
  }>;
  total_excluding_tax: number | null;
  total_tax_amounts: Array<Record<string, any>>;
  transfer_data: {
    amount: number | null;
    destination: string;
  } | null;
  transfer_data_destination: string | null;
  transfer_enabled: boolean;
  url: string | null;
  verify_with_microseconds: boolean;
}

/**
 * Stripe charge object (partial)
 */
export interface StripeCharge {
  id: string;
  object: 'charge';
  amount: number;
  amount_captured: number;
  amount_refunded: number;
  application: string | null;
  application_fee: string | null;
  application_fee_amount: number | null;
  balance_transaction: string | null;
  billing_details: Record<string, any> | null;
  calculated_statement_descriptor: string | null;
  captured: boolean;
  created: number;
  currency: string;
  customer: string | null;
  description: string | null;
  destination: string | null;
  dispute: string | null;
  disputed: boolean;
  failure_balance_transaction: string | null;
  failure_code: string | null;
  failure_message: string | null;
  fraud_details: {
    stripe_report: 'fraudulent' | 'safe' | null;
    user_report: 'fraudulent' | 'safe' | null;
  } | null;
  invoice: string | null;
  livemode: boolean;
  metadata: Record<string, any>;
  outcome: {
    network_status: string;
    reason: string | null;
    risk_level: 'normal' | 'elevated' | 'highest';
    risk_score: number;
    seller_message: string;
    type: string;
  };
  paid: boolean;
  payment_intent: string | null;
  payment_method: string | null;
  payment_method_details: Record<string, any>;
  receipt_email: string | null;
  receipt_number: string | null;
  receipt_url: string | null;
  refunded: boolean;
  refunds: {
    object: 'list';
    data: Array<Record<string, any>>;
    has_more: boolean;
    total_count: number;
    url: string;
  };
  review: string | null;
  shipping: Record<string, any> | null;
  source: Record<string, any>;
  source_transfer: string | null;
  statement_descriptor: string | null;
  statement_descriptor_suffix: string | null;
  status: 'succeeded' | 'failed' | 'pending';
  transfer_data: {
    amount: number | null;
    destination: string;
  } | null;
  transfer_group: string | null;
}

/**
 * Parsed Stripe webhook event
 */
export interface ParsedStripeEvent {
  event_id: string;
  event_type: StripeWebhookEventType;
  created_at: number;
  customer_id: string | null;
  subscription_id?: string;
  subscription_status?: StripeSubscriptionStatus;
  email?: string;
  currency?: string;
  amount_cents?: number;
  plan_id?: string;
  plan_name?: string;
  interval?: 'month' | 'year';
  trial_start?: number;
  trial_end?: number;
  current_period_start?: number;
  current_period_end?: number;
  canceled_at?: number;
  ended_at?: number;
  invoice_id?: string;
  invoice_status?: string;
  charge_id?: string;
  payment_status?: string;
  error_message?: string;
  object_type: 'subscription' | 'customer' | 'invoice' | 'charge' | 'payment_intent';
}
