import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Img,
  staticFile,
} from 'remotion';
import { TopicContent, StyleConfig } from '../types';
import { TextBlock } from '../components/TextBlock';
import { IconBadge } from '../components/IconBadge';
import { fadeIn, slideIn, zoomIn } from '../animations';
import { getFontFamily } from '../styles/fonts';

export interface TopicSceneProps {
  content: TopicContent;
  style: StyleConfig;
  index?: number;
}

export const TopicScene: React.FC<TopicSceneProps> = ({ content, style, index = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const headingAnim = slideIn(frame, {
    durationInFrames: 20,
    delay: 5,
    direction: 'up',
    distance: 50,
  });

  const bodyOpacity = fadeIn(frame, { durationInFrames: 20, delay: 20 });
  const imageAnim = zoomIn(frame, { durationInFrames: 25, delay: 15, fromScale: 0.9 });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: style.background_value,
        display: 'flex',
        flexDirection: 'row',
        padding: 80,
        gap: 60,
      }}
    >
      {/* Left side - Text content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {content.icon && (
          <div style={{ marginBottom: 30 }}>
            <IconBadge
              icon={content.icon}
              size={70}
              backgroundColor={`${style.accent_color}20`}
              iconColor={style.accent_color}
              animationDelay={0}
            />
          </div>
        )}

        <div
          style={{
            opacity: headingAnim.opacity,
            transform: `translateY(${headingAnim.y}px)`,
          }}
        >
          <h2
            style={{
              fontFamily: getFontFamily(style.font_heading),
              fontSize: 72,
              fontWeight: 700,
              color: style.primary_color,
              margin: 0,
              marginBottom: 30,
              lineHeight: 1.2,
            }}
          >
            {content.heading}
          </h2>
        </div>

        <div style={{ opacity: bodyOpacity }}>
          <p
            style={{
              fontFamily: getFontFamily(style.font_body),
              fontSize: 32,
              fontWeight: 400,
              color: style.secondary_color,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {content.body_text}
          </p>
        </div>

        {content.bullet_points && content.bullet_points.length > 0 && (
          <div style={{ marginTop: 40 }}>
            {content.bullet_points.map((point, i) => {
              const bulletOpacity = fadeIn(frame, {
                durationInFrames: 15,
                delay: 35 + i * 10,
              });
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 15,
                    marginBottom: 20,
                    opacity: bulletOpacity,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: style.accent_color,
                      marginTop: 12,
                      flexShrink: 0,
                    }}
                  />
                  <p
                    style={{
                      fontFamily: getFontFamily(style.font_body),
                      fontSize: 26,
                      color: style.secondary_color,
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {point}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right side - Image */}
      {content.image_path && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: imageAnim.opacity,
            transform: `scale(${imageAnim.scale})`,
          }}
        >
          <Img
            src={content.image_path.startsWith('http') ? content.image_path : staticFile(content.image_path)}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: 20,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
            }}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};

export default TopicScene;
