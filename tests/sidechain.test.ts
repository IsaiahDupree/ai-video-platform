/**
 * Unit tests for sidechain-core.ts and wordTimingsToSegments.ts
 * Run with: tsx --test tests/sidechain.test.ts
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { sidechainCore, vocalBoostCore, DEFAULT_DUCKING_CONFIG } from '../src/audio/sidechain-core';
import { wordTimingsToSegments } from '../src/audio/wordTimingsToSegments';
import type { SpeechSegment } from '../src/audio/ducking-types';

const SEG: SpeechSegment = { startFrame: 30, endFrame: 90 };
const CFG = { ...DEFAULT_DUCKING_CONFIG, attackFrames: 10, releaseFrames: 10, duckLevel: 0.1, fullLevel: 1.0 };

// ── sidechainCore ─────────────────────────────────────────────────────────────

describe('sidechainCore', () => {
  test('returns fullLevel before attack window', () => {
    const vol = sidechainCore(0, [SEG], CFG);
    assert.equal(vol, CFG.fullLevel);
  });

  test('begins attack at attackStart (segStart - attackFrames)', () => {
    // frame 20 = segStart(30) - attackFrames(10) → start of attack ramp
    const vol = sidechainCore(20, [SEG], CFG);
    assert.equal(vol, CFG.fullLevel);
  });

  test('is mid-attack between attackStart and segStart', () => {
    // frame 25 = halfway through 10-frame attack
    const vol = sidechainCore(25, [SEG], CFG);
    const expected = CFG.fullLevel + 0.5 * (CFG.duckLevel - CFG.fullLevel);
    assert(Math.abs(vol - expected) < 1e-9, `Expected ~${expected}, got ${vol}`);
  });

  test('is at duckLevel at segment start', () => {
    const vol = sidechainCore(SEG.startFrame, [SEG], CFG);
    assert.equal(vol, CFG.duckLevel);
  });

  test('holds duckLevel during segment', () => {
    const vol = sidechainCore(60, [SEG], CFG);
    assert.equal(vol, CFG.duckLevel);
  });

  test('is mid-release between segEnd and releaseEnd', () => {
    // frame 95 = 5 frames into 10-frame release
    const vol = sidechainCore(95, [SEG], CFG);
    const expected = CFG.duckLevel + 0.5 * (CFG.fullLevel - CFG.duckLevel);
    assert(Math.abs(vol - expected) < 1e-9, `Expected ~${expected}, got ${vol}`);
  });

  test('returns fullLevel after release', () => {
    const vol = sidechainCore(SEG.endFrame + CFG.releaseFrames + 1, [SEG], CFG);
    assert.equal(vol, CFG.fullLevel);
  });

  test('returns fullLevel when enabled=false', () => {
    const vol = sidechainCore(60, [SEG], { ...CFG, enabled: false });
    assert.equal(vol, CFG.fullLevel);
  });

  test('handles empty segments array', () => {
    const vol = sidechainCore(60, [], CFG);
    assert.equal(vol, CFG.fullLevel);
  });

  test('handles attackFrames=0 (instant duck)', () => {
    const vol = sidechainCore(30, [SEG], { ...CFG, attackFrames: 0 });
    assert.equal(vol, CFG.duckLevel);
  });
});

// ── lookaheadFrames ───────────────────────────────────────────────────────────

describe('sidechainCore with lookaheadFrames', () => {
  const LOOK = 5;
  const cfg = { ...CFG, lookaheadFrames: LOOK };

  test('attack starts earlier: segStart - lookahead - attackFrames', () => {
    // Attack should start at 30 - 5 - 10 = 15
    const before = sidechainCore(14, [SEG], cfg);
    assert.equal(before, CFG.fullLevel);
    // At frame 15, attack begins (still at fullLevel at t=0)
    const atStart = sidechainCore(15, [SEG], cfg);
    assert.equal(atStart, CFG.fullLevel);
  });

  test('music is at duckLevel at lookahead frames before segment start', () => {
    // Attack completes at 30 - 5 = 25; music held ducked from 25 to 30
    const vol = sidechainCore(SEG.startFrame - LOOK, [SEG], cfg);
    assert.equal(vol, CFG.duckLevel);
  });

  test('music is at duckLevel when segment starts (pre-ducked)', () => {
    const vol = sidechainCore(SEG.startFrame, [SEG], cfg);
    assert.equal(vol, CFG.duckLevel);
  });

  test('lookaheadFrames=0 matches original behavior', () => {
    const withZero = sidechainCore(25, [SEG], { ...CFG, lookaheadFrames: 0 });
    const withNone = sidechainCore(25, [SEG], CFG);
    assert.equal(withZero, withNone);
  });
});

// ── vocalBoostCore ────────────────────────────────────────────────────────────

describe('vocalBoostCore', () => {
  const BOOST = 1.4;
  const cfg = { ...CFG, vocalBoostLevel: BOOST };

  test('returns 1.0 outside any segment', () => {
    assert.equal(vocalBoostCore(0, [SEG], cfg), 1.0);
    assert.equal(vocalBoostCore(200, [SEG], cfg), 1.0);
  });

  test('returns full boost during segment', () => {
    assert.equal(vocalBoostCore(60, [SEG], cfg), BOOST);
  });

  test('returns 1.0 when vocalBoostLevel=1.0 (no-op)', () => {
    assert.equal(vocalBoostCore(60, [SEG], { ...cfg, vocalBoostLevel: 1.0 }), 1.0);
  });

  test('ramps in during attack phase', () => {
    const vol = vocalBoostCore(25, [SEG], cfg); // mid-attack
    const expected = 1.0 + 0.5 * (BOOST - 1.0);
    assert(Math.abs(vol - expected) < 1e-9, `Expected ~${expected}, got ${vol}`);
  });

  test('ramps out during release phase', () => {
    const vol = vocalBoostCore(95, [SEG], cfg); // 5 frames into 10-frame release
    const expected = BOOST + 0.5 * (1.0 - BOOST);
    assert(Math.abs(vol - expected) < 1e-9, `Expected ~${expected}, got ${vol}`);
  });
});

// ── wordTimingsToSegments ─────────────────────────────────────────────────────

describe('wordTimingsToSegments', () => {
  const FPS = 30;

  test('empty input returns empty array', () => {
    assert.deepEqual(wordTimingsToSegments([], FPS), []);
  });

  test('single word maps to correct frames', () => {
    const segs = wordTimingsToSegments([{ word: 'hello', start: 1.0, end: 1.5 }], FPS);
    assert.equal(segs.length, 1);
    assert.equal(segs[0].startFrame, 30);
    assert.equal(segs[0].endFrame, 45);
  });

  test('adjacent words (gap < threshold) merge into one segment', () => {
    const words = [
      { word: 'hello', start: 0.0, end: 0.5 },
      { word: 'world', start: 0.6, end: 1.0 },
    ];
    const segs = wordTimingsToSegments(words, FPS);
    assert.equal(segs.length, 1);
    assert.equal(segs[0].startFrame, 0);
    assert.equal(segs[0].endFrame, 30);
  });

  test('words with gap > threshold produce separate segments', () => {
    const words = [
      { word: 'hello', start: 0.0, end: 0.5 },
      { word: 'world', start: 2.0, end: 2.5 },
    ];
    const segs = wordTimingsToSegments(words, FPS);
    assert.equal(segs.length, 2);
    assert.equal(segs[0].endFrame, 15);
    assert.equal(segs[1].startFrame, 60);
  });

  test('three words: two adjacent then a gap', () => {
    const words = [
      { word: 'a', start: 0.0, end: 0.3 },
      { word: 'b', start: 0.4, end: 0.7 },
      { word: 'c', start: 2.0, end: 2.3 },
    ];
    const segs = wordTimingsToSegments(words, FPS);
    assert.equal(segs.length, 2);
    assert.equal(segs[0].startFrame, 0);
    assert.equal(segs[0].endFrame, 21); // round(0.7 * 30)
    assert.equal(segs[1].startFrame, 60);
  });

  test('unsorted input is handled correctly', () => {
    const words = [
      { word: 'world', start: 1.0, end: 1.5 },
      { word: 'hello', start: 0.0, end: 0.4 },
    ];
    const segs = wordTimingsToSegments(words, FPS);
    assert.equal(segs.length, 2);
    assert.equal(segs[0].startFrame, 0);
    assert.equal(segs[1].startFrame, 30);
  });
});
