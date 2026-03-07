import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { LowerThirdContent, StyleConfig } from '../types';
import { getFontFamily } from '../styles/fonts';

export interface LowerThirdSceneProps {
  content: LowerThirdContent;
  style: StyleConfig;
}

export const LowerThirdScene: React.FC<LowerThirdSceneProps> = ({ content, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const SLIDE_IN = 14;
  const HOLD_START = 14;
  const SLIDE_OUT = durationInFrames - 14;

  // Slide in from left, slide out to left
  const x = frame < HOLD_START
    ? interpolate(frame, [0, SLIDE_IN], [-400, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        easing: Easing.out(Easing.cubic),
      })
    : frame > SLIDE_OUT
    ? interpolate(frame, [SLIDE_OUT, durationInFrames], [0, -400], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        easing: Easing.in(Easing.cubic),
      })
    : 0;

  const opacity = frame < SLIDE_IN
    ? interpolate(frame, [0, 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : frame > SLIDE_OUT
    ? interpolate(frame, [SLIDE_OUT, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 1;

  const accentColor = content.accent || style.accent_color;

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        padding: '0 60px 80px 60px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateX(${x}px)`,
          display: 'flex',
          alignItems: 'stretch',
        }}
      >
        {/* Left accent bar */}
        <div
          style={{
            width: 5,
            backgroundColor: accentColor,
            borderRadius: '3px 0 0 3px',
            boxShadow: `0 0 12px ${accentColor}80`,
          }}
        />

        {/* Text block */}
        <div
          style={{
            backgroundColor: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(8px)',
            padding: '14px 24px',
            borderRadius: '0 8px 8px 0',
          }}
        >
          <div
            style={{
              fontFamily: getFontFamily(style.font_heading),
              fontSize: 32,
              fontWeight: 700,
              color: style.primary_color,
              lineHeight: 1.2,
            }}
          >
            {content.name}
          </div>
          <div
            style={{
              fontFamily: getFontFamily(style.font_body),
              fontSize: 22,
              fontWeight: 400,
              color: accentColor,
              lineHeight: 1.3,
              marginTop: 4,
            }}
          >
            {content.title}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default LowerThirdScene;
