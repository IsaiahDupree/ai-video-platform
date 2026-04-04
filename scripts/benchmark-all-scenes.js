#!/usr/bin/env node
/**
 * Full Scene Visual Benchmark — render one still per registered scene,
 * send each to Telegram for review.
 *
 * Usage:
 *   node scripts/benchmark-all-scenes.js
 *   node scripts/benchmark-all-scenes.js --dry-run
 *   node scripts/benchmark-all-scenes.js --only hook,stat,cta
 */
'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const REMOTION_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(REMOTION_DIR, 'output', 'all-scenes');
const BRIEFS_DIR = path.join(OUTPUT_DIR, 'briefs');

function loadEnv(p) {
  try {
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([\w]+)=(.+)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {}
}
loadEnv(path.join(REMOTION_DIR, '..', 'actp-worker', '.env'));

const ARGS = process.argv.slice(2);
const getArg = (f, d) => { const i = ARGS.indexOf(f); return i !== -1 ? ARGS[i + 1] : d; };
const DRY_RUN = ARGS.includes('--dry-run');
const ONLY = getArg('--only', null);

// ── Style presets ─────────────────────────────────────────────────────────────

const S = {
  dark: {
    theme: 'dark', primary_color: '#ffffff', secondary_color: '#a1a1aa',
    accent_color: '#3b82f6', font_heading: 'Montserrat', font_body: 'Inter',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
  },
  neon: {
    theme: 'neon', primary_color: '#ffffff', secondary_color: '#d4d4d8',
    accent_color: '#a855f7', font_heading: 'Montserrat', font_body: 'Inter',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%)',
  },
  tiktok: {
    theme: 'dark', primary_color: '#ffffff', secondary_color: '#aaaaaa',
    accent_color: '#fe2c55', font_heading: 'Montserrat', font_body: 'Inter',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 100%)',
  },
  linkedin: {
    theme: 'light', primary_color: '#1a1a2e', secondary_color: '#4a5568',
    accent_color: '#0077b5', font_heading: 'Inter', font_body: 'Inter',
    background_type: 'solid', background_value: '#f8f9fa',
  },
  twitter: {
    theme: 'dark', primary_color: '#ffffff', secondary_color: '#71767b',
    accent_color: '#1d9bf0', font_heading: 'Inter', font_body: 'Inter',
    background_type: 'solid', background_value: '#000000',
  },
  threads: {
    theme: 'dark', primary_color: '#f5f5f5', secondary_color: '#a8a8a8',
    accent_color: '#ffffff', font_heading: 'Inter', font_body: 'Inter',
    background_type: 'solid', background_value: '#101010',
  },
  youtube: {
    theme: 'dark', primary_color: '#ffffff', secondary_color: '#a1a1aa',
    accent_color: '#ff0000', font_heading: 'Montserrat', font_body: 'Inter',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #0d0d0d 0%, #111827 100%)',
  },
};

function brief(id, style, type, content, dur = 8, res = { width: 1080, height: 1920 }, fps = 30) {
  return {
    id,
    format: 'explainer_v1',
    version: '1.0',
    created_at: new Date().toISOString().split('T')[0],
    settings: {
      resolution: res,
      fps,
      duration_sec: dur,
      aspect_ratio: res.width === res.height ? '1:1'
        : res.width > res.height ? '16:9' : '9:16',
    },
    style,
    sections: [{ id: 's1', type, duration_sec: dur, start_time_sec: 0, content }],
  };
}

const V = { width: 1080, height: 1920 };   // 9:16 vertical
const SQ = { width: 1080, height: 1080 };  // 1:1 square
const WD = { width: 1280, height: 720 };   // 16:9 wide

// mid(dur, fps) → render frame at 55% of section
const mid = (dur, fps = 30) => Math.floor(dur * fps * 0.55);

// ── All scenes ────────────────────────────────────────────────────────────────

const ALL_SCENES = [
  // ── Original scenes ──────────────────────────────────────────────────────
  {
    name: 'intro',
    group: 'Core',
    emoji: '🎬',
    caption: '🎬 IntroScene — title + subtitle + hook_text entrance',
    res: V, style: S.dark, dur: 6,
    content: {
      type: 'intro',
      title: 'AI Automation in 2026',
      subtitle: 'What every founder needs to know',
      hook_text: 'Watch till the end →',
    },
  },
  {
    name: 'topic',
    group: 'Core',
    emoji: '📝',
    caption: '📝 TopicScene — heading + body + bullet points',
    res: V, style: S.dark, dur: 8,
    content: {
      type: 'topic',
      heading: 'The 3 Systems That Scale',
      body_text: 'Every 7-figure agency runs on these three automation pillars.',
      bullet_points: ['Lead gen on autopilot', 'AI follow-up sequences', 'Revenue dashboards'],
    },
  },
  {
    name: 'list_item',
    group: 'Core',
    emoji: '🔢',
    caption: '🔢 ListItemScene — numbered list card',
    res: V, style: S.dark, dur: 6,
    content: {
      type: 'list_item',
      number: 2,
      title: 'Automate your follow-ups',
      description: 'AI reads replies and sends the perfect response within 90 seconds.',
    },
  },
  {
    name: 'outro',
    group: 'Core',
    emoji: '🏁',
    caption: '🏁 OutroScene — CTA + social handles',
    res: V, style: S.neon, dur: 6,
    content: {
      type: 'outro',
      title: 'Ready to automate?',
      call_to_action: 'Book a free AI audit',
      social_handles: [
        { platform: 'Twitter', handle: '@isaiah_builds' },
        { platform: 'LinkedIn', handle: 'isaiah-dupree' },
      ],
    },
  },
  {
    name: 'transition',
    group: 'Core',
    emoji: '⚡',
    caption: '⚡ TransitionScene — wipe transition between sections',
    res: V, style: S.dark, dur: 2,
    content: { type: 'transition', style: 'wipe' },
  },

  // ── Platform scenes ───────────────────────────────────────────────────────
  {
    name: 'hook',
    group: 'Platform',
    emoji: '🎣',
    caption: '🎣 HookScene — stamp-in + glitch + accent underline\nScroll-stopper frame 0-3s',
    res: V, style: S.tiktok, dur: 5,
    content: {
      type: 'hook',
      text: 'I replaced my $4K/mo VA with an AI agent.',
      subtext: 'Built it in 48 hours.',
      style: 'claim',
      emoji: '🤫',
    },
  },
  {
    name: 'cta',
    group: 'Platform',
    emoji: '📣',
    caption: '📣 CTAScene — platform-aware button + pulseGlow\n7-platform CTA config',
    res: V, style: S.tiktok, dur: 5,
    content: {
      type: 'cta',
      title: 'Want the full system?',
      action_text: 'Follow for more',
      platform: 'tiktok',
      handle: '@isaiah_builds',
    },
  },
  {
    name: 'stat',
    group: 'Platform',
    emoji: '📈',
    caption: '📈 StatScene — countUp animation + bounceEasing + pulseGlow',
    res: V, style: S.tiktok, dur: 6,
    content: {
      type: 'stat',
      value: 340,
      suffix: '%',
      label: 'increase in booked calls',
      context: 'after adding AI outreach',
      animate_from: 0,
    },
  },
  {
    name: 'testimonial',
    group: 'Platform',
    emoji: '💬',
    caption: '💬 TestimonialScene — typewriter quote + star rating + platform badge',
    res: V, style: S.dark, dur: 8,
    content: {
      type: 'testimonial',
      quote: 'Isaiah\'s AI system booked 8 calls in the first week. I\'ve never seen anything like it.',
      author_name: 'Marcus T.',
      author_title: 'Founder, SaaS Growth Co.',
      platform: 'linkedin',
      rating: 5,
    },
  },
  {
    name: 'compare',
    group: 'Platform',
    emoji: '⚖️',
    caption: '⚖️ CompareScene — left/right split with stagger reveal + indicators',
    res: V, style: S.dark, dur: 8,
    content: {
      type: 'compare',
      left_label: 'Manual Outreach',
      right_label: 'AI Outreach',
      left_points: ['2h/day prospecting', '10 DMs/day max', 'Forget to follow up', 'Inconsistent tone'],
      right_points: ['Zero hours from you', '200+ DMs/day', 'Auto follow-ups', 'Always on-brand'],
    },
  },
  {
    name: 'kinetic_caption',
    group: 'Platform',
    emoji: '🎤',
    caption: '🎤 KineticCaptionScene — word-by-word highlight + glow\nTikTok-style captions',
    res: V, style: S.tiktok, dur: 8,
    content: {
      type: 'kinetic_caption',
      text: 'Stop grinding for clients. Let AI find them for you. Every. Single. Day.',
      caption_style: 'tiktok',
      highlight_color: '#fe2c55',
    },
  },
  {
    name: 'quote_card',
    group: 'Platform',
    emoji: '🐦',
    caption: '🐦 QuoteCardScene — Twitter/LinkedIn card + typewriter + engagement metrics',
    res: WD, style: S.twitter, dur: 8,
    content: {
      type: 'quote_card',
      quote: 'The best time to automate your outreach was 2 years ago. The second best time is today.',
      author_name: 'Isaiah Dupree',
      author_handle: '@isaiah_builds',
      likes: '2.4K',
      retweets: '891',
      platform: 'twitter',
    },
  },

  // ── YouTube-specific ──────────────────────────────────────────────────────
  {
    name: 'chapter_card',
    group: 'YouTube',
    emoji: '📖',
    caption: '📖 ChapterCardScene — chapter number + title slide-in + ghost watermark',
    res: WD, style: S.youtube, dur: 5,
    content: {
      type: 'chapter_card',
      number: 2,
      title: 'Building the Lead Engine',
      subtitle: 'The 3 automation layers explained',
      total_chapters: 4,
    },
  },
  {
    name: 'lower_third',
    group: 'YouTube',
    emoji: '🎙️',
    caption: '🎙️ LowerThirdScene — slides in from left, accent bar + blur backdrop',
    res: WD, style: S.youtube, dur: 5,
    content: {
      type: 'lower_third',
      name: 'Isaiah Dupree',
      title: 'AI Automation Consultant',
      accent: '#ff0000',
    },
  },
  {
    name: 'end_screen',
    group: 'YouTube',
    emoji: '🔔',
    caption: '🔔 EndScreenScene — subscribe button + next video card + bell',
    res: WD, style: S.youtube, dur: 6,
    content: {
      type: 'end_screen',
      subscribe_text: 'Subscribe for weekly AI tutorials',
      next_video_title: 'How I Automated My Entire Agency',
      channel_name: 'Isaiah Builds',
    },
  },
  {
    name: 'code',
    group: 'YouTube',
    emoji: '💻',
    caption: '💻 CodeScene — terminal chrome + line-by-line reveal + syntax highlight',
    res: WD, style: S.dark, dur: 10,
    content: {
      type: 'code',
      language: 'typescript',
      title: 'AI Lead Scoring Agent',
      code: `import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

async function scoreLead(profile: LeadProfile) {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: \`Score this lead 1-10: \${JSON.stringify(profile)}\`,
    }],
  });
  return parseInt(msg.content[0].text);
}`,
      reveal_mode: 'line_by_line',
      highlight_lines: [5, 6, 7],
    },
  },
  {
    name: 'phone_frame',
    group: 'YouTube',
    emoji: '📱',
    caption: '📱 PhoneFrameScene — iPhone frame + dynamic island + notification slide-in',
    res: V, style: S.dark, dur: 6,
    content: {
      type: 'phone_frame',
      content_type: 'app_ui',
      app_name: 'CRMLite',
      notification_text: '🤖 New lead scored 9/10 — Isaiah Dupree',
      device: 'iphone',
    },
  },

  // ── Research-backed ───────────────────────────────────────────────────────
  {
    name: 'countdown',
    group: 'Research',
    emoji: '⏳',
    caption: '⏳ CountdownScene — 3-2-1 stamp-in + expanding ring\n65%+ TikTok 3s retention hook',
    res: V, style: S.tiktok, dur: 5,
    content: { type: 'countdown', from: 3, pre_text: 'WAIT...' },
  },
  {
    name: 'problem_solution',
    group: 'Research',
    emoji: '🔄',
    caption: '🔄 ProblemSolutionScene — sequential with color flash\n#1 UGC converting pattern (3-5x lift)',
    res: V, style: S.tiktok, dur: 14,
    content: {
      type: 'problem_solution',
      problem: 'Spending 3 hours/day on outreach that never converts',
      solution: 'One AI workflow generates 200+ qualified DMs on autopilot',
      layout: 'sequential',
      problem_hold_percent: 0.5,
    },
  },
  {
    name: 'myth_reality',
    group: 'Research',
    emoji: '🤯',
    caption: '🤯 MythRealityScene — glitch + growing strikethrough → reality stamp\nPattern interrupt + authority signal',
    res: V, style: S.tiktok, dur: 18,
    content: {
      type: 'myth_reality',
      myth: 'You need 10K followers to get clients from social media',
      reality: '7 of my first 10 clients came from accounts under 500 followers',
      myth_hold_percent: 0.45,
    },
  },
  {
    name: 'checklist',
    group: 'Research',
    emoji: '✅',
    caption: '✅ ChecklistScene — stagger reveal with ✓/✗ bounce-in\nLinkedIn framework — 5-7x saves',
    res: SQ, style: S.linkedin, dur: 20,
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
  {
    name: 'bar_chart',
    group: 'Research',
    emoji: '📊',
    caption: '📊 BarChartScene — bars grow from 0 + shine + value labels\nLinkedIn data authority',
    res: SQ, style: S.linkedin, dur: 12,
    content: {
      type: 'bar_chart',
      title: 'Monthly revenue after AI automation',
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
  {
    name: 'thread_reveal',
    group: 'Research',
    emoji: '🧵',
    caption: '🧵 ThreadRevealScene — sequential post stack with thread connector\nReplies 75x weighted on Twitter algo',
    res: WD, style: S.twitter, dur: 30,
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
  {
    name: 'ugc_style',
    group: 'Research',
    emoji: '📱',
    caption: '📱 UGCStyleScene — vignette + hand-held wobble + raw overlay\n3-5x conversion over polished ads',
    res: V, style: S.tiktok, dur: 6,
    content: {
      type: 'ugc_style',
      caption: 'This AI system replaced my $4K/mo VA',
      subtext: 'Built it in a weekend. Works 24/7.',
      platform: 'tiktok',
      overlay_style: 'raw',
      emoji: '🤫',
    },
  },
  {
    name: 'curiosity_gap',
    group: 'Research',
    emoji: '❓',
    caption: '❓ CuriosityGapScene — tension dots → ? overlay → color flash → reveal\n4-7x watch time vs direct-value opens',
    res: V, style: S.dark, dur: 18,
    content: {
      type: 'curiosity_gap',
      setup: 'Nobody talks about the real reason most AI businesses fail.',
      reveal: "It's not the tech. It's the offer.",
      reveal_label: 'THE REAL REASON',
      hold_percent: 0.5,
    },
  },
  {
    name: 'social_proof',
    group: 'Research',
    emoji: '🏆',
    caption: '🏆 SocialProofScene — countUp metric + logo grid + mini testimonials\n74% of decisions driven by social proof',
    res: V, style: S.dark, dur: 15,
    content: {
      type: 'social_proof',
      headline: 'Founders who automated their outreach',
      metric: { value: '2,400+', label: 'booked calls generated' },
      logos: [
        { name: 'SaaS Co', color: '#3b82f6' },
        { name: 'AgencyX', color: '#8b5cf6' },
        { name: 'StartupY', color: '#10b981' },
        { name: 'ScaleUp', color: '#f59e0b' },
      ],
      style: 'combined',
    },
  },
];

// ── Telegram helpers ──────────────────────────────────────────────────────────

function sendPhoto(imagePath, caption) {
  return new Promise((resolve, reject) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) { console.log(`  [SKIP] No Telegram creds`); return resolve(); }
    const imageData = fs.readFileSync(imagePath);
    const boundary = `----Boundary${crypto.randomBytes(8).toString('hex')}`;
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
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length },
    }, (res) => {
      let d = '';
      res.on('data', x => d += x);
      res.on('end', () => {
        const j = JSON.parse(d);
        j.ok ? resolve(j) : reject(new Error(j.description));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function sendMsg(text) {
  return new Promise((resolve, reject) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) { console.log(`[SKIP] ${text.slice(0, 50)}`); return resolve(); }
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let d = '';
      res.on('data', x => d += x);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function renderStill(briefPath, outputPath, frame) {
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

  let scenes = ONLY
    ? ALL_SCENES.filter(s => ONLY.split(',').includes(s.name))
    : ALL_SCENES;

  if (!scenes.length) {
    console.error(`No scenes match: ${ONLY}`);
    process.exit(1);
  }

  const groups = [...new Set(scenes.map(s => s.group))];
  console.log(`\n🎬 Full Scene Benchmark — ${scenes.length} scenes across ${groups.length} groups\n`);
  for (const g of groups) {
    const names = scenes.filter(s => s.group === g).map(s => `${s.emoji} ${s.name}`).join('  ');
    console.log(`  ${g}: ${names}`);
  }
  console.log('');

  if (!DRY_RUN) {
    const groupLines = groups.map(g => {
      const sc = scenes.filter(s => s.group === g);
      return `<b>${g}</b>: ${sc.map(s => s.emoji).join(' ')}`;
    }).join('\n');
    await sendMsg(`🎬 <b>Full Scene Benchmark</b> — ${scenes.length} scenes\n\n${groupLines}`);
  }

  const results = [];
  let currentGroup = null;

  for (const scene of scenes) {
    // Send group divider to Telegram
    if (!DRY_RUN && scene.group !== currentGroup) {
      currentGroup = scene.group;
      await sendMsg(`\n── <b>${currentGroup} Scenes</b> ──`);
    }

    const key = scene.name;
    console.log(`[${scene.emoji}] ${key}`);
    const briefPath = path.join(BRIEFS_DIR, `${key}.json`);
    const imgPath = path.join(OUTPUT_DIR, `${key}.png`);
    const frame = mid(scene.dur, scene.res.fps || 30);

    const b = {
      id: `bench_${key}`,
      format: 'explainer_v1',
      version: '1.0',
      created_at: new Date().toISOString().split('T')[0],
      settings: {
        resolution: scene.res,
        fps: 30,
        duration_sec: scene.dur,
        aspect_ratio: scene.res.width === scene.res.height ? '1:1'
          : scene.res.width > scene.res.height ? '16:9' : '9:16',
      },
      style: scene.style,
      sections: [{ id: 's1', type: scene.name, duration_sec: scene.dur, start_time_sec: 0, content: scene.content }],
    };

    fs.writeFileSync(briefPath, JSON.stringify(b, null, 2));

    try {
      renderStill(briefPath, imgPath, frame);
      const size = Math.round(fs.statSync(imgPath).size / 1024);
      console.log(`  ✓ ${size}KB  (frame ${frame})`);
      if (!DRY_RUN) {
        await sendPhoto(imgPath, scene.caption);
        console.log(`  📱 sent`);
      }
      results.push({ name: key, group: scene.group, status: 'ok' });
    } catch (err) {
      const msg = err.message?.split('\n')[0] || err.message;
      console.error(`  ✗ ${msg}`);
      results.push({ name: key, group: scene.group, status: 'failed', error: msg });
    }
  }

  // Summary
  const ok = results.filter(r => r.status === 'ok').length;
  const failed = results.filter(r => r.status === 'failed');
  console.log(`\n── Summary (${ok}/${results.length}) ────────────────────────`);
  for (const g of groups) {
    const gr = results.filter(r => r.group === g);
    const gOk = gr.filter(r => r.status === 'ok').length;
    console.log(`  ${g}: ${gOk}/${gr.length}`);
  }
  if (failed.length) {
    console.log('\n  Failed:');
    for (const f of failed) console.log(`    ❌ ${f.name}: ${f.error}`);
  }

  if (!DRY_RUN) {
    const summaryLines = groups.map(g => {
      const gr = results.filter(r => r.group === g);
      const gOk = gr.filter(r => r.status === 'ok').length;
      return `${g}: ${gOk}/${gr.length} ✅`;
    }).join('\n');
    await sendMsg(
      `✅ <b>All Scenes Rendered</b> — ${ok}/${results.length}\n\n${summaryLines}` +
      (failed.length ? `\n\n❌ Failed: ${failed.map(f => f.name).join(', ')}` : '') +
      `\n\nReply with scene names to iterate on!`
    );
  }
})();
