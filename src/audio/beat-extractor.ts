import type { Beat, BeatAction } from './audio-types';

// =============================================================================
// Beat Extractor - Script → Beats with Frames
// =============================================================================

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

function detectAction(t: string): BeatAction {
  const s = t.toLowerCase();

  if (/(subscribe|follow|download|join|link in bio|waitlist|comment)/.test(s)) return 'cta';
  if (/(but here's the thing|plot twist|you won't believe|here's why|the truth|most people)/.test(s)) return 'hook';
  if (/(so next|now let's|moving on|meanwhile|then|next up|switch to)/.test(s)) return 'transition';
  if (/(boom|gotcha|and that's it|that's the trick|mic drop)/.test(s)) return 'punchline';
  if (/(here's how|step|first|second|third|do this|use this)/.test(s)) return 'explain';
  if (/(error|failed|broke|crashed|bug)/.test(s)) return 'error';
  if (/(success|works|fixed|solved|done)/.test(s)) return 'success';
  return 'reveal';
}

export interface ExtractBeatsOptions {
  script: string;
  fps: number;
  wpm?: number;          // Words per minute, default 165
  startFrame?: number;   // Starting frame, default 0
  minBeatWords?: number; // Minimum words per beat, default 6
}

export interface ExtractBeatsResult {
  beats: Beat[];
  estimatedTotalFrames: number;
}

export function extractBeatsFromScript(opts: ExtractBeatsOptions): ExtractBeatsResult {
  const fps = opts.fps;
  const wpm = opts.wpm ?? 165;
  const startFrame = opts.startFrame ?? 0;
  const minBeatWords = opts.minBeatWords ?? 6;

  const wordsPerSecond = wpm / 60;
  const framesPerWord = fps / wordsPerSecond;

  const rawLines = opts.script
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  // If you have explicit labeled lines, keep them. Else chunk by punctuation.
  const chunks: string[] = [];
  for (const line of rawLines) {
    const hasLabel = /^[A-Za-z ]{2,12}:\s+/.test(line);
    if (hasLabel) {
      chunks.push(line.replace(/^[A-Za-z ]{2,12}:\s+/, '').trim());
      continue;
    }
    // Split long lines into sentence-ish beats
    const parts = line.split(/(?<=[.!?])\s+/);
    for (const p of parts) if (p.trim()) chunks.push(p.trim());
  }

  // Merge tiny chunks so we don't create micro-beats
  const merged: string[] = [];
  let buf: string[] = [];
  let bufWords = 0;

  const countWords = (t: string) => t.split(/\s+/).filter(Boolean).length;

  for (const c of chunks) {
    const w = countWords(c);
    if (bufWords < minBeatWords) {
      buf.push(c);
      bufWords += w;
      continue;
    }
    merged.push(buf.join(' ').trim());
    buf = [c];
    bufWords = w;
  }
  if (buf.length) merged.push(buf.join(' ').trim());

  // Assign frames based on word count
  const beats: Beat[] = [];
  let frameCursor = startFrame;

  for (let i = 0; i < merged.length; i++) {
    const text = merged[i];
    const wc = countWords(text);
    const durFrames = Math.max(1, Math.round(wc * framesPerWord));

    const action = detectAction(text);
    const beatId = `${i + 1}_${slug(text)}`;

    beats.push({ beatId, frame: frameCursor, text, action });
    frameCursor += durFrames;
  }

  return { beats, estimatedTotalFrames: frameCursor };
}

// =============================================================================
// Timing Estimation
// =============================================================================

const PAUSE_ACTIONS: Partial<Record<BeatAction, number>> = {
  hook: 0.3,
  reveal: 0.4,
  punchline: 0.5,
  cta: 0.3,
  transition: 0.2,
  error: 0.3,
  success: 0.3,
};

export function estimateSeconds(text: string, action?: BeatAction, wpm = 165): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  const baseSec = words / (wpm / 60);
  const pause = action ? (PAUSE_ACTIONS[action] ?? 0.15) : 0.15;
  return baseSec + pause;
}

export function estimateTotalDuration(beats: Beat[], wpm = 165): number {
  return beats.reduce((sum, b) => sum + estimateSeconds(b.text, b.action, wpm), 0);
}

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  const fs = require('fs');
  const path = require('path');
  
  const scriptPath = process.argv[2] || 'data/script.txt';
  const fps = Number(process.argv[3]) || 30;
  
  if (!fs.existsSync(scriptPath)) {
    console.error(`Usage: npx tsx src/audio/beat-extractor.ts <script.txt> [fps]`);
    process.exit(1);
  }
  
  const script = fs.readFileSync(scriptPath, 'utf-8');
  const { beats, estimatedTotalFrames } = extractBeatsFromScript({ script, fps });
  
  console.log(JSON.stringify(beats, null, 2));
  console.log(`\n// Total: ${beats.length} beats, ~${estimatedTotalFrames} frames @ ${fps}fps`);
}
