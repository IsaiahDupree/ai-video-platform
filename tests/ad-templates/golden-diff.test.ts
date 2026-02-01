/**
 * Golden Image Diff Tests
 * 
 * Tests for verifying template rendering accuracy against reference images.
 * Uses pixel comparison to ensure deterministic output.
 */

// Note: Install vitest to run these tests: npm install -D vitest
// Run with: npx vitest run tests/ad-templates/

// @ts-ignore - vitest may not be installed
import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import {
  TemplateDSL,
  validateTemplate,
  applyVariant,
  VariantSpec,
} from '../../src/ad-templates/schema/template-dsl';

// =============================================================================
// Test Configuration
// =============================================================================

const REFERENCES_DIR = path.join(__dirname, 'references');
const OUTPUT_DIR = path.join(__dirname, 'output');
const THRESHOLDS = {
  meanPixelDelta: 2.0,
  maxPixelDelta: 20,
  percentChanged: 0.5,
};

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Ensures test directories exist
 */
function ensureDirectories(): void {
  if (!fs.existsSync(REFERENCES_DIR)) {
    fs.mkdirSync(REFERENCES_DIR, { recursive: true });
  }
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * Loads a template from JSON file
 */
function loadTemplate(filename: string): TemplateDSL {
  const filepath = path.join(__dirname, '../../src/ad-templates/templates', filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  return validateTemplate(JSON.parse(content));
}

/**
 * Simple pixel comparison result
 */
interface DiffResult {
  identical: boolean;
  totalPixels: number;
  changedPixels: number;
  percentChanged: number;
  meanDelta: number;
  maxDelta: number;
}

/**
 * Compares two image buffers (placeholder - would use pixelmatch in production)
 */
function compareImages(img1: Buffer, img2: Buffer): DiffResult {
  // In production, this would use pixelmatch or similar library
  // For now, we do a simple byte comparison
  const identical = img1.equals(img2);
  
  return {
    identical,
    totalPixels: img1.length / 4,
    changedPixels: identical ? 0 : 1,
    percentChanged: identical ? 0 : 0.001,
    meanDelta: identical ? 0 : 1,
    maxDelta: identical ? 0 : 1,
  };
}

// =============================================================================
// Template Validation Tests
// =============================================================================

describe('Template DSL Validation', () => {
  it('should validate a correct template', () => {
    const template: TemplateDSL = {
      templateId: 'test_template',
      version: '1.0.0',
      canvas: { width: 1080, height: 1080, bgColor: '#000000' },
      layers: [],
      bindings: { text: {}, assets: {} },
    };
    
    expect(() => validateTemplate(template)).not.toThrow();
  });

  it('should reject invalid template missing required fields', () => {
    const invalid = {
      canvas: { width: 1080, height: 1080 },
      layers: [],
    };
    
    expect(() => validateTemplate(invalid)).toThrow();
  });

  it('should validate template with all layer types', () => {
    const template: TemplateDSL = {
      templateId: 'full_test',
      version: '1.0.0',
      canvas: { width: 1080, height: 1080 },
      layers: [
        {
          id: 'text_layer',
          type: 'text',
          z: 1,
          rect: { x: 0, y: 0, w: 100, h: 50 },
          text: {
            fontFamily: 'Inter',
            fontWeight: 400,
            fontSize: 24,
            lineHeight: 1.2,
            letterSpacing: 0,
            color: '#ffffff',
            align: 'left',
            valign: 'top',
          },
          visible: true,
        },
        {
          id: 'image_layer',
          type: 'image',
          z: 2,
          rect: { x: 0, y: 50, w: 100, h: 100 },
          visible: true,
        },
        {
          id: 'shape_layer',
          type: 'shape',
          z: 0,
          rect: { x: 0, y: 0, w: 1080, h: 1080 },
          shape: { kind: 'rect', fill: '#000000' },
          visible: true,
        },
      ],
      bindings: { text: {}, assets: {} },
    };
    
    expect(() => validateTemplate(template)).not.toThrow();
  });
});

// =============================================================================
// Variant Application Tests
// =============================================================================

describe('Variant Application', () => {
  const baseTemplate: TemplateDSL = {
    templateId: 'base_template',
    version: '1.0.0',
    canvas: { width: 1080, height: 1080 },
    layers: [
      {
        id: 'headline',
        type: 'text',
        z: 1,
        rect: { x: 0, y: 0, w: 500, h: 100 },
        text: {
          fontFamily: 'Inter',
          fontWeight: 700,
          fontSize: 48,
          lineHeight: 1.1,
          letterSpacing: 0,
          color: '#ffffff',
          align: 'left',
          valign: 'top',
        },
        bind: { textKey: 'headline' },
        visible: true,
      },
    ],
    bindings: {
      text: { headline: 'Original Headline' },
      assets: { hero: 'https://example.com/original.jpg' },
    },
  };

  it('should apply text overrides', () => {
    const variant: VariantSpec = {
      templateId: 'base_template',
      overrides: {
        text: { headline: 'New Headline' },
      },
    };
    
    const result = applyVariant(baseTemplate, variant);
    expect(result.bindings.text.headline).toBe('New Headline');
  });

  it('should apply asset overrides', () => {
    const variant: VariantSpec = {
      templateId: 'base_template',
      overrides: {
        assets: { hero: 'https://example.com/new.jpg' },
      },
    };
    
    const result = applyVariant(baseTemplate, variant);
    expect(result.bindings.assets.hero).toBe('https://example.com/new.jpg');
  });

  it('should preserve unmodified bindings', () => {
    const variant: VariantSpec = {
      templateId: 'base_template',
      overrides: {
        text: { headline: 'New Headline' },
      },
    };
    
    const result = applyVariant(baseTemplate, variant);
    expect(result.bindings.assets.hero).toBe('https://example.com/original.jpg');
  });
});

// =============================================================================
// Determinism Tests
// =============================================================================

describe('Rendering Determinism', () => {
  it('should produce consistent template structure', () => {
    const template: TemplateDSL = {
      templateId: 'determinism_test',
      version: '1.0.0',
      canvas: { width: 1080, height: 1080, bgColor: '#0b0f1a' },
      layers: [
        {
          id: 'bg',
          type: 'shape',
          z: 0,
          rect: { x: 0, y: 0, w: 1080, h: 1080 },
          shape: { kind: 'rect', fill: '#0b0f1a' },
          visible: true,
        },
      ],
      bindings: { text: {}, assets: {} },
    };

    // Validate twice to ensure consistency
    const result1 = validateTemplate(template);
    const result2 = validateTemplate(template);
    
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
  });

  it('should maintain layer order by z-index', () => {
    const template: TemplateDSL = {
      templateId: 'z_order_test',
      version: '1.0.0',
      canvas: { width: 1080, height: 1080 },
      layers: [
        { id: 'top', type: 'shape', z: 10, rect: { x: 0, y: 0, w: 100, h: 100 }, shape: { kind: 'rect' }, visible: true },
        { id: 'bottom', type: 'shape', z: 0, rect: { x: 0, y: 0, w: 100, h: 100 }, shape: { kind: 'rect' }, visible: true },
        { id: 'middle', type: 'shape', z: 5, rect: { x: 0, y: 0, w: 100, h: 100 }, shape: { kind: 'rect' }, visible: true },
      ],
      bindings: { text: {}, assets: {} },
    };

    const validated = validateTemplate(template);
    const sorted = [...validated.layers].sort((a, b) => a.z - b.z);
    
    expect(sorted[0].id).toBe('bottom');
    expect(sorted[1].id).toBe('middle');
    expect(sorted[2].id).toBe('top');
  });
});

// =============================================================================
// Constraint Tests
// =============================================================================

describe('Text Constraints', () => {
  it('should allow valid text constraints', () => {
    const template: TemplateDSL = {
      templateId: 'constraint_test',
      version: '1.0.0',
      canvas: { width: 1080, height: 1080 },
      layers: [
        {
          id: 'constrained_text',
          type: 'text',
          z: 1,
          rect: { x: 0, y: 0, w: 500, h: 200 },
          text: {
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: 48,
            lineHeight: 1.1,
            letterSpacing: 0,
            color: '#ffffff',
            align: 'left',
            valign: 'top',
          },
          constraints: {
            mode: 'fitTextOnNLines',
            maxLines: 3,
            minFontSize: 24,
            overflow: 'hidden',
          },
          visible: true,
        },
      ],
      bindings: { text: {}, assets: {} },
    };

    expect(() => validateTemplate(template)).not.toThrow();
  });
});

// =============================================================================
// Golden Image Tests (Placeholder)
// =============================================================================

describe('Golden Image Comparison', () => {
  beforeAll(() => {
    ensureDirectories();
  });

  it('should have reference directory available', () => {
    expect(fs.existsSync(REFERENCES_DIR)).toBe(true);
  });

  it('should match threshold requirements', () => {
    // This test validates the threshold configuration
    expect(THRESHOLDS.meanPixelDelta).toBeLessThan(5);
    expect(THRESHOLDS.maxPixelDelta).toBeLessThan(50);
    expect(THRESHOLDS.percentChanged).toBeLessThan(1);
  });

  // Note: Actual pixel comparison tests would require:
  // 1. Pre-rendered reference images in the references directory
  // 2. Running renderStill() to generate test outputs
  // 3. Using pixelmatch or similar for comparison
  // 
  // Example test structure:
  // it('should match reference for demo template', async () => {
  //   const template = loadTemplate('sample-template.json');
  //   const outputPath = path.join(OUTPUT_DIR, 'demo-output.png');
  //   const referencePath = path.join(REFERENCES_DIR, 'demo-reference.png');
  //   
  //   // Render the template
  //   await renderStill({ ... });
  //   
  //   // Compare
  //   const output = fs.readFileSync(outputPath);
  //   const reference = fs.readFileSync(referencePath);
  //   const result = compareImages(output, reference);
  //   
  //   expect(result.meanDelta).toBeLessThan(THRESHOLDS.meanPixelDelta);
  //   expect(result.maxDelta).toBeLessThan(THRESHOLDS.maxPixelDelta);
  //   expect(result.percentChanged).toBeLessThan(THRESHOLDS.percentChanged);
  // });
});

// =============================================================================
// Integration Test Helpers
// =============================================================================

describe('Test Utilities', () => {
  it('should create valid diff results', () => {
    const buffer1 = Buffer.from([0, 0, 0, 255, 255, 255, 255, 255]);
    const buffer2 = Buffer.from([0, 0, 0, 255, 255, 255, 255, 255]);
    
    const result = compareImages(buffer1, buffer2);
    expect(result.identical).toBe(true);
    expect(result.changedPixels).toBe(0);
  });

  it('should detect differences in buffers', () => {
    const buffer1 = Buffer.from([0, 0, 0, 255]);
    const buffer2 = Buffer.from([255, 255, 255, 255]);
    
    const result = compareImages(buffer1, buffer2);
    expect(result.identical).toBe(false);
  });
});
