/**
 * ElevenLabs Reference Generation - VC-002
 * Generate voice reference audio using ElevenLabs TTS
 *
 * This script uses ElevenLabs TTS to generate high-quality reference audio
 * that can be used for voice cloning with IndexTTS or other models.
 *
 * Usage:
 *   ts-node scripts/generate-voice-with-elevenlabs.ts --text "Your text" --voice rachel --output reference.mp3
 *
 * Environment variables:
 *   ELEVENLABS_API_KEY: Your ElevenLabs API key
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as dotenv from 'dotenv';

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
  } else {
    console.log('ElevenLabs Voice Generation - VC-002');
    console.log('');
    console.log('Commands:');
    console.log('  list-voices              List all available voices');
    console.log('  generate                 Generate single audio file');
    console.log('  generate-reference       Generate reference audio for voice cloning');
    console.log('');
    console.log('Examples:');
    console.log('  ts-node scripts/generate-voice-with-elevenlabs.ts list-voices');
    console.log(
      '  ts-node scripts/generate-voice-with-elevenlabs.ts generate --text "Hello world" --voice rachel --output audio.mp3'
    );
    console.log(
      '  ts-node scripts/generate-voice-with-elevenlabs.ts generate-reference --voice rachel'
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
