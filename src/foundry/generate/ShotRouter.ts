// Shot router — deterministic mapping from section type to media generator, plus
// the shot-plan builder with cost estimates. Pure & testable: routing and cost
// are computed with zero API calls, so you can preview (and price) a whole video
// before spending a single HeyGen credit.

import type { SectionType } from "../../types/ContentBrief";
import type { EditPlan } from "../EditPlan";
import type { GeneratorKind, ShotAssignment, GenerationPlan } from "./Generator";

/** HeyGen price per second by engine (from the /heygen skill). */
export const HEYGEN_USD_PER_SEC: Record<string, number> = { v3: 0.0333, v4: 0.10 };

/**
 * Section type → generator. Talking-head beats become HeyGen A-roll; data/graphic
 * beats become code-rendered scenes (we already have 32); narrative filler leans
 * on scenes/B-roll. Deliberately explicit for every SectionType so routing never
 * silently falls through.
 */
export const SECTION_GENERATOR: Record<SectionType, GeneratorKind> = {
  // A-roll — a person talking to camera
  hook: "heygen_avatar",
  cta: "heygen_avatar",
  content: "heygen_avatar",
  avatar_pip: "heygen_avatar",
  testimonial: "heygen_avatar",
  ugc_style: "heygen_avatar",
  // Graphics / data / motion — code-rendered scenes
  stat: "remotion_scene",
  bar_chart: "remotion_scene",
  comparison: "remotion_scene",
  compare: "remotion_scene",
  checklist: "remotion_scene",
  countdown: "remotion_scene",
  quote_card: "remotion_scene",
  myth_reality: "remotion_scene",
  curiosity_gap: "remotion_scene",
  social_proof: "remotion_scene",
  code: "remotion_scene",
  phone_frame: "remotion_scene",
  chapter_card: "remotion_scene",
  lower_third: "remotion_scene",
  kinetic_caption: "remotion_scene",
  thread_reveal: "remotion_scene",
  problem_solution: "remotion_scene",
  list_item: "remotion_scene",
  topic: "remotion_scene",
  intro: "remotion_scene",
  outro: "remotion_scene",
  end_screen: "remotion_scene",
  transition: "remotion_scene",
};

export interface ShotPlanOptions {
  /** HeyGen engine for A-roll cost: "v3" (default) or "v4". */
  engine?: string;
  /** Force some section types to B-roll (e.g. keep talking-head budget down). */
  brollSections?: SectionType[];
}

const REASON: Record<GeneratorKind, string> = {
  heygen_avatar: "talking-head beat → HeyGen A-roll",
  remotion_scene: "data/graphic beat → code-rendered scene",
  hyperframes: "motion-graphic beat → HyperFrames",
  stock_broll: "illustrative beat → B-roll",
  gap: "placeholder",
};

export function planGeneration(plan: EditPlan, opts: ShotPlanOptions = {}): GenerationPlan {
  const engine = opts.engine ?? "v3";
  const pricePerSec = HEYGEN_USD_PER_SEC[engine] ?? HEYGEN_USD_PER_SEC.v3;
  const forceBroll = new Set(opts.brollSections ?? []);
  const track = plan.tracks.find((t) => t.role === "video");
  const clips = track?.clips ?? [];

  const shots: ShotAssignment[] = clips.map((c) => {
    const st = c.sectionType ?? "content";
    let generator: GeneratorKind = SECTION_GENERATOR[st] ?? "remotion_scene";
    if (forceBroll.has(st)) generator = "stock_broll";
    const durationSec = c.durationInFrames / plan.fps;
    const estCostUsd = generator === "heygen_avatar" ? +(durationSec * pricePerSec).toFixed(4) : 0;
    return {
      clipId: c.id,
      sectionType: st,
      generator,
      script: c.name, // full narration threaded here by the orchestrator; name is the beat text
      durationSec: +durationSec.toFixed(3),
      durationInFrames: c.durationInFrames,
      estCostUsd,
      reason: REASON[generator],
    };
  });

  const byGenerator: Record<string, number> = {};
  for (const s of shots) byGenerator[s.generator] = (byGenerator[s.generator] || 0) + 1;
  const heygenSeconds = +shots.filter((s) => s.generator === "heygen_avatar").reduce((a, s) => a + s.durationSec, 0).toFixed(2);
  const totalEstCostUsd = +shots.reduce((a, s) => a + s.estCostUsd, 0).toFixed(4);

  return {
    shots,
    byGenerator,
    totalEstCostUsd,
    heygenSeconds,
    engine,
    notes: [
      `${byGenerator.heygen_avatar ?? 0} A-roll shot(s), ${heygenSeconds}s of HeyGen ${engine} ≈ $${totalEstCostUsd}.`,
      `${byGenerator.remotion_scene ?? 0} scene(s) render free at assembly.`,
    ],
  };
}
