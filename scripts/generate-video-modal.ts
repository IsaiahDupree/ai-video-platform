#!/usr/bin/env npx tsx
/**
 * Generate video using LTX-Video on Modal
 * 
 * Usage:
 *   npx tsx scripts/generate-video-modal.ts --prompt "A serene landscape" --output video.mp4
 *   npx tsx scripts/generate-video-modal.ts --help
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// Modal endpoint
const MODAL_ENDPOINT = process.env.MODAL_TEXT_TO_VIDEO_ENDPOINT || 
  'isaiahdupree33--text-to-video-ltx-api-generate.modal.run';

interface GenerateVideoOptions {
  prompt: string;
  negativePrompt?: string;
  numFrames?: number;
  width?: number;
  height?: number;
  numInferenceSteps?: number;
  guidanceScale?: number;
  fps?: number;
  outputPath: string;
}

interface VideoResponse {
  video: string;  // base64
  num_frames: number;
  duration_seconds: number;
  generation_time_seconds: number;
  total_time_seconds: number;
  width: number;
  height: number;
  fps: number;
  error?: string;
}

async function generateVideo(options: GenerateVideoOptions): Promise<VideoResponse | null> {
  const body = JSON.stringify({
    prompt: options.prompt,
    negative_prompt: options.negativePrompt || 'blurry, low quality, distorted, watermark',
    num_frames: options.numFrames || 49,
    width: options.width || 768,
    height: options.height || 512,
    num_inference_steps: options.numInferenceSteps || 50,
    guidance_scale: options.guidanceScale || 7.5,
    fps: options.fps || 24,
  });

  console.log(`\n🎬 Generating video with LTX-Video on Modal...`);
  console.log(`   Prompt: "${options.prompt.substring(0, 60)}..."`);
  console.log(`   Frames: ${options.numFrames || 49} (~${((options.numFrames || 49) / 24).toFixed(1)}s)`);
  console.log(`   Resolution: ${options.width || 768}x${options.height || 512}`);
  console.log(`   Endpoint: ${MODAL_ENDPOINT}`);
  console.log(`\n⏳ This may take 1-3 minutes (includes cold start)...\n`);

  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = https.request({
      hostname: MODAL_ENDPOINT,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 600000,  // 10 minute timeout
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        
        try {
          const response: VideoResponse = JSON.parse(data);
          
          if (response.error) {
            console.error(`❌ Error: ${response.error}`);
            resolve(null);
            return;
          }
          
          // Save video
          const videoBuffer = Buffer.from(response.video, 'base64');
          const dir = path.dirname(options.outputPath);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(options.outputPath, videoBuffer);
          
          console.log(`✅ Video saved: ${options.outputPath}`);
          console.log(`   Duration: ${response.duration_seconds.toFixed(1)}s`);
          console.log(`   Size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);
          console.log(`   Generation time: ${response.generation_time_seconds.toFixed(1)}s`);
          console.log(`   Total time: ${elapsed}s`);
          
          resolve(response);
        } catch (e) {
          console.error(`❌ Parse error: ${e}`);
          console.error(`   Response: ${data.substring(0, 200)}`);
          resolve(null);
        }
      });
    });
    
    req.on('error', (err) => {
      console.error(`❌ Request error: ${err.message}`);
      resolve(null);
    });
    
    req.on('timeout', () => {
      console.error('❌ Request timed out');
      req.destroy();
      resolve(null);
    });
    
    req.write(body);
    req.end();
  });
}

async function checkHealth(): Promise<boolean> {
  const healthEndpoint = MODAL_ENDPOINT.replace('api-generate', 'health');
  
  return new Promise((resolve) => {
    https.get({
      hostname: healthEndpoint,
      path: '/',
      timeout: 10000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`✅ Health check: ${response.status}`);
          resolve(true);
        } catch {
          console.log(`⚠️ Health check response: ${data}`);
          resolve(false);
        }
      });
    }).on('error', () => {
      console.log('⚠️ Service not responding (may need cold start)');
      resolve(false);
    });
  });
}

function printUsage() {
  console.log(`
LTX-Video Generation on Modal

Usage:
  npx tsx scripts/generate-video-modal.ts --prompt "Your prompt" [options]

Options:
  --prompt, -p       Text prompt for video generation (required)
  --output, -o       Output file path (default: output_video.mp4)
  --frames, -f       Number of frames (default: 49, ~2s at 24fps)
  --width, -w        Video width (default: 768)
  --height, -h       Video height (default: 512)
  --steps, -s        Inference steps (default: 50)
  --guidance, -g     Guidance scale (default: 7.5)
  --fps              Frames per second (default: 24)
  --health           Check service health
  --help             Show this help

Examples:
  # Generate a 2-second landscape video
  npx tsx scripts/generate-video-modal.ts \\
    --prompt "A serene mountain landscape with flowing water" \\
    --output public/assets/video/landscape.mp4

  # Generate a longer video (4 seconds)
  npx tsx scripts/generate-video-modal.ts \\
    --prompt "A futuristic city at night with neon lights" \\
    --frames 97 \\
    --output city.mp4

  # High quality generation
  npx tsx scripts/generate-video-modal.ts \\
    --prompt "Professional product showcase" \\
    --steps 75 \\
    --guidance 10 \\
    --output product.mp4

Duration Guide:
  49 frames  = ~2 seconds
  73 frames  = ~3 seconds
  97 frames  = ~4 seconds
  121 frames = ~5 seconds

Note: First request after idle may take 1-2 minutes for cold start.
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    printUsage();
    return;
  }

  if (args.includes('--health')) {
    await checkHealth();
    return;
  }

  // Parse arguments
  const promptIdx = args.findIndex(a => a === '--prompt' || a === '-p');
  const outputIdx = args.findIndex(a => a === '--output' || a === '-o');
  const framesIdx = args.findIndex(a => a === '--frames' || a === '-f');
  const widthIdx = args.findIndex(a => a === '--width' || a === '-w');
  const heightIdx = args.findIndex(a => a === '--height' || a === '-h');
  const stepsIdx = args.findIndex(a => a === '--steps' || a === '-s');
  const guidanceIdx = args.findIndex(a => a === '--guidance' || a === '-g');
  const fpsIdx = args.findIndex(a => a === '--fps');

  if (promptIdx === -1) {
    console.error('❌ --prompt is required');
    process.exit(1);
  }

  const options: GenerateVideoOptions = {
    prompt: args[promptIdx + 1],
    outputPath: outputIdx !== -1 ? args[outputIdx + 1] : 'output_video.mp4',
    numFrames: framesIdx !== -1 ? parseInt(args[framesIdx + 1]) : undefined,
    width: widthIdx !== -1 ? parseInt(args[widthIdx + 1]) : undefined,
    height: heightIdx !== -1 ? parseInt(args[heightIdx + 1]) : undefined,
    numInferenceSteps: stepsIdx !== -1 ? parseInt(args[stepsIdx + 1]) : undefined,
    guidanceScale: guidanceIdx !== -1 ? parseFloat(args[guidanceIdx + 1]) : undefined,
    fps: fpsIdx !== -1 ? parseInt(args[fpsIdx + 1]) : undefined,
  };

  await generateVideo(options);
}

main().catch(console.error);
