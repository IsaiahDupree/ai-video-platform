/**
 * UGC Ad Pipeline Orchestrator
 *
 * Chains: Nano Banana → Veo 3 → Variant Generator → Remotion Compose
 *
 * Usage:
 *   import { runUGCPipeline } from './ugc-ad-pipeline';
 *   const batch = await runUGCPipeline(config);
 */

import * as fs from 'fs';
import * as path from 'path';
import { runNanoBananaStage } from './nano-banana-stage';
import { runVeoAnimateStage, getMotionPrompt } from './veo-animate-stage';
import { generateVariants } from './variant-generator';
import { runRemotionComposeBatch } from './remotion-compose-stage';
import {
  createCheckpoint,
  loadCheckpoint,
  markStageComplete,
  markStageError,
  isStageCompleted,
  getCheckpointSummary,
  saveCheckpoint,
} from './batch-resume';
import type { PipelineCheckpoint } from './batch-resume';
import type {
  UGCPipelineConfig,
  AdBatch,
  AdVariant,
  ImagePair,
  VeoAnimateOutput,
  NanoBananaOutput,
} from './types';

// =============================================================================
// Pipeline Orchestrator
// =============================================================================

export interface RunOptions {
  resumeBatchDir?: string;
}

export async function runUGCPipeline(config: UGCPipelineConfig, options?: RunOptions): Promise<AdBatch> {
  const startTime = Date.now();
  const isResume = !!options?.resumeBatchDir;
  const batchDir = isResume ? options!.resumeBatchDir! : path.join(config.outputDir, `b${String(Date.now()).slice(-6)}`);
  const batchId = path.basename(batchDir);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🎬 UGC Ad Generation Pipeline');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Product:    ${config.product.name}`);
  console.log(`  Brand:      ${config.brand.name}`);
  console.log(`  Batch ID:   ${batchId}`);
  console.log(`  Strategy:   ${config.matrix.strategy}`);
  console.log(`  Max Variants: ${config.matrix.maxVariants}`);
  console.log(`  Output:     ${batchDir}`);
  console.log(`  Dry Run:    ${config.dryRun ? 'YES' : 'NO'}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  fs.mkdirSync(batchDir, { recursive: true });

  // Load or create checkpoint for resume support
  let checkpoint: PipelineCheckpoint;
  if (isResume) {
    const existing = loadCheckpoint(batchDir);
    if (existing) {
      checkpoint = existing;
      console.log('\n🔄 RESUMING from checkpoint:');
      console.log(getCheckpointSummary(checkpoint));
      console.log('');
    } else {
      checkpoint = createCheckpoint(batchId, batchDir);
    }
  } else {
    checkpoint = createCheckpoint(batchId, batchDir);
  }
  saveCheckpoint(checkpoint);

  // =========================================================================
  // Stage 1: Generate Variants (parametric)
  // =========================================================================
  let variants: AdVariant[];

  if (isStageCompleted(checkpoint, 'variants')) {
    console.log('\n📐 STAGE 1: Variants (cached) ✅');
    // Reload variants from batch.json
    const batchJson = path.join(batchDir, 'batch.json');
    if (fs.existsSync(batchJson)) {
      const savedBatch = JSON.parse(fs.readFileSync(batchJson, 'utf-8'));
      variants = savedBatch.variants;
      console.log(`   Loaded ${variants.length} cached variants`);
    } else {
      console.log('   ⚠️  Cache missing, regenerating...');
      variants = generateVariants(config.matrix, config.copyBank, batchId);
    }
  } else {
    console.log('\n📐 STAGE 1: Generating Parametric Variants');
    console.log('─'.repeat(60));
    variants = generateVariants(config.matrix, config.copyBank, batchId);
    console.log(`   ✅ ${variants.length} variants generated\n`);

    markStageComplete(checkpoint, 'variants', {
      variants: { count: variants.length, path: path.join(batchDir, 'variants.json') },
    });
  }

  // Save variant manifest
  fs.writeFileSync(
    path.join(batchDir, 'variants.json'),
    JSON.stringify(variants.map(v => ({
      id: v.id,
      template: v.parameters.visual.template,
      hookType: v.parameters.copy.hookType,
      awareness: v.parameters.targeting.awarenessLevel,
      ctaType: v.parameters.copy.ctaType,
      headline: v.parameters.copy.headline,
      ctaText: v.parameters.copy.ctaText,
      utmContent: v.utmParams.utm_content,
    })), null, 2)
  );

  if (config.dryRun) {
    console.log('   🏃 DRY RUN: Skipping image/video generation and rendering');
    const batch = buildBatchResult(batchId, config, variants, startTime);

    fs.writeFileSync(path.join(batchDir, 'batch.json'), JSON.stringify(batch, null, 2));

    const utmMapping = variants.map(v => ({
      variantId: v.id,
      adName: v.id,
      utmContent: v.utmParams.utm_content,
      utmCampaign: v.utmParams.utm_campaign,
      headline: v.parameters.copy.headline,
      ctaText: v.parameters.copy.ctaText,
      hookType: v.parameters.copy.hookType,
      awareness: v.parameters.targeting.awarenessLevel,
      template: v.parameters.visual.template,
    }));
    fs.writeFileSync(path.join(batchDir, 'utm_mapping.json'), JSON.stringify(utmMapping, null, 2));

    markStageComplete(checkpoint, 'complete');
    return batch;
  }

  // =========================================================================
  // Stage 2: Nano Banana (Before/After Image Generation)
  // =========================================================================
  const nanoBananaDir = path.join(batchDir, 'images');
  let nanoBananaOutput: NanoBananaOutput;

  if (isStageCompleted(checkpoint, 'nano_banana') && checkpoint.stageData.nanoBanana) {
    console.log('\n🍌 STAGE 2: Nano Banana (cached) ✅');
    // Reload from manifest
    const manifestPath = checkpoint.stageData.nanoBanana.manifestPath;
    if (fs.existsSync(manifestPath)) {
      nanoBananaOutput = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      console.log(`   Loaded ${nanoBananaOutput.pairs.length} cached image pairs`);
    } else {
      console.log('   ⚠️  Manifest missing, re-running stage...');
      checkpoint.completedStages = checkpoint.completedStages.filter(s => s !== 'nano_banana');
      checkpoint.stage = 'nano_banana';
      return runUGCPipeline(config, options);
    }
  } else {
    console.log('\n🍌 STAGE 2: Nano Banana — Generating Before/After Images');
    console.log('─'.repeat(60));

    try {
      nanoBananaOutput = await runNanoBananaStage({
        product: config.product,
        scene: config.scenes,
        imageCount: 1,
        outputDir: nanoBananaDir,
      });
      console.log(`   ✅ ${nanoBananaOutput.pairs.length} image pairs generated\n`);

      const manifestPath = path.join(nanoBananaDir, 'manifest.json');
      fs.writeFileSync(manifestPath, JSON.stringify(nanoBananaOutput, null, 2));

      markStageComplete(checkpoint, 'nano_banana', {
        nanoBanana: {
          pairs: nanoBananaOutput.pairs.length,
          outputDir: nanoBananaDir,
          manifestPath,
        },
      });
    } catch (error: any) {
      console.log(`   ❌ Nano Banana failed: ${error.message}`);
      markStageError(checkpoint, `nano_banana: ${error.message}`);
      console.log('   ⚠️  Continuing without generated images (variants still tagged)\n');
      return buildBatchResult(batchId, config, variants, startTime);
    }
  }

  if (nanoBananaOutput.pairs.length === 0) {
    console.log('   ⚠️  No image pairs generated. Returning variant metadata only.');
    return buildBatchResult(batchId, config, variants, startTime);
  }

  // =========================================================================
  // Stage 3: Veo 3 (Animate Before/After)
  // =========================================================================
  const veoDir = path.join(batchDir, 'videos');
  const pair = nanoBananaOutput.pairs[0];
  let veoOutput: VeoAnimateOutput | null = null;

  if (isStageCompleted(checkpoint, 'veo_animate') && checkpoint.stageData.veoAnimate?.videoPath) {
    console.log('\n🎬 STAGE 3: Veo 3 (cached) ✅');
    veoOutput = {
      videoPath: checkpoint.stageData.veoAnimate.videoPath,
      jobId: checkpoint.stageData.veoAnimate.jobId,
      pairId: checkpoint.stageData.veoAnimate.pairId,
      duration: 8,
      aspectRatio: '9:16',
    };
    console.log(`   Loaded cached video: ${veoOutput!.videoPath}`);
  } else {
    console.log('\n🎬 STAGE 3: Veo 3 — Animating Before/After Images');
    console.log('─'.repeat(60));

    try {
      const motionPrompt = getMotionPrompt('before_after_transition');
      veoOutput = await runVeoAnimateStage({
        pair,
        motionPrompt,
        duration: 8,
        aspectRatio: '9:16',
        outputDir: veoDir,
      });

      if (veoOutput.videoPath) {
        console.log(`   ✅ Video generated: ${veoOutput.videoPath}\n`);
        markStageComplete(checkpoint, 'veo_animate', {
          veoAnimate: {
            videoPath: veoOutput.videoPath,
            jobId: veoOutput.jobId || '',
            pairId: pair.id || '',
          },
        });
      } else {
        console.log('   ⚠️  Veo job submitted but video not yet ready. Check operation status.\n');
      }
    } catch (error: any) {
      console.log(`   ❌ Veo 3 failed: ${error.message}`);
      markStageError(checkpoint, `veo_animate: ${error.message}`);
      console.log('   ⚠️  Continuing without animated video\n');
    }
  }

  // Update variant assets with image paths
  for (const variant of variants) {
    variant.assets.beforeImagePath = pair.beforeImagePath;
    variant.assets.afterImagePath = pair.afterImagePath;
    if (veoOutput?.videoPath) {
      variant.assets.videoPath = veoOutput.videoPath;
    }
    variant.status = 'generating';
  }

  // =========================================================================
  // Stage 4: Remotion Compose (Render Ads)
  // =========================================================================
  if (isStageCompleted(checkpoint, 'remotion_compose')) {
    console.log('\n🎨 STAGE 4: Remotion Compose (cached) ✅');
  } else if (veoOutput?.videoPath) {
    console.log('\n🎨 STAGE 4: Remotion Compose — Rendering Ad Variants');
    console.log('─'.repeat(60));

    const composeDir = path.join(batchDir, 'composed');

    try {
      const composed = await runRemotionComposeBatch(
        variants,
        veoOutput.videoPath,
        config.brand,
        config.matrix.sizes,
        composeDir
      );

      for (const result of composed) {
        const variant = variants.find(v => v.id === result.variantId);
        if (variant) {
          variant.assets.composedPaths = result.outputPaths;
          variant.status = 'rendered';
        }
      }

      markStageComplete(checkpoint, 'remotion_compose', {
        remotionCompose: { composedCount: composed.length, outputDir: composeDir },
      });

      console.log(`\n   ✅ ${composed.length} variants composed\n`);
    } catch (error: any) {
      markStageError(checkpoint, `remotion_compose: ${error.message}`);
      console.log(`   ❌ Remotion compose failed: ${error.message}\n`);
    }
  } else {
    console.log('\n⏭️  STAGE 4: Skipped (no video available yet)');
    console.log('   Run Remotion compose manually when Veo video is ready.\n');
  }

  // =========================================================================
  // Final: Save batch result
  // =========================================================================
  const batch = buildBatchResult(batchId, config, variants, startTime);

  // Save full batch manifest
  fs.writeFileSync(path.join(batchDir, 'batch.json'), JSON.stringify(batch, null, 2));

  markStageComplete(checkpoint, 'complete');

  // Save UTM mapping for Meta upload
  const utmMapping = variants.map(v => ({
    variantId: v.id,
    adName: v.id, // Use as Meta ad name
    utmContent: v.utmParams.utm_content,
    utmCampaign: v.utmParams.utm_campaign,
    headline: v.parameters.copy.headline,
    ctaText: v.parameters.copy.ctaText,
    hookType: v.parameters.copy.hookType,
    awareness: v.parameters.targeting.awarenessLevel,
    template: v.parameters.visual.template,
    files: v.assets.composedPaths,
  }));

  fs.writeFileSync(
    path.join(batchDir, 'utm_mapping.json'),
    JSON.stringify(utmMapping, null, 2)
  );

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const rendered = variants.filter(v => v.status === 'rendered').length;
  const pending = variants.filter(v => v.status !== 'rendered').length;

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  📊 Pipeline Complete');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Batch ID:      ${batchId}`);
  console.log(`  Total Variants: ${variants.length}`);
  console.log(`  Rendered:      ${rendered}`);
  console.log(`  Pending:       ${pending}`);
  console.log(`  Duration:      ${elapsed}s`);
  console.log(`  Output:        ${batchDir}`);
  console.log(`  Files:`);
  console.log(`    batch.json       - Full batch manifest`);
  console.log(`    variants.json    - Variant parameter list`);
  console.log(`    utm_mapping.json - UTM tags for Meta upload`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  return batch;
}

// =============================================================================
// Helpers
// =============================================================================

function buildBatchResult(
  batchId: string,
  config: UGCPipelineConfig,
  variants: AdVariant[],
  startTime: number
): AdBatch {
  return {
    id: batchId,
    productId: config.product.name,
    campaignId: batchId,
    variants,
    totalVariants: variants.length,
    status: variants.some(v => v.status === 'rendered') ? 'rendered' : 'generating',
    createdAt: new Date(startTime).toISOString(),
  };
}
