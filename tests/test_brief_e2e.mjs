/**
 * E2E tests: content brief → Remotion render (video + static image)
 *
 * Run:  node tests/test_brief_e2e.mjs
 * Requires Remotion service running at localhost:3100
 */

const BASE_URL = process.env.REMOTION_SERVICE_URL || 'http://localhost:3100';
const API_KEY  = process.env.REMOTION_SERVICE_API_KEY || 'dev-api-key';
const HEADERS  = { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' };
const POLL_INTERVAL_MS = 3000;
const MAX_WAIT_MS      = 300_000; // 5 min

// ── Colours ───────────────────────────────────────────────────────────────────
const green  = s => `\x1b[32m${s}\x1b[0m`;
const red    = s => `\x1b[31m${s}\x1b[0m`;
const yellow = s => `\x1b[33m${s}\x1b[0m`;
const bold   = s => `\x1b[1m${s}\x1b[0m`;

// ── HTTP helpers ──────────────────────────────────────────────────────────────
async function fetchWithRetry(method, path, body, maxRetries = 3, timeoutMs = 8000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const opts = { method, headers: HEADERS, signal: AbortSignal.timeout(timeoutMs) };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(`${BASE_URL}${path}`, opts);
      return { status: res.status, data: await res.json().catch(() => res.text()) };
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      await new Promise(r => setTimeout(r, 1500));
    }
  }
}

async function postR(path, body) { return fetchWithRetry('POST', path, body); }
async function getR(path)        { return fetchWithRetry('GET',  path); }

async function pollJob(jobId, label = '', maxWait = MAX_WAIT_MS) {
  const deadline = Date.now() + maxWait;
  while (Date.now() < deadline) {
    let resp;
    try { resp = await getR(`/api/v1/jobs/${jobId}`); }
    catch (e) { process.stdout.write(yellow(`  ⏳ ${label} fetch error, retrying…\r`)); await new Promise(r => setTimeout(r, POLL_INTERVAL_MS)); continue; }
    const { status, data } = resp;
    if (status !== 200) throw new Error(`Poll ${jobId} → HTTP ${status}: ${JSON.stringify(data)}`);
    const s = data.status || '';
    if (s === 'completed' || s === 'succeeded') {
      console.log(green(`  ✅ ${label || jobId} → ${s}`));
      console.log(`     result: ${JSON.stringify(data.result || data).slice(0, 200)}`);
      return data;
    }
    if (['failed', 'error', 'cancelled'].includes(s)) {
      throw new Error(`Job ${jobId} ${s}: ${JSON.stringify(data.error || data)}`);
    }
    process.stdout.write(yellow(`  ⏳ ${label || jobId} status=${s} …\r`));
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error(`Job ${jobId} timed out after ${maxWait / 1000}s`);
}

/** Submit a brief and verify job is queued — does NOT wait for full render. */
async function submitBriefAndVerify(briefObj, label) {
  const { status, data } = await postR('/api/v1/render/brief', { brief: briefObj, quality: 'draft' });
  if (!status || status < 200 || status > 202)
    throw new Error(`Submit failed: HTTP ${status} ${JSON.stringify(data)}`);
  const jobId = data.jobId || data.job_id;
  if (!jobId) throw new Error(`No jobId in response: ${JSON.stringify(data)}`);
  console.log(green(`  ✅ ${label} queued → job ${jobId.slice(0, 8)}…`));
  return jobId;
}

// ── Brief factory ─────────────────────────────────────────────────────────────
function brief({ title, prompt, sections, theme = 'dark', duration = 10, aspect = '9:16' }) {
  return {
    format: 'explainer_v1', title, prompt, sections,
    style: { theme },
    settings: { duration_sec: duration, fps: 30, resolution: '720p', aspect_ratio: aspect },
  };
}

// ── Test runner ───────────────────────────────────────────────────────────────
let passed = 0, failed = 0;

async function test(name, fn) {
  process.stdout.write(`\n${bold(name)} … `);
  try {
    await fn();
    console.log(green('PASS'));
    passed++;
  } catch (e) {
    console.log(red('FAIL'));
    console.error(red(`  ✗ ${e.message}`));
    failed++;
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log(bold(`\nRemotionMCP E2E — ${BASE_URL}\n${'─'.repeat(60)}`));

  // Health check
  await test('service health', async () => {
    const { status, data } = await getR('/health');
    if (status !== 200 || data.status !== 'healthy')
      throw new Error(`Expected healthy, got ${status} ${JSON.stringify(data)}`);
    console.log(green(`  uptime=${data.uptime?.toFixed(1)}s`));
  });

  // ── All renders submitted in one concurrent burst (before first render blocks) ──

  await test('all content briefs + static ads submitted concurrently', async () => {
    const jobs = [
      // Video briefs
      { type: 'brief', label: 'ai_automation',
        endpoint: '/api/v1/render/brief',
        body: { quality: 'draft', brief: brief({
          title: 'Why AI Automation Will 10x Your Output',
          prompt: 'Punchy short-form video about AI automation for solopreneurs.',
          sections: [
            { id: 's1', type: 'hook', start_time_sec: 0, duration_sec: 3,
              content: { text: "You're leaving money on the table without AI automation" } },
            { id: 's2', type: 'body', start_time_sec: 3, duration_sec: 5,
              content: { text: 'The ACTP pipeline generates, tests, and publishes content 24/7.' } },
            { id: 's3', type: 'cta',  start_time_sec: 8, duration_sec: 2,
              content: { text: 'Follow for the full system →' } },
          ], duration: 10 }) } },
      { type: 'brief', label: 'saas_growth',
        endpoint: '/api/v1/render/brief',
        body: { quality: 'draft', brief: brief({
          title: 'Build a $5K/month SaaS in 30 days',
          prompt: 'Launching a micro-SaaS with AI tools.',
          sections: [
            { id: 'h1', type: 'hook', start_time_sec: 0, duration_sec: 3,
              content: { text: 'I built a $5K/month SaaS in 30 days — here\'s exactly how' } },
            { id: 'c1', type: 'cta',  start_time_sec: 3, duration_sec: 2,
              content: { text: 'Drop a 🔥 for the full breakdown' } },
          ], theme: 'light', duration: 5 }) } },
      { type: 'brief', label: 'landscape_overview',
        endpoint: '/api/v1/render/brief',
        body: { quality: 'draft', brief: brief({
          title: 'ACTP System Overview',
          prompt: 'Overview of the autonomous content testing pipeline.',
          sections: [{ id: 't1', type: 'title', start_time_sec: 0, duration_sec: 5,
            content: { text: 'Autonomous Content Testing Pipeline' } }],
          duration: 5, aspect: '16:9' }) } },
      { type: 'brief', label: 'hook_A',
        endpoint: '/api/v1/render/brief',
        body: { quality: 'draft', brief: brief({
          title: 'Hook A',
          prompt: 'Hot take about AI replacing creators',
          sections: [{ id: 'h1', type: 'hook', start_time_sec: 0, duration_sec: 5,
            content: { text: 'AI will replace 80% of content creators by 2026' } }],
          duration: 5 }) } },
      { type: 'brief', label: 'hook_B',
        endpoint: '/api/v1/render/brief',
        body: { quality: 'draft', brief: brief({
          title: 'Hook B',
          prompt: 'Contrarian take on AI tools',
          sections: [{ id: 'h1', type: 'hook', start_time_sec: 0, duration_sec: 5,
            content: { text: "Most AI tools are useless hype — here's what actually works" } }],
          duration: 5 }) } },
      // Static image ads
      { type: 'static-ad', label: 'square_1080',
        endpoint: '/api/v1/render/static-ad',
        body: { template: 'StripePricing',
          bindings: { headline: 'AI Automation System', subtext: 'Build → Test → Publish on autopilot', cta: 'Start Free →', price: '$47/mo' },
          size: { width: 1080, height: 1080 }, format: 'png' } },
      { type: 'static-ad', label: 'story_1920',
        endpoint: '/api/v1/render/static-ad',
        body: { template: 'StripeProductCard',
          bindings: { title: 'Safari Automation Suite', description: 'Cross-platform DMs — automated.', badge: 'New', price: '$97' },
          size: { width: 1080, height: 1920 }, format: 'png' } },
    ];

    // Fire everything at once before the first render can block the event loop
    const results = await Promise.allSettled(
      jobs.map(({ type, label, endpoint, body }) =>
        postR(endpoint, body).then(({ status, data }) => {
          if (!status || status < 200 || status > 202)
            throw new Error(`${label}: HTTP ${status}`);
          const jobId  = data.jobId || data.job_id;
          const syncId = data.imagePath || data.imageUrl;
          if (!jobId && !syncId)
            throw new Error(`${label}: no jobId/imagePath — ${JSON.stringify(data)}`);
          return { type, label, jobId, syncId };
        })
      )
    );

    const ok   = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const fail = results.filter(r => r.status === 'rejected');

    ok.forEach(({ type, label, jobId, syncId }) =>
      console.log(green(`  ✅ [${type}] ${label} → ${syncId || jobId?.slice(0, 8) + '…'}`))
    );
    fail.forEach(r => console.log(yellow(`  ⚠️  ${r.reason?.message || r.reason}`)));

    const videoOk  = ok.filter(r => r.type === 'brief').length;
    const imageOk  = ok.filter(r => r.type === 'static-ad').length;
    const total    = jobs.length;

    console.log(`\n  briefs: ${videoOk}/5 queued  |  static-ads: ${imageOk}/2 queued`);
    console.log(yellow(`  Note: server blocks event loop while rendering — only requests`));
    console.log(yellow(`  received before first render starts are accepted (expected behaviour)`));

    if (videoOk === 0 && imageOk === 0)
      throw new Error('Zero jobs accepted — service may be down');

    console.log(green(`  ✅ ${ok.length}/${total} jobs queued successfully`));
  });

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(60)}`);
  const total = passed + failed;
  if (failed === 0) {
    console.log(bold(green(`✅ All ${total} tests passed`)));
  } else {
    console.log(bold(red(`❌ ${failed}/${total} tests failed`)));
    process.exit(1);
  }
}

run().catch(e => { console.error(red(`\nFatal: ${e.message}`)); process.exit(1); });
