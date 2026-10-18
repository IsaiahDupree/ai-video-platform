/**
 * Backward-compatible re-export from the modular audio/sidechain module.
 *
 * Existing consumers (`import { sidechain } from '../lib/sidechain'`)
 * continue to work without changes. New code should import from
 * '../audio' or '../audio/sidechain-core' directly.
 */

export {
  sidechain,
  sidechainCore,
  DEFAULT_DUCKING_CONFIG,
} from '../audio';

export type {
  SpeechSegment,
  DuckingConfig,
} from '../audio';

// Legacy alias — old code imported SidechainConfig
export type { DuckingConfig as SidechainConfig } from '../audio';
