#!/usr/bin/env npx tsx

/**
 * META-007: Custom Audiences Test Script
 * Tests custom audience creation, syncing, and management
 */

import {
  createCustomAudience,
  getCustomAudience,
  listCustomAudiences,
  updateCustomAudience,
  deleteCustomAudience,
  getAudienceMembers,
  syncAudienceMembers,
  getAudienceMetrics,
  getSyncLogs,
  createAudienceSyncLog,
} from '@/services/customAudience';
import { CustomAudience } from '@/types/customAudience';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';

let testsRun = 0;
let testsPassed = 0;

async function test(name: string, fn: () => Promise<void>) {
  testsRun++;
  try {
    await fn();
    console.log(`${GREEN}✅ ${name}${RESET}`);
    testsPassed++;
  } catch (error) {
    console.log(`${RED}❌ ${name}${RESET}`);
    console.error(
      `   ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function runTests() {
  console.log(`${BLUE}🧪 Testing Custom Audiences (META-007)${RESET}\n`);

  let testAudience: CustomAudience;

  // Test 1: Create custom audience
  await test('Create custom audience', async () => {
    testAudience = await createCustomAudience({
      name: `Test Audience ${Date.now()}`,
      description: 'Test custom audience',
      audience_type: 'custom_list',
      auto_sync: true,
      sync_interval_hours: 24,
    });

    if (!testAudience.id || !testAudience.name) {
      throw new Error('Audience was not created properly');
    }
  });

  // Test 2: Get custom audience
  await test('Fetch custom audience by ID', async () => {
    if (!testAudience.id) throw new Error('No test audience ID');
    const audience = await getCustomAudience(testAudience.id);
    if (!audience) throw new Error('Audience not found');
    if (audience.id !== testAudience.id) throw new Error('Audience ID mismatch');
  });

  // Test 3: List custom audiences
  await test('List all custom audiences', async () => {
    const audiences = await listCustomAudiences();
    if (!Array.isArray(audiences)) throw new Error('Not an array');
  });

  // Test 4: Update custom audience
  await test('Update custom audience', async () => {
    if (!testAudience.id) throw new Error('No test audience ID');
    const updated = await updateCustomAudience(testAudience.id, {
      description: 'Updated description',
      sync_interval_hours: 12,
    });

    if (updated.description !== 'Updated description') {
      throw new Error('Description not updated');
    }
    if (updated.sync_interval_hours !== 12) {
      throw new Error('Sync interval not updated');
    }
  });

  // Test 5: Create sync log
  await test('Create audience sync log', async () => {
    if (!testAudience.id) throw new Error('No test audience ID');
    const syncLog = await createAudienceSyncLog({
      audience_id: testAudience.id,
      sync_type: 'full',
      status: 'completed',
      synced_count: 100,
      failed_count: 0,
    });

    if (!syncLog.id) throw new Error('Sync log not created');
  });

  // Test 6: Get sync logs
  await test('Fetch sync logs for audience', async () => {
    if (!testAudience.id) throw new Error('No test audience ID');
    const logs = await getSyncLogs(testAudience.id);
    if (!Array.isArray(logs)) throw new Error('Not an array');
  });

  // Test 7: Get audience members
  await test('Fetch audience members', async () => {
    if (!testAudience.id) throw new Error('No test audience ID');
    const members = await getAudienceMembers(testAudience.id);
    if (!Array.isArray(members)) throw new Error('Not an array');
  });

  // Test 8: Get audience metrics
  await test('Fetch audience metrics', async () => {
    if (!testAudience.id) throw new Error('No test audience ID');
    const metrics = await getAudienceMetrics(testAudience.id);
    if (typeof metrics.total_members !== 'number') {
      throw new Error('Metrics not properly formatted');
    }
  });

  // Test 9: Create lookalike audience
  await test('Create lookalike custom audience', async () => {
    const lookalike = await createCustomAudience({
      name: `Lookalike Audience ${Date.now()}`,
      description: 'Lookalike audience for expansion',
      audience_type: 'lookalike',
      lookalike_country: 'US',
      lookalike_percentage: 5,
    });

    if (!lookalike.id) throw new Error('Lookalike audience not created');
    if (lookalike.audience_type !== 'lookalike') throw new Error('Wrong audience type');

    // Clean up
    await deleteCustomAudience(lookalike.id);
  });

  // Test 10: Delete custom audience
  await test('Delete custom audience', async () => {
    if (!testAudience.id) throw new Error('No test audience ID');
    await deleteCustomAudience(testAudience.id);

    // Verify deletion
    const deleted = await getCustomAudience(testAudience.id);
    if (deleted !== null) throw new Error('Audience still exists after deletion');
  });

  // Summary
  console.log(`\n${BLUE}=========================================${RESET}`);
  console.log(`Test Summary:`);
  console.log(`${GREEN}✅ Passed: ${testsPassed}${RESET}`);
  console.log(`${RED}❌ Failed: ${testsRun - testsPassed}${RESET}`);
  console.log(`📊 Total: ${testsRun}`);
  console.log(`${BLUE}=========================================${RESET}\n`);

  if (testsPassed === testsRun) {
    console.log(`${GREEN}🎉 All tests passed!${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`${RED}⚠️  Some tests failed${RESET}\n`);
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error(`${RED}Test suite error:${RESET}`, error);
  process.exit(1);
});
