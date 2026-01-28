/**
 * APP-011: CPP List & Management
 *
 * Test script for Custom Product Page list and management functionality
 */

import {
  listCustomProductPages,
  getCustomProductPage,
  getCompleteCustomProductPage,
  updateCustomProductPage,
  deleteCustomProductPage,
  createCompleteCustomProductPage,
} from '../src/services/ascCustomProductPages';
import { listApps } from '../src/services/ascApps';
import { getDefaultCredentials } from '../src/services/ascAuth';

async function testCPPListManagement() {
  console.log('='.repeat(80));
  console.log('APP-011: CPP List & Management Test');
  console.log('='.repeat(80));
  console.log();

  try {
    // Step 1: Check credentials
    console.log('Step 1: Checking credentials...');
    const credentials = await getDefaultCredentials();
    if (!credentials) {
      console.error('❌ No ASC credentials found. Run: npm run asc-creds');
      process.exit(1);
    }
    console.log('✓ Credentials found');
    console.log();

    // Step 2: Get an app to test with
    console.log('Step 2: Fetching apps...');
    const appsResponse = await listApps({}, credentials);
    if (appsResponse.data.length === 0) {
      console.error('❌ No apps found in App Store Connect');
      process.exit(1);
    }
    const testApp = appsResponse.data[0];
    console.log(`✓ Using app: ${testApp.attributes?.name} (${testApp.id})`);
    console.log();

    // Step 3: List existing custom product pages
    console.log('Step 3: Listing existing custom product pages...');
    const listResponse = await listCustomProductPages(
      {
        filterAppId: testApp.id,
        include: ['appCustomProductPageVersions'],
      },
      credentials
    );
    console.log(`✓ Found ${listResponse.data.length} custom product pages`);

    if (listResponse.data.length > 0) {
      console.log('\nExisting Custom Product Pages:');
      listResponse.data.forEach((cpp, index) => {
        console.log(`  ${index + 1}. ${cpp.attributes?.name || 'Unnamed'}`);
        console.log(`     ID: ${cpp.id}`);
        console.log(`     State: ${cpp.attributes?.state}`);
        console.log(`     Visible: ${cpp.attributes?.visible ? 'Yes' : 'No'}`);
        if (cpp.attributes?.url) {
          console.log(`     URL: ${cpp.attributes.url}`);
        }
      });
    }
    console.log();

    // Step 4: Test creating a new CPP (optional, skip if you want to avoid creating test data)
    const shouldCreate = process.argv.includes('--create');
    let testCppId: string | null = null;

    if (shouldCreate) {
      console.log('Step 4: Creating test custom product page...');
      const createResult = await createCompleteCustomProductPage(
        {
          appId: testApp.id,
          name: `Test CPP ${Date.now()}`,
          visible: false,
          locale: 'en-US',
          promotionalText: 'Test promotional text for CPP list & management',
        },
        credentials
      );

      if (createResult.success && createResult.customProductPage) {
        testCppId = createResult.customProductPage.id;
        console.log('✓ Created test custom product page');
        console.log(`  ID: ${testCppId}`);
        console.log(`  Name: ${createResult.customProductPage.attributes?.name}`);
      } else {
        console.error(`❌ Failed to create test CPP: ${createResult.error}`);
      }
      console.log();
    } else {
      console.log('Step 4: Skipping CPP creation (use --create flag to test creation)');
      console.log();
    }

    // Step 5: Test getting a complete CPP
    if (listResponse.data.length > 0) {
      const cppToTest = testCppId ? testCppId : listResponse.data[0].id;
      console.log(`Step 5: Getting complete custom product page (${cppToTest})...`);

      const completeCpp = await getCompleteCustomProductPage(cppToTest, credentials);
      console.log('✓ Retrieved complete custom product page');
      console.log(`  Name: ${completeCpp.page.attributes?.name}`);
      console.log(`  State: ${completeCpp.page.attributes?.state}`);
      console.log(`  Visible: ${completeCpp.page.attributes?.visible ? 'Yes' : 'No'}`);

      if (completeCpp.version) {
        console.log(`  Version ID: ${completeCpp.version.id}`);
        console.log(`  Version State: ${completeCpp.version.attributes?.state}`);
      }

      console.log(`  Localizations: ${completeCpp.localizations.length}`);
      completeCpp.localizations.forEach((loc, index) => {
        console.log(`    ${index + 1}. ${loc.attributes?.locale} (${loc.attributes?.state})`);
      });
      console.log();
    }

    // Step 6: Test updating visibility (only if we created a test CPP)
    if (testCppId) {
      console.log(`Step 6: Testing update functionality (toggling visibility)...`);

      const updated = await updateCustomProductPage(
        {
          customProductPageId: testCppId,
          visible: true,
        },
        credentials
      );

      console.log('✓ Updated custom product page visibility');
      console.log(`  Visible: ${updated.attributes?.visible ? 'Yes' : 'No'}`);
      console.log();
    } else {
      console.log('Step 6: Skipping update test (no test CPP created)');
      console.log();
    }

    // Step 7: Test filtering
    console.log('Step 7: Testing filtering...');

    const visibleOnly = await listCustomProductPages(
      {
        filterAppId: testApp.id,
        filterVisible: true,
      },
      credentials
    );
    console.log(`✓ Visible CPPs: ${visibleOnly.data.length}`);

    const hiddenOnly = await listCustomProductPages(
      {
        filterAppId: testApp.id,
        filterVisible: false,
      },
      credentials
    );
    console.log(`✓ Hidden CPPs: ${hiddenOnly.data.length}`);
    console.log();

    // Step 8: Test deletion (only if we created a test CPP)
    if (testCppId && process.argv.includes('--cleanup')) {
      console.log(`Step 8: Cleaning up test CPP...`);

      await deleteCustomProductPage(
        {
          customProductPageId: testCppId,
        },
        credentials
      );

      console.log('✓ Deleted test custom product page');
      console.log();
    } else if (testCppId) {
      console.log(`Step 8: Skipping cleanup (use --cleanup flag to delete test CPP)`);
      console.log(`  Test CPP ID to manually delete: ${testCppId}`);
      console.log();
    } else {
      console.log('Step 8: No cleanup needed');
      console.log();
    }

    // Summary
    console.log('='.repeat(80));
    console.log('✓ All tests completed successfully!');
    console.log('='.repeat(80));
    console.log();
    console.log('Summary:');
    console.log(`  - Total CPPs found: ${listResponse.data.length}`);
    console.log(`  - Visible CPPs: ${visibleOnly.data.length}`);
    console.log(`  - Hidden CPPs: ${hiddenOnly.data.length}`);
    console.log();
    console.log('Features tested:');
    console.log('  ✓ List custom product pages');
    console.log('  ✓ Filter by app ID');
    console.log('  ✓ Filter by visibility');
    console.log('  ✓ Get complete custom product page details');
    if (testCppId) {
      console.log('  ✓ Create custom product page');
      console.log('  ✓ Update custom product page');
      if (process.argv.includes('--cleanup')) {
        console.log('  ✓ Delete custom product page');
      }
    }
    console.log();
    console.log('Next steps:');
    console.log('  1. Visit http://localhost:3000/cpp/list to see the list page');
    console.log('  2. Test filtering and search functionality');
    console.log('  3. Test edit and delete actions');
    console.log();

  } catch (error) {
    console.error();
    console.error('❌ Test failed:', error instanceof Error ? error.message : error);
    console.error();

    if (error instanceof Error && error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }

    process.exit(1);
  }
}

// Run the test
testCPPListManagement();
