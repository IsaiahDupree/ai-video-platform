#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
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

await renderMedia({
  composition: selected,
  serveUrl,
  codec: 'h264',
  pixelFormat: 'yuv420p',
  outputLocation: path.resolve(outputPath),
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
