/**
 * Utility to convert WhisperX output to Remotion caption format
 * 
 * WhisperX outputs JSON with structure:
 * {
 *   "segments": [
 *     {
 *       "words": [
 *         {"word": "hello", "start": 0.0, "end": 0.5, ...}
 *       ]
 *     }
 *   ]
 * }
 */

import {CaptionData} from '../types';

export interface WhisperXWord {
  word: string;
  start: number;
  end: number;
  score?: number;
}

export interface WhisperXSegment {
  words: WhisperXWord[];
  start: number;
  end: number;
  text: string;
}

export interface WhisperXOutput {
  segments: WhisperXSegment[];
}

/**
 * Converts WhisperX JSON output to Remotion CaptionData format
 */
export function whisperxToCaptions(whisperxData: WhisperXOutput): CaptionData {
  const words: CaptionData['words'] = [];

  for (const segment of whisperxData.segments) {
    for (const word of segment.words) {
      words.push({
        word: word.word.trim(),
        start: word.start,
        end: word.end,
      });
    }
  }

  return {words};
}

/**
 * Reads a WhisperX JSON file and converts it to CaptionData
 * Use this in Node.js scripts, not in Remotion components
 */
export async function loadWhisperxFile(filePath: string): Promise<CaptionData> {
  const fs = await import('fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');
  const data: WhisperXOutput = JSON.parse(content);
  return whisperxToCaptions(data);
}






