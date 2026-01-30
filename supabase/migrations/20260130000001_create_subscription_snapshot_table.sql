-- GDP-008: Subscription Snapshot Table
-- Stores point-in-time snapshots of subscription state for churn/expansion tracking

CREATE TABLE IF NOT EXISTS subscription_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,

  -- Snapshot state
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete')),
  mrr_cents INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Lifecycle dates
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  canceled_at TIMESTAMP,
  ended_at TIMESTAMP,

  -- Revenue changes
  mrr_change_cents INTEGER,
  churn_status TEXT CHECK (churn_status IS NULL OR churn_status IN ('active', 'churned', 'reactivated')),
  churn_reason TEXT,

  -- Snapshot timing
  snapshot_date DATE NOT NULL,
  snapshot_period TEXT NOT NULL CHECK (snapshot_period IN ('daily', 'monthly')),
  is_current BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Indexes
  CONSTRAINT subscription_snapshot_unique_current
    UNIQUE (subscription_id, is_current)
    WHERE is_current = true
);

CREATE INDEX IF NOT EXISTS idx_subscription_snapshots_person_id
  ON subscription_snapshots(person_id);

CREATE INDEX IF NOT EXISTS idx_subscription_snapshots_subscription_id
  ON subscription_snapshots(subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_snapshots_snapshot_date
  ON subscription_snapshots(snapshot_date);

CREATE INDEX IF NOT EXISTS idx_subscription_snapshots_is_current
  ON subscription_snapshots(is_current)
  WHERE is_current = true;

CREATE INDEX IF NOT EXISTS idx_subscription_snapshots_churn_status
  ON subscription_snapshots(churn_status)
  WHERE churn_status IS NOT NULL;

-- Helper function to get latest snapshot for a subscription
CREATE OR REPLACE FUNCTION get_latest_subscription_snapshot(sub_id UUID)
RETURNS subscription_snapshots AS $$
  SELECT * FROM subscription_snapshots
  WHERE subscription_id = sub_id AND is_current = true
  LIMIT 1
$$ LANGUAGE SQL IMMUTABLE;

-- Helper function to mark old snapshots as non-current
CREATE OR REPLACE FUNCTION mark_old_snapshots_as_inactive(sub_id UUID)
RETURNS void AS $$
  UPDATE subscription_snapshots
  SET is_current = false
  WHERE subscription_id = sub_id AND is_current = true
$$ LANGUAGE SQL;

-- Helper function to calculate churn status based on status change
CREATE OR REPLACE FUNCTION calculate_churn_status(
  old_status TEXT,
  new_status TEXT,
  old_mrr INTEGER,
  new_mrr INTEGER
)
RETURNS TEXT AS $$
BEGIN
  IF old_status = 'active' AND new_status IN ('canceled', 'past_due', 'unpaid') THEN
    RETURN 'churned';
  ELSIF old_status IN ('canceled', 'past_due', 'unpaid') AND new_status = 'active' THEN
    RETURN 'reactivated';
  ELSIF old_status = 'active' AND new_status = 'active' AND new_mrr > old_mrr THEN
    RETURN 'active'; -- Expansion
  ELSIF old_status = 'active' AND new_status = 'active' AND new_mrr < old_mrr THEN
    RETURN 'active'; -- Contraction
  ELSE
    RETURN 'active';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscription_snapshots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subscription_snapshots_updated_at
BEFORE UPDATE ON subscription_snapshots
FOR EACH ROW
EXECUTE FUNCTION update_subscription_snapshots_updated_at();
