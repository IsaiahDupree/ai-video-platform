// =============================================================================
// Macro Cues & Policy Engine
// AI-driven SFX placement with business rules (cooldowns, density, priority)
// =============================================================================

import { VisualReveal, VisualReveals, SfxEvent, REVEAL_TO_MACRO_CUE } from './audio-types';

/**
 * Macro cue mapping: symbolic names to SFX file lookups
 */
export type MacroCueType =
  | 'reveal_riser'
  | 'impact_soft'
  | 'impact_deep'
  | 'text_ping'
  | 'keyboard_tick'
  | 'whoosh_fast'
  | 'transition_whoosh'
  | 'error_buzz'
  | 'success_ding'
  | 'sparkle_rise';

export interface MacroCueConfig {
  type: MacroCueType;
  sfxIds: string[];        // Fallback list of SFX IDs to try
  description: string;
  category: 'reveal' | 'transition' | 'ui' | 'feedback';
  baseIntensity: number;   // 0.0 - 1.0
}

export const MACRO_CUE_LIBRARY: Record<MacroCueType, MacroCueConfig> = {
  reveal_riser: {
    type: 'reveal_riser',
    sfxIds: ['tension_build', 'rising_tone', 'build_up'],
    description: 'Tension building before keyword reveal',
    category: 'reveal',
    baseIntensity: 0.8,
  },
  impact_soft: {
    type: 'impact_soft',
    sfxIds: ['soft_hit', 'impact_light', 'bounce'],
    description: 'Soft impact on visual reveal',
    category: 'reveal',
    baseIntensity: 0.6,
  },
  impact_deep: {
    type: 'impact_deep',
    sfxIds: ['impact_deep', 'bass_hit', 'thump'],
    description: 'Deep bass impact for emphasis',
    category: 'reveal',
    baseIntensity: 0.9,
  },
  text_ping: {
    type: 'text_ping',
    sfxIds: ['ui_pop', 'ping', 'beep'],
    description: 'UI sound for bullet point appearance',
    category: 'ui',
    baseIntensity: 0.5,
  },
  keyboard_tick: {
    type: 'keyboard_tick',
    sfxIds: ['keyboard_tick', 'type', 'keystroke'],
    description: 'Typing sound for code blocks',
    category: 'ui',
    baseIntensity: 0.4,
  },
  whoosh_fast: {
    type: 'whoosh_fast',
    sfxIds: ['whoosh_fast', 'whoosh_02', 'swish'],
    description: 'Fast whoosh for transitions',
    category: 'transition',
    baseIntensity: 0.7,
  },
  transition_whoosh: {
    type: 'transition_whoosh',
    sfxIds: ['whoosh', 'transition', 'sweep'],
    description: 'Transition between scenes',
    category: 'transition',
    baseIntensity: 0.7,
  },
  error_buzz: {
    type: 'error_buzz',
    sfxIds: ['error_alert', 'buzz', 'alert'],
    description: 'Error notification sound',
    category: 'feedback',
    baseIntensity: 0.8,
  },
  success_ding: {
    type: 'success_ding',
    sfxIds: ['success_chime', 'ding', 'chime'],
    description: 'Success notification sound',
    category: 'feedback',
    baseIntensity: 0.7,
  },
  sparkle_rise: {
    type: 'sparkle_rise',
    sfxIds: ['sparkle', 'rise', 'magical'],
    description: 'Magical sparkle for CTA',
    category: 'reveal',
    baseIntensity: 0.6,
  },
};

/**
 * Policy rules for SFX placement
 */
export interface SfxPolicy {
  cooldownMs: number;           // Min ms between same-category SFX (350ms default)
  maxDensity: number;           // Max SFX in density window
  densityWindowMs: number;      // Density check window (2000ms default)
  priorities: Record<string, number>; // Category priority (higher = more important)
}

export const DEFAULT_SFX_POLICY: SfxPolicy = {
  cooldownMs: 350,
  maxDensity: 3,
  densityWindowMs: 2000,
  priorities: {
    reveal: 10,
    feedback: 8,
    transition: 5,
    ui: 3,
  },
};

/**
 * Policy enforcement result
 */
export interface PolicyEnforcementResult {
  approved: SfxEvent[];
  rejected: Array<{
    reason: 'cooldown' | 'density' | 'priority';
    cue: MacroCueType;
    time: number;
  }>;
  report: {
    totalRequested: number;
    totalApproved: number;
    approvalRate: number;
  };
}

/**
 * Macro Cues Engine - converts reveals to SFX events with policy enforcement
 */
export class MacroCuesEngine {
  private policy: SfxPolicy;
  private library: Record<MacroCueType, MacroCueConfig>;
  private manifestMap: Map<string, string> = new Map(); // SFX ID -> file path

  constructor(policy: SfxPolicy = DEFAULT_SFX_POLICY) {
    this.policy = policy;
    this.library = MACRO_CUE_LIBRARY;
  }

  /**
   * Set the manifest mapping for SFX lookups
   * @param manifest - Map of SFX IDs to file paths
   */
  setManifest(manifest: Map<string, string>): void {
    this.manifestMap = manifest;
  }

  /**
   * Convert visual reveals to SFX events with macro cues
   * @param reveals - Visual reveals from render
   * @returns SFX events ready for audio mixer
   */
  convertRevealsToSfx(reveals: VisualReveals): SfxEvent[] {
    const fps = reveals.fps || 30;
    const cues: Array<{ time: number; macro: MacroCueType; beat: VisualReveal }> = [];

    // Map reveals to macro cues
    for (const reveal of reveals.reveals) {
      const macro = REVEAL_TO_MACRO_CUE[reveal.kind] as MacroCueType;
      if (macro) {
        cues.push({
          time: reveal.t,
          macro,
          beat: reveal,
        });
      }
    }

    // Enforce policy
    const result = this.enforcePolicy(cues, fps);

    return result.approved;
  }

  /**
   * Enforce SFX placement policies
   */
  private enforcePolicy(
    cues: Array<{ time: number; macro: MacroCueType; beat: VisualReveal }>,
    fps: number
  ): PolicyEnforcementResult {
    const approved: SfxEvent[] = [];
    const rejected: PolicyEnforcementResult['rejected'] = [];
    const lastSfxTime: Record<string, number> = {}; // Track cooldown per category

    for (const cue of cues) {
      const config = this.library[cue.macro];
      if (!config) {
        console.warn(`Unknown macro cue: ${cue.macro}`);
        continue;
      }

      // Find best SFX match from fallback list
      let sfxId = config.sfxIds[0];
      for (const candidate of config.sfxIds) {
        if (this.manifestMap.has(candidate)) {
          sfxId = candidate;
          break;
        }
      }

      // Check cooldown policy
      const lastTime = lastSfxTime[config.category] || -999;
      const timeSinceLastMs = (cue.time - lastTime) * 1000;

      if (timeSinceLastMs < this.policy.cooldownMs && lastTime > 0) {
        rejected.push({
          reason: 'cooldown',
          cue: cue.macro,
          time: cue.time,
        });
        continue;
      }

      // Check density policy
      const densityWindow = this.policy.densityWindowMs / 1000;
      const windowStart = cue.time - densityWindow;
      const inWindow = approved.filter(s => {
        const t = s.frame / fps;
        return t >= windowStart && t <= cue.time;
      }).length;

      if (inWindow >= this.policy.maxDensity) {
        rejected.push({
          reason: 'density',
          cue: cue.macro,
          time: cue.time,
        });
        continue;
      }

      // Approved!
      const frame = Math.round(cue.time * fps);
      approved.push({
        type: 'sfx',
        sfxId,
        frame,
        volume: config.baseIntensity,
      });

      lastSfxTime[config.category] = cue.time;
    }

    return {
      approved,
      rejected,
      report: {
        totalRequested: cues.length,
        totalApproved: approved.length,
        approvalRate: cues.length > 0 ? approved.length / cues.length : 0,
      },
    };
  }

  /**
   * Check if SFX placement violates policy
   */
  isViolation(time: number, category: string): string | null {
    // This would be used for realtime checks during render
    return null;
  }

  /**
   * Get macro cue configuration
   */
  getMacroCue(type: MacroCueType): MacroCueConfig | null {
    return this.library[type] || null;
  }

  /**
   * Get all available macro cue types
   */
  getAvailableCues(): MacroCueType[] {
    return Object.keys(this.library) as MacroCueType[];
  }
}

/**
 * Helper to find best SFX match from manifest
 * @param query - Search term or macro cue type
 * @param manifest - Available SFX items
 */
export function findBestSfxMatch(
  query: string,
  manifest: Array<{ id: string; tags: string[]; description: string }>
): string | null {
  const config = MACRO_CUE_LIBRARY[query as MacroCueType];
  if (!config) return null;

  // Try exact match first
  for (const sfxId of config.sfxIds) {
    if (manifest.some(m => m.id === sfxId)) {
      return sfxId;
    }
  }

  // Try tag matching
  const queryLower = query.toLowerCase();
  for (const item of manifest) {
    const tagMatch = item.tags.some(t => t.toLowerCase().includes(queryLower));
    const descMatch = item.description.toLowerCase().includes(queryLower);
    if (tagMatch || descMatch) {
      return item.id;
    }
  }

  return config.sfxIds[0]; // Fallback to first in list
}
