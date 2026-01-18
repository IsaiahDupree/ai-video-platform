#!/usr/bin/env npx tsx
/**
 * Video Render Pipeline
 * 
 * Usage:
 *   npx tsx scripts/render.ts <brief.json> [output.mp4]
 *   npx tsx scripts/render.ts data/briefs/example_explainer.json
 *   npx tsx scripts/render.ts data/briefs/example_explainer.json output/my-video.mp4
 */

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { ContentBrief } from '../src/types';
import { getFormat } from '../formats';
import { validateBrief } from './validate-brief';

interface RenderOptions {
  briefPath: string;
  outputPath?: string;
  quality?: 'preview' | 'production';
  formatOverride?: string;
}

async function loadBrief(briefPath: string): Promise<ContentBrief> {
  const absolutePath = path.resolve(briefPath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Brief file not found: ${absolutePath}`);
  }
  const content = fs.readFileSync(absolutePath, 'utf-8');
  return JSON.parse(content) as ContentBrief;
}

async function render(options: RenderOptions): Promise<string> {
  console.log('📽️  Video Render Pipeline');
  console.log('========================\n');

  // 1. Load and validate brief
  console.log('1/5 Loading content brief...');
  const brief = await loadBrief(options.briefPath);
  console.log(`    Brief ID: ${brief.id}`);
  console.log(`    Format: ${brief.format}`);

  console.log('\n2/5 Validating brief...');
  const validation = validateBrief(brief);
  if (!validation.valid) {
    throw new Error(`Invalid brief:\n  - ${validation.errors.join('\n  - ')}`);
  }
  console.log('    ✓ Brief is valid');

  // 2. Get format configuration
  console.log('\n3/5 Loading format configuration...');
  const format = getFormat(options.formatOverride || brief.format);
  console.log(`    Name: ${format.name}`);
  console.log(`    Resolution: ${format.resolution.width}x${format.resolution.height}`);
  console.log(`    Duration: ${brief.settings.duration_sec}s`);
  console.log(`    FPS: ${brief.settings.fps}`);

  // 3. Bundle the project
  console.log('\n4/5 Bundling project...');
  const bundleLocation = await bundle({
    entryPoint: path.resolve(__dirname, '../src/index.ts'),
    onProgress: (progress) => {
      if (progress % 25 === 0) {
        console.log(`    Bundling: ${progress}%`);
      }
    },
  });
  console.log('    ✓ Bundle complete');

  // 4. Select composition and render
  console.log('\n5/5 Rendering video...');
  const outputPath = options.outputPath || 
    `./output/${brief.id}_${Date.now()}.mp4`;

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'BriefComposition',
    inputProps: { brief },
  });

  const totalFrames = Math.round(brief.settings.duration_sec * brief.settings.fps);

  await renderMedia({
    composition: {
      ...composition,
      width: format.resolution.width,
      height: format.resolution.height,
      fps: brief.settings.fps,
      durationInFrames: totalFrames,
    },
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps: { brief },
    onProgress: ({ progress }) => {
      const percent = Math.round(progress * 100);
      process.stdout.write(`\r    Rendering: ${percent}%`);
    },
    chromiumOptions: {
      enableMultiProcessOnLinux: true,
    },
    ...(options.quality === 'production' ? {
      crf: 18,
      imageFormat: 'jpeg',
      jpegQuality: 95,
    } : {
      crf: 28,
      imageFormat: 'jpeg',
      jpegQuality: 80,
    }),
  });

  console.log('\n');
  console.log(`✅ Render complete: ${outputPath}`);
  
  return outputPath;
}

// CLI entry point
const args = process.argv.slice(2);

if (args.length < 1 || args.includes('--help') || args.includes('-h')) {
  console.log(`
Video Studio Render CLI

Usage:
  npx tsx scripts/render.ts <brief.json> [output.mp4] [options]

Arguments:
  brief.json    Path to content brief JSON file
  output.mp4    Output video path (optional)

Options:
  --quality     Render quality: preview | production (default: production)
  --format      Override format from brief
  --help, -h    Show this help message

Examples:
  npx tsx scripts/render.ts data/briefs/example_explainer.json
  npx tsx scripts/render.ts brief.json output/video.mp4 --quality preview
`);
  process.exit(0);
}

const briefPath = args[0];
let outputPath: string | undefined;
let quality: 'preview' | 'production' = 'production';
let formatOverride: string | undefined;

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--quality' && args[i + 1]) {
    quality = args[i + 1] as 'preview' | 'production';
    i++;
  } else if (args[i] === '--format' && args[i + 1]) {
    formatOverride = args[i + 1];
    i++;
  } else if (!args[i].startsWith('--')) {
    outputPath = args[i];
  }
}

render({
  briefPath,
  outputPath,
  quality,
  formatOverride,
}).catch((err) => {
  console.error('\n❌ Render failed:', err.message);
  process.exit(1);
});
