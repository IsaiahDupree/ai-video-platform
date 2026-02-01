/**
 * Template DSL Schema
 * 
 * Pixel-accurate ad template definition with Zod validation.
 * Supports text, image, and shape layers with bindings and constraints.
 */

import { z } from 'zod';

// =============================================================================
// Geometry & Positioning
// =============================================================================

export const RectSchema = z.object({
  x: z.number().describe('X position from left in pixels'),
  y: z.number().describe('Y position from top in pixels'),
  w: z.number().positive().describe('Width in pixels'),
  h: z.number().positive().describe('Height in pixels'),
});

export const CanvasSchema = z.object({
  width: z.number().positive().describe('Canvas width in pixels'),
  height: z.number().positive().describe('Canvas height in pixels'),
  bgColor: z.string().optional().describe('Background color (hex or CSS color)'),
});

// =============================================================================
// Text Layer
// =============================================================================

export const TextAlignSchema = z.enum(['left', 'center', 'right']);
export const TextValignSchema = z.enum(['top', 'middle', 'bottom']);

export const TextStyleSchema = z.object({
  fontFamily: z.string().default('Inter'),
  fontWeight: z.number().min(100).max(900).default(400),
  fontSize: z.number().positive().describe('Font size in pixels'),
  lineHeight: z.number().positive().default(1.2),
  letterSpacing: z.number().default(0).describe('Letter spacing in pixels'),
  color: z.string().default('#ffffff'),
  align: TextAlignSchema.default('left'),
  valign: TextValignSchema.default('top'),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  textShadow: z.string().optional(),
});

export const TextConstraintsSchema = z.object({
  mode: z.enum(['fixed', 'fitText', 'fitTextOnNLines', 'fillBox']).default('fixed'),
  maxLines: z.number().positive().optional().describe('Max lines for fitTextOnNLines mode'),
  minFontSize: z.number().positive().optional().describe('Minimum font size when shrinking'),
  maxFontSize: z.number().positive().optional().describe('Maximum font size when growing'),
  overflow: z.enum(['visible', 'hidden', 'ellipsis']).default('visible'),
});

export const TextLayerSchema = z.object({
  id: z.string(),
  type: z.literal('text'),
  z: z.number().default(0).describe('Z-index for layer ordering'),
  rect: RectSchema,
  text: TextStyleSchema,
  bind: z.object({
    textKey: z.string().describe('Key to bind text content from bindings.text'),
  }).optional(),
  constraints: TextConstraintsSchema.optional(),
  visible: z.boolean().default(true),
});

// =============================================================================
// Image Layer
// =============================================================================

export const ImageFitSchema = z.enum(['cover', 'contain', 'fill', 'none']);
export const ImageAnchorSchema = z.enum([
  'center', 'top', 'bottom', 'left', 'right',
  'top-left', 'top-right', 'bottom-left', 'bottom-right'
]);

export const ImageStyleSchema = z.object({
  fit: ImageFitSchema.default('cover'),
  anchor: ImageAnchorSchema.default('center'),
  borderRadius: z.number().default(0),
  opacity: z.number().min(0).max(1).default(1),
  filter: z.string().optional().describe('CSS filter string'),
});

export const ImageConstraintsSchema = z.object({
  lockAspect: z.boolean().default(true),
  minWidth: z.number().positive().optional(),
  maxWidth: z.number().positive().optional(),
  minHeight: z.number().positive().optional(),
  maxHeight: z.number().positive().optional(),
});

export const ImageLayerSchema = z.object({
  id: z.string(),
  type: z.literal('image'),
  z: z.number().default(0),
  rect: RectSchema,
  image: ImageStyleSchema.optional(),
  bind: z.object({
    assetKey: z.string().describe('Key to bind image URL from bindings.assets'),
  }).optional(),
  src: z.string().optional().describe('Static image URL if not using binding'),
  constraints: ImageConstraintsSchema.optional(),
  visible: z.boolean().default(true),
});

// =============================================================================
// Shape Layer
// =============================================================================

export const ShapeKindSchema = z.enum(['rect', 'circle', 'ellipse', 'line']);

export const ShapeStyleSchema = z.object({
  kind: ShapeKindSchema,
  fill: z.string().optional().describe('Fill color'),
  stroke: z.string().optional().describe('Stroke color'),
  strokeWidth: z.number().optional().default(0),
  radius: z.number().optional().default(0).describe('Border radius for rect'),
  opacity: z.number().min(0).max(1).optional().default(1),
  gradient: z.object({
    type: z.enum(['linear', 'radial']),
    angle: z.number().optional().describe('Angle for linear gradient in degrees'),
    stops: z.array(z.object({
      offset: z.number().min(0).max(1),
      color: z.string(),
    })),
  }).optional(),
  shadow: z.object({
    x: z.number(),
    y: z.number(),
    blur: z.number(),
    spread: z.number().optional(),
    color: z.string(),
  }).optional(),
});

export const ShapeLayerSchema = z.object({
  id: z.string(),
  type: z.literal('shape'),
  z: z.number().default(0),
  rect: RectSchema,
  shape: ShapeStyleSchema,
  visible: z.boolean().default(true),
});

// =============================================================================
// Union Layer Type
// =============================================================================

export const LayerSchema = z.discriminatedUnion('type', [
  TextLayerSchema,
  ImageLayerSchema,
  ShapeLayerSchema,
]);

// =============================================================================
// Bindings
// =============================================================================

export const BindingsSchema = z.object({
  text: z.record(z.string()).default({}).describe('Text content keyed by textKey'),
  assets: z.record(z.string()).default({}).describe('Asset URLs keyed by assetKey'),
});

// =============================================================================
// Metadata
// =============================================================================

export const SourceMetaSchema = z.object({
  type: z.enum(['reference_image', 'canva_design', 'figma_design', 'manual']),
  sha256: z.string().optional(),
  sourceUrl: z.string().optional(),
  designId: z.string().optional(),
});

export const ExtractionMetaSchema = z.object({
  confidence: z.number().min(0).max(1),
  extractedAt: z.string().optional(),
  model: z.string().optional(),
  warnings: z.array(z.string()).optional(),
});

export const TemplateMetaSchema = z.object({
  source: SourceMetaSchema.optional(),
  extraction: ExtractionMetaSchema.optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
});

// =============================================================================
// Main Template Schema
// =============================================================================

export const TemplateDSLSchema = z.object({
  templateId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  version: z.string().default('1.0.0'),
  canvas: CanvasSchema,
  layers: z.array(LayerSchema),
  bindings: BindingsSchema.default({ text: {}, assets: {} }),
  meta: TemplateMetaSchema.optional(),
});

// =============================================================================
// Variant Specification
// =============================================================================

export const VariantSpecSchema = z.object({
  templateId: z.string(),
  variantId: z.string().optional(),
  name: z.string().optional(),
  overrides: z.object({
    text: z.record(z.string()).optional(),
    assets: z.record(z.string()).optional(),
    layers: z.record(z.object({
      rect: RectSchema.partial().optional(),
      visible: z.boolean().optional(),
      text: TextStyleSchema.partial().optional(),
      image: ImageStyleSchema.partial().optional(),
      shape: ShapeStyleSchema.partial().optional(),
    })).optional(),
  }),
});

// =============================================================================
// TypeScript Types (inferred from schemas)
// =============================================================================

export type Rect = z.infer<typeof RectSchema>;
export type Canvas = z.infer<typeof CanvasSchema>;
export type TextStyle = z.infer<typeof TextStyleSchema>;
export type TextConstraints = z.infer<typeof TextConstraintsSchema>;
export type TextLayer = z.infer<typeof TextLayerSchema>;
export type ImageFit = z.infer<typeof ImageFitSchema>;
export type ImageAnchor = z.infer<typeof ImageAnchorSchema>;
export type ImageStyle = z.infer<typeof ImageStyleSchema>;
export type ImageConstraints = z.infer<typeof ImageConstraintsSchema>;
export type ImageLayer = z.infer<typeof ImageLayerSchema>;
export type ShapeKind = z.infer<typeof ShapeKindSchema>;
export type ShapeStyle = z.infer<typeof ShapeStyleSchema>;
export type ShapeLayer = z.infer<typeof ShapeLayerSchema>;
export type Layer = z.infer<typeof LayerSchema>;
export type Bindings = z.infer<typeof BindingsSchema>;
export type SourceMeta = z.infer<typeof SourceMetaSchema>;
export type ExtractionMeta = z.infer<typeof ExtractionMetaSchema>;
export type TemplateMeta = z.infer<typeof TemplateMetaSchema>;
export type TemplateDSL = z.infer<typeof TemplateDSLSchema>;
export type VariantSpec = z.infer<typeof VariantSpecSchema>;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Validates a template DSL object
 */
export function validateTemplate(template: unknown): TemplateDSL {
  return TemplateDSLSchema.parse(template);
}

/**
 * Safely validates a template, returning result object
 */
export function safeValidateTemplate(template: unknown): {
  success: boolean;
  data?: TemplateDSL;
  error?: z.ZodError;
} {
  const result = TemplateDSLSchema.safeParse(template);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Creates a new template with defaults
 */
export function createTemplate(
  id: string,
  canvas: Canvas,
  layers: Layer[] = [],
  bindings?: Partial<Bindings>
): TemplateDSL {
  return {
    templateId: id,
    version: '1.0.0',
    canvas,
    layers,
    bindings: {
      text: bindings?.text ?? {},
      assets: bindings?.assets ?? {},
    },
  };
}

/**
 * Applies variant overrides to a template
 */
export function applyVariant(template: TemplateDSL, variant: VariantSpec): TemplateDSL {
  const result = { ...template };
  
  // Apply text overrides
  if (variant.overrides.text) {
    result.bindings = {
      ...result.bindings,
      text: { ...result.bindings.text, ...variant.overrides.text },
    };
  }
  
  // Apply asset overrides
  if (variant.overrides.assets) {
    result.bindings = {
      ...result.bindings,
      assets: { ...result.bindings.assets, ...variant.overrides.assets },
    };
  }
  
  // Apply layer overrides
  if (variant.overrides.layers) {
    result.layers = result.layers.map(layer => {
      const override = variant.overrides.layers?.[layer.id];
      if (!override) return layer;
      
      return {
        ...layer,
        ...(override.rect && { rect: { ...layer.rect, ...override.rect } }),
        ...(override.visible !== undefined && { visible: override.visible }),
        ...(layer.type === 'text' && override.text && {
          text: { ...layer.text, ...override.text },
        }),
        ...(layer.type === 'image' && override.image && {
          image: { ...layer.image, ...override.image },
        }),
        ...(layer.type === 'shape' && override.shape && {
          shape: { ...layer.shape, ...override.shape },
        }),
      } as Layer;
    });
  }
  
  return result;
}

/**
 * Gets sorted layers by z-index
 */
export function getSortedLayers(template: TemplateDSL): Layer[] {
  return [...template.layers].sort((a, b) => a.z - b.z);
}

/**
 * Gets a layer by ID
 */
export function getLayerById(template: TemplateDSL, id: string): Layer | undefined {
  return template.layers.find(l => l.id === id);
}

/**
 * Resolves text content for a layer
 */
export function resolveTextContent(layer: TextLayer, bindings: Bindings): string {
  if (layer.bind?.textKey && bindings.text[layer.bind.textKey]) {
    return bindings.text[layer.bind.textKey];
  }
  return layer.bind?.textKey || '';
}

/**
 * Resolves image URL for a layer
 */
export function resolveImageSrc(layer: ImageLayer, bindings: Bindings): string | undefined {
  if (layer.src) return layer.src;
  if (layer.bind?.assetKey && bindings.assets[layer.bind.assetKey]) {
    return bindings.assets[layer.bind.assetKey];
  }
  return undefined;
}

// =============================================================================
// Common Ad Sizes (from PRD)
// =============================================================================

export const AD_CANVAS_PRESETS = {
  // Social Media
  instagram_square: { width: 1080, height: 1080 },
  instagram_story: { width: 1080, height: 1920 },
  facebook_post: { width: 1200, height: 630 },
  facebook_cover: { width: 820, height: 312 },
  twitter_post: { width: 1200, height: 675 },
  linkedin_post: { width: 1200, height: 627 },
  pinterest_pin: { width: 1000, height: 1500 },
  
  // Display Ads (IAB Standard)
  leaderboard: { width: 728, height: 90 },
  medium_rectangle: { width: 300, height: 250 },
  large_rectangle: { width: 336, height: 280 },
  wide_skyscraper: { width: 160, height: 600 },
  half_page: { width: 300, height: 600 },
  billboard: { width: 970, height: 250 },
  
  // Mobile
  mobile_banner: { width: 320, height: 50 },
  mobile_leaderboard: { width: 320, height: 100 },
  mobile_interstitial: { width: 320, height: 480 },
} as const;

export type AdCanvasPreset = keyof typeof AD_CANVAS_PRESETS;
