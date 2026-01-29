-- GDP-001: Supabase Schema Setup - Helper Functions
-- This migration creates helper functions for person features computation and identity stitching

-- Function to find or create person by identity
CREATE OR REPLACE FUNCTION find_or_create_person(
  p_identity_type TEXT,
  p_identity_value TEXT,
  p_source TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_user_id TEXT DEFAULT NULL,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_person_id UUID;
  v_existing_person_id UUID;
BEGIN
  -- Try to find existing person via identity_link
  SELECT person_id INTO v_existing_person_id
  FROM identity_link
  WHERE identity_type = p_identity_type
    AND identity_value = p_identity_value
  LIMIT 1;

  IF v_existing_person_id IS NOT NULL THEN
    -- Update last_seen_at for existing person
    UPDATE person
    SET last_seen_at = NOW()
    WHERE id = v_existing_person_id;

    -- Update last_seen_at for identity link
    UPDATE identity_link
    SET last_seen_at = NOW()
    WHERE identity_type = p_identity_type
      AND identity_value = p_identity_value;

    RETURN v_existing_person_id;
  END IF;

  -- Check if person exists by email or user_id
  IF p_email IS NOT NULL THEN
    SELECT id INTO v_person_id FROM person WHERE email = p_email LIMIT 1;
  END IF;

  IF v_person_id IS NULL AND p_user_id IS NOT NULL THEN
    SELECT id INTO v_person_id FROM person WHERE user_id = p_user_id LIMIT 1;
  END IF;

  -- Create new person if not found
  IF v_person_id IS NULL THEN
    INSERT INTO person (email, user_id, first_name, last_name)
    VALUES (p_email, p_user_id, p_first_name, p_last_name)
    RETURNING id INTO v_person_id;
  END IF;

  -- Create identity link
  INSERT INTO identity_link (person_id, identity_type, identity_value, source)
  VALUES (v_person_id, p_identity_type, p_identity_value, p_source)
  ON CONFLICT (identity_type, identity_value) DO UPDATE
  SET last_seen_at = NOW();

  RETURN v_person_id;
END;
$$ LANGUAGE plpgsql;

-- Function to merge two person records (for identity stitching)
CREATE OR REPLACE FUNCTION merge_person_records(
  p_source_person_id UUID,
  p_target_person_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Move all identity_links from source to target
  UPDATE identity_link
  SET person_id = p_target_person_id
  WHERE person_id = p_source_person_id;

  -- Move all events from source to target
  UPDATE event
  SET person_id = p_target_person_id
  WHERE person_id = p_source_person_id;

  -- Move all subscriptions from source to target
  UPDATE subscription
  SET person_id = p_target_person_id
  WHERE person_id = p_source_person_id;

  -- Update target person with any missing data from source
  UPDATE person
  SET
    email = COALESCE(person.email, (SELECT email FROM person WHERE id = p_source_person_id)),
    phone = COALESCE(person.phone, (SELECT phone FROM person WHERE id = p_source_person_id)),
    user_id = COALESCE(person.user_id, (SELECT user_id FROM person WHERE id = p_source_person_id)),
    first_name = COALESCE(person.first_name, (SELECT first_name FROM person WHERE id = p_source_person_id)),
    last_name = COALESCE(person.last_name, (SELECT last_name FROM person WHERE id = p_source_person_id)),
    first_seen_at = LEAST(person.first_seen_at, (SELECT first_seen_at FROM person WHERE id = p_source_person_id)),
    last_seen_at = GREATEST(person.last_seen_at, (SELECT last_seen_at FROM person WHERE id = p_source_person_id))
  WHERE id = p_target_person_id;

  -- Delete source person
  DELETE FROM person WHERE id = p_source_person_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to update person features from events
CREATE OR REPLACE FUNCTION update_person_features(p_person_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE person
  SET
    total_events = (
      SELECT COUNT(*) FROM event WHERE person_id = p_person_id
    ),
    active_days = (
      SELECT COUNT(DISTINCT DATE(event_time))
      FROM event
      WHERE person_id = p_person_id
    ),
    total_renders = (
      SELECT COUNT(*)
      FROM event
      WHERE person_id = p_person_id
        AND event_name IN ('video_rendered', 'first_render_completed')
    ),
    pricing_page_views = (
      SELECT COUNT(*)
      FROM event
      WHERE person_id = p_person_id
        AND event_name = 'pricing_view'
    )
  WHERE id = p_person_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update person features when events are inserted
CREATE OR REPLACE FUNCTION trigger_update_person_features()
RETURNS TRIGGER AS $$
BEGIN
  -- Update person features asynchronously (don't block event insertion)
  PERFORM update_person_features(NEW.person_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_person_features_on_event_insert
  AFTER INSERT ON event
  FOR EACH ROW
  WHEN (NEW.person_id IS NOT NULL)
  EXECUTE FUNCTION trigger_update_person_features();

-- Comments for documentation
COMMENT ON FUNCTION find_or_create_person IS 'Find existing person by identity or create new person with identity link';
COMMENT ON FUNCTION merge_person_records IS 'Merge two person records for identity stitching';
COMMENT ON FUNCTION update_person_features IS 'Update computed person features from events';
