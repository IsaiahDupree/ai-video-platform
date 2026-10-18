// =============================================================================
// SFX Policy Validator
// Validates SFX placement against business rules
// =============================================================================

import { AudioEvents, SfxEvent } from './audio-types';
import { SfxPolicy, DEFAULT_SFX_POLICY } from './macro-cues';

export interface PolicyViolation {
  type: 'cooldown' | 'density' | 'priority';
  time: number;
  frame: number;
  message: string;
  severity: 'warning' | 'error';
}

export interface PolicyValidationReport {
  isValid: boolean;
  violations: PolicyViolation[];
  statistics: {
    totalEvents: number;
    categoryBreakdown: Record<string, number>;
    avgGapSec: number;
    minGapSec: number;
    maxDensityZone: number;
    densityViolations: number;
    cooldownViolations: number;
  };
}

/**
 * Validates SFX events against policy rules
 */
export class PolicyValidator {
  private policy: SfxPolicy;
  private fps: number = 30;

  constructor(policy: SfxPolicy = DEFAULT_SFX_POLICY, fps: number = 30) {
    this.policy = policy;
    this.fps = fps;
  }

  /**
   * Validate audio events against policy
   */
  validate(events: AudioEvents): PolicyValidationReport {
    const sfxEvents = events.events.filter((e): e is SfxEvent => e.type === 'sfx');
    const violations: PolicyViolation[] = [];

    if (sfxEvents.length === 0) {
      return {
        isValid: true,
        violations: [],
        statistics: {
          totalEvents: 0,
          categoryBreakdown: {},
          avgGapSec: 0,
          minGapSec: 0,
          maxDensityZone: 0,
          densityViolations: 0,
          cooldownViolations: 0,
        },
      };
    }

    // Check cooldown violations
    const cooldownViolations = this.checkCooldown(sfxEvents);
    violations.push(...cooldownViolations);

    // Check density violations
    const densityViolations = this.checkDensity(sfxEvents);
    violations.push(...densityViolations);

    // Calculate statistics
    const stats = this.calculateStatistics(sfxEvents);

    return {
      isValid: violations.length === 0,
      violations,
      statistics: {
        ...stats,
        densityViolations: densityViolations.length,
        cooldownViolations: cooldownViolations.length,
      },
    };
  }

  /**
   * Check for cooldown violations
   */
  private checkCooldown(events: SfxEvent[]): PolicyViolation[] {
    const violations: PolicyViolation[] = [];
    const lastEventTime: Map<string, number> = new Map();

    for (const event of events) {
      const t = event.frame / this.fps;
      const lastT = lastEventTime.get(event.sfxId);

      if (lastT !== undefined) {
        const gapMs = (t - lastT) * 1000;
        if (gapMs < this.policy.cooldownMs) {
          violations.push({
            type: 'cooldown',
            time: t,
            frame: event.frame,
            message: `SFX ${event.sfxId} played too soon (${gapMs.toFixed(0)}ms, min ${this.policy.cooldownMs}ms)`,
            severity: 'warning',
          });
        }
      }

      lastEventTime.set(event.sfxId, t);
    }

    return violations;
  }

  /**
   * Check for density violations
   */
  private checkDensity(events: SfxEvent[]): PolicyViolation[] {
    const violations: PolicyViolation[] = [];
    const windowMs = this.policy.densityWindowMs;
    const windowSec = windowMs / 1000;

    for (let i = 0; i < events.length; i++) {
      const windowStart = events[i].frame / this.fps;
      const windowEnd = windowStart + windowSec;

      const inWindow = events.filter(e => {
        const t = e.frame / this.fps;
        return t >= windowStart && t <= windowEnd;
      }).length;

      if (inWindow > this.policy.maxDensity) {
        violations.push({
          type: 'density',
          time: windowStart,
          frame: events[i].frame,
          message: `${inWindow} SFX in ${windowSec}s window (max ${this.policy.maxDensity})`,
          severity: 'error',
        });
        // Skip checking overlapping windows
        i += inWindow - 1;
      }
    }

    return violations;
  }

  /**
   * Calculate statistics
   */
  private calculateStatistics(events: SfxEvent[]): Omit<PolicyValidationReport['statistics'], 'densityViolations' | 'cooldownViolations'> {
    const categoryBreakdown: Record<string, number> = {};
    let totalGap = 0;
    let minGap = Infinity;
    let maxGap = 0;
    let maxDensityZone = 0;

    // Group by category (first part of sfxId before underscore)
    for (const event of events) {
      const category = event.sfxId.split('_')[0] || 'other';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    }

    // Calculate gaps
    for (let i = 0; i < events.length - 1; i++) {
      const gap = (events[i + 1].frame - events[i].frame) / this.fps;
      totalGap += gap;
      minGap = Math.min(minGap, gap);
      maxGap = Math.max(maxGap, gap);
    }

    // Calculate max density in any window
    const windowSec = this.policy.densityWindowMs / 1000;
    for (let i = 0; i < events.length; i++) {
      const windowStart = events[i].frame / this.fps;
      const windowEnd = windowStart + windowSec;
      const density = events.filter(e => {
        const t = e.frame / this.fps;
        return t >= windowStart && t <= windowEnd;
      }).length;
      maxDensityZone = Math.max(maxDensityZone, density);
    }

    return {
      totalEvents: events.length,
      categoryBreakdown,
      avgGapSec: events.length > 1 ? totalGap / (events.length - 1) : 0,
      minGapSec: minGap === Infinity ? 0 : minGap,
      maxDensityZone,
    };
  }
}

/**
 * Quick validation helper
 */
export function validateAudioPolicy(
  events: AudioEvents,
  policy?: SfxPolicy,
  fps?: number
): PolicyValidationReport {
  const validator = new PolicyValidator(policy, fps);
  return validator.validate(events);
}
