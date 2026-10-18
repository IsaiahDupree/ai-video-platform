#!/usr/bin/env npx tsx
/**
 * Render Video from Input Variables
 * 
 * Generates a brief and renders a video in one command.
 * 
 * Usage:
 *   npx tsx scripts/render-from-input.ts --title "My Video" --topics "Topic 1,Topic 2" --output video.mp4
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { generateBrief, GeneratorInput } from './generate-brief';

interface RenderInput extends GeneratorInput {
  quality?: 'preview' | 'production';
}

async function renderFromInput(input: RenderInput): Promise<string> {
  console.log('\n🎬 Video Render from Input');
  console.log('==========================\n');

  // 1. Generate brief
  console.log('1/3 Generating content brief...');
  const brief = generateBrief(input);
  
  const briefPath = `/tmp/brief_${brief.id}.json`;
  fs.writeFileSync(briefPath, JSON.stringify(brief, null, 2));
  console.log(`    Brief ID: ${brief.id}`);
  console.log(`    Duration: ${brief.settings.duration_sec}s`);

  // 2. Determine output path
  const outputPath = input.outputPath || 
    `./output/${brief.id}.mp4`;
  
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 3. Render using Remotion CLI
  console.log('\n2/3 Rendering video...');
  console.log(`    Output: ${outputPath}`);
  console.log(`    Resolution: ${brief.settings.resolution.width}x${brief.settings.resolution.height}`);

  const crf = input.quality === 'preview' ? 28 : 18;
  
  try {
    execSync(`npx remotion render BriefComposition ${outputPath} --props='${JSON.stringify({ brief })}' --crf=${crf}`, {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('❌ Render failed');
    throw error;
  }

  // Cleanup temp brief
  fs.unlinkSync(briefPath);

  console.log('\n3/3 Complete!');
  console.log(`✅ Video saved: ${outputPath}`);

  return outputPath;
}

// Parse CLI arguments
function parseArgs(): RenderInput {
  const args = process.argv.slice(2);
  const input: RenderInput = {
    format: 'explainer_v1',
    title: 'My Video',
    quality: 'production',
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--format':
      case '-f':
        input.format = args[++i];
        break;
      case '--title':
      case '-t':
        input.title = args[++i];
        break;
      case '--subtitle':
      case '-s':
        input.subtitle = args[++i];
        break;
      case '--hook':
        input.hookText = args[++i];
        break;
      case '--topics':
        input.topics = args[++i].split(',').map(t => t.trim());
        break;
      case '--items':
        input.listItems = args[++i].split(',').map(t => t.trim());
        break;
      case '--cta':
        input.ctaText = args[++i];
        break;
      case '--theme':
        input.theme = args[++i] as 'dark' | 'light' | 'neon';
        break;
      case '--accent':
        input.accentColor = args[++i];
        break;
      case '--duration':
        input.durationPerTopic = parseFloat(args[++i]);
        break;
      case '--quality':
      case '-q':
        input.quality = args[++i] as 'preview' | 'production';
        break;
      case '--output':
      case '-o':
        input.outputPath = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
Render Video from Input Variables

Usage:
  npx tsx scripts/render-from-input.ts [options]

Options:
  --format, -f    Video format: explainer_v1, listicle_v1, shorts_v1
  --title, -t     Video title
  --subtitle, -s  Video subtitle
  --hook          Hook text for intro
  --topics        Comma-separated topics (for explainer format)
  --items         Comma-separated list items (for listicle format)
  --cta           Call-to-action text
  --theme         Theme: dark, light, neon
  --accent        Accent color (hex)
  --duration      Duration per topic in seconds
  --quality, -q   Render quality: preview, production
  --output, -o    Output video path
  --help, -h      Show this help

Examples:
  # Explainer video
  npx tsx scripts/render-from-input.ts \\
    --title "5 Productivity Tips" \\
    --topics "Time Blocking,Deep Work,Weekly Reviews" \\
    --output output/productivity.mp4

  # Listicle video  
  npx tsx scripts/render-from-input.ts \\
    --format listicle_v1 \\
    --title "Top 5 Tools" \\
    --items "Tool 1:Description,Tool 2:Description" \\
    --theme neon \\
    --output output/tools.mp4

  # Quick preview
  npx tsx scripts/render-from-input.ts \\
    --title "Test" \\
    --topics "One,Two" \\
    --quality preview \\
    --output output/test.mp4
`);
        process.exit(0);
    }
  }

  return input;
}

// Main execution
if (require.main === module) {
  const input = parseArgs();
  
  renderFromInput(input).catch((err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
}

export { renderFromInput, RenderInput };
