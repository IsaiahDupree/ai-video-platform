/**
 * Batch Voiceover Generation - VC-006
 * Generate voiceovers for multiple sections in batch
 *
 * This script reads a content brief and generates voiceovers for all sections
 * using the full voice pipeline (ElevenLabs → IndexTTS) or OpenAI TTS.
 *
 * Usage:
 *   ts-node scripts/generate-appkit-voiceover.ts --brief data/briefs/example-video.json --voice rachel --output-dir public/assets/audio
 *   ts-node scripts/generate-appkit-voiceover.ts --brief data/briefs/example-video.json --provider openai --voice alloy
 *   ts-node scripts/generate-appkit-voiceover.ts --brief data/briefs/example-video.json --provider indexed --voice rachel --reference-audio public/assets/voices/rachel-ref.mp3
 *
 * Environment variables:
 *   ELEVENLABS_API_KEY: Your ElevenLabs API key (for elevenlabs and indexed providers)
 *   MODAL_VOICE_CLONE_URL: Modal voice clone endpoint URL (for indexed provider)
 *   OPENAI_API_KEY: Your OpenAI API key (for openai provider)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { ContentBrief, Section } from '../src/types/brief';
import { VoiceCloneClient } from '../src/services/voiceClone';
import { generateSpeech, fullVoicePipeline, VOICE_PRESETS } from './generate-voice-with-elevenlabs';
import OpenAI from 'openai';

dotenv.config();

// Voice provider configuration export for external use
export const VOICE_PRESETS_EXPORT = VOICE_PRESETS;

interface VoiceoverSection {
  id: string;
  text: string;
  index: number;
}

interface GenerationOptions {
  briefPath: string;
  provider: 'openai' | 'elevenlabs' | 'indexed';
  voice: string;
  outputDir?: string;
  referenceAudio?: string;
  speed?: number;
  temperature?: number;
  overwrite?: boolean;
}

interface GenerationResult {
  sectionId: string;
  outputPath: string;
  success: boolean;
  error?: string;
}

/**
 * Load and validate content brief
 */
function loadBrief(briefPath: string): ContentBrief {
  if (!fs.existsSync(briefPath)) {
    throw new Error(`Brief file not found: ${briefPath}`);
  }

  const briefContent = fs.readFileSync(briefPath, 'utf-8');
  const brief: ContentBrief = JSON.parse(briefContent);

  if (!brief.sections || !Array.isArray(brief.sections)) {
    throw new Error('Invalid brief: sections array is required');
  }

  return brief;
}

/**
 * Extract voiceover sections from brief
 */
function extractVoiceoverSections(brief: ContentBrief): VoiceoverSection[] {
  const sections: VoiceoverSection[] = [];

  brief.sections.forEach((section, index) => {
    if (section.voiceover && section.voiceover.trim().length > 0) {
      sections.push({
        id: section.id,
        text: section.voiceover,
        index: index,
      });
    }
  });

  return sections;
}

/**
 * Generate voiceover using OpenAI TTS
 */
async function generateWithOpenAI(
  text: string,
  voice: string,
  outputPath: string,
  speed: number = 1.0
): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const openai = new OpenAI({ apiKey });

  console.log(`  Generating with OpenAI TTS (voice: ${voice})...`);

  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice: voice as any,
    input: text,
    speed: speed,
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, buffer);
}

/**
 * Generate voiceover using ElevenLabs
 */
async function generateWithElevenLabs(
  text: string,
  voice: string,
  outputPath: string
): Promise<void> {
  console.log(`  Generating with ElevenLabs (voice: ${voice})...`);

  const voiceId = VOICE_PRESETS[voice.toLowerCase()] || voice;

  const audioBuffer = await generateSpeech({
    text,
    voiceId,
    stability: 0.5,
    similarityBoost: 0.75,
  });

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, audioBuffer);
}

/**
 * Generate voiceover using IndexTTS (Modal voice cloning)
 */
async function generateWithIndexed(
  text: string,
  voice: string,
  referenceAudio: string,
  outputPath: string,
  options: {
    speed?: number;
    temperature?: number;
  } = {}
): Promise<void> {
  console.log(`  Generating with IndexTTS voice cloning (reference: ${path.basename(referenceAudio)})...`);

  const client = new VoiceCloneClient();

  await client.cloneVoiceToFile(
    {
      text,
      referenceAudio,
      speakerName: voice,
      speed: options.speed || 1.0,
      temperature: options.temperature || 0.7,
    },
    outputPath
  );
}

/**
 * Generate voiceover using full pipeline (ElevenLabs → IndexTTS)
 */
async function generateWithFullPipeline(
  text: string,
  voice: string,
  outputPath: string,
  options: {
    speed?: number;
    temperature?: number;
  } = {}
): Promise<void> {
  console.log(`  Generating with full pipeline (ElevenLabs → IndexTTS)...`);

  await fullVoicePipeline(text, voice, outputPath, {
    speed: options.speed,
    temperature: options.temperature,
    keepReference: false,
  });
}

/**
 * Generate all voiceovers for a content brief
 */
export async function generateBatchVoiceovers(
  options: GenerationOptions
): Promise<GenerationResult[]> {
  console.log('Batch Voiceover Generation - VC-006');
  console.log('====================================\n');

  // Load brief
  console.log(`Loading brief: ${options.briefPath}`);
  const brief = loadBrief(options.briefPath);
  console.log(`✓ Loaded brief: "${brief.title}"`);

  // Extract voiceover sections
  const sections = extractVoiceoverSections(brief);
  console.log(`✓ Found ${sections.length} sections with voiceovers\n`);

  if (sections.length === 0) {
    console.log('⚠ No sections with voiceover text found in brief');
    return [];
  }

  // Determine output directory
  const outputDir =
    options.outputDir ||
    path.join('public', 'assets', 'audio', path.basename(options.briefPath, '.json'));

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Output directory: ${outputDir}`);
  console.log(`Provider: ${options.provider}`);
  console.log(`Voice: ${options.voice}\n`);

  // Generate voiceovers
  const results: GenerationResult[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    console.log(`[${i + 1}/${sections.length}] Section: ${section.id}`);
    console.log(`  Text: "${section.text.substring(0, 60)}${section.text.length > 60 ? '...' : ''}"`);

    // Determine file extension based on provider
    const extension = options.provider === 'openai' ? 'mp3' : options.provider === 'elevenlabs' ? 'mp3' : 'wav';
    const outputPath = path.join(outputDir, `${section.id}.${extension}`);

    // Check if file exists and skip if not overwriting
    if (fs.existsSync(outputPath) && !options.overwrite) {
      console.log(`  ⏭ Skipping (file exists): ${outputPath}\n`);
      results.push({
        sectionId: section.id,
        outputPath,
        success: true,
      });
      continue;
    }

    try {
      // Generate based on provider
      if (options.provider === 'openai') {
        await generateWithOpenAI(section.text, options.voice, outputPath, options.speed);
      } else if (options.provider === 'elevenlabs') {
        await generateWithElevenLabs(section.text, options.voice, outputPath);
      } else if (options.provider === 'indexed') {
        if (options.referenceAudio) {
          // Use provided reference audio
          await generateWithIndexed(section.text, options.voice, options.referenceAudio, outputPath, {
            speed: options.speed,
            temperature: options.temperature,
          });
        } else {
          // Use full pipeline (ElevenLabs → IndexTTS)
          await generateWithFullPipeline(section.text, options.voice, outputPath, {
            speed: options.speed,
            temperature: options.temperature,
          });
        }
      }

      console.log(`  ✓ Generated: ${outputPath}`);

      // Get file size
      const stats = fs.statSync(outputPath);
      console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB\n`);

      results.push({
        sectionId: section.id,
        outputPath,
        success: true,
      });

      // Rate limiting: wait 1 second between requests (except for last one)
      if (i < sections.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`  ✗ Error: ${errorMessage}\n`);

      results.push({
        sectionId: section.id,
        outputPath,
        success: false,
        error: errorMessage,
      });
    }
  }

  // Print summary
  console.log('====================================');
  console.log('Summary:');
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(`  Total sections: ${sections.length}`);
  console.log(`  Successful: ${successful}`);
  console.log(`  Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed sections:');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.sectionId}: ${r.error}`);
      });
  }

  console.log(`\nAll voiceovers saved to: ${outputDir}\n`);

  return results;
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  const briefIndex = args.indexOf('--brief');
  const providerIndex = args.indexOf('--provider');
  const voiceIndex = args.indexOf('--voice');
  const outputDirIndex = args.indexOf('--output-dir');
  const referenceAudioIndex = args.indexOf('--reference-audio');
  const speedIndex = args.indexOf('--speed');
  const temperatureIndex = args.indexOf('--temperature');
  const overwriteIndex = args.indexOf('--overwrite');
  const helpIndex = args.indexOf('--help');

  if (helpIndex !== -1 || briefIndex === -1) {
    console.log('Batch Voiceover Generation - VC-006');
    console.log('');
    console.log('Generate voiceovers for all sections in a content brief');
    console.log('');
    console.log('Usage:');
    console.log('  ts-node scripts/generate-appkit-voiceover.ts --brief <path> [options]');
    console.log('');
    console.log('Required:');
    console.log('  --brief <path>              Path to content brief JSON file');
    console.log('');
    console.log('Options:');
    console.log('  --provider <name>           Voice provider: openai, elevenlabs, indexed (default: openai)');
    console.log('  --voice <name>              Voice name or ID');
    console.log('  --output-dir <path>         Output directory (default: public/assets/audio/<brief-name>)');
    console.log('  --reference-audio <path>    Reference audio for indexed provider');
    console.log('  --speed <number>            Speech speed multiplier (default: 1.0)');
    console.log('  --temperature <number>      Sampling temperature for indexed (default: 0.7)');
    console.log('  --overwrite                 Overwrite existing audio files');
    console.log('  --help                      Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('');
    console.log('  # Generate with OpenAI TTS (default)');
    console.log('  ts-node scripts/generate-appkit-voiceover.ts --brief data/briefs/example-video.json --voice alloy');
    console.log('');
    console.log('  # Generate with ElevenLabs');
    console.log('  ts-node scripts/generate-appkit-voiceover.ts --brief data/briefs/example-video.json --provider elevenlabs --voice rachel');
    console.log('');
    console.log('  # Generate with IndexTTS using reference audio');
    console.log('  ts-node scripts/generate-appkit-voiceover.ts --brief data/briefs/example-video.json --provider indexed --voice rachel --reference-audio public/assets/voices/rachel-ref.mp3');
    console.log('');
    console.log('  # Generate with full pipeline (ElevenLabs → IndexTTS)');
    console.log('  ts-node scripts/generate-appkit-voiceover.ts --brief data/briefs/example-video.json --provider indexed --voice rachel');
    console.log('');
    console.log('  # Custom output directory and overwrite');
    console.log('  ts-node scripts/generate-appkit-voiceover.ts --brief data/briefs/example-video.json --voice alloy --output-dir custom/path --overwrite');
    process.exit(0);
  }

  const briefPath = args[briefIndex + 1];
  const provider = (providerIndex !== -1 ? args[providerIndex + 1] : 'openai') as
    | 'openai'
    | 'elevenlabs'
    | 'indexed';
  const voice = voiceIndex !== -1 ? args[voiceIndex + 1] : 'alloy';
  const outputDir = outputDirIndex !== -1 ? args[outputDirIndex + 1] : undefined;
  const referenceAudio = referenceAudioIndex !== -1 ? args[referenceAudioIndex + 1] : undefined;
  const speed = speedIndex !== -1 ? parseFloat(args[speedIndex + 1]) : undefined;
  const temperature = temperatureIndex !== -1 ? parseFloat(args[temperatureIndex + 1]) : undefined;
  const overwrite = overwriteIndex !== -1;

  try {
    const results = await generateBatchVoiceovers({
      briefPath,
      provider,
      voice,
      outputDir,
      referenceAudio,
      speed,
      temperature,
      overwrite,
    });

    const failed = results.filter((r) => !r.success).length;
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\nError:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run CLI if executed directly
if (require.main === module) {
  main();
}
