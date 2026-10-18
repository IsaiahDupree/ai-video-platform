-- Content Intelligence Engine — Supabase Migration
-- Project: ivhfuhxorppptyuofbgq
-- Run via: mcp supabase apply_migration

-- ─── Creator Profiles ─────────────────────────────────────────────────────────
create table if not exists content_intel_creator_profiles (
  creator_id           text primary key,
  platform             text not null,
  handle               text not null,
  display_name         text,
  profile_url          text,
  niche                jsonb default '[]',
  follower_count       integer default 0,
  avg_views_per_post   numeric default 0,
  audience_signals     jsonb default '{}',
  posting_profile      jsonb default '{}',
  visual_style         jsonb default '{}',
  competitive_rank     integer default 50,
  tracking_enabled     boolean default true,
  last_ingested_at     timestamptz,
  discovered_at        timestamptz default now(),
  updated_at           timestamptz default now()
);

-- ─── Content Items ────────────────────────────────────────────────────────────
create table if not exists content_intel_content_items (
  content_id           text primary key,
  creator_id           text references content_intel_creator_profiles(creator_id),
  platform             text not null,
  url                  text,
  published_at         timestamptz,
  collected_at         timestamptz default now(),
  format               text,
  duration_sec         numeric,
  title                text,
  caption              text,
  hashtags             jsonb default '[]',
  transcript           text,
  transcript_confidence numeric default 0,
  thumbnail_url        text,
  hook_analysis        jsonb default '{}',
  cta_type             text,
  cta_text             text,
  proof_type           jsonb default '[]',
  narrative_shape      text,
  raw_metrics          jsonb default '{}',
  normalized_metrics   jsonb default '{}',
  frame_samples        jsonb default '[]',
  claim_verifications  jsonb default '[]',
  inspiration_only     boolean default true,
  state                text default 'DISCOVERED'
);

create index if not exists idx_content_items_creator
  on content_intel_content_items(creator_id);
create index if not exists idx_content_items_platform
  on content_intel_content_items(platform);
create index if not exists idx_content_items_published
  on content_intel_content_items(published_at desc);

-- ─── Trend Clusters ───────────────────────────────────────────────────────────
create table if not exists content_intel_trend_clusters (
  trend_cluster_id         text primary key,
  label                    text not null,
  keywords                 jsonb default '[]',
  entities                 jsonb default '[]',
  example_content_ids      jsonb default '[]',
  trajectory               jsonb default '{}',
  outlier_score            numeric default 0,
  outlier_flags            jsonb default '{}',
  topic_stage              text default 'emerging',
  recommended_action       text default 'monitor',
  related_cluster_ids      jsonb default '[]',
  business_relevance_score numeric default 0,
  monetization_fit         jsonb default '[]',
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

create index if not exists idx_trend_clusters_score
  on content_intel_trend_clusters(outlier_score desc);
create index if not exists idx_trend_clusters_action
  on content_intel_trend_clusters(recommended_action);

-- ─── Research Packets ─────────────────────────────────────────────────────────
create table if not exists content_intel_research_packets (
  research_packet_id       text primary key,
  trend_cluster_id         text references content_intel_trend_clusters(trend_cluster_id),
  question_set             jsonb default '[]',
  query_expansion          jsonb default '{}',
  web_findings             jsonb default '[]',
  video_references         jsonb default '[]',
  audience_language_bank   jsonb default '[]',
  claims_to_verify         jsonb default '[]',
  opportunities            jsonb default '[]',
  risks                    jsonb default '[]',
  controversial_aspects    jsonb default '[]',
  consensus_points         jsonb default '[]',
  disagreement_points      jsonb default '[]',
  research_completeness    numeric default 0,
  research_provider        jsonb default '{}',
  created_at               timestamptz default now()
);

-- ─── Strategy Packets ─────────────────────────────────────────────────────────
create table if not exists content_intel_strategy_packets (
  strategy_packet_id       text primary key,
  trend_cluster_id         text references content_intel_trend_clusters(trend_cluster_id),
  research_packet_id       text references content_intel_research_packets(research_packet_id),
  target_avatar            jsonb default '{}',
  content_goal             text,
  primary_offer_id         text,
  selected_angle           jsonb default '{}',
  alternative_angles       jsonb default '[]',
  message_architecture     jsonb default '{}',
  platform_adaptations     jsonb default '{}',
  competitor_reference_ids jsonb default '[]',
  differentiation_rules    jsonb default '[]',
  brand_voice_rules        jsonb default '[]',
  created_at               timestamptz default now()
);

-- ─── Content Briefs ───────────────────────────────────────────────────────────
create table if not exists content_intel_briefs (
  content_brief_id         text primary key,
  strategy_packet_id       text references content_intel_strategy_packets(strategy_packet_id),
  status                   text default 'draft',
  brief_summary            text,
  title_candidates         jsonb default '[]',
  thumbnail_concepts       jsonb default '[]',
  deliverables             jsonb default '[]',
  primary_platform         text,
  alt_platforms            jsonb default '[]',
  timing                   jsonb default '{}',
  key_claims               jsonb default '[]',
  supporting_evidence      jsonb default '[]',
  audience_language        jsonb default '[]',
  cta                      jsonb default '{}',
  script                   jsonb default '{}',
  constraints              jsonb default '{}',
  kpi_targets              jsonb default '{}',
  timeline_blueprint_id    text,
  avatar_plan_id           text,
  asset_manifest_id        text,
  render_job_id            text,
  learning_record_id       text,
  state                    text default 'BRIEF_COMPILED',
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

create index if not exists idx_briefs_status
  on content_intel_briefs(status);
create index if not exists idx_briefs_platform
  on content_intel_briefs(primary_platform);

-- ─── Timeline Blueprints ──────────────────────────────────────────────────────
create table if not exists content_intel_timeline_blueprints (
  timeline_blueprint_id    text primary key,
  content_brief_id         text references content_intel_briefs(content_brief_id),
  fps                      integer default 30,
  resolution               text default '1080x1920',
  total_duration_sec       numeric,
  beats                    jsonb default '[]',
  music_bed_ref            text,
  sfx_master_ref           text,
  export_preset            text,
  created_at               timestamptz default now()
);

-- ─── Avatar Plans ─────────────────────────────────────────────────────────────
create table if not exists content_intel_avatar_plans (
  avatar_plan_id           text primary key,
  content_brief_id         text references content_intel_briefs(content_brief_id),
  avatar_model             jsonb default '{}',
  placements               jsonb default '[]',
  total_avatar_time_sec    numeric,
  avatar_coverage          numeric,
  voiceover_provider       text,
  voiceover_script         text,
  audio_quality_target     text,
  created_at               timestamptz default now()
);

-- ─── Asset Manifests ──────────────────────────────────────────────────────────
create table if not exists content_intel_asset_manifests (
  asset_manifest_id        text primary key,
  content_brief_id         text references content_intel_briefs(content_brief_id),
  assets                   jsonb default '[]',
  all_rights_cleared       boolean default false,
  missing_assets           jsonb default '[]',
  asset_resolution_status  text default 'pending',
  created_at               timestamptz default now()
);

-- ─── Render Jobs ──────────────────────────────────────────────────────────────
create table if not exists content_intel_render_jobs (
  render_job_id            text primary key,
  content_brief_id         text references content_intel_briefs(content_brief_id),
  renderer                 text default 'remotion',
  composition_id           text,
  input_props              jsonb default '{}',
  output_targets           jsonb default '[]',
  qa_checks                jsonb default '[]',
  qa_results               jsonb default '{}',
  qa_status                text default 'pending',
  render_status            text default 'queued',
  started_at               timestamptz,
  completed_at             timestamptz,
  output_urls              jsonb default '{}',
  premiere_project_path    text,
  error_message            text,
  created_at               timestamptz default now()
);

-- ─── Learning Records ─────────────────────────────────────────────────────────
create table if not exists content_intel_learning_records (
  learning_id              text primary key,
  content_brief_id         text references content_intel_briefs(content_brief_id),
  render_job_id            text references content_intel_render_jobs(render_job_id),
  published_at             timestamptz,
  captured_at              timestamptz default now(),
  expected_metrics         jsonb default '{}',
  observed_metrics         jsonb default '{}',
  delta_analysis           jsonb default '{}',
  pattern_updates          jsonb default '[]',
  new_hypotheses           jsonb default '[]',
  should_replicate         boolean default false,
  replication_instructions text
);

-- ─── Pattern Memory ───────────────────────────────────────────────────────────
create table if not exists content_intel_pattern_memory (
  pattern_key              text primary key,
  contexts                 jsonb default '[]',
  win_rate                 numeric default 0,
  avg_retention            numeric default 0,
  avg_share_rate           numeric default 0,
  avg_engagement_rate      numeric default 0,
  sample_size              integer default 0,
  confidence               numeric default 0,
  recommended_use          text default 'test',
  example_content_ids      jsonb default '[]',
  created_at               timestamptz default now(),
  last_updated_at          timestamptz default now()
);

-- ─── Autonomous Jobs ──────────────────────────────────────────────────────────
create table if not exists content_intel_autonomous_jobs (
  job_id                   text primary key,
  workspace_id             text,
  state                    text default 'DISCOVERED',
  trigger_type             text,
  source_creator_ids       jsonb default '[]',
  source_trend_cluster_ids jsonb default '[]',
  discovered_content_ids   jsonb default '[]',
  opportunity_score        jsonb default '{}',
  state_history            jsonb default '[]',
  errors                   jsonb default '[]',
  human_override_points    jsonb default '[]',
  experiment_arm_id        text,
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

create index if not exists idx_autonomous_jobs_state
  on content_intel_autonomous_jobs(state);
create index if not exists idx_autonomous_jobs_workspace
  on content_intel_autonomous_jobs(workspace_id);

-- ─── Opportunity Scores ───────────────────────────────────────────────────────
create table if not exists content_intel_opportunity_scores (
  id                       uuid primary key default gen_random_uuid(),
  content_id               text,
  trend_cluster_id         text references content_intel_trend_clusters(trend_cluster_id),
  computed_at              timestamptz default now(),
  scores                   jsonb default '{}',
  recommendation           text,
  confidence               numeric,
  reason_codes             jsonb default '[]'
);

create index if not exists idx_opportunity_scores_trend
  on content_intel_opportunity_scores(trend_cluster_id);
create index if not exists idx_opportunity_scores_recommendation
  on content_intel_opportunity_scores(recommendation);
