#!/usr/bin/env npx tsx
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Explainer Video Generator
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * End-to-end pipeline for creating explainer videos with:
 * - AI-generated graphics with character consistency
 * - Voice cloning via Hugging Face IndexTTS-2
 * - Remotion video rendering
 * 
 * Usage:
 *   npx tsx scripts/generate-explainer.ts --topic "How Solar Panels Work"
 *   npx tsx scripts/generate-explainer.ts --brief data/briefs/my_explainer.json
 *   npx tsx scripts/generate-explainer.ts --script scripts/my_script.txt
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { execSync, spawn } from 'child_process';

// =============================================================================
// Types
// =============================================================================

interface CharacterConfig {
  name: string;
  description: string;
  style: string;
  seed?: number;
  reference_image?: string;
}

interface SceneContent {
  id: string;
  type: 'intro' | 'topic' | 'list_item' | 'comparison' | 'outro' | 'transition';
  duration_sec: number;
  voiceover_text: string;
  visual_prompt?: string;
  character?: string;
  emotion?: string;
}

interface ExplainerBrief {
  id: string;
  title: string;
  description: string;
  style: {
    theme: 'dark' | 'light' | 'neon' | 'minimal';
    primary_color: string;
    accent_color: string;
    art_style: string;
  };
  characters: CharacterConfig[];
  voice: {
    reference_path: string;
    default_emotion?: string;
  };
  scenes: SceneContent[];
  settings: {
    resolution: { width: number; height: number };
    fps: number;
    aspect_ratio: string;
  };
}

interface GeneratedAssets {
  voiceovers: Record<string, string>;
  images: Record<string, string>;
  character_refs: Record<string, string>;
}

// =============================================================================
// Configuration
// =============================================================================

const PROJECT_ROOT = process.cwd();
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const ASSETS_DIR = path.join(PUBLIC_DIR, 'assets');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'output', 'explainer');

const DIRECTORIES = {
  characters: path.join(ASSETS_DIR, 'characters'),
  voiceovers: path.join(ASSETS_DIR, 'audio', 'voiceover'),
  scenes: path.join(ASSETS_DIR, 'scenes'),
  voices: path.join(ASSETS_DIR, 'voices'),
};

// =============================================================================
// Character Consistency Engine
// =============================================================================

class CharacterConsistencyEngine {
  private characters: Map<string, CharacterConfig> = new Map();
  private generatedRefs: Map<string, string> = new Map();
  private artStyle: string;

  constructor(artStyle: string = 'modern flat illustration, clean lines, vibrant colors') {
    this.artStyle = artStyle;
  }

  /**
   * Register a character with consistent traits
   */
  registerCharacter(config: CharacterConfig): void {
    this.characters.set(config.name, config);
    console.log(`  📋 Registered character: ${config.name}`);
  }

  /**
   * Build a consistent prompt for a character in a specific scene
   */
  buildPrompt(characterName: string, action: string, emotion: string = 'neutral'): string {
    const char = this.characters.get(characterName);
    if (!char) {
      throw new Error(`Character "${characterName}" not registered`);
    }

    // Core character consistency prompt
    const consistencyPrefix = `${char.description}, ${char.style}`;
    
    // Emotion modifiers
    const emotionMap: Record<string, string> = {
      happy: 'smiling, cheerful expression, bright eyes',
      sad: 'downcast expression, slightly frowning',
      excited: 'wide eyes, enthusiastic pose, dynamic energy',
      curious: 'tilted head, raised eyebrow, inquisitive look',
      explaining: 'gesturing with hands, confident posture, engaged expression',
      neutral: 'calm expression, relaxed posture',
      surprised: 'wide eyes, open mouth, raised eyebrows',
      thinking: 'hand on chin, thoughtful expression, looking up slightly',
    };

    const emotionDesc = emotionMap[emotion] || emotionMap.neutral;

    // Build full prompt with consistency elements
    const prompt = [
      consistencyPrefix,
      action,
      emotionDesc,
      this.artStyle,
      'consistent character design',
      'high quality',
      'white or transparent background',
      char.seed ? `seed:${char.seed}` : '',
    ].filter(Boolean).join(', ');

    return prompt;
  }

  /**
   * Generate a character reference image for consistency
   */
  async generateReference(characterName: string): Promise<string | null> {
    const char = this.characters.get(characterName);
    if (!char) return null;

    // If we already have a reference, return it
    if (char.reference_image && fs.existsSync(char.reference_image)) {
      this.generatedRefs.set(characterName, char.reference_image);
      return char.reference_image;
    }

    const cached = this.generatedRefs.get(characterName);
    if (cached && fs.existsSync(cached)) {
      return cached;
    }

    // Generate character sheet / reference
    const refPrompt = this.buildPrompt(
      characterName,
      'character reference sheet, front view, 3/4 view, multiple expressions',
      'neutral'
    );

    const outputPath = path.join(DIRECTORIES.characters, `${characterName}_reference.png`);
    
    console.log(`  🎨 Generating reference for: ${characterName}`);
    const result = await generateImage(refPrompt, outputPath);
    
    if (result) {
      this.generatedRefs.set(characterName, outputPath);
      return outputPath;
    }
    
    return null;
  }

  /**
   * Generate character in a specific scene
   */
  async generateSceneImage(
    characterName: string,
    sceneDescription: string,
    emotion: string,
    outputPath: string
  ): Promise<string | null> {
    const prompt = this.buildPrompt(characterName, sceneDescription, emotion);
    return generateImage(prompt, outputPath);
  }

  getCharacters(): Map<string, CharacterConfig> {
    return this.characters;
  }
}

// =============================================================================
// Image Generation (OpenAI DALL-E)
// =============================================================================

async function generateImage(prompt: string, outputPath: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('  ⚠️  OPENAI_API_KEY not set, skipping image generation');
    return null;
  }

  // Ensure directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  console.log(`  🖼️  Generating: ${prompt.substring(0, 60)}...`);

  return new Promise((resolve) => {
    const postData = JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url',
    });

    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/images/generations',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', async () => {
          try {
            const json = JSON.parse(data);
            if (json.error) {
              console.log(`  ❌ Image error: ${json.error.message}`);
              resolve(null);
              return;
            }

            const imageUrl = json.data?.[0]?.url;
            if (!imageUrl) {
              console.log('  ❌ No image URL in response');
              resolve(null);
              return;
            }

            // Download the image
            await downloadFile(imageUrl, outputPath);
            console.log(`  ✅ Saved: ${path.basename(outputPath)}`);
            resolve(outputPath);
          } catch (e) {
            console.log(`  ❌ Parse error: ${e}`);
            resolve(null);
          }
        });
      }
    );

    req.on('error', (e) => {
      console.log(`  ❌ Request error: ${e}`);
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirect = res.headers.location;
        if (redirect) {
          downloadFile(redirect, destPath).then(resolve).catch(reject);
          return;
        }
      }
      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
}

// =============================================================================
// Voice Generation (IndexTTS-2 via Hugging Face)
// =============================================================================

async function generateVoiceover(
  text: string,
  voiceRefPath: string,
  outputPath: string,
  emotion: string = 'neutral'
): Promise<string | null> {
  console.log(`  🎙️  Generating voiceover: "${text.substring(0, 40)}..."`);

  // Ensure directories exist
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  // First try IndexTTS-2
  const indexTTSResult = await callIndexTTS2(text, voiceRefPath, outputPath, emotion);
  if (indexTTSResult) {
    return indexTTSResult;
  }

  // Fallback to OpenAI TTS
  console.log('  ⚠️  IndexTTS-2 unavailable, falling back to OpenAI TTS');
  return generateOpenAITTS(text, outputPath);
}

async function callIndexTTS2(
  text: string,
  voiceRef: string,
  outputPath: string,
  emotion: string
): Promise<string | null> {
  // Check if voice reference exists
  if (!fs.existsSync(voiceRef)) {
    console.log(`  ⚠️  Voice reference not found: ${voiceRef}`);
    return null;
  }

  const pythonScript = path.join(PROJECT_ROOT, 'scripts', 'test-indextts2.py');
  
  // Create a temporary Python script for this specific call
  const tempScript = `
import sys
sys.path.insert(0, '${PROJECT_ROOT}/scripts')

from pathlib import Path
import shutil

try:
    from gradio_client import Client, handle_file
except ImportError:
    import os
    os.system("pip install gradio_client -q")
    from gradio_client import Client, handle_file

# Emotion vectors
emotions = {
    'happy': {'happy': 0.8, 'calm': 0.2},
    'sad': {'sad': 0.7, 'calm': 0.3},
    'excited': {'happy': 0.6, 'surprised': 0.4},
    'calm': {'calm': 1.0},
    'neutral': {},
    'curious': {'surprised': 0.3, 'happy': 0.3},
    'explaining': {'calm': 0.5, 'happy': 0.3},
}

ev = emotions.get('${emotion}', {})

try:
    client = Client("IndexTeam/IndexTTS-2-Demo")
    result = client.predict(
        emo_control_method="Same as the voice reference",
        prompt=handle_file('${voiceRef}'),
        text="""${text.replace(/"/g, '\\"').replace(/\n/g, ' ')}""",
        emo_ref_path=handle_file('${voiceRef}'),
        emo_weight=0.8,
        vec1=ev.get("happy", 0),
        vec2=ev.get("angry", 0),
        vec3=ev.get("sad", 0),
        vec4=ev.get("afraid", 0),
        vec5=ev.get("disgusted", 0),
        vec6=ev.get("melancholic", 0),
        vec7=ev.get("surprised", 0),
        vec8=ev.get("calm", 0),
        emo_text="",
        emo_random=False,
        max_text_tokens_per_segment=120,
        param_16=True,
        param_17=0.8,
        param_18=30,
        param_19=0.8,
        param_20=0,
        param_21=3,
        param_22=10,
        param_23=1500,
        api_name="/gen_single"
    )
    
    if isinstance(result, dict):
        audio_path = result.get("value", result)
    else:
        audio_path = result
    
    if audio_path:
        Path('${path.dirname(outputPath)}').mkdir(parents=True, exist_ok=True)
        shutil.copy(audio_path, '${outputPath}')
        print("SUCCESS:" + '${outputPath}')
    else:
        print("FAILED:No audio path")
except Exception as e:
    print(f"FAILED:{e}")
`;

  const tempScriptPath = path.join(PROJECT_ROOT, 'output', '.temp_tts.py');
  fs.mkdirSync(path.dirname(tempScriptPath), { recursive: true });
  fs.writeFileSync(tempScriptPath, tempScript);

  return new Promise((resolve) => {
    try {
      const result = execSync(`python3 "${tempScriptPath}"`, {
        encoding: 'utf-8',
        timeout: 120000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      if (result.includes('SUCCESS:')) {
        console.log(`  ✅ Voice cloned: ${path.basename(outputPath)}`);
        resolve(outputPath);
      } else {
        console.log(`  ⚠️  IndexTTS-2 failed: ${result}`);
        resolve(null);
      }
    } catch (err: any) {
      console.log(`  ⚠️  IndexTTS-2 error: ${err.message?.substring(0, 100) || err}`);
      resolve(null);
    } finally {
      // Cleanup temp script
      try { fs.unlinkSync(tempScriptPath); } catch {}
    }
  });
}

async function generateOpenAITTS(text: string, outputPath: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('  ⚠️  OPENAI_API_KEY not set');
    return null;
  }

  return new Promise((resolve) => {
    const postData = JSON.stringify({
      model: 'tts-1-hd',
      input: text,
      voice: 'onyx',
      response_format: 'mp3',
    });

    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/audio/speech',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            console.log(`  ❌ TTS error: ${res.statusCode}`);
            resolve(null);
          });
          return;
        }

        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        const file = fs.createWriteStream(outputPath);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`  ✅ TTS saved: ${path.basename(outputPath)}`);
          resolve(outputPath);
        });
      }
    );

    req.on('error', (e) => {
      console.log(`  ❌ TTS error: ${e}`);
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

// =============================================================================
// Script to Brief Converter
// =============================================================================

function parseScriptToBrief(scriptText: string, title: string): ExplainerBrief {
  // Split script into scenes by double newlines or markers
  const sections = scriptText
    .split(/\n{2,}|\[SCENE\s*\d*\]/gi)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  const scenes: SceneContent[] = [];
  let startTime = 0;

  // Create intro
  if (sections.length > 0) {
    scenes.push({
      id: 'intro',
      type: 'intro',
      duration_sec: 5,
      voiceover_text: sections[0],
      visual_prompt: 'introduction scene, title card',
      character: 'host',
      emotion: 'excited',
    });
    startTime += 5;
  }

  // Create topic scenes for middle content
  for (let i = 1; i < sections.length - 1; i++) {
    const text = sections[i];
    const wordCount = text.split(/\s+/).length;
    const duration = Math.max(5, Math.ceil(wordCount / 2.5)); // ~150 wpm

    scenes.push({
      id: `topic_${i}`,
      type: 'topic',
      duration_sec: duration,
      voiceover_text: text,
      visual_prompt: `explaining concept, educational illustration`,
      character: 'host',
      emotion: 'explaining',
    });
    startTime += duration;
  }

  // Create outro
  if (sections.length > 1) {
    const lastSection = sections[sections.length - 1];
    scenes.push({
      id: 'outro',
      type: 'outro',
      duration_sec: 5,
      voiceover_text: lastSection,
      visual_prompt: 'conclusion, call to action',
      character: 'host',
      emotion: 'happy',
    });
  }

  return {
    id: `explainer_${Date.now()}`,
    title,
    description: `Explainer video about ${title}`,
    style: {
      theme: 'dark',
      primary_color: '#ffffff',
      accent_color: '#3b82f6',
      art_style: 'modern flat illustration, clean lines, vibrant colors, professional',
    },
    characters: [
      {
        name: 'host',
        description: 'friendly professional host character, modern casual attire',
        style: 'flat illustration style, clean lines, approachable appearance',
      },
    ],
    voice: {
      reference_path: path.join(DIRECTORIES.voices, 'isaiah.wav'),
      default_emotion: 'calm',
    },
    scenes,
    settings: {
      resolution: { width: 1080, height: 1920 },
      fps: 30,
      aspect_ratio: '9:16',
    },
  };
}

// =============================================================================
// Topic to Script Generator (uses OpenAI)
// =============================================================================

async function generateScript(topic: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY required for script generation');
  }

  console.log(`\n📝 Generating script for: "${topic}"`);

  const systemPrompt = `You are an expert explainer video scriptwriter. Write engaging, 
educational scripts that are conversational and easy to follow. 

Format your response as a script with clear sections separated by blank lines.
Each section should be 2-4 sentences that can be narrated in 10-20 seconds.

Include:
1. An attention-grabbing hook/intro
2. 3-5 main points explained clearly  
3. A memorable conclusion with call-to-action

Keep the total script under 60 seconds of narration (~150 words).
Use simple language suitable for a general audience.
Do NOT include scene directions or technical notes - just the narration text.`;

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Write an explainer video script about: ${topic}` },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.error) {
              reject(new Error(json.error.message));
              return;
            }
            const script = json.choices?.[0]?.message?.content || '';
            console.log(`  ✅ Script generated (${script.split(/\s+/).length} words)`);
            resolve(script);
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// =============================================================================
// Main Pipeline
// =============================================================================

async function generateExplainerVideo(options: {
  topic?: string;
  script?: string;
  brief?: ExplainerBrief;
  skipImages?: boolean;
  skipVoiceover?: boolean;
  skipRender?: boolean;
}): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🎬 Explainer Video Generator');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Ensure directories exist
  Object.values(DIRECTORIES).forEach(dir => fs.mkdirSync(dir, { recursive: true }));
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let brief: ExplainerBrief;

  // Step 1: Get or generate the brief
  if (options.brief) {
    brief = options.brief;
    console.log(`📋 Using provided brief: ${brief.title}\n`);
  } else if (options.script) {
    console.log('📜 Converting script to brief...');
    brief = parseScriptToBrief(options.script, options.topic || 'Explainer Video');
  } else if (options.topic) {
    console.log('🧠 Generating script from topic...');
    const script = await generateScript(options.topic);
    brief = parseScriptToBrief(script, options.topic);
  } else {
    throw new Error('Must provide --topic, --script, or --brief');
  }

  // Save brief
  const briefPath = path.join(OUTPUT_DIR, `${brief.id}.brief.json`);
  fs.writeFileSync(briefPath, JSON.stringify(brief, null, 2));
  console.log(`  📄 Brief saved: ${briefPath}\n`);

  // Step 2: Initialize character consistency engine
  console.log('🎭 Setting up character consistency...');
  const characterEngine = new CharacterConsistencyEngine(brief.style.art_style);
  
  for (const char of brief.characters) {
    characterEngine.registerCharacter(char);
  }

  // Generate character references
  if (!options.skipImages) {
    console.log('\n🖼️  Generating character references...');
    for (const char of brief.characters) {
      await characterEngine.generateReference(char.name);
    }
  }

  // Step 3: Generate assets for each scene
  console.log('\n🎨 Generating scene assets...');
  const assets: GeneratedAssets = {
    voiceovers: {},
    images: {},
    character_refs: {},
  };

  for (const scene of brief.scenes) {
    console.log(`\n  [${scene.id}] ${scene.type.toUpperCase()}`);

    // Generate voiceover
    if (!options.skipVoiceover && scene.voiceover_text) {
      const voPath = path.join(DIRECTORIES.voiceovers, `${brief.id}_${scene.id}.wav`);
      const result = await generateVoiceover(
        scene.voiceover_text,
        brief.voice.reference_path,
        voPath,
        scene.emotion || brief.voice.default_emotion || 'neutral'
      );
      if (result) {
        assets.voiceovers[scene.id] = result;
      }
    }

    // Generate scene image
    if (!options.skipImages && scene.character && scene.visual_prompt) {
      const imgPath = path.join(DIRECTORIES.scenes, `${brief.id}_${scene.id}.png`);
      const result = await characterEngine.generateSceneImage(
        scene.character,
        scene.visual_prompt,
        scene.emotion || 'neutral',
        imgPath
      );
      if (result) {
        assets.images[scene.id] = result;
      }
    }
  }

  // Save assets manifest
  const assetsPath = path.join(OUTPUT_DIR, `${brief.id}.assets.json`);
  fs.writeFileSync(assetsPath, JSON.stringify(assets, null, 2));
  console.log(`\n  📦 Assets manifest: ${assetsPath}`);

  // Step 4: Create Remotion-compatible brief
  const remotionBrief = convertToRemotionBrief(brief, assets);
  const remotionBriefPath = path.join(OUTPUT_DIR, `${brief.id}.remotion.json`);
  fs.writeFileSync(remotionBriefPath, JSON.stringify(remotionBrief, null, 2));
  console.log(`  🎬 Remotion brief: ${remotionBriefPath}`);

  // Step 5: Render video (optional)
  if (!options.skipRender) {
    console.log('\n🎥 Rendering video...');
    const outputPath = path.join(OUTPUT_DIR, `${brief.id}.mp4`);
    
    try {
      execSync(
        `npx tsx scripts/render.ts "${remotionBriefPath}" "${outputPath}"`,
        { cwd: PROJECT_ROOT, stdio: 'inherit' }
      );
      console.log(`\n✅ Video rendered: ${outputPath}`);
    } catch (err) {
      console.log(`\n⚠️  Render skipped or failed - brief ready for manual render`);
      console.log(`   Run: npm run render:brief "${remotionBriefPath}"`);
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ Explainer video pipeline complete!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`\n  📋 Brief:     ${briefPath}`);
  console.log(`  📦 Assets:    ${assetsPath}`);
  console.log(`  🎬 Remotion:  ${remotionBriefPath}`);
  console.log(`\n  To render manually:`);
  console.log(`    npm run render:brief "${remotionBriefPath}"`);
  console.log(`\n  To preview:`);
  console.log(`    npm run dev`);
  console.log('');
}

// =============================================================================
// Convert to Remotion Brief Format
// =============================================================================

function convertToRemotionBrief(brief: ExplainerBrief, assets: GeneratedAssets): any {
  const sections = brief.scenes.map((scene, index) => {
    const startTime = brief.scenes
      .slice(0, index)
      .reduce((sum, s) => sum + s.duration_sec, 0);

    return {
      id: scene.id,
      type: scene.type,
      duration_sec: scene.duration_sec,
      start_time_sec: startTime,
      content: {
        type: scene.type,
        title: scene.type === 'intro' ? brief.title : undefined,
        body_text: scene.voiceover_text,
        image_url: assets.images[scene.id] 
          ? `assets/scenes/${path.basename(assets.images[scene.id])}`
          : undefined,
      },
      audio: {
        voiceover: {
          url: assets.voiceovers[scene.id]
            ? `assets/audio/voiceover/${path.basename(assets.voiceovers[scene.id])}`
            : undefined,
          text: scene.voiceover_text,
        },
      },
    };
  });

  const totalDuration = sections.reduce((sum, s) => sum + s.duration_sec, 0);

  return {
    id: brief.id,
    format: 'explainer_v1',
    version: '1.0',
    settings: {
      ...brief.settings,
      duration_sec: totalDuration,
    },
    style: {
      theme: brief.style.theme,
      primary_color: brief.style.primary_color,
      accent_color: brief.style.accent_color,
      background_type: 'gradient',
      background_value: brief.style.theme === 'dark'
        ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)'
        : 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
    },
    sections,
  };
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Explainer Video Generator
═════════════════════════

Generate complete explainer videos with AI graphics and voice cloning.

Usage:
  # Generate from topic (AI writes script)
  npx tsx scripts/generate-explainer.ts --topic "How Solar Panels Work"

  # Generate from script file
  npx tsx scripts/generate-explainer.ts --script my_script.txt --title "Solar Energy"

  # Generate from existing brief
  npx tsx scripts/generate-explainer.ts --brief data/briefs/explainer.json

Options:
  --topic <text>       Topic for AI to write script about
  --script <path>      Path to script text file
  --brief <path>       Path to explainer brief JSON
  --title <text>       Title (used with --script)
  --skip-images        Skip AI image generation
  --skip-voiceover     Skip voiceover generation  
  --skip-render        Skip video rendering (generate assets only)

Environment Variables:
  OPENAI_API_KEY       Required for script/image generation and fallback TTS
  HF_TOKEN             Optional Hugging Face token for IndexTTS-2

Examples:
  # Quick explainer from topic
  npx tsx scripts/generate-explainer.ts --topic "Why the Sky is Blue"

  # Full pipeline with custom script
  npx tsx scripts/generate-explainer.ts \\
    --script scripts/my_script.txt \\
    --title "Understanding Climate Change"

  # Assets only (no render)
  npx tsx scripts/generate-explainer.ts \\
    --topic "How WiFi Works" \\
    --skip-render
`);
    process.exit(0);
  }

  // Parse arguments
  const getArg = (name: string): string | undefined => {
    const idx = args.indexOf(`--${name}`);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : undefined;
  };

  const topic = getArg('topic');
  const scriptPath = getArg('script');
  const briefPath = getArg('brief');
  const title = getArg('title');

  let script: string | undefined;
  let brief: ExplainerBrief | undefined;

  if (scriptPath) {
    if (!fs.existsSync(scriptPath)) {
      console.error(`❌ Script file not found: ${scriptPath}`);
      process.exit(1);
    }
    script = fs.readFileSync(scriptPath, 'utf-8');
  }

  if (briefPath) {
    if (!fs.existsSync(briefPath)) {
      console.error(`❌ Brief file not found: ${briefPath}`);
      process.exit(1);
    }
    brief = JSON.parse(fs.readFileSync(briefPath, 'utf-8'));
  }

  if (!topic && !script && !brief) {
    console.error('❌ Must provide --topic, --script, or --brief');
    console.log('   Run with --help for usage');
    process.exit(1);
  }

  await generateExplainerVideo({
    topic: topic || title,
    script,
    brief,
    skipImages: args.includes('--skip-images'),
    skipVoiceover: args.includes('--skip-voiceover'),
    skipRender: args.includes('--skip-render'),
  });
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err.message || err);
  process.exit(1);
});
