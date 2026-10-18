// =============================================================================
// Video Production Toolkit - Barrel Export
// =============================================================================
// Import everything from this file for easy access in other projects

// Components
export {
  AnimatedCaptions,
  generateTranscriptFromText,
  parseSrtToWordTimings,
  type WordTiming,
  type CaptionStyle,
} from '../components/AnimatedCaptions';

export {
  TikTokCaptions,
  TikTokStylePresets,
  type TikTokStyle,
} from '../components/TikTokCaptions';

export {
  AICharacter,
  CharacterPresets,
  type AICharacterProps,
  type CharacterAnimation,
} from '../components/AICharacter';

// Audio System
export {
  type AudioEvent,
  type Beat,
  type SfxItem,
  type SfxManifest,
  type TimelineEvent,
  type FixReport,
} from '../audio/audio-types';

// SFX System
export {
  generateMacroCues,
  compileMacroCuesToAudioEvents,
  type SfxMacro,
  type MacroCue,
} from '../sfx/macro-cues';

export {
  applyPolicyToMacroCues,
  applyPolicyToAudioEvents,
  DEFAULT_POLICY,
  type PolicyConfig,
} from '../sfx/policy-engine';

// Format System
export {
  type HybridFormat,
  type FormatBlock,
  type BeatSec,
  estimateTotalDuration,
} from '../format/hybrid-types';

export {
  generateHybridFormat,
  generateBeatsFromFormat,
} from '../format/format-generator';

// Types
export { type ContentBrief, type Section, type StyleConfig } from '../types/ContentBrief';
