// =============================================================================
// Hybrid Format DSL Types
// =============================================================================

export type BeatAction =
  | 'hook'
  | 'problem'
  | 'transition'
  | 'reveal'
  | 'explain'
  | 'code'
  | 'error'
  | 'success'
  | 'punchline'
  | 'cta'
  | 'outro';

export type BlockType =
  | 'keyword'
  | 'bullet'
  | 'code'
  | 'error'
  | 'success'
  | 'cta'
  | 'chart'
  | 'image';

export interface FormatBlock {
  id: string;
  type: BlockType;
  text: string;
  event?: string;        // Timeline event name for waitUntil()
  duration?: number;     // Optional explicit duration in seconds
  style?: {
    fontSize?: number;
    color?: string;
    animation?: 'fade' | 'slide' | 'pop' | 'typewriter';
  };
}

export interface HybridFormat {
  version: string;
  fps: number;
  style: {
    theme: 'dark' | 'light' | 'neon' | 'minimal';
    fontScale: number;
    accentColor?: string;
  };
  blocks: FormatBlock[];
}

export interface BeatSec {
  beatId: string;
  t: number;
  text: string;
  action: BeatAction;
  event?: string;
  blockId?: string;
}

export interface TimelineEvent {
  name: string;
  t: number;
  action: BeatAction;
  blockId: string;
  text: string;
}

export interface TimelineEvents {
  version: string;
  fps: number;
  events: TimelineEvent[];
}

// =============================================================================
// Block Type → Beat Action Mapping
// =============================================================================

export function blockTypeToAction(type: BlockType): BeatAction {
  switch (type) {
    case 'keyword': return 'reveal';
    case 'bullet': return 'explain';
    case 'code': return 'code';
    case 'error': return 'error';
    case 'success': return 'success';
    case 'cta': return 'cta';
    case 'chart': return 'reveal';
    case 'image': return 'reveal';
    default: return 'explain';
  }
}

// =============================================================================
// Action → SFX Macro Mapping
// =============================================================================

export type SfxMacro =
  | 'reveal_riser'
  | 'impact_soft'
  | 'impact_deep'
  | 'text_ping'
  | 'whoosh_fast'
  | 'error_buzz'
  | 'success_ding'
  | 'sparkle_rise'
  | 'keyboard_tick'
  | 'tension_build';

export function actionToMacro(action: BeatAction): SfxMacro | null {
  switch (action) {
    case 'hook': return 'reveal_riser';
    case 'reveal': return 'impact_soft';
    case 'explain': return 'text_ping';
    case 'code': return 'keyboard_tick';
    case 'error': return 'error_buzz';
    case 'success': return 'success_ding';
    case 'transition': return 'whoosh_fast';
    case 'punchline': return 'impact_deep';
    case 'cta': return 'sparkle_rise';
    case 'problem': return 'tension_build';
    default: return null;
  }
}

// =============================================================================
// Timing Estimation
// =============================================================================

const WPM = 165;
const WORDS_PER_SEC = WPM / 60;

const ACTION_PAUSES: Partial<Record<BeatAction, number>> = {
  hook: 0.4,
  reveal: 0.35,
  punchline: 0.5,
  cta: 0.4,
  transition: 0.25,
  error: 0.3,
  success: 0.3,
  code: 0.2,
  explain: 0.15,
};

export function estimateSeconds(text: string, action?: BeatAction, wpm = WPM): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  const baseSec = words / (wpm / 60);
  const pause = action ? (ACTION_PAUSES[action] ?? 0.15) : 0.15;
  return baseSec + pause;
}

export function estimateTotalDuration(blocks: FormatBlock[], wpm = WPM): number {
  return blocks.reduce((sum, b) => {
    const action = blockTypeToAction(b.type);
    return sum + estimateSeconds(b.text, action, wpm);
  }, 0);
}
