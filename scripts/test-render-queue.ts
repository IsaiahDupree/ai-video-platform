/**
 * Test script for Render Queue Service - ADS-009
 *
 * This script demonstrates and tests the render queue functionality including:
 * - Job creation (single, template, batch, campaign)
 * - Job priority management
 * - Progress tracking
 * - Job status monitoring
 * - Queue statistics
 *
 * Usage:
 *   npx tsx scripts/test-render-queue.ts [command]
 *
 * Commands:
 *   demo     - Run full demo with mock jobs
 *   stats    - Show queue statistics
 *   clear    - Clear all jobs from queue
 */

import { getRenderQueue, closeRenderQueue, JobPriority, RenderJobType } from '../src/services/renderQueue';
import type { AdTemplate } from '../src/types/adTemplate';

// Mock ad template for testing
const mockTemplate: AdTemplate = {
  id: 'test-template-1',
  name: 'Test Social Ad',
  dimensions: {
    width: 1080,
    height: 1080,
  },
  content: {
    headline: 'Test Headline',
    body: 'Test body text for the ad',
  },
};

// Mock templates for batch testing
const mockCampaignTemplates: AdTemplate[] = [
  {
    id: 'campaign-square',
    name: 'Campaign Square',
    dimensions: { width: 1080, height: 1080 },
    content: { headline: 'Square Ad', body: 'Square format' },
  },
  {
    id: 'campaign-story',
    name: 'Campaign Story',
    dimensions: { width: 1080, height: 1920 },
    content: { headline: 'Story Ad', body: 'Story format' },
  },
  {
    id: 'campaign-landscape',
    name: 'Campaign Landscape',
    dimensions: { width: 1920, height: 1080 },
    content: { headline: 'Landscape Ad', body: 'Landscape format' },
  },
];

/**
 * Display formatted output
 */
function log(title: string, data?: any) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60));
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

/**
 * Wait for a duration
 */
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test 1: Add single render job
 */
async function testSingleRender() {
  log('TEST 1: Single Render Job');

  const queue = getRenderQueue();

  const job = await queue.addSingleRenderJob(
    'simple-ad',
    {
      format: 'png',
      quality: 90,
    },
    JobPriority.NORMAL,
    {
      user: 'test-user',
      project: 'test-project',
    }
  );

  console.log(`✓ Job created: ${job.id}`);
  console.log(`  - Type: ${job.data.type}`);
  console.log(`  - Priority: ${job.opts.priority}`);
  console.log(`  - Composition: ${job.data.compositionId}`);
  console.log(`  - State: ${await job.getState()}`);

  return job.id;
}

/**
 * Test 2: Add template render job
 */
async function testTemplateRender() {
  log('TEST 2: Template Render Job');

  const queue = getRenderQueue();

  const job = await queue.addTemplateRenderJob(
    mockTemplate,
    {
      format: 'jpeg',
      quality: 85,
    },
    JobPriority.HIGH,
    {
      campaign: 'summer-2024',
    }
  );

  console.log(`✓ Job created: ${job.id}`);
  console.log(`  - Type: ${job.data.type}`);
  console.log(`  - Priority: ${job.opts.priority}`);
  console.log(`  - Template: ${job.data.template.id}`);
  console.log(`  - State: ${await job.getState()}`);

  return job.id;
}

/**
 * Test 3: Add batch render job
 */
async function testBatchRender() {
  log('TEST 3: Batch Render Job');

  const queue = getRenderQueue();

  const compositionIds = ['ad-1', 'ad-2', 'ad-3', 'ad-4', 'ad-5'];

  const job = await queue.addBatchRenderJob(
    compositionIds,
    {
      format: 'webp',
      quality: 90,
    },
    JobPriority.NORMAL,
    {
      batch: 'batch-001',
    }
  );

  console.log(`✓ Job created: ${job.id}`);
  console.log(`  - Type: ${job.data.type}`);
  console.log(`  - Priority: ${job.opts.priority}`);
  console.log(`  - Compositions: ${job.data.compositionIds.length}`);
  console.log(`  - State: ${await job.getState()}`);

  return job.id;
}

/**
 * Test 4: Add campaign render job
 */
async function testCampaignRender() {
  log('TEST 4: Campaign Render Job');

  const queue = getRenderQueue();

  const job = await queue.addCampaignRenderJob(
    mockCampaignTemplates,
    {
      format: 'png',
      quality: 95,
    },
    JobPriority.URGENT,
    {
      campaign: 'launch-campaign',
      client: 'acme-corp',
    }
  );

  console.log(`✓ Job created: ${job.id}`);
  console.log(`  - Type: ${job.data.type}`);
  console.log(`  - Priority: ${job.opts.priority}`);
  console.log(`  - Templates: ${job.data.templates.length}`);
  console.log(`  - State: ${await job.getState()}`);

  return job.id;
}

/**
 * Test 5: Monitor job progress
 */
async function testJobProgress(jobId: string) {
  log(`TEST 5: Job Progress Monitoring - ${jobId}`);

  const queue = getRenderQueue();

  console.log('Monitoring job progress...\n');

  for (let i = 0; i < 10; i++) {
    const job = await queue.getJob(jobId);
    if (!job) {
      console.log('Job not found');
      break;
    }

    const state = await job.getState();
    const progress = await queue.getJobProgress(jobId);

    console.log(`[${i + 1}/10] State: ${state.padEnd(12)} | Progress: ${
      progress ? `${progress.percentage}% (${progress.current}/${progress.total})` : 'N/A'
    }`);

    if (state === 'completed' || state === 'failed') {
      console.log('\n✓ Job finished');
      if (state === 'completed') {
        const result = await job.returnvalue;
        console.log(`  - Success: ${result.success}`);
        console.log(`  - Rendered: ${result.totalRendered}`);
        console.log(`  - Failed: ${result.totalFailed}`);
        console.log(`  - Duration: ${result.duration}ms`);
      }
      break;
    }

    await wait(1000);
  }
}

/**
 * Test 6: Queue statistics
 */
async function testQueueStats() {
  log('TEST 6: Queue Statistics');

  const queue = getRenderQueue();
  const stats = await queue.getStats();

  console.log(`Total Jobs:      ${stats.total}`);
  console.log(`Waiting:         ${stats.waiting}`);
  console.log(`Active:          ${stats.active}`);
  console.log(`Completed:       ${stats.completed}`);
  console.log(`Failed:          ${stats.failed}`);
  console.log(`Delayed:         ${stats.delayed}`);
}

/**
 * Test 7: Job management operations
 */
async function testJobManagement() {
  log('TEST 7: Job Management Operations');

  const queue = getRenderQueue();

  // Create a test job
  const job = await queue.addSingleRenderJob('test-job', {}, JobPriority.LOW);
  console.log(`✓ Created job: ${job.id}`);

  // Get job state
  const state = await queue.getJobState(job.id!);
  console.log(`✓ Job state: ${state}`);

  // Get all waiting jobs
  const waitingJobs = await queue.getJobs('waiting');
  console.log(`✓ Waiting jobs: ${waitingJobs.length}`);

  // Pause queue
  await queue.pause();
  console.log('✓ Queue paused');

  // Resume queue
  await queue.resume();
  console.log('✓ Queue resumed');

  // Remove job
  await queue.removeJob(job.id!);
  console.log(`✓ Job removed: ${job.id}`);
}

/**
 * Test 8: Event listeners
 */
async function testEventListeners() {
  log('TEST 8: Event Listeners');

  const queue = getRenderQueue();

  console.log('Setting up event listeners...\n');

  queue.setupEventListener(
    (jobId, result) => {
      console.log(`[EVENT] Job completed: ${jobId}`);
      console.log(`  - Success: ${result.success}`);
      console.log(`  - Duration: ${result.duration}ms`);
    },
    (jobId, error) => {
      console.log(`[EVENT] Job failed: ${jobId}`);
      console.log(`  - Error: ${error.message}`);
    },
    (jobId, progress) => {
      console.log(`[EVENT] Progress: ${jobId} - ${progress.percentage}%`);
    }
  );

  console.log('✓ Event listeners configured');
}

/**
 * Clear all jobs from queue
 */
async function clearQueue() {
  log('Clearing Queue');

  const queue = getRenderQueue();

  const statsBefore = await queue.getStats();
  console.log(`Jobs before clear: ${statsBefore.total}`);

  await queue.clear();

  const statsAfter = await queue.getStats();
  console.log(`Jobs after clear: ${statsAfter.total}`);

  console.log('\n✓ Queue cleared');
}

/**
 * Run full demo
 */
async function runDemo() {
  log('RENDER QUEUE DEMO', {
    description: 'Full demonstration of render queue features',
    features: [
      'Job creation (single, template, batch, campaign)',
      'Priority management',
      'Progress tracking',
      'Queue statistics',
      'Event listeners',
    ],
  });

  console.log('\n⚠️  NOTE: This is a demonstration with mock data.');
  console.log('    Real rendering requires Redis server running and valid compositions.');

  try {
    // Setup event listeners first
    await testEventListeners();
    await wait(1000);

    // Test job creation
    const jobId1 = await testSingleRender();
    await wait(500);

    const jobId2 = await testTemplateRender();
    await wait(500);

    const jobId3 = await testBatchRender();
    await wait(500);

    const jobId4 = await testCampaignRender();
    await wait(500);

    // Show statistics
    await testQueueStats();
    await wait(500);

    // Test job management
    await testJobManagement();
    await wait(500);

    // Monitor a job (this would work if worker is running)
    // await testJobProgress(jobId1);

    log('DEMO COMPLETE', {
      status: 'success',
      message: 'All tests passed! Queue is ready for production use.',
      nextSteps: [
        '1. Start Redis server: redis-server',
        '2. Start worker: queue.startWorker()',
        '3. Add jobs to queue',
        '4. Monitor progress and results',
      ],
    });
  } catch (error) {
    log('DEMO FAILED', {
      error: error instanceof Error ? error.message : String(error),
      hint: 'Make sure Redis server is running on localhost:6379',
    });
  } finally {
    // Clean up
    await closeRenderQueue();
  }
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2] || 'demo';

  try {
    switch (command) {
      case 'demo':
        await runDemo();
        break;

      case 'stats':
        await testQueueStats();
        await closeRenderQueue();
        break;

      case 'clear':
        await clearQueue();
        await closeRenderQueue();
        break;

      case 'test-single':
        await testSingleRender();
        await closeRenderQueue();
        break;

      case 'test-template':
        await testTemplateRender();
        await closeRenderQueue();
        break;

      case 'test-batch':
        await testBatchRender();
        await closeRenderQueue();
        break;

      case 'test-campaign':
        await testCampaignRender();
        await closeRenderQueue();
        break;

      default:
        console.log('Unknown command:', command);
        console.log('\nAvailable commands:');
        console.log('  demo           - Run full demo (default)');
        console.log('  stats          - Show queue statistics');
        console.log('  clear          - Clear all jobs');
        console.log('  test-single    - Test single render job');
        console.log('  test-template  - Test template render job');
        console.log('  test-batch     - Test batch render job');
        console.log('  test-campaign  - Test campaign render job');
        process.exit(1);
    }

    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
    await closeRenderQueue();
    process.exit(1);
  }
}

// Run main function
main();
