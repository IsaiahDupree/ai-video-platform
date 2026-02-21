/**
 * Stage 1: Image Generation — Imagen 4 + Gemini Edit
 *
 * Generates photorealistic before/after images from scene prompts.
 * Uses the Gemini API (generativelanguage.googleapis.com) with GOOGLE_API_KEY.
 *
 * Process:
 *   Step 0: Imagen 4 generates a character reference sheet (identity anchor)
 *   Step 1: Imagen 4 generates before.png with explicit character description
 *   Step 2: Gemini image edit generates after.png using [sheet + before] for consistency
 *
 * Offer-agnostic: works with any beforeScenePrompt + afterScenePrompt.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import type { AngleInputs, StageResult } from './offer.schema.js';

function getKey(): string {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY not set');
  return key;
}

// Imagen 4: text → image via Gemini API
async function imagen4Generate(prompt: string, aspectRatio: string): Promise<Buffer> {
  const key = getKey();
  const ar = aspectRatio === '9:16' ? '9:16' : aspectRatio === '16:9' ? '16:9' : '1:1';
  const body = JSON.stringify({
    instances: [{ prompt }],
    parameters: { sampleCount: 1, aspectRatio: ar, personGeneration: 'allow_adult' },
  });

  const data: Buffer = await new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/imagen-4.0-generate-001:predict?key=${key}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  const parsed = JSON.parse(data.toString());
  if (parsed.error) throw new Error(`Imagen 4: ${parsed.error.message}`);
  const b64 = parsed?.predictions?.[0]?.bytesBase64Encoded
    || parsed?.predictions?.[0]?.image?.imageBytes;
  if (!b64) throw new Error(`Imagen 4 no image: ${data.toString().substring(0, 300)}`);
  return Buffer.from(b64, 'base64');
}

// Gemini image edit: [reference images] + text prompt → edited image
async function geminiEditImage(prompt: string, imagePaths: string[]): Promise<Buffer> {
  const key = getKey();
  const parts: object[] = [];
  for (const imgPath of imagePaths) {
    if (fs.existsSync(imgPath)) {
      parts.push({ inline_data: { mime_type: 'image/png', data: fs.readFileSync(imgPath).toString('base64') } });
    }
  }
  parts.push({ text: prompt });

  const body = JSON.stringify({
    contents: [{ parts }],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
  });

  const data: Buffer = await new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${key}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  const parsed = JSON.parse(data.toString());
  if (parsed.error) throw new Error(`Gemini edit: ${parsed.error.message}`);
  const resParts = parsed.candidates?.[0]?.content?.parts || [];
  for (const part of resParts) {
    const imgData = part.inline_data?.data || part.inlineData?.data;
    if (imgData) return Buffer.from(imgData, 'base64');
  }
  throw new Error(`Gemini edit no image: ${data.toString().substring(0, 300)}`);
}

const UGC_STYLE = `authentic UGC-style photo, shot on iPhone, natural lighting, candid moment, no studio lighting, genuine emotion, slightly imperfect composition, social media native feel`;

export async function runStageImages(
  inputs: AngleInputs,
  outputDir: string,
  aspectRatio: string
): Promise<StageResult> {
  const t0 = Date.now();
  const sheetPath = path.join(outputDir, 'character_sheet.png');
  const beforePath = path.join(outputDir, 'before.png');
  const afterPath = path.join(outputDir, 'after.png');

  console.log(`\n🍌 Stage 1: Imagen 4 + Gemini Edit — Before/After Images`);

  try {
    // Step 0: Character reference sheet
    if (!fs.existsSync(sheetPath)) {
      console.log(`   📸 Step 0: Character reference sheet...`);
      const characterGender = (inputs as any).characterGender ?? 'woman';
      const genderPronoun = characterGender === 'man' ? 'his' : 'her';
      const buf = await imagen4Generate(
        `Character reference sheet. Left half: front-facing headshot of a ${characterGender} in ${genderPronoun} early 30s, casual everyday clothing, neutral expression, plain white background. Right half: same ${characterGender}, 3/4 angle, slight smile, same clothing. Both panels show the exact same individual. Portrait photography, sharp focus, studio quality.`,
        '1:1'
      );
      fs.writeFileSync(sheetPath, buf);
      console.log(`   ✅ character_sheet.png (${(buf.length / 1024).toFixed(0)}KB)`);
      await new Promise((r) => setTimeout(r, 2000));
    } else {
      console.log(`   ⏭️  character_sheet.png exists`);
    }

    // Step 1: Before image
    if (!fs.existsSync(beforePath)) {
      console.log(`   📸 Step 1: Before image...`);
      // Strip words that commonly trigger Imagen 4 safety filters
      const safeBeforeScene = (inputs.beforeScenePrompt ?? '')
        .replace(/\b(stressed|overwhelmed|anxious|depressed|crying|upset|distressed|ignored|lonely|isolated|suffering|pain|hurt|broken)\b/gi, (w) => ({
          stressed: 'thoughtful', overwhelmed: 'busy', anxious: 'pensive', depressed: 'tired',
          crying: 'emotional', upset: 'concerned', distressed: 'worried', ignored: 'disconnected',
          lonely: 'reflective', isolated: 'alone', suffering: 'struggling', pain: 'discomfort',
          hurt: 'sad', broken: 'worn out',
        } as Record<string,string>)[w.toLowerCase()] ?? w);
      const prompt = `${UGC_STYLE}.\nSCENE: ${safeBeforeScene}\nComposition: Subject is the clear foreground focus, face and upper body visible. ${aspectRatio} vertical format.`;
      const buf = await imagen4Generate(prompt, aspectRatio);
      fs.writeFileSync(beforePath, buf);
      console.log(`   ✅ before.png (${(buf.length / 1024).toFixed(0)}KB)`);
      await new Promise((r) => setTimeout(r, 2000));
    } else {
      console.log(`   ⏭️  before.png exists`);
    }

    // Step 2: After image via Gemini edit (character-consistent)
    if (!fs.existsSync(afterPath)) {
      console.log(`   📸 Step 2: After image (Gemini edit, 3 candidates)...`);
      const editPrompt = `Image 1: Character reference sheet.\nImage 2: The BEFORE scene.\n\nGenerate the AFTER scene showing the same person transformed.\nSCENE: ${inputs.afterScenePrompt}\nStyle: ${UGC_STYLE}, ${aspectRatio} vertical.\nCRITICAL: Same person as Image 1 — same face, hair, clothing. Only emotion and context change.`;
      const candidates: Buffer[] = [];
      for (let i = 0; i < 3; i++) {
        try {
          const buf = await geminiEditImage(editPrompt, [sheetPath, beforePath]);
          candidates.push(buf);
          fs.writeFileSync(path.join(outputDir, `after_candidate_${i + 1}.png`), buf);
        } catch (e: any) {
          console.log(`      ⚠️  Candidate ${i + 1} failed: ${e.message}`);
        }
        if (i < 2) await new Promise((r) => setTimeout(r, 2000));
      }
      if (candidates.length === 0) throw new Error('All after-image candidates failed');
      const best = candidates.reduce((a, b) => (a.length >= b.length ? a : b));
      fs.writeFileSync(afterPath, best);
      console.log(`   ✅ after.png — best of ${candidates.length} (${(best.length / 1024).toFixed(0)}KB)`);
    } else {
      console.log(`   ⏭️  after.png exists`);
    }

    return {
      status: 'done',
      outputs: [sheetPath, beforePath, afterPath].filter(fs.existsSync),
      durationMs: Date.now() - t0,
    };
  } catch (err: any) {
    return { status: 'failed', outputs: [], durationMs: Date.now() - t0, error: err.message };
  }
}
