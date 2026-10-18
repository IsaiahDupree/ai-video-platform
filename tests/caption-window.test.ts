import assert from 'node:assert/strict';
import test from 'node:test';
import { captionWindow } from '../src/components/caption-window.ts';

const transcript = [
  { word: 'First', start: 1, end: 2 },
  { word: 'second', start: 2, end: 3 },
  { word: 'third', start: 3, end: 4 },
  { word: 'fourth', start: 4, end: 5 },
  { word: 'last', start: 7, end: 8 },
];

test('captions stay absent before speech and after the final word', () => {
  assert.equal(captionWindow([], 0, 3), null);
  assert.equal(captionWindow(transcript, 0.5, 3), null);
  assert.equal(captionWindow(transcript, 8, 3), null);
  assert.equal(captionWindow(transcript, 12, 3), null);
});

test('a pause keeps the current passage instead of returning to the opening', () => {
  const window = captionWindow(transcript, 6, 3)!;
  assert.equal(window.currentWordIndex, -1);
  assert.deepEqual(transcript.slice(window.startIdx, window.endIdx).map((word) => word.word), ['third', 'fourth', 'last']);
});

test('the active word remains highlighted through exact caption boundaries', () => {
  assert.equal(captionWindow(transcript, 1, 3)?.currentWordIndex, 0);
  assert.equal(captionWindow(transcript, 2, 3)?.currentWordIndex, 1);
  assert.equal(captionWindow(transcript, 7.9, 3)?.currentWordIndex, 4);
});
