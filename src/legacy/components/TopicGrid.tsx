import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Topic} from '../types';

interface TopicGridProps {
  topics: Topic[];
  title: string;
  textColor: string;
  accentColor: string;
}

export const TopicGrid: React.FC<TopicGridProps> = ({
  topics,
  title,
  textColor,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10, 50, 60], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const scale = interpolate(frame, [0, 20], [0.8, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const itemsPerRow = 5;
  const rows = Math.ceil(topics.length / itemsPerRow);
  const itemSize = 300;
  const spacing = 50;
  const totalWidth = itemsPerRow * itemSize + (itemsPerRow - 1) * spacing;
  const totalHeight = rows * itemSize + (rows - 1) * spacing;
  const startX = (1920 - totalWidth) / 2;
  const startY = (1080 - totalHeight) / 2 + 100; // Offset for title

  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `scale(${scale})`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 72,
          fontWeight: 'bold',
          color: textColor,
          textShadow: `0 0 20px ${accentColor}`,
        }}
      >
        {title}
      </div>

      {/* Grid of Topics */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          width: totalWidth,
          height: totalHeight,
          position: 'relative',
        }}
      >
        {topics.map((topic, index) => {
          const row = Math.floor(index / itemsPerRow);
          const col = index % itemsPerRow;
          const x = col * (itemSize + spacing);
          const y = row * (itemSize + spacing);

          const itemOpacity = interpolate(
            frame,
            [index * 3, index * 3 + 10],
            [0, 1],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          );

          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: itemSize,
                height: itemSize,
                opacity: itemOpacity,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 20,
                border: `2px solid ${accentColor}`,
                padding: 20,
                backdropFilter: 'blur(10px)',
              }}
            >
              <img
                src={topic.icon}
                alt={topic.label}
                style={{
                  width: 150,
                  height: 150,
                  objectFit: 'contain',
                  marginBottom: 10,
                }}
              />
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: textColor,
                  textAlign: 'center',
                }}
              >
                {topic.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};






