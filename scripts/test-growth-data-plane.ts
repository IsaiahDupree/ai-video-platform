/**
 * Test Growth Data Plane Schema (GDP-001)
 *
 * This script tests the Supabase schema and service functions.
 *
 * Prerequisites:
 * 1. Set up Supabase project
 * 2. Run migrations in supabase/migrations/
 * 3. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env
 *
 * Usage:
 *   npx tsx scripts/test-growth-data-plane.ts
 */

import {
  findOrCreatePerson,
  createEvent,
  createSubscription,
  getPersonEvents,
  getPersonIdentities,
  updatePersonFeatures,
  mergePersonRecords,
  addIdentityLink,
} from '../src/services/growthDataPlane';
import { isSupabaseConfigured } from '../src/services/supabase';

async function testGrowthDataPlane() {
  console.log('🧪 Testing Growth Data Plane Schema (GDP-001)\n');

  // Check configuration
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
    console.log('\nAdd to .env:');
    console.log('SUPABASE_URL=https://your-project.supabase.co');
    console.log('SUPABASE_SERVICE_KEY=your-service-key');
    return;
  }

  console.log('✅ Supabase configured\n');

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Test 1: Create person by email
    console.log('Test 1: Create person by email');
    const person1 = await findOrCreatePerson({
      identity_type: 'email',
      identity_value: 'test@example.com',
      source: 'test',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    });
    console.log(`✅ Created person: ${person1.id}`);
    testsPassed++;

    // Test 2: Find existing person by email
    console.log('\nTest 2: Find existing person by email');
    const person1Again = await findOrCreatePerson({
      identity_type: 'email',
      identity_value: 'test@example.com',
      source: 'test',
    });
    if (person1Again.id === person1.id) {
      console.log(`✅ Found existing person: ${person1Again.id}`);
      testsPassed++;
    } else {
      console.log('❌ Found different person');
      testsFailed++;
    }

    // Test 3: Add anonymous identity
    console.log('\nTest 3: Add anonymous identity to person');
    const anonId = `anon-${Date.now()}`;
    await addIdentityLink(person1.id, 'anonymous_id', anonId, 'test');
    console.log(`✅ Added anonymous identity: ${anonId}`);
    testsPassed++;

    // Test 4: Create event
    console.log('\nTest 4: Create event');
    const event1 = await createEvent({
      person_id: person1.id,
      event_name: 'signup_completed',
      event_type: 'acquisition',
      event_source: 'server',
      event_id: `test-event-${Date.now()}`,
      page_url: 'https://example.com/signup',
      properties: {
        test: true,
        source: 'automated-test',
      },
    });
    console.log(`✅ Created event: ${event1.id}`);
    testsPassed++;

    // Test 5: Create duplicate event (test deduplication)
    console.log('\nTest 5: Test event deduplication');
    const event1Dup = await createEvent({
      person_id: person1.id,
      event_name: 'signup_completed',
      event_type: 'acquisition',
      event_source: 'server',
      event_id: event1.event_id,
      page_url: 'https://example.com/signup',
    });
    if (event1Dup.id === event1.id) {
      console.log(`✅ Event deduplicated correctly`);
      testsPassed++;
    } else {
      console.log('❌ Event not deduplicated');
      testsFailed++;
    }

    // Test 6: Create video render event
    console.log('\nTest 6: Create video render event');
    await createEvent({
      person_id: person1.id,
      event_name: 'video_rendered',
      event_type: 'core_value',
      event_source: 'server',
      properties: {
        template: 'product-hero',
        size: '1080x1080',
      },
    });
    console.log('✅ Created video render event');
    testsPassed++;

    // Test 7: Create purchase event with revenue
    console.log('\nTest 7: Create purchase event with revenue');
    await createEvent({
      person_id: person1.id,
      event_name: 'purchase_completed',
      event_type: 'monetization',
      event_source: 'server',
      revenue_cents: 2999,
      currency: 'USD',
      properties: {
        plan: 'pro-monthly',
      },
    });
    console.log('✅ Created purchase event');
    testsPassed++;

    // Test 8: Update person features
    console.log('\nTest 8: Update person features');
    await updatePersonFeatures(person1.id);
    console.log('✅ Updated person features');
    testsPassed++;

    // Test 9: Get person events
    console.log('\nTest 9: Get person events');
    const events = await getPersonEvents(person1.id);
    console.log(`✅ Retrieved ${events.length} events for person`);
    testsPassed++;

    // Test 10: Get person identities
    console.log('\nTest 10: Get person identities');
    const identities = await getPersonIdentities(person1.id);
    console.log(`✅ Retrieved ${identities.length} identities for person:`);
    identities.forEach((id) => {
      console.log(`   - ${id.identity_type}: ${id.identity_value}`);
    });
    testsPassed++;

    // Test 11: Create subscription
    console.log('\nTest 11: Create subscription');
    const subscription = await createSubscription({
      person_id: person1.id,
      stripe_subscription_id: `sub_test_${Date.now()}`,
      stripe_customer_id: `cus_test_${Date.now()}`,
      plan_id: 'pro-monthly',
      plan_name: 'Pro Monthly',
      status: 'active',
      amount_cents: 2999,
      currency: 'USD',
      interval: 'month',
      mrr_cents: 2999,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    console.log(`✅ Created subscription: ${subscription.id}`);
    testsPassed++;

    // Test 12: Create second person for merge test
    console.log('\nTest 12: Create second person for identity stitching');
    const person2 = await findOrCreatePerson({
      identity_type: 'anonymous_id',
      identity_value: `anon-merge-${Date.now()}`,
      source: 'test',
    });
    console.log(`✅ Created second person: ${person2.id}`);
    testsPassed++;

    // Test 13: Add events to second person
    console.log('\nTest 13: Add events to second person');
    await createEvent({
      person_id: person2.id,
      event_name: 'landing_view',
      event_type: 'acquisition',
      event_source: 'client',
    });
    console.log('✅ Added event to second person');
    testsPassed++;

    // Test 14: Merge person records (identity stitching)
    console.log('\nTest 14: Merge person records (identity stitching)');
    const merged = await mergePersonRecords(person2.id, person1.id);
    if (merged) {
      console.log(`✅ Merged person ${person2.id} into ${person1.id}`);
      testsPassed++;
    } else {
      console.log('❌ Merge failed');
      testsFailed++;
    }

    // Test 15: Verify merged events
    console.log('\nTest 15: Verify merged events');
    const mergedEvents = await getPersonEvents(person1.id);
    if (mergedEvents.length >= events.length + 1) {
      console.log(`✅ Events merged successfully (${mergedEvents.length} total events)`);
      testsPassed++;
    } else {
      console.log('❌ Events not merged correctly');
      testsFailed++;
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('Test Summary:');
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📊 Total: ${testsPassed + testsFailed}`);
    console.log('='.repeat(50));

    if (testsFailed === 0) {
      console.log('\n🎉 All tests passed!');
    } else {
      console.log('\n⚠️  Some tests failed');
    }
  } catch (error) {
    console.error('\n❌ Test error:', error);
    testsFailed++;
  }
}

// Run tests
testGrowthDataPlane();
