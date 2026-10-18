#!/usr/bin/env npx tsx
/**
 * ugc-iphone-pipeline.ts — iPhone B-roll → UGC vertical video → Post → Telegram
 *
 * Full autonomous pipeline:
 *   1. Probe source video (duration, dimensions, audio)
 *   2. Convert to 1080×1920 portrait via ffmpeg
 *   3. Whisper transcription (detect what's being said)
 *   4. GPT-4o vision: detect existing captions/title, analyze mood/topic/ICP
 *   5. AI music selection from catalog (mood-matched)
 *   6. Render IPhoneUGCVideo composition (clean-stroke style)
 *   7. Upload to Supabase Storage → get public URL
 *   8. Post via Blotato to secondary account
 *   9. Telegram notification with video URL
 *
 * Usage:
 *   npx tsx scripts/ugc-iphone-pipeline.ts --video "/Volumes/My Passport/clip.mp4"
 *   npx tsx scripts/ugc-iphone-pipeline.ts --video /path/to/clip.mp4 --account 670
 *   npx tsx scripts/ugc-iphone-pipeline.ts --video /path/to/clip.mp4 --dry-run
 *   npx tsx scripts/ugc-iphone-pipeline.ts --video /path/to/clip.mp4 --no-post
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { execSync, spawnSync } from 'child_process';
import OpenAI from 'openai';
import { passesContentGate } from '../src/lib/RawFootageTriage';

// ─── Load env ─────────────────────────────────────────────────────────────────

function loadEnvFile(p: string) {
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
  }
}
// Load from multiple sources (Remotion env first, then actp-worker for service keys)
loadEnvFile(path.resolve(__dirname, '../.env.local'));
loadEnvFile('/Users/isaiahdupree/Documents/Software/actp-worker/.env');

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag: string) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
const hasFlag = (flag: string) => args.includes(flag);

const videoPath      = getArg('--video') ?? '/Volumes/My Passport/2024-06-24 11-22-39.mp4';
const accountId      = parseInt(getArg('--account') ?? '807', 10);
const dryRun         = hasFlag('--dry-run');
const noPost         = hasFlag('--no-post');
const allPlatforms   = hasFlag('--all-platforms');   // post to every account after render
const previewCaptions = hasFlag('--preview-captions'); // print captions, skip posting
const skipTranscribe = hasFlag('--skip-transcribe');
const musicVolumeCli  = getArg('--music-volume') ? parseFloat(getArg('--music-volume')!) : null;
const musicTrackCli   = getArg('--music-track') ?? null;

const STUDIO_DIR  = path.resolve(__dirname, '..');
const OUTPUT_DIR  = path.join(STUDIO_DIR, 'output', 'iphone');
const TMP_DIR     = '/tmp/ugc-iphone-pipeline';
const PUBLIC_DIR  = path.join(STUDIO_DIR, 'public');

const OPENAI_KEY   = process.env.OPENAI_API_KEY ?? '';
const BLOTATO_KEY  = process.env.BLOTATO_API_KEY ?? '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const TELEGRAM_CHAT  = process.env.TELEGRAM_CHAT_ID ?? '';

// ─── Color helpers ────────────────────────────────────────────────────────────

const C = { reset: '\x1b[0m', bold: '\x1b[1m', green: '\x1b[32m', red: '\x1b[31m', cyan: '\x1b[36m', dim: '\x1b[2m', yellow: '\x1b[33m' };
const log = (icon: string, msg: string, detail = '') => console.log(`\n${C.cyan}${icon}${C.reset}  ${msg}${detail ? `\n   ${C.dim}${detail}${C.reset}` : ''}`);
const ok  = (msg: string, detail = '') => console.log(`${C.green}  ✅${C.reset}  ${msg}${detail ? `\n       ${C.dim}${detail}${C.reset}` : ''}`);
const err = (msg: string) => console.log(`${C.red}  ❌${C.reset}  ${msg}`);

// ─── Music selection via shared MusicLibrary ─────────────────────────────────

const MUSIC_LIBRARY_SUGGEST = '/Users/isaiahdupree/Documents/Software/MusicLibrary/suggest.py';

interface LibraryTrack {
  id: string; title: string; artist: string;
  local_path: string; supabase_url?: string;
  genre: string; mood: string; energy_level: number; score: number;
}

interface SelectedMusic { id: string; localPath: string; staticPath: string; label: string; }

/**
 * Select the best-matching track from the shared MusicLibrary using suggest.py
 * (mood × energy × duration × platform scoring).
 * Falls back to safe defaults if the library script isn't available.
 */
// Map GPT-4o content mood → library content-type
const MOOD_TO_CONTENT_TYPE: Record<string, string> = {
  educational: 'educational', inspiring: 'storytelling',
  personal:    'dev_vlog',    casual:    'dev_vlog',
  creator:     'dev_vlog',    business:  'brand',
  authentic:   'dev_vlog',    energetic: 'viral_short',
  trending:    'viral_short',
};

// Map GPT-4o content mood → library mood vocabulary (library only knows: energetic, calm, inspiring, dramatic, uplifting, happy, focused)
const MOOD_TO_LIBRARY_MOOD: Record<string, string> = {
  educational: 'focused',   inspiring:  'inspiring',
  personal:    'calm',      casual:     'calm',
  creator:     'calm',      business:   'uplifting',
  authentic:   'calm',      energetic:  'energetic',
  trending:    'energetic',
};

function selectMusicFromLibrary(
  contentMood: string,
  transcript: string,
  durationSec: number,
  platform = 'instagram',
): SelectedMusic {
  try {
    const contentType  = MOOD_TO_CONTENT_TYPE[contentMood.toLowerCase()]  ?? 'reels';
    const libraryMood  = MOOD_TO_LIBRARY_MOOD[contentMood.toLowerCase()]  ?? contentMood;
    const pyArgs = [
      MUSIC_LIBRARY_SUGGEST, '--json', '--top', '5',
      '--platform', platform,
      '--content-type', contentType,
      '--mood', libraryMood,
      '--duration', String(Math.round(durationSec)),
    ];
    if (transcript) pyArgs.push('--transcript', transcript.slice(0, 250));

    const res = spawnSync('python3', pyArgs, { encoding: 'utf8', timeout: 10_000 });
    if (res.status === 0 && res.stdout?.trim()) {
      const tracks: LibraryTrack[] = JSON.parse(res.stdout);
      // Pick top-scored track that exists on disk
      for (const t of tracks) {
        if (t.local_path && fs.existsSync(t.local_path)) {
          // Convert absolute path → Remotion staticFile() relative path
          const staticPath = t.local_path.startsWith(PUBLIC_DIR + '/')
            ? t.local_path.slice(PUBLIC_DIR.length + 1)
            : `music/downloads/${path.basename(t.local_path)}`;
          return {
            id: t.id,
            localPath: t.local_path,
            staticPath,
            label: `${t.title} — ${t.artist} [${Math.round(t.score * 100)}%]`,
          };
        }
      }
    }
  } catch { /* fall through to defaults */ }

  // Fallback defaults when library unavailable
  const FALLBACK: Record<string, string> = {
    educational: 'yt--UfI1X-MSig', inspiring: 'yt-znLgt9JIMfI',
    personal: 'yt--UfI1X-MSig',    casual: 'yt--UfI1X-MSig',
    creator: 'yt--UfI1X-MSig',     energetic: 'yt-ZOOmTRUTWUU',
    trending: 'ig-702042042124440', business: 'yt-znLgt9JIMfI',
    authentic: 'yt--UfI1X-MSig',
  };
  const id = FALLBACK[contentMood.toLowerCase()] ?? 'yt--UfI1X-MSig';
  const staticPath = `music/downloads/${id}.mp3`;
  return { id, localPath: path.join(PUBLIC_DIR, staticPath), staticPath, label: `${id} (fallback)` };
}

/** When --music-track CLI override is passed, resolve it via library or hardcoded path. */
function resolveTrackOverride(trackId: string): SelectedMusic {
  const staticPath = `music/downloads/${trackId}.mp3`;
  const localPath  = path.join(PUBLIC_DIR, staticPath);
  return { id: trackId, localPath, staticPath, label: `${trackId} (manual)` };
}

// ─── Smart loudness measurement + auto-duck ───────────────────────────────────

/**
 * Measure integrated loudness (LUFS) of an audio/video file using ffmpeg loudnorm.
 * Returns the measured_I value (integrated loudness). Falls back to a safe default.
 */
function measureLUFS(filePath: string): number {
  try {
    // loudnorm in analysis mode prints JSON stats to stderr
    const output = execSync(
      `ffmpeg -i "${filePath}" -af "loudnorm=I=-24:LRA=7:TP=-2:print_format=json" -f null - 2>&1`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    const jsonMatch = output.match(/\{[^}]*"input_i"\s*:\s*"([^"]+)"[^}]*\}/s);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      const lufs = parseFloat(data.input_i);
      if (isFinite(lufs) && lufs < 0) return lufs;
    }
  } catch {}
  return -23; // safe fallback (typical speech level)
}

/**
 * Given voice and music LUFS values, compute a Remotion-compatible volume
 * multiplier (0–1) that places music desiredGapDb below the voice.
 *
 * Example: voice=-16 LUFS, music=-9 LUFS, gap=14 dB
 *   targetMusicLUFS = -16 - 14 = -30
 *   attenuation     = -9 - (-30) = 21 dB  → clamped to maxDuckDb=20 → 0.100
 */
function computeSmartMusicVolume(
  voiceLUFS: number,
  musicLUFS: number,
  desiredGapDb = 22,   // music sits this many dB below speech
  minDuckDb    = 4,    // never duck less than this (prevents music being too loud)
  maxDuckDb    = 40,   // cap: 10^(-40/20) = 0.01 — subtle but present
): number {
  const targetMusicLUFS = voiceLUFS - desiredGapDb;
  const attenuationDb   = Math.max(minDuckDb, Math.min(maxDuckDb, musicLUFS - targetMusicLUFS));
  const multiplier      = Math.pow(10, -attenuationDb / 20);
  return Math.round(multiplier * 1000) / 1000; // 3 decimal places
}

// ─── Face detection + face-aware crop ────────────────────────────────────────

interface FacePos { x_pct: number; y_pct: number; confidence: number; }

async function detectFacePosition(framePath: string, openai: OpenAI): Promise<FacePos> {
  try {
    const b64 = fs.readFileSync(framePath).toString('base64');
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `Locate the main person's face in this image.
Return ONLY valid JSON (no markdown):
{"face_center_x_pct": 0.5, "face_center_y_pct": 0.35, "confidence": 0.9}
x_pct and y_pct are 0.0-1.0 fractions of image width/height from top-left.
If no face is visible set confidence to 0.` },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}`, detail: 'low' } },
        ],
      }],
      max_tokens: 80,
    });
    const raw = resp.choices[0].message.content ?? '{}';
    const d = JSON.parse(raw.replace(/```json\n?|```/g, '').trim());
    return { x_pct: d.face_center_x_pct ?? 0.5, y_pct: d.face_center_y_pct ?? 0.35, confidence: d.confidence ?? 0 };
  } catch { return { x_pct: 0.5, y_pct: 0.35, confidence: 0 }; }
}

/**
 * Build an ffmpeg vf crop filter that keeps the person's face centered.
 * For landscape → adjust horizontal crop offset.
 * For portrait  → adjust vertical crop offset (when aspect ≠ 9:16).
 */
function buildFaceAwareCropFilter(srcW: number, srcH: number, face: FacePos): string {
  const isPortrait = srcH > srcW;
  const hasConf    = face.confidence > 0.5;

  if (isPortrait) {
    // After scale=1080:?:force_original_aspect_ratio=increase the height can be > 1920
    const scaledH = Math.round(srcH * (1080 / srcW));
    if (hasConf && scaledH > 1920 + 20) {
      const faceY   = Math.round(scaledH * face.y_pct);
      const yOffset = Math.max(0, Math.min(scaledH - 1920, faceY - 600)); // keep face ~1/3 from top
      return `scale=1080:${scaledH}:force_original_aspect_ratio=increase,crop=1080:1920:0:${yOffset}`;
    }
    // Try adjusting horizontal if video is wider than 1080 after scaling
    const scaledW = Math.round(srcW * (1920 / srcH));
    if (hasConf && scaledW > 1080 + 20) {
      const faceX   = Math.round(scaledW * face.x_pct);
      const xOffset = Math.max(0, Math.min(scaledW - 1080, faceX - 540));
      return `scale=${scaledW}:1920:force_original_aspect_ratio=increase,crop=1080:1920:${xOffset}:0`;
    }
    return 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920';
  } else {
    // Landscape: scale height to 1920, then crop width to 1080
    const scaledW = Math.round(srcW * (1920 / srcH));
    if (hasConf && scaledW > 1080 + 20) {
      const faceX   = Math.round(scaledW * face.x_pct);
      const xOffset = Math.max(0, Math.min(scaledW - 1080, faceX - 540));
      return `scale=${scaledW}:1920,crop=1080:1920:${xOffset}:0`;
    }
    return 'scale=-1:1920,crop=1080:1920';
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function httpsPost(url: string, body: unknown, headers: Record<string, string>): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), ...headers },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function httpsPutWithHeaders(url: string, filePath: string, contentType: string, extraHeaders: Record<string, string> = {}): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const fileBuffer = fs.readFileSync(filePath);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'PUT',
      headers: { 'Content-Type': contentType, 'Content-Length': fileBuffer.length, ...extraHeaders },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data }));
    });
    req.on('error', reject);
    req.write(fileBuffer);
    req.end();
  });
}

// ─── Supabase Storage upload ──────────────────────────────────────────────────

async function uploadToSupabase(filePath: string, bucket = 'remotion-renders'): Promise<string> {
  const filename = `iphone-ugc/${Date.now()}-${path.basename(filePath)}`;
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${filename}`;

  const res = await httpsPutWithHeaders(uploadUrl, filePath, 'video/mp4', {
    Authorization: `Bearer ${SUPABASE_KEY}`,
    apikey: SUPABASE_KEY,
  });
  if (res.status >= 300) throw new Error(`Supabase upload failed: ${res.status} ${res.body.slice(0, 200)}`);

  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filename}`;
}

// ─── Blotato post ─────────────────────────────────────────────────────────────

async function uploadToBlotatoMedia(videoUrl: string): Promise<string> {
  const res = await httpsPost('https://backend.blotato.com/v2/media', { url: videoUrl }, {
    'blotato-api-key': BLOTATO_KEY,
  });
  if (res.status >= 300) throw new Error(`Blotato media upload failed: ${res.status} ${res.body.slice(0, 200)}`);
  const data = JSON.parse(res.body);
  return data.url ?? data.mediaUrl ?? videoUrl;
}

async function postViaBlotato(mediaUrl: string, caption: string, acctId: number): Promise<string> {
  const res = await httpsPost('https://backend.blotato.com/v2/posts', {
    post: {
      accountId: String(acctId),
      content: {
        text: caption,
        platform: 'instagram',
        mediaUrls: [mediaUrl],
      },
      target: { targetType: 'instagram' },
    },
  }, { 'blotato-api-key': BLOTATO_KEY });

  if (res.status >= 300) throw new Error(`Blotato post failed: ${res.status} ${res.body.slice(0, 200)}`);
  const data = JSON.parse(res.body);
  return data.postSubmissionId
    ? `https://my.blotato.com (submission: ${data.postSubmissionId})`
    : data.url ?? data.postUrl ?? '(submitted)';
}

// ─── Save brief to Supabase ci_creative_briefs ───────────────────────────────

async function saveBriefToDb(opts: {
  videoSrc: string;
  captionText: string;
  titleText: string;
  titleSubtext: string;
  accentColor: string;
  musicId: string;
  musicVolume: number;
  contentMood: string;
  accountId: number;
  renderOutputPath: string;
  renderOutputUrl: string;
  postUrl: string;
  postSubmissionId: string;
  renderProps: object;
  durationFrames: number;
  status: 'rendered' | 'posted';
}): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;

  const record = {
    brand_id: 'isaiah_personal',
    hook_text: opts.captionText.split('\n')[0]?.slice(0, 200) ?? '',
    caption_text: opts.captionText,
    title_text: opts.titleText,
    title_subtext: opts.titleSubtext,
    accent_color: opts.accentColor,
    music_id: opts.musicId,
    music_volume: opts.musicVolume,
    background_type: 'video',
    platform: 'instagram',
    blotato_account_id: opts.accountId,
    funnel_stage: 'awareness',
    composition_id: 'IPhoneUGCVideo',
    render_props: opts.renderProps,
    render_output_path: opts.renderOutputPath,
    render_output_url: opts.renderOutputUrl,
    duration_frames: opts.durationFrames,
    fps: 30,
    status: opts.status,
    post_url: opts.postUrl || null,
    post_submission_id: opts.postSubmissionId || null,
    posted_at: opts.status === 'posted' ? new Date().toISOString() : null,
  };

  const uploadUrl = `${SUPABASE_URL}/rest/v1/ci_creative_briefs`;
  return new Promise((resolve) => {
    const { request } = require('https') as typeof import('https');
    const body = Buffer.from(JSON.stringify(record));
    const urlObj = require('url').parse(uploadUrl);
    const req = request({
      hostname: urlObj.hostname,
      path: urlObj.path,
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
        'Content-Length': body.length,
      },
    }, (res) => { res.resume(); resolve(); });
    req.on('error', () => resolve());
    req.write(body);
    req.end();
  });
}

// ─── Telegram notification ────────────────────────────────────────────────────

async function sendTelegram(msg: string): Promise<void> {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) { console.log(`   (Telegram not configured, skipping)`); return; }
  await httpsPost(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
    { chat_id: TELEGRAM_CHAT, text: msg, parse_mode: 'Markdown' },
    {}
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// ─── Platform configs — all Isaiah accounts ───────────────────────────────────
// Account IDs from blotato_accounts.md (scraped live 2026-03-24).
// Character targets = 80% of each platform's maximum.

interface PlatformConfig {
  key:        string;   // internal name
  platform:   string;   // Blotato targetType
  accountId:  number;
  maxChars:   number;   // platform hard limit
  targetChars: number;  // 80% target
  hashtagStyle: 'end' | 'inline' | 'none';
  extras?:    Record<string, unknown>; // platform-specific fields
}

const PLATFORM_CONFIGS: PlatformConfig[] = [
  { key: 'instagram', platform: 'instagram', accountId: 807,  maxChars: 2200,  targetChars: 1760, hashtagStyle: 'end'    },
  { key: 'tiktok',    platform: 'tiktok',    accountId: 243,  maxChars: 2200,  targetChars: 1760, hashtagStyle: 'end'    },
  { key: 'youtube',   platform: 'youtube',   accountId: 228,  maxChars: 5000,  targetChars: 4000, hashtagStyle: 'none'   },
  { key: 'twitter',   platform: 'twitter',   accountId: 786,  maxChars: 280,   targetChars: 224,  hashtagStyle: 'inline' },
  { key: 'linkedin',  platform: 'linkedin',  accountId: 173,  maxChars: 3000,  targetChars: 2400, hashtagStyle: 'end'    },
  { key: 'threads',   platform: 'threads',   accountId: 4151, maxChars: 500,   targetChars: 400,  hashtagStyle: 'end'    },
  { key: 'facebook',  platform: 'facebook',  accountId: 228,  maxChars: 63206, targetChars: 400,  hashtagStyle: 'none',
    extras: { pageId: '346276551897190' } },
];

interface PlatformCaptions {
  creator_voice_notes: string;
  instagram:           string;
  tiktok:              string;
  twitter:             string;
  linkedin:            string;
  threads:             string;
  facebook:            string;
  youtube_title:       string;
  youtube_description: string;
}

/**
 * Generate platform-native captions for every platform using GPT-4o.
 * Writes as IF the creator is writing — matches their voice from the transcript.
 * Each caption hits ~80% of the platform's character limit.
 */
async function generateAllPlatformCaptions(
  transcript: string,
  contentMood: string,
  titleText: string,
  frame1b64: string,
  openai: OpenAI,
): Promise<PlatformCaptions> {
  const platformLines = PLATFORM_CONFIGS.map(p => {
    const htStyle = p.hashtagStyle === 'end'
      ? '10-15 hashtags clustered at the end'
      : p.hashtagStyle === 'inline'
      ? 'weave 2-3 hashtags naturally inline'
      : 'no hashtags';
    return `  - ${p.key.toUpperCase()}: MINIMUM ${p.targetChars} characters (target is ${p.targetChars}, max is ${p.maxChars}) — ${htStyle}`;
  }).join('\n');

  const prompt = `You are ghostwriting social media captions for a creator. Write AS THIS EXACT PERSON — mirror their vocabulary, sentence rhythm, energy level, casual/formal register, and any slang or filler words from their transcript. The captions must sound like THEY wrote it, not a marketing agency.

CREATOR'S TRANSCRIPT (their actual spoken words — study this carefully):
"${transcript}"

VIDEO CONTEXT:
- Mood/vibe: ${contentMood}
- Hook/title: "${titleText}"

CRITICAL LENGTH REQUIREMENT — YOU MUST HIT THESE MINIMUMS:
${platformLines}

LENGTH IS NON-NEGOTIABLE. If you write less than the minimum for any platform, you have failed. Expand with:
- Storytelling: What problem does this solve? What's the journey?
- Relatability: "You know that feeling when..." type statements
- Value: 3-5 specific tips or insights drawn from the content
- Social proof / aspiration: paint a before/after
- CTAs: ask questions, invite comments, ask them to share

PLATFORM-SPECIFIC RULES:
- INSTAGRAM: Hook + story (3-4 paragraphs expanding on the topic) + tips list + question CTA + 10-15 hashtags at end
- TIKTOK: Hook + fast-paced relatable content + tips + challenge/CTA + 10-15 hashtags at end
- TWITTER: Punchy hook + 2-3 punchlines in their voice, conversational, weave 1-2 hashtags naturally, HARD max 224 chars
- LINKEDIN: Professional framing of same insight — hook + the "why this matters" + 3-5 bullet takeaways + thought leadership CTA + 3-5 professional hashtags at end
- THREADS: Like texting a friend — casual, fragments OK, 2-3 short punchy paragraphs, 1-2 hashtags
- FACEBOOK: Warm storytelling, personal, no hashtags, invite discussion at end
- YOUTUBE_TITLE: 60-80 chars, SEO optimized, click-worthy, include power word
- YOUTUBE_DESCRIPTION: Long-form — summary paragraph + "In this video:" bullet points + key timestamps (00:00, 00:30, 01:00, etc. — estimate) + "Keywords:" section + CTA to subscribe/comment — minimum 1000 chars

Respond ONLY with a raw JSON object (no markdown code blocks, no explanation):
{
  "creator_voice_notes": "2-3 sentence analysis of their speaking style and personality",
  "instagram": "<minimum ${PLATFORM_CONFIGS.find(p=>p.key==='instagram')?.targetChars} chars>",
  "tiktok": "<minimum ${PLATFORM_CONFIGS.find(p=>p.key==='tiktok')?.targetChars} chars>",
  "twitter": "<max 224 chars>",
  "linkedin": "<minimum ${PLATFORM_CONFIGS.find(p=>p.key==='linkedin')?.targetChars} chars>",
  "threads": "<minimum ${PLATFORM_CONFIGS.find(p=>p.key==='threads')?.targetChars} chars>",
  "facebook": "<minimum 350 chars>",
  "youtube_title": "<60-80 chars>",
  "youtube_description": "<minimum 1000 chars>"
}`;

  log('debug', `Caption prompt chars: ${prompt.length}, image: ${frame1b64 ? 'yes' : 'no'}, transcript len: ${transcript.length}`);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4000,
  });

  const choice = response.choices[0];
  log('debug', `Caption finish_reason: ${choice.finish_reason}`);
  const raw = choice.message.content ?? '{}';
  log('debug', `Caption raw response (first 500): ${raw.slice(0, 500)}`);

  try {
    const parsed = JSON.parse(raw.replace(/```json\n?|```/g, '').trim());
    // Validate we got actual content back
    const hasContent = parsed.instagram?.length > 0 || parsed.tiktok?.length > 0;
    if (!hasContent) {
      log('warn', `GPT-4o returned empty captions — keys: ${Object.keys(parsed).join(', ')}`);
    }
    return {
      creator_voice_notes: parsed.creator_voice_notes ?? '',
      instagram:           parsed.instagram           ?? '',
      tiktok:              parsed.tiktok              ?? '',
      twitter:             parsed.twitter             ?? '',
      linkedin:            parsed.linkedin            ?? '',
      threads:             parsed.threads             ?? '',
      facebook:            parsed.facebook            ?? '',
      youtube_title:       parsed.youtube_title       ?? titleText,
      youtube_description: parsed.youtube_description ?? transcript,
    } as PlatformCaptions;
  } catch (e) {
    log('warn', `Caption JSON parse failed: ${e} — raw: ${raw.slice(0, 200)}`);
    const fallback = transcript.slice(0, 200) + '...';
    return {
      creator_voice_notes: 'Parse failed — using transcript fallback',
      instagram: fallback, tiktok: fallback, twitter: transcript.slice(0, 220),
      linkedin: fallback, threads: fallback, facebook: fallback,
      youtube_title: titleText, youtube_description: transcript,
    };
  }
}

/**
 * Post to a single platform via Blotato v2 API.
 * Uses the verified MPLite payload schema.
 */
async function postToPlatform(
  cfg: PlatformConfig,
  mediaUrl: string,
  caption: string,
  youtubeTitle?: string,
): Promise<{ platform: string; submissionId: string; status: string }> {
  const content: Record<string, unknown> = {
    platform:  cfg.platform,
    text:      caption,
    mediaUrls: [mediaUrl],
  };
  const target: Record<string, unknown> = { targetType: cfg.platform };

  // Platform-specific fields
  if (cfg.platform === 'instagram') {
    target.mediaType = 'reel';
    content.mediaType = 'reel';
  }
  if (cfg.platform === 'tiktok') {
    target.privacyLevel = 'PUBLIC_TO_EVERYONE';
    target.disabledComments = false;
    target.isAiGenerated = false;
  }
  if (cfg.platform === 'youtube') {
    const title = youtubeTitle ?? caption.slice(0, 80);
    target.title = title;
    target.privacyStatus = 'public';
    target.shouldNotifySubscribers = true;
    content.title = title;
  }
  if (cfg.platform === 'facebook') {
    target.pageId  = cfg.extras?.pageId;
    content.pageId = cfg.extras?.pageId;
  }

  const payload = { post: { accountId: cfg.accountId, target, content } };
  const res = await httpsPost('https://backend.blotato.com/v2/posts', payload, {
    'blotato-api-key': BLOTATO_KEY,
  });

  if (res.status >= 300) {
    throw new Error(`${cfg.platform} post failed: ${res.status} ${res.body.slice(0, 200)}`);
  }
  const data = JSON.parse(res.body);
  return {
    platform:     cfg.platform,
    submissionId: data.postSubmissionId ?? data.id ?? '?',
    status:       'submitted',
  };
}

async function main() {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(path.join(PUBLIC_DIR, 'iphone'), { recursive: true });

  console.log(`\n${C.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  iPhone UGC Pipeline — Clean-Stroke Style`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`);
  console.log(`  Source:  ${videoPath}`);
  console.log(`  Account: ${accountId} (Blotato)`);
  console.log(`  OpenAI:  ${OPENAI_KEY ? '✅' : '❌ missing'}`);
  console.log(`  Blotato: ${BLOTATO_KEY ? '✅' : '❌ missing'}`);
  console.log(`  Mode:    ${dryRun ? 'DRY RUN' : noPost ? 'render only (no post)' : 'FULL PIPELINE'}`);

  if (!fs.existsSync(videoPath)) {
    err(`Source video not found: ${videoPath}`);
    process.exit(1);
  }

  // ── Step 0: Raw footage triage gate ───────────────────────────────────────
  // Reject test/accidental/worthless clips before any expensive processing.

  log('🔍 [00]', 'Raw footage triage gate...');
  if (OPENAI_KEY && !dryRun) {
    const { passed, result: triageResult } = await passesContentGate(videoPath, OPENAI_KEY, 0.35);
    const score = (triageResult.scores.media_watchability_score * 100).toFixed(0);
    const intent = (triageResult.scores.intent_to_publish_score * 100).toFixed(0);

    if (!passed) {
      err(`TRIAGE GATE FAILED — clip rejected before pipeline`);
      console.log(`\n  Classification: ${triageResult.classification}`);
      console.log(`  Bin: ${triageResult.bin.toUpperCase()}`);
      console.log(`  Watchability: ${score}%  Intent: ${intent}%`);
      console.log(`  Speech state: ${triageResult.speech_state}`);
      console.log(`  Transcript: "${triageResult.transcript.slice(0, 100)}"`);
      console.log(`  Reasoning:`);
      for (const r of triageResult.reasoning) console.log(`    - ${r}`);
      console.log(`\n  ${C.yellow}Recommended action: ${triageResult.recommended_action}${C.reset}`);
      if (triageResult.salvage_strategy) {
        console.log(`  Salvage: ${triageResult.salvage_strategy}`);
      }
      console.log(`\n  To skip triage and force processing: add --skip-triage`);
      console.log(`  To run batch triage on a directory: npx tsx scripts/triage-iphone-footage.ts --dir /path/to/dir`);
      process.exit(3); // exit code 3 = triage rejected
    }

    ok(`Triage PASSED [${triageResult.bin.toUpperCase()}] watchability=${score}% intent=${intent}%`,
      triageResult.reasoning[0] ?? '');
  } else if (hasFlag('--skip-triage')) {
    ok('Triage gate skipped (--skip-triage)');
  } else {
    ok('Triage gate skipped (no OpenAI key or dry run)');
  }

  // ── Step 1: Probe source video ──────────────────────────────────────────────

  log('📱 [01]', 'Probing source video...');
  const probeOut = execSync(`ffprobe -v quiet -print_format json -show_streams -show_format "${videoPath}"`, { encoding: 'utf8' });
  const probeData = JSON.parse(probeOut);
  const vidStream = probeData.streams.find((s: any) => s.codec_type === 'video');
  const audStream = probeData.streams.find((s: any) => s.codec_type === 'audio');
  const duration  = parseFloat(probeData.format?.duration ?? '0');
  const srcW      = vidStream?.width ?? 0;
  const srcH      = vidStream?.height ?? 0;
  const hasAudio  = !!audStream;

  ok(`${srcW}×${srcH} @ ${duration.toFixed(1)}s | audio: ${hasAudio}`);

  // ── Step 1.5: Detect face position for smart crop ──────────────────────────

  log('👤 [1.5]', 'Detecting face position for smart crop...');
  let facePos: FacePos = { x_pct: 0.5, y_pct: 0.35, confidence: 0 };
  if (OPENAI_KEY && !dryRun) {
    const faceFramePath = path.join(TMP_DIR, `face-frame-${Date.now()}.jpg`);
    const faceSec = Math.max(0.5, duration * 0.1);
    try {
      execSync(`ffmpeg -y -i "${videoPath}" -ss ${faceSec.toFixed(1)} -vframes 1 -q:v 3 "${faceFramePath}" 2>/dev/null`, { stdio: 'pipe' });
      const openai = new OpenAI({ apiKey: OPENAI_KEY });
      facePos = await detectFacePosition(faceFramePath, openai);
      if (facePos.confidence > 0.5) {
        ok(`Face detected: x=${(facePos.x_pct * 100).toFixed(0)}% y=${(facePos.y_pct * 100).toFixed(0)}% (conf=${facePos.confidence.toFixed(2)})`);
      } else {
        ok(`No face detected (conf=${facePos.confidence.toFixed(2)}) — center crop`);
      }
    } catch {
      ok('Face detection failed — center crop');
    }
  } else {
    ok('[skip] Face detection skipped (no key / dry run) — center crop');
  }

  // ── Step 2: Convert to 1080×1920 portrait ──────────────────────────────────

  log('🎨 [02]', 'Converting to 1080×1920 portrait (moody grade)...');
  const convertedPath = path.join(TMP_DIR, `converted-${Date.now()}.mp4`);
  const isPortrait    = srcH > srcW;

  // Face-aware crop keeps the person centered rather than defaulting to center of frame
  const cropFilter = buildFaceAwareCropFilter(srcW, srcH, facePos);

  // Subtle moody grade: slightly desaturated, dark, cinematic
  const gradeFilter = 'eq=saturation=0.85:brightness=-0.04:contrast=1.05:gamma=1.05';

  // Cap at 30s for social (clean-stroke style works best for concise content)
  const clipDuration = Math.min(duration, 30);

  const ffmpegConvert = `ffmpeg -y -i "${videoPath}" -vf "${cropFilter},${gradeFilter}" -c:v h264 -preset fast -crf 22 -c:a aac -b:a 192k -r 30 -t ${clipDuration} "${convertedPath}" 2>/dev/null`;

  if (!dryRun) {
    execSync(ffmpegConvert, { stdio: 'pipe' });
    ok(`Converted → ${convertedPath} (${(fs.statSync(convertedPath).size / 1024 / 1024).toFixed(1)}MB)`);
  } else {
    ok(`[DRY RUN] Would convert with ffmpeg`);
  }

  // ── Step 3: Whisper transcription ──────────────────────────────────────────

  log('🎙️  [03]', 'Transcribing audio with Whisper (word-level timestamps)...');
  let captionText   = '';
  let wordTimestamps: Array<{ word: string; start: number; end: number }> = [];

  if (!skipTranscribe && OPENAI_KEY && hasAudio && !dryRun) {
    // Extract audio first
    const audioPath = path.join(TMP_DIR, 'audio.mp3');
    execSync(`ffmpeg -y -i "${convertedPath}" -vn -acodec mp3 -b:a 128k "${audioPath}" 2>/dev/null`, { stdio: 'pipe' });

    const openai = new OpenAI({ apiKey: OPENAI_KEY });
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath) as any,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word'] as any,
    }) as any;

    captionText    = transcription.text?.trim() ?? '';
    wordTimestamps = (transcription.words ?? []).map((w: any) => ({
      word:  w.word.trim(),
      start: w.start,
      end:   w.end,
    }));
    ok(`Transcription: ${captionText.split(' ').length} words, ${wordTimestamps.length} word timestamps`, captionText.slice(0, 120));
  } else if (skipTranscribe) {
    ok('Transcription skipped (--skip-transcribe)');
  } else if (!OPENAI_KEY) {
    ok('Transcription skipped (no OPENAI_API_KEY)');
  } else if (!hasAudio) {
    ok('No audio track detected in source');
  }

  // ── Step 4: GPT-4o Vision analysis ────────────────────────────────────────

  log('👁️  [04]', 'GPT-4o vision: detect captions/title + analyze content...');

  let hasCaptions  = false;
  let hasTitle     = false;
  let contentMood  = 'personal';
  let titleText    = '';
  let titleSubtext = '';
  let caption      = '';
  let accentColor  = '#38ef7d';  // Isaiah green default
  let f1b64        = '';         // kept for caption generator in step 4.5

  if (OPENAI_KEY && !dryRun) {
    // Extract 2 frames for analysis
    const frame1Path = path.join(TMP_DIR, 'frame1.jpg');
    const frame2Path = path.join(TMP_DIR, 'frame2.jpg');
    execSync(`ffmpeg -y -i "${convertedPath}" -ss 0.5 -vframes 1 -q:v 2 "${frame1Path}" 2>/dev/null`, { stdio: 'pipe' });
    execSync(`ffmpeg -y -i "${convertedPath}" -ss ${(clipDuration * 0.6).toFixed(1)} -vframes 1 -q:v 2 "${frame2Path}" 2>/dev/null`, { stdio: 'pipe' });

    f1b64 = fs.readFileSync(frame1Path).toString('base64');
    const f2b64 = fs.readFileSync(frame2Path).toString('base64');

    const openai = new OpenAI({ apiKey: OPENAI_KEY });
    const analysis = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `Analyze this vertical video (2 frames shown) and respond in JSON only.

Fields:
- hasCaptions: boolean — are there already caption/subtitle overlays burned into the video?
- hasTitle: boolean — is there already a title/hook text overlay at the top of the screen?
- contentMood: one of [educational, inspiring, personal, casual, creator, energetic, trending, business, authentic]
- topic: brief topic description (max 8 words)
- titleText: catchy hook title for the video (max 6 words, UGC-native, no hashtags)
- titleSubtext: optional 2-5 word subtitle or question
- caption: 2-3 sentence caption for Instagram (include 3-5 hashtags at end)
- accentColor: hex color that would complement the video visually (e.g. #38ef7d, #00E5FF, #FFE600)

Transcript of speech: "${captionText || '(none detected)'}"

Respond ONLY with valid JSON, no markdown.` },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${f1b64}`, detail: 'low' } },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${f2b64}`, detail: 'low' } },
        ],
      }],
      max_tokens: 400,
    });

    try {
      const raw = analysis.choices[0].message.content ?? '{}';
      const parsed = JSON.parse(raw.replace(/```json\n?|```/g, '').trim());
      hasCaptions  = parsed.hasCaptions  ?? false;
      hasTitle     = parsed.hasTitle     ?? false;
      contentMood  = parsed.contentMood  ?? 'personal';
      titleText    = parsed.titleText    ?? '';
      titleSubtext = parsed.titleSubtext ?? '';
      caption      = parsed.caption      ?? '';
      accentColor  = parsed.accentColor  ?? '#38ef7d';

      ok(`Detected: hasCaptions=${hasCaptions} hasTitle=${hasTitle} mood=${contentMood}`);
      ok(`Title: "${titleText}" | Sub: "${titleSubtext}"`);
      ok(`Accent: ${accentColor}`);
      console.log(`   Caption: ${C.dim}${caption.slice(0, 100)}...${C.reset}`);
    } catch (e) {
      ok('Vision analysis parse failed — using defaults', String(e));
    }
  } else {
    // Fallback defaults
    titleText    = 'Building in public';
    titleSubtext = 'one step at a time';
    caption      = `${captionText.slice(0, 120)}...

#buildinpublic #aiautomation #solopreneur #creatoreconomy #contentcreator`;
    ok('[DRY RUN or no key] Using fallback title/caption');
  }

  // ── Step 4.5: Generate all-platform captions (if --all-platforms or --preview-captions)
  let platformCaptions: PlatformCaptions | null = null;
  if ((allPlatforms || previewCaptions) && OPENAI_KEY && captionText && !dryRun) {
    log('✍️  [4.5]', 'Generating platform-native captions (voice-matched, 80% max length)...');
    const openai = new OpenAI({ apiKey: OPENAI_KEY });
    platformCaptions = await generateAllPlatformCaptions(captionText, contentMood, titleText, f1b64, openai);
    ok(`Captions generated — creator voice: "${(platformCaptions.creator_voice_notes ?? '').slice(0, 80)}..."`);

    // Always print captions for review
    console.log(`\n${C.bold}  ── Platform Captions Preview ──────────────────────────────────${C.reset}`);
    for (const cfg of PLATFORM_CONFIGS) {
      const text = cfg.key === 'youtube'
        ? `TITLE: ${platformCaptions.youtube_title}\n${platformCaptions.youtube_description}`
        : (platformCaptions as any)[cfg.key] ?? '';
      const pct  = Math.round((text.length / cfg.maxChars) * 100);
      console.log(`\n  ${C.cyan}[${cfg.key.toUpperCase()}]${C.reset} ${text.length} chars (${pct}% of ${cfg.maxChars} max)`);
      console.log(`  ${C.dim}${text.slice(0, 200)}${text.length > 200 ? '...' : ''}${C.reset}`);
    }
    console.log(`\n${C.bold}  ────────────────────────────────────────────────────────────${C.reset}`);
  }

  if (previewCaptions) {
    console.log(`\n  ${C.yellow}--preview-captions: skipping render & post${C.reset}\n`);
    process.exit(0);
  }

  // ── Step 5: Select music via shared MusicLibrary ─────────────────────────

  log('🎵 [05]', `Selecting music for mood: "${contentMood}" via MusicLibrary...`);
  const selectedMusic = musicTrackCli
    ? resolveTrackOverride(musicTrackCli)
    : selectMusicFromLibrary(contentMood, captionText, clipDuration);
  const musicId    = selectedMusic.id;
  const musicFile  = selectedMusic.staticPath;
  const musicPath  = selectedMusic.localPath;
  const musicExists = fs.existsSync(musicPath);
  ok(`Selected: ${selectedMusic.label}`, `${musicFile} | exists: ${musicExists}`);

  // ── Smart auto-duck: measure both tracks and compute the right volume ───────

  let musicVolume: number;
  if (musicVolumeCli !== null) {
    musicVolume = musicVolumeCli;
    ok(`Music volume: ${musicVolume} (manual override)`);
  } else if (musicExists) {
    log('🔊 [05b]', 'Auto-ducking: measuring voice + music loudness...');
    const voiceLUFS = measureLUFS(convertedPath);
    const musicLUFS = measureLUFS(musicPath);
    musicVolume = computeSmartMusicVolume(voiceLUFS, musicLUFS);
    ok(`Voice: ${voiceLUFS.toFixed(1)} LUFS | Music: ${musicLUFS.toFixed(1)} LUFS → volume=${musicVolume} (auto-ducked to sit 22 dB below voice)`);
  } else {
    musicVolume = 0.04;
    ok(`Music volume: ${musicVolume} (default fallback — music file missing)`);
  }

  // ── Step 6: Copy processed video to public/ ────────────────────────────────

  log('📁 [06]', 'Staging video in public/iphone/...');
  const publicVideoFilename = `clip-${Date.now()}.mp4`;
  const publicVideoPath     = path.join(PUBLIC_DIR, 'iphone', publicVideoFilename);
  const videoSrc            = `iphone/${publicVideoFilename}`;

  if (!dryRun) {
    fs.copyFileSync(convertedPath, publicVideoPath);
    ok(`Staged → public/${videoSrc} (${(fs.statSync(publicVideoPath).size / 1024 / 1024).toFixed(1)}MB)`);
  } else {
    ok('[DRY RUN] Would copy to public/iphone/');
  }

  // ── Step 7: Build Remotion props & render ─────────────────────────────────

  log('🎬 [07]', 'Rendering IPhoneUGCVideo...');

  const durationFrames = Math.round(clipDuration * 30);
  const inputProps = {
    videoSrc,
    captionText:    hasCaptions ? '' : (captionText || ''),
    wordTimestamps: hasCaptions ? [] : wordTimestamps,   // real word-level sync
    titleText:      hasTitle    ? '' : titleText,
    titleSubtext:   hasTitle    ? '' : titleSubtext,
    hasCaptions,
    hasTitle,
    accentColor,
    musicFile:      musicFile,
    musicVolume,
    brandId:        'the_isaiah_dupree',
  };

  const outputFilename = `iphone-ugc-${Date.now()}.mp4`;
  const outputPath     = path.join(OUTPUT_DIR, outputFilename);

  console.log(`\n   Props: ${JSON.stringify({ ...inputProps, videoSrc: '(set)', captionText: inputProps.captionText?.slice(0, 40) + '...' }, null, 2)}`);

  if (!dryRun) {
    const result = spawnSync('npx', [
      'remotion', 'render', 'src/index.ts', 'IPhoneUGCVideo', outputPath,
      `--props=${JSON.stringify(inputProps)}`,
      `--duration=${durationFrames}`,
      '--log=error',
    ], { cwd: STUDIO_DIR, stdio: 'pipe', encoding: 'utf8', timeout: 300_000 });

    if (result.status !== 0 || !fs.existsSync(outputPath)) {
      err(`Render failed:\n${result.stderr?.slice(-600)}`);
      process.exit(1);
    }
    const sz = fs.statSync(outputPath).size;
    ok(`Rendered → ${outputPath} (${(sz / 1024 / 1024).toFixed(1)}MB)`);
  } else {
    ok(`[DRY RUN] Would render to ${outputPath}`);
    console.log(`\n✅ Dry run complete.\n`);
    process.exit(0);
  }

  // ── Step 8: Upload + Post ─────────────────────────────────────────────────

  if (noPost) {
    log('📤 [08]', 'Post skipped (--no-post)');
    await saveBriefToDb({
      videoSrc, captionText: caption || captionText, titleText, titleSubtext,
      accentColor, musicId, musicVolume, contentMood, accountId,
      renderOutputPath: outputPath, renderOutputUrl: '',
      postUrl: '', postSubmissionId: '',
      renderProps: inputProps, durationFrames, status: 'rendered',
    });
    console.log(`\n✅ Video ready: ${outputPath}`);
    return;
  }

  if (!BLOTATO_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
    err('Missing BLOTATO_API_KEY or SUPABASE_URL/KEY — skipping post');
    console.log(`\n   Video ready at: ${outputPath}`);
    return;
  }

  log('☁️  [08]', 'Uploading to Supabase Storage...');
  const publicUrl = await uploadToSupabase(outputPath);
  ok(`Public URL: ${publicUrl}`);

  log('📡 [08b]', 'Uploading to Blotato CDN (one upload, all platforms share it)...');
  const mediaUrl = await uploadToBlotatoMedia(publicUrl);
  ok(`Blotato CDN: ${mediaUrl}`);

  // ── Single account OR all platforms ───────────────────────────────────────

  if (allPlatforms && platformCaptions) {
    log('📤 [09]', `Posting to ALL ${PLATFORM_CONFIGS.length} platforms...`);

    const results: Array<{ platform: string; ok: boolean; id: string; error?: string }> = [];

    for (const cfg of PLATFORM_CONFIGS) {
      const text = cfg.key === 'youtube'
        ? platformCaptions.youtube_description
        : (platformCaptions as any)[cfg.key] ?? caption;
      const ytTitle = cfg.key === 'youtube' ? platformCaptions.youtube_title : undefined;

      process.stdout.write(`  → ${cfg.platform.padEnd(10)} (acct ${cfg.accountId}) ... `);
      try {
        const r = await postToPlatform(cfg, mediaUrl, text, ytTitle);
        results.push({ platform: cfg.platform, ok: true, id: r.submissionId });
        console.log(`${C.green}✅ ${r.submissionId}${C.reset}`);
      } catch (e: any) {
        results.push({ platform: cfg.platform, ok: false, id: '', error: e.message });
        console.log(`${C.red}❌ ${e.message?.slice(0, 80)}${C.reset}`);
      }
    }

    // Summary
    const posted  = results.filter(r => r.ok);
    const failed  = results.filter(r => !r.ok);
    console.log(`\n  ${C.bold}Posted: ${posted.length}/${PLATFORM_CONFIGS.length}${C.reset}  Failed: ${failed.length}`);

    // Telegram — one message for all platforms
    const postedLines = posted.map(r => `  ✅ ${r.platform} (${r.id})`).join('\n');
    const failedLines = failed.map(r => `  ❌ ${r.platform}: ${r.error?.slice(0, 60)}`).join('\n');
    await sendTelegram(
`🚀 *Multi-platform post complete!*

🎵 Music: ${musicId} (${contentMood})
📹 Video: ${publicUrl}

${postedLines}${failedLines ? '\n\nFailed:\n' + failedLines : ''}

🎯 *${posted.length}/${PLATFORM_CONFIGS.length} platforms live*`
    );
    ok('Telegram notification sent');

    // Save brief once
    await saveBriefToDb({
      videoSrc, captionText: platformCaptions.instagram, titleText,
      titleSubtext, accentColor, musicId, musicVolume, contentMood,
      accountId: 807,
      renderOutputPath: outputPath, renderOutputUrl: publicUrl,
      postUrl: publicUrl, postSubmissionId: posted.map(r => r.id).join(','),
      renderProps: inputProps, durationFrames, status: 'posted',
    });

  } else {
    // Single account (original behaviour)
    log('📤 [09]', `Posting to Blotato account ${accountId} (Instagram)...`);
    const postCaption = platformCaptions?.instagram
      ?? caption
      ?? `${captionText.slice(0, 200)}\n\n#buildinpublic #aiautomation #solopreneur`;
    const postUrl = await postViaBlotato(mediaUrl, postCaption, accountId);
    ok(`Posted! URL: ${postUrl}`);

    await saveBriefToDb({
      videoSrc, captionText: postCaption, titleText, titleSubtext,
      accentColor, musicId, musicVolume, contentMood, accountId,
      renderOutputPath: outputPath, renderOutputUrl: publicUrl,
      postUrl, postSubmissionId: '',
      renderProps: inputProps, durationFrames, status: 'posted',
    });

    log('📱 [10]', 'Sending Telegram notification...');
    await sendTelegram(
`✅ *New UGC video posted!*

📱 Style: Clean-Stroke + Word-Sync Captions
🎵 Music: ${musicId} (${contentMood})
🎯 Account: ${accountId}
📝 ${(captionText || titleText).slice(0, 120)}...

🔗 [View post](${postUrl})
📹 [Raw video](${publicUrl})`
    );
    ok('Telegram notification sent');

    console.log(`\n${C.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`);
    console.log(`${C.bold}  ✅ Pipeline complete${C.reset}`);
    console.log(`  Output:  ${outputPath}`);
    console.log(`  Posted:  ${postUrl}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  }
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
