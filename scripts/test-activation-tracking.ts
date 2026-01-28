/**
 * TRACK-003: Activation Event Tracking Test Script
 * Tests first_video_created and first_render_completed events
 */

import { serverTracking } from '../src/services/trackingServer';

async function testActivationTracking() {
  console.log('🧪 Testing Activation Event Tracking...\n');

  // Test 1: first_video_created event
  console.log('Test 1: first_video_created event');
  try {
    serverTracking.track('first_video_created', {
      templateId: 'test-template-001',
      templateType: 'custom',
      layout: 'hero-text',
      timestamp: new Date().toISOString(),
    });
    console.log('✅ first_video_created event tracked successfully');
  } catch (error) {
    console.error('❌ Failed to track first_video_created:', error);
  }

  console.log();

  // Test 2: first_video_created with starter template
  console.log('Test 2: first_video_created (starter template)');
  try {
    serverTracking.track('first_video_created', {
      templateId: 'example-hero-ad',
      templateType: 'starter',
      layout: 'hero-image',
      timestamp: new Date().toISOString(),
    });
    console.log('✅ first_video_created (starter) event tracked successfully');
  } catch (error) {
    console.error('❌ Failed to track first_video_created:', error);
  }

  console.log();

  // Test 3: first_render_completed event
  console.log('Test 3: first_render_completed event');
  try {
    serverTracking.track('first_render_completed', {
      templateId: 'test-template-001',
      format: 'png',
      width: 1080,
      height: 1080,
      sizeInBytes: 245678,
      timestamp: new Date().toISOString(),
    });
    console.log('✅ first_render_completed event tracked successfully');
  } catch (error) {
    console.error('❌ Failed to track first_render_completed:', error);
  }

  console.log();

  // Test 4: first_render_completed with job info
  console.log('Test 4: first_render_completed (with job info)');
  try {
    serverTracking.track('first_render_completed', {
      jobId: 'job-12345',
      jobType: 'template',
      totalRendered: 1,
      duration: 3500,
      timestamp: new Date().toISOString(),
    });
    console.log('✅ first_render_completed (job) event tracked successfully');
  } catch (error) {
    console.error('❌ Failed to track first_render_completed:', error);
  }

  console.log();

  // Test 5: first_render_completed with composition
  console.log('Test 5: first_render_completed (composition)');
  try {
    serverTracking.track('first_render_completed', {
      compositionId: 'example-hero-ad',
      format: 'jpeg',
      width: 1200,
      height: 628,
      sizeInBytes: 189234,
      timestamp: new Date().toISOString(),
    });
    console.log('✅ first_render_completed (composition) event tracked successfully');
  } catch (error) {
    console.error('❌ Failed to track first_render_completed:', error);
  }

  console.log();

  // Test 6: Verify tracking is enabled
  console.log('Test 6: Verify tracking service');
  if (serverTracking.isEnabled()) {
    console.log('✅ Tracking service is enabled');
  } else {
    console.log('⚠️  Tracking service is disabled');
  }

  console.log();

  // Summary
  console.log('=' .repeat(60));
  console.log('📊 Activation Event Tracking Test Summary');
  console.log('=' .repeat(60));
  console.log('Events tested:');
  console.log('  1. first_video_created (custom template)');
  console.log('  2. first_video_created (starter template)');
  console.log('  3. first_render_completed (template)');
  console.log('  4. first_render_completed (job queue)');
  console.log('  5. first_render_completed (composition)');
  console.log();
  console.log('Next steps:');
  console.log('  1. Check PostHog dashboard for events');
  console.log('  2. Verify event properties are correct');
  console.log('  3. Test in browser (visit /ads/editor)');
  console.log('  4. Create a template and verify first_video_created fires');
  console.log('  5. Render a template and verify first_render_completed fires');
  console.log();
}

// Run tests
testActivationTracking().catch(console.error);
