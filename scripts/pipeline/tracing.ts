/**
 * Tracing — per-angle generation.json + session.json writer
 *
 * Every angle run writes a generation.json with full inputs,
 * model versions, timestamps, token usage, stage results, and output paths.
 * The session.json is updated after each angle with a summary.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { GenerationRecord, SessionSummary, Offer } from './offer.schema.js';

// GPT-4o pricing (as of 2025): $2.50/1M input, $10.00/1M output
const GPT4O_INPUT_COST_PER_TOKEN = 2.5 / 1_000_000;
const GPT4O_OUTPUT_COST_PER_TOKEN = 10.0 / 1_000_000;

export function estimateCost(promptTokens: number, completionTokens: number): number {
  return promptTokens * GPT4O_INPUT_COST_PER_TOKEN + completionTokens * GPT4O_OUTPUT_COST_PER_TOKEN;
}

export function writeGenerationRecord(record: GenerationRecord, outputDir: string): void {
  const recordPath = path.join(outputDir, 'generation.json');
  fs.writeFileSync(recordPath, JSON.stringify(record, null, 2), 'utf-8');
}

export function updateSessionSummary(
  sessionDir: string,
  sessionId: string,
  offer: Offer,
  mode: string,
  aspectRatio: string,
  records: GenerationRecord[]
): void {
  const totalTokens = records.reduce((s, r) => s + (r.aiGeneration?.totalTokens ?? 0), 0);
  const totalCost = records.reduce((s, r) => {
    const { promptTokens, completionTokens } = r.aiGeneration ?? {};
    return s + estimateCost(promptTokens ?? 0, completionTokens ?? 0);
  }, 0);

  const summary: SessionSummary = {
    sessionId,
    productName: offer.productName,
    mode,
    aspectRatio,
    startedAt: records[0]?.startedAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalAngles: records.length,
    completed: records.filter((r) => r.errors.length === 0).length,
    failed: records.filter((r) => r.errors.length > 0).length,
    totalTokensUsed: totalTokens,
    estimatedCostUsd: Math.round(totalCost * 10000) / 10000,
    angles: records.map((r) => ({
      angleId: r.angleId,
      stage: r.aiGeneration?.inputs?.awarenessStage ?? '',
      category: r.aiGeneration?.inputs?.audienceCategory ?? '',
      headline: r.aiGeneration?.inputs?.headline ?? '',
      pipeline: Object.fromEntries(
        Object.entries(r.pipeline).map(([k, v]) => [k, v.status])
      ),
      finalVideo: r.outputs.finalVideo ? path.basename(r.outputs.finalVideo) : null,
      errors: r.errors,
      durationMs: r.durationMs,
    })),
  };

  fs.writeFileSync(path.join(sessionDir, 'session.json'), JSON.stringify(summary, null, 2), 'utf-8');
}

export function makeRecord(angleId: string, offer: Offer): GenerationRecord {
  return {
    runId: angleId,
    angleId,
    startedAt: new Date().toISOString(),
    offer,
    aiGeneration: {
      model: 'gpt-4o',
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      inputs: {} as any,
    },
    pipeline: {
      stage1_images: { status: 'pending', outputs: [] },
      stage2_video: { status: 'pending', outputs: [] },
      stage3_voice: { status: 'pending', outputs: [] },
      stage4_compose: { status: 'pending', outputs: [] },
    },
    outputs: { outputDir: '' },
    errors: [],
  };
}
