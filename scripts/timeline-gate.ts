import fs from 'node:fs';
import path from 'node:path';
import type { TimelineQA } from '../src/audio/audio-types';

// =============================================================================
// Timeline QA Gate - Fail build on pacing issues
// =============================================================================

interface GateConfig {
  mode: 'fail' | 'warn';
  minHardGapSec: number;        // Fail if any gap below this
  maxDenseZoneCount: number;    // Fail if any dense zone count >= this
  maxGapWarnings: number;       // Fail if too many "under MIN_GAP" warnings
}

const DEFAULTS: GateConfig = {
  mode: (process.env.QA_MODE as 'fail' | 'warn') === 'warn' ? 'warn' : 'fail',
  minHardGapSec: Number(process.env.QA_MIN_HARD_GAP ?? 0.20),
  maxDenseZoneCount: Number(process.env.QA_MAX_DENSE_COUNT ?? 8),
  maxGapWarnings: Number(process.env.QA_MAX_GAP_WARNINGS ?? 12),
};

function main() {
  const root = process.cwd();
  const qaPath = path.join(root, 'data', 'qa.timeline_report.json');

  if (!fs.existsSync(qaPath)) {
    console.error(`❌ Missing QA report: ${qaPath}`);
    console.log('   Run timeline analysis first to generate the report.');
    process.exit(2);
  }

  const qa = JSON.parse(fs.readFileSync(qaPath, 'utf-8')) as TimelineQA;

  const failures: string[] = [];

  // Rule 1: hard minimum gap
  if (qa.minGapSec < DEFAULTS.minHardGapSec) {
    failures.push(`minGapSec ${qa.minGapSec.toFixed(3)} < hardMin ${DEFAULTS.minHardGapSec.toFixed(2)}`);
  }

  // Rule 2: dense zones
  const worstDense = qa.denseZones.reduce((m, z) => Math.max(m, z.count), 0);
  if (worstDense >= DEFAULTS.maxDenseZoneCount) {
    failures.push(`dense zone count ${worstDense} >= maxDense ${DEFAULTS.maxDenseZoneCount}`);
  }

  // Rule 3: too many warnings
  if (qa.gapWarnings.length > DEFAULTS.maxGapWarnings) {
    failures.push(`gapWarnings ${qa.gapWarnings.length} > max ${DEFAULTS.maxGapWarnings}`);
  }

  // Print summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('               Timeline QA Gate');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Duration:      ${qa.durationSec.toFixed(2)}s`);
  console.log(`  Total Events:  ${qa.totalEvents}`);
  console.log(`  Min Gap:       ${qa.minGapSec.toFixed(3)}s`);
  console.log(`  Avg Gap:       ${qa.avgGapSec.toFixed(3)}s`);
  console.log(`  Dense Zones:   ${qa.denseZones.length} (worst count=${worstDense})`);
  console.log(`  Gap Warnings:  ${qa.gapWarnings.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (qa.actionCounts) {
    console.log('\n  Action Distribution:');
    for (const [action, count] of Object.entries(qa.actionCounts)) {
      console.log(`    ${action}: ${count}`);
    }
  }

  if (failures.length) {
    console.log('\n⚠️  Gate Findings:');
    for (const f of failures) console.log(`    - ${f}`);

    if (DEFAULTS.mode === 'warn') {
      console.log('\n✅ QA_MODE=warn → continuing anyway');
      process.exit(0);
    } else {
      console.error('\n❌ QA gate FAILED → stopping pipeline');
      process.exit(1);
    }
  }

  console.log('\n✅ QA gate PASSED');
  process.exit(0);
}

main();
