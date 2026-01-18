import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

// =============================================================================
// Zod Schemas
// =============================================================================

export const BeatActionZ = z.enum([
  'hook', 'problem', 'transition', 'reveal', 'explain',
  'code', 'error', 'success', 'punchline', 'cta', 'outro'
]);

export const SfxItemZ = z.object({
  id: z.string().min(1),
  file: z.string().min(1),
  tags: z.array(z.string()).default([]),
  description: z.string().default(''),
  intensity: z.number().min(1).max(10).optional(),
  category: z.string().optional(),
  license: z.object({
    source: z.string().optional(),
    url: z.string().optional(),
    requiresAttribution: z.boolean().optional(),
    attributionText: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
});

export const SfxManifestZ = z.object({
  version: z.string().min(1),
  items: z.array(SfxItemZ).min(1),
});

export const SfxEventZ = z.object({
  type: z.literal('sfx'),
  sfxId: z.string().min(1),
  frame: z.number().int().min(0),
  volume: z.number().min(0).max(2).optional(),
});

export const MusicEventZ = z.object({
  type: z.literal('music'),
  src: z.string().min(1),
  frame: z.number().int().min(0),
  volume: z.number().min(0).max(2).optional(),
});

export const VoiceoverEventZ = z.object({
  type: z.literal('voiceover'),
  src: z.string().min(1),
  frame: z.number().int().min(0),
  volume: z.number().min(0).max(2).optional(),
});

export const AudioEventZ = z.discriminatedUnion('type', [
  SfxEventZ,
  MusicEventZ,
  VoiceoverEventZ,
]);

export const AudioEventsZ = z.object({
  fps: z.number().min(1).max(240),
  events: z.array(AudioEventZ),
});

export const BeatZ = z.object({
  beatId: z.string().min(1),
  frame: z.number().int().min(0),
  text: z.string(),
  action: BeatActionZ.optional(),
});

export const BeatSecZ = z.object({
  beatId: z.string().min(1),
  t: z.number().min(0),
  text: z.string(),
  action: BeatActionZ,
  event: z.string().optional(),
});

export const TimelineEventZ = z.object({
  name: z.string().min(1),
  t: z.number().min(0),
  action: BeatActionZ,
  blockId: z.string().min(1),
  text: z.string(),
});

export const TimelineEventsZ = z.object({
  version: z.string().min(1),
  fps: z.number().min(1).max(240),
  events: z.array(TimelineEventZ),
});

export const TimelineQAZ = z.object({
  version: z.string(),
  totalEvents: z.number().int().min(0),
  durationSec: z.number().min(0),
  minGapSec: z.number().min(0),
  avgGapSec: z.number().min(0),
  denseZones: z.array(z.object({
    start: z.number(),
    end: z.number(),
    count: z.number().int(),
  })),
  actionCounts: z.record(z.string(), z.number().int()),
  gapWarnings: z.array(z.object({
    a: z.string(),
    b: z.string(),
    gap: z.number(),
  })),
});

// =============================================================================
// Loaders with Validation
// =============================================================================

export function loadManifest(manifestPath: string) {
  const raw = fs.readFileSync(manifestPath, 'utf-8');
  const parsed = SfxManifestZ.parse(JSON.parse(raw));
  const map = new Map(parsed.items.map((it) => [it.id, it]));
  return { manifest: parsed, map };
}

export function loadAudioEvents(eventsPath: string) {
  const raw = fs.readFileSync(eventsPath, 'utf-8');
  return AudioEventsZ.parse(JSON.parse(raw));
}

export function loadTimelineEvents(eventsPath: string) {
  const raw = fs.readFileSync(eventsPath, 'utf-8');
  return TimelineEventsZ.parse(JSON.parse(raw));
}

export function requireSfxFileById(opts: {
  sfxRootDir: string;
  sfxId: string;
  manifestMap: Map<string, { file: string }>;
}) {
  const item = opts.manifestMap.get(opts.sfxId);
  if (!item) throw new Error(`Unknown sfxId: ${opts.sfxId}`);
  const abs = path.join(opts.sfxRootDir, item.file);
  if (!fs.existsSync(abs)) throw new Error(`Missing SFX file for ${opts.sfxId}: ${abs}`);
  return abs;
}

// =============================================================================
// Strict JSON Parser (extract from messy LLM output)
// =============================================================================

function extractJsonCandidate(text: string): string | null {
  // Prefer fenced JSON blocks first
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();

  // Otherwise try to slice from first "{" to last "}"
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) return text.slice(first, last + 1).trim();

  // If no object, try array
  const aFirst = text.indexOf('[');
  const aLast = text.lastIndexOf(']');
  if (aFirst >= 0 && aLast > aFirst) return text.slice(aFirst, aLast + 1).trim();

  return null;
}

export function parseAndValidateAudioEvents(rawModelOutput: string) {
  const candidate = extractJsonCandidate(rawModelOutput);
  if (!candidate) {
    throw new Error('Model output did not contain JSON.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    throw new Error(`Invalid JSON from model. Candidate snippet: ${candidate.slice(0, 120)}`);
  }

  return AudioEventsZ.parse(parsed);
}
