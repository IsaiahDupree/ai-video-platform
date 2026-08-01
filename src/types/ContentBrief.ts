// Content Brief Schema - Core types for video generation

export type VideoFormat =
  | "explainer_v1" | "listicle_v1" | "comparison_v1" | "shorts_v1" | "devvlog_v1"
  | "youtube_explainer_v2" | "youtube_shorts_v1" | "youtube_tutorial_v1"
  | "instagram_reel_v1" | "instagram_feed_v1" | "instagram_ugc_v1"
  | "tiktok_v1" | "tiktok_countdown_v1" | "tiktok_problem_solution_v1" | "tiktok_myth_v1"
  | "twitter_v1" | "twitter_thread_summary_v1" | "twitter_hot_take_v1"
  | "linkedin_v1" | "linkedin_framework_v1" | "linkedin_myth_v1"
  | "facebook_v1" | "facebook_reel_v1"
  | "threads_v1" | "threads_opinion_v1" | "threads_curiosity_v1";

export type AspectRatio = "9:16" | "16:9" | "1:1" | "4:5";
export type ThemeType = "dark" | "light" | "neon" | "youtube" | "instagram" | "tiktok" | "twitter" | "linkedin" | "facebook" | "threads" | "custom";
export type BackgroundType = "solid" | "gradient" | "image" | "video";
export type AnimationStyle = "fade" | "slide" | "zoom" | "typewriter" | "kinetic" | "spring" | "glitch";
export type SectionType =
  | "intro" | "topic" | "comparison" | "list_item" | "outro" | "transition"
  | "hook" | "content" | "cta"
  | "stat" | "testimonial" | "kinetic_caption"
  | "chapter_card" | "lower_third" | "end_screen"
  | "code" | "quote_card" | "phone_frame" | "compare"
  | "countdown" | "checklist" | "bar_chart" | "myth_reality" | "problem_solution"
  | "thread_reveal" | "ugc_style" | "curiosity_gap" | "social_proof"
  | "avatar_pip";

// ── Video source — where the background/avatar video comes from ───────────────

export type VideoSourceType = "heygen" | "url" | "local" | "none";

export interface VideoSource {
  type: VideoSourceType;
  /** heygen: generate avatar video on-the-fly before rendering */
  heygen?: {
    script: string;
    avatar_id?: string;      // default: Isaiah d9af08b6f80349aaa56096443f91d19e
    voice_id?: string;       // default: Isaiahdupree_v2 e40f41c567924222a60ed3e1d557fc77
    engine?: "v3" | "v4";   // default: v3
    test?: boolean;          // default: false
  };
  /** url: remote MP4 (Supabase Storage, CDN, etc.) */
  url?: string;
  /** local: path relative to Remotion/public/ (uses staticFile) */
  local?: string;
}

export interface ContentBrief {
  id: string;
  format: VideoFormat;
  version: string;
  created_at: string;
  settings: VideoSettings;
  style: StyleConfig;
  sections: Section[];
  audio?: AudioConfig;
  /** Optional background/avatar video source — resolved before render */
  video_source?: VideoSource;
}

export interface VideoSettings {
  resolution: { width: number; height: number };
  fps: number;
  duration_sec: number;
  aspect_ratio: AspectRatio;
}

export interface StyleConfig {
  theme: ThemeType;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_heading: string;
  font_body: string;
  background_type: BackgroundType;
  background_value: string;
}

export interface AudioConfig {
  background_music?: string;
  voiceover?: string;
  captions_path?: string;   // Path to WhisperX JSON for KineticCaptionScene
  volume_music: number;
  volume_voice: number;
}

export interface Section {
  id: string;
  type: SectionType;
  duration_sec: number;
  start_time_sec: number;
  content: SectionContent;
}

export type SectionContent =
  | IntroContent
  | TopicContent
  | ListItemContent
  | OutroContent
  | ComparisonContent
  | HookContent
  | CTAContent
  | TransitionContent
  | StatContent
  | TestimonialContent
  | KineticCaptionContent
  | ChapterCardContent
  | LowerThirdContent
  | EndScreenContent
  | CodeContent
  | QuoteCardContent
  | PhoneFrameContent
  | CompareContent
  | CountdownContent
  | ChecklistContent
  | BarChartContent
  | MythRealityContent
  | ProblemSolutionContent
  | ThreadRevealContent
  | UGCStyleContent
  | CuriosityGapContent
  | SocialProofContent;

// ── Existing types ────────────────────────────────────────────────────────────

export interface IntroContent {
  type: "intro";
  title: string;
  subtitle?: string;
  hook_text?: string;
  logo_path?: string;
}

export interface TopicContent {
  type: "topic";
  heading: string;
  body_text: string;
  bullet_points?: string[];
  image_path?: string;
  icon?: string;
  animation_style?: AnimationStyle;
}

export interface ListItemContent {
  type: "list_item";
  number: number;
  title: string;
  description: string;
  image_path?: string;
}

export interface ComparisonContent {
  type: "comparison";
  title: string;
  left_item: { label: string; points: string[]; image_path?: string };
  right_item: { label: string; points: string[]; image_path?: string };
}

export interface OutroContent {
  type: "outro";
  title: string;
  call_to_action: string;
  social_handles?: { platform: string; handle: string }[];
  logo_path?: string;
}

export interface HookContent {
  type: "hook";
  text: string;
  subtext?: string;
  style?: "stat" | "question" | "claim" | "glitch";
  emoji?: string;
}

export interface CTAContent {
  type: "cta";
  title: string;
  action_text: string;
  url?: string;
  platform?: string;
  handle?: string;
}

export interface TransitionContent {
  type: "transition";
  style: "fade" | "wipe" | "zoom" | "slide";
}

// ── New platform-specific types ───────────────────────────────────────────────

export interface StatContent {
  type: "stat";
  value: number;
  label: string;
  context?: string;
  prefix?: string;
  suffix?: string;
  animate_from?: number;
  supporting_text?: string;
}

export interface TestimonialContent {
  type: "testimonial";
  quote: string;
  author_name: string;
  author_title?: string;
  author_avatar?: string;
  platform?: "linkedin" | "twitter" | "google" | "none";
  rating?: number;
}

export interface KineticCaptionContent {
  type: "kinetic_caption";
  text: string;
  captions_path?: string;
  caption_style?: "tiktok" | "centered" | "full" | "lower_third";
  highlight_color?: string;
  background_opacity?: number;
  word_timings?: Array<{word: string; start: number; end: number}>;
}

export interface ChapterCardContent {
  type: "chapter_card";
  number: number;
  title: string;
  subtitle?: string;
  total_chapters?: number;
}

export interface LowerThirdContent {
  type: "lower_third";
  name: string;
  title: string;
  accent?: string;
}

export interface EndScreenContent {
  type: "end_screen";
  subscribe_text?: string;
  next_video_title?: string;
  channel_name?: string;
  avatar_path?: string;
}

export interface CodeContent {
  type: "code";
  language: string;
  code: string;
  title?: string;
  reveal_mode?: "line_by_line" | "all_at_once";
  highlight_lines?: number[];
}

export interface QuoteCardContent {
  type: "quote_card";
  quote: string;
  author_name: string;
  author_handle?: string;
  author_avatar?: string;
  likes?: string;
  retweets?: string;
  platform?: "twitter" | "linkedin" | "threads";
}

export interface PhoneFrameContent {
  type: "phone_frame";
  content_type: "image" | "app_ui";
  content_path?: string;
  app_name?: string;
  notification_text?: string;
  device?: "iphone" | "android";
}

export interface CompareContent {
  type: "compare";
  left_label: string;
  right_label: string;
  left_points: string[];
  right_points: string[];
  divider_style?: "line" | "wipe" | "arrow";
}

// ── Research-backed scene types ───────────────────────────────────────────────

export interface CountdownContent {
  type: "countdown";
  from?: number;
  label?: string;
  pre_text?: string;
  colors?: string[];
}

export interface ChecklistContent {
  type: "checklist";
  title?: string;
  items: Array<{
    text: string;
    checked?: boolean;
    emoji?: string;
  }>;
  reveal_mode?: "stagger" | "sequential";
  frames_per_item?: number;
}

export interface BarChartContent {
  type: "bar_chart";
  title?: string;
  bars: Array<{
    label: string;
    value: number;
    color?: string;
    highlighted?: boolean;
  }>;
  unit?: string;
  max_value?: number;
  orientation?: "vertical" | "horizontal";
  show_values?: boolean;
}

export interface MythRealityContent {
  type: "myth_reality";
  myth: string;
  reality: string;
  myth_label?: string;
  reality_label?: string;
  myth_hold_percent?: number;
}

export interface ProblemSolutionContent {
  type: "problem_solution";
  problem: string;
  solution: string;
  problem_label?: string;
  solution_label?: string;
  layout?: "sequential" | "split";
  problem_hold_percent?: number;
}

export interface ThreadRevealContent {
  type: "thread_reveal";
  posts: Array<{
    text: string;
    number?: number;
  }>;
  handle?: string;
  avatar_initial?: string;
  reveal_mode?: "sequential" | "stack";
}

export interface UGCStyleContent {
  type: "ugc_style";
  caption: string;
  subtext?: string;
  platform?: "tiktok" | "instagram" | "youtube";
  overlay_style?: "raw" | "clean" | "branded";
  emoji?: string;
}

export interface CuriosityGapContent {
  type: "curiosity_gap";
  setup: string;
  reveal: string;
  setup_label?: string;
  reveal_label?: string;
  hold_percent?: number;
}

export interface SocialProofContent {
  type: "social_proof";
  headline?: string;
  metric?: { value: string; label: string };
  logos?: Array<{ name: string; color?: string }>;
  testimonials?: Array<{ quote: string; author: string }>;
  style?: "logos" | "number" | "faces" | "combined";
}

// ── Duration Constraint Solver — section-package model ─────────────────────────
// The deterministic budget that turns a target runtime + ordered content points
// into frame-exact per-section durations. Produced by src/lib/DurationSolver.ts,
// consumed by the render pipeline (Section.duration_sec / start_time_sec) and by
// the retention critic, which measures the rendered mp4 against these targets.

/** One requested content point, before durations are solved. */
export interface SectionSpec {
  id: string;
  sectionType: SectionType;
  /** The beat/claim/narration text this section carries. */
  content: string;
  /** 1 = must-keep (never dropped, e.g. hook/cta); higher = more droppable. */
  priority: number;
  /** Optional per-section floor/cap (sec), overriding the type defaults. */
  minSec?: number;
  maxSec?: number;
  /** When set, narration length drives the ideal duration (words / wpm). */
  wordCount?: number;
}

/** The hard runtime target and the knobs the solver honors. */
export interface DurationBudget {
  totalSec: number;
  fps: number;
  /** Hook is guaranteed at least this many seconds (default 1.5). */
  hookFloorSec?: number;
  /** CTA is guaranteed at least this many seconds (default 1.5). */
  ctaFloorSec?: number;
  /** Words-per-minute for narration-driven sizing (default 165). */
  wpm?: number;
  /** Solved total must land within this % of totalSec (default 2, matching
   *  VideoQAInspector.checkDuration). */
  tolerancePct?: number;
}

/** A section after solving — carries both seconds and frames, plus provenance. */
export interface SolvedSection {
  id: string;
  sectionType: SectionType;
  content: string;
  priority: number;
  durationSec: number;
  startTimeSec: number;
  durationInFrames: number;
  startFrame: number;
  /** True if the ideal was clamped to the section's min/max. */
  wasClamped: boolean;
}

/** The frame-exact solved plan. `totalFrames` always equals the sum of section
 *  frames; when feasible & fillable it equals round(budget.totalSec * fps). */
export interface SectionPackage {
  budget: DurationBudget;
  sections: SolvedSection[];
  droppedSectionIds: string[];
  totalFrames: number;
  totalSec: number;
  /** False only when the must-keep (priority 1) floors alone exceed the budget. */
  feasible: boolean;
  /** True when even every section at its max cannot fill the budget. */
  underfilled: boolean;
  /** Human-readable record of every clamp/drop/grow/shrink decision. */
  notes: string[];
}
