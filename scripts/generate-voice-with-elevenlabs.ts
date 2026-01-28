/**
 * ElevenLabs Reference Generation - VC-002
 * Full Voice Pipeline - VC-004
 *
 * Generate voice reference audio using ElevenLabs TTS and optionally
 * clone voices using the Modal IndexTTS service.
 *
 * This script supports:
 * 1. Generating reference audio with ElevenLabs (VC-002)
 * 2. Full pipeline: ElevenLabs reference → IndexTTS clone → output (VC-004)
 *
 * Usage:
 *   ts-node scripts/generate-voice-with-elevenlabs.ts generate --text "Your text" --voice rachel --output audio.mp3
 *   ts-node scripts/generate-voice-with-elevenlabs.ts clone --text "Clone this" --voice rachel --output cloned.wav
 *
 * Environment variables:
 *   ELEVENLABS_API_KEY: Your ElevenLabs API key
 *   MODAL_VOICE_CLONE_URL: Modal voice clone endpoint URL (for clone command)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as dotenv from 'dotenv';
import { VoiceCloneClient } from '../src/services/voiceClone';

dotenv.config();

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
}

interface GenerateOptions {
  text: string;
  voiceId: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

/**
 * Popular ElevenLabs voice IDs
 * Get full list at: https://api.elevenlabs.io/v1/voices
 */
const VOICE_PRESETS: Record<string, string> = {
  rachel: '21m00Tcm4TlvDq8ikWAM',
  domi: 'AZnzlk1XvdvUeBnXmlld',
  bella: 'EXAVITQu4vr4xnSDxMaL',
  antoni: 'ErXwobaYiN019PkySvjV',
  elli: 'MF3mGyEYCl7XYWbV9V6O',
  josh: 'TxGEqnHWrfWFTfGW9XjX',
  arnold: 'VR6AewLTigWG4xSOukaG',
  adam: 'pNInz6obpgDQGcFmaJgB',
  sam: 'yoZ06aMxZJJ28mfd3POQ',
};

/**
 * Get ElevenLabs API key from environment
 */
function getApiKey(): string {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY environment variable is required');
  }
  return apiKey;
}

/**
 * Make HTTPS request to ElevenLabs API
 */
function makeRequest(
  method: string,
  apiPath: string,
  data?: any,
  isStream: boolean = false
): Promise<any> {
  return new Promise((resolve, reject) => {
    const apiKey = getApiKey();

    const options: https.RequestOptions = {
      hostname: 'api.elevenlabs.io',
      path: apiPath,
      method: method,
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      if (isStream) {
        // For audio streaming, return the response stream
        resolve(res);
      } else {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`API error: ${res.statusCode} - ${body}`));
          } else {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              resolve(body);
            }
          }
        });
      }
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * List available voices
 */
export async function listVoices(): Promise<ElevenLabsVoice[]> {
  const response = await makeRequest('GET', '/v1/voices');
  return response.voices || [];
}

/**
 * Generate speech using ElevenLabs TTS
 */
export async function generateSpeech(options: GenerateOptions): Promise<Buffer> {
  const {
    text,
    voiceId,
    modelId = 'eleven_turbo_v2_5', // Fast, high-quality model
    stability = 0.5,
    similarityBoost = 0.75,
    style = 0.0,
    useSpeakerBoost = true,
  } = options;

  console.log(`Generating speech with voice: ${voiceId}`);
  console.log(`Text length: ${text.length} characters`);

  const apiPath = `/v1/text-to-speech/${voiceId}`;
  const requestData = {
    text,
    model_id: modelId,
    voice_settings: {
      stability,
      similarity_boost: similarityBoost,
      style,
      use_speaker_boost: useSpeakerBoost,
    },
  };

  const stream = await makeRequest('POST', apiPath, requestData, true);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    stream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    stream.on('end', () => {
      const audioBuffer = Buffer.concat(chunks);
      console.log(`Generated audio size: ${(audioBuffer.length / 1024).toFixed(2)} KB`);
      resolve(audioBuffer);
    });

    stream.on('error', reject);
  });
}

/**
 * Generate reference audio for voice cloning
 * Creates multiple variations with different texts for better cloning results
 */
export async function generateReferenceAudio(
  voiceName: string,
  texts: string[],
  outputDir: string
): Promise<string[]> {
  const voiceId = VOICE_PRESETS[voiceName.toLowerCase()] || voiceName;

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Generating ${texts.length} reference audio files for voice: ${voiceName}`);

  const outputPaths: string[] = [];

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    const outputPath = path.join(outputDir, `${voiceName}-ref-${i + 1}.mp3`);

    console.log(`\n[${i + 1}/${texts.length}] Generating: ${text.substring(0, 50)}...`);

    const audioBuffer = await generateSpeech({
      text,
      voiceId,
      stability: 0.6, // Slightly higher stability for reference audio
      similarityBoost: 0.8,
    });

    fs.writeFileSync(outputPath, audioBuffer);
    console.log(`✓ Saved to: ${outputPath}`);

    outputPaths.push(outputPath);

    // Rate limiting: wait 1 second between requests
    if (i < texts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return outputPaths;
}

/**
 * Default reference texts for voice cloning
 * These provide good phonetic coverage
 */
const DEFAULT_REFERENCE_TEXTS = [
  'The quick brown fox jumps over the lazy dog near the riverbank.',
  'She sells seashells by the seashore while watching the sunset.',
  'How much wood would a woodchuck chuck if a woodchuck could chuck wood?',
  'Peter Piper picked a peck of pickled peppers from the garden.',
  'Around the rugged rocks, the ragged rascal ran through the meadow.',
];

/**
 * Full voice cloning pipeline - VC-004
 *
 * This function implements the complete pipeline:
 * 1. Generate reference audio using ElevenLabs TTS
 * 2. Use that reference to clone a voice via Modal IndexTTS
 * 3. Output the final cloned audio
 *
 * @param text - Text to synthesize with cloned voice
 * @param voiceName - ElevenLabs voice name or ID
 * @param outputPath - Path for final cloned audio
 * @param options - Additional options
 */
export async function fullVoicePipeline(
  text: string,
  voiceName: string,
  outputPath: string,
  options: {
    referenceText?: string;
    speed?: number;
    temperature?: number;
    keepReference?: boolean;
  } = {}
): Promise<string> {
  const {
    referenceText = 'The quick brown fox jumps over the lazy dog near the riverbank.',
    speed = 1.0,
    temperature = 0.7,
    keepReference = false,
  } = options;

  console.log('Full Voice Cloning Pipeline - VC-004');
  console.log('=====================================\n');

  // Step 1: Generate reference audio with ElevenLabs
  console.log('Step 1: Generating reference audio with ElevenLabs...');
  const voiceId = VOICE_PRESETS[voiceName.toLowerCase()] || voiceName;

  const referenceBuffer = await generateSpeech({
    text: referenceText,
    voiceId,
    stability: 0.6,
    similarityBoost: 0.8,
  });

  // Save reference audio temporarily
  const tempDir = path.join(__dirname, '../public/assets/temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const referencePath = path.join(tempDir, `reference-${Date.now()}.mp3`);
  fs.writeFileSync(referencePath, referenceBuffer);
  console.log(`✓ Reference audio saved: ${referencePath}`);
  console.log(`  Size: ${(referenceBuffer.length / 1024).toFixed(2)} KB\n`);

  // Step 2: Clone voice using Modal IndexTTS
  console.log('Step 2: Cloning voice with IndexTTS (Modal)...');
  console.log(`  Target text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

  const client = new VoiceCloneClient();

  try {
    await client.cloneVoiceToFile(
      {
        text,
        referenceAudio: referencePath,
        speakerName: voiceName,
        speed,
        temperature,
      },
      outputPath
    );

    console.log(`✓ Voice cloned successfully!`);
    console.log(`  Output: ${outputPath}\n`);

    // Clean up reference file unless keeping it
    if (!keepReference) {
      fs.unlinkSync(referencePath);
      console.log('✓ Cleaned up temporary reference file');
    } else {
      console.log(`✓ Reference file kept at: ${referencePath}`);
    }

    console.log('\n=====================================');
    console.log('Pipeline complete!');

    return outputPath;
  } catch (error) {
    // Clean up on error
    if (fs.existsSync(referencePath)) {
      fs.unlinkSync(referencePath);
    }
    throw error;
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'list-voices') {
    console.log('Fetching available voices...\n');
    const voices = await listVoices();

    console.log('Available voices:');
    voices.forEach((voice) => {
      console.log(`  ${voice.name} (${voice.voice_id})`);
      if (voice.description) {
        console.log(`    ${voice.description}`);
      }
    });

    console.log('\nPreset voice shortcuts:');
    Object.entries(VOICE_PRESETS).forEach(([name, id]) => {
      console.log(`  ${name}: ${id}`);
    });
  } else if (command === 'generate') {
    const textIndex = args.indexOf('--text');
    const voiceIndex = args.indexOf('--voice');
    const outputIndex = args.indexOf('--output');

    if (textIndex === -1 || voiceIndex === -1 || outputIndex === -1) {
      console.error('Usage: generate --text "Your text" --voice rachel --output output.mp3');
      process.exit(1);
    }

    const text = args[textIndex + 1];
    const voiceName = args[voiceIndex + 1];
    const outputPath = args[outputIndex + 1];

    const voiceId = VOICE_PRESETS[voiceName.toLowerCase()] || voiceName;

    const audioBuffer = await generateSpeech({ text, voiceId });

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, audioBuffer);
    console.log(`\n✓ Audio saved to: ${outputPath}`);
  } else if (command === 'generate-reference') {
    const voiceIndex = args.indexOf('--voice');
    const outputIndex = args.indexOf('--output-dir');

    if (voiceIndex === -1) {
      console.error('Usage: generate-reference --voice rachel [--output-dir path/to/output]');
      process.exit(1);
    }

    const voiceName = args[voiceIndex + 1];
    const outputDir =
      outputIndex !== -1 ? args[outputIndex + 1] : path.join('public', 'assets', 'voices');

    const paths = await generateReferenceAudio(voiceName, DEFAULT_REFERENCE_TEXTS, outputDir);

    console.log('\n✓ Reference audio generation complete!');
    console.log(`Generated ${paths.length} files in: ${outputDir}`);
    console.log('\nThese files can now be used as reference audio for voice cloning.');
  } else if (command === 'clone') {
    // Full voice pipeline: ElevenLabs → IndexTTS → Output
    const textIndex = args.indexOf('--text');
    const voiceIndex = args.indexOf('--voice');
    const outputIndex = args.indexOf('--output');
    const refTextIndex = args.indexOf('--reference-text');
    const speedIndex = args.indexOf('--speed');
    const keepRefIndex = args.indexOf('--keep-reference');

    if (textIndex === -1 || voiceIndex === -1 || outputIndex === -1) {
      console.error(
        'Usage: clone --text "Text to clone" --voice rachel --output cloned.wav [--reference-text "Text"] [--speed 1.0] [--keep-reference]'
      );
      process.exit(1);
    }

    const text = args[textIndex + 1];
    const voiceName = args[voiceIndex + 1];
    const outputPath = args[outputIndex + 1];
    const referenceText = refTextIndex !== -1 ? args[refTextIndex + 1] : undefined;
    const speed = speedIndex !== -1 ? parseFloat(args[speedIndex + 1]) : undefined;
    const keepReference = keepRefIndex !== -1;

    await fullVoicePipeline(text, voiceName, outputPath, {
      referenceText,
      speed,
      keepReference,
    });
  } else {
    console.log('ElevenLabs Voice Generation & Full Voice Pipeline');
    console.log('VC-002: ElevenLabs Reference Generation');
    console.log('VC-004: Full Voice Pipeline');
    console.log('');
    console.log('Commands:');
    console.log('  list-voices              List all available voices');
    console.log('  generate                 Generate single audio file with ElevenLabs');
    console.log('  generate-reference       Generate reference audio for voice cloning');
    console.log('  clone                    Full pipeline: ElevenLabs → IndexTTS clone → output');
    console.log('');
    console.log('Examples:');
    console.log('  # List voices');
    console.log('  ts-node scripts/generate-voice-with-elevenlabs.ts list-voices');
    console.log('');
    console.log('  # Generate with ElevenLabs only');
    console.log(
      '  ts-node scripts/generate-voice-with-elevenlabs.ts generate --text "Hello world" --voice rachel --output audio.mp3'
    );
    console.log('');
    console.log('  # Generate reference audio');
    console.log(
      '  ts-node scripts/generate-voice-with-elevenlabs.ts generate-reference --voice rachel'
    );
    console.log('');
    console.log('  # Full pipeline (ElevenLabs + IndexTTS)');
    console.log(
      '  ts-node scripts/generate-voice-with-elevenlabs.ts clone --text "Your text here" --voice rachel --output cloned.wav'
    );
    console.log('');
    console.log('  # Full pipeline with custom reference text and speed');
    console.log(
      '  ts-node scripts/generate-voice-with-elevenlabs.ts clone --text "Target text" --voice josh --reference-text "Reference phrase" --speed 1.2 --output cloned.wav'
    );
  }
}

// Run CLI if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}
