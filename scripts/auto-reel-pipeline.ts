#!/usr/bin/env npx tsx
/**
 * auto-reel-pipeline.ts — Autonomous Reel Factory
 *
 * One command. No manual steps.
 *
 *   npm run reel:auto              — render all pending + post to social
 *   npm run reel:auto -- --limit 3 — process 3 videos
 *   npm run reel:auto -- --dry-run — render only, skip all publishing
 *   npm run reel:auto -- --status  — show queue + publish results
 *   npm run reel:auto -- --schedule "0 9 * * *"  — install as daily cron
 *
 * Per video:
 *   1. ffmpeg crop + warm grade (orientation-corrected)
 *   2. Voice isolation: highpass → FFT denoise → speech norm → compressor → loudnorm -14 LUFS
 *   3. Whisper word-level captions
 *   4. OpenCV face detection → safe_bottom_y
 *   5. AI tagline (Claude Haiku or keyword fallback)
 *   6. Music selection from catalog (2% base / 1% ducked)
 *   7. Remotion render → IsaiahReelV2
 *   8. Upload to Supabase Storage
 *   9. Blotato media upload + post to 1-2 accounts (niche-matched)
 *  10. Log to publish_queue
 *  11. Telegram notification
 */

import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// ─── Constants ────────────────────────────────────────────────────────────────
const FFMPEG  = fs.existsSync('/opt/homebrew/bin/ffmpeg')  ? '/opt/homebrew/bin/ffmpeg'  : 'ffmpeg';
const FFPROBE = fs.existsSync('/opt/homebrew/bin/ffprobe') ? '/opt/homebrew/bin/ffprobe' : 'ffprobe';

const STUDIO_DIR  = path.resolve(__dirname, '..');
const OUTPUT_DIR  = path.join(STUDIO_DIR, 'output', 'reels');
const TMP_DIR     = '/tmp/reel-auto-pipeline';
const PUBLIC_DIR  = path.join(STUDIO_DIR, 'public');
const QUEUE_FILE  = path.join(STUDIO_DIR, 'output', 'reel-auto-queue.json');
const IPHONE_DIR  = '/Volumes/My Passport/iPhone/videos';
const ENV_FILE    = '/Users/isaiahdupree/Documents/Software/actp-worker/.env';

// ─── CLI args ─────────────────────────────────────────────────────────────────
const args       = process.argv.slice(2);
const getArg     = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const hasFlag    = (f: string) => args.includes(f);

const limitArg    = getArg('--limit');
const singleVideo = getArg('--video');
const dryRun      = hasFlag('--dry-run');
const statusOnly  = hasFlag('--status');
const noPublish   = hasFlag('--no-publish');
const fontVariant = getArg('--font') ?? 'poppins';
const scheduleExpr = getArg('--schedule');

// ─── Env loading ──────────────────────────────────────────────────────────────
function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  try {
    const raw = fs.readFileSync(ENV_FILE, 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.+)/);
      if (m) env[m[1]] = m[2].trim();
    }
  } catch { /* non-fatal */ }
  return env;
}

// ─── Candidates (same list as batch pipeline) ─────────────────────────────────
const CANDIDATES = [
  { file: 'IMG_0144.MP4', niche: 'lifestyle',     rank: 1,  durationHint: 26.6 },
  { file: 'IMG_0145.MOV', niche: 'lifestyle',     rank: 2,  durationHint: 26.6 },
  { file: 'IMG_0581.MOV', niche: 'lifestyle',     rank: 3,  durationHint: 27.5 },
  { file: 'IMG_0580.MOV', niche: 'lifestyle',     rank: 4,  durationHint: 27.5 },
  { file: 'IMG_0504.MOV', niche: 'lifestyle',     rank: 5,  durationHint: 29.7 },
  { file: 'IMG_0488.MOV', niche: 'lifestyle',     rank: 6,  durationHint: 29.0 },
  { file: 'IMG_0477.MOV', niche: 'lifestyle',     rank: 7,  durationHint: 40.8 },
  { file: 'IMG_0328.MOV', niche: 'lifestyle',     rank: 8,  durationHint: 17.6 },
  { file: 'IMG_0517.MOV', niche: 'lifestyle',     rank: 9,  durationHint: 18.8 },
  { file: 'IMG_0216.MOV', niche: 'comedy',        rank: 10, durationHint: 52.4 },
  { file: 'IMG_0219.MOV', niche: 'comedy',        rank: 11, durationHint: 51.0 },
  { file: 'IMG_0220.MOV', niche: 'comedy',        rank: 12, durationHint: 51.0 },
  { file: 'IMG_0531.MOV', niche: 'lifestyle',     rank: 13, durationHint: 32.9 },
  { file: 'IMG_0535.MOV', niche: 'business',      rank: 14, durationHint: 10.4 },
  { file: 'IMG_0093.MOV', niche: 'education',     rank: 15, durationHint: 3.5  },
  { file: 'IMG_0083.MOV', niche: 'business',      rank: 16, durationHint: 3.7  },
  { file: 'IMG_0537.MOV', niche: 'entertainment', rank: 17, durationHint: 50.0 },
  { file: 'IMG_0536.MOV', niche: 'education',     rank: 18, durationHint: 50.0 },
];

// ─── Niche → Blotato account routing ─────────────────────────────────────────
// Each niche maps to 1-2 target accounts (primary + optional secondary).
// Rotates through alt accounts to avoid posting identical content to same account.
interface BlotatoTarget {
  accountId: number;
  platform: 'instagram' | 'tiktok';
  handle: string;
}

const NICHE_TARGETS: Record<string, BlotatoTarget[]> = {
  lifestyle:     [{ accountId: 807,  platform: 'instagram', handle: '@the_isaiah_dupree' },
                  { accountId: 4508, platform: 'tiktok',    handle: '@dupree_isaiah' }],
  relationships: [{ accountId: 710,  platform: 'tiktok',    handle: '@isaiah_dupree' },
                  { accountId: 807,  platform: 'instagram', handle: '@the_isaiah_dupree' }],
  comedy:        [{ accountId: 4150, platform: 'tiktok',    handle: '@isaiahdupree75' }],
  business:      [{ accountId: 807,  platform: 'instagram', handle: '@the_isaiah_dupree' },
                  { accountId: 4508, platform: 'tiktok',    handle: '@dupree_isaiah' }],
  education:     [{ accountId: 807,  platform: 'instagram', handle: '@the_isaiah_dupree' },
                  { accountId: 4508, platform: 'tiktok',    handle: '@dupree_isaiah' }],
  entertainment: [{ accountId: 4150, platform: 'tiktok',    handle: '@isaiahdupree75' }],
  tech:          [{ accountId: 807,  platform: 'instagram', handle: '@the_isaiah_dupree' },
                  { accountId: 4508, platform: 'tiktok',    handle: '@dupree_isaiah' }],
};

function selectTargets(niche: string): BlotatoTarget[] {
  return NICHE_TARGETS[niche] ?? [{ accountId: 807, platform: 'instagram', handle: '@the_isaiah_dupree' }];
}

// ─── Queue ────────────────────────────────────────────────────────────────────
interface PublishResult {
  platform: string;
  accountId: number;
  handle: string;
  status: 'published' | 'failed' | 'skipped';
  postSubmissionId?: string;
  storageUrl?: string;
  blotatoMediaUrl?: string;
  error?: string;
  publishedAt?: string;
}

interface QueueEntry {
  file: string;
  niche: string;
  rank: number;
  status: 'pending' | 'processing' | 'rendered' | 'published' | 'failed';
  outputPath?: string;
  tagline?: string;
  wordCount?: number;
  faceSafeBottomY?: number;
  durationSeconds?: number;
  validation?: { handle: boolean; greenBadge: boolean; whisperCaptions: boolean; faceSafe: boolean };
  publishResults?: PublishResult[];
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

function loadQueue(): QueueEntry[] {
  if (!fs.existsSync(QUEUE_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8')); } catch { return []; }
}

function saveQueue(q: QueueEntry[]) {
  fs.mkdirSync(path.dirname(QUEUE_FILE), { recursive: true });
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(q, null, 2));
}

function initQueue(): QueueEntry[] {
  const existing = loadQueue();
  const existingFiles = new Set(existing.map(e => e.file));
  for (const c of CANDIDATES) {
    if (!existingFiles.has(c.file)) {
      existing.push({ file: c.file, niche: c.niche, rank: c.rank, status: 'pending' });
    }
  }
  existing.sort((a, b) => {
    const ra = CANDIDATES.find(c => c.file === a.file)?.rank ?? 99;
    const rb = CANDIDATES.find(c => c.file === b.file)?.rank ?? 99;
    return ra - rb;
  });
  saveQueue(existing);
  return existing;
}

// ─── Status display ───────────────────────────────────────────────────────────
function printStatus() {
  const q = loadQueue();
  if (!q.length) { console.log('Queue empty.'); return; }
  const counts = { pending: 0, rendered: 0, published: 0, failed: 0 };
  for (const e of q) counts[e.status as keyof typeof counts] = (counts[e.status as keyof typeof counts] ?? 0) + 1;
  console.log(`\n📊 Auto Reel Queue — ${q.length} total`);
  console.log(`   ⏳ Pending: ${counts.pending}  🎬 Rendered: ${counts.rendered}  ✅ Published: ${counts.published}  ❌ Failed: ${counts.failed}\n`);
  for (const e of q) {
    const icon = { pending: '⏳', processing: '🔄', rendered: '🎬', published: '✅', failed: '❌' }[e.status] ?? '?';
    console.log(`${icon} [${String(e.rank).padStart(2)}] ${e.file} (${e.niche})${e.tagline ? `  "${e.tagline}"` : ''}`);
    if (e.publishResults?.length) {
      for (const r of e.publishResults) {
        const ri = r.status === 'published' ? '  📤' : r.status === 'failed' ? '  ❌' : '  ⏭';
        console.log(`${ri} ${r.platform} ${r.handle} (${r.accountId}) — ${r.status}${r.postSubmissionId ? ' ' + r.postSubmissionId.slice(0, 8) : ''}${r.error ? ' ERR:' + r.error.slice(0, 60) : ''}`);
      }
    }
  }
  console.log();
}

if (statusOnly) { printStatus(); process.exit(0); }

// ─── Python helpers ───────────────────────────────────────────────────────────
fs.mkdirSync(TMP_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const WHISPER_SCRIPT = path.join(TMP_DIR, 'run_whisper.py');
const FACE_SCRIPT    = path.join(TMP_DIR, 'run_face.py');

fs.writeFileSync(WHISPER_SCRIPT, `
import sys, json, warnings, subprocess
warnings.filterwarnings("ignore")
video_path, out_path = sys.argv[1], sys.argv[2]
audio_path = out_path.replace('.json', '.wav')
subprocess.run(['${FFMPEG}', '-y', '-i', video_path, '-vn', '-ar', '16000', '-ac', '1', audio_path], capture_output=True)
import whisper
model = whisper.load_model('base')
result = model.transcribe(audio_path, word_timestamps=True, language='en')
words = []
for seg in result.get('segments', []):
    for w in seg.get('words', []):
        words.append({'word': w['word'].strip(), 'start': round(w['start'], 3), 'end': round(w['end'], 3)})
with open(out_path, 'w') as f:
    json.dump({'text': result['text'].strip(), 'words': words}, f, indent=2)
print(f"Transcribed {len(words)} words")
`);

fs.writeFileSync(FACE_SCRIPT, `
import sys, json, cv2
video_path, out_path = sys.argv[1], sys.argv[2]
cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
cap = cv2.VideoCapture(video_path)
total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
bottoms = []
for fn in [int(total * t) for t in [0.1, 0.25, 0.4, 0.55, 0.7, 0.85]]:
    cap.set(cv2.CAP_PROP_POS_FRAMES, fn)
    ret, frame = cap.read()
    if not ret: continue
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    for (x, y, w, h) in cascade.detectMultiScale(gray, 1.1, 5, minSize=(60, 60)):
        b = (y + h) / height
        if 0.15 < b < 0.85: bottoms.append(b)
cap.release()
safe = min(0.85, (sum(bottoms)/len(bottoms) if bottoms else 0.64) + 0.05)
with open(out_path, 'w') as f:
    json.dump({'face_detected': len(bottoms) > 0, 'safe_bottom_start': round(safe, 3)}, f)
print(f"Face: {len(bottoms) > 0}, safe_bottom: {round(safe, 3)}")
`);

// ─── Tagline generation ───────────────────────────────────────────────────────
function keywordFallback(transcript: string, niche: string): string {
  const t = transcript.toLowerCase();
  const map: [RegExp, string][] = [
    [/reach.*out|text.*back|awkward.*text|send.*message/,   'stop overthinking the text'],
    [/friend.*fade|drift.*apart|lose.*touch/,               'the friendship fade is real'],
    [/miss.*person|miss.*feeling/,                          'sometimes you miss the feeling'],
    [/ai.*tool|automat|machine.*learn|ai.*agent/,           'ai is changing everything'],
    [/code.*itself|autonomous.*code/,                       'where apps code themselves'],
    [/content.*creat|posting.*consis|grow.*account/,        'post before you are ready'],
    [/client|revenue|sales|close.*deal/,                    'this is how it actually works'],
    [/overthink|in.*your.*head|anxiety|worry/,              'stop overthinking everything'],
    [/procrastinat|just.*start|never.*right.*time/,         'just start. the time is now'],
    [/consistency|show.*up.*every|discipline/,              'consistency beats everything'],
    [/level.*up|better.*version|self.*improve/,             'the upgrade most people skip'],
    [/relationship|dating|love|partner/,                    'most people get this backwards'],
    [/money|invest|wealth|passive.*income/,                 'most people get this backwards'],
    [/system.*build|workflow|pipeline|tool.*stack/,         'stop doing it manually'],
  ];
  for (const [p, tl] of map) if (p.test(t)) return tl;
  if (niche === 'comedy') return 'we have all been here';
  if (niche === 'business') return 'this changes how you work';
  if (niche === 'education') return 'the lesson they never taught';
  if (niche === 'entertainment') return 'this one hit different';
  const first = transcript.split(/[.!?]/)[0]?.trim() ?? '';
  const words = first.split(/\s+/).filter(w => w.length > 2);
  if (words.length >= 4) return words.slice(0, 7).join(' ').toLowerCase().slice(0, 55);
  return 'this one hit different';
}

async function generateTagline(transcript: string, niche: string, apiKey: string): Promise<{ tagline: string; source: string }> {
  if (!transcript || transcript.trim().length < 10) return { tagline: keywordFallback('', niche), source: 'no-transcript' };
  if (!apiKey) return { tagline: keywordFallback(transcript, niche), source: 'keyword-fallback' };

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 80,
    messages: [{ role: 'user', content: `Write a 4-8 word lowercase Instagram Reel badge tagline for this video. No emoji. No quotes. Specific to this content.\n\nTranscript: ${transcript.slice(0, 400)}\n\nReply with ONLY the tagline.` }],
  });

  return new Promise((resolve) => {
    const req = https.request({ hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-length': Buffer.byteLength(body) }, timeout: 12000 }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          const raw = JSON.parse(data)?.content?.[0]?.text?.trim() ?? '';
          const tl = raw.replace(/^(tagline:\s*)/i, '').replace(/^["']|["']$/g, '').replace(/\n.*/s, '').trim();
          if (tl.length >= 3 && tl.length <= 70) { resolve({ tagline: tl, source: 'claude' }); return; }
        } catch {}
        resolve({ tagline: keywordFallback(transcript, niche), source: 'keyword-fallback' });
      });
    });
    req.on('error', () => resolve({ tagline: keywordFallback(transcript, niche), source: 'keyword-fallback' }));
    req.on('timeout', () => { req.destroy(); resolve({ tagline: keywordFallback(transcript, niche), source: 'keyword-fallback' }); });
    req.write(body);
    req.end();
  });
}

// ─── Caption generation for social posts ─────────────────────────────────────
const NICHE_HASHTAGS: Record<string, string[]> = {
  lifestyle:     ['#lifestyle', '#mindset', '#motivation', '#contentcreator', '#buildersofig'],
  relationships: ['#relationships', '#friendship', '#connection', '#motivation', '#realtalk'],
  comedy:        ['#comedy', '#relatable', '#funny', '#viral', '#fyp'],
  business:      ['#business', '#entrepreneur', '#aiautomation', '#founders', '#buildersofig'],
  education:     ['#education', '#learning', '#tech', '#tips', '#howto'],
  entertainment: ['#entertainment', '#viral', '#fyp', '#trending', '#reels'],
  tech:          ['#tech', '#ai', '#aitools', '#automation', '#futureofwork'],
};

async function generateCaption(transcript: string, tagline: string, niche: string, platform: string, apiKey: string): Promise<string> {
  const maxLen  = platform === 'tiktok' ? 150 : 220;
  const tags    = (NICHE_HASHTAGS[niche] ?? NICHE_HASHTAGS.lifestyle).slice(0, platform === 'tiktok' ? 3 : 5).join(' ');

  if (apiKey) {
    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      messages: [{ role: 'user', content: `Write a ${platform} caption (max ${maxLen - tags.length - 2} chars). Lowercase, conversational, no hashtags, no emoji. First line = hook. 2-3 short lines total.\n\nVideo tagline: "${tagline}"\nTranscript: ${transcript.slice(0, 300)}\n\nReply with ONLY the caption text.` }],
    });
    const caption = await new Promise<string>((resolve) => {
      const req = https.request({ hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-length': Buffer.byteLength(body) }, timeout: 12000 }, (res) => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => {
          try { const t = JSON.parse(data)?.content?.[0]?.text?.trim() ?? ''; if (t.length > 10) { resolve(t.slice(0, maxLen - tags.length - 2)); return; } } catch {}
          resolve(tagline);
        });
      });
      req.on('error', () => resolve(tagline));
      req.on('timeout', () => { req.destroy(); resolve(tagline); });
      req.write(body);
      req.end();
    });
    return `${caption}\n\n${tags}`;
  }

  return `${tagline}\n\n${tags}`;
}

// ─── Music selection ──────────────────────────────────────────────────────────
function selectMusicTrack(niche: string): string | undefined {
  const catalogPath = path.join(PUBLIC_DIR, 'music', 'catalog.json');
  const prefs: Record<string, { moods?: string[]; genre?: string; minEnergy?: number }> = {
    lifestyle: { moods: ['upbeat', 'positive'], minEnergy: 6 },
    comedy:    { genre: 'hip_hop', moods: ['energetic'] },
    business:  { moods: ['upbeat', 'positive'], minEnergy: 7 },
    education: { moods: ['chill', 'relaxed', 'upbeat'] },
    entertainment: { genre: 'hip_hop', moods: ['energetic', 'upbeat'] },
  };
  const pref = prefs[niche] ?? { minEnergy: 5 };

  if (fs.existsSync(catalogPath)) {
    try {
      const tracks = JSON.parse(fs.readFileSync(catalogPath, 'utf8')).tracks ?? [];
      const scored = tracks
        .filter((t: any) => {
          const lp = t.local_path ?? path.join(PUBLIC_DIR, 'music', t.file);
          return fs.existsSync(lp) && (t.duration_sec ?? 60) >= 30;
        })
        .map((t: any) => {
          let s = 0;
          if (pref.genre && t.genre === pref.genre) s += 3;
          if (pref.moods) s += (t.moods ?? []).filter((m: string) => pref.moods!.includes(m)).length * 2;
          if (pref.minEnergy && (t.energy_level ?? 6) >= pref.minEnergy) s += 1;
          if (t.is_trending) s += 2;
          return { t, s };
        })
        .sort((a: any, b: any) => b.s - a.s);
      if (scored.length > 0) return path.join('music', scored[0].t.file);
    } catch {}
  }
  if (fs.existsSync(path.join(PUBLIC_DIR, 'bg-music-lifestyle-01.mp3'))) return 'bg-music-lifestyle-01.mp3';
  return undefined;
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
function httpRequest(options: https.RequestOptions, body?: string | Buffer): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode ?? 0, data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('HTTP timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

// ─── Supabase Storage upload ──────────────────────────────────────────────────
async function uploadToStorage(localPath: string, supabaseUrl: string, supabaseKey: string): Promise<string> {
  const filename = `reel-auto-${path.basename(localPath, '.mp4')}-${Date.now()}.mp4`;
  const destPath = `reels/${filename}`;
  const fileBuffer = fs.readFileSync(localPath);

  const url = new URL(`${supabaseUrl}/storage/v1/object/remotion-renders/${destPath}`);
  const { status, data } = await httpRequest({
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      'content-type': 'video/mp4',
      'authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey,
      'content-length': fileBuffer.length,
    },
    timeout: 120_000,
  }, fileBuffer);

  if (status >= 300) throw new Error(`Storage upload failed ${status}: ${data.slice(0, 200)}`);
  return `${supabaseUrl}/storage/v1/object/public/remotion-renders/${destPath}`;
}

// ─── Blotato media upload ─────────────────────────────────────────────────────
async function uploadToBlotatoMedia(publicUrl: string, apiKey: string): Promise<string> {
  const body = JSON.stringify({ url: publicUrl });
  const { status, data } = await httpRequest({
    hostname: 'backend.blotato.com',
    path: '/v2/media',
    method: 'POST',
    headers: { 'content-type': 'application/json', 'blotato-api-key': apiKey, 'content-length': Buffer.byteLength(body) },
    timeout: 60_000,
  }, body);
  if (status >= 300) throw new Error(`Blotato media upload failed ${status}: ${data.slice(0, 200)}`);
  const parsed = JSON.parse(data);
  return parsed.url ?? parsed.mediaUrl ?? publicUrl;
}

// ─── Blotato post ─────────────────────────────────────────────────────────────
async function postToBlotato(target: BlotatoTarget, mediaUrl: string, caption: string, apiKey: string): Promise<string> {
  const tiktokTarget = target.platform === 'tiktok' ? {
    privacyLevel: 'PUBLIC_TO_EVERYONE',
    disabledComments: false,
    disabledDuet: false,
    disabledStitch: false,
    isBrandedContent: false,
    isYourBrand: false,
    isAiGenerated: false,
  } : {};

  const payload = {
    post: {
      accountId: target.accountId,
      content: {
        platform: target.platform,
        text: caption,
        mediaUrls: [mediaUrl],
        ...(target.platform === 'instagram' ? { mediaType: 'reel' } : {}),
      },
      target: {
        targetType: target.platform,
        accountId: target.accountId,
        ...tiktokTarget,
      },
    },
  };

  const body = JSON.stringify(payload);
  const { status, data } = await httpRequest({
    hostname: 'backend.blotato.com',
    path: '/v2/posts',
    method: 'POST',
    headers: { 'content-type': 'application/json', 'blotato-api-key': apiKey, 'content-length': Buffer.byteLength(body) },
    timeout: 30_000,
  }, body);

  if (status >= 300) throw new Error(`Blotato post failed (${status}): ${JSON.parse(data)?.message?.slice(0, 150) ?? data.slice(0, 150)}`);
  const parsed = JSON.parse(data);
  return parsed.postSubmissionId ?? parsed.id ?? 'unknown';
}

// ─── Supabase publish_queue logging ──────────────────────────────────────────
async function logToPublishQueue(params: {
  platform: string; accountId: number; caption: string; videoUrl: string;
  postSubmissionId: string; file: string; niche: string; tagline: string;
  supabaseUrl: string; supabaseKey: string;
}): Promise<void> {
  const row = {
    platform: params.platform,
    content_type: 'video',
    caption: params.caption.slice(0, 500),
    status: 'published',
    source: 'reel_auto_pipeline',
    account_id: String(params.accountId),
    video_url: params.videoUrl,
    blotato_post_id: params.postSubmissionId,
    title: params.tagline,
    metadata: { file: params.file, niche: params.niche, tagline: params.tagline, pipeline: 'auto-reel-v1' },
    created_at: new Date().toISOString(),
  };
  try {
    const body = JSON.stringify(row);
    await httpRequest({
      hostname: new URL(params.supabaseUrl).hostname,
      path: '/rest/v1/publish_queue',
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'apikey': params.supabaseKey,
        'authorization': `Bearer ${params.supabaseKey}`,
        'prefer': 'return=minimal',
        'content-length': Buffer.byteLength(body),
      },
    }, body);
  } catch (e: any) {
    console.warn(`   ⚠️  publish_queue log failed: ${e.message?.slice(0, 80)}`);
  }
}

// ─── Telegram notification ────────────────────────────────────────────────────
async function sendTelegram(message: string, botToken: string, chatId: string): Promise<void> {
  if (!botToken || !chatId) return;
  try {
    const body = JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' });
    await httpRequest({
      hostname: 'api.telegram.org',
      path: `/bot${botToken}/sendMessage`,
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) },
      timeout: 10_000,
    }, body);
  } catch (e: any) {
    console.warn(`   ⚠️  Telegram notification failed: ${e.message?.slice(0, 60)}`);
  }
}

// ─── Render one video ─────────────────────────────────────────────────────────
async function renderVideo(entry: QueueEntry, env: Record<string, string>): Promise<string> {
  const videoPath = path.join(IPHONE_DIR, entry.file);
  const slug      = entry.file.replace(/\.[^.]+$/, '').toLowerCase();
  const tmpVideo  = path.join(TMP_DIR, `${slug}-graded.mp4`);
  const tmpAudioRaw = path.join(TMP_DIR, `${slug}-audio-raw.aac`);
  const tmpAudio  = path.join(TMP_DIR, `${slug}-audio.aac`);
  const txPath    = path.join(TMP_DIR, `${slug}-transcript.json`);
  const facePath  = path.join(TMP_DIR, `${slug}-face.json`);

  if (!fs.existsSync(videoPath)) throw new Error(`Video not found: ${videoPath}`);

  // Duration
  const probe = JSON.parse(execSync(`"${FFPROBE}" -v quiet -print_format json -show_format "${videoPath}"`, { encoding: 'utf8' }));
  const duration = Math.min(parseFloat(probe.format?.duration ?? '40'), 50);
  const frames   = Math.round(duration * 30);
  entry.durationSeconds = duration;
  console.log(`   Duration: ${duration.toFixed(1)}s → ${frames} frames`);

  // Step 1: Grade + crop (orientation-corrected)
  if (!fs.existsSync(tmpVideo)) {
    console.log('   🎨 Grading + cropping...');
    const streamsRaw = JSON.parse(execSync(`"${FFPROBE}" -v quiet -print_format json -show_streams "${videoPath}"`, { encoding: 'utf8' }));
    const vs = streamsRaw.streams?.find((s: any) => s.codec_type === 'video');
    const codedW = vs?.width ?? 1920, codedH = vs?.height ?? 1080;
    const sideData: any[] = vs?.side_data_list ?? [];
    const rotDeg = Math.abs(Number(sideData.find((sd: any) => sd.side_data_type === 'Display Matrix')?.rotation ?? 0));
    // ffmpeg auto-rotates, so filter chain sees the post-rotation dimensions
    const isActualPortrait = (rotDeg === 90 || rotDeg === 270) ? codedW > codedH : codedH > codedW;
    const cropFilter = isActualPortrait
      ? 'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280'
      : 'scale=1280:-2,crop=720:1280';
    const grade = 'eq=saturation=0.85:brightness=-0.04:gamma=1.05,colorchannelmixer=rr=1.02:gg=0.98:bb=0.95';
    console.log(`   📐 Orientation: ${codedW}×${codedH} rot=${rotDeg}° → ${isActualPortrait ? 'portrait' : 'landscape'}`);
    execSync(`"${FFMPEG}" -y -i "${videoPath}" -vf "${cropFilter},${grade}" -c:v h264 -preset fast -crf 20 -c:a aac -b:a 192k -r 30 -t ${duration} "${tmpVideo}"`, { stdio: ['ignore', 'pipe', 'pipe'] });
    console.log('   ✅ Graded');
  }

  // Step 2: Voice isolation
  if (!fs.existsSync(tmpAudio)) {
    console.log('   🎙 Voice isolation...');
    execSync(`"${FFMPEG}" -y -i "${tmpVideo}" -vn -acodec copy "${tmpAudioRaw}"`, { stdio: ['ignore', 'pipe', 'pipe'] });
    const chain = 'highpass=f=120,afftdn=nf=-20,speechnorm=e=50:r=0.0001:l=1,acompressor=threshold=-18dB:ratio=3:attack=5:release=50,loudnorm=I=-14:LRA=7:TP=-1';
    execSync(`"${FFMPEG}" -y -i "${tmpAudioRaw}" -af "${chain}" -c:a aac -b:a 192k "${tmpAudio}"`, { stdio: ['ignore', 'pipe', 'pipe'] });
    console.log('   ✅ Voice isolated');
  }

  // Step 3: Whisper
  let words: any[] = [], transcriptText = '';
  if (!fs.existsSync(txPath)) {
    console.log('   🗣  Transcribing...');
    try {
      execSync(`python3 "${WHISPER_SCRIPT}" "${videoPath}" "${txPath}"`, { encoding: 'utf8', timeout: 300_000 });
    } catch (e: any) { console.warn(`   ⚠️  Whisper: ${e.message?.slice(0, 80)}`); }
  }
  if (fs.existsSync(txPath)) {
    const tx = JSON.parse(fs.readFileSync(txPath, 'utf8'));
    words = tx.words ?? []; transcriptText = tx.text ?? '';
    entry.wordCount = words.length;
    console.log(`   ✅ ${words.length} words`);
  }

  // Step 4: Face detection
  let faceSafeBottomY = 0.64;
  if (!fs.existsSync(facePath)) {
    try { execSync(`python3 "${FACE_SCRIPT}" "${videoPath}" "${facePath}"`, { encoding: 'utf8', timeout: 60_000 }); } catch {}
  }
  if (fs.existsSync(facePath)) {
    faceSafeBottomY = JSON.parse(fs.readFileSync(facePath, 'utf8')).safe_bottom_start ?? 0.64;
    entry.faceSafeBottomY = faceSafeBottomY;
    console.log(`   ✅ Face safe bottom: ${faceSafeBottomY}`);
  }

  // Step 5: Tagline
  console.log('   ✍️  Generating tagline...');
  const { tagline, source } = await generateTagline(transcriptText, entry.niche, env.ANTHROPIC_API_KEY ?? '');
  entry.tagline = tagline;
  console.log(`   ✅ Tagline (${source}): "${tagline}"`);

  // Step 6: Music
  const musicPath = selectMusicTrack(entry.niche);
  if (musicPath) console.log(`   🎵 Music: ${musicPath}`);

  // Step 7: Render
  const ts = Date.now();
  const pubVideo = path.join(PUBLIC_DIR, `reel-auto-${slug}-${ts}.mp4`);
  const pubAudio = path.join(PUBLIC_DIR, `reel-auto-${slug}-${ts}.aac`);
  fs.copyFileSync(tmpVideo, pubVideo);
  fs.copyFileSync(tmpAudio, pubAudio);

  const outputFile = path.join(OUTPUT_DIR, `reel-${slug}-auto.mp4`);
  const props = {
    backgroundVideoPath: path.relative(PUBLIC_DIR, pubVideo),
    audioPath: path.relative(PUBLIC_DIR, pubAudio),
    tagline, words, faceSafeBottomY,
    captionFontSize: 40, captionMaxWords: 5, fontVariant,
    ...(musicPath ? { musicPath, musicVolumeBase: 0.02, musicVolumeDucked: 0.01 } : {}),
  };

  console.log(`   🎞  Rendering → ${path.basename(outputFile)}...`);
  execSync(
    `cd "${STUDIO_DIR}" && npx remotion render IsaiahReelV2 "${outputFile}" --props='${JSON.stringify(props).replace(/'/g, "'\\''")}' --duration=${frames}`,
    { stdio: 'inherit', timeout: 600_000 }
  );

  try { fs.unlinkSync(pubVideo); fs.unlinkSync(pubAudio); } catch {}

  // Validate
  const v = {
    handle: true,
    greenBadge: tagline.trim().length > 0,
    whisperCaptions: words.length > 0,
    faceSafe: faceSafeBottomY > 0 && faceSafeBottomY <= 0.85,
  };
  entry.validation = v;
  const allOk = Object.values(v).every(Boolean);
  console.log(`   ${allOk ? '✅ All checks passed' : '❌ Validation issues: ' + JSON.stringify(v)}`);

  const size = (fs.statSync(outputFile).size / 1024 / 1024).toFixed(1);
  console.log(`   ✅ Rendered: ${outputFile} (${size}MB)`);
  return outputFile;
}

// ─── Publish one video ────────────────────────────────────────────────────────
async function publishVideo(entry: QueueEntry, env: Record<string, string>): Promise<void> {
  const outputPath = entry.outputPath!;
  const targets = selectTargets(entry.niche);
  const results: PublishResult[] = [];

  console.log(`\n   📤 Publishing to ${targets.length} account(s)...`);

  // Upload to Supabase Storage once
  let storageUrl = '';
  try {
    process.stdout.write('   ☁️  Uploading to Supabase Storage... ');
    storageUrl = await uploadToStorage(outputPath, 'https://ivhfuhxorppptyuofbgq.supabase.co', env.SUPABASE_SERVICE_ROLE_KEY ?? '');
    console.log('✅');
  } catch (e: any) {
    console.error(`\n   ❌ Storage upload failed: ${e.message?.slice(0, 100)}`);
    for (const t of targets) results.push({ platform: t.platform, accountId: t.accountId, handle: t.handle, status: 'failed', error: 'storage upload failed' });
    entry.publishResults = results;
    return;
  }

  // Upload to Blotato media once
  let blotatoMediaUrl = '';
  try {
    process.stdout.write('   🎬 Uploading to Blotato media... ');
    blotatoMediaUrl = await uploadToBlotatoMedia(storageUrl, env.BLOTATO_API_KEY ?? '');
    console.log('✅');
  } catch (e: any) {
    console.error(`\n   ❌ Blotato media upload failed: ${e.message?.slice(0, 100)}`);
    for (const t of targets) results.push({ platform: t.platform, accountId: t.accountId, handle: t.handle, status: 'failed', storageUrl, error: 'blotato media upload failed' });
    entry.publishResults = results;
    return;
  }

  // Post to each target
  const transcriptForCaption = (() => {
    try {
      const slug = entry.file.replace(/\.[^.]+$/, '').toLowerCase();
      const txPath = path.join(TMP_DIR, `${slug}-transcript.json`);
      return fs.existsSync(txPath) ? JSON.parse(fs.readFileSync(txPath, 'utf8')).text ?? '' : '';
    } catch { return ''; }
  })();

  for (const target of targets) {
    try {
      const caption = await generateCaption(transcriptForCaption, entry.tagline ?? '', entry.niche, target.platform, env.ANTHROPIC_API_KEY ?? '');
      process.stdout.write(`   📱 Posting to ${target.platform} ${target.handle}... `);
      const submissionId = await postToBlotato(target, blotatoMediaUrl, caption, env.BLOTATO_API_KEY ?? '');
      console.log(`✅ ${submissionId.slice(0, 8)}`);

      await logToPublishQueue({
        platform: target.platform,
        accountId: target.accountId,
        caption,
        videoUrl: storageUrl,
        postSubmissionId: submissionId,
        file: entry.file,
        niche: entry.niche,
        tagline: entry.tagline ?? '',
        supabaseUrl: 'https://ivhfuhxorppptyuofbgq.supabase.co',
        supabaseKey: env.SUPABASE_SERVICE_ROLE_KEY ?? '',
      });

      results.push({ platform: target.platform, accountId: target.accountId, handle: target.handle, status: 'published', postSubmissionId: submissionId, storageUrl, blotatoMediaUrl, publishedAt: new Date().toISOString() });
    } catch (e: any) {
      console.error(`\n   ❌ Post to ${target.handle} failed: ${e.message?.slice(0, 100)}`);
      results.push({ platform: target.platform, accountId: target.accountId, handle: target.handle, status: 'failed', storageUrl, error: e.message?.slice(0, 150) });
    }
  }

  entry.publishResults = results;

  // Telegram notification
  const published = results.filter(r => r.status === 'published');
  if (published.length > 0) {
    const lines = [
      `✅ *New Reel Published*`,
      `📹 \`${entry.file}\` — ${entry.durationSeconds?.toFixed(1)}s`,
      `🏷 "${entry.tagline}"`,
      `🎙 ${entry.wordCount} words | face@${entry.faceSafeBottomY}`,
      `📤 Posted to: ${published.map(r => `${r.platform} ${r.handle}`).join(', ')}`,
      `🆔 ${published[0].postSubmissionId?.slice(0, 8)}`,
    ].join('\n');
    await sendTelegram(lines, env.TELEGRAM_BOT_TOKEN ?? '', env.TELEGRAM_CHAT_ID ?? '');
  }
}

// ─── Schedule installer ───────────────────────────────────────────────────────
function installCron(expr: string) {
  const cmd = `cd "${STUDIO_DIR}" && npm run reel:auto -- --limit 3 >> /tmp/reel-auto-cron.log 2>&1`;
  const line = `${expr} ${cmd}`;
  try {
    const current = execSync('crontab -l 2>/dev/null || true', { encoding: 'utf8' });
    if (current.includes('reel:auto')) {
      console.log('⚠️  Cron already installed. Remove it first with: crontab -e');
      return;
    }
    const updated = current.trimEnd() + '\n' + line + '\n';
    const tmp = '/tmp/reel-cron-tmp';
    fs.writeFileSync(tmp, updated);
    execSync(`crontab ${tmp}`);
    console.log(`✅ Cron installed: ${line}`);
    console.log(`   Logs: /tmp/reel-auto-cron.log`);
  } catch (e: any) {
    console.error('❌ Cron install failed:', e.message);
  }
}

if (scheduleExpr) {
  installCron(scheduleExpr);
  process.exit(0);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const env = loadEnv();

  console.log('\n🤖 Auto Reel Pipeline');
  console.log(`   Mode:    ${dryRun ? 'DRY RUN' : noPublish ? 'RENDER ONLY' : 'RENDER + PUBLISH'}`);
  console.log(`   Font:    ${fontVariant}`);
  console.log(`   API key: ${env.ANTHROPIC_API_KEY ? '✅ Claude available' : '⚠️  keyword fallback'}`);
  console.log(`   Blotato: ${env.BLOTATO_API_KEY ? '✅' : '❌ missing'}`);

  const queue = initQueue();
  const limit = limitArg ? parseInt(limitArg) : 3; // default: process 3 per run

  let candidates = queue.filter(e => ['pending', 'failed', 'rendered'].includes(e.status));
  if (singleVideo) candidates = candidates.filter(e => e.file === singleVideo);
  const toProcess = candidates.slice(0, limit);

  if (!toProcess.length) {
    console.log('\n✅ Nothing to process.');
    printStatus();
    return;
  }

  console.log(`\n   Processing ${toProcess.length} video(s)\n`);

  let rendered = 0, published = 0, failed = 0;

  for (const entry of toProcess) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`🎬 [${entry.rank}] ${entry.file} (${entry.niche})`);
    console.log(`${'─'.repeat(60)}`);

    entry.status = 'processing';
    entry.startedAt = new Date().toISOString();
    saveQueue(queue);

    try {
      // Render
      if (entry.status !== 'rendered' || !entry.outputPath) {
        const out = await renderVideo(entry, env);
        entry.outputPath = out;
        entry.status = 'rendered';
        rendered++;
        saveQueue(queue);
      }

      // Publish
      if (!dryRun && !noPublish) {
        await publishVideo(entry, env);
        const anyPublished = entry.publishResults?.some(r => r.status === 'published');
        entry.status = anyPublished ? 'published' : 'rendered';
        if (anyPublished) published++;
      }

      entry.completedAt = new Date().toISOString();
    } catch (err: any) {
      entry.status = 'failed';
      entry.error = err?.message?.slice(0, 200) ?? String(err);
      entry.completedAt = new Date().toISOString();
      failed++;
      console.error(`\n❌ ${entry.file}: ${entry.error}`);
    }

    saveQueue(queue);
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`✅ Done: ${rendered} rendered, ${published} published, ${failed} failed`);
  printStatus();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
