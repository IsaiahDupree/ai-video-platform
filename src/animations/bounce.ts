import { interpolate, Easing } from 'remotion';

export interface BounceOptions {
  durationInFrames: number;
  delay?: number;
  bounceHeight?: number;
  bounces?: number;
}

// Custom bounce easing
export function bounceEasing(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}

export function bounceIn(
  frame: number,
  options: BounceOptions
): { scale: number; y: number; opacity: number } {
  const {
    durationInFrames,
    delay = 0,
    bounceHeight = 50,
  } = options;

  const progress = interpolate(
    frame,
    [delay, delay + durationInFrames],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const bouncedProgress = bounceEasing(progress);

  const scale = interpolate(bouncedProgress, [0, 1], [0.3, 1]);
  const y = interpolate(bouncedProgress, [0, 1], [-bounceHeight, 0]);
  const opacity = interpolate(progress, [0, 0.2], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return { scale, y, opacity };
}

export function elasticScale(
  frame: number,
  durationInFrames: number,
  delay: number = 0
): number {
  const progress = interpolate(
    frame,
    [delay, delay + durationInFrames],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Elastic easing out
  if (progress === 0 || progress === 1) return progress;
  
  const p = 0.3;
  const s = p / 4;
  
  return Math.pow(2, -10 * progress) * Math.sin((progress - s) * (2 * Math.PI) / p) + 1;
}

export function pulse(
  frame: number,
  cycleDuration: number,
  minScale: number = 0.95,
  maxScale: number = 1.05
): number {
  const progress = (frame % cycleDuration) / cycleDuration;
  const sinValue = Math.sin(progress * Math.PI * 2);
  
  return interpolate(sinValue, [-1, 1], [minScale, maxScale]);
}
