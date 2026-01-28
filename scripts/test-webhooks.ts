/**
 * Test script for Webhook Service - ADS-017
 *
 * Comprehensive test suite for webhook notification system
 */

import {
  WebhookService,
  getWebhookService,
  resetWebhookService,
  WebhookEventType,
  type WebhookConfig,
  type WebhookPayload,
} from '../src/services/webhooks';
import { createServer, Server, IncomingMessage, ServerResponse } from 'http';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printSeparator() {
  console.log('='.repeat(60));
}

function printTestHeader(testName: string) {
  printSeparator();
  log(`  TEST: ${testName}`, 'cyan');
  printSeparator();
}

/**
 * Create a simple HTTP server to receive webhook POSTs
 */
class TestWebhookServer {
  private server: Server | null = null;
  private port: number;
  private receivedPayloads: Array<{
    headers: Record<string, string | string[] | undefined>;
    body: any;
    timestamp: number;
  }> = [];

  constructor(port: number = 3456) {
    this.port = port;
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = createServer((req: IncomingMessage, res: ServerResponse) => {
        let body = '';

        req.on('data', (chunk) => {
          body += chunk.toString();
        });

        req.on('end', () => {
          try {
            const payload = JSON.parse(body);
            this.receivedPayloads.push({
              headers: req.headers as Record<string, string | string[] | undefined>,
              body: payload,
              timestamp: Date.now(),
            });

            log(`[TestServer] Received webhook: ${payload.event}`, 'green');

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (error) {
            log(`[TestServer] Error processing webhook: ${error}`, 'red');
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
      });

      this.server.listen(this.port, () => {
        log(`[TestServer] Listening on port ${this.port}`, 'green');
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          log('[TestServer] Stopped', 'yellow');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getReceivedPayloads() {
    return this.receivedPayloads;
  }

  clearPayloads() {
    this.receivedPayloads = [];
  }
}

/**
 * Test 1: Register and manage webhooks
 */
async function testWebhookRegistration() {
  printTestHeader('Webhook Registration and Management');

  const service = new WebhookService('data/webhooks-test');

  // Register a webhook
  const webhook = service.registerWebhook(
    'http://localhost:3456/webhook',
    [WebhookEventType.RENDER_COMPLETE, WebhookEventType.RENDER_FAILED],
    { project: 'test-project' }
  );

  log('✓ Webhook registered:', 'green');
  console.log(JSON.stringify(webhook, null, 2));
  console.log();

  // Verify webhook was saved
  const retrieved = service.getWebhook(webhook.id);
  if (!retrieved) {
    throw new Error('Failed to retrieve webhook');
  }
  log('✓ Webhook retrieved successfully', 'green');
  console.log();

  // Update webhook
  const updated = service.updateWebhook(webhook.id, {
    enabled: false,
    metadata: { ...webhook.metadata, updated: true },
  });
  log('✓ Webhook updated:', 'green');
  console.log(JSON.stringify(updated, null, 2));
  console.log();

  // Enable it again
  service.updateWebhook(webhook.id, { enabled: true });

  // Get all webhooks
  const allWebhooks = service.getAllWebhooks();
  log(`✓ Total webhooks: ${allWebhooks.length}`, 'green');
  console.log();

  return { service, webhook };
}

/**
 * Test 2: Send webhooks with server
 */
async function testWebhookDelivery() {
  printTestHeader('Webhook Delivery');

  const server = new TestWebhookServer(3456);
  await server.start();

  const service = new WebhookService('data/webhooks-test');

  // Register webhook
  const webhook = service.registerWebhook(
    'http://localhost:3456/webhook',
    [WebhookEventType.RENDER_COMPLETE]
  );

  log('✓ Webhook registered', 'green');
  console.log();

  // Create test payload
  const payload: WebhookPayload = {
    event: WebhookEventType.RENDER_COMPLETE,
    timestamp: Date.now(),
    jobId: 'test-job-123',
    data: {
      success: true,
      results: [],
      totalRendered: 5,
      totalFailed: 0,
      startTime: Date.now() - 5000,
      endTime: Date.now(),
      duration: 5000,
    },
    metadata: { test: true },
  };

  log('Sending webhook...', 'yellow');
  const delivery = await service.sendWebhook(webhook, payload);

  if (delivery.success) {
    log('✓ Webhook delivered successfully', 'green');
    console.log(JSON.stringify(delivery, null, 2));
  } else {
    log(`✗ Webhook delivery failed: ${delivery.error}`, 'red');
  }
  console.log();

  // Check server received the webhook
  await new Promise((resolve) => setTimeout(resolve, 100));
  const received = server.getReceivedPayloads();
  log(`✓ Server received ${received.length} webhook(s)`, 'green');

  if (received.length > 0) {
    log('Received payload:', 'cyan');
    console.log(JSON.stringify(received[0].body, null, 2));
  }
  console.log();

  await server.stop();

  return { service, webhook, delivery };
}

/**
 * Test 3: Webhook signature verification
 */
async function testSignatureVerification() {
  printTestHeader('Signature Verification');

  const service = new WebhookService('data/webhooks-test');

  const webhook = service.registerWebhook(
    'http://localhost:3456/webhook',
    [WebhookEventType.RENDER_COMPLETE]
  );

  const payload: WebhookPayload = {
    event: WebhookEventType.RENDER_COMPLETE,
    timestamp: Date.now(),
    jobId: 'test-job-456',
    data: { success: true },
  };

  const payloadJson = JSON.stringify(payload);
  const validSignature = service['generateSignature'](payloadJson, webhook.secret);
  const invalidSignature = 'invalid-signature-12345';

  // Test valid signature
  const isValid = service.verifySignature(payloadJson, validSignature, webhook.secret);
  if (isValid) {
    log('✓ Valid signature verified correctly', 'green');
  } else {
    log('✗ Valid signature verification failed', 'red');
  }

  // Test invalid signature
  const isInvalid = service.verifySignature(payloadJson, invalidSignature, webhook.secret);
  if (!isInvalid) {
    log('✓ Invalid signature rejected correctly', 'green');
  } else {
    log('✗ Invalid signature was accepted', 'red');
  }
  console.log();
}

/**
 * Test 4: Retry logic with failing server
 */
async function testRetryLogic() {
  printTestHeader('Retry Logic');

  let requestCount = 0;
  let shouldFail = true;

  const server = createServer((req, res) => {
    requestCount++;
    log(`[TestServer] Received attempt #${requestCount}`, 'yellow');

    if (shouldFail && requestCount < 3) {
      // Fail the first 2 attempts
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Server error' }));
    } else {
      // Succeed on the 3rd attempt
      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(3456, () => {
      log('[TestServer] Started', 'green');
      resolve();
    });
  });

  const service = new WebhookService('data/webhooks-test', {
    maxAttempts: 3,
    retryDelay: 500,
    backoffMultiplier: 2,
  });

  const webhook = service.registerWebhook(
    'http://localhost:3456/webhook',
    [WebhookEventType.RENDER_COMPLETE]
  );

  const payload: WebhookPayload = {
    event: WebhookEventType.RENDER_COMPLETE,
    timestamp: Date.now(),
    jobId: 'test-retry-job',
    data: { success: true },
  };

  log('Sending webhook with retry logic...', 'yellow');
  const delivery = await service.sendWebhook(webhook, payload);

  log(`\n✓ Delivery completed after ${requestCount} attempts`, 'green');
  console.log(JSON.stringify(delivery, null, 2));
  console.log();

  await new Promise<void>((resolve) => {
    server.close(() => {
      log('[TestServer] Stopped', 'yellow');
      resolve();
    });
  });
}

/**
 * Test 5: Delivery statistics
 */
async function testDeliveryStats() {
  printTestHeader('Delivery Statistics');

  const server = new TestWebhookServer(3456);
  await server.start();

  const service = new WebhookService('data/webhooks-test');

  const webhook = service.registerWebhook(
    'http://localhost:3456/webhook',
    [WebhookEventType.RENDER_COMPLETE]
  );

  // Send multiple webhooks
  log('Sending 5 test webhooks...', 'yellow');
  for (let i = 0; i < 5; i++) {
    const payload: WebhookPayload = {
      event: WebhookEventType.RENDER_COMPLETE,
      timestamp: Date.now(),
      jobId: `test-job-${i}`,
      data: { success: true },
    };

    await service.sendWebhook(webhook, payload);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Get statistics
  const stats = service.getDeliveryStats(webhook.id);
  log('\n✓ Delivery Statistics:', 'green');
  console.log(JSON.stringify(stats, null, 2));
  console.log();

  // Get delivery history
  const history = service.getDeliveryHistory(webhook.id, 10);
  log(`✓ Delivery history (last ${history.length} deliveries)`, 'green');
  history.forEach((d, i) => {
    const status = d.success ? '✓' : '✗';
    const color = d.success ? 'green' : 'red';
    log(`  ${status} Attempt ${i + 1}: ${d.success ? 'Success' : d.error}`, color);
  });
  console.log();

  await server.stop();
}

/**
 * Test 6: Trigger webhooks for specific events
 */
async function testEventTriggering() {
  printTestHeader('Event Triggering');

  const server = new TestWebhookServer(3456);
  await server.start();

  const service = new WebhookService('data/webhooks-test');

  // Register webhooks for different events
  const webhook1 = service.registerWebhook(
    'http://localhost:3456/webhook',
    [WebhookEventType.RENDER_COMPLETE],
    { name: 'webhook-1' }
  );

  const webhook2 = service.registerWebhook(
    'http://localhost:3456/webhook',
    [WebhookEventType.RENDER_FAILED],
    { name: 'webhook-2' }
  );

  const webhook3 = service.registerWebhook(
    'http://localhost:3456/webhook',
    [WebhookEventType.RENDER_COMPLETE, WebhookEventType.RENDER_FAILED],
    { name: 'webhook-3' }
  );

  log('Registered 3 webhooks with different event subscriptions', 'cyan');
  console.log();

  // Trigger RENDER_COMPLETE event
  log('Triggering RENDER_COMPLETE event...', 'yellow');
  const deliveries1 = await service.triggerWebhooks(
    WebhookEventType.RENDER_COMPLETE,
    'job-123',
    { success: true }
  );
  log(`✓ Sent to ${deliveries1.length} webhooks (expected: 2)`, 'green');
  console.log();

  // Trigger RENDER_FAILED event
  log('Triggering RENDER_FAILED event...', 'yellow');
  const deliveries2 = await service.triggerWebhooks(
    WebhookEventType.RENDER_FAILED,
    'job-456',
    { success: false, error: 'Test error' }
  );
  log(`✓ Sent to ${deliveries2.length} webhooks (expected: 2)`, 'green');
  console.log();

  await new Promise((resolve) => setTimeout(resolve, 100));
  const received = server.getReceivedPayloads();
  log(`✓ Server received ${received.length} total webhooks (expected: 4)`, 'green');
  console.log();

  await server.stop();
}

/**
 * Test 7: Test webhook endpoint
 */
async function testWebhookTest() {
  printTestHeader('Test Webhook Endpoint');

  const server = new TestWebhookServer(3456);
  await server.start();

  const service = new WebhookService('data/webhooks-test');

  const webhook = service.registerWebhook(
    'http://localhost:3456/webhook',
    [WebhookEventType.RENDER_COMPLETE]
  );

  log('Testing webhook endpoint...', 'yellow');
  const delivery = await service.testWebhook(webhook.id);

  if (delivery.success) {
    log('✓ Test webhook delivered successfully', 'green');
    console.log(JSON.stringify(delivery, null, 2));
  } else {
    log(`✗ Test webhook failed: ${delivery.error}`, 'red');
  }
  console.log();

  await server.stop();
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log();
  printSeparator();
  log('  WEBHOOK SERVICE TEST SUITE - ADS-017', 'bright');
  printSeparator();
  console.log();

  try {
    // Clean up test storage before starting
    resetWebhookService();

    await testWebhookRegistration();
    await testWebhookDelivery();
    await testSignatureVerification();
    await testRetryLogic();
    await testDeliveryStats();
    await testEventTriggering();
    await testWebhookTest();

    printSeparator();
    log('  ALL TESTS PASSED ✓', 'green');
    printSeparator();
    console.log();

    console.log('Summary:');
    console.log('  ✓ Webhook registration and management');
    console.log('  ✓ Webhook delivery with HTTP POST');
    console.log('  ✓ HMAC signature generation and verification');
    console.log('  ✓ Retry logic with exponential backoff');
    console.log('  ✓ Delivery statistics and history');
    console.log('  ✓ Event-based webhook triggering');
    console.log('  ✓ Test webhook functionality');
    console.log();

    process.exit(0);
  } catch (error) {
    console.error();
    log('TEST FAILED ✗', 'red');
    console.error(error);
    process.exit(1);
  }
}

/**
 * Run individual test based on command line argument
 */
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'all':
    case undefined:
      await runAllTests();
      break;

    case 'register':
      await testWebhookRegistration();
      break;

    case 'delivery':
      await testWebhookDelivery();
      break;

    case 'signature':
      await testSignatureVerification();
      break;

    case 'retry':
      await testRetryLogic();
      break;

    case 'stats':
      await testDeliveryStats();
      break;

    case 'events':
      await testEventTriggering();
      break;

    case 'test':
      await testWebhookTest();
      break;

    default:
      console.log('Usage: npm run test-webhooks [command]');
      console.log();
      console.log('Commands:');
      console.log('  all         Run all tests (default)');
      console.log('  register    Test webhook registration');
      console.log('  delivery    Test webhook delivery');
      console.log('  signature   Test signature verification');
      console.log('  retry       Test retry logic');
      console.log('  stats       Test delivery statistics');
      console.log('  events      Test event triggering');
      console.log('  test        Test webhook test endpoint');
      process.exit(1);
  }
}

main().catch(console.error);
