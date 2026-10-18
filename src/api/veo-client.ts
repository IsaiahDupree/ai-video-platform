/**
 * Google Veo 3.1 Client
 *
 * Integration with Google's Veo 3.1 AI video generation API.
 * Supports image-to-video generation with various aspect ratios and durations.
 *
 * Features:
 * - Image-to-video generation (8s/16s durations)
 * - Multiple aspect ratios (9:16, 16:9, 1:1)
 * - Async job status polling
 * - Motion prompt support
 *
 * Reference: Google Veo 3.1 API Documentation
 */

import axios, { AxiosInstance } from 'axios';
import fs from 'fs';
import path from 'path';

// =============================================================================
// Types
// =============================================================================

export type VeoAspectRatio = '9:16' | '16:9' | '1:1';
export type VeoDuration = 8 | 16; // seconds

export interface VeoGenerateRequest {
  imageUrl?: string; // For image-to-video
  imageBase64?: string; // Alternative: base64 encoded image
  prompt: string; // Motion/scene description
  duration?: VeoDuration; // Default 8s
  aspectRatio?: VeoAspectRatio; // Default 9:16
  seed?: number; // For reproducibility
}

export interface VeoJobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  videoUrl?: string; // Available when status is 'completed'
  error?: string; // Available when status is 'failed'
  createdAt: string;
  completedAt?: string;
  estimatedTimeRemaining?: number; // seconds
}

export interface VeoGenerateResponse {
  jobId: string;
  status: VeoJobStatus;
  pollUrl: string;
}

// =============================================================================
// Veo Client
// =============================================================================

export class VeoClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;

  constructor(config?: { apiKey?: string; baseUrl?: string }) {
    this.apiKey = config?.apiKey || process.env.GOOGLE_VEO_API_KEY || '';
    this.baseUrl = config?.baseUrl || process.env.GOOGLE_VEO_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';

    if (!this.apiKey) {
      throw new Error('Google Veo API key is required. Set GOOGLE_VEO_API_KEY environment variable.');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
      },
      timeout: 120000, // 2 minutes
    });
  }

  /**
   * Generate video from image and motion prompt
   */
  async generateVideo(request: VeoGenerateRequest): Promise<VeoGenerateResponse> {
    const {
      imageUrl,
      imageBase64,
      prompt,
      duration = 8,
      aspectRatio = '9:16',
      seed,
    } = request;

    // Validate inputs
    if (!imageUrl && !imageBase64) {
      throw new Error('Either imageUrl or imageBase64 is required');
    }

    if (!prompt) {
      throw new Error('Motion prompt is required');
    }

    if (![8, 16].includes(duration)) {
      throw new Error('Duration must be 8 or 16 seconds');
    }

    if (!['9:16', '16:9', '1:1'].includes(aspectRatio)) {
      throw new Error('Aspect ratio must be 9:16, 16:9, or 1:1');
    }

    // Prepare image data
    let imageData: string;
    if (imageBase64) {
      imageData = imageBase64;
    } else if (imageUrl) {
      // Download image and convert to base64
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      imageData = Buffer.from(response.data).toString('base64');
    } else {
      throw new Error('Image source required');
    }

    // Map aspect ratio to dimensions
    const dimensionMap: Record<VeoAspectRatio, { width: number; height: number }> = {
      '9:16': { width: 720, height: 1280 },
      '16:9': { width: 1280, height: 720 },
      '1:1': { width: 1024, height: 1024 },
    };

    const dimensions = dimensionMap[aspectRatio];

    // Submit generation request
    const payload = {
      model: 'models/veo-3.1',
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageData,
            },
          },
          {
            text: prompt,
          },
        ],
      }],
      generationConfig: {
        duration: duration,
        width: dimensions.width,
        height: dimensions.height,
        seed: seed || Math.floor(Math.random() * 1000000),
      },
    };

    const response = await this.client.post('/models/veo-3.1:generateVideo', payload);
    const data = response.data;

    // Extract job ID from response
    const jobId = data.name || data.jobId || `veo-${Date.now()}`;

    return {
      jobId,
      status: {
        jobId,
        status: 'queued',
        createdAt: new Date().toISOString(),
      },
      pollUrl: `/api/v1/ai/veo/jobs/${jobId}`,
    };
  }

  /**
   * Poll job status
   */
  async getJobStatus(jobId: string): Promise<VeoJobStatus> {
    try {
      const response = await this.client.get(`/operations/${jobId}`);
      const data = response.data;

      // Parse response
      const status: VeoJobStatus = {
        jobId,
        status: this.parseStatus(data.done, data.error),
        createdAt: data.metadata?.createTime || new Date().toISOString(),
        completedAt: data.done ? new Date().toISOString() : undefined,
      };

      // Extract progress
      if (data.metadata?.progressPercent) {
        status.progress = Math.round(data.metadata.progressPercent);
      }

      // Extract video URL if completed
      if (data.done && !data.error && data.response?.videoUri) {
        status.videoUrl = data.response.videoUri;
      }

      // Extract error if failed
      if (data.error) {
        status.error = data.error.message || 'Video generation failed';
      }

      // Estimate time remaining
      if (!data.done && status.progress) {
        const avgTimePerPercent = 3; // Rough estimate: 3 seconds per percent
        status.estimatedTimeRemaining = (100 - status.progress) * avgTimePerPercent;
      }

      return status;
    } catch (error: any) {
      // If job not found, return failed status
      if (error.response?.status === 404) {
        return {
          jobId,
          status: 'failed',
          error: 'Job not found',
          createdAt: new Date().toISOString(),
        };
      }

      throw error;
    }
  }

  /**
   * Wait for job completion
   */
  async waitForCompletion(
    jobId: string,
    options: {
      pollInterval?: number; // milliseconds
      maxWaitTime?: number; // milliseconds
      onProgress?: (status: VeoJobStatus) => void;
    } = {}
  ): Promise<VeoJobStatus> {
    const {
      pollInterval = 5000,
      maxWaitTime = 600000, // 10 minutes
      onProgress,
    } = options;

    const startTime = Date.now();

    while (true) {
      const status = await this.getJobStatus(jobId);

      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }

      if (Date.now() - startTime > maxWaitTime) {
        throw new Error(`Job ${jobId} did not complete within ${maxWaitTime / 1000}s`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  /**
   * Download generated video
   */
  async downloadVideo(videoUrl: string, outputPath: string): Promise<void> {
    const response = await axios.get(videoUrl, { responseType: 'stream' });
    const writer = fs.createWriteStream(outputPath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }

  /**
   * Generate and wait for video (convenience method)
   */
  async generateAndWait(
    request: VeoGenerateRequest,
    outputPath?: string,
    onProgress?: (status: VeoJobStatus) => void
  ): Promise<{ status: VeoJobStatus; localPath?: string }> {
    // Start generation
    const response = await this.generateVideo(request);

    // Wait for completion
    const status = await this.waitForCompletion(response.jobId, {
      onProgress,
    });

    // Download if completed
    if (status.status === 'completed' && status.videoUrl) {
      if (outputPath) {
        await this.downloadVideo(status.videoUrl, outputPath);
        return { status, localPath: outputPath };
      }

      // Auto-generate output path
      const autoPath = path.join(
        process.env.OUTPUT_DIR || './output',
        `veo-${response.jobId}.mp4`
      );
      await this.downloadVideo(status.videoUrl, autoPath);
      return { status, localPath: autoPath };
    }

    return { status };
  }

  // =============================================================================
  // Private Helpers
  // =============================================================================

  private parseStatus(done: boolean, error: any): VeoJobStatus['status'] {
    if (error) {
      return 'failed';
    }

    if (done) {
      return 'completed';
    }

    return 'processing';
  }
}

// =============================================================================
// Factory Function
// =============================================================================

export function createVeoClient(config?: { apiKey?: string; baseUrl?: string }): VeoClient {
  return new VeoClient(config);
}
