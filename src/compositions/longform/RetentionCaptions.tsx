/**
 * RetentionCaptions — Word-by-word karaoke captions synced to Whisper timestamps.
 *
 * Words appear one at a time as they're spoken, with the current word
 * highlighted and styled based on retention role. Past words dim,
 * future words are hidden.
 */

import React, { useMemo } from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import type { CaptionConfig, CaptionWord, RetentionRole } from '../../types/LongformSchema';

export interface RetentionCaptionsProps {
  captions: CaptionConfig;
  retentionRole: RetentionRole;
}

// Style presets per retention role
const ROLE_STYLES: Record<RetentionRole, {
  highlightColor: string;
  baseColor: string;
  bgColor: string;
  fontWeight: number;
}> = {
  hook: {
    highlightColor: '#FFD700',
    baseColor: '#FFFFFF',
    bgColor: 'rgba(0,0,0,0.85)',
    fontWeight: 900,
  },
  explanation: {
    highlightColor: '#4FC3F7',
    baseColor: '#FFFFFF',
    bgColor: 'rgba(0,0,0,0.75)',
    fontWeight: 700,
  },
  story: {
    highlightColor: '#81C784',
    baseColor: '#E0E0E0',
    bgColor: 'rgba(0,0,0,0.7)',
    fontWeight: 600,
  },
  proof: {
    highlightColor: '#FF8A65',
    baseColor: '#FFFFFF',
    bgColor: 'rgba(0,0,0,0.8)',
    fontWeight: 800,
  },
  reset: {
    highlightColor: '#CE93D8',
    baseColor: '#FFFFFF',
    bgColor: 'rgba(0,0,0,0.6)',
    fontWeight: 700,
  },
  payoff: {
    highlightColor: '#FFD700',
    baseColor: '#FFFFFF',
    bgColor: 'rgba(0,0,0,0.85)',
    fontWeight: 900,
  },
};

const MAX_WORDS_VISIBLE = 8;

export const RetentionCaptions: React.FC<RetentionCaptionsProps> = ({
  captions,
  retentionRole,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const style = ROLE_STYLES[retentionRole] || ROLE_STYLES.explanation;

  // Remap word timestamps to be relative to this sequence.
  // Words come with original source video timestamps, but this <Sequence>
  // starts at frame 0. We need to offset all word times by the first word's start.
  const relativeWords = useMemo(() => {
    const words = captions.words;
    if (!words.length) return [];

    const baseTime = words[0].start;
    return words.map((w) => ({
      ...w,
      // Relative time within this sequence
      relStart: w.start - baseTime,
      relEnd: w.end - baseTime,
    }));
  }, [captions.words]);

  const currentTimeSec = frame / fps;

  // Find current word by relative timestamp
  const { currentIdx, visibleWords } = useMemo(() => {
    if (!relativeWords.length) return { currentIdx: -1, visibleWords: [] };

    let idx = 0;
    for (let i = 0; i < relativeWords.length; i++) {
      if (relativeWords[i].relStart <= currentTimeSec && relativeWords[i].relEnd >= currentTimeSec) {
        idx = i;
        break;
      }
      if (relativeWords[i].relStart > currentTimeSec) {
        idx = Math.max(0, i - 1);
        break;
      }
      idx = i;
    }

    // Show a window of words: 2 before current, up to MAX after
    const windowStart = Math.max(0, idx - 2);
    const windowEnd = Math.min(relativeWords.length, windowStart + MAX_WORDS_VISIBLE);

    const visible = relativeWords.slice(windowStart, windowEnd).map((w, i) => ({
      ...w,
      isCurrent: windowStart + i === idx,
      isPast: windowStart + i < idx,
      isFuture: windowStart + i > idx,
      globalIndex: windowStart + i,
    }));

    return { currentIdx: idx, visibleWords: visible };
  }, [relativeWords, currentTimeSec]);

  if (!visibleWords.length) return null;

  const position = captions.position === 'top_center'
    ? { top: 60 } as const
    : { bottom: 80 } as const;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        ...position,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          backgroundColor: style.bgColor,
          padding: '14px 28px',
          borderRadius: 14,
          maxWidth: '85%',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {visibleWords.map((word, i) => {
          const isActive = word.isCurrent;
          const isHighlighted = word.highlight && (isActive || word.isPast);

          // Pop-in animation when word becomes current
          const wordRelFrame = Math.round(word.relStart * fps);
          const framesSinceWordStart = frame - wordRelFrame;
          const popScale = isActive
            ? spring({
                frame: Math.max(0, framesSinceWordStart),
                fps,
                config: { damping: 12, stiffness: 200, mass: 0.4 },
              })
            : 1;

          // Opacity: future words are invisible, past words dim
          let opacity: number;
          if (word.isFuture) {
            // Fade in slightly just before the word is spoken
            const framesUntil = wordRelFrame - frame;
            opacity = framesUntil < 3 ? interpolate(framesUntil, [0, 3], [0.3, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }) : 0;
          } else if (isActive) {
            opacity = 1.0;
          } else {
            // Past words
            opacity = 0.55;
          }

          // Scale: current word is slightly larger
          const scale = isActive ? popScale * 1.05 : 1.0;

          return (
            <span
              key={`${word.word}-${word.globalIndex}`}
              style={{
                fontFamily: "'Inter', 'SF Pro Display', sans-serif",
                fontSize: captions.fontSize,
                fontWeight: isHighlighted || isActive ? style.fontWeight : 600,
                color: isHighlighted
                  ? style.highlightColor
                  : isActive
                  ? '#FFFFFF'
                  : style.baseColor,
                transform: `scale(${scale})`,
                opacity,
                display: 'inline-block',
                textShadow: isActive
                  ? `0 0 24px ${style.highlightColor}60, 0 2px 8px rgba(0,0,0,0.5)`
                  : '0 1px 4px rgba(0,0,0,0.3)',
                transition: 'color 0.05s',
                lineHeight: 1.4,
              }}
            >
              {word.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
