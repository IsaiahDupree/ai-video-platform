import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CaptionData} from '../types';

interface WordCaptionsProps {
  captions: CaptionData;
  textColor: string;
  accentColor: string;
  startFrame?: number;
}

export const WordCaptions: React.FC<WordCaptionsProps> = ({
  captions,
  textColor,
  accentColor,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const currentTime = (frame - startFrame) / fps;

  // Find the current word being spoken
  const currentWordIndex = captions.words.findIndex(
    (word) => currentTime >= word.start && currentTime < word.end
  );

  // Get words around the current one for context
  const contextRange = 3; // Show 3 words before and after
  const startIndex = Math.max(0, currentWordIndex - contextRange);
  const endIndex = Math.min(
    captions.words.length,
    currentWordIndex + contextRange + 1
  );
  const visibleWords = captions.words.slice(startIndex, endIndex);

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingBottom: 150,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
          maxWidth: 1600,
          padding: '20px 40px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderRadius: 20,
          backdropFilter: 'blur(10px)',
        }}
      >
        {visibleWords.map((word, index) => {
          const isCurrent = startIndex + index === currentWordIndex;
          const isPast = startIndex + index < currentWordIndex;

          return (
            <span
              key={index}
              style={{
                fontSize: 48,
                fontWeight: isCurrent ? 'bold' : 'normal',
                color: isCurrent ? accentColor : isPast ? textColor : `${textColor}80`,
                textShadow: isCurrent ? `0 0 20px ${accentColor}` : 'none',
                transform: isCurrent ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.1s ease-out',
                display: 'inline-block',
                padding: '4px 8px',
              }}
            >
              {word.word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};






