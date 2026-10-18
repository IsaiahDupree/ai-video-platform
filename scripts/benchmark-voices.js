#!/usr/bin/env node
/**
 * Voice Model Benchmark — parallel test + Telegram review
 *
 * Tests 4 voice models with the same text and reference audio,
 * sends each result to Telegram for A/B feedback.
 *
 * Usage:
 *   node scripts/benchmark-voices.js
 *   node scripts/benchmark-voices.js --text "Your custom script text"
 *   node scripts/benchmark-voices.js --ref path/to/voice.wav
 *   node scripts/benchmark-voices.js --dry-run   (skip sending, just save files)
 */
'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ── Config ───────────────────────────────────────────────────────────────────

function loadEnv(envPath) {
  try {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^([\w]+)=(.+)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {}
}

const REMOTION_DIR = path.resolve(__dirname, '..');
loadEnv(path.join(REMOTION_DIR, '..', 'actp-worker', '.env'));

const ARGS = process.argv.slice(2);
const getArg = (flag, def) => {
  const i = ARGS.indexOf(flag);
  return i !== -1 ? ARGS[i + 1] : def;
};
const DRY_RUN = ARGS.includes('--dry-run');

const BENCHMARK_TEXT = getArg('--text',
  'AI automation is transforming how founders scale their businesses. ' +
  'I built a system that generates leads, follows up, and closes deals on autopilot. ' +
  'This is a voice quality benchmark test.'
);

const REF_AUDIO_PATH = getArg('--ref',
  path.join(REMOTION_DIR, 'public', 'assets', 'voices', 'tiktok_voice_short.wav')
);

const OUTPUT_DIR = path.join(REMOTION_DIR, 'output', 'benchmark');

// ── Models config ─────────────────────────────────────────────────────────────

const BENCHMARK_ENDPOINT = process.env.MODAL_VOICE_BENCHMARK_URL || '';
const F5_URL = process.env.MODAL_VOICE_CLONE_URL || '';

// Build model list dynamically based on what URLs are configured
function getModels(refAudioB64) {
  const models = [];

  // 1. F5-TTS (voice clone)
  if (F5_URL) {
    models.push({
      id: 1,
      name: 'F5-TTS',
      emoji: '🎯',
      description: 'Zero-shot voice clone (F5-TTS)',
      url: F5_URL,
      body: {
        text: BENCHMARK_TEXT,
        reference_audio_base64: refAudioB64,
        speaker_name: 'isaiah',
        speed: 1.0,
      },
    });
  }

  // 2. XTTS v2 (voice clone)
  const xttsUrl = BENCHMARK_ENDPOINT
    ? BENCHMARK_ENDPOINT.replace(/\/[^/]+$/, '') + '/xtts_endpoint'
    : process.env.MODAL_XTTS_URL || '';
  if (xttsUrl) {
    models.push({
      id: 2,
      name: 'XTTS v2',
      emoji: '🗣️',
      description: 'Zero-shot voice clone (Coqui XTTS v2)',
      url: xttsUrl,
      body: {
        text: BENCHMARK_TEXT,
        reference_audio_base64: refAudioB64,
        language: 'en',
      },
    });
  }

  // 3. Kokoro (fast TTS, male voice — no clone)
  const kokoroUrl = process.env.MODAL_KOKORO_URL || '';
  if (kokoroUrl) {
    models.push({
      id: 3,
      name: 'Kokoro (am_adam)',
      emoji: '⚡',
      description: 'Ultra-fast TTS — am_adam voice (no clone, quality baseline)',
      url: kokoroUrl,
      body: {
        text: BENCHMARK_TEXT,
        voice: 'am_adam',
      },
    });
  }

  // 4. Parler TTS (instruction-based)
  const parlerUrl = process.env.MODAL_PARLER_URL || '';
  if (parlerUrl) {
    models.push({
      id: 4,
      name: 'Parler TTS Mini',
      emoji: '📖',
      description: 'Instruction-based TTS (no clone, prompt-controlled style)',
      url: parlerUrl,
      body: {
        text: BENCHMARK_TEXT,
        description: 'A male voice with a clear, confident tone, speaking at a moderate pace with slight enthusiasm. The recording is clean with no background noise.',
      },
    });
  }

  return models;
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function postJSON(url, body, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const reqMod = isHttps ? https : http;
    const bodyStr = JSON.stringify(body);

    const controller = { aborted: false };
    const timer = setTimeout(() => {
      controller.aborted = true;
      reject(new Error(`Timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    const opts = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    };

    const req = reqMod.request(opts, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        clearTimeout(timer);
        if (controller.aborted) return;
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data, raw: true });
        }
      });
    });

    req.on('error', e => { clearTimeout(timer); reject(e); });
    req.write(bodyStr);
    req.end();
  });
}

function sendTelegramAudio(audioPath, caption) {
  return new Promise((resolve, reject) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return reject(new Error('Telegram env vars not set'));

    const fileBuffer = fs.readFileSync(audioPath);
    const filename = path.basename(audioPath);
    const boundary = '----VoiceBench' + crypto.randomBytes(6).toString('hex');

    const parts = [
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="audio"; filename="${filename}"\r\nContent-Type: audio/wav\r\n\r\n`),
      fileBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ];
    const body = Buffer.concat(parts);

    const req = https.request({
      hostname: 'api.telegram.org', port: 443,
      path: `/bot${token}/sendAudio`, method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const p = JSON.parse(d);
          if (p.ok) resolve(p.result);
          else reject(new Error(`Telegram: ${p.description}`));
        } catch { reject(new Error(d.slice(0, 200))); }
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
    if (!token || !chatId) return reject(new Error('Telegram env vars not set'));
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' });
    const req = https.request({
      hostname: 'api.telegram.org', port: 443,
      path: `/bot${token}/sendMessage`, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function runBenchmark() {
  console.log('\n🎤 Voice Model Benchmark');
  console.log('========================');
  console.log('Text:', BENCHMARK_TEXT.slice(0, 80) + '...');
  console.log('Reference audio:', REF_AUDIO_PATH);
  if (DRY_RUN) console.log('⚠️  DRY RUN — will save files but not send to Telegram');

  // Load reference audio
  if (!fs.existsSync(REF_AUDIO_PATH)) {
    throw new Error(`Reference audio not found: ${REF_AUDIO_PATH}`);
  }
  const refAudioB64 = fs.readFileSync(REF_AUDIO_PATH).toString('base64');
  console.log(`Reference audio loaded: ${(refAudioB64.length / 1024).toFixed(0)}KB (base64)`);

  // Build model list
  const models = getModels(refAudioB64);
  if (models.length === 0) {
    console.error('\n❌ No model URLs configured. Set env vars:');
    console.error('  MODAL_VOICE_CLONE_URL   — F5-TTS (already set)');
    console.error('  MODAL_XTTS_URL          — XTTS v2');
    console.error('  MODAL_KOKORO_URL        — Kokoro');
    console.error('  MODAL_PARLER_URL        — Parler TTS');
    process.exit(1);
  }

  console.log(`\nRunning ${models.length} models in parallel...`);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Kick off all requests in parallel
  const startTime = Date.now();
  const promises = models.map(async (model) => {
    const t0 = Date.now();
    console.log(`  → ${model.name} (${model.url.split('/').pop()})`);
    try {
      const timeout = model.name.includes("XTTS") ? 600000 : 120000;
      const { status, data } = await postJSON(model.url, model.body, timeout);
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

      if (status !== 200 || !data.audio) {
        const err = data.error || data.detail || JSON.stringify(data).slice(0, 200);
        return { ...model, success: false, error: err, elapsed };
      }

      // Save audio file
      const audioBuffer = Buffer.from(data.audio, 'base64');
      const outPath = path.join(OUTPUT_DIR, `benchmark_${model.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.wav`);
      fs.writeFileSync(outPath, audioBuffer);

      console.log(`  ✓ ${model.name} — ${elapsed}s, ${(audioBuffer.length / 1024).toFixed(0)}KB → ${path.basename(outPath)}`);
      return { ...model, success: true, audioPath: outPath, elapsed, sizeKB: (audioBuffer.length / 1024).toFixed(0) };
    } catch (err) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.error(`  ✗ ${model.name} — ${err.message} (${elapsed}s)`);
      return { ...model, success: false, error: err.message, elapsed };
    }
  });

  const results = await Promise.all(promises);
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\nAll done in ${totalTime}s`);

  const passed = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  if (failed.length > 0) {
    console.log('\n⚠️  Failed models:');
    failed.forEach(r => console.log(`  ✗ ${r.name}: ${r.error}`));
  }

  if (passed.length === 0) {
    console.error('\n❌ All models failed — nothing to send');
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log('\n✓ Dry run complete. Files saved to:', OUTPUT_DIR);
    passed.forEach(r => console.log(`  ${r.emoji} [${r.id}] ${r.name} → ${r.audioPath}`));
    return;
  }

  // Send to Telegram
  console.log('\n📤 Sending to Telegram...');

  // Intro message
  const introLines = [
    '🎤 *Voice Model Benchmark*',
    `Testing ${passed.length} models with the same ${(refAudioB64.length / 1024 / 1024 * 0.75).toFixed(1)}MB reference audio`,
    '',
    ...passed.map(r => `${r.emoji} *${r.id}. ${r.name}* — ${r.elapsed}s, ${r.sizeKB}KB`),
    ...(failed.length > 0 ? ['', `⚠️ ${failed.length} model(s) failed: ${failed.map(r => r.name).join(', ')}`] : []),
    '',
    '👂 Listen to each clip and reply with the number of your favorite voice\\!',
  ];
  await sendTelegramMessage(introLines.join('\n'));
  console.log('  ✓ Intro message sent');

  // Send each audio with a 1s gap to keep ordering
  for (const result of passed) {
    const caption = [
      `${result.emoji} *${result.id}. ${result.name}*`,
      result.description,
      `⏱ ${result.elapsed}s | ${result.sizeKB}KB`,
    ].join('\n');

    try {
      await sendTelegramAudio(result.audioPath, caption);
      console.log(`  ✓ Sent: ${result.name}`);
      // Small delay to preserve order in chat
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`  ✗ Failed to send ${result.name}: ${err.message}`);
    }
  }

  // Vote prompt
  const voteLines = [
    '🗳 *Cast your vote:*',
    ...passed.map(r => `${r.emoji} Reply *${r.id}* for ${r.name}`),
    '',
    'Or reply with the number to use as the default voice in all videos\\.',
  ];
  await sendTelegramMessage(voteLines.join('\n'));
  console.log('  ✓ Vote prompt sent');

  console.log('\n✅ Benchmark complete! Check Telegram to review and vote.');
  console.log('Files saved to:', OUTPUT_DIR);
}

runBenchmark().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
