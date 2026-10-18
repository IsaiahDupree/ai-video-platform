#!/usr/bin/env npx tsx
/**
 * Generate talking head video using SadTalker on Modal
 * 
 * Usage:
 *   npx tsx scripts/generate-talking-head.ts --audio voice.wav --image face.png --output talking.mp4
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const SADTALKER_ENDPOINT = 'isaiahdupree33--sadtalker-api-generate.modal.run';

interface SadTalkerResponse {
  video?: string;
  duration_seconds?: number;
  generation_time_seconds?: number;
  error?: string;
}

async function generateTalkingHead(
  audioPath: string,
  imagePath: string,
  outputPath: string,
): Promise<void> {
  // Read files
  const audioBytes = fs.readFileSync(audioPath);
  const imageBytes = fs.readFileSync(imagePath);

  const body = JSON.stringify({
    audio: audioBytes.toString('base64'),
    image: imageBytes.toString('base64'),
    enhancer: 'gfpgan',
    preprocess: 'crop',
    still_mode: false,
    expression_scale: 1.0,
  });

  console.log(`\n🎭 Generating talking head video...`);
  console.log(`   Audio: ${audioPath}`);
  console.log(`   Image: ${imagePath}`);
  console.log(`   Endpoint: ${SADTALKER_ENDPOINT}`);
  console.log(`\n⏳ This may take 1-3 minutes...\n`);

  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const req = https.request({
      hostname: SADTALKER_ENDPOINT,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 600000,  // 10 min timeout
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        try {
          const response: SadTalkerResponse = JSON.parse(data);

          if (response.error) {
            console.error(`❌ Error: ${response.error}`);
            reject(new Error(response.error));
            return;
          }

          if (!response.video) {
            console.error(`❌ No video in response`);
            reject(new Error('No video returned'));
            return;
          }

          // Save video
          const videoBuffer = Buffer.from(response.video, 'base64');
          const dir = path.dirname(outputPath);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(outputPath, videoBuffer);

          console.log(`✅ Talking head video saved: ${outputPath}`);
          console.log(`   Duration: ${response.duration_seconds?.toFixed(1)}s`);
          console.log(`   Size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);
          console.log(`   Generation time: ${response.generation_time_seconds?.toFixed(1)}s`);
          console.log(`   Total time: ${elapsed}s`);

          resolve();
        } catch (e) {
          console.error(`❌ Parse error: ${e}`);
          console.error(`   Response: ${data.substring(0, 500)}`);
          reject(e);
        }
      });
    });

    req.on('error', (err) => {
      console.error(`❌ Request error: ${err.message}`);
      reject(err);
    });

    req.on('timeout', () => {
      console.error('❌ Request timed out');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.write(body);
    req.end();
  });
}

function printUsage() {
  console.log(`
SadTalker Talking Head Generation

Usage:
  npx tsx scripts/generate-talking-head.ts \\
    --audio path/to/voice.wav \\
    --image path/to/face.png \\
    --output talking_head.mp4

Options:
  --audio, -a   Path to audio file (WAV/MP3)
  --image, -i   Path to face image (PNG/JPG)
  --output, -o  Output video path (default: output_talking_head.mp4)
  --help        Show this help
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    printUsage();
    return;
  }

  const audioIdx = args.findIndex(a => a === '--audio' || a === '-a');
  const imageIdx = args.findIndex(a => a === '--image' || a === '-i');
  const outputIdx = args.findIndex(a => a === '--output' || a === '-o');

  const audioPath = audioIdx !== -1 ? args[audioIdx + 1] : undefined;
  const imagePath = imageIdx !== -1 ? args[imageIdx + 1] : undefined;
  const outputPath = outputIdx !== -1 ? args[outputIdx + 1] : 'output_talking_head.mp4';

  if (!audioPath || !imagePath) {
    console.error('❌ Both --audio and --image are required');
    printUsage();
    process.exit(1);
  }

  if (!fs.existsSync(audioPath)) {
    console.error(`❌ Audio file not found: ${audioPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(imagePath)) {
    console.error(`❌ Image file not found: ${imagePath}`);
    process.exit(1);
  }

  await generateTalkingHead(audioPath, imagePath, outputPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
