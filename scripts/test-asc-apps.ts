/**
 * APP-007: App List Fetcher - Test Suite
 *
 * Comprehensive tests for App Store Connect apps service
 */

import type {
  App,
  AppInfo,
  AppsResponse,
  AppPlatform,
} from '../src/types/ascApps';

// Mock apps data
const mockApps: App[] = [
  {
    type: 'apps',
    id: '1234567890',
    attributes: {
      name: 'Test iOS App',
      bundleId: 'com.example.testapp',
      sku: 'TEST-APP-IOS',
      primaryLocale: 'en-US',
    },
    links: {
      self: 'https://api.appstoreconnect.apple.com/v1/apps/1234567890',
    },
  },
  {
    type: 'apps',
    id: '0987654321',
    attributes: {
      name: 'Test macOS App',
      bundleId: 'com.example.testapp.macos',
      sku: 'TEST-APP-MACOS',
      primaryLocale: 'en-US',
    },
    links: {
      self: 'https://api.appstoreconnect.apple.com/v1/apps/0987654321',
    },
  },
  {
    type: 'apps',
    id: '1122334455',
    attributes: {
      name: 'Test tvOS App',
      bundleId: 'com.example.testapp.tvos',
      sku: 'TEST-APP-TVOS',
      primaryLocale: 'en-US',
    },
    links: {
      self: 'https://api.appstoreconnect.apple.com/v1/apps/1122334455',
    },
  },
  {
    type: 'apps',
    id: '5544332211',
    attributes: {
      name: 'Test Vision App',
      bundleId: 'com.example.testapp.visionos',
      sku: 'TEST-APP-VISION',
      primaryLocale: 'en-US',
    },
    links: {
      self: 'https://api.appstoreconnect.apple.com/v1/apps/5544332211',
    },
  },
];

// Import service functions
import * as ascAppsService from '../src/services/ascApps';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

function test(name: string, fn: () => Promise<void> | void) {
  return async () => {
    const start = Date.now();
    try {
      await fn();
      const duration = Date.now() - start;
      results.push({ name, passed: true, duration });
      console.log(`✓ ${name} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - start;
      results.push({
        name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      console.log(`✗ ${name} (${duration}ms)`);
      console.log(`  Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
}

function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toEqual(expected: any) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(
          `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
        );
      }
    },
    toBeGreaterThan(expected: number) {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toContain(expected: any) {
      if (!actual.includes(expected)) {
        throw new Error(`Expected array to contain ${expected}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected ${actual} to be truthy`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected ${actual} to be falsy`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected null, got ${actual}`);
      }
    },
    toHaveLength(expected: number) {
      if (actual.length !== expected) {
        throw new Error(`Expected length ${expected}, got ${actual.length}`);
      }
    },
  };
}

// Test Suite (Unit tests only - no API calls)
async function runTests() {
  console.log('Running APP-007: App List Fetcher Tests\n');

  // Test 1: Convert app to AppInfo
  await test('should convert app to AppInfo', async () => {
    const app = mockApps[0];
    const appInfo = ascAppsService.toAppInfo(app);
    expect(appInfo.id).toBe(app.id);
    expect(appInfo.name).toBe(app.attributes.name);
    expect(appInfo.bundleId).toBe(app.attributes.bundleId);
    expect(appInfo.sku).toBe(app.attributes.sku);
    expect(appInfo.primaryLocale).toBe(app.attributes.primaryLocale);
    expect(appInfo.platform).toBe('IOS');
  })();

  // Test 2: Infer iOS platform from bundle ID
  await test('should infer iOS platform from bundle ID', async () => {
    const iosApp = ascAppsService.toAppInfo(mockApps[0]);
    expect(iosApp.platform).toBe('IOS');
  })();

  // Test 3: Infer macOS platform from bundle ID
  await test('should infer macOS platform from bundle ID', async () => {
    const macApp = ascAppsService.toAppInfo(mockApps[1]);
    expect(macApp.platform).toBe('MAC_OS');
  })();

  // Test 4: Infer tvOS platform from bundle ID
  await test('should infer tvOS platform from bundle ID', async () => {
    const tvApp = ascAppsService.toAppInfo(mockApps[2]);
    expect(tvApp.platform).toBe('TV_OS');
  })();

  // Test 5: Infer visionOS platform from bundle ID
  await test('should infer visionOS platform from bundle ID', async () => {
    const visionApp = ascAppsService.toAppInfo(mockApps[3]);
    expect(visionApp.platform).toBe('VISION_OS');
  })();

  // Test 6: Filter apps by platform - iOS
  await test('should filter apps by platform - iOS', async () => {
    const iosApps = ascAppsService.filterAppsByPlatform(mockApps, 'IOS');
    expect(iosApps).toHaveLength(1);
    expect(iosApps[0].attributes.bundleId).toBe('com.example.testapp');
  })();

  // Test 7: Filter apps by platform - macOS
  await test('should filter apps by platform - macOS', async () => {
    const macApps = ascAppsService.filterAppsByPlatform(mockApps, 'MAC_OS');
    expect(macApps).toHaveLength(1);
    expect(macApps[0].attributes.bundleId).toBe('com.example.testapp.macos');
  })();

  // Test 8: Filter apps by platform - tvOS
  await test('should filter apps by platform - tvOS', async () => {
    const tvApps = ascAppsService.filterAppsByPlatform(mockApps, 'TV_OS');
    expect(tvApps).toHaveLength(1);
    expect(tvApps[0].attributes.bundleId).toBe('com.example.testapp.tvos');
  })();

  // Test 9: Filter apps by platform - visionOS
  await test('should filter apps by platform - visionOS', async () => {
    const visionApps = ascAppsService.filterAppsByPlatform(mockApps, 'VISION_OS');
    expect(visionApps).toHaveLength(1);
    expect(visionApps[0].attributes.bundleId).toBe('com.example.testapp.visionos');
  })();

  // Test 10: Group apps by platform
  await test('should group apps by platform', async () => {
    const grouped = ascAppsService.groupAppsByPlatform(mockApps);
    expect(grouped.IOS).toHaveLength(1);
    expect(grouped.MAC_OS).toHaveLength(1);
    expect(grouped.TV_OS).toHaveLength(1);
    expect(grouped.VISION_OS).toHaveLength(1);
  })();

  // Test 11: Group apps - verify iOS apps
  await test('should group apps - verify iOS apps', async () => {
    const grouped = ascAppsService.groupAppsByPlatform(mockApps);
    expect(grouped.IOS[0].attributes.bundleId).toBe('com.example.testapp');
  })();

  // Test 12: Group apps - verify macOS apps
  await test('should group apps - verify macOS apps', async () => {
    const grouped = ascAppsService.groupAppsByPlatform(mockApps);
    expect(grouped.MAC_OS[0].attributes.bundleId).toBe('com.example.testapp.macos');
  })();

  // Test 13: Group apps - verify tvOS apps
  await test('should group apps - verify tvOS apps', async () => {
    const grouped = ascAppsService.groupAppsByPlatform(mockApps);
    expect(grouped.TV_OS[0].attributes.bundleId).toBe('com.example.testapp.tvos');
  })();

  // Test 14: Group apps - verify visionOS apps
  await test('should group apps - verify visionOS apps', async () => {
    const grouped = ascAppsService.groupAppsByPlatform(mockApps);
    expect(grouped.VISION_OS[0].attributes.bundleId).toBe('com.example.testapp.visionos');
  })();

  // Test 15: toAppInfo preserves all required fields
  await test('should preserve all required fields in toAppInfo', async () => {
    const app = mockApps[1];
    const appInfo = ascAppsService.toAppInfo(app);
    expect(appInfo.id).toBe('0987654321');
    expect(appInfo.name).toBe('Test macOS App');
    expect(appInfo.bundleId).toBe('com.example.testapp.macos');
    expect(appInfo.sku).toBe('TEST-APP-MACOS');
    expect(appInfo.primaryLocale).toBe('en-US');
  })();

  // Test 16: Platform detection - mac keyword
  await test('should detect macOS from .mac in bundle ID', async () => {
    const testApp: App = {
      type: 'apps',
      id: 'test-mac',
      attributes: {
        name: 'Mac App',
        bundleId: 'com.example.app.mac',
        sku: 'TEST-MAC',
        primaryLocale: 'en-US',
      },
      links: { self: 'https://example.com' },
    };
    const appInfo = ascAppsService.toAppInfo(testApp);
    expect(appInfo.platform).toBe('MAC_OS');
  })();

  // Test 17: Platform detection - tv keyword
  await test('should detect tvOS from .tv in bundle ID', async () => {
    const testApp: App = {
      type: 'apps',
      id: 'test-tv',
      attributes: {
        name: 'TV App',
        bundleId: 'com.example.app.tv',
        sku: 'TEST-TV',
        primaryLocale: 'en-US',
      },
      links: { self: 'https://example.com' },
    };
    const appInfo = ascAppsService.toAppInfo(testApp);
    expect(appInfo.platform).toBe('TV_OS');
  })();

  // Test 18: Platform detection - vision keyword
  await test('should detect visionOS from .vision in bundle ID', async () => {
    const testApp: App = {
      type: 'apps',
      id: 'test-vision',
      attributes: {
        name: 'Vision App',
        bundleId: 'com.example.app.vision',
        sku: 'TEST-VISION',
        primaryLocale: 'en-US',
      },
      links: { self: 'https://example.com' },
    };
    const appInfo = ascAppsService.toAppInfo(testApp);
    expect(appInfo.platform).toBe('VISION_OS');
  })();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('Test Summary');
  console.log('='.repeat(50));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log(`Total: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Pass Rate: ${passRate}%`);

  if (failed > 0) {
    console.log('\nFailed Tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}`);
        console.log(`    Error: ${r.error}`);
      });
  }

  console.log('='.repeat(50));

  // Exit with error code if any tests failed
  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
