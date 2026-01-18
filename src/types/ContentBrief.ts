// Content Brief Schema - Core types for video generation

export type VideoFormat = "explainer_v1" | "listicle_v1" | "comparison_v1" | "shorts_v1";
export type AspectRatio = "9:16" | "16:9" | "1:1";
export type ThemeType = "dark" | "light" | "neon" | "custom";
export type BackgroundType = "solid" | "gradient" | "image" | "video";
export type AnimationStyle = "fade" | "slide" | "zoom" | "typewriter";
export type SectionType = "intro" | "topic" | "comparison" | "list_item" | "outro" | "transition" | "hook" | "content" | "cta";

export interface ContentBrief {
  // Metadata
  id: string;
  format: VideoFormat;
  version: string;
  created_at: string;

  // Video Settings
  settings: VideoSettings;

  // Style Configuration
  style: StyleConfig;

  // Content Sections
  sections: Section[];

  // Audio
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
  | TransitionContent;

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
}

export interface CTAContent {
  type: "cta";
  title: string;
  action_text: string;
  url?: string;
}

export interface TransitionContent {
  type: "transition";
  style: "fade" | "wipe" | "zoom" | "slide";
}
