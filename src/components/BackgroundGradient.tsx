import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, AbsoluteFill } from 'remotion';

export interface BackgroundGradientProps {
  colors: string[];
  angle?: number;
  type?: 'linear' | 'radial';
  animated?: boolean;
  animationSpeed?: number;
  overlay?: boolean;
  overlayOpacity?: number;
  children?: React.ReactNode;
}

export const BackgroundGradient: React.FC<BackgroundGradientProps> = ({
  colors,
  angle = 135,
  type = 'linear',
  animated = false,
  animationSpeed = 0.5,
  overlay = false,
  overlayOpacity = 0.3,
  children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  let gradientAngle = angle;

  if (animated) {
    gradientAngle = interpolate(
      frame,
      [0, durationInFrames],
      [angle, angle + 360 * animationSpeed],
      { extrapolateRight: 'extend' }
    );
  }

  const stops = colors
    .map((color, i) => {
      const position = Math.round((i / (colors.length - 1)) * 100);
      return `${color} ${position}%`;
    })
    .join(', ');

  const gradient = type === 'radial'
    ? `radial-gradient(circle at center, ${stops})`
    : `linear-gradient(${gradientAngle}deg, ${stops})`;

  return (
    <AbsoluteFill style={{ background: gradient }}>
      {overlay && (
        <AbsoluteFill
          style={{
            background: `rgba(0, 0, 0, ${overlayOpacity})`,
          }}
        />
      )}
      {children}
    </AbsoluteFill>
  );
};

// Preset gradients
export const GradientPresets = {
  sunset: ['#ff7e5f', '#feb47b'],
  ocean: ['#0077b6', '#00b4d8', '#90e0ef'],
  forest: ['#134e5e', '#71b280'],
  midnight: ['#0a0a0a', '#1a1a2e', '#0a0a0a'],
  neon: ['#0a0a0a', '#1a0a2e', '#0a1a1a'],
  aurora: ['#00c9ff', '#92fe9d'],
  fire: ['#ff416c', '#ff4b2b'],
  purple: ['#667eea', '#764ba2'],
  dark: ['#0f0c29', '#302b63', '#24243e'],
};

export default BackgroundGradient;
