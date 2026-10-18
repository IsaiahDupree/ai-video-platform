import fs from 'node:fs';
import path from 'node:path';
import type { HybridFormat, BeatSec, BlockType, BeatAction } from './hybrid-types';
import { blockTypeToAction, estimateSeconds } from './hybrid-types';

// =============================================================================
// Visual Reveals Types
// =============================================================================

export type RevealKind = 
  | 'keyword'
  | 'bullet'
  | 'code'
  | 'chart'
  | 'cta'
  | 'error'
  | 'success';

export interface VisualReveal {
  t: number;
  kind: RevealKind;
  key?: string;
  blockId?: string;
}

export interface VisualRevealsFile {
  version: string;
  reveals: VisualReveal[];
}

// =============================================================================
// Block Type → Reveal Kind
// =============================================================================

export function blockTypeToRevealKind(type: BlockType): RevealKind {
  switch (type) {
    case 'keyword': return 'keyword';
    case 'bullet': return 'bullet';
    case 'code': return 'code';
    case 'error': return 'error';
    case 'success': return 'success';
    case 'cta': return 'cta';
    case 'chart': return 'chart';
    case 'image': return 'keyword';
    default: return 'bullet';
  }
}

// =============================================================================
// Reveal Kind → Animation Offset (for timing alignment)
// =============================================================================

function kindOffsetSec(kind: RevealKind): number {
  switch (kind) {
    case 'keyword': return 0.00;
    case 'bullet': return 0.05;
    case 'code': return 0.07;
    case 'error': return 0.03;
    case 'success': return 0.03;
    case 'cta': return 0.00;
    case 'chart': return 0.10;
    default: return 0.05;
  }
}

// =============================================================================
// Seed Visual Reveals (pacing-accurate, before first render)
// =============================================================================

export function seedVisualReveals(format: HybridFormat, wpm = 165): VisualRevealsFile {
  let tCursor = 0;
  const reveals: VisualReveal[] = [];

  for (const block of format.blocks) {
    const kind = blockTypeToRevealKind(block.type);
    const action = blockTypeToAction(block.type);
    const offset = kindOffsetSec(kind);

    const t = Number((tCursor + offset).toFixed(3));
    const key = block.text?.slice(0, 80);

    reveals.push({ t, kind, key, blockId: block.id });

    const dur = block.duration ?? estimateSeconds(block.text, action, wpm);
    tCursor += dur;
  }

  // De-dupe by (kind + key + time bucket)
  const deduped: VisualReveal[] = [];
  const seen = new Set<string>();

  for (const r of reveals.sort((a, b) => a.t - b.t)) {
    const bucket = Math.round(r.t / 0.08); // 80ms buckets
    const sig = `${r.kind}|${r.key ?? ''}|${bucket}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    deduped.push(r);
  }

  return { version: '1.0.0', reveals: deduped };
}

// =============================================================================
// Load Visual Reveals (real or seed fallback)
// =============================================================================

export function loadVisualReveals(root = process.cwd()): VisualRevealsFile {
  const realPath = path.join(root, 'data', 'visual_reveals.json');
  const seedPath = path.join(root, 'data', 'visual_reveals.seed.json');

  if (fs.existsSync(realPath)) {
    return JSON.parse(fs.readFileSync(realPath, 'utf-8'));
  }
  if (fs.existsSync(seedPath)) {
    return JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  }
  return { version: '1.0.0', reveals: [] };
}

// =============================================================================
// Reveal Recorder (runtime capture)
// =============================================================================

let revealLog: VisualReveal[] = [];
let startTime = 0;

export function resetReveals(): void {
  revealLog = [];
  startTime = Date.now();
}

export function reveal(kind: RevealKind, key?: string): void {
  const t = (Date.now() - startTime) / 1000;
  revealLog.push({ t: Number(t.toFixed(3)), kind, key });
}

export function getReveals(): VisualReveal[] {
  return [...revealLog];
}

export function flushRevealsToFile(outPath?: string): void {
  const root = process.cwd();
  const filePath = outPath ?? path.join(root, 'data', 'visual_reveals.json');
  
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    JSON.stringify({ version: '1.0.0', reveals: revealLog }, null, 2)
  );
  console.log(`✅ Flushed ${revealLog.length} reveals to ${filePath}`);
}

// =============================================================================
// CLI: Seed Reveals from Format
// =============================================================================

if (require.main === module) {
  const root = process.cwd();
  const formatPath = path.join(root, 'data', 'hybrid_format.json');
  const outPath = path.join(root, 'data', 'visual_reveals.seed.json');

  if (!fs.existsSync(formatPath)) {
    console.error(`Missing: ${formatPath}`);
    console.error('Run format generator first: npx tsx src/format/format-generator.ts data/script.txt');
    process.exit(1);
  }

  const format = JSON.parse(fs.readFileSync(formatPath, 'utf-8')) as HybridFormat;
  const reveals = seedVisualReveals(format);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(reveals, null, 2));
  console.log(`✅ Wrote ${outPath} (${reveals.reveals.length} seeded reveals)`);
}
