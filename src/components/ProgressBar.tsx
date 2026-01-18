import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

export interface ProgressBarProps {
  width?: number | string;
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  borderRadius?: number;
  position?: 'top' | 'bottom';
  showPercentage?: boolean;
  style?: React.CSSProperties;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  width = '100%',
  height = 4,
  backgroundColor = 'rgba(255, 255, 255, 0.2)',
  progressColor = '#3b82f6',
  borderRadius = 2,
  position = 'bottom',
  showPercentage = false,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const positionStyle: React.CSSProperties = position === 'top'
    ? { top: 0 }
    : { bottom: 0 };

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        ...positionStyle,
        padding: '0 20px',
        ...style,
      }}
    >
      <div
        style={{
          width,
          height,
          backgroundColor,
          borderRadius,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: progressColor,
            borderRadius,
            transition: 'width 0.1s linear',
          }}
        />
      </div>
      {showPercentage && (
        <div
          style={{
            position: 'absolute',
            right: 30,
            top: -20,
            fontSize: 12,
            color: progressColor,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
