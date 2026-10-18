/**
 * Two-Pass AI Extraction System
 *
 * Pass 1: Literal Reconstruction - "What is on the image and where is it?"
 *   - Precise OCR with bounding boxes
 *   - Image region detection
 *   - Shape/color detection
 *   - Layer ordering
 *
 * Pass 2: Semantic Templating - "Which elements are variable vs fixed?"
 *   - Semantic role assignment (headline, cta, hero, logo, etc.)
 *   - Constraint inference (max lines, min font size, text-fit mode)
 *   - Binding key generation
 *   - Template optimization
 */

import type { TemplateDSL, Layer, TextLayer, ImageLayer, ShapeLayer } from '../schema/template-dsl';
import { generateConfidenceReport } from './confidence-scorer';
import type { ExtractionRequest, ExtractionResult, ExtractedElement } from './ai-extractor';

// =============================================================================
// Types
// =============================================================================

export interface Pass1Result {
  success: boolean;
  canvas: { width: number; height: number; bgColor?: string };
  literalElements: LiteralElement[];
  confidence: number;
  error?: string;
  rawResponse?: unknown;
}

export interface LiteralElement {
  type: 'text' | 'image' | 'shape';
  boundingBox: { x: number; y: number; w: number; h: number };
  zIndex: number;
  confidence: number;
  // Literal properties (what we see)
  textContent?: string;
  fontFamily?: string;
  fontWeight?: number;
  fontSize?: number;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
  // Image properties
  imageType?: 'photo' | 'illustration' | 'logo' | 'icon';
  imageFit?: 'cover' | 'contain' | 'fill';
  borderRadius?: number;
  // Shape properties
  shapeKind?: 'rect' | 'circle' | 'ellipse' | 'line';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  // General
  opacity?: number;
}

export interface Pass2Result {
  success: boolean;
  template: TemplateDSL;
  semanticMapping: SemanticMapping;
  confidence: number;
  error?: string;
  rawResponse?: unknown;
}

export interface SemanticMapping {
  // Maps layer IDs to their semantic roles
  roles: Record<string, string>; // { "text_0": "headline", "image_1": "hero" }
  // Variable vs fixed classification
  variableLayers: string[]; // IDs of layers that should be variable
  fixedLayers: string[]; // IDs of layers that are fixed (backgrounds, decorations)
  // Inferred constraints
  constraints: Record<string, LayerConstraint>;
  // Grouping information
  groups?: Record<string, string[]>; // { "cta_group": ["cta_button", "cta_text"] }
}

export interface LayerConstraint {
  layerId: string;
  // Text constraints
  maxLines?: number;
  minFontSize?: number;
  maxFontSize?: number;
  fitMode?: 'fitText' | 'fitTextOnNLines' | 'fillTextBox' | 'none';
  overflow?: 'hidden' | 'ellipsis' | 'wrap' | 'scroll';
  // Image constraints
  lockAspect?: boolean;
  minWidth?: number;
  minHeight?: number;
  // General
  maintainProportions?: boolean;
}

export interface TwoPassExtractionRequest extends ExtractionRequest {
  // Two-pass specific options
  twoPass?: {
    enablePass2?: boolean; // Default: true
    semanticGuidance?: string[]; // Hint expected roles: ["headline", "cta", "hero"]
    identifyGroups?: boolean; // Identify related elements (button + text)
    inferConstraints?: boolean; // Infer text fitting constraints
    classifyVariability?: boolean; // Classify variable vs fixed layers
  };
}

export interface TwoPassExtractionResult {
  success: boolean;
  pass1: Pass1Result;
  pass2?: Pass2Result;
  template?: TemplateDSL;
  confidence: number;
  error?: string;
}

// =============================================================================
// Pass 1: Literal Reconstruction
// =============================================================================

const PASS1_SYSTEM_PROMPT = `You are an expert at analyzing images pixel-by-pixel and extracting LITERAL information.

Your task is PASS 1: LITERAL RECONSTRUCTION. Answer only: "What is on this image and where is it?"

DO NOT:
- Assign semantic roles (headline, CTA, hero, etc.)
- Infer intent or purpose
- Make assumptions about variability

DO:
- Extract ALL visible elements with precise pixel coordinates
- Measure font sizes, colors, positions EXACTLY as they appear
- Detect shapes, images, text with their literal properties
- Establish z-order (layering) from visual overlap
- Report confidence for each detection

Output JSON format:
{
  "canvas": { "width": number, "height": number, "bgColor": string },
  "elements": [
    {
      "type": "text" | "image" | "shape",
      "boundingBox": { "x": number, "y": number, "w": number, "h": number },
      "zIndex": number,
      "confidence": number,
      // For text:
      "textContent": string,
      "fontFamily": string,
      "fontWeight": number,
      "fontSize": number,
      "textColor": string,
      "textAlign": "left" | "center" | "right",
      "valign": "top" | "middle" | "bottom",
      // For images:
      "imageType": "photo" | "illustration" | "logo" | "icon",
      "imageFit": "cover" | "contain" | "fill",
      "borderRadius": number,
      // For shapes:
      "shapeKind": "rect" | "circle" | "ellipse" | "line",
      "fill": string (hex),
      "stroke": string (hex),
      "strokeWidth": number,
      // Common:
      "opacity": number
    }
  ],
  "overallConfidence": number
}

Be EXTREMELY precise. Measure pixels carefully. This is literal reconstruction, not interpretation.`;

const PASS1_USER_PROMPT = `Analyze this image and extract EVERY visual element with pixel-accurate measurements.

Focus on LITERAL information only:
- What text is visible? (exact wording, size, color, position)
- What images are present? (exact bounding boxes)
- What shapes exist? (rectangles, circles, their colors and positions)
- What is the layering order?

Return complete JSON with all visible elements.`;

/**
 * Pass 1: Extract literal layout information
 */
export async function executeLiteralReconstruction(request: TwoPassExtractionRequest): Promise<Pass1Result> {
  const apiKey = request.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { success: false, canvas: { width: 0, height: 0 }, literalElements: [], confidence: 0, error: 'API key required' };
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
          { role: 'system', content: PASS1_SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: PASS1_USER_PROMPT },
              imageContent,
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0.1, // Low temperature for precise measurements
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        canvas: { width: 0, height: 0 },
        literalElements: [],
        confidence: 0,
        error: data.error?.message || 'OpenAI API error',
      };
    }

    const content = data.choices?.[0]?.message?.content;
    return parseLiteralReconstruction(content, request);
  } catch (error) {
    return {
      success: false,
      canvas: { width: 0, height: 0 },
      literalElements: [],
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Parse Pass 1 response
 */
function parseLiteralReconstruction(content: string, request: TwoPassExtractionRequest): Pass1Result {
  try {
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr.trim());

    return {
      success: true,
      canvas: parsed.canvas || request.canvasSize || { width: 1080, height: 1080 },
      literalElements: parsed.elements || [],
      confidence: parsed.overallConfidence || 0.8,
      rawResponse: parsed,
    };
  } catch (error) {
    return {
      success: false,
      canvas: { width: 0, height: 0 },
      literalElements: [],
      confidence: 0,
      error: `Failed to parse Pass 1 response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      rawResponse: content,
    };
  }
}

// =============================================================================
// Pass 2: Semantic Templating
// =============================================================================

const PASS2_SYSTEM_PROMPT = `You are an expert at analyzing layouts and identifying SEMANTIC PATTERNS for template generation.

Your task is PASS 2: SEMANTIC TEMPLATING. You receive literal element data from Pass 1. Now answer:
- "Which elements are VARIABLE (should change in variants)?"
- "Which elements are FIXED (decorative, backgrounds, consistent across variants)?"
- "What are the SEMANTIC ROLES?" (headline, subhead, cta, hero image, logo, background, etc.)
- "What CONSTRAINTS should apply?" (text fitting, aspect locks, alignment rules)

Guidelines:
1. **Variable elements**: Usually headlines, CTAs, hero images, product photos
2. **Fixed elements**: Backgrounds, decorative shapes, brand logos (usually)
3. **Semantic roles**: Use standard names (headline, subhead, cta, hero, logo, background, accent, body, caption)
4. **Constraints**: Infer based on layout:
   - Headlines: usually 1-3 lines max, larger min font size
   - Body text: more lines allowed, smaller min font size
   - CTAs: single line, must fit, centered
   - Images: lock aspect ratio for photos, flexible for illustrations

Output JSON format:
{
  "semanticMapping": {
    "roles": { "text_0": "headline", "image_1": "hero", "shape_0": "background" },
    "variableLayers": ["text_0", "text_1", "image_1"],
    "fixedLayers": ["shape_0", "shape_1"],
    "constraints": {
      "text_0": {
        "maxLines": 3,
        "minFontSize": 36,
        "fitMode": "fitTextOnNLines",
        "overflow": "hidden"
      },
      "image_1": {
        "lockAspect": true
      }
    },
    "groups": {
      "cta_group": ["shape_2", "text_2"]
    }
  },
  "recommendations": ["Consider...", "Watch out for..."],
  "confidence": number
}

Focus on creating a REUSABLE template that works with different content.`;

/**
 * Pass 2: Apply semantic understanding and generate template
 */
export async function executeSemanticTemplating(
  pass1: Pass1Result,
  request: TwoPassExtractionRequest
): Promise<Pass2Result> {
  const apiKey = request.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      template: createEmptyTemplate(),
      semanticMapping: createEmptyMapping(),
      confidence: 0,
      error: 'API key required',
    };
  }

  const semanticGuidance = request.twoPass?.semanticGuidance?.join(', ') || '';

  const pass2Prompt = `Given these literal elements from Pass 1, perform semantic analysis:

**Canvas**: ${pass1.canvas.width}x${pass1.canvas.height}
**Elements**: ${pass1.literalElements.length} elements detected

${pass1.literalElements.map((el, i) => {
  let desc = `Element ${i} (${el.type}, z=${el.zIndex}, confidence=${el.confidence.toFixed(2)}):`;
  desc += `\n  Position: (${el.boundingBox.x}, ${el.boundingBox.y}), Size: ${el.boundingBox.w}x${el.boundingBox.h}`;
  if (el.type === 'text' && el.textContent) {
    desc += `\n  Text: "${el.textContent}"`;
    desc += `\n  Style: ${el.fontSize}px ${el.fontFamily}, ${el.textColor}`;
  }
  if (el.type === 'image') {
    desc += `\n  Type: ${el.imageType || 'unknown'}`;
  }
  if (el.type === 'shape') {
    desc += `\n  Shape: ${el.shapeKind}, fill=${el.fill}`;
  }
  return desc;
}).join('\n\n')}

${semanticGuidance ? `\n**Expected roles hint**: ${semanticGuidance}` : ''}

Analyze and return semantic mapping JSON.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: PASS2_SYSTEM_PROMPT },
          { role: 'user', content: pass2Prompt },
        ],
        max_tokens: 3000,
        temperature: 0.2,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        template: createEmptyTemplate(),
        semanticMapping: createEmptyMapping(),
        confidence: 0,
        error: data.error?.message || 'OpenAI API error',
      };
    }

    const content = data.choices?.[0]?.message?.content;
    return parseSemanticTemplating(content, pass1, request);
  } catch (error) {
    return {
      success: false,
      template: createEmptyTemplate(),
      semanticMapping: createEmptyMapping(),
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Parse Pass 2 response and build template
 */
function parseSemanticTemplating(
  content: string,
  pass1: Pass1Result,
  request: TwoPassExtractionRequest
): Pass2Result {
  try {
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr.trim());
    const semanticMapping: SemanticMapping = parsed.semanticMapping;

    // Build template from Pass 1 + Pass 2
    const template = buildTemplateFromTwoPass(pass1, semanticMapping, request);

    return {
      success: true,
      template,
      semanticMapping,
      confidence: parsed.confidence || 0.85,
      rawResponse: parsed,
    };
  } catch (error) {
    return {
      success: false,
      template: createEmptyTemplate(),
      semanticMapping: createEmptyMapping(),
      confidence: 0,
      error: `Failed to parse Pass 2 response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      rawResponse: content,
    };
  }
}

/**
 * Build final TemplateDSL from both passes
 */
function buildTemplateFromTwoPass(
  pass1: Pass1Result,
  semanticMapping: SemanticMapping,
  request: TwoPassExtractionRequest
): TemplateDSL {
  const layers: Layer[] = pass1.literalElements.map((elem, index) => {
    const layerId = `${elem.type}_${index}`;
    const semanticRole = semanticMapping.roles[layerId];
    const constraints = semanticMapping.constraints?.[layerId];

    const baseLayer = {
      id: layerId,
      z: elem.zIndex,
      rect: elem.boundingBox,
      visible: true,
    };

    switch (elem.type) {
      case 'text':
        return {
          ...baseLayer,
          type: 'text' as const,
          text: {
            fontFamily: elem.fontFamily || 'Inter',
            fontWeight: elem.fontWeight || 400,
            fontSize: elem.fontSize || 24,
            lineHeight: 1.2,
            letterSpacing: 0,
            color: elem.textColor || '#ffffff',
            align: elem.textAlign || 'left',
            valign: elem.valign || 'top',
          },
          bind: semanticRole ? { textKey: semanticRole } : undefined,
          constraints: constraints ? {
            mode: (constraints.fitMode || 'fitTextOnNLines') as 'fitText' | 'fitTextOnNLines' | 'fillTextBox' | 'none',
            maxLines: constraints.maxLines || 3,
            minFontSize: constraints.minFontSize || 12,
            overflow: (constraints.overflow || 'hidden') as 'hidden' | 'ellipsis' | 'wrap' | 'scroll',
          } : undefined,
        } satisfies TextLayer;

      case 'image':
        return {
          ...baseLayer,
          type: 'image' as const,
          image: {
            fit: elem.imageFit || 'cover',
            anchor: 'center' as const,
            borderRadius: elem.borderRadius || 0,
            opacity: elem.opacity || 1,
          },
          bind: semanticRole ? { assetKey: semanticRole } : undefined,
          constraints: constraints ? {
            lockAspect: constraints.lockAspect ?? true,
          } : undefined,
        } satisfies ImageLayer;

      case 'shape':
        return {
          ...baseLayer,
          type: 'shape' as const,
          shape: {
            kind: elem.shapeKind || 'rect',
            fill: elem.fill || '#000000',
            radius: elem.borderRadius || 0,
            opacity: elem.opacity || 1,
            strokeWidth: elem.strokeWidth || 0,
            stroke: elem.stroke,
          },
        } satisfies ShapeLayer;

      default:
        throw new Error(`Unknown element type: ${elem.type}`);
    }
  });

  // Build bindings
  const textBindings: Record<string, string> = {};
  const assetBindings: Record<string, string> = {};

  pass1.literalElements.forEach((elem, index) => {
    const layerId = `${elem.type}_${index}`;
    const role = semanticMapping.roles[layerId];

    if (elem.type === 'text' && role && elem.textContent) {
      textBindings[role] = elem.textContent;
    }
    if (elem.type === 'image' && role) {
      assetBindings[role] = 'https://placeholder.example/image.png';
    }
  });

  const template: TemplateDSL = {
    templateId: `twopass_${Date.now()}`,
    name: 'Two-Pass Extracted Template',
    version: '1.0.0',
    canvas: {
      width: pass1.canvas.width,
      height: pass1.canvas.height,
      bgColor: pass1.canvas.bgColor || '#000000',
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
        confidence: pass1.confidence,
        extractedAt: new Date().toISOString(),
        model: request.model || 'gpt-4-vision',
        twoPass: true,
      },
    },
  };

  return template;
}

// =============================================================================
// Main Two-Pass Extraction
// =============================================================================

/**
 * Execute full two-pass extraction: literal reconstruction + semantic templating
 */
export async function extractWithTwoPass(request: TwoPassExtractionRequest): Promise<TwoPassExtractionResult> {
  // Pass 1: Literal Reconstruction
  console.log('🔍 Pass 1: Literal Reconstruction...');
  const pass1 = await executeLiteralReconstruction(request);

  if (!pass1.success) {
    return {
      success: false,
      pass1,
      confidence: 0,
      error: `Pass 1 failed: ${pass1.error}`,
    };
  }

  console.log(`✅ Pass 1 complete: ${pass1.literalElements.length} elements detected (confidence: ${pass1.confidence.toFixed(2)})`);

  // Pass 2: Semantic Templating (if enabled)
  const enablePass2 = request.twoPass?.enablePass2 !== false;

  if (!enablePass2) {
    // Return Pass 1 only (basic template without semantic mapping)
    const basicTemplate = buildBasicTemplate(pass1, request);
    return {
      success: true,
      pass1,
      template: basicTemplate,
      confidence: pass1.confidence,
    };
  }

  console.log('🧠 Pass 2: Semantic Templating...');
  const pass2 = await executeSemanticTemplating(pass1, request);

  if (!pass2.success) {
    // Return Pass 1 template as fallback
    const basicTemplate = buildBasicTemplate(pass1, request);
    return {
      success: true,
      pass1,
      pass2,
      template: basicTemplate,
      confidence: pass1.confidence * 0.8, // Lower confidence due to Pass 2 failure
      error: `Pass 2 warning: ${pass2.error}`,
    };
  }

  console.log(`✅ Pass 2 complete: Semantic mapping applied (confidence: ${pass2.confidence.toFixed(2)})`);

  // Generate confidence report
  const confidenceReport = generateConfidenceReport(pass2.template);
  console.log(`📊 Overall confidence: ${confidenceReport.overallConfidence.toFixed(2)}`);

  if (confidenceReport.summary.needsReview) {
    console.log('⚠️  Manual review recommended');
  }

  return {
    success: true,
    pass1,
    pass2,
    template: pass2.template,
    confidence: (pass1.confidence + pass2.confidence + confidenceReport.overallConfidence) / 3,
  };
}

/**
 * Build basic template from Pass 1 only (fallback)
 */
function buildBasicTemplate(pass1: Pass1Result, request: TwoPassExtractionRequest): TemplateDSL {
  const layers: Layer[] = pass1.literalElements.map((elem, index) => {
    const baseLayer = {
      id: `${elem.type}_${index}`,
      z: elem.zIndex,
      rect: elem.boundingBox,
      visible: true,
    };

    switch (elem.type) {
      case 'text':
        return {
          ...baseLayer,
          type: 'text' as const,
          text: {
            fontFamily: elem.fontFamily || 'Inter',
            fontWeight: elem.fontWeight || 400,
            fontSize: elem.fontSize || 24,
            lineHeight: 1.2,
            letterSpacing: 0,
            color: elem.textColor || '#ffffff',
            align: elem.textAlign || 'left',
            valign: elem.valign || 'top',
          },
        } satisfies TextLayer;

      case 'image':
        return {
          ...baseLayer,
          type: 'image' as const,
          image: {
            fit: elem.imageFit || 'cover',
            anchor: 'center' as const,
            borderRadius: elem.borderRadius || 0,
            opacity: elem.opacity || 1,
          },
        } satisfies ImageLayer;

      case 'shape':
        return {
          ...baseLayer,
          type: 'shape' as const,
          shape: {
            kind: elem.shapeKind || 'rect',
            fill: elem.fill || '#000000',
            radius: elem.borderRadius || 0,
            opacity: elem.opacity || 1,
            strokeWidth: elem.strokeWidth || 0,
          },
        } satisfies ShapeLayer;

      default:
        throw new Error(`Unknown element type: ${elem.type}`);
    }
  });

  return {
    templateId: `basic_${Date.now()}`,
    name: 'Basic Extracted Template',
    version: '1.0.0',
    canvas: pass1.canvas,
    layers,
    bindings: { text: {}, assets: {} },
    meta: {
      source: { type: 'reference_image' },
      extraction: {
        confidence: pass1.confidence,
        extractedAt: new Date().toISOString(),
        model: request.model || 'gpt-4-vision',
        twoPass: false,
      },
    },
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

function createEmptyTemplate(): TemplateDSL {
  return {
    templateId: 'empty',
    name: 'Empty Template',
    version: '1.0.0',
    canvas: { width: 1080, height: 1080, bgColor: '#000000' },
    layers: [],
    bindings: { text: {}, assets: {} },
  };
}

function createEmptyMapping(): SemanticMapping {
  return {
    roles: {},
    variableLayers: [],
    fixedLayers: [],
    constraints: {},
  };
}

// =============================================================================
// Exports
// =============================================================================

export default {
  extractWithTwoPass,
  executeLiteralReconstruction,
  executeSemanticTemplating,
};
