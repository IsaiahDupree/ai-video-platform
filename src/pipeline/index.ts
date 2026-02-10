/**
 * UGC Ad Pipeline
 *
 * Nano Banana → Veo 3 → Remotion → Parametric Optimization
 */

export { runUGCPipeline } from './ugc-ad-pipeline';
export { runNanoBananaStage } from './nano-banana-stage';
export { runVeoAnimateStage, runVeoAnimateBatch, getMotionPrompt } from './veo-animate-stage';
export { runRemotionComposeStage, runRemotionComposeBatch } from './remotion-compose-stage';
export { generateVariants, encodeVariantId, decodeVariantId } from './variant-generator';
export { ingestMetaCSV, mergePerformanceIntoBatch, loadBatch, saveBatch } from './meta-data-ingester';
export {
  scoreParameters,
  generateOptimizationReport,
  testParameterSignificance,
  recommendBudgetAllocation,
} from './parameter-scorer';
export { generateNextBatch } from './optimization-engine';
export { runCopyGenerationStage } from './copy-generation-stage';
export {
  createCheckpoint,
  loadCheckpoint,
  markStageComplete,
  isStageCompleted,
  listResumableBatches,
  getCheckpointSummary,
} from './batch-resume';
export {
  generatePreviews,
  generateGalleryHTML,
  generateGalleryFromBatch,
} from './preview-generator';
export {
  generateMetaUploadCSV,
  generateUTMTrackingCSV,
} from './meta-csv-exporter';
export {
  compareBatches,
  calculateSampleSize,
} from './batch-comparator';
export {
  detectFatigue,
  quickFatigueCheck,
  parseMultiPeriodData,
} from './fatigue-detector';
export * from './types';
