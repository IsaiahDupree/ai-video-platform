/**
 * APP-013: Locale Comparison View - Test Suite
 * Tests for side-by-side locale comparison functionality
 */

import type { Asset, AppInfo } from '@/types/assetLibrary';
import type { AppStoreLocale } from '@/types/localeExport';

// ============================================================================
// Test Data Generation
// ============================================================================

function generateMockApp(id: string): AppInfo {
  return {
    id,
    name: `Test App ${id}`,
    bundleId: `com.test.app${id}`,
    platform: 'ios',
    description: `Test application ${id}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function generateMockAsset(
  appId: string,
  locale: AppStoreLocale,
  deviceType: string,
  index: number
): Asset {
  return {
    id: `asset-${appId}-${locale}-${deviceType}-${index}`,
    appId,
    name: `Screenshot ${index} - ${locale}`,
    description: `${deviceType} screenshot for ${locale}`,
    type: 'screenshot',
    status: 'approved',
    filePath: `/mock/screenshots/${locale}/${deviceType}/${index}.png`,
    fileName: `screenshot-${index}.png`,
    fileSize: 1024 * 500,
    mimeType: 'image/png',
    format: 'png',
    width: 1290,
    height: 2796,
    locale,
    deviceType,
    tags: [deviceType, locale],
    version: 1,
    versionHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function generateMockAssets(appId: string, locales: AppStoreLocale[], deviceTypes: string[]): Asset[] {
  const assets: Asset[] = [];

  locales.forEach(locale => {
    deviceTypes.forEach(deviceType => {
      for (let i = 1; i <= 5; i++) {
        assets.push(generateMockAsset(appId, locale, deviceType, i));
      }
    });
  });

  return assets;
}

// ============================================================================
// Filtering Functions
// ============================================================================

function filterAssetsByLocale(assets: Asset[], locale: AppStoreLocale): Asset[] {
  return assets.filter(asset => asset.locale === locale);
}

function filterAssetsByDeviceType(assets: Asset[], deviceType: string): Asset[] {
  if (deviceType === 'all') return assets;
  return assets.filter(asset => asset.deviceType === deviceType);
}

function groupAssetsByLocale(assets: Asset[]): Record<AppStoreLocale, Asset[]> {
  const grouped: Record<string, Asset[]> = {};

  assets.forEach(asset => {
    if (asset.locale) {
      if (!grouped[asset.locale]) {
        grouped[asset.locale] = [];
      }
      grouped[asset.locale].push(asset);
    }
  });

  return grouped;
}

function getAvailableLocales(assets: Asset[]): AppStoreLocale[] {
  const locales = new Set<AppStoreLocale>();
  assets.forEach(asset => {
    if (asset.locale) {
      locales.add(asset.locale);
    }
  });
  return Array.from(locales).sort();
}

function getAvailableDeviceTypes(assets: Asset[]): string[] {
  const types = new Set<string>();
  assets.forEach(asset => {
    if (asset.deviceType) {
      types.add(asset.deviceType);
    }
  });
  return Array.from(types).sort();
}

// ============================================================================
// Comparison Functions
// ============================================================================

interface ComparisonData {
  locale: AppStoreLocale;
  assets: Asset[];
  count: number;
}

function prepareComparison(
  assets: Asset[],
  selectedLocales: AppStoreLocale[],
  deviceTypeFilter: string
): ComparisonData[] {
  const comparison: ComparisonData[] = [];

  selectedLocales.forEach(locale => {
    let localeAssets = filterAssetsByLocale(assets, locale);
    localeAssets = filterAssetsByDeviceType(localeAssets, deviceTypeFilter);
    localeAssets = localeAssets.filter(a => a.type === 'screenshot');

    comparison.push({
      locale,
      assets: localeAssets.sort((a, b) => a.name.localeCompare(b.name)),
      count: localeAssets.length,
    });
  });

  return comparison;
}

function getMaxScreenshotCount(comparison: ComparisonData[]): number {
  return Math.max(...comparison.map(c => c.count), 0);
}

function hasScreenshotAtIndex(comparison: ComparisonData[], locale: AppStoreLocale, index: number): boolean {
  const data = comparison.find(c => c.locale === locale);
  return data ? index < data.assets.length : false;
}

// ============================================================================
// Statistics Functions
// ============================================================================

interface ComparisonStatistics {
  totalAssets: number;
  totalLocales: number;
  averageAssetsPerLocale: number;
  deviceTypeCoverage: Record<string, number>;
  localeCoverage: Record<AppStoreLocale, number>;
}

function calculateStatistics(assets: Asset[]): ComparisonStatistics {
  const locales = getAvailableLocales(assets);
  const grouped = groupAssetsByLocale(assets);

  const deviceTypeCoverage: Record<string, number> = {};
  assets.forEach(asset => {
    if (asset.deviceType) {
      deviceTypeCoverage[asset.deviceType] = (deviceTypeCoverage[asset.deviceType] || 0) + 1;
    }
  });

  const localeCoverage: Record<string, number> = {};
  locales.forEach(locale => {
    localeCoverage[locale] = grouped[locale]?.length || 0;
  });

  return {
    totalAssets: assets.filter(a => a.type === 'screenshot').length,
    totalLocales: locales.length,
    averageAssetsPerLocale: assets.length / Math.max(locales.length, 1),
    deviceTypeCoverage,
    localeCoverage,
  };
}

// ============================================================================
// Tests
// ============================================================================

function runTests() {
  console.log('APP-013: Locale Comparison View - Test Suite\n');

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}`);
      console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
      failed++;
    }
  }

  // Test 1: Generate mock data
  test('Generate mock app', () => {
    const app = generateMockApp('app-1');
    if (!app.id || !app.name || !app.bundleId) {
      throw new Error('Invalid app structure');
    }
  });

  // Test 2: Generate mock assets
  test('Generate mock assets', () => {
    const assets = generateMockAssets('app-1', ['en-US', 'es-ES'], ['iPhone', 'iPad']);
    if (assets.length !== 20) { // 2 locales × 2 devices × 5 screenshots
      throw new Error(`Expected 20 assets, got ${assets.length}`);
    }
  });

  // Test 3: Filter by locale
  test('Filter assets by locale', () => {
    const assets = generateMockAssets('app-1', ['en-US', 'es-ES', 'fr-FR'], ['iPhone']);
    const filtered = filterAssetsByLocale(assets, 'en-US');
    if (filtered.length !== 5) {
      throw new Error(`Expected 5 assets for en-US, got ${filtered.length}`);
    }
    if (!filtered.every(a => a.locale === 'en-US')) {
      throw new Error('Not all filtered assets have en-US locale');
    }
  });

  // Test 4: Filter by device type
  test('Filter assets by device type', () => {
    const assets = generateMockAssets('app-1', ['en-US'], ['iPhone', 'iPad', 'Mac']);
    const filtered = filterAssetsByDeviceType(assets, 'iPhone');
    if (filtered.length !== 5) {
      throw new Error(`Expected 5 iPhone assets, got ${filtered.length}`);
    }
    if (!filtered.every(a => a.deviceType === 'iPhone')) {
      throw new Error('Not all filtered assets are iPhone type');
    }
  });

  // Test 5: Filter all device types
  test('Filter all device types', () => {
    const assets = generateMockAssets('app-1', ['en-US'], ['iPhone', 'iPad']);
    const filtered = filterAssetsByDeviceType(assets, 'all');
    if (filtered.length !== 10) {
      throw new Error(`Expected 10 assets with 'all' filter, got ${filtered.length}`);
    }
  });

  // Test 6: Group by locale
  test('Group assets by locale', () => {
    const assets = generateMockAssets('app-1', ['en-US', 'es-ES', 'fr-FR'], ['iPhone']);
    const grouped = groupAssetsByLocale(assets);
    if (Object.keys(grouped).length !== 3) {
      throw new Error(`Expected 3 locale groups, got ${Object.keys(grouped).length}`);
    }
    if (grouped['en-US'].length !== 5) {
      throw new Error('Invalid grouping');
    }
  });

  // Test 7: Get available locales
  test('Get available locales', () => {
    const assets = generateMockAssets('app-1', ['en-US', 'es-ES', 'ja', 'zh-Hans'], ['iPhone']);
    const locales = getAvailableLocales(assets);
    if (locales.length !== 4) {
      throw new Error(`Expected 4 locales, got ${locales.length}`);
    }
    if (!locales.includes('ja')) {
      throw new Error('Missing expected locale');
    }
  });

  // Test 8: Get available device types
  test('Get available device types', () => {
    const assets = generateMockAssets('app-1', ['en-US'], ['iPhone', 'iPad', 'Mac', 'Watch']);
    const types = getAvailableDeviceTypes(assets);
    if (types.length !== 4) {
      throw new Error(`Expected 4 device types, got ${types.length}`);
    }
  });

  // Test 9: Prepare comparison
  test('Prepare comparison data', () => {
    const assets = generateMockAssets('app-1', ['en-US', 'es-ES', 'fr-FR'], ['iPhone', 'iPad']);
    const comparison = prepareComparison(assets, ['en-US', 'es-ES'], 'all');
    if (comparison.length !== 2) {
      throw new Error(`Expected 2 comparison entries, got ${comparison.length}`);
    }
    if (comparison[0].count !== 10) { // 2 devices × 5 screenshots
      throw new Error(`Expected 10 assets per locale, got ${comparison[0].count}`);
    }
  });

  // Test 10: Prepare comparison with device filter
  test('Prepare comparison with device filter', () => {
    const assets = generateMockAssets('app-1', ['en-US', 'es-ES'], ['iPhone', 'iPad']);
    const comparison = prepareComparison(assets, ['en-US'], 'iPhone');
    if (comparison[0].count !== 5) {
      throw new Error(`Expected 5 iPhone assets, got ${comparison[0].count}`);
    }
  });

  // Test 11: Get max screenshot count
  test('Get max screenshot count', () => {
    const assets = generateMockAssets('app-1', ['en-US', 'es-ES'], ['iPhone']);
    const comparison = prepareComparison(assets, ['en-US', 'es-ES'], 'all');
    const max = getMaxScreenshotCount(comparison);
    if (max !== 5) {
      throw new Error(`Expected max count of 5, got ${max}`);
    }
  });

  // Test 12: Has screenshot at index
  test('Check screenshot at index', () => {
    const assets = generateMockAssets('app-1', ['en-US'], ['iPhone']);
    const comparison = prepareComparison(assets, ['en-US'], 'all');
    if (!hasScreenshotAtIndex(comparison, 'en-US', 0)) {
      throw new Error('Should have screenshot at index 0');
    }
    if (hasScreenshotAtIndex(comparison, 'en-US', 10)) {
      throw new Error('Should not have screenshot at index 10');
    }
  });

  // Test 13: Calculate statistics
  test('Calculate comparison statistics', () => {
    const assets = generateMockAssets('app-1', ['en-US', 'es-ES', 'fr-FR'], ['iPhone', 'iPad']);
    const stats = calculateStatistics(assets);
    if (stats.totalAssets !== 30) { // 3 locales × 2 devices × 5 screenshots
      throw new Error(`Expected 30 total assets, got ${stats.totalAssets}`);
    }
    if (stats.totalLocales !== 3) {
      throw new Error(`Expected 3 locales, got ${stats.totalLocales}`);
    }
  });

  // Test 14: Device type coverage
  test('Calculate device type coverage', () => {
    const assets = generateMockAssets('app-1', ['en-US', 'es-ES'], ['iPhone', 'iPad']);
    const stats = calculateStatistics(assets);
    if (stats.deviceTypeCoverage['iPhone'] !== 10) { // 2 locales × 5 screenshots
      throw new Error('Invalid iPhone coverage');
    }
    if (stats.deviceTypeCoverage['iPad'] !== 10) {
      throw new Error('Invalid iPad coverage');
    }
  });

  // Test 15: Locale coverage
  test('Calculate locale coverage', () => {
    const assets = generateMockAssets('app-1', ['en-US', 'es-ES', 'fr-FR'], ['iPhone']);
    const stats = calculateStatistics(assets);
    if (stats.localeCoverage['en-US'] !== 5) {
      throw new Error('Invalid en-US coverage');
    }
  });

  // Test 16: Empty assets
  test('Handle empty assets', () => {
    const comparison = prepareComparison([], ['en-US'], 'all');
    if (comparison[0].count !== 0) {
      throw new Error('Should have 0 assets for empty input');
    }
  });

  // Test 17: Single locale
  test('Compare single locale', () => {
    const assets = generateMockAssets('app-1', ['en-US'], ['iPhone']);
    const comparison = prepareComparison(assets, ['en-US'], 'all');
    if (comparison.length !== 1) {
      throw new Error('Should have 1 comparison entry');
    }
  });

  // Test 18: Many locales
  test('Compare many locales', () => {
    const locales: AppStoreLocale[] = ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ja', 'zh-Hans'];
    const assets = generateMockAssets('app-1', locales, ['iPhone']);
    const comparison = prepareComparison(assets, locales, 'all');
    if (comparison.length !== 6) {
      throw new Error(`Expected 6 comparison entries, got ${comparison.length}`);
    }
  });

  // Test 19: Sorted assets
  test('Assets are sorted by name', () => {
    const assets = generateMockAssets('app-1', ['en-US'], ['iPhone']);
    const comparison = prepareComparison(assets, ['en-US'], 'all');
    const names = comparison[0].assets.map(a => a.name);
    const sortedNames = [...names].sort();
    if (JSON.stringify(names) !== JSON.stringify(sortedNames)) {
      throw new Error('Assets are not sorted by name');
    }
  });

  // Test 20: Screenshot type filtering
  test('Filter only screenshot type', () => {
    const assets = generateMockAssets('app-1', ['en-US'], ['iPhone']);
    // Add a non-screenshot asset
    assets.push({
      ...assets[0],
      id: 'non-screenshot',
      type: 'icon',
    });
    const comparison = prepareComparison(assets, ['en-US'], 'all');
    if (!comparison[0].assets.every(a => a.type === 'screenshot')) {
      throw new Error('Non-screenshot assets were included');
    }
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Tests: ${passed + failed} total, ${passed} passed, ${failed} failed`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(50));

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests();
