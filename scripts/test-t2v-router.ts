#!/usr/bin/env ts-node
/**
 * Test T2V API Router - T2V-006
 * Test script for the unified text-to-video API
 *
 * Usage:
 *   ts-node scripts/test-t2v-router.ts list                    # List available models
 *   ts-node scripts/test-t2v-router.ts info <model>            # Show model capabilities
 *   ts-node scripts/test-t2v-router.ts recommend <requirements> # Get model recommendation
 *   ts-node scripts/test-t2v-router.ts generate <model> <prompt> [options]
 *   ts-node scripts/test-t2v-router.ts auto <prompt> [options] # Auto-select model
 *   ts-node scripts/test-t2v-router.ts avatar <image> <audio> [options]
 *
 * Examples:
 *   # List all models and their status
 *   ts-node scripts/test-t2v-router.ts list
 *
 *   # Show capabilities of a specific model
 *   ts-node scripts/test-t2v-router.ts info mochi
 *
 *   # Generate video with specific model
 *   ts-node scripts/test-t2v-router.ts generate ltx-video "A serene beach at sunset" --output beach.mp4
 *
 *   # Generate with custom parameters
 *   ts-node scripts/test-t2v-router.ts generate hunyuan "City traffic timelapse" \
 *     --frames 97 --width 1920 --height 1080 --fps 24 --output traffic.mp4
 *
 *   # Auto-select best model
 *   ts-node scripts/test-t2v-router.ts auto "Ocean waves crashing on rocks" \
 *     --quality high --speed fast --output waves.mp4
 *
 *   # Generate avatar video
 *   ts-node scripts/test-t2v-router.ts avatar portrait.jpg speech.wav --output talking.mp4
 *
 *   # Get model recommendation
 *   ts-node scripts/test-t2v-router.ts recommend --quality excellent --speed medium
 */

import {
  TextToVideoClient,
  T2VModel,
  BaseVideoConfig,
  AvatarVideoConfig,
  MODEL_CAPABILITIES,
  generateVideo,
  generateVideoAuto
} from '../src/services/textToVideo';

// Parse command-line arguments
const args = process.argv.slice(2);
const command = args[0];

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
T2V API Router Test Script

Commands:
  list                     List all available models
  info <model>            Show detailed model capabilities
  recommend [options]      Get model recommendation based on requirements
  generate <model> <prompt> [options]  Generate video with specific model
  auto <prompt> [options]  Auto-select best model and generate
  avatar <image> <audio> [options]     Generate avatar video

Options:
  --output, -o <path>      Output video file path
  --frames <num>           Number of frames
  --width <num>            Video width
  --height <num>           Video height
  --steps <num>            Inference steps
  --guidance <num>         Guidance scale
  --fps <num>              Frame rate
  --seed <num>             Random seed
  --negative <text>        Negative prompt
  --quality <level>        Quality: standard, high, excellent
  --speed <level>          Speed: fast, medium, slow

Available Models:
  ltx-video    Fast, lightweight T2V (512x512, ~3s)
  mochi        High-quality 480p T2V (480x848, 1-2.8s)
  hunyuan      Industry-leading 720p T2V (1280x720, ~5.4s)
  wan          Multi-lingual 1080p T2V (1920x1080, ~4s)
  avatar       Audio-driven talking heads (512x512, audio-based)

Examples:
  ts-node scripts/test-t2v-router.ts list
  ts-node scripts/test-t2v-router.ts info mochi
  ts-node scripts/test-t2v-router.ts generate ltx-video "Ocean sunset" -o sunset.mp4
  ts-node scripts/test-t2v-router.ts auto "City at night" --quality high -o city.mp4
  ts-node scripts/test-t2v-router.ts avatar portrait.jpg audio.wav -o talking.mp4
`);
}

/**
 * Parse command-line options
 */
function parseOptions(args: string[]): any {
  const options: any = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--frames':
        options.numFrames = parseInt(args[++i]);
        break;
      case '--width':
        options.width = parseInt(args[++i]);
        break;
      case '--height':
        options.height = parseInt(args[++i]);
        break;
      case '--steps':
        options.numInferenceSteps = parseInt(args[++i]);
        break;
      case '--guidance':
        options.guidanceScale = parseFloat(args[++i]);
        break;
      case '--fps':
        options.fps = parseInt(args[++i]);
        break;
      case '--seed':
        options.seed = parseInt(args[++i]);
        break;
      case '--negative':
        options.negativePrompt = args[++i];
        break;
      case '--quality':
        options.quality = args[++i] as 'standard' | 'high' | 'excellent';
        break;
      case '--speed':
        options.speed = args[++i] as 'fast' | 'medium' | 'slow';
        break;
    }
  }
  return options;
}

/**
 * List all models and their availability
 */
async function listModels() {
  const client = new TextToVideoClient();
  const models = client.listModels();

  console.log('\n=== Available T2V Models ===\n');

  for (const model of models) {
    const available = client.isModelAvailable(model);
    const caps = MODEL_CAPABILITIES[model];
    const status = available ? '✓' : '✗';
    const statusText = available ? 'CONFIGURED' : 'NOT CONFIGURED';

    console.log(`${status} ${model.toUpperCase()} - ${statusText}`);
    console.log(`  Name: ${caps.name}`);
    console.log(`  Description: ${caps.description}`);
    console.log(`  Default Resolution: ${caps.defaultWidth}x${caps.defaultHeight}`);
    console.log(`  Default FPS: ${caps.defaultFPS}`);
    console.log(`  Default Frames: ${caps.defaultFrames} (~${(caps.defaultFrames / caps.defaultFPS).toFixed(1)}s)`);
    console.log(`  Speed: ${caps.estimatedSpeed}`);
    console.log(`  Quality: ${caps.quality}`);
    if (caps.specialFeatures && caps.specialFeatures.length > 0) {
      console.log(`  Features: ${caps.specialFeatures.join(', ')}`);
    }
    console.log();
  }

  const configured = client.getAvailableModels();
  console.log(`Configured Models: ${configured.length}/${models.length}`);
  if (configured.length === 0) {
    console.log('\nNo models are configured. Set environment variables:');
    console.log('  MODAL_LTX_VIDEO_URL');
    console.log('  MODAL_MOCHI_URL');
    console.log('  MODAL_HUNYUAN_URL');
    console.log('  MODAL_WAN_URL');
    console.log('  MODAL_AVATAR_URL');
  }
  console.log();
}

/**
 * Show detailed model information
 */
async function showModelInfo(model: string) {
  const client = new TextToVideoClient();

  if (!client.listModels().includes(model as T2VModel)) {
    console.error(`Error: Unknown model "${model}"`);
    console.log('\nAvailable models:', client.listModels().join(', '));
    process.exit(1);
  }

  const caps = client.getModelCapabilities(model as T2VModel);
  const available = client.isModelAvailable(model as T2VModel);

  console.log(`\n=== ${caps.name} (${model}) ===\n`);
  console.log(`Status: ${available ? 'CONFIGURED ✓' : 'NOT CONFIGURED ✗'}`);
  console.log(`Description: ${caps.description}`);
  console.log();
  console.log('Specifications:');
  console.log(`  Default Resolution: ${caps.defaultWidth}x${caps.defaultHeight}`);
  console.log(`  Default Frame Rate: ${caps.defaultFPS} fps`);
  console.log(`  Default Frames: ${caps.defaultFrames} (~${(caps.defaultFrames / caps.defaultFPS).toFixed(1)}s)`);
  if (caps.minFrames && caps.maxFrames) {
    console.log(`  Frame Range: ${caps.minFrames}-${caps.maxFrames}`);
  }
  console.log();
  console.log('Characteristics:');
  console.log(`  Generation Speed: ${caps.estimatedSpeed}`);
  console.log(`  Output Quality: ${caps.quality}`);
  if (caps.specialFeatures && caps.specialFeatures.length > 0) {
    console.log(`  Special Features:`);
    caps.specialFeatures.forEach(f => console.log(`    - ${f}`));
  }
  console.log();
}

/**
 * Recommend a model based on requirements
 */
async function recommendModel(options: any) {
  const client = new TextToVideoClient();

  const requirements: any = {};
  if (options.quality) requirements.quality = options.quality;
  if (options.speed) requirements.speed = options.speed;

  console.log('\n=== Model Recommendation ===\n');
  console.log('Requirements:');
  if (requirements.quality) console.log(`  Quality: ${requirements.quality}`);
  if (requirements.speed) console.log(`  Speed: ${requirements.speed}`);
  if (Object.keys(requirements).length === 0) {
    console.log('  None specified (will recommend best available)');
  }
  console.log();

  const recommended = client.recommendModel(requirements);

  if (!recommended) {
    console.log('No models are configured!');
    console.log('\nPlease configure at least one model by setting its environment variable.');
    process.exit(1);
  }

  const caps = client.getModelCapabilities(recommended);
  console.log(`Recommended Model: ${caps.name} (${recommended})`);
  console.log(`  ${caps.description}`);
  console.log(`  Quality: ${caps.quality}, Speed: ${caps.estimatedSpeed}`);
  console.log();
}

/**
 * Generate video with specific model
 */
async function generateWithModel(model: string, prompt: string, options: any) {
  console.log(`\n=== Generating Video with ${model.toUpperCase()} ===\n`);
  console.log(`Prompt: "${prompt}"`);

  const config: BaseVideoConfig = {
    prompt,
    negativePrompt: options.negativePrompt,
    numFrames: options.numFrames,
    width: options.width,
    height: options.height,
    numInferenceSteps: options.numInferenceSteps,
    guidanceScale: options.guidanceScale,
    fps: options.fps,
    seed: options.seed
  };

  // Remove undefined values
  Object.keys(config).forEach(key => {
    if ((config as any)[key] === undefined) {
      delete (config as any)[key];
    }
  });

  console.log('Parameters:', JSON.stringify(config, null, 2));
  console.log('\nGenerating... (this may take several minutes)');

  const startTime = Date.now();
  try {
    const response = await generateVideo(
      model as T2VModel,
      config,
      options.output
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✓ Video generated successfully in ${duration}s`);
    console.log('\nMetadata:');
    console.log(`  Model: ${response.model}`);
    console.log(`  Resolution: ${response.metadata.width}x${response.metadata.height}`);
    console.log(`  Frames: ${response.metadata.frames}`);
    console.log(`  FPS: ${response.metadata.fps}`);
    console.log(`  Duration: ${response.metadata.duration.toFixed(2)}s`);
    console.log(`  Size: ${(response.video.length / 1024 / 1024).toFixed(2)} MB`);
    if (response.metadata.seed) {
      console.log(`  Seed: ${response.metadata.seed}`);
    }

    if (options.output) {
      console.log(`\nSaved to: ${options.output}`);
    } else {
      console.log('\nNote: Use --output to save the video');
    }
    console.log();
  } catch (error) {
    console.error('\n✗ Generation failed:', (error as Error).message);
    process.exit(1);
  }
}

/**
 * Auto-select model and generate
 */
async function generateAuto(prompt: string, options: any) {
  console.log('\n=== Auto-selecting Model ===\n');

  const client = new TextToVideoClient();
  const recommended = client.recommendModel({
    quality: options.quality,
    speed: options.speed
  });

  if (!recommended) {
    console.error('No models are configured!');
    process.exit(1);
  }

  const caps = client.getModelCapabilities(recommended);
  console.log(`Selected: ${caps.name} (${recommended})`);
  console.log(`  Reason: ${caps.quality} quality, ${caps.estimatedSpeed} speed`);

  // Use the regular generate function
  await generateWithModel(recommended, prompt, options);
}

/**
 * Generate avatar video
 */
async function generateAvatarVideo(image: string, audio: string, options: any) {
  console.log('\n=== Generating Avatar Video ===\n');
  console.log(`Image: ${image}`);
  console.log(`Audio: ${audio}`);

  const config: AvatarVideoConfig = {
    referenceImage: image,
    audio: audio,
    numInferenceSteps: options.numInferenceSteps,
    guidanceScale: options.guidanceScale,
    fps: options.fps,
    seed: options.seed
  };

  // Remove undefined values
  Object.keys(config).forEach(key => {
    if ((config as any)[key] === undefined && key !== 'referenceImage' && key !== 'audio') {
      delete (config as any)[key];
    }
  });

  console.log('Parameters:', JSON.stringify({
    numInferenceSteps: config.numInferenceSteps,
    guidanceScale: config.guidanceScale,
    fps: config.fps,
    seed: config.seed
  }, null, 2));
  console.log('\nGenerating... (this may take several minutes)');

  const startTime = Date.now();
  try {
    const response = await generateVideo('avatar', config, options.output);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✓ Avatar video generated successfully in ${duration}s`);
    console.log('\nMetadata:');
    console.log(`  Resolution: ${response.metadata.width}x${response.metadata.height}`);
    console.log(`  Frames: ${response.metadata.frames}`);
    console.log(`  FPS: ${response.metadata.fps}`);
    console.log(`  Duration: ${response.metadata.duration.toFixed(2)}s`);
    console.log(`  Size: ${(response.video.length / 1024 / 1024).toFixed(2)} MB`);

    if (options.output) {
      console.log(`\nSaved to: ${options.output}`);
    }
    console.log();
  } catch (error) {
    console.error('\n✗ Generation failed:', (error as Error).message);
    process.exit(1);
  }
}

/**
 * Main entry point
 */
async function main() {
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    return;
  }

  const options = parseOptions(args.slice(1));

  try {
    switch (command) {
      case 'list':
        await listModels();
        break;

      case 'info':
        if (args.length < 2) {
          console.error('Error: Missing model name');
          console.log('Usage: ts-node scripts/test-t2v-router.ts info <model>');
          process.exit(1);
        }
        await showModelInfo(args[1]);
        break;

      case 'recommend':
        await recommendModel(options);
        break;

      case 'generate':
        if (args.length < 3) {
          console.error('Error: Missing model or prompt');
          console.log('Usage: ts-node scripts/test-t2v-router.ts generate <model> <prompt> [options]');
          process.exit(1);
        }
        await generateWithModel(args[1], args[2], options);
        break;

      case 'auto':
        if (args.length < 2) {
          console.error('Error: Missing prompt');
          console.log('Usage: ts-node scripts/test-t2v-router.ts auto <prompt> [options]');
          process.exit(1);
        }
        await generateAuto(args[1], options);
        break;

      case 'avatar':
        if (args.length < 3) {
          console.error('Error: Missing image or audio path');
          console.log('Usage: ts-node scripts/test-t2v-router.ts avatar <image> <audio> [options]');
          process.exit(1);
        }
        await generateAvatarVideo(args[1], args[2], options);
        break;

      default:
        console.error(`Error: Unknown command "${command}"`);
        printUsage();
        process.exit(1);
    }
  } catch (error) {
    console.error('\nError:', (error as Error).message);
    process.exit(1);
  }
}

main();
