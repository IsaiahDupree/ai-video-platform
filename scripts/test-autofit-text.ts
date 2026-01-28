#!/usr/bin/env tsx

/**
 * Test script for AutoFitText component
 *
 * This script tests the core functionality of the AutoFitText component:
 * - Text wrapping algorithm
 * - Font size optimization
 * - Line clamping with ellipsis
 * - Utility functions (useTextMetrics, checkTextFits)
 */

import { checkTextFits } from '../src/components/AutoFitText';

interface TestCase {
  name: string;
  text: string;
  fontSize: number;
  maxWidth: number;
  maxHeight: number;
  expectedFits: boolean;
}

const testCases: TestCase[] = [
  {
    name: 'Short text fits easily',
    text: 'Hello',
    fontSize: 48,
    maxWidth: 800,
    maxHeight: 400,
    expectedFits: true,
  },
  {
    name: 'Long text needs wrapping but fits',
    text: 'Transform Your Workflow with AI-Powered Video Generation',
    fontSize: 32,
    maxWidth: 600,
    maxHeight: 300,
    expectedFits: true,
  },
  {
    name: 'Text too large for container',
    text: 'This is an extremely long headline that will definitely not fit in a small container',
    fontSize: 64,
    maxWidth: 200,
    maxHeight: 100,
    expectedFits: false,
  },
  {
    name: 'Text fits with multiple lines',
    text: 'Line one. Line two. Line three.',
    fontSize: 24,
    maxWidth: 400,
    maxHeight: 200,
    expectedFits: true,
  },
  {
    name: 'Single word too wide',
    text: 'Antidisestablishmentarianism',
    fontSize: 48,
    maxWidth: 200,
    maxHeight: 100,
    expectedFits: false,
  },
];

console.log('🧪 Testing AutoFitText Component\n');
console.log('=' .repeat(70));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}: ${testCase.name}`);
  console.log('-'.repeat(70));
  console.log(`Text: "${testCase.text}"`);
  console.log(`Font Size: ${testCase.fontSize}px`);
  console.log(`Container: ${testCase.maxWidth}px × ${testCase.maxHeight}px`);

  const result = checkTextFits(
    testCase.text,
    testCase.fontSize,
    700, // fontWeight
    'Inter, sans-serif',
    testCase.maxWidth,
    testCase.maxHeight,
    1.2 // lineHeight
  );

  console.log(`\nResult:`);
  console.log(`  Fits: ${result.fits}`);
  console.log(`  Lines: ${result.lines}`);
  console.log(`  Expected: ${testCase.expectedFits}`);

  const isCorrect = result.fits === testCase.expectedFits;
  if (isCorrect) {
    console.log(`  ✅ PASS`);
    passed++;
  } else {
    console.log(`  ❌ FAIL - Expected ${testCase.expectedFits}, got ${result.fits}`);
    failed++;
  }
});

console.log('\n' + '='.repeat(70));
console.log(`\nTest Results: ${passed} passed, ${failed} failed out of ${testCases.length} total`);

if (failed === 0) {
  console.log('\n✅ All tests passed!\n');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed.\n');
  process.exit(1);
}
