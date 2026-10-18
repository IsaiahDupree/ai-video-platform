import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {activeScene, captionsFromWords, validateTimeline, type Scene, type Word} from '../src/timeline.ts';

const episode = JSON.parse(readFileSync(new URL('../examples/ai-demand-2026-10-04.json', import.meta.url), 'utf8')) as {
  scenes: Scene[]; words: Word[]; duration: number;
};
const sentenceEnd = /[.!?][”"']?$/;

test('real episode retains all 410 exact approved aligned words in sequence', () => {
  const captions = captionsFromWords(episode.words);
  const reproduced = captions.flatMap((c) => c.words);
  assert.equal(episode.words.length, 410);
  assert.deepEqual(reproduced, episode.words);
  // Independently pinned from the approved October 4 voice-alignment receipt.
  assert.equal(createHash('sha256').update(reproduced.map((w) => w.text).join(' ')).digest('hex'),
    '4d5700147b55118a4b86472f4f0a940acfc548e89edace571f9d74910ab1cedf');
});

test('captions respect sentences, phrase capacity, ordering and every spoken interval', () => {
  const captions = captionsFromWords(episode.words);
  for (let i = 0; i < captions.length; i++) {
    const caption = captions[i];
    assert.ok(caption.words.length <= 11);
    assert.ok(caption.words.map((w) => w.text).join(' ').length <= 68);
    assert.ok(caption.words.slice(0, -1).every((w) => !sentenceEnd.test(w.text)));
    assert.equal(caption.start, caption.words[0].start);
    assert.ok(caption.end >= caption.words.at(-1)!.end);
    assert.ok(!captions[i + 1] || caption.end <= captions[i + 1].start);
    for (const word of caption.words) assert.ok(word.start >= caption.start && word.end <= caption.end);
  }
});

test('every frame of the actual 4626-frame timeline has exactly one scene', () => {
  validateTimeline(episode.scenes, episode.words, episode.duration);
  const frames = Math.ceil(episode.duration * 30);
  assert.equal(frames, 4626);
  for (let frame = 0; frame < frames; frame++) {
    const time = frame / 30;
    assert.equal(episode.scenes.filter((s) => time >= s.start && time < s.end).length, 1, `Frame ${frame}`);
    assert.ok(activeScene(episode.scenes, time));
  }
  assert.equal(activeScene(episode.scenes, (frames - 1) / 30).id, 'scene-13');
});

test('all actual scenes identify evidence or interpretation and a visual treatment', () => {
  const illustrationIds = new Set(['usable-artifacts', 'connected-workflow', 'creative-output', 'weekly-report', 'meal-plan']);
  const diagramKinds = new Set(['growth', 'compare', 'flow', 'checkpoint', 'takeaway']);
  for (const scene of episode.scenes) {
    assert.ok(scene.source.trim(), scene.id);
    assert.ok(scene.title.trim() && scene.subtitle.trim() && scene.chapter.trim(), scene.id);
    if (diagramKinds.has(scene.kind)) assert.ok(scene.items.length >= 2, scene.id);
    else assert.ok(scene.image && illustrationIds.has(scene.image), scene.id);
  }
  assert.deepEqual(new Set(episode.scenes.flatMap((s) => s.image ? [s.image] : [])), illustrationIds);
});

test('validator rejects missing narration, nonfinite timing and malformed scene coverage', () => {
  assert.throws(() => validateTimeline(episode.scenes, [], episode.duration), /words/);
  for (const invalid of [Number.NaN, Number.POSITIVE_INFINITY, 0, -1]) {
    assert.throws(() => validateTimeline(episode.scenes, episode.words, invalid), /Duration/);
  }
  const badWord = [{...episode.words[0], start: Number.NaN}, ...episode.words.slice(1)];
  assert.throws(() => validateTimeline(episode.scenes, badWord, episode.duration), /alignment/);
  const badScene = [{...episode.scenes[0], end: Number.NaN}, ...episode.scenes.slice(1)];
  assert.throws(() => validateTimeline(badScene, episode.words, episode.duration), /Gap\/overlap/);
  assert.throws(() => validateTimeline([{...episode.scenes[0], id: ''}, ...episode.scenes.slice(1)], episode.words, episode.duration), /ID/);
});
