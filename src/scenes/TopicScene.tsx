/**
 * TopicScene - Reusable scene for heading, body text, and image display
 * VID-003: Topic Scene Component
 */

import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type { Section, ImageConfig } from '../types/brief';

export interface TopicSceneProps {
  section: Section;
  colors?: {
    background?: string;
    text?: string;
    accent?: string;
  };
  typography?: {
    headingFont?: string;
    headingSize?: number;
    bodyFont?: string;
    bodySize?: number;
  };
  animationDuration?: number;
}

export const TopicScene: React.FC<TopicSceneProps> = ({
  section,
  colors = {},
  typography = {},
  animationDuration = 30,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Parse image config
  const imageConfig: ImageConfig | null =
    typeof section.image === 'string'
      ? { src: section.image, fit: 'cover' }
      : section.image || null;

  // Animation springs
  const fadeIn = spring({
    frame,
    fps,
    config: {
      damping: 200,
    },
  });

  const slideIn = spring({
    frame,
    fps,
    config: {
      damping: 100,
      stiffness: 200,
    },
  });

  // Heading animation
  const headingOpacity = interpolate(fadeIn, [0, 1], [0, 1]);
  const headingTranslateY = interpolate(slideIn, [0, 1], [30, 0]);

  // Body animation (delayed)
  const bodyFadeIn = spring({
    frame: frame - 10,
    fps,
    config: {
      damping: 200,
    },
  });
  const bodyOpacity = interpolate(bodyFadeIn, [0, 1], [0, 1]);
  const bodyTranslateY = interpolate(bodyFadeIn, [0, 1], [20, 0]);

  // Image animation
  const imageScale = interpolate(fadeIn, [0, 1], [0.95, 1]);
  const imageOpacity = interpolate(fadeIn, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background || '#0f172a',
      }}
    >
      {/* Image Section (Left or Background) */}
      {imageConfig && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            opacity: imageOpacity * (imageConfig.opacity || 1),
            transform: `scale(${imageScale * (imageConfig.scale || 1)})`,
          }}
        >
          <Img
            src={imageConfig.src}
            style={{
              width: '100%',
              height: '100%',
              objectFit: imageConfig.fit || 'cover',
              objectPosition: imageConfig.position
                ? `${imageConfig.position.x}% ${imageConfig.position.y}%`
                : 'center',
            }}
          />
          {/* Gradient overlay for text readability */}
          <AbsoluteFill
            style={{
              background:
                'linear-gradient(to right, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.4) 100%)',
            }}
          />
        </AbsoluteFill>
      )}

      {/* Text Content */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: imageConfig ? 'flex-start' : 'center',
          padding: '80px',
          zIndex: 1,
        }}
      >
        <div
          style={{
            maxWidth: imageConfig ? '50%' : '80%',
            textAlign: imageConfig ? 'left' : 'center',
          }}
        >
          {/* Heading */}
          {section.heading && (
            <h1
              style={{
                fontSize: typography.headingSize || 56,
                fontFamily: typography.headingFont || 'Inter, sans-serif',
                color: colors.text || '#f1f5f9',
                marginBottom: '32px',
                fontWeight: 'bold',
                lineHeight: 1.2,
                opacity: headingOpacity,
                transform: `translateY(${headingTranslateY}px)`,
              }}
            >
              {section.heading}
            </h1>
          )}

          {/* Body text */}
          {section.body && (
            <p
              style={{
                fontSize: typography.bodySize || 28,
                fontFamily: typography.bodyFont || 'Inter, sans-serif',
                color: colors.text || '#cbd5e1',
                lineHeight: 1.6,
                opacity: bodyOpacity,
                transform: `translateY(${bodyTranslateY}px)`,
              }}
            >
              {section.body}
            </p>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
