import { interpolate, Easing } from 'remotion';

export interface CountUpOptions {
  from?: number;
  to: number;
  durationInFrames: number;
  delay?: number;
  easing?: (t: number) => number;
  decimals?: number;
}

export function countUp(
  frame: number,
  options: CountUpOptions
): number {
  const {
    from = 0,
    to,
    durationInFrames,
    delay = 0,
    easing = Easing.out(Easing.cubic),
    decimals = 0,
  } = options;

  const value = interpolate(
    frame,
    [delay, delay + durationInFrames],
    [from, to],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing,
    }
  );

  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

export function formatCountValue(
  value: number,
  options: {
    prefix?: string;
    suffix?: string;
    locale?: string;
    compact?: boolean;
  } = {}
): string {
  const { prefix = '', suffix = '', locale = 'en-US', compact = false } = options;

  let formatted: string;
  if (compact && Math.abs(value) >= 1000) {
    if (Math.abs(value) >= 1_000_000) {
      formatted = (value / 1_000_000).toFixed(1) + 'M';
    } else if (Math.abs(value) >= 1_000) {
      formatted = (value / 1_000).toFixed(1) + 'K';
    } else {
      formatted = value.toLocaleString(locale);
    }
  } else {
    formatted = value.toLocaleString(locale);
  }

  return `${prefix}${formatted}${suffix}`;
}
