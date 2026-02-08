/**
 * Remotion Compose Stage
 *
 * Takes animated video + parametric ad variant data and renders
 * composed ads with text overlays, CTA, branding across all Meta ad sizes.
 *
 * Uses Remotion CLI to render compositions with --props.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import type { AdVariant, AdSize, BrandConfig, ComposedAd } from './types';

// =============================================================================
// Composition Mapping
// =============================================================================

// Maps template type → UGC composition prefix
const TEMPLATE_COMPOSITION_PREFIX: Record<string, string> = {
  before_after: 'UGC-BeforeAfter',
  testimonial: 'UGC-Testimonial',
  product_demo: 'UGC-ProductDemo',
  problem_solution: 'UGC-ProblemSolution',
  stat_counter: 'UGC-StatCounter',
  feature_list: 'UGC-FeatureList',
  urgency: 'UGC-Urgency',
};

// Maps ad size name → composition suffix
const SIZE_COMPOSITION_SUFFIX: Record<string, string> = {
  feed_square: 'Post',
  feed_portrait: 'Portrait',
  story: 'Story',
  reels: 'Story',
  fb_feed: 'Landscape',
  fb_square: 'Post',
};

function getCompositionId(template: string, sizeName: string, isStill: boolean): string {
  const prefix = TEMPLATE_COMPOSITION_PREFIX[template] || 'UGC-BeforeAfter';
  const suffix = SIZE_COMPOSITION_SUFFIX[sizeName] || 'Post';
  return isStill ? `${prefix}-${suffix}-Still` : `${prefix}-${suffix}`;
}

// =============================================================================
// Props Builder
// =============================================================================

// Each template type receives different props
type RenderProps = Record<string, unknown>;

function buildRenderProps(
  variant: AdVariant,
  videoPath: string,
  brand: BrandConfig,
  size: AdSize
): RenderProps {
  const { parameters } = variant;
  const isHorizontal = size.width > size.height;
  const template = parameters.visual.template;

  // Shared brand/layout props
  const shared: RenderProps = {
    brandName: brand.name,
    brandLogoSrc: brand.logoUrl || undefined,
    primaryColor: brand.primaryColor,
    accentColor: brand.accentColor,
    fontFamily: brand.fontFamily || 'Inter, system-ui, sans-serif',
    colorScheme: parameters.visual.colorScheme === 'light' ? 'light' : 'dark',
    headlineSize: isHorizontal ? 36 : undefined,
  };

  // Convert images to base64 data URIs for Remotion's browser rendering
  // (local file paths aren't accessible from the browser context)
  const toDataUri = (filePath: string): string | undefined => {
    const absPath = path.resolve(filePath);
    if (!fs.existsSync(absPath)) return undefined;
    const buf = fs.readFileSync(absPath);
    const mime = absPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${buf.toString('base64')}`;
  };
  const absBeforeImage = variant.assets.beforeImagePath
    ? toDataUri(variant.assets.beforeImagePath) : undefined;
  const absAfterImage = variant.assets.afterImagePath
    ? toDataUri(variant.assets.afterImagePath) : undefined;

  if (template === 'before_after') {
    return {
      ...shared,
      headline: parameters.copy.headline,
      subheadline: parameters.copy.subheadline,
      ctaText: parameters.copy.ctaText,
      beforeLabel: parameters.copy.beforeLabel,
      afterLabel: parameters.copy.afterLabel,
      badge: parameters.structure.hasBadge ? 'AD-FREE' : undefined,
      trustLine: parameters.structure.hasTrustLine ? 'Quality preserved • No popups' : undefined,
      labelStyle: parameters.structure.labelStyle,
      ctaPosition: parameters.structure.ctaPosition,
      beforeImageSrc: absBeforeImage,
      afterImageSrc: absAfterImage,
      beforeVideoSrc: videoPath ? path.resolve(videoPath) : undefined,
      afterVideoSrc: videoPath ? path.resolve(videoPath) : undefined,
    };
  }

  if (template === 'problem_solution') {
    return {
      ...shared,
      headline: parameters.copy.headline,
      problemText: parameters.copy.subheadline,
      solutionText: parameters.copy.ctaText ? `Try it now → ${parameters.copy.ctaText}` : 'Get clean results instantly.',
      ctaText: parameters.copy.ctaText,
      badge: parameters.structure.hasBadge ? 'SOLVED' : undefined,
      trustLine: parameters.structure.hasTrustLine ? 'No ads · No installs · Works instantly' : undefined,
      problemImageSrc: absBeforeImage,
      solutionImageSrc: absAfterImage,
    };
  }

  if (template === 'testimonial') {
    return {
      ...shared,
      headline: parameters.copy.headline,
      testimonialQuote: parameters.copy.subheadline,
      authorName: 'Happy User',
      authorTitle: 'Creator',
      ctaText: parameters.copy.ctaText,
      badge: parameters.structure.hasBadge ? '4.9★ RATED' : undefined,
      rating: 5,
    };
  }

  if (template === 'product_demo') {
    return {
      ...shared,
      headline: parameters.copy.headline,
      subheadline: parameters.copy.subheadline,
      ctaText: parameters.copy.ctaText,
      badge: parameters.structure.hasBadge ? 'SIMPLE' : undefined,
      steps: [
        { icon: '📤', title: 'Upload', description: 'Drop your file' },
        { icon: '✨', title: 'Process', description: 'AI does the work' },
        { icon: '📥', title: 'Download', description: 'Get clean output' },
      ],
      productImageSrc: absAfterImage,
    };
  }

  if (template === 'stat_counter') {
    return {
      ...shared,
      headline: parameters.copy.headline,
      subheadline: parameters.copy.subheadline,
      ctaText: parameters.copy.ctaText,
      badge: parameters.structure.hasBadge ? 'POPULAR' : undefined,
      trustLine: parameters.structure.hasTrustLine ? 'Free to start · No credit card required' : undefined,
      stats: [
        { value: '50K', label: 'Active Users', suffix: '+' },
        { value: '4.9', label: 'App Store Rating', suffix: '★' },
        { value: '2M', label: 'Files Processed', suffix: '+' },
      ],
      productImageSrc: absAfterImage,
    };
  }

  if (template === 'feature_list') {
    return {
      ...shared,
      headline: parameters.copy.headline,
      subheadline: parameters.copy.subheadline,
      ctaText: parameters.copy.ctaText,
      badge: parameters.structure.hasBadge ? 'COMPARE' : undefined,
      trustLine: parameters.structure.hasTrustLine ? 'Cancel anytime · Free plan available' : undefined,
      features: [
        { text: 'Instant processing', included: true, highlight: true },
        { text: 'No watermarks', included: true },
        { text: 'HD quality export', included: true },
        { text: 'Batch processing', included: true, highlight: true },
        { text: 'No sign-up required', included: true },
      ],
      productImageSrc: absAfterImage,
    };
  }

  if (template === 'urgency') {
    return {
      ...shared,
      headline: parameters.copy.headline,
      subheadline: parameters.copy.subheadline,
      ctaText: parameters.copy.ctaText,
      badge: parameters.structure.hasBadge ? 'LIMITED' : undefined,
      trustLine: parameters.structure.hasTrustLine ? '30-day money-back guarantee' : undefined,
      offerText: 'Annual Pro Plan',
      originalPrice: '$199',
      salePrice: '$79',
      discount: '60% OFF',
      spotsLeft: 23,
      countdownHours: 11,
      countdownMinutes: 47,
      productImageSrc: absAfterImage,
    };
  }

  // Fallback: before_after style
  return {
    ...shared,
    headline: parameters.copy.headline,
    subheadline: parameters.copy.subheadline,
    ctaText: parameters.copy.ctaText,
    beforeLabel: parameters.copy.beforeLabel,
    afterLabel: parameters.copy.afterLabel,
  };
}

// =============================================================================
// Render Functions
// =============================================================================

function renderWithRemotion(
  compositionId: string,
  props: RenderProps,
  outputPath: string,
  width: number,
  height: number,
  isStill: boolean = false
): void {
  const propsJson = JSON.stringify(props);
  const projectRoot = path.resolve(__dirname, '../..');

  // Write props to temp file to avoid shell escaping issues
  const propsFile = path.join(path.dirname(outputPath), `_props_${Date.now()}.json`);
  fs.writeFileSync(propsFile, propsJson);

  try {
    const command = isStill
      ? `npx remotion still "${compositionId}" "${outputPath}" --props="${propsFile}" --width=${width} --height=${height} --frame=70`
      : `npx remotion render "${compositionId}" "${outputPath}" --props="${propsFile}" --width=${width} --height=${height} --crf=18`;

    execSync(command, {
      cwd: projectRoot,
      stdio: 'pipe',
      timeout: 120000, // 2 minutes per render
    });
  } finally {
    // Cleanup temp props file
    if (fs.existsSync(propsFile)) {
      fs.unlinkSync(propsFile);
    }
  }
}

// =============================================================================
// Stage Entry Point
// =============================================================================

export async function runRemotionComposeStage(
  variant: AdVariant,
  videoPath: string,
  brand: BrandConfig,
  sizes: AdSize[],
  outputDir: string
): Promise<ComposedAd> {
  console.log(`\n🎨 Remotion Compose: ${variant.id}`);
  console.log(`   Template: ${variant.parameters.visual.template}`);
  console.log(`   Sizes: ${sizes.map(s => s.name).join(', ')}`);

  fs.mkdirSync(outputDir, { recursive: true });

  const startTime = Date.now();
  const outputPaths: Record<string, string> = {};
  let successCount = 0;

  for (const size of sizes) {
    // Render as a still frame from the animated composition at frame 70
    // (after all entrance animations have completed). Using the regular
    // Composition rather than Still so we can pick any frame.
    // The Veo video is a separate deliverable.
    const isStill = true;
    const ext = 'png';

    const compositionId = getCompositionId(
      variant.parameters.visual.template,
      size.name,
      false // use the animated Composition, not the Still variant
    );

    const outputPath = path.join(outputDir, `${variant.id}_${size.name}.${ext}`);

    console.log(`   📐 Rendering ${size.name} (${size.width}×${size.height}) → ${compositionId}`);

    try {
      // Don't pass video sources to the composition — use images only
      const props = buildRenderProps(variant, '', brand, size);

      renderWithRemotion(compositionId, props, outputPath, size.width, size.height, isStill);

      outputPaths[size.name] = outputPath;
      successCount++;
      console.log(`   ✅ ${size.name} rendered`);
    } catch (error: any) {
      console.log(`   ❌ ${size.name} failed: ${error.message.substring(0, 100)}`);
    }
  }

  const renderTimeMs = Date.now() - startTime;

  console.log(`   📊 Composed ${successCount}/${sizes.length} sizes in ${(renderTimeMs / 1000).toFixed(1)}s`);

  return {
    variantId: variant.id,
    parameters: variant.parameters,
    outputPaths,
    utmParams: variant.utmParams,
    metadata: {
      renderTimeMs,
      sizes: Object.keys(outputPaths),
    },
  };
}

/**
 * Batch compose multiple variants
 */
export async function runRemotionComposeBatch(
  variants: AdVariant[],
  videoPath: string,
  brand: BrandConfig,
  sizes: AdSize[],
  outputDir: string
): Promise<ComposedAd[]> {
  console.log(`\n🎨 Remotion Compose Batch: ${variants.length} variants × ${sizes.length} sizes`);

  const results: ComposedAd[] = [];

  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    console.log(`\n   [${i + 1}/${variants.length}] Composing variant: ${variant.id}`);

    try {
      const variantDir = path.join(outputDir, variant.id);
      const result = await runRemotionComposeStage(
        variant,
        videoPath,
        brand,
        sizes,
        variantDir
      );
      results.push(result);
    } catch (error: any) {
      console.log(`   ❌ Failed variant ${variant.id}: ${error.message}`);
    }
  }

  return results;
}
