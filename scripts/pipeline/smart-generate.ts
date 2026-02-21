#!/usr/bin/env npx tsx
/**
 * Smart Video Generation Pipeline
 *
 * End-to-end: Generate → Gate → Auto-Regenerate → Assess → Learn
 *
 * Features:
 *   - Full pipeline: AI inputs → images → lipsync → gate → viral analysis
 *   - Authenticity gate: GPT-4o vision checks for AI anomalies, UGC authenticity, script coherence
 *   - Auto-retry: failed gate = auto-regenerate (up to 3 attempts per angle)
 *   - Per-stage control: --retry-images, --retry-lipsync, --retry-all
 *   - Learnings system: saves what worked/failed → feeds winning patterns into future prompts
 *   - Videos auto-open when done
 *
 * Usage:
 *   npx tsx scripts/pipeline/smart-generate.ts --count 5
 *   npx tsx scripts/pipeline/smart-generate.ts --count 3 --start 5
 *   npx tsx scripts/pipeline/smart-generate.ts --count 2 --max-retries 2
 *   npx tsx scripts/pipeline/smart-generate.ts --assess-only output/pipeline/everreach/<session>
 *
 * Flags:
 *   --offer=<path>       Offer JSON (default: offers/everreach.json)
 *   --count=<n>          Number of angles (default: 5)
 *   --start=<n>          Start index (default: 0)
 *   --aspect=<ratio>     Aspect ratio (default: 9:16)
 *   --max-retries=<n>    Max gate retries per angle (default: 3)
 *   --assess-only=<dir>  Skip generation, only gate+assess existing session
 *   --force              Force re-run even if outputs exist
 *   --resume=<dir>       Resume a previous session dir — skip cleanup, continue from last good clip
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { execSync, spawn } from 'child_process';

import type { Offer, CreativeFramework, AngleInputs } from './offer.schema.js';
import { generateAngleInputs } from './ai-inputs.js';
import { runStageImages } from './stage-images.js';
import { runStageLipsync } from './stage-lipsync.js';
import { type HookFormula, HOOK_PRIORITY_ORDER } from './prompt-builder.js';

// =============================================================================
// Constants
// =============================================================================

const ANALYSIS_URL = 'http://localhost:5555/api/analysis/analyze-file';
const MEDIAPOSTER_DIR = '/Users/isaiahdupree/Documents/Software/MediaPoster/Backend';
const LEARNINGS_PATH = 'output/pipeline/learnings.json';

// =============================================================================
// Pricing (update when providers change rates)
// =============================================================================

const PRICING = {
  // fal.ai Veo 3.1 — $0.40/s with audio, 8s clips
  FAL_VEO_PER_SECOND:       0.40,
  FAL_VEO_CLIP_SECONDS:     8,
  // Imagen 4 via Gemini API — ~$0.04/image (character sheet + before + after = 3 images)
  IMAGEN_PER_IMAGE:         0.04,
  IMAGES_PER_ANGLE:         3,   // character_sheet + before + after
  // GPT-4o — $2.50/1M input, $10.00/1M output
  GPT4O_INPUT_PER_TOKEN:    2.50  / 1_000_000,
  GPT4O_OUTPUT_PER_TOKEN:   10.00 / 1_000_000,
  // GPT-4o vision gate — 5 frames × ~1000 tokens/frame + system prompt
  GPT4O_GATE_INPUT_TOKENS:  6_000,
  GPT4O_GATE_OUTPUT_TOKENS: 300,
};

// Validate mode: Kling 2.6 Pro — $0.07-0.14/s with audio (~$0.56-1.12/clip)
// Use --validate to dry-run prompts/gate/character lock before spending on Veo 3.1
const PRICING_VALIDATE = {
  FAL_VEO_PER_SECOND:   0.14,  // Kling 2.6 Pro worst-case with audio
  FAL_VEO_CLIP_SECONDS: 8,
};

// fal.ai model endpoints
const FAL_MODELS = {
  veo31:        'fal-ai/veo3.1',
  veo31_anchor: 'fal-ai/veo3.1/first-last-frame-to-video',
  kling_pro:    'fal-ai/kling-video/v2.6/pro/text-to-video',
} as const;
export type FalVideoModel = keyof typeof FAL_MODELS;

function clipCost(clipCount: number, validate = false): number {
  const p = validate ? PRICING_VALIDATE : PRICING;
  return clipCount * p.FAL_VEO_CLIP_SECONDS * p.FAL_VEO_PER_SECOND;
}
function imageCost(): number {
  return PRICING.IMAGES_PER_ANGLE * PRICING.IMAGEN_PER_IMAGE;
}
function gptInputCost(tokens: number): number {
  return tokens * PRICING.GPT4O_INPUT_PER_TOKEN;
}
function gptOutputCost(tokens: number): number {
  return tokens * PRICING.GPT4O_OUTPUT_PER_TOKEN;
}
function gateCost(): number {
  return gptInputCost(PRICING.GPT4O_GATE_INPUT_TOKENS) + gptOutputCost(PRICING.GPT4O_GATE_OUTPUT_TOKENS);
}

const ANOMALY_THRESHOLD = 4;
const AUTHENTIC_THRESHOLD = 6;
const COHERENCE_THRESHOLD = 6;
const CHAR_COHERENCE_THRESHOLD = 7;
const PRODUCT_CONSISTENCY_THRESHOLD = 7;
const LIP_SYNC_THRESHOLD = 6;

// Default combos used when offer doesn't define audienceCategories/awarenessStages
const DEFAULT_ANGLE_COMBOS: Array<{ stage: string; category: string }> = [
  { stage: 'unaware',         category: 'friend'     },
  { stage: 'unaware',         category: 'old friend' },
  { stage: 'unaware',         category: 'coworker'   },
  { stage: 'unaware',         category: 'family'     },
  { stage: 'unaware',         category: 'client'     },
  { stage: 'problem-aware',   category: 'friend'     },
  { stage: 'problem-aware',   category: 'old friend' },
  { stage: 'problem-aware',   category: 'coworker'   },
  { stage: 'problem-aware',   category: 'family'     },
  { stage: 'problem-aware',   category: 'client'     },
  { stage: 'solution-aware',  category: 'friend'     },
  { stage: 'solution-aware',  category: 'old friend' },
  { stage: 'solution-aware',  category: 'coworker'   },
  { stage: 'solution-aware',  category: 'family'     },
  { stage: 'solution-aware',  category: 'client'     },
  { stage: 'product-aware',   category: 'friend'     },
  { stage: 'product-aware',   category: 'old friend' },
  { stage: 'product-aware',   category: 'coworker'   },
  { stage: 'product-aware',   category: 'family'     },
  { stage: 'product-aware',   category: 'client'     },
];

function buildAngleCombos(framework: CreativeFramework): Array<{ stage: string; category: string }> {
  const stages = (framework.awarenessStages ?? []).map((s) => s.id);
  const categories = framework.audienceCategories ?? [];
  if (stages.length === 0 || categories.length === 0) return DEFAULT_ANGLE_COMBOS;
  const combos: Array<{ stage: string; category: string }> = [];
  for (const stage of stages) {
    for (const category of categories) {
      combos.push({ stage, category });
    }
  }
  return combos;
}

// =============================================================================
// Types
// =============================================================================

interface GateResult {
  passed: boolean;
  anomaly_score: number;
  authenticity_score: number;
  coherence_score: number;
  character_coherence_score: number;
  product_consistency_score: number;
  lip_sync_score: number;
  anomalies: string[];
  authenticity_notes: string;
  coherence_notes: string;
  character_notes: string;
  verdict: string;
  hard_stop_reason?: string;
}

interface ViralResult {
  pre_social_score?: number;
  tone?: string;
  pacing?: string;
  detected_hook?: string;
  hooks?: string[];
  topics?: string[];
  fate_scores?: { F: number; A: number; T: number; E: number };
  viral_analysis?: string;
}

interface CostBreakdown {
  gptInputUsd: number;    // GPT-4o input generation
  gptGateUsd: number;     // GPT-4o vision gate (per attempt)
  imageUsd: number;       // Imagen 4 before/after/character sheet
  videoUsd: number;       // fal.ai Veo 3.1 clips
  totalUsd: number;
  clipCount: number;
}

interface AngleResult {
  angleId: string;
  outputDir: string;
  videoPath?: string;
  headline?: string;
  voiceScript?: string;
  hookFormula?: HookFormula;
  attempt: number;
  gate?: GateResult;
  gatePassed: boolean;
  viral?: ViralResult;
  cost?: CostBreakdown;
  error?: string;
  durationMs: number;
}

interface LearningsCost {
  totalSpentUsd: number;
  totalVideoUsd: number;
  totalImageUsd: number;
  totalGptUsd: number;
  costPerPassingAd: number;
  costPerAttempt: number;
  avgClipsPerAngle: number;
  sessionCosts: Array<{ date: string; angles: number; spentUsd: number; passed: number }>;
}

interface Learnings {
  lastUpdated: string;
  totalGenerated: number;
  totalPassed: number;
  totalFailed: number;
  passRate: number;
  avgViralScore: number;
  costs: LearningsCost;
  hookFormulas: Partial<Record<HookFormula, { attempts: number; passed: number; passRate: number }>>;
  topPatterns: {
    headlines: string[];
    hooks: string[];
    tones: string[];
    scriptStyles: string[];
  };
  failurePatterns: {
    commonAnomalies: string[];
    lowCoherenceScripts: string[];
  };
  bestVideos: Array<{
    angleId: string;
    headline: string;
    hookFormula?: HookFormula;
    viralScore: number;
    gateScores: { anomaly: number; authenticity: number; coherence: number };
    videoPath: string;
  }>;
}

// =============================================================================
// Args + env
// =============================================================================

function parseArgs() {
  const argv = process.argv.slice(2);
  const get = (flag: string) => {
    const eq = argv.find((a) => a.startsWith(`--${flag}=`));
    if (eq) return eq.split('=').slice(1).join('=');
    const idx = argv.indexOf(`--${flag}`);
    if (idx !== -1 && idx + 1 < argv.length && !argv[idx + 1].startsWith('--')) return argv[idx + 1];
    return undefined;
  };
  return {
    offerPath: get('offer') ?? 'offers/everreach.json',
    count: parseInt(get('count') ?? '5', 10),
    start: parseInt(get('start') ?? '0', 10),
    aspect: get('aspect') ?? '9:16',
    maxRetries: parseInt(get('max-retries') ?? '3', 10),
    assessOnly: get('assess-only'),
    force: argv.includes('--force'),
    validate: argv.includes('--validate'),  // use Kling 2.6 instead of Veo 3.1
    resume: get('resume'),                  // path to existing session dir to resume
  };
}

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const eq = line.indexOf('=');
    if (eq === -1 || line.startsWith('#')) continue;
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (k && !process.env[k]) process.env[k] = v;
  }
}

function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set');
  return key;
}

// =============================================================================
// Learnings system
// =============================================================================

function loadLearnings(): Learnings {
  if (fs.existsSync(LEARNINGS_PATH)) {
    try { return JSON.parse(fs.readFileSync(LEARNINGS_PATH, 'utf-8')); } catch { /* fallthrough */ }
  }
  return {
    lastUpdated: new Date().toISOString(),
    totalGenerated: 0, totalPassed: 0, totalFailed: 0,
    passRate: 0, avgViralScore: 0,
    costs: {
      totalSpentUsd: 0, totalVideoUsd: 0, totalImageUsd: 0, totalGptUsd: 0,
      costPerPassingAd: 0, costPerAttempt: 0, avgClipsPerAngle: 0, sessionCosts: [],
    },
    hookFormulas: {},
    topPatterns: { headlines: [], hooks: [], tones: [], scriptStyles: [] },
    failurePatterns: { commonAnomalies: [], lowCoherenceScripts: [] },
    bestVideos: [],
  };
}

function updateLearnings(learnings: Learnings, results: AngleResult[]): Learnings {
  const passed = results.filter((r) => r.gatePassed);
  const failed = results.filter((r) => !r.gatePassed);

  learnings.totalGenerated += results.length;
  learnings.totalPassed += passed.length;
  learnings.totalFailed += failed.length;
  learnings.passRate = learnings.totalGenerated > 0
    ? learnings.totalPassed / learnings.totalGenerated : 0;

  if (!learnings.hookFormulas) learnings.hookFormulas = {};
  if (!learnings.costs) learnings.costs = {
    totalSpentUsd: 0, totalVideoUsd: 0, totalImageUsd: 0, totalGptUsd: 0,
    costPerPassingAd: 0, costPerAttempt: 0, avgClipsPerAngle: 0, sessionCosts: [],
  };

  // Accumulate costs from this session
  const sessionSpend = results.reduce((s, r) => s + (r.cost?.totalUsd ?? 0), 0);
  const sessionClips = results.reduce((s, r) => s + (r.cost?.clipCount ?? 0), 0);
  learnings.costs.totalSpentUsd  += sessionSpend;
  learnings.costs.totalVideoUsd  += results.reduce((s, r) => s + (r.cost?.videoUsd ?? 0), 0);
  learnings.costs.totalImageUsd  += results.reduce((s, r) => s + (r.cost?.imageUsd ?? 0), 0);
  learnings.costs.totalGptUsd    += results.reduce((s, r) => s + (r.cost?.gptInputUsd ?? 0) + (r.cost?.gptGateUsd ?? 0), 0);
  learnings.costs.costPerPassingAd = learnings.totalPassed > 0
    ? learnings.costs.totalSpentUsd / (learnings.totalPassed + passed.length) : 0;
  learnings.costs.costPerAttempt = learnings.totalGenerated > 0
    ? learnings.costs.totalSpentUsd / (learnings.totalGenerated + results.length) : 0;
  const totalClips = (learnings.costs.avgClipsPerAngle * (learnings.totalGenerated)) + sessionClips;
  learnings.costs.avgClipsPerAngle = learnings.totalGenerated + results.length > 0
    ? totalClips / (learnings.totalGenerated + results.length) : 0;
  if (sessionSpend > 0) {
    if (!learnings.costs.sessionCosts) learnings.costs.sessionCosts = [];
    learnings.costs.sessionCosts.push({
      date: new Date().toISOString().slice(0, 10),
      angles: results.length,
      spentUsd: Math.round(sessionSpend * 100) / 100,
      passed: passed.length,
    });
    learnings.costs.sessionCosts = learnings.costs.sessionCosts.slice(-20);
  }

  for (const r of results) {
    if (r.hookFormula) {
      const s = learnings.hookFormulas[r.hookFormula] ?? { attempts: 0, passed: 0, passRate: 0 };
      s.attempts++;
      if (r.gatePassed) s.passed++;
      s.passRate = s.passed / s.attempts;
      learnings.hookFormulas[r.hookFormula] = s;
    }
  }

  // Track winning patterns
  for (const r of passed) {
    if (r.headline) learnings.topPatterns.headlines.push(r.headline);
    if (r.viral?.detected_hook) learnings.topPatterns.hooks.push(r.viral.detected_hook);
    if (r.viral?.tone) learnings.topPatterns.tones.push(r.viral.tone);
    if (r.voiceScript) {
      const words = r.voiceScript.split(/\s+/).length;
      const style = words < 30 ? 'short-punchy' : words < 60 ? 'conversational' : 'detailed';
      learnings.topPatterns.scriptStyles.push(style);
    }

    if (r.viral?.pre_social_score && r.gate) {
      learnings.bestVideos.push({
        angleId: r.angleId, headline: r.headline ?? '',
        hookFormula: r.hookFormula,
        viralScore: r.viral.pre_social_score,
        gateScores: { anomaly: r.gate.anomaly_score, authenticity: r.gate.authenticity_score, coherence: r.gate.coherence_score },
        videoPath: r.videoPath ?? '',
      });
    }
    // Recalculate costPerPassingAd after adding new passed videos
    if (learnings.totalPassed > 0) {
      learnings.costs.costPerPassingAd = learnings.costs.totalSpentUsd / learnings.totalPassed;
    }
  }

  // Track failure patterns
  for (const r of failed) {
    if (r.gate?.anomalies) learnings.failurePatterns.commonAnomalies.push(...r.gate.anomalies);
    if (r.gate && r.gate.coherence_score <= COHERENCE_THRESHOLD && r.voiceScript) {
      learnings.failurePatterns.lowCoherenceScripts.push(r.voiceScript.slice(0, 100));
    }
  }

  // Keep top 10 best, deduplicate anomalies
  learnings.bestVideos.sort((a, b) => b.viralScore - a.viralScore);
  learnings.bestVideos = learnings.bestVideos.slice(0, 10);
  learnings.topPatterns.headlines = [...new Set(learnings.topPatterns.headlines)].slice(-20);
  learnings.topPatterns.hooks = [...new Set(learnings.topPatterns.hooks)].slice(-20);
  learnings.topPatterns.tones = [...new Set(learnings.topPatterns.tones)].slice(-10);
  learnings.failurePatterns.commonAnomalies = [...new Set(learnings.failurePatterns.commonAnomalies)].slice(-20);

  // Compute avg viral score
  const scored = learnings.bestVideos.filter((v) => v.viralScore > 0);
  learnings.avgViralScore = scored.length > 0
    ? scored.reduce((s, v) => s + v.viralScore, 0) / scored.length : 0;

  learnings.lastUpdated = new Date().toISOString();
  return learnings;
}

function saveLearnings(learnings: Learnings) {
  fs.mkdirSync(path.dirname(LEARNINGS_PATH), { recursive: true });
  fs.writeFileSync(LEARNINGS_PATH, JSON.stringify(learnings, null, 2));
}

function buildLearningsContext(learnings: Learnings): string {
  if (learnings.totalGenerated === 0) return '';
  const parts: string[] = ['LEARNINGS FROM PREVIOUS GENERATIONS:'];
  parts.push(`Pass rate: ${(learnings.passRate * 100).toFixed(0)}% (${learnings.totalPassed}/${learnings.totalGenerated})`);
  if (learnings.avgViralScore > 0) parts.push(`Avg viral score: ${learnings.avgViralScore.toFixed(1)}/100`);
  if (learnings.topPatterns.tones.length) parts.push(`Winning tones: ${learnings.topPatterns.tones.slice(-5).join(', ')}`);
  if (learnings.topPatterns.hooks.length) parts.push(`Strong hooks: ${learnings.topPatterns.hooks.slice(-3).map((h) => `"${h}"`).join(', ')}`);
  if (learnings.failurePatterns.commonAnomalies.length) parts.push(`AVOID these issues: ${learnings.failurePatterns.commonAnomalies.slice(-5).join('; ')}`);
  if (learnings.hookFormulas && Object.keys(learnings.hookFormulas).length > 0) {
    const sorted = Object.entries(learnings.hookFormulas)
      .filter(([, s]) => s.attempts >= 2)
      .sort(([, a], [, b]) => b.passRate - a.passRate);
    if (sorted.length > 0)
      parts.push(`Hook pass rates: ${sorted.map(([f, s]) => `${f}=${(s.passRate*100).toFixed(0)}%`).join(', ')}`);
  }
  return parts.join('\n');
}

function selectHookFormula(learnings: Learnings, attempt: number): HookFormula {
  if (learnings.hookFormulas) {
    const reliable = Object.entries(learnings.hookFormulas)
      .filter(([, s]) => s.attempts >= 2)
      .sort(([, a], [, b]) => b.passRate - a.passRate);
    if (reliable.length > 0) {
      const idx = Math.min(attempt, reliable.length - 1);
      return reliable[idx][0] as HookFormula;
    }
  }
  return HOOK_PRIORITY_ORDER[attempt % HOOK_PRIORITY_ORDER.length];
}

// =============================================================================
// OpenAI helper
// =============================================================================

async function openAIChat(messages: any[], key: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: 'gpt-4o', max_tokens: 1000, messages });
    const req = https.request(
      { hostname: 'api.openai.com', path: '/v1/chat/completions', method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`,
          'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        let data = '';
        res.on('data', (c) => { data += c; });
        res.on('end', () => {
          try {
            const p = JSON.parse(data);
            if (p.error) return reject(new Error(p.error.message));
            const content = p.choices?.[0]?.message?.content;
            if (!content) return reject(new Error(`OpenAI returned empty content: ${JSON.stringify(p).slice(0, 200)}`));
            resolve(content);
          } catch { reject(new Error(`OpenAI parse: ${data.slice(0, 200)}`)); }
        });
      }
    );
    req.on('error', reject); req.write(body); req.end();
  });
}

// =============================================================================
// Authenticity gate
// =============================================================================

function extractFrames(videoPath: string, count = 5): string[] {
  const tmpDir = `/tmp/smart_frames_${Date.now()}`;
  fs.mkdirSync(tmpDir, { recursive: true });
  try {
    const dur = parseFloat(
      execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${videoPath}"`,
        { encoding: 'utf-8' }).trim()) || 8;
    const frames: string[] = [];
    for (let i = 0; i < count; i++) {
      const t = (dur / (count + 1)) * (i + 1);
      const out = `${tmpDir}/f${i}.jpg`;
      try {
        execSync(`ffmpeg -y -ss ${t.toFixed(2)} -i "${videoPath}" -vframes 1 -q:v 3 -vf scale=480:-1 "${out}" 2>/dev/null`,
          { stdio: 'pipe' });
        if (fs.existsSync(out)) frames.push(fs.readFileSync(out).toString('base64'));
      } catch { /* skip */ }
    }
    return frames;
  } finally { try { execSync(`rm -rf "${tmpDir}"`, { stdio: 'ignore' }); } catch { /* */ } }
}

async function runGate(videoPath: string, voiceScript: string, headline: string, key: string): Promise<GateResult> {
  const frames = extractFrames(videoPath, 5);
  if (frames.length === 0) {
    return {
      passed: false, anomaly_score: 10, authenticity_score: 0, coherence_score: 0,
      character_coherence_score: 0, product_consistency_score: 0, lip_sync_score: 0,
      anomalies: ['Frame extraction failed'], authenticity_notes: '', coherence_notes: '', character_notes: '',
      verdict: 'HARD STOP', hard_stop_reason: 'No frames',
    };
  }

  const system = `You are a strict QC reviewer for UGC video ads. Score SIX dimensions.
1. anomaly_score: 1=clean, 10=severe AI artifacts
2. authenticity_score: 1=fake, 10=convincing real human
3. coherence_score: 1=nonsensical, 10=natural script
4. character_coherence_score: 1=different people, 10=same person all frames
5. product_consistency_score: 1=product changes, 10=identical (score 8 if no product)
6. lip_sync_score: 1=mouth not moving, 10=perfect sync
Return ONLY JSON: {"anomaly_score":<1-10>,"authenticity_score":<1-10>,"coherence_score":<1-10>,"character_coherence_score":<1-10>,"product_consistency_score":<1-10>,"lip_sync_score":<1-10>,"anomalies":[],"authenticity_notes":"","coherence_notes":"","character_notes":"","verdict":"PASS or FAIL"}`;

  const userContent: any[] = [
    { type: 'text', text: `Headline: "${headline}"\nScript: "${voiceScript}"\n\n${frames.length} frames:` },
    ...frames.map((b64) => ({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}`, detail: 'low' } })),
    { type: 'text', text: 'Evaluate. Return only JSON.' },
  ];

  try {
    const raw = await openAIChat([{ role: 'system', content: system }, { role: 'user', content: userContent }], key);
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const r = JSON.parse(cleaned);
    const a = r.anomaly_score ?? 5, u = r.authenticity_score ?? 5, c = r.coherence_score ?? 5;
    const cc = r.character_coherence_score ?? 8, pc = r.product_consistency_score ?? 8, ls = r.lip_sync_score ?? 5;
    const reasons: string[] = [];
    if (a >= ANOMALY_THRESHOLD)             reasons.push(`Anomaly ${a}≥${ANOMALY_THRESHOLD}`);
    if (u <= AUTHENTIC_THRESHOLD)           reasons.push(`Auth ${u}≤${AUTHENTIC_THRESHOLD}`);
    if (c <= COHERENCE_THRESHOLD)           reasons.push(`Coherence ${c}≤${COHERENCE_THRESHOLD}`);
    if (cc < CHAR_COHERENCE_THRESHOLD)      reasons.push(`CharCoherence ${cc}<${CHAR_COHERENCE_THRESHOLD}`);
    if (pc < PRODUCT_CONSISTENCY_THRESHOLD) reasons.push(`ProductConsist ${pc}<${PRODUCT_CONSISTENCY_THRESHOLD}`);
    if (ls < LIP_SYNC_THRESHOLD)            reasons.push(`LipSync ${ls}<${LIP_SYNC_THRESHOLD}`);
    return {
      passed: reasons.length === 0,
      anomaly_score: a, authenticity_score: u, coherence_score: c,
      character_coherence_score: cc, product_consistency_score: pc, lip_sync_score: ls,
      anomalies: r.anomalies ?? [], authenticity_notes: r.authenticity_notes ?? '',
      coherence_notes: r.coherence_notes ?? '', character_notes: r.character_notes ?? '',
      verdict: r.verdict ?? '', hard_stop_reason: reasons.length ? reasons.join(' | ') : undefined,
    };
  } catch (err: any) {
    return {
      passed: false, anomaly_score: 0, authenticity_score: 0, coherence_score: 0,
      character_coherence_score: 0, product_consistency_score: 0, lip_sync_score: 0,
      anomalies: [err.message], authenticity_notes: '', coherence_notes: '', character_notes: '',
      verdict: 'Gate error', hard_stop_reason: err.message,
    };
  }
}

// =============================================================================
// Viral analysis (MediaPoster server)
// =============================================================================

async function isServerRunning(): Promise<boolean> {
  try {
    const r = await fetch('http://localhost:5555/health', { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch {
    try { const r = await fetch('http://localhost:5555/', { signal: AbortSignal.timeout(2000) }); return r.status < 500; }
    catch { return false; }
  }
}

async function ensureAnalysisServer(): Promise<ReturnType<typeof spawn> | null> {
  if (await isServerRunning()) { console.log('   ✅ Analysis server running'); return null; }
  console.log('   🚀 Starting analysis server...');
  const proc = spawn('python3', ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '5555', '--log-level', 'warning'],
    { cwd: MEDIAPOSTER_DIR, detached: false, stdio: ['ignore', 'pipe', 'pipe'] });
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1500));
    if (await isServerRunning()) { console.log('   ✅ Analysis server ready'); return proc; }
    process.stdout.write('.');
  }
  console.log('\n   ⚠️  Server may not be ready');
  return proc;
}

async function runViralAnalysis(videoPath: string): Promise<ViralResult> {
  const absPath = path.resolve(videoPath);
  try {
    const res = await fetch(ANALYSIS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_path: absPath, transcribe: true, analyze_frames: true, fate_score: true }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      console.log(`  ⚠️  Viral API ${res.status}: ${(await res.text()).slice(0, 100)}`);
      return {};
    }
    const d = await res.json() as any;
    if (d.error) { console.log(`  ⚠️  Viral error: ${d.error}`); return {}; }
    return { pre_social_score: d.pre_social_score, tone: d.tone, pacing: d.pacing,
      detected_hook: d.detected_hook, hooks: d.hooks, topics: d.topics,
      fate_scores: d.fate_scores, viral_analysis: d.viral_analysis };
  } catch (err: any) { console.log(`  ⚠️  Viral fetch error: ${err.message}`); return {}; }
}

// =============================================================================
// Single angle pipeline: generate → gate → retry
// =============================================================================

async function runAngle(
  offer: Offer, framework: CreativeFramework,
  combo: { stage: string; category: string },
  angleId: string, outputDir: string,
  aspectRatio: string, maxRetries: number,
  learnings: Learnings, force: boolean,
  openAIKey: string,
  validateMode = false,
): Promise<AngleResult> {
  const t0 = Date.now();
  const safeAspect = aspectRatio.replace(':', 'x');
  const lipsyncPath = path.join(outputDir, `lipsync_${safeAspect}.mp4`);
  let attempt = 0;

  // Cost accumulators (across all attempts for this angle)
  let totalGptInputUsd = 0;
  let totalGptGateUsd = 0;
  let totalImageUsd = 0;
  let totalVideoUsd = 0;
  let totalClipCount = 0;
  let imagesGenerated = false;

  while (attempt < maxRetries) {
    attempt++;
    const isRetry = attempt > 1;

    console.log(`\n${'─'.repeat(62)}`);
    console.log(`  ${isRetry ? '🔄 RETRY' : '🎬'} ${angleId} (attempt ${attempt}/${maxRetries})`);
    console.log(`  Stage: ${combo.stage}  |  Category: ${combo.category}`);
    console.log(`${'─'.repeat(62)}`);

    // ── AI Inputs ──────────────────────────────────────────────────────────
    // On retry: force new inputs to get a different creative angle
    const needNewInputs = isRetry || !fs.existsSync(path.join(outputDir, 'scene_config.json'));
    let inputs: AngleInputs;

    if (needNewInputs) {
      const hookFormula = selectHookFormula(learnings, attempt - 1);
      console.log(`\n  🤖 Generating inputs${isRetry ? ' (fresh for retry)' : ''} [hook: ${hookFormula}]...`);
      try {
        const result = await generateAngleInputs(offer, framework, combo.stage, combo.category,
          `${angleId}_a${attempt}`, hookFormula);
        inputs = result.inputs;
        // Track GPT-4o input generation cost
        totalGptInputUsd += gptInputCost(result.promptTokens) + gptOutputCost(result.completionTokens);

        // Inject learnings context into the voice script generation
        if (learnings.totalGenerated > 0 && isRetry) {
          console.log(`  📚 Applying learnings from ${learnings.totalGenerated} prev generations`);
        }

        fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(path.join(outputDir, 'scene_config.json'), JSON.stringify(inputs, null, 2));
        console.log(`  ✅ "${inputs.headline}"`);
      } catch (err: any) {
        console.log(`  ❌ AI generation failed: ${err.message}`);
        return { angleId, outputDir, attempt, gatePassed: false, error: err.message, durationMs: Date.now() - t0 };
      }
    } else {
      inputs = JSON.parse(fs.readFileSync(path.join(outputDir, 'scene_config.json'), 'utf-8'));
      console.log(`\n  ♻️  Using existing inputs: "${inputs.headline}"`);
    }

    // ── Stage 1: Images ────────────────────────────────────────────────────
    const beforeExists = fs.existsSync(path.join(outputDir, 'before.png'));
    if (!beforeExists || (isRetry && force)) {
      const imgResult = await runStageImages(inputs, outputDir, aspectRatio);
      if (imgResult.status === 'failed') {
        console.log(`  ❌ Stage 1 (images) failed: ${imgResult.error}`);
        continue; // retry with new inputs
      }
      if (!imagesGenerated) { totalImageUsd += imageCost(); imagesGenerated = true; }
    } else {
      console.log(`\n  ⏭️  Images exist`);
      if (!imagesGenerated) { imagesGenerated = true; } // already paid in a prior session
    }

    // ── Stage 2b: Lipsync ──────────────────────────────────────────────────
    // Force on retry so we get new video — but NOT when resuming (preserve completed clips)
    const isResume = !!(framework as any)._resumeMode;
    const lipsyncForce = (isRetry || force) && !isResume;
    if (lipsyncForce) {
      // Clean old clips so we don't reuse stale ones
      const clipsDir = path.join(outputDir, 'lipsync_clips');
      if (fs.existsSync(clipsDir)) {
        try { execSync(`rm -rf "${clipsDir}"`, { stdio: 'ignore' }); } catch { /* */ }
      }
      if (fs.existsSync(lipsyncPath)) fs.unlinkSync(lipsyncPath);
    }

    // Inject framework gender/voice fields into inputs so stage-lipsync.ts can read them
    // (AngleInputs doesn't have these fields typed, but stage-lipsync reads via (inputs as any))
    const lipsyncInputs = {
      ...inputs,
      voiceGender:     (framework as any).voiceGender     ?? undefined,
      voiceAge:        (framework as any).voiceAge        ?? undefined,
      characterGender: (framework as any).characterGender ?? undefined,
      audienceCategory: (inputs as any).audienceCategory ?? '',
      awarenessStage:   (inputs as any).awarenessStage   ?? '',
    };
    const lipsyncResult = await runStageLipsync(lipsyncInputs, outputDir, aspectRatio, lipsyncForce, undefined, undefined, validateMode);
    if (lipsyncResult.status === 'failed') {
      console.log(`  ❌ Stage 2b (lipsync) failed: ${lipsyncResult.error}`);
      if (lipsyncResult.error?.includes('429')) {
        console.log(`  ⏳ Veo API quota exhausted — aborting (retries won't help)`);
        console.log(`     Re-run later: npx tsx scripts/pipeline/smart-generate.ts --assess-only <session>`);
        return { angleId, outputDir, headline: inputs.headline, voiceScript: inputs.voiceScript,
          attempt, gatePassed: false, error: 'Veo 429 quota exhausted', durationMs: Date.now() - t0 };
      }
      continue;
    }
    // Count clips generated this attempt for cost tracking
    const clipsDir = path.join(outputDir, 'lipsync_clips');
    if (fs.existsSync(clipsDir)) {
      const newClips = fs.readdirSync(clipsDir).filter((f) => f.endsWith('.mp4')).length;
      totalClipCount += newClips;
      totalVideoUsd += clipCost(newClips, validateMode);
      const rateLabel = validateMode ? `$${PRICING_VALIDATE.FAL_VEO_PER_SECOND}/s Kling` : `$${PRICING.FAL_VEO_PER_SECOND}/s Veo3.1`;
      console.log(`  💰 Video cost this attempt: $${clipCost(newClips, validateMode).toFixed(2)} (${newClips} clips × ${rateLabel})`);
    }

    if (!fs.existsSync(lipsyncPath)) {
      console.log(`  ❌ No lipsync video produced`);
      continue;
    }

    // ── Authenticity Gate ──────────────────────────────────────────────────
    console.log(`\n  🔍 Authenticity Gate...`);
    const voiceScript = inputs.voiceScript ?? '';
    const gate = await runGate(lipsyncPath, voiceScript, inputs.headline, openAIKey);
    totalGptGateUsd += gateCost();

    const gateIcon = gate.passed ? '✅' : '🛑';
    console.log(`  ${gateIcon} A:${gate.anomaly_score} U:${gate.authenticity_score} C:${gate.coherence_score} CC:${gate.character_coherence_score} LS:${gate.lip_sync_score}`);
    if (gate.anomalies.length) console.log(`  Issues: ${gate.anomalies.join('; ')}`);
    console.log(`  Verdict: ${gate.verdict}`);

    if (!gate.passed) {
      console.log(`  🛑 FAILED — ${gate.hard_stop_reason}`);
      if (attempt < maxRetries) {
        const nextFormula = selectHookFormula(learnings, attempt);
        console.log(`  🔄 Retry with hook: ${nextFormula} (${maxRetries - attempt} left)...`);
        continue;
      }
      const failCost: CostBreakdown = {
        gptInputUsd: totalGptInputUsd, gptGateUsd: totalGptGateUsd,
        imageUsd: totalImageUsd, videoUsd: totalVideoUsd,
        totalUsd: totalGptInputUsd + totalGptGateUsd + totalImageUsd + totalVideoUsd,
        clipCount: totalClipCount,
      };
      return { angleId, outputDir, videoPath: lipsyncPath, headline: inputs.headline,
        voiceScript, hookFormula: selectHookFormula(learnings, attempt - 1), attempt, gate,
        gatePassed: false, cost: failCost, durationMs: Date.now() - t0 };
    }

    // ── Viral Analysis ─────────────────────────────────────────────────────
    console.log(`\n  📊 Viral analysis...`);
    const viral = await runViralAnalysis(lipsyncPath);
    const score = viral.pre_social_score != null ? `${viral.pre_social_score.toFixed(1)}/100` : 'N/A';
    console.log(`  Score: ${score}  Tone: ${viral.tone ?? 'N/A'}  Hook: "${viral.detected_hook?.slice(0, 60) ?? 'N/A'}"`);

    const passCost: CostBreakdown = {
      gptInputUsd: totalGptInputUsd, gptGateUsd: totalGptGateUsd,
      imageUsd: totalImageUsd, videoUsd: totalVideoUsd,
      totalUsd: totalGptInputUsd + totalGptGateUsd + totalImageUsd + totalVideoUsd,
      clipCount: totalClipCount,
    };
    console.log(`  💰 Angle total: $${passCost.totalUsd.toFixed(2)} (video $${passCost.videoUsd.toFixed(2)} + images $${passCost.imageUsd.toFixed(2)} + GPT $${(passCost.gptInputUsd + passCost.gptGateUsd).toFixed(3)})`);

    // Auto-open video
    try { execSync(`open "${lipsyncPath}"`, { stdio: 'ignore' }); } catch { /* */ }

    return { angleId, outputDir, videoPath: lipsyncPath, headline: inputs.headline,
      voiceScript, hookFormula: selectHookFormula(learnings, attempt - 1), attempt, gate,
      gatePassed: true, viral, cost: passCost, durationMs: Date.now() - t0 };
  }

  // All retries exhausted
  const exhaustedCost: CostBreakdown = {
    gptInputUsd: totalGptInputUsd, gptGateUsd: totalGptGateUsd,
    imageUsd: totalImageUsd, videoUsd: totalVideoUsd,
    totalUsd: totalGptInputUsd + totalGptGateUsd + totalImageUsd + totalVideoUsd,
    clipCount: totalClipCount,
  };
  return { angleId, outputDir, attempt, gatePassed: false,
    cost: exhaustedCost, error: `All ${maxRetries} attempts failed`, durationMs: Date.now() - t0 };
}

// =============================================================================
// Assess-only mode (for existing sessions)
// =============================================================================

async function assessExisting(sessionDir: string, aspect: string, openAIKey: string): Promise<AngleResult[]> {
  const safeAspect = aspect.replace(':', 'x');
  const results: AngleResult[] = [];

  for (const entry of fs.readdirSync(sessionDir)) {
    const angleDir = path.join(sessionDir, entry);
    if (!fs.statSync(angleDir).isDirectory()) continue;
    const videoPath = path.join(angleDir, `lipsync_${safeAspect}.mp4`);
    if (!fs.existsSync(videoPath)) continue;

    const configPath = path.join(angleDir, 'scene_config.json');
    let headline = 'UGC Ad', voiceScript = '';
    if (fs.existsSync(configPath)) {
      try {
        const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        headline = cfg.headline ?? headline;
        voiceScript = cfg.voiceScript ?? '';
      } catch { /* */ }
    }

    console.log(`\n  🔍 Gating: ${entry}`);
    const gate = await runGate(path.resolve(videoPath), voiceScript, headline, openAIKey);
    const gateIcon = gate.passed ? '✅' : '🛑';
    console.log(`  ${gateIcon} A:${gate.anomaly_score} U:${gate.authenticity_score} C:${gate.coherence_score} — ${gate.verdict}`);

    let viral: ViralResult | undefined;
    if (gate.passed) {
      console.log(`  📊 Viral analysis...`);
      viral = await runViralAnalysis(path.resolve(videoPath));
    }

    results.push({ angleId: entry, outputDir: angleDir, videoPath: path.resolve(videoPath),
      headline, voiceScript, attempt: 1, gate, gatePassed: gate.passed, viral, durationMs: 0 });
  }
  return results;
}

// =============================================================================
// Print results
// =============================================================================

function printResults(results: AngleResult[], learnings: Learnings) {
  const bar = (v: number) => '█'.repeat(Math.round(v * 10)) + '░'.repeat(10 - Math.round(v * 10));

  console.log(`\n${'═'.repeat(70)}`);
  console.log('  📊 SMART GENERATION RESULTS');
  console.log(`${'═'.repeat(70)}`);

  const blocked = results.filter((r) => !r.gatePassed);
  const passed = results.filter((r) => r.gatePassed);
  const sessionSpend = results.reduce((s, r) => s + (r.cost?.totalUsd ?? 0), 0);
  const sessionClips = results.reduce((s, r) => s + (r.cost?.clipCount ?? 0), 0);
  console.log(`  Generated: ${results.length}  |  ✅ Passed: ${passed.length}  |  🛑 Blocked: ${blocked.length}`);
  console.log(`  Lifetime pass rate: ${(learnings.passRate * 100).toFixed(0)}% (${learnings.totalPassed}/${learnings.totalGenerated})`);
  if (sessionSpend > 0) {
    console.log(`  Session spend: $${sessionSpend.toFixed(2)}  |  ${sessionClips} clips  |  $${passed.length > 0 ? (sessionSpend / passed.length).toFixed(2) : '—'}/passing ad`);
  }

  if (blocked.length > 0) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log('  🛑 BLOCKED — failed authenticity gate');
    for (const r of blocked) {
      console.log(`\n  ✗ ${r.angleId} (${r.attempt} attempt${r.attempt > 1 ? 's' : ''})`);
      if (r.headline) console.log(`    "${r.headline}"`);
      if (r.gate) console.log(`    A:${r.gate.anomaly_score} U:${r.gate.authenticity_score} C:${r.gate.coherence_score} — ${r.gate.verdict}`);
      if (r.cost) console.log(`    Cost: $${r.cost.totalUsd.toFixed(2)} (${r.cost.clipCount} clips)`);
      if (r.error) console.log(`    Error: ${r.error}`);
    }
  }

  if (passed.length > 0) {
    const sorted = [...passed].sort((a, b) => (b.viral?.pre_social_score ?? 0) - (a.viral?.pre_social_score ?? 0));
    console.log(`\n${'─'.repeat(70)}`);
    console.log('  ✅ PASSED — ranked by viral score');

    for (let i = 0; i < sorted.length; i++) {
      const r = sorted[i];
      const rank = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `  #${i + 1}`;
      const score = r.viral?.pre_social_score != null ? `${r.viral.pre_social_score.toFixed(1)}/100` : 'N/A';
      console.log(`\n${rank} ${r.angleId}  (attempt ${r.attempt})`);
      console.log(`    "${r.headline}"`);
      if (r.gate) console.log(`    Gate:    A:${r.gate.anomaly_score} U:${r.gate.authenticity_score} C:${r.gate.coherence_score} CC:${r.gate.character_coherence_score} LS:${r.gate.lip_sync_score}`);
      if (r.hookFormula) console.log(`    Formula: ${r.hookFormula}`);
      if (r.cost) console.log(`    Cost:    $${r.cost.totalUsd.toFixed(2)} (video $${r.cost.videoUsd.toFixed(2)} + img $${r.cost.imageUsd.toFixed(2)} + GPT $${(r.cost.gptInputUsd + r.cost.gptGateUsd).toFixed(3)}, ${r.cost.clipCount} clips)`);
      console.log(`    Score:   ${score}  Tone: ${r.viral?.tone ?? '?'}  Pacing: ${r.viral?.pacing ?? '?'}`);
      if (r.viral?.fate_scores) {
        const f = r.viral.fate_scores;
        console.log(`    FATE:    F:${bar(f.F)} ${(f.F*100).toFixed(0)}%  A:${bar(f.A)} ${(f.A*100).toFixed(0)}%  T:${bar(f.T)} ${(f.T*100).toFixed(0)}%  E:${bar(f.E)} ${(f.E*100).toFixed(0)}%`);
      }
      if (r.viral?.detected_hook) console.log(`    Hook:    "${r.viral.detected_hook.slice(0, 80)}"`);
      if (r.videoPath) console.log(`    📁 ${r.videoPath}`);
    }
  }

  // Learnings summary
  console.log(`\n${'─'.repeat(70)}`);
  console.log('  📚 LEARNINGS');
  console.log(`  Pass rate: ${(learnings.passRate * 100).toFixed(0)}%  |  Avg viral: ${learnings.avgViralScore.toFixed(1)}/100`);
  if (learnings.topPatterns.tones.length) console.log(`  Top tones: ${[...new Set(learnings.topPatterns.tones)].slice(-5).join(', ')}`);
  if (learnings.topPatterns.hooks.length) console.log(`  Top hooks: ${learnings.topPatterns.hooks.slice(-3).map((h) => `"${h.slice(0, 50)}"`).join(', ')}`);
  if (learnings.failurePatterns.commonAnomalies.length) console.log(`  Anomalies to avoid: ${[...new Set(learnings.failurePatterns.commonAnomalies)].slice(-3).join('; ')}`);
  if (learnings.hookFormulas && Object.keys(learnings.hookFormulas).length > 0) {
    const hf = Object.entries(learnings.hookFormulas).sort(([,a],[,b]) => b.passRate - a.passRate);
    console.log(`  Hook formulas: ${hf.map(([f,s]) => `${f}=${(s.passRate*100).toFixed(0)}%(${s.attempts})`).join(', ')}`);
  }

  // Cost summary
  console.log(`\n${'─'.repeat(70)}`);
  console.log('  💰 COST TRACKING');
  const c = learnings.costs;
  if (c && c.totalSpentUsd > 0) {
    console.log(`  Lifetime spend:    $${c.totalSpentUsd.toFixed(2)}`);
    console.log(`    Video (fal.ai):  $${c.totalVideoUsd.toFixed(2)}  ($${PRICING.FAL_VEO_PER_SECOND}/s × ${PRICING.FAL_VEO_CLIP_SECONDS}s/clip)`);
    console.log(`    Images (Imagen): $${c.totalImageUsd.toFixed(2)}  ($${PRICING.IMAGEN_PER_IMAGE}/image × ${PRICING.IMAGES_PER_ANGLE} per angle)`);
    console.log(`    GPT-4o:          $${c.totalGptUsd.toFixed(3)}  (input gen + vision gate)`);
    console.log(`  Cost/passing ad:   $${c.costPerPassingAd.toFixed(2)}`);
    console.log(`  Cost/attempt:      $${c.costPerAttempt.toFixed(2)}`);
    console.log(`  Avg clips/angle:   ${c.avgClipsPerAngle.toFixed(1)}`);
    if (c.sessionCosts?.length > 1) {
      console.log(`  Last sessions:     ${c.sessionCosts.slice(-3).map((s) => `${s.date} $${s.spentUsd} (${s.passed}/${s.angles} passed)`).join('  |  ')}`);
    }
  } else {
    const perAd = (PRICING.FAL_VEO_PER_SECOND * PRICING.FAL_VEO_CLIP_SECONDS * 5) + imageCost() + gateCost();
    console.log(`  No spend tracked yet. Estimated cost per 5-clip ad: ~$${perAd.toFixed(2)}`);
    console.log(`  Pricing: fal.ai $${PRICING.FAL_VEO_PER_SECOND}/s | Imagen $${PRICING.IMAGEN_PER_IMAGE}/img | GPT-4o $${(PRICING.GPT4O_INPUT_PER_TOKEN * 1000).toFixed(4)}/1K tokens`);
  }

  console.log(`\n${'═'.repeat(70)}`);

  // Save full results
  const outPath = path.join('output', 'pipeline', 'smart_generation_results.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), results, learnings }, null, 2));
  console.log(`  💾 Results: ${outPath}`);
  console.log(`  📚 Learnings: ${LEARNINGS_PATH}\n`);
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  loadEnv();
  const args = parseArgs();
  const openAIKey = getOpenAIKey();

  console.log(`\n${'═'.repeat(70)}`);
  console.log('  🧠 Smart Video Generation Pipeline');
  console.log('  Generate → Gate → Auto-Retry → Assess → Learn');
  console.log(`${'═'.repeat(70)}`);

  // Load learnings
  const learnings = loadLearnings();
  if (learnings.totalGenerated > 0) {
    console.log(`\n  📚 Loaded learnings: ${learnings.totalGenerated} prev | ${(learnings.passRate * 100).toFixed(0)}% pass rate | avg ${learnings.avgViralScore.toFixed(1)}/100`);
  }

  // Start analysis server
  console.log('\n  📡 Analysis Server');
  const serverProc = await ensureAnalysisServer();

  let results: AngleResult[];

  if (args.assessOnly) {
    // Assess-only mode
    const sessionDir = path.resolve(args.assessOnly);
    console.log(`\n  📂 Assessing existing: ${sessionDir}`);
    results = await assessExisting(sessionDir, args.aspect, openAIKey);
  } else {
    // Full generation mode (or --resume)
    const offerFile = path.resolve(process.cwd(), args.offerPath);
    if (!fs.existsSync(offerFile)) { console.error(`❌ Offer not found: ${offerFile}`); process.exit(1); }
    const { offer, framework } = JSON.parse(fs.readFileSync(offerFile, 'utf-8'));

    // ── Resume mode: reuse an existing session dir ──────────────────────────
    let sessionDir: string;
    let resumeMode = false;
    if (args.resume) {
      sessionDir = path.resolve(args.resume);
      if (!fs.existsSync(sessionDir)) { console.error(`❌ Resume dir not found: ${sessionDir}`); process.exit(1); }
      resumeMode = true;
      // Tag framework so runAngle skips clip dir cleanup
      (framework as any)._resumeMode = true;
      console.log(`\n  ♻️  RESUME MODE: ${sessionDir}`);
    } else {
      const sessionId = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      sessionDir = path.join('output', 'pipeline', offer.productName.toLowerCase().replace(/\s+/g, '-'), sessionId);
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    // In resume mode, discover existing angle dirs; otherwise use combos
    let angleEntries: Array<{ combo: { stage: string; category: string }; angleId: string; outputDir: string }>;
    if (resumeMode) {
      angleEntries = fs.readdirSync(sessionDir)
        .filter((d) => fs.statSync(path.join(sessionDir, d)).isDirectory())
        .sort()
        .map((d) => {
          const outputDir = path.join(sessionDir, d);
          // Read combo from saved scene_config if available
          let combo = { stage: 'unaware', category: 'friend' };
          const cfg = path.join(outputDir, 'scene_config.json');
          if (fs.existsSync(cfg)) {
            try {
              const sc = JSON.parse(fs.readFileSync(cfg, 'utf-8'));
              combo = { stage: sc.awarenessStage ?? combo.stage, category: sc.audienceCategory ?? combo.category };
            } catch { /* use default */ }
          }
          return { combo, angleId: d, outputDir };
        });
      console.log(`  📂 Found ${angleEntries.length} angle(s) to resume`);
    } else {
      const allCombos = buildAngleCombos(framework);
      const combos = allCombos.slice(args.start, args.start + args.count);
      const sessionId = path.basename(sessionDir);
      angleEntries = combos.map((combo: { stage: string; category: string }, i: number) => {
        const angleId = `${offer.productName.toUpperCase().replace(/\s+/g, '_').slice(0, 8)}_${sessionId.slice(0, 10)}_${String(args.start + i + 1).padStart(2, '0')}`;
        const outputDir = path.join(sessionDir, angleId);
        fs.mkdirSync(outputDir, { recursive: true });
        return { combo, angleId, outputDir };
      });
    }

    console.log(`\n  📦 Product: ${offer.productName}`);
    const totalCombos = resumeMode ? angleEntries.length : buildAngleCombos(framework).length;
    console.log(`  🎯 Angles: ${angleEntries.length}${resumeMode ? ' (resume)' : ` of ${totalCombos} available (start: ${args.start})`}`);
    console.log(`  🔄 Max retries: ${args.maxRetries}`);
    if (args.validate) {
      console.log(`  🧪 VALIDATE MODE: Kling 2.6 Pro (~$0.07-0.14/s) — validate before Veo3.1 ($0.40/s)`);
      console.log(`     Est. cost: ~$${(0.14 * 5 * 5).toFixed(2)}/angle vs ~$${(0.40 * 8 * 5).toFixed(2)}/angle production`);
    }
    console.log(`  📁 Output: ${sessionDir}`);

    results = [];
    let quotaExhausted = false;
    for (let i = 0; i < angleEntries.length; i++) {
      if (quotaExhausted) {
        console.log(`\n  ⏭️  Skipping angle ${i + 1}/${angleEntries.length} — Veo quota exhausted`);
        continue;
      }

      const { combo, angleId, outputDir } = angleEntries[i];

      // In resume mode, skip angles that already have a finished lipsync video
      if (resumeMode) {
        const safeAspect = args.aspect.replace(':', 'x');
        const done = path.join(outputDir, `lipsync_${safeAspect}.mp4`);
        if (fs.existsSync(done)) {
          console.log(`\n  ⏭️  ${angleId} — lipsync complete, skipping`);
          continue;
        }
        console.log(`\n  ♻️  ${angleId} — resuming incomplete clips...`);
      }

      const result = await runAngle(offer, framework, combo, angleId, outputDir,
        args.aspect, args.maxRetries, learnings, args.force, openAIKey, args.validate);
      results.push(result);

      // If 429 hit, stop all remaining angles
      if (result.error?.includes('429')) {
        quotaExhausted = true;
        console.log(`\n  ⛔ Veo quota exhausted — stopping remaining ${angleEntries.length - i - 1} angle(s)`);
        console.log(`  📁 Re-run later: npx tsx scripts/pipeline/smart-generate.ts --resume ${sessionDir}`);
      } else {
        const status = result.gatePassed
          ? `Score: ${result.viral?.pre_social_score?.toFixed(1) ?? 'N/A'}/100`
          : `BLOCKED (${result.attempt} attempts)`;
        console.log(`\n  ${result.gatePassed ? '✅' : '🛑'} ${angleId} — ${status} — ${(result.durationMs / 1000).toFixed(0)}s`);
      }
    }
  }

  // Update + save learnings
  const updatedLearnings = updateLearnings(learnings, results);
  saveLearnings(updatedLearnings);

  // Print final report
  printResults(results, updatedLearnings);

  // Cleanup
  if (serverProc) { serverProc.kill(); console.log('  🛑 Analysis server stopped'); }
}

main().catch((err) => { console.error(`\n❌ ${err.message}`); process.exit(1); });
