// Unit tests for the Duration Constraint Solver. Pure, deterministic — no LLM,
// no network, no filesystem. Run with: node --test tests/DurationSolver.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  solveDurations,
  estimateNarrationSec,
  distributeFrames,
  SECTION_DURATION_DEFAULTS,
} from "../src/lib/DurationSolver.ts";
import type { SectionSpec, DurationBudget } from "../src/types/ContentBrief";

const spec = (id: string, sectionType: any, priority: number, extra: Partial<SectionSpec> = {}): SectionSpec =>
  ({ id, sectionType, content: `${id} text`, priority, ...extra });

const sumFrames = (p: { sections: { durationInFrames: number }[] }) =>
  p.sections.reduce((a, s) => a + s.durationInFrames, 0);

// 1. Exact fit — ideals already sum to the budget; no drop, no clamp.
test("exact fit: ideals sum to budget, frames sum exactly, nothing clamped/dropped", () => {
  const secs = [spec("a", "problem_solution", 2), spec("b", "problem_solution", 2), spec("c", "problem_solution", 2)];
  const budget: DurationBudget = { totalSec: 15, fps: 30 }; // 3 × ideal 5 = 15
  const p = solveDurations(secs, budget);
  assert.equal(p.feasible, true);
  assert.equal(p.droppedSectionIds.length, 0);
  assert.equal(p.totalFrames, 450);
  assert.equal(sumFrames(p), 450);
  assert.ok(p.sections.every((s) => !s.wasClamped), "no section should be clamped");
});

// 2. Frame-exactness of the apportionment itself (largest-remainder).
test("distributeFrames sums to exactly totalFrames on messy seconds", () => {
  assert.equal(distributeFrames([10.03, 9.99, 9.98], 900).reduce((a, b) => a + b, 0), 900);
  for (const total of [900, 901, 1799, 30, 7]) {
    const out = distributeFrames([3.1, 5.7, 0.2, 9.0], total);
    assert.equal(out.reduce((a, b) => a + b, 0), total, `sum must equal ${total}`);
    assert.ok(out.every((f) => f >= 0));
  }
});

// 3. Over budget but fits after shrinking — no drops, hook keeps its floor.
test("over-budget shrink: lands exactly on target, hook >= floor, no drops", () => {
  const secs = [
    spec("hook", "hook", 1),
    spec("c1", "content", 2),
    spec("c2", "content", 2),
    spec("c3", "content", 2),
    spec("c4", "content", 2),
  ];
  const budget: DurationBudget = { totalSec: 20, fps: 30, hookFloorSec: 1.5 };
  const p = solveDurations(secs, budget);
  assert.equal(p.feasible, true);
  assert.equal(p.droppedSectionIds.length, 0);
  assert.equal(p.totalFrames, 600);
  assert.equal(sumFrames(p), 600);
  const hook = p.sections.find((s) => s.id === "hook")!;
  assert.ok(hook.durationSec >= 1.5 - 1 / 30 - 1e-6, `hook ${hook.durationSec}s below floor`);
});

// 4. Over budget past all floors — lowest-priority droppables get dropped.
test("over-budget drop: sheds droppables high-priority-number first, keeps must-keeps", () => {
  const secs = [
    spec("hook", "hook", 1),      // must-keep
    spec("A", "content", 2),
    spec("B", "content", 3),      // most droppable
    spec("C", "content", 2),
  ];
  const budget: DurationBudget = { totalSec: 5, fps: 30 }; // floors 1.5+2+2+2 = 7.5 > 5
  const p = solveDurations(secs, budget);
  assert.equal(p.feasible, true);
  assert.ok(p.droppedSectionIds.includes("B"), "B (priority 3) should drop first");
  assert.ok(p.sections.some((s) => s.id === "hook"), "must-keep hook survives");
  assert.equal(sumFrames(p), p.totalFrames);
});

// 5. Infeasible — two must-keeps whose floors alone exceed the budget.
test("infeasible: must-keep floors exceed budget → feasible=false, no crash", () => {
  const secs = [spec("hook", "hook", 1), spec("cta", "cta", 1)]; // floors 1.5 + 1.5 = 3
  const budget: DurationBudget = { totalSec: 2, fps: 30 };
  const p = solveDurations(secs, budget);
  assert.equal(p.feasible, false);
  assert.equal(p.sections.length, 2, "both must-keeps retained");
  assert.equal(p.droppedSectionIds.length, 0);
  assert.ok(p.totalSec > budget.totalSec, "min-floor plan overshoots the budget");
  assert.ok(p.notes.length > 0);
  assert.equal(sumFrames(p), p.totalFrames);
});

// 6. Narration-driven sizing, clamped to the type cap.
test("narration-driven ideal clamps to type max and flags wasClamped", () => {
  assert.ok(Math.abs(estimateNarrationSec(50, 165) - 18.18) < 0.05);
  const p = solveDurations([spec("n", "content", 1, { wordCount: 50 })], { totalSec: 10, fps: 30 });
  const s = p.sections[0];
  assert.equal(s.durationInFrames, 300); // content max 10s → 300 frames
  assert.ok(s.wasClamped, "ideal 18.2s clamped to max 10s");
  assert.equal(p.underfilled, false);
});

// 7. Under target — grow toward caps to reach the budget exactly.
test("grow-to-fill: short sections grow toward caps to hit the target", () => {
  const p = solveDurations(
    [spec("s1", "stat", 1), spec("s2", "stat", 2)], // ideal 3+3 = 6
    { totalSec: 8, fps: 30 } // sMax 5+5=10 > 8, so exact fill via grow
  );
  assert.equal(p.feasible, true);
  assert.equal(p.underfilled, false);
  assert.equal(p.totalFrames, 240);
  assert.equal(sumFrames(p), 240);
});

// 7b. Truly unfillable — even every section at max is under budget.
test("underfilled: sum of maxes < budget → underfilled=true, honest shorter total", () => {
  const p = solveDurations([spec("s1", "stat", 1)], { totalSec: 30, fps: 30 }); // stat max 5
  assert.equal(p.underfilled, true);
  assert.equal(p.totalFrames, 150); // 5s × 30
  assert.ok(p.totalSec < 30);
});

// 8. Tolerance guard — feasible & fillable inputs always land within tolerance.
test("fuzz: feasible+fillable plans land within tolerance of the budget", () => {
  // Deterministic seeded PRNG (no Math.random, for reproducibility).
  let seed = 1337;
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const types = Object.keys(SECTION_DURATION_DEFAULTS) as any[];
  for (let iter = 0; iter < 60; iter++) {
    const n = 3 + Math.floor(rand() * 5);
    const secs: SectionSpec[] = [];
    let sMin = 0, sMax = 0;
    for (let i = 0; i < n; i++) {
      const t = types[Math.floor(rand() * types.length)];
      const def = SECTION_DURATION_DEFAULTS[t];
      secs.push(spec(`s${i}`, t, 1 + Math.floor(rand() * 3)));
      sMin += def.min; sMax += def.max;
    }
    // Choose a budget guaranteed inside [sMin, sMax] so the plan is fillable.
    const totalSec = sMin + rand() * (sMax - sMin);
    const fps = 30;
    const p = solveDurations(secs, { totalSec, fps, tolerancePct: 2 });
    assert.equal(p.feasible, true);
    assert.equal(p.underfilled, false);
    assert.equal(sumFrames(p), p.totalFrames);
    const errPct = Math.abs(p.totalSec - totalSec) / totalSec * 100;
    assert.ok(errPct <= 2, `iter ${iter}: ${errPct.toFixed(3)}% > 2% (total ${p.totalSec} vs ${totalSec})`);
  }
});

// 9. Degenerate inputs — no crashes.
test("degenerate: empty sections is infeasible with a note; single section is exact", () => {
  const empty = solveDurations([], { totalSec: 30, fps: 30 });
  assert.equal(empty.feasible, false);
  assert.equal(empty.sections.length, 0);
  assert.ok(empty.notes.length > 0);

  const one = solveDurations([spec("h", "hook", 1)], { totalSec: 3, fps: 30 });
  assert.equal(one.sections.length, 1);
  assert.equal(one.totalFrames, 90);
  assert.equal(one.feasible, true);
});
