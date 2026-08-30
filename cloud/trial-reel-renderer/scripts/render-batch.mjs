#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [requestArg, outputArg] = process.argv.slice(2);
if (!requestArg || !outputArg) {
  throw new Error('Usage: render-batch.mjs <request.json> <output-directory>');
}

const requestPath = path.resolve(requestArg);
const outputDir = path.resolve(outputArg);
const request = JSON.parse(fs.readFileSync(requestPath, 'utf8'));
const validateOnly = process.argv.includes('--validate-only');

const safeId = (value, field) => {
  const normalized = String(value || '').trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{1,127}$/.test(normalized)) {
    throw new Error(`${field} must be a filesystem-safe identifier`);
  }
  return normalized;
};
const sha256File = (filePath) =>
  createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
const capture = (command, args) =>
  execFileSync(command, args, { encoding: 'utf8' }).trim();

if (request.schema_version !== '1.0') throw new Error('schema_version must be 1.0');
const familyId = safeId(request.family_id, 'family_id');
if (!String(request.video_url || '').startsWith('https://')) {
  throw new Error('video_url must be HTTPS');
}
const durationSec = Number(request.duration_sec);
if (!(durationSec > 0 && durationSec <= 180)) {
  throw new Error('duration_sec must be between zero and 180');
}
if (!Array.isArray(request.variants) || request.variants.length === 0) {
  throw new Error('variants are required');
}
for (const key of ['visual_filter', 'on_screen_text', 'post_caption']) {
  const values = new Set(request.variants.map((item) => String(item[key] || '').trim()));
  if (values.size !== request.variants.length || values.has('')) {
    throw new Error(`every variant must have a distinct ${key}`);
  }
}

if (validateOnly) {
  process.stdout.write(`${JSON.stringify({
    ok: true,
    request_id: request.request_id,
    family_id: familyId,
    mode: request.mode,
    variants: request.variants.length,
    provider_writes_performed: false,
  }, null, 2)}\n`);
  process.exit(0);
}

fs.mkdirSync(outputDir, { recursive: true });
const renderer = path.resolve('node_modules/.bin/remotion');
const outputs = [];

for (const raw of request.variants) {
  const variantId = safeId(raw.id, 'variant.id');
  const props = {
    videoUrl: request.video_url,
    durationSec,
    onScreenText: raw.on_screen_text,
    onScreenSubtext: raw.on_screen_subtext || '',
    accentColor: raw.accent_color,
    visualFilter: raw.visual_filter,
    overlayColor: raw.overlay_color,
    overlayOpacity: raw.overlay_opacity,
    cropScale: raw.crop_scale,
    cropXPercent: raw.crop_x_percent,
    cropYPercent: raw.crop_y_percent,
    brandId: request.brand_id || 'the_isaiah_dupree',
  };
  const propsPath = path.join(outputDir, `${variantId}.props.json`);
  const outputPath = path.join(outputDir, `${variantId}.mp4`);
  fs.writeFileSync(propsPath, `${JSON.stringify(props, null, 2)}\n`);
  execFileSync(renderer, [
    'render', 'src/index.tsx', 'TrialReelVariant', outputPath,
    '--props', propsPath,
    '--codec=h264',
    '--pixel-format=yuv420p',
    '--crf=18',
    '--concurrency=2',
    '--log=warn',
  ], { stdio: 'inherit' });
  if (!fs.existsSync(outputPath)) throw new Error(`render produced no output for ${variantId}`);
  const probe = JSON.parse(capture('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate',
    '-of', 'json',
    outputPath,
  ]));
  const receipt = {
    schema_version: '1.0',
    contract_type: 'github_actions_remotion_trial_reel_render_receipt',
    request_id: request.request_id,
    family_id: familyId,
    variant_id: variantId,
    variant_code: raw.code,
    mode: request.mode,
    source_sha256: request.source_sha256,
    renderer: { engine: 'remotion', version: '4.0.434', lane: 'github-actions-ubuntu' },
    factors: {
      visual_filter: raw.visual_filter,
      overlay_color: raw.overlay_color,
      overlay_opacity: raw.overlay_opacity,
      crop_scale: raw.crop_scale,
      crop_x_percent: raw.crop_x_percent,
      crop_y_percent: raw.crop_y_percent,
      on_screen_text: raw.on_screen_text,
      on_screen_subtext: raw.on_screen_subtext || '',
      accent_color: raw.accent_color,
      post_caption: raw.post_caption,
    },
    post_caption: raw.post_caption,
    output_path: outputPath,
    output_sha256: sha256File(outputPath),
    probe,
    rendered_at: new Date().toISOString(),
  };
  const receiptPath = path.join(outputDir, `${variantId}.render-receipt.json`);
  fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  outputs.push({ ...receipt, receipt_path: receiptPath });
}

if (new Set(outputs.map((item) => item.output_sha256)).size !== outputs.length) {
  throw new Error('rendered outputs are not byte-unique');
}
const batch = {
  schema_version: '1.0',
  contract_type: 'github_actions_remotion_trial_reel_render_batch_receipt',
  request_id: request.request_id,
  family_id: familyId,
  mode: request.mode,
  request_sha256: sha256File(requestPath),
  outputs,
  rendered_at: new Date().toISOString(),
};
fs.writeFileSync(
  path.join(outputDir, 'render-batch-receipt.json'),
  `${JSON.stringify(batch, null, 2)}\n`,
);
