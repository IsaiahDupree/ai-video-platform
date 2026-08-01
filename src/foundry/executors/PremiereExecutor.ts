// PremiereExecutor — turns an EditPlan into a PREVIEWABLE sequence of Premiere
// MCP tool calls (the leancoderkavy premiere-pro-mcp server, 300 tools, verified
// live). This is the "propose plan → approve → apply" safety pattern: planning
// is pure and testable (no Premiere needed); executing the plan requires Premiere
// running with the CEP bridge (the calls route through the in-app JSX poller).
//
// Tool names below are REAL — confirmed via a live tools/list handshake:
//   import_fcp_xml, get_active_sequence, batch_add_transitions, color_correct,
//   create_caption_track, export_sequence.

import type { EditPlan } from "../EditPlan";

export interface McpToolCall {
  tool: string;
  args: Record<string, unknown>;
  /** Human-readable rationale — shown in the approval preview. */
  note: string;
}

export interface PremiereExecOptions {
  /** Path to the FCPXML written from this EditPlan (imported to build the sequence). */
  fcpxmlPath: string;
  /** Add a transition on every cut (default true). */
  addTransitions?: boolean;
  transition?: string;          // default "Cross Dissolve"
  transitionSeconds?: number;   // default 0.5
  /** Optional Lumetri/color pass. */
  color?: { preset: string } | null;
  /** Build a caption track from a transcript path. */
  captionsFromTranscript?: string | null;
  /** Export at the end; omit/null to leave the sequence for human finishing. */
  export?: { output: string; preset?: string } | null;
}

/** Tools this executor depends on — a stable contract to assert the MCP exposes. */
export const REQUIRED_PREMIERE_TOOLS = [
  "get_active_sequence",
  "import_fcp_xml",
  "batch_add_transitions",
  "color_correct",
  "create_caption_track",
  "export_sequence",
] as const;

/**
 * Plan (do not execute) the Premiere MCP tool calls that realize an EditPlan.
 * Pure & deterministic → unit-testable without Premiere. The realistic Premiere
 * flow is: import the FCPXML the solver produced (creates the frame-exact
 * sequence), then apply enhancements, then optionally export.
 */
export function planPremiereToolCalls(plan: EditPlan, opts: PremiereExecOptions): McpToolCall[] {
  const calls: McpToolCall[] = [];
  const track = plan.tracks.find((t) => t.role === "video");
  const clipCount = track?.clips.length ?? 0;
  const cutCount = Math.max(0, clipCount - 1);

  // 1. Inspect first (read-only) — never edit blind.
  calls.push({ tool: "get_active_sequence", args: {}, note: "Inspect the active sequence before editing." });

  // 2. Import the frame-exact timeline from FCPXML.
  calls.push({
    tool: "import_fcp_xml",
    args: { path: opts.fcpxmlPath },
    note: `Import the ${clipCount}-clip / ${plan.totalFrames}-frame timeline from FCPXML.`,
  });

  // 3. Transitions on every cut (one batch call).
  if ((opts.addTransitions ?? true) && cutCount > 0) {
    calls.push({
      tool: "batch_add_transitions",
      args: {
        trackIndex: 0,
        transition: opts.transition ?? "Cross Dissolve",
        durationSeconds: opts.transitionSeconds ?? 0.5,
      },
      note: `Add ${opts.transition ?? "Cross Dissolve"} to all ${cutCount} cut(s) on V1.`,
    });
  }

  // 4. Optional color pass.
  if (opts.color) {
    calls.push({
      tool: "color_correct",
      args: { trackIndex: 0, preset: opts.color.preset },
      note: `Apply color preset "${opts.color.preset}" to V1.`,
    });
  }

  // 5. Optional captions.
  if (opts.captionsFromTranscript) {
    calls.push({
      tool: "create_caption_track",
      args: { transcriptPath: opts.captionsFromTranscript },
      note: "Build a caption track from the transcript.",
    });
  }

  // 6. Optional export (leave off for human finishing / approval gate).
  if (opts.export) {
    calls.push({
      tool: "export_sequence",
      args: {
        width: plan.width,
        height: plan.height,
        preset: opts.export.preset ?? "H.264",
        output: opts.export.output,
      },
      note: `Export ${plan.width}x${plan.height} to ${opts.export.output}.`,
    });
  }

  return calls;
}
