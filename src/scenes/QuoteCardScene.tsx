import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, staticFile } from 'remotion';
import { QuoteCardContent, StyleConfig } from '../types';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { getFontFamily } from '../styles/fonts';
import { slideIn, fadeIn, typewriter, stagger } from '../animations';

export interface QuoteCardSceneProps {
  content: QuoteCardContent;
  style: StyleConfig;
}

const platformAccent: Record<string, string> = {
  twitter: '#1da1f2',
  linkedin: '#0077b5',
  threads: '#000000',
};

export const QuoteCardScene: React.FC<QuoteCardSceneProps> = ({ content, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const isVertical = height > width;

  const platform = content.platform || 'twitter';
  const accentColor = platformAccent[platform] || style.accent_color;

  // Card drops in from top
  const cardSlide = slideIn(frame, { durationInFrames: 20, delay: 0, direction: 'up', distance: 60 });
  const metaOpacity = fadeIn(frame, { durationInFrames: 18, delay: 25 });
  const engagementOpacity = fadeIn(frame, { durationInFrames: 18, delay: 35 });

  // Quote types out
  const { visibleText } = typewriter(frame, {
    text: content.quote,
    durationInFrames: Math.min(60, durationInFrames * 0.5),
    delay: 12,
    showCursor: true,
  });

  const bgColors = style.background_type === 'gradient'
    ? style.background_value.match(/#[a-fA-F0-9]{6}/g) || ['#0f0f0f', '#1a1a2e']
    : [style.background_value, style.background_value];

  const cardMaxWidth = isVertical ? '90%' : 720;
  const quoteFontSize = isVertical ? 38 : 30;
  const metaFontSize = isVertical ? 26 : 20;

  // Twitter-style icon symbols
  const icons: Record<string, string> = {
    twitter: '𝕏',
    linkedin: 'in',
    threads: '@',
  };

  return (
    <AbsoluteFill>
      <BackgroundGradient colors={bgColors}>
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isVertical ? 40 : 80,
          }}
        >
          <div
            style={{
              opacity: cardSlide.opacity,
              transform: `translateY(${cardSlide.y}px)`,
              backgroundColor: '#1a1a1a',
              border: `1px solid ${accentColor}30`,
              borderRadius: 20,
              padding: isVertical ? '40px 36px' : '48px 52px',
              maxWidth: cardMaxWidth,
              width: '100%',
              boxShadow: `0 24px 80px rgba(0,0,0,0.6)`,
            }}
          >
            {/* Platform header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginBottom: 24,
                opacity: metaOpacity,
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: isVertical ? 56 : 48,
                  height: isVertical ? 56 : 48,
                  borderRadius: '50%',
                  backgroundColor: accentColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {content.author_avatar ? (
                  <Img
                    src={content.author_avatar.startsWith('http') ? content.author_avatar : staticFile(content.author_avatar)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontFamily: getFontFamily(style.font_heading), fontSize: isVertical ? 24 : 20, fontWeight: 700, color: '#fff' }}>
                    {content.author_name.charAt(0)}
                  </span>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: getFontFamily(style.font_heading), fontSize: metaFontSize, fontWeight: 700, color: '#fff', margin: 0 }}>
                  {content.author_name}
                </p>
                {content.author_handle && (
                  <p style={{ fontFamily: getFontFamily(style.font_body), fontSize: metaFontSize - 4, color: '#6b7280', margin: '2px 0 0 0' }}>
                    {content.author_handle}
                  </p>
                )}
              </div>

              {/* Platform badge */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: accentColor,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontFamily: getFontFamily(style.font_body), fontSize: 18, fontWeight: 700, color: '#fff' }}>
                  {icons[platform] || '✓'}
                </span>
              </div>
            </div>

            {/* Quote text */}
            <p
              style={{
                fontFamily: getFontFamily(style.font_body),
                fontSize: quoteFontSize,
                fontWeight: 400,
                color: '#e5e7eb',
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {visibleText}
              <span style={{ opacity: 0.5 }}>|</span>
            </p>

            {/* Engagement metrics */}
            {(content.likes || content.retweets) && (
              <div
                style={{
                  opacity: engagementOpacity,
                  marginTop: 24,
                  paddingTop: 20,
                  borderTop: '1px solid #374151',
                  display: 'flex',
                  gap: 32,
                }}
              >
                {content.retweets && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 22, color: '#6b7280' }}>🔁</span>
                    <span style={{ fontFamily: getFontFamily(style.font_body), fontSize: metaFontSize, color: '#9ca3af', fontWeight: 600 }}>
                      {content.retweets}
                    </span>
                  </div>
                )}
                {content.likes && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 22, color: '#6b7280' }}>♥</span>
                    <span style={{ fontFamily: getFontFamily(style.font_body), fontSize: metaFontSize, color: '#9ca3af', fontWeight: 600 }}>
                      {content.likes}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </AbsoluteFill>
      </BackgroundGradient>
    </AbsoluteFill>
  );
};

export default QuoteCardScene;
