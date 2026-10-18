import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { loadManifest, loadAudioEvents, requireSfxFileById } from '../src/audio/audio-validate';

// =============================================================================
// FFmpeg Audio Mixer - Combines VO + Music + SFX into single audio file
// =============================================================================

interface Args {
  manifest: string;
  events: string;
  sfxRoot: string;
  out: string;
}

function parseArgs(): Args {
  const get = (k: string, def?: string) => {
    const idx = process.argv.indexOf(`--${k}`);
    return idx >= 0 ? process.argv[idx + 1] : def;
  };

  return {
    manifest: get('manifest', 'public/assets/sfx/manifest.json')!,
    events: get('events', 'data/audio_events.json')!,
    sfxRoot: get('sfxRoot', 'public/assets/sfx')!,
    out: get('out', 'dist/audio_mix.wav')!,
  };
}

function msFromFrame(frame: number, fps: number): number {
  return Math.round((frame / fps) * 1000);
}

function ensureDirForFile(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function main() {
  const args = parseArgs();
  const cwd = process.cwd();

  const manifestPath = path.resolve(cwd, args.manifest);
  const eventsPath = path.resolve(cwd, args.events);
  const sfxRootDir = path.resolve(cwd, args.sfxRoot);
  const outPath = path.resolve(cwd, args.out);

  console.log('🎵 Building audio mix...');
  console.log(`   Manifest: ${manifestPath}`);
  console.log(`   Events:   ${eventsPath}`);
  console.log(`   Output:   ${outPath}`);

  const { map: manifestMap } = loadManifest(manifestPath);
  const audioEvents = loadAudioEvents(eventsPath);

  const fps = audioEvents.fps;

  const voice = audioEvents.events.find((e) => e.type === 'voiceover') ?? null;
  const music = audioEvents.events.find((e) => e.type === 'music') ?? null;
  const sfx = audioEvents.events.filter((e) => e.type === 'sfx');

  const inputs: string[] = [];
  const inputLabels: string[] = [];

  // Input 0: voiceover (optional)
  if (voice?.type === 'voiceover') {
    const voPath = path.resolve(cwd, voice.src);
    if (fs.existsSync(voPath)) {
      inputs.push('-i', voPath);
      inputLabels.push('voice');
      console.log(`   ✓ Voiceover: ${voice.src}`);
    } else {
      console.log(`   ⚠ Voiceover not found: ${voice.src}`);
    }
  }

  // Input 1: music (optional)
  if (music?.type === 'music') {
    const musicPath = path.resolve(cwd, music.src);
    if (fs.existsSync(musicPath)) {
      inputs.push('-i', musicPath);
      inputLabels.push('music');
      console.log(`   ✓ Music: ${music.src}`);
    } else {
      console.log(`   ⚠ Music not found: ${music.src}`);
    }
  }

  // Next inputs: each sfx
  const sfxInputStartIndex = inputLabels.length;
  for (const ev of sfx) {
    if (ev.type !== 'sfx') continue;
    try {
      const sfxPath = requireSfxFileById({
        sfxRootDir,
        sfxId: ev.sfxId,
        manifestMap,
      });
      inputs.push('-i', sfxPath);
      inputLabels.push(ev.sfxId);
      console.log(`   ✓ SFX: ${ev.sfxId} @ frame ${ev.frame}`);
    } catch (err: any) {
      console.log(`   ⚠ ${err.message}`);
    }
  }

  if (inputs.length === 0) {
    console.error('❌ No audio inputs found. Add voiceover/music/sfx to events.');
    process.exit(1);
  }

  // Build filter_complex
  const filters: string[] = [];
  const mixInputs: string[] = [];

  let streamIndex = 0;

  // Voiceover stream
  if (voice?.type === 'voiceover' && inputLabels.includes('voice')) {
    const vol = voice.volume ?? 1;
    filters.push(`[${streamIndex}:a]volume=${vol}[v0]`);
    mixInputs.push('[v0]');
    streamIndex += 1;
  }

  // Music stream
  if (music?.type === 'music' && inputLabels.includes('music')) {
    const vol = music.volume ?? 0.25;
    filters.push(`[${streamIndex}:a]volume=${vol}[m0]`);
    mixInputs.push('[m0]');
    streamIndex += 1;
  }

  // SFX streams
  let sfxIdx = 0;
  for (const ev of sfx) {
    if (ev.type !== 'sfx') continue;
    if (!inputLabels.includes(ev.sfxId)) continue;
    
    const vol = ev.volume ?? 1;
    const delayMs = msFromFrame(ev.frame, fps);
    const outTag = `s${sfxIdx}`;
    
    // adelay needs "ms|ms" for stereo
    filters.push(`[${streamIndex}:a]volume=${vol},adelay=${delayMs}|${delayMs}[${outTag}]`);
    mixInputs.push(`[${outTag}]`);
    streamIndex += 1;
    sfxIdx += 1;
  }

  if (mixInputs.length === 0) {
    console.error('❌ No valid audio streams to mix.');
    process.exit(1);
  }

  // Mix them all
  const amixOut = '[mixout]';
  filters.push(`${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=longest:dropout_transition=0${amixOut}`);

  const filterComplex = filters.join(';');

  ensureDirForFile(outPath);

  const ffmpegArgs = [
    '-y',
    ...inputs,
    '-filter_complex',
    filterComplex,
    '-map',
    amixOut,
    '-ac', '2',
    '-ar', '48000',
    outPath,
  ];

  console.log('\n🔧 Running FFmpeg...');
  
  const result = spawnSync('ffmpeg', ffmpegArgs, { stdio: 'inherit' });

  if (result.status !== 0) {
    console.error(`❌ FFmpeg failed with exit code ${result.status}`);
    process.exit(1);
  }

  console.log(`\n✅ Audio mix complete: ${outPath}`);
}

main();
