/**
 * Batch Comparator
 *
 * Compares two batches (e.g., original vs. optimized) to measure
 * improvement across key metrics. Also includes a sample size
 * calculator for planning A/B tests with sufficient statistical power.
 */

import type { AdBatch, AdVariant } from './types';

// =============================================================================
// Batch Comparison
// =============================================================================

export interface BatchComparisonResult {
  batchA: { id: string; variantsTotal: number; variantsWithData: number };
  batchB: { id: string; variantsTotal: number; variantsWithData: number };
  metrics: {
    ctr: MetricDelta;
    roas: MetricDelta;
    cpc: MetricDelta;
    conversionRate: MetricDelta;
    videoViewRate: MetricDelta;
    spend: MetricDelta;
  };
  parameterShifts: ParameterShift[];
  templateComparison: TemplateComparison[];
  summary: string;
}

export interface MetricDelta {
  batchA: number;
  batchB: number;
  absoluteDelta: number;
  percentDelta: number;
  improved: boolean;
}

export interface ParameterShift {
  parameter: string;
  winnerA: string;
  winnerB: string;
  shifted: boolean;
  description: string;
}

export interface TemplateComparison {
  template: string;
  countA: number;
  countB: number;
  avgCtrA: number;
  avgCtrB: number;
  avgRoasA: number;
  avgRoasB: number;
  ctrDelta: number;
  roasDelta: number;
}

function aggregateMetrics(variants: AdVariant[]): {
  avgCtr: number; avgRoas: number; avgCpc: number;
  avgCvr: number; avgVvr: number; totalSpend: number; count: number;
} {
  const withPerf = variants.filter(v => v.performance && v.performance.impressions > 0);
  if (withPerf.length === 0) {
    return { avgCtr: 0, avgRoas: 0, avgCpc: 0, avgCvr: 0, avgVvr: 0, totalSpend: 0, count: 0 };
  }

  const sum = withPerf.reduce((acc, v) => {
    const p = v.performance!;
    return {
      ctr: acc.ctr + p.ctr,
      roas: acc.roas + p.roas,
      cpc: acc.cpc + p.cpc,
      cvr: acc.cvr + p.conversionRate,
      vvr: acc.vvr + p.videoViewRate,
      spend: acc.spend + p.spend,
    };
  }, { ctr: 0, roas: 0, cpc: 0, cvr: 0, vvr: 0, spend: 0 });

  const n = withPerf.length;
  return {
    avgCtr: round(sum.ctr / n, 4),
    avgRoas: round(sum.roas / n, 4),
    avgCpc: round(sum.cpc / n, 4),
    avgCvr: round(sum.cvr / n, 4),
    avgVvr: round(sum.vvr / n, 4),
    totalSpend: round(sum.spend, 2),
    count: n,
  };
}

function makeDelta(a: number, b: number, lowerIsBetter = false): MetricDelta {
  const absoluteDelta = round(b - a, 4);
  const percentDelta = a > 0 ? round(((b - a) / a) * 100, 1) : 0;
  const improved = lowerIsBetter ? b < a : b > a;
  return { batchA: round(a, 4), batchB: round(b, 4), absoluteDelta, percentDelta, improved };
}

/**
 * Compare two batches across all key metrics
 */
export function compareBatches(batchA: AdBatch, batchB: AdBatch): BatchComparisonResult {
  const metricsA = aggregateMetrics(batchA.variants);
  const metricsB = aggregateMetrics(batchB.variants);

  const metrics = {
    ctr: makeDelta(metricsA.avgCtr, metricsB.avgCtr),
    roas: makeDelta(metricsA.avgRoas, metricsB.avgRoas),
    cpc: makeDelta(metricsA.avgCpc, metricsB.avgCpc, true),
    conversionRate: makeDelta(metricsA.avgCvr, metricsB.avgCvr),
    videoViewRate: makeDelta(metricsA.avgVvr, metricsB.avgVvr),
    spend: makeDelta(metricsA.totalSpend, metricsB.totalSpend),
  };

  // Parameter winner shifts
  const parameterShifts = computeParameterShifts(batchA, batchB);

  // Template comparison
  const templateComparison = computeTemplateComparison(batchA, batchB);

  // Summary
  const improvements = [metrics.ctr, metrics.roas, metrics.conversionRate, metrics.videoViewRate]
    .filter(m => m.improved).length;
  const total = 4;

  let summary = `Batch ${batchB.id} vs ${batchA.id}: `;
  if (metricsA.count === 0 || metricsB.count === 0) {
    summary += 'Insufficient performance data for comparison. Run ads and ingest Meta data first.';
  } else if (improvements === total) {
    summary += `All ${total} metrics improved. Optimization is working well.`;
  } else if (improvements >= total / 2) {
    summary += `${improvements}/${total} metrics improved. Positive trend, continue optimizing.`;
  } else {
    summary += `Only ${improvements}/${total} metrics improved. Consider adjusting optimization strategy.`;
  }

  if (metrics.ctr.improved) {
    summary += ` CTR: ${metrics.ctr.percentDelta > 0 ? '+' : ''}${metrics.ctr.percentDelta}%.`;
  }
  if (metrics.roas.improved) {
    summary += ` ROAS: ${metrics.roas.percentDelta > 0 ? '+' : ''}${metrics.roas.percentDelta}%.`;
  }

  return {
    batchA: { id: batchA.id, variantsTotal: batchA.variants.length, variantsWithData: metricsA.count },
    batchB: { id: batchB.id, variantsTotal: batchB.variants.length, variantsWithData: metricsB.count },
    metrics,
    parameterShifts,
    templateComparison,
    summary,
  };
}

function computeParameterShifts(batchA: AdBatch, batchB: AdBatch): ParameterShift[] {
  const shifts: ParameterShift[] = [];

  const dims: { name: string; extract: (v: AdVariant) => string }[] = [
    { name: 'template', extract: v => v.parameters.visual.template },
    { name: 'hookType', extract: v => v.parameters.copy.hookType },
    { name: 'awarenessLevel', extract: v => v.parameters.targeting.awarenessLevel },
    { name: 'ctaType', extract: v => v.parameters.copy.ctaType },
    { name: 'colorScheme', extract: v => v.parameters.visual.colorScheme },
  ];

  for (const dim of dims) {
    const winnerA = findWinnerByDimension(batchA.variants, dim.extract);
    const winnerB = findWinnerByDimension(batchB.variants, dim.extract);

    const shifted = winnerA !== winnerB && winnerA !== '' && winnerB !== '';
    shifts.push({
      parameter: dim.name,
      winnerA,
      winnerB,
      shifted,
      description: shifted
        ? `Winner shifted from "${winnerA}" to "${winnerB}"`
        : winnerA ? `Winner stable: "${winnerA}"` : 'No data',
    });
  }

  return shifts;
}

function findWinnerByDimension(
  variants: AdVariant[],
  extract: (v: AdVariant) => string
): string {
  const withPerf = variants.filter(v => v.performance && v.performance.impressions > 0);
  if (withPerf.length === 0) return '';

  const groups: Record<string, { totalCtr: number; count: number }> = {};
  for (const v of withPerf) {
    const key = extract(v);
    if (!groups[key]) groups[key] = { totalCtr: 0, count: 0 };
    groups[key].totalCtr += v.performance!.ctr;
    groups[key].count++;
  }

  let best = '';
  let bestAvg = -1;
  for (const [key, { totalCtr, count }] of Object.entries(groups)) {
    const avg = totalCtr / count;
    if (avg > bestAvg) {
      bestAvg = avg;
      best = key;
    }
  }
  return best;
}

function computeTemplateComparison(batchA: AdBatch, batchB: AdBatch): TemplateComparison[] {
  const allTemplates = new Set([
    ...batchA.variants.map(v => v.parameters.visual.template),
    ...batchB.variants.map(v => v.parameters.visual.template),
  ]);

  const results: TemplateComparison[] = [];
  for (const template of allTemplates) {
    const variantsA = batchA.variants.filter(v => v.parameters.visual.template === template);
    const variantsB = batchB.variants.filter(v => v.parameters.visual.template === template);

    const perfA = variantsA.filter(v => v.performance && v.performance.impressions > 0);
    const perfB = variantsB.filter(v => v.performance && v.performance.impressions > 0);

    const avgCtrA = perfA.length > 0 ? perfA.reduce((s, v) => s + v.performance!.ctr, 0) / perfA.length : 0;
    const avgCtrB = perfB.length > 0 ? perfB.reduce((s, v) => s + v.performance!.ctr, 0) / perfB.length : 0;
    const avgRoasA = perfA.length > 0 ? perfA.reduce((s, v) => s + v.performance!.roas, 0) / perfA.length : 0;
    const avgRoasB = perfB.length > 0 ? perfB.reduce((s, v) => s + v.performance!.roas, 0) / perfB.length : 0;

    results.push({
      template,
      countA: variantsA.length,
      countB: variantsB.length,
      avgCtrA: round(avgCtrA, 4),
      avgCtrB: round(avgCtrB, 4),
      avgRoasA: round(avgRoasA, 4),
      avgRoasB: round(avgRoasB, 4),
      ctrDelta: round(avgCtrB - avgCtrA, 4),
      roasDelta: round(avgRoasB - avgRoasA, 4),
    });
  }

  return results.sort((a, b) => b.ctrDelta - a.ctrDelta);
}

// =============================================================================
// Sample Size Calculator
// =============================================================================

export interface SampleSizeResult {
  baselineCtr: number;
  minimumDetectableEffect: number;  // e.g., 0.20 = 20% relative lift
  significanceLevel: number;         // alpha, default 0.05
  power: number;                     // 1 - beta, default 0.80
  sampleSizePerVariant: number;
  totalSampleSize: number;
  numVariants: number;
  estimatedDays: number;
  estimatedBudget: number;
}

/**
 * Calculate required sample size per variant for a given effect size.
 * Uses the normal approximation for proportions (two-sample z-test).
 *
 * @param baselineCtr - Current CTR as a proportion (e.g., 0.02 for 2%)
 * @param mde - Minimum detectable effect as relative change (e.g., 0.20 for 20% lift)
 * @param alpha - Significance level (default 0.05)
 * @param power - Statistical power (default 0.80)
 * @param numVariants - Number of variants being tested (for Bonferroni correction)
 * @param dailyImpressions - Expected daily impressions per variant
 * @param cpm - Cost per 1000 impressions
 */
export function calculateSampleSize(options: {
  baselineCtr: number;
  mde: number;
  alpha?: number;
  power?: number;
  numVariants?: number;
  dailyImpressions?: number;
  cpm?: number;
}): SampleSizeResult {
  const {
    baselineCtr,
    mde,
    alpha = 0.05,
    power = 0.80,
    numVariants = 2,
    dailyImpressions = 1000,
    cpm = 15,
  } = options;

  // Bonferroni correction for multiple comparisons
  const adjustedAlpha = alpha / Math.max(1, numVariants - 1);

  // z-scores
  const zAlpha = normalQuantile(1 - adjustedAlpha / 2);
  const zBeta = normalQuantile(power);

  // CTR after effect
  const p1 = baselineCtr;
  const p2 = baselineCtr * (1 + mde);
  const pBar = (p1 + p2) / 2;

  // Sample size formula (two-proportion z-test)
  const numerator = (zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) + zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2;
  const denominator = (p2 - p1) ** 2;

  const sampleSizePerVariant = Math.ceil(numerator / denominator);
  const totalSampleSize = sampleSizePerVariant * numVariants;

  const estimatedDays = Math.ceil(sampleSizePerVariant / dailyImpressions);
  const estimatedBudget = round((totalSampleSize / 1000) * cpm, 2);

  return {
    baselineCtr,
    minimumDetectableEffect: mde,
    significanceLevel: alpha,
    power,
    sampleSizePerVariant,
    totalSampleSize,
    numVariants,
    estimatedDays,
    estimatedBudget,
  };
}

/**
 * Approximate inverse normal CDF (quantile function).
 * Uses Beasley-Springer-Moro algorithm.
 */
function normalQuantile(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  // Rational approximation for central region
  const a = [
    -3.969683028665376e+01, 2.209460984245205e+02,
    -2.759285104469687e+02, 1.383577518672690e+02,
    -3.066479806614716e+01, 2.506628277459239e+00,
  ];
  const b = [
    -5.447609879822406e+01, 1.615858368580409e+02,
    -1.556989798598866e+02, 6.680131188771972e+01,
    -1.328068155288572e+01,
  ];
  const c = [
    -7.784894002430293e-03, -3.223964580411365e-01,
    -2.400758277161838e+00, -2.549732539343734e+00,
    4.374664141464968e+00, 2.938163982698783e+00,
  ];
  const d = [
    7.784695709041462e-03, 3.224671290700398e-01,
    2.445134137142996e+00, 3.754408661907416e+00,
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number, r: number;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
}

// =============================================================================
// Helpers
// =============================================================================

function round(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}
