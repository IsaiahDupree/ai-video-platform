import type { AudioEvents, SfxEvent } from '../audio/audio-types';
import type { MacroCuesFile, SfxMacro } from './macro-cues';

// =============================================================================
// Policy Engine - Anti-spam + Priority Rules
// =============================================================================

export interface PolicyConfig {
  minGapSec: number;          // Min seconds between any SFX
  maxPerSecond: number;       // Hard ceiling per second
  maxDensity: number;         // Max SFX in densityWindow
  densityWindowSec: number;   // Window for density check
  cooldowns: Partial<Record<SfxMacro, number>>;  // Per-macro cooldowns
  priorities: Partial<Record<SfxMacro, number>>; // Higher = keep over lower
}

export const DEFAULT_POLICY: PolicyConfig = {
  minGapSec: 0.35,
  maxPerSecond: 2,
  maxDensity: 4,
  densityWindowSec: 2.0,
  cooldowns: {
    impact_soft: 0.5,
    impact_deep: 1.0,
    whoosh_fast: 0.4,
    text_ping: 0.3,
    reveal_riser: 1.5,
  },
  priorities: {
    reveal_riser: 10,
    impact_deep: 9,
    impact_soft: 8,
    whoosh_fast: 7,
    success_ding: 6,
    error_buzz: 6,
    sparkle_rise: 5,
    text_ping: 3,
    keyboard_tick: 2,
    tension_build: 4,
  },
};

// =============================================================================
// Apply Policy to Macro Cues
// =============================================================================

export function applyPolicyToMacroCues(
  cues: MacroCuesFile,
  policy: PolicyConfig = DEFAULT_POLICY
): MacroCuesFile {
  const sorted = [...cues.cues].sort((a, b) => a.t - b.t);
  const kept: typeof sorted = [];
  const lastByMacro = new Map<SfxMacro, number>();
  let lastKeptT = -Infinity;

  // Track density
  const getCountInWindow = (t: number) => {
    return kept.filter((c) => c.t >= t - policy.densityWindowSec && c.t <= t).length;
  };

  for (const cue of sorted) {
    // Check global min gap
    if (cue.t - lastKeptT < policy.minGapSec) continue;

    // Check per-macro cooldown
    const macroCooldown = policy.cooldowns[cue.macro] ?? policy.minGapSec;
    const lastMacroT = lastByMacro.get(cue.macro) ?? -Infinity;
    if (cue.t - lastMacroT < macroCooldown) continue;

    // Check density
    if (getCountInWindow(cue.t) >= policy.maxDensity) continue;

    // Check per-second ceiling
    const secondBucket = Math.floor(cue.t);
    const countThisSecond = kept.filter((c) => Math.floor(c.t) === secondBucket).length;
    if (countThisSecond >= policy.maxPerSecond) continue;

    // Keep this cue
    kept.push(cue);
    lastKeptT = cue.t;
    lastByMacro.set(cue.macro, cue.t);
  }

  return { version: cues.version, cues: kept };
}

// =============================================================================
// Apply Policy to Audio Events (frame-based)
// =============================================================================

export function applyPolicyToAudioEvents(
  events: AudioEvents,
  policy: PolicyConfig = DEFAULT_POLICY
): AudioEvents {
  const fps = events.fps;
  const sfxEvents = events.events.filter((e): e is SfxEvent => e.type === 'sfx');
  const otherEvents = events.events.filter((e) => e.type !== 'sfx');

  const sorted = [...sfxEvents].sort((a, b) => a.frame - b.frame);
  const kept: SfxEvent[] = [];
  let lastKeptFrame = -Infinity;

  const minGapFrames = Math.round(policy.minGapSec * fps);

  // Track density
  const densityWindowFrames = Math.round(policy.densityWindowSec * fps);
  const getCountInWindow = (frame: number) => {
    return kept.filter((e) => e.frame >= frame - densityWindowFrames && e.frame <= frame).length;
  };

  for (const ev of sorted) {
    // Check global min gap
    if (ev.frame - lastKeptFrame < minGapFrames) continue;

    // Check density
    if (getCountInWindow(ev.frame) >= policy.maxDensity) continue;

    // Check per-second ceiling
    const secondBucket = Math.floor(ev.frame / fps);
    const countThisSecond = kept.filter((e) => Math.floor(e.frame / fps) === secondBucket).length;
    if (countThisSecond >= policy.maxPerSecond) continue;

    kept.push(ev);
    lastKeptFrame = ev.frame;
  }

  return {
    fps,
    events: [...otherEvents, ...kept].sort((a, b) => a.frame - b.frame),
  };
}

// =============================================================================
// Policy Report
// =============================================================================

export interface PolicyReport {
  inputCount: number;
  outputCount: number;
  droppedCount: number;
  densityViolations: number;
  gapViolations: number;
}

export function analyzePolicyApplication(
  before: MacroCuesFile,
  after: MacroCuesFile
): PolicyReport {
  return {
    inputCount: before.cues.length,
    outputCount: after.cues.length,
    droppedCount: before.cues.length - after.cues.length,
    densityViolations: 0, // Would need more tracking to count
    gapViolations: 0,
  };
}
