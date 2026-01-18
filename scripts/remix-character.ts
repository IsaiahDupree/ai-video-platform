#!/usr/bin/env npx tsx
/**
 * Character Remix Script
 * 
 * Takes a base character image and generates scene-aligned variations
 * using OpenAI image generation while maintaining character consistency.
 * 
 * Usage:
 *   npx tsx scripts/remix-character.ts --base <image_path> --transcript <transcript_file>
 *   npx tsx scripts/remix-character.ts --base <image_path> --brief <brief_file>
 *   npx tsx scripts/remix-character.ts --base <image_path> --scenes "scene1|scene2|scene3"
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
}

interface SceneDescription {
  id: string;
  action: string;
  emotion: string;
  context: string;
  voiceover?: string;
}

interface CharacterProfile {
  name: string;
  description: string;
  style: string;
  traits: string[];
}

interface RemixResult {
  scene_id: string;
  prompt: string;
  image_path: string;
  success: boolean;
  error?: string;
}

/**
 * Make OpenAI API request
 */
function openaiRequest(endpoint: string, body: object): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set');
  }

  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: endpoint,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
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
              reject(new Error(parsed.error.message || 'API error'));
            } else {
              resolve(parsed);
            }
          } catch {
            reject(new Error('Failed to parse API response'));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Download file from URL
 */
function downloadFile(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        https.get(response.headers.location!, (redirectRes) => {
          redirectRes.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }
    }).on('error', reject);
  });
}

/**
 * Analyze a base image to extract character description
 */
async function analyzeBaseImage(imagePath: string): Promise<CharacterProfile> {
  console.log(`\n🔍 Analyzing base image: ${imagePath}`);
  
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
  
  const response = await openaiRequest('/v1/chat/completions', {
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert at analyzing character images for consistent regeneration.
Extract detailed visual traits that can be used to recreate this character in different scenes.
Focus on: physical features, clothing, art style, color palette, distinctive elements.
Be specific enough that another image generator can recreate this character consistently.`
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
          {
            type: 'text',
            text: `Analyze this character image and provide a JSON response with:
{
  "name": "descriptive name for this character",
  "description": "detailed physical description (2-3 sentences)",
  "style": "art style description (illustration type, line quality, coloring)",
  "traits": ["trait1", "trait2", ...] // 5-8 key visual identifiers
}`
          }
        ],
      }
    ],
    max_tokens: 500,
  });

  const content = response.choices?.[0]?.message?.content || '';
  
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

/**
 * Generate scene descriptions from a transcript
 */
async function generateScenesFromTranscript(
  transcript: string,
  characterProfile: CharacterProfile
): Promise<SceneDescription[]> {
  console.log(`\n📝 Generating scenes from transcript...`);
  
  const response = await openaiRequest('/v1/chat/completions', {
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a video director planning scenes for an animated video.
Given a transcript, break it into visual scenes featuring a specific character.
Each scene should describe what the character is DOING and their EMOTION.
Make scenes visually interesting and varied while keeping the character consistent.`
      },
      {
        role: 'user',
        content: `Character: ${characterProfile.description}

Transcript:
${transcript}

Generate 4-8 scenes as JSON array. Each scene should have:
- id: unique scene identifier (e.g., "scene_1")
- action: what the character is doing (specific pose, gesture, activity)
- emotion: character's emotional state (happy, explaining, curious, excited, etc.)
- context: background/environment description
- voiceover: the transcript segment for this scene

Return JSON array only.`
      }
    ],
    max_tokens: 1500,
  });

  const content = response.choices?.[0]?.message?.content || '';
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse scene generation response');
  }
  
  const scenes = JSON.parse(jsonMatch[0]) as SceneDescription[];
  console.log(`✅ Generated ${scenes.length} scenes`);
  
  return scenes;
}

/**
 * Generate scenes from a brief file
 */
async function generateScenesFromBrief(briefPath: string): Promise<SceneDescription[]> {
  console.log(`\n📋 Loading scenes from brief: ${briefPath}`);
  
  const brief = JSON.parse(fs.readFileSync(briefPath, 'utf-8'));
  const scenes: SceneDescription[] = [];
  
  for (const section of brief.sections || []) {
    scenes.push({
      id: section.id,
      action: section.visuals?.action || 'standing neutral',
      emotion: section.voiceover?.emotion || 'neutral',
      context: section.visuals?.background || 'simple background',
      voiceover: section.voiceover?.text,
    });
  }
  
  console.log(`✅ Loaded ${scenes.length} scenes from brief`);
  return scenes;
}

/**
 * Build a consistent prompt for character in a specific scene
 */
function buildScenePrompt(
  characterProfile: CharacterProfile,
  scene: SceneDescription
): string {
  const traitString = characterProfile.traits.join(', ');
  
  const prompt = `${characterProfile.style} illustration of ${characterProfile.description}

Character is: ${scene.action}
Expression/Emotion: ${scene.emotion}
Setting: ${scene.context}

IMPORTANT: Maintain these exact character traits: ${traitString}

Style: Clean, consistent with reference, suitable for video content. Single character focus.`;

  return prompt;
}

/**
 * Generate a scene image using OpenAI DALL-E
 */
async function generateSceneImage(
  prompt: string,
  sceneId: string,
  outputDir: string
): Promise<string> {
  const response = await openaiRequest('/v1/images/generations', {
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
  });

  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error('No image URL in response');
  }

  // Download and save image
  const outputPath = path.join(outputDir, `${sceneId}.png`);
  await downloadFile(imageUrl, outputPath);
  
  return outputPath;
}

/**
 * Main remix pipeline
 */
async function remixCharacter(options: {
  basePath: string;
  transcriptPath?: string;
  briefPath?: string;
  scenes?: string[];
  outputDir?: string;
}): Promise<RemixResult[]> {
  const { basePath, transcriptPath, briefPath, scenes: manualScenes, outputDir } = options;
  
  // Validate inputs
  if (!fs.existsSync(basePath)) {
    throw new Error(`Base image not found: ${basePath}`);
  }
  
  // Setup output directory
  const outDir = outputDir || path.join('public/assets/scenes', path.basename(basePath, path.extname(basePath)));
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  
  console.log(`\n🎨 Character Remix Pipeline`);
  console.log(`   Base Image: ${basePath}`);
  console.log(`   Output Dir: ${outDir}`);
  
  // Step 1: Analyze base image
  const characterProfile = await analyzeBaseImage(basePath);
  
  // Save character profile for reference
  const profilePath = path.join(outDir, 'character_profile.json');
  fs.writeFileSync(profilePath, JSON.stringify(characterProfile, null, 2));
  
  // Step 2: Get scene descriptions
  let scenes: SceneDescription[] = [];
  
  if (briefPath && fs.existsSync(briefPath)) {
    scenes = await generateScenesFromBrief(briefPath);
  } else if (transcriptPath && fs.existsSync(transcriptPath)) {
    const transcript = fs.readFileSync(transcriptPath, 'utf-8');
    scenes = await generateScenesFromTranscript(transcript, characterProfile);
  } else if (manualScenes && manualScenes.length > 0) {
    scenes = manualScenes.map((desc, i) => ({
      id: `scene_${i + 1}`,
      action: desc,
      emotion: 'neutral',
      context: 'simple clean background',
    }));
  } else {
    // Default demo scenes
    scenes = [
      { id: 'intro', action: 'waving hello, friendly greeting pose', emotion: 'happy', context: 'clean gradient background' },
      { id: 'explaining', action: 'pointing at something, teaching gesture', emotion: 'explaining', context: 'with a whiteboard or diagram' },
      { id: 'thinking', action: 'hand on chin, contemplating', emotion: 'curious', context: 'soft lighting, minimal background' },
      { id: 'excited', action: 'arms raised in celebration', emotion: 'excited', context: 'confetti or celebration elements' },
      { id: 'outro', action: 'thumbs up, encouraging pose', emotion: 'confident', context: 'clean professional background' },
    ];
    console.log(`\n⚠️  No transcript/brief provided, using demo scenes`);
  }
  
  // Save scenes for reference
  const scenesPath = path.join(outDir, 'scenes.json');
  fs.writeFileSync(scenesPath, JSON.stringify(scenes, null, 2));
  
  // Step 3: Generate images for each scene
  console.log(`\n🖼️  Generating ${scenes.length} scene images...`);
  const results: RemixResult[] = [];
  
  for (const scene of scenes) {
    const prompt = buildScenePrompt(characterProfile, scene);
    console.log(`\n   Scene: ${scene.id}`);
    console.log(`   Action: ${scene.action}`);
    
    try {
      const imagePath = await generateSceneImage(prompt, scene.id, outDir);
      console.log(`   ✅ Generated: ${imagePath}`);
      
      results.push({
        scene_id: scene.id,
        prompt,
        image_path: imagePath,
        success: true,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.log(`   ❌ Failed: ${errorMsg}`);
      
      results.push({
        scene_id: scene.id,
        prompt,
        image_path: '',
        success: false,
        error: errorMsg,
      });
    }
    
    // Rate limiting pause
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Save results manifest
  const manifestPath = path.join(outDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({
    base_image: basePath,
    character_profile: characterProfile,
    scenes: results,
    generated_at: new Date().toISOString(),
  }, null, 2));
  
  // Summary
  const successful = results.filter(r => r.success).length;
  console.log(`\n📊 Summary`);
  console.log(`   Total scenes: ${scenes.length}`);
  console.log(`   Successful: ${successful}`);
  console.log(`   Failed: ${scenes.length - successful}`);
  console.log(`   Output: ${outDir}`);
  console.log(`   Manifest: ${manifestPath}`);
  
  return results;
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);
  
  const getArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : undefined;
  };
  
  const basePath = getArg('--base');
  const transcriptPath = getArg('--transcript');
  const briefPath = getArg('--brief');
  const scenesArg = getArg('--scenes');
  const outputDir = getArg('--output');
  
  if (!basePath) {
    console.log(`
Character Remix - Generate scene-aligned character variations

Usage:
  npx ts-node scripts/remix-character.ts --base <image_path> [options]

Options:
  --base <path>        Base character image (required)
  --transcript <path>  Transcript file to generate scenes from
  --brief <path>       Brief JSON file with scene definitions
  --scenes "a|b|c"     Pipe-separated scene descriptions
  --output <path>      Output directory for generated images

Examples:
  # From transcript
  npx ts-node scripts/remix-character.ts --base char.png --transcript script.txt

  # From brief
  npx ts-node scripts/remix-character.ts --base char.png --brief data/briefs/explainer.json

  # Manual scenes
  npx ts-node scripts/remix-character.ts --base char.png --scenes "waving hello|pointing at chart|celebrating"
`);
    process.exit(1);
  }
  
  const scenes = scenesArg ? scenesArg.split('|') : undefined;
  
  try {
    await remixCharacter({
      basePath,
      transcriptPath,
      briefPath,
      scenes,
      outputDir,
    });
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

export { remixCharacter, analyzeBaseImage, generateScenesFromTranscript, buildScenePrompt };
