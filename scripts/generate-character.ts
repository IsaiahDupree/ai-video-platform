#!/usr/bin/env npx tsx
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { execSync } from 'node:child_process';

// =============================================================================
// AI Character Generator
// =============================================================================
// Generates images with AI and optionally removes background

interface GenerateOptions {
  prompt: string;
  output: string;
  provider?: 'openai' | 'replicate' | 'stability';
  removeBackground?: boolean;
  style?: string;
  size?: string;
}

// Load API keys from environment
const API_KEYS = {
  openai: process.env.OPENAI_API_KEY,
  replicate: process.env.REPLICATE_API_TOKEN,
  stability: process.env.STABILITY_API_KEY,
};

// =============================================================================
// OpenAI DALL-E Generation
// =============================================================================

async function generateWithOpenAI(prompt: string, size = '1024x1024'): Promise<Buffer | null> {
  if (!API_KEYS.openai) {
    console.error('❌ OPENAI_API_KEY not set');
    return null;
  }

  console.log('🎨 Generating with OpenAI DALL-E...');

  const postData = JSON.stringify({
    model: 'dall-e-3',
    prompt: `${prompt}, high quality, digital art, transparent background preferred`,
    n: 1,
    size,
    response_format: 'url',
  });

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/images/generations',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEYS.openai}`,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', async () => {
          try {
            const json = JSON.parse(data);
            if (json.error) {
              console.error('❌ OpenAI error:', json.error.message);
              resolve(null);
              return;
            }
            
            const imageUrl = json.data?.[0]?.url;
            if (!imageUrl) {
              console.error('❌ No image URL in response');
              resolve(null);
              return;
            }

            // Download the image
            console.log('📥 Downloading generated image...');
            const imageBuffer = await downloadImage(imageUrl);
            resolve(imageBuffer);
          } catch (e) {
            console.error('❌ Parse error:', e);
            resolve(null);
          }
        });
      }
    );

    req.on('error', (e) => {
      console.error('❌ Request error:', e);
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

// =============================================================================
// Download Image from URL
// =============================================================================

async function downloadImage(url: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', () => resolve(null));
    });
  });
}

// =============================================================================
// Background Removal (using rembg or similar)
// =============================================================================

async function removeBackground(inputPath: string, outputPath: string): Promise<boolean> {
  console.log('✂️  Removing background...');

  // Try using rembg (Python tool)
  try {
    execSync(`rembg i "${inputPath}" "${outputPath}"`, { stdio: 'pipe' });
    console.log('✅ Background removed with rembg');
    return true;
  } catch {
    // rembg not available
  }

  // Try using ImageMagick for simple bg removal (white bg)
  try {
    execSync(
      `convert "${inputPath}" -fuzz 10% -transparent white "${outputPath}"`,
      { stdio: 'pipe' }
    );
    console.log('✅ Background removed with ImageMagick');
    return true;
  } catch {
    // ImageMagick not available
  }

  console.warn('⚠️  No background removal tool available (install rembg or ImageMagick)');
  console.log('   pip install rembg');
  
  // Just copy the file
  fs.copyFileSync(inputPath, outputPath);
  return false;
}

// =============================================================================
// Main Generate Function
// =============================================================================

async function generateCharacter(options: GenerateOptions): Promise<string | null> {
  const { prompt, output, provider = 'openai', removeBackground: removeBg = true } = options;

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🤖 AI Character Generator');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`   Prompt: ${prompt}`);
  console.log(`   Provider: ${provider}`);
  console.log(`   Output: ${output}`);
  console.log(`   Remove BG: ${removeBg}`);
  console.log('');

  let imageBuffer: Buffer | null = null;

  switch (provider) {
    case 'openai':
      imageBuffer = await generateWithOpenAI(prompt);
      break;
    case 'replicate':
      console.error('❌ Replicate not yet implemented');
      return null;
    case 'stability':
      console.error('❌ Stability not yet implemented');
      return null;
  }

  if (!imageBuffer) {
    console.error('❌ Failed to generate image');
    return null;
  }

  // Ensure output directory exists
  const outDir = path.dirname(output);
  fs.mkdirSync(outDir, { recursive: true });

  // Save initial image
  const tempPath = output.replace(/\.(png|jpg|jpeg)$/i, '_raw.png');
  fs.writeFileSync(tempPath, imageBuffer);
  console.log(`✅ Saved raw image: ${tempPath}`);

  // Remove background if requested
  if (removeBg) {
    await removeBackground(tempPath, output);
  } else {
    fs.copyFileSync(tempPath, output);
  }

  console.log(`\n🎉 Character generated: ${output}`);
  return output;
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
AI Character Generator

Usage: npx tsx scripts/generate-character.ts [options]

Options:
  --prompt <text>      Image generation prompt (required)
  --output <path>      Output file path (required)
  --provider <name>    AI provider: openai, replicate, stability (default: openai)
  --no-remove-bg       Skip background removal
  --style <style>      Style modifier (e.g., "cartoon", "realistic", "anime")

Example:
  npx tsx scripts/generate-character.ts \\
    --prompt "friendly robot mascot, cartoon style, waving" \\
    --output public/assets/characters/robot.png
`);
    process.exit(0);
  }

  // Parse arguments
  const getArg = (name: string): string | undefined => {
    const idx = args.indexOf(`--${name}`);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const prompt = getArg('prompt');
  const output = getArg('output');
  const provider = (getArg('provider') || 'openai') as 'openai' | 'replicate' | 'stability';
  const style = getArg('style');
  const removeBg = !args.includes('--no-remove-bg');

  if (!prompt || !output) {
    console.error('❌ --prompt and --output are required');
    console.log('   Run with --help for usage');
    process.exit(1);
  }

  const fullPrompt = style ? `${prompt}, ${style} style` : prompt;

  const result = await generateCharacter({
    prompt: fullPrompt,
    output,
    provider,
    removeBackground: removeBg,
  });

  process.exit(result ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

export { generateCharacter, GenerateOptions };
