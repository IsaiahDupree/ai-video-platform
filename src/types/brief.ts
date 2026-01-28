/**
 * Content Brief Schema - VID-001
 * JSON-based video definition system with settings, style, sections, and audio
 */

export interface ContentBrief {
  version: string;
  title: string;
  description?: string;
  settings: VideoSettings;
  style: VideoStyle;
  sections: Section[];
  audio?: AudioConfig;
  metadata?: BriefMetadata;
}

export interface VideoSettings {
  width: number;
  height: number;
  fps: number;
  durationInFrames?: number;
  codec?: string;
}

export interface VideoStyle {
  theme: 'light' | 'dark' | 'custom';
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
    accent?: string;
  };
  typography?: {
    headingFont?: string;
    bodyFont?: string;
    headingSize?: number;
    bodySize?: number;
  };
  animations?: {
    transition?: 'fade' | 'slide' | 'zoom' | 'none';
    duration?: number;
  };
}

export interface Section {
  id: string;
  type: 'topic' | 'intro' | 'outro' | 'transition' | 'custom';
  durationInFrames: number;
  heading?: string;
  body?: string;
  image?: string | ImageConfig;
  voiceover?: string;
  animations?: SectionAnimation[];
}

export interface ImageConfig {
  src: string;
  alt?: string;
  fit?: 'cover' | 'contain' | 'fill';
  position?: {
    x: number;
    y: number;
  };
  scale?: number;
  opacity?: number;
}

export interface SectionAnimation {
  property: 'opacity' | 'scale' | 'translateX' | 'translateY' | 'rotate';
  from: number | string;
  to: number | string;
  duration: number;
  delay?: number;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface AudioConfig {
  voiceProvider: 'openai' | 'elevenlabs' | 'indexed' | 'custom';
  voice?: string;
  language?: string;
  speed?: number;
  pitch?: number;
  backgroundMusic?: string;
  musicVolume?: number;
}

export interface BriefMetadata {
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  version?: string;
  notes?: string;
}

/**
 * Type guards for runtime validation
 */
export function isContentBrief(obj: unknown): obj is ContentBrief {
  if (typeof obj !== 'object' || obj === null) return false;

  const brief = obj as Partial<ContentBrief>;

  return (
    typeof brief.version === 'string' &&
    typeof brief.title === 'string' &&
    typeof brief.settings === 'object' &&
    brief.settings !== null &&
    typeof brief.style === 'object' &&
    brief.style !== null &&
    Array.isArray(brief.sections)
  );
}

export function isSection(obj: unknown): obj is Section {
  if (typeof obj !== 'object' || obj === null) return false;

  const section = obj as Partial<Section>;

  return (
    typeof section.id === 'string' &&
    typeof section.type === 'string' &&
    typeof section.durationInFrames === 'number'
  );
}
