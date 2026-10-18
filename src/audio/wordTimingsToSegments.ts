import type { SpeechSegment } from './ducking-types';

export interface WordTimingInput {
  word: string;
  start: number; // seconds
  end: number;   // seconds
}

/**
 * Convert word-level timestamps (seconds) to SpeechSegment frames.
 * Adjacent or overlapping words are merged into contiguous segments.
 *
 * @param wordTimings    - Array of word timestamps from ElevenLabs / Whisper
 * @param fps            - Frames per second of the composition
 * @param gapThreshold   - Max gap (seconds) between words before starting a new segment
 */
export function wordTimingsToSegments(
  wordTimings: WordTimingInput[],
  fps: number,
  gapThreshold = 0.3,
): SpeechSegment[] {
  if (wordTimings.length === 0) return [];

  const sorted = [...wordTimings].sort((a, b) => a.start - b.start);
  const segments: SpeechSegment[] = [];

  let segStart = sorted[0].start;
  let segEnd = sorted[0].end;

  for (let i = 1; i < sorted.length; i++) {
    const w = sorted[i];
    if (w.start - segEnd <= gapThreshold) {
      segEnd = Math.max(segEnd, w.end);
    } else {
      segments.push({
        startFrame: Math.round(segStart * fps),
        endFrame: Math.round(segEnd * fps),
      });
      segStart = w.start;
      segEnd = w.end;
    }
  }

  segments.push({
    startFrame: Math.round(segStart * fps),
    endFrame: Math.round(segEnd * fps),
  });

  return segments;
}
