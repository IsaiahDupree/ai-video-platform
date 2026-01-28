/**
 * Manual verification script for META-001: Meta Pixel Installation
 *
 * This script verifies:
 * 1. MetaPixel component exists
 * 2. Layout integration is correct
 * 3. Environment variable is configured
 * 4. Helper functions are exported
 */

import * as fs from 'fs';
import * as path from 'path';

console.log('🔍 Verifying META-001: Meta Pixel Installation\n');

let allPassed = true;

// Test 1: Check MetaPixel component exists
console.log('Test 1: MetaPixel component file');
const metaPixelPath = path.join(process.cwd(), 'src/components/MetaPixel.tsx');
if (fs.existsSync(metaPixelPath)) {
  console.log('  ✓ MetaPixel.tsx exists');

  const content = fs.readFileSync(metaPixelPath, 'utf-8');

  // Check for key exports
  const hasMetaPixel = content.includes('export function MetaPixel');
  const hasTrackMetaEvent = content.includes('export function trackMetaEvent');
  const hasTrackMetaCustomEvent = content.includes('export function trackMetaCustomEvent');
  const hasGrantConsent = content.includes('export function grantMetaConsent');
  const hasRevokeConsent = content.includes('export function revokeMetaConsent');

  if (hasMetaPixel) console.log('  ✓ MetaPixel component exported');
  else { console.log('  ✗ MetaPixel component not found'); allPassed = false; }

  if (hasTrackMetaEvent) console.log('  ✓ trackMetaEvent function exported');
  else { console.log('  ✗ trackMetaEvent function not found'); allPassed = false; }

  if (hasTrackMetaCustomEvent) console.log('  ✓ trackMetaCustomEvent function exported');
  else { console.log('  ✗ trackMetaCustomEvent function not found'); allPassed = false; }

  if (hasGrantConsent) console.log('  ✓ grantMetaConsent function exported');
  else { console.log('  ✗ grantMetaConsent function not found'); allPassed = false; }

  if (hasRevokeConsent) console.log('  ✓ revokeMetaConsent function exported');
  else { console.log('  ✗ revokeMetaConsent function not found'); allPassed = false; }

  // Check for window.fbq usage
  if (content.includes('window.fbq')) {
    console.log('  ✓ window.fbq integration present');
  } else {
    console.log('  ✗ window.fbq integration not found');
    allPassed = false;
  }
} else {
  console.log('  ✗ MetaPixel.tsx not found');
  allPassed = false;
}
console.log();

// Test 2: Check layout integration
console.log('Test 2: Layout integration');
const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
if (fs.existsSync(layoutPath)) {
  console.log('  ✓ layout.tsx exists');

  const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

  const hasImport = layoutContent.includes("import { MetaPixel } from '@/components/MetaPixel'");
  const hasUsage = layoutContent.includes('<MetaPixel');
  const hasEnvVar = layoutContent.includes('NEXT_PUBLIC_META_PIXEL_ID');

  if (hasImport) console.log('  ✓ MetaPixel imported in layout');
  else { console.log('  ✗ MetaPixel import not found in layout'); allPassed = false; }

  if (hasUsage) console.log('  ✓ MetaPixel used in layout');
  else { console.log('  ✗ MetaPixel usage not found in layout'); allPassed = false; }

  if (hasEnvVar) console.log('  ✓ Environment variable referenced');
  else { console.log('  ✗ Environment variable not referenced'); allPassed = false; }
} else {
  console.log('  ✗ layout.tsx not found');
  allPassed = false;
}
console.log();

// Test 3: Check environment variable documentation
console.log('Test 3: Environment configuration');
const envExamplePath = path.join(process.cwd(), '.env.example');
if (fs.existsSync(envExamplePath)) {
  console.log('  ✓ .env.example exists');

  const envContent = fs.readFileSync(envExamplePath, 'utf-8');

  if (envContent.includes('NEXT_PUBLIC_META_PIXEL_ID')) {
    console.log('  ✓ NEXT_PUBLIC_META_PIXEL_ID in .env.example');
  } else {
    console.log('  ✗ NEXT_PUBLIC_META_PIXEL_ID not in .env.example');
    allPassed = false;
  }
} else {
  console.log('  ✗ .env.example not found');
  allPassed = false;
}

// Check actual .env.local
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envLocalContent = fs.readFileSync(envLocalPath, 'utf-8');
  if (envLocalContent.includes('NEXT_PUBLIC_META_PIXEL_ID')) {
    console.log('  ✓ NEXT_PUBLIC_META_PIXEL_ID in .env.local');
  } else {
    console.log('  ⚠ NEXT_PUBLIC_META_PIXEL_ID not in .env.local (optional for dev)');
  }
} else {
  console.log('  ⚠ .env.local not found (optional for dev)');
}
console.log();

// Test 4: Check documentation
console.log('Test 4: Documentation');
const docsPath = path.join(process.cwd(), 'docs/META-001-META-PIXEL-INSTALLATION.md');
if (fs.existsSync(docsPath)) {
  console.log('  ✓ Documentation file exists');

  const docsContent = fs.readFileSync(docsPath, 'utf-8');

  if (docsContent.includes('## Overview')) console.log('  ✓ Overview section present');
  if (docsContent.includes('## Implementation')) console.log('  ✓ Implementation section present');
  if (docsContent.includes('## Usage')) console.log('  ✓ Usage section present');
  if (docsContent.includes('## Testing')) console.log('  ✓ Testing section present');
  if (docsContent.includes('## Security & Privacy')) console.log('  ✓ Security section present');
} else {
  console.log('  ✗ Documentation not found');
  allPassed = false;
}
console.log();

// Test 5: Check test script
console.log('Test 5: Test files');
const testPath = path.join(process.cwd(), 'scripts/test-meta-pixel.ts');
if (fs.existsSync(testPath)) {
  console.log('  ✓ Test script exists');

  const testContent = fs.readFileSync(testPath, 'utf-8');

  if (testContent.includes('describe')) console.log('  ✓ Jest tests defined');
  if (testContent.includes('trackMetaEvent')) console.log('  ✓ Event tracking tests present');
  if (testContent.includes('consent')) console.log('  ✓ Consent management tests present');
} else {
  console.log('  ✗ Test script not found');
  allPassed = false;
}
console.log();

// Summary
console.log('═══════════════════════════════════════════════════════════');
if (allPassed) {
  console.log('✅ All verification checks passed!');
  console.log('\nMETA-001: Meta Pixel Installation is complete.');
  console.log('\nNext steps:');
  console.log('1. Set NEXT_PUBLIC_META_PIXEL_ID in .env.local');
  console.log('2. Get your Pixel ID from: https://business.facebook.com/events_manager');
  console.log('3. Restart dev server to load environment variable');
  console.log('4. Verify in browser: window.fbq should be defined');
  console.log('5. Use Meta Pixel Helper extension to verify events');
} else {
  console.log('❌ Some verification checks failed. Please review the output above.');
  process.exit(1);
}
console.log('═══════════════════════════════════════════════════════════\n');
