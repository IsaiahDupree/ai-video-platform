/**
 * Remotion Media Service - Quick Start Example
 *
 * This example demonstrates how to use the Remotion Media Service
 * to render videos, generate speech, and create AI content.
 */

import { RemotionClient } from '../src/service/client';

async function quickstart() {
  console.log('🚀 Remotion Media Service - Quick Start\n');

  // Initialize client
  const client = new RemotionClient({
    baseUrl: 'http://localhost:3100',
    apiKey: process.env.REMOTION_SERVICE_API_KEY || 'dev-api-key',
  });

  try {
    // ==========================================================================
    // 1. Health Check
    // ==========================================================================
    console.log('1️⃣  Checking service health...');
    const health = await client.health();
    console.log(`   ✅ Service is ${health.status} (uptime: ${Math.round(health.uptime)}s)\n`);

    // ==========================================================================
    // 2. List Capabilities
    // ==========================================================================
    console.log('2️⃣  Listing service capabilities...');
    const capabilities = await client.capabilities();
    console.log(`   📚 Available endpoints:`, Object.keys(capabilities.endpoints).join(', '));
    console.log('');

    // ==========================================================================
    // 3. Generate Text-to-Speech (async)
    // ==========================================================================
    console.log('3️⃣  Generating text-to-speech...');
    const ttsJob = await client.generateTTS({
      text: 'Hello! This is a test of the Remotion Media Service.',
      provider: 'openai',
      voice: 'alloy',
    });
    console.log(`   ⏳ Job queued: ${ttsJob.jobId}`);

    // Poll for completion
    console.log('   ⏰ Waiting for TTS generation...');
    const ttsResult = await client.waitForJob(ttsJob.jobId, { timeout: 60000 });

    if (ttsResult.status === 'completed') {
      console.log(`   ✅ Audio generated: ${ttsResult.result?.audioPath}`);
      console.log(`   📊 Size: ${(ttsResult.result?.fileSize / 1024).toFixed(2)} KB\n`);
    } else {
      console.log(`   ❌ TTS failed: ${ttsResult.error}\n`);
    }

    // ==========================================================================
    // 4. Render Video (sync method)
    // ==========================================================================
    console.log('4️⃣  Rendering video from brief...');

    const brief = {
      id: 'quickstart-video',
      format: 'explainer_v1',
      title: 'Remotion Service Demo',
      description: 'Quick start example video',
      sections: [
        {
          id: 'intro',
          type: 'intro',
          duration_sec: 3,
          start_time_sec: 0,
          content: {
            title: 'Remotion Service',
            subtitle: 'Quick Start Demo',
          },
        },
        {
          id: 'topic1',
          type: 'topic',
          duration_sec: 5,
          start_time_sec: 3,
          content: {
            title: 'Easy Integration',
            description: 'Simple REST API for all your video needs',
          },
        },
      ],
      style: {
        theme: 'dark',
        primary_color: '#8b5cf6',
        accent_color: '#3b82f6',
        background_type: 'gradient',
        background_value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      settings: {
        duration_sec: 8,
        fps: 30,
        resolution: { width: 1920, height: 1080 },
      },
    };

    try {
      console.log('   ⏳ Rendering (this may take 30-60 seconds)...');
      const videoResult = await client.renderBriefSync({
        brief,
        quality: 'preview', // Use preview for faster rendering
      });

      if (videoResult.status === 'completed') {
        console.log(`   ✅ Video rendered: ${videoResult.result?.videoPath}`);
        console.log(`   📊 Size: ${(videoResult.result?.fileSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   ⏱️  Duration: ${videoResult.result?.duration}s\n`);
      } else {
        console.log(`   ❌ Rendering failed: ${videoResult.error}\n`);
      }
    } catch (error) {
      console.log(`   ⚠️  Video rendering skipped (may take too long for demo)\n`);
    }

    // ==========================================================================
    // 5. Batch Render (async)
    // ==========================================================================
    console.log('5️⃣  Submitting batch render job...');

    const batch = await client.renderBatch({
      videos: [
        {
          format: 'shorts_v1',
          title: 'Short Video 1',
          topics: ['AI', 'Technology'],
          duration_per_topic: 5,
        },
        {
          format: 'shorts_v1',
          title: 'Short Video 2',
          topics: ['Space', 'Exploration'],
          duration_per_topic: 5,
        },
      ],
      quality: 'preview',
    });

    console.log(`   ✅ Batch submitted: ${batch.batchId}`);
    console.log(`   📊 Jobs queued: ${batch.jobIds.length}`);
    console.log(`   ⏳ Status: ${batch.stats.pending} pending, ${batch.stats.processing} processing\n`);

    // ==========================================================================
    // 6. List All Jobs
    // ==========================================================================
    console.log('6️⃣  Listing all jobs...');
    const jobs = await client.listJobs();
    console.log(`   📋 Total jobs: ${jobs.stats.total}`);
    console.log(`   ✅ Completed: ${jobs.stats.completed}`);
    console.log(`   ⏳ Processing: ${jobs.stats.processing}`);
    console.log(`   📝 Pending: ${jobs.stats.pending}`);
    console.log(`   ❌ Failed: ${jobs.stats.failed}\n`);

    // ==========================================================================
    // 7. Generate AI Character (async, optional)
    // ==========================================================================
    console.log('7️⃣  Generating AI character (optional)...');
    console.log('   ℹ️  This requires OPENAI_API_KEY to be set');
    console.log('   ⏭️  Skipping for quick demo\n');

    /*
    const characterJob = await client.generateCharacter({
      name: 'Demo Bot',
      description: 'A friendly robot mascot',
      style: 'cartoon',
      expressions: ['neutral', 'happy'],
    });
    console.log(`   ✅ Character generation started: ${characterJob.jobId}\n`);
    */

    // ==========================================================================
    // Summary
    // ==========================================================================
    console.log('✨ Quick Start Complete!\n');
    console.log('Next steps:');
    console.log('  • Check the MICROSERVICE_GUIDE.md for full documentation');
    console.log('  • Explore more endpoints at /api/v1/capabilities');
    console.log('  • Use webhooks for production deployments');
    console.log('  • Increase JOB_QUEUE_MAX_CONCURRENT for better throughput\n');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    console.log('\n💡 Make sure the service is running:');
    console.log('   npm run service:start\n');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  quickstart().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { quickstart };
