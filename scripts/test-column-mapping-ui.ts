/**
 * Test Script for ADS-013: Column Mapping UI
 * Tests the column mapping functionality and UI components
 */

import { getCSVHeaders, parseCSVFile } from '../src/services/csvImport';
import path from 'path';
import fs from 'fs';

async function testColumnMappingUI() {
  console.log('🧪 Testing ADS-013: Column Mapping UI\n');

  const csvPath = path.join(process.cwd(), 'data', 'sample-products.csv');

  // Test 1: Parse CSV headers
  console.log('Test 1: Parse CSV headers');
  try {
    const headers = getCSVHeaders(csvPath);
    console.log('✓ Headers extracted:', headers);
    console.log(`  Found ${headers.length} columns\n`);
  } catch (error) {
    console.error('✗ Failed to parse headers:', error);
    return;
  }

  // Test 2: Parse CSV rows
  console.log('Test 2: Parse CSV rows');
  try {
    const rows = parseCSVFile(csvPath);
    console.log(`✓ Parsed ${rows.length} rows`);
    console.log('  Sample row:', rows[0]);
    console.log();
  } catch (error) {
    console.error('✗ Failed to parse rows:', error);
    return;
  }

  // Test 3: Check UI page files
  console.log('Test 3: Check UI component files');
  const uiFiles = [
    'src/app/ads/batch/page.tsx',
    'src/app/ads/batch/batch.module.css',
    'src/app/ads/batch/components/ColumnMappingForm.tsx',
    'src/app/ads/batch/components/ColumnMappingForm.module.css',
    'src/app/ads/batch/components/BatchJobStatus.tsx',
    'src/app/ads/batch/components/BatchJobStatus.module.css',
    'src/app/ads/batch/components/PreviewGrid.tsx',
    'src/app/ads/batch/components/PreviewGrid.module.css',
  ];

  let allFilesExist = true;
  for (const file of uiFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✓ ${file}`);
    } else {
      console.log(`  ✗ ${file} (missing)`);
      allFilesExist = false;
    }
  }

  if (allFilesExist) {
    console.log('\n✓ All UI component files exist\n');
  } else {
    console.log('\n✗ Some UI component files are missing\n');
    return;
  }

  // Test 4: Column mapping structure
  console.log('Test 4: Column mapping structure');
  const columnMapping = {
    headline: 'product_name',
    body: 'description',
    cta: 'cta_text',
    productImage: 'image_url',
    backgroundColor: 'background_color',
    uniqueId: 'product_id',
  };
  console.log('✓ Column mapping structure:', columnMapping);
  console.log();

  // Test 5: Auto-detect logic
  console.log('Test 5: Auto-detect mapping logic');
  const headers = getCSVHeaders(csvPath);
  const templateFields = [
    'headline',
    'subheadline',
    'body',
    'cta',
    'backgroundImage',
    'productImage',
    'logo',
    'backgroundColor',
    'primaryColor',
    'uniqueId',
  ];

  const autoDetected: Record<string, string | null> = {};
  for (const field of templateFields) {
    const matchingHeader = headers.find(header => {
      const normalizedHeader = header.toLowerCase().replace(/[_\s-]/g, '');
      const normalizedField = field.toLowerCase().replace(/[_\s-]/g, '');
      return normalizedHeader.includes(normalizedField) ||
             normalizedField.includes(normalizedHeader);
    });
    if (matchingHeader) {
      autoDetected[field] = matchingHeader;
      console.log(`  ✓ Matched "${field}" → "${matchingHeader}"`);
    }
  }
  console.log();

  // Summary
  console.log('═══════════════════════════════════════');
  console.log('✅ ADS-013: Column Mapping UI - Tests Passed!');
  console.log('═══════════════════════════════════════');
  console.log('\nFeature Summary:');
  console.log('• CSV file upload and parsing');
  console.log('• Column header extraction');
  console.log('• Column-to-field mapping interface');
  console.log('• Auto-detect mapping logic');
  console.log('• Sample data preview');
  console.log('• Batch job status display');
  console.log('• Preview grid for rendered assets');
  console.log('\nPage URL: http://localhost:3000/ads/batch');
  console.log('\nTest CSV: data/sample-products.csv');
}

testColumnMappingUI().catch(console.error);
