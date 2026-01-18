#!/usr/bin/env npx tsx
/**
 * Sticker Generation Script using Replicate API
 * Extracts people from photos and creates transparent PNG stickers.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { config } from 'dotenv';

config({ path: '.env.local' });

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

interface StickerResult {
  source: string;
  sticker: string;
  filename: string;
}

async function removeBackground(imagePath: string): Promise<Buffer> {
  // Read image and convert to base64
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
  const dataUri = `data:${mimeType};base64,${base64Image}`;

  // Use Replicate's background removal model
  const body = JSON.stringify({
    version: "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
    input: {
      image: dataUri
    }
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.replicate.com',
      path: '/v1/predictions',
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', async () => {
        try {
          const prediction = JSON.parse(data);
          if (prediction.error) {
            reject(new Error(prediction.error));
            return;
          }
          
          // Poll for completion
          const result = await pollPrediction(prediction.id);
          
          // Download the result image
          const imageUrl = result.output;
          const imageData = await downloadImage(imageUrl);
          resolve(imageData);
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

async function pollPrediction(id: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const poll = () => {
      const req = https.request({
        hostname: 'api.replicate.com',
        path: `/v1/predictions/${id}`,
        method: 'GET',
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const prediction = JSON.parse(data);
          if (prediction.status === 'succeeded') {
            resolve(prediction);
          } else if (prediction.status === 'failed') {
            reject(new Error(prediction.error || 'Prediction failed'));
          } else {
            setTimeout(poll, 1000);
          }
        });
      });
      req.on('error', reject);
      req.end();
    };
    poll();
  });
}

async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function processImageWithGemini(imagePath: string): Promise<Buffer> {
  // Alternative: Use Gemini to generate a cutout version
  const apiKey = process.env.GOOGLE_API_KEY;
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

  const body = JSON.stringify({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: base64Image } },
        { text: 'Create a sticker version of this person. Remove the background completely and make it transparent. Keep only the person with a clean edge. Output as a PNG with transparency.' }
      ]
    }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT']
    }
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const parts = response.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.data) {
              resolve(Buffer.from(part.inlineData.data, 'base64'));
              return;
            }
          }
          reject(new Error('No image in response'));
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
  const inputImages = [
    '/Volumes/My Passport/MediaPoster/workspace1/iphone_import/IMG_0521.JPG',
    '/Volumes/My Passport/MediaPoster/workspace1/iphone_import/IMG_8046.JPG',
    '/Volumes/My Passport/MediaPoster/workspace1/iphone_import/IMG_8352.JPG',
  ];

  const outputDir = 'public/assets/stickers/isaiah';
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('🎨 Generating stickers using Gemini...');
  console.log(`   Output: ${outputDir}`);

  const stickers: StickerResult[] = [];

  for (const imgPath of inputImages) {
    if (!fs.existsSync(imgPath)) {
      console.log(`  ⚠️ File not found: ${imgPath}`);
      continue;
    }

    const basename = path.basename(imgPath, path.extname(imgPath));
    const outputPath = path.join(outputDir, `${basename}_sticker.png`);

    try {
      console.log(`  Processing: ${imgPath}`);
      const stickerBuffer = await processImageWithGemini(imgPath);
      fs.writeFileSync(outputPath, stickerBuffer);
      console.log(`  ✅ Saved: ${outputPath}`);
      
      stickers.push({
        source: imgPath,
        sticker: outputPath,
        filename: path.basename(outputPath)
      });
    } catch (error) {
      console.error(`  ❌ Error: ${error}`);
    }
    
    // Rate limit
    await new Promise(r => setTimeout(r, 2000));
  }

  // Create manifest
  const manifest = {
    stickers,
    count: stickers.length,
    outputDir
  };

  fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  
  console.log(`\n✅ Generated ${stickers.length} stickers`);
  console.log(`📄 Manifest: ${outputDir}/manifest.json`);
}

main().catch(console.error);
