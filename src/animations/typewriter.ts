import { interpolate, Easing } from 'remotion';

export interface TypewriterOptions {
  text: string;
  durationInFrames: number;
  delay?: number;
  cursorBlinkRate?: number; // frames per blink cycle
  showCursor?: boolean;
}

export function typewriter(
  frame: number,
  options: TypewriterOptions
): { visibleText: string; showCursor: boolean } {
  const {
    text,
    durationInFrames,
    delay = 0,
    cursorBlinkRate = 15,
    showCursor = true,
  } = options;

  const adjustedFrame = Math.max(0, frame - delay);
  
  const progress = interpolate(
    adjustedFrame,
    [0, durationInFrames],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.linear,
    }
  );

  const charCount = Math.floor(progress * text.length);
  const visibleText = text.slice(0, charCount);

  // Cursor blinks
  const cursorVisible = showCursor && 
    (adjustedFrame < durationInFrames || Math.floor(adjustedFrame / cursorBlinkRate) % 2 === 0);

  return {
    visibleText,
    showCursor: cursorVisible,
  };
}

export interface TypewriterByWordOptions {
  words: string[];
  durationInFrames: number;
  delay?: number;
  pauseBetweenWords?: number; // frames to pause between words
}

export function typewriterByWord(
  frame: number,
  options: TypewriterByWordOptions
): string[] {
  const {
    words,
    durationInFrames,
    delay = 0,
    pauseBetweenWords = 3,
  } = options;

  const adjustedFrame = Math.max(0, frame - delay);
  const totalWords = words.length;
  const framesPerWord = (durationInFrames - (pauseBetweenWords * (totalWords - 1))) / totalWords;

  const visibleWords: string[] = [];
  let currentFrame = 0;

  for (let i = 0; i < totalWords; i++) {
    if (adjustedFrame >= currentFrame) {
      visibleWords.push(words[i]);
    }
    currentFrame += framesPerWord + pauseBetweenWords;
  }

  return visibleWords;
}
