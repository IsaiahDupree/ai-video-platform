#!/usr/bin/env npx tsx
/**
 * Generate Remix Demo Video
 * 
 * Complete pipeline for generating the character remix demo video:
 * 1. Generate voiceover for each section
 * 2. Generate word timestamps
 * 3. Render the final video
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { execSync, spawn } from 'child_process';

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

const BRIEF_PATH = 'data/briefs/remix_demo.json';
const OUTPUT_DIR = 'public/assets/audio/voiceover/remix_demo';
const VIDEO_OUTPUT = 'output/remix_demo.mp4';

interface Section {
  id: string;
  voiceover: { text: string; emotion?: string };
}

/**
 * Generate TTS using OpenAI
 */
async function generateTTS(text: string, outputPath: string): Promise<boolean> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('  ⚠️  OPENAI_API_KEY not set');
    return false;
  }

  return new Promise((resolve) => {
    const data = JSON.stringify({
      model: 'tts-1',
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
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          console.log(`  ❌ TTS failed with status ${res.statusCode}`);
          resolve(false);
          return;
        }

        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          fs.writeFileSync(outputPath, buffer);
          resolve(true);
        });
      }
    );

    req.on('error', (e) => {
      console.log(`  ❌ TTS error: ${e.message}`);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Generate word-level timestamps using Whisper
 */
async function generateTimestamps(audioPath: string, outputPath: string): Promise<boolean> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('  ⚠️  OPENAI_API_KEY not set');
    return false;
  }

  return new Promise((resolve) => {
    const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
    const audioData = fs.readFileSync(audioPath);
    const filename = path.basename(audioPath);

    const bodyParts = [
      `--${boundary}\r\n`,
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`,
      `Content-Type: audio/mpeg\r\n\r\n`,
    ];

    const bodyEnd = [
      `\r\n--${boundary}\r\n`,
      `Content-Disposition: form-data; name="model"\r\n\r\n`,
      `whisper-1`,
      `\r\n--${boundary}\r\n`,
      `Content-Disposition: form-data; name="response_format"\r\n\r\n`,
      `verbose_json`,
      `\r\n--${boundary}\r\n`,
      `Content-Disposition: form-data; name="timestamp_granularities[]"\r\n\r\n`,
      `word`,
      `\r\n--${boundary}--\r\n`,
    ];

    const bodyStart = Buffer.from(bodyParts.join(''));
    const bodyEndBuf = Buffer.from(bodyEnd.join(''));
    const body = Buffer.concat([bodyStart, audioData, bodyEndBuf]);

    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/audio/transcriptions',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.words) {
              fs.writeFileSync(outputPath, JSON.stringify({ words: result.words }, null, 2));
              resolve(true);
            } else {
              console.log('  ⚠️  No word timestamps in response');
              resolve(false);
            }
          } catch {
            console.log('  ❌ Failed to parse Whisper response');
            resolve(false);
          }
        });
      }
    );

    req.on('error', (e) => {
      console.log(`  ❌ Whisper error: ${e.message}`);
      resolve(false);
    });

    req.write(body);
    req.end();
  });
}

/**
 * Main pipeline
 */
async function main() {
  console.log('\n🎬 Remix Demo Video Generator\n');

  // Load brief
  const brief = JSON.parse(fs.readFileSync(BRIEF_PATH, 'utf-8'));
  const sections: Section[] = brief.sections;

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Step 1: Generate voiceovers
  console.log('🎙️  Generating voiceovers...\n');
  for (const section of sections) {
    const audioPath = path.join(OUTPUT_DIR, `${section.id}.mp3`);
    console.log(`   ${section.id}: "${section.voiceover.text.substring(0, 40)}..."`);
    
    const success = await generateTTS(section.voiceover.text, audioPath);
    if (success) {
      console.log(`   ✅ Generated: ${audioPath}`);
    }
    
    // Rate limit pause
    await new Promise(r => setTimeout(r, 500));
  }

  // Step 2: Generate word timestamps
  console.log('\n📝 Generating word timestamps...\n');
  for (const section of sections) {
    const audioPath = path.join(OUTPUT_DIR, `${section.id}.mp3`);
    const timestampPath = path.join(OUTPUT_DIR, `${section.id}_timestamps.json`);
    
    if (fs.existsSync(audioPath)) {
      console.log(`   ${section.id}: Transcribing...`);
      const success = await generateTimestamps(audioPath, timestampPath);
      if (success) {
        console.log(`   ✅ Timestamps: ${timestampPath}`);
      }
    }
    
    // Rate limit pause
    await new Promise(r => setTimeout(r, 500));
  }

  // Step 3: Render video
  console.log('\n🎥 Rendering video...\n');
  
  try {
    // Create output directory
    const outputDir = path.dirname(VIDEO_OUTPUT);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Run Remotion render
    const renderCmd = `npx remotion render BriefComposition ${VIDEO_OUTPUT} --props='${JSON.stringify({ briefPath: BRIEF_PATH })}'`;
    console.log(`   Running: ${renderCmd}\n`);
    
    execSync(renderCmd, { 
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    console.log(`\n✅ Video rendered: ${VIDEO_OUTPUT}`);
    
    // Open the video
    if (process.platform === 'darwin') {
      execSync(`open ${VIDEO_OUTPUT}`);
    }
  } catch (error) {
    console.log(`\n❌ Render failed: ${error}`);
  }

  console.log('\n📊 Summary');
  console.log(`   Brief: ${BRIEF_PATH}`);
  console.log(`   Audio: ${OUTPUT_DIR}`);
  console.log(`   Video: ${VIDEO_OUTPUT}`);
}

main().catch(console.error);
