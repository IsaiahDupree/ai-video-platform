import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { StyleConfig } from '../types';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { getFontFamily } from '../styles/fonts';
import { pulseGlow } from '../animations';

// Content type for CountdownScene
export interface CountdownContent {
  type: 'countdown';
  from?: number;     // default 3
  label?: string;    // e.g. "things I wish I knew sooner"
  pre_text?: string; // e.g. "WAIT..."
  colors?: string[]; // accent color per number
}

export interface CountdownSceneProps {
  content: CountdownContent;
  style: StyleConfig;
}

export const CountdownScene: React.FC<CountdownSceneProps> = ({ content, style }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const isVertical = height > width;

  const countFrom = content.from ?? 3;
  const framesPerCount = Math.floor(durationInFrames / (countFrom + (content.label ? 1 : 0)));
  const currentCount = countFrom - Math.floor(frame / framesPerCount);
  const frameInCount = frame % framesPerCount;

  // Flash colors cycle per number
  const defaultColors = ['#ef4444', '#f59e0b', '#22c55e'];
  const colors = content.colors ?? defaultColors;
  const currentColor = currentCount > 0
    ? (colors[(countFrom - currentCount) % colors.length] || style.accent_color)
    : style.accent_color;

  // Scale: punch in hard, drift slightly larger
  const stampProgress = interpolate(frameInCount, [0, 6, 12], [1.8, 0.9, 1.0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(2)),
  });

  // Exit: scale out + fade
  const exitOpacity = interpolate(frameInCount, [framesPerCount - 6, framesPerCount], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const entryOpacity = interpolate(frameInCount, [0, 3], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const glow = pulseGlow(frame, {
    color: currentColor,
    cycleDuration: framesPerCount,
    minBlur: 30,
    maxBlur: 90,
    minOpacity: 0.5,
    maxOpacity: 1.0,
  });

  // Ring expands outward on each count
  const ringScale = interpolate(frameInCount, [0, framesPerCount * 0.7], [0.3, 2.5], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const ringOpacity = interpolate(frameInCount, [0, framesPerCount * 0.3, framesPerCount * 0.7], [0.8, 0.4, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  const isLabel = currentCount <= 0 && content.label;
  const fontSize = isVertical ? 280 : 220;
  const labelSize = isVertical ? 52 : 40;

  const bgColors = style.background_type === 'gradient'
    ? style.background_value.match(/#[a-fA-F0-9]{6}/g) || ['#0a0a0a', '#111']
    : [style.background_value, style.background_value];

  return (
    <AbsoluteFill>
      <BackgroundGradient colors={bgColors}>
        {/* Expanding ring */}
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: isVertical ? 300 : 250,
              height: isVertical ? 300 : 250,
              borderRadius: '50%',
              border: `4px solid ${currentColor}`,
              transform: `scale(${ringScale})`,
              opacity: ringOpacity,
              boxShadow: `0 0 40px ${currentColor}60`,
            }}
          />
        </AbsoluteFill>

        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          {content.pre_text && currentCount === countFrom && frameInCount < framesPerCount * 0.3 && (
            <p
              style={{
                fontFamily: getFontFamily(style.font_body),
                fontSize: isVertical ? 40 : 32,
                fontWeight: 700,
                color: style.secondary_color,
                margin: '0 0 16px 0',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                opacity: interpolate(frameInCount, [0, 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
              }}
            >
              {content.pre_text}
            </p>
          )}

          <div
            style={{
              opacity: entryOpacity * exitOpacity,
              transform: `scale(${stampProgress})`,
              textShadow: glow.textShadow,
            }}
          >
            {isLabel ? (
              <p
                style={{
                  fontFamily: getFontFamily(style.font_heading),
                  fontSize: labelSize,
                  fontWeight: 900,
                  color: style.primary_color,
                  margin: 0,
                  lineHeight: 1.2,
                  padding: '0 40px',
                }}
              >
                {content.label}
              </p>
            ) : (
              <span
                style={{
                  fontFamily: getFontFamily(style.font_heading),
                  fontSize,
                  fontWeight: 900,
                  color: currentColor,
                  lineHeight: 1,
                  display: 'block',
                }}
              >
                {Math.max(1, currentCount)}
              </span>
            )}
          </div>
        </AbsoluteFill>
      </BackgroundGradient>
    </AbsoluteFill>
  );
};

export default CountdownScene;
