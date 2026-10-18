/**
 * Framework-agnostic sidechain ducking.
 *
 * Pure math — no Remotion, no React, no DOM.
 * Works in Node, Bun, Deno, the browser, Motion Canvas, or anywhere.
 *
 * Uses linear interpolation for attack/release ramps.
 * For eased curves, see sidechain-remotion.ts.
 */

import type { SpeechSegment, DuckingConfig } from './ducking-types';
import DEFAULTS from './ducking-defaults.json';

export type { SpeechSegment, DuckingConfig };

export const DEFAULT_DUCKING_CONFIG: DuckingConfig = {
  duckLevel: DEFAULTS.duckLevel,
  fullLevel: DEFAULTS.fullLevel,
  attackFrames: DEFAULTS.attackFrames,
  releaseFrames: DEFAULTS.releaseFrames,
  enabled: DEFAULTS.enabled,
};

/** Linear interpolation (unclamped). */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Clamp to [0, 1]. */
function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/**
 * Compute music volume at a given frame, ducking around each speech segment.
 *
 * With lookaheadFrames > 0 the attack phase completes that many frames BEFORE
 * the segment starts, so music is already at duckLevel when speech begins.
 *
 * @param frame    - Current frame number
 * @param segments - Array of speech regions (startFrame, endFrame)
 * @param config   - Partial ducking config (merged with defaults)
 * @returns Music volume multiplier (0–1)
 */
export function sidechainCore(
  frame: number,
  segments: SpeechSegment[],
  config: Partial<DuckingConfig> = {},
): number {
  const cfg: DuckingConfig = { ...DEFAULT_DUCKING_CONFIG, ...config };

  if (!cfg.enabled) return cfg.fullLevel;

  const lookahead = cfg.lookaheadFrames ?? 0;

  for (const seg of segments) {
    // With lookahead: attack completes at (segStart - lookahead), so it starts earlier.
    const attackEnd = seg.startFrame - lookahead;
    const attackStart = attackEnd - cfg.attackFrames;
    const releaseEnd = seg.endFrame + cfg.releaseFrames;

    // Attack ramp (fading down to duckLevel)
    if (frame >= attackStart && frame < attackEnd) {
      const t = clamp01(
        cfg.attackFrames > 0
          ? (frame - attackStart) / cfg.attackFrames
          : 1,
      );
      return lerp(cfg.fullLevel, cfg.duckLevel, t);
    }

    // Hold ducked (lookahead hold + segment itself)
    if (frame >= attackEnd && frame <= seg.endFrame) {
      return cfg.duckLevel;
    }

    // Release ramp (swelling back up)
    if (frame > seg.endFrame && frame <= releaseEnd) {
      const t = clamp01(
        cfg.releaseFrames > 0
          ? (frame - seg.endFrame) / cfg.releaseFrames
          : 1,
      );
      return lerp(cfg.duckLevel, cfg.fullLevel, t);
    }
  }

  return cfg.fullLevel;
}

/**
 * Compute voiceover volume multiplier at a given frame.
 * Returns vocalBoostLevel during speech segments, 1.0 otherwise.
 * Uses the same attack/release ramp as the music ducking.
 *
 * @param frame    - Current frame number
 * @param segments - Array of speech regions (startFrame, endFrame)
 * @param config   - Partial ducking config (merged with defaults)
 * @returns Voiceover volume multiplier (1.0–1.5)
 */
export function vocalBoostCore(
  frame: number,
  segments: SpeechSegment[],
  config: Partial<DuckingConfig> = {},
): number {
  const cfg: DuckingConfig = { ...DEFAULT_DUCKING_CONFIG, ...config };

  if (!cfg.enabled) return 1.0;

  const boost = cfg.vocalBoostLevel ?? 1.0;
  if (boost <= 1.0) return 1.0;

  const lookahead = cfg.lookaheadFrames ?? 0;

  for (const seg of segments) {
    const attackEnd = seg.startFrame - lookahead;
    const attackStart = attackEnd - cfg.attackFrames;
    const releaseEnd = seg.endFrame + cfg.releaseFrames;

    // Boost ramp in
    if (frame >= attackStart && frame < attackEnd) {
      const t = clamp01(
        cfg.attackFrames > 0
          ? (frame - attackStart) / cfg.attackFrames
          : 1,
      );
      return lerp(1.0, boost, t);
    }

    // Full boost during segment
    if (frame >= attackEnd && frame <= seg.endFrame) {
      return boost;
    }

    // Boost ramp out
    if (frame > seg.endFrame && frame <= releaseEnd) {
      const t = clamp01(
        cfg.releaseFrames > 0
          ? (frame - seg.endFrame) / cfg.releaseFrames
          : 1,
      );
      return lerp(boost, 1.0, t);
    }
  }

  return 1.0;
}
