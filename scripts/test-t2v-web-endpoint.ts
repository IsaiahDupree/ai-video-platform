/**
 * Test script for T2V-008: T2V Web Endpoint
 *
 * Tests the FastAPI/web endpoint for LTX-Video generation
 *
 * Usage:
 *   npx tsx scripts/test-t2v-web-endpoint.ts
 */

import fs from 'fs';
import path from 'path';

interface VideoGenerationRequest {
  prompt: string;
  negative_prompt?: string;
  num_frames?: number;
  fps?: number;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  seed?: number;
}

interface VideoGenerationResponse {
  video: string; // base64 encoded
  format: string;
  num_frames: number;
  fps: number;
  width: number;
  height: number;
  prompt: string;
}

async function testWebEndpoint() {
  console.log('Testing T2V Web Endpoint (T2V-008)');
  console.log('=====================================\n');

  // Note: Replace this with your actual Modal endpoint URL
  // After deploying with `modal deploy scripts/modal_ltx_video.py`
  // Modal will provide a URL like: https://yourworkspace--ltx-video-generate-video-endpoint.modal.run
  const ENDPOINT_URL = process.env.LTX_VIDEO_WEB_ENDPOINT || 'https://example.modal.run';

  if (ENDPOINT_URL === 'https://example.modal.run') {
    console.log('⚠️  WARNING: Using placeholder endpoint URL');
    console.log('Set LTX_VIDEO_WEB_ENDPOINT environment variable to test against real endpoint');
    console.log('\nTo deploy and get your endpoint URL:');
    console.log('  1. modal deploy scripts/modal_ltx_video.py');
    console.log('  2. Copy the web endpoint URL from the output');
    console.log('  3. export LTX_VIDEO_WEB_ENDPOINT="<your-url>"\n');
  }

  const testRequest: VideoGenerationRequest = {
    prompt: 'A cat playing piano in a cozy room, cinematic lighting',
    negative_prompt: 'blurry, low quality, distorted',
    num_frames: 24,
    fps: 8,
    width: 512,
    height: 512,
    num_inference_steps: 50,
    guidance_scale: 7.5,
    seed: 42,
  };

  console.log('Request parameters:');
  console.log(JSON.stringify(testRequest, null, 2));
  console.log('\nSending request...');

  try {
    const response = await fetch(ENDPOINT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json() as VideoGenerationResponse;

    console.log('\n✅ Response received successfully!');
    console.log('\nResponse metadata:');
    console.log(`  Format: ${result.format}`);
    console.log(`  Frames: ${result.num_frames}`);
    console.log(`  FPS: ${result.fps}`);
    console.log(`  Resolution: ${result.width}x${result.height}`);
    console.log(`  Prompt: ${result.prompt}`);
    console.log(`  Video data length: ${result.video.length} characters (base64)`);

    // Decode base64 and save video
    const videoBuffer = Buffer.from(result.video, 'base64');
    const outputDir = path.join(process.cwd(), 'output');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `test_web_endpoint_${Date.now()}.mp4`);
    fs.writeFileSync(outputPath, videoBuffer);

    console.log(`\n✅ Video saved to: ${outputPath}`);
    console.log(`   Size: ${(videoBuffer.length / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error('\n❌ Error testing endpoint:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    } else {
      console.error(error);
    }

    if (ENDPOINT_URL === 'https://example.modal.run') {
      console.log('\n💡 Tip: Make sure to set up your Modal endpoint first!');
    }
  }
}

// Run the test
testWebEndpoint().catch(console.error);
