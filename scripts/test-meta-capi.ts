#!/usr/bin/env tsx

/**
 * Test script for META-004: CAPI Server-Side Events
 *
 * Tests the Meta Conversions API integration to ensure server-side
 * conversion tracking is working correctly.
 *
 * Usage:
 *   tsx scripts/test-meta-capi.ts
 */

import { metaCapiService } from '../src/services/metaCapi';
import { serverTracking } from '../src/services/trackingServer';

async function testMetaCapi() {
  console.log('🧪 Testing META-004: CAPI Server-Side Events\n');

  // Check environment variables
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE;

  if (!pixelId || pixelId === 'your_meta_pixel_id_here') {
    console.error('❌ NEXT_PUBLIC_META_PIXEL_ID not configured in .env');
    console.log('   Set your Meta Pixel ID to test CAPI integration');
    return;
  }

  if (!accessToken || accessToken === 'your_meta_capi_access_token_here') {
    console.error('❌ META_CAPI_ACCESS_TOKEN not configured in .env');
    console.log('   Get your access token from Meta Events Manager > Settings > Conversions API');
    return;
  }

  console.log('✅ Environment variables configured');
  console.log(`   Pixel ID: ${pixelId}`);
  console.log(`   Access Token: ${accessToken.substring(0, 10)}...`);
  if (testEventCode) {
    console.log(`   Test Event Code: ${testEventCode}`);
  }
  console.log('');

  // Initialize CAPI service
  console.log('📡 Initializing Meta CAPI service...');
  metaCapiService.initialize({
    pixelId,
    accessToken,
    testEventCode,
  });

  if (!metaCapiService.isInitialized()) {
    console.error('❌ Failed to initialize Meta CAPI service');
    return;
  }

  console.log('✅ Meta CAPI service initialized\n');

  // Test 1: Connection test
  console.log('Test 1: Connection Test');
  console.log('Sending PageView event to test CAPI connection...');

  try {
    const connectionTest = await metaCapiService.testConnection();

    if (connectionTest) {
      console.log('✅ Connection test passed\n');
    } else {
      console.error('❌ Connection test failed\n');
      return;
    }
  } catch (error) {
    console.error('❌ Connection test error:', error);
    return;
  }

  // Test 2: Track a standard event
  console.log('Test 2: Track Standard Event');
  console.log('Sending Lead event (signup_started)...');

  try {
    const response = await metaCapiService.trackEvent('Lead', {
      userData: {
        em: 'test@example.com',
        fn: 'John',
        ln: 'Doe',
        client_user_agent: 'Mozilla/5.0 (Test)',
        client_ip_address: '192.168.1.1',
      },
      customData: {
        content_name: 'Test Signup Form',
        content_category: 'signup',
        value: 5,
        currency: 'USD',
      },
      eventId: `test-${Date.now()}`,
    });

    if (response) {
      console.log('✅ Lead event sent successfully');
      console.log(`   Events received: ${response.events_received}`);
      console.log(`   FB Trace ID: ${response.fbtrace_id}`);
      console.log('');
    }
  } catch (error) {
    console.error('❌ Failed to send Lead event:', error);
  }

  // Test 3: Track a Purchase event
  console.log('Test 3: Track Purchase Event');
  console.log('Sending Purchase event (purchase_completed)...');

  try {
    const response = await metaCapiService.trackEvent('Purchase', {
      userData: {
        em: 'customer@example.com',
        fn: 'Jane',
        ln: 'Smith',
        external_id: 'user_12345',
      },
      customData: {
        content_ids: ['plan_pro'],
        content_name: 'Pro Plan',
        content_type: 'product',
        value: 29.99,
        currency: 'USD',
      },
      eventId: `test-purchase-${Date.now()}`,
    });

    if (response) {
      console.log('✅ Purchase event sent successfully');
      console.log(`   Events received: ${response.events_received}`);
      console.log(`   FB Trace ID: ${response.fbtrace_id}`);
      console.log('');
    }
  } catch (error) {
    console.error('❌ Failed to send Purchase event:', error);
  }

  // Test 4: Track via serverTracking service
  console.log('Test 4: Track via Server Tracking Service');
  console.log('Sending video_rendered event via serverTracking...');

  try {
    serverTracking.track('video_rendered', {
      userId: 'test_user_123',
      email: 'user@example.com',
      videoId: 'video_abc123',
      renderCount: 3,
    });

    console.log('✅ Event tracked via serverTracking service');
    console.log('   (CAPI event sent asynchronously)\n');
  } catch (error) {
    console.error('❌ Failed to track via serverTracking:', error);
  }

  // Test 5: Batch events
  console.log('Test 5: Batch Event Tracking');
  console.log('Sending multiple events in a batch...');

  try {
    const response = await metaCapiService.trackBatchEvents([
      {
        eventName: 'ViewContent',
        options: {
          userData: { em: 'user1@example.com' },
          customData: { content_name: 'Landing Page' },
          eventId: `test-batch-1-${Date.now()}`,
        },
      },
      {
        eventName: 'Lead',
        options: {
          userData: { em: 'user2@example.com' },
          customData: { content_name: 'Contact Form' },
          eventId: `test-batch-2-${Date.now()}`,
        },
      },
      {
        eventName: 'InitiateCheckout',
        options: {
          userData: { em: 'user3@example.com' },
          customData: {
            content_ids: ['plan_starter'],
            value: 9.99,
            currency: 'USD',
          },
          eventId: `test-batch-3-${Date.now()}`,
        },
      },
    ]);

    if (response) {
      console.log('✅ Batch events sent successfully');
      console.log(`   Events received: ${response.events_received}`);
      console.log(`   FB Trace ID: ${response.fbtrace_id}`);
      console.log('');
    }
  } catch (error) {
    console.error('❌ Failed to send batch events:', error);
  }

  // Summary
  console.log('');
  console.log('═'.repeat(60));
  console.log('✅ META-004 CAPI Server-Side Events Test Complete');
  console.log('═'.repeat(60));
  console.log('');
  console.log('Next steps:');
  console.log('1. Check Meta Events Manager to verify events were received:');
  console.log('   https://business.facebook.com/events_manager');
  console.log('');
  console.log('2. If using test event code, check Test Events tab');
  console.log('');
  console.log('3. Verify event quality and deduplication scores');
  console.log('');

  // Shutdown server tracking
  await serverTracking.shutdown();
}

// Run tests
testMetaCapi().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
