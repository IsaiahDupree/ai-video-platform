import { interpolate, Easing } from 'remotion';

export interface ZoomOptions {
  durationInFrames: number;
  delay?: number;
  fromScale?: number;
  toScale?: number;
  easing?: (t: number) => number;
}

export function zoomIn(
  frame: number,
  options: ZoomOptions
): { scale: number; opacity: number } {
  const {
    durationInFrames,
    delay = 0,
    fromScale = 0.5,
    toScale = 1,
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

  const scale = interpolate(progress, [0, 1], [fromScale, toScale]);
  const opacity = interpolate(progress, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return { scale, opacity };
}

export function zoomOut(
  frame: number,
  startFrame: number,
  durationInFrames: number,
  toScale: number = 0.5
): { scale: number; opacity: number } {
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

  const scale = interpolate(progress, [0, 1], [1, toScale]);
  const opacity = interpolate(progress, [0.7, 1], [1, 0], {
    extrapolateLeft: 'clamp',
  });

  return { scale, opacity };
}

export function zoomPan(
  frame: number,
  durationInFrames: number,
  startScale: number = 1,
  endScale: number = 1.2,
  panX: number = 0,
  panY: number = 0
): { scale: number; x: number; y: number } {
  const progress = interpolate(
    frame,
    [0, durationInFrames],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.quad),
    }
  );

  const scale = interpolate(progress, [0, 1], [startScale, endScale]);
  const x = interpolate(progress, [0, 1], [0, panX]);
  const y = interpolate(progress, [0, 1], [0, panY]);

  return { scale, x, y };
}

export function kenBurns(
  frame: number,
  durationInFrames: number,
  direction: 'in' | 'out' = 'in'
): { scale: number; x: number; y: number } {
  const startScale = direction === 'in' ? 1 : 1.3;
  const endScale = direction === 'in' ? 1.3 : 1;
  
  return zoomPan(
    frame,
    durationInFrames,
    startScale,
    endScale,
    direction === 'in' ? -20 : 20,
    direction === 'in' ? -10 : 10
  );
}
