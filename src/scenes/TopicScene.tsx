/**
 * TopicScene - Reusable scene for heading, body text, and image display
 * VID-003: Topic Scene Component
 * VID-004: Theme System integration
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
import type { Theme } from '../styles/theme';
import { getGradientOverlay } from '../styles/theme';

export interface TopicSceneProps {
  section: Section;
  theme: Theme;
  animationDuration?: number;
}

export const TopicScene: React.FC<TopicSceneProps> = ({
  section,
  theme,
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
        backgroundColor: theme.colors.background,
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
              background: getGradientOverlay(theme, 'right'),
            }}
          />
        </AbsoluteFill>
      )}

      {/* Text Content */}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: imageConfig ? 'flex-start' : 'center',
          padding: `${theme.spacing.xl}px`,
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
                fontSize: theme.typography.headingSize,
                fontFamily: theme.typography.headingFont,
                color: theme.colors.text,
                marginBottom: `${theme.spacing.md}px`,
                fontWeight: theme.typography.headingWeight,
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
                fontSize: theme.typography.bodySize,
                fontFamily: theme.typography.bodyFont,
                color: theme.colors.textSecondary,
                lineHeight: theme.typography.lineHeight,
                fontWeight: theme.typography.bodyWeight,
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
