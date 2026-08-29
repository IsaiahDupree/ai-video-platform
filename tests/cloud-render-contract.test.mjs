import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isPublicHttpsUrl,
  validateRenderRequest,
} from '../scripts/cloud-render-contract.mjs';

const validProps = () => ({
  hook: 'Your lead waits. Automate that handoff.',
  audioPath: 'https://example.com/audio.wav',
  audioSha256: 'a'.repeat(64),
  durationInFrames: 40 * 30,
  captionStartSeconds: 2.78,
  visualMode: 'lead_handoff',
  safeCaptionBottom: 230,
  cta: 'Pick one repeated task today and score it on frequency, waiting time, and proof.',
  ctaStartSeconds: 35.8,
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

test('accepts an exact audio-bound duration below the Shorts ceiling', () => {
  const inputProps = validProps();
  inputProps.durationInFrames = 52 * 30;
  inputProps.transcript[1] = {word: 'late', start: 51.2, end: 51.8};
  assert.deepEqual(
    validateRenderRequest({composition: 'IsaiahStyleReel', inputProps, quality: 'production'}),
    inputProps,
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

  const wrongHash = validProps();
  wrongHash.audioSha256 = 'not-a-sha';
  assert.throws(
    () => validateRenderRequest({composition: 'IsaiahStyleReel', inputProps: wrongHash, quality: 'production'}),
    /audioSha256/
  );
});

test('rejects timeline overflow and overlap', () => {
  const overflow = validProps();
  overflow.transcript[1] = {word: 'late', start: 40, end: 40.1};
  assert.throws(
    () => validateRenderRequest({composition: 'IsaiahStyleReel', inputProps: overflow, quality: 'production'}),
    /outside/
  );


  const tooLong = validProps();
  tooLong.durationInFrames = 59 * 30 + 1;
  assert.throws(
    () => validateRenderRequest({composition: 'IsaiahStyleReel', inputProps: tooLong, quality: 'production'}),
    /durationInFrames/
  );

  const missingDuration = validProps();
  delete missingDuration.durationInFrames;
  assert.throws(
    () => validateRenderRequest({composition: 'IsaiahStyleReel', inputProps: missingDuration, quality: 'production'}),
    /durationInFrames/
  );

  const lateCta = validProps();
  lateCta.ctaStartSeconds = 40;
  assert.throws(
    () => validateRenderRequest({composition: 'IsaiahStyleReel', inputProps: lateCta, quality: 'production'}),
    /ctaStartSeconds/
  );

  const captionAfterCta = validProps();
  captionAfterCta.captionStartSeconds = 36;
  assert.throws(
    () => validateRenderRequest({composition: 'IsaiahStyleReel', inputProps: captionAfterCta, quality: 'production'}),
    /captionStartSeconds/
  );

  const overlap = validProps();
  overlap.transcript[1] = {word: 'back', start: 0.2, end: 0.5};
  assert.throws(
    () => validateRenderRequest({composition: 'IsaiahStyleReel', inputProps: overlap, quality: 'production'}),
    /monotonic/
  );
});
