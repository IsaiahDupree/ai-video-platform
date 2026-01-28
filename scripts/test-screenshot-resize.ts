/**
 * Screenshot Resize Service Test Suite
 * APP-003: Screenshot Size Generator
 *
 * Tests for batch screenshot resizing functionality
 */

import {
  resizeScreenshot,
  batchResize,
  validateResize,
  calculateResizeStatistics,
  generateResizeMetadata,
  resizeForAllIPhones,
  resizeForAllIPads,
  resizeForOrientation,
  resizeRecommended,
} from '../src/services/screenshotResize';
import {
  getAllScreenshotSizes,
  getScreenshotSizesByType,
  getScreenshotSizeById,
  getScreenshotSizes,
  getRecommendedSizes,
  calculateAspectRatio,
  findSimilarAspectRatios,
} from '../src/config/screenshotSizes';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

// Test counters
let passed = 0;
let failed = 0;

// Test helper
function test(name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.error(`❌ ${name}`);
      console.error(`   ${error instanceof Error ? error.message : String(error)}`);
      failed++;
    }
  };
}

// Create test image
async function createTestImage(
  width: number,
  height: number,
  format: 'png' | 'jpg' = 'png'
): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 100, g: 150, b: 200, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
}

// Test directories
const TEST_OUTPUT_DIR = path.join(process.cwd(), 'test-output', 'screenshots');

async function runTests() {
  console.log('🧪 Screenshot Resize Service Tests\n');
  console.log('='.repeat(50));

  // Clean up test output directory
  try {
    await fs.rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
  } catch (error) {
    // Ignore if doesn't exist
  }

  // === Configuration Tests ===
  console.log('\n📋 Configuration Tests\n');

  await test('getAllScreenshotSizes returns all sizes', () => {
    const sizes = getAllScreenshotSizes();
    if (sizes.length < 30) {
      throw new Error(`Expected at least 30 sizes, got ${sizes.length}`);
    }
  })();

  await test('getScreenshotSizesByType returns correct types', () => {
    const iPhoneSizes = getScreenshotSizesByType('iphone');
    const iPadSizes = getScreenshotSizesByType('ipad');
    const macSizes = getScreenshotSizesByType('mac');

    if (iPhoneSizes.length < 6) throw new Error('Not enough iPhone sizes');
    if (iPadSizes.length < 6) throw new Error('Not enough iPad sizes');
    if (macSizes.length < 5) throw new Error('Not enough Mac sizes');

    // Verify types
    if (!iPhoneSizes.every((s) => s.deviceType === 'iphone')) {
      throw new Error('iPhone sizes contain wrong device type');
    }
  })();

  await test('getScreenshotSizeById returns correct size', () => {
    const size = getScreenshotSizeById('iphone-17-pro-max-portrait');
    if (!size) throw new Error('Size not found');
    if (size.width !== 1260 || size.height !== 2736) {
      throw new Error('Incorrect dimensions');
    }
  })();

  await test('getScreenshotSizes with filters works', () => {
    const portraitSizes = getScreenshotSizes({
      orientations: ['portrait'],
      deviceTypes: ['iphone'],
    });

    if (!portraitSizes.every((s) => s.orientation === 'portrait')) {
      throw new Error('Filter failed: found non-portrait sizes');
    }

    if (!portraitSizes.every((s) => s.deviceType === 'iphone')) {
      throw new Error('Filter failed: found non-iPhone sizes');
    }
  })();

  await test('getRecommendedSizes returns minimum required set', () => {
    const recommended = getRecommendedSizes();
    if (recommended.length < 6) {
      throw new Error('Not enough recommended sizes');
    }
  })();

  await test('calculateAspectRatio is accurate', () => {
    const size = getScreenshotSizeById('iphone-17-pro-max-portrait')!;
    const ratio = calculateAspectRatio(size);
    const expected = 1260 / 2736;
    if (Math.abs(ratio - expected) > 0.001) {
      throw new Error('Aspect ratio calculation incorrect');
    }
  })();

  await test('findSimilarAspectRatios finds matches', () => {
    const size = getScreenshotSizeById('iphone-17-pro-max-portrait')!;
    const similar = findSimilarAspectRatios(size, 0.01);
    if (similar.length < 2) {
      throw new Error('Should find multiple similar aspect ratios');
    }
  })();

  // === Validation Tests ===
  console.log('\n✔️  Validation Tests\n');

  await test('validateResize accepts valid operation', () => {
    const testImage = Buffer.from('test');
    const targetSize = getScreenshotSizeById('iphone-17-pro-max-portrait')!;

    const validation = validateResize({
      source: testImage,
      targetSize,
    });

    if (!validation.valid) {
      throw new Error(`Should be valid: ${validation.errors.join(', ')}`);
    }
  })();

  await test('validateResize rejects missing source', () => {
    const targetSize = getScreenshotSizeById('iphone-17-pro-max-portrait')!;

    const validation = validateResize({
      source: '' as any,
      targetSize,
    });

    if (validation.valid) {
      throw new Error('Should be invalid');
    }
  })();

  await test('validateResize rejects invalid quality', () => {
    const testImage = Buffer.from('test');
    const targetSize = getScreenshotSizeById('iphone-17-pro-max-portrait')!;

    const validation = validateResize({
      source: testImage,
      targetSize,
      quality: 150,
    });

    if (validation.valid) {
      throw new Error('Should be invalid with quality > 100');
    }
  })();

  // === Resize Tests ===
  console.log('\n🖼️  Resize Tests\n');

  await test('resizeScreenshot with contain mode', async () => {
    const testImage = await createTestImage(2000, 3000);
    const targetSize = getScreenshotSizeById('iphone-17-pro-max-portrait')!;

    const result = await resizeScreenshot({
      source: testImage,
      targetSize,
      mode: 'contain',
    });

    if (!result.success) {
      throw new Error(`Resize failed: ${result.error}`);
    }

    if (!result.fileSize || result.fileSize === 0) {
      throw new Error('No file size reported');
    }
  })();

  await test('resizeScreenshot with cover mode', async () => {
    const testImage = await createTestImage(2000, 3000);
    const targetSize = getScreenshotSizeById('ipad-pro-12-9-landscape')!;

    const result = await resizeScreenshot({
      source: testImage,
      targetSize,
      mode: 'cover',
    });

    if (!result.success) {
      throw new Error(`Resize failed: ${result.error}`);
    }
  })();

  await test('resizeScreenshot with fill mode', async () => {
    const testImage = await createTestImage(1000, 1000);
    const targetSize = getScreenshotSizeById('iphone-16-portrait')!;

    const result = await resizeScreenshot({
      source: testImage,
      targetSize,
      mode: 'fill',
    });

    if (!result.success) {
      throw new Error(`Resize failed: ${result.error}`);
    }
  })();

  await test('resizeScreenshot with scale-down mode', async () => {
    const testImage = await createTestImage(500, 500);
    const targetSize = getScreenshotSizeById('iphone-se-portrait')!;

    const result = await resizeScreenshot({
      source: testImage,
      targetSize,
      mode: 'scale-down',
    });

    if (!result.success) {
      throw new Error(`Resize failed: ${result.error}`);
    }
  })();

  await test('resizeScreenshot saves to file', async () => {
    const testImage = await createTestImage(2000, 3000);
    const targetSize = getScreenshotSizeById('iphone-17-pro-max-portrait')!;
    const outputPath = path.join(TEST_OUTPUT_DIR, 'test-output.png');

    const result = await resizeScreenshot({
      source: testImage,
      targetSize,
      outputPath,
    });

    if (!result.success) {
      throw new Error(`Resize failed: ${result.error}`);
    }

    const exists = await fs
      .access(outputPath)
      .then(() => true)
      .catch(() => false);
    if (!exists) {
      throw new Error('Output file not created');
    }
  })();

  await test('resizeScreenshot supports JPG format', async () => {
    const testImage = await createTestImage(2000, 3000);
    const targetSize = getScreenshotSizeById('iphone-16-portrait')!;
    const outputPath = path.join(TEST_OUTPUT_DIR, 'test-output.jpg');

    const result = await resizeScreenshot({
      source: testImage,
      targetSize,
      outputPath,
      format: 'jpg',
      quality: 90,
    });

    if (!result.success) {
      throw new Error(`Resize failed: ${result.error}`);
    }
  })();

  // === Statistics Tests ===
  console.log('\n📊 Statistics Tests\n');

  await test('calculateResizeStatistics provides accurate stats', async () => {
    const testImage = await createTestImage(2000, 3000);
    const targetSize = getScreenshotSizeById('iphone-17-pro-max-portrait')!;

    const stats = await calculateResizeStatistics(testImage, targetSize, 'contain');

    if (stats.originalSize.width !== 2000 || stats.originalSize.height !== 3000) {
      throw new Error('Incorrect original size');
    }

    if (stats.targetSize.width !== 1260 || stats.targetSize.height !== 2736) {
      throw new Error('Incorrect target size');
    }

    if (stats.scale <= 0) {
      throw new Error('Invalid scale factor');
    }
  })();

  await test('generateResizeMetadata creates metadata', async () => {
    const testImage = await createTestImage(2000, 3000);
    const targetSize = getScreenshotSizeById('iphone-17-pro-max-portrait')!;

    const metadata = await generateResizeMetadata(
      testImage,
      {
        source: testImage,
        targetSize,
        mode: 'contain',
        quality: 95,
      },
      100
    );

    if (metadata.source.width !== 2000) {
      throw new Error('Incorrect source width in metadata');
    }

    if (metadata.device.type !== 'iphone') {
      throw new Error('Incorrect device type in metadata');
    }
  })();

  // === Batch Resize Tests ===
  console.log('\n📦 Batch Resize Tests\n');

  await test('batchResize generates multiple sizes', async () => {
    const testImage = await createTestImage(2000, 3000);
    const outputDir = path.join(TEST_OUTPUT_DIR, 'batch');

    const result = await batchResize({
      source: testImage,
      outputDir,
      deviceTypes: ['iphone'],
      orientations: ['portrait'],
    });

    if (result.failed > 0) {
      throw new Error(`${result.failed} operations failed`);
    }

    if (result.success < 3) {
      throw new Error('Not enough successful resizes');
    }

    if (result.duration === 0) {
      throw new Error('Duration not tracked');
    }
  })();

  await test('batchResize with organizeByType', async () => {
    const testImage = await createTestImage(2000, 3000);
    const outputDir = path.join(TEST_OUTPUT_DIR, 'organized');

    const result = await batchResize({
      source: testImage,
      outputDir,
      deviceTypes: ['iphone', 'ipad'],
      orientations: ['portrait'],
      organizeByType: true,
    });

    if (result.failed > 0) {
      throw new Error(`${result.failed} operations failed`);
    }

    // Check directories were created
    const iPhoneDir = path.join(outputDir, 'iphone');
    const iPadDir = path.join(outputDir, 'ipad');

    const iPhoneDirExists = await fs
      .access(iPhoneDir)
      .then(() => true)
      .catch(() => false);
    const iPadDirExists = await fs
      .access(iPadDir)
      .then(() => true)
      .catch(() => false);

    if (!iPhoneDirExists || !iPadDirExists) {
      throw new Error('Subdirectories not created');
    }
  })();

  await test('batchResize with custom filename template', async () => {
    const testImage = await createTestImage(2000, 3000);
    const outputDir = path.join(TEST_OUTPUT_DIR, 'custom-names');

    const result = await batchResize({
      source: testImage,
      outputDir,
      deviceTypes: ['watch'],
      filenameTemplate: 'screenshot_{displaySize}_{width}x{height}.{ext}',
    });

    if (result.failed > 0) {
      throw new Error(`${result.failed} operations failed`);
    }
  })();

  await test('batchResize with specific target sizes', async () => {
    const testImage = await createTestImage(2000, 3000);
    const outputDir = path.join(TEST_OUTPUT_DIR, 'specific');

    const targetSizes = [
      getScreenshotSizeById('iphone-17-pro-max-portrait')!,
      getScreenshotSizeById('ipad-pro-12-9-portrait')!,
    ];

    const result = await batchResize({
      source: testImage,
      outputDir,
      targetSizes,
    });

    if (result.total !== 2) {
      throw new Error('Should have exactly 2 operations');
    }

    if (result.failed > 0) {
      throw new Error(`${result.failed} operations failed`);
    }
  })();

  // === Preset Tests ===
  console.log('\n⚡ Preset Function Tests\n');

  await test('resizeForAllIPhones generates iPhone sizes', async () => {
    const testImage = await createTestImage(2000, 3000);
    const outputDir = path.join(TEST_OUTPUT_DIR, 'iphones');

    const result = await resizeForAllIPhones(testImage, outputDir);

    if (result.failed > 0) {
      throw new Error(`${result.failed} operations failed`);
    }

    if (result.success < 6) {
      throw new Error('Not enough iPhone sizes generated');
    }
  })();

  await test('resizeForAllIPads generates iPad sizes', async () => {
    const testImage = await createTestImage(3000, 4000);
    const outputDir = path.join(TEST_OUTPUT_DIR, 'ipads');

    const result = await resizeForAllIPads(testImage, outputDir);

    if (result.failed > 0) {
      throw new Error(`${result.failed} operations failed`);
    }

    if (result.success < 6) {
      throw new Error('Not enough iPad sizes generated');
    }
  })();

  await test('resizeForOrientation generates portrait sizes', async () => {
    const testImage = await createTestImage(2000, 3000);
    const outputDir = path.join(TEST_OUTPUT_DIR, 'portrait');

    const result = await resizeForOrientation(testImage, outputDir, 'portrait');

    if (result.failed > 0) {
      throw new Error(`${result.failed} operations failed`);
    }

    // Verify all are portrait
    const allPortrait = result.results.every(
      (r) => r.targetSize.orientation === 'portrait'
    );
    if (!allPortrait) {
      throw new Error('Non-portrait sizes included');
    }
  })();

  await test('resizeForOrientation generates landscape sizes', async () => {
    const testImage = await createTestImage(4000, 3000);
    const outputDir = path.join(TEST_OUTPUT_DIR, 'landscape');

    const result = await resizeForOrientation(testImage, outputDir, 'landscape');

    if (result.failed > 0) {
      throw new Error(`${result.failed} operations failed`);
    }

    // Verify all are landscape
    const allLandscape = result.results.every(
      (r) => r.targetSize.orientation === 'landscape'
    );
    if (!allLandscape) {
      throw new Error('Non-landscape sizes included');
    }
  })();

  await test('resizeRecommended generates minimum required set', async () => {
    const testImage = await createTestImage(4000, 4000);
    const outputDir = path.join(TEST_OUTPUT_DIR, 'recommended');

    const result = await resizeRecommended(testImage, outputDir);

    if (result.failed > 0) {
      throw new Error(`${result.failed} operations failed`);
    }

    if (result.success < 6) {
      throw new Error('Not enough recommended sizes generated');
    }
  })();

  // === Edge Case Tests ===
  console.log('\n🔧 Edge Case Tests\n');

  await test('handles very large images', async () => {
    const testImage = await createTestImage(5000, 7000);
    const targetSize = getScreenshotSizeById('iphone-se-portrait')!;

    const result = await resizeScreenshot({
      source: testImage,
      targetSize,
      mode: 'contain',
    });

    if (!result.success) {
      throw new Error(`Resize failed: ${result.error}`);
    }
  })();

  await test('handles very small images', async () => {
    const testImage = await createTestImage(100, 200);
    const targetSize = getScreenshotSizeById('iphone-17-pro-max-portrait')!;

    const result = await resizeScreenshot({
      source: testImage,
      targetSize,
      mode: 'contain',
    });

    if (!result.success) {
      throw new Error(`Resize failed: ${result.error}`);
    }
  })();

  await test('handles square images', async () => {
    const testImage = await createTestImage(2000, 2000);
    const targetSize = getScreenshotSizeById('iphone-16-portrait')!;

    const result = await resizeScreenshot({
      source: testImage,
      targetSize,
      mode: 'contain',
    });

    if (!result.success) {
      throw new Error(`Resize failed: ${result.error}`);
    }
  })();

  // === Print Summary ===
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Test Summary\n`);
  console.log(`Total: ${passed + failed}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed!\n');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Test suite crashed:', error);
  process.exit(1);
});
