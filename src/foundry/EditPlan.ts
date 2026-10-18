// EditPlan — the executor-agnostic edit contract at the heart of the video
// foundry. The editorial director (LLM) + Duration Solver + Retention Critic
// emit an EditPlan; pluggable executors realize it: RemotionExecutor (headless),
// PremiereExecutor (via the 300-tool MCP bridge), FFmpeg, etc. Its serialized
// form is FCPXML/OTIO — the portable interchange that survives Adobe deprecating
// CEP or a switch to DaVinci/FCP. We bet on the interchange, not one NLE's API.

import type { SectionType, SectionPackage } from "../types/ContentBrief";

export type ClipKind = "gap" | "video" | "title" | "audio" | "caption";
export type TrackRole = "video" | "audio" | "captions";

export interface EditClip {
  id: string;
  name: string;
  kind: ClipKind;
  startFrame: number;
  durationInFrames: number;
  /** Media path/URL when kind is video/audio; absent for gap/title placeholders. */
  assetRef?: string;
  // Editorial metadata — read by executors and the retention critic.
  sectionType?: SectionType;
  retentionDevice?: string;
  notes?: string;
}

export interface EditTrack {
  id: string;
  role: TrackRole;
  clips: EditClip[];
}

export interface EditPlan {
  id: string;
  fps: number;
  width: number;
  height: number;
  /** Sum of the primary video track's clip frames — the sequence length. */
  totalFrames: number;
  tracks: EditTrack[];
  source: "duration-solver" | "buttercut" | "manual";
  notes: string[];
}

export interface EditPlanOptions {
  id?: string;
  width?: number;
  height?: number;
  /** Trim clip names to keep interchange files readable (default 60). */
  nameMaxLen?: number;
}

/**
 * Bridge the deterministic Duration Solver output into an executor-agnostic
 * EditPlan. Each solved section becomes one clip on a single video track, with
 * frame-exact offsets — so whatever renders it (Remotion / Premiere / ffmpeg)
 * lands on the same timeline the solver guaranteed.
 */
export function sectionPackageToEditPlan(pkg: SectionPackage, opts: EditPlanOptions = {}): EditPlan {
  const width = opts.width ?? 1080;
  const height = opts.height ?? 1920;
  const nameMax = opts.nameMaxLen ?? 60;
  const clips: EditClip[] = pkg.sections.map((s) => ({
    id: s.id,
    name: (s.content || s.sectionType).slice(0, nameMax),
    kind: "gap", // real media is attached at the asset stage (Evidence→Visual Mapper)
    startFrame: s.startFrame,
    durationInFrames: s.durationInFrames,
    sectionType: s.sectionType,
    notes: s.wasClamped ? "duration clamped by solver" : undefined,
  }));
  const notes = [`Built from Duration Solver (${pkg.feasible ? "feasible" : "INFEASIBLE"}${pkg.underfilled ? ", underfilled" : ""}).`, ...pkg.notes];
  return {
    id: opts.id ?? "editplan",
    fps: pkg.budget.fps,
    width,
    height,
    totalFrames: pkg.totalFrames,
    tracks: [{ id: "v1", role: "video", clips }],
    source: "duration-solver",
    notes,
  };
}

/** The primary (first) video track — the spine most executors act on. */
export function primaryVideoTrack(plan: EditPlan): EditTrack | undefined {
  return plan.tracks.find((t) => t.role === "video");
}
