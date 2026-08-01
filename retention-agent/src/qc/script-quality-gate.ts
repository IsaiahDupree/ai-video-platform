// Script-quality QC gate (research doc gate 1 / PRD Phase 1 gate (a)).
// Fully deterministic — no LLM judgment call, so it is reliably testable against a
// deliberately-broken input and never flaky.
//
// Checks:
//   1. Opening promise — the hook section states a concrete value promise, not filler.
//   2. No generic AI language — banned-phrase list, case-insensitive substring match.
//   3. Claims supported — sections containing a superlative/quantified claim must be
//      near a support marker (example/data/because/proof word) somewhere in the section.
//   4. Sections advance the argument — no two sections are near-duplicates of each other
//      (n-gram Jaccard similarity above threshold => flag).
//   5. Retention-tag completeness — every section must carry non-empty purpose /
//      visual_promise / retention_device and a valid energy in [0,1].
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { QCFinding, QCGateResult, RetentionSection, ScriptDraft } from '../types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BANNED_PHRASES: string[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'config', 'banned-phrases.json'), 'utf8')
).phrases;

const SUPPORT_MARKERS = [
  'because', 'for example', 'for instance', 'in a test', 'we tested', 'we measured',
  'data show', 'the data', 'result', 'results', 'in practice', 'proof', 'here is what happened',
  'when we ran', 'benchmark', 'case study', 'real', 'actual', 'measured',
];

const SUPERLATIVE_CLAIM = /\b(best|most|fastest|easiest|only way|proven|guaranteed|always|never fails|100%|number one|#1)\b/i;

const DUPLICATE_JACCARD_THRESHOLD = 0.55;

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function trigrams(words: string[]): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i + 2 < words.length; i++) {
    set.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  return set;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const x of a) if (b.has(x)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function runScriptQualityGate(script: ScriptDraft): QCGateResult {
  const findings: QCFinding[] = [];
  const sections = script.sections;

  // 1. Opening promise.
  const hook = sections[0];
  if (hook) {
    // Normalize typographic quotes (LLM output commonly uses U+2019 curly apostrophe,
    // e.g. "you'll") to plain ASCII so the apostrophe-sensitive patterns below match
    // regardless of which one the model happened to emit.
    const hookText = hook.spoken_text.toLowerCase().replace(/[‘’ʼ]/g, "'");
    const promiseSignals = [
      /\b(you|i|we)('| wi)ll\b/i, /\bhow to\b/i, /\bhere('| i)s\b/i, /\bwhy\b/i, /\?/, /\d/,
      /\bin the next\b/i, /\blet me show\b/i, /\bshow you\b/i, /\bgoing to show\b/i, /\babout to\b/i,
    ];
    const hasPromise = promiseSignals.some((re) => re.test(hookText));
    const wordCount = hookText.trim().split(/\s+/).filter(Boolean).length;
    if (!hasPromise) {
      findings.push({
        severity: 'block',
        rule: 'opening_promise',
        section_id: hook.scene_id,
        detail: `Hook section does not state a concrete value promise (no "you'll", "how to", "why", a question, or a number): "${hook.spoken_text.slice(0, 120)}"`,
      });
    }
    if (wordCount < 6) {
      findings.push({
        severity: 'block',
        rule: 'opening_promise',
        section_id: hook.scene_id,
        detail: `Hook section is too short (${wordCount} words) to carry a real promise.`,
      });
    }
  } else {
    findings.push({ severity: 'block', rule: 'opening_promise', detail: 'Script has no sections at all.' });
  }

  // 2. Banned generic-AI phrases.
  for (const section of sections) {
    const lower = section.spoken_text.toLowerCase();
    for (const phrase of BANNED_PHRASES) {
      if (lower.includes(phrase.toLowerCase())) {
        findings.push({
          severity: 'block',
          rule: 'generic_ai_language',
          section_id: section.scene_id,
          detail: `Section contains banned generic-AI phrase: "${phrase}"`,
        });
      }
    }
  }

  // 3. Claims supported.
  for (const section of sections) {
    if (SUPERLATIVE_CLAIM.test(section.spoken_text)) {
      const lower = section.spoken_text.toLowerCase();
      const supported = SUPPORT_MARKERS.some((m) => lower.includes(m));
      if (!supported) {
        findings.push({
          severity: 'warn',
          rule: 'claims_supported',
          section_id: section.scene_id,
          detail: `Section makes a superlative/absolute claim with no nearby support marker (example/data/measured/etc): "${section.spoken_text.slice(0, 120)}"`,
        });
      }
    }
  }

  // 4. Sections advance the argument / no near-duplicates.
  const grams = sections.map((s) => trigrams(normalizeWords(s.spoken_text)));
  for (let i = 0; i < sections.length; i++) {
    for (let j = i + 1; j < sections.length; j++) {
      const sim = jaccard(grams[i], grams[j]);
      if (sim >= DUPLICATE_JACCARD_THRESHOLD) {
        findings.push({
          severity: 'block',
          rule: 'section_advances_argument',
          section_id: sections[j].scene_id,
          detail: `Section "${sections[j].scene_id}" is a near-duplicate of "${sections[i].scene_id}" (trigram Jaccard similarity ${sim.toFixed(2)} >= ${DUPLICATE_JACCARD_THRESHOLD}) — does not advance the argument.`,
        });
      }
    }
  }

  // 5. Retention-tag completeness.
  for (const section of sections) {
    const missing: string[] = [];
    if (!section.purpose || !section.purpose.trim()) missing.push('purpose');
    if (!section.visual_promise || !section.visual_promise.trim()) missing.push('visual_promise');
    if (!section.retention_device || !section.retention_device.trim()) missing.push('retention_device');
    if (typeof section.energy !== 'number' || section.energy < 0 || section.energy > 1) missing.push('energy');
    if (missing.length > 0) {
      findings.push({
        severity: 'block',
        rule: 'retention_tag_completeness',
        section_id: section.scene_id,
        detail: `Missing/invalid retention metadata: ${missing.join(', ')} — this section is a transcript line, not a retention-tagged script section.`,
      });
    }
  }

  const pass = findings.every((f) => f.severity !== 'block');

  return {
    gate: 'script_quality',
    pass,
    findings,
    checked_at: new Date().toISOString(),
  };
}
