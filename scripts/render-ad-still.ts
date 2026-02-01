#!/usr/bin/env npx tsx
/**
 * Render Ad Still Script
 * 
 * Renders static ad templates to PNG/JPEG images using Remotion.
 * 
 * Usage:
 *   npx tsx scripts/render-ad-still.ts --template <path-to-template.json>
 *   npx tsx scripts/render-ad-still.ts --template data/templates/my-ad.json --output out/my-ad.png
 *   npx tsx scripts/render-ad-still.ts --template data/templates/my-ad.json --variants
 */

import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';

// =============================================================================
// Types
// =============================================================================

interface RenderOptions {
  templatePath?: string;
  templateJson?: string;
  output?: string;
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  scale?: number;
  variants?: boolean;
  variantsDir?: string;
}

// =============================================================================
// CLI Argument Parsing
// =============================================================================

function parseArgs(): RenderOptions {
  const args = process.argv.slice(2);
  const options: RenderOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--template':
      case '-t':
        options.templatePath = next;
        i++;
        break;
      case '--json':
      case '-j':
        options.templateJson = next;
        i++;
        break;
      case '--output':
      case '-o':
        options.output = next;
        i++;
        break;
      case '--format':
      case '-f':
        options.format = next as 'png' | 'jpeg' | 'webp';
        i++;
        break;
      case '--quality':
      case '-q':
        options.quality = parseInt(next, 10);
        i++;
        break;
      case '--scale':
      case '-s':
        options.scale = parseFloat(next);
        i++;
        break;
      case '--variants':
      case '-v':
        options.variants = true;
        break;
      case '--variants-dir':
        options.variantsDir = next;
        i++;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Ad Still Renderer - Render static ad templates to images

Usage:
  npx tsx scripts/render-ad-still.ts [options]

Options:
  -t, --template <path>     Path to template JSON file
  -j, --json <json>         Inline template JSON string
  -o, --output <path>       Output image path (default: out/ad_<templateId>.<format>)
  -f, --format <format>     Output format: png, jpeg, webp (default: png)
  -q, --quality <number>    JPEG/WebP quality 0-100 (default: 90)
  -s, --scale <number>      Scale factor (default: 1)
  -v, --variants            Render all variants defined in template
  --variants-dir <path>     Directory for variant outputs (default: out/variants)
  -h, --help                Show this help message

Examples:
  # Render a single template
  npx tsx scripts/render-ad-still.ts -t data/templates/hero-ad.json

  # Render with custom output
  npx tsx scripts/render-ad-still.ts -t data/templates/hero-ad.json -o out/hero.png

  # Render as JPEG with quality
  npx tsx scripts/render-ad-still.ts -t data/templates/hero-ad.json -f jpeg -q 85

  # Render at 2x scale
  npx tsx scripts/render-ad-still.ts -t data/templates/hero-ad.json -s 2
`);
}

// =============================================================================
// Template Loading
// =============================================================================

async function loadTemplate(options: RenderOptions): Promise<object> {
  if (options.templateJson) {
    return JSON.parse(options.templateJson);
  }

  if (options.templatePath) {
    const fullPath = path.resolve(process.cwd(), options.templatePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Template file not found: ${fullPath}`);
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(content);
  }

  throw new Error('No template specified. Use --template or --json');
}

// =============================================================================
// Rendering
// =============================================================================

async function renderAdStill(options: RenderOptions): Promise<void> {
  console.log('🎬 Ad Still Renderer');
  console.log('─'.repeat(50));

  // Load template
  console.log('📄 Loading template...');
  const template = await loadTemplate(options);
  const templateId = (template as any).templateId || 'unnamed';
  console.log(`   Template ID: ${templateId}`);
  console.log(`   Canvas: ${(template as any).canvas?.width}x${(template as any).canvas?.height}`);
  console.log(`   Layers: ${(template as any).layers?.length || 0}`);

  // Bundle the project
  console.log('📦 Bundling Remotion project...');
  const bundleLocation = await bundle({
    entryPoint: path.resolve(process.cwd(), 'src/index.ts'),
    webpackOverride: (config) => config,
  });
  console.log('   Bundle created');

  // Select composition
  console.log('🎯 Selecting composition...');
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'AdTemplateStill',
    inputProps: { template },
  });

  // Determine output path
  const format = options.format || 'png';
  const outputPath = options.output || path.join(
    process.cwd(),
    'out',
    `ad_${templateId}.${format}`
  );

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Render
  console.log('🖼️  Rendering still...');
  const startTime = Date.now();

  await renderStill({
    composition,
    serveUrl: bundleLocation,
    output: outputPath,
    inputProps: { template },
    imageFormat: format === 'jpeg' ? 'jpeg' : format === 'webp' ? 'png' : 'png',
    scale: options.scale || 1,
    jpegQuality: options.quality || 90,
  });

  const renderTime = Date.now() - startTime;
  console.log(`   ✅ Rendered in ${renderTime}ms`);
  console.log(`   📁 Output: ${outputPath}`);

  // Get file size
  const stats = fs.statSync(outputPath);
  const fileSizeKB = (stats.size / 1024).toFixed(1);
  console.log(`   📊 Size: ${fileSizeKB} KB`);

  console.log('─'.repeat(50));
  console.log('✨ Done!');
}

// =============================================================================
// Variant Rendering
// =============================================================================

async function renderVariants(options: RenderOptions): Promise<void> {
  console.log('🎬 Ad Still Variant Renderer');
  console.log('─'.repeat(50));

  // Load template
  const template = await loadTemplate(options);
  const templateId = (template as any).templateId || 'unnamed';

  // Check for variant definitions in template or load from variants file
  const variantsDir = options.variantsDir || path.join(process.cwd(), 'out', 'variants', templateId);
  
  if (!fs.existsSync(variantsDir)) {
    fs.mkdirSync(variantsDir, { recursive: true });
  }

  console.log(`📁 Variants output directory: ${variantsDir}`);
  console.log('   (Variant rendering would iterate through variant specs)');
  console.log('   Use the variant-generator module to create variant specs first.');

  // In a full implementation, this would:
  // 1. Load variant specs from a file or generate them
  // 2. Apply each variant to the base template
  // 3. Render each variant
  // 4. Save with variant-specific filenames
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  try {
    const options = parseArgs();

    if (!options.templatePath && !options.templateJson) {
      console.error('Error: No template specified');
      console.log('Use --help for usage information');
      process.exit(1);
    }

    if (options.variants) {
      await renderVariants(options);
    } else {
      await renderAdStill(options);
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
