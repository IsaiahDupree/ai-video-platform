#!/usr/bin/env tsx

/**
 * Test script for Screenshot Template Library - APP-022
 *
 * Tests:
 * 1. Template loading and structure
 * 2. Filter and search functions
 * 3. Template metadata and statistics
 * 4. Helper functions
 */

import {
  SCREENSHOT_TEMPLATES,
  getTemplateById,
  getTemplatesByCategory,
  getTemplatesByLayout,
  getTemplatesByTheme,
  getTemplatesByDeviceType,
  getTemplatesByTag,
  getTemplatesByIndustry,
  getFeaturedTemplates,
  getPopularTemplates,
  searchTemplates,
  filterTemplates,
  getAllCategories,
  getAllLayoutTypes,
  getAllThemes,
  getAllDeviceTypes,
  getAllIndustries,
  getAllTags,
  getTemplateStatistics,
  TEMPLATE_STATS,
} from '../src/templates/screenshots';

// Test results tracking
let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      result
        .then(() => {
          console.log(`✅ ${name}`);
          passed++;
        })
        .catch((error) => {
          console.error(`❌ ${name}:`, error.message);
          failed++;
        });
    } else {
      console.log(`✅ ${name}`);
      passed++;
    }
  } catch (error: any) {
    console.error(`❌ ${name}:`, error.message);
    failed++;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

console.log('🧪 Testing Screenshot Template Library\n');

// Test 1: Template Loading
console.log('📋 Test 1: Template Loading');
test('Should load all templates', () => {
  assert(SCREENSHOT_TEMPLATES.length > 0, 'No templates loaded');
  assert(SCREENSHOT_TEMPLATES.length === 10, `Expected 10 templates, got ${SCREENSHOT_TEMPLATES.length}`);
});

test('Should have valid template structure', () => {
  SCREENSHOT_TEMPLATES.forEach((template) => {
    assert(!!template.id, `Template missing id: ${template.name}`);
    assert(!!template.name, `Template missing name: ${template.id}`);
    assert(!!template.description, `Template missing description: ${template.id}`);
    assert(!!template.deviceConfig, `Template missing deviceConfig: ${template.id}`);
    assert(Array.isArray(template.captionLayers), `Template captionLayers not an array: ${template.id}`);
    assert(!!template.layoutType, `Template missing layoutType: ${template.id}`);
    assert(!!template.metadata, `Template missing metadata: ${template.id}`);
    assert(!!template.metadata.category, `Template missing metadata.category: ${template.id}`);
    assert(Array.isArray(template.metadata.tags), `Template metadata.tags not an array: ${template.id}`);
    assert(Array.isArray(template.metadata.supportedDeviceTypes), `Template metadata.supportedDeviceTypes not an array: ${template.id}`);
    assert(Array.isArray(template.metadata.themes), `Template metadata.themes not an array: ${template.id}`);
    assert(!!template.metadata.useCase, `Template missing metadata.useCase: ${template.id}`);
    assert(!!template.metadata.version, `Template missing metadata.version: ${template.id}`);
  });
});

// Test 2: Get Template By ID
console.log('\n📋 Test 2: Get Template By ID');
test('Should get template by valid ID', () => {
  const template = getTemplateById('feature-highlight-hero');
  assert(!!template, 'Template not found');
  assert(template.id === 'feature-highlight-hero', 'Wrong template returned');
  assert(template.name === 'Feature Highlight - Hero', 'Wrong template name');
});

test('Should return undefined for invalid ID', () => {
  const template = getTemplateById('non-existent-template');
  assert(template === undefined, 'Should return undefined for invalid ID');
});

// Test 3: Filter by Category
console.log('\n📋 Test 3: Filter by Category');
test('Should filter by feature-showcase category', () => {
  const templates = getTemplatesByCategory('feature-showcase');
  assert(templates.length > 0, 'No templates found for feature-showcase');
  templates.forEach((t) => {
    assert(t.metadata.category === 'feature-showcase', `Wrong category: ${t.metadata.category}`);
  });
});

test('Should filter by tutorial category', () => {
  const templates = getTemplatesByCategory('tutorial');
  assert(templates.length > 0, 'No templates found for tutorial');
  templates.forEach((t) => {
    assert(t.metadata.category === 'tutorial', `Wrong category: ${t.metadata.category}`);
  });
});

// Test 4: Filter by Layout Type
console.log('\n📋 Test 4: Filter by Layout Type');
test('Should filter by hero layout', () => {
  const templates = getTemplatesByLayout('hero');
  assert(templates.length > 0, 'No templates found for hero layout');
  templates.forEach((t) => {
    assert(t.layoutType === 'hero', `Wrong layout: ${t.layoutType}`);
  });
});

test('Should filter by multi-caption layout', () => {
  const templates = getTemplatesByLayout('multi-caption');
  assert(templates.length > 0, 'No templates found for multi-caption layout');
  templates.forEach((t) => {
    assert(t.layoutType === 'multi-caption', `Wrong layout: ${t.layoutType}`);
  });
});

// Test 5: Filter by Theme
console.log('\n📋 Test 5: Filter by Theme');
test('Should filter by dark theme', () => {
  const templates = getTemplatesByTheme('dark');
  assert(templates.length > 0, 'No templates found for dark theme');
  templates.forEach((t) => {
    assert(t.metadata.themes.includes('dark'), `Template doesn't support dark theme: ${t.id}`);
  });
});

test('Should filter by light theme', () => {
  const templates = getTemplatesByTheme('light');
  assert(templates.length > 0, 'No templates found for light theme');
  templates.forEach((t) => {
    assert(t.metadata.themes.includes('light'), `Template doesn't support light theme: ${t.id}`);
  });
});

// Test 6: Filter by Device Type
console.log('\n📋 Test 6: Filter by Device Type');
test('Should filter by iPhone device type', () => {
  const templates = getTemplatesByDeviceType('iphone');
  assert(templates.length > 0, 'No templates found for iPhone');
  templates.forEach((t) => {
    assert(t.metadata.supportedDeviceTypes.includes('iphone'), `Template doesn't support iPhone: ${t.id}`);
  });
});

test('Should filter by iPad device type', () => {
  const templates = getTemplatesByDeviceType('ipad');
  assert(templates.length > 0, 'No templates found for iPad');
  templates.forEach((t) => {
    assert(t.metadata.supportedDeviceTypes.includes('ipad'), `Template doesn't support iPad: ${t.id}`);
  });
});

// Test 7: Filter by Tags
console.log('\n📋 Test 7: Filter by Tags');
test('Should filter by "hero" tag', () => {
  const templates = getTemplatesByTag('hero');
  assert(templates.length > 0, 'No templates found with "hero" tag');
  templates.forEach((t) => {
    assert(t.metadata.tags.includes('hero'), `Template doesn't have "hero" tag: ${t.id}`);
  });
});

test('Should filter by "minimal" tag', () => {
  const templates = getTemplatesByTag('minimal');
  assert(templates.length > 0, 'No templates found with "minimal" tag');
  templates.forEach((t) => {
    assert(t.metadata.tags.includes('minimal'), `Template doesn't have "minimal" tag: ${t.id}`);
  });
});

// Test 8: Filter by Industry
console.log('\n📋 Test 8: Filter by Industry');
test('Should filter by technology industry', () => {
  const templates = getTemplatesByIndustry('technology');
  assert(templates.length > 0, 'No templates found for technology industry');
  templates.forEach((t) => {
    assert(t.metadata.industry && t.metadata.industry.includes('technology'), `Template doesn't support technology industry: ${t.id}`);
  });
});

// Test 9: Featured Templates
console.log('\n📋 Test 9: Featured Templates');
test('Should get featured templates', () => {
  const featured = getFeaturedTemplates();
  assert(featured.length > 0, 'No featured templates found');
  featured.forEach((t) => {
    assert(t.metadata.featured === true, `Template is not featured: ${t.id}`);
  });
});

// Test 10: Popular Templates
console.log('\n📋 Test 10: Popular Templates');
test('Should get popular templates', () => {
  const popular = getPopularTemplates(5);
  assert(popular.length <= 5, 'Too many templates returned');
  // Check if sorted by popularity
  for (let i = 0; i < popular.length - 1; i++) {
    const currentPop = popular[i].metadata.popularity || 0;
    const nextPop = popular[i + 1].metadata.popularity || 0;
    assert(currentPop >= nextPop, 'Templates not sorted by popularity');
  }
});

// Test 11: Search Templates
console.log('\n📋 Test 11: Search Templates');
test('Should search by name', () => {
  const results = searchTemplates('hero');
  assert(results.length > 0, 'No results for "hero"');
  results.forEach((t) => {
    const nameMatch = t.name.toLowerCase().includes('hero');
    const descMatch = t.description.toLowerCase().includes('hero');
    const tagMatch = t.metadata.tags.some((tag) => tag.toLowerCase().includes('hero'));
    assert(nameMatch || descMatch || tagMatch, `Template doesn't match "hero": ${t.id}`);
  });
});

test('Should search by description', () => {
  const results = searchTemplates('tutorial');
  assert(results.length > 0, 'No results for "tutorial"');
});

// Test 12: Complex Filtering
console.log('\n📋 Test 12: Complex Filtering');
test('Should filter by multiple criteria', () => {
  const results = filterTemplates({
    category: 'feature-showcase',
    themes: 'dark',
  });
  assert(results.length > 0, 'No results for complex filter');
  results.forEach((t) => {
    assert(t.metadata.category === 'feature-showcase', 'Wrong category');
    assert(t.metadata.themes.includes('dark'), 'Wrong theme');
  });
});

test('Should filter by tags and layout', () => {
  const results = filterTemplates({
    tags: 'hero',
    layoutType: 'hero',
  });
  assert(results.length > 0, 'No results for tag + layout filter');
  results.forEach((t) => {
    assert(t.metadata.tags.includes('hero'), 'Wrong tag');
    assert(t.layoutType === 'hero', 'Wrong layout');
  });
});

test('Should filter featured templates', () => {
  const results = filterTemplates({
    featured: true,
  });
  assert(results.length > 0, 'No featured templates');
  results.forEach((t) => {
    assert(t.metadata.featured === true, 'Not featured');
  });
});

// Test 13: Get Unique Values
console.log('\n📋 Test 13: Get Unique Values');
test('Should get all categories', () => {
  const categories = getAllCategories();
  assert(categories.length > 0, 'No categories found');
  assert(Array.isArray(categories), 'Categories not an array');
});

test('Should get all layout types', () => {
  const layouts = getAllLayoutTypes();
  assert(layouts.length > 0, 'No layouts found');
  assert(Array.isArray(layouts), 'Layouts not an array');
});

test('Should get all themes', () => {
  const themes = getAllThemes();
  assert(themes.length > 0, 'No themes found');
  assert(Array.isArray(themes), 'Themes not an array');
});

test('Should get all device types', () => {
  const deviceTypes = getAllDeviceTypes();
  assert(deviceTypes.length > 0, 'No device types found');
  assert(Array.isArray(deviceTypes), 'Device types not an array');
});

test('Should get all industries', () => {
  const industries = getAllIndustries();
  assert(industries.length > 0, 'No industries found');
  assert(Array.isArray(industries), 'Industries not an array');
});

test('Should get all tags', () => {
  const tags = getAllTags();
  assert(tags.length > 0, 'No tags found');
  assert(Array.isArray(tags), 'Tags not an array');
});

// Test 14: Statistics
console.log('\n📋 Test 14: Statistics');
test('Should get template statistics', () => {
  const stats = getTemplateStatistics();
  assert(stats.totalTemplates === SCREENSHOT_TEMPLATES.length, 'Wrong total count');
  assert(typeof stats.categories === 'object', 'Categories not an object');
  assert(typeof stats.layoutTypes === 'object', 'Layout types not an object');
  assert(typeof stats.themes === 'object', 'Themes not an object');
  assert(typeof stats.deviceTypes === 'object', 'Device types not an object');
  assert(Array.isArray(stats.mostPopular), 'Most popular not an array');
  assert(Array.isArray(stats.recentlyAdded), 'Recently added not an array');
});

test('Should have pre-computed TEMPLATE_STATS', () => {
  assert(TEMPLATE_STATS.totalTemplates === SCREENSHOT_TEMPLATES.length, 'Wrong total count');
  assert(typeof TEMPLATE_STATS.categories === 'object', 'Categories not an object');
  assert(typeof TEMPLATE_STATS.layoutTypes === 'object', 'Layout types not an object');
});

// Test 15: Template Content Validation
console.log('\n📋 Test 15: Template Content Validation');
test('Should have valid device configs', () => {
  SCREENSHOT_TEMPLATES.forEach((t) => {
    assert(!!t.deviceConfig.device, `Missing device: ${t.id}`);
    assert(!!t.deviceConfig.orientation, `Missing orientation: ${t.id}`);
  });
});

test('Should have valid caption layers', () => {
  SCREENSHOT_TEMPLATES.forEach((t) => {
    t.captionLayers.forEach((caption, index) => {
      assert(!!caption.id, `Caption ${index} missing id in ${t.id}`);
      assert(!!caption.text, `Caption ${index} missing text in ${t.id}`);
      assert(!!caption.positioning, `Caption ${index} missing positioning in ${t.id}`);
      assert(!!caption.style, `Caption ${index} missing style in ${t.id}`);
    });
  });
});

// Summary
setTimeout(() => {
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  }
}, 1000);
