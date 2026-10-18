#!/usr/bin/env npx tsx
/**
 * run-repurpose-engine.ts — Repurpose top-performing posts into new formats
 *
 * Flow:
 *   1. Query actp_blotato_submissions for posts with performance_score >= threshold
 *      published 3–14 days ago that have NOT been repurposed (repurposed_at IS NULL)
 *   2. Also query mv_media_items for talking-head items with ai_quality_score >= 7
 *      that have been published
 *   3. For each top performer (limit N per run):
 *      a. Determine remix strategy based on original platform
 *      b. Generate new summaryStrapText via Claude Haiku (caption rewrite)
 *      c. Run Remotion render with updated props
 *      d. Upload to Supabase Storage
 *      e. Register on Blotato /v2/media
 *      f. Schedule post on Blotato /v2/posts staggered by 24h
 *   4. Mark source posts as repurposed
 *   5. Send Telegram summary
 *
 * Usage:
 *   npx tsx scripts/run-repurpose-engine.ts
 *   npx tsx scripts/run-repurpose-engine.ts --dry-run
 *   npx tsx scripts/run-repurpose-engine.ts --limit 5
 *   npx tsx scripts/run-repurpose-engine.ts --threshold 0.75
 */

import { execSync, spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import Anthropic from "@anthropic-ai/sdk";

// ─── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag: string): string | undefined => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const hasFlag = (flag: string): boolean => args.includes(flag);

const dryRun    = hasFlag("--dry-run");
const limit     = parseInt(getArg("--limit") ?? "3", 10);
const threshold = parseFloat(getArg("--threshold") ?? "0.65");

// ─── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL  = "https://ivhfuhxorppptyuofbgq.supabase.co";
const SUPABASE_KEY  = process.env.SUPABASE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? "";
const BLOTATO_BASE  = "https://backend.blotato.com/v2";
const BLOTATO_KEY   = process.env.BLOTATO_API_KEY ?? "";
const TELEGRAM_TOKEN   = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";

const STUDIO_DIR = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(STUDIO_DIR, "output", "repurpose");
const TMP_DIR    = "/tmp";

const BLOTATO_HEADERS = {
  "blotato-api-key": BLOTATO_KEY,
  "Content-Type": "application/json",
};

// Platform → remix targets map
// Each source platform gets two destination platforms with their Blotato account IDs
const REMIX_STRATEGY: Record<string, Array<{ platform: string; accountId: number }>> = {
  instagram: [
    { platform: "tiktok",   accountId: 201  },
    { platform: "youtube",  accountId: 3370 },
  ],
  tiktok: [
    { platform: "instagram", accountId: 670  },
    { platform: "youtube",   accountId: 3370 },
  ],
  youtube: [
    { platform: "instagram", accountId: 670 },
    { platform: "tiktok",    accountId: 201 },
  ],
};

// Caption style variants for remix
const CAPTION_VARIANTS = [
  "isaiah_karaoke_pop_v1",
  "isaiah_clean_stack_v1",
  "isaiah_phrase_blocks_v1",
];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BlotatoSubmission {
  id: string;
  platform?: string;
  performance_score?: number;
  views?: number;
  caption?: string;
  media_url?: string;
  source_media_item_id?: string;
  created_at?: string;
  published_at?: string;
  repurposed_at?: string | null;
}

interface MediaItem {
  id: string;
  file_name?: string;
  local_path?: string;
  ai_niche?: string;
  ai_quality_score?: number;
  ai_summary?: string;
  published_at?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function log(msg: string): void {
  console.log(`[repurpose] ${msg}`);
}

function die(msg: string): never {
  console.error(`[repurpose] ERROR: ${msg}`);
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

async function supabasePatch(table: string, id: string, body: Record<string, unknown>): Promise<void> {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
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
    throw new Error(`Supabase PATCH ${table}/${id} failed ${resp.status}: ${txt.slice(0, 200)}`);
  }
}

async function uploadToSupabaseStorage(localPath: string, destName: string): Promise<string> {
  const fileData = fs.readFileSync(localPath);
  const objectPath = `pipeline-renders/${destName}`;
  const url = `${SUPABASE_URL}/storage/v1/object/${objectPath}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "video/mp4",
      "x-upsert": "true",
    },
    body: fileData,
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Supabase Storage upload failed ${resp.status}: ${txt.slice(0, 200)}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${objectPath}`;
}

async function registerWithBlotato(publicUrl: string): Promise<string> {
  const resp = await fetch(`${BLOTATO_BASE}/media`, {
    method: "POST",
    headers: BLOTATO_HEADERS,
    body: JSON.stringify({ url: publicUrl }),
  });
  if (!resp.ok) throw new Error(`Blotato media register failed ${resp.status}: ${await resp.text()}`);
  const data = await resp.json() as { url?: string };
  if (!data.url) throw new Error(`Blotato media register returned no url: ${JSON.stringify(data)}`);
  return data.url;
}

async function scheduleOnBlotato(opts: {
  accountId: number;
  platform: string;
  caption: string;
  mediaUrl: string;
  scheduledAt: string;
}): Promise<string> {
  const payload = {
    post: {
      accountId: opts.accountId,
      content: {
        text: opts.caption,
        platform: opts.platform,
        mediaUrls: [opts.mediaUrl],
      },
      target: {
        targetType: opts.platform,
        mediaType: "reel",
      },
      scheduledAt: opts.scheduledAt,
    },
  };

  const resp = await fetch(`${BLOTATO_BASE}/posts`, {
    method: "POST",
    headers: BLOTATO_HEADERS,
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error(`Blotato schedule post failed ${resp.status}: ${await resp.text()}`);
  const data = await resp.json() as { postSubmissionId?: string };
  if (!data.postSubmissionId) throw new Error(`No postSubmissionId: ${JSON.stringify(data)}`);
  return data.postSubmissionId;
}

async function rewriteCaptionForPlatform(
  originalCaption: string,
  targetPlatform: string,
  niche?: string,
): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    log("  ANTHROPIC_API_KEY not set — using original caption with platform tag");
    return `${originalCaption}\n\n#${targetPlatform}`;
  }

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Rewrite this social media caption for ${targetPlatform}. Keep the core message but adapt the hook, tone, and hashtags for the platform's culture. Niche: ${niche ?? "ai_automation"}. Keep it under 2200 characters. Return only the caption text.\n\nOriginal caption:\n${originalCaption}`,
          },
        ],
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from Claude");
  return content.text.trim();
}

async function generateRemixStrap(
  originalCaption: string,
  targetPlatform: string,
  niche?: string,
): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    return "THIS CHANGES EVERYTHING";
  }

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 50,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Write a 4–8 word summary strap for a ${targetPlatform} reel about: "${originalCaption.slice(0, 200)}". Niche: ${niche ?? "ai_automation"}. Make it punchy, all caps, no punctuation. Return ONLY the strap text.`,
          },
        ],
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from Claude");
  return content.text.trim().toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, 60);
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

function buildRemotionProps(opts: {
  sourceVideoUrl: string;
  summaryStrapText: string;
  captionStylePreset: string;
  niche?: string;
}): Record<string, unknown> {
  return {
    sourceVideoUrl: opts.sourceVideoUrl,
    transcriptWords: [],
    brandName: "Isaiah Dupree",
    summaryStrapText: opts.summaryStrapText,
    contentBrief: {
      topic: opts.niche ?? "ai_automation",
      objective: "Repurposed content — new platform remix",
      audience: "Software founders and creators",
      hookType: "system_explanation",
      cta: "Follow for more",
    },
    faceBoxes: [],
    selectedSegments: [],
    styleScores: {
      transcriptFidelity: 0.8,
      briefAlignment: 0.8,
      styleMatch: 0.8,
      sourceFit: 0.8,
    },
    layoutRules: {
      captionTextColor: "#000000",
      captionBgColor: "#7DFF63",
      summaryTextColor: "#000000",
      summaryBgColor: "#7DFF63",
      avoidFaceOverlap: true,
      captionStylePreset: opts.captionStylePreset,
      headlineFontPreset: "archivo_black",
      captionFontPreset: "space_grotesk_semibold",
    },
    editPlan: {
      cutPlan: {
        removeDeadAir: true,
        silenceThresholdMs: 300,
        targetCadenceSeconds: 1.2,
      },
      zoomPlan: { enabled: false, triggerMoments: [] },
      brollPlan: { enabled: false, insertionMoments: [] },
      screenshotPlan: { enabled: false, insertionMoments: [] },
    },
  };
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  log("=== Repurpose Engine ===");
  if (dryRun) log("DRY RUN — renders and Blotato calls will be skipped");
  log(`Config: limit=${limit}, threshold=${threshold}`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  if (!SUPABASE_KEY) die("SUPABASE_KEY / SUPABASE_SERVICE_KEY not set");

  // ── Step 1: Query top-performing posts ───────────────────────────────────────
  log("Step 1 — Querying actp_blotato_submissions for top performers...");

  const now = new Date();
  const minAge = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 14 days ago
  const maxAge = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);  // 3 days ago

  const submissionsQuery = [
    `repurposed_at=is.null`,
    `published_at=gte.${minAge.toISOString()}`,
    `published_at=lte.${maxAge.toISOString()}`,
    `or=(performance_score.gte.${threshold},views.gte.1000)`,
    `order=performance_score.desc`,
    `limit=${limit}`,
    `select=id,platform,performance_score,views,caption,media_url,source_media_item_id,created_at,published_at,repurposed_at`,
  ].join("&");

  let topPosts: BlotatoSubmission[] = [];
  try {
    topPosts = (await supabaseGet(`actp_blotato_submissions?${submissionsQuery}`)) as BlotatoSubmission[];
    log(`  Found ${topPosts.length} top-performing posts`);
  } catch (err) {
    log(`  Warning: Could not query actp_blotato_submissions — ${(err as Error).message}`);
    topPosts = [];
  }

  // ── Step 2: Query mv_media_items for talking-head clips ──────────────────────
  log("Step 2 — Querying mv_media_items for high-quality talking-head clips...");

  const mediaQuery = [
    `ai_quality_score=gte.7`,
    `published_at=not.is.null`,
    `order=ai_quality_score.desc`,
    `limit=${limit}`,
    `select=id,file_name,local_path,ai_niche,ai_quality_score,ai_summary,published_at`,
  ].join("&");

  let mediaItems: MediaItem[] = [];
  try {
    mediaItems = (await supabaseGet(`mv_media_items?${mediaQuery}`)) as MediaItem[];
    log(`  Found ${mediaItems.length} high-quality media items`);
  } catch (err) {
    log(`  Warning: Could not query mv_media_items — ${(err as Error).message}`);
    mediaItems = [];
  }

  // Merge: use topPosts as primary, supplement with mediaItems if fewer than limit
  const candidates: Array<{ post?: BlotatoSubmission; mediaItem?: MediaItem }> = [];
  for (const post of topPosts) {
    const linkedMedia = post.source_media_item_id
      ? mediaItems.find(m => m.id === post.source_media_item_id)
      : undefined;
    candidates.push({ post, mediaItem: linkedMedia });
  }

  // Add any high-quality media items not already covered
  for (const item of mediaItems) {
    if (candidates.length >= limit) break;
    const alreadyLinked = candidates.some(c => c.mediaItem?.id === item.id);
    if (!alreadyLinked) {
      candidates.push({ mediaItem: item });
    }
  }

  if (candidates.length === 0) {
    log("No repurpose candidates found — nothing to do.");
    await sendTelegram("♻️ Repurpose Engine: No eligible posts found this run.");
    return;
  }

  log(`Processing ${candidates.length} candidate(s)...`);

  // ── Step 3–6: Process each candidate ─────────────────────────────────────────
  let totalScheduled = 0;
  let scheduleOffsetHours = 24;

  for (let i = 0; i < candidates.length; i++) {
    const { post, mediaItem } = candidates[i];
    const candidateId = post?.id ?? mediaItem?.id ?? `candidate-${i}`;
    const originalPlatform = (post?.platform ?? "instagram").toLowerCase().replace("_reels", "");
    const originalCaption  = post?.caption ?? mediaItem?.ai_summary ?? "AI automation insights that will change how you work.";
    const niche            = mediaItem?.ai_niche ?? "ai_automation";
    const localPath        = mediaItem?.local_path;
    const score            = post?.performance_score?.toFixed(2) ?? `quality:${mediaItem?.ai_quality_score}`;

    log(`\n[${i + 1}/${candidates.length}] Candidate: ${candidateId}`);
    log(`  Platform: ${originalPlatform} | Score: ${score} | Niche: ${niche}`);

    const targets = REMIX_STRATEGY[originalPlatform] ?? REMIX_STRATEGY["instagram"];

    for (let t = 0; t < targets.length; t++) {
      const target = targets[t];
      log(`  → Remixing to ${target.platform} (account ${target.accountId})...`);

      // Generate new caption and strap
      const newCaption = dryRun
        ? `[DRY RUN] ${originalCaption}`
        : await rewriteCaptionForPlatform(originalCaption, target.platform, niche);

      const captionVariant  = CAPTION_VARIANTS[t % CAPTION_VARIANTS.length];
      const newStrap = dryRun
        ? "AI AUTOMATION CHANGES EVERYTHING"
        : await generateRemixStrap(originalCaption, target.platform, niche);

      log(`    Strap: "${newStrap}" | Caption style: ${captionVariant}`);

      if (dryRun) {
        log(`    [DRY RUN] Would render + upload + schedule for ${target.platform}`);
        continue;
      }

      // Determine source video URL
      let sourceVideoUrl: string | null = null;

      if (localPath && fs.existsSync(localPath)) {
        // Use local file — render with Remotion
        const propsFile   = path.join(TMP_DIR, `repurpose_props_${candidateId}_${t}.json`);
        const outputFile  = path.join(OUTPUT_DIR, `repurpose_${candidateId}_${t}_${target.platform}.mp4`);

        const props = buildRemotionProps({
          sourceVideoUrl: localPath,
          summaryStrapText: newStrap,
          captionStylePreset: captionVariant,
          niche,
        });
        fs.writeFileSync(propsFile, JSON.stringify(props, null, 2));
        log(`    Running Remotion render...`);

        const renderResult = spawnSync(
          "npx",
          [
            "remotion", "render",
            "IsaiahTalkingHeadV1",
            `--props=${propsFile}`,
            `--output=${outputFile}`,
            "--overwrite",
          ],
          {
            cwd: STUDIO_DIR,
            stdio: "inherit",
            shell: true,
            timeout: 300_000,
          }
        );

        if (renderResult.status !== 0) {
          log(`    WARNING: Remotion render failed (exit ${renderResult.status}) — skipping this target`);
          continue;
        }

        if (!fs.existsSync(outputFile)) {
          log(`    WARNING: Render output not found at ${outputFile} — skipping`);
          continue;
        }

        const sizeMB = (fs.statSync(outputFile).size / 1_048_576).toFixed(1);
        log(`    Rendered: ${outputFile} (${sizeMB} MB)`);

        // Upload to Supabase Storage
        log(`    Uploading to Supabase Storage...`);
        const destName  = `repurpose_${candidateId}_${t}_${target.platform}_${Date.now()}.mp4`;
        const supaUrl   = await uploadToSupabaseStorage(outputFile, destName);
        log(`    Supabase URL: ${supaUrl}`);
        sourceVideoUrl = supaUrl;
      } else if (post?.media_url) {
        // No local file — use existing media_url directly
        log(`    No local file — using existing media_url`);
        sourceVideoUrl = post.media_url;
      } else {
        log(`    No video source available for ${candidateId} — skipping`);
        continue;
      }

      // Register with Blotato media CDN
      log(`    Registering with Blotato media CDN...`);
      let blotatoMediaUrl: string;
      try {
        blotatoMediaUrl = await registerWithBlotato(sourceVideoUrl);
        log(`    Blotato media URL: ${blotatoMediaUrl}`);
      } catch (err) {
        log(`    WARNING: Blotato media register failed — ${(err as Error).message}`);
        continue;
      }

      // Schedule post staggered by 24h per post
      const scheduledAt = new Date(now.getTime() + scheduleOffsetHours * 60 * 60 * 1000);
      scheduleOffsetHours += 24;

      log(`    Scheduling for ${scheduledAt.toISOString()} on ${target.platform}...`);
      try {
        const submissionId = await scheduleOnBlotato({
          accountId: target.accountId,
          platform: target.platform,
          caption: newCaption,
          mediaUrl: blotatoMediaUrl,
          scheduledAt: scheduledAt.toISOString(),
        });
        log(`    Scheduled! Submission ID: ${submissionId}`);
        totalScheduled++;
      } catch (err) {
        log(`    WARNING: Blotato schedule failed — ${(err as Error).message}`);
        continue;
      }
    }

    // ── Step 5: Mark source post as repurposed ─────────────────────────────────
    if (!dryRun && post?.id) {
      log(`  Marking ${post.id} as repurposed...`);
      try {
        await supabasePatch("actp_blotato_submissions", post.id, {
          repurposed_at: new Date().toISOString(),
        });
        log(`  Marked repurposed_at = now()`);
      } catch (err) {
        log(`  WARNING: Could not mark repurposed — ${(err as Error).message}`);
      }
    }
  }

  // ── Step 6: Telegram summary ──────────────────────────────────────────────────
  const summary = dryRun
    ? `♻️ *Repurpose Engine* (DRY RUN)\n\nWould process ${candidates.length} posts → ${candidates.length * 2} new posts.`
    : `♻️ *Repurpose Engine Complete*\n\nRepurposed ${candidates.length} posts → ${totalScheduled} new posts scheduled over the next ${scheduleOffsetHours - 24}h.`;

  log(`\n${summary.replace(/\*/g, "")}`);
  await sendTelegram(summary);

  log("=== Repurpose Engine complete ===");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
