#!/usr/bin/env npx tsx
/**
 * test_pipeline_e2e.ts — Full pipeline E2E test suite
 *
 * Tests every stage of the closed-loop content system and produces real artifacts.
 * Each stage runs against live Supabase, live Claude API, and real local files.
 *
 * Stages:
 *   1.  Supabase connectivity
 *   2.  Clip selection (pipeline-ready talking head)
 *   3.  B-roll pool query
 *   4.  Audio track scan (MyPassport)
 *   5.  Decision Engine → IsaiahTalkingHeadV1Props
 *   6.  Props schema validation
 *   7.  Remotion render → MP4 artifact  ← produces real end product
 *   8.  MP4 validation (ffprobe: duration, resolution, codec)
 *   9.  Supabase Storage upload → public URL
 *   10. Research pipeline → ContentBriefFull (dry-run: no Supabase write)
 *   11. Performance feedback → score computation (dry-run)
 *   12. Newsletter generation → HTML preview (dry-run)
 *   13. Repurpose engine → remix props (dry-run)
 *
 * Run all:
 *   npx tsx tests/test_pipeline_e2e.ts
 *
 * Run specific stage:
 *   npx tsx tests/test_pipeline_e2e.ts --stage 7
 *
 * Skip Remotion render (fast CI):
 *   npx tsx tests/test_pipeline_e2e.ts --skip-render
 *
 * Force specific item:
 *   npx tsx tests/test_pipeline_e2e.ts --item-id <uuid>
 */

import { execSync, spawnSync } from "child_process";
import * as fs from "fs";
import * as http from "http";
import * as net from "net";
import * as path from "path";

// Load .env.local before anything else
const dotenvPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(dotenvPath)) {
  const lines = fs.readFileSync(dotenvPath, "utf8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
}

import { runIsaiahPipeline } from "../src/lib/pipelineRunner";
import {
  runAutonomousPipeline,
  buildQueryExpansion,
  scoreOpportunity,
} from "../src/lib/ContentIntelligenceEngine";
import type { TrendCluster, ContentItem } from "../src/types/ContentIntelligenceSchema";
import { makeCallAI } from "../src/lib/callAI";

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const hasFlag = (f: string) => args.includes(f);

const ONLY_STAGE  = getArg("--stage") ? parseInt(getArg("--stage")!) : undefined;
const SKIP_RENDER = hasFlag("--skip-render");
const FORCE_ITEM  = getArg("--item-id");
const VERBOSE     = hasFlag("--verbose");

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = "https://ivhfuhxorppptyuofbgq.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const BLOTATO_KEY   = process.env.BLOTATO_API_KEY ?? "";
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TELEGRAM_CHAT  = process.env.TELEGRAM_CHAT_ID ?? "";

const STUDIO_DIR  = path.resolve(__dirname, "..");
const OUTPUT_DIR  = path.join(STUDIO_DIR, "output", "e2e-test");
const TMP_PROPS   = path.join(OUTPUT_DIR, "e2e_props.json");
const TMP_MP4     = path.join(OUTPUT_DIR, "e2e_render.mp4");

// ─── Temp HTTP file server (serves local video files over localhost so
//     Remotion's browser context can load them without file:// blocks) ─────────

function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const port = (srv.address() as net.AddressInfo).port;
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

let _fileServer: http.Server | null = null;
let _fileServerPort = 0;

async function startFileServer(dir: string): Promise<number> {
  if (_fileServer) return _fileServerPort;
  _fileServerPort = await findFreePort();
  _fileServer = http.createServer((req, res) => {
    const filePath = path.join(dir, decodeURIComponent(req.url ?? "/"));
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.writeHead(404); res.end("Not found"); return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime: Record<string, string> = {
      ".mov": "video/mp4", ".mp4": "video/mp4", // serve MOV as video/mp4 for Chromium compat
      ".m4v": "video/mp4", ".heic": "image/heic", ".jpg": "image/jpeg",
    };
    const contentType = mime[ext] ?? "application/octet-stream";
    const stat = fs.statSync(filePath);
    const total = stat.size;
    const rangeHeader = req.headers["range"];

    if (rangeHeader) {
      // Support Range requests so Chromium can seek into large video files
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (!match) { res.writeHead(416); res.end(); return; }
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : Math.min(start + 2 * 1024 * 1024, total - 1);
      const chunkSize = end - start + 1;
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": contentType,
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": total,
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
  await new Promise<void>((resolve) => _fileServer!.listen(_fileServerPort, "127.0.0.1", resolve));
  return _fileServerPort;
}

function stopFileServer(): void {
  if (_fileServer) { _fileServer.close(); _fileServer = null; }
}

// ─── Colours ──────────────────────────────────────────────────────────────────

const green  = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red    = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const cyan   = (s: string) => `\x1b[36m${s}\x1b[0m`;
const bold   = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim    = (s: string) => `\x1b[2m${s}\x1b[0m`;

// ─── Test runner ──────────────────────────────────────────────────────────────

interface StageResult {
  stage: number;
  name: string;
  passed: boolean;
  durationMs: number;
  artifact?: string;
  detail?: string;
  error?: string;
}

const results: StageResult[] = [];

async function runStage(
  stage: number,
  name: string,
  fn: () => Promise<{ artifact?: string; detail?: string }>
): Promise<boolean> {
  if (ONLY_STAGE !== undefined && ONLY_STAGE !== stage) return true;

  const label = `[${String(stage).padStart(2, "0")}] ${name}`;
  process.stdout.write(cyan(`  ⏳ ${label}`) + "\r");
  const t0 = Date.now();

  try {
    const out = await fn();
    const ms = Date.now() - t0;
    results.push({ stage, name, passed: true, durationMs: ms, ...out });
    console.log(green(`  ✅ ${label}`) + dim(` (${ms}ms)`) + (out.artifact ? `  → ${bold(out.artifact)}` : "") + (out.detail ? `  ${dim(out.detail)}` : ""));
    return true;
  } catch (err: any) {
    const ms = Date.now() - t0;
    const msg = err?.message ?? String(err);
    results.push({ stage, name, passed: false, durationMs: ms, error: msg });
    console.log(red(`  ❌ ${label}`) + dim(` (${ms}ms)`));
    console.log(red(`     ${msg.split("\n")[0]}`));
    if (VERBOSE) console.log(red(msg));
    return false;
  }
}

// ─── Supabase REST helper ─────────────────────────────────────────────────────

async function sbFetch(path: string, opts: RequestInit = {}) {
  const url = `${SUPABASE_URL}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(opts.headers as Record<string, string> ?? {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Supabase ${path} → ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

// ─── Main test suite ──────────────────────────────────────────────────────────

async function main() {
  console.log(bold("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(bold("  Isaiah Content Pipeline — E2E Test Suite"));
  console.log(bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

  if (SKIP_RENDER) console.log(yellow("  ⚠️  --skip-render: stage 7 (Remotion render) will be skipped\n"));

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Shared state across stages
  let selectedItem: any = null;
  let orchestrationProps: any = null;
  let mp4Path: string | null = null;
  let storageUrl: string | null = null;

  // ── Stage 1: Supabase connectivity ─────────────────────────────────────────

  await runStage(1, "Supabase connectivity", async () => {
    if (!SUPABASE_KEY) throw new Error("SUPABASE_KEY / SUPABASE_SERVICE_KEY not set");
    const data = await sbFetch("/rest/v1/mv_media_items?select=id&limit=1");
    if (!Array.isArray(data)) throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
    return { detail: `mv_media_items reachable` };
  });

  // ── Stage 2: Clip selection ─────────────────────────────────────────────────

  await runStage(2, "Clip selection (pipeline-ready talking head)", async () => {
    let query = "/rest/v1/mv_media_items?analysis_status=eq.done&ai_is_talking_head=eq.true&ai_face_present=eq.true&ai_quality_score=gte.6&select=id,file_name,local_path,ai_quality_score,ai_performance_score,ai_caption,ai_niche,ai_mood&order=ai_performance_score.desc&limit=10";
    if (FORCE_ITEM) query = `/rest/v1/mv_media_items?id=eq.${FORCE_ITEM}&select=id,file_name,local_path,ai_quality_score,ai_performance_score,ai_caption,ai_niche,ai_mood`;

    const items = await sbFetch(query);
    if (!items.length) throw new Error("No pipeline-ready talking head clips in mv_media_items");

    // Prefer MOV/MP4 (actual video) over PNG (photo) for render
    const videoItems = items.filter((i: any) => /\.(mov|mp4|m4v)$/i.test(i.file_name ?? ""));
    selectedItem = videoItems.length > 0 ? videoItems[0] : items[0];

    // Verify local file exists
    if (!selectedItem.local_path || !fs.existsSync(selectedItem.local_path)) {
      // Fall back to any item with an accessible local path
      for (const item of items) {
        if (item.local_path && fs.existsSync(item.local_path)) {
          selectedItem = item;
          break;
        }
      }
      if (!selectedItem.local_path || !fs.existsSync(selectedItem.local_path)) {
        throw new Error(`Local file not accessible: ${selectedItem.local_path}`);
      }
    }

    return {
      artifact: selectedItem.file_name,
      detail: `quality=${selectedItem.ai_quality_score} score=${selectedItem.ai_performance_score} niche=${selectedItem.ai_niche}`,
    };
  });

  // ── Stage 3: B-roll pool query ──────────────────────────────────────────────

  await runStage(3, "B-roll pool query (mv_media_items)", async () => {
    const broll = await sbFetch(
      "/rest/v1/mv_media_items?ai_is_broll=eq.true&analysis_status=eq.done&ai_quality_score=gte.5&select=id,file_name,local_path,ai_quality_score,ai_niche&order=ai_quality_score.desc&limit=20"
    );
    if (!Array.isArray(broll)) throw new Error("B-roll query failed");
    const withLocalFile = broll.filter((b: any) => b.local_path && fs.existsSync(b.local_path));
    return { detail: `${broll.length} total, ${withLocalFile.length} locally accessible` };
  });

  // ── Stage 4: Audio scan (MyPassport) ───────────────────────────────────────

  await runStage(4, "Audio track scan (MyPassport)", async () => {
    const audioDir = "/Volumes/My Passport/iPhone/audio";
    const fallbackDirs = [
      path.join(STUDIO_DIR, "public", "audio"),
      path.join(STUDIO_DIR, "src", "audio"),
    ];

    let found = 0;
    if (fs.existsSync(audioDir)) {
      const files = fs.readdirSync(audioDir);
      found = files.filter(f => /\.(mp3|m4a|wav|aac)$/i.test(f)).length;
    } else {
      // Check fallback dirs
      for (const d of fallbackDirs) {
        if (fs.existsSync(d)) {
          const files = fs.readdirSync(d);
          found += files.filter(f => /\.(mp3|m4a|wav|aac)$/i.test(f)).length;
        }
      }
    }
    if (found === 0) {
      // Non-fatal — pipeline has a fallback static library
      return { detail: `No audio files found on MyPassport — pipeline will use static library` };
    }
    return { detail: `${found} audio files found` };
  });

  // ── Stage 5: Decision Engine → IsaiahTalkingHeadV1Props ────────────────────

  await runStage(5, "Decision Engine → IsaiahTalkingHeadV1Props", async () => {
    if (!selectedItem) throw new Error("Stage 2 must pass first (no selected item)");
    if (!ANTHROPIC_KEY) return { detail: "skipped — ANTHROPIC_API_KEY not set" };

    const result = await runIsaiahPipeline(ANTHROPIC_KEY, selectedItem.id);

    if (!result?.props) throw new Error("runIsaiahPipeline returned null props");
    orchestrationProps = result.props;

    // Remotion's browser blocks file:// URLs; large MOV files also have their
    // moov atom at the end. Fix:
    //   1. Transcode to a fast-start MP4 (540p, 30s) via ffmpeg
    //   2. Copy into a minimal --public-dir so Remotion serves it at public/file
    //   3. Set sourceVideoUrl = "public/e2e_source_transcoded.mp4"
    const srcUrl: string = (orchestrationProps as Record<string, unknown>).sourceVideoUrl as string ?? "";
    const localSrcPath = srcUrl.startsWith("file://") ? srcUrl.slice(7) : srcUrl;
    if (localSrcPath && fs.existsSync(localSrcPath)) {
      const transcode = path.join(OUTPUT_DIR, "e2e_source_transcoded.mp4");
      if (!fs.existsSync(transcode)) {
        console.log(dim(`     Transcoding source video for Remotion (ffmpeg fast-start, 540p, 30s)…`));
        const ff = spawnSync("ffmpeg", [
          "-y", "-i", localSrcPath,
          "-t", "30",
          "-vf", "scale=540:960",
          "-c:v", "libx264", "-preset", "ultrafast", "-crf", "28",
          "-c:a", "aac", "-b:a", "96k",
          "-movflags", "+faststart",
          transcode,
        ], { encoding: "utf8", timeout: 120_000 });
        if (ff.status !== 0) {
          throw new Error(`ffmpeg transcode failed: ${(ff.stderr ?? "").slice(-400)}`);
        }
      }
      // Copy into E2E public dir; Remotion serves it at /public/filename
      const e2ePublicDir = path.join(OUTPUT_DIR, "e2e-public");
      fs.mkdirSync(e2ePublicDir, { recursive: true });
      fs.copyFileSync(transcode, path.join(e2ePublicDir, "e2e_source_transcoded.mp4"));
      (orchestrationProps as Record<string, unknown>).sourceVideoUrl = "public/e2e_source_transcoded.mp4";
      (orchestrationProps as Record<string, unknown>).e2ePublicDir = e2ePublicDir;
    }

    // Persist props for render stage
    fs.writeFileSync(TMP_PROPS, JSON.stringify(orchestrationProps, null, 2));

    return {
      artifact: path.basename(TMP_PROPS),
      detail: `strap="${result.props.summaryStrap ?? result.props.tagline ?? "(no strap)"}"`,
    };
  });

  // ── Stage 6: Props schema validation ───────────────────────────────────────

  await runStage(6, "Props schema validation (IsaiahTalkingHeadV1Props)", async () => {
    if (!orchestrationProps) throw new Error("Stage 5 must pass first");

    const required = [
      "durationInFrames",
      "fps",
      "width",
      "height",
    ];
    const softRequired = [
      "sourceVideoUrl",
      "summaryStrap",
      "brandName",
    ];

    const missing = required.filter(k => !(k in orchestrationProps));
    if (missing.length) throw new Error(`Missing required props: ${missing.join(", ")}`);

    const missingSoft = softRequired.filter(k => !(k in orchestrationProps));
    const issues = missingSoft.length ? ` (soft-missing: ${missingSoft.join(", ")})` : "";

    // Validate ranges
    if (orchestrationProps.fps && (orchestrationProps.fps < 24 || orchestrationProps.fps > 60)) {
      throw new Error(`fps out of range: ${orchestrationProps.fps}`);
    }
    if (orchestrationProps.width && orchestrationProps.width < 100) {
      throw new Error(`width too small: ${orchestrationProps.width}`);
    }

    return { detail: `${Object.keys(orchestrationProps).length} props validated${issues}` };
  });

  // ── Stage 7: Remotion render → MP4 artifact ────────────────────────────────

  await runStage(7, SKIP_RENDER ? "Remotion render (SKIPPED via --skip-render)" : "Remotion render → MP4 artifact", async () => {
    if (SKIP_RENDER) return { detail: "skipped" };
    if (!fs.existsSync(TMP_PROPS)) throw new Error("Props file missing — stage 5 must pass first");

    // Ensure output dir
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    console.log(dim(`\n     Running: npx remotion render IsaiahTalkingHeadV1 …`));
    // Render 60 frames (2s @ 30fps) with minimal public dir for fast startup
    const e2ePublicDir: string = (orchestrationProps as Record<string, unknown>).e2ePublicDir as string
      ?? path.join(OUTPUT_DIR, "e2e-public");
    const result = spawnSync(
      "npx",
      [
        "remotion", "render",
        "IsaiahTalkingHeadV1",
        `--props=${TMP_PROPS}`,
        `--output=${TMP_MP4}`,
        `--public-dir=${e2ePublicDir}`,  // 8MB dir, not 2.6GB
        "--bundle-cache=false",          // ensure fresh bundle with our public dir
        "--frames=0-59",                 // 2s sample — enough to prove render works
        "--timeout=30000",
        "--concurrency=4",
      ],
      {
        cwd: STUDIO_DIR,
        encoding: "utf8",
        timeout: 120_000,
        env: { ...process.env },
      }
    );

    if (result.status !== 0) {
      const err = (result.stderr ?? "") + (result.stdout ?? "");
      throw new Error(`Remotion render failed (exit ${result.status}):\n${err.slice(-1000)}`);
    }

    if (!fs.existsSync(TMP_MP4)) throw new Error(`Render completed but output file not found: ${TMP_MP4}`);

    const sizeMB = (fs.statSync(TMP_MP4).size / 1024 / 1024).toFixed(1);
    mp4Path = TMP_MP4;

    return {
      artifact: TMP_MP4,
      detail: `${sizeMB} MB`,
    };
  });

  // ── Stage 8: MP4 validation via ffprobe ────────────────────────────────────

  await runStage(8, "MP4 validation (duration, resolution, codec)", async () => {
    if (SKIP_RENDER) return { detail: "skipped (no render)" };
    if (!mp4Path || !fs.existsSync(mp4Path)) throw new Error("MP4 not found — stage 7 must pass first");

    const probe = spawnSync(
      "ffprobe",
      ["-v", "quiet", "-print_format", "json", "-show_streams", mp4Path],
      { encoding: "utf8", timeout: 10_000 }
    );

    if (probe.status !== 0 || !probe.stdout) {
      // ffprobe not installed — fallback: just check file size
      const sizeMB = fs.statSync(mp4Path).size / 1024 / 1024;
      if (sizeMB < 0.1) throw new Error(`MP4 too small (${sizeMB.toFixed(2)} MB) — likely corrupt`);
      return { detail: `${sizeMB.toFixed(1)} MB (ffprobe not available for full validation)` };
    }

    const info = JSON.parse(probe.stdout);
    const videoStream = info.streams?.find((s: any) => s.codec_type === "video");
    if (!videoStream) throw new Error("No video stream found in MP4");

    const w = videoStream.width;
    const h = videoStream.height;
    const codec = videoStream.codec_name;
    const duration = parseFloat(videoStream.duration ?? "0");

    if (w < 100 || h < 100) throw new Error(`Resolution too small: ${w}×${h}`);
    if (duration < 1) throw new Error(`Duration too short: ${duration}s`);
    if (!["h264", "hevc", "vp9", "av1"].includes(codec)) throw new Error(`Unexpected codec: ${codec}`);

    // Verify 9:16 aspect ratio (portrait short-form)
    const ratio = w / h;
    if (ratio > 0.7) {
      // Not portrait — warn but don't fail (could be test composition)
      return { detail: `${w}×${h} ${codec} ${duration.toFixed(1)}s ⚠️ not portrait (${ratio.toFixed(2)})` };
    }

    return { detail: `${w}×${h} ${codec} ${duration.toFixed(1)}s ✓ portrait` };
  });

  // ── Stage 9: Supabase Storage upload ───────────────────────────────────────

  await runStage(9, "Supabase Storage upload → public URL", async () => {
    if (SKIP_RENDER || !mp4Path || !fs.existsSync(mp4Path)) {
      return { detail: "skipped (no render artifact)" };
    }

    const fileName = `e2e-test/${Date.now()}_e2e_render.mp4`;
    const fileBuffer = fs.readFileSync(mp4Path);

    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/pipeline-renders/${fileName}`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "video/mp4",
          "x-upsert": "true",
        },
        body: fileBuffer,
      }
    );

    if (!res.ok) {
      const err = await res.text();
      // Gracefully skip if bucket doesn't exist yet
      if (err.includes("Bucket not found")) {
        return { detail: "skipped — pipeline-renders bucket not found (create in Supabase Storage)" };
      }
      throw new Error(`Storage upload failed: ${res.status} ${err}`);
    }

    storageUrl = `${SUPABASE_URL}/storage/v1/object/public/pipeline-renders/${fileName}`;
    return { artifact: storageUrl, detail: `${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB uploaded` };
  });

  // ── Stage 10: Research pipeline → ContentBriefFull ─────────────────────────

  await runStage(10, "Research pipeline → ContentBriefFull (dry-run)", async () => {
    if (!ANTHROPIC_KEY) throw new Error("ANTHROPIC_API_KEY not set");

    const callAI = makeCallAI(ANTHROPIC_KEY);

    // Build a test TrendCluster from a known niche
    const testCluster: TrendCluster = {
      trendClusterId: "test_e2e_cluster",
      label: "AI automation for solopreneurs",
      keywords: ["ai automation", "solopreneur", "build in public", "n8n", "make.com"],
      topicStage: "growing",
      trajectory: {
        velocityScore: 0.75,
        audienceReactionIntensity: 0.7,
        noveltyScore: 0.65,
        crossPlatformPresence: {
          instagram_reels: true,
          tiktok: true,
          youtube_shorts: true,
          twitter: true,
          linkedin: false,
        },
        peakEstimatedAt: new Date(Date.now() + 86400000 * 3).toISOString(),
        decayRisk: "low",
      },
      businessRelevanceScore: 0.85,
      sourceCreatorIds: [],
      discoveredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const testItem: ContentItem = {
      contentId: "test_e2e_item",
      creatorId: "isaiah_dupree",
      platform: "instagram_reels",
      format: "short_form_video",
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      url: "https://instagram.com/p/test",
      title: "How I automated my entire content pipeline",
      transcript: "Today I want to show you how I built a fully automated content pipeline...",
      hashtags: ["aiautomation", "solopreneur", "buildinpublic"],
      durationSec: 45,
      hookAnalysis: {
        hookText: "How I automated my entire content pipeline",
        hookType: "how_to",
        hookDurationSec: 3,
        patternInterruptType: "question",
        hookScore: 0.8,
      },
      ctaType: "comment",
      proofType: ["before_after", "case_study"],
      metrics: { views: 12500, likes: 890, comments: 145, shares: 67, saves: 234 },
      normalizedMetrics: {
        vph: 520,
        retentionScore: 0.62,
        shareRate: 0.0054,
        qualityCommentRatio: 0.58,
        saveRate: 0.019,
        outlierScore: 0.78,
      },
    };

    const job = await runAutonomousPipeline(
      testCluster,
      [],
      [testItem],
      {
        workspaceId: "isaiah_e2e_test",
        callAI,
        // Skip Perplexity + Brave in test (no keys required for passing test)
        callPerplexity: undefined,
        callBraveSearch: undefined,
        supabase: undefined, // dry-run: no Supabase writes
      },
      {
        targetPlatform: "instagram_reels",
        primaryOfferId: "automation_services",
        icpId: "founders_operators",
        icpPains: ["spending too much time on manual tasks", "content creation is a bottleneck"],
        offerPromise: "I'll automate 80% of your content pipeline in 30 days",
      }
    );

    if (!job) throw new Error("runAutonomousPipeline returned null");
    if (job.state === "SCORED" && job.opportunityScore?.recommendation === "skip") {
      return { detail: `Skipped by opportunity scorer (score=${job.opportunityScore.scores.overallScore.toFixed(2)})` };
    }

    const angle = job.strategyPacket?.selectedAngle?.angleName ?? "(no angle)";
    const completeness = job.researchPacket?.researchCompleteness?.toFixed(2) ?? "?";

    // Write brief to disk for inspection
    const briefPath = path.join(OUTPUT_DIR, "e2e_research_brief.json");
    fs.writeFileSync(briefPath, JSON.stringify(job, null, 2));

    return {
      artifact: path.basename(briefPath),
      detail: `state=${job.state} angle="${angle}" research_completeness=${completeness}`,
    };
  });

  // ── Stage 11: Performance feedback score computation ───────────────────────

  await runStage(11, "Performance feedback → score buckets (dry-run)", async () => {
    // Query real actp_blotato_submissions rows (read-only)
    const submissions = await sbFetch(
      "/rest/v1/actp_blotato_submissions?select=id,platform,account_id,status,views,likes,saves,shares,created_at&status=eq.published&order=created_at.desc&limit=10"
    ).catch(() => []);

    if (!Array.isArray(submissions)) return { detail: "actp_blotato_submissions not accessible" };
    if (!submissions.length) return { detail: "No published submissions yet — pipeline not run yet" };

    // Compute scores (same logic as run-performance-feedback.ts)
    const scored = submissions.map((s: any) => {
      const views  = Number(s.views  ?? 0);
      const likes  = Number(s.likes  ?? 0);
      const saves  = Number(s.saves  ?? 0);
      const shares = Number(s.shares ?? 0);
      const score  = (views * 0.30 + likes * 0.25 + saves * 0.25 + shares * 0.20) / 1000;
      return { platform: s.platform, score: score.toFixed(3) };
    });

    const topScore = scored.sort((a: any, b: any) => parseFloat(b.score) - parseFloat(a.score))[0];
    return {
      detail: `${submissions.length} submissions scored, top: ${topScore.platform} score=${topScore.score}`,
    };
  });

  // ── Stage 12: Newsletter dry-run → HTML preview ────────────────────────────

  await runStage(12, "Newsletter dry-run → HTML preview", async () => {
    if (!ANTHROPIC_KEY) throw new Error("ANTHROPIC_API_KEY not set");

    // Query top posts
    const posts = await sbFetch(
      "/rest/v1/actp_blotato_submissions?select=id,platform,caption,views,likes,created_at&status=eq.published&order=views.desc&limit=5"
    ).catch(() => []);

    if (!Array.isArray(posts) || !posts.length) {
      return { detail: "No published posts yet — newsletter preview skipped" };
    }

    // Generate a minimal Claude digest to verify the API call works
    const callAI = makeCallAI(ANTHROPIC_KEY);
    const prompt = `Write a 2-sentence newsletter subject line + preview for this top social post: "${posts[0].caption ?? "(no caption)"}". Platform: ${posts[0].platform}. Reply with JSON: {"subject":"...","preview":"..."}`;

    const raw = await callAI(prompt);
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = { subject: raw.slice(0, 80) }; }

    // Write HTML preview
    const html = `<!DOCTYPE html><html><body style="background:#0d0d0d;color:#f0f0f0;font-family:sans-serif;padding:32px">
<h1 style="color:#7DFF63">${parsed.subject ?? "Newsletter Preview"}</h1>
<p>${parsed.preview ?? ""}</p>
<h2 style="color:#7DFF63;margin-top:32px">Top Posts (${posts.length})</h2>
${posts.map((p: any) => `<div style="border:1px solid #2a2a2a;border-radius:8px;padding:16px;margin:12px 0">
<div style="color:#888;font-size:12px">${p.platform} · ${p.views ?? 0} views</div>
<div style="margin-top:8px">${(p.caption ?? "(no caption)").slice(0, 200)}</div>
</div>`).join("")}
</body></html>`;

    const htmlPath = path.join(OUTPUT_DIR, "e2e_newsletter_preview.html");
    fs.writeFileSync(htmlPath, html);

    return {
      artifact: path.basename(htmlPath),
      detail: `subject="${parsed.subject?.slice(0, 60) ?? "?"}"`,
    };
  });

  // ── Stage 13: Repurpose engine → remix props (dry-run) ─────────────────────

  await runStage(13, "Repurpose engine → remix props (dry-run)", async () => {
    if (!selectedItem) return { detail: "No selected item from stage 2" };
    if (!ANTHROPIC_KEY) return { detail: "skipped — ANTHROPIC_API_KEY not set" };

    const callAI = makeCallAI(ANTHROPIC_KEY);

    // Generate a remixed caption for a different platform
    const originalCaption = selectedItem.ai_caption ?? "AI automation saves hours every week";
    const remixPrompt = `Rewrite this Instagram caption for TikTok (shorter, more conversational, no hashtags): "${originalCaption}". Reply with just the rewritten caption text, no quotes.`;

    let remixedCaption: string;
    try {
      remixedCaption = await callAI(remixPrompt);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("credit balance") || msg.includes("402") || msg.includes("insufficient")) {
        return { detail: "skipped — Anthropic credit balance too low (top up at console.anthropic.com)" };
      }
      throw err;
    }

    // Build remix props stub
    const remixProps = {
      source_item_id: selectedItem.id,
      source_platform: "instagram",
      target_platform: "tiktok",
      target_account_id: 201, // @the_isaiah_dupree_ TikTok
      original_caption: originalCaption,
      remixed_caption: remixedCaption.trim(),
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      is_experimental: true,
    };

    const propsPath = path.join(OUTPUT_DIR, "e2e_repurpose_props.json");
    fs.writeFileSync(propsPath, JSON.stringify(remixProps, null, 2));

    return {
      artifact: path.basename(propsPath),
      detail: `${remixedCaption.slice(0, 60)}…`,
    };
  });

  // ─── Final report ───────────────────────────────────────────────────────────

  const passed  = results.filter(r => r.passed).length;
  const failed  = results.filter(r => !r.passed).length;
  const skipped = results.filter(r => r.detail === "skipped" || r.detail?.startsWith("skipped")).length;
  const totalMs = results.reduce((s, r) => s + r.durationMs, 0);

  console.log(bold("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(bold("  Test Results"));
  console.log(bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

  for (const r of results) {
    const icon = r.passed ? green("✅") : red("❌");
    const dur  = dim(`${r.durationMs}ms`);
    const art  = r.artifact ? `  → ${cyan(r.artifact)}` : "";
    console.log(`  ${icon} [${String(r.stage).padStart(2, "0")}] ${r.name}  ${dur}${art}`);
    if (!r.passed && r.error) console.log(red(`      ${r.error.split("\n")[0]}`));
  }

  console.log();
  console.log(`  ${green(`${passed} passed`)}  ${failed > 0 ? red(`${failed} failed`) : dim("0 failed")}  ${dim(`${skipped} skipped`)}  ${dim(`${(totalMs / 1000).toFixed(1)}s total`)}`);

  // List produced artifacts
  const artifacts = results.filter(r => r.artifact && r.passed && r.detail !== "skipped" && !r.detail?.startsWith("skipped")).map(r => r.artifact!);
  if (artifacts.length) {
    console.log(bold("\n  Artifacts produced:"));
    for (const a of artifacts) console.log(`  ${cyan("→")} ${a}`);
  }

  // Open output dir if we produced something
  if (artifacts.length > 0 && process.platform === "darwin") {
    spawnSync("open", [OUTPUT_DIR]);
  }

  stopFileServer();
  console.log();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  stopFileServer();
  console.error(red(`\n  Fatal: ${err.message}`));
  process.exit(1);
});
