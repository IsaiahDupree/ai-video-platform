/**
 * InfiniteTalk Multi-GPU Client
 *
 * TypeScript client for distributed InfiniteTalk video generation on Modal.
 * Supports 2, 4, or 8 A100 GPU configurations for faster and longer video generation.
 *
 * Features:
 * - Automatic GPU selection (2, 4, or 8 GPUs)
 * - Longer video support (up to 30 seconds with 8 GPUs)
 * - Faster generation (2-4x speedup)
 * - Full TypeScript type safety
 *
 * @example
 * const client = new InfiniteTalkMultiGPUClient({
 *   modalToken: process.env.MODAL_TOKEN_ID,
 *   modalSecret: process.env.MODAL_TOKEN_SECRET,
 * });
 *
 * const result = await client.generate({
 *   image: imagePath,
 *   audio: audioPath,
 *   numGpus: 4, // Use 4 GPUs
 *   duration: 10, // 10 second video
 * });
 */

import * as fs from "fs";
import * as path from "path";
import fetch from "node-fetch";

/**
 * Configuration options for the multi-GPU client.
 */
export interface InfiniteTalkMultiGPUConfig {
  /** Modal API token ID */
  modalToken?: string;
  /** Modal API token secret */
  modalSecret?: string;
  /** Custom endpoint URL (for local testing) */
  endpoint?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Retry count for failed requests */
  maxRetries?: number;
}

/**
 * Options for video generation with multi-GPU support.
 */
export interface GenerateOptions {
  /** Path to reference face image */
  image: string;
  /** Path to audio file (WAV, MP3) or text for TTS */
  audio?: string;
  /** Text to synthesize if audio not provided */
  text?: string;
  /** Number of GPUs to use (2, 4, or 8) */
  numGpus?: 2 | 4 | 8;
  /** Video resolution: "480p" (default) or "720p" */
  resolution?: "480p" | "720p";
  /** Maximum video duration in seconds */
  duration?: number;
  /** Random seed for reproducibility */
  seed?: number;
  /** Optional job ID for tracking */
  jobId?: string;
  /** Voice prompt for cloning (base64) */
  voicePrompt?: string;
}

/**
 * Response from multi-GPU generation.
 */
export interface GenerateResult {
  /** Base64-encoded MP4 video */
  video: string;
  /** Job ID for tracking */
  jobId: string;
  /** Number of GPUs used */
  gpuCount: number;
  /** Generation status */
  status: "completed" | "failed" | "queued" | "processing";
  /** Error message if failed */
  error?: string;
  /** Estimated generation time in seconds */
  estimatedTime?: number;
  /** Metadata about the generation */
  metadata?: {
    /** Actual duration of generated video */
    duration?: number;
    /** Frame count */
    frameCount?: number;
    /** Resolution used */
    resolution?: string;
  };
}

/**
 * Statistics about multi-GPU generation.
 */
export interface GenerationStats {
  /** Total videos generated */
  totalVideos: number;
  /** Average generation time */
  avgTime: number;
  /** Fastest generation time */
  fastestTime: number;
  /** Slowest generation time */
  slowestTime: number;
  /** Success rate (0-100) */
  successRate: number;
  /** GPU hours consumed */
  gpuHours: number;
}

/**
 * InfiniteTalk Multi-GPU Client
 *
 * Provides distributed video generation using PyTorch Distributed with multiple A100 GPUs.
 * Automatically selects optimal GPU configuration based on video duration and quality requirements.
 */
export class InfiniteTalkMultiGPUClient {
  private config: Required<InfiniteTalkMultiGPUConfig>;
  private endpoint: string;
  private stats: GenerationStats;

  constructor(config: InfiniteTalkMultiGPUConfig = {}) {
    this.config = {
      modalToken: config.modalToken || process.env.MODAL_TOKEN_ID || "",
      modalSecret: config.modalSecret || process.env.MODAL_TOKEN_SECRET || "",
      endpoint:
        config.endpoint ||
        `https://${process.env.MODAL_USER}--infinitetalk-multi-gpu.modal.run`,
      timeout: config.timeout || 1800000, // 30 minutes
      maxRetries: config.maxRetries || 3,
    };

    this.endpoint = config.endpoint || this.config.endpoint;

    this.stats = {
      totalVideos: 0,
      avgTime: 0,
      fastestTime: Infinity,
      slowestTime: 0,
      successRate: 0,
      gpuHours: 0,
    };
  }

  /**
   * Recommend optimal GPU count based on video duration and quality.
   *
   * @param duration Video duration in seconds
   * @param quality Quality level: "draft" (8 steps), "balanced" (16 steps), "quality" (24 steps)
   * @returns Recommended GPU count (2, 4, or 8)
   */
  public recommendGpuCount(
    duration: number,
    quality: "draft" | "balanced" | "quality" = "balanced"
  ): 2 | 4 | 8 {
    const stepCounts: Record<typeof quality, number> = {
      draft: 8,
      balanced: 16,
      quality: 24,
    };

    const totalSteps = duration * stepCounts[quality];

    // Heuristic: recommend GPUs based on total computation
    // 2 GPUs: up to ~10 second draft videos
    if (totalSteps <= 80) return 2;
    // 4 GPUs: up to ~20 second balanced videos
    if (totalSteps <= 320) return 4;
    // 8 GPUs: up to ~30 second quality videos
    return 8;
  }

  /**
   * Estimate generation time based on configuration.
   *
   * @param duration Video duration in seconds
   * @param numGpus Number of GPUs
   * @param resolution Video resolution
   * @returns Estimated time in seconds
   */
  public estimateTime(
    duration: number,
    numGpus: 2 | 4 | 8,
    resolution: "480p" | "720p" = "480p"
  ): number {
    // Base times for 480p at different GPU counts
    const baseTimes: Record<2 | 4 | 8, number> = {
      2: 60, // ~1 min for 5 sec video
      4: 45, // ~45 sec for 5 sec video (4x parallel)
      8: 30, // ~30 sec for 5 sec video (8x parallel)
    };

    // Resolution multiplier
    const resolutionMult = resolution === "720p" ? 1.5 : 1.0;

    // Duration scaling (not perfectly linear)
    const durationMult = Math.pow(duration / 5, 0.8);

    return Math.round(baseTimes[numGpus] * resolutionMult * durationMult);
  }

  /**
   * Encode file to base64 string.
   *
   * @param filePath Path to file
   * @returns Base64-encoded string
   */
  private encodeFile(filePath: string): string {
    const buffer = fs.readFileSync(filePath);
    return buffer.toString("base64");
  }

  /**
   * Decode base64 video and save to file.
   *
   * @param videoBase64 Base64-encoded video
   * @param outputPath Path to save video
   */
  private decodeAndSaveVideo(videoBase64: string, outputPath: string): void {
    const buffer = Buffer.from(videoBase64, "base64");
    fs.writeFileSync(outputPath, buffer);
  }

  /**
   * Generate talking head video using distributed multi-GPU inference.
   *
   * @param options Generation options
   * @returns Generation result with video and metadata
   *
   * @example
   * const result = await client.generate({
   *   image: "face.jpg",
   *   audio: "speech.wav",
   *   numGpus: 4,
   *   duration: 10,
   * });
   *
   * // Save video
   * fs.writeFileSync("output.mp4", Buffer.from(result.video, "base64"));
   */
  public async generate(options: GenerateOptions): Promise<GenerateResult> {
    // Validate inputs
    if (!options.image || !fs.existsSync(options.image)) {
      throw new Error(`Image file not found: ${options.image}`);
    }

    if (options.audio && !fs.existsSync(options.audio)) {
      throw new Error(`Audio file not found: ${options.audio}`);
    }

    if (!options.text && !options.audio) {
      throw new Error("Either text or audio must be provided");
    }

    // Determine GPU count
    const numGpus = options.numGpus || this.recommendGpuCount(options.duration || 5);
    const resolution = options.resolution || "480p";

    // Encode image
    const imageB64 = this.encodeFile(options.image);

    // Encode or prepare audio
    let audioB64: string | undefined;
    if (options.audio) {
      audioB64 = this.encodeFile(options.audio);
    }

    // Prepare request
    const request = {
      job_id: options.jobId || this.generateJobId(),
      script_text: options.text || "",
      ref_image_b64: imageB64,
      audio_b64: audioB64,
      voice_prompt_wav_b64: options.voicePrompt,
      seed: options.seed || 42,
      resolution,
      max_duration_sec: options.duration || 10,
      num_gpus: numGpus,
    };

    // Estimate time
    const estimatedTime = this.estimateTime(request.max_duration_sec, numGpus, resolution);

    // Call appropriate Modal function based on GPU count
    const result = await this.callModalFunction(numGpus, request);

    // Update stats
    this.updateStats(estimatedTime);

    return {
      ...result,
      estimatedTime,
      gpuCount: numGpus,
    };
  }

  /**
   * Call the appropriate Modal function based on GPU count.
   *
   * @param numGpus Number of GPUs
   * @param request Generation request
   * @returns Generation result
   */
  private async callModalFunction(
    numGpus: 2 | 4 | 8,
    request: any
  ): Promise<Omit<GenerateResult, "estimatedTime" | "gpuCount">> {
    // Map GPU counts to function names
    const functionMap: Record<2 | 4 | 8, string> = {
      2: "generate_multi_gpu",
      4: "generate_multi_gpu_4x",
      8: "generate_multi_gpu_8x",
    };

    const functionName = functionMap[numGpus];

    // Call Modal function
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.endpoint}/call/${functionName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.modalToken}`,
          },
          body: JSON.stringify(request),
          timeout: this.config.timeout,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        return await response.json();
      } catch (error) {
        if (attempt === this.config.maxRetries - 1) {
          throw error;
        }
        // Exponential backoff
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }

    throw new Error("Generation failed after retries");
  }

  /**
   * Batch generate multiple videos.
   *
   * @param optionsList Array of generation options
   * @returns Array of results
   */
  public async generateBatch(optionsList: GenerateOptions[]): Promise<GenerateResult[]> {
    const results: GenerateResult[] = [];

    for (const options of optionsList) {
      try {
        const result = await this.generate(options);
        results.push(result);
      } catch (error) {
        results.push({
          video: "",
          jobId: options.jobId || this.generateJobId(),
          gpuCount: options.numGpus || 2,
          status: "failed",
          error: String(error),
        });
      }
    }

    return results;
  }

  /**
   * Get generation statistics.
   *
   * @returns Generation statistics
   */
  public getStats(): GenerationStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics.
   */
  public resetStats(): void {
    this.stats = {
      totalVideos: 0,
      avgTime: 0,
      fastestTime: Infinity,
      slowestTime: 0,
      successRate: 0,
      gpuHours: 0,
    };
  }

  /**
   * Update statistics after generation.
   *
   * @param generationTime Time taken in seconds
   */
  private updateStats(generationTime: number): void {
    this.stats.totalVideos++;
    this.stats.fastestTime = Math.min(this.stats.fastestTime, generationTime);
    this.stats.slowestTime = Math.max(this.stats.slowestTime, generationTime);
    this.stats.avgTime =
      (this.stats.avgTime * (this.stats.totalVideos - 1) + generationTime) /
      this.stats.totalVideos;
  }

  /**
   * Generate unique job ID.
   *
   * @returns Job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep for specified milliseconds.
   *
   * @param ms Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create and return a singleton client instance.
 *
 * @param config Client configuration
 * @returns InfiniteTalkMultiGPUClient instance
 */
export function createInfiniteTalkMultiGPUClient(
  config?: InfiniteTalkMultiGPUConfig
): InfiniteTalkMultiGPUClient {
  return new InfiniteTalkMultiGPUClient(config);
}

/**
 * Default export for convenience.
 */
export default InfiniteTalkMultiGPUClient;
