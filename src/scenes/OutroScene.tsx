import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Img,
  staticFile,
} from 'remotion';
import { OutroContent, StyleConfig } from '../types';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { fadeIn, bounceIn } from '../animations';
import { getFontFamily } from '../styles/fonts';

export interface OutroSceneProps {
  content: OutroContent;
  style: StyleConfig;
}

export const OutroScene: React.FC<OutroSceneProps> = ({ content, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const titleOpacity = fadeIn(frame, { durationInFrames: 20, delay: 5 });
  const ctaAnim = bounceIn(frame, { durationInFrames: 25, delay: 20 });
  const socialsOpacity = fadeIn(frame, { durationInFrames: 20, delay: 35 });

  const backgroundColors = style.background_type === 'gradient'
    ? style.background_value.match(/#[a-fA-F0-9]{6}/g) || ['#0a0a0a', '#1a1a2e']
    : [style.background_value, style.background_value];

  return (
    <AbsoluteFill>
      <BackgroundGradient colors={backgroundColors}>
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 80,
          }}
        >
          {content.logo_path && (
            <div
              style={{
                marginBottom: 50,
                opacity: fadeIn(frame, { durationInFrames: 15, delay: 0 }),
              }}
            >
              <Img
                src={content.logo_path.startsWith('http') ? content.logo_path : staticFile(content.logo_path)}
                style={{ height: 100, objectFit: 'contain' }}
              />
            </div>
          )}

          <div style={{ opacity: titleOpacity, textAlign: 'center' }}>
            <h2
              style={{
                fontFamily: getFontFamily(style.font_heading),
                fontSize: 80,
                fontWeight: 800,
                color: style.primary_color,
                margin: 0,
                marginBottom: 40,
              }}
            >
              {content.title}
            </h2>
          </div>

          <div
            style={{
              opacity: ctaAnim.opacity,
              transform: `scale(${ctaAnim.scale}) translateY(${ctaAnim.y}px)`,
              padding: '25px 60px',
              backgroundColor: style.accent_color,
              borderRadius: 50,
              boxShadow: `0 10px 40px ${style.accent_color}50`,
            }}
          >
            <p
              style={{
                fontFamily: getFontFamily(style.font_body),
                fontSize: 32,
                fontWeight: 700,
                color: '#ffffff',
                margin: 0,
              }}
            >
              {content.call_to_action}
            </p>
          </div>

          {content.social_handles && content.social_handles.length > 0 && (
            <div
              style={{
                marginTop: 60,
                display: 'flex',
                gap: 40,
                opacity: socialsOpacity,
              }}
            >
              {content.social_handles.map((social, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      fontFamily: getFontFamily(style.font_body),
                      fontSize: 24,
                      fontWeight: 600,
                      color: style.secondary_color,
                    }}
                  >
                    {social.platform}:
                  </span>
                  <span
                    style={{
                      fontFamily: getFontFamily(style.font_body),
                      fontSize: 24,
                      fontWeight: 500,
                      color: style.accent_color,
                    }}
                  >
                    {social.handle}
                  </span>
                </div>
              ))}
            </div>
          )}
        </AbsoluteFill>
      </BackgroundGradient>
    </AbsoluteFill>
  );
};

export default OutroScene;
