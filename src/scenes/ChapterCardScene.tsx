import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { ChapterCardContent, StyleConfig } from '../types';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { getFontFamily } from '../styles/fonts';
import { slideIn, fadeIn } from '../animations';

export interface ChapterCardSceneProps {
  content: ChapterCardContent;
  style: StyleConfig;
}

export const ChapterCardScene: React.FC<ChapterCardSceneProps> = ({ content, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  // Chapter number slides in from left
  const numAnim = slideIn(frame, { durationInFrames: 18, delay: 0, direction: 'left', distance: 120 });
  // Title slides in from right, slightly delayed
  const titleAnim = slideIn(frame, { durationInFrames: 20, delay: 8, direction: 'right', distance: 80 });
  const subtitleOpacity = fadeIn(frame, { durationInFrames: 20, delay: 20 });

  // Bar grows across screen
  const barWidth = interpolate(frame, [0, 22], [0, 100], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const bgColors = style.background_type === 'gradient'
    ? style.background_value.match(/#[a-fA-F0-9]{6}/g) || ['#0f0f0f', '#1a1a1a']
    : [style.background_value, style.background_value];

  const chapterLabel = content.total_chapters
    ? `CHAPTER ${content.number} / ${content.total_chapters}`
    : `CHAPTER ${content.number}`;

  return (
    <AbsoluteFill>
      <BackgroundGradient colors={bgColors}>
        {/* Left accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 8,
            height: '100%',
            backgroundColor: style.accent_color,
            boxShadow: `0 0 30px ${style.accent_color}80`,
          }}
        />

        {/* Growing horizontal progress bar at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 8,
            width: `${barWidth}%`,
            height: 4,
            backgroundColor: style.accent_color,
            opacity: 0.6,
          }}
        />

        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 80px',
          }}
        >
          {/* Chapter label */}
          <div
            style={{
              opacity: numAnim.opacity,
              transform: `translateX(${numAnim.x}px)`,
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontFamily: getFontFamily(style.font_body),
                fontSize: 22,
                fontWeight: 700,
                color: style.accent_color,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              {chapterLabel}
            </span>
          </div>

          {/* Big chapter number */}
          <div
            style={{
              opacity: numAnim.opacity,
              transform: `translateX(${numAnim.x}px)`,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontFamily: getFontFamily(style.font_heading),
                fontSize: 140,
                fontWeight: 900,
                color: `${style.accent_color}20`,
                lineHeight: 0.9,
                letterSpacing: '-0.04em',
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-60%)',
                right: 80,
                userSelect: 'none',
              }}
            >
              {String(content.number).padStart(2, '0')}
            </span>
          </div>

          {/* Chapter title */}
          <div
            style={{
              opacity: titleAnim.opacity,
              transform: `translateX(${titleAnim.x}px)`,
            }}
          >
            <h2
              style={{
                fontFamily: getFontFamily(style.font_heading),
                fontSize: 72,
                fontWeight: 800,
                color: style.primary_color,
                margin: 0,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                maxWidth: '70%',
              }}
            >
              {content.title}
            </h2>
          </div>

          {/* Subtitle */}
          {content.subtitle && (
            <div style={{ opacity: subtitleOpacity, marginTop: 20 }}>
              <p
                style={{
                  fontFamily: getFontFamily(style.font_body),
                  fontSize: 30,
                  fontWeight: 400,
                  color: style.secondary_color,
                  margin: 0,
                  lineHeight: 1.5,
                  maxWidth: '60%',
                }}
              >
                {content.subtitle}
              </p>
            </div>
          )}
        </AbsoluteFill>
      </BackgroundGradient>
    </AbsoluteFill>
  );
};

export default ChapterCardScene;
