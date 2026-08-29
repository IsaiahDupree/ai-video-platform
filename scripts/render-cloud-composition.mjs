#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
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

const serveUrl = await bundle({
  entryPoint: path.resolve('src/index.ts'),
  publicDir: null,
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
  inputProps,
  browserExecutable,
});

const resolvedOutput = path.resolve(outputPath);
const rawOutput = `${resolvedOutput}.raw.mp4`;

await renderMedia({
  composition: selected,
  serveUrl,
  codec: 'h264',
  pixelFormat: 'yuv420p',
  outputLocation: rawOutput,
  inputProps,
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
