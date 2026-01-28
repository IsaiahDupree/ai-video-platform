/**
 * Test Script for ADS-010: ZIP Export with Manifest
 * Tests the exportZip service functionality
 */

import {
  createZipExport,
  exportRenderedStills,
  exportCampaignPack,
  exportBatchBySize,
  readManifestFromZip,
  formatBytes,
  formatCompressionRatio,
  type ZipFileEntry,
  type ExportZipOptions,
} from '../src/services/exportZip';
import { renderStill, type RenderStillResult } from '../src/services/renderStill';
import fs from 'fs';
import path from 'path';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60));
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
 * Create mock render results for testing
 */
function createMockRenderResults(count: number): RenderStillResult[] {
  const results: RenderStillResult[] = [];
  const outputDir = path.join(process.cwd(), 'output', 'test-renders');

  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const sizes = [
    { width: 1080, height: 1080, format: 'png' },
    { width: 1200, height: 628, format: 'jpeg' },
    { width: 1080, height: 1920, format: 'png' },
  ];

  for (let i = 0; i < count; i++) {
    const size = sizes[i % sizes.length];
    const filename = `mock-ad-${i + 1}-${size.width}x${size.height}.${size.format}`;
    const outputPath = path.join(outputDir, filename);

    // Create a small test file
    const mockContent = `Mock rendered image ${i + 1}`;
    fs.writeFileSync(outputPath, mockContent);

    results.push({
      success: true,
      outputPath,
      width: size.width,
      height: size.height,
      format: size.format as 'png' | 'jpeg',
      sizeInBytes: mockContent.length,
    });
  }

  return results;
}

/**
 * Create mock campaign results
 */
function createMockCampaignResults(): Map<string, RenderStillResult[]> {
  const campaignResults = new Map<string, RenderStillResult[]>();
  const variants = ['variant-a', 'variant-b', 'variant-c'];
  const outputDir = path.join(process.cwd(), 'output', 'test-renders');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const sizes = [
    { width: 1080, height: 1080, format: 'png' },
    { width: 1200, height: 628, format: 'jpeg' },
    { width: 1080, height: 1920, format: 'png' },
  ];

  for (const variant of variants) {
    const results: RenderStillResult[] = [];

    for (const size of sizes) {
      const filename = `${variant}-${size.width}x${size.height}.${size.format}`;
      const outputPath = path.join(outputDir, filename);

      // Create a small test file
      const mockContent = `Mock campaign image - ${variant}`;
      fs.writeFileSync(outputPath, mockContent);

      results.push({
        success: true,
        outputPath,
        width: size.width,
        height: size.height,
        format: size.format as 'png' | 'jpeg',
        sizeInBytes: mockContent.length,
      });
    }

    campaignResults.set(variant, results);
  }

  return campaignResults;
}

/**
 * Test 1: Basic ZIP export
 */
async function testBasicZipExport() {
  logSection('Test 1: Basic ZIP Export');

  try {
    // Create mock files
    const results = createMockRenderResults(3);
    logInfo(`Created ${results.length} mock render results`);

    // Export to ZIP
    const exportResult = await exportRenderedStills(results, {
      outputPath: path.join(process.cwd(), 'output', 'test-basic-export.zip'),
    });

    if (exportResult.success) {
      logSuccess('ZIP export successful');
      logInfo(`ZIP path: ${exportResult.zipPath}`);
      logInfo(`Total files: ${exportResult.totalFiles}`);
      logInfo(`ZIP size: ${formatBytes(exportResult.totalSizeBytes)}`);
      if (exportResult.compressionRatio) {
        logInfo(`Compression: ${formatCompressionRatio(exportResult.compressionRatio)}`);
      }

      // Verify ZIP exists
      if (fs.existsSync(exportResult.zipPath)) {
        logSuccess('ZIP file created successfully');
      } else {
        logError('ZIP file not found');
      }
    } else {
      logError(`Export failed: ${exportResult.error}`);
    }
  } catch (error) {
    logError(`Test failed: ${error}`);
  }
}

/**
 * Test 2: Campaign pack export with organization
 */
async function testCampaignPackExport() {
  logSection('Test 2: Campaign Pack Export (Organized by Variant/Size)');

  try {
    // Create mock campaign results
    const campaignResults = createMockCampaignResults();
    logInfo(`Created campaign with ${campaignResults.size} variants`);

    // Export to ZIP with organization
    const exportResult = await exportCampaignPack(campaignResults, {
      outputPath: path.join(process.cwd(), 'output', 'test-campaign-pack.zip'),
      organizeByVariant: true,
      organizeBySize: true,
    });

    if (exportResult.success) {
      logSuccess('Campaign pack export successful');
      logInfo(`ZIP path: ${exportResult.zipPath}`);
      logInfo(`Total files: ${exportResult.totalFiles}`);
      logInfo(`ZIP size: ${formatBytes(exportResult.totalSizeBytes)}`);
      if (exportResult.compressionRatio) {
        logInfo(`Compression: ${formatCompressionRatio(exportResult.compressionRatio)}`);
      }

      // Read and display manifest
      const manifest = await readManifestFromZip(exportResult.zipPath);
      if (manifest) {
        logSuccess('Manifest read successfully');
        logInfo(`Export date: ${manifest.exportDate}`);
        logInfo(`Total files in manifest: ${manifest.totalFiles}`);
        logInfo(`Variants: ${Object.keys(manifest.variants).join(', ')}`);
        logInfo(`Sizes: ${Object.keys(manifest.sizes).join(', ')}`);

        // Show organization
        console.log('\nFile Organization:');
        for (const [variantId, variantData] of Object.entries(manifest.variants)) {
          console.log(`  ${variantId}/ (${variantData.fileCount} files)`);
          for (const file of variantData.files.slice(0, 2)) {
            console.log(`    - ${file.path}`);
          }
          if (variantData.files.length > 2) {
            console.log(`    ... and ${variantData.files.length - 2} more`);
          }
        }
      } else {
        logError('Failed to read manifest');
      }
    } else {
      logError(`Export failed: ${exportResult.error}`);
    }
  } catch (error) {
    logError(`Test failed: ${error}`);
  }
}

/**
 * Test 3: Batch export by size
 */
async function testBatchBySizeExport() {
  logSection('Test 3: Batch Export by Size');

  try {
    // Create mock size results
    const sizeResults = new Map<string, RenderStillResult[]>();
    const outputDir = path.join(process.cwd(), 'output', 'test-renders');

    const sizes = [
      { id: '1080x1080', width: 1080, height: 1080, format: 'png' },
      { id: '1200x628', width: 1200, height: 628, format: 'jpeg' },
    ];

    for (const size of sizes) {
      const results: RenderStillResult[] = [];

      for (let i = 0; i < 3; i++) {
        const filename = `batch-${i + 1}-${size.id}.${size.format}`;
        const outputPath = path.join(outputDir, filename);
        const mockContent = `Mock batch image ${i + 1}`;
        fs.writeFileSync(outputPath, mockContent);

        results.push({
          success: true,
          outputPath,
          width: size.width,
          height: size.height,
          format: size.format as 'png' | 'jpeg',
          sizeInBytes: mockContent.length,
        });
      }

      sizeResults.set(size.id, results);
    }

    logInfo(`Created batch with ${sizeResults.size} size groups`);

    // Export to ZIP organized by size
    const exportResult = await exportBatchBySize(sizeResults, {
      outputPath: path.join(process.cwd(), 'output', 'test-batch-by-size.zip'),
      organizeBySize: true,
    });

    if (exportResult.success) {
      logSuccess('Batch export successful');
      logInfo(`ZIP path: ${exportResult.zipPath}`);
      logInfo(`Total files: ${exportResult.totalFiles}`);
      logInfo(`ZIP size: ${formatBytes(exportResult.totalSizeBytes)}`);

      // Read manifest
      const manifest = await readManifestFromZip(exportResult.zipPath);
      if (manifest) {
        logSuccess('Manifest read successfully');
        console.log('\nSize Groups:');
        for (const [sizeId, sizeData] of Object.entries(manifest.sizes)) {
          console.log(`  ${sizeId}/ (${sizeData.width}x${sizeData.height}, ${sizeData.fileCount} files)`);
        }
      }
    } else {
      logError(`Export failed: ${exportResult.error}`);
    }
  } catch (error) {
    logError(`Test failed: ${error}`);
  }
}

/**
 * Test 4: Custom file entries
 */
async function testCustomFileEntries() {
  logSection('Test 4: Custom File Entries with Custom Paths');

  try {
    // Create mock files
    const outputDir = path.join(process.cwd(), 'output', 'test-renders');
    const files: ZipFileEntry[] = [];

    const customFiles = [
      { name: 'hero-image.png', variant: 'hero', size: '1920x1080' },
      { name: 'thumbnail.jpg', variant: 'thumbnail', size: '640x360' },
      { name: 'banner.png', variant: 'banner', size: '728x90' },
    ];

    for (const file of customFiles) {
      const filePath = path.join(outputDir, file.name);
      const mockContent = `Mock ${file.name}`;
      fs.writeFileSync(filePath, mockContent);

      files.push({
        sourcePath: filePath,
        zipPath: `${file.variant}/${file.size}/${file.name}`,
        variantId: file.variant,
        sizeId: file.size,
        width: parseInt(file.size.split('x')[0]),
        height: parseInt(file.size.split('x')[1]),
        sizeInBytes: mockContent.length,
        format: path.extname(file.name).slice(1),
      });
    }

    logInfo(`Created ${files.length} custom file entries`);

    // Export with custom organization
    const exportResult = await createZipExport(files, {
      outputPath: path.join(process.cwd(), 'output', 'test-custom-entries.zip'),
      compressionLevel: 9,
    });

    if (exportResult.success) {
      logSuccess('Custom export successful');
      logInfo(`ZIP path: ${exportResult.zipPath}`);
      logInfo(`Total files: ${exportResult.totalFiles}`);

      // Read manifest
      const manifest = await readManifestFromZip(exportResult.zipPath);
      if (manifest) {
        logSuccess('Manifest with custom paths created');
        console.log('\nCustom File Structure:');
        for (const file of manifest.files) {
          console.log(`  ${file.path} (${file.width}x${file.height})`);
        }
      }
    } else {
      logError(`Export failed: ${exportResult.error}`);
    }
  } catch (error) {
    logError(`Test failed: ${error}`);
  }
}

/**
 * Test 5: Export without manifest
 */
async function testExportWithoutManifest() {
  logSection('Test 5: Export Without Manifest');

  try {
    const results = createMockRenderResults(2);
    logInfo(`Created ${results.length} mock render results`);

    const exportResult = await exportRenderedStills(results, {
      outputPath: path.join(process.cwd(), 'output', 'test-no-manifest.zip'),
      includeManifest: false,
    });

    if (exportResult.success) {
      logSuccess('Export without manifest successful');

      // Try to read manifest (should be null)
      const manifest = await readManifestFromZip(exportResult.zipPath);
      if (manifest === null) {
        logSuccess('Confirmed: No manifest in ZIP');
      } else {
        logError('Unexpected: Manifest found in ZIP');
      }
    } else {
      logError(`Export failed: ${exportResult.error}`);
    }
  } catch (error) {
    logError(`Test failed: ${error}`);
  }
}

/**
 * Test 6: Compression levels
 */
async function testCompressionLevels() {
  logSection('Test 6: Different Compression Levels');

  try {
    const results = createMockRenderResults(5);
    const compressionLevels = [0, 5, 9];

    for (const level of compressionLevels) {
      const exportResult = await exportRenderedStills(results, {
        outputPath: path.join(
          process.cwd(),
          'output',
          `test-compression-${level}.zip`
        ),
        compressionLevel: level,
      });

      if (exportResult.success) {
        logSuccess(`Compression level ${level}: ${formatBytes(exportResult.totalSizeBytes)}`);
        if (exportResult.compressionRatio) {
          logInfo(`  Ratio: ${formatCompressionRatio(exportResult.compressionRatio)}`);
        }
      } else {
        logError(`Compression level ${level} failed: ${exportResult.error}`);
      }
    }
  } catch (error) {
    logError(`Test failed: ${error}`);
  }
}

/**
 * Cleanup test files
 */
function cleanup() {
  logSection('Cleanup');

  try {
    const outputDir = path.join(process.cwd(), 'output');
    const testRendersDir = path.join(outputDir, 'test-renders');

    // Remove test render files
    if (fs.existsSync(testRendersDir)) {
      fs.rmSync(testRendersDir, { recursive: true, force: true });
      logSuccess('Removed test render files');
    }

    // List remaining export files
    const exportFiles = fs.readdirSync(outputDir)
      .filter(f => f.startsWith('test-') && f.endsWith('.zip'));

    if (exportFiles.length > 0) {
      logInfo(`Export files created (in output/):`);
      for (const file of exportFiles) {
        const stats = fs.statSync(path.join(outputDir, file));
        console.log(`  - ${file} (${formatBytes(stats.size)})`);
      }
    }
  } catch (error) {
    logError(`Cleanup failed: ${error}`);
  }
}

/**
 * Show statistics
 */
async function showStatistics() {
  logSection('Export Statistics');

  try {
    const outputDir = path.join(process.cwd(), 'output');
    const exportFiles = fs.readdirSync(outputDir)
      .filter(f => f.startsWith('test-') && f.endsWith('.zip'));

    logInfo(`Total export files: ${exportFiles.length}`);

    let totalSize = 0;
    for (const file of exportFiles) {
      const filePath = path.join(outputDir, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;

      const manifest = await readManifestFromZip(filePath);
      console.log(`\n${file}:`);
      console.log(`  Size: ${formatBytes(stats.size)}`);
      if (manifest) {
        console.log(`  Files: ${manifest.totalFiles}`);
        console.log(`  Variants: ${Object.keys(manifest.variants).length}`);
        console.log(`  Sizes: ${Object.keys(manifest.sizes).length}`);
      }
    }

    if (exportFiles.length > 0) {
      logInfo(`\nTotal size of all exports: ${formatBytes(totalSize)}`);
    }
  } catch (error) {
    logError(`Statistics failed: ${error}`);
  }
}

/**
 * Main test runner
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  console.log('\n' + '='.repeat(60));
  log('ADS-010: ZIP Export with Manifest - Test Suite', colors.bright + colors.cyan);
  console.log('='.repeat(60));

  try {
    switch (command) {
      case 'basic':
        await testBasicZipExport();
        break;

      case 'campaign':
        await testCampaignPackExport();
        break;

      case 'batch':
        await testBatchBySizeExport();
        break;

      case 'custom':
        await testCustomFileEntries();
        break;

      case 'no-manifest':
        await testExportWithoutManifest();
        break;

      case 'compression':
        await testCompressionLevels();
        break;

      case 'stats':
        await showStatistics();
        break;

      case 'cleanup':
        cleanup();
        break;

      case 'all':
      default:
        await testBasicZipExport();
        await testCampaignPackExport();
        await testBatchBySizeExport();
        await testCustomFileEntries();
        await testExportWithoutManifest();
        await testCompressionLevels();
        await showStatistics();
        cleanup();
        break;
    }

    console.log('\n' + '='.repeat(60));
    logSuccess('Test suite completed!');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    logError('Test suite failed!');
    console.error(error);
    console.error('='.repeat(60) + '\n');
    process.exit(1);
  }
}

// Run tests
main();
