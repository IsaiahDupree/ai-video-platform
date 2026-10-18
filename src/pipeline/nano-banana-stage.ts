/**
 * Nano Banana Stage
 *
 * Uses Google Gemini (gemini-2.0-flash-exp) to generate character-consistent
 * before/after product images for UGC ads.
 *
 * Based on existing: scripts/remix-character-gemini.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import type { NanoBananaInput, NanoBananaOutput, ImagePair } from './types';

// =============================================================================
// Gemini API Helpers
// =============================================================================

function getApiKey(): string {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY not set. Add to .env.local');
  }
  return key;
}

function geminiRequest(body: object): Promise<any> {
  const apiKey = getApiKey();

  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(
      {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
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

function geminiImageRequest(prompt: string, referenceBase64: string, mimeType: string): Promise<any> {
  const apiKey = getApiKey();

  const body = {
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: referenceBase64 } },
        { text: prompt },
      ],
    }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
    },
  };

  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(
      {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
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

// =============================================================================
// Character Analysis
// =============================================================================

interface CharacterProfile {
  name: string;
  description: string;
  style: string;
  traits: string[];
}

async function analyzeProductImage(imagePath: string): Promise<CharacterProfile> {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

  const response = await geminiRequest({
    contents: [{
      parts: [
        {
          text: `Analyze this product image for ad generation. Extract visual traits for consistent scene recreation.

Return a JSON response with:
{
  "name": "descriptive name for this product",
  "description": "detailed physical description (2-3 sentences)",
  "style": "visual style description (colors, textures, lighting)",
  "traits": ["trait1", "trait2", ...] // 5-8 key visual identifiers
}

Return ONLY the JSON, no other text.`,
        },
        {
          inline_data: {
            mime_type: mimeType,
            data: base64Image,
          },
        },
      ],
    }],
  });

  const content = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse product analysis response');
  }

  return JSON.parse(jsonMatch[0]) as CharacterProfile;
}

// =============================================================================
// Image Generation
// =============================================================================

function buildBeforePrompt(
  profile: CharacterProfile,
  scenePrompt: string,
  characterStyle: string
): string {
  return `Generate an image showing a BEFORE state for an ad.

PRODUCT: ${profile.name}
${profile.description}
Visual Style: ${characterStyle}

SCENE (BEFORE - the problem state):
${scenePrompt}

REQUIREMENTS:
- Show the "problem" state clearly
- ${characterStyle} art style
- The scene should evoke the frustration/pain point
- Product context should be visible
- High quality, ad-ready composition
- Clean background suitable for text overlay

Generate this as a single high-quality image.`;
}

function buildAfterPrompt(
  profile: CharacterProfile,
  scenePrompt: string,
  characterStyle: string
): string {
  return `Generate an image showing an AFTER state for an ad.

PRODUCT: ${profile.name}
${profile.description}
Visual Style: ${characterStyle}

SCENE (AFTER - the solution state):
${scenePrompt}

REQUIREMENTS:
- Show the "solution" state clearly - the positive outcome
- ${characterStyle} art style
- The scene should evoke satisfaction/relief
- MUST maintain visual consistency with a "before" scene (same character, same setting angle)
- Product benefit should be visible
- High quality, ad-ready composition
- Clean background suitable for text overlay

Generate this as a single high-quality image.`;
}

async function generateImage(
  prompt: string,
  referenceBase64: string,
  mimeType: string,
  outputPath: string
): Promise<string> {
  const response = await geminiImageRequest(prompt, referenceBase64, mimeType);

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    const imageData = part.inline_data?.data || part.inlineData?.data;
    if (imageData) {
      const imageBuffer = Buffer.from(imageData, 'base64');
      fs.writeFileSync(outputPath, imageBuffer);
      return outputPath;
    }
  }

  // Check predictions format (Imagen style)
  const predictions = response.predictions || [];
  if (predictions.length > 0 && predictions[0].bytesBase64Encoded) {
    const imageBuffer = Buffer.from(predictions[0].bytesBase64Encoded, 'base64');
    fs.writeFileSync(outputPath, imageBuffer);
    return outputPath;
  }

  throw new Error('No image data in Gemini response');
}

// =============================================================================
// Stage Entry Point
// =============================================================================

export async function runNanoBananaStage(input: NanoBananaInput): Promise<NanoBananaOutput> {
  const { product, scene, imageCount, outputDir } = input;

  console.log('🍌 Nano Banana Stage: Generating before/after images');
  console.log(`   Product: ${product.name}`);
  console.log(`   Style: ${scene.characterStyle}`);
  console.log(`   Pairs: ${imageCount}`);

  fs.mkdirSync(outputDir, { recursive: true });

  // Load product image as reference
  const imagePath = product.imagePath || '';
  let referenceBase64 = '';
  let referenceMimeType = 'image/png';

  if (imagePath && fs.existsSync(imagePath)) {
    referenceBase64 = fs.readFileSync(imagePath).toString('base64');
    referenceMimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
  } else if (product.imageUrl) {
    // Download from URL
    console.log(`   Downloading product image from URL...`);
    const https = await import('https');
    const http = await import('http');
    const mod = product.imageUrl.startsWith('https') ? https : http;
    const imageData = await new Promise<Buffer>((resolve, reject) => {
      mod.get(product.imageUrl!, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    });
    referenceBase64 = imageData.toString('base64');
    const localPath = path.join(outputDir, 'product_reference.png');
    fs.writeFileSync(localPath, imageData);
  }

  // Analyze product
  let characterProfile: CharacterProfile;
  if (referenceBase64 && imagePath && fs.existsSync(imagePath)) {
    console.log('   🔍 Analyzing product image...');
    characterProfile = await analyzeProductImage(imagePath);
  } else {
    characterProfile = {
      name: product.name,
      description: product.description,
      style: scene.characterStyle,
      traits: [product.name, scene.characterStyle],
    };
  }

  console.log(`   ✅ Character profile: "${characterProfile.name}"`);

  // Save character profile
  fs.writeFileSync(
    path.join(outputDir, 'character_profile.json'),
    JSON.stringify(characterProfile, null, 2)
  );

  // Generate before/after pairs
  const pairs: ImagePair[] = [];

  for (let i = 0; i < imageCount; i++) {
    const pairId = `pair_${String(i + 1).padStart(2, '0')}`;
    console.log(`\n   🖼️  Generating pair ${i + 1}/${imageCount}: ${pairId}`);

    const beforePath = path.join(outputDir, `${pairId}_before.png`);
    const afterPath = path.join(outputDir, `${pairId}_after.png`);

    try {
      // Generate "before" image
      console.log(`      Before: "${scene.beforePrompt.substring(0, 60)}..."`);
      const beforePrompt = buildBeforePrompt(characterProfile, scene.beforePrompt, scene.characterStyle);

      if (referenceBase64) {
        await generateImage(beforePrompt, referenceBase64, referenceMimeType, beforePath);
      } else {
        // Text-only generation (no reference image)
        const resp = await geminiRequest({
          contents: [{ parts: [{ text: beforePrompt }] }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        });
        const parts = resp.candidates?.[0]?.content?.parts || [];
        let saved = false;
        for (const part of parts) {
          const imgData = part.inline_data?.data || part.inlineData?.data;
          if (imgData) {
            fs.writeFileSync(beforePath, Buffer.from(imgData, 'base64'));
            saved = true;
            break;
          }
        }
        if (!saved) throw new Error('No image data for before scene');
      }
      console.log(`      ✅ Before image saved`);

      // Rate limit
      await new Promise(r => setTimeout(r, 2000));

      // Generate "after" image
      console.log(`      After: "${scene.afterPrompt.substring(0, 60)}..."`);
      const afterPrompt = buildAfterPrompt(characterProfile, scene.afterPrompt, scene.characterStyle);

      // Use "before" image as reference for consistency
      const beforeBase64 = fs.readFileSync(beforePath).toString('base64');
      await generateImage(afterPrompt, beforeBase64, 'image/png', afterPath);
      console.log(`      ✅ After image saved`);

      pairs.push({
        id: pairId,
        beforeImagePath: beforePath,
        afterImagePath: afterPath,
        characterProfileId: `${characterProfile.name}_${i}`,
        metadata: {
          style: scene.characterStyle,
          beforePrompt: scene.beforePrompt,
          afterPrompt: scene.afterPrompt,
          confidence: 0.85,
        },
      });

      // Rate limit between pairs
      if (i < imageCount - 1) {
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch (error: any) {
      console.log(`      ❌ Failed pair ${pairId}: ${error.message}`);
    }
  }

  // Save manifest
  const manifest = {
    product: product.name,
    characterProfile,
    pairs: pairs.map(p => ({
      id: p.id,
      before: p.beforeImagePath,
      after: p.afterImagePath,
    })),
    generatedAt: new Date().toISOString(),
    provider: 'gemini-nano-banana',
  };

  fs.writeFileSync(
    path.join(outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`\n   📊 Nano Banana complete: ${pairs.length}/${imageCount} pairs generated`);

  return {
    pairs,
    characterProfile,
    outputDir,
  };
}
