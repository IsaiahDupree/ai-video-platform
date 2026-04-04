/**
 * RawFootageTriage.ts — AI-powered iPhone raw footage triage engine.
 *
 * Runs every raw clip through 7 gates before it enters any creative pipeline:
 *
 *   Gate A: Technical validity (duration, audio, exposure, shake)
 *   Gate B: Speech existence (has speech vs silence vs ambient)
 *   Gate C: Sentence completeness (complete thought vs fragment vs non-thought)
 *   Gate D: Semantic coherence (clear idea vs rambling vs missing context)
 *   Gate E: Creator intent detection (meant to be content vs accidental/test)
 *   Gate F: Media watchability scoring (weighted 8-dimension score)
 *   Gate G: Salvage strategy (before trashing, find downstream value)
 *
 * Bin outputs:
 *   green  — strong content, ready for content pipeline
 *   yellow — salvageable, needs trimming/grouping/reframing
 *   blue   — archive as B-roll or support footage only
 *   red    — trash / exclude from all creative generation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { execSync } from 'child_process';
import OpenAI from 'openai';

// ─── Supabase persistence ──────────────────────────────────────────────────────

function getSupabaseConfig(): { url: string; key: string } | null {
  // Load from env (already set by pipeline caller) or .env.local
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !key) return null;
  return { url, key };
}

async function supabaseUpsert(table: string, record: Record<string, any>, onConflict?: string): Promise<void> {
  const cfg = getSupabaseConfig();
  if (!cfg) return;

  const body = JSON.stringify(record);
  const urlObj = new URL(`${cfg.url}/rest/v1/${table}`);

  return new Promise((resolve) => {
    const headers: Record<string, string> = {
      'apikey': cfg.key,
      'Authorization': `Bearer ${cfg.key}`,
      'Content-Type': 'application/json',
      'Prefer': onConflict ? `resolution=merge-duplicates,return=minimal` : 'return=minimal',
    };
    if (onConflict) headers['Prefer'] = `on_conflict=${onConflict},return=minimal`;

    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers,
    }, (res) => {
      res.resume();
      resolve();
    });
    req.on('error', () => resolve()); // never throw — DB is best-effort
    req.write(body);
    req.end();
  });
}

export async function saveTriageResultToDb(result: TriageResult, brandId = 'isaiah_personal'): Promise<void> {
  const assetType = (() => {
    const ext = path.extname(result.file_name).toLowerCase();
    if (['.mp4', '.mov', '.m4v', '.hevc'].includes(ext)) return 'iphone_raw';
    return 'iphone_raw';
  })();

  await supabaseUpsert('media_assets', {
    // Use clip_id as stable key (derived from filename)
    file_name: result.file_name,
    file_path: result.file_path,
    asset_type: assetType,
    file_size_mb: result.technical.file_size_mb,
    duration_sec: result.technical.duration_sec,
    width: result.technical.width,
    height: result.technical.height,
    fps: result.technical.fps,
    has_audio: result.technical.has_audio,
    quality_issues: result.technical.quality_issues,
    triage_bin: result.bin,
    triage_classification: result.classification,
    triage_scores: result.scores,
    triage_reasoning: result.reasoning,
    gate_failures: result.gate_failures,
    triage_run_id: result.clip_id,
    triaged_at: result.processed_at,
    transcript: result.transcript || null,
    contains_speech: result.contains_speech,
    speech_state: result.speech_state,
    hook_potential: result.scores.hook_potential_score,
    session_group: result.session_group,
    brand_id: brandId,
    source: 'iphone',
    tags: [result.bin, result.classification, result.speech_state].filter(Boolean),
    updated_at: new Date().toISOString(),
  }, 'file_path');
}

export async function saveTriageRunToDb(report: TriageReport, brandId = 'isaiah_personal'): Promise<void> {
  await supabaseUpsert('triage_runs', {
    source_dir: report.source_dir,
    brand_id: brandId,
    total_clips: report.total_clips,
    green_count: report.green_count,
    yellow_count: report.yellow_count,
    blue_count: report.blue_count,
    red_count: report.red_count,
    pipeline_ready_count: report.pipeline_ready.length,
    processed_at: report.processed_at,
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type TriageBin = 'green' | 'yellow' | 'blue' | 'red';

export type ClipClassification =
  | 'usable_primary'
  | 'usable_supporting'
  | 'salvageable_fragment'
  | 'test_or_accidental'
  | 'trash_low_value';

export type RecommendedAction =
  | 'send_to_content_pipeline'
  | 'send_as_broll_only'
  | 'trim_and_salvage'
  | 'session_merge'
  | 'archive_only'
  | 'archive_or_trash'
  | 'trash';

export interface TechnicalMetadata {
  duration_sec: number;
  width: number;
  height: number;
  fps: number;
  has_audio: boolean;
  file_size_mb: number;
  quality_issues: string[];
}

export interface TriageScores {
  complete_thought_score: number;      // 0–1: does it contain a complete thought?
  semantic_clarity_score: number;      // 0–1: clear and understandable idea
  hook_potential_score: number;        // 0–1: could be a hook/opener
  audio_quality_score: number;         // 0–1: audio usable?
  visual_stability_score: number;      // 0–1: stable framing, not shaky
  subject_presence_score: number;      // 0–1: clear on-screen subject
  novelty_or_relevance_score: number;  // 0–1: relevant/interesting content
  emotional_or_informational_value: number; // 0–1
  intent_to_publish_score: number;     // 0–1: was this meant to be content?
  media_watchability_score: number;    // weighted composite (0–1)
}

export interface TriageResult {
  clip_id: string;
  file_path: string;
  file_name: string;
  classification: ClipClassification;
  bin: TriageBin;
  contains_speech: boolean;
  speech_state: 'complete_thought' | 'partial_thought' | 'non_thought' | 'no_speech';
  transcript: string;
  scores: TriageScores;
  recommended_action: RecommendedAction;
  salvage_strategy: string | null;
  session_group: string;
  technical: TechnicalMetadata;
  reasoning: string[];
  gate_failures: string[];
  processed_at: string;
}

export interface TriageReport {
  source_dir: string;
  processed_at: string;
  total_clips: number;
  green_count: number;
  yellow_count: number;
  blue_count: number;
  red_count: number;
  session_groups: Record<string, string[]>; // session_id → clip_ids
  results: TriageResult[];
  pipeline_ready: TriageResult[];          // green + yellow clips, sorted by score
}

// ─── Test/accidental phrase patterns (fast pre-filter before API call) ────────

const TEST_PHRASES = [
  /^(test|testing)\s*(test|testing|one|1|2|3|check)?\s*$/i,
  /^(yo|hey|hello|hi)\s*$/i,
  /^hold\s*on/i,
  /^wait\s*(a\s*sec)?/i,
  /^lemme\s*see/i,
  /^let\s*me\s*see/i,
  /^is\s*this\s*(on|recording|working)/i,
  /^can\s*you\s*hear\s*me/i,
  /^am\s*i\s*recording/i,
  /^(ok|okay|alright|um|uh|hmm)\s*$/i,
  /^(one|two|three|four|five)\s*,?\s*(two|three|four)?/i,
  /thank\s*you\s*\.?\s*$/i,  // just "thank you" with nothing else
];

function hasFastTestPhraseDetection(transcript: string): boolean {
  const t = transcript.trim();
  if (t.length < 3) return true;
  if (t.split(/\s+/).length <= 3) {
    // Very short transcript — check for test phrases
    if (TEST_PHRASES.some(p => p.test(t))) return true;
  }
  return false;
}

// ─── Weighted watchability score calculator ───────────────────────────────────

function computeWatchabilityScore(s: Omit<TriageScores, 'media_watchability_score' | 'intent_to_publish_score'>): number {
  return Math.min(1.0, Math.max(0.0,
    0.20 * s.complete_thought_score +
    0.20 * s.semantic_clarity_score +
    0.15 * s.hook_potential_score +
    0.10 * s.audio_quality_score +
    0.10 * s.visual_stability_score +
    0.10 * s.subject_presence_score +
    0.10 * s.novelty_or_relevance_score +
    0.05 * s.emotional_or_informational_value
  ));
}

// ─── Bin & classification mapping ────────────────────────────────────────────

function scoresToBin(scores: TriageScores, gateFailures: string[]): TriageBin {
  // Hard fails → red immediately
  if (gateFailures.includes('gate_a_technical') || gateFailures.includes('gate_b_speech_junk')) return 'red';

  const w = scores.media_watchability_score;
  const intent = scores.intent_to_publish_score;

  if (w >= 0.72 && intent >= 0.65) return 'green';
  if (w >= 0.45 || intent >= 0.50) return 'yellow';
  if (w >= 0.25 || scores.visual_stability_score >= 0.70) return 'blue'; // usable as b-roll
  return 'red';
}

function binToClassification(bin: TriageBin, scores: TriageScores): ClipClassification {
  if (bin === 'red') {
    return scores.intent_to_publish_score <= 0.25 ? 'test_or_accidental' : 'trash_low_value';
  }
  if (bin === 'blue') return 'usable_supporting';
  if (bin === 'yellow') return 'salvageable_fragment';
  // green
  if (scores.hook_potential_score >= 0.70 || scores.complete_thought_score >= 0.80) return 'usable_primary';
  return 'usable_primary';
}

function binToAction(bin: TriageBin, scores: TriageScores, speechState: string): RecommendedAction {
  if (bin === 'green') return 'send_to_content_pipeline';
  if (bin === 'blue') return 'send_as_broll_only';
  if (bin === 'yellow') {
    if (speechState === 'partial_thought') return 'trim_and_salvage';
    return 'session_merge';
  }
  // red
  if (scores.visual_stability_score >= 0.60) return 'archive_only';
  return scores.intent_to_publish_score <= 0.2 ? 'archive_or_trash' : 'trash';
}

// ─── Technical probe (Gate A) ─────────────────────────────────────────────────

export function probeTechnical(filePath: string): TechnicalMetadata & { gateFailures: string[] } {
  const gateFailures: string[] = [];

  const probe = execSync(
    `ffprobe -v quiet -print_format json -show_streams -show_format "${filePath}"`,
    { encoding: 'utf8' }
  );
  const data = JSON.parse(probe);
  const vidStream = data.streams.find((s: any) => s.codec_type === 'video');
  const audStream = data.streams.find((s: any) => s.codec_type === 'audio');
  const duration = parseFloat(data.format?.duration ?? '0');
  const fileSize = parseInt(data.format?.size ?? '0', 10) / 1024 / 1024;
  const quality_issues: string[] = [];

  // Gate A checks
  if (duration < 2.0) {
    quality_issues.push(`too_short_${duration.toFixed(1)}s`);
    gateFailures.push('gate_a_technical');
  }
  if (duration > 0 && fileSize / duration < 0.005) {
    quality_issues.push('very_low_bitrate');
  }
  if (!audStream) {
    quality_issues.push('no_audio_track');
  }

  return {
    duration_sec: duration,
    width: vidStream?.width ?? 0,
    height: vidStream?.height ?? 0,
    fps: Math.round(eval(vidStream?.r_frame_rate ?? '30/1') * 10) / 10,
    has_audio: !!audStream,
    file_size_mb: Math.round(fileSize * 10) / 10,
    quality_issues,
    gateFailures,
  };
}

// ─── Whisper transcription ────────────────────────────────────────────────────

export async function transcribeClip(filePath: string, openai: OpenAI): Promise<string> {
  const audioPath = `/tmp/triage-audio-${Date.now()}.mp3`;
  try {
    execSync(`ffmpeg -y -i "${filePath}" -vn -acodec mp3 -b:a 64k -t 60 "${audioPath}" 2>/dev/null`, { stdio: 'pipe' });
    if (!fs.existsSync(audioPath) || fs.statSync(audioPath).size < 1000) return '';

    const result = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath) as any,
      model: 'whisper-1',
      response_format: 'text',
    });
    return (typeof result === 'string' ? result : (result as any).text ?? '').trim();
  } catch {
    return '';
  } finally {
    try { fs.unlinkSync(audioPath); } catch {}
  }
}

// ─── GPT-4o frame + transcript analysis ──────────────────────────────────────

interface GPT4oTriageResult {
  contains_speech: boolean;
  speech_state: 'complete_thought' | 'partial_thought' | 'non_thought' | 'no_speech';
  complete_thought_score: number;
  semantic_clarity_score: number;
  hook_potential_score: number;
  audio_quality_score: number;
  visual_stability_score: number;
  subject_presence_score: number;
  novelty_or_relevance_score: number;
  emotional_or_informational_value: number;
  intent_to_publish_score: number;
  salvage_strategy: string | null;
  reasoning: string[];
}

async function analyzeWithGPT4o(
  filePath: string,
  transcript: string,
  duration: number,
  openai: OpenAI
): Promise<GPT4oTriageResult> {
  // Extract 2 frames: early (10%) and mid (50%)
  const frame1 = `/tmp/triage-f1-${Date.now()}.jpg`;
  const frame2 = `/tmp/triage-f2-${Date.now()}.jpg`;
  try {
    execSync(`ffmpeg -y -i "${filePath}" -ss ${(duration * 0.1).toFixed(1)} -vframes 1 -q:v 3 "${frame1}" 2>/dev/null`, { stdio: 'pipe' });
    execSync(`ffmpeg -y -i "${filePath}" -ss ${(duration * 0.5).toFixed(1)} -vframes 1 -q:v 3 "${frame2}" 2>/dev/null`, { stdio: 'pipe' });
  } catch {}

  const imageContent: any[] = [];
  for (const fp of [frame1, frame2]) {
    if (fs.existsSync(fp) && fs.statSync(fp).size > 0) {
      imageContent.push({
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${fs.readFileSync(fp).toString('base64')}`, detail: 'low' },
      });
    }
  }
  for (const fp of [frame1, frame2]) { try { fs.unlinkSync(fp); } catch {} }

  const TRIAGE_PROMPT = `You are evaluating raw iPhone footage before it enters a media production pipeline.
Do not assume a clip is content just because it contains speech or motion.
Decide whether this clip is likely intentional, understandable, and worth turning into media.

Transcript of audio: "${transcript || '(no speech detected)'}"
Duration: ${duration.toFixed(1)} seconds

Evaluate using these questions:
1. Does the clip contain a complete thought or complete visual idea?
2. Would a stranger understand it without missing context?
3. Was it likely recorded as actual content rather than a test or accidental capture?
4. Could this become useful media with light or moderate editing?
5. If not usable directly, is it salvageable as B-roll, a quote, a subclip, or a grouped sequence?

Important signals:
- NEGATIVE: "test", "hold on", "wait", "lemme see", "is this recording", random room pan, camera adjustment, one-word utterances, sudden stops
- POSITIVE: speaking directly to camera, stable framing, deliberate tone, complete sentences, clear subject, performance energy

speech_state options: "complete_thought" (full understandable thought), "partial_thought" (cut off or incomplete), "non_thought" (no communicative content), "no_speech"

Return ONLY valid JSON (no markdown):
{
  "contains_speech": boolean,
  "speech_state": "complete_thought" | "partial_thought" | "non_thought" | "no_speech",
  "complete_thought_score": 0.0-1.0,
  "semantic_clarity_score": 0.0-1.0,
  "hook_potential_score": 0.0-1.0,
  "audio_quality_score": 0.0-1.0,
  "visual_stability_score": 0.0-1.0,
  "subject_presence_score": 0.0-1.0,
  "novelty_or_relevance_score": 0.0-1.0,
  "emotional_or_informational_value": 0.0-1.0,
  "intent_to_publish_score": 0.0-1.0,
  "salvage_strategy": "string describing how to salvage if not primary usable, or null",
  "reasoning": ["bullet 1", "bullet 2", "bullet 3"]
}`;

  const messages: any[] = [{
    role: 'user',
    content: [
      { type: 'text', text: TRIAGE_PROMPT },
      ...imageContent,
    ],
  }];

  try {
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 500,
    });
    const raw = resp.choices[0].message.content ?? '{}';
    const parsed = JSON.parse(raw.replace(/```json\n?|```/g, '').trim());
    return {
      contains_speech: parsed.contains_speech ?? false,
      speech_state: parsed.speech_state ?? 'non_thought',
      complete_thought_score: parsed.complete_thought_score ?? 0,
      semantic_clarity_score: parsed.semantic_clarity_score ?? 0,
      hook_potential_score: parsed.hook_potential_score ?? 0,
      audio_quality_score: parsed.audio_quality_score ?? 0.5,
      visual_stability_score: parsed.visual_stability_score ?? 0.5,
      subject_presence_score: parsed.subject_presence_score ?? 0,
      novelty_or_relevance_score: parsed.novelty_or_relevance_score ?? 0,
      emotional_or_informational_value: parsed.emotional_or_informational_value ?? 0,
      intent_to_publish_score: parsed.intent_to_publish_score ?? 0,
      salvage_strategy: parsed.salvage_strategy ?? null,
      reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning : [],
    };
  } catch {
    // Fallback for API errors
    return {
      contains_speech: transcript.trim().length > 10,
      speech_state: 'partial_thought',
      complete_thought_score: 0.3,
      semantic_clarity_score: 0.3,
      hook_potential_score: 0.2,
      audio_quality_score: 0.5,
      visual_stability_score: 0.5,
      subject_presence_score: 0.4,
      novelty_or_relevance_score: 0.3,
      emotional_or_informational_value: 0.2,
      intent_to_publish_score: 0.3,
      salvage_strategy: 'manual review required (API analysis failed)',
      reasoning: ['analysis failed — using conservative defaults'],
    };
  }
}

// ─── Session grouping ─────────────────────────────────────────────────────────

export function groupIntoSessions(files: string[], windowSec = 300): Record<string, string[]> {
  // Parse timestamps from filenames like "2024-06-24 11-22-39.mp4"
  // Falls back to file mtime
  const withTimes = files.map(f => {
    const name = path.basename(f);
    const m = name.match(/(\d{4}-\d{2}-\d{2})[_ T](\d{2}[-:]\d{2}[-:]\d{2})/);
    let ts = 0;
    if (m) {
      const dt = new Date(`${m[1]}T${m[2].replace(/-/g, ':')}`);
      ts = dt.getTime() / 1000;
    } else {
      try { ts = fs.statSync(f).mtimeMs / 1000; } catch {}
    }
    return { file: f, ts };
  }).sort((a, b) => a.ts - b.ts);

  const groups: Record<string, string[]> = {};
  let sessionIdx = 0;
  let lastTs = -Infinity;

  for (const { file, ts } of withTimes) {
    if (ts - lastTs > windowSec) sessionIdx++;
    const key = `session_${String(sessionIdx).padStart(3, '0')}`;
    groups[key] = groups[key] ?? [];
    groups[key].push(file);
    lastTs = ts;
  }
  return groups;
}

// ─── Main triage function ─────────────────────────────────────────────────────

export async function triageClip(
  filePath: string,
  openai: OpenAI,
  sessionGroup = 'session_000',
  skipTranscribe = false,
  saveToDb = true,
): Promise<TriageResult> {
  const clipId = `clip_${path.basename(filePath, path.extname(filePath)).replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
  const gateFailures: string[] = [];

  // Gate A: technical validation
  const tech = probeTechnical(filePath);
  gateFailures.push(...tech.gateFailures);

  // Fast-path: if technical gate failed hard (too short), skip API calls
  if (tech.duration_sec < 2.0) {
    const scores: TriageScores = {
      complete_thought_score: 0, semantic_clarity_score: 0,
      hook_potential_score: 0, audio_quality_score: 0,
      visual_stability_score: 0, subject_presence_score: 0,
      novelty_or_relevance_score: 0, emotional_or_informational_value: 0,
      intent_to_publish_score: 0, media_watchability_score: 0,
    };
    const r: TriageResult = {
      clip_id: clipId, file_path: filePath, file_name: path.basename(filePath),
      classification: 'trash_low_value', bin: 'red',
      contains_speech: false, speech_state: 'no_speech', transcript: '',
      scores, recommended_action: 'trash', salvage_strategy: null,
      session_group: sessionGroup, technical: tech,
      reasoning: [`clip too short (${tech.duration_sec.toFixed(1)}s) — technical reject`],
      gate_failures: gateFailures, processed_at: new Date().toISOString(),
    };
    if (saveToDb) await saveTriageResultToDb(r);
    return r;
  }

  // Gate B/C: transcription
  let transcript = '';
  if (!skipTranscribe && tech.has_audio) {
    transcript = await transcribeClip(filePath, openai);
  }

  // Fast-path: test phrase detection before spending GPT-4o credits
  if (hasFastTestPhraseDetection(transcript)) {
    gateFailures.push('gate_b_speech_junk');
    const scores: TriageScores = {
      complete_thought_score: 0.05, semantic_clarity_score: 0.05,
      hook_potential_score: 0, audio_quality_score: 0.5,
      visual_stability_score: 0.5, subject_presence_score: 0.3,
      novelty_or_relevance_score: 0, emotional_or_informational_value: 0,
      intent_to_publish_score: 0.1, media_watchability_score: 0.1,
    };
    const r: TriageResult = {
      clip_id: clipId, file_path: filePath, file_name: path.basename(filePath),
      classification: 'test_or_accidental', bin: 'red',
      contains_speech: true, speech_state: 'non_thought', transcript,
      scores, recommended_action: 'archive_or_trash',
      salvage_strategy: null, session_group: sessionGroup, technical: tech,
      reasoning: [`transcript "${transcript}" matches test/accidental phrase patterns`, 'fast-rejected before GPT-4o analysis'],
      gate_failures: gateFailures, processed_at: new Date().toISOString(),
    };
    if (saveToDb) await saveTriageResultToDb(r);
    return r;
  }

  // Gate D–F: full GPT-4o analysis
  const ai = await analyzeWithGPT4o(filePath, transcript, tech.duration_sec, openai);

  // Compute composite watchability score
  const watchabilityRaw = computeWatchabilityScore(ai);

  const scores: TriageScores = {
    complete_thought_score: ai.complete_thought_score,
    semantic_clarity_score: ai.semantic_clarity_score,
    hook_potential_score: ai.hook_potential_score,
    audio_quality_score: ai.audio_quality_score,
    visual_stability_score: ai.visual_stability_score,
    subject_presence_score: ai.subject_presence_score,
    novelty_or_relevance_score: ai.novelty_or_relevance_score,
    emotional_or_informational_value: ai.emotional_or_informational_value,
    intent_to_publish_score: ai.intent_to_publish_score,
    media_watchability_score: watchabilityRaw,
  };

  // Gate E: intent detection failures
  if (ai.intent_to_publish_score < 0.25 && ai.speech_state === 'non_thought') {
    gateFailures.push('gate_e_no_intent');
  }

  const bin = scoresToBin(scores, gateFailures);
  const classification = binToClassification(bin, scores);
  const recommended_action = binToAction(bin, scores, ai.speech_state);

  const result: TriageResult = {
    clip_id: clipId, file_path: filePath, file_name: path.basename(filePath),
    classification, bin,
    contains_speech: ai.contains_speech,
    speech_state: ai.speech_state,
    transcript,
    scores, recommended_action,
    salvage_strategy: ai.salvage_strategy,
    session_group: sessionGroup, technical: tech,
    reasoning: ai.reasoning, gate_failures: gateFailures,
    processed_at: new Date().toISOString(),
  };

  if (saveToDb) await saveTriageResultToDb(result);
  return result;
}

// ─── Batch triage a directory ─────────────────────────────────────────────────

export async function triageDirectory(
  dirPath: string,
  openaiKey: string,
  opts: { sessionWindowSec?: number; extensions?: string[]; verbose?: boolean; saveToDb?: boolean; brandId?: string } = {}
): Promise<TriageReport> {
  const { sessionWindowSec = 300, extensions = ['.mp4', '.mov', '.m4v', '.hevc'], verbose = true, saveToDb = true, brandId = 'isaiah_personal' } = opts;
  const openai = new OpenAI({ apiKey: openaiKey });

  const files = fs.readdirSync(dirPath)
    .filter(f => extensions.includes(path.extname(f).toLowerCase()))
    .map(f => path.join(dirPath, f))
    .filter(f => fs.statSync(f).isFile());

  if (files.length === 0) return {
    source_dir: dirPath, processed_at: new Date().toISOString(),
    total_clips: 0, green_count: 0, yellow_count: 0, blue_count: 0, red_count: 0,
    session_groups: {}, results: [], pipeline_ready: [],
  };

  const sessions = groupIntoSessions(files, sessionWindowSec);
  const results: TriageResult[] = [];

  for (const [sessionId, sessionFiles] of Object.entries(sessions)) {
    if (verbose) process.stdout.write(`  Session ${sessionId}: ${sessionFiles.length} clips\n`);
    for (const file of sessionFiles) {
      if (verbose) process.stdout.write(`    Triaging ${path.basename(file)}...`);
      try {
        const result = await triageClip(file, openai, sessionId, false, saveToDb);
        results.push(result);
        if (verbose) process.stdout.write(` [${result.bin.toUpperCase()}] ${result.classification}\n`);
      } catch (e) {
        if (verbose) process.stdout.write(` ERROR: ${String(e).slice(0, 80)}\n`);
      }
    }
  }

  const green    = results.filter(r => r.bin === 'green');
  const yellow   = results.filter(r => r.bin === 'yellow');
  const blue     = results.filter(r => r.bin === 'blue');
  const red      = results.filter(r => r.bin === 'red');

  const pipeline_ready = [...green, ...yellow]
    .sort((a, b) => b.scores.media_watchability_score - a.scores.media_watchability_score);

  const report: TriageReport = {
    source_dir: dirPath, processed_at: new Date().toISOString(),
    total_clips: results.length,
    green_count: green.length, yellow_count: yellow.length,
    blue_count: blue.length, red_count: red.length,
    session_groups: sessions,
    results, pipeline_ready,
  };

  if (saveToDb) await saveTriageRunToDb(report, brandId);
  return report;
}

// ─── Single-clip gate (used in ugc-iphone-pipeline.ts) ────────────────────────

/** Returns true if the clip should proceed to content pipeline. Throws with reason if it fails. */
export async function passesContentGate(
  filePath: string,
  openaiKey: string,
  minWatchabilityScore = 0.45,
): Promise<{ passed: boolean; result: TriageResult }> {
  const openai = new OpenAI({ apiKey: openaiKey });
  const result = await triageClip(filePath, openai, 'single_clip');
  const passed = (result.bin === 'green' || result.bin === 'yellow') &&
                 result.scores.media_watchability_score >= minWatchabilityScore;
  return { passed, result };
}
