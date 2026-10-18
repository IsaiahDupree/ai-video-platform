#!/usr/bin/env npx tsx
/**
 * run-isaiah-pipeline.ts — Full autonomous end-to-end pipeline
 *
 * Flow:
 *   1. runIsaiahPipeline()  — Supabase → DecisionEngine → IsaiahTalkingHeadV1Props
 *   2. remotion render      — renders the composition to a local MP4
 *   3. Supabase Storage     — uploads the MP4 for a stable public URL
 *   4. Blotato /v2/media    — registers video on Blotato CDN
 *   5. Blotato /v2/posts    — publishes as Instagram Reel (or chosen platform)
 *   6. Poll for status      — waits up to 5 min for "published"
 *   7. Telegram notify      — fires "✅ Posted → <url>" message
 *
 * Usage:
 *   npx tsx scripts/run-isaiah-pipeline.ts
 *   npx tsx scripts/run-isaiah-pipeline.ts --account-id 807        # force Blotato account
 *   npx tsx scripts/run-isaiah-pipeline.ts --item-id <uuid>        # force specific mv_media_items row
 *   npx tsx scripts/run-isaiah-pipeline.ts --platform tiktok       # override platform (instagram|tiktok|youtube)
 *   npx tsx scripts/run-isaiah-pipeline.ts --dry-run               # run pipeline but skip publish
 *   npx tsx scripts/run-isaiah-pipeline.ts --skip-render           # post raw source clip (no Remotion render)
 *   npx tsx scripts/run-isaiah-pipeline.ts --experimental          # use secondary accounts (@the_isaiah_dupree_)
 */

import { execSync, spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { runIsaiahPipeline } from "../src/lib/pipelineRunner";

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag: string) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
const hasFlag = (flag: string) => args.includes(flag);

const overrideAccountId = getArg("--account-id") ? parseInt(getArg("--account-id")!) : undefined;
const overrideItemId    = getArg("--item-id");
const overridePlatform  = (getArg("--platform") ?? "instagram") as "instagram" | "tiktok" | "youtube";
const dryRun            = hasFlag("--dry-run");
const skipRender        = hasFlag("--skip-render");
const experimental      = hasFlag("--experimental");
const apiKey            = getArg("--api-key") ?? process.env.ANTHROPIC_API_KEY;

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL     = "https://ivhfuhxorppptyuofbgq.supabase.co";
const SUPABASE_KEY     = process.env.SUPABASE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? "";
const BLOTATO_KEY      = process.env.BLOTATO_API_KEY ?? "";
const TELEGRAM_TOKEN   = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";
const BLOTATO_BASE     = "https://backend.blotato.com/v2";

const STUDIO_DIR  = path.resolve(__dirname, "..");
const OUTPUT_DIR  = path.join(STUDIO_DIR, "output", "isaiah-pipeline");
const TMP_PROPS   = path.join(OUTPUT_DIR, "props.json");

// Platform → Blotato account map (override with --account-id)
const DEFAULT_ACCOUNT: Record<string, number> = {
  instagram: 807,   // @the_isaiah_dupree
  tiktok:    243,   // @the_isaiah_dupree (TikTok)
  youtube:   228,   // Isaiah Dupree (YouTube Shorts)
};

// Secondary accounts — activated with --experimental
const EXPERIMENTAL_ACCOUNT: Record<string, number> = {
  instagram: 670,   // @the_isaiah_dupree_ (secondary IG)
  tiktok:    201,   // @the_isaiah_dupree_ (secondary TikTok)
  youtube:   3370,  // secondary YouTube
};

// Platform → Blotato targetType map
const PLATFORM_TARGET_TYPE: Record<string, string> = {
  instagram: "instagram",
  tiktok:    "tiktok",
  youtube:   "youtube",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) { console.log(`[pipeline] ${msg}`); }
function die(msg: string): never { console.error(`[pipeline] ❌ ${msg}`); process.exit(1); }

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
    headers: {
      "blotato-api-key": BLOTATO_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: publicUrl }),
  });
  if (!resp.ok) throw new Error(`Blotato media register failed ${resp.status}: ${await resp.text()}`);
  const data = await resp.json() as { url?: string };
  if (!data.url) throw new Error(`Blotato media register returned no url: ${JSON.stringify(data)}`);
  return data.url;
}

async function publishToBlotato(opts: {
  accountId: number;
  platform: string;
  caption: string;
  mediaUrl: string;
}): Promise<string> {
  const targetType = PLATFORM_TARGET_TYPE[opts.platform] ?? opts.platform;
  const target: Record<string, unknown> = { targetType };

  if (opts.platform === "instagram") target["mediaType"] = "reel";
  if (opts.platform === "tiktok") {
    target["privacyLevel"] = "PUBLIC_TO_EVERYONE";
    target["isAiGenerated"] = true;
  }
  if (opts.platform === "youtube") {
    target["title"] = opts.caption.slice(0, 100);
    target["privacyStatus"] = "public";
    target["shouldNotifySubscribers"] = true;
    target["isMadeForKids"] = false;
    target["containsSyntheticMedia"] = true;
  }

  const payload = {
    post: {
      accountId: opts.accountId,
      content: {
        text: opts.caption,
        platform: targetType,
        mediaUrls: [opts.mediaUrl],
      },
      target,
    },
  };

  const resp = await fetch(`${BLOTATO_BASE}/posts`, {
    method: "POST",
    headers: { "blotato-api-key": BLOTATO_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error(`Blotato post failed ${resp.status}: ${await resp.text()}`);
  const data = await resp.json() as { postSubmissionId?: string };
  if (!data.postSubmissionId) throw new Error(`No postSubmissionId: ${JSON.stringify(data)}`);
  return data.postSubmissionId;
}

async function pollUntilPublished(submissionId: string, maxMs = 300_000): Promise<string | null> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const resp = await fetch(`${BLOTATO_BASE}/posts/${submissionId}`, {
      headers: { "blotato-api-key": BLOTATO_KEY },
    });
    if (resp.ok) {
      const data = await resp.json() as { status?: string; publicUrl?: string };
      if (data.status === "published" && data.publicUrl) return data.publicUrl;
      if (data.status === "failed") throw new Error(`Blotato post failed: ${JSON.stringify(data)}`);
      log(`  polling... status=${data.status}`);
    }
    await new Promise(r => setTimeout(r, 8_000));
  }
  return null;  // timeout — post may still publish eventually
}

async function sendTelegram(msg: string) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) { log("Telegram not configured — skipping notification"); return; }
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
  log("=== Isaiah Reel Pipeline ===");
  if (dryRun) log("DRY RUN — will not publish");

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // ── Step 1: Decision Engine ────────────────────────────────────────────────
  log("Step 1 — Running IsaiahPipeline (Supabase → DecisionEngine)...");
  const { props, job, sourceItem } = await runIsaiahPipeline(apiKey, overrideItemId);
  log(`  Source clip: ${sourceItem.file_name} (${sourceItem.ai_niche}, quality ${sourceItem.ai_quality_score})`);
  log(`  Summary strap: "${job.generatedCopy.summaryStrapText}"`);
  log(`  Platform caption: "${job.generatedCopy.platformCaption.slice(0, 80)}..."`);

  // ── Step 2: Render or use raw clip ─────────────────────────────────────────
  let localVideoPath: string;

  if (skipRender) {
    log("Step 2 — Skipping Remotion render (--skip-render), using source clip");
    localVideoPath = sourceItem.local_path ?? die("Source item has no local_path");
    if (!fs.existsSync(localVideoPath)) die(`Source clip not found: ${localVideoPath}`);
  } else {
    log("Step 2 — Writing props JSON...");
    const propsJson = JSON.stringify(props, null, 2);
    fs.writeFileSync(TMP_PROPS, propsJson);
    log(`  Props written to ${TMP_PROPS}`);

    const outputName = `isaiah-reel-${Date.now()}.mp4`;
    const outputPath = path.join(OUTPUT_DIR, outputName);

    log("Step 2 — Running remotion render IsaiahTalkingHeadV1...");
    const renderResult = spawnSync(
      "npx",
      [
        "remotion", "render",
        "IsaiahTalkingHeadV1",
        `--props=${TMP_PROPS}`,
        `--output=${outputPath}`,
        "--overwrite",
      ],
      {
        cwd: STUDIO_DIR,
        stdio: "inherit",
        shell: true,
        timeout: 300_000,
      }
    );

    if (renderResult.status !== 0) die(`Remotion render failed (exit ${renderResult.status})`);
    if (!fs.existsSync(outputPath)) die(`Render output not found at ${outputPath}`);

    const sizeMB = (fs.statSync(outputPath).size / 1_048_576).toFixed(1);
    log(`  ✓ Rendered: ${outputPath} (${sizeMB} MB)`);
    localVideoPath = outputPath;
  }

  if (dryRun) {
    log("DRY RUN complete — skipping upload + publish");
    log(`  Props: ${TMP_PROPS}`);
    log(`  Video: ${localVideoPath}`);
    return;
  }

  // ── Step 3: Upload to Supabase Storage ────────────────────────────────────
  log("Step 3 — Uploading to Supabase Storage...");
  const destName = `${sourceItem.id}-${Date.now()}.mp4`;
  const supabaseUrl = await uploadToSupabaseStorage(localVideoPath, destName);
  log(`  ✓ Supabase URL: ${supabaseUrl}`);

  // ── Step 4: Register with Blotato CDN ─────────────────────────────────────
  log("Step 4 — Registering with Blotato media CDN...");
  const blotatoMediaUrl = await registerWithBlotato(supabaseUrl);
  log(`  ✓ Blotato media URL: ${blotatoMediaUrl}`);

  // ── Step 5: Publish ────────────────────────────────────────────────────────
  const accountId = overrideAccountId ?? (experimental ? EXPERIMENTAL_ACCOUNT : DEFAULT_ACCOUNT)[overridePlatform];
  const caption   = job.generatedCopy.platformCaption;

  log(`Step 5 — Publishing to ${overridePlatform} (account ${accountId})...`);
  const submissionId = await publishToBlotato({
    accountId,
    platform: overridePlatform,
    caption,
    mediaUrl: blotatoMediaUrl,
  });
  log(`  ✓ Submission ID: ${submissionId}`);

  // ── Step 6: Poll for published status ─────────────────────────────────────
  log("Step 6 — Polling for published status (up to 5 min)...");
  const publicUrl = await pollUntilPublished(submissionId);

  if (publicUrl) {
    log(`  ✅ Published: ${publicUrl}`);
  } else {
    log("  ⚠️  Timed out polling — post may still be processing");
  }

  // ── Step 7: Telegram notification ─────────────────────────────────────────
  const postUrl = publicUrl ?? `(submission ${submissionId} — still processing)`;
  const msg = [
    `🎬 *Isaiah Reel Posted*`,
    ``,
    `Platform: ${overridePlatform} (account ${accountId})${experimental ? " \\[experimental]" : ""}`,
    `Clip: ${sourceItem.file_name}`,
    `Niche: ${sourceItem.ai_niche ?? "unknown"}  |  Quality: ${sourceItem.ai_quality_score ?? "?"}`,
    `Strap: "${job.generatedCopy.summaryStrapText}"`,
    `is_experimental: ${experimental}`,
    ``,
    `🔗 ${postUrl}`,
  ].join("\n");

  log("Step 7 — Sending Telegram notification...");
  await sendTelegram(msg);

  log("=== Pipeline complete ===");
}

main().catch(err => { console.error(err); process.exit(1); });
