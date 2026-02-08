#!/usr/bin/env npx tsx
/**
 * UGC Ad Gallery Generator CLI
 *
 * Generates an HTML gallery for browsing ad variants.
 * Optionally renders thumbnail previews using Remotion stills.
 *
 * Usage:
 *   npx tsx scripts/preview-ugc-gallery.ts --batch output/ugc-ads/b630656
 *   npx tsx scripts/preview-ugc-gallery.ts --batch output/ugc-ads/b630656 --thumbnails
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateGalleryFromBatch, generatePreviews } from '../src/pipeline/preview-generator';
import type { AdBatch, BrandConfig, AdSize } from '../src/pipeline/types';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace('--', '');
      if (key === 'thumbnails' || key === 'open') {
        opts[key] = 'true';
      } else if (args[i + 1] && !args[i + 1].startsWith('--')) {
        opts[key] = args[++i];
      }
    }
  }

  return {
    batchDir: opts['batch'] || '',
    thumbnails: opts['thumbnails'] === 'true',
    open: opts['open'] === 'true',
  };
}

async function main() {
  const args = parseArgs();

  if (!args.batchDir || process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
🖼️  UGC Ad Gallery Generator
═══════════════════════════════════════════════════════════════

Generate an HTML gallery for browsing ad variants.

Usage:
  npx tsx scripts/preview-ugc-gallery.ts --batch <batch_dir> [options]

Options:
  --batch <dir>       Path to batch directory (required)
  --thumbnails        Render thumbnail previews (slower, requires Remotion)
  --open              Open gallery in browser after generating

Examples:
  npx tsx scripts/preview-ugc-gallery.ts --batch output/ugc-ads/b630656
  npx tsx scripts/preview-ugc-gallery.ts --batch output/ugc-ads/b630656 --thumbnails
`);
    process.exit(args.batchDir ? 0 : 1);
  }

  const batchJsonPath = path.join(args.batchDir, 'batch.json');
  if (!fs.existsSync(batchJsonPath)) {
    console.error(`❌ batch.json not found in ${args.batchDir}`);
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🖼️  UGC Ad Gallery Generator');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Batch:      ${args.batchDir}`);
  console.log(`  Thumbnails: ${args.thumbnails ? 'YES (rendering with Remotion)' : 'NO (placeholder cards)'}`);
  console.log('═══════════════════════════════════════════════════════════════');

  if (args.thumbnails) {
    const batch: AdBatch = JSON.parse(fs.readFileSync(batchJsonPath, 'utf-8'));
    const thumbDir = path.join(args.batchDir, 'thumbnails');

    // Default brand from batch variants
    const brand: BrandConfig = {
      name: batch.productId || 'Product',
      primaryColor: '#6366f1',
      accentColor: '#22c55e',
      fontFamily: 'Inter',
    };

    const previewSize: AdSize = { name: 'feed_square', width: 1080, height: 1080, platform: 'instagram' };

    console.log('\n🎨 Rendering thumbnails...');
    await generatePreviews(batch, brand, previewSize, thumbDir);
  }

  console.log('\n📄 Generating gallery HTML...');
  const galleryPath = generateGalleryFromBatch(args.batchDir);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  ✅ Gallery generated: ${galleryPath}`);
  console.log('═══════════════════════════════════════════════════════════════');

  if (args.open) {
    const { execSync } = await import('child_process');
    try {
      execSync(`open "${galleryPath}"`, { stdio: 'pipe' });
    } catch {
      console.log(`  Open manually: file://${path.resolve(galleryPath)}`);
    }
  }
}

main().catch(err => {
  console.error(`\n❌ Gallery generation failed: ${err.message}`);
  process.exit(1);
});
