#!/usr/bin/env node
/**
 * T2V-009: T2V CLI Interface
 * Command-line interface for text-to-video generation
 *
 * Usage:
 *   npx tsx scripts/generate-t2v.ts --prompt "A cat playing piano" --model ltx-video
 *   npx tsx scripts/generate-t2v.ts --prompt "Sunset over ocean" --quality excellent
 *   npx tsx scripts/generate-t2v.ts --help
 */

import { parseArgs } from 'util';
import * as path from 'path';
import {
  createTextToVideoClient,
  generateVideo,
  generateVideoAuto,
  T2VModel,
  MODEL_CAPABILITIES
} from '../src/services/textToVideo';

interface CLIArgs {
  prompt?: string;
  model?: string;
  quality?: string;
  speed?: string;
  output?: string;
  frames?: string;
  width?: string;
  height?: string;
  steps?: string;
  guidance?: string;
  fps?: string;
  seed?: string;
  negative?: string;
  'list-models'?: boolean;
  help?: boolean;
}

/**
 * Display help message
 */
function showHelp() {
  console.log(`
T2V CLI - Text-to-Video Generation Interface

USAGE:
  npx tsx scripts/generate-t2v.ts [OPTIONS]

OPTIONS:
  --prompt <text>        Text description of video to generate (required)
  --model <name>         Specific model to use (ltx-video, mochi, hunyuan, wan)
  --quality <level>      Auto-select model by quality (standard, high, excellent)
  --speed <level>        Auto-select model by speed (fast, medium, slow)
  --output <path>        Output file path (default: output/video_<timestamp>.mp4)
  --frames <number>      Number of frames to generate
  --width <pixels>       Video width
  --height <pixels>      Video height
  --steps <number>       Number of inference steps
  --guidance <float>     Guidance scale (prompt adherence)
  --fps <number>         Frames per second
  --seed <number>        Random seed for reproducibility
  --negative <text>      Negative prompt (what to avoid)
  --list-models          List available models and their capabilities
  --help                 Show this help message

EXAMPLES:
  # Generate with default settings
  npx tsx scripts/generate-t2v.ts --prompt "A cat playing piano"

  # Use specific model
  npx tsx scripts/generate-t2v.ts --prompt "Sunset over mountains" --model ltx-video

  # Auto-select by quality
  npx tsx scripts/generate-t2v.ts --prompt "City at night" --quality excellent

  # Custom output path and settings
  npx tsx scripts/generate-t2v.ts \\
    --prompt "Dog running on beach" \\
    --output ./my-video.mp4 \\
    --frames 48 \\
    --fps 12 \\
    --seed 42

  # List available models
  npx tsx scripts/generate-t2v.ts --list-models

ENVIRONMENT VARIABLES:
  MODAL_LTX_VIDEO_URL    LTX-Video endpoint URL
  MODAL_MOCHI_URL        Mochi endpoint URL
  MODAL_HUNYUAN_URL      HunyuanVideo endpoint URL
  MODAL_WAN_URL          Wan2.2 endpoint URL
  MODAL_AVATAR_URL       LongCat Avatar endpoint URL

For more information, see docs/T2V-009-CLI-INTERFACE.md
`);
}

/**
 * List available models and their capabilities
 */
function listModels() {
  const client = createTextToVideoClient();
  const available = client.getAvailableModels();
  const all = client.listModels();

  console.log('\n📹 Available T2V Models\n');
  console.log('=' .repeat(80));

  for (const model of all) {
    const caps = MODEL_CAPABILITIES[model];
    const isAvailable = available.includes(model);
    const status = isAvailable ? '✅ Available' : '❌ Not configured';

    console.log(`\n${status}: ${caps.name} (${model})`);
    console.log(`  ${caps.description}`);
    console.log(`  Default: ${caps.defaultWidth}x${caps.defaultHeight}, ${caps.defaultFrames} frames @ ${caps.defaultFPS}fps`);
    console.log(`  Quality: ${caps.quality} | Speed: ${caps.estimatedSpeed}`);
    if (caps.specialFeatures && caps.specialFeatures.length > 0) {
      console.log(`  Features: ${caps.specialFeatures.join(', ')}`);
    }
    if (!isAvailable) {
      const envVar = client['getEnvVarName'](model);
      console.log(`  To enable: Set ${envVar} environment variable`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n${available.length} of ${all.length} models configured\n`);
}

/**
 * Parse and validate CLI arguments
 */
function parseCliArgs(): CLIArgs {
  try {
    const { values } = parseArgs({
      options: {
        prompt: { type: 'string' },
        model: { type: 'string' },
        quality: { type: 'string' },
        speed: { type: 'string' },
        output: { type: 'string' },
        frames: { type: 'string' },
        width: { type: 'string' },
        height: { type: 'string' },
        steps: { type: 'string' },
        guidance: { type: 'string' },
        fps: { type: 'string' },
        seed: { type: 'string' },
        negative: { type: 'string' },
        'list-models': { type: 'boolean' },
        help: { type: 'boolean' },
      },
      allowPositionals: false,
    });
    return values as CLIArgs;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error parsing arguments: ${error.message}`);
    }
    process.exit(1);
  }
}

/**
 * Main CLI function
 */
async function main() {
  const args = parseCliArgs();

  // Handle help
  if (args.help) {
    showHelp();
    process.exit(0);
  }

  // Handle list-models
  if (args['list-models']) {
    listModels();
    process.exit(0);
  }

  // Validate required arguments
  if (!args.prompt) {
    console.error('❌ Error: --prompt is required\n');
    console.log('Use --help for usage information');
    process.exit(1);
  }

  // Validate model if specified
  const validModels: T2VModel[] = ['ltx-video', 'mochi', 'hunyuan', 'wan', 'avatar'];
  if (args.model && !validModels.includes(args.model as T2VModel)) {
    console.error(`❌ Error: Invalid model "${args.model}". Valid models: ${validModels.join(', ')}`);
    process.exit(1);
  }

  // Validate quality if specified
  const validQualities = ['standard', 'high', 'excellent'];
  if (args.quality && !validQualities.includes(args.quality)) {
    console.error(`❌ Error: Invalid quality "${args.quality}". Valid qualities: ${validQualities.join(', ')}`);
    process.exit(1);
  }

  // Validate speed if specified
  const validSpeeds = ['fast', 'medium', 'slow'];
  if (args.speed && !validSpeeds.includes(args.speed)) {
    console.error(`❌ Error: Invalid speed "${args.speed}". Valid speeds: ${validSpeeds.join(', ')}`);
    process.exit(1);
  }

  // Check for conflicting options
  if (args.model && (args.quality || args.speed)) {
    console.error('❌ Error: Cannot use --model with --quality or --speed (auto-selection)');
    process.exit(1);
  }

  // Determine output path
  const timestamp = Date.now();
  const outputPath = args.output || path.join(process.cwd(), 'output', `video_${timestamp}.mp4`);

  console.log('\n🎬 T2V Video Generation\n');
  console.log('='.repeat(80));
  console.log(`\nPrompt: "${args.prompt}"`);
  if (args.negative) {
    console.log(`Negative: "${args.negative}"`);
  }

  try {
    let response;

    if (args.model) {
      // Use specific model
      const model = args.model as T2VModel;
      console.log(`Model: ${MODEL_CAPABILITIES[model].name} (${model})`);

      // Build config
      const config: any = {
        prompt: args.prompt,
        negativePrompt: args.negative,
      };

      if (args.frames) config.numFrames = parseInt(args.frames);
      if (args.width) config.width = parseInt(args.width);
      if (args.height) config.height = parseInt(args.height);
      if (args.steps) config.numInferenceSteps = parseInt(args.steps);
      if (args.guidance) config.guidanceScale = parseFloat(args.guidance);
      if (args.fps) config.fps = parseInt(args.fps);
      if (args.seed) config.seed = parseInt(args.seed);

      console.log(`Settings: ${JSON.stringify(config, null, 2)}`);
      console.log('\n⏳ Generating video...');

      response = await generateVideo(model, config, outputPath);

    } else {
      // Auto-select model
      const quality = args.quality as 'standard' | 'high' | 'excellent' | undefined;
      const speed = args.speed as 'fast' | 'medium' | 'slow' | undefined;

      if (quality) console.log(`Quality: ${quality}`);
      if (speed) console.log(`Speed: ${speed}`);

      // Build config
      const config: any = {};
      if (args.frames) config.numFrames = parseInt(args.frames);
      if (args.width) config.width = parseInt(args.width);
      if (args.height) config.height = parseInt(args.height);
      if (args.steps) config.numInferenceSteps = parseInt(args.steps);
      if (args.guidance) config.guidanceScale = parseFloat(args.guidance);
      if (args.fps) config.fps = parseInt(args.fps);
      if (args.seed) config.seed = parseInt(args.seed);
      if (args.negative) config.negativePrompt = args.negative;

      console.log('\n⏳ Auto-selecting model and generating video...');

      response = await generateVideoAuto(args.prompt, {
        quality,
        speed,
        outputPath,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      console.log(`Selected model: ${MODEL_CAPABILITIES[response.model].name}`);
    }

    // Display results
    console.log('\n✅ Video generated successfully!\n');
    console.log('Video Details:');
    console.log(`  Resolution: ${response.metadata.width}x${response.metadata.height}`);
    console.log(`  Frames: ${response.metadata.frames}`);
    console.log(`  FPS: ${response.metadata.fps}`);
    console.log(`  Duration: ${response.metadata.duration.toFixed(2)}s`);
    if (response.metadata.seed !== undefined) {
      console.log(`  Seed: ${response.metadata.seed}`);
    }
    console.log(`  Size: ${(response.video.length / 1024 / 1024).toFixed(2)} MB`);
    console.log(`\n📁 Saved to: ${outputPath}\n`);

  } catch (error) {
    console.error('\n❌ Video generation failed:\n');
    if (error instanceof Error) {
      console.error(`  ${error.message}\n`);

      // Provide helpful tips
      if (error.message.includes('not configured')) {
        console.log('💡 Tip: Set the required environment variable or use --list-models to see available models\n');
      } else if (error.message.includes('timed out')) {
        console.log('💡 Tip: Video generation can take several minutes. Try again or use a faster model.\n');
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
