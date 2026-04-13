/**
 * Sidechain ducking utility for music beds.
 *
 * Computes music volume at a given frame, ducking around speech segments.
 * Extracted from VoicedDevVlog.tsx for reuse across compositions.
 */

import { interpolate } from 'remotion';

export interface SpeechSegment {
  startFrame: number;
  endFrame: number;
}

export interface SidechainConfig {
  duckLevel: number;     // music volume during speech (default 0.10)
  fullLevel: number;     // music volume when no speech (default 0.55)
  attackFrames: number;  // frames to fade down (default 6)
  releaseFrames: number; // frames to fade back up (default 18)
}

const DEFAULT_CONFIG: SidechainConfig = {
  duckLevel: 0.10,
  fullLevel: 0.55,
  attackFrames: 6,
  releaseFrames: 18,
};

/**
 * Compute music volume at a given frame, ducking around each speech segment.
 * Uses smooth interpolate curves for attack (duck-down) and release (swell-back).
 */
export function sidechain(
  frame: number,
  segments: SpeechSegment[],
  config: Partial<SidechainConfig> = {},
): number {
  const { duckLevel, fullLevel, attackFrames, releaseFrames } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  for (const seg of segments) {
    const attackStart = seg.startFrame - attackFrames;
    const releaseEnd = seg.endFrame + releaseFrames;

    // Pre-duck attack (fading music down)
    if (frame >= attackStart && frame < seg.startFrame) {
      return interpolate(frame, [attackStart, seg.startFrame], [fullLevel, duckLevel], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: (t) => t * t, // ease-in: fast at end
      });
    }
    // During speech: ducked
    if (frame >= seg.startFrame && frame <= seg.endFrame) {
      return duckLevel;
    }
    // Post-speech release (music swelling back up)
    if (frame > seg.endFrame && frame <= releaseEnd) {
      return interpolate(frame, [seg.endFrame, releaseEnd], [duckLevel, fullLevel], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: (t) => 1 - Math.pow(1 - t, 2), // ease-out: fast start
      });
    }
  }

  return fullLevel;
}
