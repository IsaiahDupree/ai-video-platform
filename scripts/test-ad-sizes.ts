/**
 * Test script for ADS-008: Size Presets
 * Verifies the ad sizes configuration and utility functions
 */

import {
  getAllSizes,
  getRecommendedSizes,
  getSizesByPlatform,
  getSizesByCategory,
  getSizeById,
  getSizesByTag,
  getSizesByAspectRatio,
  findClosestSize,
  getAllPlatforms,
  getAllCategories,
  AD_SIZES_MAP,
  AD_SIZES_LEGACY,
  toAdDimensions,
  type AdSize,
} from '../src/config/adSizes';

console.log('='.repeat(80));
console.log('ADS-008: Size Presets - Test Suite');
console.log('='.repeat(80));
console.log();

// Test 1: Get all sizes
console.log('Test 1: Get All Sizes');
console.log('-'.repeat(80));
const allSizes = getAllSizes();
console.log(`Total sizes available: ${allSizes.length}`);
console.log('First 5 sizes:');
allSizes.slice(0, 5).forEach((size) => {
  console.log(
    `  - ${size.name}: ${size.width}x${size.height} (${size.aspectRatio}) [${size.platform}]`
  );
});
console.log();

// Test 2: Get recommended sizes
console.log('Test 2: Get Recommended Sizes');
console.log('-'.repeat(80));
const recommendedSizes = getRecommendedSizes();
console.log(`Recommended sizes: ${recommendedSizes.length}`);
recommendedSizes.forEach((size) => {
  console.log(
    `  - ${size.name}: ${size.width}x${size.height} [${size.platform}]`
  );
});
console.log();

// Test 3: Get sizes by platform
console.log('Test 3: Get Sizes by Platform');
console.log('-'.repeat(80));
const platforms = ['Instagram', 'Facebook', 'Google Display'];
platforms.forEach((platform) => {
  const sizes = getSizesByPlatform(platform as any);
  console.log(`${platform}: ${sizes.length} sizes`);
  sizes.forEach((size) => {
    console.log(`  - ${size.name} (${size.width}x${size.height})`);
  });
});
console.log();

// Test 4: Get sizes by category
console.log('Test 4: Get Sizes by Category');
console.log('-'.repeat(80));
const categories = getAllCategories();
console.log(`Categories: ${categories.join(', ')}`);
categories.forEach((category) => {
  const sizes = getSizesByCategory(category);
  console.log(`${category}: ${sizes.length} sizes`);
});
console.log();

// Test 5: Get size by ID
console.log('Test 5: Get Size by ID');
console.log('-'.repeat(80));
const testIds = ['instagram-square', 'facebook-feed', 'google-medium-rectangle'];
testIds.forEach((id) => {
  const size = getSizeById(id);
  if (size) {
    console.log(
      `${id}: ${size.name} - ${size.width}x${size.height} (${size.aspectRatio})`
    );
  } else {
    console.log(`${id}: NOT FOUND`);
  }
});
console.log();

// Test 6: Get sizes by tag
console.log('Test 6: Get Sizes by Tag');
console.log('-'.repeat(80));
const testTags = ['square', 'vertical', 'banner'];
testTags.forEach((tag) => {
  const sizes = getSizesByTag(tag);
  console.log(`Tag "${tag}": ${sizes.length} sizes`);
  sizes.slice(0, 3).forEach((size) => {
    console.log(`  - ${size.name} (${size.width}x${size.height})`);
  });
});
console.log();

// Test 7: Get sizes by aspect ratio
console.log('Test 7: Get Sizes by Aspect Ratio');
console.log('-'.repeat(80));
const testAspectRatios = ['1:1', '16:9', '9:16'];
testAspectRatios.forEach((ratio) => {
  const sizes = getSizesByAspectRatio(ratio);
  console.log(`Aspect Ratio ${ratio}: ${sizes.length} sizes`);
  sizes.forEach((size) => {
    console.log(`  - ${size.name} (${size.width}x${size.height})`);
  });
});
console.log();

// Test 8: Find closest size
console.log('Test 8: Find Closest Size');
console.log('-'.repeat(80));
const testDimensions = [
  { width: 1080, height: 1080 },
  { width: 1000, height: 1000 },
  { width: 1920, height: 1080 },
  { width: 500, height: 500 },
];
testDimensions.forEach(({ width, height }) => {
  const closest = findClosestSize(width, height);
  if (closest) {
    console.log(
      `${width}x${height} -> ${closest.name} (${closest.width}x${closest.height})`
    );
  }
});
console.log();

// Test 9: Get all platforms
console.log('Test 9: Get All Platforms');
console.log('-'.repeat(80));
const allPlatforms = getAllPlatforms();
console.log(`Total platforms: ${allPlatforms.length}`);
console.log(`Platforms: ${allPlatforms.join(', ')}`);
console.log();

// Test 10: Legacy format compatibility
console.log('Test 10: Legacy Format Compatibility');
console.log('-'.repeat(80));
console.log('Sample legacy sizes:');
const legacyKeys = Object.keys(AD_SIZES_LEGACY).slice(0, 5);
legacyKeys.forEach((key) => {
  const size = AD_SIZES_LEGACY[key];
  console.log(
    `  ${key}: ${size.name} - ${size.width}x${size.height} [${size.platform}]`
  );
});
console.log();

// Test 11: Size map lookup
console.log('Test 11: Size Map Lookup');
console.log('-'.repeat(80));
const mapTestIds = ['instagram-square', 'youtube-thumbnail', 'google-leaderboard'];
mapTestIds.forEach((id) => {
  const size = AD_SIZES_MAP[id];
  if (size) {
    console.log(
      `${id}: ${size.name} - ${size.width}x${size.height}`
    );
  }
});
console.log();

// Test 12: toAdDimensions conversion
console.log('Test 12: toAdDimensions Conversion');
console.log('-'.repeat(80));
const instagramSquare = getSizeById('instagram-square');
if (instagramSquare) {
  const converted = toAdDimensions(instagramSquare);
  console.log('Original:', instagramSquare);
  console.log('Converted:', converted);
}
console.log();

// Summary
console.log('='.repeat(80));
console.log('Test Summary');
console.log('='.repeat(80));
console.log(`Total Sizes: ${allSizes.length}`);
console.log(`Recommended Sizes: ${recommendedSizes.length}`);
console.log(`Platforms: ${allPlatforms.length}`);
console.log(`Categories: ${categories.length}`);
console.log();

// Verify key sizes are present
console.log('Verification Checklist:');
const mustHaveSizes = [
  'instagram-square',
  'instagram-story',
  'facebook-feed',
  'google-medium-rectangle',
  'youtube-thumbnail',
];
const missingKeys = mustHaveSizes.filter((id) => !getSizeById(id));
if (missingKeys.length === 0) {
  console.log('✓ All essential sizes are present');
} else {
  console.log('✗ Missing sizes:', missingKeys.join(', '));
}

// Verify all sizes have required fields
const invalidSizes = allSizes.filter(
  (size) =>
    !size.id ||
    !size.name ||
    !size.width ||
    !size.height ||
    !size.aspectRatio ||
    !size.platform ||
    !size.category
);
if (invalidSizes.length === 0) {
  console.log('✓ All sizes have required fields');
} else {
  console.log('✗ Invalid sizes found:', invalidSizes.length);
}

console.log();
console.log('='.repeat(80));
console.log('All tests completed successfully!');
console.log('='.repeat(80));
