#!/usr/bin/env npx tsx
/**
 * fetch-external-broll.ts — Download stock B-roll from Pexels and insert into Supabase
 *
 * Usage:
 *   npx tsx scripts/fetch-external-broll.ts --topic "AI automation"
 *   npx tsx scripts/fetch-external-broll.ts --topic "AI automation" --count 10
 *   npx tsx scripts/fetch-external-broll.ts --topic "startup" --orientation landscape --min-duration 5 --max-duration 30
 *   npx tsx scripts/fetch-external-broll.ts --topic "coding" --dry-run
 *
 * Env vars required:
 *   PEXELS_API_KEY       — Pexels API key
 *   SUPABASE_KEY or SUPABASE_SERVICE_KEY — Supabase service key
 *   TELEGRAM_BOT_TOKEN   — (optional) for notifications
 *   TELEGRAM_CHAT_ID     — (optional) for notifications
 */

import * as fs from "fs";
import * as https from "https";
import * as path from "path";
import * as http from "http";

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag: string) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
const hasFlag = (flag: string) => args.includes(flag);

const topic       = getArg("--topic");
const count       = parseInt(getArg("--count") ?? "5", 10);
const minDuration = parseInt(getArg("--min-duration") ?? "5", 10);
const maxDuration = parseInt(getArg("--max-duration") ?? "30", 10);
const orientation = (getArg("--orientation") ?? "portrait") as "portrait" | "landscape" | "square";
const dryRun      = hasFlag("--dry-run");

if (!topic) {
  console.error("[broll] ❌ --topic is required. Example: --topic \"AI automation\"");
  process.exit(1);
}

// ─── Config ───────────────────────────────────────────────────────────────────

const PEXELS_API_KEY   = process.env.PEXELS_API_KEY ?? "";
const SUPABASE_URL     = "https://ivhfuhxorppptyuofbgq.supabase.co";
const SUPABASE_KEY     = process.env.SUPABASE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? "";
const TELEGRAM_TOKEN   = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";

const DOWNLOAD_DIR = "/Volumes/My Passport/iPhone/broll-external";

if (!PEXELS_API_KEY) {
  console.error("[broll] ❌ PEXELS_API_KEY env var is not set");
  process.exit(1);
}
if (!SUPABASE_KEY) {
  console.error("[broll] ❌ SUPABASE_KEY / SUPABASE_SERVICE_KEY env var is not set");
  process.exit(1);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PexelsVideoFile {
  id: number;
  quality: string;
  file_type: string;
  width: number | null;
  height: number | null;
  fps: number | null;
  link: string;
  size: number;
}

interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  duration: number;
  video_files: PexelsVideoFile[];
  video_pictures: Array<{ id: number; nr: number; picture: string }>;
}

interface PexelsSearchResponse {
  videos: PexelsVideo[];
  total_results: number;
  page: number;
  per_page: number;
  next_page?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) { console.log(`[broll] ${msg}`); }

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function pickBestFile(files: PexelsVideoFile[], orient: string): PexelsVideoFile | null {
  // Filter for MP4 only
  const mp4s = files.filter(f => f.file_type === "video/mp4" || f.link.endsWith(".mp4"));
  if (mp4s.length === 0) return null;

  // For portrait: prefer files where height > width and HD quality
  // For landscape: prefer files where width > height and HD quality
  // For square: prefer files where width ~= height
  const isPortrait  = (f: PexelsVideoFile) => f.height != null && f.width != null && f.height > f.width;
  const isLandscape = (f: PexelsVideoFile) => f.width != null && f.height != null && f.width > f.height;
  const isSquare    = (f: PexelsVideoFile) => f.width != null && f.height != null && Math.abs(f.width - f.height) < 100;
  const isHD        = (f: PexelsVideoFile) => (f.width ?? 0) >= 1280 || (f.height ?? 0) >= 720;

  let candidates = mp4s;

  if (orient === "portrait")  candidates = mp4s.filter(isPortrait);
  if (orient === "landscape") candidates = mp4s.filter(isLandscape);
  if (orient === "square")    candidates = mp4s.filter(isSquare);

  // Fall back to all mp4s if no orientation match
  if (candidates.length === 0) candidates = mp4s;

  // Prefer HD
  const hdCandidates = candidates.filter(isHD);
  if (hdCandidates.length > 0) candidates = hdCandidates;

  // Sort by resolution (largest first)
  candidates.sort((a, b) => {
    const aRes = (a.width ?? 0) * (a.height ?? 0);
    const bRes = (b.width ?? 0) * (b.height ?? 0);
    return bRes - aRes;
  });

  return candidates[0] ?? null;
}

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);

    const makeRequest = (requestUrl: string) => {
      const proto = requestUrl.startsWith("https") ? https : http;
      proto.get(requestUrl, (res) => {
        // Follow redirects
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
          const location = res.headers.location;
          if (!location) {
            file.close();
            fs.unlinkSync(destPath);
            return reject(new Error(`Redirect with no Location header`));
          }
          res.resume();
          makeRequest(location);
          return;
        }

        if (res.statusCode !== 200) {
          file.close();
          fs.unlinkSync(destPath);
          return reject(new Error(`Download failed: HTTP ${res.statusCode} for ${requestUrl}`));
        }

        res.pipe(file);
        file.on("finish", () => { file.close(); resolve(); });
        file.on("error", (err) => { fs.unlinkSync(destPath); reject(err); });
        res.on("error", (err) => { file.close(); fs.unlinkSync(destPath); reject(err); });
      }).on("error", (err) => {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        reject(err);
      });
    };

    makeRequest(url);
  });
}

async function searchPexelsVideos(): Promise<PexelsVideo[]> {
  const params = new URLSearchParams({
    query: topic!,
    per_page: String(count),
    orientation,
    min_duration: String(minDuration),
    max_duration: String(maxDuration),
  });

  const url = `https://api.pexels.com/videos/search?${params.toString()}`;
  log(`Searching Pexels: ${url}`);

  const resp = await fetch(url, {
    headers: { Authorization: PEXELS_API_KEY },
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Pexels API error ${resp.status}: ${txt.slice(0, 200)}`);
  }

  const data = await resp.json() as PexelsSearchResponse;
  log(`  Found ${data.total_results} total results, got ${data.videos.length} videos`);
  return data.videos;
}

async function insertToSupabase(record: Record<string, unknown>): Promise<void> {
  const url = `${SUPABASE_URL}/rest/v1/mv_media_items`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates",
    },
    body: JSON.stringify(record),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Supabase insert failed ${resp.status}: ${txt.slice(0, 200)}`);
  }
}

async function sendTelegram(msg: string): Promise<void> {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    log("Telegram not configured — skipping notification");
    return;
  }
  const resp = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: "Markdown" }),
  });
  const ok = (await resp.json() as { ok: boolean }).ok;
  log(ok ? "Telegram notification sent ✓" : "Telegram notification failed");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log(`=== Pexels B-Roll Fetcher ===`);
  log(`Topic: "${topic}" | Count: ${count} | Orientation: ${orientation} | Duration: ${minDuration}s–${maxDuration}s`);
  if (dryRun) log("DRY RUN — will not download or insert");

  // Create download directory
  if (!dryRun) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    log(`Download dir: ${DOWNLOAD_DIR}`);
  }

  // Search Pexels
  const videos = await searchPexelsVideos();

  if (videos.length === 0) {
    log("No videos found for this query — try a different topic or adjust duration/orientation filters");
    return;
  }

  let downloadedCount = 0;
  const aiNiche = topic!.split(/\s+/)[0].toLowerCase();

  for (const video of videos) {
    const bestFile = pickBestFile(video.video_files, orientation);
    if (!bestFile) {
      log(`  [${video.id}] No suitable MP4 file found — skipping`);
      continue;
    }

    const slug = slugify(topic!);
    const fileName = `pexels_${video.id}_${slug}.mp4`;
    const localPath = path.join(DOWNLOAD_DIR, fileName);

    log(`  [${video.id}] ${fileName} (${bestFile.width}x${bestFile.height}, ${bestFile.quality}, ${(bestFile.size / 1_048_576).toFixed(1)} MB)`);

    if (dryRun) {
      log(`    DRY RUN: would download to ${localPath}`);
      log(`    DRY RUN: would insert into mv_media_items with source=pexels`);
      downloadedCount++;
      continue;
    }

    // Download the file
    try {
      log(`    Downloading...`);
      await downloadFile(bestFile.link, localPath);
      const actualSize = fs.statSync(localPath).size;
      log(`    ✓ Downloaded: ${localPath} (${(actualSize / 1_048_576).toFixed(1)} MB)`);
    } catch (err) {
      log(`    ❌ Download failed: ${(err as Error).message}`);
      continue;
    }

    // Insert into Supabase
    const record: Record<string, unknown> = {
      source: "pexels",
      original_path: video.url,
      file_name: fileName,
      file_size: bestFile.size,
      media_type: "video",
      extension: "mp4",
      device_udid: "external",
      ingest_status: "downloaded",
      analysis_status: "pending",
      local_path: localPath,
      ai_is_broll: true,
      ai_niche: aiNiche,
      ai_caption: video.url,
    };

    try {
      await insertToSupabase(record);
      log(`    ✓ Inserted into Supabase mv_media_items`);
      downloadedCount++;
    } catch (err) {
      log(`    ❌ Supabase insert failed: ${(err as Error).message}`);
      // Don't abort — continue with next video
    }
  }

  // Summary
  log(`\n=== Summary ===`);
  log(`Downloaded ${downloadedCount} clips for topic "${topic}"`);

  // Telegram notification
  if (!dryRun) {
    await sendTelegram(`🎬 B-roll: downloaded ${downloadedCount} Pexels clips for '${topic}'`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
