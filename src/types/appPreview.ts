/**
 * App Preview Video Types
 *
 * Types for creating App Store preview videos with device frames,
 * captions, overlays, and animations.
 *
 * Feature: APP-023 - App Preview Video Generator
 */

import { DeviceModel, Orientation } from './deviceFrame';
import { CaptionConfig } from './captionOverlay';

/**
 * App preview video configuration
 */
export interface AppPreviewConfig {
  /** Unique identifier */
  id: string;

  /** Video title/name */
  title: string;

  /** Description */
  description?: string;

  /** Video dimensions (defaults to device dimensions) */
  dimensions?: {
    width: number;
    height: number;
  };

  /** Frame rate (default: 30) */
  fps?: number;

  /** Device configuration */
  device: {
    model: DeviceModel;
    orientation: Orientation;
    /** Show device frame or just content */
    showFrame: boolean;
    /** Frame style customization */
    frameColor?: string;
    shadow?: boolean;
  };

  /** Background configuration */
  background?: {
    /** Background color or gradient */
    color?: string;
    gradient?: {
      type: 'linear' | 'radial';
      colors: string[];
      angle?: number; // For linear gradients (in degrees)
    };
    /** Background image/video */
    media?: string;
    blur?: number;
    opacity?: number;
  };

  /** Video scenes/segments */
  scenes: AppPreviewScene[];

  /** Audio configuration */
  audio?: {
    /** Background music path */
    music?: string;
    musicVolume?: number; // 0-1
    /** Voiceover path */
    voiceover?: string;
    voiceoverVolume?: number; // 0-1
  };

  /** Export settings */
  export?: {
    /** Output format */
    format?: 'mp4' | 'mov' | 'webm';
    /** Quality preset */
    quality?: 'low' | 'medium' | 'high' | 'ultra';
    /** Bitrate (kbps) */
    bitrate?: number;
  };

  /** Metadata */
  metadata?: {
    appName?: string;
    appIcon?: string;
    category?: string;
    locale?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

/**
 * Individual scene in app preview video
 */
export interface AppPreviewScene {
  /** Scene ID */
  id: string;

  /** Scene duration in frames */
  durationInFrames: number;

  /** Screenshot or video to display */
  content: {
    /** Path to screenshot/video file */
    src: string;
    /** Content type */
    type: 'image' | 'video';
    /** How to fit content in device frame */
    fit?: 'cover' | 'contain' | 'fill';
    /** Starting position (for videos) in frames */
    startFrom?: number;
    /** Playback speed multiplier */
    playbackRate?: number;
  };

  /** Captions/text overlays for this scene */
  captions?: CaptionConfig[];

  /** Transition to next scene */
  transition?: {
    type: 'fade' | 'slide' | 'zoom' | 'none';
    duration: number; // in frames
    easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  };

  /** Animation for device frame */
  animation?: {
    /** Animation type */
    type: 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom-in' | 'zoom-out' | 'rotate' | 'none';
    /** Animation duration (frames) */
    duration?: number;
    /** Delay before animation starts (frames) */
    delay?: number;
    /** Easing function */
    easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
  };

  /** Scene-specific background override */
  background?: {
    color?: string;
    gradient?: {
      type: 'linear' | 'radial';
      colors: string[];
      angle?: number;
    };
    blur?: number;
    opacity?: number;
  };
}

/**
 * App preview presets for common use cases
 */
export interface AppPreviewPreset {
  id: string;
  name: string;
  description: string;
  category: 'gaming' | 'productivity' | 'lifestyle' | 'education' | 'business' | 'entertainment' | 'other';
  thumbnail?: string;
  config: Partial<AppPreviewConfig>;
}

/**
 * Animation timing helpers
 */
export interface AnimationTiming {
  startFrame: number;
  endFrame: number;
  progress: number; // 0-1
}

/**
 * Transition configuration for scene changes
 */
export interface SceneTransition {
  type: 'fade' | 'slide' | 'zoom' | 'none';
  duration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  direction?: 'up' | 'down' | 'left' | 'right';
}

/**
 * App preview render options
 */
export interface AppPreviewRenderOptions {
  /** Output path */
  outputPath: string;
  /** Composition ID */
  compositionId: string;
  /** Override quality settings */
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  /** Override dimensions */
  width?: number;
  height?: number;
  /** Frame range to render */
  frameRange?: [number, number];
  /** Concurrency */
  concurrency?: number;
}

/**
 * Export default types
 */
export type {
  DeviceModel,
  Orientation,
} from './deviceFrame';

export type { CaptionConfig } from './captionOverlay';
