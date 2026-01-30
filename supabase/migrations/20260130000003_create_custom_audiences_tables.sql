/**
 * META-007: Custom Audiences Setup
 *
 * Creates tables for managing Meta custom audiences based on segments
 */

-- Custom audience definitions
-- Stores audience configurations mapped to segments
CREATE TABLE IF NOT EXISTS custom_audience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Audience metadata
  name TEXT NOT NULL UNIQUE,
  description TEXT,

  -- Meta integration
  meta_audience_id TEXT UNIQUE, -- Meta-assigned audience ID
  meta_business_account_id TEXT, -- Meta Business Account ID

  -- Segment mapping
  segment_id UUID REFERENCES segment(id) ON DELETE SET NULL,

  -- Audience type
  audience_type TEXT NOT NULL DEFAULT 'lookalike', -- lookalike, custom_list, engagement
  lookalike_country TEXT, -- For lookalike audiences (e.g., 'US', 'CA')
  lookalike_percentage INTEGER, -- 1-10 for lookalike size

  -- Sync configuration
  auto_sync BOOLEAN DEFAULT true,
  sync_interval_hours INTEGER DEFAULT 24,
  last_synced_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'pending', -- pending, syncing, active, failed

  -- Sync metadata
  total_synced INTEGER DEFAULT 0,
  sync_error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Audience membership sync
-- Tracks which persons are synced to which audiences
CREATE TABLE IF NOT EXISTS audience_member_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  audience_id UUID NOT NULL REFERENCES custom_audience(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,

  -- Sync status
  is_synced BOOLEAN DEFAULT true,

  -- Timestamps
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Audience sync log
-- Tracks all audience sync operations for auditing
CREATE TABLE IF NOT EXISTS audience_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  audience_id UUID NOT NULL REFERENCES custom_audience(id) ON DELETE CASCADE,

  -- Sync details
  sync_type TEXT NOT NULL, -- 'full', 'incremental', 'update'
  synced_count INTEGER,
  failed_count INTEGER,
  status TEXT NOT NULL, -- 'pending', 'in_progress', 'completed', 'failed'
  error_message TEXT,

  -- Timing
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,

  -- Metadata
  meta_response JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_custom_audience_is_active ON custom_audience(is_active);
CREATE INDEX idx_custom_audience_segment_id ON custom_audience(segment_id);
CREATE INDEX idx_custom_audience_meta_audience_id ON custom_audience(meta_audience_id);
CREATE INDEX idx_custom_audience_status ON custom_audience(status);
CREATE INDEX idx_custom_audience_last_synced_at ON custom_audience(last_synced_at);

CREATE INDEX idx_audience_member_sync_audience_id ON audience_member_sync(audience_id);
CREATE INDEX idx_audience_member_sync_person_id ON audience_member_sync(person_id);
CREATE INDEX idx_audience_member_sync_is_synced ON audience_member_sync(is_synced);
CREATE UNIQUE INDEX idx_audience_member_sync_unique ON audience_member_sync(audience_id, person_id);

CREATE INDEX idx_audience_sync_log_audience_id ON audience_sync_log(audience_id);
CREATE INDEX idx_audience_sync_log_status ON audience_sync_log(status);
CREATE INDEX idx_audience_sync_log_created_at ON audience_sync_log(created_at);

-- Function to sync audience members from segment
CREATE OR REPLACE FUNCTION sync_audience_members(
  p_audience_id UUID,
  p_sync_type TEXT DEFAULT 'full'
)
RETURNS TABLE(synced_count INTEGER, failed_count INTEGER) AS $$
DECLARE
  v_segment_id UUID;
  v_synced_count INTEGER := 0;
  v_failed_count INTEGER := 0;
  v_person RECORD;
BEGIN
  -- Get segment for this audience
  SELECT segment_id INTO v_segment_id
  FROM custom_audience
  WHERE id = p_audience_id;

  IF v_segment_id IS NULL THEN
    RAISE EXCEPTION 'Audience % not found or has no segment', p_audience_id;
  END IF;

  -- Clear previous syncs if full sync
  IF p_sync_type = 'full' THEN
    DELETE FROM audience_member_sync WHERE audience_id = p_audience_id;
  END IF;

  -- Get all members of the segment
  FOR v_person IN
    SELECT DISTINCT person.id
    FROM person
    JOIN segment_membership ON segment_membership.person_id = person.id
    WHERE segment_membership.segment_id = v_segment_id
    AND segment_membership.is_member = true
  LOOP
    BEGIN
      -- Insert or update sync record
      INSERT INTO audience_member_sync (audience_id, person_id, is_synced, synced_at)
      VALUES (p_audience_id, v_person.id, true, now())
      ON CONFLICT (audience_id, person_id) DO UPDATE
      SET is_synced = true, synced_at = now(), updated_at = now();

      v_synced_count := v_synced_count + 1;
    EXCEPTION WHEN OTHERS THEN
      v_failed_count := v_failed_count + 1;
    END;
  END LOOP;

  -- Update audience status
  UPDATE custom_audience
  SET last_synced_at = now(),
      total_synced = v_synced_count,
      status = 'active',
      updated_at = now()
  WHERE id = p_audience_id;

  RETURN QUERY SELECT v_synced_count, v_failed_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get audience members for export
CREATE OR REPLACE FUNCTION get_audience_members_for_export(
  p_audience_id UUID
)
RETURNS TABLE(
  person_id UUID,
  email TEXT,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  country TEXT,
  city TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    person.id,
    person.email,
    person.phone,
    person.first_name,
    person.last_name,
    person.country,
    person.city
  FROM audience_member_sync
  JOIN person ON audience_member_sync.person_id = person.id
  WHERE audience_member_sync.audience_id = p_audience_id
  AND audience_member_sync.is_synced = true;
END;
$$ LANGUAGE plpgsql;

-- Function to get audience metrics
CREATE OR REPLACE FUNCTION get_audience_metrics(p_audience_id UUID)
RETURNS TABLE(
  total_members INTEGER,
  synced_count INTEGER,
  last_sync_date TIMESTAMPTZ,
  sync_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT person_id)::INTEGER,
    (SELECT total_synced FROM custom_audience WHERE id = p_audience_id),
    (SELECT last_synced_at FROM custom_audience WHERE id = p_audience_id),
    (SELECT status FROM custom_audience WHERE id = p_audience_id)
  FROM audience_member_sync
  WHERE audience_id = p_audience_id
  AND is_synced = true;
END;
$$ LANGUAGE plpgsql;
