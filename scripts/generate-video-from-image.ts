#!/usr/bin/env npx tsx
/**
 * Generate Video from Image
 *
 * Animates static images into videos with motion prompts.
 * Uses Modal LTX-Video API deployed on GPU infrastructure.
 *
 * Usage:
 *   npx tsx scripts/generate-video-from-image.ts --image photo.jpg --motion "camera pans left" --output video.mp4
 *   npx tsx scripts/generate-video-from-image.ts --image product.png --template productShowcase --output output.mp4
 */

import * as fs from 'fs';
import * as path from 'path';
import { ImageToVideoClient, MOTION_PROMPT_TEMPLATES, generateMotionPrompt } from '../src/api/image-to-video';

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Image-to-Video Generator

Converts static images into animated videos using AI motion synthesis.

Usage:
  npx tsx scripts/generate-video-from-image.ts --image photo.jpg --motion "motion description" --output video.mp4
  npx tsx scripts/generate-video-from-image.ts --image photo.jpg --template productShowcase --output video.mp4

Options:
  --image FILE      Path to input image (required)
  --motion TEXT     Motion prompt describing the animation (required if no --template)
  --template NAME   Use predefined motion template
  --output FILE     Output video file path (default: output.mp4)
  --duration N      Video duration in seconds (default: 5)
  --fps N           Frames per second (default: 24)
  --resolution WxH  Output resolution: 512x512, 768x512, 1024x512, etc (default: 512x512)
  --quality LEVEL   Quality preset: draft, balanced, quality (default: balanced)
  --api-key KEY     Modal API key (or use MODAL_API_KEY env var)
  --modal-url URL   Modal API endpoint

Templates:
  panLeft, panRight, zoomIn, zoomOut, rotateClockwise, rotateCounterClockwise
  parallax, floating, floating_360, shimmer, productShowcase, heroUnfold, textReveal
`);
    return;
  }

  // Parse arguments
  const imageIdx = args.indexOf('--image');
  const motionIdx = args.indexOf('--motion');
  const templateIdx = args.indexOf('--template');
  const outputIdx = args.indexOf('--output');
  const durationIdx = args.indexOf('--duration');
  const fpsIdx = args.indexOf('--fps');
  const resolutionIdx = args.indexOf('--resolution');
  const qualityIdx = args.indexOf('--quality');
  const apiKeyIdx = args.indexOf('--api-key');
  const modalUrlIdx = args.indexOf('--modal-url');

  // Get required image
  if (imageIdx === -1) {
    console.error('Error: --image is required');
    process.exit(1);
  }

  const imagePath = args[imageIdx + 1];
  if (!imagePath || !fs.existsSync(imagePath)) {
    console.error(`Error: Image file not found: ${imagePath}`);
    process.exit(1);
  }

  // Get motion prompt (from --motion or --template)
  let motionPrompt = '';
  if (motionIdx !== -1) {
    motionPrompt = args[motionIdx + 1];
  } else if (templateIdx !== -1) {
    const templateName = args[templateIdx + 1] as any;
    try {
      motionPrompt = generateMotionPrompt(templateName);
      console.log(`✓ Using template: ${templateName}`);
    } catch (err) {
      console.error(`Error: Unknown template: ${templateName}`);
      process.exit(1);
    }
  } else {
    console.error('Error: Either --motion or --template is required');
    process.exit(1);
  }

  // Parse optional arguments
  const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : 'output.mp4';
  const duration = durationIdx !== -1 ? parseInt(args[durationIdx + 1], 10) : 5;
  const fps = fpsIdx !== -1 ? parseInt(args[fpsIdx + 1], 10) : 24;
  const resolution = resolutionIdx !== -1 ? args[resolutionIdx + 1] : '512x512';
  const quality = qualityIdx !== -1 ? args[qualityIdx + 1] : 'balanced';
  const apiKey = apiKeyIdx !== -1 ? args[apiKeyIdx + 1] : process.env.MODAL_API_KEY;
  const modalUrl = modalUrlIdx !== -1 ? args[modalUrlIdx + 1] : process.env.MODAL_API_URL;

  // Initialize client
  const client = new ImageToVideoClient(apiKey, modalUrl);

  // Generate video
  console.log(`\n🎬 Generating video from image...`);
  console.log(`   Image: ${imagePath}`);
  console.log(`   Motion: ${motionPrompt}`);
  console.log(`   Duration: ${duration}s @ ${fps} fps`);
  console.log(`   Resolution: ${resolution}`);
  console.log(`   Quality: ${quality}\n`);

  try {
    const result = await client.generateFromImage({
      imagePath,
      motionPrompt,
      duration,
      fps,
      resolution: resolution as any,
      quality: quality as any,
    });

    // Save metadata
    const metadataPath = outputFile.replace(/\.[^.]+$/, '.json');
    fs.writeFileSync(metadataPath, JSON.stringify(result, null, 2));

    console.log(`✅ Video generated successfully!`);
    console.log(`   Video URL: ${result.videoUrl}`);
    console.log(`   Local path: ${result.videoPath || outputFile}`);
    console.log(`   Metadata: ${metadataPath}`);
    console.log(`   Generated at: ${result.generatedAt}`);
  } catch (error) {
    console.error(`❌ Error generating video: ${error}`);
    process.exit(1);
  }
}

main().catch(console.error);
