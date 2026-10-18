import { interpolate, Easing, spring } from 'remotion';

export interface StaggerOptions {
  index: number;
  total: number;
  durationInFrames: number;
  delay?: number;
  staggerFrames?: number;
  animation?: 'fade' | 'slide_up' | 'slide_left' | 'spring_up' | 'spring_scale';
  easing?: (t: number) => number;
}

export interface StaggerResult {
  opacity: number;
  x: number;
  y: number;
  scale: number;
}

export function stagger(
  frame: number,
  options: StaggerOptions,
  fps: number = 30
): StaggerResult {
  const {
    index,
    staggerFrames = 8,
    durationInFrames,
    delay = 0,
    animation = 'slide_up',
    easing = Easing.out(Easing.cubic),
  } = options;

  const itemDelay = delay + index * staggerFrames;

  if (animation === 'spring_up' || animation === 'spring_scale') {
    const springVal = spring({
      frame: frame - itemDelay,
      fps,
      config: { stiffness: 180, damping: 20, mass: 1 },
      from: 0,
      to: 1,
    });

    const opacity = interpolate(frame, [itemDelay, itemDelay + 8], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    if (animation === 'spring_scale') {
      return { opacity, x: 0, y: 0, scale: interpolate(springVal, [0, 1], [0.7, 1]) };
    }
    return { opacity, x: 0, y: interpolate(springVal, [0, 1], [40, 0]), scale: 1 };
  }

  const progress = interpolate(
    frame,
    [itemDelay, itemDelay + durationInFrames],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing }
  );

  const opacity = interpolate(progress, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' });

  switch (animation) {
    case 'slide_up':
      return { opacity, x: 0, y: interpolate(progress, [0, 1], [50, 0]), scale: 1 };
    case 'slide_left':
      return { opacity, x: interpolate(progress, [0, 1], [80, 0]), y: 0, scale: 1 };
    case 'fade':
    default:
      return { opacity, x: 0, y: 0, scale: 1 };
  }
}
