/**
 * Canva to TemplateDSL Converter
 *
 * Converts Canva design structure to our internal TemplateDSL format
 */

import type {
  CanvaElement,
  CanvaImageElement,
  CanvaPage,
  CanvaShapeElement,
  CanvaTextElement,
} from './canva-types';
import type { TemplateDSL, Layer, TextLayer, ImageLayer, ShapeLayer } from '../schema/template-dsl';

/**
 * Configuration for semantic layer detection
 */
export interface SemanticDetectionConfig {
  /** Confidence threshold for auto-approval (0-1) */
  confidenceThreshold?: number;
  /** Whether to infer semantic roles (headline, cta, etc.) */
  inferRoles?: boolean;
  /** Whether to infer constraints (fitText, maxLines, etc.) */
  inferConstraints?: boolean;
}

/**
 * Convert Canva page to TemplateDSL
 *
 * This is "Pass 1" from the PRD: literal reconstruction
 * - What is on the image and where is it?
 */
export function canvaPageToTemplate(
  page: CanvaPage,
  options: SemanticDetectionConfig = {}
): TemplateDSL {
  const { confidenceThreshold = 0.8, inferRoles = true, inferConstraints = true } = options;

  // Sort elements by z-index (assume order = z-index for now)
  const sortedElements = [...page.elements].sort((a, b) => {
    // Elements later in the array are on top
    return page.elements.indexOf(a) - page.elements.indexOf(b);
  });

  // Convert elements to layers
  const layers: Layer[] = sortedElements
    .map((element, index) => convertElementToLayer(element, index, { inferRoles, inferConstraints }))
    .filter((layer): layer is Layer => layer !== null);

  // Build template
  const template: TemplateDSL = {
    templateId: `canva_${page.id}_${Date.now()}`,
    canvas: {
      width: page.width,
      height: page.height,
      bgColor: page.background?.color || '#ffffff',
    },
    layers,
    bindings: {
      text: extractTextBindings(layers),
      assets: extractAssetBindings(layers),
    },
    meta: {
      source: {
        type: 'canva_design',
        canvaPageId: page.id,
        extractedAt: new Date().toISOString(),
      },
      extraction: {
        confidence: 0.95, // High confidence for Canva-based extraction
        method: 'canva_design_api',
      },
    },
  };

  return template;
}

/**
 * Convert Canva element to TemplateDSL layer
 */
function convertElementToLayer(
  element: CanvaElement,
  zIndex: number,
  options: { inferRoles?: boolean; inferConstraints?: boolean }
): Layer | null {
  const baseRect = {
    x: element.left,
    y: element.top,
    w: element.width,
    h: element.height,
  };

  switch (element.type) {
    case 'TEXT':
      return convertTextElement(element as CanvaTextElement, zIndex, baseRect, options);

    case 'IMAGE':
      return convertImageElement(element as CanvaImageElement, zIndex, baseRect, options);

    case 'SHAPE':
      return convertShapeElement(element as CanvaShapeElement, zIndex, baseRect);

    case 'GROUP':
      // TODO: Handle grouped elements
      console.warn(`[canva-to-template] Grouped elements not yet supported, skipping element ${element.id}`);
      return null;

    default:
      console.warn(`[canva-to-template] Unknown element type ${element.type}, skipping element ${element.id}`);
      return null;
  }
}

/**
 * Convert Canva text element to TextLayer
 */
function convertTextElement(
  element: CanvaTextElement,
  zIndex: number,
  rect: { x: number; y: number; w: number; h: number },
  options: { inferRoles?: boolean; inferConstraints?: boolean }
): TextLayer {
  const { inferRoles = true, inferConstraints = true } = options;

  // Infer semantic role based on text content and position
  const role = inferRoles ? inferTextRole(element) : undefined;

  // Infer constraints based on text properties
  const constraints = inferConstraints ? inferTextConstraints(element, rect) : undefined;

  const layer: TextLayer = {
    id: element.id,
    type: 'text',
    z: zIndex,
    rect,
    text: {
      fontFamily: element.fontFamily || 'Inter',
      fontWeight: normalizeFontWeight(element.fontWeight),
      fontSize: element.fontSize || 16,
      lineHeight: element.lineHeight || 1.2,
      letterSpacing: element.letterSpacing || 0,
      color: element.color || '#000000',
      align: convertTextAlign(element.textAlign),
      valign: convertVerticalAlign(element.verticalAlign),
    },
    bind: role ? { textKey: role } : undefined,
    constraints,
  };

  return layer;
}

/**
 * Convert Canva image element to ImageLayer
 */
function convertImageElement(
  element: CanvaImageElement,
  zIndex: number,
  rect: { x: number; y: number; w: number; h: number },
  options: { inferRoles?: boolean }
): ImageLayer {
  const { inferRoles = true } = options;

  // Infer semantic role based on position and size
  const role = inferRoles ? inferImageRole(element, rect) : undefined;

  const layer: ImageLayer = {
    id: element.id,
    type: 'image',
    z: zIndex,
    rect,
    image: {
      fit: 'cover',
      anchor: 'center',
    },
    bind: role ? { assetKey: role } : undefined,
    constraints: {
      lockAspect: true,
    },
  };

  return layer;
}

/**
 * Convert Canva shape element to ShapeLayer
 */
function convertShapeElement(
  element: CanvaShapeElement,
  zIndex: number,
  rect: { x: number; y: number; w: number; h: number }
): ShapeLayer {
  const layer: ShapeLayer = {
    id: element.id,
    type: 'shape',
    z: zIndex,
    rect,
    shape: {
      kind: 'rect',
      fill: element.fill?.color || '#cccccc',
      radius: element.cornerRadius || 0,
    },
  };

  return layer;
}

/**
 * Infer semantic role for text element (Pass 2: semantic templating)
 */
function inferTextRole(element: CanvaTextElement): string | undefined {
  const text = element.text.toLowerCase();
  const fontSize = element.fontSize || 16;

  // Large text at top = headline
  if (fontSize >= 40 && element.top < 300) {
    return 'headline';
  }

  // Medium text below headline = subheadline
  if (fontSize >= 20 && fontSize < 40 && element.top >= 300 && element.top < 600) {
    return 'subheadline';
  }

  // Button-like text = CTA
  if (
    text.includes('buy') ||
    text.includes('shop') ||
    text.includes('learn') ||
    text.includes('get') ||
    text.includes('try') ||
    text.includes('start')
  ) {
    return 'cta';
  }

  // Small text at bottom = footer
  if (fontSize < 16 && element.top > 900) {
    return 'footer';
  }

  return `text_${element.id}`;
}

/**
 * Infer semantic role for image element
 */
function inferImageRole(
  element: CanvaImageElement,
  rect: { x: number; y: number; w: number; h: number }
): string | undefined {
  const area = rect.w * rect.h;

  // Large image = hero
  if (area > 300000) {
    return 'hero';
  }

  // Small image in top-left corner = logo
  if (rect.w < 200 && rect.h < 200 && rect.x < 200 && rect.y < 200) {
    return 'logo';
  }

  // Medium image = product
  if (area > 100000 && area < 300000) {
    return 'product';
  }

  return `image_${element.id}`;
}

/**
 * Infer text constraints
 */
function inferTextConstraints(
  element: CanvaTextElement,
  rect: { x: number; y: number; w: number; h: number }
): TextLayer['constraints'] | undefined {
  const fontSize = element.fontSize || 16;
  const estimatedLines = Math.floor(rect.h / (fontSize * (element.lineHeight || 1.2)));

  // Headline-like text should fit on limited lines
  if (fontSize >= 40) {
    return {
      mode: 'fitTextOnNLines',
      maxLines: Math.max(2, Math.min(3, estimatedLines)),
      minFontSize: Math.floor(fontSize * 0.6),
    };
  }

  // CTA text should fit in one line
  if (fontSize >= 24 && fontSize < 40) {
    return {
      mode: 'fitText',
      minFontSize: Math.floor(fontSize * 0.7),
    };
  }

  return undefined;
}

/**
 * Normalize font weight to number
 */
function normalizeFontWeight(weight?: 'normal' | 'bold' | 'lighter' | 'bolder' | number): number {
  if (typeof weight === 'number') {
    return weight;
  }

  switch (weight) {
    case 'bold':
    case 'bolder':
      return 700;
    case 'lighter':
      return 300;
    case 'normal':
    default:
      return 400;
  }
}

/**
 * Convert Canva text align to TemplateDSL align
 */
function convertTextAlign(align?: 'start' | 'center' | 'end'): 'left' | 'center' | 'right' {
  switch (align) {
    case 'start':
      return 'left';
    case 'center':
      return 'center';
    case 'end':
      return 'right';
    default:
      return 'left';
  }
}

/**
 * Convert Canva vertical align to TemplateDSL valign
 */
function convertVerticalAlign(valign?: 'top' | 'center' | 'bottom'): 'top' | 'middle' | 'bottom' {
  switch (valign) {
    case 'top':
      return 'top';
    case 'center':
      return 'middle';
    case 'bottom':
      return 'bottom';
    default:
      return 'top';
  }
}

/**
 * Extract text bindings from layers
 */
function extractTextBindings(layers: Layer[]): Record<string, string> {
  const bindings: Record<string, string> = {};

  for (const layer of layers) {
    if (layer.type === 'text' && layer.bind?.textKey) {
      bindings[layer.bind.textKey] = (layer as TextLayer).text?.color || 'default text';
    }
  }

  return bindings;
}

/**
 * Extract asset bindings from layers
 */
function extractAssetBindings(layers: Layer[]): Record<string, string> {
  const bindings: Record<string, string> = {};

  for (const layer of layers) {
    if (layer.type === 'image' && layer.bind?.assetKey) {
      bindings[layer.bind.assetKey] = 'https://via.placeholder.com/400';
    }
  }

  return bindings;
}
