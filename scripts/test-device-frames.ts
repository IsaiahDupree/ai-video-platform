/**
 * Device Frame Test Suite
 *
 * Tests for the device frame system (APP-001).
 */

import {
  deviceFramePresets,
  getDeviceFrame,
  getDevicesByType,
  getRecommendedSizes,
  iPhonePresets,
  iPadPresets,
  macPresets,
  watchPresets,
} from '../src/config/deviceFrames';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => boolean | void): void {
  try {
    const result = fn();
    const passed = result === undefined || result === true;
    results.push({
      name,
      passed,
      message: passed ? '✓ Passed' : '✗ Failed',
    });
  } catch (error) {
    results.push({
      name,
      passed: false,
      message: `✗ Error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

function assertEquals(actual: any, expected: any, message?: string): boolean {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
  return true;
}

function assertTrue(value: boolean, message?: string): boolean {
  if (!value) {
    throw new Error(message || 'Expected true, got false');
  }
  return true;
}

function assertDefined<T>(value: T | undefined | null, message?: string): T {
  if (value === undefined || value === null) {
    throw new Error(message || 'Expected value to be defined');
  }
  return value;
}

console.log('🧪 Running Device Frame Tests...\n');

// Test 1: Device Frame Presets Exist
test('Device frame presets object exists', () => {
  assertTrue(typeof deviceFramePresets === 'object');
  assertTrue(Object.keys(deviceFramePresets).length > 0);
});

// Test 2: iPhone Presets
test('iPhone presets are defined', () => {
  assertTrue(typeof iPhonePresets === 'object');
  assertTrue(Object.keys(iPhonePresets).length >= 8, 'Should have at least 8 iPhone models');
});

test('iPhone 16 Pro Max preset has correct dimensions', () => {
  const device = iPhonePresets['iphone-16-pro-max'];
  assertDefined(device, 'iPhone 16 Pro Max preset should exist');
  assertEquals(device!.portrait.width, 1260);
  assertEquals(device!.portrait.height, 2736);
  assertEquals(device!.landscape.width, 2736);
  assertEquals(device!.landscape.height, 1260);
});

test('iPhone 16 Pro Max has Dynamic Island', () => {
  const device = iPhonePresets['iphone-16-pro-max'];
  assertDefined(device, 'iPhone 16 Pro Max preset should exist');
  assertDefined(device!.dynamicIsland, 'Should have Dynamic Island config');
  assertTrue(device!.dynamicIsland!.width > 0);
  assertTrue(device!.dynamicIsland!.height > 0);
});

test('iPhone 8 Plus has correct dimensions', () => {
  const device = iPhonePresets['iphone-8-plus'];
  assertDefined(device, 'iPhone 8 Plus preset should exist');
  assertEquals(device!.portrait.width, 1242);
  assertEquals(device!.portrait.height, 2208);
});

test('iPhone SE has correct dimensions', () => {
  const device = iPhonePresets['iphone-se-3'];
  assertDefined(device, 'iPhone SE preset should exist');
  assertEquals(device!.portrait.width, 750);
  assertEquals(device!.portrait.height, 1334);
});

// Test 3: iPad Presets
test('iPad presets are defined', () => {
  assertTrue(typeof iPadPresets === 'object');
  assertTrue(Object.keys(iPadPresets).length >= 5, 'Should have at least 5 iPad models');
});

test('iPad Pro 13" M5 has correct dimensions', () => {
  const device = iPadPresets['ipad-pro-13-m5'];
  assertDefined(device, 'iPad Pro 13" M5 preset should exist');
  assertEquals(device!.portrait.width, 2064);
  assertEquals(device!.portrait.height, 2752);
  assertEquals(device!.landscape.width, 2752);
  assertEquals(device!.landscape.height, 2064);
});

test('iPad Pro 12.9" has correct dimensions', () => {
  const device = iPadPresets['ipad-pro-12-9'];
  assertDefined(device, 'iPad Pro 12.9" preset should exist');
  assertEquals(device!.portrait.width, 2048);
  assertEquals(device!.portrait.height, 2732);
});

test('iPad 11 has correct dimensions', () => {
  const device = iPadPresets['ipad-11'];
  assertDefined(device, 'iPad 11 preset should exist');
  assertEquals(device!.portrait.width, 1640);
  assertEquals(device!.portrait.height, 2360);
});

// Test 4: Mac Presets
test('Mac presets are defined', () => {
  assertTrue(typeof macPresets === 'object');
  assertTrue(Object.keys(macPresets).length >= 4, 'Should have at least 4 Mac models');
});

test('MacBook Air 13 has correct dimensions', () => {
  const device = macPresets['macbook-air-13'];
  assertDefined(device, 'MacBook Air 13 preset should exist');
  // Mac screenshots use 16:10 aspect ratio
  assertTrue(device!.landscape.width === 2560);
  assertTrue(device!.landscape.height === 1600);
});

test('MacBook Pro 14 has notch', () => {
  const device = macPresets['macbook-pro-14'];
  assertDefined(device, 'MacBook Pro 14 preset should exist');
  assertDefined(device!.notch, 'Should have notch config');
  assertTrue(device!.notch!.width > 0);
  assertTrue(device!.notch!.height > 0);
});

test('iMac 24 has correct dimensions', () => {
  const device = macPresets['imac-24'];
  assertDefined(device, 'iMac 24 preset should exist');
  assertEquals(device!.landscape.width, 4480);
  assertEquals(device!.landscape.height, 2520);
});

// Test 5: Apple Watch Presets
test('Apple Watch presets are defined', () => {
  assertTrue(typeof watchPresets === 'object');
  assertTrue(Object.keys(watchPresets).length >= 5, 'Should have at least 5 Watch models');
});

test('Apple Watch Ultra 3 has correct dimensions', () => {
  const device = watchPresets['watch-ultra-3'];
  assertDefined(device, 'Apple Watch Ultra 3 preset should exist');
  assertEquals(device!.portrait.width, 422);
  assertEquals(device!.portrait.height, 514);
});

test('Apple Watch Series 11 has correct dimensions', () => {
  const device = watchPresets['watch-series-11'];
  assertDefined(device, 'Apple Watch Series 11 preset should exist');
  assertEquals(device!.portrait.width, 416);
  assertEquals(device!.portrait.height, 496);
});

test('Apple Watch Series 3 has correct dimensions', () => {
  const device = watchPresets['watch-series-3'];
  assertDefined(device, 'Apple Watch Series 3 preset should exist');
  assertEquals(device!.portrait.width, 312);
  assertEquals(device!.portrait.height, 390);
});

// Test 6: Helper Functions
test('getDeviceFrame returns correct device', () => {
  const device = getDeviceFrame('iphone-16-pro-max');
  assertDefined(device, 'Should return device config');
  assertEquals(device!.model, 'iphone-16-pro-max');
  assertEquals(device!.displayName, 'iPhone 16 Pro Max');
});

test('getDeviceFrame returns undefined for unknown device', () => {
  const device = getDeviceFrame('unknown-device');
  assertEquals(device, undefined);
});

test('getDevicesByType returns correct devices', () => {
  const iphones = getDevicesByType('iphone');
  assertTrue(iphones.length > 0, 'Should return at least one iPhone');
  assertTrue(iphones.every((d) => d.type === 'iphone'), 'All devices should be iPhones');

  const ipads = getDevicesByType('ipad');
  assertTrue(ipads.length > 0, 'Should return at least one iPad');
  assertTrue(ipads.every((d) => d.type === 'ipad'), 'All devices should be iPads');

  const macs = getDevicesByType('mac');
  assertTrue(macs.length > 0, 'Should return at least one Mac');
  assertTrue(macs.every((d) => d.type === 'mac'), 'All devices should be Macs');

  const watches = getDevicesByType('watch');
  assertTrue(watches.length > 0, 'Should return at least one Watch');
  assertTrue(watches.every((d) => d.type === 'watch'), 'All devices should be Watches');
});

test('getRecommendedSizes returns correct portrait dimensions', () => {
  const size = getRecommendedSizes('iphone-16-pro-max', 'portrait');
  assertDefined(size, 'Should return dimensions');
  assertEquals(size!.width, 1260);
  assertEquals(size!.height, 2736);
});

test('getRecommendedSizes returns correct landscape dimensions', () => {
  const size = getRecommendedSizes('iphone-16-pro-max', 'landscape');
  assertDefined(size, 'Should return dimensions');
  assertEquals(size!.width, 2736);
  assertEquals(size!.height, 1260);
});

test('getRecommendedSizes defaults to portrait', () => {
  const size = getRecommendedSizes('ipad-pro-13-m5');
  assertDefined(size, 'Should return dimensions');
  assertEquals(size!.width, 2064);
  assertEquals(size!.height, 2752);
});

// Test 7: Device Properties
test('All devices have required properties', () => {
  Object.entries(deviceFramePresets).forEach(([key, device]) => {
    if (!device) return;
    assertDefined(device.type, `${key} should have type`);
    assertDefined(device.model, `${key} should have model`);
    assertDefined(device.displayName, `${key} should have displayName`);
    assertDefined(device.displaySize, `${key} should have displaySize`);
    assertDefined(device.portrait, `${key} should have portrait dimensions`);
    assertDefined(device.landscape, `${key} should have landscape dimensions`);
    assertTrue(device.portrait.width > 0, `${key} portrait width should be positive`);
    assertTrue(device.portrait.height > 0, `${key} portrait height should be positive`);
    assertTrue(device.landscape.width > 0, `${key} landscape width should be positive`);
    assertTrue(device.landscape.height > 0, `${key} landscape height should be positive`);
  });
});

test('All devices have valid aspect ratios', () => {
  Object.entries(deviceFramePresets).forEach(([key, device]) => {
    if (!device) return;
    const portraitRatio = device.portrait.width / device.portrait.height;
    const landscapeRatio = device.landscape.width / device.landscape.height;

    // Mac devices are always landscape, so they can have wider aspect ratios
    if (device.type === 'mac') {
      // Mac screens are 16:10, so ratio should be around 1.6
      assertTrue(
        portraitRatio >= 1.4 && portraitRatio <= 1.8,
        `${key} ratio should be 16:10 (1.6), got ${portraitRatio}`
      );
    } else {
      // Non-Mac portrait should be taller (ratio < 1) or square (ratio = 1)
      assertTrue(
        portraitRatio <= 1.1,
        `${key} portrait ratio should be <= 1.1, got ${portraitRatio}`
      );
    }

    // Landscape should be wider (ratio > 1)
    assertTrue(
      landscapeRatio >= 0.9,
      `${key} landscape ratio should be >= 0.9, got ${landscapeRatio}`
    );
  });
});

test('All devices have color options', () => {
  Object.entries(deviceFramePresets).forEach(([key, device]) => {
    if (!device) return;
    if (device.colors) {
      assertTrue(device.colors.length > 0, `${key} should have at least one color`);
      assertTrue(
        device.colors.every((c) => /^#[0-9a-f]{6}$/i.test(c)),
        `${key} colors should be valid hex codes`
      );
    }
    if (device.defaultColor) {
      assertTrue(
        /^#[0-9a-f]{6}$/i.test(device.defaultColor),
        `${key} defaultColor should be a valid hex code`
      );
    }
  });
});

test('All devices have valid border radius', () => {
  Object.entries(deviceFramePresets).forEach(([key, device]) => {
    if (!device) return;
    if (device.borderRadius !== undefined) {
      assertTrue(
        device.borderRadius >= 0 && device.borderRadius <= 1,
        `${key} borderRadius should be between 0 and 1, got ${device.borderRadius}`
      );
    }
  });
});

// Test 8: Device Type Counts
test('Total device count is correct', () => {
  const total = Object.keys(deviceFramePresets).length;
  assertTrue(total >= 25, `Should have at least 25 devices, got ${total}`);
});

test('iPhone count is correct', () => {
  const count = getDevicesByType('iphone').length;
  assertTrue(count >= 8, `Should have at least 8 iPhones, got ${count}`);
});

test('iPad count is correct', () => {
  const count = getDevicesByType('ipad').length;
  assertTrue(count >= 5, `Should have at least 5 iPads, got ${count}`);
});

test('Mac count is correct', () => {
  const count = getDevicesByType('mac').length;
  assertTrue(count >= 4, `Should have at least 4 Macs, got ${count}`);
});

test('Apple Watch count is correct', () => {
  const count = getDevicesByType('watch').length;
  assertTrue(count >= 5, `Should have at least 5 Watches, got ${count}`);
});

// Print Results
console.log('\n📊 Test Results:\n');
console.log('━'.repeat(60));

let passed = 0;
let failed = 0;

results.forEach((result) => {
  const icon = result.passed ? '✓' : '✗';
  const color = result.passed ? '\x1b[32m' : '\x1b[31m';
  console.log(`${color}${icon}\x1b[0m ${result.name}`);
  if (!result.passed) {
    console.log(`  ${result.message}`);
  }
  if (result.passed) passed++;
  else failed++;
});

console.log('━'.repeat(60));
console.log(
  `\n${passed}/${results.length} tests passed ${failed > 0 ? `(${failed} failed)` : ''}`
);

if (failed === 0) {
  console.log('\n✅ All tests passed!\n');
} else {
  console.log(`\n❌ ${failed} test(s) failed\n`);
  process.exit(1);
}
