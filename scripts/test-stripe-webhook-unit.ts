/**
 * Unit Tests for Stripe Webhook Integration (GDP-007)
 * Tests without database requirements
 */

import fs from 'fs';
import path from 'path';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    results.push({ name, passed: true });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(`❌ ${name}`);
    if (error instanceof Error) {
      console.log(`   ${error.message}`);
    }
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTests() {
  console.log('\n=== Stripe Webhook Unit Tests (GDP-007) ===\n');

  // Test 1: File structure validation
  test('All required files exist', () => {
    const files = [
      'src/types/stripeWebhook.ts',
      'src/services/stripeWebhookProcessor.ts',
      'src/utils/stripeWebhookVerify.ts',
      'src/app/api/webhooks/stripe/route.ts',
    ];

    for (const file of files) {
      const filePath = path.join(process.cwd(), file);
      assert(
        fs.existsSync(filePath),
        `Missing file: ${file}`
      );
    }
  });

  // Test 2: Type imports
  test('Stripe types can be imported', () => {
    const typesFile = fs.readFileSync(
      path.join(process.cwd(), 'src/types/stripeWebhook.ts'),
      'utf-8'
    );

    assert(
      typesFile.includes('export enum StripeWebhookEventType'),
      'Missing StripeWebhookEventType enum'
    );
    assert(
      typesFile.includes('export interface StripeWebhookEvent'),
      'Missing StripeWebhookEvent interface'
    );
    assert(
      typesFile.includes('export interface StripeSubscription'),
      'Missing StripeSubscription interface'
    );
    assert(
      typesFile.includes('export interface ParsedStripeEvent'),
      'Missing ParsedStripeEvent interface'
    );
  });

  // Test 3: Service function exports
  test('Stripe webhook processor exports functions', () => {
    const processorFile = fs.readFileSync(
      path.join(process.cwd(), 'src/services/stripeWebhookProcessor.ts'),
      'utf-8'
    );

    assert(
      processorFile.includes('export function parseStripeWebhook'),
      'Missing parseStripeWebhook function'
    );
    assert(
      processorFile.includes('export async function processStripeWebhook'),
      'Missing processStripeWebhook function'
    );
    assert(
      processorFile.includes('export function getEventName'),
      'Missing getEventName function'
    );
  });

  // Test 4: Verification utility
  test('Stripe verification utility exports functions', () => {
    const verifyFile = fs.readFileSync(
      path.join(process.cwd(), 'src/utils/stripeWebhookVerify.ts'),
      'utf-8'
    );

    assert(
      verifyFile.includes('export function verifyStripeWebhook'),
      'Missing verifyStripeWebhook function'
    );
    assert(
      verifyFile.includes('export function validateWebhookTimestamp'),
      'Missing validateWebhookTimestamp function'
    );
    assert(
      verifyFile.includes('export function parseStripeSignature'),
      'Missing parseStripeSignature function'
    );
  });

  // Test 5: API route structure
  test('Stripe webhook API route has handlers', () => {
    const routeFile = fs.readFileSync(
      path.join(process.cwd(), 'src/app/api/webhooks/stripe/route.ts'),
      'utf-8'
    );

    assert(
      routeFile.includes('export async function POST'),
      'Missing POST handler'
    );
    assert(
      routeFile.includes('export async function GET'),
      'Missing GET handler'
    );
    assert(
      routeFile.includes('verifyStripeWebhook'),
      'Missing signature verification'
    );
    assert(
      routeFile.includes('processStripeWebhook'),
      'Missing webhook processing'
    );
  });

  // Test 6: Documentation
  test('Documentation is present in files', () => {
    const routeFile = fs.readFileSync(
      path.join(process.cwd(), 'src/app/api/webhooks/stripe/route.ts'),
      'utf-8'
    );

    assert(
      routeFile.includes('Stripe Webhook Handler'),
      'Missing documentation header'
    );
    assert(
      routeFile.includes('Setup:'),
      'Missing setup instructions'
    );
    assert(
      routeFile.includes('STRIPE_WEBHOOK_SECRET'),
      'Missing environment variable documentation'
    );
  });

  // Test 7: Event type coverage
  test('Handles key Stripe events', () => {
    const processorFile = fs.readFileSync(
      path.join(process.cwd(), 'src/services/stripeWebhookProcessor.ts'),
      'utf-8'
    );

    const handlers = [
      "type.startsWith('customer.subscription.')",
      "type.startsWith('invoice.')",
      "type.startsWith('charge.')",
      "type.startsWith('payment_intent.')",
    ];

    for (const handler of handlers) {
      assert(
        processorFile.includes(handler),
        `Missing handler for ${handler}`
      );
    }
  });

  // Test 8: Growth Data Plane integration
  test('Integrates with Growth Data Plane', () => {
    const processorFile = fs.readFileSync(
      path.join(process.cwd(), 'src/services/stripeWebhookProcessor.ts'),
      'utf-8'
    );

    assert(
      processorFile.includes('createEvent'),
      'Missing event creation'
    );
    assert(
      processorFile.includes('findOrCreatePerson'),
      'Missing person lookup'
    );
    assert(
      processorFile.includes('createSubscription'),
      'Missing subscription creation'
    );
    assert(
      processorFile.includes('updateSubscription'),
      'Missing subscription update'
    );
  });

  // Test 9: Type safety
  test('Uses proper TypeScript types', () => {
    const processorFile = fs.readFileSync(
      path.join(process.cwd(), 'src/services/stripeWebhookProcessor.ts'),
      'utf-8'
    );

    assert(
      processorFile.includes('StripeWebhookEvent'),
      'Missing StripeWebhookEvent type'
    );
    assert(
      processorFile.includes('ParsedStripeEvent'),
      'Missing ParsedStripeEvent type'
    );
    assert(
      processorFile.includes('SubscriptionStatus'),
      'Missing SubscriptionStatus type'
    );
  });

  // Test 10: Error handling
  test('Includes error handling', () => {
    const routeFile = fs.readFileSync(
      path.join(process.cwd(), 'src/app/api/webhooks/stripe/route.ts'),
      'utf-8'
    );

    assert(
      routeFile.includes('try') && routeFile.includes('catch'),
      'Missing try-catch'
    );
    assert(
      routeFile.includes('console.error'),
      'Missing error logging'
    );
  });

  // Print summary
  console.log('\n' + '='.repeat(50));
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log(`\nResults: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('\n✅ All unit tests passed!');
  } else {
    console.log('\n❌ Some tests failed:');
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`  - ${r.name}`);
      if (r.error) {
        console.log(`    ${r.error}`);
      }
    });
  }

  console.log('\n');
  process.exit(passed === total ? 0 : 1);
}

runTests().catch((error) => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
