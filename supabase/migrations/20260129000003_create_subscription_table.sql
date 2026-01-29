-- GDP-001: Supabase Schema Setup - Subscription Table
-- This migration creates the subscription snapshot table for Stripe subscriptions

-- Create subscription table (current subscription status)
CREATE TABLE subscription (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,

  -- Stripe subscription data
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT,

  -- Subscription details
  plan_id TEXT NOT NULL,
  plan_name TEXT,
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete'

  -- Pricing
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  interval TEXT NOT NULL, -- 'month', 'year'
  mrr_cents INTEGER, -- Monthly Recurring Revenue normalized to cents/month

  -- Lifecycle dates
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  canceled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for subscription table
CREATE INDEX idx_subscription_person_id ON subscription(person_id);
CREATE INDEX idx_subscription_stripe_subscription_id ON subscription(stripe_subscription_id);
CREATE INDEX idx_subscription_stripe_customer_id ON subscription(stripe_customer_id);
CREATE INDEX idx_subscription_status ON subscription(status);
CREATE INDEX idx_subscription_created_at ON subscription(created_at);
CREATE INDEX idx_subscription_current_period_end ON subscription(current_period_end);

-- Trigger to auto-update updated_at on subscription table
CREATE TRIGGER update_subscription_updated_at
  BEFORE UPDATE ON subscription
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE subscription IS 'Current subscription status for each person from Stripe';
COMMENT ON COLUMN subscription.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN subscription.status IS 'Subscription status: active, canceled, past_due, unpaid, trialing, incomplete';
COMMENT ON COLUMN subscription.mrr_cents IS 'Monthly Recurring Revenue normalized to cents per month';
COMMENT ON COLUMN subscription.current_period_end IS 'End of current billing period';
