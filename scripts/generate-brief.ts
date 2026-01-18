#!/usr/bin/env npx tsx
/**
 * Dynamic Brief Generator
 * 
 * Generates content briefs from input variables for video rendering.
 * 
 * Usage:
 *   npx tsx scripts/generate-brief.ts --format explainer --title "My Video" --topics "Topic 1,Topic 2"
 */

import fs from 'fs';
import path from 'path';
import { ContentBrief, Section, VideoFormat, IntroContent, TopicContent, OutroContent, ListItemContent } from '../src/types';
import { getFormat } from '../formats';

interface GeneratorInput {
  format: string;
  title: string;
  subtitle?: string;
  hookText?: string;
  topics?: string[];           // For explainer format
  listItems?: string[];        // For listicle format
  ctaText?: string;
  socialHandles?: { platform: string; handle: string }[];
  theme?: 'dark' | 'light' | 'neon';
  accentColor?: string;
  durationPerTopic?: number;   // seconds per topic
  outputPath?: string;
}

function generateBrief(input: GeneratorInput): ContentBrief {
  const formatConfig = getFormat(input.format);
  const now = new Date().toISOString();
  const id = `generated_${Date.now()}`;

  // Calculate durations
  const introDuration = 5;
  const outroDuration = 5;
  const topicDuration = input.durationPerTopic || 8;
  
  const sections: Section[] = [];
  let currentTime = 0;

  // Intro section
  const introContent: IntroContent = {
    type: 'intro',
    title: input.title,
    subtitle: input.subtitle,
    hook_text: input.hookText,
  };

  sections.push({
    id: 'intro_001',
    type: 'intro',
    duration_sec: introDuration,
    start_time_sec: currentTime,
    content: introContent,
  });
  currentTime += introDuration;

  // Main content sections based on format
  if (input.format.startsWith('listicle') && input.listItems) {
    // Listicle format - numbered items
    input.listItems.forEach((item, index) => {
      const [title, ...descParts] = item.split(':');
      const description = descParts.join(':').trim() || title;
      
      const listContent: ListItemContent = {
        type: 'list_item',
        number: input.listItems!.length - index, // Countdown
        title: title.trim(),
        description: description,
      };

      sections.push({
        id: `item_${String(index + 1).padStart(3, '0')}`,
        type: 'list_item',
        duration_sec: topicDuration,
        start_time_sec: currentTime,
        content: listContent,
      });
      currentTime += topicDuration;
    });
  } else if (input.topics) {
    // Explainer/topic format
    input.topics.forEach((topic, index) => {
      const [heading, ...bodyParts] = topic.split(':');
      const bodyText = bodyParts.join(':').trim() || `Learn about ${heading.trim()}`;
      
      const topicContent: TopicContent = {
        type: 'topic',
        heading: heading.trim(),
        body_text: bodyText,
        animation_style: index % 2 === 0 ? 'slide' : 'fade',
      };

      sections.push({
        id: `topic_${String(index + 1).padStart(3, '0')}`,
        type: 'topic',
        duration_sec: topicDuration,
        start_time_sec: currentTime,
        content: topicContent,
      });
      currentTime += topicDuration;
    });
  }

  // Outro section
  const outroContent: OutroContent = {
    type: 'outro',
    title: 'Thanks for watching!',
    call_to_action: input.ctaText || 'Follow for more!',
    social_handles: input.socialHandles,
  };

  sections.push({
    id: 'outro_001',
    type: 'outro',
    duration_sec: outroDuration,
    start_time_sec: currentTime,
    content: outroContent,
  });
  currentTime += outroDuration;

  // Build the full brief
  const brief: ContentBrief = {
    id,
    format: input.format as any,
    version: '1.0',
    created_at: now,
    settings: {
      resolution: formatConfig.resolution,
      fps: 30,
      duration_sec: currentTime,
      aspect_ratio: formatConfig.aspect_ratio,
    },
    style: {
      theme: input.theme || 'dark',
      primary_color: formatConfig.default_style.primary_color,
      secondary_color: formatConfig.default_style.secondary_color,
      accent_color: input.accentColor || formatConfig.default_style.accent_color,
      font_heading: 'Inter',
      font_body: 'Inter',
      background_type: formatConfig.default_style.background_type,
      background_value: formatConfig.default_style.background_value,
    },
    sections,
  };

  return brief;
}

function saveBrief(brief: ContentBrief, outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(brief, null, 2));
  console.log(`✅ Brief saved to: ${outputPath}`);
}

// Parse CLI arguments
function parseArgs(): GeneratorInput {
  const args = process.argv.slice(2);
  const input: GeneratorInput = {
    format: 'explainer_v1',
    title: 'My Video',
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
      case '--output':
      case '-o':
        input.outputPath = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
Dynamic Brief Generator

Usage:
  npx tsx scripts/generate-brief.ts [options]

Options:
  --format, -f    Video format: explainer_v1, listicle_v1, shorts_v1 (default: explainer_v1)
  --title, -t     Video title
  --subtitle, -s  Video subtitle
  --hook          Hook text for intro
  --topics        Comma-separated topics (for explainer format)
  --items         Comma-separated list items (for listicle format)
  --cta           Call-to-action text
  --theme         Theme: dark, light, neon (default: dark)
  --accent        Accent color (hex, e.g., #3b82f6)
  --duration      Duration per topic in seconds (default: 8)
  --output, -o    Output path for brief JSON
  --help, -h      Show this help

Examples:
  npx tsx scripts/generate-brief.ts --format explainer_v1 --title "5 Tips" --topics "Tip 1,Tip 2,Tip 3"
  npx tsx scripts/generate-brief.ts --format listicle_v1 --title "Top 5" --items "Item 1,Item 2,Item 3,Item 4,Item 5"
`);
        process.exit(0);
    }
  }

  return input;
}

// Main execution
if (require.main === module) {
  const input = parseArgs();
  
  console.log('\n🎬 Generating Brief...');
  console.log(`   Format: ${input.format}`);
  console.log(`   Title: ${input.title}`);
  
  const brief = generateBrief(input);
  
  console.log(`   Duration: ${brief.settings.duration_sec}s`);
  console.log(`   Sections: ${brief.sections.length}`);
  
  const outputPath = input.outputPath || `./data/briefs/generated_${Date.now()}.json`;
  saveBrief(brief, outputPath);
  
  console.log('\n📋 Brief Summary:');
  brief.sections.forEach(s => {
    console.log(`   - ${s.type}: ${s.duration_sec}s @ ${s.start_time_sec}s`);
  });
}

export { generateBrief, GeneratorInput };
