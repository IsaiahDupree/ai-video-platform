import fs from 'node:fs';
import path from 'node:path';
import type { HybridFormat, FormatBlock, BeatSec, TimelineEvents, BeatAction } from './hybrid-types';
import { blockTypeToAction, estimateSeconds } from './hybrid-types';

// =============================================================================
// Generate HybridFormat from Script
// =============================================================================

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30);
}

function detectBlockType(text: string): FormatBlock['type'] {
  const lower = text.toLowerCase();
  
  if (/^(error|failed|broke|crashed|bug|exception)/.test(lower)) return 'error';
  if (/^(success|works|fixed|solved|done|deployed)/.test(lower)) return 'success';
  if (/^(subscribe|follow|download|join|link|comment|like)/.test(lower)) return 'cta';
  if (/^[•\-\*\d+\.]/.test(text.trim())) return 'bullet';
  if (/^[$#>]|^\s*(const|let|var|function|import|export|class|def |async )/.test(text)) return 'code';
  if (text.length < 40 && !/[.!?]$/.test(text.trim())) return 'keyword';
  
  return 'bullet';
}

function detectAction(text: string): BeatAction {
  const lower = text.toLowerCase();
  
  if (/(subscribe|follow|download|join|link in bio|waitlist|comment)/.test(lower)) return 'cta';
  if (/(but here's the thing|plot twist|you won't believe|here's why|the truth|most people)/.test(lower)) return 'hook';
  if (/(so next|now let's|moving on|meanwhile|then|next up|switch to)/.test(lower)) return 'transition';
  if (/(boom|gotcha|and that's it|that's the trick|mic drop)/.test(lower)) return 'punchline';
  if (/(here's how|step|first|second|third|do this|use this)/.test(lower)) return 'explain';
  if (/(error|failed|broke|crashed|bug)/.test(lower)) return 'error';
  if (/(success|works|fixed|solved|done)/.test(lower)) return 'success';
  if (/^(const|let|var|function|import|class|def )/.test(lower)) return 'code';
  
  return 'reveal';
}

export interface GenerateFormatOptions {
  script: string;
  fps?: number;
  wpm?: number;
  theme?: HybridFormat['style']['theme'];
}

export function generateHybridFormat(opts: GenerateFormatOptions): HybridFormat {
  const fps = opts.fps ?? 30;
  const wpm = opts.wpm ?? 165;
  const theme = opts.theme ?? 'dark';

  const lines = opts.script
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const blocks: FormatBlock[] = [];

  for (let i = 0; i < lines.length; i++) {
    let text = lines[i];
    
    // Remove label prefix if present (e.g., "HOOK:", "CTA:")
    const labelMatch = text.match(/^([A-Z_]{2,12}):\s*/);
    if (labelMatch) {
      text = text.slice(labelMatch[0].length).trim();
    }

    const type = detectBlockType(text);
    const id = `${i + 1}_${slug(text)}`;
    const event = `${type}_${i + 1}_in`;

    blocks.push({ id, type, text, event });
  }

  return {
    version: '1.0.0',
    fps,
    style: { theme, fontScale: 1.0 },
    blocks,
  };
}

// =============================================================================
// Generate Beats with Timing
// =============================================================================

export function generateBeatsFromFormat(format: HybridFormat, wpm = 165): BeatSec[] {
  const beats: BeatSec[] = [];
  let tCursor = 0;

  for (const block of format.blocks) {
    const action = blockTypeToAction(block.type);
    const beatId = block.id;
    const event = block.event;

    beats.push({
      beatId,
      t: Number(tCursor.toFixed(3)),
      text: block.text,
      action,
      event,
      blockId: block.id,
    });

    const dur = block.duration ?? estimateSeconds(block.text, action, wpm);
    tCursor += dur;
  }

  return beats;
}

// =============================================================================
// Generate Timeline Events
// =============================================================================

export function generateTimelineEvents(beats: BeatSec[], fps: number): TimelineEvents {
  const events = beats.map((b) => ({
    name: b.event ?? b.beatId,
    t: b.t,
    action: b.action,
    blockId: b.blockId ?? b.beatId,
    text: b.text,
  }));

  return {
    version: '1.0.0',
    fps,
    events,
  };
}

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  const scriptPath = process.argv[2] || 'data/script.txt';
  const fps = Number(process.argv[3]) || 30;
  const root = process.cwd();

  if (!fs.existsSync(scriptPath)) {
    console.error(`Usage: npx tsx src/format/format-generator.ts <script.txt> [fps]`);
    process.exit(1);
  }

  const script = fs.readFileSync(scriptPath, 'utf-8');
  const format = generateHybridFormat({ script, fps });
  const beats = generateBeatsFromFormat(format);
  const timeline = generateTimelineEvents(beats, fps);

  // Write outputs
  const dataDir = path.join(root, 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  fs.writeFileSync(
    path.join(dataDir, 'hybrid_format.json'),
    JSON.stringify(format, null, 2)
  );
  console.log(`✅ Wrote data/hybrid_format.json (${format.blocks.length} blocks)`);

  fs.writeFileSync(
    path.join(dataDir, 'beats.sec.json'),
    JSON.stringify(beats, null, 2)
  );
  console.log(`✅ Wrote data/beats.sec.json (${beats.length} beats)`);

  fs.writeFileSync(
    path.join(dataDir, 'timeline.events.json'),
    JSON.stringify(timeline, null, 2)
  );
  console.log(`✅ Wrote data/timeline.events.json (${timeline.events.length} events)`);

  const totalDur = beats.length ? beats[beats.length - 1].t + 2 : 0;
  console.log(`\n📊 Estimated duration: ${totalDur.toFixed(1)}s (~${Math.ceil(totalDur * fps)} frames @ ${fps}fps)`);
}
