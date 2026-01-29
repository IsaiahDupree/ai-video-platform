/**
 * Verification script for Meta Event Deduplication
 *
 * Tests that the deduplication logic is correctly implemented
 * without requiring actual Meta credentials.
 *
 * Usage:
 *   npx tsx scripts/verify-meta-event-dedup.ts
 */

import { generateMetaEventId } from '@/components/MetaPixel';
import { getMetaEventMapping } from '@/services/metaEvents';
import { TrackingEvent } from '@/types/tracking';

function verify() {
  console.log('='.repeat(60));
  console.log('Meta Event Deduplication Verification');
  console.log('='.repeat(60));
  console.log();

  let allTestsPassed = true;

  // Test 1: Event ID Generation
  console.log('Test 1: Event ID Generation');
  console.log('-'.repeat(60));

  const eventIds = Array.from({ length: 5 }, () => generateMetaEventId());
  console.log('Generated 5 event IDs:');
  eventIds.forEach((id, i) => {
    console.log(`  ${i + 1}. ${id}`);
  });

  // Verify format (timestamp-random)
  const validFormat = eventIds.every((id) => {
    const parts = id.split('-');
    return parts.length === 2 && !isNaN(Number(parts[0])) && parts[1].length > 0;
  });

  // Verify uniqueness
  const uniqueIds = new Set(eventIds);
  const allUnique = uniqueIds.size === eventIds.length;

  if (validFormat && allUnique) {
    console.log('✅ PASS: Event IDs have valid format and are unique');
  } else {
    console.error('❌ FAIL: Event ID generation issues');
    allTestsPassed = false;
  }
  console.log();

  // Test 2: Event Mappings Exist
  console.log('Test 2: Event Mappings');
  console.log('-'.repeat(60));

  const criticalEvents: TrackingEvent[] = [
    'signup_completed',
    'video_rendered',
    'purchase_completed',
    'checkout_started',
    'first_render_completed',
  ];

  let allMappingsExist = true;
  console.log('Critical event mappings:');
  criticalEvents.forEach((event) => {
    const mapping = getMetaEventMapping(event);
    if (mapping) {
      console.log(`  ✓ ${event} → ${mapping.metaEvent}`);
    } else {
      console.log(`  ✗ ${event} → MISSING`);
      allMappingsExist = false;
    }
  });

  if (allMappingsExist) {
    console.log('✅ PASS: All critical event mappings exist');
  } else {
    console.error('❌ FAIL: Some event mappings are missing');
    allTestsPassed = false;
  }
  console.log();

  // Test 3: Check Implementation Files
  console.log('Test 3: Implementation Files');
  console.log('-'.repeat(60));

  const fs = require('fs');
  const path = require('path');

  const requiredFiles = [
    'src/components/MetaPixel.tsx',
    'src/services/metaEvents.ts',
    'src/services/metaCapi.ts',
    'docs/META-005-EVENT-DEDUPLICATION.md',
  ];

  let allFilesExist = true;
  console.log('Checking required files:');
  requiredFiles.forEach((file) => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✓ ${file}`);
    } else {
      console.log(`  ✗ ${file} - MISSING`);
      allFilesExist = false;
    }
  });

  if (allFilesExist) {
    console.log('✅ PASS: All required files exist');
  } else {
    console.error('❌ FAIL: Some required files are missing');
    allTestsPassed = false;
  }
  console.log();

  // Test 4: Check MetaPixel Implementation
  console.log('Test 4: MetaPixel Event ID Support');
  console.log('-'.repeat(60));

  const metaPixelContent = fs.readFileSync(
    path.join(process.cwd(), 'src/components/MetaPixel.tsx'),
    'utf-8'
  );

  const hasEventIdParam = metaPixelContent.includes('eventId?:');
  const hasEventIdInCall = metaPixelContent.includes('eventID');
  const hasGenerateFunction = metaPixelContent.includes('generateMetaEventId');

  console.log('Checking MetaPixel.tsx:');
  console.log(`  ${hasEventIdParam ? '✓' : '✗'} trackMetaEvent accepts eventId parameter`);
  console.log(`  ${hasEventIdInCall ? '✓' : '✗'} Passes eventID to fbq() call`);
  console.log(`  ${hasGenerateFunction ? '✓' : '✗'} Has generateMetaEventId() function`);

  if (hasEventIdParam && hasEventIdInCall && hasGenerateFunction) {
    console.log('✅ PASS: MetaPixel supports event IDs');
  } else {
    console.error('❌ FAIL: MetaPixel missing event ID support');
    allTestsPassed = false;
  }
  console.log();

  // Test 5: Check metaEvents Implementation
  console.log('Test 5: metaEvents Deduplication');
  console.log('-'.repeat(60));

  const metaEventsContent = fs.readFileSync(
    path.join(process.cwd(), 'src/services/metaEvents.ts'),
    'utf-8'
  );

  const importsGenerateId = metaEventsContent.includes('generateMetaEventId');
  const generatesEventId = metaEventsContent.includes('generateMetaEventId()');
  const passesEventId = metaEventsContent.includes('trackMetaEvent(metaEvent, finalParams, eventId)');

  console.log('Checking metaEvents.ts:');
  console.log(`  ${importsGenerateId ? '✓' : '✗'} Imports generateMetaEventId`);
  console.log(`  ${generatesEventId ? '✓' : '✗'} Generates event IDs`);
  console.log(`  ${passesEventId ? '✓' : '✗'} Passes event IDs to trackMetaEvent`);

  if (importsGenerateId && generatesEventId && passesEventId) {
    console.log('✅ PASS: metaEvents implements deduplication');
  } else {
    console.error('❌ FAIL: metaEvents missing deduplication logic');
    allTestsPassed = false;
  }
  console.log();

  // Summary
  console.log('='.repeat(60));
  console.log('Verification Summary');
  console.log('='.repeat(60));

  if (allTestsPassed) {
    console.log('✅ ALL TESTS PASSED');
    console.log();
    console.log('Event deduplication is correctly implemented!');
    console.log();
    console.log('Next steps:');
    console.log('1. Set up Meta Pixel ID and CAPI credentials in .env.local');
    console.log('2. Run: npx tsx scripts/test-meta-event-dedup.ts');
    console.log('3. Verify deduplication in Meta Events Manager');
    console.log();
    return true;
  } else {
    console.error('❌ SOME TESTS FAILED');
    console.log();
    console.log('Please fix the issues above before proceeding.');
    console.log();
    return false;
  }
}

// Run verification
const success = verify();
process.exit(success ? 0 : 1);
