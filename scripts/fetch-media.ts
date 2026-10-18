#!/usr/bin/env npx tsx
/**
 * Free Media API Fetcher
 * 
 * Fetches stock video, images, GIFs, and sound effects from free APIs
 * for use in VideoStudio video generation.
 * 
 * Supported providers:
 * - Pexels (video + images)
 * - Pixabay (video + images)
 * - NASA (images + video)
 * - Freesound (SFX)
 * - Tenor (GIFs)
 * 
 * Usage:
 *   npx tsx scripts/fetch-media.ts --type video --query "rocket launch" --provider nasa
 *   npx tsx scripts/fetch-media.ts --resolve briefs/my_brief.json
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

// =============================================================================
// Types
// =============================================================================

interface MediaAsset {
  id: string;
  provider: string;
  type: 'video' | 'image' | 'gif' | 'audio';
  source_url: string;
  download_url: string;
  preview_url?: string;
  creator?: string;
  license: string;
  attribution_text: string;
  duration?: number;
  width?: number;
  height?: number;
  tags?: string[];
}

interface SearchResult {
  assets: MediaAsset[];
  total: number;
  provider: string;
}

interface DownloadedAsset extends MediaAsset {
  local_path: string;
  downloaded_at: string;
}

interface BrollSlot {
  queries: string[];
  provider_order?: string[];
  constraints?: {
    orientation?: 'portrait' | 'landscape' | 'any';
    duration_min?: number;
    duration_max?: number;
  };
}

// =============================================================================
// Config
// =============================================================================

const ASSETS_DIR = path.join(process.cwd(), 'public', 'assets');
const CACHE_FILE = path.join(ASSETS_DIR, 'media_cache.json');

const API_KEYS = {
  pexels: process.env.PEXELS_API_KEY || '',
  pixabay: process.env.PIXABAY_API_KEY || '',
  freesound: process.env.FREESOUND_API_KEY || '',
  tenor: process.env.TENOR_API_KEY || '',
  giphy: process.env.GIPHY_API_KEY || '',
};

// =============================================================================
// HTTP Helper
// =============================================================================

function fetchJSON(url: string, headers: Record<string, string> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'VideoStudio/1.0',
        ...headers,
      },
    };

    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(destPath);
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const request = (urlToFetch: string) => {
      const parsed = new URL(urlToFetch);
      const proto = parsed.protocol === 'https:' ? https : http;
      
      proto.get(urlToFetch, {
        headers: { 'User-Agent': 'VideoStudio/1.0' }
      }, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            request(redirectUrl);
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Download failed: ${response.statusCode}`));
          return;
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    };

    request(url);
  });
}

// =============================================================================
// Pexels API
// =============================================================================

async function searchPexelsVideos(query: string, perPage: number = 10): Promise<SearchResult> {
  if (!API_KEYS.pexels) {
    console.log('  ⚠ Pexels API key not set');
    return { assets: [], total: 0, provider: 'pexels' };
  }

  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}`;
  const data = await fetchJSON(url, { Authorization: API_KEYS.pexels });

  const assets: MediaAsset[] = (data.videos || []).map((v: any) => {
    const bestFile = v.video_files?.find((f: any) => f.quality === 'hd') || v.video_files?.[0];
    return {
      id: `pexels_${v.id}`,
      provider: 'pexels',
      type: 'video',
      source_url: v.url,
      download_url: bestFile?.link || '',
      preview_url: v.image,
      creator: v.user?.name || 'Unknown',
      license: 'Pexels License',
      attribution_text: `Video by ${v.user?.name || 'Unknown'} from Pexels`,
      duration: v.duration,
      width: bestFile?.width,
      height: bestFile?.height,
    };
  });

  return { assets, total: data.total_results || 0, provider: 'pexels' };
}

async function searchPexelsImages(query: string, perPage: number = 10): Promise<SearchResult> {
  if (!API_KEYS.pexels) {
    return { assets: [], total: 0, provider: 'pexels' };
  }

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`;
  const data = await fetchJSON(url, { Authorization: API_KEYS.pexels });

  const assets: MediaAsset[] = (data.photos || []).map((p: any) => ({
    id: `pexels_${p.id}`,
    provider: 'pexels',
    type: 'image',
    source_url: p.url,
    download_url: p.src?.large2x || p.src?.large || p.src?.original,
    preview_url: p.src?.medium,
    creator: p.photographer,
    license: 'Pexels License',
    attribution_text: `Photo by ${p.photographer} from Pexels`,
    width: p.width,
    height: p.height,
  }));

  return { assets, total: data.total_results || 0, provider: 'pexels' };
}

// =============================================================================
// Pixabay API
// =============================================================================

async function searchPixabayVideos(query: string, perPage: number = 10): Promise<SearchResult> {
  if (!API_KEYS.pixabay) {
    console.log('  ⚠ Pixabay API key not set');
    return { assets: [], total: 0, provider: 'pixabay' };
  }

  const url = `https://pixabay.com/api/videos/?key=${API_KEYS.pixabay}&q=${encodeURIComponent(query)}&per_page=${perPage}`;
  const data = await fetchJSON(url);

  const assets: MediaAsset[] = (data.hits || []).map((v: any) => {
    const bestVideo = v.videos?.large || v.videos?.medium || v.videos?.small;
    return {
      id: `pixabay_${v.id}`,
      provider: 'pixabay',
      type: 'video',
      source_url: v.pageURL,
      download_url: bestVideo?.url || '',
      preview_url: `https://i.vimeocdn.com/video/${v.picture_id}_640x360.jpg`,
      creator: v.user,
      license: 'Pixabay License',
      attribution_text: `Video by ${v.user} from Pixabay`,
      duration: v.duration,
      width: bestVideo?.width,
      height: bestVideo?.height,
      tags: v.tags?.split(',').map((t: string) => t.trim()),
    };
  });

  return { assets, total: data.totalHits || 0, provider: 'pixabay' };
}

async function searchPixabayImages(query: string, perPage: number = 10): Promise<SearchResult> {
  if (!API_KEYS.pixabay) {
    return { assets: [], total: 0, provider: 'pixabay' };
  }

  const url = `https://pixabay.com/api/?key=${API_KEYS.pixabay}&q=${encodeURIComponent(query)}&per_page=${perPage}&image_type=photo`;
  const data = await fetchJSON(url);

  const assets: MediaAsset[] = (data.hits || []).map((p: any) => ({
    id: `pixabay_${p.id}`,
    provider: 'pixabay',
    type: 'image',
    source_url: p.pageURL,
    download_url: p.largeImageURL,
    preview_url: p.webformatURL,
    creator: p.user,
    license: 'Pixabay License',
    attribution_text: `Image by ${p.user} from Pixabay`,
    width: p.imageWidth,
    height: p.imageHeight,
    tags: p.tags?.split(',').map((t: string) => t.trim()),
  }));

  return { assets, total: data.totalHits || 0, provider: 'pixabay' };
}

// =============================================================================
// NASA API
// =============================================================================

async function searchNASA(query: string, mediaType: 'video' | 'image' = 'video', perPage: number = 10): Promise<SearchResult> {
  const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=${mediaType}&page_size=${perPage}`;
  
  console.log(`  📡 NASA API: ${url}`);
  
  const data = await fetchJSON(url);
  const items = data.collection?.items || [];
  const assets: MediaAsset[] = [];

  console.log(`  📦 NASA returned ${items.length} items`);

  for (const item of items.slice(0, 5)) { // Limit to first 5 to avoid too many manifest fetches
    const itemData = item.data?.[0];
    if (!itemData) continue;

    // Get preview URL from links
    let previewUrl = '';
    if (item.links) {
      const preview = item.links.find((l: any) => l.rel === 'preview' || l.render === 'image');
      previewUrl = preview?.href || '';
    }

    let downloadUrl = '';

    // For videos, we need to fetch the collection manifest to get the actual video URL
    if (mediaType === 'video' && item.href) {
      try {
        console.log(`    Fetching manifest: ${item.href}`);
        const manifest = await fetchJSON(item.href);
        
        // Find the best quality MP4 (NASA uses ~orig, ~large, ~medium, etc.)
        const mp4Files = (manifest || []).filter((m: string) => 
          typeof m === 'string' && m.endsWith('.mp4')
        );
        
        // Prefer medium/mobile versions (orig/large can be 10GB+)
        downloadUrl = mp4Files.find((m: string) => m.includes('~medium')) ||
                      mp4Files.find((m: string) => m.includes('~mobile')) ||
                      mp4Files.find((m: string) => m.includes('~small')) ||
                      mp4Files.find((m: string) => m.includes('~preview')) ||
                      mp4Files[0] || '';
                      
        console.log(`    Found video: ${downloadUrl ? 'yes' : 'no'}`);
      } catch (e) {
        console.log(`    Manifest fetch failed: ${e}`);
        continue;
      }
    } else if (mediaType === 'image') {
      // For images, construct the original URL from preview
      downloadUrl = previewUrl
        .replace('~thumb.jpg', '~orig.jpg')
        .replace('~medium.jpg', '~orig.jpg')
        .replace('~small.jpg', '~orig.jpg');
    }

    if (!downloadUrl) continue;

    assets.push({
      id: `nasa_${itemData.nasa_id.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      provider: 'nasa',
      type: mediaType,
      source_url: `https://images.nasa.gov/details/${encodeURIComponent(itemData.nasa_id)}`,
      download_url: downloadUrl,
      preview_url: previewUrl,
      creator: itemData.photographer || itemData.secondary_creator || 'NASA',
      license: 'Public Domain (NASA)',
      attribution_text: `${itemData.title} - NASA`,
      tags: itemData.keywords,
    });
  }

  return { assets, total: data.collection?.metadata?.total_hits || 0, provider: 'nasa' };
}

// =============================================================================
// Freesound API
// =============================================================================

async function searchFreesound(query: string, perPage: number = 10): Promise<SearchResult> {
  if (!API_KEYS.freesound) {
    console.log('  ⚠ Freesound API key not set');
    return { assets: [], total: 0, provider: 'freesound' };
  }

  const url = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(query)}&page_size=${perPage}&fields=id,name,duration,username,license,previews,url,tags&token=${API_KEYS.freesound}`;
  const data = await fetchJSON(url);

  const assets: MediaAsset[] = (data.results || []).map((s: any) => {
    // Determine if license allows commercial use
    const isCommercialOk = !s.license?.toLowerCase().includes('noncommercial');
    
    return {
      id: `freesound_${s.id}`,
      provider: 'freesound',
      type: 'audio',
      source_url: s.url,
      download_url: s.previews?.['preview-hq-mp3'] || s.previews?.['preview-lq-mp3'] || '',
      creator: s.username,
      license: s.license,
      attribution_text: `"${s.name}" by ${s.username} from Freesound (${s.license})`,
      duration: s.duration,
      tags: s.tags,
    };
  });

  return { assets, total: data.count || 0, provider: 'freesound' };
}

// =============================================================================
// Tenor GIF API
// =============================================================================

async function searchTenor(query: string, limit: number = 10): Promise<SearchResult> {
  if (!API_KEYS.tenor) {
    console.log('  ⚠ Tenor API key not set');
    return { assets: [], total: 0, provider: 'tenor' };
  }

  const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${API_KEYS.tenor}&limit=${limit}`;
  const data = await fetchJSON(url);

  const assets: MediaAsset[] = (data.results || []).map((g: any) => {
    const mp4 = g.media_formats?.mp4 || g.media_formats?.tinymp4;
    const gif = g.media_formats?.gif || g.media_formats?.tinygif;
    
    return {
      id: `tenor_${g.id}`,
      provider: 'tenor',
      type: 'gif',
      source_url: g.url,
      download_url: mp4?.url || gif?.url || '',
      preview_url: g.media_formats?.tinygif?.url,
      creator: 'Tenor',
      license: 'Tenor Terms',
      attribution_text: 'GIF via Tenor',
      width: mp4?.dims?.[0] || gif?.dims?.[0],
      height: mp4?.dims?.[1] || gif?.dims?.[1],
    };
  });

  return { assets, total: assets.length, provider: 'tenor' };
}

// =============================================================================
// GIPHY GIF API
// =============================================================================

async function searchGiphy(query: string, limit: number = 10): Promise<SearchResult> {
  if (!API_KEYS.giphy) {
    console.log('  ⚠ GIPHY API key not set');
    return { assets: [], total: 0, provider: 'giphy' };
  }

  // Use beta endpoint which has higher rate limits
  const url = `https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(query)}&api_key=${API_KEYS.giphy}&limit=${limit}&rating=g`;

  try {
    const data = await fetchJSON(url);

    const assets: MediaAsset[] = (data.data || []).map((g: any) => {
      const images = g.images || {};
      // Prefer mp4, fallback to gif
      const mp4Url = images.mp4?.mp4 || images.original?.mp4;
      const gifUrl = images.original?.url;

      return {
        id: `giphy_${g.id}`,
        provider: 'giphy',
        type: 'gif',
        source_url: g.url,
        download_url: mp4Url || gifUrl || '',
        preview_url: images.preview?.url || images.preview_gif?.url,
        creator: g.username || 'GIPHY',
        license: 'GIPHY License',
        attribution_text: `GIF via GIPHY${g.username ? ` by ${g.username}` : ''}`,
        width: g.images?.original?.width ? parseInt(g.images.original.width) : undefined,
        height: g.images?.original?.height ? parseInt(g.images.original.height) : undefined,
        tags: [g.title],
      };
    });

    return { assets, total: data.pagination?.total_count || assets.length, provider: 'giphy' };
  } catch (err) {
    console.error(`  ✗ GIPHY API error: ${err}`);
    return { assets: [], total: 0, provider: 'giphy' };
  }
}

// =============================================================================
// Unified Search
// =============================================================================

type MediaType = 'video' | 'image' | 'audio' | 'gif';
type Provider = 'pexels' | 'pixabay' | 'nasa' | 'freesound' | 'tenor' | 'giphy';

async function searchMedia(
  query: string,
  type: MediaType,
  providers: Provider[] = ['nasa', 'pexels', 'pixabay'],
  perPage: number = 5
): Promise<MediaAsset[]> {
  const results: MediaAsset[] = [];

  for (const provider of providers) {
    try {
      let searchResult: SearchResult;

      switch (provider) {
        case 'pexels':
          searchResult = type === 'video' 
            ? await searchPexelsVideos(query, perPage)
            : await searchPexelsImages(query, perPage);
          break;
        case 'pixabay':
          searchResult = type === 'video'
            ? await searchPixabayVideos(query, perPage)
            : await searchPixabayImages(query, perPage);
          break;
        case 'nasa':
          searchResult = await searchNASA(query, type === 'video' ? 'video' : 'image', perPage);
          break;
        case 'freesound':
          searchResult = await searchFreesound(query, perPage);
          break;
        case 'tenor':
          searchResult = await searchTenor(query, perPage);
          break;
        case 'giphy':
          searchResult = await searchGiphy(query, perPage);
          break;
        default:
          continue;
      }

      results.push(...searchResult.assets);
      
      if (results.length >= perPage) break;
    } catch (err) {
      console.error(`  ✗ Error searching ${provider}: ${err}`);
    }
  }

  return results;
}

// =============================================================================
// Download & Cache
// =============================================================================

interface MediaCache {
  assets: Record<string, DownloadedAsset>;
}

function loadCache(): MediaCache {
  if (fs.existsSync(CACHE_FILE)) {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  }
  return { assets: {} };
}

function saveCache(cache: MediaCache): void {
  const dir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function downloadAsset(asset: MediaAsset): Promise<DownloadedAsset | null> {
  const cache = loadCache();
  
  // Check cache
  if (cache.assets[asset.id]) {
    const cached = cache.assets[asset.id];
    if (fs.existsSync(cached.local_path)) {
      console.log(`  ✓ Cached: ${asset.id}`);
      return cached;
    }
  }

  if (!asset.download_url) {
    console.log(`  ✗ No download URL for ${asset.id}`);
    return null;
  }

  // Determine file extension
  const urlPath = new URL(asset.download_url).pathname;
  let ext = path.extname(urlPath) || '.mp4';
  if (asset.type === 'image' && !ext.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
    ext = '.jpg';
  } else if (asset.type === 'audio' && !ext.match(/\.(mp3|wav|ogg)$/i)) {
    ext = '.mp3';
  }

  const typeDir = asset.type === 'gif' ? 'gif' : `${asset.type}`;
  const localPath = path.join(ASSETS_DIR, 'broll', typeDir, `${asset.id}${ext}`);

  console.log(`  ⬇ Downloading: ${asset.id}...`);

  try {
    await downloadFile(asset.download_url, localPath);

    const downloaded: DownloadedAsset = {
      ...asset,
      local_path: localPath,
      downloaded_at: new Date().toISOString(),
    };

    cache.assets[asset.id] = downloaded;
    saveCache(cache);

    console.log(`  ✓ Saved: ${localPath}`);
    return downloaded;
  } catch (err) {
    console.error(`  ✗ Download failed: ${err}`);
    return null;
  }
}

// =============================================================================
// Brief Resolver
// =============================================================================

interface BriefSection {
  id: string;
  assets?: {
    broll?: BrollSlot;
  };
}

interface Brief {
  sections: BriefSection[];
}

async function resolveBrief(briefPath: string): Promise<void> {
  console.log(`\n📄 Resolving brief: ${briefPath}`);
  
  const brief: Brief = JSON.parse(fs.readFileSync(briefPath, 'utf-8'));
  const resolvedAssets: Record<string, DownloadedAsset> = {};

  for (const section of brief.sections) {
    if (!section.assets?.broll) continue;

    const broll = section.assets.broll;
    console.log(`\n[${section.id}] Fetching b-roll...`);

    for (const query of broll.queries) {
      console.log(`  🔍 Query: "${query}"`);
      
      const providers = (broll.provider_order || ['nasa', 'pexels', 'pixabay']) as Provider[];
      const assets = await searchMedia(query, 'video', providers, 3);

      if (assets.length === 0) {
        console.log(`  ⚠ No results for "${query}"`);
        continue;
      }

      // Filter by constraints
      let filtered = assets;
      if (broll.constraints) {
        const { duration_min, duration_max, orientation } = broll.constraints;
        
        filtered = assets.filter(a => {
          if (duration_min && a.duration && a.duration < duration_min) return false;
          if (duration_max && a.duration && a.duration > duration_max) return false;
          if (orientation === 'portrait' && a.width && a.height && a.width > a.height) return false;
          if (orientation === 'landscape' && a.width && a.height && a.width < a.height) return false;
          return true;
        });
      }

      // Download first valid result
      for (const asset of filtered) {
        const downloaded = await downloadAsset(asset);
        if (downloaded) {
          resolvedAssets[section.id] = downloaded;
          break;
        }
      }

      if (resolvedAssets[section.id]) break;
    }
  }

  // Write resolved brief
  const resolvedPath = briefPath.replace('.json', '.resolved.json');
  const resolved = {
    ...brief,
    resolved_assets: resolvedAssets,
  };
  fs.writeFileSync(resolvedPath, JSON.stringify(resolved, null, 2));
  console.log(`\n✓ Resolved brief saved: ${resolvedPath}`);

  // Write attribution manifest
  const manifestPath = briefPath.replace('.json', '.attributions.json');
  const attributions = Object.values(resolvedAssets).map(a => ({
    asset_id: a.id,
    provider: a.provider,
    source_url: a.source_url,
    creator: a.creator,
    license: a.license,
    attribution_text: a.attribution_text,
    local_path: a.local_path,
  }));
  fs.writeFileSync(manifestPath, JSON.stringify(attributions, null, 2));
  console.log(`✓ Attribution manifest saved: ${manifestPath}`);
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.length === 0) {
    console.log(`
Free Media Fetcher for VideoStudio

Usage:
  npx tsx scripts/fetch-media.ts --type video --query "rocket launch" [--provider nasa]
  npx tsx scripts/fetch-media.ts --resolve data/briefs/my_brief.json

Options:
  --type      Media type: video, image, audio, gif
  --query     Search query
  --provider  Provider: nasa, pexels, pixabay, freesound, tenor (default: nasa,pexels,pixabay)
  --download  Download the first result
  --resolve   Resolve all b-roll slots in a brief JSON file

Environment Variables:
  PEXELS_API_KEY    - API key for Pexels
  PIXABAY_API_KEY   - API key for Pixabay
  FREESOUND_API_KEY - API key for Freesound
  TENOR_API_KEY     - API key for Tenor
`);
    return;
  }

  // Resolve brief mode
  const resolveIdx = args.indexOf('--resolve');
  if (resolveIdx !== -1) {
    const briefPath = args[resolveIdx + 1];
    if (!briefPath) {
      console.error('Error: --resolve requires a brief path');
      process.exit(1);
    }
    await resolveBrief(briefPath);
    return;
  }

  // Search mode
  const typeIdx = args.indexOf('--type');
  const queryIdx = args.indexOf('--query');
  const providerIdx = args.indexOf('--provider');
  const shouldDownload = args.includes('--download');

  if (queryIdx === -1) {
    console.error('Error: --query is required');
    process.exit(1);
  }

  const type = (args[typeIdx + 1] || 'video') as MediaType;
  const query = args[queryIdx + 1];
  const providersStr = args[providerIdx + 1] || 'nasa,pexels,pixabay';
  const providers = providersStr.split(',') as Provider[];

  console.log(`\n🔍 Searching for "${query}" (${type}) via ${providers.join(', ')}...\n`);

  const assets = await searchMedia(query, type, providers, 5);

  if (assets.length === 0) {
    console.log('No results found.');
    return;
  }

  console.log(`Found ${assets.length} results:\n`);
  
  for (const asset of assets) {
    console.log(`  [${asset.provider}] ${asset.id}`);
    console.log(`    Creator: ${asset.creator}`);
    console.log(`    License: ${asset.license}`);
    if (asset.duration) console.log(`    Duration: ${asset.duration}s`);
    console.log(`    URL: ${asset.source_url}`);
    console.log('');
  }

  if (shouldDownload && assets.length > 0) {
    console.log('Downloading first result...');
    await downloadAsset(assets[0]);
  }
}

main().catch(console.error);
