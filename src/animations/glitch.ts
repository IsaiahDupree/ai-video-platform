import { interpolate } from 'remotion';

export interface GlitchOptions {
  intensity?: number;    // 0–1
  duration?: number;     // frames active
  delay?: number;
  randomSeed?: number;
}

export interface GlitchResult {
  transform: string;
  textShadow: string;
  opacity: number;
  filter: string;
}

// Deterministic pseudo-random based on frame + seed
function rand(frame: number, seed: number = 0): number {
  const x = Math.sin(frame * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function glitch(
  frame: number,
  options: GlitchOptions = {}
): GlitchResult {
  const { intensity = 0.6, duration = 6, delay = 0, randomSeed = 42 } = options;

  const localFrame = frame - delay;
  if (localFrame < 0 || localFrame >= duration) {
    return { transform: 'none', textShadow: 'none', opacity: 1, filter: 'none' };
  }

  const progress = localFrame / duration;
  const active = interpolate(progress, [0, 0.1, 0.9, 1], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const r1 = rand(localFrame, randomSeed);
  const r2 = rand(localFrame, randomSeed + 1);
  const r3 = rand(localFrame, randomSeed + 2);

  const xOffset = (r1 - 0.5) * 20 * intensity * active;
  const yOffset = (r2 - 0.5) * 6 * intensity * active;

  // RGB channel split
  const rX = (r3 - 0.5) * 8 * intensity;
  const bX = -(r3 - 0.5) * 8 * intensity;

  return {
    transform: `translate(${xOffset}px, ${yOffset}px)`,
    textShadow: `${rX}px 0 rgba(255,0,0,0.8), ${bX}px 0 rgba(0,0,255,0.8)`,
    opacity: interpolate(progress, [0.4, 0.5, 0.6], [1, 0.7, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    filter: `saturate(${1 + intensity * active}) contrast(${1 + 0.3 * intensity * active})`,
  };
}

export function glitchReveal(
  frame: number,
  durationInFrames: number,
  intensity: number = 0.5
): GlitchResult {
  const burstFrames = 8;
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (frame < burstFrames) {
    return glitch(frame, { intensity, duration: burstFrames, delay: 0 });
  }

  return { transform: 'none', textShadow: 'none', opacity: 1, filter: 'none' };
}
