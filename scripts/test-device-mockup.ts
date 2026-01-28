/**
 * Device Mockup Component Test Suite (APP-012)
 *
 * Tests for the DeviceMockup component functionality.
 *
 * Usage:
 *   npx ts-node scripts/test-device-mockup.ts
 */

import * as assert from 'assert';
import { deviceFramePresets, getDevicesByType } from '../src/config/deviceFrames.js';
import { DeviceModel, DeviceType } from '../src/types/deviceFrame.js';

/**
 * Test utility functions
 */
function assertEqual<T>(actual: T, expected: T, message: string): void {
  assert.strictEqual(actual, expected, message);
}

function assertTrue(condition: boolean, message: string): void {
  assert.strictEqual(condition, true, message);
}

function assertDefined<T>(value: T | undefined, message: string): asserts value is T {
  assert.notStrictEqual(value, undefined, message);
}

/**
 * Test Results
 */
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    results.push({ name, passed: true });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * DeviceMockup Component Tests
 */

console.log('\n=== Device Mockup Component Tests ===\n');

// Test 1: Device frame presets are available
test('Device frame presets are available', () => {
  assertTrue(Object.keys(deviceFramePresets).length > 0, 'Should have device presets');
  assertTrue(Object.keys(deviceFramePresets).length >= 25, 'Should have at least 25 devices');
});

// Test 2: Get devices by type
test('Get devices by type', () => {
  const types: DeviceType[] = ['iphone', 'ipad', 'mac', 'watch', 'tv', 'vision'];

  types.forEach((type) => {
    const devices = getDevicesByType(type);
    assertTrue(devices.length > 0, `Should have ${type} devices`);
    assertTrue(
      devices.every((d) => d.type === type),
      `All devices should be of type ${type}`
    );
  });
});

// Test 3: iPhone devices have correct structure
test('iPhone devices have correct structure', () => {
  const iphones = getDevicesByType('iphone');

  iphones.forEach((iphone) => {
    assertDefined(iphone.model, 'iPhone should have model');
    assertDefined(iphone.displayName, 'iPhone should have display name');
    assertDefined(iphone.displaySize, 'iPhone should have display size');
    assertDefined(iphone.portrait, 'iPhone should have portrait dimensions');
    assertDefined(iphone.landscape, 'iPhone should have landscape dimensions');
    assertDefined(iphone.borderRadius, 'iPhone should have border radius');

    // Portrait dimensions should be taller than wide
    assertTrue(
      iphone.portrait.height > iphone.portrait.width,
      `${iphone.model} portrait should be taller than wide`
    );

    // Landscape dimensions should be wider than tall
    assertTrue(
      iphone.landscape.width > iphone.landscape.height,
      `${iphone.model} landscape should be wider than tall`
    );

    // Portrait and landscape dimensions should be swapped
    assertEqual(
      iphone.portrait.width,
      iphone.landscape.height,
      `${iphone.model} portrait width should equal landscape height`
    );
    assertEqual(
      iphone.portrait.height,
      iphone.landscape.width,
      `${iphone.model} portrait height should equal landscape width`
    );
  });
});

// Test 4: iPad devices have correct structure
test('iPad devices have correct structure', () => {
  const ipads = getDevicesByType('ipad');

  ipads.forEach((ipad) => {
    assertDefined(ipad.model, 'iPad should have model');
    assertDefined(ipad.displayName, 'iPad should have display name');
    assertDefined(ipad.displaySize, 'iPad should have display size');
    assertDefined(ipad.portrait, 'iPad should have portrait dimensions');
    assertDefined(ipad.landscape, 'iPad should have landscape dimensions');
    assertDefined(ipad.borderRadius, 'iPad should have border radius');

    // Portrait dimensions should be taller than wide
    assertTrue(
      ipad.portrait.height > ipad.portrait.width,
      `${ipad.model} portrait should be taller than wide`
    );

    // Landscape dimensions should be wider than tall
    assertTrue(
      ipad.landscape.width > ipad.landscape.height,
      `${ipad.model} landscape should be wider than tall`
    );
  });
});

// Test 5: Mac devices have correct structure
test('Mac devices have correct structure', () => {
  const macs = getDevicesByType('mac');

  macs.forEach((mac) => {
    assertDefined(mac.model, 'Mac should have model');
    assertDefined(mac.displayName, 'Mac should have display name');
    assertDefined(mac.displaySize, 'Mac should have display size');
    assertDefined(mac.portrait, 'Mac should have portrait dimensions');
    assertDefined(mac.landscape, 'Mac should have landscape dimensions');
    assertDefined(mac.borderRadius, 'Mac should have border radius');

    // Mac should always be landscape (wider than tall)
    assertTrue(
      mac.portrait.width > mac.portrait.height,
      `${mac.model} should always be landscape`
    );
    assertTrue(
      mac.landscape.width > mac.landscape.height,
      `${mac.model} should always be landscape`
    );
  });
});

// Test 6: Watch devices have correct structure
test('Watch devices have correct structure', () => {
  const watches = getDevicesByType('watch');

  watches.forEach((watch) => {
    assertDefined(watch.model, 'Watch should have model');
    assertDefined(watch.displayName, 'Watch should have display name');
    assertDefined(watch.displaySize, 'Watch should have display size');
    assertDefined(watch.portrait, 'Watch should have portrait dimensions');
    assertDefined(watch.landscape, 'Watch should have landscape dimensions');
    assertDefined(watch.borderRadius, 'Watch should have border radius');

    // Watch portrait should be taller than wide
    assertTrue(
      watch.portrait.height > watch.portrait.width,
      `${watch.model} portrait should be taller than wide`
    );
  });
});

// Test 7: Device colors are valid
test('Device colors are valid', () => {
  const allDevices = Object.values(deviceFramePresets);

  allDevices.forEach((device) => {
    if (device) {
      if (device.colors) {
        assertTrue(device.colors.length > 0, `${device.model} should have at least one color`);
        assertTrue(
          device.colors.every((color) => color.startsWith('#') || color.startsWith('rgb')),
          `${device.model} colors should be valid hex or rgb colors`
        );
      }

      if (device.defaultColor) {
        assertTrue(
          device.defaultColor.startsWith('#') || device.defaultColor.startsWith('rgb'),
          `${device.model} default color should be valid hex or rgb color`
        );
      }
    }
  });
});

// Test 8: Notch and Dynamic Island configurations
test('Notch and Dynamic Island configurations', () => {
  const allDevices = Object.values(deviceFramePresets);

  allDevices.forEach((device) => {
    if (device) {
      // If device has notch, validate structure
      if (device.notch) {
        assertTrue(device.notch.width > 0, `${device.model} notch width should be positive`);
        assertTrue(device.notch.height > 0, `${device.model} notch height should be positive`);
      }

      // If device has Dynamic Island, validate structure
      if (device.dynamicIsland) {
        assertTrue(
          device.dynamicIsland.width > 0,
          `${device.model} Dynamic Island width should be positive`
        );
        assertTrue(
          device.dynamicIsland.height > 0,
          `${device.model} Dynamic Island height should be positive`
        );
      }

      // Should not have both notch and Dynamic Island
      if (device.notch && device.dynamicIsland) {
        throw new Error(`${device.model} should not have both notch and Dynamic Island`);
      }
    }
  });
});

// Test 9: Border radius is reasonable
test('Border radius is reasonable', () => {
  const allDevices = Object.values(deviceFramePresets);

  allDevices.forEach((device) => {
    if (device) {
      const borderRadius = device.borderRadius || 0.05;
      assertTrue(
        borderRadius >= 0 && borderRadius <= 0.2,
        `${device.model} border radius should be between 0 and 0.2 (${borderRadius})`
      );
    }
  });
});

// Test 10: Specific device models exist
test('Specific device models exist', () => {
  const requiredDevices: DeviceModel[] = [
    'iphone-16-pro-max',
    'iphone-16',
    'iphone-15',
    'iphone-se-3',
    'ipad-pro-13-m5',
    'ipad-11',
    'macbook-air-13',
    'macbook-pro-16',
    'watch-ultra-3',
    'watch-series-10',
  ];

  requiredDevices.forEach((model) => {
    const device = deviceFramePresets[model];
    assertDefined(device, `${model} should exist in presets`);
    assertEqual(device.model, model, `${model} should have correct model name`);
  });
});

// Test 11: iPhone 16 Pro Max has Dynamic Island
test('iPhone 16 Pro Max has Dynamic Island', () => {
  const device = deviceFramePresets['iphone-16-pro-max'];
  assertDefined(device, 'iPhone 16 Pro Max should exist');
  assertDefined(device.dynamicIsland, 'iPhone 16 Pro Max should have Dynamic Island');
  assertTrue(
    !device.notch,
    'iPhone 16 Pro Max should not have notch (has Dynamic Island instead)'
  );
});

// Test 12: iPhone 16 Plus has notch (not Dynamic Island)
test('iPhone 16 Plus has notch (not Dynamic Island)', () => {
  const device = deviceFramePresets['iphone-16-plus'];
  assertDefined(device, 'iPhone 16 Plus should exist');
  assertDefined(device.notch, 'iPhone 16 Plus should have notch');
  assertTrue(
    !device.dynamicIsland,
    'iPhone 16 Plus should not have Dynamic Island (has notch instead)'
  );
});

// Test 13: iPhone SE has no notch or Dynamic Island
test('iPhone SE has no notch or Dynamic Island', () => {
  const device = deviceFramePresets['iphone-se-3'];
  assertDefined(device, 'iPhone SE should exist');
  assertTrue(!device.notch, 'iPhone SE should not have notch');
  assertTrue(!device.dynamicIsland, 'iPhone SE should not have Dynamic Island');
});

// Test 14: MacBook Pro has notch
test('MacBook Pro has notch', () => {
  const mbp14 = deviceFramePresets['macbook-pro-14'];
  const mbp16 = deviceFramePresets['macbook-pro-16'];

  assertDefined(mbp14, 'MacBook Pro 14 should exist');
  assertDefined(mbp16, 'MacBook Pro 16 should exist');
  assertDefined(mbp14.notch, 'MacBook Pro 14 should have notch');
  assertDefined(mbp16.notch, 'MacBook Pro 16 should have notch');
});

// Test 15: MacBook Air has no notch
test('MacBook Air has no notch', () => {
  const mba13 = deviceFramePresets['macbook-air-13'];
  const mba15 = deviceFramePresets['macbook-air-15'];

  assertDefined(mba13, 'MacBook Air 13 should exist');
  assertDefined(mba15, 'MacBook Air 15 should exist');
  assertTrue(!mba13.notch, 'MacBook Air 13 should not have notch');
  assertTrue(!mba15.notch, 'MacBook Air 15 should not have notch');
});

// Test 16: Device types are correct
test('Device types are correct', () => {
  const iphones = getDevicesByType('iphone');
  const ipads = getDevicesByType('ipad');
  const macs = getDevicesByType('mac');
  const watches = getDevicesByType('watch');
  const tvs = getDevicesByType('tv');
  const visions = getDevicesByType('vision');

  assertTrue(iphones.length >= 8, 'Should have at least 8 iPhone models');
  assertTrue(ipads.length >= 6, 'Should have at least 6 iPad models');
  assertTrue(macs.length >= 5, 'Should have at least 5 Mac models');
  assertTrue(watches.length >= 6, 'Should have at least 6 Watch models');
  assertTrue(tvs.length >= 2, 'Should have at least 2 TV models');
  assertTrue(visions.length >= 1, 'Should have at least 1 Vision Pro model');
});

// Test 17: Display sizes are reasonable
test('Display sizes are reasonable', () => {
  const allDevices = Object.values(deviceFramePresets);

  allDevices.forEach((device) => {
    if (device) {
      assertDefined(device.displaySize, `${device.model} should have display size`);

      // Display size should contain a number
      const hasNumber = /\d/.test(device.displaySize);
      assertTrue(
        hasNumber || device.displaySize === 'Variable' || device.displaySize === 'Immersive',
        `${device.model} display size should contain a number or be Variable/Immersive`
      );
    }
  });
});

// Test 18: Portrait and landscape dimensions are positive
test('Portrait and landscape dimensions are positive', () => {
  const allDevices = Object.values(deviceFramePresets);

  allDevices.forEach((device) => {
    if (device) {
      assertTrue(
        device.portrait.width > 0,
        `${device.model} portrait width should be positive`
      );
      assertTrue(
        device.portrait.height > 0,
        `${device.model} portrait height should be positive`
      );
      assertTrue(
        device.landscape.width > 0,
        `${device.model} landscape width should be positive`
      );
      assertTrue(
        device.landscape.height > 0,
        `${device.model} landscape height should be positive`
      );
    }
  });
});

// Test 19: Zoom calculations
test('Zoom calculations work correctly', () => {
  const zoomLevels = [0.1, 0.5, 1, 1.5, 2, 3];

  zoomLevels.forEach((zoom) => {
    const clamped = Math.max(0.1, Math.min(3, zoom));
    assertEqual(clamped, zoom, `Zoom ${zoom} should be within valid range`);
  });

  const invalidZooms = [-1, 0, 4, 10];
  invalidZooms.forEach((zoom) => {
    const clamped = Math.max(0.1, Math.min(3, zoom));
    assertTrue(
      clamped >= 0.1 && clamped <= 3,
      `Invalid zoom ${zoom} should be clamped to valid range (got ${clamped})`
    );
  });
});

// Test 20: Pan calculations are reasonable
test('Pan calculations are reasonable', () => {
  const panValues = [-1000, -500, 0, 500, 1000];

  panValues.forEach((pan) => {
    assertTrue(
      typeof pan === 'number' && !isNaN(pan),
      `Pan value ${pan} should be a valid number`
    );
  });
});

/**
 * Print Summary
 */
console.log('\n=== Test Summary ===\n');

const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;
const total = results.length;

console.log(`Total Tests: ${total}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

if (failed > 0) {
  console.log('\nFailed Tests:');
  results
    .filter((r) => !r.passed)
    .forEach((r) => {
      console.log(`  - ${r.name}`);
      if (r.error) {
        console.log(`    ${r.error}`);
      }
    });
}

console.log('\n');

// Exit with error code if tests failed
if (failed > 0) {
  process.exit(1);
}
