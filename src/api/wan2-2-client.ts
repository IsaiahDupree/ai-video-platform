// =============================================================================
// Wan2.2 High-Quality Text-to-Video Client
// Generate videos using Alibaba's Wan2.2 model on Modal
// Supports T2V (text-to-video) and TI2V (text+image-to-video)
// =============================================================================

import * as fs from 'fs';
import * as path from 'path';

/**
 * Wan2.2 generation settings
 */
export interface Wan22Settings {
  width?: number;              // Default: 1280
  height?: number;             // Default: 720
  durationSeconds?: number;    // Default: 10
  fps?: number;                // Default: 24 (must match 1/fps)
  numInferenceSteps?: number;  // Default: 50 (higher = better quality, slower)
  guidanceScale?: number;      // Default: 7.5 (how much to follow prompt)
  seed?: number;               // Optional: for reproducibility
}

/**
 * Wan2.2 generation request
 */
export interface Wan22GenerateRequest {
  prompt: string;              // Text description of desired video
  negativeprompt?: string;     // What to avoid (default: "blurry, low quality...")
  model?: 'wan2.2-t2v-14b' | 'wan2.2-ti2v-5b';  // Model selection
  settings?: Wan22Settings;
  imageBase64?: string;        // For TI2V mode: base64-encoded image
}

/**
 * Wan2.2 generation response
 */
export interface Wan22GenerateResponse {
  videoBase64: string;         // Base64-encoded MP4 video
  videoPath?: string;          // Local file path if saved
  duration: number;            // Duration in seconds
  resolution: string;          // e.g., "1280x720"
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
 * Wan2.2 API response from Modal endpoint
 */
interface Wan22APIResponse {
  status: string;
  video_base64: string;
  duration: number;
  resolution: string;
  fps: number;
  generation_time: number;
  metadata?: Record<string, unknown>;
}

/**
 * Wan2.2Client - High-quality video generation
 *
 * Usage:
 * ```typescript
 * const client = new Wan22Client(
 *   'https://your-username--wan2-2-video-api-generate.modal.run'
 * );
 *
 * const result = await client.generateVideo({
 *   prompt: 'A serene mountain landscape with snow',
 *   settings: {
 *     durationSeconds: 10,
 *     width: 1280,
 *     height: 720,
 *     numInferenceSteps: 50,
 *   }
 * });
 *
 * // Save to file
 * fs.writeFileSync('output.mp4', Buffer.from(result.videoBase64, 'base64'));
 * ```
 */
export class Wan22Client {
  private modalApiUrl: string;
  private apiKey?: string;

  constructor(
    modalApiUrl?: string,
    apiKey?: string
  ) {
    this.modalApiUrl = modalApiUrl || process.env.WAN2_2_API_URL || '';
    this.apiKey = apiKey || process.env.WAN2_2_API_KEY;

    if (!this.modalApiUrl) {
      throw new Error(
        'Wan2.2 API URL required. Provide as constructor arg or WAN2_2_API_URL env var'
      );
    }
  }

  /**
   * Generate video from text prompt (T2V mode)
   */
  async generateVideo(options: Wan22GenerateRequest): Promise<Wan22GenerateResponse> {
    if (!options.prompt) {
      throw new Error('prompt is required');
    }

    // Load image if path provided
    let imageBase64 = options.imageBase64;
    if (!imageBase64 && options.model === 'wan2.2-ti2v-5b') {
      throw new Error(
        'imageBase64 is required for TI2V mode (wan2.2-ti2v-5b)'
      );
    }

    const payload = {
      prompt: options.prompt,
      negative_prompt: options.negativeprompt || 'blurry, low quality, distorted, ugly',
      model: options.model || 'wan2.2-t2v-14b',
      settings: {
        width: options.settings?.width ?? 1280,
        height: options.settings?.height ?? 720,
        duration_seconds: options.settings?.durationSeconds ?? 10,
        fps: options.settings?.fps ?? 24,
        num_inference_steps: options.settings?.numInferenceSteps ?? 50,
        guidance_scale: options.settings?.guidanceScale ?? 7.5,
        seed: options.settings?.seed,
      },
      ...(imageBase64 && { image_base64: imageBase64 }),
    };

    return this.callApi(payload);
  }

  /**
   * Generate video from text + image (TI2V mode)
   */
  async generateVideoFromImage(
    prompt: string,
    imagePath: string,
    options?: Partial<Wan22Settings>
  ): Promise<Wan22GenerateResponse> {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    const imageData = fs.readFileSync(imagePath);
    const imageBase64 = imageData.toString('base64');

    return this.generateVideo({
      prompt,
      model: 'wan2.2-ti2v-5b',
      imageBase64,
      settings: options,
    });
  }

  /**
   * Generate video and save to file
   */
  async generateVideoToFile(
    options: Wan22GenerateRequest,
    outputPath: string
  ): Promise<Wan22GenerateResponse> {
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
   * List available models
   */
  async listModels(): Promise<Array<{
    id: string;
    name: string;
    type: string;
    description: string;
    maxDurationSeconds: number;
    resolutions: string[];
    quality: string;
    generationTimeEstimate: string;
  }>> {
    try {
      const response = await fetch(`${this.modalApiUrl}/models`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json() as {
        models: Array<{
          id: string;
          name: string;
          type: string;
          description: string;
          max_duration_seconds: number;
          resolutions: string[];
          quality: string;
          generation_time_estimate: string;
        }>;
      };

      return data.models.map(m => ({
        id: m.id,
        name: m.name,
        type: m.type,
        description: m.description,
        maxDurationSeconds: m.max_duration_seconds,
        resolutions: m.resolutions,
        quality: m.quality,
        generationTimeEstimate: m.generation_time_estimate,
      }));
    } catch (error) {
      console.warn('Could not fetch models:', error);
      return [
        {
          id: 'wan2.2-t2v-14b',
          name: 'Wan2.2 T2V-14B',
          type: 'text-to-video',
          description: 'High-quality text-to-video generation',
          maxDurationSeconds: 60,
          resolutions: ['720x720', '1280x720'],
          quality: 'highest',
          generationTimeEstimate: '120-180 seconds',
        },
        {
          id: 'wan2.2-ti2v-5b',
          name: 'Wan2.2 TI2V-5B',
          type: 'text-image-to-video',
          description: 'Text + image to video generation',
          maxDurationSeconds: 30,
          resolutions: ['720x720', '1280x720'],
          quality: 'high',
          generationTimeEstimate: '60-90 seconds',
        },
      ];
    }
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
  private async callApi(payload: unknown): Promise<Wan22GenerateResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(`${this.modalApiUrl}/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }

      const data = await response.json() as Wan22APIResponse;

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
        `Wan2.2 API call failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

/**
 * Export convenience functions
 */

/**
 * Create a Wan2.2 client with environment variables
 */
export function createWan22Client(): Wan22Client {
  const apiUrl = process.env.WAN2_2_API_URL;
  const apiKey = process.env.WAN2_2_API_KEY;

  if (!apiUrl) {
    throw new Error('WAN2_2_API_URL environment variable is required');
  }

  return new Wan22Client(apiUrl, apiKey);
}

/**
 * Quick helper to generate and save a video
 */
export async function generateWan22Video(
  prompt: string,
  outputPath: string,
  options?: Partial<Wan22Settings>
): Promise<Wan22GenerateResponse> {
  const client = createWan22Client();
  return client.generateVideoToFile(
    { prompt, settings: options },
    outputPath
  );
}
