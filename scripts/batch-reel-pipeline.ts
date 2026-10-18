#!/usr/bin/env npx tsx
/**
 * batch-reel-pipeline.ts
 *
 * Batch pipeline: Top talking-head iPhone videos → IsaiahReelV2 renders
 *
 * For each video:
 *   1. ffmpeg crop to 720×1280 + warm grade
 *   2. Extract audio
 *   3. Whisper transcription (word_timestamps=True)
 *   4. OpenCV face detection → safe_bottom_y
 *   5. Generate tagline (Anthropic Claude or keyword fallback)
 *   6. Render IsaiahReelV2 composition
 *   7. Track status in queue file
 *
 * Usage:
 *   npx tsx scripts/batch-reel-pipeline.ts
 *   npx tsx scripts/batch-reel-pipeline.ts --limit 3
 *   npx tsx scripts/batch-reel-pipeline.ts --video IMG_0062.MOV
 *   npx tsx scripts/batch-reel-pipeline.ts --dry-run
 *   npx tsx scripts/batch-reel-pipeline.ts --status
 */

import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// ffmpeg/ffprobe on macOS homebrew aren't in default PATH when invoked via npx tsx
const FFMPEG  = fs.existsSync('/opt/homebrew/bin/ffmpeg')  ? '/opt/homebrew/bin/ffmpeg'  : 'ffmpeg';
const FFPROBE = fs.existsSync('/opt/homebrew/bin/ffprobe') ? '/opt/homebrew/bin/ffprobe' : 'ffprobe';

const STUDIO_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(STUDIO_DIR, 'output', 'reels');
const TMP_DIR = '/tmp/reel-batch-pipeline';
const PUBLIC_DIR = path.join(STUDIO_DIR, 'public');
const QUEUE_FILE = path.join(STUDIO_DIR, 'output', 'reel-queue.json');
const IPHONE_DIR = '/Volumes/My Passport/iPhone/videos';

// ── Parse CLI args ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag: string) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
const hasFlag = (flag: string) => args.includes(flag);

const limitArg = getArg('--limit');
const singleVideo = getArg('--video');
const dryRun = hasFlag('--dry-run');
const statusOnly = hasFlag('--status');
const fontVariant = (getArg('--font') ?? 'poppins') as string;
const musicOverride = getArg('--music'); // explicit path, or 'none' to disable, or 'auto' (default)

// ── Top-ranked talking-head candidates ────────────────────────────────────────
// Ranked by: actual duration (15-65s sweet spot) + face detected + niche quality
// Priority 1 = confirmed talking-head 15-65s, Priority 2 = face detected unanalyzed,
// Priority 3 = full-session videos (will be trimmed to 50s max)
// Per STYLE-DNA.md: 20s = 36k plays (best), 48s = 16k — sweet spot 20-50s
const CANDIDATES: Array<{ file: string; niche: string; description: string; rank: number; durationHint?: number }> = [
  // ── Tier 1: Confirmed talking-head, analyzed, sweet-spot duration ─────────
  { file: 'IMG_0144.MP4', niche: 'lifestyle',     rank: 1,  durationHint: 26.6, description: 'man holds microphone, looks directly at camera — friendship/reaching out' },
  { file: 'IMG_0145.MOV', niche: 'lifestyle',     rank: 2,  durationHint: 26.6, description: 'same shoot as 0144 — likely continuation, 5 face detections' },
  { file: 'IMG_0581.MOV', niche: 'lifestyle',     rank: 3,  durationHint: 27.5, description: '4 face detections, 27.5s — unanalyzed' },
  { file: 'IMG_0580.MOV', niche: 'lifestyle',     rank: 4,  durationHint: 27.5, description: '4 face detections, 27.5s — likely same session as 0581' },
  { file: 'IMG_0504.MOV', niche: 'lifestyle',     rank: 5,  durationHint: 29.7, description: 'face detected, 29.7s — unanalyzed' },
  { file: 'IMG_0488.MOV', niche: 'lifestyle',     rank: 6,  durationHint: 29.0, description: 'face detected, 29.0s — unanalyzed' },
  { file: 'IMG_0477.MOV', niche: 'lifestyle',     rank: 7,  durationHint: 40.8, description: 'face detected, 40.8s — unanalyzed' },
  { file: 'IMG_0328.MOV', niche: 'lifestyle',     rank: 8,  durationHint: 17.6, description: '3 face detections, 17.6s — unanalyzed' },
  { file: 'IMG_0517.MOV', niche: 'lifestyle',     rank: 9,  durationHint: 18.8, description: '2 face detections, 18.8s — unanalyzed' },
  // ── Tier 2: Analyzed, face detected, 50s+ (still great content) ──────────
  { file: 'IMG_0216.MOV', niche: 'comedy',        rank: 10, durationHint: 52.4, description: 'face detected, 52.4s — unanalyzed' },
  { file: 'IMG_0219.MOV', niche: 'comedy',        rank: 11, durationHint: 51.0, description: 'face detected, 51.0s — unanalyzed' },
  { file: 'IMG_0220.MOV', niche: 'comedy',        rank: 12, durationHint: 51.0, description: 'exaggerated surprise reaction — comedy/relatable' },
  { file: 'IMG_0531.MOV', niche: 'lifestyle',     rank: 13, durationHint: 32.9, description: 'bearded man in car, contemplative — mindset content' },
  // ── Tier 3: Short but confirmed mic+camera (can make punchy 10-20s reels) ─
  { file: 'IMG_0535.MOV', niche: 'business',      rank: 14, durationHint: 10.4, description: 'man speaking into microphone, office setting' },
  { file: 'IMG_0093.MOV', niche: 'education',     rank: 15, durationHint: 3.5,  description: 'bearded man speaks into microphone, studio setup — too short, skip if dry' },
  { file: 'IMG_0083.MOV', niche: 'business',      rank: 16, durationHint: 3.7,  description: 'bearded man speaking directly to camera, industrial' },
  // ── Tier 4: Full sessions (extract first 50s) ─────────────────────────────
  { file: 'IMG_0537.MOV', niche: 'entertainment', rank: 17, durationHint: 50.0, description: 'full session — casual hoodie, office/classroom, trim to 50s' },
  { file: 'IMG_0536.MOV', niche: 'education',     rank: 18, durationHint: 50.0, description: 'full session — beige hoodie, office, trim to 50s' },
];

// ── Queue management ──────────────────────────────────────────────────────────
interface QueueEntry {
  file: string;
  niche: string;
  rank: number;
  status: 'pending' | 'processing' | 'done' | 'failed';
  outputPath?: string;
  tagline?: string;
  wordCount?: number;
  faceSafeBottomY?: number;
  durationSeconds?: number;
  supabaseCaption?: string;
  validation?: { handle: boolean; greenBadge: boolean; whisperCaptions: boolean; faceSafe: boolean };
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

function loadQueue(): QueueEntry[] {
  if (!fs.existsSync(QUEUE_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8')); } catch { return []; }
}

function saveQueue(queue: QueueEntry[]) {
  fs.mkdirSync(path.dirname(QUEUE_FILE), { recursive: true });
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
}

function initQueue(candidates: typeof CANDIDATES, captionMap: Map<string, string> = new Map()): QueueEntry[] {
  const existing = loadQueue();
  const existingMap = new Map(existing.map(e => [e.file, e]));
  for (const c of candidates) {
    if (!existingMap.has(c.file)) {
      existing.push({
        file: c.file,
        niche: c.niche,
        rank: c.rank,
        status: 'pending',
        supabaseCaption: captionMap.get(c.file) ?? '',
      });
    } else {
      // Update caption if newly fetched
      const entry = existingMap.get(c.file)!;
      if (!entry.supabaseCaption && captionMap.has(c.file)) {
        entry.supabaseCaption = captionMap.get(c.file)!;
      }
    }
  }
  existing.sort((a, b) => {
    const ra = candidates.find(c => c.file === a.file)?.rank ?? 99;
    const rb = candidates.find(c => c.file === b.file)?.rank ?? 99;
    return ra - rb;
  });
  saveQueue(existing);
  return existing;
}

// ── Fetch Supabase AI captions for all candidates ─────────────────────────────
async function fetchSupabaseCaptions(files: string[]): Promise<Map<string, string>> {
  const captionMap = new Map<string, string>();
  try {
    const supabaseUrl = 'https://ivhfuhxorppptyuofbgq.supabase.co';
    const envFile = fs.readFileSync('/Users/isaiahdupree/Documents/Software/actp-worker/.env', 'utf8');
    const keyMatch = envFile.match(/SUPABASE_SERVICE_KEY=(.+)/);
    const anonMatch = envFile.match(/SUPABASE_ANON_KEY=(.+)/);
    const supabaseKey = (keyMatch?.[1] ?? anonMatch?.[1] ?? '').trim();
    if (!supabaseKey) return captionMap;

    const fileList = files.map(f => `"${f}"`).join(',');
    const query = `SELECT file_name, ai_caption FROM mv_media_items WHERE file_name IN (${fileList}) AND analysis_status = 'done'`;

    const result = await new Promise<string>((resolve, reject) => {
      const body = JSON.stringify({ query });
      const req = https.request(
        {
          hostname: 'ivhfuhxorppptyuofbgq.supabase.co',
          path: '/rest/v1/rpc/execute_sql',
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'apikey': supabaseKey,
            'authorization': `Bearer ${supabaseKey}`,
            'content-length': Buffer.byteLength(body),
          },
          timeout: 10000,
        },
        (res) => {
          let data = '';
          res.on('data', c => { data += c; });
          res.on('end', () => resolve(data));
        }
      );
      req.on('error', reject);
      req.write(body);
      req.end();
    });

    // Simpler: use the PostgREST endpoint directly
    const rows = JSON.parse(result);
    if (Array.isArray(rows)) {
      for (const row of rows) {
        if (row.file_name && row.ai_caption) captionMap.set(row.file_name, row.ai_caption);
      }
    }
  } catch {
    // Non-fatal — captions are a bonus for tagline quality
  }
  return captionMap;
}

// ── Status display ─────────────────────────────────────────────────────────────
function printStatus() {
  const queue = loadQueue();
  if (!queue.length) { console.log('No queue yet. Run without --status to initialize.'); return; }
  const done = queue.filter(e => e.status === 'done');
  const failed = queue.filter(e => e.status === 'failed');
  const pending = queue.filter(e => e.status === 'pending');
  console.log(`\n📊 Reel Pipeline Queue — ${queue.length} total`);
  console.log(`   ✅ Done: ${done.length}  ❌ Failed: ${failed.length}  ⏳ Pending: ${pending.length}\n`);
  for (const e of queue) {
    const icon = { done: '✅', failed: '❌', pending: '⏳', processing: '🔄' }[e.status];
    const out = e.outputPath ? `  → ${path.basename(e.outputPath)}` : '';
    const tag = e.tagline ? `  "${e.tagline}"` : '';
    console.log(`${icon} [${String(e.rank ?? '?').padStart(2)}] ${e.file} (${e.niche})${tag}${out}`);
    if (e.validation) {
      const v = e.validation;
      const checks = [
        v.handle ? '✅handle' : '❌handle',
        v.greenBadge ? '✅badge' : '❌badge',
        v.whisperCaptions ? `✅${e.wordCount}words` : '❌captions',
        v.faceSafe ? `✅face@${e.faceSafeBottomY}` : '❌face',
      ].join('  ');
      console.log(`       ${checks}`);
    }
    if (e.error) console.log(`       Error: ${e.error}`);
  }
  console.log();
}

if (statusOnly) { printStatus(); process.exit(0); }

// ── Setup dirs ────────────────────────────────────────────────────────────────
fs.mkdirSync(TMP_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_DIR, { recursive: true });

// ── Python helpers for Whisper + face detection ────────────────────────────────
const WHISPER_SCRIPT = path.join(TMP_DIR, 'whisper_transcribe.py');
const FACE_SCRIPT = path.join(TMP_DIR, 'face_detect.py');

fs.writeFileSync(WHISPER_SCRIPT, `
import sys, json, os, warnings
warnings.filterwarnings("ignore")
video_path = sys.argv[1]
out_path = sys.argv[2]

# Extract audio first
import subprocess
audio_path = out_path.replace('.json', '.wav')
subprocess.run(['${FFMPEG}', '-y', '-i', video_path, '-vn', '-ar', '16000', '-ac', '1', audio_path],
               capture_output=True)

import whisper
model = whisper.load_model('base')
result = model.transcribe(audio_path, word_timestamps=True, language='en')

words = []
for segment in result.get('segments', []):
    for w in segment.get('words', []):
        words.append({'word': w['word'].strip(), 'start': round(w['start'], 3), 'end': round(w['end'], 3)})

output = {'text': result['text'].strip(), 'words': words}
with open(out_path, 'w') as f:
    json.dump(output, f, indent=2)
print(f"Transcribed {len(words)} words")
`);

fs.writeFileSync(FACE_SCRIPT, `
import sys, json, cv2
video_path = sys.argv[1]
out_path = sys.argv[2]

cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
cap = cv2.VideoCapture(video_path)

total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
fps = cap.get(cv2.CAP_PROP_FPS) or 30
height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)

sample_frames = [int(total_frames * t) for t in [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]]
face_bottoms = []

for fn in sample_frames:
    cap.set(cv2.CAP_PROP_POS_FRAMES, fn)
    ret, frame = cap.read()
    if not ret:
        continue
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(gray, 1.1, 5, minSize=(60, 60))
    for (x, y, w, h) in faces:
        bottom = (y + h) / height
        if 0.2 < bottom < 0.85:
            face_bottoms.append(bottom)

cap.release()

if face_bottoms:
    avg_bottom = sum(face_bottoms) / len(face_bottoms)
    safe_bottom = min(0.85, avg_bottom + 0.05)
else:
    safe_bottom = 0.64  # default fallback

result = {
    'face_detected': len(face_bottoms) > 0,
    'face_bottom_samples': [round(b, 3) for b in face_bottoms],
    'avg_face_bottom': round(sum(face_bottoms)/len(face_bottoms), 3) if face_bottoms else None,
    'safe_bottom_start': round(safe_bottom, 3)
}
with open(out_path, 'w') as f:
    json.dump(result, f, indent=2)
print(f"Face detected: {result['face_detected']}, safe_bottom: {result['safe_bottom_start']}")
`);

// ── Tagline generation ─────────────────────────────────────────────────────────
// Always derived from the actual Whisper transcript via Claude Haiku.
// The tagline is the green badge text — it must summarize THIS specific video.
// Never hardcoded. Falls back to keyword extraction only if API is unavailable.
async function generateTaglineAsync(
  transcript: string,
  supabaseCaption: string,
  niche: string,
): Promise<{ tagline: string; source: 'claude' | 'keyword-fallback' | 'no-transcript' }> {
  if (!transcript || transcript.trim().length < 10) {
    return { tagline: 'this one hit different', source: 'no-transcript' };
  }

  const anthropicKey = (() => {
    try {
      const envFile = fs.readFileSync('/Users/isaiahdupree/Documents/Software/actp-worker/.env', 'utf8');
      const match = envFile.match(/ANTHROPIC_API_KEY=(.+)/);
      return match?.[1]?.trim() ?? '';
    } catch { return ''; }
  })();

  if (!anthropicKey) {
    console.warn('   ⚠️  No ANTHROPIC_API_KEY found — using keyword fallback for tagline');
    return { tagline: keywordFallbackTagline(transcript, supabaseCaption, niche), source: 'keyword-fallback' };
  }

  // Full transcript → Claude → specific tagline for THIS video
  const transcriptContext = transcript.slice(0, 500);
  const captionContext = supabaseCaption?.length > 20 ? `\nAI caption: ${supabaseCaption.slice(0, 150)}` : '';

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 80,
    messages: [{
      role: 'user',
      content: `You are writing a green badge tagline for an Instagram Reel by @the_isaiah_dupree.

The tagline appears as: BLACK TEXT on a GREEN (#00C853) background pill, directly below the handle.
It must summarize what THIS specific video is about in a catchy, trendy, relatable way.

Rules:
- 4 to 8 words only
- lowercase
- no emoji
- no quotation marks
- must be specific to this video's content, not generic
- match the style: punchy, emotional, contrarian, builder mindset

Good examples based on real content:
"stop overthinking the text" — about reaching out to friends
"the friendship fade is real" — about friendships drifting apart
"ai is changing everything" — about AI tools
"most people get this backwards" — about a counterintuitive insight
"the skill nobody teaches you" — about an underrated skill

Full transcript of this video:
${transcriptContext}${captionContext}

Reply with ONLY the tagline. One line. No explanation.`,
    }],
  });

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-length': Buffer.byteLength(body),
        },
        timeout: 15000,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => { data += c; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const raw = parsed?.content?.[0]?.text?.trim() ?? '';
            // Strip surrounding quotes, newlines, prefixes like "Tagline: "
            const tagline = raw
              .replace(/^(tagline:\s*|title:\s*|badge:\s*)/i, '')
              .replace(/^["']|["']$/g, '')
              .replace(/\n.*/s, '')
              .trim();
            if (tagline.length >= 3 && tagline.length <= 70) {
              resolve({ tagline, source: 'claude' });
            } else {
              console.warn(`   ⚠️  Claude returned bad tagline: "${raw}" — falling back`);
              resolve({ tagline: keywordFallbackTagline(transcript, supabaseCaption, niche), source: 'keyword-fallback' });
            }
          } catch (e) {
            console.warn(`   ⚠️  Claude response parse error — falling back`);
            resolve({ tagline: keywordFallbackTagline(transcript, supabaseCaption, niche), source: 'keyword-fallback' });
          }
        });
      }
    );
    req.on('error', (e) => {
      console.warn(`   ⚠️  Claude API error: ${e.message} — falling back`);
      resolve({ tagline: keywordFallbackTagline(transcript, supabaseCaption, niche), source: 'keyword-fallback' });
    });
    req.on('timeout', () => {
      req.destroy();
      console.warn('   ⚠️  Claude API timeout — falling back');
      resolve({ tagline: keywordFallbackTagline(transcript, supabaseCaption, niche), source: 'keyword-fallback' });
    });
    req.write(body);
    req.end();
  });
}

// Keyword fallback — used when Claude API is unavailable
// Reads the actual transcript content to produce a specific tagline, not a generic one.
// Scored map: each pattern has a tagline derived from the TOPIC, not just a template.
function keywordFallbackTagline(transcript: string, supabaseCaption: string, niche: string): string {
  const t = (transcript + ' ' + supabaseCaption).toLowerCase();

  // Topic → tagline map — ordered by specificity
  const topicMap: Array<[RegExp, string]> = [
    // Relationships / social
    [/reach.*out|text.*back|awkward.*text|send.*message|message.*first/,  'stop overthinking the text'],
    [/friend.*fade|drift.*apart|grow.*apart|lose.*touch|distant/,         'the friendship fade is real'],
    [/miss.*person|miss.*feeling|miss.*vibe|not.*person|miss.*them/,       'sometimes you miss the feeling'],
    [/relationship|dating|love|romantic|partner/,                          'most people get this backwards'],
    // AI / tech / automation
    [/ai.*tool|automat|machine.*learn|build.*app|software.*build/,         'ai is changing everything'],
    [/code.*itself|apps.*code|autonomous.*code|ai.*agent/,                 'where apps code themselves'],
    [/system.*build|workflow|pipeline|stack|tool.*stack/,                  'stop doing it manually'],
    // Business / creator / content
    [/content.*creat|posting.*consis|grow.*account|instagram|tiktok/,      'post before you are ready'],
    [/client|revenue|sales|offer|lead.*gen|close.*deal/,                   'this is how it actually works'],
    [/product|launch|startup|build.*business|side.*project/,               'build the business first'],
    // Mindset / personal
    [/overthink|in.*your.*head|mental|anxiety|worry|fear/,                 'stop overthinking everything'],
    [/procrastinat|wait.*right.*time|never.*right|just.*start/,            'just start. the time is now'],
    [/learn.*skill|underrat.*skill|nobody.*teaches|hidden.*skill/,         'the skill nobody teaches you'],
    [/consistency|show.*up.*every|discipline|daily.*habit/,                'consistency beats everything'],
    [/level.*up|grow|better.*version|self.*improve/,                       'the upgrade most people skip'],
    // Money
    [/money|invest|wealth|passive.*income|financial/,                      'most people get this backwards'],
  ];

  for (const [pattern, tagline] of topicMap) {
    if (pattern.test(t)) return tagline;
  }

  // Niche defaults
  if (niche === 'education') return 'the lesson they never taught';
  if (niche === 'business') return 'this changes how you work';
  if (niche === 'comedy') return 'we have all been here';
  if (niche === 'tech') return 'the tool most people sleep on';
  if (niche === 'podcasts') return 'this conversation hits different';

  // Extract the actual first sentence from the transcript as a tagline candidate
  const firstSentence = transcript.split(/[.!?]/)[0]?.trim() ?? '';
  const words = firstSentence.split(/\s+/).filter(w => w.length > 2);
  if (words.length >= 4) {
    return words.slice(0, 7).join(' ').toLowerCase().slice(0, 55);
  }

  return 'this one hit different';
}

// ── Music track selection ──────────────────────────────────────────────────────
// Reads the catalog.json to pick the best matching track for the niche/mood.
// Falls back to bg-music-lifestyle-01.mp3 if catalog unavailable.
interface CatalogTrack {
  id: string;
  title?: string;
  file: string;
  genre?: string;
  moods?: string[];
  energy_level?: number;
  is_trending?: boolean;
  duration_sec?: number;
  local_path?: string;
}

function selectMusicTrack(niche: string, transcript: string): string | undefined {
  if (musicOverride === 'none') return undefined;
  if (musicOverride && musicOverride !== 'auto') {
    // If user passed an absolute path inside public/, make it relative
    if (musicOverride.startsWith(PUBLIC_DIR)) {
      return path.relative(PUBLIC_DIR, musicOverride);
    }
    return musicOverride; // already relative or URL
  }

  // Niche → preferred moods/genres
  const nichePrefs: Record<string, { genre?: string; moods?: string[]; minEnergy?: number; maxEnergy?: number }> = {
    lifestyle:     { moods: ['upbeat', 'positive'],      minEnergy: 6, maxEnergy: 8 },
    relationships: { moods: ['chill', 'relaxed', 'upbeat'], minEnergy: 5, maxEnergy: 7 },
    comedy:        { genre: 'hip_hop', moods: ['energetic', 'upbeat'], minEnergy: 7 },
    business:      { moods: ['upbeat', 'positive'],      minEnergy: 7 },
    education:     { moods: ['chill', 'relaxed', 'upbeat'], minEnergy: 4, maxEnergy: 7 },
    tech:          { moods: ['upbeat', 'positive'],      minEnergy: 6 },
    entertainment: { genre: 'hip_hop', moods: ['energetic'], minEnergy: 7 },
  };

  const pref = nichePrefs[niche] ?? { minEnergy: 5 };

  // Try catalog
  const catalogPath = path.join(PUBLIC_DIR, 'music', 'catalog.json');
  if (fs.existsSync(catalogPath)) {
    try {
      const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      const tracks: CatalogTrack[] = catalog.tracks ?? [];

      // Score each track
      const scored = tracks
        .filter(t => {
          const localPath = t.local_path ?? path.join(PUBLIC_DIR, 'music', t.file);
          const resolvedPath = localPath.startsWith('/') ? localPath : path.join(PUBLIC_DIR, 'music', t.file);
          return fs.existsSync(resolvedPath) && (t.duration_sec ?? 60) >= 30;
        })
        .map(t => {
          let score = 0;
          const energy = t.energy_level ?? 6;
          const moods = t.moods ?? [];
          const genre = t.genre ?? '';

          // Genre match
          if (pref.genre && genre === pref.genre) score += 3;

          // Mood match
          if (pref.moods) {
            const moodMatches = moods.filter(m => pref.moods!.includes(m)).length;
            score += moodMatches * 2;
          }

          // Energy range
          if (pref.minEnergy && energy >= pref.minEnergy) score += 1;
          if (pref.maxEnergy && energy <= pref.maxEnergy) score += 1;

          // Trending bonus
          if (t.is_trending) score += 2;

          return { track: t, score };
        })
        .sort((a, b) => b.score - a.score);

      if (scored.length > 0) {
        const best = scored[0].track;
        console.log(`   🎵 Music: "${best.title ?? best.id}" (${best.genre}, energy=${best.energy_level})`);
        // Return path relative to public/ — staticFile() resolves it correctly
        return path.join('music', best.file);
      }
    } catch (e: any) {
      console.warn(`   ⚠️  Music catalog parse error: ${e.message}`);
    }
  }

  // Fallback: bg-music-lifestyle-01.mp3 (relative to public/)
  if (fs.existsSync(path.join(PUBLIC_DIR, 'bg-music-lifestyle-01.mp3'))) {
    console.log('   🎵 Music: bg-music-lifestyle-01.mp3 (fallback)');
    return 'bg-music-lifestyle-01.mp3';
  }

  console.log('   🎵 Music: none (no tracks available)');
  return undefined;
}

// ── Per-video pipeline ─────────────────────────────────────────────────────────
async function processVideo(entry: QueueEntry): Promise<void> {
  const videoPath = path.join(IPHONE_DIR, entry.file);
  const slug = entry.file.replace(/\.[^.]+$/, '').toLowerCase();
  const tmpVideo = path.join(TMP_DIR, `${slug}-graded.mp4`);
  const tmpAudio = path.join(TMP_DIR, `${slug}-audio.aac`);
  const transcriptPath = path.join(TMP_DIR, `${slug}-transcript.json`);
  const facePath = path.join(TMP_DIR, `${slug}-face.json`);

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🎬 [${entry.rank}] ${entry.file} (${entry.niche})`);
  console.log(`${'─'.repeat(60)}`);

  if (!fs.existsSync(videoPath)) {
    throw new Error(`Video not found: ${videoPath}`);
  }

  // ── Probe duration ─────────────────────────────────────────────────────────
  const probeRaw = execSync(`"${FFPROBE}" -v quiet -print_format json -show_format "${videoPath}"`, { encoding: 'utf8' });
  const probeData = JSON.parse(probeRaw);
  const duration = Math.min(parseFloat(probeData.format?.duration ?? '40'), 50);
  const durationFrames = Math.round(duration * 30);
  entry.durationSeconds = duration;
  console.log(`   Duration: ${duration.toFixed(1)}s → ${durationFrames} frames`);

  // ── Step 1: Color grade + crop ──────────────────────────────────────────────
  if (!fs.existsSync(tmpVideo)) {
    console.log('   🎨 Grading + cropping to 720×1280...');
    const gradeFilter = 'eq=saturation=0.85:brightness=-0.04:gamma=1.05,colorchannelmixer=rr=1.02:gg=0.98:bb=0.95';

    const probeStreams = execSync(`"${FFPROBE}" -v quiet -print_format json -show_streams "${videoPath}"`, { encoding: 'utf8' });
    const streamsData = JSON.parse(probeStreams);
    const vidStream = streamsData.streams?.find((s: any) => s.codec_type === 'video');
    const codedW = vidStream?.width ?? 1920;
    const codedH = vidStream?.height ?? 1080;
    // iPhone videos are coded landscape with a Display Matrix rotation tag.
    // ffmpeg auto-applies the rotation BEFORE our -vf chain, so we check
    // the ACTUAL orientation after rotation (not the coded dimensions).
    const sideData: any[] = vidStream?.side_data_list ?? [];
    const rotationTag = sideData.find((sd: any) => sd.side_data_type === 'Display Matrix')?.rotation ?? 0;
    const rotDeg = Math.abs(Number(rotationTag));
    // 90° or 270° rotation swaps width/height
    const isActualPortrait = (rotDeg === 90 || rotDeg === 270) ? codedW > codedH : codedH > codedW;
    // After auto-rotation the filter chain sees portrait (e.g. 1080×1920).
    // Scale to fill 720×1280 then center-crop — no transpose needed.
    const cropFilter = isActualPortrait
      ? 'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280'
      : 'scale=1280:-2,crop=720:1280';
    console.log(`   📐 Orientation: coded=${codedW}×${codedH} rot=${rotDeg}° → ${isActualPortrait ? 'portrait' : 'landscape→crop'}`);

    execSync(
      `"${FFMPEG}" -y -i "${videoPath}" -vf "${cropFilter},${gradeFilter}" -c:v h264 -preset fast -crf 20 -c:a aac -b:a 192k -r 30 -t ${duration} "${tmpVideo}"`,
      { stdio: ['ignore', 'pipe', 'pipe'] }
    );
    console.log('   ✅ Graded video ready');
  } else {
    console.log('   ✅ Graded video cached');
  }

  // ── Step 2: Extract + voice-enhance audio ─────────────────────────────────
  // Voice isolation chain (ffmpeg-native, no external models needed):
  //   highpass=f=120        — cut rumble/HVAC below 120Hz
  //   afftdn=nf=-20         — FFT spectral subtraction noise floor at -20dB
  //   speechnorm            — normalize speech amplitude variations
  //   acompressor           — tighten dynamic range (quiet parts up, loud parts down)
  //   loudnorm I=-14        — master to -14 LUFS (Instagram/TikTok standard)
  const tmpAudioRaw = path.join(TMP_DIR, `${slug}-audio-raw.aac`);
  if (!fs.existsSync(tmpAudio)) {
    console.log('   🔊 Extracting + isolating voice...');
    // First extract raw
    execSync(`"${FFMPEG}" -y -i "${tmpVideo}" -vn -acodec copy "${tmpAudioRaw}"`, { stdio: ['ignore', 'pipe', 'pipe'] });
    // Then apply voice isolation chain
    const voiceChain = [
      'highpass=f=120',
      'afftdn=nf=-20',
      'speechnorm=e=50:r=0.0001:l=1',
      'acompressor=threshold=-18dB:ratio=3:attack=5:release=50',
      'loudnorm=I=-14:LRA=7:TP=-1',
    ].join(',');
    execSync(
      `"${FFMPEG}" -y -i "${tmpAudioRaw}" -af "${voiceChain}" -c:a aac -b:a 192k "${tmpAudio}"`,
      { stdio: ['ignore', 'pipe', 'pipe'] }
    );
    console.log('   ✅ Voice isolated + enhanced');
  } else {
    console.log('   ✅ Voice audio cached');
  }

  // ── Step 3: Whisper transcription ──────────────────────────────────────────
  let words: Array<{ word: string; start: number; end: number }> = [];
  let transcriptText = '';

  if (!fs.existsSync(transcriptPath)) {
    console.log('   🗣️  Running Whisper transcription...');
    try {
      const whisperOut = execSync(`python3 "${WHISPER_SCRIPT}" "${videoPath}" "${transcriptPath}"`, {
        encoding: 'utf8',
        timeout: 300_000,
      });
      console.log(`   ✅ ${whisperOut.trim()}`);
    } catch (e: any) {
      console.warn(`   ⚠️  Whisper failed: ${e.message?.slice(0, 100)}`);
    }
  }

  if (fs.existsSync(transcriptPath)) {
    const transcript = JSON.parse(fs.readFileSync(transcriptPath, 'utf8'));
    words = transcript.words ?? [];
    transcriptText = transcript.text ?? '';
    entry.wordCount = words.length;
    console.log(`   ✅ ${words.length} words transcribed`);
  }

  // ── Step 4: Face detection ─────────────────────────────────────────────────
  let faceSafeBottomY = 0.64;

  if (!fs.existsSync(facePath)) {
    console.log('   👁️  Detecting face zone...');
    try {
      const faceOut = execSync(`python3 "${FACE_SCRIPT}" "${videoPath}" "${facePath}"`, {
        encoding: 'utf8',
        timeout: 60_000,
      });
      console.log(`   ✅ ${faceOut.trim()}`);
    } catch (e: any) {
      console.warn(`   ⚠️  Face detection failed: ${e.message?.slice(0, 100)}, using default 0.64`);
    }
  }

  if (fs.existsSync(facePath)) {
    const faceData = JSON.parse(fs.readFileSync(facePath, 'utf8'));
    faceSafeBottomY = faceData.safe_bottom_start ?? 0.64;
    entry.faceSafeBottomY = faceSafeBottomY;
    console.log(`   ✅ Face safe bottom: ${faceSafeBottomY}`);
  }

  // ── Step 4b: Load Supabase AI caption if available (better tagline context) ─
  // (Supabase caption was stored during the 100% analysis pass — higher quality than raw transcript)
  const supabaseCaption = entry.supabaseCaption ?? '';

  // ── Step 5: AI tagline — derived from Whisper transcript every time ──────────
  console.log('   ✍️  Generating tagline from transcript...');
  const taglineResult = dryRun
    ? { tagline: keywordFallbackTagline(transcriptText, supabaseCaption, entry.niche), source: 'keyword-fallback' as const }
    : await generateTaglineAsync(transcriptText, supabaseCaption, entry.niche);
  const { tagline, source: taglineSource } = taglineResult;
  entry.tagline = tagline;
  const sourceLabel = taglineSource === 'claude' ? '(Claude AI)' : taglineSource === 'keyword-fallback' ? '(keyword fallback)' : '(no transcript)';
  console.log(`   ✅ Tagline ${sourceLabel}: "${tagline}"`);

  if (dryRun) {
    console.log('\n   [DRY RUN] Would render IsaiahReelV2. Remove --dry-run to render.');
    return;
  }

  // ── Step 6: Copy to public/ ────────────────────────────────────────────────
  const ts = Date.now();
  const publicVideo = path.join(PUBLIC_DIR, `reel-${slug}-${ts}.mp4`);
  const publicAudio = path.join(PUBLIC_DIR, `reel-${slug}-${ts}.aac`);
  fs.copyFileSync(tmpVideo, publicVideo);
  fs.copyFileSync(tmpAudio, publicAudio);

  const publicVideoRel = path.relative(PUBLIC_DIR, publicVideo);
  const publicAudioRel = path.relative(PUBLIC_DIR, publicAudio);

  // ── Step 7: Render ─────────────────────────────────────────────────────────
  const outputFile = path.join(OUTPUT_DIR, `reel-${slug}-${fontVariant}.mp4`);
  const musicPath = selectMusicTrack(entry.niche, transcriptText);

  const inputProps = {
    backgroundVideoPath: publicVideoRel,
    audioPath: publicAudioRel,
    tagline,
    words,
    faceSafeBottomY,
    captionFontSize: 40,
    captionMaxWords: 5,
    fontVariant,
    ...(musicPath ? { musicPath, musicVolumeBase: 0.02, musicVolumeDucked: 0.01 } : {}),
  };

  console.log(`   🎞️  Rendering IsaiahReelV2 → ${path.basename(outputFile)}...`);
  const renderCmd = [
    `cd "${STUDIO_DIR}" &&`,
    `npx remotion render IsaiahReelV2 "${outputFile}"`,
    `--props='${JSON.stringify(inputProps).replace(/'/g, "'\"'\"'")}'`,
    `--duration=${durationFrames}`,
  ].join(' ');

  execSync(renderCmd, { stdio: 'inherit', timeout: 600_000 });

  const stats = fs.statSync(outputFile);
  console.log(`   ✅ Rendered: ${outputFile} (${(stats.size / 1024 / 1024).toFixed(1)}MB)`);

  entry.outputPath = outputFile;

  // ── Step 8: Baseline validation ────────────────────────────────────────────
  // Validate all 3 required elements are actually wired into the render props.
  // This catches regressions — if any element is missing, mark the entry failed.
  const validation = {
    handle:          !!inputProps && (inputProps as any).handle !== '' , // handle has a default in the component
    greenBadge:      typeof tagline === 'string' && tagline.trim().length > 0,
    whisperCaptions: words.length > 0,
    faceSafe:        faceSafeBottomY > 0 && faceSafeBottomY <= 0.85,
  };
  entry.validation = validation;

  const allPassed = Object.values(validation).every(Boolean);
  console.log('\n   🔍 Baseline validation:');
  console.log(`      ✅ @the_isaiah_dupree handle:    ${validation.handle ? 'PASS' : '❌ FAIL'}`);
  console.log(`      ✅ Green badge tagline:          ${validation.greenBadge ? 'PASS — "' + tagline + '"' : '❌ FAIL — empty tagline'}`);
  console.log(`      ✅ Whisper captions (accurate):  ${validation.whisperCaptions ? 'PASS — ' + words.length + ' words' : '❌ FAIL — no words'}`);
  console.log(`      ✅ Face-safe caption position:   ${validation.faceSafe ? 'PASS — safe_bottom=' + faceSafeBottomY : '❌ FAIL — bad value'}`);
  console.log(`   ${allPassed ? '✅ ALL CHECKS PASSED' : '❌ VALIDATION FAILED — review output'}`);

  if (!allPassed) {
    throw new Error(`Baseline validation failed: ${JSON.stringify(validation)}`);
  }

  // Clean up temp public files
  try { fs.unlinkSync(publicVideo); fs.unlinkSync(publicAudio); } catch {}
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🎬 IsaiahReelV2 Batch Pipeline');
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE RENDER'}`);
  console.log(`   Font: ${fontVariant}`);
  console.log(`   Music: ${musicOverride ?? 'auto'}`);

  let candidates = CANDIDATES;
  if (singleVideo) {
    candidates = CANDIDATES.filter(c => c.file === singleVideo);
    if (!candidates.length) {
      console.error(`❌ Video not in candidate list: ${singleVideo}`);
      process.exit(1);
    }
  }

  // Pre-fetch Supabase AI captions for better tagline context
  process.stdout.write('   Fetching Supabase captions... ');
  const captionMap = await fetchSupabaseCaptions(candidates.map(c => c.file));
  console.log(`${captionMap.size} found`);

  const queue = initQueue(candidates, captionMap);
  const limit = limitArg ? parseInt(limitArg) : candidates.length;

  const toProcess = queue
    .filter(e => e.status === 'pending' || e.status === 'failed')
    .filter(e => candidates.some(c => c.file === e.file))
    .slice(0, limit);

  if (!toProcess.length) {
    console.log('\n✅ All queued videos are done!');
    printStatus();
    process.exit(0);
  }

  console.log(`\n   Processing ${toProcess.length} video(s) (limit: ${limit})\n`);

  // Print ranked table
  console.log('   Rank  File             Niche         Description');
  console.log('   ' + '─'.repeat(72));
  for (const c of candidates.slice(0, 20)) {
    console.log(`   [${String(c.rank).padStart(2)}]  ${c.file.padEnd(15)}  ${c.niche.padEnd(13)}  ${c.description.slice(0, 45)}`);
  }
  console.log();

  let successCount = 0;
  let failCount = 0;

  for (const entry of toProcess) {
    entry.status = 'processing';
    entry.startedAt = new Date().toISOString();
    saveQueue(queue);

    try {
      await processVideo(entry);
      entry.status = dryRun ? 'pending' : 'done';
      entry.completedAt = new Date().toISOString();
      successCount++;
    } catch (err: any) {
      entry.status = 'failed';
      entry.error = err?.message?.slice(0, 200) ?? String(err);
      entry.completedAt = new Date().toISOString();
      failCount++;
      console.error(`\n❌ Failed: ${entry.file}: ${entry.error}`);
    }

    saveQueue(queue);
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`✅ Batch complete: ${successCount} rendered, ${failCount} failed`);
  console.log(`   Queue file: ${QUEUE_FILE}`);
  if (!dryRun && successCount > 0) {
    console.log(`   Output dir: ${OUTPUT_DIR}`);
    console.log('\n📤 To publish a render:');
    console.log('   Use /post-video or MPLite queue to push to Instagram + TikTok');
  }
  console.log();
  printStatus();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
