import React from 'react';
import { useCurrentFrame, interpolate, Img, staticFile } from 'remotion';
import { bounceIn, pulse } from '../animations';

export interface IconBadgeProps {
  icon: string;
  size?: number;
  backgroundColor?: string;
  iconColor?: string;
  borderRadius?: number | string;
  shadow?: boolean;
  animationType?: 'none' | 'bounce' | 'pulse' | 'fade';
  animationDelay?: number;
  style?: React.CSSProperties;
}

export const IconBadge: React.FC<IconBadgeProps> = ({
  icon,
  size = 80,
  backgroundColor = 'rgba(59, 130, 246, 0.2)',
  iconColor = '#3b82f6',
  borderRadius = '50%',
  shadow = true,
  animationType = 'bounce',
  animationDelay = 0,
  style = {},
}) => {
  const frame = useCurrentFrame();

  let opacity = 1;
  let scale = 1;
  let translateY = 0;

  if (animationType === 'bounce') {
    const bounce = bounceIn(frame, {
      durationInFrames: 20,
      delay: animationDelay,
    });
    opacity = bounce.opacity;
    scale = bounce.scale;
    translateY = bounce.y;
  } else if (animationType === 'pulse') {
    scale = pulse(frame, 60);
  } else if (animationType === 'fade') {
    opacity = interpolate(
      frame,
      [animationDelay, animationDelay + 15],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
  }

  const isImage = icon.includes('.') || icon.startsWith('http');
  const iconSrc = isImage
    ? (icon.startsWith('http') || icon.startsWith('/') ? icon : staticFile(icon))
    : undefined;

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor,
        borderRadius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: shadow ? '0 10px 30px rgba(0, 0, 0, 0.3)' : 'none',
        opacity,
        transform: `scale(${scale}) translateY(${translateY}px)`,
        ...style,
      }}
    >
      {isImage ? (
        <Img
          src={iconSrc!}
          style={{
            width: size * 0.6,
            height: size * 0.6,
            objectFit: 'contain',
          }}
        />
      ) : (
        <span
          style={{
            fontSize: size * 0.5,
            color: iconColor,
          }}
        >
          {icon}
        </span>
      )}
    </div>
  );
};

export default IconBadge;
