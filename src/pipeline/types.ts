/**
 * UGC Ad Pipeline - Shared Types
 *
 * Core types for the Nano Banana → Veo 3 → Remotion pipeline
 * and the parametric optimization system.
 */

import { z } from 'zod';

// =============================================================================
// Ad Parameter Schemas (Parametric System)
// =============================================================================

export const HookTypeSchema = z.enum([
  'question',
  'statement',
  'shock',
  'curiosity',
  'social_proof',
  'urgency',
]);

export const CopyToneSchema = z.enum([
  'casual',
  'professional',
  'excited',
  'empathetic',
  'authoritative',
]);

export const CtaTypeSchema = z.enum([
  'action',
  'benefit',
  'urgency',
  'curiosity',
]);

export const AwarenessLevelSchema = z.enum([
  'unaware',
  'problem_aware',
  'solution_aware',
  'product_aware',
  'most_aware',
]);

export const TemplateTypeSchema = z.enum([
  'before_after',
  'testimonial',
  'product_demo',
  'problem_solution',
  'stat_counter',
  'feature_list',
  'urgency',
]);

export const CharacterStyleSchema = z.enum([
  'realistic',
  'cartoon',
  'lifestyle',
  'minimal',
]);

export const TransitionStyleSchema = z.enum([
  'cut',
  'morph',
  'swipe',
  'zoom',
]);

export const ColorSchemeSchema = z.enum([
  'dark',
  'light',
  'brand',
  'neon',
]);

export const LabelStyleSchema = z.enum([
  'pill',
  'bar',
  'corner',
  'inline',
]);

// =============================================================================
// Full Ad Parameters Schema
// =============================================================================

export const AdParametersSchema = z.object({
  visual: z.object({
    template: TemplateTypeSchema,
    characterStyle: CharacterStyleSchema,
    transitionStyle: TransitionStyleSchema,
    colorScheme: ColorSchemeSchema,
    videoDuration: z.union([z.literal(8), z.literal(16)]),
    aspectRatio: z.enum(['9:16', '16:9', '1:1', '4:5']),
  }),
  copy: z.object({
    hookType: HookTypeSchema,
    headline: z.string(),
    headlineLength: z.enum(['short', 'medium', 'long']),
    subheadline: z.string(),
    ctaType: CtaTypeSchema,
    ctaText: z.string(),
    toneOfVoice: CopyToneSchema,
    beforeLabel: z.string(),
    afterLabel: z.string(),
  }),
  targeting: z.object({
    awarenessLevel: AwarenessLevelSchema,
    beliefCluster: z.string(),
    painPoint: z.string(),
    desiredOutcome: z.string(),
  }),
  structure: z.object({
    hasBeforeAfter: z.boolean(),
    hasTrustLine: z.boolean(),
    hasBadge: z.boolean(),
    hasFooter: z.boolean(),
    ctaPosition: z.enum(['bottom', 'middle', 'overlay']),
    labelStyle: LabelStyleSchema,
  }),
});

export type AdParameters = z.infer<typeof AdParametersSchema>;
export type HookType = z.infer<typeof HookTypeSchema>;
export type CtaType = z.infer<typeof CtaTypeSchema>;
export type AwarenessLevel = z.infer<typeof AwarenessLevelSchema>;
export type TemplateType = z.infer<typeof TemplateTypeSchema>;
export type CharacterStyle = z.infer<typeof CharacterStyleSchema>;
export type TransitionStyle = z.infer<typeof TransitionStyleSchema>;

// =============================================================================
// Ad Size
// =============================================================================

export interface AdSize {
  name: string;
  width: number;
  height: number;
  platform: string;
}

export const META_AD_SIZES: AdSize[] = [
  { name: 'feed_square',    width: 1080, height: 1080, platform: 'instagram' },
  { name: 'feed_portrait',  width: 1080, height: 1350, platform: 'instagram' },
  { name: 'story',          width: 1080, height: 1920, platform: 'instagram' },
  { name: 'reels',          width: 1080, height: 1920, platform: 'instagram' },
  { name: 'fb_feed',        width: 1200, height: 628,  platform: 'facebook'  },
  { name: 'fb_square',      width: 1080, height: 1080, platform: 'facebook'  },
];

// =============================================================================
// Pipeline Stage Types
// =============================================================================

export interface ProductInput {
  name: string;
  description: string;
  imageUrl?: string;
  imagePath?: string;
  websiteUrl?: string;
}

export interface BrandConfig {
  name: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
}

export interface SceneConfig {
  beforePrompt: string;
  afterPrompt: string;
  characterStyle: CharacterStyle;
  characterGender?: 'male' | 'female' | 'neutral';
}

// Nano Banana Stage
export interface NanoBananaInput {
  product: ProductInput;
  scene: SceneConfig;
  imageCount: number;
  outputDir: string;
}

export interface ImagePair {
  id: string;
  beforeImagePath: string;
  afterImagePath: string;
  characterProfileId: string;
  metadata: {
    style: string;
    beforePrompt: string;
    afterPrompt: string;
    confidence: number;
  };
}

export interface NanoBananaOutput {
  pairs: ImagePair[];
  characterProfile: {
    name: string;
    description: string;
    style: string;
    traits: string[];
  };
  outputDir: string;
}

// Veo 3 Stage
export interface VeoAnimateInput {
  pair: ImagePair;
  motionPrompt: string;
  duration: 8 | 16;
  aspectRatio: '9:16' | '16:9' | '1:1';
  outputDir: string;
}

export interface VeoAnimateOutput {
  videoPath: string;
  videoUrl?: string;
  duration: number;
  aspectRatio: string;
  jobId: string;
  pairId: string;
}

// Remotion Compose Stage
export interface RemotionComposeInput {
  videoPath: string;
  parameters: AdParameters;
  brand: BrandConfig;
  sizes: AdSize[];
  outputDir: string;
}

export interface ComposedAd {
  variantId: string;
  parameters: AdParameters;
  outputPaths: Record<string, string>; // sizeName → filePath
  utmParams: Record<string, string>;
  metadata: {
    renderTimeMs: number;
    sizes: string[];
  };
}

// =============================================================================
// Variant & Batch
// =============================================================================

export interface AdVariant {
  id: string;
  batchId: string;
  variantIndex: number;
  parameters: AdParameters;
  assets: {
    beforeImagePath?: string;
    afterImagePath?: string;
    videoPath?: string;
    composedPaths: Record<string, string>;
    thumbnailPath?: string;
  };
  utmParams: Record<string, string>;
  metaAdId?: string;
  performance?: MetaAdPerformance;
  status: 'pending' | 'generating' | 'rendered' | 'uploaded' | 'active' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface AdBatch {
  id: string;
  productId: string;
  campaignId: string;
  variants: AdVariant[];
  totalVariants: number;
  performance?: BatchPerformance;
  parameterScores?: Record<string, ParameterScore[]>;
  parentBatchId?: string;
  childBatchId?: string;
  status: 'generating' | 'rendered' | 'active' | 'analyzed' | 'completed';
  createdAt: string;
}

// =============================================================================
// Meta Performance Data
// =============================================================================

export interface MetaAdPerformance {
  adId: string;
  adName: string;
  utmContent: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  spend: number;
  conversions: number;
  conversionRate: number;
  roas: number;
  costPerConversion: number;
  videoViews: number;
  videoViewRate: number;
  avgWatchTime: number;
  thruplayRate: number;
  dateRange: { start: string; end: string };
  placement: string;
  platform: string;
}

export interface BatchPerformance {
  totalSpend: number;
  totalConversions: number;
  overallRoas: number;
  overallCtr: number;
  dateRange: { start: string; end: string };
}

export interface ParameterScore {
  parameter: string;
  value: string;
  metrics: {
    avgCtr: number;
    avgRoas: number;
    avgCpc: number;
    avgConversionRate: number;
    avgVideoViewRate: number;
    sampleSize: number;
    confidence: number;
  };
  compositeScore: number;
  rank: number;
}

// =============================================================================
// Pipeline Config
// =============================================================================

export interface UGCPipelineConfig {
  product: ProductInput;
  brand: BrandConfig;
  scenes: SceneConfig;
  matrix: VariantMatrix;
  copyBank: CopyBank;
  outputDir: string;
  webhookUrl?: string;
  dryRun?: boolean;
}

export interface VariantMatrix {
  templates: TemplateType[];
  hookTypes: HookType[];
  awarenessLevels: AwarenessLevel[];
  ctaTypes: CtaType[];
  sizes: AdSize[];
  strategy: 'full_cross' | 'latin_square' | 'random_sample';
  maxVariants: number;
}

export interface CopyBank {
  headlines: Record<string, string[]>;   // hookType → headlines
  subheadlines: Record<string, string[]>;
  ctas: Record<string, string[]>;        // ctaType → cta texts
  beforeLabels: string[];
  afterLabels: string[];
  trustLines: string[];
  badges: string[];
}

// =============================================================================
// Optimization
// =============================================================================

export interface OptimizationConfig {
  goal: 'ctr' | 'roas' | 'conversions' | 'video_views';
  weights: {
    ctr: number;
    roas: number;
    conversionRate: number;
    videoViewRate: number;
  };
}

export interface BatchStrategy {
  exploitation: { percentage: number };
  exploration: { percentage: number };
  mutation: { percentage: number };
}

export const DEFAULT_BATCH_STRATEGY: BatchStrategy = {
  exploitation: { percentage: 0.70 },
  exploration: { percentage: 0.20 },
  mutation: { percentage: 0.10 },
};

export const DEFAULT_OPTIMIZATION_WEIGHTS: OptimizationConfig['weights'] = {
  ctr: 0.25,
  roas: 0.35,
  conversionRate: 0.25,
  videoViewRate: 0.15,
};
