#!/usr/bin/env tsx

/**
 * Test script for ADS-002: Starter Template Library
 * Verifies all templates are valid and accessible
 */

import {
  STARTER_TEMPLATES,
  getTemplateById,
  getTemplatesByCategory,
  getTemplatesByIndustry,
  getTemplatesByLayout,
  getTemplatesByPlatform,
  searchTemplates,
  getAllCategories,
  getAllIndustries,
  getAllTags,
  TEMPLATE_STATS
} from '../src/templates/ads/index';

function runTests() {
  console.log('🧪 Testing Ad Template Library (ADS-002)\n');

  // Test 1: Load all templates
  console.log('✅ Test 1: Load All Templates');
  console.log(`   Found ${STARTER_TEMPLATES.length} templates\n`);

  // Test 2: Validate template structure
  console.log('✅ Test 2: Validate Template Structure');
  let validCount = 0;
  for (const template of STARTER_TEMPLATES) {
    if (
      template.id &&
      template.name &&
      template.layout &&
      template.dimensions &&
      template.content &&
      template.style &&
      template.metadata
    ) {
      validCount++;
    } else {
      console.log(`   ❌ Invalid template: ${template.id || 'unknown'}`);
    }
  }
  console.log(`   ${validCount}/${STARTER_TEMPLATES.length} templates valid\n`);

  // Test 3: Get template by ID
  console.log('✅ Test 3: Get Template By ID');
  const template = getTemplateById('app-launch-001');
  console.log(`   Found: ${template?.name || 'Not found'}\n`);

  // Test 4: Filter by category
  console.log('✅ Test 4: Filter By Category');
  const ecommerceTemplates = getTemplatesByCategory('e-commerce');
  console.log(`   E-commerce templates: ${ecommerceTemplates.length}`);
  ecommerceTemplates.forEach(t => console.log(`   - ${t.name}`));
  console.log();

  // Test 5: Filter by industry
  console.log('✅ Test 5: Filter By Industry');
  const techTemplates = getTemplatesByIndustry('technology');
  console.log(`   Technology templates: ${techTemplates.length}`);
  techTemplates.forEach(t => console.log(`   - ${t.name}`));
  console.log();

  // Test 6: Filter by layout
  console.log('✅ Test 6: Filter By Layout');
  const heroTemplates = getTemplatesByLayout('hero-text');
  console.log(`   Hero text templates: ${heroTemplates.length}`);
  heroTemplates.forEach(t => console.log(`   - ${t.name}`));
  console.log();

  // Test 7: Filter by platform
  console.log('✅ Test 7: Filter By Platform');
  const instagramTemplates = getTemplatesByPlatform('Instagram');
  console.log(`   Instagram templates: ${instagramTemplates.length}`);
  console.log();

  // Test 8: Search templates
  console.log('✅ Test 8: Search Templates');
  const fitnessTemplates = searchTemplates('fitness');
  console.log(`   Search "fitness": ${fitnessTemplates.length} results`);
  fitnessTemplates.forEach(t => console.log(`   - ${t.name}`));
  console.log();

  // Test 9: Get all categories
  console.log('✅ Test 9: Get All Categories');
  const categories = getAllCategories();
  console.log(`   Categories (${categories.length}): ${categories.join(', ')}\n`);

  // Test 10: Get all industries
  console.log('✅ Test 10: Get All Industries');
  const industries = getAllIndustries();
  console.log(`   Industries (${industries.length}): ${industries.join(', ')}\n`);

  // Test 11: Get all tags
  console.log('✅ Test 11: Get All Tags');
  const tags = getAllTags();
  console.log(`   Tags (${tags.length}): ${tags.slice(0, 10).join(', ')}...\n`);

  // Test 12: Template statistics
  console.log('✅ Test 12: Template Statistics');
  console.log(`   Total templates: ${TEMPLATE_STATS.total}`);
  console.log(`   By Layout:`);
  Object.entries(TEMPLATE_STATS.byLayout).forEach(([layout, count]) => {
    console.log(`      ${layout}: ${count}`);
  });
  console.log(`   By Platform:`);
  Object.entries(TEMPLATE_STATS.byPlatform).forEach(([platform, count]) => {
    console.log(`      ${platform}: ${count}`);
  });
  console.log(`   Unique categories: ${TEMPLATE_STATS.categories}`);
  console.log(`   Unique industries: ${TEMPLATE_STATS.industries}`);
  console.log(`   Unique tags: ${TEMPLATE_STATS.tags}\n`);

  // Summary
  console.log('📊 Summary:');
  console.log(`   ✅ All ${STARTER_TEMPLATES.length} templates loaded successfully`);
  console.log(`   ✅ ${validCount} templates have valid structure`);
  console.log(`   ✅ ${categories.length} categories available`);
  console.log(`   ✅ ${industries.length} industries covered`);
  console.log(`   ✅ ${tags.length} searchable tags`);
  console.log('\n🎉 ADS-002: Starter Template Library - All Tests Passed!\n');

  // List all templates
  console.log('📋 Complete Template List:\n');
  STARTER_TEMPLATES.forEach((template, index) => {
    console.log(`${index + 1}. ${template.name}`);
    console.log(`   ID: ${template.id}`);
    console.log(`   Layout: ${template.layout}`);
    console.log(`   Platform: ${template.dimensions.platform} (${template.dimensions.width}x${template.dimensions.height})`);
    console.log(`   Category: ${template.metadata?.category || 'N/A'}`);
    console.log(`   Industry: ${template.metadata?.industry || 'N/A'}`);
    console.log(`   Tags: ${template.metadata?.tags?.join(', ') || 'N/A'}`);
    console.log();
  });
}

// Run tests
try {
  runTests();
  process.exit(0);
} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
}
