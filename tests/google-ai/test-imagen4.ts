/**
 * Google Imagen 4 Test Script
 * Tests image generation using Google's Imagen 4 model
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

interface ImageGenerationOptions {
  prompt: string;
  numberOfImages?: number;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  outputDir?: string;
}

async function generateImage(options: ImageGenerationOptions) {
  const {
    prompt,
    numberOfImages = 1,
    aspectRatio = '1:1',
    outputDir = './output/images',
  } = options;

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY environment variable is required');
  }

  console.log('🎨 Initializing Imagen 4...');
  console.log(`\n📝 Prompt: "${prompt}"`);
  console.log(`🖼️  Generating ${numberOfImages} image(s) with aspect ratio ${aspectRatio}...\n`);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
    
    const requestBody = {
      instances: [{
        prompt: prompt,
      }],
      parameters: {
        sampleCount: numberOfImages,
        aspectRatio: aspectRatio,
        safetyFilterLevel: 'block_some',
        personGeneration: 'allow_adult',
      }
    };

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

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('✅ Image generation successful!\n');

    // Process and save images
    if (result.predictions) {
      for (let i = 0; i < result.predictions.length; i++) {
        const prediction = result.predictions[i];
        
        if (prediction.bytesBase64Encoded) {
          const timestamp = Date.now();
          const filename = `imagen4-${timestamp}-${i}.png`;
          const filepath = path.join(outputDir, filename);

          // Decode base64 and save
          const imageBuffer = Buffer.from(prediction.bytesBase64Encoded, 'base64');
          fs.writeFileSync(filepath, imageBuffer);

          console.log(`💾 Saved: ${filepath}`);
          console.log(`   Size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
        }
      }
    }

    console.log('\n✨ Image generation complete!');
    
  } catch (error) {
    console.error('❌ Error generating image:', error);
    throw error;
  }
}

// Test examples
async function runTests() {
  console.log('🚀 Starting Imagen 4 Tests\n');
  console.log('='.repeat(60));

  // Test 1: Simple notebook cover design
  await generateImage({
    prompt: 'A minimalist notebook cover design with geometric patterns in navy blue and gold, modern and elegant, high quality product photography',
    numberOfImages: 1,
    aspectRatio: '3:4',
    outputDir: './output/images/test1-notebook-cover',
  });

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Faith-based journal cover
  await generateImage({
    prompt: 'A serene faith-based journal cover with watercolor mountains at sunrise, soft pastel colors, inspirational and peaceful aesthetic, professional product design',
    numberOfImages: 1,
    aspectRatio: '3:4',
    outputDir: './output/images/test2-faith-journal',
  });

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: Teacher planner cover
  await generateImage({
    prompt: 'A vibrant teacher planner cover with colorful pencils, books, and apple illustrations, cheerful and organized aesthetic, modern flat design style',
    numberOfImages: 1,
    aspectRatio: '3:4',
    outputDir: './output/images/test3-teacher-planner',
  });

  console.log('\n🎉 All tests completed!\n');
}

// Run if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { generateImage };
export type { ImageGenerationOptions };
