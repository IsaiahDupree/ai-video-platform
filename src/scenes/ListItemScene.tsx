import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Img,
  staticFile,
} from 'remotion';
import { ListItemContent, StyleConfig } from '../types';
import { fadeIn, bounceIn, slideIn } from '../animations';
import { getFontFamily } from '../styles/fonts';

export interface ListItemSceneProps {
  content: ListItemContent;
  style: StyleConfig;
}

export const ListItemScene: React.FC<ListItemSceneProps> = ({ content, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const numberAnim = bounceIn(frame, { durationInFrames: 20, delay: 0 });
  const titleAnim = slideIn(frame, {
    durationInFrames: 20,
    delay: 10,
    direction: 'left',
    distance: 80,
  });
  const descOpacity = fadeIn(frame, { durationInFrames: 20, delay: 25 });
  const imageOpacity = fadeIn(frame, { durationInFrames: 25, delay: 15 });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: style.background_value,
        display: 'flex',
        flexDirection: 'column',
        padding: 80,
      }}
    >
      {/* Number badge */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 80,
          opacity: numberAnim.opacity,
          transform: `scale(${numberAnim.scale}) translateY(${numberAnim.y}px)`,
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            backgroundColor: style.accent_color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 10px 40px ${style.accent_color}50`,
          }}
        >
          <span
            style={{
              fontFamily: getFontFamily(style.font_heading),
              fontSize: 64,
              fontWeight: 800,
              color: '#ffffff',
            }}
          >
            {content.number}
          </span>
        </div>
      </div>

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 60,
          marginTop: 80,
        }}
      >
        {/* Text content */}
        <div style={{ flex: 1, paddingLeft: 160 }}>
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
                fontWeight: 700,
                color: style.primary_color,
                margin: 0,
                marginBottom: 30,
                lineHeight: 1.2,
              }}
            >
              {content.title}
            </h2>
          </div>

          <div style={{ opacity: descOpacity }}>
            <p
              style={{
                fontFamily: getFontFamily(style.font_body),
                fontSize: 32,
                fontWeight: 400,
                color: style.secondary_color,
                margin: 0,
                lineHeight: 1.6,
                maxWidth: 700,
              }}
            >
              {content.description}
            </p>
          </div>
        </div>

        {/* Image */}
        {content.image_path && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: imageOpacity,
            }}
          >
            <Img
              src={content.image_path.startsWith('http') ? content.image_path : staticFile(content.image_path)}
              style={{
                maxWidth: '100%',
                maxHeight: 600,
                objectFit: 'contain',
                borderRadius: 20,
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
              }}
            />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export default ListItemScene;
