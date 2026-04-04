#!/usr/bin/env npx tsx
/**
 * Podcast Video Render Script
 * Usage: npx tsx scripts/render-podcast.ts <brief.json> [output.mp4]
 */

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';

async function main() {
  const briefPath = process.argv[2];
  const outputPath = process.argv[3] || `./output/podcast-${Date.now()}.mp4`;

  if (!briefPath) {
    console.error('Usage: npx tsx scripts/render-podcast.ts <brief.json> [output.mp4]');
    process.exit(1);
  }

  const brief = JSON.parse(fs.readFileSync(path.resolve(briefPath), 'utf-8'));
  const totalFrames = brief.totalFrames || 4500;

  console.log('Bundling project...');
  const bundleLocation = await bundle({
    entryPoint: path.resolve(__dirname, '../src/index.ts'),
    onProgress: (p) => process.stdout.write(`\rBundling: ${p}%`),
  });
  console.log('\nBundle complete.');

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'PodcastClip-YouTube',
    inputProps: { brief },
  });

  console.log(`Rendering ${totalFrames} frames at 1920x1080...`);
  await renderMedia({
    composition: { ...composition, durationInFrames: totalFrames },
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps: { brief },
    crf: 18,
    imageFormat: 'jpeg',
    jpegQuality: 95,
    onProgress: ({ progress }) => process.stdout.write(`\rRendering: ${Math.round(progress * 100)}%`),
  });

  console.log(`\nDone! Output: ${outputPath}`);
}

main().catch(console.error);
