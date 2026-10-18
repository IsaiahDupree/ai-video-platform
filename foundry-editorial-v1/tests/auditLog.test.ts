import assert from 'node:assert/strict';
import test from 'node:test';
import {reconcileLayoutLog} from '../src/auditLog.ts';

const record = (frame: number, elements = 4) => `console.log EDITORIAL_LAYOUT_QC ${JSON.stringify({frame, passed: true, elements})}`;

test('coverage requires every captured frame, tolerating legitimate duplicate renders', () => {
  const r = reconcileLayoutLog([record(0), record(0), record(1), record(2)].join('\n'), 0, 2);
  assert.equal(r.passed, true);
  assert.equal(r.audited_frames, 3);
  assert.equal(r.duplicate_records, 1);
});

test('one missing interior frame fails even if first and final frames passed', () => {
  const r = reconcileLayoutLog([record(0), record(2)].join('\n'), 0, 2);
  assert.equal(r.passed, false);
  assert.deepEqual(r.missing_frames, [1]);
});

test('malformed, failed and empty-element audit records cannot certify coverage', () => {
  for (const line of ['EDITORIAL_LAYOUT_QC {oops}', 'EDITORIAL_LAYOUT_QC {"frame":0,"passed":false,"elements":4}', record(0, 0)]) {
    const r = reconcileLayoutLog(line, 0, 0);
    assert.equal(r.passed, false);
    assert.equal(r.invalid_records, 1);
  }
});

test('preview logs may contain an initialization frame outside the requested slice', () => {
  const r = reconcileLayoutLog([record(0), record(60), record(61)].join('\n'), 60, 61);
  assert.equal(r.passed, true);
  assert.equal(r.outside_range_records, 1);
});

test('no verbose audit messages is missing evidence, not a passing render audit', () => {
  const r = reconcileLayoutLog('Rendered 3 frames. Success.', 0, 2);
  assert.equal(r.passed, false);
  assert.equal(r.audited_frames, 0);
});
