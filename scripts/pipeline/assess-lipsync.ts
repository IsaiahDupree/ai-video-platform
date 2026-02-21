#!/usr/bin/env npx tsx
/**
 * Lip-Sync Assessment Pipeline
 *
 * 1. Generates N lipsync videos via run.ts (--lipsync flag)
 * 2. Ensures MediaPoster analysis server is running (port 5555)
 * 3. Runs AI Authenticity Gate (GPT-4o vision) — HARD STOP on failures:
 *    - AI anomaly detection (uncanny valley, melting faces, impossible geometry, etc.)
 *    - UGC authenticity check (does this pass as a real person's video?)
 *    - Script coherence check (does the spoken dialogue make sense for the ad?)
 * 4. POSTs passing videos to POST /api/analysis/analyze-file for viral scoring
 * 5. Prints ranked table with gate results, viral score, FATE scores
 *
 * Usage:
 *   npx tsx scripts/pipeline/assess-lipsync.ts --count 2
 *   npx tsx scripts/pipeline/assess-lipsync.ts --count 1 --start 2
 *   npx tsx scripts/pipeline/assess-lipsync.ts --existing output/pipeline/everreach/2026-02-21T02-50-44
 *
 * Flags:
 *   --count=<n>      Number of angles to generate (default: 2)
 *   --start=<n>      Start index into angle combos (default: 0)
 *   --aspect=<r>     Aspect ratio (default: 9:16)
 *   --existing=<dir> Skip generation, analyze existing session dir
 *   --no-generate    Skip generation, only analyze videos already in output/
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { execSync, spawn } from 'child_process';

const ANALYSIS_URL = 'http://localhost:5555/api/analysis/analyze-file';
const MEDIAPOSTER_DIR = '/Users/isaiahdupree/Documents/Software/MediaPoster/Backend';

// Hard-stop thresholds for the authenticity gate
// Tightened from original values based on 90% win rate target
const ANOMALY_THRESHOLD = 4;           // anomaly_score >= this = hard stop (was 6)
const AUTHENTIC_THRESHOLD = 6;         // authenticity_score <= this = hard stop (was 4)
const COHERENCE_THRESHOLD = 6;         // coherence_score <= this = hard stop (was 4)
const CHAR_COHERENCE_THRESHOLD = 7;    // character_coherence_score < this = hard stop (NEW)
const PRODUCT_CONSISTENCY_THRESHOLD = 7; // product_consistency_score < this = hard stop (NEW)
const LIP_SYNC_THRESHOLD = 6;          // lip_sync_score < this = hard stop (NEW)

// =============================================================================
// Arg parsing
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
    count: parseInt(get('count') ?? '2', 10),
    start: parseInt(get('start') ?? '0', 10),
    aspect: get('aspect') ?? '9:16',
    existing: get('existing'),
    noGenerate: argv.includes('--no-generate'),
  };
}

// =============================================================================
// .env.local loader
// =============================================================================

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

// =============================================================================
// MediaPoster server management
// =============================================================================

async function isServerRunning(): Promise<boolean> {
  try {
    const res = await fetch('http://localhost:5555/health', { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    try {
      const res = await fetch('http://localhost:5555/', { signal: AbortSignal.timeout(2000) });
      return res.status < 500;
    } catch {
      return false;
    }
  }
}

async function startAnalysisServer(): Promise<{ proc: ReturnType<typeof spawn> | null; started: boolean }> {
  if (await isServerRunning()) {
    console.log('   ✅ Analysis server already running on :5555');
    return { proc: null, started: false };
  }

  console.log('   🚀 Starting MediaPoster analysis server...');
  const proc = spawn(
    'python3', ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '5555', '--log-level', 'warning'],
    { cwd: MEDIAPOSTER_DIR, detached: false, stdio: ['ignore', 'pipe', 'pipe'] }
  );

  // Wait up to 20s for server to be ready
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1500));
    if (await isServerRunning()) {
      console.log('   ✅ Analysis server ready');
      return { proc, started: true };
    }
    process.stdout.write('.');
  }
  console.log('\n   ⚠️  Server may not be ready — continuing anyway');
  return { proc, started: true };
}

// =============================================================================
// Video generation
// =============================================================================

async function generateVideos(count: number, start: number, aspect: string): Promise<string> {
  console.log(`\n🎬 Generating ${count} lipsync video(s) (start: ${start})...`);
  const cmd = [
    'npx', 'tsx', 'scripts/pipeline/run.ts',
    '--offer', 'offers/everreach.json',
    `--count=${count}`,
    `--start=${start}`,
    `--aspect=${aspect}`,
    '--lipsync',
  ];
  execSync(cmd.join(' '), { stdio: 'inherit', cwd: process.cwd() });

  // Find the most recent session dir
  const base = path.join('output', 'pipeline', 'everreach');
  const sessions = fs.readdirSync(base)
    .filter((d) => fs.statSync(path.join(base, d)).isDirectory())
    .sort()
    .reverse();
  return path.join(base, sessions[0]);
}

// =============================================================================
// Find all lipsync videos in a session dir
// =============================================================================

function findLipsyncVideos(sessionDir: string, aspect: string): Array<{ angleId: string; videoPath: string; configPath: string }> {
  const safeAspect = aspect.replace(':', 'x');
  const results: Array<{ angleId: string; videoPath: string; configPath: string }> = [];

  if (!fs.existsSync(sessionDir)) return results;

  for (const entry of fs.readdirSync(sessionDir)) {
    const angleDir = path.join(sessionDir, entry);
    if (!fs.statSync(angleDir).isDirectory()) continue;
    const videoPath = path.join(angleDir, `lipsync_${safeAspect}.mp4`);
    const configPath = path.join(angleDir, 'scene_config.json');
    if (fs.existsSync(videoPath)) {
      results.push({ angleId: entry, videoPath: path.resolve(videoPath), configPath });
    }
  }
  return results;
}

// =============================================================================
// AI Authenticity Gate
// =============================================================================

interface AuthenticityGateResult {
  passed: boolean;
  anomaly_score: number;              // 1=clean, 10=severe artifacts
  authenticity_score: number;         // 1=fake, 10=convincing real human
  coherence_score: number;            // 1=nonsensical, 10=natural script
  character_coherence_score: number;  // 1=different people, 10=same person all clips
  product_consistency_score: number;  // 1=product changes, 10=product identical all clips
  lip_sync_score: number;             // 1=mouth not moving, 10=perfect lip sync
  anomalies: string[];
  authenticity_notes: string;
  coherence_notes: string;
  character_notes: string;
  verdict: string;
  hard_stop_reason?: string;
}

function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set');
  return key;
}

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
            resolve(p.choices[0].message.content);
          } catch { reject(new Error(`OpenAI parse: ${data.slice(0, 200)}`)); }
        });
      }
    );
    req.on('error', reject); req.write(body); req.end();
  });
}

function extractFrames(videoPath: string, count = 5): string[] {
  const tmpDir = `/tmp/lipsync_frames_${Date.now()}`;
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
  } finally { try { execSync(`rm -rf "${tmpDir}"`, { stdio: 'ignore' }); } catch { /* ignore */ } }
}

async function runAuthenticityGate(
  videoPath: string, voiceScript: string, headline: string, key: string
): Promise<AuthenticityGateResult> {
  console.log(`   🔍 Extracting frames...`);
  const frames = extractFrames(videoPath, 5);
  if (frames.length === 0) {
    return {
      passed: false,
      anomaly_score: 10, authenticity_score: 0, coherence_score: 0,
      character_coherence_score: 0, product_consistency_score: 0, lip_sync_score: 0,
      anomalies: ['Frame extraction failed'], authenticity_notes: '', coherence_notes: '', character_notes: '',
      verdict: 'HARD STOP — could not read video', hard_stop_reason: 'Frame extraction failed',
    };
  }
  console.log(`   🤖 GPT-4o vision check (${frames.length} frames)...`);

  const system = `You are a strict QC reviewer for UGC (user-generated content) video ads.
Evaluate SIX dimensions from the video frames shown.

SCORING DIRECTIONS (IMPORTANT — read carefully):

1. anomaly_score: 1 = NO AI artifacts (clean), 10 = SEVERE AI artifacts
   Look for: face morphing, melting skin, impossible geometry, extra fingers, warped backgrounds,
   glassy/dead eyes, robotic movement, flickering features, unnatural hair/clothing behavior.

2. authenticity_score: 1 = obviously AI fake, 10 = completely convincing real human UGC
   Ask: would a TikTok/Instagram viewer believe this is a real person filming themselves?
   Natural body language? Relatable environment? Imperfect but believable?

3. coherence_score: 1 = nonsensical script, 10 = perfectly natural ad script
   Ask: does the spoken script make logical sense? Natural flow? Matches the headline?

4. character_coherence_score: 1 = completely different people across frames, 10 = same person throughout
   Look at: face shape, hair color/style, skin tone, clothing across ALL frames.
   This is critical — character drift between clips is the #1 AI tell in UGC ads.

5. product_consistency_score: 1 = product changes shape/color/disappears, 10 = product identical in all frames
   If no product is visible, score 8 (neutral). Only penalize if product IS shown but inconsistent.

6. lip_sync_score: 1 = mouth not moving / no speech, 10 = perfect lip sync with natural mouth movement
   Look for: is the mouth visibly moving? Does it look like the person is speaking?
   A closed mouth in a speaking clip = score 1-3.

Return ONLY valid JSON (no markdown fences):
{
  "anomaly_score": <1-10>,
  "authenticity_score": <1-10>,
  "coherence_score": <1-10>,
  "character_coherence_score": <1-10>,
  "product_consistency_score": <1-10>,
  "lip_sync_score": <1-10>,
  "anomalies": ["list specific issues or empty array"],
  "authenticity_notes": "what makes it real or fake",
  "coherence_notes": "script assessment",
  "character_notes": "character consistency assessment",
  "verdict": "PASS or FAIL with one-line reason"
}`;

  const userContent: any[] = [
    { type: 'text', text: `Headline: "${headline}"\nScript: "${voiceScript}"\n\n${frames.length} frames from the video:` },
    ...frames.map((b64) => ({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}`, detail: 'low' } })),
    { type: 'text', text: 'Evaluate for AI anomalies, UGC authenticity, and script coherence. Return only JSON.' },
  ];

  try {
    const raw = await openAIChat([{ role: 'system', content: system }, { role: 'user', content: userContent }], key);
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const r = JSON.parse(cleaned);
    const a: number = r.anomaly_score ?? 5;
    const u: number = r.authenticity_score ?? 5;
    const c: number = r.coherence_score ?? 5;
    const cc: number = r.character_coherence_score ?? 8;
    const pc: number = r.product_consistency_score ?? 8;
    const ls: number = r.lip_sync_score ?? 5;
    const reasons: string[] = [];
    if (a >= ANOMALY_THRESHOLD)              reasons.push(`Anomaly ${a}/10 ≥ ${ANOMALY_THRESHOLD}`);
    if (u <= AUTHENTIC_THRESHOLD)            reasons.push(`Authenticity ${u}/10 ≤ ${AUTHENTIC_THRESHOLD}`);
    if (c <= COHERENCE_THRESHOLD)            reasons.push(`Coherence ${c}/10 ≤ ${COHERENCE_THRESHOLD}`);
    if (cc < CHAR_COHERENCE_THRESHOLD)       reasons.push(`Character coherence ${cc}/10 < ${CHAR_COHERENCE_THRESHOLD} (character drift)`);
    if (pc < PRODUCT_CONSISTENCY_THRESHOLD)  reasons.push(`Product consistency ${pc}/10 < ${PRODUCT_CONSISTENCY_THRESHOLD} (product changes)`);
    if (ls < LIP_SYNC_THRESHOLD)             reasons.push(`Lip sync ${ls}/10 < ${LIP_SYNC_THRESHOLD} (mouth not moving)`);
    return {
      passed: reasons.length === 0,
      anomaly_score: a, authenticity_score: u, coherence_score: c,
      character_coherence_score: cc, product_consistency_score: pc, lip_sync_score: ls,
      anomalies: r.anomalies ?? [],
      authenticity_notes: r.authenticity_notes ?? '',
      coherence_notes: r.coherence_notes ?? '',
      character_notes: r.character_notes ?? '',
      verdict: r.verdict ?? '',
      hard_stop_reason: reasons.length ? reasons.join(' | ') : undefined,
    };
  } catch (err: any) {
    return {
      passed: false,
      anomaly_score: 0, authenticity_score: 0, coherence_score: 0,
      character_coherence_score: 0, product_consistency_score: 0, lip_sync_score: 0,
      anomalies: [err.message], authenticity_notes: '', coherence_notes: '', character_notes: '',
      verdict: 'Gate error', hard_stop_reason: err.message,
    };
  }
}

// =============================================================================
// Analysis
// =============================================================================

interface AnalysisResult {
  angleId: string;
  videoPath: string;
  headline?: string;
  voiceScript?: string;
  // Gate runs first — hard stop if failed
  gate?: AuthenticityGateResult;
  gatePassed?: boolean;
  // Viral analysis only runs if gate passed
  pre_social_score?: number;
  tone?: string;
  pacing?: string;
  detected_hook?: string;
  hooks?: string[];
  topics?: string[];
  fate_scores?: { F: number; A: number; T: number; E: number };
  viral_analysis?: string;
  error?: string;
}

async function analyzeVideo(angleId: string, videoPath: string, configPath: string): Promise<AnalysisResult> {
  let headline = 'UGC Ad';
  let voiceScript = '';
  if (fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      headline = cfg.headline ?? headline;
      // Sentence-split fallback same as ai-inputs.ts
      const raw: string = cfg.voiceScript ?? '';
      const lines = raw.split('\n').map((l: string) => l.trim()).filter(Boolean);
      voiceScript = lines.length > 1 ? lines.join(' ') : raw;
    } catch { /* ignore */ }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  🎬 ${angleId}`);
  console.log(`  File: ${path.basename(videoPath)}`);

  // ── Step A: Authenticity Gate (HARD STOP) ──────────────────────────────────
  console.log(`\n  ── Authenticity Gate ──────────────────────────────────────`);
  let gate: AuthenticityGateResult;
  try {
    gate = await runAuthenticityGate(videoPath, voiceScript, headline, getOpenAIKey());
  } catch (err: any) {
    gate = {
      passed: false, anomaly_score: 0, authenticity_score: 0, coherence_score: 0,
      character_coherence_score: 0, product_consistency_score: 0, lip_sync_score: 0,
      anomalies: [err.message], authenticity_notes: '', coherence_notes: '', character_notes: '',
      verdict: 'Gate check failed', hard_stop_reason: err.message,
    };
  }

  const gateIcon = gate.passed ? '✅ PASSED' : '🛑 HARD STOP';
  const ok = (v: number, min: number) => v >= min ? '✓' : '⚠️  FAIL';
  const okMax = (v: number, max: number) => v < max ? '✓' : '⚠️  FAIL';
  console.log(`  ${gateIcon}`);
  console.log(`  Anomaly:      ${gate.anomaly_score}/10  ${okMax(gate.anomaly_score, ANOMALY_THRESHOLD)}  (max ${ANOMALY_THRESHOLD})`);
  console.log(`  Authenticity: ${gate.authenticity_score}/10  ${ok(gate.authenticity_score, AUTHENTIC_THRESHOLD + 1)}  (min ${AUTHENTIC_THRESHOLD + 1})`);
  console.log(`  Coherence:    ${gate.coherence_score}/10  ${ok(gate.coherence_score, COHERENCE_THRESHOLD + 1)}  (min ${COHERENCE_THRESHOLD + 1})`);
  console.log(`  Char coherence:  ${gate.character_coherence_score}/10  ${ok(gate.character_coherence_score, CHAR_COHERENCE_THRESHOLD)}  (min ${CHAR_COHERENCE_THRESHOLD}) — same person across clips`);
  console.log(`  Product consist: ${gate.product_consistency_score}/10  ${ok(gate.product_consistency_score, PRODUCT_CONSISTENCY_THRESHOLD)}  (min ${PRODUCT_CONSISTENCY_THRESHOLD}) — product unchanged`);
  console.log(`  Lip sync:        ${gate.lip_sync_score}/10  ${ok(gate.lip_sync_score, LIP_SYNC_THRESHOLD)}  (min ${LIP_SYNC_THRESHOLD}) — mouth moving`);
  if (gate.anomalies.length) console.log(`  Issues:       ${gate.anomalies.join('; ')}`);
  if (gate.authenticity_notes) console.log(`  Auth notes:   ${gate.authenticity_notes}`);
  if (gate.character_notes) console.log(`  Char notes:   ${gate.character_notes}`);
  if (gate.coherence_notes) console.log(`  Script notes: ${gate.coherence_notes}`);
  console.log(`  Verdict:      ${gate.verdict}`);

  if (!gate.passed) {
    console.log(`\n  🛑 HARD STOP — skipping viral analysis`);
    return { angleId, videoPath, headline, voiceScript, gate, gatePassed: false };
  }

  // ── Step B: Viral Analysis (only if gate passed) ───────────────────────────
  console.log(`\n  ── Viral Analysis ─────────────────────────────────────────`);
  try {
    const res = await fetch(ANALYSIS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_path: videoPath, transcribe: true, analyze_frames: true, fate_score: true }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      const text = await res.text();
      return { angleId, videoPath, headline, voiceScript, gate, gatePassed: true,
        error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
    }
    const data = await res.json() as any;
    return { angleId, videoPath, headline, voiceScript, gate, gatePassed: true,
      pre_social_score: data.pre_social_score, tone: data.tone, pacing: data.pacing,
      detected_hook: data.detected_hook, hooks: data.hooks, topics: data.topics,
      fate_scores: data.fate_scores, viral_analysis: data.viral_analysis, error: data.error };
  } catch (err: any) {
    return { angleId, videoPath, headline, voiceScript, gate, gatePassed: true, error: err.message };
  }
}

// =============================================================================
// Print assessment table
// =============================================================================

function printAssessment(results: AnalysisResult[]) {
  const bar = (v: number) => '█'.repeat(Math.round(v * 10)) + '░'.repeat(10 - Math.round(v * 10));

  console.log(`\n${'═'.repeat(70)}`);
  console.log('  📊 LIP-SYNC VIDEO ASSESSMENT RESULTS');
  console.log(`${'═'.repeat(70)}`);

  const blocked = results.filter((r) => !r.gatePassed);
  const passed  = results.filter((r) =>  r.gatePassed);
  console.log(`  Gate: ${passed.length} passed  |  ${blocked.length} hard-stopped`);

  // ── Hard-stopped ──────────────────────────────────────────────────────────
  if (blocked.length > 0) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log('  🛑 HARD STOPS — not usable, regenerate these');
    console.log(`${'─'.repeat(70)}`);
    for (const r of blocked) {
      console.log(`\n  ✗ ${r.angleId}  "${r.headline}"`);
      if (r.gate) {
        console.log(`    Anomaly: ${r.gate.anomaly_score}/10  Auth: ${r.gate.authenticity_score}/10  Coherence: ${r.gate.coherence_score}/10  CharCoherence: ${r.gate.character_coherence_score}/10  LipSync: ${r.gate.lip_sync_score}/10`);
        if (r.gate.anomalies.length) console.log(`    Issues:      ${r.gate.anomalies.join('; ')}`);
        console.log(`    Verdict:     ${r.gate.verdict}`);
        console.log(`    Stop reason: ${r.gate.hard_stop_reason}`);
      }
      console.log(`    📁 ${r.videoPath}`);
    }
  }

  // ── Passed gate — ranked by viral score ───────────────────────────────────
  if (passed.length > 0) {
    const sorted = [...passed].sort((a, b) => (b.pre_social_score ?? 0) - (a.pre_social_score ?? 0));
    console.log(`\n${'─'.repeat(70)}`);
    console.log('  ✅ PASSED GATE — Viral Assessment');
    console.log(`${'─'.repeat(70)}`);

    for (let i = 0; i < sorted.length; i++) {
      const r = sorted[i];
      const rank = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `  #${i + 1}`;
      const score = r.pre_social_score != null ? `${r.pre_social_score.toFixed(1)}/100` : 'N/A';
      console.log(`\n${rank} ${r.angleId}  "${r.headline}"`);
      // Gate summary (compact)
      if (r.gate) {
        console.log(`    Gate:    Anomaly ${r.gate.anomaly_score}/10 | Auth ${r.gate.authenticity_score}/10 | Coherence ${r.gate.coherence_score}/10 | CharCoherence ${r.gate.character_coherence_score}/10 | LipSync ${r.gate.lip_sync_score}/10`);
        if (r.gate.authenticity_notes) console.log(`             ${r.gate.authenticity_notes.slice(0, 100)}`);
        if (r.gate.character_notes) console.log(`             ${r.gate.character_notes.slice(0, 100)}`);
      }
      console.log(`    Score:   ${score}`);
      if (r.tone)   console.log(`    Tone:    ${r.tone}  |  Pacing: ${r.pacing ?? 'N/A'}`);
      if (r.fate_scores) {
        const f = r.fate_scores;
        console.log(`    FATE:    F:${bar(f.F)} ${(f.F*100).toFixed(0)}%  A:${bar(f.A)} ${(f.A*100).toFixed(0)}%  T:${bar(f.T)} ${(f.T*100).toFixed(0)}%  E:${bar(f.E)} ${(f.E*100).toFixed(0)}%`);
      }
      if (r.detected_hook) console.log(`    Hook:    "${r.detected_hook.slice(0, 80)}"`);
      if (r.topics?.length) console.log(`    Topics:  ${r.topics.slice(0, 4).join(', ')}`);
      if (r.viral_analysis) console.log(`    Analysis: ${r.viral_analysis.slice(0, 120)}...`);
      if (r.error) console.log(`    ⚠️  Error: ${r.error}`);
      console.log(`    📁 ${r.videoPath}`);
    }

    const scored = sorted.filter((r) => r.pre_social_score != null);
    if (scored.length > 0) {
      const avg = scored.reduce((s, r) => s + (r.pre_social_score ?? 0), 0) / scored.length;
      console.log(`\n${'─'.repeat(70)}`);
      console.log(`  📈 Avg viral score: ${avg.toFixed(1)}/100`);
      console.log(`  🏆 Best: ${scored[0].angleId} (${scored[0].pre_social_score?.toFixed(1)}/100)`);
    }
  }

  console.log(`\n${'═'.repeat(70)}`);
  const outPath = path.join('output', 'pipeline', 'lipsync_assessment.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ assessedAt: new Date().toISOString(), results }, null, 2));
  console.log(`  💾 Saved: ${outPath}\n`);

  return passed.sort((a, b) => (b.pre_social_score ?? 0) - (a.pre_social_score ?? 0));
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  loadEnv();
  const args = parseArgs();

  console.log(`\n${'═'.repeat(70)}`);
  console.log('  🗣️  Lip-Sync Generation + Assessment Pipeline');
  console.log(`${'═'.repeat(70)}`);

  // Step 1: Start analysis server
  console.log('\n📡 Step 1: Analysis Server');
  const { proc: serverProc } = await startAnalysisServer();

  // Step 2: Generate or use existing
  let sessionDir: string;
  if (args.existing) {
    sessionDir = path.resolve(args.existing);
    console.log(`\n📂 Step 2: Using existing session: ${sessionDir}`);
  } else if (args.noGenerate) {
    // Find most recent session
    const base = path.join('output', 'pipeline', 'everreach');
    const sessions = fs.existsSync(base)
      ? fs.readdirSync(base).filter((d) => fs.statSync(path.join(base, d)).isDirectory()).sort().reverse()
      : [];
    if (!sessions.length) { console.error('No existing sessions found'); process.exit(1); }
    sessionDir = path.join(base, sessions[0]);
    console.log(`\n📂 Step 2: Using most recent session: ${sessionDir}`);
  } else {
    console.log('\n🎬 Step 2: Generating Videos');
    sessionDir = await generateVideos(args.count, args.start, args.aspect);
    console.log(`   Session: ${sessionDir}`);
  }

  // Step 3: Find videos
  const videos = findLipsyncVideos(sessionDir, args.aspect);
  if (videos.length === 0) {
    console.error(`\n❌ No lipsync_${args.aspect.replace(':', 'x')}.mp4 files found in ${sessionDir}`);
    process.exit(1);
  }
  console.log(`\n🔍 Step 3: Found ${videos.length} video(s) to analyze`);

  // Step 4: Analyze each
  console.log('\n📊 Step 4: Analyzing Videos');
  const results: AnalysisResult[] = [];
  for (const v of videos) {
    const result = await analyzeVideo(v.angleId, v.videoPath, v.configPath);
    results.push(result);
  }

  // Step 5: Print assessment
  const sorted = printAssessment(results);

  // Open best video
  const best = sorted.find((r) => r.pre_social_score != null && !r.error);
  if (best?.videoPath) {
    try { execSync(`open "${best.videoPath}"`, { stdio: 'ignore' }); } catch { /* non-fatal */ }
  }

  // Cleanup: stop server if we started it
  if (serverProc) {
    serverProc.kill();
    console.log('   🛑 Analysis server stopped');
  }
}

main().catch((err) => {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
});
