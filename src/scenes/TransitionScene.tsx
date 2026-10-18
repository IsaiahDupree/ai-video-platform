import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from 'remotion';
import { TransitionContent, StyleConfig } from '../types';

export interface TransitionSceneProps {
  content: TransitionContent;
  style: StyleConfig;
}

export const TransitionScene: React.FC<TransitionSceneProps> = ({ content, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  const progress = interpolate(
    frame,
    [0, durationInFrames],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const renderTransition = () => {
    switch (content.style) {
      case 'fade':
        return (
          <AbsoluteFill
            style={{
              backgroundColor: style.background_value,
              opacity: interpolate(progress, [0, 0.5, 1], [0, 1, 0]),
            }}
          />
        );

      case 'wipe':
        return (
          <AbsoluteFill
            style={{
              backgroundColor: style.accent_color,
              transform: `translateX(${interpolate(progress, [0, 0.5, 1], [-width, 0, width])}px)`,
            }}
          />
        );

      case 'zoom':
        const scale = interpolate(progress, [0, 0.5, 1], [0, 1.5, 0], {
          easing: Easing.inOut(Easing.cubic),
        });
        const opacity = interpolate(progress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
        return (
          <AbsoluteFill
            style={{
              backgroundColor: style.background_value,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                backgroundColor: style.accent_color,
                transform: `scale(${scale * 20})`,
                opacity,
              }}
            />
          </AbsoluteFill>
        );

      case 'slide':
        return (
          <>
            <AbsoluteFill
              style={{
                backgroundColor: style.background_value,
                transform: `translateY(${interpolate(progress, [0, 0.5], [height, 0], {
                  extrapolateRight: 'clamp',
                })}px)`,
              }}
            />
            <AbsoluteFill
              style={{
                backgroundColor: style.background_value,
                transform: `translateY(${interpolate(progress, [0.5, 1], [0, -height], {
                  extrapolateLeft: 'clamp',
                })}px)`,
              }}
            />
          </>
        );

      default:
        return (
          <AbsoluteFill
            style={{
              backgroundColor: style.background_value,
              opacity: interpolate(progress, [0, 0.5, 1], [0, 1, 0]),
            }}
          />
        );
    }
  };

  return <AbsoluteFill>{renderTransition()}</AbsoluteFill>;
};

export default TransitionScene;
