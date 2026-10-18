#!/usr/bin/env npx tsx
/**
 * Development Preview Server
 * 
 * Starts Remotion Studio with a specific brief loaded for preview.
 * 
 * Usage:
 *   npx tsx scripts/preview.ts [brief.json]
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Development Preview Server

Starts Remotion Studio for live preview and development.

Usage:
  npx tsx scripts/preview.ts [brief.json]

Arguments:
  brief.json    Optional path to content brief to load (sets BRIEF_PATH env var)

Examples:
  npx tsx scripts/preview.ts
  npx tsx scripts/preview.ts data/briefs/example_explainer.json
`);
  process.exit(0);
}

const briefPath = args[0];

if (briefPath) {
  const absolutePath = path.resolve(briefPath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ Brief file not found: ${absolutePath}`);
    process.exit(1);
  }
  process.env.BRIEF_PATH = absolutePath;
  console.log(`📂 Loading brief: ${absolutePath}`);
}

console.log('\n🎬 Starting Remotion Studio...\n');

const studio = spawn('npx', ['remotion', 'studio'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    ...(briefPath ? { BRIEF_PATH: path.resolve(briefPath) } : {}),
  },
});

studio.on('error', (err) => {
  console.error('❌ Failed to start studio:', err.message);
  process.exit(1);
});

studio.on('close', (code) => {
  process.exit(code || 0);
});
