import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, staticFile } from 'remotion';
import { TestimonialContent, StyleConfig } from '../types';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { getFontFamily } from '../styles/fonts';
import { slideIn, fadeIn, typewriter, pulseGlow } from '../animations';

export interface TestimonialSceneProps {
  content: TestimonialContent;
  style: StyleConfig;
}

const StarRating: React.FC<{ rating: number; color: string; size: number }> = ({ rating, color, size }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <span key={i} style={{ fontSize: size, color: i <= rating ? '#fbbf24' : '#374151' }}>★</span>
    ))}
  </div>
);

export const TestimonialScene: React.FC<TestimonialSceneProps> = ({ content, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const isVertical = height > width;

  // Card slides up from bottom
  const cardAnim = slideIn(frame, { durationInFrames: 22, delay: 0, direction: 'down', distance: -80 });
  const quoteOpacity = fadeIn(frame, { durationInFrames: 25, delay: 12 });
  const authorOpacity = fadeIn(frame, { durationInFrames: 20, delay: 30 });
  const starsOpacity = fadeIn(frame, { durationInFrames: 15, delay: 8 });

  // Quote text typewriter
  const { visibleText } = typewriter(frame, {
    text: content.quote,
    durationInFrames: Math.min(durationInFrames * 0.6, 80),
    delay: 15,
    showCursor: false,
  });

  const glow = pulseGlow(frame, { color: style.accent_color, cycleDuration: 60 });

  const bgColors = style.background_type === 'gradient'
    ? style.background_value.match(/#[a-fA-F0-9]{6}/g) || ['#0a0a0a', '#111']
    : [style.background_value, style.background_value];

  const platformColors: Record<string, string> = {
    linkedin: '#0077b5',
    twitter: '#1da1f2',
    google: '#ea4335',
    none: style.accent_color,
  };
  const platformColor = platformColors[content.platform || 'none'] || style.accent_color;

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
              opacity: cardAnim.opacity,
              transform: `translateY(${cardAnim.y}px)`,
              backgroundColor: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${style.accent_color}30`,
              borderRadius: 24,
              padding: isVertical ? '48px 40px' : '56px 60px',
              maxWidth: isVertical ? '88%' : 800,
              width: '100%',
              boxShadow: `0 20px 60px rgba(0,0,0,0.4), ${glow.boxShadow}`,
            }}
          >
            {/* Stars */}
            {content.rating && (
              <div style={{ opacity: starsOpacity, marginBottom: 20 }}>
                <StarRating rating={content.rating} color="#fbbf24" size={isVertical ? 36 : 28} />
              </div>
            )}

            {/* Quote mark */}
            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: isVertical ? 120 : 96,
                color: style.accent_color,
                lineHeight: 0.8,
                marginBottom: 16,
                opacity: 0.6,
              }}
            >
              "
            </div>

            {/* Quote text */}
            <div style={{ opacity: quoteOpacity }}>
              <p
                style={{
                  fontFamily: getFontFamily(style.font_body),
                  fontSize: isVertical ? 34 : 28,
                  fontWeight: 500,
                  color: style.primary_color,
                  margin: 0,
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                }}
              >
                {visibleText}
              </p>
            </div>

            {/* Author row */}
            <div
              style={{
                opacity: authorOpacity,
                marginTop: 32,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: isVertical ? 64 : 52,
                  height: isVertical ? 64 : 52,
                  borderRadius: '50%',
                  backgroundColor: platformColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: `2px solid ${platformColor}50`,
                }}
              >
                {content.author_avatar ? (
                  <Img
                    src={content.author_avatar.startsWith('http') ? content.author_avatar : staticFile(content.author_avatar)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span
                    style={{
                      fontFamily: getFontFamily(style.font_heading),
                      fontSize: isVertical ? 28 : 22,
                      fontWeight: 700,
                      color: '#fff',
                    }}
                  >
                    {content.author_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Name + title */}
              <div>
                <p
                  style={{
                    fontFamily: getFontFamily(style.font_heading),
                    fontSize: isVertical ? 28 : 22,
                    fontWeight: 700,
                    color: style.primary_color,
                    margin: 0,
                  }}
                >
                  {content.author_name}
                </p>
                {content.author_title && (
                  <p
                    style={{
                      fontFamily: getFontFamily(style.font_body),
                      fontSize: isVertical ? 22 : 18,
                      fontWeight: 400,
                      color: platformColor,
                      margin: '2px 0 0 0',
                    }}
                  >
                    {content.author_title}
                  </p>
                )}
              </div>

              {/* Platform badge */}
              {content.platform && content.platform !== 'none' && (
                <div
                  style={{
                    marginLeft: 'auto',
                    backgroundColor: `${platformColor}20`,
                    border: `1px solid ${platformColor}60`,
                    borderRadius: 8,
                    padding: '6px 14px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: getFontFamily(style.font_body),
                      fontSize: 18,
                      fontWeight: 600,
                      color: platformColor,
                      textTransform: 'capitalize',
                    }}
                  >
                    {content.platform}
                  </span>
                </div>
              )}
            </div>
          </div>
        </AbsoluteFill>
      </BackgroundGradient>
    </AbsoluteFill>
  );
};

export default TestimonialScene;
