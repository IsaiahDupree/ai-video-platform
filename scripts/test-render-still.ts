/**
 * Test Script for ADS-007: renderStill Service
 * Tests rendering static ad templates to PNG/JPG/WebP
 */

import {
  renderStill,
  getAvailableCompositions,
  getCompositionInfo,
  batchRenderStills,
  type RenderStillResult,
} from '../src/services/renderStill';
import path from 'path';
import fs from 'fs';

/**
 * Print render result
 */
function printResult(result: RenderStillResult, label: string) {
  console.log(`\n${label}:`);
  if (result.success) {
    console.log(`  ✓ Success`);
    console.log(`  Output: ${result.outputPath}`);
    console.log(`  Dimensions: ${result.width}x${result.height}`);
    console.log(`  Format: ${result.format}`);
    console.log(`  Size: ${(result.sizeInBytes! / 1024).toFixed(2)} KB`);
  } else {
    console.log(`  ✗ Failed: ${result.error}`);
  }
}

/**
 * Test 1: Get available compositions
 */
async function testGetCompositions() {
  console.log('\n=== Test 1: Get Available Compositions ===');

  try {
    const compositions = await getAvailableCompositions();
    console.log(`Found ${compositions.length} compositions:`);
    compositions.forEach((id) => {
      console.log(`  - ${id}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Test 2: Get composition info
 */
async function testGetCompositionInfo() {
  console.log('\n=== Test 2: Get Composition Info ===');

  const compositionId = 'HeroAd';

  try {
    const info = await getCompositionInfo(compositionId);
    if (info) {
      console.log(`Composition: ${info.id}`);
      console.log(`  Dimensions: ${info.width}x${info.height}`);
      if (info.fps) console.log(`  FPS: ${info.fps}`);
      if (info.durationInFrames) console.log(`  Duration: ${info.durationInFrames} frames`);
    } else {
      console.log(`Composition "${compositionId}" not found`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Test 3: Render single still as PNG
 */
async function testRenderPNG() {
  console.log('\n=== Test 3: Render Single Still (PNG) ===');

  try {
    const result = await renderStill('HeroAd', {
      format: 'png',
    });

    printResult(result, 'Hero Ad (PNG)');
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Test 4: Render single still as JPEG
 */
async function testRenderJPEG() {
  console.log('\n=== Test 4: Render Single Still (JPEG) ===');

  try {
    const result = await renderStill('QuoteAd', {
      format: 'jpeg',
      quality: 85,
    });

    printResult(result, 'Quote Ad (JPEG)');
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Test 5: Render with custom output path
 */
async function testCustomOutputPath() {
  console.log('\n=== Test 5: Render with Custom Output Path ===');

  const outputPath = path.join(process.cwd(), 'output', 'ads', 'custom-minimal-ad.png');

  try {
    const result = await renderStill('MinimalAd', {
      format: 'png',
      outputPath,
    });

    printResult(result, 'Minimal Ad (Custom Path)');
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Test 6: Batch render multiple compositions
 */
async function testBatchRender() {
  console.log('\n=== Test 6: Batch Render Multiple Compositions ===');

  const outputDir = path.join(process.cwd(), 'output', 'ads', 'batch');

  try {
    const results = await batchRenderStills(
      ['HeroAd', 'QuoteAd', 'MinimalAd', 'TextOnlyAd'],
      {
        outputDir,
        format: 'png',
        nameTemplate: '{id}-batch',
      }
    );

    console.log(`\nBatch render completed: ${results.length} compositions`);
    results.forEach((result, index) => {
      printResult(result, `Result ${index + 1}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Test 7: Test error handling (invalid composition)
 */
async function testErrorHandling() {
  console.log('\n=== Test 7: Error Handling (Invalid Composition) ===');

  try {
    const result = await renderStill('NonExistentAd', {
      format: 'png',
    });

    printResult(result, 'Non-Existent Ad');
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('========================================');
  console.log('ADS-007: renderStill Service Tests');
  console.log('========================================');

  try {
    await testGetCompositions();
    await testGetCompositionInfo();
    await testRenderPNG();
    await testRenderJPEG();
    await testCustomOutputPath();
    await testBatchRender();
    await testErrorHandling();

    console.log('\n========================================');
    console.log('All tests completed!');
    console.log('========================================\n');
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests();
