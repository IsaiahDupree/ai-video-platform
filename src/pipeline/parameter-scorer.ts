/**
 * Parameter Scorer
 *
 * Scores individual parameter values by aggregating performance data
 * across all variants that used each value. Produces rankings that
 * feed into the next-batch optimization engine.
 */

import type {
  AdBatch,
  AdVariant,
  MetaAdPerformance,
  ParameterScore,
  OptimizationConfig,
  DEFAULT_OPTIMIZATION_WEIGHTS,
} from './types';

// =============================================================================
// Parameter Extraction
// =============================================================================

type ParamPath = string; // e.g., "copy.hookType", "visual.template"

/**
 * Extract all parameter paths and their values from an AdVariant
 */
function extractParameters(variant: AdVariant): Record<ParamPath, string> {
  const p = variant.parameters;
  return {
    'visual.template': p.visual.template,
    'visual.characterStyle': p.visual.characterStyle,
    'visual.transitionStyle': p.visual.transitionStyle,
    'visual.colorScheme': p.visual.colorScheme,
    'visual.videoDuration': String(p.visual.videoDuration),
    'visual.aspectRatio': p.visual.aspectRatio,
    'copy.hookType': p.copy.hookType,
    'copy.headlineLength': p.copy.headlineLength,
    'copy.ctaType': p.copy.ctaType,
    'copy.toneOfVoice': p.copy.toneOfVoice,
    'targeting.awarenessLevel': p.targeting.awarenessLevel,
    'targeting.beliefCluster': p.targeting.beliefCluster,
    'structure.ctaPosition': p.structure.ctaPosition,
    'structure.labelStyle': p.structure.labelStyle,
    'structure.hasBeforeAfter': String(p.structure.hasBeforeAfter),
    'structure.hasTrustLine': String(p.structure.hasTrustLine),
    'structure.hasBadge': String(p.structure.hasBadge),
  };
}

// =============================================================================
// Scoring
// =============================================================================

interface AccumulatedMetrics {
  totalCtr: number;
  totalRoas: number;
  totalCpc: number;
  totalConversionRate: number;
  totalVideoViewRate: number;
  count: number;
}

/**
 * Score all parameters in a batch based on performance data
 */
export function scoreParameters(
  batch: AdBatch,
  weights?: OptimizationConfig['weights']
): Record<string, ParameterScore[]> {
  const w = weights || {
    ctr: 0.25,
    roas: 0.35,
    conversionRate: 0.25,
    videoViewRate: 0.15,
  };

  // Filter to variants with performance data
  const withPerf = batch.variants.filter(v => v.performance && v.performance.impressions > 0);

  if (withPerf.length === 0) {
    console.log('   ⚠️  No variants with performance data to score');
    return {};
  }

  console.log(`📈 Scoring parameters across ${withPerf.length} variants with data`);

  // Accumulate metrics per (parameter, value) pair
  const accumulator: Record<string, Record<string, AccumulatedMetrics>> = {};

  for (const variant of withPerf) {
    const params = extractParameters(variant);
    const perf = variant.performance!;

    for (const [paramPath, value] of Object.entries(params)) {
      if (!accumulator[paramPath]) accumulator[paramPath] = {};
      if (!accumulator[paramPath][value]) {
        accumulator[paramPath][value] = {
          totalCtr: 0, totalRoas: 0, totalCpc: 0,
          totalConversionRate: 0, totalVideoViewRate: 0, count: 0,
        };
      }

      const acc = accumulator[paramPath][value];
      acc.totalCtr += perf.ctr;
      acc.totalRoas += perf.roas;
      acc.totalCpc += perf.cpc;
      acc.totalConversionRate += perf.conversionRate;
      acc.totalVideoViewRate += perf.videoViewRate;
      acc.count += 1;
    }
  }

  // Compute averages and composite scores per parameter
  const result: Record<string, ParameterScore[]> = {};

  for (const [paramPath, values] of Object.entries(accumulator)) {
    const scores: ParameterScore[] = [];

    // Compute global min/max for normalization within this parameter
    const allAvgCtr: number[] = [];
    const allAvgRoas: number[] = [];
    const allAvgCvr: number[] = [];
    const allAvgVvr: number[] = [];

    const rawScores: {
      value: string;
      avgCtr: number;
      avgRoas: number;
      avgCpc: number;
      avgCvr: number;
      avgVvr: number;
      count: number;
    }[] = [];

    for (const [value, acc] of Object.entries(values)) {
      const avgCtr = acc.count > 0 ? acc.totalCtr / acc.count : 0;
      const avgRoas = acc.count > 0 ? acc.totalRoas / acc.count : 0;
      const avgCpc = acc.count > 0 ? acc.totalCpc / acc.count : 0;
      const avgCvr = acc.count > 0 ? acc.totalConversionRate / acc.count : 0;
      const avgVvr = acc.count > 0 ? acc.totalVideoViewRate / acc.count : 0;

      rawScores.push({ value, avgCtr, avgRoas, avgCpc, avgCvr, avgVvr, count: acc.count });
      allAvgCtr.push(avgCtr);
      allAvgRoas.push(avgRoas);
      allAvgCvr.push(avgCvr);
      allAvgVvr.push(avgVvr);
    }

    // Normalize function: 0-1 within parameter
    const normalize = (val: number, arr: number[]): number => {
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      if (max === min) return 0.5; // All same
      return (val - min) / (max - min);
    };

    for (const raw of rawScores) {
      // Confidence: need 5+ variants for full confidence
      const confidence = Math.min(1.0, raw.count / 5);

      // Composite score
      const compositeScore = (
        w.ctr * normalize(raw.avgCtr, allAvgCtr) +
        w.roas * normalize(raw.avgRoas, allAvgRoas) +
        w.conversionRate * normalize(raw.avgCvr, allAvgCvr) +
        w.videoViewRate * normalize(raw.avgVvr, allAvgVvr)
      ) * confidence;

      scores.push({
        parameter: paramPath,
        value: raw.value,
        metrics: {
          avgCtr: round(raw.avgCtr, 2),
          avgRoas: round(raw.avgRoas, 2),
          avgCpc: round(raw.avgCpc, 2),
          avgConversionRate: round(raw.avgCvr, 2),
          avgVideoViewRate: round(raw.avgVvr, 2),
          sampleSize: raw.count,
          confidence: round(confidence, 2),
        },
        compositeScore: round(compositeScore, 4),
        rank: 0, // Set after sorting
      });
    }

    // Sort by composite score descending and assign ranks
    scores.sort((a, b) => b.compositeScore - a.compositeScore);
    scores.forEach((s, i) => { s.rank = i + 1; });

    // Only include parameters with multiple values (no point ranking a single value)
    if (scores.length > 1) {
      result[paramPath] = scores;
    }
  }

  return result;
}

// =============================================================================
// Report Generation
// =============================================================================

export interface OptimizationReport {
  batchId: string;
  dateRange: { start: string; end: string };
  totalSpend: number;
  totalConversions: number;
  overallRoas: number;
  overallCtr: number;
  variantsAnalyzed: number;
  parameterRankings: Record<string, ParameterScore[]>;
  topCombinations: {
    variantId: string;
    headline: string;
    hookType: string;
    awareness: string;
    template: string;
    ctaType: string;
    ctr: number;
    roas: number;
    spend: number;
    conversions: number;
  }[];
  recommendations: {
    action: 'increase_budget' | 'pause' | 'iterate' | 'new_angle';
    target: string;
    reason: string;
    expectedImpact: string;
  }[];
  winners: Record<string, { value: string; score: number; confidence: number }>;
}

export function generateOptimizationReport(
  batch: AdBatch,
  weights?: OptimizationConfig['weights']
): OptimizationReport {
  console.log(`\n📊 Generating Optimization Report for batch: ${batch.id}`);

  const parameterRankings = scoreParameters(batch, weights);

  // Find top performing variants
  const withPerf = batch.variants
    .filter(v => v.performance && v.performance.impressions > 0)
    .sort((a, b) => {
      const aScore = (a.performance?.ctr || 0) * 0.5 + (a.performance?.roas || 0) * 0.5;
      const bScore = (b.performance?.ctr || 0) * 0.5 + (b.performance?.roas || 0) * 0.5;
      return bScore - aScore;
    });

  const topCombinations = withPerf.slice(0, 5).map(v => ({
    variantId: v.id,
    headline: v.parameters.copy.headline,
    hookType: v.parameters.copy.hookType,
    awareness: v.parameters.targeting.awarenessLevel,
    template: v.parameters.visual.template,
    ctaType: v.parameters.copy.ctaType,
    ctr: v.performance?.ctr || 0,
    roas: v.performance?.roas || 0,
    spend: v.performance?.spend || 0,
    conversions: v.performance?.conversions || 0,
  }));

  // Extract winners per parameter
  const winners: Record<string, { value: string; score: number; confidence: number }> = {};
  for (const [param, scores] of Object.entries(parameterRankings)) {
    if (scores.length > 0) {
      const top = scores[0];
      winners[param] = {
        value: top.value,
        score: top.compositeScore,
        confidence: top.metrics.confidence,
      };
    }
  }

  // Generate recommendations
  const recommendations: OptimizationReport['recommendations'] = [];

  // High-CTR hook recommendation
  const hookScores = parameterRankings['copy.hookType'];
  if (hookScores && hookScores.length >= 2) {
    const best = hookScores[0];
    const worst = hookScores[hookScores.length - 1];
    if (best.compositeScore > worst.compositeScore * 1.5) {
      recommendations.push({
        action: 'iterate',
        target: `copy.hookType: ${best.value}`,
        reason: `"${best.value}" hooks outperform "${worst.value}" by ${round((best.metrics.avgCtr / Math.max(worst.metrics.avgCtr, 0.01) - 1) * 100, 0)}% CTR`,
        expectedImpact: `Focus on ${best.value} hooks for +${round(best.metrics.avgCtr - worst.metrics.avgCtr, 1)}% CTR lift`,
      });
    }
  }

  // Template recommendation
  const templateScores = parameterRankings['visual.template'];
  if (templateScores && templateScores.length >= 2) {
    const best = templateScores[0];
    recommendations.push({
      action: 'increase_budget',
      target: `visual.template: ${best.value}`,
      reason: `"${best.value}" template has highest composite score (${best.compositeScore})`,
      expectedImpact: 'Allocate 70% of next batch to this template',
    });
  }

  // Low-performers to pause
  for (const variant of withPerf) {
    if (variant.performance && variant.performance.ctr < 0.5 && variant.performance.spend > 10) {
      recommendations.push({
        action: 'pause',
        target: variant.id,
        reason: `CTR ${variant.performance.ctr}% with $${variant.performance.spend} spend`,
        expectedImpact: 'Save budget for better-performing variants',
      });
      break; // Just one example
    }
  }

  const report: OptimizationReport = {
    batchId: batch.id,
    dateRange: batch.performance?.dateRange || { start: '', end: '' },
    totalSpend: batch.performance?.totalSpend || 0,
    totalConversions: batch.performance?.totalConversions || 0,
    overallRoas: batch.performance?.overallRoas || 0,
    overallCtr: batch.performance?.overallCtr || 0,
    variantsAnalyzed: withPerf.length,
    parameterRankings,
    topCombinations,
    recommendations,
    winners,
  };

  // Print summary
  console.log('\n   🏆 Parameter Winners:');
  for (const [param, winner] of Object.entries(winners)) {
    const shortParam = param.split('.').pop();
    console.log(`     ${shortParam}: "${winner.value}" (score: ${winner.score}, confidence: ${winner.confidence})`);
  }

  if (topCombinations.length > 0) {
    console.log('\n   🥇 Top Variants:');
    for (const combo of topCombinations.slice(0, 3)) {
      console.log(`     ${combo.variantId}: CTR ${combo.ctr}%, ROAS ${combo.roas}x`);
    }
  }

  if (recommendations.length > 0) {
    console.log('\n   💡 Recommendations:');
    for (const rec of recommendations) {
      console.log(`     [${rec.action}] ${rec.target}: ${rec.reason}`);
    }
  }

  return report;
}

// =============================================================================
// Statistical Significance (Welch's t-test)
// =============================================================================

interface SignificanceResult {
  parameterA: string;
  parameterB: string;
  metric: string;
  meanA: number;
  meanB: number;
  tStatistic: number;
  pValue: number;
  isSignificant: boolean;       // p < 0.05
  isHighlySignificant: boolean; // p < 0.01
  sampleSizeA: number;
  sampleSizeB: number;
  effectSize: number; // Cohen's d
  recommendation: string;
}

/**
 * Compute Welch's t-test between two groups of metric values.
 * Returns approximate p-value using the t-distribution approximation.
 */
function welchTTest(
  groupA: number[],
  groupB: number[]
): { tStatistic: number; pValue: number; degreesOfFreedom: number } {
  const nA = groupA.length;
  const nB = groupB.length;

  if (nA < 2 || nB < 2) {
    return { tStatistic: 0, pValue: 1, degreesOfFreedom: 0 };
  }

  const meanA = groupA.reduce((s, v) => s + v, 0) / nA;
  const meanB = groupB.reduce((s, v) => s + v, 0) / nB;

  const varA = groupA.reduce((s, v) => s + (v - meanA) ** 2, 0) / (nA - 1);
  const varB = groupB.reduce((s, v) => s + (v - meanB) ** 2, 0) / (nB - 1);

  const seA = varA / nA;
  const seB = varB / nB;
  const seDiff = Math.sqrt(seA + seB);

  if (seDiff === 0) {
    return { tStatistic: 0, pValue: 1, degreesOfFreedom: nA + nB - 2 };
  }

  const t = (meanA - meanB) / seDiff;

  // Welch–Satterthwaite degrees of freedom
  const df = (seA + seB) ** 2 / (
    (seA ** 2) / (nA - 1) + (seB ** 2) / (nB - 1)
  );

  // Approximate p-value using the regularized incomplete beta function
  // For simplicity, use a conservative lookup table for common df values
  const pValue = approximatePValue(Math.abs(t), Math.max(1, Math.floor(df)));

  return { tStatistic: round(t, 4), pValue: round(pValue, 4), degreesOfFreedom: round(df, 1) };
}

/**
 * Approximate two-tailed p-value from |t| and df.
 * Uses a simple approximation: p ≈ 2 * (1 - Φ(|t| * sqrt(df/(df+t²))))
 * where Φ is the standard normal CDF. Accurate for df > 5.
 */
function approximatePValue(absT: number, df: number): number {
  if (df <= 0 || absT === 0) return 1;

  // Convert t to approximate z-score
  const z = absT * Math.sqrt(df / (df + absT * absT));

  // Standard normal CDF approximation (Abramowitz and Stegun)
  const p = 0.5 * erfc(z / Math.SQRT2);
  return Math.min(1, 2 * p); // Two-tailed
}

/**
 * Complementary error function approximation
 */
function erfc(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return 1 - sign * y;
}

/**
 * Cohen's d effect size
 */
function cohensD(groupA: number[], groupB: number[]): number {
  const nA = groupA.length;
  const nB = groupB.length;
  if (nA < 2 || nB < 2) return 0;

  const meanA = groupA.reduce((s, v) => s + v, 0) / nA;
  const meanB = groupB.reduce((s, v) => s + v, 0) / nB;
  const varA = groupA.reduce((s, v) => s + (v - meanA) ** 2, 0) / (nA - 1);
  const varB = groupB.reduce((s, v) => s + (v - meanB) ** 2, 0) / (nB - 1);

  const pooledStd = Math.sqrt(((nA - 1) * varA + (nB - 1) * varB) / (nA + nB - 2));
  if (pooledStd === 0) return 0;

  return round((meanA - meanB) / pooledStd, 3);
}

/**
 * Run significance tests for the top parameter value vs. others.
 * Groups CTR values per parameter value across variants.
 */
export function testParameterSignificance(
  batch: AdBatch,
  metric: 'ctr' | 'roas' | 'conversionRate' = 'ctr'
): SignificanceResult[] {
  const withPerf = batch.variants.filter(v => v.performance && v.performance.impressions > 100);
  if (withPerf.length < 4) return [];

  const results: SignificanceResult[] = [];

  // Group metric values by each parameter
  const paramGroups: Record<string, Record<string, number[]>> = {};

  for (const variant of withPerf) {
    const params = extractParameters(variant);
    const metricVal = variant.performance![metric] || 0;

    for (const [paramPath, value] of Object.entries(params)) {
      if (!paramGroups[paramPath]) paramGroups[paramPath] = {};
      if (!paramGroups[paramPath][value]) paramGroups[paramPath][value] = [];
      paramGroups[paramPath][value].push(metricVal);
    }
  }

  // Test top value vs. each other value per parameter
  for (const [paramPath, valueGroups] of Object.entries(paramGroups)) {
    const entries = Object.entries(valueGroups).filter(([_, vals]) => vals.length >= 2);
    if (entries.length < 2) continue;

    // Sort by mean metric descending
    entries.sort((a, b) => {
      const meanA = a[1].reduce((s, v) => s + v, 0) / a[1].length;
      const meanB = b[1].reduce((s, v) => s + v, 0) / b[1].length;
      return meanB - meanA;
    });

    const [bestValue, bestGroup] = entries[0];
    const bestMean = bestGroup.reduce((s, v) => s + v, 0) / bestGroup.length;

    for (let i = 1; i < entries.length; i++) {
      const [otherValue, otherGroup] = entries[i];
      const otherMean = otherGroup.reduce((s, v) => s + v, 0) / otherGroup.length;

      const { tStatistic, pValue } = welchTTest(bestGroup, otherGroup);
      const effectSize = cohensD(bestGroup, otherGroup);
      const isSignificant = pValue < 0.05;
      const isHighlySignificant = pValue < 0.01;

      let recommendation = '';
      if (isHighlySignificant && Math.abs(effectSize) > 0.8) {
        recommendation = `Strong evidence: "${bestValue}" significantly outperforms "${otherValue}" (p=${pValue}, d=${effectSize}). Safe to heavily weight.`;
      } else if (isSignificant) {
        recommendation = `Moderate evidence: "${bestValue}" likely better than "${otherValue}" (p=${pValue}). Continue testing with more data.`;
      } else {
        recommendation = `Insufficient evidence: difference between "${bestValue}" and "${otherValue}" is not significant (p=${pValue}). Need more data.`;
      }

      results.push({
        parameterA: `${paramPath}=${bestValue}`,
        parameterB: `${paramPath}=${otherValue}`,
        metric,
        meanA: round(bestMean, 4),
        meanB: round(otherMean, 4),
        tStatistic,
        pValue,
        isSignificant,
        isHighlySignificant,
        sampleSizeA: bestGroup.length,
        sampleSizeB: otherGroup.length,
        effectSize,
        recommendation,
      });
    }
  }

  return results;
}

// =============================================================================
// Budget Allocation
// =============================================================================

export interface BudgetAllocation {
  variantId: string;
  template: string;
  hookType: string;
  currentSpend: number;
  recommendedSharePct: number;
  action: 'increase' | 'maintain' | 'decrease' | 'pause';
  reason: string;
}

/**
 * Generate budget allocation recommendations based on performance data.
 * Uses Thompson Sampling posterior means to weight budget proportionally.
 */
export function recommendBudgetAllocation(
  batch: AdBatch,
  totalDailyBudget: number = 100
): BudgetAllocation[] {
  const withPerf = batch.variants.filter(v => v.performance && v.performance.impressions > 100);
  if (withPerf.length === 0) return [];

  // Score each variant: composite of CTR and ROAS
  const scored = withPerf.map(v => {
    const p = v.performance!;
    // Bayesian adjustment: add pseudo-counts to avoid zero estimates
    const adjustedCtr = (p.clicks + 1) / (p.impressions + 100);
    const adjustedRoas = p.roas > 0 ? p.roas : 0.1;
    const score = adjustedCtr * 0.4 + Math.min(adjustedRoas, 10) * 0.06;
    return { variant: v, score, perf: p };
  });

  // Softmax to convert scores to budget shares
  const maxScore = Math.max(...scored.map(s => s.score));
  const expScores = scored.map(s => Math.exp((s.score - maxScore) * 10)); // temperature=0.1
  const sumExp = expScores.reduce((s, v) => s + v, 0);
  const shares = expScores.map(e => e / sumExp);

  const allocations: BudgetAllocation[] = scored.map((s, i) => {
    const share = round(shares[i] * 100, 1);
    const dailyAmount = round(shares[i] * totalDailyBudget, 2);

    let action: BudgetAllocation['action'] = 'maintain';
    let reason = '';

    if (share > 20) {
      action = 'increase';
      reason = `Top performer: CTR ${round(s.perf.ctr, 2)}%, ROAS ${round(s.perf.roas, 1)}x → $${dailyAmount}/day`;
    } else if (share > 5) {
      action = 'maintain';
      reason = `Mid-tier: CTR ${round(s.perf.ctr, 2)}%, ROAS ${round(s.perf.roas, 1)}x → $${dailyAmount}/day`;
    } else if (s.perf.ctr < 0.5 && s.perf.spend > 10) {
      action = 'pause';
      reason = `Underperforming: CTR ${round(s.perf.ctr, 2)}%, $${round(s.perf.spend, 0)} spent with low returns`;
    } else {
      action = 'decrease';
      reason = `Below average: CTR ${round(s.perf.ctr, 2)}% → reduce to $${dailyAmount}/day`;
    }

    return {
      variantId: s.variant.id,
      template: s.variant.parameters.visual.template,
      hookType: s.variant.parameters.copy.hookType,
      currentSpend: round(s.perf.spend, 2),
      recommendedSharePct: share,
      action,
      reason,
    };
  });

  // Sort by recommended share descending
  allocations.sort((a, b) => b.recommendedSharePct - a.recommendedSharePct);
  return allocations;
}

// =============================================================================
// Helpers
// =============================================================================

function round(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}
