/**
 * Shared ducking types — framework-agnostic.
 *
 * Used by sidechain-core.ts, sidechain-remotion.ts, and any external consumer.
 */

export interface SpeechSegment {
  startFrame: number;
  endFrame: number;
}

export interface DuckingConfig {
  /** Music volume during speech (0-1). */
  duckLevel: number;
  /** Music volume when no speech (0-1). */
  fullLevel: number;
  /** Frames to fade music down before speech starts. */
  attackFrames: number;
  /** Frames to fade music back up after speech ends. */
  releaseFrames: number;
  /** Master enable flag. */
  enabled: boolean;
  /**
   * Frames before segment start where the attack COMPLETES (music is already at duckLevel).
   * Default 0 = attack completes exactly when speech starts (reactive).
   * Set > 0 for transparent pre-ducking: e.g. lookaheadFrames=4 means music is fully
   * ducked 4 frames before the first spoken word.
   */
  lookaheadFrames?: number;
  /**
   * Boost voiceover volume during speech segments (1.0 = no boost, range 1.0–1.5).
   * Applied using the same attack/release ramp as ducking.
   */
  vocalBoostLevel?: number;
}
