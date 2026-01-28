/**
 * Text-to-Video API Router - T2V-006
 * Unified API to route requests to different T2V models
 *
 * This service provides a unified interface for generating videos from text
 * across multiple text-to-video models deployed on Modal.
 *
 * Supported Models:
 * - LTX-Video: Fast, lightweight T2V (512x512, 2-3s, 50 steps)
 * - Mochi: High-quality 480p T2V (480x848, 1-2.8s, 64 steps)
 * - HunyuanVideo: Industry-leading 720p T2V (1280x720, ~5.4s, 50 steps)
 * - Wan2.2: Multi-lingual 1080p T2V (1920x1080, ~4s, 50 steps)
 * - LongCat Avatar: Audio-driven talking heads (512x512, audio-based duration)
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Available T2V model options
 */
export type T2VModel = 'ltx-video' | 'mochi' | 'hunyuan' | 'wan' | 'avatar';

/**
 * Model capability information
 */
export interface ModelCapabilities {
  name: string;
  description: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultFrames: number;
  defaultFPS: number;
  minFrames?: number;
  maxFrames?: number;
  supportedResolutions?: Array<{ width: number; height: number }>;
  estimatedSpeed: 'fast' | 'medium' | 'slow';
  quality: 'standard' | 'high' | 'excellent';
  specialFeatures?: string[];
}

/**
 * Common parameters for all T2V models
 */
export interface BaseVideoConfig {
  /** Text description of the video to generate */
  prompt: string;
  /** What to avoid in the generation */
  negativePrompt?: string;
  /** Number of frames to generate */
  numFrames?: number;
  /** Video width in pixels */
  width?: number;
  /** Video height in pixels */
  height?: number;
  /** Number of denoising steps */
  numInferenceSteps?: number;
  /** Guidance scale for prompt adherence */
  guidanceScale?: number;
  /** Output frame rate */
  fps?: number;
  /** Random seed for reproducibility */
  seed?: number;
}

/**
 * Avatar-specific parameters (for LongCat)
 */
export interface AvatarVideoConfig {
  /** Reference portrait image (path, URL, or Buffer) */
  referenceImage: string | Buffer;
  /** Audio file (path, URL, or Buffer) */
  audio: string | Buffer;
  /** Number of denoising steps */
  numInferenceSteps?: number;
  /** Guidance scale */
  guidanceScale?: number;
  /** Output frame rate */
  fps?: number;
  /** Random seed */
  seed?: number;
}

/**
 * Text-to-video generation request
 */
export interface T2VRequest {
  /** Which model to use */
  model: T2VModel;
  /** Video generation parameters */
  config: BaseVideoConfig | AvatarVideoConfig;
}

/**
 * Response from T2V API
 */
export interface T2VResponse {
  /** Video data as Buffer */
  video: Buffer;
  /** Model used for generation */
  model: T2VModel;
  /** Generation metadata */
  metadata: {
    prompt?: string;
    width: number;
    height: number;
    frames: number;
    fps: number;
    duration: number;
    seed?: number;
  };
}

/**
 * Error response from T2V API
 */
export interface T2VError {
  error: string;
  model?: T2VModel;
  details?: string;
}

/**
 * Model capabilities mapping
 */
export const MODEL_CAPABILITIES: Record<T2VModel, ModelCapabilities> = {
  'ltx-video': {
    name: 'LTX-Video',
    description: 'Fast, lightweight text-to-video model',
    defaultWidth: 512,
    defaultHeight: 512,
    defaultFrames: 24,
    defaultFPS: 8,
    minFrames: 16,
    maxFrames: 48,
    estimatedSpeed: 'fast',
    quality: 'standard',
    specialFeatures: ['fast-generation', 'low-vram']
  },
  'mochi': {
    name: 'Genmo Mochi',
    description: '10B parameter model for high-quality 480p video',
    defaultWidth: 848,
    defaultHeight: 480,
    defaultFrames: 31,
    defaultFPS: 30,
    minFrames: 31,
    maxFrames: 84,
    estimatedSpeed: 'medium',
    quality: 'high',
    specialFeatures: ['photorealistic', 'motion-coherence']
  },
  'hunyuan': {
    name: 'HunyuanVideo',
    description: '13B parameter model with industry-leading text alignment',
    defaultWidth: 1280,
    defaultHeight: 720,
    defaultFrames: 129,
    defaultFPS: 24,
    estimatedSpeed: 'slow',
    quality: 'excellent',
    specialFeatures: ['multilingual', 'long-form', 'text-alignment', 'camera-movement']
  },
  'wan': {
    name: 'Alibaba Wan2.2',
    description: 'Multi-lingual 1080p MoE model with 50+ language support',
    defaultWidth: 1920,
    defaultHeight: 1080,
    defaultFrames: 61,
    defaultFPS: 16,
    minFrames: 61,
    maxFrames: 121,
    estimatedSpeed: 'slow',
    quality: 'excellent',
    specialFeatures: ['multilingual', '1080p', 'moe-architecture']
  },
  'avatar': {
    name: 'LongCat Avatar',
    description: 'Audio-driven talking head video generation',
    defaultWidth: 512,
    defaultHeight: 512,
    defaultFrames: 25, // 1 second at 25fps
    defaultFPS: 25,
    estimatedSpeed: 'medium',
    quality: 'high',
    specialFeatures: ['audio-driven', 'lip-sync', 'talking-head']
  }
};

/**
 * Text-to-Video API Client
 *
 * Unified interface for generating videos using different T2V models.
 * Automatically routes requests to the appropriate Modal endpoint.
 */
export class TextToVideoClient {
  private endpoints: Record<T2VModel, string>;
  private timeout: number;

  /**
   * Create a new T2V client
   *
   * @param timeout - Request timeout in milliseconds (default: 300000 = 5 minutes)
   */
  constructor(timeout: number = 300000) {
    this.timeout = timeout;
    this.endpoints = {
      'ltx-video': process.env.MODAL_LTX_VIDEO_URL || '',
      'mochi': process.env.MODAL_MOCHI_URL || '',
      'hunyuan': process.env.MODAL_HUNYUAN_URL || '',
      'wan': process.env.MODAL_WAN_URL || '',
      'avatar': process.env.MODAL_AVATAR_URL || ''
    };
  }

  /**
   * Get model capabilities
   */
  getModelCapabilities(model: T2VModel): ModelCapabilities {
    return MODEL_CAPABILITIES[model];
  }

  /**
   * List all available models
   */
  listModels(): T2VModel[] {
    return Object.keys(this.endpoints) as T2VModel[];
  }

  /**
   * Check if a model is configured (has endpoint URL)
   */
  isModelAvailable(model: T2VModel): boolean {
    return !!this.endpoints[model];
  }

  /**
   * Get configured models only
   */
  getAvailableModels(): T2VModel[] {
    return this.listModels().filter(model => this.isModelAvailable(model));
  }

  /**
   * Recommend a model based on requirements
   */
  recommendModel(requirements: {
    quality?: 'standard' | 'high' | 'excellent';
    speed?: 'fast' | 'medium' | 'slow';
    resolution?: { width: number; height: number };
    duration?: number;
    features?: string[];
  }): T2VModel | null {
    const available = this.getAvailableModels();

    // Priority 1: Required features
    if (requirements.features) {
      for (const model of available) {
        const caps = MODEL_CAPABILITIES[model];
        if (requirements.features.every(f => caps.specialFeatures?.includes(f))) {
          return model;
        }
      }
    }

    // Priority 2: Quality + Speed
    if (requirements.quality && requirements.speed) {
      for (const model of available) {
        const caps = MODEL_CAPABILITIES[model];
        if (caps.quality === requirements.quality && caps.estimatedSpeed === requirements.speed) {
          return model;
        }
      }
    }

    // Priority 3: Quality alone
    if (requirements.quality) {
      const qualityOrder: Array<'excellent' | 'high' | 'standard'> = ['excellent', 'high', 'standard'];
      const targetIdx = qualityOrder.indexOf(requirements.quality);
      for (let i = targetIdx; i >= 0; i--) {
        const model = available.find(m => MODEL_CAPABILITIES[m].quality === qualityOrder[i]);
        if (model) return model;
      }
    }

    // Priority 4: Speed alone
    if (requirements.speed) {
      const model = available.find(m => MODEL_CAPABILITIES[m].estimatedSpeed === requirements.speed);
      if (model) return model;
    }

    // Default: Return first available
    return available[0] || null;
  }

  /**
   * Generate a video using specified model
   */
  async generateVideo(request: T2VRequest): Promise<T2VResponse> {
    const { model, config } = request;

    // Check if model is available
    if (!this.isModelAvailable(model)) {
      throw new Error(
        `Model "${model}" is not configured. Set ${this.getEnvVarName(model)} environment variable.`
      );
    }

    // Route to appropriate generator
    if (model === 'avatar') {
      return this.generateAvatar(config as AvatarVideoConfig);
    } else {
      return this.generateTextVideo(model, config as BaseVideoConfig);
    }
  }

  /**
   * Generate video from text (non-avatar models)
   */
  private async generateTextVideo(model: Exclude<T2VModel, 'avatar'>, config: BaseVideoConfig): Promise<T2VResponse> {
    const endpoint = this.endpoints[model];
    const capabilities = MODEL_CAPABILITIES[model];

    // Prepare request with model-specific defaults
    const requestBody = {
      prompt: config.prompt,
      negative_prompt: config.negativePrompt || '',
      num_frames: config.numFrames || capabilities.defaultFrames,
      width: config.width || capabilities.defaultWidth,
      height: config.height || capabilities.defaultHeight,
      num_inference_steps: config.numInferenceSteps || 50,
      guidance_scale: config.guidanceScale || (model === 'mochi' ? 4.5 : model === 'hunyuan' ? 6.0 : 7.5),
      fps: config.fps || capabilities.defaultFPS,
      ...(config.seed !== undefined && { seed: config.seed })
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${endpoint}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json() as T2VError;
        throw new Error(errorData.error || `T2V generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      const videoBuffer = Buffer.from(data.video, 'base64');

      return {
        video: videoBuffer,
        model,
        metadata: {
          prompt: config.prompt,
          width: requestBody.width,
          height: requestBody.height,
          frames: requestBody.num_frames,
          fps: requestBody.fps,
          duration: requestBody.num_frames / requestBody.fps,
          seed: config.seed
        }
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`T2V generation timed out after ${this.timeout / 1000}s`);
        }
        throw error;
      }
      throw new Error('Unknown error during T2V generation');
    }
  }

  /**
   * Generate avatar video (audio-driven)
   */
  private async generateAvatar(config: AvatarVideoConfig): Promise<T2VResponse> {
    const endpoint = this.endpoints.avatar;

    // Prepare image and audio
    let imageBase64: string;
    let audioBase64: string;

    // Handle reference image
    if (Buffer.isBuffer(config.referenceImage)) {
      imageBase64 = config.referenceImage.toString('base64');
    } else if (typeof config.referenceImage === 'string' &&
               (config.referenceImage.startsWith('http://') || config.referenceImage.startsWith('https://'))) {
      // URL - fetch it
      const response = await fetch(config.referenceImage);
      const buffer = Buffer.from(await response.arrayBuffer());
      imageBase64 = buffer.toString('base64');
    } else {
      // File path
      const buffer = fs.readFileSync(config.referenceImage as string);
      imageBase64 = buffer.toString('base64');
    }

    // Handle audio
    if (Buffer.isBuffer(config.audio)) {
      audioBase64 = config.audio.toString('base64');
    } else if (typeof config.audio === 'string' &&
               (config.audio.startsWith('http://') || config.audio.startsWith('https://'))) {
      // URL - fetch it
      const response = await fetch(config.audio);
      const buffer = Buffer.from(await response.arrayBuffer());
      audioBase64 = buffer.toString('base64');
    } else {
      // File path
      const buffer = fs.readFileSync(config.audio as string);
      audioBase64 = buffer.toString('base64');
    }

    const requestBody = {
      reference_image: imageBase64,
      audio: audioBase64,
      num_inference_steps: config.numInferenceSteps || 25,
      guidance_scale: config.guidanceScale || 3.0,
      fps: config.fps || 25,
      ...(config.seed !== undefined && { seed: config.seed })
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${endpoint}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json() as T2VError;
        throw new Error(errorData.error || `Avatar generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      const videoBuffer = Buffer.from(data.video, 'base64');

      // Estimate duration based on audio (we don't know actual duration without decoding)
      // For now, use a placeholder
      const estimatedDuration = 5.0; // Will be replaced with actual duration in production

      return {
        video: videoBuffer,
        model: 'avatar',
        metadata: {
          width: 512,
          height: 512,
          frames: Math.round(estimatedDuration * (config.fps || 25)),
          fps: config.fps || 25,
          duration: estimatedDuration,
          seed: config.seed
        }
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Avatar generation timed out after ${this.timeout / 1000}s`);
        }
        throw error;
      }
      throw new Error('Unknown error during avatar generation');
    }
  }

  /**
   * Save generated video to file
   */
  async saveVideo(response: T2VResponse, outputPath: string): Promise<void> {
    // Ensure output directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write video file
    fs.writeFileSync(outputPath, response.video);
  }

  /**
   * Get environment variable name for model
   */
  private getEnvVarName(model: T2VModel): string {
    const envVarMap: Record<T2VModel, string> = {
      'ltx-video': 'MODAL_LTX_VIDEO_URL',
      'mochi': 'MODAL_MOCHI_URL',
      'hunyuan': 'MODAL_HUNYUAN_URL',
      'wan': 'MODAL_WAN_URL',
      'avatar': 'MODAL_AVATAR_URL'
    };
    return envVarMap[model];
  }
}

/**
 * Create a new T2V client instance
 */
export function createTextToVideoClient(timeout?: number): TextToVideoClient {
  return new TextToVideoClient(timeout);
}

/**
 * Generate a video using the specified model (convenience function)
 */
export async function generateVideo(
  model: T2VModel,
  config: BaseVideoConfig | AvatarVideoConfig,
  outputPath?: string
): Promise<T2VResponse> {
  const client = createTextToVideoClient();
  const response = await client.generateVideo({ model, config });

  if (outputPath) {
    await client.saveVideo(response, outputPath);
  }

  return response;
}

/**
 * Auto-select best model and generate video
 */
export async function generateVideoAuto(
  prompt: string,
  options?: {
    quality?: 'standard' | 'high' | 'excellent';
    speed?: 'fast' | 'medium' | 'slow';
    outputPath?: string;
    config?: Partial<BaseVideoConfig>;
  }
): Promise<T2VResponse> {
  const client = createTextToVideoClient();

  const model = client.recommendModel({
    quality: options?.quality,
    speed: options?.speed
  });

  if (!model) {
    throw new Error('No T2V models are configured. Please set at least one MODAL_*_URL environment variable.');
  }

  const config: BaseVideoConfig = {
    prompt,
    ...options?.config
  };

  const response = await client.generateVideo({ model, config });

  if (options?.outputPath) {
    await client.saveVideo(response, options.outputPath);
  }

  return response;
}
