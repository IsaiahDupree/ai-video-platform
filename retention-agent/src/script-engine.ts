// Duration-Constrained Script Engine (PRD Phase 1, item 1).
//
// Loop (research doc):
//   Generate script → synthesize narration → measure actual narration length →
//   compare against target → expand or compress selected sections →
//   regenerate only changed narration segments → repeat until inside tolerance.
//
// Every measurement below comes from a real ffprobe read of a real ElevenLabs-synthesized
// audio file — never from a word-count formula (the word-count formula is used ONLY to
// pick the very first-draft target word count, per the research doc's explicit
// instruction). Convergence uses a two-point linear fit of (words, measured seconds)
// per section rather than a naive proportional wpm ratio, because real TTS output has a
// roughly fixed per-clip overhead (lead/trail padding, punctuation pauses) that a
// through-the-origin proportional model systematically gets wrong on short sections —
// fitting a line through two REAL measurements captures that overhead honestly.
import * as fs from 'fs';
import * as path from 'path';
import type { StyleSkill, RetentionSection, ScriptDraft, IterationLogEntry } from './types.ts';
import { draftSection, reviseSection, summarizeForContext } from './llm.ts';
import { synthesizeSpeech } from './tts.ts';
import { measureDurationSeconds } from './duration.ts';

const PER_SECTION_ATTEMPTS = 4;
const GLOBAL_PASSES = 4;
const MIN_WORDS = 3;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function perSectionToleranceSeconds(targetSeconds: number): number {
  // Tight enough to force real convergence work, loose enough that TTS pacing jitter
  // (ElevenLabs doesn't emit exactly N wpm) doesn't loop forever.
  return Math.max(1.0, targetSeconds * 0.07);
}

/** History of real (words, measured-seconds) observations for one section, used to fit
 * duration ≈ intercept + slope*words instead of assuming duration ∝ words. */
type WordSecHistory = Array<{ words: number; seconds: number }>;

function estimateWordsForTarget(
  history: WordSecHistory,
  targetSeconds: number,
  fallbackWpm: number
): number {
  // Use the two most recent observations WITH DIFFERENT word counts to fit a line.
  const points = history.slice(-4);
  const uniqueWordCounts = new Set(points.map((p) => p.words));

  if (points.length >= 2 && uniqueWordCounts.size >= 2) {
    const p1 = points[points.length - 2];
    const p2 = points[points.length - 1];
    if (p2.words !== p1.words) {
      const slope = (p2.seconds - p1.seconds) / (p2.words - p1.words); // seconds per word
      if (slope > 0.02) {
        const intercept = p1.seconds - slope * p1.words;
        const words = Math.round((targetSeconds - intercept) / slope);
        if (Number.isFinite(words)) return Math.max(MIN_WORDS, words);
      }
    }
  }

  if (points.length >= 1) {
    // Single data point: assume a small fixed per-clip overhead (measured empirically
    // from ElevenLabs short-clip behavior) rather than a pure through-the-origin ratio.
    const p = points[points.length - 1];
    const OVERHEAD_SEC = 0.35;
    const speakingSeconds = Math.max(0.15, p.seconds - OVERHEAD_SEC);
    const secPerWord = speakingSeconds / Math.max(1, p.words);
    const words = Math.round((Math.max(0.15, targetSeconds - OVERHEAD_SEC)) / secPerWord);
    return Math.max(MIN_WORDS, words);
  }

  return Math.max(MIN_WORDS, Math.round((targetSeconds / 60) * fallbackWpm));
}

export interface RunScriptEngineOptions {
  topic: string;
  audience: string;
  targetDurationSeconds: number;
  toleranceSeconds: number;
  styleSkill: StyleSkill;
  workDir: string; // where section-NN.mp3 files + script.json get written
}

export async function runScriptEngine(opts: RunScriptEngineOptions): Promise<ScriptDraft> {
  const { topic, audience, targetDurationSeconds, toleranceSeconds, styleSkill, workDir } = opts;
  fs.mkdirSync(workDir, { recursive: true });

  const iterationsLog: IterationLogEntry[] = [];
  const attemptsPerSection: number[] = [];
  const historyPerSection: WordSecHistory[] = [];
  let passCounter = 0;

  // 1. First-draft per-section time budgets from style skill percentages.
  const sections: RetentionSection[] = [];
  for (const shape of styleSkill.section_shape) {
    const targetSeconds = (shape.percent / 100) * targetDurationSeconds;
    const targetWords = Math.max(
      MIN_WORDS,
      Math.round((targetSeconds / 60) * styleSkill.voice.speech_rate_wpm)
    );
    const isFirst = shape === styleSkill.section_shape[0];
    const isLast = shape === styleSkill.section_shape[styleSkill.section_shape.length - 1];

    const drafted = await draftSection({
      topic,
      audience,
      shape,
      targetWords,
      priorSummary: summarizeForContext(sections),
      isFirst,
      isLast,
    });
    drafted.target_seconds = targetSeconds;
    sections.push(drafted);
    attemptsPerSection.push(1);
    historyPerSection.push([]);
    iterationsLog.push({
      pass: passCounter,
      section_id: shape.id,
      action: 'draft',
      target_seconds: targetSeconds,
      word_count: wordCount(drafted.spoken_text),
    });
  }

  // 2. Synthesize + measure + per-section compress/expand loop (two-point linear fit).
  for (let i = 0; i < sections.length; i++) {
    await synthesizeAndMeasure(sections[i], i, workDir, styleSkill);
    historyPerSection[i].push({
      words: wordCount(sections[i].spoken_text),
      seconds: sections[i].actual_seconds!,
    });

    while (
      attemptsPerSection[i] < PER_SECTION_ATTEMPTS &&
      Math.abs(sections[i].actual_seconds! - sections[i].target_seconds) >
        perSectionToleranceSeconds(sections[i].target_seconds)
    ) {
      const shape = styleSkill.section_shape[i];
      const newTargetWords = estimateWordsForTarget(
        historyPerSection[i],
        sections[i].target_seconds,
        styleSkill.voice.speech_rate_wpm
      );
      const revised = await reviseSection({
        topic,
        audience,
        shape,
        targetWords: 0,
        priorSummary: summarizeForContext(sections.slice(0, i)),
        isFirst: i === 0,
        isLast: i === sections.length - 1,
        previousText: sections[i].spoken_text,
        previousActualSeconds: sections[i].actual_seconds!,
        targetSeconds: sections[i].target_seconds,
        newTargetWords,
      });
      revised.target_seconds = sections[i].target_seconds;
      sections[i] = revised;
      await synthesizeAndMeasure(sections[i], i, workDir, styleSkill);
      historyPerSection[i].push({
        words: wordCount(sections[i].spoken_text),
        seconds: sections[i].actual_seconds!,
      });
      attemptsPerSection[i]++;
      iterationsLog.push({
        pass: passCounter,
        section_id: shape.id,
        action:
          sections[i].actual_seconds! > sections[i].target_seconds ? 'compress' : 'expand',
        target_seconds: sections[i].target_seconds,
        actual_seconds: sections[i].actual_seconds,
        word_count: wordCount(sections[i].spoken_text),
      });
    }
  }

  // 3. Global convergence: if the SUM is still outside tolerance, redistribute the
  // remaining delta across flexible sections (weighted by their current target) and
  // re-revise just those sections, still using each section's own real history.
  // Repeat up to GLOBAL_PASSES.
  let totalActual = sum(sections.map((s) => s.actual_seconds!));
  passCounter++;

  for (let pass = 0; pass < GLOBAL_PASSES; pass++) {
    const delta = targetDurationSeconds - totalActual; // positive => need MORE seconds
    if (Math.abs(delta) <= toleranceSeconds) break;

    const flexibleIdx = sections.map((s, idx) => (s.flexible ? idx : -1)).filter((i) => i >= 0);
    if (flexibleIdx.length === 0) break;
    const flexTotal = sum(flexibleIdx.map((idx) => sections[idx].target_seconds));

    for (const idx of flexibleIdx) {
      const s = sections[idx];
      const share = (s.target_seconds / flexTotal) * delta;
      s.target_seconds = Math.max(3, s.target_seconds + share);

      const shape = styleSkill.section_shape[idx];
      const newTargetWords = estimateWordsForTarget(
        historyPerSection[idx],
        s.target_seconds,
        styleSkill.voice.speech_rate_wpm
      );
      const revised = await reviseSection({
        topic,
        audience,
        shape,
        targetWords: 0,
        priorSummary: summarizeForContext(sections.slice(0, idx)),
        isFirst: idx === 0,
        isLast: idx === sections.length - 1,
        previousText: s.spoken_text,
        previousActualSeconds: s.actual_seconds!,
        targetSeconds: s.target_seconds,
        newTargetWords,
      });
      revised.target_seconds = s.target_seconds;
      revised.flexible = s.flexible;
      sections[idx] = revised;
      await synthesizeAndMeasure(sections[idx], idx, workDir, styleSkill);
      historyPerSection[idx].push({
        words: wordCount(sections[idx].spoken_text),
        seconds: sections[idx].actual_seconds!,
      });
      attemptsPerSection[idx]++;
      iterationsLog.push({
        pass: passCounter,
        section_id: shape.id,
        action: share > 0 ? 'expand' : 'compress',
        target_seconds: sections[idx].target_seconds,
        actual_seconds: sections[idx].actual_seconds,
        word_count: wordCount(sections[idx].spoken_text),
      });
    }

    totalActual = sum(sections.map((s) => s.actual_seconds!));
    passCounter++;
  }

  sections.forEach((s, i) => {
    s.attempts = attemptsPerSection[i];
  });

  const converged = Math.abs(targetDurationSeconds - totalActual) <= toleranceSeconds;

  const draft: ScriptDraft = {
    topic,
    target_duration_seconds: targetDurationSeconds,
    tolerance_seconds: toleranceSeconds,
    style_skill_id: styleSkill.id,
    sections,
    created_at: new Date().toISOString(),
    converged,
    total_actual_seconds: totalActual,
    iterations_log: iterationsLog,
  };

  fs.writeFileSync(path.join(workDir, 'script.json'), JSON.stringify(draft, null, 2));
  return draft;
}

async function synthesizeAndMeasure(
  section: RetentionSection,
  index: number,
  workDir: string,
  styleSkill: StyleSkill
): Promise<void> {
  const outPath = path.join(workDir, `section-${String(index).padStart(2, '0')}-${section.scene_id}.mp3`);
  await synthesizeSpeech({ text: section.spoken_text, voice: styleSkill.voice, outputPath: outPath });
  section.audio_path = outPath;
  section.actual_seconds = measureDurationSeconds(outPath);
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}
