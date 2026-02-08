/**
 * Batch Resume
 *
 * Tracks pipeline stage progress and enables resuming interrupted batches.
 * Each stage writes a checkpoint; on resume, we skip completed stages.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { AdBatch, NanoBananaOutput, VeoAnimateOutput } from './types';

// =============================================================================
// Checkpoint Types
// =============================================================================

export interface PipelineCheckpoint {
  batchId: string;
  batchDir: string;
  stage: PipelineStage;
  completedStages: PipelineStage[];
  stageData: Partial<StageArtifacts>;
  startedAt: string;
  updatedAt: string;
  error?: string;
}

export type PipelineStage =
  | 'variants'
  | 'nano_banana'
  | 'veo_animate'
  | 'remotion_compose'
  | 'complete';

export interface StageArtifacts {
  variants: { count: number; path: string };
  nanoBanana: { pairs: number; outputDir: string; manifestPath: string };
  veoAnimate: { videoPath: string; jobId: string; pairId: string };
  remotionCompose: { composedCount: number; outputDir: string };
}

const CHECKPOINT_FILE = 'checkpoint.json';

// =============================================================================
// Checkpoint Management
// =============================================================================

export function saveCheckpoint(checkpoint: PipelineCheckpoint): void {
  checkpoint.updatedAt = new Date().toISOString();
  const checkpointPath = path.join(checkpoint.batchDir, CHECKPOINT_FILE);
  fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));
}

export function loadCheckpoint(batchDir: string): PipelineCheckpoint | null {
  const checkpointPath = path.join(batchDir, CHECKPOINT_FILE);
  if (!fs.existsSync(checkpointPath)) return null;

  try {
    return JSON.parse(fs.readFileSync(checkpointPath, 'utf-8'));
  } catch {
    return null;
  }
}

export function createCheckpoint(batchId: string, batchDir: string): PipelineCheckpoint {
  return {
    batchId,
    batchDir,
    stage: 'variants',
    completedStages: [],
    stageData: {},
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function markStageComplete(
  checkpoint: PipelineCheckpoint,
  stage: PipelineStage,
  artifacts?: Partial<StageArtifacts>
): void {
  if (!checkpoint.completedStages.includes(stage)) {
    checkpoint.completedStages.push(stage);
  }

  // Advance to next stage
  const stageOrder: PipelineStage[] = ['variants', 'nano_banana', 'veo_animate', 'remotion_compose', 'complete'];
  const currentIndex = stageOrder.indexOf(stage);
  if (currentIndex < stageOrder.length - 1) {
    checkpoint.stage = stageOrder[currentIndex + 1];
  } else {
    checkpoint.stage = 'complete';
  }

  if (artifacts) {
    checkpoint.stageData = { ...checkpoint.stageData, ...artifacts };
  }

  saveCheckpoint(checkpoint);
}

export function markStageError(
  checkpoint: PipelineCheckpoint,
  error: string
): void {
  checkpoint.error = error;
  saveCheckpoint(checkpoint);
}

export function isStageCompleted(
  checkpoint: PipelineCheckpoint,
  stage: PipelineStage
): boolean {
  return checkpoint.completedStages.includes(stage);
}

/**
 * Get a human-readable status summary for a checkpoint
 */
export function getCheckpointSummary(checkpoint: PipelineCheckpoint): string {
  const lines = [
    `Batch: ${checkpoint.batchId}`,
    `Current Stage: ${checkpoint.stage}`,
    `Completed: ${checkpoint.completedStages.join(' → ') || 'none'}`,
    `Started: ${checkpoint.startedAt}`,
    `Updated: ${checkpoint.updatedAt}`,
  ];

  if (checkpoint.error) {
    lines.push(`Error: ${checkpoint.error}`);
  }

  if (checkpoint.stageData.variants) {
    lines.push(`  Variants: ${checkpoint.stageData.variants.count} generated`);
  }
  if (checkpoint.stageData.nanoBanana) {
    lines.push(`  Images: ${checkpoint.stageData.nanoBanana.pairs} pairs`);
  }
  if (checkpoint.stageData.veoAnimate) {
    lines.push(`  Video: ${checkpoint.stageData.veoAnimate.videoPath || 'pending'}`);
  }
  if (checkpoint.stageData.remotionCompose) {
    lines.push(`  Composed: ${checkpoint.stageData.remotionCompose.composedCount} variants`);
  }

  return lines.join('\n');
}

/**
 * List all batches with checkpoints that can be resumed
 */
export function listResumableBatches(outputDir: string): PipelineCheckpoint[] {
  if (!fs.existsSync(outputDir)) return [];

  return fs.readdirSync(outputDir)
    .map(d => loadCheckpoint(path.join(outputDir, d)))
    .filter((cp): cp is PipelineCheckpoint =>
      cp !== null && cp.stage !== 'complete' && !cp.error
    );
}
