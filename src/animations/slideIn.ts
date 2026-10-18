import { interpolate, Easing } from 'remotion';

export type SlideDirection = 'left' | 'right' | 'up' | 'down';

export interface SlideInOptions {
  durationInFrames: number;
  delay?: number;
  direction?: SlideDirection;
  distance?: number;
  easing?: (t: number) => number;
}

export function slideIn(
  frame: number,
  options: SlideInOptions
): { x: number; y: number; opacity: number } {
  const {
    durationInFrames,
    delay = 0,
    direction = 'left',
    distance = 100,
    easing = Easing.out(Easing.cubic),
  } = options;

  const progress = interpolate(
    frame,
    [delay, delay + durationInFrames],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing,
    }
  );

  const opacity = interpolate(progress, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  let x = 0;
  let y = 0;

  switch (direction) {
    case 'left':
      x = interpolate(progress, [0, 1], [-distance, 0]);
      break;
    case 'right':
      x = interpolate(progress, [0, 1], [distance, 0]);
      break;
    case 'up':
      y = interpolate(progress, [0, 1], [-distance, 0]);
      break;
    case 'down':
      y = interpolate(progress, [0, 1], [distance, 0]);
      break;
  }

  return { x, y, opacity };
}

export function slideOut(
  frame: number,
  startFrame: number,
  durationInFrames: number,
  direction: SlideDirection = 'left',
  distance: number = 100
): { x: number; y: number; opacity: number } {
  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.cubic),
    }
  );

  const opacity = interpolate(progress, [0.7, 1], [1, 0], {
    extrapolateLeft: 'clamp',
  });

  let x = 0;
  let y = 0;

  switch (direction) {
    case 'left':
      x = interpolate(progress, [0, 1], [0, -distance]);
      break;
    case 'right':
      x = interpolate(progress, [0, 1], [0, distance]);
      break;
    case 'up':
      y = interpolate(progress, [0, 1], [0, -distance]);
      break;
    case 'down':
      y = interpolate(progress, [0, 1], [0, distance]);
      break;
  }

  return { x, y, opacity };
}
