#!/usr/bin/env npx ts-node
/**
 * Generate Talking Head Video with Multi-GPU InfiniteTalk
 *
 * CLI for distributed video generation using multiple A100 GPUs on Modal.
 * Supports 2, 4, or 8 GPU configurations for faster and longer video generation.
 *
 * Features:
 * - Automatic GPU selection based on video duration
 * - Longer video support (up to 30 seconds with 8 GPUs)
 * - Faster generation (2-4x speedup)
 * - Batch processing support
 * - Detailed generation statistics
 *
 * Usage:
 *   # Generate with 2 GPUs (recommended for <10s videos)
 *   npx ts-node scripts/generate-video-infinitetalk-multi-gpu.ts \\
 *     --image face.jpg \\
 *     --audio speech.wav \\
 *     --num-gpus 2
 *
 *   # Generate with 4 GPUs (recommended for <20s videos)
 *   npx ts-node scripts/generate-video-infinitetalk-multi-gpu.ts \\
 *     --image face.jpg \\
 *     --text "Hello world" \\
 *     --num-gpus 4
 *
 *   # Generate with 8 GPUs (maximum performance, up to 30s videos)
 *   npx ts-node scripts/generate-video-infinitetalk-multi-gpu.ts \\
 *     --image face.jpg \\
 *     --audio speech.wav \\
 *     --num-gpus 8 \\
 *     --duration 30
 *
 *   # Batch processing
 *   npx ts-node scripts/generate-video-infinitetalk-multi-gpu.ts \\
 *     --batch batch.json \\
 *     --num-gpus 4
 *
 *   # Get recommendations for your video
 *   npx ts-node scripts/generate-video-infinitetalk-multi-gpu.ts \\
 *     --recommend-gpus \\
 *     --duration 15 \\
 *     --quality balanced
 */

import * as fs from "fs";
import * as path from "path";
import * as yargs from "yargs";
import { InfiniteTalkMultiGPUClient } from "../src/api/infinitetalk-multi-gpu-client";

interface BatchJob {
  image: string;
  audio?: string;
  text?: string;
  output: string;
  duration?: number;
  numGpus?: 2 | 4 | 8;
}

interface BatchConfig {
  jobs: BatchJob[];
  parallel?: number;
}

/**
 * Format duration in seconds to readable string.
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

/**
 * Print generation recommendations.
 */
function printRecommendations(
  client: InfiniteTalkMultiGPUClient,
  duration: number,
  quality: "draft" | "balanced" | "quality"
): void {
  console.log("\n" + "=".repeat(60));
  console.log("GPU RECOMMENDATION");
  console.log("=".repeat(60));
  console.log(`Duration: ${duration}s`);
  console.log(`Quality: ${quality}`);

  const gpuOptions: Array<2 | 4 | 8> = [2, 4, 8];
  console.log("\nOptions:");

  for (const gpus of gpuOptions) {
    const time = client.estimateTime(duration, gpus);
    const costPerHour = 3.5 * gpus; // A100 costs ~$3.50/hour per GPU
    const estimatedCost = (time / 3600) * costPerHour;

    console.log(`\n  ${gpus} GPUs:`);
    console.log(`    Est. time: ${formatDuration(time)}`);
    console.log(`    Est. cost: $${estimatedCost.toFixed(2)}`);
  }

  const recommended = client.recommendGpuCount(duration, quality);
  console.log(`\n✅ Recommended: ${recommended} GPUs`);
  console.log("=".repeat(60) + "\n");
}

/**
 * Main CLI handler.
 */
async function main() {
  const argv = await yargs
    .option("image", {
      description: "Path to reference face image (PNG, JPG, WebP)",
      type: "string",
      alias: "i",
    })
    .option("audio", {
      description: "Path to audio file (WAV, MP3)",
      type: "string",
      alias: "a",
    })
    .option("text", {
      description: "Text to synthesize if audio not provided",
      type: "string",
      alias: "t",
    })
    .option("num-gpus", {
      description: "Number of GPUs to use (2, 4, or 8)",
      type: "number",
      choices: [2, 4, 8],
      default: 2,
      alias: "g",
    })
    .option("duration", {
      description: "Maximum video duration in seconds",
      type: "number",
      default: 10,
      alias: "d",
    })
    .option("resolution", {
      description: "Video resolution",
      type: "string",
      choices: ["480p", "720p"],
      default: "480p",
      alias: "r",
    })
    .option("output", {
      description: "Output video file path",
      type: "string",
      default: "output_multi_gpu.mp4",
      alias: "o",
    })
    .option("batch", {
      description: "Batch config JSON file with multiple jobs",
      type: "string",
      alias: "b",
    })
    .option("recommend-gpus", {
      description: "Show GPU recommendations (don't generate)",
      type: "boolean",
      default: false,
    })
    .option("quality", {
      description: "Video quality for recommendations",
      type: "string",
      choices: ["draft", "balanced", "quality"],
      default: "balanced",
    })
    .option("seed", {
      description: "Random seed for reproducibility",
      type: "number",
      default: 42,
    })
    .option("show-stats", {
      description: "Show generation statistics",
      type: "boolean",
      default: false,
    })
    .option("endpoint", {
      description: "Custom Modal endpoint URL",
      type: "string",
    })
    .option("modal-token", {
      description: "Modal API token ID",
      type: "string",
      default: process.env.MODAL_TOKEN_ID,
    })
    .option("modal-secret", {
      description: "Modal API token secret",
      type: "string",
      default: process.env.MODAL_TOKEN_SECRET,
    })
    .help()
    .alias("help", "h")
    .version()
    .parseAsync();

  const client = new InfiniteTalkMultiGPUClient({
    modalToken: argv["modal-token"],
    modalSecret: argv["modal-secret"],
    endpoint: argv.endpoint,
  });

  // Handle recommendations
  if (argv["recommend-gpus"]) {
    printRecommendations(client, argv.duration, argv.quality as any);
    return;
  }

  // Handle batch processing
  if (argv.batch) {
    console.log("\n📦 Batch processing...");
    const batchConfig: BatchConfig = JSON.parse(fs.readFileSync(argv.batch, "utf-8"));

    const results = await client.generateBatch(
      batchConfig.jobs.map((job) => ({
        image: job.image,
        audio: job.audio,
        text: job.text,
        duration: job.duration || argv.duration,
        numGpus: job.numGpus || (argv["num-gpus"] as any),
        resolution: argv.resolution as any,
        seed: argv.seed,
      }))
    );

    // Save results
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const job = batchConfig.jobs[i];

      if (result.status === "completed") {
        const videoBuffer = Buffer.from(result.video, "base64");
        fs.writeFileSync(job.output, videoBuffer);
        console.log(
          `✅ [${i + 1}/${results.length}] Saved to ${job.output} (${argv["num-gpus"]}x A100, ${formatDuration(result.estimatedTime || 0)})`
        );
      } else {
        console.log(`❌ [${i + 1}/${results.length}] Failed: ${result.error}`);
      }
    }

    if (argv["show-stats"]) {
      const stats = client.getStats();
      console.log("\n" + "=".repeat(60));
      console.log("BATCH STATISTICS");
      console.log("=".repeat(60));
      console.log(`Total videos: ${stats.totalVideos}`);
      console.log(`Success rate: ${stats.successRate.toFixed(1)}%`);
      console.log(`Avg time: ${formatDuration(stats.avgTime)}`);
      console.log(`Fastest: ${formatDuration(stats.fastestTime)}`);
      console.log(`Slowest: ${formatDuration(stats.slowestTime)}`);
      console.log(`Total GPU hours: ${stats.gpuHours.toFixed(2)}`);
      console.log("=".repeat(60));
    }

    return;
  }

  // Validate inputs
  if (!argv.image) {
    console.error("❌ Error: --image is required");
    process.exit(1);
  }

  if (!argv.audio && !argv.text) {
    console.error("❌ Error: either --audio or --text is required");
    process.exit(1);
  }

  if (argv.audio && !fs.existsSync(argv.audio)) {
    console.error(`❌ Error: audio file not found: ${argv.audio}`);
    process.exit(1);
  }

  if (!fs.existsSync(argv.image)) {
    console.error(`❌ Error: image file not found: ${argv.image}`);
    process.exit(1);
  }

  // Generate single video
  try {
    console.log("\n" + "=".repeat(60));
    console.log("🎭 INFINITETALK MULTI-GPU VIDEO GENERATION");
    console.log("=".repeat(60));
    console.log(`Image: ${argv.image}`);
    console.log(`Audio/Text: ${argv.audio || argv.text}`);
    console.log(`Duration: ${argv.duration}s`);
    console.log(`GPUs: ${argv["num-gpus"]}x A100-80GB`);
    console.log(`Resolution: ${argv.resolution}`);

    const estimatedTime = client.estimateTime(
      argv.duration,
      argv["num-gpus"] as any,
      argv.resolution as any
    );
    console.log(`Estimated time: ${formatDuration(estimatedTime)}`);
    console.log("=".repeat(60));
    console.log("\nGenerating video...");

    const startTime = Date.now();

    const result = await client.generate({
      image: argv.image,
      audio: argv.audio,
      text: argv.text,
      numGpus: argv["num-gpus"] as any,
      duration: argv.duration,
      resolution: argv.resolution as any,
      seed: argv.seed,
    });

    if (result.status === "completed") {
      // Save video
      const videoBuffer = Buffer.from(result.video, "base64");
      fs.writeFileSync(argv.output, videoBuffer);

      const actualTime = (Date.now() - startTime) / 1000;
      console.log(`\n✅ Video generation completed!`);
      console.log(`Output: ${argv.output}`);
      console.log(`Job ID: ${result.jobId}`);
      console.log(`Actual time: ${formatDuration(actualTime)}`);
      console.log(`Est. cost: $${((actualTime / 3600) * (3.5 * argv["num-gpus"])).toFixed(2)}`);

      if (result.metadata) {
        console.log(`\nMetadata:`);
        console.log(`  Duration: ${result.metadata.duration}s`);
        console.log(`  Frames: ${result.metadata.frameCount}`);
        console.log(`  Resolution: ${result.metadata.resolution}`);
      }

      console.log("=".repeat(60) + "\n");
    } else {
      console.error(`\n❌ Generation failed: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error}`);
    process.exit(1);
  }
}

// Run CLI
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
