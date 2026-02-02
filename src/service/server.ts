/**
 * Remotion Media Service - Main Server
 *
 * Complete REST API microservice exposing all Remotion capabilities:
 * - Video rendering (brief, batch, static ads)
 * - Text-to-speech (ElevenLabs, OpenAI, IndexTTS2)
 * - AI video generation (Sora, LTX, Mochi, Wan2.2)
 * - Image generation (DALL-E, characters, stickers)
 * - Audio processing (music search, mixing, SFX)
 * - Avatar generation (InfiniteTalk, custom training)
 * - Content analysis (virality, transcription)
 */

import { APIGateway } from '../api/gateway';
import { JobQueue } from '../api/job-queue';
import { BatchAPIHandler } from '../api/batch-api';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  port: parseInt(process.env.REMOTION_SERVICE_PORT || '3100'),
  apiKey: process.env.REMOTION_SERVICE_API_KEY || 'dev-api-key',
  rateLimit: {
    requestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60'),
    requestsPerHour: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_HOUR || '1000'),
    burstSize: 10,
  },
  queue: {
    maxConcurrent: parseInt(process.env.JOB_QUEUE_MAX_CONCURRENT || '10'),
    defaultMaxRetries: 3,
    jobTimeout: 1800000, // 30 minutes
  },
  cors: {
    enabled: process.env.CORS_ENABLED !== 'false',
    origins: process.env.CORS_ORIGINS?.split(',') || ['*'],
  },
};

// =============================================================================
// Service Initialization
// =============================================================================

const queue = new JobQueue(CONFIG.queue);
const batchHandler = new BatchAPIHandler(queue);
const gateway = new APIGateway({
  port: CONFIG.port,
  apiKey: CONFIG.apiKey,
  rateLimit: CONFIG.rateLimit,
  enableCors: CONFIG.cors.enabled,
  corsOrigins: CONFIG.cors.origins,
});

// =============================================================================
// Job Handlers
// =============================================================================

/**
 * Extract template from reference image
 */
queue.registerHandler('extract-template', async (input) => {
  const { imageId, model = 'gpt-4-vision' } = input;

  const { getUploadedImage } = await import('../ad-templates/ingestion/image-uploader');
  const { extractTemplateFromImage, validateExtractedTemplate } = await import('../ad-templates/extraction/ai-extractor');

  // Get uploaded image
  const image = await getUploadedImage(imageId);
  if (!image) {
    throw new Error(`Image not found: ${imageId}`);
  }

  // Read image as base64
  const buffer = fs.readFileSync(image.filePath);
  const base64 = buffer.toString('base64');

  // Extract template
  const extractionResult = await extractTemplateFromImage({
    imageBase64: base64,
    model,
    options: {
      detectText: true,
      detectImages: true,
      detectShapes: true,
      semanticLabeling: true,
      inferConstraints: true,
    },
  });

  if (!extractionResult.success) {
    throw new Error(`Template extraction failed: ${extractionResult.error}`);
  }

  // Validate template
  const validation = validateExtractedTemplate(extractionResult.template!);

  // Save template
  const templateDir = process.env.TEMPLATE_DIR || 'data/templates';
  if (!fs.existsSync(templateDir)) {
    fs.mkdirSync(templateDir, { recursive: true });
  }

  const templatePath = path.join(templateDir, `${imageId}.template.json`);
  fs.writeFileSync(templatePath, JSON.stringify(extractionResult.template, null, 2));

  return {
    templateId: extractionResult.template!.templateId,
    templatePath,
    confidence: extractionResult.confidence,
    layers: extractionResult.template!.layers.length,
    validation: {
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
    },
  };
});

/**
 * Render video from brief
 */
queue.registerHandler('render-brief', async (input) => {
  const { brief, quality = 'production', outputFormat = 'mp4' } = input;

  const outputPath = path.join(
    process.env.OUTPUT_DIR || './output',
    `${brief.id}.${outputFormat}`
  );

  const propsJson = JSON.stringify({ brief });
  const crf = quality === 'preview' ? 28 : 18;

  execSync(
    `npx remotion render BriefComposition "${outputPath}" --props='${propsJson}' --crf=${crf}`,
    { cwd: path.resolve(__dirname, '../..'), stdio: 'pipe' }
  );

  const stats = fs.statSync(outputPath);

  return {
    videoPath: outputPath,
    duration: brief.settings?.duration_sec,
    fileSize: stats.size,
    format: outputFormat,
  };
});

/**
 * Render static ad
 */
queue.registerHandler('render-static-ad', async (input) => {
  const { template, bindings, size, format = 'png' } = input;

  const outputPath = path.join(
    process.env.OUTPUT_DIR || './output',
    `ad-${Date.now()}.${format}`
  );

  const propsJson = JSON.stringify({ template, bindings, size });

  execSync(
    `npx remotion still AdTemplateStill "${outputPath}" --props='${propsJson}'`,
    { cwd: path.resolve(__dirname, '../..'), stdio: 'pipe' }
  );

  const stats = fs.statSync(outputPath);

  return {
    imagePath: outputPath,
    fileSize: stats.size,
    format,
    size,
  };
});

/**
 * Generate TTS audio
 */
queue.registerHandler('tts-generate', async (input) => {
  const { text, provider = 'openai', voice, options } = input;

  const outputPath = path.join(
    process.env.OUTPUT_DIR || './output',
    `tts-${Date.now()}.mp3`
  );

  const args = [
    'npx', 'tsx', 'scripts/generate-audio.ts',
    '--tts', text,
    '--output', outputPath,
  ];

  if (voice) {
    args.push('--voice', voice);
  }

  if (provider === 'elevenlabs') {
    args.push('--provider', 'elevenlabs');
  }

  execSync(args.join(' '), {
    cwd: path.resolve(__dirname, '../..'),
    stdio: 'pipe',
  });

  const stats = fs.statSync(outputPath);

  return {
    audioPath: outputPath,
    fileSize: stats.size,
    provider,
    characterCount: text.length,
  };
});

/**
 * Clone voice and generate speech
 */
queue.registerHandler('tts-voice-clone', async (input) => {
  const { text, voiceReferenceUrl, emotion = 'neutral' } = input;

  const outputPath = path.join(
    process.env.OUTPUT_DIR || './output',
    `cloned-${Date.now()}.mp3`
  );

  // Download reference audio if URL
  let refPath = voiceReferenceUrl;
  if (voiceReferenceUrl.startsWith('http')) {
    refPath = path.join(os.tmpdir(), `ref-${Date.now()}.wav`);
    execSync(`curl -o "${refPath}" "${voiceReferenceUrl}"`, { stdio: 'pipe' });
  }

  execSync(
    `npx tsx scripts/generate-audio.ts --tts "${text}" --voice "${refPath}" --emotion ${emotion} --output "${outputPath}"`,
    { cwd: path.resolve(__dirname, '../..'), stdio: 'pipe' }
  );

  const stats = fs.statSync(outputPath);

  return {
    audioPath: outputPath,
    fileSize: stats.size,
    emotion,
  };
});

/**
 * Generate AI video with Sora/LTX/Mochi
 */
queue.registerHandler('video-generate', async (input) => {
  const { prompt, model = 'ltx', duration = 5, size = '1280x720' } = input;

  const outputPath = path.join(
    process.env.OUTPUT_DIR || './output',
    `video-${Date.now()}.mp4`
  );

  let scriptName = 'generate-video-modal.ts';
  if (model === 'mochi') scriptName = 'generate-video-mochi.ts';
  if (model === 'wan2.2') scriptName = 'generate-video-wan2-2.ts';

  execSync(
    `npx tsx scripts/${scriptName} --prompt "${prompt}" --duration ${duration} --size ${size} --output "${outputPath}"`,
    { cwd: path.resolve(__dirname, '../..'), stdio: 'pipe' }
  );

  const stats = fs.statSync(outputPath);

  return {
    videoPath: outputPath,
    fileSize: stats.size,
    model,
    duration,
  };
});

/**
 * Image-to-video animation
 */
queue.registerHandler('image-to-video', async (input) => {
  const { imageUrl, motionPrompt, duration = 5 } = input;

  const outputPath = path.join(
    process.env.OUTPUT_DIR || './output',
    `i2v-${Date.now()}.mp4`
  );

  execSync(
    `npx tsx scripts/generate-video-from-image.ts --image "${imageUrl}" --motion "${motionPrompt}" --duration ${duration} --output "${outputPath}"`,
    { cwd: path.resolve(__dirname, '../..'), stdio: 'pipe' }
  );

  const stats = fs.statSync(outputPath);

  return {
    videoPath: outputPath,
    fileSize: stats.size,
    duration,
  };
});

/**
 * Generate AI character
 */
queue.registerHandler('character-generate', async (input) => {
  const { name, description, style = 'cartoon', expressions = ['neutral', 'happy'] } = input;

  const outputDir = path.join(
    process.env.OUTPUT_DIR || './output',
    'characters',
    name.toLowerCase().replace(/\s+/g, '-')
  );

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  execSync(
    `npx tsx scripts/generate-character.ts --name "${name}" --description "${description}" --style ${style} --expressions "${expressions.join(',')}" --output "${outputDir}"`,
    { cwd: path.resolve(__dirname, '../..'), stdio: 'pipe' }
  );

  const images = fs.readdirSync(outputDir).map(file => path.join(outputDir, file));

  return {
    characterId: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    images,
    style,
  };
});

/**
 * Generate talking head with InfiniteTalk
 */
queue.registerHandler('avatar-infinitetalk', async (input) => {
  const { audioUrl, faceImageUrl, fps = 25 } = input;

  const outputPath = path.join(
    process.env.OUTPUT_DIR || './output',
    `avatar-${Date.now()}.mp4`
  );

  execSync(
    `npx tsx scripts/generate-talking-head.ts --audio "${audioUrl}" --image "${faceImageUrl}" --fps ${fps} --output "${outputPath}"`,
    { cwd: path.resolve(__dirname, '../..'), stdio: 'pipe' }
  );

  const stats = fs.statSync(outputPath);

  return {
    videoPath: outputPath,
    fileSize: stats.size,
    fps,
  };
});

/**
 * Search for music from stock libraries
 */
queue.registerHandler('audio-search-music', async (input) => {
  const { query, provider = 'freesound', limit = 10 } = input;

  const outputPath = path.join(
    process.env.OUTPUT_DIR || './output',
    'media_search_results.json'
  );

  const args = [
    'npx tsx scripts/fetch-media.ts',
    '--type', 'audio',
    '--query', `"${query}"`,
    '--provider', provider,
    '--limit', String(limit),
    '--output', `"${outputPath}"`,
  ];

  execSync(args.join(' '), {
    cwd: path.resolve(__dirname, '../..'),
    stdio: 'pipe',
  });

  const results = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));

  return {
    results: results.assets || [],
    total: results.total || 0,
    provider,
    query,
  };
});

/**
 * Mix audio files (voiceover + music + SFX)
 */
queue.registerHandler('audio-mix', async (input) => {
  const { manifestPath, eventsPath, sfxRoot, outputPath } = input;

  const finalOutputPath = outputPath || path.join(
    process.env.OUTPUT_DIR || './output',
    `audio_mix_${Date.now()}.wav`
  );

  const args = [
    'npx tsx scripts/build-audio-mix.ts',
    '--manifest', `"${manifestPath}"`,
    '--events', `"${eventsPath}"`,
    '--sfxRoot', `"${sfxRoot}"`,
    '--out', `"${finalOutputPath}"`,
  ];

  execSync(args.join(' '), {
    cwd: path.resolve(__dirname, '../..'),
    stdio: 'pipe',
  });

  const stats = fs.statSync(finalOutputPath);

  return {
    audioPath: finalOutputPath,
    fileSize: stats.size,
    format: 'wav',
    sampleRate: 48000,
    channels: 2,
  };
});

/**
 * Search or generate sound effects
 */
queue.registerHandler('audio-sfx', async (input) => {
  const { prompt, provider = 'freesound', generate = false, duration = 3 } = input;

  const outputPath = path.join(
    process.env.OUTPUT_DIR || './output',
    `sfx_${Date.now()}.mp3`
  );

  if (generate && provider === 'elevenlabs') {
    // Generate SFX with ElevenLabs
    execSync(
      `npx tsx scripts/generate-audio.ts --sfx "${prompt}" --duration ${duration} --provider elevenlabs --output "${outputPath}"`,
      { cwd: path.resolve(__dirname, '../..'), stdio: 'pipe' }
    );
  } else {
    // Search existing SFX
    const searchResultPath = path.join(
      process.env.OUTPUT_DIR || './output',
      `sfx_search_${Date.now()}.json`
    );

    execSync(
      `npx tsx scripts/fetch-media.ts --type audio --query "${prompt}" --provider ${provider} --limit 5 --output "${searchResultPath}"`,
      { cwd: path.resolve(__dirname, '../..'), stdio: 'pipe' }
    );

    const results = JSON.parse(fs.readFileSync(searchResultPath, 'utf-8'));

    return {
      results: results.assets || [],
      total: results.total || 0,
      provider,
      query: prompt,
    };
  }

  const stats = fs.statSync(outputPath);

  return {
    audioPath: outputPath,
    fileSize: stats.size,
    provider,
    generated: generate,
  };
});

// =============================================================================
// API Endpoints
// =============================================================================

/**
 * Health check
 */
gateway.registerRoute('GET', '/health', (req, res) => {
  res.status = 200;
  res.body = {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
});

/**
 * Service readiness
 */
gateway.registerRoute('GET', '/health/ready', (req, res) => {
  const stats = queue.getStats();

  res.status = 200;
  res.body = {
    status: 'ready',
    queue: {
      total: stats.total,
      processing: stats.processing,
      pending: stats.pending,
    },
  };
});

/**
 * List capabilities
 */
gateway.registerRoute('GET', '/api/v1/capabilities', (req, res) => {
  res.status = 200;
  res.body = {
    endpoints: {
      health: ['/health', '/health/ready'],
      jobs: [
        '/api/v1/jobs',
        '/api/v1/jobs/:id',
        '/api/v1/jobs/:id/cancel',
      ],
      render: [
        '/api/v1/render/brief',
        '/api/v1/render/batch',
        '/api/v1/render/static-ad',
      ],
      tts: [
        '/api/v1/tts/generate',
        '/api/v1/tts/voice-clone',
        '/api/v1/tts/multi-language',
      ],
      video: [
        '/api/v1/video/generate',
        '/api/v1/video/image-to-video',
      ],
      image: [
        '/api/v1/image/character',
      ],
      avatar: [
        '/api/v1/avatar/infinitetalk',
      ],
      audio: [
        '/api/v1/audio/search-music',
        '/api/v1/audio/mix',
        '/api/v1/audio/sfx',
      ],
    },
  };
});

// =============================================================================
// Job Management Endpoints
// =============================================================================

/**
 * List all jobs
 */
gateway.registerRoute('GET', '/api/v1/jobs', (req, res) => {
  const jobs = queue.getAllJobs();

  res.status = 200;
  res.body = {
    jobs: jobs.map(j => ({
      id: j.id,
      type: j.type,
      status: j.status,
      createdAt: new Date(j.createdAt).toISOString(),
      duration: j.completedAt ? j.completedAt - (j.startedAt || j.createdAt) : undefined,
    })),
    stats: queue.getStats(),
  };
});

/**
 * Get job status
 */
gateway.registerRoute('GET', '/api/v1/jobs/:id', (req, res) => {
  const jobId = req.path.split('/').pop()!;
  const job = queue.getJob(jobId);

  if (!job) {
    res.status = 404;
    res.body = { error: 'Job not found' };
    return;
  }

  res.status = 200;
  res.body = {
    id: job.id,
    type: job.type,
    status: job.status,
    input: job.input,
    result: job.result,
    error: job.error,
    createdAt: new Date(job.createdAt).toISOString(),
    startedAt: job.startedAt ? new Date(job.startedAt).toISOString() : undefined,
    completedAt: job.completedAt ? new Date(job.completedAt).toISOString() : undefined,
    retries: job.retries,
  };
});

/**
 * Cancel job
 */
gateway.registerRoute('DELETE', '/api/v1/jobs/:id', (req, res) => {
  const jobId = req.path.split('/').pop()!;
  const cancelled = queue.cancelJob(jobId);

  if (!cancelled) {
    res.status = 404;
    res.body = { error: 'Job not found or cannot be cancelled' };
    return;
  }

  res.status = 200;
  res.body = { success: true, jobId };
});

// =============================================================================
// Render Endpoints
// =============================================================================

/**
 * Render video from brief
 */
gateway.registerRoute('POST', '/api/v1/render/brief', async (req, res) => {
  const { brief, quality, outputFormat, webhookUrl } = req.body;

  if (!brief) {
    res.status = 400;
    res.body = { error: 'Missing required field: brief' };
    return;
  }

  const jobId = queue.enqueue('render-brief', { brief, quality, outputFormat }, {
    webhookUrl,
  });

  res.status = 202;
  res.body = {
    jobId,
    status: 'queued',
    pollUrl: `/api/v1/jobs/${jobId}`,
  };
});

/**
 * Batch render
 */
gateway.registerRoute('POST', '/api/v1/render/batch', async (req, res) => {
  const { videos, outputDir, quality, webhook } = req.body;

  if (!videos || !Array.isArray(videos)) {
    res.status = 400;
    res.body = { error: 'Missing or invalid field: videos (must be array)' };
    return;
  }

  const batch = await batchHandler.submitBatch({
    videos,
    outputDir,
    quality,
    webhook,
  });

  res.status = 202;
  res.body = batch;
});

/**
 * Get batch status
 */
gateway.registerRoute('GET', '/api/v1/render/batch/:id', (req, res) => {
  const batchId = req.path.split('/').pop()!;
  const batch = batchHandler.getBatchStatus(batchId);

  if (!batch) {
    res.status = 404;
    res.body = { error: 'Batch not found' };
    return;
  }

  res.status = 200;
  res.body = batch;
});

/**
 * Render static ad
 */
gateway.registerRoute('POST', '/api/v1/render/static-ad', async (req, res) => {
  const { template, bindings, size, format, webhookUrl } = req.body;

  if (!template || !bindings) {
    res.status = 400;
    res.body = { error: 'Missing required fields: template, bindings' };
    return;
  }

  const jobId = queue.enqueue('render-static-ad', { template, bindings, size, format }, {
    webhookUrl,
  });

  res.status = 202;
  res.body = {
    jobId,
    status: 'queued',
    pollUrl: `/api/v1/jobs/${jobId}`,
  };
});

// =============================================================================
// TTS Endpoints
// =============================================================================

/**
 * Generate TTS
 */
gateway.registerRoute('POST', '/api/v1/tts/generate', async (req, res) => {
  const { text, provider, voice, options, webhookUrl } = req.body;

  if (!text) {
    res.status = 400;
    res.body = { error: 'Missing required field: text' };
    return;
  }

  const jobId = queue.enqueue('tts-generate', { text, provider, voice, options }, {
    webhookUrl,
  });

  res.status = 202;
  res.body = {
    jobId,
    status: 'queued',
    pollUrl: `/api/v1/jobs/${jobId}`,
  };
});

/**
 * Clone voice and generate
 */
gateway.registerRoute('POST', '/api/v1/tts/voice-clone', async (req, res) => {
  const { text, voiceReferenceUrl, emotion, webhookUrl } = req.body;

  if (!text || !voiceReferenceUrl) {
    res.status = 400;
    res.body = { error: 'Missing required fields: text, voiceReferenceUrl' };
    return;
  }

  const jobId = queue.enqueue('tts-voice-clone', { text, voiceReferenceUrl, emotion }, {
    webhookUrl,
  });

  res.status = 202;
  res.body = {
    jobId,
    status: 'queued',
    pollUrl: `/api/v1/jobs/${jobId}`,
  };
});

/**
 * Multi-language TTS
 */
gateway.registerRoute('POST', '/api/v1/tts/multi-language', async (req, res) => {
  const { text, languages, webhookUrl } = req.body;

  if (!text || !languages) {
    res.status = 400;
    res.body = { error: 'Missing required fields: text, languages' };
    return;
  }

  const jobIds: string[] = [];

  for (const lang of languages) {
    const jobId = queue.enqueue('tts-generate', { text, provider: 'openai', language: lang }, {
      webhookUrl,
    });
    jobIds.push(jobId);
  }

  res.status = 202;
  res.body = {
    jobIds,
    status: 'queued',
  };
});

// =============================================================================
// Video Generation Endpoints
// =============================================================================

/**
 * Generate AI video
 */
gateway.registerRoute('POST', '/api/v1/video/generate', async (req, res) => {
  const { prompt, model, duration, size, webhookUrl } = req.body;

  if (!prompt) {
    res.status = 400;
    res.body = { error: 'Missing required field: prompt' };
    return;
  }

  const jobId = queue.enqueue('video-generate', { prompt, model, duration, size }, {
    webhookUrl,
    priority: 1, // Higher priority for video gen
  });

  res.status = 202;
  res.body = {
    jobId,
    status: 'queued',
    pollUrl: `/api/v1/jobs/${jobId}`,
    estimatedDuration: 60, // seconds
  };
});

/**
 * Image-to-video
 */
gateway.registerRoute('POST', '/api/v1/video/image-to-video', async (req, res) => {
  const { imageUrl, motionPrompt, duration, webhookUrl } = req.body;

  if (!imageUrl || !motionPrompt) {
    res.status = 400;
    res.body = { error: 'Missing required fields: imageUrl, motionPrompt' };
    return;
  }

  const jobId = queue.enqueue('image-to-video', { imageUrl, motionPrompt, duration }, {
    webhookUrl,
  });

  res.status = 202;
  res.body = {
    jobId,
    status: 'queued',
    pollUrl: `/api/v1/jobs/${jobId}`,
  };
});

// =============================================================================
// Image Generation Endpoints
// =============================================================================

/**
 * Generate AI character
 */
gateway.registerRoute('POST', '/api/v1/image/character', async (req, res) => {
  const { name, description, style, expressions, webhookUrl } = req.body;

  if (!name || !description) {
    res.status = 400;
    res.body = { error: 'Missing required fields: name, description' };
    return;
  }

  const jobId = queue.enqueue('character-generate', { name, description, style, expressions }, {
    webhookUrl,
  });

  res.status = 202;
  res.body = {
    jobId,
    status: 'queued',
    pollUrl: `/api/v1/jobs/${jobId}`,
  };
});

// =============================================================================
// Avatar Endpoints
// =============================================================================

/**
 * Generate talking head with InfiniteTalk
 */
gateway.registerRoute('POST', '/api/v1/avatar/infinitetalk', async (req, res) => {
  const { audioUrl, faceImageUrl, fps, webhookUrl } = req.body;

  if (!audioUrl || !faceImageUrl) {
    res.status = 400;
    res.body = { error: 'Missing required fields: audioUrl, faceImageUrl' };
    return;
  }

  const jobId = queue.enqueue('avatar-infinitetalk', { audioUrl, faceImageUrl, fps }, {
    webhookUrl,
    priority: 1,
  });

  res.status = 202;
  res.body = {
    jobId,
    status: 'queued',
    pollUrl: `/api/v1/jobs/${jobId}`,
  };
});

// =============================================================================
// Audio Processing Endpoints
// =============================================================================

/**
 * Search for music from stock libraries
 */
gateway.registerRoute('POST', '/api/v1/audio/search-music', async (req, res) => {
  const { query, provider = 'freesound', limit = 10, webhookUrl } = req.body;

  if (!query) {
    res.status = 400;
    res.body = { error: 'Missing required field: query' };
    return;
  }

  const jobId = queue.enqueue('audio-search-music', { query, provider, limit }, {
    webhookUrl,
  });

  res.status = 202;
  res.body = {
    jobId,
    status: 'queued',
    pollUrl: `/api/v1/jobs/${jobId}`,
  };
});

/**
 * Mix audio files (voiceover + music + SFX)
 */
gateway.registerRoute('POST', '/api/v1/audio/mix', async (req, res) => {
  const { manifestPath, eventsPath, sfxRoot, outputPath, webhookUrl } = req.body;

  if (!manifestPath || !eventsPath) {
    res.status = 400;
    res.body = { error: 'Missing required fields: manifestPath, eventsPath' };
    return;
  }

  const jobId = queue.enqueue('audio-mix', {
    manifestPath,
    eventsPath,
    sfxRoot: sfxRoot || 'public/assets/sfx',
    outputPath: outputPath || `output/audio_mix_${Date.now()}.wav`,
  }, {
    webhookUrl,
  });

  res.status = 202;
  res.body = {
    jobId,
    status: 'queued',
    pollUrl: `/api/v1/jobs/${jobId}`,
  };
});

/**
 * Search or generate sound effects
 */
gateway.registerRoute('POST', '/api/v1/audio/sfx', async (req, res) => {
  const { prompt, provider = 'freesound', generate = false, duration, webhookUrl } = req.body;

  if (!prompt) {
    res.status = 400;
    res.body = { error: 'Missing required field: prompt' };
    return;
  }

  const jobId = queue.enqueue('audio-sfx', {
    prompt,
    provider,
    generate,
    duration,
  }, {
    webhookUrl,
  });

  res.status = 202;
  res.body = {
    jobId,
    status: 'queued',
    pollUrl: `/api/v1/jobs/${jobId}`,
  };
});

// =============================================================================
// Template Ingestion Endpoints
// =============================================================================

/**
 * Upload reference ad image
 */
gateway.registerRoute('POST', '/api/v1/template/upload', async (req, res) => {
  const { imageBase64, filename, metadata } = req.body;

  if (!imageBase64 || !filename) {
    res.status = 400;
    res.body = { error: 'Missing required fields: imageBase64, filename' };
    return;
  }

  // Dynamically import the uploader
  const { uploadReferenceImage } = await import('../ad-templates/ingestion/image-uploader');

  const result = await uploadReferenceImage({
    imageBase64,
    filename,
    metadata,
  });

  if (!result.success) {
    res.status = 400;
    res.body = { error: result.error };
    return;
  }

  res.status = 200;
  res.body = {
    imageId: result.imageId,
    filePath: result.filePath,
    dimensions: result.dimensions,
    fileSize: result.fileSize,
    mimeType: result.mimeType,
    warnings: result.warnings,
  };
});

/**
 * Extract template from uploaded image
 */
gateway.registerRoute('POST', '/api/v1/template/extract', async (req, res) => {
  const { imageId, model = 'gpt-4-vision', webhookUrl } = req.body;

  if (!imageId) {
    res.status = 400;
    res.body = { error: 'Missing required field: imageId' };
    return;
  }

  const jobId = queue.enqueue('extract-template', { imageId, model }, {
    webhookUrl,
  });

  res.status = 202;
  res.body = {
    jobId,
    status: 'queued',
    pollUrl: `/api/v1/jobs/${jobId}`,
  };
});

/**
 * List uploaded images
 */
gateway.registerRoute('GET', '/api/v1/template/images', async (req, res) => {
  const { listUploadedImages } = await import('../ad-templates/ingestion/image-uploader');
  const images = await listUploadedImages();

  res.status = 200;
  res.body = { images };
});

/**
 * Get uploaded image by ID
 */
gateway.registerRoute('GET', '/api/v1/template/images/:imageId', async (req, res) => {
  const imageId = req.path.split('/').pop()!;
  const { getUploadedImage } = await import('../ad-templates/ingestion/image-uploader');
  const image = await getUploadedImage(imageId);

  if (!image) {
    res.status = 404;
    res.body = { error: 'Image not found' };
    return;
  }

  res.status = 200;
  res.body = image;
});

/**
 * Delete uploaded image
 */
gateway.registerRoute('DELETE', '/api/v1/template/images/:imageId', async (req, res) => {
  const imageId = req.path.split('/').pop()!;
  const { deleteUploadedImage } = await import('../ad-templates/ingestion/image-uploader');
  const success = await deleteUploadedImage(imageId);

  if (!success) {
    res.status = 404;
    res.body = { error: 'Image not found or deletion failed' };
    return;
  }

  res.status = 200;
  res.body = { success: true };
});

// =============================================================================
// Server Startup
// =============================================================================

async function start() {
  console.log('🚀 Starting Remotion Media Service...');
  console.log(`📡 Port: ${CONFIG.port}`);
  console.log(`🔑 API Key: ${CONFIG.apiKey.substring(0, 8)}...`);
  console.log(`⚙️  Max Concurrent Jobs: ${CONFIG.queue.maxConcurrent}`);
  console.log(`🌐 CORS Enabled: ${CONFIG.cors.enabled}`);

  await gateway.start();

  console.log(`✅ Remotion Media Service is running on http://localhost:${CONFIG.port}`);
  console.log(`📚 Endpoints: GET http://localhost:${CONFIG.port}/api/v1/capabilities`);
}

// Start server
if (require.main === module) {
  start().catch(err => {
    console.error('❌ Failed to start service:', err);
    process.exit(1);
  });
}

export { gateway, queue, batchHandler };
