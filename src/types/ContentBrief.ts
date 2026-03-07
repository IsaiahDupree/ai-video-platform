// Content Brief Schema - Core types for video generation

export type VideoFormat =
  | "explainer_v1" | "listicle_v1" | "comparison_v1" | "shorts_v1" | "devvlog_v1"
  | "youtube_explainer_v2" | "youtube_shorts_v1"
  | "instagram_reel_v1" | "instagram_feed_v1"
  | "tiktok_v1"
  | "twitter_v1"
  | "linkedin_v1"
  | "facebook_v1"
  | "threads_v1";

export type AspectRatio = "9:16" | "16:9" | "1:1" | "4:5";
export type ThemeType = "dark" | "light" | "neon" | "youtube" | "instagram" | "tiktok" | "twitter" | "linkedin" | "facebook" | "threads" | "custom";
export type BackgroundType = "solid" | "gradient" | "image" | "video";
export type AnimationStyle = "fade" | "slide" | "zoom" | "typewriter" | "kinetic" | "spring" | "glitch";
export type SectionType =
  | "intro" | "topic" | "comparison" | "list_item" | "outro" | "transition"
  | "hook" | "content" | "cta"
  | "stat" | "testimonial" | "kinetic_caption"
  | "chapter_card" | "lower_third" | "end_screen"
  | "code" | "quote_card" | "phone_frame" | "compare";

export interface ContentBrief {
  id: string;
  format: VideoFormat;
  version: string;
  created_at: string;
  settings: VideoSettings;
  style: StyleConfig;
  sections: Section[];
  audio?: AudioConfig;
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
  | CompareContent;

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
