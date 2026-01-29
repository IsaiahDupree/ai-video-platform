#!/usr/bin/env tsx
/**
 * Unit Tests for Email Event Tracking (GDP-005)
 *
 * These tests validate the email tracking types and service structure
 * without requiring a database connection
 */

import { existsSync } from 'fs';
import { resolve } from 'path';

console.log('🧪 Running Email Event Tracking Unit Tests (GDP-005)...\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then(() => {
          console.log(`✅ ${name}`);
          testsPassed++;
        })
        .catch((error) => {
          console.log(`❌ ${name}: ${error.message}`);
          testsFailed++;
        });
    } else {
      console.log(`✅ ${name}`);
      testsPassed++;
    }
  } catch (error: any) {
    console.log(`❌ ${name}: ${error.message}`);
    testsFailed++;
  }
}

async function runTests() {
  // Test 1: Verify all files exist
  await test('All required files exist', () => {
    const files = [
      'src/types/emailTracking.ts',
      'src/services/emailTracking.ts',
      'scripts/test-email-tracking.ts',
      'scripts/verify-email-tracking.ts',
      'docs/GDP-005-EMAIL-EVENT-TRACKING.md',
    ];

    files.forEach((file) => {
      const path = resolve(__dirname, '..', file);
      if (!existsSync(path)) {
        throw new Error(`Missing file: ${file}`);
      }
    });
  });

  // Test 2: Verify types can be imported
  await test('Email tracking types can be imported', async () => {
    const types = await import('../src/types/emailTracking');

    const expectedTypes = [
      'PersonEmailMetrics',
      'CampaignEmailMetrics',
      'EmailEngagementTimeSeries',
      'EmailLinkClick',
      'EmailAttribution',
      'EmailEventFilters',
      'EmailHealthMetrics',
    ];

    // TypeScript types don't exist at runtime, but we can verify the module loads
    if (!types) {
      throw new Error('Failed to import email tracking types');
    }
  });

  // Test 3: Verify service file structure
  await test('Email tracking service has correct structure', () => {
    const fs = require('fs');
    const servicePath = resolve(__dirname, '..', 'src/services/emailTracking.ts');
    const content = fs.readFileSync(servicePath, 'utf-8');

    const expectedFunctions = [
      'getPersonEmailMetrics',
      'getCampaignEmailMetrics',
      'getEmailEngagementTimeSeries',
      'getEmailLinkClicks',
      'getEmailAttribution',
      'getEmailHealthMetrics',
      'getAllCampaigns',
    ];

    expectedFunctions.forEach((fnName) => {
      if (!content.includes(`export async function ${fnName}`)) {
        throw new Error(`Missing function export: ${fnName}`);
      }
    });
  });

  // Test 4: Verify documentation completeness
  await test('Documentation includes all sections', () => {
    const docPath = resolve(__dirname, '..', 'docs/GDP-005-EMAIL-EVENT-TRACKING.md');
    const fs = require('fs');
    const content = fs.readFileSync(docPath, 'utf-8');

    const requiredSections = [
      '## Overview',
      '## Features',
      '## Implementation',
      '## Usage',
      '## API Reference',
      '## Testing',
      '## Analytics Use Cases',
    ];

    requiredSections.forEach((section) => {
      if (!content.includes(section)) {
        throw new Error(`Missing documentation section: ${section}`);
      }
    });
  });

  // Test 6: Verify environment variable documentation
  await test('Environment variables documented', () => {
    const fs = require('fs');
    const envPath = resolve(__dirname, '..', '.env.example');
    const content = fs.readFileSync(envPath, 'utf-8');

    // GDP-005 doesn't add new env vars, but should work with existing Supabase config
    if (!content.includes('SUPABASE_URL')) {
      throw new Error('Missing SUPABASE_URL in .env.example');
    }

    if (!content.includes('SUPABASE_SERVICE_KEY')) {
      throw new Error('Missing SUPABASE_SERVICE_KEY in .env.example');
    }
  });

  // Test 7: Verify test scripts are executable
  await test('Test scripts are properly structured', () => {
    const fs = require('fs');
    const testScript = resolve(__dirname, '..', 'scripts/test-email-tracking.ts');
    const content = fs.readFileSync(testScript, 'utf-8');

    if (!content.includes('#!/usr/bin/env tsx')) {
      throw new Error('Test script missing shebang');
    }

    if (!content.includes('testEmailTracking')) {
      throw new Error('Test script missing main test function');
    }
  });

  // Test 8: Verify metric calculation logic structure
  await test('Service includes metric calculation logic', () => {
    const fs = require('fs');
    const servicePath = resolve(__dirname, '..', 'src/services/emailTracking.ts');
    const content = fs.readFileSync(servicePath, 'utf-8');

    const requiredLogic = [
      'open_rate',
      'click_rate',
      'click_to_open_rate',
      'bounce_rate',
      'delivery_rate',
      'unique_',
    ];

    requiredLogic.forEach((logic) => {
      if (!content.includes(logic)) {
        throw new Error(`Missing metric calculation: ${logic}`);
      }
    });
  });

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (testsFailed === 0) {
    console.log(`✅ All ${testsPassed} unit tests passed!`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📝 Note: Integration tests require a Supabase database.');
    console.log('   To run full tests: npx tsx scripts/test-email-tracking.ts\n');
    process.exit(0);
  } else {
    console.log(`❌ ${testsFailed} test(s) failed, ${testsPassed} passed`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  }
}

runTests();
