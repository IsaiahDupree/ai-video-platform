#!/usr/bin/env npx tsx
/**
 * run-performance-feedback.ts — Pull Blotato post metrics → score → update Decision Engine weights
 *
 * Flow:
 *   1. Connect to Supabase
 *   2. Query actp_blotato_submissions for posts in last N days with non-null submission_id
 *   3. For each post, call Blotato GET /v2/posts/{submissionId} for metrics
 *   4. Extract: views, likes, comments, shares, saves
 *   5. Compute performance_score = (views*0.3 + likes*0.25 + saves*0.25 + shares*0.2) / baseline
 *   6. Group by niche, platform, account_id, format
 *   7. Write to content_performance_scores (upsert)
 *   8. Generate "what's working" summary via Claude
 *   9. Generate recommendations (do_more / do_less / monitor)
 *  10. Write to content_strategy_weights
 *  11. Send Telegram summary
 *
 * Usage:
 *   npx tsx scripts/run-performance-feedback.ts
 *   npx tsx scripts/run-performance-feedback.ts --dry-run
 *   npx tsx scripts/run-performance-feedback.ts --days 14
 */

import { makeCallAI } from "../src/lib/callAI";

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag: string) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
const hasFlag = (flag: string) => args.includes(flag);

const dryRun  = hasFlag("--dry-run");
const daysArg = parseInt(getArg("--days") ?? "7", 10);
const DAYS    = isNaN(daysArg) ? 7 : daysArg;

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL      = "https://ivhfuhxorppptyuofbgq.supabase.co";
const SUPABASE_KEY      = process.env.SUPABASE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? "";
const BLOTATO_KEY       = process.env.BLOTATO_API_KEY ?? "";
const TELEGRAM_TOKEN    = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TELEGRAM_CHAT_ID  = process.env.TELEGRAM_CHAT_ID ?? "";
const BLOTATO_BASE      = "https://backend.blotato.com/v2";

// Performance score baseline (views equivalent) — tune as data accumulates
const SCORE_BASELINE = 1000;

// ─── Types ────────────────────────────────────────────────────────────────────

interface BlotatoSubmission {
  id: string;
  submission_id: string;
  niche?: string;
  platform?: string;
  account_id?: number;
  format?: string;
  caption?: string;
  published_at?: string;
  created_at?: string;
}

interface BlotatoMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

interface ScoredPost {
  submission: BlotatoSubmission;
  metrics: BlotatoMetrics;
  performanceScore: number;
}

interface BucketScore {
  niche: string;
  platform: string;
  account_id: number;
  format: string;
  avgScore: number;
  postCount: number;
  totalViews: number;
  totalLikes: number;
}

type Recommendation = "do_more" | "do_less" | "monitor";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) { console.log(`[perf-feedback] ${msg}`); }
function warn(msg: string) { console.warn(`[perf-feedback] WARNING: ${msg}`); }

// ─── Supabase thin client ─────────────────────────────────────────────────────

function makeSupabaseClient(url: string, key: string) {
  async function query(path: string, opts: RequestInit = {}) {
    const resp = await fetch(`${url}/rest/v1/${path}`, {
      ...opts,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...(opts.headers ?? {}),
      },
    });
    const text = await resp.text();
    if (!resp.ok) throw new Error(`Supabase ${path} ${resp.status}: ${text.slice(0, 300)}`);
    try { return JSON.parse(text); } catch { return text; }
  }

  return {
    selectRows: async (table: string, params: string) => {
      try {
        const data = await query(`${table}?${params}`);
        return { data: Array.isArray(data) ? data : [], error: null };
      } catch (err) { return { data: [] as unknown[], error: err }; }
    },
    upsert: async (table: string, data: unknown, conflictCols?: string) => {
      try {
        const preferHeader = conflictCols
          ? `resolution=merge-duplicates,return=representation`
          : "return=representation";
        await query(table, {
          method: "POST",
          body: JSON.stringify(data),
          headers: { Prefer: preferHeader },
        });
        return { error: null };
      } catch (err) { return { error: err }; }
    },
  };
}

// ─── Blotato metrics fetch ────────────────────────────────────────────────────

async function fetchBlotatoMetrics(submissionId: string): Promise<BlotatoMetrics | null> {
  try {
    const resp = await fetch(`${BLOTATO_BASE}/posts/${submissionId}`, {
      headers: { "blotato-api-key": BLOTATO_KEY },
    });

    if (resp.status === 404) {
      warn(`  Post ${submissionId}: 404 not found — skipping`);
      return null;
    }
    if (resp.status === 429) {
      warn(`  Post ${submissionId}: rate limited — skipping`);
      return null;
    }
    if (!resp.ok) {
      warn(`  Post ${submissionId}: HTTP ${resp.status} — skipping`);
      return null;
    }

    const data = await resp.json() as {
      status?: string;
      metrics?: {
        views?: number;
        likes?: number;
        comments?: number;
        shares?: number;
        saves?: number;
        plays?: number;
        impressions?: number;
      };
      analytics?: {
        views?: number;
        likes?: number;
        comments?: number;
        shares?: number;
        saves?: number;
      };
    };

    // Blotato may nest metrics under metrics or analytics
    const m = data.metrics ?? data.analytics ?? {};

    return {
      views:    m.views ?? m.plays ?? m.impressions ?? 0,
      likes:    m.likes ?? 0,
      comments: m.comments ?? 0,
      shares:   m.shares ?? 0,
      saves:    m.saves ?? 0,
    };
  } catch (err) {
    warn(`  Post ${submissionId}: fetch error: ${err}`);
    return null;
  }
}

// ─── Score computation ────────────────────────────────────────────────────────

function computePerformanceScore(metrics: BlotatoMetrics): number {
  const weighted =
    metrics.views   * 0.30 +
    metrics.likes   * 0.25 +
    metrics.saves   * 0.25 +
    metrics.shares  * 0.20;
  return weighted / SCORE_BASELINE;
}

// ─── Bucket aggregation ───────────────────────────────────────────────────────

function aggregateByBucket(scored: ScoredPost[]): BucketScore[] {
  const buckets = new Map<string, { scores: number[]; views: number; likes: number; sub: BlotatoSubmission }>();

  for (const { submission, metrics, performanceScore } of scored) {
    const niche     = submission.niche ?? "unknown";
    const platform  = submission.platform ?? "unknown";
    const accountId = submission.account_id ?? 0;
    const format    = submission.format ?? "unknown";
    const key       = `${niche}||${platform}||${accountId}||${format}`;

    if (!buckets.has(key)) {
      buckets.set(key, { scores: [], views: 0, likes: 0, sub: submission });
    }
    const bucket = buckets.get(key)!;
    bucket.scores.push(performanceScore);
    bucket.views += metrics.views;
    bucket.likes += metrics.likes;
  }

  return Array.from(buckets.entries()).map(([key, bucket]) => {
    const [niche, platform, account_id, format] = key.split("||");
    const avgScore = bucket.scores.reduce((a, b) => a + b, 0) / bucket.scores.length;
    return {
      niche,
      platform,
      account_id: parseInt(account_id, 10),
      format,
      avgScore,
      postCount: bucket.scores.length,
      totalViews: bucket.views,
      totalLikes: bucket.likes,
    };
  });
}

function deriveRecommendation(avgScore: number): Recommendation {
  if (avgScore >= 1.5) return "do_more";
  if (avgScore >= 0.5) return "monitor";
  return "do_less";
}

// ─── Claude summary ───────────────────────────────────────────────────────────

async function generateWhatIsWorking(
  callAI: (prompt: string) => Promise<string>,
  buckets: BucketScore[]
): Promise<string> {
  if (buckets.length === 0) return "No performance data available.";

  const sorted = [...buckets].sort((a, b) => b.avgScore - a.avgScore);
  const topBuckets = sorted.slice(0, 5);
  const bottomBuckets = sorted.slice(-3);

  const prompt = `You are a social media performance analyst. Summarize what's working and what's not.

TOP PERFORMING BUCKETS (niche | platform | format | avg_score | post_count):
${topBuckets.map((b) => `- ${b.niche} | ${b.platform} | ${b.format} | score:${b.avgScore.toFixed(2)} | ${b.postCount} posts`).join("\n")}

LOWEST PERFORMING BUCKETS:
${bottomBuckets.map((b) => `- ${b.niche} | ${b.platform} | ${b.format} | score:${b.avgScore.toFixed(2)} | ${b.postCount} posts`).join("\n")}

Write a 3-bullet "What's Working" summary and a 3-bullet "What to Change" recommendation.
Be specific and actionable. Format as plain text with bullet points using "-".`;

  try {
    return await callAI(prompt);
  } catch (err) {
    warn(`Claude summary generation failed: ${err}`);
    return `Top performers: ${topBuckets.map((b) => `${b.niche}/${b.platform}`).join(", ")}`;
  }
}

// ─── Telegram ─────────────────────────────────────────────────────────────────

async function sendTelegram(msg: string) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    log("Telegram not configured — skipping notification");
    return;
  }
  const resp = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: "Markdown" }),
  });
  const result = await resp.json() as { ok: boolean };
  log(result.ok ? "Telegram notification sent" : "Telegram notification failed");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log("=== Performance Feedback Pipeline ===");
  log(`Window: last ${DAYS} days`);
  if (dryRun) log("DRY RUN — skipping writes");

  if (!SUPABASE_KEY) {
    console.error("[perf-feedback] FATAL: SUPABASE_KEY / SUPABASE_SERVICE_KEY not set");
    process.exit(1);
  }
  if (!BLOTATO_KEY) {
    warn("BLOTATO_API_KEY not set — metric fetches will fail");
  }

  // ── Step 1: Supabase ──────────────────────────────────────────────────────
  log("Step 1 — Connecting to Supabase...");
  const sb = makeSupabaseClient(SUPABASE_URL, SUPABASE_KEY);

  // ── Step 2: Query published submissions ──────────────────────────────────
  log(`Step 2 — Querying actp_blotato_submissions (last ${DAYS} days)...`);
  const cutoff = new Date(Date.now() - DAYS * 86_400_000).toISOString();
  const { data: submissionsRaw, error: queryErr } = await sb.selectRows(
    "actp_blotato_submissions",
    `select=*&submission_id=not.is.null&created_at=gte.${encodeURIComponent(cutoff)}&order=created_at.desc`
  );

  if (queryErr) {
    warn(`actp_blotato_submissions query error: ${queryErr}`);
  }

  const submissions = (submissionsRaw as BlotatoSubmission[]).filter((s) => !!s.submission_id);
  log(`  Found ${submissions.length} posts with submission_id`);

  if (submissions.length === 0) {
    log("No published posts found in window — exiting");
    return;
  }

  // ── Step 3 + 4: Fetch Blotato metrics ────────────────────────────────────
  log("Step 3/4 — Fetching Blotato metrics for each post...");
  const scoredPosts: ScoredPost[] = [];

  for (const submission of submissions) {
    log(`  Fetching ${submission.submission_id}...`);
    const metrics = await fetchBlotatoMetrics(submission.submission_id);
    if (!metrics) continue;

    // ── Step 5: Compute performance score ──────────────────────────────────
    const performanceScore = computePerformanceScore(metrics);
    scoredPosts.push({ submission, metrics, performanceScore });
    log(`    views=${metrics.views} likes=${metrics.likes} saves=${metrics.saves} shares=${metrics.shares} => score=${performanceScore.toFixed(3)}`);
  }

  log(`  Scored ${scoredPosts.length} / ${submissions.length} posts`);

  // ── Step 6: Group by niche/platform/account/format ───────────────────────
  log("Step 6 — Aggregating by bucket...");
  const buckets = aggregateByBucket(scoredPosts);
  log(`  ${buckets.length} unique buckets`);

  buckets
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 5)
    .forEach((b) => {
      log(`  [${deriveRecommendation(b.avgScore).toUpperCase()}] ${b.niche} / ${b.platform} / ${b.format} — score ${b.avgScore.toFixed(2)} (${b.postCount} posts)`);
    });

  // ── Step 7: Write content_performance_scores ──────────────────────────────
  const today = new Date().toISOString().slice(0, 10);

  if (!dryRun) {
    log("Step 7 — Writing content_performance_scores...");
    for (const bucket of buckets) {
      const recommendation = deriveRecommendation(bucket.avgScore);
      const row = {
        niche:        bucket.niche,
        platform:     bucket.platform,
        account_id:   bucket.account_id,
        avg_score:    bucket.avgScore,
        post_count:   bucket.postCount,
        date:         today,
        recommendation,
        computed_at:  new Date().toISOString(),
      };
      const { error } = await sb.upsert("content_performance_scores", row, "niche,platform,account_id,date");
      if (error) warn(`  content_performance_scores upsert error: ${error}`);
    }
    log("  content_performance_scores: written");
  } else {
    log("Step 7 — DRY RUN: skipping content_performance_scores writes");
  }

  // ── Step 8: Claude "what's working" summary ───────────────────────────────
  log("Step 8 — Generating Claude summary...");
  const callAI = makeCallAI();
  const summary = await generateWhatIsWorking(callAI, buckets);
  log("  Summary:\n" + summary.split("\n").map((l) => `    ${l}`).join("\n"));

  // ── Step 9: Recommendations ───────────────────────────────────────────────
  log("Step 9 — Generating recommendations...");
  const recommendations = buckets.map((b) => ({
    bucket:          `${b.niche}_${b.platform}_${b.account_id}`,
    niche:           b.niche,
    platform:        b.platform,
    account_id:      b.account_id,
    format:          b.format,
    avgScore:        b.avgScore,
    postCount:       b.postCount,
    recommendation:  deriveRecommendation(b.avgScore),
  }));

  const topWinners = recommendations.filter((r) => r.recommendation === "do_more").slice(0, 3);
  const toReduce   = recommendations.filter((r) => r.recommendation === "do_less").slice(0, 3);
  log(`  Do more: ${topWinners.map((r) => `${r.niche}/${r.platform}`).join(", ") || "none"}`);
  log(`  Do less: ${toReduce.map((r) => `${r.niche}/${r.platform}`).join(", ") || "none"}`);

  // ── Step 10: Write content_strategy_weights ───────────────────────────────
  if (!dryRun) {
    log("Step 10 — Writing content_strategy_weights...");
    for (const rec of recommendations) {
      const row = {
        bucket:         rec.bucket,
        score:          rec.avgScore,
        recommendation: rec.recommendation,
        updated_at:     new Date().toISOString(),
      };
      const { error } = await sb.upsert("content_strategy_weights", row, "bucket");
      if (error) warn(`  content_strategy_weights upsert error: ${error}`);
    }
    log("  content_strategy_weights: written");
  } else {
    log("Step 10 — DRY RUN: skipping content_strategy_weights writes");
  }

  // ── Step 11: Telegram summary ─────────────────────────────────────────────
  if (!dryRun) {
    log("Step 11 — Sending Telegram summary...");

    const topLines = topWinners.map(
      (r) => `  + ${r.niche} / ${r.platform} (score: ${r.avgScore.toFixed(2)}, ${r.postCount} posts)`
    );
    const downLines = toReduce.map(
      (r) => `  - ${r.niche} / ${r.platform} (score: ${r.avgScore.toFixed(2)}, ${r.postCount} posts)`
    );

    const msg = [
      `*Performance Feedback — Last ${DAYS} Days*`,
      ``,
      `*Posts analyzed:* ${scoredPosts.length} / ${submissions.length}`,
      `*Buckets scored:* ${buckets.length}`,
      ``,
      topWinners.length > 0 ? `*Do More:*\n${topLines.join("\n")}` : "",
      toReduce.length > 0   ? `*Do Less:*\n${downLines.join("\n")}` : "",
      ``,
      `*What's Working:*`,
      summary.slice(0, 800),
    ].filter(Boolean).join("\n");

    await sendTelegram(msg);
  } else {
    log("Step 11 — DRY RUN: skipping Telegram");
  }

  log("=== Performance Feedback Pipeline complete ===");
}

main().catch((err) => { console.error(err); process.exit(1); });
