/**
 * Render Queue Service - ADS-009
 * BullMQ/Redis queue for managing render jobs
 *
 * This service provides a robust job queue for managing ad rendering tasks
 * with features like priority, progress tracking, retry logic, and status monitoring.
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import type { AdTemplate } from '../types/adTemplate';
import { renderStill, renderAdTemplate, type RenderStillOptions, type RenderStillResult } from './renderStill';

/**
 * Job types supported by the render queue
 */
export enum RenderJobType {
  SINGLE = 'single',           // Render a single composition
  TEMPLATE = 'template',       // Render an ad template
  BATCH = 'batch',            // Render multiple compositions
  CAMPAIGN = 'campaign',      // Render a campaign pack (all sizes)
}

/**
 * Job priority levels
 */
export enum JobPriority {
  LOW = 10,
  NORMAL = 5,
  HIGH = 1,
  URGENT = 0,
}

/**
 * Job data for single composition render
 */
export interface SingleRenderJobData {
  type: RenderJobType.SINGLE;
  compositionId: string;
  options?: RenderStillOptions;
  metadata?: Record<string, any>;
}

/**
 * Job data for template render
 */
export interface TemplateRenderJobData {
  type: RenderJobType.TEMPLATE;
  template: AdTemplate;
  options?: RenderStillOptions;
  metadata?: Record<string, any>;
}

/**
 * Job data for batch render
 */
export interface BatchRenderJobData {
  type: RenderJobType.BATCH;
  compositionIds: string[];
  options?: RenderStillOptions;
  metadata?: Record<string, any>;
}

/**
 * Job data for campaign render
 */
export interface CampaignRenderJobData {
  type: RenderJobType.CAMPAIGN;
  templates: AdTemplate[];
  options?: RenderStillOptions;
  metadata?: Record<string, any>;
}

/**
 * Union type for all job data types
 */
export type RenderJobData =
  | SingleRenderJobData
  | TemplateRenderJobData
  | BatchRenderJobData
  | CampaignRenderJobData;

/**
 * Job result data
 */
export interface RenderJobResult {
  success: boolean;
  results: RenderStillResult[];
  totalRendered: number;
  totalFailed: number;
  startTime: number;
  endTime: number;
  duration: number;
  error?: string;
}

/**
 * Job progress data
 */
export interface RenderJobProgress {
  current: number;
  total: number;
  percentage: number;
  currentItem?: string;
}

/**
 * Queue configuration options
 */
export interface QueueConfig {
  redis?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  };
  defaultJobOptions?: {
    attempts?: number;
    backoff?: {
      type: string;
      delay: number;
    };
    removeOnComplete?: boolean | number;
    removeOnFail?: boolean | number;
  };
}

/**
 * Default Redis configuration
 */
const DEFAULT_REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: null, // Required for BullMQ
};

/**
 * Default job options
 */
const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: 500,     // Keep last 500 failed jobs
};

/**
 * RenderQueue class - Main queue management
 */
export class RenderQueue {
  private queue: Queue<RenderJobData, RenderJobResult>;
  private worker: Worker<RenderJobData, RenderJobResult> | null = null;
  private queueEvents: QueueEvents | null = null;
  private redis: Redis;

  constructor(config: QueueConfig = {}) {
    // Create Redis connection
    this.redis = new Redis({
      ...DEFAULT_REDIS_CONFIG,
      ...config.redis,
    });

    // Create queue
    this.queue = new Queue<RenderJobData, RenderJobResult>('render-queue', {
      connection: this.redis,
      defaultJobOptions: {
        ...DEFAULT_JOB_OPTIONS,
        ...config.defaultJobOptions,
      },
    });
  }

  /**
   * Add a single composition render job
   */
  async addSingleRenderJob(
    compositionId: string,
    options?: RenderStillOptions,
    priority: JobPriority = JobPriority.NORMAL,
    metadata?: Record<string, any>
  ): Promise<Job<RenderJobData, RenderJobResult>> {
    const jobData: SingleRenderJobData = {
      type: RenderJobType.SINGLE,
      compositionId,
      options,
      metadata,
    };

    return this.queue.add('render-single', jobData, {
      priority,
      jobId: `single-${compositionId}-${Date.now()}`,
    });
  }

  /**
   * Add a template render job
   */
  async addTemplateRenderJob(
    template: AdTemplate,
    options?: RenderStillOptions,
    priority: JobPriority = JobPriority.NORMAL,
    metadata?: Record<string, any>
  ): Promise<Job<RenderJobData, RenderJobResult>> {
    const jobData: TemplateRenderJobData = {
      type: RenderJobType.TEMPLATE,
      template,
      options,
      metadata,
    };

    return this.queue.add('render-template', jobData, {
      priority,
      jobId: `template-${template.id}-${Date.now()}`,
    });
  }

  /**
   * Add a batch render job
   */
  async addBatchRenderJob(
    compositionIds: string[],
    options?: RenderStillOptions,
    priority: JobPriority = JobPriority.NORMAL,
    metadata?: Record<string, any>
  ): Promise<Job<RenderJobData, RenderJobResult>> {
    const jobData: BatchRenderJobData = {
      type: RenderJobType.BATCH,
      compositionIds,
      options,
      metadata,
    };

    return this.queue.add('render-batch', jobData, {
      priority,
      jobId: `batch-${Date.now()}`,
    });
  }

  /**
   * Add a campaign render job
   */
  async addCampaignRenderJob(
    templates: AdTemplate[],
    options?: RenderStillOptions,
    priority: JobPriority = JobPriority.NORMAL,
    metadata?: Record<string, any>
  ): Promise<Job<RenderJobData, RenderJobResult>> {
    const jobData: CampaignRenderJobData = {
      type: RenderJobType.CAMPAIGN,
      templates,
      options,
      metadata,
    };

    return this.queue.add('render-campaign', jobData, {
      priority,
      jobId: `campaign-${Date.now()}`,
    });
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job<RenderJobData, RenderJobResult> | undefined> {
    return this.queue.getJob(jobId);
  }

  /**
   * Get job state
   */
  async getJobState(jobId: string): Promise<string | 'unknown'> {
    const job = await this.getJob(jobId);
    if (!job) return 'unknown';
    return job.getState();
  }

  /**
   * Get job progress
   */
  async getJobProgress(jobId: string): Promise<RenderJobProgress | null> {
    const job = await this.getJob(jobId);
    if (!job) return null;

    const progress = job.progress as RenderJobProgress;
    return progress || null;
  }

  /**
   * Get all jobs
   */
  async getJobs(status: 'active' | 'waiting' | 'completed' | 'failed' | 'delayed' = 'active') {
    switch (status) {
      case 'active':
        return this.queue.getActive();
      case 'waiting':
        return this.queue.getWaiting();
      case 'completed':
        return this.queue.getCompleted();
      case 'failed':
        return this.queue.getFailed();
      case 'delayed':
        return this.queue.getDelayed();
      default:
        return [];
    }
  }

  /**
   * Get queue stats
   */
  async getStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Pause the queue
   */
  async pause() {
    await this.queue.pause();
  }

  /**
   * Resume the queue
   */
  async resume() {
    await this.queue.resume();
  }

  /**
   * Clear all jobs
   */
  async clear() {
    await this.queue.drain();
  }

  /**
   * Remove a job
   */
  async removeJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (job) {
      await job.retry();
    }
  }

  /**
   * Start the worker to process jobs
   */
  startWorker(concurrency: number = 1) {
    if (this.worker) {
      console.warn('Worker already started');
      return;
    }

    this.worker = new Worker<RenderJobData, RenderJobResult>(
      'render-queue',
      async (job: Job<RenderJobData, RenderJobResult>) => {
        return this.processJob(job);
      },
      {
        connection: this.redis,
        concurrency,
      }
    );

    // Worker event listeners
    this.worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed:`, err.message);
    });

    this.worker.on('error', (err) => {
      console.error('Worker error:', err);
    });

    console.log(`Worker started with concurrency: ${concurrency}`);
  }

  /**
   * Stop the worker
   */
  async stopWorker() {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
      console.log('Worker stopped');
    }
  }

  /**
   * Process a job based on its type
   */
  private async processJob(job: Job<RenderJobData, RenderJobResult>): Promise<RenderJobResult> {
    const startTime = Date.now();
    const results: RenderStillResult[] = [];

    try {
      switch (job.data.type) {
        case RenderJobType.SINGLE:
          return await this.processSingleRender(job as Job<SingleRenderJobData, RenderJobResult>);

        case RenderJobType.TEMPLATE:
          return await this.processTemplateRender(job as Job<TemplateRenderJobData, RenderJobResult>);

        case RenderJobType.BATCH:
          return await this.processBatchRender(job as Job<BatchRenderJobData, RenderJobResult>);

        case RenderJobType.CAMPAIGN:
          return await this.processCampaignRender(job as Job<CampaignRenderJobData, RenderJobResult>);

        default:
          throw new Error(`Unknown job type: ${(job.data as any).type}`);
      }
    } catch (error) {
      const endTime = Date.now();
      return {
        success: false,
        results,
        totalRendered: 0,
        totalFailed: 1,
        startTime,
        endTime,
        duration: endTime - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Process a single render job
   */
  private async processSingleRender(
    job: Job<SingleRenderJobData, RenderJobResult>
  ): Promise<RenderJobResult> {
    const startTime = Date.now();
    const { compositionId, options } = job.data;

    // Update progress
    await job.updateProgress({
      current: 0,
      total: 1,
      percentage: 0,
      currentItem: compositionId,
    });

    const result = await renderStill(compositionId, options);

    // Update progress
    await job.updateProgress({
      current: 1,
      total: 1,
      percentage: 100,
      currentItem: compositionId,
    });

    const endTime = Date.now();
    return {
      success: result.success,
      results: [result],
      totalRendered: result.success ? 1 : 0,
      totalFailed: result.success ? 0 : 1,
      startTime,
      endTime,
      duration: endTime - startTime,
      error: result.error,
    };
  }

  /**
   * Process a template render job
   */
  private async processTemplateRender(
    job: Job<TemplateRenderJobData, RenderJobResult>
  ): Promise<RenderJobResult> {
    const startTime = Date.now();
    const { template, options } = job.data;

    // Update progress
    await job.updateProgress({
      current: 0,
      total: 1,
      percentage: 0,
      currentItem: template.id,
    });

    const result = await renderAdTemplate(template, options);

    // Update progress
    await job.updateProgress({
      current: 1,
      total: 1,
      percentage: 100,
      currentItem: template.id,
    });

    const endTime = Date.now();
    return {
      success: result.success,
      results: [result],
      totalRendered: result.success ? 1 : 0,
      totalFailed: result.success ? 0 : 1,
      startTime,
      endTime,
      duration: endTime - startTime,
      error: result.error,
    };
  }

  /**
   * Process a batch render job
   */
  private async processBatchRender(
    job: Job<BatchRenderJobData, RenderJobResult>
  ): Promise<RenderJobResult> {
    const startTime = Date.now();
    const { compositionIds, options } = job.data;
    const results: RenderStillResult[] = [];
    let totalRendered = 0;
    let totalFailed = 0;

    for (let i = 0; i < compositionIds.length; i++) {
      const compositionId = compositionIds[i];

      // Update progress
      await job.updateProgress({
        current: i,
        total: compositionIds.length,
        percentage: Math.round((i / compositionIds.length) * 100),
        currentItem: compositionId,
      });

      const result = await renderStill(compositionId, options);
      results.push(result);

      if (result.success) {
        totalRendered++;
      } else {
        totalFailed++;
      }
    }

    // Final progress update
    await job.updateProgress({
      current: compositionIds.length,
      total: compositionIds.length,
      percentage: 100,
    });

    const endTime = Date.now();
    return {
      success: totalFailed === 0,
      results,
      totalRendered,
      totalFailed,
      startTime,
      endTime,
      duration: endTime - startTime,
    };
  }

  /**
   * Process a campaign render job
   */
  private async processCampaignRender(
    job: Job<CampaignRenderJobData, RenderJobResult>
  ): Promise<RenderJobResult> {
    const startTime = Date.now();
    const { templates, options } = job.data;
    const results: RenderStillResult[] = [];
    let totalRendered = 0;
    let totalFailed = 0;

    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];

      // Update progress
      await job.updateProgress({
        current: i,
        total: templates.length,
        percentage: Math.round((i / templates.length) * 100),
        currentItem: template.id,
      });

      const result = await renderAdTemplate(template, options);
      results.push(result);

      if (result.success) {
        totalRendered++;
      } else {
        totalFailed++;
      }
    }

    // Final progress update
    await job.updateProgress({
      current: templates.length,
      total: templates.length,
      percentage: 100,
    });

    const endTime = Date.now();
    return {
      success: totalFailed === 0,
      results,
      totalRendered,
      totalFailed,
      startTime,
      endTime,
      duration: endTime - startTime,
    };
  }

  /**
   * Setup queue events listener
   */
  setupEventListener(
    onCompleted?: (jobId: string, result: RenderJobResult) => void,
    onFailed?: (jobId: string, error: Error) => void,
    onProgress?: (jobId: string, progress: RenderJobProgress) => void
  ) {
    if (this.queueEvents) {
      console.warn('Event listener already setup');
      return;
    }

    this.queueEvents = new QueueEvents('render-queue', {
      connection: this.redis,
    });

    if (onCompleted) {
      this.queueEvents.on('completed', ({ jobId, returnvalue }) => {
        onCompleted(jobId, returnvalue);
      });
    }

    if (onFailed) {
      this.queueEvents.on('failed', ({ jobId, failedReason }) => {
        onFailed(jobId, new Error(failedReason));
      });
    }

    if (onProgress) {
      this.queueEvents.on('progress', ({ jobId, data }) => {
        onProgress(jobId, data as RenderJobProgress);
      });
    }
  }

  /**
   * Close all connections
   */
  async close() {
    await this.stopWorker();

    if (this.queueEvents) {
      await this.queueEvents.close();
      this.queueEvents = null;
    }

    await this.queue.close();
    await this.redis.quit();

    console.log('Queue closed');
  }
}

/**
 * Create a singleton instance of the render queue
 */
let renderQueueInstance: RenderQueue | null = null;

/**
 * Get the render queue instance (singleton)
 */
export function getRenderQueue(config?: QueueConfig): RenderQueue {
  if (!renderQueueInstance) {
    renderQueueInstance = new RenderQueue(config);
  }
  return renderQueueInstance;
}

/**
 * Close the render queue instance
 */
export async function closeRenderQueue() {
  if (renderQueueInstance) {
    await renderQueueInstance.close();
    renderQueueInstance = null;
  }
}
