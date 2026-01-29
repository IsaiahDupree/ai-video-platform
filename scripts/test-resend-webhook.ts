/**
 * Test Resend Webhook Handler
 * Test script for GDP-004: Resend Webhook Edge Function
 *
 * This script simulates Resend webhook events and verifies:
 * 1. Webhook signature verification
 * 2. Event parsing
 * 3. Event storage in Growth Data Plane
 * 4. Deduplication
 *
 * Usage:
 *   npx tsx scripts/test-resend-webhook.ts
 */

import crypto from 'crypto';
import {
  parseResendWebhook,
  processResendWebhook,
} from '../src/services/resendWebhookProcessor';
import {
  verifyResendWebhook,
  validateWebhookTimestamp,
} from '../src/utils/resendWebhookVerify';
import { ResendWebhookPayload } from '../src/types/resendWebhook';
import { getPersonEvents } from '../src/services/growthDataPlane';

// Test data
const TEST_SECRET = 'whsec_test_secret_key';
const TEST_EMAIL = 'test@example.com';

/**
 * Generate mock Svix signature for testing
 */
function generateMockSignature(
  payload: string,
  timestamp: string,
  secret: string
): string {
  const signedContent = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedContent)
    .digest('base64');

  return `v1,${signature}`;
}

/**
 * Test 1: Webhook signature verification
 */
async function testSignatureVerification() {
  console.log('\n=== Test 1: Webhook Signature Verification ===');

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = JSON.stringify({ test: 'data' });
  const signature = generateMockSignature(payload, timestamp, TEST_SECRET);

  const isValid = verifyResendWebhook(payload, signature, timestamp, TEST_SECRET);

  if (isValid) {
    console.log('✓ Valid signature verified successfully');
  } else {
    console.error('✗ Failed to verify valid signature');
    throw new Error('Signature verification failed');
  }

  // Test invalid signature
  const invalidSig = 'v1,invalid_signature';
  const isInvalid = verifyResendWebhook(payload, invalidSig, timestamp, TEST_SECRET);

  if (!isInvalid) {
    console.log('✓ Invalid signature rejected correctly');
  } else {
    console.error('✗ Invalid signature was accepted');
    throw new Error('Invalid signature was not rejected');
  }
}

/**
 * Test 2: Timestamp validation
 */
async function testTimestampValidation() {
  console.log('\n=== Test 2: Timestamp Validation ===');

  // Current timestamp (should be valid)
  const currentTimestamp = Math.floor(Date.now() / 1000).toString();
  const isCurrentValid = validateWebhookTimestamp(currentTimestamp);

  if (isCurrentValid) {
    console.log('✓ Current timestamp validated successfully');
  } else {
    console.error('✗ Current timestamp rejected');
    throw new Error('Current timestamp validation failed');
  }

  // Old timestamp (should be rejected - 10 minutes ago)
  const oldTimestamp = (Math.floor(Date.now() / 1000) - 600).toString();
  const isOldValid = validateWebhookTimestamp(oldTimestamp);

  if (!isOldValid) {
    console.log('✓ Old timestamp rejected correctly (replay attack prevention)');
  } else {
    console.error('✗ Old timestamp was accepted');
    throw new Error('Old timestamp was not rejected');
  }
}

/**
 * Test 3: Email delivered event
 */
async function testEmailDeliveredEvent() {
  console.log('\n=== Test 3: Email Delivered Event ===');

  const payload: ResendWebhookPayload = {
    type: 'email.delivered',
    created_at: new Date().toISOString(),
    data: {
      email_id: 'test_email_123',
      from: 'noreply@example.com',
      to: [TEST_EMAIL],
      subject: 'Welcome to AI Video Platform',
      created_at: new Date().toISOString(),
    },
  };

  const parsed = parseResendWebhook(payload);
  if (!parsed) {
    throw new Error('Failed to parse delivered event');
  }

  console.log('✓ Parsed delivered event:', {
    email_id: parsed.email_id,
    recipient: parsed.recipient_email,
    event_type: parsed.event_type,
  });

  const eventId = await processResendWebhook(payload);
  if (eventId) {
    console.log('✓ Delivered event stored successfully:', eventId);
  } else {
    throw new Error('Failed to store delivered event');
  }
}

/**
 * Test 4: Email opened event
 */
async function testEmailOpenedEvent() {
  console.log('\n=== Test 4: Email Opened Event ===');

  const payload: ResendWebhookPayload = {
    type: 'email.opened',
    created_at: new Date().toISOString(),
    data: {
      email_id: 'test_email_456',
      from: 'noreply@example.com',
      to: [TEST_EMAIL],
      subject: 'Your video is ready!',
      created_at: new Date().toISOString(),
      open: {
        ipAddress: '203.0.113.1',
        timestamp: new Date().toISOString(),
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    },
  };

  const parsed = parseResendWebhook(payload);
  if (!parsed) {
    throw new Error('Failed to parse opened event');
  }

  console.log('✓ Parsed opened event:', {
    email_id: parsed.email_id,
    recipient: parsed.recipient_email,
    ip_address: parsed.ip_address,
    user_agent: parsed.user_agent,
  });

  const eventId = await processResendWebhook(payload);
  if (eventId) {
    console.log('✓ Opened event stored successfully:', eventId);
  } else {
    throw new Error('Failed to store opened event');
  }
}

/**
 * Test 5: Email clicked event
 */
async function testEmailClickedEvent() {
  console.log('\n=== Test 5: Email Clicked Event ===');

  const payload: ResendWebhookPayload = {
    type: 'email.clicked',
    created_at: new Date().toISOString(),
    data: {
      email_id: 'test_email_789',
      from: 'noreply@example.com',
      to: [TEST_EMAIL],
      subject: 'Check out your new features',
      created_at: new Date().toISOString(),
      click: {
        ipAddress: '203.0.113.2',
        link: 'https://example.com/features?utm_source=email',
        timestamp: new Date().toISOString(),
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
      },
    },
  };

  const parsed = parseResendWebhook(payload);
  if (!parsed) {
    throw new Error('Failed to parse clicked event');
  }

  console.log('✓ Parsed clicked event:', {
    email_id: parsed.email_id,
    recipient: parsed.recipient_email,
    link_url: parsed.link_url,
    ip_address: parsed.ip_address,
  });

  const eventId = await processResendWebhook(payload);
  if (eventId) {
    console.log('✓ Clicked event stored successfully:', eventId);
  } else {
    throw new Error('Failed to store clicked event');
  }
}

/**
 * Test 6: Email bounced event
 */
async function testEmailBouncedEvent() {
  console.log('\n=== Test 6: Email Bounced Event ===');

  const payload: ResendWebhookPayload = {
    type: 'email.bounced',
    created_at: new Date().toISOString(),
    data: {
      email_id: 'test_email_bounce',
      from: 'noreply@example.com',
      to: ['bounce@example.com'],
      subject: 'Test bounce',
      created_at: new Date().toISOString(),
      bounce: {
        bounceType: 'Hard',
        bouncedRecipient: 'bounce@example.com',
        diagnosticCode: '550 5.1.1 User unknown',
        timestamp: new Date().toISOString(),
      },
    },
  };

  const parsed = parseResendWebhook(payload);
  if (!parsed) {
    throw new Error('Failed to parse bounced event');
  }

  console.log('✓ Parsed bounced event:', {
    email_id: parsed.email_id,
    recipient: parsed.recipient_email,
    bounce_type: parsed.bounce_type,
    diagnostic_code: parsed.diagnostic_code,
  });

  const eventId = await processResendWebhook(payload);
  if (eventId) {
    console.log('✓ Bounced event stored successfully:', eventId);
  } else {
    throw new Error('Failed to store bounced event');
  }
}

/**
 * Test 7: Event deduplication
 */
async function testEventDeduplication() {
  console.log('\n=== Test 7: Event Deduplication ===');

  const payload: ResendWebhookPayload = {
    type: 'email.delivered',
    created_at: new Date().toISOString(),
    data: {
      email_id: 'test_email_dedup',
      from: 'noreply@example.com',
      to: [TEST_EMAIL],
      subject: 'Deduplication test',
      created_at: new Date().toISOString(),
    },
  };

  // Process same event twice
  const eventId1 = await processResendWebhook(payload);
  const eventId2 = await processResendWebhook(payload);

  if (eventId1 && !eventId2) {
    console.log('✓ Duplicate event rejected successfully');
    console.log(`  First event ID: ${eventId1}`);
    console.log('  Second event: null (deduplicated)');
  } else {
    console.error('✗ Deduplication failed');
    console.error(`  First event ID: ${eventId1}`);
    console.error(`  Second event ID: ${eventId2}`);
    throw new Error('Event deduplication failed');
  }
}

/**
 * Test 8: Verify events in database
 */
async function testVerifyEventsInDatabase() {
  console.log('\n=== Test 8: Verify Events in Database ===');

  // Note: This requires a person to exist with TEST_EMAIL
  // The events should have been created by previous tests

  try {
    // Find person by email using the Growth Data Plane service
    const { findPersonByIdentity } = await import(
      '../src/services/growthDataPlane'
    );
    const person = await findPersonByIdentity('email', TEST_EMAIL);

    if (!person) {
      console.log('⚠ No person found with test email (events may be orphaned)');
      return;
    }

    const events = await getPersonEvents(person.id, 10);

    console.log(`✓ Found ${events.length} events for ${TEST_EMAIL}`);

    // Count email events
    const emailEvents = events.filter((e) => e.event_source === 'email');
    console.log(`✓ ${emailEvents.length} email events found`);

    // Show breakdown
    const eventTypes = emailEvents.reduce(
      (acc, e) => {
        acc[e.email_type || 'unknown'] = (acc[e.email_type || 'unknown'] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log('  Event breakdown:', eventTypes);
  } catch (error) {
    console.error('✗ Error verifying events:', error);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('Starting Resend Webhook Tests...');
  console.log('=====================================');

  try {
    await testSignatureVerification();
    await testTimestampValidation();
    await testEmailDeliveredEvent();
    await testEmailOpenedEvent();
    await testEmailClickedEvent();
    await testEmailBouncedEvent();
    await testEventDeduplication();
    await testVerifyEventsInDatabase();

    console.log('\n=====================================');
    console.log('✓ All tests passed successfully!');
    console.log('=====================================\n');
  } catch (error) {
    console.error('\n=====================================');
    console.error('✗ Tests failed:', error);
    console.error('=====================================\n');
    process.exit(1);
  }
}

// Run tests
runTests();
