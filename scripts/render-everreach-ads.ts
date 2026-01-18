#!/usr/bin/env npx tsx
/**
 * EverReach Ad Batch Renderer
 * 
 * Renders static ads for Meta platforms using the angle matrix
 * 
 * Usage:
 *   npx tsx scripts/render-everreach-ads.ts [options]
 * 
 * Examples:
 *   npx tsx scripts/render-everreach-ads.ts --all
 *   npx tsx scripts/render-everreach-ads.ts --angle UA_TIMING_01
 *   npx tsx scripts/render-everreach-ads.ts --awareness unaware
 *   npx tsx scripts/render-everreach-ads.ts --template listicle
 */

import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';

// Import angle matrix and config
import { PHASE_A_ANGLES, AdAngle } from '../src/compositions/everreach/angles';
import { META_AD_SIZES, AwarenessLevel } from '../src/compositions/everreach/config';

// =============================================================================
// Configuration
// =============================================================================

const OUTPUT_DIR = 'output/everreach-ads';

const COMPOSITION_MAP: Record<string, string> = {
  headline: 'EverReach-Instagram-Post',
  painpoint: 'EverReach-PainPoint-Instagram',
  listicle: 'EverReach-Listicle-Instagram',
  comparison: 'EverReach-Comparison-Instagram',
  stat: 'EverReach-Stat-Instagram',
  question: 'EverReach-Question-Instagram',
  objection: 'EverReach-Objections-Instagram',
};

const FORMATS = [
  { id: 'instagram_post', suffix: 'ig-post', size: META_AD_SIZES.instagram_post },
  { id: 'instagram_story', suffix: 'ig-story', size: META_AD_SIZES.instagram_story },
  { id: 'facebook_post', suffix: 'fb-post', size: META_AD_SIZES.facebook_post },
];

// =============================================================================
// Render Functions
// =============================================================================

interface RenderOptions {
  all?: boolean;
  angle?: string;
  awareness?: AwarenessLevel;
  template?: string;
  format?: string;
}

async function renderAngle(
  bundleLocation: string,
  angle: AdAngle,
  formatId: string,
  outputDir: string
): Promise<string | null> {
  const format = FORMATS.find(f => f.id === formatId);
  if (!format) return null;

  const compositionId = angle.template === 'headline' 
    ? `EverReach-Instagram-Post`
    : `EverReach-${angle.template.charAt(0).toUpperCase() + angle.template.slice(1)}-Instagram`;

  // Adjust for story format
  const actualCompositionId = formatId.includes('story')
    ? compositionId.replace('-Instagram', '-Story')
    : compositionId;

  const outputPath = path.join(
    outputDir,
    formatId,
    `${angle.id}_${format.suffix}.png`
  );

  // Ensure directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  try {
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: actualCompositionId,
      inputProps: {
        headline: angle.headline,
        subheadline: angle.subheadline,
        ctaText: angle.ctaText,
        awareness: angle.awareness,
        belief: angle.belief,
      },
    });

    await renderStill({
      composition,
      serveUrl: bundleLocation,
      output: outputPath,
      inputProps: {
        headline: angle.headline,
        subheadline: angle.subheadline,
        ctaText: angle.ctaText,
        awareness: angle.awareness,
        belief: angle.belief,
      },
    });

    return outputPath;
  } catch (error) {
    console.error(`   ❌ Error: ${error}`);
    return null;
  }
}

async function main(options: RenderOptions) {
  console.log('🎨 EverReach Ad Batch Renderer');
  console.log('='.repeat(60));

  // Filter angles based on options
  let anglesToRender = [...PHASE_A_ANGLES];

  if (options.angle) {
    anglesToRender = anglesToRender.filter(a => a.id === options.angle);
  }
  if (options.awareness) {
    anglesToRender = anglesToRender.filter(a => a.awareness === options.awareness);
  }
  if (options.template) {
    anglesToRender = anglesToRender.filter(a => a.template === options.template);
  }

  // Filter formats
  let formatsToRender = [...FORMATS];
  if (options.format) {
    formatsToRender = formatsToRender.filter(f => f.id === options.format);
  }

  if (anglesToRender.length === 0) {
    console.log('\n❌ No angles match the filter criteria');
    console.log('\nAvailable angles:');
    PHASE_A_ANGLES.forEach(a => console.log(`  - ${a.id}: ${a.name}`));
    return;
  }

  console.log(`\n📊 Rendering ${anglesToRender.length} angles × ${formatsToRender.length} formats`);
  console.log(`   = ${anglesToRender.length * formatsToRender.length} total images\n`);

  // Bundle the project
  console.log('📦 Bundling project...');
  const bundleLocation = await bundle({
    entryPoint: path.resolve(process.cwd(), 'src/index.ts'),
    webpackOverride: (config) => config,
  });
  console.log('✓ Bundle complete\n');

  // Create output directory
  const outputDir = path.resolve(process.cwd(), OUTPUT_DIR);
  fs.mkdirSync(outputDir, { recursive: true });

  // Render each angle × format combination
  const results: Array<{
    angle: string;
    format: string;
    success: boolean;
    path?: string;
  }> = [];

  let current = 0;
  const total = anglesToRender.length * formatsToRender.length;

  for (const angle of anglesToRender) {
    for (const format of formatsToRender) {
      current++;
      console.log(`[${current}/${total}] ${angle.id} → ${format.suffix}`);

      const outputPath = await renderAngle(bundleLocation, angle, format.id, outputDir);

      results.push({
        angle: angle.id,
        format: format.id,
        success: !!outputPath,
        path: outputPath || undefined,
      });

      if (outputPath) {
        const size = fs.statSync(outputPath).size;
        console.log(`   ✓ ${outputPath} (${(size / 1024).toFixed(1)} KB)`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 RENDER SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n✅ Successful: ${successful.length}/${total}`);
  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.length}/${total}`);
    failed.forEach(f => console.log(`   - ${f.angle} (${f.format})`));
  }

  console.log(`\n📁 Output: ${outputDir}`);

  // Generate manifest
  const manifest = {
    generated: new Date().toISOString(),
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    results: results.map(r => ({
      ...r,
      angle: PHASE_A_ANGLES.find(a => a.id === r.angle),
    })),
  };

  fs.writeFileSync(
    path.join(outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log(`📋 Manifest: ${path.join(outputDir, 'manifest.json')}`);
}

// =============================================================================
// CLI Argument Parsing
// =============================================================================

function parseArgs(): RenderOptions {
  const args = process.argv.slice(2);
  const options: RenderOptions = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--all':
        options.all = true;
        break;
      case '--angle':
        options.angle = args[++i];
        break;
      case '--awareness':
        options.awareness = args[++i] as AwarenessLevel;
        break;
      case '--template':
        options.template = args[++i];
        break;
      case '--format':
        options.format = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
EverReach Ad Batch Renderer

Usage:
  npx tsx scripts/render-everreach-ads.ts [options]

Options:
  --all              Render all angles in all formats
  --angle <id>       Render specific angle by ID
  --awareness <lvl>  Filter by awareness level (unaware, problem_aware, solution_aware, product_aware, most_aware)
  --template <type>  Filter by template (headline, painpoint, listicle, comparison, stat, question, objection)
  --format <fmt>     Filter by format (instagram_post, instagram_story, facebook_post)
  --help, -h         Show this help

Examples:
  npx tsx scripts/render-everreach-ads.ts --all
  npx tsx scripts/render-everreach-ads.ts --angle UA_TIMING_01
  npx tsx scripts/render-everreach-ads.ts --awareness unaware
  npx tsx scripts/render-everreach-ads.ts --template listicle --format instagram_post

Available Angles:
${PHASE_A_ANGLES.map(a => `  ${a.id}: ${a.name} (${a.awareness})`).join('\n')}
`);
        process.exit(0);
    }
  }

  // Default to all if no filter specified
  if (!options.angle && !options.awareness && !options.template) {
    options.all = true;
  }

  return options;
}

// Run
main(parseArgs()).catch(console.error);
