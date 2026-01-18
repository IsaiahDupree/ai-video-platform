import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { fadeIn } from '../animations';
import { getFontFamily } from '../styles/fonts';

export interface TextBlockProps {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  maxWidth?: number;
  lineHeight?: number;
  letterSpacing?: number;
  animationType?: 'none' | 'fade' | 'slide' | 'typewriter';
  animationDelay?: number;
  animationDuration?: number;
  style?: React.CSSProperties;
}

export const TextBlock: React.FC<TextBlockProps> = ({
  text,
  fontSize = 48,
  fontFamily = 'Inter',
  fontWeight = 600,
  color = '#ffffff',
  align = 'center',
  maxWidth,
  lineHeight = 1.4,
  letterSpacing = -0.02,
  animationType = 'fade',
  animationDelay = 0,
  animationDuration = 15,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let opacity = 1;
  let transform = 'none';

  if (animationType === 'fade') {
    opacity = fadeIn(frame, {
      durationInFrames: animationDuration,
      delay: animationDelay,
    });
  } else if (animationType === 'slide') {
    opacity = fadeIn(frame, {
      durationInFrames: animationDuration,
      delay: animationDelay,
    });
    const translateY = interpolate(
      frame,
      [animationDelay, animationDelay + animationDuration],
      [30, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
    transform = `translateY(${translateY}px)`;
  }

  return (
    <div
      style={{
        fontFamily: getFontFamily(fontFamily),
        fontSize,
        fontWeight,
        color,
        textAlign: align,
        maxWidth,
        lineHeight,
        letterSpacing: `${letterSpacing}em`,
        opacity,
        transform,
        ...style,
      }}
    >
      {text}
    </div>
  );
};

export default TextBlock;
