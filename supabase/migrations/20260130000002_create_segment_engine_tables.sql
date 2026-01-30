/**
 * GDP-012: Segment Engine
 *
 * Creates tables for defining and evaluating audience segments
 * Enables rule-based segmentation and automation triggers
 */

-- Segment definitions
-- Stores segment rules for audience targeting
CREATE TABLE IF NOT EXISTS segment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Segment metadata
  name TEXT NOT NULL UNIQUE,
  description TEXT,

  -- Segment rule (JSON-based DSL)
  rule JSONB NOT NULL,

  -- Segment configuration
  is_active BOOLEAN DEFAULT true,
  created_by TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Segment membership tracking
-- Tracks which persons are in which segments
CREATE TABLE IF NOT EXISTS segment_membership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segment(id) ON DELETE CASCADE,

  -- Membership status
  is_member BOOLEAN DEFAULT true,

  -- Timestamps
  entered_at TIMESTAMPTZ DEFAULT now(),
  exited_at TIMESTAMPTZ,
  last_evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Automations triggered by segment membership
-- Defines actions to take when persons enter/exit segments
CREATE TABLE IF NOT EXISTS segment_automation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  segment_id UUID NOT NULL REFERENCES segment(id) ON DELETE CASCADE,

  -- Automation metadata
  name TEXT NOT NULL,
  description TEXT,

  -- Trigger configuration
  trigger_type TEXT NOT NULL, -- 'enter', 'exit', 'periodic'

  -- Action configuration (JSON-based)
  action JSONB NOT NULL, -- { type: 'email', template_id: '...', properties: {...} }

  -- Automation status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Automation execution log
-- Tracks when automations have been triggered for which persons
CREATE TABLE IF NOT EXISTS automation_execution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  automation_id UUID NOT NULL REFERENCES segment_automation(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,

  -- Execution status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed, skipped
  error_message TEXT,

  -- Execution metadata
  trigger_event_id UUID REFERENCES event(id) ON DELETE SET NULL,

  -- Timestamps
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Segment evaluation cache
-- Stores the result of segment evaluation for performance
CREATE TABLE IF NOT EXISTS segment_evaluation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segment(id) ON DELETE CASCADE,

  -- Evaluation result
  matches BOOLEAN NOT NULL,

  -- Timestamps
  evaluated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '1 hour',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_segment_is_active ON segment(is_active);
CREATE INDEX idx_segment_name ON segment(name);

CREATE INDEX idx_segment_membership_person_id ON segment_membership(person_id);
CREATE INDEX idx_segment_membership_segment_id ON segment_membership(segment_id);
CREATE INDEX idx_segment_membership_is_member ON segment_membership(is_member);
CREATE UNIQUE INDEX idx_segment_membership_unique ON segment_membership(person_id, segment_id) WHERE is_member = true;

CREATE INDEX idx_segment_automation_segment_id ON segment_automation(segment_id);
CREATE INDEX idx_segment_automation_is_active ON segment_automation(is_active);
CREATE INDEX idx_segment_automation_trigger_type ON segment_automation(trigger_type);

CREATE INDEX idx_automation_execution_automation_id ON automation_execution(automation_id);
CREATE INDEX idx_automation_execution_person_id ON automation_execution(person_id);
CREATE INDEX idx_automation_execution_status ON automation_execution(status);
CREATE INDEX idx_automation_execution_created_at ON automation_execution(created_at);

CREATE INDEX idx_segment_evaluation_cache_person_id ON segment_evaluation_cache(person_id);
CREATE INDEX idx_segment_evaluation_cache_segment_id ON segment_evaluation_cache(segment_id);
CREATE INDEX idx_segment_evaluation_cache_expires_at ON segment_evaluation_cache(expires_at);

-- Helper function to evaluate a single person against a segment rule
CREATE OR REPLACE FUNCTION evaluate_segment_rule(
  p_person_id UUID,
  p_rule JSONB
) RETURNS BOOLEAN AS $$
DECLARE
  v_condition TEXT;
  v_operator TEXT;
  v_value JSONB;
  v_person_events INTEGER;
  v_active_days INTEGER;
  v_total_renders INTEGER;
  v_pricing_views INTEGER;
  v_mrr_cents INTEGER;
  v_person RECORD;
BEGIN
  -- Get person data
  SELECT * INTO v_person FROM person WHERE id = p_person_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Handle different rule types
  IF p_rule->>'type' = 'and' THEN
    -- All conditions must be true
    FOR v_condition IN SELECT jsonb_array_elements(p_rule->'conditions')
    LOOP
      IF NOT evaluate_segment_rule(p_person_id, v_condition) THEN
        RETURN false;
      END IF;
    END LOOP;
    RETURN true;

  ELSIF p_rule->>'type' = 'or' THEN
    -- At least one condition must be true
    FOR v_condition IN SELECT jsonb_array_elements(p_rule->'conditions')
    LOOP
      IF evaluate_segment_rule(p_person_id, v_condition) THEN
        RETURN true;
      END IF;
    END LOOP;
    RETURN false;

  ELSIF p_rule->>'type' = 'condition' THEN
    v_operator := p_rule->>'operator';
    v_value := p_rule->'value';

    CASE p_rule->>'attribute'
      WHEN 'total_events' THEN
        CASE v_operator
          WHEN '>' THEN RETURN v_person.total_events > (v_value->>0)::INT;
          WHEN '>=' THEN RETURN v_person.total_events >= (v_value->>0)::INT;
          WHEN '<' THEN RETURN v_person.total_events < (v_value->>0)::INT;
          WHEN '<=' THEN RETURN v_person.total_events <= (v_value->>0)::INT;
          WHEN '=' THEN RETURN v_person.total_events = (v_value->>0)::INT;
          WHEN '!=' THEN RETURN v_person.total_events != (v_value->>0)::INT;
          ELSE RETURN false;
        END CASE;

      WHEN 'active_days' THEN
        CASE v_operator
          WHEN '>' THEN RETURN v_person.active_days > (v_value->>0)::INT;
          WHEN '>=' THEN RETURN v_person.active_days >= (v_value->>0)::INT;
          WHEN '<' THEN RETURN v_person.active_days < (v_value->>0)::INT;
          WHEN '<=' THEN RETURN v_person.active_days <= (v_value->>0)::INT;
          WHEN '=' THEN RETURN v_person.active_days = (v_value->>0)::INT;
          WHEN '!=' THEN RETURN v_person.active_days != (v_value->>0)::INT;
          ELSE RETURN false;
        END CASE;

      WHEN 'total_renders' THEN
        CASE v_operator
          WHEN '>' THEN RETURN v_person.total_renders > (v_value->>0)::INT;
          WHEN '>=' THEN RETURN v_person.total_renders >= (v_value->>0)::INT;
          WHEN '<' THEN RETURN v_person.total_renders < (v_value->>0)::INT;
          WHEN '<=' THEN RETURN v_person.total_renders <= (v_value->>0)::INT;
          WHEN '=' THEN RETURN v_person.total_renders = (v_value->>0)::INT;
          WHEN '!=' THEN RETURN v_person.total_renders != (v_value->>0)::INT;
          ELSE RETURN false;
        END CASE;

      WHEN 'pricing_page_views' THEN
        CASE v_operator
          WHEN '>' THEN RETURN v_person.pricing_page_views > (v_value->>0)::INT;
          WHEN '>=' THEN RETURN v_person.pricing_page_views >= (v_value->>0)::INT;
          WHEN '<' THEN RETURN v_person.pricing_page_views < (v_value->>0)::INT;
          WHEN '<=' THEN RETURN v_person.pricing_page_views <= (v_value->>0)::INT;
          WHEN '=' THEN RETURN v_person.pricing_page_views = (v_value->>0)::INT;
          WHEN '!=' THEN RETURN v_person.pricing_page_views != (v_value->>0)::INT;
          ELSE RETURN false;
        END CASE;

      WHEN 'email' THEN
        CASE v_operator
          WHEN '=' THEN RETURN v_person.email = (v_value->>0);
          WHEN 'contains' THEN RETURN v_person.email ILIKE '%' || (v_value->>0) || '%';
          WHEN 'starts_with' THEN RETURN v_person.email ILIKE (v_value->>0) || '%';
          ELSE RETURN false;
        END CASE;

      WHEN 'country' THEN
        CASE v_operator
          WHEN '=' THEN RETURN v_person.country = (v_value->>0);
          WHEN 'in' THEN RETURN v_person.country = ANY((v_value)::TEXT[]);
          ELSE RETURN false;
        END CASE;

      WHEN 'event' THEN
        -- Check if person has any event of a specific type/name
        SELECT COUNT(*) INTO v_person_events
        FROM event
        WHERE person_id = p_person_id
        AND (p_rule->>'event_name' IS NULL OR event_name = p_rule->>'event_name')
        AND (p_rule->>'event_type' IS NULL OR event_type = p_rule->>'event_type')
        AND event_time > now() - INTERVAL '1 day' * (COALESCE((p_rule->>'days')::INT, 30));

        RETURN v_person_events > 0;

      ELSE
        RETURN false;
    END CASE;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to evaluate a person against all segments and update membership
CREATE OR REPLACE FUNCTION evaluate_person_segments(p_person_id UUID)
RETURNS TABLE(segment_id UUID, matches BOOLEAN) AS $$
DECLARE
  v_segment RECORD;
  v_matches BOOLEAN;
  v_currently_member BOOLEAN;
BEGIN
  -- Evaluate person against all active segments
  FOR v_segment IN
    SELECT id, rule FROM segment WHERE is_active = true
  LOOP
    -- Evaluate rule
    v_matches := evaluate_segment_rule(p_person_id, v_segment.rule);

    -- Check current membership
    SELECT is_member INTO v_currently_member
    FROM segment_membership
    WHERE person_id = p_person_id AND segment_id = v_segment.id AND is_member = true;

    -- Update membership if changed
    IF v_matches AND v_currently_member IS NULL THEN
      -- Person entered segment
      INSERT INTO segment_membership (person_id, segment_id, is_member, entered_at)
      VALUES (p_person_id, v_segment.id, true, now());

    ELSIF NOT v_matches AND v_currently_member = true THEN
      -- Person exited segment
      UPDATE segment_membership
      SET is_member = false, exited_at = now()
      WHERE person_id = p_person_id AND segment_id = v_segment.id;
    END IF;

    -- Update evaluation cache
    DELETE FROM segment_evaluation_cache
    WHERE person_id = p_person_id AND segment_id = v_segment.id;

    INSERT INTO segment_evaluation_cache (person_id, segment_id, matches)
    VALUES (p_person_id, v_segment.id, v_matches);

    RETURN QUERY SELECT v_segment.id, v_matches;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to re-evaluate segments when events are created
CREATE OR REPLACE FUNCTION trigger_segment_reevaluation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.person_id IS NOT NULL THEN
    PERFORM evaluate_person_segments(NEW.person_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER segment_reevaluation_on_event
AFTER INSERT ON event
FOR EACH ROW
EXECUTE FUNCTION trigger_segment_reevaluation();
