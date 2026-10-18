#!/usr/bin/env npx tsx
/**
 * Batch Rendering Script for Brief-Based Videos
 * 
 * Renders multiple videos from briefs or input configurations.
 * 
 * Usage:
 *   npx tsx scripts/batch-render.ts
 *   npx tsx scripts/batch-render.ts --briefs data/briefs/*.json
 *   npx tsx scripts/batch-render.ts --config batch-config.json
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { generateBrief, GeneratorInput } from './generate-brief';
import { ContentBrief } from '../src/types';

interface BatchConfig {
  videos: GeneratorInput[];
  outputDir?: string;
  quality?: 'preview' | 'production';
}

// Example batch configuration
const defaultBatchConfig: BatchConfig = {
  outputDir: './output/batch',
  quality: 'production',
  videos: [
    {
      format: 'explainer_v1',
      title: '5 Morning Habits',
      subtitle: 'For Maximum Productivity',
      topics: [
        'Wake Early: Start your day before distractions',
        'Exercise: Get your blood flowing',
        'Hydrate: Drink water before coffee',
        'Plan: Review your top 3 priorities',
        'No Phone: Avoid social media for first hour',
      ],
      theme: 'dark',
      durationPerTopic: 6,
    },
    {
      format: 'listicle_v1',
      title: 'Top 5 Coding Tools',
      subtitle: 'Every Developer Needs',
      listItems: [
        'VS Code: The ultimate editor',
        'GitHub Copilot: AI pair programming',
        'Docker: Containerize everything',
        'Postman: API testing made easy',
        'Notion: Document and organize',
      ],
      theme: 'neon',
      ctaText: 'Follow for more dev tips!',
      durationPerTopic: 7,
    },
    {
      format: 'explainer_v1',
      title: 'Learn TypeScript',
      subtitle: 'In 60 Seconds',
      topics: [
        'Types: Add type annotations',
        'Interfaces: Define object shapes',
        'Generics: Reusable type-safe code',
      ],
      theme: 'dark',
      accentColor: '#3178c6',
      durationPerTopic: 10,
    },
  ],
};

async function renderFromBrief(brief: ContentBrief, outputPath: string, quality: string): Promise<void> {
  const propsJson = JSON.stringify({ brief });
  const crf = quality === 'preview' ? 28 : 18;
  
  execSync(
    `npx remotion render BriefComposition "${outputPath}" --props='${propsJson}' --crf=${crf}`,
    { 
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
    }
  );
}

async function batchRender(config: BatchConfig = defaultBatchConfig): Promise<void> {
  console.log('\n🎬 Batch Video Renderer');
  console.log('========================\n');

  const outputDir = config.outputDir || './output/batch';
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`📁 Output directory: ${outputDir}`);
  console.log(`🎯 Quality: ${config.quality || 'production'}`);
  console.log(`📹 Videos to render: ${config.videos.length}\n`);

  const results: { title: string; success: boolean; path?: string; error?: string }[] = [];

  for (let i = 0; i < config.videos.length; i++) {
    const input = config.videos[i];
    const videoNum = i + 1;
    
    console.log(`\n[${videoNum}/${config.videos.length}] ${input.title}`);
    console.log('─'.repeat(40));

    try {
      // Generate brief from input
      const brief = generateBrief(input);
      
      // Create output filename
      const filename = sanitizeFilename(input.title) + '.mp4';
      const outputPath = path.join(outputDir, filename);
      
      console.log(`   Format: ${input.format}`);
      console.log(`   Duration: ${brief.settings.duration_sec}s`);
      console.log(`   Output: ${outputPath}`);
      console.log(`   Rendering...`);

      // Render the video
      await renderFromBrief(brief, outputPath, config.quality || 'production');

      results.push({ title: input.title, success: true, path: outputPath });
      console.log(`   ✅ Complete!`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.push({ title: input.title, success: false, error: errorMsg });
      console.error(`   ❌ Failed: ${errorMsg}`);
    }
  }

  // Summary
  console.log('\n\n📊 Batch Render Summary');
  console.log('========================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}`);
  successful.forEach(r => console.log(`   - ${r.path}`));
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`);
    failed.forEach(r => console.log(`   - ${r.title}: ${r.error}`));
  }

  console.log(`\n🎉 Batch rendering complete!`);
}

function sanitizeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Parse CLI arguments
function parseArgs(): BatchConfig | null {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Batch Video Renderer

Usage:
  npx tsx scripts/batch-render.ts [options]

Options:
  --config <file>    Load batch config from JSON file
  --briefs <glob>    Render all briefs matching pattern
  --output <dir>     Output directory (default: ./output/batch)
  --quality <q>      Quality: preview | production
  --help, -h         Show this help

Examples:
  # Render default batch
  npx tsx scripts/batch-render.ts

  # Render from config file
  npx tsx scripts/batch-render.ts --config my-batch.json

  # Render all briefs in a directory
  npx tsx scripts/batch-render.ts --briefs "data/briefs/*.json"
`);
    return null;
  }

  // Check for config file
  const configIndex = args.indexOf('--config');
  if (configIndex !== -1 && args[configIndex + 1]) {
    const configPath = args[configIndex + 1];
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  }

  return defaultBatchConfig;
}

// Main execution
if (require.main === module) {
  const config = parseArgs();
  if (config) {
    batchRender(config).catch((err) => {
      console.error('❌ Batch render failed:', err.message);
      process.exit(1);
    });
  }
}

export { batchRender, BatchConfig };






