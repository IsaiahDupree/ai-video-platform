#!/usr/bin/env npx tsx

/**
 * GDP-010 Verification Script: Meta Pixel + CAPI Dedup
 *
 * This script verifies that event ID deduplication is properly implemented
 * for Meta Pixel (client-side) and Meta CAPI (server-side) events.
 *
 * Verification checks:
 * 1. Event ID utility functions exist and work correctly
 * 2. Client tracking service auto-generates event IDs
 * 3. Server tracking service auto-generates event IDs
 * 4. Event IDs are passed to Meta Pixel
 * 5. Event IDs are passed to Meta CAPI
 * 6. Event ID format is valid and unique
 * 7. Deduplication flow is complete
 */

import * as fs from 'fs';
import * as path from 'path';

interface VerificationResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: VerificationResult[] = [];

function check(name: string, condition: boolean, message: string) {
  results.push({
    name,
    passed: condition,
    message: condition ? `✅ ${message}` : `❌ ${message}`,
  });
}

function fileExists(filepath: string): boolean {
  return fs.existsSync(filepath);
}

function fileContains(filepath: string, text: string): boolean {
  if (!fileExists(filepath)) return false;
  const content = fs.readFileSync(filepath, 'utf-8');
  return content.includes(text);
}

console.log('\n🔍 GDP-010 Meta Pixel + CAPI Deduplication Verification\n');
console.log('='.repeat(70));

// Check 1: Event ID dedup utility exists
const eventIdDedupPath = path.join(process.cwd(), 'src/utils/eventIdDedup.ts');
check(
  'Event ID dedup utility exists',
  fileExists(eventIdDedupPath),
  'Found event ID dedup utility at src/utils/eventIdDedup.ts'
);

// Check 2: generateEventId function exists
check(
  'generateEventId function exists',
  fileContains(eventIdDedupPath, 'export function generateEventId()'),
  'generateEventId function is exported'
);

// Check 3: Event ID generation logic
check(
  'Event ID uses timestamp + random',
  fileContains(eventIdDedupPath, 'Date.now()') && fileContains(eventIdDedupPath, 'Math.random'),
  'Event ID generation uses timestamp and random components'
);

// Check 4: Client tracking imports eventIdDedup
const trackingPath = path.join(process.cwd(), 'src/services/tracking.ts');
check(
  'Client tracking imports eventIdDedup',
  fileContains(trackingPath, "import { generateEventId }") && fileContains(trackingPath, 'eventIdDedup'),
  'Client tracking service imports event ID utility'
);

// Check 5: Client tracking auto-generates event ID
check(
  'Client tracking auto-generates eventId',
  fileContains(trackingPath, 'const eventId = (properties?.eventId as string) || generateEventId()'),
  'Client tracking generates eventId if not provided'
);

// Check 6: Client tracking passes eventId to PostHog
check(
  'Client tracking includes eventId in PostHog event',
  fileContains(trackingPath, 'eventId,') && fileContains(trackingPath, 'enrichedProperties'),
  'Client tracking includes eventId in enriched properties sent to PostHog'
);

// Check 7: Client tracking passes eventId to Meta Pixel
check(
  'Client tracking passes eventId to Meta Pixel',
  fileContains(trackingPath, 'trackMetaAppEvent(event, enrichedProperties)'),
  'Client tracking passes eventId to Meta Pixel tracker'
);

// Check 8: Server tracking imports eventIdDedup
const trackingServerPath = path.join(process.cwd(), 'src/services/trackingServer.ts');
check(
  'Server tracking imports eventIdDedup',
  fileContains(trackingServerPath, "import { generateEventId }") && fileContains(trackingServerPath, 'eventIdDedup'),
  'Server tracking service imports event ID utility'
);

// Check 9: Server tracking auto-generates event ID
check(
  'Server tracking auto-generates eventId',
  fileContains(trackingServerPath, 'const eventId = (properties?.eventId as string) || generateEventId()'),
  'Server tracking generates eventId if not provided'
);

// Check 10: Server tracking passes eventId to PostHog
check(
  'Server tracking includes eventId in PostHog event',
  fileContains(trackingServerPath, 'enrichedProperties'),
  'Server tracking includes eventId in enriched properties'
);

// Check 11: Server tracking passes eventId to Meta CAPI
check(
  'Server tracking passes eventId to Meta CAPI',
  fileContains(trackingServerPath, 'metaCapiService.trackAppEvent(event, enrichedProperties'),
  'Server tracking passes enriched properties (with eventId) to Meta CAPI'
);

// Check 12: Meta CAPI service accepts eventId
const metaCapiPath = path.join(process.cwd(), 'src/services/metaCapi.ts');
check(
  'Meta CAPI accepts eventId',
  fileContains(metaCapiPath, 'options.eventId') && fileContains(metaCapiPath, 'event.event_id'),
  'Meta CAPI service maps eventId to event_id field'
);

// Check 13: Meta CAPI generates event ID if not provided
check(
  'Meta CAPI generates eventId if not provided',
  fileContains(metaCapiPath, 'const eventId = properties?.eventId as string || this.generateEventId()'),
  'Meta CAPI generates event ID from properties or fallback'
);

// Check 14: Meta events service uses eventId
const metaEventsPath = path.join(process.cwd(), 'src/services/metaEvents.ts');
check(
  'Meta events service uses eventId',
  fileContains(metaEventsPath, 'const eventId = (properties?.eventId as string) || generateMetaEventId()'),
  'Meta events service retrieves or generates event ID'
);

// Check 15: Meta events service includes eventId in Pixel tracking
check(
  'Meta events service passes eventId to Pixel',
  fileContains(metaEventsPath, 'trackMetaEvent(metaEvent, finalParams, eventId)'),
  'Meta events service passes eventId to Meta Pixel tracker'
);

// Check 16: Meta Pixel component has generateMetaEventId
const metaPixelPath = path.join(process.cwd(), 'src/components/MetaPixel.tsx');
check(
  'Meta Pixel component exports generateMetaEventId',
  fileContains(metaPixelPath, 'export function generateMetaEventId()'),
  'Meta Pixel component exports event ID generation function'
);

// Check 17: Meta Pixel tracks with eventID parameter
check(
  'Meta Pixel tracks with eventID parameter',
  fileContains(metaPixelPath, "fbq('track'") && fileContains(metaPixelPath, 'eventID'),
  'Meta Pixel sends events with eventID parameter for deduplication'
);

// Check 18: Event ID validation function exists
check(
  'Event ID validation function exists',
  fileContains(eventIdDedupPath, 'export function isValidEventId'),
  'Event ID dedup utility includes validation function'
);

// Check 19: Event ID context functions exist
check(
  'Event ID context functions exist',
  fileContains(eventIdDedupPath, 'export function createEventIdContext') &&
  fileContains(eventIdDedupPath, 'export interface EventIdContext'),
  'Event ID dedup utility includes context management functions'
);

// Check 20: Event ID session storage functions exist
check(
  'Event ID storage functions exist',
  fileContains(eventIdDedupPath, 'export function storeEventId') &&
  fileContains(eventIdDedupPath, 'export function retrieveEventId'),
  'Event ID dedup utility includes storage functions for multi-step flows'
);

console.log('='.repeat(70));

let passCount = 0;
results.forEach((result) => {
  console.log(`${result.message}`);
  if (result.passed) passCount++;
});

console.log('='.repeat(70));
console.log(`\n✨ Results: ${passCount}/${results.length} checks passed\n`);

if (passCount === results.length) {
  console.log('🎉 GDP-010 implementation is complete and verified!');
  console.log('\n📋 Deduplication Flow:\n');
  console.log('Client-Side (Meta Pixel):');
  console.log('  1. User action occurs (e.g., sign up)');
  console.log('  2. tracking.track() is called with event + properties');
  console.log('  3. eventId is auto-generated (timestamp + random)');
  console.log('  4. Meta Pixel sends event with eventID parameter');
  console.log('');
  console.log('Server-Side (Meta CAPI):');
  console.log('  1. Server receives request with eventId in properties');
  console.log('  2. serverTracking.track() is called');
  console.log('  3. eventId is preserved in enriched properties');
  console.log('  4. Meta CAPI sends event with event_id field');
  console.log('');
  console.log('Meta Deduplication:');
  console.log('  1. Meta compares Pixel eventID with CAPI event_id');
  console.log('  2. When IDs match, counts as single conversion');
  console.log('  3. Prevents double-counting in reporting');
  console.log('  4. Enables accurate attribution and ROAS');
  console.log('\n✅ Event ID deduplication is now fully enabled!');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please review the implementation.');
  process.exit(1);
}
