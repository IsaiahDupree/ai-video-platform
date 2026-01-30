#!/usr/bin/env npx tsx

/**
 * META-008: Conversion Optimization Test Script
 * Tests conversion tracking and optimization
 */

import {
  trackConversionEvent,
  getConversionEvent,
  listConversions,
  createConversionFunnel,
  getFunnelsByPerson,
  createFunnelStep,
  getFunnelSteps,
  getConversionSummary,
  createOptimizationRule,
  listOptimizationRules,
} from '@/services/conversionOptimization';
import { ConversionEvent, ConversionFunnel } from '@/types/conversionOptimization';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
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
  console.log(`${BLUE}🧪 Testing Conversion Optimization (META-008)${RESET}\n`);

  let testConversion: ConversionEvent;
  let testFunnel: ConversionFunnel;
  const testPersonId = '00000000-0000-0000-0000-000000000000';

  // Test 1: Track conversion event
  await test('Track conversion event', async () => {
    testConversion = await trackConversionEvent({
      person_id: testPersonId,
      conversion_type: 'purchase',
      conversion_source: 'capi',
      value_cents: 2999,
      currency: 'USD',
      campaign_id: 'campaign_123',
      utm_source: 'google',
      utm_campaign: 'summer_sale',
    });

    if (!testConversion.id) throw new Error('Conversion not tracked');
  });

  // Test 2: Get conversion event
  await test('Fetch conversion event', async () => {
    if (!testConversion.id) throw new Error('No conversion ID');
    const conversion = await getConversionEvent(testConversion.id);
    if (!conversion) throw new Error('Conversion not found');
  });

  // Test 3: List conversions
  await test('List conversions', async () => {
    const conversions = await listConversions(testPersonId);
    if (!Array.isArray(conversions)) throw new Error('Not an array');
  });

  // Test 4: Create conversion funnel
  await test('Create conversion funnel', async () => {
    testFunnel = await createConversionFunnel({
      person_id: testPersonId,
      funnel_name: 'signup_to_purchase',
      total_steps: 3,
    });

    if (!testFunnel.id) throw new Error('Funnel not created');
  });

  // Test 5: Get funnels for person
  await test('Fetch funnels for person', async () => {
    const funnels = await getFunnelsByPerson(testPersonId);
    if (!Array.isArray(funnels)) throw new Error('Not an array');
  });

  // Test 6: Create funnel steps
  await test('Create funnel steps', async () => {
    if (!testFunnel.id) throw new Error('No funnel ID');

    const step = await createFunnelStep({
      funnel_id: testFunnel.id,
      step_number: 1,
      step_name: 'signup_view',
      expected_event_name: 'signup_page_view',
    });

    if (!step.id) throw new Error('Step not created');
  });

  // Test 7: Get funnel steps
  await test('Fetch funnel steps', async () => {
    if (!testFunnel.id) throw new Error('No funnel ID');
    const steps = await getFunnelSteps(testFunnel.id);
    if (!Array.isArray(steps)) throw new Error('Not an array');
  });

  // Test 8: Get conversion summary
  await test('Fetch conversion summary', async () => {
    const summary = await getConversionSummary(testPersonId);
    if (typeof summary.total_conversions !== 'number') {
      throw new Error('Summary not properly formatted');
    }
  });

  // Test 9: Create optimization rule
  await test('Create optimization rule', async () => {
    const rule = await createOptimizationRule({
      name: `Test Rule ${Date.now()}`,
      description: 'Test optimization rule',
      trigger_event: 'purchase_completed',
      trigger_type: 'event',
      action_type: 'send_to_meta',
      action_config: {
        pixel_id: 'pixel_123',
        event_name: 'Purchase',
      },
    });

    if (!rule.id) throw new Error('Rule not created');
  });

  // Test 10: List optimization rules
  await test('List optimization rules', async () => {
    const rules = await listOptimizationRules(true);
    if (!Array.isArray(rules)) throw new Error('Not an array');
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
