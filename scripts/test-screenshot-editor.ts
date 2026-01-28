/**
 * Test Script for Screenshot Editor (APP-025)
 *
 * Tests the Screenshot Editor UI functionality.
 */

import { createCaptionFromPreset } from '../src/types/captionOverlay';
import { getDevicesByType } from '../src/config/deviceFrames';

// Test colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => boolean | void) {
  try {
    const result = fn();
    if (result === false) {
      console.log(`${RED}✗${RESET} ${name}`);
      failed++;
    } else {
      console.log(`${GREEN}✓${RESET} ${name}`);
      passed++;
    }
  } catch (error) {
    console.log(`${RED}✗${RESET} ${name}`);
    console.error(`  Error: ${error}`);
    failed++;
  }
}

console.log('\n📱 Screenshot Editor Tests (APP-025)\n');

// Test 1: Caption creation
test('Can create caption from preset', () => {
  const caption = createCaptionFromPreset('hero-heading', 'Test Caption', { visible: true });
  return caption !== null && caption !== undefined && caption.localizedText?.['en-US'] === 'Test Caption';
});

// Test 2: Device list availability
test('Can get device list', () => {
  const iPhones = getDevicesByType('iphone');
  return iPhones.length > 0;
});

// Test 3: Multiple device types
test('Can get multiple device types', () => {
  const iPhones = getDevicesByType('iphone');
  const iPads = getDevicesByType('ipad');
  const macs = getDevicesByType('mac');
  return iPhones.length > 0 && iPads.length > 0 && macs.length > 0;
});

// Test 4: Caption position options
test('Caption has position options', () => {
  const caption = createCaptionFromPreset('hero-heading', 'Test', { visible: true });
  const positions = [
    'top-left',
    'top-center',
    'top-right',
    'center-left',
    'center',
    'center-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ];
  return caption !== null && positions.includes(caption.positioning.position);
});

// Test 5: Caption style customization
test('Caption has style properties', () => {
  const caption = createCaptionFromPreset('hero-heading', 'Test', { visible: true });
  return (
    caption !== null &&
    caption.style !== undefined &&
    caption.style.fontSize !== undefined &&
    caption.style.fontWeight !== undefined &&
    caption.style.color !== undefined
  );
});

// Test 6: Caption layer management
test('Can create multiple caption layers', () => {
  const captions = [
    createCaptionFromPreset('hero-heading', 'Caption 1', { visible: true }),
    createCaptionFromPreset('subtitle', 'Caption 2', { visible: true }),
    createCaptionFromPreset('bottom-caption', 'Caption 3', { visible: true }),
  ];
  return captions.every((c) => c !== null);
});

// Test 7: Device model validation
test('Device models are valid', () => {
  const iPhones = getDevicesByType('iphone');
  return iPhones.every((d) => d.model && d.name && d.dimensions && typeof d.dimensions === 'object');
});

// Test 8: Caption preset availability
test('Caption presets are available', () => {
  const presets = ['hero-heading', 'subtitle', 'bottom-caption', 'feature-badge', 'center-callout'];
  const results = presets.map((p) => createCaptionFromPreset(p, 'Test', { visible: true }));
  return results.every((r) => r !== null);
});

// Test 9: Caption visibility toggle
test('Can toggle caption visibility', () => {
  const caption = createCaptionFromPreset('hero-heading', 'Test', { visible: true });
  return caption !== null && caption.visible === true;
});

// Test 10: Device dimensions
test('Device dimensions are valid', () => {
  const iPhones = getDevicesByType('iphone');
  return iPhones.every((d) => d.dimensions && d.dimensions.width > 0 && d.dimensions.height > 0);
});

// Summary
console.log(`\n${GREEN}Passed: ${passed}${RESET}`);
console.log(`${RED}Failed: ${failed}${RESET}`);
console.log(`${YELLOW}Total: ${passed + failed}${RESET}\n`);

if (failed > 0) {
  process.exit(1);
}
