#!/usr/bin/env npx tsx
/**
 * Async Batch Rendering Script with Job Queue
 *
 * Renders multiple videos concurrently using JobQueue system.
 * Supports progress tracking, webhooks, and distributed processing.
 *
 * Usage:
 *   npx tsx scripts/batch-render-async.ts --config batch-config.json
 *   npx tsx scripts/batch-render-async.ts --briefs data/briefs/*.json --concurrent 3
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { generateBrief, GeneratorInput } from './generate-brief';
import { ContentBrief } from '../src/types';
import { JobQueue, Job, JobStatus } from '../src/api/job-queue';

interface BatchConfig {
  videos: GeneratorInput[];
  outputDir?: string;
  quality?: 'preview' | 'production';
  concurrent?: number;
  webhookUrl?: string;
}

interface BatchStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
  startTime: number;
  endTime?: number;
}

// Create job queue with configurable concurrency
const queue = new JobQueue({
  maxConcurrent: 3,
  defaultMaxRetries: 2,
  jobTimeout: 1800000, // 30 minutes for video rendering
});

// Register the video rendering handler
queue.registerHandler('render-video', async (input) => {
  const { brief, outputPath, quality } = input;

  try {
    const propsJson = JSON.stringify({ brief });
    const crf = quality === 'preview' ? 28 : 18;

    execSync(
      `npx remotion render BriefComposition "${outputPath}" --props='${propsJson}' --crf=${crf}`,
      {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'pipe',
      }
    );

    return {
      success: true,
      videoPath: outputPath,
      size: fs.statSync(outputPath).size,
      duration: brief.settings.duration_sec,
    };
  } catch (error) {
    throw new Error(`Render failed: ${error instanceof Error ? error.message : String(error)}`);
  }
});

async function enqueueBatchVideos(
  config: BatchConfig,
  onProgress?: (stats: BatchStats) => void
): Promise<Map<string, Job>> {
  console.log('\n🎬 Async Batch Video Renderer');
  console.log('============================\n');

  const outputDir = config.outputDir || './output/batch';

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`📁 Output directory: ${outputDir}`);
  console.log(`⚙️  Concurrency: ${config.concurrent || 3}`);
  console.log(`🎯 Quality: ${config.quality || 'production'}`);
  console.log(`📹 Videos to render: ${config.videos.length}\n`);

  const jobMap = new Map<string, { input: GeneratorInput; brief: ContentBrief; outputPath: string }>();
  const stats: BatchStats = {
    total: config.videos.length,
    completed: 0,
    failed: 0,
    pending: config.videos.length,
    processing: 0,
    startTime: Date.now(),
  };

  // Enqueue all videos
  for (const input of config.videos) {
    try {
      const brief = generateBrief(input);
      const filename = sanitizeFilename(input.title) + '.mp4';
      const outputPath = path.join(outputDir, filename);

      const jobId = queue.enqueue(
        'render-video',
        {
          brief,
          outputPath,
          quality: config.quality || 'production',
          title: input.title,
        },
        {
          priority: 0,
          maxRetries: 2,
          webhookUrl: config.webhookUrl,
        }
      );

      jobMap.set(jobId, { input, brief, outputPath });

      console.log(`[Queue] ${input.title}`);
      console.log(`   Job ID: ${jobId}`);
      console.log(`   Format: ${input.format}`);
      console.log(`   Duration: ${brief.settings.duration_sec}s\n`);
    } catch (error) {
      console.error(`[Error] ${input.title}: ${error instanceof Error ? error.message : String(error)}\n`);
      stats.failed++;
      stats.pending--;
    }
  }

  // Monitor progress
  let lastUpdate = Date.now();
  const progressInterval = setInterval(() => {
    const now = Date.now();
    if (now - lastUpdate < 5000) return; // Update every 5 seconds

    stats.processing = queue.getAllJobs({ status: 'processing' }).length;
    stats.pending = queue.getAllJobs({ status: 'pending' }).length;
    stats.completed = queue.getAllJobs({ status: 'completed' }).length;
    stats.failed = queue.getAllJobs({ status: 'failed' }).length;

    console.clear();
    printProgressBar(stats);

    onProgress?.(stats);
    lastUpdate = now;
  }, 1000);

  // Wait for all jobs to complete
  await queue.waitForCompletion();
  clearInterval(progressInterval);

  stats.endTime = Date.now();

  // Print final summary
  await printBatchSummary(stats, jobMap);

  return jobMap;
}

function printProgressBar(stats: BatchStats): void {
  const width = 40;
  const completed = stats.completed + stats.failed;
  const progress = completed / stats.total;
  const filled = Math.round(width * progress);
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);

  const elapsed = Math.round((Date.now() - stats.startTime) / 1000);
  const avgTime = completed > 0 ? elapsed / completed : 0;
  const remaining = Math.round((stats.total - completed) * avgTime);

  console.log('\n📊 Batch Progress');
  console.log('════════════════════════════════════════════════════');
  console.log(`Progress: [${bar}] ${Math.round(progress * 100)}% (${completed}/${stats.total})`);
  console.log(`Status: ✅ ${stats.completed} | ❌ ${stats.failed} | 🔄 ${stats.processing} | ⏳ ${stats.pending}`);
  console.log(`Time: ${elapsed}s elapsed${remaining > 0 ? `, ~${remaining}s remaining` : ''}`);
  console.log('════════════════════════════════════════════════════\n');
}

async function printBatchSummary(
  stats: BatchStats,
  jobMap: Map<string, { input: GeneratorInput; brief: ContentBrief; outputPath: string }>
): Promise<void> {
  const duration = stats.endTime ? (stats.endTime - stats.startTime) / 1000 : 0;

  console.log('\n\n📊 Batch Render Summary');
  console.log('════════════════════════════════════════════════════');
  console.log(`Total Videos: ${stats.total}`);
  console.log(`✅ Successful: ${stats.completed}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`⏱️  Duration: ${duration.toFixed(1)}s`);
  console.log(`📈 Avg per video: ${(duration / stats.total).toFixed(1)}s`);
  console.log('════════════════════════════════════════════════════\n');

  // Detailed results
  const allJobs = queue.getAllJobs();

  const successful = allJobs.filter(j => j.status === 'completed');
  if (successful.length > 0) {
    console.log('✅ Successful Renders:');
    for (const job of successful) {
      const metadata = jobMap.get(job.id);
      const duration = (job.completedAt ?? 0 - (job.startedAt ?? 0)) / 1000;
      console.log(`   • ${metadata?.input.title || job.id} (${duration.toFixed(1)}s)`);
      if (job.result?.videoPath) {
        console.log(`     → ${job.result.videoPath}`);
      }
    }
  }

  const failed = allJobs.filter(j => j.status === 'failed');
  if (failed.length > 0) {
    console.log('\n❌ Failed Renders:');
    for (const job of failed) {
      const metadata = jobMap.get(job.id);
      console.log(`   • ${metadata?.input.title || job.id}`);
      console.log(`     Error: ${job.error}`);
    }
  }

  console.log('\n🎉 Batch rendering complete!\n');
}

function sanitizeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Parse CLI arguments
function parseArgs(): BatchConfig | null {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Async Batch Video Renderer

Usage:
  npx tsx scripts/batch-render-async.ts [options]

Options:
  --config <file>      Load batch config from JSON file
  --briefs <glob>      Render all briefs matching pattern
  --output <dir>       Output directory (default: ./output/batch)
  --quality <q>        Quality: preview | production
  --concurrent <n>     Max concurrent renders (default: 3)
  --webhook <url>      Webhook URL for progress updates
  --help, -h           Show this help

Examples:
  # Render from config file with 5 concurrent jobs
  npx tsx scripts/batch-render-async.ts --config my-batch.json --concurrent 5

  # Render all briefs with webhook notifications
  npx tsx scripts/batch-render-async.ts --briefs "data/briefs/*.json" --webhook http://localhost:3000/webhook
`);
    return null;
  }

  // Parse options
  const config: BatchConfig = {
    videos: [],
    outputDir: './output/batch',
    quality: 'production',
    concurrent: 3,
  };

  // Check for config file
  const configIdx = args.indexOf('--config');
  if (configIdx !== -1 && args[configIdx + 1]) {
    const configPath = args[configIdx + 1];
    if (fs.existsSync(configPath)) {
      const loaded = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      Object.assign(config, loaded);
    }
  }

  // Override with CLI args
  const outputIdx = args.indexOf('--output');
  if (outputIdx !== -1 && args[outputIdx + 1]) {
    config.outputDir = args[outputIdx + 1];
  }

  const qualityIdx = args.indexOf('--quality');
  if (qualityIdx !== -1 && args[qualityIdx + 1]) {
    config.quality = args[qualityIdx + 1] as 'preview' | 'production';
  }

  const concurrentIdx = args.indexOf('--concurrent');
  if (concurrentIdx !== -1 && args[concurrentIdx + 1]) {
    config.concurrent = parseInt(args[concurrentIdx + 1]);
  }

  const webhookIdx = args.indexOf('--webhook');
  if (webhookIdx !== -1 && args[webhookIdx + 1]) {
    config.webhookUrl = args[webhookIdx + 1];
  }

  // If no config file provided, use default
  if (config.videos.length === 0) {
    config.videos = getDefaultBatchVideos();
  }

  return config;
}

function getDefaultBatchVideos(): GeneratorInput[] {
  return [
    {
      format: 'explainer_v1',
      title: 'AI Fundamentals',
      subtitle: 'Machine Learning Basics',
      topics: [
        'What is AI: Artificial Intelligence explained',
        'Machine Learning: Learning from data',
        'Neural Networks: Brain-inspired models',
        'Deep Learning: Modern AI breakthrough',
      ],
      theme: 'dark',
      durationPerTopic: 5,
    },
    {
      format: 'listicle_v1',
      title: 'Top 10 Tech Trends 2026',
      subtitle: 'The Future is Here',
      listItems: [
        'AI Agents: Autonomous systems',
        'Quantum Computing: Next frontier',
        'Blockchain Evolution: Web3 maturity',
        'Edge Computing: Distributed processing',
        'Extended Reality: AR/VR mainstream',
      ],
      theme: 'neon',
      ctaText: 'Subscribe for more tech insights',
      durationPerTopic: 6,
    },
  ];
}

// Main execution
if (require.main === module) {
  const config = parseArgs();
  if (config) {
    enqueueBatchVideos(config).catch((err) => {
      console.error('❌ Batch render failed:', err.message);
      process.exit(1);
    });
  }
}

export { enqueueBatchVideos, BatchConfig, queue };
