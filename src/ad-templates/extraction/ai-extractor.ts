/**
 * AI Layout Extractor
 * 
 * Extracts pixel-accurate template layouts from static ad images using AI vision models.
 * Supports GPT-4V, Claude Vision, and other multimodal models.
 */

import type { TemplateDSL, Layer, TextLayer, ImageLayer, ShapeLayer, Canvas } from '../schema/template-dsl';
import { validateTemplate } from '../schema/template-dsl';

// =============================================================================
// Types
// =============================================================================

export interface ExtractionRequest {
  imageUrl?: string;
  imageBase64?: string;
  imagePath?: string;
  canvasSize?: { width: number; height: number };
  model?: 'gpt-4-vision' | 'claude-3-opus' | 'claude-3-sonnet' | 'gemini-pro-vision';
  apiKey?: string;
  options?: ExtractionOptions;
}

export interface ExtractionOptions {
  detectText?: boolean;
  detectImages?: boolean;
  detectShapes?: boolean;
  semanticLabeling?: boolean;
  inferConstraints?: boolean;
  minConfidence?: number;
}

export interface ExtractedElement {
  type: 'text' | 'image' | 'shape';
  boundingBox: { x: number; y: number; w: number; h: number };
  confidence: number;
  semanticRole?: string;
  content?: string;
  style?: Record<string, unknown>;
  zIndex?: number;
}

export interface ExtractionResult {
  success: boolean;
  template?: TemplateDSL;
  elements?: ExtractedElement[];
  canvas?: Canvas;
  confidence: number;
  warnings?: string[];
  error?: string;
  rawResponse?: unknown;
}

// =============================================================================
// Extraction Prompts
// =============================================================================

const EXTRACTION_SYSTEM_PROMPT = `You are an expert at analyzing static ad images and extracting pixel-accurate layout information.

Your task is to analyze the provided ad image and extract a complete template specification that can be used to recreate the same layout with different content.

For each visual element in the ad, identify:
1. Element type: text, image, or shape
2. Bounding box: x, y, width, height in pixels (relative to canvas)
3. Semantic role: headline, subhead, cta, logo, hero, background, accent, etc.
4. Style properties based on element type
5. Z-order (layer depth, 0 = back, higher = front)
6. Confidence score (0-1) for your detection

For TEXT elements, also extract:
- Estimated font family (Inter, Roboto, etc. or generic like sans-serif)
- Font weight (400, 700, 800, etc.)
- Font size in pixels
- Text color (hex code)
- Text alignment (left, center, right)
- Vertical alignment (top, middle, bottom)
- The actual text content

For IMAGE elements, identify:
- Whether it's a photo, illustration, logo, or icon
- The fit mode (cover, contain, fill)
- Any visible border radius

For SHAPE elements, identify:
- Shape type (rect, circle, ellipse)
- Fill color (hex)
- Border radius for rectangles
- Any gradient (direction and colors)

Output your analysis as valid JSON matching this schema:
{
  "canvas": { "width": number, "height": number, "bgColor": string },
  "elements": [
    {
      "type": "text" | "image" | "shape",
      "boundingBox": { "x": number, "y": number, "w": number, "h": number },
      "confidence": number,
      "semanticRole": string,
      "content": string (for text),
      "style": { ... style properties ... },
      "zIndex": number
    }
  ],
  "overallConfidence": number,
  "warnings": string[]
}

Be precise with pixel measurements. If the canvas size is provided, use it. Otherwise, estimate based on common ad sizes.`;

const EXTRACTION_USER_PROMPT = (options: ExtractionOptions) => `
Analyze this static ad image and extract all visual elements with pixel-accurate positioning.

${options.detectText !== false ? '- Extract all text elements with their exact positions and styling' : ''}
${options.detectImages !== false ? '- Identify all image regions (photos, logos, icons)' : ''}
${options.detectShapes !== false ? '- Detect shapes (buttons, backgrounds, accent bars)' : ''}
${options.semanticLabeling !== false ? '- Label each element with its semantic role (headline, cta, hero, etc.)' : ''}
${options.inferConstraints !== false ? '- Infer text constraints (max lines, overflow behavior)' : ''}

Return the complete JSON analysis.`;

// =============================================================================
// AI Provider Interfaces
// =============================================================================

interface AIProvider {
  name: string;
  extractLayout(request: ExtractionRequest): Promise<ExtractionResult>;
}

/**
 * OpenAI GPT-4 Vision provider
 */
async function extractWithOpenAI(request: ExtractionRequest): Promise<ExtractionResult> {
  const apiKey = request.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { success: false, confidence: 0, error: 'OpenAI API key not provided' };
  }

  const imageContent = request.imageBase64
    ? { type: 'image_url', image_url: { url: `data:image/png;base64,${request.imageBase64}` } }
    : { type: 'image_url', image_url: { url: request.imageUrl! } };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: EXTRACTION_USER_PROMPT(request.options || {}) },
              imageContent,
            ],
          },
        ],
        max_tokens: 4096,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, confidence: 0, error: data.error?.message || 'OpenAI API error' };
    }

    const content = data.choices?.[0]?.message?.content;
    return parseExtractionResponse(content, request);
  } catch (error) {
    return {
      success: false,
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Anthropic Claude Vision provider
 */
async function extractWithClaude(request: ExtractionRequest): Promise<ExtractionResult> {
  const apiKey = request.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { success: false, confidence: 0, error: 'Anthropic API key not provided' };
  }

  const model = request.model === 'claude-3-opus' ? 'claude-3-opus-20240229' : 'claude-3-sonnet-20240229';
  
  let imageData: { type: string; media_type: string; data: string } | { type: string; url: string };
  
  if (request.imageBase64) {
    imageData = {
      type: 'base64',
      media_type: 'image/png',
      data: request.imageBase64,
    };
  } else {
    imageData = {
      type: 'url',
      url: request.imageUrl!,
    };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: EXTRACTION_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: imageData,
              },
              {
                type: 'text',
                text: EXTRACTION_USER_PROMPT(request.options || {}),
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, confidence: 0, error: data.error?.message || 'Anthropic API error' };
    }

    const content = data.content?.[0]?.text;
    return parseExtractionResponse(content, request);
  } catch (error) {
    return {
      success: false,
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// Response Parsing
// =============================================================================

/**
 * Parses the AI response and converts to TemplateDSL
 */
function parseExtractionResponse(content: string, request: ExtractionRequest): ExtractionResult {
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr.trim());
    
    // Convert to TemplateDSL
    const template = convertToTemplateDSL(parsed, request);
    
    return {
      success: true,
      template,
      elements: parsed.elements,
      canvas: parsed.canvas,
      confidence: parsed.overallConfidence || 0.8,
      warnings: parsed.warnings,
      rawResponse: parsed,
    };
  } catch (error) {
    return {
      success: false,
      confidence: 0,
      error: `Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      rawResponse: content,
    };
  }
}

/**
 * Converts parsed AI response to TemplateDSL format
 */
function convertToTemplateDSL(
  parsed: { canvas: Canvas; elements: ExtractedElement[]; overallConfidence?: number; warnings?: string[] },
  request: ExtractionRequest
): TemplateDSL {
  const canvas = parsed.canvas || request.canvasSize || { width: 1080, height: 1080 };
  
  const layers: Layer[] = parsed.elements.map((elem, index) => {
    const baseLayer = {
      id: `${elem.semanticRole || elem.type}_${index}`,
      z: elem.zIndex ?? index,
      rect: {
        x: elem.boundingBox.x,
        y: elem.boundingBox.y,
        w: elem.boundingBox.w,
        h: elem.boundingBox.h,
      },
      visible: true,
    };

    switch (elem.type) {
      case 'text':
        return {
          ...baseLayer,
          type: 'text' as const,
          text: {
            fontFamily: (elem.style?.fontFamily as string) || 'Inter',
            fontWeight: (elem.style?.fontWeight as number) || 400,
            fontSize: (elem.style?.fontSize as number) || 24,
            lineHeight: (elem.style?.lineHeight as number) || 1.2,
            letterSpacing: (elem.style?.letterSpacing as number) || 0,
            color: (elem.style?.color as string) || '#ffffff',
            align: (elem.style?.align as 'left' | 'center' | 'right') || 'left',
            valign: (elem.style?.valign as 'top' | 'middle' | 'bottom') || 'top',
          },
          bind: elem.semanticRole ? { textKey: elem.semanticRole } : undefined,
          constraints: {
            mode: 'fitTextOnNLines' as const,
            maxLines: (elem.style?.maxLines as number) || 3,
            minFontSize: 12,
            overflow: 'hidden' as const,
          },
        } satisfies TextLayer;

      case 'image':
        return {
          ...baseLayer,
          type: 'image' as const,
          image: {
            fit: (elem.style?.fit as 'cover' | 'contain' | 'fill' | 'none') || 'cover',
            anchor: 'center' as const,
            borderRadius: (elem.style?.borderRadius as number) || 0,
            opacity: 1,
          },
          bind: elem.semanticRole ? { assetKey: elem.semanticRole } : undefined,
          constraints: {
            lockAspect: true,
          },
        } satisfies ImageLayer;

      case 'shape':
        return {
          ...baseLayer,
          type: 'shape' as const,
          shape: {
            kind: (elem.style?.kind as 'rect' | 'circle' | 'ellipse' | 'line') || 'rect',
            fill: (elem.style?.fill as string) || '#000000',
            radius: (elem.style?.radius as number) || 0,
            opacity: 1,
            strokeWidth: 0,
          },
        } satisfies ShapeLayer;

      default:
        throw new Error(`Unknown element type: ${elem.type}`);
    }
  });

  // Build bindings from elements
  const textBindings: Record<string, string> = {};
  const assetBindings: Record<string, string> = {};

  parsed.elements.forEach((elem) => {
    if (elem.type === 'text' && elem.semanticRole && elem.content) {
      textBindings[elem.semanticRole] = elem.content;
    }
  });

  const template: TemplateDSL = {
    templateId: `extracted_${Date.now()}`,
    name: 'AI Extracted Template',
    version: '1.0.0',
    canvas: {
      width: canvas.width,
      height: canvas.height,
      bgColor: canvas.bgColor || '#000000',
    },
    layers,
    bindings: {
      text: textBindings,
      assets: assetBindings,
    },
    meta: {
      source: {
        type: 'reference_image',
      },
      extraction: {
        confidence: parsed.overallConfidence || 0.8,
        extractedAt: new Date().toISOString(),
        model: request.model || 'gpt-4-vision',
        warnings: parsed.warnings,
      },
    },
  };

  return template;
}

// =============================================================================
// Main Extraction Function
// =============================================================================

/**
 * Extracts a template from a static ad image using AI vision
 */
export async function extractTemplateFromImage(request: ExtractionRequest): Promise<ExtractionResult> {
  const model = request.model || 'gpt-4-vision';

  switch (model) {
    case 'gpt-4-vision':
      return extractWithOpenAI(request);
    case 'claude-3-opus':
    case 'claude-3-sonnet':
      return extractWithClaude(request);
    default:
      return { success: false, confidence: 0, error: `Unsupported model: ${model}` };
  }
}

/**
 * Extracts template from a local image file
 */
export async function extractTemplateFromFile(
  filePath: string,
  options?: Omit<ExtractionRequest, 'imageUrl' | 'imageBase64' | 'imagePath'>
): Promise<ExtractionResult> {
  // In a real implementation, read the file and convert to base64
  // For now, return a placeholder
  return {
    success: false,
    confidence: 0,
    error: 'File-based extraction not yet implemented. Use imageUrl or imageBase64.',
  };
}

// =============================================================================
// Validation & Refinement
// =============================================================================

/**
 * Validates and optionally refines an extracted template
 */
export function validateExtractedTemplate(template: TemplateDSL): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    validateTemplate(template);
  } catch (error) {
    errors.push(`Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Check for overlapping layers
  const sortedLayers = [...template.layers].sort((a, b) => a.z - b.z);
  for (let i = 0; i < sortedLayers.length; i++) {
    for (let j = i + 1; j < sortedLayers.length; j++) {
      const a = sortedLayers[i].rect;
      const b = sortedLayers[j].rect;
      if (rectsOverlap(a, b) && sortedLayers[i].z === sortedLayers[j].z) {
        warnings.push(`Layers "${sortedLayers[i].id}" and "${sortedLayers[j].id}" overlap with same z-index`);
      }
    }
  }

  // Check for out-of-bounds elements
  template.layers.forEach((layer) => {
    const { x, y, w, h } = layer.rect;
    if (x < 0 || y < 0 || x + w > template.canvas.width || y + h > template.canvas.height) {
      warnings.push(`Layer "${layer.id}" extends outside canvas bounds`);
    }
  });

  // Check for low confidence extractions
  if (template.meta?.extraction?.confidence && template.meta.extraction.confidence < 0.7) {
    warnings.push(`Low extraction confidence (${template.meta.extraction.confidence.toFixed(2)}). Manual review recommended.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
): boolean {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}

// =============================================================================
// Exports
// =============================================================================

export default {
  extractTemplateFromImage,
  extractTemplateFromFile,
  validateExtractedTemplate,
};
