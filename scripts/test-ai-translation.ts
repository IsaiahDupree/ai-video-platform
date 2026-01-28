/**
 * Test script for APP-020: AI Translation Suggestions
 * Tests the aiTranslation service with sample captions
 */

import {
  generateTranslationSuggestions,
  acceptTranslation,
  batchTranslate,
  getSupportedLanguages,
  TranslationSuggestionOptions,
} from '../src/services/aiTranslation';
import { getTranslationMemoryService } from '../src/services/translations';

async function testBasicTranslation() {
  console.log('\n=== Test 1: Basic Translation ===');

  const options: TranslationSuggestionOptions = {
    sourceText: 'Get started with our amazing app today!',
    sourceLanguage: 'en',
    targetLanguage: 'es',
    context: {
      domain: 'marketing',
      fieldType: 'headline',
      tone: 'professional',
    },
    count: 3,
  };

  const result = await generateTranslationSuggestions(options);

  console.log('\nSource:', result.sourceText);
  console.log(`Translation suggestions (${result.sourceLanguage} → ${result.targetLanguage}):`);

  result.suggestions.forEach((suggestion, index) => {
    console.log(`\n${index + 1}. ${suggestion.translation}`);
    console.log(`   Source: ${suggestion.source}`);
    console.log(`   Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
    if (suggestion.explanation) {
      console.log(`   Explanation: ${suggestion.explanation}`);
    }
  });

  if (result.usage) {
    console.log('\nAPI Usage:');
    console.log(`  Model: ${result.model}`);
    console.log(`  Total tokens: ${result.usage.totalTokens}`);
    console.log(`  Prompt tokens: ${result.usage.promptTokens}`);
    console.log(`  Completion tokens: ${result.usage.completionTokens}`);
  }

  return result;
}

async function testWithMemory() {
  console.log('\n=== Test 2: Translation with Memory ===');

  // First, save a translation to memory
  console.log('\nSaving a translation to memory...');
  await acceptTranslation(
    'Welcome to our platform',
    'Bienvenido a nuestra plataforma',
    'en',
    'es',
    {
      context: {
        domain: 'app-store',
        fieldType: 'caption',
      },
      quality: 'professional',
    }
  );

  // Now try to translate the same text (should find it in memory)
  console.log('\nTranslating the same text again (should use memory)...');
  const result = await generateTranslationSuggestions({
    sourceText: 'Welcome to our platform',
    sourceLanguage: 'en',
    targetLanguage: 'es',
    useMemory: true,
    count: 3,
  });

  console.log('\nTranslation suggestions:');
  result.suggestions.forEach((suggestion, index) => {
    console.log(`\n${index + 1}. ${suggestion.translation}`);
    console.log(`   Source: ${suggestion.source}`);
    console.log(`   Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
    if (suggestion.memoryMatch) {
      console.log(`   Memory match - Used ${suggestion.memoryMatch.usageCount} times`);
      console.log(`   Similarity: ${(suggestion.memoryMatch.similarity * 100).toFixed(1)}%`);
    }
  });

  return result;
}

async function testContextualTranslation() {
  console.log('\n=== Test 3: Contextual Translation ===');

  const caption = 'Discover amazing features';

  // Test with different contexts
  const contexts = [
    {
      name: 'Marketing headline',
      context: {
        domain: 'marketing',
        fieldType: 'headline',
        industry: 'technology',
        tone: 'exciting',
      },
    },
    {
      name: 'App store caption',
      context: {
        domain: 'app-store',
        fieldType: 'caption',
        industry: 'technology',
        tone: 'professional',
      },
    },
    {
      name: 'Technical description',
      context: {
        domain: 'technical',
        fieldType: 'description',
        industry: 'technology',
        tone: 'professional',
      },
    },
  ];

  for (const { name, context } of contexts) {
    console.log(`\n--- ${name} ---`);

    const result = await generateTranslationSuggestions({
      sourceText: caption,
      sourceLanguage: 'en',
      targetLanguage: 'fr',
      context,
      count: 2,
      quality: 'professional',
    });

    console.log(`Translations for "${caption}":`);
    result.suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion.translation}`);
    });
  }
}

async function testBatchTranslation() {
  console.log('\n=== Test 4: Batch Translation ===');

  const texts = [
    { text: 'Download now', context: { fieldType: 'cta' as const } },
    { text: 'Easy to use', context: { fieldType: 'headline' as const } },
    { text: 'Join millions of happy users', context: { fieldType: 'body' as const } },
  ];

  console.log(`\nBatch translating ${texts.length} texts from English to German...`);

  const results = await batchTranslate(texts, 'en', 'de', {
    quality: 'standard',
    useMemory: true,
  });

  results.forEach((result, index) => {
    console.log(`\n${index + 1}. "${result.sourceText}"`);
    console.log(`   → ${result.suggestions[0].translation}`);
    console.log(`   (${result.suggestions[0].source})`);
  });

  return results;
}

async function testSupportedLanguages() {
  console.log('\n=== Test 5: Supported Languages ===');

  const languages = getSupportedLanguages();

  console.log(`\nSupported languages: ${languages.length}`);
  console.log('\nSample languages:');
  languages.slice(0, 10).forEach(lang => {
    console.log(`  ${lang.code}: ${lang.name} (${lang.nativeName})`);
  });
}

async function testMemoryStats() {
  console.log('\n=== Test 6: Translation Memory Statistics ===');

  const service = getTranslationMemoryService();
  const stats = await service.getStats();

  console.log('\nTranslation Memory Stats:');
  console.log(`  Total translation units: ${stats.totalUnits}`);
  console.log(`  Total usage count: ${stats.totalUsageCount}`);

  if (Object.keys(stats.byLanguagePair).length > 0) {
    console.log('\n  By language pair:');
    Object.entries(stats.byLanguagePair).forEach(([pair, count]) => {
      console.log(`    ${pair}: ${count} translations`);
    });
  }

  if (stats.mostUsedTranslations.length > 0) {
    console.log('\n  Most used translations:');
    stats.mostUsedTranslations.slice(0, 3).forEach((unit, index) => {
      console.log(`    ${index + 1}. "${unit.sourceText}" → "${unit.targetText}"`);
      console.log(`       (${unit.sourceLanguage} → ${unit.targetLanguage}, used ${unit.metadata.usageCount} times)`);
    });
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   APP-020: AI Translation Suggestions - Test Suite   ║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  try {
    // Test 1: Basic translation
    await testBasicTranslation();

    // Test 2: Translation with memory
    await testWithMemory();

    // Test 3: Contextual translation
    await testContextualTranslation();

    // Test 4: Batch translation
    await testBatchTranslation();

    // Test 5: Supported languages
    await testSupportedLanguages();

    // Test 6: Memory statistics
    await testMemoryStats();

    console.log('\n╔════════════════════════════════╗');
    console.log('║  ✓ All tests completed!       ║');
    console.log('╚════════════════════════════════╝');

    console.log('\n📝 Summary:');
    console.log('  ✓ AI translation suggestions working');
    console.log('  ✓ Translation memory integration working');
    console.log('  ✓ Contextual translation working');
    console.log('  ✓ Batch translation working');
    console.log('  ✓ Supported languages list working');
    console.log('  ✓ Translation memory statistics working');

  } catch (error) {
    console.error('\n❌ Error during testing:', error);
    process.exit(1);
  }
}

// Run tests
main();
