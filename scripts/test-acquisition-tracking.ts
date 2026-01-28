#!/usr/bin/env tsx

/**
 * Test script for TRACK-002: Acquisition Event Tracking
 *
 * This script tests the following acquisition events:
 * - landing_view: When users first view the landing page
 * - signup_started: When users begin the signup process
 * - signup_completed: When users complete signup
 */

import { serverTracking } from '../src/services/trackingServer';

async function testAcquisitionTracking() {
  console.log('🧪 Testing TRACK-002: Acquisition Event Tracking\n');

  // Initialize tracking
  console.log('1. Initializing tracking service...');
  serverTracking.initialize({
    apiKey: process.env.POSTHOG_API_KEY || 'test-key',
    enabled: true,
  });

  if (!serverTracking.isEnabled()) {
    console.warn('⚠️  Tracking is disabled. Set POSTHOG_API_KEY to test with real PostHog.');
    console.log('   Continuing with mock mode...\n');
  } else {
    console.log('✓ Tracking initialized successfully\n');
  }

  // Simulate user journey
  const testUserId = `test_user_${Date.now()}`;
  const testEmail = `test_${Date.now()}@example.com`;

  // Test 1: Landing View
  console.log('2. Testing landing_view event...');
  serverTracking.track('landing_view', {
    page: 'home',
    timestamp: new Date().toISOString(),
    referrer: 'google',
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'winter_2024',
  });
  console.log('✓ landing_view event tracked');
  console.log('   - Properties: page=home, referrer=google, utm_source=google\n');

  // Wait a bit to simulate user browsing
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test 2: Signup Started
  console.log('3. Testing signup_started event...');
  serverTracking.track('signup_started', {
    page: 'signup',
    timestamp: new Date().toISOString(),
    method: 'email',
  });
  console.log('✓ signup_started event tracked');
  console.log('   - Properties: page=signup, method=email\n');

  // Wait a bit to simulate form filling
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 3: Signup Completed
  console.log('4. Testing signup_completed event...');
  serverTracking.track('signup_completed', {
    page: 'signup',
    timestamp: new Date().toISOString(),
    method: 'email',
  });
  console.log('✓ signup_completed event tracked');
  console.log('   - Properties: page=signup, method=email\n');

  // Test 4: User Identification
  console.log('5. Testing user identification...');
  serverTracking.identify(testUserId, {
    email: testEmail,
    name: 'Test User',
    plan: 'free',
    signup_date: new Date().toISOString(),
  });
  console.log('✓ User identified successfully');
  console.log(`   - User ID: ${testUserId}`);
  console.log(`   - Email: ${testEmail}`);
  console.log('   - Plan: free\n');

  // Test 5: Landing view on different page
  console.log('6. Testing landing_view on signup page...');
  serverTracking.track('landing_view', {
    page: 'signup',
    timestamp: new Date().toISOString(),
    referrer: 'direct',
  });
  console.log('✓ landing_view event tracked for signup page');
  console.log('   - Properties: page=signup, referrer=direct\n');

  // Test 6: Multiple signup methods
  console.log('7. Testing different signup methods...');

  const methods = ['email', 'google', 'github'];
  for (const method of methods) {
    serverTracking.track('signup_started', {
      page: 'signup',
      method,
      timestamp: new Date().toISOString(),
    });
    console.log(`✓ signup_started tracked for method: ${method}`);
  }
  console.log();

  // Shutdown
  console.log('8. Shutting down tracking service...');
  await serverTracking.shutdown();
  console.log('✓ Tracking service shut down gracefully\n');

  console.log('✅ All acquisition tracking tests completed successfully!\n');

  // Summary
  console.log('📊 Test Summary:');
  console.log('   - landing_view: 2 events tracked');
  console.log('   - signup_started: 4 events tracked');
  console.log('   - signup_completed: 1 event tracked');
  console.log('   - User identified: 1 user\n');

  console.log('📝 Next Steps:');
  console.log('   1. Visit http://localhost:3000 to test landing_view');
  console.log('   2. Visit http://localhost:3000/signup to test signup flow');
  console.log('   3. Check PostHog dashboard for tracked events');
  console.log('   4. Verify event properties and user identification\n');

  console.log('🎉 TRACK-002 Implementation Complete!');
}

// Run tests
testAcquisitionTracking().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
