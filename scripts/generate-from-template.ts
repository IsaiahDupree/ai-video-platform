#!/usr/bin/env npx tsx
/**
 * Template-Based Video Generator
 *
 * Generate videos from pre-built templates for common use cases:
 * - Product Demos
 * - Tutorial Videos
 * - Social Media Ads
 * - News Presentations
 *
 * Usage:
 *   npx tsx scripts/generate-from-template.ts --template product-demo --config config.json
 *   npx tsx scripts/generate-from-template.ts --list
 *   npx tsx scripts/generate-from-template.ts --help
 *
 * Example config.json for product-demo:
 *   {
 *     "title": "My Product",
 *     "productName": "SuperTool",
 *     "companyName": "TechCorp",
 *     "features": [
 *       "AI-powered automation: Save 10 hours/week",
 *       "Real-time collaboration: Work with your team",
 *       "Enterprise security: Bank-level protection"
 *     ],
 *     "cta": "Get 50% off for early adopters",
 *     "uniqueAngle": "fastest to value"
 *   }
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  generateFromTemplate,
  validateTemplateInput,
  listTemplates,
  listTemplatesByCategory,
  TemplateInput,
} from '../src/api/templates';
import { generateBrief } from './generate-brief';
import { batchRender } from './batch-render';

// =============================================================================
// Template Examples
// =============================================================================

const TEMPLATE_EXAMPLES: Record<string, any> = {
  'product-demo': {
    title: 'SuperTool Product Demo',
    productName: 'SuperTool',
    companyName: 'TechCorp',
    features: [
      'AI-powered automation: Save 10 hours/week',
      'Real-time collaboration: Work with your team',
      'Enterprise security: Bank-level protection',
    ],
    cta: 'Get 50% off for early adopters',
    uniqueAngle: 'fastest to value',
  },
  'tutorial': {
    title: 'Build Your First React App',
    topic: 'Building a React App',
    difficulty: 'Beginner',
    targetAudience: 'JavaScript developers',
    steps: [
      'Create a new React project with Vite',
      'Build your first component',
      'Add interactivity with hooks',
      'Deploy to production',
    ],
    tools: 'React, Vite, npm',
  },
  'social-ad': {
    title: 'AI Writing Tool Social Ad',
    hook: '✍️ Write 100 emails in 10 minutes',
    painPoint: 'Spend hours drafting repetitive emails?',
    solution: 'AI does the heavy lifting, you keep the personality',
    testimonial: '⭐⭐⭐⭐⭐ "Saved me 5 hours this week" - Sarah',
    cta: '🎁 Try free for 30 days',
    targetAudience: 'Busy professionals',
  },
  'news-presentation': {
    title: 'TechCorp Raises $50M Series B',
    headline: 'TechCorp Announces $50M Series B Funding',
    keyPoints: [
      'Expanded team by 50%',
      'Launched 5 new product features',
      'Reached 10,000 paying customers',
    ],
    data: 'Year-over-year growth: 300%',
    quotes: 'This funding allows us to scale globally - CEO Jane Smith',
    callToAction: 'Join our team at techcorp.com/careers',
  },
};

// =============================================================================
// CLI Functions
// =============================================================================

function showHelp(): void {
  console.log(`
Template-Based Video Generator

Usage:
  npx tsx scripts/generate-from-template.ts [command] [options]

Commands:
  generate     Generate video from template (default)
  list         List all available templates
  list-category List templates by category
  show         Show template example

Options for 'generate':
  --template <id>     Template ID (product-demo, tutorial, social-ad, news-presentation)
  --config <file>     JSON config file with template data
  --output <dir>      Output directory (default: ./output/videos)
  --quality <q>       Quality: preview | production (default: production)
  --render            Automatically render the video

Options for 'list':
  None

Options for 'list-category':
  --category <name>   Category: product-demo, tutorial, social-ad, news

Options for 'show':
  --template <id>     Template ID to show example for

Examples:
  # List all templates
  npx tsx scripts/generate-from-template.ts list

  # Show example config for product demo
  npx tsx scripts/generate-from-template.ts show --template product-demo

  # Generate from config file
  npx tsx scripts/generate-from-template.ts generate --template product-demo --config my-config.json

  # Generate and render
  npx tsx scripts/generate-from-template.ts generate --template social-ad --config ad.json --render
`);
}

function listAllTemplates(): void {
  const templates = listTemplates();
  console.log('\n📋 Available Templates\n');

  const grouped: Record<string, typeof templates> = {};
  for (const template of templates) {
    if (!grouped[template.category]) {
      grouped[template.category] = [];
    }
    grouped[template.category].push(template);
  }

  for (const [category, templates] of Object.entries(grouped)) {
    console.log(`\n${category.toUpperCase()}:`);
    for (const template of templates) {
      console.log(`  ${template.id.padEnd(20)} - ${template.name}`);
      console.log(`    ${template.description}`);
      console.log(`    Duration: ${template.defaultDuration}s | Aspect: ${template.aspectRatio}\n`);
    }
  }
}

function listByCategory(category: string): void {
  const templates = listTemplatesByCategory(category);

  if (templates.length === 0) {
    console.log(`\n❌ No templates found in category: ${category}\n`);
    return;
  }

  console.log(`\n📋 Templates in "${category}"\n`);
  for (const template of templates) {
    console.log(`${template.id} - ${template.name}`);
    console.log(`  ${template.description}\n`);
  }
}

function showTemplateExample(templateId: string): void {
  const example = TEMPLATE_EXAMPLES[templateId];

  if (!example) {
    console.log(`\n❌ No example found for template: ${templateId}\n`);
    return;
  }

  console.log(`\n📋 Example config for "${templateId}":\n`);
  console.log(JSON.stringify(example, null, 2));
  console.log('\n');
}

async function generateFromConfig(
  templateId: string,
  configPath: string,
  outputDir: string = './output/videos',
  shouldRender: boolean = false,
  quality: 'preview' | 'production' = 'production'
): Promise<void> {
  // Load config
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Config file not found: ${configPath}`);
    process.exit(1);
  }

  const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  // Validate input
  const input: TemplateInput = {
    templateId,
    title: configData.title || 'Untitled',
    subtitle: configData.subtitle,
    content: configData,
    outputDir,
    quality,
  };

  const validation = validateTemplateInput(input);
  if (!validation.valid) {
    console.error('\n❌ Validation errors:');
    validation.errors.forEach(err => console.error(`  • ${err}`));
    process.exit(1);
  }

  console.log(`\n✅ Config validated`);

  // Generate brief
  try {
    const generatorInput = generateFromTemplate(input);
    console.log(`\n📝 Generated brief from template`);
    console.log(`   Title: ${generatorInput.title}`);
    console.log(`   Format: ${generatorInput.format}`);
    console.log(`   Topics: ${generatorInput.topics.length}`);

    if (shouldRender) {
      console.log(`\n🎬 Rendering video...`);
      const brief = generateBrief(generatorInput);

      // Create batch config and render
      const batchConfig = {
        videos: [generatorInput],
        outputDir,
        quality,
      };

      await batchRender(batchConfig);
      console.log(`\n✅ Video rendered to ${outputDir}`);
    } else {
      // Save brief for later rendering
      const briefPath = path.join(outputDir, `${sanitizeFilename(input.title)}-brief.json`);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      const brief = generateBrief(generatorInput);
      fs.writeFileSync(briefPath, JSON.stringify(brief, null, 2));
      console.log(`\n✅ Brief saved to: ${briefPath}`);
      console.log(`   Render with: npx remotion render BriefComposition output.mp4 --props='{"brief": $(cat ${briefPath})}'`);
    }
  } catch (error) {
    console.error('\n❌ Generation failed:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

function sanitizeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const command = args[0];

  switch (command) {
    case 'list': {
      listAllTemplates();
      break;
    }

    case 'list-category': {
      const categoryIdx = args.indexOf('--category');
      if (categoryIdx === -1 || !args[categoryIdx + 1]) {
        console.log('\n❌ --category is required for list-category command\n');
        break;
      }
      listByCategory(args[categoryIdx + 1]);
      break;
    }

    case 'show': {
      const templateIdx = args.indexOf('--template');
      if (templateIdx === -1 || !args[templateIdx + 1]) {
        console.log('\n❌ --template is required for show command\n');
        break;
      }
      showTemplateExample(args[templateIdx + 1]);
      break;
    }

    case 'generate':
    default: {
      const templateIdx = args.indexOf('--template');
      const configIdx = args.indexOf('--config');
      const outputIdx = args.indexOf('--output');
      const renderIdx = args.indexOf('--render');
      const qualityIdx = args.indexOf('--quality');

      if (templateIdx === -1 || !args[templateIdx + 1]) {
        console.log('\n❌ --template is required for generate command\n');
        showHelp();
        break;
      }

      if (configIdx === -1 || !args[configIdx + 1]) {
        console.log('\n❌ --config is required for generate command\n');
        showHelp();
        break;
      }

      const templateId = args[templateIdx + 1];
      const configPath = args[configIdx + 1];
      const outputDir = args[outputIdx + 1] || './output/videos';
      const shouldRender = renderIdx !== -1;
      const quality = (args[qualityIdx + 1] || 'production') as 'preview' | 'production';

      await generateFromConfig(templateId, configPath, outputDir, shouldRender, quality);
      break;
    }
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { generateFromConfig, listAllTemplates };
