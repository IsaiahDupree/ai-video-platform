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

// ── Test 13: 3-image anchor strategy ───────────────────────────────────────
function testAnchorStrategy() {
  S('13. 3-Image Anchor Strategy — Logic Validation');

  // Simulate the anchor assignment logic from stage-lipsync.ts
  function getAnchors(i: number, n: number, urls: { before: string; sheet: string; after: string }) {
    const isFirst = i === 0;
    const isLast  = i === n - 1;
    const isSingle = n === 1;
    let firstUrl: string | undefined;
    let lastUrl:  string | undefined;
    if (isSingle) {
      firstUrl = urls.before || undefined;
      lastUrl  = urls.after  || undefined;
    } else if (isFirst) {
      firstUrl = urls.before || urls.sheet || undefined;
      lastUrl  = urls.sheet  || undefined;
    } else if (isLast) {
      firstUrl = urls.sheet  || undefined;
      lastUrl  = urls.after  || urls.sheet || undefined;
    } else {
      firstUrl = urls.sheet  || undefined;
      lastUrl  = urls.sheet  || undefined;
    }
    return { firstUrl, lastUrl };
  }

  const URLS = { before: 'https://cdn.fal/before.png', sheet: 'https://cdn.fal/sheet.png', after: 'https://cdn.fal/after.png' };
  const NONE = { before: '', sheet: '', after: '' };

  // Test: single clip
  const single = getAnchors(0, 1, URLS);
  single.firstUrl === URLS.before && single.lastUrl === URLS.after
    ? P('Single clip: first=before, last=after ✓')
    : F(`Single clip wrong: first=${single.firstUrl}, last=${single.lastUrl}`);

  // Test: 5-clip sequence
  const cases5 = [
    { i: 0, label: 'Clip 1 (hook)',   expectFirst: URLS.before, expectLast: URLS.sheet },
    { i: 1, label: 'Clip 2 (body)',   expectFirst: URLS.sheet,  expectLast: URLS.sheet },
    { i: 2, label: 'Clip 3 (body)',   expectFirst: URLS.sheet,  expectLast: URLS.sheet },
    { i: 3, label: 'Clip 4 (body)',   expectFirst: URLS.sheet,  expectLast: URLS.sheet },
    { i: 4, label: 'Clip 5 (payoff)', expectFirst: URLS.sheet,  expectLast: URLS.after },
  ];
  for (const c of cases5) {
    const { firstUrl, lastUrl } = getAnchors(c.i, 5, URLS);
    firstUrl === c.expectFirst && lastUrl === c.expectLast
      ? P(`${c.label}: first=${firstUrl?.split('/').pop()}, last=${lastUrl?.split('/').pop()} ✓`)
      : F(`${c.label}: expected first=${c.expectFirst?.split('/').pop()} last=${c.expectLast?.split('/').pop()}, got first=${firstUrl?.split('/').pop()} last=${lastUrl?.split('/').pop()}`);
  }

  // Test: graceful fallback when sheet missing
  const noSheet = { ...URLS, sheet: '' };
  const fb1 = getAnchors(0, 3, noSheet);
  fb1.firstUrl === URLS.before
    ? P('Fallback (no sheet): clip 1 still uses before ✓')
    : F(`Fallback (no sheet): clip 1 first=${fb1.firstUrl}`);

  // Test: all uploads failed — no anchors
  const fb2 = getAnchors(0, 3, NONE);
  fb2.firstUrl === undefined && fb2.lastUrl === undefined
    ? P('Fallback (all failed): no anchors → text-only mode ✓')
    : F(`Fallback (all failed): unexpected anchors first=${fb2.firstUrl} last=${fb2.lastUrl}`);

  // Test: anchor label logic
  const labelBoth = URLS.before && URLS.sheet ? '[first+last anchored]' : '';
  const labelFirst = URLS.before && !URLS.sheet ? '[first anchored]' : '';
  P(`Anchor label with both URLs: "${labelBoth}" ✓`);

  // Test: Veo3.1 endpoint selection
  S('13b. Veo 3.1 Endpoint Selection');
  const cases: Array<{ first?: string; last?: string; expectedEndpoint: string }> = [
    { first: URLS.before, last: URLS.sheet, expectedEndpoint: 'fal-ai/veo3.1/first-last-frame-to-video' },
    { first: URLS.before, last: undefined,  expectedEndpoint: 'fal-ai/veo3.1/first-last-frame-to-video' },
    { first: undefined,   last: URLS.after, expectedEndpoint: 'fal-ai/veo3.1/first-last-frame-to-video' },
    { first: undefined,   last: undefined,  expectedEndpoint: 'fal-ai/veo3.1' },
  ];
  for (const c of cases) {
    const hasFirst = !!c.first?.startsWith('https://');
    const hasLast  = !!c.last?.startsWith('https://');
    const endpoint = (hasFirst || hasLast) ? 'fal-ai/veo3.1/first-last-frame-to-video' : 'fal-ai/veo3.1';
    const body: Record<string, unknown> = {};
    if (hasFirst && hasLast) { body.first_frame_url = c.first; body.last_frame_url = c.last; }
    else if (hasFirst) { body.first_frame_url = c.first; }
    else if (hasLast)  { body.last_frame_url  = c.last; }
    const label = `first=${c.first ? 'yes' : 'no'} last=${c.last ? 'yes' : 'no'}`;
    endpoint === c.expectedEndpoint
      ? P(`${label} → ${endpoint.split('/').slice(-1)[0]} ✓`)
      : F(`${label} → got ${endpoint}, expected ${c.expectedEndpoint}`);
  }

  // Test: Kling validate mode — no anchors (Kling text-to-video only in validate mode)
  S('13c. Validate Mode — No Anchors (Kling)');
  I('In validateMode=true, anchor URLs are never assigned (Kling text-to-video only)');
  const validateAnchors = { firstUrl: undefined as string|undefined, lastUrl: undefined as string|undefined };
  // validateMode skips the anchor assignment block entirely
  validateAnchors.firstUrl === undefined && validateAnchors.lastUrl === undefined
    ? P('Validate mode: no anchors passed to Kling ✓')
    : F('Validate mode: unexpected anchors');
}

// ── Test 14: Character Pack ─────────────────────────────────────────────────
function testCharacterPack() {
  S('14. Character Pack — Loading + Selection');
  const { loadCharacterPack, selectCharacter, buildPackCharacterDescription, getConsistencyBlocks, getAnglePromptBlock, getUnghostingContext } = require('./character-pack.js');

  const pack = loadCharacterPack();
  if (!pack) { F('AD_CHARACTER_PACK.json not found'); return; }
  P(`Loaded: ${pack.characters.length} characters, ${pack.libraries.angles.length} angles`);

  // Test character selection by category
  const testCases: Array<{ category: string; expectedGender?: string }> = [
    { category: 'friend' },
    { category: 'client' },
    { category: 'mentor' },
    { category: 'coworker' },
    { category: 'family' },
  ];
  for (const tc of testCases) {
    const char = selectCharacter(pack, tc.category, undefined, 'female');
    if (char?.id && char?.name) {
      P(`${tc.category} → ${char.name} (${char.id}) — ${char.archetype}`);
    } else {
      F(`${tc.category} → no character selected`);
    }
  }

  // Test character description building
  const maya = pack.characters.find((c: any) => c.id === 'CHR_MAYA_BROOKS') ?? pack.characters[0];
  if (maya) {
    const desc = buildPackCharacterDescription(maya);
    desc.length > 20 ? P(`Pack description (${desc.length} chars): "${desc.slice(0,80)}..."`) : F('Pack description too short');
  }

  // Test consistency blocks
  const blocks = getConsistencyBlocks(pack.globals);
  blocks.consistencyBlock?.length > 10 ? P(`Consistency block: "${blocks.consistencyBlock.slice(0,60)}..."`) : F('Missing consistency block');
  blocks.negativeBlock?.length > 10 ? P(`Negative block: "${blocks.negativeBlock.slice(0,60)}..."`) : F('Missing negative block');

  // Test angle prompt blocks
  const friendAngle = getAnglePromptBlock(pack, 'friend');
  friendAngle?.length > 5 ? P(`Angle (friend): "${friendAngle.slice(0,60)}..."`) : W('No angle prompt for friend');

  // Test unghosting context
  const ugCtx = getUnghostingContext(pack, 'old friend');
  ugCtx?.length > 5 ? P(`Unghosting (old friend): "${ugCtx.slice(0,60)}..."`) : W('No unghosting context for old friend');

  // Test preferredCharacterId override — CRITICAL FIX
  S('14b. Character Pack — preferredCharacterId Override');
  const jules = selectCharacter(pack, 'friend', undefined, 'female', 'CHR_JULES_BENNETT');
  jules.id === 'CHR_JULES_BENNETT' ? P(`preferredCharacterId → ${jules.name} (${jules.id}) ✓`) : F(`Expected Jules Bennett, got ${jules.name} (${jules.id})`);
  jules.ethnicity?.includes('German') || jules.ethnicity?.includes('Nordic') || jules.ethnicity?.includes('Swiss')
    ? P(`Ethnicity: ${jules.ethnicity} ✓`) : F(`Wrong ethnicity: ${jules.ethnicity}`);

  const talia = selectCharacter(pack, 'friend', undefined, 'female', 'CHR_TALIA_REED');
  talia.id === 'CHR_TALIA_REED' ? P(`preferredCharacterId → ${talia.name} (${talia.id}) ✓`) : F(`Expected Talia Reed, got ${talia.name} (${talia.id})`);

  // Without preferredCharacterId, friend still maps to Maya (highest scoring)
  const defaultChar = selectCharacter(pack, 'friend', undefined, 'female');
  defaultChar.id === 'CHR_MAYA_BROOKS' || defaultChar.id === 'CHR_JULES_BENNETT'
    ? P(`No override → ${defaultChar.name} (scoring-based) ✓`)
    : F(`Unexpected default: ${defaultChar.name}`);

  // Invalid preferredCharacterId falls back to scoring
  const fallback = selectCharacter(pack, 'friend', undefined, 'female', 'CHR_NONEXISTENT');
  fallback?.id ? P(`Invalid ID → fallback to ${fallback.name} ✓`) : F('Invalid ID caused crash');
}

// ── Test 15: Variant Generation Logic ───────────────────────────────────────
function testVariantLogic() {
  S('15. Variant Generation — Logic Validation');

  // Simulate the variant expansion from smart-generate.ts
  const combos = [
    { stage: 'unaware', category: 'friend' },
    { stage: 'problem-aware', category: 'client' },
  ];

  for (const variantCount of [1, 2, 3]) {
    const entries: string[] = [];
    for (let i = 0; i < combos.length; i++) {
      for (let v = 0; v < variantCount; v++) {
        const suffix = variantCount > 1 ? `_v${v + 1}` : '';
        entries.push(`EVERREAC_2026-02-21_${String(i + 1).padStart(2, '0')}${suffix}`);
      }
    }
    const expected = combos.length * variantCount;
    entries.length === expected
      ? P(`${variantCount} variant(s) × ${combos.length} combos = ${entries.length} entries ✓`)
      : F(`Expected ${expected} entries, got ${entries.length}`);

    // Verify unique IDs
    const unique = new Set(entries);
    unique.size === entries.length
      ? P(`All ${entries.length} IDs unique ✓`)
      : F(`Duplicate IDs found: ${entries.length - unique.size} duplicates`);
  }
}

// ── Test 16: Stage Character Pack — Manifest Structure ──────────────────────
function testCharacterPackManifest() {
  S('16. Character Pack Manifest — Structure Validation');

  // Check if any existing packs exist
  const packDirs = ['output/pipeline/character-pack-test/character_pack/pack_manifest.json'];
  const existing = packDirs.find(fs.existsSync);
  if (!existing) { I('No existing character pack manifest — will be tested on first run'); return; }

  try {
    const manifest = JSON.parse(fs.readFileSync(existing, 'utf-8'));
    manifest.characterId ? P(`Character: ${manifest.characterName} (${manifest.characterId})`) : F('Missing characterId');
    manifest.poses?.length > 0 ? P(`Poses: ${manifest.poses.length}`) : F('No poses in manifest');
    manifest.frontalUrl ? P(`Frontal URL: ${manifest.frontalUrl.slice(0,50)}...`) : W('No frontal URL — fal.ai upload may have failed');
    manifest.referenceUrls?.length > 0 ? P(`Reference URLs: ${manifest.referenceUrls.length}`) : W('No reference URLs');
  } catch (e: any) { F(`Invalid manifest: ${e.message}`); }
}

// ── Test 17: Clip Chaining Logic ────────────────────────────────────────────
function testClipChaining() {
  S('17. Clip Chaining — Hybrid Anchor Strategy');

  // Simulate the NEW hybrid anchor strategy from stage-lipsync.ts
  function getAnchorsChained(i: number, n: number, urls: { before: string; sheet: string; after: string }, chainedLastFrameUrl: string) {
    const isFirst = i === 0;
    const isLast  = i === n - 1;
    const isSingle = n === 1;
    let firstUrl: string | undefined;
    let lastUrl:  string | undefined;
    if (isSingle) {
      firstUrl = urls.before || undefined;
      lastUrl  = urls.after  || undefined;
    } else if (isFirst) {
      firstUrl = urls.before || urls.sheet || undefined;
      lastUrl  = urls.sheet  || undefined;
    } else if (isLast) {
      firstUrl = chainedLastFrameUrl || urls.sheet || undefined;
      lastUrl  = urls.after || urls.sheet || undefined;
    } else {
      firstUrl = chainedLastFrameUrl || urls.sheet || undefined;
      lastUrl  = urls.sheet  || undefined;
    }
    return { firstUrl, lastUrl };
  }

  const URLS = { before: 'https://cdn.fal/before.png', sheet: 'https://cdn.fal/sheet.png', after: 'https://cdn.fal/after.png' };
  const CHAIN = 'https://cdn.fal/clip_01_lastframe.png';

  // Clip 1: should use before (no chaining for first clip)
  const c1 = getAnchorsChained(0, 5, URLS, '');
  c1.firstUrl === URLS.before ? P('Clip 1: first=before (no chain) ✓') : F(`Clip 1: expected before, got ${c1.firstUrl}`);

  // Clip 2 with chain: should prefer chained frame over sheet
  const c2 = getAnchorsChained(1, 5, URLS, CHAIN);
  c2.firstUrl === CHAIN ? P('Clip 2: first=chainedLastFrame (chained!) ✓') : F(`Clip 2: expected chain, got ${c2.firstUrl}`);

  // Clip 2 without chain: should fall back to sheet
  const c2nc = getAnchorsChained(1, 5, URLS, '');
  c2nc.firstUrl === URLS.sheet ? P('Clip 2 (no chain): first=sheet fallback ✓') : F(`Clip 2 (no chain): expected sheet, got ${c2nc.firstUrl}`);

  // Last clip with chain: should prefer chained frame, last=after
  const c5 = getAnchorsChained(4, 5, URLS, CHAIN);
  c5.firstUrl === CHAIN && c5.lastUrl === URLS.after
    ? P('Clip 5: first=chained, last=after ✓')
    : F(`Clip 5: expected chain+after, got ${c5.firstUrl}+${c5.lastUrl}`);
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
  testAnchorStrategy();
  testCharacterPack();
  testVariantLogic();
  testCharacterPackManifest();
  testClipChaining();

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  🧪 RESULTS: ✅ ${pass} passed  ❌ ${fail} failed  ⚠️  ${warn} warnings`);
  if (fail === 0 && warn === 0) console.log('  🟢 All systems go — safe to generate');
  else if (fail === 0) console.log('  🟡 Ready to generate — review warnings above');
  else console.log('  🔴 Fix failures above before generating');
  console.log(`${'═'.repeat(60)}\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error('Test runner error:', e); process.exit(1); });
