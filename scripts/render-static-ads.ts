#!/usr/bin/env npx tsx
/**
 * Render Static Ads Script
 * 
 * Usage:
 *   npx tsx scripts/render-static-ads.ts [options]
 * 
 * Examples:
 *   npx tsx scripts/render-static-ads.ts --id StaticAd-Instagram-Post
 *   npx tsx scripts/render-static-ads.ts --all
 *   npx tsx scripts/render-static-ads.ts --id StaticAd-Instagram-Post --props '{"headline":"My Ad"}'
 */

import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';

// Available static ad compositions
const STATIC_AD_IDS = [
  'StaticAd-Instagram-Post',
  'StaticAd-Instagram-Story',
  'StaticAd-Facebook-Post',
  'StaticAd-Twitter-Post',
  'StaticAd-LinkedIn-Post',
  'StaticAd-Medium-Rectangle',
  'StaticAd-Leaderboard',
  'SaleAd-Instagram-Post',
  'ProductAd-Instagram-Post',
  'TestimonialAd-Instagram-Post',
  'EventAd-Instagram-Story',
];

interface RenderOptions {
  id?: string;
  all?: boolean;
  props?: Record<string, unknown>;
  output?: string;
  format?: 'png' | 'jpeg' | 'webp' | 'pdf';
}

async function renderStaticAd(options: RenderOptions) {
  const {
    id,
    all = false,
    props = {},
    output,
    format = 'png',
  } = options;

  // Determine which ads to render
  const adsToRender = all ? STATIC_AD_IDS : id ? [id] : [];

  if (adsToRender.length === 0) {
    console.log('Usage: npx tsx scripts/render-static-ads.ts --id <composition-id> [--props \'{"key":"value"}\']');
    console.log('\nAvailable compositions:');
    STATIC_AD_IDS.forEach(adId => console.log(`  - ${adId}`));
    console.log('\nOr use --all to render all static ads');
    return;
  }

  console.log('🎨 Remotion Static Ad Renderer');
  console.log('='.repeat(50));

  // Bundle the project
  console.log('\n📦 Bundling project...');
  const bundleLocation = await bundle({
    entryPoint: path.resolve(process.cwd(), 'src/index.ts'),
    webpackOverride: (config) => config,
  });
  console.log('✓ Bundle complete');

  // Create output directory
  const outputDir = path.resolve(process.cwd(), 'output/static-ads');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Render each ad
  for (const adId of adsToRender) {
    console.log(`\n🖼️  Rendering: ${adId}`);

    try {
      // Get composition
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: adId,
        inputProps: props,
      });

      // Determine output path
      const outputPath = output || path.join(outputDir, `${adId}.${format}`);

      // Render the still
      await renderStill({
        composition,
        serveUrl: bundleLocation,
        output: outputPath,
        inputProps: props,
        imageFormat: format,
      });

      const fileSize = fs.statSync(outputPath).size;
      console.log(`   ✓ Saved: ${outputPath} (${(fileSize / 1024).toFixed(1)} KB)`);
      console.log(`   📐 Size: ${composition.width}x${composition.height}`);
    } catch (error) {
      console.error(`   ❌ Error: ${error}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Rendering complete!');
  console.log(`📁 Output: ${outputDir}`);
}

// Parse command line arguments
function parseArgs(): RenderOptions {
  const args = process.argv.slice(2);
  const options: RenderOptions = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--id':
        options.id = args[++i];
        break;
      case '--all':
        options.all = true;
        break;
      case '--props':
        try {
          options.props = JSON.parse(args[++i]);
        } catch {
          console.error('Invalid JSON for --props');
          process.exit(1);
        }
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--format':
      case '-f':
        options.format = args[++i] as 'png' | 'jpeg' | 'webp' | 'pdf';
        break;
      case '--help':
      case '-h':
        console.log(`
Remotion Static Ad Renderer

Usage:
  npx tsx scripts/render-static-ads.ts [options]

Options:
  --id <id>        Render a specific composition
  --all            Render all static ad compositions
  --props <json>   Pass custom props as JSON string
  --output, -o     Custom output path
  --format, -f     Output format: png, jpeg, webp, pdf (default: png)
  --help, -h       Show this help

Examples:
  npx tsx scripts/render-static-ads.ts --id StaticAd-Instagram-Post
  npx tsx scripts/render-static-ads.ts --all
  npx tsx scripts/render-static-ads.ts --id StaticAd-Instagram-Post --props '{"headline":"50% Off Today!"}'
  npx tsx scripts/render-static-ads.ts --id SaleAd-Instagram-Post --format jpeg

Available compositions:
${STATIC_AD_IDS.map(id => `  - ${id}`).join('\n')}
`);
        process.exit(0);
    }
  }

  return options;
}

// Run
renderStaticAd(parseArgs()).catch(console.error);
