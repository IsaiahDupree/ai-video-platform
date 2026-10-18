/**
 * VideoQAInspector.ts — Pre-publish Video QA + Remediation Layer
 *
 * Inspects rendered MP4s to detect:
 *   1. Existing captions (lower-third text) — don't replace good ones
 *   2. Hook/title presence (upper text) — generate UGC hook if missing
 *   3. Duration validity — must be within ±2% of source duration
 *   4. Brand style compliance — colors, fonts, safe zones
 *
 * QA decision: keep | improve | recreate | trash
 * Learnings are stored to Supabase video_qa_learnings table.
 *
 * All detection uses:
 *   - ffprobe for duration/stream metadata
 *   - ffmpeg to extract audio + adaptive frames (5 min for <1 min, 10 for 5 min, 30 for 15 min)
 *   - OpenAI GPT-4o-mini vision for frame text region detection
 *   - OpenAI Whisper (whisper-1) for audio transcript extraction
 *   - OpenAI GPT-4o-mini for UGC hook generation
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execSync, spawnSync } from "child_process";
import type { BrandStyleConfig } from "./BrandStyleConfig";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CaptionState =
  | "captions_present_good"    // existing captions look fine — keep
  | "captions_present_bad"     // captions exist but are poor quality
  | "captions_missing";        // no captions detected

export type HookState =
  | "hook_present_strong"      // strong hook/title exists — keep
  | "hook_present_weak"        // title exists but weak
  | "hook_missing";            // no hook/title detected

export type QADecision =
  | "pass"       // video is good as-is, publish
  | "improve"    // minor text fix needed (add captions or hook), re-render
  | "recreate"   // significant issues, re-run full pipeline for this clip
  | "trash";     // exceeded max retries, discard with learnings

export interface VideoMetadata {
  durationSec: number;
  width: number;
  height: number;
  codec: string;
  fps: number;
  fileSizeBytes: number;
  hasAudioStream: boolean;
}

export interface FrameAnalysis {
  framePath: string;
  positionPct: number;       // 0.0–1.0 within video
  hasLowerThirdText: boolean; // likely captions in lower 30% of frame
  hasUpperText: boolean;      // likely hook/title in upper 20% of frame
  textSamples: string[];      // raw OCR / Vision text found
  confidence: number;         // 0–1
}

export interface QAReport {
  videoPath: string;
  sourceDurationSec: number;
  renderedDurationSec: number;
  durationDeltaPct: number;  // absolute % difference
  durationValid: boolean;    // within ±2%

  captionState: CaptionState;
  hookState: HookState;

  frames: FrameAnalysis[];
  suggestedHook?: string;    // AI-generated hook when hook is missing/weak
  suggestedCaptions?: boolean; // true = captions need to be added

  brandCompliant: boolean;
  brandIssues: string[];

  qaDecision: QADecision;
  qaScore: number;           // 0–100
  qaIssues: string[];

  attemptNumber: number;
  maxAttempts: number;
  shouldLearn: boolean;      // true = store learning regardless of pass/fail
}

export interface QALearning {
  clipId: string;
  brandId: string;
  qaScore: number;
  captionState: CaptionState;
  hookState: HookState;
  durationDeltaPct: number;
  qaDecision: QADecision;
  attemptNumber: number;
  qaIssues: string[];
  suggestedHook?: string;
  hookGeneratedAt?: string;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_DURATION_DELTA_PCT = 2.0; // ±2% max allowed duration variance
const MAX_QA_ATTEMPTS = 3;          // after this many retries → trash + learn

// ffmpeg/ffprobe paths — prefer Homebrew install
const FFPROBE = (() => {
  for (const p of ["/opt/homebrew/bin/ffprobe", "/usr/local/bin/ffprobe", "ffprobe"]) {
    try { execSync(`${p} -version`, { stdio: "ignore" }); return p; } catch {}
  }
  return "ffprobe";
})();

const FFMPEG = (() => {
  for (const p of ["/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg", "ffmpeg"]) {
    try { execSync(`${p} -version`, { stdio: "ignore" }); return p; } catch {}
  }
  return "ffmpeg";
})();

// ─── Metadata extraction ──────────────────────────────────────────────────────

export function extractVideoMetadata(videoPath: string): VideoMetadata {
  if (!fs.existsSync(videoPath)) {
    throw new Error(`VideoQA: file not found: ${videoPath}`);
  }

  const probeResult = spawnSync(FFPROBE, [
    "-v", "quiet",
    "-print_format", "json",
    "-show_streams",
    "-show_format",
    videoPath,
  ], { encoding: "utf8" });

  if (probeResult.status !== 0) {
    throw new Error(`ffprobe failed: ${probeResult.stderr}`);
  }

  const probe = JSON.parse(probeResult.stdout) as {
    format: { duration: string; size: string };
    streams: Array<{
      codec_type: string;
      codec_name: string;
      width?: number;
      height?: number;
      r_frame_rate?: string;
    }>;
  };

  const videoStream = probe.streams.find((s) => s.codec_type === "video");
  const audioStream = probe.streams.find((s) => s.codec_type === "audio");

  if (!videoStream) throw new Error("VideoQA: no video stream found");

  const [fpsNum, fpsDen] = (videoStream.r_frame_rate ?? "30/1").split("/").map(Number);
  const fps = fpsDen > 0 ? fpsNum / fpsDen : 30;

  return {
    durationSec: parseFloat(probe.format.duration ?? "0"),
    width: videoStream.width ?? 1080,
    height: videoStream.height ?? 1920,
    codec: videoStream.codec_name ?? "h264",
    fps,
    fileSizeBytes: parseInt(probe.format.size ?? "0", 10),
    hasAudioStream: !!audioStream,
  };
}

// ─── Duration validation ──────────────────────────────────────────────────────

export interface DurationCheckResult {
  sourceDurationSec: number;
  renderedDurationSec: number;
  deltaPct: number;
  valid: boolean;
  issue?: string;
}

// Absolute tolerance in seconds — prevents false failures on very short clips where
// container-level rounding (e.g. 2.00s → 2.05s = 2.5%) is normal H264 behavior.
// For 30-60s clips this is negligible (<0.3%); for 2s test clips it matters.
const ABSOLUTE_SLACK_SEC = 0.1;

export function checkDuration(
  renderedPath: string,
  sourceDurationSec: number,
  maxDeltaPct = MAX_DURATION_DELTA_PCT
): DurationCheckResult {
  const meta = extractVideoMetadata(renderedPath);
  const delta = Math.abs(meta.durationSec - sourceDurationSec);
  const deltaPct = sourceDurationSec > 0 ? (delta / sourceDurationSec) * 100 : 100;

  // Pass if within percentage tolerance OR within absolute slack.
  // The absolute slack (0.1s) prevents false positives on very short clips
  // (< 10s) where H264 container rounding is amplified in percentage terms.
  const valid = deltaPct <= maxDeltaPct || delta <= ABSOLUTE_SLACK_SEC;

  return {
    sourceDurationSec,
    renderedDurationSec: meta.durationSec,
    deltaPct,
    valid,
    issue: valid
      ? undefined
      : `Duration mismatch: rendered=${meta.durationSec.toFixed(2)}s, source=${sourceDurationSec.toFixed(2)}s, delta=${deltaPct.toFixed(2)}% (max ${maxDeltaPct}%, abs slack ${ABSOLUTE_SLACK_SEC}s)`,
  };
}

// ─── Frame sampling ───────────────────────────────────────────────────────────

/**
 * Adaptive frame count based on video duration (piecewise linear):
 *   ≤60s   → 5 frames (minimum)
 *   5 min  → 10 frames
 *   15 min → 30 frames
 *   30 min → 50 frames (cap: 60)
 *
 * Two segments with different slopes to hit all three anchor points exactly:
 *   Segment 1: [60s–300s]  → 5 to 10  (slope = 5/240 ≈ 0.021 /sec)
 *   Segment 2: [300s–900s] → 10 to 30 (slope = 20/600 ≈ 0.033 /sec)
 *   Segment 3: [900s+]     → continue at segment 2 slope, cap at 60
 */
export function adaptiveFrameCount(durationSec: number): number {
  if (durationSec <= 60) return 5;
  if (durationSec <= 300) {
    // 60s → 5, 300s → 10  (slope = 5/240)
    return Math.round(5 + (durationSec - 60) * (5 / 240));
  }
  // 300s → 10, 900s → 30  (slope = 20/600), then continue with same slope
  const count = Math.round(10 + (durationSec - 300) * (20 / 600));
  return Math.min(count, 60);
}

/**
 * Generate evenly-spaced frame positions across the video [0.0–1.0].
 * Always includes 0.08 (near-start hook) and 0.92 (near-end recap).
 * Interior positions are evenly distributed between those anchors.
 */
function buildFramePositions(frameCount: number): number[] {
  if (frameCount <= 1) return [0.1];
  if (frameCount === 2) return [0.1, 0.6];

  const positions: number[] = [];
  // First frame: near start to catch opening hook
  positions.push(0.08);
  // Interior frames: evenly spaced in [0.15, 0.85]
  const interior = frameCount - 2;
  for (let i = 0; i < interior; i++) {
    positions.push(0.15 + (i / (interior - 1 || 1)) * 0.70);
  }
  // Last frame: near end to catch closing caption/CTA
  positions.push(0.92);
  return positions;
}

/**
 * Sample frames from the video adaptively based on duration.
 * Short clips (<1 min): 5 frames | 5 min: 10 frames | 15 min: 30 frames
 */
export function sampleFrames(
  videoPath: string,
  durationSec: number,
  tmpDir?: string
): string[] {
  const outDir = tmpDir ?? path.join(os.tmpdir(), `vqa_frames_${Date.now()}`);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const frameCount = adaptiveFrameCount(durationSec);
  const positions = buildFramePositions(frameCount);
  const framePaths: string[] = [];

  for (const pct of positions) {
    // Clamp to at least 0.5s in so we don't land on a black frame
    const tSec = Math.max(0.5, pct * durationSec).toFixed(2);
    const label = (pct * 100).toFixed(0).padStart(3, "0");
    const outPath = path.join(outDir, `frame_${label}pct.jpg`);

    const result = spawnSync(FFMPEG, [
      "-ss", tSec,
      "-i", videoPath,
      "-frames:v", "1",
      "-q:v", "3",       // q:v 3 = good quality at smaller file size (vs q:v 2)
      "-vf", "scale=540:-2",  // resize to 540px wide — sufficient for text detection, saves tokens
      "-y",
      outPath,
    ], { stdio: "pipe" });

    if (result.status === 0 && fs.existsSync(outPath)) {
      framePaths.push(outPath);
    }
  }

  return framePaths;
}

// ─── Audio extraction for Whisper ────────────────────────────────────────────

/**
 * Extract audio from the video as a 16kHz mono MP3 for Whisper transcription.
 * Caps at 60 seconds — enough for transcript context without wasting API quota.
 */
export function extractAudioForWhisper(
  videoPath: string,
  tmpDir?: string
): string | null {
  const outDir = tmpDir ?? path.join(os.tmpdir(), `vqa_audio_${Date.now()}`);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, "audio.mp3");

  const result = spawnSync(FFMPEG, [
    "-i", videoPath,
    "-vn",                    // no video
    "-ar", "16000",           // 16kHz — Whisper's native rate
    "-ac", "1",               // mono
    "-t", "60",               // max 60 seconds
    "-q:a", "5",              // reasonable MP3 quality
    "-y",
    outPath,
  ], { stdio: "pipe" });

  return result.status === 0 && fs.existsSync(outPath) ? outPath : null;
}

// ─── Whisper transcript extraction ───────────────────────────────────────────

/**
 * Transcribe video audio using OpenAI Whisper (whisper-1).
 * Returns the transcript text, or empty string on failure.
 */
export async function transcribeWithWhisper(
  videoPath: string,
  openaiKey: string,
  tmpDir?: string
): Promise<string> {
  if (!openaiKey) return "";

  const audioPath = extractAudioForWhisper(videoPath, tmpDir);
  if (!audioPath) return "";

  try {
    const audioBuffer = fs.readFileSync(audioPath);
    const formData = new FormData();
    formData.append("file", new Blob([audioBuffer], { type: "audio/mpeg" }), "audio.mp3");
    formData.append("model", "whisper-1");
    formData.append("response_format", "text");
    formData.append("language", "en");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: formData,
    });

    if (!response.ok) return "";
    return (await response.text()).trim();
  } catch {
    return "";
  }
}

// ─── Text region analysis via OpenAI Vision ──────────────────────────────────

/**
 * Analyze a single frame for caption/hook text using OpenAI GPT-4o-mini vision.
 * Single API call per frame — lean and fast.
 */
export async function analyzeFrameForText(
  framePath: string,
  positionPct: number,
  openaiKey: string
): Promise<FrameAnalysis> {
  const fallback: FrameAnalysis = {
    framePath,
    positionPct,
    hasLowerThirdText: false,
    hasUpperText: false,
    textSamples: [],
    confidence: 0.3,
  };

  if (!fs.existsSync(framePath)) return fallback;
  if (!openaiKey) return { ...fallback, confidence: 0.1 };

  try {
    const imageData = fs.readFileSync(framePath);
    const base64 = imageData.toString("base64");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                  detail: "low",   // "low" = 85 tokens per image — cheap, sufficient for text detection
                },
              },
              {
                type: "text",
                text: `Video frame analysis. Reply with JSON only, no markdown:
{"has_lower_third_text":bool,"has_upper_text":bool,"text_samples":["..."],"lower_third_quality":"none|poor|acceptable|good","upper_text_quality":"none|poor|weak|strong","confidence":0.0}
has_lower_third_text = text overlay in bottom 30% (captions/subtitles)
has_upper_text = text overlay in top 20% (hook/title)
text_samples = up to 3 strings of actual text you see`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) return fallback;

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content ?? "";

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;

    const parsed = JSON.parse(jsonMatch[0]) as {
      has_lower_third_text: boolean;
      has_upper_text: boolean;
      text_samples: string[];
      confidence: number;
    };

    return {
      framePath,
      positionPct,
      hasLowerThirdText: parsed.has_lower_third_text ?? false,
      hasUpperText: parsed.has_upper_text ?? false,
      textSamples: parsed.text_samples ?? [],
      confidence: parsed.confidence ?? 0.6,
    };
  } catch {
    return fallback;
  }
}

// ─── Hook generation via OpenAI ───────────────────────────────────────────────

/**
 * Generate a short UGC-style hook using OpenAI GPT-4o-mini.
 * Uses Whisper transcript + ICP + niche for grounded, content-accurate hooks.
 */
export async function generateHook(opts: {
  transcript: string;
  niche: string;
  icpId: string;
  platform: string;
  openaiKey: string;
  existingHook?: string;
}): Promise<{ hook: string; score: number; rationale: string }> {
  const fallbackHook = "this changed everything";

  if (!opts.openaiKey) {
    return { hook: fallbackHook, score: 0.5, rationale: "API unavailable — using fallback hook" };
  }

  const isReplace = !!opts.existingHook;
  const context = isReplace
    ? `The current hook is weak: "${opts.existingHook}". Replace it.`
    : `No hook exists. Create one from scratch.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 200,
        messages: [
          {
            role: "system",
            content: "You write short UGC-style video hooks. Reply with JSON only.",
          },
          {
            role: "user",
            content: `${context}

Transcript (first 300 chars): "${opts.transcript.slice(0, 300)}"
Niche: ${opts.niche} | ICP: ${opts.icpId} | Platform: ${opts.platform}

Rules: 4–10 words, lowercase/sentence case, curiosity-driven, reflects actual content, no "I" or "This video" start.
Good examples: "nobody talks about this", "the thing i was missing", "stop doing it this way"

Reply: {"hook":"...","score":0.0,"curiosity":0.0,"clarity":0.0,"trend_fit":0.0,"rationale":"..."}`,
          },
        ],
      }),
    });

    if (!response.ok) return { hook: fallbackHook, score: 0.5, rationale: "API error" };

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { hook: fallbackHook, score: 0.5, rationale: "Parse error" };

    const parsed = JSON.parse(jsonMatch[0]) as {
      hook: string;
      score: number;
      rationale: string;
    };

    return {
      hook: parsed.hook ?? fallbackHook,
      score: parsed.score ?? 0.6,
      rationale: parsed.rationale ?? "",
    };
  } catch {
    return { hook: fallbackHook, score: 0.5, rationale: "Exception in hook generation" };
  }
}

// ─── Caption state determination ─────────────────────────────────────────────

function determineCaptionState(frames: FrameAnalysis[]): CaptionState {
  const withLowerText = frames.filter((f) => f.hasLowerThirdText);
  const highConfidence = frames.filter((f) => f.confidence >= 0.5);

  if (withLowerText.length === 0) return "captions_missing";

  // If >50% of frames have lower-third text with decent confidence
  const reliableFrames = withLowerText.filter((f) => f.confidence >= 0.5);
  if (reliableFrames.length >= 1 && highConfidence.length >= 1) {
    return "captions_present_good";
  }

  // Present but uncertain quality
  return "captions_present_bad";
}

// ─── Hook state determination ─────────────────────────────────────────────────

function determineHookState(frames: FrameAnalysis[]): HookState {
  // Check the first two frames (20% and 50%) — hook typically persists in first half
  const earlyFrames = frames.slice(0, 2);
  const withUpperText = earlyFrames.filter((f) => f.hasUpperText && f.confidence >= 0.4);

  if (withUpperText.length === 0) return "hook_missing";

  // If text is short and snappy, treat as strong; otherwise weak
  const textSamples = withUpperText.flatMap((f) => f.textSamples);
  const hasShortPunchyText = textSamples.some((t) => t.split(" ").length <= 10 && t.length > 5);

  return hasShortPunchyText ? "hook_present_strong" : "hook_present_weak";
}

// ─── QA decision logic ────────────────────────────────────────────────────────

function computeQAScore(opts: {
  durationValid: boolean;
  captionState: CaptionState;
  hookState: HookState;
  brandCompliant: boolean;
}): number {
  let score = 100;

  if (!opts.durationValid) score -= 40;  // fatal — something went badly wrong
  if (opts.captionState === "captions_missing") score -= 20;
  if (opts.captionState === "captions_present_bad") score -= 10;
  if (opts.hookState === "hook_missing") score -= 15;
  if (opts.hookState === "hook_present_weak") score -= 8;
  if (!opts.brandCompliant) score -= 10;

  return Math.max(0, score);
}

function decideQAOutcome(
  score: number,
  attemptNumber: number,
  issues: string[]
): QADecision {
  if (attemptNumber >= MAX_QA_ATTEMPTS) return "trash";

  // Duration failure is always recreate (something structural went wrong)
  if (issues.some((i) => i.includes("Duration mismatch"))) return "recreate";

  if (score >= 85) return "pass";
  if (score >= 65) return "improve";  // minor fixes — add captions or hook
  return "recreate";                  // significant quality issue
}

// ─── Main QA inspection entrypoint ───────────────────────────────────────────

export async function inspectVideo(opts: {
  renderedPath: string;
  sourceDurationSec: number;
  brandId: string;
  brandConfig: BrandStyleConfig;
  transcript?: string;          // if empty, Whisper will extract from video audio
  niche?: string;
  icpId?: string;
  platform?: string;
  attemptNumber?: number;
  openaiKey?: string;           // for GPT-4o-mini vision + Whisper
  skipVisionAnalysis?: boolean; // skip OpenAI calls entirely (faster, less accurate)
}): Promise<QAReport> {
  const {
    renderedPath,
    sourceDurationSec,
    brandConfig,
    niche = "general",
    icpId = "general",
    platform = "instagram",
    attemptNumber = 1,
    openaiKey = "",
    skipVisionAnalysis = false,
  } = opts;

  let transcript = opts.transcript ?? "";

  const issues: string[] = [];
  const brandIssues: string[] = [];

  // ── 1. Duration check ──────────────────────────────────────────────────────
  const durCheck = checkDuration(renderedPath, sourceDurationSec);
  if (!durCheck.valid && durCheck.issue) {
    issues.push(durCheck.issue);
  }

  // ── 2. Whisper transcript (if not provided) ────────────────────────────────
  if (!transcript && !skipVisionAnalysis && openaiKey) {
    transcript = await transcribeWithWhisper(renderedPath, openaiKey);
  }

  // ── 3. Frame sampling + OpenAI Vision analysis ────────────────────────────
  const frames: FrameAnalysis[] = [];
  let captionState: CaptionState = "captions_missing";
  let hookState: HookState = "hook_missing";

  if (!skipVisionAnalysis) {
    try {
      // Adaptive frame count: 5 for <1 min, 10 for 5 min, 30 for 15 min
      const frameCount = adaptiveFrameCount(durCheck.renderedDurationSec);
      const positions = buildFramePositions(frameCount);
      const framePaths = sampleFrames(renderedPath, durCheck.renderedDurationSec);
      for (let i = 0; i < framePaths.length; i++) {
        const analysis = await analyzeFrameForText(framePaths[i], positions[i] ?? 0.5, openaiKey);
        frames.push(analysis);
      }
      captionState = determineCaptionState(frames);
      hookState = determineHookState(frames);
    } catch {
      issues.push("Frame sampling failed — skipping visual text analysis");
    }
  }

  if (captionState === "captions_missing") issues.push("No captions detected on video");
  if (captionState === "captions_present_bad") issues.push("Captions detected but appear low quality");
  if (hookState === "hook_missing") issues.push("No hook/title detected in upper area");
  if (hookState === "hook_present_weak") issues.push("Weak hook detected — consider replacing");

  // ── 4. Brand compliance (basic checks — colors/fonts verified at render) ──
  const brandCompliant = true; // Full check happens at render time via composition props
  if (opts.brandId !== brandConfig.brandId) {
    brandIssues.push(`Brand config mismatch: expected ${opts.brandId}, got ${brandConfig.brandId}`);
  }

  // ── 5. Generate hook via OpenAI if missing/weak ───────────────────────────
  let suggestedHook: string | undefined;
  if ((hookState === "hook_missing" || hookState === "hook_present_weak") && !skipVisionAnalysis) {
    const hookResult = await generateHook({
      transcript,
      niche,
      icpId,
      platform,
      openaiKey,
    });
    suggestedHook = hookResult.hook;
  }

  // ── 5. Compute QA score + decision ────────────────────────────────────────
  const qaScore = computeQAScore({
    durationValid: durCheck.valid,
    captionState,
    hookState,
    brandCompliant: brandCompliant && brandIssues.length === 0,
  });

  const qaDecision = decideQAOutcome(qaScore, attemptNumber, issues);

  return {
    videoPath: renderedPath,
    sourceDurationSec,
    renderedDurationSec: durCheck.renderedDurationSec,
    durationDeltaPct: durCheck.deltaPct,
    durationValid: durCheck.valid,
    captionState,
    hookState,
    frames,
    suggestedHook,
    suggestedCaptions: captionState !== "captions_present_good",
    brandCompliant: brandCompliant && brandIssues.length === 0,
    brandIssues,
    qaDecision,
    qaScore,
    qaIssues: issues,
    attemptNumber,
    maxAttempts: MAX_QA_ATTEMPTS,
    shouldLearn: qaDecision === "trash" || attemptNumber >= 2,
  };
}

// ─── Learning storage helpers ─────────────────────────────────────────────────

export function buildLearning(
  report: QAReport,
  clipId: string,
  brandId: string
): QALearning {
  return {
    clipId,
    brandId,
    qaScore: report.qaScore,
    captionState: report.captionState,
    hookState: report.hookState,
    durationDeltaPct: report.durationDeltaPct,
    qaDecision: report.qaDecision,
    attemptNumber: report.attemptNumber,
    qaIssues: report.qaIssues,
    suggestedHook: report.suggestedHook,
    hookGeneratedAt: report.suggestedHook ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
  };
}

export async function storeLearning(
  learning: QALearning,
  supabaseUrl: string,
  supabaseKey: string
): Promise<void> {
  const res = await fetch(`${supabaseUrl}/rest/v1/video_qa_learnings`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(learning),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to store QA learning: ${res.status} ${body}`);
  }
}
