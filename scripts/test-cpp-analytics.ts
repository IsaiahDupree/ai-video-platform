/**
 * APP-024: CPP Analytics Dashboard - Test Suite
 *
 * Comprehensive tests for CPP analytics functionality
 */

import {
  getCPPMetrics,
  getCPPPerformanceTimeSeries,
  getCPPAnalyticsBreakdown,
  compareCPPs,
  getTopPerformers,
  getCPPConversionFunnel,
  getCPPAnalyticsReport,
  getAppAnalyticsSummary,
  exportAnalytics,
  compareCPPToDefault,
} from '../src/services/cppAnalytics';
import type {
  CPPMetrics,
  CPPPerformanceTimeSeries,
  CPPAnalyticsBreakdown,
  CPPComparisonResults,
  CPPTopPerformers,
  CPPConversionFunnel,
  CPPAnalyticsReport,
  AppAnalyticsSummary,
  AnalyticsExportResult,
} from '../src/types/cppAnalytics';

/**
 * =============================================================================
 * TEST UTILITIES
 * =============================================================================
 */

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const testResults: TestResult[] = [];

function test(name: string, fn: () => void | Promise<void>): void {
  (async () => {
    try {
      await fn();
      testResults.push({
        name,
        passed: true,
        message: 'Test passed',
      });
    } catch (error) {
      testResults.push({
        name,
        passed: false,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  })();
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertExists<T>(value: T | null | undefined, message: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

/**
 * =============================================================================
 * TESTS
 * =============================================================================
 */

// Test 1: Get CPP Metrics
test('getCPPMetrics - should return valid metrics structure', async () => {
  const metrics = await getCPPMetrics('cpp-1', { period: '30d' });

  assertExists(metrics, 'Metrics should be returned');
  assert(typeof metrics.cppId === 'string', 'CPP ID should be a string');
  assert(typeof metrics.cppName === 'string', 'CPP name should be a string');
  assert(typeof metrics.impressions === 'number', 'Impressions should be a number');
  assert(typeof metrics.conversions === 'number', 'Conversions should be a number');
  assert(typeof metrics.conversionRate === 'number', 'Conversion rate should be a number');
  assert(metrics.impressions >= 0, 'Impressions should be non-negative');
  assert(metrics.conversions >= 0, 'Conversions should be non-negative');
  assert(metrics.conversionRate >= 0 && metrics.conversionRate <= 100, 'Conversion rate should be between 0 and 100');
});

// Test 2: Get CPP Metrics - different periods
test('getCPPMetrics - should work with different time periods', async () => {
  const periods: ('7d' | '14d' | '30d' | '90d')[] = ['7d', '14d', '30d', '90d'];

  for (const period of periods) {
    const metrics = await getCPPMetrics('cpp-1', { period });
    assertExists(metrics, `Metrics should be returned for period: ${period}`);
    assert(metrics.impressions > 0, `Should have impressions for period: ${period}`);
  }
});

// Test 3: Get CPP Metrics - change values
test('getCPPMetrics - should include change metrics', async () => {
  const metrics = await getCPPMetrics('cpp-1', { period: '30d' });

  assertExists(metrics.change, 'Change metrics should exist');
  assert(typeof metrics.change.impressions === 'number', 'Impressions change should be a number');
  assert(typeof metrics.change.conversions === 'number', 'Conversions change should be a number');
  assert(typeof metrics.change.conversionRate === 'number', 'Conversion rate change should be a number');
});

// Test 4: Get Performance Time Series
test('getCPPPerformanceTimeSeries - should return time series data', async () => {
  const timeSeries = await getCPPPerformanceTimeSeries('cpp-1', 'impressions', { period: '30d' });

  assertExists(timeSeries, 'Time series should be returned');
  assert(timeSeries.cppId === 'cpp-1', 'CPP ID should match');
  assert(timeSeries.metric === 'impressions', 'Metric should match');
  assert(Array.isArray(timeSeries.data), 'Data should be an array');
  assert(timeSeries.data.length > 0, 'Data array should not be empty');

  const firstPoint = timeSeries.data[0];
  assert(typeof firstPoint.date === 'string', 'Date should be a string');
  assert(typeof firstPoint.value === 'number', 'Value should be a number');
  assert(/^\d{4}-\d{2}-\d{2}$/.test(firstPoint.date), 'Date should be in YYYY-MM-DD format');
});

// Test 5: Get Performance Time Series - multiple metrics
test('getCPPPerformanceTimeSeries - should work for different metrics', async () => {
  const metrics: ('impressions' | 'conversions' | 'conversionRate')[] = ['impressions', 'conversions', 'conversionRate'];

  for (const metric of metrics) {
    const timeSeries = await getCPPPerformanceTimeSeries('cpp-1', metric, { period: '30d' });
    assertExists(timeSeries, `Time series should be returned for metric: ${metric}`);
    assert(timeSeries.metric === metric, `Metric should match: ${metric}`);
    assert(timeSeries.data.length > 0, `Data should exist for metric: ${metric}`);
  }
});

// Test 6: Get Analytics Breakdown
test('getCPPAnalyticsBreakdown - should return breakdown data', async () => {
  const breakdown = await getCPPAnalyticsBreakdown('cpp-1', { period: '30d' });

  assertExists(breakdown, 'Breakdown should be returned');
  assert(Array.isArray(breakdown.byDevice), 'Device breakdown should be an array');
  assert(Array.isArray(breakdown.byLocale), 'Locale breakdown should be an array');
  assert(Array.isArray(breakdown.bySource), 'Source breakdown should be an array');
  assert(breakdown.byDevice.length > 0, 'Device breakdown should not be empty');
  assert(breakdown.byLocale.length > 0, 'Locale breakdown should not be empty');
  assert(breakdown.bySource.length > 0, 'Source breakdown should not be empty');
});

// Test 7: Get Analytics Breakdown - device metrics
test('getCPPAnalyticsBreakdown - device metrics should be valid', async () => {
  const breakdown = await getCPPAnalyticsBreakdown('cpp-1', { period: '30d' });

  for (const device of breakdown.byDevice) {
    assert(typeof device.device === 'string', 'Device type should be a string');
    assert(device.impressions >= 0, 'Impressions should be non-negative');
    assert(device.conversions >= 0, 'Conversions should be non-negative');
    assert(device.conversionRate >= 0, 'Conversion rate should be non-negative');
    assert(device.percentage >= 0 && device.percentage <= 100, 'Percentage should be between 0 and 100');
  }
});

// Test 8: Get Analytics Breakdown - locale metrics
test('getCPPAnalyticsBreakdown - locale metrics should be valid', async () => {
  const breakdown = await getCPPAnalyticsBreakdown('cpp-1', { period: '30d' });

  for (const locale of breakdown.byLocale) {
    assert(typeof locale.locale === 'string', 'Locale code should be a string');
    assert(typeof locale.localeName === 'string', 'Locale name should be a string');
    assert(/^[a-z]{2}-[A-Z]{2}$/.test(locale.locale), 'Locale code should be in format: xx-XX');
    assert(locale.impressions >= 0, 'Impressions should be non-negative');
    assert(locale.conversions >= 0, 'Conversions should be non-negative');
  }
});

// Test 9: Compare CPPs
test('compareCPPs - should return comparison results', async () => {
  const comparison = await compareCPPs('app-1', undefined, { period: '30d' });

  assertExists(comparison, 'Comparison should be returned');
  assert(comparison.appId === 'app-1', 'App ID should match');
  assert(Array.isArray(comparison.comparisons), 'Comparisons should be an array');
  assert(comparison.comparisons.length > 0, 'Should have at least one comparison');
  assert(typeof comparison.bestCppId === 'string', 'Best CPP ID should be a string');
  assert(typeof comparison.totalImpressions === 'number', 'Total impressions should be a number');
  assert(typeof comparison.totalConversions === 'number', 'Total conversions should be a number');
  assert(typeof comparison.overallConversionRate === 'number', 'Overall CR should be a number');
});

// Test 10: Compare CPPs - winner detection
test('compareCPPs - should identify winner correctly', async () => {
  const comparison = await compareCPPs('app-1', undefined, { period: '30d' });

  const winners = comparison.comparisons.filter(c => c.isBest);
  assert(winners.length === 1, 'Should have exactly one winner');

  const winner = winners[0];
  assert(winner.cppId === comparison.bestCppId, 'Winner CPP ID should match best CPP ID');

  // Winner should have highest conversion rate
  const maxCR = Math.max(...comparison.comparisons.map(c => c.conversionRate));
  assert(winner.conversionRate === maxCR, 'Winner should have highest conversion rate');
});

// Test 11: Compare CPPs - relative performance
test('compareCPPs - should calculate relative performance correctly', async () => {
  const comparison = await compareCPPs('app-1', undefined, { period: '30d' });

  const winner = comparison.comparisons.find(c => c.isBest);
  assertExists(winner, 'Should have a winner');
  assert(winner.relativePerformance === 100, 'Winner should have 100% relative performance');

  for (const comp of comparison.comparisons) {
    assert(comp.relativePerformance > 0 && comp.relativePerformance <= 100, 'Relative performance should be between 0 and 100');
  }
});

// Test 12: Get Top Performers
test('getTopPerformers - should return top performers', async () => {
  const topPerformers = await getTopPerformers('app-1', 'conversionRate', { period: '30d', limit: 5 });

  assertExists(topPerformers, 'Top performers should be returned');
  assert(topPerformers.appId === 'app-1', 'App ID should match');
  assert(topPerformers.metricType === 'conversionRate', 'Metric type should match');
  assert(Array.isArray(topPerformers.rankings), 'Rankings should be an array');
  assert(topPerformers.rankings.length <= 5, 'Should have at most 5 rankings');
});

// Test 13: Get Top Performers - ranking order
test('getTopPerformers - rankings should be in correct order', async () => {
  const topPerformers = await getTopPerformers('app-1', 'conversionRate', { period: '30d' });

  for (let i = 0; i < topPerformers.rankings.length; i++) {
    const ranking = topPerformers.rankings[i];
    assert(ranking.rank === i + 1, `Ranking ${i} should have rank ${i + 1}`);
  }

  // Metric values should be in descending order (higher is better)
  for (let i = 0; i < topPerformers.rankings.length - 1; i++) {
    const current = topPerformers.rankings[i];
    const next = topPerformers.rankings[i + 1];
    assert(current.metricValue >= next.metricValue, 'Rankings should be in descending order by metric value');
  }
});

// Test 14: Get Conversion Funnel
test('getCPPConversionFunnel - should return funnel data', async () => {
  const funnel = await getCPPConversionFunnel('cpp-1', { period: '30d' });

  assertExists(funnel, 'Funnel should be returned');
  assert(funnel.cppId === 'cpp-1', 'CPP ID should match');
  assert(Array.isArray(funnel.stages), 'Stages should be an array');
  assert(funnel.stages.length > 0, 'Should have at least one stage');
  assert(typeof funnel.overallConversionRate === 'number', 'Overall CR should be a number');
});

// Test 15: Get Conversion Funnel - stage validation
test('getCPPConversionFunnel - funnel stages should be valid', async () => {
  const funnel = await getCPPConversionFunnel('cpp-1', { period: '30d' });

  // First stage should have 100% percentage
  const firstStage = funnel.stages[0];
  assert(firstStage.percentage === 100, 'First stage should have 100% percentage');

  // Subsequent stages should have decreasing counts
  for (let i = 0; i < funnel.stages.length - 1; i++) {
    const current = funnel.stages[i];
    const next = funnel.stages[i + 1];
    assert(current.count >= next.count, 'Funnel stages should have decreasing counts');
  }
});

// Test 16: Get Complete Analytics Report
test('getCPPAnalyticsReport - should return complete report', async () => {
  const report = await getCPPAnalyticsReport('cpp-1', {
    period: '30d',
    includeTimeSeries: true,
    includeBreakdown: true,
  });

  assertExists(report, 'Report should be returned');
  assert(typeof report.appId === 'string', 'App ID should exist');
  assert(typeof report.appName === 'string', 'App name should exist');
  assertExists(report.metrics, 'Metrics should be included');
  assertExists(report.breakdown, 'Breakdown should be included');
  assertExists(report.funnel, 'Funnel should be included');
  assertExists(report.timeSeries, 'Time series should be included');
  assert(Array.isArray(report.timeSeries), 'Time series should be an array');
  assert(typeof report.generatedAt === 'string', 'Generated at timestamp should exist');
});

// Test 17: Get App Analytics Summary
test('getAppAnalyticsSummary - should return app summary', async () => {
  const summary = await getAppAnalyticsSummary('app-1', { period: '30d' });

  assertExists(summary, 'Summary should be returned');
  assert(summary.appId === 'app-1', 'App ID should match');
  assert(typeof summary.totalCpps === 'number', 'Total CPPs should be a number');
  assert(typeof summary.activeCpps === 'number', 'Active CPPs should be a number');
  assertExists(summary.bestPerformer, 'Best performer should exist');
  assert(typeof summary.bestPerformer.cppId === 'string', 'Best performer CPP ID should exist');
  assert(typeof summary.bestPerformer.conversionRate === 'number', 'Best performer CR should exist');
  assertExists(summary.overall, 'Overall metrics should exist');
});

// Test 18: Export Analytics
test('exportAnalytics - should export analytics data', async () => {
  const exportResult = await exportAnalytics('cpp-1', {
    format: 'json',
    includeTimeSeries: true,
    includeBreakdown: true,
  });

  assertExists(exportResult, 'Export result should be returned');
  assert(typeof exportResult.success === 'boolean', 'Success flag should be boolean');
  if (exportResult.success) {
    assertExists(exportResult.filePath, 'File path should exist on success');
    assertExists(exportResult.fileSize, 'File size should exist on success');
  } else {
    assertExists(exportResult.error, 'Error message should exist on failure');
  }
});

// Test 19: Export Analytics - different formats
test('exportAnalytics - should support different export formats', async () => {
  const formats: ('json' | 'csv' | 'xlsx' | 'pdf')[] = ['json', 'csv', 'xlsx', 'pdf'];

  for (const format of formats) {
    const exportResult = await exportAnalytics('cpp-1', { format });
    assert(exportResult.success === true, `Export should succeed for format: ${format}`);
  }
});

// Test 20: Compare CPP to Default
test('compareCPPToDefault - should compare CPP against default page', async () => {
  const comparison = await compareCPPToDefault('cpp-1', 'app-1', { period: '30d' });

  assertExists(comparison, 'Comparison should be returned');
  assertExists(comparison.cpp, 'CPP metrics should exist');
  assertExists(comparison.default, 'Default metrics should exist');
  assert(typeof comparison.improvement === 'number', 'Improvement should be a number');
  assert(typeof comparison.isWinner === 'boolean', 'Winner flag should be boolean');

  // Validate consistency
  if (comparison.improvement > 0) {
    assert(comparison.isWinner === true, 'Should be winner if improvement is positive');
    assert(comparison.cpp.conversionRate > comparison.default.conversionRate, 'CPP CR should be higher than default if positive improvement');
  } else {
    assert(comparison.isWinner === false, 'Should not be winner if improvement is zero or negative');
  }
});

/**
 * =============================================================================
 * RUN TESTS
 * =============================================================================
 */

async function runTests() {
  console.log('🧪 Running CPP Analytics Tests...\n');

  // Wait for all tests to complete
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Print results
  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => r.passed === false).length;
  const total = testResults.length;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST RESULTS: ${passed}/${total} passed`);
  console.log(`${'='.repeat(60)}\n`);

  testResults.forEach((result, index) => {
    const status = result.passed ? '✅' : '❌';
    const number = `${index + 1}`.padStart(2, '0');
    console.log(`${status} Test ${number}: ${result.name}`);
    if (!result.passed) {
      console.log(`   Error: ${result.message}`);
    }
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Summary: ${passed} passed, ${failed} failed, ${total} total`);
  console.log(`${'='.repeat(60)}\n`);

  if (failed > 0) {
    console.log('⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
    process.exit(0);
  }
}

// Run tests
runTests();
