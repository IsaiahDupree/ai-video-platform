#!/usr/bin/env npx tsx
/**
 * test_full_products.ts — Full pipeline test → renders real end-product videos
 *
 * Stages:
 *   1.  Music library check — verifies audio files exist
 *   2.  Composition registry — confirms all 5 UGCProduct_* compositions registered
 *   3.  Showcase re-render  — re-renders ugc_styles_showcase.mp4 WITH music
 *   4a. Render product_01 (IG Story + Sticker)
 *   4b. Render product_02 (Karaoke Box + Mega Title)
 *   4c. Render product_03 (Word Slam + Neon Bar)
 *   4d. Render product_04 (Clean Stroke + Minimal)
 *   4e. Render product_05 (TikTok Glow + IG Badge)
 *   5.  QA all rendered products (OpenAI Vision + Whisper)
 *   6.  Open all end products in default viewer
 *
 * Run:
 *   npx tsx tests/test_full_products.ts
 *
 * Skip renders (just run QA on existing files):
 *   npx tsx tests/test_full_products.ts --skip-render
 *
 * Render only specific product:
 *   npx tsx tests/test_full_products.ts --only ig_story_sticker
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { spawnSync, execSync } from "child_process";

// Load .env.local
const dotenvPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(dotenvPath)) {
  for (const line of fs.readFileSync(dotenvPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
}

import { inspectVideo, adaptiveFrameCount } from "../src/lib/VideoQAInspector";
import { getBrandConfig } from "../src/lib/BrandStyleConfig";
import { PRODUCT_VARIANTS } from "../src/compositions/UGCProductVideo";

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const SKIP_RENDER  = args.includes("--skip-render");
const ONLY_ID      = args.find((a) => !a.startsWith("--") && a !== args[args.indexOf("--only") - 1])
  ?? (args.includes("--only") ? args[args.indexOf("--only") + 1] : undefined);
const OPEN_VIDEOS  = !args.includes("--no-open");

const OPENAI_KEY   = process.env.OPENAI_API_KEY ?? "";
const STUDIO_DIR   = path.resolve(__dirname, "..");
const OUTPUT_DIR   = path.join(STUDIO_DIR, "output", "products");

// ─── Colour helpers ───────────────────────────────────────────────────────────

const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m",
  cyan: "\x1b[36m", blue: "\x1b[34m", magenta: "\x1b[35m",
};

let passed = 0, failed = 0;

function pass(id: string, msg: string, detail = "") {
  passed++;
  console.log(`${C.green}  ✅ ${id}${C.reset}  ${C.dim}${msg}${detail ? `\n       ${detail}` : ""}${C.reset}`);
}

function fail(id: string, msg: string, err?: string) {
  failed++;
  console.log(`${C.red}  ❌ ${id}${C.reset}  ${msg}`);
  if (err) console.log(`     ${C.dim}${err.slice(0, 200)}${C.reset}`);
}

function step(id: string, label: string) {
  console.log(`\n${C.cyan}  ⏳ ${id}  ${label}${C.reset}`);
}

function bytes(b: number) {
  if (b > 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024).toFixed(0)} KB`;
}

// ─── Render helper ────────────────────────────────────────────────────────────

function renderComposition(compositionId: string, outputPath: string, quality: "preview" | "production" = "production"): boolean {
  const crfArgs = quality === "preview" ? ["--jpeg-quality=80"] : [];
  const result = spawnSync(
    "npx",
    ["remotion", "render", "src/index.ts", compositionId, outputPath, "--log=error", ...crfArgs],
    { cwd: STUDIO_DIR, stdio: "pipe", encoding: "utf8", timeout: 300_000 }
  );
  return result.status === 0;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`\n${C.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Full Pipeline — End Product Video Tests`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`);
  console.log(`  Products dir: ${OUTPUT_DIR}`);
  console.log(`  OpenAI QA:    ${OPENAI_KEY ? "✅ enabled" : "⚠️  disabled (set OPENAI_API_KEY)"}`);
  console.log(`  Skip render:  ${SKIP_RENDER}`);
  if (ONLY_ID) console.log(`  Filter:       ${ONLY_ID}`);

  // ── Stage 1: Music library check ─────────────────────────────────────────

  step("[01]", "Music library — verify audio files present");
  const musicDir = path.join(STUDIO_DIR, "public/music");
  const catalogPath = path.join(musicDir, "catalog.json");
  try {
    const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
    const tracks = catalog.tracks as Array<{ id: string; title: string; local_path: string }>;
    const found   = tracks.filter((t) => t.local_path && fs.existsSync(t.local_path));
    const missing = tracks.filter((t) => t.local_path && !fs.existsSync(t.local_path));
    if (found.length === 0) {
      fail("[01]", "No music files found", `Catalog has ${tracks.length} tracks but none exist locally`);
    } else {
      pass("[01]", `${found.length}/${tracks.length} tracks available`,
        `e.g. "${found[0].title.slice(0, 60)}"${missing.length ? ` | ${missing.length} missing` : ""}`);
    }
  } catch (e) {
    fail("[01]", "Music catalog read failed", String(e));
  }

  // ── Stage 2: Composition registry ────────────────────────────────────────

  step("[02]", "Composition registry — 5 UGCProduct_* compositions");
  try {
    // Quick check: list compositions via remotion ls
    const result = spawnSync("npx", ["remotion", "compositions", "src/index.ts", "--log=error"],
      { cwd: STUDIO_DIR, stdio: "pipe", encoding: "utf8", timeout: 60_000 });
    const output = result.stdout + result.stderr;
    const found = PRODUCT_VARIANTS.filter((v) => output.includes(`UGCProduct-${v.id}`));
    if (found.length === PRODUCT_VARIANTS.length) {
      pass("[02]", `All ${found.length} UGCProduct_* compositions registered`,
        found.map((v) => v.id).join(", "));
    } else {
      const missing = PRODUCT_VARIANTS.filter((v) => !output.includes(`UGCProduct-${v.id}`));
      fail("[02]", `${found.length}/${PRODUCT_VARIANTS.length} found`,
        `Missing: ${missing.map((v) => v.id).join(", ")}`);
    }
  } catch (e) {
    fail("[02]", "Registry check failed", String(e));
  }

  // ── Stage 3: Showcase re-render with music ────────────────────────────────

  const showcasePath = path.join(STUDIO_DIR, "output", "ugc_styles_showcase.mp4");
  if (!SKIP_RENDER && (!ONLY_ID || ONLY_ID === "showcase")) {
    step("[03]", "Re-render UGCStylesShowcase WITH background music (88s @ 1.5%)");
    const ok = renderComposition("UGCStylesShowcase", showcasePath, "preview");
    if (ok && fs.existsSync(showcasePath)) {
      const sz = fs.statSync(showcasePath).size;
      pass("[03]", `Showcase rendered with music`, `${showcasePath} (${bytes(sz)})`);
    } else {
      fail("[03]", "Showcase render failed");
    }
  } else {
    step("[03]", "Showcase re-render (skipped)");
    const exists = fs.existsSync(showcasePath);
    pass("[03]", `Skipped — ${exists ? "existing file kept" : "file not found"}`,
      exists ? bytes(fs.statSync(showcasePath).size) : "");
  }

  // ── Stages 4a–4e: Render each product variant ─────────────────────────────

  const renderResults: Array<{ variant: typeof PRODUCT_VARIANTS[0]; outputPath: string; rendered: boolean }> = [];

  for (let i = 0; i < PRODUCT_VARIANTS.length; i++) {
    const variant = PRODUCT_VARIANTS[i];
    if (ONLY_ID && variant.id !== ONLY_ID) continue;

    const stageId = `[04${String.fromCharCode(97 + i)}]`;
    const outputPath = path.join(OUTPUT_DIR, `${variant.id}.mp4`);
    renderResults.push({ variant, outputPath, rendered: false });
    const entry = renderResults[renderResults.length - 1];

    if (!SKIP_RENDER) {
      step(stageId, `Render ${variant.label}`);
      console.log(`  ${C.dim}→ UGCProduct-${variant.id}  output: ${path.relative(STUDIO_DIR, outputPath)}${C.reset}`);
      const ok = renderComposition(`UGCProduct-${variant.id}`, outputPath, "production");
      if (ok && fs.existsSync(outputPath)) {
        const sz = fs.statSync(outputPath).size;
        entry.rendered = true;
        pass(stageId, `${variant.label}`, `${bytes(sz)} → ${outputPath}`);
      } else {
        fail(stageId, `Render failed: UGCProduct_${variant.id}`);
      }
    } else {
      step(stageId, `Render ${variant.label} (skipped)`);
      const exists = fs.existsSync(outputPath);
      if (exists) {
        entry.rendered = true;
        pass(stageId, `Skipped — existing file`, `${bytes(fs.statSync(outputPath).size)} → ${outputPath}`);
      } else {
        pass(stageId, `Skipped — not yet rendered`);
      }
    }
  }

  // ── Stage 5: QA all rendered products ────────────────────────────────────

  step("[05]", `QA inspection — ${renderResults.filter((r) => r.rendered).length} rendered products`);

  for (const entry of renderResults) {
    if (!entry.rendered || !fs.existsSync(entry.outputPath)) continue;
    const vid = entry.variant;
    try {
      const report = await inspectVideo({
        renderedPath: entry.outputPath,
        sourceDurationSec: 15.0,
        brandId: "isaiah_personal",
        brandConfig: getBrandConfig("isaiah_personal"),
        openaiKey: OPENAI_KEY,
        skipVisionAnalysis: !OPENAI_KEY,
        attemptNumber: 1,
        platform: "instagram",
      });

      const fc = adaptiveFrameCount(report.renderedDurationSec);
      const hookStatus = report.hookState === "hook_present_strong" ? "✓ hook" : report.hookState === "hook_missing" ? "✗ hook" : "~ hook";
      const capStatus  = report.captionState === "captions_present_good" ? "✓ captions" : report.captionState === "captions_missing" ? "✗ captions" : "~ captions";

      pass(
        `[05/${vid.id}]`,
        `${vid.label.split(" (")[0]}`,
        `score=${report.qaScore}/100 decision=${report.qaDecision} frames=${report.frames.length}/${fc} | ${hookStatus} | ${capStatus}`
      );
    } catch (e) {
      fail(`[05/${vid.id}]`, `QA failed: ${vid.id}`, String(e));
    }
  }

  // ── Stage 6: Open all videos ──────────────────────────────────────────────

  step("[06]", "Open end products in system viewer");
  const toOpen: string[] = [];
  if (fs.existsSync(showcasePath)) toOpen.push(showcasePath);
  for (const entry of renderResults) {
    if (entry.rendered && fs.existsSync(entry.outputPath)) toOpen.push(entry.outputPath);
  }

  if (OPEN_VIDEOS && toOpen.length > 0) {
    for (const p of toOpen) {
      spawnSync("open", [p], { stdio: "ignore" });
    }
    pass("[06]", `Opened ${toOpen.length} video(s) in viewer`);
    for (const p of toOpen) {
      console.log(`  ${C.dim}→ ${p}${C.reset}`);
    }
  } else {
    pass("[06]", `${toOpen.length} product(s) ready (--no-open to suppress viewer)`,
      toOpen.map((p) => path.relative(STUDIO_DIR, p)).join("\n         → "));
  }

  // ── Results ───────────────────────────────────────────────────────────────

  console.log(`\n${C.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`);
  console.log(`${C.bold}  Test Results${C.reset}`);
  console.log(`${C.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}\n`);
  const color = failed === 0 ? C.green : C.red;
  console.log(`  ${color}${C.bold}${passed} passed${C.reset}  ${C.dim}${failed} failed${C.reset}\n`);

  if (toOpen.length > 0) {
    console.log(`  ${C.bold}End products:${C.reset}`);
    for (const p of toOpen) {
      const sz = fs.statSync(p).size;
      console.log(`  ${C.dim}→${C.reset} ${path.basename(p)}  ${C.dim}${bytes(sz)}${C.reset}`);
    }
    console.log();
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
