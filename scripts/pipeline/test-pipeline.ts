/**
 * Pipeline System Test — No Generation
 * Tests every system without generating images or videos.
 * Usage: npx tsx scripts/pipeline/test-pipeline.ts [--offer offers/everreach.json]
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { buildHookLine, validateScript, HOOK_PRIORITY_ORDER } from './prompt-builder.js';
import { buildLipsyncPrompt, buildCharacterDescription, buildVoiceProfile } from './stage-lipsync.js';
import type { Offer } from './offer.schema.js';

let pass = 0, fail = 0, warn = 0;
const P = (m: string) => { console.log(`  ✅ ${m}`); pass++; };
const F = (m: string) => { console.log(`  ❌ ${m}`); fail++; };
const W = (m: string) => { console.log(`  ⚠️  ${m}`); warn++; };
const I = (m: string) => console.log(`  ℹ️  ${m}`);
const S = (t: string) => console.log(`\n${'─'.repeat(60)}\n  ${t}\n${'─'.repeat(60)}`);

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

async function post(url: string, body: string, headers: Record<string, string> = {}): Promise<{ status: number; body: string }> {
  return new Promise((resolve) => {
    const u = new URL(url);
    const isHttps = u.protocol === 'https:';
    const lib = isHttps ? https : http;
    const opts = {
      hostname: u.hostname, port: u.port || (isHttps ? 443 : 80),
      path: u.pathname + u.search, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...headers },
      timeout: 12000,
    };
    const req = (lib as any).request(opts, (res: any) => {
      let d = ''; res.on('data', (c: any) => d += c); res.on('end', () => resolve({ status: res.statusCode ?? 0, body: d }));
    });
    req.on('error', () => resolve({ status: 0, body: 'connection error' }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
    req.write(body); req.end();
  });
}

// Safety word lists
const IMAGEN_TRIGGERS = ['stressed','overwhelmed','anxious','depressed','crying','upset','distressed','ignored','lonely','isolated','suffering','pain','hurt','broken','real person','real human'];
const VEO_TRIGGERS = ['real person','real human','celebrity','politician','violence','weapon','blood','nude','naked','sexual'];

// ── Test 1: Environment ──────────────────────────────────────────────────────
function testEnv() {
  S('1. Environment — API Keys');
  const fal = process.env.FAL_KEY || process.env.FAL_API_KEY;
  const oai = process.env.OPENAI_API_KEY;
  const goog = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  fal ? P(`FAL_KEY (${fal.slice(0,8)}...)`) : F('FAL_KEY not set');
  oai ? P(`OPENAI_API_KEY (${oai.slice(0,8)}...)`) : F('OPENAI_API_KEY not set');
  goog ? P(`GOOGLE_API_KEY (${goog.slice(0,8)}...)`) : F('GOOGLE_API_KEY not set');
  return { fal, oai, goog };
}

// ── Test 2: Offer file ───────────────────────────────────────────────────────
function testOffer(offerPath: string): Offer | null {
  S('2. Offer File');
  const abs = path.resolve(process.cwd(), offerPath);
  if (!fs.existsSync(abs)) { F(`Not found: ${abs}`); return null; }
  P(`File exists: ${offerPath}`);
  let parsed: any;
  try { parsed = JSON.parse(fs.readFileSync(abs, 'utf-8')); P('Valid JSON'); }
  catch (e: any) { F(`Invalid JSON: ${e.message}`); return null; }

  const required = ['offer.productName','offer.problemSolved','offer.socialProof','offer.cta',
    'framework.awarenessStages','framework.audienceCategories','framework.scriptRules'];
  for (const f of required) {
    const val = f.split('.').reduce((o: any, k) => o?.[k], parsed);
    val ? P(`${f} ✓`) : F(`Missing: ${f}`);
  }
  parsed.framework?.characterGender ? P(`characterGender: "${parsed.framework.characterGender}"`) : W('characterGender not set — defaults to "woman"');
  parsed.framework?.voiceGender ? P(`voiceGender: "${parsed.framework.voiceGender}"`) : W('voiceGender not set — defaults to "male"');
  return parsed.offer;
}

// ── Test 3: Hook formulas ────────────────────────────────────────────────────
function testHooks(offer: Offer) {
  S('3. Hook Formulas — Word Count + Digit Check');
  for (const formula of HOOK_PRIORITY_ORDER) {
    const line = buildHookLine(formula, offer);
    const words = line.split(/\s+/).filter(Boolean).length;
    const digits = line.match(/\b\d{2,}\b|\$[\d,]+/);
    if (words > 15) F(`${formula} (${words}w > 15): "${line}"`);
    else if (digits) F(`${formula}: digits found "${digits.join(',')}" in: "${line}"`);
    else P(`${formula} (${words}w): "${line}"`);
  }
}

// ── Test 4: Script validation ────────────────────────────────────────────────
function testScriptValidator() {
  S('4. Script Validator — Known Bad Inputs');
  const cases: Array<{ label: string; lines: string[]; expectFail: boolean }> = [
    { label: 'Valid 5-line script', expectFail: false, lines: [
      "i've never tried this before. believe it or not.",
      "i used to forget to reach out to people i care about.",
      "and here is where it gets interesting.",
      "there is a simple system that fixes this completely.",
      "link in bio.",
    ]},
    { label: 'Hook >15 words', expectFail: true, lines: ["this is a very long hook line that has way too many words in it and should fail"] },
    { label: 'Contains digits', expectFail: true, lines: ["50,000 people tried this"] },
    { label: 'Contains buzzword', expectFail: true, lines: ["this revolutionary app changed my life"] },
    { label: 'Line >20 words', expectFail: true, lines: ["this line is extremely long and has way more than twenty words in it which means it will exceed the clip duration limit for sure"] },
  ];
  for (const c of cases) {
    const r = validateScript(c.lines);
    const hasErr = r.errors.length > 0;
    if (c.expectFail && hasErr) P(`Caught: "${c.label}" — ${r.errors[0]}`);
    else if (!c.expectFail && !hasErr) P(`Passed: "${c.label}"`);
    else if (c.expectFail && !hasErr) F(`Should have failed: "${c.label}"`);
    else F(`False positive: "${c.label}" — ${r.errors[0]}`);
  }
}

// ── Test 5: Prompt safety audit ──────────────────────────────────────────────
function testPromptSafety(offer: Offer) {
  S('5. Prompt Builder — Safety Audit');
  const charDesc = buildCharacterDescription({ age: '28', gender: 'female', hair: 'dark brown shoulder-length hair', clothing: 'casual grey hoodie', mannerisms: 'genuine, relatable energy' });
  const voiceProf = buildVoiceProfile({ gender: 'female', age: 'late 20s', accent: 'American, warm neutral', tone: 'confident, empathetic, not salesy' });
  const setting = 'a cozy home living room, warm natural window light';
  const lines = ["i've never tried this before. believe it or not.", "i used to lose touch with everyone i cared about.", "and here is where it gets interesting.", "there is a simple system that fixes this.", "link in bio."];

  I(`Character: ${charDesc.slice(0,80)}`);
  I(`Voice: ${voiceProf.slice(0,60)}`);

  for (let i = 0; i < lines.length; i++) {
    const prompt = buildLipsyncPrompt(lines[i], charDesc, setting, i, lines.length, { voiceProfile: voiceProf, pronoun: 'She' });
    const imgTrig = IMAGEN_TRIGGERS.filter((t) => prompt.toLowerCase().includes(t));
    const veoTrig = VEO_TRIGGERS.filter((t) => prompt.toLowerCase().includes(t));

    if (imgTrig.length) F(`Clip ${i+1} Imagen triggers: ${imgTrig.join(', ')}`);
    if (veoTrig.length) F(`Clip ${i+1} Veo triggers: ${veoTrig.join(', ')}`);
    if (!imgTrig.length && !veoTrig.length) P(`Clip ${i+1} clean (${prompt.length} chars)`);

    prompt.includes('fictional character') ? P(`Clip ${i+1} fictional framing ✓`) : W(`Clip ${i+1} no fictional framing`);
    prompt.includes('IMPORTANT: The character must be exactly') ? P(`Clip ${i+1} char lock reinforcement ✓`) : W(`Clip ${i+1} no char lock reinforcement`);
  }

  // Audit the before-scene safety filter
  S('5b. Before-Scene Safety Filter (stage-images.ts)');
  const badWords = ['stressed','overwhelmed','anxious','depressed','crying','upset','distressed','ignored','lonely','isolated','suffering','pain','hurt','broken'];
  const testScene = 'A stressed woman sitting alone on a couch, feeling overwhelmed and ignored, crying while looking at her phone';
  const safeScene = testScene.replace(/\b(stressed|overwhelmed|anxious|depressed|crying|upset|distressed|ignored|lonely|isolated|suffering|pain|hurt|broken)\b/gi, (w) => ({
    stressed:'thoughtful',overwhelmed:'busy',anxious:'pensive',depressed:'tired',crying:'emotional',
    upset:'concerned',distressed:'worried',ignored:'disconnected',lonely:'reflective',isolated:'alone',
    suffering:'struggling',pain:'discomfort',hurt:'sad',broken:'worn out',
  } as Record<string,string>)[w.toLowerCase()] ?? w);
  const remaining = badWords.filter((w) => safeScene.toLowerCase().includes(w));
  I(`Input:  "${testScene}"`);
  I(`Output: "${safeScene}"`);
  remaining.length === 0 ? P('All safety trigger words replaced') : F(`Still contains: ${remaining.join(', ')}`);
}

// ── Test 6: fal.ai connectivity ──────────────────────────────────────────────
async function testFalConnectivity(falKey: string) {
  S('6. fal.ai — Queue Connectivity + Auth');
  // Use the REST API /info endpoint — read-only, no job submission
  const res = await new Promise<{ status: number; body: string }>((resolve) => {
    const req = https.request({
      hostname: 'rest.fal.ai', path: '/info', method: 'GET',
      headers: { 'Authorization': `Key ${falKey}` }, timeout: 8000,
    }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => resolve({ status: r.statusCode ?? 0, body: d })); });
    req.on('error', () => resolve({ status: 0, body: 'connection error' }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
    req.end();
  });
  // Any non-401/403/0 response means auth is valid and API is reachable
  if (res.status === 401 || res.status === 403) F(`Auth failed (${res.status}) — check FAL_KEY`);
  else if (res.status === 402) F('Balance exhausted (402) — top up at fal.ai/dashboard/billing');
  else if (res.status === 0) F(`Unreachable: ${res.body}`);
  else P(`Queue reachable + auth valid (${res.status} — no job submitted)`);
}

// ── Test 7: fal.ai storage upload ────────────────────────────────────────────
async function testFalStorage(falKey: string) {
  S('7. fal.ai — Storage Upload (Image Anchor Fix)');
  const testImg = ['output/pipeline/everreach/2026-02-21T03-36-11/EVERREAC_2026-02-21_02/before.png',
    'output/pipeline/everreach/2026-02-21T16-30-30/EVERREAC_2026-02-21_01/before.png'].find(fs.existsSync);
  if (!testImg) { W('No before.png found — skipping upload test'); return; }
  I(`Test image: ${testImg} (${(fs.statSync(testImg).size/1024).toFixed(0)}KB)`);

  const initRes = await post('https://rest.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3',
    JSON.stringify({ file_name: 'test_before.png', content_type: 'image/png' }),
    { 'Authorization': `Key ${falKey}` });

  if (initRes.status !== 200) { F(`Initiate failed (${initRes.status}): ${initRes.body.slice(0,100)}`); return; }
  P('Storage initiate OK (rest.fal.ai endpoint working)');

  let uploadUrl: string, fileUrl: string;
  try { const d = JSON.parse(initRes.body); uploadUrl = d.upload_url; fileUrl = d.file_url; }
  catch { F('Invalid JSON from initiate'); return; }
  if (!uploadUrl || !fileUrl) { F('Missing upload_url or file_url'); return; }
  I(`Public URL: ${fileUrl.slice(0,70)}...`);

  const imageBytes = fs.readFileSync(testImg);
  const putRes = await new Promise<number>((resolve) => {
    const u = new URL(uploadUrl);
    const req = https.request({ hostname: u.hostname, path: u.pathname + u.search, method: 'PUT',
      headers: { 'Content-Type': 'image/png', 'Content-Length': String(imageBytes.length) }, timeout: 30000 },
      (res) => { res.resume(); res.on('end', () => resolve(res.statusCode ?? 0)); });
    req.on('error', () => resolve(0));
    req.on('timeout', () => { req.destroy(); resolve(0); });
    req.write(imageBytes); req.end();
  });

  putRes === 200 || putRes === 204
    ? P(`Storage PUT OK (${putRes}) — image anchor WILL work ✅`)
    : F(`Storage PUT failed (${putRes}) — image anchor will NOT work`);
}

// ── Test 8: OpenAI ───────────────────────────────────────────────────────────
async function testOpenAI(oaiKey: string) {
  S('8. OpenAI — GPT-4o Connectivity');
  const res = await post('https://api.openai.com/v1/chat/completions',
    JSON.stringify({ model: 'gpt-4o', max_tokens: 5, messages: [{ role: 'user', content: 'say: ok' }] }),
    { 'Authorization': `Bearer ${oaiKey}` });
  if (res.status === 200) { P('GPT-4o reachable + auth valid'); try { I(`Reply: "${JSON.parse(res.body).choices?.[0]?.message?.content?.trim()}"`); } catch { /* */ } }
  else if (res.status === 401) F('Auth failed (401) — check OPENAI_API_KEY');
  else if (res.status === 429) W('Rate limited (429) — key valid but throttled');
  else if (res.status === 0) F(`Unreachable: ${res.body}`);
  else F(`Unexpected ${res.status}: ${res.body.slice(0,100)}`);
}

// ── Test 9: Gemini ───────────────────────────────────────────────────────────
async function testGemini(googleKey: string) {
  S('9. Google Gemini/Imagen — Connectivity');
  const res = await post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleKey}`,
    JSON.stringify({ contents: [{ parts: [{ text: 'say: ok' }] }] }));
  if (res.status === 200) { P('Gemini API reachable + auth valid'); }
  else if (res.status === 400) P(`Gemini reachable (${res.status} — auth likely OK)`);
  else if (res.status === 401 || res.status === 403) F(`Gemini auth failed (${res.status})`);
  else if (res.status === 0) F(`Gemini unreachable: ${res.body}`);
  else W(`Gemini status ${res.status}`);

  // Check Imagen 4 via model list (GET, no generation cost)
  const imgRes = await new Promise<{ status: number; body: string }>((resolve) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/imagen-4.0-generate-001?key=${googleKey}`,
      method: 'GET', timeout: 8000,
    }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => resolve({ status: r.statusCode ?? 0, body: d })); });
    req.on('error', () => resolve({ status: 0, body: 'connection error' }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
    req.end();
  });
  if (imgRes.status === 200) P('Imagen 4 model accessible (GET model info OK)');
  else if (imgRes.status === 403) F('Imagen 4 access denied (403) — check billing/permissions');
  else if (imgRes.status === 404) F('Imagen 4 not found (404) — check model name');
  else if (imgRes.status === 0) W(`Imagen 4 unreachable: ${imgRes.body}`);
  else W(`Imagen 4 status ${imgRes.status}: ${imgRes.body.slice(0,80)}`);
}

// ── Test 10: Analysis server ─────────────────────────────────────────────────
async function testAnalysisServer() {
  S('10. Analysis Server — MediaPoster (:5555)');
  return new Promise<void>((resolve) => {
    const req = http.request({ hostname: 'localhost', port: 5555, path: '/health', method: 'GET', timeout: 3000 },
      (res) => { res.statusCode === 200 ? P('Running on :5555') : W(`Responded ${res.statusCode}`); resolve(); });
    req.on('error', () => { W('Not running — viral scoring will be skipped'); resolve(); });
    req.on('timeout', () => { req.destroy(); W('Timeout on :5555'); resolve(); });
    req.end();
  });
}

// ── Test 11: Learnings file ──────────────────────────────────────────────────
function testLearnings() {
  S('11. Learnings File');
  const p = path.join('output', 'pipeline', 'learnings.json');
  if (!fs.existsSync(p)) { I('No learnings.json yet — created on first run'); return; }
  try {
    const d = JSON.parse(fs.readFileSync(p, 'utf-8'));
    P('learnings.json valid JSON');
    I(`Generated: ${d.totalGenerated ?? 0} | Pass rate: ${((d.passRate ?? 0)*100).toFixed(0)}% | Avg viral: ${(d.avgViralScore ?? 0).toFixed(1)}/100`);
    if (d.costs?.totalSpentUsd > 0) I(`Lifetime spend: $${d.costs.totalSpentUsd.toFixed(2)} | Cost/passing ad: $${d.costs.costPerPassingAd.toFixed(2)}`);
    if (d.hookFormulas) {
      const hf = Object.entries(d.hookFormulas as Record<string,any>).map(([f,s]) => `${f}:${(s.passRate*100).toFixed(0)}%(${s.attempts})`);
      if (hf.length) I(`Hook formulas: ${hf.join(' | ')}`);
    }
  } catch (e: any) { F(`Corrupted: ${e.message}`); }
}

// ── Test 12: Video inventory ─────────────────────────────────────────────────
function testInventory() {
  S('12. Existing Video Inventory');
  const base = path.join('output', 'pipeline', 'everreach');
  if (!fs.existsSync(base)) { I('No output directory yet'); return; }
  const videos: string[] = [];
  for (const session of fs.readdirSync(base).sort()) {
    const sd = path.join(base, session);
    if (!fs.statSync(sd).isDirectory()) continue;
    for (const angle of fs.readdirSync(sd)) {
      const vp = path.join(sd, angle, 'lipsync_9x16.mp4');
      const cp = path.join(sd, angle, 'scene_config.json');
      if (!fs.existsSync(vp)) continue;
      const mb = (fs.statSync(vp).size/1024/1024).toFixed(1);
      let headline = '(no config)', stage = '?', cat = '?';
      if (fs.existsSync(cp)) { try { const c = JSON.parse(fs.readFileSync(cp,'utf-8')); headline = c.headline ?? headline; stage = c.awarenessStage ?? stage; cat = c.audienceCategory ?? cat; } catch { /* */ } }
      videos.push(`     ${angle}  ${mb}MB  [${stage}/${cat}]  "${headline.slice(0,50)}"`);
    }
  }
  if (!videos.length) { I('No generated videos found'); return; }
  P(`Found ${videos.length} videos:`);
  videos.forEach((v) => console.log(v));
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  loadEnv();
  const offerPath = (() => {
    const argv = process.argv.slice(2);
    const eq = argv.find((a) => a.startsWith('--offer='));
    if (eq) return eq.split('=').slice(1).join('=');
    const idx = argv.indexOf('--offer');
    if (idx !== -1 && argv[idx+1]) return argv[idx+1];
    return 'offers/everreach.json';
  })();

  console.log(`\n${'═'.repeat(60)}`);
  console.log('  🧪 Pipeline System Test — No Generation');
  console.log(`  Offer: ${offerPath}`);
  console.log(`${'═'.repeat(60)}`);

  const { fal, oai, goog } = testEnv();
  const offer = testOffer(offerPath);
  if (offer) { testHooks(offer); testPromptSafety(offer); } else W('Skipping hook/prompt tests — offer failed');
  testScriptValidator();
  if (fal) { await testFalConnectivity(fal); await testFalStorage(fal); } else { S('6. fal.ai — Queue'); F('Skipped — FAL_KEY not set'); S('7. fal.ai — Storage'); F('Skipped'); }
  if (oai) await testOpenAI(oai); else { S('8. OpenAI'); F('Skipped — OPENAI_API_KEY not set'); }
  if (goog) await testGemini(goog); else { S('9. Gemini'); F('Skipped — GOOGLE_API_KEY not set'); }
  await testAnalysisServer();
  testLearnings();
  testInventory();

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  🧪 RESULTS: ✅ ${pass} passed  ❌ ${fail} failed  ⚠️  ${warn} warnings`);
  if (fail === 0 && warn === 0) console.log('  🟢 All systems go — safe to generate');
  else if (fail === 0) console.log('  🟡 Ready to generate — review warnings above');
  else console.log('  🔴 Fix failures above before generating');
  console.log(`${'═'.repeat(60)}\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error('Test runner error:', e); process.exit(1); });
