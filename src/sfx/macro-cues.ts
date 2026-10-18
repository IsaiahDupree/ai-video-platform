import fs from 'node:fs';
import path from 'node:path';
import type { SfxManifest } from '../audio/audio-types';
import type { VisualRevealsFile, RevealKind } from '../format/visual-reveals';
import type { BeatSec } from '../format/hybrid-types';
import { loadVisualReveals } from '../format/visual-reveals';

// =============================================================================
// Macro Cue Types
// =============================================================================

export type SfxMacro =
  | 'reveal_riser'
  | 'impact_soft'
  | 'impact_deep'
  | 'text_ping'
  | 'whoosh_fast'
  | 'error_buzz'
  | 'success_ding'
  | 'sparkle_rise'
  | 'keyboard_tick'
  | 'tension_build';

export interface MacroCue {
  t: number;
  macro: SfxMacro;
  source: 'reveal' | 'beat' | 'manual';
  key?: string;
}

export interface MacroCuesFile {
  version: string;
  cues: MacroCue[];
}

// =============================================================================
// Reveal Kind → Macro Mapping
// =============================================================================

export function revealKindToMacro(kind: RevealKind): SfxMacro {
  switch (kind) {
    case 'keyword': return 'impact_soft';
    case 'bullet': return 'text_ping';
    case 'code': return 'keyboard_tick';
    case 'error': return 'error_buzz';
    case 'success': return 'success_ding';
    case 'cta': return 'sparkle_rise';
    case 'chart': return 'reveal_riser';
    default: return 'text_ping';
  }
}

// =============================================================================
// Beat Action → Macro Mapping
// =============================================================================

export function beatActionToMacro(action: string): SfxMacro | null {
  switch (action) {
    case 'hook': return 'reveal_riser';
    case 'reveal': return 'impact_soft';
    case 'explain': return 'text_ping';
    case 'code': return 'keyboard_tick';
    case 'error': return 'error_buzz';
    case 'success': return 'success_ding';
    case 'transition': return 'whoosh_fast';
    case 'punchline': return 'impact_deep';
    case 'cta': return 'sparkle_rise';
    case 'problem': return 'tension_build';
    default: return null;
  }
}

// =============================================================================
// Generate Macro Cues from Reveals + Beats
// =============================================================================

export interface GenerateMacroCuesOptions {
  reveals?: VisualRevealsFile;
  beats?: BeatSec[];
  preferReveals?: boolean;  // If true, use reveals; else use beats
}

export function generateMacroCues(opts: GenerateMacroCuesOptions): MacroCuesFile {
  const cues: MacroCue[] = [];

  // Add cues from reveals
  if (opts.reveals?.reveals) {
    for (const r of opts.reveals.reveals) {
      const macro = revealKindToMacro(r.kind);
      cues.push({
        t: r.t,
        macro,
        source: 'reveal',
        key: r.key,
      });
    }
  }

  // Add cues from beats (if no reveals or as supplement)
  if (opts.beats && (!opts.reveals?.reveals?.length || !opts.preferReveals)) {
    for (const b of opts.beats) {
      const macro = beatActionToMacro(b.action);
      if (!macro) continue;
      
      // Skip if a reveal cue already exists at similar time
      const hasSimilar = cues.some((c) => Math.abs(c.t - b.t) < 0.1);
      if (hasSimilar && opts.reveals?.reveals?.length) continue;
      
      cues.push({
        t: b.t,
        macro,
        source: 'beat',
        key: b.text?.slice(0, 60),
      });
    }
  }

  // Sort by time
  cues.sort((a, b) => a.t - b.t);

  return { version: '1.0.0', cues };
}

// =============================================================================
// Macro → Real SFX ID Mapping
// =============================================================================

export interface MacroMapping {
  [macro: string]: string[];  // macro → array of sfxIds (first available wins)
}

export const DEFAULT_MACRO_MAPPING: MacroMapping = {
  reveal_riser: ['meme_sfx_pack_iconic', 'tension_riser'],
  impact_soft: ['fahhh_tiktok', 'soft_impact'],
  impact_deep: ['fahhh_tiktok', 'deep_bass_hit'],
  text_ping: ['meme_sfx_pack_iconic', 'ui_pop'],
  whoosh_fast: ['meme_sfx_pack_100_popular', 'whoosh_fast'],
  error_buzz: ['meme_sfx_pack_iconic', 'error_buzz'],
  success_ding: ['meme_sfx_pack_iconic', 'success_chime'],
  sparkle_rise: ['meme_sfx_pack_iconic', 'sparkle_rise'],
  keyboard_tick: ['meme_sfx_pack_iconic', 'keyboard_click'],
  tension_build: ['meme_sfx_pack_100_popular', 'tension_build'],
};

export function resolveMacroToSfxId(
  macro: SfxMacro,
  manifest: SfxManifest,
  mapping: MacroMapping = DEFAULT_MACRO_MAPPING
): string | null {
  const candidates = mapping[macro] ?? [];
  const manifestIds = new Set(manifest.items.map((i) => i.id));

  for (const id of candidates) {
    if (manifestIds.has(id)) return id;
  }

  // Fallback: try to find by tag
  const tagHints: Record<string, string[]> = {
    reveal_riser: ['riser', 'tension', 'build'],
    impact_soft: ['impact', 'hit', 'soft'],
    impact_deep: ['impact', 'bass', 'deep'],
    text_ping: ['pop', 'ping', 'ui'],
    whoosh_fast: ['whoosh', 'swoosh', 'transition'],
    error_buzz: ['error', 'buzz', 'alert'],
    success_ding: ['success', 'ding', 'chime'],
    sparkle_rise: ['sparkle', 'shine', 'magic'],
    keyboard_tick: ['keyboard', 'click', 'type'],
    tension_build: ['tension', 'suspense', 'build'],
  };

  const hints = tagHints[macro] ?? [];
  for (const item of manifest.items) {
    const tags = item.tags.map((t) => t.toLowerCase());
    if (hints.some((h) => tags.includes(h))) {
      return item.id;
    }
  }

  // Ultimate fallback: first item
  return manifest.items[0]?.id ?? null;
}

// =============================================================================
// Compile Macro Cues → Audio Events
// =============================================================================

import type { AudioEvents, SfxEvent } from '../audio/audio-types';

export function compileMacroCuesToAudioEvents(args: {
  macroCues: MacroCuesFile;
  manifest: SfxManifest;
  fps: number;
  mapping?: MacroMapping;
}): AudioEvents {
  const events: SfxEvent[] = [];

  for (const cue of args.macroCues.cues) {
    const sfxId = resolveMacroToSfxId(cue.macro, args.manifest, args.mapping);
    if (!sfxId) continue;

    const frame = Math.round(cue.t * args.fps);
    events.push({
      type: 'sfx',
      sfxId,
      frame,
      volume: 0.7,
    });
  }

  return { fps: args.fps, events };
}

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  const root = process.cwd();
  const beatsPath = path.join(root, 'data', 'beats.sec.json');
  const manifestPath = path.join(root, 'public', 'assets', 'sfx', 'manifest.json');
  const outCuesPath = path.join(root, 'data', 'macro_cues.json');
  const outEventsPath = path.join(root, 'data', 'audio_events.sfx.json');

  // Load inputs
  const reveals = loadVisualReveals(root);
  const beats: BeatSec[] = fs.existsSync(beatsPath)
    ? JSON.parse(fs.readFileSync(beatsPath, 'utf-8'))
    : [];
  const manifest: SfxManifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    : { version: '1.0', items: [] };

  // Generate macro cues
  const macroCues = generateMacroCues({ reveals, beats, preferReveals: true });
  fs.writeFileSync(outCuesPath, JSON.stringify(macroCues, null, 2));
  console.log(`✅ Wrote ${outCuesPath} (${macroCues.cues.length} macro cues)`);

  // Compile to audio events
  const fps = 30;
  const audioEvents = compileMacroCuesToAudioEvents({ macroCues, manifest, fps });
  fs.writeFileSync(outEventsPath, JSON.stringify(audioEvents, null, 2));
  console.log(`✅ Wrote ${outEventsPath} (${audioEvents.events.length} SFX events)`);
}
