import assert from 'node:assert/strict';
import test from 'node:test';
import {containsRect, intersection, validateLayout, validateTimelineSegments, type LayoutMeasurement} from '../src/geometry.ts';

const options = {width: 1920, height: 1080};
const box = (id: string, x = 100, y = 200, width = 300, height = 100): LayoutMeasurement => ({
  id, zone: 'content', rect: {x, y, width, height}, ancestorIds: [],
});
const codes = (items: LayoutMeasurement[]) => validateLayout(items, options).map((f) => f.code);

test('edge contact is permitted while genuine overlap is rejected', () => {
  assert.equal(intersection(box('a').rect, box('b', 400).rect).width, 0);
  assert.deepEqual(codes([box('a'), box('b', 400)]), []);
  assert.ok(codes([box('a'), box('b', 399)]).includes('element_overlap'));
});

test('caption and content zones are separate; a moved caption is caught', () => {
  const caption = {...box('caption', 100, 890, 1000, 70), zone: 'caption'};
  assert.deepEqual(codes([box('art', 100, 200, 1000, 600), caption]), []);
  assert.ok(codes([{...caption, rect: {...caption.rect, y: 800}}]).includes('outside_zone'));
});

test('actual ancestor nesting is permitted, unrelated matching zones are not', () => {
  const parent = box('card', 100, 200, 1000, 500);
  const child = {...box('title', 125, 225, 500, 70), ancestorIds: ['card']};
  assert.deepEqual(codes([parent, child]), []);
  assert.ok(codes([parent, {...child, ancestorIds: []}]).includes('element_overlap'));
  assert.ok(codes([parent, {...child, rect: {...child.rect, x: 50}}]).includes('outside_parent'));
});

test('two siblings cannot overlap even when both are inside an allowed parent', () => {
  const parent = box('card', 100, 200, 1000, 500);
  const left = {...box('left', 125, 225, 500, 70), ancestorIds: ['card']};
  const right = {...box('right', 600, 225, 300, 70), ancestorIds: ['card']};
  assert.ok(codes([parent, left, right]).includes('element_overlap'));
});

test('overflow and individual rendered text line bounds both fail independently', () => {
  const text = {...box('title'), textRects: [{x: 105, y: 205, width: 290, height: 40}], fontSize: 40, minimumFontSize: 28};
  assert.deepEqual(codes([text]), []);
  assert.ok(codes([{...text, overflowY: 20}]).includes('scroll_overflow'));
  assert.ok(codes([{...text, textRects: [{x: 105, y: 205, width: 400, height: 40}]}]).includes('text_outside_box'));
});

test('minimum font is enforced against the smallest rendered descendant', () => {
  const text = {...box('caption'), textRects: [box('line').rect], fontSize: 27, minimumFontSize: 28};
  assert.ok(codes([text]).includes('font_too_small'));
  assert.ok(codes([{...text, fontSize: Number.NaN}]).includes('font_too_small'));
});

test('bad IDs, empty annotations, unknown zones and invalid rectangles fail', () => {
  assert.ok(codes([]).includes('no_visible_elements'));
  assert.ok(codes([box('a'), box('a', 500)]).includes('duplicate_or_empty_id'));
  assert.ok(codes([{...box('a'), zone: 'invented'}]).includes('unknown_zone'));
  assert.ok(codes([box('a', Number.NaN)]).includes('invalid_bounds'));
  assert.ok(codes([box('a', 100, 200, -2)]).includes('invalid_bounds'));
});

test('subpixel tolerance allows tiny raster rounding but not a hidden overflow', () => {
  const outer = {x: 0, y: 0, width: 100, height: 100};
  assert.equal(containsRect(outer, {x: 0, y: 0, width: 100.4, height: 100}), true);
  assert.equal(containsRect(outer, {x: 0, y: 0, width: 101, height: 100}), false);
});

test('scene timeline covers every frame exactly once using exclusive ends', () => {
  const scenes = [{id: 'a', startFrame: 0, endFrame: 60}, {id: 'b', startFrame: 60, endFrame: 120}];
  assert.deepEqual(validateTimelineSegments(scenes, 120), []);
  assert.ok(validateTimelineSegments([{...scenes[0], endFrame: 61}, scenes[1]], 120).some((f) => f.code === 'timeline_overlap'));
  assert.ok(validateTimelineSegments([scenes[0], {...scenes[1], startFrame: 61}], 120).some((f) => f.code === 'timeline_gap'));
  assert.ok(validateTimelineSegments(scenes, 121).some((f) => f.code === 'timeline_tail_gap'));
});

test('caption silences are allowed but timing reversals, fractional frames and spill are rejected', () => {
  const captions = [{id: 'a', startFrame: 10, endFrame: 40}, {id: 'b', startFrame: 60, endFrame: 110}];
  assert.deepEqual(validateTimelineSegments(captions, 120, false), []);
  for (const bad of [
    {id: 'bad', startFrame: 40, endFrame: 39},
    {id: 'bad', startFrame: 10.5, endFrame: 20},
    {id: 'bad', startFrame: 10, endFrame: 121},
  ]) assert.ok(validateTimelineSegments([bad], 120, false).some((f) => f.code === 'invalid_segment'));
});
