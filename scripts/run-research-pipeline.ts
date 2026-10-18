#!/usr/bin/env npx tsx
/**
 * run-research-pipeline.ts — Full research pipeline runner
 *
 * Flow:
 *   1. Connect to Supabase
 *   2. Query trend signals (content_intel_trend_clusters → actp_agent_audit_log fallback)
 *   3. Wire Perplexity (sonar model) — PERPLEXITY_API_KEY
 *   4. Wire Brave Search — BRAVE_API_KEY
 *   5. Wire Claude via makeCallAI() from ../src/lib/callAI
 *   6. Call runAutonomousPipeline() from ContentIntelligenceEngine
 *   7. Persist to content_intel_briefs + content_intel_research_packets
 *   8. Print brief summary + angle selected
 *   9. Send Telegram notification
 *
 * Usage:
 *   npx tsx scripts/run-research-pipeline.ts
 *   npx tsx scripts/run-research-pipeline.ts --topic "AI automation"
 *   npx tsx scripts/run-research-pipeline.ts --platform instagram
 *   npx tsx scripts/run-research-pipeline.ts --dry-run
 *   npx tsx scripts/run-research-pipeline.ts --experimental
 */

import { makeCallAI } from "../src/lib/callAI";
import { runAutonomousPipeline } from "../src/lib/ContentIntelligenceEngine";
import type { TrendCluster } from "../src/types/ContentIntelligenceSchema";

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag: string) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
const hasFlag = (flag: string) => args.includes(flag);

const topicOverride    = getArg("--topic");
const platformArg      = (getArg("--platform") ?? "instagram") as "instagram" | "tiktok" | "youtube";
const dryRun           = hasFlag("--dry-run");
const experimental     = hasFlag("--experimental");

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL      = "https://ivhfuhxorppptyuofbgq.supabase.co";
const SUPABASE_KEY      = process.env.SUPABASE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? "";
const PERPLEXITY_KEY    = process.env.PERPLEXITY_API_KEY ?? "";
const BRAVE_KEY         = process.env.BRAVE_API_KEY ?? "";
const TELEGRAM_TOKEN    = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TELEGRAM_CHAT_ID  = process.env.TELEGRAM_CHAT_ID ?? "";

// Blotato account IDs
const PLATFORM_ACCOUNT: Record<string, { standard: number; experimental: number }> = {
  instagram: { standard: 807,  experimental: 670 },
  tiktok:    { standard: 710,  experimental: 201 },
  youtube:   { standard: 228,  experimental: 228 },
};

// Map CLI platform to ContentIntelligenceSchema Platform type
const PLATFORM_MAP: Record<string, string> = {
  instagram: "instagram_reels",
  tiktok:    "tiktok",
  youtube:   "youtube",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) { console.log(`[research-pipeline] ${msg}`); }
function warn(msg: string) { console.warn(`[research-pipeline] WARNING: ${msg}`); }

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
    from: (table: string) => ({
      insert: async (data: unknown) => {
        try {
          await query(table, { method: "POST", body: JSON.stringify(data) });
          return { error: null };
        } catch (err) { return { error: err }; }
      },
      upsert: async (data: unknown) => {
        try {
          await query(table, {
            method: "POST",
            body: JSON.stringify(data),
            headers: { Prefer: "resolution=merge-duplicates,return=representation" },
          });
          return { error: null };
        } catch (err) { return { error: err }; }
      },
      select: (cols = "*") => ({
        eq: async (col: string, val: string) => {
          try {
            const data = await query(`${table}?select=${cols}&${col}=eq.${encodeURIComponent(val)}`);
            return { data: Array.isArray(data) ? data : [], error: null };
          } catch (err) { return { data: [], error: err }; }
        },
      }),
      order: (col: string, opts?: { ascending?: boolean }) => ({
        limit: async (n: number) => {
          try {
            const dir = opts?.ascending === false ? "desc" : "asc";
            const data = await query(`${table}?select=*&order=${col}.${dir}&limit=${n}`);
            return { data: Array.isArray(data) ? data : [], error: null };
          } catch (err) { return { data: [], error: err }; }
        },
      }),
      limit: async (n: number) => {
        try {
          const data = await query(`${table}?select=*&limit=${n}`);
          return { data: Array.isArray(data) ? data : [], error: null };
        } catch (err) { return { data: [], error: err }; }
      },
    }),
  };
}

// ─── Trend cluster source ─────────────────────────────────────────────────────

async function fetchTrendCluster(
  sb: ReturnType<typeof makeSupabaseClient>,
  topicOverride?: string
): Promise<TrendCluster> {
  // 1. Try real content_intel_trend_clusters table
  try {
    const { data } = await sb.from("content_intel_trend_clusters").order("created_at", { ascending: false }).limit(1);
    if (Array.isArray(data) && data.length > 0 && !topicOverride) {
      const row = data[0] as TrendCluster;
      log(`Using trend cluster from content_intel_trend_clusters: "${row.label}"`);
      return row;
    }
  } catch {
    log("content_intel_trend_clusters not found — falling back to audit log");
  }

  // 2. Fall back to actp_agent_audit_log for signals
  let recentTopics: string[] = [];
  try {
    const { data } = await sb.from("actp_agent_audit_log").order("created_at", { ascending: false }).limit(20);
    if (Array.isArray(data)) {
      for (const row of data) {
        const payload = row.payload ?? row.data ?? row.metadata ?? {};
        const text = JSON.stringify(payload).toLowerCase();
        const matches = text.match(/"(ai\s\w+|automation\s\w+|content\s\w+|saas\s\w+)"/g) ?? [];
        recentTopics.push(...matches.map((m: string) => m.replace(/"/g, "")));
      }
    }
  } catch {
    log("actp_agent_audit_log query failed — using topic override or default");
  }

  const label = topicOverride ?? recentTopics[0] ?? "AI automation for SaaS founders";

  log(`Building synthetic TrendCluster for topic: "${label}"`);

  // 3. Construct TrendCluster from available signals
  const now = new Date().toISOString();
  return {
    trendClusterId: `tc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    label,
    createdAt: now,
    updatedAt: now,
    keywords: label.split(" ").slice(0, 4),
    entities: [],
    exampleContentIds: [],
    trajectory: {
      mentionsVelocity: 12,
      contentVelocity: 4,
      creatorAdoptionRate: 0.35,
      audienceReactionIntensity: 0.72,
      noveltyScore: 0.65,
      fatigueScore: 0.20,
      crossPlatformPresence: {
        instagram_reels: true,
        tiktok: true,
        youtube: true,
      },
    },
    outlierScore: 0.70,
    outlierFlags: {
      creatorRelativeOutlier: true,
      topicRelativeOutlier: false,
      crossPlatformOutlier: true,
      engagementQualityOutlier: false,
      retentionOutlier: false,
      monetizationOpportunity: true,
      noveltyFlag: false,
      fatigueRisk: false,
    },
    topicStage: "rising",
    recommendedAction: "test",
    relatedClusterIds: [],
    businessRelevanceScore: 0.85,
    monetizationFit: ["AI Automation Audit+Build", "Social Growth System"],
  };
}

// ─── Perplexity caller ────────────────────────────────────────────────────────

function makePerplexityCaller(apiKey: string) {
  return async (query: string): Promise<{ answer: string; citations: Array<{ url: string; title: string }> }> => {
    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: "Be precise and concise. Focus on what is trending, why it matters, and actionable insights for content creators.",
          },
          { role: "user", content: query },
        ],
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Perplexity API error ${resp.status}: ${txt.slice(0, 200)}`);
    }

    const data = await resp.json() as {
      choices: Array<{ message: { content: string } }>;
      citations?: string[];
    };

    const answer = data.choices[0]?.message?.content ?? "";
    const citations = (data.citations ?? []).map((url: string, i: number) => ({
      url,
      title: `Citation ${i + 1}`,
    }));

    return { answer, citations };
  };
}

// ─── Brave Search caller ──────────────────────────────────────────────────────

function makeBraveSearchCaller(apiKey: string) {
  return async (
    query: string,
    type: "web" | "news" | "videos" = "web"
  ): Promise<Array<{ title: string; url: string; description: string; published?: string; type: "web" | "news" | "video" }>> => {
    const endpoint =
      type === "videos"
        ? "https://api.search.brave.com/res/v1/videos/search"
        : "https://api.search.brave.com/res/v1/web/search";

    const params = new URLSearchParams({ q: query, count: "10" });
    const resp = await fetch(`${endpoint}?${params}`, {
      headers: {
        "Accept": "application/json",
        "X-Subscription-Token": apiKey,
      },
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Brave Search error ${resp.status}: ${txt.slice(0, 200)}`);
    }

    const data = await resp.json() as {
      web?: { results?: Array<{ title: string; url: string; description: string; page_age?: string }> };
      videos?: { results?: Array<{ title: string; url: string; description: string; age?: string }> };
    };

    if (type === "videos") {
      return (data.videos?.results ?? []).map((r) => ({
        title: r.title,
        url: r.url,
        description: r.description ?? "",
        published: r.age,
        type: "video" as const,
      }));
    }

    return (data.web?.results ?? []).map((r) => ({
      title: r.title,
      url: r.url,
      description: r.description ?? "",
      published: r.page_age,
      type: (r.url.includes("reddit") ? "web" : "web") as "web",
    }));
  };
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
  log("=== Research Pipeline ===");
  if (dryRun) log("DRY RUN — skipping Supabase writes + Telegram");
  if (experimental) log("EXPERIMENTAL — using experimental Blotato account IDs");

  if (!SUPABASE_KEY) {
    console.error("[research-pipeline] FATAL: SUPABASE_KEY / SUPABASE_SERVICE_KEY not set");
    process.exit(1);
  }

  // ── Step 1: Supabase ──────────────────────────────────────────────────────
  log("Step 1 — Connecting to Supabase...");
  const sb = makeSupabaseClient(SUPABASE_URL, SUPABASE_KEY);

  // ── Step 2: Trend signals ─────────────────────────────────────────────────
  log("Step 2 — Fetching trend cluster...");
  const cluster = await fetchTrendCluster(sb, topicOverride);
  log(`  Topic: "${cluster.label}" (stage: ${cluster.topicStage}, score: ${cluster.outlierScore.toFixed(2)})`);

  // ── Step 3 + 4: Wire APIs ─────────────────────────────────────────────────
  const callAI = makeCallAI();

  let callPerplexity: ((q: string) => Promise<{ answer: string; citations: Array<{ url: string; title: string }> }>) | undefined;
  if (PERPLEXITY_KEY) {
    log("Step 3 — Perplexity API configured");
    callPerplexity = makePerplexityCaller(PERPLEXITY_KEY);
  } else {
    warn("PERPLEXITY_API_KEY not set — research will skip Perplexity grounding");
  }

  let callBraveSearch: ((q: string, type?: "web" | "news" | "videos") => Promise<Array<{ title: string; url: string; description: string; published?: string; type: "web" | "news" | "video" }>>) | undefined;
  if (BRAVE_KEY) {
    log("Step 4 — Brave Search API configured");
    callBraveSearch = makeBraveSearchCaller(BRAVE_KEY);
  } else {
    warn("BRAVE_API_KEY not set — research will skip web search expansion");
  }

  // ── Step 5 + 6: Run autonomous pipeline ──────────────────────────────────
  log("Step 5/6 — Running autonomous content pipeline...");
  const schemaPlatform = PLATFORM_MAP[platformArg] as any;
  const accountId = experimental
    ? PLATFORM_ACCOUNT[platformArg]?.experimental
    : PLATFORM_ACCOUNT[platformArg]?.standard;

  let pipelineResult;
  try {
    pipelineResult = await runAutonomousPipeline(
      cluster,
      [],  // no creator profiles needed — research-only run
      [],  // no content items — pipeline scores opportunity from cluster
      {
        workspaceId: "isaiah_primary",
        callAI,
        callPerplexity,
        callBraveSearch,
        supabase: dryRun ? undefined : sb as any,
      },
      {
        targetPlatform: schemaPlatform,
        primaryOfferId: "ai_automation_audit_build",
        icpId: "saas_founders_500k_5m_arr",
        icpPains: [
          "spending too much time on manual work",
          "content takes hours to produce",
          "not converting social traffic to leads",
          "can't afford a full marketing team",
        ],
        offerPromise: "Automate your growth stack in 30 days — guaranteed ROI or money back",
        avatarId: "default_heygen_avatar",
      }
    );
  } catch (err) {
    console.error("[research-pipeline] Pipeline execution failed:", err);
    process.exit(1);
  }

  // ── Step 7: Persist additional records ───────────────────────────────────
  if (!dryRun) {
    log("Step 7 — Persisting to Supabase...");

    // Persist brief (engine also persists to content_intel_briefs internally)
    if (pipelineResult.contentBrief) {
      const { error } = await sb.from("content_intel_briefs").upsert(pipelineResult.contentBrief);
      if (error) warn(`content_intel_briefs upsert error: ${error}`);
      else log("  content_intel_briefs: saved");
    }

    // Persist research packet
    if (pipelineResult.researchPacket) {
      const { error } = await sb.from("content_intel_research_packets").upsert(pipelineResult.researchPacket);
      if (error) warn(`content_intel_research_packets upsert error: ${error}`);
      else log("  content_intel_research_packets: saved");
    }
  } else {
    log("Step 7 — DRY RUN: skipping Supabase writes");
  }

  // ── Step 8: Print summary ─────────────────────────────────────────────────
  log("Step 8 — Summary:");
  log(`  Job ID:         ${pipelineResult.jobId}`);
  log(`  Final state:    ${pipelineResult.state}`);
  log(`  Topic:          "${cluster.label}"`);
  log(`  Platform:       ${platformArg} (account ${accountId ?? "n/a"})`);
  log(`  Experimental:   ${experimental}`);

  if (pipelineResult.contentBrief) {
    log(`  Brief ID:       ${pipelineResult.contentBrief.contentBriefId}`);
    log(`  Summary:        ${pipelineResult.contentBrief.briefSummary}`);
  }

  if (pipelineResult.strategyPacket?.selectedAngle) {
    const angle = pipelineResult.strategyPacket.selectedAngle;
    log(`  Selected angle: "${angle.angleName}"`);
    log(`  Angle summary:  ${angle.angleSummary}`);
    log(`  Why now:        ${angle.whyNow}`);
    log(`  Novelty score:  ${angle.noveltyScore}`);
    log(`  Overall score:  ${angle.overallAngleScore}`);
  }

  if (pipelineResult.researchPacket) {
    const rp = pipelineResult.researchPacket;
    log(`  Web findings:   ${rp.webFindings.length} sources`);
    log(`  Completeness:   ${(rp.researchCompleteness * 100).toFixed(0)}%`);
  }

  const stateSteps = pipelineResult.stateHistory.map((s) => s.state).join(" → ");
  log(`  State path:     ${stateSteps}`);

  // ── Step 9: Telegram notification ─────────────────────────────────────────
  if (!dryRun) {
    log("Step 9 — Sending Telegram notification...");
    const angle = pipelineResult.strategyPacket?.selectedAngle;
    const brief = pipelineResult.contentBrief;
    const rp = pipelineResult.researchPacket;

    const msg = [
      `*Research Pipeline Complete*`,
      ``,
      `*Topic:* ${cluster.label}`,
      `*Platform:* ${platformArg}${experimental ? " (experimental)" : ""}`,
      `*State:* ${pipelineResult.state}`,
      ``,
      angle ? `*Angle:* ${angle.angleName}` : "",
      angle ? `${angle.angleSummary}` : "",
      brief ? `*Brief ID:* \`${brief.contentBriefId}\`` : "",
      rp ? `*Research:* ${rp.webFindings.length} sources, ${(rp.researchCompleteness * 100).toFixed(0)}% complete` : "",
      `*Trend score:* ${cluster.outlierScore.toFixed(2)} (${cluster.topicStage})`,
    ].filter(Boolean).join("\n");

    await sendTelegram(msg);
  } else {
    log("Step 9 — DRY RUN: skipping Telegram");
  }

  log("=== Research Pipeline complete ===");
}

main().catch((err) => { console.error(err); process.exit(1); });
