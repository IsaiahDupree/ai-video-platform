/**
 * resolve-video-source.ts
 *
 * Pre-render step: resolves a ContentBrief's video_source into a stable URL
 * before Remotion renders it. Handles three source types:
 *
 *   heygen — generate avatar video via HeyGen API → upload to Supabase Storage
 *   url    — already a remote URL, validate + pass through
 *   local  — relative path inside Remotion/public/, pass through as-is
 *   none   — no background video
 *
 * Returns the brief with video_source.url populated (heygen/url cases)
 * or video_source.local populated (local case), ready for the render pipeline.
 *
 * Used by render.ts (local) and modal_remotion_render.py (cloud) before bundling.
 */

import { ContentBrief, VideoSource } from '../src/types';

const HEYGEN_API_KEY  = process.env.HEYGEN_API_KEY  || '';
const SUPABASE_URL    = process.env.SUPABASE_URL    || '';
const SUPABASE_KEY    = process.env.SUPABASE_KEY    || '';

const ISAIAH_AVATAR_ID = 'd9af08b6f80349aaa56096443f91d19e';
const ISAIAH_VOICE_ID  = 'e40f41c567924222a60ed3e1d557fc77'; // Isaiahdupree_v2 HeyGen native

// ─── HeyGen helpers ──────────────────────────────────────────────────────────

async function hgPost(path: string, body: object): Promise<any> {
  const res = await fetch(`https://api.heygen.com${path}`, {
    method: 'POST',
    headers: { 'X-API-KEY': HEYGEN_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json() as any;
  if (json.error) throw new Error(`HeyGen ${path}: ${JSON.stringify(json.error)}`);
  return json.data;
}

async function hgGetStatus(videoId: string): Promise<any> {
  const res = await fetch(
    `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
    { headers: { 'X-API-KEY': HEYGEN_API_KEY } },
  );
  const json = await res.json() as any;
  return json.data;
}

async function generateHeyGenVideo(src: NonNullable<VideoSource['heygen']>): Promise<string> {
  const avatar_id   = src.avatar_id  || ISAIAH_AVATAR_ID;
  const voice_id    = src.voice_id   || ISAIAH_VOICE_ID;
  const engine      = src.engine     || 'v3';
  const test        = src.test       ?? false;

  console.log(`  HeyGen: generating ${engine} avatar video (test=${test})...`);

  const character: any = { type: 'avatar', avatar_id, avatar_style: 'normal' };
  if (engine === 'v4') character.engine = 'v4';

  const data = await hgPost('/v2/video/generate', {
    test,
    caption: false,
    dimension: { width: 720, height: 1280 }, // 9:16 portrait
    video_inputs: [{
      character,
      voice: { type: 'text', input_text: src.script, voice_id },
      background: { type: 'color', value: '#1a1a2e' },
    }],
  });

  const videoId = data.video_id;
  console.log(`  HeyGen: video_id=${videoId}, polling...`);

  // Poll until completed (max 5 min)
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const status = await hgGetStatus(videoId);
    console.log(`  HeyGen: status=${status.status} (${i * 5}s)`);
    if (status.status === 'completed') {
      console.log(`  HeyGen: done — duration=${status.duration}s`);
      return status.video_url as string;
    }
    if (status.status === 'failed') {
      throw new Error(`HeyGen video failed: ${JSON.stringify(status.error)}`);
    }
  }
  throw new Error('HeyGen video timed out after 5 minutes');
}

// ─── Supabase Storage upload ──────────────────────────────────────────────────

async function uploadToSupabase(videoUrl: string, filename: string): Promise<string> {
  console.log(`  Supabase: downloading HeyGen video...`);
  const res = await fetch(videoUrl);
  if (!res.ok) throw new Error(`Failed to fetch HeyGen video: ${res.status}`);
  const buffer = await res.arrayBuffer();

  console.log(`  Supabase: uploading as remotion-renders/${filename}...`);
  const uploadRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/remotion-renders/${filename}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'video/mp4',
        'x-upsert': 'true',
      },
      body: buffer,
    },
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Supabase upload failed: ${err}`);
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/remotion-renders/${filename}`;
  console.log(`  Supabase: uploaded → ${publicUrl}`);
  return publicUrl;
}

// ─── Main resolver ────────────────────────────────────────────────────────────

export async function resolveVideoSource(brief: ContentBrief): Promise<ContentBrief> {
  const src = brief.video_source;
  if (!src || src.type === 'none' || src.type === 'local') {
    // nothing to resolve
    return brief;
  }

  if (src.type === 'url') {
    if (!src.url) throw new Error('video_source.type=url but no url provided');
    console.log(`  Video source: remote URL → ${src.url}`);
    return brief;
  }

  if (src.type === 'heygen') {
    if (!src.heygen?.script) throw new Error('video_source.heygen.script is required');
    if (!HEYGEN_API_KEY) throw new Error('HEYGEN_API_KEY env var not set');
    if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('SUPABASE_URL/SUPABASE_KEY env vars not set');

    // Generate the avatar video
    const heygenUrl = await generateHeyGenVideo(src.heygen);

    // Upload to Supabase Storage for a permanent (non-expiring) URL
    const filename = `heygen-${brief.id}-${Date.now()}.mp4`;
    const permanentUrl = await uploadToSupabase(heygenUrl, filename);

    // Inject resolved URL back into the brief
    return {
      ...brief,
      video_source: { ...src, url: permanentUrl },
    };
  }

  throw new Error(`Unknown video_source.type: ${(src as any).type}`);
}
