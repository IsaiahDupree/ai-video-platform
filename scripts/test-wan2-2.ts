#!/usr/bin/env tsx
/**
 * Wan2.2 Client Tests
 *
 * Tests the Wan2.2 video generation client
 */

import { Wan22Client, createWan22Client } from '../src/api/wan2-2-client';

const TEST_PROMPTS = [
  {
    name: 'Mountain Landscape',
    prompt: 'A serene mountain landscape with snow-covered peaks and clear blue sky',
    negativeprompt: 'blurry, low quality, distorted',
    duration: 10,
  },
  {
    name: 'Ocean Waves',
    prompt: 'Cinematic view of powerful ocean waves crashing on a rocky beach at sunset',
    negativeprompt: 'blurry, unclear, distorted',
    duration: 8,
  },
  {
    name: 'Aurora Borealis',
    prompt: 'Mesmerizing aurora borealis dancing in the night sky over a frozen landscape',
    negativeprompt: 'dark, blurry, low quality',
    duration: 15,
  },
  {
    name: 'Urban Scene',
    prompt: 'Bustling city street at night with neon signs, traffic, and pedestrians',
    negativeprompt: 'blurry, static, low quality',
    duration: 12,
  },
  {
    name: 'Nature Documentary',
    prompt: 'Wildlife documentary style shot of animals in their natural habitat',
    negativeprompt: 'animated, cartoon, blurry',
    duration: 10,
  },
];

const TEST_SETTINGS = {
  t2v_fast: {
    width: 1280,
    height: 720,
    durationSeconds: 5,
    fps: 24,
    numInferenceSteps: 30,
    guidanceScale: 6.5,
  },
  t2v_balanced: {
    width: 1280,
    height: 720,
    durationSeconds: 10,
    fps: 24,
    numInferenceSteps: 50,
    guidanceScale: 7.5,
  },
  t2v_quality: {
    width: 1280,
    height: 720,
    durationSeconds: 15,
    fps: 24,
    numInferenceSteps: 75,
    guidanceScale: 8.0,
  },
};

interface TestCase {
  name: string;
  description: string;
  run: (client: Wan22Client) => Promise<void>;
}

const tests: TestCase[] = [
  {
    name: 'health-check',
    description: 'Check API health and model status',
    run: async (client: Wan22Client) => {
      console.log('  🔍 Checking API health...');
      const health = await client.healthCheck();
      console.log('    Status:', health.status);
      console.log('    Model:', health.model);
      console.log('    GPU:', health.gpu);
    },
  },
  {
    name: 'list-models',
    description: 'List available Wan2.2 models',
    run: async (client: Wan22Client) => {
      console.log('  📋 Available models:');
      const models = await client.listModels();
      for (const model of models) {
        console.log(`    • ${model.name} (${model.id})`);
        console.log(`      Type: ${model.type}`);
        console.log(`      Max duration: ${model.maxDurationSeconds}s`);
        console.log(`      Quality: ${model.quality}`);
        console.log(`      Est. time: ${model.generationTimeEstimate}`);
      }
    },
  },
  {
    name: 'generate-t2v-fast',
    description: 'Generate video with fast settings (30 steps)',
    run: async (client: Wan22Client) => {
      const testCase = TEST_PROMPTS[0];
      console.log(`  🎬 ${testCase.name}: Fast generation (30 steps)`);

      try {
        const startTime = Date.now();
        const result = await client.generateVideo({
          prompt: testCase.prompt,
          negativeprompt: testCase.negativeprompt,
          settings: TEST_SETTINGS.t2v_fast,
        });
        const duration = (Date.now() - startTime) / 1000;

        console.log(`    ✅ Generated: ${result.resolution} @ ${result.fps}fps`);
        console.log(`    ⏱️  Generation: ${result.generationTime.toFixed(1)}s (total: ${duration.toFixed(1)}s)`);
        console.log(`    📊 Size: ${(result.videoBase64.length / (1024 * 1024)).toFixed(1)}MB`);
      } catch (error) {
        console.log(`    ⚠️  Skipped (API may not be deployed): ${error instanceof Error ? error.message : String(error)}`);
      }
    },
  },
  {
    name: 'generate-t2v-balanced',
    description: 'Generate video with balanced settings (50 steps)',
    run: async (client: Wan22Client) => {
      const testCase = TEST_PROMPTS[1];
      console.log(`  🎬 ${testCase.name}: Balanced generation (50 steps)`);

      try {
        const startTime = Date.now();
        const result = await client.generateVideo({
          prompt: testCase.prompt,
          negativeprompt: testCase.negativeprompt,
          settings: TEST_SETTINGS.t2v_balanced,
        });
        const duration = (Date.now() - startTime) / 1000;

        console.log(`    ✅ Generated: ${result.resolution} @ ${result.fps}fps`);
        console.log(`    ⏱️  Generation: ${result.generationTime.toFixed(1)}s (total: ${duration.toFixed(1)}s)`);
        console.log(`    📊 Size: ${(result.videoBase64.length / (1024 * 1024)).toFixed(1)}MB`);
      } catch (error) {
        console.log(`    ⚠️  Skipped (API may not be deployed): ${error instanceof Error ? error.message : String(error)}`);
      }
    },
  },
  {
    name: 'model-comparison',
    description: 'Compare T2V vs TI2V models',
    run: async (client: Wan22Client) => {
      console.log('  📊 Model comparison:');
      console.log('    T2V-14B: Best quality, slower (120-180s for 10s video)');
      console.log('    TI2V-5B: Good quality with image guidance (60-90s)');
      console.log('    Both: 720p @ 24fps, Apache 2.0 license');
    },
  },
  {
    name: 'settings-guide',
    description: 'Show recommended settings for different use cases',
    run: async (_client: Wan22Client) => {
      console.log('  ⚙️  Recommended settings:');
      console.log('    🚀 Fast (demos, prototypes):');
      console.log('      - 30-35 steps, 5-8 second duration');
      console.log('      - Guidance scale: 6.5-7.0');
      console.log('      - Estimated: 60-90 seconds');
      console.log('    ⚖️  Balanced (social media):');
      console.log('      - 50 steps, 10-15 second duration');
      console.log('      - Guidance scale: 7.5');
      console.log('      - Estimated: 120-180 seconds');
      console.log('    🎬 Quality (professional):');
      console.log('      - 75+ steps, 15-20 second duration');
      console.log('      - Guidance scale: 8.0-8.5');
      console.log('      - Estimated: 200-300+ seconds');
    },
  },
];

async function runTests(client: Wan22Client, filter?: string) {
  const testsToRun = filter
    ? tests.filter(t => t.name.includes(filter) || t.description.includes(filter))
    : tests;

  console.log(`\n🧪 Running ${testsToRun.length} Wan2.2 tests...\n`);

  for (const test of testsToRun) {
    console.log(`📌 ${test.name}: ${test.description}`);
    try {
      await test.run(client);
      console.log();
    } catch (error) {
      console.error(`  ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      console.log();
    }
  }

  console.log('✅ Tests complete!');
}

async function main() {
  const filter = process.argv[2];

  if (!process.env.WAN2_2_API_URL && !process.argv.includes('--skip-api')) {
    console.log('⚠️  WAN2_2_API_URL not set - tests will use local stubs');
    console.log('   To test with actual API: export WAN2_2_API_URL=<your-modal-url>\n');
  }

  try {
    const client = new Wan22Client(
      process.env.WAN2_2_API_URL || 'http://localhost:3000',
      process.env.WAN2_2_API_KEY
    );

    await runTests(client, filter);
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    process.exit(1);
  }
}

main();
