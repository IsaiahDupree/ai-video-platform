#!/usr/bin/env npx tsx
// Retention-agent CLI — end-to-end run: topic + target duration -> retention-tagged
// script (real measured audio) -> visual/B-roll edit plan -> Remotion ContentBrief ->
// render -> QC gates. See acd/data/prds/youtube-retention-video-agent.md for the spec.
//
// Usage:
//   npx tsx retention-agent/run.ts --topic "..." --duration 120 --tolerance 6 \
//     --style isaiah_high_retention_explainer --audience "technical entrepreneurs" \
//     --out retention-agent/data/runs/<id> [--skip-render] [--skip-script-gate]
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { loadStyleSkill } from './src/style-skill.ts';
import { runScriptEngine } from './src/script-engine.ts';
import { runScriptQualityGate } from './src/qc/script-quality-gate.ts';
import { buildEditPlan } from './src/visual-plan.ts';
import { assembleContentBrief } from './src/assemble-brief.ts';
import { concatAudio } from './src/audio-concat.ts';
import { runTechnicalQualityGate } from './src/qc/technical-quality-gate.ts';
import { measureDurationSeconds } from './src/duration.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadDotenvLocal(): void {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        out[key] = next;
        i++;
      } else {
        out[key] = true;
      }
    }
  }
  return out;
}

async function main() {
  loadDotenvLocal();
  const args = parseArgs(process.argv.slice(2));

  const topic = String(args.topic || '');
  if (!topic) {
    console.error('Usage: --topic "..." --duration <seconds> [--tolerance <seconds>] [--style <id>]');
    process.exit(1);
  }
  const targetDuration = Number(args.duration || 120);
  const tolerance = Number(args.tolerance || Math.max(5, targetDuration * 0.05));
  const styleId = String(args.style || 'isaiah_high_retention_explainer');
  const audience = String(args.audience || 'technical entrepreneurs building AI automation systems');
  const runId = String(args.out || `retention-agent/data/runs/run_${Date.now()}`);
  const workDir = path.isAbsolute(runId) ? runId : path.join(__dirname, '..', runId);
  const skipRender = !!args['skip-render'];
  const skipScriptGate = !!args['skip-script-gate'];

  fs.mkdirSync(workDir, { recursive: true });

  console.log('='.repeat(70));
  console.log('RETENTION VIDEO AGENT — end-to-end run');
  console.log('='.repeat(70));
  console.log(`Topic:            ${topic}`);
  console.log(`Target duration:  ${targetDuration}s ± ${tolerance}s`);
  console.log(`Style skill:      ${styleId}`);
  console.log(`Work dir:         ${workDir}`);
  console.log('');

  const styleSkill = loadStyleSkill(styleId);

  // ── Stage 1: duration-constrained, retention-tagged script engine ───────────
  console.log('[1/5] Running duration-constrained script engine (real TTS + ffprobe loop)...');
  const t0 = Date.now();
  const script = await runScriptEngine({
    topic,
    audience,
    targetDurationSeconds: targetDuration,
    toleranceSeconds: tolerance,
    styleSkill,
    workDir: path.join(workDir, 'audio'),
  });
  console.log(`      done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log(`      target=${targetDuration}s actual=${script.total_actual_seconds?.toFixed(2)}s converged=${script.converged}`);
  for (const s of script.sections) {
    console.log(`        - ${s.scene_id.padEnd(14)} target=${s.target_seconds.toFixed(1)}s actual=${s.actual_seconds?.toFixed(2)}s attempts=${s.attempts}`);
  }

  // ── Stage 2: script-quality QC gate ──────────────────────────────────────────
  console.log('\n[2/5] Running script-quality QC gate...');
  const scriptGate = runScriptQualityGate(script);
  fs.writeFileSync(path.join(workDir, 'qc-script-quality.json'), JSON.stringify(scriptGate, null, 2));
  console.log(`      pass=${scriptGate.pass} findings=${scriptGate.findings.length}`);
  for (const f of scriptGate.findings) console.log(`        [${f.severity}] ${f.rule}${f.section_id ? ` (${f.section_id})` : ''}: ${f.detail}`);
  if (!scriptGate.pass && !skipScriptGate) {
    console.error('\n❌ Script-quality gate FAILED — stopping before render (use --skip-script-gate to override).');
    process.exit(1);
  }

  // ── Stage 3: visual-change / B-roll edit plan ────────────────────────────────
  console.log('\n[3/5] Building visual-change edit plan...');
  const editPlan = buildEditPlan(script.sections, styleSkill);
  editPlan.topic = topic;
  fs.writeFileSync(path.join(workDir, 'edit-plan.json'), JSON.stringify(editPlan, null, 2));
  console.log(`      events=${editPlan.events.length} pattern_interrupts=${editPlan.pattern_interrupt_count} max_unchanged_observed=${editPlan.max_unchanged_seconds_observed.toFixed(2)}s (cap=${styleSkill.pacing.maximum_unchanged_talking_head_seconds}s)`);

  // ── Stage 4: assemble ContentBrief + concatenate narration ──────────────────
  console.log('\n[4/5] Assembling ContentBrief + concatenating narration audio...');
  const briefId = `retention_${Date.now()}`;
  // The concatenated voiceover MUST live under Remotion/public/ and be referenced by a
  // path relative to it (no leading slash) so BriefComposition.tsx resolves it via
  // Remotion's staticFile() — @remotion/renderer's server-side asset downloader only
  // accepts http(s) URLs, so an absolute file:// path (fine in the Studio preview) fails
  // renderMedia with "Can only download URLs starting with http:// or https://".
  const voiceoverPublicRelPath = path.join('retention-agent-runs', briefId, 'voiceover.wav');
  const voiceoverPath = path.join(__dirname, '..', 'public', voiceoverPublicRelPath);
  concatAudio(script.sections.map((s) => s.audio_path!), voiceoverPath);
  const measuredVoiceoverSec = fs.existsSync(voiceoverPath) ? measureDurationSeconds(voiceoverPath) : 0;
  console.log(`      voiceover.wav duration (measured) = ${measuredVoiceoverSec.toFixed(2)}s`);
  console.log(`      public/${voiceoverPublicRelPath}`);

  const brief = assembleContentBrief({ script, editPlan, styleSkill, voiceoverPublicRelPath, id: briefId });
  const briefPath = path.join(workDir, 'brief.json');
  fs.writeFileSync(briefPath, JSON.stringify(brief, null, 2));
  console.log(`      brief.json written: ${brief.sections.length} sections, settings.duration_sec=${brief.settings.duration_sec.toFixed(2)}s`);

  if (skipRender) {
    console.log('\n[5/5] Skipping render (--skip-render). Done.');
    return;
  }

  // ── Stage 5: render via the EXISTING Remotion render pipeline + technical QC ─
  console.log('\n[5/5] Rendering via scripts/render.ts (production Remotion pipeline)...');
  const outputPath = path.join(workDir, `${briefId}.mp4`);
  const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browserExecutable =
    process.env.REMOTION_BROWSER_EXECUTABLE || (fs.existsSync(macChrome) ? macChrome : undefined);
  const renderResult = spawnSync(
    'npx',
    ['tsx', 'scripts/render.ts', briefPath, outputPath, '--quality', String(args.quality || 'preview')],
    {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...(browserExecutable ? { REMOTION_BROWSER_EXECUTABLE: browserExecutable } : {}) },
    }
  );
  fs.writeFileSync(path.join(workDir, 'render.log'), (renderResult.stdout || '') + '\n' + (renderResult.stderr || ''));
  if (renderResult.status !== 0 || !fs.existsSync(outputPath)) {
    console.error(`\n❌ Render failed (exit ${renderResult.status}). See ${path.join(workDir, 'render.log')}`);
    console.error((renderResult.stderr || '').slice(-2000));
    process.exit(1);
  }
  const stat = fs.statSync(outputPath);
  console.log(`      rendered: ${outputPath} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);

  console.log('\n      Running technical-quality QC gate on the rendered file...');
  const techGate = runTechnicalQualityGate(outputPath, brief.settings.duration_sec);
  fs.writeFileSync(path.join(workDir, 'qc-technical-quality.json'), JSON.stringify(techGate, null, 2));
  console.log(`      pass=${techGate.pass} findings=${techGate.findings.length}`);
  for (const f of techGate.findings) console.log(`        [${f.severity}] ${f.rule}: ${f.detail}`);

  console.log('\n' + '='.repeat(70));
  console.log('RUN SUMMARY');
  console.log('='.repeat(70));
  console.log(`Script converged:        ${script.converged} (target ${targetDuration}s ± ${tolerance}s, actual ${script.total_actual_seconds?.toFixed(2)}s)`);
  console.log(`Script-quality gate:     ${scriptGate.pass ? 'PASS' : 'FAIL'}`);
  console.log(`Rendered file:           ${outputPath}`);
  const finalDuration = measureDurationSeconds(outputPath);
  console.log(`Rendered duration (measured, ffprobe): ${finalDuration.toFixed(2)}s`);
  console.log(`Technical-quality gate:  ${techGate.pass ? 'PASS' : 'FAIL'}`);
  console.log('='.repeat(70));
}

main().catch((err) => {
  console.error('\n❌ retention-agent run failed:', err);
  process.exit(1);
});
