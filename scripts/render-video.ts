/**
 * VID-008: Video Render CLI
 * Command-line interface for rendering videos from briefs
 */

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';
import type { ContentBrief } from '../src/types/brief';

// Load environment variables
dotenv.config();

export interface RenderOptions {
  briefPath: string;
  outputPath?: string;
  compositionId?: string;
  codec?: 'h264' | 'h265' | 'vp8' | 'vp9' | 'mp3' | 'aac' | 'wav' | 'prores';
  concurrency?: number;
  imageFormat?: 'jpeg' | 'png';
  quality?: number;
  verbose?: boolean;
}

/**
 * Render a video from a content brief
 */
export async function renderVideo(options: RenderOptions): Promise<string> {
  const {
    briefPath,
    compositionId = 'ExampleVideo',
    codec = 'h264',
    concurrency,
    imageFormat = 'jpeg',
    quality = 80,
    verbose = false,
  } = options;

  console.log('\n' + '='.repeat(60));
  console.log('Starting video render process');
  console.log('='.repeat(60) + '\n');

  try {
    // Read and validate brief
    console.log(`Reading brief from: ${briefPath}`);
    const briefContent = await fs.readFile(briefPath, 'utf-8');
    const brief: ContentBrief = JSON.parse(briefContent);

    console.log(`Brief loaded: "${brief.title}"`);
    console.log(`Sections: ${brief.sections.length}`);
    console.log(`Resolution: ${brief.settings.width}x${brief.settings.height}`);
    console.log(`FPS: ${brief.settings.fps}`);

    // Determine output path
    let outputPath = options.outputPath;
    if (!outputPath) {
      const briefName = brief.title.toLowerCase().replace(/\s+/g, '-');
      const extension = getExtensionForCodec(codec);
      outputPath = path.join('output', `${briefName}.${extension}`);
    }

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    console.log(`Output path: ${outputPath}\n`);

    // Step 1: Bundle the Remotion project
    console.log('Step 1/3: Bundling Remotion project...');
    const bundleLocation = await bundle({
      entryPoint: path.resolve(__dirname, '../src/index.ts'),
      webpackOverride: (config) => config,
    });
    console.log('✓ Bundle created\n');

    // Step 2: Select composition
    console.log('Step 2/3: Loading composition...');
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps: {
        brief,
      },
    });
    console.log(`✓ Composition loaded: ${composition.id}`);
    console.log(`  Duration: ${composition.durationInFrames} frames (${(composition.durationInFrames / composition.fps).toFixed(2)}s)`);
    console.log(`  Dimensions: ${composition.width}x${composition.height}`);
    console.log(`  FPS: ${composition.fps}\n`);

    // Step 3: Render video
    console.log('Step 3/3: Rendering video...');
    console.log(`Codec: ${codec}`);
    console.log(`Image format: ${imageFormat}`);
    console.log(`Quality: ${quality}%`);
    if (concurrency) {
      console.log(`Concurrency: ${concurrency}`);
    }
    console.log('');

    const startTime = Date.now();

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec,
      outputLocation: outputPath,
      inputProps: {
        brief,
      },
      concurrency,
      imageFormat,
      jpegQuality: quality,
      onProgress: ({ progress, renderedFrames, encodedFrames, stitchStage }) => {
        if (verbose || renderedFrames % 30 === 0) {
          const percentage = (progress * 100).toFixed(1);
          console.log(
            `Progress: ${percentage}% | Rendered: ${renderedFrames}/${composition.durationInFrames} | ` +
            `Encoded: ${encodedFrames} | Stage: ${stitchStage}`
          );
        }
      },
    });

    const renderTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('✓ Render complete!');
    console.log('='.repeat(60));
    console.log(`Output: ${outputPath}`);
    console.log(`Render time: ${renderTime}s`);
    console.log(`Average FPS: ${(composition.durationInFrames / parseFloat(renderTime)).toFixed(2)}`);
    console.log('='.repeat(60) + '\n');

    return outputPath;
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('✗ Render failed');
    console.error('='.repeat(60));
    console.error(error);
    console.error('='.repeat(60) + '\n');
    throw error;
  }
}

/**
 * Get file extension for codec
 */
function getExtensionForCodec(codec: string): string {
  const extensions: Record<string, string> = {
    h264: 'mp4',
    h265: 'mp4',
    vp8: 'webm',
    vp9: 'webm',
    mp3: 'mp3',
    aac: 'aac',
    wav: 'wav',
    prores: 'mov',
  };
  return extensions[codec] || 'mp4';
}

/**
 * Parse CLI arguments
 */
function parseArgs(args: string[]): RenderOptions {
  const options: RenderOptions = {
    briefPath: args[0],
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--output':
      case '-o':
        options.outputPath = nextArg;
        i++;
        break;
      case '--composition':
      case '-c':
        options.compositionId = nextArg;
        i++;
        break;
      case '--codec':
        options.codec = nextArg as any;
        i++;
        break;
      case '--concurrency':
        options.concurrency = parseInt(nextArg, 10);
        i++;
        break;
      case '--image-format':
        options.imageFormat = nextArg as any;
        i++;
        break;
      case '--quality':
      case '-q':
        options.quality = parseInt(nextArg, 10);
        i++;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
    }
  }

  return options;
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Video Render CLI - Render videos from content briefs

Usage:
  npm run render <brief-path> [options]

Options:
  -o, --output <path>           Output video path (default: output/{brief-name}.mp4)
  -c, --composition <id>        Composition ID (default: ExampleVideo)
  --codec <codec>               Video codec (h264, h265, vp8, vp9, prores) (default: h264)
  --concurrency <number>        Number of concurrent frames to render
  --image-format <format>       Image format for frames (jpeg, png) (default: jpeg)
  -q, --quality <number>        JPEG quality 0-100 (default: 80)
  -v, --verbose                 Verbose progress output

Examples:
  # Render with default settings
  npm run render data/briefs/example-video.json

  # Custom output path
  npm run render data/briefs/example-video.json -o videos/my-video.mp4

  # High quality render
  npm run render data/briefs/example-video.json --codec h265 -q 95

  # Fast render with concurrency
  npm run render data/briefs/example-video.json --concurrency 4 -v
    `);
    process.exit(1);
  }

  const options = parseArgs(args);

  renderVideo(options)
    .then((outputPath) => {
      console.log(`\n✓ Video saved to: ${outputPath}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Render failed:', error.message);
      process.exit(1);
    });
}
