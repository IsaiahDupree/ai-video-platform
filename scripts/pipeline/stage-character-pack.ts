/**
 * Stage 0.5: Character Pack Generation — Ideogram Character API via fal.ai
 *
 * Generates a consistent set of character anchor stills BEFORE video generation.
 * These stills are used as reference images for Veo 3.1 first-frame anchoring
 * and Kling O1 element packs, ensuring zero character drift across clips.
 *
 * Research basis: docs/research/FAL_CHARACTER_CONSISTENCY_DEEP_DIVE.md
 * Character data: docs/research/AD_CHARACTER_PACK.json
 *
 * Output files (in outputDir/character_pack/):
 *   - front_neutral.png    — front-facing headshot, neutral expression
 *   - front_smile.png      — front-facing headshot, warm smile
 *   - three_quarter_left.png — ¾ left angle
 *   - three_quarter_right.png — ¾ right angle
 *   - selfie_upper.png     — upper-body selfie framing (UGC pose)
 *   - seated_desk.png      — seated at desk with phone
 *   - pack_manifest.json   — URLs + metadata for all generated images
 *
 * Usage:
 *   Called by smart-generate.ts before stage-images.ts
 *   Or standalone: npx tsx scripts/pipeline/stage-character-pack.ts --offer offers/everreach.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import type { StageResult } from './offer.schema.js';
import {
  loadCharacterPack,
  selectCharacter,
  buildCharacterImagePrompt,
  type PackCharacter,
  type CharacterPack,
} from './character-pack.js';

// =============================================================================
// fal.ai helpers
// =============================================================================

function getFalKey(): string {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error('FAL_KEY not set in .env.local — required for character pack generation');
  return key;
}

/**
 * Upload a local image to fal.ai storage.
 * Returns the public file_url, or '' on failure.
 */
async function uploadToFalStorage(imagePath: string, falKey: string): Promise<string> {
  if (!fs.existsSync(imagePath)) return '';
  const cacheFile = imagePath.replace(/\.(png|jpg|jpeg)$/, '_fal_url.txt');
  if (fs.existsSync(cacheFile)) {
    const cached = fs.readFileSync(cacheFile, 'utf-8').trim();
    if (cached.startsWith('https://')) return cached;
  }
  try {
    const fileName = path.basename(imagePath);
    const ext = imagePath.endsWith('.jpg') || imagePath.endsWith('.jpeg') ? 'jpeg' : 'png';
    const contentType = `image/${ext}`;
    const initiateRes = await fetch(
      `https://rest.fal.run/storage/upload/initiate?file_name=${encodeURIComponent(fileName)}&content_type=${encodeURIComponent(contentType)}`,
      { method: 'POST', headers: { 'Authorization': `Key ${falKey}` } }
    );
    if (!initiateRes.ok) return '';
    const { upload_url, file_url } = await initiateRes.json() as any;
    if (!upload_url || !file_url) return '';
    const imageBytes = fs.readFileSync(imagePath);
    const putRes = await fetch(upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': contentType, 'Content-Length': String(imageBytes.length) },
      body: imageBytes,
    });
    if (!putRes.ok) return '';
    fs.writeFileSync(cacheFile, file_url, 'utf-8');
    return file_url as string;
  } catch { return ''; }
}

// =============================================================================
// Pose definitions for character pack
// =============================================================================

interface PoseSpec {
  id: string;
  filename: string;
  description: string;
  sceneDescription: string;
}

const CHARACTER_POSES: PoseSpec[] = [
  {
    id: 'front_neutral',
    filename: 'front_neutral.png',
    description: 'Front-facing headshot, neutral expression',
    sceneDescription: 'front-facing portrait, neutral expression, direct eye contact, plain soft-lit background, upper chest visible, sharp focus portrait photography',
  },
  {
    id: 'front_smile',
    filename: 'front_smile.png',
    description: 'Front-facing headshot, warm natural smile',
    sceneDescription: 'front-facing portrait, warm genuine smile showing slight teeth, direct eye contact, soft indoor lighting, upper chest visible, portrait photography',
  },
  {
    id: 'three_quarter_left',
    filename: 'three_quarter_left.png',
    description: '¾ left angle, slight smile',
    sceneDescription: 'three-quarter left angle portrait, slight smile, natural expression, soft ambient lighting, clean background, portrait photography',
  },
  {
    id: 'three_quarter_right',
    filename: 'three_quarter_right.png',
    description: '¾ right angle, slight smile',
    sceneDescription: 'three-quarter right angle portrait, slight smile, looking slightly off-camera then back, warm ambient lighting, clean background, portrait photography',
  },
  {
    id: 'selfie_upper',
    filename: 'selfie_upper.png',
    description: 'Upper-body selfie framing, UGC style',
    sceneDescription: 'selfie-style upper body shot, phone held at arm\'s length, arm visible in frame, natural indoor lighting, cozy home environment, UGC smartphone quality, warm conversational expression',
  },
  {
    id: 'seated_desk',
    filename: 'seated_desk.png',
    description: 'Seated at desk with phone visible',
    sceneDescription: 'seated at a modern desk, phone in hand, relaxed posture, natural window light, home office setting, upper body and face clearly visible, candid moment',
  },
];

// =============================================================================
// Image generation via Imagen 4 (Google) — same as stage-images.ts
// =============================================================================

import * as https from 'https';

function getGoogleKey(): string {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GOOGLE_API_KEY not set — required for Imagen 4');
  return key;
}

async function imagen4Generate(prompt: string, aspectRatio: string): Promise<Buffer> {
  const key = getGoogleKey();
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

// =============================================================================
// Pack manifest — saved alongside generated images
// =============================================================================

export interface PackManifest {
  characterId: string;
  characterName: string;
  generatedAt: string;
  poses: Array<{
    id: string;
    filename: string;
    localPath: string;
    falUrl: string;
    description: string;
  }>;
  frontalUrl: string;      // Best front-facing image URL for Kling elements
  referenceUrls: string[]; // All angle variation URLs for Kling elements
}

// =============================================================================
// Main stage runner
// =============================================================================

export async function runStageCharacterPack(
  outputDir: string,
  options?: {
    audienceCategory?: string;
    awarenessStage?: string;
    preferredGender?: string;
    force?: boolean;
  },
): Promise<StageResult & { manifest?: PackManifest }> {
  const t0 = Date.now();
  const packDir = path.join(outputDir, 'character_pack');
  const manifestPath = path.join(packDir, 'pack_manifest.json');

  console.log(`\n🎭 Stage 0.5: Character Pack Generation`);

  // Check for existing manifest
  if (fs.existsSync(manifestPath) && !options?.force) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as PackManifest;
      const allExist = manifest.poses.every(p => fs.existsSync(p.localPath));
      if (allExist) {
        console.log(`   ⏭️  Character pack exists: ${manifest.characterName} (${manifest.poses.length} poses)`);
        return { status: 'done', outputs: manifest.poses.map(p => p.localPath), durationMs: Date.now() - t0, manifest };
      }
    } catch { /* regenerate */ }
  }

  fs.mkdirSync(packDir, { recursive: true });

  // Load character pack
  const pack = loadCharacterPack();
  if (!pack) {
    console.log(`   ⚠️  AD_CHARACTER_PACK.json not found — skipping character pack generation`);
    return { status: 'skipped', outputs: [], durationMs: Date.now() - t0 };
  }

  // Select character
  const selectedChar = selectCharacter(
    pack,
    options?.audienceCategory ?? '',
    options?.awarenessStage,
    options?.preferredGender,
  );
  console.log(`   🎭 Selected: ${selectedChar.name} (${selectedChar.id}) — ${selectedChar.archetype}`);
  console.log(`   📋 Identity: ${selectedChar.identity_prompt_block.slice(0, 80)}...`);

  // Generate each pose
  const poseResults: PackManifest['poses'] = [];
  let falKey: string | null = null;
  try { falKey = getFalKey(); } catch { /* fal upload optional */ }

  for (let i = 0; i < CHARACTER_POSES.length; i++) {
    const pose = CHARACTER_POSES[i];
    const localPath = path.join(packDir, pose.filename);

    if (fs.existsSync(localPath) && !options?.force) {
      console.log(`   ⏭️  ${pose.id} exists`);
      let falUrl = '';
      if (falKey) {
        const cached = localPath.replace(/\.(png|jpg|jpeg)$/, '_fal_url.txt');
        if (fs.existsSync(cached)) falUrl = fs.readFileSync(cached, 'utf-8').trim();
      }
      poseResults.push({ id: pose.id, filename: pose.filename, localPath, falUrl, description: pose.description });
      continue;
    }

    console.log(`   📸 Generating ${pose.id} (${i + 1}/${CHARACTER_POSES.length}): ${pose.description}...`);

    try {
      const prompt = buildCharacterImagePrompt(
        selectedChar,
        pack.globals,
        pose.sceneDescription,
      );

      const buf = await imagen4Generate(prompt, '1:1');
      fs.writeFileSync(localPath, buf);
      console.log(`   ✅ ${pose.filename} (${(buf.length / 1024).toFixed(0)}KB)`);

      // Upload to fal.ai storage for use as reference images
      let falUrl = '';
      if (falKey) {
        falUrl = await uploadToFalStorage(localPath, falKey);
        if (falUrl) {
          console.log(`   📤 Uploaded to fal.ai storage`);
        }
      }

      poseResults.push({ id: pose.id, filename: pose.filename, localPath, falUrl, description: pose.description });

      // Rate limit: 2s between Imagen 4 calls
      if (i < CHARACTER_POSES.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (err: any) {
      console.log(`   ⚠️  ${pose.id} failed: ${err.message?.substring(0, 100)}`);
      // Non-fatal — continue with remaining poses
    }
  }

  if (poseResults.length === 0) {
    return { status: 'failed', outputs: [], durationMs: Date.now() - t0, error: 'No poses generated' };
  }

  // Build manifest
  const frontalPose = poseResults.find(p => p.id === 'front_neutral') ?? poseResults[0];
  const referenceUrls = poseResults.filter(p => p.falUrl).map(p => p.falUrl);

  const manifest: PackManifest = {
    characterId: selectedChar.id,
    characterName: selectedChar.name,
    generatedAt: new Date().toISOString(),
    poses: poseResults,
    frontalUrl: frontalPose.falUrl,
    referenceUrls,
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`   ✅ Character pack complete: ${poseResults.length}/${CHARACTER_POSES.length} poses`);
  console.log(`   📁 ${packDir}/pack_manifest.json`);

  return {
    status: 'done',
    outputs: poseResults.map(p => p.localPath),
    durationMs: Date.now() - t0,
    manifest,
  };
}

// =============================================================================
// CLI entry point (standalone usage)
// =============================================================================

async function main() {
  // Load .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
      const eq = line.indexOf('=');
      if (eq === -1 || line.startsWith('#')) continue;
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (k && !process.env[k]) process.env[k] = v;
    }
  }

  const argv = process.argv.slice(2);
  const get = (flag: string) => {
    const eq = argv.find(a => a.startsWith(`--${flag}=`));
    if (eq) return eq.split('=').slice(1).join('=');
    return undefined;
  };

  const outputDir = get('output') ?? 'output/pipeline/character-pack-test';
  const category = get('category') ?? 'friend';
  const gender = get('gender') ?? 'female';
  const force = argv.includes('--force');

  console.log(`\n${'═'.repeat(62)}`);
  console.log(`  🎭 Character Pack Generator (Standalone)`);
  console.log(`  Category: ${category}  |  Gender: ${gender}`);
  console.log(`  Output: ${outputDir}`);
  console.log(`${'═'.repeat(62)}`);

  fs.mkdirSync(outputDir, { recursive: true });

  const result = await runStageCharacterPack(outputDir, {
    audienceCategory: category,
    preferredGender: gender,
    force,
  });

  console.log(`\n  ${result.status === 'done' ? '✅' : '❌'} ${result.status} (${((result.durationMs ?? 0) / 1000).toFixed(1)}s)`);
  if (result.manifest) {
    console.log(`  Character: ${result.manifest.characterName}`);
    console.log(`  Poses: ${result.manifest.poses.length}`);
    console.log(`  Frontal URL: ${result.manifest.frontalUrl || 'N/A'}`);
    console.log(`  Reference URLs: ${result.manifest.referenceUrls.length}`);
  }
}

if (process.argv[1]?.includes('stage-character-pack')) {
  main().catch(err => { console.error(`\n❌ ${err.message}`); process.exit(1); });
}
