/**
 * VID-005: OpenAI TTS Integration
 * Text-to-speech generation using OpenAI API
 */

import OpenAI from 'openai';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export interface TTSOptions {
  text: string;
  voice?: OpenAIVoice;
  model?: 'tts-1' | 'tts-1-hd';
  speed?: number;
  outputPath: string;
}

/**
 * Generate speech from text using OpenAI TTS
 */
export async function generateTTS(options: TTSOptions): Promise<string> {
  const {
    text,
    voice = 'alloy',
    model = 'tts-1',
    speed = 1.0,
    outputPath,
  } = options;

  console.log(`Generating TTS for text: "${text.substring(0, 50)}..."`);
  console.log(`Voice: ${voice}, Model: ${model}, Speed: ${speed}`);

  try {
    // Generate speech
    const mp3 = await openai.audio.speech.create({
      model,
      voice,
      input: text,
      speed,
    });

    // Get audio data as buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Write audio file
    await fs.writeFile(outputPath, buffer);

    console.log(`✓ TTS audio saved to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Error generating TTS:', error);
    throw error;
  }
}

/**
 * Generate TTS for all sections in a content brief
 */
export async function generateBriefAudio(
  briefPath: string,
  outputDir: string = 'public/assets/audio'
): Promise<Record<string, string>> {
  // Read brief file
  const briefContent = await fs.readFile(briefPath, 'utf-8');
  const brief = JSON.parse(briefContent);

  const audioFiles: Record<string, string> = {};

  // Get voice settings from brief
  const voice = (brief.audio?.voice || 'alloy') as OpenAIVoice;
  const speed = brief.audio?.speed || 1.0;

  console.log(`\nGenerating audio for brief: ${brief.title}`);
  console.log(`Total sections: ${brief.sections.length}\n`);

  // Generate TTS for each section with voiceover
  for (const section of brief.sections) {
    if (section.voiceover) {
      const outputPath = path.join(
        outputDir,
        `${brief.title.toLowerCase().replace(/\s+/g, '-')}-${section.id}.mp3`
      );

      await generateTTS({
        text: section.voiceover,
        voice,
        speed,
        outputPath,
      });

      audioFiles[section.id] = outputPath;
    }
  }

  console.log(`\n✓ Generated ${Object.keys(audioFiles).length} audio files`);
  return audioFiles;
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage:
  npm run generate-tts <brief-path> [output-dir]

Example:
  npm run generate-tts data/briefs/example-video.json public/assets/audio
    `);
    process.exit(1);
  }

  const briefPath = args[0];
  const outputDir = args[1] || 'public/assets/audio';

  generateBriefAudio(briefPath, outputDir)
    .then(() => {
      console.log('\n✓ TTS generation complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ TTS generation failed:', error);
      process.exit(1);
    });
}
