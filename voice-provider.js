'use strict';

/**
 * Voice Provider — single source of truth for the MCP server's voiceover engine.
 *
 * Policy (2026-08, from a live capacity audit): ElevenLabs is at its monthly
 * character cap and is the #1 bottleneck. It must NEVER be the silent default.
 *
 * Routing (VOICE_PROVIDER env, default 'orion'):
 *   orion       → FREE Orion Voice Service — VoxCPM2 on the Orion GPU, 48kHz Isaiah voice. DEFAULT.
 *   huggingface → FREE HuggingFace Inference TTS (facebook/mms-tts-eng).
 *   modal       → Modal-hosted voice-clone/XTTS/Kokoro (free/cheap).
 *   heygen      → HeyGen talking-avatar video (POST /v2/video/generate). Avatar beats.
 *   elevenlabs  → STRICTLY OPT-IN. Only when VOICE_PROVIDER=elevenlabs.
 *   openai      → opt-in only (key is a blocked placeholder here).
 *
 * Ecosystem standard: Orion is the default free voice for ALL voiceover; reach for
 * ElevenLabs only when a specific metered cloud feature requires it.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const DEFAULT_VOICE_PROVIDER = 'orion';
const DEFAULT_HF_TTS_MODEL = 'facebook/mms-tts-eng';
const NARRATION_PROVIDERS = new Set(['orion', 'huggingface', 'modal', 'openai', 'elevenlabs']);
const AVATAR_PROVIDERS = new Set(['heygen']);

// Isaiah digital-twin HeyGen defaults (match src/foundry/generate/HeyGenGenerator.ts).
const ISAIAH_AVATAR_ID = 'd9af08b6f80349aaa56096443f91d19e';
const ISAIAH_VOICE_ID = 'e40f41c567924222a60ed3e1d557fc77';

function getVoiceProvider(fallback = DEFAULT_VOICE_PROVIDER) {
  return String(process.env.VOICE_PROVIDER || fallback).trim().toLowerCase();
}

function elevenLabsOptedIn() {
  return getVoiceProvider() === 'elevenlabs';
}

/**
 * Resolve the provider, guaranteeing ElevenLabs is never a silent default.
 * - null/undefined request → VOICE_PROVIDER (default huggingface)
 * - 'elevenlabs' requested but not opted in → downgrade to huggingface
 * - unknown → huggingface
 */
function resolveVoiceProvider(requested) {
  let prov = String(requested || getVoiceProvider()).trim().toLowerCase();
  if (prov === 'elevenlabs' && !elevenLabsOptedIn()) return DEFAULT_VOICE_PROVIDER;
  if (!NARRATION_PROVIDERS.has(prov) && !AVATAR_PROVIDERS.has(prov)) return DEFAULT_VOICE_PROVIDER;
  return prov;
}

function isAvatarProvider(provider) {
  return AVATAR_PROVIDERS.has(String(provider || getVoiceProvider()).trim().toLowerCase());
}

function modalTtsUrl() {
  return (
    process.env.MODAL_XTTS_URL ||
    process.env.MODAL_KOKORO_URL ||
    process.env.MODAL_VOICE_CLONE_URL ||
    null
  );
}

// ── Minimal HTTP helpers (no external deps) ──────────────────────────────────

function requestRaw(urlStr, { method = 'GET', headers = {}, body = null, timeoutMs = 120000 } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const mod = u.protocol === 'https:' ? https : http;
    const opts = {
      method,
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      headers: { ...headers },
    };
    if (body) opts.headers['Content-Length'] = Buffer.byteLength(body);
    const req = mod.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, buffer: Buffer.concat(chunks) }));
    });
    const t = setTimeout(() => { req.destroy(new Error(`request timed out after ${timeoutMs}ms`)); }, timeoutMs);
    req.on('error', reject);
    req.on('close', () => clearTimeout(t));
    if (body) req.write(body);
    req.end();
  });
}

async function requestJson(urlStr, opts = {}) {
  const res = await requestRaw(urlStr, opts);
  let json = null;
  try { json = JSON.parse(res.buffer.toString('utf8')); } catch { /* non-JSON */ }
  return { status: res.status, headers: res.headers, json, text: res.buffer.toString('utf8') };
}

// ── FREE narration: HuggingFace Inference TTS ────────────────────────────────

/**
 * Synthesize narration audio with the free HuggingFace Inference API.
 * Writes raw audio bytes (flac/wav depending on model) to outputPath.
 */
async function synthesizeHuggingFace({ text, outputPath, model = DEFAULT_HF_TTS_MODEL, token } = {}) {
  const hfToken = token || process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN || process.env.HF_API_TOKEN;
  if (!text) throw new Error('text is required');
  if (!hfToken) throw new Error('HF_TOKEN not set — required for free HuggingFace TTS');

  const url = `https://api-inference.huggingface.co/models/${model}`;
  const res = await requestRaw(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${hfToken}`, 'Content-Type': 'application/json', Accept: 'audio/flac' },
    body: JSON.stringify({ inputs: text }),
  });
  if (res.status !== 200) {
    throw new Error(`HuggingFace TTS failed (${res.status}): ${res.buffer.toString('utf8').slice(0, 200)}`);
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, res.buffer);
  return outputPath;
}

// ── Modal-hosted narration (voice-clone / XTTS / Kokoro) ─────────────────────

async function synthesizeModal({ text, outputPath, referenceAudioBase64, speakerName, speed, temperature } = {}) {
  const url = modalTtsUrl();
  if (!url) throw new Error('No Modal TTS URL set (MODAL_XTTS_URL / MODAL_KOKORO_URL / MODAL_VOICE_CLONE_URL)');
  const payload = { text, speed: speed || 1.0, temperature: temperature || 0.7 };
  if (referenceAudioBase64) payload.reference_audio_base64 = referenceAudioBase64;
  if (speakerName) payload.speaker_name = speakerName;

  const res = await requestRaw(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.status !== 200) throw new Error(`Modal TTS failed (${res.status}): ${res.buffer.toString('utf8').slice(0, 200)}`);

  const ctype = String(res.headers['content-type'] || '');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  if (ctype.includes('application/json')) {
    const data = JSON.parse(res.buffer.toString('utf8'));
    if (data.error) throw new Error(`Modal TTS error: ${data.error}`);
    const b64 = data.audio || data.audio_base64;
    if (!b64) throw new Error('Modal TTS returned no audio field');
    fs.writeFileSync(outputPath, Buffer.from(b64, 'base64'));
  } else {
    fs.writeFileSync(outputPath, res.buffer);
  }
  return outputPath;
}

// ── FREE DEFAULT: Orion Voice Service (VoxCPM2 on the Orion GPU, 48kHz, $0) ───

function orionBaseUrl() {
  return process.env.INTEL_NODE_BASE_URL || 'http://localhost:5580';
}

/** Orion readiness (credit-free, fast). */
async function orionHealth() {
  const r = await requestJson(`${orionBaseUrl()}/api/voice/health`, { timeoutMs: 15000 });
  return { ok: r.status === 200 && r.json && r.json.status === 'ok', endpoint: '/api/voice/health', raw: r.json, status: r.status };
}

/**
 * FREE default narration — Orion Voice Service via the hub's canonical REST API.
 * Generates 48kHz Isaiah-voice audio on the Orion GPU (VoxCPM2), $0, no ElevenLabs.
 * Returns the path to the generated wav (copied to outputPath when one is given).
 */
async function synthesizeOrion({ text, outputPath, outName } = {}) {
  if (!text) throw new Error('text is required');
  const name = outName || (outputPath ? path.basename(outputPath).replace(/\.[^.]+$/, '') : `vo_orion_${process.pid}`);
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.INTEL_NODE_TOKEN) headers.Authorization = `Bearer ${process.env.INTEL_NODE_TOKEN}`;
  const r = await requestJson(`${orionBaseUrl()}/api/voice/generate`, {
    method: 'POST', headers, body: JSON.stringify({ text, out_name: name }), timeoutMs: 240000,
  });
  if (r.status !== 200 || !r.json || !r.json.ok) {
    throw new Error(`Orion voice failed (${r.status}): ${(r.text || '').slice(0, 200)}`);
  }
  const outPath = r.json.path;
  if (outputPath && outPath && outputPath !== outPath) {
    try {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.copyFileSync(outPath, outputPath);
      return outputPath;
    } catch { /* fall back to the service path */ }
  }
  return outPath;
}

// ── HeyGen avatar (voice baked into video) ───────────────────────────────────

function heygenApiKey() {
  return process.env.HEYGEN_API_KEY || '';
}

/** Pure builder for the /v2/video/generate payload. No network, no credits. */
function buildHeyGenGeneratePayload({ script, avatarId, voiceId, test = true, width = 720, height = 1280, background } = {}) {
  const character = { type: 'avatar', avatar_id: avatarId || ISAIAH_AVATAR_ID, avatar_style: 'normal' };
  return {
    test: test !== false, // default TRUE → watermarked preview, never burns credits by accident
    caption: false,
    dimension: { width, height },
    video_inputs: [
      {
        character,
        voice: { type: 'text', input_text: script, voice_id: voiceId || ISAIAH_VOICE_ID },
        background: background || { type: 'color', value: '#1a1a2e' },
      },
    ],
  };
}

/**
 * Read-only quota check — validates HeyGen auth WITHOUT spending credits.
 * Prefers GET /v3/users/me; falls back to legacy GET /v2/user/remaining_quota.
 */
async function heygenRemainingQuota({ apiKey } = {}) {
  const key = apiKey || heygenApiKey();
  if (!key) throw new Error('HEYGEN_API_KEY not set');
  const headers = { 'X-API-KEY': key, Accept: 'application/json' };

  let r = await requestJson('https://api.heygen.com/v3/users/me', { headers, timeoutMs: 30000 });
  if (r.status === 200 && r.json) {
    const d = r.json.data || r.json;
    return { ok: true, endpoint: '/v3/users/me', raw: d };
  }
  // Legacy fallback (sunsets 2026-10-31).
  r = await requestJson('https://api.heygen.com/v2/user/remaining_quota', { headers, timeoutMs: 30000 });
  if (r.status === 200 && r.json) {
    const d = r.json.data || r.json;
    return { ok: true, endpoint: '/v2/user/remaining_quota', raw: d };
  }
  throw new Error(`HeyGen quota check failed: ${r.status} ${r.text.slice(0, 200)}`);
}

/**
 * Generate a talking-avatar video via HeyGen. Real network call; defaults to
 * test=true so it never silently spends credits. Polls status → returns video_url.
 */
async function generateHeyGenAvatar({ script, apiKey, avatarId, voiceId, test = true, width = 720, height = 1280, pollMs = 5000, maxPolls = 60 } = {}) {
  const key = apiKey || heygenApiKey();
  if (!key) throw new Error('HEYGEN_API_KEY not set');
  if (!script) throw new Error('script is required for HeyGen avatar generation');

  const payload = buildHeyGenGeneratePayload({ script, avatarId, voiceId, test, width, height });
  const gen = await requestJson('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    timeoutMs: 60000,
  });
  if (gen.status !== 200 || !gen.json || gen.json.error) {
    throw new Error(`HeyGen generate failed: ${gen.status} ${gen.text.slice(0, 200)}`);
  }
  const videoId = (gen.json.data || {}).video_id;
  if (!videoId) throw new Error('HeyGen generate returned no video_id');

  for (let i = 0; i < maxPolls; i++) {
    await new Promise((r) => setTimeout(r, pollMs));
    const st = await requestJson(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      headers: { 'X-API-KEY': key }, timeoutMs: 30000,
    });
    const d = (st.json && (st.json.data || st.json)) || {};
    if (d.status === 'completed') return { videoId, videoUrl: d.video_url, durationSec: d.duration, test: payload.test };
    if (d.status === 'failed') throw new Error(`HeyGen video failed: ${JSON.stringify(d.error)}`);
  }
  throw new Error('HeyGen video timed out');
}

module.exports = {
  DEFAULT_VOICE_PROVIDER,
  DEFAULT_HF_TTS_MODEL,
  NARRATION_PROVIDERS,
  AVATAR_PROVIDERS,
  ISAIAH_AVATAR_ID,
  ISAIAH_VOICE_ID,
  getVoiceProvider,
  elevenLabsOptedIn,
  resolveVoiceProvider,
  isAvatarProvider,
  modalTtsUrl,
  orionBaseUrl,
  orionHealth,
  synthesizeOrion,
  synthesizeHuggingFace,
  synthesizeModal,
  buildHeyGenGeneratePayload,
  heygenRemainingQuota,
  generateHeyGenAvatar,
};
