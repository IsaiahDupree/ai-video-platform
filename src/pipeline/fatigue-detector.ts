/**
 * Creative Fatigue Detector
 *
 * Analyzes performance trends over time to detect when ad creatives
 * are losing effectiveness. Provides recommendations for refreshing
 * or rotating ads before performance degrades significantly.
 *
 * Key signals:
 * - CTR declining over consecutive reporting periods
 * - Frequency increasing (same users seeing ad too many times)
 * - CPC rising while CTR drops (auction penalty)
 * - Video view-through rate declining
 */

import type { AdBatch, AdVariant } from './types';

// =============================================================================
// Types
// =============================================================================

export interface FatigueSignal {
  variantId: string;
  metric: string;
  trend: 'declining' | 'stable' | 'improving';
  severity: 'low' | 'medium' | 'high' | 'critical';
  currentValue: number;
  previousValue: number;
  changePercent: number;
  message: string;
}

export interface VariantFatigueReport {
  variantId: string;
  template: string;
  hookType: string;
  overallStatus: 'healthy' | 'watch' | 'fatigued' | 'critical';
  signals: FatigueSignal[];
  fatigueScore: number; // 0–100, higher = more fatigued
  recommendation: string;
  estimatedDaysRemaining: number;
}

export interface BatchFatigueReport {
  batchId: string;
  analyzedAt: string;
  totalVariants: number;
  variantsWithData: number;
  statusBreakdown: {
    healthy: number;
    watch: number;
    fatigued: number;
    critical: number;
  };
  variantReports: VariantFatigueReport[];
  batchRecommendation: string;
  shouldRefresh: boolean;
  urgency: 'none' | 'low' | 'medium' | 'high';
}

// =============================================================================
// Multi-Period Performance Data
// =============================================================================

export interface PerformancePeriod {
  periodStart: string;
  periodEnd: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  spend: number;
  conversions: number;
  roas: number;
  frequency: number;
  videoViews?: number;
  videoViewRate?: number;
  reach: number;
}

/**
 * Parse multi-period performance data from Meta CSV exports.
 * Expects rows sorted by date with the same variant appearing
 * across multiple reporting periods.
 */
export function parseMultiPeriodData(
  csvContent: string,
): Map<string, PerformancePeriod[]> {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return new Map();

  const header = lines[0];
  const cols = header.split(',').map(c => c.trim().toLowerCase().replace(/['"]/g, ''));

  const colIdx = (names: string[]): number => {
    for (const name of names) {
      const idx = cols.findIndex(c => c.includes(name));
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const adNameIdx = colIdx(['ad name']);
  const impressionsIdx = colIdx(['impressions']);
  const clicksIdx = colIdx(['link clicks', 'clicks']);
  const ctrIdx = colIdx(['ctr']);
  const cpcIdx = colIdx(['cpc']);
  const spendIdx = colIdx(['amount spent', 'spend']);
  const resultsIdx = colIdx(['results', 'conversions']);
  const reachIdx = colIdx(['reach']);
  const frequencyIdx = colIdx(['frequency']);
  const startIdx = colIdx(['reporting starts', 'start date']);
  const endIdx = colIdx(['reporting ends', 'end date']);
  const videoViewsIdx = colIdx(['video plays', 'video views']);
  const thruPlaysIdx = colIdx(['thruplays', 'thruplay']);

  if (adNameIdx < 0 || impressionsIdx < 0) return new Map();

  const result = new Map<string, PerformancePeriod[]>();

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(c => c.trim().replace(/['"$%]/g, ''));
    if (row.length <= adNameIdx) continue;

    const variantId = row[adNameIdx];
    const impressions = parseInt(row[impressionsIdx] || '0', 10);
    if (!variantId || impressions === 0) continue;

    const clicks = clicksIdx >= 0 ? parseInt(row[clicksIdx] || '0', 10) : 0;
    const ctr = ctrIdx >= 0 ? parseFloat(row[ctrIdx] || '0') : (impressions > 0 ? (clicks / impressions) * 100 : 0);
    const cpc = cpcIdx >= 0 ? parseFloat(row[cpcIdx] || '0') : 0;
    const spend = spendIdx >= 0 ? parseFloat(row[spendIdx] || '0') : 0;
    const conversions = resultsIdx >= 0 ? parseInt(row[resultsIdx] || '0', 10) : 0;
    const reach = reachIdx >= 0 ? parseInt(row[reachIdx] || '0', 10) : impressions;
    const frequency = frequencyIdx >= 0 ? parseFloat(row[frequencyIdx] || '1') : (reach > 0 ? impressions / reach : 1);
    const videoViews = videoViewsIdx >= 0 ? parseInt(row[videoViewsIdx] || '0', 10) : undefined;
    const thruPlays = thruPlaysIdx >= 0 ? parseInt(row[thruPlaysIdx] || '0', 10) : undefined;
    const videoViewRate = videoViews !== undefined && impressions > 0 ? (videoViews / impressions) * 100 : undefined;

    const period: PerformancePeriod = {
      periodStart: startIdx >= 0 ? row[startIdx] : '',
      periodEnd: endIdx >= 0 ? row[endIdx] : '',
      impressions,
      clicks,
      ctr,
      cpc,
      spend,
      conversions,
      roas: spend > 0 ? (conversions * (spend / Math.max(conversions, 1))) / spend : 0,
      frequency,
      reach,
      videoViews,
      videoViewRate,
    };

    if (!result.has(variantId)) {
      result.set(variantId, []);
    }
    result.get(variantId)!.push(period);
  }

  return result;
}

// =============================================================================
// Fatigue Analysis
// =============================================================================

/**
 * Analyze a single variant for creative fatigue signals
 */
function analyzeVariantFatigue(
  variantId: string,
  periods: PerformancePeriod[],
  variant?: AdVariant,
): VariantFatigueReport {
  const signals: FatigueSignal[] = [];

  if (periods.length < 2) {
    return {
      variantId,
      template: variant?.parameters.visual.template || 'unknown',
      hookType: variant?.parameters.copy.hookType || 'unknown',
      overallStatus: 'healthy',
      signals: [],
      fatigueScore: 0,
      recommendation: 'Not enough data for trend analysis. Need at least 2 reporting periods.',
      estimatedDaysRemaining: 30,
    };
  }

  // Sort by period start date
  const sorted = [...periods].sort((a, b) => a.periodStart.localeCompare(b.periodStart));
  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];

  // --- CTR Trend ---
  if (previous.ctr > 0) {
    const ctrChange = ((latest.ctr - previous.ctr) / previous.ctr) * 100;
    if (ctrChange < -20) {
      signals.push({
        variantId, metric: 'CTR', trend: 'declining', severity: 'high',
        currentValue: round(latest.ctr, 2), previousValue: round(previous.ctr, 2),
        changePercent: round(ctrChange, 1),
        message: `CTR dropped ${Math.abs(round(ctrChange, 1))}% (${round(previous.ctr, 2)}% → ${round(latest.ctr, 2)}%)`,
      });
    } else if (ctrChange < -10) {
      signals.push({
        variantId, metric: 'CTR', trend: 'declining', severity: 'medium',
        currentValue: round(latest.ctr, 2), previousValue: round(previous.ctr, 2),
        changePercent: round(ctrChange, 1),
        message: `CTR declining ${Math.abs(round(ctrChange, 1))}%`,
      });
    } else if (ctrChange < -5) {
      signals.push({
        variantId, metric: 'CTR', trend: 'declining', severity: 'low',
        currentValue: round(latest.ctr, 2), previousValue: round(previous.ctr, 2),
        changePercent: round(ctrChange, 1),
        message: `CTR slightly declining`,
      });
    }
  }

  // --- CPC Trend (rising = bad) ---
  if (previous.cpc > 0) {
    const cpcChange = ((latest.cpc - previous.cpc) / previous.cpc) * 100;
    if (cpcChange > 30) {
      signals.push({
        variantId, metric: 'CPC', trend: 'declining', severity: 'high',
        currentValue: round(latest.cpc, 2), previousValue: round(previous.cpc, 2),
        changePercent: round(cpcChange, 1),
        message: `CPC increased ${round(cpcChange, 1)}% ($${round(previous.cpc, 2)} → $${round(latest.cpc, 2)})`,
      });
    } else if (cpcChange > 15) {
      signals.push({
        variantId, metric: 'CPC', trend: 'declining', severity: 'medium',
        currentValue: round(latest.cpc, 2), previousValue: round(previous.cpc, 2),
        changePercent: round(cpcChange, 1),
        message: `CPC rising ${round(cpcChange, 1)}%`,
      });
    }
  }

  // --- Frequency (>3 = audience saturation) ---
  if (latest.frequency > 4) {
    signals.push({
      variantId, metric: 'Frequency', trend: 'declining', severity: 'critical',
      currentValue: round(latest.frequency, 1), previousValue: round(previous.frequency, 1),
      changePercent: round(((latest.frequency - previous.frequency) / Math.max(previous.frequency, 1)) * 100, 1),
      message: `Frequency at ${round(latest.frequency, 1)}x — severe audience saturation`,
    });
  } else if (latest.frequency > 3) {
    signals.push({
      variantId, metric: 'Frequency', trend: 'declining', severity: 'high',
      currentValue: round(latest.frequency, 1), previousValue: round(previous.frequency, 1),
      changePercent: round(((latest.frequency - previous.frequency) / Math.max(previous.frequency, 1)) * 100, 1),
      message: `Frequency at ${round(latest.frequency, 1)}x — audience likely fatigued`,
    });
  } else if (latest.frequency > 2) {
    signals.push({
      variantId, metric: 'Frequency', trend: 'declining', severity: 'medium',
      currentValue: round(latest.frequency, 1), previousValue: round(previous.frequency, 1),
      changePercent: round(((latest.frequency - previous.frequency) / Math.max(previous.frequency, 1)) * 100, 1),
      message: `Frequency at ${round(latest.frequency, 1)}x — monitor closely`,
    });
  }

  // --- Video View Rate ---
  if (latest.videoViewRate !== undefined && previous.videoViewRate !== undefined && previous.videoViewRate > 0) {
    const vvrChange = ((latest.videoViewRate - previous.videoViewRate) / previous.videoViewRate) * 100;
    if (vvrChange < -15) {
      signals.push({
        variantId, metric: 'VideoViewRate', trend: 'declining', severity: 'medium',
        currentValue: round(latest.videoViewRate, 2), previousValue: round(previous.videoViewRate, 2),
        changePercent: round(vvrChange, 1),
        message: `Video view rate dropped ${Math.abs(round(vvrChange, 1))}%`,
      });
    }
  }

  // --- Composite Fatigue Score ---
  const severityWeight = { low: 10, medium: 25, high: 45, critical: 70 };
  let fatigueScore = 0;
  for (const signal of signals) {
    fatigueScore += severityWeight[signal.severity];
  }
  fatigueScore = Math.min(100, fatigueScore);

  // --- Overall Status ---
  let overallStatus: VariantFatigueReport['overallStatus'] = 'healthy';
  if (fatigueScore >= 70) overallStatus = 'critical';
  else if (fatigueScore >= 45) overallStatus = 'fatigued';
  else if (fatigueScore >= 15) overallStatus = 'watch';

  // --- Recommendation ---
  let recommendation = '';
  if (overallStatus === 'critical') {
    recommendation = 'Pause immediately and replace with new creative. Performance is severely degraded.';
  } else if (overallStatus === 'fatigued') {
    recommendation = 'Schedule replacement within 3-5 days. Consider refreshing copy or visuals.';
  } else if (overallStatus === 'watch') {
    recommendation = 'Monitor daily. Prepare replacement creative as backup.';
  } else {
    recommendation = 'Performing well. No action needed.';
  }

  // --- Estimate days remaining ---
  let estimatedDaysRemaining = 30;
  if (sorted.length >= 2 && previous.ctr > 0) {
    const dailyCtrDecline = (previous.ctr - latest.ctr) / 7; // assuming weekly periods
    if (dailyCtrDecline > 0) {
      const ctrUntilFatigue = latest.ctr * 0.5; // fatigue at 50% of current
      estimatedDaysRemaining = Math.max(1, Math.ceil(ctrUntilFatigue / dailyCtrDecline));
    }
  }

  return {
    variantId,
    template: variant?.parameters.visual.template || 'unknown',
    hookType: variant?.parameters.copy.hookType || 'unknown',
    overallStatus,
    signals,
    fatigueScore,
    recommendation,
    estimatedDaysRemaining,
  };
}

// =============================================================================
// Batch-Level Analysis
// =============================================================================

/**
 * Analyze an entire batch for creative fatigue.
 *
 * @param batch - The ad batch with variant metadata
 * @param periodData - Multi-period performance data per variant (from parseMultiPeriodData)
 */
export function detectFatigue(
  batch: AdBatch,
  periodData: Map<string, PerformancePeriod[]>,
): BatchFatigueReport {
  const variantMap = new Map(batch.variants.map(v => [v.id, v]));
  const reports: VariantFatigueReport[] = [];

  for (const [variantId, periods] of periodData.entries()) {
    const variant = variantMap.get(variantId);
    reports.push(analyzeVariantFatigue(variantId, periods, variant));
  }

  // Also include variants with single-period data from batch
  for (const variant of batch.variants) {
    if (!periodData.has(variant.id) && variant.performance) {
      reports.push({
        variantId: variant.id,
        template: variant.parameters.visual.template,
        hookType: variant.parameters.copy.hookType,
        overallStatus: 'healthy',
        signals: [],
        fatigueScore: 0,
        recommendation: 'Single period only. Need time-series data for fatigue analysis.',
        estimatedDaysRemaining: 30,
      });
    }
  }

  // Sort by fatigue score descending
  reports.sort((a, b) => b.fatigueScore - a.fatigueScore);

  const statusBreakdown = {
    healthy: reports.filter(r => r.overallStatus === 'healthy').length,
    watch: reports.filter(r => r.overallStatus === 'watch').length,
    fatigued: reports.filter(r => r.overallStatus === 'fatigued').length,
    critical: reports.filter(r => r.overallStatus === 'critical').length,
  };

  // Batch-level recommendation
  const criticalPct = reports.length > 0 ? statusBreakdown.critical / reports.length : 0;
  const fatiguedPct = reports.length > 0 ? (statusBreakdown.critical + statusBreakdown.fatigued) / reports.length : 0;

  let batchRecommendation: string;
  let urgency: BatchFatigueReport['urgency'];
  let shouldRefresh: boolean;

  if (criticalPct > 0.3) {
    batchRecommendation = 'Batch is severely fatigued. Generate next optimized batch immediately.';
    urgency = 'high';
    shouldRefresh = true;
  } else if (fatiguedPct > 0.4) {
    batchRecommendation = 'Many variants showing fatigue. Start preparing next batch within this week.';
    urgency = 'medium';
    shouldRefresh = true;
  } else if (statusBreakdown.watch > statusBreakdown.healthy) {
    batchRecommendation = 'Several variants to watch. Plan next batch for 1-2 weeks out.';
    urgency = 'low';
    shouldRefresh = false;
  } else {
    batchRecommendation = 'Batch is performing well. Continue running and monitoring.';
    urgency = 'none';
    shouldRefresh = false;
  }

  return {
    batchId: batch.id,
    analyzedAt: new Date().toISOString(),
    totalVariants: batch.variants.length,
    variantsWithData: reports.length,
    statusBreakdown,
    variantReports: reports,
    batchRecommendation,
    shouldRefresh,
    urgency,
  };
}

/**
 * Quick fatigue check using only the batch's existing single-period performance data.
 * Uses heuristics based on absolute metric thresholds when time-series data isn't available.
 */
export function quickFatigueCheck(batch: AdBatch): BatchFatigueReport {
  const reports: VariantFatigueReport[] = [];

  for (const variant of batch.variants) {
    if (!variant.performance || variant.performance.impressions < 100) continue;

    const p = variant.performance;
    const signals: FatigueSignal[] = [];

    // Heuristic: Very low CTR suggests fatigue or poor creative
    if (p.ctr < 0.5) {
      signals.push({
        variantId: variant.id, metric: 'CTR', trend: 'declining', severity: 'high',
        currentValue: round(p.ctr, 2), previousValue: 0, changePercent: 0,
        message: `CTR at ${round(p.ctr, 2)}% — well below platform average`,
      });
    } else if (p.ctr < 1.0) {
      signals.push({
        variantId: variant.id, metric: 'CTR', trend: 'declining', severity: 'medium',
        currentValue: round(p.ctr, 2), previousValue: 0, changePercent: 0,
        message: `CTR at ${round(p.ctr, 2)}% — below average`,
      });
    }

    // Heuristic: High CPC with low conversions
    if (p.cpc > 3 && p.conversions === 0) {
      signals.push({
        variantId: variant.id, metric: 'CPC', trend: 'declining', severity: 'high',
        currentValue: round(p.cpc, 2), previousValue: 0, changePercent: 0,
        message: `CPC $${round(p.cpc, 2)} with zero conversions`,
      });
    }

    // Heuristic: High spend, no results
    if (p.spend > 20 && p.conversions === 0 && p.roas === 0) {
      signals.push({
        variantId: variant.id, metric: 'ROAS', trend: 'declining', severity: 'critical',
        currentValue: 0, previousValue: 0, changePercent: 0,
        message: `$${round(p.spend, 0)} spent with zero ROAS`,
      });
    }

    const severityWeight = { low: 10, medium: 25, high: 45, critical: 70 };
    let fatigueScore = 0;
    for (const signal of signals) {
      fatigueScore += severityWeight[signal.severity];
    }
    fatigueScore = Math.min(100, fatigueScore);

    let overallStatus: VariantFatigueReport['overallStatus'] = 'healthy';
    if (fatigueScore >= 70) overallStatus = 'critical';
    else if (fatigueScore >= 45) overallStatus = 'fatigued';
    else if (fatigueScore >= 15) overallStatus = 'watch';

    let recommendation = 'Performing well.';
    if (overallStatus === 'critical') recommendation = 'Pause and replace.';
    else if (overallStatus === 'fatigued') recommendation = 'Prepare replacement.';
    else if (overallStatus === 'watch') recommendation = 'Monitor closely.';

    reports.push({
      variantId: variant.id,
      template: variant.parameters.visual.template,
      hookType: variant.parameters.copy.hookType,
      overallStatus,
      signals,
      fatigueScore,
      recommendation,
      estimatedDaysRemaining: overallStatus === 'critical' ? 1 : overallStatus === 'fatigued' ? 5 : 14,
    });
  }

  reports.sort((a, b) => b.fatigueScore - a.fatigueScore);

  const statusBreakdown = {
    healthy: reports.filter(r => r.overallStatus === 'healthy').length,
    watch: reports.filter(r => r.overallStatus === 'watch').length,
    fatigued: reports.filter(r => r.overallStatus === 'fatigued').length,
    critical: reports.filter(r => r.overallStatus === 'critical').length,
  };

  const fatiguedPct = reports.length > 0 ? (statusBreakdown.critical + statusBreakdown.fatigued) / reports.length : 0;

  return {
    batchId: batch.id,
    analyzedAt: new Date().toISOString(),
    totalVariants: batch.variants.length,
    variantsWithData: reports.length,
    statusBreakdown,
    variantReports: reports,
    batchRecommendation: fatiguedPct > 0.3 ? 'Consider generating next batch soon.' : 'Batch looks healthy.',
    shouldRefresh: fatiguedPct > 0.4,
    urgency: fatiguedPct > 0.5 ? 'high' : fatiguedPct > 0.3 ? 'medium' : 'none',
  };
}

// =============================================================================
// Helpers
// =============================================================================

function round(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}
