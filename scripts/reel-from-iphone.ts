#!/usr/bin/env npx tsx
/**
 * reel-from-iphone.ts
 *
 * Pipeline: iPhone video → Isaiah-style Reel → publishable MP4
 *
 * Usage:
 *   npx tsx scripts/reel-from-iphone.ts --video /path/to/iphone.mov --hook "your hook text"
 *   npx tsx scripts/reel-from-iphone.ts --video /path/to/iphone.mov --hook "hook" --points "step 1,step 2,step 3" --cta "follow for more"
 *   npx tsx scripts/reel-from-iphone.ts --video /path/to/iphone.mov --brief /path/to/brief.json
 *
 * What it does:
 *   1. Validates & inspects the iPhone video (MOV/MP4/HEVC)
 *   2. Converts to 720x1280 9:16 with warm color grade via ffmpeg
 *   3. Extracts/generates voiceover audio
 *   4. Renders IsaiahStyleReel composition with your video as background
 *   5. Outputs ready-to-post MP4 to ./output/
 */

import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const STUDIO_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(STUDIO_DIR, 'output');
const TMP_DIR = '/tmp/reel-pipeline';

// ── Parse CLI args ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag: string) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const hasFlag = (flag: string) => args.includes(flag);

const videoPath = getArg('--video');
const briefPath = getArg('--brief');
const hook = getArg('--hook') ?? 'something worth saying';
const pointsStr = getArg('--points') ?? '';
const points = pointsStr ? pointsStr.split(',').map(s => s.trim()) : [];
const cta = getArg('--cta') ?? 'follow for more';
const audioPath = getArg('--audio');
const captionText = getArg('--captions') ?? '';
const outputName = getArg('--output') ?? `reel-${Date.now()}.mp4`;
const dryRun = hasFlag('--dry-run');
const grade = (getArg('--grade') as 'warm' | 'cool' | 'moody' | 'clean') ?? 'warm';

// ── Validate ──────────────────────────────────────────────────────────────────
if (!videoPath && !briefPath) {
  console.error('❌ Usage: reel-from-iphone.ts --video /path/to/file.mov [--hook "text"] [--points "a,b,c"] [--cta "text"]');
  process.exit(1);
}

if (videoPath && !fs.existsSync(videoPath)) {
  console.error(`❌ Video not found: ${videoPath}`);
  process.exit(1);
}

fs.mkdirSync(TMP_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ── Step 1: Inspect source video ─────────────────────────────────────────────
console.log('\n📱 Step 1: Inspecting iPhone video...');
let sourceInfo = { width: 0, height: 0, duration: 0, fps: 30, hasAudio: false };

if (videoPath) {
  const probe = execSync(
    `ffprobe -v quiet -print_format json -show_streams -show_format "${videoPath}"`,
    { encoding: 'utf8' }
  );
  const probeData = JSON.parse(probe);
  const vidStream = probeData.streams.find((s: any) => s.codec_type === 'video');
  const audStream = probeData.streams.find((s: any) => s.codec_type === 'audio');

  sourceInfo = {
    width: vidStream?.width ?? 0,
    height: vidStream?.height ?? 0,
    duration: parseFloat(probeData.format?.duration ?? '0'),
    fps: eval(vidStream?.r_frame_rate ?? '30/1'),
    hasAudio: !!audStream,
  };

  console.log(`   ✅ ${sourceInfo.width}x${sourceInfo.height} @ ${sourceInfo.fps.toFixed(1)}fps | ${sourceInfo.duration.toFixed(1)}s | audio: ${sourceInfo.hasAudio}`);
}

// ── Step 2: Prep background video (crop to 9:16, color grade) ────────────────
console.log('\n🎨 Step 2: Converting to 720x1280 with Isaiah style color grade...');

const gradeFilters: Record<string, string> = {
  warm: 'eq=saturation=0.85:brightness=-0.04:gamma=1.05,colorchannelmixer=rr=1.02:gg=0.98:bb=0.95',
  cool: 'eq=saturation=0.8:brightness=0.0:gamma=0.98,colorchannelmixer=rr=0.95:gg=0.98:bb=1.03',
  moody: 'eq=saturation=0.7:brightness=-0.08:contrast=1.1:gamma=1.1',
  clean: 'eq=saturation=1.0:brightness=0.0',
};

const gradedVideoPath = path.join(TMP_DIR, 'background-graded.mp4');

if (videoPath) {
  const gradeFilter = gradeFilters[grade] ?? gradeFilters.warm;
  // Smart crop: if portrait, center-crop to 9:16. If landscape, rotate and crop.
  const isPortrait = sourceInfo.height > sourceInfo.width;
  const cropFilter = isPortrait
    ? `scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280`
    : `scale=-1:1280,crop=720:1280,transpose=1`;

  const ffmpegCmd = [
    'ffmpeg -y',
    `-i "${videoPath}"`,
    `-vf "${cropFilter},${gradeFilter}"`,
    `-c:v h264 -preset fast -crf 20`,
    `-c:a aac -b:a 192k`,
    `-r 30`,
    `-t ${Math.min(sourceInfo.duration, 50)}`,  // cap at 50s
    `"${gradedVideoPath}"`,
  ].join(' ');

  if (!dryRun) {
    console.log(`   Running: ${ffmpegCmd.slice(0, 100)}...`);
    execSync(ffmpegCmd, { stdio: ['ignore', 'pipe', 'pipe'] });
    console.log(`   ✅ Saved to ${gradedVideoPath}`);
  } else {
    console.log(`   [DRY RUN] Would run: ${ffmpegCmd.slice(0, 100)}...`);
  }
}

// ── Step 3: Extract audio if no separate voiceover ───────────────────────────
let resolvedAudioPath = audioPath;

if (!resolvedAudioPath && videoPath && sourceInfo.hasAudio) {
  console.log('\n🔊 Step 3: Extracting audio from iPhone video...');
  const extractedAudio = path.join(TMP_DIR, 'voiceover.aac');
  if (!dryRun) {
    execSync(`ffmpeg -y -i "${videoPath}" -vn -acodec copy "${extractedAudio}"`, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    resolvedAudioPath = extractedAudio;
    console.log(`   ✅ Audio extracted to ${extractedAudio}`);
  } else {
    console.log('   [DRY RUN] Would extract audio');
    resolvedAudioPath = extractedAudio;
  }
} else {
  console.log('\n🔊 Step 3: Audio — using provided path or none');
}

// ── Step 4: Build input props for IsaiahStyleReel ────────────────────────────
console.log('\n🎬 Step 4: Building composition props...');

// Put the processed video in Remotion's public folder so staticFile() finds it
const publicDir = path.join(STUDIO_DIR, 'public');
fs.mkdirSync(publicDir, { recursive: true });

let publicVideoPath: string | undefined;
let publicAudioPath: string | undefined;

if (!dryRun && fs.existsSync(gradedVideoPath)) {
  const publicVideo = path.join(publicDir, `reel-bg-${Date.now()}.mp4`);
  fs.copyFileSync(gradedVideoPath, publicVideo);
  publicVideoPath = path.relative(publicDir, publicVideo);  // relative to public/
  console.log(`   ✅ Background video → public/${publicVideoPath}`);
}

if (!dryRun && resolvedAudioPath && fs.existsSync(resolvedAudioPath)) {
  const audioExt = path.extname(resolvedAudioPath);
  const publicAudio = path.join(publicDir, `reel-audio-${Date.now()}${audioExt}`);
  fs.copyFileSync(resolvedAudioPath, publicAudio);
  publicAudioPath = path.relative(publicDir, publicAudio);
  console.log(`   ✅ Audio → public/${publicAudioPath}`);
}

const duration = sourceInfo.duration > 0 ? Math.min(sourceInfo.duration, 50) : 40;
const durationFrames = Math.round(duration * 30);

const inputProps = {
  hook,
  points: points.length > 0 ? points : undefined,
  cta,
  captionText: captionText || undefined,
  backgroundVideoPath: publicVideoPath,
  audioPath: publicAudioPath,
  grade,
  captionAnimation: 'pop',
  watermark: '@the_isaiah_dupree',
};

console.log('\n   Input props:');
console.log('  ', JSON.stringify({ ...inputProps, backgroundVideoPath: publicVideoPath ? '(set)' : undefined }, null, 2));

// ── Step 5: Render ────────────────────────────────────────────────────────────
console.log('\n🎞️  Step 5: Rendering IsaiahStyleReel...');

const outputPath = path.join(OUTPUT_DIR, outputName);
const renderCmd = [
  `cd "${STUDIO_DIR}" &&`,
  `npx remotion render IsaiahStyleReel "${outputPath}"`,
  `--props='${JSON.stringify(inputProps)}'`,
  `--duration=${durationFrames}`,
  `--log=verbose`,
].join(' ');

if (dryRun) {
  console.log('\n   [DRY RUN] Would run:');
  console.log('  ', renderCmd.slice(0, 200));
  console.log('\n✅ Dry run complete. Remove --dry-run to render.');
  process.exit(0);
}

console.log('   Rendering (this takes ~1-3 min for a 40s reel)...');
try {
  execSync(renderCmd, { stdio: 'inherit', timeout: 600_000 });
  console.log(`\n✅ Reel rendered: ${outputPath}`);

  // Print file size
  const stats = fs.statSync(outputPath);
  console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(1)}MB`);
  console.log('\n📤 Ready to post via Blotato or media-vault!');
  console.log(`   Post command:`);
  console.log(`   curl -X POST https://mediaposter-lite-isaiahduprees-projects.vercel.app/api/publish \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"localPath": "${outputPath}", "platforms": ["instagram", "tiktok"]}'`);

} catch (err) {
  console.error('\n❌ Render failed:', err);
  process.exit(1);
}
