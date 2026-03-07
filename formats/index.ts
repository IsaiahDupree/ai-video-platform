// Format registry
export * from './types';
export { explainer_v1 } from './explainer_v1';
export { listicle_v1 } from './listicle_v1';
export { comparison_v1 } from './comparison_v1';
export { shorts_v1 } from './shorts_v1';
export { devvlog_v1 } from './devvlog_v1';
// YouTube
export { youtube_explainer_v2 } from './youtube_explainer_v2';
export { youtube_shorts_v1 } from './youtube_shorts_v1';
// Instagram
export { instagram_reel_v1 } from './instagram_reel_v1';
export { instagram_feed_v1 } from './instagram_feed_v1';
// TikTok
export { tiktok_v1 } from './tiktok_v1';
// Twitter/X
export { twitter_v1 } from './twitter_v1';
// LinkedIn
export { linkedin_v1 } from './linkedin_v1';
// Facebook
export { facebook_v1 } from './facebook_v1';
// Threads
export { threads_v1 } from './threads_v1';
export { threads_opinion_v1 } from './threads_opinion_v1';
export { threads_curiosity_v1 } from './threads_curiosity_v1';
// TikTok research-backed
export { tiktok_countdown_v1 } from './tiktok_countdown_v1';
export { tiktok_problem_solution_v1 } from './tiktok_problem_solution_v1';
export { tiktok_myth_v1 } from './tiktok_myth_v1';
// Instagram research-backed
export { instagram_ugc_v1 } from './instagram_ugc_v1';
// LinkedIn research-backed
export { linkedin_framework_v1 } from './linkedin_framework_v1';
export { linkedin_myth_v1 } from './linkedin_myth_v1';
// YouTube research-backed
export { youtube_tutorial_v1 } from './youtube_tutorial_v1';
// Twitter research-backed
export { twitter_thread_summary_v1 } from './twitter_thread_summary_v1';
export { twitter_hot_take_v1 } from './twitter_hot_take_v1';
// Facebook research-backed
export { facebook_reel_v1 } from './facebook_reel_v1';

import { VideoFormat } from './types';
import { explainer_v1 } from './explainer_v1';
import { listicle_v1 } from './listicle_v1';
import { comparison_v1 } from './comparison_v1';
import { shorts_v1 } from './shorts_v1';
import { devvlog_v1 } from './devvlog_v1';
import { youtube_explainer_v2 } from './youtube_explainer_v2';
import { youtube_shorts_v1 } from './youtube_shorts_v1';
import { youtube_tutorial_v1 } from './youtube_tutorial_v1';
import { instagram_reel_v1 } from './instagram_reel_v1';
import { instagram_feed_v1 } from './instagram_feed_v1';
import { instagram_ugc_v1 } from './instagram_ugc_v1';
import { tiktok_v1 } from './tiktok_v1';
import { tiktok_countdown_v1 } from './tiktok_countdown_v1';
import { tiktok_problem_solution_v1 } from './tiktok_problem_solution_v1';
import { tiktok_myth_v1 } from './tiktok_myth_v1';
import { twitter_v1 } from './twitter_v1';
import { twitter_thread_summary_v1 } from './twitter_thread_summary_v1';
import { twitter_hot_take_v1 } from './twitter_hot_take_v1';
import { linkedin_v1 } from './linkedin_v1';
import { linkedin_framework_v1 } from './linkedin_framework_v1';
import { linkedin_myth_v1 } from './linkedin_myth_v1';
import { facebook_v1 } from './facebook_v1';
import { facebook_reel_v1 } from './facebook_reel_v1';
import { threads_v1 } from './threads_v1';
import { threads_opinion_v1 } from './threads_opinion_v1';
import { threads_curiosity_v1 } from './threads_curiosity_v1';

export const FORMATS: Record<string, VideoFormat> = {
  // Legacy
  explainer_v1,
  listicle_v1,
  comparison_v1,
  shorts_v1,
  devvlog_v1,
  // YouTube
  youtube_explainer_v2,
  youtube_shorts_v1,
  youtube_tutorial_v1,
  // Instagram
  instagram_reel_v1,
  instagram_feed_v1,
  instagram_ugc_v1,
  // TikTok
  tiktok_v1,
  tiktok_countdown_v1,
  tiktok_problem_solution_v1,
  tiktok_myth_v1,
  // Twitter/X
  twitter_v1,
  twitter_thread_summary_v1,
  twitter_hot_take_v1,
  // LinkedIn
  linkedin_v1,
  linkedin_framework_v1,
  linkedin_myth_v1,
  // Facebook
  facebook_v1,
  facebook_reel_v1,
  // Threads
  threads_v1,
  threads_opinion_v1,
  threads_curiosity_v1,
};

export function getFormat(id: string): VideoFormat {
  const format = FORMATS[id];
  if (!format) {
    throw new Error(`Unknown format: ${id}. Available formats: ${Object.keys(FORMATS).join(', ')}`);
  }
  return format;
}

export function listFormats(): VideoFormat[] {
  return Object.values(FORMATS);
}

export function getFormatIds(): string[] {
  return Object.keys(FORMATS);
}

// Convenience: formats grouped by platform
export const FORMAT_GROUPS = {
  youtube:   ['youtube_explainer_v2', 'youtube_shorts_v1', 'youtube_tutorial_v1'],
  instagram: ['instagram_reel_v1', 'instagram_feed_v1', 'instagram_ugc_v1'],
  tiktok:    ['tiktok_v1', 'tiktok_countdown_v1', 'tiktok_problem_solution_v1', 'tiktok_myth_v1'],
  twitter:   ['twitter_v1', 'twitter_thread_summary_v1', 'twitter_hot_take_v1'],
  linkedin:  ['linkedin_v1', 'linkedin_framework_v1', 'linkedin_myth_v1'],
  facebook:  ['facebook_v1', 'facebook_reel_v1'],
  threads:   ['threads_v1', 'threads_opinion_v1', 'threads_curiosity_v1'],
  legacy:    ['explainer_v1', 'listicle_v1', 'comparison_v1', 'shorts_v1', 'devvlog_v1'],
} as const;

export function getFormatsForPlatform(platform: keyof typeof FORMAT_GROUPS): VideoFormat[] {
  return FORMAT_GROUPS[platform].map(id => FORMATS[id]);
}
