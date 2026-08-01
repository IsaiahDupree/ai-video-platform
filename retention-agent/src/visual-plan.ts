// B-roll / visual-change ruleset (PRD Phase 1, item 3).
//
// Reuses the EXISTING, pure, tested `solveDurations` frame-exact apportioner from
// src/lib/DurationSolver.ts (found already in this repo — not reinvented here) to turn
// each retention section's FIXED, measured narration duration into a sequence of visual
// "beats" (scene-type + duration), enforcing:
//   - FULL COVERAGE: every second of the section's real (measured) audio duration is
//     assigned to some visual beat — no silent timeline gaps. A long section (e.g. a
//     25s main-point) needs AS MANY capped-duration beats as it takes to cover the
//     whole span, not just one extra "interrupt" beat (a fixed-beat-count version of
//     this shipped first and was caught for real: solveDurations correctly reported
//     `underfilled` for anything longer than ~2 beats' worth of max caps, and the
//     uncovered remainder rendered as an unbroken static background — which the
//     technical-quality gate's freeze detector correctly caught as a genuine defect,
//     e.g. one 17s gap on a real 122s render).
//   - maximum_unchanged_talking_head_seconds: no single visual beat holds longer than
//     the style skill's cap.
//   - pattern-interrupt spacing: interrupts (chapter_card/stat/curiosity_gap/
//     kinetic_caption) fire at >= minimum_spacing_seconds apart, and are FORCED once
//     maximum_spacing_seconds has elapsed since the last one — checked continuously
//     across beat boundaries AND within long sections, never "cut every 2s blindly"
//     per the research doc's explicit warning.
//
// Every decision is logged with its reason (VisualEvent.reason) so this is auditable,
// not a black box.
import type { StyleSkill, RetentionSection, EditPlan, VisualEvent } from './types.ts';
import { solveDurations, SECTION_DURATION_DEFAULTS } from '../../src/lib/DurationSolver.ts';
import type { SectionSpec, DurationBudget, SectionType } from '../../src/types/ContentBrief';

interface Beat {
  id: string;
  sceneType: SectionType;
  reason: string;
  isPatternInterrupt: boolean;
}

function extractNumber(text: string): number | null {
  const m = text.match(/\d[\d,]*(\.\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0].replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function shortKeyPhrase(text: string, maxWords = 8): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, maxWords).join(' ');
}

function titleCase(s: string): string {
  return s
    .split(/[_\s]+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

const SAFETY_MAX_BEATS_PER_SECTION = 40;

export function buildEditPlan(
  sections: RetentionSection[],
  styleSkill: StyleSkill,
  fps = 30
): EditPlan {
  const events: VisualEvent[] = [];
  let cursor = 0;
  let lastInterruptEndTime = -Infinity;
  let patternInterruptCount = 0;
  let maxUnchangedObserved = 0;
  let chapterNumber = 0;

  const maxUnchanged = styleSkill.pacing.maximum_unchanged_talking_head_seconds;
  const minSpacing = styleSkill.pacing.pattern_interrupts.minimum_spacing_seconds;
  const maxSpacing = styleSkill.pacing.pattern_interrupts.maximum_spacing_seconds;

  sections.forEach((section, sIdx) => {
    const isFirstSection = sIdx === 0;
    const isLastSection = sIdx === sections.length - 1;
    const dur = section.actual_seconds!;
    const purposeChanged = sIdx > 0 && sections[sIdx - 1].purpose !== section.purpose;

    const beats: Beat[] = [];
    // `virtualElapsed` is a running estimate (each beat's own max cap, refined to exact
    // seconds by solveDurations below) used ONLY to decide pattern-interrupt spacing
    // while we're still choosing beat TYPES — it does not affect final timing.
    let virtualElapsed = cursor;

    const pushBeat = (sceneType: SectionType, reason: string, isPatternInterrupt: boolean) => {
      beats.push({ id: `${section.scene_id}_b${beats.length}`, sceneType, reason, isPatternInterrupt });
      virtualElapsed += beatCap(sceneType, maxUnchanged);
      if (isPatternInterrupt) lastInterruptEndTime = virtualElapsed;
    };

    // Trailing beats are decided up front so the coverage loop below can reserve their
    // share of the section's total duration.
    const trailing: Beat[] = [];
    if (section.purpose === 'cta') {
      trailing.push({ id: `${section.scene_id}_cta`, sceneType: 'cta', reason: 'cta-purpose section maps to cta scene', isPatternInterrupt: false });
    }
    if (isLastSection) {
      const ctaMin = SECTION_DURATION_DEFAULTS.cta.min;
      const endScreenMin = SECTION_DURATION_DEFAULTS.end_screen.min;
      const alreadyReserved = trailing.reduce((s, b) => s + beatCap(b.sceneType, maxUnchanged), 0);
      // A short final cta section (its real measured duration can land anywhere —
      // it's a `flexible: false` section_shape entry but still gets rebalanced during
      // the script engine's global convergence pass) may not have room for BOTH a cta
      // beat and a separate end_screen beat at their combined floor durations. Found
      // for real on a 2.37s final cta section (cta floor 1.5 + end_screen floor 2.0 =
      // 3.5 > 2.37 — solveDurations correctly reported infeasible rather than silently
      // overrunning). Prefer the cta beat (it's this section's actual retention-tagged
      // content); only add end_screen if it genuinely fits.
      if (dur >= alreadyReserved + endScreenMin + 0.05) {
        trailing.push({ id: `${section.scene_id}_end`, sceneType: 'end_screen', reason: 'final section closes on end_screen', isPatternInterrupt: false });
      } else if (trailing.length === 0) {
        // Not a cta section but still too short for its own end_screen floor — should
        // not happen given section_shape's cta percent is always >= end_screen's floor
        // share, but never silently drop final-screen coverage if it does.
        trailing.push({ id: `${section.scene_id}_end`, sceneType: 'end_screen', reason: 'final section closes on end_screen (only viable trailing beat)', isPatternInterrupt: false });
      }
    }
    const trailingCap = trailing.reduce((s, b) => s + beatCap(b.sceneType, maxUnchanged), 0);

    // Leading beat.
    if (isFirstSection) {
      pushBeat('hook', 'first section always opens on hook', false);
    }

    // Core coverage loop — the only part that must guarantee full duration coverage.
    // cta-purpose sections are short by section_shape design and fully represented by
    // the trailing cta beat itself, so they skip the core loop.
    if (section.purpose !== 'cta') {
      let guard = 0;
      // Tiny epsilon, not a generous one: any positive remainder still needs SOME beat
      // to cover it (a solver beat can shrink to its own `min`, well under a second),
      // and undershooting here — even by ~0.05s — is exactly the bug that produced a
      // real 17s uncovered gap on a long section (see file header). Better to add one
      // extra near-floor beat than leave any real gap for solveDurations to reject.
      while (dur - (virtualElapsed - cursor) - trailingCap > 1e-6 && guard < SAFETY_MAX_BEATS_PER_SECTION) {
        const sinceLastInterrupt = virtualElapsed - lastInterruptEndTime;
        const isFirstCoreBeat = guard === 0;
        const wantsChapterCard = isFirstCoreBeat && purposeChanged && !isFirstSection && sinceLastInterrupt >= minSpacing;
        const forcedInterrupt = sinceLastInterrupt >= maxSpacing;

        if (wantsChapterCard) {
          pushBeat(
            'chapter_card',
            `purpose changed (${sections[sIdx - 1].purpose} -> ${section.purpose}) and ${sinceLastInterrupt.toFixed(1)}s >= min spacing ${minSpacing}s`,
            true
          );
        } else if (forcedInterrupt) {
          const interruptType = chooseInterruptType(section);
          pushBeat(
            interruptType,
            `forced: ${sinceLastInterrupt.toFixed(1)}s since last interrupt >= max spacing ${maxSpacing}s`,
            true
          );
        } else {
          pushBeat('topic', isFirstCoreBeat ? 'default talking-point visual' : `talking-point visual continued (beat ${guard + 1} — section duration ${dur.toFixed(1)}s > single-beat cap ${beatCap('topic', maxUnchanged)}s)`, false);
        }
        guard++;
      }
      if (guard >= SAFETY_MAX_BEATS_PER_SECTION) {
        // Should be unreachable at any realistic section length, but never silently
        // under-cover the timeline — surface it loudly instead.
        throw new Error(`buildEditPlan: section "${section.scene_id}" (${dur.toFixed(1)}s) needed more than ${SAFETY_MAX_BEATS_PER_SECTION} beats to cover — check maximum_unchanged_talking_head_seconds.`);
      }
    }

    beats.push(...trailing);

    // ── Solve exact durations for these beats via the existing DurationSolver ──
    const specs: SectionSpec[] = beats.map((b) => {
      const def = SECTION_DURATION_DEFAULTS[b.sceneType];
      const cap = beatCap(b.sceneType, maxUnchanged);
      return {
        id: b.id,
        sectionType: b.sceneType,
        content: section.spoken_text,
        priority: b.isPatternInterrupt ? 2 : 1, // must-keep primary beats, droppable-if-forced interrupts
        minSec: Math.min(def.min, cap),
        maxSec: cap,
      };
    });
    const budget: DurationBudget = { totalSec: dur, fps, wpm: styleSkill.voice.speech_rate_wpm };
    const solved = solveDurations(specs, budget);

    if (solved.underfilled || !solved.feasible) {
      throw new Error(
        `buildEditPlan: solveDurations could not exactly cover section "${section.scene_id}" (${dur.toFixed(1)}s) with ${beats.length} beats — feasible=${solved.feasible} underfilled=${solved.underfilled} notes=${solved.notes.join('; ')}`
      );
    }

    solved.sections.forEach((solvedBeat) => {
      const beat = beats.find((b) => b.id === solvedBeat.id)!;
      const start = cursor + solvedBeat.startTimeSec;
      events.push({
        section_id: section.scene_id,
        start_time_sec: start,
        duration_sec: solvedBeat.durationSec,
        scene_type: beat.sceneType,
        reason: beat.reason,
        is_pattern_interrupt: beat.isPatternInterrupt,
        content: buildContent(beat.sceneType, section, chapterNumber),
      });
      maxUnchangedObserved = Math.max(maxUnchangedObserved, solvedBeat.durationSec);
      if (beat.isPatternInterrupt) {
        patternInterruptCount++;
        lastInterruptEndTime = start + solvedBeat.durationSec; // now exact, not the estimate
      }
      if (beat.sceneType === 'chapter_card') chapterNumber++;
    });

    cursor += dur;
  });

  return {
    topic: '',
    total_duration_sec: cursor,
    events,
    pattern_interrupt_count: patternInterruptCount,
    max_unchanged_seconds_observed: maxUnchangedObserved,
  };
}

function beatCap(sceneType: SectionType, maxUnchanged: number): number {
  const def = SECTION_DURATION_DEFAULTS[sceneType];
  // Talking-head-equivalent types are governed by the style skill's cap; other scene
  // types keep their own (usually shorter) natural max from the solver's policy table.
  if (sceneType === 'topic' || sceneType === 'hook') return Math.min(def.max, maxUnchanged);
  return def.max;
}

function chooseInterruptType(section: RetentionSection): SectionType {
  const num = extractNumber(section.spoken_text);
  if (num !== null && section.purpose === 'proof') return 'stat';
  if (section.open_loop && section.open_loop.trim().length > 0) return 'curiosity_gap';
  return 'kinetic_caption';
}

function buildContent(
  sceneType: SectionType,
  section: RetentionSection,
  chapterNumber: number
): Record<string, unknown> {
  switch (sceneType) {
    case 'hook':
      return {
        type: 'hook',
        text: shortKeyPhrase(section.spoken_text, 12),
        subtext: section.visual_promise,
        style: 'claim',
      };
    case 'cta':
      return {
        type: 'cta',
        title: shortKeyPhrase(section.spoken_text, 10),
        action_text: 'Watch the next one',
      };
    case 'end_screen':
      return {
        type: 'end_screen',
        subscribe_text: 'Subscribe for the next build',
      };
    case 'chapter_card':
      return {
        type: 'chapter_card',
        number: chapterNumber + 1,
        title: titleCase(section.purpose),
        subtitle: section.visual_promise,
      };
    case 'stat': {
      const num = extractNumber(section.spoken_text) ?? 0;
      return {
        type: 'stat',
        value: num,
        label: shortKeyPhrase(section.visual_promise, 6),
        context: section.purpose,
      };
    }
    case 'curiosity_gap':
      return {
        type: 'curiosity_gap',
        setup: section.visual_promise,
        reveal: section.open_loop || shortKeyPhrase(section.spoken_text, 10),
      };
    case 'kinetic_caption':
      return {
        type: 'kinetic_caption',
        text: shortKeyPhrase(section.spoken_text, 8),
        caption_style: 'centered',
      };
    case 'topic':
    default:
      return {
        type: 'topic',
        heading: titleCase(section.purpose),
        body_text: section.visual_promise,
        bullet_points: [],
      };
  }
}
