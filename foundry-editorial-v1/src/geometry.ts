/** Pure layout and timeline validation. Coordinates are composition pixels. */
export type Rect = {x: number; y: number; width: number; height: number};
export type LayoutFinding = {code: string; ids: string[]; detail: string};
export type LayoutMeasurement = {
  id: string;
  zone: string;
  rect: Rect;
  ancestorIds: string[];
  textRects?: Rect[];
  fontSize?: number;
  minimumFontSize?: number;
  overflowX?: number;
  overflowY?: number;
};

export const EDITORIAL_ZONES: Record<string, Rect> = {
  header: {x: 72, y: 72, width: 1776, height: 73},
  content: {x: 72, y: 188, width: 1776, height: 648},
  caption: {x: 72, y: 882, width: 1776, height: 102},
  footer: {x: 72, y: 1012, width: 1776, height: 34},
};

export const isFiniteRect = (r: Rect): boolean =>
  [r.x, r.y, r.width, r.height].every(Number.isFinite) && r.width > 0 && r.height > 0;

export const containsRect = (outer: Rect, inner: Rect, tolerance = 0.5): boolean =>
  inner.x >= outer.x - tolerance && inner.y >= outer.y - tolerance &&
  inner.x + inner.width <= outer.x + outer.width + tolerance &&
  inner.y + inner.height <= outer.y + outer.height + tolerance;

export const intersection = (a: Rect, b: Rect): Rect => ({
  x: Math.max(a.x, b.x),
  y: Math.max(a.y, b.y),
  width: Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)),
  height: Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)),
});

export function validateLayout(
  measurements: LayoutMeasurement[],
  {width, height, zones = EDITORIAL_ZONES, tolerance = 0.5}: {
    width: number; height: number; zones?: Record<string, Rect>; tolerance?: number;
  },
): LayoutFinding[] {
  const findings: LayoutFinding[] = [];
  const add = (code: string, ids: string[], detail: string) => findings.push({code, ids, detail});
  const canvas = {x: 0, y: 0, width, height};
  const byId = new Map<string, LayoutMeasurement>();
  if (!isFiniteRect(canvas)) add('invalid_canvas', [], 'Canvas dimensions must be finite and positive.');
  if (!measurements.length) add('no_visible_elements', [], 'No visible semantic elements were measured.');
  for (const m of measurements) {
    if (!m.id.trim() || byId.has(m.id)) add('duplicate_or_empty_id', [m.id], 'Every visible element needs a unique nonempty ID.');
    byId.set(m.id, m);
    if (!isFiniteRect(m.rect)) {
      add('invalid_bounds', [m.id], 'Element bounds must be finite and positive.');
      continue;
    }
    if (!containsRect(canvas, m.rect, tolerance)) add('outside_canvas', [m.id], 'Element leaves the video canvas.');
    if (!zones[m.zone]) add('unknown_zone', [m.id], `Unknown layout zone: ${m.zone}`);
    else if (!containsRect(zones[m.zone], m.rect, tolerance)) add('outside_zone', [m.id], `Element leaves its ${m.zone} zone.`);
    if ((m.overflowX ?? 0) > tolerance || (m.overflowY ?? 0) > tolerance) {
      add('scroll_overflow', [m.id], `Content exceeds its box by ${m.overflowX ?? 0}px horizontally and ${m.overflowY ?? 0}px vertically.`);
    }
    if (m.textRects && !m.textRects.length) add('empty_text_measurement', [m.id], 'A visible text container has no measurable text.');
    for (const textRect of m.textRects ?? []) {
      if (!isFiniteRect(textRect) || !containsRect(m.rect, textRect, tolerance)) {
        add('text_outside_box', [m.id], 'A rendered text line leaves its container.');
        break;
      }
    }
    if (m.textRects && (!Number.isFinite(m.fontSize) || !Number.isFinite(m.minimumFontSize) ||
        (m.fontSize ?? 0) < (m.minimumFontSize ?? 0))) {
      add('font_too_small', [m.id], `Measured ${m.fontSize}px; required ${m.minimumFontSize}px.`);
    }
  }
  for (let i = 0; i < measurements.length; i++) {
    const a = measurements[i];
    for (const ancestorId of a.ancestorIds) {
      const ancestor = byId.get(ancestorId);
      if (ancestor && !containsRect(ancestor.rect, a.rect, tolerance)) {
        add('outside_parent', [a.id, ancestor.id], 'Nested element leaves its annotated parent.');
      }
    }
    for (let j = i + 1; j < measurements.length; j++) {
      const b = measurements[j];
      // Only actual DOM ancestry permits intentional nesting. Same names,
      // zones, CSS classes, or z-index never waive a collision.
      if (a.ancestorIds.includes(b.id) || b.ancestorIds.includes(a.id)) continue;
      const overlap = intersection(a.rect, b.rect);
      if (overlap.width > tolerance && overlap.height > tolerance) {
        add('element_overlap', [a.id, b.id], `Visible boxes overlap by ${overlap.width.toFixed(2)} × ${overlap.height.toFixed(2)}px.`);
      }
    }
  }
  return findings;
}

export type TimelineSegment = {id: string; startFrame: number; endFrame: number};

/** End frames are exclusive. Pass requireCoverage=false for intermittent captions. */
export function validateTimelineSegments(
  segments: TimelineSegment[], durationFrames: number, requireCoverage = true,
): LayoutFinding[] {
  const findings: LayoutFinding[] = [];
  const add = (code: string, ids: string[], detail: string) => findings.push({code, ids, detail});
  if (!Number.isInteger(durationFrames) || durationFrames <= 0) {
    return [{code: 'invalid_duration', ids: [], detail: 'Duration must be a positive integer number of frames.'}];
  }
  const ids = new Set<string>();
  for (let i = 0; i < segments.length; i++) {
    const current = segments[i];
    if (!current.id.trim() || ids.has(current.id)) add('duplicate_or_empty_id', [current.id], 'Timeline IDs must be unique and nonempty.');
    ids.add(current.id);
    if (!Number.isInteger(current.startFrame) || !Number.isInteger(current.endFrame) ||
        current.startFrame < 0 || current.endFrame > durationFrames || current.endFrame <= current.startFrame) {
      add('invalid_segment', [current.id], 'Segment bounds must be ordered integer frames inside the timeline.');
    }
    const previous = segments[i - 1];
    if (previous && current.startFrame < previous.endFrame) add('timeline_overlap', [previous.id, current.id], 'Segments overlap or are out of order.');
    if (requireCoverage && current.startFrame !== (previous?.endFrame ?? 0)) add('timeline_gap', [current.id], 'The scene timeline must cover every frame once.');
  }
  if (requireCoverage && (!segments.length || segments.at(-1)!.endFrame !== durationFrames)) {
    add('timeline_tail_gap', [], 'The last scene must reach the end of the composition.');
  }
  return findings;
}
