/**
 * Human-in-the-Loop (HITL) Template Editor
 *
 * Lightweight template editor for correcting AI extraction mistakes.
 * Provides editing operations for template layers with validation and undo/redo support.
 *
 * Features:
 * - Layer CRUD operations (create, read, update, delete)
 * - Layer property editing (position, dimensions, style)
 * - Layer reordering (z-index management)
 * - Validation and constraint checking
 * - Edit history with undo/redo
 * - Diff visualization between original and edited
 */

import type { TemplateDSL, Layer, TextLayer, ImageLayer, ShapeLayer, Rect } from '../schema/template-dsl';
import { scoreTemplate, type TemplateConfidenceReport } from '../extraction/confidence-scorer';

// =============================================================================
// Types
// =============================================================================

export interface EditOperation {
  id: string;
  timestamp: string;
  type: 'create' | 'update' | 'delete' | 'reorder';
  layerId: string;
  before?: Partial<Layer>;
  after?: Partial<Layer>;
  description: string;
}

export interface EditSession {
  sessionId: string;
  templateId: string;
  originalTemplate: TemplateDSL;
  currentTemplate: TemplateDSL;
  operations: EditOperation[];
  currentOperationIndex: number; // For undo/redo
  createdAt: string;
  updatedAt: string;
}

export interface EditValidationResult {
  valid: boolean;
  warnings: ValidationWarning[];
  errors: ValidationError[];
}

export interface ValidationWarning {
  type: 'warning';
  code: string;
  message: string;
  layerId?: string;
  suggestion?: string;
}

export interface ValidationError {
  type: 'error';
  code: string;
  message: string;
  layerId?: string;
  fix?: string;
}

export interface LayerUpdatePayload {
  layerId: string;
  updates: {
    rect?: Partial<Rect>;
    text?: Partial<TextLayer['text']>;
    image?: Partial<ImageLayer['image']>;
    shape?: Partial<ShapeLayer['shape']>;
    bind?: Layer['bind'];
    constraints?: Layer['constraints'];
  };
}

// =============================================================================
// HITL Editor Class
// =============================================================================

export class HITLEditor {
  private session: EditSession;

  constructor(template: TemplateDSL, sessionId?: string) {
    this.session = {
      sessionId: sessionId || this.generateSessionId(),
      templateId: template.templateId,
      originalTemplate: structuredClone(template),
      currentTemplate: structuredClone(template),
      operations: [],
      currentOperationIndex: -1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // ===========================================================================
  // Session Management
  // ===========================================================================

  getSession(): EditSession {
    return this.session;
  }

  getCurrentTemplate(): TemplateDSL {
    return this.session.currentTemplate;
  }

  getOriginalTemplate(): TemplateDSL {
    return this.session.originalTemplate;
  }

  getOperationHistory(): EditOperation[] {
    return this.session.operations.slice(0, this.session.currentOperationIndex + 1);
  }

  hasUnsavedChanges(): boolean {
    return this.session.operations.length > 0;
  }

  // ===========================================================================
  // Layer Operations
  // ===========================================================================

  /**
   * Get a layer by ID
   */
  getLayer(layerId: string): Layer | undefined {
    return this.session.currentTemplate.layers.find((l) => l.id === layerId);
  }

  /**
   * Get all layers
   */
  getAllLayers(): Layer[] {
    return this.session.currentTemplate.layers;
  }

  /**
   * Get layers by type
   */
  getLayersByType(type: Layer['type']): Layer[] {
    return this.session.currentTemplate.layers.filter((l) => l.type === type);
  }

  /**
   * Update layer properties
   */
  updateLayer(payload: LayerUpdatePayload): EditValidationResult {
    const layer = this.getLayer(payload.layerId);
    if (!layer) {
      return {
        valid: false,
        warnings: [],
        errors: [
          {
            type: 'error',
            code: 'LAYER_NOT_FOUND',
            message: `Layer ${payload.layerId} not found`,
          },
        ],
      };
    }

    // Validate updates before applying
    const validation = this.validateLayerUpdate(layer, payload.updates);
    if (!validation.valid) {
      return validation;
    }

    // Clone layer before modification
    const before = structuredClone(layer);

    // Apply updates
    if (payload.updates.rect) {
      layer.rect = { ...layer.rect, ...payload.updates.rect };
    }

    if (layer.type === 'text' && payload.updates.text) {
      layer.text = { ...layer.text, ...payload.updates.text };
    }

    if (layer.type === 'image' && payload.updates.image) {
      layer.image = { ...layer.image, ...payload.updates.image };
    }

    if (layer.type === 'shape' && payload.updates.shape) {
      layer.shape = { ...layer.shape, ...payload.updates.shape };
    }

    if (payload.updates.bind !== undefined) {
      layer.bind = payload.updates.bind;
    }

    if (payload.updates.constraints !== undefined) {
      layer.constraints = payload.updates.constraints;
    }

    // Record operation
    this.recordOperation({
      type: 'update',
      layerId: payload.layerId,
      before,
      after: structuredClone(layer),
      description: `Updated layer ${payload.layerId}`,
    });

    return validation;
  }

  /**
   * Delete a layer
   */
  deleteLayer(layerId: string): EditValidationResult {
    const layerIndex = this.session.currentTemplate.layers.findIndex((l) => l.id === layerId);
    if (layerIndex === -1) {
      return {
        valid: false,
        warnings: [],
        errors: [
          {
            type: 'error',
            code: 'LAYER_NOT_FOUND',
            message: `Layer ${layerId} not found`,
          },
        ],
      };
    }

    const layer = this.session.currentTemplate.layers[layerIndex];
    const before = structuredClone(layer);

    // Remove layer
    this.session.currentTemplate.layers.splice(layerIndex, 1);

    // Record operation
    this.recordOperation({
      type: 'delete',
      layerId,
      before,
      description: `Deleted layer ${layerId}`,
    });

    return { valid: true, warnings: [], errors: [] };
  }

  /**
   * Create a new layer
   */
  createLayer(layer: Layer): EditValidationResult {
    // Check if layer ID already exists
    if (this.getLayer(layer.id)) {
      return {
        valid: false,
        warnings: [],
        errors: [
          {
            type: 'error',
            code: 'DUPLICATE_ID',
            message: `Layer with ID ${layer.id} already exists`,
            fix: 'Use a unique layer ID',
          },
        ],
      };
    }

    // Validate layer
    const validation = this.validateNewLayer(layer);
    if (!validation.valid) {
      return validation;
    }

    // Add layer
    this.session.currentTemplate.layers.push(structuredClone(layer));

    // Sort layers by z-index
    this.sortLayersByZIndex();

    // Record operation
    this.recordOperation({
      type: 'create',
      layerId: layer.id,
      after: structuredClone(layer),
      description: `Created layer ${layer.id}`,
    });

    return validation;
  }

  /**
   * Reorder layer (change z-index)
   */
  reorderLayer(layerId: string, newZIndex: number): EditValidationResult {
    const layer = this.getLayer(layerId);
    if (!layer) {
      return {
        valid: false,
        warnings: [],
        errors: [
          {
            type: 'error',
            code: 'LAYER_NOT_FOUND',
            message: `Layer ${layerId} not found`,
          },
        ],
      };
    }

    const oldZIndex = layer.z;
    layer.z = newZIndex;

    // Sort layers by z-index
    this.sortLayersByZIndex();

    // Record operation
    this.recordOperation({
      type: 'reorder',
      layerId,
      before: { z: oldZIndex } as Partial<Layer>,
      after: { z: newZIndex } as Partial<Layer>,
      description: `Reordered layer ${layerId} from z=${oldZIndex} to z=${newZIndex}`,
    });

    return { valid: true, warnings: [], errors: [] };
  }

  // ===========================================================================
  // Undo/Redo
  // ===========================================================================

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.session.currentOperationIndex >= 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.session.currentOperationIndex < this.session.operations.length - 1;
  }

  /**
   * Undo last operation
   */
  undo(): boolean {
    if (!this.canUndo()) {
      return false;
    }

    const operation = this.session.operations[this.session.currentOperationIndex];
    this.applyInverseOperation(operation);
    this.session.currentOperationIndex--;
    this.session.updatedAt = new Date().toISOString();

    return true;
  }

  /**
   * Redo next operation
   */
  redo(): boolean {
    if (!this.canRedo()) {
      return false;
    }

    this.session.currentOperationIndex++;
    const operation = this.session.operations[this.session.currentOperationIndex];
    this.applyOperation(operation);
    this.session.updatedAt = new Date().toISOString();

    return true;
  }

  // ===========================================================================
  // Validation
  // ===========================================================================

  /**
   * Validate the entire template
   */
  validateTemplate(): EditValidationResult {
    const warnings: ValidationWarning[] = [];
    const errors: ValidationError[] = [];

    const canvas = this.session.currentTemplate.canvas;

    // Check for duplicate layer IDs
    const layerIds = new Set<string>();
    for (const layer of this.session.currentTemplate.layers) {
      if (layerIds.has(layer.id)) {
        errors.push({
          type: 'error',
          code: 'DUPLICATE_LAYER_ID',
          message: `Duplicate layer ID: ${layer.id}`,
          layerId: layer.id,
        });
      }
      layerIds.add(layer.id);
    }

    // Validate each layer
    for (const layer of this.session.currentTemplate.layers) {
      // Check bounds
      if (
        layer.rect.x < 0 ||
        layer.rect.y < 0 ||
        layer.rect.x + layer.rect.w > canvas.width ||
        layer.rect.y + layer.rect.h > canvas.height
      ) {
        warnings.push({
          type: 'warning',
          code: 'OUT_OF_BOUNDS',
          message: `Layer ${layer.id} extends beyond canvas`,
          layerId: layer.id,
          suggestion: 'Adjust layer position or dimensions',
        });
      }

      // Check minimum dimensions
      if (layer.rect.w < 1 || layer.rect.h < 1) {
        errors.push({
          type: 'error',
          code: 'INVALID_DIMENSIONS',
          message: `Layer ${layer.id} has invalid dimensions`,
          layerId: layer.id,
          fix: 'Set width and height to at least 1px',
        });
      }

      // Type-specific validation
      if (layer.type === 'text') {
        if (!layer.text.fontFamily) {
          errors.push({
            type: 'error',
            code: 'MISSING_FONT',
            message: `Text layer ${layer.id} missing font family`,
            layerId: layer.id,
          });
        }
        if (layer.text.fontSize < 1) {
          errors.push({
            type: 'error',
            code: 'INVALID_FONT_SIZE',
            message: `Text layer ${layer.id} has invalid font size`,
            layerId: layer.id,
          });
        }
      }

      if (layer.type === 'image') {
        if (!layer.image) {
          errors.push({
            type: 'error',
            code: 'MISSING_IMAGE_CONFIG',
            message: `Image layer ${layer.id} missing image configuration`,
            layerId: layer.id,
          });
        }
      }

      if (layer.type === 'shape') {
        if (!layer.shape) {
          errors.push({
            type: 'error',
            code: 'MISSING_SHAPE_CONFIG',
            message: `Shape layer ${layer.id} missing shape configuration`,
            layerId: layer.id,
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  }

  /**
   * Get confidence report for current template
   */
  getConfidenceReport(): TemplateConfidenceReport {
    return scoreTemplate(this.session.currentTemplate);
  }

  // ===========================================================================
  // Diff & Export
  // ===========================================================================

  /**
   * Get diff between original and current template
   */
  getDiff(): {
    added: Layer[];
    modified: Array<{ layerId: string; before: Layer; after: Layer }>;
    deleted: Layer[];
  } {
    const original = this.session.originalTemplate;
    const current = this.session.currentTemplate;

    const added: Layer[] = [];
    const modified: Array<{ layerId: string; before: Layer; after: Layer }> = [];
    const deleted: Layer[] = [];

    // Find added and modified layers
    for (const currentLayer of current.layers) {
      const originalLayer = original.layers.find((l) => l.id === currentLayer.id);
      if (!originalLayer) {
        added.push(currentLayer);
      } else if (JSON.stringify(originalLayer) !== JSON.stringify(currentLayer)) {
        modified.push({
          layerId: currentLayer.id,
          before: originalLayer,
          after: currentLayer,
        });
      }
    }

    // Find deleted layers
    for (const originalLayer of original.layers) {
      if (!current.layers.find((l) => l.id === originalLayer.id)) {
        deleted.push(originalLayer);
      }
    }

    return { added, modified, deleted };
  }

  /**
   * Export edited template
   */
  export(): TemplateDSL {
    return structuredClone(this.session.currentTemplate);
  }

  // ===========================================================================
  // Private Helper Methods
  // ===========================================================================

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private recordOperation(op: Omit<EditOperation, 'id' | 'timestamp'>): void {
    // If we're not at the end of history, truncate future operations
    if (this.session.currentOperationIndex < this.session.operations.length - 1) {
      this.session.operations = this.session.operations.slice(0, this.session.currentOperationIndex + 1);
    }

    const operation: EditOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...op,
    };

    this.session.operations.push(operation);
    this.session.currentOperationIndex++;
    this.session.updatedAt = new Date().toISOString();
  }

  private applyOperation(operation: EditOperation): void {
    switch (operation.type) {
      case 'create':
        if (operation.after) {
          this.session.currentTemplate.layers.push(operation.after as Layer);
          this.sortLayersByZIndex();
        }
        break;
      case 'update':
        if (operation.after) {
          const layer = this.getLayer(operation.layerId);
          if (layer) {
            Object.assign(layer, operation.after);
          }
        }
        break;
      case 'delete':
        const deleteIndex = this.session.currentTemplate.layers.findIndex((l) => l.id === operation.layerId);
        if (deleteIndex !== -1) {
          this.session.currentTemplate.layers.splice(deleteIndex, 1);
        }
        break;
      case 'reorder':
        if (operation.after) {
          const layer = this.getLayer(operation.layerId);
          if (layer && operation.after.z !== undefined) {
            layer.z = operation.after.z;
            this.sortLayersByZIndex();
          }
        }
        break;
    }
  }

  private applyInverseOperation(operation: EditOperation): void {
    switch (operation.type) {
      case 'create':
        // Inverse of create is delete
        const createIndex = this.session.currentTemplate.layers.findIndex((l) => l.id === operation.layerId);
        if (createIndex !== -1) {
          this.session.currentTemplate.layers.splice(createIndex, 1);
        }
        break;
      case 'update':
        // Inverse of update is restore before state
        if (operation.before) {
          const layer = this.getLayer(operation.layerId);
          if (layer) {
            Object.assign(layer, operation.before);
          }
        }
        break;
      case 'delete':
        // Inverse of delete is create
        if (operation.before) {
          this.session.currentTemplate.layers.push(operation.before as Layer);
          this.sortLayersByZIndex();
        }
        break;
      case 'reorder':
        // Inverse of reorder is restore old z-index
        if (operation.before) {
          const layer = this.getLayer(operation.layerId);
          if (layer && operation.before.z !== undefined) {
            layer.z = operation.before.z;
            this.sortLayersByZIndex();
          }
        }
        break;
    }
  }

  private sortLayersByZIndex(): void {
    this.session.currentTemplate.layers.sort((a, b) => a.z - b.z);
  }

  private validateLayerUpdate(layer: Layer, updates: LayerUpdatePayload['updates']): EditValidationResult {
    const warnings: ValidationWarning[] = [];
    const errors: ValidationError[] = [];

    // Validate rect updates
    if (updates.rect) {
      const newRect = { ...layer.rect, ...updates.rect };
      if (newRect.w < 1 || newRect.h < 1) {
        errors.push({
          type: 'error',
          code: 'INVALID_DIMENSIONS',
          message: 'Width and height must be at least 1px',
          layerId: layer.id,
        });
      }

      const canvas = this.session.currentTemplate.canvas;
      if (
        newRect.x < 0 ||
        newRect.y < 0 ||
        newRect.x + newRect.w > canvas.width ||
        newRect.y + newRect.h > canvas.height
      ) {
        warnings.push({
          type: 'warning',
          code: 'OUT_OF_BOUNDS',
          message: 'Layer extends beyond canvas bounds',
          layerId: layer.id,
          suggestion: 'This may be intentional for bleed areas',
        });
      }
    }

    // Validate text updates
    if (layer.type === 'text' && updates.text) {
      if (updates.text.fontSize !== undefined && updates.text.fontSize < 1) {
        errors.push({
          type: 'error',
          code: 'INVALID_FONT_SIZE',
          message: 'Font size must be at least 1',
          layerId: layer.id,
        });
      }
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  }

  private validateNewLayer(layer: Layer): EditValidationResult {
    const warnings: ValidationWarning[] = [];
    const errors: ValidationError[] = [];

    // Validate basic properties
    if (!layer.id) {
      errors.push({
        type: 'error',
        code: 'MISSING_ID',
        message: 'Layer must have an ID',
      });
    }

    if (!layer.type) {
      errors.push({
        type: 'error',
        code: 'MISSING_TYPE',
        message: 'Layer must have a type',
      });
    }

    if (!layer.rect) {
      errors.push({
        type: 'error',
        code: 'MISSING_RECT',
        message: 'Layer must have a rect',
      });
    } else {
      if (layer.rect.w < 1 || layer.rect.h < 1) {
        errors.push({
          type: 'error',
          code: 'INVALID_DIMENSIONS',
          message: 'Width and height must be at least 1px',
        });
      }
    }

    // Type-specific validation
    if (layer.type === 'text' && !layer.text) {
      errors.push({
        type: 'error',
        code: 'MISSING_TEXT_CONFIG',
        message: 'Text layer must have text configuration',
      });
    }

    if (layer.type === 'image' && !layer.image) {
      errors.push({
        type: 'error',
        code: 'MISSING_IMAGE_CONFIG',
        message: 'Image layer must have image configuration',
      });
    }

    if (layer.type === 'shape' && !layer.shape) {
      errors.push({
        type: 'error',
        code: 'MISSING_SHAPE_CONFIG',
        message: 'Shape layer must have shape configuration',
      });
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Create a new HITL editing session
 */
export function createEditSession(template: TemplateDSL, sessionId?: string): HITLEditor {
  return new HITLEditor(template, sessionId);
}

/**
 * Load an existing editing session
 */
export function loadEditSession(session: EditSession): HITLEditor {
  const editor = new HITLEditor(session.originalTemplate, session.sessionId);
  // Restore session state
  (editor as any).session = session;
  return editor;
}
