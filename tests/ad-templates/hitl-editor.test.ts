/**
 * HITL Editor Tests
 *
 * Test suite for the Human-in-the-Loop template editor
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createEditSession, HITLEditor } from '../../src/ad-templates/editing/hitl-editor';
import type { TemplateDSL, TextLayer } from '../../src/ad-templates/schema/template-dsl';

// Test template
const createTestTemplate = (): TemplateDSL => ({
  templateId: 'test_template',
  canvas: { width: 1080, height: 1080, bgColor: '#ffffff' },
  layers: [
    {
      id: 'headline',
      type: 'text',
      z: 10,
      rect: { x: 100, y: 100, w: 400, h: 100 },
      text: {
        fontFamily: 'Inter',
        fontWeight: 700,
        fontSize: 48,
        lineHeight: 1.2,
        color: '#000000',
        align: 'left',
        valign: 'top',
      },
      bind: { textKey: 'headline' },
    },
    {
      id: 'image',
      type: 'image',
      z: 5,
      rect: { x: 0, y: 0, w: 1080, h: 1080 },
      image: { fit: 'cover', anchor: 'center' },
      bind: { assetKey: 'hero' },
    },
  ],
  bindings: {
    text: { headline: 'Test Headline' },
    assets: { hero: 'https://example.com/image.jpg' },
  },
  meta: {
    source: { type: 'manual' },
    extraction: { confidence: 1.0 },
  },
});

describe('HITLEditor', () => {
  let editor: HITLEditor;
  let template: TemplateDSL;

  beforeEach(() => {
    template = createTestTemplate();
    editor = createEditSession(template);
  });

  describe('Session Management', () => {
    it('should create a new session', () => {
      const session = editor.getSession();
      expect(session.sessionId).toBeDefined();
      expect(session.templateId).toBe('test_template');
      expect(session.operations).toHaveLength(0);
    });

    it('should track original and current templates separately', () => {
      const original = editor.getOriginalTemplate();
      const current = editor.getCurrentTemplate();

      expect(original).toEqual(current);
      expect(original).not.toBe(current); // Different objects
    });

    it('should detect unsaved changes', () => {
      expect(editor.hasUnsavedChanges()).toBe(false);

      editor.updateLayer({
        layerId: 'headline',
        updates: { rect: { x: 150 } },
      });

      expect(editor.hasUnsavedChanges()).toBe(true);
    });
  });

  describe('Layer Operations', () => {
    it('should get layer by ID', () => {
      const layer = editor.getLayer('headline');
      expect(layer).toBeDefined();
      expect(layer?.id).toBe('headline');
      expect(layer?.type).toBe('text');
    });

    it('should get all layers', () => {
      const layers = editor.getAllLayers();
      expect(layers).toHaveLength(2);
    });

    it('should get layers by type', () => {
      const textLayers = editor.getLayersByType('text');
      expect(textLayers).toHaveLength(1);
      expect(textLayers[0].id).toBe('headline');

      const imageLayers = editor.getLayersByType('image');
      expect(imageLayers).toHaveLength(1);
      expect(imageLayers[0].id).toBe('image');
    });

    it('should update layer properties', () => {
      const result = editor.updateLayer({
        layerId: 'headline',
        updates: {
          rect: { x: 150, y: 200 },
          text: { fontSize: 64 },
        },
      });

      expect(result.valid).toBe(true);

      const layer = editor.getLayer('headline') as TextLayer;
      expect(layer.rect.x).toBe(150);
      expect(layer.rect.y).toBe(200);
      expect(layer.text.fontSize).toBe(64);
    });

    it('should reject updates to non-existent layers', () => {
      const result = editor.updateLayer({
        layerId: 'nonexistent',
        updates: { rect: { x: 0 } },
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('LAYER_NOT_FOUND');
    });

    it('should delete layer', () => {
      const result = editor.deleteLayer('headline');
      expect(result.valid).toBe(true);

      const layer = editor.getLayer('headline');
      expect(layer).toBeUndefined();
      expect(editor.getAllLayers()).toHaveLength(1);
    });

    it('should create new layer', () => {
      const newLayer: TextLayer = {
        id: 'subtitle',
        type: 'text',
        z: 15,
        rect: { x: 100, y: 220, w: 400, h: 50 },
        text: {
          fontFamily: 'Inter',
          fontWeight: 400,
          fontSize: 24,
          lineHeight: 1.4,
          color: '#666666',
          align: 'left',
          valign: 'top',
        },
      };

      const result = editor.createLayer(newLayer);
      expect(result.valid).toBe(true);

      const layer = editor.getLayer('subtitle');
      expect(layer).toBeDefined();
      expect(editor.getAllLayers()).toHaveLength(3);
    });

    it('should reject duplicate layer IDs', () => {
      const duplicateLayer: TextLayer = {
        id: 'headline', // Already exists
        type: 'text',
        z: 20,
        rect: { x: 0, y: 0, w: 100, h: 100 },
        text: {
          fontFamily: 'Inter',
          fontWeight: 400,
          fontSize: 24,
          lineHeight: 1.0,
          color: '#000000',
          align: 'left',
          valign: 'top',
        },
      };

      const result = editor.createLayer(duplicateLayer);
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('DUPLICATE_ID');
    });

    it('should reorder layer', () => {
      const result = editor.reorderLayer('headline', 50);
      expect(result.valid).toBe(true);

      const layer = editor.getLayer('headline');
      expect(layer?.z).toBe(50);
    });
  });

  describe('Undo/Redo', () => {
    it('should support undo', () => {
      // Make change
      editor.updateLayer({
        layerId: 'headline',
        updates: { rect: { x: 200 } },
      });

      let layer = editor.getLayer('headline');
      expect(layer?.rect.x).toBe(200);

      // Undo
      expect(editor.canUndo()).toBe(true);
      editor.undo();

      layer = editor.getLayer('headline');
      expect(layer?.rect.x).toBe(100); // Original value
    });

    it('should support redo', () => {
      // Make change and undo
      editor.updateLayer({
        layerId: 'headline',
        updates: { rect: { x: 200 } },
      });
      editor.undo();

      // Redo
      expect(editor.canRedo()).toBe(true);
      editor.redo();

      const layer = editor.getLayer('headline');
      expect(layer?.rect.x).toBe(200);
    });

    it('should track operation history', () => {
      editor.updateLayer({
        layerId: 'headline',
        updates: { rect: { x: 200 } },
      });
      editor.updateLayer({
        layerId: 'headline',
        updates: { rect: { y: 300 } },
      });

      const history = editor.getOperationHistory();
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe('update');
      expect(history[1].type).toBe('update');
    });

    it('should truncate history on new operations after undo', () => {
      // Make 2 changes
      editor.updateLayer({
        layerId: 'headline',
        updates: { rect: { x: 200 } },
      });
      editor.updateLayer({
        layerId: 'headline',
        updates: { rect: { y: 300 } },
      });

      // Undo once
      editor.undo();

      // Make new change
      editor.updateLayer({
        layerId: 'headline',
        updates: { rect: { x: 250 } },
      });

      const history = editor.getOperationHistory();
      expect(history).toHaveLength(2); // First change + new change
      expect(editor.canRedo()).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should validate template successfully', () => {
      const validation = editor.validateTemplate();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid dimensions', () => {
      editor.updateLayer({
        layerId: 'headline',
        updates: { rect: { w: 0, h: 0 } },
      });

      const validation = editor.validateTemplate();
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.code === 'INVALID_DIMENSIONS')).toBe(true);
    });

    it('should warn about out of bounds layers', () => {
      editor.updateLayer({
        layerId: 'headline',
        updates: { rect: { x: 1000, y: 1000 } },
      });

      const validation = editor.validateTemplate();
      expect(validation.warnings.some((w) => w.code === 'OUT_OF_BOUNDS')).toBe(true);
    });

    it('should reject invalid font size', () => {
      const result = editor.updateLayer({
        layerId: 'headline',
        updates: { text: { fontSize: 0 } },
      });

      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_FONT_SIZE');
    });
  });

  describe('Diff Tracking', () => {
    it('should track added layers', () => {
      const newLayer: TextLayer = {
        id: 'new_layer',
        type: 'text',
        z: 20,
        rect: { x: 0, y: 0, w: 100, h: 100 },
        text: {
          fontFamily: 'Inter',
          fontWeight: 400,
          fontSize: 24,
          lineHeight: 1.0,
          color: '#000000',
          align: 'left',
          valign: 'top',
        },
      };

      editor.createLayer(newLayer);

      const diff = editor.getDiff();
      expect(diff.added).toHaveLength(1);
      expect(diff.added[0].id).toBe('new_layer');
    });

    it('should track modified layers', () => {
      editor.updateLayer({
        layerId: 'headline',
        updates: { rect: { x: 200 } },
      });

      const diff = editor.getDiff();
      expect(diff.modified).toHaveLength(1);
      expect(diff.modified[0].layerId).toBe('headline');
      expect(diff.modified[0].before.rect?.x).toBe(100);
      expect(diff.modified[0].after.rect?.x).toBe(200);
    });

    it('should track deleted layers', () => {
      editor.deleteLayer('headline');

      const diff = editor.getDiff();
      expect(diff.deleted).toHaveLength(1);
      expect(diff.deleted[0].id).toBe('headline');
    });

    it('should show no changes initially', () => {
      const diff = editor.getDiff();
      expect(diff.added).toHaveLength(0);
      expect(diff.modified).toHaveLength(0);
      expect(diff.deleted).toHaveLength(0);
    });
  });

  describe('Export', () => {
    it('should export edited template', () => {
      editor.updateLayer({
        layerId: 'headline',
        updates: { rect: { x: 200 } },
      });

      const exported = editor.export();
      expect(exported.layers[1].rect.x).toBe(200); // Changed value
      expect(exported).not.toBe(editor.getCurrentTemplate()); // New object
    });

    it('should not modify original template', () => {
      editor.updateLayer({
        layerId: 'headline',
        updates: { rect: { x: 200 } },
      });

      const original = editor.getOriginalTemplate();
      expect(original.layers[1].rect.x).toBe(100); // Unchanged
    });
  });

  describe('Confidence Report', () => {
    it('should generate confidence report', () => {
      const report = editor.getConfidenceReport();
      expect(report).toBeDefined();
      expect(report.templateId).toBe('test_template');
      expect(report.overallConfidence).toBeGreaterThan(0);
      expect(report.layers).toHaveLength(2);
    });

    it('should update confidence after edits', () => {
      const before = editor.getConfidenceReport();

      // Make problematic edit
      editor.updateLayer({
        layerId: 'headline',
        updates: { rect: { w: 5, h: 5 } }, // Very small
      });

      const after = editor.getConfidenceReport();
      expect(after.overallConfidence).toBeLessThan(before.overallConfidence);
    });
  });
});
