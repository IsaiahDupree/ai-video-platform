// Proves the technical-quality QC gate actually catches a deliberately-broken render —
// real ffmpeg-synthesized fixtures (a black segment, a frozen segment, clipped audio),
// real ffmpeg/ffprobe analysis, no mocking of the detection logic. Also proves it does
// NOT false-positive on a clean synthetic render with none of those defects.
// Run with: node --test retention-agent/tests/technical-quality-gate.test.ts
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { runTechnicalQualityGate } from '../src/qc/technical-quality-gate.ts';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'retention-agent-qc-fixtures-'));
const badPath = path.join(tmpDir, 'bad.mp4');
const goodPath = path.join(tmpDir, 'good.mp4');

before(() => {
  // BAD fixture: 1s of real motion, 2s solid black (black-frame trigger), 2.5s solid
  // blue frozen hold (freeze trigger, distinct from the black segment so we know the
  // two detectors are firing independently), 1s more motion — 6.5s total video.
  // Audio: a sine wave driven 30dB hot so it hard-clips at digital full scale.
  execFileSync('ffmpeg', [
    '-y',
    '-f', 'lavfi', '-i', 'testsrc2=s=320x240:r=25:d=1,format=yuv420p',
    '-f', 'lavfi', '-i', 'color=c=black:s=320x240:r=25:d=2,format=yuv420p',
    '-f', 'lavfi', '-i', 'color=c=blue:s=320x240:r=25:d=2.5,format=yuv420p',
    '-f', 'lavfi', '-i', 'testsrc2=s=320x240:r=25:d=1,format=yuv420p',
    '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=44100:duration=6.5',
    '-filter_complex', '[0:v][1:v][2:v][3:v]concat=n=4:v=1:a=0[v]',
    '-map', '[v]', '-map', '4:a',
    '-af', 'volume=30dB',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
    badPath,
  ], { stdio: 'pipe' });

  // GOOD fixture: continuous motion (testsrc2 constantly changes pixels — no black, no
  // freeze), clean sine-wave audio at a safe, unclipped level.
  execFileSync('ffmpeg', [
    '-y',
    '-f', 'lavfi', '-i', 'testsrc2=s=320x240:r=25:d=6.5,format=yuv420p',
    '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=44100:duration=6.5',
    '-af', 'volume=-12dB',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
    goodPath,
  ], { stdio: 'pipe' });
});

after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('DELIBERATELY BROKEN render: technical-quality gate fails and names all three real defects', () => {
  const result = runTechnicalQualityGate(badPath, 6.5);

  assert.equal(result.pass, false, 'gate must FAIL on a render with black/frozen/clipped defects');

  const rules = result.findings.map((f) => f.rule);
  assert.ok(rules.includes('black_frame_detection'), `expected black_frame_detection, got rules: ${rules.join(', ')}`);
  assert.ok(rules.includes('frozen_frame_detection'), `expected frozen_frame_detection, got rules: ${rules.join(', ')}`);
  assert.ok(rules.includes('audio_clipping_detection'), `expected audio_clipping_detection, got rules: ${rules.join(', ')}`);

  console.log('  bad-fixture findings:');
  for (const f of result.findings) console.log(`    [${f.severity}] ${f.rule}: ${f.detail}`);
});

test('CLEAN render: technical-quality gate passes with no black/frozen/clipping findings', () => {
  const result = runTechnicalQualityGate(goodPath, 6.5);

  const badRules = result.findings
    .map((f) => f.rule)
    .filter((r) => ['black_frame_detection', 'frozen_frame_detection', 'audio_clipping_detection'].includes(r));
  assert.equal(badRules.length, 0, `expected no defect findings on the clean fixture, got: ${JSON.stringify(result.findings)}`);
  assert.equal(result.pass, true, `expected the clean fixture to pass, findings: ${JSON.stringify(result.findings)}`);
});

test('MISSING FILE: real ffprobe failure propagates as a real error, never a silent fake pass', () => {
  assert.throws(() => runTechnicalQualityGate(path.join(tmpDir, 'does-not-exist.mp4'), 6.5));
});
