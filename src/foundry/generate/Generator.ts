// Generation stage — types. The shot router assigns each EditPlan clip to a
// media generator; the orchestrator runs them and fills EditClip.assetRef, after
// which the editing stage (Premiere/Remotion) assembles the real media.
//
// Generators are pluggable and future-proof: A-roll from HeyGen avatars, graphics
// from Remotion scenes (or HyperFrames), B-roll from stock/AI. Type-only module
// (no runtime exports) so every cross-module import of it is erased.

import type { SectionType } from "../../types/ContentBrief";

export type GeneratorKind =
  | "heygen_avatar"   // talking-head A-roll (HeyGen /v2/video/generate)
  | "remotion_scene"  // code-rendered graphics/motion (the 32 existing scenes)
  | "hyperframes"     // HTML/CSS/GSAP → mp4 (optional, HeyGen HyperFrames)
  | "stock_broll"     // fetched/AI B-roll
  | "gap";            // placeholder, nothing generated

/** One clip routed to a generator, with cost/runtime estimate — the "shot plan". */
export interface ShotAssignment {
  clipId: string;
  sectionType: SectionType;
  generator: GeneratorKind;
  script: string;            // narration/text for this shot
  durationSec: number;
  durationInFrames: number;
  estCostUsd: number;
  reason: string;            // why this generator was chosen
}

export interface GenerationPlan {
  shots: ShotAssignment[];
  byGenerator: Record<string, number>;
  totalEstCostUsd: number;
  /** Sum of A-roll seconds — the paid HeyGen surface. */
  heygenSeconds: number;
  engine: string;
  notes: string[];
}

/** A produced asset, to be written back onto the EditClip. */
export interface GeneratedAsset {
  clipId: string;
  assetRef: string;          // path/URL of the produced media
  actualDurationSec?: number;
  generator: GeneratorKind;
  test?: boolean;            // true when produced in HeyGen test/watermark mode
}

/** Pluggable media generator. Execution is side-effecting (credits/time); the
 *  router + request builders are pure and testable on their own. */
export interface MediaGenerator {
  kind: GeneratorKind;
  generate(shot: ShotAssignment, ctx: Record<string, unknown>): Promise<GeneratedAsset>;
}
