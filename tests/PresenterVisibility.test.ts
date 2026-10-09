import {test} from 'node:test';
import assert from 'node:assert/strict';
import {presenterPictureWindows, validatePresenterVisibilityWindows} from '../src/lib/PresenterVisibility.ts';

test('a short founder bridge uses source-time windows inside the full narration duration', () => {
  const presenter = {hold_frame: false, windows: [], visibility_windows: [[5, 12]] as [number, number][]};
  assert.deepEqual(presenterPictureWindows(presenter, 55, 25), [[5, 12]]);
  assert.deepEqual(validatePresenterVisibilityWindows([[0, 5], [5, 12], [50, 55]], 55, 25), [[0, 5], [5, 12], [50, 55]]);
});

test('omitting windows preserves both legacy presentation modes; explicit empty hides picture', () => {
  assert.deepEqual(presenterPictureWindows({hold_frame: false, windows: []}, 55, 25), [[0, 55]]);
  assert.deepEqual(presenterPictureWindows({hold_frame: true, windows: [[5, 12]]}, 55, 25), [[5, 12]]);
  assert.deepEqual(presenterPictureWindows({hold_frame: false, windows: [], visibility_windows: []}, 55, 25), []);
  assert.throws(() => presenterPictureWindows({hold_frame: true, windows: [], visibility_windows: [[5, 12]]}, 55, 25), /opaque presenter plate/);
});

test('reject malformed, overlapping, out-of-bounds and sub-frame visibility before rendering', () => {
  for (const windows of [null, {}, [[true, 2]], [[0, '2']], [[0, NaN]], [[0, Infinity]], [[0, 1, 2]],
    [[-1, 2]], [[2, 2]], [[3, 2]], [[0, 56]], [[5, 12], [10, 20]], [[5, 12], [0, 3]], [[5, 5.001]], [[0, 1e308]],
    Array.from({length: 129}, () => [0, 1])]) {
    assert.throws(() => validatePresenterVisibilityWindows(windows, 55, 25), String(windows));
  }
  for (const duration of [0, -1, NaN, Infinity, 1e308]) {
    assert.throws(() => validatePresenterVisibilityWindows([[5, 12]], duration, 25));
  }
  for (const fps of [0, -1, 25.5, 121]) assert.throws(() => validatePresenterVisibilityWindows([[5, 12]], 55, fps));
  assert.throws(() => validatePresenterVisibilityWindows([[5, 12]], 10, 25), /measured duration/);
});
