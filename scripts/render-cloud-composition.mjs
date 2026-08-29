#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {validateRenderRequest} from './cloud-render-contract.mjs';

const [composition, propsPath, outputPath, quality = 'production'] = process.argv.slice(2);
if (!composition || !propsPath || !outputPath) {
  throw new Error(
    'usage: render-cloud-composition.mjs <composition> <props.json> <output.mp4> [quality]'
  );
}

const inputProps = JSON.parse(fs.readFileSync(path.resolve(propsPath), 'utf8'));
validateRenderRequest({composition, inputProps, quality});

const MAX_AUDIO_BYTES = 50_000_000;
const audioDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'remotion-release-audio-'));
const audioUrl = new URL(inputProps.audioPath);
const requestedExtension = path.extname(audioUrl.pathname).toLowerCase();
const audioExtension = new Set(['.wav', '.mp3', '.m4a', '.aac', '.flac', '.ogg']).has(requestedExtension)
  ? requestedExtension
  : '.wav';
const localAudioName = `release-audio${audioExtension}`;
const localAudioPath = path.join(audioDirectory, localAudioName);

let response;
try {
  response = await fetch(inputProps.audioPath, {
    redirect: 'error',
    signal: AbortSignal.timeout(120_000),
  });
} catch (error) {
  fs.rmSync(audioDirectory, {recursive: true, force: true});
  throw new Error(`immutable audio download failed: ${error instanceof Error ? error.message : error}`);
}
if (!response.ok) {
  fs.rmSync(audioDirectory, {recursive: true, force: true});
  throw new Error(`immutable audio download returned HTTP ${response.status}`);
}
const declaredLength = Number(response.headers.get('content-length') || 0);
if (declaredLength > MAX_AUDIO_BYTES) {
  fs.rmSync(audioDirectory, {recursive: true, force: true});
  throw new Error('immutable audio exceeds the 50 MB release limit');
}
const audioBytes = Buffer.from(await response.arrayBuffer());
if (audioBytes.length < 1 || audioBytes.length > MAX_AUDIO_BYTES) {
  fs.rmSync(audioDirectory, {recursive: true, force: true});
  throw new Error('immutable audio size is outside the release limit');
}
const audioSha256 = createHash('sha256').update(audioBytes).digest('hex');
if (audioSha256 !== inputProps.audioSha256) {
  fs.rmSync(audioDirectory, {recursive: true, force: true});
  throw new Error('immutable audio SHA-256 differs from input props');
}
fs.writeFileSync(localAudioPath, audioBytes);

const audioProbe = spawnSync(
  'ffprobe',
  [
    '-v',
    'error',
    '-show_entries',
    'stream=codec_type,sample_rate,duration_ts,time_base:format=duration',
    '-of',
    'json',
    localAudioPath,
  ],
  {encoding: 'utf8'},
);
if (audioProbe.status !== 0) {
  fs.rmSync(audioDirectory, {recursive: true, force: true});
  throw new Error(`immutable audio probe failed: ${audioProbe.stderr || audioProbe.stdout}`);
}
let audioProbePayload;
try {
  audioProbePayload = JSON.parse(audioProbe.stdout);
} catch {
  fs.rmSync(audioDirectory, {recursive: true, force: true});
  throw new Error('immutable audio probe did not return JSON');
}
const audioStream = audioProbePayload.streams?.find((stream) => stream.codec_type === 'audio');
const sampleRate = Number(audioStream?.sample_rate);
const durationTicks = Number(audioStream?.duration_ts);
const [timeNumeratorText, timeDenominatorText] = String(audioStream?.time_base || '').split('/');
const timeNumerator = Number(timeNumeratorText);
const timeDenominator = Number(timeDenominatorText);
const hasExactStreamDuration = [sampleRate, durationTicks, timeNumerator, timeDenominator]
  .every((value) => Number.isFinite(value) && value > 0);
const audioDurationSeconds = hasExactStreamDuration
  ? durationTicks * timeNumerator / timeDenominator
  : Number(audioProbePayload.format?.duration);
const exactSampleCount = hasExactStreamDuration
  ? durationTicks * timeNumerator * sampleRate / timeDenominator
  : null;
const audioDurationInFrames = Math.ceil(audioDurationSeconds * 30 - 1e-9);
if (
  !Number.isFinite(audioDurationSeconds) ||
  audioDurationSeconds <= 0 ||
  audioDurationInFrames !== inputProps.durationInFrames
) {
  fs.rmSync(audioDirectory, {recursive: true, force: true});
  throw new Error('immutable audio duration differs from durationInFrames');
}

const renderProps = {
  ...inputProps,
  audioPath: localAudioName,
};

const serveUrl = await bundle({
  entryPoint: path.resolve('src/index.ts'),
  publicDir: audioDirectory,
  onProgress: (progress) => {
    const percent = Math.round(progress * 100);
    if (percent === 100 || percent % 25 === 0) {
      console.log(`bundle=${percent}%`);
    }
  },
});

const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || undefined;
const selected = await selectComposition({
  serveUrl,
  id: composition,
  inputProps: renderProps,
  browserExecutable,
});

const resolvedOutput = path.resolve(outputPath);
const rawOutput = `${resolvedOutput}.raw.mp4`;
fs.mkdirSync(path.dirname(resolvedOutput), {recursive: true});
fs.writeFileSync(
  `${resolvedOutput}.audio-verification.json`,
  `${JSON.stringify({
    contract_type: 'immutable_render_audio_verification_v1',
    source_url: inputProps.audioPath,
    audio_sha256: audioSha256,
    size_bytes: audioBytes.length,
    sample_rate: sampleRate,
    sample_count: exactSampleCount,
    duration_ts: durationTicks,
    time_base: audioStream?.time_base || null,
    duration_seconds: audioDurationSeconds,
    duration_in_frames: audioDurationInFrames,
    rendered_source: localAudioName,
  }, null, 2)}\n`,
);

await renderMedia({
  composition: selected,
  serveUrl,
  codec: 'h264',
  pixelFormat: 'yuv420p',
  outputLocation: rawOutput,
  inputProps: renderProps,
  browserExecutable,
  chromiumOptions: {enableMultiProcessOnLinux: true},
  crf: quality === 'preview' ? 28 : 18,
  imageFormat: 'jpeg',
  jpegQuality: quality === 'preview' ? 80 : 95,
  onProgress: ({progress}) => {
    const percent = Math.round(progress * 100);
    if (percent === 100 || percent % 10 === 0) {
      console.log(`render=${percent}%`);
    }
  },
});

const normalized = spawnSync(
  'ffmpeg',
  [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    rawOutput,
    '-vf',
    'scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p',
    '-c:v',
    'libx264',
    '-preset',
    quality === 'preview' ? 'veryfast' : 'medium',
    '-crf',
    quality === 'preview' ? '24' : '18',
    '-color_range',
    'tv',
    '-colorspace',
    'bt709',
    '-color_primaries',
    'bt709',
    '-color_trc',
    'bt709',
    '-c:a',
    'copy',
    '-movflags',
    '+faststart',
    resolvedOutput,
  ],
  {encoding: 'utf8'},
);
if (normalized.status !== 0) {
  throw new Error(`ffmpeg BT.709 normalization failed: ${normalized.stderr || normalized.stdout}`);
}
fs.rmSync(rawOutput, {force: true});
fs.rmSync(audioDirectory, {recursive: true, force: true});
