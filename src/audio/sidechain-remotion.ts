/**
 * Remotion-specific sidechain adapter.
 *
 * Wraps the framework-agnostic core with Remotion's `interpolate` for
 * eased attack/release curves. Drop-in replacement for the old
 * lib/sidechain.ts — same API, same types.
 */

import { interpolate } from 'remotion';
import type { SpeechSegment, DuckingConfig } from './ducking-types';
import { DEFAULT_DUCKING_CONFIG } from './sidechain-core';

export type { SpeechSegment, DuckingConfig };
export { DEFAULT_DUCKING_CONFIG };

/**
 * Compute music volume at a given frame with Remotion eased curves.
 *
 * Attack uses ease-in (t²) — music drops slowly then snaps quiet.
 * Release uses ease-out (1-(1-t)²) — music returns quickly then settles.
 *
 * With lookaheadFrames > 0, the attack completes that many frames before the
 * segment starts, so music is already at duckLevel when speech begins.
 */
export function sidechain(
  frame: number,
  segments: SpeechSegment[],
  config: Partial<DuckingConfig> = {},
): number {
  const cfg: DuckingConfig = { ...DEFAULT_DUCKING_CONFIG, ...config };

  if (!cfg.enabled) return cfg.fullLevel;

  const lookahead = cfg.lookaheadFrames ?? 0;

  for (const seg of segments) {
    const attackEnd = seg.startFrame - lookahead;
    const attackStart = attackEnd - cfg.attackFrames;
    const releaseEnd = seg.endFrame + cfg.releaseFrames;

    // Attack (fade down with ease-in)
    if (frame >= attackStart && frame < attackEnd) {
      return interpolate(
        frame,
        [attackStart, attackEnd],
        [cfg.fullLevel, cfg.duckLevel],
        {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: (t) => t * t,
        },
      );
    }

    // Hold ducked (lookahead pre-duck + segment itself)
    if (frame >= attackEnd && frame <= seg.endFrame) {
      return cfg.duckLevel;
    }

    // Release (swell back with ease-out)
    if (frame > seg.endFrame && frame <= releaseEnd) {
      return interpolate(
        frame,
        [seg.endFrame, releaseEnd],
        [cfg.duckLevel, cfg.fullLevel],
        {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: (t) => 1 - Math.pow(1 - t, 2),
        },
      );
    }
  }

  return cfg.fullLevel;
}
