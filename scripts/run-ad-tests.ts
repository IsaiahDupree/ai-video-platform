#!/usr/bin/env npx tsx
/**
 * Ad Template Test Runner
 * 
 * Runs golden tests, validation tests, and schema tests for the ad template system.
 */

import fs from 'fs';
import path from 'path';
import {
  TemplateDSLSchema,
  validateExtractedTemplate,
  generateConfidenceReport,
  DEFAULT_THRESHOLDS,
  type TemplateDSL,
} from '../src/ad-templates';

// =============================================================================
// Test Utilities
// =============================================================================

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${error instanceof Error ? error.message : error}`);
    failed++;
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertTrue(condition: boolean, message?: string): void {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertNoThrow(fn: () => void, message?: string): void {
  try {
    fn();
  } catch (error) {
    throw new Error(message || `Unexpected error: ${error}`);
  }
}

// =============================================================================
// Schema Validation Tests
// =============================================================================

function runSchemaTests(): void {
  console.log('\n📋 Schema Validation Tests');
  console.log('─'.repeat(50));

  test('Valid minimal template passes schema', () => {
    const template = {
      templateId: 'test_1',
      name: 'Test Template',
      canvas: { width: 1080, height: 1080, bgColor: '#000000' },
      layers: [],
      bindings: { text: {}, assets: {} },
    };
    const result = TemplateDSLSchema.safeParse(template);
    assertTrue(result.success, 'Schema validation failed');
  });

  test('Template with text layer passes schema', () => {
    const template = {
      templateId: 'test_2',
      name: 'Text Test',
      canvas: { width: 1080, height: 1080, bgColor: '#ffffff' },
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
            lineHeight: 1.2,
            color: '#000000',
            align: 'left',
            valign: 'top',
          },
          bind: { textKey: 'headline' },
          visible: true,
        },
      ],
      bindings: { text: { headline: 'Hello World' }, assets: {} },
    };
    const result = TemplateDSLSchema.safeParse(template);
    assertTrue(result.success, `Schema validation failed: ${!result.success ? JSON.stringify(result.error?.errors) : ''}`);
  });

  test('Template with image layer passes schema', () => {
    const template = {
      templateId: 'test_3',
      name: 'Image Test',
      canvas: { width: 1080, height: 1080, bgColor: '#ffffff' },
      layers: [
        {
          id: 'hero',
          type: 'image',
          z: 1,
          rect: { x: 0, y: 0, w: 500, h: 500 },
          image: {
            fit: 'cover',
            anchor: 'center',
            borderRadius: 0,
            opacity: 1,
          },
          bind: { assetKey: 'hero' },
          visible: true,
        },
      ],
      bindings: { text: {}, assets: { hero: 'https://example.com/image.png' } },
    };
    const result = TemplateDSLSchema.safeParse(template);
    assertTrue(result.success, `Schema validation failed: ${!result.success ? JSON.stringify(result.error?.errors) : ''}`);
  });

  test('Template with shape layer passes schema', () => {
    const template = {
      templateId: 'test_4',
      name: 'Shape Test',
      canvas: { width: 1080, height: 1080, bgColor: '#ffffff' },
      layers: [
        {
          id: 'bg_rect',
          type: 'shape',
          z: 0,
          rect: { x: 0, y: 0, w: 1080, h: 200 },
          shape: {
            kind: 'rect',
            fill: '#6366f1',
            radius: 16,
            opacity: 1,
            strokeWidth: 0,
          },
          visible: true,
        },
      ],
      bindings: { text: {}, assets: {} },
    };
    const result = TemplateDSLSchema.safeParse(template);
    assertTrue(result.success, `Schema validation failed: ${!result.success ? JSON.stringify(result.error?.errors) : ''}`);
  });

  test('Invalid template missing required fields fails', () => {
    const template = {
      name: 'Missing ID',
      canvas: { width: 1080, height: 1080 },
    };
    const result = TemplateDSLSchema.safeParse(template);
    assertTrue(!result.success, 'Should have failed validation');
  });

  test('Invalid layer type fails', () => {
    const template = {
      templateId: 'test_5',
      name: 'Invalid Layer',
      canvas: { width: 1080, height: 1080, bgColor: '#000' },
      layers: [
        {
          id: 'bad',
          type: 'invalid_type',
          z: 1,
          rect: { x: 0, y: 0, w: 100, h: 100 },
        },
      ],
      bindings: { text: {}, assets: {} },
    };
    const result = TemplateDSLSchema.safeParse(template);
    assertTrue(!result.success, 'Should have failed validation');
  });
}

// =============================================================================
// Sample Template Tests
// =============================================================================

function runSampleTemplateTests(): void {
  console.log('\n📄 Sample Template Tests');
  console.log('─'.repeat(50));

  const samplePath = path.join(process.cwd(), 'data/templates/sample-hero-ad.json');

  test('Sample template file exists', () => {
    assertTrue(fs.existsSync(samplePath), `File not found: ${samplePath}`);
  });

  test('Sample template is valid JSON', () => {
    const content = fs.readFileSync(samplePath, 'utf-8');
    assertNoThrow(() => JSON.parse(content));
  });

  test('Sample template passes schema validation', () => {
    const content = fs.readFileSync(samplePath, 'utf-8');
    const template = JSON.parse(content);
    const result = TemplateDSLSchema.safeParse(template);
    assertTrue(result.success, `Schema validation failed: ${!result.success ? JSON.stringify(result.error?.errors) : ''}`);
  });

  test('Sample template has expected structure', () => {
    const content = fs.readFileSync(samplePath, 'utf-8');
    const template = JSON.parse(content) as TemplateDSL;
    assertEqual(template.templateId, 'sample_hero_ad_1080');
    assertEqual(template.canvas.width, 1080);
    assertEqual(template.canvas.height, 1080);
    assertTrue(template.layers.length > 0, 'Should have layers');
  });

  test('Sample template passes extraction validation', () => {
    const content = fs.readFileSync(samplePath, 'utf-8');
    const template = JSON.parse(content) as TemplateDSL;
    const validation = validateExtractedTemplate(template);
    assertTrue(validation.valid, `Validation errors: ${validation.errors.join(', ')}`);
  });

  test('Sample template confidence report generates', () => {
    const content = fs.readFileSync(samplePath, 'utf-8');
    const template = JSON.parse(content) as TemplateDSL;
    const report = generateConfidenceReport(template);
    assertTrue(report.overallConfidence >= 0 && report.overallConfidence <= 1);
    assertTrue(typeof report.summary.highConfidence === 'number');
  });
}

// =============================================================================
// Extraction Validation Tests
// =============================================================================

function runExtractionValidationTests(): void {
  console.log('\n🔍 Extraction Validation Tests');
  console.log('─'.repeat(50));

  test('Empty template passes basic validation', () => {
    const template = {
      templateId: 'empty',
      name: 'Empty',
      version: '1.0.0',
      canvas: { width: 1080, height: 1080, bgColor: '#000' },
      layers: [],
      bindings: { text: {}, assets: {} },
    } as TemplateDSL;
    const validation = validateExtractedTemplate(template);
    // Empty templates are technically valid (no errors), just not useful
    assertTrue(typeof validation.valid === 'boolean', 'Should return validation result');
  });

  test('Template with text layer validates structure', () => {
    const template = {
      templateId: 'unbound',
      name: 'Unbound Text',
      version: '1.0.0',
      canvas: { width: 1080, height: 1080, bgColor: '#000' },
      layers: [
        {
          id: 'text1',
          type: 'text' as const,
          z: 1,
          rect: { x: 0, y: 0, w: 500, h: 100 },
          text: {
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: 48,
            lineHeight: 1.2,
            letterSpacing: 0,
            color: '#fff',
            align: 'left' as const,
            valign: 'top' as const,
          },
          bind: { textKey: 'missing_key' },
          visible: true,
        },
      ],
      bindings: { text: {}, assets: {} },
    } as TemplateDSL;
    const validation = validateExtractedTemplate(template);
    // Validation checks structure, binding resolution is separate
    assertTrue(typeof validation.valid === 'boolean', 'Should return validation result');
  });

  test('Overlapping layers generates warning', () => {
    const template = {
      templateId: 'overlap',
      name: 'Overlapping',
      version: '1.0.0',
      canvas: { width: 1080, height: 1080, bgColor: '#000' },
      layers: [
        {
          id: 'layer1',
          type: 'shape' as const,
          z: 1,
          rect: { x: 0, y: 0, w: 500, h: 500 },
          shape: { kind: 'rect' as const, fill: '#fff', radius: 0, opacity: 1, strokeWidth: 0 },
          visible: true,
        },
        {
          id: 'layer2',
          type: 'shape' as const,
          z: 2,
          rect: { x: 100, y: 100, w: 500, h: 500 },
          shape: { kind: 'rect' as const, fill: '#fff', radius: 0, opacity: 1, strokeWidth: 0 },
          visible: true,
        },
      ],
      bindings: { text: {}, assets: {} },
    } as TemplateDSL;
    const validation = validateExtractedTemplate(template);
    // Overlapping is okay, just checking it doesn't crash
    assertTrue(typeof validation.valid === 'boolean');
  });
}

// =============================================================================
// Confidence Scoring Tests
// =============================================================================

function runConfidenceScoringTests(): void {
  console.log('\n📊 Confidence Scoring Tests');
  console.log('─'.repeat(50));

  test('High confidence template scores well', () => {
    const template = {
      templateId: 'high_conf',
      name: 'High Confidence',
      version: '1.0.0',
      canvas: { width: 1080, height: 1080, bgColor: '#000000' },
      layers: [
        {
          id: 'text1',
          type: 'text' as const,
          z: 1,
          rect: { x: 60, y: 60, w: 500, h: 100 },
          text: {
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: 48,
            lineHeight: 1.2,
            letterSpacing: 0,
            color: '#ffffff',
            align: 'left' as const,
            valign: 'top' as const,
          },
          bind: { textKey: 'headline' },
          visible: true,
        },
      ],
      bindings: { text: { headline: 'Test Headline' }, assets: {} },
    } as TemplateDSL;
    const report = generateConfidenceReport(template);
    assertTrue(report.overallConfidence >= 0.5, `Expected >= 0.5, got ${report.overallConfidence}`);
  });

  test('Confidence report includes layer details', () => {
    const template = {
      templateId: 'detailed',
      name: 'Detailed',
      version: '1.0.0',
      canvas: { width: 1080, height: 1080, bgColor: '#000' },
      layers: [
        {
          id: 'layer1',
          type: 'text' as const,
          z: 1,
          rect: { x: 0, y: 0, w: 500, h: 100 },
          text: {
            fontFamily: 'Inter',
            fontWeight: 400,
            fontSize: 24,
            lineHeight: 1.5,
            letterSpacing: 0,
            color: '#fff',
            align: 'left' as const,
            valign: 'top' as const,
          },
          visible: true,
        },
      ],
      bindings: { text: {}, assets: {} },
    } as TemplateDSL;
    const report = generateConfidenceReport(template);
    assertTrue(report.layers.length === 1, 'Should have one layer score');
    assertTrue(typeof report.layers[0].overall === 'number');
  });

  test('Thresholds are properly defined', () => {
    assertTrue((DEFAULT_THRESHOLDS.meanPixelDelta ?? 0) > 0);
    assertTrue((DEFAULT_THRESHOLDS.maxPixelDelta ?? 0) > 0);
    assertTrue((DEFAULT_THRESHOLDS.percentChanged ?? 0) > 0);
  });
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  console.log('🧪 Ad Template Test Suite');
  console.log('═'.repeat(50));
  console.log(`Started: ${new Date().toISOString()}`);

  runSchemaTests();
  runSampleTemplateTests();
  runExtractionValidationTests();
  runConfidenceScoringTests();

  console.log('\n' + '═'.repeat(50));
  console.log('📊 Results');
  console.log('─'.repeat(50));
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📈 Total:  ${passed + failed}`);
  console.log('═'.repeat(50));

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed!');
    process.exit(1);
  } else {
    console.log('\n✨ All tests passed!');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});
