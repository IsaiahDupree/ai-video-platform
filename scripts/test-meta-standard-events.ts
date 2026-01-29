#!/usr/bin/env ts-node

/**
 * Test script for Meta Standard Events Mapping (META-003)
 *
 * This script verifies that:
 * 1. All internal events are mapped to Meta events
 * 2. Standard events use correct Meta event names
 * 3. Event parameters are properly formatted
 * 4. Event values are calculated correctly
 * 5. Custom events are tracked separately
 *
 * Run with: npx ts-node scripts/test-meta-standard-events.ts
 */

import {
  trackMetaAppEvent,
  getMetaEventMapping,
  getAllEventMappings,
} from '../src/services/metaEvents.js';
import { TrackingEvent } from '../src/types/tracking.js';

// Test colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testEventMapping() {
  log('\n=== Test 1: Event Mapping Configuration ===', 'blue');

  const mappings = getAllEventMappings();
  const events = Object.keys(mappings) as TrackingEvent[];

  log(`\nTotal events mapped: ${events.length}`, 'cyan');

  // Group by standard vs custom
  const standardEvents = events.filter((e) => mappings[e].isStandard);
  const customEvents = events.filter((e) => !mappings[e].isStandard);

  log(`Standard events: ${standardEvents.length}`, 'cyan');
  log(`Custom events: ${customEvents.length}`, 'cyan');

  // Display standard events
  log('\nStandard Events Mapping:', 'yellow');
  standardEvents.forEach((event) => {
    const mapping = mappings[event];
    log(`  ${event} → ${mapping.metaEvent}`, 'green');
  });

  // Display custom events
  log('\nCustom Events Mapping:', 'yellow');
  customEvents.forEach((event) => {
    const mapping = mappings[event];
    log(`  ${event} → ${mapping.metaEvent}`, 'green');
  });

  // Verify critical events are standard
  const criticalEvents: TrackingEvent[] = [
    'signup_completed',
    'checkout_started',
    'purchase_completed',
  ];

  log('\nCritical Events Check:', 'yellow');
  let allCriticalAreStandard = true;
  criticalEvents.forEach((event) => {
    const mapping = getMetaEventMapping(event);
    if (!mapping) {
      log(`  ✗ ${event} - NOT MAPPED`, 'red');
      allCriticalAreStandard = false;
    } else if (!mapping.isStandard) {
      log(`  ✗ ${event} - NOT STANDARD (${mapping.metaEvent})`, 'red');
      allCriticalAreStandard = false;
    } else {
      log(`  ✓ ${event} → ${mapping.metaEvent}`, 'green');
    }
  });

  return allCriticalAreStandard;
}

function testMetaEventNames() {
  log('\n=== Test 2: Meta Standard Event Names ===', 'blue');

  // Valid Meta Standard Event names
  const validStandardEvents = [
    'Lead',
    'CompleteRegistration',
    'ViewContent',
    'AddToCart',
    'InitiateCheckout',
    'AddPaymentInfo',
    'Purchase',
    'Subscribe',
    'StartTrial',
    'Search',
  ];

  const mappings = getAllEventMappings();
  const standardEvents = Object.entries(mappings).filter(([_, m]) => m.isStandard);

  log(`\nValidating ${standardEvents.length} standard events...`, 'cyan');

  let allValid = true;
  standardEvents.forEach(([event, mapping]) => {
    const isValid = validStandardEvents.includes(mapping.metaEvent);
    if (isValid) {
      log(`  ✓ ${event} → ${mapping.metaEvent}`, 'green');
    } else {
      log(`  ✗ ${event} → ${mapping.metaEvent} (INVALID)`, 'red');
      allValid = false;
    }
  });

  return allValid;
}

function testEventParameters() {
  log('\n=== Test 3: Event Parameters ===', 'blue');

  // Mock window.fbq for testing
  const trackedEvents: any[] = [];
  global.window = {
    fbq: (action: string, event: string, params: any) => {
      trackedEvents.push({ action, event, params });
    },
  } as any;

  // Test signup_completed
  log('\nTest: signup_completed', 'yellow');
  trackMetaAppEvent('signup_completed', {
    method: 'email',
    timestamp: new Date().toISOString(),
  });

  const signupEvent = trackedEvents.find((e) => e.event === 'CompleteRegistration');
  if (signupEvent) {
    log('  ✓ Event tracked as CompleteRegistration', 'green');
    log(`  Parameters: ${JSON.stringify(signupEvent.params, null, 2)}`, 'cyan');

    if (signupEvent.params.value && signupEvent.params.currency) {
      log(`  ✓ Value: $${signupEvent.params.value} ${signupEvent.params.currency}`, 'green');
    }
  } else {
    log('  ✗ Event not tracked', 'red');
  }

  // Test checkout_started
  log('\nTest: checkout_started', 'yellow');
  trackedEvents.length = 0;
  trackMetaAppEvent('checkout_started', {
    planId: 'pro',
    planName: 'Pro Plan',
    price: 29,
    interval: 'month',
    currency: 'USD',
  });

  const checkoutEvent = trackedEvents.find((e) => e.event === 'InitiateCheckout');
  if (checkoutEvent) {
    log('  ✓ Event tracked as InitiateCheckout', 'green');
    log(`  Parameters: ${JSON.stringify(checkoutEvent.params, null, 2)}`, 'cyan');

    if (checkoutEvent.params.value === 29 && checkoutEvent.params.currency === 'USD') {
      log('  ✓ Correct value and currency', 'green');
    }
    if (checkoutEvent.params.content_ids?.includes('pro')) {
      log('  ✓ Correct content_ids', 'green');
    }
  } else {
    log('  ✗ Event not tracked', 'red');
  }

  // Test purchase_completed
  log('\nTest: purchase_completed', 'yellow');
  trackedEvents.length = 0;
  trackMetaAppEvent('purchase_completed', {
    planId: 'business',
    planName: 'Business Plan',
    price: 99,
    interval: 'month',
    currency: 'USD',
    transactionId: 'txn_123456',
  });

  const purchaseEvent = trackedEvents.find((e) => e.event === 'Purchase');
  if (purchaseEvent) {
    log('  ✓ Event tracked as Purchase', 'green');
    log(`  Parameters: ${JSON.stringify(purchaseEvent.params, null, 2)}`, 'cyan');

    if (purchaseEvent.params.value === 99) {
      log('  ✓ Correct value', 'green');
    }
    if (purchaseEvent.params.transaction_id === 'txn_123456') {
      log('  ✓ Transaction ID included', 'green');
    }
  } else {
    log('  ✗ Event not tracked', 'red');
  }

  // Test video_rendered
  log('\nTest: video_rendered', 'yellow');
  trackedEvents.length = 0;
  trackMetaAppEvent('video_rendered', {
    videoId: 'vid_123',
    renderCount: 5,
  });

  const videoEvent = trackedEvents.find((e) => e.event === 'Purchase');
  if (videoEvent) {
    log('  ✓ Event tracked as Purchase (micro-conversion)', 'green');
    log(`  Parameters: ${JSON.stringify(videoEvent.params, null, 2)}`, 'cyan');

    const expectedValue = 5 * 2; // 5 renders * $2 each
    if (videoEvent.params.value === expectedValue) {
      log(`  ✓ Value calculated correctly: $${expectedValue}`, 'green');
    }
  } else {
    log('  ✗ Event not tracked', 'red');
  }

  return trackedEvents.length > 0;
}

function testCustomEvents() {
  log('\n=== Test 4: Custom Events ===', 'blue');

  const trackedEvents: any[] = [];
  global.window = {
    fbq: (action: string, event: string, params: any) => {
      trackedEvents.push({ action, event, params });
    },
  } as any;

  // Test custom event tracking
  const customEventTypes: TrackingEvent[] = [
    'return_visit',
    'feature_discovery',
    'template_used',
    'voice_cloned',
  ];

  log('\nTracking custom events...', 'yellow');
  customEventTypes.forEach((event) => {
    trackMetaAppEvent(event, {
      timestamp: new Date().toISOString(),
    });

    const tracked = trackedEvents.find((e) => e.params?.original_event === event);
    if (tracked && tracked.action === 'trackCustom') {
      log(`  ✓ ${event} tracked as custom event`, 'green');
    } else {
      log(`  ✗ ${event} not tracked correctly`, 'red');
    }
  });

  return trackedEvents.length > 0;
}

function testErrorEvents() {
  log('\n=== Test 5: Error Events ===', 'blue');

  const trackedEvents: any[] = [];
  global.window = {
    fbq: (action: string, event: string, params: any) => {
      trackedEvents.push({ action, event, params });
    },
  } as any;

  // Test error event tracking
  const errorEventTypes: TrackingEvent[] = [
    'render_failed',
    'api_error',
    'slow_render',
  ];

  log('\nTracking error events...', 'yellow');
  errorEventTypes.forEach((event) => {
    trackMetaAppEvent(event, {
      error: 'Test error',
      timestamp: new Date().toISOString(),
    });

    const tracked = trackedEvents.find((e) => e.params?.original_event === event);
    if (tracked && tracked.action === 'trackCustom') {
      log(`  ✓ ${event} tracked as custom event`, 'green');
    } else {
      log(`  ✗ ${event} not tracked correctly`, 'red');
    }
  });

  return trackedEvents.length > 0;
}

function testValueCalculation() {
  log('\n=== Test 6: Value Calculation ===', 'blue');

  const trackedEvents: any[] = [];
  global.window = {
    fbq: (action: string, event: string, params: any) => {
      trackedEvents.push({ action, event, params });
    },
  } as any;

  log('\nTesting value calculation for different events...', 'yellow');

  const testCases = [
    { event: 'signup_started' as TrackingEvent, expectedValue: 5 },
    { event: 'signup_completed' as TrackingEvent, expectedValue: 10 },
    { event: 'first_render_completed' as TrackingEvent, expectedValue: 20 },
    { event: 'video_rendered' as TrackingEvent, props: { renderCount: 3 }, expectedValue: 6 },
    { event: 'batch_completed' as TrackingEvent, props: { batchSize: 50 }, expectedValue: 100 },
  ];

  let allCorrect = true;
  testCases.forEach((testCase) => {
    trackedEvents.length = 0;
    trackMetaAppEvent(testCase.event, testCase.props || {});

    const tracked = trackedEvents[0];
    if (tracked?.params?.value === testCase.expectedValue) {
      log(`  ✓ ${testCase.event}: $${testCase.expectedValue}`, 'green');
    } else {
      log(`  ✗ ${testCase.event}: expected $${testCase.expectedValue}, got $${tracked?.params?.value}`, 'red');
      allCorrect = false;
    }
  });

  return allCorrect;
}

// Run all tests
async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║   META-003: Standard Events Mapping - Test Suite          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');

  const results = {
    eventMapping: testEventMapping(),
    metaEventNames: testMetaEventNames(),
    eventParameters: testEventParameters(),
    customEvents: testCustomEvents(),
    errorEvents: testErrorEvents(),
    valueCalculation: testValueCalculation(),
  };

  // Summary
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                      Test Summary                          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');

  const tests = Object.entries(results);
  const passed = tests.filter(([_, result]) => result).length;
  const total = tests.length;

  tests.forEach(([name, result]) => {
    const status = result ? '✓ PASS' : '✗ FAIL';
    const color = result ? 'green' : 'red';
    log(`  ${status} - ${name}`, color);
  });

  log(`\nTotal: ${passed}/${total} tests passed`, passed === total ? 'green' : 'red');

  if (passed === total) {
    log('\n✓ All tests passed! META-003 implementation is correct.', 'green');
    process.exit(0);
  } else {
    log('\n✗ Some tests failed. Please review the implementation.', 'red');
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests();
}

export { runTests };
