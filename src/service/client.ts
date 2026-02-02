/**
 * Remotion Media Service - TypeScript Client SDK
 *
 * Simple HTTP client for the Remotion Media Service API
 */

import http from 'http';
import https from 'https';

// =============================================================================
// Types
// =============================================================================

export interface ServiceConfig {
  baseUrl?: string;
  apiKey: string;
  timeout?: number;
}

export interface Job {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  input: any;
  result?: any;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  retries: number;
}

export interface RenderBriefRequest {
  brief: any;
  quality?: 'preview' | 'production';
  outputFormat?: 'mp4' | 'webm' | 'gif';
  webhookUrl?: string;
}

export interface BatchRenderRequest {
  videos: any[];
  outputDir?: string;
  quality?: 'preview' | 'production';
  webhook?: string;
}

export interface TTSRequest {
  text: string;
  provider?: 'openai' | 'elevenlabs';
  voice?: string;
  options?: any;
  webhookUrl?: string;
}

export interface VoiceCloneRequest {
  text: string;
  voiceReferenceUrl: string;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'excited';
  webhookUrl?: string;
}

export interface VideoGenerateRequest {
  prompt: string;
  model?: 'ltx' | 'mochi' | 'wan2.2' | 'sora';
  duration?: number;
  size?: string;
  webhookUrl?: string;
}

export interface ImageToVideoRequest {
  imageUrl: string;
  motionPrompt: string;
  duration?: number;
  webhookUrl?: string;
}

export interface CharacterGenerateRequest {
  name: string;
  description: string;
  style?: 'cartoon' | 'realistic' | 'mascot' | 'anime';
  expressions?: string[];
  webhookUrl?: string;
}

export interface AvatarRequest {
  audioUrl: string;
  faceImageUrl: string;
  fps?: number;
  webhookUrl?: string;
}

// =============================================================================
// Client SDK
// =============================================================================

export class RemotionClient {
  private config: Required<ServiceConfig>;

  constructor(config: ServiceConfig) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:3100',
      apiKey: config.apiKey,
      timeout: config.timeout || 30000,
    };
  }

  // =============================================================================
  // HTTP Helper
  // =============================================================================

  private async request<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<T> {
    const url = new URL(path, this.config.baseUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    return new Promise((resolve, reject) => {
      const bodyString = body ? JSON.stringify(body) : undefined;

      const req = client.request(
        {
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: url.pathname + url.search,
          method,
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.config.apiKey,
            ...(bodyString ? { 'Content-Length': Buffer.byteLength(bodyString) } : {}),
          },
          timeout: this.config.timeout,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);

              if (res.statusCode && res.statusCode >= 400) {
                reject(new Error(parsed.error || `HTTP ${res.statusCode}`));
              } else {
                resolve(parsed);
              }
            } catch (err) {
              reject(new Error('Failed to parse response'));
            }
          });
        }
      );

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (bodyString) {
        req.write(bodyString);
      }

      req.end();
    });
  }

  // =============================================================================
  // Health & Status
  // =============================================================================

  async health(): Promise<{ status: string; uptime: number }> {
    return this.request('GET', '/health');
  }

  async capabilities(): Promise<any> {
    return this.request('GET', '/api/v1/capabilities');
  }

  // =============================================================================
  // Job Management
  // =============================================================================

  async getJob(jobId: string): Promise<Job> {
    return this.request('GET', `/api/v1/jobs/${jobId}`);
  }

  async listJobs(): Promise<{ jobs: Job[]; stats: any }> {
    return this.request('GET', '/api/v1/jobs');
  }

  async cancelJob(jobId: string): Promise<{ success: boolean; jobId: string }> {
    return this.request('DELETE', `/api/v1/jobs/${jobId}`);
  }

  /**
   * Wait for job to complete with polling
   */
  async waitForJob(jobId: string, options?: {
    pollInterval?: number;
    timeout?: number;
  }): Promise<Job> {
    const pollInterval = options?.pollInterval || 2000;
    const timeout = options?.timeout || 300000;
    const startTime = Date.now();

    while (true) {
      const job = await this.getJob(jobId);

      if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        return job;
      }

      if (Date.now() - startTime > timeout) {
        throw new Error('Job wait timeout');
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  // =============================================================================
  // Rendering
  // =============================================================================

  async renderBrief(request: RenderBriefRequest): Promise<{ jobId: string; status: string; pollUrl: string }> {
    return this.request('POST', '/api/v1/render/brief', request);
  }

  async renderBatch(request: BatchRenderRequest): Promise<any> {
    return this.request('POST', '/api/v1/render/batch', request);
  }

  async getBatchStatus(batchId: string): Promise<any> {
    return this.request('GET', `/api/v1/render/batch/${batchId}`);
  }

  async renderStaticAd(request: {
    template: any;
    bindings: any;
    size?: any;
    format?: string;
    webhookUrl?: string;
  }): Promise<{ jobId: string; status: string; pollUrl: string }> {
    return this.request('POST', '/api/v1/render/static-ad', request);
  }

  // =============================================================================
  // Text-to-Speech
  // =============================================================================

  async generateTTS(request: TTSRequest): Promise<{ jobId: string; status: string; pollUrl: string }> {
    return this.request('POST', '/api/v1/tts/generate', request);
  }

  async cloneVoice(request: VoiceCloneRequest): Promise<{ jobId: string; status: string; pollUrl: string }> {
    return this.request('POST', '/api/v1/tts/voice-clone', request);
  }

  async multiLanguageTTS(request: {
    text: string;
    languages: string[];
    webhookUrl?: string;
  }): Promise<{ jobIds: string[]; status: string }> {
    return this.request('POST', '/api/v1/tts/multi-language', request);
  }

  // =============================================================================
  // Video Generation
  // =============================================================================

  async generateVideo(request: VideoGenerateRequest): Promise<{ jobId: string; status: string; pollUrl: string; estimatedDuration: number }> {
    return this.request('POST', '/api/v1/video/generate', request);
  }

  async imageToVideo(request: ImageToVideoRequest): Promise<{ jobId: string; status: string; pollUrl: string }> {
    return this.request('POST', '/api/v1/video/image-to-video', request);
  }

  // =============================================================================
  // Image Generation
  // =============================================================================

  async generateCharacter(request: CharacterGenerateRequest): Promise<{ jobId: string; status: string; pollUrl: string }> {
    return this.request('POST', '/api/v1/image/character', request);
  }

  // =============================================================================
  // Avatar
  // =============================================================================

  async generateInfiniteTalk(request: AvatarRequest): Promise<{ jobId: string; status: string; pollUrl: string }> {
    return this.request('POST', '/api/v1/avatar/infinitetalk', request);
  }

  // =============================================================================
  // Convenience Methods (Submit + Wait)
  // =============================================================================

  /**
   * Render a brief and wait for completion
   */
  async renderBriefSync(request: RenderBriefRequest): Promise<Job> {
    const { jobId } = await this.renderBrief(request);
    return this.waitForJob(jobId);
  }

  /**
   * Generate TTS and wait for completion
   */
  async generateTTSSync(request: TTSRequest): Promise<Job> {
    const { jobId } = await this.generateTTS(request);
    return this.waitForJob(jobId);
  }

  /**
   * Generate video and wait for completion
   */
  async generateVideoSync(request: VideoGenerateRequest): Promise<Job> {
    const { jobId } = await this.generateVideo(request);
    return this.waitForJob(jobId);
  }
}

// =============================================================================
// Example Usage
// =============================================================================

export async function exampleUsage() {
  const client = new RemotionClient({
    baseUrl: 'http://localhost:3100',
    apiKey: 'dev-api-key',
  });

  // Check health
  const health = await client.health();
  console.log('Service status:', health);

  // Render a video (async)
  const { jobId } = await client.renderBrief({
    brief: {
      id: 'test-video',
      format: 'explainer_v1',
      title: 'How AI Works',
      sections: [],
      style: { theme: 'dark' },
      settings: { duration_sec: 60, fps: 30 },
    },
    quality: 'preview',
  });

  console.log('Job submitted:', jobId);

  // Wait for completion
  const result = await client.waitForJob(jobId);
  console.log('Video ready:', result.result?.videoPath);

  // Or use sync method
  const syncResult = await client.generateTTSSync({
    text: 'Hello world!',
    provider: 'openai',
  });

  console.log('Audio ready:', syncResult.result?.audioPath);
}

export default RemotionClient;
