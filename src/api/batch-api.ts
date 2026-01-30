/**
 * Batch Processing API Handler
 *
 * Handles batch video rendering requests with:
 * - Job queuing and concurrent processing
 * - Status tracking and webhooks
 * - Batch management and cancellation
 */

import { JobQueue, Job, JobStatus } from './job-queue';
import { generateBrief, GeneratorInput } from '../../scripts/generate-brief';
import { ContentBrief } from '../types';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// =============================================================================
// Types
// =============================================================================

export interface BatchRequest {
  videos: GeneratorInput[];
  outputDir?: string;
  quality?: 'preview' | 'production';
  webhook?: string;
}

export interface BatchResponse {
  batchId: string;
  status: 'queued' | 'processing' | 'completed';
  jobIds: string[];
  stats: BatchStats;
}

export interface BatchStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
  avgDurationSec?: number;
}

export interface BatchJob {
  videoTitle: string;
  jobId: string;
  status: JobStatus;
  duration?: number;
  error?: string;
}

// =============================================================================
// Batch API Handler
// =============================================================================

export class BatchAPIHandler {
  private queue: JobQueue;
  private batches: Map<string, BatchInfo> = new Map();

  constructor(queue: JobQueue) {
    this.queue = queue;

    // Register render handler if not already registered
    this.queue.registerHandler('render-video', this.createRenderHandler());
  }

  /**
   * Create a render video handler
   */
  private createRenderHandler() {
    return async (input: any) => {
      const { brief, outputPath, quality, title } = input;

      try {
        const propsJson = JSON.stringify({ brief });
        const crf = quality === 'preview' ? 28 : 18;

        execSync(
          `npx remotion render BriefComposition "${outputPath}" --props='${propsJson}' --crf=${crf}`,
          {
            cwd: path.resolve(__dirname, '../..'),
            stdio: 'pipe',
          }
        );

        const stats = fs.statSync(outputPath);

        return {
          success: true,
          videoPath: outputPath,
          size: stats.size,
          duration: brief.settings.duration_sec,
          title,
        };
      } catch (error) {
        throw new Error(
          `Render failed for "${title}": ${error instanceof Error ? error.message : String(error)}`
        );
      }
    };
  }

  /**
   * Submit a batch for processing
   */
  async submitBatch(request: BatchRequest): Promise<BatchResponse> {
    const batchId = this.generateBatchId();
    const outputDir = request.outputDir || './output/batch';

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const jobIds: string[] = [];
    const videoMetadata: Map<string, { input: GeneratorInput; title: string }> = new Map();

    // Enqueue all videos
    for (const input of request.videos) {
      try {
        const brief = generateBrief(input);
        const filename = this.sanitizeFilename(input.title) + '.mp4';
        const outputPath = path.join(outputDir, filename);

        const jobId = this.queue.enqueue(
          'render-video',
          {
            brief,
            outputPath,
            quality: request.quality || 'production',
            title: input.title,
          },
          {
            priority: 0,
            maxRetries: 2,
            webhookUrl: request.webhook,
          }
        );

        jobIds.push(jobId);
        videoMetadata.set(jobId, { input, title: input.title });
      } catch (error) {
        console.error(
          `Failed to enqueue ${input.title}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    // Store batch info
    this.batches.set(batchId, {
      batchId,
      jobIds,
      videoMetadata,
      createdAt: Date.now(),
      request,
    });

    return {
      batchId,
      status: 'queued',
      jobIds,
      stats: this.calculateBatchStats(jobIds),
    };
  }

  /**
   * Get batch status
   */
  getBatchStatus(batchId: string): BatchResponse | null {
    const batch = this.batches.get(batchId);
    if (!batch) return null;

    return {
      batchId,
      status: this.calculateBatchStatus(batch.jobIds),
      jobIds: batch.jobIds,
      stats: this.calculateBatchStats(batch.jobIds),
    };
  }

  /**
   * Get detailed batch status with individual job results
   */
  getBatchDetails(batchId: string): BatchJobDetails | null {
    const batch = this.batches.get(batchId);
    if (!batch) return null;

    const jobs: BatchJob[] = batch.jobIds.map(jobId => {
      const job = this.queue.getJob(jobId);
      if (!job) {
        return { videoTitle: 'Unknown', jobId, status: 'failed' as JobStatus };
      }

      const metadata = batch.videoMetadata.get(jobId);
      const duration = job.completedAt ? job.completedAt - (job.startedAt || 0) : undefined;

      return {
        videoTitle: metadata?.title || job.id,
        jobId,
        status: job.status,
        duration: duration ? Math.round(duration / 1000) : undefined,
        error: job.error,
      };
    });

    return {
      batchId,
      createdAt: batch.createdAt,
      request: batch.request,
      jobs,
      stats: this.calculateBatchStats(batch.jobIds),
    };
  }

  /**
   * Cancel a batch
   */
  cancelBatch(batchId: string): boolean {
    const batch = this.batches.get(batchId);
    if (!batch) return false;

    let cancelled = 0;
    for (const jobId of batch.jobIds) {
      if (this.queue.cancelJob(jobId)) {
        cancelled++;
      }
    }

    return cancelled > 0;
  }

  /**
   * List all batches with status
   */
  listBatches(): BatchSummary[] {
    return Array.from(this.batches.values()).map(batch => ({
      batchId: batch.batchId,
      createdAt: batch.createdAt,
      videoCount: batch.jobIds.length,
      status: this.calculateBatchStatus(batch.jobIds),
      stats: this.calculateBatchStats(batch.jobIds),
    }));
  }

  /**
   * Clean up old batches
   */
  cleanupBatches(olderThanHours: number = 24): number {
    const cutoff = Date.now() - olderThanHours * 60 * 60 * 1000;
    let removed = 0;

    for (const [batchId, batch] of this.batches.entries()) {
      if (batch.createdAt < cutoff) {
        this.batches.delete(batchId);
        removed++;
      }
    }

    return removed;
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  private generateBatchId(): string {
    return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeFilename(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private calculateBatchStatus(jobIds: string[]): 'queued' | 'processing' | 'completed' {
    if (jobIds.length === 0) return 'completed';

    const pendingOrProcessing = jobIds.some(id => {
      const job = this.queue.getJob(id);
      return job && (job.status === 'pending' || job.status === 'processing');
    });

    if (pendingOrProcessing) {
      return 'processing';
    }

    return 'completed';
  }

  private calculateBatchStats(jobIds: string[]): BatchStats {
    let completed = 0;
    let failed = 0;
    let pending = 0;
    let processing = 0;
    let totalDuration = 0;
    let completedCount = 0;

    for (const jobId of jobIds) {
      const job = this.queue.getJob(jobId);
      if (!job) continue;

      switch (job.status) {
        case 'completed':
          completed++;
          if (job.completedAt && job.startedAt) {
            totalDuration += job.completedAt - job.startedAt;
            completedCount++;
          }
          break;
        case 'failed':
          failed++;
          break;
        case 'pending':
          pending++;
          break;
        case 'processing':
          processing++;
          break;
      }
    }

    return {
      total: jobIds.length,
      completed,
      failed,
      pending,
      processing,
      avgDurationSec: completedCount > 0 ? Math.round(totalDuration / completedCount / 1000) : undefined,
    };
  }
}

// =============================================================================
// Type Definitions
// =============================================================================

interface BatchInfo {
  batchId: string;
  jobIds: string[];
  videoMetadata: Map<string, { input: GeneratorInput; title: string }>;
  createdAt: number;
  request: BatchRequest;
}

export interface BatchJobDetails {
  batchId: string;
  createdAt: number;
  request: BatchRequest;
  jobs: BatchJob[];
  stats: BatchStats;
}

export interface BatchSummary {
  batchId: string;
  createdAt: number;
  videoCount: number;
  status: 'queued' | 'processing' | 'completed';
  stats: BatchStats;
}

export default BatchAPIHandler;
