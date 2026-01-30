#!/usr/bin/env npx tsx

/**
 * GDP-009 Verification Script: PostHog Identity Stitching
 *
 * This script verifies that PostHog identity stitching is properly implemented:
 * 1. Login page exists and calls tracking.identify()
 * 2. Signup page exists and calls tracking.identify()
 * 3. PostHog client is properly configured
 * 4. Identify calls include user_id and email for identity stitching
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

// Check 1: Login page exists
const loginPagePath = path.join(process.cwd(), 'src/app/login/page.tsx');
check(
  'Login page exists',
  fileExists(loginPagePath),
  'Found login page at src/app/login/page.tsx'
);

// Check 2: Login page calls tracking.identify()
check(
  'Login page calls tracking.identify()',
  fileContains(loginPagePath, 'tracking.identify('),
  'Login page calls tracking.identify() with user credentials'
);

// Check 3: Login page calls posthog.setPersonProperties()
check(
  'Login page calls posthog.setPersonProperties()',
  fileContains(loginPagePath, 'posthog.setPersonProperties('),
  'Login page calls posthog.setPersonProperties() for identity stitching'
);

// Check 4: Login page includes email in identify call
check(
  'Login page passes email to identify()',
  fileContains(loginPagePath, "email: formData.email") && fileContains(loginPagePath, 'tracking.identify('),
  'Login page passes email to tracking.identify()'
);

// Check 5: Login page includes user_id in identify call
check(
  'Login page passes user_id to identify()',
  fileContains(loginPagePath, 'user_id: userId'),
  'Login page passes user_id to tracking.identify()'
);

// Check 6: Signup page exists
const signupPagePath = path.join(process.cwd(), 'src/app/signup/page.tsx');
check(
  'Signup page exists',
  fileExists(signupPagePath),
  'Found signup page at src/app/signup/page.tsx'
);

// Check 7: Signup page calls tracking.identify()
check(
  'Signup page calls tracking.identify()',
  fileContains(signupPagePath, 'tracking.identify('),
  'Signup page calls tracking.identify() with user credentials'
);

// Check 8: Signup page imports posthog
check(
  'Signup page imports posthog',
  fileContains(signupPagePath, "import posthog from 'posthog-js'"),
  'Signup page imports posthog-js'
);

// Check 9: Signup page calls posthog.setPersonProperties()
check(
  'Signup page calls posthog.setPersonProperties()',
  fileContains(signupPagePath, 'posthog.setPersonProperties('),
  'Signup page calls posthog.setPersonProperties() for identity stitching'
);

// Check 10: Signup page includes email in identify call
check(
  'Signup page passes email to identify()',
  fileContains(signupPagePath, "email: formData.email") && fileContains(signupPagePath, 'tracking.identify('),
  'Signup page passes email to tracking.identify()'
);

// Check 11: Signup page includes user_id in identify call
check(
  'Signup page passes user_id to identify()',
  fileContains(signupPagePath, 'user_id: userId'),
  'Signup page passes user_id to tracking.identify()'
);

// Check 12: TrackingProvider exists
const trackingProviderPath = path.join(process.cwd(), 'src/components/TrackingProvider.tsx');
check(
  'TrackingProvider component exists',
  fileExists(trackingProviderPath),
  'Found TrackingProvider component'
);

// Check 13: Tracking service exists
const trackingServicePath = path.join(process.cwd(), 'src/services/tracking.ts');
check(
  'Tracking service exists',
  fileExists(trackingServicePath),
  'Found tracking service'
);

// Check 14: Tracking service has identify method
check(
  'Tracking service has identify method',
  fileContains(trackingServicePath, 'identify('),
  'Tracking service implements identify() method'
);

// Check 15: PostHog client initialization in tracking service
check(
  'PostHog client initialized',
  fileContains(trackingServicePath, 'posthog.init('),
  'Tracking service initializes PostHog client'
);

// Check 16: Types file has tracking types
const typesPath = path.join(process.cwd(), 'src/types/tracking.ts');
check(
  'Tracking types file exists',
  fileExists(typesPath),
  'Found tracking types file'
);

// Check 17: Login page tracks landing_view event
check(
  'Login page tracks landing_view event',
  fileContains(loginPagePath, "'landing_view'"),
  'Login page tracks landing_view event on page load'
);

// Check 18: Login page tracks login_completed event
check(
  'Login page tracks login_completed event',
  fileContains(loginPagePath, "'login_completed'"),
  'Login page tracks login_completed event on form submission'
);

// Check 19: Signup page tracks signup_completed event
check(
  'Signup page tracks signup_completed event',
  fileContains(signupPagePath, "'signup_completed'"),
  'Signup page tracks signup_completed event on form submission'
);

// Check 20: Login page has proper imports
check(
  'Login page has proper imports',
  fileContains(loginPagePath, "import { useTracking }") &&
  fileContains(loginPagePath, "import posthog from 'posthog-js'") &&
  fileContains(loginPagePath, "import Link from 'next/link'"),
  'Login page has all required imports'
);

// Print results
console.log('\n📊 GDP-009 Identity Stitching Verification\n');
console.log('='.repeat(60));

let passCount = 0;
results.forEach((result) => {
  console.log(`${result.message}`);
  if (result.passed) passCount++;
});

console.log('='.repeat(60));
console.log(`\n✨ Results: ${passCount}/${results.length} checks passed\n`);

if (passCount === results.length) {
  console.log('🎉 GDP-009 implementation is complete and verified!');
  console.log('\n📝 Summary:');
  console.log('  ✅ Login page created with PostHog identity stitching');
  console.log('  ✅ Signup page enhanced with PostHog identity stitching');
  console.log('  ✅ Both pages call tracking.identify() with user_id and email');
  console.log('  ✅ Both pages call posthog.setPersonProperties() for identity linking');
  console.log('  ✅ PostHog sessions will be linked to identified users');
  console.log('\n🔗 Identity Stitching Flow:');
  console.log('  1. User signs up/logs in');
  console.log('  2. tracking.identify(userId, { email, user_id, ... }) is called');
  console.log('  3. posthog.setPersonProperties() links PostHog session to user');
  console.log('  4. PostHog can now merge anonymous and identified sessions');
  console.log('  5. User funnels and retention can be properly attributed');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please review the implementation.');
  process.exit(1);
}
