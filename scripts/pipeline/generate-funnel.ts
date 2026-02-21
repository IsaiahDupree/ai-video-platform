/**
 * Full-Funnel Video Generator
 *
 * Generates a 45-60s UGC ad that transitions through the entire awareness funnel:
 *   Hook & Mirror → Name Enemy → Mechanism → Proof → CTA
 *
 * Uses a structured funnel script JSON with:
 *   - Per-segment voiceover, shot descriptions, on-screen text
 *   - Consistent character + voice profile across ALL clips
 *   - Framework stage annotations for each segment
 *   - Pre-split long segments into ≤20 word clips
 *
 * Usage:
 *   npx tsx scripts/pipeline/generate-funnel.ts --script offers/everreach-funnel.json
 *   npx tsx scripts/pipeline/generate-funnel.ts --script offers/everreach-funnel.json --force
 *   npx tsx scripts/pipeline/generate-funnel.ts --script offers/everreach-funnel.json --cta problem-aware-challenge
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import {
  buildLipsyncPrompt,
  buildCharacterDescription,
  buildVoiceProfile,
  type CharacterTraits,
  type VoiceProfile,
} from './stage-lipsync.js';

// =============================================================================
// GPT-4o vision: describe character from reference image for prompt locking
// =============================================================================

async function describeCharacterFromImage(imagePath: string): Promise<string> {
  const openAIKey = process.env.OPENAI_API_KEY;
  if (!openAIKey || !fs.existsSync(imagePath)) return '';

  const cacheFile = imagePath.replace(/\.png$/, '_char_desc.txt');
  if (fs.existsSync(cacheFile)) {
    const cached = fs.readFileSync(cacheFile, 'utf-8').trim();
    if (cached) return cached;
  }

  const b64 = fs.readFileSync(imagePath).toString('base64');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${openAIKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `Describe the person in this image for use as a locked character description in an AI video generation prompt. Be extremely specific about: exact age range (e.g. "27-29"), gender, hair color and style, skin tone, eye color if visible, clothing (specific color and item), and one distinguishing feature. Format as a single dense description string, no bullet points, no labels. Do not include background or setting details.` },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}`, detail: 'low' } },
        ],
      }],
    }),
  });
  if (!res.ok) return '';
  const result = await res.json() as any;
  const desc = result.choices?.[0]?.message?.content?.trim() ?? '';
  if (desc) fs.writeFileSync(cacheFile, desc, 'utf-8');
  return desc;
}

async function uploadToFalStorage(imagePath: string, falKey: string): Promise<string> {
  if (!fs.existsSync(imagePath)) return '';
  const cacheFile = imagePath.replace(/\.png$/, '_fal_url.txt');
  if (fs.existsSync(cacheFile)) {
    const cached = fs.readFileSync(cacheFile, 'utf-8').trim();
    if (cached.startsWith('https://')) return cached;
  }
  try {
    const fileName = path.basename(imagePath);
    const initiateRes = await fetch(`https://rest.fal.run/storage/upload/initiate?file_name=${encodeURIComponent(fileName)}&content_type=image%2Fpng`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${falKey}` },
    });
    if (!initiateRes.ok) return '';
    const { upload_url, file_url } = await initiateRes.json() as any;
    if (!upload_url || !file_url) return '';
    const imageBytes = fs.readFileSync(imagePath);
    const putRes = await fetch(upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/png', 'Content-Length': String(imageBytes.length) },
      body: imageBytes,
    });
    if (!putRes.ok) return '';
    fs.writeFileSync(cacheFile, file_url, 'utf-8');
    return file_url as string;
  } catch { return ''; }
}

// =============================================================================
// Types
// =============================================================================

interface FunnelSegment {
  id: string;
  framework: string;
  voiceover: string;
  shotDescription?: string;
  onScreenText?: string;
  awareness?: string;
}

interface FunnelScript {
  title: string;
  description?: string;
  targetDuration?: number;
  character: CharacterTraits;
  voice: VoiceProfile;
  setting: string;
  frameworks?: Array<{ id: string; label: string; startSec: number; endSec: number }>;
  segments: FunnelSegment[];
  ctaVariants?: Record<string, string>;
}

// =============================================================================
// Helpers
// =============================================================================

const MAX_WORDS_PER_CLIP = 20;

function getFalKey(): string {
  const key = process.env.FAL_KEY || process.env.FAL_API_KEY;
  if (!key) throw new Error('FAL_KEY not set — get a key at fal.ai/dashboard and add it to .env.local');
  return key;
}

function getClipDuration(clipPath: string): number {
  try {
    const out = execSync(
      `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${clipPath}"`,
      { encoding: 'utf-8' }
    ).trim();
    return parseFloat(out) || 8;
  } catch { return 8; }
}

function getClipDimensions(clipPath: string): { w: number; h: number } {
  try {
    const out = execSync(
      `ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${clipPath}"`,
      { encoding: 'utf-8' }
    ).trim();
    const [w, h] = out.split(',').map(Number);
    return { w: w || 720, h: h || 1280 };
  } catch { return { w: 720, h: 1280 }; }
}

function splitLine(line: string): string[] {
  const words = line.split(/\s+/);
  if (words.length <= MAX_WORDS_PER_CLIP) return [line];
  const mid = Math.floor(words.length / 2);
  const punctRe = /[,;.!?—–-]$/;
  let best = mid;
  let bestDist = Infinity;
  for (let i = Math.max(3, mid - 5); i < Math.min(words.length - 3, mid + 5); i++) {
    if (punctRe.test(words[i]) && Math.abs(i - mid) < bestDist) {
      bestDist = Math.abs(i - mid); best = i;
    }
  }
  const p1 = words.slice(0, best + 1).join(' ');
  const p2 = words.slice(best + 1).join(' ');
  return [...splitLine(p1), ...splitLine(p2)];
}

// =============================================================================
// fal.ai Veo 3.1 provider (preferred — no RPD quota, $0.40/s with audio)
// Docs: https://fal.ai/models/fal-ai/veo3.1/api
// =============================================================================

async function submitFalClip(
  prompt: string,
  aspectRatio: string,
  falKey: string,
  imageUrl?: string,
): Promise<string> {
  const useImage = !!imageUrl && imageUrl.startsWith('https://');
  const FAL_ENDPOINT = useImage ? 'fal-ai/veo3.1/first-last-frame-to-video' : 'fal-ai/veo3.1';
  const body: Record<string, unknown> = {
    prompt, aspect_ratio: aspectRatio, duration: '8s', resolution: '720p', generate_audio: true, auto_fix: true,
  };
  if (useImage) body.first_frame_url = imageUrl;
  const res = await fetch(`https://queue.fal.run/${FAL_ENDPOINT}`, {
    method: 'POST',
    headers: { 'Authorization': `Key ${falKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`fal.ai submit ${res.status}: ${(await res.text()).substring(0, 300)}`);
  const result = await res.json() as any;
  if (!result.request_id) throw new Error(`fal.ai no request_id: ${JSON.stringify(result).substring(0, 200)}`);
  return `${FAL_ENDPOINT}::${result.request_id}`;
}

async function pollFalClip(requestToken: string, falKey: string): Promise<Buffer> {
  const sep = requestToken.indexOf('::');
  const endpoint = requestToken.slice(0, sep);
  const requestId = requestToken.slice(sep + 2);
  const statusUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}/status`;
  const resultUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}`;
  const start = Date.now();
  while (Date.now() - start < 600_000) {
    await new Promise((r) => setTimeout(r, 8_000));
    let res: Response;
    try {
      res = await fetch(`${statusUrl}?logs=0`, { headers: { 'Authorization': `Key ${falKey}` } });
    } catch { process.stdout.write('~'); continue; }  // transient network error — retry
    if (!res.ok) { process.stdout.write('?'); continue; }
    const status = await res.json() as any;
    const st = status.status as string;
    process.stdout.write(`\r   ⏳ fal.ai: ${st} (${Math.round((Date.now() - start) / 1000)}s)`);
    if (st === 'FAILED') { console.log(''); throw new Error(`fal.ai failed: ${status.error ?? 'unknown'}`) }
    if (st !== 'COMPLETED') continue;
    console.log('');
    const rRes = await fetch(resultUrl, { headers: { 'Authorization': `Key ${falKey}` } });
    if (!rRes.ok) throw new Error(`fal.ai result ${rRes.status}`);
    const result = await rRes.json() as any;
    const videoUrl = result.video?.url || result.output?.video?.url || '';
    if (!videoUrl) throw new Error(`fal.ai no video URL: ${JSON.stringify(result).substring(0, 200)}`);
    const dl = await fetch(videoUrl, { redirect: 'follow' });
    if (!dl.ok) throw new Error(`fal.ai download failed: ${dl.status}`);
    return Buffer.from(await dl.arrayBuffer());
  }
  throw new Error('fal.ai timed out after 10 minutes');
}

// =============================================================================
// Google Gemini Veo 3.1 provider (fallback when FAL_KEY not set)
// =============================================================================

async function submitVeoClip(prompt: string, imagePath: string, aspectRatio: string, key: string): Promise<string> {
  const instance: Record<string, unknown> = { prompt };
  if (fs.existsSync(imagePath)) {
    instance.image = { bytesBase64Encoded: fs.readFileSync(imagePath).toString('base64'), mimeType: 'image/png' };
  }
  const payload = JSON.stringify({ instances: [instance], parameters: { aspectRatio } });
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning?key=${key}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }
  );
  if (!res.ok) throw new Error(`Veo submit ${res.status}: ${(await res.text()).substring(0, 300)}`);
  const result = await res.json() as any;
  if (result.error) throw new Error(`Veo: ${result.error.message}`);
  if (!result.name) throw new Error(`Veo no operation: ${JSON.stringify(result).substring(0, 200)}`);
  return result.name;
}

async function pollVeoClip(opName: string, key: string): Promise<Buffer> {
  const url = `https://generativelanguage.googleapis.com/v1beta/${opName}?key=${key}`;
  const start = Date.now();
  while (Date.now() - start < 600_000) {
    await new Promise((r) => setTimeout(r, 10_000));
    const res = await fetch(url);
    if (!res.ok) { process.stdout.write('?'); continue; }
    const r = await res.json() as any;
    if (r.error) throw new Error(`Veo poll: ${r.error.message}`);
    const pct = r.metadata?.progressPercent || 0;
    process.stdout.write(`\r   ⏳ ${pct}% (${Math.round((Date.now() - start) / 1000)}s)`);
    if (!r.done) continue;
    console.log('');
    const videoUrl =
      r.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
      r.response?.videoUri || r.response?.videos?.[0]?.uri || '';
    if (!videoUrl) {
      const raiCount = r.response?.generateVideoResponse?.raiMediaFilteredCount;
      const raiReasons = r.response?.generateVideoResponse?.raiMediaFilteredReasons;
      if (raiCount) throw new Error(`RAI filter (${raiCount}): ${raiReasons?.[0] ?? 'unknown'}`);
      throw new Error('Veo done but no video URL');
    }
    const sep = videoUrl.includes('?') ? '&' : '?';
    const dl = await fetch(`${videoUrl}${sep}key=${key}`, { redirect: 'follow' });
    if (!dl.ok) throw new Error(`Download failed: ${dl.status}`);
    return Buffer.from(await dl.arrayBuffer());
  }
  throw new Error('Veo timed out after 10 minutes');
}

// =============================================================================
// ASS subtitle builder
// =============================================================================

function formatAssTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}:${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
}

function buildAssSubtitles(lines: string[], durations: number[], w = 720, h = 1280): string {
  const marginV = Math.round(h * 0.08);
  const header = [
    '[Script Info]', 'ScriptType: v4.00+', `PlayResX: ${w}`, `PlayResY: ${h}`, 'WrapStyle: 0', '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: Caption,Arial,62,&H00FFFFFF,&H000000FF,&H00000000,&HAA000000,-1,0,0,0,100,100,0,0,1,3,1,2,40,40,${marginV},1`,
    '', '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ].join('\n');
  let cursor = 0;
  const events = lines.map((line, i) => {
    const start = formatAssTime(cursor);
    cursor += durations[i] ?? 8;
    const end = formatAssTime(cursor);
    const text = line.replace(/\\/g, '\\\\').replace(/{/g, '\\{').replace(/}/g, '\\}');
    return `Dialogue: 0,${start},${end},Caption,,0,0,0,,${text}`;
  }).join('\n');
  return `${header}\n${events}\n`;
}

// =============================================================================
// Main
// =============================================================================

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const eq = line.indexOf('=');
    if (eq === -1 || line.startsWith('#')) continue;
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (k && !process.env[k]) process.env[k] = v;
  }
}

async function main() {
  loadEnv();
  const args = process.argv.slice(2);
  const scriptIdx = args.indexOf('--script');
  const scriptPath = scriptIdx >= 0 ? args[scriptIdx + 1] : args.find((a) => a.endsWith('.json'));
  if (!scriptPath) { console.error('Usage: npx tsx generate-funnel.ts --script <funnel-script.json>'); process.exit(1); }

  const force = args.includes('--force');
  const ctaIdx = args.indexOf('--cta');
  const ctaVariant = ctaIdx >= 0 ? args[ctaIdx + 1] : undefined;
  const aspectRatio = args.find((a) => a.startsWith('--aspect='))?.split('=')[1] ?? '9:16';

  const funnel: FunnelScript = JSON.parse(fs.readFileSync(path.resolve(scriptPath), 'utf-8'));

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  🎬 Full-Funnel Video Generator`);
  console.log(`  ${funnel.title}`);
  console.log(`${'═'.repeat(70)}`);

  // Build character + voice (may be overridden later by GPT-4o vision on before.png)
  let characterDesc = buildCharacterDescription(funnel.character);
  const voiceProfileStr = buildVoiceProfile(funnel.voice);
  const pronoun = funnel.character.gender === 'female' ? 'She' : 'He';

  console.log(`\n  👤 Character: ${characterDesc.slice(0, 70)}...`);
  console.log(`  🎙️  Voice: ${voiceProfileStr.slice(0, 70)}...`);
  console.log(`  🏠 Setting: ${funnel.setting.slice(0, 70)}...`);

  // Apply CTA variant if specified
  if (ctaVariant && funnel.ctaVariants?.[ctaVariant]) {
    const lastSeg = funnel.segments[funnel.segments.length - 1];
    lastSeg.voiceover = funnel.ctaVariants[ctaVariant];
    console.log(`  📣 CTA variant: ${ctaVariant}`);
  }

  // Flatten segments into clips (split long lines)
  interface ClipSpec {
    segmentId: string;
    framework: string;
    line: string;
    shotDescription?: string;
    onScreenText?: string;
    awareness?: string;
    clipIndex: number;
  }

  const clips: ClipSpec[] = [];
  for (const seg of funnel.segments) {
    const lines = splitLine(seg.voiceover);
    for (let j = 0; j < lines.length; j++) {
      clips.push({
        segmentId: seg.id,
        framework: seg.framework,
        line: lines[j],
        shotDescription: seg.shotDescription,
        onScreenText: j === 0 ? seg.onScreenText : undefined, // only show text on first clip of segment
        awareness: seg.awareness,
        clipIndex: clips.length,
      });
    }
  }

  console.log(`\n  📋 ${funnel.segments.length} segments → ${clips.length} clips`);
  console.log(`  📐 Aspect: ${aspectRatio}  |  Target: ~${funnel.targetDuration ?? 55}s`);

  if (funnel.frameworks) {
    console.log(`\n  📊 Framework timeline:`);
    for (const fw of funnel.frameworks) {
      console.log(`     ${fw.startSec}s-${fw.endSec}s  ${fw.label}`);
    }
  }

  // Setup output directory
  const sessionId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputDir = path.join('output', 'pipeline', 'funnel', sessionId);
  const clipsDir = path.join(outputDir, 'clips');
  fs.mkdirSync(clipsDir, { recursive: true });

  // Save the funnel spec
  fs.writeFileSync(path.join(outputDir, 'funnel_spec.json'), JSON.stringify(funnel, null, 2));

  const safeAspect = aspectRatio.replace(':', 'x');
  const finalPath = path.join(outputDir, `funnel_${safeAspect}.mp4`);
  const assPath = path.join(outputDir, 'funnel_captions.ass');

  if (fs.existsSync(finalPath) && !force) {
    console.log(`\n  ⏭️  ${finalPath} exists — use --force to regenerate`);
    process.exit(0);
  }

  const falKey = getFalKey();
  console.log(`\n  💡 Provider: fal.ai ($0.40/s with audio, no RPD quota)`);

  // ── Character lock: derive from before.png if it exists in the output dir ──
  // The funnel JSON has a character description, but if a before.png was generated
  // by stage-images.ts for this session, use GPT-4o vision to extract the exact
  // visual description and lock it across all clips.
  let referenceImageUrl = '';

  const beforePngPath = path.join(outputDir, 'before.png');
  if (fs.existsSync(beforePngPath)) {
    console.log(`\n  🖼️  Locking character from before.png...`);
    const visionDesc = await describeCharacterFromImage(beforePngPath);
    if (visionDesc) {
      characterDesc = visionDesc;
      console.log(`  ✅ Character locked: ${characterDesc.slice(0, 70)}...`);
      referenceImageUrl = await uploadToFalStorage(beforePngPath, falKey);
      if (referenceImageUrl) {
        console.log(`  ✅ Reference image uploaded for first-frame anchoring`);
      }
    }
  }

  const clipPaths: string[] = [];
  const clipDurations: number[] = [];
  const captionLines: string[] = [];
  let quotaExhausted = false;

  console.log(`\n${'─'.repeat(70)}`);

  for (let i = 0; i < clips.length; i++) {
    if (quotaExhausted) {
      console.log(`  ⏭️  Skipping clip ${i + 1}/${clips.length} — Veo quota exhausted`);
      continue;
    }

    const clip = clips[i];
    const clipPath = path.join(clipsDir, `clip_${String(i + 1).padStart(2, '0')}.mp4`);
    const opFile = path.join(clipsDir, `clip_${String(i + 1).padStart(2, '0')}_op.json`);

    const fwLabel = funnel.frameworks?.find((f) => f.id === clip.framework)?.label ?? clip.framework;
    console.log(`\n  🎬 Clip ${i + 1}/${clips.length} [${fwLabel}] (${clip.awareness ?? '?'})`);
    console.log(`     "${clip.line.slice(0, 60)}${clip.line.length > 60 ? '...' : ''}"`);
    if (clip.onScreenText) console.log(`     📝 "${clip.onScreenText}"`);

    if (fs.existsSync(clipPath) && !force) {
      console.log(`     ⏭️  exists`);
      clipPaths.push(clipPath);
      clipDurations.push(getClipDuration(clipPath));
      captionLines.push(clip.line);
      continue;
    }

    // Build prompt with voice profile + shot description
    const shotDesc = clip.shotDescription
      ? `${pronoun} is ${clip.shotDescription.toLowerCase()}.`
      : `${pronoun} holds the phone camera at arm's length, arm clearly visible in frame.`;

    const prompt = buildLipsyncPrompt(
      clip.line, characterDesc, funnel.setting,
      i, clips.length,
      { voiceProfile: voiceProfileStr, shotDescription: shotDesc, pronoun }
    );

    try {
      let operationToken: string;
      if (fs.existsSync(opFile)) {
        const saved = JSON.parse(fs.readFileSync(opFile, 'utf-8'));
        operationToken = saved.operationToken ?? saved.operationName;
        const shortId = operationToken.includes('::') ? operationToken.split('::')[1].slice(0, 8) : operationToken.split('/').pop();
        console.log(`     ♻️  Resuming: ${shortId}`);
      } else {
        const useImageAnchor = i === 0 && referenceImageUrl;
        console.log(`     📡 Submitting via fal.ai${useImageAnchor ? ' [image-anchored]' : ''}...`);
        operationToken = await submitFalClip(
          prompt, aspectRatio, falKey,
          useImageAnchor ? referenceImageUrl : undefined
        );
        fs.writeFileSync(opFile, JSON.stringify({
          operationToken, provider: 'fal.ai',
          submittedAt: new Date().toISOString(),
          imageAnchored: !!useImageAnchor, prompt,
        }, null, 2));
        const shortId = operationToken.split('::')[1]?.slice(0, 8) ?? operationToken.slice(0, 8);
        console.log(`     ✅ ${shortId}`);
      }

      console.log(`     ⏳ Polling...`);
      const buf = await pollFalClip(operationToken, falKey);
      fs.writeFileSync(clipPath, buf);
      const dur = getClipDuration(clipPath);
      clipPaths.push(clipPath);
      clipDurations.push(dur);
      captionLines.push(clip.line);
      console.log(`     ✅ clip_${i + 1}.mp4 (${(buf.length / 1024 / 1024).toFixed(1)}MB, ${dur.toFixed(1)}s)`);

      // Small delay between submissions
      if (i < clips.length - 1) await new Promise((r) => setTimeout(r, 1000));
    } catch (err: any) {
      console.log(`     ❌ ${err.message}`);
      if (err.message.includes('429') || err.message.includes('quota')) {
        quotaExhausted = true;
        console.log(`     ⛔ Quota exhausted — stopping remaining clips`);
      }
    }
  }

  if (clipPaths.length === 0) {
    console.log(`\n  ❌ No clips generated`);
    process.exit(1);
  }

  // Stitch clips + burn captions
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`\n  🔗 Stitching ${clipPaths.length}/${clips.length} clips...`);

  const concatFile = path.join(clipsDir, 'concat.txt');
  fs.writeFileSync(concatFile, clipPaths.map((p) => `file '${path.resolve(p)}'`).join('\n'));

  const { w, h } = getClipDimensions(clipPaths[0]);
  fs.writeFileSync(assPath, buildAssSubtitles(captionLines, clipDurations, w, h), 'utf-8');

  try {
    const stitchedPath = path.join(clipsDir, 'stitched.mp4');
    if (clipPaths.length === 1) {
      fs.copyFileSync(clipPaths[0], stitchedPath);
    } else {
      execSync(`ffmpeg -y -f concat -safe 0 -i "${path.resolve(concatFile)}" -c copy "${stitchedPath}"`, { stdio: 'pipe' });
    }

    const absAss = path.resolve(assPath).replace(/\\/g, '/').replace(/:/g, '\\:').replace(/ /g, '\\ ');
    execSync(
      `ffmpeg -y -i "${stitchedPath}" -vf "ass='${absAss}'" -c:v libx264 -preset fast -crf 20 -c:a aac -b:a 192k -movflags +faststart "${finalPath}"`,
      { stdio: 'pipe' }
    );

    const mb = (fs.statSync(finalPath).size / 1024 / 1024).toFixed(1);
    const totalDur = clipDurations.reduce((a, b) => a + b, 0);

    console.log(`  ✅ ${finalPath} (${mb}MB, ${totalDur.toFixed(1)}s, ${clipPaths.length} clips)`);

    // Print timeline summary
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`  📊 FULL-FUNNEL VIDEO SUMMARY`);
    console.log(`${'═'.repeat(70)}`);
    console.log(`  Duration: ${totalDur.toFixed(1)}s  |  Clips: ${clipPaths.length}/${clips.length}`);
    console.log(`  Character: ${characterDesc.slice(0, 60)}${referenceImageUrl ? ' [image-anchored]' : ''}`);
    console.log(`  Voice: ${voiceProfileStr.slice(0, 60)}`);
    console.log(`\n  Timeline:`);
    let timeCursor = 0;
    for (let i = 0; i < clipPaths.length; i++) {
      const clip = clips[i];
      const fwLabel = funnel.frameworks?.find((f) => f.id === clip.framework)?.label ?? clip.framework;
      const start = timeCursor.toFixed(0);
      timeCursor += clipDurations[i];
      const end = timeCursor.toFixed(0);
      console.log(`     ${start.padStart(3)}s-${end.padStart(3)}s  [${fwLabel}] "${clip.line.slice(0, 50)}"`);
    }

    console.log(`\n  📁 Output: ${path.resolve(finalPath)}`);
    console.log(`${'═'.repeat(70)}`);

    // Auto-open
    try { execSync(`open "${finalPath}"`, { stdio: 'ignore' }); } catch { /* */ }
  } catch (err: any) {
    const stderr = err.stderr?.toString() || err.message;
    console.log(`  ❌ ffmpeg stitch failed: ${stderr.slice(-300)}`);
    process.exit(1);
  }
}

main().catch((err) => { console.error(`\n❌ ${err.message}`); process.exit(1); });
