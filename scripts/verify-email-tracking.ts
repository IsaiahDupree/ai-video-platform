#!/usr/bin/env tsx
/**
 * Verify Email Event Tracking (GDP-005)
 *
 * Quick verification that all components exist
 */

import { existsSync } from 'fs';
import { resolve } from 'path';

const files = [
  'src/types/emailTracking.ts',
  'src/services/emailTracking.ts',
  'scripts/test-email-tracking.ts',
  'docs/GDP-005-EMAIL-EVENT-TRACKING.md',
];

console.log('🔍 Verifying Email Event Tracking (GDP-005)...\n');

let allExist = true;

files.forEach((file) => {
  const path = resolve(__dirname, '..', file);
  const exists = existsSync(path);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allExist = false;
});

console.log('');

if (allExist) {
  console.log('✅ All files exist!');
  console.log('\n📚 Documentation: docs/GDP-005-EMAIL-EVENT-TRACKING.md');
  console.log('🧪 Run tests: npx tsx scripts/test-email-tracking.ts\n');
  process.exit(0);
} else {
  console.log('❌ Some files are missing');
  process.exit(1);
}
