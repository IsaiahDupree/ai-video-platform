import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { HookContent, StyleConfig } from '../types';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { getFontFamily } from '../styles/fonts';
import { glitchReveal, pulseGlow, staticGlow } from '../animations';

export interface HookSceneProps {
  content: HookContent;
  style: StyleConfig;
}

export const HookScene: React.FC<HookSceneProps> = ({ content, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const hookStyle = content.style || 'stamp';

  // Stamp-in: scale 1.5 → 1.0 in first 10 frames (hard punch)
  const stampScale = interpolate(frame, [0, 10, 14], [1.5, 0.92, 1.0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(2)),
  });
  const stampOpacity = interpolate(frame, [0, 4], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Glitch on frame 0-6
  const glitch = hookStyle === 'glitch' ? glitchReveal(frame, 8, 0.7) : null;

  // Subtext slides up after main text
  const subtextOpacity = interpolate(frame, [16, 26], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const subtextY = interpolate(frame, [16, 26], [20, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Pulse glow on accent
  const glow = pulseGlow(frame, { color: style.accent_color, cycleDuration: 40, minBlur: 15, maxBlur: 50 });

  const bgColors = style.background_type === 'gradient'
    ? style.background_value.match(/#[a-fA-F0-9]{6}/g) || ['#0a0a0a', '#111']
    : [style.background_value, style.background_value];

  const fontSize = isVertical ? 96 : 80;
  const subtextSize = isVertical ? 36 : 28;

  // Question-style: add big "?" with accent color
  const isQuestion = content.text.endsWith('?');
  const isStatStyle = hookStyle === 'stat';

  return (
    <AbsoluteFill>
      <BackgroundGradient colors={bgColors} animated={false}>
        {/* Accent bar — top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            backgroundColor: style.accent_color,
            boxShadow: glow.boxShadow,
          }}
        />

        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isVertical ? 60 : 80,
            textAlign: 'center',
          }}
        >
          {/* Emoji if provided */}
          {content.emoji && (
            <div
              style={{
                fontSize: isVertical ? 80 : 64,
                marginBottom: 20,
                opacity: stampOpacity,
                transform: `scale(${stampScale})`,
              }}
            >
              {content.emoji}
            </div>
          )}

          {/* Main hook text */}
          <div
            style={{
              opacity: stampOpacity,
              transform: glitch
                ? `scale(${stampScale}) ${glitch.transform}`
                : `scale(${stampScale})`,
              textShadow: glitch ? glitch.textShadow : undefined,
            }}
          >
            <h1
              style={{
                fontFamily: getFontFamily(style.font_heading),
                fontSize,
                fontWeight: 900,
                color: style.primary_color,
                margin: 0,
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                // Stroke for legibility on any background
                WebkitTextStroke: `2px rgba(0,0,0,0.3)`,
                ...(isStatStyle ? { color: style.accent_color, ...staticGlow(style.accent_color, 30, 8) } : {}),
              }}
            >
              {content.text}
            </h1>
          </div>

          {/* Accent underline */}
          <div
            style={{
              width: interpolate(frame, [10, 25], [0, 120], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
                easing: Easing.out(Easing.cubic),
              }),
              height: 4,
              backgroundColor: style.accent_color,
              borderRadius: 2,
              marginTop: 16,
              boxShadow: glow.boxShadow,
            }}
          />

          {/* Subtext */}
          {content.subtext && (
            <div
              style={{
                opacity: subtextOpacity,
                transform: `translateY(${subtextY}px)`,
                marginTop: 28,
                padding: '12px 28px',
                backgroundColor: `${style.accent_color}18`,
                borderRadius: 12,
                border: `1px solid ${style.accent_color}40`,
              }}
            >
              <p
                style={{
                  fontFamily: getFontFamily(style.font_body),
                  fontSize: subtextSize,
                  fontWeight: 500,
                  color: style.secondary_color,
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {content.subtext}
              </p>
            </div>
          )}
        </AbsoluteFill>
      </BackgroundGradient>
    </AbsoluteFill>
  );
};

export default HookScene;
