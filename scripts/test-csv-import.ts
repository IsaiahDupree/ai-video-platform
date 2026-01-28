/**
 * Test Script for ADS-012: CSV/Feed Batch Import
 *
 * This script tests the CSV import functionality by:
 * 1. Creating a sample CSV file with product data
 * 2. Setting up column mapping
 * 3. Importing and generating ads from the CSV
 * 4. Verifying output
 */

import {
  importFromCSV,
  previewCSVImport,
  getCSVHeaders,
  estimateCSVImport,
  parseCSVFile,
  validateCSVImportConfig,
  type CSVImportConfig,
  type ColumnMapping,
} from '../src/services/csvImport';
import { AdTemplate } from '../src/types/adTemplate';
import { mergeAdStyle } from '../src/types/adTemplate';
import fs from 'fs';
import path from 'path';

/**
 * Create sample CSV file for testing
 */
function createSampleCSV(): string {
  const csvData = [
    'product_id,product_name,tagline,description,price,image_url,cta_text',
    'PROD-001,Wireless Headphones,Premium Sound Quality,Experience crystal-clear audio with noise cancellation,$199,https://example.com/headphones.jpg,Shop Now',
    'PROD-002,Smart Watch,Your Health Companion,Track your fitness and stay connected all day,$299,https://example.com/watch.jpg,Learn More',
    'PROD-003,Laptop Stand,Ergonomic Design,Improve your posture and productivity,$49,https://example.com/stand.jpg,Buy Now',
    'PROD-004,USB-C Hub,Ultimate Connectivity,8-in-1 hub for all your devices,$79,https://example.com/hub.jpg,Get Yours',
    'PROD-005,Mechanical Keyboard,Type with Precision,Cherry MX switches for the best typing experience,$149,https://example.com/keyboard.jpg,Order Now',
  ].join('\n');

  const outputDir = path.join(process.cwd(), 'data', 'test-data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const csvPath = path.join(outputDir, 'sample-products.csv');
  fs.writeFileSync(csvPath, csvData);

  console.log(`✓ Sample CSV created: ${csvPath}`);
  return csvPath;
}

/**
 * Create base template for ads
 */
function createBaseTemplate(): AdTemplate {
  return {
    id: 'product-ad-template',
    name: 'Product Ad Template',
    description: 'Template for product advertisements',
    layout: 'product-showcase',
    dimensions: {
      width: 1080,
      height: 1080,
      name: 'Square 1:1',
      platform: 'Instagram',
    },
    content: {
      headline: 'Default Headline',
      subheadline: 'Default Tagline',
      body: 'Default description goes here',
      cta: 'Shop Now',
      backgroundColor: '#1e293b',
      logo: '/assets/logo.png',
      logoPosition: 'top-left',
      logoSize: 60,
    },
    style: mergeAdStyle({
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      textColor: '#ffffff',
      ctaBackgroundColor: '#3b82f6',
      ctaTextColor: '#ffffff',
      headlineSize: 56,
      bodySize: 24,
      padding: 60,
      gap: 24,
      borderRadius: 12,
      shadow: true,
    }),
  };
}

/**
 * Test 1: Validate CSV parsing
 */
async function test1_parseCSV(csvPath: string) {
  console.log('\n=== Test 1: Parse CSV ===');

  try {
    // Get headers
    const headers = getCSVHeaders(csvPath);
    console.log('CSV Headers:', headers);

    // Parse CSV
    const rows = parseCSVFile(csvPath);
    console.log(`✓ Parsed ${rows.length} rows`);
    console.log('First row:', rows[0]);

    return true;
  } catch (error) {
    console.error('✗ Test failed:', error);
    return false;
  }
}

/**
 * Test 2: Validate configuration
 */
async function test2_validateConfig(csvPath: string) {
  console.log('\n=== Test 2: Validate Configuration ===');

  try {
    const baseTemplate = createBaseTemplate();

    // Valid config
    const validConfig: CSVImportConfig = {
      filePath: csvPath,
      baseTemplate,
      columnMapping: {
        headline: 'product_name',
        subheadline: 'tagline',
        body: 'description',
        cta: 'cta_text',
        uniqueId: 'product_id',
      },
      output: {
        format: 'png',
        quality: 90,
      },
    };

    const validation = validateCSVImportConfig(validConfig);
    console.log('Validation result:', validation);
    console.log(`✓ Config is ${validation.valid ? 'valid' : 'invalid'}`);

    if (validation.warnings.length > 0) {
      console.log('Warnings:', validation.warnings);
    }

    return validation.valid;
  } catch (error) {
    console.error('✗ Test failed:', error);
    return false;
  }
}

/**
 * Test 3: Estimate import job
 */
async function test3_estimateJob(csvPath: string) {
  console.log('\n=== Test 3: Estimate Import Job ===');

  try {
    const baseTemplate = createBaseTemplate();

    const config: CSVImportConfig = {
      filePath: csvPath,
      baseTemplate,
      columnMapping: {
        headline: 'product_name',
        subheadline: 'tagline',
        body: 'description',
        cta: 'cta_text',
        uniqueId: 'product_id',
      },
      sizeIds: ['instagram-square', 'facebook-feed', 'instagram-story'],
      output: {
        format: 'jpeg',
        quality: 85,
      },
    };

    const estimate = estimateCSVImport(config);
    console.log('Estimate:');
    console.log(`  Total Rows: ${estimate.totalRows}`);
    console.log(`  Total Assets: ${estimate.totalAssets}`);
    console.log(`  Estimated Time: ${estimate.estimatedTimeSeconds}s (~${Math.ceil(estimate.estimatedTimeSeconds / 60)}m)`);
    console.log(`  Estimated Size: ${(estimate.estimatedSizeBytes / 1024 / 1024).toFixed(2)} MB`);

    return true;
  } catch (error) {
    console.error('✗ Test failed:', error);
    return false;
  }
}

/**
 * Test 4: Preview import (first 2 rows)
 */
async function test4_previewImport(csvPath: string) {
  console.log('\n=== Test 4: Preview Import ===');

  try {
    const baseTemplate = createBaseTemplate();

    const config: CSVImportConfig = {
      filePath: csvPath,
      baseTemplate,
      columnMapping: {
        headline: 'product_name',
        subheadline: 'tagline',
        body: 'description',
        cta: 'cta_text',
        uniqueId: 'product_id',
      },
      sizeIds: ['instagram-square'],
      output: {
        format: 'png',
        quality: 90,
      },
    };

    console.log('Generating preview for first 2 rows...');
    const previewAssets = await previewCSVImport(config, 2);

    console.log(`✓ Generated ${previewAssets.length} preview assets`);

    for (const asset of previewAssets) {
      console.log(`  Row ${asset.rowIndex}: ${asset.status}`);
      if (asset.status === 'completed') {
        console.log(`    File: ${asset.filePath}`);
        console.log(`    Size: ${((asset.fileSizeBytes || 0) / 1024).toFixed(2)} KB`);
      } else if (asset.error) {
        console.log(`    Error: ${asset.error}`);
      }
    }

    const allCompleted = previewAssets.every((a) => a.status === 'completed');
    return allCompleted;
  } catch (error) {
    console.error('✗ Test failed:', error);
    return false;
  }
}

/**
 * Test 5: Full import (limited rows)
 */
async function test5_fullImport(csvPath: string) {
  console.log('\n=== Test 5: Full Import (Limited) ===');

  try {
    const baseTemplate = createBaseTemplate();

    const config: CSVImportConfig = {
      filePath: csvPath,
      baseTemplate,
      columnMapping: {
        headline: 'product_name',
        subheadline: 'tagline',
        body: 'description',
        cta: 'cta_text',
        uniqueId: 'product_id',
      },
      sizeIds: ['instagram-square', 'facebook-feed'],
      output: {
        format: 'jpeg',
        quality: 85,
        includeManifest: true,
        createZip: true,
      },
      options: {
        maxRows: 3, // Only process first 3 rows
        skipInvalidRows: true,
      },
    };

    console.log('Starting import...');
    const job = await importFromCSV(config);

    console.log('\nJob Results:');
    console.log(`  Job ID: ${job.id}`);
    console.log(`  Status: ${job.status}`);
    console.log(`  Progress: ${job.progress}%`);
    console.log(`  Total Assets: ${job.totalCount}`);
    console.log(`  Completed: ${job.completedCount}`);
    console.log(`  Failed: ${job.failedCount}`);
    console.log(`  Skipped: ${job.skippedCount}`);

    if (job.outputDir) {
      console.log(`  Output Directory: ${job.outputDir}`);
    }

    if (job.zipFilePath) {
      console.log(`  ZIP File: ${job.zipFilePath}`);
    }

    // Show some asset details
    console.log('\nAsset Details:');
    const completedAssets = job.assets.filter((a) => a.status === 'completed');
    for (const asset of completedAssets.slice(0, 5)) {
      console.log(`  Row ${asset.rowIndex} - ${asset.sizeName}: ${asset.filePath}`);
    }

    return job.status === 'completed';
  } catch (error) {
    console.error('✗ Test failed:', error);
    return false;
  }
}

/**
 * Test 6: Import with missing columns (should handle gracefully)
 */
async function test6_missingColumns(csvPath: string) {
  console.log('\n=== Test 6: Handle Missing Columns ===');

  try {
    const baseTemplate = createBaseTemplate();

    // Map to non-existent columns - should use template defaults
    const config: CSVImportConfig = {
      filePath: csvPath,
      baseTemplate,
      columnMapping: {
        headline: 'product_name',
        subheadline: 'tagline',
        body: 'description',
        cta: 'cta_text',
        backgroundImage: 'nonexistent_column', // This doesn't exist
        uniqueId: 'product_id',
      },
      sizeIds: ['instagram-square'],
      output: {
        format: 'png',
        quality: 90,
      },
      options: {
        maxRows: 1,
        skipInvalidRows: false,
      },
    };

    console.log('Testing with non-existent column mapping...');
    const job = await importFromCSV(config);

    console.log(`  Status: ${job.status}`);
    console.log(`  Completed: ${job.completedCount}`);

    // Should still complete, just use template defaults for missing data
    return job.completedCount > 0;
  } catch (error) {
    console.error('✗ Test failed:', error);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('=================================');
  console.log('  CSV Import Service Tests');
  console.log('  ADS-012 Implementation');
  console.log('=================================');

  // Create sample CSV
  const csvPath = createSampleCSV();

  const results = {
    test1: await test1_parseCSV(csvPath),
    test2: await test2_validateConfig(csvPath),
    test3: await test3_estimateJob(csvPath),
    test4: await test4_previewImport(csvPath),
    test5: await test5_fullImport(csvPath),
    test6: await test6_missingColumns(csvPath),
  };

  // Summary
  console.log('\n=================================');
  console.log('  Test Summary');
  console.log('=================================');

  const testNames = {
    test1: 'Parse CSV',
    test2: 'Validate Configuration',
    test3: 'Estimate Job',
    test4: 'Preview Import',
    test5: 'Full Import',
    test6: 'Handle Missing Columns',
  };

  let passedCount = 0;
  let totalCount = 0;

  for (const [key, passed] of Object.entries(results)) {
    const testName = testNames[key as keyof typeof testNames];
    console.log(`${passed ? '✓' : '✗'} ${testName}`);
    if (passed) passedCount++;
    totalCount++;
  }

  console.log(`\nPassed: ${passedCount}/${totalCount}`);

  if (passedCount === totalCount) {
    console.log('\n✓ All tests passed! ADS-012 is working correctly.');
    return true;
  } else {
    console.log('\n✗ Some tests failed. Please review the output above.');
    return false;
  }
}

// Run tests
runAllTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
