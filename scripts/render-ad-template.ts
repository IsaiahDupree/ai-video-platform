/**
 * Ad Template Render Script
 * 
 * Renders static ads from TemplateDSL JSON files.
 * 
 * Usage:
 *   npx tsx scripts/render-ad-template.ts [template.json] [output.png]
 *   npx tsx scripts/render-ad-template.ts --variant [template.json] [variant.json] [output.png]
 */

import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';

// =============================================================================
// Types
// =============================================================================

interface RenderOptions {
  templatePath: string;
  variantPath?: string;
  outputPath: string;
  compositionId: string;
}

// =============================================================================
// Argument Parsing
// =============================================================================

function parseArgs(): RenderOptions {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Ad Template Render Script

Usage:
  npx tsx scripts/render-ad-template.ts <template.json> <output.png>
  npx tsx scripts/render-ad-template.ts --variant <template.json> <variant.json> <output.png>

Options:
  --help          Show this help message
  --variant       Apply a variant spec to the template before rendering
  --composition   Specify composition ID (default: AdTemplate-Square)

Examples:
  npx tsx scripts/render-ad-template.ts src/ad-templates/templates/sample-template.json out/ad.png
  npx tsx scripts/render-ad-template.ts --variant template.json variant.json out/ad.png
`);
    process.exit(0);
  }

  let templatePath = '';
  let variantPath: string | undefined;
  let outputPath = '';
  let compositionId = 'AdTemplate-Square';

  let i = 0;
  while (i < args.length) {
    if (args[i] === '--variant') {
      i++;
      templatePath = args[i++];
      variantPath = args[i++];
      outputPath = args[i++];
    } else if (args[i] === '--composition') {
      i++;
      compositionId = args[i++];
    } else {
      templatePath = args[i++];
      outputPath = args[i++] || 'out/ad-template.png';
    }
  }

  return { templatePath, variantPath, outputPath, compositionId };
}

// =============================================================================
// Main Render Function
// =============================================================================

async function main() {
  const options = parseArgs();
  
  console.log('🎬 Ad Template Renderer');
  console.log('========================');
  console.log(`Template: ${options.templatePath}`);
  if (options.variantPath) {
    console.log(`Variant: ${options.variantPath}`);
  }
  console.log(`Output: ${options.outputPath}`);
  console.log(`Composition: ${options.compositionId}`);
  console.log('');

  // Load template
  if (!fs.existsSync(options.templatePath)) {
    console.error(`❌ Template file not found: ${options.templatePath}`);
    process.exit(1);
  }

  const templateJson = JSON.parse(fs.readFileSync(options.templatePath, 'utf-8'));
  
  // Apply variant if specified
  let finalTemplate = templateJson;
  if (options.variantPath) {
    if (!fs.existsSync(options.variantPath)) {
      console.error(`❌ Variant file not found: ${options.variantPath}`);
      process.exit(1);
    }
    const variantJson = JSON.parse(fs.readFileSync(options.variantPath, 'utf-8'));
    
    // Merge variant overrides
    finalTemplate = {
      ...templateJson,
      bindings: {
        text: { ...templateJson.bindings?.text, ...variantJson.overrides?.text },
        assets: { ...templateJson.bindings?.assets, ...variantJson.overrides?.assets },
      },
    };
    console.log('✅ Applied variant overrides');
  }

  // Ensure output directory exists
  const outputDir = path.dirname(options.outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    console.log('📦 Bundling Remotion project...');
    const bundled = await bundle({
      entryPoint: path.resolve('./src/index.ts'),
      onProgress: (progress) => {
        if (progress % 25 === 0) {
          process.stdout.write(`  ${progress}%\r`);
        }
      },
    });
    console.log('✅ Bundle complete');

    console.log('🔍 Selecting composition...');
    const composition = await selectComposition({
      serveUrl: bundled,
      id: options.compositionId,
      inputProps: {
        template: finalTemplate,
      },
    });
    console.log(`✅ Found composition: ${composition.width}x${composition.height}`);

    console.log('🖼️  Rendering still...');
    await renderStill({
      composition,
      serveUrl: bundled,
      output: options.outputPath,
      inputProps: {
        template: finalTemplate,
      },
    });

    console.log('');
    console.log(`✅ Rendered successfully: ${options.outputPath}`);
    
    // Show file size
    const stats = fs.statSync(options.outputPath);
    console.log(`   Size: ${(stats.size / 1024).toFixed(1)} KB`);
    
  } catch (error) {
    console.error('❌ Render failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
