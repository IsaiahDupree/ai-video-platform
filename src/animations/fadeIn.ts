import { interpolate, Easing } from 'remotion';

export interface FadeInOptions {
  durationInFrames: number;
  delay?: number;
  from?: number;
  to?: number;
  easing?: (t: number) => number;
}

export function fadeIn(
  frame: number,
  options: FadeInOptions
): number {
  const {
    durationInFrames,
    delay = 0,
    from = 0,
    to = 1,
    easing = Easing.out(Easing.cubic),
  } = options;

  return interpolate(
    frame,
    [delay, delay + durationInFrames],
    [from, to],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing,
    }
  );
}

export function fadeOut(
  frame: number,
  startFrame: number,
  durationInFrames: number,
  easing: (t: number) => number = Easing.in(Easing.cubic)
): number {
  return interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing,
    }
  );
}

export function fadeInOut(
  frame: number,
  totalFrames: number,
  fadeInDuration: number,
  fadeOutDuration: number
): number {
  const fadeOutStart = totalFrames - fadeOutDuration;
  
  if (frame < fadeInDuration) {
    return fadeIn(frame, { durationInFrames: fadeInDuration });
  }
  if (frame >= fadeOutStart) {
    return fadeOut(frame, fadeOutStart, fadeOutDuration);
  }
  return 1;
}
