// EditPlan → FCPXML. FCPXML is the portable, NLE-neutral interchange the whole
// architecture bets on: Premiere imports it (import_fcp_xml), so do DaVinci
// Resolve and Final Cut Pro. Frame-exact, deterministic, no I/O — the timeline
// the Duration Solver guaranteed survives the hop into any NLE.
//
// FCPXML rational time: a value of N frames at F fps is written "N/Fs"; the
// format's frameDuration is "1/Fs". Integer/​fps keeps everything frame-accurate.

import type { EditPlan } from "../EditPlan";

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Frames → FCPXML rational-seconds string (e.g. 150 @ 30fps → "150/30s"). */
export function framesToFcpTime(frames: number, fps: number): string {
  return `${Math.round(frames)}/${fps}s`;
}

export interface FcpxmlOptions {
  /** FCPXML DTD version to declare (default "1.11"). */
  version?: string;
  projectName?: string;
}

export function editPlanToFCPXML(plan: EditPlan, opts: FcpxmlOptions = {}): string {
  const version = opts.version ?? "1.11";
  const projectName = xmlEscape(opts.projectName ?? plan.id);
  const fps = plan.fps;
  const fd = `1/${fps}s`;
  const seqDur = framesToFcpTime(plan.totalFrames, fps);
  const track = plan.tracks.find((t) => t.role === "video");
  const clips = track?.clips ?? [];

  // Each clip becomes a spine element positioned at its frame-exact offset.
  // Gaps (no media yet) render as <gap>; real media as <asset-clip> refs later.
  const spine = clips
    .map((c) => {
      const offset = framesToFcpTime(c.startFrame, fps);
      const duration = framesToFcpTime(c.durationInFrames, fps);
      const name = xmlEscape(c.name || c.sectionType || c.id);
      const note = c.notes ? `\n          <note>${xmlEscape(c.notes)}</note>` : "";
      return `        <gap name="${name}" offset="${offset}" start="0s" duration="${duration}">${note}\n        </gap>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="${version}">
  <resources>
    <format id="r1" name="FFVideoFormat${plan.height}p" frameDuration="${fd}" width="${plan.width}" height="${plan.height}"/>
  </resources>
  <library>
    <event name="${projectName}">
      <project name="${projectName}">
        <sequence format="r1" duration="${seqDur}" tcStart="0s" tcFormat="NDF">
          <spine>
${spine}
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>
`;
}
