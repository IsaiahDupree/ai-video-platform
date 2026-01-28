/**
 * ADS-015: AI Variant Generator Test Script
 * Tests the AI variant generation service
 */

import * as dotenv from 'dotenv';
import {
  generateVariants,
  generateMultipleVariants,
  rankVariants,
  VariantType,
} from '../src/services/aiVariants';

// Load environment variables
dotenv.config();

// Test data
const testCases = [
  {
    type: 'headline' as VariantType,
    text: 'Transform Your Business with AI-Powered Solutions',
    tone: 'professional' as const,
  },
  {
    type: 'subheadline' as VariantType,
    text: 'Automate workflows, boost productivity, and scale faster than ever before',
    tone: 'persuasive' as const,
  },
  {
    type: 'cta' as VariantType,
    text: 'Start Free Trial',
    tone: 'urgent' as const,
  },
  {
    type: 'headline' as VariantType,
    text: 'Shop the Summer Sale - Up to 50% Off',
    tone: 'casual' as const,
  },
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

/**
 * Print section header
 */
function printHeader(text: string) {
  console.log('\n' + colors.bright + colors.blue + '='.repeat(60) + colors.reset);
  console.log(colors.bright + colors.blue + text + colors.reset);
  console.log(colors.bright + colors.blue + '='.repeat(60) + colors.reset + '\n');
}

/**
 * Print test case info
 */
function printTestCase(testCase: typeof testCases[0], index: number) {
  console.log(colors.bright + `Test Case ${index + 1}: ${testCase.type}` + colors.reset);
  console.log(colors.cyan + `Original: "${testCase.text}"` + colors.reset);
  console.log(colors.yellow + `Tone: ${testCase.tone}` + colors.reset);
}

/**
 * Print variants with ranking
 */
function printVariants(original: string, variants: string[]) {
  const ranked = rankVariants(original, variants);

  console.log(colors.bright + '\nGenerated Variants (ranked by quality):' + colors.reset);
  ranked.forEach((item, index) => {
    const scoreColor = item.score >= 80 ? colors.green : item.score >= 60 ? colors.yellow : colors.reset;
    console.log(
      `\n${colors.magenta}${index + 1}.${colors.reset} ${item.variant}`
    );
    console.log(`   ${scoreColor}Score: ${item.score}/100${colors.reset}`);
  });
}

/**
 * Test single variant generation
 */
async function testSingleGeneration() {
  printHeader('Test 1: Single Variant Generation');

  const testCase = testCases[0];
  printTestCase(testCase, 0);

  try {
    const result = await generateVariants({
      originalText: testCase.text,
      type: testCase.type,
      count: 10,
      tone: testCase.tone,
    });

    console.log(colors.green + '\n✓ Generation successful!' + colors.reset);
    console.log(`Model: ${result.model}`);
    console.log(`Tokens used: ${result.usage?.totalTokens || 'N/A'}`);
    console.log(`Generated: ${result.variants.length} variants`);

    printVariants(result.originalText, result.variants);

    return true;
  } catch (error) {
    console.error(colors.red + '\n✗ Generation failed:' + colors.reset, error);
    return false;
  }
}

/**
 * Test multiple variant generation in parallel
 */
async function testMultipleGeneration() {
  printHeader('Test 2: Multiple Fields in Parallel');

  const fields = testCases.slice(0, 3).map((tc) => ({
    text: tc.text,
    type: tc.type,
    options: { tone: tc.tone },
  }));

  console.log(`Generating variants for ${fields.length} fields simultaneously...\n`);

  try {
    const startTime = Date.now();
    const results = await generateMultipleVariants(fields);
    const duration = Date.now() - startTime;

    console.log(colors.green + `\n✓ All generations completed in ${duration}ms` + colors.reset);

    results.forEach((result, index) => {
      console.log(
        `\n${colors.bright}${colors.cyan}Field ${index + 1}: ${result.type}${colors.reset}`
      );
      console.log(`Generated: ${result.variants.length} variants`);
      console.log(`Tokens: ${result.usage?.totalTokens || 'N/A'}`);
      console.log(`Top 3 variants:`);
      result.variants.slice(0, 3).forEach((v, i) => {
        console.log(`  ${i + 1}. ${v}`);
      });
    });

    return true;
  } catch (error) {
    console.error(colors.red + '\n✗ Generation failed:' + colors.reset, error);
    return false;
  }
}

/**
 * Test with brand context
 */
async function testWithContext() {
  printHeader('Test 3: Generation with Brand Context');

  const testCase = {
    type: 'headline' as VariantType,
    text: 'Discover Sustainable Fashion',
    tone: 'friendly' as const,
    brandVoice: 'eco-conscious, inspiring, authentic',
    industry: 'Fashion & Apparel',
    targetAudience: 'Environmentally conscious millennials',
  };

  console.log(colors.bright + 'Headline with Context' + colors.reset);
  console.log(colors.cyan + `Original: "${testCase.text}"` + colors.reset);
  console.log(colors.yellow + `Tone: ${testCase.tone}` + colors.reset);
  console.log(colors.yellow + `Brand Voice: ${testCase.brandVoice}` + colors.reset);
  console.log(colors.yellow + `Industry: ${testCase.industry}` + colors.reset);
  console.log(colors.yellow + `Target: ${testCase.targetAudience}` + colors.reset);

  try {
    const result = await generateVariants({
      originalText: testCase.text,
      type: testCase.type,
      count: 8,
      tone: testCase.tone,
      brandVoice: testCase.brandVoice,
      industry: testCase.industry,
      targetAudience: testCase.targetAudience,
    });

    console.log(colors.green + '\n✓ Generation successful!' + colors.reset);
    printVariants(result.originalText, result.variants);

    return true;
  } catch (error) {
    console.error(colors.red + '\n✗ Generation failed:' + colors.reset, error);
    return false;
  }
}

/**
 * Test all variant types
 */
async function testAllTypes() {
  printHeader('Test 4: All Variant Types');

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    printTestCase(testCase, i);

    try {
      const result = await generateVariants({
        originalText: testCase.text,
        type: testCase.type,
        count: 5,
        tone: testCase.tone,
      });

      console.log(colors.green + '✓ Success!' + colors.reset);
      console.log('Top 3 variants:');
      result.variants.slice(0, 3).forEach((v, idx) => {
        console.log(`  ${idx + 1}. ${v}`);
      });
      console.log('');
    } catch (error) {
      console.error(colors.red + '✗ Failed:' + colors.reset, error);
      return false;
    }
  }

  return true;
}

/**
 * Main test runner
 */
async function main() {
  console.log(colors.bright + colors.magenta + '\nAI Variant Generator Test Suite' + colors.reset);
  console.log(colors.bright + colors.magenta + '================================\n' + colors.reset);

  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error(colors.red + '✗ Error: OPENAI_API_KEY not found in environment' + colors.reset);
    console.log('\nPlease set your OpenAI API key:');
    console.log('  export OPENAI_API_KEY=your-key-here');
    process.exit(1);
  }

  console.log(colors.green + '✓ OpenAI API key found' + colors.reset);

  const tests = [
    { name: 'Single Generation', fn: testSingleGeneration },
    { name: 'Multiple Parallel', fn: testMultipleGeneration },
    { name: 'With Context', fn: testWithContext },
    { name: 'All Types', fn: testAllTypes },
  ];

  const results: boolean[] = [];

  for (const test of tests) {
    try {
      const success = await test.fn();
      results.push(success);

      // Wait between tests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(colors.red + `\n✗ Test "${test.name}" crashed:` + colors.reset, error);
      results.push(false);
    }
  }

  // Summary
  printHeader('Test Summary');
  const passed = results.filter((r) => r).length;
  const total = results.length;
  const color = passed === total ? colors.green : colors.yellow;

  console.log(color + `Passed: ${passed}/${total} tests` + colors.reset);

  if (passed === total) {
    console.log(colors.green + '\n✓ All tests passed!' + colors.reset);
    process.exit(0);
  } else {
    console.log(colors.yellow + '\n⚠ Some tests failed' + colors.reset);
    process.exit(1);
  }
}

// Run tests
main().catch((error) => {
  console.error(colors.red + 'Fatal error:' + colors.reset, error);
  process.exit(1);
});
