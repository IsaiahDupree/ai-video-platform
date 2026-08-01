// Proves the script-quality QC gate actually rejects a deliberately-broken script and
// accepts a well-formed one. Pure/deterministic — no network, no LLM, no filesystem
// beyond reading the static banned-phrases.json config.
// Run with: node --test retention-agent/tests/script-quality-gate.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runScriptQualityGate } from '../src/qc/script-quality-gate.ts';
import type { RetentionSection, ScriptDraft } from '../src/types.ts';

function makeSection(overrides: Partial<RetentionSection> = {}): RetentionSection {
  return {
    scene_id: 'sec',
    purpose: 'proof',
    spoken_text: 'This is a normal, reasonably specific sentence about the topic at hand.',
    visual_promise: 'Show a real dashboard screenshot.',
    retention_device: 'proof_reveal',
    open_loop: '',
    energy: 0.6,
    target_seconds: 10,
    flexible: true,
    actual_seconds: 10,
    ...overrides,
  };
}

function makeDraft(sections: RetentionSection[]): ScriptDraft {
  return {
    topic: 'test topic',
    target_duration_seconds: 60,
    tolerance_seconds: 5,
    style_skill_id: 'isaiah_high_retention_explainer',
    sections,
    created_at: new Date().toISOString(),
    converged: true,
    total_actual_seconds: sections.reduce((a, s) => a + (s.actual_seconds || 0), 0),
    iterations_log: [],
  };
}

test('DELIBERATELY BROKEN script: fails on generic AI language, weak hook, duplicate sections, missing retention tags', () => {
  const broken = makeDraft([
    makeSection({
      scene_id: 'hook',
      spoken_text: 'Hey everyone welcome back to the channel.', // no promise, no hook signal
    }),
    makeSection({
      scene_id: 'problem_a',
      spoken_text:
        'In today\'s fast-paced world, this is the best and most proven way to grow your channel, guaranteed.', // banned phrase + unsupported superlative
    }),
    makeSection({
      scene_id: 'problem_b',
      // Near-duplicate of problem_a in substance to trip the "advances the argument" check.
      spoken_text:
        'In today\'s fast-paced world, this is the best and most proven way to grow your channel guaranteed for sure.',
    }),
    makeSection({
      scene_id: 'broken_tags',
      purpose: '', // missing retention metadata
      visual_promise: '',
      retention_device: '',
      energy: 5, // out of [0,1] range
    }),
  ]);

  const result = runScriptQualityGate(broken);

  assert.equal(result.pass, false, 'gate must FAIL on a deliberately broken script');

  const rules = result.findings.map((f) => f.rule);
  assert.ok(rules.includes('opening_promise'), 'must flag missing opening promise');
  assert.ok(rules.includes('generic_ai_language'), 'must flag banned generic-AI phrase');
  assert.ok(rules.includes('section_advances_argument'), 'must flag near-duplicate sections');
  assert.ok(rules.includes('retention_tag_completeness'), 'must flag missing retention tags');

  const blockCount = result.findings.filter((f) => f.severity === 'block').length;
  assert.ok(blockCount >= 4, `expected at least 4 blocking findings, got ${blockCount}`);
});

test('WELL-FORMED script: passes with no blocking findings', () => {
  const good = makeDraft([
    makeSection({
      scene_id: 'hook',
      purpose: 'hook',
      retention_device: 'cold_open_promise',
      spoken_text: 'Here is how you will cut a ten-minute edit down to ninety seconds today.',
    }),
    makeSection({
      scene_id: 'problem',
      purpose: 'problem',
      spoken_text: 'Most editors waste hours scrubbing timelines looking for the one good take.',
    }),
    makeSection({
      scene_id: 'proof',
      purpose: 'proof',
      spoken_text:
        'We measured this across forty real projects and the search step alone ate one third of total edit time.',
    }),
    makeSection({
      scene_id: 'cta',
      purpose: 'cta',
      spoken_text: 'Try the search step on your next project and see the difference for yourself.',
    }),
  ]);

  const result = runScriptQualityGate(good);
  const blocking = result.findings.filter((f) => f.severity === 'block');
  assert.equal(blocking.length, 0, `expected no blocking findings, got: ${JSON.stringify(blocking)}`);
  assert.equal(result.pass, true);
});
