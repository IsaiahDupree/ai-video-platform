#!/usr/bin/env npx tsx
/**
 * Process Visual Reveals
 *
 * Records visual element timing from Remotion renders and validates reveal pacing.
 * Used in the two-pass rendering pipeline:
 * 1. Pass 1: Render with seed reveals → Capture real reveals
 * 2. Pass 2: Rebuild audio with real timing → Final render
 *
 * Usage:
 *   npx tsx scripts/process-reveals.ts --input seed-reveals.json --validate
 *   npx tsx scripts/process-reveals.ts --generate beats.json --wpm 150 --output reveals.json
 */

import * as fs from 'fs';
import * as path from 'path';

interface VisualReveal {
  t: number;
  kind: string;
  key?: string;
  beatId?: string;
}

interface VisualReveals {
  version: string;
  fps: number;
  reveals: VisualReveal[];
}

interface Beat {
  beatId: string;
  frame: number;
  text: string;
  action?: string;
}

interface RevealReport {
  version: string;
  totalReveals: number;
  durationSec: number;
  byKind: Record<string, number>;
  minGapSec: number;
  avgGapSec: number;
  maxGapSec: number;
  warnings: Array<{
    type: string;
    message: string;
    count?: number;
  }>;
}

// =============================================================================
// Reveal Processing Functions
// =============================================================================

function calculateGaps(reveals: VisualReveal[]): Array<{ gap: number }> {
  const gaps: Array<{ gap: number }> = [];

  for (let i = 0; i < reveals.length - 1; i++) {
    const gap = reveals[i + 1].t - reveals[i].t;
    gaps.push({ gap });
  }

  return gaps;
}

function calculateGapStats(gaps: Array<{ gap: number }>): { min: number; avg: number; max: number } {
  if (gaps.length === 0) {
    return { min: 0, avg: 0, max: 0 };
  }

  const gapValues = gaps.map(g => g.gap);
  const min = Math.min(...gapValues);
  const max = Math.max(...gapValues);
  const avg = gapValues.reduce((a, b) => a + b, 0) / gapValues.length;

  return { min, avg, max };
}

function findDenseClusters(reveals: VisualReveal[]): Array<{ start: number; count: number }> {
  const clusters: Array<{ start: number; count: number }> = [];
  const window = 2.0;
  const threshold = 4;

  for (let i = 0; i < reveals.length; i++) {
    const start = reveals[i].t;
    const end = start + window;
    const clustered = reveals.filter(r => r.t >= start && r.t < end);

    if (clustered.length > threshold) {
      clusters.push({ start, count: clustered.length });
    }
  }

  return clusters;
}

function groupByKind(reveals: VisualReveal[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const reveal of reveals) {
    counts[reveal.kind] = (counts[reveal.kind] || 0) + 1;
  }

  return counts;
}

function validateReveals(revealsFile: VisualReveals): RevealReport {
  const reveals = revealsFile.reveals.sort((a, b) => a.t - b.t);
  const gaps = calculateGaps(reveals);
  const gapStats = calculateGapStats(gaps);
  const clusters = findDenseClusters(reveals);
  const byKind = groupByKind(reveals);

  const warnings: RevealReport['warnings'] = [];

  // Check tight gaps
  const tightGaps = gaps.filter(g => g.gap < 0.35).length;
  if (tightGaps > 5) {
    warnings.push({
      type: 'tight-gap',
      message: `${tightGaps} reveals with gaps < 0.35s (consider spacing)`,
      count: tightGaps,
    });
  }

  // Check dense clusters
  if (clusters.length > 0) {
    warnings.push({
      type: 'dense-cluster',
      message: `${clusters.length} dense clusters detected (>4 reveals in 2s)`,
      count: clusters.length,
    });
  }

  // Check for critical kinds
  if (!byKind['keyword']) {
    warnings.push({
      type: 'missing-kind',
      message: 'No keyword reveals - consider adding hooks',
    });
  }

  return {
    version: '1.0.0',
    totalReveals: reveals.length,
    durationSec: reveals.length > 0 ? reveals[reveals.length - 1].t : 0,
    byKind,
    minGapSec: gapStats.min,
    avgGapSec: gapStats.avg,
    maxGapSec: gapStats.max,
    warnings,
  };
}

function generateSeedReveals(beats: Beat[], wpm: number = 150): VisualReveals {
  const reveals: VisualReveal[] = [];
  const fps = 30;

  const kindMap: Record<string, string> = {
    hook: 'keyword',
    problem: 'bullet',
    explain: 'bullet',
    code: 'code',
    error: 'error',
    success: 'success',
    cta: 'cta',
    transition: 'keyword',
    reveal: 'keyword',
    punchline: 'keyword',
    outro: 'keyword',
  };

  for (const beat of beats) {
    const t = beat.frame / fps;
    const action = beat.action || 'reveal';
    const kind = kindMap[action] || 'keyword';

    reveals.push({
      t,
      kind,
      key: beat.beatId,
      beatId: beat.beatId,
    });
  }

  return {
    version: '1.0.0',
    fps,
    reveals: reveals.sort((a, b) => a.t - b.t),
  };
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Visual Reveals Processor

Usage:
  npx tsx scripts/process-reveals.ts --input reveals.json --validate
  npx tsx scripts/process-reveals.ts --generate beats.json --wpm 150 --output reveals.json

Options:
  --input FILE       Load and process reveals from JSON file
  --validate         Generate validation report
  --generate FILE    Generate seed reveals from beats JSON
  --wpm N            Words per minute for seed generation (default: 150)
  --output FILE      Write output to file (default: stdout)
`);
    return;
  }

  // Validate mode
  if (args.includes('--validate')) {
    const inputIdx = args.indexOf('--input');
    if (inputIdx === -1) {
      console.error('Error: --input is required for --validate');
      process.exit(1);
    }

    const inputFile = args[inputIdx + 1];
    const reveals = JSON.parse(fs.readFileSync(inputFile, 'utf-8')) as VisualReveals;
    const report = validateReveals(reveals);

    const outputIdx = args.indexOf('--output');
    if (outputIdx !== -1) {
      const outputFile = args[outputIdx + 1];
      fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
      console.log(`✓ Report saved: ${outputFile}`);
    } else {
      console.log(JSON.stringify(report, null, 2));
    }

    return;
  }

  // Generate mode
  if (args.includes('--generate')) {
    const generateIdx = args.indexOf('--generate');
    const beatFile = args[generateIdx + 1];

    if (!beatFile) {
      console.error('Error: --generate requires a beats file');
      process.exit(1);
    }

    const wpmIdx = args.indexOf('--wpm');
    const wpm = wpmIdx !== -1 ? parseInt(args[wpmIdx + 1], 10) : 150;

    const beats = JSON.parse(fs.readFileSync(beatFile, 'utf-8')) as Beat[];
    const reveals = generateSeedReveals(beats, wpm);

    const outputIdx = args.indexOf('--output');
    if (outputIdx !== -1) {
      const outputFile = args[outputIdx + 1];
      fs.writeFileSync(outputFile, JSON.stringify(reveals, null, 2));
      console.log(`✓ Seed reveals generated: ${outputFile}`);
      console.log(`  Total reveals: ${reveals.reveals.length}`);
      console.log(`  Duration: ${reveals.reveals[reveals.reveals.length - 1]?.t.toFixed(2)}s`);
    } else {
      console.log(JSON.stringify(reveals, null, 2));
    }

    return;
  }

  console.error('Error: Please specify --validate or --generate');
  process.exit(1);
}

main().catch(console.error);
