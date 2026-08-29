import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCaptionLines, resolveCaptionWindow} from '../src/components/captionWindow';

const transcript = [
  {word: 'Your', start: 0.62, end: 0.9},
  {word: 'lead', start: 0.9, end: 1.16},
  {word: 'waits.', start: 1.16, end: 1.56},
  {word: 'Automate', start: 1.86, end: 2.08},
  {word: 'that', start: 2.08, end: 2.28},
  {word: 'handoff.', start: 2.28, end: 2.78},
];

test('caption gaps never fall back to the opening line', () => {
  assert.equal(resolveCaptionWindow(transcript, 0.2, 4), null);
  assert.equal(resolveCaptionWindow(transcript, 1.75, 4), null);
  assert.equal(resolveCaptionWindow(transcript, 3.1, 4), null);
});

test('a short decode boundary may hold the current line without changing identity', () => {
  const window = resolveCaptionWindow(transcript, 1.64, 4, 26, 0.12);
  assert.ok(window);
  assert.equal(window.activeWordIndex, 2);
  assert.deepEqual(window.line.words.map((item) => item.word), [
    'Your',
    'lead',
    'waits.',
  ]);
});

test('caption lines obey both word and character bounds', () => {
  const lines = buildCaptionLines(
    [
      {word: 'futuristic', start: 0, end: 0.2},
      {word: 'demonstrations', start: 0.2, end: 0.4},
      {word: 'while', start: 0.4, end: 0.6},
      {word: 'customers', start: 0.6, end: 0.8},
    ],
    4,
    28,
  );
  assert.deepEqual(lines.map((line) => line.words.map((word) => word.word)), [
    ['futuristic', 'demonstrations'],
    ['while', 'customers'],
  ]);
});
