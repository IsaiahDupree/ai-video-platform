import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { CTAContent, StyleConfig } from '../types';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { getFontFamily } from '../styles/fonts';
import { fadeIn, bounceIn, pulseGlow } from '../animations';

export interface CTASceneProps {
  content: CTAContent;
  style: StyleConfig;
}

// Platform-specific CTA configuration
const platformConfig: Record<string, { emoji: string; verb: string; color: string }> = {
  tiktok:    { emoji: '🎵', verb: 'Follow', color: '#fe2c55' },
  instagram: { emoji: '📸', verb: 'Follow', color: '#e1306c' },
  youtube:   { emoji: '▶', verb: 'Subscribe', color: '#ff0000' },
  linkedin:  { emoji: '💼', verb: 'Connect', color: '#0077b5' },
  twitter:   { emoji: '🐦', verb: 'Follow', color: '#1da1f2' },
  facebook:  { emoji: '👍', verb: 'Follow', color: '#1877f2' },
  threads:   { emoji: '🧵', verb: 'Follow', color: '#000000' },
};

export const CTAScene: React.FC<CTASceneProps> = ({ content, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const isVertical = height > width;

  const titleOpacity = fadeIn(frame, { durationInFrames: 18, delay: 0 });
  const buttonBounce = bounceIn(frame, { durationInFrames: 22, delay: 12 });
  const handleOpacity = fadeIn(frame, { durationInFrames: 18, delay: 22 });

  const platform = (content.platform || '').toLowerCase();
  const pConfig = platformConfig[platform];
  const ctaColor = pConfig?.color || style.accent_color;

  const glow = pulseGlow(frame, {
    color: ctaColor,
    cycleDuration: 35,
    minBlur: 15,
    maxBlur: 50,
    minOpacity: 0.4,
    maxOpacity: 0.95,
  });

  const bgColors = style.background_type === 'gradient'
    ? style.background_value.match(/#[a-fA-F0-9]{6}/g) || ['#0a0a0a', '#111']
    : [style.background_value, style.background_value];

  const titleSize = isVertical ? 64 : 52;
  const buttonTextSize = isVertical ? 38 : 32;
  const handleSize = isVertical ? 30 : 24;

  return (
    <AbsoluteFill>
      <BackgroundGradient colors={bgColors} animated>
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isVertical ? 60 : 80,
            textAlign: 'center',
            gap: 32,
          }}
        >
          {/* Title */}
          <div style={{ opacity: titleOpacity }}>
            <h2
              style={{
                fontFamily: getFontFamily(style.font_heading),
                fontSize: titleSize,
                fontWeight: 800,
                color: style.primary_color,
                margin: 0,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
              }}
            >
              {content.title}
            </h2>
          </div>

          {/* CTA Button */}
          <div
            style={{
              opacity: buttonBounce.opacity,
              transform: `scale(${buttonBounce.scale}) translateY(${buttonBounce.y}px)`,
            }}
          >
            <div
              style={{
                backgroundColor: ctaColor,
                borderRadius: 60,
                padding: isVertical ? '24px 64px' : '20px 56px',
                boxShadow: glow.boxShadow,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              {pConfig?.emoji && (
                <span style={{ fontSize: buttonTextSize }}>{pConfig.emoji}</span>
              )}
              <span
                style={{
                  fontFamily: getFontFamily(style.font_heading),
                  fontSize: buttonTextSize,
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.01em',
                }}
              >
                {content.action_text}
              </span>
            </div>
          </div>

          {/* Handle */}
          {content.handle && (
            <div style={{ opacity: handleOpacity }}>
              <p
                style={{
                  fontFamily: getFontFamily(style.font_body),
                  fontSize: handleSize,
                  fontWeight: 500,
                  color: style.secondary_color,
                  margin: 0,
                }}
              >
                {pConfig?.emoji} {content.handle}
              </p>
            </div>
          )}
        </AbsoluteFill>
      </BackgroundGradient>
    </AbsoluteFill>
  );
};

export default CTAScene;
