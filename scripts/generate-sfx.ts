/**
 * ElevenLabs Sound Effects Integration - VC-007
 *
 * Generate sound effects using ElevenLabs Sound Generation API.
 *
 * This script supports:
 * 1. Generating sound effects from text descriptions
 * 2. Customizing duration and prompt influence
 * 3. Batch generation of multiple sound effects
 *
 * Usage:
 *   ts-node scripts/generate-sfx.ts generate --prompt "doorbell ringing" --output doorbell.mp3
 *   ts-node scripts/generate-sfx.ts generate --prompt "ocean waves" --duration 5.0 --output ocean.mp3
 *   ts-node scripts/generate-sfx.ts batch --prompts-file prompts.json --output-dir sfx/
 *
 * Environment variables:
 *   ELEVENLABS_API_KEY: Your ElevenLabs API key
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as dotenv from 'dotenv';

dotenv.config();

interface SoundGenerationOptions {
  prompt: string;
  durationSeconds?: number;
  promptInfluence?: number;
}

interface BatchSoundRequest {
  prompt: string;
  outputFileName: string;
  durationSeconds?: number;
}

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
        if (res.statusCode !== 200) {
          let errorBody = '';
          res.on('data', (chunk) => {
            errorBody += chunk;
          });
          res.on('end', () => {
            reject(new Error(`API error: ${res.statusCode} - ${errorBody}`));
          });
        } else {
          resolve(res);
        }
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
 * Generate sound effect using ElevenLabs Sound Generation API
 *
 * API Endpoint: POST /v1/sound-generation
 *
 * @param options - Sound generation options
 * @returns Buffer containing the generated audio (MP3 format)
 */
export async function generateSoundEffect(options: SoundGenerationOptions): Promise<Buffer> {
  const {
    prompt,
    durationSeconds = 3.0, // Default 3 seconds
    promptInfluence = 0.3,  // Default prompt influence
  } = options;

  console.log(`Generating sound effect: "${prompt}"`);
  console.log(`Duration: ${durationSeconds}s, Prompt influence: ${promptInfluence}`);

  const apiPath = '/v1/sound-generation';
  const requestData = {
    text: prompt,
    duration_seconds: durationSeconds,
    prompt_influence: promptInfluence,
  };

  try {
    const stream = await makeRequest('POST', apiPath, requestData, true);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on('end', () => {
        const audioBuffer = Buffer.concat(chunks);
        console.log(`✓ Generated sound effect: ${(audioBuffer.length / 1024).toFixed(2)} KB`);
        resolve(audioBuffer);
      });

      stream.on('error', reject);
    });
  } catch (error) {
    console.error(`Failed to generate sound effect for prompt: "${prompt}"`);
    throw error;
  }
}

/**
 * Save sound effect to file
 */
export async function saveSoundEffect(
  prompt: string,
  outputPath: string,
  options: Omit<SoundGenerationOptions, 'prompt'> = {}
): Promise<string> {
  const audioBuffer = await generateSoundEffect({ prompt, ...options });

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, audioBuffer);
  console.log(`✓ Saved to: ${outputPath}`);

  return outputPath;
}

/**
 * Generate multiple sound effects from a batch request
 *
 * @param requests - Array of sound generation requests
 * @param outputDir - Directory to save generated files
 * @param delayMs - Delay between requests in milliseconds (rate limiting)
 */
export async function generateBatch(
  requests: BatchSoundRequest[],
  outputDir: string,
  delayMs: number = 1000
): Promise<string[]> {
  console.log(`\nGenerating ${requests.length} sound effects...`);
  console.log(`Output directory: ${outputDir}\n`);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPaths: string[] = [];

  for (let i = 0; i < requests.length; i++) {
    const request = requests[i];
    const outputPath = path.join(outputDir, request.outputFileName);

    console.log(`[${i + 1}/${requests.length}] "${request.prompt}"`);

    try {
      await saveSoundEffect(request.prompt, outputPath, {
        durationSeconds: request.durationSeconds,
      });
      outputPaths.push(outputPath);
    } catch (error) {
      console.error(`✗ Failed to generate: ${error instanceof Error ? error.message : error}`);
    }

    // Rate limiting: wait between requests
    if (i < requests.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  console.log(`\n✓ Batch generation complete!`);
  console.log(`Generated ${outputPaths.length}/${requests.length} sound effects`);

  return outputPaths;
}

/**
 * Common sound effect presets
 */
export const SFX_PRESETS: Record<string, string> = {
  doorbell: 'doorbell ringing, clear and sharp',
  notification: 'pleasant notification sound, short ping',
  success: 'success sound, positive chime',
  error: 'error sound, warning beep',
  click: 'mouse click sound, crisp',
  whoosh: 'whoosh sound effect, air movement',
  transition: 'smooth transition sound, swoosh',
  applause: 'audience applause, clapping',
  typing: 'keyboard typing sounds',
  camera: 'camera shutter click',
  pop: 'bubble pop sound',
  ding: 'bell ding sound',
  coin: 'coin collection sound',
  footsteps: 'footsteps walking on hard floor',
  rain: 'gentle rain falling',
  thunder: 'thunder rumble',
  wind: 'wind blowing sound',
  water: 'water flowing',
  fire: 'crackling fire',
  explosion: 'small explosion sound',
};

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'generate') {
    const promptIndex = args.indexOf('--prompt');
    const outputIndex = args.indexOf('--output');
    const durationIndex = args.indexOf('--duration');
    const influenceIndex = args.indexOf('--influence');
    const presetIndex = args.indexOf('--preset');

    let prompt: string | undefined;

    // Check if using preset or custom prompt
    if (presetIndex !== -1) {
      const presetName = args[presetIndex + 1];
      prompt = SFX_PRESETS[presetName.toLowerCase()];
      if (!prompt) {
        console.error(`Unknown preset: ${presetName}`);
        console.error('Available presets:', Object.keys(SFX_PRESETS).join(', '));
        process.exit(1);
      }
      console.log(`Using preset "${presetName}": ${prompt}`);
    } else if (promptIndex !== -1) {
      prompt = args[promptIndex + 1];
    }

    if (!prompt || outputIndex === -1) {
      console.error('Usage: generate --prompt "sound description" --output output.mp3');
      console.error('   or: generate --preset doorbell --output output.mp3');
      console.error('');
      console.error('Options:');
      console.error('  --duration N    Duration in seconds (default: 3.0)');
      console.error('  --influence N   Prompt influence 0-1 (default: 0.3)');
      process.exit(1);
    }

    const outputPath = args[outputIndex + 1];
    const duration = durationIndex !== -1 ? parseFloat(args[durationIndex + 1]) : undefined;
    const influence = influenceIndex !== -1 ? parseFloat(args[influenceIndex + 1]) : undefined;

    await saveSoundEffect(prompt, outputPath, {
      durationSeconds: duration,
      promptInfluence: influence,
    });

    console.log('\n✓ Sound effect generation complete!');
  } else if (command === 'batch') {
    const promptsFileIndex = args.indexOf('--prompts-file');
    const outputDirIndex = args.indexOf('--output-dir');

    if (promptsFileIndex === -1 || outputDirIndex === -1) {
      console.error('Usage: batch --prompts-file prompts.json --output-dir sfx/');
      console.error('');
      console.error('prompts.json format:');
      console.error('[');
      console.error('  {');
      console.error('    "prompt": "doorbell ringing",');
      console.error('    "outputFileName": "doorbell.mp3",');
      console.error('    "durationSeconds": 2.0');
      console.error('  }');
      console.error(']');
      process.exit(1);
    }

    const promptsFile = args[promptsFileIndex + 1];
    const outputDir = args[outputDirIndex + 1];

    if (!fs.existsSync(promptsFile)) {
      console.error(`Prompts file not found: ${promptsFile}`);
      process.exit(1);
    }

    const requests: BatchSoundRequest[] = JSON.parse(fs.readFileSync(promptsFile, 'utf-8'));
    await generateBatch(requests, outputDir);
  } else if (command === 'presets') {
    console.log('Available sound effect presets:\n');
    Object.entries(SFX_PRESETS).forEach(([name, description]) => {
      console.log(`  ${name.padEnd(15)} ${description}`);
    });
    console.log('\nUsage:');
    console.log('  ts-node scripts/generate-sfx.ts generate --preset doorbell --output doorbell.mp3');
  } else {
    console.log('ElevenLabs Sound Effects Generation - VC-007');
    console.log('');
    console.log('Commands:');
    console.log('  generate     Generate a single sound effect');
    console.log('  batch        Generate multiple sound effects from a JSON file');
    console.log('  presets      List available sound effect presets');
    console.log('');
    console.log('Examples:');
    console.log('');
    console.log('  # Generate custom sound effect');
    console.log(
      '  ts-node scripts/generate-sfx.ts generate --prompt "doorbell ringing" --output doorbell.mp3'
    );
    console.log('');
    console.log('  # Generate with custom duration');
    console.log(
      '  ts-node scripts/generate-sfx.ts generate --prompt "ocean waves" --duration 5.0 --output ocean.mp3'
    );
    console.log('');
    console.log('  # Use a preset');
    console.log('  ts-node scripts/generate-sfx.ts generate --preset doorbell --output doorbell.mp3');
    console.log('');
    console.log('  # Generate batch');
    console.log('  ts-node scripts/generate-sfx.ts batch --prompts-file prompts.json --output-dir public/assets/sfx/');
    console.log('');
    console.log('  # List presets');
    console.log('  ts-node scripts/generate-sfx.ts presets');
  }
}

// Run CLI if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}
