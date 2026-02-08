/**
 * Variant Generator
 *
 * Generates parametrically-tagged ad variants from a VariantMatrix.
 * Supports full cross-product, latin square, and random sampling strategies.
 */

import type {
  AdParameters,
  AdVariant,
  VariantMatrix,
  CopyBank,
  AdSize,
  HookType,
  CtaType,
  AwarenessLevel,
  TemplateType,
  BrandConfig,
} from './types';

// =============================================================================
// Variant ID Encoding
// =============================================================================

const TEMPLATE_SHORT: Record<string, string> = {
  before_after: 'ba',
  testimonial: 'tm',
  product_demo: 'pd',
  problem_solution: 'ps',
};

const HOOK_SHORT: Record<string, string> = {
  question: 'q',
  statement: 'st',
  shock: 'sh',
  curiosity: 'cu',
  social_proof: 'sp',
  urgency: 'ur',
};

const AWARENESS_SHORT: Record<string, string> = {
  unaware: 'ua',
  problem_aware: 'pa',
  solution_aware: 'sa',
  product_aware: 'pda',
  most_aware: 'ma',
};

const CTA_SHORT: Record<string, string> = {
  action: 'act',
  benefit: 'ben',
  urgency: 'urg',
  curiosity: 'cur',
};

export function encodeVariantId(
  template: string,
  hookType: string,
  awareness: string,
  ctaType: string,
  sizeName: string,
  batchId: string,
  variantIndex: number
): string {
  const t = TEMPLATE_SHORT[template] || template.substring(0, 2);
  const h = HOOK_SHORT[hookType] || hookType.substring(0, 2);
  const a = AWARENESS_SHORT[awareness] || awareness.substring(0, 2);
  const c = CTA_SHORT[ctaType] || ctaType.substring(0, 3);
  const idx = String(variantIndex).padStart(2, '0');
  return `${t}_${h}_${a}_${c}_${sizeName}_${batchId}_v${idx}`;
}

export function decodeVariantId(id: string): {
  template: string;
  hookType: string;
  awareness: string;
  ctaType: string;
  sizeName: string;
  batchId: string;
  variantIndex: number;
} | null {
  const parts = id.split('_');
  if (parts.length < 7) return null;

  const reverseMap = (map: Record<string, string>, short: string): string => {
    for (const [key, val] of Object.entries(map)) {
      if (val === short) return key;
    }
    return short;
  };

  return {
    template: reverseMap(TEMPLATE_SHORT, parts[0]),
    hookType: reverseMap(HOOK_SHORT, parts[1]),
    awareness: reverseMap(AWARENESS_SHORT, parts[2]),
    ctaType: reverseMap(CTA_SHORT, parts[3]),
    sizeName: parts[4],
    batchId: parts[5],
    variantIndex: parseInt(parts[6].replace('v', ''), 10),
  };
}

// =============================================================================
// Copy Selection
// =============================================================================

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function classifyHeadlineLength(headline: string): 'short' | 'medium' | 'long' {
  const wordCount = headline.split(/\s+/).length;
  if (wordCount <= 4) return 'short';
  if (wordCount <= 8) return 'medium';
  return 'long';
}

function selectCopy(
  hookType: HookType,
  ctaType: CtaType,
  awarenessLevel: AwarenessLevel,
  copyBank: CopyBank
): {
  headline: string;
  subheadline: string;
  ctaText: string;
  beforeLabel: string;
  afterLabel: string;
  trustLine: string;
  badge: string;
} {
  const headlines = copyBank.headlines[hookType] || copyBank.headlines['question'] || ['Try it today'];
  const subheadlines = copyBank.subheadlines[awarenessLevel] || copyBank.subheadlines['problem_aware'] || [''];
  const ctas = copyBank.ctas[ctaType] || copyBank.ctas['action'] || ['Try Now'];

  return {
    headline: pickRandom(headlines),
    subheadline: pickRandom(subheadlines),
    ctaText: pickRandom(ctas),
    beforeLabel: pickRandom(copyBank.beforeLabels || ['BEFORE']),
    afterLabel: pickRandom(copyBank.afterLabels || ['AFTER']),
    trustLine: pickRandom(copyBank.trustLines || ['']),
    badge: pickRandom(copyBank.badges || ['']),
  };
}

// =============================================================================
// Matrix Generation Strategies
// =============================================================================

interface VariantSpec {
  template: TemplateType;
  hookType: HookType;
  awarenessLevel: AwarenessLevel;
  ctaType: CtaType;
  size: AdSize;
}

function generateFullCross(matrix: VariantMatrix): VariantSpec[] {
  const specs: VariantSpec[] = [];
  for (const template of matrix.templates) {
    for (const hookType of matrix.hookTypes) {
      for (const awareness of matrix.awarenessLevels) {
        for (const ctaType of matrix.ctaTypes) {
          for (const size of matrix.sizes) {
            specs.push({ template, hookType, awarenessLevel: awareness, ctaType, size });
          }
        }
      }
    }
  }
  return specs;
}

function generateLatinSquare(matrix: VariantMatrix): VariantSpec[] {
  // Generate a balanced subset: each parameter value appears roughly equally
  const specs: VariantSpec[] = [];
  const maxPerParam = Math.ceil(matrix.maxVariants / Math.max(
    matrix.templates.length,
    matrix.hookTypes.length,
    matrix.awarenessLevels.length,
    matrix.ctaTypes.length,
  ));

  const usageCounts: Record<string, number> = {};
  const countKey = (param: string, value: string) => `${param}:${value}`;
  const getCount = (param: string, value: string) => usageCounts[countKey(param, value)] || 0;
  const incCount = (param: string, value: string) => {
    usageCounts[countKey(param, value)] = getCount(param, value) + 1;
  };

  // Generate all combos then pick balanced subset
  const allCombos = generateFullCross(matrix);

  // Shuffle for randomness
  for (let i = allCombos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCombos[i], allCombos[j]] = [allCombos[j], allCombos[i]];
  }

  // Score each combo by how underrepresented its params are
  for (const combo of allCombos) {
    if (specs.length >= matrix.maxVariants) break;

    const score =
      getCount('template', combo.template) +
      getCount('hookType', combo.hookType) +
      getCount('awareness', combo.awarenessLevel) +
      getCount('ctaType', combo.ctaType);

    // Prefer combos with underrepresented params
    if (score <= maxPerParam * 4) {
      specs.push(combo);
      incCount('template', combo.template);
      incCount('hookType', combo.hookType);
      incCount('awareness', combo.awarenessLevel);
      incCount('ctaType', combo.ctaType);
    }
  }

  return specs;
}

function generateRandomSample(matrix: VariantMatrix): VariantSpec[] {
  const allCombos = generateFullCross(matrix);

  // Shuffle
  for (let i = allCombos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCombos[i], allCombos[j]] = [allCombos[j], allCombos[i]];
  }

  return allCombos.slice(0, matrix.maxVariants);
}

// =============================================================================
// Main Generator
// =============================================================================

export function generateVariants(
  matrix: VariantMatrix,
  copyBank: CopyBank,
  batchId: string
): AdVariant[] {
  console.log(`📐 Variant Generator: strategy=${matrix.strategy}, max=${matrix.maxVariants}`);

  // Generate specs based on strategy
  let specs: VariantSpec[];
  switch (matrix.strategy) {
    case 'full_cross':
      specs = generateFullCross(matrix);
      break;
    case 'latin_square':
      specs = generateLatinSquare(matrix);
      break;
    case 'random_sample':
      specs = generateRandomSample(matrix);
      break;
    default:
      specs = generateLatinSquare(matrix);
  }

  // Cap at max
  specs = specs.slice(0, matrix.maxVariants);
  console.log(`   Generated ${specs.length} variant specs`);

  // Build full AdVariant objects
  const variants: AdVariant[] = specs.map((spec, index) => {
    const copy = selectCopy(spec.hookType, spec.ctaType, spec.awarenessLevel, copyBank);
    const variantId = encodeVariantId(
      spec.template,
      spec.hookType,
      spec.awarenessLevel,
      spec.ctaType,
      spec.size.name,
      batchId,
      index
    );

    const parameters: AdParameters = {
      visual: {
        template: spec.template,
        characterStyle: 'realistic',
        transitionStyle: 'cut',
        colorScheme: 'dark',
        videoDuration: 8,
        aspectRatio: spec.size.width === spec.size.height ? '1:1'
          : spec.size.width > spec.size.height ? '16:9'
          : '9:16',
      },
      copy: {
        hookType: spec.hookType,
        headline: copy.headline,
        headlineLength: classifyHeadlineLength(copy.headline),
        subheadline: copy.subheadline,
        ctaType: spec.ctaType,
        ctaText: copy.ctaText,
        toneOfVoice: 'casual',
        beforeLabel: copy.beforeLabel,
        afterLabel: copy.afterLabel,
      },
      targeting: {
        awarenessLevel: spec.awarenessLevel,
        beliefCluster: 'general',
        painPoint: 'general',
        desiredOutcome: 'general',
      },
      structure: {
        hasBeforeAfter: spec.template === 'before_after',
        hasTrustLine: copy.trustLine.length > 0,
        hasBadge: copy.badge.length > 0,
        hasFooter: true,
        ctaPosition: 'bottom',
        labelStyle: 'pill',
      },
    };

    // UTM params
    const utmParams = {
      utm_source: spec.size.platform,
      utm_medium: 'cpc',
      utm_campaign: batchId,
      utm_content: variantId,
    };

    return {
      id: variantId,
      batchId,
      variantIndex: index,
      parameters,
      assets: {
        composedPaths: {},
      },
      utmParams,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  // Log distribution
  const dist: Record<string, Record<string, number>> = {};
  const countParam = (param: string, value: string) => {
    if (!dist[param]) dist[param] = {};
    dist[param][value] = (dist[param][value] || 0) + 1;
  };

  for (const v of variants) {
    countParam('template', v.parameters.visual.template);
    countParam('hookType', v.parameters.copy.hookType);
    countParam('awareness', v.parameters.targeting.awarenessLevel);
    countParam('ctaType', v.parameters.copy.ctaType);
  }

  console.log('   Distribution:');
  for (const [param, values] of Object.entries(dist)) {
    const vals = Object.entries(values).map(([k, v]) => `${k}:${v}`).join(', ');
    console.log(`     ${param}: ${vals}`);
  }

  return variants;
}
