import assert from 'node:assert/strict';
import test from 'node:test';
import {EDITORIAL_PALETTE as C, contrastRatio, relativeLuminance} from '../src/palette.ts';

test('actual full-opacity editorial text pairs exceed 4.5:1 contrast', () => {
  for (const [name, foreground, background] of [
    ['body', C.ink, C.paper], ['secondary', C.muted, C.paper],
    ['chapter', C.coral, C.paper], ['caption', C.white, C.ink],
    ['active caption', C.activeCaption, C.ink],
  ]) {
    const ratio = contrastRatio(foreground, background);
    assert.ok(ratio >= 4.5, `${name} measured ${ratio.toFixed(3)}:1`);
  }
});

test('contrast uses linearized sRGB and does not silently accept invalid colors', () => {
  assert.equal(relativeLuminance('#000000'), 0);
  assert.equal(relativeLuminance('#ffffff'), 1);
  assert.equal(contrastRatio('#000000', '#ffffff'), 21);
  assert.equal(contrastRatio('#abcdef', '#abcdef'), 1);
  assert.throws(() => relativeLuminance('red'), /six-digit/);
});
