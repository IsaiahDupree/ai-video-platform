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
import { postProcessClip, detectBurnedSubtitles, type AmbientNoiseType } from './post-process-clip.js';
import { loadCharacterPack, selectCharacter, buildPackCharacterDescription, getConsistencyBlocks, getAnglePromptBlock, getUnghostingContext } from './character-pack.js';

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
  options?: { voiceProfile?: string; shotDescription?: string; pronoun?: string; consistencyBlock?: string; negativeBlock?: string; angleContext?: string }
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
    // 'Fictional character' framing prevents Veo3 safety refusals on real-person depiction
    `A selfie-style UGC video clip featuring a fictional character: ${characterDescription}. Setting: ${setting}.`,
    shot,
    // Timestamp prompting for hook + delivery structure
    `[00:00-00:0${hookSec}] Close-up on face, ${expression}, takes a natural breath before speaking.`,
    // CRITICAL: explicit voiceover-in-prompt — forces character to say the exact line with no pauses
    `[00:0${hookSec}-00:0${endSec}] ${pronoun} speaks directly to camera and says the following sentence completely, word for word, with no pauses or hesitations: "${cleanLine}" ${endGesture}.`,
    // Reinforce: the character MUST complete the full sentence
    `The character speaks the ENTIRE sentence "${cleanLine}" — every word, no truncation, no trailing off.`,
  ];

  // Voice profile for accent/tone consistency across ALL clips
  if (options?.voiceProfile) {
    parts.push(`Voice: ${options.voiceProfile}.`);
  }

  // Angle/context layer from character pack (e.g. "holding phone, glancing at old message thread")
  if (options?.angleContext) {
    parts.push(`Context: ${options.angleContext}.`);
  }

  parts.push(
    // Audio spec — explicit environment prevents hallucinations
    `Audio: close microphone pickup, warm acoustic properties, minimal background noise, no studio audience, no background music, no speaking pauses longer than 0.2 seconds.`,
    // Repeat character at end — reinforces consistency, reduces clip-to-clip drift
    `IMPORTANT: The character must be exactly ${characterDescription} throughout the entire clip. Same face, same hair, same clothing as described. No character changes.`,
    // Quality + subtitle prevention — multiple negations for stubborn cases
    `The image is slightly grainy, looks very film-like, authentic UGC style. No subtitles. No on-screen text whatsoever. No captions. No burned-in text of any kind.`,
  );

  // Character pack consistency block — reinforces identity lock across clips
  if (options?.consistencyBlock) {
    parts.push(options.consistencyBlock);
  }

  // Character pack negative block — prevents common drift patterns
  if (options?.negativeBlock) {
    parts.push(`Avoid: ${options.negativeBlock}.`);
  }

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
      messages: [
        {
          role: 'system',
          content: 'You are a creative director writing character descriptions for AI video generation prompts. Your task is to describe the visual appearance of a fictional character depicted in a reference image so that an AI video model can recreate a consistent character across multiple clips. Focus only on observable visual attributes: approximate age range, gender presentation, hair color and style, skin tone, clothing color and type, and one distinguishing feature. Output a single dense description string with no labels, no bullet points, no identifying information.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe the character\'s visual appearance for an AI video generation prompt. Format: single dense string. Example: "Late-20s man, short dark brown hair, medium skin tone, wearing a navy blue crewneck sweater, slight stubble, relaxed confident expression". Only visual attributes — no names, no background details.',
            },
            { type: 'image_url', image_url: { url: `data:image/${ext};base64,${b64}`, detail: 'low' } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) return '';
  const result = await res.json() as any;
  const desc = result.choices?.[0]?.message?.content?.trim() ?? '';
  // Reject refusal responses — don't cache them
  const isRefusal = /i('m| am) sorry|can't help|cannot help|i'm unable|not able to/i.test(desc);
  if (desc && !isRefusal) fs.writeFileSync(cacheFile, desc, 'utf-8');
  return isRefusal ? '' : desc;
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
    const initiateRes = await fetch('https://rest.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3', {
      method: 'POST',
      headers: { 'Authorization': `Key ${falKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_name: fileName, content_type: 'image/png' }),
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
 * Submit a video clip via fal.ai queue API.
 * validateMode=true uses Kling 2.6 Pro (~$0.07-0.14/s) instead of Veo 3.1 ($0.40/s)
 * for cheap dry-run validation of prompts, character lock, and gate logic.
 * If imageUrl is provided (Veo only), uses first-last-frame-to-video for visual anchoring.
 * Returns a request_id used for polling.
 */
async function submitFalClip(
  prompt: string,
  aspectRatio: string,
  falKey: string,
  imageUrl?: string,
  validateMode = false,
  lastFrameUrl?: string,
): Promise<string> {
  // Validate mode: use Kling 2.6 Pro — much cheaper, good enough to test prompts/gate
  if (validateMode) {
    const endpoint = 'fal-ai/kling-video/v2.6/pro/text-to-video';
    const body: Record<string, unknown> = {
      prompt,
      aspect_ratio: aspectRatio === '9:16' ? '9:16' : aspectRatio,
      duration: '5',  // Kling uses seconds as number string, 5s = cheaper
      cfg_scale: 0.5,
    };
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
    return `${endpoint}::${result.request_id}`;
  }

  // Production mode: Veo 3.1
  // Use first-last-frame endpoint when we have at least a start frame
  const hasFirst = !!imageUrl && imageUrl.startsWith('https://');
  const hasLast  = !!lastFrameUrl && lastFrameUrl.startsWith('https://');
  const useImageEndpoint = hasFirst || hasLast;
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
  // first-last-frame endpoint requires BOTH fields — fall back to text-only if only one
  if (hasFirst && hasLast) {
    body.first_frame_url = imageUrl;
    body.last_frame_url  = lastFrameUrl;
  } else if (hasFirst) {
    body.first_frame_url = imageUrl;
  } else if (hasLast) {
    body.last_frame_url = lastFrameUrl;
  }

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
  // fal.ai status/result URLs use only the base model path (first two segments: org/model)
  // e.g. "fal-ai/kling-video/v2.6/pro/text-to-video" → "fal-ai/kling-video"
  //      "fal-ai/veo3.1" → "fal-ai/veo3.1"
  const baseModel = endpoint.split('/').slice(0, 2).join('/');
  const statusUrl = `https://queue.fal.run/${baseModel}/requests/${requestId}/status`;
  const resultUrl = `https://queue.fal.run/${baseModel}/requests/${requestId}`;
  const start = Date.now();

  while (Date.now() - start < 2_700_000) {  // 45 min — Kling queue can be very long
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
  throw new Error('fal.ai clip timed out after 45 minutes');
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
  voiceOverride?: VoiceProfile,
  validateMode = false,
): Promise<StageResult> {
  const t0 = Date.now();
  const safeAspect = aspectRatio.replace(':', 'x');
  const finalPath = path.join(outputDir, `lipsync_${safeAspect}.mp4`);
  const assPath = path.join(outputDir, 'lipsync_captions.ass');
  const clipsDir = path.join(outputDir, 'lipsync_clips');
  const beforePath = path.join(outputDir, 'before.png');

  const falKey = getFalKey();
  const openAIKey = getOpenAIKey();
  if (validateMode) {
    console.log(`\n🗣️  Stage 2b: Kling 2.6 Pro — Validate Mode [fal.ai]`);
    console.log(`   💡 VALIDATE MODE: Kling 2.6 Pro ~$0.07-0.14/s (vs Veo3.1 $0.40/s) — 5s clips`);
    console.log(`   💡 Use this to validate prompts, character lock, and gate before Veo3.1 spend`);
  } else {
    console.log(`\n🗣️  Stage 2b: Veo 3.1 Lip-Sync — Native Speech Video [fal.ai]`);
    console.log(`   💡 fal.ai provider ($0.40/s with audio, no RPD quota)`);
  }

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

  // ── Character consistency: 3-image anchor strategy ──────────────────────────
  // Upload before.png (start), character_sheet.png (middle), after.png (end) to
  // fal.ai storage. Each clip gets first_frame_url + last_frame_url so Veo 3.1
  // interpolates between two pinned frames — the character stays visually locked.
  //
  // Anchor assignment per clip:
  //   Clip 1        : first=before,  last=sheet   (hook — character introduced)
  //   Clips 2..N-1  : first=sheet,   last=sheet   (body — same face both ends)
  //   Clip N (last) : first=sheet,   last=after   (payoff — transformation)
  //   Single clip   : first=before,  last=after   (full arc in one clip)
  // ─────────────────────────────────────────────────────────────────────────────

  // ── Character Pack integration ─────────────────────────────────────────────
  // Load AD_CHARACTER_PACK.json for identity-locked character descriptions,
  // consistency blocks, negative blocks, and angle-specific context prompts.
  // Falls back gracefully to GPT-4o vision → generic description if pack not found.
  const pack = loadCharacterPack();
  let packConsistencyBlock = '';
  let packNegativeBlock = '';
  let packAngleContext = '';
  let packCharacterId = '';

  const audienceCategory = (inputs as any).audienceCategory as string ?? '';
  const awarenessStage = (inputs as any).awarenessStage as string ?? '';

  if (pack) {
    const preferredGender = (inputs as any).characterGender === 'woman' ? 'female'
      : (inputs as any).characterGender === 'man' ? 'male'
      : (inputs as any).voiceGender ?? undefined;
    const preferredCharacterId = (inputs as any).preferredCharacterId as string ?? undefined;
    const selectedChar = selectCharacter(pack, audienceCategory, awarenessStage, preferredGender, preferredCharacterId);
    packCharacterId = selectedChar.id;
    console.log(`   🎭 Character pack: ${selectedChar.name} (${selectedChar.id}) — ${selectedChar.archetype}`);

    const blocks = getConsistencyBlocks(pack.globals);
    packConsistencyBlock = blocks.consistencyBlock;
    packNegativeBlock = blocks.negativeBlock;

    if (audienceCategory) {
      packAngleContext = getAnglePromptBlock(pack, audienceCategory);
      const ugContext = getUnghostingContext(pack, audienceCategory);
      if (ugContext) packAngleContext = `${packAngleContext}. ${ugContext}`;
    }
  }
  // ─────────────────────────────────────────────────────────────────────────────

  let characterDesc: string;
  let anchorUrls = { before: '', sheet: '', after: '' };

  // Character description priority:
  //   1. Character pack identity_prompt_block (if pack + character found) — MOST RELIABLE
  //      This is the locked identity from AD_CHARACTER_PACK.json, ensuring the same
  //      character across character_sheet, before.png, and all video clips.
  //   2. GPT-4o vision description of before.png (fallback if no pack)
  //   3. Generic description (last resort)
  //
  // Previously: vision was primary → caused character mismatch when before.png
  // generated a different person than character_sheet.png.
  if (pack && packCharacterId) {
    const packChar = pack.characters.find(c => c.id === packCharacterId);
    if (packChar) {
      characterDesc = buildPackCharacterDescription(packChar);
      console.log(`   ✅ Character locked (pack): ${characterDesc.slice(0, 80)}...`);
    } else {
      characterDesc = buildCharacterDescription(characterOverride ?? {
        age: '28', hair: 'natural hair, casually styled',
        clothing: 'a simple t-shirt or casual top',
        mannerisms: 'genuine, relatable energy, authentic UGC creator vibe',
      });
    }
  } else if (fs.existsSync(beforePath) && openAIKey) {
    // No character pack — fall back to describing what's actually in before.png
    console.log(`   🖼️  Describing character from before.png (no pack)...`);
    const visionDesc = await describeCharacterFromImage(beforePath, openAIKey);
    if (visionDesc) {
      characterDesc = visionDesc;
      console.log(`   ✅ Character locked (vision): ${characterDesc.slice(0, 80)}...`);
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

  // Upload all 3 anchor images in parallel
  if (!validateMode) {
    console.log(`   📤 Uploading 3 anchor images to fal.ai storage...`);
    const sheetPath = path.join(outputDir, 'character_sheet.png');
    const afterPath  = path.join(outputDir, 'after.png');
    const [beforeUrl, sheetUrl, afterUrl] = await Promise.all([
      fs.existsSync(beforePath) ? uploadToFalStorage(beforePath, falKey) : Promise.resolve(''),
      fs.existsSync(sheetPath)  ? uploadToFalStorage(sheetPath,  falKey) : Promise.resolve(''),
      fs.existsSync(afterPath)  ? uploadToFalStorage(afterPath,  falKey) : Promise.resolve(''),
    ]);
    anchorUrls = { before: beforeUrl, sheet: sheetUrl, after: afterUrl };
    const uploaded = [beforeUrl && 'before', sheetUrl && 'sheet', afterUrl && 'after'].filter(Boolean);
    if (uploaded.length > 0) {
      console.log(`   ✅ Uploaded: ${uploaded.join(', ')} — 3-image anchor active`);
    } else {
      console.log(`   ⚠️  All uploads failed — falling back to text-only generation`);
    }
  }

  // ── Setting: derive from offer inputs instead of hardcoding ──
  // Extract setting from beforeScenePrompt if available, else use a sensible default
  const settingDesc = inputs.beforeScenePrompt
    ? extractSettingFromPrompt(inputs.beforeScenePrompt)
    : 'a cozy home environment, warm natural window light, phone or laptop visible nearby';

  // Voice profile — read gender/age from offer if not overridden
  const offerVoiceGender = (inputs as any).voiceGender ?? 'male';
  const offerVoiceAge   = (inputs as any).voiceAge   ?? 'late 20s';
  const voiceProfileStr = buildVoiceProfile(voiceOverride ?? {
    accent: 'American, warm neutral',
    tone: 'confident, empathetic, not salesy',
    pace: 'conversational medium pace with natural pauses',
    quality: 'clear, warm, natural',
    gender: offerVoiceGender,
    age: offerVoiceAge,
  });
  console.log(`   🎙️  Voice: ${voiceProfileStr.slice(0, 80)}...`);

  const pronoun = (characterOverride?.gender === 'female' || voiceOverride?.gender === 'female' || offerVoiceGender === 'female') ? 'She' : 'He';

  // Always rebuild prompts with the locked character description.
  // Pre-generated lipsyncPrompts from ai-inputs.ts used a generic character description
  // that won't match the actual before.png — so we always rebuild here to ensure
  // every clip gets the exact same locked character + setting injected.
  // Now also injects character pack consistency/negative/angle blocks.
  const lipsyncPrompts = scriptLines.map((line, i) =>
    buildLipsyncPrompt(line, characterDesc, settingDesc, i, scriptLines.length, {
      voiceProfile: voiceProfileStr,
      pronoun,
      consistencyBlock: packConsistencyBlock || undefined,
      negativeBlock: packNegativeBlock || undefined,
      angleContext: packAngleContext || undefined,
    })
  );

  console.log(`   📋 ${scriptLines.length} lines → ${scriptLines.length} clips`);

  // Generate each clip
  const clipPaths: string[] = [];
  const clipDurations: number[] = [];
  let lastClipError = '';
  // Clip chaining: store the fal.ai URL of the last frame from the previous clip
  // so the next clip starts exactly where the previous one ended (temporal consistency).
  let chainedLastFrameUrl = '';

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
        // Hybrid anchor strategy: 3-image anchors + clip chaining
        //   Clip 1        : first=before,              last=sheet
        //   Clips 2..N-1  : first=chainedLastFrame,    last=sheet   (chained!)
        //   Clip N (last) : first=chainedLastFrame,    last=after   (chained!)
        //   Single clip   : first=before,              last=after
        // Clip chaining (research: FAL_CHARACTER_CONSISTENCY_DEEP_DIVE.md):
        //   Extract last frame of clip N → use as start frame for clip N+1
        //   This eliminates the "jump" between clips and preserves temporal consistency.
        const n = scriptLines.length;
        const isFirst = i === 0;
        const isLast  = i === n - 1;
        const isSingle = n === 1;
        let firstUrl: string | undefined;
        let lastUrl:  string | undefined;
        if (!validateMode) {
          if (isSingle) {
            firstUrl = anchorUrls.before || undefined;
            lastUrl  = anchorUrls.after  || undefined;
          } else if (isFirst) {
            firstUrl = anchorUrls.before || anchorUrls.sheet || undefined;
            lastUrl  = anchorUrls.sheet  || undefined;
          } else if (isLast) {
            // Prefer chained last frame from previous clip over static sheet
            firstUrl = chainedLastFrameUrl || anchorUrls.sheet || undefined;
            lastUrl  = anchorUrls.after  || anchorUrls.sheet || undefined;
          } else {
            // Prefer chained last frame from previous clip over static sheet
            firstUrl = chainedLastFrameUrl || anchorUrls.sheet || undefined;
            lastUrl  = anchorUrls.sheet  || undefined;
          }
        }
        const anchorLabel = firstUrl && lastUrl ? '[first+last anchored]'
          : firstUrl ? '[first anchored]' : '';
        console.log(`   📡 Submitting clip ${i + 1}/${n} via fal.ai ${anchorLabel}...`);
        operationToken = await submitFalClip(
          lipsyncPrompts[i], aspectRatio, falKey,
          firstUrl,
          validateMode,
          lastUrl,
        );
        fs.writeFileSync(opFile, JSON.stringify({
          operationToken, provider: 'fal.ai',
          submittedAt: new Date().toISOString(),
          anchorStrategy: anchorLabel || 'text-only',
        }, null, 2));
        const shortId = operationToken.split('::')[1]?.slice(0, 8) ?? operationToken.slice(0, 8);
        console.log(`   ✅ Submitted: ${shortId}`);
      }

      console.log(`   ⏳ Polling...`);
      let buf: Buffer;
      try {
        buf = await pollFalClip(operationToken, falKey);
      } catch (pollErr: any) {
        // Delete op.json so next run re-submits fresh (timed-out/failed requests can't be resumed)
        if (fs.existsSync(opFile)) fs.unlinkSync(opFile);
        throw pollErr;
      }
      fs.writeFileSync(clipPath, buf);

      // ── Post-processing: speed up + ambient noise + subtitle removal ──────────
      // Research finding: 1.4x speed removes AI "thinking pauses"; ambient noise
      // masks synthetic voice artifacts; subtitle crop removes Veo 3 burn-in bug.
      try {
        const hasBurnedSubs = detectBurnedSubtitles(clipPath);
        if (hasBurnedSubs) {
          console.log(`   ⚠️  Burned subtitles detected in clip_${i + 1} — cropping bottom 8%`);
        }
        const ambientType = ((inputs as any).ambientNoiseType as AmbientNoiseType) ?? 'office';
        const speedFactor = ((inputs as any).speedFactor as number) ?? 1.4;
        await postProcessClip(clipPath, {
          speedFactor,
          ambientNoise: ambientType,
          ambientNoiseVolume: -28,
          cropSubtitleArea: hasBurnedSubs,
        });
        console.log(`   🎛️  Post-processed: ${speedFactor}x speed + ambient noise`);
      } catch (ppErr: any) {
        console.log(`   ⚠️  Post-process skipped: ${ppErr.message?.substring(0, 80)}`);
      }
      // ─────────────────────────────────────────────────────────────────────────

      const dur = getClipDuration(clipPath);
      clipDurations.push(dur);
      clipPaths.push(clipPath);
      console.log(`   ✅ clip_${i + 1}.mp4 (${(buf.length / 1024 / 1024).toFixed(1)}MB, ${dur.toFixed(1)}s)`);

      // ── Clip chaining: extract last frame → upload for next clip's start frame ──
      // Research: FAL_CHARACTER_CONSISTENCY_DEEP_DIVE.md — Layer 3: Temporal Consistency
      // "Extract last frame of clip N → use as start_image_url for clip N+1"
      if (i < scriptLines.length - 1 && !validateMode) {
        try {
          const lastFramePath = path.join(clipsDir, `clip_${String(i + 1).padStart(2, '0')}_lastframe.png`);
          execSync(`ffmpeg -y -sseof -0.05 -i "${clipPath}" -frames:v 1 "${lastFramePath}" 2>/dev/null`, { stdio: 'pipe' });
          if (fs.existsSync(lastFramePath)) {
            const chainUrl = await uploadToFalStorage(lastFramePath, falKey);
            if (chainUrl) {
              chainedLastFrameUrl = chainUrl;
              console.log(`   🔗 Clip chaining: last frame uploaded for clip ${i + 2} start`);
            }
          }
        } catch {
          // Non-fatal — chaining is best-effort, falls back to sheet anchor
        }
      }
      // ─────────────────────────────────────────────────────────────────────────

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
                  const subOp = await submitFalClip(subPrompt, aspectRatio, falKey, undefined, validateMode);
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
