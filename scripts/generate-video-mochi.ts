#!/usr/bin/env tsx

/**
 * Mochi Photorealistic Video Generator CLI
 *
 * Generate photorealistic videos using Genmo's Mochi model
 *
 * Usage:
 *   npm run generate:video-mochi -- --prompt "A serene mountain landscape with snow"
 *   npm run generate:video-mochi -- --prompt "..." --output output.mp4 --steps 100 --duration 6
 */

import * as fs from 'fs';
import * as path from 'path';
import { MochiClient, MochiSettings } from '../src/api/mochi-client';

interface GenerateOptions {
  prompt: string;
  output: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  steps: number;
  guidance: number;
  preset?: 'fast' | 'balanced' | 'quality';
}

async function parseArgs(): Promise<GenerateOptions> {
  const args = process.argv.slice(2);
  const options: Partial<GenerateOptions> = {
    duration: 6,
    width: 1024,
    height: 576,
    fps: 25,
    steps: 60,
    guidance: 7.5,
    output: 'mochi_output.mp4',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--prompt' && args[i + 1]) {
      options.prompt = args[++i];
    } else if (arg === '--output' && args[i + 1]) {
      options.output = args[++i];
    } else if (arg === '--duration' && args[i + 1]) {
      options.duration = parseInt(args[++i], 10);
    } else if (arg === '--width' && args[i + 1]) {
      options.width = parseInt(args[++i], 10);
    } else if (arg === '--height' && args[i + 1]) {
      options.height = parseInt(args[++i], 10);
    } else if (arg === '--fps' && args[i + 1]) {
      options.fps = parseInt(args[++i], 10);
    } else if (arg === '--steps' && args[i + 1]) {
      options.steps = parseInt(args[++i], 10);
    } else if (arg === '--guidance' && args[i + 1]) {
      options.guidance = parseFloat(args[++i]);
    } else if (arg === '--preset' && args[i + 1]) {
      options.preset = args[++i] as 'fast' | 'balanced' | 'quality';
    }
  }

  if (!options.prompt) {
    throw new Error('--prompt is required');
  }

  // Apply preset overrides
  if (options.preset === 'fast') {
    options.duration = 3;
    options.steps = 30;
  } else if (options.preset === 'quality') {
    options.steps = 100;
    options.guidance = 8.0;
  }

  return options as GenerateOptions;
}

async function main() {
  try {
    console.log('🎬 Mochi Photorealistic Video Generator\n');

    // Parse arguments
    const options = await parseArgs();

    // Get API URL from environment
    const apiUrl = process.env.MOCHI_API_URL;
    if (!apiUrl) {
      console.error('Error: MOCHI_API_URL environment variable is required');
      console.error('Set it to your Modal API endpoint URL');
      process.exit(1);
    }

    // Create client
    const client = new MochiClient(apiUrl);

    // Show generation details
    console.log('📝 Generation Details:');
    console.log(`   Prompt: ${options.prompt}`);
    console.log(`   Output: ${options.output}`);
    console.log(`   Resolution: ${options.width}x${options.height}`);
    console.log(`   Duration: ${options.duration}s @ ${options.fps}fps`);
    console.log(`   Quality: ${options.steps} steps, guidance ${options.guidance}`);
    console.log('');

    // Show presets
    const presets = await client.listPresets();
    console.log('📊 Available Presets:');
    for (const preset of presets) {
      console.log(`   - ${preset.name}: ${preset.description} (~${preset.estimatedTimeSeconds}s)`);
    }
    console.log('');

    // Generate video
    console.log('⏳ Generating video... (this may take several minutes)');
    const startTime = Date.now();

    const result = await client.generateVideoToFile(
      {
        prompt: options.prompt,
        settings: {
          width: options.width,
          height: options.height,
          durationSeconds: options.duration,
          fps: options.fps,
          numInferenceSteps: options.steps,
          guidanceScale: options.guidance,
        },
      },
      options.output
    );

    const elapsed = (Date.now() - startTime) / 1000;

    // Show results
    console.log('\n✅ Video Generated Successfully!\n');
    console.log('📊 Results:');
    console.log(`   File: ${result.videoPath}`);
    console.log(`   Size: ${fs.statSync(result.videoPath).size / 1024 / 1024} MB`);
    console.log(`   Duration: ${result.duration}s`);
    console.log(`   Resolution: ${result.resolution} @ ${result.fps}fps`);
    console.log(`   Generation time: ${result.generationTime.toFixed(1)}s`);
    console.log(`   Total time (with overhead): ${elapsed.toFixed(1)}s`);

    if (result.metadata) {
      console.log('\n🔧 Metadata:');
      console.log(`   Model: ${result.metadata.model}`);
      console.log(`   Guidance Scale: ${result.metadata.guidanceScale}`);
      console.log(`   Inference Steps: ${result.metadata.numInferenceSteps}`);
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
