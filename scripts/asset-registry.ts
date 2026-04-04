/**
 * asset-registry.ts
 *
 * Unified inventory of all assets available to the video pipeline:
 *   - HeyGen clips (from Supabase heygen_video_jobs)
 *   - Local media files (Remotion/public/media/)
 *   - Music tracks (music-library.json + Supabase music_tracks)
 *   - Web-sourced top performing content (IG Looter2, TikTok)
 *
 * Usage:
 *   import { buildAssetManifest, fetchTopContent, pickMusic } from './asset-registry';
 */

import fs from 'fs';
import path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HeyGenClip {
  video_id: string;
  label: string;
  script: string;
  video_url: string;
  duration_sec: number;
  created_at: string;
  engine: 'v3' | 'v4' | unknown;
  test_mode: boolean;
}

export interface SourceVideo {
  url: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'local';
  title?: string;
  duration_sec?: number;
  likes?: number;
  views?: number;
  topic?: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  genre: string[];
  energy: number;        // 1-10
  bpm: number;
  path: string;          // relative to Remotion/public/music/
  suitable_for: string[];
  score?: number;        // computed during selection
}

export interface AssetManifest {
  heygen_clips: HeyGenClip[];
  source_videos: SourceVideo[];
  music_tracks: MusicTrack[];
  local_media: string[];
  generated_at: string;
}

// ─── Supabase helpers ─────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

async function sbQuery(table: string, params: string = ''): Promise<any[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return [];
    return (await res.json()) as any[];
  } catch {
    return [];
  }
}

// ─── HeyGen clips ─────────────────────────────────────────────────────────────

export async function fetchHeyGenClips(limit = 20): Promise<HeyGenClip[]> {
  const rows = await sbQuery(
    'heygen_video_jobs',
    `select=video_id,label,script,video_url,duration_sec,created_at,test_mode&status=eq.completed&order=created_at.desc&limit=${limit}`
  );
  return rows.filter(r => r.video_url).map(r => ({
    video_id: r.video_id,
    label: r.label || '',
    script: r.script || '',
    video_url: r.video_url,
    duration_sec: r.duration_sec || 0,
    created_at: r.created_at,
    engine: r.engine || 'v3',
    test_mode: r.test_mode || false,
  }));
}

// ─── Local media ──────────────────────────────────────────────────────────────

export function scanLocalMedia(publicDir?: string): string[] {
  const dir = publicDir || path.resolve(__dirname, '../public/media');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => /\.(mp4|mov|webm|mkv)$/i.test(f))
    .map(f => `media/${f}`);
}

// ─── Music tracks ─────────────────────────────────────────────────────────────

const MUSIC_LIBRARY_PATH = path.resolve(
  __dirname,
  '../../../autonomous-coding-dashboard/harness/music-library.json'
);

export function loadMusicLibrary(): MusicTrack[] {
  try {
    const raw = JSON.parse(fs.readFileSync(MUSIC_LIBRARY_PATH, 'utf-8'));
    const tracks: MusicTrack[] = (raw.tracks || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      genre: Array.isArray(t.genre) ? t.genre : [t.genre],
      energy: t.energy || 5,
      bpm: t.bpm || 120,
      path: t.path || `music/${t.id}.aac`,
      suitable_for: t.suitable_for || [],
    }));
    return tracks;
  } catch {
    return [];
  }
}

/**
 * Score and pick a music track with variability.
 * Returns top 3 scored tracks, then randomly picks one — prevents always using same track.
 */
export function pickMusic(
  contentType: string,
  energyTarget: number = 7,
  seed?: number
): MusicTrack | null {
  const tracks = loadMusicLibrary();
  if (!tracks.length) return null;

  const scored = tracks.map(t => {
    let score = 0;
    // Genre match
    if (t.suitable_for.includes(contentType)) score += 30;
    // Energy fit (closer = higher score)
    score += Math.max(0, 20 - Math.abs(t.energy - energyTarget) * 5);
    // BPM suitability (120-140 BPM ideal for social)
    if (t.bpm >= 100 && t.bpm <= 145) score += 10;
    return { ...t, score };
  }).sort((a, b) => (b.score || 0) - (a.score || 0));

  // Pick randomly from top 3 — variability without sacrificing quality
  const pool = scored.slice(0, 3);
  const rng = seed !== undefined ? seed % pool.length : Math.floor(Math.random() * pool.length);
  return pool[rng] || pool[0];
}

// ─── Web content sourcing ─────────────────────────────────────────────────────

/**
 * Fetch top performing content for a topic from IG/TikTok via available APIs.
 * Returns SourceVideo array sorted by engagement.
 */
export async function fetchTopContent(
  topic: string,
  platform: 'instagram' | 'tiktok' | 'any' = 'any',
  limit = 5
): Promise<SourceVideo[]> {
  const results: SourceVideo[] = [];

  // IG Looter2 via REST API if running (port 3100)
  if (platform === 'instagram' || platform === 'any') {
    try {
      const hashtag = topic.replace(/\s+/g, '').toLowerCase();
      const res = await fetch(
        `http://localhost:3100/api/ig/hashtag?tag=${encodeURIComponent(hashtag)}&limit=${limit}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (res.ok) {
        const data = await res.json() as any;
        const posts = data.posts || data.data || [];
        for (const p of posts.slice(0, limit)) {
          if (p.video_url) {
            results.push({
              url: p.video_url,
              platform: 'instagram',
              title: p.caption?.slice(0, 80),
              likes: p.like_count || p.likes,
              views: p.play_count || p.view_count,
              topic,
            });
          }
        }
      }
    } catch { /* IG service not running, skip */ }
  }

  // If no results found, return empty (caller handles fallback to local/heygen-only)
  return results.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, limit);
}

// ─── Full manifest builder ────────────────────────────────────────────────────

export async function buildAssetManifest(
  topic?: string,
  platform: 'instagram' | 'tiktok' | 'any' = 'any'
): Promise<AssetManifest> {
  const [heygen_clips, source_videos] = await Promise.all([
    fetchHeyGenClips(10),
    topic ? fetchTopContent(topic, platform, 5) : Promise.resolve([]),
  ]);

  return {
    heygen_clips,
    source_videos,
    music_tracks: loadMusicLibrary(),
    local_media: scanLocalMedia(),
    generated_at: new Date().toISOString(),
  };
}
