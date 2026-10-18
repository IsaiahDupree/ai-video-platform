#!/usr/bin/env npx tsx
/**
 * Generate App-Kit promo voiceover using Modal voice clone
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const VOICE_REF_PATH = 'public/assets/voices/isaiah.wav';
const OUTPUT_DIR = 'public/assets/audio/appkit';

const sections = [
  {
    id: 'hook',
    text: 'Ship your app in days, not months. Stop rebuilding authentication, payments, and infrastructure from scratch. App-Kit gives you everything you need.',
  },
  {
    id: 'problem',
    text: 'Building a SaaS app means weeks on auth, payments, database setup, and deployment. That\'s time you could spend on your actual product.',
  },
  {
    id: 'solution',
    text: 'App-Kit is your launchpad. A complete starter kit with Expo, Supabase, Stripe, and RevenueCat. Plus 14 comprehensive guides covering everything from setup to scaling.',
  },
  {
    id: 'features',
    text: 'What\'s included? Authentication flows, payment integration, database schemas, deployment guides, security best practices, and a DevMode overlay showing exactly what to customize.',
  },
  {
    id: 'guides',
    text: '14 expert guides. From getting started to scaling your app. Architecture, backend setup, testing, monetization, analytics. We\'ve documented everything.',
  },
  {
    id: 'cta',
    text: 'Start building today. App-Kit version 2 is available now on GitHub. Get the complete package for just 99 dollars. Ship your dream app this week!',
  },
];

async function callModalVoiceClone(voiceRefBytes: Buffer, text: string): Promise<Buffer> {
  const body = JSON.stringify({
    voice_ref: voiceRefBytes.toString('base64'),
    text: text,
    emotion_method: 'Same as the voice reference',
    emotion_weight: 0.8,
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'isaiahdupree33--voice-clone-indextts2-api-clone-voice.modal.run',
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            reject(new Error(response.error));
            return;
          }
          const audioBuffer = Buffer.from(response.audio, 'base64');
          resolve(audioBuffer);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('🎙️ Generating App-Kit voiceovers with your cloned voice...\n');

  // Read voice reference
  const voiceRefBytes = fs.readFileSync(VOICE_REF_PATH);
  console.log(`Voice reference: ${VOICE_REF_PATH} (${(voiceRefBytes.length / 1024 / 1024).toFixed(1)} MB)\n`);

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const outputs: string[] = [];

  for (const section of sections) {
    const outputPath = path.join(OUTPUT_DIR, `${section.id}_cloned.wav`);
    console.log(`  Generating: ${section.id}...`);
    console.log(`    "${section.text.slice(0, 60)}..."`);

    try {
      const audioBuffer = await callModalVoiceClone(voiceRefBytes, section.text);
      fs.writeFileSync(outputPath, audioBuffer);
      console.log(`    ✅ Saved: ${outputPath} (${(audioBuffer.length / 1024).toFixed(1)} KB)\n`);
      outputs.push(outputPath);
    } catch (error) {
      console.error(`    ❌ Error: ${error}\n`);
    }

    // Rate limit between calls
    await new Promise(r => setTimeout(r, 2000));
  }

  // Concatenate all audio files using ffmpeg
  if (outputs.length === sections.length) {
    console.log('📼 Concatenating audio files...');
    const listFile = path.join(OUTPUT_DIR, 'concat_list.txt');
    const listContent = outputs.map(p => `file '${path.basename(p)}'`).join('\n');
    fs.writeFileSync(listFile, listContent);
    
    console.log(`\nRun this to concatenate:\n`);
    console.log(`  cd ${OUTPUT_DIR} && ffmpeg -f concat -safe 0 -i concat_list.txt -c copy voiceover_cloned.wav`);
  }

  console.log('\n✅ Voiceover generation complete!');
}

main().catch(console.error);
