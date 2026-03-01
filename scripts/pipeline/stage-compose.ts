/**
 * Stage 4: Video Composition — ffmpeg
 *
 * Loops the Veo video to match voiceover duration,
 * mixes ambient audio under the voiceover,
 * and burns in ASS subtitles (libass — proper word-wrap, font, positioning).
 *
 * Offer-agnostic: works with any video + voiceover + script.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import type { AngleInputs, StageResult } from './offer.schema.js';

// =============================================================================
// ASS subtitle builder
// =============================================================================

function formatAssTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}:${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
}

function buildAssSubtitles(script: string, totalDuration: number, w = 720, h = 1280): string {
  const lines = script.split('\n').map((l) => l.trim()).filter(Boolean);
  const sliceDur = totalDuration / lines.length;
  const marginV = Math.round(h * 0.08); // 8% from bottom edge

  const header = [
    '[Script Info]',
    'ScriptType: v4.00+',
    `PlayResX: ${w}`,
    `PlayResY: ${h}`,
    'WrapStyle: 0',
    '',
    '[V4+ Styles]',
    // Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour,
    //         Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle,
    //         BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    // Alignment 2 = bottom-center | BorderStyle 1 = outline+shadow | Bold -1 = bold
    // PrimaryColour &H00FFFFFF = white | OutlineColour &H00000000 = black | BackColour &HAA000000 = semi-transparent black
    `Style: Caption,Arial,62,&H00FFFFFF,&H000000FF,&H00000000,&HAA000000,-1,0,0,0,100,100,0,0,1,3,1,2,40,40,${marginV},1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ].join('\n');

  const events = lines
    .map((line, i) => {
      const start = formatAssTime(i * sliceDur);
      const end = formatAssTime((i + 1) * sliceDur);
      // Escape ASS control characters
      const text = line
        .replace(/\\/g, '\\\\')
        .replace(/{/g, '\\{')
        .replace(/}/g, '\\}');
      return `Dialogue: 0,${start},${end},Caption,,0,0,0,,${text}`;
    })
    .join('\n');

  return `${header}\n${events}\n`;
}

// =============================================================================
// ffprobe duration helper
// =============================================================================

function getAudioDuration(audioPath: string): number {
  try {
    const out = execSync(
      `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${audioPath}"`,
      { encoding: 'utf-8' }
    ).trim();
    return parseFloat(out) || 15;
  } catch {
    return 15;
  }
}

function getVideoDimensions(videoPath: string): { w: number; h: number } {
  try {
    const out = execSync(
      `ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${videoPath}"`,
      { encoding: 'utf-8' }
    ).trim();
    const [w, h] = out.split(',').map(Number);
    return { w: w || 720, h: h || 1280 };
  } catch {
    return { w: 720, h: 1280 };
  }
}

// =============================================================================
// Stage 4 runner
// =============================================================================

export async function runStageCompose(
  inputs: AngleInputs,
  outputDir: string,
  aspectRatio: string,
  force = false
): Promise<StageResult> {
  const t0 = Date.now();
  const safeAspect = aspectRatio.replace(':', 'x');
  const videoPath = path.join(outputDir, `video_${safeAspect}.mp4`);
  const voicePath = path.join(outputDir, 'voiceover.mp3');
  const finalPath = path.join(outputDir, `final_${safeAspect}.mp4`);
  const assPath = path.join(outputDir, 'captions.ass');

  console.log(`\n🎞️  Stage 4: ffmpeg — Compose Final Video`);

  if (fs.existsSync(finalPath) && !force) {
    console.log(`   ⏭️  final_${safeAspect}.mp4 exists`);
    return { status: 'done', outputs: [finalPath, assPath], durationMs: Date.now() - t0 };
  }

  if (!fs.existsSync(videoPath)) {
    return { status: 'skipped', outputs: [], error: `video_${safeAspect}.mp4 not found — run Stage 2 first` };
  }
  if (!fs.existsSync(voicePath)) {
    return { status: 'skipped', outputs: [], error: 'voiceover.mp3 not found — run Stage 3 first' };
  }

  try {
    const voiceDur = getAudioDuration(voicePath);
    const { w, h } = getVideoDimensions(videoPath);
    console.log(`   🎞️  ${voiceDur.toFixed(1)}s | ${w}×${h} | looped video + voice + captions`);

    // Write ASS subtitle file
    fs.writeFileSync(assPath, buildAssSubtitles(inputs.voiceScript, voiceDur, w, h), 'utf-8');

    // Escape path for ffmpeg ass filter (colons must be escaped on macOS)
    const assEscaped = assPath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/ /g, '\\ ');

    const cmd = [
      'ffmpeg -y',
      `-stream_loop -1 -i "${videoPath}"`,   // loop Veo video
      `-i "${voicePath}"`,                    // ElevenLabs voiceover
      `-t ${voiceDur.toFixed(3)}`,            // trim to voiceover length
      `-filter_complex`,
      `"[0:a]volume=0.12[amb];[1:a]volume=1.0[vo];[amb][vo]amix=inputs=2:duration=first:dropout_transition=0[aout];[0:v]ass='${assEscaped}'[vout]"`,
      `-map "[vout]" -map "[aout]"`,
      `-c:v libx264 -preset fast -crf 20`,
      `-c:a aac -b:a 192k`,
      `-movflags +faststart`,
      `"${finalPath}"`,
    ].join(' ');

    console.log(`   ⚙️  Running ffmpeg...`);
    execSync(cmd, { stdio: 'pipe' });

    const mb = (fs.statSync(finalPath).size / 1024 / 1024).toFixed(1);
    console.log(`   ✅ final_${safeAspect}.mp4 (${mb}MB)`);

    return {
      status: 'done',
      outputs: [finalPath, assPath].filter(fs.existsSync),
      durationMs: Date.now() - t0,
    };
  } catch (err: any) {
    const stderr = err.stderr?.toString() || err.message;
    return {
      status: 'failed',
      outputs: [],
      durationMs: Date.now() - t0,
      error: `ffmpeg: ${stderr.slice(-400)}`,
    };
  }
}
