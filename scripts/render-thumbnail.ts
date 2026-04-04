#!/usr/bin/env npx tsx
/**
 * YouTube Thumbnail Render Script
 *
 * Renders a 1280×720 PNG thumbnail from a PodcastClipBrief or YouTubeThumbnailBrief JSON.
 *
 * Usage:
 *   # From a thumbnail brief JSON:
 *   npx tsx scripts/render-thumbnail.ts --brief data/briefs/my-thumbnail.json --output out/thumb.png
 *
 *   # Auto-generate brief from a podcast brief (uses same accent + meta):
 *   npx tsx scripts/render-thumbnail.ts --podcast data/briefs/podcast-market-report-10min.json
 *
 *   # Inline JSON:
 *   npx tsx scripts/render-thumbnail.ts --json '{"title":"Upwork AI Jobs","highlight":"$6.5K","accent":"#00ff88"}'
 */

import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface YouTubeThumbnailBrief {
  title: string;
  subtitle?: string;
  highlight?: string;
  highlight_label?: string;
  podcast_name?: string;
  episode_label?: string;
  speaker_name?: string;
  speaker_title?: string;
  cta_handle?: string;
  accent?: string;
  background_image?: string;
  style?: 'podcast' | 'data' | 'bold';
}

interface PodcastClipBrief {
  podcast_name: string;
  episode_label?: string;
  speaker_name: string;
  speaker_title: string;
  accent?: string;
  cta_handle: string;
}

// ─── CLI ────────────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i].replace(/^--/, '');
    if (args[i + 1] && !args[i + 1].startsWith('--')) {
      opts[key] = args[i + 1];
      i++;
    } else {
      opts[key] = 'true';
    }
  }
  return opts;
}

// ─── Brief generation from podcast brief ────────────────────────────────────────

function thumbnailFromPodcast(podcastBrief: PodcastClipBrief): YouTubeThumbnailBrief {
  // Extract title from podcast name — generate punchy thumbnail copy
  const name = podcastBrief.podcast_name || 'Podcast';
  const label = podcastBrief.episode_label;

  return {
    title: name,
    subtitle: 'The AI automation opportunity hiding in plain sight',
    podcast_name: name,
    episode_label: label,
    speaker_name: podcastBrief.speaker_name,
    speaker_title: podcastBrief.speaker_title,
    cta_handle: podcastBrief.cta_handle,
    accent: podcastBrief.accent || '#00ff88',
    style: 'podcast',
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();

  let brief: YouTubeThumbnailBrief;

  if (opts.json) {
    brief = JSON.parse(opts.json);
  } else if (opts.brief) {
    const p = path.resolve(opts.brief);
    if (!fs.existsSync(p)) throw new Error(`Brief not found: ${p}`);
    brief = JSON.parse(fs.readFileSync(p, 'utf-8'));
  } else if (opts.podcast) {
    const p = path.resolve(opts.podcast);
    if (!fs.existsSync(p)) throw new Error(`Podcast brief not found: ${p}`);
    const podcastBrief: PodcastClipBrief = JSON.parse(fs.readFileSync(p, 'utf-8'));
    brief = thumbnailFromPodcast(podcastBrief);
    console.log('Auto-generated thumbnail brief from podcast brief:');
    console.log(JSON.stringify(brief, null, 2));
  } else {
    console.error('Usage:');
    console.error('  npx tsx scripts/render-thumbnail.ts --brief <path.json> [--output out/thumb.png]');
    console.error('  npx tsx scripts/render-thumbnail.ts --podcast <podcast-brief.json>');
    console.error('  npx tsx scripts/render-thumbnail.ts --json \'{"title":"...",...}\'');
    process.exit(1);
  }

  const format = (opts.format as 'png' | 'jpeg') || 'png';
  const outputPath = opts.output
    ? path.resolve(opts.output)
    : path.resolve(`./output/thumbnail-${Date.now()}.${format}`);

  // Ensure output dir exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  console.log('Bundling project...');
  const bundleLocation = await bundle({
    entryPoint: path.resolve(__dirname, '../src/index.ts'),
    onProgress: (p) => process.stdout.write(`\rBundling: ${p}%`),
  });
  console.log('\nBundle complete.');

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'YouTubeThumbnail',
    inputProps: { brief },
  });

  console.log('Rendering 1280×720 thumbnail...');
  await renderStill({
    composition,
    serveUrl: bundleLocation,
    output: outputPath,
    inputProps: { brief },
    imageFormat: format,
    scale: opts.scale ? parseFloat(opts.scale) : 1,
    ...(format === 'jpeg' ? { jpegQuality: opts.quality ? parseInt(opts.quality) : 95 } : {}),
  });

  const size = (fs.statSync(outputPath).size / 1024).toFixed(1);
  console.log(`Done! Output: ${outputPath} (${size} KB)`);
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
