/**
 * Google Veo API Test Script
 * Tests video generation using Google's Veo model with before/after frames
 */

import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

interface VideoGenerationOptions {
  prompt: string;
  beforeFrame?: string; // Path to before image
  afterFrame?: string; // Path to after image
  duration?: number; // Duration in seconds
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

  console.log('🎬 Initializing Google Generative AI for Video...');
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Use Veo model for video generation
  const model = genAI.getGenerativeModel({ model: 'veo-001' });

  console.log(`\n📝 Prompt: "${prompt}"`);
  console.log(`⏱️  Duration: ${duration} seconds`);
  
  if (beforeFrame) {
    console.log(`🖼️  Before frame: ${beforeFrame}`);
  }
  if (afterFrame) {
    console.log(`🖼️  After frame: ${afterFrame}`);
  }
  
  console.log('\n🎥 Generating video...\n');

  try {
    const parts: any[] = [{ text: prompt }];

    // Add before frame if provided
    if (beforeFrame && fs.existsSync(beforeFrame)) {
      const beforeImageData = fs.readFileSync(beforeFrame);
      const beforeBase64 = beforeImageData.toString('base64');
      const mimeType = getMimeType(beforeFrame);
      
      parts.push({
        inlineData: {
          data: beforeBase64,
          mimeType: mimeType,
        },
      });
      
      parts.push({
        text: '[START FRAME - transition from this image]',
      });
    }

    // Add after frame if provided
    if (afterFrame && fs.existsSync(afterFrame)) {
      const afterImageData = fs.readFileSync(afterFrame);
      const afterBase64 = afterImageData.toString('base64');
      const mimeType = getMimeType(afterFrame);
      
      parts.push({
        text: '[END FRAME - transition to this image]',
      });
      
      parts.push({
        inlineData: {
          data: afterBase64,
          mimeType: mimeType,
        },
      });
    }

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: parts,
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const response = result.response;
    const candidates = response.candidates;

    if (!candidates || candidates.length === 0) {
      console.error('❌ No video generated');
      return;
    }

    console.log('✅ Video generation successful!\n');

    // Process and save videos
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const parts = candidate.content.parts;

      for (let j = 0; j < parts.length; j++) {
        const part = parts[j];
        
        if (part.inlineData && part.inlineData.mimeType.startsWith('video/')) {
          const timestamp = Date.now();
          const extension = getExtensionFromMimeType(part.inlineData.mimeType);
          const filename = `generated-${timestamp}-${i}-${j}.${extension}`;
          const filepath = path.join(outputDir, filename);

          // Decode base64 and save
          const videoBuffer = Buffer.from(part.inlineData.data, 'base64');
          fs.writeFileSync(filepath, videoBuffer);

          console.log(`💾 Saved: ${filepath}`);
          console.log(`   Size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);
          console.log(`   Duration: ~${duration}s`);
        }
      }
    }

    console.log('\n✨ Video generation complete!');
    
  } catch (error) {
    console.error('❌ Error generating video:', error);
    throw error;
  }
}

function getMimeType(filepath: string): string {
  const ext = path.extname(filepath).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  return mimeTypes[ext] || 'image/jpeg';
}

function getExtensionFromMimeType(mimeType: string): string {
  const extensions: { [key: string]: string } = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
  };
  return extensions[mimeType] || 'mp4';
}

// Test examples
async function runTests() {
  console.log('🚀 Starting Google Veo Video Generation Tests\n');
  console.log('='.repeat(60));

  // Test 1: Text-to-video (no frames)
  await generateVideo({
    prompt: 'A smooth camera pan across a beautifully designed notebook cover with elegant typography and subtle texture details, professional product showcase lighting',
    duration: 5,
    outputDir: './output/videos/test1-product-showcase',
  });

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Before/after transition (if frames exist)
  const beforeFramePath = './output/images/test1-notebook-cover/before.png';
  const afterFramePath = './output/images/test1-notebook-cover/after.png';

  if (fs.existsSync(beforeFramePath) && fs.existsSync(afterFramePath)) {
    await generateVideo({
      prompt: 'Smooth morphing transition between two notebook cover designs, elegant and professional transformation',
      beforeFrame: beforeFramePath,
      afterFrame: afterFramePath,
      duration: 3,
      outputDir: './output/videos/test2-before-after',
    });
  } else {
    console.log('⚠️  Skipping before/after test - frame images not found');
    console.log('   Create before.png and after.png in ./output/images/test1-notebook-cover/');
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: Animated notebook opening
  await generateVideo({
    prompt: 'A cinematic shot of a premium notebook slowly opening to reveal beautifully designed interior pages, soft lighting, shallow depth of field',
    duration: 4,
    outputDir: './output/videos/test3-notebook-opening',
  });

  console.log('\n🎉 All video tests completed!\n');
}

// Run if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { generateVideo };
export type { VideoGenerationOptions };
