-- ============================================================
-- Media Intelligence Schema — Universal Evidence + Planning DB
-- ============================================================
-- Architecture:
--   Raw sources → normalize → evidence model → planning_state
--   → agent reasons → creative_briefs → QA → learnings
--
-- Key principle: new datasets normalize into ci_evidence first.
-- The strategist agent NEVER reads raw source tables directly.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. MEDIA ASSETS — master registry of all usable media
--    (iPhone clips, B-roll, Sora, generated videos, downloads)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS media_assets (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  asset_type           TEXT NOT NULL CHECK (asset_type IN (
                         'iphone_raw','broll','generated','sora',
                         'everreach','downloaded','voiceover','screenshot')),
  file_name            TEXT NOT NULL,
  file_path            TEXT,                    -- local absolute path
  storage_url          TEXT,                    -- Supabase Storage public URL
  storage_bucket       TEXT DEFAULT 'remotion-renders',
  storage_key          TEXT,                    -- path within bucket

  -- Technical
  file_size_mb         FLOAT,
  duration_sec         FLOAT,
  width                INTEGER,
  height               INTEGER,
  fps                  FLOAT,
  has_audio            BOOLEAN DEFAULT false,
  format               TEXT,                    -- mp4, mov, jpg, png, etc.
  quality_issues       TEXT[],

  -- Triage (filled by RawFootageTriage)
  triage_bin           TEXT CHECK (triage_bin IN ('green','yellow','blue','red')),
  triage_classification TEXT,                  -- usable_primary, usable_supporting, etc.
  triage_scores        JSONB DEFAULT '{}'::jsonb,
  triage_reasoning     TEXT[],
  gate_failures        TEXT[],
  triage_run_id        TEXT,                    -- links back to triage manifest
  triaged_at           TIMESTAMPTZ,

  -- Content / Speech
  transcript           TEXT,
  contains_speech      BOOLEAN DEFAULT false,
  speech_state         TEXT CHECK (speech_state IN (
                         'complete_thought','partial_thought','non_thought','no_speech')),
  language             TEXT DEFAULT 'en',

  -- AI Analysis
  content_mood         TEXT,                   -- personal, educational, creator, energetic, etc.
  content_topic        TEXT,                   -- brief topic label
  hook_potential       FLOAT,                  -- 0–1
  detected_title       TEXT,                   -- if a title was visible in the video
  detected_caption     BOOLEAN DEFAULT false,  -- were captions already burned in?
  accent_color         TEXT,                   -- suggested accent from analysis
  suggested_music_id   TEXT,                   -- track ID from catalog

  -- Usage tracking
  used_in_videos       TEXT[],                 -- output video filenames/IDs
  use_count            INTEGER DEFAULT 0,
  last_used_at         TIMESTAMPTZ,
  tags                 TEXT[],

  -- Session / source
  session_group        TEXT,                   -- e.g. session_003
  recorded_at          TIMESTAMPTZ,            -- parsed from filename or mtime
  source               TEXT DEFAULT 'iphone',  -- iphone, sora, generated, download
  brand_id             TEXT DEFAULT 'isaiah_personal',
  platform_context     TEXT,                   -- instagram, tiktok, youtube, etc.

  -- Relationships
  related_asset_ids    UUID[],                 -- neighboring clips in same session
  parent_asset_id      UUID REFERENCES media_assets(id),  -- if this is a subclip

  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_bin       ON media_assets(triage_bin);
CREATE INDEX IF NOT EXISTS idx_media_assets_type      ON media_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_brand     ON media_assets(brand_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_session   ON media_assets(session_group);
CREATE INDEX IF NOT EXISTS idx_media_assets_mood      ON media_assets(content_mood);
CREATE INDEX IF NOT EXISTS idx_media_assets_use_count ON media_assets(use_count);
CREATE INDEX IF NOT EXISTS idx_media_assets_tags      ON media_assets USING gin(tags);

-- ────────────────────────────────────────────────────────────
-- 2. CI_EVIDENCE — normalized signal table (all sources)
--    Trend data, organic posts, paid ads, research, UGC all
--    normalize here before reaching the planning agent.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ci_evidence (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source
  source_type      TEXT NOT NULL CHECK (source_type IN (
                     'trend','organic','paid','ugc','iphone','research',
                     'competitor','audience','platform_native')),
  source_id        TEXT,                        -- ID in original source table
  source_table     TEXT,                        -- which table it came from
  platform         TEXT,                        -- instagram, tiktok, youtube, etc.

  -- Signal
  signal_type      TEXT NOT NULL CHECK (signal_type IN (
                     'hook','topic','format','audience','cta','music',
                     'caption_style','visual_style','offer_angle','b_roll',
                     'pain_point','aspiration','timing','sentiment')),
  signal_value     JSONB NOT NULL,              -- the actual normalized signal
  signal_text      TEXT,                        -- human-readable summary

  -- Scoring
  confidence       FLOAT DEFAULT 0.5,           -- 0–1 how reliable is this signal
  relevance        FLOAT DEFAULT 0.5,           -- 0–1 relevance to brand/ICP
  novelty          FLOAT DEFAULT 0.5,           -- 0–1 new info vs already known
  urgency          FLOAT DEFAULT 0.5,           -- 0–1 time-sensitive?

  -- Evidence quality
  sample_size      INTEGER,                     -- how many data points back this
  time_horizon     TEXT,                        -- '24h', '7d', '30d', 'evergreen'

  -- Asset reference
  asset_id         UUID REFERENCES media_assets(id),

  -- Lifecycle
  brand_id         TEXT DEFAULT 'isaiah_personal',
  collected_at     TIMESTAMPTZ DEFAULT now(),
  expires_at       TIMESTAMPTZ,                 -- NULL = evergreen
  is_active        BOOLEAN DEFAULT true,

  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ci_evidence_source     ON ci_evidence(source_type, platform);
CREATE INDEX IF NOT EXISTS idx_ci_evidence_signal     ON ci_evidence(signal_type);
CREATE INDEX IF NOT EXISTS idx_ci_evidence_brand      ON ci_evidence(brand_id);
CREATE INDEX IF NOT EXISTS idx_ci_evidence_active     ON ci_evidence(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_ci_evidence_asset      ON ci_evidence(asset_id);
CREATE INDEX IF NOT EXISTS idx_ci_evidence_value      ON ci_evidence USING gin(signal_value);

-- ────────────────────────────────────────────────────────────
-- 3. CI_PLANNING_STATE — consolidated snapshot for agent
--    Updated periodically by the evidence consolidator job.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ci_planning_state (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id             TEXT NOT NULL UNIQUE,
  state_version        INTEGER DEFAULT 1,

  -- Asset inventory (populated from media_assets)
  broll_available      JSONB DEFAULT '[]'::jsonb,      -- [{id, topic, duration, mood}, ...]
  clips_green          JSONB DEFAULT '[]'::jsonb,      -- ready-to-use talking head clips
  clips_yellow         JSONB DEFAULT '[]'::jsonb,      -- salvageable clips
  generated_assets     JSONB DEFAULT '[]'::jsonb,

  -- Consolidated evidence signals
  top_hooks            JSONB DEFAULT '[]'::jsonb,      -- best hooks from evidence
  top_topics           JSONB DEFAULT '[]'::jsonb,      -- trending topics
  top_formats          JSONB DEFAULT '[]'::jsonb,      -- what formats are working
  audience_insights    JSONB DEFAULT '{}'::jsonb,
  competitor_signals   JSONB DEFAULT '[]'::jsonb,

  -- Strategy state
  priority_offers      TEXT[],                         -- offers to push content for
  target_platforms     TEXT[],
  active_angles        JSONB DEFAULT '[]'::jsonb,      -- current GTM angles being tested
  funnel_balance       JSONB DEFAULT '{}'::jsonb,      -- awareness/consideration/conversion mix

  -- Recent activity
  active_experiments   JSONB DEFAULT '[]'::jsonb,
  recent_learnings     JSONB DEFAULT '[]'::jsonb,
  evidence_count       INTEGER DEFAULT 0,
  last_evidence_at     TIMESTAMPTZ,

  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 4. CI_OPPORTUNITIES — content ideas from evidence
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ci_opportunities (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id             TEXT NOT NULL,

  opportunity_type     TEXT NOT NULL CHECK (opportunity_type IN (
                         'hook','format','topic','trend_ride','offer_angle',
                         'repurpose','broll_pair','series')),
  title                TEXT NOT NULL,
  description          TEXT,
  rationale            TEXT,

  -- Evidence backing
  evidence_ids         UUID[],
  confidence_score     FLOAT DEFAULT 0.5,
  urgency_score        FLOAT DEFAULT 0.5,
  effort_score         FLOAT DEFAULT 0.5,
  expected_roi         FLOAT,

  -- Suggested assets
  suggested_clips      UUID[],                 -- media_assets IDs
  suggested_broll      UUID[],
  suggested_music_id   TEXT,

  -- Targeting
  platform             TEXT,
  funnel_stage         TEXT CHECK (funnel_stage IN ('awareness','consideration','conversion')),
  icp_focus            JSONB DEFAULT '{}'::jsonb,
  offer_id             TEXT,

  -- Lifecycle
  status               TEXT DEFAULT 'open' CHECK (status IN (
                         'open','in_progress','shipped','expired','skipped')),
  experiment_id        UUID,
  outcome_summary      TEXT,
  outcome_metrics      JSONB DEFAULT '{}'::jsonb,

  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ci_opps_brand    ON ci_opportunities(brand_id, status);
CREATE INDEX IF NOT EXISTS idx_ci_opps_type     ON ci_opportunities(opportunity_type);
CREATE INDEX IF NOT EXISTS idx_ci_opps_platform ON ci_opportunities(platform, funnel_stage);

-- ────────────────────────────────────────────────────────────
-- 5. CI_CREATIVE_BRIEFS — render-ready briefs
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ci_creative_briefs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id       UUID REFERENCES ci_opportunities(id),
  brand_id             TEXT NOT NULL,

  -- Content
  hook_text            TEXT,
  caption_text         TEXT,
  title_text           TEXT,
  title_subtext        TEXT,
  body_transcript      TEXT,                   -- full spoken content / captions

  -- Style
  caption_style        TEXT,                   -- clean-stroke, ig-story, karaoke-box, etc.
  title_style          TEXT,                   -- minimal-top, sticker, neon-bar, etc.
  accent_color         TEXT,
  music_id             TEXT,
  music_volume         FLOAT DEFAULT 0.015,

  -- Background
  background_type      TEXT CHECK (background_type IN ('video','gradient','image')),
  background_asset_id  UUID REFERENCES media_assets(id),
  bg_gradient          TEXT,

  -- Targeting
  platform             TEXT,
  blotato_account_id   INTEGER,
  funnel_stage         TEXT,
  icp_focus            JSONB DEFAULT '{}'::jsonb,
  offer_id             TEXT,
  hashtags             TEXT[],

  -- Rendering
  composition_id       TEXT,                   -- Remotion composition ID
  render_props         JSONB DEFAULT '{}'::jsonb,
  render_output_path   TEXT,
  render_output_url    TEXT,
  duration_frames      INTEGER,
  fps                  INTEGER DEFAULT 30,

  -- Publishing
  status               TEXT DEFAULT 'draft' CHECK (status IN (
                         'draft','approved','rendering','rendered','posted','failed')),
  post_url             TEXT,
  post_submission_id   TEXT,
  posted_at            TIMESTAMPTZ,

  -- QA
  qa_score             INTEGER,
  qa_decision          TEXT,
  qa_report            JSONB DEFAULT '{}'::jsonb,

  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_briefs_brand    ON ci_creative_briefs(brand_id, status);
CREATE INDEX IF NOT EXISTS idx_briefs_platform ON ci_creative_briefs(platform, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_briefs_asset    ON ci_creative_briefs(background_asset_id);

-- ────────────────────────────────────────────────────────────
-- 6. CI_LEARNINGS — agent memory of what works
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ci_learnings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id             TEXT NOT NULL,

  learning_type        TEXT NOT NULL CHECK (learning_type IN (
                         'triage_pattern','hook_pattern','caption_style',
                         'music_match','clip_quality','session_pattern',
                         'platform_format','audience_response','offer_angle',
                         'b_roll_usage','negative_signal')),
  signal               TEXT NOT NULL,          -- plain-language description
  evidence             JSONB DEFAULT '{}'::jsonb,

  confidence           FLOAT DEFAULT 0.5,
  sample_size          INTEGER DEFAULT 1,
  applies_to           TEXT[],                 -- future decision categories this affects

  -- Source
  source_type          TEXT,                   -- where this learning came from
  source_ids           UUID[],                 -- brief_ids, asset_ids, etc.

  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learnings_brand ON ci_learnings(brand_id, learning_type);
CREATE INDEX IF NOT EXISTS idx_learnings_type  ON ci_learnings(learning_type);

-- ────────────────────────────────────────────────────────────
-- 7. TRIAGE_RUNS — log of batch triage sessions
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS triage_runs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_dir           TEXT,
  brand_id             TEXT DEFAULT 'isaiah_personal',

  total_clips          INTEGER DEFAULT 0,
  green_count          INTEGER DEFAULT 0,
  yellow_count         INTEGER DEFAULT 0,
  blue_count           INTEGER DEFAULT 0,
  red_count            INTEGER DEFAULT 0,
  pipeline_ready_count INTEGER DEFAULT 0,

  manifest_path        TEXT,                   -- local path to JSON manifest
  manifest_url         TEXT,                   -- Supabase Storage URL if uploaded

  processed_at         TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 8. HELPER: update timestamps automatically
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_media_assets_updated
  BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_ci_opportunities_updated
  BEFORE UPDATE ON ci_opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_ci_briefs_updated
  BEFORE UPDATE ON ci_creative_briefs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_ci_planning_updated
  BEFORE UPDATE ON ci_planning_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────────
-- 9. SEED: Initialize planning state for isaiah_personal
-- ────────────────────────────────────────────────────────────

INSERT INTO ci_planning_state (brand_id, priority_offers, target_platforms)
VALUES (
  'isaiah_personal',
  ARRAY['ai_automation_audit', 'social_growth_system', 'actp_setup'],
  ARRAY['instagram', 'tiktok', 'linkedin', 'twitter']
)
ON CONFLICT (brand_id) DO NOTHING;
