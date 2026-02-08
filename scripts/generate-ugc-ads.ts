#!/usr/bin/env npx tsx
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UGC Ad Generator CLI
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * End-to-end pipeline: Nano Banana → Veo 3 → Remotion → Parametric Variants
 *
 * Usage:
 *   npx tsx scripts/generate-ugc-ads.ts --product "BlankLogo" --before-prompt "..." --after-prompt "..."
 *   npx tsx scripts/generate-ugc-ads.ts --config config/ugc-campaign.json
 *   npx tsx scripts/generate-ugc-ads.ts --dry-run --max-variants 12
 */

import * as fs from 'fs';
import * as path from 'path';

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        const val = trimmed.substring(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

import { runUGCPipeline } from '../src/pipeline/ugc-ad-pipeline';
import type {
  UGCPipelineConfig,
  TemplateType,
  HookType,
  AwarenessLevel,
  CtaType,
  CopyBank,
} from '../src/pipeline/types';
import { META_AD_SIZES } from '../src/pipeline/types';

// =============================================================================
// Default Copy Bank
// =============================================================================

const DEFAULT_COPY_BANK: CopyBank = {
  headlines: {
    question: [
      'Still posting with watermarks?',
      'Tired of blurry AI removals?',
      'Why settle for smeared exports?',
    ],
    statement: [
      'Watermarks kill your engagement',
      'Your content deserves better',
      'Clean exports in minutes',
    ],
    shock: [
      '87% of creators lose followers over this',
      'This one thing ruins every post',
      'Most tools make it worse',
    ],
    curiosity: [
      'The tool 50K creators won\'t share',
      'What if removal was instant?',
      'One upload. Zero watermarks.',
    ],
    social_proof: [
      'Join 50,000+ creators',
      'Rated 4.9/5 by professionals',
      '50K creators trust this tool',
    ],
    urgency: [
      '10 free credits — today only',
      'Limited: Free watermark removal',
      'Free tier closing soon',
    ],
  },
  subheadlines: {
    problem_aware: [
      'That watermark is killing the clip. Upload → clean it → download.',
      'Don\'t redo the whole edit. Clean the watermark and ship the video.',
      'When you need a clean clip today.',
    ],
    solution_aware: [
      'If the usual sites keep ruining your video, try a premium tool.',
      'No bait-and-switch. No blurry exports. Just clean video.',
      'Ad-free experience designed for creators.',
    ],
    unaware: [
      'Upload your video and get a clean version back.',
      'Premium watermark removal in a simple flow.',
    ],
    product_aware: [
      'The one you bookmark. Because it works.',
      'Built like a real tool, not a sketchy site.',
    ],
    most_aware: [
      'Get 10 free credits. No card needed.',
      'Your next clean export is one click away.',
    ],
  },
  ctas: {
    action: ['Remove Watermark Now', 'Try It Free', 'Upload Video'],
    benefit: ['Get Clean Photos', 'Get 10 Free Credits', 'Unlock HD Quality'],
    urgency: ['Claim Free Credits Now', 'Start Before Offer Ends'],
    curiosity: ['See the Difference', 'Watch It Work'],
  },
  beforeLabels: ['BEFORE', 'WITH WATERMARK', 'ORIGINAL'],
  afterLabels: ['AFTER', 'CLEAN', 'REMOVED'],
  trustLines: [
    'Quality preserved • No popups',
    'Ad-free • Fast • Clean output',
    '10 free credits • No card needed',
    '',
  ],
  badges: ['AD-FREE', 'HQ OUTPUT', 'PREMIUM', 'FAST', 'NO INSTALL', ''],
};

// =============================================================================
// CLI Argument Parsing
// =============================================================================

function parseArgs(): {
  product: string;
  description: string;
  productImage: string;
  beforePrompt: string;
  afterPrompt: string;
  configFile: string;
  outputDir: string;
  maxVariants: number;
  strategy: 'full_cross' | 'latin_square' | 'random_sample';
  dryRun: boolean;
  resume: string;
  templates: string;
  preview: boolean;
  brandName: string;
  primaryColor: string;
  accentColor: string;
} {
  const args = process.argv.slice(2);
  const opts: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace('--', '');
      if (key === 'dry-run') {
        opts['dryRun'] = 'true';
      } else if (key === 'preview') {
        opts['preview'] = 'true';
      } else if (args[i + 1] && !args[i + 1].startsWith('--')) {
        opts[key] = args[++i];
      }
    }
  }

  return {
    product: opts['product'] || 'BlankLogo',
    description: opts['description'] || 'AI watermark removal tool for creators',
    productImage: opts['product-image'] || opts['image'] || '',
    beforePrompt: opts['before-prompt'] || 'Person looking frustrated at phone showing a photo with an ugly watermark across it',
    afterPrompt: opts['after-prompt'] || 'Same person smiling happily at phone showing a clean professional photo without any watermark',
    configFile: opts['config'] || '',
    outputDir: opts['output'] || './output/ugc-ads',
    maxVariants: parseInt(opts['max-variants'] || '12', 10),
    strategy: (opts['strategy'] as any) || 'latin_square',
    dryRun: opts['dryRun'] === 'true',
    resume: opts['resume'] || '',
    templates: opts['templates'] || 'before_after,testimonial,product_demo,problem_solution',
    preview: opts['preview'] === 'true',
    brandName: opts['brand'] || 'BlankLogo',
    primaryColor: opts['primary-color'] || '#635bff',
    accentColor: opts['accent-color'] || '#00d4ff',
  };
}

function printUsage(): void {
  console.log(`
🎬 UGC Ad Generator
═══════════════════════════════════════════════════════════════

Generate parametrically-tagged UGC ad variants using:
  🍌 Nano Banana (Gemini) — Character-consistent before/after images
  🎥 Veo 3 — Animate images into video clips
  🎨 Remotion — Compose final ads with overlays + CTA

Usage:
  npx tsx scripts/generate-ugc-ads.ts [options]

Options:
  --product <name>          Product name (default: BlankLogo)
  --description <desc>      Product description
  --product-image <path>    Product image for reference
  --before-prompt <text>    Scene prompt for "before" state
  --after-prompt <text>     Scene prompt for "after" state
  --config <path>           JSON config file (overrides all other options)
  --output <dir>            Output directory (default: ./output/ugc-ads)
  --max-variants <n>        Max variants to generate (default: 12)
  --strategy <type>         full_cross | latin_square | random_sample
  --brand <name>            Brand name
  --primary-color <hex>     Primary brand color
  --accent-color <hex>      Accent color
  --templates <list>         Comma-separated templates (default: all 4)
                            Options: before_after,testimonial,product_demo,problem_solution
  --dry-run                 Generate variants without rendering
  --preview                 Auto-generate HTML gallery after batch creation
  --resume <batch_dir>      Resume an interrupted batch from last checkpoint

Examples:
  # Quick start with defaults
  npx tsx scripts/generate-ugc-ads.ts --dry-run

  # Resume interrupted batch
  npx tsx scripts/generate-ugc-ads.ts --resume output/ugc-ads/b102815

  # Custom product
  npx tsx scripts/generate-ugc-ads.ts \\
    --product "MyApp" \\
    --before-prompt "Person struggling with old software" \\
    --after-prompt "Person delighted using modern app" \\
    --max-variants 24

  # From config file
  npx tsx scripts/generate-ugc-ads.ts --config config/ugc-campaign.json

Environment Variables:
  GOOGLE_API_KEY          Required for Nano Banana (Gemini)
  GOOGLE_VEO_API_KEY      Required for Veo 3 video generation
  GOOGLE_AI_API_KEY       Alternative to GOOGLE_VEO_API_KEY
`);
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const args = parseArgs();

  // Show help
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  // Load config file if provided
  let configOverrides: Partial<UGCPipelineConfig> = {};
  if (args.configFile && fs.existsSync(args.configFile)) {
    console.log(`📄 Loading config from: ${args.configFile}`);
    configOverrides = JSON.parse(fs.readFileSync(args.configFile, 'utf-8'));
  }

  // Build pipeline config
  const config: UGCPipelineConfig = {
    product: configOverrides.product || {
      name: args.product,
      description: args.description,
      imagePath: args.productImage || undefined,
    },
    brand: configOverrides.brand || {
      name: args.brandName,
      primaryColor: args.primaryColor,
      accentColor: args.accentColor,
      fontFamily: 'Inter',
    },
    scenes: configOverrides.scenes || {
      beforePrompt: args.beforePrompt,
      afterPrompt: args.afterPrompt,
      characterStyle: 'realistic',
    },
    matrix: configOverrides.matrix || {
      templates: args.templates.split(',').map(t => t.trim()) as TemplateType[],
      hookTypes: ['question', 'social_proof', 'urgency', 'curiosity'] as HookType[],
      awarenessLevels: ['problem_aware', 'solution_aware'] as AwarenessLevel[],
      ctaTypes: ['action', 'benefit'] as CtaType[],
      sizes: META_AD_SIZES.filter(s => ['feed_square', 'story'].includes(s.name)),
      strategy: args.strategy,
      maxVariants: args.maxVariants,
    },
    copyBank: (configOverrides as any).copyBank || DEFAULT_COPY_BANK,
    outputDir: args.outputDir,
    dryRun: args.dryRun,
  };

  // Validate API keys
  if (!args.dryRun) {
    const geminiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.error('❌ GOOGLE_API_KEY required for image generation. Set in .env.local or use --dry-run');
      process.exit(1);
    }
  }

  // Run pipeline
  try {
    const runOptions = args.resume ? { resumeBatchDir: args.resume } : undefined;
    const batch = await runUGCPipeline(config, runOptions);

    // Auto-generate gallery if --preview
    if (args.preview) {
      const { generateGalleryFromBatch } = await import('../src/pipeline/preview-generator');
      const batchDir = path.join(config.outputDir, batch.id);
      console.log('\n🖼️  Generating preview gallery...');
      const galleryPath = generateGalleryFromBatch(batchDir);
      const { execSync } = await import('child_process');
      try {
        execSync(`open "${galleryPath}"`, { stdio: 'pipe' });
        console.log(`   Opened: ${galleryPath}`);
      } catch {
        console.log(`   Gallery: file://${path.resolve(galleryPath)}`);
      }
    }

    // Print next steps
    console.log('📋 Next Steps:');
    console.log('  1. Review generated variants in the output directory');
    console.log('  2. Upload to Meta Ads Manager (use utm_mapping.json for ad names)');
    console.log('  3. After running ads, export Meta data as CSV');
    console.log('  4. Run optimization: npx tsx scripts/optimize-ugc-ads.ts --batch ' + batch.id);
    console.log('');
  } catch (error: any) {
    console.error(`\n❌ Pipeline failed: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
