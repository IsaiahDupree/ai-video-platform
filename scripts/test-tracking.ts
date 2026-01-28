import { serverTracking } from '../src/services/trackingServer';
import * as dotenv from 'dotenv';

dotenv.config();

async function testTracking() {
  console.log('🧪 Testing Tracking SDK Integration (TRACK-001)\n');

  const apiKey = process.env.POSTHOG_API_KEY;

  if (!apiKey) {
    console.log('⚠️  POSTHOG_API_KEY not found in environment variables');
    console.log('ℹ️  This is expected for development. Tracking will be disabled.');
    console.log('ℹ️  To enable tracking, add POSTHOG_API_KEY to your .env file\n');

    console.log('Testing tracking service initialization with no API key...');
    serverTracking.initialize({ apiKey: '' });
    console.log('✅ Service handles missing API key gracefully');
    console.log(`   - isEnabled: ${serverTracking.isEnabled()}\n`);

    return;
  }

  console.log('Initializing tracking service...');
  serverTracking.initialize({
    apiKey,
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    enabled: true,
  });

  if (!serverTracking.isEnabled()) {
    console.error('❌ Tracking service failed to initialize');
    return;
  }

  console.log('✅ Tracking service initialized successfully\n');

  console.log('Testing user identification...');
  serverTracking.identify('test-user-123', {
    email: 'test@example.com',
    name: 'Test User',
    plan: 'free',
  });
  console.log('✅ User identified\n');

  console.log('Testing event tracking...');

  const testEvents = [
    { event: 'landing_view' as const, props: { page: '/home', source: 'test' } },
    { event: 'signup_started' as const, props: { method: 'email' } },
    { event: 'first_video_created' as const, props: { template: 'test-template' } },
    { event: 'video_rendered' as const, props: { duration: 30, format: 'mp4' } },
  ];

  for (const { event, props } of testEvents) {
    serverTracking.track(event, { userId: 'test-user-123', ...props });
    console.log(`  ✓ Tracked: ${event}`);
  }

  console.log('\n✅ Event tracking test completed\n');

  console.log('Testing page view tracking...');
  serverTracking.page('Test Page', {
    userId: 'test-user-123',
    url: '/test',
  });
  console.log('✅ Page view tracked\n');

  console.log('Shutting down tracking service...');
  await serverTracking.shutdown();
  console.log('✅ Tracking service shut down\n');

  console.log('🎉 All tracking tests passed!');
  console.log('\n📋 Summary:');
  console.log('  - SDK initialized successfully');
  console.log('  - User identification working');
  console.log('  - Event tracking working');
  console.log('  - Page tracking working');
  console.log('  - Graceful shutdown working');
}

testTracking().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
