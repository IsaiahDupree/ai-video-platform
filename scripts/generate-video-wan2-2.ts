#!/usr/bin/env tsx
/**
 * Wan2.2 Video Generation CLI
 *
 * Usage:
 *   npm run generate:wan2-2 -- \
 *     --prompt "A serene mountain landscape" \
 *     --duration 10 \
 *     --output output/video.mp4 \
 *     --api-url https://username--wan2-2-video-api-generate.modal.run
 */

import * as fs from 'fs';
import * as path from 'path';
import { program } from 'commander';
import { Wan22Client, Wan22Settings } from '../src/api/wan2-2-client';

// Command-line options
program
  .option('--prompt <text>', 'Video prompt (required)', '')
  .option('--negative-prompt <text>', 'Negative prompt', 'blurry, low quality, distorted')
  .option('--api-url <url>', 'Wan2.2 API URL', process.env.WAN2_2_API_URL || '')
  .option('--api-key <key>', 'Wan2.2 API key (optional)', process.env.WAN2_2_API_KEY || '')
  .option('--model <name>', 'Model: wan2.2-t2v-14b or wan2.2-ti2v-5b', 'wan2.2-t2v-14b')
  .option('--image <path>', 'Image file for TI2V mode (optional)')
  .option('--width <num>', 'Video width', '1280')
  .option('--height <num>', 'Video height', '720')
  .option('--duration <num>', 'Video duration in seconds', '10')
  .option('--fps <num>', 'Frames per second', '24')
  .option('--guidance-scale <num>', 'Guidance scale (how much to follow prompt)', '7.5')
  .option('--steps <num>', 'Number of inference steps (higher = better quality)', '50')
  .option('--seed <num>', 'Random seed for reproducibility (optional)')
  .option('--output <path>', 'Output video path', 'output/wan2_2_video.mp4')
  .parse();

const opts = program.opts();

async function main() {
  // Validate required arguments
  if (!opts.prompt) {
    console.error('❌ Error: --prompt is required');
    process.exit(1);
  }

  if (!opts.apiUrl) {
    console.error('❌ Error: --api-url is required or set WAN2_2_API_URL env var');
    process.exit(1);
  }

  try {
    // Create client
    const client = new Wan22Client(opts.apiUrl, opts.apiKey);

    // Build settings
    const settings: Wan22Settings = {
      width: parseInt(opts.width, 10),
      height: parseInt(opts.height, 10),
      durationSeconds: parseInt(opts.duration, 10),
      fps: parseInt(opts.fps, 10),
      guidanceScale: parseFloat(opts.guidanceScale),
      numInferenceSteps: parseInt(opts.steps, 10),
      ...(opts.seed && { seed: parseInt(opts.seed, 10) }),
    };

    console.log('🎬 Generating video with Wan2.2...');
    console.log(`   Prompt: ${opts.prompt}`);
    console.log(`   Model: ${opts.model}`);
    console.log(`   Resolution: ${settings.width}x${settings.height}`);
    console.log(`   Duration: ${settings.durationSeconds}s @ ${settings.fps}fps`);
    console.log(`   Guidance scale: ${settings.guidanceScale}`);
    console.log(`   Inference steps: ${settings.numInferenceSteps}`);

    // Generate video (with or without image)
    const startTime = Date.now();
    let result;

    if (opts.image && opts.model === 'wan2.2-ti2v-5b') {
      console.log(`   Image: ${opts.image} (TI2V mode)`);

      if (!fs.existsSync(opts.image)) {
        console.error(`❌ Image not found: ${opts.image}`);
        process.exit(1);
      }

      result = await client.generateVideoFromImage(
        opts.prompt,
        opts.image,
        settings
      );
    } else {
      result = await client.generateVideo({
        prompt: opts.prompt,
        negativeprompt: opts.negativeprompt,
        model: opts.model as 'wan2.2-t2v-14b' | 'wan2.2-ti2v-5b',
        settings,
      });
    }

    // Save to file
    const outputDir = path.dirname(opts.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const videoBuffer = Buffer.from(result.videoBase64, 'base64');
    fs.writeFileSync(opts.output, videoBuffer);

    const totalTime = (Date.now() - startTime) / 1000;

    console.log('\n✅ Video generated successfully!');
    console.log(`   Output: ${path.resolve(opts.output)}`);
    console.log(`   Size: ${(videoBuffer.length / (1024 * 1024)).toFixed(1)}MB`);
    console.log(`   Generation time: ${result.generationTime.toFixed(1)}s`);
    console.log(`   Total time: ${totalTime.toFixed(1)}s`);
    console.log(`   Resolution: ${result.resolution}`);
    console.log(`   Duration: ${result.duration}s @ ${result.fps}fps`);

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
