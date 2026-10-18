/**
 * Variant Generator
 * 
 * Generates ad variants from a base template with different copy/assets.
 * Supports batch generation for A/B testing.
 */

import type { TemplateDSL, VariantSpec, Bindings } from '../schema/template-dsl';
import { applyVariant, validateTemplate } from '../schema/template-dsl';

// =============================================================================
// Types
// =============================================================================

export interface VariantBatch {
  templateId: string;
  variants: GeneratedVariant[];
}

export interface GeneratedVariant {
  variantId: string;
  name: string;
  template: TemplateDSL;
  props: {
    template: TemplateDSL;
    overrideBindings?: Partial<Bindings>;
  };
}

export interface CopyTestConfig {
  headlines: string[];
  subheadlines?: string[];
  ctas?: string[];
}

export interface ImageTestConfig {
  heroes?: string[];
  backgrounds?: string[];
  logos?: string[];
  products?: string[];
}

export interface MatrixTestConfig {
  copy?: CopyTestConfig;
  images?: ImageTestConfig;
  maxVariants?: number;
}

// =============================================================================
// Variant Generation Functions
// =============================================================================

/**
 * Generates a single variant from a template and variant spec
 */
export function generateVariant(
  baseTemplate: TemplateDSL,
  spec: VariantSpec
): GeneratedVariant {
  const variant = applyVariant(baseTemplate, spec);
  
  return {
    variantId: spec.variantId || `${baseTemplate.templateId}_${Date.now()}`,
    name: spec.name || `Variant of ${baseTemplate.templateId}`,
    template: variant,
    props: {
      template: variant,
    },
  };
}

/**
 * Generates copy test variants (same images, different text)
 */
export function generateCopyTestVariants(
  baseTemplate: TemplateDSL,
  config: CopyTestConfig
): GeneratedVariant[] {
  const variants: GeneratedVariant[] = [];
  
  for (let i = 0; i < config.headlines.length; i++) {
    const headline = config.headlines[i];
    const subheadline = config.subheadlines?.[i] || config.subheadlines?.[0];
    const cta = config.ctas?.[i] || config.ctas?.[0];
    
    const spec: VariantSpec = {
      templateId: baseTemplate.templateId,
      variantId: `${baseTemplate.templateId}_copy_${i + 1}`,
      name: `Copy Test ${i + 1}: ${headline.substring(0, 30)}...`,
      overrides: {
        text: {
          ...(headline && { headline }),
          ...(subheadline && { subheadline }),
          ...(cta && { cta }),
        },
      },
    };
    
    variants.push(generateVariant(baseTemplate, spec));
  }
  
  return variants;
}

/**
 * Generates image test variants (same copy, different images)
 */
export function generateImageTestVariants(
  baseTemplate: TemplateDSL,
  config: ImageTestConfig
): GeneratedVariant[] {
  const variants: GeneratedVariant[] = [];
  const maxImages = Math.max(
    config.heroes?.length || 0,
    config.backgrounds?.length || 0,
    config.logos?.length || 0,
    config.products?.length || 0
  );
  
  for (let i = 0; i < maxImages; i++) {
    const spec: VariantSpec = {
      templateId: baseTemplate.templateId,
      variantId: `${baseTemplate.templateId}_image_${i + 1}`,
      name: `Image Test ${i + 1}`,
      overrides: {
        assets: {
          ...(config.heroes?.[i] && { hero: config.heroes[i] }),
          ...(config.backgrounds?.[i] && { background: config.backgrounds[i] }),
          ...(config.logos?.[i] && { logo: config.logos[i] }),
          ...(config.products?.[i] && { product: config.products[i] }),
        },
      },
    };
    
    variants.push(generateVariant(baseTemplate, spec));
  }
  
  return variants;
}

/**
 * Generates a matrix of variants (combinations of copy and images)
 */
export function generateMatrixVariants(
  baseTemplate: TemplateDSL,
  config: MatrixTestConfig
): GeneratedVariant[] {
  const variants: GeneratedVariant[] = [];
  const maxVariants = config.maxVariants || 100;
  
  const headlines = config.copy?.headlines || [''];
  const heroes = config.images?.heroes || [''];
  
  let count = 0;
  for (const headline of headlines) {
    for (const hero of heroes) {
      if (count >= maxVariants) break;
      
      const spec: VariantSpec = {
        templateId: baseTemplate.templateId,
        variantId: `${baseTemplate.templateId}_matrix_${count + 1}`,
        name: `Matrix ${count + 1}`,
        overrides: {
          text: headline ? { headline } : undefined,
          assets: hero ? { hero } : undefined,
        },
      };
      
      variants.push(generateVariant(baseTemplate, spec));
      count++;
    }
    if (count >= maxVariants) break;
  }
  
  return variants;
}

/**
 * Creates a batch of variants for rendering
 */
export function createVariantBatch(
  baseTemplate: TemplateDSL,
  variants: GeneratedVariant[]
): VariantBatch {
  return {
    templateId: baseTemplate.templateId,
    variants,
  };
}

/**
 * Exports variants to JSON props files for Remotion CLI
 */
export function exportVariantsToProps(
  variants: GeneratedVariant[]
): Array<{ filename: string; props: object }> {
  return variants.map(v => ({
    filename: `${v.variantId}.json`,
    props: v.props,
  }));
}

// =============================================================================
// Rendering Helpers
// =============================================================================

/**
 * Generates render commands for a batch of variants
 */
export function generateRenderCommands(
  batch: VariantBatch,
  options: {
    compositionId?: string;
    outputDir?: string;
    format?: 'png' | 'jpeg' | 'webp';
  } = {}
): string[] {
  const {
    compositionId = 'AdTemplateStill',
    outputDir = 'out/variants',
    format = 'png',
  } = options;
  
  return batch.variants.map(v => {
    const propsJson = JSON.stringify(v.props);
    const outputPath = `${outputDir}/${v.variantId}.${format}`;
    return `npx remotion still ${compositionId} ${outputPath} --props='${propsJson}'`;
  });
}

/**
 * Creates a manifest for tracking rendered variants
 */
export function createVariantManifest(
  batch: VariantBatch,
  outputDir: string
): object {
  return {
    templateId: batch.templateId,
    generatedAt: new Date().toISOString(),
    outputDir,
    variants: batch.variants.map(v => ({
      variantId: v.variantId,
      name: v.name,
      bindings: v.template.bindings,
    })),
  };
}
