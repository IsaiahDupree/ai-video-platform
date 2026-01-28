#!/usr/bin/env ts-node
/**
 * LongCat Avatar Video Generator - T2V-005
 *
 * Generate audio-driven talking head videos using Modal LongCat Avatar service.
 * This script provides a convenient CLI for creating avatar videos from portrait images and audio.
 *
 * Features:
 * - Audio-driven facial animation with lip sync
 * - Natural head movements and expressions
 * - Support for various portrait styles
 * - Configurable generation parameters
 * - Batch generation support
 *
 * Usage:
 *   ts-node scripts/generate-avatar.ts --image portrait.jpg --audio narration.wav --output avatar.mp4
 *
 * Examples:
 *   # Basic generation
 *   npm run generate-avatar -- --image ref.jpg --audio voice.wav --output result.mp4
 *
 *   # Custom parameters
 *   npm run generate-avatar -- --image portrait.png --audio speech.mp3 \
 *     --steps 30 --guidance 3.5 --fps 30 --seed 42
 *
 *   # Batch generation
 *   npm run generate-avatar -- --batch-config avatars.json
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import * as url from 'url';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Avatar generation configuration
 */
interface AvatarConfig {
  referenceImage: string;
  audio: string;
  output: string;
  numInferenceSteps?: number;
  guidanceScale?: number;
  fps?: number;
  seed?: number;
}

/**
 * Avatar API response
 */
interface AvatarResponse {
  video: string; // Base64 encoded video
  fps: number;
  status: string;
}

/**
 * Parse command line arguments
 */
function parseArgs(): any {
  const args: any = {};
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = process.argv[i + 1];
      args[key] = value;
      i++;
    }
  }
  return args;
}

/**
 * Make HTTP/HTTPS request
 */
function makeRequest(
  urlString: string,
  method: string,
  data?: any
): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new url.URL(urlString);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        if (res.statusCode !== 200 && res.statusCode !== 201) {
          reject(new Error(`API error: ${res.statusCode} - ${body}`));
        } else {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * LongCat Avatar client for generating talking head videos
 */
class AvatarGenerator {
  private apiUrl: string;

  constructor(apiUrl?: string) {
    // Use environment variable or default to Modal endpoint
    this.apiUrl = apiUrl || process.env.MODAL_AVATAR_URL || '';

    if (!this.apiUrl) {
      console.warn('Warning: MODAL_AVATAR_URL not set. Please deploy the Modal service first:');
      console.warn('  modal deploy scripts/modal_longcat_avatar.py');
      console.warn('  Then set MODAL_AVATAR_URL in your .env file');
    }
  }

  /**
   * Generate avatar video from reference image and audio
   */
  async generateAvatar(config: AvatarConfig): Promise<Buffer> {
    console.log(`\nGenerating avatar video...`);
    console.log(`  Reference: ${config.referenceImage}`);
    console.log(`  Audio: ${config.audio}`);
    console.log(`  Output: ${config.output}`);

    // Read and encode image
    const imageBuffer = fs.readFileSync(config.referenceImage);
    const imageB64 = imageBuffer.toString('base64');

    // Read and encode audio
    const audioBuffer = fs.readFileSync(config.audio);
    const audioB64 = audioBuffer.toString('base64');

    // Prepare request
    const requestBody = {
      reference_image: imageB64,
      audio: audioB64,
      num_inference_steps: config.numInferenceSteps || 25,
      guidance_scale: config.guidanceScale || 3.0,
      fps: config.fps || 25,
      seed: config.seed || null,
    };

    console.log(`\nGenerating with parameters:`);
    console.log(`  Steps: ${requestBody.num_inference_steps}`);
    console.log(`  Guidance: ${requestBody.guidance_scale}`);
    console.log(`  FPS: ${requestBody.fps}`);
    if (requestBody.seed) {
      console.log(`  Seed: ${requestBody.seed}`);
    }

    try {
      // Make API request
      console.log('\nSending request to Modal...');
      const response = await makeRequest(
        this.apiUrl,
        'POST',
        requestBody
      ) as AvatarResponse;

      // Decode video
      const videoBuffer = Buffer.from(response.video, 'base64');

      console.log(`\n✓ Avatar video generated successfully`);
      console.log(`  FPS: ${response.fps}`);
      console.log(`  Size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);

      // Create output directory if it doesn't exist
      const outputDir = path.dirname(config.output);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Save video
      fs.writeFileSync(config.output, videoBuffer);
      console.log(`  Saved to: ${config.output}`);

      return videoBuffer;
    } catch (error) {
      console.error(`\n✗ Error generating avatar:`, error);
      throw error;
    }
  }

  /**
   * Generate multiple avatar videos in batch
   */
  async generateBatch(configs: AvatarConfig[]): Promise<void> {
    console.log(`\nBatch generation: ${configs.length} videos`);
    console.log('=' .repeat(60));

    const results = [];

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      console.log(`\n[${i + 1}/${configs.length}] Processing: ${config.output}`);

      try {
        await this.generateAvatar(config);
        results.push({ success: true, output: config.output });
      } catch (error) {
        console.error(`  Failed: ${error}`);
        results.push({ success: false, output: config.output, error });
      }
    }

    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('Batch Generation Summary');
    console.log('=' .repeat(60));

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`  Total: ${results.length}`);
    console.log(`  Successful: ${successful}`);
    console.log(`  Failed: ${failed}`);

    if (failed > 0) {
      console.log('\nFailed generations:');
      results
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.output}`));
    }
  }
}

/**
 * Load batch configuration from JSON file
 */
function loadBatchConfig(configPath: string): AvatarConfig[] {
  const content = fs.readFileSync(configPath, 'utf-8');
  const data = JSON.parse(content);

  if (!Array.isArray(data)) {
    throw new Error('Batch config must be an array of avatar configurations');
  }

  return data as AvatarConfig[];
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
LongCat Avatar Video Generator - T2V-005

Generate audio-driven talking head videos using Modal LongCat Avatar service.

Usage:
  npm run generate-avatar -- --image <path> --audio <path> --output <path> [options]
  npm run generate-avatar -- --batch-config <path>

Options:
  --image <path>         Reference portrait image
  --audio <path>         Audio file (WAV, MP3, etc.)
  --output <path>        Output video path
  --steps <number>       Number of inference steps (default: 25)
  --guidance <number>    Guidance scale (default: 3.0)
  --fps <number>         Output frame rate (default: 25)
  --seed <number>        Random seed for reproducibility
  --batch-config <path>  JSON config file for batch generation
  --help                 Show this help message

Examples:
  # Basic generation
  npm run generate-avatar -- --image portrait.jpg --audio narration.wav --output avatar.mp4

  # Custom parameters
  npm run generate-avatar -- --image portrait.png --audio speech.mp3 \\
    --output talking_avatar.mp4 --steps 30 --guidance 3.5 --fps 30 --seed 42

  # Batch generation
  npm run generate-avatar -- --batch-config avatars.json

  # Create example batch config
  cat > avatars.json << 'EOF'
[
  {
    "referenceImage": "public/assets/scenes/portrait1.jpg",
    "audio": "public/assets/audio/narration1.wav",
    "output": "public/assets/videos/avatar1.mp4",
    "numInferenceSteps": 25,
    "guidanceScale": 3.0,
    "fps": 25
  }
]
EOF
`);
}

/**
 * Main CLI
 */
async function main() {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    return;
  }

  const generator = new AvatarGenerator();

  // Batch generation mode
  if (args['batch-config']) {
    const configs = loadBatchConfig(args['batch-config']);
    await generator.generateBatch(configs);
    return;
  }

  // Single generation mode
  if (!args.image || !args.audio || !args.output) {
    console.error('Error: --image, --audio, and --output are required');
    console.error('Run with --help for usage information');
    process.exit(1);
  }

  const config: AvatarConfig = {
    referenceImage: args.image,
    audio: args.audio,
    output: args.output,
    numInferenceSteps: args.steps ? parseInt(args.steps) : 25,
    guidanceScale: args.guidance ? parseFloat(args.guidance) : 3.0,
    fps: args.fps ? parseInt(args.fps) : 25,
    seed: args.seed ? parseInt(args.seed) : undefined,
  };

  await generator.generateAvatar(config);
}

// Run CLI
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { AvatarGenerator, AvatarConfig, AvatarResponse };
