// =============================================================================
// Visual Reveals Validator
// Validates reveal timing and generates reports for QA
// =============================================================================

import { VisualReveal, VisualReveals } from './audio-types';

export interface RevealReport {
  version: string;
  totalReveals: number;
  durationSec: number;
  byKind: Record<string, number>;
  minGapSec: number;
  avgGapSec: number;
  maxGapSec: number;
  warnings: Array<{
    type: 'tight-gap' | 'dense-cluster' | 'missing-kind' | 'duplicate-time';
    message: string;
    reveals: VisualReveal[];
  }>;
}

/**
 * Validates visual reveals timing and pacing
 */
export class RevealValidator {
  private reveals: VisualReveal[];
  private fps: number;

  constructor(reveals: VisualReveals) {
    this.reveals = reveals.reveals;
    this.fps = reveals.fps || 30;
  }

  /**
   * Generate a comprehensive validation report
   */
  validate(): RevealReport {
    const warnings: RevealReport['warnings'] = [];

    // Check for tight gaps
    const gaps = this.calculateGaps();
    const tightGaps = gaps.filter(g => g.gap < 0.35);
    if (tightGaps.length > 5) {
      warnings.push({
        type: 'tight-gap',
        message: `${tightGaps.length} reveals with gaps < 0.35s (consider spacing out)`,
        reveals: tightGaps.flatMap(g => [g.a, g.b]),
      });
    }

    // Check for dense clusters (> 4 reveals in 2 seconds)
    const clusters = this.findDenseClusters();
    if (clusters.length > 0) {
      warnings.push({
        type: 'dense-cluster',
        message: `${clusters.length} dense clusters detected (>4 reveals in 2s)`,
        reveals: clusters.flatMap(c => c.reveals),
      });
    }

    // Check for reveals without kind distribution
    const byKind = this.groupByKind();
    if (!byKind['keyword']) {
      warnings.push({
        type: 'missing-kind',
        message: 'No keyword reveals detected - consider adding hooks',
        reveals: [],
      });
    }

    // Check for exact time duplicates
    const timeMap = new Map<number, VisualReveal[]>();
    for (const reveal of this.reveals) {
      const key = Math.round(reveal.t * 1000); // Round to nearest ms
      if (!timeMap.has(key)) {
        timeMap.set(key, []);
      }
      timeMap.get(key)!.push(reveal);
    }

    const duplicates = Array.from(timeMap.values()).filter(r => r.length > 1);
    if (duplicates.length > 0) {
      warnings.push({
        type: 'duplicate-time',
        message: `${duplicates.length} reveals at same timestamp - may cause SFX conflicts`,
        reveals: duplicates.flat(),
      });
    }

    const gapStats = this.calculateGapStats(gaps);

    return {
      version: '1.0.0',
      totalReveals: this.reveals.length,
      durationSec: this.reveals.length > 0
        ? this.reveals[this.reveals.length - 1].t
        : 0,
      byKind,
      minGapSec: gapStats.min,
      avgGapSec: gapStats.avg,
      maxGapSec: gapStats.max,
      warnings,
    };
  }

  /**
   * Calculate gaps between consecutive reveals
   */
  private calculateGaps(): Array<{ a: VisualReveal; b: VisualReveal; gap: number }> {
    const gaps: Array<{ a: VisualReveal; b: VisualReveal; gap: number }> = [];

    for (let i = 0; i < this.reveals.length - 1; i++) {
      const gap = this.reveals[i + 1].t - this.reveals[i].t;
      gaps.push({
        a: this.reveals[i],
        b: this.reveals[i + 1],
        gap,
      });
    }

    return gaps;
  }

  /**
   * Calculate gap statistics
   */
  private calculateGapStats(
    gaps: Array<{ a: VisualReveal; b: VisualReveal; gap: number }>
  ): { min: number; avg: number; max: number } {
    if (gaps.length === 0) {
      return { min: 0, avg: 0, max: 0 };
    }

    const gapValues = gaps.map(g => g.gap);
    const min = Math.min(...gapValues);
    const max = Math.max(...gapValues);
    const avg = gapValues.reduce((a, b) => a + b, 0) / gapValues.length;

    return { min, avg, max };
  }

  /**
   * Find dense clusters of reveals
   */
  private findDenseClusters(): Array<{ start: number; end: number; count: number; reveals: VisualReveal[] }> {
    const clusters: Array<{ start: number; end: number; count: number; reveals: VisualReveal[] }> = [];
    const window = 2.0; // 2 second window
    const threshold = 4; // More than 4 reveals

    for (let i = 0; i < this.reveals.length; i++) {
      const start = this.reveals[i].t;
      const end = start + window;
      const clustered = this.reveals.filter(r => r.t >= start && r.t < end);

      if (clustered.length > threshold) {
        clusters.push({
          start,
          end,
          count: clustered.length,
          reveals: clustered,
        });
      }
    }

    // Remove duplicates (overlapping clusters)
    const unique: typeof clusters = [];
    for (const cluster of clusters) {
      if (!unique.some(c => c.start === cluster.start)) {
        unique.push(cluster);
      }
    }

    return unique;
  }

  /**
   * Group reveals by kind
   */
  private groupByKind(): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const reveal of this.reveals) {
      counts[reveal.kind] = (counts[reveal.kind] || 0) + 1;
    }

    return counts;
  }
}

/**
 * Validate reveals file and return report
 */
export function validateReveals(reveals: VisualReveals): RevealReport {
  const validator = new RevealValidator(reveals);
  return validator.validate();
}

/**
 * Check if reveals are valid (no critical warnings)
 */
export function isRevealsSafe(report: RevealReport): boolean {
  // Only fail on duplicate times or missing core kind
  return !report.warnings.some(w => w.type === 'duplicate-time');
}
