#!/usr/bin/env tsx
/**
 * Test Script for App Preview Video Generator
 *
 * Tests rendering of app preview videos with device frames and captions.
 * Feature: APP-023 - App Preview Video Generator
 *
 * Usage:
 *   npx tsx scripts/test-app-preview.ts
 *   npx tsx scripts/test-app-preview.ts --config path/to/config.json
 *   npx tsx scripts/test-app-preview.ts --render
 */

import { bundle } from '@remotion/bundler';
import { renderMedia, getCompositions } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import type { AppPreviewConfig } from '../src/types/appPreview';

// Parse command line arguments
const args = process.argv.slice(2);
const configPath = args.includes('--config')
  ? args[args.indexOf('--config') + 1]
  : path.join(__dirname, '../data/appPreviews/example-app-preview.json');
const shouldRender = args.includes('--render');

async function testAppPreview() {
  console.log('='.repeat(60));
  console.log('APP-023: App Preview Video Generator - Test');
  console.log('='.repeat(60));
  console.log();

  // Load config
  console.log('📄 Loading app preview config...');
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Config file not found: ${configPath}`);
    process.exit(1);
  }

  const config: AppPreviewConfig = JSON.parse(
    fs.readFileSync(configPath, 'utf-8')
  );

  console.log(`✅ Loaded config: ${config.title}`);
  console.log(`   ID: ${config.id}`);
  console.log(`   Dimensions: ${config.dimensions?.width}x${config.dimensions?.height}`);
  console.log(`   FPS: ${config.fps || 30}`);
  console.log(`   Device: ${config.device.model} (${config.device.orientation})`);
  console.log(`   Scenes: ${config.scenes.length}`);
  console.log();

  // Validate config
  console.log('🔍 Validating config...');
  const errors: string[] = [];

  if (!config.id) errors.push('Missing config.id');
  if (!config.title) errors.push('Missing config.title');
  if (!config.device) errors.push('Missing config.device');
  if (!config.scenes || config.scenes.length === 0) {
    errors.push('Missing or empty config.scenes');
  }

  // Validate each scene
  config.scenes.forEach((scene, index) => {
    if (!scene.id) errors.push(`Scene ${index}: Missing id`);
    if (!scene.durationInFrames) errors.push(`Scene ${index}: Missing durationInFrames`);
    if (!scene.content) errors.push(`Scene ${index}: Missing content`);
    if (scene.content && !scene.content.src) {
      errors.push(`Scene ${index}: Missing content.src`);
    }
  });

  if (errors.length > 0) {
    console.error('❌ Validation errors:');
    errors.forEach((err) => console.error(`   - ${err}`));
    process.exit(1);
  }

  console.log('✅ Config validation passed');
  console.log();

  // Calculate total duration
  const totalDuration = config.scenes.reduce(
    (acc, scene) => acc + scene.durationInFrames,
    0
  );
  const durationSeconds = totalDuration / (config.fps || 30);

  console.log('📊 Video Stats:');
  console.log(`   Total Duration: ${totalDuration} frames (${durationSeconds.toFixed(2)}s)`);
  console.log(`   Scene Breakdown:`);
  config.scenes.forEach((scene, index) => {
    const sceneDuration = scene.durationInFrames / (config.fps || 30);
    console.log(
      `     ${index + 1}. ${scene.id}: ${scene.durationInFrames} frames (${sceneDuration.toFixed(2)}s)`
    );
    if (scene.captions && scene.captions.length > 0) {
      console.log(`        Captions: ${scene.captions.length}`);
    }
    if (scene.animation && scene.animation.type !== 'none') {
      console.log(`        Animation: ${scene.animation.type}`);
    }
    if (scene.transition && scene.transition.type !== 'none') {
      console.log(`        Transition: ${scene.transition.type}`);
    }
  });
  console.log();

  // Check audio files
  if (config.audio?.music) {
    const musicPath = path.join(__dirname, '../public', config.audio.music);
    if (fs.existsSync(musicPath)) {
      console.log(`✅ Background music found: ${config.audio.music}`);
    } else {
      console.log(`⚠️  Background music not found: ${config.audio.music}`);
    }
  }

  if (config.audio?.voiceover) {
    const voiceoverPath = path.join(__dirname, '../public', config.audio.voiceover);
    if (fs.existsSync(voiceoverPath)) {
      console.log(`✅ Voiceover found: ${config.audio.voiceover}`);
    } else {
      console.log(`⚠️  Voiceover not found: ${config.audio.voiceover}`);
    }
  }
  console.log();

  if (!shouldRender) {
    console.log('ℹ️  Validation complete. Use --render to render the video.');
    console.log();
    return;
  }

  // Render the video
  console.log('🎬 Rendering app preview video...');
  console.log();

  const entryPoint = path.join(__dirname, '../src/Root.tsx');
  const outputDir = path.join(__dirname, '../output/app-previews');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${config.id}.mp4`);

  try {
    // Bundle Remotion
    console.log('📦 Bundling Remotion...');
    const bundleLocation = await bundle({
      entryPoint,
      webpackOverride: (config) => config,
    });
    console.log('✅ Bundle complete');
    console.log();

    // Get composition
    console.log('🔍 Getting composition...');
    const compositions = await getCompositions(bundleLocation, {
      inputProps: { config },
    });

    const composition = compositions.find((c) => c.id === 'ExampleAppPreview');
    if (!composition) {
      console.error('❌ Composition "ExampleAppPreview" not found');
      console.log('Available compositions:', compositions.map((c) => c.id));
      process.exit(1);
    }
    console.log(`✅ Found composition: ${composition.id}`);
    console.log();

    // Render
    console.log('🎥 Rendering video...');
    const startTime = Date.now();

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: { config },
      onProgress: ({ progress, renderedFrames, encodedFrames }) => {
        process.stdout.write(
          `\r   Progress: ${(progress * 100).toFixed(1)}% | ` +
          `Rendered: ${renderedFrames}/${composition.durationInFrames} | ` +
          `Encoded: ${encodedFrames}/${composition.durationInFrames}`
        );
      },
    });

    const renderTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log();
    console.log();
    console.log(`✅ Render complete in ${renderTime}s`);
    console.log(`📁 Output: ${outputPath}`);

    // Get file size
    const stats = fs.statSync(outputPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 File size: ${fileSizeMB} MB`);
    console.log();

    console.log('🎉 Test successful!');
  } catch (error) {
    console.error();
    console.error('❌ Render failed:', error);
    process.exit(1);
  }
}

// Run test
testAppPreview().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
