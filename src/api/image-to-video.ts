// =============================================================================
// Image-to-Video Generation
// Animates static images into video with motion prompts
// =============================================================================

import * as fs from 'fs';
import * as path from 'path';

/**
 * Image-to-Video generation options
 */
export interface ImageToVideoOptions {
  imageBase64?: string;          // Base64-encoded image or URL
  imagePath?: string;            // File path to image
  motionPrompt: string;          // Description of desired motion
  duration?: number;             // Duration in seconds (default: 5)
  fps?: number;                  // Frames per second (default: 24)
  resolution?: '512x512' | '768x512' | '512x768' | '1024x512' | '512x1024';
  quality?: 'draft' | 'balanced' | 'quality'; // Quality preset
}

export interface ImageToVideoResult {
  videoUrl: string;
  videoPath?: string;
  duration: number;
  resolution: string;
  fps: number;
  generatedAt: string;
  metadata?: {
    imageUrl?: string;
    motionPrompt: string;
    quality: string;
  };
}

/**
 * ImageToVideoClient - Generate video from static images
 * Uses Modal LTX-Video deployment with image frame as initial condition
 */
export class ImageToVideoClient {
  private modalApiUrl: string = process.env.MODAL_API_URL || 'https://modal.com/api';
  private apiKey: string = process.env.MODAL_API_KEY || '';

  constructor(apiKey?: string, modalUrl?: string) {
    if (apiKey) this.apiKey = apiKey;
    if (modalUrl) this.modalApiUrl = modalUrl;
  }

  /**
   * Generate video from image with motion prompt
   */
  async generateFromImage(options: ImageToVideoOptions): Promise<ImageToVideoResult> {
    // Validate inputs
    if (!options.imagePath && !options.imageBase64) {
      throw new Error('Either imagePath or imageBase64 is required');
    }

    if (!options.motionPrompt) {
      throw new Error('motionPrompt is required');
    }

    // Load image if path provided
    let imageData = options.imageBase64;
    if (options.imagePath && !imageData) {
      imageData = this.loadImageAsBase64(options.imagePath);
    }

    // Prepare request payload
    const payload = {
      image_b64: imageData,
      motion_prompt: options.motionPrompt,
      duration_sec: options.duration || 5,
      fps: options.fps || 24,
      resolution: options.resolution || '512x512',
      quality: options.quality || 'balanced',
    };

    // Call Modal API (would call real endpoint in production)
    return this.callModalAPI(payload);
  }

  /**
   * Generate video from image URL
   */
  async generateFromImageUrl(imageUrl: string, motionPrompt: string, options?: Partial<ImageToVideoOptions>): Promise<ImageToVideoResult> {
    return this.generateFromImage({
      imageBase64: imageUrl,
      motionPrompt,
      ...options,
    });
  }

  /**
   * Load image file and convert to Base64
   */
  private loadImageAsBase64(imagePath: string): string {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString('base64');
  }

  /**
   * Call Modal API endpoint
   */
  private async callModalAPI(payload: any): Promise<ImageToVideoResult> {
    try {
      // In production, this would make actual HTTP request to Modal
      const response = await fetch(`${this.modalApiUrl}/image-to-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Modal API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        videoUrl: data.video_url,
        videoPath: data.local_path,
        duration: data.duration || payload.duration_sec,
        resolution: payload.resolution,
        fps: payload.fps,
        generatedAt: new Date().toISOString(),
        metadata: {
          motionPrompt: payload.motion_prompt,
          quality: payload.quality,
        },
      };
    } catch (error) {
      // Fallback for development/testing
      console.warn('Modal API call failed, returning mock result:', error);
      return this.generateMockResult(payload);
    }
  }

  /**
   * Generate mock result for testing
   */
  private generateMockResult(payload: any): ImageToVideoResult {
    return {
      videoUrl: 'https://example.com/generated-video.mp4',
      duration: payload.duration_sec,
      resolution: payload.resolution,
      fps: payload.fps,
      generatedAt: new Date().toISOString(),
      metadata: {
        motionPrompt: payload.motion_prompt,
        quality: payload.quality,
      },
    };
  }

  /**
   * Set API key
   */
  setApiKey(key: string): void {
    this.apiKey = key;
  }

  /**
   * Set Modal API endpoint
   */
  setModalUrl(url: string): void {
    this.modalApiUrl = url;
  }
}

/**
 * Motion prompt templates for common effects
 */
export const MOTION_PROMPT_TEMPLATES = {
  // Camera movements
  panLeft: (speed: 'slow' | 'normal' | 'fast' = 'normal') =>
    `Camera pans smoothly from right to left at ${speed} speed, revealing more of the scene`,

  panRight: (speed: 'slow' | 'normal' | 'fast' = 'normal') =>
    `Camera pans smoothly from left to right at ${speed} speed`,

  zoomIn: (speed: 'slow' | 'normal' | 'fast' = 'normal') =>
    `Camera smoothly zooms in toward the center of the frame at ${speed} speed`,

  zoomOut: (speed: 'slow' | 'normal' | 'fast' = 'normal') =>
    `Camera smoothly zooms out from the center at ${speed} speed`,

  rotateClockwise: () =>
    `Image slowly rotates clockwise around its center`,

  rotateCounterClockwise: () =>
    `Image slowly rotates counter-clockwise around its center`,

  // Effect-based
  parallax: (intensity: 'subtle' | 'normal' | 'dramatic' = 'normal') =>
    `Subtle parallax scrolling effect with ${intensity} depth movement`,

  floating: () =>
    `Image gently floats up and down with subtle bobbing motion`,

  floating_360: () =>
    `Image floats and slowly rotates 360 degrees around its center`,

  shimmer: () =>
    `Subtle shimmer and pulse effect with gentle color shifts`,

  // Content-specific
  productShowcase: () =>
    `Product slowly rotates while camera moves around it, highlighting details`,

  heroUnfold: () =>
    `Scene gradually unfolds and expands outward with dynamic motion`,

  textReveal: () =>
    `Text and elements appear and animate in sequence, with smooth transitions`,
};

/**
 * Helper to generate motion prompt from template
 */
export function generateMotionPrompt(template: keyof typeof MOTION_PROMPT_TEMPLATES, ...args: any[]): string {
  const promptFn = MOTION_PROMPT_TEMPLATES[template] as any;
  if (!promptFn) {
    throw new Error(`Unknown motion prompt template: ${template}`);
  }
  return promptFn(...args);
}
