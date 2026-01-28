/**
 * IMG-002: Character Consistency Script
 * Remix script for consistent character generation with DALL-E
 *
 * This script helps maintain consistent character appearance across multiple images
 * by using detailed prompts, reference descriptions, and DALL-E's generation capabilities.
 *
 * Usage:
 *   npx tsx scripts/remix-character.ts generate --prompt "character description" --output character.png
 *   npx tsx scripts/remix-character.ts remix --character character.json --scenario "new scene" --output remixed.png
 *   npx tsx scripts/remix-character.ts batch --characters characters.json --output-dir public/assets/characters/
 *   npx tsx scripts/remix-character.ts create-preset --name "my-character" --description "..." --output character.json
 */

import OpenAI from 'openai';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

let openaiClient: OpenAI | null = null;

/**
 * Lazy-load OpenAI client only when needed
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export interface CharacterConfig {
  name: string;
  basePrompt: string;
  traits: string[];
  physicalFeatures: string[];
  style?: string;
  clothing?: string;
  negativePrompt?: string;
  referenceImages?: string[]; // Paths to reference images for consistency
}

export interface RemixOptions extends CharacterConfig {
  scenario: string;
  action?: string;
  environment?: string;
  mood?: string;
  outputPath: string;
}

export interface ImageGenerationOptions {
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  model?: 'dall-e-3' | 'dall-e-2';
}

/**
 * Build a detailed consistency prompt from character config
 *
 * This is the key to character consistency with DALL-E:
 * - Very detailed physical descriptions
 * - Consistent style keywords
 * - Specific traits and features
 */
function buildConsistencyPrompt(character: CharacterConfig, scenario?: string, action?: string): string {
  const parts: string[] = [];

  // Start with the base character description
  parts.push(character.basePrompt);

  // Add detailed physical features for consistency
  if (character.physicalFeatures.length > 0) {
    parts.push(`Physical features: ${character.physicalFeatures.join(', ')}`);
  }

  // Add personality traits (affects pose and expression)
  if (character.traits.length > 0) {
    parts.push(`Character traits: ${character.traits.join(', ')}`);
  }

  // Add clothing description
  if (character.clothing) {
    parts.push(`Wearing: ${character.clothing}`);
  }

  // Add scenario/action if provided
  if (scenario) {
    parts.push(`Scene: ${scenario}`);
  }

  if (action) {
    parts.push(`Action: ${action}`);
  }

  // Add style guidance for consistency
  const style = character.style || 'professional digital illustration';
  parts.push(`Art style: ${style}`);

  // Consistency keywords
  parts.push('Consistent character design, same character throughout, maintaining exact appearance');

  return parts.join('. ') + '.';
}

/**
 * Generate image using DALL-E with detailed prompting for consistency
 */
export async function generateCharacterImage(
  character: CharacterConfig,
  outputPath: string,
  scenario?: string,
  action?: string,
  options: Partial<ImageGenerationOptions> = {}
): Promise<string> {
  const {
    size = '1024x1024',
    quality = 'hd',
    style = 'vivid',
    model = 'dall-e-3',
  } = options;

  const prompt = buildConsistencyPrompt(character, scenario, action);

  console.log('\n========================================');
  console.log('Character Image Generation - IMG-002');
  console.log('========================================\n');
  console.log(`Character: ${character.name}`);
  console.log(`Scenario: ${scenario || 'base character'}`);
  console.log(`\nPrompt: "${prompt.substring(0, 200)}${prompt.length > 200 ? '...' : ''}"`);
  console.log(`\nSize: ${size}, Quality: ${quality}, Style: ${style}`);

  try {
    const openai = getOpenAIClient();
    const response = await openai.images.generate({
      model,
      prompt,
      n: 1,
      size,
      quality: model === 'dall-e-3' ? quality : undefined,
      style: model === 'dall-e-3' ? style : undefined,
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E');
    }

    console.log(`\n✓ Image generated successfully`);

    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Save image
    await fs.writeFile(outputPath, imageBuffer);

    console.log(`✓ Image saved to: ${outputPath}\n`);
    return outputPath;
  } catch (error) {
    console.error('\n✗ Error generating image:', error);
    throw error;
  }
}

/**
 * Remix a character with consistent traits in a new scenario
 */
export async function remixCharacter(options: RemixOptions): Promise<string> {
  const { name, scenario, action, environment, mood, outputPath, ...character } = options;

  console.log(`\nRemixing character: ${name}`);
  console.log(`New scenario: ${scenario}`);
  if (action) console.log(`Action: ${action}`);
  if (environment) console.log(`Environment: ${environment}`);
  if (mood) console.log(`Mood: ${mood}`);

  // Enhance scenario with environment and mood if provided
  let fullScenario = scenario;
  if (environment) {
    fullScenario += `, ${environment}`;
  }
  if (mood) {
    fullScenario += `, ${mood} atmosphere`;
  }

  return generateCharacterImage(character, outputPath, fullScenario, action, {
    quality: 'hd',
    style: 'vivid',
  });
}

/**
 * Save character configuration to file for reuse
 */
export async function saveCharacterConfig(
  character: CharacterConfig,
  outputPath: string
): Promise<void> {
  const characterData = JSON.stringify(character, null, 2);
  await fs.writeFile(outputPath, characterData, 'utf-8');
  console.log(`✓ Character config saved to: ${outputPath}`);
}

/**
 * Load character configuration from file
 */
export async function loadCharacterConfig(filePath: string): Promise<CharacterConfig> {
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

/**
 * Generate multiple variations of the same character in different scenarios
 */
export async function batchRemixCharacter(
  character: CharacterConfig,
  scenarios: Array<{ scenario: string; action?: string; outputName: string }>,
  outputDir: string
): Promise<string[]> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Batch Remixing Character: ${character.name}`);
  console.log(`Total scenarios: ${scenarios.length}`);
  console.log(`${'='.repeat(60)}\n`);

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  const outputPaths: string[] = [];

  for (let i = 0; i < scenarios.length; i++) {
    const { scenario, action, outputName } = scenarios[i];
    const outputPath = path.join(outputDir, outputName);

    console.log(`\n[${i + 1}/${scenarios.length}] Generating: ${outputName}`);

    try {
      const result = await generateCharacterImage(
        character,
        outputPath,
        scenario,
        action,
        { quality: 'hd' }
      );
      outputPaths.push(result);
    } catch (error) {
      console.error(`Failed to generate ${outputName}:`, error);
    }

    // Rate limiting: wait between requests
    if (i < scenarios.length - 1) {
      console.log('Waiting 3 seconds before next generation...');
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✓ Batch remix complete!`);
  console.log(`Generated ${outputPaths.length}/${scenarios.length} images`);
  console.log(`${'='.repeat(60)}\n`);

  return outputPaths;
}

/**
 * Batch generate from a characters definition file
 */
export async function batchFromFile(
  charactersFile: string,
  outputDir: string
): Promise<string[]> {
  const data = await fs.readFile(charactersFile, 'utf-8');
  const batchConfig = JSON.parse(data);

  if (!batchConfig.character || !batchConfig.scenarios) {
    throw new Error('Invalid batch config. Must contain "character" and "scenarios" fields.');
  }

  return batchRemixCharacter(batchConfig.character, batchConfig.scenarios, outputDir);
}

/**
 * Character presets for common use cases
 */
export const CHARACTER_PRESETS: Record<string, CharacterConfig> = {
  'tech-founder': {
    name: 'Tech Founder',
    basePrompt: 'A confident tech startup founder in their early 30s',
    physicalFeatures: [
      'short dark hair',
      'focused brown eyes',
      'clean-shaven face',
      'medium build',
      'approachable expression',
    ],
    traits: ['innovative', 'driven', 'charismatic', 'visionary'],
    clothing: 'modern casual business attire - dark hoodie and jeans',
    style: 'professional digital illustration, tech industry aesthetic',
  },
  'creative-director': {
    name: 'Creative Director',
    basePrompt: 'An artistic creative director in their late 20s',
    physicalFeatures: [
      'shoulder-length wavy hair',
      'expressive green eyes',
      'distinctive style',
      'slim build',
      'creative presence',
    ],
    traits: ['artistic', 'passionate', 'trendsetting', 'imaginative'],
    clothing: 'stylish creative outfit - designer shirt and statement accessories',
    style: 'vibrant artistic illustration, creative industry vibe',
  },
  'data-scientist': {
    name: 'Data Scientist',
    basePrompt: 'A focused data scientist in their mid-30s',
    physicalFeatures: [
      'neat short hair',
      'intelligent eyes behind glasses',
      'thoughtful expression',
      'average build',
      'analytical demeanor',
    ],
    traits: ['analytical', 'methodical', 'curious', 'detail-oriented'],
    clothing: 'smart casual - button-up shirt and khakis',
    style: 'clean professional illustration, tech workspace aesthetic',
  },
  'marketing-exec': {
    name: 'Marketing Executive',
    basePrompt: 'A charismatic marketing executive in their early 30s',
    physicalFeatures: [
      'stylish medium-length hair',
      'bright engaging eyes',
      'warm smile',
      'fit build',
      'energetic presence',
    ],
    traits: ['outgoing', 'strategic', 'persuasive', 'creative'],
    clothing: 'modern business attire - blazer and professional outfit',
    style: 'polished professional illustration, corporate aesthetic',
  },
  'product-designer': {
    name: 'Product Designer',
    basePrompt: 'A thoughtful product designer in their late 20s',
    physicalFeatures: [
      'casual styled hair',
      'observant eyes',
      'friendly face',
      'average build',
      'approachable demeanor',
    ],
    traits: ['empathetic', 'innovative', 'user-focused', 'collaborative'],
    clothing: 'comfortable creative wear - t-shirt and designer jeans',
    style: 'modern digital illustration, design studio aesthetic',
  },
};

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    console.log(`
Character Consistency Script - IMG-002
=========================================

Commands:
  generate          Generate a base character image
  remix             Remix character in new scenario
  batch             Batch generate character variations
  create-preset     Create a character config file
  list-presets      List available character presets
  help              Show this help message

Examples:

  # Generate base character from preset
  npx tsx scripts/remix-character.ts generate --preset tech-founder --output public/assets/characters/founder-base.png

  # Remix character in new scenario
  npx tsx scripts/remix-character.ts remix --preset tech-founder --scenario "giving presentation" --output public/assets/characters/founder-presenting.png

  # Remix from saved character config
  npx tsx scripts/remix-character.ts remix --character my-character.json --scenario "working at desk" --output character-working.png

  # Batch generate multiple scenarios
  npx tsx scripts/remix-character.ts batch --config batch-config.json --output-dir public/assets/characters/

  # Create custom character preset
  npx tsx scripts/remix-character.ts create-preset --name "My Character" --base "A description" --features "blue eyes,tall,athletic" --output my-char.json

  # List built-in presets
  npx tsx scripts/remix-character.ts list-presets
    `);
    return;
  }

  if (command === 'generate') {
    const presetIndex = args.indexOf('--preset');
    const characterIndex = args.indexOf('--character');
    const outputIndex = args.indexOf('--output');
    const scenarioIndex = args.indexOf('--scenario');

    if (outputIndex === -1) {
      console.error('Error: --output is required');
      process.exit(1);
    }

    let character: CharacterConfig;

    if (presetIndex !== -1) {
      const presetName = args[presetIndex + 1];
      character = CHARACTER_PRESETS[presetName];
      if (!character) {
        console.error(`Error: Unknown preset "${presetName}"`);
        console.error('Available presets:', Object.keys(CHARACTER_PRESETS).join(', '));
        process.exit(1);
      }
    } else if (characterIndex !== -1) {
      const characterFile = args[characterIndex + 1];
      character = await loadCharacterConfig(characterFile);
    } else {
      console.error('Error: Must specify --preset or --character');
      process.exit(1);
    }

    const outputPath = args[outputIndex + 1];
    const scenario = scenarioIndex !== -1 ? args[scenarioIndex + 1] : undefined;

    await generateCharacterImage(character, outputPath, scenario);
  } else if (command === 'remix') {
    const presetIndex = args.indexOf('--preset');
    const characterIndex = args.indexOf('--character');
    const scenarioIndex = args.indexOf('--scenario');
    const actionIndex = args.indexOf('--action');
    const environmentIndex = args.indexOf('--environment');
    const moodIndex = args.indexOf('--mood');
    const outputIndex = args.indexOf('--output');

    if (scenarioIndex === -1 || outputIndex === -1) {
      console.error('Error: --scenario and --output are required');
      process.exit(1);
    }

    let character: CharacterConfig;

    if (presetIndex !== -1) {
      const presetName = args[presetIndex + 1];
      character = CHARACTER_PRESETS[presetName];
      if (!character) {
        console.error(`Error: Unknown preset "${presetName}"`);
        console.error('Available presets:', Object.keys(CHARACTER_PRESETS).join(', '));
        process.exit(1);
      }
    } else if (characterIndex !== -1) {
      const characterFile = args[characterIndex + 1];
      character = await loadCharacterConfig(characterFile);
    } else {
      console.error('Error: Must specify --preset or --character');
      process.exit(1);
    }

    await remixCharacter({
      ...character,
      scenario: args[scenarioIndex + 1],
      action: actionIndex !== -1 ? args[actionIndex + 1] : undefined,
      environment: environmentIndex !== -1 ? args[environmentIndex + 1] : undefined,
      mood: moodIndex !== -1 ? args[moodIndex + 1] : undefined,
      outputPath: args[outputIndex + 1],
    });
  } else if (command === 'batch') {
    const configIndex = args.indexOf('--config');
    const outputDirIndex = args.indexOf('--output-dir');

    if (configIndex === -1 || outputDirIndex === -1) {
      console.error('Error: --config and --output-dir are required');
      process.exit(1);
    }

    const configFile = args[configIndex + 1];
    const outputDir = args[outputDirIndex + 1];

    await batchFromFile(configFile, outputDir);
  } else if (command === 'create-preset') {
    const nameIndex = args.indexOf('--name');
    const baseIndex = args.indexOf('--base');
    const featuresIndex = args.indexOf('--features');
    const traitsIndex = args.indexOf('--traits');
    const clothingIndex = args.indexOf('--clothing');
    const styleIndex = args.indexOf('--style');
    const outputIndex = args.indexOf('--output');

    if (nameIndex === -1 || baseIndex === -1 || featuresIndex === -1 || outputIndex === -1) {
      console.error('Error: --name, --base, --features, and --output are required');
      console.error('Example: create-preset --name "My Char" --base "A person" --features "blue eyes,tall" --output char.json');
      process.exit(1);
    }

    const character: CharacterConfig = {
      name: args[nameIndex + 1],
      basePrompt: args[baseIndex + 1],
      physicalFeatures: args[featuresIndex + 1].split(',').map(f => f.trim()),
      traits: traitsIndex !== -1 ? args[traitsIndex + 1].split(',').map(t => t.trim()) : [],
      clothing: clothingIndex !== -1 ? args[clothingIndex + 1] : undefined,
      style: styleIndex !== -1 ? args[styleIndex + 1] : 'professional digital illustration',
    };

    await saveCharacterConfig(character, args[outputIndex + 1]);
  } else if (command === 'list-presets') {
    console.log('\nAvailable Character Presets:\n');
    console.log('='.repeat(60));
    Object.entries(CHARACTER_PRESETS).forEach(([key, character]) => {
      console.log(`\n${key}`);
      console.log('  ' + '-'.repeat(key.length));
      console.log(`  Name: ${character.name}`);
      console.log(`  Base: ${character.basePrompt}`);
      console.log(`  Features: ${character.physicalFeatures.join(', ')}`);
      console.log(`  Traits: ${character.traits.join(', ')}`);
      console.log(`  Style: ${character.style}`);
    });
    console.log('\n' + '='.repeat(60) + '\n');
  } else {
    console.error(`Unknown command: ${command}`);
    console.error('Run "npx tsx scripts/remix-character.ts help" for usage information');
    process.exit(1);
  }
}

// Run CLI if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('\n✗ Error:', error.message);
    process.exit(1);
  });
}
