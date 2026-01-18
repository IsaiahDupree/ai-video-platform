import type { TimelineEvent, TimelineQA, BeatAction } from './audio-types';

// =============================================================================
// Timeline QA Report Builder
// =============================================================================

const MIN_GAP = 0.35;           // Seconds - "too fast to read"
const DENSE_WINDOW = 3.0;       // Seconds
const DENSE_THRESHOLD = 6;      // Events inside window = dense zone

export function buildTimelineQA(
  events: TimelineEvent[], 
  durationSec: number
): TimelineQA {
  const sorted = [...events].sort((a, b) => a.t - b.t);
  const gaps: number[] = [];
  const gapWarnings: TimelineQA['gapWarnings'] = [];

  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].t - sorted[i - 1].t;
    gaps.push(gap);
    if (gap < MIN_GAP) {
      gapWarnings.push({ 
        a: sorted[i - 1].name, 
        b: sorted[i].name, 
        gap: Number(gap.toFixed(3)) 
      });
    }
  }

  const minGapSec = gaps.length ? Math.min(...gaps) : 0;
  const avgGapSec = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;

  // Dense zones detection
  const denseZones: TimelineQA['denseZones'] = [];
  let left = 0;
  for (let right = 0; right < sorted.length; right++) {
    while (sorted[right].t - sorted[left].t > DENSE_WINDOW) left++;
    const count = right - left + 1;
    if (count >= DENSE_THRESHOLD) {
      // Check if this zone overlaps with existing
      const zone = {
        start: Number(sorted[left].t.toFixed(3)),
        end: Number(sorted[right].t.toFixed(3)),
        count
      };
      const lastZone = denseZones[denseZones.length - 1];
      if (!lastZone || zone.start > lastZone.end) {
        denseZones.push(zone);
      } else if (zone.count > lastZone.count) {
        denseZones[denseZones.length - 1] = zone;
      }
    }
  }

  // Action counts
  const actionCounts: Record<string, number> = {};
  for (const e of sorted) {
    actionCounts[e.action] = (actionCounts[e.action] ?? 0) + 1;
  }

  return {
    version: '1.0.0',
    totalEvents: sorted.length,
    durationSec: Number(durationSec.toFixed(2)),
    minGapSec: Number(minGapSec.toFixed(3)),
    avgGapSec: Number(avgGapSec.toFixed(3)),
    denseZones,
    actionCounts,
    gapWarnings
  };
}

// =============================================================================
// CLI
// =============================================================================

if (require.main === module) {
  const fs = require('fs');
  const path = require('path');
  
  const root = process.cwd();
  const eventsPath = path.join(root, 'data', 'timeline.events.json');
  
  if (!fs.existsSync(eventsPath)) {
    console.error(`Missing: ${eventsPath}`);
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'));
  const events = data.events as TimelineEvent[];
  
  // Estimate duration from last event + buffer
  const maxT = events.reduce((m, e) => Math.max(m, e.t), 0);
  const durationSec = maxT + 2; // 2s buffer
  
  const qa = buildTimelineQA(events, durationSec);
  
  const outPath = path.join(root, 'data', 'qa.timeline_report.json');
  fs.writeFileSync(outPath, JSON.stringify(qa, null, 2));
  console.log(`✅ Wrote ${outPath}`);
}
