#!/usr/bin/env npx tsx
/**
 * Generate talking head video using Replicate API
 * Uses cjwbw/sadtalker model which is ready to use
 * 
 * Usage:
 *   REPLICATE_API_TOKEN=xxx npx tsx scripts/generate-talking-head-replicate.ts \
 *     --audio voice.wav --image face.png --output talking.mp4
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const REPLICATE_API = 'api.replicate.com';

interface ReplicateResponse {
  id: string;
  status: string;
  output?: string;
  error?: string;
}

async function httpRequest(
  method: string,
  path: string,
  body?: any,
): Promise<any> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error('REPLICATE_API_TOKEN environment variable required');
  }

  return new Promise((resolve, reject) => {
    const options = {
      hostname: REPLICATE_API,
      path,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function fileToDataUrl(filePath: string): Promise<string> {
  const bytes = fs.readFileSync(filePath);
  const ext = path.extname(filePath).slice(1);
  const mimeType = ext === 'wav' ? 'audio/wav' : 
                   ext === 'mp3' ? 'audio/mp3' :
                   ext === 'png' ? 'image/png' :
                   ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'application/octet-stream';
  return `data:${mimeType};base64,${bytes.toString('base64')}`;
}

async function generateTalkingHead(
  audioPath: string,
  imagePath: string,
  outputPath: string,
): Promise<void> {
  console.log(`\n🎭 Generating talking head with Replicate...`);
  console.log(`   Audio: ${audioPath}`);
  console.log(`   Image: ${imagePath}`);

  const audioDataUrl = await fileToDataUrl(audioPath);
  const imageDataUrl = await fileToDataUrl(imagePath);

  // Create prediction using SadTalker model on Replicate
  const prediction = await httpRequest('POST', '/v1/predictions', {
    version: 'a519cc0cfebaaeade068b23899165a11ec76aaa1d2b313d40d214f204ec957a3',
    input: {
      source_image: imageDataUrl,
      driven_audio: audioDataUrl,
      preprocess: 'crop',
      still_mode: false,
      use_enhancer: true,
      expression_scale: 1.0,
    },
  });

  if (prediction.error) {
    throw new Error(`Prediction failed: ${prediction.error}`);
  }

  console.log(`   Prediction ID: ${prediction.id}`);
  console.log(`\n⏳ Processing (this may take 1-3 minutes)...\n`);

  // Poll for completion
  let result: ReplicateResponse;
  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 5000)); // Wait 5s
    result = await httpRequest('GET', `/v1/predictions/${prediction.id}`);
    
    if (result.status === 'succeeded') {
      break;
    } else if (result.status === 'failed') {
      throw new Error(`Generation failed: ${result.error}`);
    }
    
    process.stdout.write('.');
    attempts++;
  }

  if (!result!.output) {
    throw new Error('No output received');
  }

  console.log('\n');

  // Download result video
  const videoUrl = result!.output;
  console.log(`   Downloading from: ${videoUrl.substring(0, 50)}...`);

  const videoResponse = await new Promise<Buffer>((resolve, reject) => {
    https.get(videoUrl, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
  });

  fs.writeFileSync(outputPath, videoResponse);

  console.log(`\n✅ Talking head video saved: ${outputPath}`);
  console.log(`   Size: ${(videoResponse.length / 1024 / 1024).toFixed(2)} MB`);
}

function printUsage() {
  console.log(`
Talking Head Generation via Replicate (SadTalker)

Usage:
  REPLICATE_API_TOKEN=xxx npx tsx scripts/generate-talking-head-replicate.ts \\
    --audio path/to/voice.wav \\
    --image path/to/face.png \\
    --output talking_head.mp4

Get your API token at: https://replicate.com/account/api-tokens

Options:
  --audio, -a   Path to audio file (WAV/MP3)
  --image, -i   Path to face image (PNG/JPG) - must be a real human face
  --output, -o  Output video path
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

  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('❌ REPLICATE_API_TOKEN environment variable required');
    console.error('   Get your token at: https://replicate.com/account/api-tokens');
    process.exit(1);
  }

  await generateTalkingHead(audioPath, imagePath, outputPath);
}

main().catch(err => {
  console.error(`❌ Error: ${err.message}`);
  process.exit(1);
});
