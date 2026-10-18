#!/usr/bin/env npx tsx
/**
 * Render EverReach Static Ads — All 20 angles × 4 Meta sizes
 *
 * Usage:
 *   npx tsx scripts/render-everreach-statics.ts
 *   npx tsx scripts/render-everreach-statics.ts --angles UA_TIMING_01,PA_SYSTEM_05
 *   npx tsx scripts/render-everreach-statics.ts --sizes post,portrait
 *   npx tsx scripts/render-everreach-statics.ts --type screenshot
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { PHASE_A_ANGLES, ANGLE_SCREENSHOT_MAP, type AdAngle } from '../src/compositions/everreach/angles';

// =============================================================================
// Config
// =============================================================================

const PROJECT_ROOT = path.resolve(__dirname, '..');

interface RenderSize {
  id: string;
  width: number;
  height: number;
  label: string;
}

const META_SIZES: RenderSize[] = [
  { id: 'post',      width: 1080, height: 1080, label: 'Instagram Post (1:1)' },
  { id: 'portrait',  width: 1080, height: 1350, label: 'Instagram Portrait (4:5)' },
  { id: 'story',     width: 1080, height: 1920, label: 'Instagram Story (9:16)' },
  { id: 'facebook',  width: 1200, height: 630,  label: 'Facebook Post (1.91:1)' },
];

// Template → Remotion composition ID prefix
const TEMPLATE_TO_COMPOSITION: Record<string, string> = {
  headline:    'EverReach-Instagram',
  painpoint:   'EverReach-PainPoint',
  listicle:    'EverReach-Listicle',
  comparison:  'EverReach-Comparison',
  stat:        'EverReach-Stat',
  question:    'EverReach-Question',
  objection:   'EverReach-Objections',
};

// Size → composition suffix for text-only templates
const SIZE_TO_SUFFIX: Record<string, string> = {
  post:      'Post',
  portrait:  'Portrait',
  story:     'Story',
  facebook:  'Facebook-Post',
};

// Size → composition suffix for screenshot templates
const SIZE_TO_SCREENSHOT_SUFFIX: Record<string, string> = {
  post:      'Post',
  portrait:  'Portrait',
  story:     'Story',
  facebook:  'Facebook',
};

// =============================================================================
// CLI Args
// =============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: {
    angles: string[];
    sizes: string[];
    type: 'all' | 'text' | 'screenshot';
    outputDir: string;
  } = {
    angles: [],
    sizes: META_SIZES.map(s => s.id),
    type: 'all',
    outputDir: path.join(PROJECT_ROOT, 'output', 'everreach-statics'),
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--angles' && args[i + 1]) {
      opts.angles = args[++i].split(',');
    } else if (args[i] === '--sizes' && args[i + 1]) {
      opts.sizes = args[++i].split(',');
    } else if (args[i] === '--type' && args[i + 1]) {
      opts.type = args[++i] as any;
    } else if (args[i] === '--output' && args[i + 1]) {
      opts.outputDir = args[++i];
    }
  }

  return opts;
}

// =============================================================================
// Render Functions
// =============================================================================

function renderStill(
  compositionId: string,
  outputPath: string,
  width: number,
  height: number,
  props: Record<string, unknown>
): boolean {
  const propsFile = outputPath.replace(/\.png$/, '_props.json');
  fs.writeFileSync(propsFile, JSON.stringify(props));

  try {
    execSync(
      `npx remotion still "${compositionId}" "${outputPath}" --props="${propsFile}" --width=${width} --height=${height}`,
      { cwd: PROJECT_ROOT, stdio: 'pipe', timeout: 60000 }
    );
    // Cleanup props file
    if (fs.existsSync(propsFile)) fs.unlinkSync(propsFile);
    return true;
  } catch (e: any) {
    if (fs.existsSync(propsFile)) fs.unlinkSync(propsFile);
    console.error(`   ❌ Failed: ${e.message?.substring(0, 120)}`);
    return false;
  }
}

function renderTextAd(angle: AdAngle, size: RenderSize, outputDir: string): boolean {
  const template = angle.template;
  const prefix = TEMPLATE_TO_COMPOSITION[template];
  if (!prefix) {
    console.log(`   ⚠️  No composition for template "${template}", skipping`);
    return false;
  }

  // Determine composition ID
  let compositionId: string;
  if (size.id === 'facebook') {
    compositionId = `${prefix === 'EverReach-Instagram' ? 'EverReach' : prefix}-Facebook-Post`;
    // Only the main EverReachAd has Facebook-Post registered; others fall back to Instagram Post
    if (prefix !== 'EverReach-Instagram') {
      compositionId = `${prefix}-Instagram`;
    }
  } else {
    const suffix = SIZE_TO_SUFFIX[size.id] || 'Post';
    if (suffix === 'Post') {
      compositionId = `${prefix}-Instagram`;
    } else {
      compositionId = `${prefix}-${suffix}`;
    }
  }

  const outputPath = path.join(outputDir, `${angle.id}_${size.id}_text.png`);

  const props: Record<string, unknown> = {
    headline: angle.headline,
    subheadline: angle.subheadline,
    ctaText: angle.ctaText,
    awareness: angle.awareness,
    belief: angle.belief,
  };

  // Add template-specific props
  if (template === 'painpoint') {
    props.painStatement = angle.headline;
    props.costStatement = angle.subheadline;
  } else if (template === 'question') {
    props.question = angle.headline;
    props.answerHint = angle.subheadline;
  } else if (template === 'stat') {
    props.stat = '60';
    props.statLabel = 'seconds';
    props.context = angle.subheadline;
  }

  // Adjust font size for smaller/wider formats
  if (size.id === 'facebook') {
    props.headlineSize = 36;
    props.subheadlineSize = 18;
  }

  console.log(`   📐 ${angle.id} → ${compositionId} (${size.width}×${size.height})`);
  return renderStill(compositionId, outputPath, size.width, size.height, props);
}

function renderScreenshotAd(angle: AdAngle, size: RenderSize, outputDir: string): boolean {
  const screenshotConfig = ANGLE_SCREENSHOT_MAP[angle.id];
  if (!screenshotConfig) {
    console.log(`   ⚠️  No screenshot mapping for ${angle.id}, skipping`);
    return false;
  }

  const suffix = SIZE_TO_SCREENSHOT_SUFFIX[size.id] || 'Post';
  const compositionId = `EverReach-Screenshot-${suffix}`;
  const outputPath = path.join(outputDir, `${angle.id}_${size.id}_screenshot.png`);

  const props: Record<string, unknown> = {
    headline: angle.headline,
    subheadline: angle.subheadline,
    ctaText: angle.ctaText,
    awareness: angle.awareness,
    belief: angle.belief,
    screenshotSrc: screenshotConfig.screenshotSrc,
    showPhone: true,
    theme: screenshotConfig.theme,
    layout: screenshotConfig.layout,
    badge: screenshotConfig.badge,
    logoSrc: 'everreach/branding/logo-no-bg.png',
    showLogo: true,
  };

  if (size.id === 'facebook') {
    props.headlineSize = 32;
    props.subheadlineSize = 14;
    props.layout = 'right'; // Always horizontal for landscape
  }

  console.log(`   📱 ${angle.id} → ${compositionId} (${size.width}×${size.height})`);
  return renderStill(compositionId, outputPath, size.width, size.height, props);
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const opts = parseArgs();

  // Filter angles
  const angles = opts.angles.length > 0
    ? PHASE_A_ANGLES.filter(a => opts.angles.includes(a.id))
    : PHASE_A_ANGLES;

  const sizes = META_SIZES.filter(s => opts.sizes.includes(s.id));

  const renderText = opts.type === 'all' || opts.type === 'text';
  const renderScreenshot = opts.type === 'all' || opts.type === 'screenshot';

  const totalEstimate =
    angles.length * sizes.length * ((renderText ? 1 : 0) + (renderScreenshot ? 1 : 0));

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🎨 EverReach Static Ad Batch Renderer');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Angles:     ${angles.length} (of ${PHASE_A_ANGLES.length})`);
  console.log(`  Sizes:      ${sizes.map(s => s.id).join(', ')}`);
  console.log(`  Types:      ${[renderText && 'text', renderScreenshot && 'screenshot'].filter(Boolean).join(' + ')}`);
  console.log(`  Est. Total: ~${totalEstimate} renders`);
  console.log(`  Output:     ${opts.outputDir}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  fs.mkdirSync(opts.outputDir, { recursive: true });

  let success = 0;
  let failed = 0;
  let skipped = 0;
  const startTime = Date.now();

  for (const angle of angles) {
    console.log(`\n🎯 Angle: ${angle.id} — "${angle.name}" (${angle.awareness})`);

    for (const size of sizes) {
      // Text-only render
      if (renderText) {
        const ok = renderTextAd(angle, size, opts.outputDir);
        if (ok) success++;
        else failed++;
      }

      // Screenshot render
      if (renderScreenshot) {
        const ok = renderScreenshotAd(angle, size, opts.outputDir);
        if (ok) success++;
        else failed++;
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Generate manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    angles: angles.map(a => a.id),
    sizes: sizes.map(s => ({ id: s.id, width: s.width, height: s.height })),
    types: [renderText && 'text', renderScreenshot && 'screenshot'].filter(Boolean),
    stats: { success, failed, skipped, elapsed: `${elapsed}s` },
    files: fs.readdirSync(opts.outputDir).filter(f => f.endsWith('.png')),
  };

  fs.writeFileSync(
    path.join(opts.outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  📊 Render Complete');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  ✅ Success:  ${success}`);
  console.log(`  ❌ Failed:   ${failed}`);
  console.log(`  ⏭️  Skipped:  ${skipped}`);
  console.log(`  ⏱️  Duration: ${elapsed}s`);
  console.log(`  📁 Output:   ${opts.outputDir}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
