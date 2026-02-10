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

// Load .env.local for API keys (Gemini, Veo, etc.)
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        const value = trimmed.substring(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
}

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
// Veo 3.1 Video Generation Job Handler
// =============================================================================

/**
 * Generate video with Google Veo 3.1 (image-to-video)
 */
queue.registerHandler('veo-generate', async (input) => {
  const { VeoClient } = await import('../api/veo-client');

  const {
    imageUrl,
    imageBase64,
    prompt,
    duration = 8,
    aspectRatio = '9:16',
    seed,
  } = input;

  const client = new VeoClient();

  const response = await client.generateVideo({
    imageUrl,
    imageBase64,
    prompt,
    duration,
    aspectRatio,
    seed,
  });

  return {
    jobId: response.jobId,
    status: response.status.status,
    pollUrl: `/api/v1/ai/veo/jobs/${response.jobId}`,
  };
});

/**
 * Poll Veo job status
 */
queue.registerHandler('veo-poll', async (input) => {
  const { VeoClient } = await import('../api/veo-client');
  const client = new VeoClient();

  const status = await client.getJobStatus(input.veoJobId);

  // Download video if completed
  if (status.status === 'completed' && status.videoUrl) {
    const outputPath = path.join(
      process.env.OUTPUT_DIR || './output',
      `veo-${input.veoJobId}.mp4`
    );
    await client.downloadVideo(status.videoUrl, outputPath);
    return { ...status, localPath: outputPath };
  }

  return status;
});

// =============================================================================
// Nano Banana (Gemini) Image Generation Job Handler
// =============================================================================

/**
 * Generate before/after image pairs with Gemini
 */
queue.registerHandler('nano-banana-generate', async (input) => {
  const { runNanoBananaStage } = await import('../pipeline/nano-banana-stage');

  const outputDir = input.outputDir || path.join(
    process.env.OUTPUT_DIR || './output',
    `nano-banana-${Date.now()}`
  );

  const result = await runNanoBananaStage({
    product: {
      name: input.product?.name || 'Product',
      description: input.product?.description || '',
      imageUrl: input.product?.imageUrl,
      imagePath: input.product?.imagePath,
    },
    scene: {
      beforePrompt: input.beforePrompt || 'A frustrated person dealing with the problem',
      afterPrompt: input.afterPrompt || 'A happy person enjoying the solution',
      characterStyle: input.characterStyle || 'realistic',
    },
    imageCount: input.imageCount || 1,
    outputDir,
  });

  return {
    pairs: result.pairs.map(p => ({
      id: p.id,
      beforeImagePath: p.beforeImagePath,
      afterImagePath: p.afterImagePath,
    })),
    characterProfile: result.characterProfile,
    outputDir: result.outputDir,
    totalPairs: result.pairs.length,
  };
});

// =============================================================================
// Before/After Reveal Video Job Handler
// =============================================================================

/**
 * Generate a before/after reveal video using Remotion composition
 */
queue.registerHandler('render-before-after', async (input) => {
  const {
    beforeImageSrc,
    afterImageSrc,
    beforeVideoSrc,
    afterVideoSrc,
    headline,
    subheadline,
    ctaText,
    brandName,
    primaryColor,
    accentColor,
    transitionStyle = 'whip-pan',
    enableCameraShake = true,
    outputFormat = 'mp4',
    quality = 'production',
  } = input;

  const outputPath = path.join(
    process.env.OUTPUT_DIR || './output',
    `before-after-reveal-${Date.now()}.${outputFormat}`
  );

  const propsJson = JSON.stringify({
    beforeImageSrc,
    afterImageSrc,
    beforeVideoSrc,
    afterVideoSrc,
    headline,
    subheadline,
    ctaText,
    brandName,
    primaryColor,
    accentColor,
    transitionStyle,
    enableCameraShake,
  });

  const crf = quality === 'preview' ? 28 : 18;

  execSync(
    `npx remotion render BeforeAfterReveal "${outputPath}" --props='${propsJson}' --crf=${crf}`,
    { cwd: path.resolve(__dirname, '../..'), stdio: 'pipe' }
  );

  const stats = fs.statSync(outputPath);

  return {
    videoPath: outputPath,
    fileSize: stats.size,
    format: outputFormat,
    duration: 8,
    transitionStyle,
  };
});

// =============================================================================
// UGC Pipeline Job Handlers
// =============================================================================

/**
 * Generate UGC ad batch (full pipeline or dry-run)
 */
queue.registerHandler('ugc-generate', async (input) => {
  const { runUGCPipeline } = await import('../pipeline/ugc-ad-pipeline');
  const { META_AD_SIZES } = await import('../pipeline/types');

  const config = {
    product: input.product || { name: 'Product', description: '' },
    brand: input.brand || { name: 'Brand', primaryColor: '#6366f1', accentColor: '#22c55e', fontFamily: 'Inter' },
    scenes: input.scenes || { beforePrompt: '', afterPrompt: '', characterStyle: 'realistic' as const },
    matrix: {
      templates: input.matrix?.templates || ['before_after' as const],
      hookTypes: input.matrix?.hookTypes || ['question' as const, 'social_proof' as const],
      awarenessLevels: input.matrix?.awarenessLevels || ['problem_aware' as const, 'solution_aware' as const],
      ctaTypes: input.matrix?.ctaTypes || ['action' as const, 'benefit' as const],
      sizes: input.matrix?.sizes || META_AD_SIZES.filter((s: any) => ['feed_square', 'story'].includes(s.name)),
      strategy: input.matrix?.strategy || 'latin_square' as const,
      maxVariants: input.matrix?.maxVariants || 12,
    },
    copyBank: input.copyBank || {
      headlines: { question: ['Try it today'], social_proof: ['Trusted by thousands'] },
      subheadlines: { problem_aware: ['Solve your problem'], solution_aware: ['The better way'] },
      ctas: { action: ['Try Now'], benefit: ['Get Started'] },
      beforeLabels: ['BEFORE'], afterLabels: ['AFTER'],
      trustLines: [''], badges: [''],
    },
    outputDir: input.outputDir || './output/ugc-ads',
    dryRun: input.dryRun ?? false,
  };

  const runOptions = input.resumeBatchDir ? { resumeBatchDir: input.resumeBatchDir } : undefined;
  const batch = await runUGCPipeline(config, runOptions);
  return batch;
});

/**
 * Optimize existing batch with Meta performance data
 */
queue.registerHandler('ugc-optimize', async (input) => {
  const { ingestMetaCSV, mergePerformanceIntoBatch, loadBatch, saveBatch } = await import('../pipeline/meta-data-ingester');
  const { generateOptimizationReport } = await import('../pipeline/parameter-scorer');

  const batchJsonPath = path.join(input.batchDir, 'batch.json');
  const batch = loadBatch(batchJsonPath);

  // Ingest performance data
  let performances;
  if (input.metaCsvPath) {
    performances = ingestMetaCSV(input.metaCsvPath);
  } else if (input.performanceData && Array.isArray(input.performanceData)) {
    performances = input.performanceData;
  } else {
    throw new Error('Either metaCsvPath or performanceData array is required');
  }

  mergePerformanceIntoBatch(batch, performances);
  saveBatch(batch, batchJsonPath);

  const report = generateOptimizationReport(batch, input.weights);

  // Save report
  const reportPath = path.join(input.batchDir, 'optimization_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  return { batch, report, reportPath };
});

/**
 * Generate next optimized batch from report
 */
queue.registerHandler('ugc-next-batch', async (input) => {
  const { loadBatch } = await import('../pipeline/meta-data-ingester');
  const { generateOptimizationReport } = await import('../pipeline/parameter-scorer');
  const { generateNextBatch } = await import('../pipeline/optimization-engine');
  const { META_AD_SIZES } = await import('../pipeline/types');

  const batchJsonPath = path.join(input.batchDir, 'batch.json');
  const batch = loadBatch(batchJsonPath);

  // Load or generate report
  let report;
  const reportPath = path.join(input.batchDir, 'optimization_report.json');
  if (fs.existsSync(reportPath)) {
    report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  } else {
    report = generateOptimizationReport(batch);
  }

  const nextBatchResult = generateNextBatch({
    previousBatch: batch,
    report,
    allTemplates: input.allTemplates || ['before_after', 'testimonial', 'product_demo', 'problem_solution', 'stat_counter', 'feature_list', 'urgency'],
    allHookTypes: input.allHookTypes || ['question', 'statement', 'shock', 'curiosity', 'social_proof', 'urgency'],
    allAwarenessLevels: input.allAwarenessLevels || ['unaware', 'problem_aware', 'solution_aware', 'product_aware', 'most_aware'],
    allCtaTypes: input.allCtaTypes || ['action', 'benefit', 'urgency', 'curiosity'],
    copyBank: input.copyBank || batch.variants[0]?.parameters ? {
      headlines: { question: ['Try it today'] },
      subheadlines: { problem_aware: ['Solve it now'] },
      ctas: { action: ['Try Now'] },
      beforeLabels: ['BEFORE'], afterLabels: ['AFTER'],
      trustLines: [''], badges: [''],
    } : input.copyBank,
    maxVariants: input.maxVariants || 12,
    strategy: input.strategy,
    sizes: input.sizes || META_AD_SIZES.filter((s: any) => ['feed_square', 'story'].includes(s.name)),
  });

  // Save next batch
  const nextBatchDir = input.outputDir || path.join(path.dirname(input.batchDir), `next_${batch.id}`);
  if (!fs.existsSync(nextBatchDir)) {
    fs.mkdirSync(nextBatchDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(nextBatchDir, 'next_batch.json'),
    JSON.stringify(nextBatchResult, null, 2)
  );

  return { ...nextBatchResult, outputDir: nextBatchDir };
});

/**
 * List UGC batches
 */
function listUGCBatches(outputDir: string): any[] {
  const baseDir = outputDir || './output/ugc-ads';
  if (!fs.existsSync(baseDir)) return [];

  return fs.readdirSync(baseDir)
    .filter(d => {
      const batchJson = path.join(baseDir, d, 'batch.json');
      return fs.existsSync(batchJson);
    })
    .map(d => {
      const batchJson = path.join(baseDir, d, 'batch.json');
      try {
        const batch = JSON.parse(fs.readFileSync(batchJson, 'utf-8'));
        const templates = [...new Set((batch.variants || []).map((v: any) => v.parameters?.visual?.template).filter(Boolean))] as string[];
        return {
          id: batch.id,
          productId: batch.productId,
          totalVariants: batch.totalVariants,
          templates,
          status: batch.status,
          createdAt: batch.createdAt,
          hasReport: fs.existsSync(path.join(baseDir, d, 'optimization_report.json')),
          dir: path.join(baseDir, d),
        };
      } catch { return null; }
    })
    .filter(Boolean);
}

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
      'external-api': [
        '/api/render/video',
        '/api/render/static',
        '/api/ai/veo',
        '/api/ai/veo/jobs/:jobId',
        '/api/ai/nano-banana',
        '/api/templates/before-after',
      ],
      ugc: [
        '/api/v1/ugc/generate',
        '/api/v1/ugc/resume',
        '/api/v1/ugc/batches',
        '/api/v1/ugc/batches/:id',
        '/api/v1/ugc/batches/:id/gallery',
        '/api/v1/ugc/batches/:id/significance',
        '/api/v1/ugc/batches/:id/budget',
        '/api/v1/ugc/batches/:id/export-csv',
        '/api/v1/ugc/optimize',
        '/api/v1/ugc/next-batch',
        '/api/v1/ugc/compare',
        '/api/v1/ugc/sample-size',
        '/api/v1/ugc/batches/:id/fatigue',
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
// External Consumer API Endpoints (API-001 through API-006)
// =============================================================================

/**
 * POST /api/render/video — Render video from brief (external consumer API)
 * Mirrors /api/v1/render/brief for cross-app integration
 */
gateway.registerRoute('POST', '/api/render/video', async (req, res) => {
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
    outputUrl: null,
    pollUrl: `/api/v1/jobs/${jobId}`,
  };
});

/**
 * POST /api/render/static — Render static ad (external consumer API)
 * Supports multi-size output for PCT integration
 */
gateway.registerRoute('POST', '/api/render/static', async (req, res) => {
  const { template, bindings, sizes, format = 'png', webhookUrl } = req.body;

  if (!template || !bindings) {
    res.status = 400;
    res.body = { error: 'Missing required fields: template, bindings' };
    return;
  }

  // If multiple sizes requested, enqueue one job per size
  if (sizes && Array.isArray(sizes) && sizes.length > 1) {
    const jobIds: string[] = [];

    for (const size of sizes) {
      const jobId = queue.enqueue('render-static-ad', { template, bindings, size, format }, {
        webhookUrl,
      });
      jobIds.push(jobId);
    }

    res.status = 202;
    res.body = {
      jobIds,
      status: 'queued',
      totalSizes: sizes.length,
    };
    return;
  }

  const size = sizes?.[0] || req.body.size;
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

/**
 * POST /api/ai/veo — Veo 3.1 video generation (API-004)
 * For Content Factory video generation
 */
gateway.registerRoute('POST', '/api/ai/veo', async (req, res) => {
  const { imageUrl, imageBase64, prompt, duration, aspectRatio, seed, webhookUrl } = req.body;

  if (!prompt) {
    res.status = 400;
    res.body = { error: 'Missing required field: prompt' };
    return;
  }

  if (!imageUrl && !imageBase64) {
    res.status = 400;
    res.body = { error: 'Either imageUrl or imageBase64 is required' };
    return;
  }

  const jobId = queue.enqueue('veo-generate', {
    imageUrl,
    imageBase64,
    prompt,
    duration: duration || 8,
    aspectRatio: aspectRatio || '9:16',
    seed,
  }, {
    webhookUrl,
    priority: 1,
  });

  res.status = 202;
  res.body = {
    jobId,
    status: 'queued',
    pollUrl: `/api/v1/jobs/${jobId}`,
    estimatedDuration: 120,
  };
});

/**
 * GET /api/ai/veo/jobs/:jobId — Poll Veo job status (VEO-003)
 */
gateway.registerRoute('GET', '/api/ai/veo/jobs/:jobId', async (req, res) => {
  const veoJobId = req.path.split('/').pop()!;

  try {
    const { VeoClient } = await import('../api/veo-client');
    const client = new VeoClient();
    const status = await client.getJobStatus(veoJobId);

    res.status = 200;
    res.body = status;
  } catch (error: any) {
    if (error.message?.includes('API key is required')) {
      res.status = 503;
      res.body = { error: 'Veo service not configured. Set GOOGLE_VEO_API_KEY.' };
    } else {
      res.status = 500;
      res.body = { error: error.message };
    }
  }
});

/**
 * POST /api/ai/nano-banana — Nano Banana image generation (API-005)
 * For Content Factory before/after image pair generation
 */
gateway.registerRoute('POST', '/api/ai/nano-banana', async (req, res) => {
  const {
    product,
    beforePrompt,
    afterPrompt,
    characterStyle,
    imageCount,
    outputDir,
    webhookUrl,
  } = req.body;

  if (!product?.name) {
    res.status = 400;
    res.body = { error: 'Missing required field: product.name' };
    return;
  }

  const jobId = queue.enqueue('nano-banana-generate', {
    product,
    beforePrompt: beforePrompt || 'A person struggling with the problem',
    afterPrompt: afterPrompt || 'A person enjoying the solution',
    characterStyle: characterStyle || 'realistic',
    imageCount: imageCount || 1,
    outputDir,
  }, {
    webhookUrl,
    priority: 1,
  });

  res.status = 202;
  res.body = {
    jobId,
    status: 'queued',
    pollUrl: `/api/v1/jobs/${jobId}`,
    estimatedDuration: 30,
  };
});

/**
 * POST /api/templates/before-after — Before/After reveal video (API-006)
 * Combines Veo/images + Remotion template for reveal videos
 */
gateway.registerRoute('POST', '/api/templates/before-after', async (req, res) => {
  const {
    beforeImageSrc,
    afterImageSrc,
    beforeVideoSrc,
    afterVideoSrc,
    headline,
    subheadline,
    ctaText,
    brandName,
    primaryColor,
    accentColor,
    transitionStyle,
    enableCameraShake,
    quality,
    webhookUrl,
  } = req.body;

  if (!beforeImageSrc && !beforeVideoSrc) {
    res.status = 400;
    res.body = { error: 'Either beforeImageSrc or beforeVideoSrc is required' };
    return;
  }

  if (!afterImageSrc && !afterVideoSrc) {
    res.status = 400;
    res.body = { error: 'Either afterImageSrc or afterVideoSrc is required' };
    return;
  }

  const jobId = queue.enqueue('render-before-after', {
    beforeImageSrc,
    afterImageSrc,
    beforeVideoSrc,
    afterVideoSrc,
    headline,
    subheadline,
    ctaText,
    brandName,
    primaryColor,
    accentColor,
    transitionStyle: transitionStyle || 'whip-pan',
    enableCameraShake: enableCameraShake ?? true,
    quality: quality || 'production',
  }, {
    webhookUrl,
    priority: 1,
  });

  res.status = 202;
  res.body = {
    jobId,
    status: 'queued',
    pollUrl: `/api/v1/jobs/${jobId}`,
    estimatedDuration: 60,
  };
});

// =============================================================================
// UGC Pipeline Endpoints
// =============================================================================

/**
 * Generate UGC ad batch
 *
 * POST /api/v1/ugc/generate
 * Body: { product, brand, scenes, matrix, copyBank, dryRun, outputDir, webhookUrl }
 */
gateway.registerRoute('POST', '/api/v1/ugc/generate', async (req, res) => {
  const { product, brand, scenes, matrix, copyBank, dryRun, outputDir, webhookUrl } = req.body;

  if (!product || !product.name) {
    res.status = 400;
    res.body = { error: 'Missing required field: product.name' };
    return;
  }

  const jobId = queue.enqueue('ugc-generate', {
    product,
    brand,
    scenes,
    matrix,
    copyBank,
    dryRun: dryRun ?? false,
    outputDir: outputDir || './output/ugc-ads',
  }, { webhookUrl, priority: 1 });

  res.status = 202;
  res.body = {
    jobId,
    status: 'queued',
    dryRun: dryRun ?? false,
    pollUrl: `/api/v1/jobs/${jobId}`,
  };
});

/**
 * List all UGC batches
 *
 * GET /api/v1/ugc/batches
 */
gateway.registerRoute('GET', '/api/v1/ugc/batches', (req, res) => {
  const batches = listUGCBatches('./output/ugc-ads');

  res.status = 200;
  res.body = { batches, total: batches.length };
});

/**
 * Get a specific UGC batch
 *
 * GET /api/v1/ugc/batches/:id
 */
gateway.registerRoute('GET', '/api/v1/ugc/batches/:id', (req, res) => {
  const batchId = req.path.split('/').pop()!;
  const batchDir = path.join('./output/ugc-ads', batchId);
  const batchJsonPath = path.join(batchDir, 'batch.json');

  if (!fs.existsSync(batchJsonPath)) {
    res.status = 404;
    res.body = { error: `Batch not found: ${batchId}` };
    return;
  }

  const batch = JSON.parse(fs.readFileSync(batchJsonPath, 'utf-8'));

  // Check for optimization report
  const reportPath = path.join(batchDir, 'optimization_report.json');
  const report = fs.existsSync(reportPath)
    ? JSON.parse(fs.readFileSync(reportPath, 'utf-8'))
    : null;

  res.status = 200;
  res.body = { batch, report };
});

/**
 * Optimize batch with Meta performance data
 *
 * POST /api/v1/ugc/optimize
 * Body: { batchId, metaCsvPath?, performanceData?, weights?, webhookUrl? }
 */
gateway.registerRoute('POST', '/api/v1/ugc/optimize', async (req, res) => {
  const { batchId, metaCsvPath, performanceData, weights, webhookUrl } = req.body;

  if (!batchId) {
    res.status = 400;
    res.body = { error: 'Missing required field: batchId' };
    return;
  }

  if (!metaCsvPath && !performanceData) {
    res.status = 400;
    res.body = { error: 'Either metaCsvPath or performanceData is required' };
    return;
  }

  const batchDir = path.join('./output/ugc-ads', batchId);
  if (!fs.existsSync(path.join(batchDir, 'batch.json'))) {
    res.status = 404;
    res.body = { error: `Batch not found: ${batchId}` };
    return;
  }

  const jobId = queue.enqueue('ugc-optimize', {
    batchDir,
    metaCsvPath,
    performanceData,
    weights,
  }, { webhookUrl });

  res.status = 202;
  res.body = {
    jobId,
    status: 'queued',
    pollUrl: `/api/v1/jobs/${jobId}`,
  };
});

/**
 * Generate next optimized batch
 *
 * POST /api/v1/ugc/next-batch
 * Body: { batchId, maxVariants?, copyBank?, strategy?, webhookUrl? }
 */
gateway.registerRoute('POST', '/api/v1/ugc/next-batch', async (req, res) => {
  const { batchId, maxVariants, copyBank, strategy, webhookUrl } = req.body;

  if (!batchId) {
    res.status = 400;
    res.body = { error: 'Missing required field: batchId' };
    return;
  }

  const batchDir = path.join('./output/ugc-ads', batchId);
  if (!fs.existsSync(path.join(batchDir, 'batch.json'))) {
    res.status = 404;
    res.body = { error: `Batch not found: ${batchId}` };
    return;
  }

  const jobId = queue.enqueue('ugc-next-batch', {
    batchDir,
    maxVariants: maxVariants || 12,
    copyBank,
    strategy,
  }, { webhookUrl });

  res.status = 202;
  res.body = {
    jobId,
    status: 'queued',
    pollUrl: `/api/v1/jobs/${jobId}`,
  };
});

/**
 * Resume an interrupted UGC batch
 *
 * POST /api/v1/ugc/resume
 * Body: { batchId, product?, brand?, scenes?, matrix?, copyBank?, webhookUrl? }
 */
gateway.registerRoute('POST', '/api/v1/ugc/resume', async (req, res) => {
  const { batchId, product, brand, scenes, matrix, copyBank, webhookUrl } = req.body;

  if (!batchId) {
    res.status = 400;
    res.body = { error: 'Missing required field: batchId' };
    return;
  }

  const batchDir = path.join('./output/ugc-ads', batchId);
  if (!fs.existsSync(path.join(batchDir, 'batch.json'))) {
    res.status = 404;
    res.body = { error: `Batch not found: ${batchId}` };
    return;
  }

  const { loadCheckpoint } = await import('../pipeline/batch-resume');
  const checkpoint = loadCheckpoint(batchDir);
  if (!checkpoint) {
    res.status = 400;
    res.body = { error: `No checkpoint found for batch ${batchId}` };
    return;
  }

  if (checkpoint.stage === 'complete') {
    res.status = 200;
    res.body = { message: 'Batch already complete', checkpoint };
    return;
  }

  const { META_AD_SIZES } = await import('../pipeline/types');
  const jobId = queue.enqueue('ugc-generate', {
    product: product || { name: 'Product', description: '' },
    brand: brand || { name: 'Brand', primaryColor: '#6366f1', accentColor: '#22c55e', fontFamily: 'Inter' },
    scenes: scenes || { beforePrompt: '', afterPrompt: '', characterStyle: 'realistic' as const },
    matrix: matrix || {
      templates: ['before_after' as const],
      hookTypes: ['question' as const, 'social_proof' as const],
      awarenessLevels: ['problem_aware' as const, 'solution_aware' as const],
      ctaTypes: ['action' as const, 'benefit' as const],
      sizes: META_AD_SIZES.filter((s: any) => ['feed_square', 'story'].includes(s.name)),
      strategy: 'latin_square' as const,
      maxVariants: 12,
    },
    copyBank,
    outputDir: path.dirname(batchDir),
    resumeBatchDir: batchDir,
  }, { webhookUrl, priority: 1 });

  res.status = 202;
  res.body = {
    jobId,
    status: 'queued',
    resumingFrom: checkpoint.stage,
    completedStages: checkpoint.completedStages,
    pollUrl: `/api/v1/jobs/${jobId}`,
  };
});

/**
 * Generate gallery HTML for a batch
 *
 * GET /api/v1/ugc/batches/:id/gallery
 */
gateway.registerRoute('GET', '/api/v1/ugc/batches/:id/gallery', (req, res) => {
  const parts = req.path.split('/');
  const batchId = parts[parts.indexOf('batches') + 1];
  const batchDir = path.join('./output/ugc-ads', batchId);

  if (!fs.existsSync(path.join(batchDir, 'batch.json'))) {
    res.status = 404;
    res.body = { error: `Batch not found: ${batchId}` };
    return;
  }

  try {
    const { generateGalleryFromBatch } = require('../pipeline/preview-generator');
    const galleryPath = generateGalleryFromBatch(batchDir);
    const html = fs.readFileSync(galleryPath, 'utf-8');

    res.status = 200;
    res.headers = { 'Content-Type': 'text/html' };
    res.body = html;
  } catch (error: any) {
    res.status = 500;
    res.body = { error: `Gallery generation failed: ${error.message}` };
  }
});

/**
 * Run statistical significance tests on a batch
 *
 * GET /api/v1/ugc/batches/:id/significance
 * Query: ?metric=ctr (default) | roas | conversionRate
 */
gateway.registerRoute('GET', '/api/v1/ugc/batches/:id/significance', (req, res) => {
  const parts = req.path.split('/');
  const batchId = parts[parts.indexOf('batches') + 1];
  const batchDir = path.join('./output/ugc-ads', batchId);
  const batchJsonPath = path.join(batchDir, 'batch.json');

  if (!fs.existsSync(batchJsonPath)) {
    res.status = 404;
    res.body = { error: `Batch not found: ${batchId}` };
    return;
  }

  try {
    const batch = JSON.parse(fs.readFileSync(batchJsonPath, 'utf-8'));
    const { testParameterSignificance } = require('../pipeline/parameter-scorer');

    const url = new URL(req.path, 'http://localhost');
    const metric = (url.searchParams.get('metric') || 'ctr') as 'ctr' | 'roas' | 'conversionRate';
    const results = testParameterSignificance(batch, metric);

    // Save to file
    fs.writeFileSync(
      path.join(batchDir, 'significance_tests.json'),
      JSON.stringify(results, null, 2)
    );

    const significant = results.filter((r: any) => r.isSignificant);
    const highlySignificant = results.filter((r: any) => r.isHighlySignificant);

    res.status = 200;
    res.body = {
      batchId,
      metric,
      totalTests: results.length,
      significant: significant.length,
      highlySignificant: highlySignificant.length,
      results,
    };
  } catch (error: any) {
    res.status = 500;
    res.body = { error: `Significance testing failed: ${error.message}` };
  }
});

/**
 * Get budget allocation recommendations for a batch
 *
 * GET /api/v1/ugc/batches/:id/budget
 * Query: ?dailyBudget=100
 */
gateway.registerRoute('GET', '/api/v1/ugc/batches/:id/budget', (req, res) => {
  const parts = req.path.split('/');
  const batchId = parts[parts.indexOf('batches') + 1];
  const batchDir = path.join('./output/ugc-ads', batchId);
  const batchJsonPath = path.join(batchDir, 'batch.json');

  if (!fs.existsSync(batchJsonPath)) {
    res.status = 404;
    res.body = { error: `Batch not found: ${batchId}` };
    return;
  }

  try {
    const batch = JSON.parse(fs.readFileSync(batchJsonPath, 'utf-8'));
    const { recommendBudgetAllocation } = require('../pipeline/parameter-scorer');

    const url = new URL(req.path, 'http://localhost');
    const dailyBudget = parseFloat(url.searchParams.get('dailyBudget') || '100');
    const allocations = recommendBudgetAllocation(batch, dailyBudget);

    fs.writeFileSync(
      path.join(batchDir, 'budget_allocation.json'),
      JSON.stringify(allocations, null, 2)
    );

    const actions = { increase: 0, maintain: 0, decrease: 0, pause: 0 };
    for (const a of allocations) {
      actions[a.action as keyof typeof actions]++;
    }

    res.status = 200;
    res.body = {
      batchId,
      dailyBudget,
      totalVariants: allocations.length,
      actions,
      allocations,
    };
  } catch (error: any) {
    res.status = 500;
    res.body = { error: `Budget allocation failed: ${error.message}` };
  }
});

/**
 * Export batch as Meta Ads Manager CSV
 *
 * GET /api/v1/ugc/batches/:id/export-csv
 */
gateway.registerRoute('GET', '/api/v1/ugc/batches/:id/export-csv', (req, res) => {
  const parts = req.path.split('/');
  const batchId = parts[parts.indexOf('batches') + 1];
  const batchDir = path.join('./output/ugc-ads', batchId);
  const batchJsonPath = path.join(batchDir, 'batch.json');

  if (!fs.existsSync(batchJsonPath)) {
    res.status = 404;
    res.body = { error: `Batch not found: ${batchId}` };
    return;
  }

  try {
    const batch = JSON.parse(fs.readFileSync(batchJsonPath, 'utf-8'));
    const { generateMetaUploadCSV } = require('../pipeline/meta-csv-exporter');
    const csv = generateMetaUploadCSV(batch);

    const csvPath = path.join(batchDir, 'meta_upload.csv');
    fs.writeFileSync(csvPath, csv);

    res.status = 200;
    res.headers = { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="${batchId}_meta_upload.csv"` };
    res.body = csv;
  } catch (error: any) {
    res.status = 500;
    res.body = { error: `CSV export failed: ${error.message}` };
  }
});

/**
 * Creative fatigue detection for a batch
 *
 * GET /api/v1/ugc/batches/:id/fatigue
 */
gateway.registerRoute('GET', '/api/v1/ugc/batches/:id/fatigue', (req, res) => {
  const parts = req.path.split('/');
  const batchId = parts[parts.indexOf('batches') + 1];
  const batchDir = path.join('./output/ugc-ads', batchId);
  const batchJsonPath = path.join(batchDir, 'batch.json');

  if (!fs.existsSync(batchJsonPath)) {
    res.status = 404;
    res.body = { error: `Batch not found: ${batchId}` };
    return;
  }

  try {
    const batch = JSON.parse(fs.readFileSync(batchJsonPath, 'utf-8'));
    const { quickFatigueCheck, detectFatigue, parseMultiPeriodData } = require('../pipeline/fatigue-detector');

    // Check for multi-period CSV
    const multiPeriodCsvPath = path.join(batchDir, 'meta_periods.csv');
    let report;
    if (fs.existsSync(multiPeriodCsvPath)) {
      const csvContent = fs.readFileSync(multiPeriodCsvPath, 'utf-8');
      const periodData = parseMultiPeriodData(csvContent);
      report = detectFatigue(batch, periodData);
    } else {
      report = quickFatigueCheck(batch);
    }

    fs.writeFileSync(
      path.join(batchDir, 'fatigue_report.json'),
      JSON.stringify(report, null, 2)
    );

    res.status = 200;
    res.body = report;
  } catch (error: any) {
    res.status = 500;
    res.body = { error: `Fatigue detection failed: ${error.message}` };
  }
});

/**
 * Compare two batches (A vs B)
 *
 * GET /api/v1/ugc/compare?batchA=<id>&batchB=<id>
 */
gateway.registerRoute('GET', '/api/v1/ugc/compare', (req, res) => {
  const url = new URL(req.path, 'http://localhost');
  const batchAId = url.searchParams.get('batchA') || '';
  const batchBId = url.searchParams.get('batchB') || '';

  if (!batchAId || !batchBId) {
    res.status = 400;
    res.body = { error: 'Both batchA and batchB query params are required' };
    return;
  }

  const batchAPath = path.join('./output/ugc-ads', batchAId, 'batch.json');
  const batchBPath = path.join('./output/ugc-ads', batchBId, 'batch.json');

  if (!fs.existsSync(batchAPath)) {
    res.status = 404;
    res.body = { error: `Batch A not found: ${batchAId}` };
    return;
  }
  if (!fs.existsSync(batchBPath)) {
    res.status = 404;
    res.body = { error: `Batch B not found: ${batchBId}` };
    return;
  }

  try {
    const batchA = JSON.parse(fs.readFileSync(batchAPath, 'utf-8'));
    const batchB = JSON.parse(fs.readFileSync(batchBPath, 'utf-8'));
    const { compareBatches } = require('../pipeline/batch-comparator');
    const comparison = compareBatches(batchA, batchB);

    res.status = 200;
    res.body = comparison;
  } catch (error: any) {
    res.status = 500;
    res.body = { error: `Comparison failed: ${error.message}` };
  }
});

/**
 * Calculate A/B test sample size
 *
 * GET /api/v1/ugc/sample-size?baselineCtr=0.02&mde=0.2&numVariants=4
 */
gateway.registerRoute('GET', '/api/v1/ugc/sample-size', (req, res) => {
  const url = new URL(req.path, 'http://localhost');

  const baselineCtr = parseFloat(url.searchParams.get('baselineCtr') || '0.02');
  const mde = parseFloat(url.searchParams.get('mde') || '0.2');
  const numVariants = parseInt(url.searchParams.get('numVariants') || '4', 10);
  const dailyImpressions = parseInt(url.searchParams.get('dailyImpressions') || '1000', 10);
  const cpm = parseFloat(url.searchParams.get('cpm') || '15');

  try {
    const { calculateSampleSize } = require('../pipeline/batch-comparator');
    const result = calculateSampleSize({
      baselineCtr,
      mde,
      numVariants,
      dailyImpressions,
      cpm,
    });

    res.status = 200;
    res.body = result;
  } catch (error: any) {
    res.status = 500;
    res.body = { error: `Sample size calculation failed: ${error.message}` };
  }
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
// OpenAPI Documentation & Swagger UI
// =============================================================================

/**
 * Serve OpenAPI spec
 */
gateway.registerRoute('GET', '/api/v1/openapi.json', (req, res) => {
  const { openApiSpec } = require('./openapi-spec');
  res.status = 200;
  res.body = openApiSpec;
});

/**
 * Swagger UI - Interactive API Documentation
 */
gateway.registerRoute('GET', '/docs', async (req, res) => {
  const swaggerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Remotion Media Service - API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; }
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '/api/v1/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        persistAuthorization: true,
        tryItOutEnabled: true,
      });
      window.ui = ui;
    };
  </script>
</body>
</html>
  `.trim();

  res.status = 200;
  res.headers = { 'Content-Type': 'text/html' };
  res.body = swaggerHtml;
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
  console.log(`📚 API Docs: http://localhost:${CONFIG.port}/docs`);
  console.log(`📋 OpenAPI Spec: http://localhost:${CONFIG.port}/api/v1/openapi.json`);
  console.log(`📊 Capabilities: http://localhost:${CONFIG.port}/api/v1/capabilities`);
}

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
  if (gateway && (gateway as any).server) {
    (gateway as any).server.close(() => {
      console.log('✅ Server closed.');
      process.exit(0);
    });
    setTimeout(() => { process.exit(1); }, 3000);
  } else {
    process.exit(0);
  }
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Start server
if (require.main === module) {
  start().catch(err => {
    console.error('❌ Failed to start service:', err);
    process.exit(1);
  });
}

export { gateway, queue, batchHandler };
