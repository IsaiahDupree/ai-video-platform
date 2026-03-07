import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { KineticCaptionContent, StyleConfig } from '../types';
import { getFontFamily } from '../styles/fonts';
import { pulseGlow } from '../animations';

interface WordTiming {
  word: string;
  start: number;
  end: number;
}

function buildTimingsFromText(text: string, durationSec: number): WordTiming[] {
  const words = text.split(/\s+/).filter(Boolean);
  const timePerWord = durationSec / words.length;
  return words.map((word, i) => ({
    word,
    start: i * timePerWord,
    end: (i + 1) * timePerWord,
  }));
}

export interface KineticCaptionSceneProps {
  content: KineticCaptionContent;
  style: StyleConfig;
  wordTimings?: WordTiming[];
}

export const KineticCaptionScene: React.FC<KineticCaptionSceneProps> = ({
  content,
  style,
  wordTimings,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const isVertical = height > width;

  const currentTimeSec = frame / fps;
  const captionStyle = content.caption_style || 'tiktok';
  const highlightColor = content.highlight_color || style.accent_color;
  const bgOpacity = content.background_opacity ?? 0.75;

  // Use provided timings or auto-distribute
  const timings: WordTiming[] = wordTimings || buildTimingsFromText(
    content.text,
    durationInFrames / fps
  );

  const currentIndex = timings.findIndex(
    (w) => currentTimeSec >= w.start && currentTimeSec < w.end
  );

  // Show a rolling window of words around current
  const WINDOW = captionStyle === 'full' ? 8 : 5;
  const WORDS_PER_LINE = captionStyle === 'full' ? 4 : 3;

  const displayStart = Math.max(0, currentIndex - 2);
  const displayEnd = Math.min(timings.length, displayStart + WINDOW);
  const visibleTimings = timings.slice(displayStart, displayEnd);

  // Split into lines
  const lines: WordTiming[][] = [];
  for (let i = 0; i < visibleTimings.length; i += WORDS_PER_LINE) {
    lines.push(visibleTimings.slice(i, i + WORDS_PER_LINE));
  }

  const glow = pulseGlow(frame, {
    color: highlightColor,
    cycleDuration: 8,
    minBlur: 8,
    maxBlur: 24,
    minOpacity: 0.5,
    maxOpacity: 1,
  });

  const containerStyle: React.CSSProperties = captionStyle === 'centered'
    ? { alignItems: 'center', justifyContent: 'center', paddingBottom: 0 }
    : captionStyle === 'full'
    ? { alignItems: 'center', justifyContent: 'center', paddingBottom: 0 }
    : { alignItems: 'flex-end', justifyContent: 'center', paddingBottom: isVertical ? 180 : 80 };

  const fontSize = captionStyle === 'full'
    ? (isVertical ? 72 : 56)
    : (isVertical ? 80 : 60);

  const strokeWidth = Math.round(fontSize / 30);

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'none',
        ...containerStyle,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          padding: '16px 32px',
          backgroundColor: `rgba(0,0,0,${bgOpacity})`,
          borderRadius: 16,
          backdropFilter: 'blur(4px)',
          maxWidth: isVertical ? '90%' : '70%',
        }}
      >
        {lines.map((line, lineIdx) => (
          <div key={lineIdx} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {line.map((wordTiming, wordIdx) => {
              const globalIdx = displayStart + lineIdx * WORDS_PER_LINE + wordIdx;
              const isActive = globalIdx === currentIndex;
              const isPast = globalIdx < currentIndex;

              // Scale pop for active word
              const activeScale = isActive ? 1.18 : 1;
              const wordOpacity = isPast ? 0.45 : isActive ? 1 : 0.75;

              return (
                <span
                  key={wordIdx}
                  style={{
                    fontFamily: getFontFamily(style.font_heading),
                    fontSize,
                    fontWeight: 900,
                    color: isActive ? highlightColor : style.primary_color,
                    opacity: wordOpacity,
                    display: 'inline-block',
                    transform: `scale(${activeScale})`,
                    transformOrigin: 'center center',
                    textShadow: isActive ? glow.textShadow : `2px 2px 4px rgba(0,0,0,0.8)`,
                    WebkitTextStroke: `${strokeWidth}px rgba(0,0,0,0.4)`,
                    lineHeight: 1.1,
                    padding: '2px 4px',
                    transition: 'none',
                  }}
                >
                  {wordTiming.word}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default KineticCaptionScene;
