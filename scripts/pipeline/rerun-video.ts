#!/usr/bin/env npx tsx
/**
 * Re-run Stage 2 (Veo) + Stage 4 (compose) for specific angle output dirs.
 * Use this to recover angles where Veo failed (e.g. RAI audio filter).
 *
 * Usage:
 *   npx tsx scripts/pipeline/rerun-video.ts <dir1> [dir2] ...
 *
 * Example:
 *   npx tsx scripts/pipeline/rerun-video.ts \
 *     output/pipeline/everreach/2026-02-21T02-24-30/EVERREAC_2026-02-21_01 \
 *     output/pipeline/everreach/2026-02-21T02-24-30/EVERREAC_2026-02-21_03
 */

import * as fs from 'fs';
import * as path from 'path';
import type { AngleInputs } from './offer.schema.js';
import { runStageVideo } from './stage-video.js';
import { runStageCompose } from './stage-compose.js';

function loadEnv(): void {
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

async function main(): Promise<void> {
  loadEnv();

  const dirs = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const aspectRatio = process.argv.find((a) => a.startsWith('--aspect='))?.split('=')[1] ?? '9:16';

  if (dirs.length === 0) {
    console.error('Usage: npx tsx scripts/pipeline/rerun-video.ts <outputDir> [...]');
    process.exit(1);
  }

  for (const dir of dirs) {
    const absDir = path.resolve(process.cwd(), dir);
    const configPath = path.join(absDir, 'scene_config.json');

    if (!fs.existsSync(configPath)) {
      console.log(`❌ No scene_config.json in ${absDir} — skipping`);
      continue;
    }

    const inputs: AngleInputs = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`  📁 ${path.basename(absDir)}`);
    console.log(`  Stage: ${inputs.awarenessStage} | Category: ${inputs.audienceCategory}`);
    console.log(`${'─'.repeat(60)}`);

    // Stage 2: Video
    const videoResult = await runStageVideo(inputs, absDir, aspectRatio);
    if (videoResult.status === 'failed') {
      console.log(`  ❌ Stage 2 failed: ${videoResult.error}`);
      continue;
    }

    // Stage 4: Compose (force re-compose since video is new)
    const composeResult = await runStageCompose(inputs, absDir, aspectRatio, true);
    if (composeResult.status === 'failed') {
      console.log(`  ❌ Stage 4 failed: ${composeResult.error}`);
      continue;
    }

    console.log(`\n  ✅ ${path.basename(absDir)} complete`);
  }

  console.log('\n✅ Re-run complete\n');
}

main().catch((err) => {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
});
