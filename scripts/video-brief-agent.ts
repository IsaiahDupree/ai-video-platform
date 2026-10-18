#!/usr/bin/env npx tsx
/**
 * video-brief-agent.ts
 *
 * Orchestrates the full video production spec pipeline:
 *
 *   1. Research  — Fetch top performing content + trends (IG, Reddit, TikTok)
 *   2. Format    — Select best format for platform + goal
 *   3. Assets    — Build asset manifest (HeyGen clips, source videos, music)
 *   4. Spec      — Generate ContentBrief with retention events every 3s
 *   5. Validate  — Run validate-brief before saving
 *   6. Save      — Write to data/briefs/<id>.json
 *
 * Usage:
 *   npx tsx scripts/video-brief-agent.ts \
 *     --topic "AI outreach automation" \
 *     --platform tiktok \
 *     --offer "EverReach" \
 *     --duration 30 \
 *     --layout pip-br \
 *     --output data/briefs/generated.json
 *
 * Environment:
 *   HEYGEN_API_KEY, SUPABASE_URL, SUPABASE_KEY, ANTHROPIC_API_KEY (optional — for AI content gen)
 */

import fs from 'fs';
import path from 'path';
import { ContentBrief, VideoFormat } from '../src/types';
import { validateBrief } from './validate-brief';
import { buildAssetManifest, pickMusic, fetchTopContent } from './asset-registry';
import { buildRetentionTimeline } from './retention-planner';

// ─── CLI args ─────────────────────────────────────────────────────────────────

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      args[argv[i].slice(2)] = argv[i + 1] || 'true';
      i++;
    }
  }
  return args;
}

// ─── Platform → format mapping ────────────────────────────────────────────────

const PLATFORM_FORMAT_MAP: Record<string, string> = {
  tiktok:    'ugc_avatar_pip_v1',
  instagram: 'ugc_avatar_pip_v1',
  youtube:   'youtube_shorts_v1',
  linkedin:  'linkedin_framework_v1',
  twitter:   'twitter_hot_take_v1',
  threads:   'threads_opinion_v1',
};

const PLATFORM_ENERGY: Record<string, number> = {
  tiktok: 8, instagram: 7, youtube: 6, linkedin: 5, twitter: 7, threads: 6,
};

// ─── Research: trends + top content ──────────────────────────────────────────

interface ResearchResult {
  trending_hooks: string[];
  pain_points: string[];
  top_videos: Array<{ url: string; likes?: number; views?: number }>;
  trend_summary: string;
}

async function researchTopic(topic: string, platform: string): Promise<ResearchResult> {
  console.log(`\n🔍 Researching "${topic}" on ${platform}...`);

  const results: ResearchResult = {
    trending_hooks: [],
    pain_points: [],
    top_videos: [],
    trend_summary: '',
  };

  // IG top videos for this topic
  try {
    const igVideos = await fetchTopContent(topic, 'instagram', 5);
    results.top_videos.push(...igVideos.map(v => ({ url: v.url, likes: v.likes, views: v.views })));
    console.log(`  IG: ${igVideos.length} videos found`);
  } catch (e) {
    console.log('  IG: not reachable, skipping');
  }

  // Reddit research via MCP (if available via HTTP)
  try {
    const res = await fetch('http://localhost:3100/api/research/reddit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json() as any;
      results.pain_points = (data.pain_points || []).slice(0, 5);
      results.trending_hooks = (data.hooks || []).slice(0, 3);
    }
  } catch { /* Reddit research not available */ }

  // Fallback: generate hooks from topic
  if (!results.trending_hooks.length) {
    results.trending_hooks = generateDefaultHooks(topic);
  }

  results.trend_summary = `Top performing content for "${topic}" — ${results.top_videos.length} source videos found`;
  console.log(`  Research complete: ${results.trending_hooks.length} hooks, ${results.top_videos.length} source videos`);

  return results;
}

function generateDefaultHooks(topic: string): string[] {
  return [
    `Stop doing ${topic} the hard way`,
    `This changed everything about ${topic}`,
    `${topic} in 2026 looks nothing like before`,
    `Nobody tells you this about ${topic}`,
    `I automated ${topic} completely — here's how`,
  ];
}

// ─── Content point generator ──────────────────────────────────────────────────

interface VideoSpec {
  hook_text: string;
  hook_subtext: string;
  content_points: string[];
  cta_text: string;
  cta_subtext: string;
}

function buildVideoSpec(topic: string, offer: string, research: ResearchResult): VideoSpec {
  const hook = research.trending_hooks[0] || `${offer}: ${topic} automated`;

  // Content points — what happens on screen every 3s
  const contentPoints = [
    `Manual ${topic} = 3 hours/day wasted`,
    `${offer} automates the entire pipeline`,
    `Set it up once → runs 24/7`,
    `Real results from real founders`,
    `Free to try — no credit card`,
  ];

  // Merge any pain points from research
  if (research.pain_points.length > 0) {
    contentPoints.splice(0, Math.min(2, research.pain_points.length), ...research.pain_points.slice(0, 2));
  }

  return {
    hook_text: hook,
    hook_subtext: offer,
    content_points: contentPoints,
    cta_text: `Try ${offer} free`,
    cta_subtext: 'Link in bio',
  };
}

// ─── Brief builder ────────────────────────────────────────────────────────────

async function buildBrief(options: {
  topic: string;
  platform: string;
  offer: string;
  duration_sec: number;
  layout: string;
  format_override?: string;
  heygen_avatar_url?: string;  // pre-generated HeyGen URL
  source_video_url?: string;   // specific source video to use
  music_seed?: number;
}): Promise<ContentBrief> {
  const {
    topic,
    platform,
    offer,
    duration_sec,
    layout,
    format_override,
    heygen_avatar_url,
    source_video_url,
    music_seed,
  } = options;

  const formatId = format_override || PLATFORM_FORMAT_MAP[platform] || 'ugc_avatar_pip_v1';

  // 1. Research
  const research = await researchTopic(topic, platform);

  // 2. Asset manifest
  console.log('\n📦 Building asset manifest...');
  const assets = await buildAssetManifest(topic, platform as any);
  console.log(`  HeyGen clips: ${assets.heygen_clips.length}`);
  console.log(`  Source videos: ${assets.source_videos.length}`);
  console.log(`  Music tracks: ${assets.music_tracks.length}`);

  // 3. Select source video (best by views, or provided)
  const resolvedSourceUrl =
    source_video_url ||
    assets.source_videos[0]?.url ||
    // Fallback: use Supabase-stored HeyGen video as background if no web source
    assets.heygen_clips[0]?.video_url ||
    '';

  // 4. HeyGen video source config
  const videoSource = heygen_avatar_url
    ? { type: 'url' as const, url: heygen_avatar_url }
    : {
        type: 'heygen' as const,
        heygen: {
          script: `${research.trending_hooks[0]}. ${options.offer} automates your entire ${topic} pipeline — set it once and let it run.`,
          engine: 'v3' as const,
          test: true,
        },
      };

  // 5. Music — variability via random pick from top 3 scored
  const contentType = platform === 'tiktok' ? 'viral_short' : 'product_demo';
  const energyTarget = PLATFORM_ENERGY[platform] || 7;
  const music = pickMusic(contentType, energyTarget, music_seed);
  console.log(`\n🎵 Music selected: ${music?.title || 'none'} (energy ${music?.energy || '?'})`);

  // 6. Video spec
  const spec = buildVideoSpec(topic, offer, research);
  console.log(`\n📝 Video spec:`);
  console.log(`  Hook: "${spec.hook_text}"`);
  console.log(`  Content points: ${spec.content_points.length}`);

  // 7. Build retention timeline for BriefComposition sections
  //    (used when format is NOT ugc_avatar_pip_v1)
  const retentionSections = buildRetentionTimeline({
    duration_sec,
    hook_text: spec.hook_text,
    content_points: spec.content_points,
    cta_text: spec.cta_text,
    cta_subtext: spec.cta_subtext,
    interval_sec: 3,
    hook_duration_sec: 3,
    cta_duration_sec: 5,
  });

  // 8. For avatar_pip format: collapse all into single avatar_pip section
  //    The AvatarPIPScene renders hook + captions + source + avatar internally
  const isAvatarPip = formatId === 'ugc_avatar_pip_v1';

  const sections = isAvatarPip
    ? [{
        id: 'main',
        type: 'avatar_pip' as const,
        duration_sec,
        start_time_sec: 0,
        content: {
          type: 'avatar_pip' as any,
          source_video_url: resolvedSourceUrl,
          avatar_video_url: heygen_avatar_url || '__HEYGEN_RESOLVED__',
          layout: layout || 'pip-br',
          hook_text: spec.hook_text,
          hook_subtext: spec.hook_subtext,
          show_vignette: true,
        } as any,
      }]
    : retentionSections;

  // 9. Assemble ContentBrief
  const id = `${platform}-${topic.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
  const brief: ContentBrief = {
    id,
    format: formatId as any,
    version: '1.0',
    created_at: new Date().toISOString(),
    settings: {
      resolution: { width: 1080, height: 1920 },
      fps: 30,
      duration_sec,
      aspect_ratio: '9:16',
    },
    style: {
      theme: 'dark',
      primary_color: '#ffffff',
      secondary_color: '#cccccc',
      accent_color: platform === 'tiktok' ? '#fe2c55' : '#6366f1',
      font_heading: 'Montserrat',
      font_body: 'Inter',
      background_type: 'video',
      background_value: '',
    },
    video_source: videoSource,
    sections,
    audio: {
      volume_voice: 1.0,
      volume_music: 0.12,
      ...(music ? { music_path: music.path } : {}),
    },
  };

  return brief;
}

// ─── Format reverse engineer ──────────────────────────────────────────────────

function reverseEngineerFormat(formatId: string): void {
  console.log(`\n🔬 Reverse-engineering format: ${formatId}`);

  // Load format dynamically
  const formatsDir = path.resolve(__dirname, '../formats');
  const formatFile = path.join(formatsDir, `${formatId}.ts`);

  if (!fs.existsSync(formatFile)) {
    console.error(`  Format file not found: ${formatFile}`);
    return;
  }

  const raw = fs.readFileSync(formatFile, 'utf-8');
  console.log('\n  Format definition:');
  console.log('  ' + raw.split('\n').slice(0, 30).join('\n  '));

  // Generate a template brief for this format
  console.log(`\n  → Use this format in a brief with "format": "${formatId}"`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();

  // --analyze flag: reverse-engineer a format
  if (args.analyze) {
    reverseEngineerFormat(args.analyze);
    return;
  }

  const topic    = args.topic    || 'AI outreach automation';
  const platform = args.platform || 'instagram';
  const offer    = args.offer    || 'EverReach';
  const duration = parseInt(args.duration || '30', 10);
  const layout   = args.layout   || 'pip-br';
  const output   = args.output;
  const musicSeed = args.seed ? parseInt(args.seed, 10) : undefined;

  console.log('🎬 Video Brief Agent');
  console.log('====================');
  console.log(`  Topic:    ${topic}`);
  console.log(`  Platform: ${platform}`);
  console.log(`  Offer:    ${offer}`);
  console.log(`  Duration: ${duration}s`);
  console.log(`  Layout:   ${layout}`);

  // Build brief
  const brief = await buildBrief({
    topic,
    platform,
    offer,
    duration_sec: duration,
    layout,
    format_override: args.format,
    heygen_avatar_url: args.avatar_url,
    source_video_url: args.source_url,
    music_seed: musicSeed,
  });

  // Validate
  console.log('\n✅ Validating brief...');
  const validation = validateBrief(brief);
  if (!validation.valid) {
    console.error('❌ Brief validation failed:');
    validation.errors.forEach(e => console.error(`   - ${e}`));
    process.exit(1);
  }
  if (validation.warnings.length) {
    validation.warnings.forEach(w => console.warn(`   ⚠ ${w}`));
  }
  console.log('   Brief is valid!');

  // Save
  const outPath = output || path.resolve(__dirname, `../data/briefs/${brief.id}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(brief, null, 2));

  console.log(`\n💾 Brief saved: ${outPath}`);
  console.log(`\n🚀 Run the render:`);
  console.log(`   HEYGEN_API_KEY=... SUPABASE_URL=... SUPABASE_KEY=... \\`);
  console.log(`   npx tsx scripts/render.ts ${outPath} output/${brief.id}.mp4`);

  return brief;
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
