/**
 * Custom Avatar Training API Client
 *
 * Train custom avatars from user-provided videos for InfiniteTalk and LongCat.
 *
 * Usage:
 * ```typescript
 * const trainer = new AvatarTrainer();
 * const result = await trainer.startTraining({
 *   avatarName: 'john_avatar',
 *   videoPath: './video.mp4',
 *   backend: 'infinitetalk',
 * });
 * ```
 */

import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';

/**
 * Supported avatar model backends
 */
export type AvatarBackend = 'infinitetalk' | 'longcat' | 'wav2lip';

/**
 * Training configuration
 */
export interface TrainingConfig {
  avatarName: string;           // Unique avatar identifier
  videoPath: string;            // Path to training video (MP4, MOV, etc)
  backend?: AvatarBackend;      // Model to train (default: infinitetalk)
  epochs?: number;              // Training epochs (default: 10)
  batchSize?: number;           // Batch size (default: 4)
  learningRate?: number;        // Learning rate (default: 2e-5)
  frameRate?: number;           // Extract frames at FPS (default: 25)
  targetFaceSize?: [number, number];  // Face size (default: [512, 512])
}

/**
 * Training status
 */
export interface TrainingStatus {
  jobId: string;
  status: 'queued' | 'preparing' | 'training' | 'validating' | 'complete' | 'failed';
  stage: string;
  progress: number;             // 0-100
  message: string;
  startedAt: string;
  estimatedCompletionAt?: string;
  metrics?: TrainingMetrics;
  errorMessage?: string;
}

/**
 * Training metrics
 */
export interface TrainingMetrics {
  totalFrames: number;
  facesDetected: number;
  detectionRate: number;        // % of frames with detected faces
  trainingFrames: number;
  validationFrames: number;
  testFrames: number;
  completedEpochs: number;
  totalEpochs: number;
  trainLoss: number[];          // Loss per epoch
  valLoss: number[];            // Validation loss per epoch
  valAccuracy: number[];        // Validation accuracy per epoch
  modelSizeMB: number;
  trainingTimeHours: number;
}

/**
 * Deployment info for trained avatar
 */
export interface DeploymentInfo {
  avatarId: string;
  status: 'deployed' | 'deploying' | 'failed';
  modelUrl?: string;
  inferenceEndpoint?: string;
  deployedAt?: string;
  qualityScore: number;         // 0-100
  recommendedSettings?: {
    qualityProfile: 'fast' | 'balanced' | 'quality';
    maxDurationSeconds: number;
  };
}

/**
 * API response for training job
 */
interface TrainingJobResponse {
  job_id: string;
  status: string;
  stage: string;
  progress: number;
  message: string;
  started_at: string;
  estimated_completion_at?: string;
  metrics?: Record<string, unknown>;
  error?: string;
}

/**
 * AvatarTrainer - Custom avatar training client
 *
 * Handles training of custom avatars from user videos.
 */
export class AvatarTrainer {
  private apiUrl: string;
  private apiKey?: string;

  constructor(apiUrl?: string, apiKey?: string) {
    this.apiUrl = apiUrl || process.env.AVATAR_TRAINING_API_URL || '';
    this.apiKey = apiKey || process.env.AVATAR_TRAINING_API_KEY;

    if (!this.apiUrl) {
      throw new Error(
        'Avatar training API URL required. Provide as constructor arg or AVATAR_TRAINING_API_URL env var'
      );
    }
  }

  /**
   * Start avatar training from video
   */
  async startTraining(config: TrainingConfig): Promise<TrainingStatus> {
    // Validate video file
    if (!fs.existsSync(config.videoPath)) {
      throw new Error(`Video file not found: ${config.videoPath}`);
    }

    const stats = fs.statSync(config.videoPath);
    if (stats.size === 0) {
      throw new Error('Video file is empty');
    }

    // Create form data with video file
    const form = new FormData();
    form.append('avatar_name', config.avatarName);
    form.append('video', fs.createReadStream(config.videoPath));
    form.append('backend', config.backend || 'infinitetalk');
    form.append('epochs', String(config.epochs || 10));
    form.append('batch_size', String(config.batchSize || 4));
    form.append('learning_rate', String(config.learningRate || 2e-5));
    form.append('frame_rate', String(config.frameRate || 25));

    if (config.targetFaceSize) {
      form.append('target_face_size', JSON.stringify(config.targetFaceSize));
    }

    const headers: Record<string, string> = {};

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(`${this.apiUrl}/train`, {
        method: 'POST',
        headers,
        body: form,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }

      const data = await response.json() as TrainingJobResponse;

      return this.convertResponse(data);
    } catch (error) {
      throw new Error(
        `Failed to start training: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get training job status
   */
  async getStatus(jobId: string): Promise<TrainingStatus> {
    const headers: Record<string, string> = {};

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(`${this.apiUrl}/jobs/${jobId}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json() as TrainingJobResponse;
      return this.convertResponse(data);
    } catch (error) {
      throw new Error(
        `Failed to get status: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Cancel training job
   */
  async cancelTraining(jobId: string): Promise<boolean> {
    const headers: Record<string, string> = {};

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(`${this.apiUrl}/jobs/${jobId}/cancel`, {
        method: 'POST',
        headers,
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to cancel training:', error);
      return false;
    }
  }

  /**
   * Deploy trained avatar
   */
  async deployAvatar(jobId: string): Promise<DeploymentInfo> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(`${this.apiUrl}/jobs/${jobId}/deploy`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json() as {
        avatar_id: string;
        status: string;
        model_url?: string;
        inference_endpoint?: string;
        deployed_at?: string;
        quality_score: number;
        recommended_settings?: Record<string, unknown>;
      };

      return {
        avatarId: data.avatar_id,
        status: data.status as 'deployed' | 'deploying' | 'failed',
        modelUrl: data.model_url,
        inferenceEndpoint: data.inference_endpoint,
        deployedAt: data.deployed_at,
        qualityScore: data.quality_score,
        recommendedSettings: data.recommended_settings as unknown as {
          qualityProfile: 'fast' | 'balanced' | 'quality';
          maxDurationSeconds: number;
        } | undefined,
      };
    } catch (error) {
      throw new Error(
        `Deployment failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * List trained avatars
   */
  async listAvatars(): Promise<Array<{
    id: string;
    name: string;
    backend: AvatarBackend;
    trainingCompleted: boolean;
    qualityScore: number;
    createdAt: string;
  }>> {
    const headers: Record<string, string> = {};

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(`${this.apiUrl}/avatars`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json() as {
        avatars: Array<{
          id: string;
          name: string;
          backend: string;
          training_completed: boolean;
          quality_score: number;
          created_at: string;
        }>;
      };

      return data.avatars.map(a => ({
        id: a.id,
        name: a.name,
        backend: a.backend as AvatarBackend,
        trainingCompleted: a.training_completed,
        qualityScore: a.quality_score,
        createdAt: a.created_at,
      }));
    } catch (error) {
      console.error('Failed to list avatars:', error);
      return [];
    }
  }

  /**
   * Delete avatar
   */
  async deleteAvatar(avatarId: string): Promise<boolean> {
    const headers: Record<string, string> = {};

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(`${this.apiUrl}/avatars/${avatarId}`, {
        method: 'DELETE',
        headers,
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to delete avatar:', error);
      return false;
    }
  }

  /**
   * Convert API response to TrainingStatus
   */
  private convertResponse(data: TrainingJobResponse): TrainingStatus {
    return {
      jobId: data.job_id,
      status: data.status as 'queued' | 'preparing' | 'training' | 'validating' | 'complete' | 'failed',
      stage: data.stage,
      progress: data.progress,
      message: data.message,
      startedAt: data.started_at,
      estimatedCompletionAt: data.estimated_completion_at,
      metrics: data.metrics as unknown as TrainingMetrics | undefined,
      errorMessage: data.error,
    };
  }
}

/**
 * Export convenience functions
 */

/**
 * Create trainer with environment variables
 */
export function createAvatarTrainer(): AvatarTrainer {
  const apiUrl = process.env.AVATAR_TRAINING_API_URL;

  if (!apiUrl) {
    throw new Error('AVATAR_TRAINING_API_URL environment variable is required');
  }

  return new AvatarTrainer(apiUrl);
}

/**
 * Monitor training job until complete
 */
export async function monitorTraining(
  trainer: AvatarTrainer,
  jobId: string,
  pollIntervalSeconds = 10,
  maxWaitHours = 12
): Promise<TrainingStatus> {
  const maxPollAttempts = (maxWaitHours * 3600) / pollIntervalSeconds;
  let attempts = 0;

  while (attempts < maxPollAttempts) {
    const status = await trainer.getStatus(jobId);

    console.log(`[${new Date().toISOString()}] ${status.stage} - ${status.progress}%`);

    if (status.status === 'complete' || status.status === 'failed') {
      return status;
    }

    attempts++;
    await new Promise(resolve => setTimeout(resolve, pollIntervalSeconds * 1000));
  }

  throw new Error(`Training timeout after ${maxWaitHours} hours`);
}
