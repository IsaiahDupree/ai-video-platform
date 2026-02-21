/**
 * Post-Processing Pipeline for AI-Generated UGC Clips
 *
 * Applies the following fixes derived from video research (see docs/video-research/VIDEO_LEARNINGS.md):
 *   1. Speed up 1.4x — removes AI "thinking pauses" and unnatural holds
 *   2. Ambient noise injection — masks AI voice artifacts, makes audio feel real
 *   3. Subtitle crop fallback — crops bottom 8% to remove burned-in Veo 3 subtitles
 *
 * All operations use FFmpeg (must be installed).
 * Input and output can be the same path (in-place processing via temp file).
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export type AmbientNoiseType = 'office' | 'cafe' | 'home' | 'outdoor' | 'none';

export interface PostProcessOptions {
  speedFactor?: number;           // default: 1.4 — removes AI pauses
  ambientNoise?: AmbientNoiseType; // default: 'office'
  ambientNoiseVolume?: number;    // default: -28 (dB, negative = quieter)
  cropSubtitleArea?: boolean;     // default: false — only enable if subtitles detected
  outputPath?: string;            // default: overwrites input
}

/**
 * Returns the path to an ambient noise file for the given type.
 * Falls back gracefully if the file doesn't exist (skips ambient noise).
 */
function getAmbientNoisePath(type: AmbientNoiseType): string {
  const assetsDir = path.join(process.cwd(), 'assets', 'ambient');
  const files: Record<AmbientNoiseType, string> = {
    office:  path.join(assetsDir, 'office-room-tone.mp3'),
    cafe:    path.join(assetsDir, 'cafe-ambience.mp3'),
    home:    path.join(assetsDir, 'home-ambience.mp3'),
    outdoor: path.join(assetsDir, 'outdoor-ambience.mp3'),
    none:    '',
  };
  return files[type] ?? '';
}

/**
 * Check if a video has burned-in subtitles by sampling a frame and checking
 * for high-contrast text in the bottom 20% of the frame.
 * Uses FFmpeg to extract a frame, then checks pixel variance in subtitle zone.
 * Returns true if subtitles are likely present.
 */
export function detectBurnedSubtitles(clipPath: string): boolean {
  try {
    const tmpFrame = `/tmp/subtitle_check_${Date.now()}.png`;
    // Extract frame at 2s (past any intro)
    execSync(
      `ffmpeg -y -ss 2 -i "${clipPath}" -vframes 1 -q:v 2 "${tmpFrame}" 2>/dev/null`,
      { stdio: 'pipe' }
    );
    if (!fs.existsSync(tmpFrame)) return false;

    // Check bottom 15% of frame for high-contrast regions (text indicators)
    // Use ffprobe to get dimensions first
    const dimOut = execSync(
      `ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${clipPath}"`,
      { encoding: 'utf-8' }
    ).trim();
    const [w, h] = dimOut.split(',').map(Number);
    if (!w || !h) { fs.unlinkSync(tmpFrame); return false; }

    // Crop bottom 15% and check mean/stddev — high stddev = likely text
    const statsOut = execSync(
      `ffmpeg -i "${tmpFrame}" -vf "crop=${w}:${Math.floor(h * 0.15)}:0:${Math.floor(h * 0.85)},signalstats" -f null - 2>&1 | grep YDIF`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    fs.unlinkSync(tmpFrame);

    // YDIF > 5 suggests significant luma variation = likely text
    const match = statsOut.match(/YDIF=(\d+\.?\d*)/);
    if (match) {
      const ydif = parseFloat(match[1]);
      return ydif > 5;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Apply post-processing to a single clip.
 * Returns the path to the processed clip.
 */
export async function postProcessClip(
  inputPath: string,
  options: PostProcessOptions = {},
): Promise<string> {
  const {
    speedFactor = 1.4,
    ambientNoise = 'office',
    ambientNoiseVolume = -28,
    cropSubtitleArea = false,
    outputPath,
  } = options;

  const finalOutput = outputPath ?? inputPath;
  const tmpOutput = `/tmp/postprocess_${Date.now()}_${path.basename(inputPath)}`;

  if (!fs.existsSync(inputPath)) {
    throw new Error(`post-process: input not found: ${inputPath}`);
  }

  const ambientPath = ambientNoise !== 'none' ? getAmbientNoisePath(ambientNoise) : '';
  const hasAmbient = ambientPath && fs.existsSync(ambientPath);

  // Build FFmpeg filter complex
  const filters: string[] = [];
  const inputArgs: string[] = [`-i "${inputPath}"`];

  if (hasAmbient) {
    inputArgs.push(`-stream_loop -1 -i "${ambientPath}"`);
  }

  // Video filter: speed up + optional subtitle crop
  let vFilter = `setpts=PTS/${speedFactor}`;
  if (cropSubtitleArea) {
    // Crop bottom 8% to remove subtitle area
    vFilter += `,crop=iw:ih*0.92:0:0`;
  }
  filters.push(`[0:v]${vFilter}[v]`);

  // Audio filter: speed up video audio
  let aFilter = `[0:a]atempo=${speedFactor}`;
  // Clamp atempo: FFmpeg only supports 0.5–2.0 per filter; chain for >2.0
  if (speedFactor > 2.0) {
    aFilter = `[0:a]atempo=2.0,atempo=${(speedFactor / 2.0).toFixed(2)}`;
  }

  if (hasAmbient) {
    // Mix sped-up voice with ambient noise
    const ambientDb = ambientNoiseVolume; // negative = quiet
    filters.push(`${aFilter}[aspeed]`);
    filters.push(`[1:a]volume=${ambientDb}dB[ambient]`);
    filters.push(`[aspeed][ambient]amix=inputs=2:duration=first:dropout_transition=0[aout]`);
  } else {
    filters.push(`${aFilter}[aout]`);
  }

  const filterComplex = filters.join('; ');
  const mapArgs = `-map "[v]" -map "[aout]"`;
  const encodeArgs = `-c:v libx264 -preset fast -crf 18 -c:a aac -b:a 128k`;

  const cmd = [
    'ffmpeg -y',
    ...inputArgs,
    `-filter_complex "${filterComplex}"`,
    mapArgs,
    encodeArgs,
    `"${tmpOutput}"`,
    '2>/dev/null',
  ].join(' ');

  try {
    execSync(cmd, { stdio: 'pipe' });
  } catch (err: any) {
    // Clean up temp file on failure
    if (fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput);
    throw new Error(`post-process FFmpeg failed: ${err.message?.substring(0, 200)}`);
  }

  if (!fs.existsSync(tmpOutput) || fs.statSync(tmpOutput).size < 1000) {
    if (fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput);
    throw new Error('post-process: output file missing or empty');
  }

  // Move temp output to final destination
  fs.renameSync(tmpOutput, finalOutput);
  return finalOutput;
}

/**
 * Post-process all clips in a directory.
 * Processes clip_01.mp4, clip_02.mp4, etc. in-place.
 * Returns array of processed clip paths.
 */
export async function postProcessAllClips(
  clipsDir: string,
  options: PostProcessOptions = {},
): Promise<{ processed: string[]; skipped: string[]; errors: string[] }> {
  const processed: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  if (!fs.existsSync(clipsDir)) {
    return { processed, skipped, errors: [`clipsDir not found: ${clipsDir}`] };
  }

  const clips = fs.readdirSync(clipsDir)
    .filter((f) => f.match(/^clip_\d+\.mp4$/))
    .sort()
    .map((f) => path.join(clipsDir, f));

  for (const clipPath of clips) {
    const name = path.basename(clipPath);
    // Skip already-processed clips (marked with _pp suffix)
    if (name.includes('_pp')) { skipped.push(clipPath); continue; }

    try {
      // Auto-detect subtitle burn-in if not explicitly set
      const cropSubtitles = options.cropSubtitleArea ?? detectBurnedSubtitles(clipPath);
      if (cropSubtitles && !options.cropSubtitleArea) {
        process.stdout.write(`   ⚠️  Subtitles detected in ${name} — cropping bottom 8%\n`);
      }

      await postProcessClip(clipPath, { ...options, cropSubtitleArea: cropSubtitles });
      processed.push(clipPath);
      process.stdout.write(`   ✅ Post-processed: ${name} (${options.speedFactor ?? 1.4}x speed)\n`);
    } catch (err: any) {
      errors.push(`${name}: ${err.message}`);
      process.stdout.write(`   ❌ Post-process failed: ${name} — ${err.message?.substring(0, 80)}\n`);
    }
  }

  return { processed, skipped, errors };
}

/**
 * Download ambient noise assets if they don't exist.
 * Uses free public domain audio files.
 * Call this once during setup.
 */
export async function ensureAmbientAssets(): Promise<void> {
  const assetsDir = path.join(process.cwd(), 'assets', 'ambient');
  fs.mkdirSync(assetsDir, { recursive: true });

  // Generate simple room tone using FFmpeg (sine wave at very low volume)
  // This is a fallback — real ambient files should be placed in assets/ambient/
  const files = [
    { name: 'office-room-tone.mp3', desc: 'quiet office' },
    { name: 'cafe-ambience.mp3', desc: 'cafe background' },
    { name: 'home-ambience.mp3', desc: 'home interior' },
    { name: 'outdoor-ambience.mp3', desc: 'outdoor' },
  ];

  for (const { name, desc } of files) {
    const filePath = path.join(assetsDir, name);
    if (!fs.existsSync(filePath)) {
      try {
        // Generate 60s of low-level pink noise as placeholder ambient
        execSync(
          `ffmpeg -y -f lavfi -i "anoisesrc=color=pink:amplitude=0.003:duration=60" -c:a libmp3lame -b:a 64k "${filePath}" 2>/dev/null`,
          { stdio: 'pipe' }
        );
        process.stdout.write(`   ✅ Generated ambient: ${name} (${desc})\n`);
      } catch {
        process.stdout.write(`   ⚠️  Could not generate ${name} — ambient noise disabled\n`);
      }
    }
  }
}
