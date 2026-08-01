// Tests for the executor-agnostic video-foundry core: EditPlan bridge, FCPXML
// interchange, and the Premiere MCP tool-call planner. Pure & deterministic —
// no Premiere, no network. Run: node --test tests/foundry.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { solveDurations } from "../src/lib/DurationSolver.ts";
import { sectionPackageToEditPlan, primaryVideoTrack } from "../src/foundry/EditPlan.ts";
import { editPlanToFCPXML, framesToFcpTime } from "../src/foundry/serialize/fcpxml.ts";
import { planPremiereToolCalls, REQUIRED_PREMIERE_TOOLS } from "../src/foundry/executors/PremiereExecutor.ts";
import type { SectionSpec, DurationBudget } from "../src/types/ContentBrief";

const spec = (id: string, sectionType: any, priority: number, extra: Partial<SectionSpec> = {}): SectionSpec =>
  ({ id, sectionType, content: `${id} narration text`, priority, ...extra });

function sampleplan() {
  const secs = [
    spec("hook", "hook", 1),
    spec("p1", "problem_solution", 2),
    spec("s1", "stat", 2),
    spec("cta", "cta", 1),
  ];
  const budget: DurationBudget = { totalSec: 30, fps: 30 };
  const pkg = solveDurations(secs, budget);
  return { pkg, plan: sectionPackageToEditPlan(pkg, { id: "demo", width: 1080, height: 1920 }) };
}

// EditPlan bridge — one clip per solved section, frame-exact spine.
test("sectionPackageToEditPlan: clip per section, frames sum to totalFrames", () => {
  const { pkg, plan } = sampleplan();
  const track = primaryVideoTrack(plan)!;
  assert.equal(track.clips.length, pkg.sections.length);
  assert.equal(plan.fps, 30);
  assert.equal(plan.totalFrames, pkg.totalFrames);
  const sum = track.clips.reduce((a, c) => a + c.durationInFrames, 0);
  assert.equal(sum, plan.totalFrames);
  // Offsets are cumulative and frame-exact.
  let cursor = 0;
  for (const c of track.clips) {
    assert.equal(c.startFrame, cursor, `clip ${c.id} offset drift`);
    cursor += c.durationInFrames;
  }
  assert.equal(cursor, plan.totalFrames);
});

// FCPXML interchange — well-formed, frame-exact, escaped.
test("editPlanToFCPXML: valid structure, frame-exact gaps summing to sequence duration", () => {
  const { plan } = sampleplan();
  const xml = editPlanToFCPXML(plan, { projectName: "Demo & <Test>" });
  assert.match(xml, /<\?xml version="1\.0"/);
  assert.match(xml, /<fcpxml version="1\.11">/);
  assert.match(xml, /frameDuration="1\/30s"/);
  assert.match(xml, /width="1080" height="1920"/);
  // XML-escaped project name (no raw & or < in attribute).
  assert.match(xml, /name="Demo &amp; &lt;Test&gt;"/);
  // One gap per clip.
  const gaps = [...xml.matchAll(/<gap [^>]*duration="(\d+)\/30s"[^>]*offset="(\d+)\/30s"|<gap [^>]*offset="(\d+)\/30s"[^>]*duration="(\d+)\/30s"/g)];
  const track = primaryVideoTrack(plan)!;
  assert.equal(gaps.length, track.clips.length);
  // Sum of gap durations equals the sequence total.
  const durs = [...xml.matchAll(/<gap [^>]*duration="(\d+)\/30s"/g)].map((m) => Number(m[1]));
  assert.equal(durs.reduce((a, b) => a + b, 0), plan.totalFrames);
  // Sequence duration attribute matches.
  assert.match(xml, new RegExp(`<sequence [^>]*duration="${plan.totalFrames}/30s"`));
  assert.equal(framesToFcpTime(150, 30), "150/30s");
});

// Premiere executor — real tools, inspect-first, correct call shape.
test("planPremiereToolCalls: inspect→import→transitions→export with real tool names", () => {
  const { plan } = sampleplan();
  const calls = planPremiereToolCalls(plan, {
    fcpxmlPath: "/tmp/demo.fcpxml",
    addTransitions: true,
    export: { output: "/tmp/demo.mp4" },
  });
  const tools = calls.map((c) => c.tool);
  assert.equal(tools[0], "get_active_sequence", "must inspect first (read-only)");
  assert.equal(tools[1], "import_fcp_xml");
  assert.ok(tools.includes("batch_add_transitions"));
  assert.equal(tools.at(-1), "export_sequence");
  // Every tool used is one the MCP is asserted to provide.
  for (const t of tools) assert.ok(REQUIRED_PREMIERE_TOOLS.includes(t as any), `unknown tool ${t}`);
  // import points at the FCPXML we serialized.
  const imp = calls.find((c) => c.tool === "import_fcp_xml")!;
  assert.equal(imp.args.path, "/tmp/demo.fcpxml");
});

// Approval gate — omitting export leaves the sequence for human finishing.
test("planPremiereToolCalls: no export requested → no export_sequence call", () => {
  const { plan } = sampleplan();
  const calls = planPremiereToolCalls(plan, { fcpxmlPath: "/tmp/x.fcpxml", export: null });
  assert.ok(!calls.some((c) => c.tool === "export_sequence"), "should stop before export for approval");
});

// Single-clip edge — no cuts → no transition call.
test("planPremiereToolCalls: single clip has no cuts → no transitions", () => {
  const pkg = solveDurations([spec("hook", "hook", 1)], { totalSec: 3, fps: 30 });
  const plan = sectionPackageToEditPlan(pkg);
  const calls = planPremiereToolCalls(plan, { fcpxmlPath: "/tmp/x.fcpxml", addTransitions: true });
  assert.ok(!calls.some((c) => c.tool === "batch_add_transitions"), "no cuts, no transitions");
});
