/**
 * Google Veo 3 Test Script
 * Tests video generation using Google's Veo 3 model with before/after frames
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

interface VideoGenerationOptions {
  prompt: string;
  beforeFrame?: string;
  afterFrame?: string;
  duration?: number;
  outputDir?: string;
}

async function generateVideo(options: VideoGenerationOptions) {
  const {
    prompt,
    beforeFrame,
    afterFrame,
    duration = 5,
    outputDir = './output/videos',
  } = options;

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY environment variable is required');
  }

  console.log('🎬 Initializing Veo 3...');
  console.log(`\n📝 Prompt: "${prompt}"`);
  console.log(`⏱️  Duration: ${duration} seconds`);
  
  if (beforeFrame) {
    console.log(`🖼️  Before frame: ${beforeFrame}`);
  }
  if (afterFrame) {
    console.log(`🖼️  After frame: ${afterFrame}`);
  }
  
  console.log('\n🎥 Generating video (this may take a few minutes)...\n');

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-fast-generate-001:predictLongRunning?key=${apiKey}`;
    
    const requestBody: any = {
      instances: [{
        prompt: prompt,
      }],
      parameters: {
        aspectRatio: '16:9',
      }
    };

    // Add before/after frames if provided
    if (beforeFrame && fs.existsSync(beforeFrame)) {
      const beforeImageData = fs.readFileSync(beforeFrame);
      const beforeBase64 = beforeImageData.toString('base64');
      requestBody.instances[0].startImage = {
        bytesBase64Encoded: beforeBase64,
      };
    }

    if (afterFrame && fs.existsSync(afterFrame)) {
      const afterImageData = fs.readFileSync(afterFrame);
      const afterBase64 = afterImageData.toString('base64');
      requestBody.instances[0].endImage = {
        bytesBase64Encoded: afterBase64,
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const result = await response.json() as any;

    console.log('📊 Response received:', JSON.stringify(result, null, 2));

    // Veo uses long-running operations, so we get an operation name
    if (result.name) {
      console.log(`\n⏳ Video generation started!`);
      console.log(`   Operation: ${result.name}`);
      console.log(`\n⚠️  Note: Veo 3 uses long-running operations.`);
      console.log(`   You would need to poll the operation status to get the final video.`);
      console.log(`   For production use, implement operation polling.`);
    }

    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save operation info
    const timestamp = Date.now();
    const infoFile = path.join(outputDir, `veo3-operation-${timestamp}.json`);
    fs.writeFileSync(infoFile, JSON.stringify(result, null, 2));
    console.log(`\n💾 Operation info saved: ${infoFile}`);

    console.log('\n✨ Video generation initiated!');
    
  } catch (error) {
    console.error('❌ Error generating video:', error);
    throw error;
  }
}

// Test examples
async function runTests() {
  console.log('🚀 Starting Veo 3 Video Generation Tests\n');
  console.log('='.repeat(60));

  // Test 1: Text-to-video (no frames)
  await generateVideo({
    prompt: 'A smooth camera pan across a beautifully designed notebook cover with elegant typography and subtle texture details, professional product showcase lighting, cinematic quality',
    duration: 5,
    outputDir: './output/videos/test1-product-showcase',
  });

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Animated notebook opening
  await generateVideo({
    prompt: 'A cinematic shot of a premium notebook slowly opening to reveal beautifully designed interior pages with elegant layouts, soft natural lighting, shallow depth of field, professional product videography',
    duration: 4,
    outputDir: './output/videos/test2-notebook-opening',
  });

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: Rotating product showcase
  await generateVideo({
    prompt: 'Smooth 360-degree rotation of a luxury notebook on a minimalist white surface, showcasing the cover design and binding details, studio lighting, high-end product commercial style',
    duration: 5,
    outputDir: './output/videos/test3-product-rotation',
  });

  console.log('\n' + '='.repeat(60));
  console.log('\n🎉 All video tests completed!\n');
  console.log('⚠️  Note: Veo 3 requires billing enabled and uses long-running operations.');
  console.log('   Check the operation status to retrieve the final videos.');
}

// Run if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { generateVideo };
export type { VideoGenerationOptions };
