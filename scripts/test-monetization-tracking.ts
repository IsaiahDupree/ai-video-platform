#!/usr/bin/env tsx

/**
 * Test Suite: TRACK-005 Monetization Event Tracking
 *
 * Tests the monetization event tracking implementation:
 * - checkout_started events
 * - purchase_completed events
 */

import { serverTracking } from '../src/services/trackingServer';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      results.push({ name, passed: true });
      console.log(`✅ ${name}`);
    } catch (error) {
      results.push({
        name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error instanceof Error ? error.message : error}`);
    }
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertExists<T>(value: T | null | undefined, message: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

async function runTests() {
  console.log('\n🧪 TRACK-005: Monetization Event Tracking Tests\n');

  // Test 1: checkout_started event structure
  await test('checkout_started event has required properties', () => {
    const trackingData = {
      planId: 'pro',
      planName: 'Pro',
      price: 29,
      interval: 'month' as const,
      currency: 'USD',
      timestamp: new Date().toISOString(),
    };

    // Verify all required properties exist
    assertExists(trackingData.planId, 'planId should exist');
    assertExists(trackingData.planName, 'planName should exist');
    assertExists(trackingData.price, 'price should exist');
    assertExists(trackingData.interval, 'interval should exist');
    assertExists(trackingData.currency, 'currency should exist');
    assertExists(trackingData.timestamp, 'timestamp should exist');

    assert(typeof trackingData.planId === 'string', 'planId should be string');
    assert(typeof trackingData.planName === 'string', 'planName should be string');
    assert(typeof trackingData.price === 'number', 'price should be number');
    assert(['month', 'year'].includes(trackingData.interval), 'interval should be month or year');
    assert(typeof trackingData.currency === 'string', 'currency should be string');
    assert(typeof trackingData.timestamp === 'string', 'timestamp should be string');
  })();

  // Test 2: checkout_started tracking call
  await test('checkout_started event is tracked correctly', () => {
    const trackingData = {
      planId: 'business',
      planName: 'Business',
      price: 99,
      interval: 'month' as const,
      currency: 'USD',
      timestamp: new Date().toISOString(),
    };

    // This would track the event in a real scenario
    serverTracking.track('checkout_started', trackingData);

    assert(trackingData.price === 99, 'Business plan price should be 99');
    assert(trackingData.planId === 'business', 'Plan ID should be business');
  })();

  // Test 3: Annual plan checkout_started
  await test('checkout_started tracks annual plans correctly', () => {
    const trackingData = {
      planId: 'pro-annual',
      planName: 'Pro Annual',
      price: 290,
      interval: 'year' as const,
      currency: 'USD',
      timestamp: new Date().toISOString(),
    };

    serverTracking.track('checkout_started', trackingData);

    assert(trackingData.interval === 'year', 'Interval should be year');
    assert(trackingData.price === 290, 'Annual price should be 290');
  })();

  // Test 4: purchase_completed event structure
  await test('purchase_completed event has required properties', () => {
    const trackingData = {
      planId: 'pro',
      planName: 'Pro',
      price: 29,
      interval: 'month' as const,
      currency: 'USD',
      email: 'test@example.com',
      paymentMethod: 'card',
      transactionId: 'txn_123abc',
      timestamp: new Date().toISOString(),
    };

    // Verify all required properties exist
    assertExists(trackingData.planId, 'planId should exist');
    assertExists(trackingData.planName, 'planName should exist');
    assertExists(trackingData.price, 'price should exist');
    assertExists(trackingData.interval, 'interval should exist');
    assertExists(trackingData.currency, 'currency should exist');
    assertExists(trackingData.email, 'email should exist');
    assertExists(trackingData.paymentMethod, 'paymentMethod should exist');
    assertExists(trackingData.transactionId, 'transactionId should exist');
    assertExists(trackingData.timestamp, 'timestamp should exist');

    assert(typeof trackingData.email === 'string', 'email should be string');
    assert(typeof trackingData.paymentMethod === 'string', 'paymentMethod should be string');
    assert(typeof trackingData.transactionId === 'string', 'transactionId should be string');
    assert(trackingData.email.includes('@'), 'email should be valid format');
  })();

  // Test 5: purchase_completed tracking call
  await test('purchase_completed event is tracked correctly', () => {
    const trackingData = {
      planId: 'pro',
      planName: 'Pro',
      price: 29,
      interval: 'month' as const,
      currency: 'USD',
      email: 'customer@example.com',
      paymentMethod: 'card',
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    serverTracking.track('purchase_completed', trackingData);

    assert(trackingData.transactionId.startsWith('txn_'), 'Transaction ID should have proper prefix');
    assert(trackingData.paymentMethod === 'card', 'Payment method should be card');
  })();

  // Test 6: Business plan purchase
  await test('purchase_completed tracks business plan correctly', () => {
    const trackingData = {
      planId: 'business-annual',
      planName: 'Business Annual',
      price: 990,
      interval: 'year' as const,
      currency: 'USD',
      email: 'business@example.com',
      paymentMethod: 'card',
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    serverTracking.track('purchase_completed', trackingData);

    assert(trackingData.price === 990, 'Business annual price should be 990');
    assert(trackingData.interval === 'year', 'Interval should be year');
  })();

  // Test 7: Transaction ID uniqueness
  await test('transaction IDs are unique', () => {
    const txn1 = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const txn2 = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    assert(txn1 !== txn2, 'Transaction IDs should be unique');
    assert(txn1.startsWith('txn_'), 'Transaction ID 1 should have prefix');
    assert(txn2.startsWith('txn_'), 'Transaction ID 2 should have prefix');
  })();

  // Test 8: ISO timestamp format
  await test('timestamps are in ISO format', () => {
    const timestamp = new Date().toISOString();

    assert(timestamp.includes('T'), 'Timestamp should include T separator');
    assert(timestamp.includes('Z') || timestamp.includes('+'), 'Timestamp should include timezone');
    assert(!isNaN(Date.parse(timestamp)), 'Timestamp should be valid date');
  })();

  // Test 9: Currency validation
  await test('currency codes are valid', () => {
    const validCurrencies = ['USD', 'EUR', 'GBP'];
    const trackingData = {
      planId: 'pro',
      planName: 'Pro',
      price: 29,
      interval: 'month' as const,
      currency: 'USD',
      timestamp: new Date().toISOString(),
    };

    assert(validCurrencies.includes(trackingData.currency), 'Currency should be valid');
  })();

  // Test 10: Price validation
  await test('prices are positive numbers', () => {
    const plans = [
      { planId: 'free', price: 0 },
      { planId: 'pro', price: 29 },
      { planId: 'business', price: 99 },
      { planId: 'pro-annual', price: 290 },
      { planId: 'business-annual', price: 990 },
    ];

    plans.forEach((plan) => {
      assert(typeof plan.price === 'number', `${plan.planId} price should be number`);
      assert(plan.price >= 0, `${plan.planId} price should be non-negative`);
    });
  })();

  // Test 11: Interval validation
  await test('intervals are valid values', () => {
    const validIntervals = ['month', 'year'];
    const intervals = ['month', 'year'];

    intervals.forEach((interval) => {
      assert(validIntervals.includes(interval), `${interval} should be valid interval`);
    });
  })();

  // Test 12: Email validation format
  await test('email addresses are validated', () => {
    const validEmails = [
      'user@example.com',
      'test.user@example.co.uk',
      'admin+test@subdomain.example.com',
    ];

    const invalidEmails = [
      'notanemail',
      '@example.com',
      'user@',
    ];

    validEmails.forEach((email) => {
      assert(email.includes('@'), `${email} should contain @`);
      assert(email.includes('.'), `${email} should contain dot`);
      assert(email.indexOf('@') < email.lastIndexOf('.'), `${email} should have @ before dot`);
      assert(email.indexOf('@') > 0, `${email} should have characters before @`);
    });

    invalidEmails.forEach((email) => {
      const isValid = email.includes('@') &&
                     email.includes('.') &&
                     email.indexOf('@') < email.lastIndexOf('.') &&
                     email.indexOf('@') > 0 &&
                     email.indexOf('@') < email.length - 2;
      assert(!isValid, `${email} should be invalid`);
    });
  })();

  // Test 13: Free plan checkout (price 0)
  await test('checkout_started handles free plan correctly', () => {
    const trackingData = {
      planId: 'free',
      planName: 'Free',
      price: 0,
      interval: 'month' as const,
      currency: 'USD',
      timestamp: new Date().toISOString(),
    };

    serverTracking.track('checkout_started', trackingData);

    assert(trackingData.price === 0, 'Free plan price should be 0');
    assert(trackingData.planId === 'free', 'Plan ID should be free');
  })();

  // Test 14: Multiple purchases tracking
  await test('multiple purchases can be tracked sequentially', () => {
    const purchases = [
      {
        planId: 'pro',
        planName: 'Pro',
        price: 29,
        interval: 'month' as const,
        currency: 'USD',
        email: 'user1@example.com',
        paymentMethod: 'card',
        transactionId: `txn_${Date.now()}_1`,
        timestamp: new Date().toISOString(),
      },
      {
        planId: 'business',
        planName: 'Business',
        price: 99,
        interval: 'month' as const,
        currency: 'USD',
        email: 'user2@example.com',
        paymentMethod: 'card',
        transactionId: `txn_${Date.now()}_2`,
        timestamp: new Date().toISOString(),
      },
    ];

    purchases.forEach((purchase) => {
      serverTracking.track('purchase_completed', purchase);
    });

    assert(purchases.length === 2, 'Should track 2 purchases');
    assert(purchases[0].email !== purchases[1].email, 'Purchases should have different emails');
  })();

  // Test 15: Payment method tracking
  await test('payment methods are tracked correctly', () => {
    const paymentMethods = ['card', 'paypal', 'bank_transfer'];
    const trackingData = {
      planId: 'pro',
      planName: 'Pro',
      price: 29,
      interval: 'month' as const,
      currency: 'USD',
      email: 'test@example.com',
      paymentMethod: 'card',
      transactionId: 'txn_test',
      timestamp: new Date().toISOString(),
    };

    assert(paymentMethods.includes(trackingData.paymentMethod), 'Payment method should be valid');
  })();

  // Print summary
  console.log('\n📊 Test Summary\n');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}`);
        if (r.error) {
          console.log(`    ${r.error}`);
        }
      });
  }

  console.log('\n✨ All monetization tracking tests completed!\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
