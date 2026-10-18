/**
 * Stage 2: Video Generation — Veo 3.1 via Google AI
 *
 * Animates the before image using the motion prompt.
 * Offer-agnostic: works with any motionPrompt.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { AngleInputs, StageResult } from './offer.schema.js';

function getKey(): string {
  const key = process.env.GOOGLE_API_KEY || process.env.GOOGLE_VEO_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GOOGLE_API_KEY not set');
  return key;
}

export async function runStageVideo(
  inputs: AngleInputs,
  outputDir: string,
  aspectRatio: string
): Promise<StageResult> {
  const t0 = Date.now();
  const safeAspect = aspectRatio.replace(':', 'x');
  const videoPath = path.join(outputDir, `video_${safeAspect}.mp4`);
  const beforePath = path.join(outputDir, 'before.png');

  console.log(`\n🎬 Stage 2: Veo 3.1 — Video Generation`);

  if (fs.existsSync(videoPath)) {
    console.log(`   ⏭️  video_${safeAspect}.mp4 exists`);
    return { status: 'done', outputs: [videoPath], durationMs: Date.now() - t0 };
  }

  if (!fs.existsSync(beforePath)) {
    return { status: 'skipped', outputs: [], error: 'before.png not found — run Stage 1 first' };
  }

  const key = getKey();
  const imageB64 = fs.readFileSync(beforePath).toString('base64');

  // Strip audio/sound descriptions — Veo RAI filter blocks prompts with audio cues
  const safePrompt = inputs.motionPrompt
    .replace(/\b(sound|sounds|audio|ambient|noise|music|voice|voices|speaking|talking|saying|whisper|whispers|notification|ping|ding|ring|rings|chime|chimes|beep|beeps|buzz|buzzes|hear|heard|hearing|listen|listening)\b[^.]*[.,]?\s*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const payload = JSON.stringify({
    instances: [{ prompt: safePrompt, image: { bytesBase64Encoded: imageB64, mimeType: 'image/png' } }],
    parameters: { aspectRatio, personGeneration: 'allow_adult' },
  });

  const opFile = path.join(outputDir, 'veo_operation.json');

  try {
    let operationName: string;

    if (fs.existsSync(opFile)) {
      operationName = JSON.parse(fs.readFileSync(opFile, 'utf-8')).operationName;
      console.log(`   ♻️  Resuming operation: ${operationName.split('/').pop()}`);
    } else {
      console.log(`   📡 Submitting to Veo 3.1...`);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:predictLongRunning?key=${key}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }
      );
      if (!res.ok) throw new Error(`Veo submit ${res.status}: ${(await res.text()).substring(0, 300)}`);
      const result = await res.json() as any;
      if (result.error) throw new Error(`Veo: ${result.error.message}`);
      if (!result.name) throw new Error(`Veo no operation name: ${JSON.stringify(result).substring(0, 200)}`);
      operationName = result.name;
      fs.writeFileSync(opFile, JSON.stringify({ operationName, submittedAt: new Date().toISOString() }, null, 2));
      console.log(`   ✅ Submitted: ${operationName.split('/').pop()}`);
    }

    // Poll until done
    console.log(`   ⏳ Polling (up to 10 min)...`);
    const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${key}`;
    const start = Date.now();

    while (Date.now() - start < 600_000) {
      await new Promise((r) => setTimeout(r, 10_000));
      const res = await fetch(pollUrl);
      if (!res.ok) { console.log(`   ⏳ Poll ${res.status}, retrying...`); continue; }
      const result = await res.json() as any;
      if (result.error) throw new Error(`Veo poll error: ${result.error.message}`);
      const pct = result.metadata?.progressPercent || 0;
      process.stdout.write(`\r   ⏳ ${pct}% (${Math.round((Date.now() - start) / 1000)}s)`);
      if (!result.done) continue;
      console.log('');

      // Extract video — try multiple response shapes
      const videoUrl =
        result.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
        result.response?.videoUri ||
        result.response?.videos?.[0]?.uri || '';

      if (!videoUrl) {
        fs.writeFileSync(opFile.replace('.json', '_result.json'), JSON.stringify(result, null, 2));
        const raiCount = result.response?.generateVideoResponse?.raiMediaFilteredCount;
        const raiReasons = result.response?.generateVideoResponse?.raiMediaFilteredReasons;
        if (raiCount) {
          throw new Error(`Veo RAI filter blocked video (${raiCount} filtered). Reason: ${raiReasons?.[0] ?? 'unknown'}. Try simplifying the motion prompt.`);
        }
        throw new Error('Veo done but no video URL. Raw result saved to veo_operation_result.json');
      }

      const sep = videoUrl.includes('?') ? '&' : '?';
      const dlRes = await fetch(`${videoUrl}${sep}key=${key}`, { redirect: 'follow' });
      if (!dlRes.ok) throw new Error(`Veo download failed: ${dlRes.status}`);
      const buf = Buffer.from(await dlRes.arrayBuffer());
      fs.writeFileSync(videoPath, buf);
      console.log(`   ✅ video_${safeAspect}.mp4 (${(buf.length / 1024 / 1024).toFixed(1)}MB)`);
      return { status: 'done', outputs: [videoPath], durationMs: Date.now() - t0 };
    }

    throw new Error('Veo timed out after 10 minutes');
  } catch (err: any) {
    return { status: 'failed', outputs: [], durationMs: Date.now() - t0, error: err.message };
  }
}
