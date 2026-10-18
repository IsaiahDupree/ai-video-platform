import type { WordTiming } from './TikTokCaptions';

/** Keep the nearby caption during pauses; never replay the opening at the end. */
export function captionWindow(
  transcript: WordTiming[],
  currentTime: number,
  maxWordsVisible: number,
): { currentWordIndex: number; startIdx: number; endIdx: number } | null {
  if (
    transcript.length === 0 ||
    currentTime < transcript[0].start ||
    currentTime >= transcript[transcript.length - 1].end
  ) return null;

  const currentWordIndex = transcript.findIndex(
    (word) => currentTime >= word.start && currentTime < word.end,
  );
  const nextWordIndex = transcript.findIndex((word) => word.start > currentTime);
  const anchorIndex = currentWordIndex >= 0
    ? currentWordIndex
    : nextWordIndex < 0 ? transcript.length - 1 : nextWordIndex - 1;
  const startIdx = Math.max(0, anchorIndex - Math.floor(maxWordsVisible / 2));
  return {
    currentWordIndex,
    startIdx,
    endIdx: Math.min(transcript.length, startIdx + maxWordsVisible),
  };
}
