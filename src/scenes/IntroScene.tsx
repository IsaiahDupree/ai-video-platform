import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Img,
  staticFile,
} from 'remotion';
import { IntroContent, StyleConfig } from '../types';
import { TextBlock } from '../components/TextBlock';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { IconBadge } from '../components/IconBadge';
import { fadeIn } from '../animations';
import { getFontFamily } from '../styles/fonts';

export interface IntroSceneProps {
  content: IntroContent;
  style: StyleConfig;
}

export const IntroScene: React.FC<IntroSceneProps> = ({ content, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const titleOpacity = fadeIn(frame, { durationInFrames: 20, delay: 10 });
  const subtitleOpacity = fadeIn(frame, { durationInFrames: 20, delay: 25 });
  const hookOpacity = fadeIn(frame, { durationInFrames: 20, delay: 40 });

  const titleScale = interpolate(
    frame,
    [10, 30],
    [0.9, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const backgroundColors = style.background_type === 'gradient'
    ? style.background_value.match(/#[a-fA-F0-9]{6}/g) || ['#0a0a0a', '#1a1a2e']
    : [style.background_value, style.background_value];

  return (
    <AbsoluteFill>
      <BackgroundGradient colors={backgroundColors} animated>
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 60,
          }}
        >
          {content.logo_path && (
            <div
              style={{
                marginBottom: 40,
                opacity: fadeIn(frame, { durationInFrames: 15, delay: 0 }),
              }}
            >
              <Img
                src={content.logo_path.startsWith('http') ? content.logo_path : staticFile(content.logo_path)}
                style={{ height: 80, objectFit: 'contain' }}
              />
            </div>
          )}

          <div
            style={{
              opacity: titleOpacity,
              transform: `scale(${titleScale})`,
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontFamily: getFontFamily(style.font_heading),
                fontSize: 96,
                fontWeight: 800,
                color: style.primary_color,
                margin: 0,
                lineHeight: 1.1,
                textShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
              }}
            >
              {content.title}
            </h1>
          </div>

          {content.subtitle && (
            <div
              style={{
                opacity: subtitleOpacity,
                marginTop: 30,
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontFamily: getFontFamily(style.font_body),
                  fontSize: 36,
                  fontWeight: 500,
                  color: style.secondary_color,
                  margin: 0,
                }}
              >
                {content.subtitle}
              </p>
            </div>
          )}

          {content.hook_text && (
            <div
              style={{
                opacity: hookOpacity,
                marginTop: 50,
                padding: '20px 40px',
                backgroundColor: `${style.accent_color}20`,
                borderRadius: 16,
                borderLeft: `4px solid ${style.accent_color}`,
              }}
            >
              <p
                style={{
                  fontFamily: getFontFamily(style.font_body),
                  fontSize: 28,
                  fontWeight: 600,
                  color: style.accent_color,
                  margin: 0,
                }}
              >
                {content.hook_text}
              </p>
            </div>
          )}
        </AbsoluteFill>
      </BackgroundGradient>
    </AbsoluteFill>
  );
};

export default IntroScene;
