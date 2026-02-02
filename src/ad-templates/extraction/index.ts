/**
 * Ad Template Extraction Module
 *
 * AI-powered layout extraction from static ad images.
 */

export {
  extractTemplateFromImage,
  extractTemplateFromFile,
  validateExtractedTemplate,
  type ExtractionRequest,
  type ExtractionOptions,
  type ExtractedElement,
  type ExtractionResult,
} from './ai-extractor';

export {
  generateConfidenceReport,
  shouldAutoApprove,
  requiresManualReview,
  CONFIDENCE_THRESHOLDS,
  type LayerConfidence,
  type ConfidenceFlag,
  type TemplateConfidenceReport,
} from './confidence-scorer';

export {
  extractWithTwoPass,
  executeLiteralReconstruction,
  executeSemanticTemplating,
  type TwoPassExtractionRequest,
  type TwoPassExtractionResult,
  type Pass1Result,
  type Pass2Result,
  type LiteralElement,
  type SemanticMapping,
  type LayerConstraint,
} from './two-pass-extractor';
