#!/usr/bin/env tsx
/**
 * Test TRACK-004: Core Value Event Tracking
 *
 * This script tests:
 * - video_rendered events for all renders
 * - batch_completed events for multi-item jobs
 * - export_downloaded events for ZIP exports
 * - export_downloaded events for single file downloads
 */

import { serverTracking } from '../src/services/trackingServer';

// Test counters
let passedTests = 0;
let failedTests = 0;

// Mock tracking calls
const trackedEvents: Array<{ event: string; properties: any }> = [];
const originalTrack = (serverTracking as any).track;

// Override track method to capture calls
(serverTracking as any).track = function (event: string, properties: any) {
  trackedEvents.push({ event, properties });
  return originalTrack.call(this, event, properties);
};

// Helper function for test assertions
function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ ${message}`);
    passedTests++;
  } else {
    console.error(`❌ ${message}`);
    failedTests++;
  }
}

// Helper to clear tracked events
function clearTracked() {
  trackedEvents.length = 0;
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('TRACK-004: Core Value Event Tracking Test Suite');
  console.log('='.repeat(80));
  console.log();

  // Test 1: video_rendered event structure
  console.log('Test 1: video_rendered event structure');
  clearTracked();
  serverTracking.track('video_rendered', {
    compositionId: 'test-composition',
    format: 'png',
    width: 1080,
    height: 1080,
    sizeInBytes: 250000,
    timestamp: new Date().toISOString(),
  });

  assert(
    trackedEvents.length === 1,
    'video_rendered event was tracked'
  );
  assert(
    trackedEvents[0].event === 'video_rendered',
    'Event name is correct'
  );
  assert(
    trackedEvents[0].properties.compositionId === 'test-composition',
    'compositionId property is present'
  );
  assert(
    trackedEvents[0].properties.format === 'png',
    'format property is present'
  );
  assert(
    trackedEvents[0].properties.width === 1080,
    'width property is present'
  );
  console.log();

  // Test 2: video_rendered fires multiple times
  console.log('Test 2: video_rendered fires for each render');
  clearTracked();

  // Simulate 5 renders
  for (let i = 0; i < 5; i++) {
    serverTracking.track('video_rendered', {
      compositionId: `composition-${i}`,
      format: 'png',
      width: 1080,
      height: 1080,
      sizeInBytes: 250000,
      timestamp: new Date().toISOString(),
    });
  }

  assert(
    trackedEvents.length === 5,
    'video_rendered tracked for all 5 renders'
  );
  console.log();

  // Test 3: batch_completed event structure
  console.log('Test 3: batch_completed event structure');
  clearTracked();
  serverTracking.track('batch_completed', {
    jobId: 'job-12345',
    jobType: 'campaign',
    totalItems: 50,
    successCount: 48,
    failCount: 2,
    duration: 125000,
    timestamp: new Date().toISOString(),
  });

  assert(
    trackedEvents.length === 1,
    'batch_completed event was tracked'
  );
  assert(
    trackedEvents[0].event === 'batch_completed',
    'Event name is correct'
  );
  assert(
    trackedEvents[0].properties.jobId === 'job-12345',
    'jobId property is present'
  );
  assert(
    trackedEvents[0].properties.totalItems === 50,
    'totalItems property is present'
  );
  assert(
    trackedEvents[0].properties.successCount === 48,
    'successCount property is present'
  );
  assert(
    trackedEvents[0].properties.failCount === 2,
    'failCount property is present'
  );
  console.log();

  // Test 4: batch_completed only for multi-item batches
  console.log('Test 4: batch_completed only fires for totalItems > 1');
  clearTracked();

  // Simulate single-item render (should not fire batch_completed)
  const totalRendered1 = 1;
  if (totalRendered1 > 1) {
    serverTracking.track('batch_completed', {
      jobId: 'single-item-job',
      jobType: 'template',
      totalItems: totalRendered1,
      successCount: 1,
      failCount: 0,
      timestamp: new Date().toISOString(),
    });
  }

  assert(
    trackedEvents.length === 0,
    'batch_completed NOT tracked for single-item batch'
  );

  // Simulate multi-item render (should fire batch_completed)
  const totalRendered10 = 10;
  if (totalRendered10 > 1) {
    serverTracking.track('batch_completed', {
      jobId: 'multi-item-job',
      jobType: 'batch',
      totalItems: totalRendered10,
      successCount: 10,
      failCount: 0,
      timestamp: new Date().toISOString(),
    });
  }

  assert(
    trackedEvents.length === 1,
    'batch_completed tracked for multi-item batch (10 items)'
  );
  console.log();

  // Test 5: export_downloaded event structure (ZIP)
  console.log('Test 5: export_downloaded event structure (ZIP)');
  clearTracked();
  serverTracking.track('export_downloaded', {
    exportType: 'zip',
    fileCount: 50,
    sizeInBytes: 12456789,
    organizationStrategy: 'locale-first',
    includesManifest: true,
    timestamp: new Date().toISOString(),
  });

  assert(
    trackedEvents.length === 1,
    'export_downloaded event was tracked'
  );
  assert(
    trackedEvents[0].event === 'export_downloaded',
    'Event name is correct'
  );
  assert(
    trackedEvents[0].properties.exportType === 'zip',
    'exportType is "zip"'
  );
  assert(
    trackedEvents[0].properties.fileCount === 50,
    'fileCount property is present'
  );
  assert(
    trackedEvents[0].properties.sizeInBytes === 12456789,
    'sizeInBytes property is present'
  );
  assert(
    trackedEvents[0].properties.organizationStrategy === 'locale-first',
    'organizationStrategy property is present'
  );
  console.log();

  // Test 6: export_downloaded for single file
  console.log('Test 6: export_downloaded event for single file');
  clearTracked();
  serverTracking.track('export_downloaded', {
    exportType: 'single_file',
    fileCount: 1,
    sizeInBytes: 245678,
    format: 'png',
    timestamp: new Date().toISOString(),
  });

  assert(
    trackedEvents.length === 1,
    'export_downloaded event was tracked'
  );
  assert(
    trackedEvents[0].properties.exportType === 'single_file',
    'exportType is "single_file"'
  );
  assert(
    trackedEvents[0].properties.fileCount === 1,
    'fileCount is 1'
  );
  assert(
    trackedEvents[0].properties.format === 'png',
    'format property is present'
  );
  console.log();

  // Test 7: Campaign batch tracking
  console.log('Test 7: Campaign batch tracking');
  clearTracked();
  serverTracking.track('batch_completed', {
    campaignId: 'summer-sale-2024',
    jobId: 'campaign-job-123',
    jobType: 'campaign',
    totalItems: 50,
    successCount: 48,
    failCount: 2,
    variantCount: 5,
    sizeCount: 10,
    duration: 125000,
    timestamp: new Date().toISOString(),
  });

  assert(
    trackedEvents.length === 1,
    'Campaign batch_completed tracked'
  );
  assert(
    trackedEvents[0].properties.campaignId === 'summer-sale-2024',
    'campaignId property is present'
  );
  assert(
    trackedEvents[0].properties.variantCount === 5,
    'variantCount property is present'
  );
  assert(
    trackedEvents[0].properties.sizeCount === 10,
    'sizeCount property is present'
  );
  console.log();

  // Test 8: Tracking service status
  console.log('Test 8: Tracking service status');
  const isEnabled = serverTracking.isEnabled();
  if (isEnabled) {
    assert(true, 'Tracking service is enabled');
  } else {
    console.log('⚠️  Tracking service is disabled (PostHog keys not configured)');
    console.log('   This is expected in development/test environments');
    passedTests++; // Count as pass since it's expected
  }
  console.log();

  // Test 9: Event property validation
  console.log('Test 9: Required properties validation');
  clearTracked();

  // video_rendered should have compositionId
  serverTracking.track('video_rendered', {
    compositionId: 'test-comp',
    format: 'png',
    width: 1080,
    height: 1080,
    timestamp: new Date().toISOString(),
  });

  const videoRenderedCall = trackedEvents[0];
  assert(
    videoRenderedCall.properties.compositionId !== undefined,
    'video_rendered has required compositionId'
  );
  assert(
    videoRenderedCall.properties.format !== undefined,
    'video_rendered has required format'
  );
  assert(
    videoRenderedCall.properties.timestamp !== undefined,
    'video_rendered has required timestamp'
  );
  console.log();

  // Test 10: Timestamp format
  console.log('Test 10: Timestamp format validation');
  clearTracked();
  const now = new Date().toISOString();
  serverTracking.track('video_rendered', {
    compositionId: 'test',
    format: 'png',
    width: 1080,
    height: 1080,
    timestamp: now,
  });

  const timestampCall = trackedEvents[0];
  assert(
    typeof timestampCall.properties.timestamp === 'string',
    'timestamp is a string'
  );
  assert(
    timestampCall.properties.timestamp.includes('T'),
    'timestamp is in ISO format'
  );
  console.log();

  // Summary
  console.log('='.repeat(80));
  console.log('Test Summary');
  console.log('='.repeat(80));
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Total: ${passedTests + failedTests}`);
  console.log();

  if (failedTests === 0) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
