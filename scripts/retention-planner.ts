/**
 * retention-planner.ts
 *
 * Ensures something happens on screen at regular intervals to maximize retention.
 * Default: event every 3 seconds.
 *
 * Builds a section array with visual events distributed evenly across the video duration,
 * mapped to proven retention-driving scene types based on content context.
 *
 * Usage:
 *   import { planRetention, retentionSectionsToTimeline } from './retention-planner';
 */

import { Section, SectionContent } from '../src/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RetentionEventType =
  | 'hook_flash'        // Bold text slam-in
  | 'stat_reveal'       // Animated number
  | 'caption_burst'     // Karaoke caption highlight
  | 'problem_drop'      // Problem statement drop-in
  | 'solution_reveal'   // Solution text reveal
  | 'social_proof'      // Metric or testimonial flash
  | 'cta_pulse'         // CTA button pulse
  | 'curiosity_gap'     // Setup → reveal tension
  | 'checklist_tick';   // Checklist item check

export interface RetentionEvent {
  time_sec: number;
  duration_sec: number;
  type: RetentionEventType;
  content: string;
  subtext?: string;
}

export interface RetentionPlan {
  events: RetentionEvent[];
  total_duration_sec: number;
  events_per_interval: number;
  event_count: number;
}

// ─── Content point templates ──────────────────────────────────────────────────

/**
 * Given content points (key claims, stats, steps), distribute them across the timeline
 * with retention events every `interval_sec` seconds.
 */
export function planRetention(
  duration_sec: number,
  content_points: string[],
  options: {
    interval_sec?: number;  // seconds between events (default: 3)
    hook_duration?: number; // seconds for hook events (default: 2)
    lead_in_sec?: number;   // skip first N seconds (for hook section, default: 2)
  } = {}
): RetentionPlan {
  const interval = options.interval_sec ?? 3;
  const hookDur = options.hook_duration ?? 2;
  const leadIn = options.lead_in_sec ?? 2;

  // Number of event slots in the usable window
  const usableWindow = duration_sec - leadIn - 1; // leave 1s at end for CTA
  const slotCount = Math.max(1, Math.floor(usableWindow / interval));

  const events: RetentionEvent[] = [];
  const points = [...content_points];

  // Event type rotation — keeps visual variety
  const typeRotation: RetentionEventType[] = [
    'caption_burst',
    'stat_reveal',
    'problem_drop',
    'solution_reveal',
    'checklist_tick',
    'curiosity_gap',
    'social_proof',
    'hook_flash',
  ];

  for (let i = 0; i < slotCount; i++) {
    const time = leadIn + i * interval;
    if (time + hookDur > duration_sec - 1) break;

    const type = typeRotation[i % typeRotation.length];
    const content = points[i % points.length] || `Point ${i + 1}`;

    events.push({
      time_sec: time,
      duration_sec: hookDur,
      type,
      content,
    });
  }

  return {
    events,
    total_duration_sec: duration_sec,
    events_per_interval: interval,
    event_count: events.length,
  };
}

// ─── Convert retention events → Section objects ───────────────────────────────

export function retentionEventToSection(
  event: RetentionEvent,
  index: number
): Section {
  const id = `retention_${index}_${event.type}`;

  const contentMap: Record<RetentionEventType, SectionContent> = {
    hook_flash: {
      type: 'hook',
      text: event.content,
      subtext: event.subtext,
      style: 'claim',
    } as any,
    stat_reveal: {
      type: 'stat',
      value: parseFloat(event.content.replace(/[^0-9.]/g, '')) || 0,
      label: event.content.replace(/[0-9.]+/, '').trim() || event.content,
      supporting_text: event.subtext,
    } as any,
    caption_burst: {
      type: 'kinetic_caption',
      text: event.content,
      caption_style: 'tiktok',
    } as any,
    problem_drop: {
      type: 'problem_solution',
      problem: event.content,
      solution: event.subtext || '→',
      layout: 'sequential',
    } as any,
    solution_reveal: {
      type: 'problem_solution',
      problem: event.subtext || '...',
      solution: event.content,
      layout: 'sequential',
      problem_hold_percent: 0.2,
    } as any,
    social_proof: {
      type: 'social_proof',
      headline: event.content,
      style: 'number',
    } as any,
    cta_pulse: {
      type: 'cta',
      title: event.content,
      action_text: event.subtext || 'Learn more',
    } as any,
    curiosity_gap: {
      type: 'curiosity_gap',
      setup: event.content,
      reveal: event.subtext || '↓',
    } as any,
    checklist_tick: {
      type: 'checklist',
      items: [{ text: event.content, checked: true }],
      reveal_mode: 'sequential',
    } as any,
  };

  return {
    id,
    type: contentMap[event.type].type as any,
    duration_sec: event.duration_sec,
    start_time_sec: event.time_sec,
    content: contentMap[event.type],
  };
}

// ─── Full timeline builder ────────────────────────────────────────────────────

/**
 * Build a complete section timeline for a video given:
 * - hook section (first 3s)
 * - retention events every interval_sec
 * - cta at the end (last 5s)
 */
export function buildRetentionTimeline(options: {
  duration_sec: number;
  hook_text: string;
  content_points: string[];
  cta_text: string;
  cta_subtext?: string;
  interval_sec?: number;
  hook_duration_sec?: number;
  cta_duration_sec?: number;
}): Section[] {
  const {
    duration_sec,
    hook_text,
    content_points,
    cta_text,
    cta_subtext,
    interval_sec = 3,
    hook_duration_sec = 3,
    cta_duration_sec = 5,
  } = options;

  const sections: Section[] = [];

  // 1. Hook — always first
  sections.push({
    id: 'hook',
    type: 'hook',
    duration_sec: hook_duration_sec,
    start_time_sec: 0,
    content: {
      type: 'hook',
      text: hook_text,
      style: 'claim',
    } as any,
  });

  // 2. Retention events in the middle
  const plan = planRetention(duration_sec - cta_duration_sec, content_points, {
    interval_sec,
    hook_duration: Math.min(2.5, interval_sec - 0.5),
    lead_in_sec: hook_duration_sec,
  });

  for (let i = 0; i < plan.events.length; i++) {
    sections.push(retentionEventToSection(plan.events[i], i));
  }

  // 3. CTA — always last
  sections.push({
    id: 'cta',
    type: 'cta',
    duration_sec: cta_duration_sec,
    start_time_sec: duration_sec - cta_duration_sec,
    content: {
      type: 'cta',
      title: cta_text,
      action_text: cta_subtext || 'Link in bio',
    } as any,
  });

  return sections;
}
