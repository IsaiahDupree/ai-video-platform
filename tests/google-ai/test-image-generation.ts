/**
 * Google Imagen API Test Script
 * Tests image generation using Google's Imagen model
 */

import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

  console.log('🎨 Initializing Google Generative AI...');
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Use Imagen 3 model
  const model = genAI.getGenerativeModel({ model: 'imagen-3.0-generate-001' });

  console.log(`\n📝 Prompt: "${prompt}"`);
  console.log(`🖼️  Generating ${numberOfImages} image(s) with aspect ratio ${aspectRatio}...\n`);

  try {
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 4096,
      },
    });

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const response = result.response;
    const candidates = response.candidates;

    if (!candidates || candidates.length === 0) {
      console.error('❌ No images generated');
      return;
    }

    console.log('✅ Image generation successful!\n');

    // Process and save images
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const parts = candidate.content.parts;

      for (let j = 0; j < parts.length; j++) {
        const part = parts[j];
        
        if (part.inlineData) {
          const timestamp = Date.now();
          const filename = `generated-${timestamp}-${i}-${j}.png`;
          const filepath = path.join(outputDir, filename);

          // Decode base64 and save
          const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
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
  console.log('🚀 Starting Google Imagen Tests\n');
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
