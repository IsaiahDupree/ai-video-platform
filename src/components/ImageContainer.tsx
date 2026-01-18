import React from 'react';
import { useCurrentFrame, useVideoConfig, Img, staticFile } from 'remotion';
import { fadeIn, zoomIn, kenBurns } from '../animations';

export interface ImageContainerProps {
  src: string;
  width?: number | string;
  height?: number | string;
  objectFit?: 'cover' | 'contain' | 'fill';
  borderRadius?: number;
  shadow?: boolean;
  animationType?: 'none' | 'fade' | 'zoom' | 'kenBurns';
  animationDelay?: number;
  animationDuration?: number;
  style?: React.CSSProperties;
}

export const ImageContainer: React.FC<ImageContainerProps> = ({
  src,
  width = '100%',
  height = 'auto',
  objectFit = 'cover',
  borderRadius = 0,
  shadow = false,
  animationType = 'fade',
  animationDelay = 0,
  animationDuration = 20,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  let opacity = 1;
  let scale = 1;
  let transformX = 0;
  let transformY = 0;

  if (animationType === 'fade') {
    opacity = fadeIn(frame, {
      durationInFrames: animationDuration,
      delay: animationDelay,
    });
  } else if (animationType === 'zoom') {
    const zoom = zoomIn(frame, {
      durationInFrames: animationDuration,
      delay: animationDelay,
      fromScale: 0.8,
    });
    opacity = zoom.opacity;
    scale = zoom.scale;
  } else if (animationType === 'kenBurns') {
    const kb = kenBurns(frame, durationInFrames, 'in');
    scale = kb.scale;
    transformX = kb.x;
    transformY = kb.y;
  }

  const imageSrc = src.startsWith('http') || src.startsWith('/') 
    ? src 
    : staticFile(src);

  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        overflow: 'hidden',
        boxShadow: shadow ? '0 20px 60px rgba(0, 0, 0, 0.4)' : 'none',
        opacity,
        ...style,
      }}
    >
      <Img
        src={imageSrc}
        style={{
          width: '100%',
          height: '100%',
          objectFit,
          transform: `scale(${scale}) translate(${transformX}px, ${transformY}px)`,
        }}
      />
    </div>
  );
};

export default ImageContainer;
