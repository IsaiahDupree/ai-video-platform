import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LEAD_HANDOFF_SCENE_BOUNDARIES,
  resolveExclusiveSceneOpacity,
} from '../src/components/sceneWindow';

test('lead-handoff scene boundaries are strictly increasing', () => {
  for (let index = 1; index < LEAD_HANDOFF_SCENE_BOUNDARIES.length; index += 1) {
    assert.ok(
      LEAD_HANDOFF_SCENE_BOUNDARIES[index] > LEAD_HANDOFF_SCENE_BOUNDARIES[index - 1],
    );
  }
});

test('adjacent lead-handoff scenes never render together', () => {
  for (let sample = 0; sample <= 35_500; sample += 1) {
    const time = sample / 1000;
    const visibleScenes = LEAD_HANDOFF_SCENE_BOUNDARIES.slice(0, -1)
      .map((start, index) => resolveExclusiveSceneOpacity(
        time,
        start,
        LEAD_HANDOFF_SCENE_BOUNDARIES[index + 1],
      ))
      .filter((opacity) => opacity > 0);

    assert.ok(visibleScenes.length <= 1, `overlap at ${time.toFixed(3)}s`);
  }
});

test('scene opacity fails closed outside a valid exclusive window', () => {
  assert.equal(resolveExclusiveSceneOpacity(-1, 0, 1), 0);
  assert.equal(resolveExclusiveSceneOpacity(1, 0, 1), 0);
  assert.equal(resolveExclusiveSceneOpacity(0.5, 1, 1), 0);
  assert.equal(resolveExclusiveSceneOpacity(0.5, 0, 1, 0), 0);
});
