/**
 * Unit Tests for Resend Webhook Handler
 * Test script for GDP-004: Resend Webhook Edge Function (Unit Tests Only)
 *
 * These tests do NOT require Supabase configuration.
 * They test signature verification, parsing, and validation logic.
 *
 * Usage:
 *   npx tsx scripts/test-resend-webhook-unit.ts
 */

import crypto from 'crypto';
import { parseResendWebhook } from '../src/services/resendWebhookProcessor';
import {
  verifyResendWebhook,
  validateWebhookTimestamp,
} from '../src/utils/resendWebhookVerify';
import { ResendWebhookPayload } from '../src/types/resendWebhook';

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
function testSignatureVerification() {
  console.log('\n=== Test 1: Webhook Signature Verification ===');

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = JSON.stringify({ test: 'data' });
  const signature = generateMockSignature(payload, timestamp, TEST_SECRET);

  const isValid = verifyResendWebhook(
    payload,
    signature,
    timestamp,
    TEST_SECRET
  );

  if (isValid) {
    console.log('✓ Valid signature verified successfully');
  } else {
    console.error('✗ Failed to verify valid signature');
    throw new Error('Signature verification failed');
  }

  // Test invalid signature
  const invalidSig = 'v1,invalid_signature';
  const isInvalid = verifyResendWebhook(
    payload,
    invalidSig,
    timestamp,
    TEST_SECRET
  );

  if (!isInvalid) {
    console.log('✓ Invalid signature rejected correctly');
  } else {
    console.error('✗ Invalid signature was accepted');
    throw new Error('Invalid signature was not rejected');
  }

  console.log('✓ Test 1 passed');
}

/**
 * Test 2: Timestamp validation
 */
function testTimestampValidation() {
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

  console.log('✓ Test 2 passed');
}

/**
 * Test 3: Parse email delivered event
 */
function testParseDeliveredEvent() {
  console.log('\n=== Test 3: Parse Email Delivered Event ===');

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

  // Verify parsed data
  if (
    parsed.email_id === 'test_email_123' &&
    parsed.recipient_email === TEST_EMAIL &&
    parsed.event_type === 'email.delivered' &&
    parsed.subject === 'Welcome to AI Video Platform' &&
    parsed.from === 'noreply@example.com'
  ) {
    console.log('✓ Delivered event parsed correctly:', {
      email_id: parsed.email_id,
      recipient: parsed.recipient_email,
      event_type: parsed.event_type,
    });
  } else {
    throw new Error('Parsed data does not match expected values');
  }

  console.log('✓ Test 3 passed');
}

/**
 * Test 4: Parse email opened event
 */
function testParseOpenedEvent() {
  console.log('\n=== Test 4: Parse Email Opened Event ===');

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

  // Verify parsed data
  if (
    parsed.email_id === 'test_email_456' &&
    parsed.recipient_email === TEST_EMAIL &&
    parsed.event_type === 'email.opened' &&
    parsed.ip_address === '203.0.113.1' &&
    parsed.user_agent?.includes('Mozilla')
  ) {
    console.log('✓ Opened event parsed correctly:', {
      email_id: parsed.email_id,
      recipient: parsed.recipient_email,
      ip_address: parsed.ip_address,
    });
  } else {
    throw new Error('Parsed data does not match expected values');
  }

  console.log('✓ Test 4 passed');
}

/**
 * Test 5: Parse email clicked event
 */
function testParseClickedEvent() {
  console.log('\n=== Test 5: Parse Email Clicked Event ===');

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

  // Verify parsed data
  if (
    parsed.email_id === 'test_email_789' &&
    parsed.recipient_email === TEST_EMAIL &&
    parsed.event_type === 'email.clicked' &&
    parsed.link_url === 'https://example.com/features?utm_source=email' &&
    parsed.ip_address === '203.0.113.2'
  ) {
    console.log('✓ Clicked event parsed correctly:', {
      email_id: parsed.email_id,
      recipient: parsed.recipient_email,
      link_url: parsed.link_url,
    });
  } else {
    throw new Error('Parsed data does not match expected values');
  }

  console.log('✓ Test 5 passed');
}

/**
 * Test 6: Parse email bounced event
 */
function testParseBouncedEvent() {
  console.log('\n=== Test 6: Parse Email Bounced Event ===');

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

  // Verify parsed data
  if (
    parsed.email_id === 'test_email_bounce' &&
    parsed.recipient_email === 'bounce@example.com' &&
    parsed.event_type === 'email.bounced' &&
    parsed.bounce_type === 'Hard' &&
    parsed.diagnostic_code === '550 5.1.1 User unknown'
  ) {
    console.log('✓ Bounced event parsed correctly:', {
      email_id: parsed.email_id,
      recipient: parsed.recipient_email,
      bounce_type: parsed.bounce_type,
    });
  } else {
    throw new Error('Parsed data does not match expected values');
  }

  console.log('✓ Test 6 passed');
}

/**
 * Test 7: Skip unsupported event types
 */
function testSkipUnsupportedEvents() {
  console.log('\n=== Test 7: Skip Unsupported Event Types ===');

  const payload: ResendWebhookPayload = {
    type: 'email.sent',
    created_at: new Date().toISOString(),
    data: {
      email_id: 'test_email_sent',
      from: 'noreply@example.com',
      to: [TEST_EMAIL],
      subject: 'Test sent event',
      created_at: new Date().toISOString(),
    },
  };

  const parsed = parseResendWebhook(payload);

  if (parsed && parsed.email_id === 'test_email_sent') {
    console.log('✓ Sent event parsed (will be skipped by processor)');
  } else {
    throw new Error('Failed to parse sent event');
  }

  console.log('✓ Test 7 passed');
}

/**
 * Run all unit tests
 */
function runTests() {
  console.log('Starting Resend Webhook Unit Tests...');
  console.log('==========================================');
  console.log('Note: These tests do NOT require Supabase');
  console.log('==========================================');

  try {
    testSignatureVerification();
    testTimestampValidation();
    testParseDeliveredEvent();
    testParseOpenedEvent();
    testParseClickedEvent();
    testParseBouncedEvent();
    testSkipUnsupportedEvents();

    console.log('\n==========================================');
    console.log('✓ All unit tests passed successfully!');
    console.log('==========================================');
    console.log('\nTo run integration tests (requires Supabase):');
    console.log('  1. Configure Supabase in .env');
    console.log('  2. Run: npx tsx scripts/test-resend-webhook.ts');
    console.log('==========================================\n');
  } catch (error) {
    console.error('\n==========================================');
    console.error('✗ Tests failed:', error);
    console.error('==========================================\n');
    process.exit(1);
  }
}

// Run tests
runTests();
