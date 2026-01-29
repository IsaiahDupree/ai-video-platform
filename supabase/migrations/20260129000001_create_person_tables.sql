-- GDP-001: Supabase Schema Setup - Person and Identity Tables
-- This migration creates the core person and identity_link tables for user tracking

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create person table (canonical user record)
CREATE TABLE person (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identification
  email TEXT UNIQUE,
  phone TEXT,
  user_id TEXT UNIQUE, -- Internal user ID from auth system

  -- Profile data
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,

  -- Location
  city TEXT,
  state TEXT,
  country TEXT,
  timezone TEXT,

  -- Tracking identifiers
  posthog_distinct_id TEXT,
  meta_fbp TEXT, -- Facebook Browser ID (_fbp cookie)
  meta_fbc TEXT, -- Facebook Click ID (_fbc cookie)

  -- Computed features (updated by triggers/background jobs)
  total_events INTEGER DEFAULT 0,
  active_days INTEGER DEFAULT 0,
  total_renders INTEGER DEFAULT 0,
  pricing_page_views INTEGER DEFAULT 0,

  -- Lifecycle
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create identity_link table (for identity resolution)
CREATE TABLE identity_link (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,

  -- Identity type and value
  identity_type TEXT NOT NULL, -- 'email', 'phone', 'user_id', 'posthog_distinct_id', 'anonymous_id', 'meta_fbp', 'meta_fbc', etc.
  identity_value TEXT NOT NULL,

  -- Metadata
  source TEXT, -- Where this identity was captured: 'signup', 'pixel', 'capi', 'posthog', etc.
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique identity values per type
  UNIQUE(identity_type, identity_value)
);

-- Indexes for person table
CREATE INDEX idx_person_email ON person(email) WHERE email IS NOT NULL;
CREATE INDEX idx_person_user_id ON person(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_person_posthog_distinct_id ON person(posthog_distinct_id) WHERE posthog_distinct_id IS NOT NULL;
CREATE INDEX idx_person_meta_fbp ON person(meta_fbp) WHERE meta_fbp IS NOT NULL;
CREATE INDEX idx_person_created_at ON person(created_at);
CREATE INDEX idx_person_last_seen_at ON person(last_seen_at);

-- Indexes for identity_link table
CREATE INDEX idx_identity_link_person_id ON identity_link(person_id);
CREATE INDEX idx_identity_link_identity_type ON identity_link(identity_type);
CREATE INDEX idx_identity_link_identity_value ON identity_link(identity_value);
CREATE INDEX idx_identity_link_created_at ON identity_link(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on person table
CREATE TRIGGER update_person_updated_at
  BEFORE UPDATE ON person
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE person IS 'Canonical person table representing unique users across all identifiers';
COMMENT ON TABLE identity_link IS 'Links various identifiers (email, phone, user_id, cookies) to canonical person records';
COMMENT ON COLUMN person.posthog_distinct_id IS 'PostHog distinct_id for analytics stitching';
COMMENT ON COLUMN person.meta_fbp IS 'Meta Pixel browser ID from _fbp cookie';
COMMENT ON COLUMN person.meta_fbc IS 'Meta Pixel click ID from _fbc cookie';
COMMENT ON COLUMN identity_link.identity_type IS 'Type of identifier: email, phone, user_id, posthog_distinct_id, anonymous_id, meta_fbp, meta_fbc';
COMMENT ON COLUMN identity_link.source IS 'Source where identity was captured: signup, pixel, capi, posthog, etc.';
