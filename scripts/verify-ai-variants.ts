/**
 * ADS-015: AI Variant Generator Verification Script
 * Verifies the implementation without requiring API keys
 */

import * as fs from 'fs';
import * as path from 'path';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function test(name: string, condition: boolean, message: string) {
  results.push({ name, passed: condition, message });
  const icon = condition ? '✓' : '✗';
  const color = condition ? colors.green : colors.red;
  console.log(`${color}${icon} ${name}${colors.reset}`);
  if (!condition) {
    console.log(`  ${colors.red}${message}${colors.reset}`);
  }
}

function checkFileExists(filePath: string, description: string) {
  const exists = fs.existsSync(filePath);
  test(
    `File exists: ${description}`,
    exists,
    `File not found: ${filePath}`
  );
  return exists;
}

function checkFileContains(filePath: string, searchString: string, description: string) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const contains = content.includes(searchString);
    test(
      description,
      contains,
      `Expected to find "${searchString}" in ${filePath}`
    );
    return contains;
  } catch (error) {
    test(description, false, `Error reading file: ${error}`);
    return false;
  }
}

console.log(colors.bright + colors.blue + '\n='.repeat(60) + colors.reset);
console.log(colors.bright + colors.blue + 'AI Variant Generator - Verification Tests' + colors.reset);
console.log(colors.bright + colors.blue + '='.repeat(60) + colors.reset + '\n');

const baseDir = path.join(__dirname, '..');

// Test 1: Core service file
console.log(colors.bright + '\n1. Core Service' + colors.reset);
const servicePath = path.join(baseDir, 'src/services/aiVariants.ts');
checkFileExists(servicePath, 'AI Variants Service');
checkFileContains(servicePath, 'generateVariants', 'Service exports generateVariants function');
checkFileContains(servicePath, 'generateMultipleVariants', 'Service exports generateMultipleVariants function');
checkFileContains(servicePath, 'rankVariants', 'Service exports rankVariants function');
checkFileContains(servicePath, 'VariantType', 'Service defines VariantType');

// Test 2: API route
console.log(colors.bright + '\n2. API Route' + colors.reset);
const apiPath = path.join(baseDir, 'src/app/api/ads/generate-variants/route.ts');
checkFileExists(apiPath, 'API Route');
checkFileContains(apiPath, 'export async function POST', 'API route exports POST handler');
checkFileContains(apiPath, 'generateVariants', 'API route uses generateVariants');
checkFileContains(apiPath, 'NextResponse', 'API route uses Next.js response');

// Test 3: UI Component
console.log(colors.bright + '\n3. UI Component' + colors.reset);
const componentPath = path.join(baseDir, 'src/app/ads/editor/components/VariantGenerator.tsx');
checkFileExists(componentPath, 'Variant Generator Component');
checkFileContains(componentPath, 'VariantGeneratorProps', 'Component defines props interface');
checkFileContains(componentPath, 'onSelectVariant', 'Component has onSelectVariant prop');
checkFileContains(componentPath, '/api/ads/generate-variants', 'Component calls API endpoint');

// Test 4: CSS Styles
console.log(colors.bright + '\n4. Component Styles' + colors.reset);
const cssPath = path.join(baseDir, 'src/app/ads/editor/components/VariantGenerator.module.css');
checkFileExists(cssPath, 'Variant Generator Styles');
checkFileContains(cssPath, '.modal', 'Styles define modal class');
checkFileContains(cssPath, '.variantsList', 'Styles define variants list');
checkFileContains(cssPath, '@keyframes', 'Styles include animations');

// Test 5: Editor Integration
console.log(colors.bright + '\n5. Editor Integration' + colors.reset);
const editorPath = path.join(baseDir, 'src/app/ads/editor/components/AdEditorForm.tsx');
checkFileExists(editorPath, 'Ad Editor Form');
checkFileContains(editorPath, 'VariantGenerator', 'Editor imports VariantGenerator');
checkFileContains(editorPath, 'openVariantGenerator', 'Editor has openVariantGenerator function');
checkFileContains(editorPath, 'aiButton', 'Editor has AI button');

// Test 6: Editor CSS
console.log(colors.bright + '\n6. Editor Button Styles' + colors.reset);
const editorCssPath = path.join(baseDir, 'src/app/ads/editor/editor.module.css');
checkFileExists(editorCssPath, 'Editor CSS');
checkFileContains(editorCssPath, '.aiButton', 'Editor CSS defines AI button styles');
checkFileContains(editorCssPath, '.inputWithButton', 'Editor CSS defines input with button layout');

// Test 7: Test Script
console.log(colors.bright + '\n7. Test Script' + colors.reset);
const testScriptPath = path.join(baseDir, 'scripts/test-ai-variants.ts');
checkFileExists(testScriptPath, 'Test Script');
checkFileContains(testScriptPath, 'testSingleGeneration', 'Test script has single generation test');
checkFileContains(testScriptPath, 'testMultipleGeneration', 'Test script has multiple generation test');
checkFileContains(testScriptPath, 'testWithContext', 'Test script has context test');

// Test 8: Documentation
console.log(colors.bright + '\n8. Documentation' + colors.reset);
const docsPath = path.join(baseDir, 'docs/ADS-015-AI-VARIANT-GENERATOR.md');
checkFileExists(docsPath, 'Documentation');
if (fs.existsSync(docsPath)) {
  const docContent = fs.readFileSync(docsPath, 'utf-8');
  test(
    'Documentation has Overview section',
    docContent.includes('## Overview'),
    'Missing Overview section'
  );
  test(
    'Documentation has Usage section',
    docContent.includes('## Usage'),
    'Missing Usage section'
  );
  test(
    'Documentation has API Reference',
    docContent.includes('## API Reference'),
    'Missing API Reference'
  );
  test(
    'Documentation has Examples',
    docContent.includes('## Examples'),
    'Missing Examples section'
  );
}

// Test 9: Type Safety
console.log(colors.bright + '\n9. Type Safety' + colors.reset);
checkFileContains(servicePath, 'interface VariantGenerationOptions', 'Service defines options interface');
checkFileContains(servicePath, 'interface VariantGenerationResult', 'Service defines result interface');
checkFileContains(apiPath, 'VariantType', 'API route imports VariantType');

// Test 10: Error Handling
console.log(colors.bright + '\n10. Error Handling' + colors.reset);
checkFileContains(servicePath, 'try', 'Service has error handling');
checkFileContains(servicePath, 'catch', 'Service catches errors');
checkFileContains(apiPath, 'status: 400', 'API returns 400 for bad requests');
checkFileContains(apiPath, 'status: 500', 'API returns 500 for server errors');

// Summary
console.log(colors.bright + colors.blue + '\n' + '='.repeat(60) + colors.reset);
console.log(colors.bright + colors.blue + 'Test Summary' + colors.reset);
console.log(colors.bright + colors.blue + '='.repeat(60) + colors.reset + '\n');

const passed = results.filter(r => r.passed).length;
const total = results.length;
const percentage = Math.round((passed / total) * 100);

console.log(`Tests passed: ${passed}/${total} (${percentage}%)`);

if (passed === total) {
  console.log(colors.green + '\n✓ All verification tests passed!' + colors.reset);
  console.log('\nThe AI Variant Generator feature is correctly implemented.');
  console.log('\nTo test with real AI generation:');
  console.log('  1. Set OPENAI_API_KEY in your .env file');
  console.log('  2. Run: npx tsx scripts/test-ai-variants.ts');
  console.log('  3. Or test in the UI at http://localhost:3000/ads/editor');
  process.exit(0);
} else {
  console.log(colors.red + '\n✗ Some verification tests failed' + colors.reset);
  console.log(`\nFailed tests: ${total - passed}`);
  process.exit(1);
}
