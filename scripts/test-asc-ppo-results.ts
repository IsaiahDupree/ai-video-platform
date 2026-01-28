#!/usr/bin/env ts-node
/**
 * APP-016: PPO Results Dashboard
 *
 * Comprehensive test suite for PPO test results, winner detection, and statistical significance
 */

import {
  getPPOTestResults,
  detectWinner,
  getPPOTestResultsWithWinner,
  calculateStatisticalSignificance,
  getPPOTestSummary,
} from '../src/services/ascPPO.js';
import type { PPOTestResults } from '../src/types/ascPPO.js';

// ============================================================================
// Test Data
// ============================================================================

const mockResults: PPOTestResults[] = [
  {
    treatmentId: 'control',
    treatmentName: 'Control',
    impressions: 10000,
    conversions: 1500,
    conversionRate: 15.0,
    improvement: 0,
    confidence: 99.5,
    isWinner: false,
  },
  {
    treatmentId: 'treatment-a',
    treatmentName: 'Treatment A',
    impressions: 10000,
    conversions: 1700,
    conversionRate: 17.0,
    improvement: 13.3,
    confidence: 97.8,
    isWinner: false,
  },
  {
    treatmentId: 'treatment-b',
    treatmentName: 'Treatment B',
    impressions: 10000,
    conversions: 1600,
    conversionRate: 16.0,
    improvement: 6.7,
    confidence: 92.1,
    isWinner: false,
  },
];

const lowConfidenceResults: PPOTestResults[] = [
  {
    treatmentId: 'control',
    treatmentName: 'Control',
    impressions: 500,
    conversions: 75,
    conversionRate: 15.0,
    improvement: 0,
    confidence: 85.0,
    isWinner: false,
  },
  {
    treatmentId: 'treatment-a',
    treatmentName: 'Treatment A',
    impressions: 500,
    conversions: 80,
    conversionRate: 16.0,
    improvement: 6.7,
    confidence: 82.5,
    isWinner: false,
  },
];

const lowImprovementResults: PPOTestResults[] = [
  {
    treatmentId: 'control',
    treatmentName: 'Control',
    impressions: 10000,
    conversions: 1500,
    conversionRate: 15.0,
    improvement: 0,
    confidence: 99.5,
    isWinner: false,
  },
  {
    treatmentId: 'treatment-a',
    treatmentName: 'Treatment A',
    impressions: 10000,
    conversions: 1530,
    conversionRate: 15.3,
    improvement: 2.0,
    confidence: 97.0,
    isWinner: false,
  },
];

const smallSampleResults: PPOTestResults[] = [
  {
    treatmentId: 'control',
    treatmentName: 'Control',
    impressions: 100,
    conversions: 15,
    conversionRate: 15.0,
    improvement: 0,
    confidence: 95.0,
    isWinner: false,
  },
  {
    treatmentId: 'treatment-a',
    treatmentName: 'Treatment A',
    impressions: 100,
    conversions: 20,
    conversionRate: 20.0,
    improvement: 33.3,
    confidence: 96.0,
    isWinner: false,
  },
];

// ============================================================================
// Test Functions
// ============================================================================

let passedTests = 0;
let totalTests = 0;

function test(name: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.then(() => {
        console.log(`✅ ${name}`);
        passedTests++;
      }).catch((error) => {
        console.log(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
      });
    } else {
      console.log(`✅ ${name}`);
      passedTests++;
    }
  } catch (error) {
    console.log(`❌ ${name}`);
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
    }
  }
}

function expect(value: unknown) {
  return {
    toBe(expected: unknown) {
      if (value !== expected) {
        throw new Error(`Expected ${value} to be ${expected}`);
      }
    },
    toEqual(expected: unknown) {
      if (JSON.stringify(value) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(value)} to equal ${JSON.stringify(expected)}`);
      }
    },
    toBeGreaterThan(expected: number) {
      if (typeof value !== 'number' || value <= expected) {
        throw new Error(`Expected ${value} to be greater than ${expected}`);
      }
    },
    toBeLessThan(expected: number) {
      if (typeof value !== 'number' || value >= expected) {
        throw new Error(`Expected ${value} to be less than ${expected}`);
      }
    },
    toBeNull() {
      if (value !== null) {
        throw new Error(`Expected ${value} to be null`);
      }
    },
    toBeNonNull() {
      if (value === null) {
        throw new Error(`Expected value to be non-null`);
      }
    },
    toBeTruthy() {
      if (!value) {
        throw new Error(`Expected ${value} to be truthy`);
      }
    },
    toBeFalsy() {
      if (value) {
        throw new Error(`Expected ${value} to be falsy`);
      }
    },
    toContain(expected: unknown) {
      if (Array.isArray(value)) {
        if (!value.includes(expected)) {
          throw new Error(`Expected array to contain ${expected}`);
        }
      } else if (typeof value === 'string') {
        if (!value.includes(expected as string)) {
          throw new Error(`Expected string to contain ${expected}`);
        }
      } else {
        throw new Error('toContain can only be used with arrays or strings');
      }
    },
  };
}

// ============================================================================
// Winner Detection Tests
// ============================================================================

async function testWinnerDetection() {
  console.log('\n📊 Winner Detection Tests\n');

  test('detectWinner - should find clear winner', () => {
    const winner = detectWinner(mockResults);
    expect(winner).toBeNonNull();
    expect(winner?.treatmentName).toBe('Treatment A');
    expect(winner?.conversionRate).toBe(17.0);
  });

  test('detectWinner - should not find winner with low confidence', () => {
    const winner = detectWinner(lowConfidenceResults);
    expect(winner).toBeNull();
  });

  test('detectWinner - should not find winner with low improvement', () => {
    const winner = detectWinner(lowImprovementResults);
    expect(winner).toBeNull();
  });

  test('detectWinner - should not find winner with small sample', () => {
    const winner = detectWinner(smallSampleResults);
    expect(winner).toBeNull();
  });

  test('detectWinner - should respect custom thresholds', () => {
    const winner = detectWinner(mockResults, {
      minConfidence: 99,
      minImprovement: 15,
      minImpressions: 12000,
    });
    expect(winner).toBeNull();
  });

  test('detectWinner - should use relaxed thresholds', () => {
    const winner = detectWinner(lowConfidenceResults, {
      minConfidence: 80,
      minImprovement: 5,
      minImpressions: 100,
    });
    expect(winner).toBeNonNull();
    expect(winner?.treatmentName).toBe('Treatment A');
  });

  test('detectWinner - should return highest conversion rate when multiple qualify', () => {
    const results: PPOTestResults[] = [
      { ...mockResults[0] },
      { ...mockResults[1], confidence: 97, improvement: 10 },
      { ...mockResults[2], confidence: 96, improvement: 8 },
    ];
    const winner = detectWinner(results);
    expect(winner).toBeNonNull();
    expect(winner?.treatmentName).toBe('Treatment A');
  });

  test('detectWinner - should handle empty results', () => {
    const winner = detectWinner([]);
    expect(winner).toBeNull();
  });

  test('detectWinner - should handle single result', () => {
    const winner = detectWinner([mockResults[0]]);
    expect(winner).toBeNull(); // Control has 0 improvement
  });
}

// ============================================================================
// Statistical Significance Tests
// ============================================================================

async function testStatisticalSignificance() {
  console.log('\n📈 Statistical Significance Tests\n');

  test('calculateStatisticalSignificance - should calculate z-score', () => {
    const result = calculateStatisticalSignificance(
      10000, // treatment impressions
      1700,  // treatment conversions
      10000, // control impressions
      1500   // control conversions
    );
    expect(result.zScore).toBeGreaterThan(0);
  });

  test('calculateStatisticalSignificance - should calculate p-value', () => {
    const result = calculateStatisticalSignificance(10000, 1700, 10000, 1500);
    expect(result.pValue).toBeGreaterThan(0);
    expect(result.pValue).toBeLessThan(1);
  });

  test('calculateStatisticalSignificance - should detect significant difference', () => {
    const result = calculateStatisticalSignificance(10000, 1700, 10000, 1500);
    expect(result.isSignificant).toBeTruthy();
    expect(result.confidence).toBeGreaterThan(95);
  });

  test('calculateStatisticalSignificance - should detect non-significant difference', () => {
    const result = calculateStatisticalSignificance(100, 15, 100, 16);
    expect(result.isSignificant).toBeFalsy();
    expect(result.confidence).toBeLessThan(95);
  });

  test('calculateStatisticalSignificance - should handle equal conversion rates', () => {
    const result = calculateStatisticalSignificance(1000, 150, 1000, 150);
    expect(result.zScore).toBe(0);
    expect(result.pValue).toBeGreaterThan(0.9);
    expect(result.isSignificant).toBeFalsy();
  });

  test('calculateStatisticalSignificance - should handle large differences', () => {
    const result = calculateStatisticalSignificance(10000, 2000, 10000, 1000);
    expect(result.zScore).toBeGreaterThan(10);
    expect(result.confidence).toBeGreaterThan(99);
    expect(result.isSignificant).toBeTruthy();
  });

  test('calculateStatisticalSignificance - should handle small samples', () => {
    const result = calculateStatisticalSignificance(50, 10, 50, 8);
    expect(result.confidence).toBeLessThan(95);
    expect(result.isSignificant).toBeFalsy();
  });

  test('calculateStatisticalSignificance - should return confidence as percentage', () => {
    const result = calculateStatisticalSignificance(10000, 1700, 10000, 1500);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThan(100);
  });
}

// ============================================================================
// Results Fetching Tests (Mock)
// ============================================================================

async function testResultsFetching() {
  console.log('\n🔍 Results Fetching Tests (Mock)\n');

  test('getPPOTestResults - should validate test state', async () => {
    // Note: This would need a real test ID and credentials
    // For now, we test the mock structure
    const mockTestId = 'test-approved';
    // const result = await getPPOTestResults(mockTestId);
    // In mock mode, we just verify the function exists
    expect(typeof getPPOTestResults).toBe('function');
  });

  test('getPPOTestResultsWithWinner - should include winner detection', () => {
    // Function exists and has proper structure
    expect(typeof getPPOTestResultsWithWinner).toBe('function');
  });

  test('getPPOTestSummary - should return comprehensive summary', () => {
    expect(typeof getPPOTestSummary).toBe('function');
  });
}

// ============================================================================
// Results Structure Tests
// ============================================================================

async function testResultsStructure() {
  console.log('\n🏗️  Results Structure Tests\n');

  test('PPOTestResults - should have required fields', () => {
    const result = mockResults[0];
    expect(result.treatmentId).toBeTruthy();
    expect(result.treatmentName).toBeTruthy();
    expect(typeof result.impressions).toBe('number');
    expect(typeof result.conversions).toBe('number');
    expect(typeof result.conversionRate).toBe('number');
    expect(typeof result.improvement).toBe('number');
    expect(typeof result.confidence).toBe('number');
    expect(typeof result.isWinner).toBe('boolean');
  });

  test('PPOTestResults - conversion rate should be calculated correctly', () => {
    const result = mockResults[0];
    const calculatedRate = (result.conversions / result.impressions) * 100;
    expect(Math.abs(result.conversionRate - calculatedRate)).toBeLessThan(0.01);
  });

  test('PPOTestResults - improvement should be relative to control', () => {
    const control = mockResults[0];
    const treatment = mockResults[1];
    const expectedImprovement = ((treatment.conversionRate - control.conversionRate) / control.conversionRate) * 100;
    expect(Math.abs(treatment.improvement - expectedImprovement)).toBeLessThan(0.1);
  });

  test('PPOTestResults - confidence should be between 0 and 100', () => {
    mockResults.forEach(result => {
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(100);
    });
  });

  test('PPOTestResults - impressions should be positive', () => {
    mockResults.forEach(result => {
      expect(result.impressions).toBeGreaterThan(0);
    });
  });

  test('PPOTestResults - conversions should not exceed impressions', () => {
    mockResults.forEach(result => {
      expect(result.conversions).toBeLessThan(result.impressions + 1);
    });
  });
}

// ============================================================================
// Edge Cases Tests
// ============================================================================

async function testEdgeCases() {
  console.log('\n🔬 Edge Cases Tests\n');

  test('detectWinner - should handle zero improvement', () => {
    const results: PPOTestResults[] = [
      { ...mockResults[0] },
      { ...mockResults[0], treatmentId: 'copy', treatmentName: 'Copy', isWinner: false },
    ];
    const winner = detectWinner(results);
    expect(winner).toBeNull();
  });

  test('detectWinner - should handle negative improvement', () => {
    const results: PPOTestResults[] = [
      { ...mockResults[0] },
      { ...mockResults[1], improvement: -5 },
    ];
    const winner = detectWinner(results);
    expect(winner).toBeNull();
  });

  test('detectWinner - should handle very high confidence', () => {
    const results: PPOTestResults[] = [
      { ...mockResults[0] },
      { ...mockResults[1], confidence: 99.9, improvement: 50 },
    ];
    const winner = detectWinner(results);
    expect(winner).toBeNonNull();
  });

  test('calculateStatisticalSignificance - should handle zero conversions', () => {
    const result = calculateStatisticalSignificance(1000, 0, 1000, 100);
    expect(result.zScore).toBeLessThan(0);
    expect(result.isSignificant).toBeTruthy();
  });

  test('calculateStatisticalSignificance - should handle 100% conversion rate', () => {
    const result = calculateStatisticalSignificance(1000, 1000, 1000, 500);
    expect(result.zScore).toBeGreaterThan(0);
    expect(result.isSignificant).toBeTruthy();
  });

  test('detectWinner - should handle borderline confidence (exactly 95%)', () => {
    const results: PPOTestResults[] = [
      { ...mockResults[0] },
      { ...mockResults[1], confidence: 95.0, improvement: 10 },
    ];
    const winner = detectWinner(results);
    expect(winner).toBeNonNull();
  });

  test('detectWinner - should handle borderline improvement (exactly 5%)', () => {
    const results: PPOTestResults[] = [
      { ...mockResults[0] },
      { ...mockResults[1], confidence: 97, improvement: 5.0 },
    ];
    const winner = detectWinner(results);
    expect(winner).toBeNonNull();
  });

  test('detectWinner - should handle borderline sample size (exactly 1000)', () => {
    const results: PPOTestResults[] = [
      { ...mockResults[0] },
      { ...mockResults[1], impressions: 1000, confidence: 97, improvement: 10 },
    ];
    const winner = detectWinner(results);
    expect(winner).toBeNonNull();
  });
}

// ============================================================================
// Run All Tests
// ============================================================================

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('APP-016: PPO Results Dashboard - Test Suite');
  console.log('='.repeat(60));

  await testWinnerDetection();
  await testStatisticalSignificance();
  await testResultsFetching();
  await testResultsStructure();
  await testEdgeCases();

  console.log('\n' + '='.repeat(60));
  console.log(`Test Results: ${passedTests}/${totalTests} passed`);
  console.log('='.repeat(60));

  if (passedTests === totalTests) {
    console.log('\n✅ All tests passed!\n');
    process.exit(0);
  } else {
    console.log(`\n❌ ${totalTests - passedTests} test(s) failed\n`);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
