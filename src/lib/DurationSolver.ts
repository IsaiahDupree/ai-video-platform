// Duration Constraint Solver — the deterministic keystone of the retention-critic
// video foundry. Turns a target runtime + ordered content points into frame-exact
// per-section durations. Pure: no LLM, no network, no filesystem — every downstream
// component (retention scoring, revision re-timing, evidence mapping) measures
// against the truthful budget this produces, and VideoQAInspector.checkDuration
// already enforces a ±2% rendered-vs-target tolerance that had no upstream solver
// producing a valid target until now.
//
// Aligned to the real ContentBrief.Section schema (duration_sec / start_time_sec)
// and to Remotion's frame model (durationInFrames): the two are kept internally
// consistent by deriving seconds from the frame-exact apportionment.

import type { SectionType, SectionSpec, DurationBudget, SolvedSection, SectionPackage } from "../types/ContentBrief";

interface DurationRange { min: number; max: number; ideal: number }
const D = (min: number, max: number, ideal: number): DurationRange => ({ min, max, ideal });

/** Per-section-type default floor / cap / ideal in SECONDS — the deterministic
 *  policy table. Tunable, and overridable per-section via SectionSpec.min/maxSec. */
export const SECTION_DURATION_DEFAULTS: Record<SectionType, DurationRange> = {
  hook: D(1.5, 4, 3),
  cta: D(1.5, 5, 3),
  intro: D(1.5, 5, 3),
  outro: D(1.5, 5, 3),
  transition: D(0.3, 1.5, 0.8),
  topic: D(2, 8, 4),
  content: D(2, 10, 5),
  list_item: D(1.5, 5, 3),
  comparison: D(2, 8, 4),
  compare: D(2, 8, 4),
  stat: D(1.5, 5, 3),
  testimonial: D(2, 8, 4),
  kinetic_caption: D(1, 4, 2),
  chapter_card: D(1, 3, 2),
  lower_third: D(1, 4, 2),
  end_screen: D(2, 6, 4),
  code: D(2, 12, 6),
  quote_card: D(2, 6, 3),
  phone_frame: D(2, 8, 4),
  countdown: D(1, 5, 3),
  checklist: D(2, 8, 4),
  bar_chart: D(2, 8, 4),
  myth_reality: D(2, 8, 4),
  problem_solution: D(3, 8, 5),
  thread_reveal: D(2, 8, 4),
  ugc_style: D(2, 10, 5),
  curiosity_gap: D(1.5, 5, 3),
  social_proof: D(1.5, 6, 3),
  avatar_pip: D(1, 10, 5),
};

const FALLBACK = D(1.5, 8, 4);

/** Words → seconds at a given words-per-minute rate. */
export function estimateNarrationSec(wordCount: number, wpm: number): number {
  if (wordCount <= 0 || wpm <= 0) return 0;
  return (wordCount / wpm) * 60;
}

/**
 * Apportion `totalFrames` across sections in proportion to their seconds, using
 * largest-remainder rounding so the returned integers sum to EXACTLY totalFrames
 * — no ±1 drift that would trip VideoQAInspector.checkDuration.
 */
export function distributeFrames(sectionSecs: number[], totalFrames: number): number[] {
  const n = sectionSecs.length;
  if (n === 0) return [];
  const sum = sectionSecs.reduce((a, b) => a + b, 0);
  if (sum <= 0 || totalFrames <= 0) {
    const out = new Array(n).fill(0);
    if (totalFrames > 0) out[0] = totalFrames; // degenerate: park all frames on the first section
    return out;
  }
  const raw = sectionSecs.map((s) => (s / sum) * totalFrames);
  const floors = raw.map((r) => Math.floor(r));
  let remainder = totalFrames - floors.reduce((a, b) => a + b, 0);
  // Distribute the remaining frames to the largest fractional parts. Ties break
  // by lower index so the result is fully deterministic.
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => (b.frac - a.frac) || (a.i - b.i));
  const out = floors.slice();
  for (let k = 0; k < order.length && remainder > 0; k++) {
    out[order[k].i] += 1;
    remainder--;
  }
  return out;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const EPS = 1e-6;

interface WorkSection {
  spec: SectionSpec;
  min: number;
  max: number;
  idealRaw: number;
  sec: number;
}

/**
 * Solve per-section durations for a target runtime. Pure & deterministic.
 *
 * Guarantees:
 *  - sum(section durationInFrames) === package.totalFrames, exactly.
 *  - when feasible and fillable, totalFrames === round(budget.totalSec * fps),
 *    i.e. the plan lands on the target to the frame.
 *  - must-keep sections (priority === 1) are never dropped, only clamped to floor.
 *  - feasible === false ONLY when must-keep floors alone exceed the budget.
 *  - underfilled === true when even every section at its max can't fill the budget.
 */
export function solveDurations(sections: SectionSpec[], budget: DurationBudget): SectionPackage {
  const fps = budget.fps > 0 ? budget.fps : 30;
  const wpm = budget.wpm && budget.wpm > 0 ? budget.wpm : 165;
  const hookFloor = budget.hookFloorSec ?? 1.5;
  const ctaFloor = budget.ctaFloorSec ?? 1.5;
  const notes: string[] = [];

  if (!sections.length) {
    return {
      budget, sections: [], droppedSectionIds: [], totalFrames: 0, totalSec: 0,
      feasible: false, underfilled: false, notes: ["No sections supplied — nothing to solve."],
    };
  }

  // 1. Resolve each section's min / max / ideal (seconds).
  const work: WorkSection[] = sections.map((spec) => {
    const def = SECTION_DURATION_DEFAULTS[spec.sectionType] ?? FALLBACK;
    let min = spec.minSec ?? def.min;
    if (spec.sectionType === "hook") min = Math.max(min, hookFloor);
    if (spec.sectionType === "cta") min = Math.max(min, ctaFloor);
    let max = spec.maxSec ?? def.max;
    if (max < min) max = min; // defend against inverted overrides
    const idealRaw = spec.wordCount != null ? estimateNarrationSec(spec.wordCount, wpm) : def.ideal;
    return { spec, min, max, idealRaw, sec: clamp(idealRaw, min, max) };
  });

  // 2. Drop lowest-priority droppables (priority > 1) if the sum of floors alone
  //    already exceeds the budget. Must-keeps (priority === 1) are never dropped.
  const dropped: string[] = [];
  let survivors = work.slice();
  const sumMin = (ws: WorkSection[]) => ws.reduce((a, w) => a + w.min, 0);
  if (sumMin(survivors) > budget.totalSec + EPS) {
    // Most-droppable first: highest priority number, ties break by later index.
    const droppable = survivors
      .map((w, i) => ({ w, i }))
      .filter((x) => x.w.spec.priority > 1)
      .sort((a, b) => (b.w.spec.priority - a.w.spec.priority) || (b.i - a.i));
    for (const cand of droppable) {
      if (sumMin(survivors) <= budget.totalSec + EPS) break;
      survivors = survivors.filter((w) => w !== cand.w);
      dropped.push(cand.w.spec.id);
    }
    if (dropped.length) notes.push(`Dropped ${dropped.length} low-priority section(s) to fit the budget: ${dropped.join(", ")}.`);
  }

  // 3. Feasibility: if even the must-keep floors overflow the budget, we can't fit.
  const mustKeepFloor = sumMin(survivors);
  let feasible = true;
  let underfilled = false;
  if (mustKeepFloor > budget.totalSec + EPS) {
    feasible = false;
    survivors.forEach((w) => { w.sec = w.min; });
    notes.push(`Infeasible: must-keep floors sum to ${mustKeepFloor.toFixed(2)}s > budget ${budget.totalSec}s. Emitting min-floor plan (over target).`);
  } else {
    // 4. Allocate to hit the budget exactly (or max out if it can't be filled).
    const sMin = sumMin(survivors);
    const sMax = survivors.reduce((a, w) => a + w.max, 0);
    if (budget.totalSec >= sMax - EPS) {
      survivors.forEach((w) => { w.sec = w.max; });
      if (budget.totalSec > sMax + EPS) {
        underfilled = true;
        notes.push(`Underfilled: every section at max sums to ${sMax.toFixed(2)}s < budget ${budget.totalSec}s. Consider adding a section or raising caps.`);
      }
    } else {
      // Seed at ideal, then correct to the budget exactly.
      survivors.forEach((w) => { w.sec = clamp(w.idealRaw, w.min, w.max); });
      let diff = budget.totalSec - survivors.reduce((a, w) => a + w.sec, 0);
      if (diff > EPS) {
        // Grow toward max, most-important first (priority asc, ties by index).
        const order = survivors.map((w, i) => ({ w, i })).sort((a, b) => (a.w.spec.priority - b.w.spec.priority) || (a.i - b.i));
        for (const { w } of order) {
          if (diff <= EPS) break;
          const room = w.max - w.sec;
          const add = Math.min(room, diff);
          w.sec += add; diff -= add;
        }
        notes.push("Grew higher-priority sections toward their caps to reach the target.");
      } else if (diff < -EPS) {
        // Shrink toward min, most-droppable first (priority desc, ties by index desc).
        let deficit = -diff;
        const order = survivors.map((w, i) => ({ w, i })).sort((a, b) => (b.w.spec.priority - a.w.spec.priority) || (b.i - a.i));
        for (const { w } of order) {
          if (deficit <= EPS) break;
          const room = w.sec - w.min;
          const cut = Math.min(room, deficit);
          w.sec -= cut; deficit -= cut;
        }
        notes.push("Shrank lower-priority sections toward their floors to hit the target.");
      }
    }
  }

  // 5. Frame apportionment — exact. Seconds are then derived from frames so the
  //    two representations never disagree.
  const secs = survivors.map((w) => w.sec);
  const allocatedSec = secs.reduce((a, b) => a + b, 0);
  const targetFrames = (feasible && !underfilled)
    ? Math.round(budget.totalSec * fps)
    : Math.round(allocatedSec * fps);
  const frames = distributeFrames(secs, targetFrames);

  // 6. Emit, with cumulative start times derived from the frame plan.
  const out: SolvedSection[] = [];
  let cursorFrame = 0;
  survivors.forEach((w, i) => {
    const f = frames[i];
    const durationSec = f / fps;
    const clamped =
      w.idealRaw < w.min - EPS ||
      w.idealRaw > w.max + EPS ||
      Math.abs(w.sec - w.min) < 1e-3 ||
      Math.abs(w.sec - w.max) < 1e-3;
    out.push({
      id: w.spec.id,
      sectionType: w.spec.sectionType,
      content: w.spec.content,
      priority: w.spec.priority,
      durationSec,
      startTimeSec: cursorFrame / fps,
      durationInFrames: f,
      startFrame: cursorFrame,
      wasClamped: clamped,
    });
    cursorFrame += f;
  });

  const totalFrames = frames.reduce((a, b) => a + b, 0);
  return {
    budget,
    sections: out,
    droppedSectionIds: dropped,
    totalFrames,
    totalSec: totalFrames / fps,
    feasible,
    underfilled,
    notes,
  };
}
