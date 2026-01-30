// =============================================================================
// Mochi Photorealistic Text-to-Video Client
// Generate photorealistic videos using Genmo's Mochi model on Modal
// =============================================================================

import * as fs from 'fs';
import * as path from 'path';

/**
 * Mochi generation settings
 */
export interface MochiSettings {
  width?: number;              // Default: 1024
  height?: number;             // Default: 576 (16:9)
  durationSeconds?: number;    // Default: 6
  fps?: number;                // Default: 25
  numInferenceSteps?: number;  // Default: 60 (higher = better quality, slower)
  guidanceScale?: number;      // Default: 7.5 (how much to follow prompt)
  seed?: number;               // Optional: for reproducibility
}

/**
 * Mochi generation request
 */
export interface MochiGenerateRequest {
  prompt: string;              // Text description of desired video
  negativeprompt?: string;     // What to avoid
  settings?: MochiSettings;
}

/**
 * Mochi generation response
 */
export interface MochiGenerateResponse {
  videoBase64: string;         // Base64-encoded MP4 video
  videoPath?: string;          // Local file path if saved
  duration: number;            // Duration in seconds
  resolution: string;          // e.g., "1024x576"
  fps: number;
  generationTime: number;      // Time spent generating (seconds)
  metadata?: {
    model: string;
    prompt: string;
    negativeprompt?: string;
    guidanceScale: number;
    numInferenceSteps: number;
    seed?: number;
  };
}

/**
 * Mochi API response from Modal endpoint
 */
interface MochiAPIResponse {
  status: string;
  video_base64: string;
  duration: number;
  resolution: string;
  fps: number;
  generation_time: number;
  metadata?: Record<string, unknown>;
}

/**
 * MochiClient - Photorealistic video generation
 *
 * Usage:
 * ```typescript
 * const client = new MochiClient(
 *   'https://your-username--mochi-video-api-generate.modal.run'
 * );
 *
 * const result = await client.generateVideo({
 *   prompt: 'A serene mountain landscape with snow at sunset',
 *   settings: {
 *     durationSeconds: 6,
 *     width: 1024,
 *     height: 576,
 *     numInferenceSteps: 60,
 *   }
 * });
 *
 * // Save to file
 * fs.writeFileSync('output.mp4', Buffer.from(result.videoBase64, 'base64'));
 * ```
 */
export class MochiClient {
  private modalApiUrl: string;
  private apiKey?: string;

  constructor(
    modalApiUrl?: string,
    apiKey?: string
  ) {
    this.modalApiUrl = modalApiUrl || process.env.MOCHI_API_URL || '';
    this.apiKey = apiKey || process.env.MOCHI_API_KEY;

    if (!this.modalApiUrl) {
      throw new Error(
        'Mochi API URL required. Provide as constructor arg or MOCHI_API_URL env var'
      );
    }
  }

  /**
   * Generate video from text prompt
   */
  async generateVideo(options: MochiGenerateRequest): Promise<MochiGenerateResponse> {
    if (!options.prompt) {
      throw new Error('prompt is required');
    }

    const payload = {
      prompt: options.prompt,
      negative_prompt: options.negativeprompt || 'blurry, low quality, distorted, ugly',
      settings: {
        width: options.settings?.width ?? 1024,
        height: options.settings?.height ?? 576,
        duration_seconds: options.settings?.durationSeconds ?? 6,
        fps: options.settings?.fps ?? 25,
        num_inference_steps: options.settings?.numInferenceSteps ?? 60,
        guidance_scale: options.settings?.guidanceScale ?? 7.5,
        seed: options.settings?.seed,
      },
    };

    return this.callApi(payload);
  }

  /**
   * Generate video and save to file
   */
  async generateVideoToFile(
    options: MochiGenerateRequest,
    outputPath: string
  ): Promise<MochiGenerateResponse> {
    const result = await this.generateVideo(options);

    // Ensure output directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Decode and write video
    const videoBuffer = Buffer.from(result.videoBase64, 'base64');
    fs.writeFileSync(outputPath, videoBuffer);

    return {
      ...result,
      videoPath: path.resolve(outputPath),
    };
  }

  /**
   * List available presets and quality profiles
   */
  async listPresets(): Promise<Array<{
    name: string;
    description: string;
    settings: MochiSettings;
    estimatedTimeSeconds: number;
  }>> {
    return [
      {
        name: 'fast',
        description: 'Fast generation, good for testing',
        settings: {
          durationSeconds: 3,
          numInferenceSteps: 30,
          guidanceScale: 7.5,
        },
        estimatedTimeSeconds: 60,
      },
      {
        name: 'balanced',
        description: 'Balanced quality and speed',
        settings: {
          durationSeconds: 6,
          numInferenceSteps: 60,
          guidanceScale: 7.5,
        },
        estimatedTimeSeconds: 120,
      },
      {
        name: 'quality',
        description: 'High-quality photorealistic output',
        settings: {
          durationSeconds: 6,
          numInferenceSteps: 100,
          guidanceScale: 8.0,
        },
        estimatedTimeSeconds: 180,
      },
    ];
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: string;
    model: string;
    gpu: string;
  }> {
    const response = await fetch(`${this.modalApiUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Call Modal API endpoint
   */
  private async callApi(payload: unknown): Promise<MochiGenerateResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(`${this.modalApiUrl}/api_generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }

      const data = await response.json() as MochiAPIResponse;

      return {
        videoBase64: data.video_base64,
        duration: data.duration,
        resolution: data.resolution,
        fps: data.fps,
        generationTime: data.generation_time,
        metadata: data.metadata as unknown as Record<string, unknown> | undefined,
      };
    } catch (error) {
      throw new Error(
        `Mochi API call failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

/**
 * Export convenience functions
 */

/**
 * Create a Mochi client with environment variables
 */
export function createMochiClient(): MochiClient {
  const apiUrl = process.env.MOCHI_API_URL;
  const apiKey = process.env.MOCHI_API_KEY;

  if (!apiUrl) {
    throw new Error('MOCHI_API_URL environment variable is required');
  }

  return new MochiClient(apiUrl, apiKey);
}

/**
 * Quick helper to generate and save a video
 */
export async function generateMochiVideo(
  prompt: string,
  outputPath: string,
  options?: Partial<MochiSettings>
): Promise<MochiGenerateResponse> {
  const client = createMochiClient();
  return client.generateVideoToFile(
    { prompt, settings: options },
    outputPath
  );
}
