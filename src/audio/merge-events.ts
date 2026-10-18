import type { AudioEvents, Beat } from './audio-types';

// =============================================================================
// Merge Audio Events (base + sfx → final)
// =============================================================================

export function mergeAudioEvents(args: {
  base: AudioEvents;         // Typically includes voiceover + music
  sfxOnly: AudioEvents;      // Typically only sfx
}): AudioEvents {
  if (args.base.fps !== args.sfxOnly.fps) {
    throw new Error(`FPS mismatch: base=${args.base.fps} sfx=${args.sfxOnly.fps}`);
  }

  // Merge and sort by frame
  const merged = [...args.base.events, ...args.sfxOnly.events].sort((a, b) => {
    if (a.frame !== b.frame) return a.frame - b.frame;
    // Deterministic ordering: voiceover/music first, then sfx
    const rank = (t: string) => (t === 'voiceover' ? 0 : t === 'music' ? 1 : 2);
    return rank(a.type) - rank(b.type);
  });

  return { fps: args.base.fps, events: merged };
}

// =============================================================================
// Clamp to Composition Duration
// =============================================================================

export function clampEventsToDuration(args: {
  events: AudioEvents;
  durationInFrames: number;
  dropIfBeyond?: boolean; // Default true
}): AudioEvents {
  const dropIfBeyond = args.dropIfBeyond ?? true;

  const clamped = args.events.events
    .map((ev) => {
      if (ev.frame < 0) return { ...ev, frame: 0 };
      if (ev.frame >= args.durationInFrames) {
        if (dropIfBeyond) return null;
        return { ...ev, frame: Math.max(0, args.durationInFrames - 1) };
      }
      return ev;
    })
    .filter((ev): ev is NonNullable<typeof ev> => ev !== null);

  return { ...args.events, events: clamped };
}

// =============================================================================
// Snap SFX to Nearest Beat
// =============================================================================

export interface BeatRef {
  beatId: string;
  frame: number;
  action?: string;
}

export function snapSfxToBeats(args: {
  events: AudioEvents;
  beats: BeatRef[];
  maxSnapFrames?: number; // Default 6 frames
}): AudioEvents {
  const maxSnapFrames = args.maxSnapFrames ?? 6;
  const beats = [...args.beats].sort((a, b) => a.frame - b.frame);

  const nearestBeatFrame = (frame: number) => {
    let best = beats[0]?.frame ?? frame;
    let bestDist = Infinity;
    for (const b of beats) {
      const d = Math.abs(b.frame - frame);
      if (d < bestDist) {
        bestDist = d;
        best = b.frame;
      }
    }
    return { best, bestDist };
  };

  const out = args.events.events.map((ev) => {
    if (ev.type !== 'sfx') return ev;

    const { best, bestDist } = nearestBeatFrame(ev.frame);
    if (bestDist <= maxSnapFrames) return { ...ev, frame: best };
    return ev;
  });

  return { ...args.events, events: out };
}

// =============================================================================
// Finalize Events (merge + snap + clamp)
// =============================================================================

export function finalizeAudioEvents(args: {
  base: AudioEvents;
  sfxOnly: AudioEvents;
  durationInFrames: number;
  beats?: BeatRef[];
  snap?: boolean;
}): AudioEvents {
  let merged = mergeAudioEvents({ base: args.base, sfxOnly: args.sfxOnly });

  if (args.snap && args.beats?.length) {
    merged = snapSfxToBeats({ events: merged, beats: args.beats, maxSnapFrames: 6 });
  }

  merged = clampEventsToDuration({ 
    events: merged, 
    durationInFrames: args.durationInFrames, 
    dropIfBeyond: true 
  });

  return merged;
}
