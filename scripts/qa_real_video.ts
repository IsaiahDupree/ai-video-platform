/**
 * qa_real_video.ts — Run QA inspector against a real rendered video.
 * Usage: npx tsx scripts/qa_real_video.ts [path/to/video.mp4]
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { adaptiveFrameCount, extractVideoMetadata, inspectVideo } from "../src/lib/VideoQAInspector";
import { getBrandConfig } from "../src/lib/BrandStyleConfig";

const VIDEO = process.argv[2] ?? "./output/architect_of_autonomy.mp4";
const OPENAI_KEY = process.env.OPENAI_API_KEY ?? "";

console.log(`Video: ${VIDEO}`);
console.log(`OpenAI key: ${OPENAI_KEY ? "✅ present" : "⚠️  missing (vision skipped)"}`);
console.log("");

async function main() {
  const meta = extractVideoMetadata(VIDEO);
  const fc = adaptiveFrameCount(meta.durationSec);

  console.log(`Duration:   ${meta.durationSec.toFixed(1)}s (${(meta.durationSec / 60).toFixed(1)} min)`);
  console.log(`Resolution: ${meta.width}x${meta.height}  FPS: ${meta.fps}  Audio: ${meta.hasAudioStream}`);
  console.log(`Frames:     ${fc} (adaptive for ${meta.durationSec.toFixed(0)}s video)`);
  console.log("");
  console.log("Running QA inspection...");

  const report = await inspectVideo({
    renderedPath: VIDEO,
    sourceDurationSec: meta.durationSec, // use actual as source for standalone inspection
    brandId: "isaiah_personal",
    brandConfig: getBrandConfig("isaiah_personal"),
    openaiKey: OPENAI_KEY,
    skipVisionAnalysis: !OPENAI_KEY,
    attemptNumber: 1,
    platform: "instagram",
  });

  console.log("");
  console.log("═══════════════════════ QA REPORT ═══════════════════════");
  console.log(`Frames analyzed:  ${report.frames.length}`);
  console.log(`Duration valid:   ${report.durationValid} (${report.durationDeltaPct.toFixed(2)}%)`);
  console.log(`Caption state:    ${report.captionState}`);
  console.log(`Hook state:       ${report.hookState}`);
  console.log(`QA score:         ${report.qaScore}/100`);
  console.log(`Decision:         ${report.qaDecision}`);
  if (report.suggestedHook) console.log(`Suggested hook:   ${report.suggestedHook}`);
  if (report.qaIssues.length) console.log(`Issues:           ${report.qaIssues.join(", ")}`);

  if (report.frames.length > 0) {
    console.log("");
    console.log("Per-frame breakdown:");
    for (const f of report.frames) {
      const pos = (f.positionPct * 100).toFixed(0).padStart(3);
      const lower = f.hasLowerThirdText ? "✓ captions" : "✗ captions";
      const upper = f.hasUpperText ? "✓ hook" : "✗ hook";
      const texts = f.textSamples.slice(0, 2).join(" | ") || "(none)";
      console.log(`  [${pos}%] ${lower}  ${upper}  conf=${f.confidence.toFixed(2)}  "${texts}"`);
    }
  }
  console.log("═══════════════════════════════════════════════════════════");
}

main().catch((e) => {
  console.error("QA failed:", e);
  process.exit(1);
});
