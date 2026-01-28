/**
 * Test Suite: Locale Export Service
 * APP-004: Locale-organized Export
 *
 * Comprehensive test suite for the locale export service.
 * Tests directory organization, ZIP creation, validation, and manifest generation.
 */

import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import {
  exportLocaleScreenshots,
  validateScreenshots,
  getLocaleMetadata,
  getSupportedLocales,
} from '../src/services/localeExport';
import {
  ScreenshotFile,
  AppStoreLocale,
  ValidationRules,
} from '../src/types/localeExport';
import { ScreenshotSize } from '../src/types/screenshotResize';

// Test data directory
const TEST_DATA_DIR = path.join(__dirname, '../test-data/locale-export');
const TEST_OUTPUT_DIR = path.join(__dirname, '../test-output/locale-export');

// Sample screenshot sizes
const SAMPLE_SIZES: Record<string, ScreenshotSize> = {
  iphone17ProMax: {
    id: 'iphone-17-pro-max-portrait',
    deviceType: 'iphone',
    model: 'iPhone 17 Pro Max',
    width: 1320,
    height: 2868,
    orientation: 'portrait',
    displaySize: '6.9-inch',
    name: 'iPhone 17 Pro Max (Portrait)',
  },
  ipadPro13: {
    id: 'ipad-pro-13-landscape',
    deviceType: 'ipad',
    model: 'iPad Pro 13" M5',
    width: 2752,
    height: 2064,
    orientation: 'landscape',
    displaySize: '13-inch',
    name: 'iPad Pro 13" M5 (Landscape)',
  },
  mac: {
    id: 'mac-air-13',
    deviceType: 'mac',
    model: 'MacBook Air 13"',
    width: 2560,
    height: 1600,
    orientation: 'landscape',
    displaySize: '13-inch',
    name: 'MacBook Air 13"',
  },
};

/**
 * Create sample screenshot data for testing
 */
async function createSampleScreenshots(): Promise<ScreenshotFile[]> {
  const screenshots: ScreenshotFile[] = [];

  // Create test data directory
  await fs.mkdir(TEST_DATA_DIR, { recursive: true });

  const locales: AppStoreLocale[] = ['en-US', 'es-ES', 'ja'];
  const deviceConfigs = [
    { type: 'iphone', size: SAMPLE_SIZES.iphone17ProMax, count: 5 },
    { type: 'ipad', size: SAMPLE_SIZES.ipadPro13, count: 3 },
  ];

  for (const locale of locales) {
    for (const config of deviceConfigs) {
      for (let i = 1; i <= config.count; i++) {
        const filename = `${locale}-${config.type}-${i}.png`;
        const filepath = path.join(TEST_DATA_DIR, filename);

        // Create a minimal PNG file (1x1 transparent pixel)
        const minimalPNG = Buffer.from([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
          0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
          0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
          0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
          0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
          0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
          0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
          0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
          0x42, 0x60, 0x82,
        ]);

        await fs.writeFile(filepath, minimalPNG);

        screenshots.push({
          source: filepath,
          deviceType: config.type as any,
          model: config.size.model,
          orientation: config.size.orientation,
          displayOrder: i,
          size: config.size,
          locale,
          filename,
        });
      }
    }
  }

  return screenshots;
}

/**
 * Test: Basic directory export (locale-first)
 */
async function testDirectoryExportLocaleFirst(): Promise<boolean> {
  console.log('\n=== Test: Directory Export (Locale-First) ===');

  try {
    const screenshots = await createSampleScreenshots();
    const outputPath = path.join(TEST_OUTPUT_DIR, 'directory-locale-first');

    const result = await exportLocaleScreenshots({
      screenshots,
      outputPath,
      format: 'directory',
      organizationStrategy: 'locale-first',
      includeManifest: true,
      manifestFormat: 'json',
    });

    console.log('Export result:', JSON.stringify(result, null, 2));

    // Verify directory structure exists
    const checks = [
      path.join(outputPath, 'en-US', 'iphone'),
      path.join(outputPath, 'en-US', 'ipad'),
      path.join(outputPath, 'es-ES', 'iphone'),
      path.join(outputPath, 'es-ES', 'ipad'),
      path.join(outputPath, 'ja', 'iphone'),
      path.join(outputPath, 'ja', 'ipad'),
    ];

    for (const dir of checks) {
      if (!existsSync(dir)) {
        throw new Error(`Directory not created: ${dir}`);
      }
    }

    // Verify manifest
    const manifestPath = path.join(outputPath, 'manifest.json');
    if (!existsSync(manifestPath)) {
      throw new Error('Manifest not created');
    }

    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
    console.log('Manifest metadata:', manifest.metadata);
    console.log('Manifest statistics:', manifest.statistics);

    console.log('✅ Directory export (locale-first) passed');
    return true;
  } catch (error: any) {
    console.error('❌ Directory export (locale-first) failed:', error.message);
    return false;
  }
}

/**
 * Test: ZIP export (device-first)
 */
async function testZipExportDeviceFirst(): Promise<boolean> {
  console.log('\n=== Test: ZIP Export (Device-First) ===');

  try {
    const screenshots = await createSampleScreenshots();
    const outputPath = path.join(TEST_OUTPUT_DIR, 'export-device-first.zip');

    const result = await exportLocaleScreenshots({
      screenshots,
      outputPath,
      format: 'zip',
      organizationStrategy: 'device-first',
      compressionLevel: 9,
      includeManifest: true,
    });

    console.log('Export result:', JSON.stringify(result, null, 2));

    // Verify ZIP file exists
    if (!existsSync(outputPath)) {
      throw new Error('ZIP file not created');
    }

    const stats = await fs.stat(outputPath);
    console.log(`ZIP file size: ${stats.size} bytes`);

    if (stats.size === 0) {
      throw new Error('ZIP file is empty');
    }

    console.log('✅ ZIP export (device-first) passed');
    return true;
  } catch (error: any) {
    console.error('❌ ZIP export (device-first) failed:', error.message);
    return false;
  }
}

/**
 * Test: Flat locale organization
 */
async function testFlatLocaleOrganization(): Promise<boolean> {
  console.log('\n=== Test: Flat Locale Organization ===');

  try {
    const screenshots = await createSampleScreenshots();
    const outputPath = path.join(TEST_OUTPUT_DIR, 'directory-flat-locale');

    const result = await exportLocaleScreenshots({
      screenshots,
      outputPath,
      format: 'directory',
      organizationStrategy: 'flat-locale',
    });

    console.log('Export result:', JSON.stringify(result, null, 2));

    // Verify flat structure (no device subdirectories)
    const checks = [
      path.join(outputPath, 'en-US'),
      path.join(outputPath, 'es-ES'),
      path.join(outputPath, 'ja'),
    ];

    for (const dir of checks) {
      if (!existsSync(dir)) {
        throw new Error(`Directory not created: ${dir}`);
      }

      // Check that files are directly in locale directory
      const files = await fs.readdir(dir);
      if (files.length === 0) {
        throw new Error(`No files in directory: ${dir}`);
      }
    }

    console.log('✅ Flat locale organization passed');
    return true;
  } catch (error: any) {
    console.error('❌ Flat locale organization failed:', error.message);
    return false;
  }
}

/**
 * Test: Validation - Max screenshots per device
 */
async function testValidationMaxScreenshots(): Promise<boolean> {
  console.log('\n=== Test: Validation - Max Screenshots ===');

  try {
    const screenshots = await createSampleScreenshots();

    // Add extra screenshots to exceed limit
    const extraScreenshots: ScreenshotFile[] = [];
    for (let i = 6; i <= 12; i++) {
      extraScreenshots.push({
        ...screenshots[0],
        displayOrder: i,
        filename: `extra-${i}.png`,
      });
    }

    const rules: ValidationRules = {
      maxScreenshotsPerDevice: 10,
    };

    const validation = validateScreenshots([...screenshots, ...extraScreenshots], rules);

    console.log('Validation result:', JSON.stringify(validation, null, 2));

    if (validation.valid) {
      throw new Error('Validation should have failed (too many screenshots)');
    }

    if (validation.errors.length === 0) {
      throw new Error('Expected validation errors');
    }

    console.log('✅ Validation (max screenshots) passed');
    return true;
  } catch (error: any) {
    console.error('❌ Validation (max screenshots) failed:', error.message);
    return false;
  }
}

/**
 * Test: Validation - Duplicate display orders
 */
async function testValidationDuplicateOrders(): Promise<boolean> {
  console.log('\n=== Test: Validation - Duplicate Orders ===');

  try {
    const screenshots = await createSampleScreenshots();

    // Create duplicate display orders
    screenshots[1].displayOrder = screenshots[0].displayOrder;

    const validation = validateScreenshots(screenshots);

    console.log('Validation result:', JSON.stringify(validation, null, 2));

    if (validation.warnings.length === 0) {
      throw new Error('Expected validation warnings for duplicate orders');
    }

    console.log('✅ Validation (duplicate orders) passed');
    return true;
  } catch (error: any) {
    console.error('❌ Validation (duplicate orders) failed:', error.message);
    return false;
  }
}

/**
 * Test: Custom filename template
 */
async function testCustomFilenameTemplate(): Promise<boolean> {
  console.log('\n=== Test: Custom Filename Template ===');

  try {
    const screenshots = await createSampleScreenshots();
    const outputPath = path.join(TEST_OUTPUT_DIR, 'directory-custom-template');

    const result = await exportLocaleScreenshots({
      screenshots,
      outputPath,
      format: 'directory',
      organizationStrategy: 'locale-first',
      filenameTemplate: '{locale}_{deviceType}_{order}_{width}x{height}.png',
    });

    console.log('Export result:', JSON.stringify(result, null, 2));

    // Verify custom filename
    const sampleFile = path.join(outputPath, 'en-US', 'iphone', 'en-US_iphone_1_1320x2868.png');
    if (!existsSync(sampleFile)) {
      throw new Error(`Custom filename not created: ${sampleFile}`);
    }

    console.log('✅ Custom filename template passed');
    return true;
  } catch (error: any) {
    console.error('❌ Custom filename template failed:', error.message);
    return false;
  }
}

/**
 * Test: CSV manifest format
 */
async function testCSVManifestFormat(): Promise<boolean> {
  console.log('\n=== Test: CSV Manifest Format ===');

  try {
    const screenshots = await createSampleScreenshots();
    const outputPath = path.join(TEST_OUTPUT_DIR, 'directory-csv-manifest');

    const result = await exportLocaleScreenshots({
      screenshots,
      outputPath,
      format: 'directory',
      organizationStrategy: 'locale-first',
      includeManifest: true,
      manifestFormat: 'csv',
    });

    console.log('Export result:', JSON.stringify(result, null, 2));

    // Verify CSV manifest
    const manifestPath = path.join(outputPath, 'manifest.csv');
    if (!existsSync(manifestPath)) {
      throw new Error('CSV manifest not created');
    }

    const content = await fs.readFile(manifestPath, 'utf-8');
    const lines = content.split('\n');

    if (lines.length < 2) {
      throw new Error('CSV manifest has no data rows');
    }

    console.log(`CSV manifest has ${lines.length - 1} data rows`);
    console.log('✅ CSV manifest format passed');
    return true;
  } catch (error: any) {
    console.error('❌ CSV manifest format failed:', error.message);
    return false;
  }
}

/**
 * Test: Locale metadata
 */
async function testLocaleMetadata(): Promise<boolean> {
  console.log('\n=== Test: Locale Metadata ===');

  try {
    const locales = getSupportedLocales();
    console.log(`Total supported locales: ${locales.length}`);

    // Test a few specific locales
    const testLocales: AppStoreLocale[] = ['en-US', 'ar-SA', 'ja', 'zh-Hans'];

    for (const locale of testLocales) {
      const metadata = getLocaleMetadata(locale);
      console.log(`${locale}:`, {
        language: metadata.languageName,
        native: metadata.nativeLanguageName,
        rtl: metadata.rtl,
      });

      if (!metadata.languageName || !metadata.nativeLanguageName) {
        throw new Error(`Incomplete metadata for ${locale}`);
      }
    }

    // Verify RTL locales
    const rtlLocales = ['ar-SA', 'he'];
    for (const locale of rtlLocales as AppStoreLocale[]) {
      const metadata = getLocaleMetadata(locale);
      if (!metadata.rtl) {
        throw new Error(`${locale} should be marked as RTL`);
      }
    }

    console.log('✅ Locale metadata passed');
    return true;
  } catch (error: any) {
    console.error('❌ Locale metadata failed:', error.message);
    return false;
  }
}

/**
 * Test: Statistics calculation
 */
async function testStatisticsCalculation(): Promise<boolean> {
  console.log('\n=== Test: Statistics Calculation ===');

  try {
    const screenshots = await createSampleScreenshots();
    const outputPath = path.join(TEST_OUTPUT_DIR, 'directory-statistics');

    const result = await exportLocaleScreenshots({
      screenshots,
      outputPath,
      format: 'directory',
      organizationStrategy: 'locale-first',
    });

    console.log('Statistics:', {
      byLocale: result.byLocale,
      byDeviceType: result.byDeviceType,
      total: result.totalScreenshots,
    });

    // Verify statistics
    if (result.totalScreenshots !== screenshots.length) {
      throw new Error('Total screenshots mismatch');
    }

    const expectedByLocale = { 'en-US': 8, 'es-ES': 8, 'ja': 8 };
    for (const [locale, count] of Object.entries(expectedByLocale)) {
      if (result.byLocale[locale as AppStoreLocale] !== count) {
        throw new Error(`Locale count mismatch for ${locale}`);
      }
    }

    const expectedByDevice = { iphone: 15, ipad: 9 };
    for (const [device, count] of Object.entries(expectedByDevice)) {
      if (result.byDeviceType[device as any] !== count) {
        throw new Error(`Device count mismatch for ${device}`);
      }
    }

    console.log('✅ Statistics calculation passed');
    return true;
  } catch (error: any) {
    console.error('❌ Statistics calculation failed:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('===========================================');
  console.log('Locale Export Service - Test Suite');
  console.log('APP-004: Locale-organized Export');
  console.log('===========================================');

  // Create output directory
  await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });

  const tests = [
    { name: 'Directory Export (Locale-First)', fn: testDirectoryExportLocaleFirst },
    { name: 'ZIP Export (Device-First)', fn: testZipExportDeviceFirst },
    { name: 'Flat Locale Organization', fn: testFlatLocaleOrganization },
    { name: 'Validation - Max Screenshots', fn: testValidationMaxScreenshots },
    { name: 'Validation - Duplicate Orders', fn: testValidationDuplicateOrders },
    { name: 'Custom Filename Template', fn: testCustomFilenameTemplate },
    { name: 'CSV Manifest Format', fn: testCSVManifestFormat },
    { name: 'Locale Metadata', fn: testLocaleMetadata },
    { name: 'Statistics Calculation', fn: testStatisticsCalculation },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const success = await test.fn();
    if (success) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n===========================================');
  console.log('Test Results');
  console.log('===========================================');
  console.log(`Total: ${tests.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed`);
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
