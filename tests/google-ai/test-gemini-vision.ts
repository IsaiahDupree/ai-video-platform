/**
 * Google Gemini Vision Test Script
 * Tests image understanding and analysis using Gemini models
 * Note: Gemini can analyze images but cannot generate them directly
 */

import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

interface ImageAnalysisOptions {
  imagePath: string;
  prompt: string;
  outputDir?: string;
}

async function analyzeImage(options: ImageAnalysisOptions) {
  const {
    imagePath,
    prompt,
    outputDir = './output/analysis',
  } = options;

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY environment variable is required');
  }

  console.log('🎨 Initializing Google Gemini Vision...');
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Use Gemini Pro Vision model
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  console.log(`\n📝 Prompt: "${prompt}"`);
  console.log(`🖼️  Analyzing image: ${imagePath}\n`);

  try {
    // Read and encode image
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image not found: ${imagePath}`);
    }

    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString('base64');
    const mimeType = getMimeType(imagePath);

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();

    console.log('✅ Analysis complete!\n');
    console.log('📊 Results:');
    console.log('─'.repeat(60));
    console.log(text);
    console.log('─'.repeat(60));

    // Save results
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = Date.now();
    const resultFile = path.join(outputDir, `analysis-${timestamp}.txt`);
    
    const fullResult = `Image: ${imagePath}\nPrompt: ${prompt}\n\n${text}`;
    fs.writeFileSync(resultFile, fullResult);

    console.log(`\n💾 Saved analysis to: ${resultFile}`);
    
    return text;
    
  } catch (error) {
    console.error('❌ Error analyzing image:', error);
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

async function generateDesignPrompt(description: string): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY environment variable is required');
  }

  console.log('✨ Generating design prompt with Gemini...');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an expert graphic designer specializing in notebook and journal covers.
  
Given this description: "${description}"

Generate a detailed, professional design prompt that could be used with an image generation AI (like DALL-E, Midjourney, or Stable Diffusion) to create a beautiful notebook cover.

Include:
- Color palette
- Design style (minimalist, ornate, modern, vintage, etc.)
- Key visual elements
- Mood and atmosphere
- Technical details (composition, lighting, quality)

Format as a single, detailed prompt ready to use with an image generator.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const designPrompt = response.text();

    console.log('\n📝 Generated Design Prompt:');
    console.log('─'.repeat(60));
    console.log(designPrompt);
    console.log('─'.repeat(60));

    return designPrompt;
  } catch (error) {
    console.error('❌ Error generating prompt:', error);
    throw error;
  }
}

// Test examples
async function runTests() {
  console.log('🚀 Starting Google Gemini Vision Tests\n');
  console.log('='.repeat(60));

  // Test 1: Generate design prompts for different notebook types
  console.log('\n📋 Test 1: Generating Design Prompts\n');
  
  const descriptions = [
    'A faith-based prayer journal with peaceful, inspirational aesthetic',
    'A minimalist productivity planner for entrepreneurs',
    'A colorful teacher planner with educational themes',
  ];

  for (const desc of descriptions) {
    console.log(`\n🎯 Description: "${desc}"`);
    await generateDesignPrompt(desc);
    console.log('\n' + '─'.repeat(60));
  }

  console.log('\n' + '='.repeat(60));

  // Test 2: Analyze existing images (if any exist)
  console.log('\n📋 Test 2: Image Analysis\n');
  
  const testImagePath = './test-images/sample-cover.jpg';
  
  if (fs.existsSync(testImagePath)) {
    await analyzeImage({
      imagePath: testImagePath,
      prompt: 'Analyze this notebook cover design. Describe the colors, style, mood, and target audience. Suggest improvements.',
      outputDir: './output/analysis',
    });
  } else {
    console.log('⚠️  No test images found. Place sample images in ./test-images/ to test analysis.');
    console.log('   Expected: ./test-images/sample-cover.jpg');
  }

  console.log('\n🎉 All tests completed!\n');
}

// Run if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { analyzeImage, generateDesignPrompt };
export type { ImageAnalysisOptions };
