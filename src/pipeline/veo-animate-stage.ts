/**
 * Veo 3 Animation Stage
 *
 * Animates static before/after images into UGC-style video clips
 * using Google Veo 3.1 with startImage/endImage support.
 *
 * Based on existing: src/api/veo-client.ts, tests/google-ai/test-veo3.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import type { VeoAnimateInput, VeoAnimateOutput, ImagePair } from './types';

// =============================================================================
// Veo 3 API
// =============================================================================

interface VeoRequestPayload {
  instances: {
    prompt: string;
    image?: { bytesBase64Encoded: string; mimeType: string };
  }[];
  parameters: {
    aspectRatio?: string;
    personGeneration?: string;
  };
}

interface VeoOperationResult {
  name?: string;
  done?: boolean;
  error?: { message: string };
  response?: {
    generateVideoResponse?: {
      generatedSamples?: { video?: { uri: string } }[];
    };
    videoUri?: string;
    videos?: { uri: string }[];
  };
  metadata?: {
    progressPercent?: number;
  };
}

function getVeoApiKey(): string {
  const key = process.env.GOOGLE_VEO_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) {
    throw new Error('GOOGLE_VEO_API_KEY, GOOGLE_AI_API_KEY, or GOOGLE_API_KEY required');
  }
  return key;
}

async function submitVeoJob(payload: VeoRequestPayload): Promise<string> {
  const apiKey = getVeoApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:predictLongRunning?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Veo API error ${response.status}: ${errorText.substring(0, 300)}`);
  }

  const result = (await response.json()) as VeoOperationResult;

  if (result.error) {
    throw new Error(`Veo error: ${result.error.message}`);
  }

  const operationName = result.name;
  if (!operationName) {
    throw new Error('No operation name returned from Veo');
  }

  return operationName;
}

async function pollVeoOperation(operationName: string, maxWaitMs: number = 600000): Promise<VeoOperationResult> {
  const apiKey = getVeoApiKey();
  const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`;
  const pollInterval = 10000; // 10 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(pollUrl);
    if (!response.ok) {
      console.log(`      ⏳ Poll error ${response.status}, retrying...`);
      await new Promise(r => setTimeout(r, pollInterval));
      continue;
    }

    const result = (await response.json()) as VeoOperationResult;

    if (result.error) {
      throw new Error(`Veo generation failed: ${result.error.message}`);
    }

    if (result.done) {
      return result;
    }

    const progress = result.metadata?.progressPercent || 0;
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`      ⏳ Progress: ${progress}% (${elapsed}s elapsed)`);

    await new Promise(r => setTimeout(r, pollInterval));
  }

  throw new Error(`Veo operation timed out after ${maxWaitMs / 1000}s`);
}

async function downloadVideo(videoUrl: string, outputPath: string): Promise<void> {
  const apiKey = getVeoApiKey();
  // Veo video URIs require the API key for download
  const separator = videoUrl.includes('?') ? '&' : '?';
  const urlWithKey = `${videoUrl}${separator}key=${apiKey}`;
  const response = await fetch(urlWithKey, {
    headers: { 'x-goog-api-key': apiKey },
    redirect: 'follow',
  });
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
}

// =============================================================================
// Motion Prompt Templates
// =============================================================================

const MOTION_PROMPTS: Record<string, string> = {
  'before_after_transition': 'Smooth cinematic transition showing the transformation from the before state to the after state, natural camera movement, professional product showcase quality',
  'product_reveal': 'Smooth camera movement revealing the product in action, professional lighting, UGC-style natural footage',
  'problem_to_solution': 'Dynamic transition from frustration to satisfaction, natural UGC filming style, authentic feel',
  'zoom_reveal': 'Camera zooms in smoothly to reveal the result, professional quality, clean composition',
  'swipe_transition': 'Horizontal swipe transition between before and after states, crisp and satisfying, social media ad style',
};

export function getMotionPrompt(style: string, customPrompt?: string): string {
  if (customPrompt) return customPrompt;
  return MOTION_PROMPTS[style] || MOTION_PROMPTS['before_after_transition'];
}

// =============================================================================
// Stage Entry Point
// =============================================================================

export async function runVeoAnimateStage(input: VeoAnimateInput): Promise<VeoAnimateOutput> {
  const { pair, motionPrompt, duration, aspectRatio, outputDir } = input;

  console.log(`\n🎬 Veo 3 Stage: Animating pair ${pair.id}`);
  console.log(`   Duration: ${duration}s | Aspect: ${aspectRatio}`);

  fs.mkdirSync(outputDir, { recursive: true });

  // Verify images exist
  if (!fs.existsSync(pair.beforeImagePath)) {
    throw new Error(`Before image not found: ${pair.beforeImagePath}`);
  }
  if (!fs.existsSync(pair.afterImagePath)) {
    throw new Error(`After image not found: ${pair.afterImagePath}`);
  }

  // Map aspect ratio to Veo format
  const veoAspectMap: Record<string, string> = {
    '9:16': '9:16',
    '16:9': '16:9',
    '1:1': '1:1',
    '4:5': '9:16', // Closest supported
  };

  // Encode before image as base64 for startImage
  const beforeBase64 = fs.readFileSync(pair.beforeImagePath).toString('base64');

  // Build Veo request with bytesBase64Encoded (the format Veo 3.1 accepts)
  // Note: lastFrame/endImage not supported on this model — describe the
  // desired end state in the prompt instead for best results
  const payload: VeoRequestPayload = {
    instances: [{
      prompt: motionPrompt,
      image: { bytesBase64Encoded: beforeBase64, mimeType: 'image/png' },
    }],
    parameters: {
      aspectRatio: veoAspectMap[aspectRatio] || '9:16',
      personGeneration: 'allow_adult',
    },
  };

  // Submit job
  console.log(`   📡 Submitting to Veo 3...`);
  const operationName = await submitVeoJob(payload);
  console.log(`   ✅ Job submitted: ${operationName}`);

  // Save operation info
  const opInfoPath = path.join(outputDir, `${pair.id}_operation.json`);
  fs.writeFileSync(opInfoPath, JSON.stringify({
    operationName,
    pairId: pair.id,
    prompt: motionPrompt,
    duration,
    aspectRatio,
    submittedAt: new Date().toISOString(),
  }, null, 2));

  // Poll for completion
  console.log(`   ⏳ Waiting for video generation...`);
  const result = await pollVeoOperation(operationName);

  // Extract video URL (new format: generateVideoResponse.generatedSamples)
  const videoUrl = result.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri
    || result.response?.videoUri
    || result.response?.videos?.[0]?.uri
    || '';

  if (!videoUrl) {
    console.log(`   ⚠️  No video URL in response. Saving operation result for manual retrieval.`);
    fs.writeFileSync(
      path.join(outputDir, `${pair.id}_result.json`),
      JSON.stringify(result, null, 2)
    );

    return {
      videoPath: '',
      videoUrl: '',
      duration,
      aspectRatio,
      jobId: operationName,
      pairId: pair.id,
    };
  }

  // Download video
  const videoPath = path.join(outputDir, `${pair.id}_animated.mp4`);
  console.log(`   📥 Downloading video...`);
  await downloadVideo(videoUrl, videoPath);

  const stats = fs.statSync(videoPath);
  console.log(`   ✅ Video saved: ${videoPath} (${(stats.size / 1024 / 1024).toFixed(1)}MB)`);

  return {
    videoPath,
    videoUrl,
    duration,
    aspectRatio,
    jobId: operationName,
    pairId: pair.id,
  };
}

/**
 * Batch animate multiple pairs
 */
export async function runVeoAnimateBatch(
  pairs: ImagePair[],
  motionPrompt: string,
  duration: 8 | 16,
  aspectRatio: '9:16' | '16:9' | '1:1',
  outputDir: string
): Promise<VeoAnimateOutput[]> {
  const results: VeoAnimateOutput[] = [];

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    console.log(`\n   [${i + 1}/${pairs.length}] Animating pair: ${pair.id}`);

    try {
      const output = await runVeoAnimateStage({
        pair,
        motionPrompt,
        duration,
        aspectRatio,
        outputDir,
      });
      results.push(output);
    } catch (error: any) {
      console.log(`   ❌ Failed to animate ${pair.id}: ${error.message}`);
    }

    // Rate limit between jobs
    if (i < pairs.length - 1) {
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  return results;
}
