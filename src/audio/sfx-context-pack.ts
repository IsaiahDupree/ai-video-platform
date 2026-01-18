import fs from 'node:fs';
import path from 'node:path';

// =============================================================================
// Types
// =============================================================================

export interface SfxItem {
  id: string;
  file: string;
  tags: string[];
  description: string;
  intensity?: number;
  category?: string;
  license?: {
    source?: string;
    url?: string;
    requiresAttribution?: boolean;
    notes?: string;
  };
}

export interface SfxManifest {
  version: string;
  items: SfxItem[];
}

export interface SfxContextPack {
  version: string;
  rules: string[];
  sfxIndex: Array<{
    id: string;
    tags: string[];
    desc: string;
    intensity?: number;
    category?: string;
  }>;
}

export interface AudioEvent {
  type: 'sfx' | 'music' | 'voiceover';
  sfxId?: string;
  src?: string;
  frame: number;
  volume?: number;
}

export interface AudioEvents {
  fps: number;
  events: AudioEvent[];
}

// =============================================================================
// Load Manifest
// =============================================================================

export function loadSfxManifest(manifestPath?: string): SfxManifest {
  const defaultPath = path.join(process.cwd(), 'public', 'assets', 'sfx', 'manifest.json');
  const filePath = manifestPath || defaultPath;
  
  if (!fs.existsSync(filePath)) {
    return { version: '1.0', items: [] };
  }
  
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// =============================================================================
// Build Context Pack for AI
// =============================================================================

export function buildSfxContextPack(manifest: SfxManifest, opts?: { maxItems?: number }): SfxContextPack {
  const maxItems = opts?.maxItems ?? 500;

  const sfxIndex = manifest.items
    .slice(0, maxItems)
    .map((it) => ({
      id: it.id,
      tags: it.tags?.slice(0, 10) ?? [],
      desc: (it.description ?? '').slice(0, 120),
      intensity: it.intensity,
      category: it.category,
    }));

  return {
    version: manifest.version,
    rules: [
      'You MUST ONLY use sfxId values that exist in sfxIndex.id.',
      'Return ONLY JSON. No extra commentary.',
      'Prefer exact tag matches; if unsure, choose a safe generic UI pop or soft whoosh.',
      'Keep volumes between 0.3 and 1.0 unless asked otherwise.',
    ],
    sfxIndex,
  };
}

// =============================================================================
// Build Filtered Context Pack (for specific script/scene)
// =============================================================================

function tokenize(s: string): Set<string> {
  return new Set(
    s.toLowerCase()
      .replace(/[^a-z0-9\s_-]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
  );
}

export function buildFilteredSfxContextPack(args: {
  manifest: SfxManifest;
  scriptText: string;
  maxItems?: number;
}): SfxContextPack {
  const tokens = tokenize(args.scriptText);
  
  const scored = args.manifest.items
    .map((it) => {
      let score = 0;
      for (const tag of it.tags ?? []) {
        if (tokens.has(tag.toLowerCase())) score += 3;
      }
      const descTokens = tokenize(it.description ?? '');
      for (const tok of tokens) {
        if (descTokens.has(tok)) score += 1;
      }
      if (it.category && tokens.has(it.category.toLowerCase())) score += 2;
      return { it, score };
    })
    .sort((a, b) => b.score - a.score);

  const top = scored
    .filter((x) => x.score > 0)
    .slice(0, args.maxItems ?? 80)
    .map((x) => x.it);

  // Fallback: if nothing matched, send all items
  const items = top.length ? top : args.manifest.items.slice(0, 40);

  return buildSfxContextPack({ version: args.manifest.version, items });
}

// =============================================================================
// Prompt Template for AI SFX Selection
// =============================================================================

export function makeSfxSelectionPrompt(args: {
  contextPack: SfxContextPack;
  narrativeBeats: Array<{ beatId: string; frame: number; text: string; action?: string }>;
  fps: number;
}): string {
  return `
You are selecting sound effects for a video timeline.

SFX_LIBRARY_CONTEXT:
${JSON.stringify(args.contextPack, null, 2)}

VIDEO_CONTEXT:
- fps: ${args.fps}
- beats: ${JSON.stringify(args.narrativeBeats, null, 2)}

TASK:
Create audio events for SFX only.
Output JSON with this shape:
{
  "fps": ${args.fps},
  "events": [
    { "type": "sfx", "sfxId": "...", "frame": 0, "volume": 0.8 }
  ]
}

CONSTRAINTS:
- sfxId MUST match one of SFX_LIBRARY_CONTEXT.sfxIndex[].id exactly.
- Use frames from beats or nearby offsets (±10 frames).
- Avoid spamming: max 1 sfx per beat unless action is "transition".
`.trim();
}

// =============================================================================
// Best Match Finder (for auto-fixing hallucinated IDs)
// =============================================================================

export function bestSfxMatch(args: {
  manifest: SfxManifest;
  requestedIdOrHint: string;
  hintTags?: string[];
  hintCategory?: string;
}): { id: string; score: number } | null {
  const hintTokens = tokenize(args.requestedIdOrHint);
  const hintTags = new Set((args.hintTags ?? []).map((t) => t.toLowerCase()));
  const hintCategory = args.hintCategory?.toLowerCase();

  let best: { id: string; score: number } | null = null;

  for (const it of args.manifest.items) {
    let score = 0;

    const tags = (it.tags ?? []).map((t) => t.toLowerCase());
    const descTokens = tokenize(it.description ?? '');

    // Tag overlap
    for (const t of tags) {
      if (hintTokens.has(t)) score += 3;
      if (hintTags.has(t)) score += 3;
    }

    // Category match
    if (hintCategory && it.category?.toLowerCase() === hintCategory) score += 2;

    // Description overlap
    for (const tok of hintTokens) {
      if (descTokens.has(tok)) score += 1;
    }

    if (!best || score > best.score) best = { id: it.id, score };
  }

  return best;
}

// =============================================================================
// Validate and Fix Events
// =============================================================================

export interface FixReport {
  fixed: Array<{ from: string; to: string; frame: number; reason: string }>;
  rejected: Array<{ sfxId: string; frame: number; reason: string }>;
}

export function validateAndFixEvents(args: {
  events: AudioEvents;
  manifest: SfxManifest;
  allowAutoFix?: boolean;
}): { cleaned: AudioEvents; report: FixReport } {
  const allowAutoFix = args.allowAutoFix ?? true;
  const idSet = new Set(args.manifest.items.map((i) => i.id));

  const report: FixReport = { fixed: [], rejected: [] };

  const cleaned: AudioEvents = {
    fps: args.events.fps,
    events: [],
  };

  for (const ev of args.events.events) {
    if (ev.type !== 'sfx' || !ev.sfxId) {
      cleaned.events.push(ev);
      continue;
    }

    if (idSet.has(ev.sfxId)) {
      cleaned.events.push(ev);
      continue;
    }

    if (!allowAutoFix) {
      report.rejected.push({ sfxId: ev.sfxId, frame: ev.frame, reason: 'Unknown sfxId' });
      continue;
    }

    // Try to infer from the requested string itself
    const best = bestSfxMatch({
      manifest: args.manifest,
      requestedIdOrHint: ev.sfxId,
    });

    if (!best || best.score <= 0) {
      report.rejected.push({ sfxId: ev.sfxId, frame: ev.frame, reason: 'No reasonable match' });
      continue;
    }

    report.fixed.push({
      from: ev.sfxId,
      to: best.id,
      frame: ev.frame,
      reason: `Auto-mapped by tag/desc similarity (score=${best.score})`,
    });

    cleaned.events.push({ ...ev, sfxId: best.id });
  }

  return { cleaned, report };
}

// =============================================================================
// Get SFX File Path by ID
// =============================================================================

export function getSfxFilePath(sfxId: string, manifest?: SfxManifest): string | null {
  const m = manifest || loadSfxManifest();
  const item = m.items.find((it) => it.id === sfxId);
  if (!item) return null;
  return path.join('sfx', item.file);
}

// =============================================================================
// CLI: Print context pack
// =============================================================================

if (require.main === module) {
  const manifest = loadSfxManifest();
  const contextPack = buildSfxContextPack(manifest);
  console.log(JSON.stringify(contextPack, null, 2));
}
