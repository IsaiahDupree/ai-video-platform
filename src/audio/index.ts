/**
 * Audio ducking module — modular sidechain for any consumer.
 *
 * Exports:
 *   Types       — SpeechSegment, DuckingConfig
 *   Defaults    — DEFAULT_DUCKING_CONFIG (from ducking-defaults.json)
 *   Core        — sidechainCore()   (pure math, no framework dep)
 *   Remotion    — sidechain()       (eased curves via Remotion interpolate)
 */

// Types
export type { SpeechSegment, DuckingConfig } from './ducking-types';

// Defaults
export { DEFAULT_DUCKING_CONFIG } from './sidechain-core';

// Framework-agnostic
export { sidechainCore, vocalBoostCore } from './sidechain-core';

// Remotion adapter
export { sidechain } from './sidechain-remotion';

// Segment utilities
export { wordTimingsToSegments } from './wordTimingsToSegments';
export type { WordTimingInput } from './wordTimingsToSegments';
