/**
 * Confidence Scorer
 * 
 * Evaluates and scores the confidence of extracted template elements.
 * Used for quality control and human-in-the-loop review decisions.
 */

import type { TemplateDSL, Layer, TextLayer, ImageLayer, ShapeLayer } from '../schema/template-dsl';

// =============================================================================
// Types
// =============================================================================

export interface LayerConfidence {
  layerId: string;
  overall: number;
  details: {
    position: number;
    dimensions: number;
    style: number;
    content?: number;
    semantic?: number;
  };
  flags: ConfidenceFlag[];
}

export interface ConfidenceFlag {
  type: 'warning' | 'error' | 'info';
  code: string;
  message: string;
  suggestion?: string;
}

export interface TemplateConfidenceReport {
  templateId: string;
  overallConfidence: number;
  layers: LayerConfidence[];
  summary: {
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
    needsReview: boolean;
  };
  recommendations: string[];
}

// =============================================================================
// Thresholds
// =============================================================================

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.85,
  MEDIUM: 0.65,
  LOW: 0.40,
  AUTO_APPROVE: 0.90,
  REQUIRE_REVIEW: 0.60,
} as const;

// =============================================================================
// Scoring Functions
// =============================================================================

/**
 * Scores a text layer's extraction confidence
 */
function scoreTextLayer(layer: TextLayer, canvas: { width: number; height: number }): LayerConfidence {
  const flags: ConfidenceFlag[] = [];
  let positionScore = 1.0;
  let dimensionsScore = 1.0;
  let styleScore = 1.0;
  let contentScore = 1.0;
  let semanticScore = 1.0;

  // Position checks
  if (layer.rect.x < 0 || layer.rect.y < 0) {
    positionScore -= 0.3;
    flags.push({
      type: 'warning',
      code: 'NEGATIVE_POSITION',
      message: 'Layer has negative position values',
      suggestion: 'Verify layer placement is correct',
    });
  }

  if (layer.rect.x + layer.rect.w > canvas.width || layer.rect.y + layer.rect.h > canvas.height) {
    positionScore -= 0.2;
    flags.push({
      type: 'warning',
      code: 'OUT_OF_BOUNDS',
      message: 'Layer extends beyond canvas',
      suggestion: 'Check if this is intentional (bleed) or an extraction error',
    });
  }

  // Dimension checks
  if (layer.rect.w < 20 || layer.rect.h < 10) {
    dimensionsScore -= 0.3;
    flags.push({
      type: 'warning',
      code: 'VERY_SMALL',
      message: 'Text layer is very small',
      suggestion: 'Verify this is not a detection artifact',
    });
  }

  if (layer.rect.w > canvas.width * 0.95 && layer.rect.h > canvas.height * 0.95) {
    dimensionsScore -= 0.2;
    flags.push({
      type: 'info',
      code: 'FULL_CANVAS',
      message: 'Text layer covers nearly the entire canvas',
    });
  }

  // Style checks
  if (layer.text.fontSize < 8) {
    styleScore -= 0.3;
    flags.push({
      type: 'warning',
      code: 'TINY_FONT',
      message: 'Font size is very small',
      suggestion: 'Font size might be incorrectly detected',
    });
  }

  if (layer.text.fontSize > 200) {
    styleScore -= 0.2;
    flags.push({
      type: 'warning',
      code: 'HUGE_FONT',
      message: 'Font size is very large',
      suggestion: 'Verify font size is correct',
    });
  }

  // Generic font family reduces confidence
  if (['sans-serif', 'serif', 'monospace'].includes(layer.text.fontFamily.toLowerCase())) {
    styleScore -= 0.2;
    flags.push({
      type: 'info',
      code: 'GENERIC_FONT',
      message: 'Font family is generic',
      suggestion: 'Consider specifying exact font family for better recreation',
    });
  }

  // Semantic check
  if (!layer.bind?.textKey) {
    semanticScore -= 0.3;
    flags.push({
      type: 'info',
      code: 'NO_SEMANTIC_ROLE',
      message: 'Text layer has no semantic role assigned',
      suggestion: 'Assign a role like headline, subhead, cta for better variant generation',
    });
  }

  const overall = (positionScore + dimensionsScore + styleScore + contentScore + semanticScore) / 5;

  return {
    layerId: layer.id,
    overall: Math.max(0, Math.min(1, overall)),
    details: {
      position: positionScore,
      dimensions: dimensionsScore,
      style: styleScore,
      content: contentScore,
      semantic: semanticScore,
    },
    flags,
  };
}

/**
 * Scores an image layer's extraction confidence
 */
function scoreImageLayer(layer: ImageLayer, canvas: { width: number; height: number }): LayerConfidence {
  const flags: ConfidenceFlag[] = [];
  let positionScore = 1.0;
  let dimensionsScore = 1.0;
  let styleScore = 1.0;
  let semanticScore = 1.0;

  // Position checks
  if (layer.rect.x < 0 || layer.rect.y < 0) {
    positionScore -= 0.2;
    flags.push({
      type: 'warning',
      code: 'NEGATIVE_POSITION',
      message: 'Image has negative position',
    });
  }

  // Dimension checks
  if (layer.rect.w < 20 || layer.rect.h < 20) {
    dimensionsScore -= 0.4;
    flags.push({
      type: 'warning',
      code: 'VERY_SMALL_IMAGE',
      message: 'Image layer is very small',
      suggestion: 'This might be an icon or detection artifact',
    });
  }

  // Check aspect ratio reasonableness
  const aspectRatio = layer.rect.w / layer.rect.h;
  if (aspectRatio < 0.1 || aspectRatio > 10) {
    dimensionsScore -= 0.3;
    flags.push({
      type: 'warning',
      code: 'EXTREME_ASPECT',
      message: 'Image has extreme aspect ratio',
      suggestion: 'Verify dimensions are correct',
    });
  }

  // Semantic check
  if (!layer.bind?.assetKey) {
    semanticScore -= 0.3;
    flags.push({
      type: 'info',
      code: 'NO_ASSET_KEY',
      message: 'Image has no asset key assigned',
      suggestion: 'Assign an asset key like hero, logo, product for variant generation',
    });
  }

  const overall = (positionScore + dimensionsScore + styleScore + semanticScore) / 4;

  return {
    layerId: layer.id,
    overall: Math.max(0, Math.min(1, overall)),
    details: {
      position: positionScore,
      dimensions: dimensionsScore,
      style: styleScore,
      semantic: semanticScore,
    },
    flags,
  };
}

/**
 * Scores a shape layer's extraction confidence
 */
function scoreShapeLayer(layer: ShapeLayer, canvas: { width: number; height: number }): LayerConfidence {
  const flags: ConfidenceFlag[] = [];
  let positionScore = 1.0;
  let dimensionsScore = 1.0;
  let styleScore = 1.0;

  // Position checks
  if (layer.rect.x < 0 || layer.rect.y < 0) {
    positionScore -= 0.1; // Less severe for shapes (might be intentional)
  }

  // Style checks
  if (!layer.shape.fill && !layer.shape.stroke) {
    styleScore -= 0.4;
    flags.push({
      type: 'warning',
      code: 'INVISIBLE_SHAPE',
      message: 'Shape has no fill or stroke',
      suggestion: 'This shape may be invisible',
    });
  }

  // Check for very thin shapes that might be artifacts
  if (layer.rect.w < 3 || layer.rect.h < 3) {
    dimensionsScore -= 0.3;
    flags.push({
      type: 'info',
      code: 'THIN_SHAPE',
      message: 'Shape is very thin',
      suggestion: 'Might be a line or detection artifact',
    });
  }

  const overall = (positionScore + dimensionsScore + styleScore) / 3;

  return {
    layerId: layer.id,
    overall: Math.max(0, Math.min(1, overall)),
    details: {
      position: positionScore,
      dimensions: dimensionsScore,
      style: styleScore,
    },
    flags,
  };
}

/**
 * Scores a single layer based on its type
 */
function scoreLayer(layer: Layer, canvas: { width: number; height: number }): LayerConfidence {
  switch (layer.type) {
    case 'text':
      return scoreTextLayer(layer, canvas);
    case 'image':
      return scoreImageLayer(layer, canvas);
    case 'shape':
      return scoreShapeLayer(layer, canvas);
    default:
      return {
        layerId: (layer as Layer).id,
        overall: 0.5,
        details: { position: 0.5, dimensions: 0.5, style: 0.5 },
        flags: [{ type: 'error', code: 'UNKNOWN_TYPE', message: 'Unknown layer type' }],
      };
  }
}

// =============================================================================
// Main Scoring Function
// =============================================================================

/**
 * Generates a comprehensive confidence report for an extracted template
 */
export function generateConfidenceReport(template: TemplateDSL): TemplateConfidenceReport {
  const layerScores = template.layers.map((layer) => scoreLayer(layer, template.canvas));

  const avgConfidence = layerScores.length > 0
    ? layerScores.reduce((sum, l) => sum + l.overall, 0) / layerScores.length
    : 0;

  // Factor in extraction metadata if available
  let overallConfidence = avgConfidence;
  if (template.meta?.extraction?.confidence) {
    overallConfidence = (avgConfidence + template.meta.extraction.confidence) / 2;
  }

  // Count by confidence level
  const highConfidence = layerScores.filter((l) => l.overall >= CONFIDENCE_THRESHOLDS.HIGH).length;
  const mediumConfidence = layerScores.filter(
    (l) => l.overall >= CONFIDENCE_THRESHOLDS.MEDIUM && l.overall < CONFIDENCE_THRESHOLDS.HIGH
  ).length;
  const lowConfidence = layerScores.filter((l) => l.overall < CONFIDENCE_THRESHOLDS.MEDIUM).length;

  // Generate recommendations
  const recommendations: string[] = [];

  if (overallConfidence < CONFIDENCE_THRESHOLDS.REQUIRE_REVIEW) {
    recommendations.push('Manual review strongly recommended due to low overall confidence');
  }

  if (lowConfidence > 0) {
    recommendations.push(`${lowConfidence} layer(s) have low confidence and should be verified`);
  }

  const allFlags = layerScores.flatMap((l) => l.flags);
  const errors = allFlags.filter((f) => f.type === 'error');
  if (errors.length > 0) {
    recommendations.push(`${errors.length} error(s) detected - review before using template`);
  }

  const noSemanticRole = template.layers.filter((l) => {
    if (l.type === 'text') return !l.bind?.textKey;
    if (l.type === 'image') return !l.bind?.assetKey;
    return false;
  }).length;

  if (noSemanticRole > 0) {
    recommendations.push(`${noSemanticRole} layer(s) lack semantic roles - assign for better variant generation`);
  }

  return {
    templateId: template.templateId,
    overallConfidence,
    layers: layerScores,
    summary: {
      highConfidence,
      mediumConfidence,
      lowConfidence,
      needsReview: overallConfidence < CONFIDENCE_THRESHOLDS.AUTO_APPROVE,
    },
    recommendations,
  };
}

/**
 * Quick check if template should be auto-approved
 */
export function shouldAutoApprove(template: TemplateDSL): boolean {
  const report = generateConfidenceReport(template);
  return report.overallConfidence >= CONFIDENCE_THRESHOLDS.AUTO_APPROVE && report.summary.lowConfidence === 0;
}

/**
 * Quick check if template requires manual review
 */
export function requiresManualReview(template: TemplateDSL): boolean {
  const report = generateConfidenceReport(template);
  return report.summary.needsReview;
}

export default {
  generateConfidenceReport,
  shouldAutoApprove,
  requiresManualReview,
  CONFIDENCE_THRESHOLDS,
};
