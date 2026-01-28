#!/usr/bin/env ts-node

/**
 * ADS-020: Multi-language Localization - Test Suite
 * Comprehensive tests for the localization service
 */

import { LocalizationService } from '../src/services/localization.js';
import {
  SUPPORTED_LANGUAGES,
  getLanguage,
  getLanguageName,
  getLanguageNativeName,
  isRTL,
} from '../src/types/localization.js';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'localizations');

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`✗ ${message}`);
    testsFailed++;
  }
}

function assertEquals(actual: any, expected: any, message: string) {
  const isEqual = JSON.stringify(actual) === JSON.stringify(expected);
  assert(isEqual, message);
  if (!isEqual) {
    console.error(`  Expected: ${JSON.stringify(expected)}`);
    console.error(`  Actual: ${JSON.stringify(actual)}`);
  }
}

function assertExists(value: any, message: string) {
  assert(value !== null && value !== undefined, message);
}

function assertNotExists(value: any, message: string) {
  assert(value === null || value === undefined, message);
}

// Cleanup function
function cleanup() {
  if (fs.existsSync(DATA_DIR)) {
    const files = fs.readdirSync(DATA_DIR);
    for (const file of files) {
      if (file.startsWith('test_')) {
        fs.unlinkSync(path.join(DATA_DIR, file));
      }
    }
  }
}

async function runTests() {
  console.log('🧪 Testing ADS-020: Multi-language Localization\n');

  // Cleanup before tests
  cleanup();

  const service = new LocalizationService();

  // Test 1: Language utilities
  console.log('\n📋 Test 1: Language Utilities');
  const english = getLanguage('en');
  assertExists(english, 'Should find English language');
  assertEquals(english?.name, 'English', 'English language name should be correct');
  assertEquals(getLanguageName('es'), 'Spanish', 'Should get Spanish language name');
  assertEquals(getLanguageNativeName('fr'), 'Français', 'Should get French native name');
  assert(isRTL('ar'), 'Arabic should be RTL');
  assert(!isRTL('en'), 'English should not be RTL');
  assert(SUPPORTED_LANGUAGES.length >= 20, 'Should have at least 20 supported languages');

  // Test 2: Create localized creative
  console.log('\n📋 Test 2: Create Localized Creative');
  const localized = await service.createLocalizedCreative(
    'test_creative_001',
    'es',
    [
      {
        fieldName: 'headline',
        originalText: 'Summer Sale',
        translatedText: 'Venta de Verano',
      },
      {
        fieldName: 'cta',
        originalText: 'Shop Now',
        translatedText: 'Comprar Ahora',
      },
    ],
    {
      translatedBy: 'Test User',
      translatedAt: new Date().toISOString(),
      method: 'manual',
      verified: false,
    }
  );

  assertExists(localized.id, 'Localized creative should have an ID');
  assertEquals(localized.baseCreativeId, 'test_creative_001', 'Should have correct base ID');
  assertEquals(localized.language, 'es', 'Should have correct language');
  assertEquals(localized.translations.length, 2, 'Should have 2 translations');
  assert(!localized.metadata.verified, 'Should not be verified initially');

  // Test 3: Get localized creative
  console.log('\n📋 Test 3: Get Localized Creative');
  const retrieved = service.getLocalizedCreative(localized.id);
  assertExists(retrieved, 'Should retrieve localized creative');
  assertEquals(retrieved?.id, localized.id, 'Retrieved ID should match');
  assertEquals(retrieved?.language, 'es', 'Retrieved language should match');

  // Test 4: Get localized creatives by base ID
  console.log('\n📋 Test 4: Get Localized Creatives by Base ID');
  const allVariants = service.getLocalizedCreatives('test_creative_001');
  assert(allVariants.length >= 1, 'Should have at least 1 variant');
  assert(
    allVariants.some(v => v.language === 'es'),
    'Should include Spanish variant'
  );

  // Test 5: Get by language
  console.log('\n📋 Test 5: Get Localized Creative by Language');
  const byLanguage = service.getLocalizedCreativeByLanguage('test_creative_001', 'es');
  assertExists(byLanguage, 'Should find creative by language');
  assertEquals(byLanguage?.language, 'es', 'Language should match');

  // Test 6: Create multiple language variants
  console.log('\n📋 Test 6: Create Multiple Language Variants');
  await service.createLocalizedCreative(
    'test_creative_001',
    'fr',
    [
      {
        fieldName: 'headline',
        originalText: 'Summer Sale',
        translatedText: 'Soldes d\'été',
      },
    ],
    {
      translatedBy: 'Test User',
      translatedAt: new Date().toISOString(),
      method: 'manual',
      verified: false,
    }
  );

  await service.createLocalizedCreative(
    'test_creative_001',
    'de',
    [
      {
        fieldName: 'headline',
        originalText: 'Summer Sale',
        translatedText: 'Sommerschlussverkauf',
      },
    ],
    {
      translatedBy: 'Test User',
      translatedAt: new Date().toISOString(),
      method: 'manual',
      verified: false,
    }
  );

  const allVariantsNow = service.getLocalizedCreatives('test_creative_001');
  assert(allVariantsNow.length >= 3, 'Should have at least 3 variants');

  // Test 7: Update localized creative
  console.log('\n📋 Test 7: Update Localized Creative');
  const updated = service.updateLocalizedCreative(localized.id, {
    translations: [
      {
        fieldName: 'headline',
        originalText: 'Summer Sale',
        translatedText: 'Gran Venta de Verano',
        notes: 'Updated translation',
      },
    ],
  });

  assertEquals(updated.translations.length, 1, 'Should have updated translations');
  assertEquals(
    updated.translations[0].translatedText,
    'Gran Venta de Verano',
    'Translation should be updated'
  );

  // Test 8: Verify translation
  console.log('\n📋 Test 8: Verify Translation');
  const verified = service.verifyTranslation(localized.id, 'Verifier User');
  assert(verified.metadata.verified, 'Should be verified');
  assertEquals(verified.metadata.verifiedBy, 'Verifier User', 'Verifier should be set');
  assertExists(verified.metadata.verifiedAt, 'Verification timestamp should be set');

  // Test 9: Translation statistics
  console.log('\n📋 Test 9: Translation Statistics');
  const stats = service.getTranslationStats('test_creative_001');
  assert(stats.total >= 3, 'Should have at least 3 total translations');
  assert(stats.verified >= 1, 'Should have at least 1 verified translation');
  assert(stats.languages.includes('es'), 'Should include Spanish in languages');
  assert(stats.languages.includes('fr'), 'Should include French in languages');
  assert(stats.languages.includes('de'), 'Should include German in languages');

  // Test 10: Export translations
  console.log('\n📋 Test 10: Export Translations');
  const exported = service.exportTranslations('test_creative_001');
  assertExists(exported.es, 'Should export Spanish translations');
  assertExists(exported.fr, 'Should export French translations');
  assertExists(exported.de, 'Should export German translations');
  assertExists(exported.es.headline, 'Spanish should have headline');

  // Test 11: Import translations
  console.log('\n📋 Test 11: Import Translations');
  const imported = await service.importTranslations(
    'test_creative_002',
    {
      ja: {
        headline: '夏のセール',
        cta: '今すぐ購入',
      },
      ko: {
        headline: '여름 세일',
        cta: '지금 쇼핑하기',
      },
    },
    {
      translatedBy: 'Import Script',
      method: 'professional',
      verified: true,
    }
  );

  assertEquals(imported.length, 2, 'Should import 2 translations');
  assert(
    imported.some(t => t.language === 'ja'),
    'Should import Japanese translation'
  );
  assert(
    imported.some(t => t.language === 'ko'),
    'Should import Korean translation'
  );
  assert(imported[0].metadata.verified, 'Imported translations should be verified');

  // Test 12: Delete localized creative
  console.log('\n📋 Test 12: Delete Localized Creative');
  const deleteSuccess = service.deleteLocalizedCreative(localized.id);
  assert(deleteSuccess, 'Should successfully delete');
  const afterDelete = service.getLocalizedCreative(localized.id);
  assertNotExists(afterDelete, 'Should not exist after deletion');

  // Test 13: Delete all localized creatives
  console.log('\n📋 Test 13: Delete All Localized Creatives');
  const deletedCount = service.deleteAllLocalizedCreatives('test_creative_001');
  assert(deletedCount >= 2, 'Should delete at least 2 creatives');
  const afterDeleteAll = service.getLocalizedCreatives('test_creative_001');
  assertEquals(afterDeleteAll.length, 0, 'Should have no creatives after delete all');

  // Test 14: RTL language support
  console.log('\n📋 Test 14: RTL Language Support');
  await service.createLocalizedCreative(
    'test_creative_003',
    'ar',
    [
      {
        fieldName: 'headline',
        originalText: 'Summer Sale',
        translatedText: 'تخفيضات الصيف',
      },
    ],
    {
      translatedBy: 'Test User',
      translatedAt: new Date().toISOString(),
      method: 'manual',
      verified: false,
    }
  );

  const arabic = service.getLocalizedCreativeByLanguage('test_creative_003', 'ar');
  assertExists(arabic, 'Should create Arabic translation');
  assert(isRTL('ar'), 'Arabic should be detected as RTL');

  // Test 15: Brand kit override
  console.log('\n📋 Test 15: Brand Kit Override');
  const withBrandKit = await service.createLocalizedCreative(
    'test_creative_004',
    'zh',
    [
      {
        fieldName: 'headline',
        originalText: 'Summer Sale',
        translatedText: '夏季特卖',
      },
    ],
    {
      translatedBy: 'Test User',
      translatedAt: new Date().toISOString(),
      method: 'manual',
      verified: false,
    }
  );

  const updatedWithBrandKit = service.updateLocalizedCreative(withBrandKit.id, {
    brandKit: {
      logo: '/assets/logo-zh.png',
      fonts: {
        heading: 'Noto Sans SC',
      },
    },
  });

  assertExists(updatedWithBrandKit.brandKit, 'Should have brand kit override');
  assertEquals(
    updatedWithBrandKit.brandKit?.logo,
    '/assets/logo-zh.png',
    'Should have correct logo path'
  );

  // Cleanup after tests
  cleanup();

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));
  console.log(`✓ Passed: ${testsPassed}`);
  console.log(`✗ Failed: ${testsFailed}`);
  console.log(`Total: ${testsPassed + testsFailed}`);
  console.log('='.repeat(50));

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
