#!/usr/bin/env npx tsx
/**
 * triage-iphone-footage.ts — Batch iPhone raw footage triage CLI
 *
 * Runs all clips through 7 gates and sorts into green/yellow/blue/red bins.
 * Saves a JSON manifest and prints a summary table.
 *
 * Usage:
 *   # Triage all clips in a directory
 *   npx tsx scripts/triage-iphone-footage.ts --dir "/Volumes/My Passport/"
 *
 *   # Triage a single clip
 *   npx tsx scripts/triage-iphone-footage.ts --file "/Volumes/My Passport/2024-06-24 11-22-39.mp4"
 *
 *   # Triage and auto-send green clips to content pipeline
 *   npx tsx scripts/triage-iphone-footage.ts --dir "/Volumes/My Passport/" --auto-pipeline
 *
 *   # Skip Whisper transcription (faster, vision-only)
 *   npx tsx scripts/triage-iphone-footage.ts --dir "/path" --skip-transcribe
 *
 *   # Output manifest to specific path
 *   npx tsx scripts/triage-iphone-footage.ts --dir "/path" --output /tmp/triage.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import OpenAI from 'openai';
import {
  triageDirectory,
  triageClip,
  groupIntoSessions,
  type TriageResult,
  type TriageReport,
} from '../src/lib/RawFootageTriage';

// ─── Load env ─────────────────────────────────────────────────────────────────

function loadEnvFile(p: string) {
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
  }
}
loadEnvFile(path.resolve(__dirname, '../.env.local'));
loadEnvFile('/Users/isaiahdupree/Documents/Software/actp-worker/.env');

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag: string) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
const hasFlag = (flag: string) => args.includes(flag);

const dirPath      = getArg('--dir');
const filePath     = getArg('--file');
const outputPath   = getArg('--output');
const autoPipeline = hasFlag('--auto-pipeline');
const skipTranscribe = hasFlag('--skip-transcribe');

const OPENAI_KEY = process.env.OPENAI_API_KEY ?? '';
const STUDIO_DIR = path.resolve(__dirname, '..');

// ─── Color helpers ────────────────────────────────────────────────────────────

const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
  cyan: '\x1b[36m', blue: '\x1b[34m', magenta: '\x1b[35m',
};

const BIN_COLOR: Record<string, string> = {
  green: C.green, yellow: C.yellow, blue: C.blue, red: C.red,
};
const BIN_LABEL: Record<string, string> = {
  green: '🟢 GREEN  ', yellow: '🟡 YELLOW ', blue: '🔵 BLUE   ', red: '🔴 RED    ',
};

// ─── Table printer ────────────────────────────────────────────────────────────

function printResult(r: TriageResult) {
  const bin = BIN_COLOR[r.bin] ?? C.reset;
  const score = (r.scores.media_watchability_score * 100).toFixed(0).padStart(3);
  const intent = (r.scores.intent_to_publish_score * 100).toFixed(0).padStart(3);
  const dur = r.technical.duration_sec.toFixed(1).padStart(5);
  const name = r.file_name.slice(0, 35).padEnd(35);
  const action = r.recommended_action.replace(/_/g, '-').padEnd(22);

  console.log(
    `  ${bin}${BIN_LABEL[r.bin]}${C.reset}` +
    `${name}` +
    `  ${C.dim}w=${score}% intent=${intent}% ${dur}s${C.reset}` +
    `  → ${action}` +
    (r.gate_failures.length > 0 ? `  ${C.dim}[${r.gate_failures.join(',')}]${C.reset}` : '')
  );
  if (r.reasoning.length > 0) {
    console.log(`    ${C.dim}${r.reasoning[0]}${r.reasoning[1] ? ' · ' + r.reasoning[1] : ''}${C.reset}`);
  }
}

// ─── Auto-pipeline: send green/yellow clips to ugc-iphone-pipeline ─────────────

async function sendToPipeline(result: TriageResult) {
  console.log(`\n  ${C.cyan}→ Sending to content pipeline: ${result.file_name}${C.reset}`);
  const proc = spawnSync('npx', [
    'tsx', 'scripts/ugc-iphone-pipeline.ts',
    '--video', result.file_path,
    '--account', '670',
    '--no-post',  // verify first, remove for live posting
  ], { cwd: STUDIO_DIR, stdio: 'inherit', timeout: 300_000 });

  if (proc.status === 0) {
    console.log(`  ${C.green}✅ Pipeline complete for ${result.file_name}${C.reset}`);
  } else {
    console.log(`  ${C.red}❌ Pipeline failed for ${result.file_name}${C.reset}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!OPENAI_KEY) {
    console.error(`${C.red}❌ OPENAI_API_KEY not set${C.reset}`);
    process.exit(1);
  }
  if (!dirPath && !filePath) {
    console.error('Usage: triage-iphone-footage.ts --dir /path/to/clips  OR  --file /path/to/clip.mp4');
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey: OPENAI_KEY });

  console.log(`\n${C.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  iPhone Raw Footage Triage`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`);

  let report: TriageReport;

  if (filePath) {
    // Single file triage
    console.log(`  File: ${filePath}`);
    if (!fs.existsSync(filePath)) { console.error(`File not found: ${filePath}`); process.exit(1); }

    const sessions = groupIntoSessions([filePath]);
    const sessionId = Object.keys(sessions)[0] ?? 'session_000';
    const result = await triageClip(filePath, openai, sessionId);

    report = {
      source_dir: path.dirname(filePath),
      processed_at: new Date().toISOString(),
      total_clips: 1,
      green_count: result.bin === 'green' ? 1 : 0,
      yellow_count: result.bin === 'yellow' ? 1 : 0,
      blue_count: result.bin === 'blue' ? 1 : 0,
      red_count: result.bin === 'red' ? 1 : 0,
      session_groups: sessions,
      results: [result],
      pipeline_ready: result.bin === 'green' || result.bin === 'yellow' ? [result] : [],
    };
  } else {
    // Directory triage
    console.log(`  Dir: ${dirPath}`);
    report = await triageDirectory(dirPath!, OPENAI_KEY, {
      verbose: true,
    });
  }

  // ── Print results ────────────────────────────────────────────────────────

  console.log(`\n${C.bold}  Results — ${report.total_clips} clips${C.reset}\n`);

  // Print by session
  for (const [sessionId, sessionFiles] of Object.entries(report.session_groups)) {
    const sessionResults = report.results.filter(r => r.session_group === sessionId);
    if (sessionResults.length === 0) continue;
    console.log(`  ${C.cyan}${sessionId}${C.reset}  (${sessionResults.length} clips)`);
    for (const r of sessionResults) printResult(r);
    console.log();
  }

  // ── Summary ──────────────────────────────────────────────────────────────

  console.log(`${C.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`);
  console.log(`  ${C.green}🟢 GREEN  ${report.green_count}${C.reset}  ready for content pipeline`);
  console.log(`  ${C.yellow}🟡 YELLOW ${report.yellow_count}${C.reset}  salvageable — trim/group`);
  console.log(`  ${C.blue}🔵 BLUE   ${report.blue_count}${C.reset}  archive as B-roll only`);
  console.log(`  ${C.red}🔴 RED    ${report.red_count}${C.reset}  trash / accidental`);
  console.log(`  ${C.bold}Pipeline-ready: ${report.pipeline_ready.length}/${report.total_clips}${C.reset}\n`);

  if (report.pipeline_ready.length > 0) {
    console.log(`  ${C.bold}Top pipeline-ready clips:${C.reset}`);
    for (const r of report.pipeline_ready.slice(0, 5)) {
      console.log(`    ${BIN_COLOR[r.bin]}${r.file_name}${C.reset}  score=${(r.scores.media_watchability_score*100).toFixed(0)}%  action=${r.recommended_action}`);
      if (r.transcript) console.log(`    ${C.dim}"${r.transcript.slice(0, 80)}..."${C.reset}`);
    }
    console.log();
  }

  // ── Save manifest ─────────────────────────────────────────────────────────

  const manifestPath = outputPath ??
    path.join(STUDIO_DIR, 'output', `triage-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(report, null, 2));
  console.log(`  ${C.dim}Manifest saved: ${manifestPath}${C.reset}\n`);

  // ── Auto-pipeline ─────────────────────────────────────────────────────────

  if (autoPipeline && report.pipeline_ready.length > 0) {
    console.log(`${C.bold}  Auto-pipeline: sending ${report.pipeline_ready.length} clip(s) to content pipeline...${C.reset}`);
    for (const r of report.pipeline_ready) {
      await sendToPipeline(r);
    }
  } else if (report.pipeline_ready.length > 0) {
    console.log(`  To send to content pipeline, run:`);
    for (const r of report.pipeline_ready.slice(0, 3)) {
      console.log(`  ${C.dim}npx tsx scripts/ugc-iphone-pipeline.ts --video "${r.file_path}"${C.reset}`);
    }
  }

  console.log();
  process.exit(report.pipeline_ready.length > 0 ? 0 : 2); // exit 2 = no usable clips
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
