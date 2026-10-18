/**
 * Job Queue System
 *
 * Redis-like in-memory job queue with:
 * - Async job processing
 * - Job status tracking
 * - Retry mechanism
 * - Webhook callbacks
 *
 * Can be extended to use actual Redis backend for distributed systems.
 */

import * as crypto from 'crypto';

// =============================================================================
// Types
// =============================================================================

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface JobInput {
  [key: string]: any;
}

export interface JobResult {
  [key: string]: any;
}

export interface Job {
  id: string;
  type: string;
  status: JobStatus;
  priority: number;
  input: JobInput;
  result?: JobResult;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  retries: number;
  maxRetries: number;
  webhookUrl?: string;
}

export interface QueueConfig {
  maxConcurrent?: number;
  defaultMaxRetries?: number;
  defaultPriority?: number;
  jobTimeout?: number; // milliseconds
}

export type JobHandler = (input: JobInput) => Promise<JobResult>;

// =============================================================================
// Job Queue
// =============================================================================

export class JobQueue {
  private jobs: Map<string, Job> = new Map();
  private handlers: Map<string, JobHandler> = new Map();
  private queue: string[] = []; // Array of job IDs
  private config: Required<QueueConfig>;
  private processing: Set<string> = new Set();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: QueueConfig = {}) {
    this.config = {
      maxConcurrent: config.maxConcurrent || 5,
      defaultMaxRetries: config.defaultMaxRetries || 3,
      defaultPriority: config.defaultPriority || 0,
      jobTimeout: config.jobTimeout || 300000, // 5 minutes
    };
  }

  // Register job handler
  registerHandler(jobType: string, handler: JobHandler): void {
    this.handlers.set(jobType, handler);
  }

  // Enqueue a job
  enqueue(
    type: string,
    input: JobInput,
    options?: {
      priority?: number;
      maxRetries?: number;
      webhookUrl?: string;
    }
  ): string {
    const jobId = crypto.randomUUID();

    const job: Job = {
      id: jobId,
      type,
      status: 'pending',
      priority: options?.priority ?? this.config.defaultPriority,
      input,
      retries: 0,
      maxRetries: options?.maxRetries ?? this.config.defaultMaxRetries,
      webhookUrl: options?.webhookUrl,
      createdAt: Date.now(),
    };

    this.jobs.set(jobId, job);
    this.queue.push(jobId);

    // Sort by priority (higher first) then by creation time
    this.queue.sort((a, b) => {
      const jobA = this.jobs.get(a)!;
      const jobB = this.jobs.get(b)!;
      if (jobA.priority !== jobB.priority) {
        return jobB.priority - jobA.priority;
      }
      return jobA.createdAt - jobB.createdAt;
    });

    // Start processing if we have capacity
    this.processNext();

    return jobId;
  }

  // Get job status
  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  // Get all jobs
  getAllJobs(filter?: { status?: JobStatus; type?: string }): Job[] {
    const jobs = Array.from(this.jobs.values());

    if (!filter) return jobs;

    return jobs.filter(job => {
      if (filter.status && job.status !== filter.status) return false;
      if (filter.type && job.type !== filter.type) return false;
      return true;
    });
  }

  // Cancel a job
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.status === 'completed' || job.status === 'failed') {
      return false;
    }

    job.status = 'cancelled';

    // Clear timeout if exists
    const timeoutId = this.timers.get(jobId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timers.delete(jobId);
    }

    // Remove from queue if pending
    const index = this.queue.indexOf(jobId);
    if (index >= 0) {
      this.queue.splice(index, 1);
    }

    // Remove from processing if running
    this.processing.delete(jobId);

    return true;
  }

  // Process next jobs
  private async processNext(): Promise<void> {
    if (this.processing.size >= this.config.maxConcurrent) {
      return;
    }

    const nextJobId = this.queue.find(id => !this.processing.has(id));
    if (!nextJobId) {
      return;
    }

    const job = this.jobs.get(nextJobId)!;
    this.processing.add(nextJobId);

    try {
      await this.processJob(job);
    } catch (err) {
      console.error(`Job ${job.id} failed with error:`, err);
    } finally {
      this.processing.delete(nextJobId);
      this.processNext();
    }
  }

  // Process individual job
  private async processJob(job: Job): Promise<void> {
    job.status = 'processing';
    job.startedAt = Date.now();

    const handler = this.handlers.get(job.type);
    if (!handler) {
      job.status = 'failed';
      job.error = `No handler registered for job type: ${job.type}`;
      job.completedAt = Date.now();
      await this.triggerWebhook(job);
      return;
    }

    // Set timeout
    const timeoutId = setTimeout(() => {
      job.status = 'failed';
      job.error = 'Job timeout';
      job.completedAt = Date.now();
    }, this.config.jobTimeout);

    try {
      const result = await handler(job.input);
      clearTimeout(timeoutId);
      this.timers.delete(job.id);

      job.result = result;
      job.status = 'completed';
      job.completedAt = Date.now();

      await this.triggerWebhook(job);
    } catch (err) {
      clearTimeout(timeoutId);
      this.timers.delete(job.id);

      const errorMessage = err instanceof Error ? err.message : String(err);

      if (job.retries < job.maxRetries) {
        job.retries++;
        job.status = 'pending';
        job.startedAt = undefined;
        // Re-add to queue for retry
        this.queue.push(job.id);
      } else {
        job.status = 'failed';
        job.error = errorMessage;
        job.completedAt = Date.now();
        await this.triggerWebhook(job);
      }
    }
  }

  // Trigger webhook on job completion
  private async triggerWebhook(job: Job): Promise<void> {
    if (!job.webhookUrl) return;

    const payload = {
      jobId: job.id,
      type: job.type,
      status: job.status,
      result: job.result,
      error: job.error,
      completedAt: job.completedAt,
      duration: job.completedAt ? job.completedAt - (job.startedAt || 0) : undefined,
    };

    try {
      const url = new URL(job.webhookUrl);
      const protocol = url.protocol === 'https:' ? require('https') : require('http');

      const body = JSON.stringify(payload);

      return new Promise((resolve, reject) => {
        const req = protocol.request(
          {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(body),
            },
            timeout: 10000,
          },
          (res: any) => {
            res.on('data', () => {}); // drain
            res.on('end', () => resolve());
          }
        );

        req.on('error', err => {
          console.error(`Webhook request failed: ${err.message}`);
          resolve(); // Don't fail job on webhook error
        });

        req.write(body);
        req.end();
      });
    } catch (err) {
      console.error(`Failed to trigger webhook: ${err}`);
    }
  }

  // Get queue stats
  getStats(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    cancelled: number;
  } {
    const jobs = Array.from(this.jobs.values());

    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      cancelled: jobs.filter(j => j.status === 'cancelled').length,
    };
  }

  // Wait for all jobs to complete
  async waitForCompletion(pollInterval: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      const checkCompletion = () => {
        const pendingOrProcessing = Array.from(this.jobs.values()).some(
          job => job.status === 'pending' || job.status === 'processing'
        );

        if (!pendingOrProcessing) {
          resolve();
        } else {
          setTimeout(checkCompletion, pollInterval);
        }
      };

      checkCompletion();
    });
  }

  // Clean up old jobs (optional maintenance)
  cleanup(olderThanMs: number = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - olderThanMs;
    let removed = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') &&
        job.completedAt &&
        job.completedAt < cutoff
      ) {
        this.jobs.delete(jobId);
        removed++;
      }
    }

    return removed;
  }
}

export default JobQueue;
