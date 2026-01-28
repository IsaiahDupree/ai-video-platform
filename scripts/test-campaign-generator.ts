/**
 * Test Campaign Generator - ADS-011
 * Test the campaign pack generation functionality
 */

import {
  Campaign,
  CopyVariant,
  createDefaultCampaign,
  getTotalAssetCount,
  validateCampaign,
  FILE_NAMING_TEMPLATES,
  applyNamingTemplate,
  sanitizeFilename,
} from '../src/types/campaign';
import { AdTemplate } from '../src/types/adTemplate';
import { getSizeById } from '../src/config/adSizes';

// Test utilities
function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Test failed: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

function testSection(name: string) {
  console.log(`\n=== ${name} ===`);
}

// Mock base template
const mockTemplate: AdTemplate = {
  id: 'test-template',
  name: 'Test Template',
  layout: 'hero-text',
  dimensions: {
    width: 1080,
    height: 1080,
    name: 'Square',
  },
  content: {
    headline: 'Test Headline',
    subheadline: 'Test Subheadline',
    body: 'Test body text',
    cta: 'Learn More',
  },
  style: {
    primaryColor: '#3b82f6',
    textColor: '#ffffff',
  },
};

// Test Campaign Creation
testSection('Campaign Creation');

const campaign = createDefaultCampaign(mockTemplate);
assert(campaign.id.startsWith('campaign-'), 'Campaign has valid ID');
assert(campaign.name === 'New Campaign', 'Campaign has default name');
assert(campaign.copyVariants.length === 1, 'Campaign has one default variant');
assert(campaign.baseTemplate.id === mockTemplate.id, 'Base template is set correctly');
console.log('Campaign created:', campaign.id);

// Test Variant Management
testSection('Copy Variant Management');

const variant1: CopyVariant = {
  id: 'variant-1',
  name: 'Variant 1',
  headline: 'First Variant Headline',
  subheadline: 'First Variant Subheadline',
  body: 'First variant body',
  cta: 'Buy Now',
};

const variant2: CopyVariant = {
  id: 'variant-2',
  name: 'Variant 2',
  headline: 'Second Variant Headline',
  subheadline: 'Second Variant Subheadline',
  body: 'Second variant body',
  cta: 'Sign Up',
};

campaign.copyVariants = [variant1, variant2];
assert(campaign.copyVariants.length === 2, 'Campaign has two variants');
assert(campaign.copyVariants[0].headline === 'First Variant Headline', 'Variant 1 headline is correct');
assert(campaign.copyVariants[1].headline === 'Second Variant Headline', 'Variant 2 headline is correct');

// Test Size Selection
testSection('Size Selection');

campaign.sizes = [
  { sizeId: 'instagram-square', enabled: true },
  { sizeId: 'instagram-story', enabled: true },
  { sizeId: 'facebook-feed', enabled: true },
  { sizeId: 'twitter-post', enabled: false },
];

const enabledSizes = campaign.sizes.filter((s) => s.enabled);
assert(enabledSizes.length === 3, 'Campaign has 3 enabled sizes');

const totalAssets = getTotalAssetCount(campaign);
const expectedAssets = 2 * 3; // 2 variants × 3 sizes
assert(totalAssets === expectedAssets, `Total asset count is correct (${totalAssets} = 2 variants × 3 sizes)`);

// Test Campaign Validation
testSection('Campaign Validation');

const validation = validateCampaign(campaign);
assert(validation.valid, 'Campaign validation passes');
assert(validation.errors.length === 0, 'No validation errors');

// Test invalid campaign
const invalidCampaign: Campaign = {
  ...campaign,
  name: '',
  copyVariants: [],
};

const invalidValidation = validateCampaign(invalidCampaign);
assert(!invalidValidation.valid, 'Invalid campaign fails validation');
assert(invalidValidation.errors.length > 0, 'Validation returns errors');
console.log('Validation errors (expected):', invalidValidation.errors);

// Test File Naming
testSection('File Naming');

const size1 = getSizeById('instagram-square');
assert(size1 !== undefined, 'Instagram square size exists');

const namingVariables = {
  campaignName: 'My Campaign',
  variantName: 'Variant A',
  variantId: 'var-1',
  sizeName: size1!.name,
  sizeId: size1!.id,
  width: size1!.width,
  height: size1!.height,
  platform: size1!.platform,
  index: 1,
  timestamp: Date.now(),
};

const filename1 = applyNamingTemplate(
  FILE_NAMING_TEMPLATES.VARIANT_SIZE,
  namingVariables,
  'png'
);
assert(filename1.includes('Variant_A'), 'Variant name in filename');
assert(filename1.includes('Instagram_Square'), 'Size name in filename');
assert(filename1.endsWith('.png'), 'PNG extension added');
console.log('Generated filename:', filename1);

const filename2 = applyNamingTemplate(
  FILE_NAMING_TEMPLATES.CAMPAIGN_VARIANT_DIMENSIONS,
  namingVariables,
  'jpeg'
);
assert(filename2.includes('1080x1080'), 'Dimensions in filename');
assert(filename2.endsWith('.jpeg'), 'JPEG extension added');
console.log('Generated filename:', filename2);

// Test Filename Sanitization
testSection('Filename Sanitization');

const dirtyName = 'My Campaign: Version 2.0 (Final)';
const cleanName = sanitizeFilename(dirtyName);
assert(cleanName === 'My_Campaign_Version_2_0_Final', 'Filename sanitized correctly');
console.log('Sanitized:', dirtyName, '->', cleanName);

const edgeCaseName = '___test___name___';
const cleanEdgeName = sanitizeFilename(edgeCaseName);
assert(cleanEdgeName === 'test_name', 'Edge case sanitization works');
console.log('Sanitized:', edgeCaseName, '->', cleanEdgeName);

// Test Output Settings
testSection('Output Settings');

campaign.output.format = 'png';
campaign.output.quality = 90;
campaign.output.organizationMode = 'by-variant';
campaign.output.includeManifest = true;

assert(campaign.output.format === 'png', 'Output format is PNG');
assert(campaign.output.organizationMode === 'by-variant', 'Organization mode is by-variant');
assert(campaign.output.includeManifest === true, 'Manifest is enabled');

// Test different organization modes
campaign.output.organizationMode = 'by-size';
assert(campaign.output.organizationMode === 'by-size', 'Organization mode changed to by-size');

campaign.output.organizationMode = 'flat';
assert(campaign.output.organizationMode === 'flat', 'Organization mode changed to flat');

// Test Asset Count Calculation
testSection('Asset Count Calculation');

// Test various combinations
const testCases = [
  { variants: 1, sizes: 1, expected: 1 },
  { variants: 3, sizes: 5, expected: 15 },
  { variants: 10, sizes: 10, expected: 100 },
];

for (const testCase of testCases) {
  const testCampaign: Campaign = {
    ...campaign,
    copyVariants: Array(testCase.variants).fill(variant1),
    sizes: Array(testCase.sizes).fill({ sizeId: 'test', enabled: true }),
  };

  const count = getTotalAssetCount(testCampaign);
  assert(
    count === testCase.expected,
    `Asset count for ${testCase.variants}×${testCase.sizes} = ${count}`
  );
}

// Test Size Lookup
testSection('Size Lookup');

const testSizes = [
  'instagram-square',
  'facebook-feed',
  'twitter-post',
  'linkedin-square',
  'youtube-thumbnail',
];

for (const sizeId of testSizes) {
  const size = getSizeById(sizeId);
  assert(size !== undefined, `Size ${sizeId} exists`);
  assert(size!.width > 0, `Size ${sizeId} has valid width`);
  assert(size!.height > 0, `Size ${sizeId} has valid height`);
  console.log(`${sizeId}: ${size!.width}×${size!.height} (${size!.platform})`);
}

// Test Metadata
testSection('Campaign Metadata');

campaign.metadata = {
  client: 'Acme Corp',
  brand: 'Acme Products',
  objective: 'Brand Awareness',
  platforms: ['Instagram', 'Facebook', 'Twitter'],
  tags: ['summer', 'sale', '2026'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  author: 'Test User',
};

assert(campaign.metadata.client === 'Acme Corp', 'Client metadata set');
assert(campaign.metadata.platforms!.length === 3, 'Platforms metadata set');
assert(campaign.metadata.tags!.length === 3, 'Tags metadata set');
console.log('Metadata:', campaign.metadata);

// Summary
console.log('\n=== All Tests Passed ✅ ===');
console.log(`Total test assertions: 40+`);
console.log('Campaign generator types and utilities working correctly!');
