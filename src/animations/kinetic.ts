import { interpolate, spring, Easing } from 'remotion';

export type KineticStyle = 'pop' | 'stamp' | 'bounce' | 'shake' | 'glow' | 'slide_up' | 'scale_fade';

export interface KineticWordOptions {
  style: KineticStyle;
  delay?: number;
  durationInFrames?: number;
  color?: string;
  accentColor?: string;
}

export interface KineticWordResult {
  scale: number;
  y: number;
  x: number;
  opacity: number;
  rotation: number;
  color?: string;
  textShadow?: string;
}

export function kineticWord(
  frame: number,
  options: KineticWordOptions,
  fps: number = 30
): KineticWordResult {
  const { style, delay = 0, durationInFrames = 20, color, accentColor } = options;
  const localFrame = frame - delay;

  switch (style) {
    case 'pop': {
      const s = spring({ frame: localFrame, fps, config: { stiffness: 400, damping: 18 }, from: 0, to: 1 });
      const scale = interpolate(s, [0, 1], [0, 1.2]) > 1.2 ? interpolate(s, [0, 1], [1.2, 1]) : interpolate(s, [0, 1], [0, 1.2]);
      const springScale = spring({ frame: localFrame, fps, config: { stiffness: 300, damping: 14 }, from: 0.3, to: 1 });
      const opacity = interpolate(localFrame, [0, 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      return { scale: springScale, y: 0, x: 0, opacity, rotation: 0 };
    }

    case 'stamp': {
      const progress = interpolate(localFrame, [0, 8], [0, 1], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        easing: Easing.out(Easing.back(3)),
      });
      const scale = interpolate(progress, [0, 1], [2, 1]);
      const opacity = interpolate(localFrame, [0, 3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      return { scale, y: 0, x: 0, opacity, rotation: 0 };
    }

    case 'bounce': {
      const s = spring({ frame: localFrame, fps, config: { stiffness: 200, damping: 10, mass: 0.8 }, from: -40, to: 0 });
      const opacity = interpolate(localFrame, [0, 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      return { scale: 1, y: s, x: 0, opacity, rotation: 0 };
    }

    case 'shake': {
      const active = interpolate(localFrame, [0, durationInFrames], [1, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      });
      const x = Math.sin(localFrame * 1.5) * 6 * active;
      return { scale: 1, y: 0, x, opacity: 1, rotation: Math.sin(localFrame * 1.2) * 3 * active };
    }

    case 'glow': {
      const opacity = interpolate(localFrame, [0, 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
      const glowOpacity = Math.sin((localFrame / 30) * Math.PI * 2) * 0.3 + 0.7;
      return {
        scale: 1, y: 0, x: 0, opacity,
        rotation: 0,
        textShadow: accentColor
          ? `0 0 20px ${accentColor}${Math.round(glowOpacity * 255).toString(16).padStart(2, '0')}`
          : undefined,
        color: accentColor,
      };
    }

    case 'slide_up': {
      const progress = interpolate(localFrame, [0, durationInFrames], [0, 1], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        easing: Easing.out(Easing.cubic),
      });
      return {
        scale: 1, y: interpolate(progress, [0, 1], [30, 0]),
        x: 0, opacity: interpolate(progress, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' }),
        rotation: 0,
      };
    }

    case 'scale_fade': {
      const progress = interpolate(localFrame, [0, durationInFrames], [0, 1], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        easing: Easing.out(Easing.cubic),
      });
      return {
        scale: interpolate(progress, [0, 1], [1.4, 1]),
        y: 0, x: 0,
        opacity: interpolate(progress, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' }),
        rotation: 0,
      };
    }

    default:
      return { scale: 1, y: 0, x: 0, opacity: 1, rotation: 0 };
  }
}

export interface KineticLineOptions {
  words: string[];
  wordDurationFrames?: number;
  staggerFrames?: number;
  delay?: number;
  style?: KineticStyle;
  highlightIndices?: number[];
  accentColor?: string;
  fps?: number;
}

export function getKineticWordProps(
  frame: number,
  wordIndex: number,
  options: KineticLineOptions
): KineticWordResult {
  const {
    wordDurationFrames = 15,
    staggerFrames = 4,
    delay = 0,
    style = 'slide_up',
    highlightIndices = [],
    accentColor,
    fps = 30,
  } = options;

  const wordDelay = delay + wordIndex * staggerFrames;
  const isHighlighted = highlightIndices.includes(wordIndex);

  return kineticWord(frame, {
    style: isHighlighted ? 'glow' : style,
    delay: wordDelay,
    durationInFrames: wordDurationFrames,
    accentColor: isHighlighted ? accentColor : undefined,
  }, fps);
}
