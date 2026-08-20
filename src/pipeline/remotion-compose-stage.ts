/**
 * Remotion Compose Stage
 *
 * Takes animated video + parametric ad variant data and renders
 * composed ads with text overlays, CTA, branding across all Meta ad sizes.
 *
 * Local browser-backed rendering is disabled. Callers must use approved cloud
 * composition endpoints instead.
 */

import * as fs from 'fs';
import * as path from 'path';
import { blockLocalBrowserRender } from '../api/cloud-render';
import type { AdVariant, AdSize, BrandConfig, ComposedAd } from './types';
import type { TemplateSpecificCopy } from './copy-generation-stage';

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

// Maps ad size name → video ad composition ID
const SIZE_VIDEO_COMPOSITION: Record<string, string> = {
  feed_square: 'UGC-VideoAd-Post',
  feed_portrait: 'UGC-VideoAd-Portrait',
  story: 'UGC-VideoAd-Story',
  reels: 'UGC-VideoAd-Story',
  fb_feed: 'UGC-VideoAd-Landscape',
  fb_square: 'UGC-VideoAd-Post',
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
  size: AdSize,
  templateCopy?: TemplateSpecificCopy
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
    const t = templateCopy?.testimonials?.[variant.variantIndex % (templateCopy?.testimonials?.length || 1)];
    return {
      ...shared,
      headline: parameters.copy.headline,
      testimonialQuote: t?.quote || parameters.copy.subheadline,
      authorName: t?.authorName || 'Happy User',
      authorTitle: t?.authorTitle || 'Creator',
      ctaText: parameters.copy.ctaText,
      badge: parameters.structure.hasBadge ? '4.9★ RATED' : undefined,
      rating: t?.rating || 5,
    };
  }

  if (template === 'product_demo') {
    return {
      ...shared,
      headline: parameters.copy.headline,
      subheadline: parameters.copy.subheadline,
      ctaText: parameters.copy.ctaText,
      badge: parameters.structure.hasBadge ? 'SIMPLE' : undefined,
      steps: templateCopy?.productSteps || [
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
      stats: templateCopy?.stats || [
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
      features: templateCopy?.features || [
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
    const offer = templateCopy?.urgencyOffer;
    return {
      ...shared,
      headline: parameters.copy.headline,
      subheadline: parameters.copy.subheadline,
      ctaText: parameters.copy.ctaText,
      badge: parameters.structure.hasBadge ? 'LIMITED' : undefined,
      trustLine: parameters.structure.hasTrustLine ? '30-day money-back guarantee' : undefined,
      offerText: offer?.offerText || 'Annual Pro Plan',
      originalPrice: offer?.originalPrice || '$199',
      salePrice: offer?.salePrice || '$79',
      discount: offer?.discount || '60% OFF',
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
  void compositionId;
  void props;
  void outputPath;
  void width;
  void height;
  void isStill;
  return blockLocalBrowserRender(
    'UGC Remotion compose',
    'Provision matching cloud still/video composition endpoints before retrying; no local browser fallback is permitted.'
  );
}

// =============================================================================
// Stage Entry Point
// =============================================================================

export interface ComposeOptions {
  renderVideo?: boolean;  // Also render MP4 video ads (default: false)
  videoSizes?: string[];  // Which sizes to render as video (default: all)
  templateCopy?: TemplateSpecificCopy; // AI-generated template-specific content
}

export async function runRemotionComposeStage(
  variant: AdVariant,
  videoPath: string,
  brand: BrandConfig,
  sizes: AdSize[],
  outputDir: string,
  options: ComposeOptions = {}
): Promise<ComposedAd> {
  console.log(`\n🎨 Remotion Compose: ${variant.id}`);
  console.log(`   Template: ${variant.parameters.visual.template}`);
  console.log(`   Sizes: ${sizes.map(s => s.name).join(', ')}`);
  if (options.renderVideo) {
    console.log(`   🎬 Video ads: enabled`);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const startTime = Date.now();
  const outputPaths: Record<string, string> = {};
  const videoPaths: Record<string, string> = {};
  let successCount = 0;
  let videoSuccessCount = 0;

  for (const size of sizes) {
    // ── Still render (PNG at frame 70) ──
    const compositionId = getCompositionId(
      variant.parameters.visual.template,
      size.name,
      false // use the animated Composition, not the Still variant
    );

    const outputPath = path.join(outputDir, `${variant.id}_${size.name}.png`);

    console.log(`   📐 Rendering ${size.name} (${size.width}×${size.height}) → ${compositionId}`);

    try {
      const props = buildRenderProps(variant, '', brand, size, options.templateCopy);
      renderWithRemotion(compositionId, props, outputPath, size.width, size.height, true);
      outputPaths[size.name] = outputPath;
      successCount++;
      console.log(`   ✅ ${size.name} still rendered`);
    } catch (error: any) {
      console.log(`   ❌ ${size.name} still failed: ${error.message.substring(0, 100)}`);
    }

    // ── Video render (MP4, 8s with intro/outro) ──
    if (options.renderVideo) {
      const videoSizes = options.videoSizes || sizes.map(s => s.name);
      if (videoSizes.includes(size.name)) {
        const videoCompId = SIZE_VIDEO_COMPOSITION[size.name];
        if (videoCompId) {
          const videoOutputPath = path.join(outputDir, `${variant.id}_${size.name}_video.mp4`);
          console.log(`   🎬 Rendering video ${size.name} → ${videoCompId}`);

          try {
            const templateProps = buildRenderProps(variant, '', brand, size, options.templateCopy);
            const videoProps: Record<string, unknown> = {
              template: variant.parameters.visual.template,
              templateProps,
              brandName: brand.name,
              brandLogoSrc: brand.logoUrl || undefined,
              primaryColor: brand.primaryColor,
              accentColor: brand.accentColor,
              fontFamily: brand.fontFamily || 'Inter, system-ui, sans-serif',
              colorScheme: variant.parameters.visual.colorScheme === 'light' ? 'light' : 'dark',
              outroHeadline: variant.parameters.copy.ctaText || 'Try It Free',
              outroCtaText: 'Get Started →',
              outroSubtext: variant.parameters.copy.subheadline || 'Link in bio',
              enableSfx: true,
              showIntro: true,
              showOutro: true,
            };

            renderWithRemotion(videoCompId, videoProps, videoOutputPath, size.width, size.height, false);
            videoPaths[size.name] = videoOutputPath;
            videoSuccessCount++;
            console.log(`   ✅ ${size.name} video rendered`);
          } catch (error: any) {
            console.log(`   ❌ ${size.name} video failed: ${error.message.substring(0, 100)}`);
          }
        }
      }
    }
  }

  const renderTimeMs = Date.now() - startTime;
  const totalOutputs = successCount + videoSuccessCount;
  const totalExpected = sizes.length + (options.renderVideo ? sizes.length : 0);

  console.log(`   📊 Composed ${totalOutputs}/${totalExpected} outputs in ${(renderTimeMs / 1000).toFixed(1)}s`);
  if (videoSuccessCount > 0) {
    console.log(`      Stills: ${successCount}, Videos: ${videoSuccessCount}`);
  }

  return {
    variantId: variant.id,
    parameters: variant.parameters,
    outputPaths,
    videoPaths: Object.keys(videoPaths).length > 0 ? videoPaths : undefined,
    utmParams: variant.utmParams,
    metadata: {
      renderTimeMs,
      sizes: Object.keys(outputPaths),
      videoSizes: Object.keys(videoPaths).length > 0 ? Object.keys(videoPaths) : undefined,
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
  outputDir: string,
  options: ComposeOptions = {}
): Promise<ComposedAd[]> {
  blockLocalBrowserRender(
    'UGC Remotion compose batch',
    'Provision matching cloud still/video composition endpoints before retrying; no local browser fallback is permitted.'
  );

  const mode = options.renderVideo ? 'stills + video' : 'stills only';
  console.log(`\n🎨 Remotion Compose Batch: ${variants.length} variants × ${sizes.length} sizes (${mode})`);

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
        variantDir,
        options
      );
      results.push(result);
    } catch (error: any) {
      console.log(`   ❌ Failed variant ${variant.id}: ${error.message}`);
    }
  }

  return results;
}
