import type { AudioEvents, SfxManifest } from './audio-types';

// =============================================================================
// Anti-Spam + De-dupe (limit SFX density)
// =============================================================================

export interface ThinOptions {
  events: AudioEvents;
  manifest: SfxManifest;
  minSecondsBetweenSfx?: number;    // Default 0.35
  allowBurstForTransitions?: boolean; // Default true
  maxSfxPerSecond?: number;         // Default 2 (hard ceiling)
}

export function thinSfxEvents(opts: ThinOptions): AudioEvents {
  const minSecondsBetweenSfx = opts.minSecondsBetweenSfx ?? 0.35;
  const allowBurstForTransitions = opts.allowBurstForTransitions ?? true;
  const maxSfxPerSecond = opts.maxSfxPerSecond ?? 2;

  const fps = opts.events.fps;
  const minFrames = Math.max(1, Math.round(minSecondsBetweenSfx * fps));

  const byId = new Map(opts.manifest.items.map((i) => [i.id, i]));
  const sorted = [...opts.events.events].sort((a, b) => a.frame - b.frame);

  const out: typeof sorted = [];
  let lastSfxFrame = -Infinity;

  // For hard ceiling
  const sfxCountBySecond = new Map<number, number>();

  for (const ev of sorted) {
    if (ev.type !== 'sfx') {
      out.push(ev);
      continue;
    }

    const meta = byId.get(ev.sfxId);
    const category = meta?.category?.toLowerCase() ?? '';
    const isTransition = category === 'transition' || 
      (meta?.tags ?? []).some((t) => t.toLowerCase() === 'transition');

    const secondBucket = Math.floor(ev.frame / fps);
    const countThisSecond = sfxCountBySecond.get(secondBucket) ?? 0;

    // Hard ceiling: max SFX per second
    if (countThisSecond >= maxSfxPerSecond) continue;

    // Soft spacing rule: allow tighter spacing for transitions if enabled
    const tooClose = ev.frame - lastSfxFrame < minFrames;
    if (tooClose && !(allowBurstForTransitions && isTransition)) continue;

    // De-dupe: if same sfxId within 0.2s, drop
    const dedupeFrames = Math.max(1, Math.round(0.2 * fps));
    const recentSame = out
      .slice(-6)
      .some((x) => x.type === 'sfx' && x.sfxId === ev.sfxId && 
        Math.abs(x.frame - ev.frame) <= dedupeFrames);
    if (recentSame) continue;

    out.push(ev);
    lastSfxFrame = ev.frame;
    sfxCountBySecond.set(secondBucket, countThisSecond + 1);
  }

  return { ...opts.events, events: out };
}
