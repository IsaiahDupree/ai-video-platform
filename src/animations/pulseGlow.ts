import { interpolate } from 'remotion';

export interface PulseGlowOptions {
  color: string;
  minOpacity?: number;
  maxOpacity?: number;
  cycleDuration?: number;  // frames per full cycle
  minBlur?: number;
  maxBlur?: number;
  minSpread?: number;
  maxSpread?: number;
}

export function pulseGlow(
  frame: number,
  options: PulseGlowOptions
): { boxShadow: string; textShadow: string } {
  const {
    color,
    minOpacity = 0.3,
    maxOpacity = 0.9,
    cycleDuration = 45,
    minBlur = 10,
    maxBlur = 40,
    minSpread = 0,
    maxSpread = 15,
  } = options;

  const cycleProgress = (frame % cycleDuration) / cycleDuration;
  const sinVal = Math.sin(cycleProgress * Math.PI * 2);
  const t = (sinVal + 1) / 2; // 0..1

  const opacity = interpolate(t, [0, 1], [minOpacity, maxOpacity]);
  const blur = interpolate(t, [0, 1], [minBlur, maxBlur]);
  const spread = interpolate(t, [0, 1], [minSpread, maxSpread]);

  // Parse hex color and inject opacity
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const rgba = `rgba(${r}, ${g}, ${b}, ${opacity.toFixed(2)})`;

  return {
    boxShadow: `0 0 ${blur}px ${spread}px ${rgba}`,
    textShadow: `0 0 ${blur}px ${rgba}, 0 0 ${blur * 2}px ${rgba}`,
  };
}

export function staticGlow(
  color: string,
  blur: number = 20,
  spread: number = 5,
  opacity: number = 0.7
): { boxShadow: string; textShadow: string } {
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const rgba = `rgba(${r}, ${g}, ${b}, ${opacity})`;

  return {
    boxShadow: `0 0 ${blur}px ${spread}px ${rgba}`,
    textShadow: `0 0 ${blur}px ${rgba}`,
  };
}
