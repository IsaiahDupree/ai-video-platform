#!/usr/bin/env node
/**
 * APP-019: Translation Memory - Test Script
 * Tests the translation memory service
 */

import { getTranslationMemoryService } from '../src/services/translations';

async function main() {
  console.log('🧪 Testing Translation Memory Service\n');

  const tm = getTranslationMemoryService();

  try {
    // Test 1: Add translations
    console.log('Test 1: Adding translations...');
    const unit1 = await tm.addTranslation(
      'Get started today',
      'Empieza hoy',
      'en',
      'es',
      {
        context: {
          domain: 'marketing',
          fieldType: 'cta',
          tone: 'friendly',
        },
        metadata: {
          createdBy: 'test-user',
          quality: 'verified',
          source: 'professional',
        },
      }
    );
    console.log(`✓ Added translation: "${unit1.sourceText}" → "${unit1.targetText}"`);

    const unit2 = await tm.addTranslation(
      'Download now',
      'Descargar ahora',
      'en',
      'es',
      {
        context: {
          domain: 'marketing',
          fieldType: 'cta',
          tone: 'urgent',
        },
        metadata: {
          createdBy: 'test-user',
          quality: 'verified',
          source: 'professional',
        },
      }
    );
    console.log(`✓ Added translation: "${unit2.sourceText}" → "${unit2.targetText}"`);

    const unit3 = await tm.addTranslation(
      'Limited time offer',
      'Oferta por tiempo limitado',
      'en',
      'es',
      {
        context: {
          domain: 'marketing',
          fieldType: 'headline',
          tone: 'urgent',
        },
        metadata: {
          createdBy: 'test-user',
          quality: 'verified',
          source: 'ai',
        },
      }
    );
    console.log(`✓ Added translation: "${unit3.sourceText}" → "${unit3.targetText}"`);

    // Test 2: Find exact match
    console.log('\nTest 2: Finding exact matches...');
    const exactMatch = await tm.findExactMatch('Get started today', 'en', 'es');
    if (exactMatch) {
      console.log(`✓ Found exact match: "${exactMatch.targetText}"`);
      console.log(`  Usage count: ${exactMatch.metadata.usageCount}`);
    } else {
      console.log('✗ Exact match not found');
    }

    // Test 3: Search for similar translations
    console.log('\nTest 3: Searching for similar translations...');
    const searchResults = await tm.search({
      sourceText: 'Get started now',
      sourceLanguage: 'en',
      targetLanguage: 'es',
      minSimilarity: 0.6,
      maxResults: 3,
    });

    console.log(`Found ${searchResults.length} matches:`);
    for (const match of searchResults) {
      console.log(`  - "${match.unit.sourceText}" → "${match.suggestion}"`);
      console.log(`    Match type: ${match.matchType}, Similarity: ${(match.similarity * 100).toFixed(1)}%`);
    }

    // Test 4: Search with context
    console.log('\nTest 4: Searching with context...');
    const contextResults = await tm.search({
      sourceText: 'Download',
      sourceLanguage: 'en',
      targetLanguage: 'es',
      context: {
        domain: 'marketing',
        fieldType: 'cta',
      },
      minSimilarity: 0.5,
      maxResults: 5,
    });

    console.log(`Found ${contextResults.length} matches with context:`);
    for (const match of contextResults) {
      console.log(`  - "${match.unit.sourceText}" → "${match.suggestion}"`);
      console.log(`    Similarity: ${(match.similarity * 100).toFixed(1)}%`);
    }

    // Test 5: Update translation unit
    console.log('\nTest 5: Updating translation unit...');
    const updated = await tm.updateTranslationUnit(unit1.id, {
      metadata: {
        ...unit1.metadata,
        quality: 'professional',
        usageCount: unit1.metadata.usageCount + 5,
      },
    });
    console.log(`✓ Updated translation unit ${updated.id}`);
    console.log(`  New usage count: ${updated.metadata.usageCount}`);
    console.log(`  New quality: ${updated.metadata.quality}`);

    // Test 6: Bulk import
    console.log('\nTest 6: Bulk importing translations...');
    const bulkUnits = [
      {
        sourceText: 'Sign up free',
        targetText: 'Regístrate gratis',
        sourceLanguage: 'en',
        targetLanguage: 'es',
        context: { domain: 'marketing', fieldType: 'cta' },
        metadata: { createdBy: 'import', quality: 'verified' as const, source: 'professional' as const },
      },
      {
        sourceText: 'Learn more',
        targetText: 'Aprende más',
        sourceLanguage: 'en',
        targetLanguage: 'es',
        context: { domain: 'marketing', fieldType: 'cta' },
        metadata: { createdBy: 'import', quality: 'verified' as const, source: 'professional' as const },
      },
      {
        sourceText: 'Try it now',
        targetText: 'Pruébalo ahora',
        sourceLanguage: 'en',
        targetLanguage: 'es',
        context: { domain: 'marketing', fieldType: 'cta' },
        metadata: { createdBy: 'import', quality: 'verified' as const, source: 'ai' as const },
      },
    ];

    const importResult = await tm.importTranslations(bulkUnits);
    console.log(`✓ Imported ${importResult.imported} translations`);
    console.log(`  Skipped ${importResult.skipped} duplicates`);
    if (importResult.errors.length > 0) {
      console.log(`  Errors: ${importResult.errors.length}`);
    }

    // Test 7: Export translations
    console.log('\nTest 7: Exporting translations...');
    const exported = await tm.exportTranslations('en', 'es');
    console.log(`✓ Exported ${exported.length} translations for en-es language pair`);
    console.log('  Sample translations:');
    for (const unit of exported.slice(0, 3)) {
      console.log(`    - "${unit.sourceText}" → "${unit.targetText}"`);
    }

    // Test 8: Get statistics
    console.log('\nTest 8: Getting statistics...');
    const stats = await tm.getStats();
    console.log('✓ Translation Memory Statistics:');
    console.log(`  Total units: ${stats.totalUnits}`);
    console.log(`  Total usage count: ${stats.totalUsageCount}`);
    console.log('  By language pair:');
    for (const [pair, count] of Object.entries(stats.byLanguagePair)) {
      console.log(`    - ${pair}: ${count} units`);
    }
    console.log('  By domain:');
    for (const [domain, count] of Object.entries(stats.byDomain)) {
      console.log(`    - ${domain}: ${count} units`);
    }
    console.log('  By quality:');
    for (const [quality, count] of Object.entries(stats.byQuality)) {
      console.log(`    - ${quality}: ${count} units`);
    }
    console.log('  Most used translations:');
    for (const unit of stats.mostUsedTranslations.slice(0, 3)) {
      console.log(`    - "${unit.sourceText}" (used ${unit.metadata.usageCount} times)`);
    }

    // Test 9: Reuse existing translation (should increment usage count)
    console.log('\nTest 9: Reusing existing translation...');
    const reused = await tm.addTranslation(
      'Get started today',
      'Empieza hoy',
      'en',
      'es'
    );
    console.log(`✓ Reused translation: "${reused.sourceText}"`);
    console.log(`  Usage count increased to: ${reused.metadata.usageCount}`);

    // Test 10: Fuzzy matching
    console.log('\nTest 10: Testing fuzzy matching...');
    const fuzzyResults = await tm.search({
      sourceText: 'Start today',
      sourceLanguage: 'en',
      targetLanguage: 'es',
      minSimilarity: 0.5,
      maxResults: 3,
    });

    console.log(`Found ${fuzzyResults.length} fuzzy matches:`);
    for (const match of fuzzyResults) {
      console.log(`  - "${match.unit.sourceText}" → "${match.suggestion}"`);
      console.log(`    Match type: ${match.matchType}, Similarity: ${(match.similarity * 100).toFixed(1)}%`);
    }

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

main();
