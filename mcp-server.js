#!/usr/bin/env node
/**
 * Video Studio MCP Server
 *
 * Custom MCP server wrapping the Remotion video rendering pipeline.
 * Business-specific tools for EverReach ads, social content, and Upwork demos.
 *
 * Tools:
 *   remotion_list_formats     — available formats + schemas
 *   remotion_generate_brief   — build ContentBrief from topic/title inputs
 *   remotion_validate_brief   — validate brief before submitting
 *   remotion_render           — submit async render job
 *   remotion_job_status       — check job status by ID
 *   remotion_list_jobs        — list recent render jobs
 *   remotion_list_outputs     — list rendered MP4 files
 *   remotion_api_server       — start/stop the HTTP API server
 */

'use strict';

const { spawn, execSync, spawnSync } = require('child_process');
const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const REMOTION_DIR = path.resolve(__dirname);
const OUTPUT_DIR = path.join(REMOTION_DIR, 'output');
const BRIEFS_DIR = path.join(REMOTION_DIR, 'data', 'briefs', 'mcp');
const JOBS_FILE = path.join(OUTPUT_DIR, '.mcp-jobs.json');
const STILLS_DIR = path.join(OUTPUT_DIR, 'stills');

// Telegram config from environment (load from actp-worker .env if not set)
function _loadEnv() {
  try {
    const envFile = require('fs').readFileSync(
      path.join(path.dirname(REMOTION_DIR), 'actp-worker', '.env'),
      'utf8'
    );
    for (const line of envFile.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.+)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {}
}
_loadEnv();

// ── Job Registry ─────────────────────────────────────────────────────────────

/** @type {Map<string, object>} */
const jobs = new Map();

function loadJobs() {
  try {
    if (fs.existsSync(JOBS_FILE)) {
      const data = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'));
      for (const job of data) {
        jobs.set(job.id, job);
      }
    }
  } catch {}
}

function saveJobs() {
  try {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const recent = Array.from(jobs.values())
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .slice(0, 50);
    fs.writeFileSync(JOBS_FILE, JSON.stringify(recent, null, 2));
  } catch {}
}

function makeJobId() {
  return `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

loadJobs();

// ── Brief Templates ───────────────────────────────────────────────────────────

const FORMATS = {
  explainer_v1: {
    name: 'Explainer',
    description: 'Educational walkthrough: intro → 3-5 topic slides → outro. Best for "5 hacks", "how AI works", "what is X" content.',
    aspectRatio: '9:16',
    resolution: { width: 1080, height: 1920 },
    sections: ['intro', 'topic', 'outro'],
  },
  listicle_v1: {
    name: 'Listicle',
    description: 'Numbered list format: intro → numbered items → outro. Best for ranked lists, "top 10", "3 reasons" content.',
    aspectRatio: '9:16',
    resolution: { width: 1080, height: 1920 },
    sections: ['intro', 'list_item', 'outro'],
  },
  comparison_v1: {
    name: 'Comparison',
    description: 'Side-by-side comparison: intro → comparison slide → outro. Best for "X vs Y", before/after content.',
    aspectRatio: '9:16',
    resolution: { width: 1080, height: 1920 },
    sections: ['intro', 'comparison', 'outro'],
  },
  shorts_v1: {
    name: 'Shorts',
    description: 'Ultra-short 15s format: hook → key point → CTA. Best for viral hooks, quick tips.',
    aspectRatio: '9:16',
    resolution: { width: 1080, height: 1920 },
    sections: ['hook', 'content', 'cta'],
  },
};

const THEMES = {
  dark: {
    primary_color: '#ffffff',
    secondary_color: '#a1a1aa',
    accent_color: '#3b82f6',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
  },
  light: {
    primary_color: '#0a0a0a',
    secondary_color: '#52525b',
    accent_color: '#2563eb',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
  },
  neon: {
    primary_color: '#ffffff',
    secondary_color: '#d4d4d8',
    accent_color: '#a855f7',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%)',
  },
};

/**
 * Generate a ContentBrief from simple inputs.
 * @param {object} input
 * @returns {object} ContentBrief
 */
function generateBrief(input) {
  const {
    title,
    subtitle,
    hookText,
    format = 'explainer_v1',
    theme = 'dark',
    topics = [],
    listItems = [],
    ctaText = 'Follow for more',
    ctaHandle = '',
    accentColor,
    durationPerTopic = 8,
  } = input;

  if (!title) throw new Error('title is required');
  if (!FORMATS[format]) throw new Error(`Unknown format: ${format}. Valid: ${Object.keys(FORMATS).join(', ')}`);

  const themeConfig = THEMES[theme] || THEMES.dark;
  if (accentColor) themeConfig.accent_color = accentColor;

  const id = `brief_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const sections = [];
  let currentTime = 0;

  if (format === 'explainer_v1') {
    // Intro
    sections.push({
      id: 'intro_001',
      type: 'intro',
      duration_sec: 5,
      start_time_sec: currentTime,
      content: { type: 'intro', title, subtitle, hook_text: hookText },
    });
    currentTime += 5;

    // Topics
    const topicList = topics.length > 0 ? topics : ['Key Point'];
    for (let i = 0; i < topicList.length; i++) {
      const item = typeof topicList[i] === 'string'
        ? { heading: topicList[i], body_text: '' }
        : topicList[i];
      sections.push({
        id: `topic_${String(i + 1).padStart(3, '0')}`,
        type: 'topic',
        duration_sec: durationPerTopic,
        start_time_sec: currentTime,
        content: {
          type: 'topic',
          heading: item.heading || item,
          body_text: item.body_text || '',
          bullet_points: item.bullet_points || [],
          icon: item.icon,
          animation_style: item.animation_style || 'slide',
        },
      });
      currentTime += durationPerTopic;
    }

    // Outro
    sections.push({
      id: 'outro_001',
      type: 'outro',
      duration_sec: 5,
      start_time_sec: currentTime,
      content: {
        type: 'outro',
        title: 'Follow for More',
        call_to_action: ctaText,
        social_handles: ctaHandle ? [{ platform: 'TikTok', handle: ctaHandle }] : [],
      },
    });
    currentTime += 5;

  } else if (format === 'listicle_v1') {
    sections.push({
      id: 'intro_001',
      type: 'intro',
      duration_sec: 5,
      start_time_sec: currentTime,
      content: { type: 'intro', title, subtitle, hook_text: hookText },
    });
    currentTime += 5;

    const items = listItems.length > 0 ? listItems : topics;
    for (let i = 0; i < items.length; i++) {
      const item = typeof items[i] === 'string' ? { title: items[i], description: '' } : items[i];
      sections.push({
        id: `item_${String(i + 1).padStart(3, '0')}`,
        type: 'list_item',
        duration_sec: durationPerTopic,
        start_time_sec: currentTime,
        content: {
          type: 'list_item',
          number: i + 1,
          title: item.title || item,
          description: item.description || '',
        },
      });
      currentTime += durationPerTopic;
    }

    sections.push({
      id: 'outro_001',
      type: 'outro',
      duration_sec: 5,
      start_time_sec: currentTime,
      content: {
        type: 'outro',
        title: 'Found this helpful?',
        call_to_action: ctaText,
        social_handles: ctaHandle ? [{ platform: 'TikTok', handle: ctaHandle }] : [],
      },
    });
    currentTime += 5;

  } else if (format === 'shorts_v1') {
    sections.push({
      id: 'hook_001',
      type: 'hook',
      duration_sec: 3,
      start_time_sec: 0,
      content: { type: 'hook', text: hookText || title, subtext: subtitle },
    });
    sections.push({
      id: 'content_001',
      type: 'content',
      duration_sec: 9,
      start_time_sec: 3,
      content: {
        type: 'topic',
        heading: title,
        body_text: topics[0] || '',
        animation_style: 'fade',
      },
    });
    sections.push({
      id: 'cta_001',
      type: 'cta',
      duration_sec: 3,
      start_time_sec: 12,
      content: { type: 'cta', title: ctaText, action_text: 'Follow', url: ctaHandle },
    });
    currentTime = 15;

  } else if (format === 'comparison_v1') {
    const left = input.leftItem || { label: 'Option A', points: [] };
    const right = input.rightItem || { label: 'Option B', points: [] };
    sections.push({
      id: 'intro_001',
      type: 'intro',
      duration_sec: 5,
      start_time_sec: 0,
      content: { type: 'intro', title, subtitle, hook_text: hookText },
    });
    sections.push({
      id: 'comparison_001',
      type: 'comparison',
      duration_sec: 15,
      start_time_sec: 5,
      content: { type: 'comparison', title, left_item: left, right_item: right },
    });
    sections.push({
      id: 'outro_001',
      type: 'outro',
      duration_sec: 5,
      start_time_sec: 20,
      content: {
        type: 'outro',
        title: 'Which do you prefer?',
        call_to_action: ctaText,
      },
    });
    currentTime = 25;
  }

  return {
    id,
    format,
    version: '1.0',
    created_at: new Date().toISOString(),
    settings: {
      resolution: FORMATS[format].resolution,
      fps: 30,
      duration_sec: currentTime,
      aspect_ratio: '9:16',
    },
    style: {
      theme,
      font_heading: 'Inter',
      font_body: 'Inter',
      ...themeConfig,
    },
    sections,
    audio: {
      volume_music: 0.3,
      volume_voice: 1.0,
    },
  };
}

/**
 * Validate a ContentBrief (basic validation matching schema.json rules).
 * @param {object} brief
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateBrief(brief) {
  const errors = [];
  if (!brief.id) errors.push('Missing required field: id');
  if (!brief.format) errors.push('Missing required field: format');
  else if (!FORMATS[brief.format]) errors.push(`Unknown format: ${brief.format}`);
  if (!brief.settings) errors.push('Missing required field: settings');
  else {
    if (!brief.settings.resolution) errors.push('Missing settings.resolution');
    if (!brief.settings.fps) errors.push('Missing settings.fps');
    if (!brief.settings.duration_sec) errors.push('Missing settings.duration_sec');
    if (!brief.settings.aspect_ratio) errors.push('Missing settings.aspect_ratio');
  }
  if (!brief.style) errors.push('Missing required field: style');
  if (!Array.isArray(brief.sections) || brief.sections.length === 0) errors.push('sections must be a non-empty array');
  return { valid: errors.length === 0, errors };
}

// ── Render ────────────────────────────────────────────────────────────────────

/**
 * Submit a render job. Saves brief JSON to disk then spawns the render CLI.
 * @param {object} brief
 * @param {object} options
 * @returns {string} jobId
 */
function submitRender(brief, options = {}) {
  const { quality = 'production', outputPath } = options;

  // Ensure directories
  fs.mkdirSync(BRIEFS_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const jobId = makeJobId();
  const briefPath = path.join(BRIEFS_DIR, `${jobId}.json`);
  const outPath = outputPath || path.join(OUTPUT_DIR, `${jobId}.mp4`);

  fs.writeFileSync(briefPath, JSON.stringify(brief, null, 2));

  const job = {
    id: jobId,
    briefId: brief.id,
    briefPath,
    outputPath: outPath,
    status: 'queued',
    progress: 0,
    startedAt: new Date().toISOString(),
    completedAt: null,
    error: null,
    quality,
    format: brief.format,
    title: brief.sections[0]?.content?.title || brief.id,
  };

  jobs.set(jobId, job);
  saveJobs();

  // Spawn render process
  const proc = spawn(
    'npx',
    ['tsx', 'scripts/render.ts', briefPath, outPath, '--quality', quality],
    {
      cwd: REMOTION_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
      env: { ...process.env, PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin' },
    }
  );

  job.status = 'rendering';
  job.pid = proc.pid;
  saveJobs();

  let lastStdout = '';
  let lastStderr = '';
  proc.stdout.on('data', (chunk) => {
    lastStdout += chunk.toString();
    // Parse progress from output
    const match = lastStdout.match(/Rendering:\s+(\d+)%/);
    if (match) {
      job.progress = parseInt(match[1], 10);
      saveJobs();
    }
  });

  proc.stderr.on('data', (chunk) => {
    lastStderr += chunk.toString();
  });

  proc.on('close', (code) => {
    job.completedAt = new Date().toISOString();
    if (code === 0 && fs.existsSync(outPath)) {
      job.status = 'complete';
      job.progress = 100;
      const stat = fs.statSync(outPath);
      job.fileSizeBytes = stat.size;
    } else {
      const errDetail = lastStderr.slice(-1000) || lastStdout.slice(-500) || `exit code ${code}`;
      job.status = 'failed';
      job.error = `exit ${code}: ${errDetail}`;
    }
    delete job.pid;
    saveJobs();
  });

  proc.on('error', (err) => {
    job.status = 'failed';
    job.error = err.message;
    job.completedAt = new Date().toISOString();
    saveJobs();
  });

  return jobId;
}

// ── Still Render ─────────────────────────────────────────────────────────────

/**
 * Render a single frame from a ContentBrief as PNG.
 * Returns job object; rendering is async (check job status).
 * @param {object} brief
 * @param {object} opts
 * @returns {string} jobId
 */
function submitStillRender(brief, opts = {}) {
  const { frame = 0, format = 'png', outputPath } = opts;

  fs.mkdirSync(BRIEFS_DIR, { recursive: true });
  fs.mkdirSync(STILLS_DIR, { recursive: true });

  const jobId = makeJobId();
  const briefPath = path.join(BRIEFS_DIR, `${jobId}.json`);
  const ext = format === 'jpeg' ? 'jpg' : format;
  const outPath = outputPath || path.join(STILLS_DIR, `${jobId}.${ext}`);

  fs.writeFileSync(briefPath, JSON.stringify(brief, null, 2));

  const job = {
    id: jobId,
    type: 'still',
    briefId: brief.id,
    briefPath,
    outputPath: outPath,
    status: 'queued',
    progress: 0,
    frame,
    format,
    startedAt: new Date().toISOString(),
    completedAt: null,
    error: null,
    title: brief.sections[0]?.content?.title || brief.id,
  };

  jobs.set(jobId, job);
  saveJobs();

  const proc = spawn(
    'npx',
    ['tsx', 'scripts/render-brief-still.ts', briefPath, outPath, String(frame)],
    { cwd: REMOTION_DIR, stdio: ['ignore', 'pipe', 'pipe'], detached: false }
  );

  job.status = 'rendering';
  job.pid = proc.pid;
  saveJobs();

  let lastOutput = '';
  proc.stdout.on('data', (c) => { lastOutput += c.toString(); });
  proc.stderr.on('data', () => {});

  proc.on('close', (code) => {
    job.completedAt = new Date().toISOString();
    if (code === 0 && fs.existsSync(outPath)) {
      job.status = 'complete';
      job.progress = 100;
      job.fileSizeBytes = fs.statSync(outPath).size;
    } else {
      job.status = 'failed';
      job.error = lastOutput.slice(-500) || `exit code ${code}`;
    }
    delete job.pid;
    saveJobs();
  });

  proc.on('error', (err) => {
    job.status = 'failed';
    job.error = err.message;
    job.completedAt = new Date().toISOString();
    saveJobs();
  });

  return jobId;
}

// ── Voice Clone (Modal) ───────────────────────────────────────────────────────

/**
 * Generate voiceover using Modal voice clone API (not ElevenLabs).
 * @param {object} opts
 * @param {string} opts.text - Script text to synthesize
 * @param {string} [opts.referenceAudio] - Path to reference WAV file
 * @param {string} [opts.speakerName] - Speaker ID for caching
 * @param {string} opts.outputPath - Where to save the .wav
 * @returns {Promise<string>} outputPath on success
 */
async function generateVoiceover(opts) {
  const modalUrl = process.env.MODAL_VOICE_CLONE_URL;
  if (!modalUrl) {
    throw new Error('MODAL_VOICE_CLONE_URL not set. Deploy ai-video-platform/scripts/modal_voice_clone.py first.');
  }

  const refPath = opts.referenceAudio ||
    path.join(REMOTION_DIR, 'public', 'assets', 'voices', 'isaiah.wav');

  if (!fs.existsSync(refPath)) {
    throw new Error(`Reference audio not found: ${refPath}`);
  }

  const audioBuffer = fs.readFileSync(refPath);
  const referenceAudioBase64 = audioBuffer.toString('base64');

  const body = JSON.stringify({
    text: opts.text,
    reference_audio_base64: referenceAudioBase64,
    speaker_name: opts.speakerName || 'isaiah',
    speed: opts.speed || 1.0,
    temperature: opts.temperature || 0.7,
  });

  const parsedUrl = new URL(modalUrl);
  const isHttps = parsedUrl.protocol === 'https:';
  const reqModule = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    const controller = { aborted: false };
    const timeoutId = setTimeout(() => {
      controller.aborted = true;
      reject(new Error('Voice clone request timed out after 120s'));
    }, 120000);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = reqModule.request(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        clearTimeout(timeoutId);
        if (controller.aborted) return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            return reject(new Error(`Voice clone API error: ${parsed.error}`));
          }
          if (!parsed.audio) {
            return reject(new Error(`Voice clone API returned no audio. Response: ${data.slice(0, 200)}`));
          }
          const audioOut = Buffer.from(parsed.audio, 'base64');
          fs.mkdirSync(path.dirname(opts.outputPath), { recursive: true });
          fs.writeFileSync(opts.outputPath, audioOut);
          resolve(opts.outputPath);
        } catch (e) {
          reject(new Error(`Failed to parse voice clone response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      clearTimeout(timeoutId);
      reject(new Error(`Voice clone request failed: ${e.message}`));
    });
    req.write(body);
    req.end();
  });
}

// ── Telegram ──────────────────────────────────────────────────────────────────

/**
 * Send a file or text message to Telegram via Bot API.
 * @param {object} opts
 * @param {string} [opts.imagePath] - Local file path to send as photo
 * @param {string} [opts.videoPath] - Local file path to send as video (MP4)
 * @param {string} [opts.caption] - Caption text
 * @param {string} [opts.text] - Plain text message (if no imagePath/videoPath)
 * @param {string} [opts.chatId] - Override chat ID
 * @returns {Promise<object>}
 */
function sendTelegram(opts) {
  return new Promise((resolve, reject) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = opts.chatId || process.env.TELEGRAM_CHAT_ID;

    if (!token) return reject(new Error('TELEGRAM_BOT_TOKEN not set'));
    if (!chatId) return reject(new Error('TELEGRAM_CHAT_ID not set'));

    if (opts.videoPath) {
      // sendVideo via multipart/form-data
      if (!fs.existsSync(opts.videoPath)) {
        return reject(new Error(`Video not found: ${opts.videoPath}`));
      }

      const fileBuffer = fs.readFileSync(opts.videoPath);
      const filename = path.basename(opts.videoPath);
      const boundary = `----FormBoundary${crypto.randomBytes(8).toString('hex')}`;

      const parts = [];
      parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}\r\n`));
      if (opts.caption) {
        parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${opts.caption}\r\n`));
      }
      parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="video"; filename="${filename}"\r\nContent-Type: video/mp4\r\n\r\n`));
      parts.push(fileBuffer);
      parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

      const body = Buffer.concat(parts);

      const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${token}/sendVideo`,
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (c) => { data += c; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.ok) resolve({ ok: true, message_id: parsed.result?.message_id });
            else reject(new Error(`Telegram API error: ${parsed.description}`));
          } catch {
            reject(new Error(`Invalid Telegram response: ${data.slice(0, 200)}`));
          }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();

    } else if (opts.imagePath) {
      // sendPhoto via multipart/form-data
      if (!fs.existsSync(opts.imagePath)) {
        return reject(new Error(`Image not found: ${opts.imagePath}`));
      }

      const fileBuffer = fs.readFileSync(opts.imagePath);
      const filename = path.basename(opts.imagePath);
      const boundary = `----FormBoundary${crypto.randomBytes(8).toString('hex')}`;

      const parts = [];
      // chat_id field
      parts.push(
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}\r\n`)
      );
      // caption field
      if (opts.caption) {
        parts.push(
          Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${opts.caption}\r\n`)
        );
      }
      // photo file
      parts.push(
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`)
      );
      parts.push(fileBuffer);
      parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

      const body = Buffer.concat(parts);

      const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${token}/sendPhoto`,
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (c) => { data += c; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.ok) resolve({ ok: true, message_id: parsed.result?.message_id });
            else reject(new Error(`Telegram API error: ${parsed.description}`));
          } catch {
            reject(new Error(`Invalid Telegram response: ${data.slice(0, 200)}`));
          }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();

    } else {
      // sendMessage
      const body = JSON.stringify({ chat_id: chatId, text: opts.text || '(no message)' });
      const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${token}/sendMessage`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      };
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (c) => { data += c; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.ok) resolve({ ok: true, message_id: parsed.result?.message_id });
            else reject(new Error(`Telegram API error: ${parsed.description}`));
          } catch {
            reject(new Error(`Invalid Telegram response: ${data.slice(0, 200)}`));
          }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    }
  });
}

// ── Tool Handlers ─────────────────────────────────────────────────────────────

function listFormats() {
  return Object.entries(FORMATS).map(([id, f]) => ({
    id,
    name: f.name,
    description: f.description,
    aspectRatio: f.aspectRatio,
    resolution: f.resolution,
    sectionTypes: f.sections,
  }));
}

function listOutputFiles() {
  if (!fs.existsSync(OUTPUT_DIR)) return [];
  return fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.endsWith('.mp4'))
    .map(f => {
      const fp = path.join(OUTPUT_DIR, f);
      const stat = fs.statSync(fp);
      return {
        filename: f,
        path: fp,
        sizeBytes: stat.size,
        sizeMB: Math.round(stat.size / 1024 / 1024 * 10) / 10,
        modifiedAt: stat.mtime.toISOString(),
      };
    })
    .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
}

function listRecentJobs(limit = 20) {
  return Array.from(jobs.values())
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
    .slice(0, limit)
    .map(j => ({
      id: j.id,
      status: j.status,
      progress: j.progress,
      format: j.format,
      title: j.title,
      outputPath: j.outputPath,
      fileSizeBytes: j.fileSizeBytes,
      startedAt: j.startedAt,
      completedAt: j.completedAt,
      error: j.error,
    }));
}

// ── MCP Protocol ──────────────────────────────────────────────────────────────

const TOOL_DEFS = [
  {
    name: 'remotion_list_formats',
    description: 'List all available Remotion video formats with descriptions, section types, and resolution. Use this to pick the right format before generating a brief.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'remotion_generate_brief',
    description: 'Generate a ContentBrief JSON from simple inputs (title, topics, format). Returns a ready-to-use brief that can be passed to remotion_render.',
    inputSchema: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string', description: 'Video title / main hook' },
        subtitle: { type: 'string', description: 'Optional subtitle text' },
        hookText: { type: 'string', description: 'Hook text shown in intro (problem statement)' },
        format: {
          type: 'string',
          enum: ['explainer_v1', 'listicle_v1', 'comparison_v1', 'shorts_v1'],
          description: 'Video format. Default: explainer_v1',
        },
        theme: {
          type: 'string',
          enum: ['dark', 'light', 'neon'],
          description: 'Visual theme. Default: dark',
        },
        topics: {
          type: 'array',
          description: 'Topic slides for explainer format. Each item: string or {heading, body_text, bullet_points, icon}',
          items: {},
        },
        listItems: {
          type: 'array',
          description: 'Numbered items for listicle format. Each item: string or {title, description}',
          items: {},
        },
        ctaText: { type: 'string', description: 'Call-to-action text in outro. Default: "Follow for more"' },
        ctaHandle: { type: 'string', description: 'Social handle shown in outro (e.g. @isaiahdupree)' },
        accentColor: { type: 'string', description: 'Hex accent color override (e.g. #ff6b00)' },
        durationPerTopic: { type: 'number', description: 'Seconds per topic/list item. Default: 8' },
        leftItem: {
          type: 'object',
          description: 'Left side for comparison format: {label, points: []}',
        },
        rightItem: {
          type: 'object',
          description: 'Right side for comparison format: {label, points: []}',
        },
      },
    },
  },
  {
    name: 'remotion_validate_brief',
    description: 'Validate a ContentBrief JSON before rendering. Returns {valid, errors}.',
    inputSchema: {
      type: 'object',
      required: ['brief'],
      properties: {
        brief: { type: 'object', description: 'ContentBrief JSON to validate' },
      },
    },
  },
  {
    name: 'remotion_render',
    description: 'Submit a video render job. Accepts a ContentBrief JSON. Returns job_id for status polling. Render runs in background (typically 2-5 min).',
    inputSchema: {
      type: 'object',
      required: ['brief'],
      properties: {
        brief: { type: 'object', description: 'ContentBrief JSON (use remotion_generate_brief to create one)' },
        quality: {
          type: 'string',
          enum: ['preview', 'production'],
          description: 'Render quality. preview is faster (lower CRF). Default: production',
        },
        outputPath: { type: 'string', description: 'Optional absolute output path (default: output/<job_id>.mp4)' },
      },
    },
  },
  {
    name: 'remotion_job_status',
    description: 'Check the status of a Remotion render job by job_id.',
    inputSchema: {
      type: 'object',
      required: ['jobId'],
      properties: {
        jobId: { type: 'string', description: 'Job ID returned by remotion_render' },
      },
    },
  },
  {
    name: 'remotion_list_jobs',
    description: 'List recent render jobs with their status, progress, output paths, and file sizes.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max jobs to return (default: 20)' },
      },
    },
  },
  {
    name: 'remotion_list_outputs',
    description: 'List rendered MP4 files in the output directory.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'remotion_render_still',
    description: 'Render a single still frame (PNG/JPEG) from a ContentBrief. Much faster than full video render. Use for ad images, preview frames, or Telegram previews. Returns job_id — poll with remotion_job_status.',
    inputSchema: {
      type: 'object',
      required: ['brief'],
      properties: {
        brief: { type: 'object', description: 'ContentBrief JSON (use remotion_generate_brief to create one)' },
        frame: { type: 'number', description: 'Frame number to render (default: 0 = first frame)' },
        format: {
          type: 'string',
          enum: ['png', 'jpeg'],
          description: 'Image format. Default: png',
        },
        outputPath: { type: 'string', description: 'Optional absolute output path (default: output/stills/<job_id>.png)' },
      },
    },
  },
  {
    name: 'remotion_render_thumbnail_cloud',
    description: 'Render a YouTube thumbnail (1280×720 PNG) on Modal cloud using YouTubeThumbnailBrief. Uploads to Supabase Storage and returns a public URL. No local Chrome needed. Faster than local render. Use this instead of remotion_render_still for YouTube thumbnails.',
    inputSchema: {
      type: 'object',
      required: ['brief'],
      properties: {
        brief: {
          type: 'object',
          description: 'YouTubeThumbnailBrief: {title, subtitle?, highlight?, highlight_label?, podcast_name?, episode_label?, speaker_name?, speaker_title?, cta_handle?, accent?, style?}',
        },
        output_filename: { type: 'string', description: 'Optional output filename (auto-generated if omitted)' },
      },
    },
  },
  {
    name: 'remotion_render_modal',
    description: 'Render a Remotion composition on Modal (cloud GPU/CPU) and upload result to Supabase Storage. Returns a public URL immediately after upload. Faster than local render for long videos, no local Chrome required. Uses modal_remotion_render.py endpoint.',
    inputSchema: {
      type: 'object',
      required: ['composition'],
      properties: {
        composition: { type: 'string', description: 'Remotion composition ID (e.g. "UGCComposition", "EverReachReel")' },
        input_props: { type: 'object', description: 'Props to pass to the composition (same as inputProps in local render)' },
        quality: { type: 'string', enum: ['preview', 'production'], description: 'Render quality (default: production)' },
        output_filename: { type: 'string', description: 'Output MP4 filename (auto-generated if omitted)' },
      },
    },
  },
  {
    name: 'remotion_generate_voiceover',
    description: 'Generate a voiceover audio file using the Modal voice clone API (not ElevenLabs). Clones Isaiah\'s voice by default. Requires MODAL_VOICE_CLONE_URL env var. Returns the path to the generated WAV file.',
    inputSchema: {
      type: 'object',
      required: ['text'],
      properties: {
        text: { type: 'string', description: 'Script text to synthesize into speech' },
        referenceAudio: { type: 'string', description: 'Absolute path to reference WAV file (default: public/assets/voices/isaiah.wav)' },
        speakerName: { type: 'string', description: 'Speaker ID for caching (default: isaiah)' },
        outputPath: { type: 'string', description: 'Where to save the .wav (default: output/voiceovers/<timestamp>.wav)' },
        speed: { type: 'number', description: 'Speech speed multiplier 0.5-2.0 (default: 1.0)' },
        temperature: { type: 'number', description: 'Sampling temperature 0.1-1.0 (default: 0.7)' },
      },
    },
  },
  {
    name: 'remotion_send_telegram',
    description: 'Send a video, image, or text message to Telegram for review. Supports MP4 videos from render jobs. Requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID env vars (auto-loaded from actp-worker .env).',
    inputSchema: {
      type: 'object',
      properties: {
        videoPath: { type: 'string', description: 'Absolute path to MP4 video file to send as video' },
        imagePath: { type: 'string', description: 'Absolute path to image file (PNG/JPEG) to send as photo' },
        jobId: { type: 'string', description: 'Job ID from remotion_render or remotion_render_still — auto-detects MP4 vs image' },
        caption: { type: 'string', description: 'Caption text to show under the media' },
        text: { type: 'string', description: 'Plain text message (used when no media path/jobId provided)' },
        chatId: { type: 'string', description: 'Override chat ID (default: TELEGRAM_CHAT_ID env var)' },
      },
    },
  },
];

async function handleTool(name, args) {
  switch (name) {
    case 'remotion_list_formats':
      return { content: [{ type: 'text', text: JSON.stringify(listFormats(), null, 2) }] };

    case 'remotion_generate_brief': {
      try {
        const brief = generateBrief(args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: true, brief }, null, 2),
          }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: err.message }) }],
          isError: true,
        };
      }
    }

    case 'remotion_validate_brief': {
      const result = validateBrief(args.brief || {});
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }

    case 'remotion_render_modal': {
      const { composition, input_props = {}, quality = 'production', output_filename } = args;
      if (!composition) {
        return { content: [{ type: 'text', text: JSON.stringify({ error: 'composition is required' }) }], isError: true };
      }

      // Get Modal endpoint URL from env or derive from known pattern
      const modalUrl = process.env.MODAL_REMOTION_RENDER_URL ||
        'https://isaiahdupree33--remotion-render-endpoint.modal.run';

      let response, result;
      try {
        response = await fetch(modalUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ composition, input_props, quality, output_filename }),
          signal: AbortSignal.timeout(3600_000), // 1 hour
        });
        result = await response.json();
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `Modal request failed: ${err.message}` }) }],
          isError: true,
        };
      }

      if (!response.ok || result.error) {
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: true,
        };
      }

      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }

    case 'remotion_render_thumbnail_cloud': {
      const { brief, output_filename } = args;
      if (!brief) {
        return { content: [{ type: 'text', text: JSON.stringify({ error: 'brief is required' }) }], isError: true };
      }

      const thumbnailUrl = process.env.MODAL_REMOTION_THUMBNAIL_URL ||
        'https://isaiahdupree33--remotion-thumbnail.modal.run';

      let response, result;
      try {
        response = await fetch(thumbnailUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brief, output_filename }),
          signal: AbortSignal.timeout(300_000),
        });
        result = await response.json();
      } catch (err) {
        return { content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }], isError: true };
      }

      if (!response.ok || result.error) {
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], isError: true };
      }

      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }

    case 'remotion_render': {
      const { brief, quality, outputPath } = args;
      if (!brief) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: 'brief is required' }) }],
          isError: true,
        };
      }
      const validation = validateBrief(brief);
      if (!validation.valid) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ error: 'Invalid brief', errors: validation.errors }),
          }],
          isError: true,
        };
      }
      try {
        const jobId = submitRender(brief, { quality, outputPath });
        const job = jobs.get(jobId);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              jobId,
              status: job.status,
              outputPath: job.outputPath,
              message: 'Render started. Use remotion_job_status to check progress.',
            }, null, 2),
          }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }],
          isError: true,
        };
      }
    }

    case 'remotion_job_status': {
      const job = jobs.get(args.jobId);
      if (!job) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `Job not found: ${args.jobId}` }) }],
          isError: true,
        };
      }
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            id: job.id,
            status: job.status,
            progress: job.progress,
            format: job.format,
            title: job.title,
            outputPath: job.outputPath,
            fileSizeBytes: job.fileSizeBytes,
            fileSizeMB: job.fileSizeBytes ? Math.round(job.fileSizeBytes / 1024 / 1024 * 10) / 10 : null,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
            error: job.error,
          }, null, 2),
        }],
      };
    }

    case 'remotion_list_jobs': {
      const jobList = listRecentJobs(args.limit || 20);
      return { content: [{ type: 'text', text: JSON.stringify(jobList, null, 2) }] };
    }

    case 'remotion_list_outputs': {
      const files = listOutputFiles();
      return { content: [{ type: 'text', text: JSON.stringify(files, null, 2) }] };
    }

    case 'remotion_render_still': {
      const { brief, frame, format, outputPath } = args;
      if (!brief) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: 'brief is required' }) }],
          isError: true,
        };
      }
      const validation = validateBrief(brief);
      if (!validation.valid) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: 'Invalid brief', errors: validation.errors }) }],
          isError: true,
        };
      }
      try {
        const jobId = submitStillRender(brief, { frame, format, outputPath });
        const job = jobs.get(jobId);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              jobId,
              status: job.status,
              outputPath: job.outputPath,
              message: 'Still render started. Use remotion_job_status to check progress, then remotion_send_telegram to preview.',
            }, null, 2),
          }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }],
          isError: true,
        };
      }
    }

    case 'remotion_generate_voiceover': {
      const { text: voText, referenceAudio, speakerName, outputPath: voOutPath, speed, temperature } = args;
      if (!voText) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: 'text is required' }) }],
          isError: true,
        };
      }
      const defaultOut = path.join(OUTPUT_DIR, 'voiceovers', `vo_${Date.now()}.wav`);
      try {
        const savedPath = await generateVoiceover({
          text: voText,
          referenceAudio,
          speakerName,
          outputPath: voOutPath || defaultOut,
          speed,
          temperature,
        });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              outputPath: savedPath,
              message: 'Voiceover generated via Modal voice clone API. Add the path to your brief audio.voiceover_path field.',
            }, null, 2),
          }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }],
          isError: true,
        };
      }
    }

    case 'remotion_send_telegram': {
      const { videoPath, imagePath, jobId: sendJobId, caption, text, chatId } = args;

      // Resolve media path from job if jobId provided
      let resolvedVideoPath = videoPath;
      let resolvedImagePath = imagePath;
      if (!resolvedVideoPath && !resolvedImagePath && sendJobId) {
        const job = jobs.get(sendJobId);
        if (!job) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: `Job not found: ${sendJobId}` }) }],
            isError: true,
          };
        }
        if (job.status !== 'complete') {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: `Job not ready: status=${job.status}`, progress: job.progress }) }],
            isError: true,
          };
        }
        // Auto-detect: MP4 → video, everything else → image
        if (job.outputPath && job.outputPath.endsWith('.mp4')) {
          resolvedVideoPath = job.outputPath;
        } else {
          resolvedImagePath = job.outputPath;
        }
      }

      try {
        const result = await sendTelegram({ videoPath: resolvedVideoPath, imagePath: resolvedImagePath, caption, text, chatId });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message_id: result.message_id,
              sent: resolvedVideoPath || resolvedImagePath || '(text message)',
              type: resolvedVideoPath ? 'video' : resolvedImagePath ? 'photo' : 'text',
            }, null, 2),
          }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }],
          isError: true,
        };
      }
    }

    default:
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: `Unknown tool: ${name}` }) }],
        isError: true,
      };
  }
}

// ── Stdio Transport ───────────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, terminal: false });

rl.on('line', (line) => {
  line = line.trim();
  if (!line) return;

  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }

  const { id, method, params } = msg;

  function reply(result) {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
  }

  function replyError(code, message, data) {
    process.stdout.write(JSON.stringify({
      jsonrpc: '2.0',
      id,
      error: { code, message, ...(data ? { data } : {}) },
    }) + '\n');
  }

  switch (method) {
    case 'initialize':
      reply({
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'video-studio-mcp', version: '1.0.0' },
      });
      break;

    case 'tools/list':
      reply({ tools: TOOL_DEFS });
      break;

    case 'tools/call': {
      const { name, arguments: args } = params;
      handleTool(name, args || {})
        .then((result) => reply(result))
        .catch((err) => replyError(-32603, 'Internal error', err.message));
      break;
    }

    case 'notifications/initialized':
    case 'ping':
      if (id !== undefined) reply({});
      break;

    default:
      if (id !== undefined) {
        replyError(-32601, `Method not found: ${method}`);
      }
  }
});

rl.on('close', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
