#!/usr/bin/env node
/**
 * Scene Visual Benchmark — render one still per new research-backed scene,
 * send each to Telegram for review.
 *
 * Usage:
 *   node scripts/benchmark-scenes.js
 *   node scripts/benchmark-scenes.js --dry-run   (skip Telegram, save files only)
 *   node scripts/benchmark-scenes.js --scene countdown  (single scene)
 */
'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// ── Config ────────────────────────────────────────────────────────────────────

const REMOTION_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(REMOTION_DIR, 'output', 'scene-benchmark');
const BRIEFS_DIR = path.join(REMOTION_DIR, 'output', 'scene-benchmark', 'briefs');

function loadEnv(envPath) {
  try {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^([\w]+)=(.+)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {}
}
loadEnv(path.join(REMOTION_DIR, '..', 'actp-worker', '.env'));

const ARGS = process.argv.slice(2);
const getArg = (flag, def) => { const i = ARGS.indexOf(flag); return i !== -1 ? ARGS[i + 1] : def; };
const DRY_RUN = ARGS.includes('--dry-run');
const ONLY_SCENE = getArg('--scene', null);

// ── Scene definitions ─────────────────────────────────────────────────────────

const DARK_STYLE = {
  theme: 'dark',
  primary_color: '#ffffff',
  secondary_color: '#a1a1aa',
  accent_color: '#3b82f6',
  font_heading: 'Montserrat',
  font_body: 'Inter',
  background_type: 'gradient',
  background_value: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
};

const TIKTOK_STYLE = {
  theme: 'dark',
  primary_color: '#ffffff',
  secondary_color: '#aaaaaa',
  accent_color: '#fe2c55',
  font_heading: 'Montserrat',
  font_body: 'Inter',
  background_type: 'gradient',
  background_value: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 100%)',
};

const LI_STYLE = {
  theme: 'light',
  primary_color: '#1a1a2e',
  secondary_color: '#4a5568',
  accent_color: '#0077b5',
  font_heading: 'Inter',
  font_body: 'Inter',
  background_type: 'solid',
  background_value: '#f8f9fa',
};

const TW_STYLE = {
  theme: 'dark',
  primary_color: '#ffffff',
  secondary_color: '#71767b',
  accent_color: '#1d9bf0',
  font_heading: 'Inter',
  font_body: 'Inter',
  background_type: 'solid',
  background_value: '#000000',
};

const THREADS_STYLE = {
  theme: 'dark',
  primary_color: '#f5f5f5',
  secondary_color: '#a8a8a8',
  accent_color: '#ffffff',
  font_heading: 'Inter',
  font_body: 'Inter',
  background_type: 'solid',
  background_value: '#101010',
};

function makeBrief(id, style, sections, res = { width: 1080, height: 1920 }, fps = 30) {
  const totalDuration = sections.reduce((s, sec) => s + sec.duration_sec, 0);
  return {
    id,
    format: 'explainer_v1',
    version: '1.0',
    created_at: new Date().toISOString().split('T')[0],
    settings: {
      resolution: res,
      fps,
      duration_sec: totalDuration,
      aspect_ratio: res.width === res.height ? '1:1' : res.width > res.height ? '16:9' : '9:16',
    },
    style,
    sections,
  };
}

// midpoint frame for rendering the most interesting part
const mid = (sec, fps = 30) => Math.floor(sec * fps * 0.55);

const SCENES = [
  {
    name: 'countdown',
    emoji: '⏳',
    label: 'Countdown Hook',
    caption: '⏳ CountdownScene — 3-2-1 stamp-in + expanding ring\nProven 65%+ TikTok 3s retention hook',
    frame: mid(5),
    brief: makeBrief('bench_countdown', TIKTOK_STYLE, [
      {
        id: 's1', type: 'countdown', duration_sec: 5, start_time_sec: 0,
        content: { type: 'countdown', from: 3, pre_text: 'WAIT...' },
      },
    ]),
  },
  {
    name: 'problem_solution',
    emoji: '🔄',
    label: 'Problem/Solution',
    caption: '🔄 ProblemSolutionScene — sequential layout\n#1 UGC converting pattern (3-5x lift)',
    frame: mid(14),
    brief: makeBrief('bench_problem_solution', TIKTOK_STYLE, [
      {
        id: 's1', type: 'problem_solution', duration_sec: 14, start_time_sec: 0,
        content: {
          type: 'problem_solution',
          problem: 'Spending 3 hours on content that nobody sees',
          solution: 'One 30-second AI workflow generates a week of posts',
          layout: 'sequential',
          problem_hold_percent: 0.5,
        },
      },
    ]),
  },
  {
    name: 'myth_reality',
    emoji: '🤯',
    label: 'Myth/Reality',
    caption: '🤯 MythRealityScene — glitch + strikethrough → stamp reveal\nPattern interrupt with authority boost',
    frame: mid(18),
    brief: makeBrief('bench_myth_reality', TIKTOK_STYLE, [
      {
        id: 's1', type: 'myth_reality', duration_sec: 18, start_time_sec: 0,
        content: {
          type: 'myth_reality',
          myth: 'You need 10K followers to get clients',
          reality: '7 of my first 10 clients came from accounts under 500 followers',
          myth_hold_percent: 0.45,
        },
      },
    ]),
  },
  {
    name: 'checklist',
    emoji: '✅',
    label: 'Checklist (LinkedIn)',
    caption: '✅ ChecklistScene — stagger reveal with ✓/✗ bounce-in\nLinkedIn framework content — 5-7x saves',
    frame: mid(20),
    brief: makeBrief('bench_checklist', LI_STYLE, [
      {
        id: 's1', type: 'checklist', duration_sec: 20, start_time_sec: 0,
        content: {
          type: 'checklist',
          title: 'AI Automation Audit',
          items: [
            { text: 'Lead gen runs 24/7 without you', checked: true, emoji: '🤖' },
            { text: 'Follow-ups happen automatically', checked: true, emoji: '📧' },
            { text: 'CRM updates on every interaction', checked: true, emoji: '📊' },
            { text: 'Manually copy-pasting data daily', checked: false },
            { text: 'Chasing leads in your head', checked: false },
          ],
          reveal_mode: 'stagger',
        },
      },
    ], { width: 1080, height: 1080 }),
  },
  {
    name: 'bar_chart',
    emoji: '📊',
    label: 'Bar Chart (LinkedIn)',
    caption: '📊 BarChartScene — animated bars grow with value labels\nData authority content for LinkedIn',
    frame: mid(12),
    brief: makeBrief('bench_bar_chart', LI_STYLE, [
      {
        id: 's1', type: 'bar_chart', duration_sec: 12, start_time_sec: 0,
        content: {
          type: 'bar_chart',
          title: 'Revenue after AI automation',
          bars: [
            { label: 'Month 1', value: 2400 },
            { label: 'Month 2', value: 5800 },
            { label: 'Month 3', value: 9200 },
            { label: 'Month 4', value: 14500, highlighted: true },
          ],
          unit: '$',
          orientation: 'vertical',
        },
      },
    ], { width: 1080, height: 1080 }),
  },
  {
    name: 'thread_reveal',
    emoji: '🧵',
    label: 'Thread Reveal',
    caption: '🧵 ThreadRevealScene — sequential Twitter/Threads post stack\nReplies weighted 75x on Twitter algo',
    frame: mid(30),
    brief: makeBrief('bench_thread_reveal', TW_STYLE, [
      {
        id: 's1', type: 'thread_reveal', duration_sec: 30, start_time_sec: 0,
        content: {
          type: 'thread_reveal',
          handle: '@isaiah_builds',
          avatar_initial: 'I',
          reveal_mode: 'sequential',
          posts: [
            { text: 'I built an AI system that sends 50 personalized DMs/day on autopilot.', number: 1 },
            { text: 'It reads each prospect\'s recent posts, finds a genuine hook, and writes the message.', number: 2 },
            { text: 'Week 1: 0 responses. I almost quit.', number: 3 },
            { text: 'Week 4: 12 booked calls, 3 closed clients. $7,500 MRR added.', number: 4 },
          ],
        },
      },
    ], { width: 1280, height: 720 }, 30),
  },
  {
    name: 'ugc_style',
    emoji: '📱',
    label: 'UGC Style',
    caption: '📱 UGCStyleScene — vignette + raw overlay feel\nRaw/authentic converts 3-5x over polished',
    frame: mid(6),
    brief: makeBrief('bench_ugc_style', TIKTOK_STYLE, [
      {
        id: 's1', type: 'ugc_style', duration_sec: 6, start_time_sec: 0,
        content: {
          type: 'ugc_style',
          caption: 'This AI system replaced my $4K/mo VA',
          subtext: 'Built it in a weekend. Works 24/7.',
          platform: 'tiktok',
          overlay_style: 'raw',
          emoji: '🤫',
        },
      },
    ]),
  },
  {
    name: 'curiosity_gap',
    emoji: '❓',
    label: 'Curiosity Gap',
    caption: '❓ CuriosityGapScene — tension dots → giant ? → reveal\n#1 hook technique: 4-7x watch time',
    frame: mid(18),
    brief: makeBrief('bench_curiosity_gap', DARK_STYLE, [
      {
        id: 's1', type: 'curiosity_gap', duration_sec: 18, start_time_sec: 0,
        content: {
          type: 'curiosity_gap',
          setup: 'Nobody talks about the real reason most AI businesses fail.',
          reveal: "It's not the tech. It's the offer.",
          reveal_label: 'THE REAL REASON',
          hold_percent: 0.5,
        },
      },
    ]),
  },
  {
    name: 'social_proof',
    emoji: '🏆',
    label: 'Social Proof',
    caption: '🏆 SocialProofScene — countUp metric + logos + testimonials\n74% of decisions driven by social proof',
    frame: mid(15),
    brief: makeBrief('bench_social_proof', DARK_STYLE, [
      {
        id: 's1', type: 'social_proof', duration_sec: 15, start_time_sec: 0,
        content: {
          type: 'social_proof',
          headline: 'Founders who automated their outreach',
          metric: { value: '2,400+', label: 'booked calls generated' },
          logos: [
            { name: 'SaaS Co', color: '#3b82f6' },
            { name: 'AgencyX', color: '#8b5cf6' },
            { name: 'StartupY', color: '#10b981' },
          ],
          style: 'combined',
        },
      },
    ]),
  },
];

// ── Telegram helpers ──────────────────────────────────────────────────────────

function sendTelegramPhoto(imagePath, caption) {
  return new Promise((resolve, reject) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) { console.log(`[SKIP] No Telegram credentials — ${caption}`); return resolve(); }

    const imageData = fs.readFileSync(imagePath);
    const boundary = `----FormBoundary${crypto.randomBytes(8).toString('hex')}`;
    const CRLF = '\r\n';

    const header = Buffer.from(
      `--${boundary}${CRLF}Content-Disposition: form-data; name="chat_id"${CRLF}${CRLF}${chatId}${CRLF}` +
      `--${boundary}${CRLF}Content-Disposition: form-data; name="caption"${CRLF}${CRLF}${caption}${CRLF}` +
      `--${boundary}${CRLF}Content-Disposition: form-data; name="photo"; filename="scene.png"${CRLF}Content-Type: image/png${CRLF}${CRLF}`,
      'utf8'
    );
    const footer = Buffer.from(`${CRLF}--${boundary}--${CRLF}`, 'utf8');
    const body = Buffer.concat([header, imageData, footer]);

    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendPhoto`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        const json = JSON.parse(data);
        if (json.ok) resolve(json);
        else reject(new Error(`Telegram error: ${json.description}`));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function sendTelegramMessage(text) {
  return new Promise((resolve, reject) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) { console.log(`[SKIP] No Telegram credentials`); return resolve(); }
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Render helper ─────────────────────────────────────────────────────────────

function renderStill(briefPath, outputPath, frame) {
  console.log(`  → Rendering frame ${frame}...`);
  execSync(
    `npx tsx "${path.join(REMOTION_DIR, 'scripts', 'render-brief-still.ts')}" ` +
    `"${briefPath}" "${outputPath}" ${frame}`,
    { cwd: REMOTION_DIR, stdio: 'pipe', timeout: 300000 }
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(BRIEFS_DIR, { recursive: true });

  const scenes = ONLY_SCENE
    ? SCENES.filter(s => s.name === ONLY_SCENE)
    : SCENES;

  if (!scenes.length) {
    console.error(`No scene found matching: ${ONLY_SCENE}`);
    console.error(`Available: ${SCENES.map(s => s.name).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n🎬 Scene Visual Benchmark — ${scenes.length} scenes\n`);

  if (!DRY_RUN) {
    await sendTelegramMessage(
      `🎬 <b>Scene Visual Benchmark</b>\n` +
      `Rendering ${scenes.length} new research-backed scenes...\n\n` +
      scenes.map(s => `${s.emoji} ${s.label}`).join('\n')
    );
  }

  const results = [];

  for (const scene of scenes) {
    console.log(`\n[${scene.emoji}] ${scene.label}`);
    const briefPath = path.join(BRIEFS_DIR, `${scene.name}.json`);
    const imgPath = path.join(OUTPUT_DIR, `${scene.name}.png`);

    // Write brief
    fs.writeFileSync(briefPath, JSON.stringify(scene.brief, null, 2));

    try {
      renderStill(briefPath, imgPath, scene.frame);
      const size = Math.round(fs.statSync(imgPath).size / 1024);
      console.log(`  ✓ ${imgPath} (${size}KB)`);

      if (!DRY_RUN) {
        await sendTelegramPhoto(imgPath, scene.caption);
        console.log(`  📱 Sent to Telegram`);
      }

      results.push({ name: scene.name, status: 'ok', path: imgPath });
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
      results.push({ name: scene.name, status: 'failed', error: err.message });
    }
  }

  // Summary
  const ok = results.filter(r => r.status === 'ok').length;
  const failed = results.filter(r => r.status === 'failed').length;

  console.log(`\n── Summary ─────────────────────────────────────`);
  for (const r of results) {
    console.log(`  ${r.status === 'ok' ? '✅' : '❌'} ${r.name}`);
  }
  console.log(`  ${ok}/${results.length} rendered successfully\n`);

  if (!DRY_RUN && ok > 0) {
    await sendTelegramMessage(
      `✅ <b>Scene Benchmark Complete</b>\n` +
      `${ok}/${results.length} scenes rendered\n\n` +
      results.map(r => `${r.status === 'ok' ? '✅' : '❌'} ${r.name}`).join('\n') +
      `\n\nReply with scene names you want to iterate on!`
    );
  }
})();
