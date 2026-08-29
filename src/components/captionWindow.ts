export interface TimedCaptionWord {
  word: string;
  start: number;
  end: number;
}

export interface CaptionLine<T extends TimedCaptionWord = TimedCaptionWord> {
  startIndex: number;
  words: T[];
}

export interface CaptionWindow<T extends TimedCaptionWord = TimedCaptionWord> {
  activeWordIndex: number;
  lineIndex: number;
  line: CaptionLine<T>;
}

export const buildCaptionLines = <T extends TimedCaptionWord>(
  transcript: T[],
  maxWordsPerLine: number,
  maxCharactersPerLine = 26,
): CaptionLine<T>[] => {
  if (!Number.isInteger(maxWordsPerLine) || maxWordsPerLine < 1) {
    throw new Error('maxWordsPerLine must be a positive integer');
  }
  if (!Number.isInteger(maxCharactersPerLine) || maxCharactersPerLine < 8) {
    throw new Error('maxCharactersPerLine must be an integer of at least 8');
  }

  const lines: CaptionLine<T>[] = [];
  let words: T[] = [];
  let characters = 0;
  let startIndex = 0;

  const flush = () => {
    if (words.length === 0) return;
    lines.push({startIndex, words});
    startIndex += words.length;
    words = [];
    characters = 0;
  };

  transcript.forEach((word) => {
    const nextCharacters = characters + (words.length > 0 ? 1 : 0) + word.word.length;
    const previousWord = words.length > 0 ? words[words.length - 1] : null;
    const crossesPauseBoundary =
      previousWord !== null && word.start - previousWord.end > 0.22;
    if (
      words.length > 0 &&
      (
        words.length >= maxWordsPerLine ||
        nextCharacters > maxCharactersPerLine ||
        crossesPauseBoundary
      )
    ) {
      flush();
    }
    characters += (words.length > 0 ? 1 : 0) + word.word.length;
    words.push(word);
  });
  flush();
  return lines;
};

export const resolveCaptionWindow = <T extends TimedCaptionWord>(
  transcript: T[],
  currentTime: number,
  maxWordsPerLine: number,
  maxCharactersPerLine = 26,
  gapHoldSeconds = 0.12,
): CaptionWindow<T> | null => {
  if (transcript.length === 0 || !Number.isFinite(currentTime)) return null;

  let activeWordIndex = transcript.findIndex(
    (word) => currentTime >= word.start && currentTime < word.end,
  );

  if (activeWordIndex < 0) {
    let previousWordIndex = -1;
    for (let index = transcript.length - 1; index >= 0; index -= 1) {
      if (transcript[index].end <= currentTime) {
        previousWordIndex = index;
        break;
      }
    }
    if (
      previousWordIndex < 0 ||
      currentTime - transcript[previousWordIndex].end > gapHoldSeconds
    ) {
      return null;
    }
    activeWordIndex = previousWordIndex;
  }

  const lines = buildCaptionLines(
    transcript,
    maxWordsPerLine,
    maxCharactersPerLine,
  );
  const lineIndex = lines.findIndex(
    (line) =>
      activeWordIndex >= line.startIndex &&
      activeWordIndex < line.startIndex + line.words.length,
  );
  if (lineIndex < 0) return null;

  return {
    activeWordIndex,
    lineIndex,
    line: lines[lineIndex],
  };
};
