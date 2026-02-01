/**
 * Golden Test Harness
 * 
 * Tests template recreation accuracy by comparing rendered output
 * against reference images using pixel-diff algorithms.
 */

import type { TemplateDSL } from '../schema/template-dsl';

// =============================================================================
// Types
// =============================================================================

export interface GoldenTestConfig {
  templateId: string;
  template: TemplateDSL;
  referencePath: string;
  outputPath?: string;
  thresholds?: DiffThresholds;
}

export interface DiffThresholds {
  meanPixelDelta?: number;
  maxPixelDelta?: number;
  percentChanged?: number;
}

export interface PixelDiffResult {
  passed: boolean;
  meanDelta: number;
  maxDelta: number;
  percentChanged: number;
  diffPixels: number;
  totalPixels: number;
  diffImagePath?: string;
}

export interface GoldenTestResult {
  templateId: string;
  passed: boolean;
  diffResult?: PixelDiffResult;
  renderTime?: number;
  error?: string;
  warnings?: string[];
}

export interface TestSuiteResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: GoldenTestResult[];
  executionTime: number;
}

// =============================================================================
// Default Thresholds
// =============================================================================

export const DEFAULT_THRESHOLDS: DiffThresholds = {
  meanPixelDelta: 2.0,
  maxPixelDelta: 20,
  percentChanged: 0.5,
};

export const STRICT_THRESHOLDS: DiffThresholds = {
  meanPixelDelta: 0.5,
  maxPixelDelta: 5,
  percentChanged: 0.1,
};

export const LENIENT_THRESHOLDS: DiffThresholds = {
  meanPixelDelta: 5.0,
  maxPixelDelta: 50,
  percentChanged: 2.0,
};

// =============================================================================
// Pixel Diff Implementation
// =============================================================================

/**
 * Simple pixel diff using Canvas API (browser environment)
 * For production, use pixelmatch or resemble.js
 */
export async function compareImages(
  imagePath1: string,
  imagePath2: string,
  outputDiffPath?: string
): Promise<PixelDiffResult> {
  // In browser environment, load images and compare
  if (typeof document !== 'undefined') {
    return compareImagesInBrowser(imagePath1, imagePath2, outputDiffPath);
  }
  
  // In Node environment, use external library
  return compareImagesInNode(imagePath1, imagePath2, outputDiffPath);
}

async function compareImagesInBrowser(
  imagePath1: string,
  imagePath2: string,
  outputDiffPath?: string
): Promise<PixelDiffResult> {
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  try {
    const [img1, img2] = await Promise.all([loadImage(imagePath1), loadImage(imagePath2)]);

    // Ensure same dimensions
    if (img1.width !== img2.width || img1.height !== img2.height) {
      return {
        passed: false,
        meanDelta: 255,
        maxDelta: 255,
        percentChanged: 100,
        diffPixels: img1.width * img1.height,
        totalPixels: img1.width * img1.height,
      };
    }

    const canvas1 = document.createElement('canvas');
    const canvas2 = document.createElement('canvas');
    canvas1.width = canvas2.width = img1.width;
    canvas1.height = canvas2.height = img1.height;

    const ctx1 = canvas1.getContext('2d')!;
    const ctx2 = canvas2.getContext('2d')!;
    ctx1.drawImage(img1, 0, 0);
    ctx2.drawImage(img2, 0, 0);

    const data1 = ctx1.getImageData(0, 0, img1.width, img1.height).data;
    const data2 = ctx2.getImageData(0, 0, img2.width, img2.height).data;

    let totalDelta = 0;
    let maxDelta = 0;
    let diffPixels = 0;
    const totalPixels = img1.width * img1.height;

    for (let i = 0; i < data1.length; i += 4) {
      const r = Math.abs(data1[i] - data2[i]);
      const g = Math.abs(data1[i + 1] - data2[i + 1]);
      const b = Math.abs(data1[i + 2] - data2[i + 2]);
      const pixelDelta = (r + g + b) / 3;

      totalDelta += pixelDelta;
      maxDelta = Math.max(maxDelta, pixelDelta);
      if (pixelDelta > 0) diffPixels++;
    }

    const meanDelta = totalDelta / totalPixels;
    const percentChanged = (diffPixels / totalPixels) * 100;

    return {
      passed: true, // Will be evaluated against thresholds
      meanDelta,
      maxDelta,
      percentChanged,
      diffPixels,
      totalPixels,
    };
  } catch (error) {
    return {
      passed: false,
      meanDelta: 255,
      maxDelta: 255,
      percentChanged: 100,
      diffPixels: 0,
      totalPixels: 0,
    };
  }
}

async function compareImagesInNode(
  imagePath1: string,
  imagePath2: string,
  outputDiffPath?: string
): Promise<PixelDiffResult> {
  // This would use pixelmatch or similar in a real implementation
  // For now, return a placeholder that indicates Node implementation needed
  console.warn('Node-based image comparison not implemented. Use browser environment or install pixelmatch.');
  
  return {
    passed: false,
    meanDelta: 0,
    maxDelta: 0,
    percentChanged: 0,
    diffPixels: 0,
    totalPixels: 0,
  };
}

/**
 * Evaluates diff result against thresholds
 */
export function evaluateDiff(
  result: PixelDiffResult,
  thresholds: DiffThresholds = DEFAULT_THRESHOLDS
): boolean {
  const { meanPixelDelta = 2.0, maxPixelDelta = 20, percentChanged = 0.5 } = thresholds;

  return (
    result.meanDelta <= meanPixelDelta &&
    result.maxDelta <= maxPixelDelta &&
    result.percentChanged <= percentChanged
  );
}

// =============================================================================
// Test Execution
// =============================================================================

/**
 * Runs a single golden test
 */
export async function runGoldenTest(config: GoldenTestConfig): Promise<GoldenTestResult> {
  const { templateId, template, referencePath, outputPath, thresholds = DEFAULT_THRESHOLDS } = config;
  const warnings: string[] = [];
  const startTime = Date.now();

  try {
    // 1. Render the template to an image
    const renderedPath = outputPath || `/tmp/golden_test_${templateId}_${Date.now()}.png`;
    
    // In a real implementation, this would call renderStill()
    // For now, we'll simulate the render
    const renderResult = await renderTemplateToImage(template, renderedPath);
    
    if (!renderResult.success) {
      return {
        templateId,
        passed: false,
        error: renderResult.error || 'Render failed',
        renderTime: Date.now() - startTime,
      };
    }

    // 2. Compare with reference
    const diffResult = await compareImages(referencePath, renderedPath);
    
    // 3. Evaluate against thresholds
    const passed = evaluateDiff(diffResult, thresholds);
    diffResult.passed = passed;

    // Add warnings for near-threshold results
    if (diffResult.meanDelta > (thresholds.meanPixelDelta || 2.0) * 0.8) {
      warnings.push(`Mean pixel delta (${diffResult.meanDelta.toFixed(2)}) is close to threshold`);
    }
    if (diffResult.percentChanged > (thresholds.percentChanged || 0.5) * 0.8) {
      warnings.push(`Percent changed (${diffResult.percentChanged.toFixed(2)}%) is close to threshold`);
    }

    return {
      templateId,
      passed,
      diffResult,
      renderTime: Date.now() - startTime,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      templateId,
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      renderTime: Date.now() - startTime,
    };
  }
}

/**
 * Renders a template to an image file
 * This is a placeholder - real implementation would use Remotion's renderStill
 */
async function renderTemplateToImage(
  template: TemplateDSL,
  outputPath: string
): Promise<{ success: boolean; error?: string }> {
  // In a real implementation:
  // import { renderStill } from '@remotion/renderer';
  // await renderStill({
  //   composition: 'AdTemplateStill',
  //   output: outputPath,
  //   inputProps: { template },
  // });

  console.log(`[Golden Test] Would render template ${template.templateId} to ${outputPath}`);
  
  return { success: true };
}

/**
 * Runs a suite of golden tests
 */
export async function runGoldenTestSuite(
  configs: GoldenTestConfig[]
): Promise<TestSuiteResult> {
  const startTime = Date.now();
  const results: GoldenTestResult[] = [];

  for (const config of configs) {
    const result = await runGoldenTest(config);
    results.push(result);
  }

  const passedTests = results.filter((r) => r.passed).length;

  return {
    passed: passedTests === results.length,
    totalTests: results.length,
    passedTests,
    failedTests: results.length - passedTests,
    results,
    executionTime: Date.now() - startTime,
  };
}

// =============================================================================
// Determinism Tests
// =============================================================================

/**
 * Tests that rendering is deterministic (same input = same output)
 */
export async function testRenderDeterminism(
  template: TemplateDSL,
  iterations: number = 2
): Promise<{ passed: boolean; hashes: string[]; error?: string }> {
  const hashes: string[] = [];

  try {
    for (let i = 0; i < iterations; i++) {
      const outputPath = `/tmp/determinism_test_${template.templateId}_${i}.png`;
      const result = await renderTemplateToImage(template, outputPath);
      
      if (!result.success) {
        return { passed: false, hashes, error: result.error };
      }

      // In real implementation, compute hash of the output file
      const hash = `hash_${i}`; // Placeholder
      hashes.push(hash);
    }

    // Check all hashes are identical
    const allSame = hashes.every((h) => h === hashes[0]);
    
    return { passed: allSame, hashes };
  } catch (error) {
    return {
      passed: false,
      hashes,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// Layer Geometry Tests
// =============================================================================

export interface GeometryTestResult {
  passed: boolean;
  layerResults: Array<{
    layerId: string;
    passed: boolean;
    expected: { x: number; y: number; w: number; h: number };
    actual: { x: number; y: number; w: number; h: number };
    delta: { x: number; y: number; w: number; h: number };
  }>;
  tolerance: number;
}

/**
 * Tests that layer geometry matches expected values within tolerance
 */
export function testLayerGeometry(
  template: TemplateDSL,
  expected: Array<{ id: string; rect: { x: number; y: number; w: number; h: number } }>,
  tolerance: number = 1
): GeometryTestResult {
  const layerResults: GeometryTestResult['layerResults'] = [];

  for (const exp of expected) {
    const layer = template.layers.find((l) => l.id === exp.id);
    
    if (!layer) {
      layerResults.push({
        layerId: exp.id,
        passed: false,
        expected: exp.rect,
        actual: { x: 0, y: 0, w: 0, h: 0 },
        delta: { x: exp.rect.x, y: exp.rect.y, w: exp.rect.w, h: exp.rect.h },
      });
      continue;
    }

    const delta = {
      x: Math.abs(layer.rect.x - exp.rect.x),
      y: Math.abs(layer.rect.y - exp.rect.y),
      w: Math.abs(layer.rect.w - exp.rect.w),
      h: Math.abs(layer.rect.h - exp.rect.h),
    };

    const passed = delta.x <= tolerance && delta.y <= tolerance && 
                   delta.w <= tolerance && delta.h <= tolerance;

    layerResults.push({
      layerId: exp.id,
      passed,
      expected: exp.rect,
      actual: layer.rect,
      delta,
    });
  }

  return {
    passed: layerResults.every((r) => r.passed),
    layerResults,
    tolerance,
  };
}

// =============================================================================
// Test Report Generation
// =============================================================================

/**
 * Generates a human-readable test report
 */
export function generateTestReport(suiteResult: TestSuiteResult): string {
  const lines: string[] = [
    '═══════════════════════════════════════════════════════════════',
    '                    GOLDEN TEST REPORT',
    '═══════════════════════════════════════════════════════════════',
    '',
    `Status: ${suiteResult.passed ? '✅ PASSED' : '❌ FAILED'}`,
    `Total Tests: ${suiteResult.totalTests}`,
    `Passed: ${suiteResult.passedTests}`,
    `Failed: ${suiteResult.failedTests}`,
    `Execution Time: ${suiteResult.executionTime}ms`,
    '',
    '───────────────────────────────────────────────────────────────',
    '                      TEST RESULTS',
    '───────────────────────────────────────────────────────────────',
  ];

  for (const result of suiteResult.results) {
    lines.push('');
    lines.push(`Template: ${result.templateId}`);
    lines.push(`Status: ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
    
    if (result.diffResult) {
      lines.push(`  Mean Delta: ${result.diffResult.meanDelta.toFixed(3)}`);
      lines.push(`  Max Delta: ${result.diffResult.maxDelta.toFixed(3)}`);
      lines.push(`  % Changed: ${result.diffResult.percentChanged.toFixed(3)}%`);
    }
    
    if (result.error) {
      lines.push(`  Error: ${result.error}`);
    }
    
    if (result.warnings && result.warnings.length > 0) {
      lines.push(`  Warnings:`);
      for (const warning of result.warnings) {
        lines.push(`    ⚠️ ${warning}`);
      }
    }
    
    if (result.renderTime) {
      lines.push(`  Render Time: ${result.renderTime}ms`);
    }
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════════');

  return lines.join('\n');
}

export default {
  runGoldenTest,
  runGoldenTestSuite,
  testRenderDeterminism,
  testLayerGeometry,
  compareImages,
  evaluateDiff,
  generateTestReport,
  DEFAULT_THRESHOLDS,
  STRICT_THRESHOLDS,
  LENIENT_THRESHOLDS,
};
