import { VideoFormat } from './types';

// Twitter Hot Take — contrarian opinion with curiosity gap = maximum reply bait
export const twitter_hot_take_v1: VideoFormat = {
  id: 'twitter_hot_take_v1',
  name: 'Twitter Hot Take',
  description: 'Twitter contrarian hot take (16:9, 35–55s) — curiosity gap + myth bust maximizes replies',
  default_duration_sec: 45,
  aspect_ratio: '16:9',
  resolution: { width: 1280, height: 720 },
  scene_sequence: [
    { type: 'hook',          duration_percent: 11, required: true },
    { type: 'curiosity_gap', duration_percent: 44, required: true },
    { type: 'myth_reality',  duration_percent: 31, required: false },
    { type: 'cta',           duration_percent: 14, required: true },
  ],
  default_style: {
    theme: 'twitter',
    primary_color: '#ffffff',
    secondary_color: '#71767b',
    accent_color: '#1d9bf0',
    font_heading: 'Inter',
    font_body: 'Inter',
    background_type: 'solid',
    background_value: '#000000',
  },
};
