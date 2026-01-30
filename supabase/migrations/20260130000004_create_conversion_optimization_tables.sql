/**
 * META-008: Conversion Optimization
 *
 * Creates tables for tracking and optimizing Meta conversions
 */

-- Conversion events
-- Tracks conversion events (purchases, signups, etc.) for optimization
CREATE TABLE IF NOT EXISTS conversion_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  person_id UUID REFERENCES person(id) ON DELETE CASCADE,
  event_id UUID REFERENCES event(id) ON DELETE CASCADE,

  -- Conversion metadata
  conversion_type TEXT NOT NULL, -- 'purchase', 'signup', 'video_render', 'trial_start'
  conversion_source TEXT NOT NULL, -- 'pixel', 'capi', 'webhook'

  -- Conversion value
  value_cents INTEGER, -- Value in cents (for purchases)
  currency TEXT DEFAULT 'USD',

  -- Attribution
  campaign_id TEXT,
  ad_set_id TEXT,
  ad_id TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  utm_medium TEXT,
  utm_content TEXT,

  -- Device & browser info
  device_type TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  city TEXT,

  -- Properties
  properties JSONB,

  -- Meta optimization
  meta_pixel_id TEXT,
  meta_conversion_id TEXT,
  is_optimized BOOLEAN DEFAULT false,

  -- Timestamps
  conversion_time TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Conversion funnels
-- Tracks sequences of events leading to conversion
CREATE TABLE IF NOT EXISTS conversion_funnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,

  -- Funnel definition
  funnel_name TEXT NOT NULL, -- 'signup_to_purchase', 'view_to_render', etc.

  -- Events in funnel
  total_steps INTEGER,
  completed_steps INTEGER,
  completion_percentage NUMERIC,

  -- Conversion status
  is_converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,

  -- Time to conversion
  total_time_seconds INTEGER, -- Time from start to conversion

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Funnel steps
-- Individual steps within a conversion funnel
CREATE TABLE IF NOT EXISTS funnel_step (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  funnel_id UUID NOT NULL REFERENCES conversion_funnel(id) ON DELETE CASCADE,
  event_id UUID REFERENCES event(id) ON DELETE SET NULL,

  -- Step metadata
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL, -- 'view_landing', 'signup_start', 'submit_form', etc.
  expected_event_name TEXT,

  -- Status
  is_completed BOOLEAN DEFAULT false,
  is_skipped BOOLEAN DEFAULT false,

  -- Timing
  completed_at TIMESTAMPTZ,
  skipped_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Conversion optimization rules
-- Rules for optimizing conversions based on events
CREATE TABLE IF NOT EXISTS conversion_optimization_rule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Rule metadata
  name TEXT NOT NULL UNIQUE,
  description TEXT,

  -- Trigger condition
  trigger_event TEXT NOT NULL, -- Event name that triggers optimization
  trigger_type TEXT DEFAULT 'event', -- 'event', 'funnel', 'audience'

  -- Optimization action
  action_type TEXT NOT NULL, -- 'send_to_meta', 'track_value', 'create_audience'
  action_config JSONB NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metrics
  total_triggered INTEGER DEFAULT 0,
  total_optimized INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Conversion metrics/analytics
-- Tracks conversion performance metrics
CREATE TABLE IF NOT EXISTS conversion_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  person_id UUID REFERENCES person(id) ON DELETE CASCADE,
  campaign_id TEXT,

  -- Metrics
  total_conversions INTEGER DEFAULT 0,
  total_value_cents INTEGER DEFAULT 0,
  average_value_cents INTEGER,

  -- Conversion rates
  conversion_rate NUMERIC, -- Percentage
  repeat_customer_rate NUMERIC,

  -- Funnel metrics
  total_funnel_starts INTEGER DEFAULT 0,
  total_funnel_completions INTEGER DEFAULT 0,
  funnel_completion_rate NUMERIC,
  average_funnel_time_seconds INTEGER,

  -- Attribution
  last_click_to_conversion_hours INTEGER,
  attribution_model TEXT, -- 'first_touch', 'last_touch', 'multi_touch'

  -- Optimization status
  is_optimized BOOLEAN DEFAULT false,
  optimization_status TEXT DEFAULT 'pending', -- pending, optimizing, optimized, failed

  -- Period (daily, weekly, monthly)
  period_date DATE,
  period_type TEXT DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_conversion_event_person_id ON conversion_event(person_id);
CREATE INDEX idx_conversion_event_event_id ON conversion_event(event_id);
CREATE INDEX idx_conversion_event_conversion_type ON conversion_event(conversion_type);
CREATE INDEX idx_conversion_event_conversion_source ON conversion_event(conversion_source);
CREATE INDEX idx_conversion_event_conversion_time ON conversion_event(conversion_time);
CREATE INDEX idx_conversion_event_is_optimized ON conversion_event(is_optimized);
CREATE INDEX idx_conversion_event_campaign_id ON conversion_event(campaign_id);

CREATE INDEX idx_conversion_funnel_person_id ON conversion_funnel(person_id);
CREATE INDEX idx_conversion_funnel_funnel_name ON conversion_funnel(funnel_name);
CREATE INDEX idx_conversion_funnel_is_converted ON conversion_funnel(is_converted);
CREATE INDEX idx_conversion_funnel_started_at ON conversion_funnel(started_at);

CREATE INDEX idx_funnel_step_funnel_id ON funnel_step(funnel_id);
CREATE INDEX idx_funnel_step_event_id ON funnel_step(event_id);
CREATE INDEX idx_funnel_step_is_completed ON funnel_step(is_completed);

CREATE INDEX idx_conversion_optimization_rule_trigger_event ON conversion_optimization_rule(trigger_event);
CREATE INDEX idx_conversion_optimization_rule_is_active ON conversion_optimization_rule(is_active);

CREATE INDEX idx_conversion_metrics_person_id ON conversion_metrics(person_id);
CREATE INDEX idx_conversion_metrics_campaign_id ON conversion_metrics(campaign_id);
CREATE INDEX idx_conversion_metrics_period_date ON conversion_metrics(period_date);
CREATE INDEX idx_conversion_metrics_is_optimized ON conversion_metrics(is_optimized);

-- Function to track conversion event
CREATE OR REPLACE FUNCTION track_conversion_event(
  p_person_id UUID,
  p_event_id UUID,
  p_conversion_type TEXT,
  p_conversion_source TEXT,
  p_value_cents INTEGER DEFAULT NULL,
  p_currency TEXT DEFAULT 'USD',
  p_properties JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_conversion_id UUID;
BEGIN
  INSERT INTO conversion_event (
    person_id,
    event_id,
    conversion_type,
    conversion_source,
    value_cents,
    currency,
    properties,
    conversion_time
  ) VALUES (
    p_person_id,
    p_event_id,
    p_conversion_type,
    p_conversion_source,
    p_value_cents,
    p_currency,
    p_properties,
    now()
  )
  RETURNING id INTO v_conversion_id;

  -- Update conversion metrics
  PERFORM update_conversion_metrics(p_person_id);

  RETURN v_conversion_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update conversion metrics
CREATE OR REPLACE FUNCTION update_conversion_metrics(p_person_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update or insert daily metrics for person
  INSERT INTO conversion_metrics (
    person_id,
    total_conversions,
    total_value_cents,
    period_date,
    period_type,
    created_at
  )
  SELECT
    p_person_id,
    COUNT(*),
    COALESCE(SUM(value_cents), 0),
    CURRENT_DATE,
    'daily',
    now()
  FROM conversion_event
  WHERE person_id = p_person_id
  AND DATE(conversion_time) = CURRENT_DATE
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to get conversion funnel stats
CREATE OR REPLACE FUNCTION get_funnel_stats(p_funnel_name TEXT)
RETURNS TABLE(
  total_started BIGINT,
  total_converted BIGINT,
  conversion_rate NUMERIC,
  average_time_seconds INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE is_converted = true)::BIGINT,
    (COUNT(*) FILTER (WHERE is_converted = true)::NUMERIC / COUNT(*) * 100),
    AVG(EXTRACT(EPOCH FROM (converted_at - started_at)))::INTEGER
  FROM conversion_funnel
  WHERE funnel_name = p_funnel_name
  AND started_at > now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Trigger to track conversions automatically
CREATE OR REPLACE FUNCTION trigger_conversion_tracking()
RETURNS TRIGGER AS $$
BEGIN
  -- Track video render conversions
  IF NEW.event_name = 'video_rendered' THEN
    PERFORM track_conversion_event(
      NEW.person_id,
      NEW.id,
      'video_render',
      NEW.event_source,
      NULL
    );
  END IF;

  -- Track purchase conversions
  IF NEW.event_name = 'purchase_completed' THEN
    PERFORM track_conversion_event(
      NEW.person_id,
      NEW.id,
      'purchase',
      NEW.event_source,
      NEW.revenue_cents,
      NEW.currency
    );
  END IF;

  -- Track subscription conversions
  IF NEW.event_name LIKE 'subscription.%' THEN
    PERFORM track_conversion_event(
      NEW.person_id,
      NEW.id,
      'subscription',
      NEW.event_source,
      NEW.mrr_cents
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversion_tracking_on_event
AFTER INSERT ON event
FOR EACH ROW
EXECUTE FUNCTION trigger_conversion_tracking();
