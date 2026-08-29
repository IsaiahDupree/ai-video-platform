import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import {resolveCaptionWindow} from './captionWindow';

// =============================================================================
// Animated Captions Component
// =============================================================================
// Supports: highlight, bounce, typewriter, pop, karaoke styles

export interface WordTiming {
  word: string;
  start: number;  // seconds
  end: number;    // seconds
}

export interface CaptionStyle {
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  highlightColor?: string;
  backgroundColor?: string;
  position?: 'bottom' | 'center' | 'top';
  animation?: 'highlight' | 'bounce' | 'typewriter' | 'pop' | 'karaoke';
  safeBottom?: number;
  safeTop?: number;
}

interface AnimatedCaptionsProps {
  transcript: WordTiming[];
  style?: CaptionStyle;
  maxWordsPerLine?: number;
  maxCharactersPerLine?: number;
  gapHoldSeconds?: number;
  hidden?: boolean;
}

const defaultStyle: CaptionStyle = {
  fontSize: 48,
  fontFamily: 'Inter, system-ui, sans-serif',
  color: '#ffffff',
  highlightColor: '#ffff00',
  backgroundColor: 'rgba(0,0,0,0.7)',
  position: 'bottom',
  animation: 'highlight',
  safeBottom: 230,
  safeTop: 110,
};

// Single word with animation
const AnimatedWord: React.FC<{
  word: string;
  isActive: boolean;
  isPast: boolean;
  style: CaptionStyle;
  frame: number;
  fps: number;
  startFrame: number;
}> = ({ word, isActive, isPast, style, frame, fps, startFrame }) => {
  const localFrame = frame - startFrame;

  let opacity = 1;
  let translateY = 0;
  let color = style.color || '#ffffff';
  let textShadow = '0 2px 12px rgba(0,0,0,0.9)';

  switch (style.animation) {
    case 'highlight':
      color = isActive ? (style.highlightColor || '#ffff00') : (style.color || '#ffffff');
      textShadow = isActive
        ? `0 0 18px ${style.highlightColor || '#ffff00'}, 0 2px 12px rgba(0,0,0,0.9)`
        : textShadow;
      break;

    case 'bounce':
      if (isActive) {
        const bounce = spring({
          frame: localFrame,
          fps,
          config: { damping: 8, stiffness: 200 },
        });
        translateY = interpolate(bounce, [0, 1], [-20, 0]);
      }
      color = isActive ? (style.highlightColor || '#ffff00') : (style.color || '#ffffff');
      break;

    case 'pop':
      if (isActive) {
        const pop = spring({
          frame: localFrame,
          fps,
          config: { damping: 10, stiffness: 150 },
        });
        opacity = interpolate(pop, [0, 1], [0.55, 1]);
        translateY = interpolate(pop, [0, 1], [5, 0]);
        textShadow = `0 0 18px ${style.highlightColor || '#ffff00'}, 0 2px 12px rgba(0,0,0,0.9)`;
      }
      color = isActive ? (style.highlightColor || '#ffff00') : (style.color || '#ffffff');
      break;

    case 'typewriter':
      opacity = isPast || isActive ? 1 : 0;
      break;

    case 'karaoke':
      // Karaoke style: word fills from left to right
      color = isActive || isPast ? (style.highlightColor || '#ffff00') : (style.color || '#ffffff');
      break;
  }

  return (
    <span
      style={{
        display: 'inline-block',
        color,
        transform: `translateY(${translateY}px)`,
        opacity,
        textShadow,
        fontWeight: 750,
        whiteSpace: 'nowrap',
      }}
    >
      {word}
    </span>
  );
};

export const AnimatedCaptions: React.FC<AnimatedCaptionsProps> = ({
  transcript,
  style = {},
  maxWordsPerLine = 6,
  maxCharactersPerLine = 26,
  gapHoldSeconds = 0.12,
  hidden = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mergedStyle = { ...defaultStyle, ...style };

  const currentTime = frame / fps;

  const window = resolveCaptionWindow(
    transcript,
    currentTime,
    maxWordsPerLine,
    maxCharactersPerLine,
    gapHoldSeconds,
  );

  if (hidden || window === null) return null;

  // Position mapping
  const positionStyle: React.CSSProperties = {
    bottom: mergedStyle.position === 'bottom' ? mergedStyle.safeBottom : undefined,
    top: mergedStyle.position === 'top' ? mergedStyle.safeTop : undefined,
    ...(mergedStyle.position === 'center' && {
      top: '50%',
      transform: 'translateY(-50%)',
    }),
  };

  const visibleLine = window.line.words;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 54px',
        zIndex: 30,
        ...positionStyle,
      }}
    >
      <div
        style={{
          backgroundColor: mergedStyle.backgroundColor,
          padding: '16px 32px',
          borderRadius: 12,
          fontSize: mergedStyle.fontSize,
          fontFamily: mergedStyle.fontFamily,
          textAlign: 'center',
          maxWidth: 612,
          minHeight: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          columnGap: 12,
          rowGap: 6,
          lineHeight: 1.08,
        }}
      >
        {visibleLine.map((wordTiming, i) => {
          const globalIndex = window.line.startIndex + i;
          const isActive = globalIndex === window.activeWordIndex;
          const isPast = globalIndex < window.activeWordIndex;
          const startFrame = Math.round(wordTiming.start * fps);

          return (
            <AnimatedWord
              key={`${globalIndex}-${wordTiming.word}`}
              word={wordTiming.word}
              isActive={isActive}
              isPast={isPast}
              style={mergedStyle}
              frame={frame}
              fps={fps}
              startFrame={startFrame}
            />
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// Helper: Generate transcript from text with estimated timing
// =============================================================================

export function generateTranscriptFromText(
  text: string,
  startTime = 0,
  wordsPerMinute = 150
): WordTiming[] {
  const words = text.split(/\s+/).filter(Boolean);
  const secondsPerWord = 60 / wordsPerMinute;
  
  let currentTime = startTime;
  
  return words.map((word) => {
    const start = currentTime;
    const duration = secondsPerWord * (1 + word.length * 0.02); // Longer words take slightly longer
    const end = start + duration;
    currentTime = end;
    
    return { word, start, end };
  });
}

// =============================================================================
// Helper: Parse SRT/VTT to WordTiming
// =============================================================================

export function parseSrtToWordTimings(srt: string): WordTiming[] {
  const timings: WordTiming[] = [];
  const blocks = srt.trim().split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length < 3) continue;

    // Parse timestamp line: "00:00:01,000 --> 00:00:03,000"
    const timeMatch = lines[1].match(
      /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
    );
    if (!timeMatch) continue;

    const startSec =
      parseInt(timeMatch[1]) * 3600 +
      parseInt(timeMatch[2]) * 60 +
      parseInt(timeMatch[3]) +
      parseInt(timeMatch[4]) / 1000;

    const endSec =
      parseInt(timeMatch[5]) * 3600 +
      parseInt(timeMatch[6]) * 60 +
      parseInt(timeMatch[7]) +
      parseInt(timeMatch[8]) / 1000;

    // Get text (remaining lines)
    const text = lines.slice(2).join(' ').replace(/<[^>]*>/g, '');
    const words = text.split(/\s+/).filter(Boolean);

    // Distribute time evenly across words
    const duration = endSec - startSec;
    const wordDuration = duration / words.length;

    words.forEach((word, i) => {
      timings.push({
        word,
        start: startSec + i * wordDuration,
        end: startSec + (i + 1) * wordDuration,
      });
    });
  }

  return timings;
}
