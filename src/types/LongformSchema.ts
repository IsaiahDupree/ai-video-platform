/**
 * Longform Video Pipeline — Schema v1.0
 * Types for the AI-powered longform video editing pipeline.
 * Contract between Python services (upstream) and Remotion compositions (downstream).
 */

import { TranscriptWord } from './IsaiahReelSchema';

// ─── Enums ───────────────────────────────────────────────────────────────────

export type EditMode =
  | 'speaker_only'
  | 'speaker_plus_text'
  | 'broll_cover'
  | 'speaker_over_broll';

export type RetentionRole =
  | 'hook'
  | 'explanation'
  | 'story'
  | 'proof'
  | 'reset'
  | 'payoff';

export type TransitionType =
  | 'cut'
  | 'dissolve_fast'
  | 'dissolve_slow'
  | 'crossfade';

export type ZoomType =
  | 'slow_push_in'
  | 'slow_pull_out'
  | 'snap_zoom'
  | 'none';

export type CaptionStyle =
  | 'highlight_key_words'
  | 'full_sentence'
  | 'karaoke'
  | 'minimal';

// ─── Caption ─────────────────────────────────────────────────────────────────

export interface CaptionWord {
  word: string;
  start: number;  // seconds
  end: number;    // seconds
  highlight: boolean;
}

export interface CaptionConfig {
  style: CaptionStyle;
  highlightWords: string[];
  position: 'bottom_center' | 'top_center';
  fontSize: number;
  words: CaptionWord[];
}

// ─── Zoom ────────────────────────────────────────────────────────────────────

export interface ZoomConfig {
  type: ZoomType;
  startScale: number;
  endScale: number;
}

// ─── B-Roll Asset Reference ──────────────────────────────────────────────────

export interface BrollAssetRef {
  assetId: string;
  source: string;       // 'pexels' | 'shutterstock' | 'adobe_stock' | 'storyblocks'
  localPath: string;    // resolved path or URL to the downloaded clip
  startTrim: number;    // seconds into the clip to start
  endTrim: number;      // seconds into the clip to end
  opacity: number;      // 0-1
  fit: 'cover' | 'contain';
}

// ─── Speaker Mask Reference ──────────────────────────────────────────────────

export interface SpeakerMaskRef {
  maskId: string;
  path: string;         // path to ProRes 4444 alpha or PNG sequence
  position: 'bottom_right' | 'bottom_left' | 'bottom_center';
  scale: number;        // 0-1 relative to frame
  border: {
    color: string;
    width: number;
    radius: number;
  };
}

// ─── EDL Entry ───────────────────────────────────────────────────────────────

export interface EdlEntry {
  windowId: string;
  startFrame: number;
  endFrame: number;
  startTime: number;    // seconds (for debugging / display)
  endTime: number;
  editMode: EditMode;
  retentionRole: RetentionRole;
  sourceClip: {
    type: 'original';
    startTrim: number;  // seconds into source video
    endTrim: number;
  };
  broll: BrollAssetRef | null;
  speakerMask: SpeakerMaskRef | null;
  zoom: ZoomConfig | null;
  captions: CaptionConfig;
  transitionIn: TransitionType;
  transitionOut: TransitionType;
}

// ─── Music Bed ───────────────────────────────────────────────────────────────

export interface MusicBedConfig {
  trackUrl: string;
  volume: number;         // 0-1, base volume when not ducking
  duckDuringSpeech: boolean;
  duckVolume: number;     // 0-1, volume during speech
}

// ─── Global Style ────────────────────────────────────────────────────────────

export interface GlobalStyle {
  colorGrade: string;     // 'neutral_warm' | 'cool' | 'cinematic' | 'none'
  letterbox: boolean;
  watermark: string | null;
}

// ─── Top-Level Input Props ───────────────────────────────────────────────────

export interface LongformVideoProps {
  videoId: string;
  sourceVideo: string;    // path or URL to the original video
  fps: number;
  totalDurationFrames: number;
  resolution: {
    width: number;
    height: number;
  };
  edl: EdlEntry[];
  musicBed: MusicBedConfig | null;
  globalStyle: GlobalStyle;
}

// ─── Re-export for convenience ───────────────────────────────────────────────

export type { TranscriptWord };
