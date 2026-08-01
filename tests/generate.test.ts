// Tests for the generation stage: shot routing, shot-plan costing, and the
// v3-compliant HeyGen request builder. Pure — no HeyGen credits spent.
// Run: node --test tests/generate.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { solveDurations } from "../src/lib/DurationSolver.ts";
import { sectionPackageToEditPlan } from "../src/foundry/EditPlan.ts";
import { planGeneration, SECTION_GENERATOR } from "../src/foundry/generate/ShotRouter.ts";
import { buildHeyGenRequest, estimateHeyGenCost, heyGenGenerator, ISAIAH_AVATAR_ID, ISAIAH_VOICE_ID } from "../src/foundry/generate/HeyGenGenerator.ts";
import type { SectionSpec, DurationBudget } from "../src/types/ContentBrief";

const spec = (id: string, sectionType: any, priority: number, extra: Partial<SectionSpec> = {}): SectionSpec =>
  ({ id, sectionType, content: `${id} narration`, priority, ...extra });

function demoPlan() {
  const secs = [
    spec("hook", "hook", 1),
    spec("stat1", "stat", 2),
    spec("body", "content", 2),
    spec("chart", "bar_chart", 2),
    spec("cta", "cta", 1),
  ];
  const budget: DurationBudget = { totalSec: 60, fps: 30 };
  return sectionPackageToEditPlan(solveDurations(secs, budget), { id: "demo" });
}

// Routing — talking beats to HeyGen, data beats to scenes.
test("shot router sends talking-head beats to HeyGen and data beats to scenes", () => {
  assert.equal(SECTION_GENERATOR.hook, "heygen_avatar");
  assert.equal(SECTION_GENERATOR.cta, "heygen_avatar");
  assert.equal(SECTION_GENERATOR.content, "heygen_avatar");
  assert.equal(SECTION_GENERATOR.stat, "remotion_scene");
  assert.equal(SECTION_GENERATOR.bar_chart, "remotion_scene");
  // Every SectionType routes somewhere (no undefined fall-through).
  for (const [k, v] of Object.entries(SECTION_GENERATOR)) assert.ok(v, `${k} unrouted`);
});

// Shot plan — cost only on A-roll seconds, correct counts.
test("planGeneration prices only HeyGen A-roll and counts generators", () => {
  const plan = demoPlan();
  const gp = planGeneration(plan, { engine: "v3" });
  assert.equal(gp.shots.length, 5);
  assert.equal(gp.byGenerator.heygen_avatar, 3); // hook, content, cta
  assert.equal(gp.byGenerator.remotion_scene, 2); // stat, bar_chart
  // Scenes are free; total cost equals A-roll seconds × price.
  const expected = +(gp.heygenSeconds * 0.0333).toFixed(4);
  assert.ok(Math.abs(gp.totalEstCostUsd - expected) < 0.002, `${gp.totalEstCostUsd} vs ${expected}`);
  // v4 is pricier than v3 for the same plan.
  const gp4 = planGeneration(plan, { engine: "v4" });
  assert.ok(gp4.totalEstCostUsd > gp.totalEstCostUsd);
});

// forceBroll re-routes chosen section types.
test("planGeneration can force sections to B-roll", () => {
  const gp = planGeneration(demoPlan(), { brollSections: ["content"] });
  const body = gp.shots.find((s) => s.clipId === "body")!;
  assert.equal(body.generator, "stock_broll");
  assert.equal(body.estCostUsd, 0);
});

// HeyGen request — v3 migration: engine is an OBJECT, not a string.
test("buildHeyGenRequest emits engine as an object (v3-compliant) with Isaiah defaults", () => {
  const req = buildHeyGenRequest("Hello world", { test: true });
  const ch = req.video_inputs[0].character;
  assert.equal(typeof ch.engine, "object", "engine must be an object, not a string (v3 breaking change)");
  assert.equal(ch.engine.type, "avatar_v");
  assert.equal(ch.avatar_id, ISAIAH_AVATAR_ID);
  assert.equal(req.video_inputs[0].voice.voice_id, ISAIAH_VOICE_ID);
  assert.equal(req.video_inputs[0].voice.input_text, "Hello world");
  assert.equal(req.test, true, "defaults to test mode — never spend by accident");
  assert.deepEqual(req.dimension, { width: 1080, height: 1920 });
});

test("estimateHeyGenCost matches engine pricing", () => {
  assert.ok(Math.abs(estimateHeyGenCost(60, "v3") - 2.0) < 0.01); // ~$2/min
  assert.ok(Math.abs(estimateHeyGenCost(60, "v4") - 6.0) < 0.01); // ~$6/min
});

// Generator seam — dry run does no network; injected submit is used.
test("heyGenGenerator.generate is dry-run safe and uses an injected submit", async () => {
  const shot = { clipId: "hook", sectionType: "hook" as const, generator: "heygen_avatar" as const, script: "Hi", durationSec: 3, durationInFrames: 90, estCostUsd: 0.1, reason: "" };
  const dry = await heyGenGenerator.generate(shot, {});
  assert.match(dry.assetRef, /^\(dry-run:heygen/);
  let sawTest: boolean | undefined;
  const real = await heyGenGenerator.generate(shot, { submit: async (req) => { sawTest = req.test; return { assetRef: "https://cdn/x.mp4", durationSec: 3 }; } });
  assert.equal(real.assetRef, "https://cdn/x.mp4");
  assert.equal(sawTest, true, "submit receives test-mode request by default");
});
