/**
 * Optimization Engine
 *
 * Uses Thompson Sampling (multi-armed bandit) to generate the next batch
 * of ad variants biased toward winning parameter combinations while
 * still exploring new combinations.
 *
 * Strategy: 70% exploit winners / 20% explore untested / 10% mutate winners
 */

import type {
  AdBatch,
  AdVariant,
  AdParameters,
  VariantMatrix,
  CopyBank,
  BatchStrategy,
  ParameterScore,
  TemplateType,
  HookType,
  AwarenessLevel,
  CtaType,
  DEFAULT_BATCH_STRATEGY,
} from './types';
import { generateVariants } from './variant-generator';
import type { OptimizationReport } from './parameter-scorer';
import { testParameterSignificance } from './parameter-scorer';

// =============================================================================
// Thompson Sampling Helpers
// =============================================================================

/**
 * Sample from a Beta distribution (simplified approximation)
 * Used for Thompson Sampling: higher alpha = more successes = higher sample
 */
function betaSample(alpha: number, beta: number): number {
  // Simple approximation using the mean + noise proportional to variance
  const mean = alpha / (alpha + beta);
  const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
  const noise = (Math.random() - 0.5) * 2 * Math.sqrt(variance) * 3;
  return Math.max(0, Math.min(1, mean + noise));
}

/**
 * Convert a parameter score to Beta distribution parameters
 */
function scoreToBeta(score: ParameterScore): { alpha: number; beta: number } {
  // Map composite score (0-1) to success rate
  const successRate = Math.max(0.01, Math.min(0.99, score.compositeScore));
  const n = score.metrics.sampleSize;

  // Alpha = successes, Beta = failures (pseudo-counts based on sample size)
  const alpha = 1 + successRate * n;
  const beta = 1 + (1 - successRate) * n;

  return { alpha, beta };
}

// =============================================================================
// Winner Extraction
// =============================================================================

interface WinningParams {
  templates: TemplateType[];
  hookTypes: HookType[];
  awarenessLevels: AwarenessLevel[];
  ctaTypes: CtaType[];
}

function extractWinners(report: OptimizationReport): WinningParams {
  const winners: WinningParams = {
    templates: [],
    hookTypes: [],
    awarenessLevels: [],
    ctaTypes: [],
  };

  // Get top-ranked values for each key parameter
  const templateScores = report.parameterRankings['visual.template'] || [];
  const hookScores = report.parameterRankings['copy.hookType'] || [];
  const awarenessScores = report.parameterRankings['targeting.awarenessLevel'] || [];
  const ctaScores = report.parameterRankings['copy.ctaType'] || [];

  // Take top 50% of each (at least 1)
  const topHalf = (scores: ParameterScore[]) =>
    scores.slice(0, Math.max(1, Math.ceil(scores.length / 2)));

  winners.templates = topHalf(templateScores).map(s => s.value as TemplateType);
  winners.hookTypes = topHalf(hookScores).map(s => s.value as HookType);
  winners.awarenessLevels = topHalf(awarenessScores).map(s => s.value as AwarenessLevel);
  winners.ctaTypes = topHalf(ctaScores).map(s => s.value as CtaType);

  return winners;
}

function extractLosers(report: OptimizationReport): WinningParams {
  const losers: WinningParams = {
    templates: [],
    hookTypes: [],
    awarenessLevels: [],
    ctaTypes: [],
  };

  const templateScores = report.parameterRankings['visual.template'] || [];
  const hookScores = report.parameterRankings['copy.hookType'] || [];
  const awarenessScores = report.parameterRankings['targeting.awarenessLevel'] || [];
  const ctaScores = report.parameterRankings['copy.ctaType'] || [];

  // Bottom 50%
  const bottomHalf = (scores: ParameterScore[]) =>
    scores.slice(Math.ceil(scores.length / 2));

  losers.templates = bottomHalf(templateScores).map(s => s.value as TemplateType);
  losers.hookTypes = bottomHalf(hookScores).map(s => s.value as HookType);
  losers.awarenessLevels = bottomHalf(awarenessScores).map(s => s.value as AwarenessLevel);
  losers.ctaTypes = bottomHalf(ctaScores).map(s => s.value as CtaType);

  return losers;
}

// =============================================================================
// Tested Combination Tracking
// =============================================================================

type ComboKey = string; // "template:hookType:awareness:ctaType"

function comboKey(template: string, hook: string, awareness: string, cta: string): ComboKey {
  return `${template}:${hook}:${awareness}:${cta}`;
}

function getTestedCombos(batch: AdBatch): Set<ComboKey> {
  const tested = new Set<ComboKey>();
  for (const variant of batch.variants) {
    const p = variant.parameters;
    tested.add(comboKey(
      p.visual.template,
      p.copy.hookType,
      p.targeting.awarenessLevel,
      p.copy.ctaType,
    ));
  }
  return tested;
}

// =============================================================================
// Next Batch Generation
// =============================================================================

export interface NextBatchConfig {
  previousBatch: AdBatch;
  report: OptimizationReport;
  allTemplates: TemplateType[];
  allHookTypes: HookType[];
  allAwarenessLevels: AwarenessLevel[];
  allCtaTypes: CtaType[];
  copyBank: CopyBank;
  maxVariants: number;
  strategy?: BatchStrategy;
  sizes: import('./types').AdSize[];
  /** When true, only exploit parameters with statistically significant wins */
  significanceAware?: boolean;
}

export function generateNextBatch(config: NextBatchConfig): {
  exploitVariants: number;
  exploreVariants: number;
  mutateVariants: number;
  matrix: VariantMatrix;
  variants: AdVariant[];
} {
  const strategy = config.strategy || {
    exploitation: { percentage: 0.70 },
    exploration: { percentage: 0.20 },
    mutation: { percentage: 0.10 },
  };

  const total = config.maxVariants;
  const exploitCount = Math.round(total * strategy.exploitation.percentage);
  const exploreCount = Math.round(total * strategy.exploration.percentage);
  const mutateCount = total - exploitCount - exploreCount;

  console.log(`\n🧠 Optimization Engine: Generating next batch`);
  console.log(`   Total: ${total} variants`);
  console.log(`   Exploit: ${exploitCount} (${(strategy.exploitation.percentage * 100).toFixed(0)}%)`);
  console.log(`   Explore: ${exploreCount} (${(strategy.exploration.percentage * 100).toFixed(0)}%)`);
  console.log(`   Mutate:  ${mutateCount} (${(strategy.mutation.percentage * 100).toFixed(0)}%)`);

  const winners = extractWinners(config.report);
  const testedCombos = getTestedCombos(config.previousBatch);
  const batchId = `b${String(Date.now()).slice(-6)}`;

  // Significance-aware: adjust exploit/explore ratio based on evidence strength
  let adjustedExploitCount = exploitCount;
  let adjustedExploreCount = exploreCount;
  let significantParams: Set<string> = new Set();

  if (config.significanceAware !== false) {
    try {
      const sigResults = testParameterSignificance(config.previousBatch, 'ctr');
      significantParams = new Set(
        sigResults.filter(r => r.isSignificant).map(r => r.parameterA.split('=')[0])
      );

      const totalParams = 4; // template, hook, awareness, cta
      const sigCount = [
        significantParams.has('visual.template'),
        significantParams.has('copy.hookType'),
        significantParams.has('targeting.awarenessLevel'),
        significantParams.has('copy.ctaType'),
      ].filter(Boolean).length;

      if (sigCount === 0) {
        // No significant differences found — shift budget toward exploration
        const shift = Math.floor(exploitCount * 0.3);
        adjustedExploitCount = exploitCount - shift;
        adjustedExploreCount = exploreCount + shift;
        console.log(`\n   🔬 Significance: No significant parameter winners yet`);
        console.log(`      Shifting ${shift} variants from exploit → explore for more data`);
      } else if (sigCount < totalParams) {
        console.log(`\n   🔬 Significance: ${sigCount}/${totalParams} parameters have significant winners`);
        console.log(`      Significant: ${[...significantParams].map(p => p.split('.').pop()).join(', ')}`);
      } else {
        console.log(`\n   🔬 Significance: All ${sigCount} parameters have significant winners — full exploitation`);
      }
    } catch {
      // Significance testing failed (e.g. not enough data) — proceed with defaults
    }
  }

  // =========================================================================
  // Exploitation: Use winning parameters
  // =========================================================================
  console.log('\n   📈 Exploitation: Using winning parameters');
  console.log(`     Templates: ${winners.templates.join(', ')}`);
  console.log(`     Hooks: ${winners.hookTypes.join(', ')}`);
  console.log(`     Awareness: ${winners.awarenessLevels.join(', ')}`);
  console.log(`     CTAs: ${winners.ctaTypes.join(', ')}`);

  const exploitMatrix: VariantMatrix = {
    templates: winners.templates.length > 0 ? winners.templates : config.allTemplates.slice(0, 1),
    hookTypes: winners.hookTypes.length > 0 ? winners.hookTypes : config.allHookTypes.slice(0, 1),
    awarenessLevels: winners.awarenessLevels.length > 0 ? winners.awarenessLevels : config.allAwarenessLevels.slice(0, 1),
    ctaTypes: winners.ctaTypes.length > 0 ? winners.ctaTypes : config.allCtaTypes.slice(0, 1),
    sizes: config.sizes,
    strategy: 'latin_square',
    maxVariants: adjustedExploitCount,
  };

  const exploitVariants = generateVariants(exploitMatrix, config.copyBank, batchId);

  // =========================================================================
  // Exploration: Try untested combinations
  // =========================================================================
  console.log('\n   🔍 Exploration: Trying untested combinations');

  // Find all possible combinations not yet tested
  const untestedTemplates = config.allTemplates.filter(t => !winners.templates.includes(t));
  const untestedHooks = config.allHookTypes.filter(h => !winners.hookTypes.includes(h));

  const exploreMatrix: VariantMatrix = {
    templates: untestedTemplates.length > 0 ? untestedTemplates : config.allTemplates,
    hookTypes: untestedHooks.length > 0 ? untestedHooks : config.allHookTypes,
    awarenessLevels: config.allAwarenessLevels,
    ctaTypes: config.allCtaTypes,
    sizes: config.sizes,
    strategy: 'random_sample',
    maxVariants: adjustedExploreCount,
  };

  const exploreVariants = generateVariants(exploreMatrix, config.copyBank, batchId);

  // =========================================================================
  // Mutation: Modify winners by changing 1 parameter
  // =========================================================================
  console.log('\n   🧬 Mutation: Varying one parameter on winners');

  const mutateMatrix: VariantMatrix = {
    templates: winners.templates.length > 0 ? winners.templates : config.allTemplates.slice(0, 1),
    hookTypes: config.allHookTypes, // Vary hooks on winning templates
    awarenessLevels: winners.awarenessLevels.length > 0 ? winners.awarenessLevels : config.allAwarenessLevels.slice(0, 1),
    ctaTypes: config.allCtaTypes, // Vary CTAs on winning awareness
    sizes: config.sizes,
    strategy: 'random_sample',
    maxVariants: mutateCount,
  };

  const mutateVariantsResult = generateVariants(mutateMatrix, config.copyBank, batchId);

  // =========================================================================
  // Combine all variants
  // =========================================================================
  const allVariants = [
    ...exploitVariants,
    ...exploreVariants,
    ...mutateVariantsResult,
  ];

  // Re-index
  allVariants.forEach((v, i) => {
    v.variantIndex = i;
  });

  // Build combined matrix (for metadata)
  const combinedMatrix: VariantMatrix = {
    templates: [...new Set(allVariants.map(v => v.parameters.visual.template))],
    hookTypes: [...new Set(allVariants.map(v => v.parameters.copy.hookType))],
    awarenessLevels: [...new Set(allVariants.map(v => v.parameters.targeting.awarenessLevel))],
    ctaTypes: [...new Set(allVariants.map(v => v.parameters.copy.ctaType))],
    sizes: config.sizes,
    strategy: 'latin_square',
    maxVariants: total,
  };

  console.log(`\n   ✅ Next batch: ${allVariants.length} variants generated`);

  return {
    exploitVariants: exploitVariants.length,
    exploreVariants: exploreVariants.length,
    mutateVariants: mutateVariantsResult.length,
    matrix: combinedMatrix,
    variants: allVariants,
  };
}
