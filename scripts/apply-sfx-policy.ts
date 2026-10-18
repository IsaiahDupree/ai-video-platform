#!/usr/bin/env npx tsx
/**
 * Apply SFX Policy Engine
 *
 * Converts visual reveals to SFX events with policy enforcement.
 * Part of the two-pass rendering pipeline:
 * 1. Render with seed reveals
 * 2. Convert reveals to SFX with policy
 * 3. Mix audio and re-render
 *
 * Usage:
 *   npx tsx scripts/apply-sfx-policy.ts --reveals reveals.json --manifest manifest.json --output events.json
 *   npx tsx scripts/apply-sfx-policy.ts --events events.json --validate
 */

import * as fs from 'fs';
import * as path from 'path';
import { MacroCuesEngine, REVEAL_TO_MACRO_CUE, MACRO_CUE_LIBRARY } from '../src/audio/macro-cues';
import { PolicyValidator } from '../src/audio/policy-validator';

interface VisualReveal {
  t: number;
  kind: string;
  key?: string;
  beatId?: string;
}

interface VisualReveals {
  version: string;
  fps: number;
  reveals: VisualReveal[];
}

interface SfxItem {
  id: string;
  file: string;
  tags: string[];
  description: string;
}

interface SfxManifest {
  version: string;
  items: SfxItem[];
}

interface AudioEvent {
  type: string;
  [key: string]: any;
}

interface AudioEvents {
  fps: number;
  events: AudioEvent[];
}

// =============================================================================
// Main Functions
// =============================================================================

function loadReveals(filePath: string): VisualReveals {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function loadManifest(filePath: string): SfxManifest {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function loadEvents(filePath: string): AudioEvents {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function revealToSfxEvent(reveal: VisualReveal, fps: number): any {
  const macro = REVEAL_TO_MACRO_CUE[reveal.kind as any];
  if (!macro) return null;

  const config = MACRO_CUE_LIBRARY[macro];
  const frame = Math.round(reveal.t * fps);

  return {
    type: 'sfx',
    sfxId: config.sfxIds[0],
    frame,
    volume: config.baseIntensity,
  };
}

function applyMacroCuesPolicy(revealsPath: string, manifestPath: string): AudioEvents {
  const reveals = loadReveals(revealsPath);
  const manifest = loadManifest(manifestPath);

  // Create manifest map
  const manifestMap = new Map<string, string>();
  for (const item of manifest.items) {
    manifestMap.set(item.id, item.file);
    // Also add by common aliases
    for (const tag of item.tags) {
      if (!manifestMap.has(tag)) {
        manifestMap.set(tag, item.file);
      }
    }
  }

  // Create engine and set manifest
  const engine = new MacroCuesEngine();
  engine.setManifest(manifestMap);

  // Convert reveals to SFX events
  const sfxEvents = engine.convertRevealsToSfx(reveals);

  return {
    fps: reveals.fps,
    events: sfxEvents,
  };
}

function validatePolicy(eventsPath: string): boolean {
  const events = loadEvents(eventsPath);
  const validator = new PolicyValidator();
  const report = validator.validate(events);

  console.log('\n📊 Policy Validation Report:');
  console.log(`  Total SFX Events: ${report.statistics.totalEvents}`);
  console.log(`  Avg Gap: ${report.statistics.avgGapSec.toFixed(2)}s`);
  console.log(`  Min Gap: ${report.statistics.minGapSec.toFixed(2)}s`);
  console.log(`  Max Density: ${report.statistics.maxDensityZone} events`);

  if (report.violations.length > 0) {
    console.log(`\n  ⚠️  ${report.violations.length} Policy Violations:`);
    for (const v of report.violations.slice(0, 10)) {
      console.log(`    [${v.type}] @ ${v.time.toFixed(2)}s - ${v.message}`);
    }
    if (report.violations.length > 10) {
      console.log(`    ... and ${report.violations.length - 10} more`);
    }
  } else {
    console.log('\n  ✅ All policy rules passed!');
  }

  return report.isValid;
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
SFX Policy Engine

Usage:
  npx tsx scripts/apply-sfx-policy.ts --reveals reveals.json --manifest manifest.json --output events.json
  npx tsx scripts/apply-sfx-policy.ts --events events.json --validate

Options:
  --reveals FILE      Load visual reveals from JSON
  --manifest FILE     Load SFX manifest from JSON
  --output FILE       Write output events to file
  --events FILE       Load audio events for validation
  --validate          Validate events against policy
`);
    return;
  }

  // Apply policy mode
  if (args.includes('--reveals') && args.includes('--manifest')) {
    const revealsIdx = args.indexOf('--reveals');
    const manifestIdx = args.indexOf('--manifest');
    const outputIdx = args.indexOf('--output');

    const revealsFile = args[revealsIdx + 1];
    const manifestFile = args[manifestIdx + 1];
    const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : null;

    if (!revealsFile || !manifestFile) {
      console.error('Error: --reveals and --manifest are required');
      process.exit(1);
    }

    try {
      console.log('🔄 Applying SFX policy...');
      const events = applyMacroCuesPolicy(revealsFile, manifestFile);

      if (outputFile) {
        fs.writeFileSync(outputFile, JSON.stringify(events, null, 2));
        console.log(`✅ SFX events written to: ${outputFile}`);
      } else {
        console.log(JSON.stringify(events, null, 2));
      }

      console.log(`\n📈 Generated ${events.events.length} SFX events`);
    } catch (err) {
      console.error(`Error: ${err}`);
      process.exit(1);
    }

    return;
  }

  // Validate mode
  if (args.includes('--validate') && args.includes('--events')) {
    const eventsIdx = args.indexOf('--events');
    const eventsFile = args[eventsIdx + 1];

    if (!eventsFile) {
      console.error('Error: --events is required for --validate');
      process.exit(1);
    }

    try {
      const isValid = validatePolicy(eventsFile);
      process.exit(isValid ? 0 : 1);
    } catch (err) {
      console.error(`Error: ${err}`);
      process.exit(1);
    }

    return;
  }

  console.error('Error: Please specify --reveals/--manifest or --events/--validate');
  process.exit(1);
}

main().catch(console.error);
