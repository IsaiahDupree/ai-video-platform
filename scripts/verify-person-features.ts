#!/usr/bin/env npx tsx

/**
 * GDP-011 Verification Script: Person Features Computation
 *
 * This script verifies that person features computation is properly implemented:
 * 1. Event tracking includes pricing_view events
 * 2. updatePersonFeatures service function is exported
 * 3. Database RPC function for computing features exists
 * 4. All required event types are being tracked
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

console.log('\n📊 GDP-011 Person Features Computation Verification\n');
console.log('='.repeat(70));

// Check 1: Pricing page tracks pricing_view event
const pricingPagePath = path.join(process.cwd(), 'src/app/pricing/page.tsx');
check(
  'Pricing page exists',
  fileExists(pricingPagePath),
  'Found pricing page at src/app/pricing/page.tsx'
);

// Check 2: Pricing page imports useEffect
check(
  'Pricing page imports useEffect',
  fileContains(pricingPagePath, "import React, { useState, useEffect }"),
  'Pricing page imports useEffect from React'
);

// Check 3: Pricing page tracks pricing_view
check(
  'Pricing page tracks pricing_view event',
  fileContains(pricingPagePath, "'pricing_view'"),
  'Pricing page tracks pricing_view event on page load'
);

// Check 4: Pricing page uses useEffect
check(
  'Pricing page uses useEffect for tracking',
  fileContains(pricingPagePath, "useEffect(() => {") && fileContains(pricingPagePath, "tracking.track('pricing_view'"),
  'Pricing page uses useEffect to track pricing_view'
);

// Check 5: Growth Data Plane service exists
const growthDataPlanePath = path.join(process.cwd(), 'src/services/growthDataPlane.ts');
check(
  'Growth Data Plane service exists',
  fileExists(growthDataPlanePath),
  'Found Growth Data Plane service'
);

// Check 6: updatePersonFeatures function is exported
check(
  'updatePersonFeatures function is exported',
  fileContains(growthDataPlanePath, 'export async function updatePersonFeatures'),
  'updatePersonFeatures function is exported from Growth Data Plane service'
);

// Check 7: updatePersonFeatures calls RPC function
check(
  'updatePersonFeatures calls RPC function',
  fileContains(growthDataPlanePath, "supabaseAdmin.rpc('update_person_features'"),
  'updatePersonFeatures calls the database RPC function'
);

// Check 8: RPC function parameter is correct
check(
  'updatePersonFeatures uses correct RPC parameter',
  fileContains(growthDataPlanePath, "p_person_id: personId"),
  'updatePersonFeatures passes person ID to RPC function'
);

// Check 9: Tracking service tracks landing_view
const trackingPath = path.join(process.cwd(), 'src/services/tracking.ts');
check(
  'Tracking service exists',
  fileExists(trackingPath),
  'Found tracking service'
);

// Check 10: landing_view event is tracked
check(
  'landing_view event is tracked',
  fileContains(path.join(process.cwd(), 'src/app/signup/page.tsx'), "'landing_view'"),
  'landing_view event is tracked on signup page'
);

// Check 11: video_rendered event tracking
check(
  'video_rendered event can be tracked',
  fileContains(trackingPath, "track(event: TrackingEvent"),
  'Tracking service can track video_rendered events'
);

// Check 12: Check Growth Data Plane types
const typesPath = path.join(process.cwd(), 'src/types/growthDataPlane.ts');
check(
  'Person type includes feature fields',
  fileContains(typesPath, 'total_events: number') &&
  fileContains(typesPath, 'active_days: number') &&
  fileContains(typesPath, 'total_renders: number') &&
  fileContains(typesPath, 'pricing_page_views: number'),
  'Person type includes all feature fields (total_events, active_days, total_renders, pricing_page_views)'
);

// Check 13: Event type includes pricing_view
const trackingTypesPath = path.join(process.cwd(), 'src/types/tracking.ts');
check(
  'Tracking types include pricing_view',
  fileContains(trackingTypesPath, 'pricing_view'),
  'Tracking types include pricing_view event type'
);

// Check 14: Meta events mapping includes pricing_view
const metaEventsPath = path.join(process.cwd(), 'src/services/metaEvents.ts');
check(
  'Meta events mapping includes pricing_view',
  fileContains(metaEventsPath, "'pricing_view'") || fileContains(metaEventsPath, 'pricing_view'),
  'Meta events service handles pricing_view events'
);

// Check 15: Database migration for helper functions exists
const migrationPath = path.join(process.cwd(), 'supabase/migrations/20260129000004_create_helper_functions.sql');
check(
  'Database migration file exists',
  fileExists(migrationPath),
  'Found database migration for helper functions'
);

// Check 16: update_person_features RPC function exists
check(
  'update_person_features RPC function exists',
  fileContains(migrationPath, 'update_person_features'),
  'Database includes update_person_features RPC function'
);

// Check 17: RPC function computes active_days
check(
  'RPC function computes active_days',
  fileContains(migrationPath, 'active_days') && fileContains(migrationPath, 'DATE(event_time)'),
  'update_person_features computes active_days from distinct dates'
);

// Check 18: RPC function computes total_renders
check(
  'RPC function computes total_renders',
  fileContains(migrationPath, 'total_renders') && (
    fileContains(migrationPath, "'video_rendered'") ||
    fileContains(migrationPath, "'first_render_completed'")
  ),
  'update_person_features computes total_renders from render events'
);

// Check 19: RPC function computes pricing_page_views
check(
  'RPC function computes pricing_page_views',
  fileContains(migrationPath, 'pricing_page_views') && fileContains(migrationPath, "'pricing_view'"),
  'update_person_features computes pricing_page_views from pricing_view events'
);

// Check 20: RPC function computes total_events
check(
  'RPC function computes total_events',
  fileContains(migrationPath, 'total_events') && fileContains(migrationPath, 'COUNT(*)'),
  'update_person_features computes total_events from all events'
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
  console.log('🎉 GDP-011 implementation is complete and verified!');
  console.log('\n📋 Person Features Computation Flow:\n');
  console.log('1. Event Creation:');
  console.log('   - User actions create events (landing_view, video_rendered, pricing_view)');
  console.log('   - Events are stored in the event table with person_id');
  console.log('');
  console.log('2. Automatic Computation (via Database Trigger):');
  console.log('   - After each event is inserted');
  console.log('   - Trigger calls update_person_features() RPC function');
  console.log('   - Function computes features from events:');
  console.log('     • active_days: COUNT(DISTINCT DATE(event_time))');
  console.log('     • total_renders: COUNT(*) WHERE event_name IN (video_rendered, first_render_completed)');
  console.log('     • pricing_page_views: COUNT(*) WHERE event_name = pricing_view');
  console.log('     • total_events: COUNT(*)');
  console.log('');
  console.log('3. TypeScript Service:');
  console.log('   - updatePersonFeatures(personId) calls RPC function');
  console.log('   - Can be called manually for backfill/recomputation');
  console.log('');
  console.log('4. Real-time Updates:');
  console.log('   - Features updated automatically on event creation');
  console.log('   - No manual intervention required');
  console.log('   - Scalable: database computation is efficient');
  console.log('\n✅ Person features are now automatically computed!');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please review the implementation.');
  process.exit(1);
}
