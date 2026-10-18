import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Topic} from '../types';
import {WordCaptions} from './WordCaptions';

interface TopicSceneProps {
  topic: Topic;
  title: string;
  textColor: string;
  accentColor: string;
  backgroundColor: string;
  isFirst: boolean;
  isLast: boolean;
}

export const TopicScene: React.FC<TopicSceneProps> = ({
  topic,
  title,
  textColor,
  accentColor,
  backgroundColor,
  isFirst,
  isLast,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  // Zoom in animation (first 30 frames = 1 second)
  const zoomInProgress = interpolate(
    frame,
    [0, 30],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Zoom out animation (last 30 frames = 1 second)
  const zoomOutProgress = interpolate(
    frame,
    [durationInFrames - 30, durationInFrames],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Combined zoom: start zoomed out, zoom in, stay, zoom out
  const zoom = interpolate(
    zoomInProgress - zoomOutProgress,
    [-1, 0, 1],
    [0.3, 1, 0.3],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Position animation (Ken Burns effect - slight pan)
  const panX = interpolate(
    frame,
    [0, durationInFrames],
    [0, 50],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const panY = interpolate(
    frame,
    [0, durationInFrames],
    [0, -30],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Fade in/out
  const opacity = interpolate(
    frame,
    [0, 15, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        opacity,
      }}
    >
      {/* Centered Topic Icon with Zoom */}
      <AbsoluteFill
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
          transformOrigin: 'center center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: 800,
            height: 800,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 40,
            border: `4px solid ${accentColor}`,
            padding: 60,
            backdropFilter: 'blur(20px)',
            boxShadow: `0 0 100px ${accentColor}40`,
          }}
        >
          <img
            src={topic.icon}
            alt={topic.label}
            style={{
              width: 500,
              height: 500,
              objectFit: 'contain',
              marginBottom: 30,
            }}
          />
          <div
            style={{
              fontSize: 64,
              fontWeight: 'bold',
              color: textColor,
              textAlign: 'center',
              textShadow: `0 0 30px ${accentColor}`,
            }}
          >
            {topic.label}
          </div>
        </div>
      </AbsoluteFill>

      {/* Word-synced Captions */}
      {topic.captions && (
        <WordCaptions
          captions={topic.captions}
          textColor={textColor}
          accentColor={accentColor}
          startFrame={30} // Start after zoom-in
        />
      )}

      {/* Title in corner */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 40,
          fontSize: 32,
          fontWeight: 'bold',
          color: textColor,
          opacity: 0.7,
        }}
      >
        {title}
      </div>
    </AbsoluteFill>
  );
};






