import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isPublicHttpsUrl,
  validateRenderRequest,
} from '../scripts/cloud-render-contract.mjs';

const validProps = () => ({
  hook: 'Your lead waits. Automate that handoff.',
  audioPath: 'https://example.com/audio.wav',
  visualMode: 'lead_handoff',
  safeCaptionBottom: 230,
  cta: 'Pick one repeated task today and score it on frequency, waiting time, and proof.',
  points: ['Frequency', 'Waiting time', 'Proof'],
  transcript: [
    {word: 'Your', start: 0, end: 0.4},
    {word: 'lead', start: 0.4, end: 0.8},
  ],
});

test('rejects unsafe caption placement and unknown visual stories', () => {
  const unsafe = validProps();
  unsafe.safeCaptionBottom = 90;
  assert.throws(
    () => validateRenderRequest({composition: 'IsaiahStyleReel', inputProps: unsafe, quality: 'production'}),
    /180 to 360/
  );

  const unknown = validProps();
  unknown.visualMode = 'invented_story';
  assert.throws(
    () => validateRenderRequest({composition: 'IsaiahStyleReel', inputProps: unknown, quality: 'production'}),
    /visualMode/
  );
});

test('accepts the exact IsaiahStyleReel contract', () => {
  assert.deepEqual(
    validateRenderRequest({
      composition: 'IsaiahStyleReel',
      inputProps: validProps(),
      quality: 'production',
    }),
    validProps()
  );
});

test('rejects unregistered compositions and qualities', () => {
  assert.throws(
    () => validateRenderRequest({composition: 'BriefComposition', inputProps: validProps(), quality: 'production'}),
    /not allowed/
  );
  assert.throws(
    () => validateRenderRequest({composition: 'IsaiahStyleReel', inputProps: validProps(), quality: 'ultra'}),
    /quality/
  );
});

test('rejects insecure and local audio resources', () => {
  for (const audioPath of [
    'http://example.com/audio.wav',
    'https://localhost/audio.wav',
    'https://127.0.0.1/audio.wav',
    'https://192.168.1.10/audio.wav',
    'https://[::1]/audio.wav',
  ]) {
    const inputProps = validProps();
    inputProps.audioPath = audioPath;
    assert.throws(
      () => validateRenderRequest({composition: 'IsaiahStyleReel', inputProps, quality: 'production'}),
      /public HTTPS/
    );
  }
  assert.equal(isPublicHttpsUrl('https://example.com/audio.wav'), true);
});

test('rejects timeline overflow and overlap', () => {
  const overflow = validProps();
  overflow.transcript[1] = {word: 'late', start: 40, end: 40.1};
  assert.throws(
    () => validateRenderRequest({composition: 'IsaiahStyleReel', inputProps: overflow, quality: 'production'}),
    /outside/
  );

  const overlap = validProps();
  overlap.transcript[1] = {word: 'back', start: 0.2, end: 0.5};
  assert.throws(
    () => validateRenderRequest({composition: 'IsaiahStyleReel', inputProps: overlap, quality: 'production'}),
    /monotonic/
  );
});
