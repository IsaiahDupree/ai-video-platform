#!/usr/bin/env npx tsx
/**
 * Render a single still frame from a ContentBrief.
 *
 * Usage:
 *   npx tsx scripts/render-brief-still.ts <brief.json> <output.png> [frame]
 *
 * Output: PNG image at <output.png>
 * Exit 0 on success, 1 on failure.
 */

import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';

const [,, briefArg, outputArg, frameArg] = process.argv;

if (!briefArg || !outputArg) {
  console.error('Usage: render-brief-still.ts <brief.json> <output.png> [frame=0]');
  process.exit(1);
}

const briefPath = path.resolve(briefArg);
const outputPath = path.resolve(outputArg);
const frame = frameArg ? parseInt(frameArg, 10) : 0;

if (!fs.existsSync(briefPath)) {
  console.error(`Brief not found: ${briefPath}`);
  process.exit(1);
}

const brief = JSON.parse(fs.readFileSync(briefPath, 'utf-8'));

// Ensure output directory exists
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

(async () => {
  console.log(`Rendering still: frame=${frame}, brief=${brief.id}`);

  const bundleLocation = await bundle({
    entryPoint: path.resolve(__dirname, '../src/index.ts'),
    onProgress: (p) => { if (p % 50 === 0) process.stdout.write(`\rBundling: ${p}%`); },
  });
  process.stdout.write('\r\n');

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'BriefComposition',
    inputProps: { brief },
  });

  await renderStill({
    composition: {
      ...composition,
      width: brief.settings?.resolution?.width || 1080,
      height: brief.settings?.resolution?.height || 1920,
    },
    serveUrl: bundleLocation,
    output: outputPath,
    frame,
    inputProps: { brief },
    imageFormat: outputPath.endsWith('.jpg') || outputPath.endsWith('.jpeg') ? 'jpeg' : 'png',
    ...(outputPath.endsWith('.jpg') || outputPath.endsWith('.jpeg') ? { jpegQuality: 90 } : {}),
    chromiumOptions: { enableMultiProcessOnLinux: true },
  });

  const stat = fs.statSync(outputPath);
  console.log(`Still rendered: ${outputPath} (${Math.round(stat.size / 1024)}KB)`);
})().catch((err) => {
  console.error('Still render failed:', err.message);
  process.exit(1);
});
