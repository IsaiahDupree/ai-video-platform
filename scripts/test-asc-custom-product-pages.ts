/**
 * Test script for APP-010: Custom Product Page Creator
 *
 * Tests all custom product page operations
 */

import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { getDefaultCredentials } from '../src/services/ascAuth';
import { listApps } from '../src/services/ascApps';
import {
  createCustomProductPage,
  getCustomProductPage,
  listCustomProductPages,
  updateCustomProductPage,
  deleteCustomProductPage,
  createCustomProductPageVersion,
  getCustomProductPageVersion,
  listCustomProductPageVersions,
  updateCustomProductPageVersion,
  deleteCustomProductPageVersion,
  createCustomProductPageLocalization,
  getCustomProductPageLocalization,
  listCustomProductPageLocalizations,
  updateCustomProductPageLocalization,
  deleteCustomProductPageLocalization,
  createCompleteCustomProductPage,
  getCompleteCustomProductPage,
  addLocalizationToCustomProductPage,
  listCustomProductPagesForApp,
} from '../src/services/ascCustomProductPages';

const rl = readline.createInterface({ input, output });

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

function logTest(name: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST: ${name}`);
  console.log('='.repeat(80));
}

function logSuccess(message: string) {
  console.log(`✅ ${message}`);
}

function logError(message: string, error?: any) {
  console.log(`❌ ${message}`);
  if (error) {
    console.error(error);
  }
}

function logInfo(message: string) {
  console.log(`ℹ️  ${message}`);
}

async function runTest(name: string, fn: () => Promise<void>): Promise<void> {
  logTest(name);
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    results.push({ name, passed: true, duration });
    logSuccess(`Test passed (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - start;
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: errorMessage, duration });
    logError(`Test failed (${duration}ms)`, error);
  }
}

/**
 * Main test suite
 */
async function main() {
  console.log('\n🧪 APP-010 CUSTOM PRODUCT PAGE CREATOR - TEST SUITE\n');
  console.log('This test suite will test all custom product page operations.\n');

  let credentials;
  let testAppId: string | null = null;
  let testCustomProductPageId: string | null = null;
  let testVersionId: string | null = null;
  let testLocalizationId: string | null = null;

  // =============================================================================
  // SETUP
  // =============================================================================

  await runTest('Load ASC Credentials', async () => {
    credentials = await getDefaultCredentials();
    logInfo(`Loaded credentials for issuer: ${credentials.issuerId}`);
  });

  await runTest('Fetch Test App', async () => {
    const appsResponse = await listApps({ limit: 5 }, credentials);

    if (!appsResponse.data || appsResponse.data.length === 0) {
      throw new Error('No apps found in App Store Connect');
    }

    logInfo(`Found ${appsResponse.data.length} apps`);
    console.log('\nAvailable apps:');
    appsResponse.data.forEach((app, index) => {
      console.log(`  ${index + 1}. ${app.attributes?.name} (${app.id})`);
    });

    const answer = await rl.question('\nSelect app number to test with (or press Enter for first): ');
    const selectedIndex = answer.trim() ? parseInt(answer) - 1 : 0;

    if (selectedIndex < 0 || selectedIndex >= appsResponse.data.length) {
      throw new Error('Invalid app selection');
    }

    testAppId = appsResponse.data[selectedIndex].id;
    logInfo(`Using app: ${appsResponse.data[selectedIndex].attributes?.name} (${testAppId})`);
  });

  // =============================================================================
  // CUSTOM PRODUCT PAGE TESTS
  // =============================================================================

  await runTest('Create Custom Product Page', async () => {
    if (!testAppId) throw new Error('No test app ID');

    const page = await createCustomProductPage(
      {
        appId: testAppId,
        name: `Test CPP ${Date.now()}`,
        visible: true,
      },
      credentials
    );

    if (!page || !page.id) {
      throw new Error('Failed to create custom product page');
    }

    testCustomProductPageId = page.id;

    logInfo(`Created custom product page: ${page.id}`);
    logInfo(`  Name: ${page.attributes?.name}`);
    logInfo(`  Visible: ${page.attributes?.visible}`);
    logInfo(`  State: ${page.attributes?.state}`);
  });

  await runTest('Get Custom Product Page', async () => {
    if (!testCustomProductPageId) throw new Error('No test custom product page ID');

    const page = await getCustomProductPage(testCustomProductPageId, credentials);

    if (!page || page.id !== testCustomProductPageId) {
      throw new Error('Failed to fetch custom product page');
    }

    logInfo(`Fetched custom product page: ${page.id}`);
    logInfo(`  Name: ${page.attributes?.name}`);
    logInfo(`  URL: ${page.attributes?.url}`);
  });

  await runTest('List Custom Product Pages', async () => {
    if (!testAppId) throw new Error('No test app ID');

    const response = await listCustomProductPages(
      {
        filterAppId: testAppId,
        include: ['appCustomProductPageVersions'],
        limit: 10,
      },
      credentials
    );

    if (!response.data) {
      throw new Error('Failed to list custom product pages');
    }

    logInfo(`Found ${response.data.length} custom product pages`);
    response.data.forEach((page) => {
      logInfo(`  - ${page.attributes?.name} (${page.id})`);
    });
  });

  await runTest('Update Custom Product Page', async () => {
    if (!testCustomProductPageId) throw new Error('No test custom product page ID');

    const updatedName = `Updated Test CPP ${Date.now()}`;
    const page = await updateCustomProductPage(
      {
        customProductPageId: testCustomProductPageId,
        name: updatedName,
        visible: false,
      },
      credentials
    );

    if (!page || page.attributes?.name !== updatedName) {
      throw new Error('Failed to update custom product page');
    }

    logInfo(`Updated custom product page: ${page.id}`);
    logInfo(`  New name: ${page.attributes?.name}`);
    logInfo(`  Visible: ${page.attributes?.visible}`);
  });

  // =============================================================================
  // CUSTOM PRODUCT PAGE VERSION TESTS
  // =============================================================================

  await runTest('Create Custom Product Page Version', async () => {
    if (!testCustomProductPageId) throw new Error('No test custom product page ID');

    const version = await createCustomProductPageVersion(
      {
        customProductPageId: testCustomProductPageId,
      },
      credentials
    );

    if (!version || !version.id) {
      throw new Error('Failed to create version');
    }

    testVersionId = version.id;

    logInfo(`Created version: ${version.id}`);
    logInfo(`  State: ${version.attributes?.state}`);
  });

  await runTest('Get Custom Product Page Version', async () => {
    if (!testVersionId) throw new Error('No test version ID');

    const version = await getCustomProductPageVersion(testVersionId, credentials);

    if (!version || version.id !== testVersionId) {
      throw new Error('Failed to fetch version');
    }

    logInfo(`Fetched version: ${version.id}`);
    logInfo(`  State: ${version.attributes?.state}`);
    logInfo(`  Deep link: ${version.attributes?.deepLink || 'Not available yet'}`);
  });

  await runTest('List Custom Product Page Versions', async () => {
    if (!testCustomProductPageId) throw new Error('No test custom product page ID');

    const response = await listCustomProductPageVersions(
      {
        filterCustomProductPageId: testCustomProductPageId,
        include: ['appCustomProductPage', 'appCustomProductPageLocalizations'],
        limit: 10,
      },
      credentials
    );

    if (!response.data) {
      throw new Error('Failed to list versions');
    }

    logInfo(`Found ${response.data.length} versions`);
    response.data.forEach((version) => {
      logInfo(`  - Version ${version.id} (${version.attributes?.state})`);
    });
  });

  // =============================================================================
  // CUSTOM PRODUCT PAGE LOCALIZATION TESTS
  // =============================================================================

  await runTest('Create Custom Product Page Localization', async () => {
    if (!testVersionId) throw new Error('No test version ID');

    const localization = await createCustomProductPageLocalization(
      {
        customProductPageVersionId: testVersionId,
        locale: 'en-US',
        promotionalText: 'This is a test promotional text for our custom product page.',
      },
      credentials
    );

    if (!localization || !localization.id) {
      throw new Error('Failed to create localization');
    }

    testLocalizationId = localization.id;

    logInfo(`Created localization: ${localization.id}`);
    logInfo(`  Locale: ${localization.attributes?.locale}`);
    logInfo(`  Promotional text: ${localization.attributes?.promotionalText}`);
    logInfo(`  State: ${localization.attributes?.state}`);
  });

  await runTest('Get Custom Product Page Localization', async () => {
    if (!testLocalizationId) throw new Error('No test localization ID');

    const localization = await getCustomProductPageLocalization(testLocalizationId, credentials);

    if (!localization || localization.id !== testLocalizationId) {
      throw new Error('Failed to fetch localization');
    }

    logInfo(`Fetched localization: ${localization.id}`);
    logInfo(`  Locale: ${localization.attributes?.locale}`);
    logInfo(`  Promotional text: ${localization.attributes?.promotionalText}`);
  });

  await runTest('List Custom Product Page Localizations', async () => {
    if (!testVersionId) throw new Error('No test version ID');

    const response = await listCustomProductPageLocalizations(
      {
        filterCustomProductPageVersionId: testVersionId,
        include: ['appScreenshotSets', 'appPreviewSets'],
        limit: 10,
      },
      credentials
    );

    if (!response.data) {
      throw new Error('Failed to list localizations');
    }

    logInfo(`Found ${response.data.length} localizations`);
    response.data.forEach((localization) => {
      logInfo(`  - ${localization.attributes?.locale} (${localization.id})`);
    });
  });

  await runTest('Update Custom Product Page Localization', async () => {
    if (!testLocalizationId) throw new Error('No test localization ID');

    const updatedText = 'Updated promotional text for testing purposes.';
    const localization = await updateCustomProductPageLocalization(
      {
        localizationId: testLocalizationId,
        promotionalText: updatedText,
      },
      credentials
    );

    if (!localization || localization.attributes?.promotionalText !== updatedText) {
      throw new Error('Failed to update localization');
    }

    logInfo(`Updated localization: ${localization.id}`);
    logInfo(`  New promotional text: ${localization.attributes?.promotionalText}`);
  });

  // =============================================================================
  // HIGH-LEVEL OPERATIONS
  // =============================================================================

  await runTest('Create Complete Custom Product Page', async () => {
    if (!testAppId) throw new Error('No test app ID');

    const result = await createCompleteCustomProductPage(
      {
        appId: testAppId,
        name: `Complete CPP ${Date.now()}`,
        visible: true,
        locale: 'en-US',
        promotionalText: 'Promotional text for complete CPP creation.',
      },
      credentials
    );

    if (!result.success || !result.customProductPage || !result.version) {
      throw new Error(result.error || 'Failed to create complete custom product page');
    }

    logInfo(`Created complete custom product page: ${result.customProductPage.id}`);
    logInfo(`  Version: ${result.version.id}`);
    logInfo(`  Name: ${result.customProductPage.attributes?.name}`);

    // Clean up the complete CPP
    await deleteCustomProductPage({ customProductPageId: result.customProductPage.id }, credentials);
    logInfo(`Cleaned up complete CPP: ${result.customProductPage.id}`);
  });

  await runTest('Get Complete Custom Product Page', async () => {
    if (!testCustomProductPageId) throw new Error('No test custom product page ID');

    const complete = await getCompleteCustomProductPage(testCustomProductPageId, credentials);

    if (!complete.page || complete.page.id !== testCustomProductPageId) {
      throw new Error('Failed to fetch complete custom product page');
    }

    logInfo(`Fetched complete custom product page: ${complete.page.id}`);
    logInfo(`  Name: ${complete.page.attributes?.name}`);
    if (complete.version) {
      logInfo(`  Version: ${complete.version.id} (${complete.version.attributes?.state})`);
    }
    logInfo(`  Localizations: ${complete.localizations.length}`);
    complete.localizations.forEach((loc) => {
      logInfo(`    - ${loc.attributes?.locale}`);
    });
  });

  await runTest('Add Localization to Custom Product Page', async () => {
    if (!testCustomProductPageId) throw new Error('No test custom product page ID');

    const result = await addLocalizationToCustomProductPage(
      {
        customProductPageId: testCustomProductPageId,
        locale: 'es-ES',
        promotionalText: 'Texto promocional en español para pruebas.',
      },
      credentials
    );

    if (!result.success || !result.localization) {
      throw new Error(result.error || 'Failed to add localization');
    }

    logInfo(`Added localization: ${result.localization.id}`);
    logInfo(`  Locale: ${result.localization.attributes?.locale}`);
    logInfo(`  Promotional text: ${result.localization.attributes?.promotionalText}`);

    // Clean up the Spanish localization
    await deleteCustomProductPageLocalization(
      { localizationId: result.localization.id },
      credentials
    );
    logInfo(`Cleaned up Spanish localization: ${result.localization.id}`);
  });

  await runTest('List Custom Product Pages for App', async () => {
    if (!testAppId) throw new Error('No test app ID');

    const pages = await listCustomProductPagesForApp(testAppId, credentials);

    logInfo(`Found ${pages.length} custom product pages for app`);
    pages.forEach((page) => {
      logInfo(`  - ${page.attributes?.name} (${page.id})`);
    });
  });

  // =============================================================================
  // CLEANUP
  // =============================================================================

  console.log('\n' + '='.repeat(80));
  console.log('CLEANUP');
  console.log('='.repeat(80));

  const cleanup = await rl.question('\nDelete test custom product page? (y/n): ');
  if (cleanup.toLowerCase() === 'y') {
    try {
      if (testCustomProductPageId) {
        await deleteCustomProductPage({ customProductPageId: testCustomProductPageId }, credentials);
        logSuccess(`Deleted test custom product page: ${testCustomProductPageId}`);
      }
    } catch (error) {
      logError('Failed to delete test custom product page', error);
    }
  } else {
    logInfo('Skipping cleanup. Remember to delete test custom product page manually!');
    if (testCustomProductPageId) {
      logInfo(`  Custom Product Page ID: ${testCustomProductPageId}`);
    }
  }

  // =============================================================================
  // SUMMARY
  // =============================================================================

  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`\nTotal: ${total} tests`);
  console.log(`Passed: ${passed} tests ✅`);
  console.log(`Failed: ${failed} tests ❌`);
  console.log(`Success rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('Failed tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  ❌ ${r.name}`);
        if (r.error) {
          console.log(`     Error: ${r.error}`);
        }
      });
  }

  console.log('\n✨ Test suite complete!\n');

  rl.close();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  rl.close();
  process.exit(1);
});
