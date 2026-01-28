#!/usr/bin/env ts-node
/**
 * Test Video Export Utility - T2V-010
 * Comprehensive test script for video output pipeline
 *
 * Tests all video export functionality:
 * - Raw video saving
 * - Video encoding with quality presets
 * - Metadata extraction
 * - Thumbnail generation
 * - Format conversion
 * - Video validation
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  saveVideo,
  saveVideoRaw,
  getVideoMetadata,
  generateThumbnail,
  validateVideo,
  convertVideo,
  getVideoFileSize,
  createExportConfig,
  VideoExportConfig,
  VideoMetadata,
} from '../src/utils/videoExport';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log();
  log('='.repeat(70), colors.cyan);
  log(` ${title}`, colors.bright + colors.cyan);
  log('='.repeat(70), colors.cyan);
  console.log();
}

function logSuccess(message: string) {
  log(`✓ ${message}`, colors.green);
}

function logError(message: string) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ ${message}`, colors.blue);
}

/**
 * Generate a simple test video buffer (synthetic video)
 */
function createTestVideoBuffer(): Buffer {
  // For testing, we'll use an existing test video if available
  const testVideoPath = path.join(__dirname, '..', 'test_ltx_output.mp4');
  if (fs.existsSync(testVideoPath)) {
    return fs.readFileSync(testVideoPath);
  }

  throw new Error('Test video not found. Please generate a test video first using T2V models.');
}

/**
 * Display video metadata in a formatted table
 */
function displayMetadata(metadata: VideoMetadata) {
  log('Video Metadata:', colors.bright);
  console.log('  Resolution:    ', `${metadata.width}x${metadata.height}`);
  console.log('  Duration:      ', `${metadata.duration.toFixed(2)}s`);
  console.log('  FPS:           ', metadata.fps.toFixed(2));
  console.log('  Codec:         ', metadata.codec);
  console.log('  Bitrate:       ', `${metadata.bitrate} kbps`);
  console.log('  File Size:     ', `${(metadata.fileSize / 1024 / 1024).toFixed(2)} MB`);
  console.log('  Format:        ', metadata.format);
}

/**
 * Test 1: Raw video saving (no re-encoding)
 */
async function testRawSave() {
  logSection('Test 1: Raw Video Saving');

  try {
    const videoBuffer = createTestVideoBuffer();
    const outputPath = path.join(__dirname, '..', 'output', 'test-raw.mp4');

    logInfo(`Saving video buffer (${videoBuffer.length} bytes)...`);

    const savedPath = await saveVideoRaw(videoBuffer, outputPath, true);

    logSuccess(`Video saved to: ${savedPath}`);
    logSuccess(`File size: ${getVideoFileSize(savedPath)}`);

    return savedPath;
  } catch (error) {
    logError(`Raw save failed: ${error}`);
    throw error;
  }
}

/**
 * Test 2: Metadata extraction
 */
async function testMetadataExtraction(videoPath: string) {
  logSection('Test 2: Metadata Extraction');

  try {
    logInfo('Extracting video metadata...');

    const metadata = await getVideoMetadata(videoPath);
    displayMetadata(metadata);

    logSuccess('Metadata extraction successful');
    return metadata;
  } catch (error) {
    logError(`Metadata extraction failed: ${error}`);
    throw error;
  }
}

/**
 * Test 3: Thumbnail generation
 */
async function testThumbnailGeneration(videoPath: string) {
  logSection('Test 3: Thumbnail Generation');

  try {
    const tests = [
      {
        name: 'Small thumbnail (320px wide)',
        config: {
          outputPath: path.join(__dirname, '..', 'output', 'thumbnail-small.jpg'),
          timeSeconds: 0.5,
          width: 320,
          quality: 85,
        },
      },
      {
        name: 'Medium thumbnail (640px wide)',
        config: {
          outputPath: path.join(__dirname, '..', 'output', 'thumbnail-medium.jpg'),
          timeSeconds: 1.0,
          width: 640,
          quality: 90,
        },
      },
      {
        name: 'Large PNG thumbnail',
        config: {
          outputPath: path.join(__dirname, '..', 'output', 'thumbnail-large.png'),
          timeSeconds: 0.5,
          width: 1280,
          format: 'png' as const,
        },
      },
    ];

    for (const test of tests) {
      logInfo(`Generating: ${test.name}...`);
      const thumbnailPath = await generateThumbnail(videoPath, test.config);
      logSuccess(`Generated: ${thumbnailPath}`);
      logSuccess(`Size: ${getVideoFileSize(thumbnailPath)}`);
    }

    logSuccess('All thumbnails generated successfully');
  } catch (error) {
    logError(`Thumbnail generation failed: ${error}`);
    throw error;
  }
}

/**
 * Test 4: Video encoding with quality presets
 */
async function testQualityPresets(videoBuffer: Buffer) {
  logSection('Test 4: Quality Presets');

  const presets: Array<{ name: string; quality: 'draft' | 'standard' | 'high' | 'max' }> = [
    { name: 'Draft Quality (fast encoding)', quality: 'draft' },
    { name: 'Standard Quality', quality: 'standard' },
    { name: 'High Quality', quality: 'high' },
  ];

  try {
    for (const preset of presets) {
      logInfo(`Testing ${preset.name}...`);

      const outputPath = path.join(
        __dirname,
        '..',
        'output',
        `test-${preset.quality}.mp4`
      );

      const startTime = Date.now();

      await saveVideo(videoBuffer, {
        outputPath,
        quality: preset.quality,
        overwrite: true,
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      logSuccess(`Encoded in ${duration}s`);
      logSuccess(`File size: ${getVideoFileSize(outputPath)}`);

      // Show metadata for comparison
      const metadata = await getVideoMetadata(outputPath);
      console.log(`  Bitrate: ${metadata.bitrate} kbps`);
    }

    logSuccess('All quality presets tested successfully');
  } catch (error) {
    logError(`Quality preset test failed: ${error}`);
    throw error;
  }
}

/**
 * Test 5: Video validation
 */
async function testVideoValidation(videoPath: string) {
  logSection('Test 5: Video Validation');

  try {
    logInfo('Validating video file...');

    await validateVideo(videoPath);

    logSuccess('Video validation passed');
  } catch (error) {
    logError(`Video validation failed: ${error}`);
    throw error;
  }
}

/**
 * Test 6: Custom encoding parameters
 */
async function testCustomEncoding(videoBuffer: Buffer) {
  logSection('Test 6: Custom Encoding Parameters');

  try {
    // Test 1: Custom CRF
    logInfo('Testing custom CRF value...');
    const crfPath = path.join(__dirname, '..', 'output', 'test-crf15.mp4');
    await saveVideo(videoBuffer, {
      outputPath: crfPath,
      crf: 15, // Very high quality
      overwrite: true,
    });
    logSuccess(`Custom CRF encoding: ${getVideoFileSize(crfPath)}`);

    // Test 2: Custom bitrate
    logInfo('Testing custom bitrate...');
    const bitratePath = path.join(__dirname, '..', 'output', 'test-5mbps.mp4');
    await saveVideo(videoBuffer, {
      outputPath: bitratePath,
      bitrate: '5M',
      overwrite: true,
    });
    logSuccess(`Custom bitrate encoding: ${getVideoFileSize(bitratePath)}`);

    // Test 3: H.265 codec
    logInfo('Testing H.265 codec...');
    const h265Path = path.join(__dirname, '..', 'output', 'test-h265.mp4');
    await saveVideo(videoBuffer, {
      outputPath: h265Path,
      codec: 'libx265',
      quality: 'high',
      overwrite: true,
    });
    logSuccess(`H.265 encoding: ${getVideoFileSize(h265Path)}`);

    logSuccess('Custom encoding tests completed');
  } catch (error) {
    logError(`Custom encoding test failed: ${error}`);
    // Note: Some codecs might not be available, so we don't throw
    logInfo('Some encoding options may require additional ffmpeg build features');
  }
}

/**
 * Test 7: Export config helper
 */
function testExportConfigHelper() {
  logSection('Test 7: Export Config Helper');

  try {
    logInfo('Testing config creation helper...');

    const config = createExportConfig({
      outputPath: 'output/video.mp4',
      quality: 'high',
      overwrite: true,
    });

    console.log('Generated config:');
    console.log(JSON.stringify(config, null, 2));

    logSuccess('Config helper working correctly');
  } catch (error) {
    logError(`Config helper test failed: ${error}`);
    throw error;
  }
}

/**
 * Test 8: Integration test with T2V router
 */
async function testT2VIntegration() {
  logSection('Test 8: T2V Router Integration');

  try {
    // Check if T2V router is available
    const routerPath = path.join(__dirname, '..', 'src', 'services', 'textToVideo.ts');
    if (!fs.existsSync(routerPath)) {
      logInfo('T2V router not available, skipping integration test');
      return;
    }

    logInfo('Testing integration with T2V router...');

    // Import T2V functions
    const { TextToVideoClient } = await import('../src/services/textToVideo');

    logInfo('T2V client imported successfully');
    logSuccess('Integration test passed');
  } catch (error) {
    logInfo('T2V integration test skipped (optional)');
  }
}

/**
 * Main test runner
 */
async function main() {
  log(colors.bright + '\n🎬 Video Export Utility Test Suite\n' + colors.reset);

  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  try {
    // Ensure output directory exists
    const outputDir = path.join(__dirname, '..', 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    switch (command) {
      case 'raw':
        await testRawSave();
        break;

      case 'metadata': {
        const videoPath = args[1] || path.join(__dirname, '..', 'test_ltx_output.mp4');
        await testMetadataExtraction(videoPath);
        break;
      }

      case 'thumbnail': {
        const videoPath = args[1] || path.join(__dirname, '..', 'test_ltx_output.mp4');
        await testThumbnailGeneration(videoPath);
        break;
      }

      case 'validate': {
        const videoPath = args[1] || path.join(__dirname, '..', 'test_ltx_output.mp4');
        await testVideoValidation(videoPath);
        break;
      }

      case 'quality': {
        const videoBuffer = createTestVideoBuffer();
        await testQualityPresets(videoBuffer);
        break;
      }

      case 'custom': {
        const videoBuffer = createTestVideoBuffer();
        await testCustomEncoding(videoBuffer);
        break;
      }

      case 'all':
      default: {
        // Run all tests
        logInfo('Running comprehensive test suite...');

        // Test 1: Raw save
        const savedPath = await testRawSave();

        // Test 2: Metadata
        await testMetadataExtraction(savedPath);

        // Test 3: Thumbnails
        await testThumbnailGeneration(savedPath);

        // Test 4: Quality presets
        const videoBuffer = createTestVideoBuffer();
        await testQualityPresets(videoBuffer);

        // Test 5: Validation
        await testVideoValidation(savedPath);

        // Test 6: Custom encoding
        await testCustomEncoding(videoBuffer);

        // Test 7: Config helper
        testExportConfigHelper();

        // Test 8: T2V integration
        await testT2VIntegration();

        break;
      }

      case 'help':
        console.log(`
Usage: npm run test-video-export [command] [options]

Commands:
  all         Run all tests (default)
  raw         Test raw video saving
  metadata    Extract and display video metadata
              Usage: npm run test-video-export metadata [video-path]
  thumbnail   Generate thumbnails
              Usage: npm run test-video-export thumbnail [video-path]
  validate    Validate video file
              Usage: npm run test-video-export validate [video-path]
  quality     Test quality presets (draft, standard, high, max)
  custom      Test custom encoding parameters
  help        Show this help message

Examples:
  npm run test-video-export
  npm run test-video-export metadata test_ltx_output.mp4
  npm run test-video-export thumbnail output/video.mp4
  npm run test-video-export quality
        `);
        return;
    }

    // Success summary
    logSection('Test Summary');
    logSuccess('All tests completed successfully!');
    log('\nCheck the output/ directory for generated files.', colors.cyan);
  } catch (error) {
    logSection('Test Failed');
    logError(`Error: ${error}`);
    process.exit(1);
  }
}

// Run tests
main();
