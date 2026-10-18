/**
 * ShortsVideo schema — 9:16 vertical version of LongformVideoProps with
 * additional shorts-only fields (hook overlay, SFX cue track). The EDL itself
 * reuses the longform EdlEntry shape so existing per-entry components (caption,
 * speaker clip, b-roll cover) Just Work.
 *
 * Contract between python/services/longform/shorts_planner.py (upstream)
 * and src/compositions/shorts/ShortsVideo.tsx (downstream).
 */

import type {
  EdlEntry,
  MusicBedConfig,
  GlobalStyle,
} from './LongformSchema';
import type { AudioEvents, SfxManifest } from '../audio/sfx-context-pack';

// ─── Hook Overlay ─────────────────────────────────────────────────────────────

export interface HookOverlay {
  /** Big bold text that overlays the first ~1.5s of the short. */
  text: string;
  /** How long the overlay stays on screen, in frames (default 45 = 1.5s @ 30fps). */
  durationFrames: number;
  /** Top vs center placement. */
  position: 'top' | 'center';
  /** Visual style — 'bold' is white-on-black-stroke, 'punchy' adds yellow accent. */
  style: 'bold' | 'punchy';
}

// ─── Top-Level Input Props ────────────────────────────────────────────────────

export interface ShortsVideoProps {
  videoId: string;
  sourceVideo: string;
  fps: number;
  totalDurationFrames: number;
  resolution: {
    width: number;   // typically 1080
    height: number;  // typically 1920
  };
  edl: EdlEntry[];
  musicBed: MusicBedConfig | null;
  globalStyle: GlobalStyle;
  /** Optional SFX cue track. SfxLayer renders these on top of the music bed. */
  sfxEvents: AudioEvents | null;
  /** Manifest referenced by sfxEvents — maps sfxId → file. */
  sfxManifest: SfxManifest | null;
  /** Optional text overlay during the first window. */
  hookOverlay: HookOverlay | null;
}
