/**
 * Stage 2b: Lip-Sync Video Generation — Veo 3 Native Speech
 *
 * Alternative to Stage 2 (motion video) + Stage 3 (ElevenLabs TTS).
 * Generates one Veo 3 clip per script line, each with native speech baked in.
 * Stitches all clips together with ffmpeg and burns ASS captions.
 *
 * Research-backed prompt formula (skywork.ai / replicate.com / deepmind):
 *   - Use colon syntax: [character] says: text  (NOT quoted — quotes bake subtitles)
 *   - Add "(no subtitles)" explicitly
 *   - Keep each line ≤ 8 seconds of speech
 *   - Specify "no background music" to avoid hallucinated studio audience
 *   - One clip per line → stitch with ffmpeg concat
 *
 * Output: lipsync_9x16.mp4 — stitched clips with captions burned in
 * No ElevenLabs needed — audio is native from Veo 3.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { execSync } from 'child_process';
import type { AngleInputs, StageResult } from './offer.schema.js';

function getKey(): string {
  const key = process.env.GOOGLE_API_KEY || process.env.GOOGLE_VEO_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GOOGLE_API_KEY not set');
  return key;
}

// =============================================================================
// Veo 3 lip-sync prompt builder
// Research sources:
//   - Google Cloud: cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-veo-3-1
//   - Community guide: github.com/snubroot/Veo-3-Prompting-Guide (v4.0)
//   - skywork.ai/blog/how-to-prompt-lip-synced-dialogue-google-veo-3
//   - replicate.com/blog/using-and-prompting-veo-3
//
// Key findings applied:
//   1. SELFIE/UGC format — "A selfie video of [char]... holds camera at arm's length...
//      arm visible in frame... slightly grainy, film-like" — far more authentic than tripod
//   2. Colon+quote syntax — character says: "dialogue" — the COLON prevents subtitles,
//      NOT removing quotes. Quotes are fine and actually help pronunciation.
//   3. Detailed character template — specific age/hair/eyes/clothing for visual consistency
//      across all clips in a multi-clip sequence
//   4. Explicit audio spec — "close microphone pickup, minimal background noise,
//      warm acoustic properties" beats generic "no background music"
//   5. Timestamp prompting — [00:00-00:04] hook + [00:04-00:08] payoff within single clip
//   6. "This then that" sequence — describe what happens first then second
//   7. Phonetic pronunciation — fix brand names/complex words before submission
//   8. Multiple subtitle negations for stubborn cases: "No subtitles. No on-screen text."
// =============================================================================

/**
 * Builds an improved Veo 3 UGC selfie-style prompt for a single spoken line.
 * Uses the selfie formula for maximum authenticity + colon+quote dialogue syntax.
 */
export function buildLipsyncPrompt(
  line: string,
  characterDescription: string,
  setting: string,
  lineIndex: number,
  totalLines: number,
  options?: { voiceProfile?: string; shotDescription?: string; pronoun?: string }
): string {
  // Estimate speaking duration: ~2.5 words/sec casual pace
  const wordCount = line.split(/\s+/).length;
  const estSeconds = Math.max(3, Math.min(7, Math.ceil(wordCount / 2.5)));

  // Clean line — keep punctuation for natural speech rhythm
  const cleanLine = line.trim();

  // Position-aware expression and gesture
  const isFirst = lineIndex === 0;
  const isLast = lineIndex === totalLines - 1;
  const expression = isFirst
    ? 'slightly raised eyebrows, direct eye contact, relatable expression'
    : isLast
    ? 'warm smile, slight nod, genuine energy'
    : 'natural conversational expression, occasional blink';
  const endGesture = isLast ? 'ends with a small knowing nod' : 'glances briefly away then back to camera';

  // Timestamp structure: hook moment then delivery
  const hookSec = Math.min(2, Math.floor(estSeconds * 0.25));
  const endSec = estSeconds + 1; // 1s buffer

  const pronoun = options?.pronoun ?? 'They';
  const shot = options?.shotDescription ?? `${pronoun} holds the phone camera at arm's length, arm clearly visible in frame.`;

  const parts = [
    // Selfie UGC formula — triggers authentic handheld behavior
    `A selfie video of ${characterDescription} in ${setting}.`,
    shot,
    // Timestamp prompting for hook + delivery structure
    `[00:00-00:0${hookSec}] Close-up on face, ${expression}, slight pause before speaking.`,
    `[00:0${hookSec}-00:0${endSec}] ${pronoun} speaks directly to camera and says: "${cleanLine}" ${endGesture}.`,
  ];

  // Voice profile for accent/tone consistency across ALL clips
  if (options?.voiceProfile) {
    parts.push(`Voice: ${options.voiceProfile}.`);
  }

  parts.push(
    // Audio spec — explicit environment prevents hallucinations
    `Audio: close microphone pickup, warm acoustic properties, minimal background noise, no studio audience, no background music.`,
    // Quality + subtitle prevention
    `The image is slightly grainy, looks very film-like, authentic UGC style. No subtitles. No on-screen text whatsoever.`,
  );

  return parts.join(' ');
}

/**
 * Builds a detailed character description string for visual consistency across clips.
 * Pass the same output to every buildLipsyncPrompt call in a sequence.
 */
export interface CharacterTraits {
  age?: string;
  gender?: string;
  hair?: string;
  eyes?: string;
  clothing?: string;
  mannerisms?: string;
}

export interface VoiceProfile {
  accent?: string;    // e.g. "American, warm Californian"
  tone?: string;      // e.g. "confident, empathetic, not salesy"
  pace?: string;      // e.g. "conversational medium pace"
  quality?: string;   // e.g. "clear, slightly breathy, natural"
  gender?: string;    // e.g. "male" or "female"
  age?: string;       // e.g. "late 20s"
}

export function buildCharacterDescription(traits: CharacterTraits): string {
  const parts = [
    traits.age ? `${traits.age}-year-old` : 'person in their early 30s',
    traits.gender ?? '',
    traits.hair ? `with ${traits.hair}` : 'with natural hair',
    traits.eyes ? `${traits.eyes} eyes` : '',
    traits.clothing ? `wearing ${traits.clothing}` : 'in casual everyday clothing',
    traits.mannerisms ? `— ${traits.mannerisms}` : '— warm, relatable demeanor',
  ].filter(Boolean);
  return parts.join(', ');
}

/**
 * Builds a consistent voice profile string to inject into EVERY clip prompt.
 * This is critical for accent/tone consistency across multi-clip sequences.
 * Without this, Veo 3 generates a different voice per clip.
 */
export function buildVoiceProfile(profile: VoiceProfile): string {
  const parts = [
    profile.gender ? `${profile.gender}` : '',
    profile.age ? `${profile.age}` : '',
    profile.accent ? `${profile.accent} accent` : 'American accent',
    profile.tone ? `${profile.tone} tone` : 'warm conversational tone',
    profile.pace ? `${profile.pace}` : 'medium conversational pace',
    profile.quality ? `${profile.quality}` : 'clear natural voice',
    'consistent voice throughout',
  ].filter(Boolean);
  return parts.join(', ');
}

// =============================================================================
// fal.ai Veo 3.1 provider (preferred — no RPD quota, $0.40/s with audio)
// Endpoint: fal-ai/veo3.1 (text-to-video) or fal-ai/veo3.1/first-last-frame-to-video
// Docs: https://fal.ai/models/fal-ai/veo3.1/api
// =============================================================================

function getFalKey(): string {
  const key = process.env.FAL_KEY || process.env.FAL_API_KEY;
  if (!key) throw new Error('FAL_KEY not set — get a key at fal.ai/dashboard and add it to .env.local');
  return key;
}

/**
 * Extract a concise setting description from a scene prompt.
 * Strips character/action details and keeps location/environment context.
 * Used to derive a consistent setting for all clips from the offer's beforeScenePrompt.
 */
function extractSettingFromPrompt(scenePrompt: string): string {
  // Common location keywords to extract
  const locationPatterns = [
    /(?:in|at|inside|outside|on)\s+(?:a|an|the)\s+[^,.]+(?:room|kitchen|office|bedroom|bathroom|gym|park|cafe|street|home|apartment|house|studio|desk|couch|sofa|car|yard|garden)/i,
    /(?:a|an|the)\s+[^,.]*(?:kitchen|office|bedroom|bathroom|gym|park|cafe|street|living room|home office|coffee shop)/i,
  ];

  for (const pattern of locationPatterns) {
    const match = scenePrompt.match(pattern);
    if (match) {
      return `${match[0].trim()}, warm natural window light`;
    }
  }

  // Fallback: take first 60 chars of prompt as rough setting hint
  const firstClause = scenePrompt.split(/[,.]/, 1)[0].trim();
  if (firstClause.length > 10 && firstClause.length < 80) {
    return `${firstClause}, warm natural window light`;
  }

  return 'a cozy home environment, warm natural window light, phone or laptop visible nearby';
}

/**
 * Describe the character in a reference image using GPT-4o vision.
 * Returns a locked character description string to inject into every clip prompt.
 * This ensures visual consistency across all clips in a multi-clip sequence.
 */
async function describeCharacterFromImage(imagePath: string, openAIKey: string): Promise<string> {
  if (!openAIKey || !fs.existsSync(imagePath)) return '';

  const cacheFile = imagePath.replace(/\.png$/, '_char_desc.txt');
  if (fs.existsSync(cacheFile)) {
    const cached = fs.readFileSync(cacheFile, 'utf-8').trim();
    if (cached) return cached;
  }

  const b64 = fs.readFileSync(imagePath).toString('base64');
  const ext = imagePath.endsWith('.jpg') ? 'jpeg' : 'png';

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${openAIKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Describe the person in this image for use as a locked character description in an AI video generation prompt. Be extremely specific about: exact age range (e.g. "27-29"), gender, hair color and style, skin tone, eye color if visible, clothing (specific color and item), and one distinguishing feature. Format as a single dense description string, no bullet points, no labels. Example format: "Young woman, 27-29, dark brown shoulder-length hair, medium olive skin, brown eyes, wearing a light grey oversized hoodie, small gold hoop earrings, natural no-makeup look". Do not include background or setting details.`,
          },
          { type: 'image_url', image_url: { url: `data:image/${ext};base64,${b64}`, detail: 'low' } },
        ],
      }],
    }),
  });

  if (!res.ok) return '';
  const result = await res.json() as any;
  const desc = result.choices?.[0]?.message?.content?.trim() ?? '';
  if (desc) fs.writeFileSync(cacheFile, desc, 'utf-8');
  return desc;
}

/**
 * Upload an image file to fal.ai storage and return a public URL.
 * Uses the fal.ai storage upload API with a signed URL flow.
 * Falls back gracefully if upload fails.
 */
async function uploadToFalStorage(imagePath: string, falKey: string): Promise<string> {
  if (!fs.existsSync(imagePath)) return '';

  const cacheFile = imagePath.replace(/\.png$/, '_fal_url.txt');
  if (fs.existsSync(cacheFile)) {
    const cached = fs.readFileSync(cacheFile, 'utf-8').trim();
    if (cached.startsWith('https://')) return cached;
  }

  try {
    // Step 1: Initiate upload — get signed URL
    const fileName = path.basename(imagePath);
    const initiateRes = await fetch(`https://rest.fal.run/storage/upload/initiate?file_name=${encodeURIComponent(fileName)}&content_type=image%2Fpng`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${falKey}` },
    });
    if (!initiateRes.ok) {
      process.stdout.write(`   ⚠️  fal.ai storage initiate ${initiateRes.status} — using text-to-video\n`);
      return '';
    }
    const { upload_url, file_url } = await initiateRes.json() as any;
    if (!upload_url || !file_url) return '';

    // Step 2: PUT image bytes to signed URL
    const imageBytes = fs.readFileSync(imagePath);
    const putRes = await fetch(upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/png', 'Content-Length': String(imageBytes.length) },
      body: imageBytes,
    });
    if (!putRes.ok) {
      process.stdout.write(`   ⚠️  fal.ai storage PUT ${putRes.status} — using text-to-video\n`);
      return '';
    }

    fs.writeFileSync(cacheFile, file_url, 'utf-8');
    return file_url as string;
  } catch (e: any) {
    process.stdout.write(`   ⚠️  fal.ai storage upload failed: ${e.message} — using text-to-video\n`);
    return '';
  }
}

/**
 * Submit a Veo 3.1 clip via fal.ai queue API.
 * If imageUrl is provided, uses first-last-frame-to-video for visual anchoring.
 * Returns a request_id used for polling.
 */
async function submitFalClip(
  prompt: string,
  aspectRatio: string,
  falKey: string,
  imageUrl?: string,
): Promise<string> {
  // Use image-to-video endpoint when we have a reference image URL (public https://)
  const useImageEndpoint = !!imageUrl && imageUrl.startsWith('https://');
  const endpoint = useImageEndpoint
    ? 'fal-ai/veo3.1/first-last-frame-to-video'
    : 'fal-ai/veo3.1';

  const body: Record<string, unknown> = {
    prompt,
    aspect_ratio: aspectRatio,
    duration: '8s',
    resolution: '720p',
    generate_audio: true,
    auto_fix: true,
  };
  if (useImageEndpoint) body.first_frame_url = imageUrl;

  const res = await fetch(`https://queue.fal.run/${endpoint}`, {
    method: 'POST',
    headers: { 'Authorization': `Key ${falKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fal.ai submit ${res.status}: ${text.substring(0, 300)}`);
  }
  const result = await res.json() as any;
  if (!result.request_id) throw new Error(`fal.ai no request_id: ${JSON.stringify(result).substring(0, 200)}`);
  return `${endpoint}::${result.request_id}`; // encode endpoint+id together
}

/**
 * Poll a fal.ai request until complete, then download and return the video buffer.
 * request_id format: "endpoint::uuid"
 */
async function pollFalClip(requestToken: string, falKey: string): Promise<Buffer> {
  const sep = requestToken.indexOf('::');
  const endpoint = requestToken.slice(0, sep);
  const requestId = requestToken.slice(sep + 2);
  const statusUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}/status`;
  const resultUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}`;
  const start = Date.now();

  while (Date.now() - start < 600_000) {
    await new Promise((r) => setTimeout(r, 8_000));
    let res: Response;
    try {
      res = await fetch(`${statusUrl}?logs=0`, { headers: { 'Authorization': `Key ${falKey}` } });
    } catch { process.stdout.write('~'); continue; }  // transient network error — retry
    if (!res.ok) { process.stdout.write('?'); continue; }
    const status = await res.json() as any;
    const st = status.status as string;
    const elapsed = Math.round((Date.now() - start) / 1000);
    process.stdout.write(`\r   ⏳ fal.ai: ${st} (${elapsed}s)`);

    if (st === 'FAILED') {
      console.log('');
      throw new Error(`fal.ai generation failed: ${status.error ?? 'unknown error'}`);
    }
    if (st !== 'COMPLETED') continue;
    console.log('');

    // Fetch result
    const rRes = await fetch(resultUrl, { headers: { 'Authorization': `Key ${falKey}` } });
    if (!rRes.ok) throw new Error(`fal.ai result fetch ${rRes.status}`);
    const result = await rRes.json() as any;
    const videoUrl = result.video?.url || result.output?.video?.url || '';
    if (!videoUrl) throw new Error(`fal.ai done but no video URL: ${JSON.stringify(result).substring(0, 200)}`);

    const dlRes = await fetch(videoUrl, { redirect: 'follow' });
    if (!dlRes.ok) throw new Error(`fal.ai download failed: ${dlRes.status}`);
    return Buffer.from(await dlRes.arrayBuffer());
  }
  throw new Error('fal.ai clip timed out after 10 minutes');
}

// =============================================================================
// Single Veo 3 clip submission + polling (Google Gemini — fallback)
// =============================================================================

async function submitVeoClip(
  prompt: string,
  beforeImagePath: string,
  aspectRatio: string,
  key: string
): Promise<string> {
  const imageB64 = fs.existsSync(beforeImagePath)
    ? fs.readFileSync(beforeImagePath).toString('base64')
    : undefined;

  const instance: Record<string, unknown> = { prompt };
  if (imageB64) instance.image = { bytesBase64Encoded: imageB64, mimeType: 'image/png' };

  const payload = JSON.stringify({
    instances: [instance],
    parameters: { aspectRatio },
  });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning?key=${key}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }
  );
  if (!res.ok) throw new Error(`Veo submit ${res.status}: ${(await res.text()).substring(0, 300)}`);
  const result = await res.json() as any;
  if (result.error) throw new Error(`Veo: ${result.error.message}`);
  if (!result.name) throw new Error(`Veo no operation name: ${JSON.stringify(result).substring(0, 200)}`);
  return result.name;
}

async function pollVeoClip(operationName: string, key: string): Promise<Buffer> {
  const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${key}`;
  const start = Date.now();

  while (Date.now() - start < 600_000) {
    await new Promise((r) => setTimeout(r, 10_000));
    const res = await fetch(pollUrl);
    if (!res.ok) { process.stdout.write('?'); continue; }
    const result = await res.json() as any;
    if (result.error) throw new Error(`Veo poll error: ${result.error.message}`);
    const pct = result.metadata?.progressPercent || 0;
    process.stdout.write(`\r   ⏳ ${pct}% (${Math.round((Date.now() - start) / 1000)}s)`);
    if (!result.done) continue;
    console.log('');

    const videoUrl =
      result.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
      result.response?.videoUri ||
      result.response?.videos?.[0]?.uri || '';

    if (!videoUrl) {
      const raiCount = result.response?.generateVideoResponse?.raiMediaFilteredCount;
      const raiReasons = result.response?.generateVideoResponse?.raiMediaFilteredReasons;
      if (raiCount) throw new Error(`Veo RAI filter blocked (${raiCount}). Reason: ${raiReasons?.[0] ?? 'unknown'}`);
      throw new Error('Veo done but no video URL');
    }

    const sep = videoUrl.includes('?') ? '&' : '?';
    const dlRes = await fetch(`${videoUrl}${sep}key=${key}`, { redirect: 'follow' });
    if (!dlRes.ok) throw new Error(`Veo download failed: ${dlRes.status}`);
    return Buffer.from(await dlRes.arrayBuffer());
  }
  throw new Error('Veo lip-sync clip timed out after 10 minutes');
}

// =============================================================================
// Script completion verification — Whisper transcription + word overlap
// =============================================================================

const MAX_WORDS_PER_CLIP = 20;   // ~2.5 words/sec × 8s = 20 words safe limit
const COMPLETION_THRESHOLD = 0.75; // require 75% of expected words spoken
const MAX_CLIP_RETRIES = 2;       // retry truncated clips up to 2 times

function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return '';  // graceful fallback — skip verification if no key
  return key;
}

/**
 * Transcribe a video clip's audio using OpenAI Whisper API.
 * Extracts audio to a temp wav, sends to Whisper, returns text.
 */
async function transcribeClip(clipPath: string, openAIKey: string): Promise<string> {
  if (!openAIKey) return ''; // skip if no key
  const tmpWav = `/tmp/lipsync_whisper_${Date.now()}.wav`;
  try {
    execSync(
      `ffmpeg -y -i "${clipPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${tmpWav}" 2>/dev/null`,
      { stdio: 'pipe' }
    );
    if (!fs.existsSync(tmpWav) || fs.statSync(tmpWav).size < 1000) return '';

    // Build multipart form data manually for https
    const boundary = `----whisper${Date.now()}`;
    const fileData = fs.readFileSync(tmpWav);
    const parts: Buffer[] = [];

    // model field
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n`
    ));
    // language field
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\nen\r\n`
    ));
    // file field
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="clip.wav"\r\nContent-Type: audio/wav\r\n\r\n`
    ));
    parts.push(fileData);
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const body = Buffer.concat(parts);

    return new Promise<string>((resolve) => {
      const req = https.request(
        {
          hostname: 'api.openai.com', path: '/v1/audio/transcriptions', method: 'POST',
          headers: {
            Authorization: `Bearer ${openAIKey}`,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': body.length,
          },
        },
        (res) => {
          let data = '';
          res.on('data', (c) => { data += c; });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed.text ?? '');
            } catch {
              resolve('');
            }
          });
        }
      );
      req.on('error', () => resolve(''));
      req.write(body);
      req.end();
    });
  } catch {
    return '';
  } finally {
    try { fs.unlinkSync(tmpWav); } catch { /* */ }
  }
}

/**
 * Calculate what fraction of expected words appear in the transcription.
 * Uses normalized lowercase word matching.
 */
function calculateWordOverlap(expected: string, transcribed: string): number {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const expectedWords = normalize(expected);
  const transcribedWords = new Set(normalize(transcribed));
  if (expectedWords.length === 0) return 1;
  const matched = expectedWords.filter((w) => transcribedWords.has(w)).length;
  return matched / expectedWords.length;
}

/**
 * Split a script line at a natural pause point (comma, period, semicolon,
 * em-dash, or mid-sentence). Returns 2+ shorter segments.
 */
function splitScriptLine(line: string): string[] {
  const words = line.split(/\s+/);
  if (words.length <= MAX_WORDS_PER_CLIP) return [line];

  // Try splitting at punctuation near the midpoint
  const mid = Math.floor(words.length / 2);
  const punctRe = /[,;.!?—–-]$/;
  let bestSplit = mid;
  let bestDist = Infinity;

  for (let i = Math.max(3, mid - 5); i < Math.min(words.length - 3, mid + 5); i++) {
    if (punctRe.test(words[i])) {
      const dist = Math.abs(i - mid);
      if (dist < bestDist) { bestDist = dist; bestSplit = i; }
    }
  }

  // If no punctuation found, split at midpoint
  const part1 = words.slice(0, bestSplit + 1).join(' ');
  const part2 = words.slice(bestSplit + 1).join(' ');

  // Recursively split if still too long
  return [...splitScriptLine(part1), ...splitScriptLine(part2)];
}

/**
 * Pre-process script lines: split any that are too long for a single 8s clip.
 * Average speaking rate ~2.5 words/sec → 20 words per 8s clip.
 */
function ensureLinesShortEnough(lines: string[]): string[] {
  const result: string[] = [];
  for (const line of lines) {
    const words = line.split(/\s+/).filter(Boolean);
    if (words.length > MAX_WORDS_PER_CLIP) {
      const splits = splitScriptLine(line);
      result.push(...splits);
    } else {
      result.push(line);
    }
  }
  return result;
}

// =============================================================================
// ASS subtitle builder (same as stage-compose.ts)
// =============================================================================

function formatAssTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}:${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
}

function buildAssSubtitles(lines: string[], clipDurations: number[], w = 720, h = 1280): string {
  const marginV = Math.round(h * 0.08);
  const header = [
    '[Script Info]',
    'ScriptType: v4.00+',
    `PlayResX: ${w}`,
    `PlayResY: ${h}`,
    'WrapStyle: 0',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: Caption,Arial,62,&H00FFFFFF,&H000000FF,&H00000000,&HAA000000,-1,0,0,0,100,100,0,0,1,3,1,2,40,40,${marginV},1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ].join('\n');

  let cursor = 0;
  const events = lines.map((line, i) => {
    const start = formatAssTime(cursor);
    cursor += clipDurations[i] ?? 8;
    const end = formatAssTime(cursor);
    const text = line.replace(/\\/g, '\\\\').replace(/{/g, '\\{').replace(/}/g, '\\}');
    return `Dialogue: 0,${start},${end},Caption,,0,0,0,,${text}`;
  }).join('\n');

  return `${header}\n${events}\n`;
}

// =============================================================================
// ffprobe duration helper
// =============================================================================

function getClipDuration(clipPath: string): number {
  try {
    const out = execSync(
      `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${clipPath}"`,
      { encoding: 'utf-8' }
    ).trim();
    return parseFloat(out) || 8;
  } catch {
    return 8;
  }
}

function getClipDimensions(clipPath: string): { w: number; h: number } {
  try {
    const out = execSync(
      `ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${clipPath}"`,
      { encoding: 'utf-8' }
    ).trim();
    const [w, h] = out.split(',').map(Number);
    return { w: w || 720, h: h || 1280 };
  } catch {
    return { w: 720, h: 1280 };
  }
}

// =============================================================================
// Main stage runner
// =============================================================================

export async function runStageLipsync(
  inputs: AngleInputs,
  outputDir: string,
  aspectRatio: string,
  force = false,
  characterOverride?: CharacterTraits,
  voiceOverride?: VoiceProfile
): Promise<StageResult> {
  const t0 = Date.now();
  const safeAspect = aspectRatio.replace(':', 'x');
  const finalPath = path.join(outputDir, `lipsync_${safeAspect}.mp4`);
  const assPath = path.join(outputDir, 'lipsync_captions.ass');
  const clipsDir = path.join(outputDir, 'lipsync_clips');
  const beforePath = path.join(outputDir, 'before.png');

  const falKey = getFalKey();
  const openAIKey = getOpenAIKey();
  console.log(`\n🗣️  Stage 2b: Veo 3.1 Lip-Sync — Native Speech Video [fal.ai]`);
  console.log(`   💡 fal.ai provider ($0.40/s with audio, no RPD quota)`);

  if (fs.existsSync(finalPath) && !force) {
    console.log(`   ⏭️  lipsync_${safeAspect}.mp4 exists`);
    return { status: 'done', outputs: [finalPath, assPath], durationMs: Date.now() - t0 };
  }
  fs.mkdirSync(clipsDir, { recursive: true });

  // Parse script lines + pre-split any that are too long for 8s clips
  const rawLines = inputs.voiceScript.split('\n').map((l) => l.trim()).filter(Boolean);
  if (rawLines.length === 0) {
    return { status: 'failed', outputs: [], error: 'voiceScript is empty' };
  }
  const scriptLines = ensureLinesShortEnough(rawLines);
  if (scriptLines.length !== rawLines.length) {
    console.log(`   ✂️  Pre-split: ${rawLines.length} lines → ${scriptLines.length} (long lines broken up)`);
  }

  // ── Character consistency: derive locked description from Imagen 4 before.png ──
  // GPT-4o vision reads the actual generated character image and returns a precise
  // description (age, hair, skin, clothing) that gets injected into EVERY clip prompt.
  // This is the key to visual consistency across clips — same words = same face.
  let characterDesc: string;
  let referenceImageUrl = ''; // fal.ai storage URL for first-frame anchoring

  if (fs.existsSync(beforePath) && openAIKey) {
    console.log(`   🖼️  Describing character from before.png...`);
    const visionDesc = await describeCharacterFromImage(beforePath, openAIKey);
    if (visionDesc) {
      characterDesc = visionDesc;
      console.log(`   ✅ Character locked: ${characterDesc.slice(0, 80)}...`);

      // Upload before.png to fal.ai storage so we can use first-frame anchoring
      // This gives Veo 3.1 a visual anchor for clip 1 — strongest consistency signal
      console.log(`   📤 Uploading reference image to fal.ai storage...`);
      referenceImageUrl = await uploadToFalStorage(beforePath, falKey);
      if (referenceImageUrl) {
        console.log(`   ✅ Reference image uploaded: ${referenceImageUrl.slice(0, 60)}...`);
      } else {
        console.log(`   ⚠️  Upload failed — will use text-to-video with locked description`);
      }
    } else {
      characterDesc = buildCharacterDescription(characterOverride ?? {
        age: '28', hair: 'natural hair, casually styled',
        clothing: 'a simple t-shirt or casual top',
        mannerisms: 'genuine, relatable energy, authentic UGC creator vibe',
      });
    }
  } else {
    characterDesc = buildCharacterDescription(characterOverride ?? {
      age: '28', hair: 'natural hair, casually styled',
      clothing: 'a simple t-shirt or casual top',
      mannerisms: 'genuine, relatable energy, authentic UGC creator vibe',
    });
  }

  // ── Setting: derive from offer inputs instead of hardcoding ──
  // Extract setting from beforeScenePrompt if available, else use a sensible default
  const settingDesc = inputs.beforeScenePrompt
    ? extractSettingFromPrompt(inputs.beforeScenePrompt)
    : 'a cozy home environment, warm natural window light, phone or laptop visible nearby';

  // Voice profile for accent/tone consistency across ALL clips
  const voiceProfileStr = buildVoiceProfile(voiceOverride ?? {
    accent: 'American, warm neutral',
    tone: 'confident, empathetic, not salesy',
    pace: 'conversational medium pace with natural pauses',
    quality: 'clear, warm, natural',
    gender: 'male',
    age: 'late 20s',
  });
  console.log(`   🎙️  Voice: ${voiceProfileStr.slice(0, 80)}...`);

  const pronoun = (characterOverride?.gender === 'female' || voiceOverride?.gender === 'female') ? 'She' : 'He';

  // Always rebuild prompts with the locked character description.
  // Pre-generated lipsyncPrompts from ai-inputs.ts used a generic character description
  // that won't match the actual before.png — so we always rebuild here to ensure
  // every clip gets the exact same locked character + setting injected.
  const lipsyncPrompts = scriptLines.map((line, i) =>
    buildLipsyncPrompt(line, characterDesc, settingDesc, i, scriptLines.length,
      { voiceProfile: voiceProfileStr, pronoun })
  );

  console.log(`   📋 ${scriptLines.length} lines → ${scriptLines.length} clips`);

  // Generate each clip
  const clipPaths: string[] = [];
  const clipDurations: number[] = [];
  let lastClipError = '';

  for (let i = 0; i < scriptLines.length; i++) {
    const clipPath = path.join(clipsDir, `clip_${String(i + 1).padStart(2, '0')}.mp4`);
    const opFile = path.join(clipsDir, `clip_${String(i + 1).padStart(2, '0')}_op.json`);

    if (fs.existsSync(clipPath) && !force) {
      console.log(`   ⏭️  clip_${i + 1} exists`);
      clipPaths.push(clipPath);
      clipDurations.push(getClipDuration(clipPath));
      continue;
    }

    console.log(`\n   🎬 Clip ${i + 1}/${scriptLines.length}: "${scriptLines[i].substring(0, 50)}..."`);

    try {
      let operationToken: string;  // Google op name OR fal.ai "endpoint::requestId"

      if (fs.existsSync(opFile)) {
        const saved = JSON.parse(fs.readFileSync(opFile, 'utf-8'));
        operationToken = saved.operationToken ?? saved.operationName; // support both formats
        const shortId = operationToken.includes('::') ? operationToken.split('::')[1].slice(0, 8) : operationToken.split('/').pop();
        console.log(`   ♻️  Resuming: ${shortId}`);
      } else {
        // Use reference image URL for first clip only — anchors the character visually.
        // Subsequent clips use the locked text description for consistency.
        const useImageAnchor = i === 0 && referenceImageUrl;
        if (useImageAnchor) {
          console.log(`   📡 Submitting clip ${i + 1} via fal.ai [image-anchored]...`);
        } else {
          console.log(`   📡 Submitting clip ${i + 1} via fal.ai...`);
        }
        operationToken = await submitFalClip(
          lipsyncPrompts[i], aspectRatio, falKey,
          useImageAnchor ? referenceImageUrl : undefined
        );
        fs.writeFileSync(opFile, JSON.stringify({
          operationToken, provider: 'fal.ai',
          submittedAt: new Date().toISOString(),
          imageAnchored: !!useImageAnchor,
        }, null, 2));
        const shortId = operationToken.split('::')[1]?.slice(0, 8) ?? operationToken.slice(0, 8);
        console.log(`   ✅ Submitted: ${shortId}`);
      }

      console.log(`   ⏳ Polling...`);
      const buf = await pollFalClip(operationToken, falKey);
      fs.writeFileSync(clipPath, buf);
      const dur = getClipDuration(clipPath);
      clipDurations.push(dur);
      clipPaths.push(clipPath);
      console.log(`   ✅ clip_${i + 1}.mp4 (${(buf.length / 1024 / 1024).toFixed(1)}MB, ${dur.toFixed(1)}s)`);

      // Verify script completion via Whisper transcription
      const oaiKey = getOpenAIKey();
      if (oaiKey) {
        const transcription = await transcribeClip(clipPath, oaiKey);
        if (transcription) {
          const overlap = calculateWordOverlap(scriptLines[i], transcription);
          const pct = (overlap * 100).toFixed(0);
          if (overlap >= COMPLETION_THRESHOLD) {
            console.log(`   🎯 Script ${pct}% complete ✔`);
          } else {
            console.log(`   ⚠️  Script only ${pct}% complete — expected: "${scriptLines[i].slice(0, 60)}"`);
            console.log(`      Heard: "${transcription.slice(0, 60)}"`);

            // Auto-retry: split the line shorter and regenerate
            let retrySuccess = false;
            for (let retry = 0; retry < MAX_CLIP_RETRIES && !retrySuccess; retry++) {
              const subLines = splitScriptLine(scriptLines[i]);
              if (subLines.length <= 1) break; // can't split further

              console.log(`   🔄 Retry ${retry + 1}: splitting into ${subLines.length} shorter segments`);

              // Remove the failed clip
              clipPaths.pop();
              clipDurations.pop();
              if (fs.existsSync(clipPath)) fs.unlinkSync(clipPath);
              if (fs.existsSync(opFile)) fs.unlinkSync(opFile);

              // Generate sub-clips for each split segment
              let allSubsOk = true;
              for (let si = 0; si < subLines.length; si++) {
                const subIdx = `${String(i + 1).padStart(2, '0')}_${String(si + 1).padStart(2, '0')}`;
                const subClipPath = path.join(clipsDir, `clip_${subIdx}.mp4`);
                const subOpFile = path.join(clipsDir, `clip_${subIdx}_op.json`);
                const subPrompt = buildLipsyncPrompt(subLines[si], characterDesc, settingDesc, i + si, scriptLines.length + subLines.length,
                  { voiceProfile: voiceProfileStr, pronoun });

                console.log(`      🎬 Sub-clip ${si + 1}/${subLines.length}: "${subLines[si].slice(0, 40)}..."`);
                try {
                  const subOp = await submitFalClip(subPrompt, aspectRatio, falKey);
                  fs.writeFileSync(subOpFile, JSON.stringify({ operationToken: subOp, provider: 'fal.ai' }, null, 2));
                  const subBuf = await pollFalClip(subOp, falKey);
                  fs.writeFileSync(subClipPath, subBuf);
                  const subDur = getClipDuration(subClipPath);
                  clipPaths.push(subClipPath);
                  clipDurations.push(subDur);

                  // Verify sub-clip
                  const subTx = await transcribeClip(subClipPath, oaiKey);
                  const subOvl = subTx ? calculateWordOverlap(subLines[si], subTx) : 1;
                  console.log(`      ✅ (${(subOvl * 100).toFixed(0)}% match)`);
                } catch (subErr: any) {
                  console.log(`      ❌ Sub-clip failed: ${subErr.message}`);
                  allSubsOk = false;
                  break;
                }
                if (si < subLines.length - 1) await new Promise((r) => setTimeout(r, 2000));
              }

              // Update the scriptLines array to reflect the split
              if (allSubsOk) {
                scriptLines.splice(i, 1, ...subLines);
                retrySuccess = true;
              }
            }

            if (!retrySuccess) {
              console.log(`   ⚠️  Keeping truncated clip (best effort)`);
            }
          }
        }
      }

      // Small delay between submissions to avoid rate limiting
      if (i < scriptLines.length - 1) await new Promise((r) => setTimeout(r, 2000));
    } catch (err: any) {
      console.log(`   ❌ Clip ${i + 1} failed: ${err.message}`);
      lastClipError = err.message;
      // If quota exhausted, stop trying remaining clips immediately
      if (err.message.includes('429')) break;
      // Continue with remaining clips — partial output is still useful
    }
  }

  if (clipPaths.length === 0) {
    return { status: 'failed', outputs: [], durationMs: Date.now() - t0, error: `All clips failed: ${lastClipError}` };
  }

  // Write ffmpeg concat list — use absolute paths so ffmpeg resolves correctly
  const concatFile = path.join(clipsDir, 'concat.txt');
  fs.writeFileSync(concatFile, clipPaths.map((p) => `file '${path.resolve(p)}'`).join('\n'));

  // Get dimensions from first clip
  const { w, h } = getClipDimensions(clipPaths[0]);

  // Write ASS captions timed to actual clip durations
  const successLines = scriptLines.slice(0, clipPaths.length);
  fs.writeFileSync(assPath, buildAssSubtitles(successLines, clipDurations, w, h), 'utf-8');
  const assEscaped = assPath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/ /g, '\\ ');

  // Stitch clips + burn captions
  console.log(`\n   🔗 Stitching ${clipPaths.length} clip(s) + burning captions...`);
  try {
    const stitchedPath = path.join(clipsDir, 'stitched.mp4');

    if (clipPaths.length === 1) {
      // Single clip — skip concat, just copy directly
      fs.copyFileSync(clipPaths[0], stitchedPath);
    } else {
      // Multiple clips — concat (streams must be compatible)
      execSync(
        `ffmpeg -y -f concat -safe 0 -i "${path.resolve(concatFile)}" -c copy "${stitchedPath}"`,
        { stdio: 'pipe' }
      );
    }

    // Burn ASS captions using absolute path to avoid cwd issues
    const absAss = path.resolve(assPath).replace(/\\/g, '/').replace(/:/g, '\\:').replace(/ /g, '\\ ');
    execSync(
      `ffmpeg -y -i "${stitchedPath}" -vf "ass='${absAss}'" -c:v libx264 -preset fast -crf 20 -c:a aac -b:a 192k -movflags +faststart "${finalPath}"`,
      { stdio: 'pipe' }
    );

    const mb = (fs.statSync(finalPath).size / 1024 / 1024).toFixed(1);
    const totalDur = clipDurations.reduce((a, b) => a + b, 0);
    console.log(`   ✅ lipsync_${safeAspect}.mp4 (${mb}MB, ${totalDur.toFixed(1)}s total, ${clipPaths.length} clips)`);

    return {
      status: clipPaths.length < scriptLines.length ? 'done' : 'done',
      outputs: [finalPath, assPath],
      durationMs: Date.now() - t0,
    };
  } catch (err: any) {
    const stderr = err.stderr?.toString() || err.message;
    return {
      status: 'failed',
      outputs: clipPaths,
      durationMs: Date.now() - t0,
      error: `ffmpeg stitch: ${stderr.slice(-400)}`,
    };
  }
}
