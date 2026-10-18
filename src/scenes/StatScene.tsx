import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { StatContent, StyleConfig } from '../types';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { getFontFamily } from '../styles/fonts';
import { countUp, formatCountValue, fadeIn, pulseGlow, bounceEasing } from '../animations';

export interface StatSceneProps {
  content: StatContent;
  style: StyleConfig;
}

export const StatScene: React.FC<StatSceneProps> = ({ content, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const isVertical = height > width;

  const countDuration = Math.round(durationInFrames * 0.6);
  const from = content.animate_from ?? 0;

  const currentValue = countUp(frame, {
    from,
    to: content.value,
    durationInFrames: countDuration,
    delay: 8,
    easing: Easing.out(Easing.cubic),
    decimals: Number.isInteger(content.value) ? 0 : 1,
  });

  const labelOpacity = fadeIn(frame, { durationInFrames: 20, delay: 5 });
  const contextOpacity = fadeIn(frame, { durationInFrames: 20, delay: countDuration + 8 });
  const supportingOpacity = fadeIn(frame, { durationInFrames: 20, delay: countDuration + 20 });

  // Bounce at end of count
  const bounceProg = interpolate(
    frame,
    [countDuration + 8, countDuration + 20],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const bounceScale = 1 + 0.08 * bounceEasing(bounceProg) - 0.08 * Math.max(0, bounceProg - 0.8) * 5;

  const glow = pulseGlow(frame, {
    color: style.accent_color,
    cycleDuration: 50,
    minBlur: 20,
    maxBlur: 60,
    minOpacity: 0.2,
    maxOpacity: 0.7,
  });

  const bgColors = style.background_type === 'gradient'
    ? style.background_value.match(/#[a-fA-F0-9]{6}/g) || ['#0a0a0a', '#111']
    : [style.background_value, style.background_value];

  const statFontSize = isVertical ? 160 : 120;
  const labelFontSize = isVertical ? 44 : 36;
  const contextFontSize = isVertical ? 32 : 26;

  const formatted = formatCountValue(currentValue, {
    prefix: content.prefix,
    suffix: content.suffix,
  });

  return (
    <AbsoluteFill>
      <BackgroundGradient colors={bgColors}>
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
          {/* Label above number */}
          <div style={{ opacity: labelOpacity, marginBottom: 16 }}>
            <p
              style={{
                fontFamily: getFontFamily(style.font_body),
                fontSize: labelFontSize,
                fontWeight: 600,
                color: style.secondary_color,
                margin: 0,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              {content.label}
            </p>
          </div>

          {/* The big number */}
          <div
            style={{
              transform: `scale(${bounceScale})`,
              textShadow: glow.textShadow,
            }}
          >
            <span
              style={{
                fontFamily: getFontFamily(style.font_heading),
                fontSize: statFontSize,
                fontWeight: 900,
                color: style.accent_color,
                lineHeight: 1,
                letterSpacing: '-0.03em',
                display: 'block',
              }}
            >
              {formatted}
            </span>
          </div>

          {/* Context (e.g. "in 90 days") */}
          {content.context && (
            <div style={{ opacity: contextOpacity, marginTop: 12 }}>
              <p
                style={{
                  fontFamily: getFontFamily(style.font_body),
                  fontSize: contextFontSize,
                  fontWeight: 500,
                  color: style.secondary_color,
                  margin: 0,
                }}
              >
                {content.context}
              </p>
            </div>
          )}

          {/* Accent divider line */}
          <div
            style={{
              width: interpolate(frame, [countDuration, countDuration + 20], [0, 200], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
                easing: Easing.out(Easing.cubic),
              }),
              height: 3,
              backgroundColor: style.accent_color,
              marginTop: 20,
              marginBottom: content.supporting_text ? 20 : 0,
              borderRadius: 2,
              boxShadow: glow.boxShadow,
            }}
          />

          {/* Supporting text */}
          {content.supporting_text && (
            <div style={{ opacity: supportingOpacity }}>
              <p
                style={{
                  fontFamily: getFontFamily(style.font_body),
                  fontSize: contextFontSize,
                  fontWeight: 400,
                  color: style.secondary_color,
                  margin: 0,
                  maxWidth: 600,
                  lineHeight: 1.5,
                }}
              >
                {content.supporting_text}
              </p>
            </div>
          )}
        </AbsoluteFill>
      </BackgroundGradient>
    </AbsoluteFill>
  );
};

export default StatScene;
