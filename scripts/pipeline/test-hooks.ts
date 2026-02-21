#!/usr/bin/env npx tsx
/**
 * Quick test: generate hook lines + GPT scripts for all 5 formulas.
 * No video generation — just tests the prompt quality.
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

const offerPath = process.argv[2] || 'offers/everreach-business.json';
const { offer, framework } = JSON.parse(fs.readFileSync(offerPath, 'utf-8'));

console.log(`\n${'='.repeat(60)}`);
console.log(`  Testing hook formulas for: ${offer.productName}`);
console.log(`  Offer: ${offerPath}`);
console.log(`${'='.repeat(60)}`);

// Test all hook lines (no GPT call)
console.log('\n--- HOOK LINES (local, no GPT) ---');
for (const f of HOOK_PRIORITY_ORDER) {
  console.log(`  ${f.padEnd(20)} → "${buildHookLine(f, offer)}"`);
}

// Test combos: formula × stage to verify stage-specific structures
const testCombos: Array<{ formula: HookFormula; stage: string; label: string }> = [
  { formula: 'problem_solution', stage: 'unaware',       label: 'PAS' },
  { formula: 'testimonial',      stage: 'solution-aware', label: 'AIDA' },
  { formula: 'social_proof',     stage: 'product-aware',  label: 'Features→Outcome' },
];

// Stage-specific line labels
const stageLabels: Record<string, string[]> = {
  'unaware':        ['HOOK', 'MIRROR', 'MECHANISM', 'PROOF', 'CTA'],
  'problem-aware':  ['HOOK', 'MIRROR', 'MECHANISM', 'PROOF', 'CTA'],
  'solution-aware': ['HOOK', 'INTEREST', 'DESIRE', 'PROOF', 'CTA'],
  'product-aware':  ['HOOK', 'FEAT 1', 'FEAT 2', 'OUTCOME', 'CTA'],
};

async function main() {
  for (const { formula, stage, label } of testCombos) {
    console.log(`\n${'\u2500'.repeat(60)}`);
    console.log(`  FORMULA: ${formula}  |  STAGE: ${stage}  |  FRAMEWORK: ${label}`);
    console.log(`${'\u2500'.repeat(60)}`);
    
    const result = await generateAngleInputs(
      offer, framework, stage, 'client', 'TEST_01', formula,
    );
    
    console.log(`  Headline: ${result.inputs.headline}`);
    console.log(`  Subheadline: ${result.inputs.subheadline}`);
    console.log(`  Script:`);
    const lines = result.inputs.voiceScript.split('\n').filter(Boolean);
    const labels = stageLabels[stage] ?? ['HOOK', 'L2', 'L3', 'L4', 'CTA'];
    for (let i = 0; i < lines.length; i++) {
      const lbl = labels[i] ?? `LINE ${i + 1}`;
      console.log(`    [${lbl.padEnd(8)}] ${lines[i]}`);
    }
    console.log(`  Tokens: ${result.totalTokens} (${result.promptTokens} in / ${result.completionTokens} out)`);
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ✅ Done — review scripts above for quality`);
  console.log(`${'='.repeat(60)}\n`);
}

main().catch((err) => { console.error(`\n❌ ${err.message}`); process.exit(1); });
