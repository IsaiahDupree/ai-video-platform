import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { CompareContent, StyleConfig } from '../types';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { getFontFamily } from '../styles/fonts';
import { fadeIn, slideIn, stagger } from '../animations';

export interface CompareSceneProps {
  content: CompareContent;
  style: StyleConfig;
}

export const CompareScene: React.FC<CompareSceneProps> = ({ content, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const isVertical = height > width;

  // Labels slide in from their respective sides
  const leftLabel = slideIn(frame, { durationInFrames: 20, delay: 0, direction: 'left', distance: 100 });
  const rightLabel = slideIn(frame, { durationInFrames: 20, delay: 6, direction: 'right', distance: 100 });

  // Divider wipes from center
  const dividerProgress = interpolate(frame, [8, 28], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const bgColors = style.background_type === 'gradient'
    ? style.background_value.match(/#[a-fA-F0-9]{6}/g) || ['#0a0a0a', '#111']
    : [style.background_value, style.background_value];

  const headingSize = isVertical ? 40 : 32;
  const pointSize = isVertical ? 28 : 22;
  const labelSize = isVertical ? 22 : 18;

  const GOOD_COLOR = '#22c55e';
  const BAD_COLOR = '#ef4444';

  const renderPoints = (points: string[], side: 'left' | 'right', color: string) =>
    points.map((point, i) => {
      const anim = stagger(frame, {
        index: i,
        total: points.length,
        durationInFrames: 20,
        delay: 30,
        staggerFrames: 10,
        animation: side === 'left' ? 'slide_left' : 'slide_left',
      });
      return (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            marginBottom: 16,
            opacity: anim.opacity,
            transform: side === 'left'
              ? `translateX(${anim.x}px)`
              : `translateX(${-anim.x}px)`,
          }}
        >
          <span style={{ fontSize: pointSize, color, flexShrink: 0, marginTop: 2 }}>
            {side === 'right' ? '✓' : '✗'}
          </span>
          <p
            style={{
              fontFamily: getFontFamily(style.font_body),
              fontSize: pointSize,
              color: style.secondary_color,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {point}
          </p>
        </div>
      );
    });

  if (isVertical) {
    // Vertical: stack top/bottom
    return (
      <AbsoluteFill>
        <BackgroundGradient colors={bgColors}>
          <AbsoluteFill style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Left (before) — top half */}
            <div
              style={{
                flex: 1,
                padding: '60px 50px 30px',
                borderBottom: `3px solid ${style.accent_color}`,
                opacity: leftLabel.opacity,
                transform: `translateX(${leftLabel.x}px)`,
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: `${BAD_COLOR}20`,
                  border: `1px solid ${BAD_COLOR}60`,
                  borderRadius: 8,
                  padding: '6px 18px',
                  marginBottom: 20,
                }}
              >
                <span style={{ fontFamily: getFontFamily(style.font_body), fontSize: labelSize, fontWeight: 700, color: BAD_COLOR, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {content.left_label}
                </span>
              </div>
              {renderPoints(content.left_points, 'left', BAD_COLOR)}
            </div>

            {/* Right (after) — bottom half */}
            <div
              style={{
                flex: 1,
                padding: '30px 50px 60px',
                opacity: rightLabel.opacity,
                transform: `translateX(${rightLabel.x}px)`,
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: `${GOOD_COLOR}20`,
                  border: `1px solid ${GOOD_COLOR}60`,
                  borderRadius: 8,
                  padding: '6px 18px',
                  marginBottom: 20,
                }}
              >
                <span style={{ fontFamily: getFontFamily(style.font_body), fontSize: labelSize, fontWeight: 700, color: GOOD_COLOR, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {content.right_label}
                </span>
              </div>
              {renderPoints(content.right_points, 'right', GOOD_COLOR)}
            </div>
          </AbsoluteFill>
        </BackgroundGradient>
      </AbsoluteFill>
    );
  }

  // Landscape: left/right split
  return (
    <AbsoluteFill>
      <BackgroundGradient colors={bgColors}>
        <AbsoluteFill style={{ display: 'flex', flexDirection: 'row' }}>
          {/* Left panel */}
          <div
            style={{
              flex: 1,
              padding: '80px 60px',
              opacity: leftLabel.opacity,
              transform: `translateX(${leftLabel.x}px)`,
            }}
          >
            <div
              style={{
                display: 'inline-block',
                backgroundColor: `${BAD_COLOR}20`,
                border: `1px solid ${BAD_COLOR}60`,
                borderRadius: 8,
                padding: '8px 20px',
                marginBottom: 30,
              }}
            >
              <span style={{ fontFamily: getFontFamily(style.font_body), fontSize: labelSize, fontWeight: 700, color: BAD_COLOR, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {content.left_label}
              </span>
            </div>
            {renderPoints(content.left_points, 'left', BAD_COLOR)}
          </div>

          {/* Divider */}
          <div
            style={{
              width: 3,
              backgroundColor: style.accent_color,
              opacity: dividerProgress,
              boxShadow: `0 0 20px ${style.accent_color}60`,
              transform: `scaleY(${dividerProgress})`,
              transformOrigin: 'center',
            }}
          />

          {/* Right panel */}
          <div
            style={{
              flex: 1,
              padding: '80px 60px',
              opacity: rightLabel.opacity,
              transform: `translateX(${rightLabel.x}px)`,
            }}
          >
            <div
              style={{
                display: 'inline-block',
                backgroundColor: `${GOOD_COLOR}20`,
                border: `1px solid ${GOOD_COLOR}60`,
                borderRadius: 8,
                padding: '8px 20px',
                marginBottom: 30,
              }}
            >
              <span style={{ fontFamily: getFontFamily(style.font_body), fontSize: labelSize, fontWeight: 700, color: GOOD_COLOR, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {content.right_label}
              </span>
            </div>
            {renderPoints(content.right_points, 'right', GOOD_COLOR)}
          </div>
        </AbsoluteFill>
      </BackgroundGradient>
    </AbsoluteFill>
  );
};

export default CompareScene;
