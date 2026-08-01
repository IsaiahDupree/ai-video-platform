// End-to-end dry run of the video foundry spine — no credits, no Premiere needed.
// script → DurationSolver → EditPlan → shot plan (cost) → FCPXML → Premiere plan.
// Run: node scripts/foundry-demo.ts
import { writeFileSync } from "node:fs";
import { solveDurations } from "../src/lib/DurationSolver.ts";
import { sectionPackageToEditPlan } from "../src/foundry/EditPlan.ts";
import { planGeneration } from "../src/foundry/generate/ShotRouter.ts";
import { editPlanToFCPXML } from "../src/foundry/serialize/fcpxml.ts";
import { planPremiereToolCalls } from "../src/foundry/executors/PremiereExecutor.ts";
import type { SectionSpec, DurationBudget } from "../src/types/ContentBrief";

// A sample 60s explainer script (the "shot plan" a script agent would emit).
const script: SectionSpec[] = [
  { id: "hook", sectionType: "hook", priority: 1, content: "Most AI video tools make one thing — a watchable video is a different problem." },
  { id: "problem", sectionType: "problem_solution", priority: 2, content: "The failure mode: one-shot scripts, keyword B-roll, one edit rhythm, render once, publish." },
  { id: "proof", sectionType: "stat", priority: 2, content: "A 7-minute agentic news video was produced for $0.24 — but cost isn't retention." },
  { id: "how", sectionType: "content", priority: 2, content: "The fix is a retention critic and a closed revision loop above the generator.", wordCount: 55 },
  { id: "chart", sectionType: "bar_chart", priority: 2, content: "Retention by section: hook 92%, proof 78%, body 61% — where viewers leave." },
  { id: "cta", sectionType: "cta", priority: 1, content: "Follow for the full build." },
];

const budget: DurationBudget = { totalSec: 60, fps: 30 };

const pkg = solveDurations(script, budget);
const plan = sectionPackageToEditPlan(pkg, { id: "founders-explainer", width: 1080, height: 1920 });
const gen = planGeneration(plan, { engine: "v3" });
const fcpxml = editPlanToFCPXML(plan, { projectName: "Founders Explainer" });
const fcpxmlPath = "/tmp/founders-explainer.fcpxml";
writeFileSync(fcpxmlPath, fcpxml);
const calls = planPremiereToolCalls(plan, { fcpxmlPath, addTransitions: true, export: { output: "/tmp/founders-explainer.mp4" } });

console.log("\n=== DURATION SOLVE ===");
console.log(`feasible=${pkg.feasible} underfilled=${pkg.underfilled} total=${pkg.totalSec}s (${pkg.totalFrames} frames @ ${budget.fps}fps)`);
for (const s of pkg.sections) console.log(`  ${s.id.padEnd(9)} ${s.sectionType.padEnd(16)} ${s.durationSec.toFixed(2)}s (${s.durationInFrames}f${s.wasClamped ? ", clamped" : ""})`);

console.log("\n=== SHOT PLAN (generation) ===");
for (const s of gen.shots) console.log(`  ${s.clipId.padEnd(9)} → ${s.generator.padEnd(14)} ${s.durationSec.toFixed(1)}s  $${s.estCostUsd.toFixed(3)}  (${s.reason})`);
console.log(`  totals: ${JSON.stringify(gen.byGenerator)}  |  ${gen.heygenSeconds}s A-roll ≈ $${gen.totalEstCostUsd} (${gen.engine})`);

console.log("\n=== FCPXML INTERCHANGE ===");
console.log(`  wrote ${fcpxmlPath} (${fcpxml.length} bytes, ${plan.tracks[0].clips.length} clips, importable via Premiere import_fcp_xml)`);

console.log("\n=== PREMIERE ASSEMBLY PLAN (previewable, not executed) ===");
for (const c of calls) console.log(`  ${c.tool.padEnd(22)} ${c.note}`);
console.log("");
