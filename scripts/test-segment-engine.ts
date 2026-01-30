#!/usr/bin/env npx tsx

/**
 * GDP-012: Segment Engine Test Script
 * Tests segment creation, evaluation, and automation
 */

import {
  createSegment,
  getSegment,
  listSegments,
  updateSegment,
  deleteSegment,
  getSegmentMembers,
  getPersonSegments,
  evaluatePersonSegments,
  createAutomation,
  listAutomations,
  createAutomationExecution,
  getAutomationExecutions,
  clearSegmentCache,
} from '@/services/segmentEngine';
import {
  Segment,
  SegmentAutomation,
  ConditionRule,
  AndRule,
} from '@/types/segmentEngine';

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
    console.error(`   ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function runTests() {
  console.log(`${BLUE}🧪 Testing Segment Engine (GDP-012)${RESET}\n`);

  let testSegment: Segment;
  let testSegment2: Segment;
  let testAutomation: SegmentAutomation;

  // Test 1: Create segment (high engagers)
  await test('Create high engagers segment', async () => {
    const rule: ConditionRule = {
      type: 'condition',
      attribute: 'total_renders',
      operator: '>=',
      value: 5,
    };

    testSegment = await createSegment({
      name: `High Engagers Test ${Date.now()}`,
      description: 'Users who have rendered 5+ videos',
      rule,
      created_by: 'test',
    });

    if (!testSegment.id || !testSegment.name) {
      throw new Error('Segment was not created properly');
    }
  });

  // Test 2: Get segment
  await test('Fetch segment by ID', async () => {
    if (!testSegment.id) throw new Error('No test segment ID');
    const segment = await getSegment(testSegment.id);
    if (!segment) throw new Error('Segment not found');
    if (segment.id !== testSegment.id) throw new Error('Segment ID mismatch');
  });

  // Test 3: Create another segment (active users)
  await test('Create active users segment', async () => {
    const rule: AndRule = {
      type: 'and',
      conditions: [
        {
          type: 'condition',
          attribute: 'total_events',
          operator: '>=',
          value: 10,
        },
      ],
    };

    testSegment2 = await createSegment({
      name: `Active Users Test ${Date.now()}`,
      description: 'Users with 10+ events',
      rule,
      created_by: 'test',
    });

    if (!testSegment2.id) throw new Error('Segment was not created properly');
  });

  // Test 4: List segments
  await test('List all segments', async () => {
    const segments = await listSegments();
    if (!Array.isArray(segments)) throw new Error('Segments is not an array');
    if (segments.length === 0) throw new Error('No segments returned');
  });

  // Test 5: Update segment
  await test('Update segment', async () => {
    if (!testSegment.id) throw new Error('No test segment ID');
    const updated = await updateSegment(testSegment.id, {
      description: 'Updated description',
      is_active: false,
    });

    if (updated.description !== 'Updated description') {
      throw new Error('Description not updated');
    }
    if (updated.is_active !== false) {
      throw new Error('is_active not updated');
    }
  });

  // Test 6: Create automation
  await test('Create segment automation', async () => {
    if (!testSegment.id) throw new Error('No test segment ID');

    testAutomation = await createAutomation({
      segment_id: testSegment.id,
      name: `Test Automation ${Date.now()}`,
      description: 'Test email automation',
      trigger_type: 'enter',
      action: {
        type: 'email',
        template_id: 'welcome-email',
        subject: 'Welcome!',
      },
    });

    if (!testAutomation.id) throw new Error('Automation not created');
  });

  // Test 7: List automations
  await test('List automations for segment', async () => {
    if (!testSegment.id) throw new Error('No test segment ID');
    const automations = await listAutomations(testSegment.id);
    if (!Array.isArray(automations)) throw new Error('Not an array');
  });

  // Test 8: Create automation execution
  await test('Create automation execution', async () => {
    if (!testAutomation.id) throw new Error('No test automation ID');

    // Using a test person ID (would need to create in real scenario)
    const testPersonId = '00000000-0000-0000-0000-000000000000';

    const execution = await createAutomationExecution({
      automation_id: testAutomation.id,
      person_id: testPersonId,
      status: 'pending',
    });

    if (!execution.id) throw new Error('Execution not created');
  });

  // Test 9: Get automation executions
  await test('Fetch automation executions', async () => {
    if (!testAutomation.id) throw new Error('No test automation ID');
    const executions = await getAutomationExecutions(testAutomation.id);
    if (!Array.isArray(executions)) throw new Error('Not an array');
  });

  // Test 10: Clear cache
  await test('Clear segment evaluation cache', async () => {
    if (!testSegment.id) throw new Error('No test segment ID');
    await clearSegmentCache(undefined, testSegment.id);
    // No error = success
  });

  // Test 11: Delete segment
  await test('Delete segment', async () => {
    if (!testSegment.id) throw new Error('No test segment ID');
    await deleteSegment(testSegment.id);

    // Verify deletion
    const deleted = await getSegment(testSegment.id);
    if (deleted !== null) throw new Error('Segment still exists after deletion');
  });

  // Test 12: Delete second segment
  await test('Delete second segment', async () => {
    if (!testSegment2.id) throw new Error('No test segment ID');
    await deleteSegment(testSegment2.id);
  });

  // Summary
  console.log(`\n${BLUE}=========================================${RESET}`);
  console.log(`Test Summary:`);
  console.log(`${GREEN}✅ Passed: ${testsPassed}${RESET}`);
  console.log(`${RED}❌ Failed: ${testsRun - testsPassed}${RESET}`);
  console.log(`📊 Total: ${testsRun}`);
  console.log(`${BLUE}=========================================${RESET}\n`);

  if (testsPassed === testsRun) {
    console.log(
      `${GREEN}🎉 All tests passed!${RESET}\n`
    );
    process.exit(0);
  } else {
    console.log(
      `${RED}⚠️  Some tests failed${RESET}\n`
    );
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error(`${RED}Test suite error:${RESET}`, error);
  process.exit(1);
});
