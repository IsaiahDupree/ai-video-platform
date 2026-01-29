-- GDP-001: Supabase Schema Setup - Unified Events Table
-- This migration creates the unified event tracking table

-- Create event table (normalized events from all sources)
CREATE TABLE event (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID REFERENCES person(id) ON DELETE SET NULL,

  -- Event identification
  event_name TEXT NOT NULL,
  event_type TEXT, -- 'acquisition', 'activation', 'core_value', 'monetization', 'retention'
  event_source TEXT NOT NULL, -- 'client', 'server', 'pixel', 'capi', 'posthog', 'email', 'stripe'

  -- Event deduplication
  event_id TEXT, -- Unique event ID for deduplication (e.g., Meta Pixel/CAPI event_id)

  -- Session and page context
  session_id TEXT,
  page_url TEXT,
  page_title TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  -- Device and browser
  user_agent TEXT,
  ip_address INET,
  browser TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  os TEXT,
  country TEXT,
  city TEXT,

  -- Event properties (flexible JSONB for event-specific data)
  properties JSONB DEFAULT '{}'::jsonb,

  -- Email-specific fields (for email events from Resend)
  email_id TEXT, -- Resend email ID
  email_subject TEXT,
  email_type TEXT, -- 'delivered', 'opened', 'clicked', 'bounced', 'complained'
  email_link_url TEXT, -- For click events

  -- Subscription-specific fields (for Stripe events)
  subscription_id TEXT,
  subscription_status TEXT,
  plan_id TEXT,
  mrr_cents INTEGER,

  -- Revenue tracking
  revenue_cents INTEGER,
  currency TEXT DEFAULT 'USD',

  -- Timestamps
  event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for event table
CREATE INDEX idx_event_person_id ON event(person_id) WHERE person_id IS NOT NULL;
CREATE INDEX idx_event_event_name ON event(event_name);
CREATE INDEX idx_event_event_type ON event(event_type) WHERE event_type IS NOT NULL;
CREATE INDEX idx_event_event_source ON event(event_source);
CREATE INDEX idx_event_event_id ON event(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_event_event_time ON event(event_time);
CREATE INDEX idx_event_created_at ON event(created_at);
CREATE INDEX idx_event_session_id ON event(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_event_email_id ON event(email_id) WHERE email_id IS NOT NULL;
CREATE INDEX idx_event_subscription_id ON event(subscription_id) WHERE subscription_id IS NOT NULL;
CREATE INDEX idx_event_properties ON event USING gin(properties);

-- Unique constraint for event deduplication
CREATE UNIQUE INDEX idx_event_dedup ON event(event_id, event_source) WHERE event_id IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE event IS 'Unified event tracking table for all events from client, server, pixel, CAPI, email, and Stripe';
COMMENT ON COLUMN event.event_id IS 'Unique event ID for deduplication across sources (e.g., Meta Pixel and CAPI use same event_id)';
COMMENT ON COLUMN event.event_source IS 'Source of event: client, server, pixel, capi, posthog, email, stripe';
COMMENT ON COLUMN event.properties IS 'Flexible JSONB field for event-specific custom properties';
COMMENT ON COLUMN event.email_id IS 'Resend email ID for email event tracking';
COMMENT ON COLUMN event.subscription_id IS 'Stripe subscription ID for subscription events';
COMMENT ON COLUMN event.revenue_cents IS 'Revenue amount in cents for purchase/subscription events';
