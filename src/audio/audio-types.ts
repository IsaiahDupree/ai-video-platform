// =============================================================================
// Shared Audio Types for Remotion & Motion Canvas
// =============================================================================

export type BeatAction = 
  | 'hook'
  | 'problem'
  | 'transition'
  | 'reveal'
  | 'explain'
  | 'code'
  | 'error'
  | 'success'
  | 'punchline'
  | 'cta'
  | 'outro';

export interface SfxItem {
  id: string;
  file: string;
  tags: string[];
  description: string;
  intensity?: number;
  category?: string;
  license?: {
    source?: string;
    url?: string;
    requiresAttribution?: boolean;
    attributionText?: string;
    notes?: string;
  };
}

export interface SfxManifest {
  version: string;
  items: SfxItem[];
}

export interface SfxEvent {
  type: 'sfx';
  sfxId: string;
  frame: number;
  volume?: number;
}

export interface MusicEvent {
  type: 'music';
  src: string;
  frame: number;
  volume?: number;
}

export interface VoiceoverEvent {
  type: 'voiceover';
  src: string;
  frame: number;
  volume?: number;
}

export type AudioEvent = SfxEvent | MusicEvent | VoiceoverEvent;

export interface AudioEvents {
  fps: number;
  events: AudioEvent[];
}

export interface Beat {
  beatId: string;
  frame: number;
  text: string;
  action?: BeatAction;
}

export interface BeatSec {
  beatId: string;
  t: number;
  text: string;
  action: BeatAction;
  event?: string;
}

export interface TimelineEvent {
  name: string;
  t: number;
  action: BeatAction;
  blockId: string;
  text: string;
}

export interface TimelineEvents {
  version: string;
  fps: number;
  events: TimelineEvent[];
}

export interface SfxContextPack {
  version: string;
  rules: string[];
  sfxIndex: Array<{
    id: string;
    tags: string[];
    desc: string;
    intensity?: number;
    category?: string;
  }>;
}

export interface TimelineQA {
  version: string;
  totalEvents: number;
  durationSec: number;
  minGapSec: number;
  avgGapSec: number;
  denseZones: Array<{ start: number; end: number; count: number }>;
  actionCounts: Record<string, number>;
  gapWarnings: Array<{ a: string; b: string; gap: number }>;
}

export interface FixReport {
  fixed: Array<{ from: string; to: string; frame: number; reason: string }>;
  rejected: Array<{ sfxId: string; frame: number; reason: string }>;
}

export interface MarkerOverlayConfig {
  version: string;
  enabledByDefault: boolean;
  showNextN: number;
  showCountdown: boolean;
  showActionBadges: boolean;
  opacity: number;
  scale: number;
}

export const DEFAULT_MARKER_OVERLAY: MarkerOverlayConfig = {
  version: '1.0.0',
  enabledByDefault: false,
  showNextN: 3,
  showCountdown: true,
  showActionBadges: true,
  opacity: 0.85,
  scale: 1.0,
};
