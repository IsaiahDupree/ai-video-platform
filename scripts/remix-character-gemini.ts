#!/usr/bin/env npx tsx
/**
 * Character Remix using Google Gemini (Nano Banana)
 * 
 * Uses Gemini's native character consistency to generate scene-aligned
 * character variations from a base image.
 * 
 * Usage:
 *   npx tsx scripts/remix-character-gemini.ts --base <image_path> [options]
 * 
 * Options:
 *   --base <path>        Base character image (required)
 *   --brief <path>       Brief JSON file with scene definitions
 *   --scenes "a|b|c"     Pipe-separated scene descriptions
 *   --output <path>      Output directory for generated images
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

interface SceneDescription {
  id: string;
  action: string;
  emotion: string;
  context: string;
}

interface CharacterProfile {
  name: string;
  description: string;
  style: string;
  traits: string[];
}

interface GeneratedScene {
  id: string;
  prompt: string;
  imagePath: string;
}

// Gemini API request helper
function geminiRequest(body: object): Promise<any> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY not set in .env.local');
  }

  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    
    const req = https.request(
      {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let responseData = '';
        res.on('data', (chunk) => (responseData += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            if (parsed.error) {
              reject(new Error(parsed.error.message || 'Gemini API error'));
            } else {
              resolve(parsed);
            }
          } catch (e) {
            reject(new Error(`Failed to parse Gemini response: ${responseData.substring(0, 200)}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Gemini API Image Generation using gemini-2.0-flash-exp with image output
async function vertexAIImageRequest(
  prompt: string, 
  referenceImageBase64: string, 
  mimeType: string
): Promise<any> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY not set in .env.local');
  }

  // Build request with reference image for character consistency
  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: referenceImageBase64
            }
          },
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT']
    }
  };

  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    
    // Use Gemini API with gemini-2.0-flash-exp for image generation
    const req = https.request(
      {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let responseData = '';
        res.on('data', (chunk) => (responseData += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            if (parsed.error) {
              reject(new Error(parsed.error.message || 'Gemini API error'));
            } else {
              resolve(parsed);
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${responseData.substring(0, 500)}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Analyze base image to extract character traits
async function analyzeBaseImage(imagePath: string): Promise<CharacterProfile> {
  console.log(`\n🔍 Analyzing base image with Gemini: ${imagePath}`);
  
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
  
  const response = await geminiRequest({
    contents: [
      {
        parts: [
          {
            text: `Analyze this character image for consistent regeneration.
Extract detailed visual traits that can be used to recreate this character in different scenes.
Focus on: physical features, clothing, art style, color palette, distinctive elements.

Return a JSON response with:
{
  "name": "descriptive name for this character",
  "description": "detailed physical description (2-3 sentences)",
  "style": "art style description (illustration type, line quality, coloring)",
  "traits": ["trait1", "trait2", ...] // 5-8 key visual identifiers
}

Return ONLY the JSON, no other text.`
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image
            }
          }
        ]
      }
    ]
  });

  const content = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse character analysis response');
  }
  
  const profile = JSON.parse(jsonMatch[0]) as CharacterProfile;
  console.log(`✅ Character analyzed: "${profile.name}"`);
  console.log(`   Style: ${profile.style}`);
  console.log(`   Traits: ${profile.traits.join(', ')}`);
  
  return profile;
}

// Generate scenes from brief
function generateScenesFromBrief(briefPath: string): SceneDescription[] {
  console.log(`\n📋 Loading scenes from brief: ${briefPath}`);
  
  const brief = JSON.parse(fs.readFileSync(briefPath, 'utf-8'));
  const scenes: SceneDescription[] = [];
  
  for (const section of brief.sections || []) {
    scenes.push({
      id: section.id,
      action: section.content?.heading || section.content?.title || 'standing neutral',
      emotion: 'friendly',
      context: section.content?.body_text || 'simple background'
    });
  }
  
  console.log(`✅ Loaded ${scenes.length} scenes from brief`);
  return scenes;
}

// Parse manual scenes
function parseManualScenes(scenesString: string): SceneDescription[] {
  return scenesString.split('|').map((scene, index) => ({
    id: `scene_${index + 1}`,
    action: scene.trim(),
    emotion: 'neutral',
    context: 'simple clean background'
  }));
}

// Build prompt for scene generation with character consistency
function buildScenePrompt(
  characterProfile: CharacterProfile,
  scene: SceneDescription
): string {
  return `Generate an image of this exact same character in a new pose/scene.

CHARACTER TO MAINTAIN (keep identical):
${characterProfile.description}
Style: ${characterProfile.style}
Key traits that MUST be preserved: ${characterProfile.traits.join(', ')}

NEW SCENE:
Action: ${scene.action}
Emotion: ${scene.emotion}
Context/Background: ${scene.context}

IMPORTANT: The character must look EXACTLY like the reference image - same colors, same style, same features. Only change the pose and background to match the scene description.`;
}

// Generate scene image using Gemini
async function generateSceneImage(
  prompt: string,
  referenceImageBase64: string,
  mimeType: string,
  sceneId: string,
  outputDir: string
): Promise<string> {
  try {
    const response = await vertexAIImageRequest(prompt, referenceImageBase64, mimeType);
    
    // Debug: log response structure
    console.log(`   📦 Response keys: ${Object.keys(response).join(', ')}`);
    
    // Check for Gemini-style response with inline_data or inlineData
    const parts = response.candidates?.[0]?.content?.parts || [];
    console.log(`   📦 Parts count: ${parts.length}`);
    
    for (const part of parts) {
      // Check various possible image data locations
      const imageData = part.inline_data?.data || part.inlineData?.data;
      if (imageData) {
        const imageBuffer = Buffer.from(imageData, 'base64');
        const outputPath = path.join(outputDir, `${sceneId}.png`);
        fs.writeFileSync(outputPath, imageBuffer);
        return outputPath;
      }
      
      // Log what we found
      if (part.text) {
        console.log(`   📝 Text: ${part.text.substring(0, 80)}...`);
      }
    }
    
    // Check predictions format (Imagen style)
    const predictions = response.predictions || [];
    if (predictions.length > 0 && predictions[0].bytesBase64Encoded) {
      const imageBuffer = Buffer.from(predictions[0].bytesBase64Encoded, 'base64');
      const outputPath = path.join(outputDir, `${sceneId}.png`);
      fs.writeFileSync(outputPath, imageBuffer);
      return outputPath;
    }
    
    throw new Error('No image data in response');
  } catch (error: any) {
    throw new Error(`Image generation failed: ${error.message}`);
  }
}

// Main pipeline
async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  let basePath = '';
  let briefPath = '';
  let scenesString = '';
  let outputDir = '';
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--base' && args[i + 1]) {
      basePath = args[++i];
    } else if (args[i] === '--brief' && args[i + 1]) {
      briefPath = args[++i];
    } else if (args[i] === '--scenes' && args[i + 1]) {
      scenesString = args[++i];
    } else if (args[i] === '--output' && args[i + 1]) {
      outputDir = args[++i];
    }
  }
  
  // Validate inputs
  if (!basePath) {
    console.log(`
🍌 Character Remix with Nano Banana (Gemini)
============================================
Generate scene-aligned character variations using Google's Gemini API
with native character consistency.

Usage:
  npx tsx scripts/remix-character-gemini.ts --base <image_path> [options]

Options:
  --base <path>        Base character image (required)
  --brief <path>       Brief JSON file with scene definitions
  --scenes "a|b|c"     Pipe-separated scene descriptions
  --output <path>      Output directory for generated images

Examples:
  # From brief
  npx tsx scripts/remix-character-gemini.ts --base char.png --brief data/briefs/explainer.json

  # Manual scenes
  npx tsx scripts/remix-character-gemini.ts --base char.png --scenes "waving hello|pointing at chart|celebrating"

Environment:
  Requires GOOGLE_API_KEY or GEMINI_API_KEY in .env.local
`);
    process.exit(1);
  }
  
  if (!fs.existsSync(basePath)) {
    console.error(`❌ Base image not found: ${basePath}`);
    process.exit(1);
  }
  
  // Set default output directory
  if (!outputDir) {
    const baseName = path.basename(basePath, path.extname(basePath));
    outputDir = path.join('public/assets/scenes', `${baseName}_gemini`);
  }
  
  // Create output directory
  fs.mkdirSync(outputDir, { recursive: true });
  
  console.log('🍌 Character Remix with Nano Banana (Gemini)');
  console.log(`   Base Image: ${basePath}`);
  console.log(`   Output Dir: ${outputDir}`);
  
  // Load base image
  const imageBuffer = fs.readFileSync(basePath);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = basePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
  
  // Step 1: Analyze base image
  const characterProfile = await analyzeBaseImage(basePath);
  
  // Save character profile
  fs.writeFileSync(
    path.join(outputDir, 'character_profile.json'),
    JSON.stringify(characterProfile, null, 2)
  );
  
  // Step 2: Get scenes
  let scenes: SceneDescription[] = [];
  
  if (briefPath && fs.existsSync(briefPath)) {
    scenes = generateScenesFromBrief(briefPath);
  } else if (scenesString) {
    scenes = parseManualScenes(scenesString);
  } else {
    // Default demo scenes
    scenes = [
      { id: 'wave', action: 'waving hello', emotion: 'happy', context: 'simple gradient background' },
      { id: 'explain', action: 'pointing and explaining', emotion: 'thoughtful', context: 'office setting' },
      { id: 'celebrate', action: 'celebrating with arms up', emotion: 'excited', context: 'confetti background' },
      { id: 'think', action: 'thinking with hand on chin', emotion: 'curious', context: 'minimalist background' },
    ];
    console.log(`\n📋 Using default demo scenes (${scenes.length} scenes)`);
  }
  
  // Step 3: Generate scene images
  console.log(`\n🖼️  Generating ${scenes.length} scene images with Gemini...`);
  
  const results: GeneratedScene[] = [];
  let successCount = 0;
  let failCount = 0;
  
  for (const scene of scenes) {
    console.log(`\n   Scene: ${scene.id}`);
    console.log(`   Action: ${scene.action}`);
    
    const prompt = buildScenePrompt(characterProfile, scene);
    
    try {
      const imagePath = await generateSceneImage(
        prompt,
        base64Image,
        mimeType,
        scene.id,
        outputDir
      );
      console.log(`   ✅ Generated: ${imagePath}`);
      results.push({ id: scene.id, prompt, imagePath });
      successCount++;
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}`);
      failCount++;
    }
    
    // Rate limiting - wait between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Save manifest
  const manifest = {
    base_image: basePath,
    character_profile: characterProfile,
    scenes: results,
    generated_at: new Date().toISOString(),
    provider: 'gemini'
  };
  
  fs.writeFileSync(
    path.join(outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  // Summary
  console.log(`\n📊 Summary`);
  console.log(`   Total scenes: ${scenes.length}`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed: ${failCount}`);
  console.log(`   Output: ${outputDir}`);
  console.log(`   Manifest: ${path.join(outputDir, 'manifest.json')}`);
}

main().catch(console.error);
