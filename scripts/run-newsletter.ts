#!/usr/bin/env npx tsx
/**
 * run-newsletter.ts — Weekly digest newsletter of top-performing content
 *
 * Flow:
 *   1. Query top 5 posts from actp_blotato_submissions (last N days, by performance_score)
 *   2. Query content_intel_briefs (if table exists) for research-driven posts
 *   3. Group content by niche
 *   4. Call Claude Haiku to generate newsletter HTML + subject line
 *   5. Send via Resend API to subscriber list
 *   6. Log send to actp_newsletter_sends table
 *   7. Send Telegram notification
 *
 * Usage:
 *   npx tsx scripts/run-newsletter.ts
 *   npx tsx scripts/run-newsletter.ts --dry-run
 *   npx tsx scripts/run-newsletter.ts --days 14
 *   npx tsx scripts/run-newsletter.ts --niche ai_automation
 */

import Anthropic from "@anthropic-ai/sdk";

// ─── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag: string): string | undefined => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const hasFlag = (flag: string): boolean => args.includes(flag);

const dryRun     = hasFlag("--dry-run");
const lookbackDays = parseInt(getArg("--days") ?? "7", 10);
const nicheFilter  = getArg("--niche");   // e.g. "ai_automation"

// ─── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL  = "https://ivhfuhxorppptyuofbgq.supabase.co";
const SUPABASE_KEY  = process.env.SUPABASE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? "";
const ANTHROPIC_API_KEY  = process.env.ANTHROPIC_API_KEY ?? "";
const RESEND_API_KEY     = process.env.RESEND_API_KEY ?? "";
const TELEGRAM_TOKEN     = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_CHAT_ID ?? "";

const RESEND_BASE   = "https://api.resend.com";
const FROM_ADDRESS  = "Isaiah <newsletter@isaiahdupree.com>";
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

// Subscriber list: env var or fallback to test email
const SUBSCRIBER_TO: string[] = (() => {
  const list = process.env.RESEND_SUBSCRIBER_LIST;
  if (list) return list.split(",").map(e => e.trim()).filter(Boolean);
  const testEmail = process.env.RESEND_TEST_EMAIL;
  if (testEmail) return [testEmail];
  return [];
})();

const CONTENT_NICHES = [
  "ai_automation",
  "saas_growth",
  "content_creation",
  "digital_marketing",
  "creator_economy",
] as const;

type ContentNiche = (typeof CONTENT_NICHES)[number];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BlotatoSubmission {
  id: string;
  platform?: string;
  performance_score?: number;
  views?: number;
  likes?: number;
  shares?: number;
  caption?: string;
  media_url?: string;
  niche?: string;
  created_at?: string;
  published_at?: string;
}

interface ContentIntelBrief {
  id: string;
  title?: string;
  summary?: string;
  niche?: string;
  source_platform?: string;
  created_at?: string;
}

interface NewsletterPost {
  id: string;
  platform: string;
  caption: string;
  niche: ContentNiche;
  performance_score: number;
  views: number;
  published_at: string;
  media_url?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function log(msg: string): void {
  console.log(`[newsletter] ${msg}`);
}

function die(msg: string): never {
  console.error(`[newsletter] ERROR: ${msg}`);
  process.exit(1);
}

async function supabaseGet(path: string): Promise<unknown> {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Supabase GET ${path} failed ${resp.status}: ${txt.slice(0, 200)}`);
  }
  return resp.json();
}

async function supabaseInsert(table: string, body: Record<string, unknown>): Promise<void> {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Supabase INSERT ${table} failed ${resp.status}: ${txt.slice(0, 200)}`);
  }
}

function guessNiche(text: string): ContentNiche {
  const t = (text ?? "").toLowerCase();
  if (t.includes("ai") || t.includes("automat") || t.includes("gpt") || t.includes("claude")) return "ai_automation";
  if (t.includes("saas") || t.includes("software") || t.includes("startup") || t.includes("growth")) return "saas_growth";
  if (t.includes("content") || t.includes("creator") || t.includes("video") || t.includes("reel")) return "content_creation";
  if (t.includes("market") || t.includes("funnel") || t.includes("lead") || t.includes("email")) return "digital_marketing";
  if (t.includes("creator") || t.includes("monetiz") || t.includes("audience") || t.includes("brand")) return "creator_economy";
  return "ai_automation";
}

function groupByNiche(posts: NewsletterPost[]): Map<ContentNiche, NewsletterPost[]> {
  const map = new Map<ContentNiche, NewsletterPost[]>();
  for (const post of posts) {
    const list = map.get(post.niche) ?? [];
    list.push(post);
    map.set(post.niche, list);
  }
  return map;
}

async function generateNewsletterViaClaudeHaiku(
  posts: NewsletterPost[],
  nicheGroups: Map<ContentNiche, NewsletterPost[]>,
  nicheFilter?: string,
): Promise<{ subject: string; html: string }> {
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const postsContext = posts.map((p, i) =>
    `${i + 1}. Platform: ${p.platform} | Niche: ${p.niche} | Score: ${p.performance_score.toFixed(2)} | Views: ${p.views}\nCaption: ${p.caption.slice(0, 300)}\n`
  ).join("\n");

  const nicheList = Array.from(nicheGroups.keys()).join(", ");

  const prompt = `You are writing a weekly newsletter for Isaiah Dupree, an AI automation and content strategy expert.

Here are the top ${posts.length} performing social media posts from the past week:

${postsContext}

Niches covered: ${nicheList}
${nicheFilter ? `Primary focus this week: ${nicheFilter}` : ""}

Write a weekly newsletter digest with:
1. A catchy subject line (under 60 chars, no emoji)
2. An opening paragraph (exactly 50 words, warm and direct)
3. For each post: what it was about + why it performed + 1 key insight (2-3 sentences)
4. A closing CTA: "Which of these topics should I go deeper on? Reply and tell me."

Format as JSON with exactly these fields:
{
  "subject": "...",
  "opening": "...",
  "postSummaries": [{ "id": "...", "title": "...", "why": "...", "insight": "..." }],
  "cta": "..."
}

Return ONLY the JSON, no markdown fences.`;

  const message = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 2000,
    messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
  });

  const raw = message.content[0];
  if (raw.type !== "text") throw new Error("Unexpected response type from Claude");

  let parsed: {
    subject: string;
    opening: string;
    postSummaries: Array<{ id: string; title: string; why: string; insight: string }>;
    cta: string;
  };

  try {
    parsed = JSON.parse(raw.text.trim());
  } catch {
    // Fallback: extract JSON from within the text
    const match = raw.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`Could not parse Claude response as JSON: ${raw.text.slice(0, 300)}`);
    parsed = JSON.parse(match[0]);
  }

  // Build HTML
  const postHtml = parsed.postSummaries.map(ps => {
    const post = posts.find(p => p.id === ps.id);
    const platformBadge = post ? `<span style="font-size:12px;background:#7DFF63;padding:2px 8px;border-radius:4px;color:#000;">${post.platform.toUpperCase()}</span>` : "";
    return `
    <div style="margin:24px 0;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">
      <h3 style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:16px;color:#111;">${platformBadge} ${ps.title}</h3>
      <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:14px;color:#333;"><strong>Why it hit:</strong> ${ps.why}</p>
      <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#555;"><strong>Key insight:</strong> ${ps.insight}</p>
    </div>`;
  }).join("\n");

  const nicheBreakdownHtml = Array.from(nicheGroups.entries())
    .map(([niche, ps]) =>
      `<li style="margin-bottom:4px;"><strong>${niche.replace(/_/g, " ")}</strong>: ${ps.length} post${ps.length !== 1 ? "s" : ""}</li>`
    ).join("\n");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:#000;padding:32px 32px 24px;">
      <h1 style="margin:0;font-family:Arial,sans-serif;font-size:28px;color:#7DFF63;letter-spacing:-0.5px;">Isaiah Dupree</h1>
      <p style="margin:8px 0 0;font-size:13px;color:#aaa;">Weekly Content Digest</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 24px;">${parsed.opening}</p>

      <h2 style="font-size:18px;color:#111;border-bottom:2px solid #7DFF63;padding-bottom:8px;margin:0 0 8px;">This Week's Top Posts</h2>

      ${postHtml}

      <!-- Niche breakdown -->
      <div style="margin:32px 0;padding:16px;background:#f9f9f9;border-radius:8px;">
        <h3 style="margin:0 0 12px;font-size:14px;color:#555;text-transform:uppercase;letter-spacing:0.5px;">Topics covered this week</h3>
        <ul style="margin:0;padding-left:20px;color:#333;font-size:14px;">
          ${nicheBreakdownHtml}
        </ul>
      </div>

      <!-- CTA -->
      <div style="margin:32px 0 0;padding:24px;background:#000;border-radius:8px;text-align:center;">
        <p style="margin:0;font-size:16px;color:#7DFF63;font-weight:bold;">${parsed.cta}</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:24px 32px;border-top:1px solid #e0e0e0;text-align:center;">
      <p style="margin:0;font-size:12px;color:#999;">
        You're receiving this because you subscribed to Isaiah's weekly content digest.<br>
        <a href="{{unsubscribeUrl}}" style="color:#999;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject: parsed.subject, html };
}

async function sendViaResend(opts: {
  to: string[];
  subject: string;
  html: string;
}): Promise<{ id: string }> {
  const resp = await fetch(`${RESEND_BASE}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Resend send failed ${resp.status}: ${txt.slice(0, 300)}`);
  }

  return resp.json() as Promise<{ id: string }>;
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
  const result = await resp.json() as { ok: boolean };
  log(result.ok ? "Telegram notification sent" : "Telegram notification failed");
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  log("=== Newsletter Digest ===");
  if (dryRun) log("DRY RUN — newsletter will be printed but not sent");
  log(`Config: days=${lookbackDays}${nicheFilter ? `, niche=${nicheFilter}` : ""}`);

  if (!SUPABASE_KEY) die("SUPABASE_KEY / SUPABASE_SERVICE_KEY not set");

  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

  // ── Step 1: Query top-performing posts ──────────────────────────────────────
  log("Step 1 — Querying actp_blotato_submissions...");

  const nicheClause = nicheFilter ? `&niche=eq.${nicheFilter}` : "";
  const submissionsQuery = [
    `published_at=gte.${since}`,
    `order=performance_score.desc.nullslast`,
    `limit=5`,
    `select=id,platform,performance_score,views,likes,shares,caption,media_url,niche,created_at,published_at`,
  ].join("&") + nicheClause;

  let rawPosts: BlotatoSubmission[] = [];
  try {
    rawPosts = (await supabaseGet(`actp_blotato_submissions?${submissionsQuery}`)) as BlotatoSubmission[];
    log(`  Found ${rawPosts.length} top posts`);
  } catch (err) {
    log(`  Warning: Could not query actp_blotato_submissions — ${(err as Error).message}`);
  }

  // ── Step 2: Query content_intel_briefs ────────────────────────────────────
  log("Step 2 — Querying content_intel_briefs (if available)...");

  let briefs: ContentIntelBrief[] = [];
  try {
    const briefsQuery = [
      `created_at=gte.${since}`,
      `order=created_at.desc`,
      `limit=5`,
      `select=id,title,summary,niche,source_platform,created_at`,
    ].join("&");
    briefs = (await supabaseGet(`content_intel_briefs?${briefsQuery}`)) as ContentIntelBrief[];
    log(`  Found ${briefs.length} content briefs`);
  } catch {
    log(`  content_intel_briefs table not available — skipping`);
  }

  // ── Step 3: Normalize and group by niche ─────────────────────────────────
  log("Step 3 — Grouping content by niche...");

  const normalizedPosts: NewsletterPost[] = rawPosts.map(p => ({
    id: p.id,
    platform: p.platform ?? "unknown",
    caption: p.caption ?? "(no caption)",
    niche: (CONTENT_NICHES.includes(p.niche as ContentNiche) ? p.niche : guessNiche(p.caption ?? "")) as ContentNiche,
    performance_score: p.performance_score ?? 0,
    views: p.views ?? 0,
    published_at: p.published_at ?? p.created_at ?? new Date().toISOString(),
    media_url: p.media_url,
  }));

  // Supplement with briefs if we have fewer than 3 posts
  if (normalizedPosts.length < 3 && briefs.length > 0) {
    for (const brief of briefs) {
      if (normalizedPosts.length >= 5) break;
      normalizedPosts.push({
        id: brief.id,
        platform: brief.source_platform ?? "research",
        caption: brief.summary ?? brief.title ?? "(no content)",
        niche: guessNiche((brief.niche ?? "") + " " + (brief.summary ?? "")),
        performance_score: 0,
        views: 0,
        published_at: brief.created_at ?? new Date().toISOString(),
      });
    }
  }

  if (normalizedPosts.length === 0) {
    log("No posts found for newsletter — aborting.");
    await sendTelegram("📧 Newsletter: No posts found this week — send skipped.");
    return;
  }

  const nicheGroups = groupByNiche(normalizedPosts);
  log(`  Niche groups: ${Array.from(nicheGroups.keys()).join(", ")}`);

  // ── Step 4: Generate newsletter via Claude ────────────────────────────────
  log("Step 4 — Generating newsletter via Claude Haiku...");

  if (!ANTHROPIC_API_KEY) die("ANTHROPIC_API_KEY not set");

  const { subject, html } = await generateNewsletterViaClaudeHaiku(
    normalizedPosts,
    nicheGroups,
    nicheFilter,
  );

  log(`  Subject: "${subject}"`);

  if (dryRun) {
    log("\n=== DRY RUN: Newsletter Content ===");
    log(`Subject: ${subject}`);
    log("HTML preview (first 2000 chars):");
    console.log(html.slice(0, 2000));
    log("=== End of DRY RUN ===");
    return;
  }

  // ── Step 5: Send via Resend ────────────────────────────────────────────────
  log("Step 5 — Sending via Resend API...");

  if (!RESEND_API_KEY) die("RESEND_API_KEY not set");
  if (SUBSCRIBER_TO.length === 0) die("No subscribers configured. Set RESEND_SUBSCRIBER_LIST or RESEND_TEST_EMAIL.");

  log(`  Recipients: ${SUBSCRIBER_TO.join(", ")}`);

  let emailId: string;
  try {
    const result = await sendViaResend({
      to: SUBSCRIBER_TO,
      subject,
      html,
    });
    emailId = result.id;
    log(`  Email sent! Resend ID: ${emailId}`);
  } catch (err) {
    die(`Failed to send newsletter — ${(err as Error).message}`);
  }

  // ── Step 6: Log to Supabase ────────────────────────────────────────────────
  log("Step 6 — Logging send to actp_newsletter_sends...");

  try {
    await supabaseInsert("actp_newsletter_sends", {
      sent_at: new Date().toISOString(),
      subject,
      post_count: normalizedPosts.length,
      recipient_count: SUBSCRIBER_TO.length,
      status: "sent",
      resend_id: emailId!,
      lookback_days: lookbackDays,
      niche_filter: nicheFilter ?? null,
    });
    log("  Logged to actp_newsletter_sends");
  } catch (err) {
    log(`  Warning: Could not log to actp_newsletter_sends — ${(err as Error).message}`);
  }

  // ── Step 7: Telegram notification ─────────────────────────────────────────
  const telegramMsg = [
    `📧 *Newsletter Sent*`,
    ``,
    `Subject: "${subject}"`,
    `Posts: ${normalizedPosts.length} | Recipients: ${SUBSCRIBER_TO.length}`,
    `Niches: ${Array.from(nicheGroups.keys()).join(", ")}`,
    `Lookback: ${lookbackDays}d${nicheFilter ? ` | Filter: ${nicheFilter}` : ""}`,
  ].join("\n");

  await sendTelegram(telegramMsg);

  log("=== Newsletter complete ===");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
