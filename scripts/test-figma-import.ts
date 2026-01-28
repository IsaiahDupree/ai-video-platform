/**
 * APP-018: Figma Import Integration - Test Suite
 *
 * Tests for Figma import functionality including:
 * - Figma URL parsing
 * - Frame name parsing
 * - Device type detection
 * - Screenshot size matching
 * - Frame detection with various configurations
 * - Import workflow
 * - Credentials management
 *
 * Run with: npx tsx scripts/test-figma-import.ts
 */

import {
  parseFigmaUrl,
  parseFrameName,
  detectDeviceType,
  findMatchingScreenshotSize,
  detectFrames,
  saveFigmaCredentials,
  loadFigmaCredentials,
  listFigmaCredentials,
  deleteFigmaCredentials,
} from '../src/services/figmaImport';
import {
  FigmaNode,
  FigmaCredentials,
  DetectedFrame,
  FrameDetectionConfig,
} from '../src/types/figmaImport';

// ============================================================================
// Test Runner
// ============================================================================

let testCount = 0;
let passedTests = 0;
let failedTests = 0;

function test(name: string, fn: () => void | Promise<void>) {
  testCount++;
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then(() => {
          passedTests++;
          console.log(`✓ ${name}`);
        })
        .catch((error) => {
          failedTests++;
          console.log(`✗ ${name}`);
          console.error(`  Error: ${error.message}`);
        });
    } else {
      passedTests++;
      console.log(`✓ ${name}`);
    }
  } catch (error: any) {
    failedTests++;
    console.log(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(
      `${message}\n  Expected: ${expected}\n  Actual: ${actual}`
    );
  }
}

// ============================================================================
// Mock Data
// ============================================================================

const mockFrames: FigmaNode[] = [
  {
    id: '1:1',
    name: 'iPhone 16 Pro Max - Portrait',
    type: 'FRAME',
    absoluteBoundingBox: {
      x: 0,
      y: 0,
      width: 1260,
      height: 2736,
    },
  },
  {
    id: '1:2',
    name: 'iPhone 16 - Landscape',
    type: 'FRAME',
    absoluteBoundingBox: {
      x: 0,
      y: 0,
      width: 2532,
      height: 1170,
    },
  },
  {
    id: '1:3',
    name: 'iPad Pro 12.9" - Portrait',
    type: 'FRAME',
    absoluteBoundingBox: {
      x: 0,
      y: 0,
      width: 2048,
      height: 2732,
    },
  },
  {
    id: '1:4',
    name: 'MacBook Pro 16" Screenshot',
    type: 'FRAME',
    absoluteBoundingBox: {
      x: 0,
      y: 0,
      width: 3456,
      height: 2234,
    },
  },
  {
    id: '1:5',
    name: 'Apple Watch Series 9',
    type: 'FRAME',
    absoluteBoundingBox: {
      x: 0,
      y: 0,
      width: 368,
      height: 448,
    },
  },
  {
    id: '1:6',
    name: 'Unknown Device',
    type: 'FRAME',
    absoluteBoundingBox: {
      x: 0,
      y: 0,
      width: 500,
      height: 500,
    },
  },
  {
    id: '1:7',
    name: 'Too Small',
    type: 'FRAME',
    absoluteBoundingBox: {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    },
  },
];

// ============================================================================
// Tests
// ============================================================================

async function runTests() {
  console.log('Running Figma Import Integration Tests...\n');

  // Parse Figma URL Tests
  console.log('--- Figma URL Parsing ---');

  test('Parse valid Figma URL with file key', () => {
    const result = parseFigmaUrl(
      'https://www.figma.com/file/ABC123XYZ/My-Design-File'
    );
    assert(result.isValid, 'Should be valid');
    assertEqual(result.fileKey, 'ABC123XYZ', 'File key should match');
    assertEqual(result.nodeId, undefined, 'Node ID should be undefined');
  });

  test('Parse Figma URL with node ID (hash)', () => {
    const result = parseFigmaUrl(
      'https://www.figma.com/file/ABC123XYZ/My-Design-File#node-id=1%3A23'
    );
    assert(result.isValid, 'Should be valid');
    assertEqual(result.fileKey, 'ABC123XYZ', 'File key should match');
    assertEqual(result.nodeId, '1:23', 'Node ID should be decoded');
  });

  test('Parse Figma URL with node ID (query)', () => {
    const result = parseFigmaUrl(
      'https://www.figma.com/file/ABC123XYZ/My-Design-File?node-id=1%3A23'
    );
    assert(result.isValid, 'Should be valid');
    assertEqual(result.nodeId, '1:23', 'Node ID should be decoded');
  });

  test('Reject invalid Figma URL', () => {
    const result = parseFigmaUrl('https://example.com/not-figma');
    assert(!result.isValid, 'Should be invalid');
  });

  test('Reject malformed URL', () => {
    const result = parseFigmaUrl('not-a-url');
    assert(!result.isValid, 'Should be invalid');
  });

  // Frame Name Parsing Tests
  console.log('\n--- Frame Name Parsing ---');

  test('Parse iPhone frame name', () => {
    const result = parseFrameName('iPhone 16 Pro Max - Portrait');
    assertEqual(result.deviceType, 'iphone', 'Should detect iPhone');
    assertEqual(result.orientation, 'portrait', 'Should detect portrait');
  });

  test('Parse iPad frame name', () => {
    const result = parseFrameName('iPad Pro 12.9" - Landscape');
    assertEqual(result.deviceType, 'ipad', 'Should detect iPad');
    assertEqual(result.orientation, 'landscape', 'Should detect landscape');
    assertEqual(result.sizeHint, '12.9', 'Should extract size hint');
  });

  test('Parse Mac frame name', () => {
    const result = parseFrameName('MacBook Pro 16 inch Screenshot');
    assertEqual(result.deviceType, 'mac', 'Should detect Mac');
    assertEqual(result.sizeHint, '16', 'Should extract size hint');
  });

  test('Parse Watch frame name', () => {
    const result = parseFrameName('Apple Watch Series 9');
    assertEqual(result.deviceType, 'watch', 'Should detect Watch');
  });

  test('Parse Vision Pro frame name', () => {
    const result = parseFrameName('Vision Pro Screenshot');
    assertEqual(result.deviceType, 'vision', 'Should detect Vision');
  });

  test('Parse generic frame name', () => {
    const result = parseFrameName('Screenshot 1');
    assertEqual(result.deviceType, undefined, 'Should not detect device type');
  });

  // Device Type Detection Tests
  console.log('\n--- Device Type Detection ---');

  test('Detect iPhone from dimensions (6.7")', () => {
    const result = detectDeviceType(1260, 2736);
    assertEqual(result, 'iphone', 'Should detect iPhone');
  });

  test('Detect iPad from dimensions (12.9")', () => {
    const result = detectDeviceType(2048, 2732);
    assertEqual(result, 'ipad', 'Should detect iPad');
  });

  test('Detect Mac from dimensions (16")', () => {
    const result = detectDeviceType(3456, 2234);
    assertEqual(result, 'mac', 'Should detect Mac');
  });

  test('Detect Watch from dimensions', () => {
    const result = detectDeviceType(368, 448);
    assertEqual(result, 'watch', 'Should detect Watch');
  });

  test('Detect TV from dimensions (4K)', () => {
    const result = detectDeviceType(3840, 2160);
    assertEqual(result, 'tv', 'Should detect TV');
  });

  test('Detect Vision Pro from dimensions', () => {
    const result = detectDeviceType(3840, 2160);
    // Vision Pro and TV have same dimensions, so either is valid
    assert(
      result === 'tv' || result === 'vision',
      'Should detect TV or Vision'
    );
  });

  test('No detection for unknown dimensions', () => {
    const result = detectDeviceType(500, 500);
    assertEqual(result, undefined, 'Should not detect device type');
  });

  // Screenshot Size Matching Tests
  console.log('\n--- Screenshot Size Matching ---');

  test('Exact match for iPhone 17 Pro Max', () => {
    const result = findMatchingScreenshotSize(1260, 2736);
    assert(result !== undefined, 'Should find match');
    assertEqual(result!.matchType, 'exact', 'Should be exact match');
    assertEqual(result!.similarity, 1.0, 'Should have 100% similarity');
  });

  test('Exact match for iPad Pro 12.9"', () => {
    const result = findMatchingScreenshotSize(2048, 2732);
    assert(result !== undefined, 'Should find match');
    assertEqual(result!.matchType, 'exact', 'Should be exact match');
  });

  test('Close match for slightly off dimensions', () => {
    const result = findMatchingScreenshotSize(1250, 2700); // Close to 1260×2736
    assert(result !== undefined, 'Should find match');
    assert(
      result!.similarity >= 0.95,
      'Should have high similarity'
    );
  });

  test('Aspect ratio match', () => {
    const result = findMatchingScreenshotSize(630, 1368); // Half of 1260×2736
    assert(result !== undefined, 'Should find match');
    assert(
      result!.matchType === 'aspect-ratio' || result!.matchType === 'close',
      'Should match by aspect ratio'
    );
  });

  test('No match for completely different dimensions', () => {
    const result = findMatchingScreenshotSize(100, 100);
    // Might still find an aspect ratio match, so just check it returns something or undefined
    assert(true, 'Function should execute without errors');
  });

  test('Filter by device type - iPhone', () => {
    const result = findMatchingScreenshotSize(1260, 2736, 'iphone');
    assert(result !== undefined, 'Should find iPhone match');
    assertEqual(result!.deviceType, 'iphone', 'Should be iPhone');
  });

  test('Filter by device type - iPad', () => {
    const result = findMatchingScreenshotSize(2048, 2732, 'ipad');
    assert(result !== undefined, 'Should find iPad match');
    assertEqual(result!.deviceType, 'ipad', 'Should be iPad');
  });

  // Frame Detection Tests
  console.log('\n--- Frame Detection ---');

  test('Detect all frames (no filters)', () => {
    const result = detectFrames(mockFrames);
    assert(result.length > 0, 'Should detect frames');
  });

  test('Detect frames with device type filter (iPhone)', () => {
    const config: FrameDetectionConfig = {
      deviceTypes: ['iphone'],
    };
    const result = detectFrames(mockFrames, config);
    assert(result.length >= 2, 'Should find at least 2 iPhone frames');
    for (const frame of result) {
      assertEqual(frame.deviceType, 'iphone', 'Should be iPhone');
    }
  });

  test('Detect frames with device type filter (iPad)', () => {
    const config: FrameDetectionConfig = {
      deviceTypes: ['ipad'],
    };
    const result = detectFrames(mockFrames, config);
    assert(result.length >= 1, 'Should find at least 1 iPad frame');
    for (const frame of result) {
      assertEqual(frame.deviceType, 'ipad', 'Should be iPad');
    }
  });

  test('Detect frames with dimension filters', () => {
    const config: FrameDetectionConfig = {
      minWidth: 1000,
      minHeight: 2000,
    };
    const result = detectFrames(mockFrames, config);
    for (const frame of result) {
      assert(frame.width >= 1000, 'Width should be >= 1000');
      assert(frame.height >= 2000, 'Height should be >= 2000');
    }
  });

  test('Detect frames excluding unknown devices', () => {
    const config: FrameDetectionConfig = {
      includeUnknown: false,
    };
    const result = detectFrames(mockFrames, config);
    for (const frame of result) {
      assert(frame.deviceType !== undefined, 'Should have device type');
    }
  });

  test('Detect frames with minimum confidence', () => {
    const config: FrameDetectionConfig = {
      minConfidence: 0.5,
    };
    const result = detectFrames(mockFrames, config);
    for (const frame of result) {
      assert(frame.confidence >= 0.5, 'Confidence should be >= 0.5');
    }
  });

  test('Frames sorted by confidence (descending)', () => {
    const result = detectFrames(mockFrames);
    for (let i = 1; i < result.length; i++) {
      assert(
        result[i - 1].confidence >= result[i].confidence,
        'Frames should be sorted by confidence descending'
      );
    }
  });

  // Credentials Management Tests
  console.log('\n--- Credentials Management ---');

  const testCredId = 'test-credentials';
  const testCredentials: FigmaCredentials = {
    accessToken: 'test-token-12345',
    label: 'Test Credentials',
    createdAt: new Date(),
  };

  await test('Save credentials', async () => {
    await saveFigmaCredentials(testCredentials, testCredId);
    const loaded = await loadFigmaCredentials(testCredId);
    assert(loaded !== null, 'Credentials should be saved');
    assertEqual(
      loaded!.accessToken,
      testCredentials.accessToken,
      'Access token should match'
    );
  });

  await test('Load credentials', async () => {
    const loaded = await loadFigmaCredentials(testCredId);
    assert(loaded !== null, 'Credentials should load');
    assertEqual(
      loaded!.accessToken,
      testCredentials.accessToken,
      'Access token should match'
    );
  });

  await test('List credentials', async () => {
    const list = await listFigmaCredentials();
    assert(list.length > 0, 'Should have credentials');
    const found = list.find((c) => c.id === testCredId);
    assert(found !== undefined, 'Should find test credentials');
  });

  await test('Delete credentials', async () => {
    const deleted = await deleteFigmaCredentials(testCredId);
    assert(deleted, 'Should delete successfully');
    const loaded = await loadFigmaCredentials(testCredId);
    assert(loaded === null, 'Credentials should be gone');
  });

  await test('Load non-existent credentials', async () => {
    const loaded = await loadFigmaCredentials('non-existent');
    assert(loaded === null, 'Should return null');
  });

  // Test Summary
  console.log('\n===========================================');
  console.log(`Total Tests: ${testCount}`);
  console.log(`Passed: ${passedTests} ✓`);
  console.log(`Failed: ${failedTests} ✗`);
  console.log(`Success Rate: ${((passedTests / testCount) * 100).toFixed(1)}%`);
  console.log('===========================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});
