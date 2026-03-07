import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, Img, staticFile } from 'remotion';
import { EndScreenContent, StyleConfig } from '../types';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { getFontFamily } from '../styles/fonts';
import { fadeIn, bounceIn, pulseGlow } from '../animations';

export interface EndScreenSceneProps {
  content: EndScreenContent;
  style: StyleConfig;
}

export const EndScreenScene: React.FC<EndScreenSceneProps> = ({ content, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  const bgAnim = fadeIn(frame, { durationInFrames: 20, delay: 0 });
  const subscribeBounce = bounceIn(frame, { durationInFrames: 25, delay: 10 });
  const nextVideoAnim = bounceIn(frame, { durationInFrames: 25, delay: 18 });
  const channelAnim = fadeIn(frame, { durationInFrames: 20, delay: 25 });

  // Subscribe button pulses
  const glow = pulseGlow(frame, {
    color: '#ff0000',
    cycleDuration: 40,
    minBlur: 10,
    maxBlur: 30,
    minOpacity: 0.4,
    maxOpacity: 0.9,
  });

  const bgColors = style.background_type === 'gradient'
    ? style.background_value.match(/#[a-fA-F0-9]{6}/g) || ['#0a0a0a', '#111']
    : [style.background_value, style.background_value];

  return (
    <AbsoluteFill style={{ opacity: bgAnim }}>
      <BackgroundGradient colors={bgColors}>
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 60,
            gap: 40,
          }}
        >
          {/* Channel name */}
          {content.channel_name && (
            <div style={{ opacity: channelAnim, textAlign: 'center' }}>
              <p
                style={{
                  fontFamily: getFontFamily(style.font_body),
                  fontSize: 26,
                  fontWeight: 500,
                  color: style.secondary_color,
                  margin: 0,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {content.channel_name}
              </p>
            </div>
          )}

          {/* Subscribe button */}
          <div
            style={{
              opacity: subscribeBounce.opacity,
              transform: `scale(${subscribeBounce.scale}) translateY(${subscribeBounce.y}px)`,
            }}
          >
            <div
              style={{
                backgroundColor: '#ff0000',
                borderRadius: 50,
                padding: '22px 56px',
                boxShadow: glow.boxShadow,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              {/* Bell icon */}
              <span style={{ fontSize: 32 }}>🔔</span>
              <span
                style={{
                  fontFamily: getFontFamily(style.font_heading),
                  fontSize: 36,
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.01em',
                }}
              >
                {content.subscribe_text || 'SUBSCRIBE'}
              </span>
            </div>
          </div>

          {/* Next video card */}
          {content.next_video_title && (
            <div
              style={{
                opacity: nextVideoAnim.opacity,
                transform: `scale(${nextVideoAnim.scale}) translateY(${nextVideoAnim.y}px)`,
                backgroundColor: `${style.accent_color}15`,
                border: `2px solid ${style.accent_color}40`,
                borderRadius: 16,
                padding: '24px 40px',
                textAlign: 'center',
                maxWidth: 600,
              }}
            >
              <p
                style={{
                  fontFamily: getFontFamily(style.font_body),
                  fontSize: 22,
                  fontWeight: 500,
                  color: style.secondary_color,
                  margin: '0 0 8px 0',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                WATCH NEXT
              </p>
              <p
                style={{
                  fontFamily: getFontFamily(style.font_heading),
                  fontSize: 30,
                  fontWeight: 700,
                  color: style.primary_color,
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {content.next_video_title}
              </p>
              {/* Arrow */}
              <div style={{ fontSize: 32, marginTop: 8 }}>▶</div>
            </div>
          )}
        </AbsoluteFill>
      </BackgroundGradient>
    </AbsoluteFill>
  );
};

export default EndScreenScene;
