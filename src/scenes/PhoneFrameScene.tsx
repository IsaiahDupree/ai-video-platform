import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, staticFile, interpolate, Easing } from 'remotion';
import { PhoneFrameContent, StyleConfig } from '../types';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { getFontFamily } from '../styles/fonts';
import { bounceIn, fadeIn, pulseGlow } from '../animations';

export interface PhoneFrameSceneProps {
  content: PhoneFrameContent;
  style: StyleConfig;
}

export const PhoneFrameScene: React.FC<PhoneFrameSceneProps> = ({ content, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const isVertical = height > width;

  const phoneAnim = bounceIn(frame, { durationInFrames: 28, delay: 0, bounceHeight: 80 });
  const screenFade = fadeIn(frame, { durationInFrames: 15, delay: 18 });
  const notifSlide = interpolate(frame, [28, 42], [-200, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const notifOpacity = fadeIn(frame, { durationInFrames: 12, delay: 28 });

  const glow = pulseGlow(frame, { color: style.accent_color, cycleDuration: 50, minBlur: 15, maxBlur: 40 });

  const bgColors = style.background_type === 'gradient'
    ? style.background_value.match(/#[a-fA-F0-9]{6}/g) || ['#0a0a0a', '#111']
    : [style.background_value, style.background_value];

  // Phone dimensions (relative to canvas)
  const phoneH = isVertical ? height * 0.72 : height * 0.85;
  const phoneW = phoneH * 0.46;
  const screenH = phoneH * 0.84;
  const screenW = phoneW * 0.88;
  const cornerRadius = phoneW * 0.12;

  return (
    <AbsoluteFill>
      <BackgroundGradient colors={bgColors}>
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              opacity: phoneAnim.opacity,
              transform: `scale(${phoneAnim.scale}) translateY(${phoneAnim.y}px)`,
            }}
          >
            {/* Phone outer shell */}
            <div
              style={{
                width: phoneW,
                height: phoneH,
                backgroundColor: content.device === 'android' ? '#2d2d2d' : '#1c1c1e',
                borderRadius: cornerRadius,
                border: `3px solid #3a3a3c`,
                boxShadow: `0 40px 100px rgba(0,0,0,0.7), ${glow.boxShadow}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Dynamic island / notch */}
              <div
                style={{
                  position: 'absolute',
                  top: phoneH * 0.02,
                  width: phoneW * 0.3,
                  height: phoneH * 0.025,
                  backgroundColor: '#000',
                  borderRadius: 20,
                  zIndex: 10,
                }}
              />

              {/* Screen area */}
              <div
                style={{
                  width: screenW,
                  height: screenH,
                  backgroundColor: '#000',
                  borderRadius: cornerRadius * 0.7,
                  overflow: 'hidden',
                  opacity: screenFade,
                  position: 'relative',
                }}
              >
                {/* Status bar */}
                <div
                  style={{
                    height: 28,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 12px',
                    fontSize: 10,
                    color: '#fff',
                    fontFamily: 'monospace',
                  }}
                >
                  <span>9:41</span>
                  <span>● ● ●</span>
                </div>

                {/* Content area */}
                <div
                  style={{
                    flex: 1,
                    backgroundColor: '#1c1c1e',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {content.content_path ? (
                    <Img
                      src={content.content_path.startsWith('http') ? content.content_path : staticFile(content.content_path)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    // App UI placeholder
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: `linear-gradient(180deg, #1c1c2e 0%, #2a1a3e 100%)`,
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '20px 16px',
                        gap: 12,
                      }}
                    >
                      {content.app_name && (
                        <p style={{ fontFamily: getFontFamily(style.font_heading), fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>
                          {content.app_name}
                        </p>
                      )}
                      {/* Placeholder content blocks */}
                      {[0.7, 0.5, 0.6, 0.4].map((w, i) => (
                        <div key={i} style={{ height: 10, width: `${w * 100}%`, backgroundColor: `${style.accent_color}40`, borderRadius: 4 }} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Notification overlay */}
                {content.notification_text && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 36,
                      left: 8,
                      right: 8,
                      opacity: notifOpacity,
                      transform: `translateY(${notifSlide}px)`,
                      backgroundColor: 'rgba(30,30,30,0.96)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: 12,
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: style.accent_color, flexShrink: 0 }} />
                    <p style={{ fontFamily: getFontFamily(style.font_body), fontSize: 11, color: '#fff', margin: 0, lineHeight: 1.3 }}>
                      {content.notification_text}
                    </p>
                  </div>
                )}
              </div>

              {/* Home indicator */}
              <div
                style={{
                  position: 'absolute',
                  bottom: phoneH * 0.015,
                  width: phoneW * 0.35,
                  height: 4,
                  backgroundColor: '#fff',
                  borderRadius: 2,
                  opacity: 0.5,
                }}
              />
            </div>
          </div>
        </AbsoluteFill>
      </BackgroundGradient>
    </AbsoluteFill>
  );
};

export default PhoneFrameScene;
