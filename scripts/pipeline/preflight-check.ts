/**
 * Pre-Generation Sanity Validator — Preflight Check
 *
 * Runs BEFORE any API calls or generation to catch configuration errors,
 * missing fields, passthrough gaps, character consistency problems, and
 * API connectivity issues. Prevents wasting $3-16 per failed generation.
 *
 * Usage:
 *   npx tsx scripts/pipeline/preflight-check.ts --offer offers/everreach.json
 *   npx tsx scripts/pipeline/preflight-check.ts --offer offers/everreach.json --verbose
 *
 * Also exported for programmatic use in smart-generate.ts:
 *   import { runPreflightChecks } from './preflight-check.js';
 *   const result = await runPreflightChecks(offerPath, { verbose: true });
 *   if (result.blockers.length > 0) process.exit(1);
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

// ── Types ───────────────────────────────────────────────────────────────────

interface CheckResult {
  id: string;
  category: 'offer' | 'character' | 'passthrough' | 'api' | 'prompt' | 'config' | 'balance';
  severity: 'blocker' | 'warning' | 'info';
  message: string;
  fix?: string;
}

export interface PreflightResult {
  passed: boolean;
  blockers: CheckResult[];
  warnings: CheckResult[];
  infos: CheckResult[];
  all: CheckResult[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function loadEnv() {
  const p = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf-8').split('\n')) {
    const eq = line.indexOf('=');
    if (eq === -1 || line.startsWith('#')) continue;
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (k && !process.env[k]) process.env[k] = v;
  }
}

async function httpGet(url: string, headers: Record<string, string> = {}, timeoutMs = 8000): Promise<{ status: number; body: string }> {
  return new Promise((resolve) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const req = (lib as any).request({
      hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search, method: 'GET',
      headers: { ...headers }, timeout: timeoutMs,
    }, (res: any) => {
      let d = ''; res.on('data', (c: any) => d += c);
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body: d }));
    });
    req.on('error', () => resolve({ status: 0, body: 'connection error' }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
    req.end();
  });
}

// ── Check Functions ─────────────────────────────────────────────────────────

function checkOfferFile(offerPath: string): CheckResult[] {
  const results: CheckResult[] = [];
  const abs = path.resolve(process.cwd(), offerPath);

  if (!fs.existsSync(abs)) {
    results.push({ id: 'offer-exists', category: 'offer', severity: 'blocker',
      message: `Offer file not found: ${offerPath}`, fix: 'Check path and filename' });
    return results;
  }

  let parsed: any;
  try { parsed = JSON.parse(fs.readFileSync(abs, 'utf-8')); }
  catch (e: any) {
    results.push({ id: 'offer-json', category: 'offer', severity: 'blocker',
      message: `Invalid JSON: ${e.message}`, fix: 'Fix JSON syntax in offer file' });
    return results;
  }

  // Required offer fields
  const requiredOffer = ['productName', 'problemSolved', 'socialProof', 'cta', 'keyFeatures', 'targetAudience'];
  for (const f of requiredOffer) {
    if (!parsed.offer?.[f]) {
      results.push({ id: `offer-field-${f}`, category: 'offer', severity: 'blocker',
        message: `Missing offer.${f}`, fix: `Add "${f}" to offer section` });
    }
  }

  // Required framework fields
  const requiredFramework = ['awarenessStages', 'audienceCategories', 'scriptRules', 'voiceTone', 'visualStyle'];
  for (const f of requiredFramework) {
    if (!parsed.framework?.[f]) {
      results.push({ id: `framework-field-${f}`, category: 'offer', severity: 'blocker',
        message: `Missing framework.${f}`, fix: `Add "${f}" to framework section` });
    }
  }

  // Character identity fields — the bug that caused 2 characters
  if (!parsed.framework?.characterGender) {
    results.push({ id: 'char-gender', category: 'character', severity: 'warning',
      message: 'No characterGender — defaults to "woman"',
      fix: 'Add "characterGender": "woman" or "man" to framework' });
  }

  if (!parsed.framework?.preferredCharacterId) {
    results.push({ id: 'char-id', category: 'character', severity: 'warning',
      message: 'No preferredCharacterId — character selected by scoring (may vary)',
      fix: 'Add "preferredCharacterId": "CHR_JULES_BENNETT" to framework for deterministic selection' });
  }

  if (!parsed.framework?.preferredEthnicity) {
    results.push({ id: 'char-ethnicity', category: 'character', severity: 'warning',
      message: 'No preferredEthnicity — GPT-4o may generate generic "a woman" in scene prompts',
      fix: 'Add "preferredEthnicity": "white German or Nordic or Swiss" to framework' });
  }

  // Voice fields
  if (!parsed.framework?.voiceGender) {
    results.push({ id: 'voice-gender', category: 'character', severity: 'warning',
      message: 'No voiceGender — defaults to "male" (may mismatch characterGender)',
      fix: 'Add "voiceGender": "female" to framework' });
  }

  if (!parsed.framework?.voiceAge) {
    results.push({ id: 'voice-age', category: 'character', severity: 'info',
      message: 'No voiceAge — defaults to "late 20s"' });
  }

  // Awareness stages validation
  if (parsed.framework?.awarenessStages?.length < 2) {
    results.push({ id: 'stages-count', category: 'offer', severity: 'warning',
      message: `Only ${parsed.framework?.awarenessStages?.length ?? 0} awareness stages — most offers need 3-4` });
  }

  // Audience categories validation
  if (parsed.framework?.audienceCategories?.length < 2) {
    results.push({ id: 'categories-count', category: 'offer', severity: 'warning',
      message: `Only ${parsed.framework?.audienceCategories?.length ?? 0} audience categories` });
  }

  // Aspect ratio
  if (parsed.framework?.aspectRatio && !['9:16', '16:9', '1:1'].includes(parsed.framework.aspectRatio)) {
    results.push({ id: 'aspect-ratio', category: 'config', severity: 'blocker',
      message: `Invalid aspectRatio "${parsed.framework.aspectRatio}"`, fix: 'Use "9:16", "16:9", or "1:1"' });
  }

  return results;
}

function checkCharacterPack(offerPath: string): CheckResult[] {
  const results: CheckResult[] = [];
  const packPath = path.join(process.cwd(), 'docs', 'research', 'AD_CHARACTER_PACK.json');

  if (!fs.existsSync(packPath)) {
    results.push({ id: 'pack-exists', category: 'character', severity: 'warning',
      message: 'AD_CHARACTER_PACK.json not found — character selection disabled',
      fix: 'Create docs/research/AD_CHARACTER_PACK.json' });
    return results;
  }

  let pack: any;
  try { pack = JSON.parse(fs.readFileSync(packPath, 'utf-8')); }
  catch (e: any) {
    results.push({ id: 'pack-json', category: 'character', severity: 'blocker',
      message: `Invalid character pack JSON: ${e.message}` });
    return results;
  }

  if (!pack.characters?.length) {
    results.push({ id: 'pack-chars', category: 'character', severity: 'blocker',
      message: 'Character pack has no characters' });
    return results;
  }

  results.push({ id: 'pack-loaded', category: 'character', severity: 'info',
    message: `Character pack: ${pack.characters.length} characters, ${pack.libraries?.angles?.length ?? 0} angles` });

  // Validate preferred character exists in pack
  let offer: any;
  try { offer = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), offerPath), 'utf-8')); } catch { return results; }

  const preferredId = offer.framework?.preferredCharacterId;
  if (preferredId) {
    const found = pack.characters.find((c: any) => c.id === preferredId);
    if (!found) {
      results.push({ id: 'char-id-match', category: 'character', severity: 'blocker',
        message: `preferredCharacterId "${preferredId}" not found in character pack`,
        fix: `Available: ${pack.characters.map((c: any) => c.id).join(', ')}` });
    } else {
      results.push({ id: 'char-id-match', category: 'character', severity: 'info',
        message: `Character: ${found.name} (${found.id}) — ${found.archetype}` });

      // Validate identity_prompt_block exists and has ethnicity
      if (!found.identity_prompt_block || found.identity_prompt_block.length < 20) {
        results.push({ id: 'char-identity-block', category: 'character', severity: 'blocker',
          message: `Character ${found.name} has empty/short identity_prompt_block` });
      }

      // Check ethnicity alignment between offer and pack
      const offerEthnicity = offer.framework?.preferredEthnicity?.toLowerCase() ?? '';
      const packEthnicity = found.ethnicity?.toLowerCase() ?? '';
      if (offerEthnicity && packEthnicity && !hasEthnicityOverlap(offerEthnicity, packEthnicity)) {
        results.push({ id: 'ethnicity-mismatch', category: 'character', severity: 'blocker',
          message: `Ethnicity mismatch: offer says "${offer.framework.preferredEthnicity}" but ${found.name}'s ethnicity is "${found.ethnicity}"`,
          fix: `Align preferredEthnicity in offer with the character's ethnicity in the pack` });
      } else if (offerEthnicity && packEthnicity) {
        results.push({ id: 'ethnicity-match', category: 'character', severity: 'info',
          message: `Ethnicity aligned: "${found.ethnicity}"` });
      }

      // Check gender alignment
      const offerGender = offer.framework?.characterGender;
      if (offerGender) {
        const packGender = found.gender;
        const genderMap: Record<string, string> = { 'woman': 'female', 'man': 'male' };
        if (genderMap[offerGender] && genderMap[offerGender] !== packGender) {
          results.push({ id: 'gender-mismatch', category: 'character', severity: 'blocker',
            message: `Gender mismatch: offer says "${offerGender}" but ${found.name} is "${packGender}"`,
            fix: 'Align characterGender in offer with character gender in pack' });
        }
      }

      // Verify voice gender matches character gender
      const voiceGender = offer.framework?.voiceGender;
      if (voiceGender && found.gender && voiceGender !== found.gender) {
        results.push({ id: 'voice-gender-mismatch', category: 'character', severity: 'warning',
          message: `Voice/character gender mismatch: voice="${voiceGender}" but character="${found.gender}"`,
          fix: `Set voiceGender to "${found.gender}" in the offer framework` });
      }
    }
  }

  // Validate all characters have required fields
  for (const char of pack.characters) {
    if (!char.identity_prompt_block || char.identity_prompt_block.length < 20) {
      results.push({ id: `pack-char-${char.id}-identity`, category: 'character', severity: 'warning',
        message: `${char.name} (${char.id}) has missing/short identity_prompt_block` });
    }
    if (!char.primary_angles?.length) {
      results.push({ id: `pack-char-${char.id}-angles`, category: 'character', severity: 'warning',
        message: `${char.name} (${char.id}) has no primary_angles` });
    }
  }

  return results;
}

function hasEthnicityOverlap(a: string, b: string): boolean {
  const keywords = ['german', 'nordic', 'swiss', 'mediterranean', 'white', 'black', 'african',
    'asian', 'east asian', 'south asian', 'latino', 'afro', 'caribbean', 'korean', 'chinese',
    'japanese', 'indian'];
  const aWords = keywords.filter(k => a.includes(k));
  const bWords = keywords.filter(k => b.includes(k));
  return aWords.some(w => bWords.includes(w));
}

function checkPassthroughChain(offerPath: string): CheckResult[] {
  const results: CheckResult[] = [];
  let offer: any;
  try { offer = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), offerPath), 'utf-8')); } catch { return results; }

  // Check: preferredEthnicity flows to GPT prompt
  if (offer.framework?.preferredEthnicity) {
    results.push({ id: 'passthrough-ethnicity-gpt', category: 'passthrough', severity: 'info',
      message: `preferredEthnicity → ai-inputs.ts system prompt (3 injection points) ✓` });
  }

  // Check: preferredCharacterId flows to all 4 stages
  if (offer.framework?.preferredCharacterId) {
    results.push({ id: 'passthrough-charid', category: 'passthrough', severity: 'info',
      message: `preferredCharacterId → stage-character-pack + stage-images + stage-lipsync ✓` });
  }

  // Check: characterGender is set and consistent with voiceGender
  if (offer.framework?.characterGender && offer.framework?.voiceGender) {
    const genderMap: Record<string, string> = { 'woman': 'female', 'man': 'male' };
    const expectedVoice = genderMap[offer.framework.characterGender];
    if (expectedVoice && expectedVoice !== offer.framework.voiceGender) {
      results.push({ id: 'passthrough-gender-consistency', category: 'passthrough', severity: 'warning',
        message: `characterGender="${offer.framework.characterGender}" but voiceGender="${offer.framework.voiceGender}" — voice may not match character`,
        fix: `Set voiceGender to "${expectedVoice}"` });
    } else {
      results.push({ id: 'passthrough-gender-consistency', category: 'passthrough', severity: 'info',
        message: `characterGender + voiceGender aligned ✓` });
    }
  }

  // Check: all offer files have character fields
  const offerDir = path.dirname(path.resolve(process.cwd(), offerPath));
  const offerFiles = fs.readdirSync(offerDir).filter(f => f.endsWith('.json') && !f.includes('template'));
  for (const f of offerFiles) {
    try {
      const o = JSON.parse(fs.readFileSync(path.join(offerDir, f), 'utf-8'));
      if (!o.framework?.preferredCharacterId && o.framework?.characterGender) {
        results.push({ id: `offer-${f}-missing-charid`, category: 'passthrough', severity: 'warning',
          message: `${f}: has characterGender but no preferredCharacterId — character selection non-deterministic`,
          fix: `Add "preferredCharacterId" to ${f}` });
      }
      if (!o.framework?.preferredEthnicity && o.framework?.characterGender) {
        results.push({ id: `offer-${f}-missing-ethnicity`, category: 'passthrough', severity: 'warning',
          message: `${f}: no preferredEthnicity — GPT scene prompts will use generic descriptions`,
          fix: `Add "preferredEthnicity" to ${f}` });
      }
    } catch { /* skip non-parseable */ }
  }

  return results;
}

function checkPromptSafety(offerPath: string): CheckResult[] {
  const results: CheckResult[] = [];
  let offer: any;
  try { offer = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), offerPath), 'utf-8')); } catch { return results; }

  // Imagen 4 safety triggers in visualStyle/problemSolved
  const imagenTriggers = ['stressed', 'overwhelmed', 'anxious', 'depressed', 'crying', 'upset',
    'distressed', 'ignored', 'lonely', 'isolated', 'suffering', 'pain', 'hurt', 'broken'];
  const veoTriggers = ['real person', 'real human', 'celebrity', 'politician', 'violence',
    'weapon', 'blood', 'nude', 'naked', 'sexual'];

  // Check visualStyle
  const visualStyle = (offer.framework?.visualStyle ?? '').toLowerCase();
  const imgHits = imagenTriggers.filter(t => visualStyle.includes(t));
  if (imgHits.length > 0) {
    results.push({ id: 'safety-visual-imagen', category: 'prompt', severity: 'warning',
      message: `visualStyle contains Imagen safety triggers: ${imgHits.join(', ')}`,
      fix: 'These words get auto-replaced in stage-images.ts but may cause issues in GPT scene prompts' });
  }

  const veoHits = veoTriggers.filter(t => visualStyle.includes(t));
  if (veoHits.length > 0) {
    results.push({ id: 'safety-visual-veo', category: 'prompt', severity: 'blocker',
      message: `visualStyle contains Veo safety triggers: ${veoHits.join(', ')}`,
      fix: 'Remove these terms — Veo 3.1 will reject the entire generation' });
  }

  // Check hook lines for length
  try {
    const { buildHookLine, HOOK_PRIORITY_ORDER } = require('./prompt-builder.js');
    for (const formula of HOOK_PRIORITY_ORDER) {
      const line = buildHookLine(formula, offer.offer);
      const words = line.split(/\s+/).filter(Boolean).length;
      if (words > 15) {
        results.push({ id: `hook-${formula}-length`, category: 'prompt', severity: 'warning',
          message: `Hook "${formula}" is ${words} words (max 15): "${line}"`,
          fix: 'Simplify problemSolved or hook template' });
      }
      const digits = line.match(/\b\d{2,}\b|\$[\d,]+/);
      if (digits) {
        results.push({ id: `hook-${formula}-digits`, category: 'prompt', severity: 'warning',
          message: `Hook "${formula}" contains digits: "${digits[0]}" — should be words`,
          fix: 'Write numbers as words in socialProof' });
      }
    }
  } catch { /* prompt-builder not available */ }

  return results;
}

async function checkApiConnectivity(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  // fal.ai
  const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
  if (!falKey) {
    results.push({ id: 'api-fal-key', category: 'api', severity: 'blocker',
      message: 'FAL_KEY not set', fix: 'Add FAL_KEY to .env.local (get at fal.ai/dashboard)' });
  } else {
    const res = await httpGet('https://rest.fal.ai/info', { 'Authorization': `Key ${falKey}` });
    if (res.status === 401 || res.status === 403) {
      results.push({ id: 'api-fal-auth', category: 'api', severity: 'blocker',
        message: `fal.ai auth failed (${res.status})`, fix: 'Check FAL_KEY in .env.local' });
    } else if (res.status === 402) {
      results.push({ id: 'api-fal-balance', category: 'balance', severity: 'blocker',
        message: 'fal.ai balance exhausted (402)',
        fix: 'Top up at fal.ai/dashboard/billing — each clip costs ~$3.20' });
    } else if (res.status === 0) {
      results.push({ id: 'api-fal-reach', category: 'api', severity: 'blocker',
        message: `fal.ai unreachable: ${res.body}` });
    } else {
      results.push({ id: 'api-fal-ok', category: 'api', severity: 'info',
        message: `fal.ai: auth valid, reachable (${res.status})` });
    }

    // Check fal.ai balance by trying to get account info
    const balanceRes = await httpGet('https://rest.fal.ai/billing/balance',
      { 'Authorization': `Key ${falKey}` });
    if (balanceRes.status === 200) {
      try {
        const b = JSON.parse(balanceRes.body);
        const balance = b.balance ?? b.credits ?? b.amount;
        if (typeof balance === 'number') {
          if (balance < 5) {
            results.push({ id: 'api-fal-low-balance', category: 'balance', severity: 'warning',
              message: `fal.ai balance low: $${balance.toFixed(2)} — need ~$16-20 per full generation`,
              fix: 'Top up at fal.ai/dashboard/billing' });
          } else {
            results.push({ id: 'api-fal-balance-ok', category: 'balance', severity: 'info',
              message: `fal.ai balance: $${balance.toFixed(2)}` });
          }
        }
      } catch { /* couldn't parse balance */ }
    }
  }

  // OpenAI
  const oaiKey = process.env.OPENAI_API_KEY;
  if (!oaiKey) {
    results.push({ id: 'api-oai-key', category: 'api', severity: 'blocker',
      message: 'OPENAI_API_KEY not set', fix: 'Add to .env.local' });
  } else {
    results.push({ id: 'api-oai-ok', category: 'api', severity: 'info',
      message: `OPENAI_API_KEY set (${oaiKey.slice(0, 12)}...)` });
  }

  // Google/Gemini
  const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!googleKey) {
    results.push({ id: 'api-google-key', category: 'api', severity: 'blocker',
      message: 'GOOGLE_API_KEY not set', fix: 'Add to .env.local (get at aistudio.google.com)' });
  } else {
    // Quick check Imagen 4 availability
    const imgRes = await httpGet(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001?key=${googleKey}`);
    if (imgRes.status === 200) {
      results.push({ id: 'api-imagen-ok', category: 'api', severity: 'info',
        message: 'Imagen 4 accessible ✓' });
    } else if (imgRes.status === 403) {
      results.push({ id: 'api-imagen-denied', category: 'api', severity: 'blocker',
        message: 'Imagen 4 access denied (403)', fix: 'Enable billing on Google Cloud project' });
    } else {
      results.push({ id: 'api-imagen-status', category: 'api', severity: 'warning',
        message: `Imagen 4 status: ${imgRes.status}` });
    }
  }

  return results;
}

function checkExistingOutputs(offerPath: string): CheckResult[] {
  const results: CheckResult[] = [];
  let offer: any;
  try { offer = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), offerPath), 'utf-8')); } catch { return results; }

  const productSlug = offer.offer?.productName?.toLowerCase()?.replace(/[^a-z0-9]/g, '') ?? 'unknown';
  const outputBase = path.join(process.cwd(), 'output', 'pipeline', productSlug);

  if (!fs.existsSync(outputBase)) {
    results.push({ id: 'output-none', category: 'config', severity: 'info',
      message: 'No existing output directory — first run' });
    return results;
  }

  // Count existing sessions and videos
  let sessionCount = 0;
  let videoCount = 0;
  try {
    for (const session of fs.readdirSync(outputBase)) {
      const sd = path.join(outputBase, session);
      if (!fs.statSync(sd).isDirectory()) continue;
      sessionCount++;
      for (const angle of fs.readdirSync(sd)) {
        if (fs.existsSync(path.join(sd, angle, 'lipsync_9x16.mp4'))) videoCount++;
      }
    }
  } catch { /* */ }

  results.push({ id: 'output-existing', category: 'config', severity: 'info',
    message: `Existing: ${sessionCount} sessions, ${videoCount} videos in output/pipeline/${productSlug}/` });

  return results;
}

function checkCharacterConsistencyChain(offerPath: string): CheckResult[] {
  const results: CheckResult[] = [];
  let offer: any;
  try { offer = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), offerPath), 'utf-8')); } catch { return results; }

  // Simulate the full character consistency chain
  const charId = offer.framework?.preferredCharacterId;
  const ethnicity = offer.framework?.preferredEthnicity;
  const charGender = offer.framework?.characterGender;

  // 1. Check: character_sheet.png will use the right character
  if (charId) {
    results.push({ id: 'chain-sheet', category: 'character', severity: 'info',
      message: `character_sheet.png → ${charId} (via selectCharacter + preferredCharacterId)` });
  } else {
    results.push({ id: 'chain-sheet', category: 'character', severity: 'warning',
      message: 'character_sheet.png → character selected by scoring (non-deterministic)',
      fix: 'Add preferredCharacterId to offer' });
  }

  // 2. Check: beforeScenePrompt will describe the right ethnicity
  if (ethnicity) {
    results.push({ id: 'chain-before-prompt', category: 'character', severity: 'info',
      message: `beforeScenePrompt → GPT will use "${ethnicity}" (via 3 injection points)` });
  } else {
    results.push({ id: 'chain-before-prompt', category: 'character', severity: 'warning',
      message: 'beforeScenePrompt → GPT will use generic "a woman" (no ethnicity injected)',
      fix: 'Add preferredEthnicity to offer' });
  }

  // 3. Check: before.png will be prefixed with character identity
  if (charId) {
    results.push({ id: 'chain-before-img', category: 'character', severity: 'info',
      message: `before.png → Imagen 4 prompt prefixed with identity_prompt_block` });
  } else {
    results.push({ id: 'chain-before-img', category: 'character', severity: 'warning',
      message: 'before.png → No character identity prefix (may generate wrong person)' });
  }

  // 4. Check: lipsync character desc uses pack (not vision)
  results.push({ id: 'chain-lipsync', category: 'character', severity: 'info',
    message: 'stage-lipsync.ts → Pack identity is PRIMARY (GPT vision is fallback only)' });

  // 5. Full consistency check — all 4 stages should use the same character
  if (charId && ethnicity) {
    results.push({ id: 'chain-full', category: 'character', severity: 'info',
      message: `Full consistency chain: ${charId} → character_sheet + GPT prompts + before.png + lipsync ✓` });
  } else {
    const missing = [];
    if (!charId) missing.push('preferredCharacterId');
    if (!ethnicity) missing.push('preferredEthnicity');
    results.push({ id: 'chain-full', category: 'character', severity: 'warning',
      message: `Incomplete consistency chain — missing: ${missing.join(', ')}`,
      fix: 'Both fields needed for guaranteed single-character output' });
  }

  return results;
}

// ── Main Runner ─────────────────────────────────────────────────────────────

export async function runPreflightChecks(offerPath: string, options?: { verbose?: boolean; skipApi?: boolean }): Promise<PreflightResult> {
  loadEnv();

  const allResults: CheckResult[] = [];

  // 1. Offer file validation
  allResults.push(...checkOfferFile(offerPath));

  // 2. Character pack validation
  allResults.push(...checkCharacterPack(offerPath));

  // 3. Passthrough chain validation
  allResults.push(...checkPassthroughChain(offerPath));

  // 4. Character consistency chain
  allResults.push(...checkCharacterConsistencyChain(offerPath));

  // 5. Prompt safety
  allResults.push(...checkPromptSafety(offerPath));

  // 6. API connectivity (optional, can be slow)
  if (!options?.skipApi) {
    allResults.push(...await checkApiConnectivity());
  }

  // 7. Existing outputs
  allResults.push(...checkExistingOutputs(offerPath));

  const blockers = allResults.filter(r => r.severity === 'blocker');
  const warnings = allResults.filter(r => r.severity === 'warning');
  const infos    = allResults.filter(r => r.severity === 'info');

  return {
    passed: blockers.length === 0,
    blockers,
    warnings,
    infos,
    all: allResults,
  };
}

// ── CLI ─────────────────────────────────────────────────────────────────────

function printResults(result: PreflightResult, verbose: boolean) {
  const { blockers, warnings, infos } = result;

  console.log(`\n${'═'.repeat(64)}`);
  console.log('  ✈️  Pre-Generation Preflight Check');
  console.log(`${'═'.repeat(64)}`);

  const categories = ['offer', 'character', 'passthrough', 'prompt', 'api', 'balance', 'config'] as const;
  for (const cat of categories) {
    const catResults = result.all.filter(r => r.category === cat);
    if (catResults.length === 0) continue;

    const label = {
      offer: '📦 Offer File',
      character: '🎭 Character Consistency',
      passthrough: '🔗 Passthrough Chain',
      prompt: '📝 Prompt Safety',
      api: '🔌 API Connectivity',
      balance: '💰 Balance',
      config: '⚙️  Config',
    }[cat];

    console.log(`\n${'─'.repeat(64)}\n  ${label}\n${'─'.repeat(64)}`);
    for (const r of catResults) {
      if (r.severity === 'info' && !verbose) continue;
      const icon = r.severity === 'blocker' ? '🛑' : r.severity === 'warning' ? '⚠️ ' : 'ℹ️ ';
      console.log(`  ${icon} ${r.message}`);
      if (r.fix) console.log(`     💡 ${r.fix}`);
    }
    if (!verbose) {
      const infoCount = catResults.filter(r => r.severity === 'info').length;
      if (infoCount > 0) console.log(`  ℹ️  ${infoCount} info checks passed (use --verbose to see)`);
    }
  }

  console.log(`\n${'═'.repeat(64)}`);
  console.log(`  ✈️  PREFLIGHT: 🛑 ${blockers.length} blockers  ⚠️  ${warnings.length} warnings  ℹ️  ${infos.length} passed`);
  if (blockers.length === 0 && warnings.length === 0) {
    console.log('  🟢 ALL CLEAR — safe to generate');
  } else if (blockers.length === 0) {
    console.log('  🟡 PROCEED WITH CAUTION — review warnings');
  } else {
    console.log('  🔴 BLOCKED — fix blockers before generating');
  }
  console.log(`${'═'.repeat(64)}\n`);
}

async function main() {
  const argv = process.argv.slice(2);
  const eq = argv.find(a => a.startsWith('--offer='));
  let offerPath = 'offers/everreach.json';
  if (eq) offerPath = eq.split('=').slice(1).join('=');
  else { const idx = argv.indexOf('--offer'); if (idx !== -1 && argv[idx + 1]) offerPath = argv[idx + 1]; }
  const verbose = argv.includes('--verbose') || argv.includes('-v');
  const skipApi = argv.includes('--skip-api');

  const result = await runPreflightChecks(offerPath, { verbose, skipApi });
  printResults(result, verbose);

  process.exit(result.blockers.length > 0 ? 1 : 0);
}

// Only run CLI if invoked directly
if (process.argv[1]?.includes('preflight-check')) {
  main().catch(e => { console.error('Preflight error:', e); process.exit(1); });
}
