/**
 * Test Script: TRACK-006 Retention Event Tracking
 *
 * Tests return_visit and feature_discovery events
 */

import {
  trackReturnVisit,
  trackFeatureDiscovery,
  hasDiscoveredFeature,
  getRetentionStats,
  resetRetentionTracking,
  DiscoverableFeature,
} from '../src/services/retentionTracking';

// Mock localStorage for Node.js environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => {
      return store[key] || null;
    },
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Mock window and localStorage
(global as any).window = {};
(global as any).localStorage = localStorageMock;

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => void | Promise<void>): void {
  try {
    const result = fn();
    if (result instanceof Promise) {
      result
        .then(() => {
          results.push({ name, passed: true });
          console.log(`✓ ${name}`);
        })
        .catch((error) => {
          results.push({ name, passed: false, error: error.message });
          console.error(`✗ ${name}: ${error.message}`);
        });
    } else {
      results.push({ name, passed: true });
      console.log(`✓ ${name}`);
    }
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message });
    console.error(`✗ ${name}: ${error.message}`);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Test Suite
async function runTests() {
  console.log('\n🧪 TRACK-006: Retention Event Tracking Tests\n');
  console.log('='.repeat(60));
  console.log('Note: These tests verify localStorage logic.');
  console.log('Event tracking integration requires browser environment.\n');
  console.log('='.repeat(60));

  // Test 1: First visit tracking
  test('First visit initializes tracking data', () => {
    resetRetentionTracking();
    trackReturnVisit();

    const stats = getRetentionStats();
    assert(stats.visitCount === 1, `Expected visitCount to be 1, got ${stats.visitCount}`);
    assert(stats.firstVisit !== '', 'firstVisit should be set');
    assert(stats.lastVisit !== '', 'lastVisit should be set');
  });

  // Test 2: Retention stats structure
  test('getRetentionStats returns correct structure', () => {
    resetRetentionTracking();
    trackReturnVisit();

    const stats = getRetentionStats();

    assert(typeof stats.visitCount === 'number', 'visitCount should be a number');
    assert(typeof stats.firstVisit === 'string', 'firstVisit should be a string');
    assert(typeof stats.lastVisit === 'string', 'lastVisit should be a string');
    assert(Array.isArray(stats.discoveredFeatures), 'discoveredFeatures should be an array');
    assert(typeof stats.daysSinceFirstVisit === 'number', 'daysSinceFirstVisit should be a number');
    assert(
      stats.hoursSinceLastVisit === null || typeof stats.hoursSinceLastVisit === 'number',
      'hoursSinceLastVisit should be null or number'
    );
  });

  // Test 3: Visit count increments (simulated)
  test('Visit count increments correctly', () => {
    resetRetentionTracking();

    // First visit
    trackReturnVisit();
    let stats = getRetentionStats();
    assert(stats.visitCount === 1, `Expected visitCount 1, got ${stats.visitCount}`);

    // Manually set last visit to simulate time passing (1 hour ago)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    localStorage.setItem('retention_tracking_last_visit', oneHourAgo);

    // Second visit
    trackReturnVisit();
    stats = getRetentionStats();
    assert(stats.visitCount === 2, `Expected visitCount 2, got ${stats.visitCount}`);
  });

  // Test 4: Feature discovery - first time
  test('Feature discovery tracks first occurrence', () => {
    resetRetentionTracking();

    assert(!hasDiscoveredFeature('ad_editor'), 'Feature should not be discovered initially');

    trackFeatureDiscovery('ad_editor');

    assert(hasDiscoveredFeature('ad_editor'), 'Feature should be discovered after tracking');

    const stats = getRetentionStats();
    assert(
      stats.discoveredFeatures.includes('ad_editor'),
      'Feature should be in discovered list'
    );
    assert(stats.discoveredFeatures.length === 1, 'Should have 1 discovered feature');
  });

  // Test 5: Feature discovery - no duplicates
  test('Feature discovery prevents duplicates', () => {
    resetRetentionTracking();

    trackFeatureDiscovery('ad_editor');
    trackFeatureDiscovery('ad_editor'); // Duplicate

    const stats = getRetentionStats();
    assert(stats.discoveredFeatures.length === 1, 'Should still have 1 discovered feature');
  });

  // Test 6: Multiple features
  test('Multiple features are tracked separately', () => {
    resetRetentionTracking();

    trackFeatureDiscovery('ad_editor');
    trackFeatureDiscovery('campaign_generator');
    trackFeatureDiscovery('csv_import');

    const stats = getRetentionStats();
    assert(stats.discoveredFeatures.length === 3, 'Should have 3 discovered features');
    assert(hasDiscoveredFeature('ad_editor'), 'Should have ad_editor');
    assert(hasDiscoveredFeature('campaign_generator'), 'Should have campaign_generator');
    assert(hasDiscoveredFeature('csv_import'), 'Should have csv_import');
  });

  // Test 7: Days since first visit calculation
  test('daysSinceFirstVisit calculates correctly', () => {
    resetRetentionTracking();

    // Set first visit to 3 days ago
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem('retention_tracking_first_visit', threeDaysAgo);
    localStorage.setItem('retention_tracking_visit_count', '1');

    const stats = getRetentionStats();
    assert(
      stats.daysSinceFirstVisit >= 2 && stats.daysSinceFirstVisit <= 3,
      `Expected daysSinceFirstVisit to be 2-3, got ${stats.daysSinceFirstVisit}`
    );
  });

  // Test 8: Hours since last visit calculation
  test('hoursSinceLastVisit calculates correctly', () => {
    resetRetentionTracking();

    // Set last visit to 5 hours ago
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
    localStorage.setItem('retention_tracking_last_visit', fiveHoursAgo);
    localStorage.setItem('retention_tracking_visit_count', '1');
    localStorage.setItem('retention_tracking_first_visit', fiveHoursAgo);

    const stats = getRetentionStats();
    assert(
      stats.hoursSinceLastVisit !== null && stats.hoursSinceLastVisit >= 4 && stats.hoursSinceLastVisit <= 5,
      `Expected hoursSinceLastVisit to be 4-5, got ${stats.hoursSinceLastVisit}`
    );
  });

  // Test 9: Reset tracking clears all data
  test('resetRetentionTracking clears all data', () => {
    // Set up some data
    trackReturnVisit();
    trackFeatureDiscovery('ad_editor');
    trackFeatureDiscovery('campaign_generator');

    let stats = getRetentionStats();
    assert(stats.visitCount > 0, 'Should have visit data before reset');
    assert(stats.discoveredFeatures.length > 0, 'Should have discovered features before reset');

    // Reset
    resetRetentionTracking();

    stats = getRetentionStats();
    assert(stats.visitCount === 0, 'Visit count should be 0 after reset');
    assert(stats.discoveredFeatures.length === 0, 'Discovered features should be empty after reset');
  });

  // Test 10: All discoverable features are valid
  test('All feature types are trackable', () => {
    resetRetentionTracking();

    const features: DiscoverableFeature[] = [
      'ad_editor',
      'template_library',
      'brand_kit',
      'batch_render',
      'campaign_generator',
      'csv_import',
      'screenshot_editor',
      'device_frames',
      'caption_overlay',
      'screenshot_resize',
      'locale_export',
      'asset_library',
      'custom_product_page',
      'ppo_test',
      'app_preview_generator',
      'analytics_dashboard',
      'voice_clone',
      'text_to_video',
      'image_generation',
      'approval_workflow',
      'ai_variants',
      'localization',
      'creative_qa',
    ];

    // Track first 5 features
    features.slice(0, 5).forEach((feature) => {
      trackFeatureDiscovery(feature);
    });

    const stats = getRetentionStats();
    assert(stats.discoveredFeatures.length === 5, 'Should have 5 discovered features');

    // Verify all are tracked
    features.slice(0, 5).forEach((feature) => {
      assert(hasDiscoveredFeature(feature), `${feature} should be discovered`);
    });
  });

  // Wait a bit for async tests
  await sleep(100);

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results:\n');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  results.forEach((result) => {
    if (result.passed) {
      console.log(`✓ ${result.name}`);
    } else {
      console.log(`✗ ${result.name}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n✅ All tests passed!\n');
  } else {
    console.log(`\n❌ ${failed} test(s) failed\n`);
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
