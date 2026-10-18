#!/usr/bin/env npx tsx
/**
 * Comprehensive angle test — generates scripts for ALL relationship contexts:
 *   1. Personal / Friendship (friend, old friend, crush, family)
 *   2. Professional Networking (coworker, networking contact)
 *   3. Business / Client / Sales (client, prospect, mentor)
 *   4. App Feature / Product (warmth score, voice notes, card scan)
 *
 * Each angle maps to an offer file, audience category, awareness stage,
 * hook formula, and creative angle context.
 *
 * Usage:
 *   npx tsx scripts/pipeline/test-all-angles.ts              # run all
 *   npx tsx scripts/pipeline/test-all-angles.ts --bucket personal  # one bucket
 *   npx tsx scripts/pipeline/test-all-angles.ts --index 3          # single angle
 */
import * as fs from 'fs';
import * as path from 'path';
import { buildHookLine, HOOK_PRIORITY_ORDER, type HookFormula } from './prompt-builder.js';
import { generateAngleInputs } from './ai-inputs.js';

// Load env
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const eq = line.indexOf('=');
    if (eq === -1 || line.startsWith('#')) continue;
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (k && !process.env[k]) process.env[k] = v;
  }
}

// ─── Angle definitions ────────────────────────────────────────────────────────

interface AngleTest {
  bucket: 'personal' | 'networking' | 'business' | 'feature';
  angleName: string;
  offerFile: string;
  audienceCategory: string;
  awarenessStage: string;
  hookFormula: HookFormula;
  angleContext: string;
}

const ALL_ANGLES: AngleTest[] = [
  // ── Personal / Friendship ──────────────────────────────────────────────────
  {
    bucket: 'personal',
    angleName: 'Forgotten Follow-Up (friend)',
    offerFile: 'offers/everreach.json',
    audienceCategory: 'friend',
    awarenessStage: 'unaware',
    hookFormula: 'problem_solution',
    angleContext: 'Forgotten Follow-Up — "you thought about them, never sent it." The viewer realizes they\'ve been meaning to text a friend for weeks but never did. Make them feel that pang of guilt, then show how a simple nudge fixes it.',
  },
  {
    bucket: 'personal',
    angleName: 'Un-ghosting: old friend',
    offerFile: 'offers/everreach.json',
    audienceCategory: 'old friend',
    awarenessStage: 'problem-aware',
    hookFormula: 'testimonial',
    angleContext: 'Un-ghosting series (old friend) — the viewer has an old friend they haven\'t spoken to in months/years. They feel guilty but don\'t know what to say. Show how breaking the silence is easier than they think.',
  },
  {
    bucket: 'personal',
    angleName: 'Un-ghosting: crush',
    offerFile: 'offers/everreach.json',
    audienceCategory: 'crush',
    awarenessStage: 'unaware',
    hookFormula: 'curiosity_gap',
    angleContext: 'Un-ghosting series (crush) — the viewer let a potential romantic connection go cold. They think about this person but the longer they wait, the weirder it feels. Show that reaching back out doesn\'t have to be awkward.',
  },
  {
    bucket: 'personal',
    angleName: 'Before/After (47 contacts)',
    offerFile: 'offers/everreach.json',
    audienceCategory: 'friend',
    awarenessStage: 'solution-aware',
    hookFormula: 'social_proof',
    angleContext: 'Before/After transformation — "I had 47 contacts I meant to reach out to." Show the overwhelming list of people they\'ve been meaning to contact, then the calm after systematically reconnecting. Visual transformation story.',
  },
  {
    bucket: 'personal',
    angleName: 'Un-ghosting: family',
    offerFile: 'offers/everreach.json',
    audienceCategory: 'family',
    awarenessStage: 'unaware',
    hookFormula: 'testimonial',
    angleContext: 'Un-ghosting series (family) — the viewer hasn\'t called their parent/sibling in too long. They feel guilty every time they think about it. Show that one small action breaks the cycle.',
  },

  // ── Professional Networking ────────────────────────────────────────────────
  {
    bucket: 'networking',
    angleName: 'Card Scan (met someone → CRM in 3s)',
    offerFile: 'offers/everreach-business.json',
    audienceCategory: 'prospect',
    awarenessStage: 'solution-aware',
    hookFormula: 'founder_story',
    angleContext: 'Card Scan — "met someone at an event, they\'re in my CRM in 3 seconds." The viewer meets people at events/conferences but always loses their info. Show the instant capture moment and how it prevents the contact from going cold.',
  },
  {
    bucket: 'networking',
    angleName: 'Network = Net Worth',
    offerFile: 'offers/everreach-business.json',
    audienceCategory: 'prospect',
    awarenessStage: 'unaware',
    hookFormula: 'curiosity_gap',
    angleContext: 'Network = Net Worth — "your network is quietly dying." The viewer has hundreds of contacts but isn\'t nurturing them. Every week, relationships are going cold and opportunities are disappearing silently. Wake-up call energy.',
  },
  {
    bucket: 'networking',
    angleName: 'Un-ghosting: coworker',
    offerFile: 'offers/everreach.json',
    audienceCategory: 'coworker',
    awarenessStage: 'problem-aware',
    hookFormula: 'problem_solution',
    angleContext: 'Un-ghosting series (coworker/colleague) — the viewer left a job and lost touch with a colleague who was genuinely helpful. They meant to stay connected but life got busy. Show that professional relationships need maintenance too.',
  },
  {
    bucket: 'networking',
    angleName: 'Switcher (left HubSpot for this)',
    offerFile: 'offers/everreach-business.json',
    audienceCategory: 'client',
    awarenessStage: 'product-aware',
    hookFormula: 'testimonial',
    angleContext: 'Switcher — "I left HubSpot/Notion/spreadsheets for this." The viewer is using a heavy CRM or cobbled-together system that\'s too complex for personal relationship management. Show why a personal CRM is different from enterprise tools.',
  },

  // ── Business / Client / Sales ──────────────────────────────────────────────
  {
    bucket: 'business',
    angleName: '3-Minute Routine (weekly rhythm)',
    offerFile: 'offers/everreach-business.json',
    audienceCategory: 'client',
    awarenessStage: 'solution-aware',
    hookFormula: 'founder_story',
    angleContext: '3-Minute Routine — "my weekly rhythm for staying on top of relationships." The viewer knows they need a system but thinks it takes too much time. Show a 3-minute weekly review that keeps all client relationships warm. Emphasis on simplicity and consistency.',
  },
  {
    bucket: 'business',
    angleName: 'AI That Sounds Like You',
    offerFile: 'offers/everreach-business.json',
    audienceCategory: 'prospect',
    awarenessStage: 'solution-aware',
    hookFormula: 'curiosity_gap',
    angleContext: 'AI Message Composer — "it writes messages that actually sound like me." The viewer hates generic outreach but doesn\'t have time to craft personal messages for every contact. Show AI-generated openers that feel authentic and personal, not robotic.',
  },
  {
    bucket: 'business',
    angleName: 'Un-ghosting: client',
    offerFile: 'offers/everreach-business.json',
    audienceCategory: 'client',
    awarenessStage: 'problem-aware',
    hookFormula: 'testimonial',
    angleContext: 'Un-ghosting series (client) — the viewer let a client relationship go cold and lost a deal or referral because of it. They know it was their fault for not following up. Show how a simple system prevents this from ever happening again.',
  },
  {
    bucket: 'business',
    angleName: 'Un-ghosting: mentor',
    offerFile: 'offers/everreach.json',
    audienceCategory: 'mentor',
    awarenessStage: 'unaware',
    hookFormula: 'problem_solution',
    angleContext: 'Un-ghosting series (mentor) — the viewer had a mentor who helped them enormously but they\'ve let the relationship fade. They feel guilty and don\'t know how to re-initiate without it being awkward. Show that mentors want to hear from you.',
  },

  // ── App Feature / Product ──────────────────────────────────────────────────
  {
    bucket: 'feature',
    angleName: 'Warmth Score',
    offerFile: 'offers/everreach-business.json',
    audienceCategory: 'client',
    awarenessStage: 'product-aware',
    hookFormula: 'social_proof',
    angleContext: 'Warmth Score feature — "your relationship health score is dropping right now." The viewer can see at a glance which relationships are getting cold. Show the warmth score dashboard and how it creates urgency to reach out before it\'s too late.',
  },
  {
    bucket: 'feature',
    angleName: 'Voice Notes',
    offerFile: 'offers/everreach.json',
    audienceCategory: 'friend',
    awarenessStage: 'product-aware',
    hookFormula: 'curiosity_gap',
    angleContext: 'Voice Notes feature — "leave a voice note, it auto-transcribes." The viewer prefers voice over text but needs a record. Show the voice note → transcription flow and how it makes staying in touch feel natural instead of like a chore.',
  },
];

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const bucketFilter = args.includes('--bucket') ? args[args.indexOf('--bucket') + 1] : null;
const indexFilter = args.includes('--index') ? parseInt(args[args.indexOf('--index') + 1], 10) : null;

let angles = ALL_ANGLES;
if (bucketFilter) angles = angles.filter((a) => a.bucket === bucketFilter);
if (indexFilter !== null) angles = [ALL_ANGLES[indexFilter]];

// ─── Stage-specific line labels ───────────────────────────────────────────────

const stageLabels: Record<string, string[]> = {
  'unaware':        ['HOOK', 'MIRROR', 'MECHANISM', 'PROOF', 'CTA'],
  'problem-aware':  ['HOOK', 'MIRROR', 'MECHANISM', 'PROOF', 'CTA'],
  'solution-aware': ['HOOK', 'INTEREST', 'DESIRE', 'PROOF', 'CTA'],
  'product-aware':  ['HOOK', 'FEAT 1', 'FEAT 2', 'OUTCOME', 'CTA'],
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  EverReach — All-Angle Script Test`);
  console.log(`  Testing ${angles.length} angles${bucketFilter ? ` (bucket: ${bucketFilter})` : ''}${indexFilter !== null ? ` (index: ${indexFilter})` : ''}`);
  console.log(`${'='.repeat(70)}`);

  const results: Array<{ angle: AngleTest; script: string; tokens: number; passed: boolean }> = [];

  for (let i = 0; i < angles.length; i++) {
    const angle = angles[i];
    const { offer, framework } = JSON.parse(fs.readFileSync(angle.offerFile, 'utf-8'));

    console.log(`\n${'─'.repeat(70)}`);
    console.log(`  [${i + 1}/${angles.length}] ${angle.angleName}`);
    console.log(`  Bucket: ${angle.bucket} | Audience: ${angle.audienceCategory} | Stage: ${angle.awarenessStage} | Formula: ${angle.hookFormula}`);
    console.log(`  Offer: ${angle.offerFile}`);
    console.log(`${'─'.repeat(70)}`);

    const result = await generateAngleInputs(
      offer, framework,
      angle.awarenessStage,
      angle.audienceCategory,
      `ANGLE_${i + 1}`,
      angle.hookFormula,
      angle.angleContext,
    );

    const lines = result.inputs.voiceScript.split('\n').filter(Boolean);
    const labels = stageLabels[angle.awarenessStage] ?? ['HOOK', 'L2', 'L3', 'L4', 'CTA'];

    console.log(`  Headline: ${result.inputs.headline}`);
    console.log(`  Script:`);
    for (let j = 0; j < lines.length; j++) {
      const lbl = labels[j] ?? `LINE ${j + 1}`;
      console.log(`    [${lbl.padEnd(9)}] ${lines[j]}`);
    }
    console.log(`  Tokens: ${result.totalTokens}`);

    results.push({
      angle,
      script: result.inputs.voiceScript,
      tokens: result.totalTokens,
      passed: true,
    });
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  RESULTS SUMMARY`);
  console.log(`${'='.repeat(70)}`);

  const buckets = ['personal', 'networking', 'business', 'feature'] as const;
  for (const bucket of buckets) {
    const bucketResults = results.filter((r) => r.angle.bucket === bucket);
    if (bucketResults.length === 0) continue;
    console.log(`\n  ── ${bucket.toUpperCase()} ──`);
    for (const r of bucketResults) {
      const firstLine = r.script.split('\n')[0] ?? '';
      const status = r.passed ? '✅' : '❌';
      console.log(`    ${status} ${r.angle.angleName.padEnd(35)} → "${firstLine.slice(0, 50)}..."`);
    }
  }

  const totalTokens = results.reduce((sum, r) => sum + r.tokens, 0);
  const cost = (totalTokens / 1_000_000) * 7.5; // rough avg of in/out pricing
  console.log(`\n  Total: ${results.length} angles | ${totalTokens.toLocaleString()} tokens | ~$${cost.toFixed(2)}`);
  console.log(`${'='.repeat(70)}\n`);
}

main().catch((err) => { console.error(`\n❌ ${err.message}`); process.exit(1); });
