/**
 * Ad Template Editing Module
 *
 * Human-in-the-Loop (HITL) template editing system for correcting AI extraction mistakes.
 */

export {
  HITLEditor,
  createEditSession,
  loadEditSession,
  type EditOperation,
  type EditSession,
  type EditValidationResult,
  type ValidationWarning,
  type ValidationError,
  type LayerUpdatePayload,
} from './hitl-editor';
